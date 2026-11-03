import { describe, expect, it } from 'vitest'
import {
  buildMemoryDeck,
  buildRound,
  buildRounds,
  gamePool,
  shuffle,
  starsFor,
  type GameWord
} from './gameLogic'

const word = (id: string): GameWord => ({ pictureId: id, word: id, vi: id })
const pool = ['cat', 'dog', 'cow', 'pig', 'hen', 'fox', 'owl'].map(word)

describe('gameLogic', () => {
  it('shuffle giữ nguyên phần tử và không đổi mảng gốc', () => {
    const src = [1, 2, 3, 4, 5]
    const out = shuffle(src)
    expect([...out].sort()).toEqual(src)
    expect(src).toEqual([1, 2, 3, 4, 5])
  })

  it('gamePool ưu tiên từ đã dán, bù cho đủ 6', () => {
    const stickers = pool.map((w, i) => ({ ...w, earned: i === 3 }))
    const out = gamePool(stickers)
    expect(out).toHaveLength(6)
    expect(out[0].pictureId).toBe('pig')
  })

  it('gamePool chỉ dùng từ đã dán khi đủ nhiều', () => {
    const stickers = pool.map((w, i) => ({ ...w, earned: i < 6 }))
    expect(gamePool(stickers).map((w) => w.pictureId)).not.toContain('owl')
  })

  it('bộ bài ghép cặp: mỗi từ đúng hai lá, khoá không trùng', () => {
    const deck = buildMemoryDeck(pool, 4)
    expect(deck).toHaveLength(8)
    expect(new Set(deck.map((c) => c.key)).size).toBe(8)
    const counts = new Map<string, number>()
    for (const c of deck) counts.set(c.pictureId, (counts.get(c.pictureId) ?? 0) + 1)
    expect([...counts.values()].every((n) => n === 2)).toBe(true)
  })

  it('vòng chọn hình có đáp án đúng, không trùng hình', () => {
    const r = buildRound(pool, pool[0], 4)
    expect(r.choices).toHaveLength(4)
    expect(r.choices.some((c) => c.pictureId === 'cat')).toBe(true)
    expect(new Set(r.choices.map((c) => c.pictureId)).size).toBe(4)
  })

  it('buildRounds mỗi vòng một đáp án khác nhau', () => {
    const rs = buildRounds(pool, 5, 3)
    expect(new Set(rs.map((r) => r.target.pictureId)).size).toBe(5)
  })

  it('starsFor: luôn ≥ 1 sao', () => {
    expect(starsFor(5, 5)).toBe(3)
    expect(starsFor(3, 5)).toBe(2)
    expect(starsFor(0, 5)).toBe(1)
  })
})
