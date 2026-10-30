// Bố cục "đường màn chơi" của màn game bé (docs/19-kids-world.md §5.4): các nơi xếp dọc theo một con đường uốn lượn
// từ trên xuống, cách nhau đủ xa để không đè. Toạ độ theo đơn vị sân khấu (rộng STAGE_W), không theo px cửa sổ.
// Thuần dữ liệu — dùng cho canvas, lớp nút Vue và test.

/** Sân khấu 16:9 */
export const STAGE_W = 1600
export const STAGE_H = 900

/** Khung chiếm chỗ của một nơi quanh điểm neo (bệ ở điểm neo, công trình phía trên, biển tên phía dưới) */
export const PLACE_BOX = { left: 110, right: 110, top: 215, bottom: 100 } as const

export interface Point {
  x: number
  y: number
}

/** Đoạn cong Bézier bậc 3 nối hai nơi liên tiếp */
export interface Segment {
  p0: Point
  c1: Point
  c2: Point
  p1: Point
  /** Đoạn đi phà trên biển (vẽ nét đứt, không vẽ đường bộ) */
  sea?: boolean
}

export interface MapLayout {
  width: number
  height: number
  /** Chỗ đặt bệ của từng nơi (đã tách để không đè) */
  points: Array<Point & { id: string }>
  /** Vị trí thật trên bản đồ (chấm định vị); trùng `points` với bố cục đường màn chơi */
  anchors: Point[]
  /** `legs[i]`: chặng từ nơi i tới nơi i + 1 (một hoặc nhiều đoạn cong nối đuôi) */
  legs: Segment[][]
}

/** Một nơi để dựng bố cục theo bản đồ: vị trí thật + các điểm đường đi qua từ nơi trước tới nơi này */
export interface GeoPlace extends Point {
  id: string
  via?: Point[]
  /** Đoạn sau điểm `via` cuối là phà trên biển */
  ferry?: boolean
}

export interface LayoutOptions {
  /** Khoảng cách dọc giữa hai nơi liên tiếp */
  gap?: number
  /** Lề trên (chỗ cho HUD + công trình của nơi đầu) và lề dưới */
  top?: number
  bottom?: number
}

/** Cột x lặp lại: giữa → phải → giữa → trái…, tạo con đường hình chữ S */
const COLUMNS = [800, 1160, 800, 440]

export function levelPathLayout(ids: readonly string[], opts: LayoutOptions = {}): MapLayout {
  const gap = opts.gap ?? 330
  const top = opts.top ?? 400
  const bottom = opts.bottom ?? 360
  const points = ids.map((id, i) => ({ id, x: COLUMNS[i % COLUMNS.length], y: top + i * gap }))
  const legs: Segment[][] = []
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const k = (b.y - a.y) * 0.55
    legs.push([{ p0: a, c1: { x: a.x, y: a.y + k }, c2: { x: b.x, y: b.y - k }, p1: b }])
  }
  const last = points[points.length - 1]
  const height = Math.max(STAGE_H, (last ? last.y : top) + bottom)
  return { width: STAGE_W, height, points, anchors: points.map((p) => ({ x: p.x, y: p.y })), legs }
}

/** Đường cong mượt (Catmull-Rom → Bézier) qua các điểm theo thứ tự */
export function smoothSegments(pts: readonly Point[]): Segment[] {
  const out: Segment[] = []
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    out.push({
      p0: p1,
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      p1: p2
    })
  }
  return out
}

/**
 * Tách các khung nơi đang đè nhau: đẩy từng cặp theo trục ít chồng hơn, kéo nhẹ về vị trí thật; vòng cuối không kéo
 * để chắc chắn hết đè. Tất định (cùng đầu vào → cùng kết quả).
 */
export function separatePlaces(
  anchors: readonly Point[],
  iterations = 400,
  onLand?: (p: Point) => boolean
): Point[] {
  const w = PLACE_BOX.left + PLACE_BOX.right + 16
  const h = PLACE_BOX.top + PLACE_BOX.bottom + 16
  const pts = anchors.map((a) => ({ x: a.x, y: a.y }))
  for (let it = 0; it < iterations + 120; it++) {
    const spring = it < iterations ? 0.02 : 0
    let moved = false
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x
        const dy = pts[j].y - pts[i].y
        const ox = w - Math.abs(dx)
        const oy = h - Math.abs(dy)
        if (ox <= 0 || oy <= 0) continue
        moved = true
        if (ox / w < oy / h) {
          const s = (dx >= 0 ? 1 : -1) * (ox / 2 + 0.5)
          pts[i].x -= s
          pts[j].x += s
        } else {
          const s = (dy >= 0 ? 1 : -1) * (oy / 2 + 0.5)
          pts[i].y -= s
          pts[j].y += s
        }
      }
    }
    for (let i = 0; i < pts.length; i++) {
      const k = spring > 0 && onLand && !onLand(pts[i]) ? 0.15 : spring
      pts[i].x += (anchors[i].x - pts[i].x) * k
      pts[i].y += (anchors[i].y - pts[i].y) * k
    }
    if (!moved && spring === 0) break
  }
  return pts
}

