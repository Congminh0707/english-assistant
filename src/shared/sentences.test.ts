import { describe, expect, it } from 'vitest'
import {
  ensureTerminalPunctuation,
  groupSentences,
  looksVietnamese,
  splitSentences
} from './sentences'

describe('splitSentences', () => {
  it('tách theo dấu kết thúc câu', () => {
    expect(splitSentences('Hello there. How are you? I am fine!')).toEqual([
      'Hello there.',
      'How are you?',
      'I am fine!'
    ])
  })

  it('không tách ở từ viết tắt và chữ cái đơn', () => {
    expect(splitSentences('Mr. Smith lives in the U.S. now. He likes it.')).toEqual([
      'Mr. Smith lives in the U.S. now.',
      'He likes it.'
    ])
  })

  it('gộp khoảng trắng/xuống dòng, bỏ chuỗi rỗng', () => {
    expect(splitSentences('  One.\n\n  Two.  ')).toEqual(['One.', 'Two.'])
    expect(splitSentences('   ')).toEqual([])
  })

  it('cắt câu quá dài ở dấu phẩy gần nhất', () => {
    const long = `${'word '.repeat(30).trim()}, ${'more '.repeat(30).trim()}.`
    const parts = splitSentences(long)
    expect(parts.length).toBeGreaterThan(1)
    expect(parts.every((p) => p.length <= 260)).toBe(true)
    expect(parts.join(' ').replace(/\s+/g, ' ')).toBe(long.replace(/\s+/g, ' '))
  })
})

describe('looksVietnamese', () => {
  it('nhận chữ có dấu tiếng Việt', () => {
    expect(looksVietnamese('Tôi đang học tiếng Anh')).toBe(true)
    expect(looksVietnamese('I am learning English')).toBe(false)
  })
})

describe('ensureTerminalPunctuation', () => {
  it('thêm dấu chấm khi câu không có dấu kết thúc', () => {
    expect(ensureTerminalPunctuation('Cant delete a workshop')).toBe('Cant delete a workshop.')
    expect(ensureTerminalPunctuation('  Hello ')).toBe('Hello.')
  })

  it('giữ nguyên câu đã có dấu kết thúc (kể cả sau ngoặc/nháy)', () => {
    expect(ensureTerminalPunctuation('Is it done?')).toBe('Is it done?')
    expect(ensureTerminalPunctuation('She said "go!"')).toBe('She said "go!"')
    expect(ensureTerminalPunctuation('Wait…')).toBe('Wait…')
  })
})

describe('groupSentences', () => {
  it('gom câu liên tiếp thành nhóm không vượt giới hạn; câu quá dài đứng riêng', () => {
    const sentences = ['One two three.', 'Four five six.', 'Seven eight nine.', 'Ten.']
    expect(groupSentences(sentences, 32)).toEqual([
      'One two three. Four five six.',
      'Seven eight nine. Ten.'
    ])
    expect(groupSentences(sentences, 1000)).toEqual([sentences.join(' ')])
    expect(groupSentences(['A very long sentence indeed.', 'Short.'], 10)).toEqual([
      'A very long sentence indeed.',
      'Short.'
    ])
    expect(groupSentences([], 100)).toEqual([])
  })
})
