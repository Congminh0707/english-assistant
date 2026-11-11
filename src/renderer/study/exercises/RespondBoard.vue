<script setup lang="ts">
// Trả lời câu hỏi bằng giọng nói (dạng `respond`): ghi âm ≤ 30 giây → Whisper nhận dạng tại máy → hiện "Máy nghe được"
// + số liệu trôi chảy + nút "Ghi lại". Chỉ hiển thị và ghi âm; chấm (tại máy / AI khi người học bấm) do LessonExercises
// (qua store) lo. Âm thanh chỉ nằm trong bộ nhớ đến khi nhận dạng xong: không lưu, không log, không gửi đi đâu.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { respondWordCount } from '@shared/speaking'
import {
  answerFluency,
  STT_MAX_SECONDS,
  STT_MIN_SECONDS,
  STT_SAMPLE_RATE,
  type TimedWord
} from '@shared/speech'
import { IpcError } from '@renderer/shared/ipc'
import { useRecorder } from '@renderer/shared/composables/useRecorder'
import { useStt } from '@renderer/shared/composables/useStt'
import SttModelSetup from '@renderer/shared/components/SttModelSetup.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

type Answer = { text: string; words: TimedWord[] }

const props = withDefaults(
  defineProps<{
    modelValue: Answer | null
    minWords: number
    /** Nghĩa tiếng Việt của câu hỏi (bấm để hiện) */
    vi?: string
    /** Đang chấm hoặc đã chấm: khoá ghi âm/ghi lại, giữ nguyên lời nhận dạng */
    locked?: boolean
  }>(),
  { vi: undefined, locked: false }
)
const emit = defineEmits<{ 'update:modelValue': [value: Answer | null] }>()

const { t } = useI18n()
const stt = useStt()
const recorder = useRecorder({ onLimit: () => void finish() })

const busy = ref(false)
const failure = ref('')
const showVi = ref(false)

const recording = computed(() => recorder.state.value === 'recording')
const whisperReady = computed(() => stt.status.value?.state === 'ready')
const micError = computed(() =>
  recorder.error.value ? t(`speech.error.${recorder.error.value}`) : ''
)
/** Số liệu hiển thị (main tự tính lại khi chấm) */
const fluency = computed(() => (props.modelValue ? answerFluency(props.modelValue.words) : null))
const words = computed(() => (props.modelValue ? respondWordCount(props.modelValue.text) : 0))
// Đã chốt / đang chấm (vd bấm "Bỏ qua câu này" lúc đang ghi): tắt micro ngay, bỏ phần đang ghi
watch(
  () => props.locked,
  (locked) => {
    if (locked && recording.value) recorder.cancel()
  }
)

const remaining = computed(() => Math.max(0, Math.ceil(STT_MAX_SECONDS - recorder.seconds.value)))

async function toggle(): Promise<void> {
  if (busy.value || props.locked) return
  if (recording.value) return finish()
  failure.value = ''
  // Ghi lại: bỏ lời nhận dạng cũ (chưa gửi đi đâu) trước khi nói lần mới
  emit('update:modelValue', null)
  await recorder.start()
}

