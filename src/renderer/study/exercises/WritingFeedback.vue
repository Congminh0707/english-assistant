<script setup lang="ts">
// Phần nhận xét sau khi chấm câu dịch / bài viết / câu trả lời nói: nhận xét và bản sửa của AI, điểm theo tiêu chí, hoặc
// lý do không có AI kèm đáp án mẫu / bài mẫu / câu trả lời mẫu. Chỉ hiển thị dữ liệu main đã chấm.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SpeakingResult } from '@shared/schemas/speaking'
import type { TranslateCheckResult, WritingResult } from '@shared/schemas/writing'
import { RESPOND_PASS } from '@shared/speaking'
import { WRITE_PASS } from '@shared/writing'
import { useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

const props = withDefaults(
  defineProps<{
    translate?: TranslateCheckResult | null
    write?: WritingResult | null
    /** Câu trả lời nói (dạng `respond`) */
    speak?: SpeakingResult | null
    /** Câu dịch đúng nhưng khác đáp án mẫu (AI chấp nhận): vẫn cho xem đáp án mẫu */
    modelAnswer?: string
    /** Bài mẫu của đề viết / câu trả lời mẫu của câu hỏi nói */
    sample?: string
    /** Số từ tối thiểu của câu hỏi nói (dòng "chấm tại máy") */
    minWords?: number
    /** false = không có ngưỡng đạt (viết tự do): điểm tổng màu trung tính, không hiện dòng "đạt từ 60" */
    graded?: boolean
  }>(),
  {
    translate: null,
    write: null,
    speak: null,
    modelAnswer: undefined,
    sample: undefined,
    minWords: undefined,
    graded: true
  }
)
const { t } = useI18n()
const { speak: say } = useTts()

const SCORE_KEYS = ['task', 'grammar', 'vocabulary', 'coherence'] as const
const SPEAK_SCORE_KEYS = ['task', 'grammar', 'vocabulary', 'fluency'] as const

/** Bài viết hoặc câu trả lời nói (cùng bố cục: điểm, chỗ sửa, bản tốt hơn, mẹo) */
const result = computed(() => props.write ?? props.speak)
/** Nhận xét AI đã chuẩn hoá về một dạng để hiển thị chung */
const rubric = computed(() => {
  const w = props.write?.feedback
  if (w)
    return {
      overall: w.overall,
      passMark: WRITE_PASS,
      scores: SCORE_KEYS.map((key) => ({ key, n: w.scores[key] })),
      corrections: w.corrections,
      better: w.improved_version,
      betterLabel: t('study.lessons.writing.improved'),
      tips: w.tips_vi
    }
  const s = props.speak?.feedback
  if (s)
    return {
      overall: s.overall,
      passMark: RESPOND_PASS,
      scores: SPEAK_SCORE_KEYS.map((key) => ({ key, n: s.scores[key] })),
      corrections: s.corrections,
      better: s.better_answer,
      betterLabel: t('study.lessons.respond.better'),
      tips: s.tips_vi
    }
  return null
})
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

  <div v-else-if="result" class="wf">
    <template v-if="rubric">
      <div class="scores">
        <span
          class="chip"
          :class="!graded ? 'chip--primary' : result.passed ? 'chip--success' : 'chip--danger'"
        >
          {{ t('study.lessons.writing.overall', { n: rubric.overall }) }}
        </span>
        <span v-if="graded" class="muted small">{{
          t('study.lessons.writing.passMark', { n: rubric.passMark })
        }}</span>
        <span v-for="s in rubric.scores" :key="s.key" class="chip chip--primary">
          {{ t(`study.lessons.writing.scores.${s.key}`) }} {{ s.n }}/5
        </span>
      </div>
      <div v-if="rubric.corrections.length" class="block">
        <h3>{{ t('study.lessons.writing.corrections') }}</h3>
        <ul>
          <li v-for="(c, i) in rubric.corrections" :key="i">
            <span class="from">{{ c.from }}</span> <UiIcon name="next" :size="12" />
            <span class="en">{{ c.to }}</span>
            <span v-if="c.note_vi" class="muted"> — {{ c.note_vi }}</span>
          </li>
        </ul>
      </div>
      <div v-if="rubric.better" class="block">
        <h3>{{ rubric.betterLabel }}</h3>
        <p class="en para">{{ rubric.better }}</p>
      </div>
      <div v-if="rubric.tips.length" class="block">
        <h3><UiIcon name="hint" /> {{ t('study.lessons.writing.tips') }}</h3>
        <ul>
          <li v-for="(tip, i) in rubric.tips" :key="i">{{ tip }}</li>
        </ul>
      </div>
    </template>
    <p v-else-if="write" class="line muted">
      {{ t('study.lessons.writing.noAiWrite') }}
      <template v-if="write.aiReason">{{ t(write.aiReason) }}</template>
    </p>
    <p v-else-if="speak" class="line muted">
      {{ t('study.lessons.respond.noAi', { n: minWords ?? 0 }) }}
      <template v-if="speak.aiReason">{{ t(speak.aiReason) }}</template>
    </p>
    <div v-if="sample" class="block">
      <h3 class="sample-head">
        {{ speak ? t('study.lessons.respond.sample') : t('study.lessons.writing.sample') }}
        <button
          v-if="speak"
          type="button"
          class="btn btn--icon btn--sm"
          :title="t('study.lessons.play')"
          :aria-label="t('study.lessons.play')"
          @click="say(sample, undefined, 0.9)"
        >
          <UiIcon name="volume" />
        </button>
      </h3>
      <p class="en para">{{ sample }}</p>
    </div>
    <p v-if="speak" class="muted small">
      {{ t('speech.disclaimer') }} {{ t('study.lessons.respond.noPronunciation') }}
    </p>
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
  flex-wrap: wrap;
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
