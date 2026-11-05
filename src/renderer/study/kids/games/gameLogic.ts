// Logic thuần của các mini-game của bé (không đụng Vue/IPC để test bằng Vitest trong Node).
import type { KidsAgeBand } from '@shared/kids'
import type { KidsStickers } from '@shared/schemas/kids'
import { PICTURE_GROUPS, groupOf, type PictureGroupId } from '@shared/pictureGroups'

export interface GameWord {
  pictureId: string
  word: string
  vi: string
}

/** Số từ tối thiểu để chơi đủ 4 lựa chọn; thiếu từ đã học thì bù từ đầu danh sách hình */
export const MIN_POOL = 6

export function shuffle<T>(list: readonly T[], rand: () => number = Math.random): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Từ để chơi: ưu tiên hình bé đã dán sticker (đã biết), thiếu thì bù theo thứ tự album */
export function gamePool(stickers: KidsStickers['stickers']): GameWord[] {
  const toWord = (s: KidsStickers['stickers'][number]): GameWord => ({
    pictureId: s.pictureId,
    word: s.word,
    vi: s.vi
  })
  const earned = stickers.filter((s) => s.earned).map(toWord)
  if (earned.length >= MIN_POOL) return earned
  const rest = stickers.filter((s) => !s.earned).map(toWord)
  return [...earned, ...rest.slice(0, MIN_POOL - earned.length)]
}

export function pickWords(pool: readonly GameWord[], n: number, rand = Math.random): GameWord[] {
  return shuffle(pool, rand).slice(0, n)
}

export interface MemoryCard {
  /** Khoá riêng từng lá (mỗi từ có 2 lá) */
  key: string
  pictureId: string
  word: string
}

/** Bộ bài ghép cặp: mỗi từ hai lá, đã xáo */
export function buildMemoryDeck(
  pool: readonly GameWord[],
  pairs: number,
  rand = Math.random
): MemoryCard[] {
  const cards = pickWords(pool, pairs, rand).flatMap((w) => [
    { key: `${w.pictureId}-a`, pictureId: w.pictureId, word: w.word },
    { key: `${w.pictureId}-b`, pictureId: w.pictureId, word: w.word }
  ])
  return shuffle(cards, rand)
}

export interface ChoiceRound {
  target: GameWord
  /** Gồm cả đáp án đúng, đã xáo */
  choices: GameWord[]
}

/** Một vòng "nghe từ, chọn hình": 1 đúng + (count-1) hình khác */
export function buildRound(
  pool: readonly GameWord[],
  target: GameWord,
  count: number,
  rand = Math.random
): ChoiceRound {
  const others = pickWords(
    pool.filter((w) => w.pictureId !== target.pictureId),
    count - 1,
    rand
  )
  return { target, choices: shuffle([target, ...others], rand) }
}

export function buildRounds(
  pool: readonly GameWord[],
  rounds: number,
  count: number,
  rand = Math.random
): ChoiceRound[] {
  return pickWords(pool, rounds, rand).map((t) => buildRound(pool, t, count, rand))
}

/** Sao theo tỉ lệ đúng ngay lần đầu; bé hoàn thành luôn có ít nhất 1 sao */
export function starsFor(correct: number, total: number): 1 | 2 | 3 {
  const ratio = total > 0 ? correct / total : 1
  return ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1
}

/** Độ khó và cách chơi theo nhóm tuổi: cùng bộ từ, khác số lượng và có/không hiện chữ */
export interface GameConfig {
  /** Số cặp bài ở game ghép cặp */
  pairs: number
  /** Số vòng ở các game nghe-chọn */
  rounds: number
  /** Số lựa chọn mỗi vòng */
  choices: number
  /** Hiện chữ dưới hình (3–4 tuổi chỉ có hình và âm thanh) */
  showText: boolean
  /** Có game điền chữ thiếu (7–8 tuổi) */
  spelling: boolean
  /** Số đếm lớn nhất ở game Đếm số */
  countMax: number
  /** Số ô nhóm ở game Phân loại */
  sortGroups: number
}

