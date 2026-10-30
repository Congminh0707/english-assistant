import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import {
  bezier,
  STAGE_H,
  STAGE_W,
  seeded,
  walkPoints,
  type MapLayout,
  type Point
} from '@shared/kidsWorldLayout'
import {
  pointInPolygon,
  projectVn,
  VN_ARCHIPELAGOS,
  VN_ISLANDS,
  VN_ISLETS,
  VN_MAINLAND,
  VN_MOUNTAINS,
  VN_PER_LAT,
  VN_RIVERS,
  VN_SEA_LABEL,
  type LonLat
} from '@shared/vnMap'
import { landmarkBitmap } from './landmarkBitmap'

// Vẽ cảnh bản đồ của màn game bé lên một <canvas> 2D (docs/19-kids-world.md §5.4): biển có sóng, hình Việt Nam giản
// lược (src/shared/vnMap.ts — đất liền, đảo, Hoàng Sa, Trường Sa, sông, núi), con đường nối các nơi, cây, thuyền, bệ +
// công trình từng nơi kèm chấm vị trí thật, mây và chim (lớp màn hình, parallax), hạt hiệu ứng. Toạ độ theo đơn vị sân
// khấu; vật trang trí đặt bằng số giả ngẫu nhiên cố định nên không đổi giữa các lần mở.
export type ScenePlace = KidsWorldView['tiers'][number]['places'][number]

const INK = '#3b2a3a'

type TreeKind = 'pine' | 'round' | 'palm'
interface Tree extends Point {
  kind: TreeKind
  size: number
}
interface Mountain extends Point {
  size: number
  snow: boolean
}
interface Wave extends Point {
  phase: number
}
interface Boat extends Point {
  phase: number
  color: string
}
interface Cloud {
  x: number
  y: number
  s: number
  speed: number
}
interface Islet extends Point {
  r: number
}

export interface Scene {
  layout: MapLayout
  road: Path2D
  /** Bến thuyền: chỗ chuyển giữa đi ô tô và đi thuyền */
  docks: Point[]
  land: Path2D | null
  rivers: Path2D | null
  islets: Islet[]
  archipelagos: Array<{ id: 'paracel' | 'spratly'; label: Point; islets: Point[] }>
  seaLabel: Point | null
  trees: Tree[]
  mountains: Mountain[]
  waves: Wave[]
  boats: Boat[]
  clouds: Cloud[]
}

const proj = (ll: LonLat): Point => projectVn(ll[0], ll[1])

/** Đường khép kín mềm qua các điểm (cong bậc hai qua trung điểm) */
function smoothClosed(path: Path2D, pts: readonly Point[]): void {
  const n = pts.length
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  const start = mid(pts[n - 1], pts[0])
  path.moveTo(start.x, start.y)
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n])
    path.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y)
  }
  path.closePath()
}

function smoothOpen(path: Path2D, pts: readonly Point[]): void {
  path.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length - 1; i++) {
    const m = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 }
    path.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y)
  }
  const last = pts[pts.length - 1]
  path.lineTo(last.x, last.y)
}

function minDist(p: Point, pts: readonly Point[]): number {
  let best = Infinity
  for (const q of pts) best = Math.min(best, (p.x - q.x) ** 2 + (p.y - q.y) ** 2)
  return Math.sqrt(best)
}

