import { describe, expect, it } from 'vitest'
import { cefrLabel, estimateLevel, nextLevelIndex } from './placement'

describe('placement', () => {
  it('lên/xuống một bậc và không vượt hai đầu thang', () => {
    expect(nextLevelIndex(4, true)).toBe(5)
    expect(nextLevelIndex(4, false)).toBe(3)
    expect(nextLevelIndex(11, true)).toBe(11)
    expect(nextLevelIndex(0, false)).toBe(0)
  })

  it('ước lượng quanh bậc dao động, bỏ qua giai đoạn khởi động', () => {
    // Khởi động đi từ A2.1 lên B1.2, rồi dao động quanh bậc 7–8
    const asked = [4, 5, 6, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7]
    expect(estimateLevel(asked, 7)).toBe('B1_2')
    // Toàn đúng → lên tới C2
    const perfect = Array.from({ length: 20 }, (_, i) => Math.min(11, 4 + i))
    expect(estimateLevel(perfect, 11)).toBe('C2')
    // Toàn sai → Pre-A1
    const none = Array.from({ length: 20 }, (_, i) => Math.max(0, 4 - i))
    expect(estimateLevel(none, 0)).toBe('PA1_1')
  })

  it('bài ngắn (kết thúc sớm) vẫn ước lượng được', () => {
    expect(estimateLevel([4, 5], 6)).toBe('A2_2')
  })

  it('nhãn CEFR', () => {
    expect(cefrLabel('A2_1')).toBe('A2')
    expect(cefrLabel('PA1_2')).toBe('Pre-A1')
    expect(cefrLabel('C1')).toBe('C1')
  })
})
