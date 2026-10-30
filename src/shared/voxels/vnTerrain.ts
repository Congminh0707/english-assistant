// Địa hình voxel của bản đồ Việt Nam (bản đồ 3D của bé): rải lưới ô vuông lên bản đồ giản lược src/shared/vnMap.ts
// (đất liền, Phú Quốc, đảo nhỏ, Hoàng Sa/Trường Sa, sông, núi) → VoxelGrid để chia mặt bằng meshVoxels.
// Trục: x = kinh độ (sang phải), z = vĩ độ (bắc ở z = 0, xa người xem), y = độ cao. Thuần dữ liệu. docs/19 §5.2
import {
  VN_ARCHIPELAGOS,
  VN_ISLETS,
  VN_MOUNTAINS,
  VN_RIVERS,
  VN_SIZE,
  isVnLand,
  projectVn
} from '../vnMap'
import { VP } from './palette'
import { noise } from './landmarks/scenery'
import { VoxelGrid } from './voxelGrid'

/** Cạnh một ô địa hình (đơn vị sân khấu của vnMap) */
export const TERRAIN_CELL = 45
/** Mặt biển nằm ở y = SEA_TOP (mặt trên ô nước ở y = 0) */
export const SEA_TOP = 1

const SAND = VP.sand
const GRASS = [VP.grass, '#74bb54', '#82ca60']
const FOREST = ['#4f9a3b', '#448a33']
const HILL = ['#7a8b5a', '#6d7e50']
const ROCK = ['#8c877c', '#7b766b']
const SNOW = '#f4f8fb'
const SEA_DEEP = '#2f7fb8'
const SEA = '#4aa8d8'
const SEA_LIGHT = '#6dbce6'
const RIVER = '#5fb6e4'

export interface VnTerrain {
  grid: VoxelGrid
  /** Độ cao mặt đất (số ô, ≥ 1) tại từng ô (x, z); 0 = biển */
  heights: Uint8Array
  cols: number
  rows: number
}

/** Điểm sân khấu → toạ độ lưới (số thực) */
export function terrainCoord(p: { x: number; y: number }): { gx: number; gz: number } {
  return { gx: p.x / TERRAIN_CELL, gz: p.y / TERRAIN_CELL }
}

