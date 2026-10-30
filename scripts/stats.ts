// pnpm stats — in các số liệu của app (phiên bản, nội dung tự soạn, kênh IPC, migration, nhân vật, cửa hàng)
// để đối chiếu/cập nhật docs/17-metrics.md. Số liệu từ điển (pack) lấy bằng `pnpm content:stats`.
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHARACTER_IDS } from '../src/shared/characters'
import { INVOKE_CHANNELS, SEND_CHANNELS, EVENT_NAMES } from '../src/shared/ipc-channels'
import { ALL_PICTURE_IDS } from '../src/shared/pictures'
import { shopCatalog } from '../src/shared/shop'
import { LANDMARK_IDS } from '../src/shared/voxels/landmarks'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const CURATED = join(ROOT, 'content', 'curated')

/** Đếm phần tử của mảng `key` trong mọi file .json của một thư mục curated */
function countItems(dir: string, key: string): { files: number; items: number } {
  const files = readdirSync(join(CURATED, dir)).filter((f) => f.endsWith('.json'))
  let items = 0
  for (const f of files) {
    const data = JSON.parse(readFileSync(join(CURATED, dir, f), 'utf8')) as Record<string, unknown>
    const arr = data[key]
    if (Array.isArray(arr)) items += arr.length
  }
  return { files: files.length, items }
}

/** Tổng số bài tập (exercises) của các bài học nền tảng */
function countLessonExercises(): number {
  let n = 0
  for (const f of readdirSync(join(CURATED, 'lessons')).filter((x) => x.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(join(CURATED, 'lessons', f), 'utf8')) as {
      lessons: Array<{ exercises?: unknown[] }>
    }
    for (const l of data.lessons) n += l.exercises?.length ?? 0
  }
  return n
}

/** Số hoạt ảnh của một nhân vật (giai đoạn trưởng thành): tổng / quirk_* / click_* */
function countAnimations(id: string): string {
  const sheet = JSON.parse(
    readFileSync(
      join(ROOT, 'src/renderer/mascot/assets/characters', id, 'adult', 'sheet.json'),
      'utf8'
    )
  ) as { animations: Record<string, unknown> }
  const names = Object.keys(sheet.animations)
  const n = (prefix: string): number => names.filter((x) => x.startsWith(prefix)).length
  return `${names.length} (quirk ${n('quirk_')}, click ${n('click_')})`
}

/** Số hình từ vector (src/renderer/shared/art/pictures/*.ts, mỗi file xuất PICTURES) */
function countVectorPictures(): number {
  const dir = join(ROOT, 'src/renderer/shared/art/pictures')
  let n = 0
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
    // tsx chạy script dạng CommonJS → require được file .ts (import động cần top-level await, không có ở CJS)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require(join(dir, f)) as { PICTURES: Record<string, unknown> }
    n += Object.keys(m.PICTURES).length
  }
  return n
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string }
const shop = shopCatalog()
const byKind = (kind: string): number => shop.filter((s) => s.kind === kind).length
const migrations = readdirSync(join(ROOT, 'src/main/db/migrations')).filter((f) =>
  f.endsWith('.sql')
).length

const rows: Array<[string, string | number]> = [
  ['appVersion', pkg.version],
  ['lessons (bài học nền tảng)', countItems('lessons', 'lessons').items],
  ['lessons chapters (chương)', countItems('lessons', 'lessons').files],
  ['lesson exercises (bài tập)', countLessonExercises()],
  ['grammar (điểm ngữ pháp)', countItems('grammar', 'lessons').items],
  ['readings (bài đọc)', countItems('readings', 'lessons').items],
  ['listening (bài nghe)', countItems('listening', 'lessons').items],
  ['phrasebook (mẫu câu)', countItems('phrasebook', 'phrases').items],
  ['placement (câu kiểm tra đầu vào)', countItems('placement', 'items').items],
  ['kids (hoạt động trẻ em)', countItems('kids', 'activities').items],
  ['kids world places (nơi trên bản đồ)', countItems('kids/world/places', 'words').files],
  ['kids world words (từ trên bản đồ)', countItems('kids/world/places', 'words').items],
  ['kids world landmarks (công trình voxel)', LANDMARK_IDS.length],
  ['pictures (hình từ: pixel + Twemoji)', ALL_PICTURE_IDS.length],
  ['vector pictures (hình từ vẽ vector, ưu tiên)', countVectorPictures()],
  ['courses (khoá) files', countItems('courses', 'units').files],
  ['courses (unit)', countItems('courses', 'units').items],
  ['characters', CHARACTER_IDS.length],
  ...CHARACTER_IDS.map((id): [string, string] => [`animations ${id} (adult)`, countAnimations(id)]),
  ['shop food', byKind('food')],
  ['shop accessory', byKind('accessory')],
  ['shop character', byKind('character')],
  ['ipc invoke', INVOKE_CHANNELS.length],
  ['ipc send', SEND_CHANNELS.length],
  ['ipc events', EVENT_NAMES.length],
  ['db migrations', migrations]
]
for (const [k, v] of rows) console.log(`${k.padEnd(34)} ${v}`)
