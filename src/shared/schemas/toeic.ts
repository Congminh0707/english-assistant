import { z } from 'zod'
import { LevelCode } from './content/level'

/** 7 Part của TOEIC Listening & Reading (docs/07 §12) */
export const ToeicPartSchema = z.number().int().min(1).max(7)
export type ToeicPart = z.infer<typeof ToeicPartSchema>

export const ToeicModeSchema = z.enum(['part', 'mini', 'full'])
export type ToeicMode = z.infer<typeof ToeicModeSchema>

// --- Ngân hàng câu: content/curated/toeic/*.json (tự soạn, AI sinh + tự duyệt) ---

const Text = z.string().trim().min(1)

export const ToeicQuestionItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Câu hỏi hiển thị. Part 1–2 để trống (nghe rồi chọn A/B/C(/D)); Part 5 là câu có chỗ trống "___" */
  prompt: z.string().trim().default(''),
  /** Part 1, 4 lựa chọn; Part 2, 3 lựa chọn; Part 3–7, 4 lựa chọn. Part 1–2: lời đọc của từng lựa chọn */
  choices: z.array(Text).min(3).max(4),
  answer: z.number().int().min(0).max(3),
  /** Giải thích ngắn bằng tiếng Việt, hiện ở màn xem lại */
  explain: Text
})
export type ToeicQuestionItem = z.infer<typeof ToeicQuestionItemSchema>

/** Một nhóm: Part 1–2, 5 mỗi nhóm một câu; Part 3–4 ba câu chung một đoạn nghe; Part 6 bốn câu; Part 7 hai–năm câu */
export const ToeicGroupSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    part: ToeicPartSchema,
    level: LevelCode,
    /** Part 2: câu hỏi/câu nói đầu. Part 3–4: hội thoại (dòng "Speaker: lời") hoặc bài nói. Part 1 không cần: app đọc từng lựa chọn */
    script: Text.optional(),
    /** Part 1: mô tả bức tranh bằng chữ (ảnh nằm ở renderer/study/art/toeic/<id>.webp; chữ này là chú thích/alt) */
    scene: Text.optional(),
    /** Part 3–4: câu hỏi có thể kèm đồ hoạ nhỏ (bảng giờ, danh sách...) dạng văn bản */
    context: Text.optional(),
    /** Part 6–7: đoạn văn (Part 6 chỗ trống đánh dấu "[1]", "[2]"...) */
    passage: Text.optional(),
    questions: z.array(ToeicQuestionItemSchema).min(1).max(5)
  })
  .superRefine((g, ctx) => {
    const need = (ok: boolean, message: string): void => {
      if (!ok) ctx.addIssue({ code: 'custom', message: `${g.id}: ${message}` })
    }
    const n = g.questions.length
    if (g.part >= 2 && g.part <= 4) need(!!g.script, 'Part 2–4 cần script')
    if (g.part === 1) need(!!g.scene, 'Part 1 cần scene')
    if (g.part >= 6) need(!!g.passage, 'Part 6–7 cần passage')
    if (g.part === 1 || g.part === 2 || g.part === 5) need(n === 1, 'Part 1, 2, 5 mỗi nhóm một câu')
    if (g.part === 3 || g.part === 4) need(n === 3, 'Part 3–4 mỗi nhóm ba câu')
    if (g.part === 6) need(n === 4, 'Part 6 mỗi nhóm bốn câu')
    if (g.part === 7) need(n >= 2 && n <= 5, 'Part 7 mỗi nhóm 2–5 câu')
    for (const q of g.questions) {
      const want = g.part === 2 ? 3 : 4
      need(q.choices.length === want, `câu ${q.id}: Part ${g.part} cần ${want} lựa chọn`)
      need(q.answer < q.choices.length, `câu ${q.id}: answer ngoài số lựa chọn`)
      if (g.part >= 3) need(q.prompt.length > 0, `câu ${q.id}: cần prompt`)
    }
  })
export type ToeicGroup = z.infer<typeof ToeicGroupSchema>

