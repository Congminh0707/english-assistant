<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ActorScheduler,
  cloudAlpha,
  spawnCloud,
  spawnFlock,
  spawnLeaf,
  stepCrane,
  stepLeaf,
  type Cloud,
  type Crane,
  type Leaf,
  type SceneAnimSpec
} from './sceneAnim'
import type { Weather } from './sceneWeather'

// Lớp vật động của cảnh vẽ bằng ChatGPT Image (docs/26-scene-art-prompts.md): sprite 6 khung đứng yên ở khung 0,
// thỉnh thoảng làm động tác một lượt (ActorScheduler), lá rơi liên tục; bầu trời theo thời tiết: mây trôi, hạc bay
// (trời quang/nắng), mặt trời, mây mưa, mặt trăng (đêm). Ảnh là file WebP Vite đóng gói ('self', hợp CSP).
// Không bắt chuột; giảm chuyển động → đứng yên (khung 0, mây không trôi, không lá, không hạc); dừng khi cửa sổ ẩn.
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
const CRANE = ['crane-0', 'crane-1', 'crane-2', 'crane-3', 'crane-4', 'crane-5']
const CLOUD = ['cloud-0', 'cloud-1', 'cloud-2', 'raincloud']
const CLOUDS: Record<Weather, number> = { clear: 3, sun: 2, rain: 4, night: 2 }
const SUN_SIZE = 150
const MOON_SIZE = 110
// Nền phủ khung kiểu `xMidYMid slice`: cùng một tỉ lệ cho x, y, căn giữa, cắt mép thừa
const k = computed(() => {
  const [w, h] = spec.value?.size ?? [1, 1]
  return Math.max(props.width / w, props.height / h)
})
const ox = computed(() => (props.width - (spec.value?.size[0] ?? 0) * k.value) / 2)
const oy = computed(() => (props.height - (spec.value?.size[1] ?? 0) * k.value) / 2)

/** Vùng lá rơi: dưới tán cây góc trái, xuống tới nền đá */
const LEAF_AREA = { xMin: 40, xMax: 820, ground: 930 }
const LEAF_COUNT = 7

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const frames = ref<number[]>([])
const leafView = ref<Array<{ x: number; y: number; size: number; frame: number }>>([])
const cloudView = ref<Array<{ x: number; y: number; w: number; kind: number; alpha: number }>>([])
const craneView = ref<Array<{ x: number; y: number; size: number; frame: number }>>([])
let scheduler: ActorScheduler | null = null
let leaves: Leaf[] = []
let clouds: Cloud[] = []
let cranes: Crane[] = []
/** Thời điểm (ms) đàn hạc tiếp theo bay qua */
let nextFlock = 0
let raf = 0
let prev = 0

/** Đàn hạc cách nhau 12–30 s, chỉ khi trời quang hoặc nắng */
const flockGap = (): number => 12000 + Math.random() * 18000
const sunny = computed(() => props.weather === 'clear' || props.weather === 'sun')

function setup(): void {
  cancelAnimationFrame(raf)
  const s = spec.value
  frames.value = s ? s.actors.map(() => 0) : []
  leafView.value = []
  craneView.value = []
  cranes = []
  const sky = s?.sky
  clouds = sky
    ? Array.from({ length: CLOUDS[props.weather] }, () =>
        spawnCloud(sky, props.weather === 'rain', Math.random, true)
      )
    : []
  drawClouds()
  if (!s || reduced) return
  CRANE.forEach((f) => (new Image().src = skyUrl(f)))
  nextFlock = performance.now() + 3000 + Math.random() * 6000
  // nạp trước mọi khung để đổi khung không nháy
  s.actors.forEach((a) => a.frames.forEach((f) => (new Image().src = url(f))))
  s.leaf.forEach((f) => (new Image().src = url(f)))
  scheduler = new ActorScheduler(s.actors, performance.now())
  leaves = s.leaf.length
    ? Array.from({ length: LEAF_COUNT }, () => spawnLeaf(LEAF_AREA, Math.random, true))
    : []
  prev = performance.now()
  raf = requestAnimationFrame(loop)
}

function loop(now: number): void {
  // cửa sổ ẩn lâu rồi hiện lại: không cho lá nhảy cóc
  const dt = Math.min(0.1, (now - prev) / 1000)
  prev = now
  if (scheduler) {
    const f = scheduler.tick(now)
    if (f.some((v, i) => v !== frames.value[i])) frames.value = f
  }
  const n = spec.value?.leaf.length ?? 0
  leafView.value = leaves.map((l, i) => {
    if (l.y > LEAF_AREA.ground) leaves[i] = l = spawnLeaf(LEAF_AREA)
    const p = stepLeaf(l, dt, n)
    return { x: p.x, y: p.y, size: l.size, frame: p.frame }
  })
  stepSky(now, dt)
  raf = requestAnimationFrame(loop)
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
  if (sunny.value && !cranes.length && now >= nextFlock) cranes = spawnFlock(s.size[0])
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
    <img
      v-for="(a, i) in spec.actors"
      :key="a.name"
      class="actor"
      :src="url(a.frames[frames[i] ?? 0])"
      alt=""
      draggable="false"
      :style="{
        left: `${ox + (a.x - a.w / 2) * k}px`,
        top: `${oy + (a.y - a.h) * k}px`,
        width: `${a.w * k}px`,
        height: `${a.h * k}px`
      }"
    />
    <img
      v-for="(l, i) in leafView"
      :key="`leaf${i}`"
      class="leaf"
      :src="url(spec.leaf[l.frame])"
      alt=""
      draggable="false"
      :style="{
        width: `${l.size * k}px`,
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
}
.actor {
  position: absolute;
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
