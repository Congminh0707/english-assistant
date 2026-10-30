// Hình từ vẽ vector bằng canvas (docs/19 §5.5). Mỗi file trong ./pictures/ xuất `PICTURES: Record<id, Painter>`
// (id = id hình trong shared/pictures.ts / pictureExtras.ts); file mới tự được nạp. Hình vẽ một lần ra PNG `data:`
// (CSP cho phép img-src data:) và cache theo id — PixelPicture ưu tiên hình này, thiếu thì dùng PNG/Twemoji/pixel cũ.
import { ART_SIZE, type Painter } from './kit'

const modules = import.meta.glob<{ PICTURES: Record<string, Painter> }>('./pictures/*.ts', {
  eager: true
})

export const VECTOR_PICTURES: Readonly<Record<string, Painter>> = Object.assign(
  {},
  ...Object.values(modules).map((m) => m.PICTURES)
)

/** Độ phân giải vẽ (px) — đủ nét cho hình to nhất (~200 px) trên màn hình 2×. */
const RENDER_PX = 384
const cache = new Map<string, string>()

export function hasVectorPicture(id: string): boolean {
  return id in VECTOR_PICTURES
}

/** Ảnh `data:` PNG của hình vector `id`, hoặc undefined nếu chưa vẽ. */
export function vectorPictureUrl(id: string): string | undefined {
  const paint = VECTOR_PICTURES[id]
  if (!paint) return undefined
  const hit = cache.get(id)
  if (hit) return hit
  const cv = document.createElement('canvas')
  cv.width = RENDER_PX
  cv.height = RENDER_PX
  const c = cv.getContext('2d')
  if (!c) return undefined
  c.scale(RENDER_PX / ART_SIZE, RENDER_PX / ART_SIZE)
  paint(c)
  const url = cv.toDataURL('image/png')
  cache.set(id, url)
  return url
}
