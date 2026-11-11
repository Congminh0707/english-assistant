import type { LessonExercise, LessonKind } from '@shared/schemas/lesson'
import type {
  TranslateCheckInput,
  TranslateCheckResult,
  WritingFeedbackRequest,
  WritingResult
} from '@shared/schemas/writing'
import { matchesTranslation } from '@shared/translationMatch'
import { translateVerdict, writeLength, writeVerdict } from '@shared/writing'
import type { AiService } from '../ai/AiService'
import { AppError } from '../core/AppError'
import type { LessonService } from './LessonService'
import type { SettingsService } from './SettingsService'

/** Lý do không dùng được AI (khoá i18n): lỗi có kiểu của AiService giữ nguyên, lỗi khác → errors.aiFailed */
function aiReasonOf(err: unknown): string {
  return err instanceof AppError ? err.messageKey : 'errors.aiFailed'
}

/**
 * Chấm hai dạng bài luyện viết trong bài học (docs/07 "Luyện viết", decisions #59). Đề, đáp án mẫu, số từ lấy từ nội
 * dung bài theo `kind + lessonId + index` — renderer chỉ gửi chữ người học.
 * - `translate`: so khớp đáp án mẫu (shared/translationMatch) → khớp là đúng, không gọi AI; không khớp → AI xét
 *   (`translation_check`) nếu dùng được, không thì sai.
 * - `write`: AI chấm (`writing_feedback`), đạt khi `overall ≥ WRITE_PASS`; không có AI → đạt khi đủ `minWords`.
 * Mọi lỗi AI (tắt, hồ sơ trẻ em, hết lượt hôm nay, bận, lỗi mạng/định dạng) đều quy về chấm không AI kèm `aiReason`,
 * không bao giờ chặn bài học. Hạn mức, cache, hồ sơ trẻ em do AiService lo như mọi tác vụ khác. Không ghi log chữ.
 */
export class WritingService {
  constructor(
    private readonly deps: {
      ai: Pick<AiService, 'status' | 'checkTranslation' | 'writingFeedback'>
      lessons: (kind: LessonKind) => Pick<LessonService, 'get'>
      settings: Pick<SettingsService, 'get'>
    }
  ) {}

  private exercise<T extends 'translate' | 'write'>(
    ref: { kind: LessonKind; lessonId: string; index: number },
    type: T
  ): Extract<LessonExercise, { type: T }> {
    const ex = this.deps.lessons(ref.kind).get(ref.lessonId).exercises[ref.index]
    if (!ex || ex.type !== type) throw new AppError('VALIDATION', 'errors.validation')
    return ex as Extract<LessonExercise, { type: T }>
  }

  async checkTranslation(input: TranslateCheckInput): Promise<TranslateCheckResult> {
    const ex = this.exercise(input, 'translate')
    if (matchesTranslation(input.text, ex.answers)) {
      return { ...translateVerdict(true, null), corrected: null, note: null, aiReason: null }
    }
    if (!this.deps.ai.status().enabled) {
      return {
        ...translateVerdict(false, null),
        corrected: null,
        note: null,
        aiReason: 'errors.aiOff'
      }
    }
    try {
      const ai = await this.deps.ai.checkTranslation({
        vi: ex.vi,
        answers: ex.answers,
        text: input.text,
        level: this.deps.settings.get('learning.level')
      })
      return {
        ...translateVerdict(false, ai),
        corrected: ai.corrected,
        note: ai.note_vi,
        aiReason: null
      }
    } catch (err) {
      return {
        ...translateVerdict(false, null),
        corrected: null,
        note: null,
        aiReason: aiReasonOf(err)
      }
    }
  }

  async feedback(input: WritingFeedbackRequest): Promise<WritingResult> {
    const ex = this.exercise(input, 'write')
    const { words, status } = writeLength(input.text, ex.minWords, ex.maxWords)
    // Giao diện đã khoá nút nộp; chặn lại ở đây để AI không bao giờ chấm bài sai độ dài
    if (status !== 'ok') throw new AppError('VALIDATION', 'errors.validation')
    const local = (aiReason: string): WritingResult => ({
      passed: writeVerdict(words, ex.minWords, null),
      gradedBy: 'local',
      words,
      feedback: null,
      aiReason
    })
    if (!this.deps.ai.status().enabled) return local('errors.aiOff')
    try {
      const feedback = await this.deps.ai.writingFeedback({
        prompt: ex.prompt,
        text: input.text,
        minWords: ex.minWords,
        maxWords: ex.maxWords,
        level: this.deps.settings.get('learning.level')
      })
      return {
        passed: writeVerdict(words, ex.minWords, feedback),
        gradedBy: 'ai',
        words,
        feedback,
        aiReason: null
      }
    } catch (err) {
      return local(aiReasonOf(err))
    }
  }
}
