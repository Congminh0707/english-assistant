import { utilityProcess, type UtilityProcess } from 'electron'
import { join } from 'node:path'
import { AppError } from '../core/AppError'
import type { TranslationEngine } from './engine'

/** Tắt tiến trình nền (giải phóng ~400 MB RAM) sau thời gian không dùng này */
const IDLE_MS = 5 * 60_000
const REQUEST_TIMEOUT_MS = 60_000

interface Pending {
  resolve: (text: string) => void
  reject: (err: Error) => void
  timer: NodeJS.Timeout
}

/**
 * Engine thật: chạy `translateWorker.js` (src/main/translate/worker.ts) trong utilityProcess, khởi động khi
 * cần và tự tắt khi rảnh. Chỉ dùng trong main (import electron) — phần còn lại của app làm việc qua TranslationEngine.
 */
export class OpusMtEngine implements TranslationEngine {
  private child: UtilityProcess | null = null
  private ready: Promise<void> | null = null
  private nextId = 1
  private readonly pending = new Map<number, Pending>()
  private idleTimer: NodeJS.Timeout | null = null

  constructor(private readonly modelsDir: string) {}

  async translate(text: string): Promise<string> {
    await this.start()
    this.touch()
    const result = await this.request({ type: 'translate', text })
    this.touch()
    return result
  }

  dispose(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = null
    this.child?.kill()
    this.child = null
    this.ready = null
    this.failAll(new Error('engine stopped'))
  }

  private start(): Promise<void> {
    this.ready ??= (async (): Promise<void> => {
      const child = utilityProcess.fork(join(__dirname, 'translateWorker.js'), [], {
        serviceName: 'english-assistant-translate',
        stdio: 'ignore'
      })
      this.child = child
      child.on('message', (msg: { id: number; ok: boolean; text?: string; error?: string }) => {
        const p = this.pending.get(msg.id)
        if (!p) return
        this.pending.delete(msg.id)
        clearTimeout(p.timer)
        if (msg.ok) p.resolve(msg.text ?? '')
        else p.reject(new AppError('TRANSLATE_FAILED', 'errors.translateFailed'))
      })
      child.on('exit', () => {
        if (this.child === child) {
          this.child = null
          this.ready = null
        }
        this.failAll(new AppError('TRANSLATE_FAILED', 'errors.translateFailed'))
      })
      await this.request({ type: 'init', modelsDir: this.modelsDir })
    })()
    this.ready.catch(() => {
      this.ready = null
    })
    return this.ready
  }

  private request(
    payload: { type: 'init'; modelsDir: string } | { type: 'translate'; text: string }
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const child = this.child
      if (!child) return reject(new AppError('TRANSLATE_FAILED', 'errors.translateFailed'))
      const id = this.nextId++
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new AppError('TRANSLATE_FAILED', 'errors.translateFailed'))
      }, REQUEST_TIMEOUT_MS)
      this.pending.set(id, { resolve, reject, timer })
      child.postMessage({ id, ...payload })
    })
  }

  private touch(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => this.dispose(), IDLE_MS)
  }

  private failAll(err: Error): void {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer)
      p.reject(err)
      this.pending.delete(id)
    }
  }
}
