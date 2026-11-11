# 16 — Quyền riêng tư & bảo mật

App chạy thường trực trên máy, có thể đọc clipboard, nghe micro, chụp màn hình, biết app đang mở → **phải cực kỳ cẩn thận**. Người dùng có trẻ em.

## 1. Nguyên tắc quyền riêng tư

1. **Local trước tiên**: mọi dữ liệu học tập nằm trên máy. Không có analytics/tracking ẩn.
2. **Opt-in rõ ràng** cho mọi chức năng nhạy cảm, giải thích bằng ngôn ngữ đơn giản lúc bật.
3. **Tối thiểu hoá**: chỉ đọc cái cần, chỉ lưu cái cần, xoá sớm.
4. **Minh bạch**: màn hình Cài đặt → Quyền riêng tư liệt kê dữ liệu nào được lưu, gửi đi đâu, nút xoá.

## 2. Bảng chức năng nhạy cảm

| Chức năng | Mặc định | Dữ liệu | Lưu ở đâu / bao lâu | Gửi ra ngoài? |
|---|---|---|---|---|
| Đọc clipboard khi bấm phím tắt dịch | Bật (chỉ khi người dùng bấm) | Văn bản vừa copy | Không lưu, trừ khi bật "Lịch sử dịch" | Chỉ khi dùng dịch online (LLM) |
| Theo dõi clipboard liên tục | **Tắt** | Văn bản copy | Không lưu | Không (chỉ phát hiện tiếng Anh local) |
| Biết cửa sổ đang active | Bật (cho chế độ yên lặng) | Tên process + trạng thái fullscreen | Không lưu (chỉ dùng tức thời) | Không |
| Micro | Hỏi khi dùng module Nói | Audio (PCM trong bộ nhớ) → lời nhận dạng (chữ) | Âm thanh: không lưu (chỉ trong bộ nhớ đến khi Whisper nhận dạng xong); lời nhận dạng: không lưu | Âm thanh: **không bao giờ**. Lời nhận dạng (chữ): chỉ khi người học bấm "Nhận xét bằng AI" ở câu trả lời nói, gửi cho nhà cung cấp AI đang dùng |
| Chụp màn hình (OCR) | Chỉ khi người dùng bấm phím tắt & chọn vùng | Ảnh vùng chọn | Không lưu | Không (OCR local) |
| Lịch sử dịch | Bật, có thể tắt | Văn bản + bản dịch | `user.db`, xoá được | Không |
| Gửi lên LLM | Chỉ khi người dùng cấu hình AI | Văn bản/bài viết/transcript cần xử lý | Theo chính sách của provider | Có — hiện cảnh báo lần đầu |

- Bỏ qua clipboard có vẻ là **mật khẩu/dữ liệu nhạy cảm**: không chứa khoảng trắng & có ký tự đặc biệt dạng mật khẩu, chuỗi giống số thẻ/OTP/token → không xử lý, không lưu.
- **Không** theo dõi phím bấm (keylogger). Phát hiện "đang gõ liên tục" chỉ dựa trên thời gian không hoạt động của hệ thống (`powerMonitor.getSystemIdleTime()`), không đọc nội dung phím.

## 3. Trẻ em

- Profile trẻ em: tắt AI hội thoại tự do, tắt link ra ngoài, tắt theo dõi clipboard, giới hạn thời gian.
- Không thu thập thông tin định danh trẻ (chỉ tên hiển thị + năm sinh tuỳ chọn).
- Khi có backend: profile trẻ em **không** đồng bộ trừ khi phụ huynh bật (tuân thủ các quy định bảo vệ dữ liệu trẻ em).

## 4. Bảo mật Electron — bắt buộc

