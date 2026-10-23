<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  EXERCISE_KINDS,
  type Exercise,
  type ExerciseKind,
  type PracticeAnswer,
  type PracticeAnswerResult,
  type PracticeSummary
} from '@shared/schemas/practice'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import AudioPrompt from '../exercises/AudioPrompt.vue'
import ChoiceList from '../exercises/ChoiceList.vue'
import MatchBoard from '../exercises/MatchBoard.vue'
import WordOrderBoard from '../exercises/WordOrderBoard.vue'

// Luyện tập: phiên 10 bài (điền từ, sắp xếp câu, nghe chọn nghĩa, nghe chép, ghép cặp). Chấm ở main.
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()

type Phase = 'menu' | 'question' | 'feedback' | 'summary' | 'empty'
const phase = ref<Phase>('menu')
const exercise = ref<Exercise | null>(null)
const result = ref<PracticeAnswerResult | null>(null)
const summary = ref<PracticeSummary | null>(null)
const busy = ref(false)

// Trạng thái nhập liệu theo dạng bài
const chosen = ref<number | null>(null) // cloze, listen_choice
const picked = ref<number[]>([]) // word_order: thứ tự chỉ số token đã chọn
const typed = ref('') // dictation
const pairMap = ref<Array<number | null>>([]) // match_pairs: left → right
const dictationInput = ref<HTMLInputElement>()

const modes = computed(() => [
  { id: 'mixed' as const, icon: '🎲', label: t('study.practice.mixed') },
  ...EXERCISE_KINDS.map((k) => ({ id: k, icon: ICONS[k], label: t(`study.practice.kind.${k}`) }))
])
const ICONS: Record<ExerciseKind, string> = {
  cloze: '✏️',
  word_order: '🧩',
  listen_choice: '🎧',
  dictation: '⌨️',
  match_pairs: '🔗'
}

const canCheck = computed(() => {
  const e = exercise.value
  if (!e || phase.value !== 'question') return false
  switch (e.kind) {
    case 'cloze':
    case 'listen_choice':
      return chosen.value !== null
    case 'word_order':
      return picked.value.length === e.tokens.length
    case 'dictation':
      return typed.value.trim().length > 0
    case 'match_pairs':
      return pairMap.value.length === e.left.length && pairMap.value.every((m) => m !== null)
    default:
      return false
  }
})

function resetInput(e: Exercise): void {
  chosen.value = null
  picked.value = []
  typed.value = ''
  pairMap.value = e.kind === 'match_pairs' ? e.left.map(() => null) : []
}

function show(e: Exercise): void {
  exercise.value = e
  result.value = null
  resetInput(e)
  phase.value = 'question'
  if (e.kind === 'listen_choice' || e.kind === 'dictation') {
    window.setTimeout(() => speak(e.audioText, undefined, 0.9), 250)
  }
  if (e.kind === 'dictation') void nextTick(() => dictationInput.value?.focus())
}

async function start(mode: 'mixed' | ExerciseKind): Promise<void> {
  busy.value = true
  try {
    const { exercise: first } = await invoke('practice:start', { mode })
    summary.value = null
    if (first) show(first)
    else phase.value = 'empty'
  } finally {
    busy.value = false
  }
}

function buildAnswer(e: Exercise): PracticeAnswer {
  switch (e.kind) {
    case 'cloze':
      return { kind: 'cloze', choice: chosen.value ?? 0 }
    case 'listen_choice':
      return { kind: 'listen_choice', choice: chosen.value ?? 0 }
    case 'word_order':
      return { kind: 'word_order', order: picked.value }
    case 'dictation':
      return { kind: 'dictation', text: typed.value }
    case 'match_pairs':
      return { kind: 'match_pairs', mapping: pairMap.value.map((m) => m ?? 0) }
  }
}

async function check(): Promise<void> {
  const e = exercise.value
  if (!e || !canCheck.value || busy.value) return
  busy.value = true
  try {
    result.value = await invoke('practice:answer', {
      sessionId: e.sessionId,
      exerciseId: e.id,
      answer: buildAnswer(e)
    })
    phase.value = 'feedback'
    if (e.kind === 'cloze' || e.kind === 'word_order') speak(result.value.solution, undefined, 0.9)
  } catch (err) {
    console.warn('[practice] answer failed', err)
  } finally {
    busy.value = false
  }
}

function next(): void {
  const r = result.value
  if (!r) return
  if (r.next) {
    show(r.next)
    return
  }
  summary.value = r.summary
  phase.value = 'summary'
  exercise.value = null
  emit('changed')
}

const percent = computed(() =>
  result.value?.accuracy != null ? Math.round(result.value.accuracy * 100) : null
)

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    if (phase.value === 'feedback') {
      e.preventDefault()
      next()
    } else if (phase.value === 'question' && canCheck.value) {
      e.preventDefault()
      void check()
    }
    return
  }
  const ex = exercise.value
  if (phase.value === 'question' && ex && (ex.kind === 'cloze' || ex.kind === 'listen_choice')) {
    const n = Number(e.key)
    if (n >= 1 && n <= ex.choices.length) chosen.value = n - 1
  }
}

