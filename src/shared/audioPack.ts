// Quy ước gói âm thanh bài nghe tạo sẵn (tải thêm, không nằm trong bộ cài) — dùng chung giữa script build
// (scripts/audio/build-listening-audio.mjs), main (AudioPackService) và test. Thuần: không import electron/node.

export const LISTENING_PACK_ID = 'listening-audio'
/** Tốc độ (kiểu `speechSynthesis`) mà trình nghe phát: 0,6 / 0,8 / 1 và 0,9 cho bài tập nghe-chọn */
export const PACK_RATES = [0.6, 0.8, 0.9, 1] as const
/** Giọng Kokoro dùng khi tạo gói (trùng mặc định `tts.voiceUs` / `tts.voiceUk` trong cài đặt) */
export const PACK_VOICES = { us: 'af_heart', uk: 'bf_emma' } as const

export type PackAccent = 'us' | 'uk'

/** Chuẩn hoá văn bản như TtsCache: gom khoảng trắng, bỏ khoảng trắng đầu/cuối */
export const normalizePackText = (text: string): string => text.replace(/\s+/g, ' ').trim()

/** FNV-1a 64-bit (hai nửa 32-bit) → 16 ký tự hex; không cần thư viện băm, giống nhau ở main/renderer/script */
function fnv1a64(input: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0xcbf29ce4
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 ^ ((c >> 3) | (c << 5)), 0x85ebca6b) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

/** Khoá một đoạn âm thanh trong gói: giọng (Mỹ/Anh) + tốc độ (làm tròn 2 chữ số) + văn bản */
export function packClipKey(accent: PackAccent, rate: number, text: string): string {
  const r = Math.round(rate * 100) / 100
  return fnv1a64(`${accent}|${r}|${normalizePackText(text)}`)
}

export interface PackManifest {
  id: string
  version: string
  /** key → tên file trong thư mục `clips/` */
  clips: Record<string, string>
}
