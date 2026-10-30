// Bản đồ thế giới của bé — phần thuần dùng ở main, renderer, script nội dung và test:
// mức nhớ của từ, tiến độ nơi, mở tầng, chọn đợt từ cho một lượt chơi, kiểm tra nội dung. docs/19-kids-world.md
import type { KidsPlaceFile, KidsTier, KidsWorldFile } from './schemas/kidsWorld'

const DAY_MS = 86_400_000

/** Số từ tối đa trong một lượt chơi tại một nơi */
export const KIDS_VISIT_SIZE = 4
/** Độ ổn định (ngày) để từ "nở hoa" */
export const KIDS_FLOWER_STABILITY = 21
/** Đến hạn quá chừng này thì cây "khát nước" (héo nhẹ) */
export const KIDS_THIRSTY_MS = DAY_MS

// --- Mức nhớ của từ ---

export const WORD_STAGES = ['hidden', 'seed', 'sprout', 'flower'] as const
export type WordStage = (typeof WORD_STAGES)[number]

/** Phần thẻ FSRS cần để tính mức nhớ (state: 0 mới, 1 đang học, 2 ôn, 3 học lại) */
export interface StageCard {
  state: number
  stability: number
  due: number
}

/**
 * Mức nhớ suy ra từ thẻ FSRS (không lưu thêm). Thẻ đã vào ôn thì không bao giờ tụt về hạt giống
 * (học lại vẫn tính là mầm) → điều kiện mở tầng theo tỉ lệ mầm không bị mất sau khi đã đạt.
 */
export function wordStage(card: StageCard | null | undefined): WordStage {
  if (!card) return 'hidden'
  if (card.state === 0 || card.state === 1) return 'seed'
  return card.stability >= KIDS_FLOWER_STABILITY ? 'flower' : 'sprout'
}

/** Cây "khát nước": thẻ đã học và quá hạn ôn hơn một ngày — chỉ là gợi ý, không hạ mức */
export function isThirsty(card: StageCard | null | undefined, now: number): boolean {
  return !!card && card.state !== 0 && now - card.due > KIDS_THIRSTY_MS
}

export const atLeastSprout = (stage: WordStage | undefined): boolean =>
  stage === 'sprout' || stage === 'flower'

// --- Nơi & tầng ---

export type PlaceState = 'locked' | 'open' | 'done'

/** Tiến độ một nơi: số từ mới của nơi đã qua đủ 5 bước */
export function placeProgress(
  words: readonly string[],
  completedWords: ReadonlySet<string>
): { done: number; total: number } {
  return { done: words.filter((w) => completedWords.has(w)).length, total: words.length }
}

export function placeState(
  tierOpen: boolean,
  words: readonly string[],
  completedWords: ReadonlySet<string>
): PlaceState {
  if (!tierOpen) return 'locked'
  const { done, total } = placeProgress(words, completedWords)
  return total > 0 && done === total ? 'done' : 'open'
}

/** Một nơi rút gọn để tính mở tầng */
export interface PlaceWords {
  id: string
  tier: string
  words: readonly string[]
}

/**
 * Tầng đã mở chưa: tầng không có điều kiện thì mở sẵn; ngược lại cần đủ tỉ lệ nơi đã xong
 * (làm tròn lên: 0.75 × 12 → 9 nơi) và đủ tỉ lệ từ đạt mức mầm của tầng điều kiện.
 */
export function tierUnlocked(
  tier: Pick<KidsTier, 'unlock'>,
  places: readonly PlaceWords[],
  donePlaces: ReadonlySet<string>,
  stages: ReadonlyMap<string, WordStage>
): boolean {
  const rule = tier.unlock
  if (!rule) return true
  const prev = places.filter((p) => p.tier === rule.tier)
  if (prev.length === 0) return false
  const needPlaces = Math.ceil(prev.length * rule.placesDoneShare - 1e-9)
  if (prev.filter((p) => donePlaces.has(p.id)).length < needPlaces) return false
  const words = prev.flatMap((p) => p.words)
  const sprouted = words.filter((w) => atLeastSprout(stages.get(w))).length
  return sprouted >= Math.ceil(words.length * rule.sproutShare - 1e-9)
}

// --- Lượt chơi ---

export interface VisitBatch {
  /** Các từ của lượt (theo thứ tự trong nơi) */
  words: string[]
  /** Từ chưa có thẻ — sẽ tạo thẻ ở bước 1, tính vào hạn mức từ mới hôm nay */
  newWords: string[]
  /** Không còn từ nào cần học (hoặc hết hạn mức) → lượt này chỉ ôn từ đã xong */
  reviewOnly: boolean
}

