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
| Content-Security-Policy | Mỗi cửa sổ có CSP riêng; chỉ `self` + domain cần thiết (YouTube cho Study) | Chặn script lạ |
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