/** Dừng (bấm Dừng hoặc chạm giới hạn 30 giây) → nhận dạng phần đã ghi */
async function finish(): Promise<void> {
  const audio = await recorder.stop()
  if (!audio || props.locked) return
  if (audio.length < STT_MIN_SECONDS * STT_SAMPLE_RATE) {
    failure.value = t('speech.nothing')
    return
  }
  busy.value = true
  try {
    const result = await stt.transcribe(audio)
    // Bị khoá trong lúc nhận dạng (đã bỏ qua / đã chấm): không ghi đè câu trả lời
    if (props.locked) return
    // Im lặng / chỉ có từ đệm: báo nói lại, không tính là một lần trả lời, không gửi gì
    if (respondWordCount(result.text) === 0) {
      failure.value = t('speech.nothing')
      return
    }
    emit('update:modelValue', { text: result.text.trim(), words: result.words })
  } catch (err) {
    failure.value = t(err instanceof IpcError ? err.info.messageKey : 'errors.sttFailed')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="respond">
    <div v-if="vi" class="vi-row">
      <button
        type="button"
        class="btn btn--ghost btn--sm"
        :aria-expanded="showVi"
        @click="showVi = !showVi"
      >
        <UiIcon name="eye" />
        {{ showVi ? t('study.lessons.respond.hideVi') : t('study.lessons.respond.showVi') }}
      </button>
      <span v-if="showVi" class="vi">{{ vi }}</span>
    </div>

    <SttModelSetup v-if="!whisperReady && !locked" model="whisper" @install="failure = ''" />

    <template v-else>
      <div v-if="!locked && !modelValue" class="record">
        <button
          type="button"
          class="btn btn--lg btn--pill"
          :class="{ 'btn--danger': recording }"
          :disabled="busy"
          :aria-pressed="recording"
          @click="toggle"
        >
          <UiIcon :name="recording ? 'stop' : 'mic'" />
          {{
            busy
              ? t('study.lessons.respond.transcribing')
              : recording
                ? t('speech.stop')
                : t('speech.record')
          }}
        </button>
        <div v-if="recording" class="meter" role="status">
          <div class="level" :style="{ width: `${Math.round(recorder.level.value * 100)}%` }" />
          <span>{{ t('study.lessons.respond.recording', { s: remaining }) }}</span>
        </div>
        <p v-else class="muted small">
          {{ t('study.lessons.respond.recordHint', { max: STT_MAX_SECONDS }) }}
        </p>
      </div>

      <div v-if="micError" class="alert" role="alert">
        <UiIcon name="mute" />
        <span>{{ micError }}</span>
        <button type="button" class="btn btn--sm" @click="toggle">{{ t('speech.retry') }}</button>
      </div>
      <div v-if="failure" class="alert" role="alert">
        <UiIcon name="hint" />
        <span>{{ failure }}</span>
      </div>

      <div v-if="modelValue" class="heard">
        <div class="heard-head">
          <strong>{{ t('study.lessons.respond.heard') }}</strong>
          <button v-if="!locked" type="button" class="btn btn--sm" :disabled="busy" @click="toggle">
            <UiIcon name="repeat" /> {{ t('study.lessons.respond.again') }}
          </button>
        </div>
        <p class="transcript">“{{ modelValue.text }}”</p>
        <p v-if="fluency" class="muted small" aria-live="polite">
          {{ t('study.lessons.writing.words', { n: words }, words) }}
          · {{ t('study.lessons.writing.minWords', { n: minWords }) }}
          <template v-if="fluency.wpm !== null">
            · {{ t('study.lessons.respond.seconds', { n: fluency.speakingSec ?? 0 }) }} ·
            {{ t('study.lessons.respond.wpm', { n: fluency.wpm }) }} ·
            {{ t('study.lessons.respond.pauses', { n: fluency.longPauses ?? 0 }) }}
          </template>
          <template v-if="fluency.fillers">
            · {{ t('study.lessons.respond.fillers', { n: fluency.fillers }) }}
          </template>
          <template v-if="fluency.repetitions">
            · {{ t('study.lessons.respond.repeats', { n: fluency.repetitions }) }}
          </template>
        </p>
        <p class="muted small">{{ t('study.lessons.respond.asrNote') }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.respond {
  display: grid;
  gap: var(--sp-3);
}
.vi-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}
.vi {
  color: var(--c-ink-soft);
  font-weight: 600;
}
.record {
  display: grid;
  gap: var(--sp-2);
  justify-items: center;
  text-align: center;
}
.meter {
  display: grid;
  gap: var(--sp-1);
  width: min(320px, 100%);
  font-size: var(--fs-sm);
  font-weight: 600;
}
.level {
  height: 10px;
  background: var(--c-success);
  transition: width 0.06s linear;
  border-radius: var(--r-pill);
}
.heard {
  display: grid;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-surface-2);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
}
.heard-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}
.transcript {
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.small {
  font-size: var(--fs-xs);
}
.alert {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: 0;
  padding: var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-danger-soft);
  color: var(--c-danger);
  font-size: var(--fs-sm);
  font-weight: 700;
}
.alert span {
  flex: 1;
}
</style>
