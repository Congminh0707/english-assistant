import { useI18n } from 'vue-i18n'
import { withPetName } from '@renderer/shared/i18n'

/** Chọn ngẫu nhiên một câu thoại theo chủ đề (mascot.lines.<topic> trong i18n), tránh lặp lại câu vừa nói */
export function useLines(): {
  line: (topic: string) => string
  greetingTopic: (date?: Date) => string
} {
  const { tm, rt } = useI18n()
  const last = new Map<string, number>()

  function line(topic: string): string {
    const list = tm(`mascot.lines.${topic}`) as unknown
    if (!Array.isArray(list) || list.length === 0) return ''
    let index = Math.floor(Math.random() * list.length)
    if (list.length > 1 && index === last.get(topic)) index = (index + 1) % list.length
    last.set(topic, index)
    return withPetName(rt(list[index]))
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
