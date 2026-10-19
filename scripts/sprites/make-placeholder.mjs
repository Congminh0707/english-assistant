// Sinh sprite sheet tạm cho mascot (chưa có art chính thức).
// Đầu ra đúng định dạng docs/05-mascot-system.md#2 để sau này thay bằng sheet vẽ trong LibreSprite.
// Chạy: pnpm sprites:placeholder
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync, crc32 } from 'node:zlib'
import { dirname, resolve } from 'node:path'

const OUT_DIR = resolve('src/renderer/mascot/assets/characters/placeholder/baby')
// Khung 48×48, hiển thị ×2 = 96px (docs/05-mascot-system.md#1-nhân-vật)
const FRAME = 48
const COLUMNS = 8

const C = {
  outline: [43, 43, 58, 255],
  body: [255, 214, 165, 255],
  shade: [240, 180, 130, 255],
  ear: [255, 170, 150, 255],
  blush: [255, 140, 150, 255],
  eye: [43, 43, 58, 255],
  white: [255, 255, 255, 255],
  foot: [214, 150, 110, 255],
  zzz: [91, 141, 239, 255]
}

// Mỗi frame: tham số tư thế của nhân vật
const animations = {
  idle: [{}, { bob: 1 }, { bob: 1 }, { eyes: 'blink' }],
  walk: [{ step: 1 }, { step: 1, bob: 1 }, { step: -1 }, { step: -1, bob: 1 }],
  drag: [
    { stretch: 3, dx: -1, eyes: 'wide', dangle: true },
    { stretch: 3, dx: 1, eyes: 'wide', dangle: true }
  ],
  fall: [{ stretch: 2, eyes: 'wide', dangle: true }],
  land: [{ squash: 4, eyes: 'closed' }, { squash: 2 }, { squash: 1 }],
  happy: [
    { jump: 4, eyes: 'happy' },
    { jump: 9, eyes: 'happy' },
    { jump: 4, eyes: 'happy' },
    { squash: 2, eyes: 'happy' }
  ],
  eat: [
    { eyes: 'happy', mouth: 'open' },
    { bob: 1, mouth: 'chew' },
    { eyes: 'happy', mouth: 'open' },
    { bob: 1, eyes: 'happy', mouth: 'chew' }
  ],
  // Ngủ: nằm bẹp, mắt nhắm, chữ "z" bay lên (thở chậm: thân phồng/xẹp luân phiên)
  sleep: [
    { squash: 3, eyes: 'closed', zzz: 1 },
    { squash: 4, eyes: 'closed', zzz: 2 },
    { squash: 3, eyes: 'closed', zzz: 3 },
    { squash: 2, eyes: 'closed', zzz: 0 }
  ]
}
const timing = {
  idle: { fps: 3, loop: true },
  walk: { fps: 8, loop: true },
  drag: { fps: 6, loop: true },
  fall: { fps: 1, loop: true },
  land: { fps: 12, loop: false, next: 'idle' },
  happy: { fps: 10, loop: false, next: 'idle' },
  eat: { fps: 5, loop: false, next: 'idle' },
  sleep: { fps: 2, loop: true }
}

const frames = Object.values(animations).flat()
const rows = Math.ceil(frames.length / COLUMNS)
const width = COLUMNS * FRAME
const height = rows * FRAME
let pixels = new Uint8Array(width * height * 4)

let ox = 0
let oy = 0
function set(x, y, color) {
  x = Math.round(x)
  y = Math.round(y)
  if (x < 0 || y < 0 || x >= FRAME || y >= FRAME) return
  const i = ((oy + y) * width + (ox + x)) * 4
  pixels.set(color, i)
}
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1

// Hình elip có viền pixel 1px
function ellipse(cx, cy, rx, ry, fill, shade) {
  for (let y = Math.floor(cy - ry) - 1; y <= cy + ry + 1; y++) {
    for (let x = Math.floor(cx - rx) - 1; x <= cx + rx + 1; x++) {
      const px = x + 0.5
      const py = y + 0.5
      if (!inEllipse(px, py, cx, cy, rx, ry)) continue
      const edge = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ].some(([dx, dy]) => !inEllipse(px + dx, py + dy, cx, cy, rx, ry))
      if (edge) set(x, y, C.outline)
      else if (shade && py > cy + ry * 0.55) set(x, y, shade)
      else set(x, y, fill)
    }
  }
}

