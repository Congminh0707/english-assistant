import { describe, expect, it } from 'vitest'
import { shopCatalog, toggleEquipped } from './shop'

describe('shopCatalog', () => {
  it('có đồ ăn có giá và phụ kiện; đồ chỉ có qua thưởng không bán', () => {
    const ids = shopCatalog().map((e) => e.id)
    expect(ids).toContain('food:onigiri')
    expect(ids).toContain('acc:crown')
    expect(ids).toContain('char:draco')
    expect(ids).not.toContain('char:bi')
    expect(ids).toContain('acc:wings')
    expect(ids).not.toContain('food:birthday-cake')
    expect(shopCatalog().every((e) => e.price > 0)).toBe(true)
  })
})

describe('toggleEquipped', () => {
  it('đeo thêm món ở vị trí khác thì giữ nguyên các món cũ', () => {
    expect(toggleEquipped(['acc:glasses'], 'acc:bow', true)).toEqual(['acc:glasses', 'acc:bow'])
  })

  it('đeo món cùng vị trí thì thay món cũ', () => {
    expect(toggleEquipped(['acc:bow'], 'acc:hat', true)).toEqual(['acc:hat'])
    expect(toggleEquipped(['acc:hat'], 'acc:crown', true)).toEqual(['acc:crown'])
    expect(toggleEquipped(['acc:cape'], 'acc:wings', true)).toEqual(['acc:wings'])
  })

  it('tháo một món, bỏ qua id lạ', () => {
    expect(toggleEquipped(['acc:bow', 'acc:glasses'], 'acc:bow', false)).toEqual(['acc:glasses'])
    expect(toggleEquipped(['bogus', 'acc:bow'], 'acc:glasses', true)).toEqual([
      'acc:bow',
      'acc:glasses'
    ])
  })
})
