// Sinh icon app dạng pixel art: đầu mèo "AI" (mắt xanh phát sáng, chip trên trán, tia sáng).
// Vẽ ở lưới 32×32 rồi phóng to nguyên số (nearest) → build/icon.png, build/icon.ico, resources/icon.png.
// Chạy: pnpm sprites:icon
import { mkdirSync, writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'

const GRID = 32

const PALETTE = {
  '.': null,
  O: [43, 43, 58, 255], // viền
  P: [255, 214, 165, 255], // lông
  S: [240, 180, 130, 255], // bóng lông
  E: [255, 154, 162, 255], // trong tai
  B: [43, 43, 58, 255], // viền mắt
  W: [255, 255, 255, 255], // điểm sáng mắt
  C: [93, 230, 255, 255], // mắt phát sáng
  V: [155, 107, 255, 255], // chip AI
  K: [255, 140, 150, 255], // má hồng
  N: [255, 120, 140, 255], // mũi
  Y: [255, 226, 122, 255], // tia sáng
  T: [46, 42, 94, 255], // nền
  L: [91, 141, 239, 255], // viền nền, mạch điện
  D: [70, 76, 150, 255] // mạch điện mờ
}

// Nửa trái của đầu (12 cột), phản chiếu sang phải để đối xứng
const HALF_HEAD = [
  '..OO........',
  '.OPPO.......',
  '.OPEPO......',
  '.OPEEPO.....',
  '.OPEEEPOOOOO',
  '.OPPPPPPPPPP',
  'OPPPPPPPPPPP',
  'OPPPPPPPPPVV',
  'OPPPPPPPPVCC',
  'OPPPPPPPPPVV',
  'OPPPPPPPPPPP',
  'OPPPBBBPPPPP',
  'OPPBWCCBPPPP',
  'OPPBCCCBPPPP',
  'OPPPBBBPPPPP',
  'OPKKPPPPPPPN',
  'OPPPPPPPPPPO',
  'OPPPPPPPPOOP',
  'OPPPPPPPPPPP',
  'OSPPPPPPPPPP',
  '.OSSPPPPPPPP',
  '..OOSSSSSSSS',
  '....OOOOOOOO'
]

const grid = Array.from({ length: GRID }, () => Array(GRID).fill(null))
const put = (x, y, ch) => {
  if (x >= 0 && y >= 0 && x < GRID && y < GRID) grid[y][x] = PALETTE[ch]
}

// Nền: ô vuông bo góc + viền sáng
for (let y = 0; y < GRID; y++) {
  for (let x = 0; x < GRID; x++) {
    const dx = Math.min(x, GRID - 1 - x)
    const dy = Math.min(y, GRID - 1 - y)
    const corner = dx < 4 && dy < 4 && dx + dy < 3
    if (corner) continue
    const edge = dx === 0 || dy === 0 || (dx < 4 && dy < 4 && dx + dy === 3)
    put(x, y, edge ? 'L' : 'T')
  }
}

// Mạch điện mờ ở góc dưới (gợi "AI")
for (const [x0, dir] of [
  [3, 1],
  [28, -1]
]) {
  for (let i = 0; i < 4; i++) put(x0 + dir * i, 29, 'D')
  put(x0 + dir * 3, 28, 'D')
  put(x0 + dir * 3, 27, 'D')
  put(x0 + dir * 4, 27, 'L')
}

// Đầu mèo
const HEAD_X = 4
const HEAD_Y = 7
HALF_HEAD.forEach((half, row) => {
  const full = half + [...half].reverse().join('')
  ;[...full].forEach((ch, col) => {
    if (ch !== '.') put(HEAD_X + col, HEAD_Y + row, ch)
  })
})

// Tia sáng 4 cánh phía trên trán
const sparkle = [
  [16, 2],
  [16, 3],
  [14, 4],
  [15, 4],
  [17, 4],
  [18, 4],
  [16, 5],
  [16, 6]
]
for (const [x, y] of sparkle) put(x, y, 'Y')
put(16, 4, 'W')
// Hai chấm sáng nhỏ
put(9, 4, 'Y')
put(23, 5, 'V')

// --- Phóng to nguyên số ---
function render(size) {
  const px = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      // Lấy mẫu hộp: nguyên số khi size ≥ 32, trung bình khi thu nhỏ
      const samples = size >= GRID ? 1 : 4
      for (let s = 0; s < samples; s++) {
        const fx = size >= GRID ? (x + 0.5) / size : (x + 0.25 + (s % 2) * 0.5) / size
        const fy = size >= GRID ? (y + 0.5) / size : (y + 0.25 + Math.floor(s / 2) * 0.5) / size
        const c =
          grid[Math.min(GRID - 1, Math.floor(fy * GRID))][Math.min(GRID - 1, Math.floor(fx * GRID))]
        if (!c) continue
        r += c[0] * c[3]
        g += c[1] * c[3]
        b += c[2] * c[3]
        a += c[3]
      }
      const i = (y * size + x) * 4
      if (a > 0) {
        px[i] = Math.round(r / a)
        px[i + 1] = Math.round(g / a)
        px[i + 2] = Math.round(b / a)
        px[i + 3] = Math.round(a / samples)
      }
    }
  }
  return px
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(px, size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    Buffer.from(px.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1)
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

/** ICO chứa nhiều ảnh PNG (Windows Vista+) */
function encodeIco(sizes) {
  const images = sizes.map((s) => ({ size: s, data: encodePng(render(s), s) }))
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2) // type = icon
  header.writeUInt16LE(images.length, 4)
  const dir = Buffer.alloc(16 * images.length)
  let offset = header.length + dir.length
  images.forEach((img, i) => {
    const o = i * 16
    dir[o] = img.size >= 256 ? 0 : img.size
    dir[o + 1] = img.size >= 256 ? 0 : img.size
    dir.writeUInt16LE(1, o + 4) // planes
    dir.writeUInt16LE(32, o + 6) // bpp
    dir.writeUInt32LE(img.data.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += img.data.length
  })
  return Buffer.concat([header, dir, ...images.map((i) => i.data)])
}

const write = (path, data) => {
  const full = resolve(path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, data)
}

const png512 = encodePng(render(512), 512)
write('build/icon.png', png512)
write('resources/icon.png', png512)
write('build/icon.ico', encodeIco([16, 32, 64, 128, 256]))
console.log('Đã tạo build/icon.png, build/icon.ico, resources/icon.png (đầu mèo pixel)')
