// Hoạt ảnh của cảnh địa điểm vẽ bằng ChatGPT Image (docs/26-scene-art-prompts.md): vật đứng yên ở khung 0, thỉnh
// thoảng làm động tác một lượt; lá rơi liên tục. Logic thuần (không DOM) để test bằng Vitest.

/** pingpong: đứng yên, thỉnh thoảng một lượt 0→5→0; burst: 0→5→0 nhanh (cá nhảy, lửa rồng); loop: luôn chạy vòng 0→5 (sóng, khói, đèn lồng) */
export type ActorKind = 'pingpong' | 'burst' | 'loop'

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
  /** Điểm neo trong khung sprite (0..1), mặc định (0.5, 1) = chân giữa đáy. Đèn lồng neo (0.5, 0); miệng rồng neo (0, 0.5) */
  ax?: number
  ay?: number
  /** Khi đứng yên thì ẩn (lửa/nước phun của rồng) */
  hideIdle?: boolean
  /** Lật ngang (sprite vẽ quay phải, cảnh cần quay trái) */
  flip?: boolean
  /** Chỉ hiện ban đêm (lửa/nước phun của Cầu Rồng) */
  night?: boolean
  /** Vầng sáng ấm quanh vật (đèn lồng), đường kính theo ảnh gốc */
  glow?: number
}

/** Dòng vật chạy liên tục dọc một đường (xe cộ, thuyền, tàu hơi nước): vào mép này, ra mép kia */
export interface LaneVariant {
  name: string
  frames: string[]
  w: number
  h: number
  /** px/s theo ảnh gốc */
  speed: [number, number]
  weight: number
  /** Khói/bọt đi cùng (tàu hơi nước), vị trí so với góc trên-trái khung vật */
  attach?: { frames: string[]; dx: number; dy: number; w: number; h: number; frameMs: number }
}

export interface LaneSpec {
  name: string
  /** Toạ độ chân vật (giữa đáy) */
  y: number
  /** 1 = đi sang phải, -1 = sang trái; 0 = hai chiều ngẫu nhiên */
  dir: -1 | 0 | 1
  /** Đoạn đường (toạ độ nền) vật đi qua; vật vào/ra ngoài đoạn này nên đặt ngoài khung hình */
  x: [number, number]
  /** Khoảng cách ngẫu nhiên giữa hai vật nối đuôi (ms) */
  gap: [number, number]
  /** Mờ dần ở hai đầu đoạn (px), 0 = không (vd thuyền vào hang thì mờ ở đầu ra) */
  fade: [number, number]
  frameMs: number
  /** Nhấp nhô dọc theo sóng (px) */
  bob?: number
  /** Đường chéo (thuyền vào hang xa dần): chân vật chạy từ y (ở x[0]) tới y1 (ở x[1]) và nhỏ dần tới tỉ lệ s1 */
  y1?: number
  /** Tỉ lệ cỡ ở x[0] (mặc định 1) và ở x[1]; vd thuyền từ cầu ra phía trước: s0 0.55 → s1 1 */
  s0?: number
  s1?: number
  /** dir 0: cùng một lúc chỉ đi một chiều (thuyền ngược chiều trên cùng đường không xuyên qua nhau) */
  exclusive?: boolean
  maxActive: number
  variants: LaneVariant[]
}

/** Mây/sương trôi trong một vùng (Sa Pa, Đà Lạt): dùng lại sprite mây chung với độ đậm thấp */
export interface MistSpec {
  x: [number, number]
  y: [number, number]
  count: number
  alpha: number
  w: [number, number]
  speed: [number, number]
}

/** Đồng hồ kim quay theo giờ máy (Tháp đồng hồ Bến Thành): toạ độ tâm mặt đồng hồ và bán kính kim phút */
export interface ClockSpec {
  x: number
  y: number
  r: number
}

