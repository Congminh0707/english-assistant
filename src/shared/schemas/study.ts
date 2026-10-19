import { z } from 'zod'
import { DictExampleSchema, DictSenseSchema } from './dictionary'

/** Số liệu trang chủ cửa sổ Học tập */
export const StudyOverviewSchema = z.object({
  /** Thẻ đã đến hạn ôn ngay bây giờ */
  dueCount: z.number().int(),
  /** Tổng số thẻ đang học (không tính thẻ đã xoá/tạm dừng) */
  totalCards: z.number().int(),
  /** Thẻ đã vào giai đoạn ôn dài hạn (FSRS state = Review) */
  learnedCards: z.number().int(),
  reviewedToday: z.number().int(),
  /** Số ngày liên tiếp có ôn từ (tính cả hôm nay; chưa ôn hôm nay thì tính tới hôm qua) */
  streakDays: z.number().int(),
  /** Chưa có gói từ điển nên không hiển thị được thẻ */
  packMissing: z.boolean()
})
export type StudyOverview = z.infer<typeof StudyOverviewSchema>

export const StudyRatingSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
export type StudyRating = z.infer<typeof StudyRatingSchema>

/** Một thẻ trong phiên ôn: hiện mặt trước (từ), lật ra mặt sau (nghĩa), rồi chấm 1–4 */
export const StudyCardSchema = z.object({
  cardId: z.string(),
  lemma: z.string(),
  ipaUs: z.string().nullable(),
  ipaUk: z.string().nullable(),
  pos: z.array(z.string()),
  level: z.string(),
  vi: z.array(z.string()),
  viGenerated: z.boolean(),
  senses: z.array(DictSenseSchema),
  examples: z.array(DictExampleSchema),
  /** Câu ngữ cảnh lúc người dùng lưu từ */
  context: z.string().nullable(),
  /** Thẻ mới học lần đầu (state = New) */
  isNew: z.boolean(),
  /** Bao lâu nữa sẽ ôn lại nếu chấm 1/2/3/4 (ngày; < 1 là thẻ đang học) */
  intervals: z.tuple([z.number(), z.number(), z.number(), z.number()])
})
export type StudyCard = z.infer<typeof StudyCardSchema>

export const StudyNextSchema = z.object({
  /** null = hết thẻ đến hạn (hoặc chưa có gói từ điển) */
  card: StudyCardSchema.nullable(),
  /** Số thẻ còn đến hạn, kể cả thẻ đang hiện */
  dueCount: z.number().int()
})
export type StudyNext = z.infer<typeof StudyNextSchema>

export const StudyRateInputSchema = z.object({
  cardId: z.string().min(1),
  rating: StudyRatingSchema,
  elapsedMs: z.number().int().min(0).max(600_000)
})

export const StudyRateResultSchema = z.object({
  intervalDays: z.number(),
  dueCount: z.number().int()
})
export type StudyRateResult = z.infer<typeof StudyRateResultSchema>

/** Một từ trong sổ từ */
export const WordListItemSchema = z.object({
  cardId: z.string(),
  contentId: z.string(),
  lemma: z.string(),
  vi: z.string().nullable(),
  level: z.string().nullable(),
  /** 0 Mới · 1 Đang học · 2 Ôn · 3 Học lại */
  state: z.number().int(),
  due: z.number(),
  reps: z.number().int(),
  lapses: z.number().int(),
  savedAt: z.number()
})
export type WordListItem = z.infer<typeof WordListItemSchema>