| Cấu hình | Giá trị | Lý do |
|---|---|---|
| `contextIsolation` | `true` | Tách JS của trang khỏi preload |
| `nodeIntegration` | `false` | Renderer không có quyền Node |
| `sandbox` | `true` | Giới hạn renderer |
| `webSecurity` | `true` (không bao giờ tắt) | |
| Tải model giọng đọc tự nhiên | Chỉ khi người dùng bật "Giọng tự nhiên" và bấm "Tải model": app tải ~92 MB từ `huggingface.co` (revision ghim, sha256 từng file). Văn bản được đọc **không rời máy**; âm thanh đã tạo lưu ở `userData/tts-cache` (có thể xoá). | Không tự kết nối mạng; file lạ/hỏng bị loại |
| Tải model dịch offline | Lần đầu dùng dịch câu, **chỉ khi người dùng bấm "Tải model"**, app tải ~107 MB từ `huggingface.co` (revision ghim sẵn, kiểm tra sha256 từng file); không gửi dữ liệu người dùng đi. Sau đó dịch hoàn toàn trên máy. | Không tự kết nối mạng; file lạ/hỏng bị loại |
| Content-Security-Policy | Mỗi cửa sổ có CSP riêng; chỉ `self` + domain cần thiết (YouTube cho Study; `media-src blob:` ở Study/Popup để phát audio giọng tự nhiên) | Chặn script lạ |
| `setWindowOpenHandler` | Từ chối mở cửa sổ mới; link ngoài mở bằng `shell.openExternal` sau khi kiểm tra `https:` + danh sách cho phép | |
| `will-navigate` | Chặn điều hướng ra ngoài app | |
| `setPermissionRequestHandler` | Chỉ cho `media` (micro) với cửa sổ Study; từ chối mọi quyền khác | |
| Preload | Chỉ expose API có kiểu, validate mọi input ở main bằng zod | |
| Electron | Luôn cập nhật bản stable mới (vá lỗi Chromium) | |
| Fuses | Bật các Electron Fuses an toàn khi đóng gói (tắt `RunAsNode`, bật kiểm tra toàn vẹn asar nếu dùng) | |

## 5. Bí mật (API key)

- Lưu bằng `safeStorage.encryptString()` (dùng DPAPI của Windows) vào `userData/secrets.bin`. Không lưu plain text, không ghi log.
- Chỉ main process đọc và gọi API; renderer chỉ biết "đã cấu hình / chưa".
- Không bao giờ commit key vào repo. File `.env` (nếu có, cho script nội dung) nằm trong `.gitignore`; có `.env.example`.

### Luyện viết gửi AI (2026-11-11, docs/07 "Luyện viết", decisions #59)

- Khi AI đã bật (người lớn): câu dịch không khớp đáp án mẫu và bài viết theo đề được gửi lên nhà cung cấp AI đang dùng (key API hoặc Claude Code CLI), kèm câu Việt/đáp án mẫu/đề lấy từ nội dung bài và trình độ `learning.level`; câu dịch khớp đáp án mẫu không gửi đi. Không lưu bài viết hay kết quả xuống đĩa (chỉ cache trong bộ nhớ của `AiService`), không log chữ người học.

### Viết tự do (2026-11-11, docs/07 "Viết tự do", decisions #60)

- **Lưu trên máy**: bài viết tự do, đề (cả đề tự đặt) và nhận xét AI được lưu trong `user.db` (bảng `free_writing_entries`) của hồ sơ người lớn đang dùng; người học xoá được từng bài (có hỏi xác nhận). Không gửi đi đâu khi chỉ bấm "Lưu".
- **Gửi AI chỉ khi bấm** "Lưu và nhận xét bằng AI" / "Nhận xét bằng AI" và AI đã bật: chữ đề + bài viết + khoảng số từ + `learning.level` được gửi tới nhà cung cấp AI đang dùng (key API hoặc Claude Code CLI). Đề tự đặt chỉ nằm trong thẻ dữ liệu `<task>`, không vào system prompt. Không log chữ người học, đề hay nhận xét. Hồ sơ trẻ em không dùng được (`FORBIDDEN`).

### AI qua Claude Code CLI (2026-11-11, docs/11 §5, decisions #57)

