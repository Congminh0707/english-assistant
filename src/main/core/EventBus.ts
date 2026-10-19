import { EventEmitter } from 'node:events'
import type { PetState } from '@shared/schemas/pet'
import type { Settings, SettingKey } from '@shared/schemas/settings'

/** Sự kiện nội bộ trong main (~ Laravel Events). Tên dạng `domain.past-tense`. */
export interface AppEvents {
  'pet.updated': PetState
  'pet.fed': { itemId: string }
  'pet.hungry': PetState
  'xp.granted': { amount: number; coins: number; reason: string }
  'level.up': { level: number }
  'settings.changed': { key: SettingKey; settings: Settings }
  'word.saved': { text: string; contentId: string | null }
  'card.reviewed': { cardId: string; rating: number }
}

type Listener<K extends keyof AppEvents> = (payload: AppEvents[K]) => void

export class EventBus {
  private readonly emitter = new EventEmitter()

  on<K extends keyof AppEvents>(event: K, listener: Listener<K>): () => void {
    this.emitter.on(event, listener)
    return () => this.emitter.off(event, listener)
  }

  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): void {
    this.emitter.emit(event, payload)
  }
}
