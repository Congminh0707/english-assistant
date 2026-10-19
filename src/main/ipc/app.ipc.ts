import type { Container } from '../container'
import { handle } from './handle'

/** Các kênh nghiệp vụ: thú cưng, túi đồ, cài đặt (~ Controllers) */
export function registerAppIpc(c: Container): void {
  handle('pet:get', () => c.pet.get())
  handle('pet:pat', () => c.pet.pat())
  handle('pet:feed', ({ itemId }) => c.pet.feed(itemId))
  handle('inventory:list', () => c.inventory.list())
  handle('settings:get-all', () => c.settings.all())
  handle('settings:set', ({ key, value }) => c.settings.set(key, value))
  handle('dictionary:lookup', ({ text }) =>
    c.dictionary.lookup(text, (ids) => c.vocab.savedContentIds(ids))
  )
  handle('vocab:save', (input) => c.vocab.save(input))
}
