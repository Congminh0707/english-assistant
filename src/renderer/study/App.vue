<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProfileInfo } from '@shared/schemas/profile'
import type { MissionsState, StudyOverview } from '@shared/schemas/study'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import VillageMap from './components/VillageMap.vue'
import PlaceShell from './components/PlaceShell.vue'
import { PLACE_PAGES, placeOf, type Place, type StudyPage } from './places'
import ReviewSession from './components/ReviewSession.vue'
import WordList from './components/WordList.vue'
import PlacementTest from './components/PlacementTest.vue'
import PracticeSession from './components/PracticeSession.vue'
import ShopPage from './components/ShopPage.vue'
import StatsPage from './components/StatsPage.vue'
import CoursesPage from './components/CoursesPage.vue'
import LessonsPage from './components/LessonsPage.vue'
import PhrasebookPage from './components/PhrasebookPage.vue'
import SettingsPage from './components/SettingsPage.vue'
import Onboarding from './components/Onboarding.vue'
import ParentReport from './components/ParentReport.vue'
import KidsApp from './kids/KidsApp.vue'
import PetPage from './components/PetPage.vue'
import TtsIndicator from '@renderer/shared/components/TtsIndicator.vue'
import EvolutionOverlay from './components/EvolutionOverlay.vue'
import { useEvolution } from './useEvolution'
import { isDark } from '@renderer/shared/theme'
import QuickSearch from './components/QuickSearch.vue'

// Cửa sổ Học tập v2 (docs/23): bản đồ làng, vào địa điểm thì có cảnh + nội dung trên giấy.
const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const petStore = usePetStore()
const { evolution, dismiss: dismissEvolution } = useEvolution(computed(() => petStore.pet))

const page = ref<StudyPage>('home')
const overview = ref<StudyOverview | null>(null)
/** Hồ sơ đang dùng; hồ sơ trẻ em thấy giao diện của bé, phụ huynh vào bằng PIN (parentMode) */
const activeProfile = ref<ProfileInfo | null>(null)
const parentMode = ref(false)
let timeTimer = 0
const kidsMode = computed(() => !!activeProfile.value?.isChild && !parentMode.value)
// Đổi sang hồ sơ khác (hoặc hồ sơ người lớn) thì thoát chế độ phụ huynh, không còn nút "quay lại màn hình bé"
watch(
  () => [activeProfile.value?.id, activeProfile.value?.isChild] as const,
  ([id], [prevId]) => {
    if (id !== prevId || !activeProfile.value?.isChild) {
      parentMode.value = false
      if (page.value === 'parent') page.value = 'home'
    }
  }
)
const missions = ref<MissionsState | null>(null)
/** Bài kiểm tra mở từ màn hình chào thì tự bắt đầu ngay */
const autostartTest = ref(false)
/** Kiểm tra lên cấp thay vì kiểm tra đầu vào */
const checkpointMode = ref(false)
const loaded = ref(false)
const searching = ref(false)
const cleanups: Array<() => void> = []

const dark = isDark
const place = computed(() => placeOf(page.value))

async function refresh(): Promise<void> {
  try {
    const profiles = await invoke('profile:list')
    activeProfile.value = profiles.find((p) => p.active) ?? null
    ;[overview.value, missions.value] = await Promise.all([
      invoke('study:overview'),
      invoke('study:missions')
    ])
  } catch (err) {
    console.warn('[study] overview failed', err)
  }
}

function goPlace(p: Place): void {
  go(PLACE_PAGES[p][0])
}

function go(next: StudyPage): void {
  autostartTest.value = false
  checkpointMode.value = false
  page.value = next
  void refresh()
}

/** Xong màn hình chào: vào bài kiểm tra (tự bắt đầu) hoặc trang chủ */
async function onboarded(startTest: boolean): Promise<void> {
  await Promise.all([settingsStore.load(), petStore.load()])
  if (startTest) {
    autostartTest.value = true
    page.value = 'placement'
  }
  void refresh()
}

/** Từ trang Thống kê: vào bài kiểm tra lên cấp và bắt đầu ngay */
function startCheckpoint(): void {
  go('placement')
  checkpointMode.value = true
  autostartTest.value = true
}

function openWords(): void {
  searching.value = false
  go('words')
}

async function setGoal(value: number): Promise<void> {
  await settingsStore.set('learning.dailyGoal', value as 5 | 10 | 20 | 30)
  void refresh()
}

/** Ctrl K: mở ô tìm từ ở mọi màn (trừ giao diện của bé) */
function onGlobalKey(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (!kidsMode.value) searching.value = !searching.value
  }
}

