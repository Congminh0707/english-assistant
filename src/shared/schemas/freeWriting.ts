import { z } from 'zod'
import {
  FREE_TOPIC_MAX_CHARS,
  FREE_WRITING_BANDS,
  FREE_WRITING_LENGTHS,
  FREE_WRITING_MAX_CHARS
} from '../freeWriting'
import { WritingFeedbackSchema } from './ai'
import { LevelCode } from './content/level'

// Viết tự do theo đề (docs/07 "Viết tự do"). Đề tự soạn: content/curated/free-writing/*.json. Kênh free-writing:*:
// renderer chỉ gửi mã đề (main tự lấy chữ đề từ nội dung) hoặc đề tự đặt ≤ 200 ký tự; chữ đề luôn đi vào prompt AI
// dưới dạng dữ liệu trong thẻ <task>.

const Text = z.string().trim().min(1)

export const FreeWritingBandSchema = z.enum(FREE_WRITING_BANDS)
export const FreeWritingLengthSchema = z.enum(FREE_WRITING_LENGTHS)

/** Một đề trong file nội dung */
export const FreeWritingTopicSchema = z.object({
  /** Mã đề ổn định, vd 'a1-my-family' */
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(60),
  level: LevelCode,
  /** Tên ngắn tiếng Việt (hiện trong danh sách) */
  title: Text.max(60),
  /** Yêu cầu của đề: tiếng Việt cho A1–A2, tiếng Anh (có thể kèm tiếng Việt) từ B1 */
  prompt: Text.max(400),
  /** 3–5 câu hỏi gợi ý / cụm từ hữu ích (tuỳ chọn dùng) */
  hints: z.array(Text.max(120)).min(3).max(5)
})
export type FreeWritingTopicContent = z.infer<typeof FreeWritingTopicSchema>

export const FreeWritingTopicFileSchema = z.object({
  license: z.literal('proprietary-own'),
  topics: z.array(FreeWritingTopicSchema).min(1)
})

/** Đề gửi cho giao diện: kèm bậc lọc (A1–B2) suy từ level */
export const FreeWritingTopicViewSchema = FreeWritingTopicSchema.extend({
  band: FreeWritingBandSchema
})
export type FreeWritingTopic = z.infer<typeof FreeWritingTopicViewSchema>

/** Một bài đã lưu (đủ chi tiết) */
export const FreeWritingEntrySchema = z.object({
  id: z.string(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  /** Mã đề tự soạn; null = đề tự đặt */
  topicId: z.string().nullable(),
  /** Tên hiện trong danh sách (tên đề, hoặc đề tự đặt) */
  title: z.string(),
  /** Chữ đề như đã hiện cho người học (được gửi cho AI) */
  task: z.string(),
  band: FreeWritingBandSchema,
  length: FreeWritingLengthSchema,
  /** Khoảng số từ lúc viết (giữ lại để chấm lại sau cùng khoảng đã hiện) */
  minWords: z.number().int(),
  maxWords: z.number().int(),
  text: z.string(),
  words: z.number().int(),
  /** Nhận xét AI gần nhất; null = chưa có (AI không dùng được, hoặc đã sửa chữ sau lần nhận xét) */
  feedback: WritingFeedbackSchema.nullable(),
  score: z.number().int().nullable()
})
export type FreeWritingEntry = z.infer<typeof FreeWritingEntrySchema>

/** Một dòng trong danh sách bài đã viết */
export const FreeWritingSummarySchema = z.object({
  id: z.string(),
  createdAt: z.number().int(),
  title: z.string(),
  words: z.number().int(),
  score: z.number().int().nullable()
})
export type FreeWritingSummary = z.infer<typeof FreeWritingSummarySchema>

/** Kênh free-writing:view: danh sách đề, bậc mặc định theo trình độ, AI dùng được không */
export const FreeWritingViewSchema = z.object({
  /** Hồ sơ đang dùng: store đặt lại bản nháp / bài đang mở khi đổi hồ sơ */
  profileId: z.string(),
  topics: z.array(FreeWritingTopicViewSchema),
  band: FreeWritingBandSchema,
  aiReady: z.boolean()
})
export type FreeWritingView = z.infer<typeof FreeWritingViewSchema>

const EntryText = z.string().trim().min(1).max(FREE_WRITING_MAX_CHARS)
const EntryId = z.string().min(1).max(64)

/** Đề của bài mới: mã đề tự soạn, hoặc đề tự đặt (kèm bậc đang chọn để tính khoảng số từ) */
export const FreeWritingTopicRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('topic'), id: z.string().min(1).max(60) }),
  z.object({
    kind: z.literal('custom'),
    text: z.string().trim().min(1).max(FREE_TOPIC_MAX_CHARS),
    band: FreeWritingBandSchema
  })
])
export type FreeWritingTopicRef = z.infer<typeof FreeWritingTopicRefSchema>

/** Kênh free-writing:create */
export const FreeWritingCreateInputSchema = z.object({
  topic: FreeWritingTopicRefSchema,
  length: FreeWritingLengthSchema,
  text: EntryText
})
export type FreeWritingCreateInput = z.infer<typeof FreeWritingCreateInputSchema>

/** Kênh free-writing:update — chỉ sửa chữ (đề và độ dài giữ nguyên) */
export const FreeWritingUpdateInputSchema = z.object({ id: EntryId, text: EntryText })
export type FreeWritingUpdateInput = z.infer<typeof FreeWritingUpdateInputSchema>

/** Kênh free-writing:get / :delete / :feedback */
export const FreeWritingIdInputSchema = z.object({ id: EntryId })

/** Kênh free-writing:list — phân trang theo offset, mới nhất trước */
export const FreeWritingListInputSchema = z.object({
  offset: z.number().int().min(0).max(100_000)
})
export const FreeWritingListSchema = z.object({
  entries: z.array(FreeWritingSummarySchema),
  total: z.number().int()
})
export type FreeWritingList = z.infer<typeof FreeWritingListSchema>

/**
 * Kênh free-writing:feedback: bài sau khi nhận xét. `aiReason`: khoá i18n lý do không có nhận xét (AI tắt, hết lượt,
 * lỗi...) — bài vẫn được giữ, có thể bấm lại sau; `stale`: chữ đã đổi trong lúc chờ AI nên nhận xét bị bỏ.
 */
export const FreeWritingFeedbackResultSchema = z.object({
  entry: FreeWritingEntrySchema,
  aiReason: z.string().nullable(),
  stale: z.boolean()
})
export type FreeWritingFeedbackResult = z.infer<typeof FreeWritingFeedbackResultSchema>
