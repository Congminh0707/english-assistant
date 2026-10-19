import { looksVietnamese } from '@shared/sentences'
import {
  TRANSLATE_MAX_CHARS,
  type TranslateDirection,
  type TranslateResult,
  type TranslateStatus
} from '@shared/schemas/translate'
import { AppError } from '../core/AppError'
import type { TranslationEngine } from '../translate/engine'
import type { ModelManager } from '../translate/ModelManager'
import { ModelInstaller } from './ModelInstaller'

const CACHE_SIZE = 200

/**
 * Dịch câu offline (opus-mt en→vi và vi→en, mỗi chiều một model): trạng thái/tải/xoá model (qua ModelInstaller),
 * tự nhận chiều dịch theo văn bản, dịch qua engine, nhớ kết quả gần đây.
 * Không bao giờ ghi nội dung dịch ra log. docs/11-ai-and-speech.md#2-dịch--tra-từ
 */
export class TranslationService {
  private readonly installers: Record<TranslateDirection, ModelInstaller>
  private readonly cache = new Map<string, string>()

  constructor(
    private readonly deps: {
      models: Record<TranslateDirection, ModelManager>
      engine: TranslationEngine
      /** Gọi mỗi khi trạng thái đổi (đẩy xuống renderer) */
      onStatus?: (direction: TranslateDirection, status: TranslateStatus) => void
      now?: () => number
    }
  ) {
    const make = (direction: TranslateDirection): ModelInstaller =>
      new ModelInstaller({
        models: deps.models[direction],
        onStatus: (status) => deps.onStatus?.(direction, status),
        now: deps.now
      })
    this.installers = { 'en-vi': make('en-vi'), 'vi-en': make('vi-en') }
  }

  status(direction: TranslateDirection): TranslateStatus {
    return this.installers[direction].status()
  }

  /** Tải model (người dùng đã đồng ý). Gọi lại khi đang tải thì dùng chung lần tải đó. */
  install(direction: TranslateDirection): Promise<TranslateStatus> {
    return this.installers[direction].install()
  }

  cancelInstall(direction: TranslateDirection): void {
    this.installers[direction].cancel()
  }

  /** Xoá model đã tải (giải phóng đĩa). Tắt tiến trình nền trước để nó nhả file đang mở. */
  remove(direction: TranslateDirection): TranslateStatus {
    if (this.status(direction).state === 'downloading') return this.status(direction)
    this.deps.engine.dispose()
    this.deps.models[direction].remove()
    for (const key of this.cache.keys()) if (key.startsWith(`${direction}:`)) this.cache.delete(key)
    const status = this.status(direction)
    this.deps.onStatus?.(direction, status)
    return status
  }

  async translate(text: string): Promise<TranslateResult> {
    const input = text.replace(/\s+/g, ' ').trim().slice(0, TRANSLATE_MAX_CHARS)
    if (!input) throw new AppError('VALIDATION', 'errors.validation')
    const direction: TranslateDirection = looksVietnamese(input) ? 'vi-en' : 'en-vi'
    if (!this.deps.models[direction].isInstalled()) {
      throw new AppError('TRANSLATE_NOT_READY', 'errors.translateNotReady')
    }

    const key = `${direction}:${input}`
    const cached = this.cache.get(key)
    if (cached !== undefined) {
      // Dùng gần nhất → đưa xuống cuối Map (LRU)
      this.cache.delete(key)
      this.cache.set(key, cached)
      return { text: cached, engine: 'opus-mt', cached: true, direction }
    }

    const out = await this.deps.engine.translate(input, direction)
    if (!out) throw new AppError('TRANSLATE_FAILED', 'errors.translateFailed')
    this.cache.set(key, out)
    if (this.cache.size > CACHE_SIZE) this.cache.delete(this.cache.keys().next().value as string)
    return { text: out, engine: 'opus-mt', cached: false, direction }
  }

  dispose(): void {
    this.cancelInstall('en-vi')
    this.cancelInstall('vi-en')
    this.deps.engine.dispose()
  }
}
