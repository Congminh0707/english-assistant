import { and, asc, eq, isNull } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { profiles } from '../schema'

export type ProfileRow = typeof profiles.$inferSelect
export type Track = ProfileRow['track']

export class ProfileRepository {
  constructor(private readonly db: UserDb) {}

  list(): ProfileRow[] {
    return this.db
      .select()
      .from(profiles)
      .where(isNull(profiles.deletedAt))
      .orderBy(asc(profiles.createdAt))
      .all()
  }

  find(id: string): ProfileRow | undefined {
    return this.db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, id), isNull(profiles.deletedAt)))
      .get()
  }

  update(
    id: string,
    data: Partial<{ name: string; track: Track; isChild: boolean }>,
    now: number
  ): void {
    this.db
      .update(profiles)
      .set({ ...data, updatedAt: now })
      .where(eq(profiles.id, id))
      .run()
  }

  create(data: { name: string; track: Track; isChild: boolean }, now: number): ProfileRow {
    const row: ProfileRow = {
      id: uuidv7(now),
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    }
    this.db.insert(profiles).values(row).run()
    return row
  }
}
