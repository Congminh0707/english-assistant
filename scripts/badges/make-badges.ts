// Sinh ảnh PNG 256×256 cho mọi huy hiệu thành tựu (biểu tượng × hạng + huy hiệu khoá) từ src/shared/badgeArt.ts
// ở độ phân giải cao (scale 8). Ảnh nằm trong src/renderer/shared/assets/badges/ và PixelBadge.vue dùng trực tiếp.
// Chạy: pnpm badges   (đổi thiết kế trong badgeArt.ts thì chạy lại và commit các PNG)
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BADGE_SIZE,
  BADGE_HIRES_SCALE,
  GLYPHS,
  TIERS,
  badgePixels
} from '../../src/shared/badgeArt'
import { encodePng } from '../sprites/gfx.mjs'

const OUT = resolve('src/renderer/shared/assets/badges')
const dim = BADGE_SIZE * BADGE_HIRES_SCALE

function write(name: string, glyph: string, tier: (typeof TIERS)[number], locked: boolean): void {
  const px = new Uint8Array(dim * dim * 4)
  for (const p of badgePixels(glyph, tier, locked, BADGE_HIRES_SCALE)) {
    const o = (p.y * dim + p.x) * 4
    px[o] = parseInt(p.color.slice(1, 3), 16)
    px[o + 1] = parseInt(p.color.slice(3, 5), 16)
    px[o + 2] = parseInt(p.color.slice(5, 7), 16)
    px[o + 3] = 255
  }
  writeFileSync(resolve(OUT, `${name}.png`), encodePng(dim, dim, px))
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
let n = 0
for (const glyph of Object.keys(GLYPHS).filter((g) => g !== 'lock')) {
  for (const tier of TIERS) {
    write(`${glyph}-${tier}`, glyph, tier, false)
    n++
  }
}
write('locked', 'lock', 'bronze', true)
n++
console.log(`Đã sinh ${n} ảnh ${dim}×${dim} → ${OUT}`)
