// Sinh ảnh PNG 256×256 cho 60 hình minh hoạ vẽ bằng mã (src/shared/pictures.ts) ở độ phân giải cao (scale 8).
// Ảnh nằm trong src/renderer/shared/assets/pictures/ và PixelPicture.vue dùng trực tiếp.
// Chạy: pnpm pictures   (đổi bản vẽ trong pictures.ts thì chạy lại và commit các PNG)
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PICTURE_IDS, PICTURE_LOGICAL, picturePixels } from '../../src/shared/pictures'
import { encodePng } from '../sprites/gfx.mjs'

const OUT = resolve('src/renderer/shared/assets/pictures')
const SCALE = 8
const dim = PICTURE_LOGICAL * SCALE

mkdirSync(OUT, { recursive: true })
// Chỉ xoá PNG cũ (giữ thư mục twemoji/)
for (const f of readdirSync(OUT)) if (f.endsWith('.png')) rmSync(resolve(OUT, f))
for (const id of PICTURE_IDS) {
  const px = new Uint8Array(dim * dim * 4)
  for (const p of picturePixels(id, SCALE)) {
    const o = (p.y * dim + p.x) * 4
    px[o] = parseInt(p.color.slice(1, 3), 16)
    px[o + 1] = parseInt(p.color.slice(3, 5), 16)
    px[o + 2] = parseInt(p.color.slice(5, 7), 16)
    px[o + 3] = 255
  }
  writeFileSync(resolve(OUT, `${id}.png`), encodePng(dim, dim, px))
}
console.log(`Đã sinh ${PICTURE_IDS.length} ảnh ${dim}×${dim} → ${OUT}`)
