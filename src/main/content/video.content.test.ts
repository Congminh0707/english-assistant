import { describe, expect, it } from 'vitest'
import { VideoBankFileSchema } from '@shared/schemas/video'
import { bundledVideoFiles } from './bundledLessons'

describe('danh mục video (content/curated/videos)', () => {
  it('mọi file đúng schema', () => {
    for (const file of bundledVideoFiles) {
      const r = VideoBankFileSchema.safeParse(file)
      expect(r.success, r.success ? '' : JSON.stringify(r.error.issues[0])).toBe(true)
    }
  })

  it('id và videoId không trùng', () => {
    const ids = new Set<string>()
    const videoIds = new Set<string>()
    for (const file of bundledVideoFiles) {
      const r = VideoBankFileSchema.safeParse(file)
      if (!r.success) continue
      for (const v of r.data.videos) {
        expect(ids.has(v.id), `trùng id ${v.id}`).toBe(false)
        expect(videoIds.has(v.videoId), `trùng videoId ${v.videoId}`).toBe(false)
        ids.add(v.id)
        videoIds.add(v.videoId)
      }
    }
  })
})
