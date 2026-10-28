// Xem nhanh hoạt ảnh đặc trưng (quirk_*) và các hoạt ảnh được chỉnh riêng của một nhân vật, mỗi hoạt ảnh một hàng.
// Chạy: node scripts/sprites/preview-quirks.mjs <nhân vật> [giai đoạn] [tên hoạt ảnh,...]
//   → content/.build/quirks-<nhân vật>-<giai đoạn>.png
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCanvas, encodePng, W } from './gfx.mjs'
import { drawCreature } from './creature.mjs'
import { flatten } from './anim.mjs'

const charId = process.argv[2] ?? 'bi'
const stage = process.argv[3] ?? 'adult'
const wanted = process.argv[4]?.split(',')
const { frames, anims } = flatten(charId)
const names = wanted ?? Object.keys(anims).filter((n) => n.startsWith('quirk_'))
const SC = 1
const maxFrames = Math.max(...names.map((n) => anims[n].frames.length))
const cols = Math.min(maxFrames, 14)
const rowsPerAnim = Math.ceil(maxFrames / cols)
const gw = cols * W * SC
const gh = names.length * rowsPerAnim * W * SC
const grid = createCanvas(gw, gh)

names.forEach((name, r) => {
  anims[name].frames.forEach((fi, k) => {
    const cv = createCanvas()
    drawCreature(cv, charId, stage, frames[fi])
    const ox = (k % cols) * W
    const oy = (r * rowsPerAnim + Math.floor(k / cols)) * W
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++) {
        const si = ((y + cv.oy) * cv.w + x + cv.ox) * 4
        const bg = ((x >> 3) + (y >> 3)) % 2 ? 236 : 246
        const a = cv.px[si + 3] / 255
        const di = ((oy + y) * gw + ox + x) * 4
        for (let c = 0; c < 3; c++) grid.px[di + c] = Math.round(cv.px[si + c] * a + bg * (1 - a))
        grid.px[di + 3] = 255
      }
  })
})
mkdirSync(resolve('content/.build'), { recursive: true })
const out = resolve(`content/.build/quirks-${charId}-${stage}.png`)
writeFileSync(out, encodePng(gw, gh, grid.px))
console.log(`${names.join(', ')} → ${out}`)
