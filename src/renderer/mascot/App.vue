<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MascotReaction, MascotSleep } from '@shared/schemas/pet'
import { invoke } from '@renderer/shared/ipc'
import { usePetStore } from '@renderer/shared/stores/pet'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import { PoseAnimator } from './engine/PoseAnimator'
import { MascotBrain } from './engine/MascotBrain'
import { isOverPet } from './engine/hitRegion'
import { ClickBurst, StrokeDetector } from './engine/gestures'
import { BubblePriority, useBubble } from './composables/useBubble'
import { useLines } from './composables/useLines'
import SpeechBubble from './components/SpeechBubble.vue'
import TtsIndicator from '@renderer/shared/components/TtsIndicator.vue'
import PetSprite from '@renderer/shared/pet/PetSprite.vue'
import { normalizeCharacterId } from '@shared/characters'

/** Di chuột dưới ngưỡng này (px) giữa lúc nhấn và thả thì tính là click, không phải kéo */
const CLICK_THRESHOLD = 4
/** Tick 20 lần/giây (hoạt ảnh lặp do CSS trong hình) thay vì requestAnimationFrame 60Hz để tiết kiệm CPU */
const TICK_MS = 50
/** Giữ chuột trên nhân vật bao lâu thì hiện thẻ chỉ số */
const HOVER_STATS_MS = 900
const HUNGRY_THRESHOLD = 30

const { locale, t } = useI18n()
const petStore = usePetStore()
const settingsStore = useSettingsStore()
const bubble = useBubble()
const { line, greetingTopic } = useLines()

/** Kích thước vùng thú cưng = 48 × scale × hệ số này (chibi to hơn sprite cũ cùng scale) */
const SIZE_FACTOR = 1.5
/** Con trỏ lệch tâm quá bấy nhiêu lần bề ngang nhân vật thì mascot quay mặt theo */
const LOOK_AT_FACTOR = 0.8

const sprite = ref<InstanceType<typeof PetSprite>>()
const dragging = ref(false)
const overSprite = ref(false)
const pose = ref('idle')
const motion = ref('')
const flipped = ref(false)

let brain: MascotBrain | null = null
let animator: PoseAnimator | null = null
let clickThrough = true
let lastPointer: { x: number; y: number } | null = null
let downAt = { x: 0, y: 0 }
let tickTimer = 0
let hoverTimer = 0
let lastTime = 0
const clicks = new ClickBurst()
const stroke = new StrokeDetector()
const cleanups: Array<() => void> = []

function setClickThrough(enabled: boolean): void {
  if (enabled === clickThrough) return
  clickThrough = enabled
  window.api.send('mascot:set-click-through', enabled)
}

function spriteBox(): DOMRect | null {
  return (sprite.value?.$el as HTMLElement | undefined)?.getBoundingClientRect() ?? null
}

/**
 * Con trỏ có nằm trên thú cưng không. Hình vector nằm trong Shadow DOM nên không đọc được alpha từng điểm:
 * dùng các elip phủ bóng dáng của từng con ở từng giai đoạn (đuôi, cánh, sừng của Huyền thoại), xem engine/hitRegion.
 */
function isOverSprite(point: { x: number; y: number }): boolean {
  const r = spriteBox()
  return !!r && isOverPet(point, r, character.value, stage.value, flipped.value)
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
  if (over) {
    hoverTimer = window.setTimeout(() => bubble.showStats(), HOVER_STATS_MS)
    brain?.hover()
  } else {
    bubble.hideStats()
    stroke.reset()
  }
}

function onMouseMove(e: MouseEvent): void {
  lastPointer = { x: e.clientX, y: e.clientY }
  updateHitTest()
  if (!brain) return
  const r = spriteBox()
  if (dragging.value || !r) {
    brain.lookAt(null)
    return
  }
  if (overSprite.value) {
    // Rê qua lại trên nhân vật mà không bấm = vuốt ve
    if (!brain.sleeping && stroke.move(e.clientX, performance.now(), r.width)) {
      brain.react('purr')
      bubble.say(line('stroke'))
    }
    brain.lookAt(null)
    return
  }
  const dx = e.clientX - (r.left + r.width / 2)
  brain.lookAt(Math.abs(dx) > r.width * LOOK_AT_FACTOR ? (dx < 0 ? -1 : 1) : null)
}

function onMouseLeave(): void {
  lastPointer = null
  brain?.lookAt(null)
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
  if (isClick) onClick(clicks.hit(performance.now()))
  updateHitTest()
}

function onContextMenu(e: MouseEvent): void {
  e.preventDefault()
  if (!overSprite.value) return
  bubble.hideStats()
  window.api.send('mascot:context-menu')
}

