<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, SearchX } from 'lucide-vue-next'
import { cefrLabel } from '@shared/placement'
import type { Phrasebook } from '@shared/schemas/phrasebook'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Mẫu câu giao tiếp theo tình huống: tìm kiếm, nghe (TTS), bấm để sao chép.
const { t } = useI18n()
const { speak } = useTts()

const book = ref<Phrasebook | null>(null)
const category = ref<string>('all')
const query = ref('')
const toast = ref('')
const searchInput = ref<HTMLInputElement>()
/** Id các mẫu câu đã có trong sổ thẻ */
const savedIds = ref<Set<string>>(new Set())
let toastTimer = 0

const norm = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const visible = computed(() => {
  const q = norm(query.value.trim())
  return (book.value?.categories ?? [])
    .filter((c) => category.value === 'all' || c.id === category.value)
    .map((c) => ({
      ...c,
      phrases: c.phrases.filter((p) => !q || norm(p.en).includes(q) || norm(p.vi).includes(q))
    }))
    .filter((c) => c.phrases.length)
})

function flash(message: string): void {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 1500)
}

async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    flash(t('study.phrasebook.copied'))
  } catch {
    // Không có quyền clipboard: bỏ qua, người dùng vẫn nghe và đọc được
  }
}

async function savePhrase(id: string): Promise<void> {
  try {
    await invoke('vocab:save-phrase', { contentId: id })
    savedIds.value = new Set([...savedIds.value, id])
    flash(t('study.phrasebook.savedToast'))
  } catch (err) {
    console.warn('[phrasebook] save failed', err)
  }
}

/** Phím "/" nhảy tới ô tìm, Esc trong ô tìm thì xoá chữ đang gõ */
function onKey(e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const inField = ['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
  if (e.key === '/' && !inField) {
    e.preventDefault()
    searchInput.value?.focus()
  } else if (e.key === 'Escape' && e.target === searchInput.value && query.value) {
    e.preventDefault()
    query.value = ''
  }
}
onUnmounted(() => window.removeEventListener('keydown', onKey))

onMounted(async () => {
  window.addEventListener('keydown', onKey)
  book.value = await invoke('phrasebook:list')
  try {
    const words = await invoke('vocab:list')
    savedIds.value = new Set(words.filter((w) => w.isPhrase).map((w) => w.contentId))
  } catch (err) {
    console.warn('[phrasebook] vocab:list failed', err)
  }
})
</script>

<template>
  <section class="book">
    <h1>{{ t('study.phrasebook.title') }}</h1>
    <p class="muted">{{ t('study.phrasebook.intro') }}</p>

    <div class="filters">
      <label class="search">
        <Search :size="16" :stroke-width="2.2" />
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          spellcheck="false"
          :placeholder="t('study.phrasebook.search')"
        />
        <kbd>/</kbd>
      </label>
      <div class="chips">
        <button
          type="button"
          class="fchip"
          :class="{ on: category === 'all' }"
          @click="category = 'all'"
        >
          {{ t('study.phrasebook.all') }}
        </button>
        <button
          v-for="c in book?.categories ?? []"
          :key="c.id"
          type="button"
          class="fchip"
          :class="{ on: category === c.id }"
          @click="category = c.id"
        >
          {{ c.title }}
        </button>
      </div>
    </div>

    <div v-if="book && !visible.length" class="empty">
      <span class="empty-icon"><SearchX :size="28" :stroke-width="2.2" /></span>
      <strong>{{ t('study.phrasebook.empty') }}</strong>
      <button type="button" class="btn btn--sm" @click=";((query = ''), (category = 'all'))">
        {{ t('study.words.clearFilters') }}
      </button>
    </div>

    <div v-for="c in visible" :key="c.id" class="card cat">
      <h2>{{ c.title }}</h2>
      <ul class="phrases">
        <li v-for="(p, i) in c.phrases" :key="i">
          <button
            type="button"
            class="btn btn--sm btn--icon"
            :title="t('study.lessons.listen')"
            @click="speak(p.en)"
          >
            <UiIcon name="volume" />
          </button>
          <button
            type="button"
            class="text"
            :title="t('study.phrasebook.copy')"
            @click="copy(p.en)"
          >
            <span class="en">{{ p.en }}</span>
            <span class="vi">{{ p.vi }}</span>
            <span v-if="p.note" class="note">{{ p.note }}</span>
          </button>
          <span v-if="p.level" class="chip chip--xp">{{ cefrLabel(p.level) }}</span>
          <button
            type="button"
            class="btn btn--sm btn--icon"
            :disabled="savedIds.has(p.id)"
            :title="t('study.phrasebook.saveHint')"
            @click="savePhrase(p.id)"
          >
            <UiIcon :name="savedIds.has(p.id) ? 'saved' : 'save'" />
          </button>
        </li>
      </ul>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </section>
</template>

<style scoped>
.book {
  display: grid;
  gap: var(--sp-3);
  max-width: 880px;
}
h1 {
  margin: 0;
  font-size: var(--fs-2xl);
}
h2 {
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-xl);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
}
.filters {
  display: grid;
  gap: var(--sp-3);
}
.search {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
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
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.fchip {
  min-height: 28px;
  padding: 0 var(--sp-3);
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
.cat {
  padding: var(--sp-4);
}
.phrases {
  display: grid;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.phrases li {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.text {
  display: grid;
  flex: 1;
  gap: 1px;
  padding: var(--sp-1) var(--sp-2);
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: var(--r-sm);
}
.text:hover {
  background: var(--c-primary-soft);
}
.en {
  font-weight: 700;
}
.vi {
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.note {
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
  font-style: italic;
}
.toast {
  position: fixed;
  right: var(--sp-5);
  bottom: var(--sp-5);
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-4);
  background: var(--c-ink);
  color: var(--c-surface);
  font-size: var(--fs-sm);
  font-weight: 700;
  border-radius: var(--r-pill);
}
</style>
