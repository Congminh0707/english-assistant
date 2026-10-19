import { eq, sql } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { lessonProgress } from '../schema'

export type LessonProgressRow = typeof lessonProgress.$inferSelect

/** Tiến độ các bài học nền tảng của từng hồ sơ */
export class LessonRepository {
  constructor(private readonly db: UserDb) {}

  list(profileId: string): LessonProgressRow[] {
    return this.db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.profileId, profileId))
      .all()
  }

  /** Ghi một lượt làm bài: tăng số lần làm, giữ điểm cao nhất; `completedAt` đặt một lần khi lần đầu đạt */
  record(profileId: string, lessonId: string, score: number, passed: boolean, now: number): void {
    this.db
      .insert(lessonProgress)
      .values({
        id: uuidv7(now),
        profileId,
        lessonId,
        best: score,
        attempts: 1,
        completedAt: passed ? now : null,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [lessonProgress.profileId, lessonProgress.lessonId],
        set: {
          best: sql`max(${lessonProgress.best}, ${score})`,
          attempts: sql`${lessonProgress.attempts} + 1`,
          completedAt: passed
            ? sql`coalesce(${lessonProgress.completedAt}, ${now})`
            : lessonProgress.completedAt,
          updatedAt: now
        }
      })
      .run()
  }
}
