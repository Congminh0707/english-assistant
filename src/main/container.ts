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
import { VocabService } from './services/VocabService'
import { VocabRepository } from './db/repositories/VocabRepository'
import { InstalledPackRepository } from './db/repositories/InstalledPackRepository'
import { ContentPackService } from './content/ContentPackService'
import { DictionaryService } from './content/DictionaryService'
import { SrsService } from './services/SrsService'
import { MicroLearningService } from './services/MicroLearningService'
import { StudyService } from './services/StudyService'
import { MissionService } from './services/MissionService'
import { PlacementService } from './services/PlacementService'
import { PracticeService } from './services/PracticeService'
import { ShopService } from './services/ShopService'

export interface Container {
  clock: Clock
  bus: EventBus
  settings: SettingsService
  profiles: ProfileService
  inventory: InventoryService
  pet: PetService
  xp: XpService
  packs: ContentPackService
  dictionary: DictionaryService
  vocab: VocabService
  srs: SrsService
  micro: MicroLearningService
  study: StudyService
  missions: MissionService
  placement: PlacementService
  practice: PracticeService
  shop: ShopService
}

export interface ContainerOptions {
  /** Thư mục giải nén content pack (userData/packs) */
  packsDir: string
}

export function createContainer(
  conn: UserDbConnection,
  clock: Clock,
  options: ContainerOptions
): Container {
  const { db, sqlite } = conn
  const bus = new EventBus()
  const transaction: Transaction = (fn) => sqlite.transaction(fn)()

  const repos = {
    profiles: new ProfileRepository(db),
    pets: new PetRepository(db),
    inventory: new InventoryRepository(db),
    xp: new XpRepository(db),
    settings: new SettingsRepository(db),
    vocab: new VocabRepository(db),
    packs: new InstalledPackRepository(db)
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

  const packs = new ContentPackService({ repo: repos.packs, packsDir: options.packsDir, clock })
  const dictionary = new DictionaryService(packs)
  const vocab = new VocabService({
    vocab: repos.vocab,
    profiles,
    xp,
    clock,
    bus,
    transaction
  })

  const srs = new SrsService({ vocab: repos.vocab, profiles, xp, clock, bus, transaction })
  const micro = new MicroLearningService({
    srs,
    dictionary,
    vocab: repos.vocab,
    profiles,
    settings,
    clock
  })
  const study = new StudyService({
    vocab: repos.vocab,
    vocabService: vocab,
    srs,
    dictionary,
    profiles,
    clock
  })

  const missions = new MissionService({
    vocab: repos.vocab,
    xpRepo: repos.xp,
    xp,
    srs,
    profiles,
    settings,
    clock,
    bus
  })

  const placement = new PlacementService({ dictionary, profiles, settings, clock })

  const practice = new PracticeService({
    dictionary,
    profiles,
    settings,
    xp,
    xpRepo: repos.xp,
    clock
  })

  const shop = new ShopService({
    inventory: repos.inventory,
    pets: repos.pets,
    petService: pet,
    xp,
    profiles,
    clock,
    bus,
    transaction
  })

  return {
    clock,
    bus,
    settings,
    profiles,
    inventory,
    pet,
    xp,
    packs,
    dictionary,
    vocab,
    srs,
    micro,
    study,
    missions,
    placement,
    practice,
    shop
  }
}
