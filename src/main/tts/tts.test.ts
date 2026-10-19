import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TtsService } from '../services/TtsService'
import type { ModelSpec } from '../translate/modelFiles'
import { ModelManager } from '../translate/ModelManager'
import type { SpeechEngine } from './engine'
import { TtsCache } from './TtsCache'

const sha = (data: string): string => createHash('sha256').update(data).digest('hex')
const FILE = 'model data'
const SPEC: ModelSpec = {
  id: 'Test/voice',
  revision: 'r1',
  files: [{ path: 'm.bin', size: FILE.length, sha256: sha(FILE) }]
}

const fakeFetch = (async (): Promise<Response> => new Response(FILE)) as typeof fetch

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ea-tts-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('TtsCache', () => {
  it('khoá ổn định: cùng giọng/tốc độ/văn bản (bỏ khoảng trắng thừa) là một khoá', () => {
    const a = TtsCache.key('af_heart', 1, 'Hello   world')
    expect(TtsCache.key('af_heart', 1, ' Hello world ')).toBe(a)
    expect(TtsCache.key('bf_emma', 1, 'Hello world')).not.toBe(a)
    expect(TtsCache.key('af_heart', 0.67, 'Hello world')).not.toBe(a)
    expect(TtsCache.key('af_heart', 1, 'hello world')).not.toBe(a)
  })

  it('lưu, đọc lại, đếm và xoá', () => {
    const cache = new TtsCache(join(dir, 'cache'))
    const key = TtsCache.key('v', 1, 'x')
    expect(cache.get(key)).toBeNull()
    cache.set(key, new Uint8Array([1, 2, 3]))
    expect([...(cache.get(key) ?? [])]).toEqual([1, 2, 3])
    expect(cache.size).toBe(1)
    cache.clear()
    expect(cache.get(key)).toBeNull()
    expect(cache.size).toBe(0)
  })
})

describe('TtsService', () => {
  function setup(): {
    service: TtsService
    engine: SpeechEngine & { calls: Array<{ text: string; voice: string; speed: number }> }
    models: ModelManager
  } {
    const calls: Array<{ text: string; voice: string; speed: number }> = []
    const engine = {
      calls,
      synthesize: async (text: string, voice: string, speed: number): Promise<Uint8Array> => {
        calls.push({ text, voice, speed })
        await new Promise((r) => setTimeout(r, 5))
        return new Uint8Array([82, 73, 70, 70, calls.length]) // "RIFF" + số thứ tự
      },
      dispose: (): void => {}
    }
    const models = new ModelManager({
      modelsDir: join(dir, 'models'),
      spec: SPEC,
      fetch: fakeFetch
    })
    const service = new TtsService({
      models,
      engine,
      cache: new TtsCache(join(dir, 'cache')),
      voices: () => ({ us: 'af_heart', uk: 'bf_emma' }),
      now: () => 0
    })
    return { service, engine, models }
  }

  it('chưa tải model → báo chưa sẵn sàng; tải xong thì đọc được', async () => {
    const { service } = setup()
    expect(service.status().state).toBe('not-installed')
    await expect(service.speak({ text: 'Hello', accent: 'us', speed: 1 })).rejects.toThrow(
      /TTS_NOT_READY/
    )
    expect((await service.install()).state).toBe('ready')
    const res = await service.speak({ text: 'Hello', accent: 'us', speed: 1 })
    expect(res.cached).toBe(false)
    expect(res.audio.length).toBeGreaterThan(0)
  })

  it('chọn giọng theo giọng Mỹ/Anh người dùng đã đặt; nghe lại lấy từ bộ nhớ đệm', async () => {
    const { service, engine } = setup()
    await service.install()
    await service.speak({ text: 'Good morning', accent: 'us', speed: 1 })
    await service.speak({ text: 'Good morning', accent: 'uk', speed: 1 })
    expect(engine.calls.map((c) => c.voice)).toEqual(['af_heart', 'bf_emma'])

    const again = await service.speak({ text: '  Good  morning ', accent: 'us', speed: 1 })
    expect(again.cached).toBe(true)
    expect(engine.calls).toHaveLength(2)

    // Tốc độ khác là một bản ghi khác
    await service.speak({ text: 'Good morning', accent: 'us', speed: 0.67 })
    expect(engine.calls).toHaveLength(3)
    expect(engine.calls[2].speed).toBe(0.67)
    expect(service.cachedCount).toBe(3)
  })

  it('bấm nghe liên tục cùng một câu → chỉ tạo một lần', async () => {
    const { service, engine } = setup()
    await service.install()
    const [a, b, c] = await Promise.all([
      service.speak({ text: 'Same sentence', accent: 'us', speed: 1 }),
      service.speak({ text: 'Same sentence', accent: 'us', speed: 1 }),
      service.speak({ text: 'Same sentence', accent: 'us', speed: 1 })
    ])
    expect(engine.calls).toHaveLength(1)
    expect([...a.audio]).toEqual([...b.audio])
    expect([...b.audio]).toEqual([...c.audio])
  })

  it('văn bản quá dài bị cắt, rỗng thì lỗi', async () => {
    const { service, engine } = setup()
    await service.install()
    await service.speak({ text: 'a'.repeat(1000), accent: 'us', speed: 1 })
    expect(engine.calls[0].text.length).toBe(400)
    await expect(service.speak({ text: '   ', accent: 'us', speed: 1 })).rejects.toThrow(
      /VALIDATION/
    )
  })

  it('prefetch tạo sẵn ở nền (bỏ qua câu trùng/đã có); chưa tải model thì không làm gì', async () => {
    const { service, engine } = setup()
    service.prefetch(['one', 'two'], 'us', 1) // chưa cài → bỏ qua
    await new Promise((r) => setTimeout(r, 30))
    expect(engine.calls).toHaveLength(0)

    await service.install()
    service.prefetch(['one', 'two', 'one', 'three'], 'us', 1)
    await new Promise((r) => setTimeout(r, 120))
    expect(engine.calls.map((c) => c.text)).toEqual(['one', 'two', 'three'])
    expect((await service.speak({ text: 'two', accent: 'us', speed: 1 })).cached).toBe(true)
  })
})
