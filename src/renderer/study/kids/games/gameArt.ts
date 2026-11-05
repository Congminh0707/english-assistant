// Tranh nền + sprite 6 khung của 5 mini-game (docs/27-kids-game-art-prompts.md), nhúng bằng scripts/design-data/embed-kids-games.py.
// File WebP do Vite đóng gói ('self', hợp CSP).
export type GameKey = 'memory' | 'balloon' | 'pet' | 'fishing' | 'spell' | 'count' | 'sort'

const urls = import.meta.glob<string>('./art/*/*.webp', {
  eager: true,
  query: '?url',
  import: 'default'
})

export const FRAMES = 6

// Game chưa có tranh riêng mượn tạm tranh của game khác (chờ batch ChatGPT, docs/27)
const BORROW: Partial<Record<GameKey, GameKey>> = { count: 'balloon', sort: 'pet' }

export const artUrl = (game: GameKey, name: string): string =>
  urls[`./art/${game}/${name}.webp`] ??
  (BORROW[game] ? (urls[`./art/${BORROW[game]}/${name}.webp`] ?? '') : '')
export const bgUrl = (game: GameKey): string => artUrl(game, 'bg')
export const frameUrls = (game: GameKey, name: string): string[] =>
  Array.from({ length: FRAMES }, (_, i) => artUrl(game, `${name}-${i}`))

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const warmed = new Set<string>()
/** Tải sẵn các khung để lần đầu phát không chớp */
export function preload(list: string[]): void {
  for (const u of list) {
    if (!u || warmed.has(u)) continue
    warmed.add(u)
    new Image().src = u
  }
}