export function buildScene(layout: MapLayout, geo: boolean): Scene {
  const pts = layout.points
  const roadPts = pts.length > 1 ? walkPoints(layout, 0, pts.length - 1, 30) : [...pts]
  const nearPlace = (p: Point): number => Math.min(minDist(p, pts), minDist(p, layout.anchors))
  const rnd = seeded(20261030)

  const polys = geo ? [VN_MAINLAND, ...VN_ISLANDS].map((poly) => poly.map(proj)) : []
  const islets: Islet[] = geo
    ? VN_ISLETS.map(([lo, la, r]) => ({ ...projectVn(lo, la), r: r * VN_PER_LAT }))
    : []
  const archipelagos = geo
    ? VN_ARCHIPELAGOS.map((a) => ({ id: a.id, label: proj(a.label), islets: a.islets.map(proj) }))
    : []
  const isLand = (p: Point): boolean =>
    polys.some((poly) => pointInPolygon(p, poly)) ||
    islets.some((i) => Math.hypot(i.x - p.x, i.y - p.y) < i.r)
  const nearLand = (p: Point, m: number): boolean =>
    isLand(p) ||
    isLand({ x: p.x + m, y: p.y }) ||
    isLand({ x: p.x - m, y: p.y }) ||
    isLand({ x: p.x, y: p.y + m }) ||
    isLand({ x: p.x, y: p.y - m })
  // Đường bộ chỉ vẽ trên đất; đoạn có đi biển thì dừng ở bờ và đặt bến thuyền ở chỗ lên/xuống thuyền
  const road = new Path2D()
  const docks: Point[] = []
  for (const s of layout.legs.flat()) {
    if (!s.sea) {
      road.moveTo(s.p0.x, s.p0.y)
      road.bezierCurveTo(s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.p1.x, s.p1.y)
      continue
    }
    let onLand = isLand(s.p0)
    if (onLand) road.moveTo(s.p0.x, s.p0.y)
    for (let k = 1; k <= 60; k++) {
      const q = bezier(s, k / 60)
      const here = isLand(q)
      if (here !== onLand) {
        docks.push(q)
        if (here) road.moveTo(q.x, q.y)
      } else if (here) road.lineTo(q.x, q.y)
      onLand = here
    }
  }

  const nearArchipelago = (p: Point, m: number): boolean =>
    archipelagos.some((a) => a.islets.some((i) => Math.hypot(i.x - p.x, i.y - p.y) < m))

  let land: Path2D | null = null
  let rivers: Path2D | null = null
  if (geo) {
    land = new Path2D()
    for (const poly of polys) smoothClosed(land, poly)
    rivers = new Path2D()
    for (const r of VN_RIVERS) smoothOpen(rivers, r.map(proj))
  }

  const mountains: Mountain[] = []
  for (const [lo, la, r] of geo ? VN_MOUNTAINS : []) {
    const c = projectVn(lo, la)
    const rad = r * VN_PER_LAT
    for (let k = 0, n = 0; k < 60 && n < 7; k++) {
      const p = { x: c.x + (rnd() * 2 - 1) * rad, y: c.y + (rnd() * 2 - 1) * rad * 0.7 }
      if (!isLand(p) || nearPlace(p) < 170 || minDist(p, roadPts) < 60) continue
      if (mountains.some((m) => Math.hypot(m.x - p.x, m.y - p.y) < 60)) continue
      mountains.push({ ...p, size: 0.8 + rnd() * 0.6, snow: la > 20.5 && rnd() < 0.5 })
      n++
    }
  }

  const trees: Tree[] = []
  const bounds = polys[0]
    ? polys[0].reduce(
        (b, p) => ({
          x0: Math.min(b.x0, p.x),
          x1: Math.max(b.x1, p.x),
          y0: Math.min(b.y0, p.y),
          y1: Math.max(b.y1, p.y)
        }),
        { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity }
      )
    : { x0: 0, x1: 0, y0: 0, y1: 0 }
  const southY = projectVn(0, 12.5).y
  const northY = projectVn(0, 19).y
  for (let tries = 0; geo && tries < 9000 && trees.length < 260; tries++) {
    const p = {
      x: bounds.x0 + rnd() * (bounds.x1 - bounds.x0),
      y: bounds.y0 + rnd() * (bounds.y1 - bounds.y0)
    }
    if (!isLand(p) || nearPlace(p) < 165 || minDist(p, roadPts) < 48) continue
    if (trees.some((t) => Math.hypot(t.x - p.x, t.y - p.y) < 40)) continue
    if (mountains.some((m) => Math.hypot(m.x - p.x, m.y - p.y) < 50)) continue
    const kind: TreeKind =
      p.y < northY ? (rnd() < 0.65 ? 'pine' : 'round') : p.y < southY ? 'round' : 'palm'
    trees.push({ ...p, kind, size: 0.7 + rnd() * 0.4 })
  }

  const waves: Wave[] = []
  for (let tries = 0; tries < 8000 && waves.length < 420; tries++) {
    const p = { x: rnd() * layout.width, y: rnd() * layout.height }
    if (nearLand(p, 70) || nearPlace(p) < 200 || nearArchipelago(p, 40)) continue
    waves.push({ ...p, phase: rnd() * Math.PI * 2 })
  }

  const BOAT_COLORS = ['#e85d5d', '#f2a541', '#5d8de8', '#e8e05d']
  const boats: Boat[] = []
  for (let tries = 0; tries < 4000 && boats.length < 12; tries++) {
    const p = { x: rnd() * layout.width, y: 200 + rnd() * (layout.height - 400) }
    if (nearLand(p, 110) || nearPlace(p) < 260 || nearArchipelago(p, 90)) continue
    if (boats.some((b) => Math.hypot(b.x - p.x, b.y - p.y) < 420)) continue
    boats.push({ ...p, phase: rnd() * 6, color: BOAT_COLORS[boats.length % BOAT_COLORS.length] })
  }

  const clouds: Cloud[] = Array.from({ length: 7 }, (_, i) => ({
    x: rnd() * (STAGE_W + 400) - 200,
    y: (i / 7) * (STAGE_H * 1.6) + rnd() * 80,
    s: 0.6 + rnd() * 0.6,
    speed: 6 + rnd() * 10
  }))

  return {
    layout,
    road,
    docks,
    land,
    rivers,
    islets,
    archipelagos,
    seaLabel: geo ? proj(VN_SEA_LABEL) : null,
    trees: trees.sort((a, b) => a.y - b.y),
    mountains,
    waves,
    boats,
    clouds
  }
}

