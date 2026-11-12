import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PronunciationStatus } from '@shared/schemas/stt'
import { STT_SAMPLE_RATE } from '@shared/speech'
import { ModelManager } from '../translate/ModelManager'
import type { ModelSpec } from '../translate/modelFiles'
import { PronunciationService } from './PronunciationService'

const BODY = 'w'.repeat(3000)
const SPEC: ModelSpec = {
  id: 'Test/phoneme',
  revision: 'rev1',
  files: [
    {
      path: 'model.onnx',
      size: BODY.length,
      sha256: createHash('sha256').update(BODY).digest('hex')
    }
  ]
}
const fetchOk = (async () => new Response(BODY)) as unknown as typeof fetch

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ea-pron-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

function setup(): {
  service: PronunciationService
  models: ModelManager
  engine: {
    disposed: number
    evaluate: () => Promise<{ expected: string[]; heard: string[] }>
    dispose: () => void
  }
  statuses: PronunciationStatus[]
} {
  const models = new ModelManager({ modelsDir: dir, spec: SPEC, fetch: fetchOk })
  const engine = {
    disposed: 0,
    evaluate: async () => ({ expected: ['θ'], heard: ['f'] }),
    dispose(): void {
      engine.disposed++
    }
  }
  const statuses: PronunciationStatus[] = []
  const service = new PronunciationService({ models, engine, onStatus: (s) => statuses.push(s) })
  return { service, models, engine, statuses }
}

describe('PronunciationService', () => {
  it('model đã tải từ bản trước: vẫn chấm được; xoá khi người dùng bấm → tắt engine, xoá file, báo trạng thái', async () => {
    const { service, models, engine, statuses } = setup()
    await models.install(() => {}) // giả lập máy đã tải ở bản trước
    expect(service.status().state).toBe('ready')
    const audio = new Float32Array(STT_SAMPLE_RATE)
    expect(await service.evaluate(audio, 'think')).toEqual({ expected: ['θ'], heard: ['f'] })

    const status = service.remove()
    expect(status.state).toBe('not-installed')
    expect(existsSync(models.dir)).toBe(false)
    expect(engine.disposed).toBe(1)
    expect(statuses.at(-1)).toEqual(status)
    expect(() => service.evaluate(audio, 'think')).toThrow(/PRON_NOT_READY/)
  })

  it('chưa tải: không có gì tự tải hay tự xoá; remove vô hại', () => {
    const { service, models } = setup()
    expect(service.status()).toMatchObject({ state: 'not-installed', receivedBytes: 0 })
    expect(service.remove().state).toBe('not-installed')
    expect(existsSync(models.dir)).toBe(false)
  })
})
