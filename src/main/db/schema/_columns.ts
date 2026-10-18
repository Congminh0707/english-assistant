import { integer } from 'drizzle-orm/sqlite-core'

// Cột dùng chung (~ $table->timestamps(); $table->softDeletes(); trong Laravel). Thời gian lưu Unix ms (UTC).
// Giá trị do repository truyền vào (lấy từ Clock) để test được — không dùng mặc định theo giờ hệ thống.
export const timestamps = {
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at')
}
