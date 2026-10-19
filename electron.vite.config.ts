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
    define: {
      // Cờ build của vue-i18n (bản esm-bundler): dùng Composition API, tắt legacy & devtools production
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false
    },
    build: {
      rollupOptions: {
        input: {
          mascot: resolve('src/renderer/mascot/index.html'),
          popup: resolve('src/renderer/popup/index.html'),
          study: resolve('src/renderer/study/index.html')
        }
      }
    }
  }
})
