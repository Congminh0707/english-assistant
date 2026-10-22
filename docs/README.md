# English Assistant — Bộ tài liệu hệ thống

> Desktop Mascot cho Windows: một nhân vật chibi/pixel sống trên màn hình, có thể nuôi, lên level,
> và đồng hành học tiếng Anh (nghe – nói – đọc – viết – từ vựng – ngữ pháp – luyện thi) **ngay trong lúc dùng máy tính**,
> từ mầm non tới TOEIC 990 / IELTS 9.0.

Bộ tài liệu này được viết để **bất kỳ người hoặc AI nào** (Claude, Copilot, Cursor, dev mới...) đọc xong là hiểu hệ thống và bắt tay vào làm được.
Người viết code chính có nền tảng **Laravel + Vue**, chưa có kinh nghiệm làm app desktop, vì vậy các tài liệu kỹ thuật luôn có phần
"tương đương bên Laravel/Vue" để dễ hình dung.

---

## Đọc theo thứ tự nào?

| Bạn là ai | Đọc gì trước |
|---|---|
| Người mới vào dự án | 00 → 01 → 02 → 03 → 04 |
| Dev chuẩn bị code | 02 → 03 → 04 → 13 → 10 → file module liên quan |
| Người làm nội dung bài học | 06 → 07 → 08 → 09 |
| Người làm art/animation | 05 → 12 |
| AI agent | `../AGENTS.md` trước, sau đó file liên quan tới task |

## Mục lục

| # | File | Nội dung |
|---|---|---|
| 00 | [00-vision-and-scope.md](00-vision-and-scope.md) | Tầm nhìn, đối tượng, nguyên tắc sản phẩm, phạm vi |
| 01 | [01-features.md](01-features.md) | Danh sách tính năng (MVP và về sau) + đề xuất mở rộng |
| 02 | [02-tech-stack.md](02-tech-stack.md) | Chọn công nghệ, lý do, bảng đối chiếu Laravel/Vue ↔ Electron |
| 03 | [03-architecture.md](03-architecture.md) | Kiến trúc tổng thể, các cửa sổ, IPC, cấu trúc thư mục |
| 04 | [04-getting-started.md](04-getting-started.md) | Cài môi trường Windows, tạo project, cửa sổ mascot đầu tiên |
| 05 | [05-mascot-system.md](05-mascot-system.md) | Nhân vật: sprite, animation, state machine, chỉ số nuôi |
| 06 | [06-levels-and-progression.md](06-levels-and-progression.md) | Thang trình độ (Mầm non → C2/TOEIC/IELTS), XP, phần thưởng |
| 07 | [07-learning-modules.md](07-learning-modules.md) | Thiết kế từng module học và các dạng bài tập |
| 08 | [08-content-sources.md](08-content-sources.md) | Nguồn nội dung miễn phí + giấy phép (license) |
| 09 | [09-content-pipeline.md](09-content-pipeline.md) | Quy trình thu thập → chuẩn hoá → gắn level → đóng gói nội dung |
| 10 | [10-data-model.md](10-data-model.md) | Schema SQLite (dữ liệu người dùng + dữ liệu nội dung) |
| 11 | [11-ai-and-speech.md](11-ai-and-speech.md) | Dịch, TTS, nhận dạng giọng nói, chấm phát âm, LLM |
| 12 | [12-ui-ux-guidelines.md](12-ui-ux-guidelines.md) | Phong cách chibi/pixel, bố cục, chế độ trẻ em, accessibility |
| 13 | [13-coding-conventions.md](13-coding-conventions.md) | Quy ước code, đặt tên, IPC, test, git |
| 14 | [14-roadmap.md](14-roadmap.md) | Lộ trình theo phase, checklist, Definition of Done |
| 15 | [15-packaging-and-release.md](15-packaging-and-release.md) | Build installer, auto-update, ký số, phát hành |
| 16 | [16-privacy-and-security.md](16-privacy-and-security.md) | Quyền riêng tư (clipboard, mic, màn hình), bảo mật Electron |
| 17 | [17-metrics.md](17-metrics.md) | **Bảng số liệu** (số từ, bài học, test, pack…) + lệnh đo lại |
| — | [glossary.md](glossary.md) | Thuật ngữ desktop/Electron giải thích cho dev web |
| — | [decisions.md](decisions.md) | Nhật ký quyết định kiến trúc (ADR rút gọn) |

## Quy tắc cập nhật tài liệu

1. Tài liệu là **nguồn sự thật**. Code khác tài liệu → hoặc sửa code, hoặc sửa tài liệu trong cùng một commit.
2. Mọi quyết định công nghệ mới (thêm thư viện lớn, đổi kiến trúc) → thêm một mục vào [decisions.md](decisions.md).
3. Thêm nguồn nội dung mới → bắt buộc ghi license vào [08-content-sources.md](08-content-sources.md) trước khi dùng.
4. Viết tiếng Việt, giữ nguyên thuật ngữ kỹ thuật tiếng Anh (IPC, renderer, sprite...). Thuật ngữ lạ → thêm vào [glossary.md](glossary.md).
5. **Số liệu** (số từ, số bài, số test, dung lượng pack…) phải do **lệnh đo** (`pnpm stats`, `pnpm content:stats`, `pnpm test`) và ghi ở [17-metrics.md](17-metrics.md); tài liệu khác không tự ước lượng số — chỉ trích số lịch sử kèm ngày hoặc trỏ về trang 17. Mỗi lần build pack/đổi nội dung/phát hành → đo lại và cập nhật.
6. Trạng thái của từng hạng mục được đánh dấu: ✅ đã làm · 🚧 đang làm · 📋 đã lên kế hoạch · 💡 ý tưởng.
