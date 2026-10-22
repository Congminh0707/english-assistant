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
    // (bộ test 66 s ở máy dev có lần chạy 485 s trên CI, hook cài pack quá 30 s) → nới thêm khi chạy CI
    testTimeout: process.env.CI ? 120_000 : 30_000,
    hookTimeout: process.env.CI ? 120_000 : 30_000,
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '.claude/**']
  }
})
