import { describe, expect, it } from 'vitest'
import { isStudyPage, PLACE_GROUPS, PLACE_PAGES, resolveStudyPage } from './places'

describe('điều hướng trang Học tập', () => {
  it('Video không còn là trang/tab riêng: nằm trong trang Nghe', () => {
    expect(isStudyPage('videos')).toBe(false)
    expect(Object.values(PLACE_PAGES).flat()).not.toContain('videos')
    expect(PLACE_GROUPS.school?.find((g) => g.id === 'bank')?.pages).toEqual([
      'lessons',
      'grammar',
      'reading',
      'listening'
    ])
  })

  it("tên trang cũ 'videos' (study:open-page) → Nghe, mở sẵn khung Video", () => {
    expect(resolveStudyPage('videos')).toEqual({ page: 'listening', listeningView: 'video' })
  })

  it('trang thật giữ nguyên; tên lạ bị bỏ qua, không lỗi', () => {
    expect(resolveStudyPage('listening')).toEqual({ page: 'listening' })
    expect(resolveStudyPage('diary')).toEqual({ page: 'diary' })
    expect(resolveStudyPage('home')).toEqual({ page: 'home' })
    expect(resolveStudyPage('khong-co')).toBeNull()
    expect(resolveStudyPage('')).toBeNull()
  })
})