/**
 * Bố cục theo vị trí thật (đã chiếu ra đơn vị sân khấu). Mỗi chặng: bệ nơi trước → chỗ thật → các điểm `via`
 * (bám đất liền) → chỗ thật nơi sau → bệ nơi sau.
 */
export function geoLayout(
  places: readonly GeoPlace[],
  size: { width: number; height: number },
  onLand?: (p: Point) => boolean
): MapLayout {
  const anchors = places.map((p) => ({ x: p.x, y: p.y }))
  const placed = separatePlaces(anchors, 400, onLand)
  const points = places.map((p, i) => ({ id: p.id, x: placed[i].x, y: placed[i].y }))
  const legs: Segment[][] = []
  for (let i = 1; i < places.length; i++) {
    const via = places[i].via ?? []
    const raw = [points[i - 1], anchors[i - 1], ...via, anchors[i], points[i]]
    const pts: Point[] = []
    let seaFrom = Infinity
    raw.forEach((p, k) => {
      const prev = pts[pts.length - 1]
      if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) < 6) return
      if (places[i].ferry && k === 1 + via.length) seaFrom = pts.length
      pts.push({ x: p.x, y: p.y })
    })
    if (places[i].ferry && seaFrom === Infinity) seaFrom = 0
    legs.push(smoothSegments(pts).map((s, k) => (k >= seaFrom ? { ...s, sea: true } : s)))
  }
  return { width: size.width, height: size.height, points, anchors, legs }
}

export function bezier(s: Segment, t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * s.p0.x + b * s.c1.x + c * s.c2.x + d * s.p1.x,
    y: a * s.p0.y + b * s.c1.y + c * s.c2.y + d * s.p1.y
  }
}

/**
 * Các điểm lấy mẫu dọc đường từ nơi `from` tới nơi `to` (chỉ số trong `points`, đi được cả hai chiều).
 * `sea` của một điểm: đoạn dẫn tới điểm đó là đường biển.
 */
export function walkPoints(
  layout: MapLayout,
  from: number,
  to: number,
  perSegment = 24
): Array<Point & { sea?: boolean }> {
  const out: Array<Point & { sea?: boolean }> = [layout.points[from]]
  const step = to >= from ? 1 : -1
  for (let i = from; i !== to; i += step) {
    const leg = layout.legs[Math.min(i, i + step)]
    const segs = step > 0 ? leg : [...leg].reverse()
    for (const seg of segs) {
      for (let k = 1; k <= perSegment; k++) {
        const t = k / perSegment
        out.push(
          seg.sea
            ? { ...bezier(seg, step > 0 ? t : 1 - t), sea: true }
            : bezier(seg, step > 0 ? t : 1 - t)
        )
      }
    }
  }
  return out
}

/**
 * Hàm vị trí theo tỉ lệ u ∈ [0, 1] trên một đường gấp khúc. `weight(i)` nhân độ dài đoạn tới điểm i (vd 1/tốc độ
 * của xe/thuyền) — khi đó `length` là tổng thời gian và mỗi đoạn đi đều theo tốc độ riêng. `i`: điểm cuối đoạn đang đi.
 */
export function polylineSampler<P extends Point>(
  pts: readonly P[],
  weight: (i: number) => number = () => 1
): {
  length: number
  at: (u: number) => Point & { dx: number; i: number }
} {
  const acc = [0]
  for (let i = 1; i < pts.length; i++) {
    acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) * weight(i))
  }
  const length = acc[acc.length - 1] ?? 0
  return {
    length,
    at(u) {
      if (pts.length === 1 || length === 0) return { x: pts[0].x, y: pts[0].y, dx: 0, i: 0 }
      const d = Math.min(1, Math.max(0, u)) * length
      let i = 1
      while (i < acc.length - 1 && acc[i] < d) i++
      const span = acc[i] - acc[i - 1] || 1
      const t = (d - acc[i - 1]) / span
      const a = pts[i - 1]
      const b = pts[i]
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: b.x - a.x, i }
    }
  }
}

/** Hai khung nơi có chồng lên nhau không */
export function placesOverlap(a: Point, b: Point): boolean {
  const w = PLACE_BOX.left + PLACE_BOX.right
  const h = PLACE_BOX.top + PLACE_BOX.bottom
  return Math.abs(a.x - b.x) < w && Math.abs(a.y - b.y) < h
}

/** Chỗ thú cưng đứng khi ở một nơi: bên trái bệ, không che biển tên */
export function petRestOffset(): Point {
  return { x: -130, y: 14 }
}

/** Tâm camera (y) giữ trong bản đồ */
export function clampCameraY(y: number, layout: MapLayout, zoom = 1): number {
  const half = STAGE_H / 2 / zoom
  return Math.min(Math.max(y, half), Math.max(half, layout.height - half))
}

/** Tâm camera (x) giữ trong bản đồ; bản đồ hẹp hơn khung nhìn thì giữ giữa */
export function clampCameraX(x: number, layout: MapLayout, zoom = 1): number {
  const half = STAGE_W / 2 / zoom
  if (layout.width <= half * 2) return layout.width / 2
  return Math.min(Math.max(x, half), layout.width - half)
}

/** Bộ sinh số giả ngẫu nhiên cố định theo hạt giống (vị trí cây, sóng… không đổi giữa các lần mở) */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}
