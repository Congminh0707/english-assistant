import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Chạy Claude Code CLI (và các lệnh phụ: where.exe, taskkill) an toàn cho AI qua gói Claude (docs/11 §5, docs/16):
// không qua shell, env tối thiểu, thư mục làm việc tạm rỗng, giới hạn thời gian và dung lượng đầu ra.
// Không bao giờ ghi log stdin/stdout/stderr hay env — lỗi chỉ mang lý do cố định.

/** Kết quả một lần chạy: mã thoát (null nếu bị tín hiệu dừng), stdout đầy đủ, stderr tối đa 4 KB */
export interface CliResult {
  code: number | null
  stdout: string
  stderr: string
}

export interface CliRunOptions {
  timeoutMs: number
  /** Mặc định 512 KB; vượt → kill + lỗi */
  maxStdoutBytes?: number
  /** Mặc định aiTempDir() */
  cwd?: string
}

/** Runner tiêm được (ClaudeCliClient, ClaudeCliLocator nhận để test bằng runner giả) */
export type CliRunner = (
  exe: string,
  args: string[],
  stdin: string,
  opts: CliRunOptions
) => Promise<CliResult>

const MAX_STDOUT = 512 * 1024
const MAX_STDERR = 4 * 1024

/**
 * Biến môi trường bị xoá trước khi chạy CLI: luôn dùng đăng nhập claude.ai (không lấy key/endpoint/header/model/nhà
 * cung cấp khác từ môi trường), không để Node/Electron bị chèn tham số, không để CLI tưởng đang chạy lồng trong Claude
 * Code. Giữ biến proxy và `CLAUDE_CONFIG_DIR` (nơi lưu đăng nhập).
 */
export const STRIPPED_ENV_KEYS = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_CUSTOM_HEADERS',
  'ANTHROPIC_MODEL',
  'ANTHROPIC_BEDROCK_BASE_URL',
  'CLAUDE_CODE_USE_BEDROCK',
  'CLAUDE_CODE_USE_VERTEX',
  'CLAUDE_CODE_USE_FOUNDRY',
  'CLAUDECODE',
  'NODE_OPTIONS',
  'ELECTRON_RUN_AS_NODE'
] as const

/** Họ biến bị xoá theo mẫu: `ANTHROPIC_DEFAULT_*_MODEL`, `ANTHROPIC_VERTEX_*` */
export const STRIPPED_ENV_PATTERNS: readonly RegExp[] = [
  /^ANTHROPIC_DEFAULT_\w+_MODEL$/,
  /^ANTHROPIC_VERTEX_/
]

/** Bản sao env đã xoá các biến nhạy cảm (không sửa object gốc). Windows: tên biến không phân biệt hoa thường */
export function cliEnv(base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const drop = new Set<string>(STRIPPED_ENV_KEYS.map((k) => k.toUpperCase()))
  const env: NodeJS.ProcessEnv = {}
  for (const [k, v] of Object.entries(base)) {
    const up = k.toUpperCase()
    if (drop.has(up) || STRIPPED_ENV_PATTERNS.some((re) => re.test(up))) continue
    env[k] = v
  }
  return env
}

let tempDir: string | null = null

/**
 * Thư mục làm việc riêng của app cho CLI: `mkdtemp(<temp>/english-assistant-ai-XXXXXX)` tạo một lần mỗi tiến trình
 * (tên ngẫu nhiên, mới tinh nên rỗng — không nạp CLAUDE.md/.claude lạ), không bao giờ xoá đệ quy.
 */
export function aiTempDir(): string {
  if (tempDir === null || !existsSync(tempDir))
    tempDir = mkdtempSync(join(tmpdir(), 'english-assistant-ai-'))
  return tempDir
}

/** Đường dẫn tuyệt đối tới công cụ hệ thống Windows (không tra PATH để tránh bị chiếm tên) */
export function system32(exe: string): string {
  return join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', exe)
}

/**
 * Dừng cả cây tiến trình. Windows: `taskkill /pid <pid> /T /F` TRƯỚC (lúc tiến trình gốc còn sống để taskkill lần ra
 * con cháu), đường dẫn System32, không shell; chỉ khi taskkill lỗi / thoát ≠ 0 mới `kill()` tiến trình gốc. Nơi khác SIGKILL.
 */
function killTree(pid: number | undefined, kill: () => void): void {
  const fallback = (): void => {
    try {
      kill()
    } catch {
      // đã thoát
    }
  }
  if (process.platform !== 'win32' || pid === undefined) {
    fallback()
    return
  }
  try {
    const tk = spawn(system32('taskkill.exe'), ['/pid', String(pid), '/T', '/F'], {
      shell: false,
      windowsHide: true,
      stdio: 'ignore'
    })
    tk.on('error', fallback)
    tk.on('exit', (code) => {
      if (code !== 0) fallback()
    })
  } catch {
    fallback()
  }
}

/** Runner thật: spawn không shell, env tối thiểu, cwd tạm riêng, timeout + giới hạn stdout/stderr */
export const runCli: CliRunner = (exe, args, stdin, opts) =>
  new Promise<CliResult>((resolve, reject) => {
    const maxOut = opts.maxStdoutBytes ?? MAX_STDOUT
    let settled = false
    const out: Buffer[] = []
    let outBytes = 0
    let err: Buffer = Buffer.alloc(0)

    let child: ReturnType<typeof spawn>
    try {
      child = spawn(exe, args, {
        cwd: opts.cwd ?? aiTempDir(),
        env: cliEnv(process.env),
        shell: false,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      })
    } catch {
      reject(new Error('ai-cli: spawn failed'))
      return
    }

    const finish = (fn: () => void): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      fn()
    }
    const abort = (reason: string): void =>
      finish(() => {
        killTree(child.pid, () => child.kill('SIGKILL'))
        reject(new Error(`ai-cli: ${reason}`))
      })

    const timer = setTimeout(() => abort('timeout'), opts.timeoutMs)

    child.on('error', () => finish(() => reject(new Error('ai-cli: spawn failed'))))
    child.stdout?.on('data', (chunk: Buffer) => {
      if (settled) return
      outBytes += chunk.length
      if (outBytes > maxOut) {
        abort('stdout too large')
        return
      }
      out.push(chunk)
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      if (err.length < MAX_STDERR) err = Buffer.concat([err, chunk]).subarray(0, MAX_STDERR)
    })
    child.on('close', (code) =>
      finish(() =>
        resolve({
          code,
          stdout: Buffer.concat(out).toString('utf8'),
          stderr: err.toString('utf8')
        })
      )
    )
    // Tiến trình con chết sớm → EPIPE khi ghi stdin: bỏ qua, kết quả do 'close'/'error' quyết định
    child.stdin?.on('error', () => undefined)
    child.stdin?.end(stdin, 'utf8')
  })
