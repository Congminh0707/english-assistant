import { and, asc, desc, eq, inArray, isNull, lte, ne, sql, type SQL } from 'drizzle-orm'
import type { CardDirection } from '@shared/cards'
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

/** Lọc thẻ đến hạn: theo hướng thẻ và theo "thẻ mới" (en_vi chưa học) */
export interface DueOptions {
  directions?: CardDirection[]
  fresh?: 'only' | 'exclude'
}

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

  private dueWhere(profileId: string, now: number, opts: DueOptions): SQL {
    const conditions = [
      eq(srsCards.profileId, profileId),
      eq(srsCards.suspended, false),
      isNull(srsCards.deletedAt),
      lte(srsCards.due, now)
    ]
    if (opts.directions?.length) conditions.push(inArray(srsCards.direction, opts.directions))
    // "Thẻ mới" = thẻ nhận diện (en_vi) chưa học lần nào; thẻ phụ (Việt→Anh...) không tính vào hạn mức từ mới
    if (opts.fresh === 'only') {
      conditions.push(sql`${srsCards.direction} = 'en_vi' AND ${srsCards.state} = 0`)
    }
    if (opts.fresh === 'exclude') {
      conditions.push(sql`NOT (${srsCards.direction} = 'en_vi' AND ${srsCards.state} = 0)`)
    }
    return and(...conditions) as SQL
  }

  /** Thẻ đến hạn ôn (due ≤ now), sớm nhất trước */
  dueCards(profileId: string, now: number, limit: number, opts: DueOptions = {}): SrsCardRow[] {
    return this.db
      .select()
      .from(srsCards)
      .where(this.dueWhere(profileId, now, opts))
      .orderBy(asc(srsCards.due))
      .limit(limit)
      .all()
  }

  countDue(profileId: string, now: number, opts: DueOptions = {}): number {
    const row = this.db
      .select({ n: sql<number>`count(*)` })
      .from(srsCards)
      .where(this.dueWhere(profileId, now, opts))
      .get()
    return Number(row?.n ?? 0)
  }

  /** Số từ mới (thẻ en_vi) đã được ôn lần đầu từ một thời điểm — để tính hạn mức từ mới mỗi ngày */
  countNewIntroducedSince(profileId: string, sinceMs: number): number {
    const row = this.db
      .select({ n: sql<number>`count(distinct ${srsReviews.cardId})` })
      .from(srsReviews)
      .innerJoin(srsCards, eq(srsCards.id, srsReviews.cardId))
      .where(
        and(
          eq(srsReviews.profileId, profileId),
          eq(srsReviews.stateBefore, 0),
          eq(srsCards.direction, 'en_vi'),
          sql`${srsReviews.reviewedAt} >= ${sinceMs}`
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

  insertReview(row: Omit<SrsReviewRow, 'id'>): string {
    const id = uuidv7(row.reviewedAt)
    this.db
      .insert(srsReviews)
      .values({ ...row, id })
      .run()
    return id
  }

  /** Xoá một lượt ôn (hoàn tác lần chấm vừa rồi) */
  deleteReview(id: string): void {
    this.db.delete(srsReviews).where(eq(srsReviews.id, id)).run()
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

  /** Thẻ gốc (en_vi) của mỗi từ trong sổ — kể cả đang tạm dừng — mới lưu trước */
  listCards(profileId: string, limit: number): SrsCardRow[] {
    return this.db
      .select()
      .from(srsCards)
      .where(
        and(
          eq(srsCards.profileId, profileId),
          eq(srsCards.direction, 'en_vi'),
          isNull(srsCards.deletedAt)
        )
      )
      .orderBy(desc(srsCards.createdAt))
      .limit(limit)
      .all()
  }

  /** Mọi content id đã có thẻ ở một hướng (kể cả thẻ đã xoá mềm) */
  contentIdsByDirection(profileId: string, direction: CardDirection): string[] {
    return this.db
      .select({ contentId: srsCards.contentId })
      .from(srsCards)
      .where(and(eq(srsCards.profileId, profileId), eq(srsCards.direction, direction)))
      .all()
      .map((r) => r.contentId)
  }

  /** Số thẻ ở một hướng được tạo từ một thời điểm (vd số hình mới đưa vào học hôm nay) */
  countCardsCreatedSince(profileId: string, direction: CardDirection, sinceMs: number): number {
    const row = this.db
      .select({ n: sql<number>`count(*)` })
      .from(srsCards)
      .where(
        and(
          eq(srsCards.profileId, profileId),
          eq(srsCards.direction, direction),
          sql`${srsCards.createdAt} >= ${sinceMs}`
        )
      )
      .get()
    return Number(row?.n ?? 0)
  }

  /** Các thẻ hình (audio_picture) đã từng được trả lời tốt (Được/Dễ) — mỗi cái là một sticker trong album */
  earnedPictureContentIds(profileId: string): string[] {
    return this.db
      .selectDistinct({ contentId: srsCards.contentId })
      .from(srsReviews)
      .innerJoin(srsCards, eq(srsCards.id, srsReviews.cardId))
      .where(
        and(
          eq(srsReviews.profileId, profileId),
          eq(srsCards.direction, 'audio_picture'),
          sql`${srsReviews.rating} >= 3`
        )
      )
      .all()
      .map((r) => r.contentId)
  }

  /** Các thẻ ở một hướng bị chấm "Quên" nhiều nhất (số lượt ôn có rating = 1) */
  hardestByDirection(
    profileId: string,
    direction: CardDirection,
    limit: number
  ): Array<{ contentId: string; lapses: number }> {
    return this.db
      .select({ contentId: srsCards.contentId, lapses: sql<number>`count(*)` })
      .from(srsReviews)
      .innerJoin(srsCards, eq(srsCards.id, srsReviews.cardId))
      .where(
        and(
          eq(srsReviews.profileId, profileId),
          eq(srsCards.direction, direction),
          eq(srsReviews.rating, 1)
        )
      )
      .groupBy(srsCards.contentId)
      .orderBy(desc(sql`count(*)`))
      .limit(limit)
      .all()
      .map((r) => ({ contentId: r.contentId, lapses: Number(r.lapses) }))
  }

  /** Số thẻ phụ (khác en_vi, chưa xoá) của mỗi từ */
  siblingCounts(profileId: string): Map<string, number> {
    const rows = this.db
      .select({ contentId: srsCards.contentId, n: sql<number>`count(*)` })
      .from(srsCards)
      .where(
        and(
          eq(srsCards.profileId, profileId),
          ne(srsCards.direction, 'en_vi'),
          isNull(srsCards.deletedAt)
        )
      )
      .groupBy(srsCards.contentId)
      .all()
    return new Map(rows.map((r) => [r.contentId, Number(r.n)]))
  }

  /** Tạm dừng / tiếp tục ôn mọi thẻ của một từ */
  setSuspended(profileId: string, contentId: string, suspended: boolean, now: number): boolean {
    const res = this.db
      .update(srsCards)
      .set({ suspended, updatedAt: now })
      .where(
        and(
          eq(srsCards.profileId, profileId),
          eq(srsCards.contentId, contentId),
          isNull(srsCards.deletedAt)
        )
      )
      .run()
    return res.changes > 0
  }

  /** Các thẻ gốc đã vào ôn dài hạn (state = 2) — để tạo thẻ phụ bù cho từ đã thuộc */
  learnedBaseCards(profileId: string): SrsCardRow[] {
    return this.db
      .select()
      .from(srsCards)
      .where(
        and(
          eq(srsCards.profileId, profileId),
          eq(srsCards.direction, 'en_vi'),
          eq(srsCards.state, 2),
          isNull(srsCards.deletedAt)
        )
      )
      .all()
  }

  /** Xoá mềm các thẻ phụ của một từ (đặt lại tiến độ của từ) */
  softDeleteSiblings(profileId: string, contentId: string, now: number): void {
    this.db
      .update(srsCards)
      .set({ deletedAt: now, suspended: true, updatedAt: now })
      .where(
        and(
          eq(srsCards.profileId, profileId),
          eq(srsCards.contentId, contentId),
          ne(srsCards.direction, 'en_vi'),
          isNull(srsCards.deletedAt)
        )
      )
      .run()
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

  /** Số lần ôn mỗi ngày cục bộ kể từ một thời điểm */
  reviewCountsByDay(
    profileId: string,
    sinceMs: number,
    tzOffsetSeconds: number
  ): Array<{ day: string; n: number }> {
    const day = sql<string>`strftime('%Y-%m-%d', ${srsReviews.reviewedAt} / 1000 + ${tzOffsetSeconds}, 'unixepoch')`
    return this.db
      .select({ day, n: sql<number>`count(*)` })
      .from(srsReviews)
      .where(and(eq(srsReviews.profileId, profileId), sql`${srsReviews.reviewedAt} >= ${sinceMs}`))
      .groupBy(day)
      .all()
      .map((r) => ({ day: r.day, n: Number(r.n) }))
  }

  /** Tổng số lần ôn và số lần nhớ được (chấm Khó/Được/Dễ, rating ≥ 2) */
  reviewTotals(profileId: string): { total: number; remembered: number } {
    const row = this.db
      .select({
        total: sql<number>`count(*)`,
        remembered: sql<number>`coalesce(sum(case when ${srsReviews.rating} >= 2 then 1 else 0 end), 0)`
      })
      .from(srsReviews)
      .where(eq(srsReviews.profileId, profileId))
      .get()
    return { total: Number(row?.total ?? 0), remembered: Number(row?.remembered ?? 0) }
  }

  /** Từ hay quên nhất: tổng số lần quên (lapses) của các thẻ cùng một từ, từ nhiều đến ít */
  hardestWords(
    profileId: string,
    limit: number
  ): Array<{ contentId: string; text: string; lapses: number; reps: number }> {
    return this.db
      .select({
        contentId: srsCards.contentId,
        text: sql<string>`min(${savedWords.text})`,
        lapses: sql<number>`sum(${srsCards.lapses})`,
        reps: sql<number>`sum(${srsCards.reps})`
      })
      .from(srsCards)
      .innerJoin(
        savedWords,
        and(
          eq(savedWords.profileId, srsCards.profileId),
          eq(savedWords.contentId, srsCards.contentId)
        )
      )
      .where(and(eq(srsCards.profileId, profileId), isNull(srsCards.deletedAt)))
      .groupBy(srsCards.contentId)
      .having(sql`sum(${srsCards.lapses}) > 0`)
      .orderBy(desc(sql`sum(${srsCards.lapses})`), asc(srsCards.contentId))
      .limit(limit)
      .all()
      .map((r) => ({ ...r, lapses: Number(r.lapses), reps: Number(r.reps) }))
  }

  /** Số thẻ đang học theo trạng thái FSRS (0 mới, 1 đang học, 2 ôn, 3 học lại) */
  cardStateCounts(profileId: string): Array<{ state: number; n: number }> {
    return this.db
      .select({ state: srsCards.state, n: sql<number>`count(*)` })
      .from(srsCards)
      .where(and(eq(srsCards.profileId, profileId), isNull(srsCards.deletedAt)))
      .groupBy(srsCards.state)
      .all()
      .map((r) => ({ state: r.state, n: Number(r.n) }))
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
