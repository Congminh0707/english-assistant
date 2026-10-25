import { describe, expect, it } from 'vitest'
import { tokenizeWords } from './properNouns'

const proper = (s: string): string[] =>
  tokenizeWords(s)
    .filter((t) => t.proper)
    .map((t) => t.text)

describe('tokenizeWords', () => {
  it('tên riêng giữa câu', () => {
    expect(proper('We live in a small house in Hue.')).toEqual(['Hue'])
    expect(proper('She was born in Da Nang, Vietnam.')).toEqual(['Da', 'Nang', 'Vietnam'])
  })

  it('chữ đầu câu đơn lẻ là từ thường', () => {
    expect(proper('Hue is a colour.')).toEqual([])
    expect(proper('The cat sleeps.')).toEqual([])
  })

  it('đầu câu nhưng đi liền chữ viết hoa khác → tên riêng', () => {
    expect(proper('Da Nang is beautiful.')).toEqual(['Da', 'Nang'])
  })

  it('"I" và I\'m không phải tên riêng', () => {
    expect(proper("Yesterday I said I'm tired.")).toEqual([])
  })

  it('từ viết tắt viết hoa toàn bộ', () => {
    expect(proper('He studies for the TOEIC test.')).toEqual(['TOEIC'])
  })

  it('đầu mệnh đề sau ngoặc kép / dấu hai chấm', () => {
    expect(proper('He said, "Hello there."')).toEqual([])
    expect(proper('Remember: Always smile.')).toEqual([])
  })

  it('tiêu đề viết hoa từng chữ không bị coi là tên riêng', () => {
    expect(proper('Good Morning My Dear Friends')).toEqual([])
  })
})
