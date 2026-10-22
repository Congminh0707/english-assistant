import { clipboard } from 'electron'
import { looksSensitive } from './sensitive'

/** Chỉ chặn văn bản khổng lồ; giới hạn dịch (TRANSLATE_MAX_CHARS) do normalizeQuery cắt và báo cho người dùng */
const MAX_LENGTH = 20_000

/** Đọc chữ người dùng vừa copy — chỉ gọi khi người dùng chủ động bấm phím tắt dịch */
export async function readClipboardForLookup(): Promise<string> {
  // Electron 44: clipboard.readText() trả về Promise
  const text = (await clipboard.readText()).trim()
  if (!text || looksSensitive(text)) return ''
  return text.slice(0, MAX_LENGTH)
}
