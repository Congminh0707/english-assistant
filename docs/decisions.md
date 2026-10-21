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

## #9 — Nền tảng Phase 1: IPC tách tên kênh, settings theo scope, menu gốc Windows (2026-10-18) — Chấp nhận
**Quyết định:**
- Tên kênh IPC nằm ở `ipc-channels.ts` (không dependency), schema zod ở `ipc-contract.ts`. Lý do: preload chạy sandbox, không `require` được `zod`; tách ra để preload vẫn kiểm tra được tên kênh.
- Bảng `settings` dùng khoá chính `(scope, key)` với `scope = 'global' | <profile id>` thay vì `profile_id NULL` (SQLite coi các NULL là khác nhau nên khoá chính không chặn trùng).
- `better-sqlite3` v13 (N-API, có binary dựng sẵn) → test chạy bằng Vitest trong Node, không cần chạy Vitest bằng Electron hay `electron-rebuild`.
- Menu chuột phải của mascot dùng **menu gốc của Windows** (`Menu.popup`) thay vì vẽ bằng Vue: quen thuộc, không bị cắt bởi kích thước cửa sổ mascot. Vì cửa sổ mascot `focusable: false`, tạm bật focusable trong lúc menu mở để menu đóng đúng khi click ra ngoài.
- Câu thoại mascot nằm trong i18n (`mascot.lines.*`, mảng nhiều biến thể); main chỉ gửi loại phản ứng (`mascot:react`), renderer chọn câu & animation.

**Hệ quả:** container/services/repositories không được import `electron` (để test trong Node); phần phụ thuộc Electron nối ở `src/main/index.ts`.

## #10 — Script pipeline nội dung dùng `node:sqlite` + `fflate` (2026-10-18) — Chấp nhận
**Bối cảnh:** `content:build` phải ghi `content.db` (SQLite + FTS5) và nén thành `.eapack`. App dùng `better-sqlite3` — native module được `electron-builder install-app-deps` rebuild cho ABI của Electron, nên chạy nó bằng Node thường trong script dễ lỗi "was compiled against a different Node.js version".
**Quyết định:** Script dùng `node:sqlite` (`DatabaseSync`, có sẵn trong Node 22, có FTS5) để ghi/đọc `content.db`; `fflate` (MIT, JS thuần) để zip theo luồng; `seek-bzip` (MIT) giải nén dump Tatoeba; chạy bằng `tsx`. Schema dùng chung đặt ở `src/shared/schemas/content/` (zod).
**Lý do:** Không cần build native cho script, không đụng tới binary `better-sqlite3` của app; file `content.db` là SQLite chuẩn nên app vẫn mở bằng `better-sqlite3` (read-only) như kế hoạch.
**Hệ quả:** `node:sqlite` còn gắn nhãn experimental (in cảnh báo khi chạy) — chỉ dùng trong script build, không dùng trong app. Nếu API đổi, chỉ phải sửa `scripts/content/build.ts`, `validate.ts`, `lookup.ts`.

## #11 — Sinh nghĩa tiếng Việt thiếu bằng Claude lúc build, lưu thành file curated (2026-10-18) — Chấp nhận
**Bối cảnh:** 2.762 từ trong top 10k không có nghĩa Việt nào từ Wiktionary; docs/08 §3 chọn sinh nghĩa ngắn bằng LLM lúc build rồi duyệt.
**Quyết định:** Lệnh `pnpm content:enrich vi` gọi Claude API (`@anthropic-ai/sdk`, devDependency; mặc định `claude-opus-5-5`, structured outputs + zod), kết quả ghi vào `content/curated/vocab/vi-generated.json` (commit, khoá = word id, `source.id = "generated"`, `generatedBy = model@ngày`, `review.status`). Stage `merge` chỉ đọc file này — không gọi API — và chỉ dùng cho từ không có nghĩa Wiktionary. Key chỉ lấy từ `ANTHROPIC_API_KEY`; có `--dry-run` và `--import` để chạy không cần key.
**Lý do:** Build lặp lại được và không tốn tiền/không cần mạng (API chỉ chạy một lần cho mỗi từ, idempotent); người duyệt sửa trực tiếp file JSON qua PR; nghĩa đã duyệt không bao giờ bị ghi đè khi chạy lại.
**Hệ quả:** Bản build dev chứa nghĩa `draft`; `content:validate --release` chặn phát hành khi còn nghĩa AI sinh chưa `approved`. Đổi model/prompt không tự sinh lại các mục cũ — muốn sinh lại phải xoá mục.