function triangle(x0, yTop, w, h, color) {
  for (let y = 0; y < h; y++) {
    const half = Math.round((w / 2) * (y / h))
    for (let x = -half; x <= half; x++) {
      const edge = x === -half || x === half || y === h - 1
      set(x0 + x, yTop + y, edge ? C.outline : color)
    }
  }
}

function drawEyes(cx, cy, kind) {
  // Mắt rộng 2px: trái [cx-6, cx-5], phải [cx+4, cx+5] — đối xứng quanh cx
  for (const left of [cx - 6, cx + 4]) {
    if (kind === 'blink' || kind === 'closed') {
      for (let x = -1; x <= 2; x++) set(left + x, cy + 1, C.eye)
    } else if (kind === 'happy') {
      set(left - 1, cy + 1, C.eye)
      set(left, cy, C.eye)
      set(left + 1, cy, C.eye)
      set(left + 2, cy + 1, C.eye)
    } else {
      const h = kind === 'wide' ? 4 : 3
      for (let y = 0; y < h; y++) for (let x = 0; x < 2; x++) set(left + x, cy - 1 + y, C.eye)
      set(left, cy - 1, C.white)
    }
  }
}

// Chữ "z" pixel 3×3 / 4×4 bay lên phía trên đầu (nhân vật đang ngủ)
function drawZ(x, y, size) {
  const color = C.zzz
  for (let i = 0; i < size; i++) {
    set(x + i, y, color)
    set(x + i, y + size - 1, color)
    set(x + size - 1 - i, y + i, color)
  }
}
function drawZzz(level, cx, topY) {
  if (level >= 1) drawZ(cx + 11, topY + 2, 3)
  if (level >= 2) drawZ(cx + 15, topY - 3, 4)
  if (level >= 3) drawZ(cx + 18, topY - 9, 3)
}

// --- Phụ kiện: mỗi món là một sheet riêng (cùng bố cục frame) vẽ chồng lên nhân vật ---
const ACCESSORIES = ['bow', 'glasses', 'scarf', 'hat', 'crown']
const A = {
  red: [230, 70, 100, 255],
  redDark: [150, 30, 60, 255],
  pink: [255, 160, 190, 255],
  gold: [255, 206, 66, 255],
  goldDark: [190, 140, 30, 255],
  gem: [93, 230, 255, 255],
  black: [43, 43, 58, 255],
  white: [255, 255, 255, 255]
}
function rect(x0, y0, w, h, color) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x0 + x, y0 + y, color)
}
function outlineRect(x0, y0, w, h, color) {
  rect(x0, y0, w, 1, color)
  rect(x0, y0 + h - 1, w, 1, color)
  rect(x0, y0, 1, h, color)
  rect(x0 + w - 1, y0, 1, h, color)
}

