import { describe, expect, it } from 'vitest'
import {
  applyFood,
  decayStats,
  FOODS,
  levelFromTotalXp,
  MAX_OFFLINE_DECAY_HOURS,
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
