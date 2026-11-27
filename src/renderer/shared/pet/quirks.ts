// Hoạt ảnh tự do (`quirk_*`) và cách di chuyển riêng của từng nhân vật (docs/05 §12).
// Nguồn: `art/pets/<id>.quirks.json`, do scripts/design-data/mascot/export.py ghi từ `QUIRKS`/`WALK` của module nhân vật,
// nên thời gian giữ dáng ở đây luôn khớp độ dài hoạt ảnh CSS trong `<id>.pet.json`; nhân vật của gói nhân vật: `quirks` trong
// file gói, đăng ký bằng `registerQuirks` trước khi mount. Nhân vật không có = không có gì riêng.

export interface QuirkDef {
  /** Độ dài cả màn diễn (giây): giữ dáng bấy lâu rồi về idle */
  seconds: number
  /** Số biến thể; > 1 thì mỗi lần diễn chọn ngẫu nhiên một dáng `<tên>_1` … `<tên>_N` */
  variants: number
}

export interface QuirkManifest {
  /** Chuyển động cả khung khi ở dáng walk (lớp `m-<walk>` khai trong css của pet.json); '' = đi bộ thường */
  walk: string
  quirks: Record<string, QuirkDef>
}

const manifests = import.meta.glob<QuirkManifest>('../art/pets/*.quirks.json', {
  eager: true,
  import: 'default'
})
const NONE: Record<string, QuirkDef> = {}
const registered = new Map<string, QuirkManifest>()

/** Hoạt ảnh tự do + cách di chuyển của nhân vật từ gói nhân vật */
export function registerQuirks(character: string, manifest: QuirkManifest): void {
  registered.set(character, manifest)
}

const manifestOf = (character: string): QuirkManifest | undefined =>
  manifests[`../art/pets/${character}.quirks.json`] ?? registered.get(character)

/** Các hoạt ảnh tự do của nhân vật: tên `quirk_*` → độ dài, số biến thể */
export const quirksOf = (character: string): Record<string, QuirkDef> =>
  manifestOf(character)?.quirks ?? NONE

/** Chuyển động cả khung khi nhân vật di chuyển (bay, nhảy bốn chân...); '' = không có */
export const walkMotionOf = (character: string): string => manifestOf(character)?.walk ?? ''

/** Khoá dáng trong pet.json của một lần diễn: quirk nhiều biến thể thì chọn theo `random` (0 ≤ random < 1) */
export function quirkPose(name: string, def: QuirkDef, random: number): string {
  if (def.variants <= 1) return name
  return `${name}_${Math.min(def.variants, Math.floor(random * def.variants) + 1)}`
}
