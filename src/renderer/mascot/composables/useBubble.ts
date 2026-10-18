import { ref, type Ref } from 'vue'

export type BubbleKind = 'say' | 'stats'

export interface Bubble {
  id: number
  kind: BubbleKind
  text?: string
  /** Độ ưu tiên: bong bóng mới chỉ thay được bong bóng đang hiện nếu ưu tiên ≥ */
  priority: number
}

export const BubblePriority = {
  stats: 0,
  ambient: 1, // câu chào, nhắc đói
  reaction: 2, // phản hồi trực tiếp khi người dùng tương tác
  important: 3 // lên cấp...
} as const

const MAX_QUEUE = 3
/** Thời gian hiển thị: ~60ms mỗi ký tự, trong khoảng 3–7 giây */
const durationFor = (text: string): number => Math.min(7000, Math.max(3000, text.length * 60))

/**
 * Hàng đợi bong bóng thoại: tối đa 1 bong bóng tại một thời điểm (docs/05-mascot-system.md#5).
 * Bong bóng ưu tiên thấp hơn phải xếp hàng chờ; thẻ chỉ số (stats) bị thay bởi mọi câu thoại.
 */
export function useBubble(): {
  current: Ref<Bubble | null>
  say: (text: string, priority?: number) => void
  showStats: () => void
  hideStats: () => void
  dismiss: () => void
  clear: () => void
} {
  const current = ref<Bubble | null>(null)
  const queue: Bubble[] = []
  let timer: number | undefined
  let nextId = 1

  const show = (bubble: Bubble): void => {
    window.clearTimeout(timer)
    current.value = bubble
    if (bubble.kind === 'say' && bubble.text) {
      timer = window.setTimeout(dismiss, durationFor(bubble.text))
    }
  }

  function dismiss(): void {
    window.clearTimeout(timer)
    current.value = null
    const next = queue.shift()
    if (next) show(next)
  }

  function say(text: string, priority: number = BubblePriority.reaction): void {
    const bubble: Bubble = { id: nextId++, kind: 'say', text, priority }
    const now = current.value
    if (!now || now.kind === 'stats' || priority >= now.priority) {
      show(bubble)
    } else if (queue.length < MAX_QUEUE) {
      queue.push(bubble)
    }
  }

  function showStats(): void {
    if (!current.value) show({ id: nextId++, kind: 'stats', priority: BubblePriority.stats })
  }

  function hideStats(): void {
    if (current.value?.kind === 'stats') dismiss()
  }

  function clear(): void {
    queue.length = 0
    window.clearTimeout(timer)
    current.value = null
  }

  return { current, say, showStats, hideStats, dismiss, clear }
}
