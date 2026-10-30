<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeCharacterId } from '@shared/characters'
import {
  clampCameraX,
  clampCameraY,
  geoLayout,
  levelPathLayout,
  PLACE_BOX,
  petRestOffset,
  polylineSampler,
  STAGE_H,
  STAGE_W,
  walkPoints,
  type MapLayout,
  type Point
} from '@shared/kidsWorldLayout'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import { isVnLand, projectVn, VN_SIZE } from '@shared/vnMap'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import { usePetStore } from '@renderer/shared/stores/pet'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import Landmark3D from './Landmark3D.vue'
import { buildScene, drawFrame, type Particle, type ScenePlace } from './scene'
import { playSfx } from './sfx'
import TripVehicle, { type VehicleKind } from './TripVehicle.vue'

// Bản đồ trên sân khấu toàn màn hình (docs/19-kids-world.md §5.4): tầng Việt Nam vẽ hình chữ S, các nơi đặt theo
// toạ độ thật (dời ra vừa đủ để không đè, có chấm vị trí thật). Canvas vẽ cảnh, lớp nút Vue phủ đúng toạ độ (chạm nơi,
// biển tên, sao/hoa). Mặc định xem toàn cảnh; thú cưng đi đều tốc độ theo đường, tới nơi thì camera phóng to và hiện
// thẻ "Bắt đầu". Kéo để trượt, lăn chuột để cuộn. Vẽ ~30 khung/giây khi đứng yên, 60 khi có chuyển động; dừng khi ẩn.
const props = defineProps<{ world: KidsWorldView; tierId: string; scale: number }>()
const emit = defineEmits<{ start: [placeId: string] }>()

const { t } = useI18n()
const { speak } = useTts()
const petStore = usePetStore()
const reduced =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Toàn cảnh khi xem/đi và cận cảnh khi tới nơi để học */
const MAP_ZOOM = 0.62
const FOCUS_ZOOM = 1.25
/** Bay khi xa — camera lùi thêm để thấy đường bay */
const FLY_ZOOM = 0.5
/** Tốc độ đều của từng xe (đơn vị sân khấu/giây) */
const SPEED: Record<VehicleKind, number> = { car: 420, boat: 250, plane: 950 }
/** Đường bộ dài hơn mức này thì đi máy bay (~4 độ vĩ, vd Hà Nội → Huế) */
const FLY_MIN = 1100
/** Thời gian tăng/giảm tốc ở hai đầu, trần thời gian một chuyến */
const RAMP_MS = 420
const FLY_RAMP_MS = 900
const TRIP_MAX_MS = 9000
const FLY_ALT = 170
/** Nhấc thú cưng lên ghế (chân khuất sau thân xe) và nửa bề ngang bóng dưới xe */
const SEAT: Record<VehicleKind, number> = { car: 30, boat: 14, plane: 44 }
const SHADOW: Record<VehicleKind, number> = { car: 82, boat: 0, plane: 100 }
/** Khói xe / bọt nước / vệt mây, mỗi bao nhiêu ms một lần */
const PUFF_MS = 150

const tier = computed(() => props.world.tiers.find((x) => x.id === props.tierId) ?? null)
const places = computed(() => [...(tier.value?.places ?? [])].sort((a, b) => a.order - b.order))
const byId = computed(() => new Map<string, ScenePlace>(places.value.map((p) => [p.id, p])))
const geo = computed(
  () => tier.value?.scene === 'vn' && places.value.length > 0 && places.value.every((p) => p.geo)
)
const layout = computed<MapLayout>(() =>
  geo.value
    ? geoLayout(
        places.value.map((p) => ({
          id: p.id,
          ...projectVn(p.geo?.lon ?? 0, p.geo?.lat ?? 0),
          via: p.via?.map(([lon, lat]) => projectVn(lon, lat)),
          ferry: p.ferry
        })),
        VN_SIZE,
        (p) => isVnLand(p)
      )
    : levelPathLayout(places.value.map((p) => p.id))
)
const scene = computed(() => buildScene(layout.value, geo.value))
const pointOf = (id: string | null): (Point & { id: string }) | undefined =>
  layout.value.points.find((p) => p.id === id)
const labels = computed(() => ({
  sea: t('kids.game.eastSea'),
  paracel: t('kids.game.paracel'),
  spratly: t('kids.game.spratly')
}))

