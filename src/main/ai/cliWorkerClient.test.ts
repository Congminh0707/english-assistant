import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createWorkerCliRunner,
  safeCliReason,
  type CliWorkerPort,
  type CliWorkerRequest,
  type CliWorkerResponse,
  type WorkerCliRunner
} from './cliWorkerClient'
import type { CliResult } from './cliRunner'

// Cổng giả thay utilityProcess: ghi lại thông điệp gửi đi, test tự trả lời / giả lập thoát
class FakePort implements CliWorkerPort {
  sent: CliWorkerRequest[] = []
  killed = false
  private onMessage: ((m: CliWorkerResponse) => void) | null = null
  private onExit: ((code: number) => void) | null = null
  postMessage(msg: CliWorkerRequest): void {
    this.sent.push(msg)
  }
  on(event: 'message' | 'exit', listener: (arg: never) => void): this {
    if (event === 'message') this.onMessage = listener as (m: CliWorkerResponse) => void
    else this.onExit = listener as (code: number) => void
    return this
  }
  kill(): boolean {
    this.killed = true
    this.onExit?.(1)
    return true
  }
  reply(msg: CliWorkerResponse): void {
    this.onMessage?.(msg)
  }
  exit(): void {
    this.onExit?.(1)
  }
}

const OPTS = { timeoutMs: 1000 }
const ok = (stdout: string): CliResult => ({ code: 0, stdout, stderr: '' })

let ports: FakePort[]
const setup = (extra: { idleMs?: number } = {}): WorkerCliRunner => {
  ports = []
  return createWorkerCliRunner({
    fork: () => {
      const p = new FakePort()
      ports.push(p)
      return p
    },
    graceMs: 500,
    ...extra
  })
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('safeCliReason', () => {
  it('giữ lý do cố định, thay mọi thứ khác', () => {
    expect(safeCliReason('ai-cli: timeout')).toBe('ai-cli: timeout')
    expect(safeCliReason('ai-cli: stdout too large')).toBe('ai-cli: stdout too large')
    expect(safeCliReason('ai-cli: spawn failed')).toBe('ai-cli: spawn failed')
    expect(safeCliReason('my secret sentence')).toBe('ai-cli: worker failed')
    expect(safeCliReason('ai-cli: Here is the PROMPT text with "quotes"')).toBe(
      'ai-cli: worker failed'
    )
    expect(safeCliReason(undefined)).toBe('ai-cli: worker failed')
  })
})

describe('createWorkerCliRunner', () => {
  it('khởi động worker ở lần gọi đầu, gửi đủ tham số, trả kết quả theo id', async () => {
    const r = setup()
    expect(ports).toHaveLength(0)
    const p = r.run('C:\\x\\claude.exe', ['-p', '--model', 'haiku'], 'user text', OPTS)
    expect(ports).toHaveLength(1)
    const req = ports[0].sent[0]
    expect(req).toEqual({
      id: req.id,
      exe: 'C:\\x\\claude.exe',
      args: ['-p', '--model', 'haiku'],
      stdin: 'user text',
      opts: OPTS
    })
    ports[0].reply({ id: req.id, ok: true, result: ok('{"a":1}') })
    await expect(p).resolves.toEqual(ok('{"a":1}'))
    r.dispose()
  })

  it('các lần gọi đồng thời giải quyết độc lập theo id (trả lời đảo thứ tự), dùng chung một worker', async () => {
    const r = setup()
    const a = r.run('a.exe', [], '', OPTS)
    const b = r.run('b.exe', [], '', OPTS)
    expect(ports).toHaveLength(1)
    const [ra, rb] = ports[0].sent
    expect(ra.id).not.toBe(rb.id)
    ports[0].reply({ id: rb.id, ok: false, message: 'ai-cli: timeout' })
    ports[0].reply({ id: ra.id, ok: true, result: ok('A') })
    ports[0].reply({ id: 999, ok: true, result: ok('lạ') }) // id lạ: bỏ qua
    await expect(a).resolves.toEqual(ok('A'))
    await expect(b).rejects.toThrow('ai-cli: timeout')
    r.dispose()
  })

  it('lỗi từ worker chỉ giữ lý do cố định', async () => {
    const r = setup()
    const p = r.run('a.exe', [], 'secret', OPTS)
    ports[0].reply({ id: ports[0].sent[0].id, ok: false, message: 'stderr: secret sentence' })
    await expect(p).rejects.toThrow(/^ai-cli: worker failed$/)
    r.dispose()
  })

  it('watchdog: worker không trả lời quá timeoutMs + grace → reject, kill, lần sau tạo worker mới', async () => {
    const r = setup()
    const hung = r.run('a.exe', [], '', OPTS)
    const other = r.run('b.exe', [], '', { timeoutMs: 10_000 })
    const hungErr = expect(hung).rejects.toThrow('ai-cli: worker timeout')
    const otherErr = expect(other).rejects.toThrow('ai-cli: worker exited')
    vi.advanceTimersByTime(1499)
    expect(ports[0].killed).toBe(false)
    vi.advanceTimersByTime(1)
    await hungErr
    await otherErr
    expect(ports[0].killed).toBe(true)

    const next = r.run('c.exe', [], '', OPTS)
    expect(ports).toHaveLength(2)
    ports[1].reply({ id: ports[1].sent[0].id, ok: true, result: ok('C') })
    await expect(next).resolves.toEqual(ok('C'))
    r.dispose()
  })

  it('worker chết → mọi lần gọi đang chờ bị reject, lần sau khởi động lại', async () => {
    const r = setup()
    const p = r.run('a.exe', [], '', OPTS)
    ports[0].exit()
    await expect(p).rejects.toThrow('ai-cli: worker exited')
    const q = r.run('a.exe', [], '', OPTS)
    expect(ports).toHaveLength(2)
    ports[1].reply({ id: ports[1].sent[0].id, ok: true, result: ok('x') })
    await expect(q).resolves.toEqual(ok('x'))
    r.dispose()
  })

  it('tắt worker sau thời gian rảnh, không tắt khi còn lần gọi đang chờ', async () => {
    const r = setup({ idleMs: 1000 })
    const p = r.run('a.exe', [], '', { timeoutMs: 60_000 })
    vi.advanceTimersByTime(5000)
    expect(ports[0].killed).toBe(false)
    ports[0].reply({ id: ports[0].sent[0].id, ok: true, result: ok('') })
    await p
    vi.advanceTimersByTime(999)
    expect(ports[0].killed).toBe(false)
    vi.advanceTimersByTime(1)
    expect(ports[0].killed).toBe(true)
    r.dispose()
  })

  it('fork lỗi → reject lý do cố định', async () => {
    const r = createWorkerCliRunner({
      fork: () => {
        throw new Error('boom C:\\secret')
      }
    })
    await expect(r.run('a.exe', [], '', OPTS)).rejects.toThrow(/^ai-cli: worker failed$/)
  })
})
