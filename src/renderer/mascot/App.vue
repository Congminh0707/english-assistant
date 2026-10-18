<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { IpcEvent } from '@shared/ipc'
import { SpriteAnimator, type SpriteSheetMeta } from './engine/SpriteAnimator'
import { MascotBrain } from './engine/MascotBrain'
import sheetUrl from './assets/characters/placeholder/baby/sheet.png'
import sheetMeta from './assets/characters/placeholder/baby/sheet.json'

const SCALE = 2 // khung 48px × 2 = 96px trên màn hình
/** Di chuột dưới ngưỡng này (px) giữa lúc nhấn và thả thì tính là click, không phải kéo */
const CLICK_THRESHOLD = 4
/** Pixel art chỉ cần 3–12 fps: tick 20 lần/giây thay vì requestAnimationFrame 60Hz để tiết kiệm CPU */
const TICK_MS = 50

const canvas = ref<HTMLCanvasElement>()
const dragging = ref(false)
const overSprite = ref(false)

let ctx: CanvasRenderingContext2D | null = null
let brain: MascotBrain | null = null
let animator: SpriteAnimator | null = null
let clickThrough = true
let lastPointer: { x: number; y: number } | null = null
let downAt = { x: 0, y: 0 }
let tickTimer = 0
let lastTime = 0
const cleanups: Array<() => void> = []

function setClickThrough(enabled: boolean): void {
  if (enabled === clickThrough) return
  clickThrough = enabled
  window.api.mascot.setClickThrough(enabled)
}

/** Con trỏ có nằm trên pixel không trong suốt của nhân vật không */
function isOverSprite(point: { x: number; y: number }): boolean {
  const c = canvas.value
  if (!c || !ctx) return false
  const r = c.getBoundingClientRect()
  const x = Math.floor(point.x - r.left)
  const y = Math.floor(point.y - r.top)
  if (x < 0 || y < 0 || x >= c.width || y >= c.height) return false
  return ctx.getImageData(x, y, 1, 1).data[3] > 10
}

function updateHitTest(): void {
  if (dragging.value) return
  overSprite.value = lastPointer !== null && isOverSprite(lastPointer)
  setClickThrough(!overSprite.value)
}

function onMouseMove(e: MouseEvent): void {
  lastPointer = { x: e.clientX, y: e.clientY }
  updateHitTest()
}

function onMouseLeave(): void {
  lastPointer = null
  updateHitTest()
}

function onMouseDown(e: MouseEvent): void {
  if (e.button !== 0 || !overSprite.value) return
  dragging.value = true
  downAt = { x: e.screenX, y: e.screenY }
  window.api.mascot.dragStart()
  brain?.pointerDown()
}

async function onMouseUp(e: MouseEvent): Promise<void> {
  if (!dragging.value) return
  dragging.value = false
  const isClick = Math.hypot(e.screenX - downAt.x, e.screenY - downAt.y) < CLICK_THRESHOLD
  const { falling } = await window.api.mascot.dragEnd()
  brain?.pointerUp(isClick, falling)
  updateHitTest()
}

/** Cửa sổ vừa đi ngang dx → con trỏ (đứng yên trên màn hình) lệch -dx so với cửa sổ */
function onWindowMoved(dx: number): void {
  if (!lastPointer) return
  lastPointer = { x: lastPointer.x - dx, y: lastPointer.y }
  updateHitTest()
}

function tick(): void {
  const time = performance.now()
  const dt = Math.min((time - lastTime) / 1000, 0.1)
  lastTime = time
  if (brain && animator) {
    brain.tick(dt)
    animator.update(dt, brain.facing < 0)
  }
}

function startTicking(): void {
  if (tickTimer) return
  lastTime = performance.now()
  tickTimer = window.setInterval(tick, TICK_MS)
}

function stopTicking(): void {
  clearInterval(tickTimer)
  tickTimer = 0
}

/** Mascot bị ẩn (tray hoặc chế độ yên lặng) → dừng hẳn vòng lặp để không tốn CPU */
function onVisibilityChange(): void {
  if (document.hidden) {
    stopTicking()
    dragging.value = false
    lastPointer = null
    overSprite.value = false
    setClickThrough(true)
    brain?.reset()
  } else {
    startTicking()
  }
}

onMounted(async () => {
  const image = new Image()
  image.src = sheetUrl
  await image.decode()

  const meta = sheetMeta as SpriteSheetMeta
  const c = canvas.value!
  c.width = meta.frameSize.w * SCALE
  c.height = meta.frameSize.h * SCALE
  ctx = c.getContext('2d', { willReadFrequently: true })!

  animator = new SpriteAnimator(image, meta, ctx, SCALE)
  brain = new MascotBrain(animator, window.api.mascot, onWindowMoved, SCALE)

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  document.addEventListener('mouseleave', onMouseLeave)
  document.addEventListener('visibilitychange', onVisibilityChange)
  cleanups.push(window.api.on(IpcEvent.mascotLanded, () => brain?.landed()))

  if (!document.hidden) startTicking()
})

onUnmounted(() => {
  stopTicking()
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('mouseleave', onMouseLeave)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  cleanups.forEach((fn) => fn())
})
</script>

<template>
  <div class="stage">
    <canvas
      ref="canvas"
      class="sprite"
      :class="{ grab: overSprite && !dragging, grabbing: dragging }"
      @mousedown="onMouseDown"
      @dragstart.prevent
    />
  </div>
</template>

<style scoped>
.stage {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sprite {
  image-rendering: pixelated;
}
.grab {
  cursor: grab;
}
.grabbing {
  cursor: grabbing;
}
</style>
