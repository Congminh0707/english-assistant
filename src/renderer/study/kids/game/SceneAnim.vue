<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ActorScheduler,
  LaneRunner,
  clockAngles,
  cloudAlpha,
  glowPulse,
  loopFrame,
  mistAlpha,
  spawnCloud,
  spawnFlock,
  spawnLeaf,
  spawnMist,
  stepCrane,
  stepLeaf,
  type Cloud,
  type Crane,
  type Leaf,
  type LeafArea,
  type MistPuff,
  type SceneAnimSpec
} from './sceneAnim'
import type { Weather } from './sceneWeather'

// Lớp vật động của cảnh vẽ bằng ChatGPT Image (docs/26-scene-art-prompts.md): sprite 6 khung đứng yên ở khung 0,
// thỉnh thoảng làm động tác một lượt (ActorScheduler); vật 'loop' (sóng, khói, đèn lồng) luôn chạy vòng; vật neo theo
// (ax, ay), lật ngang (flip), ẩn khi đứng yên (hideIdle: lửa rồng), vầng sáng ấm (glow, đèn lồng). Dòng vật (lanes:
// xe, thuyền, tàu hơi nước có khói đi kèm), sương trôi, kim đồng hồ quay theo giờ máy; lá rơi liên tục; bầu trời theo
// thời tiết: mây trôi, hạc bay (trời quang/nắng, trừ khi birds = 'none'), mặt trời, mây mưa, mặt trăng (đêm).
// Ảnh là file WebP Vite đóng gói ('self', hợp CSP). Không bắt chuột; dừng khi cửa sổ ẩn (rAF tự dừng).
// Giảm chuyển động → đứng yên: khung 0, không lanes, không lá/hạc, mây/sương đứng yên, kim đúng giờ một lần, glow tĩnh.
const props = defineProps<{ placeId: string; width: number; height: number; weather: Weather }>()

const specs = import.meta.glob<SceneAnimSpec>('./sceneAnim/*.json', {
  eager: true,
  import: 'default'
})
const urls = import.meta.glob<string>('./sceneAnim/*/*.webp', {
  eager: true,
  query: '?url',
  import: 'default'
})

const spec = computed<SceneAnimSpec | null>(
  () => specs[`./sceneAnim/${props.placeId}.json`] ?? null
)
const url = (frame: string): string => urls[`./sceneAnim/${props.placeId}/${frame}.webp`] ?? ''
/** Sprite bầu trời dùng chung mọi cảnh */
const skyUrl = (name: string): string => urls[`./sceneAnim/sky/${name}.webp`] ?? ''
/** Sương mù riêng (dải mờ không viền, gen_mist.py), không dùng sprite mây */
const mistUrl = (kind: number): string => urls[`./sceneAnim/mist/mist-${kind}.webp`] ?? ''
const CRANE = ['crane-0', 'crane-1', 'crane-2', 'crane-3', 'crane-4', 'crane-5']
const CLOUD = ['cloud-0', 'cloud-1', 'cloud-2', 'raincloud']
const CLOUDS: Record<Weather, number> = { clear: 3, sun: 2, rain: 4, night: 2 }
const SUN_SIZE = 150
const MOON_SIZE = 110
const INK = '#3b2a1d'
const CLOCK_NUMS = [{ t: 12, dx: 0, dy: -1 }, { t: 3, dx: 1, dy: 0 }, { t: 6, dx: 0, dy: 1 }, { t: 9, dx: -1, dy: 0 }]
/** Lá rơi nằm trên mọi vật (vật có z-index theo y) */
const LEAF_Z = 100000
// Nền phủ khung kiểu `xMidYMid slice`: cùng một tỉ lệ cho x, y, căn giữa, cắt mép thừa
const k = computed(() => {
  const [w, h] = spec.value?.size ?? [1, 1]
  return Math.max(props.width / w, props.height / h)
})
const ox = computed(() => (props.width - (spec.value?.size[0] ?? 0) * k.value) / 2)
const oy = computed(() => (props.height - (spec.value?.size[1] ?? 0) * k.value) / 2)

/** Vùng lá rơi mặc định: dưới tán cây góc trái, xuống tới nền đá (Hà Nội) */
const LEAF_AREA: LeafArea = { xMin: 40, xMax: 820, ground: 930 }
const LEAF_COUNT = 7

