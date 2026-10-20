import {
  applyFood,
  clampStat,
  decayStats,
  FOODS,
  isFoodId,
  levelFromTotalXp,
  PAT_LIMIT_PER_HOUR,
  PAT_MOOD_GAIN,
  stageForLevel,
  type PetStats
} from '@shared/pet'
import type { PetState } from '@shared/schemas/pet'
import { normalizeCharacterId } from '@shared/characters'
import { parseEquipped } from '@shared/shop'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { EventBus } from '../core/EventBus'
import type { InventoryRepository } from '../db/repositories/InventoryRepository'
import type { PetRepository, PetRow } from '../db/repositories/PetRepository'
import type { ProfileService } from './ProfileService'
import type { Transaction } from './types'

const HOUR_MS = 3_600_000
/** Profile trẻ em: chỉ số giảm chậm một nửa */
const CHILD_DECAY_FACTOR = 0.5

/**
 * Thú cưng của profile đang dùng: chỉ số nuôi, cho ăn, vuốt ve (docs/05-mascot-system.md#6).
 * Main là nguồn sự thật; mỗi khi đổi phát 'pet.updated' để broadcast xuống các cửa sổ.
 */
export class PetService {
  private patTimes: number[] = []

  constructor(
    private readonly deps: {
      pets: PetRepository
      inventory: InventoryRepository
      profiles: ProfileService
      clock: Clock
      bus: EventBus
      transaction: Transaction
    }
  ) {}

  get(): PetState {
    return this.tick().state
  }

  /** Áp dụng giảm chỉ số theo thời gian thực kể từ lần cập nhật trước (kể cả lúc app tắt) */
  tick(): { state: PetState; changed: boolean } {
    const row = this.row()
    const now = this.deps.clock.now()
    const elapsed = now - row.lastTickAt
    if (elapsed < 1000) return { state: this.toState(row), changed: false }

    const factor = this.deps.profiles.active().isChild ? CHILD_DECAY_FACTOR : 1
    const stats = decayStats(row, elapsed, factor)
    const changed = !sameStats(row, stats)
    this.deps.pets.update(row.id, { ...stats, lastTickAt: now }, now)
    const state = this.toState({ ...row, ...stats, lastTickAt: now })
    if (changed) this.deps.bus.emit('pet.updated', state)
    return { state, changed }
  }

  feed(itemId: string): PetState {
    if (!isFoodId(itemId)) throw new AppError('ITEM_UNKNOWN', 'errors.itemUnknown')
    const { inventory, pets, profiles, clock, bus, transaction } = this.deps
    const state = transaction(() => {
      const profileId = profiles.activeId()
      if (inventory.quantity(profileId, itemId) < 1) {
        throw new AppError('ITEM_NOT_OWNED', 'errors.itemNotOwned')
      }
      const now = clock.now()
      inventory.adjust(profileId, itemId, -1, now)
      this.tick()
      const row = this.row()
      const stats = applyFood(row, FOODS[itemId])
      pets.update(row.id, { ...stats, affection: row.affection + 1 }, now)
      return this.toState({ ...row, ...stats, affection: row.affection + 1 })
    })
    bus.emit('pet.fed', { itemId })
    bus.emit('pet.updated', state)
    return state
  }

  /** Vuốt ve (click vào mascot): +mood, giới hạn số lần mỗi giờ để chống spam */
  pat(): PetState {
    const now = this.deps.clock.now()
    this.patTimes = this.patTimes.filter((t) => now - t < HOUR_MS)
    this.tick()
    const row = this.row()
    if (this.patTimes.length >= PAT_LIMIT_PER_HOUR) return this.toState(row)

    this.patTimes.push(now)
    const mood = clampStat(row.mood + PAT_MOOD_GAIN)
    this.deps.pets.update(row.id, { mood }, now)
    const state = this.toState({ ...row, mood })
    this.deps.bus.emit('pet.updated', state)
    return state
  }

  /** Hồi năng lượng khi đang ngủ (chạy sau tick để không bị trừ ngược) */
  rest(energyGain: number): PetState {
    this.tick()
    const row = this.row()
    const energy = clampStat(row.energy + energyGain)
    if (energy === row.energy) return this.toState(row)
    this.deps.pets.update(row.id, { energy }, this.deps.clock.now())
    const state = this.toState({ ...row, energy })
    if (round1(energy) !== round1(row.energy)) this.deps.bus.emit('pet.updated', state)
    return state
  }

  /** Bản ghi thô (dùng nội bộ, vd XpService) */
  row(): PetRow {
    const row = this.deps.pets.findByProfile(this.deps.profiles.activeId())
    if (!row) throw new AppError('NOT_FOUND', 'errors.notFound')
    return row
  }

  toState(row: PetRow): PetState {
    const { level, xpInLevel, xpForNext } = levelFromTotalXp(row.totalXp)
    return {
      name: row.name,
      characterId: normalizeCharacterId(row.characterId),
      stage: stageForLevel(level),
      level,
      xpInLevel,
      xpForNext,
      totalXp: row.totalXp,
      coins: row.coins,
      hunger: round1(row.hunger),
      mood: round1(row.mood),
      energy: round1(row.energy),
      affection: row.affection,
      equipped: parseEquipped(row.equipped)
    }
  }
}

const round1 = (v: number): number => Math.round(v * 10) / 10

/** So sánh ở độ chính xác hiển thị, tránh broadcast liên tục vì thay đổi rất nhỏ */
const sameStats = (a: PetStats, b: PetStats): boolean =>
  round1(a.hunger) === round1(b.hunger) &&
  round1(a.mood) === round1(b.mood) &&
  round1(a.energy) === round1(b.energy)
