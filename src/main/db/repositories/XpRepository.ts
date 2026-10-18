import { eq, sum } from 'drizzle-orm'
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
