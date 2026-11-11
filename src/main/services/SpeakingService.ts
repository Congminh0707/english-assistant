import type { LessonExercise, LessonKind } from '@shared/schemas/lesson'
import type { SpeakingFeedbackRequest, SpeakingResult } from '@shared/schemas/speaking'
import { respondVerdict, respondWordCount } from '@shared/speaking'
import { answerFluency } from '@shared/speech'
import type { AiService } from '../ai/AiService'
import { AppError } from '../core/AppError'
import type { LessonService } from './LessonService'
import type { SettingsService } from './SettingsService'

/** Lý do không dùng được AI (khoá i18n): lỗi có kiểu của AiService giữ nguyên, lỗi khác → errors.aiFailed */
function aiReasonOf(err: unknown): string {
  return err instanceof AppError ? err.messageKey : 'errors.aiFailed'
}

/**
 * Chấm dạng bài `respond` (trả lời câu hỏi bằng giọng nói — docs/07, decisions #61). Câu hỏi, số từ tối thiểu lấy từ
 * nội dung bài theo `kind + lessonId + index`; renderer chỉ gửi lời nhận dạng Whisper (chữ) + mốc thời gian từng từ.
 * Số liệu trôi chảy tính lại ở đây từ mốc thời gian (không tin số renderer tính).
 * - `useAi: true` (người học bấm "Nhận xét bằng AI") và AI dùng được → `speaking_feedback`, đạt khi
 *   `overall ≥ RESPOND_PASS`.
 * - Còn lại (chấm tại máy, AI tắt, hồ sơ trẻ em, hết lượt, bận, lỗi) → đạt khi nói đủ `minWords` từ, kèm `aiReason`;
 *   không bao giờ chặn bài học. Hạn mức, cache, hồ sơ trẻ em do AiService lo như mọi tác vụ khác.
 * Tách khỏi WritingService vì đầu vào là lời nói (mốc thời gian, số liệu trôi chảy) chứ không phải chữ gõ.
 * Không lưu, không ghi log lời nhận dạng (âm thanh không bao giờ tới đây).
 */
export class SpeakingService {
  constructor(
    private readonly deps: {
      ai: Pick<AiService, 'status' | 'speakingFeedback'>
      lessons: (kind: LessonKind) => Pick<LessonService, 'get'>
      settings: Pick<SettingsService, 'get'>
    }
  ) {}

  private exercise(ref: {
    kind: LessonKind
    lessonId: string
    index: number
  }): Extract<LessonExercise, { type: 'respond' }> {
    const ex = this.deps.lessons(ref.kind).get(ref.lessonId).exercises[ref.index]
    if (!ex || ex.type !== 'respond') throw new AppError('VALIDATION', 'errors.validation')
    return ex
  }

  async feedback(input: SpeakingFeedbackRequest): Promise<SpeakingResult> {
    const ex = this.exercise(input)
    const words = respondWordCount(input.transcript)
    // Lời nhận dạng chỉ có từ đệm / dấu câu: giao diện đã báo "không nghe thấy gì" và không gửi; chặn lại ở đây
    if (words === 0) throw new AppError('VALIDATION', 'errors.validation')
    const fluency = answerFluency(input.words)
    const local = (aiReason: string | null): SpeakingResult => ({
      passed: respondVerdict(words, ex.minWords, null),
      gradedBy: 'local',
      words,
      fluency,
      feedback: null,
      aiReason
    })
    const st = this.deps.ai.status()
    // Chấm tại máy theo lựa chọn của người học: không gọi AI dù AI đang bật
    if (!input.useAi) return local(st.enabled && st.ready ? null : 'errors.aiOff')
    if (!st.enabled) return local('errors.aiOff')
    try {
      const feedback = await this.deps.ai.speakingFeedback({
        question: ex.question,
        transcript: input.transcript,
        minWords: ex.minWords,
        fluency,
        level: this.deps.settings.get('learning.level')
      })
      return {
        passed: respondVerdict(words, ex.minWords, feedback),
        gradedBy: 'ai',
        words,
        fluency,
        feedback,
        aiReason: null
      }
    } catch (err) {
      return local(aiReasonOf(err))
    }
  }
}
