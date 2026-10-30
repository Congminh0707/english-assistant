// Địa hình mịn của bản đồ 3D Việt Nam (thay cho địa hình voxel khối vuông): lưới độ cao dựng từ bản đồ giản lược
// src/shared/vnMap.ts — bờ biển được làm mượt bằng cách làm nhoè mặt nạ đất/biển, núi nhô lên theo vùng núi, sông khoét lòng,
// các nền phẳng (pad) để đặt công trình, màu theo độ cao/độ dốc/rừng, cây và nhà rải theo luật. Thuần dữ liệu, không phụ
// thuộc three.js → test ở Node. Đơn vị thế giới: 1 đơn vị = TERRAIN_UNIT đơn vị sân khấu của vnMap. docs/19 §5.2
import {
  VN_ARCHIPELAGOS,
  VN_ISLANDS,
  VN_ISLETS,
  VN_MOUNTAINS,
  VN_RIVERS,
  VN_SIZE,
  isVnLand,
  pointInPolygon,
  projectVn
} from './vnMap'

/** Một đơn vị thế giới = bấy nhiêu đơn vị sân khấu */
export const TERRAIN_UNIT = 22.5
/** Khoảng cách giữa hai đỉnh lưới (đơn vị thế giới) */
export const VERTEX_STEP = 0.5
/** Mặt nước nằm ở y = 0 */
export const WATER_Y = 0

/** Nền phẳng cho công trình: tâm (x, z) đơn vị thế giới, bán kính nền phẳng r */
export interface Pad {
  x: number
  z: number
  r: number
}

export interface VnHeightfield {
  /** Số đỉnh theo x / z */
  cols: number
  rows: number
  /** Độ cao từng đỉnh (hàng z, cột x) */
  heights: Float32Array
  /** RGB tuyến tính từng đỉnh */
  colors: Float32Array
  /** Độ cao nền của từng pad (cùng thứ tự `pads`) */
  padHeights: number[]
  /** Cây: mỗi cây 8 số [x, y, z, cỡ, loại (0 tròn, 1 thông), r, g, b] */
  trees: Float32Array
  /** Nhà: mỗi nhà 6 số [x, y, z, góc xoay, cỡ, mái (0–2)] */
  houses: Float32Array
  /** Độ cao nội suy tại (x, z) đơn vị thế giới */
  heightAt: (x: number, z: number) => number
  /** Kích thước thế giới (đơn vị) */
  width: number
  depth: number
}

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function hashInt(x: number, y: number, z: number): number {
  let n = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263) ^ Math.imul(z + 7, 1274126177)
  n = Math.imul(n ^ (n >>> 13), 1103515245)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

/** Nhiễu giá trị mượt trong [0, 1) */
function vnoise(x: number, z: number, seed: number): number {
  const x0 = Math.floor(x)
  const z0 = Math.floor(z)
  const fx = x - x0
  const fz = z - z0
  const sx = fx * fx * (3 - 2 * fx)
  const sz = fz * fz * (3 - 2 * fz)
  const a = hashInt(x0, seed, z0)
  const b = hashInt(x0 + 1, seed, z0)
  const c = hashInt(x0, seed, z0 + 1)
  const d = hashInt(x0 + 1, seed, z0 + 1)
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz
}

