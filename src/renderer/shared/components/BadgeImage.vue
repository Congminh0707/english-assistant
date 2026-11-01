<script setup lang="ts">
import { computed } from 'vue'
import type { BadgeTier } from '@shared/badgeArt'
import UiIcon from './UiIcon.vue'

// Huy hiệu thành tựu: ảnh PNG 256×256 đóng gói sẵn (pnpm badges).
// Thiếu ảnh thì hiện vòng tròn có icon (không vẽ pixel).
const props = withDefaults(
  defineProps<{ glyph: string; tier: BadgeTier; locked?: boolean; size?: number }>(),
  { locked: false, size: 96 }
)

const images = import.meta.glob('../assets/badges/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const src = computed(
  () =>
    images[`../assets/badges/${props.locked ? 'locked' : `${props.glyph}-${props.tier}`}.png`] as
      string | undefined
)
const shiny = computed(() => !props.locked && props.tier === 'diamond')
</script>

<template>
  <img
    v-if="src"
    class="badge-img"
    :class="[`tier-${tier}`, { locked, shiny }]"
    :src="src"
    :width="size"
    :height="size"
    alt=""
    aria-hidden="true"
    draggable="false"
  />
  <span
    v-else
    class="badge-fallback"
    :class="[`tier-${tier}`, { locked, shiny }]"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <UiIcon :name="locked ? 'lock' : 'star'" :size="Math.round(size / 2)" />
  </span>
</template>

<style scoped>
.badge-img {
  display: block;
  image-rendering: auto;
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
.shiny {
  animation: shine 2.4s ease-in-out infinite;
}
@keyframes shine {
  50% {
    filter: brightness(1.25);
  }
}
@media (prefers-reduced-motion: reduce) {
  .shiny {
    animation: none;
  }
}
</style>
