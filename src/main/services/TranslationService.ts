import { looksVietnamese } from '@shared/sentences'
import {
  TRANSLATE_MAX_CHARS,
  type TranslateDirection,
  type TranslateModelKey,
  type TranslateOnlineStatus,
  type TranslateResult,
  type TranslateStatus
} from '@shared/schemas/translate'
import { AppError } from '../core/AppError'
import type { TranslationEngine } from '../translate/engine'
import type { ModelManager } from '../translate/ModelManager'
import { ModelInstaller } from './ModelInstaller'

const CACHE_SIZE = 200

/**
 * Dịch câu offline: opus-mt (nhanh, mỗi chiều một model) hoặc NLLB-200 'high' (chất lượng cao, một model cho cả hai chiều,
 * được ưu tiên khi đã tải và bật trong cài đặt). Quản lý trạng thái/tải/xoá model (qua ModelInstaller),
 * tự nhận chiều dịch theo văn bản, dịch qua engine, nhớ kết quả gần đây.
 * Không bao giờ ghi nội dung dịch ra log. docs/11-ai-and-speech.md#2-dịch--tra-từ
 */
export class TranslationService {
  private readonly installers: Record<TranslateModelKey, ModelInstaller>
  private readonly cache = new Map<string, string>()

  constructor(
    private readonly deps: {
      models: Record<TranslateModelKey, ModelManager>
      engine: TranslationEngine
      /** Có ưu tiên model chất lượng cao khi đã tải không (cài đặt translate.highQuality) */
      preferHigh?: () => boolean
      /** Dịch online (Claude), tuỳ chọn: bật trong cài đặt + có key; lỗi thì rơi về model offline */
      online?: {
        enabled: () => boolean
        translate: (text: string, direction: TranslateDirection) => Promise<string>
      }
      /** Lưu API key đã mã hoá (không bao giờ trả key về renderer) */
      keys?: { canStore: () => boolean; has: () => boolean; set: (key: string) => void; clear: () => void }
      /** Gọi mỗi khi trạng thái đổi (đẩy xuống renderer) */
      onStatus?: (model: TranslateModelKey, status: TranslateStatus) => void
      now?: () => number
    }
  ) {
    const make = (model: TranslateModelKey): ModelInstaller =>
      new ModelInstaller({
        models: deps.models[model],
        onStatus: (status) => deps.onStatus?.(model, status),
        now: deps.now
      })
    this.installers = { 'en-vi': make('en-vi'), 'vi-en': make('vi-en'), high: make('high') }
  }

  status(direction: TranslateModelKey): TranslateStatus {
    return this.installers[direction].status()
  }

  /** Tải model (người dùng đã đồng ý). Gọi lại khi đang tải thì dùng chung lần tải đó. */
  install(direction: TranslateModelKey): Promise<TranslateStatus> {
    return this.installers[direction].install()
  }

  cancelInstall(direction: TranslateModelKey): void {
    this.installers[direction].cancel()
  }

  /** Xoá model đã tải (giải phóng đĩa). Tắt tiến trình nền trước để nó nhả file đang mở. */
  remove(direction: TranslateModelKey): TranslateStatus {
    if (this.status(direction).state === 'downloading') return this.status(direction)
    this.deps.engine.dispose()
    this.deps.models[direction].remove()
    // Cache theo engine: xoá model nào thì bỏ kết quả của engine đó
    const engine = direction === 'high' ? 'nllb-200' : 'opus-mt'
    for (const key of this.cache.keys()) if (key.startsWith(`${engine}:`)) this.cache.delete(key)
    const status = this.status(direction)
    this.deps.onStatus?.(direction, status)
    return status
  }

  onlineStatus(): TranslateOnlineStatus {
    return {
      hasKey: this.deps.keys?.has() ?? false,
      canStore: this.deps.keys?.canStore() ?? false
    }
  }

