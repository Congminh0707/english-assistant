// Thẻ ôn tập: các hướng thẻ, tạo chỗ trống cho thẻ điền từ, chấm đáp án gõ, id mẫu câu — phần thuần dùng ở main,
// renderer và test. docs/07-learning-modules.md#3-module-từ-vựng--srs-p0

/** Hướng thẻ trong srs_cards.direction */
export type CardDirection = 'en_vi' | 'vi_en' | 'audio_en' | 'cloze' | 'audio_picture'

/** Các hướng thẻ có giao diện ôn hiện nay (audio_picture để dành cho track trẻ em) */
export const REVIEW_DIRECTIONS = ['en_vi', 'vi_en', 'audio_en', 'cloze'] as const

/** Từ vựng thường: id 'word:en:go'. Mẫu câu: id 'phrase:<nhóm>:<mã băm>'. */
export const PHRASE_PREFIX = 'phrase:'
export const isPhraseId = (contentId: string): boolean => contentId.startsWith(PHRASE_PREFIX)

/** Mã băm ổn định (FNV-1a 32-bit, 8 ký tự hex) của câu tiếng Anh — id mẫu câu không phụ thuộc thứ tự trong file */
export function phraseHash(en: string): string {
  let h = 0x811c9dc5
  const text = en.trim().toLowerCase()
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export const phraseContentId = (categoryId: string, en: string): string =>
  `${PHRASE_PREFIX}${categoryId}:${phraseHash(en)}`

/** Chỉ giữ chữ/số/khoảng trắng, hạ chữ thường, gộp khoảng trắng — để so đáp án gõ */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

export type TypedResult = 'correct' | 'close' | 'wrong'

/**
 * Chấm đáp án gõ: đúng (khớp sau khi chuẩn hoá), gần đúng (sai 1 ký tự với từ ≥ 5 chữ cái) hoặc sai.
 * `answers` là các đáp án chấp nhận.
 */
export function checkTyped(typed: string, answers: string[]): TypedResult {
  const given = normalizeAnswer(typed)
  if (!given) return 'wrong'
  const accepted = answers.map(normalizeAnswer).filter(Boolean)
  if (accepted.includes(given)) return 'correct'
  const close = accepted.some((a) => a.length >= 5 && editDistance(given, a) <= 1)
  return close ? 'close' : 'wrong'
}

export interface Cloze {
  /** Phần câu trước chỗ trống */
  before: string
  /** Phần câu sau chỗ trống */
  after: string
  /** Dạng của từ đúng như trong câu (vd "went" cho lemma "go" nếu khớp; hoặc "walked" cho "walk") */
  answer: string
}

/** Các dạng chia thường gặp của một động từ/danh từ tiếng Anh theo quy tắc */
function inflections(lemma: string): Set<string> {
  const w = lemma.toLowerCase()
  const forms = new Set<string>([w, `${w}s`, `${w}es`, `${w}ed`, `${w}d`, `${w}ing`, `${w}er`])
  if (w.endsWith('e')) forms.add(`${w.slice(0, -1)}ing`)
  if (w.endsWith('y')) {
    forms.add(`${w.slice(0, -1)}ies`)
    forms.add(`${w.slice(0, -1)}ied`)
  }
  const last = w[w.length - 1]
  if (last) {
    forms.add(`${w}${last}ed`)
    forms.add(`${w}${last}ing`)
  }
  return forms
}

/** Tạo thẻ điền chỗ trống: thay từ cần học trong câu bằng chỗ trống; null nếu câu không chứa từ (kể cả dạng chia) */
export function makeCloze(sentence: string, lemma: string): Cloze | null {
  const forms = inflections(lemma)
  for (const m of sentence.matchAll(/[A-Za-z]+(?:'[A-Za-z]+)?/g)) {
    if (forms.has(m[0].toLowerCase())) {
      return {
        before: sentence.slice(0, m.index),
        after: sentence.slice(m.index + m[0].length),
        answer: m[0]
      }
    }
  }
  return null
}
