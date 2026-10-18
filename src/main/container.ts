// Khởi tạo & nối các service (~ Service Providers trong Laravel). Không import electron ở đây
// để test dựng được toàn bộ container với SQLite in-memory + FakeClock.
import type { Clock } from './core/Clock'
import { EventBus } from './core/EventBus'
import type { UserDbConnection } from './db/client'
import { InventoryRepository } from './db/repositories/InventoryRepository'
import { PetRepository } from './db/repositories/PetRepository'
import { ProfileRepository } from './db/repositories/ProfileRepository'
import { SettingsRepository } from './db/repositories/SettingsRepository'
import { XpRepository } from './db/repositories/XpRepository'
import { InventoryService } from './services/InventoryService'
import { PetService } from './services/PetService'
import { ProfileService } from './services/ProfileService'
import { SettingsService } from './services/SettingsService'
import type { Transaction } from './services/types'
import { XpService } from './services/XpService'

export interface Container {
  clock: Clock
  bus: EventBus
  settings: SettingsService
  profiles: ProfileService
  inventory: InventoryService
  pet: PetService
  xp: XpService
}

export function createContainer(conn: UserDbConnection, clock: Clock): Container {
  const { db, sqlite } = conn
  const bus = new EventBus()
  const transaction: Transaction = (fn) => sqlite.transaction(fn)()

  const repos = {
    profiles: new ProfileRepository(db),
    pets: new PetRepository(db),
    inventory: new InventoryRepository(db),
    xp: new XpRepository(db),
    settings: new SettingsRepository(db)
  }

  const settings = new SettingsService(repos.settings, clock, bus)
  const profiles = new ProfileService({
    profiles: repos.profiles,
    pets: repos.pets,
    inventory: repos.inventory,
    settings,
    clock,
    transaction
  })
  const inventory = new InventoryService({ inventory: repos.inventory, profiles, clock })
  const pet = new PetService({
    pets: repos.pets,
    inventory: repos.inventory,
    profiles,
    clock,
    bus,
    transaction
  })
  const xp = new XpService({
    xp: repos.xp,
    pets: repos.pets,
    petService: pet,
    profiles,
    clock,
    bus,
    transaction
  })

  return { clock, bus, settings, profiles, inventory, pet, xp }
}