export const GAME_CONFIG: Record<KidsAgeBand, GameConfig> = {
  '3-4': {
    pairs: 3,
    rounds: 3,
    choices: 2,
    showText: false,
    spelling: false,
    countMax: 5,
    sortGroups: 2
  },
  '5-6': {
    pairs: 4,
    rounds: 5,
    choices: 3,
    showText: true,
    spelling: false,
    countMax: 8,
    sortGroups: 2
  },
  '7-8': {
    pairs: 6,
    rounds: 6,
    choices: 4,
    showText: true,
    spelling: true,
    countMax: 10,
    sortGroups: 3
  }
}

export interface SpellRound {
  target: GameWord
  /** Từ với một chữ bị thiếu; chỗ thiếu là '_' */
  pattern: string
  missing: string
  choices: string[]
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

/** Từ dùng được cho điền chữ: một từ, toàn chữ cái, 3–8 chữ */
export const isSpellable = (w: GameWord): boolean => /^[a-z]{3,8}$/i.test(w.word)

export function buildSpellRound(target: GameWord, count: number, rand = Math.random): SpellRound {
  const word = target.word.toLowerCase()
  const at = Math.floor(rand() * word.length)
  const missing = word[at]
  const others = shuffle(
    [...ALPHABET].filter((c) => c !== missing),
    rand
  ).slice(0, count - 1)
  return {
    target,
    pattern: `${word.slice(0, at)}_${word.slice(at + 1)}`,
    missing,
    choices: shuffle([missing, ...others], rand)
  }
}

export function buildSpellRounds(
  pool: readonly GameWord[],
  rounds: number,
  count: number,
  rand = Math.random
): SpellRound[] {
  return pickWords(pool.filter(isSpellable), rounds, rand).map((w) =>
    buildSpellRound(w, count, rand)
  )
}

export interface CountRound {
  /** Hình lặp lại `n` lần */
  target: GameWord
  n: number
  /** Gồm cả đáp án đúng, đã xáo */
  choices: number[]
}

export const NUMBER_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten'
]

export function buildCountRound(
  target: GameWord,
  max: number,
  count: number,
  rand = Math.random
): CountRound {
  const n = 1 + Math.floor(rand() * max)
  const others = shuffle(
    Array.from({ length: max }, (_, i) => i + 1).filter((v) => v !== n),
    rand
  ).slice(0, Math.min(count, max) - 1)
  return { target, n, choices: shuffle([n, ...others], rand) }
}

export function buildCountRounds(
  pool: readonly GameWord[],
  rounds: number,
  max: number,
  count: number,
  rand = Math.random
): CountRound[] {
  return pickWords(pool, rounds, rand).map((w) => buildCountRound(w, max, count, rand))
}

export interface SortRound {
  word: GameWord
  group: PictureGroupId
}

/**
 * Game Phân loại: chọn `groups` nhóm, mỗi vòng một hình thuộc một trong các nhóm đó. Ưu tiên từ bé đã biết (`pool`),
 * thiếu thì bù từ cả album (`all`) để luôn đủ vòng.
 */
export function buildSortRounds(
  pool: readonly GameWord[],
  all: readonly GameWord[],
  groups: number,
  rounds: number,
  rand = Math.random
): { groups: PictureGroupId[]; rounds: SortRound[] } {
  const perGroup = Math.ceil(rounds / groups)
  const inGroup = (list: readonly GameWord[], g: PictureGroupId): GameWord[] =>
    list.filter((w) => groupOf(w.pictureId) === g)
  const usable = PICTURE_GROUPS.filter((g) => inGroup(all, g.id).length >= perGroup).map(
    (g) => g.id
  )
  const chosen = shuffle(usable, rand).slice(0, groups)
  const out: SortRound[] = chosen.flatMap((g) => {
    const known = shuffle(inGroup(pool, g), rand)
    const rest = shuffle(
      inGroup(all, g).filter((w) => !known.some((k) => k.pictureId === w.pictureId)),
      rand
    )
    return [...known, ...rest].slice(0, perGroup).map((word) => ({ word, group: g }))
  })
  return { groups: chosen, rounds: shuffle(out, rand).slice(0, rounds) }
}
