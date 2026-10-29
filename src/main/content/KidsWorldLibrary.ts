import {
  KidsPlaceFileSchema,
  KidsWorldFileSchema,
  type KidsPlaceFile,
  type KidsTier
} from '@shared/schemas/kidsWorld'

/**
 * Nội dung bản đồ thế giới của bé: content/curated/kids/world/ (world.json + places/*.json, tự soạn).
 * File sai schema bị bỏ qua kèm cảnh báo; test nội dung (kidsWorld.content.test.ts) bắt lỗi từ trước. docs/19 §4
 */
export class KidsWorldLibrary {
  readonly tiers: KidsTier[]
  readonly places: KidsPlaceFile[]
  private readonly byId = new Map<string, KidsPlaceFile>()
  private readonly byWord = new Map<string, KidsPlaceFile>()

  constructor(
    worldFiles: unknown[],
    placeFiles: unknown[],
    warn: (message: string) => void = console.warn
  ) {
    const world = worldFiles.length > 0 ? KidsWorldFileSchema.safeParse(worldFiles[0]) : null
    if (world && !world.success)
      warn(`[kids-world] world.json sai schema: ${world.error.issues[0]?.message}`)
    this.tiers = world?.success ? [...world.data.tiers].sort((a, b) => a.order - b.order) : []
    const tierOrder = new Map(this.tiers.map((t) => [t.id, t.order]))
    const parsed: KidsPlaceFile[] = []
    for (const file of placeFiles) {
      const result = KidsPlaceFileSchema.safeParse(file)
      if (!result.success)
        warn(`[kids-world] bỏ qua nơi sai schema: ${result.error.issues[0]?.message}`)
      else if (!tierOrder.has(result.data.place.tier)) {
        warn(`[kids-world] bỏ qua nơi thuộc tầng không có: ${result.data.place.id}`)
      } else parsed.push(result.data)
    }
    this.places = parsed.sort(
      (a, b) =>
        tierOrder.get(a.place.tier)! - tierOrder.get(b.place.tier)! || a.place.order - b.place.order
    )
    for (const p of this.places) {
      this.byId.set(p.place.id, p)
      for (const w of p.words) this.byWord.set(w.picture, p)
    }
  }

  /** Có nội dung để hiện bản đồ */
  get enabled(): boolean {
    return this.tiers.length > 0 && this.places.length > 0
  }

  place(id: string): KidsPlaceFile | undefined {
    return this.byId.get(id)
  }

  placesOfTier(tier: string): KidsPlaceFile[] {
    return this.places.filter((p) => p.place.tier === tier)
  }

  /** Nơi mà từ (id hình) là từ mới */
  placeOfWord(pictureId: string): KidsPlaceFile | undefined {
    return this.byWord.get(pictureId)
  }

  tier(id: string): KidsTier | undefined {
    return this.tiers.find((t) => t.id === id)
  }
}