// --- Hình vẽ nhỏ ---

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number
): void {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = INK
  ctx.stroke()
}

function drawTree(ctx: CanvasRenderingContext2D, t: Tree, time: number): void {
  const s = t.size
  ctx.save()
  ctx.translate(t.x, t.y)
  ctx.scale(s, s)
  ctx.fillStyle = 'rgb(40 60 30 / 18%)'
  ellipse(ctx, 0, 4, 26, 9)
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = INK
  if (t.kind === 'palm') {
    const sway = Math.sin(time * 1.3 + t.x * 0.01) * 0.06
    ctx.rotate(sway)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(8, -30, 2, -58)
    ctx.lineWidth = 9
    ctx.stroke()
    ctx.lineWidth = 5
    ctx.strokeStyle = '#b07a4a'
    ctx.stroke()
    for (const a of [-2.6, -1.9, -1.2, -0.5, 0.2]) {
      ctx.beginPath()
      ctx.ellipse(2 + Math.cos(a) * 20, -58 + Math.sin(a) * 10, 22, 7, a, 0, Math.PI * 2)
      ctx.fillStyle = '#4fae4a'
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = INK
      ctx.stroke()
    }
  } else if (t.kind === 'pine') {
    ctx.fillStyle = '#8a5a35'
    ctx.fillRect(-4, -12, 8, 14)
    ctx.strokeRect(-4, -12, 8, 14)
    for (const [w, y] of [
      [26, -10],
      [21, -28],
      [15, -44]
    ]) {
      ctx.beginPath()
      ctx.moveTo(-w, y)
      ctx.lineTo(w, y)
      ctx.lineTo(0, y - 30)
      ctx.closePath()
      ctx.fillStyle = '#2f8f57'
      ctx.fill()
      ctx.stroke()
    }
  } else {
    ctx.fillStyle = '#8a5a35'
    ctx.fillRect(-5, -16, 10, 18)
    ctx.strokeRect(-5, -16, 10, 18)
    blob(ctx, -12, -28, 16, '#55b357')
    blob(ctx, 12, -28, 16, '#55b357')
    blob(ctx, 0, -42, 20, '#62c062')
    ctx.fillStyle = 'rgb(255 255 255 / 35%)'
    ellipse(ctx, -6, -50, 8, 5)
    ctx.fill()
  }
  ctx.restore()
}

