<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClipboardList, Coins, Flame, Search, Settings, TrendingUp } from 'lucide-vue-next'
import type { DailyPlan, DailyPlanItem, MissionsState, StudyOverview } from '@shared/schemas/study'
import { normalizeCharacterId } from '@shared/characters'
import type { PetState } from '@shared/schemas/pet'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import TodayDrawer from './TodayDrawer.vue'
import ArtScene from '@renderer/shared/components/ArtScene.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import type { Place } from '../places'
import {
  nextPlanItem,
  planItemIcon,
  planItemPlace,
  planItemSubtitle,
  planItemTitle
} from '../planItem'

// Trang chủ v2: bản đồ làng theo giờ, mỗi địa điểm là một mục (docs/23 §1). Toạ độ theo tranh 1100×720.
const props = defineProps<{
  streak: number
  coins: number
  level: number
  due: number
  overview: StudyOverview | null
  missions: MissionsState | null
  plan: DailyPlan | null
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
  minutes: [value: number]
  open: [item: DailyPlanItem]
}>()
const drawer = ref(false)
const { t } = useI18n()

const PINS: Array<{ id: Place; x: number; y: number }> = [
  { id: 'school', x: 200, y: 200 },
  { id: 'library', x: 760, y: 120 },
  { id: 'hall', x: 490, y: 150 },
  { id: 'well', x: 226, y: 500 },
  { id: 'tower', x: 990, y: 130 },
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
/** Thẻ "Hôm nay": mục kế tiếp chưa làm của lộ trình (người mới biết ngay bắt đầu từ đâu) */
const next = computed(() => nextPlanItem(props.plan))
const allDone = computed(
  () =>
    !!props.plan && props.plan.items.length > 0 && props.plan.doneCount >= props.plan.items.length
)
/** Địa điểm chứa mục kế tiếp được tô nổi; chưa có lộ trình thì giếng nổi khi có thẻ đến hạn */
const hotPlace = computed<Place | null>(() => {
  if (next.value) return planItemPlace(next.value)
  if (!props.plan && props.due > 0) return 'well'
  return null
})

/** Enter: mở mục kế tiếp; chưa có lộ trình thì ôn thẻ đến hạn như cũ */
function startNext(): void {
  if (next.value) emit('open', next.value)
  else if (!props.plan && props.due > 0) emit('start')
}

let timer = 0
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && drawer.value) {
    drawer.value = false
    return
  }
  if (e.key !== 'Enter' || e.repeat || e.defaultPrevented) return
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
  // Đang mở hộp thoại (ngăn Hôm nay, tìm từ, màn chào…) hoặc gõ trong ô nhập thì không tự mở bài
  if (document.querySelector('[role="dialog"]')) return
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
  startNext()
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
      :class="{ hot: p.id === hotPlace }"
      :data-nav="p.id"
      :style="{
        left: `clamp(84px, ${(p.x / 1100) * 100}%, calc(100% - 84px))`,
        top: `clamp(84px, ${(p.y / 720) * 100}%, calc(100% - 104px))`
      }"
      @click="emit('go', p.id)"
    >
      <span class="pin-name">
        <UiIcon v-if="p.id === hotPlace" name="next" :size="14" />
        {{ t(`study.place.${p.id}`) }}
        <span v-if="p.id === 'well' && due > 0" class="count">{{ due }}</span>
      </span>
      <span class="pin-hint">{{ t(`study.placeHint.${p.id}`) }}</span>
    </button>
    <div class="hud left">
      <span class="pill"><Flame :size="15" />{{ t('study.home.streakDays', { n: streak }) }}</span>
      <span class="pill"><Coins :size="15" />{{ t('shop.coins', { coins }) }}</span>
      <span class="pill"><TrendingUp :size="15" />{{ t('stats.level', { level }) }}</span>
    </div>
    <div class="hud right">
      <button
        type="button"
        class="pill"
        data-nav="today"
        :aria-label="t('study.home.todayPanel')"
        @click="drawer = !drawer"
      >
        <ClipboardList :size="15" /><span class="lbl">{{ t('study.home.todayPanel') }}</span>
      </button>
      <button
        type="button"
        class="pill"
        data-nav="search"
        :aria-label="t('study.home.search')"
        @click="emit('search')"
      >
        <Search :size="15" /><span class="lbl">{{ t('study.home.search') }}</span> <kbd>Ctrl K</kbd>
      </button>
      <button
        type="button"
        class="pill"
        data-nav="settings"
        :aria-label="t('study.nav.settings')"
        @click="emit('settings')"
      >
        <Settings :size="15" /><span class="lbl">{{ t('study.nav.settings') }}</span>
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
      :plan="plan"
      @goal="emit('goal', $event)"
      @minutes="emit('minutes', $event)"
      @open="emit('open', $event)"
      @close="drawer = false"
    />
    <!-- Thẻ "Hôm nay" luôn hiện: tiến độ + mục kế tiếp + một nút chính (docs/07 §13) -->
    <section
      v-if="plan && !drawer"
      class="card today"
      data-nav="today-card"
      :aria-label="t('study.plan.title')"
    >
      <div class="t-head">
        <span class="t-label">{{ t('study.plan.title') }}</span>
        <span class="chip" :class="allDone ? 'chip--success' : ''">
          {{ plan.doneCount }}/{{ plan.items.length }}
        </span>
      </div>
      <template v-if="next">
        <span class="t-icon"><UiIcon :name="planItemIcon(next)" :size="18" /></span>
        <div class="t-main">
          <div class="t-name">{{ planItemTitle(next, t) }}</div>
          <div class="t-sub">
            {{ t('study.plan.minutes', { n: next.minutes }) }}
            <template v-if="planItemSubtitle(next, t)"> · {{ planItemSubtitle(next, t) }}</template>
          </div>
        </div>
        <button type="button" class="btn btn--primary" data-nav="today-next" @click="startNext">
          {{ plan.doneCount > 0 ? t('study.home.continue') : t('study.home.begin') }}
          <kbd>Enter</kbd>
        </button>
      </template>
      <p v-else class="t-done">
        <UiIcon name="done" :size="16" />
        {{ plan.items.length === 0 ? t('study.plan.empty') : t('study.plan.allDone') }}
      </p>
      <button
        type="button"
        class="btn btn--ghost btn--sm"
        data-nav="today-plan"
        :aria-label="t('study.home.fullPlan')"
        @click="drawer = true"
      >
        <ClipboardList :size="15" /><span class="lbl">{{ t('study.home.fullPlan') }}</span>
      </button>
    </section>
    <!-- Lộ trình lỗi/chưa có: giữ nút ôn thẻ đến hạn như cũ -->
    <button
      v-else-if="!plan && due > 0"
      type="button"
      class="btn btn--primary btn--lg go"
      @click="emit('start')"
    >
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: var(--sp-1) var(--sp-3);
  line-height: 1.2;
  transform: translate(-50%, -50%);
  border: 2px solid var(--c-coin);
  border-radius: var(--r-md);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-weight: 800;
  white-space: nowrap;
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
.pin-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
/* Dòng nhỏ: địa điểm này để làm gì */
.pin-hint {
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
  font-weight: 600;
}
.pin.hot .pin-hint {
  color: inherit;
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
.go kbd,
.today .btn--primary kbd {
  border-radius: 4px;
  background: rgb(255 255 255 / 22%);
  color: inherit;
}
/* Thẻ "Hôm nay": một hàng gọn ở giữa đáy, dưới mọi ghim (ghim bị kẹp cao hơn 104px đáy) */
.today {
  position: absolute;
  left: 50%;
  bottom: var(--sp-3);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: max-content;
  max-width: min(600px, calc(100% - 2 * var(--sp-4)));
  padding: var(--sp-2) var(--sp-3);
  transform: translateX(-50%);
  box-shadow: var(--shadow-md);
}
.t-head {
  display: grid;
  flex: none;
  justify-items: start;
  gap: var(--sp-1);
}
.t-label {
  font-size: var(--fs-xs);
  font-weight: 800;
  color: var(--c-ink-soft);
  text-transform: uppercase;
}
.t-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-md);
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.t-main {
  flex: 1;
  min-width: 0;
}
.t-name {
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.t-sub {
  overflow: hidden;
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.t-done {
  display: inline-flex;
  flex: 1;
  align-items: center;
  gap: var(--sp-2);
  margin: 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-success);
}
.today .btn {
  flex: none;
  white-space: nowrap;
}
/* Cửa sổ hẹp: thanh phải chỉ còn icon, khỏi đè thanh trái */
@media (max-width: 780px) {
  .hud.right .lbl,
  .hud.right kbd {
    display: none;
  }
  .hud.right .pill {
    padding: 0 var(--sp-2);
  }
  .hud.left .pill {
    padding: 0 var(--sp-2);
  }
  /* Ghim hai dòng: bớt đệm ngang để Thư các và Tháp Bút không chạm nhau */
  .pin {
    padding: var(--sp-1) var(--sp-2);
  }
  /* Thẻ "Hôm nay": bỏ icon, phím tắt và chữ nút lộ trình (còn icon + aria-label) */
  .today .t-icon,
  .today kbd,
  .today .lbl {
    display: none;
  }
}
</style>
