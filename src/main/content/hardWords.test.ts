import { describe, expect, it } from 'vitest'
import type { LevelCode } from '@shared/schemas/content/level'
import { AUTO_SAVE_MAX, pickHardWords } from './hardWords'

/** Từ điển giả: từ → { id, level }; dạng biến tố trỏ về cùng id với từ gốc */
const DICT: Record<string, { id: string; level: LevelCode }> = {
  cat: { id: 'word:en:cat', level: 'A1_1' },
  journey: { id: 'word:en:journey', level: 'B1_1' },
  ancient: { id: 'word:en:ancient', level: 'B1_2' },
  temple: { id: 'word:en:temple', level: 'B1_1' },
  wander: { id: 'word:en:wander', level: 'B2_1' },
  wandered: { id: 'word:en:wander', level: 'B2_1' },
  hue: { id: 'word:en:hue', level: 'C1' },
  "o'clock": { id: 'word:en:oclock', level: 'B1_1' }
}
const lookup = (w: string): { id: string; level: LevelCode } | undefined => DICT[w]

describe('pickHardWords', () => {
  it('giữ từ trên level theo thứ tự xuất hiện, kèm câu đầu tiên chứa từ', () => {
    const out = pickHardWords(
      [
        'The cat starts a journey. It sees an ancient temple.',
        'The journey is long. The cat wanders, then it wandered home.'
      ],
      lookup,
      'A2_1',
      new Set()
    )
    expect(out).toEqual([
      { text: 'journey', context: 'The cat starts a journey.' },
      { text: 'ancient', context: 'It sees an ancient temple.' },
      { text: 'temple', context: 'It sees an ancient temple.' },
      { text: 'wandered', context: 'The cat wanders, then it wandered home.' }
    ])
  })

  it('bỏ tên riêng, từ đã có trong sổ (theo id) và gộp dạng biến tố cùng id', () => {
    const out = pickHardWords(
      ['We visited Hue last year. The temple was old.', 'I wandered and wander again.'],
      lookup,
      'A2_1',
      new Set(['word:en:temple'])
    )
    // Hue là tên riêng (giữa câu, viết hoa) → không lấy dù 'hue' có trong từ điển
    expect(out).toEqual([{ text: 'wandered', context: 'I wandered and wander again.' }])
  })

  it('chuẩn hoá nháy cong, tối đa AUTO_SAVE_MAX từ', () => {
    expect(pickHardWords(['It is six o’clock.'], lookup, 'A2_1', new Set())).toEqual([
      { text: "o'clock", context: 'It is six o’clock.' }
    ])
    const many: Record<string, { id: string; level: LevelCode }> = {}
    const words = Array.from({ length: 12 }, (_, i) => `word${String.fromCharCode(97 + i)}`)
    for (const w of words) many[w] = { id: `word:en:${w}`, level: 'C1' }
    const out = pickHardWords([`${words.join(' ')}.`], (w) => many[w], 'A2_1', new Set())
    expect(AUTO_SAVE_MAX).toBe(8)
    expect(out.map((x) => x.text)).toEqual(words.slice(0, 8))
  })
})
