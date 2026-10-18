import { createI18n, type I18n } from 'vue-i18n'
import { messages, type Language, type Messages } from '@shared/i18n'

export type AppI18n = I18n<
  Record<Language, Messages>,
  Record<string, never>,
  Record<string, never>,
  string,
  false
>

/** vue-i18n dùng chung bộ chuỗi với main (src/shared/i18n/*.json) */
export function createAppI18n(locale: Language = 'vi'): AppI18n {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'vi',
    messages
  })
}
