// Mẫu câu giao tiếp theo tình huống — file nội dung tự soạn: content/curated/phrasebook/<số>-<tên>.json
// (một file = một nhóm tình huống). Câu tiếng Anh nghe được bằng TTS, kèm nghĩa tiếng Việt.
import { z } from 'zod'
import { LevelCode } from './content/level'

const Text = z.string().trim().min(1)

export const PhraseSchema = z.object({
  en: Text,
  vi: Text,
  /** Ghi chú ngắn: khi nào dùng, mức độ trang trọng... */
  note: Text.optional(),
  level: LevelCode.optional()
})

export const PhrasebookFileSchema = z.object({
  license: z.literal('proprietary-own'),
  category: z.object({
    /** Mã nhóm, vd 'greetings' */
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: Text,
    icon: Text,
    order: z.number().int().min(1)
  }),
  phrases: z.array(PhraseSchema).min(5).max(40)
})
export type PhrasebookFile = z.infer<typeof PhrasebookFileSchema>

/** Mẫu câu gửi cho giao diện: kèm id nội dung (dùng để lưu vào sổ thẻ) */
export const PhrasebookPhraseSchema = PhraseSchema.extend({ id: z.string() })
export type PhrasebookPhrase = z.infer<typeof PhrasebookPhraseSchema>

export const PhrasebookSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      icon: z.string(),
      phrases: z.array(PhrasebookPhraseSchema)
    })
  )
})
export type Phrasebook = z.infer<typeof PhrasebookSchema>
