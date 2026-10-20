import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  GrammarUnitFileSchema,
  LessonUnitFileSchema,
  ReadingUnitFileSchema,
  type LessonExercise
} from '@shared/schemas/lesson'
import { PhrasebookFileSchema } from '@shared/schemas/phrasebook'
import { KidsFileSchema } from '@shared/schemas/kids'
import { PICTURE_IDS } from '@shared/pictures'
import { PlacementBankFileSchema } from '@shared/schemas/placement'
import type { z } from 'zod'

// Kiểm tra toàn bộ nội dung bài học trong content/curated/lessons/*.json:
// đúng schema + các quy tắc nội dung (đáp án hợp lệ, id không trùng...).
// Chạy riêng: pnpm exec vitest run src/main/content/lessons.test.ts
const DIR = resolve('content/curated/lessons')
const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .sort()

const loaded = files.map((file) => ({
  file,
  raw: JSON.parse(readFileSync(resolve(DIR, file), 'utf8')) as unknown
}))

const norm = (s: string): string => s.trim().toLowerCase()

function problems(ex: LessonExercise, where: string): string[] {
  const out: string[] = []
  switch (ex.type) {
    case 'mcq':
    case 'listen':
      if (ex.answer >= ex.choices.length) out.push(`${where}: answer ngoài phạm vi choices`)
      if (new Set(ex.choices.map(norm)).size !== ex.choices.length)
        out.push(`${where}: choices trùng nhau`)
      break
    case 'picture':
      if (ex.answer >= ex.choices.length) out.push(`${where}: answer ngoài phạm vi choices`)
      if (new Set(ex.choices).size !== ex.choices.length) out.push(`${where}: các hình trùng nhau`)
      break
    case 'tf':
      if (ex.answer === 'ng' && !ex.ng) out.push(`${where}: đáp án "ng" cần đặt ng: true`)
      break
    case 'gap': {
      const blanks = ex.prompt.split('___').length - 1
      if (blanks !== 1) out.push(`${where}: prompt phải có đúng một "___" (có ${blanks})`)
      if (ex.choices) {
        if (new Set(ex.choices.map(norm)).size !== ex.choices.length)
          out.push(`${where}: choices trùng nhau`)
        if (!ex.answers.some((a) => ex.choices!.map(norm).includes(norm(a)))) {
          out.push(`${where}: choices không chứa đáp án đúng`)
        }
      }
      break
    }
    case 'order': {
      const words = ex.answer.trim().split(/\s+/).length
      if (words < 3 || words > 12) out.push(`${where}: câu sắp xếp cần 3–12 từ (có ${words})`)
      break
    }
    case 'match': {
      const lefts = ex.pairs.map((p) => norm(p.left))
      const rights = ex.pairs.map((p) => norm(p.right))
      if (new Set(lefts).size !== lefts.length || new Set(rights).size !== rights.length) {
        out.push(`${where}: các cặp ghép bị trùng`)
      }
      break
    }
  }
  return out
}

describe('nội dung bài học', () => {
  it('có ít nhất một file nội dung', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const { file, raw } of loaded) {
    describe(file, () => {
      it('đúng schema', () => {
        const parsed = LessonUnitFileSchema.safeParse(raw)
        if (!parsed.success) {
          const issues = parsed.error.issues
            .slice(0, 12)
            .map((i) => `${i.path.join('.')}: ${i.message}`)
          throw new Error(`Sai schema:\n  ${issues.join('\n  ')}`)
        }
      })

      it('quy tắc nội dung', () => {
        const parsed = LessonUnitFileSchema.parse(raw)
        const errors: string[] = []
        const ids = new Set<string>()
        for (const lesson of parsed.lessons) {
          if (!lesson.id.startsWith(`${parsed.unit.id}.`)) {
            errors.push(`${lesson.id}: id phải bắt đầu bằng "${parsed.unit.id}."`)
          }
          if (ids.has(lesson.id)) errors.push(`${lesson.id}: id trùng trong file`)
          ids.add(lesson.id)
          lesson.exercises.forEach((ex, i) => {
            errors.push(...problems(ex, `${lesson.id} bài tập #${i + 1} (${ex.type})`))
          })
          const text = JSON.stringify(lesson)
          if (/<\/?[a-z][^>]*>/i.test(text)) errors.push(`${lesson.id}: không dùng thẻ HTML`)
          if (lesson.exercises.length < 6) errors.push(`${lesson.id}: cần ít nhất 6 bài tập`)
          const types = new Set(lesson.exercises.map((e) => e.type))
          if (types.size < 2) errors.push(`${lesson.id}: nên trộn ít nhất 2 dạng bài tập`)
        }
        expect(errors).toEqual([])
      })
    })
  }

  it('id bài học và mã chương không trùng giữa các file', () => {
    const lessonIds = new Set<string>()
    const unitIds = new Set<string>()
    const orders = new Set<number>()
    for (const { raw } of loaded) {
      const parsed = LessonUnitFileSchema.safeParse(raw)
      if (!parsed.success) continue
      expect(unitIds.has(parsed.data.unit.id)).toBe(false)
      expect(orders.has(parsed.data.unit.order)).toBe(false)
      unitIds.add(parsed.data.unit.id)
      orders.add(parsed.data.unit.order)
      for (const l of parsed.data.lessons) {
        expect(lessonIds.has(l.id)).toBe(false)
        lessonIds.add(l.id)
      }
    }
  })
})

