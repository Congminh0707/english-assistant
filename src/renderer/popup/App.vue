<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@renderer/shared/stores/settings'

// Phase 1 (nền tảng): popup vẫn trống. Bước sau gắn tra từ điển offline (docs/12-ui-ux-guidelines.md#popup-dịch-nhanh).
const SHORTCUT = 'Ctrl + Alt + T'

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const cleanups: Array<() => void> = []

function hide(): void {
  window.api.send('popup:hide')
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') hide()
}

watch(
  () => settingsStore.settings['ui.language'],
  (lang) => {
    locale.value = lang
  }
)

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)
  cleanups.push(settingsStore.listen())
  await settingsStore.load()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  cleanups.forEach((fn) => fn())
})
</script>

<template>
  <div class="popup">
    <header class="header">
      <span class="title">{{ t('popup.title') }}</span>
      <button class="close" type="button" :aria-label="t('popup.close')" @click="hide">✕</button>
    </header>
    <main class="body">
      <p class="empty">{{ t('popup.empty') }}</p>
      <p class="hint">{{ t('popup.hint', { shortcut: SHORTCUT }) }}</p>
    </main>
    <footer class="footer">{{ t('popup.footer') }}</footer>
  </div>
</template>

<style scoped>
.popup {
  box-sizing: border-box;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--c-bg);
  color: var(--c-ink);
  border: var(--px) solid var(--c-border);
  font-family: var(--font-ui);
  font-size: 14px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--c-primary);
  color: #fff;
  border-bottom: var(--px) solid var(--c-border);
}
.title {
  font-weight: 700;
}
.close {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 14px;
  cursor: pointer;
}
.body {
  flex: 1;
  padding: 12px;
}
.empty {
  margin: 0 0 8px;
  font-weight: 600;
}
.hint {
  margin: 0;
  color: var(--c-ink-soft);
  line-height: 1.5;
}
.footer {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--c-ink-soft);
  border-top: 1px dashed var(--c-ink-soft);
}
</style>
