<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Lesson, LessonKind } from '@shared/schemas/lesson'
import type { SpeakingResult } from '@shared/schemas/speaking'
import type { TranslateCheckResult, WritingResult } from '@shared/schemas/writing'
import { TRANSLATE_MAX_CHARS } from '@shared/writing'
import type { SpeechScore } from '@shared/speech'
import { useTts } from '@renderer/shared/composables/useTts'
import { useSpeakingStore } from '@renderer/shared/stores/speaking'
import { useWritingStore } from '@renderer/shared/stores/writing'
import PicText from '@renderer/shared/components/PicText.vue'
import SpeakPractice from '@renderer/shared/components/SpeakPractice.vue'
import { ChevronLeft } from 'lucide-vue-next'
import { confirmLeave, useLeaveGuard } from '../leaveGuard'
import AudioPrompt from '../exercises/AudioPrompt.vue'
import ChoiceList from '../exercises/ChoiceList.vue'
import HeadingsBoard from '../exercises/HeadingsBoard.vue'
import MatchBoard from '../exercises/MatchBoard.vue'
import RespondBoard from '../exercises/RespondBoard.vue'
import SummaryBoard from '../exercises/SummaryBoard.vue'
import WordOrderBoard from '../exercises/WordOrderBoard.vue'
import WriteBoard from '../exercises/WriteBoard.vue'
import WritingFeedback from '../exercises/WritingFeedback.vue'
import {
  canCheck as canCheckEx,
  choiceTexts,
  correctChoice,
  countsForSkill,
  gradedRemotely,
  hasChoices as hasChoicesEx,
  initState,
  isCorrect as isCorrectEx,
  itemResults,
  keyHints,
  lessonPassage,
  PASSAGE_KEY,
  solutionOf,
  speaksSolution,
  TF_ORDER
} from '../exercises/lessonExercises'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import ReadingPassage from './ReadingPassage.vue'

// Bài tập của một bài học: chấm tại chỗ (đáp án là nội dung bài, không phải bí mật), xong gửi điểm lên main.
// Logic từng dạng bài nằm ở exercises/lessonExercises.ts (registry), phần hiển thị dùng các thành phần chung ở exercises/.
const props = withDefaults(defineProps<{ lesson: Lesson; kind?: LessonKind }>(), {
  kind: 'lesson'
})
const emit = defineEmits<{
  finish: [
    correct: number,
    total: number,
    byType: Array<{ type: string; correct: number; total: number }>
  ]
  back: []
}>()

const { t } = useI18n()
const { speak, prefetch } = useTts()
const writing = useWritingStore()
const speaking = useSpeakingStore()

