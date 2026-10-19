import { z } from 'zod'

/** Hoạt động một ngày (ngày cục bộ) */
export const StatsDaySchema = z.object({
  day: z.string(),
  reviews: z.number().int(),
  /** Từ mới đã lưu */
  saved: z.number().int(),
  /** Phiên luyện tập đã hoàn thành */
  practice: z.number().int(),
  xp: z.number().int()
})
export type StatsDay = z.infer<typeof StatsDaySchema>

export const StatsSchema = z.object({
  /** Các ngày gần nhất, cũ nhất trước, đủ cả ngày không học */
  days: z.array(StatsDaySchema),
  totals: z.object({
    reviews: z.number().int(),
    savedWords: z.number().int(),
    xp: z.number().int(),
    practiceSessions: z.number().int(),
    activeDays: z.number().int(),
    /** Tỉ lệ lần ôn nhớ được (chấm Khó/Được/Dễ), 0–1; null nếu chưa ôn lần nào */
    retention: z.number().nullable(),
    streak: z.number().int(),
    longestStreak: z.number().int()
  }),
  /** Số thẻ theo trạng thái FSRS */
  cardStates: z.object({
    new: z.number().int(),
    learning: z.number().int(),
    review: z.number().int(),
    relearning: z.number().int()
  }),
  /** Số từ trong sổ theo level (chỉ các level có từ) */
  levels: z.array(z.object({ level: z.string(), count: z.number().int() })),
  /** 7 ngày gần nhất so với 7 ngày trước đó */
  week: z.object({
    reviews: z.number().int(),
    prevReviews: z.number().int(),
    xp: z.number().int(),
    prevXp: z.number().int(),
    saved: z.number().int(),
    prevSaved: z.number().int()
  })
})
export type Stats = z.infer<typeof StatsSchema>
