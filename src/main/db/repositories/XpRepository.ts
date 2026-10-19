import { and, eq, gte, sql, sum } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { xpEvents } from '../schema'

export type XpEventRow = typeof xpEvents.$inferSelect

export class XpRepository {
  constructor(private readonly db: UserDb) {}

  insert(
    data: Pick<XpEventRow, 'profileId' | 'amount' | 'coins' | 'reason' | 'refId' | 'multiplier'>,
    now: number
  ): XpEventRow {
    const row: XpEventRow = { id: uuidv7(now), ...data, createdAt: now }
    this.db.insert(xpEvents).values(row).run()
    return row
  }

  /** Đã có sự kiện này chưa (reason + refId) — để thưởng đúng một lần */
  hasEvent(profileId: string, reason: string, refId: string): boolean {
    return !!this.db
      .select({ id: xpEvents.id })
      .from(xpEvents)
      .where(
        and(
          eq(xpEvents.profileId, profileId),
          eq(xpEvents.reason, reason),
          eq(xpEvents.refId, refId)
        )
      )
      .get()
  }

  /** Số sự kiện cùng lý do kể từ một thời điểm (vd số từ mới đã lưu hôm nay) */
  countSince(profileId: string, reason: string, sinceMs: number): number {
    const row = this.db
      .select({ n: sql<number>`count(*)` })
      .from(xpEvents)
      .where(
        and(
          eq(xpEvents.profileId, profileId),
          eq(xpEvents.reason, reason),
          gte(xpEvents.createdAt, sinceMs)
        )
      )
      .get()
    return Number(row?.n ?? 0)
  }

  /** XP, số từ mới lưu và số phiên luyện tập mỗi ngày cục bộ kể từ một thời điểm */
  dailyActivity(
    profileId: string,
    sinceMs: number,
    tzOffsetSeconds: number
  ): Array<{ day: string; xp: number; saved: number; practice: number }> {
    const day = sql<string>`strftime('%Y-%m-%d', ${xpEvents.createdAt} / 1000 + ${tzOffsetSeconds}, 'unixepoch')`
    return this.db
      .select({
        day,
        xp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)`,
        saved: sql<number>`coalesce(sum(case when ${xpEvents.reason} = 'word.saved' then 1 else 0 end), 0)`,
        practice: sql<number>`coalesce(sum(case when ${xpEvents.reason} = 'exercise.session' then 1 else 0 end), 0)`
      })
      .from(xpEvents)
      .where(and(eq(xpEvents.profileId, profileId), gte(xpEvents.createdAt, sinceMs)))
      .groupBy(day)
      .all()
      .map((r) => ({
        day: r.day,
        xp: Number(r.xp),
        saved: Number(r.saved),
        practice: Number(r.practice)
      }))
  }

  /** Số sự kiện cùng lý do từ đầu đến giờ */
  countByReason(profileId: string, reason: string): number {
    const row = this.db
      .select({ n: sql<number>`count(*)` })
      .from(xpEvents)
      .where(and(eq(xpEvents.profileId, profileId), eq(xpEvents.reason, reason)))
      .get()
    return Number(row?.n ?? 0)
  }

  /** Tổng tính lại từ sổ cái — dùng để đối chiếu/khôi phục bản tổng hợp trong pet_states */
  totals(profileId: string): { xp: number; coins: number } {
    const row = this.db
      .select({ xp: sum(xpEvents.amount), coins: sum(xpEvents.coins) })
      .from(xpEvents)
      .where(eq(xpEvents.profileId, profileId))
      .get()
    return { xp: Number(row?.xp ?? 0), coins: Number(row?.coins ?? 0) }
  }
}
