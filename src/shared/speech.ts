// Chấm điểm bài nói (tầng 1–2 của docs/11-ai-and-speech.md#4): so lời nhận dạng với câu mẫu theo từ,
// và đo độ trôi chảy từ mốc thời gian từng từ. Hàm thuần, dùng chung renderer/main/test.

/** Âm thanh gửi cho nhận dạng: PCM float 16 kHz mono */
export const STT_SAMPLE_RATE = 16_000
/** Độ dài ghi âm tối đa (giây): Whisper xử lý một cửa sổ 30 giây */
export const STT_MAX_SECONDS = 30
export const STT_MAX_SAMPLES = STT_SAMPLE_RATE * STT_MAX_SECONDS
/** Ngắn hơn mức này (giây) coi như không nói gì */
export const STT_MIN_SECONDS = 0.3

export type WordStatus = 'ok' | 'wrong' | 'missing' | 'extra'

export interface WordResult {
  /** Từ trong câu mẫu (với 'extra': từ thừa nghe được) */
  word: string
  status: WordStatus
  /** Từ nghe được khi nói sai ('wrong') */
  heard?: string
}

export interface SpeechScore {
  /** 0–100 */
  accuracy: number
  verdict: 'great' | 'good' | 'retry'
  words: WordResult[]
  expectedCount: number
  correctCount: number
}

const NUMBER_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty'
]

/** Chuẩn hoá để so khớp: chữ thường, bỏ dấu câu (giữ dấu nháy trong từ), số 0–20 đổi ra chữ */
export function normalizeSpeech(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean)
    .map((w) => (/^\d+$/.test(w) && Number(w) <= 20 ? NUMBER_WORDS[Number(w)] : w))
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => {
    const row = Array<number>(b.length + 1).fill(0)
    row[0] = i
    return row
  })
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
  return dp[a.length][b.length]
}

/** Hai từ coi là giống nhau: trùng hẳn, hoặc từ dài (≥ 6 chữ) lệch tối đa 1 ký tự (nhận dạng có sai số nhỏ) */
export function sameWord(expected: string, heard: string): boolean {
  if (expected === heard) return true
  return Math.min(expected.length, heard.length) >= 6 && editDistance(expected, heard) <= 1
}

/** Căn chỉnh theo từ (khoảng cách chỉnh sửa) giữa câu mẫu và lời nghe được */
export function scoreSpeech(expectedText: string, heardText: string): SpeechScore {
  const exp = normalizeSpeech(expectedText)
  const got = normalizeSpeech(heardText)
  const n = exp.length
  const m = got.length
  // dp[i][j]: chi phí tối thiểu căn chỉnh exp[0..i) với got[0..j)
  const dp = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0))
  for (let i = 1; i <= n; i++) dp[i][0] = i
  for (let j = 1; j <= m; j++) dp[0][j] = j
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const sub = dp[i - 1][j - 1] + (sameWord(exp[i - 1], got[j - 1]) ? 0 : 1)
      dp[i][j] = Math.min(sub, dp[i - 1][j] + 1, dp[i][j - 1] + 1)
    }
  // Lần ngược tìm đường căn chỉnh
  const words: WordResult[] = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const match = sameWord(exp[i - 1], got[j - 1])
      if (dp[i][j] === dp[i - 1][j - 1] + (match ? 0 : 1)) {
        words.push(
          match
            ? { word: exp[i - 1], status: 'ok' }
            : { word: exp[i - 1], status: 'wrong', heard: got[j - 1] }
        )
        i--
        j--
        continue
      }
    }
    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      words.push({ word: exp[i - 1], status: 'missing' })
      i--
    } else {
      words.push({ word: got[j - 1], status: 'extra' })
      j--
    }
  }
  words.reverse()
  const correctCount = words.filter((w) => w.status === 'ok').length
  const extra = words.filter((w) => w.status === 'extra').length
  const accuracy =
    n === 0 ? 0 : Math.round(Math.max(0, Math.min(1, (correctCount - 0.5 * extra) / n)) * 100)
  return {
    accuracy,
    verdict: accuracy >= 90 ? 'great' : accuracy >= 70 ? 'good' : 'retry',
    words,
    expectedCount: n,
    correctCount
  }
}

export interface TimedWord {
  word: string
  start: number
  end: number
}

export interface FluencyStats {
  durationSec: number
  /** Số từ mỗi phút, tính từ từ đầu tiên đến từ cuối cùng */
  wpm: number
  /** Số quãng ngừng dài (> 0,8 giây) giữa các từ */
  longPauses: number
}

/** Độ trôi chảy từ mốc thời gian từng từ (cấp 2) */
export function fluencyStats(words: TimedWord[]): FluencyStats {
  if (words.length === 0) return { durationSec: 0, wpm: 0, longPauses: 0 }
  const first = words[0].start
  const last = words[words.length - 1].end
  const durationSec = Math.max(0.1, last - first)
  let longPauses = 0
  for (let k = 1; k < words.length; k++) if (words[k].start - words[k - 1].end > 0.8) longPauses++
  return {
    durationSec: Math.round(durationSec * 10) / 10,
    wpm: Math.round((words.length / durationSec) * 60),
    longPauses
  }
}

/** Hạ mẫu PCM từ `fromRate` về 16 kHz mono (nội suy tuyến tính) */
export function resampleTo16k(input: Float32Array, fromRate: number): Float32Array {
  if (fromRate === STT_SAMPLE_RATE) return input
  const ratio = STT_SAMPLE_RATE / fromRate
  const n = Math.floor(input.length * ratio)
  const out = new Float32Array(n)
  for (let k = 0; k < n; k++) {
    const x = k / ratio
    const i0 = Math.floor(x)
    const f = x - i0
    out[k] = input[i0] * (1 - f) + (input[Math.min(i0 + 1, input.length - 1)] ?? 0) * f
  }
  return out
}
