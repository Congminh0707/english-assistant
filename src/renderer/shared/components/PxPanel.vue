<script setup lang="ts">
// Khung giấy dùng chung: viền mảnh màu đường kẻ, bo r-lg, bóng nhẹ (docs/23-design-v2-spec.md)
defineProps<{ tone?: 'light' | 'primary' }>()
</script>

<template>
  <div class="px-panel" :class="tone ?? 'light'">
    <slot />
  </div>
</template>

<style scoped>
.px-panel {
  position: relative;
  padding: var(--sp-3);
  background: var(--c-surface);
  color: var(--c-ink);
  border: var(--panel-border, 1px solid var(--c-line));
  border-radius: var(--panel-radius, var(--r-lg));
  box-shadow: var(--panel-shadow, var(--shadow-sm));
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  line-height: 1.4;
}
.px-panel.primary {
  background: var(--c-primary);
  color: var(--c-on-primary);
}
</style>
