// pnpm content:enrich <kind> [options]
//   vi — sinh nghĩa tiếng Việt ngắn bằng LLM cho từ thiếu nghĩa (xem scripts/content/enrich/vi.ts)
//        [--provider api|claude-cli] [--claude-bin path] [--dry-run] [--limit N] [--batch N]
//        [--concurrency N] [--model id] [--effort level] [--import file]
import { enrichVi } from './enrich/vi'

const KINDS: Record<string, (args: string[]) => Promise<void>> = {
  vi: enrichVi
}

async function main(): Promise<void> {
  const [kind, ...args] = process.argv.slice(2)
  const run = kind ? KINDS[kind] : undefined
  if (!run)
    throw new Error(`Usage: pnpm content:enrich <${Object.keys(KINDS).join('|')}> [options]`)
  await run(args)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
