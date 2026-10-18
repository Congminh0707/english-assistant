import type { InventoryItem } from '@shared/schemas/pet'
import type { Clock } from '../core/Clock'
import type { InventoryRepository } from '../db/repositories/InventoryRepository'
import type { ProfileService } from './ProfileService'

/** Túi đồ của profile đang dùng */
export class InventoryService {
  constructor(
    private readonly deps: {
      inventory: InventoryRepository
      profiles: ProfileService
      clock: Clock
    }
  ) {}

  list(): InventoryItem[] {
    return this.deps.inventory
      .list(this.deps.profiles.activeId())
      .map(({ itemId, quantity }) => ({ itemId, quantity }))
  }

  add(itemId: string, quantity = 1): void {
    this.deps.inventory.adjust(
      this.deps.profiles.activeId(),
      itemId,
      quantity,
      this.deps.clock.now()
    )
  }
}
