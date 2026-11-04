// Hoạt ảnh của cảnh địa điểm vẽ bằng ChatGPT Image (docs/26-scene-art-prompts.md): vật đứng yên ở khung 0, thỉnh
// thoảng làm động tác một lượt; lá rơi liên tục. Logic thuần (không DOM) để test bằng Vitest.

export type ActorKind = 'pingpong' | 'burst'

export interface ActorSpec {
  name: string
  /** Chân vật (giữa đáy), toạ độ nền gốc */
  x: number
  y: number
  w: number
  h: number
  kind: ActorKind
  frameMs: number
  frames: string[]
}

export interface SceneAnimSpec {
  size: [number, number]
  actors: ActorSpec[]
  leaf: string[]
  /** Vùng trời trống cho mây/hạc/mặt trời; không có thì cảnh không có lớp trời */
  sky?: SkySpec
}

/** Mỗi vật nghỉ 5–10 s giữa hai lượt của chính nó */
export const GAP_MIN = 5000
export const GAP_MAX = 10000
/** Hai lượt bất kỳ bắt đầu cách nhau 2–4 s */
export const START_GAP_MIN = 2000
export const START_GAP_MAX = 4000
/** Tối đa bấy nhiêu vật cử động cùng lúc */
export const MAX_PLAYING = 2
/** Nhịp mỗi khung dao động ±15 % để không đều như máy */
const JITTER = 0.15

/** Thứ tự khung một lượt: ping-pong 0→5→0, burst 0→5 rồi về 0 */
export function sequence(kind: ActorKind, n: number): number[] {
  const up = Array.from({ length: n }, (_, i) => i)
  return kind === 'pingpong' ? [...up, ...up.slice(0, -1).reverse()] : [...up, 0]
}

interface ActorState {
  next: number
  /** Thời điểm bắt đầu từng khung của lượt đang chạy (null = đang đứng yên) */
  marks: number[] | null
  seq: number[]
  count: number
}

export class ActorScheduler {
  private readonly states: ActorState[]
  private lastStart = -Infinity
  private lastName = ''
  private startGap = 0

  constructor(
    private readonly actors: ReadonlyArray<Pick<ActorSpec, 'name' | 'kind' | 'frameMs' | 'frames'>>,
    now: number,
    private readonly rnd: () => number = Math.random
  ) {
    this.states = actors.map((a) => ({
      next: now + this.range(800, 9000),
      marks: null,
      seq: sequence(a.kind, a.frames.length),
      count: 0
    }))
  }

  private range(a: number, b: number): number {
    return a + this.rnd() * (b - a)
  }

  /** Số vật đang cử động */
  playing(): number {
    return this.states.filter((s) => s.marks).length
  }

  /** Số lượt đã chạy của vật thứ i (để test) */
  count(i: number): number {
    return this.states[i]?.count ?? 0
  }

  /** Cập nhật theo thời gian, trả về khung đang hiện của từng vật */
  tick(now: number): number[] {
    // kết thúc lượt đã chạy xong
    this.states.forEach((s) => {
      if (s.marks && now >= s.marks[s.marks.length - 1]) {
        s.marks = null
        s.next = now + this.range(GAP_MIN, GAP_MAX)
      }
    })
    this.maybeStart(now)
    return this.states.map((s) => {
      if (!s.marks) return 0
      let i = 0
      while (i + 1 < s.seq.length && now >= s.marks[i + 1]) i++
      return s.seq[i]
    })
  }

  private maybeStart(now: number): void {
    if (now - this.lastStart < this.startGap) return
    if (this.playing() >= MAX_PLAYING) return
    let due = this.states.map((s, i) => ({ s, i })).filter(({ s }) => !s.marks && s.next <= now)
    if (!due.length) return
    if (due.length > 1) due = due.filter(({ i }) => this.actors[i].name !== this.lastName)
    // ưu tiên vật chờ lâu nhất: chọn ngẫu nhiên trong 2 vật đến hạn sớm nhất
    due.sort((a, b) => a.s.next - b.s.next)
    const pick = due[Math.floor(this.rnd() * Math.min(2, due.length))]
    const a = this.actors[pick.i]
    const marks = [now]
    for (let k = 1; k <= pick.s.seq.length; k++) {
      marks.push(marks[k - 1] + a.frameMs * this.range(1 - JITTER, 1 + JITTER))
    }
    pick.s.marks = marks
    pick.s.count++
    this.lastStart = now
    this.lastName = a.name
    this.startGap = this.range(START_GAP_MIN, START_GAP_MAX)
  }
}

/** Lá rơi chậm, bất quy tắc: tốc độ rơi dao động, lắc ngang là tổng 2 sóng, chạm đất thì mọc lại ở tán cây */
export interface Leaf {
  t: number
  x0: number
  y: number
  vy: number
  size: number
  a1: number
  f1: number
  p1: number
  a2: number
  f2: number
  p2: number
  fv: number
  pv: number
  /** Số khung xoay mỗi giây, âm = xoay ngược */
  rot: number
  drift: number
}

