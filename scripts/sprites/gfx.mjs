// Lõi đồ hoạ pixel-art cho sprite thú cưng: khung 96×96, hình khối bằng SDF, đổ bóng nhiều tông,
// viền theo màu, khử bậc thang bằng dither Bayer. Không phụ thuộc thư viện ngoài.
import { deflateSync, crc32 } from 'node:zlib'

export const W = 96
/** Hệ số độ phân giải: toạ độ vẽ luôn là toạ độ logic 96×96; canvas thật là W×SCALE (SPRITE_SCALE=2 → 192px, 4 → 384px) */
export const SCALE = Math.max(1, Math.round(Number(process.env.SPRITE_SCALE ?? 1)))
/** Cạnh khung thật (px) */
export const PX = W * SCALE

// ---------------------------------------------------------------- màu
export const hex = (h) => {
  const n = parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))

function rgb2hsl([r, g, b]) {
  r /= 255
  g /= 255
  b /= 255
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (mx + mn) / 2
  if (mx !== mn) {
    const d = mx - mn
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [h, s, l]
}
function hsl2rgb([h, s, l]) {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255), 255]
}
/** Xoay hue về phía `target` (độ) tối đa `deg` theo đường ngắn nhất */
function hueToward(h, target, deg) {
  let d = ((target - h + 540) % 360) - 180
  d = Math.max(-deg, Math.min(deg, d))
  return h + d
}

/** Dải 5 tông + màu viền từ một màu gốc: sáng ấm hơn, tối lạnh hơn (đúng kiểu pixel art) */
export function ramp(base) {
  const c = typeof base === 'string' ? hex(base) : base
  const [h, s, l] = rgb2hsl(c)
  const hl = hsl2rgb([hueToward(h, 55, 10), clamp(s * 0.9), clamp(l + 0.2)])
  const light = hsl2rgb([hueToward(h, 55, 6), s, clamp(l + 0.1)])
  const shade = hsl2rgb([hueToward(h, 265, 9), clamp(s + 0.04), clamp(l - 0.13)])
  const deep = hsl2rgb([hueToward(h, 265, 16), clamp(s + 0.07), clamp(l - 0.25)])
  const line = hsl2rgb([
    hueToward(h, 265, 12),
    clamp(s * 0.7 + 0.1, 0, 0.7),
    clamp(l * 0.3, 0.08, 0.2)
  ])
  return { hl, light, base: c, shade, deep, line, tones: [hl, light, c, shade, deep] }
}
export const mix = (a, b, t) => [0, 1, 2, 3].map((i) => Math.round(a[i] + (b[i] - a[i]) * t))

// ---------------------------------------------------------------- canvas
export function createCanvas(w = PX, h = PX) {
  return { w, h, px: new Uint8Array(w * h * 4) }
}
/** Chấm một điểm theo toạ độ logic (phóng thành khối SCALE×SCALE) */
export function put(cv, x, y, c) {
  const x0 = Math.round(x) * SCALE
  const y0 = Math.round(y) * SCALE
  for (let j = 0; j < SCALE; j++) for (let i = 0; i < SCALE; i++) putPx(cv, x0 + i, y0 + j, c)
}
/** Chấm một điểm theo toạ độ thật của canvas */
export function putPx(cv, x, y, c) {
  x = Math.round(x)
  y = Math.round(y)
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return
  const i = (y * cv.w + x) * 4
  if (c[3] === 255) {
    cv.px[i] = c[0]
    cv.px[i + 1] = c[1]
    cv.px[i + 2] = c[2]
    cv.px[i + 3] = 255
    return
  }
  const a = c[3] / 255
  const ba = cv.px[i + 3] / 255
  const oa = a + ba * (1 - a)
  for (let k = 0; k < 3; k++)
    cv.px[i + k] = Math.round((c[k] * a + cv.px[i + k] * ba * (1 - a)) / oa)
  cv.px[i + 3] = Math.round(oa * 255)
}
export const alphaAt = (cv, x, y) =>
  x < 0 || y < 0 || x >= cv.w || y >= cv.h ? 0 : cv.px[(y * cv.w + x) * 4 + 3]

