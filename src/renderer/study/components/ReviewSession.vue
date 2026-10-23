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
import PixelPicture from '@renderer/shared/components/PixelPicture.vue'
import SpeakPractice from '@renderer/shared/components/SpeakPractice.vue'
import { pictureForWord } from '@shared/pictures'
import { formatInterval } from '../format'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

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
/** Thẻ điền từ: số chữ cái đầu đã lộ làm gợi ý (bắt đầu 1, bấm "Gợi ý" để lộ thêm) */
const shownLetters = ref(1)
/** Thẻ nhận diện có trắc nghiệm: lựa chọn đã bấm; mở khung "nói to" (tuỳ chọn) */
const picked = ref<number | null>(null)
const speakOpen = ref(false)
let shownAt = 0

const total = computed(() => reviewed.value + dueCount.value)
const finished = computed(() => !loading.value && !card.value)

/** Thẻ nhận diện đang chờ chọn nghĩa (trắc nghiệm) */
const choiceMode = computed(
  () => !!card.value && card.value.direction === 'en_vi' && !!card.value.choices && !revealed.value
)
/** Có hành động trả lời (gõ hoặc chọn) trước khi lộ đáp án */
const answerable = computed(() => typing.value || choiceMode.value)

/** Câu ngữ cảnh người dùng đã lưu, tách quanh từ cần ôn để tô đậm (giúp phân biệt nghĩa của từ nhiều nghĩa) */
const contextParts = computed(() => {
  const c = card.value
  if (!c?.context || c.direction !== 'en_vi' || c.isPhrase) return null
  const at = c.context.toLowerCase().indexOf(c.lemma.toLowerCase())
  if (at < 0) return { before: c.context, word: '', after: '' }
  return {
    before: c.context.slice(0, at),
    word: c.context.slice(at, at + c.lemma.length),
    after: c.context.slice(at + c.lemma.length)
  }
})

const hintText = computed(() =>
  revealed.value
    ? t('study.review.hintRate')
    : choiceMode.value
      ? t('study.review.hintChoice')
      : typing.value
        ? t('study.review.hintType')
        : t('study.review.hintFlip')
)

/** Hình minh hoạ pixel nếu từ của thẻ có hình (thẻ điền từ dùng hình của từ cần điền làm gợi ý) */
const picture = computed(() => {
  const c = card.value
  if (!c || c.direction === 'audio_en') return undefined
  return pictureForWord(c.direction === 'cloze' && c.cloze ? c.cloze.answer : c.lemma)
})

/** Ô chữ của thẻ điền từ: mỗi chữ cái một ô, chữ đầu (và các chữ đã xin gợi ý) hiện sẵn */
const slots = computed(() => {
  const answer = card.value?.cloze?.answer ?? ''
  return Array.from(answer).map((ch, i) => ({
    ch,
    shown: revealed.value || i < shownLetters.value || !/[a-z]/i.test(ch)
  }))
})
const canHintMore = computed(
  () => !revealed.value && shownLetters.value < (card.value?.cloze?.answer.length ?? 0) - 1
)

/** Nghe cả câu (gợi ý bằng tai); câu có đáp án nên chỉ nên dùng khi cần */
function speakSentence(): void {
  const c = card.value?.cloze
  if (c) speak(`${c.before}${c.answer}${c.after}`, undefined, 0.9)
}

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
  shownLetters.value = 1
  picked.value = null
  speakOpen.value = false
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

