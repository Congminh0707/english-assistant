// Thành tựu: tính thuần từ số liệu thống kê (không có bảng riêng) — dùng ở main, renderer và test.
import type { BadgeTier } from './badgeArt'

/** Số liệu đầu vào để xét thành tựu */
export interface AchievementInput {
  longestStreak: number
  reviews: number
  savedWords: number
  practiceSessions: number
  lessonsCompleted: number
  /** Số bài học đạt điểm tuyệt đối (100) */
  perfectLessons: number
  activeDays: number
  xp: number
  /** Tỉ lệ nhớ (0–100), chỉ tính khi đã ôn đủ MIN_REVIEWS_FOR_RETENTION lượt, ngược lại 0 */
  retentionPercent: number
}

/** Cần ôn ít nhất chừng này lượt thì tỉ lệ nhớ mới được tính cho thành tựu */
export const MIN_REVIEWS_FOR_RETENTION = 100

export type AchievementGroup =
  'streak' | 'reviews' | 'words' | 'practice' | 'lessons' | 'perfect' | 'days' | 'xp' | 'memory'

export interface AchievementDef {
  /** Khoá i18n: study.stats.ach.<id> (tên) */
  id: string
  group: AchievementGroup
  /** Biểu tượng trong badgeArt.GLYPHS */
  glyph: string
  tier: BadgeTier
  value: (input: AchievementInput) => number
  target: number
}

type Metric = (input: AchievementInput) => number

const GROUPS: Record<AchievementGroup, { glyph: string; value: Metric }> = {
  streak: { glyph: 'flame', value: (i) => i.longestStreak },
  reviews: { glyph: 'cards', value: (i) => i.reviews },
  words: { glyph: 'book', value: (i) => i.savedWords },
  practice: { glyph: 'target', value: (i) => i.practiceSessions },
  lessons: { glyph: 'cap', value: (i) => i.lessonsCompleted },
  perfect: { glyph: 'star', value: (i) => i.perfectLessons },
  days: { glyph: 'calendar', value: (i) => i.activeDays },
  xp: { glyph: 'bolt', value: (i) => i.xp },
  memory: { glyph: 'heart', value: (i) => i.retentionPercent }
}

/** [nhóm, ngưỡng, hạng] — id = nhóm + ngưỡng */
const TABLE: ReadonlyArray<readonly [AchievementGroup, number, BadgeTier]> = [
  ['streak', 3, 'bronze'],
  ['streak', 7, 'silver'],
  ['streak', 14, 'silver'],
  ['streak', 30, 'gold'],
  ['streak', 100, 'diamond'],
  ['reviews', 100, 'bronze'],
  ['reviews', 500, 'silver'],
  ['reviews', 1000, 'gold'],
  ['reviews', 5000, 'diamond'],
  ['words', 10, 'bronze'],
  ['words', 50, 'silver'],
  ['words', 100, 'gold'],
  ['words', 500, 'diamond'],
  ['practice', 1, 'bronze'],
  ['practice', 10, 'silver'],
  ['practice', 50, 'gold'],
  ['practice', 100, 'diamond'],
  ['lessons', 1, 'bronze'],
  ['lessons', 5, 'silver'],
  ['lessons', 20, 'gold'],
  ['lessons', 30, 'diamond'],
  ['perfect', 1, 'bronze'],
  ['perfect', 10, 'silver'],
  ['perfect', 30, 'gold'],
  ['days', 7, 'bronze'],
  ['days', 30, 'silver'],
  ['days', 100, 'gold'],
  ['xp', 500, 'bronze'],
  ['xp', 2500, 'silver'],
  ['xp', 10000, 'gold'],
  ['xp', 50000, 'diamond'],
  ['memory', 90, 'gold']
]

/** Thưởng khi mở khoá, theo hạng */
export const ACHIEVEMENT_REWARDS: Record<BadgeTier, { xp: number; coins: number }> = {
  bronze: { xp: 20, coins: 5 },
  silver: { xp: 50, coins: 10 },
  gold: { xp: 120, coins: 25 },
  diamond: { xp: 300, coins: 60 }
}

export const ACHIEVEMENTS: readonly AchievementDef[] = TABLE.map(([group, target, tier]) => ({
  id: `${group}${target}`,
  group,
  glyph: GROUPS[group].glyph,
  tier,
  value: GROUPS[group].value,
  target
}))

/** Thứ tự nhóm hiển thị */
export const ACHIEVEMENT_GROUPS = Object.keys(GROUPS) as AchievementGroup[]

export interface AchievementState {
  id: string
  group: AchievementGroup
  glyph: string
  tier: BadgeTier
  /** Tiến độ hiện tại, đã chặn trên bằng target */
  current: number
  target: number
  unlocked: boolean
}

export function evaluateAchievements(input: AchievementInput): AchievementState[] {
  return ACHIEVEMENTS.map((def) => {
    const value = Math.max(0, Math.round(def.value(input)))
    return {
      id: def.id,
      group: def.group,
      glyph: def.glyph,
      tier: def.tier,
      current: Math.min(value, def.target),
      target: def.target,
      unlocked: value >= def.target
    }
  })
}
