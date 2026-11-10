import type { z } from 'zod'
import { fnv1a64 } from '@shared/audioPack'
import {
  DiaryCorrectSchema,
  GrammarExplainSchema,
  type AiExplainInput,
  type AiStatus,
  type DiaryCorrect,
  type DiaryCorrectInput,
  type GrammarExplain
} from '@shared/schemas/ai'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import { localDayKey } from '../core/localDay'
import type { ProfileService } from '../services/ProfileService'
import type { SettingsService } from '../services/SettingsService'
import { AiKeyRejectedError, type AiClient, type AiRequest } from './AiClient'
import {
  DIARY_CORRECT_SYSTEM,
  DIARY_CORRECT_USER,
  fillPrompt,
  GRAMMAR_EXPLAIN_SYSTEM,
  GRAMMAR_EXPLAIN_USER
} from './prompts'

const CACHE_SIZE = 100

/** Lấy đoạn từ '{' đầu tới '}' cuối rồi JSON.parse; không có / hỏng → undefined */
function extractJson(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return undefined
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return undefined
  }
}

/**
 * Tác vụ AI dùng key Claude của người dùng (docs/11 §5, docs/decisions.md #56): giải thích ngữ pháp, sửa nhật ký.
 * Mỗi tác vụ: ghép prompt → gọi client → tách JSON → validate zod; câu trả lời đầy đủ mà sai định dạng thì thử lại 1 lần
 * rồi báo AI_FAILED; client lỗi (kể cả bị cắt cụt vì max_tokens) không thử lại, key bị từ chối → errors.aiKeyRejected.
 * Cache LRU trong bộ nhớ; đếm lượt gọi theo tháng (cài đặt `ai.usage`). Tắt với hồ sơ trẻ em.
 * Không ghi log nội dung câu, kết quả hay key.
 */
export class AiService {
  private readonly cache = new Map<string, unknown>()

  constructor(
    private readonly deps: {
      client: AiClient
      getKey: () => string | null
      settings: Pick<SettingsService, 'get' | 'set'>
      profiles: Pick<ProfileService, 'active'>
      clock: Clock
    }
  ) {}

  status(): AiStatus {
    return {
      enabled: this.deps.settings.get('ai.enabled') && !this.deps.profiles.active().isChild,
      hasKey: !!this.deps.getKey(),
      callsThisMonth: this.usage().count
    }
  }

  async explain(input: AiExplainInput): Promise<GrammarExplain> {
    const level = this.deps.settings.get('learning.level')
    const question = input.question?.trim() ?? ''
    const out = await this.run(
      'grammar_explain',
      { sentence: input.sentence, question, level },
      {
        system: fillPrompt(GRAMMAR_EXPLAIN_SYSTEM, { level }),
        user: fillPrompt(GRAMMAR_EXPLAIN_USER, { sentence: input.sentence, question }),
        maxTokens: 4096,
        effort: 'low'
      },
      GrammarExplainSchema
    )
    return { ...out, examples: out.examples.slice(0, 3) }
  }

  /** Sửa đoạn nhật ký (DiaryService.correct, kênh diary:correct) */
  async correctDiary(input: DiaryCorrectInput): Promise<DiaryCorrect> {
    return this.run(
      'diary_correct',
      { text: input.text, level: input.level },
      {
        system: fillPrompt(DIARY_CORRECT_SYSTEM, { level: input.level }),
        user: fillPrompt(DIARY_CORRECT_USER, { text: input.text }),
        maxTokens: 4096,
        effort: 'low'
      },
      DiaryCorrectSchema
    )
  }

  private async run<S extends z.ZodTypeAny>(
    task: string,
    keyInput: Record<string, string>,
    req: AiRequest,
    schema: S
  ): Promise<z.output<S>> {
    const st = this.status()
    if (!st.enabled || !st.hasKey) throw new AppError('FORBIDDEN', 'errors.aiOff')
    // Model nằm trong khoá: đổi model thì không trả kết quả cache của model kia
    const model = this.deps.settings.get('ai.model')
    const cacheKey = `${task}:${fnv1a64(JSON.stringify({ ...keyInput, model }))}`
    if (this.cache.has(cacheKey)) {
      const hit = this.cache.get(cacheKey)
      // LRU: đưa lên cuối (mới dùng nhất)
      this.cache.delete(cacheKey)
      this.cache.set(cacheKey, hit)
      return hit as z.output<S>
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      let text: string
      this.countCall()
      try {
        text = await this.deps.client.complete(req)
      } catch (err) {
        // Lỗi mạng/HTTP/từ chối/cắt cụt (max_tokens): không thử lại; thông điệp lỗi của client không chứa key hay nội dung
        console.warn(`[ai] ${task} request failed: ${err instanceof Error ? err.message : 'error'}`)
        throw new AppError(
          'AI_FAILED',
          err instanceof AiKeyRejectedError ? 'errors.aiKeyRejected' : 'errors.aiFailed'
        )
      }
      const parsed = schema.safeParse(extractJson(text))
      if (parsed.success) {
        this.cache.set(cacheKey, parsed.data)
        if (this.cache.size > CACHE_SIZE)
          this.cache.delete(this.cache.keys().next().value as string)
        return parsed.data as z.output<S>
      }
    }
    console.warn(`[ai] ${task}: reply did not match schema twice`)
    throw new AppError('AI_FAILED', 'errors.aiFailed')
  }

  /** Tháng cục bộ hiện tại + số lượt đã gọi (giá trị cũ của tháng trước / hỏng → 0) */
  private usage(): { month: string; count: number } {
    const month = localDayKey(this.deps.clock.now()).slice(0, 7)
    const m = /^(\d{4}-\d{2}):(\d+)$/.exec(this.deps.settings.get('ai.usage'))
    return { month, count: m && m[1] === month ? Number(m[2]) : 0 }
  }

  private countCall(): void {
    const { month, count } = this.usage()
    this.deps.settings.set('ai.usage', `${month}:${count + 1}`)
  }
}
