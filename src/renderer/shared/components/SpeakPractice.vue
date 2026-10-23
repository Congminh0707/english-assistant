<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { phonemeTipId, scorePhonemes, type PhonemeScore } from '@shared/phonemes'
import {
  fluencyStats,
  scoreSpeech,
  STT_MIN_SECONDS,
  STT_SAMPLE_RATE,
  type SpeechScore
} from '@shared/speech'
import { IpcError } from '../ipc'
import { useRecorder } from '../composables/useRecorder'
import { useStt } from '../composables/useStt'
import { useTts } from '../composables/useTts'
import PxBar from './PxBar.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Luyện nói: ghi âm → chấm. Hai chế độ:
//  • "từ": Whisper nhận dạng offline → so với câu mẫu theo từng từ (mặc định);
//  • "âm vị": wav2vec2 (model tuỳ chọn tải thêm ~355 MB) → so từng âm, chỉ ra âm nào sai + mẹo tiếng Việt.
// Âm thanh chỉ ở trong bộ nhớ, không lưu và không log.
const props = defineProps<{
  /** Câu/từ/chữ mẫu cần nói */
  expected: string
  /** Hiện nút "Nghe mẫu" */
  canListen?: boolean
  /** Ưu tiên chấm theo âm vị khi model đã tải (nếu chưa tải thì chấm theo từ + gợi ý tải model) */
  phonemes?: boolean
  /** Chỉ chấm theo âm vị (vd chữ cái, âm đơn): chưa có model thì mời tải model phát âm */
  phonemeOnly?: boolean
}>()
const emit = defineEmits<{ scored: [score: SpeechScore, heard: string] }>()

const { t } = useI18n()
const stt = useStt()
const { speak } = useTts()

const busy = ref(false)
const failure = ref('')
const heard = ref('')
const score = ref<SpeechScore | null>(null)
const pace = ref<{ wpm: number; longPauses: number } | null>(null)
const phonemeScore = ref<PhonemeScore | null>(null)
const expectedIpa = ref('')
const heardIpa = ref('')

const recorder = useRecorder({ onLimit: () => void finish() })
const recording = computed(() => recorder.state.value === 'recording')
const MB = 1_048_576

const pronReady = computed(() => stt.pronunciation.value?.state === 'ready')
const pronAvailable = computed(() => stt.pronunciation.value?.available === true)
const whisperReady = computed(() => stt.status.value?.state === 'ready')
/** Chế độ chấm đang dùng */
const mode = computed<'phoneme' | 'words'>(() =>
  (props.phonemeOnly || props.phonemes) && pronReady.value ? 'phoneme' : 'words'
)
/** Model cần tải trước khi dùng được; null = đã sẵn sàng */
const needs = computed<'pron' | 'whisper' | null>(() => {
  if (props.phonemeOnly) return pronReady.value ? null : 'pron'
  return whisperReady.value || (props.phonemes && pronReady.value) ? null : 'whisper'
})
/** Gợi ý tải model âm vị khi đang chấm theo từ */
const suggestPron = computed(
  () => !!props.phonemes && !props.phonemeOnly && pronAvailable.value && !pronReady.value
)

const setupStatus = computed(() =>
  needs.value === 'pron' ? stt.pronunciation.value : stt.status.value
)
const downloading = computed(() => setupStatus.value?.state === 'downloading')
const percent = computed(() => {
  const s = setupStatus.value
  return s && s.sizeBytes ? Math.min(100, Math.round((s.receivedBytes / s.sizeBytes) * 100)) : 0
})
const sizeMb = computed(() => Math.round((setupStatus.value?.sizeBytes ?? 0) / MB))
const pronSizeMb = computed(() => Math.round((stt.pronunciation.value?.sizeBytes ?? 0) / MB))

const micError = computed(() =>
  recorder.error.value ? t(`speech.error.${recorder.error.value}`) : ''
)

/** Mẹo sửa cho các âm sai/thiếu (tối đa 3, không lặp); mẹo âm cuối chỉ hiện với âm cuối từ */
const tips = computed(() => {
  const list = phonemeScore.value?.phonemes ?? []
  const lastIndex = list.reduce((acc, p, i) => (p.status !== 'extra' ? i : acc), -1)
  const seen = new Set<string>()
  const out: Array<{ phoneme: string; id: string }> = []
  list.forEach((p, i) => {
    if (p.status !== 'wrong' && p.status !== 'missing') return
    const id = phonemeTipId(p.phoneme)
    if (!id || seen.has(id)) return
    if (id.startsWith('end_') && i !== lastIndex) return
    seen.add(id)
    out.push({ phoneme: p.phoneme, id })
  })
  return out.slice(0, 3)
})

async function toggle(): Promise<void> {
  if (busy.value) return
  if (recording.value) return finish()
  reset()
  await recorder.start()
}