// Đang làm bài tập thì thoát (về bài đọc, danh sách, làng) phải hỏi; xong bài thì trang cha tháo màn này
useLeaveGuard(() => true)
async function goBack(): Promise<void> {
  if (await confirmLeave()) emit('back')
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const idx = ref(0)
const checked = ref(false)
const correct = ref(false)
const correctCount = ref(0)
/** Kết quả theo dạng bài (gửi lên main để thống kê độ chính xác và Elo theo kỹ năng) */
const typeResults = ref<Record<string, { correct: number; total: number }>>({})
const typedInput = ref<HTMLInputElement>()
/** Dịch câu / viết theo đề / trả lời nói: đang chờ main (có thể là AI) chấm — khoá nút và ô nhập, giữ nguyên chữ */
const grading = ref(false)
/** Lần chấm đang chạy có dùng AI không (dòng trạng thái "AI đang chấm") */
const gradingWithAi = ref(false)
const translateResult = ref<TranslateCheckResult | null>(null)
const writeResult = ref<WritingResult | null>(null)
const respondResult = ref<SpeakingResult | null>(null)
/**
 * Trả lời nói: đã bấm "Nhận xét bằng AI" mà AI không nhận xét được (tắt, hết lượt, bận, lỗi) → chưa chốt câu, cho thử
 * lại AI hoặc chấm không cần AI (kết quả chấm tại máy main đã trả kèm)
 */
const respondPending = ref<SpeakingResult | null>(null)

const total = computed(() => props.lesson.exercises.length)
const ex = computed(() => props.lesson.exercises[idx.value])
const state = reactive(initState(props.lesson.exercises[0], shuffle))

const tfLabel = (key: (typeof TF_ORDER)[number]): string => t(`study.lessons.tf.${key}`)

function enter(): void {
  const e = ex.value
  checked.value = false
  correct.value = false
  translateResult.value = null
  writeResult.value = null
  respondResult.value = null
  respondPending.value = null
  Object.assign(state, initState(e, shuffle))
  if (e.type === 'listen') window.setTimeout(() => speak(e.say, undefined, 0.9), 250)
  if (e.type === 'picture' && e.listen) window.setTimeout(() => speak(e.word, undefined, 0.9), 250)
  if ((e.type === 'gap' && !e.choices) || e.type === 'translate')
    void nextTick(() => typedInput.value?.focus())
}

const choices = computed(() => choiceTexts(ex.value, state, tfLabel))
const hasChoices = computed(() => hasChoicesEx(ex.value))
const canCheck = computed(() => !checked.value && !grading.value && canCheckEx(ex.value, state))
/** Hiện nút nghe: nghe chọn, hoặc chọn hình dạng nghe từ */
const audioText = computed(() => {
  const e = ex.value
  if (e.type === 'respond') return e.question
  return e.type === 'listen' ? e.say : e.type === 'picture' && e.listen ? e.word : null
})
/** Trả lời nói, AI dùng được: nút chính là "Nhận xét bằng AI" (kèm dòng báo gửi chữ cho Claude) */
const respondAi = computed(() => ex.value.type === 'respond' && writing.aiReady === true)
/** Hai cột của bài ghép cặp (cột phải theo thứ tự đã xáo) */
const matchColumns = computed(() => {
  const e = ex.value
  return e.type === 'match'
    ? { left: e.pairs.map((p) => p.left), right: state.rightOrder.map((i) => e.pairs[i].right) }
    : null
})
/** Vị trí hiển thị của đáp án đúng (lựa chọn đã xáo) để tô xanh/đỏ sau khi chấm */
const answerIndex = computed<number | null>(() => correctChoice(ex.value, state, tfLabel))
/** Ghép tiêu đề / hoàn thành tóm tắt: đúng/sai từng đoạn / chỗ trống, chỉ có sau khi chấm */
const items = computed(() => (checked.value ? itemResults(ex.value, state) : null))
/** Bài đọc của bài (block `passage` đầu tiên) — mở được trong lúc làm mọi câu */
const passage = computed(() => lessonPassage(props.lesson.blocks))
const passageParagraphs = computed(() => passage.value?.paragraphs.map((p) => p.en) ?? [])

// Bài đọc trong lúc làm bài: cửa sổ rộng (≥ 1100px) → cột bên cạnh câu hỏi, mở sẵn; hẹp hơn → ngăn kéo (dialog) phủ lên.
// Đóng/mở không đụng tới trạng thái câu đang làm.
const WIDE_QUERY = '(min-width: 1100px)'
const wideMedia = window.matchMedia(WIDE_QUERY)
const wide = ref(wideMedia.matches)
const showPassage = ref(wide.value && passage.value !== null)
const passageEl = ref<HTMLElement>()
const passageClose = ref<HTMLButtonElement>()
const questionBox = ref<HTMLElement>()
const onWide = (e: MediaQueryListEvent): void => {
  wide.value = e.matches
}
const passageDocked = computed(() => wide.value && showPassage.value && passage.value !== null)

function openPassage(): void {
  if (!passage.value) return
  showPassage.value = true
  void nextTick(() => passageClose.value?.focus())
}
/** Đóng bài đọc và trả focus về câu hỏi */
function closePassage(): void {
  showPassage.value = false
  void nextTick(() => questionBox.value?.focus())
}
function togglePassage(): void {
  if (showPassage.value) closePassage()
  else openPassage()
}
/**
 * Esc khi bài đọc đang mở: đóng bài đọc trước, không để vỏ trang (PlaceShell) đưa về làng. Nghe ở pha capture vì
 * PlaceShell đăng ký listener trước trang bài tập. Có hộp thoại khác đang mở (hỏi rời trang…) thì để hộp đó xử lý.
 */
function onEscCapture(e: KeyboardEvent): void {
  if (e.key !== 'Escape' || !showPassage.value) return
  const other = [...document.querySelectorAll('[role="dialog"]')].some((d) => d !== passageEl.value)
  if (other) return
  e.preventDefault()
  e.stopPropagation()
  closePassage()
}
const hints = computed(() =>
  keyHints(ex.value, passage.value !== null).map((k) =>
    t(`study.lessons.keys.${k}`, { key: PASSAGE_KEY.toUpperCase() })
  )
)
/** Ghép tiêu đề: tiêu đề theo thứ tự hiển thị (đã xáo) và tiêu đề đúng của từng đoạn */
const headingsView = computed(() => {
  const e = ex.value
  return e.type === 'headings'
    ? { shown: state.order.map((i) => e.headings[i]), answers: e.answers.map((a) => e.headings[a]) }
    : { shown: [], answers: [] }
})
/** Nhãn loại câu hỏi đọc hiểu trên câu trắc nghiệm (không hiện với câu chi tiết) */
const focusLabel = computed(() => {
  const e = ex.value
  return e.type === 'mcq' && e.focus && e.focus !== 'detail'
    ? t(`study.lessons.focus.${e.focus}`)
    : null
})
const promptParts = computed(() => (ex.value.type === 'gap' ? ex.value.prompt.split('___') : []))
const solution = computed(() => solutionOf(ex.value, tfLabel))
/** Dòng chữ chính của câu hỏi (câu hỏi, câu đúng/sai, lời nhắc nghe) */
const heading = computed(() => {
  const e = ex.value
  switch (e.type) {
    case 'mcq':
      return e.prompt
    case 'listen':
      return e.prompt ?? t('study.lessons.listenPrompt')
    case 'tf':
      return e.statement
    default:
      return ''
  }
})

/** Bài nói: ghi nhận độ chính xác lần nói gần nhất; bấm "Kiểm tra" để chốt */
function onSpoken(score: SpeechScore): void {
  state.spoken = score.accuracy
}

/** Không nói được (không có micro...): bỏ qua câu này, tính là chưa đạt */
function skipSpeak(): void {
  state.spoken = 0
  check()
}

/** Trả lời nói không làm được (không có micro, chưa tải model…): bỏ qua câu này, tính là chưa đạt — như skipSpeak */
function skipRespond(): void {
  if (checked.value || grading.value) return
  state.verdict = false
  respondResult.value = null
  respondPending.value = null
  commit(null)
}

/** Trả lời nói: AI không nhận xét được → dùng kết quả chấm tại máy main đã trả */
function acceptLocal(): void {
  const r = respondPending.value
  if (!r || checked.value || grading.value) return
  respondPending.value = null
  respondResult.value = r
  state.verdict = r.passed
  commit(r.gradedBy)
}

/**
 * Dịch câu / viết theo đề / trả lời nói: nhờ main chấm (so khớp đáp án mẫu, AI nếu có); store không ném lỗi nên luôn có
 * kết luận. Trả lời nói chỉ dùng AI khi `useAi` (người học bấm "Nhận xét bằng AI"); AI lỗi → 'hold' (chưa chốt câu).
 */
async function gradeRemote(useAi: boolean): Promise<string | null> {
  const e = ex.value
  const at = { kind: props.kind, lessonId: props.lesson.id, index: idx.value }
  grading.value = true
  gradingWithAi.value = e.type === 'respond' ? useAi : writing.aiReady === true
  try {
    if (e.type === 'respond') {
      if (!state.answer) return 'hold'
      const r = await speaking.feedback(at, state.answer, e.minWords, useAi)
      if (useAi && r.gradedBy === 'local' && r.aiReason) {
        respondPending.value = r
        return 'hold'
      }
      respondPending.value = null
      respondResult.value = r
      state.verdict = r.passed
      return r.gradedBy
    }
    if (e.type === 'translate') {
      const r = await writing.checkTranslation(at, state.typed, e.answers)
      translateResult.value = r
      state.verdict = r.correct
      return r.gradedBy
    }
    if (e.type === 'write') {
      const r = await writing.feedback(at, state.typed, e)
      writeResult.value = r
      state.verdict = r.passed
      return r.gradedBy
    }
    return null
  } finally {
    grading.value = false
  }
}

async function check(useAi = false): Promise<void> {
  if (!canCheck.value) return
  const e = ex.value
  const gradedBy = gradedRemotely(e) ? await gradeRemote(useAi) : null
  if (gradedBy === 'hold') return
  commit(gradedBy)
}

/** Chốt kết quả câu hiện tại (đếm điểm bài, Elo theo dạng bài, đọc lời giải) */
function commit(gradedBy: string | null): void {
  const e = ex.value
  correct.value = isCorrectEx(e, state)
  if (correct.value) correctCount.value++
  // Bài viết chỉ chấm theo số từ (không có AI) không tính vào Elo, chỉ tính vào điểm bài
  if (countsForSkill(e, gradedBy)) {
    const tally = (typeResults.value[e.type] ??= { correct: 0, total: 0 })
    tally.total++
    if (correct.value) tally.correct++
  }
  checked.value = true
  if (speaksSolution(e)) speak(solution.value, undefined, 0.9)
}

function next(): void {
  if (idx.value + 1 >= total.value) {
    emit(
      'finish',
      correctCount.value,
      total.value,
      Object.entries(typeResults.value).map(([type, v]) => ({ type, ...v }))
    )
    return
  }
  idx.value++
  enter()
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.ctrlKey || event.altKey || event.metaKey) return
  const target = event.target as HTMLElement | null
  const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
  // Phím R: mở/đóng bài đọc (không khi đang gõ chữ)
  if (event.key.toLowerCase() === PASSAGE_KEY && passage.value && !typing) {
    event.preventDefault()
    togglePassage()
    return
  }
  // Phím trong bài đọc (Enter trên từ để tra…) không chấm câu; ngăn kéo đang phủ lên thì câu hỏi không nhận phím
  if ((target && passageEl.value?.contains(target)) || (showPassage.value && !wide.value)) return
  // Ô viết bài: Enter là xuống dòng; đang chấm thì bỏ qua phím
  if (target?.tagName === 'TEXTAREA' || grading.value) return
  if (event.key === 'Enter') {
    event.preventDefault()
    if (checked.value) next()
    // Trả lời nói: chỉ chấm/gửi AI khi bấm nút (không gửi lời nhận dạng bằng một phím Enter lỡ tay)
    else if (ex.value.type !== 'respond') void check()
    return
  }
  const n = Number(event.key)
  if (
    hasChoices.value &&
    !checked.value &&
    n >= 1 &&
    n <= choices.value.length &&
    target?.tagName !== 'INPUT'
  ) {
    state.chosen = n - 1
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keydown', onEscCapture, true)
  wideMedia.addEventListener('change', onWide)
  if (props.lesson.exercises.some(gradedRemotely)) void writing.refreshAi()
  // Giọng tự nhiên: tạo trước âm thanh các câu nghe và lời giải của bài tập
  prefetch(
    props.lesson.exercises.flatMap((e) =>
      e.type === 'listen'
        ? [e.say]
        : e.type === 'order'
          ? [e.answer]
          : e.type === 'speak'
            ? [e.say]
            : e.type === 'respond'
              ? [e.question, ...(e.sample ? [e.sample] : [])]
              : e.type === 'picture' && e.listen
                ? [e.word]
                : []
    ),
    undefined,
    0.9
  )
  enter()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keydown', onEscCapture, true)
  wideMedia.removeEventListener('change', onWide)
})
</script>

