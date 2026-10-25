<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Lesson } from '@shared/schemas/lesson'
import type { SpeechScore } from '@shared/speech'
import { useTts } from '@renderer/shared/composables/useTts'
import PicText from '@renderer/shared/components/PicText.vue'
import SpeakPractice from '@renderer/shared/components/SpeakPractice.vue'
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import AudioPrompt from '../exercises/AudioPrompt.vue'
import ChoiceList from '../exercises/ChoiceList.vue'
import MatchBoard from '../exercises/MatchBoard.vue'
import WordOrderBoard from '../exercises/WordOrderBoard.vue'
import {
  canCheck as canCheckEx,
  choiceTexts,
  hasChoices as hasChoicesEx,
  initState,
  isCorrect as isCorrectEx,
  solutionOf,
  speaksSolution,
  TF_ORDER
} from '../exercises/lessonExercises'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Bài tập của một bài học: chấm tại chỗ (đáp án là nội dung bài, không phải bí mật), xong gửi điểm lên main.
// Logic từng dạng bài nằm ở exercises/lessonExercises.ts (registry), phần hiển thị dùng các thành phần chung ở exercises/.
const props = defineProps<{ lesson: Lesson }>()
const emit = defineEmits<{
  finish: [
    correct: number,
    total: number,
    byType: Array<{ type: string; correct: number; total: number }>
  ]
  back: []
}>()

const { t } = useI18n()
const { speak, prefetch } = useTts()

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const idx = ref(0)
const checked = ref(false)
const correct = ref(false)
const correctCount = ref(0)
/** Kết quả theo dạng bài (gửi lên main để thống kê độ chính xác và Elo theo kỹ năng) */
const typeResults = ref<Record<string, { correct: number; total: number }>>({})
const typedInput = ref<HTMLInputElement>()

const total = computed(() => props.lesson.exercises.length)
const ex = computed(() => props.lesson.exercises[idx.value])
const state = reactive(initState(props.lesson.exercises[0], shuffle))

const tfLabel = (key: (typeof TF_ORDER)[number]): string => t(`study.lessons.tf.${key}`)

function enter(): void {
  const e = ex.value
  checked.value = false
  correct.value = false
  Object.assign(state, initState(e, shuffle))
  if (e.type === 'listen') window.setTimeout(() => speak(e.say, undefined, 0.9), 250)
  if (e.type === 'picture' && e.listen) window.setTimeout(() => speak(e.word, undefined, 0.9), 250)
  if (e.type === 'gap' && !e.choices) void nextTick(() => typedInput.value?.focus())
}

const choices = computed(() => choiceTexts(ex.value, tfLabel))
const hasChoices = computed(() => hasChoicesEx(ex.value))
const canCheck = computed(() => !checked.value && canCheckEx(ex.value, state))
/** Hiện nút nghe: nghe chọn, hoặc chọn hình dạng nghe từ */
const audioText = computed(() => {
  const e = ex.value
  return e.type === 'listen' ? e.say : e.type === 'picture' && e.listen ? e.word : null
})
/** Hai cột của bài ghép cặp (cột phải theo thứ tự đã xáo) */
const matchColumns = computed(() => {
  const e = ex.value
  return e.type === 'match'
    ? { left: e.pairs.map((p) => p.left), right: state.rightOrder.map((i) => e.pairs[i].right) }
    : null
})
const promptParts = computed(() => (ex.value.type === 'gap' ? ex.value.prompt.split('___') : []))
const solution = computed(() => solutionOf(ex.value, tfLabel))
/** Dòng chữ chính của câu hỏi (câu hỏi, câu đúng/sai, lời nhắc nghe) */
const heading = computed(() => {
  const e = ex.value
  switch (e.type) {
    case 'mcq':
      return e.prompt
    case 'listen':
      return e.prompt ?? t('study.lessons.listenPrompt')
    case 'tf':
      return e.statement
    default:
      return ''
  }
})

