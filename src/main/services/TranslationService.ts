import { looksVietnamese } from '@shared/sentences'
import {
  TRANSLATE_MAX_CHARS,
  type TranslateResult,
  type TranslateStatus
} from '@shared/schemas/translate'
import { AppError } from '../core/AppError'
import type { TranslationEngine } from '../translate/engine'
import type { ModelManager } from '../translate/ModelManager'

const CACHE_SIZE = 200
/** Báo tiến trình tải tối đa mỗi ngần này ms để không dồn sự kiện */
const PROGRESS_THROTTLE_MS = 250

/**
 * Dịch câu offline (opus-mt en→vi): quản lý trạng thái model (chưa tải / đang tải / sẵn sàng), tải model khi người
 * dùng đồng ý, dịch qua engine, nhớ kết quả gần đây. Không bao giờ ghi nội dung dịch ra log.
 * docs/11-ai-and-speech.md#2-dịch--tra-từ
 */
export class TranslationService {
  private downloading: { received: number } | null = null
  private installPromise: Promise<void> | null = null
  private abort: AbortController | null = null
  private errorKey: string | null = null
  private lastProgressAt = 0
  private readonly cache = new Map<string, string>()

  constructor(
    private readonly deps: {
      models: ModelManager
      engine: TranslationEngine
      /** Gọi mỗi khi trạng thái đổi (đẩy xuống renderer) */
      onStatus?: (status: TranslateStatus) => void
      now?: () => number
    }
  ) {}

  status(): TranslateStatus {
    const { models } = this.deps
    const state = this.downloading
      ? 'downloading'
      : models.isInstalled()
        ? 'ready'
        : this.errorKey
          ? 'error'
          : 'not-installed'
    return {
      state,
      sizeBytes: models.sizeBytes,
      receivedBytes: this.downloading?.received ?? 0,
      errorKey: state === 'error' ? this.errorKey : null
    }
  }

  /** Tải model (người dùng đã đồng ý). Gọi lại khi đang tải thì dùng chung lần tải đó. */
  install(): Promise<TranslateStatus> {
    if (this.deps.models.isInstalled()) return Promise.resolve(this.status())
    this.installPromise ??= this.runInstall().finally(() => {
      this.installPromise = null
    })
    return this.installPromise.then(() => this.status())
  }

  cancelInstall(): void {
    this.abort?.abort()
  }

  async translate(text: string): Promise<TranslateResult> {
    const input = text.replace(/\s+/g, ' ').trim().slice(0, TRANSLATE_MAX_CHARS)
    if (!input) throw new AppError('VALIDATION', 'errors.validation')
    if (looksVietnamese(input))
      throw new AppError('TRANSLATE_UNSUPPORTED', 'errors.translateUnsupported')
    if (!this.deps.models.isInstalled()) {
      throw new AppError('TRANSLATE_NOT_READY', 'errors.translateNotReady')
    }

    const cached = this.cache.get(input)
    if (cached !== undefined) {
      // Dùng gần nhất → đưa xuống cuối Map (LRU)
      this.cache.delete(input)
      this.cache.set(input, cached)
      return { text: cached, engine: 'opus-mt', cached: true }
    }

    const out = await this.deps.engine.translate(input)
    if (!out) throw new AppError('TRANSLATE_FAILED', 'errors.translateFailed')
    this.cache.set(input, out)
    if (this.cache.size > CACHE_SIZE) this.cache.delete(this.cache.keys().next().value as string)
    return { text: out, engine: 'opus-mt', cached: false }
  }

  dispose(): void {
    this.cancelInstall()
    this.deps.engine.dispose()
  }

  private async runInstall(): Promise<void> {
    const { models, onStatus } = this.deps
    this.errorKey = null
    this.abort = new AbortController()
    this.downloading = { received: 0 }
    onStatus?.(this.status())
    try {
      await models.install((received) => {
        if (!this.downloading) return
        this.downloading.received = received
        const now = (this.deps.now ?? Date.now)()
        if (now - this.lastProgressAt >= PROGRESS_THROTTLE_MS || received >= models.sizeBytes) {
          this.lastProgressAt = now
          onStatus?.(this.status())
        }
      }, this.abort.signal)
    } catch (err) {
      const aborted = this.abort.signal.aborted
      this.errorKey = aborted
        ? null
        : err instanceof AppError
          ? err.messageKey
          : 'errors.modelDownload'
      if (!aborted) console.warn('[translate] tải model thất bại:', (err as Error).message)
    } finally {
      this.downloading = null
      this.abort = null
      onStatus?.(this.status())
    }
  }
}
