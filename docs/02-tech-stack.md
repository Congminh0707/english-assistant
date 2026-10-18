# 02 — Công nghệ (Tech stack)

## 1. Kết luận nhanh

> **Electron + Vue 3 + TypeScript + Vite** (scaffold bằng `electron-vite`), dữ liệu **SQLite** (`better-sqlite3` + `Drizzle ORM`),
> state **Pinia**, đóng gói bằng **electron-builder**.

Lý do chính: **toàn bộ app viết bằng JavaScript/TypeScript**, phần giao diện là **Vue** — đúng thế mạnh hiện tại.
Phần "backend" của app desktop (main process) chạy **Node.js**, cách tổ chức rất giống Laravel (service, controller, migration).

## 2. Các phương án đã cân nhắc

| Tiêu chí | **Electron + Vue** ✅ | Tauri 2 + Vue | NativePHP (Laravel) | .NET WPF / WinUI | Flutter |
|---|---|---|---|---|---|
| Ngôn ngữ | TS/JS (cả app) | Vue + **Rust** cho phần native | **PHP** + Vue | C# | Dart |
| Độ gần Laravel/Vue | Rất gần (Vue + Node) | Vue gần, Rust **khó** | Gần nhất | Xa | Xa |
| Cửa sổ trong suốt, click xuyên qua, always-on-top | Ổn định, tài liệu nhiều | Có, đôi khi lỗi trên Windows | Phụ thuộc lớp dưới (Electron), ít ví dụ | Rất tốt | Cần plugin |
| Dung lượng installer | ~80–120 MB | ~5–15 MB | ~120 MB+ (kèm PHP runtime) | Nhỏ | ~20 MB |
| RAM khi chạy | 150–300 MB | 50–120 MB | Cao hơn Electron | Thấp | Trung bình |
| Hệ sinh thái (TTS, Whisper, OCR, SQLite) | Rất lớn (npm) | Phải viết bằng Rust hoặc gọi JS | Hạn chế | Tốt | Trung bình |
| AI hỗ trợ viết code | Rất tốt (nhiều dữ liệu) | Tốt | Ít ví dụ | Tốt | Tốt |
| Độ trưởng thành cho desktop pet | Nhiều dự án tham khảo | Một số | Gần như không có | Nhiều | Ít |

**Vì sao không chọn NativePHP dù viết bằng Laravel?** NativePHP thực chất chạy Laravel bên trong Electron (hoặc Tauri) và giao tiếp qua HTTP nội bộ.
Với một app cần animation mượt, cửa sổ trong suốt, xử lý chuột từng khung hình, gọi model AI local... thì lớp PHP ở giữa chỉ thêm độ trễ và
độ phức tạp, và gần như không có ví dụ cho desktop mascot. Kỹ năng Laravel sẽ được dùng ở đúng chỗ: **backend đồng bộ & Content Studio** (giai đoạn sau).

**Vì sao không chọn Tauri dù nhẹ hơn?** Mọi thứ native (cửa sổ, phím tắt, đọc file, chạy model) phải viết hoặc cấu hình bằng Rust — một ngôn ngữ mới, khó.
Nếu sau này dung lượng/RAM thành vấn đề lớn, phần giao diện Vue có thể giữ nguyên và chuyển lớp vỏ sang Tauri (ghi trong [decisions.md](decisions.md)).

## 3. Danh sách thư viện chính

> Luôn cài **bản stable mới nhất** tại thời điểm làm. Khi thêm thư viện lớn mới → cập nhật bảng này và [decisions.md](decisions.md).

### Lõi
| Thư viện | Vai trò | Tương đương Laravel/Vue |
|---|---|---|
| `electron` | Lớp vỏ desktop: cửa sổ, tray, phím tắt, hệ thống | (giống "web server + trình duyệt" gói làm một) |
| `electron-vite` | Dev server + build cho main/preload/renderer | Laravel Vite plugin |
| `vue` 3 (Composition API, `<script setup>`) | Giao diện | Vue như bạn đang dùng |
| `typescript` | Kiểu dữ liệu | (PHP type hints, nhưng chặt hơn) |
| `pinia` | State management | Pinia / Vuex |
| `vue-router` | Điều hướng trong cửa sổ Học tập | vue-router / Inertia pages |
| `vue-i18n` | Đa ngôn ngữ giao diện (vi/en) | `__()` / lang files |
| `tailwindcss` | CSS tiện ích | Tailwind |
| `electron-builder` | Đóng gói installer `.exe` (NSIS) | (deploy script) |
| `electron-updater` | Tự cập nhật | — |

