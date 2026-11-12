// Registry các dạng bài tập của bài học (mcq, gap, order, match, listen, tf, picture, speak, translate, write, respond, headings, summary): khởi tạo trạng thái
// nhập (kể cả xáo thứ tự lựa chọn khi hiển thị), kiểm tra đã đủ để chấm chưa, chấm đúng/sai, lời giải. Thuần dữ liệu (không Vue, không IPC) → test được ở Node và dùng chung cho
// mọi trang bài tập. Thêm dạng bài mới = thêm một mục vào `HANDLERS` (+ schema trong shared/schemas/lesson.ts).
import { sameSentence } from '@shared/practice'
import type { LessonExercise } from '@shared/schemas/lesson'
import { respondWordCount } from '@shared/speaking'
import type { TimedWord } from '@shared/speech'
import { writeLength } from '@shared/writing'
import { isGapCorrect } from '../lessonText'

/** Thứ tự lựa chọn của dạng đúng/sai: Đúng, Sai, (Không có thông tin) */
export const TF_ORDER = ['true', 'false', 'ng'] as const

/** Bài nói tính là đúng khi độ chính xác từ mức này trở lên */
export const SPEAK_PASS = 70

/** Trạng thái nhập liệu của câu hiện tại (mỗi dạng bài chỉ dùng một phần) */
export interface ExerciseState {
  /** Lựa chọn đã chọn (mcq, listen, gap có lựa chọn, tf, picture) */
  chosen: number | null
  /** Đáp án gõ (gap không có lựa chọn), câu dịch (translate), bài viết (write) */
  typed: string
  /** Sắp xếp câu: các từ đã xáo và thứ tự chỉ số người dùng chọn */
  tokens: string[]
  picked: number[]
  /** Ghép cặp: mục trái i → vị trí đang hiển thị bên phải; thứ tự hiển thị bên phải (chỉ số cặp) */
  pairMap: Array<number | null>
  rightOrder: number[]
  /** Bài nói: độ chính xác (0–100) của lần nói gần nhất; null nếu chưa nói */
  spoken: number | null
  /** Dịch câu / viết theo đề / trả lời nói: kết luận đúng/sai do main chấm (so khớp, AI) trước khi chốt; null nếu chưa chấm */
  verdict: boolean | null
  /** Trả lời nói (respond): lời nhận dạng Whisper gần nhất + mốc thời gian từng từ; null nếu chưa nói / đang nói lại */
  answer: { text: string; words: TimedWord[] } | null
  /**
   * Thứ tự hiển thị: vị trí hiển thị → chỉ số trong nội dung. Dạng có lựa chọn (mcq, listen, picture, gap có lựa chọn):
   * lựa chọn đã xáo (`chosen` là vị trí hiển thị); ghép tiêu đề: danh sách tiêu đề đã xáo. Rỗng = giữ thứ tự nội dung.
   * Ngân hàng từ của `summary` nằm ở `tokens` (chữ đã xáo).
   */
  order: number[]
  /**
   * Ghép tiêu đề: đoạn i → vị trí hiển thị (trong `order`) của tiêu đề đã chọn; hoàn thành tóm tắt: chỗ trống i → vị trí
   * trong ngân hàng `tokens`. null = chưa điền.
   */
  slots: Array<number | null>
}

type Shuffle = <T>(items: T[]) => T[]

type TfLabel = (key: (typeof TF_ORDER)[number]) => string

interface Handler<E extends LessonExercise> {
  /** Có hiện danh sách lựa chọn đánh số không (để phím 1–4 chọn nhanh) */
  hasChoices: (ex: E) => boolean
  /** Văn bản các lựa chọn theo thứ tự hiển thị */
  choices: (ex: E, st: ExerciseState, tfLabel: TfLabel) => string[]
  /** Khởi tạo trạng thái nhập (dạng cần xáo trộn dùng `shuffle`) */
  init: (ex: E, st: ExerciseState, shuffle: Shuffle) => void
  canCheck: (ex: E, st: ExerciseState) => boolean
  isCorrect: (ex: E, st: ExerciseState) => boolean
  /** Dạng nhiều mục (headings, summary): đúng/sai từng đoạn/chỗ trống; dạng khác trả [] */
  items: (ex: E, st: ExerciseState) => boolean[]
  /** Đáp án đúng để hiện khi trả lời sai (và đọc to sau khi chấm với gap/order) */
  solution: (ex: E, tfLabel: TfLabel) => string
}

type Of<T extends LessonExercise['type']> = Extract<LessonExercise, { type: T }>

type ChoiceEx = Of<'mcq'> | Of<'listen'> | Of<'picture'>

/** Vị trí hiển thị → chỉ số trong nội dung (thứ tự rỗng = không xáo) */
const contentIndex = (st: ExerciseState, pos: number): number =>
  st.order.length ? (st.order[pos] ?? -1) : pos

/** Xáo thứ tự lựa chọn khi hiển thị (trừ khi nội dung yêu cầu giữ nguyên) */
function shuffleChoices(count: number, keep: boolean, shuffle: Shuffle): number[] {
  const ids = Array.from({ length: count }, (_, i) => i)
  return keep ? ids : shuffle(ids)
}

