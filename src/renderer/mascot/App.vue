<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MascotReaction, MascotSleep } from '@shared/schemas/pet'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import { SpriteAnimator, type SpriteSheetMeta } from './engine/SpriteAnimator'
import { MascotBrain } from './engine/MascotBrain'
import { BubblePriority, useBubble } from './composables/useBubble'
import { useLines } from './composables/useLines'
import SpeechBubble from './components/SpeechBubble.vue'
import TtsIndicator from '@renderer/shared/components/TtsIndicator.vue'
import { ACCESSORY_DRAW_ORDER } from '@shared/shop'
import { normalizeCharacterId } from '@shared/characters'

/**
 * Sheet theo nhân vật và giai đoạn tiến hoá (characters/<nhân vật>/<egg|baby|teen|adult|legend>/) và sheet phụ kiện (acc-bow.png...) do
 * scripts/sprites/make-characters.mjs sinh ra; phụ kiện cùng bố cục frame với sheet chính của giai đoạn đó.
 */
const sheetUrls = import.meta.glob('./assets/characters/*/*/sheet.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>
const sheetMetas = import.meta.glob('./assets/characters/*/*/sheet.json', {
  eager: true,
  import: 'default'
}) as Record<string, SpriteSheetMeta>
const accessoryUrls = import.meta.glob('./assets/characters/*/*/acc-*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>
const accessoryBackUrls = import.meta.glob('./assets/characters/*/*/accb-*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>
/** Phụ kiện đã nạp, khoá `<nhân vật>/<giai đoạn>:<id>` */
const accessoryImages = new Map<string, HTMLImageElement>()
/** `look` = '<nhân vật>/<giai đoạn>', vd 'draco/teen' */
const stageKey = (look: string, file: string): string => `./assets/characters/${look}/${file}`
const FALLBACK_LOOK = 'bi/baby'

/** Di chuột dưới ngưỡng này (px) giữa lúc nhấn và thả thì tính là click, không phải kéo */
const CLICK_THRESHOLD = 4
/** Pixel art chỉ cần 3–12 fps: tick 20 lần/giây thay vì requestAnimationFrame 60Hz để tiết kiệm CPU */
const TICK_MS = 50
/** Giữ chuột trên nhân vật bao lâu thì hiện thẻ chỉ số */
const HOVER_STATS_MS = 900
const HUNGRY_THRESHOLD = 30

const { locale, t } = useI18n()
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
    if (brain?.sleeping) {
      bubble.say(line('sleepyPat'))
      return
    }
    const { before, after } = await petStore.pat()
    const gained = !before || after.mood > before.mood || after.mood >= 100
    bubble.say(line(gained ? 'pat' : 'patTired'))
  } catch (err) {
    console.warn('[mascot] pat failed', err)
  }
}

function onReaction({ kind, achievementId, count }: MascotReaction): void {
  if (kind === 'eat') {
    brain?.react('eat')
    bubble.say(line('fed'))
  } else if (kind === 'hungry') {
    brain?.react('sad')
    bubble.say(line('hungry'), BubblePriority.ambient)
  } else if (kind === 'mission') {
    brain?.react('happy')
    bubble.say(line('missionDone'), BubblePriority.important)
  } else if (kind === 'achievement' && achievementId) {
    brain?.react('happy')
    const name = t(`study.stats.ach.${achievementId}`)
    bubble.say(
      count && count > 1
        ? t('mascot.achievementMany', { name, n: count - 1 })
        : t('mascot.achievementOne', { name }),
      BubblePriority.important
    )
  } else if (kind === 'level-up') {
    brain?.react('dance')
    bubble.say(line('levelUp'), BubblePriority.important)
  }
}

function onSleep({ sleeping }: MascotSleep): void {
  const wasSleeping = brain?.sleeping ?? false
  brain?.setSleeping(sleeping)
  if (sleeping) bubble.clear()
  else if (wasSleeping) {
    brain?.react('stretch')
    bubble.say(line('wake'), BubblePriority.ambient)
  }
}

function onQuizResult(correct: boolean): void {
  if (correct) brain?.react('happy')
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

/** Ngoại hình hiện tại: nhân vật + giai đoạn tiến hoá (không có sheet thì rơi về baby của nhân vật, rồi Bi) */
const stage = computed(() => {
  const char = normalizeCharacterId(petStore.pet?.characterId ?? '')
  const wanted = `${char}/${petStore.pet?.stage ?? 'baby'}`
  if (stageKey(wanted, 'sheet.png') in sheetUrls) return wanted
  const baby = `${char}/baby`
  return stageKey(baby, 'sheet.png') in sheetUrls ? baby : FALLBACK_LOOK
})
let shownStage = ''

/** Nạp (một lần) ảnh một lớp phụ kiện; undefined nếu nhân vật/giai đoạn này không có lớp đó */
async function accessoryImage(
  urls: Record<string, string>,
  look: string,
  file: string
): Promise<HTMLImageElement | undefined> {
  const key = `${look}:${file}`
  const cached = accessoryImages.get(key)
  if (cached) return cached
  const url = urls[stageKey(look, file)]
  if (!url) return undefined
  const image = new Image()
  image.src = url
  await image.decode()
  accessoryImages.set(key, image)
  return image
}

/** Áp dụng các phụ kiện đang đeo: lớp trước đè lên thân, lớp sau (áo choàng, cánh) nằm sau lưng */
async function applyAccessories(equipped: string[]): Promise<void> {
  const wanted = ACCESSORY_DRAW_ORDER.filter((id) => equipped.includes(id))
  const current = stage.value
  const front: HTMLImageElement[] = []
  const back: HTMLImageElement[] = []
  for (const id of wanted) {
    const name = id.split(':')[1]
    const f = await accessoryImage(accessoryUrls, current, `acc-${name}.png`)
    const b = await accessoryImage(accessoryBackUrls, current, `accb-${name}.png`)
    if (f) front.push(f)
    if (b) back.push(b)
  }
  animator?.setOverlays(front, back)
}

async function loadSheet(name: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.src = sheetUrls[stageKey(name, 'sheet.png')]
  await image.decode()
  return image
}

/** Lên giai đoạn mới (lên cấp qua mốc): đổi sheet và phụ kiện, ăn mừng */
async function evolveTo(next: string): Promise<void> {
  if (!animator || next === shownStage) return
  const previous = shownStage
  shownStage = next
  animator.setSheet(await loadSheet(next))
  await applyAccessories(petStore.pet?.equipped ?? [])
  if (previous) {
    brain?.react('happy')
    // Chỉ chúc mừng tiến hoá khi cùng nhân vật lên giai đoạn mới (đổi nhân vật thì không)
    if (previous.split('/')[0] === next.split('/')[0]) {
      bubble.say(line('evolved'), BubblePriority.important)
    }
  }
}

watch(stage, (next) => void evolveTo(next))

watch(
  () => petStore.pet?.equipped.join(','),
  () => void applyAccessories(petStore.pet?.equipped ?? [])
)

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

  const image = await loadSheet(stage.value)
  shownStage = stage.value

  const meta = sheetMetas[stageKey(stage.value, 'sheet.json')]
  const scale = settings['mascot.scale']
  ctx = canvas.value!.getContext('2d', { willReadFrequently: true })!
  animator = new SpriteAnimator(image, meta, ctx, scale)
  brain = new MascotBrain(animator, (dx) => invoke('mascot:walk', dx), onWindowMoved, scale)
  await applyAccessories(petStore.pet?.equipped ?? [])

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  document.addEventListener('mouseleave', onMouseLeave)
  document.addEventListener('visibilitychange', onVisibilityChange)
  cleanups.push(
    window.api.on('mascot:landed', () => brain?.landed()),
    window.api.on('mascot:react', onReaction),
    window.api.on('mascot:sleep', onSleep),
    window.api.on('mascot:quiz', (quiz) => {
      window.clearTimeout(hoverTimer)
      bubble.showQuiz(quiz)
    }),
    petStore.listen(),
    settingsStore.listen()
  )

  if (!document.hidden) startTicking()
  scheduleIdleChat()

  // Lời chào khi khởi động, kèm nhắc đói nếu cần
  window.setTimeout(() => {
    bubble.say(line(greetingTopic()), BubblePriority.ambient)
    if ((petStore.pet?.hunger ?? 100) < HUNGRY_THRESHOLD) {
      brain?.react('sad')
      bubble.say(line('hungry'), BubblePriority.ambient)
    } else {
      brain?.react('wave')
    }
  }, 1200)
})

/** Thỉnh thoảng nói vài câu bâng quơ (nhắc học, nhắc uống nước...) khi mascot đang rảnh và hiện trên màn hình */
const IDLE_CHAT_MIN_MS = 4 * 60_000
const IDLE_CHAT_MAX_MS = 9 * 60_000
let idleChatTimer = 0
function scheduleIdleChat(): void {
  idleChatTimer = window.setTimeout(
    () => {
      if (!document.hidden && !brain?.sleeping && !bubble.current.value && !dragging.value) {
        bubble.say(line('idle'), BubblePriority.ambient)
      }
      scheduleIdleChat()
    },
    IDLE_CHAT_MIN_MS + Math.random() * (IDLE_CHAT_MAX_MS - IDLE_CHAT_MIN_MS)
  )
}

onUnmounted(() => {
  window.clearTimeout(idleChatTimer)
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
      @quiz-result="onQuizResult"
    />
    <TtsIndicator compact />
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
