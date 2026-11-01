<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeCharacterId } from '@shared/characters'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import ArtScene from '@renderer/shared/components/ArtScene.vue'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import { usePetStore } from '@renderer/shared/stores/pet'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import HexLabel from './HexLabel.vue'
import PlaceCard from './PlaceCard.vue'
import { ASIA_ART } from './placeArt.generated'
import { playSfx } from './sfx'

// Tầng 2 Các nước (docs/23-design-v2-spec.md §3, bảng PAsia): tranh bản đồ có sẵn máy bay trên đường bay nét đứt, biển
// tên là nút HTML. Chạm một nước: thú cưng đi máy bay theo đường cong tới đó rồi hiện thẻ. Sáu nước chưa có cảnh riêng nên
// nút trên thẻ vào thẳng bài học; biển Việt Nam quay về tầng 1. Tôn trọng giảm chuyển động.
type Place = KidsWorldView['tiers'][number]['places'][number]
const props = defineProps<{ world: KidsWorldView; tierId: string; width: number; height: number }>()
const emit = defineEmits<{ start: [placeId: string]; tier: [id: string] }>()

const { t, locale } = useI18n()
const { speak } = useTts()
const petStore = usePetStore()
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const FLIGHT_MS = 2600
/** Thú cưng đứng trên bệ, phía trên biển tên */
const PET_ABOVE = 62
const ARC = 150

const sx = computed(() => props.width / 1280)
const sy = computed(() => props.height / 720)
const places = computed(
  () => props.world.tiers.find((x) => x.id === props.tierId)?.places ?? ([] as Place[])
)
const vnTier = computed(() => props.world.tiers.find((x) => x.id === 'vn') ?? null)
const nameOf = (p: Place): string => (locale.value === 'vi' ? p.vi : p.title)
const spotOf = (id: string): { x: number; y: number } | undefined => {
  const s = ASIA_ART.spots[id]
  return s ? { x: s.x * sx.value, y: s.y * sy.value } : undefined
}
const petHome = (id: string | null): { x: number; y: number } => {
  const s = spotOf(id ?? '') ?? spotOf('vn') ?? { x: 0, y: 0 }
  return { x: s.x, y: s.y - PET_ABOVE }
}

const at = ref<string>(
  places.value.some((p) => p.id === props.world.currentPlaceId)
    ? (props.world.currentPlaceId ?? 'vn')
    : 'vn'
)
const pet = ref(petHome(at.value))
const flying = ref(false)
const left = ref(false)
const card = ref<Place | null>(null)
let raf = 0

function land(p: Place): void {
  flying.value = false
  at.value = p.id
  pet.value = petHome(p.id)
  void invoke('kids:arrive', { placeId: p.id }).catch(() => undefined)
  playSfx('whoosh')
  card.value = p
}

function go(p: Place): void {
  if (flying.value) return
  playSfx('tap')
  speak(p.title, 'us', 0.85)
  card.value = null
  if (p.id === at.value || reduced) {
    land(p)
    return
  }
  const a = { ...pet.value }
  const b = petHome(p.id)
  left.value = b.x < a.x
  flying.value = true
  playSfx('plane')
  const start = performance.now()
  const step = (now: number): void => {
    const u = Math.min(1, (now - start) / FLIGHT_MS)
    const e = u * u * (3 - 2 * u)
    pet.value = {
      x: a.x + (b.x - a.x) * e,
      y: a.y + (b.y - a.y) * e - Math.sin(e * Math.PI) * ARC
    }
    if (u < 1) raf = requestAnimationFrame(step)
    else land(p)
  }
  raf = requestAnimationFrame(step)
}

function play(): void {
  if (!card.value) return
  playSfx('tap')
  emit('start', card.value.id)
}

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="asia">
    <ArtScene class="art" :name="ASIA_ART.art" />

    <button
      v-if="vnTier"
      type="button"
      class="spot"
      :style="{ left: `${spotOf('vn')?.x}px`, top: `${spotOf('vn')?.y}px` }"
      @click="emit('tier', 'vn')"
    >
      <HexLabel :text="locale === 'vi' ? vnTier.vi : vnTier.title" />
    </button>
    <button
      v-for="p in places"
      :key="p.id"
      type="button"
      class="spot"
      :style="{ left: `${spotOf(p.id)?.x}px`, top: `${spotOf(p.id)?.y}px` }"
      @click="go(p)"
    >
      <HexLabel :text="nameOf(p)" :hot="p.id === at" />
    </button>

    <div
      v-if="petStore.pet"
      class="pet"
      :class="{ flying }"
      :style="{ transform: `translate(${pet.x}px, ${pet.y}px) translate(-50%, -100%)` }"
    >
      <svg v-if="flying" class="plane" :class="{ left }" viewBox="0 0 120 60" aria-hidden="true">
        <path
          d="M4 30 Q60 12 112 26 Q118 30 112 34 Q60 46 4 30Z"
          fill="#fff"
          stroke="#3A2413"
          stroke-width="3"
        />
        <path d="M58 30 L34 56 L52 56 L82 32Z" fill="#D32F2F" stroke="#3A2413" stroke-width="3" />
        <path d="M18 26 L8 8 L22 8 L34 24Z" fill="#D32F2F" stroke="#3A2413" stroke-width="3" />
      </svg>
      <PetSprite
        :character="normalizeCharacterId(petStore.pet.characterId)"
        :stage="petStore.pet.stage"
        :accessories="petStore.pet.equipped"
        :size="84"
        animate
        :flip="left"
      />
    </div>

    <PlaceCard
      v-if="card"
      :title="nameOf(card)"
      :detail="t('kids.game.countryDetail', { name: card.landmarkVi, total: card.words.length })"
      :action="t('kids.game.enter', { name: nameOf(card) })"
      @go="play"
      @close="card = null"
    />
  </div>
</template>

<style scoped>
.asia {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #12b4c8;
  user-select: none;
}
.art {
  position: absolute;
  inset: 0;
}
.spot {
  position: absolute;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transform: translate(-50%, -50%);
}
.spot:focus-visible {
  outline: 4px solid #16bfc8;
  outline-offset: 4px;
}
.pet {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  pointer-events: none;
  will-change: transform;
}
.plane {
  position: absolute;
  bottom: -14px;
  left: 50%;
  width: 170px;
  margin-left: -85px;
}
.plane.left {
  transform: scaleX(-1);
}
</style>
