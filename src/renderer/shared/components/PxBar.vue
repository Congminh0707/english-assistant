<script setup lang="ts">
import { computed } from 'vue'

// Thanh tiến độ bo tròn (chỉ số thú cưng, XP...)
const props = defineProps<{ value: number; max?: number; color?: string; label?: string }>()
const percent = computed(() => Math.max(0, Math.min(100, (props.value / (props.max ?? 100)) * 100)))
</script>

<template>
  <div class="px-bar" role="progressbar" :aria-label="label" :aria-valuenow="Math.round(value)">
    <div class="fill" :style="{ width: `${percent}%`, background: color ?? 'var(--c-success)' }" />
  </div>
</template>

<style scoped>
.px-bar {
  height: var(--bar-height, 8px);
  overflow: hidden;
  background: var(--bar-track, var(--c-surface-2));
  border: var(--bar-border, 0);
  border-radius: var(--bar-radius, var(--r-pill));
}
.fill {
  height: 100%;
  border-radius: var(--bar-radius, var(--r-pill));
  transition: width 0.3s ease;
}
@media (prefers-reduced-motion: reduce) {
  .fill {
    transition: none;
  }
}
</style>
