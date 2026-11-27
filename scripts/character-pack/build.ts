// pnpm pack:characters <thư mục nguồn> [file ra]
// Đóng gói nhân vật ngoài mã nguồn thành một file .eapack (JSON) để người dùng cài thủ công: Cài đặt → Gói nhân vật.
// Thư mục nguồn:
//   pack.json              { id, name, version, characters: [{ id, price, minLevel, emoji, name }] }
//   i18n/vi.json, en.json  { characters: { <id>: { name, desc } }, lines: { <id>: { <chủ đề>: [câu...] } } }
//   hit.json               (tuỳ chọn) { <id>: { all?, baby?, teen?, adult?, legend?: [[cx, cy, rx, ry]] } }
//   art/<id>.pet.json      hình (scripts/design-data/mascot/export.py với MASCOT_EXTRA_DIR)
//   art/<id>.quirks.json   (tuỳ chọn) hoạt ảnh tự do + cách di chuyển
// File ra mặc định: <thư mục nguồn>/dist/<id gói>.eapack. Kiểm tra bằng đúng schema + luật quét svg/css mà app dùng khi cài,
// cộng các kiểm tra khớp nối (đủ dáng, quirk, CSS cách di chuyển, chủ đề câu thoại); sai thì dừng và in lý do.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import {
  CHARACTER_PACK_EXT,
  CHARACTER_PACK_FORMAT,
  CHARACTER_PACK_MAX_BYTES,
  CharacterPackSchema,
  packCharacterProblems,
  packSecurityProblems
} from '../../src/shared/schemas/characterPack'

function fail(message: string): never {
  console.error(`pack:characters: ${message}`)
  process.exit(1)
}

function readJson(file: string, optional = false): unknown {
  if (!existsSync(file)) {
    if (optional) return undefined
    fail(`thiếu ${file}`)
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (err) {
    fail(`${file} không phải JSON: ${(err as Error).message}`)
  }
}

interface SourceCharacter {
  id: string
  price: number
  minLevel: number
  emoji: string
  name: string
}
interface SourceI18n {
  characters?: Record<string, { name: string; desc: string }>
  lines?: Record<string, Record<string, string[]>>
}

const [srcArg, outArg] = process.argv.slice(2)
if (!srcArg) fail('cách dùng: pnpm pack:characters <thư mục nguồn> [file ra]')
const src = resolve(srcArg)
const meta = readJson(join(src, 'pack.json')) as {
  id: string
  name: string
  version: number
  characters: SourceCharacter[]
}
if (!Array.isArray(meta?.characters)) fail('pack.json thiếu "characters"')
const i18n = {
  vi: readJson(join(src, 'i18n', 'vi.json')) as SourceI18n,
  en: readJson(join(src, 'i18n', 'en.json')) as SourceI18n
}
const hit = (readJson(join(src, 'hit.json'), true) ?? {}) as Record<string, unknown>

const characters = meta.characters.map((c) => {
  const text = (lang: 'vi' | 'en'): Record<string, unknown> => {
    const own = i18n[lang].characters?.[c.id]
    if (!own) fail(`i18n/${lang}.json thiếu characters.${c.id}`)
    return { name: own.name, desc: own.desc, lines: i18n[lang].lines?.[c.id] ?? {} }
  }
  const quirks = readJson(join(src, 'art', `${c.id}.quirks.json`), true)
  return {
    id: c.id,
    price: c.price,
    minLevel: c.minLevel,
    emoji: c.emoji,
    name: c.name,
    i18n: { vi: text('vi'), en: text('en') },
    ...(hit[c.id] ? { hit: hit[c.id] } : {}),
    ...(quirks ? { quirks } : {}),
    art: readJson(join(src, 'art', `${c.id}.pet.json`))
  }
})

// Ghi đúng dữ liệu nguồn (không ghi bản zod đã chuẩn hoá) để hình trong gói trùng khớp file art/<id>.pet.json
const pack = {
  format: CHARACTER_PACK_FORMAT,
  formatVersion: 1,
  id: meta.id,
  name: meta.name,
  version: meta.version,
  characters
}
const parsed = CharacterPackSchema.safeParse(pack)
if (!parsed.success) {
  fail(
    parsed.error.issues
      .slice(0, 10)
      .map((i) => `${i.path.join('.') || '(gốc)'}: ${i.message}`)
      .join('\n  ')
  )
}
const problems = [
  ...packSecurityProblems(parsed.data),
  ...parsed.data.characters.flatMap(packCharacterProblems)
]
if (problems.length) fail(`${problems.length} lỗi:\n  ${problems.join('\n  ')}`)

const text = JSON.stringify(pack)
if (Buffer.byteLength(text, 'utf8') > CHARACTER_PACK_MAX_BYTES)
  fail(`gói quá cỡ (${Buffer.byteLength(text, 'utf8')} byte)`)
const out = resolve(outArg ?? join(src, 'dist', `${meta.id}${CHARACTER_PACK_EXT}`))
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, text, 'utf8')
console.log(
  `${out}: ${characters.length} nhân vật (${characters.map((c) => c.id).join(', ')}), ` +
    `${(statSync(out).size / 1_048_576).toFixed(2)} MB`
)
