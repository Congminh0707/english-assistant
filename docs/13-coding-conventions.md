# 13 — Quy ước code

Áp dụng cho cả người và AI agent. Mục tiêu: code ai đọc cũng hiểu, AI sinh code nhất quán.

## 1. Chung

- **TypeScript strict** (`"strict": true`) ở mọi nơi. Không dùng `any` (dùng `unknown` rồi thu hẹp kiểu).
- Format bằng Prettier (2 spaces, single quote, không dấu chấm phẩy — theo template electron-vite), lint bằng ESLint. Chạy `pnpm lint` trước khi commit.
- Đặt tên:
  | Loại | Quy ước | Ví dụ |
  |---|---|---|
  | File class/service | PascalCase | `PetService.ts` |
  | File Vue component | PascalCase | `WordCard.vue` |
  | File khác (util, composable, ipc) | camelCase / kebab có hậu tố | `useTts.ts`, `pet.ipc.ts` |
  | Biến, hàm | camelCase | `xpForNextLevel` |
  | Hằng số | UPPER_SNAKE | `MAX_DAILY_MICRO_XP` |
  | Bảng/cột DB | snake_case | `srs_cards.profile_id` |
  | Kênh IPC | `domain:action` kebab | `pet:feed`, `dictionary:lookup` |
  | Event nội bộ | `domain.past-tense` | `lesson.completed` |
  | Content id | `kind:namespace:key` | `word:en:apple`, `lesson:general-a2:u03:l02` |
- Comment bằng **tiếng Việt hoặc tiếng Anh đều được**, nhưng thống nhất trong một file. Chỉ comment "tại sao", không comment "cái gì" hiển nhiên.
- Không thêm thư viện lớn mà không cập nhật [02-tech-stack.md](02-tech-stack.md) + [decisions.md](decisions.md).

## 2. Main process (~ Laravel backend)

Phân lớp giống Laravel:

| Lớp | Trách nhiệm | Không được |
|---|---|---|
| `ipc/*.ipc.ts` (Controller) | Nhận input, **validate bằng zod**, gọi service, trả kết quả | Chứa logic nghiệp vụ, truy vấn DB trực tiếp |
| `services/*Service.ts` | Logic nghiệp vụ, phát event | Biết về `BrowserWindow`, IPC |
| `db/repositories/*` | Truy vấn Drizzle | Logic nghiệp vụ |
| `events/` | Event bus có kiểu | |
| `windows/` | Tạo/quản lý cửa sổ | Logic nghiệp vụ |
| `system/` | Tích hợp hệ điều hành (tray, shortcut, clipboard) | |

- Service nhận dependency qua constructor (dependency injection thủ công trong `container.ts`) → dễ test bằng cách truyền fake.
- Thời gian lấy qua `Clock` service (`clock.now()`), không gọi `Date.now()` rải rác → test được logic theo thời gian (giảm chỉ số pet, streak, SRS).
- Lỗi nghiệp vụ ném `AppError(code, messageKey, details)`; IPC layer chuyển thành `{ ok: false, error: { code, messageKey } }`. Renderer dịch `messageKey` qua i18n.
- Log bằng `electron-log`; không log nội dung nhạy cảm (văn bản clipboard, API key, audio).

## 3. IPC

**Một nguồn định nghĩa duy nhất** cho mọi kênh: `src/shared/ipc-contract.ts`. Main và preload đều import từ đây → sai kiểu là lỗi compile.

```ts
// src/shared/ipc-contract.ts
import { z } from 'zod'

export const ipcContract = {
  'pet:get':          { input: z.void(),                                       output: PetStateSchema },
  'pet:feed':         { input: z.object({ itemId: z.string() }),               output: PetStateSchema },
  'dictionary:lookup':{ input: z.object({ text: z.string().min(1).max(200) }), output: LookupResultSchema },
  'srs:due':          { input: z.object({ limit: z.number().int().max(100) }), output: z.array(CardSchema) },
  'srs:review':       { input: z.object({ cardId: z.string(), rating: z.number().int().min(1).max(4), elapsedMs: z.number() }), output: CardSchema },
} as const

// Sự kiện main → renderer
export const ipcEvents = {
  'pet:updated':        PetStateSchema,
  'reward:granted':     RewardSchema,
  'quiet-mode:changed': z.object({ quiet: z.boolean(), reason: z.string() }),
  'mascot:say':         BubbleSchema,
} as const
```

