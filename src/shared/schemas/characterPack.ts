// Gói nhân vật (file .eapack): một file JSON chứa nhân vật thú cưng ngoài mã nguồn, người dùng tự cài trong Cài đặt.
// Dùng chung cho main (CharacterPackService kiểm tra khi nạp/cài), scripts/character-pack/build.ts (đóng gói) và test.
// Hình vẽ (svg/css) đi thẳng vào innerHTML + <style> trong Shadow DOM của PetFigure, nên mọi chuỗi hình phải qua `unsafeMarkup`.
import { z } from 'zod'
import { CHARACTER_IDS, PACK_CHARACTER_ID } from '../characters'

export const CHARACTER_PACK_FORMAT = 'english-assistant.character-pack'
export const CHARACTER_PACK_EXT = '.eapack'
/** Cỡ tối đa của một file gói */
export const CHARACTER_PACK_MAX_BYTES = 30 * 1024 * 1024

export const PET_STAGES = ['baby', 'teen', 'adult', 'legend'] as const
/** Dáng bắt buộc ở mọi giai đoạn (khớp POSE_IDS của export.py và src/shared/pet.test.ts) */
export const PET_POSES = [
  'idle',
  'walk',
  'run',
  'jump',
  'sit',
  'sleep',
  'eat',
  'drink',
  'read',
  'listen',
  'say',
  'hello',
  'happy',
  'sad',
  'surprised',
  'levelup',
  'car',
  'boat',
  'plane'
] as const

/**
 * Cấu trúc bị cấm trong svg/css của gói (không phân biệt hoa thường). Hình hợp lệ chỉ tham chiếu nội bộ (`#id`, `url(#id)`).
 * Hai luật cuối chặn cách viết vòng qua các luật trên: escape CSS (`u\72l(`) và thực thể HTML (`&#x75;rl(`).
 */
