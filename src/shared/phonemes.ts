// So khớp âm vị cho bài phát âm (cấp 3 của docs/11-ai-and-speech.md#4): căn chỉnh chuỗi âm vị mong đợi (từ espeak
// qua `phonemizer`) với chuỗi âm vị nhận dạng được (wav2vec2 phoneme CTC, cùng bộ ký hiệu espeak IPA), kèm mẹo
// sửa lỗi tiếng Việt. Hàm thuần, dùng chung main/renderer/test.

export type PhonemeStatus = 'ok' | 'wrong' | 'missing' | 'extra'

export interface PhonemeResult {
  /** Âm mong đợi (với 'extra': âm thừa nghe được) */
  phoneme: string
  status: PhonemeStatus
  /** Âm nghe được khi nói sai ('wrong') */
  heard?: string
}

export interface PhonemeScore {
  /** 0–100 */
  accuracy: number
  verdict: 'great' | 'good' | 'retry'
  phonemes: PhonemeResult[]
  expectedCount: number
  correctCount: number
}

/** Bỏ dấu trọng âm, khoảng trắng và dấu phân cách trong chuỗi IPA của espeak */
export function stripStress(ipa: string): string {
  return ipa.replace(/[ˈˌ'|]/g, '')
}

/** Cắt chuỗi IPA thành các âm theo danh sách âm của model (khớp dài nhất trước: aɪ, tʃ, iː...) */
export function tokenizeIpa(ipa: string, tokens: string[]): string[] {
  const known = [...new Set(tokens)].sort((a, b) => b.length - a.length)
  const text = stripStress(ipa).replace(/\s+/g, ' ')
  const out: string[] = []
  let i = 0
  while (i < text.length) {
    if (text[i] === ' ') {
      i++
      continue
    }
    const hit = known.find((t) => text.startsWith(t, i))
    if (hit) {
      out.push(hit)
      i += hit.length
    } else {
      i++ // ký tự lạ (dấu phụ, dấu câu): bỏ qua
    }
  }
  return out
}

const VOWELS = 'aeiouɑɒæɛɜɐɪɔʊʌəɚɝɨɵøœyɯ'

const isVowel = (p: string): boolean => p.length > 0 && VOWELS.includes(p[0])

/** Nhóm âm coi như tương đương (khác biệt chỉ do bộ ký hiệu/phương ngữ, không phải lỗi phát âm) */
const EQUIVALENT: string[][] = [
  ['ɹ', 'r', 'ɾ'],
  ['ɡ', 'g'],
  ['ɫ', 'l'],
  ['ɜː', 'ɜ', 'ɝ'],
  ['ə', 'ɐ', 'ɚ'],
  ['oʊ', 'əʊ', 'o'],
  ['ɔː', 'ɔ'],
  ['ɑː', 'ɑ', 'ɒ'],
  ['iː', 'i', 'iə'],
  ['uː', 'u'],
  ['ɛ', 'e'],
  ['a', 'æ']
]

/** Âm đệm hay chen vào mà không phải lỗi (nghe thấy nhưng người nói không "nói sai") */
const IGNORABLE_EXTRA = new Set(['ʔ', 'j', 'w', 'h', 'ə'])

function canon(p: string): string {
  const base = p.replace(/[ːˑ]/g, '')
  for (const group of EQUIVALENT)
    if (group.includes(p) || group.includes(base)) return group[0].replace(/[ːˑ]/g, '')
  return base
}

export const samePhoneme = (a: string, b: string): boolean => canon(a) === canon(b)

/** Chi phí thay thế: 0 nếu tương đương, 0,6 nếu cùng loại (nguyên âm–nguyên âm / phụ âm–phụ âm), ngược lại 1 */
function subCost(a: string, b: string): number {
  if (samePhoneme(a, b)) return 0
  return isVowel(a) === isVowel(b) ? 0.6 : 1
}

/** Căn chỉnh âm vị (khoảng cách chỉnh sửa có trọng số) giữa chuỗi mong đợi và chuỗi nghe được */
export function scorePhonemes(expected: string[], heard: string[]): PhonemeScore {
  const n = expected.length
  const m = heard.length
  const dp = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0))
  const delCost = 1
  const insCost = (p: string): number => (IGNORABLE_EXTRA.has(p) ? 0.2 : 1)
  for (let i = 1; i <= n; i++) dp[i][0] = i * delCost
  for (let j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] + insCost(heard[j - 1])
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + subCost(expected[i - 1], heard[j - 1]),
        dp[i - 1][j] + delCost,
        dp[i][j - 1] + insCost(heard[j - 1])
      )
  const eps = 1e-9
  const phonemes: PhonemeResult[] = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      Math.abs(dp[i][j] - (dp[i - 1][j - 1] + subCost(expected[i - 1], heard[j - 1]))) < eps
    ) {
      phonemes.push(
        samePhoneme(expected[i - 1], heard[j - 1])
          ? { phoneme: expected[i - 1], status: 'ok' }
          : { phoneme: expected[i - 1], status: 'wrong', heard: heard[j - 1] }
      )
      i--
      j--
    } else if (i > 0 && Math.abs(dp[i][j] - (dp[i - 1][j] + delCost)) < eps) {
      phonemes.push({ phoneme: expected[i - 1], status: 'missing' })
      i--
    } else {
      phonemes.push({ phoneme: heard[j - 1], status: 'extra' })
      j--
    }
  }
  phonemes.reverse()
  const correctCount = phonemes.filter((p) => p.status === 'ok').length
  // Âm thừa chỉ trừ điểm khi không phải âm đệm vô hại
  const harmfulExtra = phonemes.filter(
    (p) => p.status === 'extra' && !IGNORABLE_EXTRA.has(p.phoneme)
  ).length
  const accuracy =
    n === 0
      ? 0
      : Math.round(Math.max(0, Math.min(1, (correctCount - 0.5 * harmfulExtra) / n)) * 100)
  return {
    accuracy,
    verdict: accuracy >= 85 ? 'great' : accuracy >= 65 ? 'good' : 'retry',
    phonemes,
    expectedCount: n,
    correctCount
  }
}

