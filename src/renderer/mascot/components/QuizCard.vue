<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Quiz, QuizAnswerResult } from '@shared/schemas/quiz'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Thẻ hỏi ôn / từ của khoảnh khắc trong bong bóng mascot (docs/05-mascot-system.md#5).
const props = defineProps<{ quiz: Quiz }>()
const emit = defineEmits<{ done: []; result: [correct: boolean] }>()

const { t } = useI18n()
const { speak } = useTts()

const result = ref<QuizAnswerResult | null>(null)
const chosen = ref<number | null>(null)
const busy = ref(false)
const saved = ref(false)
let shownAt = 0
let closeTimer = 0
let idleTimer = 0
let lastArm = 0
let idleArmed = false
const idleRun = ref(0)
const IDLE_CLOSE_MS = 30_000

const nextReview = computed(() => {
  const days = result.value?.intervalDays ?? 0
  if (days < 1 / 24) return t('quiz.minutes', { n: Math.max(1, Math.round(days * 1440)) })
  if (days < 1) return t('quiz.hours', { n: Math.round(days * 24) })
  return t('quiz.days', { n: Math.round(days) })
})

async function choose(index: number): Promise<void> {
  if (props.quiz.kind !== 'review' || busy.value || result.value) return
  busy.value = true
  chosen.value = index
  try {
    result.value = await invoke('quiz:answer', {
      quizId: props.quiz.id,
      choiceIndex: index,
      elapsedMs: Math.round(performance.now() - shownAt)
    })
    emit('result', result.value.correct)
    closeLater(result.value.correct ? 2200 : 3500)
  } catch (err) {
    console.warn('[quiz] answer failed', err)
    emit('done')
  } finally {
    busy.value = false
  }
}

async function save(): Promise<void> {
  if (props.quiz.kind !== 'new' || busy.value || saved.value) return
  busy.value = true
  try {
    await invoke('vocab:save', { contentId: props.quiz.wordId, text: props.quiz.lemma })
    saved.value = true
    emit('result', true)
    closeLater(1800)
  } catch (err) {
    console.warn('[quiz] save failed', err)
  } finally {
    busy.value = false
  }
}

function closeLater(ms: number): void {
  window.clearTimeout(closeTimer)
  window.clearTimeout(idleTimer)
  closeTimer = window.setTimeout(() => emit('done'), ms)
}

/** Không tương tác trong IDLE_CLOSE_MS thì tự tắt; từ chưa trả lời sẽ được main xếp lại cuối hàng */
function armIdle(): void {
  if (result.value || saved.value) return
  const now = performance.now()
  if (idleArmed && now - lastArm < 250) return // pointermove bắn dày: chỉ làm mới mỗi 250ms
  lastArm = now
  idleArmed = true
  idleRun.value++ // khởi động lại animation thanh tiến trình
  window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => emit('done'), IDLE_CLOSE_MS)
}

function choiceClass(index: number): Record<string, boolean> {
  if (!result.value) return {}
  return {
    right: index === result.value.correctIndex,
    wrong: index === chosen.value && !result.value.correct
  }
}

onMounted(() => {
  shownAt = performance.now()
  armIdle()
})
onUnmounted(() => {
  window.clearTimeout(closeTimer)
  window.clearTimeout(idleTimer)
})
</script>

