import { phraseContentId } from '@shared/cards'
import {
  PhrasebookFileSchema,
  type Phrasebook,
  type PhrasebookFile,
  type PhrasebookPhrase
} from '@shared/schemas/phrasebook'

/**
 * Mẫu câu giao tiếp tự soạn (content/curated/phrasebook/*.json), đóng gói sẵn trong app.
 * File sai schema bị bỏ qua kèm cảnh báo; test nội dung sẽ bắt lỗi từ trước.
 */
export class PhrasebookLibrary {
  private readonly data: Phrasebook
  private readonly byId = new Map<string, PhrasebookPhrase>()

  constructor(files: unknown[], warn: (message: string) => void = console.warn) {
    const parsed: PhrasebookFile[] = []
    for (const file of files) {
      const result = PhrasebookFileSchema.safeParse(file)
      if (result.success) parsed.push(result.data)
      else warn(`[phrasebook] bỏ qua file sai schema: ${result.error.issues[0]?.message}`)
    }
    this.data = {
      categories: parsed
        .sort((a, b) => a.category.order - b.category.order)
        .map((f) => ({
          id: f.category.id,
          title: f.category.title,
          icon: f.category.icon,
          phrases: f.phrases.map((p) => ({ ...p, id: phraseContentId(f.category.id, p.en) }))
        }))
    }
    for (const category of this.data.categories) {
      for (const phrase of category.phrases) this.byId.set(phrase.id, phrase)
    }
  }

  list(): Phrasebook {
    return this.data
  }

  /** Mẫu câu theo id nội dung ('phrase:<nhóm>:<mã băm>'); undefined nếu không còn trong thư viện */
  find(contentId: string): PhrasebookPhrase | undefined {
    return this.byId.get(contentId)
  }
}
