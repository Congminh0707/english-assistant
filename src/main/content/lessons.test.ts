import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LessonUnitFileSchema, type LessonExercise } from '@shared/schemas/lesson'

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