/** Bấm một lần = vuốt ve; bấm đúp = nhảy cẫng vẫy tay; bấm dồn 4 lần = chóng mặt */
function onClick(count: number): void {
  if (count === 1 || brain?.sleeping) {
    void onPat()
  } else if (count === 2) {
    brain?.react('trick')
    bubble.say(line('trick'))
  } else if (count >= 4) {
    clicks.reset()
    brain?.react('dizzy')
    bubble.say(line('dizzy'))
  }
}

/** Lăn chuột trên nhân vật = đeo tai nghe nhún nhảy */
function onWheel(): void {
  if (!overSprite.value || dragging.value || !brain || brain.sleeping) return
  if (brain.state !== 'groove') brain.react('groove')
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

function onReaction({ kind, achievementId, count, minutes }: MascotReaction): void {
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
    brain?.react('levelup')
    bubble.say(line('levelUp'), BubblePriority.important)
  } else if (kind === 'diary') {
    brain?.react('wave')
    // Ưu tiên ngang câu hỏi ôn: main đã tính "đã nhắc hôm nay" nên bong bóng không được bị bỏ khỏi hàng đợi.
    // Quiz đang mở thì xếp hàng sau quiz; bong bóng có action giữ 60 giây (useBubble)
    bubble.say(t('mascot.diaryPrompt'), BubblePriority.quiz, 'diary')
  } else if (kind === 'plan' && count) {
    brain?.react('wave')
    // Giống nhắc nhật ký: main đã tính "đã nhắc hôm nay" nên bong bóng có action, không bị bỏ khỏi hàng đợi
    bubble.say(t('mascot.planPrompt', { n: count, m: minutes ?? 0 }), BubblePriority.quiz, 'plan')
  }
}

/** Bấm vào bong bóng: đóng; bong bóng nhắc nhật ký/lộ trình thì mở luôn trang tương ứng */
function onBubbleClick(): void {
  const action = bubble.current.value?.action
  if (action === 'diary') window.api.send('mascot:open-diary')
  else if (action === 'plan') window.api.send('mascot:open-study')
  bubble.dismiss()
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
    animator.update(dt)
    flipped.value = brain.facing < 0
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

/** Ngoại hình hiện tại: nhân vật + giai đoạn tiến hoá */
const character = computed(() => normalizeCharacterId(petStore.pet?.characterId ?? ''))
const stage = computed(() => petStore.pet?.stage ?? 'baby')
const size = computed(() => Math.round(48 * settingsStore.settings['mascot.scale'] * SIZE_FACTOR))

/** Lên giai đoạn mới (lên cấp qua mốc): ăn mừng. Đổi nhân vật thì không chúc mừng */
let shown = ''
watch(
  () => `${character.value}/${stage.value}`,
  (next) => {
    const previous = shown
    shown = next
    if (!previous || previous.split('/')[0] !== next.split('/')[0]) return
    brain?.react('levelup')
    bubble.say(line('evolved'), BubblePriority.important)
  }
)

// Đổi kích thước mascot từ menu chuột phải
watch(
  () => settingsStore.settings['mascot.scale'],
  (scale) => brain?.setStepPx(scale)
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

  shown = `${character.value}/${stage.value}`
  const scale = settings['mascot.scale']
  animator = new PoseAnimator((p, m) => {
    pose.value = p
    motion.value = m
  })
  brain = new MascotBrain(animator, (dx) => invoke('mascot:walk', dx), onWindowMoved, scale)

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
      brain?.react('think')
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
  <div class="stage modern">
    <SpeechBubble
      v-if="bubble.current.value"
      :bubble="bubble.current.value"
      :pet="petStore.pet"
      @dismiss="onBubbleClick"
      @quiz-result="onQuizResult"
    />
    <TtsIndicator compact />
    <PetSprite
      ref="sprite"
      class="sprite"
      :class="{ grab: overSprite && !dragging, grabbing: dragging }"
      :character="character"
      :stage="stage"
      :accessories="petStore.pet?.equipped ?? []"
      :size="size"
      :pose="pose"
      :motion="motion"
      :flip="flipped"
      animate
      @mousedown="onMouseDown"
      @contextmenu="onContextMenu"
      @wheel.passive="onWheel"
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
  /* Chỉ bóng dáng nhân vật (các elip trong engine/hitRegion) mới nhận chuột; phần còn lại của khung vẫn xuyên qua nhờ click-through */
  user-select: none;
}
.grab {
  cursor: grab;
}
.grabbing {
  cursor: grabbing;
}
</style>
