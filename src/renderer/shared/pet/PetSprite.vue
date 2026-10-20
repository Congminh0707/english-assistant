<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { accessoryBackUrl, accessoryUrl, COLUMNS, FRAME, IDLE_FRAMES, sheetUrl } from './sprites'

// Hiển thị một khung hình thú cưng (pixel, phóng nguyên số), có thể đeo phụ kiện và chạy idle.
const props = withDefaults(
  defineProps<{
    character: string
    stage: string
    accessories?: string[]
    /** Kích thước hiển thị (px) */
    size?: number
    /** Chạy animation idle (4 frame) */
    animate?: boolean
    /** Bóng đen (giai đoạn chưa mở khoá) */
    silhouette?: boolean
  }>(),
  { accessories: () => [], size: 144, animate: false, silhouette: false }
)

const frame = ref(0)
let timer = 0
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  if (!props.animate || reducedMotion) return
  timer = window.setInterval(() => (frame.value = (frame.value + 1) % IDLE_FRAMES), 170)
})
onUnmounted(() => window.clearInterval(timer))

const px = computed(() => `${props.size}px`)
const layerStyle = (url: string): Record<string, string> => {
  const k = props.size / FRAME
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${FRAME * COLUMNS * k}px auto`,
    backgroundPosition: `${-frame.value * props.size}px 0`
  }
}
const body = computed(() => layerStyle(sheetUrl(props.character, props.stage)))
const front = computed(() =>
  props.accessories.flatMap((id) => {
    const url = accessoryUrl(props.character, props.stage, id)
    return url ? [layerStyle(url)] : []
  })
)
const back = computed(() =>
  props.accessories.flatMap((id) => {
    const url = accessoryBackUrl(props.character, props.stage, id)
    return url ? [layerStyle(url)] : []
  })
)
</script>

<template>
  <div
    class="pet-sprite"
    :class="{ silhouette }"
    :style="{ width: px, height: px }"
    role="img"
    aria-hidden="true"
  >
    <div v-for="(style, i) in back" :key="`b${i}`" class="layer" :style="style" />
    <div class="layer" :style="body" />
    <div v-for="(style, i) in front" :key="`f${i}`" class="layer" :style="style" />
  </div>
</template>

<style scoped>
.pet-sprite {
  position: relative;
  flex: none;
  image-rendering: pixelated;
}
.layer {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  image-rendering: pixelated;
}
.silhouette {
  filter: brightness(0) opacity(0.35);
}
</style>
