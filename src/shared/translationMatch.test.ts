import { describe, expect, it } from 'vitest'
import { matchesTranslation, translationForms } from './translationMatch'

describe('matchesTranslation', () => {
  const answers = ['I am a student.']

  it('khớp đúng nguyên văn', () => {
    expect(matchesTranslation('I am a student.', answers)).toBe(true)
  })

  it('bỏ qua hoa/thường, khoảng trắng hai đầu, khoảng trắng lặp, dấu câu cuối', () => {
    expect(matchesTranslation('  i   AM a student  ', answers)).toBe(true)
    expect(matchesTranslation('I am a student!!', answers)).toBe(true)
    expect(matchesTranslation('I am a student', answers)).toBe(true)
  })

  it('bỏ qua dấu phẩy giữa câu', () => {
    expect(matchesTranslation('Yes I do.', ['Yes, I do.'])).toBe(true)
  })

  it('dạng viết tắt ↔ dạng đầy đủ, cả hai chiều', () => {
    expect(matchesTranslation("I'm a student.", answers)).toBe(true)
    expect(matchesTranslation('I do not like milk.', ["I don't like milk."])).toBe(true)
    expect(matchesTranslation("She doesn't work here.", ['She does not work here.'])).toBe(true)
    expect(matchesTranslation("They're late.", ['They are late.'])).toBe(true)
    expect(matchesTranslation("We've finished.", ['We have finished.'])).toBe(true)
    expect(matchesTranslation("I'll call you.", ['I will call you.'])).toBe(true)
    expect(matchesTranslation("Let's go.", ['Let us go.'])).toBe(true)
  })

  it('nháy cong và nháy thẳng như nhau', () => {
    expect(matchesTranslation('I’m a student.', answers)).toBe(true)
    expect(matchesTranslation('I‘m a student.', answers)).toBe(true)
  })

  it("can't = cannot = can not; won't = will not", () => {
    for (const s of ["I can't swim.", 'I cannot swim.', 'I can not swim.'])
      expect(matchesTranslation(s, ['I cannot swim.'])).toBe(true)
    expect(matchesTranslation("He won't come.", ['He will not come.'])).toBe(true)
  })

  it("'s sau đại từ là is hoặc has; sở hữu cách giữ nguyên", () => {
    expect(matchesTranslation("It's cold.", ['It is cold.'])).toBe(true)
    expect(matchesTranslation("He's gone home.", ['He has gone home.'])).toBe(true)
    expect(matchesTranslation("What's your name?", ['What is your name?'])).toBe(true)
    expect(matchesTranslation("Lan's bag is red.", ['Lan is bag is red.'])).toBe(false)
    expect(matchesTranslation("Lan's bag is red.", ["Lan's bag is red."])).toBe(true)
  })

  it("'d là would hoặc had", () => {
    expect(matchesTranslation("I'd like some tea.", ['I would like some tea.'])).toBe(true)
    expect(matchesTranslation("She'd left.", ['She had left.'])).toBe(true)
  })

  it('khớp với bất kỳ đáp án nào trong danh sách', () => {
    expect(matchesTranslation('I am a pupil.', ['I am a student.', 'I am a pupil.'])).toBe(true)
  })

  it('khác từ → không khớp; chuỗi rỗng → không khớp', () => {
    expect(matchesTranslation('I am student.', answers)).toBe(false)
    expect(matchesTranslation('I was a student.', answers)).toBe(false)
    expect(matchesTranslation('   ', answers)).toBe(false)
    expect(matchesTranslation('...', answers)).toBe(false)
  })

  it('không bị bùng nổ tổ hợp với câu nhiều chỗ mơ hồ', () => {
    const s = Array.from({ length: 12 }, () => "he's").join(' ')
    expect(translationForms(s).length).toBeLessThanOrEqual(64)
  })
})
