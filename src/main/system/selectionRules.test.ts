import { describe, expect, it } from 'vitest'
import { canSimulateCopy, cleanSelection } from './selectionRules'
import { looksSensitive } from './sensitive'

describe('canSimulateCopy: không gửi Ctrl+C vào terminal', () => {
  it('app thường thì được, terminal/console thì không (Ctrl+C ở đó là ngắt lệnh)', () => {
    expect(canSimulateCopy({ exe: 'chrome.exe', className: 'Chrome_WidgetWin_1' })).toBe(true)
    expect(canSimulateCopy({ exe: 'winword.exe', className: 'OpusApp' })).toBe(true)
    expect(
      canSimulateCopy({ exe: 'WindowsTerminal.exe', className: 'CASCADIA_HOSTING_WINDOW_CLASS' })
    ).toBe(false)
    expect(canSimulateCopy({ exe: 'cmd.exe', className: 'ConsoleWindowClass' })).toBe(false)
    expect(canSimulateCopy({ exe: 'POWERSHELL.EXE', className: 'ConsoleWindowClass' })).toBe(false)
    expect(canSimulateCopy({ exe: 'putty.exe', className: 'PuTTY' })).toBe(false)
    // chỉ nhận ra bằng lớp cửa sổ khi không đọc được tên chương trình
    expect(canSimulateCopy({ exe: '', className: 'ConsoleWindowClass' })).toBe(false)
  })

  it('không biết cửa sổ đang focus thì không gửi', () => {
    expect(canSimulateCopy(null)).toBe(false)
  })
})

describe('cleanSelection', () => {
  it('cắt khoảng trắng, giới hạn 500 ký tự', () => {
    expect(cleanSelection('  hello world \n')).toBe('hello world')
    expect(cleanSelection('a '.repeat(400)).length).toBeLessThanOrEqual(500)
    expect(cleanSelection('   ')).toBe('')
  })

  it('bỏ chuỗi giống mật khẩu / OTP / khoá API', () => {
    expect(cleanSelection('Zx9$kLm2!pQr7#vB')).toBe('')
    expect(cleanSelection('123456')).toBe('')
    expect(cleanSelection('sk-abcdef123456')).toBe('')
    expect(looksSensitive('The quick brown fox')).toBe(false)
  })
})
