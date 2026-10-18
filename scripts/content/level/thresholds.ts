// Ngưỡng gắn level tự động — docs/09-content-pipeline.md §4. Hiệu chỉnh dần bằng dữ liệu.
import type { LevelCode, WordList } from '../../../src/shared/schemas/content'

type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/**
 * CEFR-J chỉ có A1–B2 (Octanove C1–C2) không chia nửa bậc → tách nửa bậc theo freqRank:
 * từ phổ biến hơn ngưỡng thì vào nửa đầu.
 */
export const CEFR_SPLIT: Record<Cefr, { first: LevelCode; second: LevelCode; rankBelow: number }> =
  {
    A1: { first: 'A1_1', second: 'A1_2', rankBelow: 500 },
    A2: { first: 'A2_1', second: 'A2_2', rankBelow: 1500 },
    B1: { first: 'B1_1', second: 'B1_2', rankBelow: 2700 },
    B2: { first: 'B2_1', second: 'B2_2', rankBelow: 4200 },
    C1: { first: 'C1', second: 'C1', rankBelow: 0 },
    C2: { first: 'C2', second: 'C2', rankBelow: 0 }
  }

/** Băng tần suất NGSL (thứ hạng 1–2809) khi không có CEFR-J */
export const NGSL_BANDS: { maxRank: number; level: LevelCode }[] = [
  { maxRank: 500, level: 'A1_1' },
  { maxRank: 1000, level: 'A1_2' },
  { maxRank: 1500, level: 'A2_1' },
  { maxRank: 2000, level: 'A2_2' },
  { maxRank: 2400, level: 'B1_1' },
  { maxRank: 2809, level: 'B1_2' }
]

/** TSL (từ đặc trưng TOEIC) không có CEFR-J: coi như B2 */
export const TSL_SPLIT = { first: 'B2_1' as LevelCode, second: 'B2_2' as LevelCode, rankBelow: 600 }

/** NGSL supplementary (ngày, tháng, số đếm) */
export const NGSL_SUP_LEVEL: LevelCode = 'A1_1'

/**
 * Ngoài mọi danh sách: theo freqRank gộp (NGSL rồi Tatoeba, bắt đầu từ 2810).
 * Từ ngoài CEFR-J nhưng rất hay gặp trong hội thoại Tatoeba (goodbye, butterfly...) không nên bị
 * đẩy hết lên C1 → chia băng; phần đuôi vẫn là C1/C2 như docs/09 §4.
 */
export const OUTSIDE_LIST_BANDS: { maxRank: number; level: LevelCode }[] = [
  { maxRank: 5_000, level: 'B1_2' },
  { maxRank: 8_000, level: 'B2_1' },
  { maxRank: 12_000, level: 'B2_2' },
  { maxRank: 18_000, level: 'C1' }
]

/** Câu: level thấp nhất mà ≥ 95% token (đã quy về lemma) nằm trong vốn từ tích luỹ */
export const SENTENCE_COVERAGE = 0.95

export interface LevelInput {
  cefr?: Cefr
  lists: WordList[]
  freqRank?: number
  ngslRank?: number
  tslRank?: number
}

export function suggestWordLevel(w: LevelInput): LevelCode {
  const rank = w.freqRank ?? Infinity
  if (w.cefr) {
    const split = CEFR_SPLIT[w.cefr]
    return rank < split.rankBelow ? split.first : split.second
  }
  if (w.ngslRank !== undefined) {
    return NGSL_BANDS.find((b) => w.ngslRank! <= b.maxRank)?.level ?? 'B1_2'
  }
  if (w.lists.includes('ngsl-sup')) return NGSL_SUP_LEVEL
  if (w.tslRank !== undefined) {
    return w.tslRank < TSL_SPLIT.rankBelow ? TSL_SPLIT.first : TSL_SPLIT.second
  }
  return OUTSIDE_LIST_BANDS.find((b) => rank <= b.maxRank)?.level ?? 'C2'
}
