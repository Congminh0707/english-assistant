<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from 'lucide-vue-next'
import type { DictEntry, LookupResult } from '@shared/schemas/dictionary'
import { invoke } from '@renderer/shared/ipc'

// Tìm nhanh Ctrl K: tra từ điển qua IPC có sẵn, hiện vài mục; Esc đóng, Enter mở trang Từ vựng.
const emit = defineEmits<{ close: []; words: [] }>()
const { t } = useI18n()
const q = ref('')
const result = ref<LookupResult | null>(null)
const input = ref<HTMLInputElement | null>(null)
let timer = 0

watch(q, (text) => {
  window.clearTimeout(timer)
  if (!text.trim()) {
    result.value = null
    return
  }
  timer = window.setTimeout(async () => {
    try {
      result.value = await invoke('dictionary:lookup', { text: text.trim() })
    } catch {
      result.value = null
    }
  }, 150)
})

function gloss(e: DictEntry): string {
  return e.vi.slice(0, 3).join('; ') || e.senses[0]?.en || ''
}
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}
onMounted(() => void nextTick(() => input.value?.focus()))
</script>

<template>
  <div class="backdrop" @mousedown.self="emit('close')" @keydown="onKey">
    <div class="box" role="dialog" aria-modal="true" :aria-label="t('study.search.title')">
      <label class="field">
        <Search :size="18" />
        <input
          ref="input"
          v-model="q"
          type="text"
          :placeholder="t('study.search.placeholder')"
          @keydown.enter="emit('words')"
        />
        <kbd>Esc</kbd>
      </label>
      <ul v-if="result?.entries.length" class="list">
        <li v-for="e in result.entries.slice(0, 6)" :key="e.id" class="item">
          <strong>{{ e.lemma }}</strong>
          <span v-if="e.ipaUs" class="ipa">/{{ e.ipaUs }}/</span>
          <span class="chip">{{ e.level }}</span>
          <span class="vi">{{ gloss(e) }}</span>
        </li>
      </ul>
      <p v-else-if="result?.packMissing" class="hint">{{ t('study.home.packMissing') }}</p>
      <p v-else-if="result" class="hint">
        {{ t('study.search.none') }}
        <template v-if="result.suggestions.length">
          {{ t('study.search.suggest', { words: result.suggestions.slice(0, 3).join(', ') }) }}
        </template>
      </p>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding-top: 12vh;
  background: rgb(0 0 0 / 35%);
}
.box {
  align-self: flex-start;
  width: min(560px, calc(100% - 2 * var(--sp-4)));
  overflow: hidden;
  border: 2px solid var(--c-line);
  border-radius: var(--r-lg);
  background: var(--c-surface);
  box-shadow: var(--shadow-md);
}
.field {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  color: var(--c-ink-soft);
}
.field input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--c-ink);
  font: inherit;
  font-size: var(--fs-lg);
}
kbd {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--c-surface-2);
  font: 500 var(--fs-xs) var(--font-ui);
}
.list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--c-line);
}
.item {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-4);
}
.ipa,
.vi {
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.hint {
  margin: 0;
  padding: var(--sp-3) var(--sp-4);
  border-top: 1px solid var(--c-line);
  color: var(--c-ink-soft);
}
</style>
