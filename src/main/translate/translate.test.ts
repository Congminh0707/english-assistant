import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { TranslateDirection, TranslateStatus } from '@shared/schemas/translate'
import { TranslationService } from '../services/TranslationService'
import type { TranslationEngine } from './engine'
import type { ModelSpec } from './modelFiles'
import { ModelManager } from './ModelManager'

const sha = (data: string): string => createHash('sha256').update(data).digest('hex')

const FILES = { 'a.json': '{"hello":"world"}', 'onnx/model.onnx': 'x'.repeat(5000) }
const SPEC: ModelSpec = {
  id: 'Test/model',
  revision: 'rev1',
  files: Object.entries(FILES).map(([path, body]) => ({
    path,
    size: body.length,
    sha256: sha(body)
  }))
}
const TOTAL = Object.values(FILES).reduce((n, b) => n + b.length, 0)

/** fetch giả: trả nội dung theo đường dẫn; `corrupt` thay một file bằng nội dung sai */
function fakeFetch(opts: { corrupt?: string; fail?: boolean } = {}): typeof fetch & {
  calls: string[]
} {
  const calls: string[] = []
  const fn = (async (url: string | URL | Request): Promise<Response> => {
    const u = String(url)
    calls.push(u)
    if (opts.fail) return new Response(null, { status: 503 })
    const path = u.split('/resolve/rev1/')[1]
    const body = FILES[path as keyof typeof FILES]
    if (body === undefined) return new Response(null, { status: 404 })
    return new Response(path === opts.corrupt ? body.replace(/./g, 'y') : body)
  }) as typeof fetch & { calls: string[] }
  fn.calls = calls
  return fn
}

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ea-models-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('ModelManager', () => {
  it('chưa cài → tải đủ file, báo tiến trình, kiểm tra sha256, đánh dấu đã cài', async () => {
    const fetchFn = fakeFetch()
    const models = new ModelManager({ modelsDir: dir, spec: SPEC, fetch: fetchFn })
    expect(models.isInstalled()).toBe(false)
    expect(models.sizeBytes).toBe(TOTAL)

    const progress: number[] = []
    await models.install((n) => progress.push(n))
    expect(models.isInstalled()).toBe(true)
    expect(progress.at(-1)).toBe(TOTAL)
    expect(progress).toEqual([...progress].sort((a, b) => a - b))
    expect(fetchFn.calls).toHaveLength(2)
    expect(existsSync(join(models.dir, 'onnx', 'model.onnx'))).toBe(true)
    // Không còn file .part
    expect(readdirSync(join(models.dir, 'onnx')).filter((f) => f.endsWith('.part'))).toEqual([])
  })

  it('file đã tải đủ thì không tải lại', async () => {
    const models = new ModelManager({ modelsDir: dir, spec: SPEC, fetch: fakeFetch() })
    await models.install(() => {})
    const second = fakeFetch()
    const again = new ModelManager({ modelsDir: dir, spec: SPEC, fetch: second })
    await again.install(() => {})
    expect(second.calls).toHaveLength(0)
  })

  it('file tải về sai sha256 bị loại, không để lại file hỏng', async () => {
    const models = new ModelManager({
      modelsDir: dir,
      spec: SPEC,
      fetch: fakeFetch({ corrupt: 'onnx/model.onnx' })
    })
    await expect(models.install(() => {})).rejects.toThrow(/MODEL_CORRUPT/)
    expect(models.isInstalled()).toBe(false)
    expect(existsSync(join(models.dir, 'onnx', 'model.onnx'))).toBe(false)
    expect(existsSync(join(models.dir, 'onnx', 'model.onnx.part'))).toBe(false)
  })

  it('lỗi mạng/HTTP → báo lỗi; phiên bản model khác → coi như chưa cài', async () => {
    const models = new ModelManager({
      modelsDir: dir,
      spec: SPEC,
      fetch: fakeFetch({ fail: true })
    })
    await expect(models.install(() => {})).rejects.toThrow(/MODEL_DOWNLOAD/)

    const ok = new ModelManager({ modelsDir: dir, spec: SPEC, fetch: fakeFetch() })
    await ok.install(() => {})
    const newer = new ModelManager({ modelsDir: dir, spec: { ...SPEC, revision: 'rev2' } })
    expect(newer.isInstalled()).toBe(false)
  })

  it('remove xoá model', async () => {
    const models = new ModelManager({ modelsDir: dir, spec: SPEC, fetch: fakeFetch() })
    await models.install(() => {})
    models.remove()
    expect(models.isInstalled()).toBe(false)
  })
})

