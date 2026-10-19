import { describe, expect, it } from 'vitest'
import { isGapCorrect, normalizeAnswer, parseInline, parseMd } from './lessonText'

describe('parseInline', () => {
  it('tách chữ thường, đậm và cụm tiếng Anh', () => {
    expect(parseInline('Dùng **am** với `I` nhé')).toEqual([
      { kind: 'text', text: 'Dùng ' },
      { kind: 'bold', text: 'am' },
      { kind: 'text', text: ' với ' },
      { kind: 'code', text: 'I' },
      { kind: 'text', text: ' nhé' }
    ])
    expect(parseInline('thuần chữ')).toEqual([{ kind: 'text', text: 'thuần chữ' }])
  })
})

describe('parseMd', () => {
  it('đoạn văn, danh sách, và gộp dòng liền nhau trong một đoạn', () => {
    const blocks = parseMd('Mở đầu\ntiếp tục.\n\n- ý **một**\n- ý hai\n\nKết.')
    expect(blocks).toHaveLength(3)
    expect(blocks[0]).toEqual({ kind: 'p', inline: [{ kind: 'text', text: 'Mở đầu tiếp tục.' }] })
    expect(blocks[1]).toMatchObject({ kind: 'ul' })
    expect((blocks[1] as { items: unknown[] }).items).toHaveLength(2)
    expect(blocks[2]).toMatchObject({ kind: 'p' })
  })

  it('đoạn có cả câu dẫn và danh sách', () => {
    const blocks = parseMd('Gồm:\n- a\n- b')
    expect(blocks.map((b) => b.kind)).toEqual(['p', 'ul'])
  })
})

describe('chấm câu trả lời gõ tay', () => {
  it('bỏ qua hoa/thường, khoảng trắng, dấu câu cuối, nháy cong', () => {
    expect(normalizeAnswer('  Isn’t  it? ')).toBe("isn't it")
    expect(isGapCorrect(' IS ', ['is'])).toBe(true)
    expect(isGapCorrect('isn’t', ["isn't", 'is not'])).toBe(true)
    expect(isGapCorrect('are', ['is'])).toBe(false)
    expect(isGapCorrect('', ['is'])).toBe(false)
  })
})
