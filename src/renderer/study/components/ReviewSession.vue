<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { checkTyped, type TypedResult } from '@shared/cards'
import type { StudyCard, StudyRating } from '@shared/schemas/study'
import { invoke } from '@renderer/shared/ipc'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import { useTts } from '@renderer/shared/composables/useTts'
import PxBar from '@renderer/shared/components/PxBar.vue'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import { formatInterval } from '../format'

// Phiên ôn thẻ SRS với 4 dạng thẻ: nhận diện (lật thẻ), Việt→Anh (gõ từ), nghe-gõ, điền từ.
// Gõ đáp án thì gợi ý mức chấm (đúng → Được, gần đúng → Khó, sai → Quên); phím 1–4 chấm, U hoặc Ctrl+Z hoàn tác.
const emit = defineEmits<{ exit: []; changed: [] }>()

const { t } = useI18n()
const { speak } = useTts()
const settings = useSettingsStore()

const card = ref<StudyCard | null>(null)
const dueCount = ref(0)
const reviewed = ref(0)
const revealed = ref(false)
const loading = ref(true)
const busy = ref(false)
const typed = ref('')
const checked = ref<TypedResult | null>(null)
const canUndo = ref(false)
const answerInput = ref<HTMLInputElement>()
let shownAt = 0

const total = computed(() => reviewed.value + dueCount.value)
const finished = computed(() => !loading.value && !card.value)

/** Thẻ có ô gõ đáp án: dạng gõ/nghe/điền và người dùng không tắt gõ trong cài đặt */
const typing = computed(
  () => !!card.value && card.value.direction !== 'en_vi' && settings.settings['review.typing']
)

/** Mức chấm gợi ý sau khi gõ: đúng → Được, gần đúng → Khó, sai → Quên */
const suggested = computed<StudyRating | null>(() =>
  checked.value === null
    ? null
    : checked.value === 'correct'
      ? 3
      : checked.value === 'close'
        ? 2
        : 1
)

const ratings = computed(() => [
  { value: 1 as StudyRating, label: t('study.review.again'), tone: 'again' },
  { value: 2 as StudyRating, label: t('study.review.hard'), tone: 'hard' },
  { value: 3 as StudyRating, label: t('study.review.good'), tone: 'good' },
  { value: 4 as StudyRating, label: t('study.review.easy'), tone: 'easy' }
])

function show(next: { card: StudyCard | null; dueCount: number }): void {
  card.value = next.card
  dueCount.value = next.dueCount
  revealed.value = false
  typed.value = ''
  checked.value = null
  shownAt = performance.now()
  const c = next.card
  if (!c) return
  // Thẻ nghe-gõ luôn tự đọc; thẻ nhận diện tự đọc từ nếu bật trong cài đặt
  if (c.direction === 'audio_en') speak(c.lemma)
  else if (c.direction === 'en_vi' && settings.settings['review.autoPlay']) speak(c.lemma)
  if (typing.value) void nextTick(() => answerInput.value?.focus())
}

async function loadNext(): Promise<void> {
  try {
    show(await invoke('study:next'))
  } catch (err) {
    console.warn('[study] next failed', err)
    card.value = null
  } finally {
    loading.value = false
  }
}

function reveal(): void {
  if (card.value && !revealed.value) revealed.value = true
}

function checkAnswer(): void {
  const c = card.value
  if (!c || revealed.value) return
  checked.value = checkTyped(typed.value, c.answers)
  revealed.value = true
  // Sau khi lộ đáp án, đọc lại từ/câu cho đúng
  if (c.direction === 'cloze' && c.cloze)
    speak(`${c.cloze.before}${c.cloze.answer}${c.cloze.after}`)
  else if (c.direction === 'vi_en') speak(c.lemma)
}

