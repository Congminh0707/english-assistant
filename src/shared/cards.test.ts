import { describe, expect, it } from 'vitest'
import {
  checkTyped,
  isPhraseId,
  makeCloze,
  normalizeAnswer,
  phraseContentId,
  phraseHash
} from './cards'

describe('makeCloze', () => {
  it('khoét từ cần học, giữ nguyên dạng trong câu', () => {
    expect(makeCloze('I want to learn English.', 'learn')).toEqual({
      before: 'I want to ',
      after: ' English.',
      answer: 'learn'
    })
    expect(makeCloze('She walked home yesterday.', 'walk')).toMatchObject({ answer: 'walked' })
    expect(makeCloze('He is running fast.', 'run')).toMatchObject({ answer: 'running' })
    expect(makeCloze('The babies are asleep.', 'baby')).toMatchObject({ answer: 'babies' })
    expect(makeCloze('They are making tea.', 'make')).toMatchObject({ answer: 'making' })
  })

  it('không phân biệt hoa/thường; câu không chứa từ → null', () => {
    expect(makeCloze('Time flies.', 'time')).toMatchObject({ answer: 'Time', before: '' })
    expect(makeCloze('I like tea.', 'coffee')).toBeNull()
  })
})

describe('checkTyped', () => {
  it('đúng sau khi chuẩn hoá, gần đúng khi sai một ký tự, sai còn lại', () => {
    expect(checkTyped('  Apple ', ['apple'])).toBe('correct')
    expect(checkTyped('apple!', ['apple'])).toBe('correct')
    expect(checkTyped('aple', ['apple'])).toBe('close')
    expect(checkTyped('cat', ['cot'])).toBe('wrong') // từ ngắn không cho sai chính tả
    expect(checkTyped('orange', ['apple'])).toBe('wrong')
    expect(checkTyped('', ['apple'])).toBe('wrong')
  })

  it('chấp nhận nhiều đáp án và bỏ qua dấu câu trong câu dài', () => {
    expect(checkTyped('went', ['go', 'went'])).toBe('correct')
    expect(checkTyped('Nice to meet you!', ['nice to meet you.'])).toBe('correct')
    expect(normalizeAnswer('Don’t  stop!')).toBe("don't stop")
  })
})

describe('id mẫu câu', () => {
  it('băm ổn định, không phân biệt hoa/thường và khoảng trắng đầu cuối', () => {
    expect(phraseHash('Hello!')).toBe(phraseHash('  hello! '))
    expect(phraseHash('Hello!')).not.toBe(phraseHash('Goodbye!'))
    expect(phraseHash('Hello!')).toMatch(/^[0-9a-f]{8}$/)
    const id = phraseContentId('greetings', 'Hello!')
    expect(id).toMatch(/^phrase:greetings:[0-9a-f]{8}$/)
    expect(isPhraseId(id)).toBe(true)
    expect(isPhraseId('word:en:go')).toBe(false)
  })
})