// --- Bài đọc, ngữ pháp, mẫu câu: cùng cách kiểm tra, quy tắc riêng ---

function loadDir(name: string): Array<{ file: string; raw: unknown }> {
  const dir = resolve('content/curated', name)
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => ({ file, raw: JSON.parse(readFileSync(resolve(dir, file), 'utf8')) as unknown }))
}

function lessonKindSuite(
  name: string,
  schema: z.ZodType<z.infer<typeof LessonUnitFileSchema>>,
  extra: (lesson: z.infer<typeof LessonUnitFileSchema>['lessons'][number]) => string[]
): void {
  describe(`nội dung ${name}`, () => {
    const entries = loadDir(name)
    it('có ít nhất một file nội dung', () => expect(entries.length).toBeGreaterThan(0))
    for (const { file, raw } of entries) {
      it(`${file}: đúng schema và quy tắc nội dung`, () => {
        const parsed = schema.safeParse(raw)
        if (!parsed.success) {
          const issues = parsed.error.issues
            .slice(0, 12)
            .map((i) => `${i.path.join('.')}: ${i.message}`)
          throw new Error(`Sai schema:\n  ${issues.join('\n  ')}`)
        }
        const errors: string[] = []
        const ids = new Set<string>()
        for (const lesson of parsed.data.lessons) {
          if (!lesson.id.startsWith(`${parsed.data.unit.id}.`))
            errors.push(`${lesson.id}: sai tiền tố id`)
          if (ids.has(lesson.id)) errors.push(`${lesson.id}: id trùng trong file`)
          ids.add(lesson.id)
          lesson.exercises.forEach((ex, i) =>
            errors.push(...problems(ex, `${lesson.id} bài tập #${i + 1} (${ex.type})`))
          )
          if (/<\/?[a-z][^>]*>/i.test(JSON.stringify(lesson)))
            errors.push(`${lesson.id}: không dùng thẻ HTML`)
          errors.push(...extra(lesson))
        }
        expect(errors).toEqual([])
      })
    }
  })
}

lessonKindSuite('readings', ReadingUnitFileSchema, (lesson) => {
  const out: string[] = []
  const passages = lesson.blocks.filter((b) => b.type === 'passage')
  if (passages.length === 0) out.push(`${lesson.id}: bài đọc cần có block passage`)
  for (const b of passages) {
    if (b.type !== 'passage') continue
    const words = b.paragraphs
      .map((p) => p.en)
      .join(' ')
      .split(/\s+/).length
    if (b.paragraphs.some((p) => !p.vi))
      out.push(`${lesson.id}: mỗi đoạn cần có bản dịch tiếng Việt`)
    if (words < 25) out.push(`${lesson.id}: bài đọc quá ngắn`)
  }
  if (!lesson.exercises.some((e) => e.type === 'tf'))
    out.push(`${lesson.id}: cần ít nhất một câu đúng/sai`)
  return out
})
lessonKindSuite('grammar', GrammarUnitFileSchema, () => [])

describe('nội dung mẫu câu', () => {
  const entries = loadDir('phrasebook')
  it('có ít nhất một file nội dung', () => expect(entries.length).toBeGreaterThan(0))
  const categoryIds = new Set<string>()
  for (const { file, raw } of entries) {
    it(`${file}: đúng schema, không trùng câu`, () => {
      const parsed = PhrasebookFileSchema.parse(raw)
      expect(categoryIds.has(parsed.category.id)).toBe(false)
      categoryIds.add(parsed.category.id)
      const en = parsed.phrases.map((p) => norm(p.en))
      expect(new Set(en).size).toBe(en.length)
    })
  }
})

describe('id nội dung dùng chung bảng tiến độ', () => {
  it('id bài học, bài đọc, ngữ pháp không trùng nhau', () => {
    const ids = new Set<string>()
    const unitIds = new Set<string>()
    const orders = new Map<string, Set<number>>()
    for (const [name, schema] of [
      ['lessons', LessonUnitFileSchema],
      ['readings', ReadingUnitFileSchema],
      ['grammar', GrammarUnitFileSchema]
    ] as const) {
      for (const { raw } of loadDir(name)) {
        const parsed = schema.parse(raw)
        expect(unitIds.has(parsed.unit.id), `chương ${parsed.unit.id} trùng`).toBe(false)
        unitIds.add(parsed.unit.id)
        const used = orders.get(name) ?? new Set<number>()
        expect(used.has(parsed.unit.order), `${name}: order ${parsed.unit.order} trùng`).toBe(false)
        used.add(parsed.unit.order)
        orders.set(name, used)
        for (const l of parsed.lessons) {
          expect(ids.has(l.id), `${l.id} trùng`).toBe(false)
          ids.add(l.id)
        }
      }
    }
  })
})

