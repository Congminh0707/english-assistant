<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioPack } from '../composables/useTts'
import PxBar from './PxBar.vue'

// Gói âm thanh bài nghe tạo sẵn (MP3, tải thêm): hiện trong Cài đặt và ở đầu trang Nghe. `compact` = dạng thanh mời tải.
defineProps<{ compact?: boolean }>()
const { t } = useI18n()
const pack = useAudioPack()

const state = computed(() => pack.status.value?.state ?? 'not-installed')
const sizeMb = computed(() =>
  Math.max(1, Math.round((pack.status.value?.sizeBytes ?? 0) / 1_048_576))
)
const percent = computed(() => {
  const s = pack.status.value
  return s && s.sizeBytes ? Math.min(100, Math.round((s.receivedBytes / s.sizeBytes) * 100)) : 0
})
</script>

<template>
  <!-- Dạng gọn: chỉ hiện khi chưa cài (mời tải) hoặc đang tải -->
  <div v-if="!compact || state !== 'ready'" class="audio-pack" :class="{ compact }">
    <div class="text">
      <strong>🎧 {{ t('audioPack.title') }}</strong>
      <span class="muted">{{ t('audioPack.desc', { mb: sizeMb }) }}</span>
    </div>
    <div class="actions">
      <template v-if="state === 'downloading'">
        <PxBar :value="percent" :max="100" />
        <span class="muted">{{ t('audioPack.downloading', { pct: percent }) }}</span>
        <button type="button" class="btn" @click="pack.cancel()">
          {{ t('audioPack.cancel') }}
        </button>
      </template>
      <template v-else-if="state === 'ready'">
        <span class="ok">✓ {{ t('audioPack.ready') }}</span>
        <button type="button" class="btn" @click="pack.remove()">
          {{ t('audioPack.remove') }}
        </button>
      </template>
      <template v-else>
        <button type="button" class="btn primary" @click="pack.install()">
          {{ state === 'error' ? t('audioPack.retry') : t('audioPack.download', { mb: sizeMb }) }}
        </button>
        <span v-if="state === 'error'" class="err">{{
          t(pack.status.value?.errorKey ?? 'errors.modelDownload')
        }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.audio-pack {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  background: var(--c-surface);
  border: var(--px) solid var(--c-border);
}
.audio-pack.compact {
  grid-template-columns: 1fr auto;
  align-items: center;
  background: #eef6ff;
}
.text {
  display: grid;
  gap: 2px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.muted {
  color: var(--c-ink-soft);
  font-size: 13px;
}
.ok {
  color: #1f8a4c;
  font-weight: 700;
}
.err {
  color: #d8364e;
  font-size: 13px;
}
.btn {
  padding: 5px 12px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.btn.primary {
  background: var(--c-primary);
  color: #fff;
}
</style>
