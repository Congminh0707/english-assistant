import type { Quiz } from '@shared/schemas/quiz'
import type { Container } from '../container'
import type { Scheduler } from './Scheduler'

const MINUTE_MS = 60_000

/**
 * MicroLessonJob (docs/03-architecture.md#6): mỗi N phút (cài đặt mascot.quizMinutes) mascot hỏi ôn thẻ
 * đến hạn hoặc giới thiệu từ mới — chỉ khi mascot đang hiện (không yên lặng/ẩn) và popup không mở.
 * Trả về `trigger()` để hỏi ngay (menu chuột phải); hỏi tay cũng tính lại mốc thời gian.
 */
export function scheduleQuizJob(
  scheduler: Scheduler,
  c: Container,
  opts: { canShow: () => boolean; show: (quiz: Quiz) => void }
): { trigger: () => boolean } {
  let lastAt = c.clock.now()

  const trigger = (): boolean => {
    lastAt = c.clock.now()
    const quiz = c.micro.next()
    if (quiz) opts.show(quiz)
    return !!quiz
  }

  scheduler.every('micro-quiz', MINUTE_MS, () => {
    const minutes = c.settings.get('mascot.quizMinutes')
    if (!minutes || c.clock.now() - lastAt < minutes * MINUTE_MS || !opts.canShow()) return
    trigger()
  })

  return { trigger }
}
