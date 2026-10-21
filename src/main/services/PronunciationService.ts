import type { PronunciationEvaluation, PronunciationStatus } from '@shared/schemas/stt'
import { STT_MIN_SECONDS, STT_SAMPLE_RATE } from '@shared/speech'
import { AppError } from '../core/AppError'
import type { PhonemeEngine } from '../stt/engine'
import type { ModelManager } from '../translate/ModelManager'
import { ModelInstaller } from './ModelInstaller'

/**
 * Chấm phát âm theo âm vị bằng wav2vec2 (espeak IPA) — tuỳ chọn, người dùng tự chọn tải thêm (~355 MB; ý định dài
 * hạn: có thể thành gói trả phí, nhưng hiện chưa có gì khoá). Dịch vụ lo trạng thái/tải model và gọi engine;
 * việc so khớp âm vị mong đợi với âm nghe được nằm ở shared/phonemes.ts. Không bao giờ ghi âm thanh/văn bản ra log.
 */
export class PronunciationService {
  private readonly installer: ModelInstaller | null
  private readonly engine: PhonemeEngine | null
  private queue: Promise<unknown> = Promise.resolve()

  constructor(deps: {
    /** null = chưa có model để tải */
    models: ModelManager | null
    engine?: PhonemeEngine
    onStatus?: (status: PronunciationStatus) => void
  }) {
    this.engine = deps.engine ?? null
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