// ---------------------------------------------------------------- hình khối (SDF)
// Mỗi hình: { d(x,y) → khoảng cách có dấu (âm = bên trong), bbox:[x0,y0,x1,y1], dep }
// dep = độ sâu "gối": càng gần viền pháp tuyến càng nghiêng → đổ bóng tròn đều.
export function ellipse(cx, cy, rx, ry, rot = 0, dep = Math.min(rx, ry)) {
  const cos = Math.cos(rot)
  const sin = Math.sin(rot)
  const m = Math.max(rx, ry) + 2
  return {
    bbox: [cx - m, cy - m, cx + m, cy + m],
    dep,
    d(x, y) {
      const dx = x - cx
      const dy = y - cy
      const u = (dx * cos + dy * sin) / rx
      const v = (-dx * sin + dy * cos) / ry
      return (Math.hypot(u, v) - 1) * Math.min(rx, ry)
    }
  }
}
export function circle(cx, cy, r, dep = r) {
  return ellipse(cx, cy, r, r, 0, dep)
}
export function capsule(x1, y1, x2, y2, r1, r2 = r1, dep = Math.min(r1, r2)) {
  const vx = x2 - x1
  const vy = y2 - y1
  const len2 = vx * vx + vy * vy || 1
  const m = Math.max(r1, r2) + 2
  return {
    bbox: [Math.min(x1, x2) - m, Math.min(y1, y2) - m, Math.max(x1, x2) + m, Math.max(y1, y2) + m],
    dep,
    d(x, y) {
      const t = clamp(((x - x1) * vx + (y - y1) * vy) / len2)
      return Math.hypot(x - (x1 + vx * t), y - (y1 + vy * t)) - (r1 + (r2 - r1) * t)
    }
  }
}
/** Đa giác lồi (tam giác tai, sừng, gai, cánh); đỉnh theo thứ tự bất kỳ */
export function poly(points, dep = 4, round = 0) {
  // Đảm bảo thứ tự ngược chiều kim đồng hồ để pháp tuyến cạnh hướng ra ngoài
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  const pts = area > 0 ? points : [...points].reverse()
  const edges = pts.map(([x1, y1], i) => {
    const [x2, y2] = pts[(i + 1) % pts.length]
    const l = Math.hypot(x2 - x1, y2 - y1) || 1
    return { x1, y1, nx: (y2 - y1) / l, ny: -(x2 - x1) / l }
  })
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return {
    bbox: [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) + 2, Math.max(...ys) + 2],
    dep,
    d(x, y) {
      let d = -1e9
      for (const e of edges) d = Math.max(d, (x - e.x1) * e.nx + (y - e.y1) * e.ny)
      return d + round
    }
  }
}
export function rbox(cx, cy, hw, hh, r, dep = Math.min(hw, hh)) {
  return {
    bbox: [cx - hw - 2, cy - hh - 2, cx + hw + 2, cy + hh + 2],
    dep,
    d(x, y) {
      const qx = Math.abs(x - cx) - (hw - r)
      const qy = Math.abs(y - cy) - (hh - r)
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
    }
  }
}
/** Dải cong qua nhiều điểm (đuôi, râu, viền cười) — chuỗi capsule nối nhau */
export function strokeShapes(points, r1, r2 = r1) {
  const shapes = []
  for (let i = 0; i < points.length - 1; i++) {
    const t0 = i / (points.length - 1)
    const t1 = (i + 1) / (points.length - 1)
    shapes.push(
      capsule(
        points[i][0],
        points[i][1],
        points[i + 1][0],
        points[i + 1][1],
        r1 + (r2 - r1) * t0,
        r1 + (r2 - r1) * t1
      )
    )
  }
  return shapes
}
export function bezier(p0, p1, p2, n = 8) {
  const out = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = (1 - t) * (1 - t)
    const b = 2 * (1 - t) * t
    const c = t * t
    out.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]])
  }
  return out
}
const unionD = (shapes) => (x, y) => {
  let d = 1e9
  for (const s of shapes) {
    const v = s.d(x, y)
    if (v < d) d = v
  }
  return d
}

