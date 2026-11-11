import { z } from 'zod'
import {
  RESPOND_MAX_CHARS,
  RESPOND_MAX_TIME_SEC,
  RESPOND_MAX_WORD_CHARS,
  RESPOND_MAX_WORDS
} from '../speaking'
import { SpeakingFeedbackSchema } from './ai'
import { LessonKindSchema } from './lesson'

// Kênh speaking:feedback (docs/07 "Trả lời câu hỏi bằng giọng nói"): renderer chỉ gửi vị trí bài tập + lời nhận dạng
// Whisper (chữ, không bao giờ là âm thanh) + mốc thời gian từng từ; main tự lấy câu hỏi/câu mẫu từ nội dung bài và tự
// tính lại số liệu trôi chảy, nên không đưa được chữ tuỳ ý vào phần câu hỏi của prompt AI.

const Time = z.number().min(0).max(RESPOND_MAX_TIME_SEC)

export const SpeakingWordSchema = z
  .object({
    word: z.string().max(RESPOND_MAX_WORD_CHARS),
    start: Time,
    end: Time
  })
  .refine((w) => w.end >= w.start, { message: 'end < start' })

export const SpeakingFeedbackRequestSchema = z.object({
  kind: LessonKindSchema,
  lessonId: z.string().min(1).max(100),
  /** Chỉ số bài tập trong bài (0-based) */
  index: z.number().int().min(0).max(11),
  transcript: z.string().trim().min(1).max(RESPOND_MAX_CHARS),
  words: z.array(SpeakingWordSchema).max(RESPOND_MAX_WORDS),
  /**
   * Người học đã bấm "Nhận xét bằng AI" (đã thấy dòng báo lời nhận dạng được gửi cho Claude). false = chấm tại máy,
   * main không bao giờ gọi AI dù AI đang bật.
   */
  useAi: z.boolean()
})
export type SpeakingFeedbackRequest = z.infer<typeof SpeakingFeedbackRequestSchema>

export const AnswerFluencySchema = z.object({
  wordCount: z.number().int(),
  speakingSec: z.number().nullable(),
  wpm: z.number().int().nullable(),
  longPauses: z.number().int().nullable(),
  repetitions: z.number().int(),
  fillers: z.number().int()
})

/**
 * Kết quả chấm câu trả lời nói: `feedback` null khi chấm tại máy (đạt theo số từ). `aiReason`: khoá i18n lý do không
 * có nhận xét AI khi đã yêu cầu AI (AI tắt, hết lượt, bận, lỗi...) hoặc khi AI chưa dùng được; null khi AI đã chấm hoặc
 * người học chọn chấm tại máy trong lúc AI dùng được. `fluency`: số liệu main tính từ mốc thời gian.
 */
export const SpeakingResultSchema = z.object({
  passed: z.boolean(),
  gradedBy: z.enum(['ai', 'local']),
  words: z.number().int(),
  fluency: AnswerFluencySchema,
  feedback: SpeakingFeedbackSchema.nullable(),
  aiReason: z.string().nullable()
})
export type SpeakingResult = z.infer<typeof SpeakingResultSchema>
