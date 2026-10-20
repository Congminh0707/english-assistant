// Tập viết chữ (trace_letter): chấm nét bé tô theo chữ mẫu bằng cách so hai lưới nhị phân (mặt nạ chữ và nét đã tô).
// Thuần dữ liệu → dùng ở renderer (canvas) và test được ở Node. docs/07-learning-modules.md#9-phonics--mầm-non-p1

/** Cạnh lưới so sánh (ô): đủ mịn để phân biệt nét, đủ thô để chấm nhanh và dễ dãi với bé */
export const TRACE_GRID = 48
/** Tô phủ ít nhất chừng này phần của chữ mẫu */
export const TRACE_MIN_COVERAGE = 0.55
/** Phần nét tô nằm trong chữ mẫu tối thiểu (tô lem ra ngoài quá nhiều thì không đạt) */
export const TRACE_MIN_PRECISION = 0.45
/** Số lần thử tối đa cho mỗi chữ */
export const TRACE_MAX_TRIES = 2

export interface TraceScore {
  /** Phần chữ mẫu đã được tô, 0–1 */
  coverage: number
  /** Phần nét tô nằm trong chữ mẫu, 0–1 (1 nếu chưa tô gì để không phạt hai lần) */
  precision: number
  passed: boolean
}

/** Chấm: `mask` và `drawn` cùng kích thước, mỗi ô 0 hoặc 1 */
export function traceScore(mask: ArrayLike<number>, drawn: ArrayLike<number>): TraceScore {
  if (mask.length !== drawn.length) throw new Error('mask và drawn phải cùng kích thước')
  let maskCount = 0
  let drawnCount = 0
  let both = 0
  for (let i = 0; i < mask.length; i++) {
    const m = mask[i] ? 1 : 0
    const d = drawn[i] ? 1 : 0
    maskCount += m
    drawnCount += d
    both += m & d
  }
  const coverage = maskCount ? both / maskCount : 0
  const precision = drawnCount ? both / drawnCount : 1
  return {
    coverage,
    precision,
    passed: drawnCount > 0 && coverage >= TRACE_MIN_COVERAGE && precision >= TRACE_MIN_PRECISION
  }
}

/** Đánh dấu các ô trong bán kính `radius` quanh điểm (x, y) (toạ độ ô) — dùng khi bé kéo bút */
export function paintDisc(
  grid: Uint8Array,
  size: number,
  x: number,
  y: number,
  radius: number
): void {
  const r = Math.ceil(radius)
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const gx = Math.round(x) + dx
      const gy = Math.round(y) + dy
      if (gx < 0 || gy < 0 || gx >= size || gy >= size) continue
      if (dx * dx + dy * dy <= radius * radius) grid[gy * size + gx] = 1
    }
  }
}

/** Tô dọc đoạn thẳng từ (x0, y0) đến (x1, y1): nối các điểm bút để nét liền */
export function paintLine(
  grid: Uint8Array,
  size: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number
): void {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    paintDisc(grid, size, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius)
  }
}
