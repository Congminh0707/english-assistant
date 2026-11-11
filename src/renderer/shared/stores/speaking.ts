import { defineStore } from 'pinia'
import type { SpeakingResult } from '@shared/schemas/speaking'
import { boundAnswer, respondVerdict, respondWordCount } from '@shared/speaking'
import { answerFluency, type TimedWord } from '@shared/speech'
import { invoke, IpcError } from '../ipc'
import type { ExerciseRef } from './writing'

const reasonOf = (err: unknown): string =>
  err instanceof IpcError ? err.info.messageKey : 'errors.unknown'

/**
 * Trả lời câu hỏi bằng giọng nói trong bài học (dạng `respond`, docs/07): gửi lời nhận dạng Whisper (chữ, không bao giờ
 * là âm thanh) cho main chấm. `useAi` chỉ true khi người học bấm "Nhận xét bằng AI". Không bao giờ ném lỗi: kênh IPC
 * lỗi thì chấm tại chỗ như khi không có AI (đủ số từ) và trả kèm lý do. Không lưu lời nhận dạng ở đâu cả.
 * Trạng thái AI dùng chung với `useWritingStore().aiReady`.
 */
export const useSpeakingStore = defineStore('speaking', () => {
  async function feedback(
    at: ExerciseRef,
    answer: { text: string; words: TimedWord[] },
    minWords: number,
    useAi: boolean
  ): Promise<SpeakingResult> {
    const bounded = boundAnswer(answer.text, answer.words)
    try {
      return await invoke('speaking:feedback', { ...at, ...bounded, useAi })
    } catch (err) {
      const words = respondWordCount(bounded.transcript)
      return {
        passed: respondVerdict(words, minWords, null),
        gradedBy: 'local',
        words,
        fluency: answerFluency(bounded.words),
        feedback: null,
        aiReason: reasonOf(err)
      }
    }
  }

  return { feedback }
})