/** Mã mẹo phát âm (khoá i18n `phoneme.tip.<id>`) cho âm hay sai của người Việt; null nếu chưa có mẹo */
export function phonemeTipId(phoneme: string): string | null {
  const key = phoneme.replace(/[ːˑ]/g, (m) => (m === 'ː' ? ':' : ''))
  const map: Record<string, string> = {
    θ: 'theta',
    ð: 'eth',
    ʃ: 'sh',
    ʒ: 'zh',
    tʃ: 'ch',
    dʒ: 'jh',
    ɹ: 'r',
    l: 'l',
    ŋ: 'ng',
    ɪ: 'ih',
    'i:': 'ee',
    æ: 'ae',
    ʌ: 'uh',
    'ɔ:': 'aw',
    ʊ: 'oo',
    'u:': 'uu',
    'ɜ:': 'er',
    ə: 'schwa',
    s: 'end_s',
    z: 'end_z',
    t: 'end_t',
    d: 'end_d',
    k: 'end_k',
    p: 'end_p',
    v: 'v',
    f: 'f'
  }
  return map[key] ?? null
}

/** Các mã mẹo (để kiểm tra đủ bản dịch) */
export const PHONEME_TIP_IDS = [
  'theta',
  'eth',
  'sh',
  'zh',
  'ch',
  'jh',
  'r',
  'l',
  'ng',
  'ih',
  'ee',
  'ae',
  'uh',
  'aw',
  'oo',
  'uu',
  'er',
  'schwa',
  'end_s',
  'end_z',
  'end_t',
  'end_d',
  'end_k',
  'end_p',
  'v',
  'f'
] as const
