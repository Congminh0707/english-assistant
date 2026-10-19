import type { WalkResult } from '@shared/ipc-contract'
import type { SpriteAnimator } from './SpriteAnimator'

export type MascotState = 'idle' | 'walk' | 'drag' | 'fall' | 'land' | 'happy' | 'eat' | 'sleep'

/** Phản ứng một lần (animation không lặp rồi quay về nghỉ) */
export type MascotReactionAnim = 'happy' | 'eat'

const ONE_SHOT_STATES: MascotState[] = ['land', 'happy', 'eat']

const WALK_SPEED = 30 // px/s
const WALK_CHANCE = 0.6

const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min)

/**
 * "Bộ não" quyết định nhân vật làm gì; animator là "cơ thể".
 * Phase 0 có: idle ↔ walk, drag → fall → land, click → happy. Sơ đồ đầy đủ: docs/05-mascot-system.md#4.
 */
export class MascotBrain {
  state: MascotState = 'idle'
  facing: 1 | -1 = 1
  /** Main báo mascot đang ngủ (người dùng vắng mặt / hết năng lượng) */
  sleeping = false

  private stateTimeLeft = randomBetween(2, 5)
  private pendingDx = 0
  private walkInFlight = false

  constructor(
    private readonly animator: SpriteAnimator,
    private readonly walk: (dx: number) => Promise<WalkResult>,
    /** Báo cửa sổ vừa dịch đi bao nhiêu px (để kiểm tra lại con trỏ có còn trên nhân vật) */
    private readonly onMoved: (dx: number) => void,
    /** Mỗi bước đi = 1 pixel art (= scale px màn hình): ít lần di chuyển cửa sổ hơn → nhẹ CPU */
    private stepPx = 1
  ) {
    animator.onFinish = (name) => {
      if (ONE_SHOT_STATES.includes(name as MascotState) && this.state === name) this.enter('idle')
    }
    animator.play('idle')
  }

  tick(dt: number): void {
    // Đang ngủ: nằm yên (chỉ bị kéo/rơi mới tỉnh tạm, xong lại ngủ tiếp)
    if (this.sleeping && (this.state === 'idle' || this.state === 'walk')) this.enter('sleep')
    if (this.state === 'idle' || this.state === 'walk') {
      this.stateTimeLeft -= dt
      if (this.stateTimeLeft <= 0) this.chooseNext()
    }
    if (this.state === 'walk') this.walkStep(dt)
  }

  pointerDown(): void {
    this.enter('drag')
  }

  pointerUp(isClick: boolean, falling: boolean): void {
    if (isClick) this.enter(this.sleeping ? 'sleep' : 'happy')
    else this.enter(falling ? 'fall' : 'land')
  }

  landed(): void {
    if (this.state === 'fall') this.enter('land')
  }

  /** Chơi một phản ứng (vd ăn, vui) nếu không đang bị kéo/rơi */
  react(anim: MascotReactionAnim): void {
    if (this.state === 'drag' || this.state === 'fall') return
    this.enter(anim)
  }

  /** Đi ngủ / thức dậy. Đang kéo/rơi/hạ cánh thì chờ xong mới đổi (tick tự chuyển). */
  setSleeping(sleeping: boolean): void {
    this.sleeping = sleeping
    if (!sleeping && this.state === 'sleep') this.enter('idle')
  }

  setStepPx(stepPx: number): void {
    this.stepPx = stepPx
  }

  /** Về trạng thái nghỉ (vd khi mascot bị ẩn giữa chừng lúc đang kéo/rơi) */
  reset(): void {
    this.enter('idle')
  }

  private enter(state: MascotState): void {
    this.state = state
    this.pendingDx = 0
    if (state === 'idle') this.stateTimeLeft = randomBetween(3, 8)
    if (state === 'walk') {
      this.stateTimeLeft = randomBetween(3, 8)
      this.facing = Math.random() < 0.5 ? -1 : 1
    }
    this.animator.play(state, true)
  }

  private chooseNext(): void {
    if (this.state === 'walk') this.enter('idle')
    else this.enter(Math.random() < WALK_CHANCE ? 'walk' : 'idle')
  }

  private walkStep(dt: number): void {
    this.pendingDx += this.facing * WALK_SPEED * dt
    // Gửi bước đi theo bội số stepPx, mỗi lần chỉ 1 request để không dồn IPC
    if (this.walkInFlight || Math.abs(this.pendingDx) < this.stepPx) return
    const step = Math.trunc(this.pendingDx / this.stepPx) * this.stepPx
    this.pendingDx -= step
    this.walkInFlight = true
    this.walk(step)
      .then(({ blocked }) => {
        this.onMoved(step)
        if (blocked && this.state === 'walk') {
          // Chạm mép màn hình → quay đầu
          this.facing = blocked === 'left' ? 1 : -1
          this.pendingDx = 0
        }
      })
      .finally(() => {
        this.walkInFlight = false
      })
  }
}
