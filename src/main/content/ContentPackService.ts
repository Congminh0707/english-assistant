import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { CONTENT_SCHEMA_VERSION, PackManifest } from '@shared/schemas/content'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type {
  InstalledPackRepository,
  InstalledPackRow
} from '../db/repositories/InstalledPackRepository'
import { extractEntries, readSmallEntry } from './zip'

const CONTENT_DB = 'content.db'

const sleepSync = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/**
 * Đổi tên thư mục, thử lại vài lần nếu Windows báo EPERM/EBUSY/EACCES: phần mềm diệt virus hoặc trình
 * lập chỉ mục thường giữ tạm file vừa giải nén vài trăm ms (lỗi thật gặp trên máy chạy CI).
 */
function renameWithRetry(from: string, to: string, attempts = 8): void {
  for (let i = 1; ; i++) {
    try {
      renameSync(from, to)
      return
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      if (i >= attempts || !['EPERM', 'EBUSY', 'EACCES'].includes(code ?? '')) throw err
      sleepSync(100 * i)
    }
  }
}

/** So sánh semver 'a.b.c' — trả về >0 nếu a mới hơn b */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

/**
 * Cài & mở content pack (.eapack = zip: manifest.json + content.db + LICENSES.md) — docs/09-content-pipeline.md#8.
 * content.db được giải nén vào <packsDir>/<id>/<version>/ và mở CHỈ ĐỌC; tiến độ người dùng nằm ở user.db,
 * liên kết bằng id chuỗi nên thay pack không làm hỏng dữ liệu người dùng.
 */
export class ContentPackService {
  private readonly openDbs = new Map<string, Database.Database>()

  constructor(
    private readonly deps: { repo: InstalledPackRepository; packsDir: string; clock: Clock }
  ) {}

  readManifest(eapackPath: string): PackManifest {
    const raw = readSmallEntry(eapackPath, 'manifest.json')
    if (!raw) throw new AppError('PACK_INVALID', 'errors.packInvalid')
    const parsed = PackManifest.safeParse(JSON.parse(new TextDecoder().decode(raw)))
    if (!parsed.success)
      throw new AppError('PACK_INVALID', 'errors.packInvalid', parsed.error.issues)
    return parsed.data
  }

  /** Cài một file .eapack: giải nén theo luồng, kiểm tra sha256, đăng ký vào user.db */
  async install(eapackPath: string): Promise<InstalledPackRow> {
    const manifest = this.readManifest(eapackPath)
    if (manifest.schemaVersion > CONTENT_SCHEMA_VERSION) {
      throw new AppError('PACK_UNSUPPORTED', 'errors.packUnsupported')
    }
    const expected = manifest.files.find((f) => f.path === CONTENT_DB)
    if (!expected) throw new AppError('PACK_INVALID', 'errors.packInvalid')

    const packDir = join(this.deps.packsDir, manifest.id)
    const targetDir = join(packDir, manifest.version)
    const tmpDir = `${targetDir}.tmp`
    rmSync(tmpDir, { recursive: true, force: true })
    mkdirSync(tmpDir, { recursive: true })

    try {
      const extracted = await extractEntries(eapackPath, tmpDir, [CONTENT_DB, 'LICENSES.md'])
      const db = extracted.get(CONTENT_DB)
      if (!db || db.sha256 !== expected.sha256 || db.sizeBytes !== expected.sizeBytes) {
        throw new AppError('PACK_CORRUPT', 'errors.packCorrupt')
      }
      writeFileSync(join(tmpDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

      this.close(manifest.id)
      rmSync(targetDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
      renameWithRetry(tmpDir, targetDir)
    } catch (err) {
      rmSync(tmpDir, { recursive: true, force: true })
      throw err
    }

    const row: InstalledPackRow = {
      id: manifest.id,
      version: manifest.version,
      path: join(targetDir, CONTENT_DB),
      schemaVersion: manifest.schemaVersion,
      sha256: expected.sha256,
      installedAt: this.deps.clock.now(),
      enabled: true
    }
    this.deps.repo.upsert(row)
    this.removeOldVersions(packDir, manifest.version)
    return row
  }

  /**
   * Cài các pack đi kèm app (thư mục resources/packs) nếu chưa có, hoặc bản đi kèm mới hơn,
   * hoặc file đã cài bị mất. Trả về id các pack vừa cài.
   */
  async ensureBundled(bundledDir: string): Promise<string[]> {
    if (!existsSync(bundledDir)) return []
    const installed: string[] = []
    for (const file of readdirSync(bundledDir)
      .filter((f) => f.endsWith('.eapack'))
      .sort()) {
      const path = join(bundledDir, file)
      try {
        const manifest = this.readManifest(path)
        const current = this.deps.repo.find(manifest.id)
        const needsInstall =
          !current ||
          !existsSync(current.path) ||
          compareVersions(manifest.version, current.version) > 0
        if (needsInstall) {
          await this.install(path)
          installed.push(manifest.id)
        }
      } catch (err) {
        console.error(`[content-pack] Không cài được ${file}:`, err)
      }
    }
    return installed
  }

  /** content.db của một pack (mở chỉ đọc, dùng lại kết nối). null nếu chưa cài. */
  db(id: string): Database.Database | null {
    const cached = this.openDbs.get(id)
    if (cached) return cached
    const row = this.deps.repo.find(id)
    if (!row || !row.enabled || !existsSync(row.path)) return null
    const db = new Database(row.path, { readonly: true, fileMustExist: true })
    this.openDbs.set(id, db)
    return db
  }

  list(): InstalledPackRow[] {
    return this.deps.repo.list()
  }

  close(id: string): void {
    this.openDbs.get(id)?.close()
    this.openDbs.delete(id)
  }

  closeAll(): void {
    for (const id of [...this.openDbs.keys()]) this.close(id)
  }

  private removeOldVersions(packDir: string, keep: string): void {
    for (const entry of readdirSync(packDir)) {
      if (entry === keep) continue
      try {
        rmSync(join(packDir, entry), { recursive: true, force: true })
      } catch {
        // file có thể đang bị khoá (Windows) — lần sau sẽ dọn
      }
    }
  }
}
