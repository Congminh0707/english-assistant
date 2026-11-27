import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@renderer/shared/styles/fonts.css'
import '@renderer/shared/styles/tokens.css'
import '@renderer/shared/styles/ui.css'
import { createAppI18n } from '@renderer/shared/i18n'
import { initTheme } from '@renderer/shared/theme'
import { loadCharacterPacks } from '@renderer/shared/characterPacks'
import App from './App.vue'

// Gói nhân vật đã cài phải đăng ký trước khi mount (lỗi không chặn app)
const i18n = createAppI18n()
void loadCharacterPacks(i18n).then(() => {
  createApp(App).use(createPinia()).use(i18n).mount('#app')
  initTheme()
})
