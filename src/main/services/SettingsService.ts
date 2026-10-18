import {
  defaultSettings,
  settingDefinitions,
  SETTING_KEYS,
  type SettingKey,
  type Settings
} from '@shared/schemas/settings'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { EventBus } from '../core/EventBus'
import type { SettingsRepository } from '../db/repositories/SettingsRepository'

/** Đọc/ghi cài đặt có kiểu & validate. Giá trị lưu sai/cũ trong DB tự rơi về mặc định. */
export class SettingsService {
  private cache: Settings

  constructor(
    private readonly repo: SettingsRepository,
    private readonly clock: Clock,
    private readonly bus: EventBus
  ) {
    this.cache = this.load()
  }

  all(): Settings {
    return { ...this.cache }
  }

  get<K extends SettingKey>(key: K): Settings[K] {
    return this.cache[key]
  }

  set(key: SettingKey, value: unknown): Settings {
    const parsed = settingDefinitions[key].safeParse(value)
    if (!parsed.success) throw new AppError('VALIDATION', 'errors.validation', parsed.error.issues)
    this.repo.set(key, parsed.data, this.clock.now())
    this.cache = { ...this.cache, [key]: parsed.data }
    this.bus.emit('settings.changed', { key, settings: this.all() })
    return this.all()
  }

  private load(): Settings {
    const result: Record<string, unknown> = defaultSettings()
    for (const { key, value } of this.repo.all()) {
      if (!SETTING_KEYS.includes(key as SettingKey)) continue
      const parsed = settingDefinitions[key as SettingKey].safeParse(value)
      if (parsed.success) result[key] = parsed.data
    }
    return result as Settings
  }
}
