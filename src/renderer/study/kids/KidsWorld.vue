<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeCharacterId } from '@shared/characters'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import { usePetStore } from '@renderer/shared/stores/pet'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import LandmarkPicture from './LandmarkPicture.vue'

// Bản đồ thế giới của bé — bản 2D (luôn có, docs/19-kids-world.md §5.3): các nơi nối bằng một con đường uốn lượn,
// mỗi nơi có công trình (chiếu từ voxel) và hàng "cây" thể hiện mức nhớ từng từ. Chạm một nơi → thú cưng đi tới
// → vào lượt chơi. Bình tưới mở phần ôn thẻ đến hạn. Bản đồ cách điệu, không vẽ hình dạng lãnh thổ/biên giới.
const emit = defineEmits<{ visit: [placeId: string]; review: [] }>()

const { t } = useI18n()
const { speak } = useTts()
const petStore = usePetStore()

const world = ref<KidsWorldView | null>(null)
const tierId = ref<string | null>(null)
const petAt = ref<string | null>(null)
const walking = ref(false)
const facingLeft = ref(false)
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const tier = computed(
  () => world.value?.tiers.find((x) => x.id === tierId.value) ?? world.value?.tiers[0] ?? null
)
const tiersWithPlaces = computed(() => world.value?.tiers.filter((x) => x.unlocked && x.places.length > 0) ?? [])
const nextLocked = computed(
  () => world.value?.tiers.find((x) => !x.unlocked) ?? null
)
const places = computed(() => [...(tier.value?.places ?? [])].sort((a, b) => a.order - b.order))
const petPlace = computed(() => places.value.find((p) => p.id === petAt.value) ?? null)

