import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zipSync } from 'fflate'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SPRITE_PACK_ID } from '@shared/spritePack'
import { SpritePackService } from '../services/SpritePackService'
import { SpritePackManager, type SpritePackSpec } from './SpritePackManager'

const enc = (s: string): Uint8Array => new TextEncoder().encode(s)

const META = {
  frameSize: { w: 288, h: 288 },
  anchor: { x: 144, y: 273 },
  animations: { idle: { frames: [0, 1], fps: 4, loop: true } },
  scale: 3
}

/** Gói thử: Bi trưởng thành có thân + phụ kiện trước/sau lưng */
function buildZip(
  extra: Record<string, Uint8Array> = {},
  files?: string[]
): { zip: Uint8Array; sha256: string } {
  const names = files ?? [
    'bi/adult/sheet.webp',
    'bi/adult/sheet.json',
    'bi/adult/acc-bow.webp',
    'bi/adult/accb-cape.webp'
  ]
  const zip = zipSync({
    'manifest.json': enc(
      JSON.stringify({ id: SPRITE_PACK_ID, version: '1.0.0', frame: 288, files: names })
    ),
    'bi/adult/sheet.webp': enc('BODY'),
    'bi/adult/sheet.json': enc(JSON.stringify(META)),
    'bi/adult/acc-bow.webp': enc('BOW'),
    'bi/adult/accb-cape.webp': enc('CAPE'),
    ...extra
  })
  return { zip, sha256: createHash('sha256').update(zip).digest('hex') }
}

const fakeFetch = (body: Uint8Array): typeof fetch =>
  (async () => new Response(Buffer.from(body), { status: 200 })) as unknown as typeof fetch

const specOf = (b: { zip: Uint8Array; sha256: string }): SpritePackSpec => ({
  id: SPRITE_PACK_ID,
  version: '1.0.0',
  url: 'https://example.test/pack.zip',
  size: b.zip.length,
  sha256: b.sha256
})

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ea-sprites-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SpritePackManager', () => {
  it('tải, kiểm tra sha256, giải nén rồi đọc được ảnh và metadata', async () => {
    const built = buildZip()
    const m = new SpritePackManager({
      packsDir: dir,
      spec: specOf(built),
      fetch: fakeFetch(built.zip)
    })
    expect(m.isInstalled()).toBe(false)
    expect(m.image('bi', 'adult', 'sheet')).toBeNull()

    await m.install(() => undefined)
    expect(m.isInstalled()).toBe(true)
    expect(m.image('bi', 'adult', 'sheet')?.toString()).toBe('BODY')
    expect(m.image('bi', 'adult', 'acc-bow')?.toString()).toBe('BOW')
    expect(m.image('bi', 'adult', 'accb-cape')?.toString()).toBe('CAPE')
    expect(m.meta('bi', 'adult')).toEqual(META)
    // Không có trong gói / sai tham số → null
    expect(m.image('bi', 'baby', 'sheet')).toBeNull()
    expect(m.image('nope', 'adult', 'sheet')).toBeNull()
    expect(m.image('bi', 'adult', '../sheet')).toBeNull()
    expect(m.image('bi', 'adult', 'acc-glasses')).toBeNull()
  })

  it('từ chối gói sai sha256, không để lại gói dở dang', async () => {
    const built = buildZip()
    const m = new SpritePackManager({
      packsDir: dir,
      spec: { ...specOf(built), sha256: '0'.repeat(64) },
      fetch: fakeFetch(built.zip)
    })
    await expect(m.install(() => undefined)).rejects.toThrow(/MODEL_CORRUPT/)
    expect(m.isInstalled()).toBe(false)
  })

  it('từ chối gói có đường dẫn lạ (thoát khỏi thư mục gói / nhân vật không có)', async () => {
    const bad = buildZip({ '../evil.webp': enc('X') }, ['../evil.webp'])
    const m1 = new SpritePackManager({
      packsDir: dir,
      spec: specOf(bad),
      fetch: fakeFetch(bad.zip)
    })
    await expect(m1.install(() => undefined)).rejects.toThrow(/PACK_INVALID/)
    expect(m1.isInstalled()).toBe(false)

    const stranger = buildZip({ 'ghost/adult/sheet.webp': enc('X') }, ['ghost/adult/sheet.webp'])
    const m2 = new SpritePackManager({
      packsDir: dir,
      spec: specOf(stranger),
      fetch: fakeFetch(stranger.zip)
    })
    await expect(m2.install(() => undefined)).rejects.toThrow(/PACK_INVALID/)
  })

  it('gỡ gói thì không đọc được nữa', async () => {
    const built = buildZip()
    const m = new SpritePackManager({
      packsDir: dir,
      spec: specOf(built),
      fetch: fakeFetch(built.zip)
    })
    await m.install(() => undefined)
    m.remove()
    expect(m.isInstalled()).toBe(false)
    expect(m.image('bi', 'adult', 'sheet')).toBeNull()
  })
})

