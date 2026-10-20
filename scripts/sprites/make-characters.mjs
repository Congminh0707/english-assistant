// Sinh sprite sheet cho mọi nhân vật × giai đoạn tiến hoá + phụ kiện (đồ hoạ tạm vẽ bằng code).
// Chạy: pnpm sprites:characters [nhân vật] [giai đoạn]   — vd `pnpm sprites:characters draco teen`
// Xem thử: PREVIEW=1 → content/.build/characters-preview.png (mọi nhân vật × giai đoạn) và
//          PREVIEW=anim → content/.build/anim-<nhân vật>-<giai đoạn>.png (mọi frame, để duyệt hoạt ảnh)
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCanvas, encodePng, W } from './gfx.mjs'
import { CHARACTERS, drawCreature, STAGES } from './creature.mjs'
import { ACCESSORY_DRAW } from './accessories.mjs'
import { flatten } from './anim.mjs'

const OUT_BASE = resolve('src/renderer/mascot/assets/characters')
const COLUMNS = 8
const { frames, anims, rows } = flatten(COLUMNS)
const sheetW = COLUMNS * W
const sheetH = rows * W

const onlyChar = process.argv[2]
const onlyStage = process.argv[3]

function blit(sheet, cv, index) {
  const ox = (index % COLUMNS) * W
  const oy = Math.floor(index / COLUMNS) * W
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) {
      const si = (y * W + x) * 4
      if (cv.px[si + 3] === 0) continue
      const di = ((oy + y) * sheetW + ox + x) * 4
      for (let k = 0; k < 4; k++) sheet.px[di + k] = cv.px[si + k]
    }
}

const meta = {
  frameSize: { w: W, h: W },
  anchor: { x: W / 2, y: W - 5 },
  animations: anims
}

const previewCells = []
let sheetsWritten = 0

for (const charId of Object.keys(CHARACTERS)) {
  if (onlyChar && onlyChar !== charId) continue
  for (const stage of STAGES) {
    if (onlyStage && onlyStage !== stage) continue
    const dir = resolve(OUT_BASE, charId, stage)
    mkdirSync(dir, { recursive: true })
    // Xoá phụ kiện sinh ở lần chạy trước (tránh file thừa khi đổi danh sách phụ kiện)
    for (const f of readdirSync(dir)) if (/^accb?-.*\.png$/.test(f)) rmSync(resolve(dir, f))
    const main = createCanvas(sheetW, sheetH)
    const acc = {}
    for (const [id, def] of Object.entries(ACCESSORY_DRAW)) {
      if (def.front) acc[`acc-${id}`] = { cv: createCanvas(sheetW, sheetH), fn: def.front }
      if (def.back) acc[`accb-${id}`] = { cv: createCanvas(sheetW, sheetH), fn: def.back }
    }
    frames.forEach((pose, i) => {
      const cv = createCanvas()
      const A = drawCreature(cv, charId, stage, pose)
      blit(main, cv, i)
      for (const { cv: sheet, fn } of Object.values(acc)) {
        const layer = createCanvas()
        fn(layer, A, pose)
        blit(sheet, layer, i)
      }
      if (i === 0) previewCells.push({ charId, stage, cv })
    })
    writeFileSync(resolve(dir, 'sheet.png'), encodePng(sheetW, sheetH, main.px))
    writeFileSync(resolve(dir, 'sheet.json'), JSON.stringify(meta, null, 2) + '\n')
    for (const [name, { cv }] of Object.entries(acc))
      writeFileSync(resolve(dir, `${name}.png`), encodePng(sheetW, sheetH, cv.px))
    sheetsWritten++
    if (process.env.PREVIEW === 'acc') {
      // Ghép nhân vật + từng phụ kiện ở frame 0 (lớp sau → thân → lớp trước), phóng ×2
      const ids = Object.keys(ACCESSORY_DRAW)
      const SC = 2
      const cols = 6
      const gw = cols * W * SC
      const gh = Math.ceil(ids.length / cols) * W * SC
      const grid = createCanvas(gw, gh)
      const px = (cv, x, y) => (y * sheetW + x) * 4
      ids.forEach((id, n) => {
        const layers = [acc[`accb-${id}`], main, acc[`acc-${id}`]]
          .filter(Boolean)
          .map((l) => l.cv ?? l)
        for (let y = 0; y < W * SC; y++)
          for (let x = 0; x < W * SC; x++) {
            const sx = Math.floor(x / SC)
            const sy = Math.floor(y / SC)
            const o = ((Math.floor(n / cols) * W * SC + y) * gw + (n % cols) * W * SC + x) * 4
            const bg = ((x >> 4) + (y >> 4)) % 2 ? 236 : 246
            let rgb = [bg, bg, bg]
            for (const l of layers) {
              const i = px(l, sx, sy)
              const a = l.px[i + 3] / 255
              if (a > 0) rgb = rgb.map((v, k) => l.px[i + k] * a + v * (1 - a))
            }
            for (let k = 0; k < 3; k++) grid.px[o + k] = Math.round(rgb[k])
            grid.px[o + 3] = 255
          }
      })
      mkdirSync(resolve('content/.build'), { recursive: true })
      writeFileSync(
        resolve(`content/.build/acc-${charId}-${stage}.png`),
        encodePng(gw, gh, grid.px)
      )
    }
    if (process.env.PREVIEW === 'anim') {
      mkdirSync(resolve('content/.build'), { recursive: true })
      writeFileSync(
        resolve(`content/.build/anim-${charId}-${stage}.png`),
        encodePng(sheetW, sheetH, main.px)
      )
    }
    console.log(`${charId}/${stage}: ${frames.length} frame, ${Object.keys(acc).length} phụ kiện`)
  }
}

if (process.env.PREVIEW === '1' && previewCells.length) {
  const SC = 2
  const ids = [...new Set(previewCells.map((c) => c.charId))]
  const gw = STAGES.length * W * SC
  const gh = ids.length * W * SC
  const grid = createCanvas(gw, gh)
  for (const { charId, stage, cv } of previewCells) {
    const r = ids.indexOf(charId)
    const c = STAGES.indexOf(stage)
    for (let y = 0; y < W * SC; y++)
      for (let x = 0; x < W * SC; x++) {
        const si = (Math.floor(y / SC) * W + Math.floor(x / SC)) * 4
        const o = ((r * W * SC + y) * gw + c * W * SC + x) * 4
        const bg = ((x >> 4) + (y >> 4)) % 2 ? 236 : 246
        const a = cv.px[si + 3] / 255
        for (let k = 0; k < 3; k++) grid.px[o + k] = Math.round(cv.px[si + k] * a + bg * (1 - a))
        grid.px[o + 3] = 255
      }
  }
  mkdirSync(resolve('content/.build'), { recursive: true })
  writeFileSync(resolve('content/.build/characters-preview.png'), encodePng(gw, gh, grid.px))
}
console.log(`Xong ${sheetsWritten} sheet (${sheetW}x${sheetH})`)
