import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zipSync } from 'fflate'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LISTENING_PACK_ID, packClipKey } from '@shared/audioPack'
import { AudioPackService } from '../services/AudioPackService'
import { AudioPackManager, type AudioPackSpec } from './AudioPackManager'

const enc = (s: string): Uint8Array => new TextEncoder().encode(s)

/** Gói thử: hai câu (một Mỹ 0,8; một Anh 1) */
function buildZip(): { zip: Uint8Array; sha256: string } {
  const a = packClipKey('us', 0.8, 'Hello there.')
  const b = packClipKey('uk', 1, 'How are you?')
  const zip = zipSync({
    'manifest.json': enc(
      JSON.stringify({
        id: LISTENING_PACK_ID,
        version: '1.0.0',
        clips: { [a]: `${a}.mp3`, [b]: `${b}.mp3` }
      })
    ),
    [`clips/${a}.mp3`]: enc('MP3-A'),
    [`clips/${b}.mp3`]: enc('MP3-B')
  })
  return { zip, sha256: createHash('sha256').update(zip).digest('hex') }
}

const fakeFetch = (body: Uint8Array): typeof fetch =>
  (async () => new Response(Buffer.from(body), { status: 200 })) as unknown as typeof fetch

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ea-audio-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('packClipKey', () => {
  it('bỏ qua khác biệt khoảng trắng, phân biệt giọng và tốc độ', () => {
    expect(packClipKey('us', 0.8, 'Hello  there.')).toBe(packClipKey('us', 0.8, ' Hello there. '))
    expect(packClipKey('us', 0.8, 'Hi')).not.toBe(packClipKey('uk', 0.8, 'Hi'))
    expect(packClipKey('us', 0.8, 'Hi')).not.toBe(packClipKey('us', 1, 'Hi'))
    expect(packClipKey('us', 0.8000001, 'Hi')).toBe(packClipKey('us', 0.8, 'Hi'))
  })
})

describe('AudioPackManager', () => {
  const spec = (zip: { zip: Uint8Array; sha256: string }): AudioPackSpec => ({
    id: LISTENING_PACK_ID,
    version: '1.0.0',
    url: 'https://example.test/pack.zip',
    size: zip.zip.length,
    sha256: zip.sha256
  })

  it('tải, kiểm tra sha256, giải nén rồi tra được âm thanh theo câu', async () => {
    const built = buildZip()
    const manager = new AudioPackManager({
      packsDir: dir,
      spec: spec(built),
      fetch: fakeFetch(built.zip)
    })
    expect(manager.isInstalled()).toBe(false)
    expect(manager.clip('us', 0.8, 'Hello there.')).toBeNull()

    const progress: number[] = []
    await manager.install((n) => progress.push(n))
    expect(progress.at(-1)).toBe(built.zip.length)
    expect(manager.isInstalled()).toBe(true)
    expect(new TextDecoder().decode(manager.clip('us', 0.8, 'Hello  there.')!)).toBe('MP3-A')
    expect(new TextDecoder().decode(manager.clip('uk', 1, 'How are you?')!)).toBe('MP3-B')
    expect(manager.clip('us', 1, 'Hello there.')).toBeNull() // sai tốc độ
    expect(manager.clip('us', 0.8, 'Câu không có trong gói')).toBeNull()
  })

  it('từ chối gói sai sha256 và không để lại gói dở dang', async () => {
    const built = buildZip()
    const manager = new AudioPackManager({
      packsDir: dir,
      spec: { ...spec(built), sha256: '0'.repeat(64) },
      fetch: fakeFetch(built.zip)
    })
    await expect(manager.install(() => undefined)).rejects.toThrow(/MODEL_CORRUPT/)
    expect(manager.isInstalled()).toBe(false)
  })

  it('gỡ gói thì không còn tra được', async () => {
    const built = buildZip()
    const manager = new AudioPackManager({
      packsDir: dir,
      spec: spec(built),
      fetch: fakeFetch(built.zip)
    })
    await manager.install(() => undefined)
    manager.remove()
    expect(manager.isInstalled()).toBe(false)
    expect(manager.clip('us', 0.8, 'Hello there.')).toBeNull()
  })
})

describe('AudioPackService', () => {
  it('cài qua installer rồi trả clip kèm mime audio/mpeg; chưa cài trả null', async () => {
    const built = buildZip()
    const statuses: string[] = []
    const service = new AudioPackService({
      pack: new AudioPackManager({
        packsDir: dir,
        spec: {
          id: LISTENING_PACK_ID,
          version: '1.0.0',
          url: 'https://example.test/pack.zip',
          size: built.zip.length,
          sha256: built.sha256
        },
        fetch: fakeFetch(built.zip)
      }),
      onStatus: (s) => statuses.push(s.state)
    })
    expect(service.clip({ text: 'Hello there.', accent: 'us', rate: 0.8 })).toBeNull()
    expect((await service.install()).state).toBe('ready')
    expect(statuses).toContain('downloading')
    const clip = service.clip({ text: 'Hello there.', accent: 'us', rate: 0.8 })
    expect(clip?.mime).toBe('audio/mpeg')
    expect(service.remove().state).toBe('not-installed')
  })
})
