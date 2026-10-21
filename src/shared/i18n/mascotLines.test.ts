import { describe, expect, it } from 'vitest'
import { CHARACTER_IDS } from '../characters'
import { messages } from './index'

type Lines = Record<string, unknown>

// Chủ đề mà mascot (renderer/mascot/App.vue) gọi: mỗi nhân vật nên có câu thoại riêng cho các chủ đề này
const TOPICS = [
  'greetingMorning',
  'greetingAfternoon',
  'greetingEvening',
  'greetingNight',
  'pat',
  'hungry',
  'fed',
  'levelUp',
  'wake',
  'missionDone',
  'evolved',
  'idle'
]

describe('câu thoại mascot', () => {
  for (const lang of ['vi', 'en'] as const) {
    const mascot = messages[lang].mascot as unknown as {
      lines: Lines
      chars: Record<string, Lines>
    }

    it(`${lang}: mỗi nhân vật có ≥ 3 câu riêng cho mọi chủ đề`, () => {
      for (const id of CHARACTER_IDS) {
        for (const topic of TOPICS) {
          const list = mascot.chars[id]?.[topic]
          expect(Array.isArray(list) && list.length >= 3, `${id}.${topic}`).toBe(true)
        }
      }
    })

    it(`${lang}: câu thoại chung của mọi chủ đề không rỗng`, () => {
      for (const topic of TOPICS) {
        const list = mascot.lines[topic]
        expect(Array.isArray(list) && list.length > 0, topic).toBe(true)
      }
    })
  }
})
