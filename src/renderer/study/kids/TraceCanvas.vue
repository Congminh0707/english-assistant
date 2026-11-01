<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { paintLine, TRACE_GRID, TRACE_MAX_TRIES, traceScore } from '@shared/trace'
import { useTts } from '@renderer/shared/composables/useTts'
import { PRAISE, pick, TRY_AGAIN } from './kidsText'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Tập viết chữ: chữ mẫu mờ, bé tô bằng chuột/ngón tay; bấm ✓ để chấm (độ phủ chữ mẫu và không tô lem), tối đa 2 lần thử.
const props = defineProps<{ letter: string; say: string }>()
const emit = defineEmits<{ done: [passed: boolean] }>()

const { speak } = useTts()

const SIZE = 320
const canvas = ref<HTMLCanvasElement>()
const tries = ref(0)
const message = ref('')
const finished = ref(false)

/** Màu canvas lấy từ token để theo giao diện sáng/tối */
const tok = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'

let ctx: CanvasRenderingContext2D | null = null
let mask: Uint8Array = new Uint8Array(TRACE_GRID * TRACE_GRID)
let drawn: Uint8Array = new Uint8Array(TRACE_GRID * TRACE_GRID)
let drawing = false
let last: { x: number; y: number } | null = null

const FONT = `800 ${Math.round(SIZE * 0.78)}px 'Segoe UI', Arial, sans-serif`

function drawGuide(): void {
  if (!ctx) return
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = tok('--c-xp-soft')
  ctx.strokeStyle = tok('--c-xp')
  ctx.lineWidth = 3
  ctx.setLineDash([10, 8])
  ctx.font = FONT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(props.letter, SIZE / 2, SIZE / 2 + SIZE * 0.04)
  ctx.strokeText(props.letter, SIZE / 2, SIZE / 2 + SIZE * 0.04)
  ctx.setLineDash([])
}

/** Dựng mặt nạ chữ ở lưới thấp: vẽ chữ lên canvas phụ rồi lấy mẫu độ trong suốt */
function buildMask(): Uint8Array {
  const off = document.createElement('canvas')
  off.width = TRACE_GRID
  off.height = TRACE_GRID
  const c = off.getContext('2d', { willReadFrequently: true })
  const out = new Uint8Array(TRACE_GRID * TRACE_GRID)
  if (!c) return out
  const k = TRACE_GRID / SIZE
  c.font = `800 ${Math.round(SIZE * 0.78 * k)}px 'Segoe UI', Arial, sans-serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillStyle = '#000'
  c.fillText(props.letter, TRACE_GRID / 2, TRACE_GRID / 2 + TRACE_GRID * 0.04)
  const data = c.getImageData(0, 0, TRACE_GRID, TRACE_GRID).data
  for (let i = 0; i < out.length; i++) out[i] = data[i * 4 + 3] > 80 ? 1 : 0
  return out
}

function reset(): void {
  drawn = new Uint8Array(TRACE_GRID * TRACE_GRID)
  drawGuide()
}

function point(e: PointerEvent): { x: number; y: number } {
  const rect = canvas.value!.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * SIZE,
    y: ((e.clientY - rect.top) / rect.height) * SIZE
  }
}

function down(e: PointerEvent): void {
  if (finished.value) return
  canvas.value?.setPointerCapture(e.pointerId)
  drawing = true
  last = point(e)
  stroke(last, last)
}

function move(e: PointerEvent): void {
  if (!drawing || !last) return
  const p = point(e)
  stroke(last, p)
  last = p
}

function up(): void {
  drawing = false
  last = null
}

function stroke(a: { x: number; y: number }, b: { x: number; y: number }): void {
  if (!ctx) return
  ctx.strokeStyle = tok('--c-primary')
  ctx.lineWidth = 22
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  const k = TRACE_GRID / SIZE
  paintLine(drawn, TRACE_GRID, a.x * k, a.y * k, b.x * k, b.y * k, 11 * k)
}

function check(): void {
  if (finished.value) return
  tries.value++
  const result = traceScore(mask, drawn)
  if (result.passed) {
    finished.value = true
    message.value = pick(PRAISE)
    speak(`${message.value} ${props.say}`, 'us', 0.9)
    window.setTimeout(() => emit('done', true), 1300)
  } else if (tries.value >= TRACE_MAX_TRIES) {
    finished.value = true
    message.value = 'Good try!'
    speak(`Good try! This is ${props.say}`, 'us', 0.9)
    window.setTimeout(() => emit('done', false), 1500)
  } else {
    message.value = pick(TRY_AGAIN)
    speak(message.value, 'us', 0.9)
    reset()
  }
}

onMounted(() => {
  ctx = canvas.value!.getContext('2d')
  mask = buildMask()
  drawGuide()
})
</script>

<template>
  <div class="trace-box">
    <canvas
      ref="canvas"
      class="pad"
      :width="SIZE"
      :height="SIZE"
      @pointerdown.prevent="down"
      @pointermove.prevent="move"
      @pointerup="up"
      @pointercancel="up"
      @pointerleave="up"
    />
    <p class="k-bubble msg" :class="{ hide: !message }">{{ message }}</p>
    <div class="tools">
      <button type="button" class="k-round" :disabled="finished" @click="reset">
        <UiIcon name="reset" :size="28" />
      </button>
      <button type="button" class="k-round" :disabled="finished" @click="speak(say, 'us', 0.8)">
        <UiIcon name="volume" :size="32" />
      </button>
      <button type="button" class="k-primary" :disabled="finished" @click="check">
        <UiIcon name="check" :size="40" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.trace-box {
  display: grid;
  grid-template-columns: auto auto;
  gap: var(--sp-4) var(--sp-6);
  align-items: center;
  justify-content: center;
}
.tools {
  grid-column: 2;
  grid-row: 1;
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
}
.msg {
  grid-column: 1 / -1;
  grid-row: 2;
  justify-self: center;
}
.pad {
  width: min(320px, 60vw);
  aspect-ratio: 1;
  touch-action: none;
  cursor: crosshair;
  background: var(--c-surface);
  border: 4px solid var(--c-ink);
  border-radius: var(--r-lg);
  box-shadow: 0 8px 0 var(--c-ink);
}
.msg {
  min-height: 1.6em;
  margin: 0;
  color: var(--c-primary);
}
.msg.hide {
  visibility: hidden;
}
</style>
