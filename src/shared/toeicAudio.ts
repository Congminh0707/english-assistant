// Lời đọc phần nghe TOEIC (Part 1–4): dùng chung giữa trang làm bài (ToeicPage.vue) và script tạo gói âm thanh
// (scripts/audio/build-listening-audio.mjs) để khoá clip trong gói khớp đúng câu/giọng/tốc độ app yêu cầu.
// Thuần kiểu (Node chạy thẳng bằng type-stripping): không import, không enum.

/** Tốc độ đọc phần nghe TOEIC (kiểu `speechSynthesis`) */
export const TOEIC_TTS_RATE = 0.95

const LETTERS = ['A', 'B', 'C', 'D']

/** Dòng "Speaker: lời" trong script Part 3–4 */
const SPEAKER_LINE = /^([A-Za-z][A-Za-z ]{0,20}\d?):\s*(.+)$/

export interface ToeicAudioGroup {
  part: number
  script?: string | null
  questions: Array<{ prompt?: string | null; choices: string[] }>
}

export interface ToeicAudioLine {
  text: string
  accent: 'us' | 'uk'
}

/** Giới hạn một lần đọc của giọng tự nhiên/gói âm thanh (trùng `TTS_MAX_CHARS` ở shared/tts.ts; không import để Node chạy thẳng file này) */
const MAX_LINE_CHARS = 400

/**
 * Bài nói Part 4 (và lượt thoại dài Part 3) thường quá 400 ký tự: `clipForTts` sẽ cắt mất phần sau. Tách theo câu rồi
 * gom lại thành từng đoạn ≤ 400 ký tự để đọc trọn bài. Dòng ngắn giữ nguyên.
 */
function chunkLine(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= MAX_LINE_CHARS) return clean ? [clean] : []
  const sentences = clean.split(/(?<=[.!?…]["')\]”’]*)\s+/).filter(Boolean)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (current && current.length + 1 + sentence.length > MAX_LINE_CHARS) {
      chunks.push(current)
      current = sentence
    } else current = current ? `${current} ${sentence}` : sentence
  }
  if (current) chunks.push(current)
  return chunks
}

/**
 * Các câu đọc của một nhóm theo thứ tự phát: Part 1 đọc từng lựa chọn (giọng Mỹ); Part 2 đọc câu hỏi (Mỹ) rồi các
 * lựa chọn (Anh); Part 3–4 đọc theo lượt người nói (người nói xen kẽ Mỹ/Anh theo thứ tự xuất hiện) rồi các câu hỏi (Mỹ).
 */
export function toeicAudioLines(group: ToeicAudioGroup): ToeicAudioLine[] {
  const lines: ToeicAudioLine[] = []
  if (group.part === 1) {
    const q = group.questions[0]
    q.choices.forEach((c, i) => lines.push({ text: `${LETTERS[i]}. ${c}`, accent: 'us' }))
  } else if (group.part === 2) {
    lines.push({ text: group.script ?? '', accent: 'us' })
    group.questions[0].choices.forEach((c, i) =>
      lines.push({ text: `${LETTERS[i]}. ${c}`, accent: 'uk' })
    )
  } else {
    const speakers = new Map<string, 'us' | 'uk'>()
    for (const raw of (group.script ?? '').split('\n')) {
      const m = SPEAKER_LINE.exec(raw.trim())
      const who = m ? m[1] : ''
      const text = m ? m[2] : raw.trim()
      if (!text) continue
      if (!speakers.has(who)) speakers.set(who, speakers.size % 2 === 0 ? 'us' : 'uk')
      const accent = speakers.get(who) ?? 'us'
      for (const chunk of chunkLine(text)) lines.push({ text: chunk, accent })
    }
    for (const q of group.questions) {
      if (q.prompt?.trim()) lines.push({ text: q.prompt, accent: 'us' })
    }
  }
  return lines
}