const canvas = ref<HTMLCanvasElement | null>(null)
const worldEl = ref<HTMLDivElement | null>(null)
const petEl = ref<HTMLDivElement | null>(null)

const cam = { x: STAGE_W / 2, y: STAGE_H / 2, zoom: MAP_ZOOM }
const target = { ...cam }
let follow = false

const petAt = ref<string | null>(props.world.currentPlaceId)
const pet = { x: 0, y: 0, hop: 0, shadow: 30 }
let petRot = 0
const facingLeft = ref(false)
interface Trip {
  at: (u: number) => Point & { dx: number; i: number }
  dur: number
  ramp: number
  start: number
  to: string
  fly: boolean
  /** Theo chỉ số điểm: đoạn dẫn tới điểm đó thuộc chặng biển */
  sea: boolean[]
}
let trip: Trip | null = null
/** Cú nhảy mừng khi tới nơi (thời điểm bắt đầu, ms) */
let cheerAt = 0
let cardTimer = 0
const traveling = ref(false)
const vehicle = ref<VehicleKind | null>(null)
const card = ref<ScenePlace | null>(null)
const particles: Particle[] = []

const t0 = performance.now()
const clock = (now: number): number => (now - t0) / 1000

function setTarget(x: number, y: number, zoom: number): void {
  target.zoom = zoom
  target.x = clampCameraX(x, layout.value, zoom)
  target.y = clampCameraY(y, layout.value, zoom)
}

/** Quãng đường đã đi (0–1) theo thời gian: tăng tốc → đi đều → giảm tốc (vận tốc hình thang) */
function tripProgress(elapsed: number, dur: number, ramp: number): number {
  if (elapsed <= 0) return 0
  if (elapsed >= dur) return 1
  const r = Math.min(ramp, dur / 3)
  const v = 1 / (dur - r)
  if (elapsed < r) return (v * elapsed * elapsed) / (2 * r)
  if (elapsed > dur - r) {
    const left = dur - elapsed
    return 1 - (v * left * left) / (2 * r)
  }
  return v * (elapsed - r / 2)
}

function burst(x: number, y: number, now: number): void {
  const colors = ['#ffd34d', '#ff7eb6', '#5cc85a', '#4aa8d8']
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const sp = 150 + (i % 3) * 60
    particles.push({
      kind: 'spark',
      x,
      y: y - 70,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 170,
      born: clock(now),
      life: 1.2,
      size: 9 + (i % 3) * 3,
      color: colors[i % colors.length]
    })
  }
}

/** Khói ống xả (ô tô), bọt nước (thuyền), vệt mây (máy bay) phía sau xe */
function puff(kind: VehicleKind, now: number): void {
  const back = facingLeft.value ? 1 : -1
  const spec = {
    car: { dx: 92, dy: -20, size: 9, life: 0.6, color: 'rgb(200 200 200 / 75%)' },
    boat: { dx: 96, dy: -4, size: 10, life: 0.9, color: 'rgb(255 255 255 / 85%)' },
    plane: { dx: 118, dy: -40, size: 13, life: 1.1, color: 'rgb(255 255 255 / 80%)' }
  }[kind]
  particles.push({
    kind: 'dust',
    x: pet.x + back * spec.dx,
    y: pet.y - pet.hop + spec.dy,
    vx: back * 40,
    vy: kind === 'car' ? -24 : -6,
    born: clock(now),
    life: spec.life,
    size: spec.size,
    color: spec.color
  })
}

function ring(x: number, y: number, now: number): void {
  particles.push({
    kind: 'ring',
    x,
    y: y + 10,
    vx: 0,
    vy: 0,
    born: clock(now),
    life: 0.6,
    size: 150,
    color: '#ffffff'
  })
}

function restPos(id: string | null): Point {
  const p = pointOf(id) ?? layout.value.points[0]
  if (!p) return { x: STAGE_W / 2, y: STAGE_H / 2 }
  const o = petRestOffset()
  return { x: p.x + o.x, y: p.y + o.y }
}

// --- Vòng vẽ ---
let raf = 0
let lastDraw = 0
let lastNow = 0
let dirty = true
let lastPuff = 0

