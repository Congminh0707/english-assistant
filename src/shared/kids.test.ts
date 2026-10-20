import { describe, expect, it } from 'vitest'
import {
  KIDS_FAST_MS,
  KIDS_PICTURE_ORDER,
  isPictureContentId,
  pickChoices,
  pictureContentId,
  pictureIdOf,
  ratingFromTries
} from './kids'
import { PICTURE_IDS } from './pictures'

describe('kids', () => {
  it('id thẻ hình', () => {
    expect(pictureContentId('dog')).toBe('pic:dog')
    expect(isPictureContentId('pic:dog')).toBe(true)
    expect(isPictureContentId('word:en:dog')).toBe(false)
    expect(pictureIdOf('pic:dog')).toBe('dog')
  })

  it('thứ tự học gồm đủ mọi hình đúng một lần, vật quen thuộc trước', () => {
    expect([...KIDS_PICTURE_ORDER].sort()).toEqual([...PICTURE_IDS].sort())
    expect(KIDS_PICTURE_ORDER.slice(0, 3)).toEqual(['dog', 'cat', 'apple'])
  })

  it('chấm theo số lần thử', () => {
    expect(ratingFromTries(1, KIDS_FAST_MS)).toBe(4)
    expect(ratingFromTries(1, KIDS_FAST_MS + 1)).toBe(3)
    expect(ratingFromTries(2, 100)).toBe(2)
    expect(ratingFromTries(0, 100)).toBe(1)
  })

  it('chọn lựa chọn: có đáp án, không trùng, đủ số lượng, ưu tiên hình đã học', () => {
    const choices = pickChoices('dog', ['cat', 'apple'], 3, () => 0.4)
    expect(choices).toHaveLength(3)
    expect(new Set(choices).size).toBe(3)
    expect(choices).toContain('dog')
    expect(choices.filter((c) => c !== 'dog').sort()).toEqual(['apple', 'cat'])
    // Chưa học hình nào khác → lấy từ cả bộ
    const fresh = pickChoices('dog', [], 3)
    expect(new Set(fresh).size).toBe(3)
    expect(fresh).toContain('dog')
  })
})
