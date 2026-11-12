<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Ghép tiêu đề với đoạn: mỗi hàng là một đoạn của bài đọc ("Đoạn N" + vài chữ đầu, mở được cả đoạn), danh sách tiêu đề
// (đã xáo, có tiêu đề thừa) nằm dưới. Chọn một hàng rồi bấm một tiêu đề để gán; mỗi tiêu đề chỉ gán cho một đoạn.
// `modelValue[i]` = vị trí (trong `headings` đang hiển thị) của tiêu đề gán cho đoạn i, hoặc null. Chỉ hiển thị — chấm ở
// registry (lessonExercises.ts), `results` là đúng/sai từng đoạn sau khi chấm.
const props = defineProps<{
  /** Đoạn văn tiếng Anh của bài (block passage đầu tiên) */
  paragraphs: string[]
  /** Tiêu đề theo thứ tự hiển thị */
  headings: string[]
  /** Tiêu đề đúng của từng đoạn (hiện khi đoạn đó sai) */
  answers: string[]
  modelValue: Array<number | null>
  results: boolean[] | null
  locked?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: Array<number | null>] }>()

const { t } = useI18n()
/** Đoạn đang chọn để gán tiêu đề (mặc định: đoạn trống đầu tiên) */
const active = ref<number | null>(null)
const expanded = ref<boolean[]>([])

const EXCERPT_WORDS = 7
const excerpts = computed(() =>
  props.paragraphs.map((p) => {
    const words = p.trim().split(/\s+/)
    return words.length > EXCERPT_WORDS ? `${words.slice(0, EXCERPT_WORDS).join(' ')}…` : p
  })
)

const firstEmpty = (slots: Array<number | null>): number | null => {
  const i = slots.indexOf(null)
  return i >= 0 ? i : null
}
const target = computed(() => active.value ?? firstEmpty(props.modelValue))

/** Đoạn đang dùng tiêu đề ở vị trí `pos` (null nếu chưa dùng) */
const usedBy = (pos: number): number | null => {
  const i = props.modelValue.indexOf(pos)
  return i >= 0 ? i : null
}

function selectRow(i: number): void {
  if (props.locked) return
  // Bấm đoạn đã có tiêu đề → gỡ ra để chọn lại
  if (props.modelValue[i] !== null) {
    const next = [...props.modelValue]
    next[i] = null
    emit('update:modelValue', next)
  }
  active.value = i
}

function pick(pos: number): void {
  const i = target.value
  if (props.locked || i === null) return
  // Mỗi tiêu đề chỉ gán cho một đoạn: gỡ khỏi đoạn cũ nếu có
  const next = props.modelValue.map((m) => (m === pos ? null : m))
  next[i] = pos
  emit('update:modelValue', next)
  active.value = null
}

function toggle(i: number): void {
  expanded.value[i] = !expanded.value[i]
}
</script>

<template>
  <div class="board">
    <ol class="rows">
      <li
        v-for="(para, i) in paragraphs"
        :key="i"
        class="row"
        :class="{
          active: !locked && target === i,
          right: results?.[i] === true,
          wrong: results?.[i] === false
        }"
      >
        <div class="row-main">
          <button
            type="button"
            class="slot"
            :disabled="locked"
            :aria-pressed="!locked && target === i"
            @click="selectRow(i)"
          >
            <span class="label">
              <strong>{{ t('study.lessons.headings.paragraph', { n: i + 1 }) }}</strong>
              <span class="excerpt">{{ excerpts[i] }}</span>
            </span>
            <span class="picked" :class="{ empty: modelValue[i] === null }">
              {{
                modelValue[i] !== null
                  ? headings[modelValue[i] ?? 0]
                  : t('study.lessons.headings.choose')
              }}
            </span>
          </button>
          <span
            v-if="results"
            class="mark"
            role="img"
            :aria-label="results[i] ? t('study.lessons.itemRight') : t('study.lessons.itemWrong')"
          >
            <UiIcon :name="results[i] ? 'done' : 'close'" />
          </span>
        </div>
        <p v-if="results && !results[i]" class="fix"><UiIcon name="check" /> {{ answers[i] }}</p>
        <button
          v-if="para !== excerpts[i]"
          type="button"
          class="btn btn--xs btn--ghost more"
          :aria-expanded="!!expanded[i]"
          @click="toggle(i)"
        >
          {{
            expanded[i]
              ? t('study.lessons.headings.hidePara')
              : t('study.lessons.headings.showPara')
          }}
        </button>
        <p v-if="expanded[i]" class="full">{{ para }}</p>
      </li>
    </ol>

    <p class="bank-title">{{ t('study.lessons.headings.list') }}</p>
    <div class="bank">
      <button
        v-for="(h, pos) in headings"
        :key="pos"
        type="button"
        class="heading"
        :class="{ used: usedBy(pos) !== null }"
        :disabled="locked"
        @click="pick(pos)"
      >
        <span class="text">{{ h }}</span>
        <span v-if="usedBy(pos) !== null" class="chip">
          {{ t('study.lessons.headings.paragraph', { n: (usedBy(pos) ?? 0) + 1 }) }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  gap: var(--sp-3);
}
.rows {
  display: grid;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.row {
  display: grid;
  gap: var(--sp-1);
  padding: var(--sp-2) var(--sp-3);
  border: 2px solid var(--c-line);
  background: var(--c-surface);
  border-radius: var(--r-md);
}
.row.active {
  border-color: var(--c-primary);
  background: var(--c-primary-soft);
}
.row.right {
  border-color: var(--c-success);
  background: var(--c-success-soft);
}
.row.wrong {
  border-color: var(--c-danger);
  background: var(--c-danger-soft);
}
.row-main {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.slot {
  display: grid;
  flex: 1;
  gap: var(--sp-1);
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--c-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: var(--r-sm);
}
.slot:disabled {
  cursor: default;
}
.slot:focus-visible,
.heading:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}
.label {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  align-items: baseline;
  font-size: var(--fs-sm);
}
.excerpt {
  color: var(--c-ink-soft);
  font-style: italic;
}
.picked {
  font-weight: 700;
}
.picked.empty {
  color: var(--c-ink-soft);
  font-weight: 600;
}
/* Tiêu đề chọn sai bị gạch, đáp án đúng hiện ngay dưới (không chỉ dựa vào màu) */
.row.wrong .picked {
  color: var(--c-ink-soft);
  text-decoration: line-through;
}
.mark {
  display: inline-flex;
  flex: none;
}
.row.right .mark {
  color: var(--c-success);
}
.row.wrong .mark {
  color: var(--c-danger);
}
.fix {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin: 0;
  color: var(--c-ink);
  font-weight: 700;
}
.more {
  justify-self: start;
}
.full {
  margin: 0;
  padding: var(--sp-2) var(--sp-3);
  color: var(--c-ink);
  background: var(--c-surface-2);
  font-size: var(--fs-sm);
  line-height: 1.6;
  border-radius: var(--r-sm);
}
.bank-title {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
  font-weight: 700;
}
.bank {
  display: grid;
  gap: var(--sp-2);
}
.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border: 2px solid var(--c-line);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: var(--r-md);
}
.heading:hover:not(:disabled) {
  background: var(--c-surface-2);
}
.heading:disabled {
  cursor: default;
}
.heading.used {
  border-style: dashed;
  color: var(--c-ink-soft);
}
</style>
