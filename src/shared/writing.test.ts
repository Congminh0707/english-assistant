import { describe, expect, it } from 'vitest'
import { translateVerdict, WRITE_PASS, writeLength, writeVerdict } from './writing'

describe('translateVerdict', () => {
  it('khớp đáp án mẫu → đúng, không cần AI (bỏ qua kết quả AI nếu có)', () => {
    expect(translateVerdict(true, null)).toEqual({ correct: true, gradedBy: 'match' })
    expect(translateVerdict(true, { ok: false })).toEqual({ correct: true, gradedBy: 'match' })
  })
  it('không khớp → theo AI', () => {
    expect(translateVerdict(false, { ok: true })).toEqual({ correct: true, gradedBy: 'ai' })
    expect(translateVerdict(false, { ok: false })).toEqual({ correct: false, gradedBy: 'ai' })
  })
  it('không khớp, không có AI → sai', () => {
    expect(translateVerdict(false, null)).toEqual({ correct: false, gradedBy: 'local' })
  })
})

describe('writeVerdict', () => {
  it('có AI: đạt khi overall ≥ WRITE_PASS', () => {
    expect(WRITE_PASS).toBe(60)
    expect(writeVerdict(50, 20, { overall: 60 })).toBe(true)
    expect(writeVerdict(50, 20, { overall: 59 })).toBe(false)
  })
  it('không có AI: đạt khi đủ số từ tối thiểu', () => {
    expect(writeVerdict(20, 20, null)).toBe(true)
    expect(writeVerdict(19, 20, null)).toBe(false)
  })
})

describe('writeLength', () => {
  it('đếm từ và so với min/max', () => {
    expect(writeLength('one two three', 3)).toEqual({ words: 3, status: 'ok' })
    expect(writeLength('one two', 3)).toEqual({ words: 2, status: 'short' })
    expect(writeLength('a b c d e f', 3, 5)).toEqual({ words: 6, status: 'long' })
    expect(writeLength('   ', 1)).toEqual({ words: 0, status: 'short' })
  })
})
