import { describe, expect, it } from 'vitest'
import { editDistance, suggestSpelling, type SpellingCandidate } from './spelling'

const c = (text: string, rank: number | null = null, lemma = text): SpellingCandidate => ({
  text,
  lemma,
  rank
})

describe('editDistance', () => {
  it('đếm thêm/xoá/thay và đảo hai ký tự liền kề là 1', () => {
    expect(editDistance('registation', 'registration', 2)).toBe(1)
    expect(editDistance('recieve', 'receive', 2)).toBe(1)
    expect(editDistance('cat', 'cart', 2)).toBe(1)
    expect(editDistance('abc', 'xyz', 2)).toBe(3)
    expect(editDistance('a', 'abcd', 2)).toBe(3)
  })
})

describe('suggestSpelling', () => {
  const list = [
    c('registration', 900),
    c('registrations', 5000, 'registration'),
    c('registry', 7000),
    c('receive', 600),
    c('receipt', 1500),
    c('cart', 300),
    c('cat', 100)
  ]

  it('gợi ý từ gõ sai, từ gần nhất và phổ biến nhất lên trước', () => {
    expect(suggestSpelling('Registation', list)).toEqual(['registration'])
    expect(suggestSpelling('recieve', list)).toEqual(['receive'])
  })

  it('từ ngắn chỉ cho sai 1 ký tự; không gợi ý khi là từ có thật hoặc không phải chữ cái', () => {
    expect(suggestSpelling('cax', list)).toEqual(['cat'])
    expect(suggestSpelling('cat', list)).toEqual(['cart'])
    expect(suggestSpelling('xyzzy', list)).toEqual([])
    expect(suggestSpelling('táo', list)).toEqual([])
    expect(suggestSpelling('ab', list)).toEqual([])
  })
})