// ---------------------------------------------------------------- sơn
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
].map((r) => r.map((v) => v / 16 - 0.5))
const OUTLINE_K = Math.max(1, SCALE - (SCALE > 2 ? 1 : 0))
const LIGHT = (() => {
  const l = [-0.5, -0.68, 0.55]
  const n = Math.hypot(...l)
  return l.map((v) => v / n)
})()

function bboxOf(shapes, cv) {
  let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9]
  for (const s of shapes) {
    x0 = Math.min(x0, s.bbox[0])
    y0 = Math.min(y0, s.bbox[1])
    x1 = Math.max(x1, s.bbox[2])
    y1 = Math.max(y1, s.bbox[3])
  }
  // bbox của hình là toạ độ logic → đổi sang toạ độ thật
  return [
    Math.max(0, Math.floor(x0 * SCALE)),
    Math.max(0, Math.floor(y0 * SCALE)),
    Math.min(cv.w - 1, Math.ceil(x1 * SCALE)),
    Math.min(cv.h - 1, Math.ceil(y1 * SCALE))
  ]
}

/**
 * Sơn một bộ phận (gộp nhiều hình) với đổ bóng + viền. Trả về mask để dùng làm clip cho decal.
 * style: { ramp, flat?: màu, outline = true, line?: màu viền, clip?: mask, dither = true, shift = 0 (>0 sáng hơn, <0 tối hơn) }
 */
export function paint(cv, shapes, style) {
  const list = Array.isArray(shapes) ? shapes : [shapes]
  const D = unionD(list)
  const [x0, y0, x1, y1] = bboxOf(list, cv)
  const mw = x1 - x0 + 1
  const mh = y1 - y0 + 1
  if (mw <= 0 || mh <= 0) return { at: () => false, bbox: [0, 0, -1, -1] }
  const inside = new Uint8Array(mw * mh)
  const clip = style.clip
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      if (clip && !clip.at(x, y)) continue
      if (D((x + 0.5) / SCALE, (y + 0.5) / SCALE) <= 0) inside[(y - y0) * mw + (x - x0)] = 1
    }
  const isIn = (x, y) =>
    x >= x0 && y >= y0 && x <= x1 && y <= y1 && inside[(y - y0) * mw + (x - x0)] === 1
  const r = style.ramp
  const outline = style.outline !== false
  const lineC = style.line ?? (r ? r.line : [0, 0, 0, 255])
  const shift = style.shift ?? 0
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      if (!isIn(x, y)) continue
      // Viền dày ~1 pixel logic (= SCALE pixel thật)
      const k = OUTLINE_K
      const edge = !isIn(x - k, y) || !isIn(x + k, y) || !isIn(x, y - k) || !isIn(x, y + k)
      if (edge && outline) {
        // Viền phía trên/trái nhạt hơn một chút để khối có chiều sâu
        const topLeft = !isIn(x, y - k) || !isIn(x - k, y)
        putPx(cv, x, y, topLeft && style.softTop !== false && r ? mix(lineC, r.deep, 0.45) : lineC)
        continue
      }
      if (style.flat) {
        putPx(cv, x, y, style.flat)
        continue
      }
      // Pháp tuyến: gradient của khoảng cách, nghiêng nhiều ở gần viền
      const px = (x + 0.5) / SCALE
      const py = (y + 0.5) / SCALE
      const d = D(px, py)
      let best = list[0]
      let bd = 1e9
      for (const s of list) {
        const v = s.d(px, py)
        if (v < bd) {
          bd = v
          best = s
        }
      }
      const gx = D(px + 0.8, py) - D(px - 0.8, py)
      const gy = D(px, py + 0.8) - D(px, py - 0.8)
      const gl = Math.hypot(gx, gy) || 1
      const h = clamp(-d / (best.dep || 4))
      const tilt = 1 - h * h
      const nx = (gx / gl) * Math.sqrt(tilt)
      const ny = (gy / gl) * Math.sqrt(tilt)
      const nz = Math.sqrt(Math.max(0, 1 - tilt))
      let v = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]
      if (style.dither !== false) v += BAYER[y & 3][x & 3] * 0.14
      v += shift * 0.5
      const tone = v > 0.84 ? 0 : v > 0.52 ? 1 : v > 0.08 ? 2 : v > -0.32 ? 3 : 4
      putPx(cv, x, y, r.tones[tone])
    }
  return { at: (x, y) => isIn(x, y), bbox: [x0, y0, x1, y1] }
}

