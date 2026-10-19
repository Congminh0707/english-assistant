import { ref } from 'vue'
import { createI18n, type I18n } from 'vue-i18n'
import { messages, type Language, type Messages } from '@shared/i18n'

/** Chuỗi giao diện viết "%PET%" ở chỗ cần tên thú cưng; thay bằng tên người dùng đặt */
export const PET_TOKEN = '%PET%'
/** Tên thú cưng hiện tại (cập nhật từ pet store; màn hình chào cập nhật khi người dùng gõ tên) */
export const petName = ref('Bi')
export const withPetName = (text: string): string =>
  text.includes(PET_TOKEN) ? text.replaceAll(PET_TOKEN, petName.value) : text

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
    postTranslation: (text) => (typeof text === 'string' ? withPetName(text) : text),
    messages
  })
}
