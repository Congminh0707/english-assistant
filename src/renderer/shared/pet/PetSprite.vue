<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { accessoryBackUrl, accessoryUrl, COLUMNS, FRAME, IDLE_FRAMES, sheetUrl } from './sprites'
import { HIRES_FRAME, hiresIdleBitmap, hiresReady, hiresVersion, startHires } from './hires'

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

// Gói sprite 288px (nếu đã tải): chỉ lấy hàng idle của thân + phụ kiện (ImageBitmap) rồi VẼ LÊN CANVAS — không dùng
// nguyên sheet 2304×8928 (≈ 82 MB giải mã) làm background-image, xem hires.ts hiresIdleBitmap.
const hires = shallowRef<{ body: ImageBitmap; front: ImageBitmap[]; back: ImageBitmap[] } | null>(
  null
)
const canvas = ref<HTMLCanvasElement>()
let loadToken = 0
async function loadHires(): Promise<void> {
  const token = ++loadToken
  if (!hiresReady.value) {
    hires.value = null
    return
  }
  const char = props.character
  const body = await hiresIdleBitmap(char, props.stage, 'sheet')
  if (!body) {
    if (token === loadToken) hires.value = null
    return
  }
  const ids = props.accessories.map((id) => id.split(':')[1])
  const [front, back] = await Promise.all([
    Promise.all(ids.map((n) => hiresIdleBitmap(char, props.stage, `acc-${n}`))),
    Promise.all(ids.map((n) => hiresIdleBitmap(char, props.stage, `accb-${n}`)))
  ])
  if (token !== loadToken) return
  hires.value = {
    body,
    front: front.filter((b): b is ImageBitmap => !!b),
    back: back.filter((b): b is ImageBitmap => !!b)
  }
}

function draw(): void {
  const cv = canvas.value
  const h = hires.value
  const ctx = cv?.getContext('2d')
  if (!cv || !h || !ctx) return
  const n = Math.round(props.size * Math.min(window.devicePixelRatio || 1, 2))
  if (cv.width !== n) {
    cv.width = n
    cv.height = n
  }
  ctx.clearRect(0, 0, n, n)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const sx = frame.value * HIRES_FRAME
  for (const bm of [...h.back, h.body, ...h.front]) {
    ctx.drawImage(bm, sx, 0, HIRES_FRAME, HIRES_FRAME, 0, 0, n, n)
  }
}
watch([frame, hires, () => props.size], draw, { flush: 'post' })
watch(
  () => [props.character, props.stage, props.accessories.join(','), hiresVersion.value] as const,
  () => void loadHires(),
  { immediate: true }
)

onMounted(() => {
  void startHires()
  if (!props.animate || reducedMotion) return
  timer = window.setInterval(() => (frame.value = (frame.value + 1) % IDLE_FRAMES), 170)
})
onUnmounted(() => window.clearInterval(timer))

const px = computed(() => `${props.size}px`)
// Style của từng lớp KHÔNG phụ thuộc `frame` (chỉ ảnh + kích thước): khi chạy hoạt ảnh chỉ biến CSS --f trên phần tử
// gốc đổi, còn style các lớp giữ nguyên đối tượng nên Vue không gán lại. Trước đây vị trí khung nằm trong style lớp →
// mỗi 170 ms Vue gán lại cả `background-image` (data URL hàng trăm KB của gói 288px) cho mọi sprite đang chạy → giật.
const layerStyle = (url: string): Record<string, string> => {
  const k = props.size / FRAME
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${FRAME * COLUMNS * k}px auto`
  }
}
const rootStyle = computed(() => ({
  width: px.value,
  height: px.value,
  '--sz': px.value,
  '--f': String(frame.value)
}))
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
    :class="{ silhouette, hires: !!hires }"
    :style="rootStyle"
    role="img"
    aria-hidden="true"
  >
    <canvas v-if="hires" ref="canvas" class="cv" :style="{ width: px, height: px }" />
    <template v-else>
      <div v-for="(style, i) in back" :key="`b${i}`" class="layer" :style="style" />
      <div class="layer" :style="body" />
      <div v-for="(style, i) in front" :key="`f${i}`" class="layer" :style="style" />
    </template>
  </div>
</template>

<style scoped>
.pet-sprite {
  position: relative;
  flex: none;
  image-rendering: pixelated;
  /* Vẽ lại một sprite không kéo theo cả trang */
  contain: layout paint style;
}
.layer {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-position: calc(var(--f, 0) * var(--sz, 96px) * -1) 0;
  image-rendering: pixelated;
}
.cv {
  position: absolute;
  inset: 0;
  /* Ảnh 288px thu nhỏ: làm mịn thay vì pixelated để không răng cưa */
  image-rendering: auto;
}
.silhouette {
  filter: brightness(0) opacity(0.35);
}
</style>
