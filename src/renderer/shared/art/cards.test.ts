import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ALL_PICTURE_IDS } from '@shared/pictures'

// Thẻ từ SVG (thiết kế v2) sinh bởi scripts/design-data/export-cards.py: phải đủ mọi từ của Kids World.
const CARDS = resolve('src/renderer/shared/art/cards')
const PLACES = resolve('content/curated/kids/world/places')

describe('thẻ từ SVG', () => {
  const placeWords = readdirSync(PLACES)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      const d = JSON.parse(readFileSync(resolve(PLACES, f), 'utf8')) as {
        words: { picture: string }[]
      }
      return d.words.map((w) => w.picture)
    })
  const unique = [...new Set(placeWords)]

  it('mọi từ của các địa điểm Kids World đều có thẻ', () => {
    expect(unique.filter((id) => !existsSync(resolve(CARDS, `${id}.svg`)))).toEqual([])
  })

  it('mỗi file là SVG có viewBox, không chứa script, id là hình có trong danh sách', () => {
    const known = new Set(ALL_PICTURE_IDS)
    const bad: string[] = []
    for (const f of readdirSync(CARDS).filter((n) => n.endsWith('.svg'))) {
      const s = readFileSync(resolve(CARDS, f), 'utf8')
      const id = f.replace(/\.svg$/, '')
      if (!s.startsWith('<svg') || !s.includes('viewBox=') || /<script|onload=/i.test(s))
        bad.push(f)
      else if (!known.has(id)) bad.push(`${f} (id lạ)`)
    }
    expect(bad).toEqual([])
  })
})
