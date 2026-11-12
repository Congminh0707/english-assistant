import type { PronunciationEvaluation, PronunciationStatus } from '@shared/schemas/stt'
import { STT_MIN_SECONDS, STT_SAMPLE_RATE } from '@shared/speech'
import { AppError } from '../core/AppError'
import type { PhonemeEngine } from '../stt/engine'
import type { ModelManager } from '../translate/ModelManager'
import { ModelInstaller } from './ModelInstaller'

/**
 * Chấm phát âm theo âm vị bằng wav2vec2 (espeak IPA, ~355 MB). Giao diện KHÔNG còn mời tải (docs/decisions.md #65:
 * Whisper chấm theo từ đủ dùng, model âm vị nghe sai giọng Việt); máy đã tải từ bản trước vẫn được chấm như cũ và
 * người dùng có thể bấm xoá. Dịch vụ lo trạng thái/xoá model và gọi engine; việc so khớp âm vị mong đợi với âm nghe
 * được nằm ở shared/phonemes.ts. Không bao giờ ghi âm thanh/văn bản ra log. Không bao giờ tự xoá model.
 */
export class PronunciationService {
  private readonly installer: ModelInstaller | null
  private readonly models: ModelManager | null
  private readonly engine: PhonemeEngine | null
  private queue: Promise<unknown> = Promise.resolve()
  private readonly onStatus?: (status: PronunciationStatus) => void

  constructor(deps: {
    /** null = chưa có model để tải */
    models: ModelManager | null
    engine?: PhonemeEngine
    onStatus?: (status: PronunciationStatus) => void
  }) {
    this.onStatus = deps.onStatus
    this.engine = deps.engine ?? null
    this.models = deps.models
    this.installer = deps.models
      ? new ModelInstaller({
          models: deps.models,
          onStatus: () => deps.onStatus?.(this.status())
        })
      : null
  }

  status(): PronunciationStatus {
    if (!this.installer) {
      return {
        available: false,
        state: 'not-installed',
        sizeBytes: 0,
        receivedBytes: 0,
        errorKey: null
      }
    }
    const s = this.installer.status()
    return {
      available: true,
      state: s.state,
      sizeBytes: s.sizeBytes,
      receivedBytes: s.receivedBytes,
      errorKey: s.errorKey
    }
  }

  /** Chỉ tải được khi model đã được phát hành */
  async install(): Promise<PronunciationStatus> {
    if (this.installer) await this.installer.install()
    return this.status()
  }

  cancel(): void {
    this.installer?.cancel()
  }

  /** Xoá model đã tải (người dùng bấm nút xoá trong Cài đặt). Tắt tiến trình nền trước để nó nhả file đang mở. */
  remove(): PronunciationStatus {
    if (!this.models || this.status().state === 'downloading') return this.status()
    this.engine?.dispose()
    this.models.remove()
    const status = this.status()
    this.onStatus?.(status)
    return status
  }

  /** Âm vị mong đợi của `text` và âm vị nghe được trong `audio` (so khớp ở shared/phonemes.ts) */
  evaluate(audio: Float32Array, text: string): Promise<PronunciationEvaluation> {
    const engine = this.engine
    if (!this.installer?.installed || !engine) {
      throw new AppError('PRON_NOT_READY', 'errors.pronNotReady')
    }
    if (audio.length < STT_MIN_SECONDS * STT_SAMPLE_RATE) {
      return Promise.resolve({ expected: [], heard: [] })
    }
    const run = this.queue.then(() => engine.evaluate(audio, text))
    this.queue = run.catch(() => undefined)
    return run
  }

  dispose(): void {
    this.installer?.cancel()
    this.engine?.dispose()
  }
}
