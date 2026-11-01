<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeCharacterId } from '@shared/characters'
import { EARTH_WONDERS, type ContinentId } from '@shared/earthWonders'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import { vectorPictureUrl } from '@renderer/shared/art'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import { usePetStore } from '@renderer/shared/stores/pet'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import { mountGlobe, type GlobeHandle } from './globe3d'
import HexLabel from './HexLabel.vue'
import { savedQuality } from './mapQuality'
import PlaceCard from './PlaceCard.vue'
import { playSfx } from './sfx'

// Tầng 3 Trái Đất (docs/23-design-v2-spec.md §3): quả cầu three.js + lớp nhãn HTML. Chỉ hiện nhãn nơi gần tâm mặt cầu, để bé
// không rối mắt. Không có WebGL thì báo `fail`, KidsGame dùng bản đồ dự phòng.
type Place = KidsWorldView['tiers'][number]['places'][number]
const props = defineProps<{
  world: KidsWorldView
  tierId: string
  width: number
  height: number
  scale: number
}>()
const emit = defineEmits<{ start: [placeId: string]; fail: [] }>()

const { t, locale } = useI18n()
const { speak } = useTts()
const petStore = usePetStore()
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Ngưỡng hiện nhãn theo độ gần tâm (1 = giữa mặt cầu) */
const NEAR_LABEL = 0.6
const NEAR_CONTINENT = 0.5
/** Hai nhãn gần hơn khoảng này thì coi như đè nhau */
const LABEL_W = 230
const LABEL_H = 52
const CONTINENT_POINTS: ReadonlyArray<{ id: ContinentId; lat: number; lon: number }> = [
  { id: 'asia', lat: 48, lon: 92 },
  { id: 'europe', lat: 54, lon: 22 },
  { id: 'africa', lat: 4, lon: 21 },
  { id: 'northAmerica', lat: 48, lon: -102 },
  { id: 'southAmerica', lat: -8, lon: -60 },
  { id: 'oceania', lat: -26, lon: 134 },
  { id: 'antarctica', lat: -80, lon: 40 }
]
const wonderImages = import.meta.glob<string>('./wonders/*.webp', {
  eager: true,
  query: '?url',
  import: 'default'
})

const places = computed(
  () => props.world.tiers.find((x) => x.id === props.tierId)?.places ?? ([] as Place[])
)
const placeOf = (landmark: string): Place | undefined =>
  places.value.find((p) => p.landmark === landmark)
const nameOf = (p: Place): string => (locale.value === 'vi' ? p.vi : p.title)

const host = ref<HTMLDivElement | null>(null)
const labelEls = new Map<string, HTMLElement>()
const petEl = ref<HTMLDivElement | null>(null)
const card = ref<Place | null>(null)
const ready = ref(false)
let handle: GlobeHandle | null = null
let gone = false

function setLabel(id: string, el: unknown): void {
  if (el instanceof HTMLElement) labelEls.set(id, el)
  else labelEls.delete(id)
}

function onFrame(items: ReadonlyArray<{ id: string; x: number; y: number; near: number }>): void {
  // Nhãn gần tâm được ưu tiên, nhãn đè lên nhãn đã hiện thì ẩn; nơi đang chọn luôn trước
  const selected = card.value?.landmark
  const order = [...items].sort(
    (a, b) => Number(b.id === selected) - Number(a.id === selected) || b.near - a.near
  )
  const shown: Array<{ x: number; y: number }> = []
  for (const it of order) {
    const el = labelEls.get(it.id)
    if (el) {
      const isContinent = it.id.startsWith('c:')
      const y = it.y + (isContinent ? 0 : 36)
      const free = !shown.some((q) => Math.abs(q.x - it.x) < LABEL_W && Math.abs(q.y - y) < LABEL_H)
      const show = free && it.near > (isContinent ? NEAR_CONTINENT : NEAR_LABEL)
      if (show) shown.push({ x: it.x, y })
      el.style.visibility = show ? 'visible' : 'hidden'
      el.style.transform = `translate(${it.x}px, ${it.y}px) translate(-50%, ${isContinent ? '-50%' : '18px'})`
    }
    if (it.id === selected && petEl.value) {
      petEl.value.style.visibility = it.near > 0.3 ? 'visible' : 'hidden'
      petEl.value.style.transform = `translate(${it.x + 70}px, ${it.y + 6}px) translate(-50%, -100%)`
    }
  }
}

