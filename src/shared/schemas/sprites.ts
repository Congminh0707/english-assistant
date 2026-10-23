import { z } from 'zod'
import { SPRITE_ASSET_NAME, SPRITE_STAGES } from '../spritePack'

export const SpriteStageSchema = z.enum(SPRITE_STAGES)

export const SpriteAssetInputSchema = z.object({
  character: z.string().min(1).max(20),
  stage: SpriteStageSchema,
  name: z.string().regex(SPRITE_ASSET_NAME)
})
/** data URL ảnh WebP, hoặc null nếu gói chưa cài / không có lớp này */
export const SpriteAssetResultSchema = z.string().nullable()

export const SpriteMetaInputSchema = SpriteAssetInputSchema.pick({ character: true, stage: true })

/** sheet.json của gói (cùng định dạng SpriteSheetMeta của mascot) */
export const SpriteMetaSchema = z.object({
  frameSize: z.object({ w: z.number(), h: z.number() }),
  anchor: z.object({ x: z.number(), y: z.number() }),
  animations: z.record(
    z.string(),
    z.object({
      frames: z.array(z.number()),
      fps: z.number(),
      loop: z.boolean(),
      next: z.string().optional()
    })
  ),
  scale: z.number().optional()
})
export type SpriteMeta = z.infer<typeof SpriteMetaSchema>
