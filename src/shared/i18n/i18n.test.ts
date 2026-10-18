import { describe, expect, it } from 'vitest'
import { messages, t } from './index'

/** Liệt kê mọi khoá lá dạng 'a.b.c' (mảng tính là lá) */
function keys(obj: unknown, prefix = ''): string[] {
  if (Array.isArray(obj) || typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
}

describe('i18n', () => {
  it('vi và en có cùng bộ khoá', () => {
    expect(keys(messages.en).sort()).toEqual(keys(messages.vi).sort())
  })

  it('thay tham số và rơi về khoá khi không tìm thấy', () => {
    expect(t('vi', 'stats.level', { level: 7 })).toBe('Lv 7')
    expect(t('en', 'tray.quickTranslate', { shortcut: 'Ctrl+Alt+T' })).toBe(
      'Quick translate: Ctrl+Alt+T'
    )
    expect(t('vi', 'khong.ton.tai')).toBe('khong.ton.tai')
  })
})