async function rate(rating: StudyRating): Promise<void> {
  const current = card.value
  if (!current || !revealed.value || busy.value) return
  busy.value = true
  try {
    await invoke('study:rate', {
      cardId: current.cardId,
      rating,
      elapsedMs: Math.round(performance.now() - shownAt)
    })
    reviewed.value++
    canUndo.value = true
    emit('changed')
    await loadNext()
  } catch (err) {
    console.warn('[study] rate failed', err)
  } finally {
    busy.value = false
  }
}

async function undo(): Promise<void> {
  if (!canUndo.value || busy.value) return
  busy.value = true
  try {
    const res = await invoke('study:undo')
    canUndo.value = false
    if (res.card) {
      reviewed.value = Math.max(0, reviewed.value - 1)
      loading.value = false
      show(res)
      emit('changed')
    }
  } catch (err) {
    console.warn('[study] undo failed', err)
  } finally {
    busy.value = false
  }
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.altKey || e.metaKey) return
  if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    void undo()
    return
  }
  if (e.ctrlKey) return
  const inInput = (e.target as HTMLElement | null)?.tagName === 'INPUT'
  if (inInput && !revealed.value) return // đang gõ đáp án: Enter xử lý ở ô nhập
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (revealed.value) void rate(suggested.value ?? 3)
    else if (!typing.value) reveal()
  } else if (['1', '2', '3', '4'].includes(e.key)) {
    void rate(Number(e.key) as StudyRating)
  } else if (e.key.toLowerCase() === 'u') {
    void undo()
  }
}

