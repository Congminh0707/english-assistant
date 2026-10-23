<script setup lang="ts">
import { computed } from 'vue'
import { BADGE_SIZE, badgePixels, mergeRuns, type BadgeTier } from '@shared/badgeArt'

// Huy hiệu thành tựu. Ưu tiên ảnh PNG 256×256 đóng gói sẵn (pnpm badges, vẽ từ shared/badgeArt.ts ở độ phân giải cao);
// thiếu ảnh thì vẽ bản pixel 32×32 bằng SVG (phóng nguyên số nên vẫn sắc nét).
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
const rects = computed(() =>
  src.value ? [] : mergeRuns(badgePixels(props.glyph, props.tier, props.locked))
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
  <svg
    v-else
    class="pixel-badge"
    :class="[`tier-${tier}`, { locked, shiny }]"
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
.badge-img {
  display: block;
  /* Ảnh 256px thu nhỏ: làm mịn, không dùng pixelated */
  image-rendering: auto;
}
.pixel-badge {
  display: block;
  image-rendering: pixelated;
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
