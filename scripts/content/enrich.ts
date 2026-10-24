// pnpm content:enrich <kind> [options]
//   vi — sinh nghĩa tiếng Việt ngắn bằng LLM cho từ thiếu nghĩa (xem scripts/content/enrich/vi.ts)
//        [--provider api|claude-cli] [--claude-bin path] [--dry-run] [--limit N] [--batch N]
//        [--concurrency N] [--model id] [--effort level] [--import file]
//   vi-recheck — duyệt lại nghĩa Việt HIỆN CÓ theo tần suất (keep/replace); replace thay hẳn nghĩa Wiktionary
//        [--from-rank N] [--to-rank N] [--limit N] [--batch N] [--concurrency N] [--model id] [--effort level]
//   vi-review — duyệt nghĩa `draft` bằng Claude CLI (model mạnh hơn kiểm/sửa/loại từng mục → approved|rejected)
//        [--limit N] [--batch N] [--concurrency N] [--model id] [--effort level] [--claude-bin path]
import { enrichVi } from './enrich/vi'
import { reviewVi } from './enrich/review'
import { recheckVi } from './enrich/recheck'

const KINDS: Record<string, (args: string[]) => Promise<void>> = {
  vi: enrichVi,
  'vi-review': reviewVi,
  'vi-recheck': recheckVi
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
