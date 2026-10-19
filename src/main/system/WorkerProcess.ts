import { utilityProcess, type UtilityProcess } from 'electron'
import { AppError } from '../core/AppError'

interface Pending {
  resolve: (value: unknown) => void
  reject: (err: Error) => void
  timer: NodeJS.Timeout
}

export interface WorkerOptions {
  /** Đường dẫn file JS của worker (đã build) */
  script: string
  /** Tên hiển thị trong Task Manager */
  name: string
  /** Gửi một lần lúc khởi động (vd thư mục model) */
  initPayload: unknown
  /** Tắt tiến trình sau thời gian không dùng này (giải phóng RAM) */
  idleMs: number
  requestTimeoutMs: number
  /** Khoá i18n khi worker lỗi/chết/quá hạn */
  errorKey: string
}

/**
 * Tiến trình nền (utilityProcess) chạy model AI: khởi động khi cần, tự tắt khi rảnh, gọi–trả lời theo id.
 * Giao thức: main → worker `{ id, ...payload }`; worker → main `{ id, ok, result? , error? }`.
 * Chỉ dùng trong main (import electron); phần còn lại của app làm việc qua các interface Engine.
 */
export class WorkerProcess {
  private child: UtilityProcess | null = null
  private ready: Promise<void> | null = null
  private nextId = 1
  private readonly pending = new Map<number, Pending>()
  private idleTimer: NodeJS.Timeout | null = null

  constructor(private readonly opts: WorkerOptions) {}

  async call<T>(payload: Record<string, unknown>): Promise<T> {
    await this.start()
    this.touch()
    const result = await this.request<T>(payload)
    this.touch()
    return result
  }

  dispose(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = null
    this.child?.kill()
    this.child = null
    this.ready = null
    this.failAll()
  }

  private start(): Promise<void> {
    this.ready ??= (async (): Promise<void> => {
      const child = utilityProcess.fork(this.opts.script, [], {
        serviceName: this.opts.name,
        stdio: 'ignore'
      })
      this.child = child
      child.on('message', (msg: { id: number; ok: boolean; result?: unknown; error?: string }) => {
        const p = this.pending.get(msg.id)
        if (!p) return
        this.pending.delete(msg.id)
        clearTimeout(p.timer)
        if (msg.ok) p.resolve(msg.result)
        else p.reject(new AppError('WORKER_FAILED', this.opts.errorKey))
      })
      child.on('exit', () => {
        if (this.child === child) {
          this.child = null
          this.ready = null
        }
        this.failAll()
      })
      await this.request({ type: 'init', payload: this.opts.initPayload })
    })()
    this.ready.catch(() => {
      this.ready = null
    })
    return this.ready
  }

  private request<T>(payload: Record<string, unknown>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const child = this.child
      if (!child) return reject(new AppError('WORKER_FAILED', this.opts.errorKey))
      const id = this.nextId++
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new AppError('WORKER_FAILED', this.opts.errorKey))
      }, this.opts.requestTimeoutMs)
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer })
      child.postMessage({ id, ...payload })
    })
  }

  private touch(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => this.dispose(), this.opts.idleMs)
  }

  private failAll(): void {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer)
      p.reject(new AppError('WORKER_FAILED', this.opts.errorKey))
      this.pending.delete(id)
    }
  }
}
