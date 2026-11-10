import { z } from 'zod'

/** Model Claude người dùng chọn cho AI (docs/11 §5, docs/decisions.md #56) */
export const AI_MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5'] as const
export const AiModelSchema = z.enum(AI_MODELS)
export type AiModel = z.infer<typeof AiModelSchema>

/** Trạng thái AI cho renderer: đã bật (và không phải hồ sơ trẻ em), đã có key Claude, số lượt gọi tháng này */
export const AiStatusSchema = z.object({
  enabled: z.boolean(),
  hasKey: z.boolean(),
  callsThisMonth: z.number().int().nonnegative()
})
export type AiStatus = z.infer<typeof AiStatusSchema>

/** Kênh ai:explain — câu cần giải thích ngữ pháp + câu hỏi thêm (tuỳ chọn) */
export const AI_EXPLAIN_MAX_CHARS = 600
export const AiExplainInputSchema = z.object({
  sentence: z.string().min(1).max(AI_EXPLAIN_MAX_CHARS),
  question: z.string().max(200).optional()
})
export type AiExplainInput = z.infer<typeof AiExplainInputSchema>

const ExampleSchema = z.object({ en: z.string().min(1), vi: z.string() })

/** Kết quả tác vụ grammar_explain (JSON do model trả về, đã validate) */
export const GrammarExplainSchema = z.object({
  explanation_vi: z.string().min(1),
  pattern: z.string(),
  // Không giới hạn số ví dụ ở schema (AiService chỉ giữ 3): model trả dư thì không phải gọi lại tốn tiền
  examples: z.array(ExampleSchema)
})
export type GrammarExplain = z.infer<typeof GrammarExplainSchema>

/** Đầu vào tác vụ diary_correct (DiaryService.correct) */
export interface DiaryCorrectInput {
  text: string
  level: string
}

/** Kết quả tác vụ diary_correct */
export const DiaryCorrectSchema = z.object({
  corrected: z.string(),
  changes: z.array(z.object({ from: z.string(), to: z.string(), note_vi: z.string() })),
  praise_vi: z.string()
})
export type DiaryCorrect = z.infer<typeof DiaryCorrectSchema>
