<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProfileInfo } from '@shared/schemas/profile'
import type { MissionsState, StudyOverview } from '@shared/schemas/study'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import PxBar from '@renderer/shared/components/PxBar.vue'
import StudyHome from './components/StudyHome.vue'
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

// Cửa sổ Học tập (docs/12-ui-ux-guidelines.md#cửa-sổ-học-tập-study): thanh bên + trang nội dung.
type Page =
  | 'home'
  | 'parent'
  | 'courses'
  | 'lessons'
  | 'reading'
  | 'listening'
  | 'grammar'
  | 'phrasebook'
  | 'review'
  | 'practice'
  | 'words'
  | 'shop'
  | 'stats'
  | 'placement'
  | 'settings'

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const petStore = usePetStore()

const page = ref<Page>('home')
const overview = ref<StudyOverview | null>(null)
/** Hồ sơ đang dùng; hồ sơ trẻ em thấy giao diện của bé, phụ huynh vào bằng PIN (parentMode) */
const activeProfile = ref<ProfileInfo | null>(null)
const parentMode = ref(false)
let timeTimer = 0
const kidsMode = computed(() => !!activeProfile.value?.isChild && !parentMode.value)
const missions = ref<MissionsState | null>(null)
/** Bài kiểm tra mở từ màn hình chào thì tự bắt đầu ngay */
const autostartTest = ref(false)
/** Kiểm tra lên cấp thay vì kiểm tra đầu vào */
const checkpointMode = ref(false)
const loaded = ref(false)
const cleanups: Array<() => void> = []

const pages = computed<Array<{ id: Page; icon: string; label: string }>>(() => [
  { id: 'home', icon: '🏠', label: t('study.nav.home') },
  ...(activeProfile.value?.isChild
    ? [{ id: 'parent' as Page, icon: '👨‍👩‍👧', label: t('study.nav.parent') }]
    : []),
  { id: 'courses', icon: '🧭', label: t('study.nav.courses') },
  { id: 'lessons', icon: '📚', label: t('study.nav.lessons') },
  { id: 'reading', icon: '📖', label: t('study.nav.reading') },
  { id: 'listening', icon: '🎧', label: t('study.nav.listening') },
  { id: 'grammar', icon: '✍️', label: t('study.nav.grammar') },
  { id: 'phrasebook', icon: '💬', label: t('study.nav.phrasebook') },
  { id: 'review', icon: '🧠', label: t('study.nav.review') },
  { id: 'practice', icon: '🎯', label: t('study.nav.practice') },
  { id: 'words', icon: '🗂', label: t('study.nav.words') },
  { id: 'shop', icon: '🛍', label: t('study.nav.shop') },
  { id: 'stats', icon: '📊', label: t('study.nav.stats') },
  { id: 'placement', icon: '🧪', label: t('study.nav.placement') },
  { id: 'settings', icon: '⚙', label: t('study.nav.settings') }
])

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

function go(next: Page): void {
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

async function setGoal(value: number): Promise<void> {
  await settingsStore.set('learning.dailyGoal', value as 5 | 10 | 20 | 30)
  await refresh()
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
  window.clearInterval(timeTimer)
  cleanups.forEach((fn) => fn())
})
</script>