## #12 — Dịch câu offline bằng opus-mt trong utilityProcess, model tải về có xác minh (2026-10-19) — Chấp nhận
**Bối cảnh:** App phải miễn phí, hạn chế phụ thuộc API tốn tiền; dịch cả câu là tính năng còn thiếu của popup.
**Quyết định:** Dịch en→vi bằng **Helsinki-NLP opus-mt** (bản ONNX lượng tử hoá 8-bit của Xenova, Apache-2.0, ~107 MB) qua `@huggingface/transformers` (4.3.1) + `onnxruntime-node`, chạy trong **utilityProcess** (`src/main/translate/worker.ts` → `out/main/translateWorker.js`), tự tắt sau 5 phút rảnh. Model **không nằm trong bộ cài**: người dùng bấm "Tải model" trong popup (đồng ý rõ ràng), `ModelManager` tải từ Hugging Face đúng revision đã ghim, **kiểm tra kích thước + sha256 từng file** trước khi dùng, lưu ở `userData/models/`. Worker đặt `allowRemoteModels = false` — không bao giờ tự tải từ mạng. Văn bản được tách từng câu (`src/shared/sentences.ts`) vì model hay bỏ sót câu sau khi nhận cả đoạn. LLM (API) chỉ là phương án mở rộng sau, không phải mặc định.
**Lý do:** Miễn phí, riêng tư (văn bản không rời máy), ~0,3–0,5 giây/câu sau khi nạp model; tách tiến trình để mascot không bị đơ; xác minh hash vì đây là file tải từ ngoài và được nạp vào bộ chạy ONNX.
**Hệ quả:** `pnpm-workspace.yaml` không cho chạy script cài của `onnxruntime-node`/`protobufjs` (binary đã có sẵn trong gói npm). Bản cài **chỉ giữ binary Windows x64** của onnxruntime-node và bỏ `onnxruntime-web` (`electron-builder.yml`); thư viện native nằm ngoài asar (`asarUnpack`) → bộ cài tăng khoảng 60–70 MB. Chất lượng trung bình (ví dụ "dental appointment" dịch sai) → giao diện gắn nhãn "Máy dịch". Chỉ hỗ trợ en→vi; vi→en là model thứ hai làm sau.

## #13 — Bài luyện tập sinh từ câu Tatoeba có bản dịch + từ vựng trong gói từ điển (2026-10-19) — Chấp nhận
**Bối cảnh:** Chưa có kho bài tập soạn tay; gói `core-dictionary` đã có ~17k câu Tatoeba có bản dịch Việt, gắn level và liên kết với từ.
**Quyết định:** `PracticeService` sinh phiên 10 bài tại chỗ: điền từ (đáp án nhiễu cùng loại từ, gần level), sắp xếp câu, nghe chọn nghĩa, nghe chép, ghép từ–nghĩa. Đáp án chỉ ở main (chấm ở main); văn bản câu nghe/chép phải gửi sang renderer để TTS đọc (không phải ranh giới bảo mật — là máy của chính người dùng). XP: 5 + số bài đúng và 5 xu mỗi phiên, tối đa 5 phiên/ngày được thưởng.
**Lý do:** Không cần soạn/duyệt nội dung mới, giấy phép đã rõ (Tatoeba CC BY 2.0 FR trong pack), dùng được ngay mọi level; câu thật thay vì câu máy sinh.
**Hệ quả:** Chất lượng phụ thuộc Tatoeba (câu đôi khi lạ, bản dịch đôi khi lỏng); bài đọc hiểu, ngữ pháp có giải thích, nghe bằng audio thật vẫn cần nội dung soạn riêng sau. Profile trẻ em lọc câu chứa từ nhạy cảm.

> **Cập nhật 2026-10-19:** thêm chiều vi→en (`Xenova/opus-mt-vi-en`, revision và sha256 ghim trong `modelFiles.ts`). Chiều dịch tự nhận theo chữ có dấu tiếng Việt; mỗi chiều một model tải riêng, có thể xoá trong Cài đặt (xoá thì tắt tiến trình nền trước để nhả file). Kênh IPC `translate:*` nhận `direction`; thêm `translate:remove`.

