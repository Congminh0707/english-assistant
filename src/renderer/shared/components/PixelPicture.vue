<script setup lang="ts">
import { computed } from 'vue'
import { PICTURE_SIZE, pictureRects } from '@shared/pictures'
import { vectorPictureUrl } from '../art'

// Hình minh hoạ cho bài tập chọn hình, lưới âm và giao diện trẻ em. Ưu tiên hình vector vẽ bằng canvas (shared/art,
// kiểu hoạt hình — docs/19 §5.5), rồi tới ảnh đóng gói sẵn: PNG 256×256 vẽ từ
// shared/pictures.ts (pnpm pictures) hoặc SVG Twemoji (CC-BY 4.0) cho các từ bổ sung; thiếu ảnh thì vẽ bản pixel
// 32×32 bằng SVG. Chỉ nhận id hình (xem shared/pictures.ts, shared/pictureExtras.ts).
const props = withDefaults(defineProps<{ id: string; size?: number }>(), { size: 96 })

const pngs = import.meta.glob('../assets/pictures/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>
const svgs = import.meta.glob('../assets/pictures/twemoji/*.svg', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const src = computed(
  () =>
    vectorPictureUrl(props.id) ??
    pngs[`../assets/pictures/${props.id}.png`] ??
    svgs[`../assets/pictures/twemoji/${props.id}.svg`]
)
const rects = computed(() => (src.value ? [] : pictureRects(props.id)))
</script>

<template>
  <img
    v-if="src"
    class="picture-img"
    :src="src"
    :width="size"
    :height="size"
    alt=""
    aria-hidden="true"
    draggable="false"
  />
  <svg
    v-else
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
.picture-img {
  display: block;
  /* Ảnh độ phân giải cao: làm mịn khi thu nhỏ */
  image-rendering: auto;
  object-fit: contain;
}
.pixel-picture {
  display: block;
  image-rendering: pixelated;
}
</style>
