import { SKILLS } from '@shared/progress'
import { levelIndex } from '@shared/schemas/content/level'
import type { CourseStepState, CourseSummary } from '@shared/schemas/course'
import type { LessonKind } from '@shared/schemas/lesson'
import type { DailyPlan, DailyPlanItem } from '@shared/schemas/study'
import type { Clock } from '../core/Clock'
import { localDayKey, startOfLocalDay } from '../core/localDay'
import type { LessonRepository } from '../db/repositories/LessonRepository'
import type { VocabRepository } from '../db/repositories/VocabRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { CourseService } from './CourseService'
import type { LessonService } from './LessonService'
import { PRACTICE_REASON } from './PracticeService'
import type { ProfileService } from './ProfileService'
import type { ProgressService } from './ProgressService'
import type { SettingsService } from './SettingsService'
import type { SrsService } from './SrsService'

/** Tối đa số mục trong lộ trình một ngày */
const MAX_ITEMS = 5
/** Tối đa số bài thêm (sau bài kế tiếp của khoá) khi chưa đủ phút mục tiêu */
const MAX_EXTRA_LESSONS = 2
const PRACTICE_MINUTES = 5
/** Kỹ năng yếu tìm bài ở kho tương ứng; bỏ từ vựng vì đã có mục ôn thẻ */
const WEAK_SKILLS = SKILLS.filter((s) => s !== 'vocab') as Array<
  'grammar' | 'reading' | 'listening'
>

/**
 * Lộ trình hằng ngày (docs/07 §13): ôn thẻ đến hạn → bài kế tiếp của khoá đang theo → một bài của kỹ năng yếu nhất,
 * thêm bài của khoá cho tới khi đủ phút mục tiêu. Suy ra hoàn toàn từ dữ liệu sẵn có, không ghi DB.
 * Một mục bài học "xong" khi `lesson_progress.completedAt` nằm trong hôm nay (ngày cục bộ).
 */
export class DailyPlanService {
  constructor(
    private readonly deps: {
      srs: SrsService
      vocab: VocabRepository
      xpRepo: XpRepository
      courses: CourseService
      progress: ProgressService
      services: Record<LessonKind, LessonService>
      lessonRepo: LessonRepository
      settings: SettingsService
      profiles: ProfileService
      clock: Clock
    }
  ) {}

  plan(): DailyPlan {
    const { settings, profiles, clock, lessonRepo } = this.deps
    const now = clock.now()
    const since = startOfLocalDay(now)
    const profileId = profiles.activeId()
    const targetMinutes = settings.get('learning.dailyMinutes')
    const completedAt = new Map(
      lessonRepo.list(profileId).map((r) => [r.lessonId, r.completedAt ?? null])
    )
    const doneToday = (id: string): boolean => (completedAt.get(id) ?? -1) >= since

    const items: DailyPlanItem[] = []
    const review = this.review(profileId)
    if (review) items.push(review)

    const course = this.followedCourse(doneToday)
    const steps = course ? this.deps.courses.get(course.id).units.flatMap((u) => u.steps) : []
    // Bước đang làm: bước đầu tiên chưa xong, hoặc đã xong trong hôm nay (vẫn hiện để thấy dấu ✓)
    const mainIndex = steps.findIndex((s) => !s.done || doneToday(s.id))
    const main = mainIndex >= 0 ? steps[mainIndex] : null
    if (course && main) items.push(this.lessonItem(main, course.title, doneToday(main.id)))

    items.push(this.weakSkill(main?.id ?? null, doneToday) ?? this.practice(profileId, since))

    // Chưa đủ phút mục tiêu → thêm các bước tiếp theo trong cùng khoá (chưa xong, hoặc xong hôm nay để giữ dấu ✓)
    const used = new Set(items.map((i) => i.lessonId).filter(Boolean))
    let extra = 0
    for (const step of steps.slice(mainIndex + 1)) {
      if (extra >= MAX_EXTRA_LESSONS || items.length >= MAX_ITEMS) break
      if (sumMinutes(items) >= targetMinutes) break
      if ((step.done && !doneToday(step.id)) || used.has(step.id)) continue
      items.push(this.lessonItem(step, course!.title, doneToday(step.id)))
      extra++
    }

    return {
      day: localDayKey(now),
      targetMinutes,
      items,
      doneCount: items.filter((i) => i.done).length,
      totalMinutes: sumMinutes(items)
    }
  }

