import { join } from 'node:path'
import { WorkerProcess } from '../system/WorkerProcess'
import type { SpeechEngine } from './engine'

/** Tắt tiến trình nền (~300 MB RAM) sau thời gian không dùng này */
const IDLE_MS = 5 * 60_000
/** Câu dài trên máy chậm có thể mất vài chục giây */
const REQUEST_TIMEOUT_MS = 90_000

/** Engine giọng đọc thật: `ttsWorker.js` (src/main/tts/worker.ts) trong utilityProcess */
export class KokoroEngine implements SpeechEngine {
  private readonly worker: WorkerProcess

  constructor(modelsDir: string) {
    this.worker = new WorkerProcess({
      script: join(__dirname, 'ttsWorker.js'),
      name: 'english-assistant-tts',
      initPayload: { modelsDir },
      idleMs: IDLE_MS,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      errorKey: 'errors.ttsFailed'
    })
  }

  async synthesize(text: string, voice: string, speed: number): Promise<Uint8Array> {
    const result = await this.worker.call<Uint8Array>({ type: 'speak', text, voice, speed })
    return new Uint8Array(result)
  }

  dispose(): void {
    this.worker.dispose()
  }
}