function reset(): void {
  score.value = null
  phonemeScore.value = null
  heard.value = ''
  failure.value = ''
  pace.value = null
}

async function finish(): Promise<void> {
  const audio = await recorder.stop()
  if (!audio) return
  if (audio.length < STT_MIN_SECONDS * STT_SAMPLE_RATE) {
    failure.value = t('speech.nothing')
    return
  }
  busy.value = true
  try {
    if (mode.value === 'phoneme') await scoreByPhonemes(audio)
    else await scoreByWords(audio)
  } catch (err) {
    failure.value = t(err instanceof IpcError ? err.info.messageKey : 'errors.sttFailed')
  } finally {
    busy.value = false
  }
}

async function scoreByWords(audio: Float32Array): Promise<void> {
  const result = await stt.transcribe(audio)
  heard.value = result.text
  if (!result.text.trim()) {
    failure.value = t('speech.nothing')
    return
  }
  score.value = scoreSpeech(props.expected, result.text)
  const f = fluencyStats(result.words)
  pace.value = result.words.length > 2 ? { wpm: f.wpm, longPauses: f.longPauses } : null
  emit('scored', score.value, result.text)
}

async function scoreByPhonemes(audio: Float32Array): Promise<void> {
  const ev = await stt.evaluatePronunciation(audio, props.expected)
  if (!ev.heard.length) {
    failure.value = t('speech.nothing')
    return
  }
  const result = scorePhonemes(ev.expected, ev.heard)
  phonemeScore.value = result
  expectedIpa.value = ev.expected.join(' ')
  heardIpa.value = ev.heard.join(' ')
  heard.value = heardIpa.value
  // Dùng chung kiểu điểm với chấm theo từ để bài tập (đạt ≥ 70) hoạt động như nhau
  score.value = {
    accuracy: result.accuracy,
    verdict: result.verdict,
    words: [],
    expectedCount: result.expectedCount,
    correctCount: result.correctCount
  }
  emit('scored', score.value, heardIpa.value)
}

function retry(): void {
  reset()
}

async function install(): Promise<void> {
  failure.value = ''
  if (needs.value === 'pron') await stt.installPronunciation()
  else await stt.install()
}

function cancelInstall(): void {
  if (needs.value === 'pron') stt.cancelPronunciation()
  else stt.cancel()
}
</script>

<template>
  <div class="speak">
    <!-- Chưa có model cần thiết: mời tải -->
    <div v-if="needs" class="setup">
      <p v-if="needs === 'pron' && !pronAvailable">{{ t('speech.pronSoon') }}</p>
      <template v-else>
        <p>
          {{
            needs === 'pron'
              ? t('speech.pronNeed', { mb: sizeMb })
              : t('speech.needModel', { mb: sizeMb })
          }}
        </p>
        <template v-if="downloading">
          <PxBar :value="percent" :max="100" />
          <span class="muted">{{ t('speech.downloading', { pct: percent }) }}</span>
          <button type="button" class="btn" @click="cancelInstall">{{ t('speech.cancel') }}</button>
        </template>
        <template v-else>
          <button type="button" class="btn btn--primary" @click="install">
            {{ t('speech.download', { mb: sizeMb }) }}
          </button>
          <span v-if="setupStatus?.state === 'error'" class="err">{{
            t(setupStatus.errorKey ?? 'errors.modelDownload')
          }}</span>
        </template>
      </template>
    </div>

    <template v-else>
      <div class="actions">
        <button
          v-if="canListen"
          type="button"
          class="btn"
          :disabled="recording || busy"
          @click="speak(expected, undefined, 0.9)"
        >
          <UiIcon name="volume" /> {{ t('speech.listenSample') }}
        </button>
        <button
          type="button"
          class="mic"
          :class="{ on: recording }"
          :disabled="busy"
          :aria-pressed="recording"
          @click="toggle"
        >
          <span class="mic-icon"><UiIcon :name="recording ? 'stop' : 'mic'" /></span>
          {{ busy ? t('speech.processing') : recording ? t('speech.stop') : t('speech.record') }}
        </button>
      </div>

      <div v-if="recording" class="meter" role="status">
        <div class="level" :style="{ width: `${Math.round(recorder.level.value * 100)}%` }" />
        <span>{{ t('speech.recording', { s: recorder.seconds.value }) }}</span>
      </div>
      <p v-if="micError" class="err">{{ micError }}</p>
      <p v-if="failure" class="err">{{ failure }}</p>

      <!-- Kết quả theo âm vị -->
      <div v-if="phonemeScore && score" class="result" :class="score.verdict">
        <div class="verdict">
          {{ t(`speech.verdict.${score.verdict}`) }} ·
          {{ t('speech.accuracy', { n: score.accuracy }) }}
        </div>
        <p class="phonemes">
          <span v-for="(p, i) in phonemeScore.phonemes" :key="i" class="ph" :class="p.status">
            /{{ p.phoneme }}/<small v-if="p.heard"> → /{{ p.heard }}/</small>
          </span>
        </p>
        <p class="muted small">
          {{ t('speech.expectedIpa') }} /{{ expectedIpa }}/ · {{ t('speech.heardIpa') }} /{{
            heardIpa
          }}/
        </p>
        <ul v-if="tips.length" class="tips">
          <li v-for="tip in tips" :key="tip.id">
            <strong>/{{ tip.phoneme }}/</strong> {{ t(`phoneme.tip.${tip.id}`) }}
          </li>
        </ul>
        <p class="muted small">{{ t('speech.disclaimer') }}</p>
        <button type="button" class="btn" @click="retry">{{ t('speech.retry') }}</button>
      </div>

      <!-- Kết quả theo từ -->
      <div v-else-if="score" class="result" :class="score.verdict">
        <div class="verdict">
          {{ t(`speech.verdict.${score.verdict}`) }} ·
          {{ t('speech.accuracy', { n: score.accuracy }) }}
        </div>
        <p class="words">
          <span v-for="(w, i) in score.words" :key="i" class="w" :class="w.status">
            {{ w.word }}<small v-if="w.heard"> ({{ w.heard }})</small>
          </span>
        </p>
        <p class="muted heard">{{ t('speech.heard') }} “{{ heard }}”</p>
        <p v-if="pace" class="muted">
          {{ t('speech.pace', { wpm: pace.wpm, n: pace.longPauses }) }}
        </p>
        <p class="muted small">{{ t('speech.disclaimer') }}</p>
        <button type="button" class="btn" @click="retry">{{ t('speech.retry') }}</button>
      </div>

      <p v-if="suggestPron && !downloading" class="suggest">
        {{ t('speech.pronBanner', { mb: pronSizeMb }) }}
        <button type="button" class="btn btn--sm" @click="stt.installPronunciation()">
          {{ t('speech.download', { mb: pronSizeMb }) }}
        </button>
      </p>
      <p v-else-if="suggestPron" class="suggest">
        {{
          t('speech.downloading', {
            pct: stt.pronunciation.value?.sizeBytes
              ? Math.round(
                  (stt.pronunciation.value.receivedBytes / stt.pronunciation.value.sizeBytes) * 100
                )
              : 0
          })
        }}
      </p>
    </template>
  </div>
