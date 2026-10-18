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

export function stageForLevel(level: number): PetStage {
  if (level >= 50) return 'legend'
  if (level >= 25) return 'adult'
  if (level >= 10) return 'teen'
  if (level >= 2) return 'baby'
  return 'egg'
}
