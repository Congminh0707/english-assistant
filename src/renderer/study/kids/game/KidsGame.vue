<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { STAGE_H, STAGE_W } from '@shared/kidsWorldLayout'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import KidsReview from '../KidsReview.vue'
import KidsVisit from '../KidsVisit.vue'
import WorldMap from './WorldMap.vue'
import WorldMap3D from './WorldMap3D.vue'
import { playSfx, setSfxEnabled } from './sfx'

// Màn game toàn màn hình của bé (docs/19-kids-world.md §5.4): bấm ô Chơi → cửa sổ Học tập toàn màn hình (kênh
// study:fullscreen, chỉ khi bé bấm), sân khấu 16:9 co giãn vừa màn hình (viền màu trời), HUD kiểu game phủ trên.
// Bản đồ, lượt chơi 5 bước và ôn (bình tưới) đều ở trong sân khấu. Thoát bằng nút Nhà hoặc Esc.
const emit = defineEmits<{ exit: []; changed: [] }>()

const { t } = useI18n()
const petStore = usePetStore()
const settings = useSettingsStore()

type View = 'map' | 'visit' | 'review'
const view = ref<View>('map')
const world = ref<KidsWorldView | null>(null)
const tierId = ref<string | null>(null)
const placeId = ref<string | null>(null)
const scale = ref(1)
/** Bản đồ 3D (chỉ tầng có bản đồ địa lý); nhớ lựa chọn, tự về 2D nếu máy không dựng được WebGL */
const prefs3d = ((): boolean => {
  try {
    return localStorage.getItem('kids.map3d') === '1'
  } catch {
    return false
  }
})()
const want3d = ref(prefs3d)
const webglFailed = ref(false)

const tier = computed(() => world.value?.tiers.find((x) => x.id === tierId.value) ?? null)
const can3d = computed(() => tier.value?.scene === 'vn' && !webglFailed.value)
const show3d = computed(() => can3d.value && want3d.value)

function toggle3d(): void {
  want3d.value = !want3d.value
  try {
    localStorage.setItem('kids.map3d', want3d.value ? '1' : '0')
  } catch {
    /* không lưu được thì thôi */
  }
}

const sound = computed(() => settings.settings['kids.gameSound'])
const tiersWithPlaces = computed(() => world.value?.tiers.filter((x) => x.unlocked && x.places.length > 0) ?? [])
const nextLocked = computed(
  () => world.value?.tiers.find((x) => !x.unlocked) ?? null
)
const totals = computed(() => {
  let stars = 0
  let flowers = 0
  for (const tier of world.value?.tiers ?? []) {
    for (const p of tier.places) {
      stars += p.stars
      flowers += p.words.filter((w) => w.done).length
    }
  }
  return { stars, flowers }
})

function fit(): void {
  scale.value = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)
}

async function load(): Promise<void> {
  const v = await invoke('kids:world')
  world.value = v
  if (!tierId.value) {
    const current = v.tiers.find((x) => x.places.some((p) => p.id === v.currentPlaceId))
    tierId.value = current?.id ?? tiersWithPlaces.value[0]?.id ?? v.tiers[0]?.id ?? null
  }
}

function start(id: string): void {
  placeId.value = id
  view.value = 'visit'
}

/** Nạp lại tiến độ rồi mới dựng bản đồ, để thú cưng/camera đứng đúng nơi vừa học (không dùng dữ liệu cũ) */
async function backToMap(): Promise<void> {
  await load()
  if (placeId.value) {
    const tier = world.value?.tiers.find((x) => x.places.some((p) => p.id === placeId.value))
    if (tier) tierId.value = tier.id
  }
  view.value = 'map'
}

function changed(): void {
  emit('changed')
}

async function toggleSound(): Promise<void> {
  const on = !sound.value
  setSfxEnabled(on)
  await settings.set('kids.gameSound', on)
  if (on) playSfx('tap')
}

function exit(): void {
  emit('exit')
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    exit()
  }
}

onMounted(async () => {
  fit()
  window.addEventListener('resize', fit)
  window.addEventListener('keydown', onKey)
  void invoke('study:fullscreen', true)
  await settings.load()
  setSfxEnabled(sound.value)
  if (!petStore.pet) await petStore.load()
  await load()
})
onUnmounted(() => {
  window.removeEventListener('resize', fit)
  window.removeEventListener('keydown', onKey)
  void invoke('study:fullscreen', false)
})
</script>