watch(
  () => card.value?.cardId,
  () => {
    if (typing.value && !revealed.value) void nextTick(() => answerInput.value?.focus())
  }
)

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  void loadNext()
})
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <section class="review">
    <p v-if="loading" class="muted">…</p>

    <PxPanel v-else-if="finished" class="done">
      <h2>{{ t('study.review.doneTitle') }}</h2>
      <p>{{ t('study.review.doneBody', { n: reviewed }) }}</p>
      <div class="row">
        <button type="button" class="primary" @click="emit('exit')">
          {{ t('study.review.backHome') }}
        </button>
        <button v-if="canUndo" type="button" class="link" @click="undo">
          ↶ {{ t('study.review.undo') }}
        </button>
      </div>
    </PxPanel>

    <template v-else-if="card">
      <div class="progress">
        <PxBar :value="reviewed" :max="Math.max(total, 1)" label="progress" />
        <span class="muted">{{ t('study.review.remaining', { count: dueCount }) }}</span>
      </div>

      <PxPanel class="card">
        <div class="face">
          <span v-if="card.isNew" class="tag new">{{ t('study.review.new') }}</span>
          <span class="tag level">{{ card.level.replace('_', '.') }}</span>
          <span class="tag kind">{{ t(`study.review.kind.${card.direction}`) }}</span>

          <!-- Nhận diện: thấy từ → nhớ nghĩa -->
          <template v-if="card.direction === 'en_vi'">
            <div class="lemma" :class="{ long: card.isPhrase }">{{ card.lemma }}</div>
            <div class="pron">
              <button type="button" class="say" @click="speak(card.lemma, 'us')">
                🔊 US <span v-if="card.ipaUs">{{ card.ipaUs }}</span>
              </button>
              <button type="button" class="say" @click="speak(card.lemma, 'uk')">
                🔊 UK <span v-if="card.ipaUk">{{ card.ipaUk }}</span>
              </button>
              <span class="muted pos">{{ card.pos.join(', ') }}</span>
            </div>
          </template>

          <!-- Việt → Anh: thấy nghĩa → gõ từ -->
          <template v-else-if="card.direction === 'vi_en'">
            <p class="prompt">{{ t('study.review.typeEnglish') }}</p>
            <div class="vi big">{{ card.vi.join('; ') }}</div>
            <span class="muted pos">{{ card.pos.join(', ') }}</span>
          </template>

          <!-- Nghe → gõ -->
          <template v-else-if="card.direction === 'audio_en'">
            <p class="prompt">{{ t('study.review.typeWhatYouHear') }}</p>
            <div class="pron">
              <button type="button" class="say big-say" @click="speak(card.lemma, undefined, 0.9)">
                🔊 {{ t('study.lessons.play') }}
              </button>
              <button type="button" class="say big-say" @click="speak(card.lemma, undefined, 0.6)">
                🐢 {{ t('study.lessons.slow') }}
              </button>
            </div>
          </template>

          <!-- Điền chỗ trống -->
          <template v-else-if="card.cloze">
            <p class="prompt">{{ t('study.review.fillBlank') }}</p>
            <p class="sentence">
              {{ card.cloze.before
              }}<span class="blank" :class="checked">{{
                revealed ? card.cloze.answer : '＿＿＿'
              }}</span
              >{{ card.cloze.after }}
            </p>
            <p v-if="card.hint" class="muted">{{ card.hint }}</p>
          </template>
        </div>

        <!-- Ô gõ đáp án -->
        <form v-if="typing" class="type" @submit.prevent="checkAnswer">
          <input
            ref="answerInput"
            v-model="typed"
            type="text"
            spellcheck="false"
            autocomplete="off"
            :disabled="revealed"
            :placeholder="t('study.review.typeHere')"
          />
          <button v-if="!revealed" type="submit" class="primary" :disabled="!typed.trim()">
            {{ t('study.lessons.check') }}
          </button>
        </form>
        <p v-if="checked" class="result" :class="checked">
          {{ t(`study.review.result.${checked}`) }}
          <strong v-if="checked !== 'correct'">{{ card.answers[0] }}</strong>
        </p>

        <div v-if="revealed" class="back">
          <div v-if="card.direction !== 'en_vi'" class="answer-word">
            {{ card.lemma }}
            <button type="button" class="say mini" @click="speak(card.lemma, 'us')">🔊</button>
            <span v-if="card.ipaUs" class="muted ipa">{{ card.ipaUs }}</span>
          </div>
          <p v-if="card.direction !== 'vi_en'" class="vi">
            <template v-if="card.vi.length">{{ card.vi.join('; ') }}</template>
            <span v-else class="muted">{{ t('study.review.noAnswer') }}</span>
          </p>
          <ol v-if="card.senses.length" class="senses">
            <li v-for="(s, i) in card.senses.slice(0, 3)" :key="i">
              <em>{{ s.pos }}</em> {{ s.en }}
            </li>
          </ol>
          <div v-if="card.context" class="context">
            <span class="muted">{{ t('study.review.context') }}:</span> {{ card.context }}
          </div>
          <div v-for="(ex, i) in card.examples" :key="i" class="example">
            <button type="button" class="say mini" @click="speak(ex.en)">🔊</button>
            <div>
              <div>{{ ex.en }}</div>
              <div v-if="ex.vi" class="muted">{{ ex.vi }}</div>
            </div>
          </div>
        </div>
      </PxPanel>

      <div class="actions">
        <button v-if="!revealed && !typing" type="button" class="primary big" @click="reveal">
          {{ t('study.review.show') }}
        </button>
        <button v-else-if="!revealed" type="button" class="link" @click="reveal">
          {{ t('study.review.giveUp') }}
        </button>
        <div v-else class="rates">
          <button
            v-for="(r, i) in ratings"
            :key="r.value"
            type="button"
            class="rate"
            :class="[r.tone, { suggested: suggested === r.value }]"
            :disabled="busy"
            @click="rate(r.value)"
          >
            <span class="rate-label">{{ r.value }} · {{ r.label }}</span>
            <span class="rate-interval">{{ formatInterval(card.intervals[i], t) }}</span>
          </button>
        </div>
        <div class="row">
          <button v-if="canUndo" type="button" class="link" :disabled="busy" @click="undo">
            ↶ {{ t('study.review.undo') }}
          </button>
          <p class="muted hint">{{ t('study.review.hint') }}</p>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.review {
  display: grid;
  gap: 16px;
  max-width: 640px;
  margin: 0 auto;
}
.muted {
  color: var(--c-ink-soft);
}
.progress {
  display: grid;
  gap: 4px;
  font-size: 12px;
}
.card {
  display: grid;
  gap: 14px;
  padding: 22px 24px;
}
.face {
  text-align: center;
}
.tag {
  display: inline-block;
  margin: 0 3px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  border: 1px solid var(--c-border);
}
.tag.new {
  background: var(--c-success);
}
.tag.level {
  background: var(--c-xp);
}
.tag.kind {
  background: var(--c-ink-soft);
}
.lemma {
  margin: 8px 0;
  font-size: 40px;
  font-weight: 700;
}
.lemma.long {
  font-size: 26px;
  line-height: 1.3;
}
.pron {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pos {
  font-style: italic;
}
.say {
  padding: 2px 8px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.say:hover {
  background: #eef3ff;
}
.say.mini {
  padding: 0 4px;
  align-self: flex-start;
}
.big-say {
  padding: 8px 14px;
  font-size: 14px;
}
.prompt {
  margin: 10px 0 4px;
  font-weight: 600;
  color: var(--c-xp);
}
.sentence {
  margin: 6px 0;
  font-size: 22px;
  line-height: 1.5;
}
.blank {
  display: inline-block;
  min-width: 64px;
  margin: 0 4px;
  padding: 0 6px;
  text-align: center;
  color: var(--c-primary);
  border-bottom: 3px solid var(--c-primary);
}
.blank.correct {
  color: var(--c-success);
  border-color: var(--c-success);
}
.blank.close,
.blank.wrong {
  color: var(--c-danger);
  border-color: var(--c-danger);
}
.type {
  display: flex;
  gap: 8px;
}
.type input {
  box-sizing: border-box;
  flex: 1;
  padding: 10px 12px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  font-size: 18px;
  outline: none;
}
.type input:focus {
  box-shadow: var(--px) var(--px) 0 0 var(--c-primary);
}
.result {
  margin: 0;
  font-weight: 700;
  text-align: center;
}
.result.correct {
  color: var(--c-success);
}
.result.close {
  color: var(--c-warning);
}
.result.wrong {
  color: var(--c-danger);
}
.back {
  display: grid;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px dashed var(--c-ink-soft);
}
.answer-word {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
}
.ipa {
  margin-left: 6px;
  font-size: 14px;
  font-weight: 400;
}
.vi {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
}
.vi.big {
  margin: 6px 0;
}
.senses {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--c-ink-soft);
}
.senses em {
  color: var(--c-ink);
}
.context {
  padding: 6px 8px;
  font-size: 13px;
  background: #fff8dc;
  border-left: 3px solid var(--c-warning);
}
.example {
  display: flex;
  gap: 6px;
  font-size: 13px;
}
.actions {
  display: grid;
  gap: 8px;
  justify-items: center;
}
.primary {
  padding: 8px 18px;
  border: var(--px) solid var(--c-border);
  background: var(--c-primary);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.primary:disabled {
  opacity: 0.6;
  cursor: default;
}
.primary.big {
  min-width: 220px;
  padding: 12px 24px;
  font-size: 16px;
}
.rates {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
}
.rate {
  display: grid;
  gap: 2px;
  padding: 8px 4px;
  border: var(--px) solid var(--c-border);
  color: #fff;
  font: inherit;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.rate:disabled {
  opacity: 0.6;
  cursor: default;
}
.rate:hover:not(:disabled) {
  filter: brightness(1.08);
}
.rate.suggested {
  outline: 3px solid var(--c-ink);
  outline-offset: 2px;
}
.rate-label {
  font-weight: 700;
}
.rate-interval {
  font-size: 12px;
  opacity: 0.9;
}
.rate.again {
  background: var(--c-danger);
}
.rate.hard {
  background: var(--c-warning);
  color: var(--c-ink);
}
.rate.good {
  background: var(--c-success);
}
.rate.easy {
  background: var(--c-primary);
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.link {
  border: none;
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
.hint {
  margin: 0;
  font-size: 12px;
}
.done {
  padding: 24px;
  text-align: center;
}
.done h2 {
  margin: 0 0 8px;
}
</style>
