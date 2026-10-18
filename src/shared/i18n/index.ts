// Chuỗi giao diện vi/en dùng chung. Renderer dùng qua vue-i18n; main (tray, menu) dùng hàm t() bên dưới.
import vi from './vi.json'
import en from './en.json'

export type Language = 'vi' | 'en'
export type Messages = typeof vi

export const messages: Record<Language, Messages> = { vi, en }

function lookup(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined,
      obj
    )
}

/** Dịch một khoá, thay {param}. Thiếu bản dịch thì rơi về tiếng Việt, rồi trả về chính khoá. */
export function t(
  lang: Language,
  key: string,
  params: Record<string, string | number> = {}
): string {
  const value = lookup(messages[lang], key) ?? lookup(messages.vi, key)
  if (typeof value !== 'string') return key
  return value.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`))
}
