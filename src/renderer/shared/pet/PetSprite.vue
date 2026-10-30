<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import {
  accessoryBackUrl,
  accessoryUrl,
  COLUMNS,
  FRAME,
  FRAME_H,
  FRAME_W,
  IDLE_FRAMES,
  PAD_TOP,
  PAD_X,
  sheetUrl,
  WALK_FPS,
  WALK_FRAMES
} from './sprites'
import {
  hiresReady,
  hiresStrip,
  hiresVersion,
  startHires,
  type SpriteStrip,
  type StripAnim
} from './hires'

// Hiển thị một khung hình thú cưng (pixel, phóng nguyên số), có thể đeo phụ kiện, chạy idle hoặc đi bộ.
// `size` là cạnh vùng nhân vật; khung vẽ rộng hơn (lề trong suốt cho chân/đuôi/cánh) nhưng được trừ khỏi bố cục
// bằng margin âm nên chiếm đúng size × size.
const props = withDefaults(
  defineProps<{
    character: string
    stage: string
    accessories?: string[]
    /** Kích thước hiển thị (px) */
    size?: number
    /** Chạy animation idle (8 frame) */
    animate?: boolean
    /** Đang di chuyển: chạy hoạt ảnh đi bộ thay cho idle */
    walking?: boolean
    /** Quay sang trái (sprite gốc nhìn sang phải) */
    flip?: boolean
    /** Bóng đen (giai đoạn chưa mở khoá) */
    silhouette?: boolean
  }>(),
  {
    accessories: () => [],
    size: 144,
    animate: false,
    walking: false,
    flip: false,
    silhouette: false
  }
)

const IDLE_LIST = Array.from({ length: IDLE_FRAMES }, (_, i) => i)
const frame = ref(0)
let timer = 0
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Gói sprite 288px (nếu đã tải): chỉ lấy các hàng của hoạt ảnh đang chạy của thân + phụ kiện (ImageBitmap) rồi VẼ LÊN
// CANVAS — không dùng nguyên sheet 2304×8928 (≈ 82 MB giải mã) làm background-image, xem hires.ts hiresStrip.
// Dải đi bộ chỉ nạp khi thú cưng đi lần đầu.
interface Layers {
  body: SpriteStrip
  front: SpriteStrip[]
  back: SpriteStrip[]
}
const hires = shallowRef<Layers | null>(null)
const hiresWalk = shallowRef<Layers | null>(null)
const canvas = ref<HTMLCanvasElement>()
let loadToken = 0

async function loadLayers(anim: StripAnim): Promise<Layers | null> {
  const char = props.character
  const body = await hiresStrip(char, props.stage, 'sheet', anim)
  if (!body) return null
  const ids = props.accessories.map((id) => id.split(':')[1])
  const [front, back] = await Promise.all([
    Promise.all(ids.map((n) => hiresStrip(char, props.stage, `acc-${n}`, anim))),
    Promise.all(ids.map((n) => hiresStrip(char, props.stage, `accb-${n}`, anim)))
  ])
  return {
    body,
    front: front.filter((b): b is SpriteStrip => !!b),
    back: back.filter((b): b is SpriteStrip => !!b)
  }
}

async function loadHires(): Promise<void> {
  const token = ++loadToken
  hiresWalk.value = null
  if (!hiresReady.value) {
    hires.value = null
    return
  }
  const idle = await loadLayers('idle')
  if (token !== loadToken) return
  hires.value = idle
  if (idle && props.walking) await loadHiresWalk()
}

async function loadHiresWalk(): Promise<void> {
  if (!hires.value || hiresWalk.value) return
  const token = loadToken
  const walk = await loadLayers('walk')
  if (token === loadToken) hiresWalk.value = walk
}

/** Lớp ảnh 288px đang vẽ: dải đi bộ khi đang đi (nếu đã nạp), còn lại dải idle */
const active = computed(() => (props.walking && hiresWalk.value) || hires.value)

