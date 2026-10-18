// pnpm content:validate [--pack path/to/file.eapack]
// Không có --pack: kiểm tra normalized/*.jsonl (schema, license, nguồn, trùng lặp, tham chiếu).
// Có --pack: kiểm tra thêm một file .eapack đã build (manifest, sha256, integrity, license trong DB).
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { PackManifest, isAllowedLicense } from '../../src/shared/schemas/content'
import { log } from './lib/io'
import { readZipEntry } from './lib/zip'
import { validateNormalized } from './validate/normalized'

async function validatePack(path: string): Promise<string[]> {
  const errors: string[] = []
  const manifest = PackManifest.safeParse(
    JSON.parse(new TextDecoder().decode(await readZipEntry(path, 'manifest.json')))
  )
  if (!manifest.success) return [`manifest.json: ${manifest.error.message}`]
  await readZipEntry(path, 'LICENSES.md')
  const dbBytes = await readZipEntry(path, 'content.db')
  const expected = manifest.data.files.find((f) => f.path === 'content.db')
  const sha = createHash('sha256').update(dbBytes).digest('hex')
  if (!expected || expected.sha256 !== sha) errors.push('content.db sha256 does not match manifest')

  const dir = await mkdtemp(join(tmpdir(), 'eapack-'))
  try {
    const dbPath = join(dir, 'content.db')
    await writeFile(dbPath, dbBytes)
    const db = new DatabaseSync(dbPath, { readOnly: true })
    const ok = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string }
    if (ok.integrity_check !== 'ok') errors.push(`integrity_check: ${ok.integrity_check}`)
    for (const row of db.prepare('SELECT id, license FROM sources').all() as {
      id: string
      license: string
    }[]) {
      if (!isAllowedLicense(row.license))
        errors.push(`sources.${row.id}: license ${row.license} not allowed`)
    }
    for (const [table, n] of Object.entries(manifest.data.counts)) {
      const row = db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }
      if (row.n !== n) errors.push(`${table}: manifest says ${n}, db has ${row.n}`)
    }
    const orphan = db
      .prepare(
        'SELECT count(*) AS n FROM word_forms f LEFT JOIN words w ON w.id = f.word_id WHERE w.id IS NULL'
      )
      .get() as { n: number }
    if (orphan.n) errors.push(`word_forms: ${orphan.n} rows point to missing words`)
    db.close()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
  return errors
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const packIdx = args.indexOf('--pack')
  const v = await validateNormalized()
  log(
    `normalized: ${v.counts.words} words, ${v.counts.sentences} sentences, ${v.counts.decks} decks; sources: ${[...v.sourceIds].sort().join(', ')}`
  )
  const errors = [...v.errors]
  if (packIdx >= 0) {
    const path = args[packIdx + 1]
    if (!path) throw new Error('--pack needs a file path')
    const packErrors = await validatePack(path)
    log(`pack ${path}: ${packErrors.length ? `${packErrors.length} errors` : 'ok'}`)
    errors.push(...packErrors)
  }
  if (errors.length) {
    for (const e of errors.slice(0, 50)) console.error('  ✗', e)
    console.error(`✗ ${errors.length} errors`)
    process.exit(1)
  }
  log('✔ content valid')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