describe('nội dung kiểm tra đầu vào', () => {
  const entries = loadDir('placement')
  it('có ngân hàng ngữ pháp và đọc hiểu', () => {
    const skills = entries.map(({ raw }) => PlacementBankFileSchema.parse(raw).skill)
    expect(skills).toEqual(expect.arrayContaining(['grammar', 'reading']))
  })
  for (const { file, raw } of entries) {
    it(`${file}: đúng schema, đáp án hợp lệ, id không trùng`, () => {
      const data = PlacementBankFileSchema.parse(raw)
      const errors: string[] = []
      const ids = new Set<string>()
      for (const item of data.items) {
        if (ids.has(item.id)) errors.push(`${item.id}: id trùng`)
        ids.add(item.id)
        if (item.answer >= item.choices.length) errors.push(`${item.id}: answer ngoài phạm vi`)
        if (new Set(item.choices.map(norm)).size !== item.choices.length)
          errors.push(`${item.id}: choices trùng`)
        if (data.skill === 'grammar' && item.prompt.split('___').length !== 2) {
          errors.push(`${item.id}: câu ngữ pháp cần đúng một "___"`)
        }
        if (data.skill === 'reading' && !item.passage) errors.push(`${item.id}: thiếu passage`)
      }
      expect(errors).toEqual([])
    })
  }
  it('mỗi kỹ năng phủ nhiều bậc để bài kiểm tra thích nghi được', () => {
    for (const skill of ['grammar', 'reading'] as const) {
      const levels = new Set<string>()
      for (const { raw } of entries) {
        const data = PlacementBankFileSchema.parse(raw)
        if (data.skill === skill) data.items.forEach((i) => levels.add(i.level))
      }
      expect(levels.size, skill).toBeGreaterThanOrEqual(8)
    }
  })
})

describe('nội dung cho trẻ em', () => {
  const entries = loadDir('kids')
  it('có file nội dung', () => expect(entries.length).toBeGreaterThan(0))
  const activityIds = new Set<string>()
  const unitIds = new Set<string>()
  const orders = new Set<number>()
  for (const { file, raw } of entries) {
    it(`${file}: đúng schema, hình tồn tại, quy tắc theo loại hoạt động`, () => {
      const data = KidsFileSchema.parse(raw)
      expect(unitIds.has(data.unit.id)).toBe(false)
      unitIds.add(data.unit.id)
      expect(orders.has(data.unit.order)).toBe(false)
      orders.add(data.unit.order)
      expect(PICTURE_IDS).toContain(data.unit.picture)
      const errors: string[] = []
      for (const a of data.activities) {
        if (activityIds.has(a.id)) errors.push(`${a.id}: id trùng`)
        activityIds.add(a.id)
        if (a.picture && !PICTURE_IDS.includes(a.picture))
          errors.push(`${a.id}: hình ${a.picture} không tồn tại`)
        const texts = a.items.map((i) => i.text.toLowerCase())
        if (new Set(texts).size !== texts.length) errors.push(`${a.id}: mục trùng nhau`)
        for (const item of a.items) {
          if (item.picture && !PICTURE_IDS.includes(item.picture)) {
            errors.push(`${a.id}/${item.text}: hình ${item.picture} không tồn tại`)
          }
          if (a.kind === 'blend') {
            if (!item.letters || !item.sounds)
              errors.push(`${a.id}/${item.text}: thiếu letters/sounds`)
            else {
              if (item.letters.join('') !== item.text)
                errors.push(`${a.id}/${item.text}: letters không ghép thành từ`)
              if (item.letters.length !== item.sounds.length)
                errors.push(`${a.id}/${item.text}: số âm khác số chữ`)
            }
          }
          if ((a.kind === 'sounds' || a.kind === 'blend') && !item.picture) {
            errors.push(`${a.id}/${item.text}: cần có hình để chơi nghe → chọn hình`)
          }
        }
        // Chơi chọn hình cần ít nhất 3 hình khác nhau để có lựa chọn
        const pics = new Set(a.items.map((i) => i.picture).filter(Boolean))
        if (a.kind !== 'sight' && a.kind !== 'letters' && pics.size < 3)
          errors.push(`${a.id}: cần ≥ 3 hình khác nhau`)
      }
      expect(errors).toEqual([])
    })
  }
})
