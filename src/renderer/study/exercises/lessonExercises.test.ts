import { describe, expect, it } from 'vitest'
import type { LessonExercise } from '@shared/schemas/lesson'
import {
  canCheck,
  choiceTexts,
  correctChoice,
  countsForSkill,
  EXERCISE_TYPES,
  gradedRemotely,
  hasChoices,
  initState,
  isCorrect,
  itemResults,
  keyHints,
  lessonPassage,
  newState,
  SPEAK_PASS,
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
      [
        'gap',
        'listen',
        'match',
        'mcq',
        'order',
        'picture',
        'speak',
        'tf',
        'translate',
        'write',
        'respond',
        'headings',
        'summary'
      ].sort()
    )
  })

  it('bài nói: chỉ chấm được sau khi đã nói, đạt khi độ chính xác ≥ 70', () => {
    const ex: LessonExercise = { type: 'speak', say: 'Nice to meet you.' }
    const st = newState()
    expect(canCheck(ex, st)).toBe(false)
    st.spoken = 65
    expect(canCheck(ex, st)).toBe(true)
    expect(isCorrect(ex, st)).toBe(false)
    st.spoken = SPEAK_PASS
    expect(isCorrect(ex, st)).toBe(true)
    expect(solutionOf(ex, (k) => k)).toBe('Nice to meet you.')
  })

  it('dịch câu: chấm được khi đã gõ; đúng/sai theo kết luận main trả về; lời giải là đáp án đầu', () => {
    const ex: LessonExercise = {
      type: 'translate',
      vi: 'Tôi là học sinh.',
      answers: ['I am a student.']
    }
    const st = newState()
    expect(canCheck(ex, st)).toBe(false)
    st.typed = '  '
    expect(canCheck(ex, st)).toBe(false)
    st.typed = 'I am a pupil.'
    expect(canCheck(ex, st)).toBe(true)
    expect(isCorrect(ex, st)).toBe(false)
    st.verdict = true
    expect(isCorrect(ex, st)).toBe(true)
    expect(solutionOf(ex, tf)).toBe('I am a student.')
    expect(gradedRemotely(ex)).toBe(true)
    expect(speaksSolution(ex)).toBe(false)
  })

  it('viết theo đề: chỉ nộp được khi số từ trong khoảng min–max; đúng/sai theo kết luận main', () => {
    const ex: LessonExercise = {
      type: 'write',
      prompt: 'p',
      minWords: 3,
      maxWords: 5,
      sample: 'S.'
    }
    const st = newState()
    st.typed = 'one two'
    expect(canCheck(ex, st)).toBe(false)
    st.typed = 'one two three four five six'
    expect(canCheck(ex, st)).toBe(false)
    st.typed = 'one two three'
    expect(canCheck(ex, st)).toBe(true)
    expect(isCorrect(ex, st)).toBe(false)
    st.verdict = true
    expect(isCorrect(ex, st)).toBe(true)
    expect(solutionOf(ex, tf)).toBe('S.')
    expect(gradedRemotely(MCQ)).toBe(false)
  })

  it('trả lời nói: chỉ chấm được khi đã có lời nhận dạng thật (không chỉ từ đệm); đúng/sai theo kết luận main', () => {
    const ex: LessonExercise = { type: 'respond', question: 'Q?', minWords: 3, sample: 'S.' }
    const st = newState()
    expect(canCheck(ex, st)).toBe(false)
    st.answer = { text: 'um, uh…', words: [] }
    expect(canCheck(ex, st)).toBe(false)
    st.answer = { text: 'I like tea', words: [] }
    expect(canCheck(ex, st)).toBe(true)
    expect(isCorrect(ex, st)).toBe(false)
    st.verdict = true
    expect(isCorrect(ex, st)).toBe(true)
    expect(solutionOf(ex, tf)).toBe('S.')
    expect(gradedRemotely(ex)).toBe(true)
    expect(speaksSolution(ex)).toBe(false)
  })

  it('Elo: bài viết chỉ tính khi AI chấm; trả lời nói không bao giờ tính; dạng khác luôn tính', () => {
    const write: LessonExercise = { type: 'write', prompt: 'p', minWords: 3 }
    const respond: LessonExercise = { type: 'respond', question: 'Q?', minWords: 3 }
    expect(countsForSkill(respond, 'ai')).toBe(false)
    expect(countsForSkill(respond, 'local')).toBe(false)
    expect(countsForSkill(write, 'ai')).toBe(true)
    expect(countsForSkill(write, 'local')).toBe(false)
    expect(countsForSkill({ type: 'translate', vi: 'x', answers: ['y'] }, 'local')).toBe(true)
    expect(countsForSkill(MCQ, null)).toBe(true)
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
    expect(choiceTexts(TF2, newState(), tf)).toEqual(['L:true', 'L:false'])
    expect(choiceTexts(TF3, newState(), tf)).toEqual(['L:true', 'L:false', 'L:ng'])
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
    expect(speaksSolution(HEADINGS)).toBe(false)
    expect(speaksSolution(SUMMARY)).toBe(false)
  })
})

