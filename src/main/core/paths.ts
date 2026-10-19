import { app } from 'electron'
import { join } from 'path'

/** Đường dẫn dùng trong app — luôn lấy qua đây, không viết cứng (docs/15-packaging-and-release.md#2) */
export const paths = {
  userDb: (): string => join(app.getPath('userData'), 'user.db'),
  /** Content pack đã giải nén */
  packs: (): string => join(app.getPath('userData'), 'packs'),
  /** Pack đi kèm app: dev lấy content/packs (bản build của pipeline), bản cài lấy resources/packs */
  bundledPacks: (): string =>
    app.isPackaged ? join(process.resourcesPath, 'packs') : join(app.getAppPath(), 'content/packs'),
  /** File SQL migration: dev đọc từ source, bản đóng gói đọc từ resources/migrations (extraResources) */
  migrations: (): string =>
    app.isPackaged
      ? join(process.resourcesPath, 'migrations')
      : join(app.getAppPath(), 'src/main/db/migrations')
}
