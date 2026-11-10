<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GrammarExplain } from '@shared/schemas/ai'
import { invoke, IpcError } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Giải thích ngữ pháp bằng AI (key Claude của người dùng, docs/11 §5). Cha đặt :key theo câu để mỗi lần tra là trạng thái mới.
const props = defineProps<{ sentence: string }>()

const { t } = useI18n()
const { speak } = useTts()

const phase = ref<'idle' | 'loading' | 'done' | 'error'>('idle')
const result = ref<GrammarExplain | null>(null)
const errorKey = ref('')
let seq = 0

async function explain(): Promise<void> {
  const mine = ++seq
  phase.value = 'loading'
  try {
    const res = await invoke('ai:explain', { sentence: props.sentence })
    if (mine !== seq) return
    result.value = res
    phase.value = 'done'
  } catch (err) {
    if (mine !== seq) return
    errorKey.value = err instanceof IpcError ? err.info.messageKey : 'errors.aiFailed'
    phase.value = 'error'
  }
}
</script>

<template>
  <div class="explain-wrap">
    <button
      v-if="phase === 'idle' || phase === 'error'"
      type="button"
      class="btn btn--xs btn--pill"
      @click="explain"
    >
      {{ t('popup.explain') }}
    </button>
    <p v-if="phase === 'loading'" class="muted">{{ t('popup.explaining') }}</p>
    <p v-else-if="phase === 'error'" class="tr-error">{{ t(errorKey) }}</p>
    <div v-else-if="phase === 'done' && result" class="explain">
      <div class="ex-head">
        <strong>{{ t('popup.explainTitle') }}</strong>
        <span class="chip chip--primary ai" :title="t('popup.aiExplainHint')">{{
          t('popup.aiBadge')
        }}</span>
      </div>
      <p class="ex-text">{{ result.explanation_vi }}</p>
      <span v-if="result.pattern" class="chip">{{ result.pattern }}</span>
      <div v-if="result.examples.length" class="examples">
        <div v-for="(ex, i) in result.examples" :key="i" class="example">
          <button
            type="button"
            class="btn btn--xs btn--icon"
            :title="t('popup.listen')"
            :aria-label="t('popup.listen')"
            @click="speak(ex.en)"
          >
            <UiIcon name="volume" :size="14" />
          </button>
          <div>
            <div>{{ ex.en }}</div>
            <div v-if="ex.vi" class="muted">{{ ex.vi }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explain-wrap {
  display: grid;
  gap: var(--sp-2);
  justify-items: start;
  margin: var(--sp-2) 0;
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
}
.tr-error {
  margin: 0;
  font-size: var(--fs-xs);
  color: var(--c-danger);
}
.explain {
  display: grid;
  gap: var(--sp-2);
  justify-items: start;
  width: 100%;
  box-sizing: border-box;
  padding: var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-surface-2);
}
.ex-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.ai {
  cursor: help;
}
.ex-text {
  margin: 0;
}
.examples {
  display: grid;
  gap: var(--sp-2);
  font-size: var(--fs-xs);
}
.example {
  display: flex;
  gap: var(--sp-2);
}
.example .btn {
  align-self: flex-start;
}
</style>
