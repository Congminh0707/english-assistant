import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@renderer/shared/styles/tokens.css'
import '@renderer/shared/styles/ui.css'
import { createAppI18n } from '@renderer/shared/i18n'
import App from './App.vue'

createApp(App).use(createPinia()).use(createAppI18n()).mount('#app')
