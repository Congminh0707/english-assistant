import { z } from 'zod'

/** Hoạt động một ngày (ngày cục bộ) */
export const StatsDaySchema = z.object({
  day: z.string(),
  reviews: z.number().int(),
  /** Từ mới đã lưu */
  saved: z.number().int(),
  /** Phiên luyện tập đã hoàn thành */
  practice: z.number().int(),
  xp: z.number().int(),
  /** Số phút dùng app trong ngày */
  minutes: z.number().int()
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
    longestStreak: z.number().int(),
    lessonsCompleted: z.number().int()
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
  /** Độ chính xác 30 ngày gần nhất theo dạng bài (kể cả thẻ ôn theo hướng thẻ) */
  accuracy: z.array(
    z.object({
      /** exercise: bài tập; review: thẻ ôn */
      group: z.enum(['exercise', 'review']),
      kind: z.string(),
      skill: z.string(),
      correct: z.number().int(),
      total: z.number().int()
    })
  ),
  /** Rating Elo theo kỹ năng (đã đổi ra level); hồ sơ trẻ em không có `writing` */
  skills: z.array(
    z.object({
      skill: z.string(),
      rating: z.number().int(),
      level: z.string(),
      games: z.number().int(),
      /** Đủ dữ liệu để tin rating */
      reliable: z.boolean(),
      /**
       * Rating vượt level hiện tại bấy nhiêu bậc (từ 1 trở lên → gợi ý làm bài kiểm tra lên cấp). Luôn 0 với `writing`:
       * bài kiểm tra lên cấp không đo Viết (decisions #62).
       */
      ahead: z.number().int()
    })
  ),
  /** Viết tự do của hồ sơ đang dùng (bảng free_writing_entries); null với hồ sơ trẻ em */
  writing: z
    .object({
      entries: z.number().int(),
      words: z.number().int(),
      /** Số bài đang có nhận xét AI */
      withFeedback: z.number().int(),
      /** Điểm AI trung bình 0–100 của các bài đang có nhận xét; null nếu chưa có */
      averageScore: z.number().int().nullable(),
      /** Số bài viết trong 30 ngày gần nhất */
      recent: z.number().int()
    })
    .nullable(),
  /** Thời gian dùng app */
  time: z.object({
    todayMinutes: z.number().int(),
    weekMinutes: z.number().int(),
    totalMinutes: z.number().int()
  }),
  /** Từ hay quên nhất (nhiều lần quên nhất trước) */
  hardest: z.array(
    z.object({
      contentId: z.string(),
      text: z.string(),
      lapses: z.number().int(),
      reps: z.number().int()
    })
  ),
  /** Thành tựu: tiến độ và trạng thái mở khoá */
  achievements: z.array(
    z.object({
      id: z.string(),
      group: z.string(),
      glyph: z.string(),
      tier: z.enum(['bronze', 'silver', 'gold', 'diamond']),
      current: z.number().int(),
      target: z.number().int(),
      unlocked: z.boolean()
    })
  ),
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
