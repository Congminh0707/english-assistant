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
import AsiaMap from './AsiaMap.vue'
import GlobeMap from './GlobeMap.vue'
import { PLACE_ART } from './placeArt.generated'
import PlaceScene from './PlaceScene.vue'
import WorldMap from './WorldMap.vue'
import WorldMap3D from './WorldMap3D.vue'
import { playSfx, setSfxEnabled } from './sfx'

// Màn game toàn màn hình của bé (docs/19-kids-world.md §5.4): bấm ô Chơi → cửa sổ Học tập toàn màn hình (kênh
// study:fullscreen, chỉ khi bé bấm), sân khấu 16:9 co giãn vừa màn hình (viền màu trời), HUD kiểu game phủ trên.
// Bản đồ, lượt chơi 5 bước và ôn (bình tưới) đều ở trong sân khấu. Thoát bằng nút Nhà hoặc Esc.
const emit = defineEmits<{ exit: []; changed: [] }>()

const { t, locale } = useI18n()
const petStore = usePetStore()
const settings = useSettingsStore()

type View = 'map' | 'place' | 'visit' | 'review'
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
const globeFailed = ref(false)

const tier = computed(() => world.value?.tiers.find((x) => x.id === tierId.value) ?? null)
const currentPlace = computed(
  () => world.value?.tiers.flatMap((x) => x.places).find((p) => p.id === placeId.value) ?? null
)
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
const tiersWithPlaces = computed(
  () => world.value?.tiers.filter((x) => x.unlocked && x.places.length > 0) ?? []
)
const nextLocked = computed(() => world.value?.tiers.find((x) => !x.unlocked) ?? null)
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

/** Nơi có cảnh chi tiết thì vào cảnh trước, nơi khác vào thẳng bài học */
function start(id: string): void {
  placeId.value = id
  view.value = PLACE_ART[id] ? 'place' : 'visit'
}

