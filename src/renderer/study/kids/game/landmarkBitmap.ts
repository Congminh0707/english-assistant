import { landmarkImage } from '@shared/voxels/landmarks'

// Công trình chiếu từ voxel (isometric) → bitmap có viền mực, phóng to kiểu pixel (không nhoè), cache theo id.
// Dùng cho sân khấu canvas của màn game bé (docs/19-kids-world.md §5.4 mục 8).
const INK = '#3b2a3a'
const SCALE = 2
const cache = new Map<string, HTMLCanvasElement | null>()

export function landmarkBitmap(id: string): HTMLCanvasElement | null {
  if (cache.has(id)) return cache.get(id) ?? null
  const image = landmarkImage(id)
  let out: HTMLCanvasElement | null = null
  if (image && image.width > 0) {
    const pad = 2
    const w = image.width + pad * 2
    const h = image.height + pad * 2
    const base = document.createElement('canvas')
    base.width = w
    base.height = h
    const b = base.getContext('2d')
    if (b) {
      for (const r of image.rects) {
        b.fillStyle = r.color
        b.fillRect(r.x + pad, r.y + pad, r.w, 1)
      }
      const outline = document.createElement('canvas')
      outline.width = w
      outline.height = h
      const o = outline.getContext('2d')
      if (o) {
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1]
        ]) {
          o.drawImage(base, dx, dy)
        }
        o.globalCompositeOperation = 'source-in'
        o.fillStyle = INK
        o.fillRect(0, 0, w, h)
        o.globalCompositeOperation = 'source-over'
        o.drawImage(base, 0, 0)
        out = document.createElement('canvas')
        out.width = w * SCALE
        out.height = h * SCALE
        const c = out.getContext('2d')
        if (c) {
          c.imageSmoothingEnabled = false
          c.drawImage(outline, 0, 0, out.width, out.height)
        } else out = null
      }
    }
  }
  cache.set(id, out)
  return out
}
