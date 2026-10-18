// pnpm content:level — gắn lại level cho words/sentences và sinh lại decks
// (chạy sau khi sửa content/curated/vocab/level-overrides.json hoặc level/thresholds.ts)
import { applyLevels } from './level/apply'

applyLevels().catch((err) => {
  console.error(err)
  process.exit(1)
})
