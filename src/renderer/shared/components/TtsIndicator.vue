<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTtsLoading } from '../composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Chỉ báo nhỏ góc dưới phải: hiện khi giọng tự nhiên đang được tạo (để biết app vẫn đang chạy, không bị đứng).
// `compact`: bản nhỏ cho cửa sổ mascot (chỉ vòng xoay + 🔊, đặt phía trên nhân vật, không bắt chuột)
defineProps<{ compact?: boolean }>()
const loading = useTtsLoading()
const { t } = useI18n()
</script>

<template>
  <div
    v-if="loading"
    class="tts-indicator"
    :class="{ compact }"
    role="status"
    aria-live="polite"
    :title="t('tts.loading')"
  >
    <span class="spinner" aria-hidden="true" />
    <template v-if="compact"
      ><span aria-hidden="true"><UiIcon name="volume" /></span
    ></template>
    <template v-else>{{ t('tts.loading') }}</template>
  </div>
</template>

<style scoped>
.tts-indicator {
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--c-surface);
  color: var(--c-ink);
  border: var(--px) solid var(--c-border);
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
}
.tts-indicator.compact {
  top: 4px;
  right: auto;
  bottom: auto;
  left: 50%;
  transform: translateX(-50%);
  padding: 3px 8px;
  font-size: 12px;
  pointer-events: none;
}
.spinner {
  width: 14px;
  height: 14px;
  border: 3px solid var(--c-border);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 2s;
  }
}
</style>
