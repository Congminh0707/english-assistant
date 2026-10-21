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
| Micro | Hỏi khi dùng module Nói | Audio | `recordings/`, tự xoá sau 7 ngày | Chỉ khi dùng STT/chấm online |
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
- Âm thanh ghi chỉ nằm trong bộ nhớ trong lúc nhận dạng (PCM 16 kHz): **không lưu file, không gửi mạng, không log** (kể cả lời nhận dạng). Model Whisper chạy trên máy (utilityProcess, `allowRemoteModels = false`).
- Model tải về từ Hugging Face khi người dùng đồng ý, ghim revision và kiểm tra sha256 từng file.
