<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DICTATION_PASS, dictationAccuracy } from '@shared/practice'
import { useTts, type Accent } from '@renderer/shared/composables/useTts'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
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
  <PxPanel class="player">
    <header class="head">
      <h2 v-if="title"><UiIcon name="headphones" /> {{ title }}</h2>
      <span class="muted">{{ t('player.line', { n: index + 1, total }) }}</span>
    </header>

    <div class="controls">
      <button type="button" class="ctl" :title="t('player.prev')" @click="goto(index - 1, playing)">
        ⏮
      </button>
      <button
        type="button"
        class="ctl main"
        :title="playing ? t('player.pause') : t('player.play')"
        @click="toggle"
      >
        <UiIcon :name="playing ? 'pause' : 'play'" :size="20" />
      </button>
      <button type="button" class="ctl" :title="t('player.next')" @click="goto(index + 1, playing)">
        ⏭
      </button>
      <button type="button" class="ctl" :title="t('player.again')" @click="again">
        <UiIcon name="repeat" />
      </button>
      <span class="speed" :aria-label="t('player.speed')">
        <button
          v-for="s in SPEEDS"
          :key="s"
          type="button"
          class="btn btn--sm btn--pill"
          :class="{ 'btn--primary': speed === s }"
          @click="setSpeed(s)"
        >
          {{ s }}×
        </button>
      </span>
    </div>

    <div class="loop">
      <button
        type="button"
        class="btn btn--sm btn--pill"
        :class="{ 'btn--primary': loopA === index }"
        @click="setLoopA"
      >
        {{ t('player.loopA') }}
      </button>
      <button
        type="button"
        class="btn btn--sm btn--pill"
        :class="{ 'btn--primary': loopB === index }"
        @click="setLoopB"
      >
        {{ t('player.loopB') }}
      </button>
      <button v-if="loopA !== null" type="button" class="btn btn--sm btn--pill" @click="clearLoop">
        <UiIcon name="close" /> {{ t('player.loopClear') }}
      </button>
      <span class="muted small">
        {{
          loopActive
            ? t('player.loopOn', { a: (loopA ?? 0) + 1, b: (loopB ?? 0) + 1 })
            : t('player.loopPick')
        }}
      </span>
    </div>

    <div class="toggles">
      <button type="button" class="btn btn--sm btn--pill" @click="showText = !showText">
        {{ showText ? t('player.hideText') : t('player.showText') }}
      </button>
      <button v-if="hasVi" type="button" class="btn btn--sm btn--pill" @click="showVi = !showVi">
        {{ showVi ? t('player.hideVi') : t('player.showVi') }}
      </button>
    </div>

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
        <span v-if="line.speaker" class="speaker" :class="line.speaker">{{ line.speaker }}</span>
        <span class="text">
          <template v-if="showText || (i === index && result)">
            {{ line.en }}
            <small v-if="showVi && line.vi" class="vi">{{ line.vi }}</small>
          </template>
          <span v-else class="mask">••• ••• •••</span>
        </span>
      </li>
    </ol>

    <div class="dictation">
      <h3><UiIcon name="write" /> {{ t('player.dictation') }}</h3>
      <form @submit.prevent="check">
        <input
          v-model="typed"
          type="text"
          spellcheck="false"
          autocomplete="off"
          :placeholder="t('player.dictationHint')"
        />
        <button type="submit" class="btn btn--sm btn--pill" :disabled="!typed.trim()">
          {{ t('player.check') }}
        </button>
      </form>
      <p v-if="result" class="result" :class="{ ok: result.pass }">
        {{ result.pass ? t('player.correct') : t('player.wrong') }}
        <strong v-if="!result.pass">{{ lines[index].en }}</strong>
        <span class="muted small">({{ Math.round(result.accuracy * 100) }}%)</span>
      </p>
    </div>
  </PxPanel>
</template>

<style scoped>
.player {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
}
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
h2 {
  margin: 0;
  font-size: var(--fs-lg);
}
h3 {
  margin: 4px 0;
  font-size: 14px;
  color: var(--c-xp);
}
.muted {
  color: var(--c-ink-soft);
}
.small {
  font-size: 12px;
}
.controls,
.loop,
.toggles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.ctl {
  width: 38px;
  height: 38px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  font-size: 16px;
  cursor: pointer;
  border-radius: var(--r-md);
}
.ctl.main {
  width: 54px;
  height: 46px;
  background: var(--c-primary);
  color: #fff;
  font-size: 20px;
}
.speed {
  display: flex;
  gap: 4px;
  margin-left: auto;
}
.hidden-note {
  margin: 0;
  padding: 6px 10px;
  font-size: 13px;
  background: var(--c-warning-soft);
  border-left: 3px solid var(--c-warning);
  border-radius: var(--r-md);
}
.lines {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 8px;
  border-left: 3px solid transparent;
}
.line.inLoop {
  background: #eef6ff;
}
.line.current {
  background: var(--c-warning-soft);
  border-left-color: var(--c-primary);
  font-weight: 600;
}
.num {
  min-width: 24px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  border-radius: var(--r-pill);
}
.speaker {
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  border: 1px solid var(--c-line);
  border-radius: var(--r-pill);
}
.speaker.A {
  background: var(--c-xp);
}
.speaker.B {
  background: var(--c-success);
}
.text {
  flex: 1;
  font-size: 16px;
  line-height: 1.5;
}
.vi {
  display: block;
  font-weight: 400;
  color: var(--c-ink-soft);
}
.mask {
  color: var(--c-ink-soft);
  letter-spacing: 2px;
}
.dictation form {
  display: flex;
  gap: 8px;
}
.dictation input {
  box-sizing: border-box;
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  font: inherit;
  outline: none;
  border-radius: var(--r-md);
}
.result {
  margin: 6px 0 0;
  color: var(--c-danger);
}
.result.ok {
  color: var(--c-success);
}
</style>
