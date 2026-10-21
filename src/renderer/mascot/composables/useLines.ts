import { useI18n } from 'vue-i18n'
import { normalizeCharacterId } from '@shared/characters'
import { withPetName } from '@renderer/shared/i18n'
import { usePetStore } from '@renderer/shared/stores/pet'

/** Xác suất dùng câu thoại riêng của nhân vật (mascot.chars.<nhân vật>.<topic>) khi có; còn lại dùng câu chung */
const CHARACTER_LINE_CHANCE = 0.65

/**
 * Chọn ngẫu nhiên một câu thoại theo chủ đề: ưu tiên câu riêng của nhân vật đang chọn (mascot.chars.<id>.<topic>),
 * không có thì dùng câu chung (mascot.lines.<topic>); tránh lặp lại câu vừa nói.
 */
export function useLines(): {
  line: (topic: string) => string
  greetingTopic: (date?: Date) => string
} {
  const { tm, rt } = useI18n()
  const petStore = usePetStore()
  const last = new Map<string, number>()

  const listOf = (path: string): unknown[] => {
    const list = tm(path) as unknown
    return Array.isArray(list) ? list : []
  }

  function line(topic: string): string {
    const character = normalizeCharacterId(petStore.pet?.characterId ?? '')
    const own = listOf(`mascot.chars.${character}.${topic}`)
    const useOwn = own.length > 0 && Math.random() < CHARACTER_LINE_CHANCE
    const list = useOwn ? own : listOf(`mascot.lines.${topic}`)
    if (list.length === 0) return ''
    const key = `${useOwn ? character : 'common'}:${topic}`
    let index = Math.floor(Math.random() * list.length)
    if (list.length > 1 && index === last.get(key)) index = (index + 1) % list.length
    last.set(key, index)
    return withPetName(rt(list[index] as Parameters<typeof rt>[0]))
  }

  function greetingTopic(date = new Date()): string {
    const h = date.getHours()
    if (h >= 5 && h < 11) return 'greetingMorning'
    if (h >= 11 && h < 18) return 'greetingAfternoon'
    if (h >= 18 && h < 23) return 'greetingEvening'
    return 'greetingNight'
  }

  return { line, greetingTopic }
}
