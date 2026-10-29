import { totalXpForLevel } from '@shared/pet'
import type { LessonKind } from '@shared/schemas/lesson'
import type { Container } from '../container'
import type { LessonService } from '../services/LessonService'
import type { TranslationService } from '../services/TranslationService'
import type { TtsService } from '../services/TtsService'
import type { AudioPackService } from '../services/AudioPackService'
import type { SttService } from '../services/SttService'
import type { PronunciationService } from '../services/PronunciationService'
import type { UpdateManager } from '../system/UpdateManager'
import type { SpritePackService } from '../services/SpritePackService'
import { handle } from './handle'

/** Các kênh nghiệp vụ: thú cưng, túi đồ, cài đặt (~ Controllers) */
export function registerAppIpc(
  c: Container,
  translation: TranslationService,
  tts: TtsService,
  audioPack: AudioPackService,
  spritePack: SpritePackService,
  stt: SttService,
  pronunciation: PronunciationService,
  updates: UpdateManager,
  devTools = false
): void {
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
  handle('dictionary:levels', ({ words }) => {
    const options = { childSafe: c.profiles.active().isChild }
    const out: Record<string, string> = {}
    for (const word of new Set(words.map((w) => w.toLowerCase()))) {
      const entry = c.dictionary.lookup(word, undefined, options).entries[0]
      if (entry && entry.via !== 'search') out[word] = entry.level
    }
    return out
  })
  handle('vocab:save', (input) => c.vocab.save(input))
  handle('quiz:answer', ({ quizId, choiceIndex, elapsedMs }) =>
    c.micro.answer(quizId, choiceIndex, elapsedMs)
  )
  handle('study:overview', () => c.study.overview())
  handle('study:next', () => c.study.next())
  handle('study:rate', ({ cardId, rating, elapsedMs }) => c.study.rate(cardId, rating, elapsedMs))
  handle('study:tick', ({ seconds }) => c.progress.tickTime(seconds))
  handle('study:undo', () => c.study.undo())
  handle('study:backfill', () => ({ created: c.study.backfill() }))
  handle('study:missions', () => c.missions.state())
  handle('profile:list', () => c.profiles.listInfo())
  handle('profile:setup', (input) => c.profiles.setup(input))
  handle('profile:create', (input) => c.profiles.createFromInput(input))
  // Chỉ khi chạy dev (index.ts truyền !app.isPackaged): bản phát hành không có handler này
  if (devTools) {
    handle(
      'dev:grant-coins',
      ({ coins }) => c.xp.grant({ amount: 0, coins, reason: 'dev.grant' }).state
    )
    handle('dev:level-up', ({ levels }) => {
      const pet = c.pet.get()
      const need = totalXpForLevel(pet.level + levels) - pet.totalXp
      return c.xp.grant({ amount: need, reason: 'dev.grant' }).state
    })
  }
  handle('profile:update', (input) => {
    const info = c.profiles.update(input)
    // Đổi tên/track của hồ sơ đang dùng → mascot & cửa sổ Học tập nạp lại tên thú cưng
    if (info.active) c.bus.emit('pet.updated', c.pet.get())
    return info
  })
  handle('profile:switch', ({ id }) => {
    const info = c.profiles.info(c.profiles.switchTo(id))
    c.bus.emit('pet.updated', c.pet.get()) // mascot & cửa sổ Học tập nạp lại thú cưng của hồ sơ mới
    return info
  })
  handle('placement:start', () => ({ question: c.placement.start() }))
  handle('placement:checkpoint-start', () => ({ question: c.placement.startCheckpoint() }))
  handle('placement:answer', ({ sessionId, questionId, choiceIndex }) =>
    c.placement.answer(sessionId, questionId, choiceIndex)
  )
  handle('translate:status', ({ direction }) => translation.status(direction))
  handle('translate:install', ({ direction }) => translation.install(direction))
  handle('translate:cancel', ({ direction }) => translation.cancelInstall(direction))
  handle('translate:remove', ({ direction }) => translation.remove(direction))
  handle('translate:text', ({ text }) => translation.translate(text))
  handle('translate:online-status', () => translation.onlineStatus())
  handle('translate:set-key', ({ key }) => translation.setOnlineKey(key))
  handle('translate:clear-key', () => translation.clearOnlineKey())
  handle('practice:start', ({ mode }) => ({ exercise: c.practice.start(mode) }))
  handle('practice:answer', ({ sessionId, exerciseId, answer }) =>
    c.practice.answer(sessionId, exerciseId, answer)
  )
  handle('shop:state', () => c.shop.state())
  handle('shop:buy', ({ itemId }) => c.shop.buy(itemId))
  handle('shop:equip', ({ itemId, equipped }) => c.shop.equip(itemId, equipped))
  handle('shop:select-character', ({ characterId }) => c.shop.selectCharacter(characterId))
  handle('study:stats', () => c.stats.stats())
  handle('phrasebook:list', () => c.phrasebook.list())
  handle('update:status', () => updates.current)
  handle('update:check', () => updates.check())
  handle('update:download', () => updates.download())
  handle('update:install', () => updates.install())
  handle('course:list', () => ({ courses: c.courses.list() }))
  handle('course:get', ({ id }) => c.courses.get(id))
  handle('kids:home', () => c.kids.home())
  handle('kids:units', () => c.kids.units())
  handle('kids:next', () => c.kids.nextCard())
  handle('kids:rate', ({ cardId, tries, elapsedMs }) => c.kids.rateCard(cardId, tries, elapsedMs))
  handle('kids:complete', ({ activityId, correct, total }) =>
    c.kids.completeActivity(activityId, correct, total)
  )
  handle('kids:stickers', () => c.kids.stickers())
  handle('kids:reward', () => ({ foodId: c.kids.reward() }))
  handle('kids:tick', ({ seconds }) => c.kids.tick(seconds))
  handle('parent:status', () => ({ pinSet: c.parent.pinSet() }))
  handle('parent:set-pin', ({ pin, currentPin }) => {
    c.parent.setPin(pin, currentPin)
    return { pinSet: true }
  })
  handle('parent:verify', ({ pin }) => c.parent.verify(pin))
  handle('parent:extend', ({ pin, minutes }) => {
    c.parent.extend(pin, minutes)
    return c.kids.usageStatus()
  })
  handle('parent:forgot', () => c.parent.forgotChallenge())
  handle('parent:reset', ({ id, answer }) => c.parent.resetPin(id, answer))
  handle('parent:report', () => c.parent.report())
  // Bài học nền tảng, điểm ngữ pháp và bài đọc dùng chung kênh, phân biệt bằng `kind`
  const lessonService = (kind: LessonKind): LessonService =>
    kind === 'grammar'
      ? c.grammar
      : kind === 'reading'
        ? c.readings
        : kind === 'listening'
          ? c.listening
          : c.lessons
  handle('lesson:catalog', ({ kind }) => lessonService(kind).catalog())
  handle('lesson:get', ({ kind, id }) => lessonService(kind).get(id))
  handle('lesson:complete', ({ kind, lessonId, correct, total, byType }) =>
    lessonService(kind).complete(lessonId, correct, total, byType)
  )
  handle('tts:status', () => tts.status())
  handle('tts:install', () => tts.install())
  handle('tts:cancel', () => tts.cancelInstall())
  handle('tts:speak', (input) => tts.speak(input))
  handle('tts:prefetch', ({ texts, accent, speed }) => tts.prefetch(texts, accent, speed))
  handle('audio:status', () => audioPack.status())
  handle('audio:install', () => audioPack.install())
  handle('audio:cancel', () => audioPack.cancelInstall())
  handle('audio:remove', () => audioPack.remove())
  handle('audio:clip', (input) => audioPack.clip(input))
  handle('sprites:status', () => spritePack.status())
  handle('sprites:install', () => spritePack.install())
  handle('sprites:cancel', () => spritePack.cancelInstall())
  handle('sprites:remove', () => spritePack.remove())
  handle('sprites:asset', (input) => spritePack.asset(input))
  handle('sprites:meta', (input) => spritePack.meta(input))
  handle('stt:status', () => stt.status())
  handle('stt:install', () => stt.install())
  handle('stt:cancel', () => stt.cancelInstall())
  handle('stt:transcribe', ({ audio }) => stt.transcribe(audio))
  handle('pron:status', () => pronunciation.status())
  handle('pron:install', () => pronunciation.install())
  handle('pron:cancel', () => pronunciation.cancel())
  handle('pron:evaluate', ({ audio, text }) => pronunciation.evaluate(audio, text))
  handle('vocab:list', () => c.study.words())
  handle('vocab:remove', ({ contentId }) => c.study.removeWord(contentId))
  handle('vocab:suspend', ({ contentId, suspended }) => c.study.setSuspended(contentId, suspended))
  handle('vocab:reset', ({ contentId }) => c.study.resetWord(contentId))
  handle('vocab:save-many', ({ items }) => c.study.saveMany(items))
  handle('vocab:save-phrase', ({ contentId }) => c.study.savePhrase(contentId))
}
