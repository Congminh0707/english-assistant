// Gói sprite độ phân giải cao (node scripts/sprites/build-hires-pack.mjs) — đăng lên GitHub Release của dự án
// (tag `pet-sprites-hires-<ver>`, pre-release nên không ảnh hưởng cập nhật app). Điền size + sha256 sau khi build.
import { SPRITE_PACK_ID } from '@shared/spritePack'
import type { SpritePackSpec } from './SpritePackManager'

const VERSION = '1.1.0'

export const HIRES_SPRITE_PACK: SpritePackSpec = {
  id: SPRITE_PACK_ID,
  version: VERSION,
  url: `https://github.com/Congminh0707/english-assistant/releases/download/${SPRITE_PACK_ID}-${VERSION}/${SPRITE_PACK_ID}-${VERSION}.zip`,
  // Điền sau khi build gói (scripts/sprites/build-hires-pack.mjs in ra size + sha256)
  size: 69090373,
  sha256: '60207096c7895d8fad9e5c5b2e956886914b93eb4b6a8c5f657a2516e6bf9444'
}
