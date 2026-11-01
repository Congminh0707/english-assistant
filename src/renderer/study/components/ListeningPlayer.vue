<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DICTATION_PASS, dictationAccuracy } from '@shared/practice'
import { useTts, type Accent } from '@renderer/shared/composables/useTts'
import { SkipBack, SkipForward } from 'lucide-vue-next'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Trình nghe (docs/07-learning-modules.md#6): phát lần lượt từng câu bằng TTS (người nói A/B dùng hai giọng Mỹ/Anh khác
// nhau), chỉnh tốc độ, nghe lại một câu, lặp đoạn A–B, ẩn/hiện lời thoại và bản dịch, tự chép lại câu đang nghe.
const props = defineProps<{
  title?: string
  lines: Array<{ speaker?: 'A' | 'B'; en: string; vi?: string }>
  hideText?: boolean
}>()

const { t } = useI18n()
const { speakAsync, stop, prefetch } = useTts()

const SPEEDS = [0.6, 0.8, 1] as const
/** Nghỉ giữa hai câu (ms) */
const GAP_MS = 450

const index = ref(0)
const playing = ref(false)
const speed = ref<(typeof SPEEDS)[number]>(0.8)
const loopA = ref<number | null>(null)
const loopB = ref<number | null>(null)
const showText = ref(!props.hideText)
const showVi = ref(false)
/** Đã phát tới cuối bài (để lần bấm nghe tiếp theo quay về câu đầu) */
const ended = ref(false)
const typed = ref('')
const result = ref<{ accuracy: number; pass: boolean } | null>(null)
/** Mỗi lần bấm phát/dừng tăng số này để vòng phát cũ tự dừng */
let runId = 0

const total = computed(() => props.lines.length)
const hasVi = computed(() => props.lines.some((l) => l.vi))
const loopActive = computed(() => loopA.value !== null && loopB.value !== null)

/** Người nói A giọng Mỹ, người nói B giọng Anh; không có người nói thì dùng giọng mặc định */
const accentOf = (i: number): Accent | undefined => {
  const speaker = props.lines[i]?.speaker
  return speaker === 'A' ? 'us' : speaker === 'B' ? 'uk' : undefined
}

const sleep = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms))

async function run(): Promise<void> {
  const id = ++runId
  playing.value = true
  while (id === runId) {
    const line = props.lines[index.value]
    const finished = await speakAsync(line.en, accentOf(index.value), speed.value)
    if (id !== runId) return
    if (!finished) break
    await sleep(GAP_MS)
    if (id !== runId) return
    if (loopActive.value && index.value >= (loopB.value as number))
      index.value = loopA.value as number
    else if (index.value + 1 < total.value) index.value++
    else {
      ended.value = true
      break
    }
    resetCheck()
  }
  if (id === runId) playing.value = false
}

function pause(): void {
  runId++
  playing.value = false
  stop()
}

function toggle(): void {
  if (playing.value) pause()
  else {
    // Đã nghe hết rồi bấm nghe lại → bắt đầu từ đầu (hoặc từ đầu đoạn lặp)
    if (ended.value) index.value = loopActive.value ? (loopA.value as number) : 0
    ended.value = false
    void run()
  }
}

function goto(i: number, play = true): void {
  const was = playing.value
  pause()
  index.value = Math.max(0, Math.min(total.value - 1, i))
  resetCheck()
  if (play || was) void run()
}

function again(): void {
  goto(index.value, true)
}

function setLoopA(): void {
  loopA.value = index.value
  if (loopB.value !== null && loopB.value < index.value) loopB.value = null
}
function setLoopB(): void {
  if (loopA.value === null) loopA.value = index.value
  loopB.value = Math.max(index.value, loopA.value)
}
function clearLoop(): void {
  loopA.value = null
  loopB.value = null
}

function setSpeed(next: (typeof SPEEDS)[number]): void {
  speed.value = next
  if (playing.value) again()
}

function resetCheck(): void {
  typed.value = ''
  result.value = null
}

function check(): void {
  const accuracy = dictationAccuracy(props.lines[index.value].en, typed.value)
  result.value = { accuracy, pass: accuracy >= DICTATION_PASS }
}

