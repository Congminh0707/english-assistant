<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Hoàn thành tóm tắt: đoạn tóm tắt có các chỗ trống "___" nằm trong dòng, ngân hàng từ (đã xáo) nằm dưới. Bấm một từ để
// điền vào chỗ trống đang chọn (hoặc chỗ trống còn trống đầu tiên); bấm chỗ trống đã điền để gỡ ra. Mỗi từ dùng một lần.
// `modelValue[i]` = vị trí trong `bank` của từ điền vào chỗ trống i, hoặc null. Chỉ hiển thị — chấm ở registry
// (lessonExercises.ts), `results` là đúng/sai từng chỗ trống sau khi chấm.
const props = defineProps<{
  text: string
  /** Ngân hàng từ theo thứ tự hiển thị */
  bank: string[]
  /** Đáp án đúng từng chỗ trống (hiện khi chỗ đó sai) */
  answers: string[]
  modelValue: Array<number | null>
  results: boolean[] | null
  locked?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: Array<number | null>] }>()

const { t } = useI18n()
const parts = computed(() => props.text.split('___'))
/** Chỗ trống đang chọn để điền (mặc định: chỗ trống đầu tiên còn trống) */
const selected = ref<number | null>(null)
const target = computed(() => {
  if (selected.value !== null) return selected.value
  const i = props.modelValue.indexOf(null)
  return i >= 0 ? i : null
})

const used = (pos: number): boolean => props.modelValue.includes(pos)

function selectBlank(i: number): void {
  if (props.locked) return
  if (props.modelValue[i] !== null) {
    const next = [...props.modelValue]
    next[i] = null
    emit('update:modelValue', next)
  }
  selected.value = i
}

function pick(pos: number): void {
  const i = target.value
  if (props.locked || i === null || used(pos)) return
  const next = [...props.modelValue]
  next[i] = pos
  emit('update:modelValue', next)
  selected.value = null
}

function blankLabel(i: number): string {
  const pos = props.modelValue[i]
  const word = pos === null || pos === undefined ? null : props.bank[pos]
  if (props.results) {
    const state = props.results[i] ? t('study.lessons.itemRight') : t('study.lessons.itemWrong')
    return `${t('study.lessons.summary.blank', { n: i + 1 })}: ${word ?? ''} (${state})`
  }
  return word
    ? `${t('study.lessons.summary.blank', { n: i + 1 })}: ${word}. ${t('study.lessons.summary.clear')}`
    : t('study.lessons.summary.blank', { n: i + 1 })
}
</script>

<template>
  <div class="board">
    <p class="text">
      <template v-for="(part, i) in parts" :key="i"
        >{{ part
        }}<template v-if="i < parts.length - 1"
          ><button
            type="button"
            class="blank"
            :class="{
              filled: modelValue[i] !== null,
              active: !locked && target === i,
              right: results?.[i] === true,
              wrong: results?.[i] === false
            }"
            :disabled="locked"
            :aria-label="blankLabel(i)"
            @click="selectBlank(i)"
          >
            <UiIcon v-if="results" :name="results[i] ? 'done' : 'close'" :size="14" />
            <span class="num">{{ i + 1 }}</span>
            <span v-if="modelValue[i] !== null" class="word">{{
              bank[modelValue[i] ?? 0]
            }}</span></button
          ><span v-if="results && !results[i]" class="fix">{{ answers[i] }}</span></template
        ></template
      >
    </p>

    <p class="bank-title">{{ t('study.lessons.summary.bank') }}</p>
    <div class="bank">
      <button
        v-for="(w, pos) in bank"
        :key="pos"
        type="button"
        class="btn btn--sm"
        :class="{ used: used(pos) }"
        :disabled="locked || used(pos)"
        @click="pick(pos)"
      >
        {{ w }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  gap: var(--sp-3);
}
.text {
  margin: 0;
  font-size: var(--fs-lg);
  line-height: 2.2;
}
.blank {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  min-width: 72px;
  margin: 0 var(--sp-1);
  padding: 0 var(--sp-2);
  border: 0;
  border-bottom: 3px solid var(--c-primary);
  background: var(--c-surface-2);
  color: var(--c-ink);
  font: inherit;
  line-height: 1.6;
  vertical-align: baseline;
  cursor: pointer;
  border-radius: var(--r-sm);
}
.blank:disabled {
  cursor: default;
}
.blank:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}
.blank.active {
  background: var(--c-primary-soft);
  outline: 2px dashed var(--c-primary);
  outline-offset: 1px;
}
.blank.active:focus-visible {
  outline-style: solid;
}
.blank.filled .word {
  color: var(--c-primary);
  font-weight: 700;
}
.blank.right {
  border-bottom-color: var(--c-success);
  background: var(--c-success-soft);
  color: var(--c-success);
}
.blank.right .word {
  color: var(--c-success);
}
.blank.wrong {
  border-bottom-color: var(--c-danger);
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
.blank.wrong .word {
  color: var(--c-danger);
  text-decoration: line-through;
}
.num {
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
  font-weight: 700;
}
/* Không chừa khoảng trắng sau chỗ trống để dấu câu liền sau không bị tách */
.fix {
  color: var(--c-success);
  font-weight: 700;
}
.bank-title {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
  font-weight: 700;
}
.bank {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.bank .used {
  text-decoration: line-through;
}
</style>
