# AGENTS.md — Hướng dẫn cho AI agent & người mới

Dự án: **English Assistant** — Desktop Mascot (chibi/pixel) cho Windows giúp học tiếng Anh trong lúc dùng máy tính, từ mầm non tới TOEIC 990 / IELTS 9.0.

## Đọc trước khi làm bất cứ việc gì
1. [docs/README.md](docs/README.md) — mục lục & quy tắc tài liệu.
2. [docs/03-architecture.md](docs/03-architecture.md) — kiến trúc Electron (main / preload / renderer).
3. [docs/13-coding-conventions.md](docs/13-coding-conventions.md) — quy ước code bắt buộc.
4. Tài liệu module liên quan tới task (mascot → 05, level → 06, bài học → 07, nội dung → 08/09, DB → 10, AI → 11).

## Stack (tóm tắt)
Electron + electron-vite · Vue 3 (`<script setup lang="ts">`) + Pinia + Tailwind · TypeScript strict · SQLite (better-sqlite3 + Drizzle) · zod · ts-fsrs · Vitest/Playwright · electron-builder (NSIS). Chi tiết: [docs/02-tech-stack.md](docs/02-tech-stack.md).

## Lệnh
```bash
pnpm dev            # chạy app dev
pnpm lint           # ESLint
pnpm test           # Vitest
pnpm db:generate    # sinh migration từ Drizzle schema
pnpm content:validate
pnpm build:win      # build installer
```

## Quy tắc cứng
- Renderer **không** truy cập DB/file/hệ thống trực tiếp — chỉ qua `window.api` → IPC → main.
- Kênh IPC mới: sửa `src/shared/ipc-contract.ts` trước (zod input/output), rồi handler, rồi store.
- `src/shared/` không import `electron`, `node:*`, hay Vue.
- Giữ `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Không bao giờ hạ cấu hình bảo mật để "cho chạy được".
- Đổi schema DB → migration mới (không sửa migration đã phát hành) + cập nhật [docs/10-data-model.md](docs/10-data-model.md).
- Thêm thư viện lớn → cập nhật [docs/02-tech-stack.md](docs/02-tech-stack.md) + [docs/decisions.md](docs/decisions.md).
- **Nội dung**: không đưa nội dung có bản quyền vào repo. Mỗi bản ghi nội dung phải có `source.license`. Nguồn mới phải được ghi vào [docs/08-content-sources.md](docs/08-content-sources.md) trước.
- Chuỗi giao diện qua i18n (`vi.json`/`en.json`), không viết cứng.
- Không log clipboard, API key, audio người dùng.
- Mascot không được cướp focus và phải tôn trọng chế độ yên lặng.

## Khi xong task
- `pnpm lint && pnpm test` pass.
- Cập nhật tài liệu liên quan (tài liệu là nguồn sự thật).
- Đánh dấu checklist trong [docs/14-roadmap.md](docs/14-roadmap.md) nếu hoàn thành một hạng mục.
