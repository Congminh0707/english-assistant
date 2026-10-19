<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { cefrLabel } from '@shared/placement'
import type { Phrasebook } from '@shared/schemas/phrasebook'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PxPanel from '@renderer/shared/components/PxPanel.vue'

// Mẫu câu giao tiếp theo tình huống: tìm kiếm, nghe (TTS), bấm để sao chép.
const { t } = useI18n()
const { speak } = useTts()

const book = ref<Phrasebook | null>(null)
const category = ref<string>('all')
const query = ref('')
const toast = ref('')
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

async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toast.value = t('study.phrasebook.copied')
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => (toast.value = ''), 1500)
  } catch {
    // Không có quyền clipboard: bỏ qua, người dùng vẫn nghe và đọc được
  }
}

onMounted(async () => {
  book.value = await invoke('phrasebook:list')
})
</script>

<template>
  <section class="book">
    <h1>{{ t('study.phrasebook.title') }}</h1>
    <p class="muted">{{ t('study.phrasebook.intro') }}</p>

    <div class="filters">
      <input
        v-model="query"
        type="search"
        spellcheck="false"
        :placeholder="t('study.phrasebook.search')"
      />
      <div class="chips">
        <button
          type="button"
          class="chip"
          :class="{ on: category === 'all' }"
          @click="category = 'all'"
        >
          {{ t('study.phrasebook.all') }}
        </button>
        <button
          v-for="c in book?.categories ?? []"
          :key="c.id"
          type="button"
          class="chip"
          :class="{ on: category === c.id }"
          @click="category = c.id"
        >
          {{ c.icon }} {{ c.title }}
        </button>
      </div>
    </div>

    <p v-if="book && !visible.length" class="muted">{{ t('study.phrasebook.empty') }}</p>

    <PxPanel v-for="c in visible" :key="c.id" class="cat">
      <h2>{{ c.icon }} {{ c.title }}</h2>
      <ul class="phrases">
        <li v-for="(p, i) in c.phrases" :key="i">
          <button type="button" class="say" :title="t('study.lessons.listen')" @click="speak(p.en)">
            🔊
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
          <span v-if="p.level" class="tag">{{ cefrLabel(p.level) }}</span>
        </li>
      </ul>
    </PxPanel>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </section>
</template>

<style scoped>
.book {
  display: grid;
  gap: 12px;
  max-width: 760px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: 22px;
}
h2 {
  margin: 0 0 8px;
  font-size: 16px;
  color: var(--c-xp);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
}
.filters {
  display: grid;
  gap: 8px;
}
input[type='search'] {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  outline: none;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 3px 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.chip.on {
  background: var(--c-primary);
  color: #fff;
}
.cat {
  padding: 14px 16px;
}
.phrases {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.phrases li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.say {
  padding: 2px 6px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  cursor: pointer;
}
.text {
  display: grid;
  flex: 1;
  gap: 1px;
  padding: 2px 4px;
  border: none;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.text:hover {
  background: #eef3ff;
}
.en {
  font-weight: 700;
}
.vi {
  color: var(--c-ink-soft);
  font-size: 14px;
}
.note {
  font-size: 12px;
  color: var(--c-ink-soft);
  font-style: italic;
}
.tag {
  padding: 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--c-xp);
  border: 1px solid var(--c-border);
}
.toast {
  position: fixed;
  right: 20px;
  bottom: 20px;
  padding: 6px 12px;
  background: var(--c-ink);
  color: #fff;
  font-size: 13px;
}
</style>