export interface SceneAnimSpec {
  size: [number, number]
  actors: ActorSpec[]
  leaf: string[]
  /** Vùng trời trống cho mây/hạc/mặt trời; không có thì cảnh không có lớp trời */
  sky?: SkySpec
  lanes?: LaneSpec[]
  mist?: MistSpec
  clock?: ClockSpec
  /** Vùng lá rơi (toạ độ nền); mặc định tán cây Hà Nội */
  leafArea?: { xMin: number; xMax: number; ground: number }
  /** Hạc: mặc định 'crane'; 'none' ở nơi không hợp (phố, chợ nổi) */
  birds?: 'crane' | 'none'
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
  if (kind === 'loop') return up
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
    private readonly rnd: () => number = Math.random,
    /** Vật tạm không tham gia lịch (vd lửa rồng ban ngày) để không chiếm suất MAX_PLAYING */
    disabled: (a: Pick<ActorSpec, 'name' | 'kind' | 'frameMs' | 'frames'>) => boolean = () => false
  ) {
    this.states = actors.map((a) => ({
      // vật 'loop' luôn chạy (loopFrame), không do bộ lập lịch điều khiển
      next: a.kind === 'loop' || disabled(a) ? Infinity : now + this.range(800, 9000),
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

  /** Vật thứ i đang trong một lượt (để ẩn/hiện lửa rồng khi đứng yên) */
  active(i: number): boolean {
    return !!this.states[i]?.marks
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

// ---- Vật chạy vòng, dòng vật (lane), đồng hồ, vầng sáng, sương ----

/** Khung hiện tại của vật `loop`: chạy vòng 0..n-1, `phase` (ms) để các vật cùng loại không đồng bộ */
export function loopFrame(now: number, frameMs: number, n: number, phase = 0): number {
  return Math.floor((now + phase) / frameMs) % n
}

/** Độ đậm vầng sáng nhấp nháy nhẹ 0.75..1 theo thời gian, lệch pha theo vật */
export function glowPulse(now: number, phase = 0): number {
  return 0.875 + 0.125 * Math.sin((now + phase) / 700)
}

/** Góc kim (độ, 0 = 12 giờ, chiều kim đồng hồ) theo giờ máy */
export function clockAngles(d: Date): { hour: number; minute: number } {
  const m = d.getMinutes() + d.getSeconds() / 60
  return { hour: ((d.getHours() % 12) + m / 60) * 30, minute: m * 6 }
}

interface LaneItem {
  id: number
  variant: number
  x: number
  y: number
  dir: 1 | -1
  speed: number
  phase: number
  w: number
}

export interface LaneView {
  id: number
  variant: number
  x: number
  y: number
  /** 1 phải, -1 trái (sprite vẽ quay phải, trái thì lật ngang) */
  dir: 1 | -1
  frame: number
  alpha: number
  /** Tỉ lệ cỡ (đường chéo xa dần), 1 = cỡ gốc */
  scale: number
}

/** Bộ sinh dòng vật: vật nối đuôi nhau cách quãng ngẫu nhiên, đi hết đoạn đường thì bỏ */
export class LaneRunner {
  private items: LaneItem[] = []
  private nextSpawn: number
  private nextId = 1
  private last: number

  constructor(
    private readonly lane: LaneSpec,
    now: number,
    private readonly rnd: () => number = Math.random
  ) {
    this.nextSpawn = now
    // mồi trước để cảnh không trống lúc mới vào: chạy giả lập khoảng thời gian một vật đi hết đường
    const slowest = Math.min(...lane.variants.map((v) => v.speed[0]))
    const warm = Math.min(60000, ((lane.x[1] - lane.x[0]) / slowest) * 1000)
    this.last = now - warm
    this.nextSpawn = now - warm
    for (let t = now - warm; t < now; t += 100) this.step(t, 0.1)
    this.last = now
  }

  private range(a: number, b: number): number {
    return a + this.rnd() * (b - a)
  }

  private pickVariant(): number {
    const total = this.lane.variants.reduce((t, v) => t + v.weight, 0)
    let r = this.rnd() * total
    for (let i = 0; i < this.lane.variants.length; i++) {
      r -= this.lane.variants[i].weight
      if (r <= 0) return i
    }
    return this.lane.variants.length - 1
  }

  private spawn(at: number): void {
    const L = this.lane
    // exclusive: đang có vật thì chỉ sinh thêm vật cùng chiều với chúng
    const dir: 1 | -1 =
      L.dir !== 0
        ? L.dir
        : L.exclusive && this.items.length
          ? this.items[0].dir
          : this.rnd() < 0.5
            ? 1
            : -1
    const vi = this.pickVariant()
    const v = L.variants[vi]
    const edge = dir === 1 ? L.x[0] : L.x[1]
    // không chồng lên vật đi trước cùng chiều: dời mốc vào nếu vật cuối còn quá gần mép vào
    if (this.items.some((o) => o.dir === dir && Math.abs(o.x - edge) < ((v.w + o.w) / 2) * 1.1)) {
      this.nextSpawn = at + 300
      return
    }
    // vật sau chỉ bị ép chạy chậm bằng vật trước khi nó SẼ đuổi kịp trước lúc vật trước ra khỏi đường
    const ahead = this.items.filter((o) => o.dir === dir)
    const leader = ahead.length
      ? ahead.reduce((a, b) => (Math.abs(a.x - edge) < Math.abs(b.x - edge) ? a : b))
      : null
    let speed = this.range(v.speed[0], v.speed[1])
    if (leader && speed > leader.speed) {
      const gap0 = Math.abs(leader.x - edge) - ((v.w + leader.w) / 2) * 1.1
      const left = dir === 1 ? L.x[1] - leader.x : leader.x - L.x[0]
      if (gap0 / (speed - leader.speed) < left / leader.speed) speed = leader.speed
    }
    this.items.push({
      id: this.nextId++,
      variant: vi,
      x: edge,
      y: L.y,
      dir,
      speed,
      phase: this.rnd() * 6000,
      w: v.w
    })
    this.nextSpawn = at + this.range(L.gap[0], L.gap[1])
  }

  private step(t: number, dt: number): void {
    const L = this.lane
    this.items.forEach((o) => (o.x += o.dir * o.speed * dt))
    this.items = this.items.filter((o) => (o.dir === 1 ? o.x < L.x[1] : o.x > L.x[0]))
    if (L.variants.length && t >= this.nextSpawn && this.items.length < L.maxActive) this.spawn(t)
  }

  /** Số vật đang chạy (để test) */
  count(): number {
    return this.items.length
  }

  tick(now: number): LaneView[] {
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000))
    this.last = now
    if (dt > 0) this.step(now, dt)
    const L = this.lane
    return this.items.map((o) => {
      const v = L.variants[o.variant]
      const travelled = o.dir === 1 ? o.x - L.x[0] : L.x[1] - o.x
      const remaining = o.dir === 1 ? L.x[1] - o.x : o.x - L.x[0]
      const fin = L.fade[0] > 0 ? travelled / L.fade[0] : 1
      const fout = L.fade[1] > 0 ? remaining / L.fade[1] : 1
      // vị trí dọc đường theo x (0 ở x[0], 1 ở x[1]) bất kể chiều đi: đường chéo cố định trên cảnh
      const pos = (o.x - L.x[0]) / (L.x[1] - L.x[0])
      const baseY = L.y1 === undefined ? o.y : L.y + (L.y1 - L.y) * pos
      return {
        id: o.id,
        variant: o.variant,
        x: o.x,
        scale: L.s0 === undefined && L.s1 === undefined ? 1 : (L.s0 ?? 1) + ((L.s1 ?? 1) - (L.s0 ?? 1)) * pos,
        y: baseY + (L.bob ? L.bob * Math.sin((now + o.phase) / 520) : 0),
        dir: o.dir,
        frame: loopFrame(now, L.frameMs, v.frames.length, o.phase),
        alpha: Math.max(0, Math.min(1, fin, fout))
      }
    })
  }
}

export interface MistPuff {
  x: number
  y: number
  w: number
  speed: number
  kind: number
}

/** Một cụm sương: mọc ở mép phải vùng (hoặc chỗ bất kỳ lúc mới vào cảnh), trôi sang trái */
export function spawnMist(m: MistSpec, rnd: () => number = Math.random, anywhere = false): MistPuff {
  const r = (a: number, b: number): number => a + rnd() * (b - a)
  const w = r(m.w[0], m.w[1])
  return {
    x: anywhere ? r(m.x[0], m.x[1]) : m.x[1] + w / 2,
    y: r(m.y[0], m.y[1]),
    w,
    speed: r(m.speed[0], m.speed[1]),
    kind: Math.floor(rnd() * 3)
  }
}

/** Độ đậm sương: độ đậm gốc nhân hệ số mờ ở hai mép vùng */
export function mistAlpha(p: MistPuff, m: MistSpec, fade = 160): number {
  const left = (p.x - m.x[0]) / fade
  const right = (m.x[1] + p.w / 2 - p.x) / fade
  return m.alpha * Math.max(0, Math.min(1, left, right))
}
