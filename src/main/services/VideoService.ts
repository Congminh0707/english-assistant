import type { VideoPlay, VideoResult, VideoSummary } from '@shared/schemas/video'
import { AppError } from '../core/AppError'
import type { Clock } from '../core/Clock'
import type { VideoBank } from '../content/VideoBank'
import type { ExamRepository } from '../db/repositories/ExamRepository'
import type { XpRepository } from '../db/repositories/XpRepository'
import type { ProfileService } from './ProfileService'
import type { XpService } from './XpService'

const SESSION_TTL_MS = 2 * 60 * 60_000
const XP_REASON = 'video.quiz'
const XP_PER_VIDEO = 10
/** Kết quả mỗi lần xem lưu ở exam_attempts với exam = 'video'; id video nằm trong part_results */
const EXAM = 'video'

interface Play {
  profileId: string
  videoId: string
  startedAt: number
}

/**
 * Thư viện video: nhúng YouTube kèm câu hỏi dừng theo mốc. Đáp án chỉ ở main; renderer nộp các câu trả lời
 * sau khi xem rồi nhận kết quả. XP một lần cho mỗi video (khi đúng ít nhất nửa số câu).
 */
export class VideoService {
  private readonly plays = new Map<string, Play>()
  private seq = 0

  constructor(
    private readonly deps: {
      bank: VideoBank
      repo: ExamRepository
      profiles: ProfileService
      clock: Clock
      xp?: XpService
      xpRepo?: XpRepository
    }
  ) {}

  list(): VideoSummary[] {
    const { bank, repo, profiles } = this.deps
    const last = new Map<string, { correct: number; total: number }>()
    // recent() đã sắp mới → cũ; lấy lần đầu gặp của mỗi video
    for (const r of repo.recent(profiles.activeId(), EXAM, 500)) {
      const id = parseVideoId(r.partResults)
      if (id && !last.has(id)) last.set(id, { correct: r.correct, total: r.total })
    }
    return bank.list().map((v) => ({
      id: v.id,
      videoId: v.videoId,
      title: v.title,
      channel: v.channel,
      level: v.level,
      topics: v.topics,
      summary: v.summary,
      questions: v.checkpoints.length,
      last: last.get(v.id) ?? null
    }))
  }

  play(id: string): VideoPlay {
    this.cleanup()
    const v = this.deps.bank.get(id)
    if (!v) throw new AppError('NOT_FOUND', 'errors.notFound')
    const now = this.deps.clock.now()
    const playId = `video:${now}:${++this.seq}`
    this.plays.set(playId, {
      profileId: this.deps.profiles.activeId(),
      videoId: v.id,
      startedAt: now
    })
    return {
      playId,
      videoId: v.videoId,
      title: v.title,
      sourceUrl: v.sourceUrl,
      startSec: v.startSec ?? null,
      endSec: v.endSec ?? null,
      vocab: v.vocab,
      checkpoints: v.checkpoints.map((c) => ({
        at: c.at,
        prompt: c.question.prompt,
        choices: c.question.choices
      }))
    }
  }

  submit(playId: string, answers: Array<number | null>): VideoResult {
    const play = this.plays.get(playId)
    if (!play) throw new AppError('NOT_FOUND', 'errors.notFound')
    this.plays.delete(playId)
    const v = this.deps.bank.get(play.videoId)
    if (!v) throw new AppError('NOT_FOUND', 'errors.notFound')
    const now = this.deps.clock.now()
    let correct = 0
    const review = v.checkpoints.map((c, i) => {
      const raw = answers[i]
      const picked = typeof raw === 'number' && raw < c.question.choices.length ? raw : null
      if (picked === c.question.answer) correct++
      return { picked, answer: c.question.answer, explain: c.question.explain }
    })
    const total = v.checkpoints.length
    this.deps.repo.add(
      {
        profileId: play.profileId,
        exam: EXAM,
        mode: 'part',
        part: null,
        correct,
        total,
        estListening: null,
        estReading: null,
        estTotal: 0,
        partResults: JSON.stringify({ videoId: v.id }),
        elapsedSec: Math.round((now - play.startedAt) / 1000),
        finishedAt: now
      },
      now
    )
    return { correct, total, review, xp: this.grantXp(play, v.id, correct, total) }
  }

  private grantXp(play: Play, videoId: string, correct: number, total: number): number {
    const { xp, xpRepo } = this.deps
    if (!xp || !xpRepo || correct * 2 < total) return 0
    if (xpRepo.hasEvent(play.profileId, XP_REASON, videoId)) return 0
    xp.grant({ amount: XP_PER_VIDEO, coins: 0, reason: XP_REASON, refId: videoId })
    return XP_PER_VIDEO
  }

  private cleanup(): void {
    const now = this.deps.clock.now()
    for (const [id, p] of this.plays) if (now - p.startedAt > SESSION_TTL_MS) this.plays.delete(id)
  }
}

function parseVideoId(partResults: string): string | null {
  try {
    const parsed = JSON.parse(partResults) as { videoId?: unknown }
    return typeof parsed.videoId === 'string' ? parsed.videoId : null
  } catch {
    return null
  }
}
