import { z } from 'zod'
import { LevelCode } from './content/level'

// --- Danh mục video: content/curated/videos/*.json (docs/07 §10, docs/29 bước 3) ---
// Chỉ lưu videoId + mốc + câu hỏi tự soạn. Không tải video, không cào phụ đề.

const Text = z.string().trim().min(1)

export const VideoQuestionSchema = z
  .object({
    prompt: Text,
    choices: z.array(Text).min(2).max(4),
    answer: z.number().int().min(0).max(3),
    /** Giải thích ngắn bằng tiếng Việt */
    explain: Text
  })
  .refine((q) => q.answer < q.choices.length, { message: 'answer ngoài số lựa chọn' })
export type VideoQuestion = z.infer<typeof VideoQuestionSchema>

/** Mốc dừng video để hỏi: số giây trong video, hoặc 'end' = khi video (hoặc đoạn) kết thúc */
export const VideoCheckpointSchema = z.object({
  at: z.union([z.number().int().min(0), z.literal('end')]),
  question: VideoQuestionSchema
})
export type VideoCheckpoint = z.infer<typeof VideoCheckpointSchema>

export const VideoItemSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    /** Id video YouTube (11 ký tự) */
    videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    title: Text,
    channel: Text,
    /** Trang gốc của video/transcript, để ghi công và kiểm tra */
    sourceUrl: z.string().url(),
    /** public-domain: tác phẩm của chính phủ Mỹ (VOA...); youtube-embed: chỉ nhúng bằng trình phát chính thức */
    license: z.enum(['public-domain', 'youtube-embed']),
    level: LevelCode,
    topics: z.array(Text).max(6).default([]),
    /** Tóm tắt một hai câu bằng tiếng Việt */
    summary: Text,
    /** Phát một đoạn thay vì cả video (giây) */
    startSec: z.number().int().min(0).optional(),
    endSec: z.number().int().min(1).optional(),
    /** Từ khoá nên học trước khi xem */
    vocab: z.array(Text).max(12).default([]),
    checkpoints: z.array(VideoCheckpointSchema).min(1).max(8)
  })
  .superRefine((v, ctx) => {
    if (v.startSec !== undefined && v.endSec !== undefined && v.endSec <= v.startSec) {
      ctx.addIssue({ code: 'custom', message: `${v.id}: endSec phải lớn hơn startSec` })
    }
    const times = v.checkpoints.filter((c) => c.at !== 'end').map((c) => c.at as number)
    if (times.some((t, i) => i > 0 && t < times[i - 1])) {
      ctx.addIssue({ code: 'custom', message: `${v.id}: mốc phải tăng dần` })
    }
    const endIdx = v.checkpoints.findIndex((c) => c.at === 'end')
    if (endIdx !== -1 && endIdx !== v.checkpoints.length - 1) {
      ctx.addIssue({ code: 'custom', message: `${v.id}: mốc 'end' phải đứng cuối` })
    }
  })
export type VideoItem = z.infer<typeof VideoItemSchema>

export const VideoBankFileSchema = z.object({
  license: z.literal('proprietary-own'),
  generator: Text,
  reviewed: z.boolean(),
  videos: z.array(VideoItemSchema).min(1)
})
export type VideoBankFile = z.infer<typeof VideoBankFileSchema>

// --- IPC ---

/** Mục trong thư viện (không có đáp án) */
export const VideoSummarySchema = z.object({
  id: z.string(),
  videoId: z.string(),
  title: z.string(),
  channel: z.string(),
  level: z.string(),
  topics: z.array(z.string()),
  summary: z.string(),
  questions: z.number().int(),
  /** Đã làm xong lần nào chưa (đúng/tổng của lần gần nhất) */
  last: z.object({ correct: z.number().int(), total: z.number().int() }).nullable()
})
export type VideoSummary = z.infer<typeof VideoSummarySchema>

export const VideoPlayCheckpointSchema = z.object({
  at: z.union([z.number().int(), z.literal('end')]),
  prompt: z.string(),
  choices: z.array(z.string())
})

export const VideoPlaySchema = z.object({
  playId: z.string(),
  videoId: z.string(),
  title: z.string(),
  sourceUrl: z.string(),
  startSec: z.number().int().nullable(),
  endSec: z.number().int().nullable(),
  vocab: z.array(z.string()),
  checkpoints: z.array(VideoPlayCheckpointSchema)
})
export type VideoPlay = z.infer<typeof VideoPlaySchema>

export const VideoPlayInputSchema = z.object({ id: z.string() })

export const VideoSubmitInputSchema = z.object({
  playId: z.string(),
  /** Chỉ số lựa chọn theo thứ tự checkpoint; null = bỏ qua */
  answers: z.array(z.number().int().min(0).max(3).nullable())
})

export const VideoResultSchema = z.object({
  correct: z.number().int(),
  total: z.number().int(),
  review: z.array(
    z.object({
      picked: z.number().int().nullable(),
      answer: z.number().int(),
      explain: z.string()
    })
  ),
  xp: z.number().int()
})
export type VideoResult = z.infer<typeof VideoResultSchema>
