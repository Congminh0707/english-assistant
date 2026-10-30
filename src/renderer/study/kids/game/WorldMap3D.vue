<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeCharacterId } from '@shared/characters'
import {
  geoLayout,
  polylineSampler,
  smoothSegments,
  type MapLayout,
  type Point
} from '@shared/kidsWorldLayout'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import { VN_SIZE, isVnLand, projectVn } from '@shared/vnMap'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import { usePetStore } from '@renderer/shared/stores/pet'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { mountVnMap3D, type Map3DHandle } from './map3d'
import { playSfx } from './sfx'
import type { VehicleKind } from './map3dVehicles'

// Bản đồ 3D tầng Việt Nam (docs/19-kids-world.md §5.2): địa hình voxel + công trình voxel dựng bằng three.js, cùng dữ
// liệu và luồng với bản 2D (WorldMap.vue). Thú cưng là sprite đứng trên đất (đặt theo phép chiếu 3D, to nhỏ theo xa gần,
// có bóng dưới đất), đi ô tô/thuyền/máy bay dọc đường tới nơi vừa chạm rồi mới hiện thẻ "Bắt đầu". Không có WebGL / lỗi →
// báo `fail` để KidsGame quay về bản 2D.
const props = defineProps<{ world: KidsWorldView; tierId: string; scale: number }>()
const emit = defineEmits<{ start: [placeId: string]; fail: [] }>()

const { t } = useI18n()
const { speak } = useTts()
const petStore = usePetStore()
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Tốc độ đều của từng xe (đơn vị sân khấu/giây) — cùng bản 2D */
const SPEED: Record<VehicleKind, number> = { car: 95, boat: 70, plane: 260 }
const FLY_MIN = 900
const RAMP_MS = 900
const FLY_RAMP_MS = 2600
const TRIP_MAX_MS = 24000
/** Độ cao máy bay (số ô địa hình) và cỡ thú cưng trên bản đồ (số ô) */
const FLY_ALT = 3.2
const PET_CELLS = 0.62
/** Thú cưng ngồi xe thì thu nhỏ lại (xe to hơn thú cưng nhiều) */
const VEHICLE_SHRINK = 0.8
const PET_PX = 88
/** Bệ công trình cao hơn mặt đất một chút */
const REST_LIFT = 0.12

const host = ref<HTMLDivElement | null>(null)
const petEl = ref<HTMLDivElement | null>(null)
const ready = ref(false)
const card = ref<KidsWorldView['tiers'][number]['places'][number] | null>(null)
const petAt = ref<string | null>(props.world.currentPlaceId)
const vehicle = ref<VehicleKind | null>(null)
const facingLeft = ref(false)
const traveling = ref(false)
let handle: Map3DHandle | null = null
let gone = false
let layout: MapLayout | null = null
let screen = { x: -999, y: -999, k: 1 }

const places = computed(() =>
  [...(props.world.tiers.find((x) => x.id === props.tierId)?.places ?? [])].sort(
    (a, b) => a.order - b.order
  )
)
const byId = computed(() => new Map(places.value.map((p) => [p.id, p])))

// --- Thú cưng ---
const pet: { x: number; y: number; hop: number; rot: number; heading: number; pitch?: number } = {
  x: 0,
  y: 0,
  hop: 0,
  rot: 0,
  heading: 0
}
interface Trip {
  at: (u: number) => Point & { dx: number; i: number }
  dur: number
  ramp: number
  start: number
  to: string
  fly: boolean
  sea: boolean[]
}
let trip: Trip | null = null
let cheerAt = 0
let raf = 0
let cardTimer = 0

function restPos(id: string | null): Point {
  const first = layout?.points[0]?.id
  const key = id && handle ? id : first
  return key && handle ? handle.restOf(key) : { x: 0, y: 0 }
}

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

function applyPet(): void {
  handle?.setPet({
    x: pet.x,
    y: pet.y,
    hop: pet.hop + (vehicle.value ? 0 : REST_LIFT),
    kind: vehicle.value,
    heading: pet.heading,
    pitch: vehicle.value ? pet.pitch : undefined
  })
}