describe('xáo thứ tự lựa chọn khi hiển thị', () => {
  it('mcq / listen / picture / gap có lựa chọn: hiện theo thứ tự đã xáo, chấm theo vị trí hiển thị', () => {
    for (const ex of [MCQ, LISTEN, PICTURE, GAP_CHOICE]) {
      const st = initState(ex, reverse)
      const content = ex.type === 'gap' ? ex.choices! : 'choices' in ex ? ex.choices : []
      expect(choiceTexts(ex, st, tf)).toEqual([...content].reverse())
      const right = correctChoice(ex, st, tf)
      expect(right).not.toBeNull()
      st.chosen = right
      expect(isCorrect(ex, st)).toBe(true)
      // Vị trí hiển thị đúng ứng với lựa chọn đúng trong nội dung
      const answerText =
        ex.type === 'gap' ? ex.answers[0] : 'answer' in ex ? content[ex.answer] : ''
      expect(choiceTexts(ex, st, tf)[right!]).toBe(answerText)
      st.chosen = (right! + 1) % content.length
      expect(isCorrect(ex, st)).toBe(false)
    }
  })

  it('mcq: vị trí hiển thị khác chỉ số nội dung thì chọn theo chỉ số nội dung là sai', () => {
    const st = initState(MCQ, reverse) // hiển thị c, b, a; đáp án b (nội dung 1) vẫn ở giữa
    const four: LessonExercise = {
      type: 'mcq',
      prompt: 'Q',
      choices: ['a', 'b', 'c', 'd'],
      answer: 0
    }
    const st4 = initState(four, reverse) // d, c, b, a → đáp án a ở vị trí 3
    expect(correctChoice(four, st4, tf)).toBe(3)
    st4.chosen = 0
    expect(isCorrect(four, st4)).toBe(false)
    st4.chosen = 3
    expect(isCorrect(four, st4)).toBe(true)
    expect(correctChoice(MCQ, st, tf)).toBe(1)
  })

  it('keepOrder: không xáo (mcq, gap, listen)', () => {
    const keep: LessonExercise[] = [
      { ...(MCQ as Extract<LessonExercise, { type: 'mcq' }>), keepOrder: true },
      { ...(GAP_CHOICE as Extract<LessonExercise, { type: 'gap' }>), keepOrder: true },
      { ...(LISTEN as Extract<LessonExercise, { type: 'listen' }>), keepOrder: true }
    ]
    for (const ex of keep) {
      const st = initState(ex, reverse)
      const content = 'choices' in ex && ex.choices ? ex.choices : []
      expect(choiceTexts(ex, st, tf)).toEqual(content)
    }
  })

  it('đúng/sai không bao giờ xáo; gap gõ không có thứ tự lựa chọn', () => {
    const st = initState(TF3, reverse)
    expect(choiceTexts(TF3, st, tf)).toEqual(['L:true', 'L:false', 'L:ng'])
    expect(correctChoice(TF3, st, tf)).toBe(2)
    expect(initState(GAP_TYPED, reverse).order).toEqual([])
    expect(correctChoice(GAP_TYPED, newState(), tf)).toBeNull()
  })
})

const HEADINGS: LessonExercise = {
  type: 'headings',
  headings: ['H0', 'H1', 'H2', 'H3'],
  answers: [2, 0, 3]
}
const SUMMARY: LessonExercise = {
  type: 'summary',
  text: 'People ___ and ___ every day.',
  answers: ['eat', 'Sleep'],
  distractors: ['fly']
}

