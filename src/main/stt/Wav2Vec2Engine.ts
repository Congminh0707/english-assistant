import { join } from 'node:path'
import type { PronunciationEvaluation } from '@shared/schemas/stt'
import { WorkerProcess } from '../system/WorkerProcess'
import type { PhonemeEngine } from './engine'

/** Model ~355 MB + ~1 GB RAM khi chạy: tắt tiến trình nền sau thời gian không dùng này */
const IDLE_MS = 3 * 60_000
const REQUEST_TIMEOUT_MS = 60_000

/** Engine âm vị thật: `phonemeWorker.js` (src/main/stt/phonemeWorker.ts) chạy wav2vec2 int8 trong utilityProcess */
export class Wav2Vec2Engine implements PhonemeEngine {
  private readonly worker: WorkerProcess

  constructor(modelsDir: string) {
    this.worker = new WorkerProcess({
      script: join(__dirname, 'phonemeWorker.js'),
      name: 'english-assistant-phoneme',
      initPayload: { modelsDir },
      idleMs: IDLE_MS,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      errorKey: 'errors.pronFailed'
    })
  }

  evaluate(audio: Float32Array, text: string): Promise<PronunciationEvaluation> {
    return this.worker.call<PronunciationEvaluation>({ type: 'evaluate', audio, text })
  }

  dispose(): void {
    this.worker.dispose()
  }
}
