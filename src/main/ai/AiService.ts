import type { z } from 'zod'
import { cliUnlimitedActive } from '@shared/aiLimit'
import { fnv1a64 } from '@shared/audioPack'
import {
  DiaryCorrectSchema,
  GrammarExplainSchema,
  SpeakingFeedbackSchema,
  TranslationCheckSchema,
  WritingFeedbackSchema,
  type AiExplainInput,
  type AiProvider,
  type AiStatus,
  type DiaryCorrect,
  type DiaryCorrectInput,
  type GrammarExplain,
  type SpeakingFeedback,
  type SpeakingFeedbackInput,
  type TranslationCheck,
  type TranslationCheckInput,
  type WritingFeedback,
  type WritingFeedbackInput
} from '@shared/schemas/ai'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import { localDayKey } from '../core/localDay'
import type { ProfileService } from '../services/ProfileService'
import type { SettingsService } from '../services/SettingsService'
import { AiKeyRejectedError, type AiClient, type AiRequest } from './AiClient'
import type { CliProbe } from './resolveClaudeCli'
import {
  DIARY_CORRECT_SYSTEM,
  DIARY_CORRECT_USER,
  fillPrompt,
  GRAMMAR_EXPLAIN_SYSTEM,
  GRAMMAR_EXPLAIN_USER,
  SPEAKING_FEEDBACK_SYSTEM,
  SPEAKING_FEEDBACK_USER,
  TRANSLATION_CHECK_SYSTEM,
  TRANSLATION_CHECK_USER,
  WRITING_FEEDBACK_SYSTEM,
  WRITING_FEEDBACK_USER
} from './prompts'

const CACHE_SIZE = 100
/** Số yêu cầu CLI được chờ khi đã có một tiến trình đang chạy; quá → AI_BUSY */
const CLI_MAX_WAITING = 2
/** Nút "Kiểm tra lại" dò lại CLI tối đa 1 lần mỗi 5 s */
const RECHECK_MIN_MS = 5000

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

/** Số liệu trôi chảy dạng dòng `tên: giá trị` cho thẻ <fluency> (null = quá ít từ để đo → "unknown") */
function fluencyLines(f: SpeakingFeedbackInput['fluency']): string {
  const v = (n: number | null): string => (n === null ? 'unknown' : String(n))
  return [
    `words: ${f.wordCount}`,
    `words_per_minute: ${v(f.wpm)}`,
    `long_pauses_over_0.8s: ${v(f.longPauses)}`,
    `immediate_repetitions: ${f.repetitions}`,
    `fillers: ${f.fillers}`,
    `speaking_seconds: ${v(f.speakingSec)}`
  ].join('\n')
}

/**
 * Tác vụ AI (docs/11 §5, docs/decisions.md #56, #57, #61): giải thích ngữ pháp, sửa nhật ký, xét câu dịch, chấm bài viết,
 * nhận xét câu trả lời nói (chữ nhận dạng). Hai nhà cung cấp: key API của
 * người dùng (AnthropicClient) hoặc Claude Code CLI đã đăng nhập gói Pro/Max (ClaudeCliClient), chọn theo `ai.provider`.
 * Mỗi tác vụ: ghép prompt → gọi client → tách JSON → validate zod; câu trả lời đầy đủ mà sai định dạng thì thử lại 1 lần
 * rồi báo AI_FAILED; client lỗi (kể cả bị cắt cụt vì max_tokens) không thử lại, key bị từ chối → errors.aiKeyRejected,
 * lỗi có kiểu của client (AppError: hết hạn mức gói, CLI chưa đăng nhập) đi thẳng ra UI.
 * CLI: mỗi lúc 1 tiến trình (tối đa 2 yêu cầu chờ), hạn mức lượt/ngày `ai.cliDailyLimit` (đếm `ai.cliUsage`; cache hit
 * không tính, lượt thử lại có tính); `ai.cliUnlimited` bỏ hạn mức nhưng vẫn đếm, hạn mức 0 = tắt CLI luôn thắng.
 * Cache LRU trong bộ nhớ theo nhà cung cấp + model; đếm lượt gọi theo tháng (`ai.usage`). Tắt với hồ sơ trẻ em. Không ghi log nội dung câu, kết quả hay key.
 */
