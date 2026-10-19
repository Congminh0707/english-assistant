import { AWAKE, nextSleepState, REST_PER_HOUR, type SleepState } from '@shared/sleep'
import type { PetService } from './PetService'

/**
 * Quyết định mascot có đang ngủ không: người dùng vắng mặt (không đụng máy) hoặc thú cưng hết năng lượng.
 * Lúc ngủ năng lượng hồi dần. Không import electron — thời gian vắng mặt do nơi dựng truyền vào
 * (powerMonitor.getSystemIdleTime) để test được.
 */
export class SleepService {
  private state: SleepState = AWAKE

  constructor(
    private readonly deps: {
      pet: PetService
      getIdleSeconds: () => number
      onChange: (state: SleepState, previous: SleepState) => void
    }
  ) {}

  get current(): SleepState {
    return this.state
  }

  get sleeping(): boolean {
    return this.state.sleeping
  }

  /** Gọi định kỳ (vài chục giây một lần) */
  check(): void {
    const energy = this.deps.pet.get().energy
    const next = nextSleepState(this.state, this.deps.getIdleSeconds(), energy)
    if (next.sleeping === this.state.sleeping && next.reason === this.state.reason) {
      this.state = next
      return
    }
    const previous = this.state
    this.state = next
    this.deps.onChange(next, previous)
  }

  /** Hồi năng lượng cho khoảng thời gian đã trôi qua nếu đang ngủ */
  rest(elapsedMs: number): void {
    if (this.state.sleeping) this.deps.pet.rest((elapsedMs / 3_600_000) * REST_PER_HOUR)
  }
}
