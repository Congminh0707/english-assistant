// Registry các dạng bài tập của bài học (mcq, gap, order, match, listen, tf, picture): khởi tạo trạng thái nhập, kiểm tra
// đã đủ để chấm chưa, chấm đúng/sai, lời giải. Thuần dữ liệu (không Vue, không IPC) → test được ở Node và dùng chung cho
// mọi trang bài tập. Thêm dạng bài mới = thêm một mục vào `HANDLERS` (+ schema trong shared/schemas/lesson.ts).
import { sameSentence } from '@shared/practice'
import type { LessonExercise } from '@shared/schemas/lesson'
import { isGapCorrect } from '../lessonText'

/** Thứ tự lựa chọn của dạng đúng/sai: Đúng, Sai, (Không có thông tin) */
export const TF_ORDER = ['true', 'false', 'ng'] as const

/** Trạng thái nhập liệu của câu hiện tại (mỗi dạng bài chỉ dùng một phần) */
export interface ExerciseState {
  /** Lựa chọn đã chọn (mcq, listen, gap có lựa chọn, tf, picture) */
  chosen: number | null
  /** Đáp án gõ (gap không có lựa chọn) */
  typed: string
  /** Sắp xếp câu: các từ đã xáo và thứ tự chỉ số người dùng chọn */
  tokens: string[]
  picked: number[]
  /** Ghép cặp: mục trái i → vị trí đang hiển thị bên phải; thứ tự hiển thị bên phải (chỉ số cặp) */
  pairMap: Array<number | null>
  rightOrder: number[]
}

type Shuffle = <T>(items: T[]) => T[]

interface Handler<E extends LessonExercise> {
  /** Có hiện danh sách lựa chọn đánh số không (để phím 1–4 chọn nhanh) */
  hasChoices: (ex: E) => boolean
  /** Văn bản các lựa chọn */
  choices: (ex: E, tfLabel: (key: (typeof TF_ORDER)[number]) => string) => string[]
  /** Khởi tạo trạng thái nhập (dạng cần xáo trộn dùng `shuffle`) */
  init: (ex: E, st: ExerciseState, shuffle: Shuffle) => void
  canCheck: (ex: E, st: ExerciseState) => boolean
  isCorrect: (ex: E, st: ExerciseState) => boolean
  /** Đáp án đúng để hiện khi trả lời sai (và đọc to sau khi chấm với gap/order) */
  solution: (ex: E, tfLabel: (key: (typeof TF_ORDER)[number]) => string) => string
}

type Of<T extends LessonExercise['type']> = Extract<LessonExercise, { type: T }>

type ChoiceEx = Of<'mcq'> | Of<'listen'> | Of<'picture'>

/** Các dạng chọn một đáp án trong danh sách: dùng chung một handler */
const choiceHandler: Handler<ChoiceEx> = {
  hasChoices: () => true,
  choices: (ex) => ex.choices,
  init: () => undefined,
  canCheck: (_ex, st) => st.chosen !== null,
  isCorrect: (ex, st) => st.chosen === ex.answer,
  solution: (ex) =>
    ex.type === 'picture' ? `${ex.choices[ex.answer]} = ${ex.word}` : ex.choices[ex.answer]
}

const HANDLERS: { [T in LessonExercise['type']]: Handler<Of<T>> } = {
  mcq: choiceHandler,
  listen: choiceHandler,
  picture: choiceHandler,
  tf: {
    hasChoices: () => true,
    choices: (ex, tfLabel) => TF_ORDER.slice(0, ex.ng ? 3 : 2).map(tfLabel),
    init: () => undefined,
    canCheck: (_ex, st) => st.chosen !== null,
    isCorrect: (ex, st) => st.chosen === TF_ORDER.indexOf(ex.answer),
    solution: (ex, tfLabel) => tfLabel(ex.answer)
  },
  gap: {
    hasChoices: (ex) => !!ex.choices,
    choices: (ex) => ex.choices ?? [],
    init: () => undefined,
    canCheck: (ex, st) => (ex.choices ? st.chosen !== null : st.typed.trim().length > 0),
    isCorrect: (ex, st) =>
      ex.choices
        ? st.chosen !== null && isGapCorrect(ex.choices[st.chosen], ex.answers)
        : isGapCorrect(st.typed, ex.answers),
    solution: (ex) => ex.prompt.replace('___', ex.answers[0])
  },
  order: {
    hasChoices: () => false,
    choices: () => [],
    init: (ex, st, shuffle) => {
      const words = ex.answer.trim().split(/\s+/)
      let shuffled = shuffle(words)
      // Tránh để nguyên thứ tự đúng ngay từ đầu
      for (let n = 0; n < 5 && shuffled.join(' ') === words.join(' '); n++)
        shuffled = shuffle(words)
      st.tokens = shuffled
    },
    canCheck: (_ex, st) => st.tokens.length > 0 && st.picked.length === st.tokens.length,
    isCorrect: (ex, st) => sameSentence(st.picked.map((i) => st.tokens[i]).join(' '), ex.answer),
    solution: (ex) => ex.answer
  },
  match: {
    hasChoices: () => false,
    choices: () => [],
    init: (ex, st, shuffle) => {
      st.pairMap = ex.pairs.map(() => null)
      st.rightOrder = shuffle(ex.pairs.map((_, i) => i))
    },
    canCheck: (_ex, st) => st.pairMap.length > 0 && st.pairMap.every((m) => m !== null),
    isCorrect: (_ex, st) => st.pairMap.every((pos, i) => pos !== null && st.rightOrder[pos] === i),
    solution: (ex) => ex.pairs.map((p) => `${p.left} = ${p.right}`).join(' · ')
  }
}

// Gọi handler theo `ex.type`: TypeScript không tự thu hẹp kiểu qua bảng tra, nên gom việc ép kiểu vào đây một chỗ
const handlerOf = (ex: LessonExercise): Handler<LessonExercise> =>
  HANDLERS[ex.type] as unknown as Handler<LessonExercise>

export function newState(): ExerciseState {
  return { chosen: null, typed: '', tokens: [], picked: [], pairMap: [], rightOrder: [] }
}

/** Trạng thái nhập mới cho một câu */
export function initState(ex: LessonExercise, shuffle: Shuffle): ExerciseState {
  const st = newState()
  handlerOf(ex).init(ex, st, shuffle)
  return st
}

export const hasChoices = (ex: LessonExercise): boolean => handlerOf(ex).hasChoices(ex)
export const choiceTexts = (
  ex: LessonExercise,
  tfLabel: (key: (typeof TF_ORDER)[number]) => string
): string[] => handlerOf(ex).choices(ex, tfLabel)
export const canCheck = (ex: LessonExercise, st: ExerciseState): boolean =>
  handlerOf(ex).canCheck(ex, st)
export const isCorrect = (ex: LessonExercise, st: ExerciseState): boolean =>
  handlerOf(ex).isCorrect(ex, st)
export const solutionOf = (
  ex: LessonExercise,
  tfLabel: (key: (typeof TF_ORDER)[number]) => string
): string => handlerOf(ex).solution(ex, tfLabel)

/** Các dạng bài mà lời giải được đọc to sau khi chấm */
export const speaksSolution = (ex: LessonExercise): boolean =>
  ex.type === 'gap' || ex.type === 'order'

/** Mọi dạng bài đã đăng ký */
export const EXERCISE_TYPES = Object.keys(HANDLERS) as LessonExercise['type'][]
