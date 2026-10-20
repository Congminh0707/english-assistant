import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { backupBeforeMigrate, openUserDb } from './client'

const FULL = resolve('src/main/db/migrations')

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ea-db-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

/** Bản sao thư mục migration chỉ giữ `count` migration đầu (mô phỏng app phiên bản cũ) */
function partialMigrations(count: number): string {
  const copy = join(dir, `migrations-${count}`)
  cpSync(FULL, copy, { recursive: true })
  const journalPath = join(copy, 'meta', '_journal.json')
  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as { entries: unknown[] }
  journal.entries = journal.entries.slice(0, count)
  writeFileSync(journalPath, JSON.stringify(journal))
  return copy
}

const backupsOf = (): string[] => readdirSync(dir).filter((f) => f.includes('.bak-'))

describe('sao lưu user.db trước khi migrate', () => {
  it('DB mới tinh và DB đã cập nhật đủ thì không sao lưu', () => {
    const file = join(dir, 'user.db')
    openUserDb(file, FULL).close()
    expect(backupsOf()).toEqual([])
    openUserDb(file, FULL).close() // mở lại: không còn migration nào chờ
    expect(backupsOf()).toEqual([])
  })

  it('còn migration chưa áp dụng thì sao lưu trước, dữ liệu cũ vẫn nguyên sau khi nâng cấp', () => {
    const file = join(dir, 'user.db')
    const old = openUserDb(file, partialMigrations(2))
    old.sqlite
      .prepare("INSERT INTO settings (scope, key, value, updated_at) VALUES ('global','x','1',1)")
      .run()
    old.close()
    expect(backupsOf()).toEqual([])

    const upgraded = openUserDb(file, FULL)
    const backups = backupsOf()
    expect(backups).toHaveLength(1)
    // Bản sao lưu là DB phiên bản cũ nhưng có đủ dữ liệu
    const backup = openUserDb(join(dir, backups[0]), partialMigrations(2))
    const row = backup.sqlite.prepare("SELECT value FROM settings WHERE key = 'x'").get() as {
      value: string
    }
    expect(row.value).toBe('1')
    backup.close()
    // DB chính đã lên bản mới và giữ dữ liệu
    const names = upgraded.sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((r) => (r as { name: string }).name)
    expect(names).toContain('usage_days')
    expect(
      (
        upgraded.sqlite.prepare("SELECT count(*) AS n FROM settings WHERE key = 'x'").get() as {
          n: number
        }
      ).n
    ).toBe(1)
    upgraded.close()
  })

  it('chỉ giữ 3 bản sao lưu gần nhất', () => {
    const file = join(dir, 'user.db')
    const old = openUserDb(file, partialMigrations(2))
    for (let i = 1; i <= 5; i++) {
      const stamp = new Date(Date.UTC(2026, 0, i, 12))
      expect(backupBeforeMigrate(old.sqlite, file, FULL, () => stamp)).not.toBeNull()
    }
    const kept = backupsOf().sort()
    expect(kept).toHaveLength(3)
    expect(kept[0]).toContain('20260103')
    expect(existsSync(file)).toBe(true)
    old.close()
  })

  it(':memory: không bao giờ sao lưu', () => {
    const conn = openUserDb(':memory:', FULL)
    expect(backupBeforeMigrate(conn.sqlite, ':memory:', FULL)).toBeNull()
    conn.close()
  })
})
