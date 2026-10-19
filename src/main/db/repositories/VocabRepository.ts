import { and, eq, inArray, sql } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { savedWords, srsCards } from '../schema'

export type SavedWordRow = typeof savedWords.$inferSelect
export type SrsCardRow = typeof srsCards.$inferSelect
export type NewSrsCard = Omit<SrsCardRow, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>

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

  countCards(profileId: string): number {
    const row = this.db
      .select({ n: sql<number>`count(*)` })
      .from(srsCards)
      .where(eq(srsCards.profileId, profileId))
      .get()
    return Number(row?.n ?? 0)
  }
}