## #14 — Giọng đọc tự nhiên offline bằng Kokoro-82M, tuỳ chọn song song với giọng Windows (2026-10-19) — Chấp nhận (kèm rủi ro giấy phép)
**Bối cảnh:** Giọng `speechSynthesis` của Windows khác nhau giữa các máy, đôi khi ra giọng Anh ("zed") và đọc kém chữ cái đơn — ảnh hưởng bài phát âm. App phải miễn phí, hạn chế API tốn tiền.
**Quyết định:** Thêm **Kokoro-82M** (Apache-2.0, bản ONNX lượng tử hoá 8-bit, ~92 MB) làm tuỳ chọn "Giọng tự nhiên" trong Cài đặt; mặc định vẫn là giọng Windows. Chạy trong **utilityProcess riêng** (`src/main/tts/worker.ts` → `out/main/ttsWorker.js`) qua `kokoro-js` + `@huggingface/transformers` dùng chung bản 4.3.1 với dịch câu (ép bằng `overrides` trong `pnpm-workspace.yaml` để không nhân đôi onnxruntime). Model **không nằm trong bộ cài**: người dùng bấm "Tải model", `ModelManager` tải đúng revision đã ghim và kiểm tra sha256 (dùng chung `ModelInstaller` với dịch câu). Âm thanh tạo ra được lưu **bộ nhớ đệm trên đĩa** (`userData/tts-cache`, khoá = giọng + tốc độ + văn bản) nên nghe lại tức thì; `prefetch` tạo trước ở nền cho ví dụ/bài tập của bài học (nhường chỗ khi người dùng bấm nghe). Lỗi hoặc model chưa sẵn sàng → tự rơi về giọng Windows. 8 giọng chọn lọc (Mỹ: Heart, Bella, Michael, Fenrir; Anh: Emma, Isabella, George, Fable); chỉ giữ giọng tiếng Anh trong bộ cài.
**Đo thực tế (CPU máy dev, trong Electron, cả layout đóng gói):** ~0,9 giây cho một từ, ~2 giây cho câu ngắn (~0,85× thời gian thực), lần đầu +~3 giây nạp model; bộ cài tăng thêm ~20 MB.
**Hệ quả / rủi ro:**
- ⚠️ `phonemizer` (npm, Apache-2.0) **đóng gói eSpeak-NG dạng WASM — eSpeak-NG là GPL-3.0**. Dự án hiện là MIT, mã nguồn mở, chưa thương mại; nhưng **trước khi phân phối thương mại phải giải quyết**: (a) chuyển eSpeak WASM thành tệp tải về khi người dùng bật giọng tự nhiên (không đóng trong bộ cài) và ghi nguồn/giấy phép GPL, hoặc (b) thay bằng bộ phiên âm khác (ví dụ G2P dựa trên CMUdict đã có trong pipeline), hoặc (c) xin ý kiến pháp lý. Xem [08 §9](08-content-sources.md).
- Kokoro huấn luyện trên dữ liệu "permissive/non-copyrighted" gồm cả giọng tổng hợp từ TTS đóng và âm thanh CC BY (Koniwa CC BY 3.0, SIWIS CC BY 4.0) → ghi công trong Cài đặt → "Giấy phép & ghi công" (đã làm).
- Giọng nói chất lượng khác nhau theo giọng (bảng đánh giá của Kokoro: Heart A, Bella A-, Emma B-, Michael C+, George C).
- Câu mới nghe lần đầu có độ trễ 1–3 giây (rồi được lưu); khi hết nội dung cố định có thể sinh sẵn audio lúc build để tức thì.

