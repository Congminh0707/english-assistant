import { z } from 'zod'

/** Xin âm thanh tạo sẵn cho một câu (gói bài nghe): giọng Mỹ/Anh + tốc độ + văn bản */
export const AudioClipInputSchema = z.object({
  text: z.string().trim().min(1).max(400),
  accent: z.enum(['us', 'uk']),
  rate: z.number().min(0.3).max(2)
})

/** null = gói chưa cài hoặc không có câu này → dùng giọng đọc thường */
export const AudioClipResultSchema = z
  .object({
    audio: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
    mime: z.string()
  })
  .nullable()
export type AudioClipResult = z.infer<typeof AudioClipResultSchema>