<template>
  <div class="study">
    <KidsApp v-if="kidsMode" class="kids-fill" @parent="parentMode = true" @changed="refresh" />

    <aside v-if="loaded && !kidsMode" class="side">
      <div class="pet">
        <div class="pet-name">{{ petStore.pet?.name ?? '…' }}</div>
        <template v-if="petStore.pet">
          <div class="pet-level">
            {{ t('stats.level', { level: petStore.pet.level }) }} ·
            {{ t(`pet.stage.${petStore.pet.stage}`) }}
          </div>
          <PxBar
            :value="petStore.pet.xpInLevel"
            :max="petStore.pet.xpForNext"
            color="var(--c-xp)"
            label="XP"
          />
          <div class="muted xp">{{ petStore.pet.xpInLevel }} / {{ petStore.pet.xpForNext }} XP</div>
          <div class="coins">🪙 {{ t('shop.coins', { coins: petStore.pet.coins }) }}</div>
        </template>
      </div>

      <nav class="nav">
        <button
          v-for="p in pages"
          :key="p.id"
          type="button"
          class="nav-item"
          :class="{ active: page === p.id }"
          @click="go(p.id)"
        >
          <span class="icon">{{ p.icon }}</span>
          {{ p.label }}
          <span v-if="p.id === 'review' && overview?.dueCount" class="badge">
            {{ overview.dueCount }}
          </span>
        </button>
      </nav>
    </aside>

    <main v-if="loaded && !kidsMode" class="content">
      <p v-if="parentMode" class="parent-banner">
        {{ t('study.parent.banner') }}
        <button type="button" @click="parentMode = false">{{ t('study.parent.backToKid') }}</button>
      </p>
      <ParentReport v-if="page === 'parent'" />
      <StudyHome
        v-else-if="page === 'home'"
        :overview="overview"
        :missions="missions"
        @start="go('review')"
        @goal="setGoal"
      />
      <CoursesPage v-else-if="page === 'courses'" @changed="refresh" />
      <LessonsPage v-else-if="page === 'lessons'" kind="lesson" @changed="refresh" />
      <LessonsPage v-else-if="page === 'reading'" kind="reading" @changed="refresh" />
      <LessonsPage v-else-if="page === 'listening'" kind="listening" @changed="refresh" />
      <LessonsPage v-else-if="page === 'grammar'" kind="grammar" @changed="refresh" />
      <PhrasebookPage v-else-if="page === 'phrasebook'" />
      <ReviewSession v-else-if="page === 'review'" @exit="go('home')" @changed="refresh" />
      <PracticeSession v-else-if="page === 'practice'" @changed="refresh" />
      <WordList v-else-if="page === 'words'" @changed="refresh" />
      <ShopPage v-else-if="page === 'shop'" @changed="refresh" />
      <StatsPage v-else-if="page === 'stats'" @checkpoint="startCheckpoint" />
      <PlacementTest
        v-else-if="page === 'placement'"
        :autostart="autostartTest"
        :mode="checkpointMode ? 'checkpoint' : 'placement'"
        @done="go('home')"
      />
      <SettingsPage v-else @retest="go('placement')" @changed="refresh" />
    </main>

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
  margin: 0 0 12px;
  padding: 6px 12px;
  background: #fff3a0;
  border: var(--px) solid var(--c-border);
}
.parent-banner button {
  padding: 3px 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  cursor: pointer;
}
.study {
  display: flex;
  height: 100vh;
  background: var(--c-bg);
  color: var(--c-ink);
  font-family: var(--font-ui);
  font-size: 14px;
}
.side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 200px;
  padding: 14px 12px;
  background: var(--c-surface);
  border-right: var(--px) solid var(--c-border);
}
.pet {
  display: grid;
  gap: 4px;
}
.pet-name {
  font-size: 18px;
  font-weight: 700;
}
.pet-level {
  font-weight: 600;
  color: var(--c-xp);
}
.xp {
  font-size: 11px;
}
.coins {
  font-size: 13px;
  font-weight: 600;
}
.muted {
  color: var(--c-ink-soft);
}
.nav {
  display: grid;
  gap: 4px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: var(--px) solid transparent;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.nav-item:hover {
  background: #eef3ff;
}
.nav-item.active {
  border-color: var(--c-border);
  background: var(--c-primary);
  color: #fff;
  font-weight: 700;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.icon {
  width: 20px;
  text-align: center;
}
.badge {
  margin-left: auto;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--c-danger);
  border: 1px solid var(--c-border);
}
.content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 20px 24px;
}
</style>
