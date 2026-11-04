<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { FRAMES, frameUrls, preload, prefersReducedMotion, type GameKey } from './gameArt'

// Phát sprite 6 khung của game: 'loop' vòng lặp, 'pingpong' đi rồi về, 'once' một lượt (rồi giữ khung cuối, báo `end`),
// 'still' đứng ở khung 0. Giảm chuyển động → khung 0 (once: báo `end` ngay). Dừng khi cửa sổ ẩn.
const props = withDefaults(
  defineProps<{
    game: GameKey
    name: string
    width?: number
    /** phủ hết bề ngang của khung cha (cỡ do CSS quyết) */
    fill?: boolean
    mode?: 'loop' | 'pingpong' | 'once' | 'still'
    fps?: number
  }>(),
  { mode: 'loop', fps: 8 }
)
const emit = defineEmits<{ end: [] }>()

const urls = computed(() => frameUrls(props.game, props.name))
const frame = ref(0)
let timer = 0
let step = 0

function stop(): void {
  window.clearInterval(timer)
  timer = 0
}

function seq(i: number): number {
  if (props.mode === 'pingpong') {
    const n = (FRAMES - 1) * 2
    const k = i % n
    return k < FRAMES ? k : n - k
  }
  return i % FRAMES
}

function start(): void {
  stop()
  frame.value = 0
  step = 0
  if (props.mode === 'still') return
  if (prefersReducedMotion()) {
    if (props.mode === 'once') window.setTimeout(() => emit('end'), 0)
    return
  }
  timer = window.setInterval(
    () => {
      if (document.hidden) return
      step++
      if (props.mode === 'once' && step >= FRAMES) {
        frame.value = FRAMES - 1
        stop()
        emit('end')
        return
      }
      frame.value = seq(step)
    },
    Math.round(1000 / props.fps)
  )
}

onMounted(() => {
  preload(urls.value)
  start()
})
watch(() => [props.name, props.mode, props.fps], start)
onBeforeUnmount(stop)
</script>

<template>
  <img
    class="sprite"
    :src="urls[frame]"
    :class="{ fill }"
    :width="fill ? undefined : width"
    alt=""
    aria-hidden="true"
    draggable="false"
  />
</template>

<style scoped>
.sprite.fill {
  width: 100%;
}
.sprite {
  display: block;
  height: auto;
  pointer-events: none;
  user-select: none;
}
</style>