```ts
// src/main/ipc/handle.ts — helper đăng ký có validate (~ Route + FormRequest)
export function handle<K extends keyof typeof ipcContract>(channel: K, fn: (input: Input<K>) => Promise<Output<K>>) {
  ipcMain.handle(channel, async (_e, raw) => {
    const parsed = ipcContract[channel].input.safeParse(raw)
    if (!parsed.success) return { ok: false, error: { code: 'VALIDATION', messageKey: 'errors.validation' } }
    try { return { ok: true, data: await fn(parsed.data) } }
    catch (err) { return toIpcError(err) }
  })
}

// src/main/ipc/pet.ipc.ts
export function registerPetIpc({ petService }: Container) {
  handle('pet:get', () => petService.get())
  handle('pet:feed', ({ itemId }) => petService.feed(itemId))
}
```

```ts
// renderer — dùng như gọi API
const pet = await api.invoke('pet:feed', { itemId: 'food:onigiri' })
```

Quy tắc:
- Renderer **chỉ** gọi qua `window.api` — không `require('electron')` trong renderer.
- Preload **không** expose `ipcRenderer` thô; chỉ expose `invoke(channel, input)` với channel nằm trong contract, và `on(event, cb)` với event trong `ipcEvents`.
- Dữ liệu qua IPC phải serialize được (không gửi class, function, Date → dùng number ms).

## 4. Renderer (Vue)

- Vue 3 `<script setup lang="ts">`, Composition API. Không dùng Options API.
- Component nhỏ, một trách nhiệm. Component dạng bài tập nhận props `item` + emit `answer(result)` — **không tự chấm điểm** (chấm điểm ở `src/shared/scoring/` để main cũng dùng được và test dễ).
- Pinia store mỗi domain: `usePetStore`, `useProfileStore`, `useSrsStore`... Store gọi `api.invoke`, lắng nghe `api.on` để cập nhật. Không gọi `api` trực tiếp trong component nếu đã có store.
- Composables cho logic tái sử dụng: `useTts()`, `useRecorder()`, `useHotkey()`, `useCountdown()`.
- Chuỗi giao diện qua `t('key')`. Key i18n dạng `module.screen.label`.
- Style: Tailwind + tokens CSS. Component pixel dùng chung đặt tên tiền tố `Px`: `PxButton`, `PxPanel`, `PxProgress`, `PxBadge`.

## 5. Shared

- `src/shared/` **không** import gì từ `electron`, `node:*`, hay Vue — chỉ TypeScript thuần + zod → chạy được ở main, renderer, scripts, test.
- Chứa: schema zod, kiểu, hằng số (level, XP, unlocks, achievements), hàm chấm điểm, thuật toán thuần (Elo, level detection).

## 6. Test

| Loại | Công cụ | Bắt buộc cho |
|---|---|---|
| Unit | Vitest | Mọi hàm trong `src/shared/` (scoring, rating, XP), mọi service có logic (PetService, SrsService, StreakService) |
| Component | Vitest + @vue/test-utils | Component dạng bài tập |
| E2E | Playwright (Electron) | Luồng chính: mở app → mascot hiện → dịch nhanh → học 1 bài → nhận XP |
| Content | `pnpm content:validate` | Mọi thay đổi trong `content/curated/` |

- Service test dùng SQLite **in-memory** (`:memory:`) + chạy migration thật + `FakeClock`.
- Đặt file test cạnh file nguồn (`PetService.test.ts`) hoặc trong `tests/` — chọn một và thống nhất (mặc định: cạnh file nguồn cho unit, `tests/e2e/` cho E2E).

## 7. Git

- Nhánh: `main` (luôn chạy được), `feat/<tên>`, `fix/<tên>`, `content/<tên>`.
- Commit theo Conventional Commits: `feat(mascot): add drag and fall animation`, `fix(srs): ...`, `content(a2): add 5 shopping lessons`, `docs: ...`.
- PR nhỏ, có mô tả + ảnh/GIF nếu thay đổi UI. Checklist PR:
  - [ ] `pnpm lint && pnpm test` pass
  - [ ] Cập nhật docs nếu thay đổi kiến trúc/schema/IPC
  - [ ] Migration mới nếu đổi schema (không sửa migration cũ đã phát hành)
  - [ ] Không commit file lớn (`content/raw/`, model AI, audio gốc) — dùng `.gitignore` / Git LFS

## 8. Dành riêng cho AI agent

- Đọc `AGENTS.md` ở root trước. Đọc tài liệu module liên quan trước khi code.
- Làm đúng phạm vi task; không tự ý refactor lớn.
- Thêm kênh IPC → cập nhật `ipc-contract.ts` trước, rồi handler, rồi preload/store.
- Thêm bảng/cột → sửa Drizzle schema → `pnpm db:generate` → cập nhật [10-data-model.md](10-data-model.md).
- Thêm dạng bài tập → schema + component + scoring + test + cập nhật bảng ở [07](07-learning-modules.md#2-danh-mục-dạng-bài-tập-exercise-types).
- Không đưa nội dung có bản quyền vào repo; nguồn mới phải có trong [08](08-content-sources.md).