/** Đường đi: đường cong mượt qua các nơi theo thứ tự (toạ độ % → khung 100×56.25) */
const H = 56.25
const path = computed(() => {
  const pts = places.value.map((p) => [p.pos.x, (p.pos.y / 100) * H] as const)
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`
  }
  return d
})

/** Buổi trong ngày theo giờ máy: đổi màu trời */
const hour = ref(new Date().getHours())
const timeOfDay = computed(() =>
  hour.value >= 18 || hour.value < 6 ? 'night' : hour.value >= 16 ? 'evening' : 'day'
)
let clockTimer = 0

const STAGE_COLOR: Record<string, string> = {
  hidden: 'transparent',
  seed: '#b07a4a',
  sprout: '#7cc45a',
  flower: '#ff7eb6'
}

async function load(): Promise<void> {
  const view = await invoke('kids:world')
  world.value = view
  petAt.value = view.currentPlaceId
  const current = view.tiers.find((x) => x.places.some((p) => p.id === view.currentPlaceId))
  tierId.value = current?.id ?? view.tiers[0]?.id ?? null
  if (!petStore.pet) await petStore.load()
}

function go(placeId: string): void {
  const place = places.value.find((p) => p.id === placeId)
  if (!place || walking.value || place.state === 'locked') return
  speak(`${place.title}! ${place.topic}.`, 'us', 0.85)
  if (petAt.value === placeId || reducedMotion) {
    petAt.value = placeId
    emit('visit', placeId)
    return
  }
  const from = petPlace.value
  if (from) facingLeft.value = place.pos.x < from.pos.x
  walking.value = true
  petAt.value = placeId
  window.setTimeout(() => {
    walking.value = false
    emit('visit', placeId)
  }, 1300)
}

function sayWord(word: string): void {
  speak(word, 'us', 0.8)
}

onMounted(() => {
  void load()
  clockTimer = window.setInterval(() => (hour.value = new Date().getHours()), 60_000)
})
onUnmounted(() => window.clearInterval(clockTimer))
</script>

<template>
  <section class="k-screen world">
    <div v-if="world" class="top">
      <div class="k-row tiers">
        <button
          v-for="x in tiersWithPlaces"
          :key="x.id"
          type="button"
          class="tier"
          :class="{ on: x.id === tier?.id }"
          @click="tierId = x.id"
        >
          <UiIcon name="map" :size="20" />
          {{ x.title }}
        </button>
        <span v-if="nextLocked" class="tier locked" :title="t('kids.world.locked')">
          <UiIcon name="lock" :size="18" />
          {{ nextLocked.title }}
        </span>
      </div>
      <button
        type="button"
        class="k-round water"
        :disabled="world.dueCount === 0"
        :title="t('kids.world.water')"
        @click="emit('review')"
      >
        <UiIcon name="water" :size="30" />
        <span v-if="world.dueCount" class="badge">{{ world.dueCount }}</span>
      </button>
    </div>

    <div v-if="world && tier" class="map" :class="timeOfDay">
      <svg class="ground" viewBox="0 0 100 56.25" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="sea" x1="0" x2="1">
            <stop offset="0" stop-color="#7cc8ef" />
            <stop offset="1" stop-color="#4aa8d8" />
          </linearGradient>
        </defs>
        <rect width="100" height="56.25" fill="url(#sea)" />
        <!-- Dải đất cách điệu (không phải hình lãnh thổ thật) -->
        <path d="M -2 0 H 70 C 82 10, 64 20, 80 30 C 92 40, 70 50, 60 58 H -2 Z" fill="#9fd67a" />
        <path d="M -2 0 H 66 C 76 10, 60 20, 75 30 C 86 40, 64 50, 55 58 H -2 Z" fill="#86c766" />
        <path :d="path" fill="none" stroke="#f1d89a" stroke-width="1.6" stroke-linecap="round" />
        <path
          :d="path"
          fill="none"
          stroke="#e2bf72"
          stroke-width="0.35"
          stroke-dasharray="1.2 1.4"
          stroke-linecap="round"
        />
      </svg>
      <div class="clouds" aria-hidden="true">
        <span class="cloud c1" /><span class="cloud c2" /><span class="cloud c3" />
      </div>

      <button
        v-for="p in places"
        :key="p.id"
        type="button"
        class="place"
        :class="[p.state, { today: p.id === world.todayPlaceId }]"
        :style="{ left: `${p.pos.x}%`, top: `${p.pos.y}%` }"
        :disabled="p.state === 'locked'"
        @click="go(p.id)"
      >
        <LandmarkPicture :id="p.landmark" :width="112" />
        <span class="name">{{ p.title }}</span>
        <span class="vi">{{ p.vi }} · {{ p.topicVi }}</span>
        <span class="garden">
          <span
            v-for="w in p.words"
            :key="w.pictureId"
            class="sprout"
            :class="[w.stage, { thirsty: w.thirsty }]"
            :style="{ background: STAGE_COLOR[w.stage] }"
            :title="w.stage === 'hidden' ? '' : w.word"
            @click.stop="w.stage !== 'hidden' && sayWord(w.word)"
          />
        </span>
        <span v-if="p.stars" class="stars">
          <UiIcon v-for="n in p.stars" :key="n" name="star" :size="14" />
        </span>
      </button>

      <div
        v-if="petPlace && petStore.pet"
        class="pet"
        :class="{ walking }"
        :style="{ left: `${petPlace.pos.x}%`, top: `${petPlace.pos.y}%` }"
      >
        <PetSprite
          :character="normalizeCharacterId(petStore.pet.characterId)"
          :stage="petStore.pet.stage"
          :accessories="petStore.pet.equipped"
          :size="64"
          animate
          :walking="walking"
          :flip="facingLeft"
        />
      </div>
    </div>

    <p v-if="world" class="k-sub">
      {{ world.newLeftToday > 0 ? t('kids.world.hint') : t('kids.world.tomorrow') }}
    </p>
  </section>
</template>

<style scoped>
.world {
  max-width: 1080px;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}
.tiers {
  justify-content: flex-start;
  gap: 10px;
}
.tier {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 2px solid var(--c-line);
  border-radius: 999px;
  background: var(--c-surface);
  font: inherit;
  font-weight: 800;
  color: var(--c-ink);
  cursor: pointer;
}
.tier.on {
  border-color: var(--c-primary);
  color: var(--c-primary);
}
.tier.locked {
  opacity: 0.55;
  cursor: default;
}
.water {
  position: relative;
  color: #2f7fb8;
}
.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 24px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--c-danger);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}
.map {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 2px solid var(--c-line);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 6px 0 0 var(--k-edge);
}
.ground {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.map::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background 2s ease;
}
.map.evening::after {
  background: rgb(255 150 60 / 14%);
}
.map.night::after {
  background: rgb(20 30 80 / 38%);
}
.clouds {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.cloud {
  position: absolute;
  width: 90px;
  height: 26px;
  border-radius: 999px;
  background: rgb(255 255 255 / 75%);
  animation: drift 60s linear infinite;
}
.c1 {
  top: 6%;
  left: -10%;
}
.c2 {
  top: 40%;
  left: -20%;
  animation-delay: -25s;
  animation-duration: 80s;
}
.c3 {
  top: 72%;
  left: -15%;
  animation-delay: -45s;
}
@keyframes drift {
  to {
    transform: translateX(1300px);
  }
}
.place {
  position: absolute;
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 4px 6px 6px;
  border: 0;
  border-radius: 16px;
  background: transparent;
  font: inherit;
  color: var(--c-ink);
  cursor: pointer;
  transform: translate(-50%, -70%);
}
.place:hover:not(:disabled) {
  background: rgb(255 255 255 / 45%);
}
.place.locked {
  filter: grayscale(0.8) blur(1px);
  opacity: 0.6;
}
.place.today .name {
  animation: k-bounce 1.4s ease infinite;
  color: var(--c-primary);
}
.name {
  padding: 0 8px;
  border-radius: 8px;
  background: rgb(255 255 255 / 85%);
  font-size: 15px;
  font-weight: 800;
}
.vi {
  font-size: 11px;
  color: var(--c-ink-soft);
  background: rgb(255 255 255 / 70%);
  border-radius: 6px;
  padding: 0 4px;
}
.garden {
  display: flex;
  gap: 3px;
}
.sprout {
  width: 9px;
  height: 9px;
  border: 1.5px solid rgb(0 0 0 / 25%);
  border-radius: 50%;
}
.sprout.hidden {
  border-style: dashed;
}
.sprout.thirsty {
  box-shadow: 0 0 0 2px #4aa8d8;
}
.stars {
  display: flex;
  color: #e0a620;
  fill: #ffd34d;
}
.pet {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  transform: translate(-90%, -100%);
  transition:
    left 1.2s linear,
    top 1.2s linear;
}
.map.night .place .name {
  background: rgb(255 240 200 / 90%);
}
@media (prefers-reduced-motion: reduce) {
  .cloud,
  .place.today .name {
    animation: none;
  }
  .pet {
    transition: none;
  }
}
</style>
