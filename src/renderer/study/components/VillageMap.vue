<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClipboardList, Coins, Flame, Search, Settings, TrendingUp } from 'lucide-vue-next'
import type { MissionsState, StudyOverview } from '@shared/schemas/study'
import { normalizeCharacterId } from '@shared/characters'
import type { PetState } from '@shared/schemas/pet'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import TodayDrawer from './TodayDrawer.vue'
import ArtScene from '@renderer/shared/components/ArtScene.vue'
import type { Place } from '../places'

// Trang chủ v2: bản đồ làng theo giờ, mỗi địa điểm là một mục (docs/23 §1). Toạ độ theo tranh 1100×720.
const props = defineProps<{
  streak: number
  coins: number
  level: number
  due: number
  overview: StudyOverview | null
  missions: MissionsState | null
  pet: PetState | null
  /** Giao diện tối: luôn dùng tranh làng ban đêm */
  dark?: boolean
}>()
const emit = defineEmits<{
  go: [place: Place]
  start: []
  settings: []
  search: []
  goal: [value: number]
}>()
const drawer = ref(false)
const { t } = useI18n()

const PINS: Array<{ id: Place; x: number; y: number }> = [
  { id: 'school', x: 200, y: 200 },
  { id: 'library', x: 760, y: 120 },
  { id: 'hall', x: 490, y: 150 },
  { id: 'well', x: 226, y: 500 },
  { id: 'tower', x: 990, y: 66 },
  { id: 'pier', x: 548, y: 590 },
  { id: 'market', x: 888, y: 690 },
  { id: 'home', x: 150, y: 680 }
]

/** Vị trí thú cưng trên đường (toạ độ tranh 1100×720) */
const PET = { x: 380, y: 420 }

const hour = ref(new Date().getHours())
const scene = computed(() => {
  if (props.dark) return 'village-night'
  if (hour.value >= 18 || hour.value < 5) return 'village-night'
  return hour.value >= 16 ? 'village-dusk' : 'village-day'
})
let timer = 0
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && drawer.value) {
    drawer.value = false
    return
  }
  if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') emit('start')
}
onMounted(() => {
  timer = window.setInterval(() => (hour.value = new Date().getHours()), 60_000)
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  window.clearInterval(timer)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="village">
    <ArtScene class="map" :name="scene" />
    <button
      v-for="p in PINS"
      :key="p.id"
      type="button"
      class="pin"
      :class="{ hot: p.id === 'well' && due > 0 }"
      :data-nav="p.id"
      :style="{ left: `${(p.x / 1100) * 100}%`, top: `${(p.y / 720) * 100}%` }"
      @click="emit('go', p.id)"
    >
      {{ t(`study.place.${p.id}`) }}
      <span v-if="p.id === 'well' && due > 0" class="count">{{ due }}</span>
    </button>
    <div class="hud left">
      <span class="pill"><Flame :size="15" />{{ t('study.home.streakDays', { n: streak }) }}</span>
      <span class="pill"><Coins :size="15" />{{ t('shop.coins', { coins }) }}</span>
      <span class="pill"><TrendingUp :size="15" />{{ t('stats.level', { level }) }}</span>
    </div>
    <div class="hud right">
      <button type="button" class="pill" data-nav="today" @click="drawer = !drawer">
        <ClipboardList :size="15" />{{ t('study.home.todayPanel') }}
      </button>
      <button type="button" class="pill" data-nav="search" @click="emit('search')">
        <Search :size="15" />{{ t('study.home.search') }} <kbd>Ctrl K</kbd>
      </button>
      <button type="button" class="pill" data-nav="settings" @click="emit('settings')">
        <Settings :size="15" />{{ t('study.nav.settings') }}
      </button>
    </div>
    <div
      v-if="pet"
      class="pet"
      :style="{ left: `${(PET.x / 1100) * 100}%`, top: `${(PET.y / 720) * 100}%` }"
    >
      <PetSprite
        :character="normalizeCharacterId(pet.characterId)"
        :stage="pet.stage"
        :accessories="pet.equipped"
        :size="72"
        animate
      />
    </div>
    <TodayDrawer
      v-if="drawer"
      :overview="overview"
      :missions="missions"
      @start="emit('start')"
      @goal="emit('goal', $event)"
      @close="drawer = false"
    />
    <button v-if="due > 0" type="button" class="btn btn--primary btn--lg go" @click="emit('start')">
      {{ t('study.home.goReview', { n: due }) }} <kbd>Enter</kbd>
    </button>
  </div>
</template>

<style scoped>
.village {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--c-bg);
}
.map {
  position: absolute;
  inset: 0;
}
.pin {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 var(--sp-3);
  transform: translate(-50%, -50%);
  border: 2px solid var(--c-coin);
  border-radius: var(--r-md);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: transform 120ms ease;
}
.pin:hover,
.pin:focus-visible {
  transform: translate(-50%, -50%) scale(1.06);
}
.pin.hot {
  background: var(--c-primary);
  color: var(--c-on-primary);
}
.count {
  padding: 0 6px;
  border-radius: var(--r-pill);
  background: var(--c-surface);
  color: var(--c-primary);
  font-size: var(--fs-xs);
}
.pet {
  position: absolute;
  transform: translate(-50%, -85%);
  pointer-events: none;
}
.hud {
  position: absolute;
  top: var(--sp-4);
  display: flex;
  gap: var(--sp-2);
}
.hud.left {
  left: var(--sp-5);
}
.hud.right {
  right: var(--sp-5);
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 var(--sp-3);
  border: 2px solid var(--c-line);
  border-radius: var(--r-pill);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-weight: 700;
}
button.pill {
  cursor: pointer;
}
kbd {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--c-surface-2);
  color: var(--c-ink-soft);
  font: 500 var(--fs-xs) var(--font-ui);
}
.go {
  position: absolute;
  left: 50%;
  bottom: var(--sp-3);
  transform: translateX(-50%);
}
.go kbd {
  border-radius: 4px;
  background: rgb(255 255 255 / 22%);
  color: inherit;
}
</style>
