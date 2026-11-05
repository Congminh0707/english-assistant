import { describe, expect, it } from 'vitest'
import { ALL_PICTURE_IDS } from './pictures'
import { PICTURE_GROUPS, groupOf } from './pictureGroups'

describe('pictureGroups', () => {
  it('mọi thành viên là hình có thật và không trùng nhóm', () => {
    const seen = new Set<string>()
    for (const g of PICTURE_GROUPS) {
      expect(ALL_PICTURE_IDS, g.id).toContain(g.pictureId)
      expect(g.members.length, g.id).toBeGreaterThanOrEqual(8)
      for (const m of g.members) {
        expect(ALL_PICTURE_IDS, `${g.id}/${m}`).toContain(m)
        expect(seen.has(m), `${m} trùng`).toBe(false)
        seen.add(m)
      }
    }
  })

  it('groupOf tra đúng nhóm', () => {
    expect(groupOf('dog')).toBe('animal')
    expect(groupOf('pizza')).toBe('food')
    expect(groupOf('red')).toBeUndefined()
  })
})
