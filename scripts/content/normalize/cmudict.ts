// CMUdict → normalized/cmudict.json: { word: ['/ˈæpəl/', ...] } (IPA kiểu Mỹ)
import { arpabetToIpa } from '../lib/arpabet'
import { log, readLines, requireFile, writeJson } from '../lib/io'
import { normalizedPath, rawPath } from '../lib/paths'

export type CmudictFile = Record<string, string[]>

export async function normalizeCmudict(): Promise<void> {
  const path = rawPath('cmudict', 'cmudict.dict')
  requireFile(path, 'pnpm content:fetch cmudict')
  const map: CmudictFile = {}
  let bad = 0
  for await (const line of readLines(path)) {
    // "read(2) R IY1 D # comment"
    const m = /^(\S+?)(?:\(\d+\))?\s+([^#]+)/.exec(line)
    if (!m) continue
    try {
      const ipa = arpabetToIpa(m[2])
      const list = (map[m[1]] ??= [])
      if (!list.includes(ipa)) list.push(ipa)
    } catch {
      bad++
    }
  }
  await writeJson(normalizedPath('cmudict.json'), map)
  log(`cmudict: ${Object.keys(map).length} words${bad ? `, ${bad} unparsable lines skipped` : ''}`)
}