function draw(): void {
  const cv = canvas.value
  const h = active.value
  const ctx = cv?.getContext('2d')
  if (!cv || !h || !ctx) return
  const { frameW, frameH } = h.body
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const nw = Math.round(geom.value.w * dpr)
  const nh = Math.round(geom.value.h * dpr)
  if (cv.width !== nw || cv.height !== nh) {
    cv.width = nw
    cv.height = nh
  }
  ctx.clearRect(0, 0, nw, nh)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  for (const l of [...h.back, h.body, ...h.front]) {
    const f = l.frames[frame.value % l.frames.length]
    if (f) ctx.drawImage(l.bitmap, f.sx, f.sy, frameW, frameH, 0, 0, nw, nh)
  }
}
watch([frame, active, () => props.size], draw, { flush: 'post' })
watch(
  () => [props.character, props.stage, props.accessories.join(','), hiresVersion.value] as const,
  () => void loadHires(),
  { immediate: true }
)

/** Chỉ số khung trong sheet 96px của bộ cài */
const sheetFrame = computed(() => {
  const list = props.walking ? WALK_FRAMES : IDLE_LIST
  return list[frame.value % list.length]
})

function restartTimer(): void {
  window.clearInterval(timer)
  frame.value = 0
  if (reducedMotion) return
  if (props.walking) {
    timer = window.setInterval(() => frame.value++, 1000 / WALK_FPS)
  } else if (props.animate) {
    timer = window.setInterval(() => frame.value++, 170)
  }
}
watch(
  () => props.walking,
  (on) => {
    restartTimer()
    if (on) void loadHiresWalk()
  }
)

onMounted(() => {
  void startHires()
  restartTimer()
})
onUnmounted(() => window.clearInterval(timer))

/** Kích thước khung vẽ (px màn hình) và lề; sheet của bộ cài theo hằng số, gói tải thêm theo sheet.json của nó */
const geom = computed(() => {
  const b = hires.value?.body
  const [fw, fh, padX, padTop] = b
    ? [b.frameW, b.frameH, b.padX, b.padTop]
    : [FRAME_W, FRAME_H, PAD_X, PAD_TOP]
  const k = props.size / (fw - 2 * padX)
  return { k, w: fw * k, h: fh * k, padX: padX * k, padTop: padTop * k }
})
// Style của từng lớp KHÔNG phụ thuộc `frame` (chỉ ảnh + kích thước): khi chạy hoạt ảnh chỉ biến CSS --fx/--fy trên phần tử
// gốc đổi, còn style các lớp giữ nguyên đối tượng nên Vue không gán lại. Trước đây vị trí khung nằm trong style lớp →
// mỗi 170 ms Vue gán lại cả `background-image` (data URL hàng trăm KB của gói 288px) cho mọi sprite đang chạy → giật.
const layerStyle = (url: string): Record<string, string> => {
  const k = props.size / FRAME
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${FRAME_W * COLUMNS * k}px auto`
  }
}
const rootStyle = computed(() => {
  const { w, h, padX, padTop } = geom.value
  return {
    width: `${w}px`,
    height: `${h}px`,
    margin: `${-padTop}px ${-padX}px 0`,
    '--sz': `${w}px`,
    '--szh': `${h}px`,
    '--fx': String(sheetFrame.value % COLUMNS),
    '--fy': String(Math.floor(sheetFrame.value / COLUMNS))
  }
})
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
    :class="{ silhouette, flip, hires: !!hires }"
    :style="rootStyle"
    role="img"
    aria-hidden="true"
  >
    <canvas
      v-if="hires"
      ref="canvas"
      class="cv"
      :style="{ width: `${geom.w}px`, height: `${geom.h}px` }"
    />
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
  background-position: calc(var(--fx, 0) * var(--sz, 96px) * -1)
    calc(var(--fy, 0) * var(--szh, 116px) * -1);
  image-rendering: pixelated;
}
.flip {
  transform: scaleX(-1);
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
