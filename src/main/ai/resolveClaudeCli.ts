import { statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, isAbsolute, join } from 'node:path'
import type { AiCliState } from '@shared/schemas/ai'
import { runCli, system32, type CliRunner } from './cliRunner'

// Phân giải Claude Code CLI (docs/11 §5): đường dẫn tuyệt đối tới claude.exe/claude + trạng thái đăng nhập, có cache.
// Không nhận .cmd/.bat/.ps1 (sẽ phải chạy qua cmd/powershell = qua shell).

const AUTH_TIMEOUT_MS = 10_000
const CACHE_MS = 10 * 60_000

/** Ứng viên đầu tiên là file thật, đường dẫn tuyệt đối, tên đúng `claude.exe` (Windows) / `claude` (nơi khác) */
export function pickClaudeExe(
  candidates: string[],
  platform: NodeJS.Platform,
  isFile: (path: string) => boolean
): string | null {
  const want = platform === 'win32' ? 'claude.exe' : 'claude'
  const base = platform === 'win32' ? (p: string) => basename(p.replace(/\//g, '\\')) : basename
  for (const raw of candidates) {
    const p = raw.trim()
    if (!p) continue
    // isAbsolute theo nền tảng đích: Windows cần ổ đĩa/UNC, nơi khác cần '/'
    const abs = platform === 'win32' ? /^([a-zA-Z]:\\|\\\\)/.test(p) : isAbsolute(p)
    if (!abs) continue
    const name = platform === 'win32' ? base(p).toLowerCase() : base(p)
    if (name !== want) continue
    if (isFile(p)) return p
  }
  return null
}

/** `claude auth status` (JSON mặc định): chỉ `loggedIn === true` mới tính là đã đăng nhập */
export function parseAuthStatus(stdout: string): boolean {
  try {
    const body = JSON.parse(stdout) as { loggedIn?: unknown }
    return body?.loggedIn === true
  } catch {
    return false
  }
}

export function isFile(path: string): boolean {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

/** Danh sách ứng viên từ `where.exe claude` (Windows, đường dẫn tuyệt đối System32) / `which -a claude` */
export async function findClaudeCandidates(run: CliRunner = runCli): Promise<string[]> {
  const [exe, args] =
    process.platform === 'win32'
      ? [system32('where.exe'), ['claude']]
      : ['/usr/bin/which', ['-a', 'claude']]
  try {
    const res = await run(exe, args, '', { timeoutMs: 5000, maxStdoutBytes: 16 * 1024 })
    if (res.code !== 0) return []
    return res.stdout.split(/\r?\n/).filter(Boolean)
  } catch {
    return []
  }
}

/** Chỗ cài mặc định của bản native Claude Code: ~/.local/bin/claude(.exe) */
export function claudeFallbackCandidates(): string[] {
  return [join(homedir(), '.local', 'bin', process.platform === 'win32' ? 'claude.exe' : 'claude')]
}

/** Trạng thái CLI cho AiService: đọc đồng bộ (peek) + kiểm tra bất đồng bộ có cache (check) */
export interface CliProbe {
  peek(): AiCliState
  exe(): string | null
  check(opts?: { force?: boolean }): Promise<AiCliState>
  invalidate(): void
}

/** Không có CLI (mặc định của container trong test): luôn 'missing', không chạy tiến trình nào */
export const NO_CLI: CliProbe = {
  peek: () => 'missing',
  exe: () => null,
  check: async () => 'missing',
  invalidate: () => undefined
}

/**
 * Dò Claude Code CLI: phân giải exe một lần (làm mới khi force = nút "Kiểm tra lại"), hỏi `claude auth status`
 * (timeout 10 s, cache 10 phút). Gọi đồng thời dùng chung một lần kiểm tra.
 */
export class ClaudeCliLocator implements CliProbe {
  private state: AiCliState = 'unknown'
  private exePath: string | null | undefined
  private checkedAt = 0
  private inflight: Promise<AiCliState> | null = null

  constructor(
    private readonly deps: {
      run: CliRunner
      findCandidates: () => Promise<string[]>
      /** Ứng viên dự phòng khi findCandidates không có gì hợp lệ (index.ts: claudeFallbackCandidates) */
      fallbackCandidates?: () => string[]
      isFile?: (path: string) => boolean
      platform?: NodeJS.Platform
      now: () => number
      ttlMs?: number
    }
  ) {}

  peek(): AiCliState {
    return this.state
  }

  exe(): string | null {
    return this.state === 'ready' ? (this.exePath ?? null) : null
  }

  invalidate(): void {
    this.state = 'unknown'
    this.checkedAt = 0
  }

  check(opts: { force?: boolean } = {}): Promise<AiCliState> {
    const fresh =
      this.state !== 'unknown' && this.deps.now() - this.checkedAt < (this.deps.ttlMs ?? CACHE_MS)
    if (!opts.force && fresh) return Promise.resolve(this.state)
    if (this.inflight) return this.inflight
    this.inflight = this.probe(!!opts.force).finally(() => {
      this.inflight = null
    })
    return this.inflight
  }

  private async probe(force: boolean): Promise<AiCliState> {
    if (force || this.exePath === undefined) {
      const platform = this.deps.platform ?? process.platform
      const check = this.deps.isFile ?? isFile
      // where.exe không cho kết quả hợp lệ → thử chỗ cài mặc định (~/.local/bin), cùng các kiểm tra
      this.exePath =
        pickClaudeExe(await this.deps.findCandidates(), platform, check) ??
        pickClaudeExe(this.deps.fallbackCandidates?.() ?? [], platform, check)
    }
    let state: AiCliState
    if (!this.exePath) state = 'missing'
    else {
      try {
        const res = await this.deps.run(this.exePath, ['auth', 'status'], '', {
          timeoutMs: AUTH_TIMEOUT_MS,
          maxStdoutBytes: 64 * 1024
        })
        state = parseAuthStatus(res.stdout) ? 'ready' : 'loggedOut'
      } catch {
        state = 'error'
      }
    }
    this.state = state
    this.checkedAt = this.deps.now()
    return state
  }
}
