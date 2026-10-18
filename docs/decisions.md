# Nhật ký quyết định (Decision log)

Mỗi quyết định kiến trúc/công nghệ quan trọng ghi một mục. Không xoá mục cũ — nếu đổi ý, thêm mục mới và đánh dấu mục cũ là "Bị thay thế bởi #N".

Mẫu:
```
## #N — Tiêu đề (YYYY-MM-DD) — Trạng thái: Đề xuất | Chấp nhận | Bị thay thế bởi #M
**Bối cảnh:** ...
**Quyết định:** ...
**Lý do:** ...
**Hệ quả / đánh đổi:** ...
```

---

## #1 — Dùng Electron + Vue 3 + TypeScript (2026-10-18) — Chấp nhận
**Bối cảnh:** Dev chính mạnh Laravel/Vue, chưa làm desktop. Cần cửa sổ trong suốt, click-through, always-on-top, chạy AI local, nhiều thư viện.
**Quyết định:** Electron (scaffold electron-vite), renderer Vue 3 + Pinia + Tailwind, toàn bộ TypeScript.
**Lý do:** Một ngôn ngữ cho cả app; Vue tái sử dụng kỹ năng; hệ sinh thái npm lớn (SQLite, Whisper, OCR, FSRS); nhiều tài liệu & ví dụ desktop pet; AI hỗ trợ code tốt.
**Hệ quả:** Installer ~ 100 MB, RAM 150–300 MB. Chấp nhận. Nếu sau này cần nhẹ hơn, có thể chuyển lớp vỏ sang Tauri và giữ renderer Vue.
**Phương án bị loại:** Tauri (cần Rust), NativePHP (thêm lớp PHP, thiếu ví dụ mascot), WPF/WinUI (C#, không tái dùng Vue), Flutter (Dart).

## #2 — SQLite với better-sqlite3 + Drizzle ORM (2026-10-18) — Chấp nhận
**Quyết định:** `user.db` (đọc/ghi) + mỗi content pack một `content.db` (read-only). Drizzle cho schema/migration.
**Lý do:** Offline, một file, nhanh; Drizzle có migration & kiểu TS gần cảm giác Eloquent + migrations.
**Hệ quả:** `better-sqlite3` là native module → cần rebuild cho Electron (`electron-builder install-app-deps`).

## #3 — Cửa sổ mascot nhỏ di chuyển (thay vì overlay toàn màn hình) (2026-10-18) — Chấp nhận
**Bối cảnh:** Hai cách cho nhân vật đi lại: (A) cửa sổ nhỏ và di chuyển chính cửa sổ; (B) cửa sổ trong suốt phủ toàn màn hình, nhân vật di chuyển bằng CSS.
**Quyết định:** (A).
**Lý do:** Ít tài nguyên GPU, ít rủi ro chặn chuột nhầm, xử lý nhiều màn hình đơn giản hơn.
**Hệ quả:** Di chuyển cửa sổ ~30 lần/giây có thể hơi giật trên vài máy → chấp nhận cho pixel art fps thấp; xem lại nếu cần hiệu ứng vật lý phức tạp.

## #4 — Offline-first, AI là tuỳ chọn BYOK (2026-10-18) — Chấp nhận
**Quyết định:** Chức năng cốt lõi chạy offline (từ điển, SRS, bài đọc/nghe, opus-mt, Whisper local). LLM qua provider người dùng tự cấu hình (Ollama local / Claude / OpenAI / Gemini).
**Lý do:** Mục tiêu miễn phí, riêng tư, không phụ thuộc chi phí server.
**Hệ quả:** Chất lượng chấm Writing/Speaking khi không có LLM chỉ ở mức cơ bản.

## #5 — Nội dung đóng gói thành content pack tách khỏi app (2026-10-18) — Chấp nhận
**Quyết định:** Pack `.eapack` (zip: manifest + content.db + media + LICENSES), id nội dung là chuỗi ổn định.
**Lý do:** Cập nhật nội dung không cần cập nhật app; tách license (pack share-alike riêng); sau này Laravel Content Studio xuất cùng định dạng.

## #6 — Thang năng lực nội bộ 0–1200 + Elo (2026-10-18) — Chấp nhận
**Quyết định:** Một thang rating thống nhất từ mầm non tới C2, chia 12 bậc; cập nhật bằng Elo cho người học & độ khó item; track chỉ quyết định phong cách nội dung.
**Lý do:** Đơn giản, thích ứng, phủ được mọi đối tượng; ánh xạ sang CEFR/TOEIC/IELTS để hiển thị.

## #7 — Laravel chỉ dùng cho backend tuỳ chọn ở giai đoạn sau (2026-10-18) — Chấp nhận
**Quyết định:** Không có backend ở MVP. Phase 4: Laravel + Sanctum (sync API) + Filament (Content Studio).
**Lý do:** Tận dụng thế mạnh team ở đúng chỗ; app vẫn chạy độc lập.

## #8 — Dùng koffi gọi Win32 API thay vì get-windows (2026-10-18) — Chấp nhận
**Bối cảnh:** Chế độ yên lặng cần biết cửa sổ đang active có toàn màn hình không, nằm ở màn hình nào, có phải cửa sổ shell không; sau này cần thêm tên process (app họp).
**Quyết định:** Dùng `koffi` (FFI, MIT) gọi trực tiếp `GetForegroundWindow`, `GetWindowRect`, `MonitorFromWindow`, `GetMonitorInfoW`, `GetClassNameW`, `GetWindowThreadProcessId`, `SHQueryUserNotificationState` — gom trong `src/main/system/win32.ts`.
**Lý do:** koffi có binary dựng sẵn theo N-API (không cần biên dịch lại cho từng phiên bản Electron), kiểm soát được chính xác logic (so màn hình của mascot, loại trừ cửa sổ shell), và dùng lại được cho các nhu cầu Win32 khác. `SHQueryUserNotificationState` là API chính thức của Windows cho câu hỏi "có nên hiện thông báo không".
**Hệ quả:** Code Win32 chỉ chạy trên Windows (service tự tắt trên nền tảng khác). koffi cần được duyệt install script trong pnpm; electron-builder tự giải nén `koffi.node` ra `app.asar.unpacked`.

## #9 — Script pipeline nội dung dùng `node:sqlite` + `fflate` (2026-10-18) — Chấp nhận
**Bối cảnh:** `content:build` phải ghi `content.db` (SQLite + FTS5) và nén thành `.eapack`. App dùng `better-sqlite3` — native module được `electron-builder install-app-deps` rebuild cho ABI của Electron, nên chạy nó bằng Node thường trong script dễ lỗi "was compiled against a different Node.js version".
**Quyết định:** Script dùng `node:sqlite` (`DatabaseSync`, có sẵn trong Node 22, có FTS5) để ghi/đọc `content.db`; `fflate` (MIT, JS thuần) để zip theo luồng; `seek-bzip` (MIT) giải nén dump Tatoeba; chạy bằng `tsx`. Schema dùng chung đặt ở `src/shared/schemas/content/` (zod).
**Lý do:** Không cần build native cho script, không đụng tới binary `better-sqlite3` của app; file `content.db` là SQLite chuẩn nên app vẫn mở bằng `better-sqlite3` (read-only) như kế hoạch.
**Hệ quả:** `node:sqlite` còn gắn nhãn experimental (in cảnh báo khi chạy) — chỉ dùng trong script build, không dùng trong app. Nếu API đổi, chỉ phải sửa `scripts/content/build.ts`, `validate.ts`, `lookup.ts`.
