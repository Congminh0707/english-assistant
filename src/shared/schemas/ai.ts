import { z } from 'zod'

/** Model Claude người dùng chọn cho AI (docs/11 §5, docs/decisions.md #56) */
export const AI_MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5'] as const
export const AiModelSchema = z.enum(AI_MODELS)
export type AiModel = z.infer<typeof AiModelSchema>

/** Cài đặt `ai.provider`: tự chọn / chỉ key API / chỉ Claude Code CLI (gói Pro/Max, docs/decisions.md #57) */
export const AI_PROVIDER_SETTINGS = ['auto', 'api', 'cli'] as const
export const AiProviderSettingSchema = z.enum(AI_PROVIDER_SETTINGS)
/** Nhà cung cấp đang dùng thật */
export const AiProviderSchema = z.enum(['api', 'cli'])
export type AiProvider = z.infer<typeof AiProviderSchema>
/** Trạng thái Claude Code CLI: chưa kiểm tra / sẵn sàng / chưa cài (hoặc chỉ có .cmd) / chưa đăng nhập / lỗi khi kiểm tra */
export const AiCliStateSchema = z.enum(['unknown', 'ready', 'missing', 'loggedOut', 'error'])
export type AiCliState = z.infer<typeof AiCliStateSchema>

/**
 * Trạng thái AI cho renderer: đã bật (và không phải hồ sơ trẻ em), có nhà cung cấp dùng được (`ready`) và đó là gì,
 * trạng thái CLI, lượt CLI hôm nay / hạn mức ngày, tổng lượt gọi tháng này
 */
export const AiStatusSchema = z.object({
  enabled: z.boolean(),
  ready: z.boolean(),
  provider: AiProviderSchema.nullable(),
  cliAvailable: z.boolean(),
  cliState: AiCliStateSchema,
  cliCallsToday: z.number().int().nonnegative(),
  cliDailyLimit: z.number().int().nonnegative(),
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
