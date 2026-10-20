import { describe, expect, it } from 'vitest'
import { paintDisc, paintLine, TRACE_GRID, traceScore } from './trace'

const size = 20
const blank = (): Uint8Array => new Uint8Array(size * size)

/** Mặt nạ chữ "I": cột dọc rộng 4 ô ở giữa */
function maskI(): Uint8Array {
  const m = blank()
  for (let y = 2; y < 18; y++) for (let x = 8; x < 12; x++) m[y * size + x] = 1
  return m
}

describe('trace', () => {
  it('tô đúng theo nét chữ → đạt, phủ và chính xác đều cao', () => {
    const drawn = blank()
    paintLine(drawn, size, 9.5, 3, 9.5, 17, 2)
    const score = traceScore(maskI(), drawn)
    expect(score.coverage).toBeGreaterThan(0.9)
    expect(score.precision).toBeGreaterThan(0.7)
    expect(score.passed).toBe(true)
  })

  it('chưa tô gì → không đạt; tô một đoạn ngắn → chưa phủ đủ', () => {
    expect(traceScore(maskI(), blank()).passed).toBe(false)
    const short = blank()
    paintLine(short, size, 9.5, 3, 9.5, 6, 2)
    const s = traceScore(maskI(), short)
    expect(s.coverage).toBeLessThan(0.55)
    expect(s.passed).toBe(false)
  })

  it('tô lem khắp nơi → phủ đủ nhưng độ chính xác thấp nên không đạt', () => {
    const scribble = new Uint8Array(size * size).fill(1)
    const s = traceScore(maskI(), scribble)
    expect(s.coverage).toBe(1)
    expect(s.precision).toBeLessThan(0.45)
    expect(s.passed).toBe(false)
  })

  it('tô ngoài chữ hoàn toàn → không đạt', () => {
    const drawn = blank()
    paintLine(drawn, size, 2, 3, 2, 17, 2)
    const s = traceScore(maskI(), drawn)
    expect(s.coverage).toBe(0)
    expect(s.passed).toBe(false)
  })

  it('kích thước không khớp → báo lỗi; vẽ chấm không tràn ra ngoài lưới', () => {
    expect(() => traceScore(new Uint8Array(4), new Uint8Array(9))).toThrow()
    const grid = blank()
    paintDisc(grid, size, -3, -3, 5)
    paintDisc(grid, size, size + 2, size + 2, 5)
    expect(grid.length).toBe(size * size)
    expect(TRACE_GRID).toBeGreaterThan(20)
  })
})
