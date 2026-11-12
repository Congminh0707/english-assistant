import { and, avg, count, desc, eq, isNull, sql, sum, type SQL } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { freeWritingEntries } from '../schema'

export type FreeWritingRow = typeof freeWritingEntries.$inferSelect
export type FreeWritingNew = Omit<
  FreeWritingRow,
  'id' | 'feedbackJson' | 'score' | 'ratedAt' | 'createdAt' | 'updatedAt'
>

/** Số liệu viết tự do của một hồ sơ (trang Thống kê) */
export interface FreeWritingSummary {
  entries: number
  words: number
  /** Số bài đang có nhận xét AI */
  withFeedback: number
  /** Điểm AI trung bình (làm tròn) của các bài đang có nhận xét; null nếu chưa có */
  averageScore: number | null
  /** Số bài tạo từ `since` trở đi */
  recent: number
}

/** Bài viết tự do: mọi truy vấn theo id đều lọc thêm profile_id (hồ sơ khác không đọc/sửa/xoá được) */
export class FreeWritingRepository {
  constructor(private readonly db: UserDb) {}

  private where(profileId: string, id: string): SQL | undefined {
    return and(eq(freeWritingEntries.profileId, profileId), eq(freeWritingEntries.id, id))
  }

  get(profileId: string, id: string): FreeWritingRow | null {
    return this.db.select().from(freeWritingEntries).where(this.where(profileId, id)).get() ?? null
  }

  insert(values: FreeWritingNew, now: number): FreeWritingRow {
    const row: FreeWritingRow = {
      ...values,
      id: uuidv7(now),
      feedbackJson: null,
      score: null,
      ratedAt: null,
      createdAt: now,
      updatedAt: now
    }
    this.db.insert(freeWritingEntries).values(row).run()
    return row
  }

  /** Ghi chữ mới; đổi chữ thì bỏ nhận xét cũ. Không có bài → null */
  updateText(
    profileId: string,
    id: string,
    text: string,
    wordCount: number,
    now: number
  ): FreeWritingRow | null {
    const existing = this.get(profileId, id)
    if (!existing) return null
    const patch =
      existing.text !== text
        ? { text, wordCount, feedbackJson: null, score: null, updatedAt: now }
        : { updatedAt: now }
    this.db.update(freeWritingEntries).set(patch).where(this.where(profileId, id)).run()
    return { ...existing, ...patch }
  }

  setFeedback(profileId: string, id: string, json: string, score: number, now: number): void {
    this.db
      .update(freeWritingEntries)
      .set({ feedbackJson: json, score, updatedAt: now })
      .where(this.where(profileId, id))
      .run()
  }

  /**
   * Đánh dấu bài đã tính vào rating Viết. Chỉ ghi khi chưa đánh dấu; trả true nếu lần này mới đánh dấu (hai lần nhận xét
   * chồng nhau thì chỉ một lần được tính).
   */
  markRated(profileId: string, id: string, now: number): boolean {
    return (
      this.db
        .update(freeWritingEntries)
        .set({ ratedAt: now })
        .where(and(this.where(profileId, id), isNull(freeWritingEntries.ratedAt)))
        .run().changes > 0
    )
  }

  /** Tổng số bài, số từ, số bài có nhận xét AI, điểm trung bình và số bài tạo từ `since` (ms) */
  summary(profileId: string, since: number): FreeWritingSummary {
    const t = freeWritingEntries
    const row = this.db
      .select({
        entries: count(),
        words: sum(t.wordCount),
        withFeedback: count(t.score),
        averageScore: avg(t.score),
        recent: sql<number>`sum(case when ${t.createdAt} >= ${since} then 1 else 0 end)`
      })
      .from(t)
      .where(eq(t.profileId, profileId))
      .get()
    const average = row?.averageScore == null ? null : Math.round(Number(row.averageScore))
    return {
      entries: row?.entries ?? 0,
      words: Number(row?.words ?? 0),
      withFeedback: row?.withFeedback ?? 0,
      averageScore: average,
      recent: Number(row?.recent ?? 0)
    }
  }

  /** Xoá; trả true nếu có bài bị xoá */
  remove(profileId: string, id: string): boolean {
    return this.db.delete(freeWritingEntries).where(this.where(profileId, id)).run().changes > 0
  }

  /** Mới nhất trước, phân trang theo offset */
  page(profileId: string, offset: number, limit: number): FreeWritingRow[] {
    return this.db
      .select()
      .from(freeWritingEntries)
      .where(eq(freeWritingEntries.profileId, profileId))
      .orderBy(desc(freeWritingEntries.createdAt), desc(freeWritingEntries.id))
      .limit(limit)
      .offset(offset)
      .all()
  }

  count(profileId: string): number {
    return (
      this.db
        .select({ n: count() })
        .from(freeWritingEntries)
        .where(eq(freeWritingEntries.profileId, profileId))
        .get()?.n ?? 0
    )
  }
}
