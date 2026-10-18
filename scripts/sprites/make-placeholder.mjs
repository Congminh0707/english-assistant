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
  foot: [214, 150, 110, 255]
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
  ]
}
const timing = {
  idle: { fps: 3, loop: true },
  walk: { fps: 8, loop: true },
  drag: { fps: 6, loop: true },
  fall: { fps: 1, loop: true },
  land: { fps: 12, loop: false, next: 'idle' },
  happy: { fps: 10, loop: false, next: 'idle' }
}

const frames = Object.values(animations).flat()
const rows = Math.ceil(frames.length / COLUMNS)
const width = COLUMNS * FRAME
const height = rows * FRAME
const pixels = new Uint8Array(width * height * 4)

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

// Hệ số co các tham số tư thế (thiết kế gốc cho khung 64px)
const K = FRAME / 64

function drawFrame(p) {
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
  for (const x of [cx - 10, cx - 9, cx + 8, cx + 9]) set(x, eyeY + 3, C.blush)
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
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0))
])

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
console.log(`Đã tạo ${frames.length} frame (${width}x${height}) tại ${OUT_DIR}`)
