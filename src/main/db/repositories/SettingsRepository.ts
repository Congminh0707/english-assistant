import { eq } from 'drizzle-orm'
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