/**
 * Chọn đợt từ cho một lượt: ưu tiên từ chưa qua đủ 5 bước (từ đã có thẻ không tốn hạn mức, từ mới tốn 1);
 * hết hạn mức trong ngày (newLeftToday = 0) hoặc không còn từ nào học được thì lấy từ đã xong để ôn,
 * mức nhớ thấp trước.
 */
export function pickVisitBatch(input: {
  words: readonly string[]
  completed: ReadonlySet<string>
  hasCard: ReadonlySet<string>
  newLeftToday: number
  stages?: ReadonlyMap<string, WordStage>
  size?: number
}): VisitBatch {
  const size = input.size ?? KIDS_VISIT_SIZE
  const words: string[] = []
  const newWords: string[] = []
  let newLeft = Math.max(0, input.newLeftToday)
  // Hết hạn mức hôm nay thì không học thêm gì nữa, kể cả từ đã có thẻ nhưng chưa xong
  for (const w of newLeft > 0 ? input.words : []) {
    if (words.length >= size) break
    if (input.completed.has(w)) continue
    if (input.hasCard.has(w)) words.push(w)
    else if (newLeft > 0) {
      words.push(w)
      newWords.push(w)
      newLeft--
    }
  }
  if (words.length > 0) return { words, newWords, reviewOnly: false }
  const rank = (w: string): number => WORD_STAGES.indexOf(input.stages?.get(w) ?? 'sprout')
  const review = input.words
    .filter((w) => input.completed.has(w))
    .map((w, i) => ({ w, i }))
    .sort((a, b) => rank(a.w) - rank(b.w) || a.i - b.i)
    .slice(0, size)
    .map((x) => x.w)
  return { words: review, newWords: [], reviewOnly: true }
}

// --- Kiểm tra nội dung ---

export interface WorldIssue {
  level: 'error' | 'warning'
  /** File/nơi liên quan (vd 'vn-hoian' hoặc 'world.json') */
  where: string
  message: string
}

export interface ValidateWorldOptions {
  /** Từ tiếng Anh của mọi hình có sẵn (id hình → từ) */
  pictureWords: Readonly<Record<string, { en: string }>>
  /** Từ nhạy cảm (viết thường) */
  sensitive?: ReadonlySet<string>
  /** Id công trình đã có mô hình; bỏ qua nếu chưa truyền */
  landmarks?: ReadonlySet<string>
  /** Chế độ phát hành: nơi chưa có người duyệt bị cảnh báo */
  release?: boolean
}

