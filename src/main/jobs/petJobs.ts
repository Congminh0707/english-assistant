import type { Container } from '../container'
import type { Scheduler } from './Scheduler'

const MINUTE_MS = 60_000
const HUNGRY_THRESHOLD = 30
/** Nhắc đói tối đa 1 lần mỗi 45 phút */
const HUNGRY_REMIND_MS = 45 * MINUTE_MS

/**
 * PetDecayJob: mỗi phút cập nhật chỉ số (giảm theo thời gian) và phát 'pet.updated' nếu đổi.
 * Kèm nhắc "đói rồi" khi hunger thấp — không nhắc khi mascot đang ẩn/yên lặng (do isQuiet quyết định).
 */
export function schedulePetJobs(scheduler: Scheduler, c: Container, isQuiet: () => boolean): void {
  let lastHungryAt = 0
  scheduler.every(
    'pet-decay',
    MINUTE_MS,
    () => {
      const { state } = c.pet.tick()
      const now = c.clock.now()
      if (state.hunger < HUNGRY_THRESHOLD && now - lastHungryAt > HUNGRY_REMIND_MS && !isQuiet()) {
        lastHungryAt = now
        c.bus.emit('pet.hungry', state)
      }
    },
    true
  )
}
