import { ref, type Ref } from 'vue'
import type { Quiz } from '@shared/schemas/quiz'

export type BubbleKind = 'say' | 'stats' | 'quiz'

export interface Bubble {
  id: number
  kind: BubbleKind
  text?: string
  quiz?: Quiz
  /**
   * Bấm vào bong bóng thì làm việc này thay vì chỉ đóng:
   * 'diary' mở trang nhật ký, 'plan' mở trang chủ cửa sổ Học tập (lộ trình hôm nay)
   */
  action?: 'diary' | 'plan'
  /** Độ ưu tiên: bong bóng mới chỉ thay được bong bóng đang hiện nếu ưu tiên ≥ */
  priority: number
}

export const BubblePriority = {
  stats: 0,
  ambient: 1, // câu chào, nhắc đói
  reaction: 2, // phản hồi trực tiếp khi người dùng tương tác
  quiz: 2.5, // câu hỏi ôn: không bị câu thoại thường đè lên, không tự đóng
  important: 3 // lên cấp...
} as const

const MAX_QUEUE = 3
/** Thời gian hiển thị: ~60ms mỗi ký tự, trong khoảng 3–7 giây */
const durationFor = (text: string): number => Math.min(7000, Math.max(3000, text.length * 60))
/** Bong bóng có action (bấm để mở, vd nhắc nhật ký): giữ lâu hơn để người dùng kịp thấy và bấm */
const ACTION_MS = 60_000

/**
 * Hàng đợi bong bóng thoại: tối đa 1 bong bóng tại một thời điểm (docs/05-mascot-system.md#5).
 * Bong bóng ưu tiên thấp hơn phải xếp hàng chờ; thẻ chỉ số (stats) bị thay bởi mọi câu thoại.
 * Câu hỏi ôn (quiz) đang mở chỉ bị thay bởi bong bóng ưu tiên cao hơn quiz; ngang hoặc thấp hơn thì xếp hàng.
 * Bong bóng có action (nhắc nhật ký) không bao giờ bị bỏ khỏi hàng đợi và giữ 60 giây thay vì tự đóng sớm.
 */
export function useBubble(): {
  current: Ref<Bubble | null>
  say: (text: string, priority?: number, action?: Bubble['action']) => void
  showStats: () => void
  showQuiz: (quiz: Quiz) => void
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
      timer = window.setTimeout(dismiss, bubble.action ? ACTION_MS : durationFor(bubble.text))
    }
  }

  /** Xếp hàng; đầy thì bỏ bong bóng mới, trừ khi nó có action: khi đó bỏ bong bóng thường cũ nhất */
  const enqueue = (bubble: Bubble): void => {
    if (queue.length < MAX_QUEUE) {
      queue.push(bubble)
      return
    }
    if (!bubble.action) return
    const drop = queue.findIndex((b) => !b.action)
    if (drop >= 0) queue.splice(drop, 1)
    queue.push(bubble)
  }

  function dismiss(): void {
    window.clearTimeout(timer)
    current.value = null
    const next = queue.shift()
    if (next) show(next)
  }

  function say(
    text: string,
    priority: number = BubblePriority.reaction,
    action?: Bubble['action']
  ): void {
    const bubble: Bubble = { id: nextId++, kind: 'say', text, priority, action }
    const now = current.value
    // Quiz đang mở: chỉ ưu tiên cao hơn quiz mới được đè (quiz không tự đóng, đè lên là mất câu hỏi)
    const preempts =
      now?.kind === 'quiz' ? priority > now.priority : priority >= (now?.priority ?? 0)
    if (!now || now.kind === 'stats' || preempts) show(bubble)
    else enqueue(bubble)
  }

  function showQuiz(quiz: Quiz): void {
    const bubble: Bubble = { id: nextId++, kind: 'quiz', quiz, priority: BubblePriority.quiz }
    const now = current.value
    if (!now || now.kind === 'stats' || bubble.priority >= now.priority) show(bubble)
    else enqueue(bubble)
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

  return { current, say, showStats, showQuiz, hideStats, dismiss, clear }
}
