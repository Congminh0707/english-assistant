import { KidsFileSchema, type KidsActivity, type KidsFile } from '@shared/schemas/kids'

export interface KidsUnit {
  id: string
  title: string
  vi: string
  picture: string
  order: number
  activities: KidsActivity[]
}

/**
 * Hoạt động cho trẻ chưa biết đọc (chữ cái, âm, ghép âm, từ nhìn là nhớ): content/curated/kids/*.json (tự soạn).
 * File sai schema bị bỏ qua kèm cảnh báo; test nội dung sẽ bắt lỗi từ trước.
 */
export class KidsLibrary {
  private readonly unitList: KidsUnit[]
  private readonly byId = new Map<string, KidsActivity>()

  constructor(files: unknown[], warn: (message: string) => void = console.warn) {
    const parsed: KidsFile[] = []
    for (const file of files) {
      const result = KidsFileSchema.safeParse(file)
      if (result.success) parsed.push(result.data)
      else warn(`[kids] bỏ qua file sai schema: ${result.error.issues[0]?.message}`)
    }
    this.unitList = parsed
      .map((f) => ({ ...f.unit, activities: f.activities }))
      .sort((a, b) => a.order - b.order)
    for (const unit of this.unitList) for (const a of unit.activities) this.byId.set(a.id, a)
  }

  units(): KidsUnit[] {
    return this.unitList
  }

  activity(id: string): KidsActivity | undefined {
    return this.byId.get(id)
  }

  get activityCount(): number {
    return this.byId.size
  }
}
