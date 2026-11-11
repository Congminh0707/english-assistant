<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStt } from '../composables/useStt'

// Mời tải model giọng nói còn thiếu (Whisper nhận dạng từ, hoặc wav2vec2 chấm âm vị): thanh tiến độ, huỷ, lỗi.
// Dùng chung cho SpeakPractice (đọc to) và RespondBoard (trả lời câu hỏi bằng giọng nói). Chỉ tải khi người dùng bấm.
const props = defineProps<{ model: 'whisper' | 'pron' }>()
const emit = defineEmits<{ install: [] }>()

const { t } = useI18n()
const stt = useStt()
const MB = 1_048_576

const status = computed(() => (props.model === 'pron' ? stt.pronunciation.value : stt.status.value))
const pronAvailable = computed(() => stt.pronunciation.value?.available === true)
const downloading = computed(() => status.value?.state === 'downloading')
const percent = computed(() => {
  const s = status.value
  return s && s.sizeBytes ? Math.min(100, Math.round((s.receivedBytes / s.sizeBytes) * 100)) : 0
})
const sizeMb = computed(() => Math.round((status.value?.sizeBytes ?? 0) / MB))

async function install(): Promise<void> {
  emit('install')
  if (props.model === 'pron') await stt.installPronunciation()
  else await stt.install()
}

function cancel(): void {
  if (props.model === 'pron') stt.cancelPronunciation()
  else stt.cancel()
}
</script>

<template>
  <div class="setup">
    <p v-if="model === 'pron' && !pronAvailable">{{ t('speech.pronSoon') }}</p>
    <template v-else>
      <p>
        {{
          model === 'pron'
            ? t('speech.pronNeed', { mb: sizeMb })
            : t('speech.needModel', { mb: sizeMb })
        }}
      </p>
      <template v-if="downloading">
        <div class="bar" role="progressbar" :aria-valuenow="percent">
          <div class="fill" :style="{ width: `${percent}%` }" />
        </div>
        <span class="muted">{{ t('speech.downloading', { pct: percent }) }}</span>
        <button type="button" class="btn" @click="cancel">{{ t('speech.cancel') }}</button>
      </template>
      <template v-else>
        <button type="button" class="btn btn--primary" @click="install">
          {{ t('speech.download', { mb: sizeMb }) }}
        </button>
        <span v-if="status?.state === 'error'" class="alert">{{
          t(status.errorKey ?? 'errors.modelDownload')
        }}</span>
      </template>
    </template>
  </div>
</template>

<style scoped>
.setup {
  display: grid;
  gap: var(--sp-2);
  justify-items: center;
}
.bar {
  width: min(320px, 100%);
  height: 8px;
  overflow: hidden;
  border-radius: var(--r-pill);
  background: var(--c-surface-2);
}
.fill {
  height: 100%;
  border-radius: var(--r-pill);
  background: var(--c-primary);
  transition: width 0.3s ease;
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.alert {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  margin: 0;
  padding: var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-danger-soft);
  color: var(--c-danger);
  font-size: var(--fs-sm);
  font-weight: 700;
  text-align: left;
}
</style>
