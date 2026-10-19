<script setup lang="ts">
import { computed } from 'vue'
import { BADGE_SIZE, badgePixels, mergeRuns, type BadgeTier } from '@shared/badgeArt'

// Huy hiệu pixel art (huy chương theo hạng + biểu tượng), vẽ bằng SVG, phóng to nguyên số nên luôn sắc nét.
const props = withDefaults(
  defineProps<{ glyph: string; tier: BadgeTier; locked?: boolean; size?: number }>(),
  { locked: false, size: 96 }
)

const rects = computed(() => mergeRuns(badgePixels(props.glyph, props.tier, props.locked)))
</script>

<template>
  <svg
    class="pixel-badge"
    :class="[`tier-${tier}`, { locked, shiny: !locked && tier === 'diamond' }]"
    :width="size"
    :height="size"
    :viewBox="`0 0 ${BADGE_SIZE} ${BADGE_SIZE}`"
    shape-rendering="crispEdges"
    aria-hidden="true"
  >
    <rect
      v-for="(r, i) in rects"
      :key="i"
      :x="r.x"
      :y="r.y"
      :width="r.w"
      height="1"
      :fill="r.color"
    />
  </svg>
</template>

<style scoped>
.pixel-badge {
  display: block;
  image-rendering: pixelated;
}
.pixel-badge.shiny {
  animation: shine 2.4s ease-in-out infinite;
}
@keyframes shine {
  50% {
    filter: brightness(1.25);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pixel-badge.shiny {
    animation: none;
  }
}
</style>
