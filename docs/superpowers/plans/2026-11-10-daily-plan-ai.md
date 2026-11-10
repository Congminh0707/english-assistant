# Plan 2026-11-10 — Lộ trình hằng ngày, từ bài đọc vào SRS, AI BYOK, nhật ký, kiểm tra nội dung

Spec: [docs/30-product-review-2026-11.md](../../30-product-review-2026-11.md) §4 (rủi ro nội dung) và §5 (phát triển thêm, mục 1–4 và mục 6). Thiết kế gốc: [docs/07 §13](../../07-learning-modules.md) (lộ trình hằng ngày), [docs/11 §5](../../11-ai-and-speech.md) (LLM), [docs/01](../../01-features.md) C13, B8, G3.

Mục tiêu: người dùng người lớn (chủ dự án tự dùng) mở cửa sổ Học tập thấy ngay "hôm nay làm gì"; từ khó của bài đọc tự vào sổ từ; popup giải thích ngữ pháp bằng Claude (key người dùng); mỗi tối viết nhật ký 2–3 câu được AI sửa; thêm hai kiểm tra nội dung tự động.

## Global Constraints (bắt buộc, trích AGENTS.md)

- Renderer không truy cập DB/file/hệ thống; chỉ qua `window.api` → IPC → main.
- Kênh IPC mới: thêm tên vào `src/shared/ipc-channels.ts` + schema zod vào `src/shared/ipc-contract.ts`, handler trong `src/main/ipc/app.ipc.ts` (hàm `handle`), rồi store/component. Preload không import thư viện.
- `container.ts`, services, repositories không import `electron`. `src/shared/` không import `electron`, `node:*`, Vue.
- Không hạ `contextIsolation`, `nodeIntegration`, `sandbox`.
- Đổi schema DB → migration mới qua `pnpm db:generate` (không sửa migration đã có) + cập nhật `docs/10-data-model.md`.
- Chuỗi giao diện qua i18n (`src/shared/i18n/vi.json` và `en.json`), không viết cứng.
- Giao diện theo `docs/18-ui-rules.md`: `.btn/.card/.chip`, `<UiIcon>` (không emoji làm icon), màu/khoảng cách bằng token `var(--c-*)`, `var(--sp-*)`; xong chạy `pnpm ui:audit` (0 lỗi).
- Không log clipboard, API key, nội dung người dùng gửi AI. API key chỉ ở main (SecretStore), không bao giờ trả về renderer.
- Hồ sơ trẻ em (`isChild`): không dùng LLM, không có nhật ký.
- Mỗi task xong: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm ui:audit` đều sạch; cập nhật docs liên quan trong cùng commit; ghi một dòng `[x] (2026-11-10) …` vào mục **Nhật ký tiến độ** của `docs/14-roadmap.md`; đánh `[x]` mục tương ứng ở `docs/30-product-review-2026-11.md`.
- Commit message tiếng Anh ngắn, không thêm dòng Co-Authored-By hay "Generated with".
- Test chạy với SQLite in-memory (mẫu: `src/main/content/content.test.ts`, `src/main/services/*.test.ts`), không cần `.env.testing`.
- Viết docs bằng tiếng Việt, giữ thuật ngữ kỹ thuật tiếng Anh.

## Task 1 — Kiểm tra nội dung: level bài so với chương, nhất quán `ng` (Sonnet)

File: `src/main/content/lessons.test.ts` (chỉ thêm quy tắc), nội dung `content/curated/readings/*.json`, `content/curated/listening/*.json`, `content/curated/grammar/*.json`, `content/curated/lessons/*.json` (chỉ sửa trường `level` hoặc `ng` khi vi phạm), `docs/30-product-review-2026-11.md`, `docs/14-roadmap.md`.

Quy tắc mới (thêm vào `lessonKindSuite` và suite bài học nền tảng):

1. **Level bài trong dải của chương.** Nếu `unit.title` chứa mã CEFR dạng `\b(A1|A2|B1|B2|C1|C2)\b` (ví dụ "Đọc B1", "Nghe B2: …", "Ngữ pháp C1") thì mọi `lesson.level` phải thuộc dải đó hoặc **đúng một bậc con ngay dưới** (bắc cầu). Thứ tự bậc lấy từ `LEVEL_CODES` trong `src/shared/schemas/content/level.ts`; dải của X là mọi mã bắt đầu bằng `X` (`B1_1`, `B1_2`, hoặc `C1`, `C2` không có hậu tố). Bậc con ngay dưới = phần tử đứng trước phần tử đầu tiên của dải trong `LEVEL_CODES`. Lỗi: `${lesson.id}: level ${lesson.level} ngoài dải ${X} của chương`.
2. **Nhất quán dạng Đúng/Sai trong một bài.** Trong một bài, nếu có bài tập `tf` với `ng: true` thì mọi bài tập `tf` của bài đó phải `ng: true` (một bài không trộn 2 lựa chọn và 3 lựa chọn). Lỗi: `${lesson.id}: các câu tf phải cùng có hoặc cùng không có "ng"`. Giữ nguyên quy tắc cũ "đáp án ng cần ng: true".

Bước:
- Viết quy tắc, chạy `pnpm exec vitest run src/main/content/lessons.test.ts`, liệt kê vi phạm.
- Sửa nội dung vi phạm tối thiểu: quy tắc 1 → đổi `level` sang bậc hợp lệ gần nhất (không đổi `id`, không chuyển bài sang chương khác); quy tắc 2 → thêm `ng: true` cho các câu `tf` còn thiếu trong bài đó (đáp án giữ nguyên). Ghi danh sách bài đã sửa vào báo cáo.
- Cập nhật `docs/30-product-review-2026-11.md` §4: đánh `[x]` hai mục "Gắn level lệch" và "Cờ ng", sửa lời mục cờ `ng` thành: `ng: true` nghĩa là bài tập có lựa chọn "Không có thông tin"; quy tắc mới là nhất quán trong một bài (không đổi tên cờ). Ghi roadmap.
- Commit: `content: enforce lesson level band and consistent tf/ng per lesson`.

## Task 2 — Lộ trình hằng ngày `DailyPlanService` + ngăn kéo Hôm nay (Opus)

Thiết kế: [docs/07 §13](../../07-learning-modules.md). Người lớn mở cửa sổ Học tập → `TodayDrawer` hiện **3 việc hôm nay**, bấm là làm ngay.

### Dữ liệu (`src/shared/schemas/study.ts`, thêm)

```ts
export const DailyPlanItemSchema = z.object({
  kind: z.enum(['review', 'lesson', 'skill', 'practice']),
  /** Bài học/đọc/nghe/ngữ pháp: loại + id để mở thẳng */
  lessonKind: LessonKindSchema.optional(),
  lessonId: z.string().optional(),
  title: z.string(),
  /** Phụ đề: tên khoá, hoặc "kỹ năng yếu: Nghe" */
  subtitle: z.string().optional(),
  minutes: z.number().int().min(1),
  done: z.boolean(),
  /** Số thẻ đến hạn (chỉ kind review) */
  count: z.number().int().optional(),
  /** Kỹ năng (chỉ kind skill/practice) */
  skill: z.enum(['vocab', 'grammar', 'reading', 'listening']).optional()
})
export const DailyPlanSchema = z.object({
  day: z.string(),
  targetMinutes: z.number().int(),
  items: z.array(DailyPlanItemSchema),
  doneCount: z.number().int(),
  totalMinutes: z.number().int()
})
```

Cài đặt mới `learning.dailyMinutes`: `z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(60)]).default(20)` trong `src/shared/schemas/settings.ts`.

### Service `src/main/services/DailyPlanService.ts`

Phụ thuộc: `SrsService`, `StudyService` (hoặc `VocabRepository` để lấy `reviewedToday`), `CourseService`, `ProgressService`, `LessonService` × 4 kind (`Record<LessonKind, LessonService>` như `CourseService`), `LessonRepository`, `SettingsService`, `ProfileService`, `Clock`. Không import `electron`.

Thuật toán `plan(): DailyPlan` (thuần, không ghi DB):

1. **Ôn thẻ** (`review`): `count = srs.dueCount()`; `minutes = min(8, max(2, ceil(count / 4)))`; `done = count === 0 && reviewedToday > 0`; nếu `count === 0 && reviewedToday === 0 && totalCards === 0` thì bỏ mục này. Luôn đứng đầu.
2. **Bài tiếp theo trong khoá** (`lesson`): khoá đang theo = khoá có `stepsDone > 0` và `next != null` với `stepsDone/stepsTotal` lớn nhất; không có thì khoá đầu tiên (theo thứ tự `CourseService.list()`) có `levelFrom <= learning.level` (so bằng chỉ số trong `LEVEL_CODES`) và `next != null`; không có nữa thì bỏ mục. `title = next.title`, `subtitle = course.title`, `minutes = next.minutes`, `done = next.done` (luôn false vì là bước chưa xong; nhưng nếu bước này được hoàn thành hôm nay thì `done = true`: tra `lesson_progress.completedAt` nằm trong ngày local hôm nay).
3. **Kỹ năng yếu nhất** (`skill`): lấy `ProgressService.ratings()`, chọn kỹ năng có `rating` thấp nhất trong `grammar | reading | listening` (bỏ `vocab` vì đã có ôn thẻ). Tìm bài đầu tiên chưa `done` của `LessonService` tương ứng (`grammar` → kind `grammar`, `reading` → `reading`, `listening` → `listening`) có `level` ≤ `learning.level` + 1 bậc con (theo `LEVEL_CODES`) và **khác** bài ở mục 2. `title = lesson.title`, `subtitle = i18n key gợi ý hiển thị do renderer dịch: trả `skill` và renderer tự ghép chuỗi "Kỹ năng yếu: …"`. Không tìm được bài → thay bằng mục `practice` (Luyện tập, `minutes = 5`, `skill = 'vocab'`, `done` = hôm nay đã có ít nhất 1 phiên luyện tập: dùng `xpRepo.countSince(profileId, 'practice.completed', startOfLocalDay)` — xem `PracticeService` để lấy đúng `reason`; nếu không có reason như vậy thì `done = false`).
4. `targetMinutes = settings.get('learning.dailyMinutes')`. Nếu tổng phút 3 mục < targetMinutes thì thêm tối đa 2 mục `lesson` nữa là các bước kế tiếp chưa xong trong cùng khoá (sau `next`), mỗi bước một mục, dừng khi đủ phút. Tối đa 5 mục.
5. `doneCount` = số mục `done`; `totalMinutes` = tổng `minutes`.

### IPC

- Kênh `study:plan` → `{ input: z.void(), output: DailyPlanSchema }` (thêm vào `ipc-channels.ts`, `ipc-contract.ts`, handler `handle('study:plan', () => c.dailyPlan.plan())` trong `app.ipc.ts`). Đăng ký `dailyPlan` trong `container.ts` (`Container` type + khởi tạo).

### Renderer

- `TodayDrawer.vue`: thêm prop `plan: DailyPlan | null`, khối **"Hôm nay"** đặt **trên** khối thống kê: dòng tiêu đề `t('study.plan.title')` + chip `doneCount/items.length` + chọn mục tiêu phút (`select` 10/20/30/60 → emit `minutes`), danh sách mục: icon theo kind (`UiIcon`: review → `cards`, lesson → `book`, skill → `target`, practice → `dumbbell` — dùng tên icon có sẵn trong `UiIcon.vue`, nếu thiếu thì chọn icon gần nhất có sẵn), tiêu đề, phụ đề, chip phút, trạng thái done (icon `check`), nút `btn btn--sm btn--primary` "Làm" → emit `open(item)`; mục done thì nút ghost "Làm lại". Khối CTA ôn thẻ cũ bỏ (đã có mục review trong danh sách); giữ thống kê và `MissionList`.
- `App.vue`: tải `plan` cùng `overview`/`missions` trong `refresh()`; xử lý `open(item)`: `review` → `go('review')`; `practice` → `go('practice')`; `lesson`/`skill` → đặt `startLesson = { kind, id }` rồi `go(<page của kind>)` (`lesson` → `'lessons'`, `grammar` → `'grammar'`, `reading` → `'reading'`, `listening` → `'listening'`); truyền `:start-id` vào `LessonsPage` (prop `startId` đã có) và xoá `startLesson` khi rời trang. Kiểm tra `VillageMap.vue` đang truyền `overview/missions` vào `TodayDrawer` và nối thêm `plan` + sự kiện `open`/`minutes`. `setMinutes(v)` → `settingsStore.set('learning.dailyMinutes', v)` rồi `refresh()`.
- i18n: `study.plan.title` ("Hôm nay" / "Today"), `study.plan.target` ("Mục tiêu {n} phút"), `study.plan.minutes` ("{n} phút"), `study.plan.do` ("Làm"), `study.plan.redo` ("Làm lại"), `study.plan.review` ("Ôn {n} thẻ đến hạn"), `study.plan.weakSkill` ("Kỹ năng yếu: {skill}"), `study.plan.practice` ("Luyện tập nhanh"), `study.plan.skill.grammar|reading|listening|vocab`, `study.plan.empty` ("Hôm nay xong rồi. Giỏi lắm!"), `study.plan.allDone`.

### Test

`src/main/services/DailyPlanService.test.ts` (hoặc thêm vào `content.test.ts` theo mẫu khởi tạo container in-memory): (a) không thẻ, chưa học → có mục lesson từ khoá đầu phù hợp level, không có mục review; (b) có 6 thẻ đến hạn → mục review `count 6`, `minutes 2`; (c) kỹ năng listening rating thấp nhất → mục skill là bài listening chưa xong, khác bài mục 2; (d) hoàn thành bài của mục 2 hôm nay → `done true`, `doneCount` tăng; (e) `dailyMinutes = 60` → thêm mục lesson tới tối đa 5 mục.

### Docs

`docs/07-learning-modules.md` §13: thêm `> ✅ Đã làm (2026-11-10) …` mô tả thuật toán thật; `docs/01-features.md` C13 trạng thái; `docs/03-architecture.md`: thêm `DailyPlanService` + kênh `study:plan`; `docs/17-metrics.md`: chạy `pnpm stats`, sửa dòng Kênh IPC (ghi ngày); `docs/14-roadmap.md` nhật ký; `docs/30` §5 mục 1 `[x]`.

Commit: `study: daily plan (review, next course step, weakest skill) in Today drawer`.

## Task 3 — Từ khó của bài đọc tự vào sổ từ khi đạt bài (Opus)

Hiện `ReadingPassage.vue` có nút "Lưu N từ khó" thủ công (`hardWords` = từ có level > `learning.level`, qua `vocab:save-many`). Mục tiêu: khi **lần đầu đạt** một bài đọc (`kind = 'reading'`, `passed && firstCompletion`), main tự lưu tối đa **8** từ khó của bài kèm câu ngữ cảnh, nếu cài đặt `review.autoSaveReading` (boolean, mặc định `true`) bật.

- Cài đặt `review.autoSaveReading` trong `settings.ts`; toggle trong `SettingsPage.vue` mục Ôn từ (i18n `settings.review.autoSaveReading` + `…Hint`).
- Main: trong `LessonService.complete()` sau khi xác định `firstCompletion` và `source === 'reading'`, gọi hàm mới `deps.onFirstPass?.(lesson)`; container nối cho service `reading` một callback dùng `DictionaryService` + `VocabService.saveMany`. Cách xác định từ khó ở main: tách các câu của mọi `passage` block (`paragraphs[].en`), tách từ `[A-Za-z'-]+`, bỏ tên riêng (`src/shared/properNouns.ts` đã có), tra level từng từ qua `DictionaryService` (tìm hàm đang phục vụ `ReadingPassage` — có kênh trả `levels` theo từ; dùng cùng hàm ở main), giữ từ có level > `learning.level`, chưa có trong sổ (`VocabRepository.savedContentIdList`), ưu tiên từ xuất hiện sớm, tối đa 8, mỗi từ kèm câu đầu tiên chứa nó làm `context`. Lưu bằng cùng đường với `vocab:save-many` (xem `VocabService`). Trả thêm `savedWords: number` (optional) trong `LessonCompleteResultSchema`.
- Renderer: thẻ kết quả `LessonsPage.vue` hiện chip `t('study.lessons.autoSaved', { n })` khi `result.savedWords > 0`. Hồ sơ trẻ em không áp dụng (callback kiểm tra `profiles.active().isChild`).
- Test: bài đọc có ≥ 3 từ trên level → lần đầu đạt lưu đúng số từ (≤ 8), có `context`; làm lại không lưu thêm; tắt cài đặt → không lưu; từ đã có trong sổ không lưu lại.
- Docs: `docs/07 §5` ghi đã làm; `docs/14` nhật ký; `docs/30` §5 mục 2 `[x]`.

Commit: `reading: auto-save up to 8 hard words to SRS on first pass`.

## Task 4 — AI BYOK dùng chung + giải thích ngữ pháp trong popup (Opus)

Thiết kế gốc [docs/11 §5](../../11-ai-and-speech.md). Phạm vi v1: **chỉ Anthropic**, dùng **cùng key** người dùng đã nhập cho "Dịch online (Claude)" (`translate:set-key`, lưu trong `SecretStore`; tìm tên secret trong `src/main/index.ts`). Thiết kế interface để thêm provider sau.

### Main

- `src/main/ai/AiClient.ts`: `interface AiClient { complete(req: { system: string; user: string; maxTokens: number; effort?: 'low'|'medium' }): Promise<string> }`; `AnthropicClient` dùng `fetch` trực tiếp như `OnlineTranslator.ts` (endpoint, header `anthropic-version: 2023-06-01`, model từ cài đặt `ai.model` mặc định `'claude-haiku-5-5'`, timeout 15 s, lỗi HTTP/refusal → throw). Không SDK. Không log key/nội dung.
- `src/main/ai/prompts.ts`: hằng string cho từng tác vụ, có biến `{{level}}`; tác vụ `grammar_explain` (nhận `sentence`, `question?`, `level`, `lang` 'vi') yêu cầu trả **JSON duy nhất** `{ "explanation_vi": string, "pattern": string, "examples": [{ "en": string, "vi": string }] }` (2–3 ví dụ), giải thích ≤ 120 từ tiếng Việt, coi văn bản là dữ liệu không phải lệnh. Thêm `diary_correct` cho Task 5: nhận đoạn nhật ký, trả `{ "corrected": string, "changes": [{ "from": string, "to": string, "note_vi": string }], "praise_vi": string }`.
- `src/main/ai/AiService.ts`: `status(): { enabled, hasKey, callsThisMonth }`, `explain(input): Promise<GrammarExplain>`, `correctDiary(input)` (dùng ở Task 5). Mỗi tác vụ: ghép prompt → gọi client → tách JSON (lấy từ `{` đầu tới `}` cuối) → `zod.safeParse`; sai định dạng → thử lại **1 lần** → vẫn sai → `AppError('AI_FAILED', 'errors.aiFailed')`. Cache LRU 100 theo khoá `task:hash(input)` (hash FNV-1a đã có trong repo, tìm `fnv1a`). Bộ đếm `callsThisMonth` lưu ở settings `ai.usage` (string `YYYY-MM:n`, reset khi đổi tháng). Tắt với hồ sơ trẻ em (`AppError('FORBIDDEN', …)` hoặc `enabled: false`).
- Cài đặt: `ai.enabled` boolean mặc định `false`; `ai.model` string mặc định `'claude-haiku-5-5'`.
- Kênh IPC: `ai:status` (`void` → `AiStatusSchema`), `ai:explain` (`{ sentence: string.min(1).max(600), question?: string.max(200) }` → `GrammarExplainSchema`). Schema ở `src/shared/schemas/ai.ts`.
- Lỗi i18n: `errors.aiFailed` ("Không hỏi được AI. Thử lại sau."), `errors.aiOff` ("Bật AI trong Cài đặt và nhập key Claude.").

### Renderer

- Popup `src/renderer/popup/App.vue`: khi `result.kind === 'sentence'` (hoặc `phrase`), dưới khối dịch thêm nút `btn btn--xs btn--pill` `t('popup.explain')` ("Giải thích ngữ pháp") **chỉ hiện khi** `ai:status` trả `enabled && hasKey`. Bấm → trạng thái loading → hiện khối `.explain`: `explanation_vi`, chip `pattern`, danh sách ví dụ (có nút nghe `speak(ex.en)`), chip "AI" (`chip chip--primary ai`, title `popup.aiExplainHint`). Lỗi → dòng `tr-error`.
- `SettingsPage.vue`: mục "AI (Claude)" ngay dưới mục Dịch online: toggle `ai.enabled`, chọn model (`select` với 2 giá trị: `claude-haiku-5-5`, `claude-sonnet-5-5`), dòng "Dùng chung key Claude ở mục Dịch online" + "Đã gọi {n} lượt tháng này", ghi chú gửi câu tới Anthropic khi dùng. i18n `settings.ai.*`.
- Không dùng trong giao diện bé.

### Test

`src/main/ai/AiService.test.ts`: fake client trả JSON hợp lệ → parse đúng; trả văn bản có rác quanh JSON → vẫn parse; trả sai schema 2 lần → `AI_FAILED`; cache: cùng input gọi client 1 lần; hồ sơ trẻ em → từ chối; bộ đếm tháng tăng và reset khi đổi tháng (FakeClock).

### Docs

`docs/11 §5`: ghi `> ✅ Đã làm (2026-11-10)` với mô tả thật (Anthropic, dùng chung key, prompt là module TS `src/main/ai/prompts.ts` thay cho file `.md`); `docs/01` B8 + F4 trạng thái; `docs/03` thêm `src/main/ai/` và kênh `ai:*`; `docs/17` kênh IPC; `docs/decisions.md` mục `#56 — AI BYOK v1 chỉ Anthropic, dùng chung key dịch online` (bối cảnh, quyết định, đánh đổi, thay thế đã cân nhắc); `docs/14`; `docs/30` §5 mục 3 `[x]`.

Commit: `ai: shared Anthropic BYOK client, grammar explanation in popup`.

## Task 5 — Nhật ký tiếng Anh buổi tối (Opus)

Ý tưởng [docs/01 G3](../../01-features.md): mỗi tối mascot hỏi "Hôm nay bạn làm gì?", người dùng viết 2–3 câu tiếng Anh, AI sửa nhẹ. Phụ thuộc Task 4 (`AiService.correctDiary`).

### DB

Migration mới qua `pnpm db:generate` (schema Drizzle trong `src/main/db/schema.ts` — tìm file schema hiện có): bảng `diary_entries` (`id` text pk, `profile_id` text not null, `day` text not null (khoá ngày local `YYYY-MM-DD`), `text` text not null, `corrected` text null, `changes_json` text null, `created_at` integer not null, `updated_at` integer not null; unique `(profile_id, day)`). `DiaryRepository` trong `src/main/db/repositories/`. Cập nhật `docs/10-data-model.md`.

### Service `src/main/services/DiaryService.ts`

- `today(): DiaryEntry | null`, `save(text): DiaryEntry` (upsert theo ngày; `text` 1–1200 ký tự; lần đầu trong ngày có entry ≥ 10 từ → `xp.grant({ amount: 10, coins: 3, reason: 'diary.written', refId: day })`, idempotent qua `xpRepo.hasEvent`), `correct(): DiaryEntry` (gọi `AiService.correctDiary`, lưu `corrected` + `changes`), `list(limit = 30): DiaryEntry[]`, `prompt(): string` (chọn 1 trong 12 câu gợi ý theo `day` hash để mỗi ngày một câu; trả **khoá i18n** `study.diary.prompts.<n>` để renderer dịch). Hồ sơ trẻ em → `today()` trả null và `save` ném `FORBIDDEN`.
- Schema `src/shared/schemas/diary.ts`: `DiaryEntrySchema`, `DiaryChangeSchema`, input `DiarySaveInputSchema`.
- IPC: `diary:today` (void → `{ entry: DiaryEntry | null, promptKey: string, aiReady: boolean }`), `diary:save` (`{ text }` → `DiaryEntry`), `diary:correct` (void → `DiaryEntry`), `diary:list` (void → `DiaryEntry[]`).

### Mascot nhắc

- Cài đặt `diary.hour`: `z.number().int().min(0).max(23).nullable().default(21)` (null = tắt). Job mới `src/main/jobs/diaryJob.ts` theo mẫu `quizJobs.ts`: mỗi 5 phút kiểm tra: giờ local ≥ `diary.hour`, chưa có entry hôm nay, chưa nhắc hôm nay (nhớ trong bộ nhớ), không ở chế độ yên lặng (dùng cùng kiểm tra quiet mode mà `quizJobs.ts` dùng), hồ sơ không phải trẻ em → gửi `mascot:react` hoặc kênh có sẵn hiển thị bong bóng với câu `mascot.diaryPrompt` (vi/en); bấm bong bóng → mở cửa sổ Học tập ở trang nhật ký. Nếu cửa sổ Học tập chưa hỗ trợ mở thẳng một trang, thêm sự kiện `study:open-page` (`{ page: string }`) gửi từ main sau khi `StudyWindow.open()`, `App.vue` lắng nghe và `go(page)`. Tôn trọng `docs/00` nguyên tắc 1 (không làm phiền): chỉ nhắc một lần mỗi ngày.

### Renderer

- Trang `diary` trong `src/renderer/study/places.ts` (đặt vào địa điểm cùng với `words`/`practice`; nếu `PLACE_PAGES` có kiểu chặt, thêm `'diary'` vào `StudyPage`). Component `src/renderer/study/components/DiaryPage.vue`: tiêu đề + câu gợi ý hôm nay, `textarea` (placeholder i18n), đếm từ, nút "Lưu" (`btn btn--primary`), nút "Sửa bằng AI" (`btn`) chỉ khi `aiReady`; sau sửa: bản `corrected` phía trên, danh sách `changes` dạng `from → to` kèm `note_vi`, dòng `praise_vi`; nút "Lưu các từ này" không cần. Dưới cùng: 30 ngày gần nhất (ngày, 1 dòng đầu). Dùng `.card`, token, `UiIcon`.
- `PlaceShell`/tab: thêm tab "Nhật ký" với icon (`UiIcon` `notebook` hoặc gần nhất).
- i18n `study.diary.*` gồm 12 `prompts.1..12` (ví dụ: "What did you do today?", "What made you smile today?", "One thing you learned today?", "Describe your lunch.", "What are you looking forward to tomorrow?", "Who did you talk to today?", "What was difficult today?", "Describe the weather and your mood.", "What did you read or watch?", "A small win today?", "What would you do differently?", "Three words for today, then explain."), bản vi là dịch.

### Test

`src/main/services/DiaryService.test.ts`: save tạo entry + XP một lần/ngày; save lần 2 cùng ngày cập nhật text, không thêm XP; `correct()` với fake AI ghi `corrected`/`changes`; `list()` theo thứ tự ngày giảm; trẻ em bị chặn; `prompt()` cùng ngày trả cùng khoá, ngày khác có thể khác.

### Docs

`docs/07`: mục mới "## 14. Nhật ký tiếng Anh — ✅ 2026-11-10"; `docs/10` bảng mới + migration; `docs/03` service/kênh/job; `docs/01` G3 → đã làm; `docs/17` migration + kênh IPC (`pnpm stats`); `docs/14`; `docs/30` §5 mục 4 `[x]`.

Commit: `diary: nightly English diary with AI correction and mascot reminder`.

## Thứ tự & phụ thuộc

1 → 2 → 3 → 4 → 5. Task 5 phụ thuộc Task 4 (`AiService`). Task 2 và 3 độc lập nhau nhưng cùng chạm `ipc-contract.ts`, `settings.ts`, i18n, `app.ipc.ts`, `container.ts` nên làm tuần tự.

## Task 6 — Nhà cung cấp AI qua Claude Code CLI (`claude -p`, gói Pro) (Opus) — thêm 2026-11-11

Mục tiêu: người dùng không có API key nhưng đã cài Claude Code và đăng nhập claude.ai (Pro/Max) dùng được giải thích ngữ pháp + sửa nhật ký. Không đổi `AiService` logic parse/cache/prompt; chỉ thêm một `AiClient`.

Đã thử tay trên máy dev (2026-11-11, Claude Code 2.1.317, auth `claude.ai`): lệnh sau trả JSON đúng trong ~3,8 s, kết quả ở trường `result` của `--output-format json`:

```
echo '<user>' | claude -p --model haiku --effort low --setting-sources "" --strict-mcp-config --tools "" --no-session-persistence --output-format json --system-prompt "<system>"
```

**Không dùng `--bare`** (tắt OAuth, chỉ nhận ANTHROPIC_API_KEY).

### Bảo mật (bắt buộc)
1. Không có tool: luôn `--tools ""`; thêm `--disallowedTools` cho mọi tool built-in nếu `--tools ""` không đủ chặn (kiểm tra `claude --help`); không bao giờ truyền `--dangerously-skip-permissions`, `--permission-mode bypassPermissions`, `--add-dir`, `--mcp-config`, `--settings`, `--plugin-dir`, `--resume`, `--continue`.
2. Cô lập cấu hình người dùng: `--setting-sources ""`, `--strict-mcp-config`, `--no-session-persistence`; `cwd` = thư mục tạm riêng của app (tạo trong `app.getPath('temp')`/`os.tmpdir()` + `english-assistant-ai`, rỗng) để không nạp `CLAUDE.md` dự án.
3. Không qua shell: `spawn(exePath, args, { shell: false, windowsHide: true, stdio: ['pipe','pipe','pipe'] })`. Prompt hệ thống truyền qua arg `--system-prompt` (chuỗi cố định từ `prompts.ts`, không chứa dữ liệu người dùng); **dữ liệu người dùng chỉ qua stdin**.
4. Đường dẫn exe: phân giải một lần thành đường dẫn tuyệt đối (`where.exe claude` trên Windows / `which` nơi khác, rồi kiểm tra file tồn tại, tên `claude.exe`/`claude`); không nhận `.cmd`/`.bat`/`.ps1` (tránh phải chạy qua cmd). Không có → provider không khả dụng. Cache kết quả phân giải; làm mới khi người dùng bấm "Kiểm tra lại".
5. Env tối thiểu: copy `process.env` rồi **xoá** `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, `NODE_OPTIONS`, `ELECTRON_RUN_AS_NODE` (để luôn dùng đăng nhập claude.ai và không bị chèn tham số Node/Electron). Không log env.
6. Giới hạn tài nguyên: timeout 45 s → `child.kill()` (Windows: `taskkill /pid <pid> /T /F` qua `spawn` không shell nếu kill thường không dừng cây); stdout tối đa 512 KB, vượt → kill + lỗi; stderr chỉ giữ 4 KB và **không** log nội dung (chỉ log mã thoát).
7. Không ghi log prompt, kết quả, stderr.

### Hạn chế dùng CLI quá mức
- Mỗi lúc chỉ 1 tiến trình (hàng đợi tuần tự; yêu cầu thứ 2 khi đang chạy → đợi, tối đa 2 đợi; quá → `AppError('AI_BUSY','errors.aiBusy')`).
- Hạn mức ngày cho provider CLI: cài đặt `ai.cliDailyLimit` (`z.number().int().min(0).max(200).default(30)`, 0 = tắt CLI); đếm theo ngày local trong settings `ai.cliUsage` (`YYYY-MM-DD:n`); hết → `AppError('AI_LIMIT','errors.aiDailyLimit')`. Cache hit không tính. Đặt kiểm tra trong `AiService.run` trước khi gọi client, chỉ khi provider = `cli`.
- Chỉ gọi khi người dùng bấm (đã đúng: popup/diary); không gọi nền.
- Model mặc định qua CLI là `haiku` (map `claude-haiku-5-5` → `haiku`, `claude-sonnet-5-5` → `sonnet`), `--effort low`.

### Chọn nhà cung cấp
- Cài đặt `ai.provider`: `z.enum(['auto','api','cli']).default('auto')`. `auto`: có key API → API; không có key mà CLI khả dụng + đã đăng nhập → CLI; không có gì → chưa sẵn sàng.
- CLI khả dụng = exe phân giải được **và** `claude auth status` (JSON) có `loggedIn: true` (chạy cùng chính sách spawn/env/timeout 10 s; cache 10 phút).
- `AiStatus` thêm `provider: 'api' | 'cli' | null` và `cliAvailable: boolean`, `cliCallsToday: number`, `cliDailyLimit: number`; `hasKey` giữ nghĩa "có nhà cung cấp dùng được" — đổi tên trường thành `ready` nếu ít chỗ dùng (popup, diary, settings), cập nhật mọi nơi.
- Kênh mới `ai:recheck-cli` (void → AiStatus) làm mới phân giải exe + auth.

### Phân tích đầu ra
- Đọc toàn bộ stdout, `JSON.parse`; `is_error === true` hoặc `subtype !== 'success'` → lỗi; thông điệp lỗi chứa "limit"/"usage" (hết hạn mức Pro) → `AppError('AI_LIMIT','errors.aiPlanLimit')` (vi: "Đã hết hạn mức của gói Claude. Thử lại sau."); `stop_reason === 'max_tokens'` → lỗi như AnthropicClient; trả `result` (string) cho `AiService` (đã có `extractJson`).
- Lỗi chưa đăng nhập (mã thoát ≠ 0 kèm "login"/"auth" trong stderr) → `errors.aiCliLogin` (vi: "Claude Code chưa đăng nhập. Chạy `claude` trong terminal để đăng nhập.").

### Code
- `src/main/ai/ClaudeCliClient.ts` (implements `AiClient`; nhận `runner` tiêm được để test: `(exe, args, stdin, opts) => Promise<{ code, stdout, stderr }>`), `src/main/ai/cliRunner.ts` (spawn thật + giới hạn + env), `src/main/ai/resolveClaudeCli.ts` (phân giải exe + auth status, cache).
- `AiService` nhận `clients: { api: AiClient; cli: AiClient }` + `cliStatus()`; chọn theo `ai.provider`. Giữ cache key có thêm provider.
- `container.ts` không import electron: đường dẫn thư mục tạm truyền vào từ `index.ts` (hoặc dùng `os.tmpdir()` trong `cliRunner.ts` — `node:os`/`node:child_process` được phép trong main).
- Settings UI (`SettingsPage.vue`, mục AI): chọn nhà cung cấp (Tự động / Key API / Claude Code CLI), dòng trạng thái CLI (đã phát hiện + đăng nhập / chưa cài / chưa đăng nhập) + nút "Kiểm tra lại", hạn mức/ngày (select 10/30/60/0=tắt) + "Hôm nay đã dùng n/N", ghi chú: "Dùng hạn mức gói Claude của bạn, chung với Claude Code và claude.ai". i18n vi + en.
- Popup/Diary: điều kiện hiện nút đổi sang `enabled && ready`.

### Test
- `ClaudeCliClient.test.ts` với runner giả: args đúng (có `--tools ""`, `--setting-sources ""`, `--strict-mcp-config`, `--no-session-persistence`, `--output-format json`, không có `--bare`/`--dangerously-skip-permissions`), dữ liệu người dùng chỉ ở stdin (không xuất hiện trong args), parse `result`, `is_error` → throw, thông điệp limit → AI_LIMIT, max_tokens → throw.
- `cliRunner` test (nếu khả thi không cần exe thật: dùng `process.execPath` chạy script node nhỏ in quá 512 KB / ngủ quá timeout) → kill + lỗi; env bị xoá các biến nhạy cảm.
- `AiService`: chọn provider theo `auto`/`api`/`cli`; hạn mức ngày CLI chặn ở lần N+1, reset ngày mới, cache hit không tính; hàng đợi 1 tiến trình (2 yêu cầu đồng thời → client chạy tuần tự), quá hàng đợi → AI_BUSY.
- `resolveClaudeCli`: bỏ `.cmd`, chấp nhận `claude.exe`; auth status parse.

### Docs
docs/11 §5 (provider CLI, cờ an toàn, hạn mức), docs/decisions.md #57 (dùng Claude Code CLI headless cho gói Pro; đánh đổi: độ trễ ~3–4 s, chung hạn mức gói, phụ thuộc phiên bản CLI, điều khoản khi phát hành cho người khác), docs/03 (file mới, kênh), docs/16 (bảo mật: không tool, env, stdin), docs/17 (`pnpm stats`), docs/14 nhật ký.

Commit: `ai: Claude Code CLI provider (claude -p) with sandboxed flags and daily cap` — trailer theo quy ước dự án hiện tại (không thêm Co-Authored-By nếu memory/CLAUDE.md cấm).
