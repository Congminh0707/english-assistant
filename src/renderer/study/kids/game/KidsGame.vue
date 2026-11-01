<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { STAGE_H, STAGE_W } from '@shared/kidsWorldLayout'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import ArtScene from '@renderer/shared/components/ArtScene.vue'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import KidsReview from '../KidsReview.vue'
import KidsVisit from '../KidsVisit.vue'
import AsiaMap from './AsiaMap.vue'
import GlobeMap from './GlobeMap.vue'
import { PLACE_ART } from './placeArt.generated'
import PlaceAbout from './PlaceAbout.vue'
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
/** Nơi đang xem giới thiệu trước khi vào (bản đồ → giới thiệu → vào) và biển giới thiệu trong cảnh */
const overviewId = ref<string | null>(null)
const aboutOpen = ref(false)
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
const overviewPlace = computed(
  () => world.value?.tiers.flatMap((x) => x.places).find((p) => p.id === overviewId.value) ?? null
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

/** Cửa sổ nhỏ (vd 900×640): sân khấu co lại ~0.56 nên nút và chữ nhỏ quá; phóng HUD và biển tên lên cho cỡ thật không dưới ~0.8 */
const HUD_MIN_SIZE = 0.8
const HUD_MAX_ZOOM = 1.5
const hudZoom = computed(() => Math.min(HUD_MAX_ZOOM, Math.max(1, HUD_MIN_SIZE / scale.value)))

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

/** Bấm vào một nơi trên bản đồ: xem giới thiệu (học gì, văn hoá, ẩm thực) rồi mới vào */
function start(id: string): void {
  overviewId.value = id
}

/** Nơi có cảnh chi tiết thì vào cảnh trước, nơi khác vào thẳng bài học */
function enter(id: string): void {
  overviewId.value = null
  placeId.value = id
  startStep.value = 0
  view.value = PLACE_ART[id] ? 'place' : 'visit'
}

/** Chạm biển trong cảnh: vào đúng bước tương ứng của bài học */
const startStep = ref(0)
function learn(step: number): void {
  startStep.value = step
  view.value = 'visit'
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
  if (overviewId.value || aboutOpen.value) {
    overviewId.value = null
    aboutOpen.value = false
    return
  }
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
        transform: `translate(-50%, -50%) scale(${scale})`,
        '--hz': hudZoom
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
            @learn="learn"
            @about="aboutOpen = true"
          />
        </Transition>
        <div v-else class="panel">
          <ArtScene class="panel-art" name="kids-visitbg" />
          <div class="panel-body">
            <KidsVisit
              v-if="view === 'visit' && placeId"
              :key="placeId"
              :place-id="placeId"
              :start-step="startStep"
              @back="afterVisit"
              @changed="changed"
            />
            <KidsReview v-else-if="view === 'review'" @done="backToMap" @changed="changed" />
          </div>
        </div>
      </template>

      <!-- HUD -->
      <div class="hud left">
        <!-- Đang học tại một nơi thì chỉ có nút quay lại nơi đó; về làng/bản đồ làm từ trong cảnh -->
        <button v-if="view !== 'visit'" type="button" class="pill-btn" @click="exit">
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
        <button v-else-if="view === 'visit'" type="button" class="pill-btn" @click="afterVisit">
          <UiIcon name="back" :size="26" />{{
            t('kids.game.about.backToPlace', {
              name: currentPlace ? (locale === 'vi' ? currentPlace.vi : currentPlace.title) : ''
            })
          }}
        </button>
        <template v-else>
          <button type="button" class="pill-btn" @click="backToMap">
            <UiIcon name="map" :size="26" />{{ t('kids.game.map') }}
          </button>
          <span v-if="view === 'place' && currentPlace" class="pill-btn stat">
            {{ locale === 'vi' ? currentPlace.vi : currentPlace.title }}
          </span>
        </template>
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

      <PlaceAbout
        v-if="overviewPlace && view === 'map'"
        :place="overviewPlace"
        mode="overview"
        @enter="enter(overviewPlace.id)"
        @close="overviewId = null"
      />
      <PlaceAbout
        v-else-if="aboutOpen && view === 'place' && currentPlace"
        :place="currentPlace"
        mode="about"
        @close="aboutOpen = false"
      />

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
  background: var(--g-teal-2);
  color: var(--g-ink);
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
  overflow: hidden;
  background: var(--g-sky);
}
.panel-art {
  position: absolute;
  inset: 0;
}
.panel-body {
  --c-surface: var(--g-paper);
  position: relative;
  width: 1320px;
  max-height: 800px;
  margin-top: 70px;
  padding-bottom: 16px;
  overflow-y: auto;
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
  zoom: var(--hz, 1);
}
.left {
  top: 20px;
  left: 24px;
  flex-wrap: wrap;
  max-width: calc(100% - 460px);
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
  border: 3px solid var(--g-line);
  border-radius: 29px;
  background: var(--g-paper);
  color: var(--g-brown);
  font-family: var(--font-kids);
  font-size: 22px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}
.pill-btn.on {
  border-color: var(--g-coin);
  background: var(--g-red);
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
  outline: 4px solid var(--g-teal);
  outline-offset: 3px;
}
.star {
  color: var(--g-gold);
  fill: var(--g-coin);
}
.flower {
  margin-left: 8px;
  color: var(--g-pink);
}
.hud-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  padding: 0;
  border: 3px solid var(--g-line);
  border-radius: 50%;
  background: var(--g-paper);
  color: var(--g-brown);
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
  color: var(--g-blue);
}
.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 30px;
  padding: 1px 7px;
  border: 3px solid var(--g-coin);
  border-radius: 999px;
  background: var(--g-red);
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
  zoom: var(--hz, 1);
  margin: 0;
  padding: 8px 20px;
  border: 3px solid var(--g-line);
  border-radius: 20px;
  background: rgb(255 249 234 / 94%);
  color: var(--g-brown);
  font-family: var(--font-kids);
  font-size: 19px;
  font-weight: 600;
  pointer-events: none;
}
</style>