/** Tách câu thành từ viết thường, bỏ dấu câu, giữ dấu nháy (it's) và gạch nối (t-shirt) */
export function sentenceTokens(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[’]/g, "'")
    .split(/[^a-z'-]+/)
    .map((t) => t.replace(/^['-]+|['-]+$/g, ''))
    .filter((t) => t.length > 0)
}

/** Từ của một hình tách thành token (vd 'ice cream' → ice, cream) */
const pictureTokens = (en: string): string[] => sentenceTokens(en)

/** Token được chấp nhận nếu chính nó hoặc dạng bỏ đuôi số nhiều (s/es) có trong tập cho phép */
function tokenAllowed(token: string, allowed: ReadonlySet<string>): boolean {
  if (allowed.has(token)) return true
  if (token.endsWith('es') && allowed.has(token.slice(0, -2))) return true
  return token.endsWith('s') && allowed.has(token.slice(0, -1))
}

/**
 * Kiểm tra toàn bộ nội dung thế giới theo docs/19 §2.1, §4.3: tham chiếu đúng, đủ số từ mỗi nơi,
 * mỗi từ mới chỉ thuộc một nơi, câu chỉ dùng từ của nơi + tầng thấp hơn + từ khung, độ dài câu, tổng từ trong khoảng bậc.
 */
export function validateWorld(
  world: KidsWorldFile,
  places: readonly KidsPlaceFile[],
  options: ValidateWorldOptions
): WorldIssue[] {
  const issues: WorldIssue[] = []
  const error = (where: string, message: string): void => {
    issues.push({ level: 'error', where, message })
  }
  const warn = (where: string, message: string): void => {
    issues.push({ level: 'warning', where, message })
  }

  const tiers = new Map<string, KidsTier>()
  for (const tier of world.tiers) {
    if (tiers.has(tier.id)) error('world.json', `tầng trùng id: ${tier.id}`)
    tiers.set(tier.id, tier)
    if (tier.wordRange[0] > tier.wordRange[1]) error('world.json', `wordRange sai: ${tier.id}`)
  }
  const orders = world.tiers.map((t) => t.order)
  if (new Set(orders).size !== orders.length) error('world.json', 'thứ tự tầng bị trùng')
  for (const tier of world.tiers) {
    if (!tier.unlock) continue
    const prev = tiers.get(tier.unlock.tier)
    if (!prev) error('world.json', `${tier.id}: tầng điều kiện không tồn tại: ${tier.unlock.tier}`)
    else if (prev.order >= tier.order) {
      error('world.json', `${tier.id}: tầng điều kiện phải đứng trước (${prev.id})`)
    }
  }

  const placeIds = new Set<string>()
  const owner = new Map<string, string>()
  for (const file of places) {
    const p = file.place
    if (placeIds.has(p.id)) error(p.id, 'nơi trùng id')
    placeIds.add(p.id)
    if (!tiers.has(p.tier)) error(p.id, `tầng không tồn tại: ${p.tier}`)
    if (options.landmarks && !options.landmarks.has(p.landmark)) {
      error(p.id, `chưa có mô hình công trình: ${p.landmark}`)
    }
    if (options.release && !file.reviewed) warn(p.id, 'chưa có người duyệt (reviewed: false)')
    for (const w of file.words) {
      const first = owner.get(w.picture)
      if (first) error(p.id, `từ "${w.picture}" đã là từ mới ở ${first}`)
      else owner.set(w.picture, p.id)
      const en = options.pictureWords[w.picture]?.en
      if (!en) error(p.id, `thiếu hình: ${w.picture}`)
      if (options.sensitive?.has((en ?? w.picture).toLowerCase())) {
        error(p.id, `từ nhạy cảm: ${w.picture}`)
      }
    }
  }

  // Từ của từng tầng (để câu tầng sau được dùng lại từ tầng trước)
  const tierWords = new Map<string, Set<string>>()
  for (const file of places) {
    const set = tierWords.get(file.place.tier) ?? new Set<string>()
    for (const w of file.words) {
      for (const t of pictureTokens(options.pictureWords[w.picture]?.en ?? w.picture)) set.add(t)
    }
    tierWords.set(file.place.tier, set)
  }

  for (const file of places) {
    const p = file.place
    const tier = tiers.get(p.tier)
    if (!tier) continue
    if (file.words.length !== tier.wordsPerPlace) {
      error(p.id, `cần đúng ${tier.wordsPerPlace} từ, đang có ${file.words.length}`)
    }
    const allowed = new Set<string>(tier.frameWords)
    for (const lower of world.tiers.filter((t) => t.order < tier.order)) {
      for (const t of tierWords.get(lower.id) ?? []) allowed.add(t)
    }
    for (const w of file.words) {
      for (const t of pictureTokens(options.pictureWords[w.picture]?.en ?? w.picture))
        allowed.add(t)
    }
    for (const w of file.words) {
      const tokens = sentenceTokens(w.sentence.en)
      if (tokens.length > tier.maxSentenceWords) {
        error(p.id, `câu quá dài (${tokens.length} > ${tier.maxSentenceWords}): "${w.sentence.en}"`)
      }
      const target = pictureTokens(options.pictureWords[w.picture]?.en ?? w.picture)
      if (!target.every((t) => tokens.some((s) => tokenAllowed(s, new Set([t]))))) {
        error(p.id, `câu không chứa từ "${w.picture}": "${w.sentence.en}"`)
      }
      const bad = tokens.filter((t) => !tokenAllowed(t, allowed))
      if (bad.length > 0) {
        error(p.id, `câu dùng từ ngoài phạm vi (${bad.join(', ')}): "${w.sentence.en}"`)
      }
    }
  }

  for (const tier of world.tiers) {
    const tierPlaces = places.filter((f) => f.place.tier === tier.id)
    if (tierPlaces.length === 0) continue
    const total = tierPlaces.reduce((n, f) => n + f.words.length, 0)
    const [min, max] = tier.wordRange
    if (total < min || total > max) {
      warn(tier.id, `tổng từ của tầng ${total} ngoài khoảng ${min}–${max}`)
    }
    const suggest = tierPlaces.map((f) => f.place.suggestOrder)
    if (new Set(suggest).size !== suggest.length) warn(tier.id, 'suggestOrder bị trùng')
  }
  return issues
}

/** Id hình còn thiếu (để vẽ thêm) */
export function missingPictures(
  places: readonly KidsPlaceFile[],
  pictureWords: Readonly<Record<string, unknown>>
): string[] {
  const ids = places.flatMap((f) => f.words.map((w) => w.picture))
  return [...new Set(ids.filter((id) => !(id in pictureWords)))].sort()
}