function drawMountain(ctx: CanvasRenderingContext2D, m: Mountain): void {
  ctx.save()
  ctx.translate(m.x, m.y)
  ctx.scale(m.size, m.size)
  ctx.lineWidth = 3
  ctx.strokeStyle = INK
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(-46, 0)
  ctx.lineTo(-6, -64)
  ctx.lineTo(40, 0)
  ctx.closePath()
  ctx.fillStyle = '#6d9e5a'
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-6, -64)
  ctx.lineTo(40, 0)
  ctx.lineTo(6, 0)
  ctx.closePath()
  ctx.fillStyle = '#5a8a4a'
  ctx.fill()
  if (m.snow) {
    ctx.beginPath()
    ctx.moveTo(-20, -42)
    ctx.lineTo(-6, -64)
    ctx.lineTo(9, -44)
    ctx.lineTo(-2, -48)
    ctx.lineTo(-10, -40)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

function drawBoat(ctx: CanvasRenderingContext2D, b: Boat, t: number): void {
  const bob = Math.sin(t * 1.6 + b.phase) * 3
  const drift = Math.sin(t * 0.25 + b.phase) * 40
  ctx.save()
  ctx.translate(b.x + drift, b.y + bob)
  ctx.rotate(Math.sin(t * 1.6 + b.phase) * 0.05)
  ctx.lineWidth = 3
  ctx.strokeStyle = INK
  ctx.beginPath()
  ctx.moveTo(-34, 0)
  ctx.lineTo(34, 0)
  ctx.lineTo(24, 14)
  ctx.lineTo(-24, 14)
  ctx.closePath()
  ctx.fillStyle = '#8a5a35'
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -52)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(3, -48)
  ctx.quadraticCurveTo(30, -26, 3, -6)
  ctx.closePath()
  ctx.fillStyle = b.color
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = 'rgb(255 255 255 / 70%)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(-44, 18)
  ctx.quadraticCurveTo(-36, 14, -28, 18)
  ctx.moveTo(28, 18)
  ctx.quadraticCurveTo(36, 14, 44, 18)
  ctx.stroke()
  ctx.restore()
}

const STAGE_PLANT: Record<string, string> = {
  seed: '#b07a4a',
  sprout: '#5cb84a',
  flower: '#ff7eb6'
}

function drawPlant(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stage: string,
  thirsty: boolean,
  t: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(thirsty ? 0.35 : Math.sin(t * 2 + x) * 0.08)
  ctx.lineWidth = 2.5
  ctx.strokeStyle = INK
  if (stage === 'seed') {
    ellipse(ctx, 0, 0, 6, 4.5)
    ctx.fillStyle = STAGE_PLANT.seed
    ctx.fill()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -14)
    ctx.strokeStyle = '#3f8a35'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.strokeStyle = INK
    ctx.lineWidth = 2
    for (const d of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(d * 6, -9, 6, 3.5, d * -0.5, 0, Math.PI * 2)
      ctx.fillStyle = STAGE_PLANT.sprout
      ctx.fill()
      ctx.stroke()
    }
    if (stage === 'flower') {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(Math.cos(a) * 5, -18 + Math.sin(a) * 5, 4.5, 0, Math.PI * 2)
        ctx.fillStyle = STAGE_PLANT.flower
        ctx.fill()
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(0, -18, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = '#ffd34d'
      ctx.fill()
    }
  }
  ctx.restore()
  if (thirsty) {
    ctx.beginPath()
    ctx.moveTo(x + 11, y - 28)
    ctx.quadraticCurveTo(x + 17, y - 19, x + 11, y - 15)
    ctx.quadraticCurveTo(x + 5, y - 19, x + 11, y - 28)
    ctx.fillStyle = '#4aa8d8'
    ctx.fill()
  }
}

