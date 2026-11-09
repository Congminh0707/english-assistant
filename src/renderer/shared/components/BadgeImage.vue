<script setup lang="ts">
import { computed } from 'vue'
import type { BadgeTier } from '@shared/badgeArt'
import UiIcon from './UiIcon.vue'

// Huy hiệu thành tựu v3: SVG vector theo từng thành tựu (pnpm badges → assets/badges/<id>.svg).
// Chưa mở khoá: cùng hình, chuyển xám + biểu tượng khoá. Thiếu ảnh thì hiện vòng tròn có icon.
const props = withDefaults(
  defineProps<{ id?: string; glyph: string; tier: BadgeTier; locked?: boolean; size?: number }>(),
  { id: undefined, locked: false, size: 96 }
)

const images = import.meta.glob('../assets/badges/*.svg', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const src = computed(() =>
  props.id ? (images[`../assets/badges/${props.id}.svg`] as string | undefined) : undefined
)
</script>

<template>
  <span
    v-if="src"
    class="badge"
    :class="[`tier-${tier}`, { locked }]"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <img class="badge-img" :src="src" :width="size" :height="size" alt="" draggable="false" />
    <span v-if="locked" class="lock"><UiIcon name="lock" :size="Math.round(size / 5)" /></span>
  </span>
  <span
    v-else
    class="badge-fallback"
    :class="[`tier-${tier}`, { locked }]"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <UiIcon :name="locked ? 'lock' : 'star'" :size="Math.round(size / 2)" />
  </span>
</template>

<style scoped>
.badge {
  position: relative;
  display: inline-block;
  flex: none;
}
.badge-img {
  display: block;
}
.locked .badge-img {
  filter: grayscale(1);
  opacity: 0.4;
}
.lock {
  position: absolute;
  right: 12%;
  bottom: 18%;
  display: inline-flex;
  padding: 4px;
  border-radius: var(--r-pill);
  background: var(--c-ink);
  color: var(--c-surface);
}
.badge-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--c-coin);
  border-radius: var(--r-pill);
  background: var(--c-warning-soft);
  color: var(--c-warning);
}
.badge-fallback.locked {
  border-color: var(--c-line);
  background: var(--c-surface-2);
  color: var(--c-ink-soft);
}
</style>
