// Logic thuần của các mini-game của bé (không đụng Vue/IPC để test bằng Vitest trong Node).
import type { KidsStickers } from '@shared/schemas/kids'

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
