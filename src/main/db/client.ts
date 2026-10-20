import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
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

/** Giữ lại tối đa chừng này bản sao lưu trước khi nâng cấp cấu trúc dữ liệu */
const MAX_BACKUPS = 3

/** Số migration có trong thư mục (theo meta/_journal.json) */
function bundledMigrationCount(migrationsFolder: string): number {
  try {
    const journal = JSON.parse(
      readFileSync(join(migrationsFolder, 'meta', '_journal.json'), 'utf8')
    ) as {
      entries?: unknown[]
    }
    return journal.entries?.length ?? 0
  } catch {
    return 0
  }
}

/** Số migration đã áp dụng trong DB (0 nếu DB mới tinh, chưa có bảng migration) */
function appliedMigrationCount(sqlite: Database.Database): number {
  const table = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'"
    )
    .get()
  if (!table) return 0
  const row = sqlite.prepare('SELECT count(*) AS n FROM __drizzle_migrations').get() as {
    n: number
  }
  return row.n
}

/**
 * Cập nhật app có thể kèm migration mới: sao lưu user.db trước khi migrate nếu còn migration chưa áp dụng
 * (DB mới tinh thì không cần). Sao lưu = `user.db.bak-<thời gian>` cạnh file gốc, giữ 3 bản gần nhất.
 * Trả về đường dẫn bản sao lưu, hoặc null nếu không cần.
 */
export function backupBeforeMigrate(
  sqlite: Database.Database,
  file: string,
  migrationsFolder: string,
  now: () => Date = () => new Date()
): string | null {
  if (file === ':memory:') return null
  const applied = appliedMigrationCount(sqlite)
  if (applied === 0 || applied >= bundledMigrationCount(migrationsFolder)) return null
  // Đưa nội dung WAL vào file chính để bản copy đầy đủ
  sqlite.pragma('wal_checkpoint(TRUNCATE)')
  const stamp = now().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const target = `${file}.bak-${stamp}`
  copyFileSync(file, target)
  pruneBackups(file)
  return target
}

function pruneBackups(file: string): void {
  const dir = dirname(file)
  const prefix = `${basename(file)}.bak-`
  const backups = readdirSync(dir)
    .filter((name) => name.startsWith(prefix))
    .sort() // mốc thời gian dạng số nên sắp theo tên là sắp theo thời gian
  for (const name of backups.slice(0, Math.max(0, backups.length - MAX_BACKUPS))) {
    const path = join(dir, name)
    if (existsSync(path)) rmSync(path, { force: true })
  }
}

/**
 * Mở user.db và tự chạy migration (~ php artisan migrate --force lúc khởi động).
 * Có migration mới thì sao lưu file trước (xem backupBeforeMigrate).
 * @param file đường dẫn file, hoặc ':memory:' cho test
 */
export function openUserDb(file: string, migrationsFolder: string): UserDbConnection {
  const sqlite = new Database(file)
  if (file !== ':memory:') sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  try {
    backupBeforeMigrate(sqlite, file, migrationsFolder)
  } catch (err) {
    // Không sao lưu được (đĩa đầy...) thì vẫn nâng cấp, nhưng ghi cảnh báo
    console.warn('[db] không sao lưu được user.db trước khi migrate:', (err as Error).message)
  }
  migrate(db, { migrationsFolder })
  return { db, sqlite, close: () => sqlite.close() }
}