/** Vẽ riêng phụ kiện, bám theo tư thế của thân (cx, cy, rx, ry đổi theo từng frame) */
function drawAccessory(kind, g) {
  const { cx, cy, rx, ry, eyeY } = g
  const top = Math.round(cy - ry)
  const x = Math.round(cx)
  switch (kind) {
    case 'bow': {
      const bx = x + 9
      const by = top + 1
      rect(bx - 4, by - 2, 4, 5, A.red)
      rect(bx + 1, by - 2, 4, 5, A.red)
      outlineRect(bx - 4, by - 2, 4, 5, A.redDark)
      outlineRect(bx + 1, by - 2, 4, 5, A.redDark)
      rect(bx - 1, by - 1, 2, 3, A.redDark)
      set(bx - 3, by - 1, A.pink)
      set(bx + 2, by - 1, A.pink)
      break
    }
    case 'glasses': {
      outlineRect(x - 9, eyeY - 2, 8, 6, A.black)
      outlineRect(x + 2, eyeY - 2, 8, 6, A.black)
      rect(x - 1, eyeY, 3, 1, A.black)
      set(x - 8, eyeY - 1, A.white)
      set(x + 3, eyeY - 1, A.white)
      break
    }
    case 'scarf': {
      const y = Math.round(cy + ry) - 5
      const w = Math.round(rx * 2) - 6
      rect(x - Math.round(w / 2), y, w, 3, A.red)
      for (let i = 0; i < w; i += 4) rect(x - Math.round(w / 2) + i, y, 1, 3, A.pink)
      rect(x - Math.round(w / 2) + w - 4, y + 3, 3, 5, A.red)
      rect(x - Math.round(w / 2) + w - 4, y + 5, 3, 1, A.pink)
      break
    }
    case 'hat': {
      rect(x - 8, top - 1, 17, 2, A.black)
      rect(x - 5, top - 9, 11, 9, A.black)
      rect(x - 5, top - 3, 11, 2, A.red)
      set(x - 4, top - 8, [90, 90, 110, 255])
      break
    }
    case 'crown': {
      rect(x - 6, top - 3, 13, 4, A.gold)
      rect(x - 6, top, 13, 1, A.goldDark)
      for (const i of [-6, -2, 2, 6]) rect(x + i - (i > 0 ? 1 : 0), top - 6, 2, 3, A.gold)
      rect(x - 1, top - 8, 2, 5, A.gold)
      set(x, top - 1, A.gem)
      set(x - 4, top - 1, A.red)
      set(x + 4, top - 1, A.red)
      break
    }
  }
}

// Hệ số co các tham số tư thế (thiết kế gốc cho khung 64px)
const K = FRAME / 64

function drawFrame(p, only = null) {
  const bob = p.bob ?? 0
  const squash = Math.round((p.squash ?? 0) * K)
  const stretch = Math.round((p.stretch ?? 0) * K)
  const jump = Math.round((p.jump ?? 0) * K)
  const dx = p.dx ?? 0
  const rx = 15 + squash - stretch * 0.5
  const ry = 12.5 - squash + stretch
  const groundY = FRAME - 2
  const footY = groundY - 2 - jump
  const cx = FRAME / 2 + dx
  const cy = footY - 2 - ry + bob
  if (only) return drawAccessory(only, { cx, cy, rx, ry, eyeY: Math.round(cy - 1) })

  // Chân (vẽ trước để thân che một phần)
  const step = p.step ?? 0
  if (p.dangle) {
    ellipse(cx - 6, cy + ry + 1.5, 2.8, 2.4, C.foot)
    ellipse(cx + 6, cy + ry + 1.5, 2.8, 2.4, C.foot)
  } else {
    ellipse(cx - 6 + step * 1.5, footY - (step > 0 ? 1 : 0), 3.5, 2.2, C.foot)
    ellipse(cx + 6 - step * 1.5, footY - (step < 0 ? 1 : 0), 3.5, 2.2, C.foot)
  }
  // Tai
  triangle(cx - 8, cy - ry - 2, 8, 7, C.ear)
  triangle(cx + 7, cy - ry - 2, 8, 7, C.ear)
  // Thân
  ellipse(cx, cy, rx, ry, C.body, C.shade)
  // Mặt
  const eyeY = Math.round(cy - 1)
  drawEyes(cx, eyeY, p.eyes ?? 'open')
  if (p.zzz) drawZzz(p.zzz, cx, Math.round(cy - ry))
  for (const x of [cx - 10, cx - 9, cx + 8, cx + 9]) set(x, eyeY + 3, C.blush)
  if (p.mouth === 'open') {
    // Miệng há to khi ăn
    for (let y = 4; y <= 6; y++) for (let x = -2; x <= 1; x++) set(cx + x, eyeY + y, C.eye)
    set(cx - 1, eyeY + 6, C.blush)
    set(cx, eyeY + 6, C.blush)
    return
  }
  if (p.mouth === 'chew') {
    for (let x = -2; x <= 1; x++) set(cx + x, eyeY + 5, C.eye)
    return
  }
  set(cx - 1, eyeY + 4, C.eye)
  set(cx, eyeY + 4, C.eye)
  if (p.eyes === 'wide') {
    set(cx - 1, eyeY + 5, C.eye)
    set(cx, eyeY + 5, C.eye)
  }
}