  /** Ôn thẻ: luôn đứng đầu; người chưa có thẻ nào thì bỏ mục này; hết thẻ đến hạn = xong */
  private review(profileId: string): DailyPlanItem | null {
    const { srs, vocab } = this.deps
    if (vocab.countCards(profileId) === 0) return null
    const count = srs.dueCount()
    return {
      kind: 'review',
      title: '',
      minutes: Math.min(8, Math.max(2, Math.ceil(count / 4))),
      done: count === 0,
      count
    }
  }

  /**
   * Khoá đang theo: khoá đã học dở (có bước xong, còn bước chưa xong) với tỉ lệ hoàn thành cao nhất;
   * khoá vừa xong bước cuối trong hôm nay vẫn tính (để giữ dấu ✓ tới hết ngày).
   * Chưa học khoá nào thì khoá đầu tiên có trình độ bắt đầu ≤ trình độ người học.
   */
  private followedCourse(doneToday: (id: string) => boolean): CourseSummary | null {
    const { courses } = this.deps
    const list = courses.list()
    const finishedToday = (c: CourseSummary): boolean =>
      courses.get(c.id).units.some((u) => u.steps.some((s) => doneToday(s.id)))
    let best: CourseSummary | null = null
    for (const c of list) {
      if (c.stepsDone === 0 || (!c.next && !finishedToday(c))) continue
      if (!best || c.stepsDone / c.stepsTotal > best.stepsDone / best.stepsTotal) best = c
    }
    if (best) return best
    const level = levelIndex(this.deps.settings.get('learning.level'))
    return list.find((c) => c.next && levelIndex(c.levelFrom) <= level) ?? null
  }

  private lessonItem(step: CourseStepState, courseTitle: string, done: boolean): DailyPlanItem {
    return {
      kind: 'lesson',
      lessonKind: step.kind,
      lessonId: step.id,
      title: step.title,
      subtitle: courseTitle,
      minutes: Math.max(1, step.minutes),
      done
    }
  }

  /**
   * Kỹ năng yếu nhất (rating thấp nhất trong ngữ pháp/đọc/nghe; bằng nhau thì theo thứ tự đó):
   * bài đầu tiên chưa xong (hoặc xong hôm nay) có level ≤ trình độ + 1 bậc, khác bài của khoá.
   */
  private weakSkill(
    excludeId: string | null,
    doneToday: (id: string) => boolean
  ): DailyPlanItem | null {
    const ratings = this.deps.progress.ratings()
    const rating = (s: string): number => ratings.find((r) => r.skill === s)?.rating ?? Infinity
    const skill = WEAK_SKILLS.reduce((a, b) => (rating(b) < rating(a) ? b : a))
    const maxLevel = levelIndex(this.deps.settings.get('learning.level')) + 1
    const lesson = this.deps.services[skill]
      .catalog()
      .units.flatMap((u) => u.lessons)
      .find(
        (l) =>
          l.id !== excludeId &&
          levelIndex(l.level) <= maxLevel &&
          (!l.progress.done || doneToday(l.id))
      )
    if (!lesson) return null
    return {
      kind: 'skill',
      lessonKind: skill,
      lessonId: lesson.id,
      title: lesson.title,
      minutes: lesson.minutes,
      done: doneToday(lesson.id),
      skill
    }
  }

  /** Không còn bài hợp trình độ cho kỹ năng yếu → một phiên luyện tập (xong khi hôm nay đã có phiên được ghi sổ) */
  private practice(profileId: string, since: number): DailyPlanItem {
    return {
      kind: 'practice',
      title: '',
      minutes: PRACTICE_MINUTES,
      done: this.deps.xpRepo.countSince(profileId, PRACTICE_REASON, since) > 0,
      skill: 'vocab'
    }
  }
}

function sumMinutes(items: DailyPlanItem[]): number {
  return items.reduce((n, i) => n + i.minutes, 0)
}
