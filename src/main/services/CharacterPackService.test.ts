import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  allCharacterIds,
  clearRegisteredCharacters,
  isPackCharacter,
  normalizeCharacterId,
  PACK_CHARACTER_ID,
  registerCharacters
} from '@shared/characters'
import {
  CHARACTER_PACK_FORMAT,
  CharacterPackSchema,
  PET_POSES,
  PET_STAGES,
  packCharacterProblems,
  packSecurityProblems,
  unsafeMarkup
} from '@shared/schemas/characterPack'
import { shopCatalog } from '@shared/shop'
import { FakeClock } from '../core/Clock'
import { openUserDb, type UserDbConnection } from '../db/client'
import { createContainer, type Container } from '../container'
import { CharacterPackError, CharacterPackService } from './CharacterPackService'

// Gói mẫu TỔNG HỢP (nhân vật bịa "testy", hình tối giản vô hại): test chạy được khi không có gói thật nào trong máy.
const FIG =
  '<g class="br" style="transform-origin:80px 150px"><path d="M60 100h40v50H60Z" fill="url(#tg)"/></g>'

function art(extraStates: Record<string, string> = {}): Record<string, unknown> {
  const stage = (scale: number): Record<string, unknown> => ({
    scale,
    defs: '<linearGradient id="tg"><stop offset="0" stop-color="#fc0"/></linearGradient>',
    states: { ...Object.fromEntries(PET_POSES.map((p) => [p, FIG])), ...extraStates }
  })
  return {
    css: '.ftesty-spin{animation:ftesty-spin 4s ease-in-out 1 both}.tv-ftesty-walk .mv{translate:0 -6px}',
    vb: { fig: '-16 -8 192 168', legend: '-40 -36 240 196', veh: '-40 -50 240 210' },
    egg: { defs: '', svg: '<path d="M80 50c20 0 30 40 30 60s-60 20-60 0 10-60 30-60Z"/>' },
    stages: Object.fromEntries(PET_STAGES.map((st, i) => [st, stage([0.72, 0.84, 0.92, 1][i])])),
    acc: {
      'acc:bow': { slot: 'head', defs: '', b: '', f: '<path d="M70 30h20v8H70Z" fill="#f36"/>' }
    }
  }
}

function lines(prefix: string): Record<string, string[]> {
  return { pat: [`${prefix} 1`, `${prefix} 2`, `${prefix} 3`], idle: [`${prefix} %PET%`] }
}

function character(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    price: 10,
    minLevel: 0,
    emoji: '🧪',
    name: 'Testy',
    i18n: {
      vi: { name: 'Testy', desc: 'Nhân vật thử', lines: lines('Chào') },
      en: { name: 'Testy', desc: 'A test pet', lines: lines('Hi') }
    },
    hit: { all: [[80, 30, 20, 10]] },
    quirks: { walk: 'ftesty-walk', quirks: { quirk_spin: { seconds: 4, variants: 1 } } },
    art: art({ quirk_spin: FIG }),
    ...overrides
  }
}

function pack(chars: Record<string, unknown>[] = [character('testy')], id = 'testpack'): string {
  return JSON.stringify({
    format: CHARACTER_PACK_FORMAT,
    formatVersion: 1,
    id,
    name: 'Gói thử',
    version: 1,
    characters: chars
  })
}

let dir: string
let logs: string[]
let service: CharacterPackService

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ea-charpack-'))
  logs = []
  service = new CharacterPackService({ dir, log: (m) => logs.push(m) })
})

afterEach(() => {
  clearRegisteredCharacters()
  rmSync(dir, { recursive: true, force: true })
})

