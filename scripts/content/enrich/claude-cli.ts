// Gọi Claude qua Claude Code CLI (`claude -p`) — dùng phiên đăng nhập Claude (gói Pro/Max) của người dùng
// thay vì API key. Mỗi lô là một lần chạy không tương tác, không công cụ, không lưu phiên.
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'

export interface CliOptions {
  bin: string
  model: string
  effort: string
  timeoutMs: number
}

export type CliOutcome =
  | { ok: true; output: unknown; model: string; inputTokens: number; outputTokens: number }
  | { ok: false; fatal: boolean; message: string }

/** Một phần JSON mà `claude -p --output-format json` in ra */
interface CliResultJson {
  type?: string
  is_error?: boolean
  api_error_status?: number | null
  result?: string
  structured_output?: unknown
  usage?: { input_tokens?: number; output_tokens?: number }
  modelUsage?: Record<string, unknown>
}

const AUTH_HINT =
  'Claude CLI chưa đăng nhập hoặc phiên đã hết hạn — mở terminal, chạy `claude` rồi gõ /login, sau đó chạy lại.'

/** Lấy JSON từ văn bản model trả về: bỏ rào ```json và chữ thừa quanh object/array; không được thì undefined */
export function parseJsonLoose(text: string): unknown {
  const body = text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '').trim()
  for (const candidate of [body, body.slice(body.indexOf('{'), body.lastIndexOf('}') + 1)]) {
    try {
      return JSON.parse(candidate)
    } catch {
      // thử cách tiếp theo
    }
  }
  return undefined
}

/** Chạy một yêu cầu qua Claude CLI với structured output theo JSON Schema */
export function runClaudeCli(
  opts: CliOptions,
  system: string,
  schema: object,
  userMessage: string
): Promise<CliOutcome> {
  // CLI mới kiểm tra schema và không nhận khoá `$schema` (draft 2020-12) → bỏ đi
  const schemaJson: Record<string, unknown> = { ...schema }
  delete schemaJson.$schema
  const args = [
    '-p',
    '--output-format',
    'json',
    '--json-schema',
    JSON.stringify(schemaJson),
    '--tools',
    '', // không cho dùng công cụ: chỉ cần trả lời
    '--no-session-persistence',
    '--model',
    opts.model,
    '--effort',
    opts.effort
  ]
  // Bỏ ANTHROPIC_API_KEY để CLI dùng phiên đăng nhập (không tính phí API)
  const env = { ...process.env }
  delete env.ANTHROPIC_API_KEY

  return new Promise((resolve) => {
    // cwd = thư mục tạm: không nạp CLAUDE.md / cấu hình của project vào ngữ cảnh
    const child = spawn(opts.bin, args, { cwd: tmpdir(), env, windowsHide: true })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill()
      resolve({ ok: false, fatal: false, message: `timeout after ${opts.timeoutMs / 1000}s` })
    }, opts.timeoutMs)

    child.stdout.on('data', (d: Buffer) => (stdout += d.toString('utf8')))
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString('utf8')))
    child.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timer)
      resolve({
        ok: false,
        fatal: true,
        message:
          err.code === 'ENOENT'
            ? `Không tìm thấy lệnh "${opts.bin}" — cài Claude Code (https://claude.com/claude-code) hoặc truyền --claude-bin <đường dẫn>`
            : `Không chạy được Claude CLI: ${err.message}`
      })
    })
    child.on('close', () => {
      clearTimeout(timer)
      let res: CliResultJson
      try {
        res = JSON.parse(stdout) as CliResultJson
      } catch {
        resolve({
          ok: false,
          fatal: false,
          message: `unexpected CLI output: ${(stderr || stdout).trim().slice(0, 300)}`
        })
        return
      }
      if (res.is_error) {
        const text = res.result ?? ''
        const auth =
          res.api_error_status === 401 ||
          res.api_error_status === 403 ||
          /authenticat|log ?in|oauth/i.test(text)
        resolve({ ok: false, fatal: auth, message: auth ? AUTH_HINT : text.slice(0, 300) })
        return
      }
      let output = res.structured_output
      if (output === undefined && res.result) output = parseJsonLoose(res.result)
      resolve({
        ok: true,
        output,
        model: Object.keys(res.modelUsage ?? {})[0] ?? opts.model,
        inputTokens: res.usage?.input_tokens ?? 0,
        outputTokens: res.usage?.output_tokens ?? 0
      })
    })

    // Bản CLI cũ xử lý --system-prompt sai (trả lời kiểu trợ lý, bỏ qua định dạng) và bỏ qua --json-schema
    // → đưa toàn bộ hướng dẫn + định dạng vào chính tin nhắn gửi qua stdin
    const prompt = `${system}

OUTPUT FORMAT: reply with ONLY one JSON object (no code fences, no prose) that validates against this JSON Schema:
${JSON.stringify(schemaJson)}

=====
${userMessage}`
    child.stdin.end(prompt, 'utf8')
  })
}