const UNSAFE_MARKUP: ReadonlyArray<readonly [string, RegExp]> = [
  ['<script', /<script/i],
  ['<foreignObject', /<foreignobject/i],
  ['<iframe', /<iframe/i],
  ['<object', /<object/i],
  ['<embed', /<embed/i],
  ['<link', /<link/i],
  ['<meta', /<meta/i],
  ['<base', /<base/i],
  ['<form', /<form/i],
  ['event attribute', /[\s/"']on[a-z]+\s*=/i],
  ['javascript:', /javascript:/i],
  ['@import', /@import/i],
  ['</style', /<\/style/i],
  ['expression(', /expression\(/i],
  ['external href', /href\s*=\s*(?!["']?#)/i],
  ['external url(', /url\(\s*(?!["']?#)/i],
  ['http(s) URL', /https?:/i],
  ['protocol-relative URL', /\/\//],
  ['data: URI', /data:/i],
  ['backslash escape', /\\/],
  ['HTML entity', /&/],
  // Trong <style> của SVG, bình luận và CDATA bị bỏ khi đọc CSS nên che được `ur<!---->l(`; CSS chỉ được nằm trong `art.css`
  ['comment/CDATA', /<!/],
  ['<style', /<style/i],
  // Phần tử làm đổi thuộc tính lúc chạy, hoặc nạp tài nguyên ngoài
  ['<set/<animate', /<(set|animate)/i],
  ['<image/<img/<video/<audio', /<(image|img|video|audio)[\s/>]/i],
  ['src attribute', /[\s"']src\s*=/i],
  ['@font-face', /@font-face/i],
  ['behavior/binding', /behavior\s*:|-moz-binding/i],
  // Gói không được tạo kiểu cho phần tử chủ ngoài hình (có thể phủ lên cửa sổ khác)
  [':host', /:host/i]
]

/** Tên luật mà chuỗi svg/css vi phạm, hoặc null nếu sạch */
export function unsafeMarkup(text: string): string | null {
  for (const [name, re] of UNSAFE_MARKUP) if (re.test(text)) return name
  return null
}

const Markup = z.string().max(4_000_000)
const PoseKey = z.string().regex(/^[a-z][a-z0-9_]{0,40}$/)
const ViewBox = z
  .string()
  .regex(/^-?\d{1,4}(\.\d+)? -?\d{1,4}(\.\d+)? \d{1,4}(\.\d+)? \d{1,4}(\.\d+)?$/)

const StageArtSchema = z.strictObject({
  scale: z.number().positive().max(4),
  defs: Markup,
  bg: Markup.optional(),
  fg: Markup.optional(),
  states: z.record(PoseKey, Markup),
  still: z.record(PoseKey, Markup).optional()
})

/** Nội dung một file <id>.pet.json (export.py) */
export const PetArtSchema = z.strictObject({
  css: Markup,
  vb: z.strictObject({ fig: ViewBox, legend: ViewBox, veh: ViewBox }),
  egg: z.strictObject({ defs: Markup, svg: Markup }),
  stages: z.strictObject({
    baby: StageArtSchema,
    teen: StageArtSchema,
    adult: StageArtSchema,
    legend: StageArtSchema
  }),
  acc: z.record(
    z.string().regex(/^acc:[a-z0-9-]{1,40}$/),
    z.strictObject({
      slot: z.enum(['head', 'face', 'neck', 'hand', 'back']),
      defs: Markup,
      b: Markup,
      f: Markup
    })
  ),
  hideAcc: z.array(PoseKey).optional()
})
export type PetArt = z.infer<typeof PetArtSchema>

/** Chuỗi hiển thị qua vue-i18n: cấm ký tự cú pháp của vue-i18n ({ } @ |) để câu không bị dịch sai/lỗi biên dịch */
const Text = (max: number): z.ZodString =>
  z
    .string()
    .min(1)
    .max(max)
    .regex(/^[^{}@|]*$/, 'ký tự { } @ | không được dùng')

const Ellipse = z.tuple([z.number(), z.number(), z.number().positive(), z.number().positive()])
const Ellipses = z.array(Ellipse).max(12)
/** Elip vùng bấm thêm ngoài đầu + thân (toạ độ hình 160×160, xem hitRegion.ts) */
export const PackHitSchema = z.strictObject({
  all: Ellipses.optional(),
  baby: Ellipses.optional(),
  teen: Ellipses.optional(),
  adult: Ellipses.optional(),
  legend: Ellipses.optional()
})

/** Nội dung <id>.quirks.json: cách di chuyển riêng + hoạt ảnh tự do (shared/pet/quirks) */
export const PackQuirksSchema = z.strictObject({
  walk: z.string().regex(/^([a-z][a-z0-9-]{0,40})?$/),
  quirks: z.record(
    z.string().regex(/^quirk_[a-z0-9_]{1,40}$/),
    z.strictObject({
      seconds: z.number().min(1).max(60),
      variants: z.number().int().min(1).max(9)
    })
  )
})

const PackI18nSchema = z.strictObject({
  name: Text(40),
  desc: Text(160),
  /** Câu thoại riêng theo chủ đề (mascot.chars.<id>.<topic>), có thể chứa %PET% */
  lines: z.record(z.string().regex(/^[a-zA-Z]{1,40}$/), z.array(Text(200)).max(40))
})

const PackCharacterId = z
  .string()
  .regex(PACK_CHARACTER_ID)
  .refine((id) => !(CHARACTER_IDS as readonly string[]).includes(id), 'trùng nhân vật gốc')

const PackCharacterMetaSchema = z.strictObject({
  id: PackCharacterId,
  price: z.number().int().min(0).max(100_000),
  minLevel: z.number().int().min(0).max(100),
  emoji: z.string().min(1).max(16),
  name: Text(40),
  i18n: z.strictObject({ vi: PackI18nSchema, en: PackI18nSchema }),
  hit: PackHitSchema.optional(),
  quirks: PackQuirksSchema.optional()
})

export const PackCharacterSchema = PackCharacterMetaSchema.extend({ art: PetArtSchema })
export type PackCharacter = z.infer<typeof PackCharacterSchema>

const packHeader = {
  id: z.string().regex(PACK_CHARACTER_ID),
  name: Text(60),
  version: z.number().int().min(1)
}

const uniqueIds = (chars: { id: string }[], ctx: z.RefinementCtx): void => {
  const seen = new Set<string>()
  for (const c of chars) {
    if (seen.has(c.id)) ctx.addIssue({ code: 'custom', message: `trùng id nhân vật ${c.id}` })
    seen.add(c.id)
  }
}

/** Cả file .eapack */
export const CharacterPackSchema = z.strictObject({
  format: z.literal(CHARACTER_PACK_FORMAT),
  formatVersion: z.literal(1),
  ...packHeader,
  characters: z.array(PackCharacterSchema).min(1).max(50).superRefine(uniqueIds)
})
export type CharacterPack = z.infer<typeof CharacterPackSchema>

/** Gói đã cài gửi cho renderer (characters:packs): như file gói nhưng không có hình (hình lấy riêng qua characters:art) */
export const CharacterPackInfoSchema = z.object({
  ...packHeader,
  characters: z.array(PackCharacterMetaSchema)
})
export type CharacterPackInfo = z.infer<typeof CharacterPackInfoSchema>
export type PackCharacterMeta = z.infer<typeof PackCharacterMetaSchema>

export const CharacterPacksSchema = z.object({ packs: z.array(CharacterPackInfoSchema) })
export const CharacterArtInputSchema = z.object({ id: z.string().regex(PACK_CHARACTER_ID) })
export const CharacterRemovePackInputSchema = z.object({
  packId: z.string().regex(PACK_CHARACTER_ID)
})
/** Kết quả cài: danh sách gói sau khi cài; `installed` = id gói vừa cài, null = người dùng đóng hộp chọn file */
export const CharacterInstallResultSchema = CharacterPacksSchema.extend({
  installed: z.string().nullable()
})

/** Mọi chuỗi svg/css trong hình của một nhân vật (để quét bằng `unsafeMarkup`) */
export function markupStrings(art: unknown): string[] {
  const out: string[] = []
  const walk = (v: unknown): void => {
    if (typeof v === 'string') out.push(v)
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(art)
  return out
}

/**
 * Lỗi bảo mật của một gói đã qua schema: chuỗi hình chứa cấu trúc bị cấm, hoặc chuỗi svg mở/đóng giữa chừng một thẻ
 * (PetFigure nối các chuỗi defs/hình liền nhau, nên một thẻ cắt đôi qua hai chuỗi sẽ lọt qua lần quét từng chuỗi). Rỗng = sạch
 */
export function packSecurityProblems(pack: CharacterPack): string[] {
  const problems: string[] = []
  for (const c of pack.characters) {
    const rule =
      markupStrings(c.art).map(unsafeMarkup).find(Boolean) ??
      (markupStrings({ ...c.art, css: '' }).some(splitTag) ? 'thẻ svg bị cắt đôi' : null)
    if (rule) problems.push(`${c.id}: hình chứa cấu trúc bị cấm (${rule})`)
  }
  return problems
}

/** Chuỗi svg kết thúc khi thẻ chưa đóng, hoặc bắt đầu bằng phần cuối của một thẻ */
const splitTag = (svg: string): boolean => /<[^>]*$/.test(svg) || /^[^<]*>/.test(svg)

/**
 * Kiểm tra khớp nối của một nhân vật (packer chạy trước khi ghi gói; test dùng với gói mẫu): đủ trứng + 19 dáng ở cả 4
 * giai đoạn, mỗi quirk có hình ở cả 4 giai đoạn đủ biến thể, không có dáng `quirk_*` thừa, `hideAcc` chỉ chứa quirk đã khai,
 * có CSS `.tv-<walk> .mv` khi khai `walk`, câu thoại vi và en cùng bộ chủ đề. Trả danh sách lỗi (rỗng = ổn).
 */
export function packCharacterProblems(c: PackCharacter): string[] {
  const problems: string[] = []
  const add = (msg: string): void => {
    problems.push(`${c.id}: ${msg}`)
  }
  if (!/<(g|path|rect|ellipse|circle)/.test(c.art.egg.svg)) add('thiếu hình trứng')
  for (const st of PET_STAGES) {
    for (const pose of PET_POSES) {
      if (!/<(g|path|rect|ellipse|circle)/.test(c.art.stages[st].states[pose] ?? ''))
        add(`thiếu dáng ${st}/${pose}`)
    }
  }
  const quirks = c.quirks?.quirks ?? {}
  const known = new Set<string>()
  for (const [name, def] of Object.entries(quirks)) {
    const keys =
      def.variants <= 1
        ? [name]
        : Array.from({ length: def.variants }, (_, k) => `${name}_${k + 1}`)
    for (const key of keys) {
      known.add(key)
      for (const st of PET_STAGES) if (!c.art.stages[st].states[key]) add(`thiếu dáng ${st}/${key}`)
    }
  }
  for (const st of PET_STAGES) {
    for (const key of Object.keys(c.art.stages[st].states)) {
      if (key.startsWith('quirk_') && !known.has(key))
        add(`dáng ${st}/${key} không có trong quirks`)
    }
  }
  for (const key of c.art.hideAcc ?? []) if (!known.has(key)) add(`hideAcc ${key} không phải quirk`)
  const walk = c.quirks?.walk ?? ''
  if (walk && !c.art.css.includes(`.tv-${walk} .mv`)) add(`css thiếu .tv-${walk} .mv`)
  const vi = Object.keys(c.i18n.vi.lines).sort().join(',')
  const en = Object.keys(c.i18n.en.lines).sort().join(',')
  if (vi !== en) add(`câu thoại vi (${vi}) và en (${en}) khác chủ đề`)
  return problems
}