describe('gói nhân vật: schema và kiểm tra khớp nối', () => {
  it('gói mẫu hợp lệ, sạch, đủ dáng', () => {
    const parsed = CharacterPackSchema.parse(JSON.parse(pack()))
    expect(packSecurityProblems(parsed)).toEqual([])
    expect(packCharacterProblems(parsed.characters[0])).toEqual([])
  })

  it('báo thiếu dáng, quirk thừa, thiếu CSS cách di chuyển, câu thoại lệch chủ đề', () => {
    const bad = character('testy', {
      quirks: { walk: 'fother-walk', quirks: {} },
      art: art({ quirk_stray: FIG, idle: '' }),
      i18n: {
        vi: { name: 'T', desc: 'd', lines: { pat: ['a'] } },
        en: { name: 'T', desc: 'd', lines: { idle: ['a'] } }
      }
    })
    const problems = packCharacterProblems(
      CharacterPackSchema.parse(JSON.parse(pack([bad]))).characters[0]
    ).join('\n')
    expect(problems).toContain('thiếu dáng baby/idle')
    expect(problems).toContain('quirk_stray')
    expect(problems).toContain('.tv-fother-walk .mv')
    expect(problems).toContain('khác chủ đề')
  })

  it('quét svg/css: chặn script, thuộc tính sự kiện, tham chiếu ngoài; cho phép tham chiếu nội bộ', () => {
    expect(unsafeMarkup('<g><use href="#a"/><path fill="url(#b)"/></g>')).toBeNull()
    expect(unsafeMarkup('<g style="transform-origin:80px 150px"/>')).toBeNull()
    expect(unsafeMarkup('<SCRIPT>x()</SCRIPT>')).toBe('<script')
    expect(unsafeMarkup('<svg onload="x()">')).toBe('event attribute')
    expect(unsafeMarkup('<svg/onload=x>')).toBe('event attribute')
    expect(unsafeMarkup('.a{background:url(https://x.test/a.png)}')).toBe('external url(')
    expect(unsafeMarkup('<image href="data:image/png;base64,AA"/>')).toBe('external href')
    expect(unsafeMarkup('.a{background:u\\72l(x)}')).toBe('backslash escape')
    expect(unsafeMarkup('<a xlink:href="javascript:x()">')).toBe('javascript:')
  })

  it('quét svg/css: chặn cách che chuỗi cấm bằng bình luận/CDATA, phần tử đổi thuộc tính, tài nguyên ngoài, :host', () => {
    expect(unsafeMarkup('<style>a{background:ur<!---->l(x)}')).toBe('comment/CDATA')
    expect(unsafeMarkup('<style>a{background:ur<![CDATA[]]>l(x)}')).toBe('comment/CDATA')
    expect(unsafeMarkup('<style>a{}')).toBe('<style')
    expect(unsafeMarkup('<set attributeName="onclick" to="x"/>')).toBe('<set/<animate')
    expect(unsafeMarkup('<animateTransform attributeName="transform"/>')).toBe('<set/<animate')
    expect(unsafeMarkup('<image><set attributeName="href" to="a.png"/></image>')).toBe(
      '<set/<animate'
    )
    expect(unsafeMarkup('<img src="a.png">')).toBe('<image/<img/<video/<audio')
    expect(unsafeMarkup('<video src="a.mp4">')).toBe('<image/<img/<video/<audio')
    expect(unsafeMarkup('<g src="a">')).toBe('src attribute')
    expect(unsafeMarkup('@font-face{font-family:x}')).toBe('@font-face')
    expect(unsafeMarkup('.a{behavior:url(#x)}')).toBe('behavior/binding')
    expect(unsafeMarkup(':host{position:fixed!important;inset:0}')).toBe(':host')
    expect(
      unsafeMarkup('.a{animation:fx-spin 2s infinite}@keyframes fx-spin{50%{opacity:.5}}')
    ).toBeNull()
  })

  it('id nhân vật: chặn tên thiết bị Windows và id lạ', () => {
    for (const id of [
      'con',
      'nul',
      'aux',
      'prn',
      'com1',
      'lpt9',
      'Bad',
      'a',
      '1x',
      'x'.repeat(25),
      '..'
    ]) {
      expect(PACK_CHARACTER_ID.test(id), id).toBe(false)
    }
    for (const id of ['testy', 'hero', 'my-hero2', 'console'])
      expect(PACK_CHARACTER_ID.test(id), id).toBe(true)
  })
})