App chạy `claude -p` của người dùng như một tiến trình con. Quy tắc bắt buộc (có test ở `src/main/ai/*.test.ts`):
- **Không tool**: luôn `--tools ""` (theo `claude --help`: chuỗi rỗng tắt mọi tool built-in), thêm `--disable-slash-commands`, `--strict-mcp-config`, `--safe-mode` (tắt CLAUDE.md, skill, plugin, hook, MCP). Không bao giờ truyền `--bare`, `--dangerously-skip-permissions`, `--permission-mode`, `--add-dir`, `--mcp-config`, `--settings`, `--plugin-dir`, `--resume`, `--continue`.
- **Cô lập cấu hình**: `--setting-sources ""`, `--no-session-persistence`, cwd = thư mục `mkdtemp(<temp>/english-assistant-ai-XXXXXX)` tạo một lần mỗi tiến trình (tên ngẫu nhiên, mới tạo nên rỗng; không xoá đệ quy) để không nạp CLAUDE.md/`.claude` của dự án nào.
- **Không qua shell**: `spawn(exe, args, { shell: false, windowsHide: true })`; exe là đường dẫn tuyệt đối `claude.exe` (không nhận `.cmd`/`.bat`/`.ps1`); `where.exe`/`taskkill.exe` gọi bằng đường dẫn System32. Prompt hệ thống là chuỗi cố định; **văn bản người dùng chỉ đi qua stdin**, không bao giờ nằm trong args.
- **Env tối thiểu**: bỏ `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_CUSTOM_HEADERS`, `ANTHROPIC_MODEL`, `ANTHROPIC_DEFAULT_*_MODEL`, `ANTHROPIC_BEDROCK_BASE_URL`, `ANTHROPIC_VERTEX_*`, `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, `CLAUDE_CODE_USE_FOUNDRY`, `CLAUDECODE`, `NODE_OPTIONS`, `ELECTRON_RUN_AS_NODE` (giữ biến proxy và `CLAUDE_CONFIG_DIR`).
- **Giới hạn**: timeout 45 s (auth status 10 s) → `taskkill /pid <pid> /T /F` trước (tiến trình gốc còn sống nên lần được cả con cháu), chỉ khi taskkill hỏng mới `kill()` gốc; stdout ≤ 512 KB; stderr giữ 4 KB. Không log prompt, kết quả, stderr hay env (chỉ log mã lỗi / mã thoát). Nút "Kiểm tra lại" không chạy gì khi AI tắt / hồ sơ trẻ em, tối đa 1 lần mỗi 5 s.
- **Không lạm dụng**: 1 tiến trình mỗi lúc (tối đa 2 yêu cầu chờ), hạn mức lượt/ngày (mặc định 60 từ 2026-11-11, trước đó 30; người dùng có thể chọn "Không giới hạn" — khi đó chỉ còn hạn mức gói Claude của chính họ, lượt vẫn được đếm), chỉ gọi khi người dùng bấm; bộ đếm `ai.usage`/`ai.cliUsage` renderer không ghi được.

## 6. Nội dung tải về

- Content pack & model: chỉ tải từ nguồn chính thức cấu hình sẵn (GitHub Releases / backend của dự án / Hugging Face cho model), kiểm tra **sha256** trước khi dùng.
- Pack là dữ liệu (SQLite + media), **không chứa code thực thi**. Không `eval` bất cứ thứ gì từ pack.
- Nội dung HTML trong pack (nếu có) phải sanitize trước khi render (`DOMPurify`), ưu tiên dùng Markdown/JSON có cấu trúc thay vì HTML.

## 7. Gỡ cài đặt & xoá dữ liệu

- Installer hỏi khi gỡ: "Xoá luôn dữ liệu học tập?" (mặc định: giữ lại).
- Trong app: Cài đặt → Quyền riêng tư → "Xoá lịch sử dịch", "Xoá bản ghi âm", "Xoá toàn bộ dữ liệu profile".

## Chế độ trẻ em và PIN phụ huynh

- PIN 4 số lưu dạng băm SHA-256 có muối ngẫu nhiên (`settings`, khoá `parent.pin`), không ghi log, không gửi xuống giao diện; so sánh bằng `timingSafeEqual`, sai 5 lần thì khoá 60 giây. **PIN là khoá chặn trẻ bấm nhầm, không phải ranh giới bảo mật** (người có quyền trên máy vẫn đọc được dữ liệu local).
- Dữ liệu thời gian dùng và báo cáo chỉ nằm trên máy (`usage_days`), không gửi đi đâu; không thu thập gì từ trẻ ngoài tiến độ học.
- Quên PIN: chưa có cách đặt lại trong app (cần xoá khoá `parent.pin` trong cơ sở dữ liệu người dùng).

## Cập nhật tự động

- Việc kiểm tra cập nhật chỉ gửi yêu cầu tới GitHub Releases (địa chỉ IP và phiên bản app hiện tại là thứ GitHub nhìn thấy); **không gửi dữ liệu học, hồ sơ hay nội dung nào**.
- Người dùng tắt được trong Cài đặt → Cập nhật (`app.autoUpdate`); app không bao giờ tải hay cài bản mới khi chưa được đồng ý.
- Tính toàn vẹn: electron-updater so sha512 của file tải về với `latest.yml`. Bản chưa ký số (code signing) thì Windows SmartScreen vẫn cảnh báo ở lần cài đầu — xem [15](15-packaging-and-release.md#5-code-signing).

## Micro & bài nói

- Quyền micro chỉ được cấp cho trang của chính app và chỉ cho âm thanh (không camera/màn hình) — `applyPermissionPolicy` trong `src/main/system/security.ts`; mọi quyền thiết bị khác bị từ chối.
- Âm thanh ghi chỉ nằm trong bộ nhớ trong lúc nhận dạng (PCM 16 kHz), chỉ đi renderer → main → Whisper: **không lưu file, không gửi mạng, không log**. Lời nhận dạng (chữ) cũng không lưu và không log (ở main, worker lẫn thông báo lỗi); nó chỉ rời máy trong đúng một trường hợp ở mục dưới. Model Whisper chạy trên máy (utilityProcess, `allowRemoteModels = false`).
- **Ngoại lệ duy nhất — trả lời câu hỏi bằng giọng nói (dạng `respond`, 2026-11-11, decisions #61)**: lời nhận dạng (**chữ**, không phải âm thanh) được gửi cho Claude (key API hoặc Claude Code CLI) **chỉ khi người học bấm "Nhận xét bằng AI"** sau khi đã thấy chữ máy nghe được; không bao giờ tự gửi sau khi ghi âm, phím Enter không gửi. Cạnh nút luôn có dòng "Chỉ gửi chữ máy nghe được cho Claude, không gửi âm thanh". Gửi kèm câu hỏi (lấy từ nội dung bài), số liệu trôi chảy (số từ, tốc độ, quãng ngừng, từ đệm, lặp từ — do main tính) và `learning.level`. Lời nhận dạng không lưu ở đâu (không DB, không cài đặt; chỉ cache trong bộ nhớ của `AiService` như mọi tác vụ AI), không log. AI tắt / hồ sơ trẻ em / người học chọn "Chấm không cần AI" → không gửi gì, chấm tại máy theo số từ.
- Model tải về từ Hugging Face khi người dùng đồng ý, ghim revision và kiểm tra sha256 từng file.

## Lấy chữ đang bôi đen (Ctrl+Alt+T)

- Chỉ chạy khi người dùng **chủ động bấm phím tắt**; không theo dõi clipboard hay phím nền.
- Gửi Ctrl+C giả lập tới cửa sổ đang focus rồi **khôi phục clipboard** (mọi định dạng: chữ, HTML, ảnh); chữ lấy được vẫn qua bộ lọc nhạy cảm (`sensitive.ts`: OTP, số thẻ, chuỗi giống mật khẩu/khoá API bị bỏ) và giới hạn 500 ký tự; **không log** nội dung.
- Không bao giờ gửi vào terminal (tránh ngắt lệnh đang chạy). Tắt được bằng `translate.autoCopy`.