const noItems = (): boolean[] => []

/** Các dạng chọn một đáp án trong danh sách: dùng chung một handler */
const choiceHandler: Handler<ChoiceEx> = {
  hasChoices: () => true,
  choices: (ex, st) => ex.choices.map((_, pos) => ex.choices[contentIndex(st, pos)]),
  init: (ex, st, shuffle) => {
    // Dạng chọn hình không có keepOrder (hình không nhắc tới nhau)
    st.order = shuffleChoices(
      ex.choices.length,
      ex.type !== 'picture' && ex.keepOrder === true,
      shuffle
    )
  },
  canCheck: (_ex, st) => st.chosen !== null,
  isCorrect: (ex, st) => st.chosen !== null && contentIndex(st, st.chosen) === ex.answer,
  items: noItems,
  solution: (ex) =>
    ex.type === 'picture' ? `${ex.choices[ex.answer]} = ${ex.word}` : ex.choices[ex.answer]
}

const norm = (s: string): string => s.trim().toLowerCase()

/** Ngân hàng từ của bài tóm tắt (đáp án + từ nhiễu, thứ tự nội dung) */
const summaryBank = (ex: Of<'summary'>): string[] => [...ex.answers, ...ex.distractors]

const HANDLERS: { [T in LessonExercise['type']]: Handler<Of<T>> } = {
  mcq: choiceHandler,
  listen: choiceHandler,
  picture: choiceHandler,
  tf: {
    hasChoices: () => true,
    // Thứ tự Đúng / Sai / Không có thông tin cố định, không xáo
    choices: (ex, _st, tfLabel) => TF_ORDER.slice(0, ex.ng ? 3 : 2).map(tfLabel),
    init: () => undefined,
    canCheck: (_ex, st) => st.chosen !== null,
    isCorrect: (ex, st) => st.chosen === TF_ORDER.indexOf(ex.answer),
    items: noItems,
    solution: (ex, tfLabel) => tfLabel(ex.answer)
  },
  gap: {
    hasChoices: (ex) => !!ex.choices,
    choices: (ex, st) => {
      const choices = ex.choices ?? []
      return choices.map((_, pos) => choices[contentIndex(st, pos)])
    },
    init: (ex, st, shuffle) => {
      if (ex.choices) st.order = shuffleChoices(ex.choices.length, ex.keepOrder === true, shuffle)
    },
    canCheck: (ex, st) => (ex.choices ? st.chosen !== null : st.typed.trim().length > 0),
    isCorrect: (ex, st) => {
      if (!ex.choices) return isGapCorrect(st.typed, ex.answers)
      if (st.chosen === null) return false
      const text = ex.choices[contentIndex(st, st.chosen)]
      return text !== undefined && isGapCorrect(text, ex.answers)
    },
    items: noItems,
    solution: (ex) => ex.prompt.replace('___', ex.answers[0])
  },
  headings: {
    hasChoices: () => false,
    choices: () => [],
    init: (ex, st, shuffle) => {
      st.order = shuffle(ex.headings.map((_, i) => i))
      st.slots = ex.answers.map(() => null)
    },
    canCheck: (_ex, st) => st.slots.length > 0 && st.slots.every((s) => s !== null),
    isCorrect: (ex, st) => {
      const items = HANDLERS.headings.items(ex, st)
      return items.length === ex.answers.length && items.every(Boolean)
    },
    items: (ex, st) =>
      ex.answers.map((answer, i) => {
        const pos = st.slots[i]
        return pos !== null && pos !== undefined && contentIndex(st, pos) === answer
      }),
    solution: (ex) => ex.answers.map((a, i) => `${i + 1}: ${ex.headings[a]}`).join(' · ')
  },
  summary: {
    hasChoices: () => false,
    choices: () => [],
    init: (ex, st, shuffle) => {
      st.tokens = shuffle(summaryBank(ex))
      st.slots = ex.answers.map(() => null)
    },
    canCheck: (_ex, st) => st.slots.length > 0 && st.slots.every((s) => s !== null),
    isCorrect: (ex, st) => {
      const items = HANDLERS.summary.items(ex, st)
      return items.length === ex.answers.length && items.every(Boolean)
    },
    items: (ex, st) =>
      ex.answers.map((answer, i) => {
        const pos = st.slots[i]
        const word = pos === null || pos === undefined ? undefined : st.tokens[pos]
        return word !== undefined && norm(word) === norm(answer)
      }),
    solution: (ex) => {
      let i = 0
      return ex.text.replace(/___/g, () => ex.answers[i++] ?? '___')
    }
  },
  order: {
    hasChoices: () => false,
    choices: () => [],
    items: noItems,
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
  speak: {
    hasChoices: () => false,
    choices: () => [],
    init: () => undefined,
    canCheck: (_ex, st) => st.spoken !== null,
    isCorrect: (_ex, st) => st.spoken !== null && st.spoken >= SPEAK_PASS,
    items: noItems,
    solution: (ex) => ex.say
  },
  translate: {
    hasChoices: () => false,
    choices: () => [],
    init: () => undefined,
    canCheck: (_ex, st) => st.typed.trim().length > 0,
    isCorrect: (_ex, st) => st.verdict === true,
    items: noItems,
    solution: (ex) => ex.answers[0]
  },
  write: {
    hasChoices: () => false,
    choices: () => [],
    init: () => undefined,
    // Đủ số từ tối thiểu, không quá số từ tối đa (cả khi có AI lẫn không)
    canCheck: (ex, st) => writeLength(st.typed, ex.minWords, ex.maxWords).status === 'ok',
    isCorrect: (_ex, st) => st.verdict === true,
    items: noItems,
    solution: (ex) => ex.sample ?? ''
  },
  respond: {
    hasChoices: () => false,
    choices: () => [],
    init: () => undefined,
    // Có lời nhận dạng thật (không chỉ từ đệm) mới chấm được — cả khi có AI lẫn không
    canCheck: (_ex, st) => st.answer !== null && respondWordCount(st.answer.text) > 0,
    isCorrect: (_ex, st) => st.verdict === true,
    items: noItems,
    solution: (ex) => ex.sample ?? ''
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
    items: noItems,
    solution: (ex) => ex.pairs.map((p) => `${p.left} = ${p.right}`).join(' · ')
  }
}

// Gọi handler theo `ex.type`: TypeScript không tự thu hẹp kiểu qua bảng tra, nên gom việc ép kiểu vào đây một chỗ
const handlerOf = (ex: LessonExercise): Handler<LessonExercise> =>
  HANDLERS[ex.type] as unknown as Handler<LessonExercise>

export function newState(): ExerciseState {
  return {
    chosen: null,
    typed: '',
    tokens: [],
    picked: [],
    pairMap: [],
    rightOrder: [],
    spoken: null,
    verdict: null,
    answer: null,
    order: [],
    slots: []
  }
}

/** Trạng thái nhập mới cho một câu */
export function initState(ex: LessonExercise, shuffle: Shuffle): ExerciseState {
  const st = newState()
  handlerOf(ex).init(ex, st, shuffle)
  return st
}

export const hasChoices = (ex: LessonExercise): boolean => handlerOf(ex).hasChoices(ex)
/** Văn bản các lựa chọn theo thứ tự hiển thị (`st.chosen` và phím 1–4 là vị trí trong danh sách này) */
export const choiceTexts = (ex: LessonExercise, st: ExerciseState, tfLabel: TfLabel): string[] =>
  handlerOf(ex).choices(ex, st, tfLabel)
export const canCheck = (ex: LessonExercise, st: ExerciseState): boolean =>
  handlerOf(ex).canCheck(ex, st)
export const isCorrect = (ex: LessonExercise, st: ExerciseState): boolean =>
  handlerOf(ex).isCorrect(ex, st)
/** Ghép tiêu đề / hoàn thành tóm tắt: đúng/sai từng đoạn / chỗ trống (để tô sau khi chấm); dạng khác: [] */
export const itemResults = (ex: LessonExercise, st: ExerciseState): boolean[] =>
  handlerOf(ex).items(ex, st)
/** Vị trí hiển thị của đáp án đúng trong danh sách lựa chọn (để tô xanh sau khi chấm); null nếu không có */
export function correctChoice(
  ex: LessonExercise,
  st: ExerciseState,
  tfLabel: TfLabel
): number | null {
  if (!hasChoices(ex)) return null
  const n = choiceTexts(ex, st, tfLabel).length
  for (let pos = 0; pos < n; pos++) if (isCorrect(ex, { ...st, chosen: pos })) return pos
  return null
}
export const solutionOf = (ex: LessonExercise, tfLabel: TfLabel): string =>
  handlerOf(ex).solution(ex, tfLabel)

/** Các dạng bài mà lời giải được đọc to sau khi chấm */
export const speaksSolution = (ex: LessonExercise): boolean =>
  ex.type === 'gap' || ex.type === 'order'

/** Các dạng bài được main chấm (bất đồng bộ, có thể dùng AI) trước khi chốt kết quả */
export const gradedRemotely = (ex: LessonExercise): boolean =>
  ex.type === 'translate' || ex.type === 'write' || ex.type === 'respond'

/**
 * Có tính kết quả câu này vào thống kê kỹ năng (Elo) không: bài viết chỉ được chấm theo số từ (không có AI) không phải
 * bằng chứng về kỹ năng nên chỉ tính vào điểm bài, không vào Elo. Trả lời nói (`respond`) không bao giờ vào Elo (Elo
 * chưa có kỹ năng Nói; điểm dựa trên lời máy nhận dạng — docs/07, decisions #61), chỉ tính vào điểm bài.
 */
export const countsForSkill = (ex: LessonExercise, gradedBy: string | null): boolean =>
  ex.type !== 'respond' && !(ex.type === 'write' && gradedBy !== 'ai')

/** Mọi dạng bài đã đăng ký */
export const EXERCISE_TYPES = Object.keys(HANDLERS) as LessonExercise['type'][]