frames.forEach((p, i) => {
  ox = (i % COLUMNS) * FRAME
  oy = Math.floor(i / COLUMNS) * FRAME
  drawFrame(p)
})

// --- Mã hoá PNG tối giản (RGBA 8-bit) ---
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function encodePng() {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0 // filter: none
    Buffer.from(pixels.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1)
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
}
const png = encodePng()

// --- Metadata ---
let index = 0
const meta = {
  frameSize: { w: FRAME, h: FRAME },
  anchor: { x: FRAME / 2, y: FRAME - 1 },
  animations: Object.fromEntries(
    Object.entries(animations).map(([name, list]) => {
      const frameIdx = list.map(() => index++)
      return [name, { frames: frameIdx, ...timing[name] }]
    })
  )
}

mkdirSync(dirname(resolve(OUT_DIR, 'x')), { recursive: true })
writeFileSync(resolve(OUT_DIR, 'sheet.png'), png)
writeFileSync(resolve(OUT_DIR, 'sheet.json'), JSON.stringify(meta, null, 2) + '\n')
const basePixels = pixels
const previewFrames = [0, 4, 14, 22] // idle, walk, happy, sleep
const PREVIEW_SCALE = 6
const previewW = ACCESSORIES.length * FRAME * PREVIEW_SCALE
const previewH = previewFrames.length * FRAME * PREVIEW_SCALE
const preview = process.env.PREVIEW ? new Uint8Array(previewW * previewH * 4) : null
function blit(src, frame, cell, row) {
  const fx = (frame % COLUMNS) * FRAME
  const fy = Math.floor(frame / COLUMNS) * FRAME
  for (let y = 0; y < FRAME * PREVIEW_SCALE; y++)
    for (let x = 0; x < FRAME * PREVIEW_SCALE; x++) {
      const si =
        ((fy + Math.floor(y / PREVIEW_SCALE)) * width + fx + Math.floor(x / PREVIEW_SCALE)) * 4
      if (src[si + 3] === 0) continue
      const di =
        ((row * FRAME * PREVIEW_SCALE + y) * previewW + cell * FRAME * PREVIEW_SCALE + x) * 4
      for (let k = 0; k < 4; k++) preview[di + k] = src[si + k]
    }
}
for (const acc of ACCESSORIES) {
  pixels = new Uint8Array(width * height * 4)
  frames.forEach((p, i) => {
    ox = (i % COLUMNS) * FRAME
    oy = Math.floor(i / COLUMNS) * FRAME
    drawFrame(p, acc)
  })
  writeFileSync(resolve(OUT_DIR, `acc-${acc}.png`), encodePng())
  if (preview) {
    const cell = ACCESSORIES.indexOf(acc)
    previewFrames.forEach((f, row) => {
      blit(basePixels, f, cell, row)
      blit(pixels, f, cell, row)
    })
  }
}
if (preview) {
  const saved = pixels
  pixels = preview
  const w0 = width
  // encodePng dùng width/height của sheet → ghi preview bằng bộ mã hoá riêng
  const ihdr2 = Buffer.alloc(13)
  ihdr2.writeUInt32BE(previewW, 0)
  ihdr2.writeUInt32BE(previewH, 4)
  ihdr2[8] = 8
  ihdr2[9] = 6
  const raw2 = Buffer.alloc((previewW * 4 + 1) * previewH)
  for (let y = 0; y < previewH; y++) {
    raw2[y * (previewW * 4 + 1)] = 0
    Buffer.from(preview.buffer, y * previewW * 4, previewW * 4).copy(
      raw2,
      y * (previewW * 4 + 1) + 1
    )
  }
  mkdirSync(resolve('content/.build'), { recursive: true })
  writeFileSync(
    resolve('content/.build/sprites-preview.png'),
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr2),
      chunk('IDAT', deflateSync(raw2)),
      chunk('IEND', Buffer.alloc(0))
    ])
  )
  pixels = saved
  void w0
}
console.log(`Đã tạo ${frames.length} frame (${width}x${height}) tại ${OUT_DIR}`)
