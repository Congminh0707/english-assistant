/** Đếm số lần bấm liên tiếp trong một khoảng thời gian (bấm đúp = làm trò, bấm dồn = chóng mặt) */
export class ClickBurst {
  private times: number[] = []

  constructor(private readonly windowMs = 1600) {}

  /** Ghi một lần bấm ở thời điểm `now` (ms); trả về số lần bấm còn trong cửa sổ, tính cả lần này */
  hit(now: number): number {
    this.times = this.times.filter((t) => now - t <= this.windowMs)
    this.times.push(now)
    return this.times.length
  }

  reset(): void {
    this.times = []
  }
}

/**
 * Nhận ra cử chỉ "vuốt ve": rê chuột qua lại trên nhân vật mà không bấm.
 * Đủ số lần đổi chiều và quãng đường trong cửa sổ thời gian thì báo một lần, rồi nghỉ `cooldownMs`.
 */
export class StrokeDetector {
  private lastX: number | null = null
  private dir = 0
  private reversals = 0
  private dist = 0
  private start = 0
  private cooldownUntil = 0

  constructor(
    private readonly minReversals = 3,
    private readonly windowMs = 2000,
    private readonly cooldownMs = 6000
  ) {}

  /** `width` = bề ngang nhân vật (px): quãng đường tối thiểu là 1,2 lần bề ngang */
  move(x: number, now: number, width: number): boolean {
    if (this.lastX === null) {
      this.lastX = x
      this.start = now
      return false
    }
    const dx = x - this.lastX
    if (Math.abs(dx) < 2) return false
    this.lastX = x
    if (now - this.start > this.windowMs) {
      this.start = now
      this.reversals = 0
      this.dist = 0
    }
    const d = dx > 0 ? 1 : -1
    if (this.dir !== 0 && d !== this.dir) this.reversals++
    this.dir = d
    this.dist += Math.abs(dx)
    if (now < this.cooldownUntil) return false
    if (this.reversals < this.minReversals || this.dist < width * 1.2) return false
    this.cooldownUntil = now + this.cooldownMs
    this.reset()
    return true
  }

  /** Con trỏ rời nhân vật / đang kéo: bắt đầu đếm lại (vẫn giữ thời gian nghỉ) */
  reset(): void {
    this.lastX = null
    this.dir = 0
    this.reversals = 0
    this.dist = 0
  }
}
