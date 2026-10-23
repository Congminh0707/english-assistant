<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { WordListItem } from '@shared/schemas/study'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import { formatInterval } from '../format'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Sổ từ đã lưu: lọc/sắp xếp theo trạng thái ôn, nghe phát âm, tạm dừng, đặt lại tiến độ, xoá.
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()

type Filter = 'all' | 'new' | 'learning' | 'review' | 'relearning' | 'suspended' | 'forgetful'
type Sort = 'saved' | 'due' | 'forgetful' | 'alpha'

/** Từ quên từ bấy nhiêu lần trở lên được coi là "hay quên" */
const FORGETFUL_LAPSES = 3

const words = ref<WordListItem[]>([])
const search = ref('')
const filter = ref<Filter>('all')
const sort = ref<Sort>('saved')
const loading = ref(true)

const FILTERS: Filter[] = [
  'all',
  'new',
  'learning',
  'review',
  'relearning',
  'suspended',
  'forgetful'
]
const SORTS: Sort[] = ['saved', 'due', 'forgetful', 'alpha']

const matchesFilter = (w: WordListItem): boolean => {
  switch (filter.value) {
    case 'new':
      return w.state === 0 && !w.suspended
    case 'learning':
      return w.state === 1 && !w.suspended
    case 'review':
      return w.state === 2 && !w.suspended
    case 'relearning':
      return w.state === 3 && !w.suspended
    case 'suspended':
      return w.suspended
    case 'forgetful':
      return w.lapses >= FORGETFUL_LAPSES
    default:
      return true
  }
}

const counts = computed(() => {
  const out: Record<Filter, number> = {
    all: 0,
    new: 0,
    learning: 0,
    review: 0,
    relearning: 0,
    suspended: 0,
    forgetful: 0
  }
  for (const w of words.value) {
    out.all++
    if (w.suspended) out.suspended++
    else if (w.state === 0) out.new++
    else if (w.state === 1) out.learning++
    else if (w.state === 2) out.review++
    else out.relearning++
    if (w.lapses >= FORGETFUL_LAPSES) out.forgetful++
  }
  return out
})

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = words.value.filter(
    (w) =>
      matchesFilter(w) &&
      (!q || w.lemma.toLowerCase().includes(q) || (w.vi ?? '').toLowerCase().includes(q))
  )
  const sorted = [...list]
  switch (sort.value) {
    case 'due':
      sorted.sort((a, b) => a.due - b.due)
      break
    case 'forgetful':
      sorted.sort((a, b) => b.lapses - a.lapses || b.savedAt - a.savedAt)
      break
    case 'alpha':
      sorted.sort((a, b) => a.lemma.localeCompare(b.lemma))
      break
    default:
      sorted.sort((a, b) => b.savedAt - a.savedAt)
  }
  return sorted
})

async function load(): Promise<void> {
  try {
    words.value = await invoke('vocab:list')
  } catch (err) {
    console.warn('[study] vocab:list failed', err)
  } finally {
    loading.value = false
  }
}

function dueText(w: WordListItem): string {
  if (w.suspended) return t('study.words.suspended')
  const days = (w.due - Date.now()) / 86_400_000
  return days <= 0
    ? t('study.words.dueNow')
    : t('study.words.dueIn', { time: formatInterval(days, t) })
}

async function remove(w: WordListItem): Promise<void> {
  if (!window.confirm(t('study.words.confirmRemove', { word: w.lemma }))) return
  try {
    await invoke('vocab:remove', { contentId: w.contentId })
    words.value = words.value.filter((x) => x.contentId !== w.contentId)
    emit('changed')
  } catch (err) {
    console.warn('[study] vocab:remove failed', err)
  }
}

async function toggleSuspend(w: WordListItem): Promise<void> {
  try {
    await invoke('vocab:suspend', { contentId: w.contentId, suspended: !w.suspended })
    await load()
    emit('changed')
  } catch (err) {
    console.warn('[study] vocab:suspend failed', err)
  }
}

async function reset(w: WordListItem): Promise<void> {
  if (!window.confirm(t('study.words.confirmReset', { word: w.lemma }))) return
  try {
    await invoke('vocab:reset', { contentId: w.contentId })
    await load()
    emit('changed')
  } catch (err) {
    console.warn('[study] vocab:reset failed', err)
  }
}

onMounted(load)
</script>

