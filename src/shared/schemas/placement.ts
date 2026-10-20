import { z } from 'zod'
import { LevelCode } from './content/level'

/** Kỹ năng được kiểm tra: từ vựng, ngữ pháp, đọc hiểu */
export const PlacementSkillSchema = z.enum(['vocab', 'grammar', 'reading', 'listening'])
export type PlacementSkill = z.infer<typeof PlacementSkillSchema>

/** Một câu của bài kiểm tra: chọn nghĩa đúng của từ / điền chỗ trống / trả lời câu hỏi đọc hiểu (hoặc "không biết") */
export const PlacementQuestionSchema = z.object({
  kind: PlacementSkillSchema,
  sessionId: z.string(),
  /** Id câu hỏi — gửi lại khi trả lời */
  id: z.string(),
  /** Số thứ tự câu (bắt đầu từ 1) */
  index: z.number().int(),
  total: z.number().int(),
  /** Từ cần chọn nghĩa (kind = vocab); các dạng khác để rỗng */
  lemma: z.string(),
  ipa: z.string().nullable(),
  /** Câu hỏi: câu có chỗ trống "___" (grammar) hoặc câu hỏi đọc hiểu (reading) */
  prompt: z.string().nullable(),
  /** Đoạn văn ngắn (reading) */
  passage: z.string().nullable(),
  /** Câu đọc bằng TTS (listening) */
  say: z.string().nullable(),
  choices: z.array(z.string()).min(2).max(4)
})
export type PlacementQuestion = z.infer<typeof PlacementQuestionSchema>

/** Trình độ theo từng kỹ năng đã được kiểm tra */
export const PlacementSkillResultSchema = z.object({
  skill: PlacementSkillSchema,
  level: LevelCode,
  cefr: z.string(),
  correct: z.number().int(),
  total: z.number().int()
})
export type PlacementSkillResult = z.infer<typeof PlacementSkillResultSchema>

export const PlacementResultSchema = z.object({
  /** Trình độ chung (trung bình có trọng số các kỹ năng) */
  level: LevelCode,
  /** Nhãn CEFR hiển thị: 'A2', 'Pre-A1'... */
  cefr: z.string(),
  correct: z.number().int(),
  total: z.number().int(),
  skills: z.array(PlacementSkillResultSchema),
  /** Chỉ có khi là bài kiểm tra lên cấp */
  checkpoint: z
    .object({
      passed: z.boolean(),
      from: LevelCode,
      /** Level mới nếu đạt, ngược lại null */
      to: LevelCode.nullable(),
      /** Lần đầu qua bậc này nên có thưởng */
      xp: z.number().int(),
      coins: z.number().int()
    })
    .nullable()
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

// --- Ngân hàng câu hỏi ngữ pháp / đọc hiểu: content/curated/placement/*.json (tự soạn) ---

const Text = z.string().trim().min(1)

export const PlacementItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  level: LevelCode,
  /** Ngữ pháp: câu có đúng một chỗ trống "___". Đọc hiểu: câu hỏi. */
  prompt: Text,
  /** Chỉ dùng cho đọc hiểu */
  passage: Text.optional(),
  /** Chỉ dùng cho nghe: câu đọc bằng TTS (không hiển thị) */
  say: Text.optional(),
  choices: z.array(Text).min(2).max(4),
  answer: z.number().int().min(0).max(3)
})
export type PlacementItem = z.infer<typeof PlacementItemSchema>

export const PlacementBankFileSchema = z.object({
  license: z.literal('proprietary-own'),
  skill: z.enum(['grammar', 'reading', 'listening']),
  items: z.array(PlacementItemSchema).min(1)
})
export type PlacementBankFile = z.infer<typeof PlacementBankFileSchema>
