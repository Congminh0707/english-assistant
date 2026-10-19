import { and, asc, desc, eq, inArray, isNull, lte, sql } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { savedWords, srsCards, srsReviews } from '../schema'

export type SavedWordRow = typeof savedWords.$inferSelect
export type SrsCardRow = typeof srsCards.$inferSelect
export type NewSrsCard = Omit<SrsCardRow, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
export type SrsReviewRow = typeof srsReviews.$inferSelect
export type CardSchedule = Pick<
  SrsCardRow,
  | 'due'
  | 'stability'
  | 'difficulty'
  | 'elapsedDays'
  | 'scheduledDays'
  | 'learningSteps'
  | 'reps'
  | 'lapses'
  | 'state'
  | 'lastReview'
>

/** Sổ từ (saved_words) và thẻ ôn tập (srs_cards) của người dùng */
export class VocabRepository {
  constructor(private readonly db: UserDb) {}

  findSaved(profileId: string, text: string): SavedWordRow | undefined {
    return this.db
      .select()
      .from(savedWords)
      .where(and(eq(savedWords.profileId, profileId), eq(savedWords.text, text)))
      .get()
  }

  /** Lưu từ; nếu đã có thì tăng lookup_count và cập nhật ngữ cảnh mới nhất */
  upsertSaved(
    profileId: string,
    data: { contentId: string | null; text: string; context: string | null },
    now: number
  ): void {
    this.db
      .insert(savedWords)
      .values({
        id: uuidv7(now),
        profileId,
        contentId: data.contentId,
        text: data.text,
        context: data.context,
        lookupCount: 1,
        lastLookupAt: now,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [savedWords.profileId, savedWords.text],
        set: {
          lookupCount: sql`${savedWords.lookupCount} + 1`,
          lastLookupAt: now,
          updatedAt: now,
          contentId: sql`coalesce(${data.contentId}, ${savedWords.contentId})`,
          context: sql`coalesce(${data.context}, ${savedWords.context})`
        }
      })
      .run()
  }

  /** Trong các content id cho trước, id nào đã được lưu */
  savedContentIds(profileId: string, contentIds: string[]): Set<string> {
    if (!contentIds.length) return new Set()
    const rows = this.db
      .select({ contentId: savedWords.contentId })
      .from(savedWords)
      .where(and(eq(savedWords.profileId, profileId), inArray(savedWords.contentId, contentIds)))
      .all()
    return new Set(rows.map((r) => r.contentId).filter((id): id is string => !!id))
  }

  hasCard(profileId: string, contentId: string, direction: SrsCardRow['direction']): boolean {
    return !!this.db
      .select({ id: srsCards.id })
      .from(srsCards)
      .where(
        and(
          eq(srsCards.profileId, profileId),
          eq(srsCards.contentId, contentId),
          eq(srsCards.direction, direction)
        )
      )
      .get()
  }

  insertCard(card: NewSrsCard, now: number): SrsCardRow {
    const row: SrsCardRow = {
      ...card,
      id: uuidv7(now),
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    }
    this.db.insert(srsCards).values(row).run()
    return row
  }

  /** Thẻ đến hạn ôn (due ≤ now), sớm nhất trước */
  dueCards(profileId: string, now: number, limit: number): SrsCardRow[] {
    return this.db
      .select()
      .from(srsCards)
      .where(
        and(
          eq(srsCards.profileId, profileId),
          eq(srsCards.suspended, false),
          isNull(srsCards.deletedAt),
          lte(srsCards.due, now)
        )
      )
      .orderBy(asc(srsCards.due))
      .limit(limit)
      .all()
  }

  countDue(profileId: string, now: number): number {
    const row = this.db
      .select({ n: sql<number>`count(*)` })
      .from(srsCards)
      .where(
        and(
          eq(srsCards.profileId, profileId),
          eq(srsCards.suspended, false),
          isNull(srsCards.deletedAt),
          lte(srsCards.due, now)
        )
      )
      .get()
    return Number(row?.n ?? 0)
  }

  findCard(profileId: string, id: string): SrsCardRow | undefined {
    return this.db
      .select()
      .from(srsCards)
      .where(and(eq(srsCards.profileId, profileId), eq(srsCards.id, id)))
      .get()
  }

