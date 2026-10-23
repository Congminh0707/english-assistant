<script setup lang="ts">
import PicText from '@renderer/shared/components/PicText.vue'

// Danh sách lựa chọn có đánh số (dùng cho trắc nghiệm, nghe chọn, đúng/sai, điền từ có lựa chọn, chọn hình, điền từ/nghe chọn
// của luyện tập). Chế độ `pictures`: mỗi lựa chọn là một hình pixel lớn (id hình hoặc emoji).
const props = withDefaults(
  defineProps<{
    choices: string[]
    modelValue: number | null
    /** Đã chấm: không chọn được nữa */
    locked?: boolean
    pictures?: boolean
    /** Một cột (câu dài, vd bản dịch tiếng Việt) */
    single?: boolean
  }>(),
  { locked: false, pictures: false, single: false }
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
      :class="{ picked: modelValue === i && !locked, pic: pictures }"
      :disabled="locked"
      @click="pick(i)"
    >
      <span class="num">{{ i + 1 }}</span>
      <PicText v-if="pictures" :text="c" :size="72" />
      <template v-else>{{ c }}</template>
    </button>
  </div>
</template>

<style scoped>
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.choices.one {
  grid-template-columns: 1fr;
}
.choice {
  padding: 10px 12px;
  border: 1px solid var(--c-line);
  background: var(--c-bg);
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: var(--r-md);
}
.choice.picked {
  background: var(--c-primary);
  color: #fff;
}
.choice:hover:not(:disabled):not(.picked) {
  background: var(--c-primary-soft);
}
.choice.pic {
  min-width: 112px;
  padding: 10px;
}
.num {
  display: inline-block;
  width: 18px;
  font-weight: 700;
  opacity: 0.6;
}
</style>
