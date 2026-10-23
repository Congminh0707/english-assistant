<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KidsActivity, KidsCompleteResult, KidsItem } from '@shared/schemas/kids'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'
import TraceCanvas from './TraceCanvas.vue'
import { FOOD_NAME, FOOD_PICTURE, PRAISE, pick, TRY_AGAIN } from './kidsText'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Một hoạt động của bé: học (chạm để nghe từng chữ/âm/từ) rồi chơi (nghe → chạm đúng). Không cần biết đọc:
// chữ cái và từ chỉ cần nhận mặt, câu hỏi luôn được đọc to.
const props = defineProps<{ activity: KidsActivity }>()
const emit = defineEmits<{ back: []; changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()

type Phase = 'teach' | 'quiz' | 'trace' | 'say' | 'result'
const phase = ref<Phase>('teach')
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
  if (index.value + 1 < items.value.length) {
    index.value++
    teachSpeak()
  } else startQuiz()
}

function prevTeach(): void {
  if (index.value > 0) {
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
  if (passed) firstTry.value++
  if (q.value + 1 < questions.value.length) {
    q.value++
    if (phase.value === 'say') sayPrompt()
  } else void finish()
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

const stars = (n: number): string => '★'.repeat(n) + '☆'.repeat(3 - n)

onMounted(teachSpeak)
</script>

<template>
  <section class="k-screen">
    <!-- HỌC -->
    <template v-if="phase === 'teach'">
      <p class="k-sub">{{ index + 1 }} / {{ items.length }}</p>
      <button type="button" class="k-big card" @click="teachSpeak">
        <template v-if="activity.kind === 'letters' || activity.kind === 'trace'">
          <span class="letter"
            >{{ item.text }}<small>{{ item.text.toLowerCase() }}</small></span
          >
          <PixelPicture v-if="item.picture" :id="item.picture" :size="150" />
          <span v-if="item.word" class="word">{{ item.word }}</span>
        </template>
        <template v-else-if="activity.kind === 'sounds'">
          <span class="letter">{{ item.text }}</span>
          <PixelPicture v-if="item.picture" :id="item.picture" :size="150" />
          <span v-if="item.word" class="word">{{ item.word }}</span>
        </template>
        <template v-else-if="activity.kind === 'blend'">
          <PixelPicture v-if="item.picture" :id="item.picture" :size="150" />
          <span class="word">{{ item.text }}</span>
        </template>
        <template v-else-if="activity.kind === 'book'">
          <PixelPicture v-if="item.picture" :id="item.picture" :size="190" />
          <span class="sentence">{{ item.text }}</span>
        </template>
        <template v-else-if="activity.kind === 'speak'">
          <PixelPicture v-if="item.picture" :id="item.picture" :size="170" />
          <span class="word">{{ item.text }}</span>
        </template>
        <template v-else>
          <span class="sight">{{ item.text }}</span>
        </template>
        <span class="speaker"><UiIcon name="volume" /></span>
      </button>

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
        <button type="button" class="k-round" @click="sayItem(item)"><UiIcon name="play" /></button>
      </div>

      <div class="k-row">
        <button type="button" class="k-round" :disabled="index === 0" @click="prevTeach">◀</button>
        <button type="button" class="k-primary" @click="nextTeach">
          <UiIcon :name="index + 1 < items.length ? 'play' : 'game'" :size="26" />
        </button>
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
        <UiIcon name="volume" />
      </button>
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
          <PixelPicture v-if="pictureQuiz" :id="c" :size="150" />
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
      <PixelPicture
        v-if="questions[q].item.picture"
        :id="questions[q].item.picture ?? ''"
        :size="170"
      />
      <span class="word">{{ questions[q].item.text }}</span>
      <div class="k-row">
        <button type="button" class="k-round big-speaker" @click="sayPrompt">
          <UiIcon name="volume" />
        </button>
        <button type="button" class="k-primary mic" @click="saidIt">
          <UiIcon name="mic" /> <UiIcon name="check" />
        </button>
      </div>
      <p class="k-sub">{{ t('kids.activity.sayHint') }}</p>
    </template>

    <!-- KẾT QUẢ -->
    <template v-else-if="phase === 'result' && result">
      <h1 class="k-title">
        {{ result.stars >= 3 ? 'Perfect!' : result.stars >= 2 ? 'Great job!' : 'Good try!' }}
      </h1>
      <p class="k-stars big-stars">{{ stars(result.stars) }}</p>
      <div v-if="result.foodId" class="gift">
        <PixelPicture :id="FOOD_PICTURE[result.foodId] ?? 'cake'" :size="120" />
        <strong>{{ t('kids.review.present') }}</strong>
      </div>
      <div class="k-row">
        <button type="button" class="k-round" :title="t('kids.activity.again')" @click="again">
          ↻
        </button>
        <button type="button" class="k-primary" @click="emit('back')">
          <UiIcon name="play" />
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.card {
  min-width: 280px;
  padding: 20px 30px;
}
.letter {
  font-size: 96px;
  line-height: 1;
}
.letter small {
  margin-left: 14px;
  font-size: 64px;
  color: var(--c-primary);
}
.word {
  font-size: 34px;
}
.sentence {
  max-width: 440px;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.3;
  text-align: center;
}
.mic {
  font-size: 28px;
}
.sight {
  font-size: 96px;
  line-height: 1.1;
}
.speaker {
  font-size: 24px;
}
.tile {
  min-width: 90px;
  font-size: 46px;
}
.big-speaker {
  width: 96px;
  height: 96px;
  font-size: 46px;
  background: var(--c-warning-soft);
}
.choice {
  padding: 16px 22px;
  min-width: 170px;
}
.quiz-text {
  font-size: 80px;
  line-height: 1.1;
}
.big-stars {
  font-size: 60px;
  color: #e0a620;
}
.gift {
  display: grid;
  gap: 6px;
  justify-items: center;
  animation: k-pop 420ms ease;
}
</style>
