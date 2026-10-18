import { defineConfig } from 'drizzle-kit'

// `pnpm db:generate` đọc schema và sinh file SQL migration (~ php artisan make:migration, nhưng tự động)
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/schema/index.ts',
  out: './src/main/db/migrations'
})