  updateSchedule(id: string, schedule: CardSchedule, now: number): void {
    this.db
      .update(srsCards)
      .set({ ...schedule, updatedAt: now })
      .where(eq(srsCards.id, id))
      .run()
  }

  insertReview(row: Omit<SrsReviewRow, 'id'>): void {
    this.db
      .insert(srsReviews)
      .values({ ...row, id: uuidv7(row.reviewedAt) })
      .run()
  }

  savedContentIdList(profileId: string): string[] {
    return this.db
      .select({ contentId: savedWords.contentId })
      .from(savedWords)
      .where(eq(savedWords.profileId, profileId))
      .all()
      .map((r) => r.contentId)
      .filter((id): id is string => !!id)
  }

  /** Thẻ (kể cả đã xoá mềm) của một từ, để lưu lại từ cũ thì dùng lại thẻ */
  findCardByContent(
    profileId: string,
    contentId: string,
    direction: SrsCardRow['direction']
  ): SrsCardRow | undefined {
    return this.db
      .select()
      .from(srsCards)
      .where(
        and(
          eq(srsCards.profileId, profileId),
          eq(srsCards.contentId, contentId),
          eq(srsCards.direction, direction)
        )
      )
      .get()
  }

  reviveCard(id: string, now: number): void {
    this.db
      .update(srsCards)
      .set({ deletedAt: null, suspended: false, due: now, updatedAt: now })
      .where(eq(srsCards.id, id))
      .run()
  }

  /** Thẻ đang học, mới lưu trước */
  listCards(profileId: string, limit: number): SrsCardRow[] {
    return this.db
      .select()
      .from(srsCards)
      .where(and(eq(srsCards.profileId, profileId), isNull(srsCards.deletedAt)))
      .orderBy(desc(srsCards.createdAt))
      .limit(limit)
      .all()
  }

  /** Xoá từ khỏi sổ: bỏ saved_words, xoá mềm thẻ (giữ nhật ký ôn để thống kê) */
  removeWord(profileId: string, contentId: string, now: number): boolean {
    const card = this.db
      .update(srsCards)
      .set({ deletedAt: now, suspended: true, updatedAt: now })
      .where(
        and(
          eq(srsCards.profileId, profileId),
          eq(srsCards.contentId, contentId),
          isNull(srsCards.deletedAt)
        )
      )
      .run()
    const saved = this.db
      .delete(savedWords)
      .where(and(eq(savedWords.profileId, profileId), eq(savedWords.contentId, contentId)))
      .run()
    return card.changes + saved.changes > 0
  }

  countCards(profileId: string): number {
    const row = this.db
      .select({ n: sql<number>`count(*)` })
      .from(srsCards)
      .where(and(eq(srsCards.profileId, profileId), isNull(srsCards.deletedAt)))
      .get()
    return Number(row?.n ?? 0)
  }

  /** Số thẻ đã vào giai đoạn ôn dài hạn (state = 2) */
  countLearned(profileId: string): number {
    const row = this.db
      .select({ n: sql<number>`count(*)` })
      .from(srsCards)
      .where(
        and(eq(srsCards.profileId, profileId), isNull(srsCards.deletedAt), eq(srsCards.state, 2))
      )
      .get()
    return Number(row?.n ?? 0)
  }

  /** Các ngày (YYYY-MM-DD theo múi giờ cục bộ) có ôn từ, mới nhất trước */
  reviewDays(profileId: string, sinceMs: number, tzOffsetSeconds: number): string[] {
    const day = sql<string>`strftime('%Y-%m-%d', ${srsReviews.reviewedAt} / 1000 + ${tzOffsetSeconds}, 'unixepoch')`
    const rows = this.db
      .select({ day })
      .from(srsReviews)
      .where(and(eq(srsReviews.profileId, profileId), sql`${srsReviews.reviewedAt} >= ${sinceMs}`))
      .groupBy(day)
      .orderBy(desc(day))
      .all()
    return rows.map((r) => r.day)
  }

  countReviewsSince(profileId: string, sinceMs: number): number {
    const row = this.db
      .select({ n: sql<number>`count(*)` })
      .from(srsReviews)
      .where(and(eq(srsReviews.profileId, profileId), sql`${srsReviews.reviewedAt} >= ${sinceMs}`))
      .get()
    return Number(row?.n ?? 0)
  }
}
