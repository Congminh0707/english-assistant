import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

export type UserDb = BetterSQLite3Database<typeof schema>

export interface UserDbConnection {
  db: UserDb
  sqlite: Database.Database
  close(): void
}

/**
 * Mở user.db và tự chạy migration (~ php artisan migrate --force lúc khởi động).
 * @param file đường dẫn file, hoặc ':memory:' cho test
 */
export function openUserDb(file: string, migrationsFolder: string): UserDbConnection {
  const sqlite = new Database(file)
  if (file !== ':memory:') sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder })
  return { db, sqlite, close: () => sqlite.close() }
}
