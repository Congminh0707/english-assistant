import { and, eq, gte, sql } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { exerciseStats, skillRatings } from '../schema'

export interface AccuracyRow {
  source: string
  kind: string
  skill: string
  correct: number
  total: number
}

/** Kết quả bài tập theo ngày/dạng bài/kỹ năng và rating Elo theo kỹ năng */
export class ProgressRepository {
  constructor(private readonly db: UserDb) {}

  /** Cộng dồn kết quả vào dòng của (ngày, nguồn, dạng bài, kỹ năng) */
  addStat(
    row: {
      profileId: string
      day: string
      source: string
      kind: string
      skill: string
      correct: number
      total: number
    },
    now: number
  ): void {
    this.db
      .insert(exerciseStats)
      .values({ ...row, id: uuidv7(now), createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: [
          exerciseStats.profileId,
          exerciseStats.day,
          exerciseStats.source,
          exerciseStats.kind,
          exerciseStats.skill
        ],
        set: {
          correct: sql`${exerciseStats.correct} + ${row.correct}`,
          total: sql`${exerciseStats.total} + ${row.total}`,
          updatedAt: now
        }
      })
      .run()
  }

  /** Tổng kết quả từ một ngày (YYYY-MM-DD) trở đi, gộp theo nguồn/dạng bài/kỹ năng */
  accuracySince(profileId: string, fromDay: string): AccuracyRow[] {
    return this.db
      .select({
        source: exerciseStats.source,
        kind: exerciseStats.kind,
        skill: exerciseStats.skill,
        correct: sql<number>`sum(${exerciseStats.correct})`,
        total: sql<number>`sum(${exerciseStats.total})`
      })
      .from(exerciseStats)
      .where(and(eq(exerciseStats.profileId, profileId), gte(exerciseStats.day, fromDay)))
      .groupBy(exerciseStats.source, exerciseStats.kind, exerciseStats.skill)
      .all()
      .map((r) => ({ ...r, correct: Number(r.correct), total: Number(r.total) }))
  }

  ratings(profileId: string): Array<{ skill: string; rating: number; games: number }> {
    return this.db
      .select({ skill: skillRatings.skill, rating: skillRatings.rating, games: skillRatings.games })
      .from(skillRatings)
      .where(eq(skillRatings.profileId, profileId))
      .all()
  }

  setRating(profileId: string, skill: string, rating: number, games: number, now: number): void {
    this.db
      .insert(skillRatings)
      .values({ id: uuidv7(now), profileId, skill, rating, games, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: [skillRatings.profileId, skillRatings.skill],
        set: { rating, games, updatedAt: now }
      })
      .run()
  }
}
