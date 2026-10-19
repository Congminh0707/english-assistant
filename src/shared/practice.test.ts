import { describe, expect, it } from 'vitest'
import { dictationAccuracy, isPermutation, normalizeWords, sameSentence } from './practice'

describe('practice helpers', () => {
  it('chuẩn hoá từ: hoa/thường, dấu câu, nháy cong', () => {
    expect(normalizeWords('  Hello,   World! ')).toEqual(['hello', 'world'])
    expect(normalizeWords('Don’t stop.')).toEqual(["don't", 'stop'])
  })

  it('so sánh câu bỏ qua hoa/thường và dấu câu', () => {
    expect(sameSentence('I like apples.', 'i like apples')).toBe(true)
    expect(sameSentence('I like apples.', 'I like pears')).toBe(false)
    expect(sameSentence('I like apples.', 'I like apples too')).toBe(false)
  })

  it('độ chính xác chép chính tả', () => {
    expect(dictationAccuracy('I have a dog', 'i have a dog.')).toBe(1)
    expect(dictationAccuracy('I have a dog', 'I have a cat')).toBeCloseTo(0.75)
    expect(dictationAccuracy('I have a dog', 'I have a big dog')).toBeCloseTo(0.8)
    expect(dictationAccuracy('I have a dog', '')).toBe(0)
  })

  it('kiểm tra hoán vị', () => {
    expect(isPermutation([2, 0, 1], 3)).toBe(true)
    expect(isPermutation([0, 0, 1], 3)).toBe(false)
    expect(isPermutation([0, 1], 3)).toBe(false)
  })
})
