import { describe, expect, it } from 'vitest'
import { levelAndNext, practiceLevels } from './learning'

describe('levelAndNext', () => {
  it('level hiện tại và level kế tiếp', () => {
    expect(levelAndNext('A2_1')).toEqual(['A2_1', 'A2_2'])
    expect(levelAndNext('C2')).toEqual(['C2'])
  })

  it('Pre-A1 lấy từ bậc A1.1 vì gói chưa có nội dung Pre-A1', () => {
    expect(levelAndNext('PA1_1')).toEqual(['A1_1', 'A1_2'])
    expect(levelAndNext('PA1_2')).toEqual(['A1_1', 'A1_2'])
  })
})

describe('practiceLevels', () => {
  it('một bậc dưới, hiện tại, một bậc trên', () => {
    expect(practiceLevels('B1_1')).toEqual(['A2_2', 'B1_1', 'B1_2'])
  })

  it('không bao giờ rỗng và không dưới A1.1', () => {
    expect(practiceLevels('PA1_1')).toEqual(['A1_1', 'A1_2', 'A2_1'])
    expect(practiceLevels('PA1_2')).toEqual(['A1_1', 'A1_2', 'A2_1'])
    expect(practiceLevels('A1_1')).toEqual(['A1_1', 'A1_2', 'A2_1'])
    expect(practiceLevels('C2')).toEqual(['C1', 'C2'])
  })
})