</template>

<style scoped>
.speak {
  display: grid;
  gap: 10px;
  justify-items: center;
  text-align: center;
}
.setup {
  display: grid;
  gap: 8px;
  justify-items: center;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}
.mic {
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  background: var(--c-surface);
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.mic:disabled {
  opacity: 0.5;
  cursor: default;
}
.mic {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 150px;
  justify-content: center;
  background: var(--c-success);
  color: #fff;
  font-size: 16px;
  border-radius: var(--r-md);
}
.mic.on {
  background: #d8364e;
  animation: pulse 1s steps(2) infinite;
}
.mic-icon {
  font-size: 20px;
}
.meter {
  display: grid;
  gap: 4px;
  width: min(320px, 100%);
}
.level {
  height: 10px;
  background: var(--c-success);
  transition: width 0.06s linear;
  border-radius: var(--r-pill);
}
.result {
  display: grid;
  gap: 6px;
  justify-items: center;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--c-line);
  background: var(--c-surface);
  border-radius: var(--r-md);
}
.result.great {
  background: var(--c-success-soft);
}
.result.good {
  background: #fff8e0;
}
.result.retry {
  background: #fdebec;
}
.verdict {
  font-size: 16px;
  font-weight: 700;
}
.words,
.phonemes {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  justify-content: center;
  font-size: 18px;
}
.w.ok,
.ph.ok {
  color: #1f8a4c;
  font-weight: 700;
}
.w.wrong,
.ph.wrong {
  color: #d8364e;
  font-weight: 700;
}
.w.missing,
.ph.missing {
  color: var(--c-ink-soft);
  text-decoration: line-through;
}
.w.extra,
.ph.extra {
  color: #b46a00;
  font-style: italic;
}
.tips {
  margin: 0;
  padding: 6px 10px;
  list-style: none;
  text-align: left;
  font-size: 13px;
  background: #fff;
  border-left: 4px solid var(--c-primary);
  display: grid;
  gap: 4px;
  border-radius: var(--r-md);
}
.suggest {
  margin: 0;
  font-size: 12px;
  color: var(--c-ink-soft);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: 13px;
}
.small {
  font-size: 12px;
}
.err {
  margin: 0;
  color: #d8364e;
  font-size: 13px;
}
@keyframes pulse {
  50% {
    filter: brightness(1.25);
  }
}
@media (prefers-reduced-motion: reduce) {
  .mic.on {
    animation: none;
  }
}
</style>
