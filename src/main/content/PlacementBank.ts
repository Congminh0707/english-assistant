import {
  PlacementBankFileSchema,
  type PlacementBankFile,
  type PlacementItem
} from '@shared/schemas/placement'
import { LEVEL_CODES } from '@shared/schemas/content/level'

/**
 * Ngân hàng câu hỏi ngữ pháp và đọc hiểu cho bài kiểm tra đầu vào (content/curated/placement/*.json, tự soạn).
 * File sai schema bị bỏ qua kèm cảnh báo; test nội dung sẽ bắt lỗi từ trước.
 */
export class PlacementBank {
  private readonly bySkill: Record<'grammar' | 'reading' | 'listening', PlacementItem[]> = {
    grammar: [],
    reading: [],
    listening: []
  }

  constructor(files: unknown[], warn: (message: string) => void = console.warn) {
    for (const file of files) {
      const result = PlacementBankFileSchema.safeParse(file)
      if (!result.success) {
        warn(`[placement] bỏ qua file sai schema: ${result.error.issues[0]?.message}`)
        continue
      }
      const data: PlacementBankFile = result.data
      this.bySkill[data.skill].push(...data.items)
    }
  }

  count(skill: 'grammar' | 'reading' | 'listening'): number {
    return this.bySkill[skill].length
  }

  /**
   * Chọn ngẫu nhiên một câu chưa hỏi ở bậc `index`, hoặc bậc lân cận nếu bậc đó hết câu.
   * Trả null nếu ngân hàng đã hết câu.
   */
  pick(
    skill: 'grammar' | 'reading' | 'listening',
    index: number,
    asked: ReadonlySet<string>,
    random: () => number = Math.random
  ): { item: PlacementItem; index: number } | null {
    const pool = this.bySkill[skill].filter((i) => !asked.has(i.id))
    for (const delta of [0, 1, -1, 2, -2, 3, -3]) {
      const target = index + delta
      if (target < 0 || target >= LEVEL_CODES.length) continue
      const candidates = pool.filter((i) => LEVEL_CODES.indexOf(i.level) === target)
      if (candidates.length) {
        return { item: candidates[Math.floor(random() * candidates.length)], index: target }
      }
    }
    return null
  }
}
