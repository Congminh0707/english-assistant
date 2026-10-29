// Chiếu mô hình voxel thành hình pixel 2D kiểu isometric (mặt trên sáng, mặt trái màu gốc, mặt phải tối) — cùng một
// bản vẽ voxel dùng cho bản đồ 2D và sticker công trình, không phải vẽ lại. Thuần dữ liệu, có cache theo id.
// docs/19-kids-world.md §5.2
import { mergeRuns, type BadgePixel, type BadgeRect } from '../badgeArt'
import { darken, lighten } from '../pixelGrid'
import type { VoxelGrid } from './voxelGrid'

export interface IsoImage {
  width: number
  height: number
  pixels: BadgePixel[]
}

/**
 * Mỗi voxel vẽ thành khối 4×4 ô (mặt trên 2 hàng hình thoi, hai mặt bên 2 hàng); voxel gần người xem
 * (x + z lớn, y cao) vẽ sau đè lên voxel xa. Hướng nhìn: từ phía +x +z, trên cao.
 */
export function isometric(grid: VoxelGrid): IsoImage {
  const sprite: Array<[number, number, 'top' | 'left' | 'right']> = [
    [1, 0, 'top'],
    [2, 0, 'top'],
    [0, 1, 'top'],
    [1, 1, 'top'],
    [2, 1, 'top'],
    [3, 1, 'top'],
    [0, 2, 'left'],
    [1, 2, 'left'],
    [2, 2, 'right'],
    [3, 2, 'right'],
    [0, 3, 'left'],
    [1, 3, 'left'],
    [2, 3, 'right'],
    [3, 3, 'right']
  ]
  const shades = new Map<string, Record<'top' | 'left' | 'right', string>>()
  const shade = (c: string): Record<'top' | 'left' | 'right', string> => {
    let s = shades.get(c)
    if (!s) {
      s = { top: lighten(c, 0.18), left: c, right: darken(c, 0.22) }
      shades.set(c, s)
    }
    return s
  }
  // x tăng → sang phải-xuống, z tăng → sang trái-xuống, y tăng → lên
  const ox = (grid.sz - 1) * 2
  const oy = (grid.sy - 1) * 2
  const voxels = [...grid.voxels()].sort((a, b) => a.x + a.z - (b.x + b.z) || a.y - b.y)
  const buf = new Map<number, string>()
  const W = (grid.sx + grid.sz) * 2 + 2
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const v of voxels) {
    const bx = ox + (v.x - v.z) * 2
    const by = oy + (v.x + v.z) - v.y * 2
    const s = shade(v.color)
    for (const [dx, dy, face] of sprite) {
      const px = bx + dx
      const py = by + dy
      buf.set(py * W + px, s[face])
      minX = Math.min(minX, px)
      minY = Math.min(minY, py)
      maxX = Math.max(maxX, px)
      maxY = Math.max(maxY, py)
    }
  }
  if (buf.size === 0) return { width: 0, height: 0, pixels: [] }
  const pixels: BadgePixel[] = []
  for (const [k, color] of buf) {
    pixels.push({ x: (k % W) - minX, y: Math.floor(k / W) - minY, color })
  }
  pixels.sort((a, b) => a.y - b.y || a.x - b.x)
  return { width: maxX - minX + 1, height: maxY - minY + 1, pixels }
}

const cache = new Map<string, { width: number; height: number; rects: BadgeRect[] }>()

/** Hình isometric đã gộp thành hình chữ nhật theo hàng (vẽ bằng SVG), cache theo id mô hình */
export function isometricRects(
  id: string,
  build: () => VoxelGrid
): { width: number; height: number; rects: BadgeRect[] } {
  let hit = cache.get(id)
  if (!hit) {
    const img = isometric(build())
    hit = { width: img.width, height: img.height, rects: mergeRuns(img.pixels) }
    cache.set(id, hit)
  }
  return hit
}
