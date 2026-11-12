import { join } from 'node:path'
import { WorkerProcess } from '../system/WorkerProcess'
import type { TranslateDirection } from '@shared/schemas/translate'
import type { TranslationEngine } from './engine'

/** Tắt tiến trình nền (giải phóng ~400 MB RAM của opus-mt) sau thời gian không dùng này (lần tra tiếp theo không phải nạp lại model ~3 giây) */
const IDLE_MS = 10 * 60_000
/** Đoạn dài (tới TRANSLATE_MAX_CHARS) có thể mất vài chục giây trên máy chậm */
const REQUEST_TIMEOUT_MS = 150_000

/**
 * Engine dịch thật: chạy `translateWorker.js` (src/main/translate/worker.ts) trong utilityProcess.
 * Phần còn lại của app làm việc qua TranslationEngine.
 */
export class OpusMtEngine implements TranslationEngine {
  private readonly worker: WorkerProcess

  constructor(modelsDir: string) {
    this.worker = new WorkerProcess({
      script: join(__dirname, 'translateWorker.js'),
      name: 'english-assistant-translate',
      initPayload: { modelsDir },
      idleMs: IDLE_MS,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      errorKey: 'errors.translateFailed'
    })
  }

  translate(text: string, direction: TranslateDirection): Promise<string> {
    return this.worker.call<string>({ type: 'translate', text, direction })
  }

  async warmup(direction: TranslateDirection): Promise<void> {
    await this.translate('Hello.', direction)
  }

  dispose(): void {
    this.worker.dispose()
  }
}
