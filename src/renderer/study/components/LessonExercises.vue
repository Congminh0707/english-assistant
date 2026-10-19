<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Lesson, LessonExercise } from '@shared/schemas/lesson'
import { sameSentence } from '@shared/practice'
import { useTts } from '@renderer/shared/composables/useTts'
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import { isGapCorrect } from '../lessonText'

// Bài tập của một bài học: chấm tại chỗ (đáp án là nội dung bài, không phải bí mật), xong gửi điểm lên main.
const props = defineProps<{ lesson: Lesson }>()
const emit = defineEmits<{ finish: [correct: number, total: number]; back: [] }>()

const { t } = useI18n()
const { speak, prefetch } = useTts()

const idx = ref(0)
const checked = ref(false)
const isCorrect = ref(false)
const correctCount = ref(0)
const chosen = ref<number | null>(null)
const typed = ref('')
const picked = ref<number[]>([])
const tokens = ref<string[]>([])
const pairMap = ref<Array<number | null>>([])
const rightOrder = ref<number[]>([])
const selectedLeft = ref<number | null>(null)
const typedInput = ref<HTMLInputElement>()

const total = computed(() => props.lesson.exercises.length)
const ex = computed<LessonExercise>(() => props.lesson.exercises[idx.value])

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function enter(): void {
  const e = ex.value
  checked.value = false
  isCorrect.value = false
  chosen.value = null
  typed.value = ''
  picked.value = []
  selectedLeft.value = null
  if (e.type === 'order') {
    const words = e.answer.trim().split(/\s+/)
    let shuffled = shuffle(words)
    for (let n = 0; n < 5 && shuffled.join(' ') === words.join(' '); n++) shuffled = shuffle(words)
    tokens.value = shuffled
  }
  if (e.type === 'match') {
    pairMap.value = e.pairs.map(() => null)
    rightOrder.value = shuffle(e.pairs.map((_, i) => i))
  }
  if (e.type === 'listen') window.setTimeout(() => speak(e.say, undefined, 0.9), 250)
  if (e.type === 'picture' && e.listen) window.setTimeout(() => speak(e.word, undefined, 0.9), 250)
  if (e.type === 'gap' && !e.choices) void nextTick(() => typedInput.value?.focus())
}

/** Đúng / Sai / Không có thông tin: thứ tự lựa chọn của dạng `tf` */
const TF_ORDER = ['true', 'false', 'ng'] as const

const hasChoices = computed(() => {
  const e = ex.value
  return (
    e.type === 'mcq' ||
    e.type === 'listen' ||
    e.type === 'tf' ||
    e.type === 'picture' ||
    (e.type === 'gap' && !!e.choices)
  )
})
const choices = computed<string[]>(() => {
  const e = ex.value
  if (e.type === 'tf') {
    return TF_ORDER.slice(0, e.ng ? 3 : 2).map((k) => t(`study.lessons.tf.${k}`))
  }
  return e.type === 'mcq' || e.type === 'listen' || e.type === 'picture'
    ? e.choices
    : e.type === 'gap'
      ? (e.choices ?? [])
      : []
})

const canCheck = computed(() => {
  if (checked.value) return false
  const e = ex.value
  switch (e.type) {
    case 'mcq':
    case 'listen':
    case 'tf':
    case 'picture':
      return chosen.value !== null
    case 'gap':
      return e.choices ? chosen.value !== null : typed.value.trim().length > 0
    case 'order':
      return picked.value.length === tokens.value.length
    case 'match':
      return pairMap.value.every((m) => m !== null)
    default:
      return false
  }
})

function evaluate(e: LessonExercise): boolean {
  switch (e.type) {
    case 'mcq':
    case 'listen':
    case 'picture':
      return chosen.value === e.answer
    case 'tf':
      return chosen.value === TF_ORDER.indexOf(e.answer)
    case 'gap':
      return e.choices
        ? chosen.value !== null && isGapCorrect(e.choices[chosen.value], e.answers)
        : isGapCorrect(typed.value, e.answers)
    case 'order':
      return sameSentence(picked.value.map((i) => tokens.value[i]).join(' '), e.answer)
    case 'match':
      return pairMap.value.every((pos, i) => pos !== null && rightOrder.value[pos] === i)
  }
}

function solution(e: LessonExercise): string {
  switch (e.type) {
    case 'mcq':
    case 'listen':
      return e.choices[e.answer]
    case 'picture':
      return `${e.choices[e.answer]} = ${e.word}`
    case 'tf':
      return t(`study.lessons.tf.${e.answer}`)
    case 'gap':
      return e.prompt.replace('___', e.answers[0])
    case 'order':
      return e.answer
    case 'match':
      return e.pairs.map((p) => `${p.left} = ${p.right}`).join(' · ')
  }
}

