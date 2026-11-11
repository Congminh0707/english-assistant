import { z } from 'zod'
import { TRANSLATE_MAX_CHARS, WRITE_MAX_CHARS } from '../writing'
import { WritingFeedbackSchema } from './ai'
import { LessonKindSchema } from './lesson'

// Kênh writing:* (docs/07 "Luyện viết"): renderer chỉ gửi vị trí bài tập + chữ người học; main tự lấy đề/đáp án
// từ nội dung bài nên không đưa được chữ tuỳ ý vào phần đề của prompt AI.

const ExerciseRef = {
  kind: LessonKindSchema,
  lessonId: z.string().min(1).max(100),
  /** Chỉ số bài tập trong bài (0-based) */
  index: z.number().int().min(0).max(11)
}

export const TranslateCheckInputSchema = z.object({
  ...ExerciseRef,
  text: z.string().trim().min(1).max(TRANSLATE_MAX_CHARS)
})
export type TranslateCheckInput = z.infer<typeof TranslateCheckInputSchema>

/**
 * Kết quả chấm câu dịch. `aiReason`: khoá i18n lý do không dùng được AI (AI tắt, hết lượt hôm nay, lỗi...) khi câu
 * không khớp đáp án mẫu; null nếu khớp hoặc đã được AI xét. `corrected`/`note`: bản sửa và nhận xét của AI (nếu có).
 */
export const TranslateCheckResultSchema = z.object({
  correct: z.boolean(),
  gradedBy: z.enum(['match', 'ai', 'local']),
  corrected: z.string().nullable(),
  note: z.string().nullable(),
  aiReason: z.string().nullable()
})
export type TranslateCheckResult = z.infer<typeof TranslateCheckResultSchema>

export const WritingFeedbackRequestSchema = z.object({
  ...ExerciseRef,
  text: z.string().trim().min(1).max(WRITE_MAX_CHARS)
})
export type WritingFeedbackRequest = z.infer<typeof WritingFeedbackRequestSchema>

/** Kết quả chấm bài viết: `feedback` null khi chấm không có AI (đạt theo số từ), kèm `aiReason` như trên */
export const WritingResultSchema = z.object({
  passed: z.boolean(),
  gradedBy: z.enum(['ai', 'local']),
  words: z.number().int(),
  feedback: WritingFeedbackSchema.nullable(),
  aiReason: z.string().nullable()
})
export type WritingResult = z.infer<typeof WritingResultSchema>
