<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { StudyOverview } from '@shared/schemas/study'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import PxBar from '@renderer/shared/components/PxBar.vue'
import StudyHome from './components/StudyHome.vue'
import ReviewSession from './components/ReviewSession.vue'
import WordList from './components/WordList.vue'

// Cửa sổ Học tập (docs/12-ui-ux-guidelines.md#cửa-sổ-học-tập-study): thanh bên + trang nội dung.
type Page = 'home' | 'review' | 'words'

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const petStore = usePetStore()

const page = ref<Page>('home')
const overview = ref<StudyOverview | null>(null)
const cleanups: Array<() => void> = []

const pages = computed<Array<{ id: Page; icon: string; label: string }>>(() => [
  { id: 'home', icon: '🏠', label: t('study.nav.home') },
  { id: 'review', icon: '🧠', label: t('study.nav.review') },
  { id: 'words', icon: '🗂', label: t('study.nav.words') }
])

async function refresh(): Promise<void> {
  try {
    overview.value = await invoke('study:overview')
  } catch (err) {
    console.warn('[study] overview failed', err)
  }
}

function go(next: Page): void {
  page.value = next
  void refresh()
}

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
      <StudyHome v-if="page === 'home'" :overview="overview" @start="go('review')" />
      <ReviewSession v-else-if="page === 'review'" @exit="go('home')" @changed="refresh" />
      <WordList v-else @changed="refresh" />
    </main>
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
