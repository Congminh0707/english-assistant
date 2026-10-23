import { describe, expect, it } from 'vitest'
import { BADGE_HIRES_SCALE, BADGE_SIZE, GLYPHS, TIERS, badgePixels, mergeRuns } from './badgeArt'

describe('badgeArt', () => {
  it('mọi biểu tượng vẽ được, có nội dung và màu hợp lệ', () => {
    for (const name of Object.keys(GLYPHS)) {
      const pixels = badgePixels(name, 'gold', false)
      expect(pixels.length, name).toBeGreaterThan(400)
      for (const p of pixels) expect(p.color, name).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('huy hiệu nằm gọn trong lưới, khác nhau theo hạng và khi bị khoá', () => {
    const gold = badgePixels('flame', 'gold', false)
    const silver = badgePixels('flame', 'silver', false)
    const locked = badgePixels('flame', 'gold', true)
    for (const p of gold) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThan(BADGE_SIZE)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThan(BADGE_SIZE)
    }
    expect(gold.map((p) => p.color)).not.toEqual(silver.map((p) => p.color))
    expect(locked.map((p) => p.color)).not.toEqual(gold.map((p) => p.color))
    expect(TIERS).toHaveLength(4)
  })

  it('biểu tượng khác nhau cho kết quả khác nhau, và vẽ lại cho cùng kết quả', () => {
    const a = badgePixels('star', 'gold', false)
    expect(badgePixels('star', 'gold', false)).toEqual(a)
    expect(badgePixels('bolt', 'gold', false)).not.toEqual(a)
  })

  it('gộp ô liền nhau mà không đổi nội dung', () => {
    const pixels = badgePixels('star', 'diamond', false)
    const rects = mergeRuns(pixels)
    expect(rects.length).toBeLessThan(pixels.length)
    expect(rects.reduce((n, r) => n + r.w, 0)).toBe(pixels.length)
  })

  it('biểu tượng không tồn tại → lỗi rõ ràng', () => {
    expect(() => badgePixels('nope', 'gold', false)).toThrow(/Unknown badge glyph/)
  })
})

describe('huy hiệu bản nét (scale 8)', () => {
  it('mọi biểu tượng × hạng vẽ được ở 256×256 và nằm trong khung; khoá dùng ổ khoá', () => {
    const dim = BADGE_SIZE * BADGE_HIRES_SCALE
    for (const name of Object.keys(GLYPHS).filter((g) => g !== 'lock')) {
      for (const tier of TIERS) {
        const pixels = badgePixels(name, tier, false, BADGE_HIRES_SCALE)
        expect(pixels.length).toBeGreaterThan(dim * dim * 0.5)
        for (const p of pixels) {
          expect(p.x).toBeGreaterThanOrEqual(0)
          expect(p.x).toBeLessThan(dim)
          expect(p.y).toBeLessThan(dim)
        }
      }
    }
    const lockedA = badgePixels('flame', 'gold', true, BADGE_HIRES_SCALE)
    const lockedB = badgePixels('book', 'diamond', true, BADGE_HIRES_SCALE)
    expect(lockedA).toEqual(lockedB)
  }, 60_000)
})
