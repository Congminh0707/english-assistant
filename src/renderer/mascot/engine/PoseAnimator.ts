/** Phần của "cơ thể" mà MascotBrain cần: chọn hoạt ảnh theo tên và biết khi hoạt ảnh một lần chạy xong */
export interface Animator {
  /** Gọi khi một hoạt ảnh không lặp chạy xong */
  onFinish: ((name: string) => void) | null
  play(name: string, restart?: boolean): void
  /** Tên các hoạt ảnh riêng của nhân vật (quirk_*, click_*); thú cưng vector không có */
  names(): string[]
}

/**
 * Trạng thái của não → dáng của thú cưng chibi vector (shared/art/pets, 19 dáng). Hoạt ảnh lặp bằng CSS trong chính hình,
 * nên "một lần" ở đây chỉ là thời gian giữ dáng rồi báo xong để não quay về idle.
 */
const POSE: Record<string, string> = {
  idle: 'idle',
  walk: 'walk',
  drag: 'surprised',
  fall: 'surprised',
  land: 'sit',
  happy: 'happy',
  love: 'happy',
  eat: 'eat',
  sleep: 'sleep',
  sad: 'sad',
  surprised: 'surprised',
  angry: 'surprised',
  look: 'idle',
  wag: 'idle',
  yawn: 'sit',
  stretch: 'listen',
  wave: 'hello',
  dance: 'jump',
  spin: 'walk',
  think: 'read',
  levelup: 'levelup',
  notice: 'idle',
  giggle: 'happy',
  nuzzle: 'sit',
  trick: 'hello',
  dizzy: 'surprised',
  purr: 'happy',
  groove: 'listen'
}

/**
 * Chuyển động cả thân chồng lên dáng (lớp CSS `m-*` trong PetFigure): cùng 19 dáng nhưng thêm nghiêng, lắc, lộn vòng...
 * Không có trong bảng = chỉ có hoạt ảnh sẵn của dáng.
 */
const MOTION: Record<string, string> = {
  look: 'peek',
  wag: 'wag',
  dance: 'sway',
  spin: 'shimmy',
  love: 'sway',
  notice: 'perk',
  giggle: 'wiggle',
  nuzzle: 'squash',
  trick: 'bounce',
  dizzy: 'dizzy',
  purr: 'sway',
  groove: 'shimmy'
}

/** Thời gian giữ dáng (giây) của hoạt ảnh một lần; không có trong bảng = lặp tới khi não đổi trạng thái */
const ONE_SHOT_SECONDS: Record<string, number> = {
  land: 0.8,
  happy: 2.2,
  love: 2.2,
  eat: 3,
  sad: 2.8,
  surprised: 1.8,
  angry: 1.8,
  look: 2,
  wag: 2,
  yawn: 2.4,
  stretch: 2.4,
  wave: 2.4,
  dance: 2.6,
  spin: 2,
  think: 3,
  levelup: 3.6,
  notice: 1.2,
  giggle: 2.2,
  nuzzle: 2,
  trick: 1.4,
  dizzy: 2.5,
  purr: 2.8,
  groove: 2.2
}

export const poseOf = (state: string): string => POSE[state] ?? 'idle'
export const motionOf = (state: string): string => MOTION[state] ?? ''

export class PoseAnimator implements Animator {
  onFinish: ((name: string) => void) | null = null
  private current = 'idle'
  private elapsed = 0

  /** `onPose` được gọi khi dáng hoặc chuyển động hiển thị đổi */
  constructor(private readonly onPose: (pose: string, motion: string) => void) {}

  get animation(): string {
    return this.current
  }

  names(): string[] {
    return []
  }

  play(name: string, restart = false): void {
    if (name === this.current && !restart) return
    this.current = name
    this.elapsed = 0
    this.onPose(poseOf(name), motionOf(name))
  }

  update(dt: number): void {
    const limit = ONE_SHOT_SECONDS[this.current]
    if (limit === undefined) return
    this.elapsed += dt
    if (this.elapsed >= limit) {
      const finished = this.current
      this.play('idle')
      this.onFinish?.(finished)
    }
  }
}
