import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Quiz } from '@shared/schemas/quiz'
import { BubblePriority, useBubble } from './useBubble'

// Vitest chạy trong Node: useBubble gọi window.setTimeout → trỏ window về globalThis (đã giả lập hẹn giờ)
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('window', globalThis)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const QUIZ = {} as Quiz

describe('useBubble', () => {
  it('câu thoại thường tự đóng; bong bóng có action giữ tới 60 giây', () => {
    const b = useBubble()
    b.say('Hi!')
    vi.advanceTimersByTime(7_000)
    expect(b.current.value).toBeNull()
    b.say('Hôm nay bạn làm gì?', BubblePriority.quiz, 'diary')
    vi.advanceTimersByTime(10_000)
    expect(b.current.value?.action).toBe('diary')
    vi.advanceTimersByTime(50_000)
    expect(b.current.value).toBeNull()
  })

  it('đang hỏi quiz → bong bóng nhắc nhật ký xếp hàng, hiện sau khi quiz đóng', () => {
    const b = useBubble()
    b.showQuiz(QUIZ)
    b.say('Hôm nay bạn làm gì?', BubblePriority.quiz, 'diary')
    expect(b.current.value?.kind).toBe('quiz')
    b.dismiss()
    expect(b.current.value?.action).toBe('diary')
  })

  it('hàng đợi đầy → bong bóng có action đẩy câu thường cũ nhất ra, không bị bỏ', () => {
    const b = useBubble()
    b.showQuiz(QUIZ)
    b.say('a', BubblePriority.ambient)
    b.say('b', BubblePriority.ambient)
    b.say('c', BubblePriority.ambient)
    b.say('Hôm nay bạn làm gì?', BubblePriority.quiz, 'diary')
    const seen: (string | undefined)[] = []
    for (let i = 0; i < 4; i++) {
      b.dismiss()
      seen.push(b.current.value?.text)
    }
    expect(seen).toEqual(['b', 'c', 'Hôm nay bạn làm gì?', undefined])
  })
})
