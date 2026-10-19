<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
import SettingsPage from './components/SettingsPage.vue'
import Onboarding from './components/Onboarding.vue'

// Cửa sổ Học tập (docs/12-ui-ux-guidelines.md#cửa-sổ-học-tập-study): thanh bên + trang nội dung.
type Page = 'home' | 'review' | 'practice' | 'words' | 'shop' | 'placement' | 'settings'

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const petStore = usePetStore()

const page = ref<Page>('home')
const overview = ref<StudyOverview | null>(null)
const missions = ref<MissionsState | null>(null)
/** Bài kiểm tra mở từ màn hình chào thì tự bắt đầu ngay */
const autostartTest = ref(false)
const loaded = ref(false)
const cleanups: Array<() => void> = []

const pages = computed<Array<{ id: Page; icon: string; label: string }>>(() => [
  { id: 'home', icon: '🏠', label: t('study.nav.home') },
  { id: 'review', icon: '🧠', label: t('study.nav.review') },
  { id: 'practice', icon: '🎯', label: t('study.nav.practice') },
  { id: 'words', icon: '🗂', label: t('study.nav.words') },
  { id: 'shop', icon: '🛍', label: t('study.nav.shop') },
  { id: 'placement', icon: '🧪', label: t('study.nav.placement') },
  { id: 'settings', icon: '⚙', label: t('study.nav.settings') }
])

async function refresh(): Promise<void> {
  try {
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
  cleanups.push(settingsStore.listen(), petStore.listen())
  await Promise.all([settingsStore.load(), petStore.load(), refresh()])
  loaded.value = true
})
onUnmounted(() => {
  window.removeEventListener('focus', onFocus)
  cleanups.forEach((fn) => fn())
})
</script>

<template>
  <div class="study">
    <aside class="side">
      <div class="pet">
        <div class="pet-name">{{ petStore.pet?.name ?? '…' }}</div>
        <template v-if="petStore.pet">
          <div class="pet-level">{{ t('stats.level', { level: petStore.pet.level }) }}</div>
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

    <main class="content">
      <StudyHome
        v-if="page === 'home'"
        :overview="overview"
        :missions="missions"
        @start="go('review')"
        @goal="setGoal"
      />
      <ReviewSession v-else-if="page === 'review'" @exit="go('home')" @changed="refresh" />
      <PracticeSession v-else-if="page === 'practice'" @changed="refresh" />
      <WordList v-else-if="page === 'words'" @changed="refresh" />
      <ShopPage v-else-if="page === 'shop'" @changed="refresh" />
      <PlacementTest
        v-else-if="page === 'placement'"
        :autostart="autostartTest"
        @done="go('home')"
      />
      <SettingsPage v-else @retest="go('placement')" @changed="refresh" />
    </main>

    <Onboarding v-if="loaded && !settingsStore.settings['app.onboarded']" @done="onboarded" />
  </div>
</template>

<style scoped>
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
