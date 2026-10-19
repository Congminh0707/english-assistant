<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PlacementQuestion, PlacementResult } from '@shared/schemas/placement'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'

// Bài kiểm tra đầu vào: 20 câu xen kẽ từ vựng / ngữ pháp / đọc hiểu, độ khó thích nghi; chấm ở main.
const props = defineProps<{ autostart?: boolean }>()
const emit = defineEmits<{ done: [] }>()

const { t } = useI18n()
const { speak } = useTts()

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

const progress = computed(() => (question.value ? question.value.index - 1 : 0))

async function start(): Promise<void> {
  busy.value = true
  try {
    const { question: first } = await invoke('placement:start')
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
    <h1>{{ t('study.placement.title') }}</h1>

    <PxPanel v-if="phase === 'intro'" class="box">
      <p>{{ t('study.placement.intro') }}</p>
      <button type="button" class="primary" :disabled="busy" @click="start">
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
        <div v-if="question.kind === 'vocab'" class="word">
          <strong>{{ question.lemma }}</strong>
          <button type="button" class="say" @click="speak(question.lemma)">🔊</button>
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
      <ul class="skills">
        <li v-for="s in result.skills" :key="s.skill">
          <strong>{{ t(`study.placement.skill.${s.skill}`) }}</strong>
          <span class="tag">{{ s.cefr }}</span>
          <span class="muted">{{ s.correct }}/{{ s.total }}</span>
        </li>
      </ul>
      <div class="row">
        <button type="button" class="primary" @click="emit('done')">
          {{ t('study.placement.done') }}
        </button>
        <button type="button" class="link" @click="start">{{ t('study.placement.retry') }}</button>
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
.say {
  padding: 2px 8px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  cursor: pointer;
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.choice {
  padding: 10px 12px;
  border: var(--px) solid var(--c-border);
  background: var(--c-bg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.choice:hover:not(:disabled) {
  background: #eef3ff;
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
.primary {
  padding: 10px 20px;
  border: var(--px) solid var(--c-border);
  background: var(--c-primary);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
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
.link {
  border: none;
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
.passage {
  margin: 0;
  padding: 8px 12px;
  background: #fff8dc;
  border-left: 3px solid var(--c-primary);
  line-height: 1.6;
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
  border: 1px solid var(--c-border);
}
</style>