export class AiService {
  private readonly cache = new Map<string, unknown>()
  private cliBusy = false
  private readonly cliWaiting: Array<() => void> = []
  private lastRecheck: number | null = null

  constructor(
    private readonly deps: {
      clients: { api: AiClient; cli: AiClient }
      cli: CliProbe
      getKey: () => string | null
      settings: Pick<SettingsService, 'get' | 'set'>
      profiles: Pick<ProfileService, 'active'>
      clock: Clock
    }
  ) {}

  /** Trạng thái đồng bộ (trạng thái CLI lấy từ cache của CliProbe, không chạy tiến trình) */
  status(): AiStatus {
    const cliState = this.deps.cli.peek()
    const provider = this.pickProvider()
    return {
      enabled: this.enabled(),
      ready: provider !== null,
      provider,
      cliAvailable: cliState === 'ready',
      cliState,
      cliCallsToday: this.cliUsage().count,
      cliDailyLimit: this.deps.settings.get('ai.cliDailyLimit'),
      cliUnlimited: this.cliUnlimited(),
      callsThisMonth: this.usage().count
    }
  }

  /**
   * Trạng thái cho kênh ai:status: chỉ dò CLI khi CLI có thể được dùng (AI bật, không phải hồ sơ trẻ em, hạn mức > 0,
   * provider `cli` hoặc `auto` mà không có key). Chưa dò lần nào → chờ dò (trừ khi `wait: false`); đã dò mà quá 10 phút
   * → trả trạng thái cũ ngay và làm mới phía sau (chỉ `claude auth status`, không gọi model).
   * `wait: false` (diary:today): không bao giờ chờ, dò phía sau; trang đọc lại khi focus / settings:changed.
   */
  async refreshStatus(opts: { wait?: boolean } = {}): Promise<AiStatus> {
    if (this.cliRelevant()) {
      if (opts.wait !== false && this.deps.cli.peek() === 'unknown') await this.deps.cli.check()
      else void this.deps.cli.check().catch(() => undefined)
    }
    return this.status()
  }

