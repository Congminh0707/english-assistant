import { z } from 'zod'
import { Meta, SourceRef } from './source'

export const SentenceTranslation = z.object({
  lang: z.literal('vi'),
  text: z.string().min(1),
  source: SourceRef
})

/** Câu ví dụ, vd id 'sentence:tatoeba:12345' */
export const Sentence = Meta.extend({
  en: z.string().min(1),
  translations: z.array(SentenceTranslation).default([]),
  /** Đường dẫn audio trong pack (chưa có ở core-dictionary v1) */
  audio: z.string().optional(),
  /** Id các từ (word:en:*) xuất hiện trong câu, đã quy về lemma */
  wordIds: z.array(z.string()).default([])
})
export type Sentence = z.infer<typeof Sentence>
