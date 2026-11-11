import { describe, expect, it } from 'vitest'
import { defaultSettings } from './schemas/settings'
import {
  CLI_DEFAULT_LIMIT,
  CLI_LIMIT_CHOICES,
  cliLimitChoice,
  cliLimitUpdates,
  cliUnlimitedActive,
  parseCliLimitChoice
} from './aiLimit'

describe('hạn mức CLI mỗi ngày (một ô chọn)', () => {
  it('mặc định 60, có các mức tới 200, Không giới hạn và Tắt', () => {
    expect(defaultSettings()['ai.cliDailyLimit']).toBe(CLI_DEFAULT_LIMIT)
    expect(CLI_DEFAULT_LIMIT).toBe(60)
    expect(CLI_LIMIT_CHOICES).toEqual([10, 30, 60, 100, 150, 200, 'unlimited', 0])
  })

  it('hạn mức 0 thắng không giới hạn', () => {
    expect(cliUnlimitedActive(0, true)).toBe(false)
    expect(cliLimitChoice(0, true)).toBe(0)
    expect(cliLimitChoice(30, true)).toBe('unlimited')
    expect(cliLimitChoice(30, false)).toBe(30)
  })

  it('đọc giá trị option', () => {
    expect(parseCliLimitChoice('unlimited')).toBe('unlimited')
    expect(parseCliLimitChoice('100')).toBe(100)
    expect(parseCliLimitChoice('0')).toBe(0)
    expect(parseCliLimitChoice('abc')).toBeNull()
    expect(parseCliLimitChoice('500')).toBeNull()
  })

  it('áp lựa chọn: không bao giờ để lại 0 + không giới hạn', () => {
    expect(cliLimitUpdates('unlimited', 30)).toEqual([['ai.cliUnlimited', true]])
    expect(cliLimitUpdates('unlimited', 0)).toEqual([
      ['ai.cliDailyLimit', 60],
      ['ai.cliUnlimited', true]
    ])
    expect(cliLimitUpdates(0, 30)).toEqual([
      ['ai.cliUnlimited', false],
      ['ai.cliDailyLimit', 0]
    ])
    expect(cliLimitUpdates(150, 30)).toEqual([
      ['ai.cliUnlimited', false],
      ['ai.cliDailyLimit', 150]
    ])
    // Mô phỏng áp lần lượt: mọi trạng thái giữa chừng đều hợp lệ
    for (const start of [0, 10, 200]) {
      for (const startUnl of [false, true]) {
        for (const choice of CLI_LIMIT_CHOICES) {
          let limit = start
          let unl = startUnl && start > 0
          for (const [key, value] of cliLimitUpdates(choice, limit)) {
            if (key === 'ai.cliDailyLimit') limit = value as number
            else unl = value as boolean
            expect(limit === 0 && unl, `${start}/${startUnl} → ${choice}`).toBe(false)
          }
          expect(cliLimitChoice(limit, unl)).toBe(choice)
        }
      }
    }
  })
})