export const ToeicBankFileSchema = z.object({
  license: z.literal('proprietary-own'),
  /** Model đã sinh, ví dụ "claude-opus-5-5"; chủ dự án chốt: AI tự sinh, tự duyệt */
  generator: Text,
  reviewed: z.boolean(),
  groups: z.array(ToeicGroupSchema).min(1)
})
export type ToeicBankFile = z.infer<typeof ToeicBankFileSchema>

// --- IPC ---

/** Câu gửi xuống renderer — không có đáp án và lời giải */
export const ToeicQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  choices: z.array(z.string())
})

export const ToeicGroupViewSchema = z.object({
  id: z.string(),
  part: ToeicPartSchema,
  /** Lời đọc TTS (Part 1–4); renderer không được hiện ra trước khi nộp bài */
  script: z.string().nullable(),
  scene: z.string().nullable(),
  context: z.string().nullable(),
  passage: z.string().nullable(),
  questions: z.array(ToeicQuestionSchema)
})
export type ToeicGroupView = z.infer<typeof ToeicGroupViewSchema>

export const ToeicStartInputSchema = z.object({
  mode: ToeicModeSchema,
  /** Bắt buộc khi mode = 'part' */
  part: ToeicPartSchema.optional()
})

export const ToeicSessionSchema = z.object({
  sessionId: z.string(),
  mode: ToeicModeSchema,
  /** Giới hạn thời gian (giây); null = luyện theo Part không giới hạn */
  timeLimitSec: z.number().int().nullable(),
  totalQuestions: z.number().int(),
  groups: z.array(ToeicGroupViewSchema)
})
export type ToeicSession = z.infer<typeof ToeicSessionSchema>

/** null = chưa đủ câu trong ngân hàng cho chế độ này */
export const ToeicStartResultSchema = z.object({ session: ToeicSessionSchema.nullable() })

export const ToeicSubmitInputSchema = z.object({
  sessionId: z.string(),
  /** questionId → chỉ số lựa chọn; null = bỏ trống */
  answers: z.record(z.string(), z.number().int().min(0).max(3).nullable()),
  elapsedSec: z.number().int().min(0)
})

export const ToeicPartResultSchema = z.object({
  part: ToeicPartSchema,
  correct: z.number().int(),
  total: z.number().int()
})

export const ToeicReviewItemSchema = z.object({
  groupId: z.string(),
  questionId: z.string(),
  picked: z.number().int().nullable(),
  answer: z.number().int(),
  explain: z.string()
})

/** Điểm ước lượng theo thang TOEIC (Listening/Reading 5–495, tổng 10–990). Chỉ là ước lượng. */
export const ToeicEstimateSchema = z.object({
  listening: z.number().int().nullable(),
  reading: z.number().int().nullable(),
  total: z.number().int()
})

export const ToeicResultSchema = z.object({
  mode: ToeicModeSchema,
  correct: z.number().int(),
  total: z.number().int(),
  parts: z.array(ToeicPartResultSchema),
  estimate: ToeicEstimateSchema,
  /** Lần đầu làm xong full/mini trong ngày có thưởng nhỏ */
  xp: z.number().int(),
  review: z.array(ToeicReviewItemSchema)
})
export type ToeicResult = z.infer<typeof ToeicResultSchema>

export const ToeicBankInfoSchema = z.object({
  /** Số câu trong ngân hàng theo Part (index 0 = Part 1) */
  questionsByPart: z.array(z.number().int()).length(7),
  /** Chế độ nào làm được với ngân hàng hiện tại */
  mini: z.boolean(),
  full: z.boolean()
})
export type ToeicBankInfo = z.infer<typeof ToeicBankInfoSchema>

export const ToeicAttemptSchema = z.object({
  id: z.string(),
  mode: ToeicModeSchema,
  part: z.number().int().nullable(),
  correct: z.number().int(),
  total: z.number().int(),
  estTotal: z.number().int(),
  elapsedSec: z.number().int(),
  finishedAt: z.number().int()
})
export type ToeicAttempt = z.infer<typeof ToeicAttemptSchema>
