import { describe, expect, it } from 'vitest'
import { createAppI18n, petName, withPetName } from './i18n'

describe('tên thú cưng trong chuỗi giao diện', () => {
  it('thay %PET% bằng tên người dùng đặt (cả khi gọi t() qua vue-i18n)', () => {
    const i18n = createAppI18n('vi')
    petName.value = 'Mimi'
    expect(i18n.global.t('quiz.saved')).toBe('Đã lưu! Mimi sẽ hỏi lại bạn sau ✨')
    expect(withPetName('%PET% đói rồi... %PET%')).toBe('Mimi đói rồi... Mimi')
    petName.value = 'Kuro'
    expect(i18n.global.t('quiz.saved')).toContain('Kuro')
  })

  it('không còn tên "Bi" viết cứng trong chuỗi giao diện', () => {
    const i18n = createAppI18n('en')
    petName.value = 'Coco'
    const lines = i18n.global.tm('mascot.lines.hungry') as string[]
    const rendered = lines.map((l) => withPetName(i18n.global.rt(l)))
    expect(rendered.some((l) => l.includes('Coco'))).toBe(true)
    expect(rendered.every((l) => !/\bBi\b/.test(l))).toBe(true)
  })
})

describe('số nhiều', () => {
  it('study.lessons.autoSaved: en đổi dạng theo n, vi một dạng', () => {
    const en = createAppI18n('en').global
    expect(en.t('study.lessons.autoSaved', { n: 1 }, 1)).toBe(
      'Saved 1 new word from this lesson to your word list'
    )
    expect(en.t('study.lessons.autoSaved', { n: 3 }, 3)).toBe(
      'Saved 3 new words from this lesson to your word list'
    )
    const vi = createAppI18n('vi').global
    expect(vi.t('study.lessons.autoSaved', { n: 1 }, 1)).toBe('Đã lưu 1 từ mới của bài vào sổ từ')
    expect(vi.t('study.lessons.autoSaved', { n: 3 }, 3)).toBe('Đã lưu 3 từ mới của bài vào sổ từ')
  })
})