<template>
  <section class="exercises" :class="{ docked: passageDocked }">
    <div class="top">
      <button type="button" class="back" @click="goBack">
        <ChevronLeft :size="16" :stroke-width="2.4" /> {{ t('study.lessons.backToLesson') }}
      </button>
      <span class="muted">
        {{ t('study.lessons.counter', { index: idx + 1, total }) }} · {{ lesson.title }}
      </span>
      <button
        v-if="passage"
        type="button"
        class="btn btn--sm passage-toggle"
        :aria-expanded="showPassage"
        :aria-keyshortcuts="PASSAGE_KEY.toUpperCase()"
        @click="togglePassage"
      >
        <UiIcon name="book" />
        {{ showPassage ? t('study.lessons.passage.hide') : t('study.lessons.passage.show') }}
        <kbd>{{ PASSAGE_KEY.toUpperCase() }}</kbd>
      </button>
    </div>
    <progress class="bar" :value="idx" :max="total" />

    <div class="work">
      <div class="question">
        <div
          ref="questionBox"
          class="card box"
          tabindex="-1"
          :aria-label="t('study.lessons.counter', { index: idx + 1, total })"
        >
          <p v-if="ex.type === 'tf'" class="instruction">
            {{ ex.ng ? t('study.lessons.tfHelpNg') : t('study.lessons.tfHelp') }}
          </p>
          <p v-else-if="ex.type === 'picture'" class="instruction">
            {{ ex.listen ? t('study.lessons.pictureListen') : t('study.lessons.pictureHelp') }}
          </p>
          <p v-else-if="ex.type === 'speak'" class="instruction">
            {{ ex.word ? t('study.lessons.speakWordHelp') : t('study.lessons.speakHelp') }}
          </p>
          <p v-else-if="ex.type === 'gap'" class="instruction">{{ t('study.lessons.gapHelp') }}</p>
          <p v-else-if="ex.type === 'translate'" class="instruction">
            {{ t('study.lessons.translateHelp') }}
          </p>
          <p v-else-if="ex.type === 'write'" class="instruction">
            {{ t('study.lessons.writeHelp') }}
          </p>
          <p v-else-if="ex.type === 'respond'" class="instruction">
            {{ t('study.lessons.respondHelp') }}
          </p>
          <p v-else-if="ex.type === 'order'" class="instruction">
            {{ t('study.lessons.orderHelp') }}
          </p>
          <p v-else-if="ex.type === 'match'" class="instruction">
            {{ ex.prompt ?? t('study.lessons.matchHelp') }}
          </p>
          <p v-else-if="ex.type === 'headings'" class="instruction">
            {{ ex.prompt ?? t('study.lessons.headingsHelp') }}
          </p>
          <p v-else-if="ex.type === 'summary'" class="instruction">
            {{ t('study.lessons.summaryHelp') }}
          </p>

          <span v-if="focusLabel" class="chip chip--primary focus">{{ focusLabel }}</span>
          <p v-if="heading" class="prompt">{{ heading }}</p>
          <p v-else-if="ex.type === 'picture' && !ex.listen" class="prompt">{{ ex.word }}</p>
          <p v-else-if="ex.type === 'speak'" class="prompt">{{ ex.prompt ?? ex.say }}</p>
          <p v-else-if="ex.type === 'order'" class="prompt vi">{{ ex.hint }}</p>
          <p v-else-if="ex.type === 'translate'" class="prompt vi">{{ ex.vi }}</p>
          <p v-else-if="ex.type === 'write'" class="prompt task">{{ ex.prompt }}</p>
          <p v-else-if="ex.type === 'respond'" class="prompt task">{{ ex.question }}</p>
          <p v-else-if="ex.type === 'gap'" class="prompt">
            {{ promptParts[0]
            }}<span class="blank">{{
              checked
                ? ex.answers[0]
                : state.chosen !== null && ex.choices
                  ? choices[state.chosen]
                  : '＿＿＿'
            }}</span
            >{{ promptParts[1] }}
          </p>

          <AudioPrompt v-if="audioText" :text="audioText" />

          <SpeakPractice
            v-if="ex.type === 'speak' && !checked"
            :key="idx"
            :expected="ex.say"
            can-listen
            phonemes
            @scored="onSpoken"
          />

          <input
            v-if="(ex.type === 'gap' && !ex.choices) || ex.type === 'translate'"
            ref="typedInput"
            v-model="state.typed"
            type="text"
            class="typed"
            spellcheck="false"
            autocomplete="off"
            :maxlength="ex.type === 'translate' ? TRANSLATE_MAX_CHARS : undefined"
            :disabled="checked || grading"
            :placeholder="t('study.lessons.typeHere')"
          />

          <WriteBoard
            v-else-if="ex.type === 'write'"
            v-model="state.typed"
            :min-words="ex.minWords"
            :max-words="ex.maxWords"
            :locked="checked || grading"
          />

          <RespondBoard
            v-else-if="ex.type === 'respond'"
            :key="idx"
            v-model="state.answer"
            :vi="ex.vi"
            :min-words="ex.minWords"
            :locked="checked || grading || respondPending !== null"
          />

          <WordOrderBoard
            v-else-if="ex.type === 'order'"
            v-model="state.picked"
            :tokens="state.tokens"
            :locked="checked"
          />

          <MatchBoard
            v-else-if="matchColumns"
            v-model="state.pairMap"
            :left="matchColumns.left"
            :right="matchColumns.right"
            :locked="checked"
          />

          <HeadingsBoard
            v-else-if="ex.type === 'headings'"
            :key="`h${idx}`"
            v-model="state.slots"
            :paragraphs="passageParagraphs"
            :headings="headingsView.shown"
            :answers="headingsView.answers"
            :results="items"
            :locked="checked"
          />

          <SummaryBoard
            v-else-if="ex.type === 'summary'"
            :key="`s${idx}`"
            v-model="state.slots"
            :text="ex.text"
            :bank="state.tokens"
            :answers="ex.answers"
            :results="items"
            :locked="checked"
          />

          <ChoiceList
            v-if="hasChoices"
            v-model="state.chosen"
            :choices="choices"
            :locked="checked"
            :correct="checked ? answerIndex : null"
            :pictures="ex.type === 'picture'"
          />

          <p v-if="grading" class="grading" role="status" aria-live="polite">
            <UiIcon name="write" />
            {{ gradingWithAi ? t('study.lessons.gradingAi') : t('study.lessons.grading') }}
          </p>

          <div v-if="respondPending && !grading" class="pending" role="alert">
            <UiIcon name="hint" />
            <span
              >{{ t('study.lessons.respond.aiFailed') }}
              <template v-if="respondPending.aiReason">{{
                t(respondPending.aiReason)
              }}</template></span
            >
          </div>

          <div v-if="checked" class="feedback" :class="{ ok: correct }">
            <strong class="verdict"
              ><UiIcon :name="correct ? 'done' : 'close'" />{{
                correct
                  ? t('study.lessons.correct')
                  : items?.length
                    ? t('study.lessons.wrongItems', {
                        n: items.filter(Boolean).length,
                        total: items.length
                      })
                    : t('study.lessons.wrong')
              }}</strong
            >
            <!-- Ghép tiêu đề / tóm tắt: đáp án đúng đã hiện ngay ở từng đoạn / chỗ trống sai -->
            <div
              v-if="
                !correct &&
                ex.type !== 'write' &&
                ex.type !== 'respond' &&
                ex.type !== 'headings' &&
                ex.type !== 'summary'
              "
              class="solution"
            >
              <PicText v-if="ex.type === 'picture'" :text="ex.choices[ex.answer]" :size="48" ids />
              {{ solution }}
            </div>
            <div v-if="'explain' in ex && ex.explain" class="explain">
              <UiIcon name="hint" /> {{ ex.explain }}
            </div>
          </div>

          <WritingFeedback
            v-if="checked && (translateResult || writeResult || respondResult)"
            :translate="translateResult"
            :write="writeResult"
            :speak="respondResult"
            :model-answer="ex.type === 'translate' ? ex.answers[0] : undefined"
            :sample="ex.type === 'write' || ex.type === 'respond' ? ex.sample : undefined"
            :min-words="ex.type === 'respond' ? ex.minWords : undefined"
          />
          <p v-else-if="checked && ex.type === 'respond' && ex.sample" class="sample">
            <strong>{{ t('study.lessons.respond.sample') }}:</strong> {{ ex.sample }}
          </p>
        </div>

        <div class="foot">
          <p v-if="respondAi && !checked" class="keys privacy">
            <UiIcon name="lock" /> {{ t('study.lessons.respond.privacy') }}
          </p>
          <p v-else class="keys">{{ hints.join(' · ') }}</p>
          <div class="actions">
            <button
              v-if="ex.type === 'speak' && !checked"
              type="button"
              class="btn btn--ghost btn--sm"
              @click="skipSpeak"
            >
              {{ t('study.lessons.skipSpeak') }}
            </button>
            <template v-if="ex.type === 'respond' && !checked">
              <button
                v-if="!respondPending"
                type="button"
                class="btn btn--ghost btn--sm"
                :disabled="grading"
                @click="skipRespond"
              >
                {{ t('study.lessons.skipSpeak') }}
              </button>
              <button
                v-if="respondPending"
                type="button"
                class="btn"
                :disabled="grading"
                @click="acceptLocal"
              >
                {{ t('study.lessons.respond.gradeLocal') }}
              </button>
              <button
                v-else-if="respondAi"
                type="button"
                class="btn"
                :disabled="!canCheck"
                @click="check(false)"
              >
                {{ t('study.lessons.respond.gradeLocal') }}
              </button>
              <button
                v-if="respondAi || respondPending"
                type="button"
                class="btn btn--primary"
                :disabled="!canCheck"
                @click="check(true)"
              >
                {{
                  grading
                    ? t('study.lessons.grading')
                    : respondPending
                      ? t('study.lessons.respond.retryAi')
                      : t('study.lessons.respond.askAi')
                }}
              </button>
              <button
                v-else
                type="button"
                class="btn btn--primary"
                :disabled="!canCheck"
                @click="check(false)"
              >
                {{ grading ? t('study.lessons.grading') : t('study.lessons.check') }}
              </button>
            </template>
            <button
              v-else-if="!checked"
              type="button"
              class="btn btn--primary"
              :disabled="!canCheck"
              @click="check()"
            >
              {{ grading ? t('study.lessons.grading') : t('study.lessons.check') }}
            </button>
            <button v-else type="button" class="btn btn--primary" @click="next">
              {{ idx + 1 >= total ? t('study.lessons.finish') : t('study.lessons.next') }}
              <UiIcon name="next" />
            </button>
          </div>
        </div>
      </div>

      <!-- Cửa sổ rộng: bài đọc là cột bên cạnh câu hỏi, cuộn riêng -->
      <aside
        v-if="passage && passageDocked"
        ref="passageEl"
        class="passage-col"
        :aria-label="t('study.lessons.passage.title')"
      >
        <header class="passage-head">
          <h2>{{ passage.title ?? t('study.lessons.passage.title') }}</h2>
          <button
            ref="passageClose"
            type="button"
            class="btn btn--ghost btn--sm btn--icon"
            :title="t('study.lessons.passage.close')"
            :aria-label="t('study.lessons.passage.close')"
            @click="closePassage"
          >
            <UiIcon name="close" />
          </button>
        </header>
        <ReadingPassage :paragraphs="passage.paragraphs" compact />
      </aside>
    </div>

    <!-- Cửa sổ hẹp: bài đọc là ngăn kéo phủ lên (Esc hoặc bấm nền để đóng) -->
    <div v-if="passage && showPassage && !wide" class="passage-backdrop" @click.self="closePassage">
      <aside
        ref="passageEl"
        class="passage-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passage-drawer-title"
      >
        <header class="passage-head">
          <h2 id="passage-drawer-title">{{ passage.title ?? t('study.lessons.passage.title') }}</h2>
          <button
            ref="passageClose"
            type="button"
            class="btn btn--ghost btn--sm btn--icon"
            :title="t('study.lessons.passage.close')"
            :aria-label="t('study.lessons.passage.close')"
            @click="closePassage"
          >
            <UiIcon name="close" />
          </button>
        </header>
        <ReadingPassage :paragraphs="passage.paragraphs" compact />
      </aside>
    </div>
  </section>
