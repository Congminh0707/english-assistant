import { describe, expect, it } from 'vitest'
import { FREE_WRITING_BANDS } from '@shared/freeWriting'
import { FreeWritingTopicFileSchema } from '@shared/schemas/freeWriting'
import { bundledFreeWritingFiles } from './bundledLessons'
import { FreeWritingTopics } from './FreeWritingTopics'

const VI_DIACRITIC = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

describe('đề viết tự do (content/curated/free-writing)', () => {
  it('có file, mọi file đúng schema', () => {
    expect(bundledFreeWritingFiles.length).toBeGreaterThan(0)
    for (const file of bundledFreeWritingFiles) {
      const r = FreeWritingTopicFileSchema.safeParse(file)
      expect(r.success, r.success ? '' : JSON.stringify(r.error.issues[0])).toBe(true)
    }
  })

  it('mã đề không trùng; khoảng 30 đề, mỗi bậc A1–B2 ít nhất 6 đề', () => {
    const ids = new Set<string>()
    let count = 0
    for (const file of bundledFreeWritingFiles) {
      const r = FreeWritingTopicFileSchema.safeParse(file)
      if (!r.success) continue
      for (const t of r.data.topics) {
        expect(ids.has(t.id), `trùng mã ${t.id}`).toBe(false)
        ids.add(t.id)
        count++
      }
    }
    expect(count).toBeGreaterThanOrEqual(28)
    const topics = new FreeWritingTopics(bundledFreeWritingFiles).list()
    expect(topics).toHaveLength(count)
    for (const band of FREE_WRITING_BANDS) {
      expect(topics.filter((t) => t.band === band).length, band).toBeGreaterThanOrEqual(6)
    }
  })

  it('tên đề tiếng Việt có dấu; đề A1–A2 viết bằng tiếng Việt, mã đề bắt đầu bằng bậc', () => {
    for (const t of new FreeWritingTopics(bundledFreeWritingFiles).list()) {
      expect(VI_DIACRITIC.test(t.title), t.id).toBe(true)
      expect(t.id.startsWith(`${t.band.toLowerCase()}-`), t.id).toBe(true)
      if (t.band === 'A1' || t.band === 'A2') expect(VI_DIACRITIC.test(t.prompt), t.id).toBe(true)
    }
  })
})
