import { z } from 'zod'
import { LevelCode } from './content/level'

/** Một câu của bài kiểm tra: chọn nghĩa đúng của từ (hoặc "không biết") */
export const PlacementQuestionSchema = z.object({
  sessionId: z.string(),
  /** Id câu hỏi — gửi lại khi trả lời */
  id: z.string(),
  /** Số thứ tự câu (bắt đầu từ 1) */
  index: z.number().int(),
  total: z.number().int(),
  lemma: z.string(),
  ipa: z.string().nullable(),
  choices: z.array(z.string()).min(2).max(4)
})
export type PlacementQuestion = z.infer<typeof PlacementQuestionSchema>

export const PlacementResultSchema = z.object({
  level: LevelCode,
  /** Nhãn CEFR hiển thị: 'A2', 'Pre-A1'... */
  cefr: z.string(),
  correct: z.number().int(),
  total: z.number().int()
})
export type PlacementResult = z.infer<typeof PlacementResultSchema>

/** Bắt đầu bài kiểm tra → câu đầu tiên (null nếu chưa có gói từ điển) */
export const PlacementStartSchema = z.object({ question: PlacementQuestionSchema.nullable() })

export const PlacementAnswerInputSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  /** null = "Tôi không biết" */
  choiceIndex: z.number().int().min(0).max(3).nullable()
})

export const PlacementAnswerResultSchema = z.object({
  correct: z.boolean(),
  correctIndex: z.number().int(),
  correctText: z.string(),
  /** Câu tiếp theo; null khi đã hết bài */
  next: PlacementQuestionSchema.nullable(),
  /** Có khi hết bài — trình độ đã được lưu vào cài đặt */
  result: PlacementResultSchema.nullable()
})
export type PlacementAnswerResult = z.infer<typeof PlacementAnswerResultSchema>
