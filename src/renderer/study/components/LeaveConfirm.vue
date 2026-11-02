<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { leavePrompt } from '../leaveGuard'

// Hộp hỏi khi thoát giữa chừng một phiên học (leaveGuard.ts). Mặc định chọn "Ở lại" để bấm nhầm Enter không mất bài.
const { t } = useI18n()
const stay = ref<HTMLButtonElement>()

function answer(leave: boolean): void {
  leavePrompt.value?.answer(leave)
}

function onKey(e: KeyboardEvent): void {
  if (e.key !== 'Escape') return
  // Chặn các trình nghe Esc khác (vỏ trang, game) — Esc ở đây chỉ nghĩa là "ở lại"
  e.preventDefault()
  e.stopImmediatePropagation()
  answer(false)
}

onMounted(() => {
  window.addEventListener('keydown', onKey, true)
  void nextTick(() => stay.value?.focus())
})
onUnmounted(() => window.removeEventListener('keydown', onKey, true))
</script>

<template>
  <div class="scrim" @click.self="answer(false)">
    <div class="card dialog" role="dialog" aria-modal="true" aria-labelledby="leave-title">
      <h2 id="leave-title">{{ t('study.leave.title') }}</h2>
      <p>{{ t('study.leave.body') }}</p>
      <div class="actions">
        <button ref="stay" type="button" class="btn btn--primary" @click="answer(false)">
          {{ t('study.leave.stay') }}
        </button>
        <button type="button" class="btn" @click="answer(true)">
          {{ t('study.leave.leave') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: var(--sp-4);
  background: rgb(40 28 20 / 45%);
}
.dialog {
  display: grid;
  gap: var(--sp-3);
  width: min(420px, 100%);
  padding: var(--sp-5);
  text-align: center;
}
h2 {
  margin: 0;
  font-size: var(--fs-xl);
}
p {
  margin: 0;
  color: var(--c-ink-soft);
  font-weight: 600;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  justify-content: center;
}
</style>