### Dữ liệu
| Thư viện | Vai trò | Tương đương |
|---|---|---|
| `better-sqlite3` | Driver SQLite đồng bộ, rất nhanh | PDO SQLite |
| `drizzle-orm` + `drizzle-kit` | ORM/query builder + migration | Eloquent/Query Builder + `php artisan migrate` |
| `zod` | Validate dữ liệu (IPC input, content JSON) | Form Request / Validator |
| `ts-fsrs` | Thuật toán lặp lại ngắt quãng FSRS | — |
| `electron-store` (tuỳ chọn) | Lưu cài đặt nhỏ dạng JSON | `config/` + `.env` |

### Hệ thống & tiện ích
| Thư viện | Vai trò |
|---|---|
| `koffi` | Gọi Win32 API trực tiếp (FFI, có binary dựng sẵn, không cần biên dịch): cửa sổ đang active, phát hiện fullscreen, `SHQueryUserNotificationState` → chế độ yên lặng. Xem [decisions.md](decisions.md) #8. |
| `tesseract.js` | OCR vùng màn hình (chạy local, WASM) |
| `@huggingface/transformers` (transformers.js) | Chạy model AI local trong JS: Whisper (nghe giọng nói), dịch opus-mt |
| `howler` (tuỳ chọn) | Phát âm thanh, hiệu ứng |
| `pino` / `electron-log` | Ghi log ra file |
| `@mozilla/readability` + `jsdom` | Lấy nội dung sạch từ trang web (tính năng đọc web 💡) |

### Đồ hoạ mascot
| Lựa chọn | Khi nào dùng |
|---|---|
| **Canvas 2D thuần** (mặc định) | Sprite sheet pixel art, vẽ từng frame. Đơn giản, nhẹ, đủ dùng. |
| `pixi.js` | Khi cần hiệu ứng hạt, nhiều layer, shader. Chưa cần ở MVP. |

### Test & chất lượng
| Thư viện | Vai trò | Tương đương |
|---|---|---|
| `vitest` | Unit test | PHPUnit / Pest |
| `@vue/test-utils` | Test component | — |
| `playwright` (có hỗ trợ Electron) | E2E test | Laravel Dusk |
| `eslint` + `prettier` | Lint/format | Pint / PHP-CS-Fixer |

### AI & giọng nói (chi tiết ở [11](11-ai-and-speech.md))
| Chức năng | Mặc định miễn phí | Tuỳ chọn tốt hơn |
|---|---|---|
| TTS (đọc) | Giọng có sẵn của Windows qua `speechSynthesis` | Piper (local, giọng tự nhiên) / TTS của provider |
| STT (nghe giọng nói) | Whisper qua transformers.js (local) | API Whisper/provider |
| Dịch | Từ điển offline + model opus-mt en↔vi (local) | LLM (Claude/OpenAI/Gemini/Ollama) |
| Ngữ pháp | LanguageTool (server local Java hoặc API công khai có giới hạn) | LLM |
| Chấm Writing/Speaking | Quy tắc cơ bản | LLM theo band descriptors |

## 4. Công cụ cần cài trên máy dev (Windows)

| Công cụ | Ghi chú |
|---|---|
| **Node.js 22 LTS** quản lý bằng **Volta** | Giống cài PHP + Composer. Phiên bản được ghim trong `package.json` (`"volta"`). |
| **pnpm** 12 (cài qua Volta) | Trình quản lý package. Tài liệu dùng `pnpm`. |
| **Git** | — |
| **VS Code** + extension: Vue (Official), ESLint, Prettier, Tailwind CSS IntelliSense, SQLite Viewer | — |
| **Visual Studio Build Tools** (workload "Desktop development with C++") + **Python 3** | Cần để build native module `better-sqlite3`. Nếu tải được bản prebuilt thì không cần, nhưng nên cài sẵn. |
| **LibreSprite** (miễn phí — công cụ chính của dự án) / Aseprite (trả phí) | Vẽ pixel art & xuất sprite sheet. LibreSprite là bản fork của Aseprite cũ, xuất sprite sheet PNG + JSON tương tự. |
| **DB Browser for SQLite** | Xem database (giống TablePlus/phpMyAdmin) |

Hướng dẫn từng bước: [04-getting-started.md](04-getting-started.md).
