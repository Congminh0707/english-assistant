import { bandOfLevel } from '@shared/freeWriting'
import { levelIndex } from '@shared/schemas/content/level'
import { FreeWritingTopicFileSchema, type FreeWritingTopic } from '@shared/schemas/freeWriting'

/**
 * Đề viết tự do tự soạn (content/curated/free-writing/*.json), đóng gói sẵn trong app. File sai schema bị bỏ qua kèm
 * cảnh báo, đề trùng mã giữ đề đầu; test nội dung bắt lỗi từ trước.
 */
export class FreeWritingTopics {
  private readonly topics: FreeWritingTopic[] = []
  private readonly byId = new Map<string, FreeWritingTopic>()

  constructor(files: unknown[], warn: (message: string) => void = console.warn) {
    for (const file of files) {
      const result = FreeWritingTopicFileSchema.safeParse(file)
      if (!result.success) {
        warn(`[free-writing] bỏ qua file sai schema: ${result.error.issues[0]?.message}`)
        continue
      }
      for (const t of result.data.topics) {
        if (this.byId.has(t.id)) continue
        const topic = { ...t, band: bandOfLevel(t.level) }
        this.byId.set(t.id, topic)
        this.topics.push(topic)
      }
    }
    this.topics.sort((a, b) => levelIndex(a.level) - levelIndex(b.level))
  }

  list(): FreeWritingTopic[] {
    return this.topics
  }

  find(id: string): FreeWritingTopic | undefined {
    return this.byId.get(id)
  }
}
