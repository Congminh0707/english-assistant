<script setup lang="ts">
import { computed } from 'vue'
import { PICTURE_SIZE, pictureRects } from '@shared/pictures'

// Hình minh hoạ pixel art (32×32) vẽ bằng SVG, phóng to nguyên số nên luôn sắc nét — dùng cho bài tập chọn hình,
// lưới âm và giao diện trẻ em. Chỉ nhận id hình (xem shared/pictures.ts).
const props = withDefaults(defineProps<{ id: string; size?: number }>(), { size: 96 })

const rects = computed(() => pictureRects(props.id))
</script>

<template>
  <svg
    class="pixel-picture"
    :width="size"
    :height="size"
    :viewBox="`0 0 ${PICTURE_SIZE} ${PICTURE_SIZE}`"
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
.pixel-picture {
  display: block;
  image-rendering: pixelated;
}
</style>
