<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KidsVisit, KidsVisitDoneResult } from '@shared/schemas/kidsWorld'
import { invoke } from '@renderer/shared/ipc'
import { useTts } from '@renderer/shared/composables/useTts'
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { FOOD_PICTURE, PRAISE, pick, TRY_AGAIN } from './kidsText'

// Lượt chơi tại một nơi trên bản đồ (docs/19-kids-world.md §3.2): một đợt ≤ 4 từ đi qua 5 bước
// 1 làm quen → 2 chạm hình (chấm FSRS qua kids:rate) → 3 lật thẻ ghép cặp → 4 nói theo (không chấm, không ghi âm)
// → 5 nghe câu rồi chạm hình. Xong lượt gửi kids:visit-done; lần đầu xong nơi được mở rương.
const props = defineProps<{ placeId: string }>()
const emit = defineEmits<{ back: []; changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()

type Step = 'intro' | 'tap' | 'play' | 'speak' | 'sentence' | 'done' | 'empty'
const visit = ref<KidsVisit | null>(null)
const step = ref<Step>('intro')
const index = ref(0)
const wrong = ref<string[]>([])
const solved = ref(false)
const result = ref<KidsVisitDoneResult | null>(null)
let shownAt = 0
let busy = false

interface Track {
  tapTries: 0 | 1 | 2
  sentenceTries: 0 | 1 | 2
  played: boolean
  spoke: boolean
}
const tracks = ref<Record<string, Track>>({})

const item = computed(() => visit.value?.batch[index.value] ?? null)
const STEPS: Step[] = ['intro', 'tap', 'play', 'speak', 'sentence']
const stepNo = computed(() => STEPS.indexOf(step.value) + 1)

async function load(): Promise<void> {
  const v = await invoke('kids:visit', { placeId: props.placeId })
  visit.value = v
  emit('changed')
  if (v.batch.length === 0) {
    step.value = 'empty'
    speak('See you tomorrow!', 'us', 0.9)
    return
  }
  tracks.value = Object.fromEntries(
    v.batch.map((b) => [
      b.pictureId,
      { tapTries: 0, sentenceTries: 0, played: false, spoke: false }
    ])
  )
  // Từ đã học trước (không mới) thì bỏ bước làm quen
  begin(v.batch.some((b) => b.isNew) ? 'intro' : 'tap')
}

function begin(s: Step): void {
  step.value = s
  index.value = 0
  if (s === 'intro') skipKnown()
  if (s === 'play') setupPairs()
  present()
}

/** Bước làm quen chỉ cho từ mới */
function skipKnown(): void {
  while (item.value && !item.value.isNew) index.value++
}

function present(): void {
  wrong.value = []
  solved.value = false
  shownAt = performance.now()
  const it = item.value
  if (!it) return
  if (step.value === 'intro') speak(`${it.word}. ${it.word}.`, 'us', 0.75)
  else if (step.value === 'tap') speak(it.word, 'us', 0.8)
  else if (step.value === 'speak') speak(`Say: ${it.word}`, 'us', 0.8)
  else if (step.value === 'sentence') speak(it.sentence.en, 'us', 0.8)
}

function nextItem(): void {
  index.value++
  if (step.value === 'intro') skipKnown()
  if (item.value) present()
  else {
    const at = STEPS.indexOf(step.value)
    if (at + 1 < STEPS.length) begin(STEPS[at + 1])
    else void finish()
  }
}

async function choose(pictureId: string): Promise<void> {
  const it = item.value
  if (!it || solved.value || busy || wrong.value.includes(pictureId)) return
  busy = true
  try {
    const right = pictureId === it.pictureId
    if (!right && wrong.value.length === 0) {
      wrong.value.push(pictureId)
      speak(pick(TRY_AGAIN), 'us', 0.9)
      return
    }
    if (!right) wrong.value.push(pictureId)
    solved.value = true
    const tries: 0 | 1 | 2 = right ? (wrong.value.length === 0 ? 1 : 2) : 0
    speak(right ? `${pick(PRAISE)} ${it.word}` : `It is ${it.word}`, 'us', 0.9)
    const track = tracks.value[it.pictureId]
    if (step.value === 'tap') {
      track.tapTries = tries
      await invoke('kids:rate', {
        cardId: it.cardId,
        tries,
        elapsedMs: Math.round(performance.now() - shownAt)
      })
    } else track.sentenceTries = tries
    window.setTimeout(nextItem, right ? 1200 : 2000)
  } finally {
    busy = false
  }
}

// --- Bước 3: lật thẻ ghép cặp ---
interface Card {
  key: number
  pictureId: string
  open: boolean
  matched: boolean
}
const cards = ref<Card[]>([])
let firstOpen: Card | null = null

function setupPairs(): void {
  const ids = visit.value?.batch.map((b) => b.pictureId) ?? []
  const deck = [...ids, ...ids].map((pictureId, key) => ({
    key,
    pictureId,
    open: false,
    matched: false
  }))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  cards.value = deck
  firstOpen = null
  speak('Find the pairs!', 'us', 0.9)
}

function flip(card: Card): void {
  if (card.open || card.matched || busy) return
  card.open = true
  const word = visit.value?.batch.find((b) => b.pictureId === card.pictureId)?.word ?? ''
  speak(word, 'us', 0.85)
  if (!firstOpen) {
    firstOpen = card
    return
  }
  const a = firstOpen
  firstOpen = null
  if (a.pictureId === card.pictureId) {
    a.matched = card.matched = true
    tracks.value[card.pictureId].played = true
    if (cards.value.every((c) => c.matched)) {
      speak(pick(PRAISE), 'us', 0.9)
      window.setTimeout(() => begin('speak'), 1200)
    }
  } else {
    busy = true
    window.setTimeout(() => {
      a.open = card.open = false
      busy = false
    }, 900)
  }
}

// --- Bước 4: nói theo (bé tự bấm sao, không chấm) ---
function spoke(): void {
  const it = item.value
  if (!it) return
  tracks.value[it.pictureId].spoke = true
  speak(pick(PRAISE), 'us', 0.9)
  window.setTimeout(nextItem, 900)
}

async function finish(): Promise<void> {
  const v = visit.value
  if (!v) return
  result.value = await invoke('kids:visit-done', {
    placeId: v.placeId,
    results: v.batch.map((b) => ({ pictureId: b.pictureId, ...tracks.value[b.pictureId] }))
  })
  step.value = 'done'
  emit('changed')
  const r = result.value
  speak(
    r.firstTime ? 'You did it! Open the treasure!' : r.stars >= 3 ? 'Perfect!' : 'Great job!',
    'us',
    0.9
  )
}

onMounted(load)
</script>

<template>
  <section class="k-screen">
    <p v-if="!visit" class="k-sub">…</p>

    <template v-else-if="step === 'empty'">
      <PixelPicture id="moon" :size="170" />
      <h1 class="k-title">See you tomorrow!</h1>
      <p class="k-sub">{{ t('kids.world.tomorrow') }}</p>
      <button type="button" class="k-primary" @click="emit('back')"><UiIcon name="map" /></button>
    </template>

    <template v-else-if="step === 'done' && result">
      <PixelPicture :id="result.firstTime ? 'gift' : 'star'" :size="150" />
      <h1 class="k-title">{{ result.placeDone ? 'You did it!' : 'Great job!' }}</h1>
      <p class="k-row stars">
        <UiIcon
          v-for="n in 3"
          :key="n"
          name="star"
          :size="44"
          :class="{ lit: n <= result.stars }"
        />
      </p>
      <div v-if="result.foodId" class="pop">
        <PixelPicture :id="FOOD_PICTURE[result.foodId] ?? 'cake'" :size="96" />
        <strong>{{ t('kids.world.chest') }}</strong>
      </div>
      <p v-if="result.tierUnlocked" class="k-sub">{{ t('kids.world.tierOpen') }}</p>
      <button type="button" class="k-primary" @click="emit('back')"><UiIcon name="map" /></button>
    </template>

    <template v-else>
      <ol class="steps" :aria-label="t('kids.world.steps')">
        <li
          v-for="(s, i) in STEPS"
          :key="s"
          :class="{ on: i + 1 === stepNo, past: i + 1 < stepNo }"
        />
      </ol>

      <!-- 1. Làm quen -->
      <template v-if="step === 'intro' && item">
        <button type="button" class="k-big hero" @click="speak(item.word, 'us', 0.75)">
          <PixelPicture :id="item.pictureId" :size="220" />
          <span class="word">{{ item.word }}</span>
        </button>
        <p class="k-sub">{{ item.vi }}</p>
        <button
          type="button"
          class="k-primary"
          :aria-label="t('kids.world.next')"
          @click="nextItem"
        >
          <UiIcon name="next" :size="28" />
        </button>
      </template>

      <!-- 2. Chạm hình / 5. Nghe câu -->
      <template v-else-if="(step === 'tap' || step === 'sentence') && item">
        <button type="button" class="k-round big-speaker" @click="present">
          <UiIcon name="volume" :size="40" />
        </button>
        <p v-if="step === 'sentence'" class="k-sub">{{ item.sentence.vi }}</p>
        <div class="k-row">
          <button
            v-for="id in item.choices"
            :key="id"
            type="button"
            class="k-big choice"
            :class="{ right: solved && id === item.pictureId, wrong: wrong.includes(id) }"
            :disabled="solved || wrong.includes(id)"
            @click="choose(id)"
          >
            <PixelPicture :id="id" :size="150" />
          </button>
        </div>
        <p v-if="solved" class="answer">{{ step === 'sentence' ? item.sentence.en : item.word }}</p>
      </template>

      <!-- 3. Lật thẻ ghép cặp -->
      <template v-else-if="step === 'play'">
        <h1 class="k-title">Find the pairs!</h1>
        <div
          class="pairs"
          :style="{ gridTemplateColumns: `repeat(${Math.min(4, cards.length)}, auto)` }"
        >
          <button
            v-for="c in cards"
            :key="c.key"
            type="button"
            class="k-big flip"
            :class="{ right: c.matched }"
            @click="flip(c)"
          >
            <PixelPicture v-if="c.open || c.matched" :id="c.pictureId" :size="96" />
            <UiIcon v-else name="star" :size="48" />
          </button>
        </div>
      </template>

      <!-- 4. Nói theo -->
      <template v-else-if="step === 'speak' && item">
        <PixelPicture :id="item.pictureId" :size="200" />
        <div class="k-row">
          <button type="button" class="k-round big-speaker" @click="present">
            <UiIcon name="volume" :size="40" />
          </button>
          <button
            type="button"
            class="k-round big-star"
            :title="t('kids.world.spoke')"
            @click="spoke"
          >
            <UiIcon name="star" :size="40" />
          </button>
        </div>
        <p class="k-sub">{{ t('kids.world.sayHint') }}</p>
      </template>
    </template>
  </section>
</template>

<style scoped>
.steps {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.steps li {
  width: 34px;
  height: 10px;
  border-radius: 999px;
  background: var(--c-line);
}
.steps li.past {
  background: var(--c-success);
}
.steps li.on {
  background: var(--c-primary);
}
.hero {
  padding: 18px 26px;
}
.word,
.answer {
  font-size: 38px;
  font-weight: 800;
  color: var(--c-primary);
}
.answer {
  margin: 0;
}
.big-speaker {
  width: 96px;
  height: 96px;
  background: #fff3a0;
}
.big-star {
  width: 96px;
  height: 96px;
  background: var(--c-warning-soft);
  color: #e8a400;
}
.choice {
  padding: 12px;
}
.pairs {
  display: grid;
  gap: 14px;
}
.flip {
  width: 128px;
  height: 128px;
  min-width: 0;
  place-content: center;
  color: var(--c-primary);
}
.stars {
  margin: 0;
  gap: 6px;
  color: var(--c-line);
}
.stars .lit {
  color: #e0a620;
  fill: #ffd34d;
}
.pop {
  display: grid;
  gap: 6px;
  justify-items: center;
  padding: 14px 28px;
  border: 2px solid var(--c-line);
  border-radius: 18px;
  background: var(--c-warning-soft);
  font-size: 22px;
  animation: k-pop 420ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .pop {
    animation: none;
  }
}
</style>
