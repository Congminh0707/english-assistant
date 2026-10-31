// Mức chất lượng bản đồ bé (docs/19-kids-world.md §5.2): nhớ theo máy, tự hạ khi 5 giây đầu dưới 24 khung/giây.
export type MapQuality = 'high' | 'low'

const KEY = 'kids.mapQuality'
const MIN_FPS = 24
const WINDOW_MS = 5000

export function savedQuality(): MapQuality {
  try {
    return localStorage.getItem(KEY) === 'low' ? 'low' : 'high'
  } catch {
    return 'high'
  }
}

function saveLow(): void {
  try {
    localStorage.setItem(KEY, 'low')
  } catch {
    /* không lưu được thì lần sau đo lại */
  }
}

/** Trả về hàm gọi mỗi khung; báo `onLow` một lần nếu máy không đủ khung hình */
export function fpsGuard(onLow: () => void): (now: number) => void {
  let start = 0
  let frames = 0
  let done = savedQuality() === 'low'
  return (now) => {
    if (done) return
    if (!start) start = now
    frames++
    if (now - start < WINDOW_MS) return
    done = true
    if ((frames * 1000) / (now - start) >= MIN_FPS) return
    saveLow()
    onLow()
  }
}