/** Vùng tán cây và mặt đất (toạ độ nền gốc) */
export interface LeafArea {
  xMin: number
  xMax: number
  ground: number
}

export function spawnLeaf(area: LeafArea, rnd: () => number = Math.random, anywhere = false): Leaf {
  const r = (a: number, b: number): number => a + rnd() * (b - a)
  return {
    t: r(0, 50),
    x0: r(area.xMin, area.xMax),
    y: anywhere ? r(-40, area.ground - 40) : r(-60, 40),
    vy: r(18, 34),
    size: r(40, 60),
    a1: r(20, 45),
    f1: r(0.15, 0.35),
    p1: r(0, 2 * Math.PI),
    a2: r(6, 18),
    f2: r(0.6, 1.1),
    p2: r(0, 2 * Math.PI),
    fv: r(0.2, 0.5),
    pv: r(0, 2 * Math.PI),
    rot: r(0.6, 1.6) * (rnd() < 0.5 ? -1 : 1),
    drift: r(0.1, 0.3)
  }
}

/** Đi tiếp `dt` giây; trả về vị trí tâm lá và khung xoay */
export function stepLeaf(
  l: Leaf,
  dt: number,
  frames: number
): { x: number; y: number; frame: number } {
  const TAU = 2 * Math.PI
  l.t += dt
  l.y += l.vy * dt * (1 + 0.6 * Math.sin(l.t * l.fv * TAU + l.pv))
  const x =
    l.x0 +
    l.a1 * Math.sin(l.t * l.f1 * TAU + l.p1) +
    l.a2 * Math.sin(l.t * l.f2 * TAU + l.p2) +
    l.y * l.drift
  const fi = Math.floor(l.t * Math.abs(l.rot) * frames) % frames
  return { x, y: l.y, frame: l.rot < 0 ? frames - 1 - fi : fi }
}

// ---- Bầu trời: mây trôi, hạc bay, mặt trời/mặt trăng (không vẽ vào tranh nền, docs/26) ----

/** Vùng trời trống của tranh (toạ độ nền gốc) và chỗ mặt trời/mặt trăng */
export interface SkySpec {
  x: [number, number]
  y: [number, number]
  sun: [number, number]
}

export interface Cloud {
  x: number
  y: number
  /** px/s, trôi sang trái */
  speed: number
  /** 0..2 mây trắng, 3 mây mưa */
  kind: number
  /** chiều rộng (đơn vị ảnh gốc) */
  w: number
}

/** Mây sinh ra ở mép phải vùng trời (hoặc chỗ bất kỳ lúc mới vào cảnh) */
export function spawnCloud(
  sky: SkySpec,
  rain: boolean,
  rnd: () => number = Math.random,
  anywhere = false
): Cloud {
  const r = (a: number, b: number): number => a + rnd() * (b - a)
  const w = rain ? r(240, 340) : r(140, 280)
  return {
    x: anywhere ? r(sky.x[0], sky.x[1]) : sky.x[1] + w / 2,
    y: r(sky.y[0], sky.y[1]),
    speed: r(5, 11),
    kind: rain ? 3 : Math.floor(rnd() * 3),
    w
  }
}

/** Độ đậm của mây: hiện dần ở mép phải, mờ dần trước khi ra khỏi vùng trời (khỏi đè lên cây/nhà) */
export function cloudAlpha(c: Cloud, sky: SkySpec, fade = 140): number {
  const left = (c.x - sky.x[0]) / fade
  const right = (sky.x[1] + c.w / 2 - c.x) / fade
  return Math.max(0, Math.min(1, left, right))
}

export interface Crane {
  x: number
  y0: number
  /** px/s, bay sang trái */
  speed: number
  t: number
  phase: number
  size: number
}

/** Một đàn 1–3 con hạc bay từ mép phải sang trái, so le nhau */
export function spawnFlock(width: number, rnd: () => number = Math.random): Crane[] {
  const r = (a: number, b: number): number => a + rnd() * (b - a)
  const n = 1 + Math.floor(rnd() * 3)
  const y = r(60, 170)
  const speed = r(70, 95)
  return Array.from({ length: n }, (_, i) => ({
    x: width + 80 + i * r(70, 120),
    y0: y + i * r(18, 34),
    speed: speed * r(0.95, 1.05),
    t: 0,
    phase: rnd() * 6,
    size: r(95, 120) * (1 - i * 0.08)
  }))
}

/** Đi tiếp `dt` giây; khung vỗ cánh ~7 khung/giây, nhấp nhô nhẹ */
export function stepCrane(
  c: Crane,
  dt: number,
  frames: number
): { x: number; y: number; frame: number } {
  c.t += dt
  c.x -= c.speed * dt
  return {
    x: c.x,
    y: c.y0 + 6 * Math.sin(c.t * 2.2 + c.phase),
    frame: Math.floor(c.t * 7 + c.phase) % frames
  }
}