/** Chấm vị trí thật + đường chỉ tới bệ khi bệ phải dời ra cho khỏi đè */
/** Bến gỗ nhỏ có cọc */
function drawDock(ctx: CanvasRenderingContext2D, p: Point): void {
  ctx.save()
  ctx.lineWidth = 3
  ctx.strokeStyle = INK
  for (const dx of [-30, 30]) {
    ctx.fillStyle = '#6b4a32'
    ctx.fillRect(p.x + dx - 4, p.y - 6, 8, 26)
    ctx.strokeRect(p.x + dx - 4, p.y - 6, 8, 26)
  }
  ctx.fillStyle = '#b07a4f'
  ctx.beginPath()
  ctx.roundRect(p.x - 40, p.y - 16, 80, 22, 5)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = 'rgb(59 42 58 / 45%)'
  ctx.lineWidth = 2
  for (const dx of [-20, 0, 20]) {
    ctx.beginPath()
    ctx.moveTo(p.x + dx, p.y - 14)
    ctx.lineTo(p.x + dx, p.y + 4)
    ctx.stroke()
  }
  ctx.restore()
}

function drawPin(ctx: CanvasRenderingContext2D, anchor: Point, p: Point): void {
  if (Math.hypot(anchor.x - p.x, anchor.y - p.y) < 30) return
  ctx.save()
  ctx.beginPath()
  ctx.arc(anchor.x, anchor.y, 11, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(anchor.x, anchor.y, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#ff5a5a'
  ctx.fill()
  ctx.restore()
}

/** Bụi cây, đá và cỏ dọc mép bệ (cố định theo góc) cho bệ hoà vào đất thay vì như chiếc đĩa */
function drawRim(ctx: CanvasRenderingContext2D, p: Point): void {
  ctx.save()
  ctx.lineWidth = 3
  ctx.strokeStyle = INK
  const items: Array<[number, 'bush' | 'rock' | 'tuft', number]> = [
    [3.3, 'bush', 1],
    [3.75, 'rock', 0.8],
    [4.3, 'bush', 1.2],
    [4.9, 'tuft', 1],
    [5.5, 'bush', 0.9],
    [5.95, 'rock', 1],
    [0.25, 'tuft', 1],
    [2.9, 'tuft', 1]
  ]
  for (const [a, kind, s] of items) {
    const x = p.x + Math.cos(a) * 96
    const y = p.y + Math.sin(a) * 35
    if (kind === 'bush') {
      for (const [dx, dy, r, c] of [
        [-7, 0, 9, '#5fae48'],
        [6, -1, 10, '#6fc457'],
        [0, -7, 9, '#7fd065']
      ] as const) {
        ctx.beginPath()
        ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2)
        ctx.fillStyle = c
        ctx.fill()
        ctx.stroke()
      }
    } else if (kind === 'rock') {
      ctx.beginPath()
      ctx.ellipse(x, y, 13 * s, 8 * s, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#b9b4a8'
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(x - 3 * s, y - 2 * s, 6 * s, 3 * s, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#d8d3c6'
      ctx.fill()
    } else {
      ctx.strokeStyle = '#4f9a3b'
      ctx.lineCap = 'round'
      for (const dx of [-5, 0, 5]) {
        ctx.beginPath()
        ctx.moveTo(x + dx, y + 3)
        ctx.lineTo(x + dx * 1.6, y - 9 - Math.abs(dx))
        ctx.stroke()
      }
      ctx.strokeStyle = INK
      ctx.lineCap = 'butt'
    }
  }
  ctx.restore()
}

function drawPlace(
  ctx: CanvasRenderingContext2D,
  p: Point,
  place: ScenePlace,
  today: boolean,
  t: number
): void {
  const locked = place.state === 'locked'
  ctx.save()
  if (today && !locked) {
    ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t * 4)
    ctx.lineWidth = 9
    ctx.strokeStyle = '#ffd34d'
    ellipse(ctx, p.x, p.y + 8, 124 + Math.sin(t * 4) * 4, 50)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  if (locked) ctx.filter = 'grayscale(1) brightness(1.1)'
  ctx.fillStyle = 'rgb(30 50 20 / 20%)'
  ellipse(ctx, p.x, p.y + 26, 110, 42)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = INK
  ctx.fillStyle = '#b4794a'
  ellipse(ctx, p.x, p.y + 15, 102, 40)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#9fdc72'
  ellipse(ctx, p.x, p.y, 102, 38)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#b6e889'
  ellipse(ctx, p.x - 8, p.y - 6, 72, 23)
  ctx.fill()

  drawRim(ctx, p)

  const bmp = landmarkBitmap(place.landmark)
  if (bmp) {
    const k = Math.min(190 / bmp.width, 175 / bmp.height)
    const w = bmp.width * k
    const h = bmp.height * k
    ctx.fillStyle = 'rgb(30 50 20 / 22%)'
    ellipse(ctx, p.x, p.y + 4, w * 0.42, 14)
    ctx.fill()
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bmp, p.x - w / 2, p.y + 12 - h, w, h)
  }

  const n = place.words.length
  place.words.forEach((w, i) => {
    if (w.stage === 'hidden') return
    const a = Math.PI * (0.12 + (0.76 * i) / Math.max(1, n - 1))
    drawPlant(ctx, p.x - Math.cos(a) * 86, p.y + Math.sin(a) * 27 + 6, w.stage, w.thirsty, t)
  })

  if (place.state === 'done') {
    ctx.lineWidth = 4
    ctx.strokeStyle = INK
    ctx.beginPath()
    ctx.moveTo(p.x + 86, p.y + 2)
    ctx.lineTo(p.x + 86, p.y - 58)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(p.x + 88, p.y - 58)
    ctx.lineTo(p.x + 122, p.y - 48 + Math.sin(t * 3) * 3)
    ctx.lineTo(p.x + 88, p.y - 38)
    ctx.closePath()
    ctx.fillStyle = '#ff5a5a'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.stroke()
  }
  ctx.restore()

  if (locked) {
    ctx.save()
    for (const [dx, dy, r] of [
      [-64, -30, 50],
      [0, -80, 64],
      [64, -36, 52],
      [-22, 8, 50],
      [44, 14, 44]
    ]) {
      ctx.beginPath()
      ctx.arc(p.x + dx + Math.sin(t * 0.6 + dx) * 5, p.y + dy, r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgb(245 248 255 / 72%)'
      ctx.fill()
    }
    ctx.restore()
  }
}

/** Mây (lớp màn hình): trôi ngang, cuộn chậm hơn bản đồ */
function drawClouds(ctx: CanvasRenderingContext2D, scene: Scene, camY: number, t: number): void {
  const span = STAGE_W + 500
  const vSpan = STAGE_H * 1.6
  for (const c of scene.clouds) {
    const x = ((((c.x + t * c.speed) % span) + span) % span) - 250
    const y = ((((c.y - camY * 0.35) % vSpan) + vSpan) % vSpan) - STAGE_H * 0.3
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(c.s, c.s)
    ctx.globalAlpha = 0.85
    ctx.fillStyle = '#dbe8f6'
    for (const [dx, dy, r] of [
      [-60, 10, 34],
      [-20, 0, 46],
      [30, 4, 40],
      [70, 14, 28]
    ]) {
      ctx.beginPath()
      ctx.arc(dx, dy + 8, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#ffffff'
    for (const [dx, dy, r] of [
      [-60, 6, 32],
      [-20, -6, 44],
      [30, -2, 38],
      [70, 10, 26]
    ]) {
      ctx.beginPath()
      ctx.arc(dx, dy, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
}

function drawBirds(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.save()
  ctx.strokeStyle = INK
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    const x = ((t * 40 + i * 70) % (STAGE_W + 300)) - 150
    const y = 140 + i * 26 + Math.sin(t + i) * 10
    const flap = Math.sin(t * 8 + i) * 6
    ctx.beginPath()
    ctx.moveTo(x - 14, y - flap)
    ctx.quadraticCurveTo(x - 6, y - 6, x, y)
    ctx.quadraticCurveTo(x + 6, y - 6, x + 14, y - flap)
    ctx.stroke()
  }
  ctx.restore()
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save()
  ctx.font = `800 ${size}px ui-rounded, "Segoe UI", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = size * 0.22
  ctx.strokeStyle = 'rgb(255 255 255 / 85%)'
  ctx.strokeText(text, x, y)
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.restore()
}

/** Hạt hiệu ứng ngắn (toạ độ bản đồ): bụi dưới chân, sao bung khi tới nơi, vòng sóng khi chạm */
export interface Particle {
  kind: 'dust' | 'spark' | 'ring'
  x: number
  y: number
  vx: number
  vy: number
  /** Thời điểm sinh và thời gian sống (giây, theo `clock`) */
  born: number
  life: number
  size: number
  color: string
}

function drawStar(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.45 : r
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  ctx.closePath()
}

function drawParticles(ctx: CanvasRenderingContext2D, list: readonly Particle[], t: number): void {
  for (const p of list) {
    const age = (t - p.born) / p.life
    if (age < 0 || age >= 1) continue
    const dt = t - p.born
    const x = p.x + p.vx * dt
    const y = p.y + p.vy * dt + (p.kind === 'spark' ? 260 * dt * dt : 0)
    ctx.save()
    ctx.globalAlpha = 1 - age
    ctx.translate(x, y)
    if (p.kind === 'dust') {
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(0, 0, p.size * (0.6 + age), 0, Math.PI * 2)
      ctx.fill()
    } else if (p.kind === 'spark') {
      ctx.rotate(dt * 6)
      drawStar(ctx, p.size)
      ctx.fillStyle = p.color
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = INK
      ctx.stroke()
    } else {
      ctx.lineWidth = 8 * (1 - age)
      ctx.strokeStyle = p.color
      ellipse(ctx, 0, 0, p.size * (0.4 + age), p.size * (0.4 + age) * 0.4)
      ctx.stroke()
    }
    ctx.restore()
  }
}

export interface DrawState {
  /** Tâm camera theo đơn vị sân khấu và độ phóng */
  camX: number
  camY: number
  zoom: number
  /** Thời gian (giây) cho chuyển động nền; cố định khi giảm chuyển động */
  t: number
  /** Đồng hồ thật (giây) để tính tuổi hạt hiệu ứng */
  clock: number
  places: ReadonlyMap<string, ScenePlace>
  todayId: string | null
  particles: readonly Particle[]
  /** Chân thú cưng (vẽ bóng dưới chân) + độ cao đang nhảy */
  /** `shadow`: nửa bề ngang bóng (0 = không bóng, vd đang trên thuyền) */
  pet: { x: number; y: number; hop: number; shadow: number } | null
  labels: { sea: string; paracel: string; spratly: string }
}

/** Vẽ một khung hình; `k` = số px canvas cho một đơn vị sân khấu */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  s: DrawState,
  k: number
): void {
  const { layout } = scene
  ctx.setTransform(k, 0, 0, k, 0, 0)
  const sea = ctx.createLinearGradient(0, 0, 0, STAGE_H)
  sea.addColorStop(0, '#79cdf2')
  sea.addColorStop(1, '#46a5db')
  ctx.fillStyle = sea
  ctx.fillRect(0, 0, STAGE_W, STAGE_H)

  const z = s.zoom
  ctx.setTransform(
    k * z,
    0,
    0,
    k * z,
    k * (STAGE_W / 2 - s.camX * z),
    k * (STAGE_H / 2 - s.camY * z)
  )
  const y0 = s.camY - STAGE_H / 2 / z - 200
  const y1 = s.camY + STAGE_H / 2 / z + 260
  const x0 = s.camX - STAGE_W / 2 / z - 200
  const x1 = s.camX + STAGE_W / 2 / z + 200
  const visible = (p: Point): boolean => p.y > y0 && p.y < y1 && p.x > x0 && p.x < x1

  ctx.strokeStyle = 'rgb(255 255 255 / 55%)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (const w of scene.waves) {
    if (!visible(w)) continue
    const dx = Math.sin(s.t * 0.8 + w.phase) * 8
    ctx.moveTo(w.x - 16 + dx, w.y)
    ctx.quadraticCurveTo(w.x - 8 + dx, w.y - 7, w.x + dx, w.y)
    ctx.quadraticCurveTo(w.x + 8 + dx, w.y - 7, w.x + 16 + dx, w.y)
  }
  ctx.stroke()

  if (scene.seaLabel) {
    label(ctx, s.labels.sea, scene.seaLabel.x, scene.seaLabel.y, 64, 'rgb(30 90 140 / 75%)')
  }

  // Đất: viền bọt sóng → bãi cát → cỏ
  if (scene.land) {
    ctx.lineJoin = 'round'
    ctx.lineWidth = 34 + Math.sin(s.t * 1.3) * 6
    ctx.strokeStyle = 'rgb(255 255 255 / 45%)'
    ctx.stroke(scene.land)
    ctx.lineWidth = 18
    ctx.strokeStyle = '#f2d78f'
    ctx.stroke(scene.land)
    ctx.fillStyle = '#86c766'
    ctx.fill(scene.land)
  }
  for (const i of scene.islets) {
    ctx.beginPath()
    ctx.arc(i.x, i.y, i.r + 8, 0, Math.PI * 2)
    ctx.fillStyle = '#f2d78f'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(i.x, i.y, i.r, 0, Math.PI * 2)
    ctx.fillStyle = '#86c766'
    ctx.fill()
  }
  for (const a of scene.archipelagos) {
    for (const i of a.islets) {
      ctx.beginPath()
      ctx.arc(i.x, i.y, 13 + Math.sin(s.t * 1.2 + i.x) * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgb(255 255 255 / 55%)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(i.x, i.y, 9, 0, Math.PI * 2)
      ctx.fillStyle = '#f2d78f'
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = INK
      ctx.stroke()
    }
    label(
      ctx,
      a.id === 'paracel' ? s.labels.paracel : s.labels.spratly,
      a.label.x,
      a.label.y,
      34,
      INK
    )
  }
  if (scene.rivers) {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 14
    ctx.strokeStyle = '#4aa8d8'
    ctx.stroke(scene.rivers)
    ctx.lineWidth = 6
    ctx.strokeStyle = '#8fd3f5'
    ctx.stroke(scene.rivers)
  }
  if (!scene.land) {
    // Tầng chưa có bản đồ địa lý: mỗi nơi là một đảo nhỏ
    for (const p of layout.points) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 190, 0, Math.PI * 2)
      ctx.fillStyle = '#f2d78f'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(p.x, p.y, 172, 0, Math.PI * 2)
      ctx.fillStyle = '#86c766'
      ctx.fill()
    }
  }

  ctx.lineCap = 'round'
  ctx.lineWidth = 36
  ctx.strokeStyle = '#d9b46e'
  ctx.stroke(scene.road)
  ctx.lineWidth = 27
  ctx.strokeStyle = '#f5dfa6'
  ctx.stroke(scene.road)
  ctx.lineWidth = 4
  ctx.strokeStyle = '#fff6d8'
  ctx.setLineDash([14, 20])
  ctx.lineDashOffset = -s.t * 8
  ctx.stroke(scene.road)
  ctx.setLineDash([])
  for (const d of scene.docks) if (visible(d)) drawDock(ctx, d)

  for (const b of scene.boats) if (visible(b)) drawBoat(ctx, b, s.t)

  layout.points.forEach((p, i) => {
    const a = layout.anchors[i]
    if (a && visible(p)) drawPin(ctx, a, p)
  })

  const items: Array<{ y: number; draw: () => void }> = []
  for (const m of scene.mountains)
    if (visible(m)) items.push({ y: m.y, draw: () => drawMountain(ctx, m) })
  for (const tr of scene.trees)
    if (visible(tr)) items.push({ y: tr.y, draw: () => drawTree(ctx, tr, s.t) })
  for (const p of layout.points) {
    const place = s.places.get(p.id)
    if (!place || !visible(p)) continue
    items.push({ y: p.y, draw: () => drawPlace(ctx, p, place, place.id === s.todayId, s.t) })
  }
  items.sort((a, b) => a.y - b.y)
  for (const it of items) it.draw()

  if (s.pet && s.pet.shadow > 0) {
    const k2 = 1 - Math.min(0.6, s.pet.hop / 260)
    ctx.fillStyle = `rgb(30 40 20 / ${Math.round(25 * k2)}%)`
    ellipse(ctx, s.pet.x, s.pet.y - 4, s.pet.shadow * k2, (s.pet.shadow / 3) * k2)
    ctx.fill()
  }
  drawParticles(ctx, s.particles, s.clock)

  ctx.setTransform(k, 0, 0, k, 0, 0)
  drawClouds(ctx, scene, s.camY, s.t)
  drawBirds(ctx, s.t)
}