function applyDom(): void {
  const z = cam.zoom
  const tx = STAGE_W / 2 - cam.x * z
  const ty = STAGE_H / 2 - cam.y * z
  if (worldEl.value) worldEl.value.style.transform = `matrix(${z},0,0,${z},${tx},${ty})`
  if (petEl.value) {
    petEl.value.style.transform = `translate(${pet.x}px, ${pet.y - pet.hop}px) rotate(${petRot}deg)`
  }
}

function draw(now: number): void {
  const el = canvas.value
  const ctx = el?.getContext('2d')
  if (!el || !ctx) return
  const k = props.scale * (window.devicePixelRatio || 1)
  const w = Math.round(STAGE_W * k)
  const h = Math.round(STAGE_H * k)
  if (el.width !== w || el.height !== h) {
    el.width = w
    el.height = h
  }
  drawFrame(
    ctx,
    scene.value,
    {
      camX: cam.x,
      camY: cam.y,
      zoom: cam.zoom,
      t: reduced ? 0 : clock(now),
      clock: clock(now),
      places: byId.value,
      todayId: props.world.todayPlaceId,
      particles,
      pet: petStore.pet ? pet : null,
      labels: labels.value
    },
    k
  )
  applyDom()
}

function frame(now: number): void {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.05, (now - (lastNow || now)) / 1000)
  lastNow = now
  let moving = false

  if (trip) {
    moving = true
    const elapsed = now - trip.start
    const u = tripProgress(elapsed, trip.dur, trip.ramp)
    const p = trip.at(u)
    const kind: VehicleKind = trip.fly ? 'plane' : trip.sea[p.i] && !isVnLand(p) ? 'boat' : 'car'
    if (kind !== vehicle.value) {
      playSfx(kind === 'boat' ? 'splash' : 'car')
      ring(p.x, p.y - 20, now)
      vehicle.value = kind
    }
    pet.x = p.x
    pet.y = p.y
    pet.shadow = SHADOW[kind]
    if (Math.abs(p.dx) > 0.5) facingLeft.value = p.dx < 0
    const sec = elapsed / 1000
    let tilt = 0
    if (kind === 'plane') {
      const e = Math.min(1, u / 0.18, (1 - u) / 0.18)
      const lift = e * e * (3 - 2 * e)
      pet.hop = FLY_ALT * lift + Math.sin(sec * 3) * 5 * lift
      tilt = u < 0.18 ? -9 : u > 0.82 ? 7 : Math.sin(sec * 2) * 2
    } else if (kind === 'boat') {
      pet.hop = 2 + Math.sin(sec * 3) * 3
      tilt = Math.sin(sec * 2.2) * 4
    } else {
      pet.hop = Math.abs(Math.sin(sec * 14)) * 2
    }
    petRot = facingLeft.value ? -tilt : tilt
    if (follow) setTarget(p.x, p.y - pet.hop, trip.fly ? FLY_ZOOM : MAP_ZOOM)
    if (now - lastPuff > PUFF_MS) {
      lastPuff = now
      puff(kind, now)
    }
    if (elapsed >= trip.dur) arrive(trip.to, now)
  } else if (cheerAt) {
    moving = true
    const u = (now - cheerAt) / 520
    pet.hop = u < 1 ? Math.sin(u * Math.PI) * 34 : 0
    if (u >= 1) cheerAt = 0
  }

  const ease = reduced ? 1 : 1 - Math.exp(-dt * 5)
  for (const key of ['x', 'y', 'zoom'] as const) {
    const d = target[key] - cam[key]
    if (Math.abs(d) > (key === 'zoom' ? 0.001 : 0.3)) {
      cam[key] += d * ease
      moving = true
    } else cam[key] = target[key]
  }

  const c = clock(now)
  while (particles.length && c - particles[0].born > particles[0].life) particles.shift()
  if (particles.length) moving = true

  if (moving || dragging) dirty = true
  if (dirty || (!reduced && now - lastDraw > 33)) {
    draw(now)
    lastDraw = now
    dirty = false
  }
}

function startLoop(): void {
  if (!raf && document.visibilityState === 'visible') {
    lastNow = 0
    raf = requestAnimationFrame(frame)
  }
}
function stopLoop(): void {
  cancelAnimationFrame(raf)
  raf = 0
}
function onVisibility(): void {
  if (document.visibilityState === 'visible') startLoop()
  else stopLoop()
}

