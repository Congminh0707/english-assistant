// Ảnh công trình trên bệ tròn cho bản đồ 2D: dựng sẵn từ mô hình 3D (game/landmarks3d), lưu webp trong game/pads.
const urls = import.meta.glob<string>('./pads/*.webp', {
  eager: true,
  query: '?url',
  import: 'default'
})
const cache = new Map<string, HTMLImageElement>()
let loaded = 0

/** Số ảnh đã nạp xong: tăng lên nghĩa là cần vẽ lại, kể cả khi bản đồ đang đứng yên */
export const padsLoaded = (): number => loaded

/** Ảnh bệ của công trình, null khi chưa nạp xong hoặc không có */
export function padImage(landmark: string): HTMLImageElement | null {
  let img = cache.get(landmark)
  if (!img) {
    const url = urls[`./pads/${landmark}.webp`]
    if (!url) return null
    img = new Image()
    img.onload = () => loaded++
    img.src = url
    cache.set(landmark, img)
  }
  return img.complete && img.naturalWidth > 0 ? img : null
}