<template>
  <div class="game">
    <div
      class="stage"
      :style="{
        width: `${STAGE_W}px`,
        height: `${STAGE_H}px`,
        transform: `translate(-50%, -50%) scale(${scale})`
      }"
    >
      <template v-if="world && tierId">
        <WorldMap3D
          v-if="view === 'map' && show3d"
          :key="`3d-${tierId}`"
          :world="world"
          :tier-id="tierId"
          :scale="scale"
          @start="start"
          @fail="webglFailed = true"
        />
        <WorldMap
          v-else-if="view === 'map'"
          :world="world"
          :tier-id="tierId"
          :scale="scale"
          @start="start"
        />
        <div v-else class="panel">
          <div class="panel-body">
            <KidsVisit
              v-if="view === 'visit' && placeId"
              :key="placeId"
              :place-id="placeId"
              @back="backToMap"
              @changed="changed"
            />
            <KidsReview v-else-if="view === 'review'" @done="backToMap" @changed="changed" />
          </div>
        </div>
      </template>

      <!-- HUD -->
      <div class="hud left">
        <button type="button" class="hud-btn" :aria-label="t('kids.home')" @click="exit">
          <UiIcon name="home" :size="44" />
        </button>
        <button
          v-if="view !== 'map'"
          type="button"
          class="hud-btn"
          :aria-label="t('kids.game.map')"
          @click="backToMap"
        >
          <UiIcon name="map" :size="44" />
        </button>
      </div>

      <div v-if="world && view === 'map'" class="hud center">
        <span class="pill">
          <UiIcon name="star" :size="34" class="star" />{{ totals.stars }}
          <UiIcon name="flower" :size="34" class="flower" />{{ totals.flowers }}
        </span>
      </div>

      <div class="hud right">
        <button
          type="button"
          class="hud-btn"
          :aria-label="sound ? t('kids.game.mute') : t('kids.game.unmute')"
          @click="toggleSound"
        >
          <UiIcon :name="sound ? 'volume' : 'mute'" :size="40" />
        </button>
        <template v-if="world && view === 'map'">
          <button
            v-if="can3d"
            type="button"
            class="hud-btn"
            :aria-label="show3d ? t('kids.game.view2d') : t('kids.game.view3d')"
            :title="show3d ? t('kids.game.view2d') : t('kids.game.view3d')"
            @click="toggle3d"
          >
            <UiIcon :name="show3d ? 'map' : 'box'" :size="40" />
          </button>
          <button
            type="button"
            class="hud-btn water"
            :disabled="world.dueCount === 0"
            :aria-label="t('kids.world.water')"
            @click="view = 'review'"
          >
            <UiIcon name="water" :size="44" />
            <span v-if="world.dueCount" class="badge">{{ world.dueCount }}</span>
          </button>
        </template>
      </div>

      <div v-if="world && view === 'map'" class="hud tiers">
        <button
          v-for="x in tiersWithPlaces"
          :key="x.id"
          type="button"
          class="hud-btn tier"
          :class="{ on: x.id === tierId }"
          :aria-label="x.title"
          @click="tierId = x.id"
        >
          <UiIcon name="map" :size="34" />
          <span class="tier-name">{{ x.title }}</span>
        </button>
        <span v-if="nextLocked" class="hud-btn tier locked" :title="t('kids.world.locked')">
          <UiIcon name="lock" :size="30" />
          <span class="tier-name">{{ nextLocked.title }}</span>
        </span>
      </div>

      <p v-if="world && view === 'map' && !show3d" class="hint">
        {{ world.newLeftToday > 0 ? t('kids.world.hint') : t('kids.world.tomorrow') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.game {
  position: fixed;
  inset: 0;
  z-index: 30;
  overflow: hidden;
  background: linear-gradient(#79cdf2, #46a5db);
  color: #3b2a3a;
  font-family: var(--font-ui);
}
.stage {
  position: absolute;
  top: 50%;
  left: 50%;
  overflow: hidden;
  transform-origin: 50% 50%;
}
.panel {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 20% 10%, rgb(255 255 255 / 55%) 0 80px, transparent 81px),
    radial-gradient(circle at 85% 18%, rgb(255 255 255 / 45%) 0 60px, transparent 61px),
    linear-gradient(#bfe6ff, #fff4d6);
}
.panel-body {
  --c-surface: #fff;
  width: 1240px;
  max-height: 780px;
  padding: 40px 30px;
  overflow-y: auto;
  border: 5px solid #3b2a3a;
  border-radius: 40px;
  background: rgb(255 255 255 / 82%);
  box-shadow: 0 10px 0 0 #9cc3dd;
}
.hud {
  position: absolute;
  z-index: 5;
  display: flex;
  gap: 16px;
  pointer-events: none;
}
.hud > * {
  pointer-events: auto;
}
.left {
  top: 24px;
  left: 28px;
}
.right {
  top: 24px;
  right: 28px;
}
.center {
  top: 26px;
  left: 50%;
  transform: translateX(-50%);
}
.tiers {
  right: 28px;
  bottom: 28px;
}
.hud-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  padding: 0;
  border: 5px solid #3b2a3a;
  border-radius: 50%;
  background: #fff8e2;
  color: #3b2a3a;
  font: inherit;
  cursor: pointer;
  box-shadow: 0 7px 0 0 #3b2a3a;
}
.hud-btn:active:not(:disabled) {
  transform: translateY(6px);
  box-shadow: 0 1px 0 0 #3b2a3a;
}
.hud-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.water {
  background: #d6f0ff;
  color: #2f7fb8;
}
.badge {
  position: absolute;
  top: -10px;
  right: -10px;
  min-width: 38px;
  padding: 3px 8px;
  border: 4px solid #3b2a3a;
  border-radius: 999px;
  background: #ff5a5a;
  color: #fff;
  font-size: 20px;
  font-weight: 900;
}
.tier {
  width: 108px;
  height: 108px;
  align-content: center;
  gap: 2px;
}
.tier.on {
  background: #ffe066;
}
.tier.locked {
  opacity: 0.6;
  cursor: default;
}
.tier-name {
  max-width: 96px;
  overflow: hidden;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 28px;
  border: 5px solid #3b2a3a;
  border-radius: 999px;
  background: #fff8e2;
  box-shadow: 0 7px 0 0 #3b2a3a;
  font-size: 36px;
  font-weight: 900;
}
.pill .star {
  color: #e0a620;
  fill: #ffd34d;
}
.pill .flower {
  margin-left: 14px;
  color: #e0508f;
}
.hint {
  position: absolute;
  bottom: 30px;
  left: 50%;
  z-index: 5;
  max-width: 900px;
  margin: 0;
  padding: 10px 24px;
  border: 4px solid #3b2a3a;
  border-radius: 22px;
  background: rgb(255 248 226 / 92%);
  font-size: 19px;
  font-weight: 700;
  text-align: center;
  transform: translateX(-50%);
  pointer-events: none;
}
</style>
