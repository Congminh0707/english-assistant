<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHECKPOINT_PASS_RATIO } from '@shared/placement'
import type { PlacementQuestion, PlacementResult } from '@shared/schemas/placement'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Bài kiểm tra đầu vào: 20 câu xen kẽ từ vựng / ngữ pháp / đọc hiểu, độ khó thích nghi; chấm ở main.
const props = defineProps<{ autostart?: boolean; mode?: 'placement' | 'checkpoint' }>()
const emit = defineEmits<{ done: [] }>()

const { t } = useI18n()
const { speak } = useTts()
const checkpoint = computed(() => props.mode === 'checkpoint')

type Phase = 'intro' | 'question' | 'feedback' | 'result' | 'nopack'
const phase = ref<Phase>('intro')
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

    <PxPanel v-if="phase === 'intro'" class="box">
      <p>{{ checkpoint ? t('study.placement.checkpointIntro') : t('study.placement.intro') }}</p>
      <button type="button" class="btn btn--primary" :disabled="busy" @click="start">
        {{ t('study.placement.start') }}
      </button>
    </PxPanel>

    <PxPanel v-else-if="phase === 'nopack'" class="box">
      <p>{{ t('study.placement.noPack') }}</p>
    </PxPanel>

    <template v-else-if="(phase === 'question' || phase === 'feedback') && question">
      <PxBar :value="progress" :max="question.total" label="progress" />
      <p class="muted">
        {{
          t(`study.placement.question.${question.kind}`, {
            index: question.index,
            total: question.total
          })
        }}
      </p>
      <PxPanel class="box">
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
          {{
            feedback.correct
              ? t('study.placement.correct')
              : t('study.placement.wrong', { answer: feedback.correctText })
          }}
        </p>
      </PxPanel>
    </template>

    <PxPanel v-else-if="phase === 'result' && result" class="box result">
      <h2>{{ t('study.placement.resultTitle', { cefr: result.cefr }) }}</h2>
      <p>
        {{ t('study.placement.resultBody', { correct: result.correct, total: result.total }) }}
      </p>
      <p v-if="result.checkpoint" class="checkpoint" :class="{ ok: result.checkpoint.passed }">
        {{
          result.checkpoint.passed
            ? t('study.placement.checkpointPassed', { level: levelName(result.checkpoint.to) })
            : t('study.placement.checkpointFailed', { n: Math.round(PASS_PERCENT) })
        }}
        <span v-if="result.checkpoint.xp" class="reward">
          {{
            t('study.missions.reward', { xp: result.checkpoint.xp, coins: result.checkpoint.coins })
          }}
        </span>
      </p>
      <ul class="skills">
        <li v-for="s in result.skills" :key="s.skill">
          <strong>{{ t(`study.placement.skill.${s.skill}`) }}</strong>
          <span class="tag">{{ s.cefr }}</span>
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
    </PxPanel>
  </section>
</template>

<style scoped>
.placement {
  display: grid;
  gap: 12px;
  max-width: 640px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: 22px;
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
.word {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}
.word strong {
  font-size: 34px;
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
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
.choice:hover:not(:disabled) {
  background: var(--c-primary-soft);
}
.choice.unknown {
  grid-column: 1 / -1;
  color: var(--c-ink-soft);
}
.choice.right {
  background: var(--c-success);
  color: #fff;
}
.choice.wrong {
  background: var(--c-danger);
  color: #fff;
}
.num {
  display: inline-block;
  width: 18px;
  font-weight: 700;
  opacity: 0.6;
}
.feedback {
  margin: 0;
  font-weight: 600;
  color: var(--c-danger);
}
.feedback.ok {
  color: var(--c-success);
}
.result {
  text-align: center;
}
.result h2 {
  margin: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.passage {
  margin: 0;
  padding: 8px 12px;
  background: var(--c-warning-soft);
  border-left: 3px solid var(--c-primary);
  line-height: 1.6;
  border-radius: var(--r-md);
}
.prompt {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.skills {
  display: grid;
  gap: 4px;
  margin: 8px 0;
  padding: 0;
  list-style: none;
}
.skills li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tag {
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--c-xp);
  border: 1px solid var(--c-line);
  border-radius: var(--r-pill);
}
.listen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.listen .prompt {
  flex-basis: 100%;
}
.checkpoint {
  margin: 8px 0;
  padding: 8px 12px;
  font-weight: 700;
  background: #fde3e3;
  border-left: 4px solid var(--c-danger);
  border-radius: var(--r-md);
}
.checkpoint.ok {
  background: #e3f6e6;
  border-left-color: var(--c-success);
}
.reward {
  margin-left: 8px;
  color: var(--c-ink-soft);
}
</style>