describe('TranslationService', () => {
  const SPEC_VI: ModelSpec = { ...SPEC, id: 'Test/model-vi-en' }

  function setup(): {
    service: TranslationService
    engine: TranslationEngine & { calls: string[]; disposed: number }
    statuses: Array<[TranslateDirection, TranslateStatus]>
    models: Record<TranslateDirection, ModelManager>
  } {
    const calls: string[] = []
    const engine = {
      calls,
      disposed: 0,
      translate: async (text: string, direction: TranslateDirection): Promise<string> => {
        calls.push(`${direction}:${text}`)
        return direction === 'en-vi' ? `VI(${text})` : `EN(${text})`
      },
      dispose(): void {
        engine.disposed++
      }
    }
    const models = {
      'en-vi': new ModelManager({ modelsDir: dir, spec: SPEC, fetch: fakeFetch() }),
      'vi-en': new ModelManager({ modelsDir: dir, spec: SPEC_VI, fetch: fakeFetch() })
    }
    const statuses: Array<[TranslateDirection, TranslateStatus]> = []
    const service = new TranslationService({
      models,
      engine,
      onStatus: (d, s) => statuses.push([d, s]),
      now: () => 0
    })
    return { service, engine, statuses, models }
  }

  it('chưa tải model → báo chưa sẵn sàng; tải xong thì dịch được', async () => {
    const { service, models, statuses } = setup()
    expect(service.status('en-vi')).toMatchObject({ state: 'not-installed', sizeBytes: TOTAL })
    await expect(service.translate('Hello')).rejects.toThrow(/TRANSLATE_NOT_READY/)

    const status = await service.install('en-vi')
    expect(status.state).toBe('ready')
    expect(models['en-vi'].isInstalled()).toBe(true)
    expect(models['vi-en'].isInstalled()).toBe(false)
    expect(statuses.map(([d]) => d)).toEqual(expect.arrayContaining(['en-vi']))
    expect(statuses.map(([, s]) => s.state)).toEqual(
      expect.arrayContaining(['downloading', 'ready'])
    )
    const res = await service.translate('  Hello   world ')
    expect(res).toEqual({
      text: 'VI(Hello world)',
      engine: 'opus-mt',
      cached: false,
      direction: 'en-vi'
    })
  })

  it('tự nhận chiều Việt → Anh, mỗi chiều cần model riêng', async () => {
    const { service, engine } = setup()
    await service.install('en-vi')
    await expect(service.translate('Tôi đang học tiếng Anh')).rejects.toThrow(/TRANSLATE_NOT_READY/)
    await service.install('vi-en')
    const res = await service.translate('Tôi đang học tiếng Anh')
    expect(res).toMatchObject({ text: 'EN(Tôi đang học tiếng Anh)', direction: 'vi-en' })
    expect(engine.calls).toEqual(['vi-en:Tôi đang học tiếng Anh'])
  })

  it('nhớ kết quả gần đây theo từng chiều, không gọi lại engine', async () => {
    const { service, engine } = setup()
    await service.install('en-vi')
    await service.translate('Good morning.')
    const again = await service.translate('Good morning.')
    expect(again.cached).toBe(true)
    expect(engine.calls).toEqual(['en-vi:Good morning.'])
  })

  it('văn bản rỗng bị từ chối', async () => {
    const { service } = setup()
    await service.install('en-vi')
    await expect(service.translate('   ')).rejects.toThrow(/VALIDATION/)
  })

  it('xoá model: tắt engine, xoá file, bỏ cache, báo trạng thái', async () => {
    const { service, engine, models, statuses } = setup()
    await service.install('en-vi')
    await service.translate('Hello')
    statuses.length = 0
    const status = service.remove('en-vi')
    expect(status.state).toBe('not-installed')
    expect(models['en-vi'].isInstalled()).toBe(false)
    expect(engine.disposed).toBe(1)
    expect(statuses).toEqual([['en-vi', status]])
    await expect(service.translate('Hello')).rejects.toThrow(/TRANSLATE_NOT_READY/)
  })

  it('tải lỗi → trạng thái error có khoá i18n, cho phép thử lại', async () => {
    const failing = new ModelManager({
      modelsDir: dir,
      spec: SPEC,
      fetch: fakeFetch({ fail: true })
    })
    const service = new TranslationService({
      models: { 'en-vi': failing, 'vi-en': failing },
      engine: { translate: async () => '', dispose: () => {} },
      now: () => 0
    })
    const status = await service.install('en-vi')
    expect(status).toMatchObject({ state: 'error', errorKey: 'errors.modelDownload' })
  })
})
