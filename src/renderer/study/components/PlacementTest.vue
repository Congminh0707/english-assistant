<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Award, Check, X } from 'lucide-vue-next'
import { CHECKPOINT_PASS_RATIO } from '@shared/placement'
import type { PlacementQuestion, PlacementResult } from '@shared/schemas/placement'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { useLeaveGuard } from '../leaveGuard'

// Bài kiểm tra đầu vào: 20 câu xen kẽ từ vựng / ngữ pháp / đọc hiểu, độ khó thích nghi; chấm ở main.
const props = defineProps<{ autostart?: boolean; mode?: 'placement' | 'checkpoint' }>()
const emit = defineEmits<{ done: [] }>()

const { t } = useI18n()
const { speak } = useTts()
const checkpoint = computed(() => props.mode === 'checkpoint')

type Phase = 'intro' | 'question' | 'feedback' | 'result' | 'nopack'
const phase = ref<Phase>('intro')
useLeaveGuard(() => phase.value === 'question' || phase.value === 'feedback')
const question = ref<PlacementQuestion | null>(null)
const result = ref<PlacementResult | null>(null)
const busy = ref(false)
const chosen = ref<number | null>(null)
const feedback = ref<{ correct: boolean; correctIndex: number; correctText: string } | null>(null)
let nextQuestion: PlacementQuestion | null = null
let nextResult: PlacementResult | null = null
let timer = 0

const PASS_PERCENT = CHECKPOINT_PASS_RATIO * 100
const levelName = (level: string | null): string => (level ? level.replace('_', '.') : '')

const progress = computed(() => (question.value ? question.value.index - 1 : 0))
const percentDone = computed(() =>
  question.value ? (progress.value / Math.max(question.value.total, 1)) * 100 : 0
)
/** Ước lượng thời gian: khoảng 30 giây mỗi câu (20 câu đầu vào, 10 câu lên cấp) */
const etaMin = computed(() => (checkpoint.value ? 5 : 10))

async function start(): Promise<void> {
  busy.value = true
  try {
    const { question: first } = await invoke(
      checkpoint.value ? 'placement:checkpoint-start' : 'placement:start'
    )
    if (!first) {
      phase.value = 'nopack'
      return
    }
    question.value = first
    result.value = null
    phase.value = 'question'
  } finally {
    busy.value = false
  }
}

async function answer(choice: number | null): Promise<void> {
  const q = question.value
  if (!q || phase.value !== 'question' || busy.value) return
  busy.value = true
  chosen.value = choice
  try {
    const res = await invoke('placement:answer', {
      sessionId: q.sessionId,
      questionId: q.id,
      choiceIndex: choice
    })
    feedback.value = {
      correct: res.correct,
      correctIndex: res.correctIndex,
      correctText: res.correctText
    }
    nextQuestion = res.next
    nextResult = res.result
    phase.value = 'feedback'
    timer = window.setTimeout(advance, res.correct ? 700 : 1500)
  } catch (err) {
    console.warn('[placement] answer failed', err)
  } finally {
    busy.value = false
  }
}

function advance(): void {
  window.clearTimeout(timer)
  if (phase.value !== 'feedback') return
  chosen.value = null
  feedback.value = null
  if (nextQuestion) {
    question.value = nextQuestion
    phase.value = 'question'
  } else {
    result.value = nextResult
    phase.value = 'result'
  }
}

/** Nghe: tự đọc câu khi hiện câu hỏi */
watch(
  () => (phase.value === 'question' ? question.value?.id : null),
  () => {
    const q = question.value
    if (q?.kind === 'listening' && q.say && phase.value === 'question') speak(q.say, 'us', 0.9)
  }
)

function choiceClass(i: number): Record<string, boolean> {
  if (!feedback.value) return {}
  return {
    right: i === feedback.value.correctIndex,
    wrong: i === chosen.value && !feedback.value.correct
  }
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (phase.value === 'intro' && e.key === 'Enter' && !busy.value) return void start()
  if (phase.value === 'feedback' && (e.key === ' ' || e.key === 'Enter')) return advance()
  if (phase.value !== 'question' || !question.value) return
  const n = Number(e.key)
  if (n >= 1 && n <= question.value.choices.length) void answer(n - 1)
  else if (e.key === '0') void answer(null)
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  if (props.autostart) void start()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.clearTimeout(timer)
})
</script>