## #15 — Bài đọc, ngữ pháp, bài học nền tảng dùng chung một cơ chế "lesson" (2026-10-19) — Chấp nhận
**Bối cảnh:** Phase 2 cần bài đọc tương tác, trang ngữ pháp và thêm dạng bài tập; mỗi thứ đều là "nội dung tự soạn có giải thích + bài tập chấm tại chỗ + tiến độ + thưởng lần đầu đạt" — giống hệt bài học nền tảng đã có.
**Quyết định:** Mở rộng thay vì viết dịch vụ mới: `LessonLibrary` nhận schema theo loại (`ReadingUnitFileSchema`, `GrammarUnitFileSchema`), `LessonService` được tạo ba bản (`lessons`, `grammar`, `readings`), các kênh `lesson:*` nhận thêm `kind`, `LessonsPage.vue` nhận prop `kind`. Thêm block `passage` (đoạn văn tương tác) và hai dạng bài tập `tf`, `picture` vào schema bài học. Tiến độ dùng chung bảng `lesson_progress` (id không trùng giữa các loại — có test) nên không cần migration. Mẫu câu giao tiếp và ngân hàng placement là thư viện riêng vì không có bài tập/tiến độ.
**Lý do:** Ít code mới, giao diện và thưởng nhất quán, thêm loại nội dung sau này chỉ cần thêm thư mục + schema.
**Hệ quả:** "Số bài đã học" (thành tựu, thống kê) đếm cả bài đọc và ngữ pháp. Thưởng XP bài đọc/ngữ pháp bằng bài học (15 XP, 5 xu, +5 nếu 100%).

## #16 — Thưởng khi mở khoá thành tựu (2026-10-19) — Chấp nhận
**Quyết định:** `AchievementService` tính thành tựu từ thống kê (không bảng riêng) và ghi sổ XP `reason = achievement.unlocked`, `refId = <id thành tựu>` để mỗi hồ sơ chỉ nhận một lần; thưởng theo hạng (đồng 20 XP/5 xu … kim cương 300/60). Lần đầu sau khi cập nhật sẽ thưởng bù các thành tựu đã đạt và báo gộp một thông báo ở mascot.

## #17 — Thẻ phụ tự tạo khi từ đã thuộc (2026-10-19) — Chấp nhận
**Bối cảnh:** Thẻ chỉ có một dạng (thấy từ → nhớ nghĩa) — nhận diện dễ hơn nhớ lại chủ động; schema `srs_cards.direction` đã có sẵn nhiều hướng.
**Quyết định:** Chỉ thẻ gốc `en_vi` được tạo khi lưu từ. Khi thẻ gốc vào ôn dài hạn, `SrsService.ensureSiblings` tạo `vi_en`, `audio_en`, `cloze` (đến hạn từ ngày mai), mỗi loại bật/tắt trong cài đặt; có "tạo thẻ bù" cho từ đã thuộc. Hạn mức từ mới/ngày chỉ tính thẻ gốc chưa học để thẻ phụ không bị kẹt. Mascot chỉ hỏi thẻ `en_vi`. Thẻ không dựng được nội dung (câu điền từ không còn chứa từ) tự rơi về dạng `en_vi`.
**Lý do:** Cách của Anki ("sibling mở khoá sau khi học") — không nhân đôi khối lượng ngay từ đầu, từ nào thuộc rồi mới được kiểm tra sâu hơn.
**Hệ quả:** "Tổng số thẻ" và số thẻ theo trạng thái tính cả thẻ phụ (Sổ từ vẫn hiện một dòng mỗi từ); từ hay quên cộng dồn số lần quên của mọi hướng; hoàn tác không thu hồi XP (sổ XP chỉ ghi thêm).

