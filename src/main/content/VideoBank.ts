import { VideoBankFileSchema, type VideoItem } from '@shared/schemas/video'

/**
 * Danh mục video tự soạn (content/curated/videos/*.json). File sai schema bị bỏ qua kèm cảnh báo;
 * test nội dung bắt lỗi từ trước. Trùng id thì giữ mục đầu tiên.
 */
export class VideoBank {
  private readonly items = new Map<string, VideoItem>()

  constructor(files: unknown[], warn: (message: string) => void = console.warn) {
    for (const file of files) {
      const result = VideoBankFileSchema.safeParse(file)
      if (!result.success) {
        warn(`[video] bỏ qua file sai schema: ${result.error.issues[0]?.message}`)
        continue
      }
      for (const v of result.data.videos) if (!this.items.has(v.id)) this.items.set(v.id, v)
    }
  }

  list(): VideoItem[] {
    return [...this.items.values()]
  }

  get(id: string): VideoItem | undefined {
    return this.items.get(id)
  }
}
