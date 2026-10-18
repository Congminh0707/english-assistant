// pnpm content:normalize [stage...]
// Stage chạy theo thứ tự: wordlists → cmudict → tatoeba → wiktionary → merge → level.
// Không truyền stage = chạy tất cả. Mỗi stage ghi đè output của nó (idempotent).
import { applyLevels } from './level/apply'
import { ensureDir, log } from './lib/io'
import { NORMALIZED_DIR } from './lib/paths'
import { normalizeCmudict } from './normalize/cmudict'
import { mergeWords } from './normalize/merge'
import { normalizeTatoeba } from './normalize/tatoeba'
import { normalizeWiktionary } from './normalize/wiktionary'
import { normalizeWordlists } from './normalize/wordlists'

const STAGES: Record<string, () => Promise<unknown>> = {
  wordlists: normalizeWordlists,
  cmudict: normalizeCmudict,
  tatoeba: normalizeTatoeba,
  wiktionary: normalizeWiktionary,
  merge: mergeWords,
  level: applyLevels
}
// Cho phép gọi theo id nguồn như docs: `content:normalize ngsl`
const ALIASES: Record<string, string> = {
  ngsl: 'wordlists',
  tsl: 'wordlists',
  cefrj: 'wordlists',
  octanove: 'wordlists',
  kaikki: 'wiktionary'
}

async function main(): Promise<void> {
  const wanted = process.argv.slice(2).map((a) => ALIASES[a] ?? a)
  for (const w of wanted)
    if (!STAGES[w])
      throw new Error(`Unknown stage "${w}". Stages: ${Object.keys(STAGES).join(', ')}`)
  await ensureDir(NORMALIZED_DIR)
  for (const [name, run] of Object.entries(STAGES)) {
    if (wanted.length && !wanted.includes(name)) continue
    const t = Date.now()
    log(`▶ ${name}`)
    await run()
    log(`✔ ${name} (${((Date.now() - t) / 1000).toFixed(1)}s)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