</template>

<style scoped>
.exercises {
  display: grid;
  gap: var(--sp-3);
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}
/* Cửa sổ rộng + bài đọc mở: câu hỏi và bài đọc cạnh nhau, bài đọc cuộn riêng (dính trên cùng) */
.exercises.docked {
  max-width: 1240px;
}
.work {
  display: grid;
  gap: var(--sp-4);
  align-items: start;
}
.exercises.docked .work {
  grid-template-columns: minmax(360px, 1fr) minmax(320px, 1fr);
}
.question {
  display: grid;
  gap: var(--sp-3);
  min-width: 0;
}
.box:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}
.passage-toggle kbd {
  padding: 0 var(--sp-1);
  border: 1px solid var(--c-line);
  font: inherit;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
}
.passage-col {
  position: sticky;
  top: 0;
  display: grid;
  gap: var(--sp-2);
  align-content: start;
  max-height: calc(100vh - var(--sp-5) * 4);
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.passage-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}
.passage-head h2 {
  margin: 0;
  font-size: var(--fs-lg);
  color: var(--c-xp);
}
/* Cửa sổ hẹp: ngăn kéo bên phải phủ lên trang (lớp nền mờ như hộp thoại hỏi rời trang) */
.passage-backdrop {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: flex;
  justify-content: flex-end;
  background: rgb(40 28 20 / 45%);
}
.passage-drawer {
  display: grid;
  gap: var(--sp-2);
  align-content: start;
  width: min(560px, 100%);
  height: 100%;
  padding: var(--sp-3) var(--sp-4);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--c-bg);
  border-left: 1px solid var(--c-line);
  border-radius: var(--r-lg) 0 0 var(--r-lg);
  box-shadow: var(--shadow-md);
  animation: drawer-in 120ms ease-out;
}
@keyframes drawer-in {
  from {
    transform: translateX(24px);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .passage-drawer {
    animation: none;
  }
}
.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}
.back {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 0;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  font-size: var(--fs-sm);
  font-weight: 700;
  cursor: pointer;
}
.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.bar {
  width: 100%;
}
.box {
  display: grid;
  gap: var(--sp-4);
  padding: var(--sp-5);
}
.instruction {
  margin: 0;
  font-weight: 600;
  color: var(--c-xp);
}
.prompt {
  margin: 0;
  font-size: var(--fs-xl);
  font-weight: 800;
}
.prompt.vi {
  font-size: var(--fs-lg);
}
.focus {
  justify-self: start;
}
.prompt.task {
  font-size: var(--fs-lg);
  font-weight: 700;
  line-height: 1.5;
}
.grading {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  margin: 0;
  color: var(--c-ink-soft);
  font-weight: 600;
}
.blank {
  display: inline-block;
  min-width: 56px;
  margin: 0 var(--sp-1);
  padding: 0 6px;
  text-align: center;
  color: var(--c-primary);
  border-bottom: 3px solid var(--c-primary);
}
.typed {
  box-sizing: border-box;
  width: 100%;
  padding: var(--sp-3);
  border: 2px solid var(--c-line);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-size: var(--fs-lg);
  outline: none;
  border-radius: var(--r-md);
}
.typed:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px var(--c-primary-soft);
}
.feedback {
  padding: var(--sp-3) var(--sp-4);
  color: var(--c-danger);
  background: var(--c-danger-soft);
  border: 2px solid var(--c-danger);
  border-radius: var(--r-md);
}
.feedback.ok {
  color: var(--c-success);
  background: var(--c-success-soft);
  border-color: var(--c-success);
}
.verdict {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
}
.solution {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: var(--sp-1);
  color: var(--c-ink);
  font-weight: 600;
}
.explain {
  margin-top: var(--sp-2);
  color: var(--c-ink);
  font-weight: 400;
  font-size: var(--fs-sm);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--sp-2);
}
.keys {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
}
.keys.privacy {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  font-size: var(--fs-sm);
  font-weight: 600;
}
.pending {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  color: var(--c-warning);
  background: var(--c-warning-soft);
  border-radius: var(--r-md);
  font-weight: 600;
}
.sample {
  margin: 0;
}
</style>