<template>
  <section class="placement">
    <h1>{{ checkpoint ? t('study.placement.checkpointTitle') : t('study.placement.title') }}</h1>

    <div v-if="phase === 'intro'" class="card box center">
      <span class="badge"><Award :size="28" :stroke-width="2.2" /></span>
      <p>{{ checkpoint ? t('study.placement.checkpointIntro') : t('study.placement.intro') }}</p>
      <p class="muted">{{ t('study.placement.eta', { n: etaMin }) }}</p>
      <button type="button" class="btn btn--primary" :disabled="busy" @click="start">
        {{ t('study.placement.start') }} <kbd>Enter</kbd>
      </button>
    </div>

    <div v-else-if="phase === 'nopack'" class="card box center">
      <span class="badge"><Award :size="28" :stroke-width="2.2" /></span>
      <p>{{ t('study.placement.noPack') }}</p>
    </div>

    <template v-else-if="(phase === 'question' || phase === 'feedback') && question">
      <div class="progress">
        <div class="bar" role="progressbar" aria-label="progress" :aria-valuenow="progress">
          <div class="fill" :style="{ width: `${percentDone}%` }" />
        </div>
        <span class="muted">
          {{
            t(`study.placement.question.${question.kind}`, {
              index: question.index,
              total: question.total
            })
          }}
        </span>
      </div>
      <div class="card box">
        <div v-if="question.kind === 'listening'" class="listen">
          <button type="button" class="btn btn--sm" @click="speak(question.say ?? '', 'us', 0.9)">
            <UiIcon name="volume" /> {{ t('study.lessons.play') }}
          </button>
          <button type="button" class="btn btn--sm" @click="speak(question.say ?? '', 'us', 0.6)">
            <UiIcon name="slow" /> {{ t('study.lessons.slow') }}
          </button>
          <p class="prompt">{{ question.prompt }}</p>
        </div>
        <div v-else-if="question.kind === 'vocab'" class="word">
          <strong>{{ question.lemma }}</strong>
          <button type="button" class="btn btn--sm btn--icon" @click="speak(question.lemma)">
            <UiIcon name="volume" />
          </button>
          <span v-if="question.ipa" class="muted">{{ question.ipa }}</span>
        </div>
        <template v-else>
          <p v-if="question.passage" class="passage">{{ question.passage }}</p>
          <p class="prompt">{{ question.prompt }}</p>
        </template>
        <div class="choices">
          <button
            v-for="(choice, i) in question.choices"
            :key="i"
            type="button"
            class="choice"
            :class="choiceClass(i)"
            :disabled="phase === 'feedback' || busy"
            @click="answer(i)"
          >
            <span class="num">{{ i + 1 }}</span> {{ choice }}
            <Check v-if="feedback && i === feedback.correctIndex" :size="16" class="mark" />
            <X v-else-if="feedback && i === chosen && !feedback.correct" :size="16" class="mark" />
          </button>
          <button
            type="button"
            class="choice unknown"
            :disabled="phase === 'feedback' || busy"
            @click="answer(null)"
          >
            <span class="num">0</span> {{ t('study.placement.dontKnow') }}
          </button>
        </div>
        <p v-if="feedback" class="feedback" :class="{ ok: feedback.correct }">
          <Check v-if="feedback.correct" :size="16" />
          <X v-else :size="16" />
          {{
            feedback.correct
              ? t('study.placement.correct')
              : t('study.placement.wrong', { answer: feedback.correctText })
          }}
        </p>
      </div>
      <p class="muted keys">{{ t('study.placement.keys') }}</p>
    </template>

    <div v-else-if="phase === 'result' && result" class="card box result">
      <h2>{{ t('study.placement.resultTitle', { cefr: result.cefr }) }}</h2>
      <p>
        {{ t('study.placement.resultBody', { correct: result.correct, total: result.total }) }}
      </p>
      <p v-if="result.checkpoint" class="checkpoint" :class="{ ok: result.checkpoint.passed }">
        <Award :size="18" />
        <span class="cp-text">{{
          result.checkpoint.passed
            ? t('study.placement.checkpointPassed', { level: levelName(result.checkpoint.to) })
            : t('study.placement.checkpointFailed', { n: Math.round(PASS_PERCENT) })
        }}</span>
        <span v-if="result.checkpoint.xp" class="reward">
          {{
            t('study.missions.reward', { xp: result.checkpoint.xp, coins: result.checkpoint.coins })
          }}
        </span>
      </p>
      <ul class="skills">
        <li v-for="s in result.skills" :key="s.skill">
          <strong>{{ t(`study.placement.skill.${s.skill}`) }}</strong>
          <span class="chip chip--xp">{{ s.cefr }}</span>
          <div class="bar sk" role="progressbar">
            <div
              class="fill ok"
              :style="{ width: `${(s.correct / Math.max(s.total, 1)) * 100}%` }"
            />
          </div>
          <span class="muted">{{ s.correct }}/{{ s.total }}</span>
        </li>
      </ul>
      <div class="row">
        <button type="button" class="btn btn--primary" @click="emit('done')">
          {{ t('study.placement.done') }}
        </button>
        <button type="button" class="btn btn--ghost btn--sm" @click="start">
          {{ t('study.placement.retry') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.placement {
  display: grid;
  gap: var(--sp-3);
  max-width: 720px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: var(--fs-2xl);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
  font-weight: 600;
}
.keys {
  text-align: center;
  font-weight: 500;
}
kbd {
  font: inherit;
  font-size: var(--fs-xs);
  opacity: 0.75;
}
.progress {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.bar {
  flex: 1;
  height: 8px;
  overflow: hidden;
  border-radius: var(--r-pill);
  background: var(--c-surface-2);
}
.fill {
  height: 100%;
  border-radius: var(--r-pill);
  background: var(--c-primary);
  transition: width 0.3s ease;
}
.fill.ok {
  background: var(--c-success);
}
.box {
  display: grid;
  gap: var(--sp-4);
  padding: var(--sp-5);
}
.center {
  justify-items: center;
  text-align: center;
}
.center p {
  max-width: 440px;
  margin: 0;
}
.badge {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: var(--r-pill);
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.word {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  flex-wrap: wrap;
}
.word strong {
  font-size: var(--fs-3xl);
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}
.choice {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  border-radius: var(--r-md);
}
.choice:hover:not(:disabled) {
  background: var(--c-primary-soft);
}
.choice:disabled {
  cursor: default;
}
.choice.unknown {
  color: var(--c-ink-soft);
}
.choice.right {
  background: var(--c-success-soft);
  border-color: var(--c-success);
  color: var(--c-success);
}
.choice.wrong {
  background: var(--c-danger-soft);
  border-color: var(--c-danger);
  color: var(--c-danger);
}
.mark {
  margin-left: auto;
}
.num {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  border-radius: var(--r-sm);
  background: var(--c-surface-2);
  font-size: var(--fs-xs);
  font-weight: 700;
}
.feedback {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: 0;
  padding: var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-danger-soft);
  font-weight: 700;
  color: var(--c-danger);
}
.feedback.ok {
  background: var(--c-success-soft);
  color: var(--c-success);
}
.result {
  text-align: center;
}
.result h2 {
  margin: 0;
}
.result p {
  margin: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-4);
}
.passage {
  margin: 0;
  padding: var(--sp-3);
  background: var(--c-warning-soft);
  border-left: 3px solid var(--c-primary);
  line-height: 1.6;
  border-radius: var(--r-md);
}
.prompt {
  margin: 0;
  font-size: var(--fs-xl);
  font-weight: 700;
}
.skills {
  display: grid;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: left;
}
.skills li {
  display: grid;
  grid-template-columns: 110px 48px 1fr 40px;
  align-items: center;
  gap: var(--sp-3);
}
.listen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3);
}
.listen .prompt {
  flex-basis: 100%;
}
.checkpoint {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  font-weight: 700;
  text-align: left;
  color: var(--c-danger);
  background: var(--c-danger-soft);
  border-radius: var(--r-md);
}
.checkpoint.ok {
  color: var(--c-success);
  background: var(--c-success-soft);
}
.cp-text {
  flex: 1;
}
.reward {
  padding: 0 var(--sp-3);
  border-radius: var(--r-pill);
  background: var(--c-xp-soft);
  color: var(--c-xp);
  font-size: var(--fs-sm);
}
</style>
