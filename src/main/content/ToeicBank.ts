import {
  ToeicBankFileSchema,
  type ToeicBankInfo,
  type ToeicGroup,
  type ToeicPart
} from '@shared/schemas/toeic'
import { TOEIC_FULL_COUNTS, TOEIC_MINI_COUNTS, TOEIC_PARTS } from '@shared/toeic'

/**
 * Ngân hàng đề TOEIC tự soạn (content/curated/toeic/*.json). File sai schema bị bỏ qua kèm cảnh báo;
 * test nội dung bắt lỗi từ trước. Trùng id nhóm thì giữ nhóm đầu tiên.
 */
export class ToeicBank {
  private readonly byPart = new Map<ToeicPart, ToeicGroup[]>(TOEIC_PARTS.map((p) => [p, []]))
  private readonly ids = new Set<string>()

  constructor(files: unknown[], warn: (message: string) => void = console.warn) {
    for (const file of files) {
      const result = ToeicBankFileSchema.safeParse(file)
      if (!result.success) {
        warn(`[toeic] bỏ qua file sai schema: ${result.error.issues[0]?.message}`)
        continue
      }
      for (const group of result.data.groups) {
        if (this.ids.has(group.id)) continue
        this.ids.add(group.id)
        this.byPart.get(group.part as ToeicPart)?.push(group)
      }
    }
  }

  groups(part: ToeicPart): readonly ToeicGroup[] {
    return this.byPart.get(part) ?? []
  }

  questionCount(part: ToeicPart): number {
    return this.groups(part).reduce((n, g) => n + g.questions.length, 0)
  }

  info(): ToeicBankInfo {
    const counts = TOEIC_PARTS.map((p) => this.questionCount(p))
    const enough = (need: Record<ToeicPart, number>): boolean =>
      TOEIC_PARTS.every((p) => counts[p - 1] >= need[p])
    return {
      questionsByPart: counts,
      mini: enough(TOEIC_MINI_COUNTS),
      full: enough(TOEIC_FULL_COUNTS)
    }
  }

  /**
   * Chọn ngẫu nhiên các nhóm của một Part cho đủ `target` câu (nhóm chọn nguyên khối nên có thể vượt vài câu).
   * Trả null nếu ngân hàng không đủ câu.
   */
  pick(part: ToeicPart, target: number, random: () => number = Math.random): ToeicGroup[] | null {
    const pool = [...this.groups(part)]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const chosen: ToeicGroup[] = []
    let n = 0
    for (const g of pool) {
      if (n >= target) break
      chosen.push(g)
      n += g.questions.length
    }
    return n >= target ? chosen : null
  }
}
