import { z } from 'zod'

// Nhật ký tiếng Anh buổi tối (docs/07 §14): mỗi ngày một đoạn, AI sửa nhẹ khi người dùng bấm.

/** Độ dài tối đa một đoạn nhật ký (ký tự) */
export const DIARY_MAX_CHARS = 1200
/** Số từ tối thiểu để nhận thưởng viết nhật ký trong ngày */
export const DIARY_MIN_WORDS = 10
/** Số câu gợi ý (khoá i18n study.diary.prompts.1..N) */
export const DIARY_PROMPT_COUNT = 12

/** Đếm từ: các cụm ký tự cách nhau bởi khoảng trắng */
export function diaryWordCount(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

/** Một chỗ AI sửa: cụm cũ → cụm mới, kèm lý do tiếng Việt */
export const DiaryChangeSchema = z.object({
  from: z.string(),
  to: z.string(),
  note_vi: z.string()
})
export type DiaryChange = z.infer<typeof DiaryChangeSchema>

export const DiaryEntrySchema = z.object({
  id: z.string(),
  /** Ngày cục bộ YYYY-MM-DD */
  day: z.string(),
  text: z.string(),
  /** Bản AI sửa (null = chưa sửa, hoặc đã sửa lại chữ sau lần sửa) */
  corrected: z.string().nullable(),
  changes: z.array(DiaryChangeSchema),
  /** Lời khen của AI (tiếng Việt) */
  praise: z.string().nullable(),
  createdAt: z.number().int(),
  updatedAt: z.number().int()
})
export type DiaryEntry = z.infer<typeof DiaryEntrySchema>

/** Kênh diary:correct: entry sau khi sửa; stale = chữ đã đổi trong lúc chờ AI nên bản sửa bị bỏ */
export const DiaryCorrectResultSchema = z.object({
  entry: DiaryEntrySchema,
  stale: z.boolean()
})
export type DiaryCorrectResult = z.infer<typeof DiaryCorrectResultSchema>

/** Kênh diary:save */
export const DiarySaveInputSchema = z.object({
  text: z.string().trim().min(1).max(DIARY_MAX_CHARS)
})
export type DiarySaveInput = z.infer<typeof DiarySaveInputSchema>

/** Kênh diary:today: entry hôm nay (nếu có), khoá i18n câu gợi ý, AI dùng được không */
export const DiaryTodaySchema = z.object({
  entry: DiaryEntrySchema.nullable(),
  promptKey: z.string(),
  aiReady: z.boolean()
})
export type DiaryToday = z.infer<typeof DiaryTodaySchema>
