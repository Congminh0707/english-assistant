// Viết tự do theo đề (docs/07 "Viết tự do"): hằng số và hàm thuần dùng chung ở main (FreeWritingService), renderer
// (đếm từ, khoảng số từ, chọn đề ngẫu nhiên) và test.
import { levelIndex, type LevelCode } from './schemas/content/level'
import { diaryWordCount } from './schemas/diary'

/** Độ dài tối đa một bài viết tự do (ký tự): đủ rộng cho mức "dài" B2 (300 từ ≈ 1.800–2.000 ký tự) */
export const FREE_WRITING_MAX_CHARS = 3000
/** Độ dài tối đa đề tự đặt (ký tự) */
export const FREE_TOPIC_MAX_CHARS = 200
/** Số từ tối thiểu để được AI nhận xét (ít hơn thì không đáng một lượt AI) */
export const FREE_WRITING_FEEDBACK_MIN_WORDS = 10
/** Số từ tối thiểu để nhận thưởng viết tự do trong ngày (= mức "ngắn" thấp nhất) */
export const FREE_WRITING_REWARD_MIN_WORDS = 20
/** Số bài mỗi trang của danh sách bài đã viết */
export const FREE_WRITING_PAGE_SIZE = 20

/** Bậc lọc đề: A1–B2 (từ C1 dùng đề B2) */
export const FREE_WRITING_BANDS = ['A1', 'A2', 'B1', 'B2'] as const
export type FreeWritingBand = (typeof FREE_WRITING_BANDS)[number]

export const FREE_WRITING_LENGTHS = ['short', 'medium', 'long'] as const
export type FreeWritingLength = (typeof FREE_WRITING_LENGTHS)[number]

/** Khoảng số từ theo bậc + độ dài (docs/07 "Viết tự do"); mức dài nhất ≤ 300 từ để phản hồi AI vừa max_tokens */
export const FREE_WRITING_RANGES: Record<
  FreeWritingBand,
  Record<FreeWritingLength, { min: number; max: number }>
> = {
  A1: { short: { min: 20, max: 40 }, medium: { min: 40, max: 70 }, long: { min: 70, max: 100 } },
  A2: { short: { min: 30, max: 60 }, medium: { min: 60, max: 100 }, long: { min: 100, max: 150 } },
  B1: { short: { min: 50, max: 90 }, medium: { min: 90, max: 150 }, long: { min: 150, max: 220 } },
  B2: { short: { min: 80, max: 130 }, medium: { min: 130, max: 200 }, long: { min: 200, max: 300 } }
}

/** Đếm từ: cùng cách đếm với nhật ký và bài `write` */
export const freeWritingWordCount = diaryWordCount

/** Bậc lọc đề mặc định theo trình độ: PA1/A1 → A1, A2 → A2, B1 → B1, B2 trở lên → B2 */
export function bandOfLevel(level: LevelCode): FreeWritingBand {
  const i = levelIndex(level)
  if (i <= levelIndex('A1_2')) return 'A1'
  if (i <= levelIndex('A2_2')) return 'A2'
  if (i <= levelIndex('B1_2')) return 'B1'
  return 'B2'
}

/** Khoảng số từ của một bậc + độ dài */
export function lengthRange(
  band: FreeWritingBand,
  length: FreeWritingLength
): { min: number; max: number } {
  return FREE_WRITING_RANGES[band][length]
}

/** Số từ so với khoảng của đề: thiếu / thừa / vừa (chỉ để gợi ý, không chặn lưu) */
export function lengthStatus(
  words: number,
  range: { min: number; max: number }
): 'short' | 'long' | 'ok' {
  return words < range.min ? 'short' : words > range.max ? 'long' : 'ok'
}

/**
 * Đề ngẫu nhiên ở một bậc, khác đề đang chọn nếu còn đề khác (nút "Đề khác"); bậc không có đề → null.
 * `random` trả số trong [0, 1) như Math.random (truyền vào để test).
 */
export function pickRandomTopic<T extends { id: string; band: FreeWritingBand }>(
  topics: readonly T[],
  band: FreeWritingBand,
  currentId: string | null,
  random: () => number = Math.random
): T | null {
  const inBand = topics.filter((t) => t.band === band)
  const pool = inBand.length > 1 ? inBand.filter((t) => t.id !== currentId) : inBand
  if (!pool.length) return null
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
}
