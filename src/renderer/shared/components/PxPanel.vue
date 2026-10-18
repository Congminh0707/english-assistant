<script setup lang="ts">
// Khung pixel dùng chung: viền đậm + bóng bậc thang (docs/12-ui-ux-guidelines.md#2)
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
  padding: 8px 10px;
  background: var(--c-surface);
  color: var(--c-ink);
  border: var(--px) solid var(--c-border);
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
  font-family: var(--font-ui);
  font-size: 13px;
  line-height: 1.4;
}
.px-panel.primary {
  background: var(--c-primary);
  color: #fff;
}
</style>
