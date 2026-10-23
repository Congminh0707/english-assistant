import type { TranslateStatus } from '@shared/schemas/translate'
import { AppError } from '../core/AppError'
/** Thứ ModelInstaller cần từ một gói tải về: model AI (ModelManager) hoặc gói âm thanh (AudioPackManager) */
export interface Installable {
  readonly sizeBytes: number
  isInstalled(): boolean
  /** Gói đã cài nhưng app có bản mới hơn (bản đã cài vẫn dùng được); model AI không có khái niệm này */
  updateAvailable?(): boolean
  /** Tải về; `onProgress` nhận tổng số byte đã có */
  install(onProgress: (receivedBytes: number) => void, signal?: AbortSignal): Promise<void>
}

/** Báo tiến trình tải tối đa mỗi ngần này ms để không dồn sự kiện */
const PROGRESS_THROTTLE_MS = 250

/**
 * Trạng thái + tải model AI cho một tính năng (dịch câu, giọng đọc): chưa tải / đang tải / sẵn sàng / lỗi.
 * Tải khi người dùng đồng ý, có tiến trình, huỷ được; gọi lại khi đang tải thì dùng chung lần tải đó.
 */
export class ModelInstaller {
  private downloading: { received: number } | null = null
  private installPromise: Promise<void> | null = null
  private abort: AbortController | null = null
  private errorKey: string | null = null
  private lastProgressAt = 0

  constructor(
    private readonly deps: {
      models: Installable
      /** Gọi mỗi khi trạng thái đổi (đẩy xuống renderer) */
      onStatus?: (status: TranslateStatus) => void
      now?: () => number
    }
  ) {}

  get installed(): boolean {
    return this.deps.models.isInstalled()
  }

  status(): TranslateStatus {
    const { models } = this.deps
    const state = this.downloading
      ? 'downloading'
      : models.isInstalled()
        ? 'ready'
        : this.errorKey
          ? 'error'
          : 'not-installed'
    const updateAvailable = models.isInstalled() && (models.updateAvailable?.() ?? false)
    return {
      state,
      sizeBytes: models.sizeBytes,
      receivedBytes: this.downloading?.received ?? 0,
      // Lỗi tải bản cập nhật: gói cũ vẫn 'ready' nhưng vẫn báo lỗi để người dùng thử lại
      errorKey: state === 'error' || (state === 'ready' && updateAvailable) ? this.errorKey : null,
      ...(updateAvailable ? { updateAvailable } : {})
    }
  }

  install(): Promise<TranslateStatus> {
    const { models } = this.deps
    // Đã cài và không có bản mới → không tải lại; có bản mới → tải để cập nhật
    if (models.isInstalled() && !(models.updateAvailable?.() ?? false)) {
      return Promise.resolve(this.status())
    }
    this.installPromise ??= this.run().finally(() => {
      this.installPromise = null
    })
    return this.installPromise.then(() => this.status())
  }

  cancel(): void {
    this.abort?.abort()
  }

  private async run(): Promise<void> {
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
      if (!aborted) console.warn('[models] tải model thất bại:', (err as Error).message)
    } finally {
      this.downloading = null
      this.abort = null
      onStatus?.(this.status())
    }
  }
}
