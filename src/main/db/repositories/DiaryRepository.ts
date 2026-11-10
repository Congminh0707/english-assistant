import { and, desc, eq } from 'drizzle-orm'
import { uuidv7 } from '@shared/ids'
import type { UserDb } from '../client'
import { diaryEntries } from '../schema'

export type DiaryEntryRow = typeof diaryEntries.$inferSelect

/** Nhật ký tiếng Anh: mỗi hồ sơ tối đa một dòng mỗi ngày (unique profile_id + day) */
export class DiaryRepository {
  constructor(private readonly db: UserDb) {}

  get(profileId: string, day: string): DiaryEntryRow | null {
    return (
      this.db
        .select()
        .from(diaryEntries)
        .where(and(eq(diaryEntries.profileId, profileId), eq(diaryEntries.day, day)))
        .get() ?? null
    )
  }

  /** Ghi chữ của ngày (tạo mới hoặc cập nhật); đổi chữ thì xoá bản AI sửa cũ */
  upsertText(profileId: string, day: string, text: string, now: number): DiaryEntryRow {
    const existing = this.get(profileId, day)
    if (!existing) {
      const row: DiaryEntryRow = {
        id: uuidv7(now),
        profileId,
        day,
        text,
        corrected: null,
        changesJson: null,
        createdAt: now,
        updatedAt: now
      }
      this.db.insert(diaryEntries).values(row).run()
      return row
    }
    const changed = existing.text !== text
    const patch = changed
      ? { text, corrected: null, changesJson: null, updatedAt: now }
      : { updatedAt: now }
    this.db.update(diaryEntries).set(patch).where(eq(diaryEntries.id, existing.id)).run()
    return { ...existing, ...patch }
  }

  setCorrection(id: string, corrected: string, changesJson: string, now: number): void {
    this.db
      .update(diaryEntries)
      .set({ corrected, changesJson, updatedAt: now })
      .where(eq(diaryEntries.id, id))
      .run()
  }

  /** Các ngày gần nhất trước */
  recent(profileId: string, limit: number): DiaryEntryRow[] {
    return this.db
      .select()
      .from(diaryEntries)
      .where(eq(diaryEntries.profileId, profileId))
      .orderBy(desc(diaryEntries.day))
      .limit(limit)
      .all()
  }
}