function go(landmark: string): void {
  const p = placeOf(landmark)
  if (!p) return
  playSfx('tap')
  speak(p.title, 'us', 0.85)
  card.value = p
  handle?.focus(landmark)
  void invoke('kids:arrive', { placeId: p.id }).catch(() => undefined)
}

function close(): void {
  card.value = null
  handle?.resume()
}

function play(): void {
  if (!card.value) return
  playSfx('tap')
  emit('start', card.value.id)
}

onMounted(async () => {
  try {
    if (!host.value) return
    const penguin = vectorPictureUrl('penguin')
    const h = await mountGlobe(host.value, {
      width: props.width,
      height: props.height,
      pixelRatio: Math.min(2, (window.devicePixelRatio || 1) * props.scale),
      reduceMotion: reduced,
      quality: savedQuality(),
      spots: EARTH_WONDERS.filter((w) => placeOf(w.id)).map((w) => ({
        id: w.id,
        lat: w.lat,
        lon: w.lon,
        image: wonderImages[`./wonders/${w.id}.webp`]
      })),
      labels: CONTINENT_POINTS.map((c) => ({ id: `c:${c.id}`, lat: c.lat, lon: c.lon })),
      decor: penguin
        ? [
            { id: 'p1', lat: -77, lon: 20, image: penguin, size: 0.09 },
            { id: 'p2', lat: -76, lon: 130, image: penguin, size: 0.09 },
            { id: 'p3', lat: -76, lon: -100, image: penguin, size: 0.09 }
          ]
        : [],
      onSelect: (id) => {
        if (id) go(id)
        else if (card.value) close()
      },
      onFrame
    })
    if (gone) {
      h.dispose()
      return
    }
    handle = h
    ready.value = true
    const current = places.value.find((p) => p.id === props.world.currentPlaceId)
    if (current) go(current.landmark)
  } catch {
    emit('fail')
  }
})

onBeforeUnmount(() => {
  gone = true
  handle?.dispose()
})
</script>

<template>
  <div class="globe">
    <div ref="host" class="gl" />

    <span
      v-for="c in CONTINENT_POINTS"
      :key="c.id"
      :ref="(el) => setLabel(`c:${c.id}`, el)"
      class="continent"
      :class="{ dark: c.id === 'antarctica' }"
    >
      {{ t(`kids.game.continents.${c.id}`) }}
    </span>
    <template v-for="w in EARTH_WONDERS" :key="w.id">
      <button
        v-if="placeOf(w.id)"
        :ref="(el) => setLabel(w.id, el)"
        type="button"
        class="spot"
        @click="go(w.id)"
      >
        <HexLabel :text="nameOf(placeOf(w.id) as Place)" :hot="card?.landmark === w.id" />
      </button>
    </template>

    <div v-if="card && petStore.pet" ref="petEl" class="pet">
      <PetSprite
        :character="normalizeCharacterId(petStore.pet.characterId)"
        :stage="petStore.pet.stage"
        :accessories="petStore.pet.equipped"
        :size="72"
        animate
      />
    </div>

    <PlaceCard
      v-if="card"
      :title="nameOf(card)"
      :detail="card.landmarkVi"
      :action="t('kids.game.goTo', { name: nameOf(card) })"
      @go="play"
      @close="close"
    />
  </div>
</template>

<style scoped>
.globe {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, var(--g-27306a), var(--g-141a3a) 70%);
  user-select: none;
}
.gl {
  position: absolute;
  inset: 0;
}
.continent,
.spot {
  position: absolute;
  top: 0;
  left: 0;
  visibility: hidden;
  will-change: transform;
}
.continent {
  color: #fff;
  font-family: var(--font-kids);
  font-size: 30px;
  font-weight: 800;
  pointer-events: none;
  text-shadow:
    0 0 4px var(--g-5a2a4a),
    0 2px 2px var(--g-5a2a4a);
  white-space: nowrap;
}
.continent.dark {
  color: var(--g-5b7f95);
  text-shadow: 0 0 4px #fff;
}
.spot {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.spot:focus-visible {
  outline: 4px solid var(--g-teal);
  outline-offset: 4px;
}
.pet {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  will-change: transform;
}
</style>