function placePetEl(): void {
  const el = petEl.value
  if (!el) return
  const k = (screen.k * PET_CELLS * (vehicle.value ? VEHICLE_SHRINK : 1)) / PET_PX
  el.style.transform = `translate(${screen.x}px, ${screen.y}px) rotate(${pet.rot}deg) scale(${k})`
}

function loop(now: number): void {
  raf = 0
  let keep = false
  if (trip) {
    keep = true
    const elapsed = now - trip.start
    const u = tripProgress(elapsed, trip.dur, trip.ramp)
    const p = trip.at(u)
    const kind: VehicleKind = trip.fly ? 'plane' : trip.sea[p.i] ? 'boat' : 'car'
    if (kind !== vehicle.value) {
      playSfx(kind === 'boat' ? 'splash' : 'car')
      vehicle.value = kind
    }
    if (Math.hypot(p.x - pet.x, p.y - pet.y) > 0.5) {
      const want = Math.atan2(p.y - pet.y, p.x - pet.x)
      const diff = Math.atan2(Math.sin(want - pet.heading), Math.cos(want - pet.heading))
      pet.heading += diff * 0.25
    }
    pet.x = p.x
    pet.y = p.y
    if (Math.abs(p.dx) > 0.5) facingLeft.value = p.dx < 0
    const sec = elapsed / 1000
    let tilt = 0
    if (kind === 'plane') {
      const e = Math.min(1, u / 0.18, (1 - u) / 0.18)
      const lift = e * e * (3 - 2 * e)
      pet.hop = FLY_ALT * lift + Math.sin(sec * 3) * 0.08 * lift
      // ngóc lên khi cất cánh, chúc xuống khi hạ cánh
      pet.pitch = u < 0.18 ? 0.28 * (1 - e) + 0.02 : u > 0.82 ? -0.24 * (1 - e) : 0
      tilt = Math.sin(sec * 2) * 1.5
    } else {
      // thuyền/xe tự chòng chành, nhún trong mô hình 3D — thú cưng ngồi yên trong đó
      pet.hop = 0
      pet.pitch = undefined
    }
    pet.rot = facingLeft.value ? -tilt : tilt
    handle?.follow(p.x, p.y, trip.fly ? 34 : 17)
    applyPet()
    if (elapsed >= trip.dur) arrive(trip.to, now)
  } else if (cheerAt) {
    keep = true
    const u = (now - cheerAt) / 520
    pet.hop = u < 1 ? Math.sin(u * Math.PI) * 3.2 : 0
    if (u >= 1) cheerAt = 0
    applyPet()
  }
  if (keep) raf = requestAnimationFrame(loop)
}
function startLoop(): void {
  if (!raf) raf = requestAnimationFrame(loop)
}

function go(id: string): void {
  if (traveling.value || !layout) return
  const place = byId.value.get(id)
  if (!place) return
  const now = performance.now()
  if (place.state === 'locked') {
    playSfx('step')
    speak('Not yet!', 'us', 0.9)
    return
  }
  playSfx('tap')
  speak(`${place.title}! ${place.topic}.`, 'us', 0.85)
  card.value = null
  const from = layout.points.findIndex((q) => q.id === petAt.value)
  const to = layout.points.findIndex((q) => q.id === id)
  if (to < 0) return
  if (from === to || from < 0 || reduced) {
    const r = restPos(id)
    pet.x = r.x
    pet.y = r.y
    arrive(id, now)
    return
  }
  const road = handle?.route(petAt.value ?? '', id) ?? [restPos(petAt.value), restPos(id)]
  const fly = polylineSampler(road).length > FLY_MIN
  const pts = fly ? [road[0], road[road.length - 1]] : road
  const sea = pts.map((q) => ('sea' in q && q.sea === true) || false)
  const sampler = polylineSampler(pts, (i) =>
    fly ? 1 / SPEED.plane : sea[i] ? 1 / SPEED.boat : 1 / SPEED.car
  )
  const ramp = fly ? FLY_RAMP_MS : RAMP_MS
  trip = {
    at: sampler.at,
    dur: Math.min(TRIP_MAX_MS, sampler.length * 1000 + ramp),
    ramp,
    start: now,
    to: id,
    fly,
    sea
  }
  vehicle.value = fly ? 'plane' : 'car'
  playSfx(fly ? 'plane' : 'car')
  traveling.value = true
  startLoop()
}

