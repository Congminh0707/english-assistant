// Schema user.db — docs/10-data-model.md#3. Sửa schema xong chạy `pnpm db:generate` để sinh migration.
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
  primaryKey
} from 'drizzle-orm/sqlite-core'
import { timestamps } from './_columns'

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(), // UUID v7
  name: text('name').notNull(),
  track: text('track', {
    enum: ['preschool', 'primary', 'teen', 'general', 'toeic', 'ielts']
  }).notNull(),
  isChild: integer('is_child', { mode: 'boolean' }).notNull().default(false),
  ...timestamps
})

export const petStates = sqliteTable(
  'pet_states',
  {
    id: text('id').primaryKey(), // UUID v7
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id),
    characterId: text('character_id').notNull(),
    name: text('name').notNull(),
    // level/xp/coins là bản tổng hợp từ sổ cái xp_events (luôn tính lại được)
    level: integer('level').notNull().default(1),
    totalXp: integer('total_xp').notNull().default(0),
    coins: integer('coins').notNull().default(0),
    hunger: real('hunger').notNull(),
    mood: real('mood').notNull(),
    energy: real('energy').notNull(),
    affection: integer('affection').notNull().default(0),
    /** Phụ kiện đang đeo: mảng JSON id ('acc:bow'...) */
    equipped: text('equipped').notNull().default('[]'),
    lastTickAt: integer('last_tick_at').notNull(),
    ...timestamps
  },
  (t) => [uniqueIndex('pet_states_profile_unique').on(t.profileId)]
)

/** Sổ cái XP & xu (~ bảng transactions): tổng luôn tính lại được, tránh cộng sai */
export const xpEvents = sqliteTable(
  'xp_events',
  {
    id: text('id').primaryKey(), // UUID v7
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id),
    amount: integer('amount').notNull(),
    coins: integer('coins').notNull().default(0),
    reason: text('reason').notNull(),
    refId: text('ref_id'),
    multiplier: real('multiplier').notNull().default(1),
    createdAt: integer('created_at').notNull()
  },
  (t) => [index('xp_events_profile_created').on(t.profileId, t.createdAt)]
)

export const inventoryItems = sqliteTable(
  'inventory_items',
  {
    id: text('id').primaryKey(), // UUID v7
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id),
    itemId: text('item_id').notNull(),
    quantity: integer('quantity').notNull().default(0),
    ...timestamps
  },
  (t) => [uniqueIndex('inventory_profile_item_unique').on(t.profileId, t.itemId)]
)

/**
 * Cài đặt dạng key–value. scope = 'global' (toàn máy) hoặc id profile.
 * (Không dùng profile_id NULL làm khoá chính vì SQLite coi các NULL là khác nhau.)
 */
export const settings = sqliteTable(
  'settings',
  {
    scope: text('scope').notNull(),
    key: text('key').notNull(),
    value: text('value', { mode: 'json' }).notNull(),
    updatedAt: integer('updated_at').notNull()
  },
  (t) => [primaryKey({ columns: [t.scope, t.key] })]
)

/** Content pack đã cài (docs/09-content-pipeline.md#8). Nội dung nằm ở content.db riêng, chỉ đọc. */
export const installedPacks = sqliteTable('installed_packs', {
  id: text('id').primaryKey(), // 'core-dictionary'
  version: text('version').notNull(),
  path: text('path').notNull(), // đường dẫn content.db đã giải nén
  schemaVersion: integer('schema_version').notNull(),
  sha256: text('sha256').notNull(),
  installedAt: integer('installed_at').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true)
})

/** Từ người dùng đã tra/lưu (kể cả chưa thành thẻ SRS) */
export const savedWords = sqliteTable(
  'saved_words',
  {
    id: text('id').primaryKey(),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id),
    /** 'word:en:go' — null nếu từ không có trong từ điển */
    contentId: text('content_id'),
    text: text('text').notNull(),
    /** Câu ngữ cảnh lúc copy (nếu có) */
    context: text('context'),
    lookupCount: integer('lookup_count').notNull().default(1),
    lastLookupAt: integer('last_lookup_at').notNull(),
    ...timestamps
  },
  (t) => [uniqueIndex('saved_words_profile_text_unique').on(t.profileId, t.text)]
)

/** Thẻ ôn tập — các cột theo thuật toán FSRS (ts-fsrs), docs/10-data-model.md */
export const srsCards = sqliteTable(
  'srs_cards',
  {
    id: text('id').primaryKey(),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id),
    contentId: text('content_id').notNull(),
    direction: text('direction', {
      enum: ['en_vi', 'vi_en', 'audio_en', 'cloze', 'audio_picture']
    }).notNull(),
    contextSentence: text('context_sentence'),
    due: integer('due').notNull(),
    stability: real('stability').notNull().default(0),
    difficulty: real('difficulty').notNull().default(0),
    elapsedDays: integer('elapsed_days').notNull().default(0),
    scheduledDays: integer('scheduled_days').notNull().default(0),
    learningSteps: integer('learning_steps').notNull().default(0),
    reps: integer('reps').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    state: integer('state').notNull().default(0), // 0 New, 1 Learning, 2 Review, 3 Relearning
    lastReview: integer('last_review'),
    suspended: integer('suspended', { mode: 'boolean' }).notNull().default(false),
    ...timestamps
  },
  (t) => [
    index('srs_cards_profile_due').on(t.profileId, t.due),
    uniqueIndex('srs_cards_profile_content_direction').on(t.profileId, t.contentId, t.direction)
  ]
)

/** Nhật ký mỗi lần ôn thẻ — để thống kê và sau này tối ưu tham số FSRS theo người dùng */
export const srsReviews = sqliteTable(
  'srs_reviews',
  {
    id: text('id').primaryKey(),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id),
    cardId: text('card_id')
      .notNull()
      .references(() => srsCards.id),
    rating: integer('rating').notNull(), // 1 Quên, 2 Khó, 3 Được, 4 Dễ
    stateBefore: integer('state_before').notNull(),
    dueBefore: integer('due_before').notNull(),
    elapsedMs: integer('elapsed_ms'),
    source: text('source', { enum: ['study', 'mascot'] }).notNull(),
    reviewedAt: integer('reviewed_at').notNull()
  },
  (t) => [index('srs_reviews_profile_time').on(t.profileId, t.reviewedAt)]
)

/** Tiến độ bài học nền tảng (chữ cái, mẫu câu, các thì...) của từng hồ sơ */
export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    id: text('id').primaryKey(), // UUID v7
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id),
    /** 'tenses.present-simple' — id bài trong content/curated/lessons */
    lessonId: text('lesson_id').notNull(),
    /** Điểm cao nhất (0–100) */
    best: integer('best').notNull(),
    attempts: integer('attempts').notNull().default(1),
    /** Lần đầu đạt ngưỡng hoàn thành (null = chưa đạt) */
    completedAt: integer('completed_at'),
    ...timestamps
  },
  (t) => [uniqueIndex('lesson_progress_profile_lesson').on(t.profileId, t.lessonId)]
)
