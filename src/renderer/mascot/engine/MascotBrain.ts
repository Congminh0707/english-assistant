import type { WalkResult } from '@shared/ipc-contract'
import type { Animator } from './PoseAnimator'

/** Hoạt ảnh "tự chơi" khi rảnh: nhìn quanh, vẫy đuôi, ngáp, vươn vai, vẫy tay, nhảy múa, xoay, suy nghĩ */
const FIDGETS = ['look', 'wag', 'yawn', 'stretch', 'wave', 'dance', 'spin', 'think'] as const
type Fidget = (typeof FIDGETS)[number]

/** Phản ứng khi người dùng chơi với mascot: để ý (rê chuột tới), cười khúc khích/dụi (bấm), làm trò (bấm đúp),
 * chóng mặt (bấm dồn), khoái chí (vuốt ve), nhún nhảy theo nhạc (lăn chuột) */
const INTERACTIONS = ['notice', 'giggle', 'nuzzle', 'trick', 'dizzy', 'purr', 'groove'] as const
type Interaction = (typeof INTERACTIONS)[number]

export type MascotState =
  | 'idle'
  | 'walk'
  | 'drag'
  | 'fall'
  | 'land'
  | 'happy'
  | 'eat'
  | 'sleep'
  | 'sad'
  | 'surprised'
  | 'angry'
  | 'love'
  | 'levelup'
  | Interaction
  | Fidget
  /** Hoạt ảnh đặc trưng của từng nhân vật (tên bắt đầu bằng `quirk_`, có trong sheet.json) */
  | `quirk_${string}`
  /** Phản ứng riêng của nhân vật khi bị bấm vào (tên bắt đầu `click_`, có trong sheet.json) */
  | `click_${string}`

/** Phản ứng một lần (animation không lặp rồi quay về nghỉ) */
export type MascotReactionAnim =
  | 'happy'
  | 'eat'
  | 'sad'
  | 'love'
  | 'surprised'
  | 'angry'
  | 'wave'
  | 'dance'
  | 'stretch'
  | 'yawn'
  | 'think'
  | 'levelup'
  | Interaction

const QUIRK_PREFIX = 'quirk_'
const CLICK_PREFIX = 'click_'
/** Khi bấm vào: mỗi phản ứng riêng của nhân vật có trọng số này; happy/love/giggle chung trọng số 2, nuzzle 1 */
const CLICK_WEIGHT = 3
/** Mỗi hoạt ảnh đặc trưng có trọng số này khi chọn động tác tự chơi (xấp xỉ 1/3 số lần tự chơi) */
const QUIRK_WEIGHT = 3

const ONE_SHOT_STATES: MascotState[] = [
  'land',
  'happy',
  'eat',
  'sad',
  'surprised',
  'angry',
  'love',
  'levelup',
  ...INTERACTIONS,
  ...FIDGETS
]

/** Trọng số chọn hoạt ảnh tự chơi (nhẹ nhàng hơn là nhảy múa/xoay) */
const FIDGET_WEIGHTS: Record<Fidget, number> = {
  look: 4,
  wag: 3,
  yawn: 2,
  stretch: 2,
  wave: 2,
  think: 2,
  dance: 1,
  spin: 1
}

