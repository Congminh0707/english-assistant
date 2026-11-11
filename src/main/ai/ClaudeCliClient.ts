import type { AiModel } from '@shared/schemas/ai'
import { AppError } from '../core/AppError'
import type { AiClient, AiRequest } from './AiClient'
import type { CliRunner } from './cliRunner'

const TIMEOUT_MS = 45_000

/** Model của cài đặt `ai.model` → bí danh của Claude Code CLI */
export const CLI_MODEL: Record<AiModel, string> = {
  'claude-haiku-5-5': 'haiku',
  'claude-sonnet-5-5': 'sonnet'
}

/**
 * Tham số cho `claude -p` (docs/11 §5, docs/16): không tool nào (`--tools ""`), không nạp cấu hình/MCP/skill/lệnh "/"
 * của người dùng, `--safe-mode` (tắt CLAUDE.md, skill, plugin, hook, MCP, lệnh tuỳ biến), không lưu phiên, đầu ra JSON. Prompt hệ thống là chuỗi cố định của prompts.ts; dữ liệu người dùng
 * KHÔNG bao giờ nằm trong args (chỉ qua stdin). Không có tham số vị trí, nên các cờ nhận nhiều giá trị (`--tools`)
 * luôn đứng trước một cờ khác. Cấm: --bare (tắt OAuth), --dangerously-skip-permissions, --permission-mode,
 * --add-dir, --mcp-config, --settings, --plugin-dir, --resume, --continue.
 */
export function buildCliArgs(model: string, system: string, effort: 'low' | 'medium'): string[] {
  return [
    '-p',
    '--model',
    model,
    '--effort',
    effort,
    '--setting-sources',
    '',
    '--strict-mcp-config',
    '--tools',
    '',
    '--disable-slash-commands',
    '--safe-mode',
    '--no-session-persistence',
    '--output-format',
    'json',
    '--system-prompt',
    system
  ]
}

// Chỉ thông điệp hết hạn mức của CLI (không khớp chữ "usage" đứng một mình)
const LIMIT_RE = /\b(usage limit|limit reached|rate limit|limit exceeded|hit your limit)\b/i
const LOGIN_RE = /\b(not logged in|log ?in|login|authenticat\w*|unauthori[sz]ed)\b/i

interface CliJson {
  type?: unknown
  subtype?: unknown
  is_error?: unknown
  result?: unknown
  stop_reason?: unknown
}

/**
 * AI qua Claude Code CLI headless (gói Pro/Max của người dùng, docs/decisions.md #57). Adapter mỏng, không trạng thái:
 * hạn mức ngày và hàng đợi 1 tiến trình nằm ở AiService. `max_tokens` không có cờ tương ứng nên bỏ qua.
 * Lỗi: hết hạn mức gói → AI_LIMIT/errors.aiPlanLimit; chưa đăng nhập → errors.aiCliLogin; còn lại throw Error với
 * thông điệp cố định (không chứa nội dung câu, kết quả hay stderr).
 */
export class ClaudeCliClient implements AiClient {
  constructor(
    private readonly deps: {
      run: CliRunner
      getExe: () => string | null
      getModel: () => AiModel
      timeoutMs?: number
    }
  ) {}

  async complete(req: AiRequest): Promise<string> {
    const exe = this.deps.getExe()
    if (!exe) throw new Error('ai-cli: not available')
    const model = CLI_MODEL[this.deps.getModel()] ?? 'haiku'
    const res = await this.deps.run(
      exe,
      buildCliArgs(model, req.system, req.effort ?? 'low'),
      req.user,
      {
        timeoutMs: this.deps.timeoutMs ?? TIMEOUT_MS
      }
    )

    let body: CliJson | undefined
    try {
      const parsed: unknown = JSON.parse(res.stdout.trim())
      if (parsed && typeof parsed === 'object') body = parsed as CliJson
    } catch {
      body = undefined
    }

    if (!body) {
      if (res.code !== 0 && LOGIN_RE.test(res.stderr))
        throw new AppError('AI_FAILED', 'errors.aiCliLogin')
      throw new Error(res.code !== 0 ? `ai-cli: exit ${res.code}` : 'ai-cli: bad output')
    }

    if (body.is_error === true || body.subtype !== 'success' || res.code !== 0) {
      // Chỉ xét chữ lỗi trong `result` (không xét cả stdout: JSON nào cũng có trường "usage")
      const msg = typeof body.result === 'string' ? body.result : ''
      if (LIMIT_RE.test(msg)) throw new AppError('AI_LIMIT', 'errors.aiPlanLimit')
      if (LOGIN_RE.test(msg) || (res.code !== 0 && LOGIN_RE.test(res.stderr)))
        throw new AppError('AI_FAILED', 'errors.aiCliLogin')
      throw new Error(`ai-cli: error (exit ${res.code})`)
    }
    if (body.stop_reason === 'refusal') throw new Error('ai: refused')
    // Bị cắt cụt: JSON dở dang, gọi lại cũng cụt → báo lỗi như AnthropicClient
    if (body.stop_reason === 'max_tokens') throw new Error('ai: max_tokens')
    const out = typeof body.result === 'string' ? body.result.trim() : ''
    if (!out) throw new Error('ai: empty')
    return out
  }
}