<template>
  <section class="words">
    <header class="head">
      <h1>{{ t('study.words.count', { count: words.length }) }}</h1>
      <input
        v-model="search"
        type="search"
        spellcheck="false"
        :placeholder="t('study.words.search')"
      />
    </header>

    <div class="tools">
      <div class="chips">
        <button
          v-for="f in FILTERS"
          :key="f"
          type="button"
          class="btn btn--sm btn--pill"
          :class="{ 'btn--primary': filter === f }"
          @click="filter = f"
        >
          {{ t(`study.words.filter.${f}`) }} <span class="n">{{ counts[f] }}</span>
        </button>
      </div>
      <label class="sort">
        {{ t('study.words.sortBy') }}
        <select v-model="sort">
          <option v-for="s in SORTS" :key="s" :value="s">{{ t(`study.words.sort.${s}`) }}</option>
        </select>
      </label>
    </div>

    <p v-if="!loading && !words.length" class="muted">{{ t('study.words.empty') }}</p>
    <p v-else-if="!loading && !visible.length" class="muted">{{ t('study.words.noMatch') }}</p>

    <ul class="list">
      <li v-for="w in visible" :key="w.cardId" class="row" :class="{ paused: w.suspended }">
        <button type="button" class="btn btn--sm btn--icon" @click="speak(w.lemma)">
          <UiIcon name="volume" />
        </button>
        <div class="main">
          <div class="line">
            <strong class="lemma">{{ w.lemma }}</strong>
            <span v-if="w.level" class="level">{{ w.level.replace('_', '.') }}</span>
            <span v-if="w.isPhrase" class="badge">{{ t('study.words.phrase') }}</span>
            <span
              v-if="w.siblings"
              class="badge"
              :title="t('study.words.siblingsHint', { n: w.siblings })"
            >
              ＋{{ w.siblings }}
            </span>
          </div>
          <div class="vi">{{ w.vi ?? '—' }}</div>
        </div>
        <div class="meta">
          <span class="state" :class="`s${w.state}`">{{ t(`study.words.state${w.state}`) }}</span>
          <span class="muted">{{ dueText(w) }}</span>
          <span v-if="w.lapses" class="muted">{{ t('study.words.lapses', { n: w.lapses }) }}</span>
        </div>
        <div class="actions">
          <button
            type="button"
            class="btn btn--sm btn--icon btn--ghost"
            :title="w.suspended ? t('study.words.resume') : t('study.words.pause')"
            @click="toggleSuspend(w)"
          >
            <UiIcon :name="w.suspended ? 'play' : 'pause'" />
          </button>
          <button
            type="button"
            class="btn btn--sm btn--ghost"
            :title="t('study.words.reset')"
            @click="reset(w)"
          >
            <UiIcon name="reset" />
          </button>
          <button
            type="button"
            class="btn btn--sm btn--icon btn--ghost"
            :title="t('study.words.remove')"
            @click="remove(w)"
          >
            <UiIcon name="trash" />
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
h1 {
  margin: 0;
  font-size: 20px;
}
input {
  box-sizing: border-box;
  width: 240px;
  padding: 6px 8px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  font: inherit;
  outline: none;
  border-radius: var(--r-md);
}
input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px var(--c-primary-soft);
}
.tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sort {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.sort select {
  padding: 2px 6px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  font: inherit;
  border-radius: var(--r-md);
}
.muted {
  color: var(--c-ink-soft);
}
.list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--c-surface);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
}
.row.paused {
  opacity: 0.6;
}
.main {
  flex: 1;
  min-width: 0;
}
.line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}
.lemma {
  font-size: 16px;
}
.level {
  padding: 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--c-xp);
  border: 1px solid var(--c-line);
  border-radius: var(--r-pill);
}
.badge {
  padding: 0 4px;
  font-size: 11px;
  color: var(--c-ink);
  background: var(--c-surface-2);
  border: 1px solid var(--c-line);
  border-radius: var(--r-pill);
}
.vi {
  overflow: hidden;
  font-size: 13px;
  color: var(--c-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta {
  display: grid;
  gap: 2px;
  justify-items: end;
  font-size: 12px;
}
.state {
  padding: 0 6px;
  font-weight: 700;
  border: 1px solid var(--c-line);
  border-radius: var(--r-pill);
}
.state.s0 {
  background: var(--c-surface-2);
}
.state.s1,
.state.s3 {
  background: var(--c-warning);
}
.state.s2 {
  color: #fff;
  background: var(--c-success);
}
.actions {
  display: flex;
  gap: 4px;
}
</style>
