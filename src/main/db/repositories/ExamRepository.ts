import { and, count, desc, eq, gte, isNull } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { examAttempts } from '../schema'

export type ExamAttemptRow = typeof examAttempts.$inferSelect

export interface NewExamAttempt {
  profileId: string
  exam: string
  mode: string
  part: number | null
  correct: number
  total: number
  estListening: number | null
  estReading: number | null
  estTotal: number
  partResults: string
  elapsedSec: number
  finishedAt: number
}

/** Lịch sử các lần làm đề luyện thi */
export class ExamRepository {
  constructor(private readonly db: UserDb) {}

  add(input: NewExamAttempt, now: number): string {
    const id = uuidv7(now)
    this.db
      .insert(examAttempts)
      .values({ id, ...input, createdAt: now, updatedAt: now })
      .run()
    return id
  }

  recent(profileId: string, exam: string, limit: number): ExamAttemptRow[] {
    return this.db
      .select()
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.profileId, profileId),
          eq(examAttempts.exam, exam),
          isNull(examAttempts.deletedAt)
        )
      )
      .orderBy(desc(examAttempts.finishedAt))
      .limit(limit)
      .all()
  }

  /** Số lần đã nộp bài (mọi chế độ) từ thời điểm `since` (epoch ms) — lộ trình hôm nay dùng để đánh dấu xong */
  countSince(profileId: string, exam: string, since: number): number {
    const row = this.db
      .select({ n: count() })
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.profileId, profileId),
          eq(examAttempts.exam, exam),
          gte(examAttempts.finishedAt, since),
          isNull(examAttempts.deletedAt)
        )
      )
      .get()
    return row?.n ?? 0
  }
}
