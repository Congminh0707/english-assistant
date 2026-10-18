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
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '.claude/**']
  }
})
