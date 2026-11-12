import { describe, expect, it } from 'vitest'
import {
  bandDifficultyLevel,
  bandOfLevel,
  FREE_WRITING_BANDS,
  FREE_WRITING_LENGTHS,
  FREE_WRITING_MAX_CHARS,
  FREE_WRITING_RANGES,
  FREE_WRITING_REWARD_MIN_WORDS,
  lengthRange,
  lengthStatus,
  pickRandomTopic
} from './freeWriting'

describe('viết tự do: khoảng số từ', () => {
  it('mỗi bậc tăng dần ngắn < vừa < dài, nối liền nhau, mức dài nhất ≤ 300 từ', () => {
    for (const band of FREE_WRITING_BANDS) {
      const r = FREE_WRITING_RANGES[band]
      expect(r.short.min).toBeLessThan(r.short.max)
      expect(r.short.max).toBe(r.medium.min)
      expect(r.medium.max).toBe(r.long.min)
      expect(r.long.max).toBeLessThanOrEqual(300)
    }
    expect(lengthRange('B1', 'medium')).toEqual({ min: 90, max: 150 })
  })

  it('mức thưởng = mức ngắn thấp nhất; giới hạn ký tự đủ cho mức dài nhất (~7 ký tự/từ)', () => {
    const mins = FREE_WRITING_BANDS.map((b) => FREE_WRITING_RANGES[b].short.min)
    expect(FREE_WRITING_REWARD_MIN_WORDS).toBe(Math.min(...mins))
    const longest = Math.max(
      ...FREE_WRITING_BANDS.flatMap((b) =>
        FREE_WRITING_LENGTHS.map((l) => FREE_WRITING_RANGES[b][l].max)
      )
    )
    expect(FREE_WRITING_MAX_CHARS).toBeGreaterThanOrEqual(longest * 7)
  })

  it('lengthStatus', () => {
    expect(lengthStatus(10, { min: 20, max: 40 })).toBe('short')
    expect(lengthStatus(20, { min: 20, max: 40 })).toBe('ok')
    expect(lengthStatus(41, { min: 20, max: 40 })).toBe('long')
  })
})

describe('viết tự do: bậc mặc định theo trình độ', () => {
  it('PA1/A1 → A1, A2 → A2, B1 → B1, B2/C1/C2 → B2', () => {
    expect(bandOfLevel('PA1_1')).toBe('A1')
    expect(bandOfLevel('A1_2')).toBe('A1')
    expect(bandOfLevel('A2_1')).toBe('A2')
    expect(bandOfLevel('B1_2')).toBe('B1')
    expect(bandOfLevel('B2_1')).toBe('B2')
    expect(bandOfLevel('C2')).toBe('B2')
  })
})

describe('viết tự do: độ khó Elo theo bậc đề', () => {
  it('bậc con đầu của bậc CEFR, nằm trong đúng bậc đó', () => {
    expect(FREE_WRITING_BANDS.map(bandDifficultyLevel)).toEqual(['A1_1', 'A2_1', 'B1_1', 'B2_1'])
    for (const band of FREE_WRITING_BANDS) expect(bandOfLevel(bandDifficultyLevel(band))).toBe(band)
  })
})

describe('viết tự do: đề ngẫu nhiên', () => {
  const topics = [
    { id: 'a', band: 'A1' as const },
    { id: 'b', band: 'A1' as const },
    { id: 'c', band: 'A2' as const }
  ]
  it('chỉ lấy đề cùng bậc và khác đề đang chọn', () => {
    for (const r of [0, 0.5, 0.99]) {
      expect(pickRandomTopic(topics, 'A1', 'a', () => r)?.id).toBe('b')
    }
  })
  it('bậc chỉ có một đề → trả chính đề đó; không có đề → null', () => {
    expect(pickRandomTopic(topics, 'A2', 'c')?.id).toBe('c')
    expect(pickRandomTopic(topics, 'B2', null)).toBeNull()
  })
})