/** Chọn một nghĩa: lộ đáp án ngay, đúng → gợi ý "Được", sai → gợi ý "Quên" */
function pickChoice(i: number): void {
  const c = card.value
  if (!c || !c.choices || revealed.value || busy.value) return
  picked.value = i
  checked.value = i === c.choiceAnswer ? 'correct' : 'wrong'
  revealed.value = true
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
  // Đang dùng khung "nói to": phím Space/Enter/số thuộc về các nút trong khung đó
  if ((e.target as HTMLElement | null)?.closest?.('.speak-panel')) return
  const inInput = (e.target as HTMLElement | null)?.tagName === 'INPUT'
  if (inInput && !revealed.value) return // đang gõ đáp án: Enter xử lý ở ô nhập
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (revealed.value) void rate(suggested.value ?? 3)
    else if (!answerable.value) reveal()
  } else if (['1', '2', '3', '4'].includes(e.key)) {
    if (choiceMode.value) pickChoice(Number(e.key) - 1)
    else void rate(Number(e.key) as StudyRating)
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
        <button type="button" class="btn btn--primary" @click="emit('exit')">
          {{ t('study.review.backHome') }}
        </button>
        <button v-if="canUndo" type="button" class="btn btn--ghost btn--sm" @click="undo">
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

          <PixelPicture v-if="picture" :id="picture" :size="96" class="pic" />

          <!-- Nhận diện: thấy từ → nhớ nghĩa -->
          <template v-if="card.direction === 'en_vi'">
            <div class="lemma" :class="{ long: card.isPhrase }">{{ card.lemma }}</div>
            <div class="pron">
              <button type="button" class="btn btn--sm" @click="speak(card.lemma, 'us')">
                <UiIcon name="volume" /> US <span v-if="card.ipaUs">{{ card.ipaUs }}</span>
              </button>
              <button type="button" class="btn btn--sm" @click="speak(card.lemma, 'uk')">
                <UiIcon name="volume" /> UK <span v-if="card.ipaUk">{{ card.ipaUk }}</span>
              </button>
              <span class="muted pos">{{ card.pos.join(', ') }}</span>
            </div>
            <p v-if="contextParts" class="ctx">
              “{{ contextParts.before }}<mark v-if="contextParts.word">{{ contextParts.word }}</mark
              >{{ contextParts.after }}”
            </p>
            <ul v-if="card.choices" class="choices">
              <li v-for="(opt, i) in card.choices" :key="i">
                <button
                  type="button"
                  class="choice"
                  :class="{
                    right: revealed && i === card.choiceAnswer,
                    wrong: revealed && picked === i && i !== card.choiceAnswer
                  }"
                  :disabled="revealed"
                  @click="pickChoice(i)"
                >
                  <kbd>{{ i + 1 }}</kbd> {{ opt }}
                </button>
              </li>
            </ul>
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
              <button type="button" class="btn btn--sm" @click="speak(card.lemma, undefined, 0.9)">
                <UiIcon name="volume" /> {{ t('study.lessons.play') }}
              </button>
              <button type="button" class="btn btn--sm" @click="speak(card.lemma, undefined, 0.6)">
                <UiIcon name="slow" /> {{ t('study.lessons.slow') }}
              </button>
            </div>
          </template>

          <!-- Điền chỗ trống -->
          <template v-else-if="card.cloze">
            <p class="prompt">{{ t('study.review.fillBlank') }}</p>
            <p class="sentence">
              {{ card.cloze.before
              }}<span class="slots" :class="checked"
                ><span v-for="(s, i) in slots" :key="i" class="slot" :class="{ shown: s.shown }">{{
                  s.shown ? s.ch : ''
                }}</span></span
              >{{ card.cloze.after }}
            </p>
            <p v-if="card.hint" class="muted sentence-vi">{{ card.hint }}</p>
            <p v-if="card.vi.length === 1" class="meaning">
              {{ t('study.review.meaning') }}: <strong>{{ card.vi.join('; ') }}</strong> ·
              {{ t('study.review.letters', { n: card.cloze.answer.length }) }}
            </p>
            <div v-if="!revealed" class="cloze-tools">
              <button type="button" class="btn btn--sm" @click="speakSentence">
                <UiIcon name="volume" /> {{ t('study.review.hearSentence') }}
              </button>
              <button v-if="canHintMore" type="button" class="btn btn--sm" @click="shownLetters++">
                <UiIcon name="hint" /> {{ t('study.review.moreHint') }}
              </button>
            </div>
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
          <button v-if="!revealed" type="submit" class="btn btn--primary" :disabled="!typed.trim()">
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
            <button type="button" class="btn btn--xs btn--icon" @click="speak(card.lemma, 'us')">
              <UiIcon name="volume" />
            </button>
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
            <button type="button" class="btn btn--xs btn--icon" @click="speak(ex.en)">
              <UiIcon name="volume" />
            </button>
            <div>
              <div>{{ ex.en }}</div>
              <div v-if="ex.vi" class="muted">{{ ex.vi }}</div>
            </div>
          </div>
        </div>
      </PxPanel>

      <div class="actions">
        <button
          v-if="!revealed && !answerable"
          type="button"
          class="btn btn--primary btn--lg"
          @click="reveal"
        >
          {{ t('study.review.show') }}
        </button>
        <button v-else-if="!revealed" type="button" class="ghost" @click="reveal">
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
          <button
            v-if="canUndo"
            type="button"
            class="btn btn--ghost btn--sm"
            :disabled="busy"
            @click="undo"
          >
            ↶ {{ t('study.review.undo') }}
          </button>
          <p class="muted hint">{{ hintText }}</p>
        </div>
        <button type="button" class="ghost say-btn" @click="speakOpen = !speakOpen">
          <UiIcon name="mic" />
          {{ speakOpen ? t('study.review.closeSay') : t('study.review.sayIt') }}
        </button>
        <div v-if="speakOpen" class="speak-panel">
          <SpeakPractice :key="card.cardId" :expected="card.lemma" can-listen phonemes />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  max-width: 720px;
  min-height: calc(100vh - 64px);
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
  gap: 16px;
  padding: 28px 32px;
}
.pic {
  display: block;
  margin: 10px auto 0;
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
  border: 1px solid var(--c-line);
  border-radius: var(--r-pill);
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
  font-size: 48px;
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
.prompt {
  margin: 10px 0 4px;
  font-weight: 600;
  color: var(--c-xp);
}
.sentence {
  margin: 10px 0 6px;
  font-size: 30px;
  line-height: 1.6;
}
.sentence-vi {
  margin: 0 0 4px;
  font-size: 15px;
}
.meaning {
  margin: 4px 0;
  padding: 4px 10px;
  display: inline-block;
  font-size: 14px;
  background: var(--c-primary-soft);
  border-left: 4px solid var(--c-primary);
  border-radius: var(--r-sm);
}
.cloze-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 6px;
}
.slots {
  display: inline-flex;
  gap: 3px;
  margin: 0 6px;
  vertical-align: baseline;
}
.slot {
  display: inline-block;
  min-width: 0.8em;
  height: 1.25em;
  text-align: center;
  color: var(--c-primary);
  font-weight: 700;
  border-bottom: 3px solid var(--c-primary);
}
.slot.shown {
  min-width: 0.65em;
}
.slots.correct .slot {
  color: var(--c-success);
  border-color: var(--c-success);
}
.slots.close .slot,
.slots.wrong .slot {
  color: var(--c-danger);
  border-color: var(--c-danger);
}
/* Trắc nghiệm nghĩa của thẻ nhận diện */
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}
.choice {
  width: 100%;
  padding: 12px 10px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  color: inherit;
  font: inherit;
  font-size: 16px;
  text-align: left;
  cursor: pointer;
  border-radius: var(--r-md);
}
.choice:hover:not(:disabled) {
  background: var(--c-primary-soft);
}
.choice kbd {
  display: inline-block;
  min-width: 1.3em;
  margin-right: 6px;
  padding: 0 4px;
  text-align: center;
  font-size: 12px;
  background: var(--c-bg);
  border: 1px solid var(--c-line);
  border-radius: var(--r-sm);
}
.choice.right {
  background: var(--c-success-soft);
  border-color: var(--c-success);
}
.choice.wrong {
  background: #fdebec;
  border-color: var(--c-danger);
}
.choice:disabled {
  cursor: default;
}
.ctx {
  margin: 8px auto 0;
  max-width: 90%;
  font-size: 15px;
  font-style: italic;
  color: var(--c-ink-soft);
}
.ctx mark {
  padding: 0 2px;
  font-style: normal;
  font-weight: 700;
  color: var(--c-ink);
  background: #fff2a8;
}
.say-btn {
  font-size: 13px;
  padding: 4px 12px;
}
.speak-panel {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  border-radius: var(--r-md);
}
.ghost {
  padding: 8px 18px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--r-md);
}
.ghost:hover {
  background: var(--c-primary-soft);
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
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  font: inherit;
  font-size: 18px;
  outline: none;
  border-radius: var(--r-md);
}
.type input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px var(--c-primary-soft);
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
  background: var(--c-warning-soft);
  border-left: 3px solid var(--c-warning);
  border-radius: var(--r-md);
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
.rates {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
}
.rate {
  display: grid;
  gap: 2px;
  padding: 12px 4px;
  font-size: 15px;
  border: 1px solid var(--c-line);
  color: #fff;
  font: inherit;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  border-radius: var(--r-md);
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
