<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Thẻ góc dưới trái của mọi bản đồ bé (R5World, PAsia, PEarth): tên nơi, một dòng mô tả, nút đỏ viền vàng.
defineProps<{ title: string; detail: string; action: string; note?: string }>()
const emit = defineEmits<{ go: []; close: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="card">
    <button type="button" class="close" :aria-label="t('kids.game.close')" @click="emit('close')">
      <UiIcon name="close" :size="24" />
    </button>
    <h2>{{ title }}</h2>
    <p>{{ detail }}</p>
    <p v-if="note" class="note">{{ note }}</p>
    <button type="button" class="go" @click="emit('go')">{{ action }}</button>
  </div>
</template>

<style scoped>
.card {
  position: absolute;
  bottom: 36px;
  left: 36px;
  z-index: 6;
  width: 400px;
  padding: 22px 24px;
  border: 4px solid #f7b91a;
  border-radius: 26px;
  background: #fff9ea;
  color: #3a2413;
  font-family: var(--font-kids);
  animation: k-pop 320ms ease;
}
h2 {
  margin: 0;
  padding-right: 44px;
  color: #6b3e1e;
  font-size: 38px;
  font-weight: 800;
  line-height: 1.1;
}
p {
  margin: 6px 0 16px;
  font-size: 21px;
  font-weight: 500;
}
.note {
  margin-top: -8px;
  font-size: 18px;
  color: #6b3e1e;
}
.go {
  width: 100%;
  min-height: 72px;
  padding: 0 20px;
  border: 4px solid #f7b91a;
  border-radius: 36px;
  background: #d32f2f;
  color: #fff;
  font: inherit;
  font-size: 25px;
  font-weight: 700;
  cursor: pointer;
}
.go:active {
  transform: translateY(3px);
}
.go:focus-visible,
.close:focus-visible {
  outline: 4px solid #16bfc8;
  outline-offset: 3px;
}
.close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 2px solid #e7c98e;
  border-radius: 50%;
  background: #fff;
  color: #6b3e1e;
  cursor: pointer;
}
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none;
  }
}
</style>
