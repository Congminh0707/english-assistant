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
  gap: 8px;
  min-height: 42px;
  padding: 8px;
}
.answer-line {
  border-bottom: 2px dashed var(--c-ink-soft);
}
.muted {
  color: var(--c-ink-soft);
}
.token {
  padding: 6px 12px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
  border-radius: var(--r-md);
}
.token.placed {
  background: var(--c-primary);
  color: #fff;
}
.token:disabled:not(.placed) {
  opacity: 0.3;
  cursor: default;
}
</style>
