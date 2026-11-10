const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const TIMEOUT_MS = 15_000

/** Một yêu cầu tới model ngôn ngữ: prompt hệ thống + nội dung người dùng, trả về văn bản thô */
export interface AiRequest {
  system: string
  user: string
  maxTokens: number
  effort?: 'low' | 'medium'
}

/**
 * Nhà cung cấp AI (docs/11 §5). v1 chỉ có Anthropic; thêm nhà cung cấp khác = một lớp mới cài interface này.
 * Mọi lỗi (mạng, HTTP, hết thời gian, bị từ chối, bị cắt cụt vì max_tokens, rỗng) → throw; lỗi không được chứa key hay nội dung.
 */
export interface AiClient {
  complete(req: AiRequest): Promise<string>
}

/** HTTP 401/403: Anthropic từ chối key → AiService báo `errors.aiKeyRejected` (thông điệp không chứa key) */
export class AiKeyRejectedError extends Error {
  constructor(status: number) {
    super(`ai: HTTP ${status}`)
    this.name = 'AiKeyRejectedError'
  }
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

/**
 * Claude (Messages API) gọi thẳng bằng fetch như OnlineTranslator — không thêm SDK. Key lấy qua `getKey` (cùng secret
 * 'anthropic' với Dịch online), model qua `getModel` (cài đặt `ai.model`). Không bao giờ ghi key hay nội dung ra log.
 */
export class AnthropicClient implements AiClient {
  constructor(
    private readonly deps: {
      getKey: () => string | null
      getModel: () => string
      fetch?: FetchLike
      timeoutMs?: number
    }
  ) {}

  async complete(req: AiRequest): Promise<string> {
    const key = this.deps.getKey()
    if (!key) throw new Error('ai: no key')
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), this.deps.timeoutMs ?? TIMEOUT_MS)
    try {
      const res = await (this.deps.fetch ?? (fetch as unknown as FetchLike))(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.deps.getModel(),
          max_tokens: req.maxTokens,
          system: req.system,
          ...(req.effort ? { output_config: { effort: req.effort } } : {}),
          messages: [{ role: 'user', content: req.user }]
        }),
        signal: ctrl.signal
      })
      if (res.status === 401 || res.status === 403) throw new AiKeyRejectedError(res.status)
      if (!res.ok) throw new Error(`ai: HTTP ${res.status}`)
      const body = (await res.json()) as {
        stop_reason?: string
        content?: Array<{ type: string; text?: string }>
      }
      if (body.stop_reason === 'refusal') throw new Error('ai: refused')
      // Bị cắt cụt vì hết max_tokens: JSON dở dang, gọi lại cũng cụt như vậy → báo lỗi, không thử lại
      if (body.stop_reason === 'max_tokens') throw new Error('ai: max_tokens')
      const out = (body.content ?? [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('')
        .trim()
      if (!out) throw new Error('ai: empty')
      return out
    } finally {
      clearTimeout(timer)
    }
  }
}
