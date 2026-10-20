// Giọng đọc tự nhiên (Kokoro-82M, Apache-2.0) — định nghĩa thuần dùng ở main, renderer và test.

export type TtsAccent = 'us' | 'uk'
export type TtsEngineKind = 'system' | 'kokoro'

export interface VoiceDef {
  id: string
  accent: TtsAccent
  /** Nhãn hiển thị */
  label: string
}

/** Giọng chọn lọc (điểm chất lượng cao nhất của từng nhóm trong bảng đánh giá của Kokoro) */
export const US_VOICES: VoiceDef[] = [
  { id: 'af_heart', accent: 'us', label: 'Heart (nữ, Mỹ)' },
  { id: 'af_bella', accent: 'us', label: 'Bella (nữ, Mỹ)' },
  { id: 'am_michael', accent: 'us', label: 'Michael (nam, Mỹ)' },
  { id: 'am_fenrir', accent: 'us', label: 'Fenrir (nam, Mỹ)' }
]
export const UK_VOICES: VoiceDef[] = [
  { id: 'bf_emma', accent: 'uk', label: 'Emma (nữ, Anh)' },
  { id: 'bf_isabella', accent: 'uk', label: 'Isabella (nữ, Anh)' },
  { id: 'bm_george', accent: 'uk', label: 'George (nam, Anh)' },
  { id: 'bm_fable', accent: 'uk', label: 'Fable (nam, Anh)' }
]
export const ALL_VOICES: VoiceDef[] = [...US_VOICES, ...UK_VOICES]

export const US_VOICE_IDS = US_VOICES.map((v) => v.id) as [string, ...string[]]
export const UK_VOICE_IDS = UK_VOICES.map((v) => v.id) as [string, ...string[]]

export const isKnownVoice = (id: string): boolean => ALL_VOICES.some((v) => v.id === id)

/** Số ký tự tối đa một lần đọc */
export const TTS_MAX_CHARS = 400

/**
 * Đổi tốc độ kiểu `speechSynthesis` (0,9 = bình thường trong app) sang `speed` của Kokoro (1 = bình thường).
 * Làm tròn 2 chữ số để cùng một yêu cầu luôn dùng chung một khoá cache.
 */
export function kokoroSpeed(rate: number): number {
  const speed = Math.min(1.3, Math.max(0.5, rate / 0.9))
  return Math.round(speed * 100) / 100
}

/**
 * Chuẩn hoá một đoạn văn trước khi gửi cho giọng tự nhiên: gom khoảng trắng và cắt tại cuối câu (hoặc dấu
 * cách) cho vừa `TTS_MAX_CHARS`. Trả về chuỗi rỗng nếu không có gì để đọc.
 */
export function clipForTts(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= TTS_MAX_CHARS) return clean
  const head = clean.slice(0, TTS_MAX_CHARS)
  const sentenceEnd = Math.max(
    head.lastIndexOf('. '),
    head.lastIndexOf('? '),
    head.lastIndexOf('! ')
  )
  if (sentenceEnd > TTS_MAX_CHARS * 0.4) return head.slice(0, sentenceEnd + 1)
  const space = head.lastIndexOf(' ')
  return (space > TTS_MAX_CHARS * 0.4 ? head.slice(0, space) : head).trim()
}
