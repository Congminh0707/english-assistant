import { z } from 'zod'

/** Các dạng bài luyện tập (docs/07-learning-modules.md#dạng-bài-tập) */
export const EXERCISE_KINDS = [
  'cloze',
  'word_order',
  'listen_choice',
  'dictation',
  'match_pairs'
] as const
export const ExerciseKindSchema = z.enum(EXERCISE_KINDS)
export type ExerciseKind = z.infer<typeof ExerciseKindSchema>

const Base = z.object({
  sessionId: z.string(),
  /** Id bài — gửi lại khi trả lời */
  id: z.string(),
  /** Số thứ tự trong phiên (bắt đầu từ 1) */
  index: z.number().int(),
  total: z.number().int()
})

/** Điền từ vào chỗ trống: chọn từ đúng trong 4 từ */
export const ClozeExerciseSchema = Base.extend({
  kind: z.literal('cloze'),
  /** Câu có chỗ trống "____" */
  prompt: z.string(),
  /** Gợi ý nghĩa tiếng Việt của cả câu (nếu có) */
  hintVi: z.string().nullable(),
  choices: z.array(z.string()).min(2).max(4)
})

/** Sắp xếp các từ thành câu đúng */
export const WordOrderExerciseSchema = Base.extend({
  kind: z.literal('word_order'),
  hintVi: z.string(),
  /** Các từ đã xáo trộn */
  tokens: z.array(z.string())
})

/** Nghe câu tiếng Anh, chọn bản dịch tiếng Việt đúng */
export const ListenChoiceExerciseSchema = Base.extend({
  kind: z.literal('listen_choice'),
  /** Văn bản để đọc bằng TTS (không hiển thị) */
  audioText: z.string(),
  choices: z.array(z.string()).min(2).max(4)
})

/** Nghe rồi gõ lại câu */
export const DictationExerciseSchema = Base.extend({
  kind: z.literal('dictation'),
  /** Văn bản để đọc bằng TTS (không hiển thị) */
  audioText: z.string(),
  wordCount: z.number().int()
})

/** Ghép từ tiếng Anh với nghĩa tiếng Việt */
export const MatchPairsExerciseSchema = Base.extend({
  kind: z.literal('match_pairs'),
  left: z.array(z.string()),
  /** Nghĩa tiếng Việt đã xáo trộn */
  right: z.array(z.string())
})

export const ExerciseSchema = z.discriminatedUnion('kind', [
  ClozeExerciseSchema,
  WordOrderExerciseSchema,
  ListenChoiceExerciseSchema,
  DictationExerciseSchema,
  MatchPairsExerciseSchema
])
export type Exercise = z.infer<typeof ExerciseSchema>

export const PracticeAnswerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('cloze'), choice: z.number().int().min(0).max(3) }),
  z.object({
    kind: z.literal('word_order'),
    /** Chỉ số các từ (trong `tokens`) theo thứ tự người dùng xếp */
    order: z.array(z.number().int().min(0).max(30)).max(31)
  }),
  z.object({ kind: z.literal('listen_choice'), choice: z.number().int().min(0).max(3) }),
  z.object({ kind: z.literal('dictation'), text: z.string().max(400) }),
  z.object({
    kind: z.literal('match_pairs'),
    /** Với mỗi từ bên trái, chỉ số nghĩa bên phải người dùng chọn */
    mapping: z.array(z.number().int().min(0).max(9)).max(10)
  })
])
export type PracticeAnswer = z.infer<typeof PracticeAnswerSchema>

export const PracticeStartInputSchema = z.object({
  /** 'mixed' = trộn các dạng bài */
  mode: z.union([z.literal('mixed'), ExerciseKindSchema])
})
export const PracticeStartResultSchema = z.object({
  /** null nếu chưa có gói từ điển / không đủ dữ liệu */
  exercise: ExerciseSchema.nullable()
})

export const PracticeSummarySchema = z.object({
  correct: z.number().int(),
  total: z.number().int(),
  xp: z.number().int(),
  coins: z.number().int()
})
export type PracticeSummary = z.infer<typeof PracticeSummarySchema>

export const PracticeAnswerInputSchema = z.object({
  sessionId: z.string(),
  exerciseId: z.string(),
  answer: PracticeAnswerSchema
})
export const PracticeAnswerResultSchema = z.object({
  correct: z.boolean(),
  /** Đáp án đúng (dạng chữ) để hiển thị sau khi trả lời */
  solution: z.string(),
  /** Dictation: tỉ lệ từ đúng (0–1) */
  accuracy: z.number().nullable(),
  next: ExerciseSchema.nullable(),
  summary: PracticeSummarySchema.nullable()
})
export type PracticeAnswerResult = z.infer<typeof PracticeAnswerResultSchema>
