import { describe, expect, it } from 'vitest'
import type { LessonExercise } from '@shared/schemas/lesson'
import {
  canCheck,
  choiceTexts,
  EXERCISE_TYPES,
  hasChoices,
  initState,
  isCorrect,
  newState,
  solutionOf,
  speaksSolution,
  TF_ORDER
} from './lessonExercises'

const tf = (key: (typeof TF_ORDER)[number]): string => `L:${key}`
const identity = <T>(items: T[]): T[] => [...items]
const reverse = <T>(items: T[]): T[] => [...items].reverse()

const MCQ: LessonExercise = { type: 'mcq', prompt: 'Q', choices: ['a', 'b', 'c'], answer: 1 }
const GAP_TYPED: LessonExercise = { type: 'gap', prompt: 'I ___ tea.', answers: ['like', 'love'] }
const GAP_CHOICE: LessonExercise = {
  type: 'gap',
  prompt: 'I ___ tea.',
  answers: ['like'],
  choices: ['like', 'likes']
}
const ORDER: LessonExercise = { type: 'order', hint: 'h', answer: 'I like tea' }
const MATCH: LessonExercise = {
  type: 'match',
  pairs: [
    { left: 'a', right: '1' },
    { left: 'b', right: '2' },
    { left: 'c', right: '3' }
  ]
}
const TF2: LessonExercise = { type: 'tf', statement: 's', answer: 'false' }
const TF3: LessonExercise = { type: 'tf', statement: 's', answer: 'ng', ng: true }
const PICTURE: LessonExercise = {
  type: 'picture',
  word: 'dog',
  choices: ['dog', 'cat'],
  answer: 0
}
const LISTEN: LessonExercise = { type: 'listen', say: 'hi', choices: ['x', 'y'], answer: 1 }

describe('registry dạng bài của bài học', () => {
  it('đăng ký đủ mọi dạng bài trong schema', () => {
    expect([...EXERCISE_TYPES].sort()).toEqual(
      ['gap', 'listen', 'match', 'mcq', 'order', 'picture', 'tf'].sort()
    )
  })

  it('trắc nghiệm / nghe / chọn hình: cần chọn mới chấm được, đúng khi trùng đáp án', () => {
    for (const ex of [MCQ, LISTEN, PICTURE]) {
      const st = newState()
      expect(canCheck(ex, st)).toBe(false)
      st.chosen = ex.type === 'mcq' ? 1 : ex.type === 'listen' ? 1 : 0
      expect(canCheck(ex, st)).toBe(true)
      expect(isCorrect(ex, st)).toBe(true)
      st.chosen = 99
      expect(isCorrect(ex, st)).toBe(false)
    }
    expect(solutionOf(MCQ, tf)).toBe('b')
    expect(solutionOf(PICTURE, tf)).toBe('dog = dog')
    expect(hasChoices(MCQ)).toBe(true)
  })

  it('đúng/sai: hai hoặc ba lựa chọn theo ng, chấm theo thứ tự Đúng/Sai/Không có thông tin', () => {
    expect(choiceTexts(TF2, tf)).toEqual(['L:true', 'L:false'])
    expect(choiceTexts(TF3, tf)).toEqual(['L:true', 'L:false', 'L:ng'])
    const st = newState()
    st.chosen = 1
    expect(isCorrect(TF2, st)).toBe(true)
    st.chosen = 0
    expect(isCorrect(TF2, st)).toBe(false)
    st.chosen = 2
    expect(isCorrect(TF3, st)).toBe(true)
    expect(solutionOf(TF3, tf)).toBe('L:ng')
  })

  it('điền chỗ trống: gõ (bỏ qua hoa/thường, dấu câu cuối) hoặc chọn', () => {
    expect(hasChoices(GAP_TYPED)).toBe(false)
    expect(hasChoices(GAP_CHOICE)).toBe(true)
    const st = newState()
    expect(canCheck(GAP_TYPED, st)).toBe(false)
    st.typed = '  LOVE. '
    expect(canCheck(GAP_TYPED, st)).toBe(true)
    expect(isCorrect(GAP_TYPED, st)).toBe(true)
    st.typed = 'hate'
    expect(isCorrect(GAP_TYPED, st)).toBe(false)
    expect(solutionOf(GAP_TYPED, tf)).toBe('I like tea.')

    const pick = newState()
    expect(canCheck(GAP_CHOICE, pick)).toBe(false)
    pick.chosen = 0
    expect(isCorrect(GAP_CHOICE, pick)).toBe(true)
    pick.chosen = 1
    expect(isCorrect(GAP_CHOICE, pick)).toBe(false)
  })

  it('sắp xếp câu: xáo trộn (không để nguyên thứ tự đúng nếu có thể), chấm theo câu ghép', () => {
    const st = initState(ORDER, reverse)
    expect(st.tokens).toEqual(['tea', 'like', 'I'])
    expect(canCheck(ORDER, st)).toBe(false)
    st.picked = [2, 1, 0] // I like tea
    expect(canCheck(ORDER, st)).toBe(true)
    expect(isCorrect(ORDER, st)).toBe(true)
    st.picked = [0, 1, 2]
    expect(isCorrect(ORDER, st)).toBe(false)
    expect(solutionOf(ORDER, tf)).toBe('I like tea')

    // Xáo trộn luôn ra thứ tự đúng → thử lại tối đa vài lần rồi chấp nhận
    expect(initState(ORDER, identity).tokens).toEqual(['I', 'like', 'tea'])
  })

  it('ghép cặp: đủ mọi cặp mới chấm, đúng khi mọi mục trỏ đúng vị trí đã xáo', () => {
    const st = initState(MATCH, reverse)
    expect(st.rightOrder).toEqual([2, 1, 0])
    expect(canCheck(MATCH, st)).toBe(false)
    st.pairMap = [2, 1, 0] // trái 0 ↔ vị trí 2 (cặp 0), ...
    expect(canCheck(MATCH, st)).toBe(true)
    expect(isCorrect(MATCH, st)).toBe(true)
    st.pairMap = [0, 1, 2]
    expect(isCorrect(MATCH, st)).toBe(false)
    expect(solutionOf(MATCH, tf)).toBe('a = 1 · b = 2 · c = 3')
  })

  it('chỉ gap và order được đọc to lời giải sau khi chấm', () => {
    expect(speaksSolution(GAP_TYPED)).toBe(true)
    expect(speaksSolution(ORDER)).toBe(true)
    expect(speaksSolution(MCQ)).toBe(false)
    expect(speaksSolution(MATCH)).toBe(false)
  })
})
