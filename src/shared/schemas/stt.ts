import { z } from 'zod'
import { STT_MAX_SAMPLES } from '../speech'

/** Âm thanh ghi từ micro: PCM float 16 kHz mono, tối đa 30 giây */
export const SttTranscribeInputSchema = z.object({
  audio: z.custom<Float32Array>((v) => v instanceof Float32Array && v.length <= STT_MAX_SAMPLES)
})

export const SttWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number()
})

export const SttTranscribeResultSchema = z.object({
  /** Lời nhận dạng */
  text: z.string(),
  /** Từng từ kèm mốc thời gian (giây) */
  words: z.array(SttWordSchema)
})
export type SttTranscribeResult = z.infer<typeof SttTranscribeResultSchema>

/** Chấm phát âm: âm thanh + văn bản cần nói (từ/câu/chữ cái) */
export const PronEvaluateInputSchema = z.object({
  audio: z.custom<Float32Array>((v) => v instanceof Float32Array && v.length <= STT_MAX_SAMPLES),
  text: z.string().trim().min(1).max(200)
})

/** Chuỗi âm vị mong đợi (espeak IPA) và chuỗi nghe được; so khớp bằng shared/phonemes.ts */
export const PronunciationEvaluationSchema = z.object({
  expected: z.array(z.string()),
  heard: z.array(z.string())
})
export type PronunciationEvaluation = z.infer<typeof PronunciationEvaluationSchema>

/** Tuỳ chọn tải về thêm (model phát âm âm vị): người dùng tự chọn tải */
export const PronunciationStatusSchema = z.object({
  /** false = chưa có bản model chính thức để tải */
  available: z.boolean(),
  state: z.enum(['not-installed', 'downloading', 'ready', 'error']),
  sizeBytes: z.number(),
  receivedBytes: z.number(),
  errorKey: z.string().nullable()
})
export type PronunciationStatus = z.infer<typeof PronunciationStatusSchema>
