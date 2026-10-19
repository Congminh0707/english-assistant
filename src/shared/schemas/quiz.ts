import { z } from 'zod'

/** Mascot hỏi ôn một thẻ SRS đến hạn: chọn nghĩa đúng trong 4 đáp án */
export const ReviewQuizSchema = z.object({
  kind: z.literal('review'),
  id: z.string(),
  lemma: z.string(),
  ipa: z.string().nullable(),
  pos: z.array(z.string()),
  choices: z.array(z.string()).min(2).max(4),
  /** Số thẻ còn đến hạn (kể cả thẻ này) */
  dueCount: z.number().int()
})

/** "Từ của khoảnh khắc": giới thiệu một từ mới đúng trình độ, người dùng có thể lưu */
export const NewWordQuizSchema = z.object({
  kind: z.literal('new'),
  id: z.string(),
  wordId: z.string(),
  lemma: z.string(),
  ipa: z.string().nullable(),
  pos: z.array(z.string()),
  level: z.string(),
  vi: z.array(z.string()),
  example: z.object({ en: z.string(), vi: z.string().nullable() }).nullable()
})

export const QuizSchema = z.discriminatedUnion('kind', [ReviewQuizSchema, NewWordQuizSchema])
export type Quiz = z.infer<typeof QuizSchema>
export type ReviewQuiz = z.infer<typeof ReviewQuizSchema>
export type NewWordQuiz = z.infer<typeof NewWordQuizSchema>

export const QuizAnswerInputSchema = z.object({
  quizId: z.string(),
  choiceIndex: z.number().int().min(0).max(3),
  /** Thời gian từ lúc hiện câu hỏi tới lúc trả lời (đo ở renderer) */
  elapsedMs: z.number().int().min(0).max(600_000)
})

export const QuizAnswerResultSchema = z.object({
  correct: z.boolean(),
  correctIndex: z.number().int(),
  correctText: z.string(),
  /** Bao lâu nữa ôn lại thẻ này (ngày, có thể < 1 với thẻ đang học) */
  intervalDays: z.number()
})
export type QuizAnswerResult = z.infer<typeof QuizAnswerResultSchema>
