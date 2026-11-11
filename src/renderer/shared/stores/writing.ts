import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LessonKind } from '@shared/schemas/lesson'
import type { TranslateCheckResult, WritingResult } from '@shared/schemas/writing'
import { matchesTranslation } from '@shared/translationMatch'
import { translateVerdict, writeLength, writeVerdict } from '@shared/writing'
import { invoke, IpcError } from '../ipc'

/** Vị trí bài tập trong bài học (main tự lấy đề/đáp án từ nội dung) */
export interface ExerciseRef {
  kind: LessonKind
  lessonId: string
  index: number
}

const reasonOf = (err: unknown): string =>
  err instanceof IpcError ? err.info.messageKey : 'errors.unknown'

/**
 * Luyện viết trong bài học (docs/07 "Luyện viết"): gọi main chấm câu dịch / bài viết. Không bao giờ ném lỗi: kênh IPC
 * lỗi thì chấm tại chỗ như khi không có AI (so khớp đáp án mẫu / đủ số từ) và trả kèm lý do, để bài học không bị chặn
 * và chữ người học không mất.
 */
export const useWritingStore = defineStore('writing', () => {
  /** AI dùng được (bật, không phải hồ sơ trẻ em, có nhà cung cấp) — chỉ để hiện chữ "AI đang chấm"; null = chưa biết */
  const aiReady = ref<boolean | null>(null)

  async function refreshAi(): Promise<void> {
    try {
      const st = await invoke('ai:status')
      aiReady.value = st.enabled && st.ready
    } catch {
      aiReady.value = false
    }
  }

  async function checkTranslation(
    at: ExerciseRef,
    text: string,
    answers: string[]
  ): Promise<TranslateCheckResult> {
    try {
      return await invoke('writing:check-translation', { ...at, text })
    } catch (err) {
      const matched = matchesTranslation(text, answers)
      return {
        ...translateVerdict(matched, null),
        corrected: null,
        note: null,
        aiReason: matched ? null : reasonOf(err)
      }
    }
  }

  async function feedback(
    at: ExerciseRef,
    text: string,
    bounds: { minWords: number; maxWords?: number }
  ): Promise<WritingResult> {
    try {
      return await invoke('writing:feedback', { ...at, text })
    } catch (err) {
      const { words } = writeLength(text, bounds.minWords, bounds.maxWords)
      return {
        passed: writeVerdict(words, bounds.minWords, null),
        gradedBy: 'local',
        words,
        feedback: null,
        aiReason: reasonOf(err)
      }
    }
  }

  return { aiReady, refreshAi, checkTranslation, feedback }
})