// XP đổi (ôn thẻ ở mascot, nhận thưởng nhiệm vụ...) → làm mới số liệu
watch(
  () => petStore.pet?.totalXp,
  () => void refresh()
)

watch(
  () => settingsStore.settings['ui.language'],
  (lang) => {
    locale.value = lang
  }
)

// Mascot cũng có thể ôn thẻ khi cửa sổ này đang mở → làm mới số liệu khi quay lại cửa sổ
const onFocus = (): void => void refresh()

onMounted(async () => {
  window.addEventListener('focus', onFocus)
  window.addEventListener('keydown', onGlobalKey)
  // Thời gian học (người lớn): báo định kỳ khi cửa sổ đang hiện và được chọn; trẻ em đếm riêng ở KidsApp
  timeTimer = window.setInterval(() => {
    if (activeProfile.value?.isChild) return
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return
    void invoke('study:tick', { seconds: 15 }).catch(() => undefined)
  }, 15_000)
  cleanups.push(settingsStore.listen(), petStore.listen())
  await Promise.all([settingsStore.load(), petStore.load(), refresh()])
  loaded.value = true
})
onUnmounted(() => {
  window.removeEventListener('focus', onFocus)
  window.removeEventListener('keydown', onGlobalKey)
  window.clearInterval(timeTimer)
  cleanups.forEach((fn) => fn())
})
</script>

<template>
  <div class="study modern">
    <KidsApp v-if="kidsMode" class="kids-fill" @parent="parentMode = true" @changed="refresh" />

    <VillageMap
      v-if="loaded && !kidsMode && page === 'home'"
      :streak="overview?.streakDays ?? 0"
      :coins="petStore.pet?.coins ?? 0"
      :level="petStore.pet?.level ?? 1"
      :due="overview?.dueCount ?? 0"
      :overview="overview"
      :missions="missions"
      :pet="petStore.pet"
      :dark="dark"
      @go="goPlace"
      @start="go('review')"
      @settings="go('settings')"
      @search="searching = true"
      @goal="setGoal"
    />
    <PlaceShell
      v-else-if="loaded && !kidsMode"
      :place="place"
      :page="page"
      :dark="dark"
      :parent-tab="!!activeProfile?.isChild"
      @home="go('home')"
      @go="go"
    >
      <p v-if="parentMode" class="parent-banner">
        {{ t('study.parent.banner') }}
        <button type="button" class="btn btn--sm" @click="parentMode = false">
          {{ t('study.parent.backToKid') }}
        </button>
      </p>
      <ParentReport v-if="page === 'parent'" />
      <CoursesPage v-else-if="page === 'courses'" @changed="refresh" />
      <LessonsPage v-else-if="page === 'lessons'" kind="lesson" @changed="refresh" />
      <LessonsPage v-else-if="page === 'reading'" kind="reading" @changed="refresh" />
      <LessonsPage v-else-if="page === 'listening'" kind="listening" @changed="refresh" />
      <LessonsPage v-else-if="page === 'grammar'" kind="grammar" @changed="refresh" />
      <PhrasebookPage v-else-if="page === 'phrasebook'" />
      <ReviewSession v-else-if="page === 'review'" @exit="go('home')" @changed="refresh" />
      <PracticeSession v-else-if="page === 'practice'" @changed="refresh" />
      <WordList v-else-if="page === 'words'" @changed="refresh" />
      <PetPage v-else-if="page === 'pet'" @changed="refresh" />
      <ShopPage v-else-if="page === 'shop'" @changed="refresh" />
      <StatsPage v-else-if="page === 'stats'" @checkpoint="startCheckpoint" />
      <PlacementTest
        v-else-if="page === 'placement'"
        :autostart="autostartTest"
        :mode="checkpointMode ? 'checkpoint' : 'placement'"
        @done="go('home')"
      />
      <SettingsPage v-else @retest="go('placement')" @changed="refresh" />
    </PlaceShell>

    <QuickSearch v-if="searching && !kidsMode" @close="searching = false" @words="openWords" />
    <TtsIndicator />

    <EvolutionOverlay
      v-if="loaded && evolution"
      :character="evolution.character"
      :name="evolution.name"
      :from="evolution.from"
      :to="evolution.to"
      :accessories="evolution.accessories"
      @close="dismissEvolution"
    />

    <Onboarding v-if="loaded && !settingsStore.settings['app.onboarded']" @done="onboarded" />
  </div>
</template>

<style scoped>
.kids-fill {
  flex: 1;
  min-width: 0;
}
.parent-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 var(--sp-4);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-warning-soft);
  color: var(--c-warning);
  font-weight: 600;
}
.study {
  display: flex;
  height: 100vh;
  background: var(--c-bg);
  color: var(--c-ink);
}
</style>