/** Làm nhoè hộp tách theo hai chiều (bán kính r đỉnh) */
function boxBlur(src: Float32Array, cols: number, rows: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  const span = 2 * r + 1
  for (let z = 0; z < rows; z++) {
    let sum = 0
    for (let k = -r; k <= r; k++) sum += src[z * cols + Math.min(cols - 1, Math.max(0, k))]
    for (let x = 0; x < cols; x++) {
      tmp[z * cols + x] = sum / span
      sum += src[z * cols + Math.min(cols - 1, x + r + 1)] - src[z * cols + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < cols; x++) {
    let sum = 0
    for (let k = -r; k <= r; k++) sum += tmp[Math.min(rows - 1, Math.max(0, k)) * cols + x]
    for (let z = 0; z < rows; z++) {
      out[z * cols + x] = sum / span
      sum += tmp[Math.min(rows - 1, z + r + 1) * cols + x] - tmp[Math.max(0, z - r) * cols + x]
    }
  }
  return out
}

const hex = (s: string): [number, number, number] =>
  [1, 3, 5].map((i) => Math.pow(parseInt(s.slice(i, i + 2), 16) / 255, 2.2)) as [
    number,
    number,
    number
  ]
const mix = (
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t
]

const C = {
  deep: hex('#2b7fbd'),
  mid: hex('#46a8de'),
  shallow: hex('#7fd3ee'),
  shore: hex('#b6efee'),
  wet: hex('#e4cf93'),
  sand: hex('#f4e0a4'),
  paddy: hex('#b9dc66'),
  grass: hex('#86c85a'),
  grassDark: hex('#5fae48'),
  forest: hex('#3f8f3a'),
  forestDark: hex('#2f7a34'),
  hill: hex('#8fa15d'),
  rock: hex('#9a9487'),
  rockDark: hex('#7a756a'),
  snow: hex('#f4f8fb'),
  river: hex('#5fb9e8')
}

export function buildVnHeightfield(pads: readonly Pad[] = []): VnHeightfield {
  const width = VN_SIZE.width / TERRAIN_UNIT
  const depth = VN_SIZE.height / TERRAIN_UNIT
  const cols = Math.ceil(width / VERTEX_STEP) + 1
  const rows = Math.ceil(depth / VERTEX_STEP) + 1
  const n = cols * rows
  const px = (ix: number): number => ix * VERTEX_STEP
  const pz = (iz: number): number => iz * VERTEX_STEP

  // 1. mặt nạ đất → nhoè → mức bờ
  const mask = new Float32Array(n)
  for (let iz = 0; iz < rows; iz++)
    for (let ix = 0; ix < cols; ix++)
      if (isVnLand({ x: px(ix) * TERRAIN_UNIT, y: pz(iz) * TERRAIN_UNIT })) mask[iz * cols + ix] = 1
  const f = boxBlur(boxBlur(mask, cols, rows, 4), cols, rows, 4)

  // 2. độ cao nền + đồi + núi
  const mountains = VN_MOUNTAINS.map(([lo, la, r]) => {
    const p = projectVn(lo, la)
    return {
      x: p.x / TERRAIN_UNIT,
      z: p.y / TERRAIN_UNIT,
      reach: (r * 300 * 2.4) / TERRAIN_UNIT,
      amp: la > 21.5 ? 17 : 11
    }
  })
  const heights = new Float32Array(n)
  for (let iz = 0; iz < rows; iz++)
    for (let ix = 0; ix < cols; ix++) {
      const i = iz * cols + ix
      const x = px(ix)
      const z = pz(iz)
      const fv = f[i]
      let h = fv > 0.5 ? (fv - 0.5) * 3.2 : Math.max(-4, (fv - 0.5) * 9)
      const w = smooth(0.52, 0.85, fv)
      if (w > 0) {
        h += w * ((vnoise(x / 9, z / 9, 3) - 0.5) * 5 + (vnoise(x / 3.2, z / 3.2, 4) - 0.5) * 1.8)
        let m = 0
        for (const mt of mountains) {
          const d = Math.hypot(x - mt.x, z - mt.z)
          if (d < mt.reach) m = Math.max(m, mt.amp * (1 - d / mt.reach) ** 1.7)
        }
        if (m > 0) m *= 0.7 + 0.6 * vnoise(x / 2.4, z / 2.4, 6)
        h += w * m
        h += w * 0.8
      }
      heights[i] = h
    }

  // đảo vẽ thành hình (Phú Quốc) quá nhỏ để sống sót qua bước làm nhoè → nâng riêng
  const islandMask = new Float32Array(n)
  const islandPolys = VN_ISLANDS.map((poly) => poly.map(([lo, la]) => projectVn(lo, la)))
  for (let iz = 0; iz < rows; iz++)
    for (let ix = 0; ix < cols; ix++) {
      const p = { x: px(ix) * TERRAIN_UNIT, y: pz(iz) * TERRAIN_UNIT }
      if (islandPolys.some((poly) => pointInPolygon(p, poly))) islandMask[iz * cols + ix] = 1
    }
  const islandF = boxBlur(islandMask, cols, rows, 2)
  for (let i = 0; i < n; i++) {
    if (islandF[i] > 0.15) {
      const wI = Math.min(1, (islandF[i] - 0.15) * 3)
      heights[i] = Math.max(
        heights[i],
        (islandF[i] - 0.3) * 4 +
          wI * 1.2 +
          (vnoise(px(i % cols) / 2, pz(Math.floor(i / cols)) / 2, 9) - 0.5) * 0.6
      )
    }
  }

  // đảo nhỏ / quần đảo: gò cát nhô khỏi mặt nước
  const islet = (lon: number, lat: number, r: number): void => {
    const p = projectVn(lon, lat)
    const cx = p.x / TERRAIN_UNIT
    const cz = p.y / TERRAIN_UNIT
    const ix0 = Math.max(0, Math.floor((cx - r) / VERTEX_STEP))
    const ix1 = Math.min(cols - 1, Math.ceil((cx + r) / VERTEX_STEP))
    const iz0 = Math.max(0, Math.floor((cz - r) / VERTEX_STEP))
    const iz1 = Math.min(rows - 1, Math.ceil((cz + r) / VERTEX_STEP))
    for (let iz = iz0; iz <= iz1; iz++)
      for (let ix = ix0; ix <= ix1; ix++) {
        const d = Math.hypot(px(ix) - cx, pz(iz) - cz) / r
        if (d >= 1) continue
        const i = iz * cols + ix
        heights[i] = Math.max(heights[i], 1.6 * (1 - d * d) - 0.35)
      }
  }
  for (const [lo, la, r] of VN_ISLETS) islet(lo, la, Math.max(1.3, (r * 300) / TERRAIN_UNIT))
  for (const a of VN_ARCHIPELAGOS) for (const [lo, la] of a.islets) islet(lo, la, 1.3)

  // 3. sông khoét lòng
  const riverW = new Float32Array(n)
  const riverR = 0.95
  for (const line of VN_RIVERS)
    for (let s = 0; s + 1 < line.length; s++) {
      const a = projectVn(line[s][0], line[s][1])
      const b = projectVn(line[s + 1][0], line[s + 1][1])
      const ax = a.x / TERRAIN_UNIT
      const az = a.y / TERRAIN_UNIT
      const bx = b.x / TERRAIN_UNIT
      const bz = b.y / TERRAIN_UNIT
      const len2 = (bx - ax) ** 2 + (bz - az) ** 2 || 1
      const ix0 = Math.max(0, Math.floor((Math.min(ax, bx) - riverR) / VERTEX_STEP))
      const ix1 = Math.min(cols - 1, Math.ceil((Math.max(ax, bx) + riverR) / VERTEX_STEP))
      const iz0 = Math.max(0, Math.floor((Math.min(az, bz) - riverR) / VERTEX_STEP))
      const iz1 = Math.min(rows - 1, Math.ceil((Math.max(az, bz) + riverR) / VERTEX_STEP))
      for (let iz = iz0; iz <= iz1; iz++)
        for (let ix = ix0; ix <= ix1; ix++) {
          const x = px(ix)
          const z = pz(iz)
          const t = Math.min(1, Math.max(0, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / len2))
          const d = Math.hypot(x - (ax + (bx - ax) * t), z - (az + (bz - az) * t))
          if (d >= riverR) continue
          const i = iz * cols + ix
          riverW[i] = Math.max(riverW[i], 1 - smooth(0.25, riverR, d))
        }
    }
  for (let i = 0; i < n; i++) {
    if (riverW[i] > 0 && heights[i] > -0.1) {
      const w = riverW[i] * smooth(0.55, 0.8, f[i])
      heights[i] = heights[i] * (1 - w) + -0.28 * w
    }
  }

  // 4. nền phẳng cho công trình
  const padHeights = pads.map((p) => {
    const i = Math.round(p.z / VERTEX_STEP) * cols + Math.round(p.x / VERTEX_STEP)
    return Math.max(0.9, heights[Math.min(n - 1, Math.max(0, i))] ?? 0.9)
  })
  pads.forEach((p, k) => {
    const outer = p.r * 1.55
    const ix0 = Math.max(0, Math.floor((p.x - outer) / VERTEX_STEP))
    const ix1 = Math.min(cols - 1, Math.ceil((p.x + outer) / VERTEX_STEP))
    const iz0 = Math.max(0, Math.floor((p.z - outer) / VERTEX_STEP))
    const iz1 = Math.min(rows - 1, Math.ceil((p.z + outer) / VERTEX_STEP))
    for (let iz = iz0; iz <= iz1; iz++)
      for (let ix = ix0; ix <= ix1; ix++) {
        const d = Math.hypot(px(ix) - p.x, pz(iz) - p.z)
        if (d >= outer) continue
        const t = 1 - smooth(p.r, outer, d)
        const i = iz * cols + ix
        heights[i] = heights[i] * (1 - t) + padHeights[k] * t
      }
  })

  const heightAt = (x: number, z: number): number => {
    const fx = Math.min(cols - 1.001, Math.max(0, x / VERTEX_STEP))
    const fz = Math.min(rows - 1.001, Math.max(0, z / VERTEX_STEP))
    const x0 = Math.floor(fx)
    const z0 = Math.floor(fz)
    const tx = fx - x0
    const tz = fz - z0
    const a = heights[z0 * cols + x0]
    const b = heights[z0 * cols + x0 + 1]
    const c = heights[(z0 + 1) * cols + x0]
    const d = heights[(z0 + 1) * cols + x0 + 1]
    return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz
  }

  const slopeAt = (ix: number, iz: number): number => {
    const l = heights[iz * cols + Math.max(0, ix - 1)]
    const r = heights[iz * cols + Math.min(cols - 1, ix + 1)]
    const u = heights[Math.max(0, iz - 1) * cols + ix]
    const d = heights[Math.min(rows - 1, iz + 1) * cols + ix]
    return Math.hypot(r - l, d - u) / (2 * VERTEX_STEP)
  }
  const nearPad = (x: number, z: number, scale = 1.35): boolean =>
    pads.some((p) => Math.hypot(x - p.x, z - p.z) < p.r * scale)

  // 5. màu từng đỉnh
  const colors = new Float32Array(n * 3)
  for (let iz = 0; iz < rows; iz++)
    for (let ix = 0; ix < cols; ix++) {
      const i = iz * cols + ix
      const x = px(ix)
      const z = pz(iz)
      const h = heights[i]
      let c: [number, number, number]
      if (h < 0) {
        const depthM = -h
        c =
          depthM < 0.25
            ? mix(C.shore, C.shallow, depthM / 0.25)
            : depthM < 1.4
              ? mix(C.shallow, C.mid, (depthM - 0.25) / 1.15)
              : mix(C.mid, C.deep, Math.min(1, (depthM - 1.4) / 2.6))
        if (riverW[i] > 0.15 && f[i] > 0.6) c = mix(c, C.river, 0.7)
      } else {
        const slope = slopeAt(ix, iz)
        const forest = vnoise(x / 6, z / 6, 5) * 0.7 + vnoise(x / 2, z / 2, 7) * 0.3
        const patch = vnoise(x / 11, z / 11, 8)
        c = mix(C.paddy, C.grass, smooth(0.9, 2.6, h))
        c = mix(c, C.grassDark, smooth(0.35, 0.8, patch) * 0.55)
        c = mix(c, C.forest, smooth(0.5, 0.62, forest) * smooth(1.4, 3, h))
        c = mix(c, C.forestDark, smooth(0.66, 0.78, forest) * 0.6)
        c = mix(c, C.hill, smooth(5, 8, h))
        c = mix(c, C.rock, Math.max(smooth(9.5, 12.5, h), smooth(0.9, 1.5, slope)))
        c = mix(c, C.rockDark, smooth(1.4, 2.2, slope) * 0.6)
        c = mix(c, C.snow, smooth(13.5, 15.5, h))
        c = mix(c, C.sand, 1 - smooth(0.25, 0.75, h))
        c = mix(c, C.wet, 1 - smooth(0.03, 0.2, h))
        if (riverW[i] > 0.15)
          c = mix(c, C.river, smooth(0.15, 0.6, riverW[i]) * (h < 0.4 ? 1 : 0.5))
      }
      const j = 1 + (hashInt(ix, 3, iz) - 0.5) * 0.05
      colors[i * 3] = c[0] * j
      colors[i * 3 + 1] = c[1] * j
      colors[i * 3 + 2] = c[2] * j
    }

  // 6. cây
  const trees: number[] = []
  const step = 0.33
  for (let z = 0.3; z < depth; z += step)
    for (let x = 0.3; x < width; x += step) {
      const gi = Math.round(x * 1000)
      const gj = Math.round(z * 1000)
      const tx = x + (hashInt(gi, 1, gj) - 0.5) * step
      const tz = z + (hashInt(gi, 2, gj) - 0.5) * step
      const h = heightAt(tx, tz)
      if (h < 0.95 || h > 12.5) continue
      const ix = Math.round(tx / VERTEX_STEP)
      const iz = Math.round(tz / VERTEX_STEP)
      if (slopeAt(ix, iz) > 0.95 || riverW[iz * cols + ix] > 0.1 || nearPad(tx, tz)) continue
      const forest = vnoise(tx / 6, tz / 6, 5) * 0.7 + vnoise(tx / 2, tz / 2, 7) * 0.3
      const p = forest > 0.56 ? 0.92 : forest > 0.48 ? 0.32 : 0.06
      if (hashInt(gi, 3, gj) > p) continue
      const pine = h > 5.5 || hashInt(gi, 4, gj) > 0.78 ? 1 : 0
      const scale = 0.55 + hashInt(gi, 5, gj) * 0.55
      const tint = hashInt(gi, 6, gj)
      const base = pine ? C.forestDark : tint > 0.8 ? C.grass : C.forest
      const k = 0.85 + tint * 0.3
      trees.push(tx, h, tz, scale, pine, base[0] * k, base[1] * k, base[2] * k)
    }

  // 7. làng: cụm nhà nhỏ trên đất thấp, phẳng
  const houses: number[] = []
  for (let v = 0; v < 2500; v++) {
    const cx = hashInt(v, 11, 1) * width
    const cz = hashInt(v, 12, 1) * depth
    const h = heightAt(cx, cz)
    const ix = Math.round(cx / VERTEX_STEP)
    const iz = Math.round(cz / VERTEX_STEP)
    if (
      h < 0.9 ||
      h > 4.6 ||
      slopeAt(ix, iz) > 0.5 ||
      riverW[iz * cols + ix] > 0.05 ||
      nearPad(cx, cz, 1.6)
    )
      continue
    const count = 5 + Math.floor(hashInt(v, 13, 1) * 7)
    for (let k = 0; k < count; k++) {
      const a = hashInt(v, k, 14) * Math.PI * 2
      const rr = 0.3 + hashInt(v, k, 15) * 1.1
      const hx = cx + Math.cos(a) * rr
      const hz = cz + Math.sin(a) * rr
      const hh = heightAt(hx, hz)
      if (hh < 0.85 || hh > 4.8 || nearPad(hx, hz, 1.6)) continue
      houses.push(
        hx,
        hh,
        hz,
        hashInt(v, k, 16) * Math.PI,
        0.7 + hashInt(v, k, 17) * 0.5,
        Math.floor(hashInt(v, k, 18) * 3)
      )
    }
  }

  return {
    cols,
    rows,
    heights,
    colors,
    padHeights,
    trees: new Float32Array(trees),
    houses: new Float32Array(houses),
    heightAt,
    width,
    depth
  }
}
