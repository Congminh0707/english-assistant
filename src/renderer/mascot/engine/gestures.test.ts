import { describe, expect, it } from 'vitest'
import { ClickBurst, StrokeDetector } from './gestures'

describe('ClickBurst', () => {
  it('đếm các lần bấm trong cửa sổ, quên lần bấm cũ', () => {
    const c = new ClickBurst(1000)
    expect(c.hit(0)).toBe(1)
    expect(c.hit(300)).toBe(2)
    expect(c.hit(600)).toBe(3)
    expect(c.hit(1500)).toBe(2)
    c.reset()
    expect(c.hit(1600)).toBe(1)
  })
})

describe('StrokeDetector', () => {
  const sweep = (s: StrokeDetector, t0: number): boolean[] =>
    [0, 40, 80, 40, 0, 40, 80, 40, 0].map((x, i) => s.move(x, t0 + i * 100, 100))

  it('rê qua lại đủ số lần đổi chiều và quãng đường thì báo đúng một lần', () => {
    const s = new StrokeDetector()
    const fired = sweep(s, 0)
    expect(fired.filter(Boolean)).toHaveLength(1)
  })

  it('rê một chiều hoặc nhích nhẹ thì không tính', () => {
    const s = new StrokeDetector()
    expect([0, 50, 100, 150, 200, 250].some((x, i) => s.move(x, i * 100, 100))).toBe(false)
    const t = new StrokeDetector()
    expect([0, 1, 0, 1, 0, 1, 0, 1].some((x, i) => t.move(x, i * 100, 100))).toBe(false)
  })

  it('vừa báo xong thì nghỉ, hết thời gian nghỉ mới báo lại', () => {
    const s = new StrokeDetector(3, 2000, 6000)
    expect(sweep(s, 0).some(Boolean)).toBe(true)
    s.reset()
    expect(sweep(s, 1000).some(Boolean)).toBe(false)
    s.reset()
    expect(sweep(s, 8000).some(Boolean)).toBe(true)
  })
})