describe('SpritePackService', () => {
  it('cài qua installer rồi trả data URL WebP và metadata; chưa cài trả null', async () => {
    const built = buildZip()
    const states: string[] = []
    const service = new SpritePackService({
      pack: new SpritePackManager({
        packsDir: dir,
        spec: specOf(built),
        fetch: fakeFetch(built.zip)
      }),
      onStatus: (s) => states.push(s.state)
    })
    expect(service.asset({ character: 'bi', stage: 'adult', name: 'sheet' })).toBeNull()
    expect(service.meta({ character: 'bi', stage: 'adult' })).toBeNull()
    expect((await service.install()).state).toBe('ready')
    expect(states).toContain('downloading')
    expect(service.asset({ character: 'bi', stage: 'adult', name: 'sheet' })).toBe(
      `data:image/webp;base64,${Buffer.from('BODY').toString('base64')}`
    )
    expect(service.meta({ character: 'bi', stage: 'adult' })?.frameSize.w).toBe(288)
    expect(service.remove().state).toBe('not-installed')
  })
})

describe('cập nhật gói tải thêm', () => {
  it('đổi version: bản cũ vẫn dùng được, báo có bản mới; bấm cập nhật mới tải bản mới', async () => {
    const v1 = buildZip()
    const first = new SpritePackManager({
      packsDir: dir,
      spec: specOf(v1),
      fetch: fakeFetch(v1.zip)
    })
    await first.install(() => undefined)

    // App mới đi kèm spec 1.1.0 (zip khác nội dung)
    const v2 = buildZip({ 'bi/adult/sheet.webp': enc('BODY-V2') })
    const states: string[] = []
    const service = new SpritePackService({
      pack: new SpritePackManager({
        packsDir: dir,
        spec: { ...specOf(v2), version: '1.1.0' },
        fetch: fakeFetch(v2.zip)
      }),
      onStatus: (s) => states.push(`${s.state}${s.updateAvailable ? '+update' : ''}`)
    })
    const before = service.status()
    expect(before).toMatchObject({ state: 'ready', updateAvailable: true })
    // Bản cũ vẫn đọc được trong lúc chưa cập nhật
    expect(service.asset({ character: 'bi', stage: 'adult', name: 'sheet' })).toContain(
      Buffer.from('BODY').toString('base64')
    )

    const after = await service.install()
    expect(after.state).toBe('ready')
    expect(after.updateAvailable).toBeUndefined()
    expect(states).toContain('downloading+update')
    expect(service.asset({ character: 'bi', stage: 'adult', name: 'sheet' })).toBe(
      `data:image/webp;base64,${Buffer.from('BODY-V2').toString('base64')}`
    )
    // Đã mới nhất: gọi lại không tải nữa
    expect((await service.install()).updateAvailable).toBeUndefined()
  })

  it('cập nhật thất bại thì bản cũ còn nguyên và báo lỗi', async () => {
    const v1 = buildZip()
    await new SpritePackManager({
      packsDir: dir,
      spec: specOf(v1),
      fetch: fakeFetch(v1.zip)
    }).install(() => undefined)
    const v2 = buildZip({ 'bi/adult/sheet.webp': enc('BODY-V2') })
    const service = new SpritePackService({
      pack: new SpritePackManager({
        packsDir: dir,
        spec: { ...specOf(v2), version: '1.1.0', sha256: '0'.repeat(64) },
        fetch: fakeFetch(v2.zip)
      })
    })
    const result = await service.install()
    expect(result).toMatchObject({ state: 'ready', updateAvailable: true })
    expect(result.errorKey).toBeTruthy()
    expect(service.asset({ character: 'bi', stage: 'adult', name: 'sheet' })).toContain(
      Buffer.from('BODY').toString('base64')
    )
  })
})
