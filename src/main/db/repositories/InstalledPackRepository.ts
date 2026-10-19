import { asc, eq } from 'drizzle-orm'
import type { UserDb } from '../client'
import { installedPacks } from '../schema'

export type InstalledPackRow = typeof installedPacks.$inferSelect

export class InstalledPackRepository {
  constructor(private readonly db: UserDb) {}

  list(): InstalledPackRow[] {
    return this.db.select().from(installedPacks).orderBy(asc(installedPacks.id)).all()
  }

  find(id: string): InstalledPackRow | undefined {
    return this.db.select().from(installedPacks).where(eq(installedPacks.id, id)).get()
  }

  upsert(row: InstalledPackRow): void {
    const { version, path, schemaVersion, sha256, installedAt, enabled } = row
    this.db
      .insert(installedPacks)
      .values(row)
      .onConflictDoUpdate({
        target: installedPacks.id,
        set: { version, path, schemaVersion, sha256, installedAt, enabled }
      })
      .run()
  }
}
