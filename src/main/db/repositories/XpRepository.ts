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