/** Xong hoặc thoát bài học: quay về cảnh của nơi đó nếu có */
async function afterVisit(): Promise<void> {
  if (placeId.value && PLACE_ART[placeId.value]) {
    await load()
    view.value = 'place'
  } else await backToMap()
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
  if (e.key !== 'Escape') return
  e.preventDefault()
  // Esc lùi một bậc: đang trong màn con thì về bản đồ, đang ở bản đồ thì thoát game
  if (view.value === 'map') exit()
  else if (view.value === 'visit') void afterVisit()
  else void backToMap()
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
        <AsiaMap
          v-else-if="view === 'map' && tier?.scene === 'islands'"
          :world="world"
          :tier-id="tierId"
          :width="STAGE_W"
          :height="STAGE_H"
          @start="start"
          @tier="tierId = $event"
        />
        <GlobeMap
          v-else-if="view === 'map' && tier?.scene === 'globe' && !globeFailed"
          :key="`globe-${tierId}`"
          :world="world"
          :tier-id="tierId"
          :width="STAGE_W"
          :height="STAGE_H"
          :scale="scale"
          @start="start"
          @fail="globeFailed = true"
        />
        <WorldMap
          v-else-if="view === 'map'"
          :world="world"
          :tier-id="tierId"
          :scale="scale"
          @start="start"
        />
        <Transition v-else-if="view === 'place' && currentPlace" name="enter" appear>
          <PlaceScene
            :key="currentPlace.id"
            :place="currentPlace"
            :width="STAGE_W"
            :height="STAGE_H"
            @learn="view = 'visit'"
          />
        </Transition>
        <div v-else class="panel">
          <div class="panel-body">
            <KidsVisit
              v-if="view === 'visit' && placeId"
              :key="placeId"
              :place-id="placeId"
              @back="afterVisit"
              @changed="changed"
            />
            <KidsReview v-else-if="view === 'review'" @done="backToMap" @changed="changed" />
          </div>
        </div>
      </template>

      <!-- HUD -->
      <div class="hud left">
        <button type="button" class="pill-btn" @click="exit">
          <UiIcon name="home" :size="26" />{{ t('kids.game.village') }}
        </button>
        <template v-if="world && view === 'map'">
          <button
            v-for="x in tiersWithPlaces"
            :key="x.id"
            type="button"
            class="pill-btn"
            :class="{ on: x.id === tierId }"
            @click="tierId = x.id"
          >
            {{ locale === 'vi' ? x.vi : x.title }}
          </button>
          <span v-if="nextLocked" class="pill-btn locked" :title="t('kids.world.locked')">
            <UiIcon name="lock" :size="22" />{{
              locale === 'vi' ? nextLocked.vi : nextLocked.title
            }}
          </span>
          <span class="pill-btn stat">
            <UiIcon name="star" :size="24" class="star" />{{
              t('kids.game.starsCount', { n: totals.stars })
            }}
            <UiIcon name="flower" :size="24" class="flower" />{{ totals.flowers }}
          </span>
        </template>
        <button v-else type="button" class="pill-btn" @click="backToMap">
          <UiIcon name="map" :size="26" />{{ t('kids.game.map') }}
        </button>
      </div>

      <div class="hud right">
        <button
          type="button"
          class="hud-btn"
          :aria-label="sound ? t('kids.game.mute') : t('kids.game.unmute')"
          @click="toggleSound"
        >
          <UiIcon :name="sound ? 'volume' : 'mute'" :size="30" />
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
            <UiIcon :name="show3d ? 'map' : 'box'" :size="30" />
          </button>
          <button
            type="button"
            class="hud-btn water"
            :disabled="world.dueCount === 0"
            :aria-label="t('kids.world.water')"
            @click="view = 'review'"
          >
            <UiIcon name="water" :size="32" />
            <span v-if="world.dueCount" class="badge">{{ world.dueCount }}</span>
          </button>
        </template>
      </div>

      <p v-if="world && view === 'map' && tier?.scene === 'vn' && !show3d" class="hint">
        {{ world.newLeftToday > 0 ? t('kids.world.hint') : t('kids.world.tomorrow') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Từ bản đồ vào cảnh: cảnh phóng từ xa tới, nền giấy hiện dần */
.enter-enter-active {
  transition:
    opacity 480ms ease,
    transform 620ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.enter-enter-from {
  opacity: 0;
  transform: scale(1.18);
}
@media (prefers-reduced-motion: reduce) {
  .enter-enter-active {
    transition: none;
  }
  .enter-enter-from {
    opacity: 1;
    transform: none;
  }
}
.game {
  position: fixed;
  inset: 0;
  z-index: 30;
  overflow: hidden;
  background: #12b4c8;
  color: #3a2413;
  font-family: var(--font-kids);
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
  align-items: center;
  gap: 10px;
  pointer-events: none;
}
.hud > * {
  pointer-events: auto;
}
.left {
  top: 20px;
  left: 24px;
}
.right {
  top: 20px;
  right: 24px;
}
.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 58px;
  padding: 0 22px;
  border: 3px solid #e7c98e;
  border-radius: 29px;
  background: #fff9ea;
  color: #6b3e1e;
  font-family: var(--font-kids);
  font-size: 22px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}
.pill-btn.on {
  border-color: #f7b91a;
  background: #d32f2f;
  color: #fff;
}
.pill-btn.locked,
.pill-btn.stat {
  cursor: default;
}
.pill-btn.locked {
  opacity: 0.72;
}
.pill-btn:focus-visible,
.hud-btn:focus-visible {
  outline: 4px solid #16bfc8;
  outline-offset: 3px;
}
.star {
  color: #d9a24a;
  fill: #f7b91a;
}
.flower {
  margin-left: 8px;
  color: #e0508f;
}
.hud-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  padding: 0;
  border: 3px solid #e7c98e;
  border-radius: 50%;
  background: #fff9ea;
  color: #6b3e1e;
  cursor: pointer;
}
.hud-btn:active:not(:disabled) {
  transform: translateY(3px);
}
.hud-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.water {
  color: #1e93d6;
}
.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 30px;
  padding: 1px 7px;
  border: 3px solid #f7b91a;
  border-radius: 999px;
  background: #d32f2f;
  color: #fff;
  font-size: 17px;
  font-weight: 800;
}
.hint {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 5;
  max-width: 620px;
  margin: 0;
  padding: 8px 20px;
  border: 3px solid #e7c98e;
  border-radius: 20px;
  background: rgb(255 249 234 / 94%);
  color: #6b3e1e;
  font-family: var(--font-kids);
  font-size: 19px;
  font-weight: 600;
  pointer-events: none;
}
</style>
