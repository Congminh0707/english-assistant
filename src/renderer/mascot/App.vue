<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MascotReaction } from '@shared/schemas/pet'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import { SpriteAnimator, type SpriteSheetMeta } from './engine/SpriteAnimator'
import { MascotBrain } from './engine/MascotBrain'
import { BubblePriority, useBubble } from './composables/useBubble'
import { useLines } from './composables/useLines'
import SpeechBubble from './components/SpeechBubble.vue'
import sheetUrl from './assets/characters/placeholder/baby/sheet.png'
import sheetMeta from './assets/characters/placeholder/baby/sheet.json'

/** Di chuột dưới ngưỡng này (px) giữa lúc nhấn và thả thì tính là click, không phải kéo */
const CLICK_THRESHOLD = 4
/** Pixel art chỉ cần 3–12 fps: tick 20 lần/giây thay vì requestAnimationFrame 60Hz để tiết kiệm CPU */
const TICK_MS = 50
/** Giữ chuột trên nhân vật bao lâu thì hiện thẻ chỉ số */
const HOVER_STATS_MS = 900
const HUNGRY_THRESHOLD = 30

const { locale } = useI18n()
const petStore = usePetStore()
const settingsStore = useSettingsStore()
const bubble = useBubble()
const { line, greetingTopic } = useLines()

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
let hoverTimer = 0
let lastTime = 0
const cleanups: Array<() => void> = []

function setClickThrough(enabled: boolean): void {
  if (enabled === clickThrough) return
  clickThrough = enabled
  window.api.send('mascot:set-click-through', enabled)
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

/** Con trỏ có nằm trên bong bóng thoại không (bấm vào để đóng) */
function isOverBubble(point: { x: number; y: number }): boolean {
  return !!document.elementFromPoint(point.x, point.y)?.closest('.bubble')
}

function updateHitTest(): void {
  if (dragging.value) return
  const over = lastPointer !== null && isOverSprite(lastPointer)
  if (over !== overSprite.value) {
    overSprite.value = over
    onHoverChange(over)
  }
  const interactive = over || (lastPointer !== null && isOverBubble(lastPointer))
  setClickThrough(!interactive)
}

function onHoverChange(over: boolean): void {
  window.clearTimeout(hoverTimer)
  if (over) hoverTimer = window.setTimeout(() => bubble.showStats(), HOVER_STATS_MS)
  else bubble.hideStats()
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
  window.clearTimeout(hoverTimer)
  bubble.hideStats()
  window.api.send('mascot:drag-start')
  brain?.pointerDown()
}

async function onMouseUp(e: MouseEvent): Promise<void> {
  if (!dragging.value) return
  dragging.value = false
  const isClick = Math.hypot(e.screenX - downAt.x, e.screenY - downAt.y) < CLICK_THRESHOLD
  const { falling } = await invoke('mascot:drag-end')
  brain?.pointerUp(isClick, falling)
  if (isClick) void onPat()
  updateHitTest()
}

function onContextMenu(e: MouseEvent): void {
  e.preventDefault()
  if (!overSprite.value) return
  bubble.hideStats()
  window.api.send('mascot:context-menu')
}

/** Click vào nhân vật = vuốt ve */
async function onPat(): Promise<void> {
  try {
    const { before, after } = await petStore.pat()
    const gained = !before || after.mood > before.mood || after.mood >= 100
    bubble.say(line(gained ? 'pat' : 'patTired'))
  } catch (err) {
    console.warn('[mascot] pat failed', err)
  }
}

function onReaction({ kind }: MascotReaction): void {
  if (kind === 'eat') {
    brain?.react('eat')
    bubble.say(line('fed'))
  } else if (kind === 'hungry') {
    bubble.say(line('hungry'), BubblePriority.ambient)
  } else if (kind === 'level-up') {
    brain?.react('happy')
    bubble.say(line('levelUp'), BubblePriority.important)
  }
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

/** Mascot bị ẩn (tray, hẹn giờ, chế độ yên lặng) → dừng hẳn vòng lặp để không tốn CPU */
function onVisibilityChange(): void {
  if (document.hidden) {
    stopTicking()
    dragging.value = false
    lastPointer = null
    overSprite.value = false
    window.clearTimeout(hoverTimer)
    bubble.clear()
    setClickThrough(true)
    brain?.reset()
  } else {
    startTicking()
  }
}

// Đổi kích thước mascot từ menu chuột phải
watch(
  () => settingsStore.settings['mascot.scale'],
  (scale) => {
    animator?.setScale(scale)
    brain?.setStepPx(scale)
  }
)
// Đổi ngôn ngữ từ menu chuột phải
watch(
  () => settingsStore.settings['ui.language'],
  (lang) => {
    locale.value = lang
  }
)

onMounted(async () => {
  const [settings] = await Promise.all([settingsStore.load(), petStore.load()])
  locale.value = settings['ui.language']

  const image = new Image()
  image.src = sheetUrl
  await image.decode()

  const meta = sheetMeta as SpriteSheetMeta
  const scale = settings['mascot.scale']
  ctx = canvas.value!.getContext('2d', { willReadFrequently: true })!
  animator = new SpriteAnimator(image, meta, ctx, scale)
  brain = new MascotBrain(animator, (dx) => invoke('mascot:walk', dx), onWindowMoved, scale)

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  document.addEventListener('mouseleave', onMouseLeave)
  document.addEventListener('visibilitychange', onVisibilityChange)
  cleanups.push(
    window.api.on('mascot:landed', () => brain?.landed()),
    window.api.on('mascot:react', onReaction),
    petStore.listen(),
    settingsStore.listen()
  )

  if (!document.hidden) startTicking()

  // Lời chào khi khởi động, kèm nhắc đói nếu cần
  window.setTimeout(() => {
    bubble.say(line(greetingTopic()), BubblePriority.ambient)
    if ((petStore.pet?.hunger ?? 100) < HUNGRY_THRESHOLD) {
      bubble.say(line('hungry'), BubblePriority.ambient)
    }
  }, 1200)
})

onUnmounted(() => {
  stopTicking()
  window.clearTimeout(hoverTimer)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('mouseleave', onMouseLeave)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  cleanups.forEach((fn) => fn())
})
</script>

<template>
  <div class="stage">
    <SpeechBubble
      v-if="bubble.current.value"
      :bubble="bubble.current.value"
      :pet="petStore.pet"
      @dismiss="bubble.dismiss()"
    />
    <canvas
      ref="canvas"
      class="sprite"
      :class="{ grab: overSprite && !dragging, grabbing: dragging }"
      @mousedown="onMouseDown"
      @contextmenu="onContextMenu"
      @dragstart.prevent
    />
  </div>
</template>

<style scoped>
.stage {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
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
