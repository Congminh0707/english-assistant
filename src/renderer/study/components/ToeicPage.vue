<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, ClipboardList, X } from 'lucide-vue-next'
import type {
  ToeicAttempt,
  ToeicBankInfo,
  ToeicGroupView,
  ToeicMode,
  ToeicPart,
  ToeicResult,
  ToeicSession
} from '@shared/schemas/toeic'
import { isListeningPart, TOEIC_PARTS } from '@shared/toeic'
import { TOEIC_TTS_RATE, toeicAudioLines } from '@shared/toeicAudio'
import { invoke } from '@renderer/shared/ipc'
import { useAudioPack, useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { useLeaveGuard } from '../leaveGuard'

// Ảnh Part 1 (Pexels, docs/08 §7b), tên file = id nhóm. Thiếu tranh thì chỉ hiện chú thích chữ.
const sceneArt = import.meta.glob('../art/toeic/*.webp', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>
const sceneUrl = (id: string): string | undefined => sceneArt[`../art/toeic/${id}.webp`]

// Luyện thi TOEIC (docs/29): theo Part / mini test / full test. Đáp án nằm ở main, nộp cả bài một lần.
const { t } = useI18n()
const { speakAsync, stop, available, naturalVoice } = useTts()
const { status: audioPack } = useAudioPack()

type Phase = 'menu' | 'test' | 'result'
const phase = ref<Phase>('menu')
useLeaveGuard(() => phase.value === 'test')

const bank = ref<ToeicBankInfo | null>(null)
const history = ref<ToeicAttempt[]>([])
const session = ref<ToeicSession | null>(null)
const result = ref<ToeicResult | null>(null)
const busy = ref(false)
const notEnough = ref(false)
/** Đang hỏi xác nhận huỷ bài */
const confirmCancel = ref(false)
const current = ref(0)
const answers = ref<Record<string, number | null>>({})
const remaining = ref<number | null>(null)
const playing = ref(false)
let startedAt = 0
let tick = 0
let playToken = 0
let autoTimer = 0
/** Chờ một nhịp ngắn rồi tự phát khi vào mục nghe */
const AUTO_PLAY_DELAY_MS = 400

const LETTERS = ['A', 'B', 'C', 'D']
const group = computed<ToeicGroupView | null>(() => session.value?.groups[current.value] ?? null)
const answered = computed(
  () => Object.values(answers.value).filter((v) => v !== null && v !== undefined).length
)
/** Part 1–2: lựa chọn chỉ nghe, không hiện chữ */
const hiddenChoices = computed(() => !!group.value && group.value.part <= 2)
const listening = computed(() => !!group.value && isListeningPart(group.value.part))
/** Chromium nạp danh sách giọng sau một nhịp (`voiceschanged`): đợi hết ân hạn mới kết luận "không có giọng" để khỏi nháy cảnh báo */
const voiceGrace = ref(true)
const VOICE_GRACE_MS = 1500
/** Máy không có giọng tiếng Anh nào (và chưa bật giọng tự nhiên, chưa tải gói âm thanh): báo rõ thay vì im lặng */
const noVoice = computed(
  () =>
    listening.value &&
    !voiceGrace.value &&
    !available.value &&
    !naturalVoice.value &&
    audioPack.value?.state !== 'ready'
)
const clock = computed(() => {
  const s = Math.max(remaining.value ?? 0, 0)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})

async function load(): Promise<void> {
  bank.value = await invoke('toeic:bank')
  history.value = await invoke('toeic:history')
}

async function begin(mode: ToeicMode, part?: ToeicPart): Promise<void> {
  if (busy.value) return
  busy.value = true
  notEnough.value = false
  try {
    const res = await invoke('toeic:start', { mode, part })
    if (!res.session) {
      notEnough.value = true
      return
    }
    session.value = res.session
    answers.value = {}
    current.value = 0
    result.value = null
    startedAt = Date.now()
    remaining.value = res.session.timeLimitSec
    window.clearInterval(tick)
    if (remaining.value !== null) {
      tick = window.setInterval(() => {
        remaining.value = (remaining.value ?? 1) - 1
        if ((remaining.value ?? 0) <= 0) void submit()
      }, 1000)
    }
    confirmCancel.value = false
    phase.value = 'test'
  } finally {
    busy.value = false
  }
}

async function submit(): Promise<void> {
  const s = session.value
  if (!s || busy.value) return
  busy.value = true
  stopAudio()
  window.clearInterval(tick)
  try {
    result.value = await invoke('toeic:submit', {
      sessionId: s.sessionId,
      answers: answers.value,
      elapsedSec: Math.round((Date.now() - startedAt) / 1000)
    })
    phase.value = 'result'
    void load()
  } finally {
    busy.value = false
  }
}

function pick(questionId: string, choice: number): void {
  answers.value = { ...answers.value, [questionId]: choice }
}

function go(delta: number): void {
  const s = session.value
  if (!s) return
  stopAudio()
  current.value = Math.min(Math.max(current.value + delta, 0), s.groups.length - 1)
}

function stopAudio(): void {
  window.clearTimeout(autoTimer)
  playToken++
  playing.value = false
  stop()
}

/** Phát phần nghe của nhóm: Part 1 đọc từng lựa chọn; Part 2 đọc câu rồi các lựa chọn; Part 3–4 đọc theo lượt người nói rồi đọc các câu hỏi (không đọc lựa chọn) */
async function play(): Promise<void> {
  const g = group.value
  if (!g) return
  stopAudio()
  const token = playToken
  playing.value = true
  // Câu đọc dựng ở shared/toeicAudio.ts (script tạo gói âm thanh dùng chung để khoá clip khớp)
  const lines = toeicAudioLines(g)
  for (const line of lines) {
    if (token !== playToken) return
    const done = await speakAsync(line.text, line.accent, TOEIC_TTS_RATE)
    if (!done) break
  }
  if (token === playToken) playing.value = false
}

/** Tự phát khi một mục nghe (Part 1–4) hiện ra: lúc bắt đầu bài và khi chuyển mục; không phát ở màn kết quả */
function scheduleAutoPlay(): void {
  window.clearTimeout(autoTimer)
  if (phase.value !== 'test' || !listening.value) return
  const token = playToken
  autoTimer = window.setTimeout(() => {
    if (token !== playToken || phase.value !== 'test' || !listening.value) return
    void play()
  }, AUTO_PLAY_DELAY_MS)
}
watch(
  () =>
    phase.value === 'test' && session.value ? `${session.value.sessionId}:${current.value}` : null,
  (key) => {
    if (key) scheduleAutoPlay()
  }
)

function backToMenu(): void {
  confirmCancel.value = false
  stopAudio()
  window.clearInterval(tick)
  session.value = null
  result.value = null
  phase.value = 'menu'
  void load()
}

const reviewByGroup = computed(() => {
  const map = new Map<string, ToeicResult['review']>()
  for (const r of result.value?.review ?? []) {
    const list = map.get(r.groupId) ?? []
    list.push(r)
    map.set(r.groupId, list)
  }
  return map
})

const modeLabel = (m: ToeicMode, part: number | null): string =>
  m === 'part' ? t('study.toeic.partN', { n: part ?? 0 }) : t(`study.toeic.mode.${m}`)
const dateLabel = (ms: number): string => new Date(ms).toLocaleDateString()

onMounted(() => {
  void load()
  window.setTimeout(() => (voiceGrace.value = false), VOICE_GRACE_MS)
})
onUnmounted(() => {
  stopAudio()
  window.clearInterval(tick)
})
</script>

<template>
  <section class="toeic">
    <h1>{{ t('study.toeic.title') }}</h1>

    <template v-if="phase === 'menu'">
      <div class="card box">
        <p>{{ t('study.toeic.intro') }}</p>
        <p class="note">{{ t('study.toeic.estimateNote') }}</p>
        <p v-if="notEnough" class="warn">{{ t('study.toeic.notEnough') }}</p>
        <div class="modes">
          <button
            type="button"
            class="btn btn--primary"
            :disabled="busy || !bank?.mini"
            @click="begin('mini')"
          >
            {{ t('study.toeic.mode.mini') }} <small>{{ t('study.toeic.miniMeta') }}</small>
          </button>
          <button type="button" class="btn" :disabled="busy || !bank?.full" @click="begin('full')">
            {{ t('study.toeic.mode.full') }} <small>{{ t('study.toeic.fullMeta') }}</small>
          </button>
        </div>
      </div>

      <div class="card box">
        <h2>{{ t('study.toeic.byPart') }}</h2>
        <div class="parts">
          <button
            v-for="p in TOEIC_PARTS"
            :key="p"
            type="button"
            class="part"
            :disabled="busy || !bank?.questionsByPart[p - 1]"
            @click="begin('part', p)"
          >
            <strong>{{ t('study.toeic.partN', { n: p }) }}</strong>
            <span>{{ t(`study.toeic.partName.${p}`) }}</span>
            <small class="muted">
              {{ t('study.toeic.count', { n: bank?.questionsByPart[p - 1] ?? 0 }) }}
            </small>
          </button>
        </div>
      </div>

      <div v-if="history.length" class="card box">
        <h2>{{ t('study.toeic.history') }}</h2>
        <ul class="history">
          <li v-for="h in history" :key="h.id">
            <span>{{ dateLabel(h.finishedAt) }}</span>
            <strong>{{ modeLabel(h.mode, h.part) }}</strong>
            <span>{{ h.correct }}/{{ h.total }}</span>
            <span v-if="h.mode !== 'part'" class="chip chip--xp">≈ {{ h.estTotal }}</span>
          </li>
        </ul>
      </div>
    </template>

    <template v-else-if="phase === 'test' && session && group">
      <div class="bar-row">
        <span class="muted">
          {{
            t('study.toeic.progress', {
              n: current + 1,
              total: session.groups.length,
              done: answered,
              all: session.totalQuestions
            })
          }}
        </span>
        <span v-if="remaining !== null" class="clock" :class="{ low: remaining < 300 }">
          {{ clock }}
        </span>
      </div>
      <div class="card box">
        <div class="head">
          <span class="chip">{{ t('study.toeic.partN', { n: group.part }) }}</span>
          <span v-if="listening" class="player">
            <span v-if="playing" class="muted" aria-live="polite">{{
              t('study.toeic.playing')
            }}</span>
            <button
              type="button"
              class="btn btn--sm"
              :class="{ 'btn--primary': playing }"
              :aria-pressed="playing"
              @click="playing ? stopAudio() : play()"
            >
              <UiIcon name="volume" /> {{ playing ? t('study.toeic.stop') : t('study.toeic.play') }}
            </button>
          </span>
        </div>
        <p v-if="noVoice" class="warn">{{ t('study.toeic.noVoice') }}</p>
        <img
          v-if="group.scene && sceneUrl(group.id)"
          :src="sceneUrl(group.id)"
          :alt="group.scene"
          class="scene-art"
        />
        <p v-else-if="group.scene" class="caption">
          {{ t('study.toeic.scene') }} {{ group.scene }}
        </p>
        <p v-if="group.context" class="passage">{{ group.context }}</p>
        <p v-if="group.passage" class="passage">{{ group.passage }}</p>
        <p v-if="listening" class="hint">{{ t(`study.toeic.hint.${group.part}`) }}</p>
        <div v-for="q in group.questions" :key="q.id" class="question">
          <p v-if="q.prompt" class="prompt">{{ q.prompt }}</p>
          <div class="choices" :class="{ short: hiddenChoices }">
            <button
              v-for="(c, i) in q.choices"
              :key="i"
              type="button"
              class="choice"
              :class="{ on: answers[q.id] === i, audio: hiddenChoices }"
              @click="pick(q.id, i)"
            >
              <span class="num">{{ LETTERS[i] }}</span>
              <UiIcon v-if="hiddenChoices" name="volume" class="choice-icon" />
              <span v-else>{{ c }}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="row">
        <button type="button" class="btn btn--sm" :disabled="current === 0" @click="go(-1)">
          {{ t('study.toeic.prev') }}
        </button>
        <button
          v-if="current < session.groups.length - 1"
          type="button"
          class="btn btn--primary"
          @click="go(1)"
        >
          {{ t('study.toeic.next') }}
        </button>
        <button v-else type="button" class="btn btn--primary" :disabled="busy" @click="submit">
          {{ t('study.toeic.submit') }}
        </button>
        <button
          v-if="current < session.groups.length - 1"
          type="button"
          class="btn btn--ghost btn--sm"
          :disabled="busy"
          @click="submit"
        >
          {{ t('study.toeic.finishNow') }}
        </button>
      </div>
      <div class="row">
        <template v-if="!confirmCancel">
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            :disabled="busy"
            @click="confirmCancel = true"
          >
            {{ t('study.toeic.cancel') }}
          </button>
        </template>
        <template v-else>
          <span class="warn">{{ t('study.toeic.cancelAsk') }}</span>
          <button type="button" class="btn btn--sm" @click="backToMenu">
            {{ t('study.toeic.cancelYes') }}
          </button>
          <button type="button" class="btn btn--primary btn--sm" @click="confirmCancel = false">
            {{ t('study.toeic.cancelNo') }}
          </button>
        </template>
      </div>
    </template>

    <template v-else-if="phase === 'result' && result && session">
      <div class="card box result">
        <ClipboardList :size="28" />
        <h2>
          {{ t('study.toeic.resultTitle', { correct: result.correct, total: result.total }) }}
        </h2>
        <p class="score">≈ {{ result.estimate.total }} / 990</p>
        <p
          v-if="result.estimate.listening !== null && result.estimate.reading !== null"
          class="muted"
        >
          {{
            t('study.toeic.sections', {
              l: result.estimate.listening,
              r: result.estimate.reading
            })
          }}
        </p>
        <p class="note">{{ t('study.toeic.estimateNote') }}</p>
        <p v-if="result.xp" class="chip chip--xp">+{{ result.xp }} XP</p>
        <ul class="partlist">
          <li v-for="p in result.parts" :key="p.part">
            <strong>{{ t('study.toeic.partN', { n: p.part }) }}</strong>
            <div class="bar">
              <div class="fill" :style="{ width: `${(p.correct / p.total) * 100}%` }" />
            </div>
            <span class="muted">{{ p.correct }}/{{ p.total }}</span>
          </li>
        </ul>
        <button type="button" class="btn btn--primary" @click="backToMenu">
          {{ t('study.toeic.back') }}
        </button>
      </div>

      <div class="card box">
        <h2>{{ t('study.toeic.review') }}</h2>
        <div v-for="g in session.groups" :key="g.id" class="rgroup">
          <img v-if="g.scene && sceneUrl(g.id)" :src="sceneUrl(g.id)" alt="" class="scene-art" />
          <p v-if="g.scene" class="caption">{{ g.scene }}</p>
          <p v-if="g.script && g.part > 1" class="passage">{{ g.script }}</p>
          <p v-if="g.context" class="passage">{{ g.context }}</p>
          <p v-if="g.passage" class="passage">{{ g.passage }}</p>
          <div v-for="(q, qi) in g.questions" :key="q.id" class="ritem">
            <p class="prompt">{{ q.prompt || t('study.toeic.listenQuestion') }}</p>
            <ul class="rchoices">
              <li
                v-for="(c, i) in q.choices"
                :key="i"
                :class="{
                  right: reviewByGroup.get(g.id)?.[qi]?.answer === i,
                  wrong:
                    reviewByGroup.get(g.id)?.[qi]?.picked === i &&
                    reviewByGroup.get(g.id)?.[qi]?.answer !== i
                }"
              >
                <span class="num">{{ LETTERS[i] }}</span> {{ c }}
                <Check v-if="reviewByGroup.get(g.id)?.[qi]?.answer === i" :size="14" />
                <X v-else-if="reviewByGroup.get(g.id)?.[qi]?.picked === i" :size="14" />
              </li>
            </ul>
            <p class="explain">{{ reviewByGroup.get(g.id)?.[qi]?.explain }}</p>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.toeic {
  display: grid;
  gap: var(--sp-3);
  max-width: 820px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: var(--fs-2xl);
}
h2 {
  margin: 0;
  font-size: var(--fs-xl);
}
.box {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-5);
}
.box p {
  margin: 0;
}
.muted {
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
  font-weight: 600;
}
.note {
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.warn {
  color: var(--c-danger);
  font-weight: 700;
}
.modes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
}
.modes small {
  margin-left: var(--sp-2);
  opacity: 0.8;
}
.parts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: var(--sp-2);
}
.part {
  display: grid;
  gap: 2px;
  padding: var(--sp-3);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.part:hover:not(:disabled) {
  background: var(--c-primary-soft);
}
.part:disabled {
  opacity: 0.5;
  cursor: default;
}
.history {
  display: grid;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.history li {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.clock {
  font-size: var(--fs-xl);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.clock.low {
  color: var(--c-danger);
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.player {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.hint {
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.passage {
  padding: var(--sp-3);
  background: var(--c-warning-soft);
  border-left: 3px solid var(--c-primary);
  border-radius: var(--r-md);
  line-height: 1.6;
  white-space: pre-line;
}
.scene-art {
  display: block;
  width: 100%;
  max-width: 520px;
  aspect-ratio: 8 / 5;
  object-fit: cover;
  border-radius: var(--r-md, 12px);
  margin: 0 auto;
}
.caption {
  color: var(--c-ink-soft);
  font-style: italic;
}
.question {
  display: grid;
  gap: var(--sp-2);
}
.prompt {
  font-weight: 700;
}
.choices {
  display: grid;
  gap: var(--sp-2);
}
.choices.short {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.choice {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.choice:hover {
  background: var(--c-primary-soft);
}
.choice.audio {
  justify-content: center;
  min-height: 56px;
}
.choice-icon {
  color: var(--c-ink-soft);
}
.choice.on {
  border-color: var(--c-primary);
  background: var(--c-primary-soft);
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
.row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
}
.result {
  justify-items: center;
  text-align: center;
}
.score {
  font-size: var(--fs-3xl);
  font-weight: 800;
}
.partlist {
  display: grid;
  gap: var(--sp-2);
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: left;
}
.partlist li {
  display: grid;
  grid-template-columns: 80px 1fr 56px;
  align-items: center;
  gap: var(--sp-3);
}
.bar {
  height: 8px;
  overflow: hidden;
  border-radius: var(--r-pill);
  background: var(--c-surface-2);
}
.fill {
  height: 100%;
  background: var(--c-success);
}
.rgroup {
  display: grid;
  gap: var(--sp-2);
  padding-bottom: var(--sp-3);
  border-bottom: 1px solid var(--c-line);
}
.ritem {
  display: grid;
  gap: var(--sp-2);
}
.rchoices {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.rchoices li {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 6px var(--sp-2);
  border-radius: var(--r-sm);
}
.rchoices li.right {
  background: var(--c-success-soft);
  color: var(--c-success);
  font-weight: 700;
}
.rchoices li.wrong {
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
.explain {
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
</style>
