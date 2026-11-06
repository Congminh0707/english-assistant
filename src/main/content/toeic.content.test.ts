import { describe, expect, it } from 'vitest'
import { ToeicBankFileSchema } from '@shared/schemas/toeic'
import { bundledToeicFiles } from './bundledLessons'
import { ToeicBank } from './ToeicBank'

describe('ngân hàng TOEIC (content/curated/toeic)', () => {
  it('mọi file đúng schema', () => {
    for (const file of bundledToeicFiles) {
      const r = ToeicBankFileSchema.safeParse(file)
      expect(r.success, r.success ? '' : JSON.stringify(r.error.issues[0])).toBe(true)
    }
  })

  it('id nhóm và id câu không trùng', () => {
    const groups = new Set<string>()
    const questions = new Set<string>()
    for (const file of bundledToeicFiles) {
      const r = ToeicBankFileSchema.safeParse(file)
      if (!r.success) continue
      for (const g of r.data.groups) {
        expect(groups.has(g.id), `trùng nhóm ${g.id}`).toBe(false)
        groups.add(g.id)
        for (const q of g.questions) {
          expect(questions.has(q.id), `trùng câu ${q.id}`).toBe(false)
          questions.add(q.id)
        }
      }
    }
  })

  it('đáp án không dồn vào một lựa chọn', () => {
    const bank = new ToeicBank(bundledToeicFiles)
    const tally = [0, 0, 0, 0]
    for (let p = 1; p <= 7; p++)
      for (const g of bank.groups(p)) for (const q of g.questions) tally[q.answer]++
    const total = tally.reduce((a, b) => a + b, 0)
    if (total < 40) return
    for (const t of tally.slice(0, 3)) expect(t / total).toBeGreaterThan(0.1)
  })
})