// --- Thú cưng đi tới một nơi ---
function go(place: ScenePlace): void {
  if (suppressClick || traveling.value) return
  const now = performance.now()
  const p = pointOf(place.id)
  if (p) ring(p.x, p.y, now)
  if (place.state === 'locked') {
    playSfx('step')
    speak('Not yet!', 'us', 0.9)
    return
  }
  playSfx('tap')
  speak(`${place.title}! ${place.topic}.`, 'us', 0.85)
  const from = layout.value.points.findIndex((q) => q.id === petAt.value)
  const to = layout.value.points.findIndex((q) => q.id === place.id)
  if (to < 0) return
  if (from === to || from < 0 || reduced) {
    const r = restPos(place.id)
    pet.x = r.x
    pet.y = r.y
    arrive(place.id, now)
    return
  }
  const road = [restPos(petAt.value), ...walkPoints(layout.value, from, to), restPos(place.id)]
  const fly = polylineSampler(road).length > FLY_MIN
  const pts = fly ? [road[0], road[road.length - 1]] : road
  const sea = pts.map((q) => 'sea' in q && q.sea === true)
  const sampler = polylineSampler(pts, (i) =>
    fly ? 1 / SPEED.plane : sea[i] && !isVnLand(pts[i]) ? 1 / SPEED.boat : 1 / SPEED.car
  )
  const ramp = fly ? FLY_RAMP_MS : RAMP_MS
  trip = {
    at: sampler.at,
    dur: Math.min(TRIP_MAX_MS, sampler.length * 1000 + ramp),
    ramp,
    start: now,
    to: place.id,
    fly,
    sea
  }
  vehicle.value = fly ? 'plane' : 'car'
  playSfx(fly ? 'plane' : 'car')
  lastPuff = now
  traveling.value = true
  follow = true
  setTarget(pet.x, pet.y, fly ? FLY_ZOOM : MAP_ZOOM)
}

function arrive(id: string, now: number): void {
  trip = null
  traveling.value = false
  vehicle.value = null
  follow = false
  petAt.value = id
  if (byId.value.get(id)?.state !== 'locked') void invoke('kids:arrive', { placeId: id }).catch(() => undefined)
  pet.hop = 0
  pet.shadow = 30
  petRot = 0
  const p = pointOf(id)
  if (!p) return
  if (!reduced) {
    cheerAt = now
    burst(p.x, p.y, now)
  }
  playSfx('whoosh')
  setTarget(p.x, p.y - 30, FOCUS_ZOOM)
  window.clearTimeout(cardTimer)
  cardTimer = window.setTimeout(() => (card.value = byId.value.get(id) ?? null), reduced ? 0 : 650)
  dirty = true
}

function closeCard(): void {
  card.value = null
  setTarget(target.x, target.y, MAP_ZOOM)
}

function play(): void {
  const c = card.value
  if (!c) return
  playSfx('tap')
  emit('start', c.id)
}

/** Hình xem trước: từ chưa xong trước, tối đa 4 */
const preview = computed(() => {
  const words = card.value?.words ?? []
  return [...words.filter((w) => !w.done), ...words.filter((w) => w.done)].slice(0, 4)
})
const doneCount = (p: ScenePlace): number => p.words.filter((w) => w.done).length

/** Buổi trong ngày theo giờ máy: lớp phủ chiều/tối */
const hour = new Date().getHours()
const timeOfDay = hour >= 18 || hour < 6 ? 'night' : hour >= 16 ? 'evening' : 'day'

// --- Kéo để trượt, lăn để cuộn ---
let dragging = false
let suppressClick = false
let down: { x: number; y: number; camX: number; camY: number } | null = null

function onPointerDown(e: PointerEvent): void {
  if (card.value) return
  down = { x: e.clientX, y: e.clientY, camX: target.x, camY: target.y }
  suppressClick = false
}
function onPointerMove(e: PointerEvent): void {
  if (!down) return
  const dx = (e.clientX - down.x) / props.scale / cam.zoom
  const dy = (e.clientY - down.y) / props.scale / cam.zoom
  if (!dragging && Math.hypot(dx, dy) > 8) {
    dragging = true
    follow = false
  }
  if (dragging) {
    setTarget(down.camX - dx, down.camY - dy, target.zoom)
    cam.x = target.x
    cam.y = target.y
  }
}
function onPointerUp(): void {
  if (dragging) {
    suppressClick = true
    window.setTimeout(() => (suppressClick = false), 0)
  }
  dragging = false
  down = null
}
function onWheel(e: WheelEvent): void {
  if (card.value) return
  follow = false
  setTarget(target.x + e.deltaX, target.y + e.deltaY * 1.2, target.zoom)
}