watch(phase, (p) => {
  if (p === 'menu') exercise.value = null
})

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <section class="practice">
    <h1>{{ t('study.practice.title') }}</h1>

    <PxPanel v-if="phase === 'menu' || phase === 'empty'" class="box">
      <p>{{ t('study.practice.intro') }}</p>
      <p v-if="phase === 'empty'" class="warn">{{ t('study.practice.empty') }}</p>
      <div class="modes">
        <button
          v-for="m in modes"
          :key="m.id"
          type="button"
          class="mode"
          :disabled="busy"
          @click="start(m.id)"
        >
          <span class="icon">{{ m.icon }}</span> {{ m.label }}
        </button>
      </div>
    </PxPanel>

    <template v-else-if="(phase === 'question' || phase === 'feedback') && exercise">
      <PxBar :value="exercise.index - 1" :max="exercise.total" label="progress" />
      <p class="muted">
        {{ t('study.practice.counter', { index: exercise.index, total: exercise.total }) }} ·
        {{ t(`study.practice.kind.${exercise.kind}`) }}
      </p>

      <PxPanel class="box">
        <!-- Điền từ -->
        <template v-if="exercise.kind === 'cloze'">
          <p class="instruction">{{ t('study.practice.clozeHelp') }}</p>
          <p class="sentence">{{ exercise.prompt }}</p>
          <p v-if="exercise.hintVi" class="muted">{{ exercise.hintVi }}</p>
          <ChoiceList v-model="chosen" :choices="exercise.choices" :locked="phase === 'feedback'" />
        </template>

        <!-- Sắp xếp câu -->
        <template v-else-if="exercise.kind === 'word_order'">
          <p class="instruction">{{ t('study.practice.orderHelp') }}</p>
          <p class="sentence vi">{{ exercise.hintVi }}</p>
          <WordOrderBoard
            v-model="picked"
            :tokens="exercise.tokens"
            :locked="phase === 'feedback'"
          />
        </template>

        <!-- Nghe chọn nghĩa -->
        <template v-else-if="exercise.kind === 'listen_choice'">
          <p class="instruction">{{ t('study.practice.listenHelp') }}</p>
          <AudioPrompt :text="exercise.audioText" />
          <ChoiceList
            v-model="chosen"
            single
            :choices="exercise.choices"
            :locked="phase === 'feedback'"
          />
        </template>

        <!-- Nghe chép -->
        <template v-else-if="exercise.kind === 'dictation'">
          <p class="instruction">
            {{ t('study.practice.dictationHelp', { n: exercise.wordCount }) }}
          </p>
          <AudioPrompt :text="exercise.audioText" />
          <input
            ref="dictationInput"
            v-model="typed"
            type="text"
            class="typed"
            spellcheck="false"
            autocomplete="off"
            :disabled="phase === 'feedback'"
            :placeholder="t('study.practice.typeHere')"
          />
        </template>

        <!-- Ghép cặp -->
        <template v-else>
          <p class="instruction">{{ t('study.practice.pairsHelp') }}</p>
          <MatchBoard
            v-model="pairMap"
            :left="exercise.left"
            :right="exercise.right"
            :locked="phase === 'feedback'"
          />
        </template>

        <!-- Phản hồi -->
        <div v-if="phase === 'feedback' && result" class="feedback" :class="{ ok: result.correct }">
          <strong>{{
            result.correct ? t('study.practice.correct') : t('study.practice.wrong')
          }}</strong>
          <span v-if="percent !== null"> · {{ t('study.practice.accuracy', { n: percent }) }}</span>
          <div class="solution">{{ result.solution }}</div>
        </div>
      </PxPanel>

      <div class="actions">
        <button
          v-if="phase === 'question'"
          type="button"
          class="btn btn--primary"
          :disabled="!canCheck || busy"
          @click="check"
        >
          {{ t('study.practice.check') }}
        </button>
        <button v-else type="button" class="btn btn--primary" @click="next">
          {{ result?.next ? t('study.practice.next') : t('study.practice.finish') }}
        </button>
      </div>
    </template>

    <PxPanel v-else-if="phase === 'summary' && summary" class="box result">
      <h2>{{ t('study.practice.summaryTitle') }}</h2>
      <p>
        {{ t('study.practice.summaryBody', { correct: summary.correct, total: summary.total }) }}
      </p>
      <p v-if="summary.xp > 0" class="reward">
        {{ t('study.missions.reward', { xp: summary.xp, coins: summary.coins }) }}
      </p>
      <p v-else class="muted">{{ t('study.practice.noReward') }}</p>
      <button type="button" class="btn btn--primary" @click="phase = 'menu'">
        {{ t('study.practice.again') }}
      </button>
    </PxPanel>
  </section>
</template>

<style scoped>
.practice {
  display: grid;
  gap: 12px;
  max-width: 680px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: var(--fs-2xl);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: 13px;
}
.warn {
  padding: 6px 8px;
  background: var(--c-warning);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
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
.sentence {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
.sentence.vi {
  font-size: 18px;
}
.modes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}
.mode {
  padding: 12px;
  border: 1px solid var(--c-line);
  background: var(--c-bg);
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  border-radius: var(--r-md);
}
.mode:hover:not(:disabled) {
  background: var(--c-primary-soft);
}
.icon {
  display: inline-block;
  width: 26px;
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
  margin-top: 4px;
  color: var(--c-ink);
  font-weight: 400;
}
.actions {
  display: flex;
  justify-content: center;
}
.result {
  text-align: center;
  justify-items: center;
}
.result h2 {
  margin: 0;
}
.reward {
  margin: 0;
  font-weight: 700;
  color: var(--c-xp);
}
</style>
