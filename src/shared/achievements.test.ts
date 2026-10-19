import { describe, expect, it } from 'vitest'
import { GLYPHS } from './badgeArt'
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_GROUPS,
  evaluateAchievements,
  type AchievementInput
} from './achievements'

const ZERO: AchievementInput = {
  longestStreak: 0,
  reviews: 0,
  savedWords: 0,
  practiceSessions: 0,
  lessonsCompleted: 0,
  perfectLessons: 0,
  activeDays: 0,
  xp: 0,
  retentionPercent: 0
}

describe('evaluateAchievements', () => {
  it('chưa làm gì → không mở khoá thành tựu nào', () => {
    const list = evaluateAchievements(ZERO)
    expect(list).toHaveLength(ACHIEVEMENTS.length)
    expect(list.every((a) => !a.unlocked && a.current === 0)).toBe(true)
  })

  it('mở khoá khi đạt ngưỡng, chặn tiến độ ở target', () => {
    const list = evaluateAchievements({ ...ZERO, longestStreak: 8, reviews: 99, savedWords: 250 })
    const byId = Object.fromEntries(list.map((a) => [a.id, a]))
    expect(byId.streak3.unlocked).toBe(true)
    expect(byId.streak7.unlocked).toBe(true)
    expect(byId.streak14).toMatchObject({ unlocked: false, current: 8, target: 14 })
    expect(byId.reviews100).toMatchObject({ unlocked: false, current: 99 })
    expect(byId.words100).toMatchObject({ unlocked: true, current: 100 })
    expect(byId.words500).toMatchObject({ unlocked: false, current: 250 })
  })

  it('tỉ lệ nhớ và điểm tuyệt đối cũng mở khoá', () => {
    const byId = Object.fromEntries(
      evaluateAchievements({ ...ZERO, retentionPercent: 93, perfectLessons: 1, xp: 600 }).map(
        (a) => [a.id, a]
      )
    )
    expect(byId.memory90.unlocked).toBe(true)
    expect(byId.perfect1.unlocked).toBe(true)
    expect(byId.xp500.unlocked).toBe(true)
    expect(byId.xp2500.unlocked).toBe(false)
  })

  it('id không trùng, đủ nhiều, mỗi nhóm tăng dần theo ngưỡng và có biểu tượng', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(30)
    for (const group of ACHIEVEMENT_GROUPS) {
      const items = ACHIEVEMENTS.filter((a) => a.group === group)
      expect(items.length, group).toBeGreaterThan(0)
      const targets = items.map((a) => a.target)
      expect(targets).toEqual([...targets].sort((x, y) => x - y))
      expect(GLYPHS[items[0].glyph], group).toBeDefined()
    }
  })
})