/** Bài nói: ghi nhận độ chính xác lần nói gần nhất; bấm "Kiểm tra" để chốt */
function onSpoken(score: SpeechScore): void {
  state.spoken = score.accuracy
}

/** Không nói được (không có micro...): bỏ qua câu này, tính là chưa đạt */
function skipSpeak(): void {
  state.spoken = 0
  check()
}

function check(): void {
  if (!canCheck.value) return
  const e = ex.value
  correct.value = isCorrectEx(e, state)
  if (correct.value) correctCount.value++
  const tally = (typeResults.value[e.type] ??= { correct: 0, total: 0 })
  tally.total++
  if (correct.value) tally.correct++
  checked.value = true
  if (speaksSolution(e)) speak(solution.value, undefined, 0.9)
}

function next(): void {
  if (idx.value + 1 >= total.value) {
    emit(
      'finish',
      correctCount.value,
      total.value,
      Object.entries(typeResults.value).map(([type, v]) => ({ type, ...v }))
    )
    return
  }
  idx.value++
  enter()
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.ctrlKey || event.altKey || event.metaKey) return
  if (event.key === 'Enter') {
    event.preventDefault()
    if (checked.value) next()
    else check()
    return
  }
  const n = Number(event.key)
  const target = event.target as HTMLElement | null
  if (
    hasChoices.value &&
    !checked.value &&
    n >= 1 &&
    n <= choices.value.length &&
    target?.tagName !== 'INPUT'
  ) {
    state.chosen = n - 1
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  // Giọng tự nhiên: tạo trước âm thanh các câu nghe và lời giải của bài tập
  prefetch(
    props.lesson.exercises.flatMap((e) =>
      e.type === 'listen'
        ? [e.say]
        : e.type === 'order'
          ? [e.answer]
          : e.type === 'speak'
            ? [e.say]
            : e.type === 'picture' && e.listen
              ? [e.word]
              : []
    ),
    undefined,
    0.9
  )
  enter()
})
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <section class="exercises">
    <button type="button" class="btn btn--ghost btn--sm" @click="$emit('back')">
      ← {{ t('study.lessons.backToLesson') }}
    </button>
    <PxBar :value="idx" :max="total" label="progress" />
    <p class="muted">
      {{ t('study.lessons.counter', { index: idx + 1, total }) }} · {{ lesson.title }}
    </p>

    <PxPanel class="box">
      <p v-if="ex.type === 'tf'" class="instruction">
        {{ ex.ng ? t('study.lessons.tfHelpNg') : t('study.lessons.tfHelp') }}
      </p>
      <p v-else-if="ex.type === 'picture'" class="instruction">
        {{ ex.listen ? t('study.lessons.pictureListen') : t('study.lessons.pictureHelp') }}
      </p>
      <p v-else-if="ex.type === 'speak'" class="instruction">
        {{ ex.word ? t('study.lessons.speakWordHelp') : t('study.lessons.speakHelp') }}
      </p>
      <p v-else-if="ex.type === 'gap'" class="instruction">{{ t('study.lessons.gapHelp') }}</p>
      <p v-else-if="ex.type === 'order'" class="instruction">{{ t('study.lessons.orderHelp') }}</p>
      <p v-else-if="ex.type === 'match'" class="instruction">
        {{ ex.prompt ?? t('study.lessons.matchHelp') }}
      </p>

      <p v-if="heading" class="prompt">{{ heading }}</p>
      <p v-else-if="ex.type === 'picture' && !ex.listen" class="prompt">{{ ex.word }}</p>
      <p v-else-if="ex.type === 'speak'" class="prompt">{{ ex.prompt ?? ex.say }}</p>
      <p v-else-if="ex.type === 'order'" class="prompt vi">{{ ex.hint }}</p>
      <p v-else-if="ex.type === 'gap'" class="prompt">
        {{ promptParts[0]
        }}<span class="blank">{{
          checked
            ? ex.answers[0]
            : state.chosen !== null && ex.choices
              ? ex.choices[state.chosen]
              : '＿＿＿'
        }}</span
        >{{ promptParts[1] }}
      </p>

      <AudioPrompt v-if="audioText" :text="audioText" />

      <SpeakPractice
        v-if="ex.type === 'speak' && !checked"
        :key="idx"
        :expected="ex.say"
        can-listen
        phonemes
        @scored="onSpoken"
      />

      <input
        v-if="ex.type === 'gap' && !ex.choices"
        ref="typedInput"
        v-model="state.typed"
        type="text"
        class="typed"
        spellcheck="false"
        autocomplete="off"
        :disabled="checked"
        :placeholder="t('study.lessons.typeHere')"
      />

      <WordOrderBoard
        v-else-if="ex.type === 'order'"
        v-model="state.picked"
        :tokens="state.tokens"
        :locked="checked"
      />

      <MatchBoard
        v-else-if="matchColumns"
        v-model="state.pairMap"
        :left="matchColumns.left"
        :right="matchColumns.right"
        :locked="checked"
      />

      <ChoiceList
        v-if="hasChoices"
        v-model="state.chosen"
        :choices="choices"
        :locked="checked"
        :pictures="ex.type === 'picture'"
      />

      <div v-if="checked" class="feedback" :class="{ ok: correct }">
        <strong>{{ correct ? t('study.lessons.correct') : t('study.lessons.wrong') }}</strong>
        <div v-if="!correct" class="solution">
          <PicText v-if="ex.type === 'picture'" :text="ex.choices[ex.answer]" :size="48" ids />
          {{ solution }}
        </div>
        <div v-if="'explain' in ex && ex.explain" class="explain">
          <UiIcon name="hint" /> {{ ex.explain }}
        </div>
      </div>
    </PxPanel>

    <div class="actions">
      <button
        v-if="ex.type === 'speak' && !checked"
        type="button"
        class="btn btn--ghost btn--sm"
        @click="skipSpeak"
      >
        {{ t('study.lessons.skipSpeak') }}
      </button>
      <button
        v-if="!checked"
        type="button"
        class="btn btn--primary"
        :disabled="!canCheck"
        @click="check"
      >
        {{ t('study.lessons.check') }}
      </button>
      <button v-else type="button" class="btn btn--primary" @click="next">
        {{ idx + 1 >= total ? t('study.lessons.finish') : t('study.lessons.next') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.exercises {
  display: grid;
  gap: 12px;
  max-width: 680px;
  margin: 0 auto;
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: 13px;
}
.box {
  display: grid;
  gap: 14px;
  padding: 20px 22px;
}
.instruction {
  margin: 0;
  font-weight: 600;
  color: var(--c-xp);
}
.prompt {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.prompt.vi {
  font-size: 17px;
}
.blank {
  display: inline-block;
  min-width: 56px;
  margin: 0 4px;
  padding: 0 6px;
  text-align: center;
  color: var(--c-primary);
  border-bottom: 3px solid var(--c-primary);
}
.typed {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  font: inherit;
  font-size: 16px;
  outline: none;
  border-radius: var(--r-md);
}
.typed:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px var(--c-primary-soft);
}
.feedback {
  padding: 8px 10px;
  color: var(--c-danger);
  background: #fde8e8;
  border-left: 4px solid var(--c-danger);
  border-radius: var(--r-md);
}
.feedback.ok {
  color: var(--c-success);
  background: var(--c-success-soft);
  border-left-color: var(--c-success);
}
.solution {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  color: var(--c-ink);
  font-weight: 600;
}
.explain {
  margin-top: 6px;
  color: var(--c-ink);
  font-weight: 400;
  font-size: 13px;
}
.actions {
  display: flex;
  justify-content: center;
}
</style>
