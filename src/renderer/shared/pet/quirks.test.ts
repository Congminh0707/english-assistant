import { describe, expect, it } from 'vitest'
import { quirkPose, quirksOf, registerQuirks, walkMotionOf } from './quirks'

// Khớp giữa `<id>.quirks.json` (thời gian, biến thể, cách di chuyển) và hình trong `<id>.pet.json`: cả hai do export.py ghi.
// Nhân vật của gói nhân vật được kiểm tra khi đóng gói (packCharacterProblems trong @shared/schemas/characterPack).
interface PetArt {
  css: string
  stages: Record<string, { states: Record<string, string> }>
  hideAcc?: string[]
}
const arts = import.meta.glob<PetArt>('../art/pets/*.pet.json', { eager: true, import: 'default' })
const idOf = (path: string): string => path.split('/').pop()!.replace('.pet.json', '')
const STAGES = ['baby', 'teen', 'adult', 'legend']

describe('hoạt ảnh tự do và cách di chuyển của nhân vật', () => {
  it('nhân vật không có file quirks thì không có gì riêng', () => {
    expect(quirksOf('bi')).toEqual({})
    expect(walkMotionOf('bi')).toBe('')
    expect(quirksOf('khong-co')).toEqual({})
  })

  it('chọn biến thể theo số ngẫu nhiên, một biến thể thì giữ nguyên tên', () => {
    expect(quirkPose('quirk_a', { seconds: 5, variants: 1 }, 0.7)).toBe('quirk_a')
    expect(quirkPose('quirk_a', { seconds: 5, variants: 3 }, 0)).toBe('quirk_a_1')
    expect(quirkPose('quirk_a', { seconds: 5, variants: 3 }, 0.5)).toBe('quirk_a_2')
    expect(quirkPose('quirk_a', { seconds: 5, variants: 3 }, 0.999)).toBe('quirk_a_3')
  })

  for (const [path, art] of Object.entries(arts)) {
    const id = idOf(path)
    const quirks = quirksOf(id)
    const walk = walkMotionOf(id)
    if (!Object.keys(quirks).length && !walk) continue

    it(`${id}: mỗi quirk có hình ở cả 4 giai đoạn, đủ biến thể, thời gian hợp lý`, () => {
      for (const [name, def] of Object.entries(quirks)) {
        expect(name.startsWith('quirk_')).toBe(true)
        expect(def.seconds).toBeGreaterThanOrEqual(2)
        expect(def.seconds).toBeLessThanOrEqual(14)
        const keys = Array.from({ length: def.variants }, (_, k) =>
          quirkPose(name, def, k / def.variants)
        )
        for (const stage of STAGES) {
          for (const key of keys)
            expect(art.stages[stage].states[key], `${stage}/${key}`).toBeTruthy()
        }
      }
      // Không có dáng quirk thừa trong pet.json mà não không biết tên
      const known = new Set(
        Object.entries(quirks).flatMap(([name, def]) =>
          Array.from({ length: def.variants }, (_, k) => quirkPose(name, def, k / def.variants))
        )
      )
      for (const stage of STAGES) {
        for (const key of Object.keys(art.stages[stage].states)) {
          if (key.startsWith('quirk_')) expect(known.has(key), `${stage}/${key}`).toBe(true)
        }
      }
      for (const key of art.hideAcc ?? []) expect(known.has(key), `hideAcc ${key}`).toBe(true)
    })

    it(`${id}: cách di chuyển riêng có lớp CSS trong pet.json`, () => {
      if (walk) expect(art.css).toContain(`.tv-${walk} .mv`)
    })
  }

  it('nhân vật của gói nhân vật: đăng ký hoạt ảnh tự do và cách di chuyển', () => {
    registerQuirks('testy', {
      walk: 'ftesty-walk',
      quirks: { quirk_spin: { seconds: 4, variants: 2 } }
    })
    expect(quirksOf('testy')).toEqual({ quirk_spin: { seconds: 4, variants: 2 } })
    expect(walkMotionOf('testy')).toBe('ftesty-walk')
  })
})
