import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

const sharedAlias = { '@shared': resolve('src/shared') }

export default defineConfig({
  main: {
    resolve: { alias: sharedAlias }
  },
  preload: {
    resolve: { alias: sharedAlias }
  },
  renderer: {
    // Mỗi cửa sổ là một trang HTML riêng (multi-page), xem docs/03-architecture.md
    root: resolve('src/renderer'),
    resolve: {
      alias: {
        ...sharedAlias,
        '@renderer': resolve('src/renderer')
      }
    },
    plugins: [vue()],
    build: {
      rollupOptions: {
        input: {
          mascot: resolve('src/renderer/mascot/index.html'),
          popup: resolve('src/renderer/popup/index.html')
        }
      }
    }
  }
})
