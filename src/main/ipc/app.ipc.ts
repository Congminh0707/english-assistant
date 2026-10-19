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
    c.dictionary.lookup(text, (ids) => c.vocab.savedContentIds(ids), {
      childSafe: c.profiles.active().isChild
    })
  )
  handle('vocab:save', (input) => c.vocab.save(input))
  handle('quiz:answer', ({ quizId, choiceIndex, elapsedMs }) =>
    c.micro.answer(quizId, choiceIndex, elapsedMs)
  )
  handle('study:overview', () => c.study.overview())
  handle('study:next', () => c.study.next())
  handle('study:rate', ({ cardId, rating, elapsedMs }) => c.study.rate(cardId, rating, elapsedMs))
  handle('vocab:list', () => c.study.words())
  handle('vocab:remove', ({ contentId }) => c.study.removeWord(contentId))
}
