<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KidsActivity, KidsCompleteResult, KidsItem } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PictureImage from '@renderer/shared/components/PictureImage.vue'
import SpeakPractice from '@renderer/shared/components/SpeakPractice.vue'
import { useStt } from '@renderer/shared/composables/useStt'
import TraceCanvas from './TraceCanvas.vue'
import { FOOD_NAME, FOOD_PICTURE, PRAISE, pick, TRY_AGAIN } from './kidsText'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { useLeaveGuard } from '../leaveGuard'

// Một hoạt động của bé: học (chạm để nghe từng chữ/âm/từ) rồi chơi (nghe → chạm đúng). Không cần biết đọc:
// chữ cái và từ chỉ cần nhận mặt, câu hỏi luôn được đọc to.
const props = defineProps<{ activity: KidsActivity }>()
const emit = defineEmits<{ back: []; changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()
const stt = useStt()

// Chấm phát âm theo âm vị (model tuỳ chọn, phụ huynh tải trong Cài đặt): có thì bé nói thật và được chấm, chưa có thì như cũ
const pronReady = computed(() => stt.pronunciation.value?.state === 'ready')
/** Kết quả lần nói đầu của mục hiện tại: null = chưa nói; true = đạt (verdict không phải 'retry') */
const scoredFirst = ref<boolean | null>(null)
/** Ở màn học: bật khung nói thử cho mục hiện tại */
const practice = ref(false)
const practiceWord = computed(() =>
  props.activity.kind === 'blend' ? item.value?.text : item.value?.word
)
const canPractice = computed(
  () => pronReady.value && !!practiceWord.value && props.activity.kind !== 'sight'
)

type Phase = 'teach' | 'quiz' | 'trace' | 'say' | 'result'
const phase = ref<Phase>('teach')
useLeaveGuard(() => phase.value === 'quiz' || phase.value === 'trace' || phase.value === 'say')
const index = ref(0)
const items = computed(() => props.activity.items)
const item = computed(() => items.value[index.value])

// --- Học ---
const sayItem = (i: KidsItem): void => speak(i.say ?? i.text, 'us', 0.8)

function teachSpeak(): void {
  const i = item.value
  if (props.activity.kind === 'letters' || props.activity.kind === 'trace')
    speak(`${i.say}. ${i.text.toLowerCase()}. ${i.word ?? ''}`, 'us', 0.8)
  else sayItem(i)
}

function nextTeach(): void {
  practice.value = false
  if (index.value + 1 < items.value.length) {
    index.value++
    teachSpeak()
  } else startQuiz()
}

function prevTeach(): void {
  if (index.value > 0) {
    practice.value = false
    index.value--
    teachSpeak()
  }
}

/** Ghép âm: bấm từng chữ nghe âm, hoặc nghe cả từ */
function soundOf(i: KidsItem, k: number): void {
  speak(i.sounds?.[k] ?? i.letters?.[k] ?? '', 'us', 0.7)
}

// --- Chơi ---
interface Question {
  item: KidsItem
  /** Các lựa chọn: id hình (sounds/blend) hoặc chữ/từ (letters/sight) */
  choices: string[]
  answer: string
}

const questions = ref<Question[]>([])
const q = ref(0)
const wrongPicks = ref<string[]>([])
const solved = ref(false)
const firstTry = ref(0)
const result = ref<KidsCompleteResult | null>(null)

const pictureQuiz = computed(
  () =>
    props.activity.kind === 'sounds' ||
    props.activity.kind === 'blend' ||
    props.activity.kind === 'book'
)

function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function buildQuestions(): Question[] {
  const key = (i: KidsItem): string => (pictureQuiz.value ? (i.picture ?? i.text) : i.text)
  return shuffle(items.value).map((it) => {
    const others = shuffle(items.value.filter((o) => key(o) !== key(it)))
      .slice(0, 2)
      .map(key)
    return { item: it, answer: key(it), choices: shuffle([key(it), ...others]) }
  })
}

function ask(): void {
  const question = questions.value[q.value]
  wrongPicks.value = []
  solved.value = false
  if (question) {
    // Chữ cái: đọc tên chữ; âm/ghép âm/từ: đọc cả âm hoặc từ
    speak(question.item.say ?? question.item.text, 'us', 0.8)
  }
}

function startQuiz(): void {
  q.value = 0
  firstTry.value = 0
  if (props.activity.kind === 'trace' || props.activity.kind === 'speak') {
    // Tập viết / nói lặp lại: mỗi mục một lượt, không có câu hỏi chọn
    questions.value = items.value.map((it) => ({ item: it, answer: it.text, choices: [] }))
    phase.value = props.activity.kind === 'trace' ? 'trace' : 'say'
    if (phase.value === 'say') sayPrompt()
    return
  }
  questions.value = buildQuestions()
  phase.value = 'quiz'
  ask()
}

// --- Nói lặp lại: nghe rồi nói; bé tự bấm "đã nói" (chưa chấm giọng) ---
function sayPrompt(): void {
  const it = questions.value[q.value]?.item
  if (it) speak(`Say: ${it.say ?? it.text}`, 'us', 0.8)
}

function advanceStep(passed: boolean): void {
  scoredFirst.value = null
  if (passed) firstTry.value++
  if (q.value + 1 < questions.value.length) {
    q.value++
    if (phase.value === 'say') sayPrompt()
  } else void finish()
}

function onScored(score: { verdict: string }): void {
  if (scoredFirst.value === null) scoredFirst.value = score.verdict !== 'retry'
}

function saidIt(): void {
  speak(`${pick(PRAISE)}`, 'us', 0.9)
  window.setTimeout(() => advanceStep(true), 900)
}

async function choose(choice: string): Promise<void> {
  const question = questions.value[q.value]
  if (!question || solved.value || wrongPicks.value.includes(choice)) return
  if (choice === question.answer) {
    solved.value = true
    if (wrongPicks.value.length === 0) firstTry.value++
    speak(
      `${pick(PRAISE)} ${question.item.word ?? question.item.say ?? question.item.text}`,
      'us',
      0.9
    )
    window.setTimeout(async () => {
      if (q.value + 1 < questions.value.length) {
        q.value++
        ask()
      } else await finish()
    }, 1300)
  } else {
    wrongPicks.value.push(choice)
    speak(pick(TRY_AGAIN), 'us', 0.9)
  }
}

async function finish(): Promise<void> {
  result.value = await invoke('kids:complete', {
    activityId: props.activity.id,
    correct: firstTry.value,
    total: questions.value.length
  })
  phase.value = 'result'
  emit('changed')
  const r = result.value
  speak(r.stars >= 3 ? 'Perfect!' : r.stars >= 2 ? 'Great job!' : 'Good try!', 'us', 0.9)
  if (r.foodId)
    window.setTimeout(
      () => speak(`A present! ${FOOD_NAME[r.foodId ?? ''] ?? 'food'}!`, 'us', 0.9),
      1400
    )
}

function again(): void {
  index.value = 0
  phase.value = 'teach'
  result.value = null
  teachSpeak()
}

onMounted(teachSpeak)
</script>

<template>
  <section class="k-screen">
    <!-- HỌC -->
    <template v-if="phase === 'teach'">
      <p class="k-sub">{{ index + 1 }} / {{ items.length }}</p>
      <div class="stage">
        <button
          type="button"
          class="k-round side"
          :disabled="index === 0"
          :aria-label="t('kids.activity.prev')"
          @click="prevTeach"
        >
          <UiIcon name="back" :size="32" />
        </button>
        <button type="button" class="k-big face" @click="teachSpeak">
          <template v-if="activity.kind === 'letters' || activity.kind === 'trace'">
            <span class="letter"
              >{{ item.text }}<small>{{ item.text.toLowerCase() }}</small></span
            >
            <PictureImage v-if="item.picture" :id="item.picture" :size="150" />
            <span v-if="item.word" class="word">{{ item.word }}</span>
          </template>
          <template v-else-if="activity.kind === 'sounds'">
            <span class="letter">{{ item.text }}</span>
            <PictureImage v-if="item.picture" :id="item.picture" :size="150" />
            <span v-if="item.word" class="word">{{ item.word }}</span>
          </template>
          <template v-else-if="activity.kind === 'blend'">
            <PictureImage v-if="item.picture" :id="item.picture" :size="150" />
            <span class="word">{{ item.text }}</span>
          </template>
          <template v-else-if="activity.kind === 'book'">
            <PictureImage v-if="item.picture" :id="item.picture" :size="190" />
            <span class="sentence">{{ item.text }}</span>
          </template>
          <template v-else-if="activity.kind === 'speak'">
            <PictureImage v-if="item.picture" :id="item.picture" :size="170" />
            <span class="word">{{ item.text }}</span>
          </template>
          <template v-else>
            <span class="sight">{{ item.text }}</span>
          </template>
          <span class="speaker"><UiIcon name="volume" :size="28" /></span>
        </button>
        <button
          type="button"
          class="k-primary side"
          :aria-label="t('kids.activity.next')"
          @click="nextTeach"
        >
          <UiIcon :name="index + 1 < items.length ? 'play' : 'game'" :size="36" />
        </button>
      </div>

      <div v-if="activity.kind === 'blend' && item.letters" class="k-row">
        <button
          v-for="(l, k) in item.letters"
          :key="k"
          type="button"
          class="k-big tile"
          @click="soundOf(item, k)"
        >
          {{ l }}
        </button>
        <button type="button" class="k-round" @click="sayItem(item)">
          <UiIcon name="volume" :size="28" />
        </button>
      </div>

      <div v-if="canPractice" class="k-practice">
        <button v-if="!practice" type="button" class="k-round" @click="practice = true">
          <UiIcon name="mic" :size="28" />
        </button>
        <SpeakPractice
          v-else
          :key="index"
          :expected="practiceWord ?? ''"
          phonemes
          phoneme-only
          kids
        />
      </div>
    </template>

    <!-- CHƠI -->
    <template v-else-if="phase === 'quiz' && questions[q]">
      <p class="k-sub">{{ q + 1 }} / {{ questions.length }}</p>
      <button
        type="button"
        class="k-round big-speaker"
        @click="speak(questions[q].item.say ?? questions[q].item.text, 'us', 0.8)"
      >
        <UiIcon name="volume" :size="44" />
      </button>
      <p v-if="wrongPicks.length" class="k-bubble again">Try again!</p>
      <div class="k-row">
        <button
          v-for="c in questions[q].choices"
          :key="c"
          type="button"
          class="k-big choice"
          :class="{ right: solved && c === questions[q].answer, wrong: wrongPicks.includes(c) }"
          :disabled="solved || wrongPicks.includes(c)"
          @click="choose(c)"
        >
          <PictureImage v-if="pictureQuiz" :id="c" :size="150" />
          <span v-else class="quiz-text">{{ c }}</span>
        </button>
      </div>
    </template>

    <!-- TẬP VIẾT -->
    <template v-else-if="phase === 'trace' && questions[q]">
      <p class="k-sub">{{ q + 1 }} / {{ questions.length }}</p>
      <TraceCanvas
        :key="q"
        :letter="questions[q].item.text"
        :say="questions[q].item.say ?? questions[q].item.text"
        @done="advanceStep"
      />
    </template>

    <!-- NÓI LẶP LẠI -->
    <template v-else-if="phase === 'say' && questions[q]">
      <p class="k-sub">{{ q + 1 }} / {{ questions.length }}</p>
      <PictureImage
        v-if="questions[q].item.picture"
        :id="questions[q].item.picture ?? ''"
        :size="170"
      />
      <span class="word">{{ questions[q].item.text }}</span>
      <div class="k-row">
        <button type="button" class="k-round big-speaker" @click="sayPrompt">
          <UiIcon name="volume" :size="44" />
        </button>
        <button v-if="!pronReady" type="button" class="k-primary mic" @click="saidIt">
          <UiIcon name="mic" :size="32" /> <UiIcon name="check" :size="32" />
        </button>
      </div>
      <template v-if="pronReady">
        <SpeakPractice
          :key="q"
          :expected="questions[q].item.text"
          phonemes
          phoneme-only
          kids
          @scored="onScored"
        />
        <!-- Bé luôn được đi tiếp (kể cả khi chưa đạt); lần đầu đạt thì tính là đúng -->
        <button
          v-if="scoredFirst !== null"
          type="button"
          class="k-primary"
          @click="advanceStep(scoredFirst === true)"
        >
          <UiIcon name="play" :size="36" />
        </button>
      </template>
      <p class="k-sub">{{ t(pronReady ? 'kids.activity.sayGraded' : 'kids.activity.sayHint') }}</p>
    </template>

    <!-- KẾT QUẢ -->
    <template v-else-if="phase === 'result' && result">
      <h1 class="k-title">
        {{ result.stars >= 3 ? 'Perfect!' : result.stars >= 2 ? 'Great job!' : 'Good try!' }}
      </h1>
      <p
        class="k-stars big-stars"
        role="img"
        :aria-label="t('kids.units.stars', { n: result.stars })"
      >
        <UiIcon
          v-for="n in 3"
          :key="n"
          name="star"
          :size="72"
          :class="n <= result.stars ? 'on' : 'off'"
        />
      </p>
      <div v-if="result.foodId" class="gift">
        <PictureImage :id="FOOD_PICTURE[result.foodId] ?? 'cake'" :size="120" />
        <strong>{{ t('kids.review.present') }}</strong>
      </div>
      <div class="k-row">
        <button type="button" class="k-round" :title="t('kids.activity.again')" @click="again">
          <UiIcon name="reset" :size="30" />
        </button>
        <button type="button" class="k-primary" @click="emit('back')">
          <UiIcon name="play" :size="36" />
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.stage {
  display: flex;
  align-items: center;
  gap: var(--sp-5);
}
.side {
  flex: none;
}
.face {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3) var(--sp-6);
  min-width: 520px;
  min-height: 300px;
  padding: var(--sp-6) var(--sp-7);
}
.face .word {
  flex-basis: 100%;
  text-align: center;
}
.letter {
  font-size: 112px;
  line-height: 1;
}
.letter small {
  margin-left: var(--sp-4);
  font-size: 72px;
  color: var(--c-xp);
}
.word {
  font-size: 36px;
  color: var(--c-xp);
}
.sentence {
  max-width: 440px;
  font-size: 32px;
  line-height: 1.25;
  text-align: center;
}
.mic {
  font-size: 28px;
}
.sight {
  font-size: 112px;
  line-height: 1.1;
}
.speaker {
  position: absolute;
  top: var(--sp-3);
  right: var(--sp-3);
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: 3px solid var(--c-ink);
  border-radius: var(--r-pill);
  background: var(--c-warning-soft);
  color: var(--c-warning);
}
.tile {
  min-width: 88px;
  min-height: 80px;
  padding: var(--sp-2) var(--sp-4);
  font-size: 44px;
  box-shadow: 0 4px 0 var(--c-ink);
}
.big-speaker {
  width: 96px;
  height: 96px;
  background: var(--c-warning-soft);
  color: var(--c-warning);
}
.again {
  font-size: var(--fs-xl);
}
.choice {
  padding: var(--sp-5) var(--sp-6);
  min-width: 190px;
  min-height: 200px;
}
.quiz-text {
  font-size: 88px;
  line-height: 1.1;
}
.big-stars {
  margin: 0;
  gap: var(--sp-3);
}
.big-stars .on {
  fill: currentcolor;
}
.gift {
  display: grid;
  gap: var(--sp-2);
  justify-items: center;
  padding: var(--sp-4) var(--sp-6);
  border: 4px solid var(--c-warning);
  border-radius: var(--r-lg);
  background: var(--c-warning-soft);
  box-shadow: 0 8px 0 var(--c-warning);
  font-size: 24px;
  animation: k-pop 420ms ease;
}
.k-practice {
  display: grid;
  justify-items: center;
}
@media (prefers-reduced-motion: reduce) {
  .gift {
    animation: none;
  }
}
</style>