  setOnlineKey(key: string): TranslateOnlineStatus {
    if (!this.deps.keys?.canStore()) throw new AppError('TRANSLATE_FAILED', 'errors.translateKeyStore')
    this.deps.keys.set(key)
    return this.onlineStatus()
  }

  clearOnlineKey(): TranslateOnlineStatus {
    this.deps.keys?.clear()
    for (const k of this.cache.keys()) if (k.startsWith('claude:')) this.cache.delete(k)
    return this.onlineStatus()
  }

  private onlineReady(): boolean {
    return !!this.deps.online?.enabled() && (this.deps.keys?.has() ?? false)
  }

  /** Chọn chiều dịch + engine cho văn bản; null nếu chưa có model nào dùng được */
  private plan(input: string): { direction: TranslateDirection; high: boolean } | null {
    const direction: TranslateDirection = looksVietnamese(input) ? 'vi-en' : 'en-vi'
    // Ưu tiên model chất lượng cao nếu đã tải và được bật; không thì dùng opus-mt của chiều đó
    const high = (this.deps.preferHigh?.() ?? true) && this.deps.models.high.isInstalled()
    if (!high && !this.deps.models[direction].isInstalled()) return null
    return { direction, high }
  }

  /** Nạp sẵn model cho văn bản sắp dịch (gọi khi popup mở). Lỗi bị bỏ qua: lần dịch thật sẽ báo. */
  warmup(text: string): void {
    const input = text.replace(/\s+/g, ' ').trim()
    const plan = input && !this.onlineReady() ? this.plan(input) : null
    if (!plan || !this.deps.engine.warmup) return
    void this.deps.engine.warmup(plan.direction, plan.high ? 'high' : 'fast').catch(() => undefined)
  }

  async translate(text: string): Promise<TranslateResult> {
    const input = text.replace(/\s+/g, ' ').trim().slice(0, TRANSLATE_MAX_CHARS)
    if (!input) throw new AppError('VALIDATION', 'errors.validation')
    const direction: TranslateDirection = looksVietnamese(input) ? 'vi-en' : 'en-vi'

    // Dịch online (nếu bật + có key): chuẩn nhất; mọi lỗi → rơi về model offline bên dưới
    const online = this.onlineReady() ? this.deps.online : undefined
    if (online) {
      const key = `claude:${direction}:${input}`
      const cached = this.cache.get(key)
      if (cached !== undefined) return { text: cached, engine: 'claude', cached: true, direction }
      try {
        const out = await online.translate(input, direction)
        this.remember(key, out)
        return { text: out, engine: 'claude', cached: false, direction }
      } catch {
        // không log nội dung/key; xuống offline
      }
    }

    const plan = this.plan(input)
    if (!plan) {
      // Online lỗi (mạng/key/hạn mức) mà chưa có model offline → báo lỗi dịch, không đòi tải model
      throw online
        ? new AppError('TRANSLATE_FAILED', 'errors.translateFailed')
        : new AppError('TRANSLATE_NOT_READY', 'errors.translateNotReady')
    }
    const { high } = plan
    const engine = high ? 'nllb-200' : 'opus-mt'

    const key = `${engine}:${direction}:${input}`
    const cached = this.cache.get(key)
    if (cached !== undefined) {
      // Dùng gần nhất → đưa xuống cuối Map (LRU)
      this.cache.delete(key)
      this.cache.set(key, cached)
      return { text: cached, engine, cached: true, direction }
    }

    const out = await this.deps.engine.translate(input, direction, high ? 'high' : 'fast')
    if (!out) throw new AppError('TRANSLATE_FAILED', 'errors.translateFailed')
    this.remember(key, out)
    return { text: out, engine, cached: false, direction }
  }

  private remember(key: string, value: string): void {
    this.cache.set(key, value)
    if (this.cache.size > CACHE_SIZE) this.cache.delete(this.cache.keys().next().value as string)
  }

  dispose(): void {
    this.cancelInstall('en-vi')
    this.cancelInstall('vi-en')
    this.cancelInstall('high')
    this.deps.engine.dispose()
  }
}
