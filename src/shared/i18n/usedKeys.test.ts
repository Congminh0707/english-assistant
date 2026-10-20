import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { messages } from './index'

/** Tra khoá 'a.b.c' trong cây thông điệp */
function has(tree: unknown, key: string): boolean {
  let node: unknown = tree
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return false
    node = (node as Record<string, unknown>)[part]
  }
  return true
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(vue|ts)$/.test(name) && !/\.test\.ts$/.test(name)) out.push(path)
  }
  return out
}

// Bắt t('khoá') / t("khoá") / $t('khoá') với khoá viết thẳng (khoá ghép bằng ${} được bỏ qua)
const CALL = /(?<![A-Za-z0-9_.])\$?t\(\s*(['"])([A-Za-z][A-Za-z0-9_.-]*)\1/g

describe('khoá i18n dùng trong mã nguồn', () => {
  it('mọi khoá viết thẳng trong renderer đều có ở cả vi và en', () => {
    const missing: string[] = []
    for (const file of walk(resolve('src/renderer'))) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(CALL)) {
        const key = m[2]
        if (!key.includes('.')) continue // tên biến t(...) khác, không phải khoá
        for (const lang of ['vi', 'en'] as const) {
          if (!has(messages[lang], key)) missing.push(`${lang}: ${key} (${file.split('src')[1]})`)
        }
      }
    }
    expect(missing).toEqual([])
  })
})

// t(`khoá.${biến}`): kiểm tra phần tiền tố là một nhánh có thật, có con, ở cả hai ngôn ngữ
const TEMPLATE_CALL = /(?<![A-Za-z0-9_.])\$?t\(\s*`([A-Za-z][A-Za-z0-9_.-]*)\.\$\{/g
// Main process: t(lang, 'khoá')
const MAIN_CALL = /\bt\(\s*[A-Za-z.]+\s*,\s*(['"])([A-Za-z][A-Za-z0-9_.-]*)\1/g

function leafPaths(tree: unknown, prefix = ''): string[] {
  if (typeof tree !== 'object' || tree === null) return [prefix]
  return Object.entries(tree).flatMap(([k, v]) => leafPaths(v, prefix ? `${prefix}.${k}` : k))
}

describe('khoá i18n: kiểm tra mở rộng', () => {
  it('khoá ghép bằng ${} trỏ tới nhánh có thật ở cả vi và en', () => {
    const bad: string[] = []
    for (const file of walk(resolve('src/renderer'))) {
      for (const m of readFileSync(file, 'utf8').matchAll(TEMPLATE_CALL)) {
        for (const lang of ['vi', 'en'] as const) {
          if (!has(messages[lang], m[1])) bad.push(`${lang}: ${m[1]}.* (${file.split('src')[1]})`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('khoá dùng ở main process có ở cả vi và en', () => {
    const bad: string[] = []
    for (const file of walk(resolve('src/main'))) {
      for (const m of readFileSync(file, 'utf8').matchAll(MAIN_CALL)) {
        for (const lang of ['vi', 'en'] as const) {
          if (!has(messages[lang], m[2])) bad.push(`${lang}: ${m[2]} (${file.split('src')[1]})`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('vi và en có đúng cùng một tập khoá', () => {
    const vi = new Set(leafPaths(messages.vi))
    const en = new Set(leafPaths(messages.en))
    expect([...vi].filter((k) => !en.has(k))).toEqual([])
    expect([...en].filter((k) => !vi.has(k))).toEqual([])
  })
})
