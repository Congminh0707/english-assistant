<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bookmark, Search, SearchX } from 'lucide-vue-next'
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

/** Màu chip theo trạng thái thẻ: mới / đang học / ôn dài hạn / học lại */
const STATE_CHIP: Record<number, string> = {
  0: '',
  1: 'chip--warning',
  2: 'chip--success',
  3: 'chip--warning'
}

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

const searchInput = ref<HTMLInputElement>()

function clearFilters(): void {
  search.value = ''
  filter.value = 'all'
}

/** Phím "/" nhảy tới ô tìm, Esc trong ô tìm thì xoá chữ đang gõ */
function onKey(e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const inField = ['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
  if (e.key === '/' && !inField) {
    e.preventDefault()
    searchInput.value?.focus()
  } else if (e.key === 'Escape' && e.target === searchInput.value && search.value) {
    e.preventDefault()
    search.value = ''
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  void load()
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section class="words">
    <header class="head">
      <h1>{{ t('study.words.count', { count: words.length }) }}</h1>
      <label class="search">
        <Search :size="16" :stroke-width="2.2" />
        <input
          ref="searchInput"
          v-model="search"
          type="text"
          spellcheck="false"
          :placeholder="t('study.words.search')"
        />
        <kbd>/</kbd>
      </label>
    </header>

    <div class="tools">
      <div class="chips">
        <button
          v-for="f in FILTERS"
          :key="f"
          type="button"
          class="fchip"
          :class="{ on: filter === f }"
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

    <div v-if="!loading && !words.length" class="empty">
      <span class="empty-icon"><Bookmark :size="28" :stroke-width="2.2" /></span>
      <strong>{{ t('study.words.empty') }}</strong>
      <span class="muted">{{ t('study.words.emptyHint') }}</span>
    </div>
    <div v-else-if="!loading && !visible.length" class="empty">
      <span class="empty-icon"><SearchX :size="28" :stroke-width="2.2" /></span>
      <strong>{{ t('study.words.noMatch') }}</strong>
      <button type="button" class="btn btn--sm" @click="clearFilters">
        {{ t('study.words.clearFilters') }}
      </button>
    </div>

    <ul class="list">
      <li v-for="w in visible" :key="w.cardId" class="row" :class="{ paused: w.suspended }">
        <button type="button" class="btn btn--sm btn--icon" @click="speak(w.lemma)">
          <UiIcon name="volume" />
        </button>
        <div class="main">
          <div class="line">
            <strong class="lemma">{{ w.lemma }}</strong>
            <span v-if="w.level" class="chip chip--xp">{{ w.level.replace('_', '.') }}</span>
            <span v-if="w.isPhrase" class="chip">{{ t('study.words.phrase') }}</span>
            <span
              v-if="w.siblings"
              class="chip"
              :title="t('study.words.siblingsHint', { n: w.siblings })"
            >
              +{{ w.siblings }}
            </span>
          </div>
          <div class="vi">{{ w.vi ?? '—' }}</div>
        </div>
        <div class="meta">
          <span class="chip" :class="STATE_CHIP[w.state] ?? 'chip--warning'">{{
            t(`study.words.state${w.state}`)
          }}</span>
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
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
}
h1 {
  margin: 0;
  font-size: var(--fs-2xl);
}
.search {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 240px;
  min-height: var(--btn-h);
  padding: 0 var(--sp-3);
  border: 1px solid var(--c-line);
  border-radius: var(--r-pill);
  background: var(--c-surface);
  color: var(--c-ink-soft);
}
.search:focus-within {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px var(--c-primary-soft);
}
.search input {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
  outline: none;
}
kbd {
  font: inherit;
  font-size: var(--fs-xs);
  font-weight: 600;
}
.tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
  flex-wrap: nowrap;
}
.chips {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.fchip {
  min-height: 28px;
  padding: 0 var(--sp-2);
  border: 0;
  border-radius: var(--r-pill);
  background: var(--c-surface-2);
  color: var(--c-ink);
  font: inherit;
  font-size: var(--fs-sm);
  font-weight: 700;
  cursor: pointer;
}
.fchip:hover {
  background: var(--c-line);
}
.fchip.on {
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.fchip .n {
  opacity: 0.7;
}
.sort {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-sm);
  color: var(--c-ink-soft);
}
.sort {
  flex: none;
}
.sort select {
  min-height: 28px;
  padding: 0 var(--sp-2);
  border: 0;
  background: transparent;
  border-radius: var(--r-pill);
  font-weight: 700;
}
.muted {
  color: var(--c-ink-soft);
}
.empty {
  display: grid;
  justify-items: center;
  gap: var(--sp-2);
  padding: var(--sp-7) var(--sp-4);
  text-align: center;
}
.empty strong {
  font-size: var(--fs-lg);
}
.empty-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: var(--r-pill);
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.list {
  display: grid;
  gap: var(--sp-3);
  margin: 0;
  padding: 0;
  list-style: none;
}
.row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3);
  background: var(--c-surface);
  border: 2px solid var(--c-line);
  border-radius: var(--r-lg);
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
  align-items: center;
  gap: var(--sp-2);
}
.lemma {
  font-size: var(--fs-lg);
}
.vi {
  overflow: hidden;
  font-size: var(--fs-sm);
  color: var(--c-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta {
  display: grid;
  gap: 2px;
  justify-items: end;
  font-size: var(--fs-sm);
}
.actions {
  display: flex;
  gap: var(--sp-1);
}
</style>