  /**
   * Nút "Kiểm tra lại" (kênh ai:recheck-cli): phân giải lại exe + hỏi lại đăng nhập. AI tắt / hồ sơ trẻ em → không chạy
   * gì; bấm liên tục → tối đa 1 lần mỗi 5 s (trong khoảng đó trả trạng thái đang có).
   */
  async recheckCli(): Promise<AiStatus> {
    if (!this.enabled()) return this.status()
    const now = this.deps.clock.now()
    if (this.lastRecheck !== null && now - this.lastRecheck < RECHECK_MIN_MS) return this.status()
    this.lastRecheck = now
    await this.deps.cli.check({ force: true })
    return this.status()
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

  /** Xét câu dịch Việt → Anh không khớp đáp án mẫu (WritingService.checkTranslation, kênh writing:check-translation) */
  async checkTranslation(input: TranslationCheckInput): Promise<TranslationCheck> {
    const answers = input.answers.join('\n')
    return this.run(
      'translation_check',
      { vi: input.vi, answers, text: input.text, level: input.level },
      {
        system: fillPrompt(TRANSLATION_CHECK_SYSTEM, { level: input.level }),
        user: fillPrompt(TRANSLATION_CHECK_USER, { vi: input.vi, answers, text: input.text }),
        maxTokens: 4096,
        effort: 'low'
      },
      TranslationCheckSchema
    )
  }

  /** Chấm bài viết theo đề (WritingService.feedback, kênh writing:feedback); giữ tối đa 8 chỗ sửa, 3 mẹo */
  async writingFeedback(input: WritingFeedbackInput): Promise<WritingFeedback> {
    const length =
      input.maxWords !== undefined
        ? `${input.minWords}-${input.maxWords} words`
        : `at least ${input.minWords} words`
    const out = await this.run(
      'writing_feedback',
      { prompt: input.prompt, text: input.text, length, level: input.level },
      {
        system: fillPrompt(WRITING_FEEDBACK_SYSTEM, { level: input.level, length }),
        user: fillPrompt(WRITING_FEEDBACK_USER, { prompt: input.prompt, text: input.text }),
        maxTokens: 4096,
        effort: 'low'
      },
      WritingFeedbackSchema
    )
    return { ...out, corrections: out.corrections.slice(0, 8), tips_vi: out.tips_vi.slice(0, 3) }
  }

  /**
   * Nhận xét câu trả lời nói (SpeakingService.feedback, kênh speaking:feedback): chỉ gửi chữ nhận dạng + số liệu trôi
   * chảy main đã tính, không bao giờ gửi âm thanh; giữ tối đa 6 chỗ sửa, 3 mẹo
   */
  async speakingFeedback(input: SpeakingFeedbackInput): Promise<SpeakingFeedback> {
    const fluency = fluencyLines(input.fluency)
    const minWords = String(input.minWords)
    const out = await this.run(
      'speaking_feedback',
      {
        question: input.question,
        transcript: input.transcript,
        fluency,
        minWords,
        level: input.level
      },
      {
        system: fillPrompt(SPEAKING_FEEDBACK_SYSTEM, { level: input.level, minWords }),
        user: fillPrompt(SPEAKING_FEEDBACK_USER, {
          question: input.question,
          transcript: input.transcript,
          fluency
        }),
        maxTokens: 4096,
        effort: 'low'
      },
      SpeakingFeedbackSchema
    )
    return { ...out, corrections: out.corrections.slice(0, 6), tips_vi: out.tips_vi.slice(0, 3) }
  }

  private async run<S extends z.ZodTypeAny>(
    task: string,
    keyInput: Record<string, string>,
    req: AiRequest,
    schema: S
  ): Promise<z.output<S>> {
    if (this.cliRelevant() && this.deps.cli.peek() === 'unknown') await this.deps.cli.check()
    const st = this.status()
    if (!st.enabled || !st.provider) throw new AppError('FORBIDDEN', 'errors.aiOff')
    const provider = st.provider
    // Nhà cung cấp + model nằm trong khoá: đổi một trong hai thì không trả kết quả cache của cái kia
    const model = this.deps.settings.get('ai.model')
    const cacheKey = `${task}:${fnv1a64(JSON.stringify({ ...keyInput, model, provider }))}`
    const hit = this.cacheGet(cacheKey)
    if (hit !== undefined) return hit as z.output<S>
    if (provider === 'api') return this.attempts(task, cacheKey, req, schema, 'api')
    // CLI: báo hết hạn mức ngay (khỏi xếp hàng), rồi chờ tới lượt; tới lượt thì xét lại cache (bấm 2 lần cùng câu)
    this.assertCliQuota()
    await this.acquireCli()
    try {
      const again = this.cacheGet(cacheKey)
      if (again !== undefined) return again as z.output<S>
      return await this.attempts(task, cacheKey, req, schema, 'cli')
    } finally {
      this.releaseCli()
    }
  }

  private async attempts<S extends z.ZodTypeAny>(
    task: string,
    cacheKey: string,
    req: AiRequest,
    schema: S,
    provider: AiProvider
  ): Promise<z.output<S>> {
    for (let attempt = 0; attempt < 2; attempt++) {
      let text: string
      if (provider === 'cli') {
        // Mỗi lượt gọi CLI (kể cả lượt thử lại) là một tiến trình, tính vào hạn mức ngày
        this.assertCliQuota()
        this.countCliCall()
      }
      this.countCall()
      try {
        text = await this.deps.clients[provider].complete(req)
      } catch (err) {
        if (err instanceof AppError) {
          // CLI báo chưa đăng nhập: bỏ trạng thái "sẵn sàng" đã cache để lần sau dò lại
          if (err.messageKey === 'errors.aiCliLogin') this.deps.cli.invalidate()
          console.warn(`[ai] ${task} request failed: ${err.code}`)
          throw err
        }
        // Lỗi mạng/HTTP/từ chối/cắt cụt (max_tokens)/tiến trình: không thử lại; thông điệp lỗi của client không chứa key hay nội dung
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

  /** Lấy từ cache (LRU: đưa lên cuối = mới dùng nhất); không có → undefined */
  private cacheGet(cacheKey: string): unknown {
    if (!this.cache.has(cacheKey)) return undefined
    const hit = this.cache.get(cacheKey)
    this.cache.delete(cacheKey)
    this.cache.set(cacheKey, hit)
    return hit
  }

  private enabled(): boolean {
    return this.deps.settings.get('ai.enabled') && !this.deps.profiles.active().isChild
  }

  /** Nhà cung cấp dùng được theo `ai.provider`; CLI cần đã cài + đăng nhập (theo cache) và hạn mức ngày > 0 */
  private pickProvider(): AiProvider | null {
    const pref = this.deps.settings.get('ai.provider')
    const hasKey = !!this.deps.getKey()
    const cliOk = this.deps.cli.peek() === 'ready' && this.deps.settings.get('ai.cliDailyLimit') > 0
    if (pref === 'api') return hasKey ? 'api' : null
    if (pref === 'cli') return cliOk ? 'cli' : null
    return hasKey ? 'api' : cliOk ? 'cli' : null
  }

  /** CLI có thể được dùng → mới đáng chạy `claude auth status` */
  private cliRelevant(): boolean {
    if (!this.enabled() || this.deps.settings.get('ai.cliDailyLimit') <= 0) return false
    const pref = this.deps.settings.get('ai.provider')
    return pref === 'cli' || (pref === 'auto' && !this.deps.getKey())
  }

  /** Không giới hạn lượt CLI (chỉ khi hạn mức > 0; hạn mức 0 = tắt CLI, xem pickProvider) */
  private cliUnlimited(): boolean {
    return cliUnlimitedActive(
      this.deps.settings.get('ai.cliDailyLimit'),
      this.deps.settings.get('ai.cliUnlimited')
    )
  }

  /** Hết lượt hôm nay → AI_LIMIT; không giới hạn thì bỏ qua (lượt vẫn được đếm ở countCliCall) */
  private assertCliQuota(): void {
    if (this.cliUnlimited()) return
    if (this.cliUsage().count >= this.deps.settings.get('ai.cliDailyLimit'))
      throw new AppError('AI_LIMIT', 'errors.aiDailyLimit')
  }

  /** Hàng đợi 1 tiến trình CLI: đang chạy → chờ (tối đa CLI_MAX_WAITING), quá → AI_BUSY */
  private async acquireCli(): Promise<void> {
    if (!this.cliBusy) {
      this.cliBusy = true
      return
    }
    if (this.cliWaiting.length >= CLI_MAX_WAITING) throw new AppError('AI_BUSY', 'errors.aiBusy')
    await new Promise<void>((resolve) => this.cliWaiting.push(resolve))
  }

  /** Nhường lượt cho yêu cầu chờ kế tiếp (vẫn giữ cờ bận); không còn ai thì nhả */
  private releaseCli(): void {
    const next = this.cliWaiting.shift()
    if (next) next()
    else this.cliBusy = false
  }

  /** Ngày cục bộ hiện tại + số lượt CLI đã gọi hôm nay (giá trị của ngày khác / hỏng → 0) */
  private cliUsage(): { day: string; count: number } {
    const day = localDayKey(this.deps.clock.now())
    const m = /^(\d{4}-\d{2}-\d{2}):(\d+)$/.exec(this.deps.settings.get('ai.cliUsage'))
    return { day, count: m && m[1] === day ? Number(m[2]) : 0 }
  }

  private countCliCall(): void {
    const { day, count } = this.cliUsage()
    this.deps.settings.set('ai.cliUsage', `${day}:${count + 1}`)
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
