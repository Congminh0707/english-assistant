import { STARTER_INVENTORY } from '@shared/pet'
import { isChildTrack, type ProfileInfo, type ProfileSetupInput } from '@shared/schemas/profile'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { InventoryRepository } from '../db/repositories/InventoryRepository'
import type { PetRepository } from '../db/repositories/PetRepository'
import type { ProfileRepository, ProfileRow, Track } from '../db/repositories/ProfileRepository'
import type { SettingsService } from './SettingsService'
import type { Transaction } from './types'

export const DEFAULT_CHARACTER = 'placeholder'

export interface NewProfile {
  name: string
  track: Track
  isChild?: boolean
  petName?: string
}

/**
 * Quản lý profile (nhiều người dùng chung máy). Phase 1 tự tạo 1 profile mặc định;
 * màn hình tạo/chọn profile làm cùng cửa sổ Học tập.
 */
export class ProfileService {
  private activeCache: ProfileRow | null = null

  constructor(
    private readonly deps: {
      profiles: ProfileRepository
      pets: PetRepository
      inventory: InventoryRepository
      settings: SettingsService
      clock: Clock
      transaction: Transaction
    }
  ) {}

  /** Profile đang dùng; lần chạy đầu tiên tự tạo profile mặc định */
  active(): ProfileRow {
    if (this.activeCache) return this.activeCache
    const { profiles, settings } = this.deps
    const savedId = settings.get('app.activeProfileId')
    const profile =
      (savedId ? profiles.find(savedId) : undefined) ??
      profiles.list()[0] ??
      this.create({ name: 'Bạn', track: 'general' })
    if (profile.id !== savedId) settings.set('app.activeProfileId', profile.id)
    this.activeCache = profile
    return profile
  }

  activeId(): string {
    return this.active().id
  }

  list(): ProfileRow[] {
    return this.deps.profiles.list()
  }

  /** Tạo profile kèm thú cưng và túi đồ khởi đầu, trong một transaction */
  create(input: NewProfile): ProfileRow {
    const { profiles, pets, inventory, clock, transaction } = this.deps
    const name = input.name.trim()
    if (!name) throw new AppError('VALIDATION', 'errors.validation')
    return transaction(() => {
      const now = clock.now()
      const profile = profiles.create(
        { name, track: input.track, isChild: input.isChild ?? false },
        now
      )
      pets.create(profile.id, { name: input.petName ?? 'Bi', characterId: DEFAULT_CHARACTER }, now)
      for (const [itemId, qty] of Object.entries(STARTER_INVENTORY)) {
        inventory.adjust(profile.id, itemId, qty ?? 0, now)
      }
      return profile
    })
  }

  /** Thông tin hiển thị của một hồ sơ (kèm tên thú cưng) */
  info(row: ProfileRow): ProfileInfo {
    return {
      id: row.id,
      name: row.name,
      track: row.track,
      isChild: row.isChild,
      petName: this.deps.pets.findByProfile(row.id)?.name ?? '',
      active: row.id === this.activeId()
    }
  }

  listInfo(): ProfileInfo[] {
    return this.list().map((row) => this.info(row))
  }

  /** Thiết lập hồ sơ đang dùng lần đầu (onboarding): tên, mục tiêu học, tên thú cưng */
  setup(input: ProfileSetupInput): ProfileInfo {
    const { profiles, pets, settings, clock, transaction } = this.deps
    const active = this.active()
    transaction(() => {
      const now = clock.now()
      profiles.update(
        active.id,
        { name: input.name, track: input.track, isChild: isChildTrack(input.track) },
        now
      )
      const pet = pets.findByProfile(active.id)
      if (pet && input.petName) pets.update(pet.id, { name: input.petName }, now)
    })
    settings.set('app.onboarded', true)
    this.activeCache = profiles.find(active.id) ?? null
    return this.info(this.active())
  }

  /** Tạo hồ sơ mới (không chuyển sang ngay) */
  createFromInput(input: ProfileSetupInput): ProfileInfo {
    const row = this.create({
      name: input.name,
      track: input.track,
      isChild: isChildTrack(input.track),
      petName: input.petName
    })
    return this.info(row)
  }

  switchTo(id: string): ProfileRow {
    const profile = this.deps.profiles.find(id)
    if (!profile) throw new AppError('NOT_FOUND', 'errors.notFound')
    this.deps.settings.set('app.activeProfileId', id)
    this.activeCache = profile
    return profile
  }
}
