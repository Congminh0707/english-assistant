import { z } from 'zod'

export const ShopItemSchema = z.object({
  id: z.string(),
  kind: z.enum(['food', 'accessory']),
  price: z.number().int(),
  emoji: z.string(),
  minLevel: z.number().int(),
  slot: z.enum(['head', 'face', 'neck']).nullable(),
  /** Số lượng đang có (phụ kiện: 0 hoặc 1) */
  owned: z.number().int(),
  /** Phụ kiện đang đeo */
  equipped: z.boolean(),
  /** Chưa đủ level để mua */
  locked: z.boolean()
})
export type ShopItem = z.infer<typeof ShopItemSchema>

export const ShopStateSchema = z.object({
  coins: z.number().int(),
  level: z.number().int(),
  items: z.array(ShopItemSchema)
})
export type ShopState = z.infer<typeof ShopStateSchema>

export const ShopBuyInputSchema = z.object({ itemId: z.string().min(1) })
export const ShopEquipInputSchema = z.object({ itemId: z.string().min(1), equipped: z.boolean() })
