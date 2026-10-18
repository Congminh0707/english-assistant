import { eq } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { petStates } from '../schema'

export type PetRow = typeof petStates.$inferSelect
export type PetUpdate = Partial<
  Pick<
    PetRow,
    | 'level'
    | 'totalXp'
    | 'coins'
    | 'hunger'
    | 'mood'
    | 'energy'
    | 'affection'
    | 'lastTickAt'
    | 'name'
  >
>

export class PetRepository {
  constructor(private readonly db: UserDb) {}

  findByProfile(profileId: string): PetRow | undefined {
    return this.db.select().from(petStates).where(eq(petStates.profileId, profileId)).get()
  }

  create(profileId: string, data: { name: string; characterId: string }, now: number): PetRow {
    const row: PetRow = {
      id: uuidv7(now),
      profileId,
      characterId: data.characterId,
      name: data.name,
      level: 1,
      totalXp: 0,
      coins: 0,
      hunger: 80,
      mood: 80,
      energy: 80,
      affection: 0,
      lastTickAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    }
    this.db.insert(petStates).values(row).run()
    return row
  }

  update(id: string, data: PetUpdate, now: number): void {
    this.db
      .update(petStates)
      .set({ ...data, updatedAt: now })
      .where(eq(petStates.id, id))
      .run()
  }
}