/** Một ảnh của dòng vật hoặc khói đi kèm, toạ độ nền gốc (góc trên-trái + cỡ) */
interface LaneItemView {
  key: string
  src: string
  x: number
  y: number
  w: number
  h: number
  flip: boolean
  alpha: number
  z: number
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const frames = ref<number[]>([])
const activeView = ref<boolean[]>([])
const glowView = ref<number[]>([])
const leafView = ref<Array<{ x: number; y: number; size: number; frame: number }>>([])
const cloudView = ref<Array<{ x: number; y: number; w: number; kind: number; alpha: number }>>([])
const craneView = ref<Array<{ x: number; y: number; size: number; frame: number }>>([])
const mistView = ref<Array<{ x: number; y: number; w: number; kind: number; alpha: number }>>([])
const laneView = ref<LaneItemView[]>([])
const hands = ref<{ hour: number; minute: number }>({ hour: 0, minute: 0 })
let scheduler: ActorScheduler | null = null
let leaves: Leaf[] = []
let leafArea: LeafArea = LEAF_AREA
let clouds: Cloud[] = []
let cranes: Crane[] = []
let mist: MistPuff[] = []
let runners: LaneRunner[] = []
let lastSec = -1
/** Thời điểm (ms) đàn hạc tiếp theo bay qua */
let nextFlock = 0
let raf = 0
let prev = 0

/** Đàn hạc cách nhau 12–30 s, chỉ khi trời quang hoặc nắng */
const flockGap = (): number => 12000 + Math.random() * 18000
const sunny = computed(() => props.weather === 'clear' || props.weather === 'sun')
/** Lệch pha riêng từng vật (loop, glow) để các vật cùng loại không đồng bộ */
const phaseOf = (i: number): number => (i * 937) % 4000
const glowLevel = (now: number, i: number): number =>
  glowPulse(now, phaseOf(i)) * (props.weather === 'night' ? 1 : 0.55)

function setup(): void {
  cancelAnimationFrame(raf)
  scheduler = null
  const s = spec.value
  const t0 = performance.now()
  frames.value = s ? s.actors.map(() => 0) : []
  activeView.value = s ? s.actors.map(() => false) : []
  glowView.value = s ? s.actors.map((_, i) => glowLevel(reduced ? 0 : t0, i)) : []
  leafView.value = []
  craneView.value = []
  laneView.value = []
  cranes = []
  runners = []
  leaves = []
  leafArea = s?.leafArea ?? LEAF_AREA
  lastSec = -1
  const sky = s?.sky
  clouds = sky
    ? Array.from({ length: CLOUDS[props.weather] }, () =>
        spawnCloud(sky, props.weather === 'rain', Math.random, true)
      )
    : []
  drawClouds()
  const m = s?.mist
  mist = m ? Array.from({ length: m.count }, () => spawnMist(m, Math.random, true)) : []
  drawMist()
  stepClock(true)
  if (!s || reduced) return
  if (s.birds !== 'none') CRANE.forEach((f) => (new Image().src = skyUrl(f)))
  nextFlock = t0 + 3000 + Math.random() * 6000
  // nạp trước mọi khung để đổi khung không nháy
  s.actors.forEach((a) => a.frames.forEach((f) => (new Image().src = url(f))))
  s.leaf.forEach((f) => (new Image().src = url(f)))
  s.lanes?.forEach((l) =>
    l.variants.forEach((v) => {
      v.frames.forEach((f) => (new Image().src = url(f)))
      v.attach?.frames.forEach((f) => (new Image().src = url(f)))
    })
  )
  // vật chỉ hiện ban đêm (lửa rồng): ban ngày đổi thành 'loop' để bộ lập lịch bỏ qua, khỏi chiếm suất MAX_PLAYING
  // vật chỉ-ban-đêm (lửa/nước rồng) không chiếm suất cử động ban ngày
  scheduler = new ActorScheduler(
    s.actors,
    t0,
    Math.random,
    (a) => !!s.actors.find((x) => x.name === a.name)?.night && props.weather !== 'night'
  )
  runners = (s.lanes ?? []).map((l) => new LaneRunner(l, t0))
  leaves = s.leaf.length
    ? Array.from({ length: LEAF_COUNT }, () => spawnLeaf(leafArea, Math.random, true))
    : []
  prev = t0
  raf = requestAnimationFrame(loop)
}

function loop(now: number): void {
  // cửa sổ ẩn lâu rồi hiện lại: không cho lá nhảy cóc
  const dt = Math.min(0.1, (now - prev) / 1000)
  prev = now
  const s = spec.value
  const sch = scheduler
  if (sch && s) {
    const f = sch.tick(now)
    const fr = f.map((v, i) => {
      const a = s.actors[i]
      return a.kind === 'loop' ? loopFrame(now, a.frameMs, a.frames.length, phaseOf(i)) : v
    })
    if (fr.some((v, i) => v !== frames.value[i])) frames.value = fr
    const act = s.actors.map((_, i) => sch.active(i))
    if (act.some((v, i) => v !== activeView.value[i])) activeView.value = act
    if (s.actors.some((a) => a.glow)) glowView.value = s.actors.map((_, i) => glowLevel(now, i))
  }
  const n = s?.leaf.length ?? 0
  leafView.value = leaves.map((l, i) => {
    if (l.y > leafArea.ground) leaves[i] = l = spawnLeaf(leafArea)
    const p = stepLeaf(l, dt, n)
    return { x: p.x, y: p.y, size: l.size, frame: p.frame }
  })
  stepLanes(now)
  stepMist(dt)
  stepClock(false)
  stepSky(now, dt)
  raf = requestAnimationFrame(loop)
}

function stepLanes(now: number): void {
  const lanes = spec.value?.lanes
  if (!lanes?.length) return
  const out: LaneItemView[] = []
  runners.forEach((r, li) => {
    const lane = lanes[li]
    r.tick(now).forEach((v) => {
      const vr = lane.variants[v.variant]
      const sw = vr.w * v.scale
      const sh = vr.h * v.scale
      const key = `${li}-${v.id}`
      const z = Math.round(v.y)
      out.push({
        key,
        src: vr.frames[v.frame],
        x: v.x - sw / 2,
        y: v.y - sh,
        w: sw,
        h: sh,
        flip: v.dir === -1,
        alpha: v.alpha,
        z
      })
      const at = vr.attach
      if (at) {
        // sprite vẽ quay phải; đi trái thì khói lật theo hướng
        const dx = (v.dir === 1 ? at.dx : vr.w - at.dx - at.w) * v.scale
        out.push({
          key: `${key}-fx`,
          src: at.frames[loopFrame(now, at.frameMs, at.frames.length)],
          x: v.x - sw / 2 + dx,
          y: v.y - sh + at.dy * v.scale,
          w: at.w * v.scale,
          h: at.h * v.scale,
          flip: false,
          alpha: v.alpha,
          z: z + 1
        })
      }
    })
  })
  laneView.value = out
}

function drawMist(): void {
  const m = spec.value?.mist
  mistView.value = m
    ? mist.map((p) => ({ x: p.x, y: p.y, w: p.w, kind: p.kind, alpha: mistAlpha(p, m) }))
    : []
}

function stepMist(dt: number): void {
  const m = spec.value?.mist
  if (!m) return
  mist = mist.map((p) => {
    p.x -= p.speed * dt
    return p.x < m.x[0] - p.w / 2 ? spawnMist(m) : p
  })
  drawMist()
}

/** Kim đồng hồ: cập nhật khi giây đổi (hoặc ép vẽ lần đầu) */
function stepClock(force: boolean): void {
  if (!spec.value?.clock) return
  const d = new Date()
  const sec = Math.floor(d.getTime() / 1000)
  if (!force && sec === lastSec) return
  lastSec = sec
  hands.value = clockAngles(d)
}

function drawClouds(): void {
  const sky = spec.value?.sky
  cloudView.value = sky
    ? clouds.map((c) => ({ x: c.x, y: c.y, w: c.w, kind: c.kind, alpha: cloudAlpha(c, sky) }))
    : []
}

function stepSky(now: number, dt: number): void {
  const s = spec.value
  const sky = s?.sky
  if (!s || !sky) return
  clouds = clouds.map((c) => {
    c.x -= c.speed * dt
    return c.x < sky.x[0] - c.w / 2 ? spawnCloud(sky, props.weather === 'rain') : c
  })
  drawClouds()
  if (s.birds !== 'none' && sunny.value && !cranes.length && now >= nextFlock) {
    cranes = spawnFlock(s.size[0])
  }
  if (cranes.length) {
    const view = cranes.map((c) => ({ ...stepCrane(c, dt, CRANE.length), size: c.size }))
    if (view.every((v) => v.x < -200)) {
      cranes = []
      nextFlock = now + flockGap()
    }
    craneView.value = view
  } else if (craneView.value.length) craneView.value = []
}

onMounted(setup)
watch(() => [props.placeId, props.weather], setup)
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div v-if="spec" class="scene-anim" aria-hidden="true">
    <img
      v-if="spec.sky && weather !== 'rain'"
      class="orb"
      :class="weather === 'night' ? 'moon' : 'sun'"
      :src="skyUrl(weather === 'night' ? 'moon' : 'sun')"
      alt=""
      draggable="false"
      :style="{
        left: `${ox + spec.sky.sun[0] * k}px`,
        top: `${oy + spec.sky.sun[1] * k}px`,
        width: `${(weather === 'night' ? MOON_SIZE : SUN_SIZE) * k}px`
      }"
    />
    <img
      v-for="(c, i) in cloudView"
      :key="`cloud${i}`"
      class="cloud"
      :src="skyUrl(CLOUD[c.kind])"
      alt=""
      draggable="false"
      :style="{
        width: `${c.w * k}px`,
        opacity: c.alpha,
        transform: `translate(${ox + (c.x - c.w / 2) * k}px, ${oy + c.y * k}px)`
      }"
    />
    <img
      v-for="(p, i) in mistView"
      :key="`mist${i}`"
      class="cloud"
      :src="mistUrl(p.kind)"
      alt=""
      draggable="false"
      :style="{
        width: `${p.w * k}px`,
        opacity: p.alpha,
        transform: `translate(${ox + (p.x - p.w / 2) * k}px, ${oy + p.y * k}px)`
      }"
    />
    <img
      v-for="(c, i) in craneView"
      :key="`crane${i}`"
      class="crane"
      :src="skyUrl(CRANE[c.frame])"
      alt=""
      draggable="false"
      :style="{
        width: `${c.size * k}px`,
        transform: `translate(${ox + (c.x - c.size / 2) * k}px, ${oy + c.y * k}px)`
      }"
    />
    <template v-for="(a, i) in spec.actors" :key="a.name">
      <div
        v-if="a.glow"
        class="glow"
        :style="{
          left: `${ox + (a.x - a.glow / 2) * k}px`,
          top: `${oy + (a.y + a.h * 0.45 - a.glow / 2) * k}px`,
          width: `${a.glow * k}px`,
          height: `${a.glow * k}px`,
          opacity: glowView[i] ?? 0,
          zIndex: Math.round(a.y) - 1
        }"
      />
      <img
        class="actor"
        :src="url(a.frames[frames[i] ?? 0])"
        alt=""
        draggable="false"
        :style="{
          left: `${ox + (a.x - a.w * (a.ax ?? 0.5)) * k}px`,
          top: `${oy + (a.y - a.h * (a.ay ?? 1)) * k}px`,
          width: `${a.w * k}px`,
          height: `${a.h * k}px`,
          zIndex: Math.round(a.y),
          opacity: (a.hideIdle && !activeView[i]) || (a.night && weather !== 'night') ? 0 : undefined,
          transform: a.flip ? 'scaleX(-1)' : undefined
        }"
      />
    </template>
    <img
      v-for="it in laneView"
      :key="it.key"
      class="actor"
      :src="url(it.src)"
      alt=""
      draggable="false"
      :style="{
        left: `${ox + it.x * k}px`,
        top: `${oy + it.y * k}px`,
        width: `${it.w * k}px`,
        height: `${it.h * k}px`,
        opacity: it.alpha,
        zIndex: it.z,
        transform: it.flip ? 'scaleX(-1)' : undefined
      }"
    />
    <svg
      v-if="spec.clock"
      class="clock"
      :viewBox="`0 0 ${2 * spec.clock.r + 20} ${2 * spec.clock.r + 20}`"
      :style="{
        left: `${ox + (spec.clock.x - spec.clock.r - 10) * k}px`,
        top: `${oy + (spec.clock.y - spec.clock.r - 10) * k}px`,
        width: `${(2 * spec.clock.r + 20) * k}px`,
        height: `${(2 * spec.clock.r + 20) * k}px`
      }"
    >
      <g :stroke="INK" stroke-linecap="round">
        <line
          v-for="t in 12"
          :key="`tick${t}`"
          :x1="spec.clock.r + 10"
          :y1="spec.clock.r + 10 - spec.clock.r * 0.97"
          :x2="spec.clock.r + 10"
          :y2="spec.clock.r + 10 - spec.clock.r * (t % 3 === 0 ? 0.8 : 0.88)"
          :stroke-width="t % 3 === 0 ? 3 : 1.8"
          :transform="`rotate(${t * 30} ${spec.clock.r + 10} ${spec.clock.r + 10})`"
        />
      </g>
      <text
        v-for="n in CLOCK_NUMS"
        :key="`num${n.t}`"
        :x="spec.clock.r + 10 + n.dx * spec.clock.r * 0.62"
        :y="spec.clock.r + 10 + n.dy * spec.clock.r * 0.62"
        :fill="INK"
        :font-size="spec.clock.r * 0.3"
        font-weight="700"
        text-anchor="middle"
        dominant-baseline="central"
      >
        {{ n.t }}
      </text>
      <g :transform="`rotate(${hands.hour} ${spec.clock.r + 10} ${spec.clock.r + 10})`">
        <line
          :x1="spec.clock.r + 10"
          :y1="spec.clock.r + 10"
          :x2="spec.clock.r + 10"
          :y2="spec.clock.r + 10 - spec.clock.r * 0.6"
          :stroke="INK"
          stroke-width="5"
          stroke-linecap="round"
        />
      </g>
      <g :transform="`rotate(${hands.minute} ${spec.clock.r + 10} ${spec.clock.r + 10})`">
        <line
          :x1="spec.clock.r + 10"
          :y1="spec.clock.r + 10"
          :x2="spec.clock.r + 10"
          :y2="spec.clock.r + 10 - spec.clock.r * 0.9"
          :stroke="INK"
          stroke-width="3.5"
          stroke-linecap="round"
        />
      </g>
      <circle :cx="spec.clock.r + 10" :cy="spec.clock.r + 10" r="4.5" :fill="INK" />
    </svg>
    <img
      v-for="(l, i) in leafView"
      :key="`leaf${i}`"
      class="leaf"
      :src="url(spec.leaf[l.frame])"
      alt=""
      draggable="false"
      :style="{
        width: `${l.size * k}px`,
        zIndex: LEAF_Z,
        transform: `translate(${ox + (l.x - l.size / 2) * k}px, ${oy + l.y * k}px)`
      }"
    />
  </div>
</template>

<style scoped>
.scene-anim {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  /* z-index của vật/xe/lá chỉ so với nhau, không thoát ra so với lớp thời tiết, HUD, biển chạm */
  isolation: isolate;
}
.actor {
  position: absolute;
}
.glow {
  position: absolute;
  border-radius: 50%;
  mix-blend-mode: screen;
  background: radial-gradient(
    circle,
    rgba(255, 190, 90, 0.85) 0%,
    rgba(255, 150, 60, 0.35) 38%,
    rgba(255, 120, 40, 0) 70%
  );
}
.clock {
  position: absolute;
  z-index: 1;
}
.leaf,
.cloud,
.crane {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
}
.orb {
  position: absolute;
  transform: translate(-50%, -50%);
}
/* mặt trời xoay rất chậm, mặt trăng lắc nhẹ */
.sun {
  animation: sun-spin 90s linear infinite;
}
.moon {
  animation: moon-sway 8s ease-in-out infinite;
}
@keyframes sun-spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
@keyframes moon-sway {
  50% {
    transform: translate(-50%, -50%) rotate(-6deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sun,
  .moon {
    animation: none;
  }
}
</style>
