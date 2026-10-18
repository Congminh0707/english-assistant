<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

// Phase 0: popup trống. Phase 1 hiển thị kết quả tra từ/dịch (docs/12-ui-ux-guidelines.md#popup-dịch-nhanh).
// Chuỗi viết cứng tiếng Việt, Phase 1 chuyển sang i18n.

function hide(): void {
  window.api.popup.hide()
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') hide()
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="popup">
    <header class="header">
      <span class="title">Dịch nhanh</span>
      <button class="close" type="button" aria-label="Đóng" @click="hide">✕</button>
    </header>
    <main class="body">
      <p class="empty">Chưa có nội dung.</p>
      <p class="hint">
        Sắp có: copy chữ tiếng Anh rồi bấm <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>T</kbd> để tra
        nghĩa ngay tại đây.
      </p>
    </main>
    <footer class="footer"><kbd>Esc</kbd> hoặc click ra ngoài để đóng</footer>
  </div>
</template>

<style scoped>
.popup {
  --c-bg: #fdf6e3;
  --c-ink: #2b2b3a;
  --c-ink-soft: #6b6b80;
  --c-border: #2b2b3a;
  --c-primary: #5b8def;

  box-sizing: border-box;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--c-bg);
  color: var(--c-ink);
  border: 2px solid var(--c-border);
  font-family: system-ui, 'Segoe UI', sans-serif;
  font-size: 14px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--c-primary);
  color: #fff;
  border-bottom: 2px solid var(--c-border);
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
kbd {
  padding: 0 4px;
  border: 1px solid var(--c-ink-soft);
  border-bottom-width: 2px;
  font-family: inherit;
  font-size: 12px;
  background: #fff;
}
</style>
