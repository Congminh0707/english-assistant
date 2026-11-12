import { looksVietnamese } from '@shared/sentences'
import {
  TRANSLATE_MAX_CHARS,
  type TranslateCloudProvider,
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

type Engine = TranslateResult['engine']

/**
 * Dịch câu offline bằng opus-mt (mỗi chiều một model). Có mạng thì dịch online trước: Claude → Google → Azure
 * (key người dùng nhập, lưu mã hoá). Quản lý trạng thái/tải/xoá model (qua ModelInstaller),
 * tự nhận chiều dịch theo văn bản, dịch qua engine, nhớ kết quả gần đây (chỉ trong bộ nhớ).
 * NLLB-200 ('high') đã ngừng (docs/decisions.md #65): không bao giờ dịch bằng nó, không tải được; chỉ còn báo
 * dung lượng file cũ trên đĩa và xoá khi người dùng bấm (không bao giờ tự xoá).
 * Không bao giờ ghi nội dung dịch ra log. docs/11-ai-and-speech.md#2-dịch--tra-từ
 */
export class TranslationService {
  private readonly installers: Record<TranslateDirection, ModelInstaller>
  private readonly cache = new Map<string, { text: string; engine: Engine }>()

  constructor(
    private readonly deps: {
      /** opus-mt từng chiều + 'high' = thư mục NLLB-200 cũ (chỉ để báo dung lượng và xoá) */
      models: Record<TranslateModelKey, ModelManager>
      engine: TranslationEngine
      /** Dịch online (Claude), tuỳ chọn: bật trong cài đặt + có key; lỗi thì rơi về model offline */
      online?: {
        enabled: () => boolean
        translate: (text: string, direction: TranslateDirection) => Promise<string>
      }
      /** Dịch online Google/Azure (key người dùng nhập), tuỳ chọn: bật trong cài đặt + có key; lỗi thì rơi xuống offline */
      cloud?: {
        enabled: () => boolean
        available: () => boolean
        translate: (
          text: string,
          direction: TranslateDirection
        ) => Promise<{ text: string; engine: TranslateCloudProvider }>
        /** Lưu key đã mã hoá (không bao giờ trả key về renderer) */
        keys?: {
          canStore: () => boolean
          has: (provider: TranslateCloudProvider) => boolean
          set: (provider: TranslateCloudProvider, key: string, region?: string) => void
          clear: (provider: TranslateCloudProvider) => void
        }
      }
      /** Lưu API key đã mã hoá (không bao giờ trả key về renderer) */
      keys?: {
        canStore: () => boolean
        has: () => boolean
        set: (key: string) => void
        clear: () => void
      }
      /** Gọi mỗi khi trạng thái đổi (đẩy xuống renderer) */
      onStatus?: (model: TranslateModelKey, status: TranslateStatus) => void
      now?: () => number
    }
  ) {
    const make = (model: TranslateDirection): ModelInstaller =>
      new ModelInstaller({
        models: deps.models[model],
        onStatus: (status) => deps.onStatus?.(model, status),
        now: deps.now
      })
    this.installers = { 'en-vi': make('en-vi'), 'vi-en': make('vi-en') }
  }

  status(direction: TranslateModelKey): TranslateStatus {
    if (direction === 'high') return this.retiredStatus()
    return this.installers[direction].status()
  }

  /** NLLB-200 đã ngừng: 'ready' = còn file trên đĩa (kể cả bản tải dở), sizeBytes = dung lượng đang chiếm */
  private retiredStatus(): TranslateStatus {
    const bytes = this.deps.models.high.diskBytes()
    return {
      state: bytes > 0 ? 'ready' : 'not-installed',
      sizeBytes: bytes,
      receivedBytes: 0,
      errorKey: null
    }
  }

  /** Tải model opus-mt (người dùng đã đồng ý). Gọi lại khi đang tải thì dùng chung lần tải đó. */
  install(direction: TranslateDirection): Promise<TranslateStatus> {
    return this.installers[direction].install()
  }

  cancelInstall(direction: TranslateDirection): void {
    this.installers[direction].cancel()
  }

  /** Xoá model đã tải (giải phóng đĩa) — chỉ khi người dùng bấm xoá. */
  remove(direction: TranslateModelKey): TranslateStatus {
    if (direction === 'high') {
      // Tiến trình nền không bao giờ mở file NLLB nữa → không cần tắt nó
      this.deps.models.high.remove()
    } else {
      if (this.status(direction).state === 'downloading') return this.status(direction)
      // Tắt tiến trình nền trước để nó nhả file đang mở; bỏ kết quả opus-mt đã nhớ
      this.deps.engine.dispose()
      this.deps.models[direction].remove()
      for (const key of this.cache.keys()) if (key.startsWith('opus-mt:')) this.cache.delete(key)
    }
    const status = this.status(direction)
    this.deps.onStatus?.(direction, status)
    return status
  }

  onlineStatus(): TranslateOnlineStatus {
    return {
      hasKey: this.deps.keys?.has() ?? false,
      canStore: this.deps.keys?.canStore() ?? false,
      cloud: this.deps.cloud?.available() ?? false,
      cloudKeys: {
        google: this.deps.cloud?.keys?.has('google') ?? false,
        azure: this.deps.cloud?.keys?.has('azure') ?? false
      }
    }
  }

  setCloudKey(
    provider: TranslateCloudProvider,
    key: string,
    region?: string
  ): TranslateOnlineStatus {
    const keys = this.deps.cloud?.keys
    if (!keys?.canStore()) throw new AppError('TRANSLATE_FAILED', 'errors.translateKeyStore')
    keys.set(provider, key, region)
    return this.onlineStatus()
  }

  clearCloudKey(provider: TranslateCloudProvider): TranslateOnlineStatus {
    this.deps.cloud?.keys?.clear(provider)
    for (const k of this.cache.keys()) if (k.startsWith('cloud:')) this.cache.delete(k)
    return this.onlineStatus()
  }

  setOnlineKey(key: string): TranslateOnlineStatus {
    if (!this.deps.keys?.canStore())
      throw new AppError('TRANSLATE_FAILED', 'errors.translateKeyStore')
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

  private cloudReady(): boolean {
    return !!this.deps.cloud?.enabled() && this.deps.cloud.available()
  }

  /** Chiều dịch cho văn bản nếu đã có opus-mt của chiều đó; null nếu chưa (NLLB-200 cũ trên đĩa không tính) */
  private plan(input: string): TranslateDirection | null {
    const direction: TranslateDirection = looksVietnamese(input) ? 'vi-en' : 'en-vi'
    return this.deps.models[direction].isInstalled() ? direction : null
  }

  /** Nạp sẵn model cho văn bản sắp dịch (gọi khi popup mở). Lỗi bị bỏ qua: lần dịch thật sẽ báo. */
  warmup(text: string): void {
    const input = text.replace(/\s+/g, ' ').trim()
    const direction = input && !this.onlineReady() && !this.cloudReady() ? this.plan(input) : null
    if (!direction || !this.deps.engine.warmup) return
    void this.deps.engine.warmup(direction).catch(() => undefined)
  }

  async translate(text: string): Promise<TranslateResult> {
    const input = text.replace(/\s+/g, ' ').trim().slice(0, TRANSLATE_MAX_CHARS)
    if (!input) throw new AppError('VALIDATION', 'errors.validation')
    const direction: TranslateDirection = looksVietnamese(input) ? 'vi-en' : 'en-vi'

    // Dịch online (nếu bật + có key): chuẩn nhất; Claude lỗi → Google/Azure → model offline bên dưới
    const online = this.onlineReady() ? this.deps.online : undefined
    if (online) {
      const key = `claude:${direction}:${input}`
      const cached = this.cache.get(key)
      if (cached !== undefined) return { ...cached, cached: true, direction }
      try {
        const out = await online.translate(input, direction)
        this.remember(key, { text: out, engine: 'claude' })
        return { text: out, engine: 'claude', cached: false, direction }
      } catch {
        // không log nội dung/key; thử tiếp
      }
    }
    const cloud = this.cloudReady() ? this.deps.cloud : undefined
    if (cloud) {
      const key = `cloud:${direction}:${input}`
      const cached = this.cache.get(key)
      if (cached !== undefined) return { ...cached, cached: true, direction }
      try {
        const out = await cloud.translate(input, direction)
        this.remember(key, out)
        return { ...out, cached: false, direction }
      } catch {
        // không log nội dung/key; xuống offline
      }
    }

    if (!this.plan(input)) {
      // Online lỗi (mạng/key/hạn mức) mà chưa có model offline → báo lỗi dịch, không đòi tải model
      throw online || cloud
        ? new AppError('TRANSLATE_FAILED', 'errors.translateFailed')
        : new AppError('TRANSLATE_NOT_READY', 'errors.translateNotReady')
    }
    const engine = 'opus-mt'
    const key = `${engine}:${direction}:${input}`
    const cached = this.cache.get(key)
    if (cached !== undefined) {
      // Dùng gần nhất → đưa xuống cuối Map (LRU)
      this.cache.delete(key)
      this.cache.set(key, cached)
      return { ...cached, cached: true, direction }
    }

    const out = await this.deps.engine.translate(input, direction)
    if (!out) throw new AppError('TRANSLATE_FAILED', 'errors.translateFailed')
    this.remember(key, { text: out, engine })
    return { text: out, engine, cached: false, direction }
  }

  private remember(key: string, value: { text: string; engine: Engine }): void {
    this.cache.set(key, value)
    if (this.cache.size > CACHE_SIZE) this.cache.delete(this.cache.keys().next().value as string)
  }

  dispose(): void {
    this.cancelInstall('en-vi')
    this.cancelInstall('vi-en')
    this.deps.engine.dispose()
  }
}