## #18 — Chế độ trẻ em: giao diện riêng, thẻ nghe–chạm hình, hình pixel tự vẽ, PIN phụ huynh (2026-10-19) — Chấp nhận
**Bối cảnh:** Trẻ chưa biết đọc không dùng được giao diện chữ (thanh bên, thẻ lật tự chấm 4 mức, đoạn giải thích tiếng Việt); emoji hệ thống khác nhau giữa các máy và khó nhận ra khi nhỏ.
**Quyết định:**
- Hồ sơ `isChild` hiển thị `KidsApp` thay cho giao diện người lớn; mọi tương tác là chạm vào hình lớn, có đọc to bằng TTS. Phụ huynh vào khu vực người lớn qua ổ khoá + PIN 4 số (khoá chặn bấm nhầm, không phải bảo mật cao).
- Thẻ của trẻ là hướng `audio_picture` (đã dành sẵn trong schema), `content_id = 'pic:<hình>'` để không phụ thuộc gói từ điển; vẫn dùng FSRS: số lần thử (1/2/0) quy ra Được-Dễ / Khó / Quên, bé chỉ thấy cười hoặc thử lại. Thẻ trẻ và thẻ người lớn tách theo hướng (`REVIEW_DIRECTIONS` cho người lớn).
- **Hình pixel tự vẽ bằng code** (`src/shared/pictures.ts`, 60 hình): vẽ theo toạ độ 32×32 nhưng dựng trên lưới 64×64 ô (`Grid` có `scale`) rồi tự đổ sáng/tối và viền, vẽ SVG không làm mờ; nội dung cũ dùng emoji tự đổi sang hình pixel qua `PicText`. Không cần ghi công và không vướng bản quyền (các bộ Twemoji/OpenMoji/Fluent… đã cân nhắc, không chọn).
- Giới hạn thời gian là **theo ngày** (`kids.dailyMinutes`, mặc định 15 phút; 0 = tắt), đếm ở main từ báo cáo định kỳ của giao diện; hết giờ hiện màn hình nghỉ ngơi, phụ huynh nhập PIN để gia hạn 10 phút. Thêm bảng `usage_days` (migration `0005`).
- Phần thưởng cho bé là sticker (album) và đồ ăn cho thú cưng (tối đa 8 quà/ngày), không hiện số XP.
**Hệ quả:** Quên PIN chưa có cách đặt lại trong app. Âm đọc đơn lẻ của TTS (ví dụ "buh", "kuh") còn thô vì model giọng đọc không được huấn luyện cho âm đơn — cần audio thật sau này. Chưa có picture book, tập viết, nói lặp lại.

## #19 — Rating Elo theo kỹ năng và bài kiểm tra lên cấp (2026-10-20) — Chấp nhận
**Bối cảnh:** Level chung (A2.1...) không nói được người học yếu/mạnh ở đâu; placement chỉ chạy một lần.
**Quyết định:** 4 kỹ năng (từ vựng, ngữ pháp, đọc, nghe). Mỗi dạng bài của bài học/luyện tập được gán một kỹ năng (`shared/progress.ts`), mỗi lần làm bài ghi vào `exercise_stats` (độ chính xác theo ngày/dạng bài/kỹ năng) và cập nhật Elo (`skill_ratings`, độ khó = level của bài, K = 24 rồi 12 sau 30 câu, chia căn bậc hai số câu của một loạt). Rating khởi đầu lấy từ trình độ theo kỹ năng của bài kiểm tra đầu vào. Khi rating vượt level hiện tại ≥ 1 bậc (đủ ≥ 20 câu) Thống kê gợi ý làm **bài kiểm tra lên cấp**: 10 câu không thích nghi ở bậc kế tiếp, đạt ≥ 80% thì lên một bậc (lần đầu qua mỗi bậc thưởng 60 XP + 30 xu).
**Hệ quả:** Elo chỉ phản ánh bài tập có chấm (không tính thẻ SRS, vốn đo trí nhớ). Ngân hàng câu placement/checkpoint còn mỏng ở các bậc cao (cần soạn thêm).

## #20 — Thú cưng tiến hoá bằng sheet sinh từ code (2026-10-20) — Chấp nhận
**Quyết định:** `PetStage` (egg/baby/teen/adult/legend, theo level thú cưng) mỗi giai đoạn có sheet và phụ kiện riêng, cùng bố cục frame và `sheet.json`; `make-placeholder.mjs` sinh đủ cả 5 giai đoạn (kích thước thân, tai, bảng màu, nét trang trí). Mascot đổi sheet + phụ kiện khi đổi giai đoạn và nói một câu ăn mừng. Sheet baby giữ nguyên từng pixel so với bản cũ.
**Hệ quả:** Vẫn là sprite tạm — khi có art thật chỉ cần thay thư mục từng giai đoạn.

