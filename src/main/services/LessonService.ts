import {
  LESSON_PASS_PERCENT,
  type Lesson,
  type LessonCatalog,
  type LessonCompleteResult
} from '@shared/schemas/lesson'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { LessonLibrary } from '../content/LessonLibrary'
import type { LessonRepository } from '../db/repositories/LessonRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { ProfileService } from './ProfileService'
import type { Transaction } from './types'
import type { XpService } from './XpService'

export const LESSON_REASON = 'lesson.completed'
const XP_COMPLETE = 15
const XP_PERFECT_BONUS = 5
const COINS_COMPLETE = 5

/**
 * Bài học nền tảng: danh mục theo chương kèm tiến độ, nội dung từng bài, ghi kết quả bài tập.
 * Lần đầu đạt ngưỡng (≥ 70%) được thưởng XP/xu (một lần cho mỗi bài); làm lại chỉ cập nhật điểm cao nhất.
 */
export class LessonService {
  constructor(
    private readonly deps: {
      library: LessonLibrary
      repo: LessonRepository
      xpRepo: XpRepository
      xp: XpService
      profiles: ProfileService
      clock: Clock
      transaction: Transaction
    }
  ) {}

  catalog(): LessonCatalog {
    const { library, repo, profiles } = this.deps
    const progress = new Map(repo.list(profiles.activeId()).map((r) => [r.lessonId, r]))
    let doneCount = 0
    const units = library.units().map((unit) => ({
      id: unit.id,
      title: unit.title,
      summary: unit.summary,
      icon: unit.icon,
      lessons: unit.lessons.map((lesson) => {
        const row = progress.get(lesson.id)
        const done = !!row?.completedAt
        if (done) doneCount++
        return {
          id: lesson.id,
          title: lesson.title,
          summary: lesson.summary,
          level: lesson.level,
          minutes: lesson.minutes,
          exerciseCount: lesson.exercises.length,
          progress: { best: row ? row.best : null, done }
        }
      })
    }))
    return { units, doneCount, totalCount: library.lessonCount }
  }

  get(id: string): Lesson {
    const lesson = this.deps.library.lesson(id)
    if (!lesson) throw new AppError('NOT_FOUND', 'errors.notFound')
    return lesson
  }

  complete(lessonId: string, correct: number, total: number): LessonCompleteResult {
    const { library, repo, xpRepo, xp, profiles, clock, transaction } = this.deps
    const lesson = this.get(lessonId)
    if (correct > total || total > lesson.exercises.length) {
      throw new AppError('VALIDATION', 'errors.validation')
    }
    const score = Math.round((correct / total) * 100)
    const passed = score >= LESSON_PASS_PERCENT

    return transaction(() => {
      const profileId = profiles.activeId()
      const previous = repo.list(profileId).find((r) => r.lessonId === lessonId)
      repo.record(profileId, lessonId, score, passed, clock.now())
      const best = Math.max(previous?.best ?? 0, score)

      let gainedXp = 0
      let gainedCoins = 0
      const firstCompletion = passed && !xpRepo.hasEvent(profileId, LESSON_REASON, lessonId)
      if (firstCompletion) {
        gainedXp = XP_COMPLETE + (score === 100 ? XP_PERFECT_BONUS : 0)
        gainedCoins = COINS_COMPLETE
        xp.grant({ amount: gainedXp, coins: gainedCoins, reason: LESSON_REASON, refId: lessonId })
      }
      return {
        score,
        best,
        firstCompletion,
        xp: gainedXp,
        coins: gainedCoins,
        nextLessonId: library.nextLessonId(lessonId)
      }
    })
  }
}
