import { z } from 'zod'
import { Meta } from './source'

export const LocalizedText = z.object({
  vi: z.string().min(1),
  en: z.string().min(1)
})

/** Bộ từ, vd 'deck:level:a1-1', 'deck:list:tsl' */
export const Deck = Meta.extend({
  kind: z.enum(['level', 'topic', 'exam', 'list']),
  title: LocalizedText,
  description: LocalizedText.optional(),
  wordIds: z.array(z.string().startsWith('word:')).min(1)
})
export type Deck = z.infer<typeof Deck>
