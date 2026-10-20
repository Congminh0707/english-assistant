import { and, eq } from 'drizzle-orm'
import type { UserDb } from '../client'
import { settings } from '../schema'

export const GLOBAL_SCOPE = 'global'

export class SettingsRepository {
  constructor(private readonly db: UserDb) {}

  all(scope = GLOBAL_SCOPE): Array<{ key: string; value: unknown }> {
    return this.db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(eq(settings.scope, scope))
      .all()
  }

  /** Xoá một khoá cài đặt (về mặc định) */
  remove(key: string, scope = GLOBAL_SCOPE): void {
    this.db
      .delete(settings)
      .where(and(eq(settings.scope, scope), eq(settings.key, key)))
      .run()
  }

  set(key: string, value: unknown, now: number, scope = GLOBAL_SCOPE): void {
    this.db
      .insert(settings)
      .values({ scope, key, value, updatedAt: now })
      .onConflictDoUpdate({
        target: [settings.scope, settings.key],
        set: { value, updatedAt: now }
      })
      .run()
  }
}
