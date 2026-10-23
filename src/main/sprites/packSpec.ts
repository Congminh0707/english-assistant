// Gói sprite độ phân giải cao (node scripts/sprites/build-hires-pack.mjs) — đăng lên GitHub Release của dự án
// (tag `pet-sprites-hires-<ver>`, pre-release nên không ảnh hưởng cập nhật app). Điền size + sha256 sau khi build.
import { SPRITE_PACK_ID } from '@shared/spritePack'
import type { SpritePackSpec } from './SpritePackManager'

const VERSION = '1.0.0'

export const HIRES_SPRITE_PACK: SpritePackSpec = {
  id: SPRITE_PACK_ID,
  version: VERSION,
  url: `https://github.com/Congminh0707/english-assistant/releases/download/${SPRITE_PACK_ID}-${VERSION}/${SPRITE_PACK_ID}-${VERSION}.zip`,
  // Điền sau khi build gói (scripts/sprites/build-hires-pack.mjs in ra size + sha256)
  size: 59991956,
  sha256: '071e362dec15da66aeac76650f1d1a3ace6855aff37f211beefcf1e7ba23af5c'
}
