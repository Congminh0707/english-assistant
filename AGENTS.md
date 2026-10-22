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
pnpm test           # Vitest (logic + services với SQLite in-memory)
pnpm db:generate    # sinh migration từ Drizzle schema
pnpm content:validate
pnpm content:stats   # số liệu từ điển (pack) — cập nhật docs/17-metrics.md
pnpm stats           # số liệu app/nội dung tự soạn — cập nhật docs/17-metrics.md
pnpm build:win      # build installer
```

## Quy tắc cứng
- Renderer **không** truy cập DB/file/hệ thống trực tiếp — chỉ qua `window.api` → IPC → main.
- Kênh IPC mới: thêm tên vào `src/shared/ipc-channels.ts` + schema vào `src/shared/ipc-contract.ts` (zod input/output), rồi handler (`handle`/`onSend`), rồi store. Preload không được import thư viện (sandbox).
- `container.ts`, services, repositories không import `electron` (để test bằng Vitest trong Node).
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
- **Cập nhật số liệu**: nếu việc vừa làm đổi con số nào (số từ/nghĩa Việt của từ điển, số bài học/đọc/nghe/ngữ pháp, số test, kênh IPC, migration, vật phẩm, dung lượng pack/model, phiên bản) → chạy `pnpm stats` / `pnpm content:stats` / `pnpm test`, sửa [docs/17-metrics.md](docs/17-metrics.md) và các chỗ khác trích số đó (không ước lượng bằng tay, ghi ngày đo). Trước mỗi lần phát hành cũng đo lại.

## Cập nhật tài liệu theo thời gian thực (bắt buộc)
- Cập nhật docs **ngay sau mỗi bước nhỏ hoàn thành** (một tính năng, một migration, một kênh IPC, một nhóm nội dung) — **không dồn đến cuối task**, để nếu phiên làm việc bị ngắt thì người/AI tiếp theo biết chính xác đã làm tới đâu.
- Trước khi bắt đầu một việc dài: ghi dòng `🚧 Đang làm: <việc> — bước tiếp theo: <...>` vào mục **Nhật ký tiến độ** của [docs/14-roadmap.md](docs/14-roadmap.md). Xong thì đổi thành `[x]` và xoá dòng đang làm.
- Mỗi bước ghi rõ: đã xong gì, còn dở gì, file nào đang sửa dở, lệnh để kiểm tra (`pnpm lint && pnpm test`).
- Đổi schema → `docs/10-data-model.md`; đổi kênh IPC/service/thư mục → `docs/03-architecture.md`; nội dung mới → `docs/08` và `docs/07`; quyết định kỹ thuật → `docs/decisions.md`.
