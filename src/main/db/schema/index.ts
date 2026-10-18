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
