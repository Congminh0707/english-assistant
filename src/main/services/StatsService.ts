import { dayRange, longestStreak } from '@shared/stats'
import type { Stats, StatsDay } from '@shared/schemas/stats'
import type { Clock } from '../core/Clock'
import { localDayKey, localOffsetSeconds } from '../core/localDay'
import type { DictionaryService } from '../content/DictionaryService'
import type { VocabRepository } from '../db/repositories/VocabRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { ProfileService } from './ProfileService'
import { computeStreak } from './StudyService'

/** Số ngày trong lịch hoạt động: 16 tuần */
export const STATS_DAYS = 112
const DAY_MS = 86_400_000
const STATE_NAMES = ['new', 'learning', 'review', 'relearning'] as const

/**
 * Thống kê học tập: lịch hoạt động theo ngày, streak, tỉ lệ nhớ, thẻ theo trạng thái, từ theo level.
 * Tính trực tiếp từ nhật ký ôn (srs_reviews) và sổ XP — không có bảng thống kê riêng.
 */
export class StatsService {
  constructor(
    private readonly deps: {
      vocab: VocabRepository
      xpRepo: XpRepository
      dictionary: DictionaryService
      profiles: ProfileService
      clock: Clock
    }
  ) {}

  stats(): Stats {
    const { vocab, xpRepo, dictionary, profiles, clock } = this.deps
    const profileId = profiles.activeId()
    const now = clock.now()
    const tz = localOffsetSeconds(now)
    const today = localDayKey(now)
    // Lấy dư một ngày để không sót ngày đầu cửa sổ khi đổi giờ mùa hè
    const since = now - (STATS_DAYS + 1) * DAY_MS

    const reviews = new Map(vocab.reviewCountsByDay(profileId, since, tz).map((r) => [r.day, r.n]))
    const activity = new Map(xpRepo.dailyActivity(profileId, since, tz).map((r) => [r.day, r]))
    const days: StatsDay[] = dayRange(today, STATS_DAYS).map((day) => ({
      day,
      reviews: reviews.get(day) ?? 0,
      saved: activity.get(day)?.saved ?? 0,
      practice: activity.get(day)?.practice ?? 0,
      xp: activity.get(day)?.xp ?? 0
    }))

    const allReviewDays = vocab.reviewDays(profileId, 0, tz)
    const reviewTotals = vocab.reviewTotals(profileId)

    const states = { new: 0, learning: 0, review: 0, relearning: 0 }
    for (const { state, n } of vocab.cardStateCounts(profileId)) {
      const name = STATE_NAMES[state]
      if (name) states[name] += n
    }

    const savedIds = vocab.savedContentIdList(profileId)
    const levelCounts = new Map<string, number>()
    for (const level of dictionary.levelsOf(savedIds).values()) {
      levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1)
    }
    const levels = [...levelCounts.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([level, count]) => ({ level, count }))

    const sum = (list: StatsDay[], key: 'reviews' | 'xp' | 'saved'): number =>
      list.reduce((n, d) => n + d[key], 0)
    const thisWeek = days.slice(-7)
    const prevWeek = days.slice(-14, -7)

    return {
      days,
      totals: {
        reviews: reviewTotals.total,
        savedWords: savedIds.length,
        xp: xpRepo.totals(profileId).xp,
        practiceSessions: xpRepo.countByReason(profileId, 'exercise.session'),
        activeDays: allReviewDays.length,
        retention: reviewTotals.total ? reviewTotals.remembered / reviewTotals.total : null,
        streak: computeStreak(allReviewDays, today),
        longestStreak: longestStreak(allReviewDays)
      },
      cardStates: states,
      levels,
      week: {
        reviews: sum(thisWeek, 'reviews'),
        prevReviews: sum(prevWeek, 'reviews'),
        xp: sum(thisWeek, 'xp'),
        prevXp: sum(prevWeek, 'xp'),
        saved: sum(thisWeek, 'saved'),
        prevSaved: sum(prevWeek, 'saved')
      }
    }
  }
}