function arrive(id: string, now: number): void {
  trip = null
  traveling.value = false
  // nơi nằm trên mặt nước (chợ nổi, vịnh): thú cưng ngồi lại trên thuyền
  vehicle.value = handle?.restOf(id).sea ? 'boat' : null
  petAt.value = id
  pet.hop = 0
  pet.rot = 0
  const r = restPos(id)
  pet.x = r.x
  pet.y = r.y
  if (byId.value.get(id)?.state !== 'locked') {
    void invoke('kids:arrive', { placeId: id }).catch(() => undefined)
  }
  if (!reduced) cheerAt = now
  playSfx('whoosh')
  applyPet()
  handle?.focus(id)
  window.clearTimeout(cardTimer)
  cardTimer = window.setTimeout(
    () => {
      card.value = byId.value.get(id) ?? null
    },
    reduced ? 0 : 650
  )
  startLoop()
}

onMounted(async () => {
  try {
    if (!host.value) return
    layout = geoLayout(
      places.value.map((p) => ({
        id: p.id,
        ...projectVn(p.geo?.lon ?? 0, p.geo?.lat ?? 0),
        via: p.via?.map(([lon, lat]) => projectVn(lon, lat)),
        ferry: p.ferry
      })),
      VN_SIZE,
      (p) => isVnLand(p)
    )
    // 3D đặt các nơi đúng vị trí thật (không dời như bố cục 2D) và đường đi bám các điểm `via`, uốn mượt
    const ids = places.value.map((p) => p.id)
    layout = { ...layout, points: layout.anchors.map((a, i) => ({ id: ids[i], x: a.x, y: a.y })) }
    const lay = layout
    const routes = places.value.slice(1).map((p, i) => {
      const via = (p.via ?? []).map(([lon, lat]) => projectVn(lon, lat))
      const raw = [lay.points[i], ...via, lay.points[i + 1]]
      const out: Array<Point & { sea?: boolean }> = [{ x: raw[0].x, y: raw[0].y }]
      smoothSegments(raw).forEach((seg, k) => {
        const sea = !!p.ferry && k === raw.length - 2
        for (let t = 1; t <= 16; t++) {
          const u = t / 16
          const v = 1 - u
          out.push({
            x:
              v * v * v * seg.p0.x +
              3 * v * v * u * seg.c1.x +
              3 * v * u * u * seg.c2.x +
              u * u * u * seg.p1.x,
            y:
              v * v * v * seg.p0.y +
              3 * v * v * u * seg.c1.y +
              3 * v * u * u * seg.c2.y +
              u * u * u * seg.p1.y,
            sea
          })
        }
      })
      return out
    })
    const h = await mountVnMap3D(host.value, {
      width: 1600,
      height: 900,
      pixelRatio: Math.min(2, (window.devicePixelRatio || 1) * props.scale),
      reduceMotion: reduced,
      routes,
      places: places.value.flatMap((p) => {
        const pt = lay.points.find((q) => q.id === p.id)
        return pt
          ? [
              {
                id: p.id,
                title: p.title,
                vi: p.vi,
                landmark: p.landmark,
                x: pt.x,
                y: pt.y,
                done: p.state === 'done'
              }
            ]
          : []
      }),
      onSelect: (id) => {
        if (id) go(id)
        else if (card.value) closeCard()
      },
      onPet: (s) => {
        screen = s
        placePetEl()
      }
    })
    if (gone) {
      h.dispose()
      return
    }
    handle = h
    if (!lay.points.some((q) => q.id === petAt.value)) petAt.value = lay.points[0]?.id ?? null
    const r = restPos(petAt.value)
    pet.x = r.x
    pet.y = r.y
    if (h.restOf(petAt.value ?? '').sea) vehicle.value = 'boat'
    applyPet()
    h.follow(r.x, r.y, 20)
    ready.value = true
  } catch {
    emit('fail')
  }
})