function check(): void {
  if (!canCheck.value) return
  const e = ex.value
  isCorrect.value = evaluate(e)
  if (isCorrect.value) correctCount.value++
  checked.value = true
  if (e.type === 'gap' || e.type === 'order') speak(solution(e), undefined, 0.9)
}

function next(): void {
  if (idx.value + 1 >= total.value) {
    emit('finish', correctCount.value, total.value)
    return
  }
  idx.value++
  enter()
}

function pick(i: number): void {
  if (!checked.value) chosen.value = i
}
function pickToken(i: number): void {
  if (!checked.value && !picked.value.includes(i)) picked.value.push(i)
}
function unpickToken(pos: number): void {
  if (!checked.value) picked.value.splice(pos, 1)
}
function selectLeft(i: number): void {
  if (!checked.value) selectedLeft.value = selectedLeft.value === i ? null : i
}
function selectRight(pos: number): void {
  const i = selectedLeft.value
  if (checked.value || i === null) return
  pairMap.value = pairMap.value.map((m) => (m === pos ? null : m))
  pairMap.value[i] = pos
  selectedLeft.value = null
}
const rightOwner = (pos: number): number | null => {
  const i = pairMap.value.indexOf(pos)
  return i >= 0 ? i : null
}

const promptParts = computed(() => {
  const e = ex.value
  return e.type === 'gap' ? e.prompt.split('___') : []
})

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
  if (hasChoices.value && n >= 1 && n <= choices.value.length && target?.tagName !== 'INPUT')
    pick(n - 1)
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
    <button type="button" class="link" @click="$emit('back')">
      ← {{ t('study.lessons.backToLesson') }}
    </button>
    <PxBar :value="idx" :max="total" label="progress" />
    <p class="muted">
      {{ t('study.lessons.counter', { index: idx + 1, total }) }} · {{ lesson.title }}
    </p>

    <PxPanel class="box">
      <!-- Trắc nghiệm -->
      <template v-if="ex.type === 'mcq'">
        <p class="prompt">{{ ex.prompt }}</p>
      </template>

      <!-- Nghe rồi chọn -->
      <template v-else-if="ex.type === 'listen'">
        <p class="prompt">{{ ex.prompt ?? t('study.lessons.listenPrompt') }}</p>
        <div class="play">
          <button type="button" class="play-btn" @click="speak(ex.say, undefined, 0.9)">
            🔊 {{ t('study.lessons.play') }}
          </button>
          <button type="button" class="play-btn" @click="speak(ex.say, undefined, 0.6)">
            🐢 {{ t('study.lessons.slow') }}
          </button>
        </div>
      </template>

      <!-- Đúng / Sai (/ Không có thông tin) -->
      <template v-else-if="ex.type === 'tf'">
        <p class="instruction">
          {{ ex.ng ? t('study.lessons.tfHelpNg') : t('study.lessons.tfHelp') }}
        </p>
        <p class="prompt">{{ ex.statement }}</p>
      </template>

      <!-- Chọn hình -->
      <template v-else-if="ex.type === 'picture'">
        <p class="instruction">
          {{ ex.listen ? t('study.lessons.pictureListen') : t('study.lessons.pictureHelp') }}
        </p>
        <p v-if="!ex.listen" class="prompt">{{ ex.word }}</p>
        <div v-else class="play">
          <button type="button" class="play-btn" @click="speak(ex.word, undefined, 0.9)">
            🔊 {{ t('study.lessons.play') }}
          </button>
          <button type="button" class="play-btn" @click="speak(ex.word, undefined, 0.6)">
            🐢 {{ t('study.lessons.slow') }}
          </button>
        </div>
      </template>

      <!-- Điền chỗ trống -->
      <template v-else-if="ex.type === 'gap'">
        <p class="instruction">{{ t('study.lessons.gapHelp') }}</p>
        <p class="prompt">
          {{ promptParts[0]
          }}<span class="blank">{{
            checked ? ex.answers[0] : chosen !== null && ex.choices ? ex.choices[chosen] : '＿＿＿'
          }}</span
          >{{ promptParts[1] }}
        </p>
        <input
          v-if="!ex.choices"
          ref="typedInput"
          v-model="typed"
          type="text"
          class="typed"
          spellcheck="false"
          autocomplete="off"
          :disabled="checked"
          :placeholder="t('study.lessons.typeHere')"
        />
      </template>

      <!-- Sắp xếp câu -->
      <template v-else-if="ex.type === 'order'">
        <p class="instruction">{{ t('study.lessons.orderHelp') }}</p>
        <p class="prompt vi">{{ ex.hint }}</p>
        <div class="answer-line">
          <button
            v-for="(tokenIdx, pos) in picked"
            :key="pos"
            type="button"
            class="token placed"
            :disabled="checked"
            @click="unpickToken(pos)"
          >
            {{ tokens[tokenIdx] }}
          </button>
          <span v-if="!picked.length" class="muted">…</span>
        </div>
        <div class="pool">
          <button
            v-for="(tok, i) in tokens"
            :key="i"
            type="button"
            class="token"
            :disabled="picked.includes(i) || checked"
            @click="pickToken(i)"
          >
            {{ tok }}
          </button>
        </div>
      </template>

      <!-- Ghép cặp -->
      <template v-else-if="ex.type === 'match'">
        <p class="instruction">{{ ex.prompt ?? t('study.lessons.matchHelp') }}</p>
        <div class="pairs">
          <div class="col">
            <button
              v-for="(p, i) in ex.pairs"
              :key="i"
              type="button"
              class="pair"
              :class="{ active: selectedLeft === i, linked: pairMap[i] !== null }"
              :disabled="checked"
              @click="selectLeft(i)"
            >
              {{ p.left }}
              <span v-if="pairMap[i] !== null" class="badge">{{ (pairMap[i] ?? 0) + 1 }}</span>
            </button>
          </div>
          <div class="col">
            <button
              v-for="(pairIdx, pos) in rightOrder"
              :key="pos"
              type="button"
              class="pair"
              :class="{ linked: rightOwner(pos) !== null }"
              :disabled="checked"
              @click="selectRight(pos)"
            >
              <span class="num">{{ pos + 1 }}</span> {{ ex.pairs[pairIdx].right }}
            </button>
          </div>
        </div>
      </template>

      <div v-if="hasChoices" class="choices">
        <button
          v-for="(c, i) in choices"
          :key="i"
          type="button"
          class="choice"
          :class="{ picked: chosen === i && !checked, pic: ex.type === 'picture' }"
          :disabled="checked"
          @click="pick(i)"
        >
          <span class="num">{{ i + 1 }}</span> {{ c }}
        </button>
      </div>

      <div v-if="checked" class="feedback" :class="{ ok: isCorrect }">
        <strong>{{ isCorrect ? t('study.lessons.correct') : t('study.lessons.wrong') }}</strong>
        <div v-if="!isCorrect" class="solution">{{ solution(ex) }}</div>
        <div v-if="'explain' in ex && ex.explain" class="explain">💡 {{ ex.explain }}</div>
      </div>
    </PxPanel>

    <div class="actions">
      <button v-if="!checked" type="button" class="primary" :disabled="!canCheck" @click="check">
        {{ t('study.lessons.check') }}
      </button>
      <button v-else type="button" class="primary" @click="next">
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
.link {
  justify-self: start;
  border: none;
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  cursor: pointer;
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
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  font-size: 16px;
  outline: none;
}
.typed:focus {
  box-shadow: var(--px) var(--px) 0 0 var(--c-primary);
}
.play {
  display: flex;
  gap: 8px;
}
.play-btn {
  padding: 8px 14px;
  border: var(--px) solid var(--c-border);
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
.choice.picked {
  background: var(--c-primary);
  color: #fff;
}
.choice:hover:not(:disabled):not(.picked) {
  background: #eef3ff;
}
.num {
  display: inline-block;
  width: 18px;
  font-weight: 700;
  opacity: 0.6;
}
.answer-line,
.pool {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 42px;
  padding: 8px;
}
.answer-line {
  border-bottom: 2px dashed var(--c-ink-soft);
}
.token {
  padding: 6px 12px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}
.token.placed {
  background: var(--c-primary);
  color: #fff;
}
.token:disabled:not(.placed) {
  opacity: 0.3;
  cursor: default;
}
.pairs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.col {
  display: grid;
  gap: 8px;
  align-content: start;
}
.pair {
  position: relative;
  padding: 8px 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-bg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.pair.active {
  background: var(--c-warning);
}
.pair.linked {
  background: #dff3e4;
}
.badge {
  position: absolute;
  top: 4px;
  right: 6px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--c-xp);
}
.feedback {
  padding: 8px 10px;
  color: var(--c-danger);
  background: #fde8e8;
  border-left: 4px solid var(--c-danger);
}
.feedback.ok {
  color: var(--c-success);
  background: #e3f4e8;
  border-left-color: var(--c-success);
}
.solution {
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
.primary {
  min-width: 180px;
  padding: 10px 20px;
  border: var(--px) solid var(--c-border);
  background: var(--c-primary);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.primary:disabled {
  opacity: 0.5;
  cursor: default;
}
.choice.pic {
  min-width: 72px;
  font-size: 34px;
  line-height: 1.2;
}
</style>
