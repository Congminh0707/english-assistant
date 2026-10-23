<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { accessoryBackUrl, accessoryUrl, COLUMNS, FRAME, IDLE_FRAMES, sheetUrl } from './sprites'
import { HIRES_FRAME, hiresAsset, hiresReady, hiresVersion, startHires } from './hires'

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

// Gói sprite 288px (nếu đã tải): ảnh thân + phụ kiện lấy từ main thay cho sprite 96px của bộ cài
const hires = ref<{ body: string; front: string[]; back: string[] } | null>(null)
let loadToken = 0
async function loadHires(): Promise<void> {
  const token = ++loadToken
  if (!hiresReady.value) {
    hires.value = null
    return
  }
  const char = props.character
  const body = await hiresAsset(char, props.stage, 'sheet')
  if (!body) {
    if (token === loadToken) hires.value = null
    return
  }
  const ids = props.accessories.map((id) => id.split(':')[1])
  const [front, back] = await Promise.all([
    Promise.all(ids.map((n) => hiresAsset(char, props.stage, `acc-${n}`))),
    Promise.all(ids.map((n) => hiresAsset(char, props.stage, `accb-${n}`)))
  ])
  if (token !== loadToken) return
  hires.value = {
    body,
    front: front.filter((u): u is string => !!u),
    back: back.filter((u): u is string => !!u)
  }
}
watch(
  () => [props.character, props.stage, props.accessories.join(','), hiresVersion.value] as const,
  () => void loadHires(),
  { immediate: true }
)

onMounted(() => {
  startHires()
  if (!props.animate || reducedMotion) return
  timer = window.setInterval(() => (frame.value = (frame.value + 1) % IDLE_FRAMES), 170)
})
onUnmounted(() => window.clearInterval(timer))

const px = computed(() => `${props.size}px`)
const layerStyle = (url: string, cell = FRAME): Record<string, string> => {
  const k = props.size / cell
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${cell * COLUMNS * k}px auto`,
    backgroundPosition: `${-frame.value * props.size}px 0`
  }
}
const body = computed(() =>
  hires.value
    ? layerStyle(hires.value.body, HIRES_FRAME)
    : layerStyle(sheetUrl(props.character, props.stage))
)
const front = computed(() =>
  hires.value
    ? hires.value.front.map((u) => layerStyle(u, HIRES_FRAME))
    : props.accessories.flatMap((id) => {
        const url = accessoryUrl(props.character, props.stage, id)
        return url ? [layerStyle(url)] : []
      })
)
const back = computed(() =>
  hires.value
    ? hires.value.back.map((u) => layerStyle(u, HIRES_FRAME))
    : props.accessories.flatMap((id) => {
        const url = accessoryBackUrl(props.character, props.stage, id)
        return url ? [layerStyle(url)] : []
      })
)
</script>

<template>
  <div
    class="pet-sprite"
    :class="{ silhouette, hires: !!hires }"
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
.hires,
.hires .layer {
  /* Ảnh 288px thu nhỏ: làm mịn thay vì pixelated để không răng cưa */
  image-rendering: auto;
}
.silhouette {
  filter: brightness(0) opacity(0.35);
}
</style>
