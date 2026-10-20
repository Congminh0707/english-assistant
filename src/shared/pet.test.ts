import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  characterFromItem,
  CHARACTER_IDS,
  CHARACTERS,
  characterItemId,
  isCharacterItem,
  normalizeCharacterId
} from './characters'
import { ACCESSORIES } from './shop'
import {
  applyFood,
  decayStats,
  FOODS,
  levelFromTotalXp,
  MAX_OFFLINE_DECAY_HOURS,
  nextStage,
  PET_STAT_MAX,
  PET_STAT_MIN,
  stageForLevel,
  xpForNextLevel
} from './pet'

const HOUR = 3_600_000
const full = { hunger: 100, mood: 100, energy: 100 }

describe('decayStats', () => {
  it('giảm theo tốc độ "app đang mở" khi khoảng cách ngắn', () => {
    // 5 phút = 1/12 giờ: hunger -4/12, mood -3/12, energy -2/12
    const s = decayStats(full, 5 * 60_000)
    expect(s.hunger).toBeCloseTo(100 - 4 / 12)
    expect(s.mood).toBeCloseTo(100 - 3 / 12)
    expect(s.energy).toBeCloseTo(100 - 2 / 12)
  })

  it('dùng tốc độ "app tắt" khi khoảng cách dài và chỉ tính tối đa 24 giờ', () => {
    const oneDay = decayStats(full, MAX_OFFLINE_DECAY_HOURS * HOUR)
    const oneWeek = decayStats(full, 7 * 24 * HOUR)
    expect(oneDay.hunger).toBeCloseTo(100 - 24)
    expect(oneWeek).toEqual(oneDay)
    expect(oneDay.energy).toBe(100) // app tắt: năng lượng không giảm
  })

  it('không bao giờ xuống dưới sàn', () => {
    const s = decayStats({ hunger: 12, mood: 11, energy: 10 }, 24 * HOUR)
    expect(s.hunger).toBe(PET_STAT_MIN)
    expect(s.mood).toBe(PET_STAT_MIN)
    expect(s.energy).toBe(PET_STAT_MIN)
  })

  it('hệ số trẻ em làm giảm chậm một nửa', () => {
    const adult = decayStats(full, 5 * 60_000)
    const child = decayStats(full, 5 * 60_000, 0.5)
    expect(100 - child.hunger).toBeCloseTo((100 - adult.hunger) / 2)
  })
})

describe('applyFood', () => {
  it('cộng chỉ số nhưng không vượt tối đa', () => {
    const s = applyFood({ hunger: 90, mood: 50, energy: 50 }, FOODS['food:onigiri'])
    expect(s.hunger).toBe(PET_STAT_MAX)
    expect(s.mood).toBe(52)
  })
})

describe('level', () => {
  it('đường cong XP theo docs/06', () => {
    expect(xpForNextLevel(1)).toBe(50)
    expect(xpForNextLevel(5)).toBe(559)
    expect(xpForNextLevel(10)).toBe(1581)
  })

  it('quy đổi tổng XP ra level', () => {
    expect(levelFromTotalXp(0)).toEqual({ level: 1, xpInLevel: 0, xpForNext: 50 })
    expect(levelFromTotalXp(49).level).toBe(1)
    expect(levelFromTotalXp(50)).toEqual({ level: 2, xpInLevel: 0, xpForNext: 141 })
    expect(levelFromTotalXp(50 + 141 + 10)).toEqual({ level: 3, xpInLevel: 10, xpForNext: 260 })
  })

  it('giai đoạn tiến hoá', () => {
    expect(stageForLevel(1)).toBe('egg')
    expect(stageForLevel(2)).toBe('baby')
    expect(stageForLevel(10)).toBe('teen')
    expect(stageForLevel(25)).toBe('adult')
    expect(stageForLevel(50)).toBe('legend')
  })
})

describe('tiến hoá', () => {
  const BASE = resolve('src/renderer/mascot/assets/characters')
  const STAGES = ['egg', 'baby', 'teen', 'adult', 'legend'] as const

  it('mọi nhân vật × giai đoạn có sheet, metadata cùng bố cục và đủ phụ kiện', () => {
    const baby = JSON.parse(readFileSync(resolve(BASE, 'bi/baby/sheet.json'), 'utf8')) as {
      frameSize: { w: number; h: number }
      animations: Record<string, { frames: number[] }>
    }
    // Hoạt ảnh mà MascotBrain gọi phải có trong sheet
    for (const name of [
      'idle',
      'walk',
      'drag',
      'fall',
      'land',
      'happy',
      'eat',
      'sleep',
      'sad',
      'surprised',
      'angry',
      'love',
      'look',
      'wag',
      'yawn',
      'stretch',
      'wave',
      'dance',
      'spin',
      'think'
    ]) {
      expect(baby.animations[name], name).toBeDefined()
    }
    expect(baby.frameSize).toEqual({ w: 96, h: 96 })
    const accessories = Object.keys(ACCESSORIES).map((id) => id.split(':')[1])
    for (const char of CHARACTER_IDS) {
      for (const stage of STAGES) {
        const dir = resolve(BASE, char, stage)
        expect(existsSync(resolve(dir, 'sheet.png')), `${char}/${stage}`).toBe(true)
        const meta = JSON.parse(readFileSync(resolve(dir, 'sheet.json'), 'utf8')) as unknown
        expect(meta, `${char}/${stage}`).toEqual(baby)
        for (const acc of accessories) {
          const has =
            existsSync(resolve(dir, `acc-${acc}.png`)) ||
            existsSync(resolve(dir, `accb-${acc}.png`))
          expect(has, `${char}/${stage}/${acc}`).toBe(true)
        }
      }
    }
  })

  it('mốc level đổi giai đoạn theo thứ tự egg → baby → teen → adult → legend', () => {
    const seen = [1, 2, 10, 25, 50].map(stageForLevel)
    expect(seen).toEqual([...STAGES])
  })

  it('nextStage trả giai đoạn kế tiếp, null ở cuối', () => {
    expect(nextStage(1)).toEqual({ stage: 'baby', minLevel: 2 })
    expect(nextStage(10)).toEqual({ stage: 'adult', minLevel: 25 })
    expect(nextStage(50)).toBeNull()
  })
})

describe('nhân vật', () => {
  it('Bi có sẵn, các nhân vật khác có giá; id cũ placeholder và id lạ về Bi', () => {
    expect(CHARACTERS.bi.price).toBe(0)
    for (const id of CHARACTER_IDS.filter((c) => c !== 'bi'))
      expect(CHARACTERS[id].price).toBeGreaterThan(0)
    expect(normalizeCharacterId('placeholder')).toBe('bi')
    expect(normalizeCharacterId('draco')).toBe('draco')
    expect(normalizeCharacterId('???')).toBe('bi')
    expect(characterFromItem(characterItemId('kitsu'))).toBe('kitsu')
    expect(isCharacterItem('char:robo')).toBe(true)
    expect(isCharacterItem('char:nope')).toBe(false)
  })
})