onBeforeUnmount(() => {
  gone = true
  cancelAnimationFrame(raf)
  window.clearTimeout(cardTimer)
  handle?.dispose()
})

function closeCard(): void {
  card.value = null
  // zoom ra nhưng vẫn giữ thú cưng làm tâm (không bay về giữa bản đồ)
  const r = restPos(petAt.value)
  handle?.follow(r.x, r.y, 62)
}

function play(): void {
  if (!card.value) return
  playSfx('tap')
  emit('start', card.value.id)
}
</script>

<template>
  <div class="map3d">
    <div ref="host" class="gl" />

    <div v-if="ready && petStore.pet" ref="petEl" class="pet">
      <div class="rider" :class="{ riding: !!vehicle }">
        <PetSprite
          :character="normalizeCharacterId(petStore.pet.characterId)"
          :stage="petStore.pet.stage"
          :accessories="petStore.pet.equipped"
          :size="PET_PX"
          animate
          :flip="facingLeft"
        />
      </div>
    </div>

    <p v-if="ready && !card && !traveling" class="help">{{ t('kids.game.help3d') }}</p>
    <div v-if="card" class="card" @pointerdown.stop>
      <button type="button" class="close" :aria-label="t('kids.game.close')" @click="closeCard">
        <UiIcon name="close" :size="26" />
      </button>
      <div class="text">
        <h2>{{ card.title }}</h2>
        <p>{{ card.vi }} · {{ card.topicVi }} · {{ card.landmarkVi }}</p>
      </div>
      <button type="button" class="go" :aria-label="t('kids.game.play')" @click="play">
        <UiIcon name="play" :size="48" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.map3d {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(#79cdf2, #46a5db);
  user-select: none;
}
.gl {
  position: absolute;
  inset: 0;
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
/* Ngồi trong xe/thuyền/máy bay: hạ thấp và che nửa dưới để thú cưng lọt vào khoang */
.rider.riding {
  transform: translateY(30px);
  clip-path: inset(0 0 34% 0);
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
.help {
  position: absolute;
  top: 160px;
  left: 28px;
  max-width: 300px;
  margin: 0;
  padding: 10px 18px;
  border: 4px solid #3b2a3a;
  border-radius: 24px;
  background: #fff8e2;
  color: #3b2a3a;
  font-size: 20px;
  font-weight: 700;
  pointer-events: none;
}
.card {
  position: absolute;
  bottom: 28px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 18px 28px 22px 34px;
  border: 5px solid #3b2a3a;
  border-radius: 36px;
  background: #fff8e2;
  box-shadow: 0 8px 0 0 #c9a46a;
  color: #3b2a3a;
  transform: translateX(-50%);
}
.text h2 {
  margin: 0;
  font-size: 44px;
  line-height: 1.1;
}
.text p {
  margin: 4px 0 0;
  font-size: 22px;
  color: #6b5566;
}
.go {
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  flex: none;
  border: 5px solid #3b2a3a;
  border-radius: 50%;
  background: #5cc85a;
  color: #fff;
  fill: #fff;
  cursor: pointer;
  box-shadow: 0 8px 0 0 #2f8a35;
}
.go:active {
  transform: translateY(6px);
  box-shadow: 0 2px 0 0 #2f8a35;
}
.close {
  position: absolute;
  top: -18px;
  right: -14px;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 4px solid #3b2a3a;
  border-radius: 50%;
  background: #fff;
  color: #3b2a3a;
  cursor: pointer;
}
</style>
