import { and, asc, eq, gt, sql } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { inventoryItems } from '../schema'

export type InventoryRow = typeof inventoryItems.$inferSelect

export class InventoryRepository {
  constructor(private readonly db: UserDb) {}

  /** Các món đang có (số lượng > 0) */
  list(profileId: string): InventoryRow[] {
    return this.db
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.profileId, profileId), gt(inventoryItems.quantity, 0)))
      .orderBy(asc(inventoryItems.createdAt), asc(inventoryItems.itemId))
      .all()
  }

  quantity(profileId: string, itemId: string): number {
    const row = this.db
      .select({ quantity: inventoryItems.quantity })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.profileId, profileId), eq(inventoryItems.itemId, itemId)))
      .get()
    return row?.quantity ?? 0
  }

  /** Cộng (delta > 0) hoặc trừ (delta < 0) số lượng, không xuống dưới 0; tạo dòng mới nếu chưa có */
  adjust(profileId: string, itemId: string, delta: number, now: number): void {
    this.db
      .insert(inventoryItems)
      .values({
        id: uuidv7(now),
        profileId,
        itemId,
        quantity: Math.max(0, delta),
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [inventoryItems.profileId, inventoryItems.itemId],
        set: { quantity: sql`max(0, ${inventoryItems.quantity} + ${delta})`, updatedAt: now }
      })
      .run()
  }
}