<template>
  <div class="quiz" @pointermove="armIdle" @pointerdown="armIdle" @keydown="armIdle">
    <div class="idle" aria-hidden="true">
      <span
        v-if="!result && !saved"
        :key="idleRun"
        class="idle-bar"
        :style="{ animationDuration: `${IDLE_CLOSE_MS}ms` }"
      />
    </div>
    <div class="head">
      <span class="title">{{
        quiz.kind === 'review' ? t('quiz.reviewTitle') : t('quiz.newTitle')
      }}</span>
      <span v-if="quiz.kind === 'review' && quiz.dueCount > 1" class="muted">
        {{ t('quiz.dueLeft', { count: quiz.dueCount }) }}
      </span>
      <span v-else-if="quiz.kind === 'new'" class="chip chip--primary">{{
        quiz.level.replace('_', '.')
      }}</span>
    </div>

    <div class="word">
      <strong>{{ quiz.lemma }}</strong>
      <button
        type="button"
        class="btn btn--xs btn--icon"
        :title="t('quiz.listen')"
        :aria-label="t('quiz.listen')"
        @click="speak(quiz.lemma)"
      >
        <UiIcon name="volume" :size="14" />
      </button>
      <span v-if="quiz.ipa" class="muted ipa">{{ quiz.ipa }}</span>
    </div>

    <template v-if="quiz.kind === 'review'">
      <p v-if="!result" class="muted q">{{ t('quiz.reviewQuestion') }}</p>
      <div class="choices">
        <button
          v-for="(choice, i) in quiz.choices"
          :key="i"
          type="button"
          class="choice"
          :class="choiceClass(i)"
          :disabled="busy || !!result"
          @click="choose(i)"
        >
          {{ choice }}
        </button>
      </div>
      <p v-if="result" class="feedback" :class="{ ok: result.correct }">
        {{ result.correct ? t('quiz.correct') : t('quiz.wrong', { answer: result.correctText }) }}
        <br />
        <span class="muted">{{ t('quiz.nextReview', { time: nextReview }) }}</span>
      </p>
    </template>

    <template v-else>
      <p class="vi">{{ quiz.vi.join('; ') }}</p>
      <p v-if="quiz.example" class="example">
        {{ quiz.example.en }}
        <span v-if="quiz.example.vi" class="muted"><br />{{ quiz.example.vi }}</span>
      </p>
      <p v-if="saved" class="feedback ok">{{ t('quiz.saved') }}</p>
    </template>

    <div v-if="!result && !saved" class="actions">
      <button
        v-if="quiz.kind === 'new'"
        type="button"
        class="btn btn--xs btn--success"
        :disabled="busy"
        @click="save"
      >
        <UiIcon name="save" :size="14" />
        {{ t('quiz.save') }}
      </button>
      <button type="button" class="btn btn--xs btn--ghost" @click="emit('done')">
        {{ t('quiz.later') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.quiz {
  display: grid;
  gap: 6px;
  width: 100%;
  min-width: 0;
}
/* Dính mép trên khung giấy (.px-panel relative + overflow hidden ở SpeechBubble) */
.idle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  pointer-events: none;
}
.idle-bar {
  display: block;
  height: 100%;
  width: 100%;
  background: var(--c-xp);
  opacity: 0.8;
  transform-origin: left;
  animation: idle-run linear forwards;
}
@keyframes idle-run {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--fs-xs);
}
.title {
  font-weight: 700;
  color: var(--c-xp);
}
.muted {
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
}
.word {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.word strong {
  font-size: var(--fs-xl);
}
.ipa {
  font-size: var(--fs-xs);
}
.q {
  margin: 0;
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.choice {
  padding: 6px 8px;
  border: 1px solid var(--c-line);
  border-radius: var(--r-sm);
  background: var(--c-surface);
  font: inherit;
  font-size: var(--fs-xs);
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.choice:hover:not(:disabled) {
  background: var(--c-primary-soft);
}
.choice.right {
  border-color: var(--c-success);
  background: var(--c-success);
  color: var(--c-on-primary);
}
.choice.wrong {
  border-color: var(--c-danger);
  background: var(--c-danger);
  color: var(--c-on-primary);
}
.feedback {
  margin: 2px 0 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-danger);
}
.feedback.ok {
  color: var(--c-success);
}
.vi {
  margin: 0;
  font-weight: 600;
}
.example {
  margin: 0;
  font-size: var(--fs-xs);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 2px;
}
</style>
