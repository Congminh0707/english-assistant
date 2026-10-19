import { describe, expect, it } from 'vitest'
import {
  activityLevel,
  activityScore,
  addDays,
  dayRange,
  longestStreak,
  weekdayIndex
} from './stats'

describe('stats helpers', () => {
  it('cộng ngày qua ranh giới tháng/năm', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('dãy ngày liên tiếp, cũ nhất trước', () => {
    expect(dayRange('2026-03-03', 3)).toEqual(['2026-03-01', '2026-03-02', '2026-03-03'])
  })

  it('chuỗi ngày dài nhất, bỏ trùng và không cần đã sắp xếp', () => {
    expect(longestStreak([])).toBe(0)
    expect(
      longestStreak(['2026-03-05', '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-03'])
    ).toBe(3)
    expect(longestStreak(['2026-03-01', '2026-03-03', '2026-03-05'])).toBe(1)
  })

  it('thứ trong tuần: Thứ Hai = 0, Chủ Nhật = 6', () => {
    expect(weekdayIndex('2026-10-19')).toBe(0) // thứ Hai
    expect(weekdayIndex('2026-10-25')).toBe(6) // Chủ Nhật
  })

  it('mức đậm và điểm hoạt động', () => {
    expect(activityLevel(0)).toBe(0)
    expect(activityLevel(3)).toBe(1)
    expect(activityLevel(10)).toBe(2)
    expect(activityLevel(25)).toBe(3)
    expect(activityLevel(100)).toBe(4)
    expect(activityScore({ reviews: 10, saved: 3, practice: 1 })).toBe(21)
  })
})
