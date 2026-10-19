import { describe, expect, it } from 'vitest'
import { isInQuietHours, isMeetingWindow, parseClock } from './quiet'

describe('isMeetingWindow', () => {
  it('nhận app họp theo tên file', () => {
    expect(isMeetingWindow('Zoom.exe', 'Zoom Meeting')).toBe(true)
    expect(isMeetingWindow('ms-teams.exe', 'Chat | Microsoft Teams')).toBe(true)
  })

  it('trình duyệt chỉ tính khi tiêu đề là dịch vụ họp', () => {
    expect(isMeetingWindow('chrome.exe', 'Meet - abc-defg-hij - Google Chrome')).toBe(true)
    expect(isMeetingWindow('msedge.exe', 'Daily standup | Microsoft Teams')).toBe(true)
    expect(isMeetingWindow('chrome.exe', 'Facebook - Google Chrome')).toBe(false)
    expect(isMeetingWindow('chrome.exe', 'Meeting notes - Google Docs')).toBe(false)
    expect(isMeetingWindow('notepad.exe', 'Meet - notes.txt')).toBe(false)
  })
})

describe('isInQuietHours', () => {
  const at = (hhmm: string): number => parseClock(hhmm)!

  it('khung trong ngày', () => {
    expect(isInQuietHours(at('12:30'), '12:00', '13:30')).toBe(true)
    expect(isInQuietHours(at('13:30'), '12:00', '13:30')).toBe(false)
    expect(isInQuietHours(at('11:59'), '12:00', '13:30')).toBe(false)
  })

  it('khung vắt qua nửa đêm', () => {
    expect(isInQuietHours(at('23:00'), '22:00', '07:00')).toBe(true)
    expect(isInQuietHours(at('03:00'), '22:00', '07:00')).toBe(true)
    expect(isInQuietHours(at('07:00'), '22:00', '07:00')).toBe(false)
    expect(isInQuietHours(at('15:00'), '22:00', '07:00')).toBe(false)
  })

  it('giờ sai định dạng hoặc khung rỗng → không áp dụng', () => {
    expect(isInQuietHours(at('10:00'), '25:00', '07:00')).toBe(false)
    expect(isInQuietHours(at('10:00'), '08:00', '08:00')).toBe(false)
    expect(parseClock('7:05')).toBe(425)
  })
})