describe('CharacterPackService', () => {
  it('cài gói hợp lệ: lưu thành <id gói>.eapack, có danh sách (không kèm hình) và hình', () => {
    const info = service.install(pack(), 'tên-bất-kỳ.eapack')
    expect(info).toMatchObject({ id: 'testpack', version: 1 })
    expect(info.characters[0]).not.toHaveProperty('art')
    expect(readdirSync(dir)).toEqual(['testpack.eapack'])
    expect(service.art('testy')?.stages.adult.states.idle).toBe(FIG)
    expect(service.art('nope')).toBeNull()
    expect(service.characters()).toEqual([
      { id: 'testy', pack: 'testpack', price: 10, minLevel: 0, emoji: '🧪', name: 'Testy' }
    ])
    // Khởi động lại: nạp từ thư mục
    const again = new CharacterPackService({ dir })
    again.load()
    expect(again.list().map((p) => p.id)).toEqual(['testpack'])
  })

  it('từ chối gói có <script>', () => {
    const evil = character('testy', { art: art({ idle: '<script>alert(1)</script>' }) })
    expect(() => service.install(pack([evil]), 'evil.eapack')).toThrow(CharacterPackError)
    expect(readdirSync(dir)).toEqual([])
    expect(logs.join()).toContain('<script')
  })

  it('từ chối thẻ svg bị cắt đôi qua hai chuỗi (PetFigure nối defs liền nhau)', () => {
    const base = art()
    const stages = base.stages as Record<string, Record<string, unknown>>
    stages.adult = { ...stages.adult, defs: '<g data-x="' }
    const split = character('testy', { art: base })
    expect(() => service.install(pack([split]), 'split.eapack')).toThrow(CharacterPackError)
    expect(logs.at(-1)).toContain('cắt đôi')
  })

  it('từ chối gói có thuộc tính onload= hoặc url() ra ngoài trong css', () => {
    const onload = character('testy', { art: art({ idle: '<g onload="x()"></g>' }) })
    expect(() => service.install(pack([onload]), 'a.eapack')).toThrow(CharacterPackError)
    const external = character('testy', {
      art: { ...art(), css: '.x{background:url(http://evil.test/a.png)}' }
    })
    expect(() => service.install(pack([external]), 'b.eapack')).toThrow(CharacterPackError)
  })

  it('từ chối id trùng nhân vật gốc, trùng nhân vật của gói khác, file không phải JSON hoặc quá cỡ', () => {
    expect(() => service.install(pack([character('bi')]), 'bi.eapack')).toThrow(CharacterPackError)
    service.install(pack(), 'a.eapack')
    expect(() => service.install(pack([character('testy')], 'other'), 'b.eapack')).toThrow(
      CharacterPackError
    )
    expect(logs.at(-1)).toContain('nhân vật testy đã có trong gói testpack')
    // Cài lại cùng id gói = thay bản cũ
    expect(service.install(pack([character('testy', { price: 20 })]), 'c.eapack').id).toBe(
      'testpack'
    )
    expect(service.characters()[0].price).toBe(20)
    expect(() => service.install('{nope', 'x.eapack')).toThrow(CharacterPackError)
    expect(() => service.install(' '.repeat(30 * 1024 * 1024 + 1), 'big.eapack')).toThrow(
      CharacterPackError
    )
  })

  it('khởi động: bỏ qua file hỏng, ghi log, vẫn nạp gói tốt', () => {
    writeFileSync(join(dir, 'a-broken.eapack'), '{"format":"x"}')
    writeFileSync(join(dir, 'b-good.eapack'), pack())
    service.load()
    expect(service.list().map((p) => p.id)).toEqual(['testpack'])
    expect(logs.some((l) => l.includes('a-broken.eapack'))).toBe(true)
  })

  it('gỡ gói: xoá file', () => {
    service.install(pack(), 'a.eapack')
    service.remove('testpack')
    expect(existsSync(join(dir, 'testpack.eapack'))).toBe(false)
    expect(service.list()).toEqual([])
    expect(() => service.remove('testpack')).toThrow()
  })
})

describe('nhân vật của gói trong app (sổ đăng ký + cửa hàng, SQLite in-memory)', () => {
  let conn: UserDbConnection
  let c: Container

  beforeEach(() => {
    conn = openUserDb(':memory:', resolve('src/main/db/migrations'))
    c = createContainer(conn, new FakeClock(), {
      packsDir: resolve('content/.build/test-packs-unused')
    })
  })
  afterEach(() => conn.close())

  it('đăng ký: id hợp lệ, có trong cửa hàng; bỏ qua id trùng nhân vật gốc', () => {
    expect(normalizeCharacterId('testy')).toBe('bi')
    service.install(pack(), 'a.eapack')
    expect(
      registerCharacters([
        ...service.characters(),
        { id: 'bi', pack: 'x', price: 1, minLevel: 0, emoji: 'x', name: 'x' }
      ])
    ).toEqual(['testy'])
    expect(normalizeCharacterId('testy')).toBe('testy')
    expect(isPackCharacter('testy')).toBe(true)
    expect(isPackCharacter('bi')).toBe(false)
    expect(allCharacterIds().slice(-1)).toEqual(['testy'])
    expect(shopCatalog().some((e) => e.id === 'char:testy' && e.kind === 'character')).toBe(true)
  })

  it('mua + chọn được; gỡ gói thì về Bi mà không sửa DB, cài lại thì quay lại', () => {
    service.install(pack(), 'a.eapack')
    registerCharacters(service.characters())
    c.profiles.active()
    c.xp.grant({ amount: 0, coins: 100, reason: 'test' })
    c.shop.buy('char:testy')
    const state = c.shop.selectCharacter('testy')
    expect(state.character).toBe('testy')
    expect(c.pet.get().name).toBe('Testy') // tên mặc định đổi theo nhân vật

    // Gỡ gói (main: remove + đăng ký lại)
    service.remove('testpack')
    clearRegisteredCharacters()
    registerCharacters(service.characters())
    expect(c.pet.get().characterId).toBe('bi')
    expect(c.pet.row().characterId).toBe('testy') // DB giữ nguyên
    expect(c.inventory.list().some((i) => i.itemId === 'char:testy')).toBe(true)
    expect(c.shop.state().items.some((i) => i.id === 'char:testy')).toBe(false)

    // Cài lại: lựa chọn và quyền sở hữu quay lại
    service.install(pack(), 'a.eapack')
    registerCharacters(service.characters())
    expect(c.pet.get().characterId).toBe('testy')
    expect(c.shop.state().items.find((i) => i.id === 'char:testy')?.owned).toBe(1)
  })
})
