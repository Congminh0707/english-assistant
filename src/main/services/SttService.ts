import { STT_MAX_SAMPLES, STT_MIN_SECONDS, STT_SAMPLE_RATE } from '@shared/speech'
import type { TranslateStatus } from '@shared/schemas/translate'
import type { SttTranscribeResult } from '@shared/schemas/stt'
import { AppError } from '../core/AppError'
import type { SttEngine } from '../stt/engine'
import type { ModelManager } from '../translate/ModelManager'
import { ModelInstaller } from './ModelInstaller'

/**
 * Nhận dạng giọng nói offline (Whisper base.en): trạng thái/tải model (qua ModelInstaller) và chuyển âm thanh ghi
 * từ micro thành chữ kèm mốc thời gian từng từ. Mỗi lần chỉ nhận dạng một đoạn (hàng đợi) để máy yếu không quá tải.
 * Không bao giờ ghi âm thanh hay lời nhận dạng ra log. docs/11-ai-and-speech.md#4
 */
export class SttService {
  private readonly installer: ModelInstaller
  private queue: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly deps: {
      models: ModelManager
      engine: SttEngine
      onStatus?: (status: TranslateStatus) => void
      now?: () => number
    }
  ) {
    this.installer = new ModelInstaller({
      models: deps.models,
      onStatus: deps.onStatus,
      now: deps.now
    })
  }

  status(): TranslateStatus {
    return this.installer.status()
  }

  install(): Promise<TranslateStatus> {
    return this.installer.install()
  }

  cancelInstall(): void {
    this.installer.cancel()
  }

  transcribe(audio: Float32Array): Promise<SttTranscribeResult> {
    if (!this.installer.installed) throw new AppError('STT_NOT_READY', 'errors.sttNotReady')
    if (audio.length > STT_MAX_SAMPLES) throw new AppError('VALIDATION', 'errors.validation')
    // Quá ngắn: không có gì để nhận dạng (tránh Whisper bịa chữ từ tiếng ồn)
    if (audio.length < STT_MIN_SECONDS * STT_SAMPLE_RATE) {
      return Promise.resolve({ text: '', words: [] })
    }
    const run = this.queue.then(() => this.deps.engine.transcribe(audio))
    this.queue = run.catch(() => undefined)
    return run
  }

  dispose(): void {
    this.cancelInstall()
    this.deps.engine.dispose()
  }
}
