import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { missingPictures, validateWorld } from '@shared/kidsWorld'
import { PICTURE_WORDS } from '@shared/pictures'
import { LANDMARK_IDS } from '@shared/voxels/landmarks'
import { KidsPlaceFileSchema, KidsWorldFileSchema } from '@shared/schemas/kidsWorld'
import { bundledKidsPlaceFiles, bundledKidsWorldFiles } from './bundledLessons'

// Kiểm tra nội dung bản đồ thế giới của bé (content/curated/kids/world/) theo docs/19 §2.1, §4.3.
// Chạy riêng: pnpm exec vitest run src/main/content/kidsWorld.content.test.ts
const sensitive = new Set(
  Object.keys(
    JSON.parse(
      readFileSync(resolve('content/curated/vocab/sensitive-words.json'), 'utf8')
    ) as object
  )
    .filter((k) => !k.startsWith('$'))
    .map((k) => k.toLowerCase())
)

describe('nội dung bản đồ thế giới của bé', () => {
  it('có đúng một world.json và có nơi', () => {
    expect(bundledKidsWorldFiles).toHaveLength(1)
    expect(bundledKidsPlaceFiles.length).toBeGreaterThan(0)
  })

  const world = KidsWorldFileSchema.parse(bundledKidsWorldFiles[0])
  const places = bundledKidsPlaceFiles.map((raw) => KidsPlaceFileSchema.parse(raw))

  it('đủ hình cho mọi từ', () => {
    expect(missingPictures(places, PICTURE_WORDS)).toEqual([])
  })

  it('không có lỗi nội dung (luật "cùng tầng ngang nhau", câu, từ nhạy cảm)', () => {
    const errors = validateWorld(world, places, {
      pictureWords: PICTURE_WORDS,
      sensitive,
      landmarks: new Set(LANDMARK_IDS)
    })
      .filter((i) => i.level === 'error')
      .map((i) => `${i.where}: ${i.message}`)
    expect(errors).toEqual([])
  })

  it('không có cảnh báo (ngoài việc chưa có người duyệt)', () => {
    const warnings = validateWorld(world, places, { pictureWords: PICTURE_WORDS, sensitive })
      .filter((i) => i.level === 'warning')
      .map((i) => `${i.where}: ${i.message}`)
    expect(warnings).toEqual([])
  })

  it('tầng 1 có 12 nơi, 3 miền × 4, thứ tự và thứ tự gợi ý liền mạch', () => {
    const vn = places.filter((p) => p.place.tier === 'vn').map((p) => p.place)
    expect(vn).toHaveLength(12)
    for (const region of ['north', 'central', 'south']) {
      expect(
        vn.filter((p) => p.region === region),
        region
      ).toHaveLength(4)
    }
    expect(vn.map((p) => p.order).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1)
    )
    expect(vn.map((p) => p.suggestOrder).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1)
    )
  })
})
