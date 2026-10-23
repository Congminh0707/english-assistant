import { describe, expect, it } from 'vitest'
import {
  ALL_PICTURE_IDS,
  PICTURE_IDS,
  PICTURE_WORDS,
  PICTURE_SIZE,
  pictureFor,
  picturePixels,
  pictureRects,
  splitLeadingPicture
} from './pictures'

describe('pictures', () => {
  it('đủ hình và mỗi hình vẽ được, nằm trong lưới, có nhiều ô màu', () => {
    expect(PICTURE_IDS.length).toBeGreaterThanOrEqual(60)
    for (const id of PICTURE_IDS) {
      const pixels = picturePixels(id)
      expect(pixels.length, id).toBeGreaterThan(150)
      for (const p of pixels) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThan(PICTURE_SIZE)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeLessThan(PICTURE_SIZE)
        expect(p.color).toMatch(/^#[0-9a-f]{6}$/)
      }
      expect(pictureRects(id).length, id).toBeLessThan(pixels.length)
    }
  })

  it('các hình khác nhau cho kết quả khác nhau', () => {
    const serial = (id: string): string =>
      picturePixels(id)
        .map((p) => `${p.x},${p.y},${p.color}`)
        .join(';')
    expect(new Set(PICTURE_IDS.map(serial)).size).toBe(PICTURE_IDS.length)
  })

  it('đổi emoji sang hình, bỏ ký tự biến thể; tách emoji đứng đầu chuỗi', () => {
    expect(pictureFor('🐶')).toBe('dog')
    expect(pictureFor('✏️')).toBe('pencil') // có U+FE0F
    expect(pictureFor('dog')).toBe('dog')
    expect(pictureFor('🦄')).toBeUndefined()
    expect(splitLeadingPicture('🐶 dog')).toEqual({ picture: 'dog', rest: 'dog' })
    expect(splitLeadingPicture('☂️ umbrella')).toEqual({ picture: 'umbrella', rest: 'umbrella' })
    expect(splitLeadingPicture('hello')).toEqual({ rest: 'hello' })
  })

  it('mọi emoji dùng trong nội dung bài học đều có hình', () => {
    // Bài "Từ vựng bằng hình" dùng emoji; đổi sang hình pixel không được sót hình nào
    const used = [
      '🐶',
      '🍎',
      '🍌',
      '🍞',
      '📚',
      '✏️',
      '🎒',
      '⌚',
      '📱',
      '💻',
      '🔑',
      '🪑',
      '🛏️',
      '☂️',
      '🥭',
      '🧀'
    ]
    for (const e of used) expect(pictureFor(e), e).toBeDefined()
  })

  it('mỗi hình đều có từ tiếng Anh và nghĩa tiếng Việt cho bộ thẻ của trẻ', () => {
    for (const id of ALL_PICTURE_IDS) {
      expect(PICTURE_WORDS[id], id).toBeDefined()
      expect(PICTURE_WORDS[id].en.length).toBeGreaterThan(0)
      expect(PICTURE_WORDS[id].vi.length).toBeGreaterThan(0)
    }
    expect(Object.keys(PICTURE_WORDS).length).toBe(ALL_PICTURE_IDS.length)
  })
})
