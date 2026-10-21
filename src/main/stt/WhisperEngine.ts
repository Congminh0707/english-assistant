import { join } from 'node:path'
import type { SttTranscribeResult } from '@shared/schemas/stt'
import { WorkerProcess } from '../system/WorkerProcess'
import type { SttEngine } from './engine'

/** Tắt tiến trình nền (~300 MB RAM) sau thời gian không dùng này */
const IDLE_MS = 5 * 60_000
/** Ghi âm 30 giây trên máy chậm có thể mất vài chục giây */
const REQUEST_TIMEOUT_MS = 90_000

/** Engine nhận dạng thật: `sttWorker.js` (src/main/stt/worker.ts) chạy Whisper base.en trong utilityProcess */
export class WhisperEngine implements SttEngine {
  private readonly worker: WorkerProcess

  constructor(modelsDir: string) {
    this.worker = new WorkerProcess({
      script: join(__dirname, 'sttWorker.js'),
      name: 'english-assistant-stt',
      initPayload: { modelsDir },
      idleMs: IDLE_MS,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      errorKey: 'errors.sttFailed'
    })
  }

  async transcribe(audio: Float32Array): Promise<SttTranscribeResult> {
    return this.worker.call<SttTranscribeResult>({ type: 'transcribe', audio })
  }

  dispose(): void {
    this.worker.dispose()
  }
}
