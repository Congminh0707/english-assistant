import { landmarkGrid } from '@shared/voxels/landmarks'
import type { VoxelGrid } from '@shared/voxels/voxelGrid'
import { darken, lighten } from '@shared/pixelGrid'

// Công trình chiếu từ voxel (isometric) → bitmap độ phân giải cao: mỗi khối vẽ thành 3 hình thoi/bình hành
// (chỉ mặt nhìn thấy), đổ sáng–tối theo mặt, tối dần về chân và nơi bị che (AO), viền mực mảnh; sau đó thu nhỏ có
// làm mượt về cỡ vừa đủ cho sân khấu. Cache theo id. docs/19-kids-world.md §5.4 mục 8.
const INK = '#3b2a3a'
/** Nửa rộng, nửa cao của mặt trên, và cao của mặt bên, tính bằng px khi vẽ (mỗi khối) */
const A = 7
const B = 3.5
const H = 7
const OUTLINE = 4
/** Cạnh dài tối đa của bitmap cuối (px) */
const MAX_SIDE = 640
const cache = new Map<string, HTMLCanvasElement | null>()

type Face = 'top' | 'left' | 'right'

const tints = new Map<string, string>()
function tint(color: string, face: Face, shadow: number, ground: number): string {
  const key = `${color}|${face}|${shadow}|${ground}`
  let out = tints.get(key)
  if (!out) {
    const base = face === 'top' ? lighten(color, 0.2) : face === 'left' ? darken(color, 0.06) : darken(color, 0.3)
    out = darken(base, Math.min(0.55, shadow * 0.07 + ground * 0.14))
    tints.set(key, out)
  }
  return out
}

function paintVoxels(grid: VoxelGrid): HTMLCanvasElement | null {
  const ox = (grid.sz - 1) * A
  const oy = (grid.sy - 1) * H
  const voxels = [...grid.voxels()].sort((a, b) => a.x + a.z - (b.x + b.z) || a.y - b.y)
  if (!voxels.length) return null
  const pad = OUTLINE + 2
  const w = (grid.sx + grid.sz) * A + pad * 2
  const h = (grid.sx + grid.sz) * B + grid.sy * H + pad * 2
  const cv = document.createElement('canvas')
  cv.width = Math.ceil(w)
  cv.height = Math.ceil(h)
  const c = cv.getContext('2d')
  if (!c) return null
  c.lineJoin = 'round'
  c.lineWidth = 0.9
  const poly = (pts: number[], fill: string): void => {
    c.beginPath()
    c.moveTo(pts[0], pts[1])
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1])
    c.closePath()
    c.fillStyle = fill
    c.strokeStyle = fill
    c.fill()
    c.stroke() // phủ khe hở giữa các khối
  }
  const filled = (x: number, y: number, z: number): number => (grid.get(x, y, z) ? 1 : 0)
  for (const v of voxels) {
    const { x, y, z, color } = v
    const bx = pad + ox + (x - z) * A
    const by = pad + oy + (x + z) * B - y * H
    // gần mặt đất thì tối hơn một chút, đỉnh cao thì sáng hơn
    const ground = 1 - y / grid.sy
    if (!grid.get(x, y + 1, z)) {
      const ao =
        filled(x - 1, y + 1, z) + filled(x + 1, y + 1, z) + filled(x, y + 1, z - 1) + filled(x, y + 1, z + 1)
      poly(
        [bx + A, by, bx + 2 * A, by + B, bx + A, by + 2 * B, bx, by + B],
        tint(color, 'top', ao, ground * 0.4)
      )
    }
    if (!grid.get(x, y, z + 1)) {
      const sh = filled(x, y + 1, z + 1) * 2 + filled(x - 1, y, z + 1) + filled(x + 1, y, z + 1)
      poly(
        [bx, by + B, bx + A, by + 2 * B, bx + A, by + 2 * B + H, bx, by + B + H],
        tint(color, 'left', sh, ground)
      )
    }
    if (!grid.get(x + 1, y, z)) {
      const sh = filled(x + 1, y + 1, z) * 2 + filled(x + 1, y, z - 1) + filled(x + 1, y, z + 1)
      poly(
        [bx + A, by + 2 * B, bx + 2 * A, by + B, bx + 2 * A, by + B + H, bx + A, by + 2 * B + H],
        tint(color, 'right', sh, ground)
      )
    }
  }
  return cv
}

/** Viền mực quanh hình (nở ra OUTLINE px theo vòng tròn), rồi vẽ lại hình lên trên */
function withOutline(src: HTMLCanvasElement): HTMLCanvasElement | null {
  const out = document.createElement('canvas')
  out.width = src.width
  out.height = src.height
  const o = out.getContext('2d')
  if (!o) return null
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2
    o.drawImage(src, Math.cos(a) * OUTLINE * 0.75, Math.sin(a) * OUTLINE * 0.75)
  }
  o.globalCompositeOperation = 'source-in'
  o.fillStyle = INK
  o.fillRect(0, 0, out.width, out.height)
  o.globalCompositeOperation = 'source-over'
  o.drawImage(src, 0, 0)
  return out
}

export function landmarkBitmap(id: string): HTMLCanvasElement | null {
  if (cache.has(id)) return cache.get(id) ?? null
  let out: HTMLCanvasElement | null = null
  const grid = landmarkGrid(id)
  const painted = grid ? paintVoxels(grid) : null
  const outlined = painted ? withOutline(painted) : null
  if (outlined) {
    const k = Math.min(1, MAX_SIDE / Math.max(outlined.width, outlined.height))
    out = document.createElement('canvas')
    out.width = Math.round(outlined.width * k)
    out.height = Math.round(outlined.height * k)
    const c = out.getContext('2d')
    if (c) {
      c.imageSmoothingEnabled = true
      c.imageSmoothingQuality = 'high'
      c.drawImage(outlined, 0, 0, out.width, out.height)
    } else out = null
  }
  cache.set(id, out)
  return out
}
