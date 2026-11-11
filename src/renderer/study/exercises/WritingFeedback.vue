<script setup lang="ts">
// Phần nhận xét sau khi chấm câu dịch / bài viết: nhận xét và bản sửa của AI, điểm theo tiêu chí, hoặc lý do không có AI
// kèm đáp án mẫu / bài mẫu. Chỉ hiển thị dữ liệu main đã chấm.
import { useI18n } from 'vue-i18n'
import type { TranslateCheckResult, WritingResult } from '@shared/schemas/writing'
import { WRITE_PASS } from '@shared/writing'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

withDefaults(
  defineProps<{
    translate?: TranslateCheckResult | null
    write?: WritingResult | null
    /** Câu dịch đúng nhưng khác đáp án mẫu (AI chấp nhận): vẫn cho xem đáp án mẫu */
    modelAnswer?: string
    /** Bài mẫu của đề viết */
    sample?: string
    /** false = không có ngưỡng đạt (viết tự do): điểm tổng màu trung tính, không hiện dòng "đạt từ 60" */
    graded?: boolean
  }>(),
  { translate: null, write: null, modelAnswer: undefined, sample: undefined, graded: true }
)
const { t } = useI18n()

const SCORE_KEYS = ['task', 'grammar', 'vocabulary', 'coherence'] as const
</script>

<template>
  <div v-if="translate" class="wf">
    <template v-if="translate.gradedBy === 'ai'">
      <p v-if="translate.correct" class="line">
        <UiIcon name="done" /> {{ t('study.lessons.writing.aiAccepted') }}
      </p>
      <p v-if="translate.note" class="line">
        <strong>{{ t('study.lessons.writing.aiNote') }}:</strong> {{ translate.note }}
      </p>
      <p v-if="!translate.correct && translate.corrected" class="line">
        <strong>{{ t('study.lessons.writing.aiCorrected') }}:</strong>
        <span class="en">{{ translate.corrected }}</span>
      </p>
      <p v-if="translate.correct && modelAnswer" class="line">
        <strong>{{ t('study.lessons.writing.modelAnswer') }}:</strong>
        <span class="en">{{ modelAnswer }}</span>
      </p>
    </template>
    <p v-else-if="translate.aiReason" class="line muted">
      {{ t('study.lessons.writing.noAiTranslate') }} {{ t(translate.aiReason) }}
    </p>
  </div>

  <div v-else-if="write" class="wf">
    <template v-if="write.feedback">
      <div class="scores">
        <span
          class="chip"
          :class="!graded ? 'chip--primary' : write.passed ? 'chip--success' : 'chip--danger'"
        >
          {{ t('study.lessons.writing.overall', { n: write.feedback.overall }) }}
        </span>
        <span v-if="graded" class="muted small">{{
          t('study.lessons.writing.passMark', { n: WRITE_PASS })
        }}</span>
        <span v-for="key in SCORE_KEYS" :key="key" class="chip chip--primary">
          {{ t(`study.lessons.writing.scores.${key}`) }} {{ write.feedback.scores[key] }}/5
        </span>
      </div>
      <div v-if="write.feedback.corrections.length" class="block">
        <h3>{{ t('study.lessons.writing.corrections') }}</h3>
        <ul>
          <li v-for="(c, i) in write.feedback.corrections" :key="i">
            <span class="from">{{ c.from }}</span> <UiIcon name="next" :size="12" />
            <span class="en">{{ c.to }}</span>
            <span v-if="c.note_vi" class="muted"> — {{ c.note_vi }}</span>
          </li>
        </ul>
      </div>
      <div v-if="write.feedback.improved_version" class="block">
        <h3>{{ t('study.lessons.writing.improved') }}</h3>
        <p class="en para">{{ write.feedback.improved_version }}</p>
      </div>
      <div v-if="write.feedback.tips_vi.length" class="block">
        <h3><UiIcon name="hint" /> {{ t('study.lessons.writing.tips') }}</h3>
        <ul>
          <li v-for="(tip, i) in write.feedback.tips_vi" :key="i">{{ tip }}</li>
        </ul>
      </div>
    </template>
    <p v-else class="line muted">
      {{ t('study.lessons.writing.noAiWrite') }}
      <template v-if="write.aiReason">{{ t(write.aiReason) }}</template>
    </p>
    <div v-if="sample" class="block">
      <h3>{{ t('study.lessons.writing.sample') }}</h3>
      <p class="en para">{{ sample }}</p>
    </div>
  </div>
</template>

<style scoped>
.wf {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-surface-2);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
  color: var(--c-ink);
}
.line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-1);
  margin: 0;
}
.muted {
  color: var(--c-ink-soft);
}
.small {
  font-size: var(--fs-xs);
}
.en {
  font-weight: 600;
}
.from {
  text-decoration: line-through;
  color: var(--c-ink-soft);
}
.scores {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}
.block h3 {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin: 0 0 var(--sp-1);
  font-size: var(--fs-sm);
}
.block ul {
  display: grid;
  gap: var(--sp-1);
  margin: 0;
  padding-left: var(--sp-4);
}
.para {
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