/** Tô phẳng một màu (mắt, miệng, chi tiết nhỏ), tuỳ chọn clip */
export function fill(cv, shapes, color, clip = null) {
  const list = Array.isArray(shapes) ? shapes : [shapes]
  const D = unionD(list)
  const [x0, y0, x1, y1] = bboxOf(list, cv)
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      if (clip && !clip.at(x, y)) continue
      if (D((x + 0.5) / SCALE, (y + 0.5) / SCALE) <= 0) putPx(cv, x, y, color)
    }
}
/** Tô mờ dần bằng dither (má hồng, ánh sáng): alpha 0..1 */
export function fillDither(cv, shapes, color, amount = 0.5, clip = null) {
  const list = Array.isArray(shapes) ? shapes : [shapes]
  const D = unionD(list)
  const [x0, y0, x1, y1] = bboxOf(list, cv)
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      if (clip && !clip.at(x, y)) continue
      const d = D((x + 0.5) / SCALE, (y + 0.5) / SCALE)
      if (d > 0) continue
      const edgeFade = clamp(-d / 2.5)
      if (BAYER[y & 3][x & 3] + 0.5 < amount * (0.4 + 0.6 * edgeFade)) putPx(cv, x, y, color)
    }
}
/** Đường cong dày: lấy mẫu dọc cung tròn và đóng dấu hình tròn */
export function arc(cv, cx, cy, rx, ry, a0, a1, thick, color, clip = null) {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry)))
  const shapes = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    shapes.push(circle(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, thick / 2))
  }
  fill(cv, shapes, color, clip)
}
export function line(cv, x1, y1, x2, y2, thick, color, clip = null) {
  fill(cv, capsule(x1, y1, x2, y2, thick / 2), color, clip)
}

// ---------------------------------------------------------------- PNG
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
export function encodePng(w, h, px) {
  // Ảnh pixel-art ít màu: ghi dạng bảng màu (indexed, tối đa 256 màu + trong suốt) nhỏ hơn ~4 lần RGBA
  const colors = new Map()
  const palette = []
  const indices = new Uint8Array(w * h)
  let indexed = true
  for (let i = 0; i < w * h; i++) {
    const a = px[i * 4 + 3]
    const key = a === 0 ? 0 : (px[i * 4] << 24) | (px[i * 4 + 1] << 16) | (px[i * 4 + 2] << 8) | a
    let idx = colors.get(key)
    if (idx === undefined) {
      if (palette.length >= 256) {
        indexed = false
        break
      }
      idx = palette.length
      colors.set(key, idx)
      palette.push(a === 0 ? [0, 0, 0, 0] : [px[i * 4], px[i * 4 + 1], px[i * 4 + 2], a])
    }
    indices[i] = idx
  }
  if (indexed) {
    const head = Buffer.alloc(13)
    head.writeUInt32BE(w, 0)
    head.writeUInt32BE(h, 4)
    head[8] = 8
    head[9] = 3 // indexed
    const rows = Buffer.alloc((w + 1) * h)
    for (let y = 0; y < h; y++) Buffer.from(indices.buffer, y * w, w).copy(rows, y * (w + 1) + 1)
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', head),
      chunk('PLTE', Buffer.from(palette.flatMap((c) => [c[0], c[1], c[2]]))),
      chunk('tRNS', Buffer.from(palette.map((c) => c[3]))),
      chunk('IDAT', deflateSync(rows, { level: 9 })),
      chunk('IEND', Buffer.alloc(0))
    ])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++)
    Buffer.from(px.buffer, px.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1)
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}