## #21 — Cập nhật tự động chỉ khi người dùng đồng ý, sao lưu DB trước khi migrate (2026-10-20) — Chấp nhận
**Quyết định:** `UpdateManager` bao `electron-updater` với `autoDownload = false`, `autoInstallOnAppQuit = false`; kiểm tra nền (tắt được), tải khi bấm nút, cài khi khởi động lại. Nguồn: GitHub Releases (`Congminh0707/english-assistant`). `openUserDb` sao lưu `user.db` trước khi chạy migration mới (giữ 3 bản).
**Lý do:** App chạy nền cạnh công việc của người dùng, không được tự đổi phiên bản sau lưng họ; cập nhật là lúc rủi ro nhất cho dữ liệu học nên cần bản sao lưu.
**Hệ quả:** Chưa ký số nên SmartScreen cảnh báo; đã thử cập nhật thật v1.0.0 → v1.0.1 (OK, 2026-10-21).

## #22 — Bài nghe dựa trên TTS, chưa sinh sẵn audio (2026-10-20) — Chấp nhận
**Bối cảnh:** Trình nghe cần phát từng câu, chỉnh tốc độ, lặp A–B; sinh sẵn audio lúc build (WAV 24 kHz) làm bộ cài phình (~50 KB/giây, 30 bài ≈ vài chục MB) và cần bộ nén (Opus) chưa có trong chuỗi công cụ.
**Quyết định:** Phát bằng TTS ngay trong app (giọng Windows hoặc Kokoro, có bộ nhớ đệm trên đĩa và tạo trước ở nền); người nói A/B dùng hai giọng Mỹ/Anh. Việc sinh sẵn audio lúc build để sau, gắn với chuyện chốt dung lượng và bộ mã hoá.
**Hệ quả:** Lần đầu nghe một câu bằng Kokoro có độ trễ 1–3 giây (rồi được nhớ); âm đơn lẻ cho phonics ("buh", "kuh") vẫn thô vì model không huấn luyện cho âm đơn.

## #23 — Nhiều nhân vật thú cưng, đều là thiết kế gốc (2026-10-20) — Chấp nhận
**Bối cảnh:** Người dùng muốn thêm 3–4 thú cưng (có nhắc Spider-Man) kèm tiến hoá và vật phẩm cửa hàng.
**Quyết định:** 4 nhân vật mới tự thiết kế (Webby nhện hero, Draco rồng, Robo, Kitsu cáo), mỗi con 5 giai đoạn. **Không dùng nhân vật/biểu tượng có bản quyền** (quy tắc AGENTS.md về nội dung): Webby chỉ gợi ý tưởng "anh hùng mặt nạ nhện" với màu, hoạ tiết và tên riêng. Nhân vật mua bằng xu như vật phẩm (`char:<id>` trong `inventory`) nên không cần migration; level/XP thuộc về hồ sơ, đổi nhân vật không mất tiến độ.
**Hệ quả:** Sprite vẫn là placeholder sinh bằng code (~1.5 MB cho 5 nhân vật × 5 giai đoạn × 12 sheet); thay bằng art thật chỉ cần giữ tên file/khung. Chưa có câu thoại riêng từng nhân vật.

## #24 — Sprite 96×96 vẽ bằng SDF + đổ bóng, thay khung 48 (2026-10-20) — Chấp nhận
**Bối cảnh:** Sprite 48×48 (hình elip phẳng, mặt vài pixel) bị đánh giá chưa đẹp; cần chi tiết gấp 3–4 lần và nhiều hoạt ảnh hơn.
**Quyết định:** Khung 96×96 (gấp 4 số pixel), vẽ bằng code: hình khối SDF + đổ bóng 5 tông (sáng ấm → tối lạnh) + dither Bayer + viền theo màu từng bộ phận; mặt có mắt kèm ánh sáng, má hồng, mũi/miệng theo cảm xúc; tay/chân/đuôi/cánh có hoạt ảnh; 20 hoạt ảnh/186 frame. Kích thước hiển thị vẫn tính theo khung 48 (`mascot.scale` × 48 px) nên `SpriteAnimator` thu 96→48/96/144 (làm mịn khi tỉ lệ lẻ). Phụ kiện có lớp sau lưng (`accb-*`) để áo choàng/cánh nằm sau thân.
**Hệ quả:** Bộ sheet ~16 MB trong repo/bộ cài (25 bộ × 12 phụ kiện); sinh lại mất ~80 giây. Vẫn là art sinh bằng code — họa sĩ thật thay được bằng cách giữ tên file/hoạt ảnh/khung.
