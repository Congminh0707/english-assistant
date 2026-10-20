import { and, eq, gte, sql } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { usageDays } from '../schema'

export type UsageDayRow = typeof usageDays.$inferSelect

/** Thời gian dùng app theo ngày của từng hồ sơ */
export class UsageRepository {
  constructor(private readonly db: UserDb) {}

  get(profileId: string, day: string): UsageDayRow | undefined {
    return this.db
      .select()
      .from(usageDays)
      .where(and(eq(usageDays.profileId, profileId), eq(usageDays.day, day)))
      .get()
  }

  /** Cộng thêm số giây đã dùng trong ngày */
  addSeconds(profileId: string, day: string, seconds: number, now: number): void {
    this.db
      .insert(usageDays)
      .values({ id: uuidv7(now), profileId, day, seconds, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: [usageDays.profileId, usageDays.day],
        set: { seconds: sql`${usageDays.seconds} + ${seconds}`, updatedAt: now }
      })
      .run()
  }

  /** Phụ huynh cho thêm thời gian trong ngày */
  addBonus(profileId: string, day: string, seconds: number, now: number): void {
    this.db
      .insert(usageDays)
      .values({
        id: uuidv7(now),
        profileId,
        day,
        bonusSeconds: seconds,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [usageDays.profileId, usageDays.day],
        set: { bonusSeconds: sql`${usageDays.bonusSeconds} + ${seconds}`, updatedAt: now }
      })
      .run()
  }

  /** Tổng số giây đã dùng từ trước đến nay */
  totalSeconds(profileId: string): number {
    const row = this.db
      .select({ n: sql<number>`coalesce(sum(${usageDays.seconds}), 0)` })
      .from(usageDays)
      .where(eq(usageDays.profileId, profileId))
      .get()
    return Number(row?.n ?? 0)
  }

  /** Các ngày từ `fromDay` (YYYY-MM-DD) trở đi */
  since(profileId: string, fromDay: string): UsageDayRow[] {
    return this.db
      .select()
      .from(usageDays)
      .where(and(eq(usageDays.profileId, profileId), gte(usageDays.day, fromDay)))
      .all()
  }
}
