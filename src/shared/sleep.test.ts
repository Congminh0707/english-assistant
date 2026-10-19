import { describe, expect, it } from 'vitest'
import { AFK_SLEEP_SECONDS, AWAKE, nextSleepState, RESTED_AT, TIRED_BELOW } from './sleep'

describe('nextSleepState', () => {
  it('thức khi người dùng đang dùng máy và năng lượng ổn', () => {
    expect(nextSleepState(AWAKE, 5, 80)).toEqual(AWAKE)
  })

  it('ngủ khi người dùng vắng mặt đủ lâu, dậy ngay khi quay lại', () => {
    const asleep = nextSleepState(AWAKE, AFK_SLEEP_SECONDS, 80)
    expect(asleep).toMatchObject({ sleeping: true, reason: 'afk' })
    expect(nextSleepState(asleep, 2, 80)).toEqual(AWAKE)
  })

  it('ngủ vì mệt, chỉ dậy khi đã hồi đủ năng lượng (có độ trễ)', () => {
    const tired = nextSleepState(AWAKE, 0, TIRED_BELOW)
    expect(tired).toMatchObject({ sleeping: true, tired: true, reason: 'tired' })
    // Hồi một chút nhưng chưa đủ → vẫn ngủ
    expect(nextSleepState(tired, 0, TIRED_BELOW + 10).sleeping).toBe(true)
    expect(nextSleepState(tired, 0, RESTED_AT)).toEqual(AWAKE)
  })

  it('vắng mặt khi đang mệt: lý do ghi là afk, nhưng vẫn còn mệt khi quay lại', () => {
    const tired = nextSleepState(AWAKE, 0, 10)
    const both = nextSleepState(tired, AFK_SLEEP_SECONDS + 1, 10)
    expect(both).toMatchObject({ sleeping: true, reason: 'afk', tired: true })
    expect(nextSleepState(both, 1, 10)).toMatchObject({ sleeping: true, reason: 'tired' })
  })
})
