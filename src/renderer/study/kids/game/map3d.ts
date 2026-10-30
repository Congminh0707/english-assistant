// Bản đồ 3D tầng Việt Nam (three.js, nạp lười): địa hình mịn dựng từ bản đồ giản lược (src/shared/vnHeightfield.ts: bờ biển
// mượt, núi, sông, rừng cây + làng nhà rải dày), nước có ánh, mây trôi, sương xa, viền mực quanh vật thể (hậu kỳ theo độ
// sâu); công trình voxel có bóng đổ + che sáng đặt trên nền phẳng, nhãn tên, thú cưng đứng trên đất. Kéo = trượt bản đồ,
// kéo chuột phải / Shift = xoay, lăn chuột = zoom, chạm công trình = chọn nơi. Dừng khi cửa sổ ẩn. docs/19-kids-world.md §5.2
import type * as ThreeNS from 'three'
import { buildLandmark3D } from './landmarks3d'
import { toon } from './toon'
import { isVnLand } from '@shared/vnMap'
import {
  SEAT,
  buildRoads,
  createVehicleRig,
  type RoadSample,
  type RoutePoint,
  type VehicleKind
} from './map3dVehicles'
import { TERRAIN_UNIT, VERTEX_STEP, WATER_Y, buildVnHeightfield } from '@shared/vnHeightfield'

type Three = typeof ThreeNS

export interface Map3DPlace {
  id: string
  title: string
  vi: string
  landmark: string
  /** Vị trí bệ (đơn vị sân khấu) */
  x: number
  y: number
  done: boolean
}

export interface Map3DOptions {
  places: Map3DPlace[]
  width: number
  height: number
  pixelRatio: number
  reduceMotion: boolean
  onSelect: (id: string | null) => void
  /** `routes[i]`: đường từ `places[i]` tới `places[i + 1]` (đơn vị sân khấu, có cờ `sea` cho đoạn đi phà) */
  routes?: RoutePoint[][]
  /** Vị trí màn hình (đơn vị khung hình) + tỉ lệ của thú cưng sau mỗi lần vẽ; `k` = số px trên màn hình mỗi đơn vị thế giới */
  onPet?: (s: { x: number; y: number; k: number }) => void
}

/** Thú cưng trong thế giới: vị trí trên bản đồ (đơn vị sân khấu) + độ cao nhấc lên (đơn vị thế giới) */
export interface Map3DPet {
  x: number
  y: number
  hop: number
  /** Đang ngồi phương tiện nào (3D) và hướng đi (rad, 0 = hướng +x của bản đồ) */
  kind?: VehicleKind | null
  heading?: number
  /** Chúc/ngóc đầu (rad); bỏ trống thì xe tự nghiêng theo dốc đường */
  pitch?: number
}

export interface Map3DHandle {
  /** Bay camera tới một nơi (hoặc về toàn cảnh khi null) */
  focus: (id: string | null) => void
  /** Đặt/ẩn thú cưng (bóng trên đất + gọi onPet để lớp giao diện đặt sprite) */
  setPet: (p: Map3DPet | null) => void
  /** Camera bám theo một điểm trên bản đồ (đơn vị sân khấu) */
  follow: (x: number, y: number, dist?: number) => void
  /** Chỗ thú cưng đứng khi ở một nơi (đơn vị sân khấu): trên nền công trình, sát mép trước */
  restOf: (id: string) => { x: number; y: number; sea: boolean }
  /** Đường đi từ nơi này tới nơi kia (đơn vị sân khấu, đã nối vào chỗ đứng của hai nơi) */
  route: (fromId: string, toId: string) => RoutePoint[]
  dispose: () => void
}

/** Kích thước chân công trình trên bản đồ (đơn vị thế giới) */
const LANDMARK_SPAN = 3.4
/** Tỉ lệ phương tiện + đường so với mô hình gốc (xe dài ~2,6 → ~0,9 đơn vị) */
const VS = 0.42
/** Công trình nằm trên mặt nước (chợ nổi): nền hạ xuống dưới mực nước để nước biển/sông lộ ra quanh */
const WATER_LANDMARKS = new Set(['cantho-floating-market', 'halong-trong-mai'])
/** Chỗ đứng/cổng của công trình (theo bề rộng công trình); mặc định trước-trái. Làng chài Phú Quốc: phía bãi cát sau
 * (phía trước là đầm nước của mô hình, xe không được băng qua) */
const REST_OFFSET: Record<string, [number, number]> = { 'phuquoc-fishing-village': [0.15, -0.62] }
const MAX_PIXELS = 2560 * 1440
const MAX_TREES = 40000
/** Cây/nhà thu nhỏ để vẫn nhỏ hơn hẳn công trình */
const TREE_K = 0.36

