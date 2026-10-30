// Bộ nét chung cho hình từ vẽ vector (kiểu hoạt hình mũm mĩm): mọi hình vẽ trên khung 256×256 bằng các hàm này để
// cùng một phong cách — khối tô màu chuyển + điểm sáng + viền mực, mắt to có đốm sáng, má hồng, bóng đổ dưới chân.
// Chỉ dùng API Canvas 2D (Path2D, gradient); không đọc DOM. Xem docs/19 §5.5.

export type Painter = (c: CanvasRenderingContext2D) => void

export const ART_SIZE = 256
export const INK = '#3b2a3a'
export const LW = 6
export const TAU = Math.PI * 2
export const SKIN = '#ffd6b8'

/** Pha màu hex `#rrggbb` với trắng (t > 0) hoặc đen (t < 0), |t| ≤ 1. Màu khác dạng hex → lỗi (bắt ở test). */
export function mix(hex: string, t: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`art: màu phải là #rrggbb, nhận "${hex}"`)
  const n = parseInt(hex.slice(1), 16)
  let r = n >> 16
  let g = (n >> 8) & 255
  let b = n & 255
  const k = t > 0 ? 255 : 0
  const a = Math.abs(t)
  r = Math.round(r + (k - r) * a)
  g = Math.round(g + (k - g) * a)
  b = Math.round(b + (k - b) * a)
  return `rgb(${r},${g},${b})`
}

/** Path từ chuỗi SVG path (toạ độ khung 256). */
export const P = (d: string): Path2D => new Path2D(d)

export function ell(cx: number, cy: number, rx: number, ry: number, rot = 0): Path2D {
  const p = new Path2D()
  p.ellipse(cx, cy, rx, ry, rot, 0, TAU)
  return p
}

export function circle(cx: number, cy: number, r: number): Path2D {
  return ell(cx, cy, r, r)
}

export function rrect(x: number, y: number, w: number, h: number, r: number): Path2D {
  const p = new Path2D()
  p.roundRect(x, y, w, h, r)
  return p
}

/** Đa giác đều/ngôi sao: `points` đỉnh, bán kính ngoài `r`, trong `inner` (bằng r → đa giác). */
export function star(
  cx: number,
  cy: number,
  r: number,
  inner: number,
  points = 5,
  rot = -Math.PI / 2
): Path2D {
  const p = new Path2D()
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : inner
    const a = rot + (i * Math.PI) / points
    const x = cx + Math.cos(a) * rr
    const y = cy + Math.sin(a) * rr
    if (i === 0) p.moveTo(x, y)
    else p.lineTo(x, y)
  }
  p.closePath()
  return p
}

export interface ShapeOpts {
  /** Khoảng y của dải màu chuyển (mặc định cả khung) — đặt sát khối để màu chuyển rõ. */
  y0?: number
  y1?: number
  /** Điểm sáng [x, y, rx, ry, xoay] cắt trong khối. */
  gloss?: [number, number, number, number, number?]
  /** false = không viền. */
  line?: boolean
  lw?: number
}

/** Khối tô: màu chuyển dọc nhẹ, điểm sáng tuỳ chọn, viền mực. */
export function shape(
  c: CanvasRenderingContext2D,
  p: Path2D,
  color: string,
  o: ShapeOpts = {}
): void {
  const g = c.createLinearGradient(0, o.y0 ?? 0, 0, o.y1 ?? ART_SIZE)
  g.addColorStop(0, mix(color, 0.25))
  g.addColorStop(0.5, color)
  g.addColorStop(1, mix(color, -0.15))
  c.fillStyle = g
  c.fill(p)
  if (o.gloss) {
    const [x, y, rx, ry, rot = 0] = o.gloss
    c.save()
    c.clip(p)
    c.fillStyle = 'rgba(255,255,255,.5)'
    c.beginPath()
    c.ellipse(x, y, rx, ry, rot, 0, TAU)
    c.fill()
    c.restore()
  }
  if (o.line !== false) {
    c.lineWidth = o.lw ?? LW
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(p)
  }
}

/** Khối tô phẳng, không viền (mảng màu bên trong khối khác: bụng, đốm, má…). */
export function flat(c: CanvasRenderingContext2D, p: Path2D, color: string): void {
  c.fillStyle = color
  c.fill(p)
}

/** Nét dày có màu + viền mực hai bên (đuôi, dây, cuống, chữ số). */
export function tube(
  c: CanvasRenderingContext2D,
  d: string | Path2D,
  color: string,
  w: number
): void {
  const p = typeof d === 'string' ? P(d) : d
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.lineWidth = w + LW * 2 - 2
  c.strokeStyle = INK
  c.stroke(p)
  c.lineWidth = w
  c.strokeStyle = color
  c.stroke(p)
}

/** Nét đơn (miệng, râu, chi tiết). */
export function line(c: CanvasRenderingContext2D, d: string, w = 5, color = INK): void {
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.lineWidth = w
  c.strokeStyle = color
  c.stroke(P(d))
}

/** Mắt tròn to có hai đốm sáng. */
export function eye(c: CanvasRenderingContext2D, x: number, y: number, r = 10): void {
  c.fillStyle = INK
  c.beginPath()
  c.ellipse(x, y, r, r * 1.2, 0, 0, TAU)
  c.fill()
  c.fillStyle = '#fff'
  c.beginPath()
  c.arc(x - r * 0.3, y - r * 0.45, r * 0.4, 0, TAU)
  c.fill()
  c.beginPath()
  c.arc(x + r * 0.35, y + r * 0.4, r * 0.16, 0, TAU)
  c.fill()
}

/** Mắt cười (cong lên). */
export function happyEye(c: CanvasRenderingContext2D, x: number, y: number): void {
  line(c, `M${x - 9} ${y + 3} Q ${x} ${y - 8} ${x + 9} ${y + 3}`, 5)
}

export function cheek(c: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  c.fillStyle = 'rgba(255,110,140,.42)'
  c.beginPath()
  c.ellipse(x, y, 13 * s, 8 * s, 0, 0, TAU)
  c.fill()
}

export function smile(c: CanvasRenderingContext2D, x: number, y: number, w = 12): void {
  line(c, `M${x - w} ${y} Q ${x} ${y + w} ${x + w} ${y}`, 5)
}

/** Mặt dễ thương đặt lên đồ vật (2 mắt, má, miệng cười) — tâm (x, y), khoảng cách mắt `gap`. */
export function face(c: CanvasRenderingContext2D, x: number, y: number, gap = 20, r = 8): void {
  eye(c, x - gap, y, r)
  eye(c, x + gap, y, r)
  cheek(c, x - gap - 12, y + 16, 0.9)
  cheek(c, x + gap + 12, y + 16, 0.9)
  smile(c, x, y + 14, 8)
}

/** Bóng đổ mờ dưới chân. */
export function shadow(c: CanvasRenderingContext2D, y = 234, rx = 70, cx = 128): void {
  c.fillStyle = 'rgba(60,40,80,.13)'
  c.beginPath()
  c.ellipse(cx, y, rx, 10, 0, 0, TAU)
  c.fill()
}
