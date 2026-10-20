import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

// Unit test chạy trong Node (better-sqlite3 v13 dùng N-API nên cùng binary chạy được cả Node lẫn Electron)
export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve('src/shared'),
      '@renderer': resolve('src/renderer')
    }
  },
  test: {
    environment: 'node',
    // Máy CI (windows-latest) chậm hơn máy dev nhiều lần ở các test ghi file/giải nén gói nội dung
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '.claude/**']
  }
})
