<script setup lang="ts">
// Sắp xếp câu: bấm các từ ở khay để đặt vào dòng đáp án, bấm lại từ đã đặt để bỏ ra. `modelValue` là thứ tự chỉ số
// của các từ (trong `tokens`) người dùng đã chọn.
const props = defineProps<{ tokens: string[]; modelValue: number[]; locked?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>()

function pick(i: number): void {
  if (props.locked || props.modelValue.includes(i)) return
  emit('update:modelValue', [...props.modelValue, i])
}

function unpick(pos: number): void {
  if (props.locked) return
  emit(
    'update:modelValue',
    props.modelValue.filter((_, p) => p !== pos)
  )
}
</script>

<template>
  <div>
    <div class="answer-line">
      <button
        v-for="(tokenIdx, pos) in modelValue"
        :key="pos"
        type="button"
        class="token placed"
        :disabled="locked"
        @click="unpick(pos)"
      >
        {{ tokens[tokenIdx] }}
      </button>
      <span v-if="!modelValue.length" class="muted">…</span>
    </div>
    <div class="pool">
      <button
        v-for="(tok, i) in tokens"
        :key="i"
        type="button"
        class="token"
        :disabled="modelValue.includes(i) || locked"
        @click="pick(i)"
      >
        {{ tok }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.answer-line,
.pool {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  min-height: 48px;
  padding: var(--sp-2);
}
.answer-line {
  border-bottom: 2px dashed var(--c-line);
}
.muted {
  color: var(--c-ink-soft);
}
.token {
  padding: var(--sp-2) var(--sp-3);
  border: 2px solid var(--c-line);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-size: var(--fs-lg);
  cursor: pointer;
  border-radius: var(--r-md);
}
.token.placed {
  background: var(--c-primary);
  color: var(--c-on-primary);
}
.token:disabled:not(.placed) {
  opacity: 0.3;
  cursor: default;
}
</style>