export function buildVnTerrain(): VnTerrain {
  const cols = Math.ceil(VN_SIZE.width / TERRAIN_CELL)
  const rows = Math.ceil(VN_SIZE.height / TERRAIN_CELL)
  const maxH = 11
  const grid = new VoxelGrid(cols, maxH + 6, rows)
  const heights = new Uint8Array(cols * rows)
  const land = new Uint8Array(cols * rows)
  const idx = (x: number, z: number): number => z * cols + x
  const center = (x: number, z: number): { x: number; y: number } => ({
    x: (x + 0.5) * TERRAIN_CELL,
    y: (z + 0.5) * TERRAIN_CELL
  })

  // 1. đất / biển
  for (let z = 0; z < rows; z++)
    for (let x = 0; x < cols; x++) if (isVnLand(center(x, z))) land[idx(x, z)] = 1
  // đảo nhỏ (chấm) và quần đảo
  const mark = (lon: number, lat: number, r = 0): void => {
    const { gx, gz } = terrainCoord(projectVn(lon, lat))
    const rr = Math.max(0, Math.round(r))
    for (let dz = -rr; dz <= rr; dz++)
      for (let dx = -rr; dx <= rr; dx++) {
        const x = Math.floor(gx) + dx
        const z = Math.floor(gz) + dz
        if (x >= 0 && z >= 0 && x < cols && z < rows) land[idx(x, z)] = 1
      }
  }
  for (const [lo, la, r] of VN_ISLETS) mark(lo, la, (r * 300) / TERRAIN_CELL)
  for (const a of VN_ARCHIPELAGOS) for (const [lo, la] of a.islets) mark(lo, la)

  // 2. độ cao: nền 2, núi nhô lên theo khoảng cách
  const mountainBump = (x: number, z: number): number => {
    const p = center(x, z)
    let best = 0
    for (const [lo, la, r] of VN_MOUNTAINS) {
      const m = projectVn(lo, la)
      const d = Math.hypot(p.x - m.x, p.y - m.y)
      const reach = r * 300 * 1.6
      if (d < reach) best = Math.max(best, Math.round(8 * (1 - d / reach) ** 1.3))
    }
    return best
  }
  for (let z = 0; z < rows; z++)
    for (let x = 0; x < cols; x++) {
      if (!land[idx(x, z)]) continue
      const bump = mountainBump(x, z)
      heights[idx(x, z)] = Math.min(maxH, 2 + bump + (noise(x, 1, z) > 0.8 ? 1 : 0))
    }
  // đảo nhỏ/quần đảo thấp
  for (let i = 0; i < land.length; i++) if (land[i] && heights[i] === 0) heights[i] = 1

  // 3. sông: ô gần đường sông
  const river = new Uint8Array(cols * rows)
  for (const line of VN_RIVERS)
    for (let i = 0; i + 1 < line.length; i++) {
      const a = terrainCoord(projectVn(line[i][0], line[i][1]))
      const b = terrainCoord(projectVn(line[i + 1][0], line[i + 1][1]))
      const steps = Math.ceil(Math.hypot(b.gx - a.gx, b.gz - a.gz) * 2)
      for (let s = 0; s <= steps; s++) {
        const x = Math.floor(a.gx + ((b.gx - a.gx) * s) / steps)
        const z = Math.floor(a.gz + ((b.gz - a.gz) * s) / steps)
        if (x >= 0 && z >= 0 && x < cols && z < rows && land[idx(x, z)]) river[idx(x, z)] = 1
      }
    }

  // 4. đổ voxel
  const pick = (list: readonly string[], x: number, z: number): string =>
    list[Math.floor(noise(x, 9, z) * list.length) % list.length]
  const isLand = (x: number, z: number): boolean =>
    x >= 0 && z >= 0 && x < cols && z < rows && land[idx(x, z)] === 1
  for (let z = 0; z < rows; z++)
    for (let x = 0; x < cols; x++) {
      if (!land[idx(x, z)]) {
        const near =
          isLand(x - 1, z) ||
          isLand(x + 1, z) ||
          isLand(x, z - 1) ||
          isLand(x, z + 1) ||
          isLand(x - 1, z - 1) ||
          isLand(x + 1, z + 1)
        grid.set(x, 0, z, near ? SEA_LIGHT : noise(x, 2, z) > 0.985 ? SEA_LIGHT : SEA)
        continue
      }
      const h = heights[idx(x, z)]
      const coast = !isLand(x - 1, z) || !isLand(x + 1, z) || !isLand(x, z - 1) || !isLand(x, z + 1)
      for (let y = 0; y < h - 1; y++) grid.set(x, y, z, y < SEA_TOP ? SEA_DEEP : VP.soil)
      let top: string
      if (river[idx(x, z)]) top = RIVER
      else if (coast || h <= 1) top = SAND
      else if (h >= 9) top = SNOW
      else if (h >= 7) top = pick(ROCK, x, z)
      else if (h >= 5) top = pick(HILL, x, z)
      else top = noise(x, 5, z) > 0.55 && h >= 3 ? pick(FOREST, x, z) : pick(GRASS, x, z)
      grid.set(x, h - 1, z, top)
      // cây lẻ trên cỏ/rừng
      if (h <= 6 && (top === FOREST[0] || top === FOREST[1]) && noise(x, 7, z) > 0.55) {
        grid.set(x, h, z, VP.woodDark)
        grid.set(x, h + 1, z, VP.leaf)
      }
    }
  return { grid, heights, cols, rows }
}

/** Độ cao mặt đất (đơn vị ô) tại điểm sân khấu — để đặt công trình lên đúng chỗ */
export function terrainHeightAt(t: VnTerrain, p: { x: number; y: number }): number {
  const x = Math.min(t.cols - 1, Math.max(0, Math.floor(p.x / TERRAIN_CELL)))
  const z = Math.min(t.rows - 1, Math.max(0, Math.floor(p.y / TERRAIN_CELL)))
  return t.heights[z * t.cols + x] || SEA_TOP
}
