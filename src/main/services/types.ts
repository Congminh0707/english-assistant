/** Chạy hàm trong một transaction SQLite (đồng bộ). Lỗi ném ra → rollback. */
export type Transaction = <T>(fn: () => T) => T
