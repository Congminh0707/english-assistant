import { seeded, type Point } from '@shared/kidsWorldLayout'

// Lớp nền tĩnh của bản đồ 2D kiểu Làng chữ (docs/23-design-v2-spec.md §3, bảng R5World): đất tô từng mảng xanh, bờ cát
// màu kem, cây tán tròn, núi, đường đất có chấm giữa. Vẽ một lần ra canvas phụ rồi dán lại mỗi khung, nên cảnh nhẹ hơn vẽ
// lại hàng nghìn hình. Các mảng đất chỉ để trang trí, không phải ranh giới tỉnh.
export const BOARD_INK = '#3A2413'
const HILLS: ReadonlyArray<readonly [string, string]> = [
  ['#C7EB6A', '#6FCB55'],
  ['#7EDB62', '#24A65E'],
  ['#A6E06A', '#58C75A'],
  ['#4CC768', '#1FA860']
]
const LEAVES: ReadonlyArray<readonly [string, string]> = [
  ['#1FA36A', '#075238'],
  ['#3BC77A', '#0B7A52'],
  ['#8FE878', '#1FA860'],
  ['#E2FF9A', '#5FD068']
]

/** Cắt đa giác lồi theo nửa mặt phẳng gần `a` hơn `b` (Sutherland–Hodgman) */
function cutCell(poly: Point[], a: Point, b: Point): Point[] {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const nx = b.x - a.x
  const ny = b.y - a.y
  const side = (p: Point): number => (p.x - mx) * nx + (p.y - my) * ny
  const out: Point[] = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const sp = side(p)
    const sq = side(q)
    if (sp <= 0) out.push(p)
    if (sp < 0 !== sq < 0) {
      const u = sp / (sp - sq)
      out.push({ x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u })
    }
  }
  return out
}

function roughen(cell: Point[]): Point[] {
  const out: Point[] = []
  for (let i = 0; i < cell.length; i++) {
    const a = cell[i]
    const b = cell[(i + 1) % cell.length]
    out.push(a)
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (len < 60) continue
    const n = Math.min(5, Math.floor(len / 70))
    const rnd = seeded(Math.round(a.x + b.x) * 31 + Math.round(a.y + b.y))
    // Luôn đi theo một chiều (điểm nhỏ tới lớn) để hai ô chung cạnh gợn giống hệt nhau
    const forward = a.x < b.x || (a.x === b.x && a.y < b.y)
    const lo = forward ? a : b
    const hi = forward ? b : a
    const pts: Point[] = []
    for (let k = 1; k <= n; k++) {
      const u = k / (n + 1)
      const off = (rnd() - 0.5) * 26
      pts.push({
        x: lo.x + (hi.x - lo.x) * u - ((hi.y - lo.y) / len) * off,
        y: lo.y + (hi.y - lo.y) * u + ((hi.x - lo.x) / len) * off
      })
    }
    out.push(...(forward ? pts : pts.reverse()))
  }
  return out
}

/** Chia đất thành các ô Voronoi có cạnh gợn */
export function landCells(
  bounds: { x0: number; y0: number; x1: number; y1: number },
  seeds: readonly Point[]
): Point[][] {
  const box: Point[] = [
    { x: bounds.x0 - 80, y: bounds.y0 - 80 },
    { x: bounds.x1 + 80, y: bounds.y0 - 80 },
    { x: bounds.x1 + 80, y: bounds.y1 + 80 },
    { x: bounds.x0 - 80, y: bounds.y1 + 80 }
  ]
  return seeds.map((s, i) => {
    let cell = box
    seeds.forEach((o, j) => {
      if (i !== j && cell.length) cell = cutCell(cell, s, o)
    })
    return roughen(cell)
  })
}

export function fillLand(
  ctx: CanvasRenderingContext2D,
  land: Path2D,
  cells: readonly Point[][]
): void {
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineWidth = 46
  ctx.strokeStyle = 'rgb(255 255 255 / 30%)'
  ctx.stroke(land)
  ctx.lineWidth = 32
  ctx.strokeStyle = '#F2DDA6'
  ctx.stroke(land)
  ctx.fillStyle = '#7EDB62'
  ctx.fill(land)
  ctx.clip(land)
  cells.forEach((cell, i) => {
    if (cell.length < 3) return
    let y0 = Infinity
    let y1 = -Infinity
    const path = new Path2D()
    cell.forEach((p, k) => {
      y0 = Math.min(y0, p.y)
      y1 = Math.max(y1, p.y)
      if (k) path.lineTo(p.x, p.y)
      else path.moveTo(p.x, p.y)
    })
    path.closePath()
    const [top, bottom] = HILLS[i % HILLS.length]
    const grad = ctx.createLinearGradient(0, y0, 0, y1)
    grad.addColorStop(0, top)
    grad.addColorStop(1, bottom)
    ctx.fillStyle = grad
    ctx.fill(path)
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgb(255 255 255 / 50%)'
    ctx.stroke(path)
  })
  ctx.restore()
}

function leaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  pair: readonly [string, string]
): void {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r * 1.5)
  g.addColorStop(0, pair[0])
  g.addColorStop(1, pair[1])
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

/** Cây tán tròn nhiều lớp, cùng nét cây ở trang chủ làng */
export function boardTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number
): void {
  const rnd = seeded(seed)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size, size)
  ctx.fillStyle = 'rgb(10 74 48 / 28%)'
  ctx.beginPath()
  ctx.ellipse(8, 2, 54, 11, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-10, -40)
  ctx.quadraticCurveTo(-13, -20, -18, 0)
  ctx.quadraticCurveTo(0, 6, 18, 0)
  ctx.quadraticCurveTo(13, -20, 10, -40)
  ctx.closePath()
  ctx.fillStyle = '#6B3E1E'
  ctx.fill()
  ctx.lineWidth = 1.6
  ctx.strokeStyle = BOARD_INK
  ctx.stroke()
  LEAVES.forEach((pair, layer) => {
    const count = [9, 8, 6, 4][layer]
    const spread = [52, 42, 30, 18][layer]
    const r = [23, 18, 13, 8][layer]
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2
      const d = Math.sqrt(rnd()) * spread
      leaf(ctx, Math.cos(a) * d, -64 + Math.sin(a) * d * 0.62 - layer * 4, r, pair)
    }
  })
  ctx.restore()
}

