<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { WordListItem } from '@shared/schemas/study'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import { formatInterval } from '../format'

// Sổ từ đã lưu: xem trạng thái ôn của từng từ, nghe phát âm, xoá.
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()

const words = ref<WordListItem[]>([])
const search = ref('')
const loading = ref(true)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return words.value
  return words.value.filter(
    (w) => w.lemma.toLowerCase().includes(q) || (w.vi ?? '').toLowerCase().includes(q)
  )
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

    <p v-if="!loading && !words.length" class="muted">{{ t('study.words.empty') }}</p>

    <ul class="list">
      <li v-for="w in filtered" :key="w.cardId" class="row">
        <button type="button" class="say" @click="speak(w.lemma, 'us')">🔊</button>
        <div class="main">
          <div class="line">
            <strong class="lemma">{{ w.lemma }}</strong>
            <span v-if="w.level" class="level">{{ w.level.replace('_', '.') }}</span>
          </div>
          <div class="vi">{{ w.vi ?? '—' }}</div>
        </div>
        <div class="meta">
          <span class="state" :class="`s${w.state}`">{{ t(`study.words.state${w.state}`) }}</span>
          <span class="muted">{{ dueText(w) }}</span>
          <span v-if="w.lapses" class="muted">{{ t('study.words.lapses', { n: w.lapses }) }}</span>
        </div>
        <button type="button" class="remove" :title="t('study.words.remove')" @click="remove(w)">
          🗑
        </button>
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
  margin-bottom: 14px;
}
h1 {
  margin: 0;
  font-size: 20px;
}
input {
  box-sizing: border-box;
  width: 240px;
  padding: 6px 8px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  outline: none;
}
input:focus {
  box-shadow: var(--px) var(--px) 0 0 var(--c-primary);
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
  border: var(--px) solid var(--c-border);
}
.main {
  flex: 1;
  min-width: 0;
}
.line {
  display: flex;
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
  border: 1px solid var(--c-border);
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
  border: 1px solid var(--c-border);
}
.state.s0 {
  background: #e8e2d0;
}
.state.s1,
.state.s3 {
  background: var(--c-warning);
}
.state.s2 {
  color: #fff;
  background: var(--c-success);
}
.say,
.remove {
  padding: 2px 6px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  cursor: pointer;
}
.say:hover {
  background: #eef3ff;
}
.remove:hover {
  background: #fde3e3;
}
</style>
