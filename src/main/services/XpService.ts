import { levelFromTotalXp } from '@shared/pet'
import type { PetState } from '@shared/schemas/pet'
import type { Clock } from '../core/Clock'
import type { EventBus } from '../core/EventBus'
import type { PetRepository } from '../db/repositories/PetRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { PetService } from './PetService'
import type { ProfileService } from './ProfileService'
import type { Transaction } from './types'

export interface XpGrant {
  amount: number
  coins?: number
  /** Lý do, dạng tên event: 'lesson.completed', 'card.reviewed'... */
  reason: string
  refId?: string | null
  multiplier?: number
}

/**
 * Cộng XP & xu qua sổ cái xp_events, cập nhật level thú cưng (docs/06-levels-and-progression.md#6).
 * Phase 1 chưa có nguồn XP (bài học, SRS); các module học sẽ gọi grant().
 */
export class XpService {
  constructor(
    private readonly deps: {
      xp: XpRepository
      pets: PetRepository
      petService: PetService
      profiles: ProfileService
      clock: Clock
      bus: EventBus
      transaction: Transaction
    }
  ) {}

  grant(input: XpGrant): { state: PetState; levelUp: boolean } {
    const { xp, pets, petService, profiles, clock, bus, transaction } = this.deps
    const multiplier = input.multiplier ?? 1
    const amount = Math.max(0, Math.round(input.amount * multiplier))
    const coins = Math.max(0, Math.round(input.coins ?? 0))

    const { state, oldLevel } = transaction(() => {
      const now = clock.now()
      const row = petService.row()
      xp.insert(
        {
          profileId: profiles.activeId(),
          amount,
          coins,
          reason: input.reason,
          refId: input.refId ?? null,
          multiplier
        },
        now
      )
      const totalXp = row.totalXp + amount
      const level = levelFromTotalXp(totalXp).level
      pets.update(row.id, { totalXp, coins: row.coins + coins, level }, now)
      return {
        state: petService.toState({ ...row, totalXp, coins: row.coins + coins, level }),
        oldLevel: row.level
      }
    })

    bus.emit('xp.granted', { amount, coins, reason: input.reason })
    bus.emit('pet.updated', state)
    const levelUp = state.level > oldLevel
    if (levelUp) bus.emit('level.up', { level: state.level })
    return { state, levelUp }
  }
}