function centerOnPet(): void {
  const r = restPos(petAt.value)
  pet.x = r.x
  pet.y = r.y
  setTarget(r.x, r.y, MAP_ZOOM)
  cam.x = target.x
  cam.y = target.y
  cam.zoom = target.zoom
  dirty = true
}

watch(
  () => props.world,
  () => (dirty = true)
)
watch(
  () => props.tierId,
  () => {
    petAt.value = pointOf(props.world.currentPlaceId)
      ? props.world.currentPlaceId
      : (layout.value.points[0]?.id ?? null)
    centerOnPet()
  }
)
watch(
  () => props.scale,
  () => (dirty = true)
)

onMounted(() => {
  if (!petAt.value || !pointOf(petAt.value)) petAt.value = layout.value.points[0]?.id ?? null
  centerOnPet()
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pointerup', onPointerUp)
  startLoop()
})
onUnmounted(() => {
  stopLoop()
  window.clearTimeout(cardTimer)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<template>
  <div
    class="map"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @wheel.passive="onWheel"
  >
    <canvas ref="canvas" class="scene" aria-hidden="true" />
    <div class="tint" :class="timeOfDay" aria-hidden="true" />

    <div
      ref="worldEl"
      class="world"
      :style="{ width: `${layout.width}px`, height: `${layout.height}px` }"
    >
      <button
        v-for="p in places"
        :key="p.id"
        type="button"
        class="place"
        :class="[p.state, { today: p.id === world.todayPlaceId }]"
        :style="{
          left: `${(pointOf(p.id)?.x ?? 0) - PLACE_BOX.left}px`,
          top: `${(pointOf(p.id)?.y ?? 0) - PLACE_BOX.top}px`,
          width: `${PLACE_BOX.left + PLACE_BOX.right}px`,
          height: `${PLACE_BOX.top + PLACE_BOX.bottom}px`
        }"
        :aria-label="`${p.title} — ${p.vi}`"
        @click="go(p)"
      >
        <span v-if="p.state === 'locked'" class="lock"><UiIcon name="lock" :size="34" /></span>
        <span class="sign">
          <strong class="name">{{ p.title }}</strong>
          <span class="meta">
            <span class="stars">
              <UiIcon
                v-for="n in 3"
                :key="n"
                name="star"
                :size="16"
                :class="{ lit: n <= p.stars }"
              />
            </span>
            <span class="flowers">
              <UiIcon name="flower" :size="16" />{{ doneCount(p) }}/{{ p.words.length }}
            </span>
          </span>
        </span>
      </button>

      <div v-if="petStore.pet" ref="petEl" class="pet">
        <div v-if="vehicle" class="veh-layer" :class="{ flip: facingLeft }">
          <TripVehicle :kind="vehicle" layer="back" />
        </div>
        <div
          class="rider"
          :style="vehicle ? { transform: `translateY(-${SEAT[vehicle]}px)` } : undefined"
        >
          <PetSprite
            :character="normalizeCharacterId(petStore.pet.characterId)"
            :stage="petStore.pet.stage"
            :accessories="petStore.pet.equipped"
            :size="88"
            animate
            :flip="facingLeft"
          />
        </div>
        <div v-if="vehicle" class="veh-layer" :class="{ flip: facingLeft }">
          <TripVehicle :kind="vehicle" layer="front" />
        </div>
      </div>
    </div>

    <!-- Thẻ "Bắt đầu" khi thú cưng tới nơi -->
    <div v-if="card" class="card-wrap" @pointerdown.stop>
      <div class="card">
        <button type="button" class="close" :aria-label="t('kids.game.close')" @click="closeCard">
          <UiIcon name="close" :size="30" />
        </button>
        <h2 class="title">{{ card.title }}</h2>
        <p class="topic">{{ card.topic }}</p>
        <p class="vi-line">{{ card.vi }} · {{ card.topicVi }} · {{ card.landmarkVi }}</p>
        <Landmark3D :id="card.landmark" :width="560" :height="230" />
        <div class="preview">
          <button
            v-for="w in preview"
            :key="w.pictureId"
            type="button"
            class="peek"
            :class="{ done: w.done }"
            @click="speak(w.word, 'us', 0.8)"
          >
            <PixelPicture :id="w.pictureId" :size="120" />
          </button>
        </div>
        <button type="button" class="go" :aria-label="t('kids.game.play')" @click="play">
          <UiIcon name="play" :size="54" />
        </button>
        <p v-if="world.newLeftToday === 0 && card.state !== 'done'" class="note">
          {{ t('kids.world.tomorrow') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}
.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.tint {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.tint.evening {
  background: rgb(255 150 60 / 14%);
}
.tint.night {
  background: rgb(20 30 80 / 34%);
}
.world {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}
.place {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
  border: 0;
  border-radius: 40px;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.place:focus-visible {
  outline: 4px solid #ffd34d;
  outline-offset: -8px;
}
.place.locked {
  cursor: not-allowed;
}
.lock {
  position: absolute;
  top: 110px;
  left: 50%;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-left: -32px;
  border: 4px solid #3b2a3a;
  border-radius: 50%;
  background: #fff;
  color: #3b2a3a;
}
.sign {
  display: grid;
  justify-items: center;
  gap: 1px;
  max-width: 230px;
  padding: 4px 14px 6px;
  border: 4px solid #3b2a3a;
  border-radius: 16px;
  background: #fff8e2;
  box-shadow: 0 5px 0 0 #c9a46a;
  color: #3b2a3a;
}
.place.today .sign {
  background: #fff1a8;
  animation: k-bounce 1.4s ease infinite;
}
.place.locked .sign {
  opacity: 0.7;
}
.name {
  font-size: 26px;
  font-weight: 900;
  line-height: 1.1;
  white-space: nowrap;
}
.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
}
.stars {
  display: flex;
  color: #c8b89a;
}
.stars .lit {
  color: #e0a620;
  fill: #ffd34d;
}
.flowers {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #e0508f;
}
.pet {
  position: absolute;
  top: 0;
  left: 0;
  margin: -86px 0 0 -44px;
  pointer-events: none;
  transform-origin: 44px 86px;
  will-change: transform;
}
.rider {
  position: relative;
}
/* Gốc lớp xe = điểm chạm đất của thú cưng (giữa chân) */
.veh-layer {
  position: absolute;
  top: 86px;
  left: 44px;
  width: 0;
  height: 0;
}
.veh-layer.flip {
  transform: scaleX(-1);
}
.card-wrap {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(20 40 70 / 28%);
}
.card {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 10px;
  width: 760px;
  padding: 30px 40px 34px;
  border: 5px solid #3b2a3a;
  border-radius: 36px;
  background: #fff8e2;
  box-shadow: 0 10px 0 0 #c9a46a;
  color: #3b2a3a;
  animation: k-pop 360ms ease;
}
.title {
  margin: 0;
  font-size: 54px;
  font-weight: 900;
}
.topic {
  margin: -6px 0 0;
  font-size: 28px;
  font-weight: 800;
  color: #e0508f;
}
.vi-line {
  margin: 0;
  font-size: 17px;
  color: #7a5a45;
}
.preview {
  display: flex;
  gap: 16px;
  margin: 8px 0;
}
.peek {
  padding: 8px;
  border: 4px solid #3b2a3a;
  border-radius: 24px;
  background: #fff;
  cursor: pointer;
}
.peek.done {
  background: #e8f8dc;
}
.go {
  display: grid;
  place-items: center;
  width: 128px;
  height: 128px;
  border: 5px solid #3b2a3a;
  border-radius: 50%;
  background: #5cc85a;
  color: #fff;
  fill: #fff;
  cursor: pointer;
  box-shadow: 0 8px 0 0 #2f8a35;
  animation: k-bounce 1.6s ease infinite;
}
.go:active {
  transform: translateY(6px);
  box-shadow: 0 2px 0 0 #2f8a35;
}
.close {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border: 4px solid #3b2a3a;
  border-radius: 50%;
  background: #fff;
  color: #3b2a3a;
  cursor: pointer;
}
.note {
  margin: 0;
  font-size: 16px;
  color: #7a5a45;
}
@media (prefers-reduced-motion: reduce) {
  .place.today .sign,
  .go,
  .card {
    animation: none;
  }
}
</style>
