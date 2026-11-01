<script setup lang="ts">
import PicText from '@renderer/shared/components/PicText.vue'

// Danh sách lựa chọn có đánh số (dùng cho trắc nghiệm, nghe chọn, đúng/sai, điền từ có lựa chọn, chọn hình, điền từ/nghe chọn
// của luyện tập). Chế độ `pictures`: mỗi lựa chọn là một hình thẻ từ lớn (id hình hoặc emoji).
const props = withDefaults(
  defineProps<{
    choices: string[]
    modelValue: number | null
    /** Đã chấm: không chọn được nữa */
    locked?: boolean
    pictures?: boolean
    /** Một cột (câu dài, vd bản dịch tiếng Việt) */
    single?: boolean
    /** Chỉ số đáp án đúng; có giá trị khi đã chấm để tô xanh đáp án đúng, đỏ lựa chọn sai */
    correct?: number | null
  }>(),
  { locked: false, pictures: false, single: false, correct: null }
)
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function pick(i: number): void {
  if (!props.locked) emit('update:modelValue', i)
}
</script>

<template>
  <div class="choices" :class="{ one: single }">
    <button
      v-for="(c, i) in choices"
      :key="i"
      type="button"
      class="choice"
      :class="{
        picked: modelValue === i && !locked,
        right: locked && correct === i,
        wrong: locked && modelValue === i && correct !== null && correct !== i,
        pic: pictures
      }"
      :disabled="locked"
      @click="pick(i)"
    >
      <span class="num">{{ i + 1 }}</span>
      <PicText v-if="pictures" :text="c" :size="72" ids />
      <template v-else>{{ c }}</template>
    </button>
  </div>
</template>

<style scoped>
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}
.choices.one {
  grid-template-columns: 1fr;
}
.choice {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3);
  border: 2px solid var(--c-line);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: var(--r-md);
}
.choice:disabled {
  cursor: default;
}
.choice.picked {
  border-color: var(--c-primary);
  background: var(--c-primary-soft);
}
.choice:hover:not(:disabled):not(.picked) {
  background: var(--c-surface-2);
}
.choice.right {
  border-color: var(--c-success);
  background: var(--c-success-soft);
}
.choice.wrong {
  border-color: var(--c-danger);
  background: var(--c-danger-soft);
}
.choice.pic {
  min-width: 112px;
  padding: var(--sp-3);
}
.num {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: var(--r-sm);
  background: var(--c-surface-2);
  font-size: var(--fs-xs);
  font-weight: 700;
}
.choice.picked .num {
  background: var(--c-primary);
  color: var(--c-on-primary);
}
.choice.right .num {
  background: var(--c-success);
  color: var(--c-on-primary);
}
.choice.wrong .num {
  background: var(--c-danger);
  color: var(--c-on-primary);
}
</style>
