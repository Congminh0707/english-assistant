// Logic thú cưng thuần (không phụ thuộc electron/DB) — dùng chung main, renderer, test.
// Quy tắc: docs/05-mascot-system.md#6 và docs/06-levels-and-progression.md#6.

export const PET_STAT_MIN = 10 // sàn: thú cưng không bao giờ "chết", chỉ hơi đói/buồn
export const PET_STAT_MAX = 100

export interface PetStats {
  hunger: number
  mood: number
  energy: number
}

/** Điểm giảm mỗi giờ */
export const DECAY_PER_HOUR = {
  open: { hunger: 4, mood: 3, energy: 2 },
  closed: { hunger: 1, mood: 1, energy: 0 }
} as const

/** Khi app tắt lâu, chỉ tính giảm tối đa 24 giờ */
export const MAX_OFFLINE_DECAY_HOURS = 24
/** Khoảng cách giữa 2 lần cập nhật lớn hơn mức này → coi như app đã tắt trong khoảng đó */
export const OFFLINE_GAP_MS = 5 * 60_000

const HOUR_MS = 3_600_000

export const clampStat = (value: number): number =>
  Math.min(PET_STAT_MAX, Math.max(PET_STAT_MIN, value))

/**
 * Tính chỉ số sau một khoảng thời gian.
 * @param factor hệ số tốc độ giảm (profile trẻ em dùng 0.5)
 */
export function decayStats(stats: PetStats, elapsedMs: number, factor = 1): PetStats {
  if (elapsedMs <= 0) return { ...stats }
  const appWasOpen = elapsedMs <= OFFLINE_GAP_MS
  const rates = appWasOpen ? DECAY_PER_HOUR.open : DECAY_PER_HOUR.closed
  const hours = Math.min(elapsedMs / HOUR_MS, MAX_OFFLINE_DECAY_HOURS)
  const decay = (value: number, rate: number): number => {
    // Không kéo chỉ số đã dưới sàn (vd dữ liệu cũ) xuống thêm
    if (value <= PET_STAT_MIN) return value
    return clampStat(value - rate * hours * factor)
  }
  return {
    hunger: decay(stats.hunger, rates.hunger),
    mood: decay(stats.mood, rates.mood),
    energy: decay(stats.energy, rates.energy)
  }
}

// --- Đồ ăn ---

export interface FoodDef {
  hunger: number
  mood: number
  energy: number
  /** Giá trong cửa hàng (xu); null = chỉ có qua phần thưởng */
  price: number | null
  emoji: string
}

export const FOODS = {
  'food:onigiri': { hunger: 20, mood: 2, energy: 0, price: 10, emoji: '🍙' },
  'food:cake': { hunger: 15, mood: 10, energy: 0, price: 25, emoji: '🍰' },
  'food:watermelon': { hunger: 25, mood: 8, energy: 0, price: 30, emoji: '🍉' },
  'food:milk-tea': { hunger: 5, mood: 5, energy: 20, price: 20, emoji: '🥤' },
  'food:apple': { hunger: 12, mood: 2, energy: 3, price: 8, emoji: '🍎' },
  'food:ice-cream': { hunger: 8, mood: 20, energy: 0, price: 22, emoji: '🍦' },
  'food:pizza': { hunger: 30, mood: 12, energy: 0, price: 35, emoji: '🍕' },
  'food:ramen': { hunger: 40, mood: 6, energy: 5, price: 45, emoji: '🍜' },
  'food:energy-drink': { hunger: 0, mood: 0, energy: 40, price: 35, emoji: '⚡' },
  'food:banana': { hunger: 14, mood: 3, energy: 6, price: 9, emoji: '🍌' },
  'food:cookie': { hunger: 8, mood: 12, energy: 0, price: 15, emoji: '🍪' },
  'food:donut': { hunger: 10, mood: 18, energy: 0, price: 20, emoji: '🍩' },
  'food:bubble-tea': { hunger: 6, mood: 10, energy: 24, price: 26, emoji: '🧋' },
  'food:soup': { hunger: 25, mood: 4, energy: 10, price: 28, emoji: '🍲' },
  'food:sushi': { hunger: 28, mood: 10, energy: 0, price: 38, emoji: '🍣' },
  'food:burger': { hunger: 35, mood: 8, energy: 0, price: 40, emoji: '🍔' },
  'food:feast': { hunger: 60, mood: 35, energy: 15, price: 90, emoji: '🍱' },
  'food:birthday-cake': { hunger: 50, mood: 30, energy: 0, price: null, emoji: '🎂' }
} as const satisfies Record<string, FoodDef>

export type FoodId = keyof typeof FOODS

export const isFoodId = (id: string): id is FoodId => id in FOODS

/** Túi đồ khởi đầu của profile mới — để cho ăn được ngay cả khi chưa có bài học */
export const STARTER_INVENTORY: Partial<Record<FoodId, number>> = {
  'food:onigiri': 3,
  'food:milk-tea': 1
}

/** Khoá i18n của một item: 'food:milk-tea' → 'items.milk-tea' */
export const itemI18nKey = (itemId: string): string => `items.${itemId.split(':')[1] ?? itemId}`

export function applyFood(stats: PetStats, food: FoodDef): PetStats {
  return {
    hunger: clampStat(stats.hunger + food.hunger),
    mood: clampStat(stats.mood + food.mood),
    energy: clampStat(stats.energy + food.energy)
  }
}

// --- Vuốt ve ---

/** Số lần vuốt ve được cộng mood mỗi giờ (chống spam click) */
export const PAT_LIMIT_PER_HOUR = 10
export const PAT_MOOD_GAIN = 1

// --- Level thú cưng ---

/** XP cần để từ level n lên n+1 */
export const xpForNextLevel = (level: number): number => Math.round(50 * Math.pow(level, 1.5))

/** Tổng XP tối thiểu để đạt level `level` (level 1 = 0) */
export function totalXpForLevel(level: number): number {
  let sum = 0
  for (let n = 1; n < level; n++) sum += xpForNextLevel(n)
  return sum
}

export interface LevelInfo {
  level: number
  xpInLevel: number
  xpForNext: number
}

export function levelFromTotalXp(totalXp: number): LevelInfo {
  let level = 1
  let remaining = Math.max(0, Math.floor(totalXp))
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level)
    level++
  }
  return { level, xpInLevel: remaining, xpForNext: xpForNextLevel(level) }
}

export type PetStage = 'egg' | 'baby' | 'teen' | 'adult' | 'legend'

/** Các giai đoạn theo thứ tự tiến hoá, kèm level thú cưng tối thiểu của từng giai đoạn */
export const PET_STAGES: ReadonlyArray<{ stage: PetStage; minLevel: number }> = [
  { stage: 'egg', minLevel: 1 },
  { stage: 'baby', minLevel: 2 },
  { stage: 'teen', minLevel: 10 },
  { stage: 'adult', minLevel: 25 },
  { stage: 'legend', minLevel: 50 }
]

export function stageForLevel(level: number): PetStage {
  let current: PetStage = 'egg'
  for (const s of PET_STAGES) if (level >= s.minLevel) current = s.stage
  return current
}

/** Giai đoạn kế tiếp và level cần đạt; null nếu đã ở giai đoạn cuối */
export function nextStage(level: number): { stage: PetStage; minLevel: number } | null {
  return PET_STAGES.find((s) => s.minLevel > level) ?? null
}
