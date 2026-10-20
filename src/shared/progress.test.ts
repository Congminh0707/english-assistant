import { describe, expect, it } from 'vitest'
import {
  eloExpected,
  eloUpdate,
  lessonExerciseSkill,
  levelsAhead,
  practiceKindSkill,
  ratingToLevel
} from './progress'

describe('progress', () => {
  it('gán kỹ năng cho dạng bài', () => {
    expect(lessonExerciseSkill('lesson', 'listen')).toBe('listening')
    expect(lessonExerciseSkill('lesson', 'gap')).toBe('grammar')
    expect(lessonExerciseSkill('lesson', 'match')).toBe('vocab')
    expect(lessonExerciseSkill('reading', 'tf')).toBe('reading')
    expect(lessonExerciseSkill('reading', 'listen')).toBe('listening')
    expect(lessonExerciseSkill('grammar', 'mcq')).toBe('grammar')
    expect(lessonExerciseSkill('listening', 'mcq')).toBe('listening')
    expect(practiceKindSkill('dictation')).toBe('listening')
    expect(practiceKindSkill('word_order')).toBe('grammar')
    expect(practiceKindSkill('cloze')).toBe('vocab')
  })

  it('Elo: kỳ vọng 50% khi cùng rating; đúng nhiều hơn kỳ vọng thì tăng, sai thì giảm', () => {
    expect(eloExpected(500, 500)).toBeCloseTo(0.5)
    expect(eloExpected(700, 500)).toBeGreaterThan(0.7)
    expect(eloUpdate(500, 500, 10, 10, 0)).toBeGreaterThan(520)
    expect(eloUpdate(500, 500, 0, 10, 0)).toBeLessThan(480)
    expect(eloUpdate(500, 500, 5, 10, 0)).toBeCloseTo(500)
    // K giảm dần khi đã có nhiều dữ liệu
    expect(eloUpdate(500, 500, 10, 10, 100) - 500).toBeLessThan(
      eloUpdate(500, 500, 10, 10, 0) - 500
    )
    // Làm bài dễ hơn rating mà đúng hết thì tăng ít
    expect(eloUpdate(800, 300, 10, 10, 0) - 800).toBeLessThan(eloUpdate(500, 500, 10, 10, 0) - 500)
  })

  it('Elo: giữ trong thang và bỏ qua loạt rỗng', () => {
    expect(eloUpdate(1190, 1100, 10, 10, 0)).toBeLessThan(1200)
    expect(eloUpdate(5, 50, 0, 10, 0)).toBeGreaterThanOrEqual(0)
    expect(eloUpdate(500, 500, 0, 0, 0)).toBe(500)
  })

  it('đổi rating sang level và số bậc vượt trội', () => {
    expect(ratingToLevel(0)).toBe('PA1_1')
    expect(ratingToLevel(450)).toBe('A2_1')
    expect(ratingToLevel(5000)).toBe('C2')
    expect(levelsAhead(650, 'A2_1')).toBe(2)
    expect(levelsAhead(450, 'A2_1')).toBe(0)
    expect(levelsAhead(120, 'A2_1')).toBeLessThan(0)
  })
})
