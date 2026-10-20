<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { paintLine, TRACE_GRID, TRACE_MAX_TRIES, traceScore } from '@shared/trace'
import { useTts } from '@renderer/shared/composables/useTts'
import { PRAISE, pick, TRY_AGAIN } from './kidsText'

// Tập viết chữ: chữ mẫu mờ, bé tô bằng chuột/ngón tay; bấm ✓ để chấm (độ phủ chữ mẫu và không tô lem), tối đa 2 lần thử.
const props = defineProps<{ letter: string; say: string }>()
const emit = defineEmits<{ done: [passed: boolean] }>()

const { speak } = useTts()

const SIZE = 320
const canvas = ref<HTMLCanvasElement>()
const tries = ref(0)
const message = ref('')
const finished = ref(false)

let ctx: CanvasRenderingContext2D | null = null
let mask: Uint8Array = new Uint8Array(TRACE_GRID * TRACE_GRID)
let drawn: Uint8Array = new Uint8Array(TRACE_GRID * TRACE_GRID)
let drawing = false
let last: { x: number; y: number } | null = null

const FONT = `800 ${Math.round(SIZE * 0.78)}px 'Segoe UI', Arial, sans-serif`

function drawGuide(): void {
  if (!ctx) return
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = '#e4ebf7'
  ctx.strokeStyle = '#9aa9c9'
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
  ctx.strokeStyle = '#e8432e'
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
  <div class="trace">
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
    <p class="msg">{{ message || ' ' }}</p>
    <div class="k-row">
      <button type="button" class="k-round" :disabled="finished" @click="reset">↺</button>
      <button type="button" class="k-round" :disabled="finished" @click="speak(say, 'us', 0.8)">
        🔊
      </button>
      <button type="button" class="k-primary" :disabled="finished" @click="check">✓</button>
    </div>
  </div>
</template>

<style scoped>
.trace {
  display: grid;
  gap: 12px;
  justify-items: center;
}
.pad {
  width: min(320px, 80vw);
  aspect-ratio: 1;
  touch-action: none;
  cursor: crosshair;
  background: #fff;
  border: 4px solid var(--c-border);
  border-radius: 14px;
  box-shadow: 0 6px 0 0 var(--c-border);
}
.msg {
  min-height: 1.6em;
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--c-primary);
}
</style>
