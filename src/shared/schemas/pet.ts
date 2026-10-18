import { z } from 'zod'

export const PetStateSchema = z.object({
  name: z.string(),
  characterId: z.string(),
  stage: z.enum(['egg', 'baby', 'teen', 'adult', 'legend']),
  level: z.number().int(),
  xpInLevel: z.number().int(),
  xpForNext: z.number().int(),
  totalXp: z.number().int(),
  coins: z.number().int(),
  hunger: z.number(),
  mood: z.number(),
  energy: z.number(),
  affection: z.number().int()
})
export type PetState = z.infer<typeof PetStateSchema>

export const InventoryItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int()
})
export type InventoryItem = z.infer<typeof InventoryItemSchema>

/** Phản ứng một lần của mascot do main yêu cầu (renderer chọn animation + câu thoại) */
export const MascotReactionSchema = z.object({
  kind: z.enum(['eat', 'hungry', 'level-up'])
})
export type MascotReaction = z.infer<typeof MascotReactionSchema>