function labelTexture(THREE: Three, p: Map3DPlace): { tex: ThreeNS.CanvasTexture; ratio: number } {
  const w = 360
  const h = 112
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const c = cv.getContext('2d')
  if (c) {
    c.beginPath()
    c.roundRect(4, 4, w - 8, h - 8, 28)
    c.fillStyle = p.done ? '#e6f7d8' : '#fff8e2'
    c.fill()
    c.lineWidth = 6
    c.strokeStyle = '#3b2a3a'
    c.stroke()
    c.fillStyle = '#3b2a3a'
    c.textAlign = 'center'
    c.font = '800 44px system-ui, sans-serif'
    c.fillText(p.title, w / 2, 58)
    c.font = '600 26px system-ui, sans-serif'
    c.fillStyle = '#6b5566'
    c.fillText(p.vi, w / 2, 94)
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return { tex, ratio: h / w }
}

/** Texture lát được (ánh nước): những vệt sáng ngắn */
function sparkleTexture(THREE: Three): ThreeNS.CanvasTexture {
  const size = 256
  const cv = document.createElement('canvas')
  cv.width = size
  cv.height = size
  const c = cv.getContext('2d')
  if (c) {
    c.fillStyle = '#000'
    c.fillRect(0, 0, size, size)
    for (let i = 0; i < 520; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const len = 6 + Math.random() * 16
      c.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.6})`
      for (const ox of [-size, 0, size]) c.fillRect(x + ox, y, len, 1.6)
    }
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(34, 42)
  return tex
}

const hashAngle = (i: number): number => ((i * 2654435761) % 6283) / 1000

/** Làm mượt đường gấp khúc (Chaikin): giữ hai đầu, cờ `sea` theo điểm đích của từng đoạn */
function chaikin(pts: RoutePoint[]): RoutePoint[] {
  if (pts.length < 3) return pts
  const out: RoutePoint[] = [pts[0]]
  for (let i = 0; i + 1 < pts.length; i++) {
    const p = pts[i]
    const q = pts[i + 1]
    out.push({ x: p.x * 0.75 + q.x * 0.25, y: p.y * 0.75 + q.y * 0.25, sea: q.sea })
    out.push({ x: p.x * 0.25 + q.x * 0.75, y: p.y * 0.25 + q.y * 0.75, sea: q.sea })
  }
  out.push(pts[pts.length - 1])
  return out
}

export async function mountVnMap3D(host: HTMLElement, opts: Map3DOptions): Promise<Map3DHandle> {
  const THREE = await import('three')

  // dãn các công trình ra cho khỏi đè nhau (bố cục 2D chỉ chừa chỗ cho công trình nhỏ hơn)
  const spots = opts.places.map((p) => ({
    id: p.id,
    ox: p.x / TERRAIN_UNIT,
    oz: p.y / TERRAIN_UNIT,
    x: p.x / TERRAIN_UNIT,
    z: p.y / TERRAIN_UNIT
  }))
  const minGap = LANDMARK_SPAN * 1.75
  for (let it = 0; it < 200; it++) {
    for (let i = 0; i < spots.length; i++)
      for (let j = i + 1; j < spots.length; j++) {
        const dx = spots[j].x - spots[i].x
        const dz = spots[j].z - spots[i].z
        const d = Math.hypot(dx, dz) || 0.01
        if (d >= minGap) continue
        const push = (minGap - d) / 2
        spots[i].x -= (dx / d) * push
        spots[j].x += (dx / d) * push
        spots[i].z -= (dz / d) * push
        spots[j].z += (dz / d) * push
      }
    for (const s of spots) {
      s.x += (s.ox - s.x) * 0.02
      s.z += (s.oz - s.z) * 0.02
    }
  }
  const spotOf = new Map(spots.map((s) => [s.id, s]))

  // công trình trên đất liền thì đặt thẳng lên địa hình (nền phẳng nhỏ); công trình ngoài biển (Hạ Long, Phú Quốc…) giữ bệ nước
  const onLand = new Map(
    spots.map((s) => [s.id, isVnLand({ x: s.x * TERRAIN_UNIT, y: s.z * TERRAIN_UNIT }, 30)])
  )
  // dựng mô hình trước để biết mặt nền / lòng sông của từng công trình (đất quanh nâng ngang mặt nền)
  const LK = LANDMARK_SPAN / 10
  const models = new Map(opts.places.map((p) => [p.id, buildLandmark3D(THREE, p.landmark)]))
  const plateOf = (
    id: string
  ): { top: number; channel?: { cx: number; cz: number; hx: number; hz: number } } => {
    const pl = models.get(id)?.userData.plate as
      { top: number; channel?: { cx: number; cz: number; hx: number; hz: number } } | undefined
    if (!pl) return { top: 0 }
    const c = pl.channel
    return {
      top: pl.top * LK,
      channel: c ? { cx: c.cx * LK, cz: c.cz * LK, hx: c.hx * LK, hz: c.hz * LK } : undefined
    }
  }
  const hf = buildVnHeightfield(
    spots.map((s, i) => ({
      x: s.x,
      z: s.z,
      r: onLand.get(s.id) ? LANDMARK_SPAN * 0.85 : 0,
      water: WATER_LANDMARKS.has(opts.places[i].landmark),
      ...(onLand.get(s.id) ? plateOf(s.id) : {})
    }))
  )
  const { width: mapW, depth: mapD } = hf

  // --- đường đi giữa các nơi + phương tiện ---
  const landmarkOf = new Map(opts.places.map((p) => [p.id, p.landmark]))
  const restPoint = (id: string): RoutePoint => {
    const sp = spotOf.get(id)
    const lm = landmarkOf.get(id) ?? ''
    if (sp && (WATER_LANDMARKS.has(lm) || onLand.get(id) === false))
      return { x: sp.x * TERRAIN_UNIT, y: (sp.z + LANDMARK_SPAN * 0.42) * TERRAIN_UNIT, sea: true }
    if (!sp) return { x: 0, y: 0 }
    const fixed = REST_OFFSET[lm]
    if (fixed)
      return {
        x: (sp.x + LANDMARK_SPAN * fixed[0]) * TERRAIN_UNIT,
        y: (sp.z + LANDMARK_SPAN * fixed[1]) * TERRAIN_UNIT
      }
    // một con đường chính chạy NGANG QUA bên cạnh công trình (không rẽ vào rồi quay ra): điểm dừng nằm trên đường,
    // lệch vuông góc với hướng đi (từ nơi trước tới nơi sau), về phía trước màn hình nếu là đất liền
    const k = opts.places.findIndex((pl) => pl.id === id)
    const prev = spotOf.get(opts.places[Math.max(0, k - 1)].id) ?? sp
    const next = spotOf.get(opts.places[Math.min(opts.places.length - 1, k + 1)].id) ?? sp
    let dx = next.x - prev.x
    let dz = next.z - prev.z
    const l = Math.hypot(dx, dz) || 1
    dx /= l
    dz /= l
    const d = LANDMARK_SPAN * 0.8
    const cands = [
      { x: sp.x - dz * d, z: sp.z + dx * d },
      { x: sp.x + dz * d, z: sp.z - dx * d }
    ]
    // chọn phía mà đường tự nhiên đi qua (gần đoạn nối nơi trước → nơi sau nhất) để đường không vòng quanh công trình
    const segDist = (c: { x: number; z: number }): number => {
      const vx = next.x - prev.x
      const vz = next.z - prev.z
      const l2 = vx * vx + vz * vz || 1
      const t = Math.min(1, Math.max(0, ((c.x - prev.x) * vx + (c.z - prev.z) * vz) / l2))
      return Math.hypot(c.x - (prev.x + vx * t), c.z - (prev.z + vz * t))
    }
    cands.sort((a2, b2) => segDist(a2) - segDist(b2))
    const pick = cands.find((c) => hf.heightAt(c.x, c.z) > 0.02) ?? cands[0]
    return { x: pick.x * TERRAIN_UNIT, y: pick.z * TERRAIN_UNIT }
  }
  const legs: RoutePoint[][] = opts.places.slice(1).map((p, i) => {
    // bỏ phần đường nằm trong khuôn viên hai công trình (đường dừng ở cổng, không cắt ngang công trình)
    const a = spotOf.get(opts.places[i].id)
    const c = spotOf.get(p.id)
    const clear = LANDMARK_SPAN * 0.78 * TERRAIN_UNIT
    const outside = (q: RoutePoint, sp?: { x: number; z: number }): boolean =>
      !sp || Math.hypot(q.x - sp.x * TERRAIN_UNIT, q.y - sp.z * TERRAIN_UNIT) > clear
    const pts = (opts.routes?.[i] ?? []).filter((q) => outside(q, a) && outside(q, c))
    // bỏ đoạn đường quay ngược (điểm trung gian nằm phía sau điểm xuất phát / vượt quá điểm đến) → không có hai đường
    // song song ra vào cùng một nơi
    const s0 = restPoint(opts.places[i].id)
    const s1 = restPoint(p.id)
    const dist = (u: RoutePoint, v: RoutePoint): number => Math.hypot(u.x - v.x, u.y - v.y)
    const span = dist(s0, s1)
    while (pts.length && dist(pts[0], s1) > span * 0.98) pts.shift()
    while (pts.length && dist(pts[pts.length - 1], s0) > span * 0.98) pts.pop()
    // gần công trình trên nước (chợ nổi) thì đi thuyền: đánh dấu đoạn đó là đường thuỷ
    const wet = (q: RoutePoint): boolean =>
      [opts.places[i], p].some((pl) => {
        const sp = spotOf.get(pl.id)
        return (
          !!sp &&
          (WATER_LANDMARKS.has(pl.landmark) || onLand.get(pl.id) === false) &&
          Math.hypot(q.x - sp.x * TERRAIN_UNIT, q.y - sp.z * TERRAIN_UNIT) <
            LANDMARK_SPAN * 2.2 * TERRAIN_UNIT
        )
      })
    // đi thuyền chỉ ở chỗ thật sự là nước; phần trên cạn của đoạn phà/đoạn gần chợ nổi vẫn là đường bộ (có bến ở mép nước)
    const water = (q: RoutePoint): boolean =>
      hf.heightAt(q.x / TERRAIN_UNIT, q.y / TERRAIN_UNIT) < -0.02
    const ends = [restPoint(opts.places[i].id), restPoint(p.id)]
    const raw = [ends[0], ...pts, ends[1]].map((q, k, arr) => {
      if (k === 0 || k === arr.length - 1) return q
      const sea = (!!q.sea || wet(q)) && water(q)
      return { ...q, sea }
    })
    return chaikin(chaikin(raw))
  })

  // --- tuyến đường: cao độ mặt đường làm mượt, san nền dưới đường (hết rung giật), cầu qua chỗ nước ---
  const profiles: RoadSample[][] = legs.map((leg) => {
    const pts: RoadSample[] = []
    for (let i = 0; i + 1 < leg.length; i++) {
      const a = leg[i]
      const b = leg[i + 1]
      const ax = a.x / TERRAIN_UNIT
      const az = a.y / TERRAIN_UNIT
      const bx = b.x / TERRAIN_UNIT
      const bz = b.y / TERRAIN_UNIT
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.12))
      for (let k = 0; k < n; k++) {
        const t = k / n
        pts.push({
          x: ax + (bx - ax) * t,
          z: az + (bz - az) * t,
          y: 0,
          sea: !!b.sea,
          bridge: false
        })
      }
    }
    const last = leg[leg.length - 1]
    if (last)
      pts.push({
        x: last.x / TERRAIN_UNIT,
        z: last.y / TERRAIN_UNIT,
        y: 0,
        sea: !!last.sea,
        bridge: false
      })
    // đường đi men theo sông thì dời lên bờ (chỉ những đoạn cắt ngang mặt nước mới là cầu)
    for (let i = 0; i < pts.length; i++) {
      const q = pts[i]
      if (q.sea || hf.heightAt(q.x, q.z) >= -0.02) continue
      const prev = pts[Math.max(0, i - 1)]
      const next = pts[Math.min(pts.length - 1, i + 1)]
      const dx = next.x - prev.x
      const dz = next.z - prev.z
      const l = Math.hypot(dx, dz) || 1
      const nx = -dz / l
      const nz = dx / l
      for (let d = 0.2; d <= 1.6; d += 0.1) {
        const sd = [1, -1].find((s2) => hf.heightAt(q.x + nx * d * s2, q.z + nz * d * s2) > 0.04)
        if (sd) {
          q.x += nx * (d + 0.15) * sd
          q.z += nz * (d + 0.15) * sd
          break
        }
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      const xs = pts.map((q) => q.x)
      const zs = pts.map((q) => q.z)
      for (let i = 1; i + 1 < pts.length; i++) {
        if (pts[i].sea) continue
        let sx = 0
        let sz = 0
        let c = 0
        for (let d = -4; d <= 4; d++) {
          const j = i + d
          if (j < 0 || j >= pts.length || pts[j].sea) continue
          sx += xs[j]
          sz += zs[j]
          c++
        }
        pts[i].x = sx / c
        pts[i].z = sz / c
      }
    }
    // phân loại lại theo mặt đất thật: trên cạn luôn là đường; mỗi quãng nước liền nhau là PHÀ (dài, hoặc chạm bến
    // ở đầu/cuối tuyến, hoặc tuyến vốn đi phà) hay CẦU (quãng ngắn cắt ngang sông) — nhờ vậy đường không bao giờ đứt
    // trong khuôn viên công trình luôn là đất (lòng sông của mô hình không làm đứt đường)
    const nearLandmark = (q: RoadSample): boolean =>
      spots.some(
        (sp, k) =>
          onLand.get(sp.id) && Math.hypot(q.x - sp.x, q.z - sp.z) < LANDMARK_SPAN * 1.2 && k >= 0
      )
    const wetS = pts.map((q) => hf.heightAt(q.x, q.z) < -0.02 && !nearLandmark(q))
    for (let i = 0; i < pts.length;) {
      if (!wetS[i]) {
        pts[i].sea = false
        pts[i].bridge = false
        i++
        continue
      }
      let j = i
      while (j < pts.length && wetS[j]) j++
      const ferry =
        i === 0 || j === pts.length || (j - i) * 0.12 > 2.2 || pts.slice(i, j).some((q) => q.sea)
      for (let k = i; k < j; k++) {
        pts[k].sea = ferry
        pts[k].bridge = !ferry
      }
      i = j
    }
    let ys = pts.map((q) => {
      if (q.sea) return WATER_Y
      if (q.bridge) return 0.32
      return Math.max(hf.heightAt(q.x, q.z), 0.08)
    })
    for (let pass = 0; pass < 3; pass++) {
      const out = ys.slice()
      for (let i = 0; i < ys.length; i++) {
        if (pts[i].sea) continue
        let sum = 0
        let cnt = 0
        for (let d = -8; d <= 8; d++) {
          const j = i + d
          if (j < 0 || j >= ys.length || pts[j].sea) continue
          sum += ys[j]
          cnt++
        }
        out[i] = sum / cnt
      }
      ys = out
    }
    pts.forEach((q, i) => (q.y = q.sea ? WATER_Y : q.bridge ? Math.max(ys[i], 0.32) : ys[i]))
    return pts
  })
  // san nền: kéo mặt đất dọc đường về đúng cao độ đường; ghi lại mặt cầu để xe chạy trên cầu
  const deck = new Map<number, number>()
  const grade = new Map<number, { w: number; y: number }>()
  const deckKey = (x: number, z: number): number =>
    Math.floor(x / 0.25) * 100003 + Math.floor(z / 0.25)
  for (const prof of profiles)
    for (const q of prof) {
      if (q.sea) continue
      if (q.bridge) {
        const key = deckKey(q.x, q.z)
        deck.set(key, Math.max(deck.get(key) ?? -9, q.y))
        continue
      }
      const r = 0.7
      const ix0 = Math.max(0, Math.floor((q.x - r) / VERTEX_STEP))
      const ix1 = Math.min(hf.cols - 1, Math.ceil((q.x + r) / VERTEX_STEP))
      const iz0 = Math.max(0, Math.floor((q.z - r) / VERTEX_STEP))
      const iz1 = Math.min(hf.rows - 1, Math.ceil((q.z + r) / VERTEX_STEP))
      for (let iz = iz0; iz <= iz1; iz++)
        for (let ix = ix0; ix <= ix1; ix++) {
          const d = Math.hypot(ix * VERTEX_STEP - q.x, iz * VERTEX_STEP - q.z)
          if (d > r) continue
          const k = hf.cols * iz + ix
          if (hf.heights[k] < 0.05) continue
          const w = d < 0.38 ? 1 : 1 - (d - 0.38) / (r - 0.38)
          // nhiều đoạn đường gần nhau (chỗ hai tuyến gặp): đất phải thấp hơn MỌI mặt đường, không để tuyến sau đắp đất lấp tuyến trước
          const prev = grade.get(k)
          const y = q.y - 0.03
          if (!prev) grade.set(k, { w, y })
          else grade.set(k, { w: Math.max(prev.w, w), y: Math.min(prev.y, y) })
        }
    }
  for (const [k, g] of grade) hf.heights[k] = hf.heights[k] + (g.y - hf.heights[k]) * g.w
  const deckAt = (x: number, z: number): number => {
    let best = -9
    for (const dx of [-0.25, 0, 0.25])
      for (const dz of [-0.25, 0, 0.25])
        best = Math.max(best, deck.get(deckKey(x + dx, z + dz)) ?? -9)
    return best
  }

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance'
  })
  const pr = Math.min(opts.pixelRatio, Math.sqrt(MAX_PIXELS / (opts.width * opts.height)))
  renderer.setPixelRatio(pr)
  renderer.setSize(opts.width, opts.height)
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;touch-action:none'
  host.appendChild(renderer.domElement)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  /** Nhãn vẽ sau hậu kỳ để viền mực không cắt qua chữ */
  const labelScene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xcfe9fb, 170, 480)
  scene.add(new THREE.HemisphereLight(0xe2f3ff, 0x8aa070, 1.35))
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.5)
  sun.position.set(mapW / 2 - 70, 150, mapD / 2 + 80)
  sun.target.position.set(mapW / 2, 0, mapD / 2)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  Object.assign(sun.shadow.camera, {
    left: -40,
    right: 40,
    top: 40,
    bottom: -40,
    near: 10,
    far: 300
  })
  sun.shadow.bias = -0.0005
  sun.shadow.normalBias = 0.25
  scene.add(sun)
  scene.add(sun.target)

  const disposables: Array<{ dispose: () => void }> = []
  const own = <T extends { dispose: () => void }>(x: T): T => {
    disposables.push(x)
    return x
  }

  // --- địa hình mịn ---
  const tg = own(new THREE.BufferGeometry())
  const pos = new Float32Array(hf.cols * hf.rows * 3)
  for (let iz = 0; iz < hf.rows; iz++)
    for (let ix = 0; ix < hf.cols; ix++) {
      const i = iz * hf.cols + ix
      pos[i * 3] = ix * VERTEX_STEP
      pos[i * 3 + 1] = hf.heights[i]
      pos[i * 3 + 2] = iz * VERTEX_STEP
    }
  const index = new Uint32Array((hf.cols - 1) * (hf.rows - 1) * 6)
  let q = 0
  for (let iz = 0; iz < hf.rows - 1; iz++)
    for (let ix = 0; ix < hf.cols - 1; ix++) {
      const a = iz * hf.cols + ix
      const b = a + 1
      const c = a + hf.cols
      const d = c + 1
      index[q++] = a
      index[q++] = c
      index[q++] = b
      index[q++] = b
      index[q++] = c
      index[q++] = d
    }
  tg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  tg.setAttribute('color', new THREE.BufferAttribute(hf.colors, 3))
  tg.setIndex(new THREE.BufferAttribute(index, 1))
  tg.computeVertexNormals()
  const material = own(toon(THREE, { vertexColors: true }))
  /** Cây/nhà dùng màu theo từng thể hiện (instanceColor), không có thuộc tính màu đỉnh */
  const instMaterial = own(toon(THREE))
  const terrain = new THREE.Mesh(tg, material)
  terrain.castShadow = true
  terrain.receiveShadow = true
  scene.add(terrain)

  // --- nước: mặt trong mờ + lớp ánh trôi ---
  const water = new THREE.Mesh(
    own(new THREE.PlaneGeometry(mapW + 2400, mapD + 2400)),
    own(
      new THREE.MeshPhongMaterial({
        color: 0x3fa5db,
        transparent: true,
        opacity: 0.5,
        shininess: 120,
        specular: 0xbfe6ff,
        depthWrite: false
      })
    )
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(mapW / 2, WATER_Y, mapD / 2)
  water.renderOrder = 2
  scene.add(water)
  const sparkle = own(sparkleTexture(THREE))
  const glint = new THREE.Mesh(
    own(new THREE.PlaneGeometry(mapW + 2400, mapD + 2400)),
    own(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        alphaMap: sparkle,
        transparent: true,
        opacity: 0.14,
        depthWrite: false
      })
    )
  )
  glint.rotation.x = -Math.PI / 2
  glint.position.set(mapW / 2, WATER_Y + 0.03, mapD / 2)
  glint.renderOrder = 3
  scene.add(glint)

  // --- cây (đặt theo dữ liệu địa hình) ---
  // cây không mọc đè lên đường: đánh dấu các ô lưới có đường đi qua
  const roadCell = new Set<number>()
  for (const prof of profiles)
    for (const q of prof) {
      if (q.sea) continue
      for (const dx of [-1, 0, 1])
        for (const dz of [-1, 0, 1])
          roadCell.add(Math.floor(q.x / 0.3 + dx) * 100003 + Math.floor(q.z / 0.3 + dz))
    }
  const onRoad = (x: number, z: number): boolean =>
    roadCell.has(Math.floor(x / 0.3) * 100003 + Math.floor(z / 0.3))
  const treeCount = Math.min(hf.trees.length / 8, MAX_TREES)
  const round: number[] = []
  const pine: number[] = []
  for (let i = 0; i < treeCount; i++) {
    if (onRoad(hf.trees[i * 8], hf.trees[i * 8 + 2])) continue
    ;(hf.trees[i * 8 + 4] ? pine : round).push(i)
  }
  const dummy = new THREE.Object3D()
  const addTrees = (
    ids: number[],
    geo: ThreeNS.BufferGeometry,
    lift: number,
    tall: number
  ): void => {
    if (!ids.length) return
    const mesh = new THREE.InstancedMesh(own(geo), instMaterial, ids.length)
    const col = new THREE.Color()
    ids.forEach((id, k) => {
      const o = id * 8
      const s = hf.trees[o + 3]
      dummy.position.set(hf.trees[o], hf.trees[o + 1] + lift * s * TREE_K, hf.trees[o + 2])
      dummy.scale.set(s * TREE_K, s * TREE_K * tall, s * TREE_K)
      dummy.rotation.set(0, hashAngle(id), 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(k, dummy.matrix)
      col.setRGB(hf.trees[o + 5], hf.trees[o + 6], hf.trees[o + 7])
      mesh.setColorAt(k, col)
    })
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
  }
  addTrees(round, new THREE.IcosahedronGeometry(0.4, 1), 0.36, 1.1)
  addTrees(pine, new THREE.ConeGeometry(0.3, 1, 7), 0.5, 1.15)

  // --- nhà trong làng ---
  const houseCount = hf.houses.length / 6
  if (houseCount > 0) {
    const bodyGeo = own(new THREE.BoxGeometry(0.4, 0.26, 0.3))
    const roofGeo = own(new THREE.ConeGeometry(0.34, 0.24, 4))
    roofGeo.rotateY(Math.PI / 4)
    const bodies = new THREE.InstancedMesh(bodyGeo, instMaterial, houseCount)
    const roofs = new THREE.InstancedMesh(roofGeo, instMaterial, houseCount)
    const wall = [0xf6ecd2, 0xf2dca8, 0xd9e8f2]
    const roof = [0xb8452f, 0x8a5a46, 0x4a7f9a]
    const lc = (hex: number): ThreeNS.Color => new THREE.Color(hex).convertSRGBToLinear()
    for (let i = 0; i < houseCount; i++) {
      const o = i * 6
      const s = hf.houses[o + 4]
      dummy.position.set(hf.houses[o], hf.houses[o + 1] + 0.13 * s * TREE_K, hf.houses[o + 2])
      dummy.rotation.set(0, hf.houses[o + 3], 0)
      dummy.scale.setScalar(onRoad(hf.houses[o], hf.houses[o + 2]) ? 0 : s * TREE_K) // nhà không nằm trên đường
      dummy.updateMatrix()
      bodies.setMatrixAt(i, dummy.matrix)
      dummy.position.y = hf.houses[o + 1] + 0.38 * s * TREE_K
      dummy.updateMatrix()
      roofs.setMatrixAt(i, dummy.matrix)
      const t = hf.houses[o + 5]
      bodies.setColorAt(i, lc(wall[t]))
      roofs.setColorAt(i, lc(roof[t]))
    }
    for (const m of [bodies, roofs]) {
      m.castShadow = true
      m.receiveShadow = true
      scene.add(m)
    }
  }

  // --- công trình + nhãn ---
  const pickables: ThreeNS.Object3D[] = []
  /** Hoạt ảnh riêng của từng nơi (thuyền trôi, đèn lồng đung đưa, tàu chạy…) */
  const ticks: Array<(t: number) => void> = []
  const anchors = new Map<string, ThreeNS.Vector3>()
  opts.places.forEach((p) => {
    const landed = onLand.get(p.id) === true
    const model = models.get(p.id)
    const spot = spotOf.get(p.id)
    const padIndex = spots.findIndex((s) => s.id === p.id)
    if (!model || !spot) return
    const k = LANDMARK_SPAN / 10
    const gy = WATER_LANDMARKS.has(p.landmark)
      ? WATER_Y - 0.03
      : landed
        ? hf.padHeights[padIndex] - 0.02
        : WATER_Y
    model.scale.setScalar(k)
    model.position.set(spot.x, gy, spot.z)
    model.traverse((o) => {
      const m = o as ThreeNS.Mesh
      if (m.isMesh) {
        m.userData.placeId = p.id
        own(m.geometry)
        pickables.push(m)
      }
    })
    scene.add(model)
    const tick = model.userData.tick as ((t: number) => void) | undefined
    if (tick) ticks.push(tick)
    anchors.set(p.id, new THREE.Vector3(spot.x, gy + 1, spot.z))
    const { tex, ratio } = labelTexture(THREE, p)
    own(tex)
    const sprite = new THREE.Sprite(
      own(
        new THREE.SpriteMaterial({
          map: tex,
          depthTest: false,
          depthWrite: false,
          sizeAttenuation: false,
          fog: false
        })
      )
    )
    sprite.scale.set(0.095, 0.095 * ratio, 1) // cỡ không đổi theo zoom (đơn vị = chiều cao khung hình)
    sprite.center.set(0.5, 1) // nhãn treo ngay dưới mép trước của công trình
    sprite.position.set(spot.x, gy + 0.05, spot.z + LANDMARK_SPAN * 0.52)
    sprite.renderOrder = 10
    labelScene.add(sprite)
  })

  // --- mây trôi trên biển ---
  const clouds: ThreeNS.Group[] = []
  const cloudMat = own(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.88,
      fog: false,
      depthWrite: false
    })
  )
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group()
    const blobs = 4 + (i % 3)
    for (let b = 0; b < blobs; b++) {
      const r = 3 + ((i * 7 + b * 3) % 5)
      const m = new THREE.Mesh(own(new THREE.SphereGeometry(r, 10, 8)), cloudMat)
      m.scale.y = 0.55
      m.position.set(b * 4.2 - blobs * 2, (b % 2) * 0.8, ((b * 5 + i) % 3) - 1)
      g.add(m)
    }
    const side = i % 2 ? 1 : -1
    g.position.set(
      mapW / 2 + side * (70 + ((i * 37) % 60)),
      34 + (i % 4) * 4,
      (i / 12) * mapD * 1.1
    )
    g.renderOrder = 20
    scene.add(g)
    clouds.push(g)
  }

  // bóng thú cưng trên đất
  const shadow = new THREE.Mesh(
    own(new THREE.CircleGeometry(0.3, 24)),
    own(
      new THREE.MeshBasicMaterial({
        color: 0x1d3a1d,
        transparent: true,
        opacity: 0.32,
        depthWrite: false
      })
    )
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.visible = false
  shadow.renderOrder = 5
  scene.add(shadow)
  let petState: Map3DPet | null = null
  const feet = new THREE.Vector3()
  const side = new THREE.Vector3()

  // --- hậu kỳ: viền mực theo độ sâu ---
  const w = Math.round(opts.width * pr)
  const h = Math.round(opts.height * pr)
  const depthTex = own(new THREE.DepthTexture(w, h))
  const target = own(new THREE.WebGLRenderTarget(w, h, { samples: 4, depthTexture: depthTex }))
  const camera = new THREE.PerspectiveCamera(36, opts.width / opts.height, 2, 1400)
  const pass = new THREE.Mesh(
    own(new THREE.PlaneGeometry(2, 2)),
    own(
      new THREE.ShaderMaterial({
        depthTest: false,
        depthWrite: false,
        transparent: true,
        uniforms: {
          tColor: { value: target.texture },
          tDepth: { value: depthTex },
          texel: { value: new THREE.Vector2(1 / w, 1 / h) },
          near: { value: camera.near },
          far: { value: camera.far },
          ink: { value: new THREE.Color(0x2c2036) }
        },
        vertexShader:
          'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `
          #include <packing>
          varying vec2 vUv;
          uniform sampler2D tColor;
          uniform sampler2D tDepth;
          uniform vec2 texel;
          uniform float near;
          uniform float far;
          uniform vec3 ink;
          float lin(vec2 uv){
            float d = texture2D(tDepth, uv).x;
            if (d >= 0.99999) return far;
            return -perspectiveDepthToViewZ(d, near, far);
          }
          void main(){
            vec4 c = texture2D(tColor, vUv);
            float z0 = lin(vUv);
            float e = 0.0;
            if (z0 < far) {
              vec2 o = texel * 1.1;
              float z1 = lin(vUv + vec2(o.x, 0.0));
              float z2 = lin(vUv - vec2(o.x, 0.0));
              float z3 = lin(vUv + vec2(0.0, o.y));
              float z4 = lin(vUv - vec2(0.0, o.y));
              float zmin = min(min(z1, z2), min(z3, z4));
              float zmax = max(max(z1, z2), max(z3, z4));
              float jump = max(z0 - zmin, zmax - z0);
              e = smoothstep(0.012, 0.03, jump / z0);
            }
            gl_FragColor = vec4(mix(c.rgb, ink, e * 0.85), max(c.a, e));
            #include <colorspace_fragment>
          }`
      })
    )
  )
  pass.frustumCulled = false
  const passScene = new THREE.Scene()
  passScene.add(pass)
  const passCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const roads = buildRoads(THREE, scene, [profiles.flat()], VS) // một tuyến xuyên suốt: chỉ mờ ở hai đầu cả nước
  own(roads)
  const rig = createVehicleRig(THREE, scene, VS)
  own(rig)
  // tuyến thú cưng đi = đúng tuyến đường đã vẽ (cùng điểm mẫu, cùng chỗ cầu/phà)
  const route = (fromId: string, toId: string): RoutePoint[] => {
    const a = opts.places.findIndex((p) => p.id === fromId)
    const b = opts.places.findIndex((p) => p.id === toId)
    if (a < 0 || b < 0 || a === b) return [restPoint(toId)]
    const out: RoutePoint[] = []
    const step = a < b ? 1 : -1
    for (let i = a; i !== b; i += step) {
      const prof = profiles[Math.min(i, i + step)]
      const pts = (step > 0 ? prof : [...prof].reverse()).map((q) => ({
        x: q.x * TERRAIN_UNIT,
        y: q.z * TERRAIN_UNIT,
        sea: q.sea
      }))
      out.push(...(out.length ? pts.slice(1) : pts))
    }
    return out
  }

  let vehicleTime = 0

  // camera: quay quanh `look`, đứng cách `dist`
  const home = { x: mapW / 2, z: mapD / 2, dist: 22, pitch: 0.85, yaw: 0 }
  const cam = { ...home }
  const goal = { ...home }
  let dirty = true

  const clampGoal = (): void => {
    goal.pitch = Math.min(1.35, Math.max(0.45, goal.pitch))
    goal.dist = Math.min(200, Math.max(4, goal.dist))
    goal.x = Math.min(mapW, Math.max(0, goal.x))
    goal.z = Math.min(mapD, Math.max(0, goal.z))
  }
  const place = (): void => {
    const look = new THREE.Vector3(cam.x, Math.max(WATER_Y, hf.heightAt(cam.x, cam.z)) + 0.4, cam.z)
    camera.position.set(
      look.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist,
      look.y + Math.sin(cam.pitch) * cam.dist,
      look.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist
    )
    // không bao giờ chui vào núi: luôn cao hơn mặt đất ở chỗ đứng (và ngay trước mặt) một khoảng
    const under = Math.max(
      hf.heightAt(camera.position.x, camera.position.z),
      hf.heightAt((camera.position.x + look.x) / 2, (camera.position.z + look.z) / 2)
    )
    camera.position.y = Math.max(camera.position.y, under + 1.2 + cam.dist * 0.08)
    // không để sườn núi che mất chỗ đang nhìn: nâng camera tới khi đường ngắm vượt qua mọi điểm địa hình ở giữa
    for (let i = 1; i < 10; i++) {
      const t = i / 10
      const sx = look.x + (camera.position.x - look.x) * t
      const sz = look.z + (camera.position.z - look.z) * t
      const need = look.y + (hf.heightAt(sx, sz) + 0.5 - look.y) / t
      if (need > camera.position.y) camera.position.y = need
    }
    camera.lookAt(look)
  }

  /** Đang ở cận cảnh một nơi: camera lượn chậm quanh công trình */
  let focused: string | null = null
  const focus = (id: string | null): void => {
    const a = id ? anchors.get(id) : null
    focused = a ? id : null
    if (a) Object.assign(goal, { x: a.x, z: a.z, dist: 4.6, pitch: 0.5 })
    else Object.assign(goal, home)
    clampGoal()
    if (opts.reduceMotion) Object.assign(cam, goal)
    dirty = true
  }
  const groundAt = (gx: number, gz: number): number =>
    Math.max(WATER_Y, hf.heightAt(gx, gz), deckAt(gx, gz))
  const setPet = (p: Map3DPet | null): void => {
    petState = p
    shadow.visible = !!p
    if (p) {
      const gx = p.x / TERRAIN_UNIT
      const gz = p.y / TERRAIN_UNIT
      shadow.position.set(gx, groundAt(gx, gz) + 0.1, gz)
      shadow.scale.setScalar(Math.max(0.35, 1 - p.hop / 4))
    }
    dirty = true
  }
  const follow = (x: number, y: number, dist?: number): void => {
    goal.x = x / TERRAIN_UNIT
    goal.z = y / TERRAIN_UNIT
    if (dist !== undefined) goal.dist = dist
    clampGoal()
    if (opts.reduceMotion) Object.assign(cam, goal)
    dirty = true
  }
  const reportPet = (): void => {
    if (!petState || !opts.onPet) return
    const gx = petState.x / TERRAIN_UNIT
    const gz = petState.y / TERRAIN_UNIT
    const gy = groundAt(gx, gz) + petState.hop + (petState.kind ? SEAT[petState.kind] * VS : 0)
    // cỡ thú cưng = số px của 1 đơn vị đo theo phương ngang màn hình (đúng cả khi camera xoay quanh)
    const world = new THREE.Vector3(gx, gy, gz)
    side.setFromMatrixColumn(camera.matrixWorld, 0).normalize().add(world).project(camera)
    feet.copy(world).project(camera)
    const sx = (feet.x * 0.5 + 0.5) * opts.width
    const sy = (-feet.y * 0.5 + 0.5) * opts.height
    const k = Math.hypot(
      (side.x - feet.x) * 0.5 * opts.width,
      (side.y - feet.y) * 0.5 * opts.height
    )
    opts.onPet({ x: sx, y: sy, k })
  }
  const restOf = (id: string): { x: number; y: number; sea: boolean } => {
    const r = restPoint(id)
    return { x: r.x, y: r.y, sea: !!r.sea }
  }

  // thao tác
  const el = renderer.domElement
  let down: { x: number; y: number; moved: boolean; rotate: boolean } | null = null
  const raycaster = new THREE.Raycaster()
  const onDown = (e: PointerEvent): void => {
    focused = null
    down = { x: e.clientX, y: e.clientY, moved: false, rotate: e.button === 2 || e.shiftKey }
    el.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent): void => {
    if (!down) return
    const dx = e.clientX - down.x
    const dy = e.clientY - down.y
    if (!down.moved && Math.hypot(dx, dy) < 6) return
    down.moved = true
    const rect = el.getBoundingClientRect()
    const k = opts.width / rect.width
    if (down.rotate) {
      goal.yaw -= dx * 0.008 * k
      goal.pitch += dy * 0.006 * k
    } else {
      const unit = k * 0.06 * (cam.dist / 60)
      const sx = Math.cos(cam.yaw)
      const sz = -Math.sin(cam.yaw)
      const fx = Math.sin(cam.yaw)
      const fz = Math.cos(cam.yaw)
      goal.x -= (dx * sx + dy * fx) * unit
      goal.z -= (dx * sz + dy * fz) * unit
    }
    down.x = e.clientX
    down.y = e.clientY
    clampGoal()
    if (opts.reduceMotion) Object.assign(cam, goal)
    dirty = true
  }
  const onUp = (e: PointerEvent): void => {
    const d = down
    down = null
    if (!d || d.moved) return
    const rect = el.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    )
    raycaster.setFromCamera(ndc, camera)
    const hit = raycaster.intersectObjects(pickables, false)[0]
    const id = (hit?.object.userData.placeId as string | undefined) ?? null
    opts.onSelect(id)
    if (id) focus(id)
  }
  const onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    goal.dist *= e.deltaY > 0 ? 1.12 : 0.89
    clampGoal()
    if (opts.reduceMotion) Object.assign(cam, goal)
    dirty = true
  }
  const noMenu = (e: Event): void => e.preventDefault()
  const onCancel = (): void => {
    down = null
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onCancel)
  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('contextmenu', noMenu)

  // vòng vẽ: ~30 khung/giây (nước, mây trôi), 60 khi camera đang chuyển động
  let raf = 0
  let prev = performance.now()
  let lastRender = 0
  const frame = (now: number): void => {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.1, (now - prev) / 1000)
    prev = now
    const k = 1 - Math.exp(-dt * 5)
    let moving = false
    for (const key of ['x', 'z', 'dist', 'pitch', 'yaw'] as const) {
      const diff = goal[key] - cam[key]
      if (Math.abs(diff) > 0.001) {
        cam[key] += diff * k
        moving = true
      }
    }
    if (!moving && !dirty && now - lastRender < 33) return
    lastRender = now
    if (!opts.reduceMotion) {
      sparkle.offset.x += dt * 0.012
      sparkle.offset.y += dt * 0.006
      for (const c of clouds) {
        c.position.x += dt * 1.2
        if (c.position.x > mapW + 200) c.position.x = -120
      }
    }
    place()
    sun.target.position.set(cam.x, 0, cam.z)
    sun.position.set(cam.x - 28, 60, cam.z + 32)
    vehicleTime += dt
    if (focused && !opts.reduceMotion && !petState?.kind) {
      goal.yaw += dt * 0.09
      cam.yaw = goal.yaw
    }
    for (const tick of ticks) tick(vehicleTime)
    if (petState) {
      const gx = petState.x / TERRAIN_UNIT
      const gz = petState.y / TERRAIN_UNIT
      const ground = groundAt(gx, gz)
      rig.update(
        {
          kind: petState.kind ?? null,
          x: gx,
          y: (petState.kind === 'boat' ? WATER_Y : ground) + petState.hop,
          z: gz,
          heading: petState.heading ?? 0,
          pitch:
            petState.pitch ??
            (petState.kind === 'car'
              ? Math.atan2(
                  groundAt(
                    gx + Math.cos(petState.heading ?? 0) * 0.35,
                    gz + Math.sin(petState.heading ?? 0) * 0.35
                  ) -
                    groundAt(
                      gx - Math.cos(petState.heading ?? 0) * 0.35,
                      gz - Math.sin(petState.heading ?? 0) * 0.35
                    ),
                  0.7
                )
              : 0)
        },
        dt,
        vehicleTime
      )
    } else rig.update({ kind: null, x: 0, y: 0, z: 0, heading: 0 }, dt, vehicleTime)
    renderer.setRenderTarget(target)
    renderer.clear()
    renderer.render(scene, camera)
    renderer.setRenderTarget(null)
    renderer.clear()
    renderer.render(passScene, passCam)
    renderer.autoClear = false
    renderer.render(labelScene, camera)
    renderer.autoClear = true
    reportPet()
    dirty = moving
  }
  const visibility = (): void => {
    cancelAnimationFrame(raf)
    if (!document.hidden) {
      prev = performance.now()
      dirty = true
      raf = requestAnimationFrame(frame)
    }
  }
  document.addEventListener('visibilitychange', visibility)
  raf = requestAnimationFrame(frame)

  return {
    focus,
    setPet,
    follow,
    restOf,
    route,
    dispose: () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', visibility)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onCancel)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', noMenu)
      for (const d of disposables) d.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      el.remove()
    }
  }
}
