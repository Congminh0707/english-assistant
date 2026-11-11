import type { CliResult, CliRunner, CliRunOptions } from './cliRunner'

// Phía main của aiCliWorker (docs/11 §5): chuyển mọi lần chạy Claude Code CLI (cả `claude -p`, `claude auth status`,
// where.exe) sang tiến trình nền utilityProcess. Lý do: spawn claude.exe từ chính tiến trình main của Electron chặn luồng
// main 0,7–1,4 giây, mà main giữ global mouse hook của mascot (setIgnoreMouseEvents forward) → đơ chuột toàn hệ thống.
// File này không import electron (test bằng Vitest với cổng giả); index.ts truyền hàm fork thật.

/** Phần của Electron UtilityProcess mà client cần (test truyền đối tượng giả) */
export interface CliWorkerPort {
  postMessage(msg: CliWorkerRequest): void
  on(event: 'message', listener: (msg: CliWorkerResponse) => void): unknown
  on(event: 'exit', listener: (code: number) => void): unknown
  kill(): boolean
}

/** main → worker */
export interface CliWorkerRequest {
  id: number
  exe: string
  args: string[]
  stdin: string
  opts: CliRunOptions
}

/** worker → main: lỗi chỉ mang lý do cố định `ai-cli: ...` (không stdout/stderr/prompt) */
export type CliWorkerResponse =
  { id: number; ok: true; result: CliResult } | { id: number; ok: false; message: string }

/** Thông điệp lỗi hợp lệ: đúng dạng lý do cố định của runCli; khác dạng → thay bằng lý do chung */
const FIXED_REASON_RE = /^ai-cli: [a-z0-9 ()-]{1,40}$/

export function safeCliReason(message: unknown): string {
  return typeof message === 'string' && FIXED_REASON_RE.test(message)
    ? message
    : 'ai-cli: worker failed'
}

export interface WorkerCliRunnerOptions {
  /** Tạo tiến trình worker (index.ts: utilityProcess.fork(aiCliWorker.js)) */
  fork: () => CliWorkerPort
  /** Tắt worker sau thời gian rảnh (mặc định 5 phút) */
  idleMs?: number
  /** Thời gian chờ thêm ngoài opts.timeoutMs trước khi coi worker là treo (mặc định 5 giây) */
  graceMs?: number
}

export interface WorkerCliRunner {
  run: CliRunner
  dispose(): void
}

interface Pending {
  resolve: (r: CliResult) => void
  reject: (e: Error) => void
  timer: ReturnType<typeof setTimeout>
}

/**
 * CliRunner chạy qua worker: khởi động worker ở lần gọi đầu, gọi–trả lời theo id (nhiều lần gọi đồng thời độc lập),
 * watchdog `opts.timeoutMs + graceMs` → reject + kill worker (lần gọi sau tạo worker mới), tắt khi rảnh.
 */
export function createWorkerCliRunner(options: WorkerCliRunnerOptions): WorkerCliRunner {
  const idleMs = options.idleMs ?? 5 * 60_000
  const graceMs = options.graceMs ?? 5_000
  const pending = new Map<number, Pending>()
  let child: CliWorkerPort | null = null
  let nextId = 1
  let idleTimer: ReturnType<typeof setTimeout> | null = null

  const failAll = (reason: string): void => {
    for (const [id, p] of pending) {
      clearTimeout(p.timer)
      pending.delete(id)
      p.reject(new Error(reason))
    }
  }

  const stop = (): void => {
    const c = child
    child = null
    if (c) {
      try {
        c.kill()
      } catch {
        // đã thoát
      }
    }
  }

  const armIdle = (): void => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = null
    if (pending.size === 0 && child) idleTimer = setTimeout(stop, idleMs)
  }

  const ensure = (): CliWorkerPort => {
    if (child) return child
    const c = options.fork()
    child = c
    c.on('message', (msg: CliWorkerResponse) => {
      const p = msg && pending.get(msg.id)
      if (!p) return
      pending.delete(msg.id)
      clearTimeout(p.timer)
      if (msg.ok) p.resolve(msg.result)
      else p.reject(new Error(safeCliReason(msg.message)))
      armIdle()
    })
    c.on('exit', () => {
      if (child !== c) return
      child = null
      failAll('ai-cli: worker exited')
      armIdle()
    })
    return c
  }

  const run: CliRunner = (exe, args, stdin, opts) =>
    new Promise<CliResult>((resolve, reject) => {
      let c: CliWorkerPort
      try {
        c = ensure()
      } catch {
        reject(new Error('ai-cli: worker failed'))
        return
      }
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = null
      const id = nextId++
      const timer = setTimeout(() => {
        if (!pending.delete(id)) return
        reject(new Error('ai-cli: worker timeout'))
        // Worker không trả lời → coi là treo: tắt để lần gọi sau tạo tiến trình mới
        if (child === c) {
          stop()
          failAll('ai-cli: worker exited')
        }
        armIdle()
      }, opts.timeoutMs + graceMs)
      pending.set(id, { resolve, reject, timer })
      try {
        c.postMessage({ id, exe, args, stdin, opts })
      } catch {
        pending.delete(id)
        clearTimeout(timer)
        reject(new Error('ai-cli: worker failed'))
        armIdle()
      }
    })

  return {
    run,
    dispose: () => {
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = null
      stop()
      failAll('ai-cli: worker exited')
    }
  }
}