onMounted(() => {
  // Giọng tự nhiên: tạo trước âm thanh từng giọng, đúng tốc độ mặc định, để phát liền mạch
  for (const accent of ['us', 'uk'] as const) {
    const texts = props.lines.filter((_, i) => (accentOf(i) ?? 'us') === accent).map((l) => l.en)
    prefetch(texts, accent, speed.value)
  }
})
onUnmounted(pause)
</script>

<template>
  <div class="player">
    <div class="card top">
      <div class="controls">
        <button
          type="button"
          class="ctl"
          :title="t('player.prev')"
          @click="goto(index - 1, playing)"
        >
          <SkipBack :size="16" :stroke-width="2.2" />
        </button>
        <button
          type="button"
          class="ctl main"
          :title="playing ? t('player.pause') : t('player.play')"
          @click="toggle"
        >
          <UiIcon :name="playing ? 'pause' : 'play'" :size="20" />
        </button>
        <button
          type="button"
          class="ctl"
          :title="t('player.next')"
          @click="goto(index + 1, playing)"
        >
          <SkipForward :size="16" :stroke-width="2.2" />
        </button>
        <button type="button" class="ctl" :title="t('player.again')" @click="again">
          <UiIcon name="repeat" />
        </button>
      </div>
      <div class="now">
        <strong v-if="title" class="now-title"><UiIcon name="headphones" /> {{ title }}</strong>
        <span class="muted">{{ t('player.line', { n: index + 1, total }) }}</span>
      </div>
      <div class="speed" role="group" :aria-label="t('player.speed')">
        <span class="muted">{{ t('player.speed') }}</span>
        <span class="seg">
          <button
            v-for="s in SPEEDS"
            :key="s"
            type="button"
            class="seg-btn"
            :class="{ on: speed === s }"
            @click="setSpeed(s)"
          >
            {{ s }}×
          </button>
        </span>
      </div>
    </div>

    <div class="cols">
      <div class="card talk">
        <header class="talk-head">
          <h2>{{ t('player.lines') }}</h2>
          <div class="toggles">
            <button type="button" class="btn btn--sm" @click="showText = !showText">
              {{ showText ? t('player.hideText') : t('player.showText') }}
            </button>
            <button v-if="hasVi" type="button" class="btn btn--sm" @click="showVi = !showVi">
              {{ showVi ? t('player.hideVi') : t('player.showVi') }}
            </button>
          </div>
        </header>

        <p v-if="!showText" class="hidden-note">{{ t('player.hidden') }}</p>

        <ol class="lines">
          <li
            v-for="(line, i) in lines"
            :key="i"
            class="line"
            :class="{
              current: i === index,
              inLoop: loopActive && i >= (loopA ?? 0) && i <= (loopB ?? -1)
            }"
          >
            <button type="button" class="num" :title="t('player.again')" @click="goto(i, true)">
              {{ i + 1 }}
            </button>
            <span v-if="line.speaker" class="speaker" :class="line.speaker">{{
              line.speaker
            }}</span>
            <span class="text">
              <template v-if="showText || (i === index && result)">
                {{ line.en }}
                <small v-if="showVi && line.vi" class="vi">{{ line.vi }}</small>
              </template>
              <span v-else class="mask">••• ••• •••</span>
            </span>
          </li>
        </ol>
      </div>

      <aside class="side">
        <div class="card loop">
          <h3>{{ t('player.loopTitle') }}</h3>
          <div class="loop-btns">
            <button
              type="button"
              class="btn btn--sm"
              :class="{ 'btn--primary': loopA === index }"
              @click="setLoopA"
            >
              {{ t('player.loopA') }}
            </button>
            <button
              type="button"
              class="btn btn--sm"
              :class="{ 'btn--primary': loopB === index }"
              @click="setLoopB"
            >
              {{ t('player.loopB') }}
            </button>
            <button
              v-if="loopA !== null"
              type="button"
              class="btn btn--sm btn--ghost"
              @click="clearLoop"
            >
              <UiIcon name="close" /> {{ t('player.loopClear') }}
            </button>
          </div>
          <p class="muted small">
            {{
              loopActive
                ? t('player.loopOn', { a: (loopA ?? 0) + 1, b: (loopB ?? 0) + 1 })
                : t('player.loopPick')
            }}
          </p>
        </div>

        <div class="card dictation">
          <h3><UiIcon name="write" /> {{ t('player.dictation') }}</h3>
          <form @submit.prevent="check">
            <input
              v-model="typed"
              type="text"
              spellcheck="false"
              autocomplete="off"
              :placeholder="t('player.dictationHint')"
            />
            <button type="submit" class="btn btn--sm" :disabled="!typed.trim()">
              {{ t('player.check') }}
            </button>
          </form>
          <p v-if="result" class="result" :class="{ ok: result.pass }">
            <strong>{{ result.pass ? t('player.correct') : t('player.wrong') }}</strong>
            <span v-if="!result.pass" class="answer">{{ lines[index].en }}</span>
            <span class="muted small">({{ Math.round(result.accuracy * 100) }}%)</span>
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.player {
  display: grid;
  gap: var(--sp-4);
}
.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-4);
}
.controls {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.now {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: var(--sp-3);
  min-width: 0;
}
.now-title :deep(.ui-icon) {
  color: var(--c-primary);
}
h2 {
  margin: 0;
  font-size: var(--fs-md);
  font-weight: 800;
}
h3 {
  margin: 0 0 var(--sp-2);
  font-size: var(--fs-md);
  font-weight: 800;
}
.dictation h3 {
  color: var(--c-xp);
}
.muted {
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.small {
  font-size: var(--fs-xs);
}
.speed {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.seg {
  display: inline-flex;
  gap: var(--sp-1);
  padding: var(--sp-1);
  border-radius: var(--r-md);
  background: var(--c-surface-2);
}
.seg-btn {
  min-height: 28px;
  padding: 0 var(--sp-3);
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  font-size: var(--fs-sm);
  font-weight: 600;
  cursor: pointer;
}
.seg-btn.on {
  background: var(--c-surface);
  color: var(--c-ink);
  box-shadow: var(--shadow-sm);
}
.cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
  gap: var(--sp-4);
  align-items: start;
}
@media (max-width: 900px) {
  .cols {
    grid-template-columns: minmax(0, 1fr);
  }
}
.side {
  display: grid;
  gap: var(--sp-3);
}
.talk-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}
.toggles,
.loop-btns {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}
.ctl {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--c-line);
  background: var(--c-surface);
  color: var(--c-ink);
  cursor: pointer;
  border-radius: var(--r-pill);
}
.ctl:hover {
  background: var(--c-surface-2);
}
.ctl.main {
  width: 56px;
  height: 44px;
  border-color: var(--c-coin);
  background: var(--c-primary);
  color: var(--c-on-primary);
}
.hidden-note {
  margin: 0 0 var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  font-size: var(--fs-sm);
  background: var(--c-warning-soft);
  border: 2px solid var(--c-coin);
  border-radius: var(--r-md);
}
.lines {
  display: grid;
  gap: var(--sp-1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.line {
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
}
.line.inLoop {
  background: var(--c-xp-soft);
}
.line.current {
  background: var(--c-warning-soft);
  font-weight: 600;
}
.num {
  min-width: 26px;
  height: 26px;
  border: 2px solid var(--c-line);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-size: var(--fs-xs);
  font-weight: 700;
  cursor: pointer;
  border-radius: var(--r-pill);
}
.speaker {
  padding: 0 var(--sp-2);
  font-size: var(--fs-xs);
  font-weight: 700;
  border-radius: var(--r-pill);
}
.speaker.A {
  background: var(--c-xp-soft);
  color: var(--c-xp);
}
.speaker.B {
  background: var(--c-success-soft);
  color: var(--c-success);
}
.text {
  flex: 1;
  font-size: var(--fs-lg);
  line-height: 1.45;
}
.vi {
  display: block;
  font-size: var(--fs-sm);
  font-weight: 400;
  color: var(--c-ink-soft);
}
.mask {
  color: var(--c-ink-soft);
  letter-spacing: 2px;
}
.dictation form {
  display: grid;
  gap: var(--sp-2);
  justify-items: start;
}
.dictation input {
  box-sizing: border-box;
  width: 100%;
  padding: var(--sp-2) var(--sp-3);
  border: 2px solid var(--c-line);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  outline: none;
  border-radius: var(--r-md);
}
.result {
  display: grid;
  gap: var(--sp-1);
  margin: var(--sp-3) 0 0;
  padding: var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
.result.ok {
  background: var(--c-success-soft);
  color: var(--c-success);
}
.answer {
  color: var(--c-ink);
  font-weight: 700;
}
</style>
