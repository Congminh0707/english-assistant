import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import {
  bezier,
  PLACE_BOX,
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
import type { MapQuality } from './mapQuality'
import { padImage } from './padImages'
import {
  BOARD_INK,
  boardMountain,
  boardPin,
  boardRoad,
  boardTree,
  drawCrane,
  drawSwirlCloud,
  fillLand,
  landCells
} from './sceneBase'

// Vẽ cảnh bản đồ của màn game bé lên một <canvas> 2D (docs/19-kids-world.md §5.4): biển có sóng, hình Việt Nam giản
// lược (src/shared/vnMap.ts — đất liền, đảo, Hoàng Sa, Trường Sa, sông, núi), con đường nối các nơi, cây, thuyền, bệ +
// công trình từng nơi kèm chấm vị trí thật, mây và chim (lớp màn hình, parallax), hạt hiệu ứng. Toạ độ theo đơn vị sân
// khấu; vật trang trí đặt bằng số giả ngẫu nhiên cố định nên không đổi giữa các lần mở.
export type ScenePlace = KidsWorldView['tiers'][number]['places'][number]

const INK = BOARD_INK
/** Rộng của bệ công trình trên bản đồ (đơn vị sân khấu) */
const PAD_W = PLACE_BOX.left + PLACE_BOX.right + 16
/** Lớp nền vẽ sẵn: số px cho một đơn vị sân khấu */
const BASE_SCALE = { high: 0.72, low: 0.45 }

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
  /** Mảng đất trang trí */
  cells: Point[][]
  /** Lớp nền vẽ sẵn, dựng khi vẽ khung đầu */
  base: { canvas: HTMLCanvasElement; quality: MapQuality } | null
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
      if (!isLand(p) || nearPlace(p) < 250 || minDist(p, roadPts) < 90) continue
      if (mountains.some((m) => Math.hypot(m.x - p.x, m.y - p.y) < 60)) continue
      mountains.push({ ...p, size: 0.62 + rnd() * 0.4, snow: la > 20.5 && rnd() < 0.5 })
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
  for (let tries = 0; geo && tries < 9000 && trees.length < 150; tries++) {
    const p = {
      x: bounds.x0 + rnd() * (bounds.x1 - bounds.x0),
      y: bounds.y0 + rnd() * (bounds.y1 - bounds.y0)
    }
    if (!isLand(p) || nearPlace(p) < 190 || minDist(p, roadPts) < 76) continue
    if (trees.some((t) => Math.hypot(t.x - p.x, t.y - p.y) < 92)) continue
    if (mountains.some((m) => Math.hypot(m.x - p.x, m.y - p.y) < 80)) continue
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

  // Mảng đất trang trí: rải điểm trên đất, cách nhau đủ xa
  const seeds: Point[] = []
  for (let tries = 0; geo && tries < 6000 && seeds.length < 36; tries++) {
    const p = {
      x: bounds.x0 + rnd() * (bounds.x1 - bounds.x0),
      y: bounds.y0 + rnd() * (bounds.y1 - bounds.y0)
    }
    if (isLand(p) && minDist(p, seeds) > 170) seeds.push(p)
  }
  const cells = geo ? landCells(bounds, seeds) : []

  const clouds: Cloud[] = Array.from({ length: 7 }, (_, i) => ({
    x: rnd() * (STAGE_W + 400) - 200,
    y: (i / 7) * (STAGE_H * 1.6) + rnd() * 80,
    s: 0.6 + rnd() * 0.6,
    speed: 6 + rnd() * 10
  }))

  return {
    layout,
    road,
    cells,
    base: null,
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

function drawPlace(
  ctx: CanvasRenderingContext2D,
  p: Point,
  place: ScenePlace,
  today: boolean,
  t: number
): void {
  const locked = place.state === 'locked'
  ctx.save()
  ctx.fillStyle = 'rgb(10 58 64 / 30%)'
  ellipse(ctx, p.x + 4, p.y + 34, PAD_W * 0.46, 42)
  ctx.fill()
  if (today && !locked) {
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 4)
    ctx.lineWidth = 9
    ctx.strokeStyle = '#F7B91A'
    ellipse(ctx, p.x, p.y + 14, PAD_W * 0.56, 66)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  if (locked) ctx.filter = 'grayscale(1) brightness(1.1)'
  const pad = padImage(place.landmark)
  if (pad) {
    const h = (PAD_W * pad.naturalHeight) / pad.naturalWidth
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(pad, p.x - PAD_W / 2, p.y + 46 - h, PAD_W, h)
  }

  const n = place.words.length
  place.words.forEach((w, i) => {
    if (w.stage === 'hidden') return
    const a = Math.PI * (0.12 + (0.76 * i) / Math.max(1, n - 1))
    const px = p.x - Math.cos(a) * PAD_W * 0.4
    drawPlant(ctx, px, p.y + Math.sin(a) * 26 + 16, w.stage, w.thirsty, t)
  })

  if (place.state === 'done') {
    const fx = p.x + PAD_W * 0.43
    ctx.lineWidth = 5
    ctx.strokeStyle = INK
    ctx.beginPath()
    ctx.moveTo(fx, p.y + 6)
    ctx.lineTo(fx, p.y - 96)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(fx + 2, p.y - 96)
    ctx.lineTo(fx + 46, p.y - 82 + Math.sin(t * 3) * 3)
    ctx.lineTo(fx + 2, p.y - 66)
    ctx.closePath()
    ctx.fillStyle = '#E2483E'
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
  for (const c of scene.clouds.slice(0, 4)) {
    const x = ((((c.x + t * c.speed) % span) + span) % span) - 250
    const y = ((((c.y - camY * 0.35) % vSpan) + vSpan) % vSpan) - STAGE_H * 0.3
    drawSwirlCloud(ctx, x, y, c.s * 1.3)
  }
}

/** Đàn hạc bay ngang màn hình */
function drawBirds(ctx: CanvasRenderingContext2D, t: number): void {
  const span = STAGE_W + 500
  for (const [dx, dy, s, d] of [
    [0, 90, 0.56, 0],
    [-110, 120, 0.46, 0.7],
    [-80, 55, 0.42, 1.4]
  ]) {
    const x = ((t * 26) % span) - 200 + dx
    drawCrane(ctx, x, dy + Math.sin(t * 0.7 + d) * 8, s, Math.sin(t * 3.2 + d))
  }
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
  /** Mức thấp: bỏ sóng động, mây, chim */
  quality: MapQuality
}

function drawWaves(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  t: number,
  seen: (p: Point) => boolean
): void {
  ctx.strokeStyle = 'rgb(255 255 255 / 60%)'
  ctx.lineWidth = 3.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (const w of scene.waves) {
    if (!seen(w)) continue
    const dx = Math.sin(t * 0.8 + w.phase) * 8
    ctx.moveTo(w.x - 26 + dx, w.y)
    ctx.quadraticCurveTo(w.x - 13 + dx, w.y - 12, w.x + dx, w.y)
    ctx.quadraticCurveTo(w.x + 13 + dx, w.y - 12, w.x + 26 + dx, w.y)
  }
  ctx.stroke()
}

/** Vẽ phần không đổi của bản đồ một lần */
function paintBase(ctx: CanvasRenderingContext2D, scene: Scene, s: DrawState): void {
  const { layout } = scene
  if (s.quality === 'low') drawWaves(ctx, scene, 0, () => true)
  if (scene.seaLabel) {
    label(ctx, s.labels.sea, scene.seaLabel.x, scene.seaLabel.y, 64, 'rgb(14 90 120 / 85%)')
  }
  if (scene.land) fillLand(ctx, scene.land, scene.cells)
  for (const i of scene.islets) {
    ctx.beginPath()
    ctx.arc(i.x, i.y, i.r + 10, 0, Math.PI * 2)
    ctx.fillStyle = '#F2DDA6'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(i.x, i.y, i.r, 0, Math.PI * 2)
    ctx.fillStyle = '#7EDB62'
    ctx.fill()
  }
  for (const a of scene.archipelagos) {
    for (const i of a.islets) {
      ctx.beginPath()
      ctx.arc(i.x, i.y, 12, 0, Math.PI * 2)
      ctx.fillStyle = '#F2DDA6'
      ctx.fill()
      ctx.lineWidth = 2
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
    ctx.strokeStyle = '#12B4C8'
    ctx.stroke(scene.rivers)
    ctx.lineWidth = 6
    ctx.strokeStyle = '#6FD3E8'
    ctx.stroke(scene.rivers)
  }
  if (!scene.land) {
    // Tầng chưa có bản đồ địa lý: mỗi nơi là một đảo nhỏ
    for (const p of layout.points) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 190, 0, Math.PI * 2)
      ctx.fillStyle = '#F2DDA6'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(p.x, p.y, 172, 0, Math.PI * 2)
      ctx.fillStyle = '#7EDB62'
      ctx.fill()
    }
  }
  boardRoad(ctx, scene.road)
  for (const d of scene.docks) drawDock(ctx, d)
  layout.points.forEach((p, i) => {
    const a = layout.anchors[i]
    if (a) boardPin(ctx, a, p)
  })
  const items = [
    ...scene.mountains.map((m) => ({
      y: m.y,
      draw: () => boardMountain(ctx, m.x, m.y, m.size, m.snow)
    })),
    ...scene.trees.map((t, i) => ({
      y: t.y,
      draw: () => boardTree(ctx, t.x, t.y, t.size * 0.72, i + 7)
    }))
  ]
  items.sort((a, b) => a.y - b.y)
  for (const it of items) it.draw()
}

function baseCanvas(scene: Scene, s: DrawState): HTMLCanvasElement {
  if (scene.base?.quality === s.quality) return scene.base.canvas
  const k = BASE_SCALE[s.quality]
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(scene.layout.width * k)
  canvas.height = Math.ceil(scene.layout.height * k)
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(k, k)
    paintBase(ctx, scene, s)
  }
  scene.base = { canvas, quality: s.quality }
  return canvas
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
  const sea = ctx.createLinearGradient(0, 0, STAGE_W, STAGE_H)
  sea.addColorStop(0, '#27D3D6')
  sea.addColorStop(0.5, '#12B4C8')
  sea.addColorStop(1, '#1E93D6')
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
  const y0 = s.camY - STAGE_H / 2 / z - 240
  const y1 = s.camY + STAGE_H / 2 / z + 300
  const x0 = s.camX - STAGE_W / 2 / z - 240
  const x1 = s.camX + STAGE_W / 2 / z + 240
  const visible = (p: Point): boolean => p.y > y0 && p.y < y1 && p.x > x0 && p.x < x1

  if (s.quality === 'high') drawWaves(ctx, scene, s.t, visible)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = s.quality === 'high' ? 'high' : 'low'
  ctx.drawImage(baseCanvas(scene, s), 0, 0, layout.width, layout.height)

  if (s.quality === 'high') for (const b of scene.boats) if (visible(b)) drawBoat(ctx, b, s.t)

  const pads = layout.points.flatMap((p) => {
    const place = s.places.get(p.id)
    return place && visible(p) ? [{ p, place }] : []
  })
  pads.sort((a, b) => a.p.y - b.p.y)
  for (const { p, place } of pads) drawPlace(ctx, p, place, place.id === s.todayId, s.t)

  if (s.pet && s.pet.shadow > 0) {
    const k2 = 1 - Math.min(0.6, s.pet.hop / 260)
    ctx.fillStyle = `rgb(30 40 20 / ${Math.round(25 * k2)}%)`
    ellipse(ctx, s.pet.x, s.pet.y - 4, s.pet.shadow * k2, (s.pet.shadow / 3) * k2)
    ctx.fill()
  }
  drawParticles(ctx, s.particles, s.clock)

  ctx.setTransform(k, 0, 0, k, 0, 0)
  if (s.quality === 'high') {
    drawClouds(ctx, scene, s.camY, s.t)
    drawBirds(ctx, s.t)
  }
}
