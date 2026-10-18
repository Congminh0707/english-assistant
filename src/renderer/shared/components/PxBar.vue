<script setup lang="ts">
import { computed } from 'vue'

// Thanh tiến độ kiểu pixel (chỉ số thú cưng, XP...)
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
  height: 8px;
  background: #e8e2d0;
  border: var(--px) solid var(--c-border);
}
.fill {
  height: 100%;
  transition: width 0.3s steps(6);
}
</style>
