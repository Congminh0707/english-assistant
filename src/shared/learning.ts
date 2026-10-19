import { LEVEL_CODES, type LevelCode } from './schemas/content/level'

/**
 * Gói từ điển hiện có nội dung (từ, câu) từ A1.1 trở lên; hai bậc Pre-A1 chưa có.
 * Người học ở Pre-A1 được lấy nội dung từ A1.1 (bậc dễ nhất hiện có).
 */
export const FIRST_CONTENT_LEVEL_INDEX = LEVEL_CODES.indexOf('A1_1')

/** Từ "mới hơi khó hơn một chút": level hiện tại và level kế tiếp (không thấp hơn bậc có nội dung) */
export function levelAndNext(level: LevelCode): LevelCode[] {
  const lo = Math.max(FIRST_CONTENT_LEVEL_INDEX, LEVEL_CODES.indexOf(level))
  return LEVEL_CODES.slice(lo, lo + 2)
}

/** Cửa sổ nội dung cho bài luyện tập: một bậc dưới, level hiện tại, một bậc trên (luôn có ít nhất 3 bậc có nội dung) */
export function practiceLevels(level: LevelCode): LevelCode[] {
  const i = LEVEL_CODES.indexOf(level)
  const lo = Math.max(FIRST_CONTENT_LEVEL_INDEX, i - 1)
  const hi = Math.max(lo + 2, i + 1)
  return LEVEL_CODES.slice(lo, hi + 1)
}