describe('ghép tiêu đề (headings)', () => {
  it('xáo danh sách tiêu đề; đủ mọi đoạn mới chấm; đúng khi mọi đoạn đúng (tất cả hoặc không)', () => {
    const st = initState(HEADINGS, reverse)
    expect(st.order).toEqual([3, 2, 1, 0]) // vị trí hiển thị → chỉ số tiêu đề
    expect(st.slots).toEqual([null, null, null])
    expect(canCheck(HEADINGS, st)).toBe(false)
    expect(hasChoices(HEADINGS)).toBe(false)
    // Đoạn 0 → H2 (vị trí 1), đoạn 1 → H0 (vị trí 3), đoạn 2 → H3 (vị trí 0)
    st.slots = [1, 3, null]
    expect(canCheck(HEADINGS, st)).toBe(false)
    st.slots = [1, 3, 0]
    expect(canCheck(HEADINGS, st)).toBe(true)
    expect(itemResults(HEADINGS, st)).toEqual([true, true, true])
    expect(isCorrect(HEADINGS, st)).toBe(true)
    // Một đoạn sai → cả câu sai
    st.slots = [1, 3, 2]
    expect(itemResults(HEADINGS, st)).toEqual([true, true, false])
    expect(isCorrect(HEADINGS, st)).toBe(false)
    expect(solutionOf(HEADINGS, tf)).toBe('1: H2 · 2: H0 · 3: H3')
    expect(gradedRemotely(HEADINGS)).toBe(false)
    expect(countsForSkill(HEADINGS, null)).toBe(true)
  })
})

describe('bài đọc trong lúc làm bài tập', () => {
  it('lessonPassage lấy block passage đầu tiên; bài không có passage → null', () => {
    const p1 = { type: 'passage' as const, title: 'T', paragraphs: [{ en: 'a' }, { en: 'b' }] }
    const p2 = { type: 'passage' as const, paragraphs: [{ en: 'c' }] }
    expect(lessonPassage([{ type: 'text', md: 'x' }, p1, p2])).toEqual({
      title: 'T',
      paragraphs: p1.paragraphs
    })
    expect(lessonPassage([{ type: 'text', md: 'x' }])).toBeNull()
  })

  it('dòng gợi ý phím: 1–4 chỉ với dạng có lựa chọn đánh số; phím bài đọc khi có passage', () => {
    expect(keyHints(MCQ, false)).toEqual(['enter', 'choices'])
    expect(keyHints(TF2, true)).toEqual(['enter', 'choices', 'passage'])
    expect(keyHints(GAP_CHOICE, true)).toEqual(['enter', 'choices', 'passage'])
    expect(keyHints(GAP_TYPED, true)).toEqual(['enter', 'passage'])
    expect(keyHints(SUMMARY, true)).toEqual(['enter', 'passage'])
    expect(keyHints(HEADINGS, true)).toEqual(['enter', 'passage'])
    expect(keyHints(MATCH, false)).toEqual(['enter'])
  })
})

describe('hoàn thành tóm tắt (summary)', () => {
  it('ngân hàng = đáp án + từ nhiễu đã xáo; điền đủ mới chấm; so khớp không phân biệt hoa/thường', () => {
    const st = initState(SUMMARY, reverse)
    expect(st.tokens).toEqual(['fly', 'Sleep', 'eat'])
    expect(st.slots).toEqual([null, null])
    expect(canCheck(SUMMARY, st)).toBe(false)
    st.slots = [2, null]
    expect(canCheck(SUMMARY, st)).toBe(false)
    st.slots = [2, 1]
    expect(canCheck(SUMMARY, st)).toBe(true)
    expect(itemResults(SUMMARY, st)).toEqual([true, true])
    expect(isCorrect(SUMMARY, st)).toBe(true)
    st.slots = [2, 0]
    expect(itemResults(SUMMARY, st)).toEqual([true, false])
    expect(isCorrect(SUMMARY, st)).toBe(false)
    st.slots = [1, 2] // đúng từ nhưng sai chỗ
    expect(isCorrect(SUMMARY, st)).toBe(false)
    expect(solutionOf(SUMMARY, tf)).toBe('People eat and Sleep every day.')
    expect(gradedRemotely(SUMMARY)).toBe(false)
  })
})
