/** Nguồn thời gian. Luôn lấy giờ qua Clock thay vì Date.now() để test được logic theo thời gian. */
export interface Clock {
  now(): number
}

export const systemClock: Clock = { now: () => Date.now() }

/** Đồng hồ giả cho test: tự đặt/tua thời gian */
export class FakeClock implements Clock {
  constructor(private time = Date.UTC(2026, 0, 1, 8, 0, 0)) {}
  now(): number {
    return this.time
  }
  set(time: number): void {
    this.time = time
  }
  advance(ms: number): void {
    this.time += ms
  }
}
