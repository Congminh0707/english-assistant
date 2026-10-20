import {
  characterFromItem,
  CHARACTERS,
  characterItemId,
  DEFAULT_CHARACTER_ID,
  isCharacterId,
  isCharacterItem
} from '@shared/characters'
import {
  isAccessoryId,
  MAX_FOOD_STACK,
  parseEquipped,
  shopCatalog,
  toggleEquipped,
  type ShopEntry
} from '@shared/shop'
import type { ShopState } from '@shared/schemas/shop'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { EventBus } from '../core/EventBus'
import type { InventoryRepository } from '../db/repositories/InventoryRepository'
import type { PetRepository } from '../db/repositories/PetRepository'
import type { PetService } from './PetService'
import type { ProfileService } from './ProfileService'
import type { Transaction } from './types'
import type { XpService } from './XpService'

export const PURCHASE_REASON = 'shop.purchase'

/**
 * Cửa hàng: mua đồ ăn và phụ kiện bằng xu, đeo/tháo phụ kiện cho mascot.
 * Chi xu ghi vào sổ XP (coins âm) nên tổng xu luôn tính lại được.
 */
export class ShopService {
  constructor(
    private readonly deps: {
      inventory: InventoryRepository
      pets: PetRepository
      petService: PetService
      xp: XpService
      profiles: ProfileService
      clock: Clock
      bus: EventBus
      transaction: Transaction
    }
  ) {}

  state(): ShopState {
    const { inventory, profiles, petService } = this.deps
    const pet = petService.get()
    const profileId = profiles.activeId()
    const items = shopCatalog().map((entry) =>
      this.toItem(entry, inventory.quantity(profileId, entry.id), pet)
    )
    return { coins: pet.coins, level: pet.level, character: pet.characterId, items }
  }

  buy(itemId: string): ShopState {
    const entry = shopCatalog().find((e) => e.id === itemId)
    if (!entry) throw new AppError('ITEM_UNKNOWN', 'errors.itemUnknown')
    const { inventory, profiles, petService, xp, clock, transaction } = this.deps
    transaction(() => {
      const profileId = profiles.activeId()
      const pet = petService.get()
      const owned = inventory.quantity(profileId, entry.id)
      if (entry.kind !== 'food' && owned > 0) {
        throw new AppError('ALREADY_OWNED', 'errors.alreadyOwned')
      }
      if (entry.kind === 'food' && owned >= MAX_FOOD_STACK) {
        throw new AppError('BAG_FULL', 'errors.bagFull')
      }
      if (pet.level < entry.minLevel) throw new AppError('LEVEL_TOO_LOW', 'errors.levelTooLow')
      if (pet.coins < entry.price) throw new AppError('NOT_ENOUGH_COINS', 'errors.notEnoughCoins')
      xp.spend({ coins: entry.price, reason: PURCHASE_REASON, refId: entry.id })
      inventory.adjust(profileId, entry.id, 1, clock.now())
    })
    return this.state()
  }

  /** Đeo/tháo một phụ kiện đã mua; đeo món cùng vị trí sẽ thay món cũ */
  equip(itemId: string, wear: boolean): ShopState {
    if (!isAccessoryId(itemId)) throw new AppError('ITEM_UNKNOWN', 'errors.itemUnknown')
    const { inventory, profiles, pets, petService, clock, bus } = this.deps
    if (inventory.quantity(profiles.activeId(), itemId) < 1) {
      throw new AppError('ITEM_NOT_OWNED', 'errors.itemNotOwned')
    }
    const row = petService.row()
    const equipped = toggleEquipped(parseEquipped(row.equipped), itemId, wear)
    pets.update(row.id, { equipped: JSON.stringify(equipped) }, clock.now())
    bus.emit('pet.updated', petService.get())
    return this.state()
  }

  /** Chọn nhân vật thú cưng (phải đã mua; Bi luôn có). Level/XP thuộc hồ sơ nên không đổi. */
  selectCharacter(characterId: string): ShopState {
    if (!isCharacterId(characterId)) throw new AppError('ITEM_UNKNOWN', 'errors.itemUnknown')
    const { inventory, profiles, pets, petService, clock, bus } = this.deps
    if (
      characterId !== DEFAULT_CHARACTER_ID &&
      inventory.quantity(profiles.activeId(), characterItemId(characterId)) < 1
    ) {
      throw new AppError('ITEM_NOT_OWNED', 'errors.itemNotOwned')
    }
    const row = petService.row()
    const name = CHARACTERS[characterId].name
    // Đổi tên theo nhân vật nếu người dùng chưa đặt tên riêng (đang là tên mặc định của nhân vật cũ)
    const defaultNames = Object.values(CHARACTERS).map((c) => c.name as string)
    const rename = defaultNames.includes(row.name) ? { name } : {}
    pets.update(row.id, { characterId, ...rename }, clock.now())
    bus.emit('pet.updated', petService.get())
    return this.state()
  }

  private toItem(
    entry: ShopEntry,
    owned: number,
    pet: { level: number; equipped: string[]; characterId: string }
  ): ShopState['items'][number] {
    const isChar = isCharacterItem(entry.id)
    return {
      ...entry,
      owned,
      equipped: isChar
        ? characterFromItem(entry.id) === pet.characterId
        : isAccessoryId(entry.id) && pet.equipped.includes(entry.id),
      locked: pet.level < entry.minLevel
    }
  }
}
