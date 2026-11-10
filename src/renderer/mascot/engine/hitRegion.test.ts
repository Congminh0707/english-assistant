import { describe, expect, it } from 'vitest'
import { hitShapes, isOverPet, toFigure } from './hitRegion'

// Khung 240×240 đặt ở gốc: viewBox Huyền thoại (240×196) vừa khít bề ngang, dán đáy.
const BOX = { left: 0, bottom: 240, width: 240, height: 240 }

describe('hitRegion', () => {
  it('đổi điểm màn hình sang toạ độ hình vẽ theo viewBox và tỉ lệ giai đoạn', () => {
    // Huyền thoại: k = 1, đỉnh viewBox ở y = 44 → điểm (120, 230) là (80, 150) = chỗ chân chạm đất
    expect(toFigure({ x: 120, y: 230 }, BOX, 'legend')).toEqual({ x: 80, y: 150 })
    // Bé co 0.72 quanh (80,150): tâm đầu (80,72) vẽ ở y = 150 − 78×0.72 trong viewBox
    const k = 240 / 192
    const top = 240 - 168 * k
    const p = toFigure({ x: 120, y: top + (150 - 78 * 0.72 + 8) * k }, BOX, 'baby')
    expect(p.x).toBeCloseTo(80)
    expect(p.y).toBeCloseTo(72)
  })

  it('lật ngang thì đuôi lệch phải của Lupo sang trái', () => {
    const tail = { x: 120 + 52, y: 230 - 42 } // (132,108) trong hình
    expect(isOverPet(tail, BOX, 'lupo', 'legend')).toBe(true)
    expect(isOverPet(tail, BOX, 'lupo', 'legend', true)).toBe(false)
    expect(isOverPet({ x: 120 - 52, y: 230 - 42 }, BOX, 'lupo', 'legend', true)).toBe(true)
  })

  it('Huyền thoại rộng hơn Trưởng thành: quạt đuôi Thiên Hồ và cánh Long Thần bấm được', () => {
    const wingTip = { x: 120 + 100, y: 230 - 58 } // (180, 92)
    expect(isOverPet(wingTip, BOX, 'draco', 'legend')).toBe(true)
    expect(isOverPet(wingTip, BOX, 'kitsu', 'legend')).toBe(true)
    expect(isOverPet(wingTip, BOX, 'lupo', 'legend')).toBe(false)
    expect(hitShapes('kitsu', 'legend').length).toBeGreaterThan(hitShapes('kitsu', 'baby').length)
  })

  it('góc khung và vùng trống trên đầu trứng không nhận chuột; nhân vật lạ vẫn có thân chung', () => {
    expect(isOverPet({ x: 4, y: 50 }, BOX, 'kitsu', 'legend')).toBe(false)
    expect(isOverPet({ x: 120, y: 40 }, BOX, 'bi', 'egg')).toBe(false)
    expect(isOverPet({ x: 120, y: 160 }, BOX, 'bi', 'egg')).toBe(true)
    expect(isOverPet({ x: 120, y: 150 }, BOX, 'unknown', 'adult')).toBe(true)
  })
})
