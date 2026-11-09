import type { TranslateCloudProvider, TranslateDirection } from '@shared/schemas/translate'

/** Key do người dùng nhập (lưu mã hoá trong SecretStore); thiếu/rỗng thì bỏ nhà cung cấp đó */
export interface CloudKeys {
  google?: string | null
  azureKey?: string | null
  azureRegion?: string | null
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

const GOOGLE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2'
const AZURE_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0'
const TIMEOUT_MS = 6_000
/** Lỗi tạm (mạng, hết hạn mức, 5xx): nghỉ nhà cung cấp này một lúc rồi thử lại */
const COOLDOWN_MS = 5 * 60_000

class CloudError extends Error {
  constructor(
    message: string,
    /** Key sai/không có quyền → tắt nhà cung cấp cho tới khi người dùng đổi key */
    readonly fatal = false
  ) {
    super(message)
  }
}

interface Request {
  url: string
  headers: Record<string, string>
  body: unknown
}

interface Provider {
  engine: TranslateCloudProvider
  /** Dấu vết của key hiện tại: đổi key → xoá trạng thái tắt/nghỉ */
  id: string
  request: (text: string, direction: TranslateDirection) => Request
  parse: (body: unknown) => string | undefined
}

/**
 * Dịch online bằng Google Cloud Translation (v2) rồi Azure Translator (v3), key do người dùng nhập (đọc lại mỗi lần gọi).
 * Không có key → nhà cung cấp đó coi như không tồn tại; key sai (401/403) → tắt tới khi đổi key; lỗi tạm → nghỉ COOLDOWN_MS.
 * Không bao giờ ghi key hay nội dung dịch ra log; mọi lỗi → throw để TranslationService rơi về model offline.
 */
export class CloudTranslator {
  private readonly state = new Map<
    TranslateCloudProvider,
    { id: string; disabled: boolean; retryAt: number }
  >()

  constructor(
    private readonly deps: {
      getKeys: () => CloudKeys
      fetch?: FetchLike
      timeoutMs?: number
      now?: () => number
    }
  ) {}

  /** Có nhà cung cấp nào dùng được ngay không (có key, chưa bị từ chối, không đang nghỉ) */
  available(): boolean {
    return this.providers().some((p) => this.usable(p))
  }

  async translate(
    text: string,
    direction: TranslateDirection
  ): Promise<{ text: string; engine: TranslateCloudProvider }> {
    for (const p of this.providers()) {
      if (!this.usable(p)) continue
      try {
        return { text: await this.call(p, text, direction), engine: p.engine }
      } catch (err) {
        const st = this.stateOf(p)
        if (err instanceof CloudError && err.fatal) st.disabled = true
        else st.retryAt = this.now() + COOLDOWN_MS
      }
    }
    throw new Error('cloud translate: no provider')
  }

  private providers(): Provider[] {
    const keys = this.deps.getKeys()
    const google = keys.google?.trim()
    const azureKey = keys.azureKey?.trim()
    const azureRegion = keys.azureRegion?.trim()
    const out: Provider[] = []
    if (google) {
      out.push({
        engine: 'google',
        id: google,
        request: (text, direction) => {
          const [source, target] = direction.split('-') as [string, string]
          return {
            url: GOOGLE_ENDPOINT,
            headers: { 'content-type': 'application/json', 'x-goog-api-key': google },
            body: { q: text, source, target, format: 'text' }
          }
        },
        parse: (body) =>
          (body as { data?: { translations?: Array<{ translatedText?: string }> } })?.data
            ?.translations?.[0]?.translatedText
      })
    }
    if (azureKey) {
      out.push({
        engine: 'azure',
        id: `${azureKey}\n${azureRegion ?? ''}`,
        request: (text, direction) => {
          const [from, to] = direction.split('-') as [string, string]
          return {
            url: `${AZURE_ENDPOINT}&from=${from}&to=${to}`,
            headers: {
              'content-type': 'application/json',
              'ocp-apim-subscription-key': azureKey,
              ...(azureRegion ? { 'ocp-apim-subscription-region': azureRegion } : {})
            },
            body: [{ Text: text }]
          }
        },
        parse: (body) =>
          (body as Array<{ translations?: Array<{ text?: string }> }>)?.[0]?.translations?.[0]?.text
      })
    }
    return out
  }

  private stateOf(p: Provider): { id: string; disabled: boolean; retryAt: number } {
    let st = this.state.get(p.engine)
    if (!st || st.id !== p.id) {
      st = { id: p.id, disabled: false, retryAt: 0 }
      this.state.set(p.engine, st)
    }
    return st
  }

  private usable(p: Provider): boolean {
    const st = this.stateOf(p)
    return !st.disabled && this.now() >= st.retryAt
  }

  private now(): number {
    return this.deps.now?.() ?? Date.now()
  }

  private async call(p: Provider, text: string, direction: TranslateDirection): Promise<string> {
    const req = p.request(text, direction)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), this.deps.timeoutMs ?? TIMEOUT_MS)
    try {
      const res = await (this.deps.fetch ?? (fetch as unknown as FetchLike))(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify(req.body),
        signal: ctrl.signal
      })
      if (!res.ok) {
        throw new CloudError(
          `cloud translate: HTTP ${res.status}`,
          res.status === 401 || res.status === 403
        )
      }
      const out = p.parse(await res.json())?.trim()
      if (!out) throw new CloudError('cloud translate: empty')
      return out
    } finally {
      clearTimeout(timer)
    }
  }
}