const WALK_SPEED = 30 // px/s
const WALK_CHANCE = 0.55
/** Xác suất làm một hoạt ảnh tự chơi thay vì đi/đứng yên khi hết thời gian nghỉ */
const FIDGET_CHANCE = 0.35
/** Sau khi "để ý" con trỏ, nghỉ bấy nhiêu giây mới để ý lần nữa */
const NOTICE_COOLDOWN = 6
/** Con trỏ phải ở yên một bên bấy nhiêu giây mascot mới quay mặt theo (khỏi lật qua lật lại) */
const LOOK_HOLD = 0.6
/** Vừa quay mặt xong thì bấy nhiêu giây sau mới quay tiếp */
const TURN_COOLDOWN = 2.5

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
  private noticeCooldown = 0
  private lookDir: 1 | -1 | null = null
  private lookHeld = 0
  private turnCooldown = 0

  constructor(
    private readonly animator: Animator,
    private readonly walk: (dx: number) => Promise<WalkResult>,
    /** Báo cửa sổ vừa dịch đi bao nhiêu px (để kiểm tra lại con trỏ có còn trên nhân vật) */
    private readonly onMoved: (dx: number) => void,
    /** Mỗi bước đi = 1 pixel art (= scale px màn hình): ít lần di chuyển cửa sổ hơn → nhẹ CPU */
    private stepPx = 1
  ) {
    animator.onFinish = (name) => {
      const oneShot =
        ONE_SHOT_STATES.includes(name as MascotState) ||
        name.startsWith(QUIRK_PREFIX) ||
        name.startsWith(CLICK_PREFIX)
      if (oneShot && this.state === name) this.enter('idle')
    }
    animator.play('idle')
  }

  tick(dt: number): void {
    this.noticeCooldown = Math.max(0, this.noticeCooldown - dt)
    this.turnCooldown = Math.max(0, this.turnCooldown - dt)
    this.followPointer(dt)
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
    if (isClick) this.enter(this.sleeping ? 'sleep' : this.pickClickReaction())
    else this.enter(falling ? 'fall' : 'land')
  }

  /** Con trỏ vừa rê tới nhân vật: giật mình để ý (chỉ khi đang rảnh, có thời gian nghỉ giữa hai lần) */
  hover(): void {
    if (this.sleeping || this.noticeCooldown > 0) return
    if (this.state !== 'idle' && this.state !== 'walk') return
    this.noticeCooldown = NOTICE_COOLDOWN
    this.enter('notice')
  }

  /** Con trỏ đang ở bên nào của nhân vật (null = ở gần giữa hoặc đã rời đi); `tick` mới quyết định có quay mặt không */
  lookAt(dir: 1 | -1 | null): void {
    if (dir === this.lookDir) return
    this.lookDir = dir
    this.lookHeld = 0
  }

  /** Đang đứng yên và con trỏ ở yên một bên đủ lâu thì quay mặt về phía đó, không quay liên tục */
  private followPointer(dt: number): void {
    if (this.lookDir === null || this.lookDir === this.facing) return
    if (this.state !== 'idle' || this.sleeping) {
      this.lookHeld = 0
      return
    }
    this.lookHeld += dt
    if (this.lookHeld < LOOK_HOLD || this.turnCooldown > 0) return
    this.facing = this.lookDir
    this.turnCooldown = TURN_COOLDOWN
    this.lookHeld = 0
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
    if (this.state === 'walk') {
      this.enter('idle')
      return
    }
    if (Math.random() < FIDGET_CHANCE) {
      this.enter(this.pickFidget())
      return
    }
    this.enter(Math.random() < WALK_CHANCE ? 'walk' : 'idle')
  }

  /** Chọn phản ứng khi bị bấm: phản ứng riêng của nhân vật (click_*) hoặc happy/love/giggle/nuzzle chung */
  private pickClickReaction(): MascotState {
    const own = this.animator.names().filter((n) => n.startsWith(CLICK_PREFIX))
    const options: Array<[MascotState, number]> = [
      ['happy', 2],
      ['love', 2],
      ['giggle', 2],
      ['nuzzle', 1],
      ...own.map((n): [MascotState, number] => [n as MascotState, CLICK_WEIGHT])
    ]
    let roll = Math.random() * options.reduce((sum, [, w]) => sum + w, 0)
    for (const [name, weight] of options) {
      roll -= weight
      if (roll < 0) return name
    }
    return 'happy'
  }

  /** Chọn động tác tự chơi: hoạt ảnh chung (theo trọng số) hoặc hoạt ảnh đặc trưng của nhân vật hiện tại */
  private pickFidget(): MascotState {
    const quirks = this.animator.names().filter((n) => n.startsWith(QUIRK_PREFIX))
    const total =
      FIDGETS.reduce((sum, f) => sum + FIDGET_WEIGHTS[f], 0) + quirks.length * QUIRK_WEIGHT
    let roll = Math.random() * total
    for (const f of FIDGETS) {
      roll -= FIDGET_WEIGHTS[f]
      if (roll < 0) return f
    }
    for (const q of quirks) {
      roll -= QUIRK_WEIGHT
      if (roll < 0) return q as MascotState
    }
    return 'look'
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
