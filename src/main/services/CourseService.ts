import type {
  CourseDetail,
  CourseFile,
  CourseStepState,
  CourseSummary
} from '@shared/schemas/course'
import type { LessonKind } from '@shared/schemas/lesson'
import { AppError } from '../core/AppError'
import type { CourseLibrary } from '../content/CourseLibrary'
import type { LessonRepository } from '../db/repositories/LessonRepository'
import type { LessonService } from './LessonService'
import type { ProfileService } from './ProfileService'

type Progress = Map<string, { best: number; done: boolean }>

/**
 * Lộ trình học: ghép các bài có sẵn (nền tảng, ngữ pháp, đọc, nghe) thành khoá có thứ tự; tiến độ lấy từ chính tiến độ
 * của từng bài (lesson_progress) nên làm bài ở đâu cũng được tính vào khoá.
 */
export class CourseService {
  constructor(
    private readonly deps: {
      library: CourseLibrary
      services: Record<LessonKind, LessonService>
      repo: LessonRepository
      profiles: ProfileService
    }
  ) {}

  list(): CourseSummary[] {
    const progress = this.progress()
    return this.deps.library.courses().map((c) => this.summarise(c, progress))
  }

  get(id: string): CourseDetail {
    const course = this.deps.library.course(id)
    if (!course) throw new AppError('NOT_FOUND', 'errors.notFound')
    const progress = this.progress()
    return {
      ...this.summarise(course, progress),
      units: course.units.map((u) => ({
        id: u.id,
        title: u.title,
        summary: u.summary,
        steps: u.steps.map((s) => this.step(s, progress))
      }))
    }
  }

  private progress(): Progress {
    const rows = this.deps.repo.list(this.deps.profiles.activeId())
    return new Map(rows.map((r) => [r.lessonId, { best: r.best, done: !!r.completedAt }]))
  }

  private step(s: { kind: LessonKind; id: string }, progress: Progress): CourseStepState {
    const lesson = this.deps.services[s.kind].get(s.id)
    const p = progress.get(s.id)
    return {
      kind: s.kind,
      id: s.id,
      title: lesson.title,
      minutes: lesson.minutes,
      level: lesson.level,
      done: p?.done ?? false,
      best: p?.best ?? null
    }
  }

  private summarise(course: CourseFile, progress: Progress): CourseSummary {
    const steps = course.units.flatMap((u) => u.steps).map((s) => this.step(s, progress))
    return {
      id: course.course.id,
      title: course.course.title,
      summary: course.course.summary,
      icon: course.course.icon,
      levelFrom: course.course.levelFrom,
      levelTo: course.course.levelTo,
      stepsDone: steps.filter((s) => s.done).length,
      stepsTotal: steps.length,
      next: steps.find((s) => !s.done) ?? null
    }
  }
}
