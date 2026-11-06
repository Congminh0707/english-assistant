import { resolve } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PLAYER_CSP, PLAYER_JS, playerResource } from '../system/videoPlayerPage'
import { FakeClock } from '../core/Clock'
import { VideoBank } from '../content/VideoBank'
import { openUserDb, type UserDbConnection } from '../db/client'
import { ExamRepository } from '../db/repositories/ExamRepository'
import { XpRepository } from '../db/repositories/XpRepository'
import { createContainer } from '../container'
import { VideoService } from './VideoService'

const MIGRATIONS = resolve('src/main/db/migrations')
const OPTIONS = { packsDir: resolve('content/.build/test-packs-unused') }

const question = (answer: number): object => ({
  prompt: 'What is it about?',
  choices: ['a', 'b', 'c', 'd'],
  answer,
  explain: 'Vì sao đúng.'
})

const file = {
  license: 'proprietary-own',
  generator: 'test',
  reviewed: true,
  videos: [
    {
      id: 'vid-one',
      videoId: 'dQw4w9WgXcQ',
      title: 'One',
      channel: 'Chan',
      sourceUrl: 'https://example.com/one',
      license: 'youtube-embed',
      level: 'A2_1',
      summary: 'Tóm tắt.',
      checkpoints: [
        { at: 10, question: question(1) },
        { at: 'end', question: question(2) }
      ]
    }
  ]
}

let conn: UserDbConnection
let clock: FakeClock
let service: VideoService

beforeEach(() => {
  conn = openUserDb(':memory:', MIGRATIONS)
  clock = new FakeClock()
  const c = createContainer(conn, clock, OPTIONS)
  service = new VideoService({
    bank: new VideoBank([file]),
    repo: new ExamRepository(conn.db),
    profiles: c.profiles,
    clock,
    xp: c.xp,
    xpRepo: new XpRepository(conn.db)
  })
})

afterEach(() => conn.close())

describe('VideoBank', () => {
  it('bỏ file sai schema, giữ mục đầu khi trùng id', () => {
    const warnings: string[] = []
    const bank = new VideoBank([{ nope: true }, file, file], (m) => warnings.push(m))
    expect(warnings).toHaveLength(1)
    expect(bank.list()).toHaveLength(1)
  })

  it('từ chối videoId sai độ dài và mốc không tăng dần', () => {
    const bad = structuredClone(file)
    bad.videos[0].videoId = 'short'
    expect(new VideoBank([bad], () => undefined).list()).toHaveLength(0)
    const unordered = structuredClone(file)
    unordered.videos[0].checkpoints = [
      { at: 30, question: question(0) },
      { at: 10, question: question(0) }
    ] as never
    expect(new VideoBank([unordered], () => undefined).list()).toHaveLength(0)
  })
})

describe('VideoService', () => {
  it('danh sách và lượt xem không lộ đáp án', () => {
    const list = service.list()
    expect(list).toHaveLength(1)
    expect(list[0].last).toBeNull()
    const play = service.play('vid-one')
    expect(play.checkpoints).toHaveLength(2)
    expect(JSON.stringify(play)).not.toContain('explain')
    expect(JSON.stringify(play)).not.toContain('answer')
  })

  it('nộp bài: chấm đúng, nhớ kết quả lần gần nhất, chỉ nộp một lần', () => {
    const play = service.play('vid-one')
    const result = service.submit(play.playId, [1, 0])
    expect(result.correct).toBe(1)
    expect(result.total).toBe(2)
    expect(result.review[1]).toMatchObject({ picked: 0, answer: 2 })
    expect(service.list()[0].last).toEqual({ correct: 1, total: 2 })
    expect(() => service.submit(play.playId, [1, 0])).toThrow()
  })

  it('không tồn tại thì báo lỗi', () => {
    expect(() => service.play('nope')).toThrow()
  })
})

describe('trang máy phát eaplayer', () => {
  it('chỉ phục vụ index và player.js', () => {
    expect(playerResource('/index.html')?.contentType).toContain('text/html')
    expect(playerResource('/player.js')?.body).toBe(PLAYER_JS)
    expect(playerResource('/secret')).toBeNull()
  })

  it('CSP chỉ cho YouTube, không cho eval hay nguồn lạ', () => {
    expect(PLAYER_CSP).toContain("default-src 'none'")
    expect(PLAYER_CSP).not.toContain('unsafe-eval')
    expect(PLAYER_CSP).not.toContain('*')
  })

  it('script chỉ nhận lệnh từ cửa sổ cha và kiểm tra videoId', () => {
    expect(PLAYER_JS).toContain('e.source !== parent')
    expect(PLAYER_JS).toContain('[A-Za-z0-9_-]{11}')
  })
})