/** Núi xám xanh có tuyết, cùng kiểu núi ở bảng PAsia */
export function boardMountain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  snow: boolean
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size, size)
  ctx.lineJoin = 'round'
  ctx.lineWidth = 2
  ctx.strokeStyle = BOARD_INK
  ctx.beginPath()
  ctx.moveTo(-62, 0)
  ctx.lineTo(-4, -86)
  ctx.lineTo(58, 0)
  ctx.closePath()
  const g = ctx.createLinearGradient(-40, -80, 40, 0)
  g.addColorStop(0, snow ? '#A9B1CC' : '#7DBB8E')
  g.addColorStop(1, snow ? '#737C9F' : '#3F9672')
  ctx.fillStyle = g
  ctx.fill()
  ctx.stroke()
  if (snow) {
    ctx.beginPath()
    ctx.moveTo(-27, -46)
    ctx.lineTo(-4, -86)
    ctx.lineTo(19, -52)
    ctx.lineTo(4, -58)
    ctx.lineTo(-6, -46)
    ctx.lineTo(-15, -54)
    ctx.closePath()
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

/** Đường đất bốn lớp: bóng, mép, mặt đường, chấm giữa */
export function boardRoad(ctx: CanvasRenderingContext2D, road: Path2D): void {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 44
  ctx.strokeStyle = 'rgb(138 106 58 / 50%)'
  ctx.stroke(road)
  ctx.lineWidth = 36
  ctx.strokeStyle = '#D9AE6A'
  ctx.stroke(road)
  ctx.lineWidth = 20
  ctx.strokeStyle = '#E9C68A'
  ctx.stroke(road)
  ctx.lineWidth = 5
  ctx.strokeStyle = '#B98A4A'
  ctx.setLineDash([1, 26])
  ctx.stroke(road)
  ctx.restore()
}

/** Chấm đỏ vị trí thật + nét đứt tới bệ */
export function boardPin(ctx: CanvasRenderingContext2D, anchor: Point, pad: Point): void {
  ctx.save()
  ctx.lineCap = 'round'
  if (Math.hypot(anchor.x - pad.x, anchor.y - pad.y) > 24) {
    ctx.lineWidth = 6
    ctx.strokeStyle = '#D32F2F'
    ctx.setLineDash([4, 16])
    ctx.beginPath()
    ctx.moveTo(anchor.x, anchor.y)
    ctx.lineTo(pad.x, pad.y)
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.beginPath()
  ctx.arc(anchor.x, anchor.y, 15, 0, Math.PI * 2)
  ctx.fillStyle = '#D32F2F'
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = '#FFF9EA'
  ctx.stroke()
  ctx.restore()
}

const WING = new Path2D(
  'M0 0C-14 -22 -30 -40 -52 -50C-44 -36 -52 -32 -46 -22C-52 -20 -46 -10 -36 -6C-24 -2 -10 2 0 4Z'
)
const WING_TIP = new Path2D('M-52 -50C-44 -36 -52 -32 -46 -22C-52 -20 -46 -10 -36 -6L-30 -14Z')
const BODY = new Path2D('M-46 6Q-8 -8 22 -2Q10 12 -22 12Q-38 12 -46 6Z')

/** Chim hạc vỗ cánh (`flap` từ -1 tới 1) */
export function drawCrane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  flap: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.lineCap = 'round'
  ctx.lineWidth = 2.4
  ctx.strokeStyle = '#26263A'
  ctx.beginPath()
  ctx.moveTo(-44, 4)
  ctx.lineTo(-92, 13)
  ctx.moveTo(-42, 7)
  ctx.lineTo(-88, 19)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#6E5A4A'
  ctx.lineWidth = 1.4
  ctx.fill(BODY)
  ctx.stroke(BODY)
  ctx.beginPath()
  ctx.moveTo(18, -1)
  ctx.quadraticCurveTo(46, -3, 62, -12)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(64, -13, 4.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#D32F2F'
  ctx.beginPath()
  ctx.arc(65, -16, 2.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#D9A24A'
  ctx.beginPath()
  ctx.moveTo(68, -13)
  ctx.lineTo(86, -10)
  ctx.lineTo(68, -10)
  ctx.fill()
  ctx.translate(-4, -2)
  ctx.scale(1, 0.55 + flap * 0.45)
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#6E5A4A'
  ctx.lineWidth = 1.4
  ctx.fill(WING)
  ctx.stroke(WING)
  ctx.fillStyle = '#26263A'
  ctx.fill(WING_TIP)
  ctx.restore()
}

/** Mây cuộn viền hồng */
export function drawSwirlCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.lineWidth = 2.4
  ctx.strokeStyle = '#E8A9B8'
  for (const [dx, dy, r] of [
    [-36, 0, 17],
    [-13, -13, 21],
    [15, -11, 19],
    [38, 0, 15]
  ]) {
    ctx.beginPath()
    ctx.arc(dx, dy, r, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(dx, dy, r * 0.5, 0.2, 4.6)
    ctx.stroke()
  }
  ctx.lineCap = 'round'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(-60, 15)
  ctx.lineTo(60, 15)
  ctx.stroke()
  ctx.restore()
}
