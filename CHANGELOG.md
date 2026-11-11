# Changelog

Mỗi lần phát hành ghi một mục (tiếng Việt). `scripts/release/check-version.mjs` yêu cầu mục cho phiên bản mới nếu file này tồn tại.

## 2.3.0 — 2026-11-11

- Lộ trình hằng ngày: khối "Hôm nay" ở đầu ngăn Hôm nay gợi ý tối đa 5 việc (ôn thẻ, bài kế tiếp của khoá đang theo, bài của kỹ năng yếu nhất), chọn mục tiêu 10/20/30/60 phút mỗi ngày trong Cài đặt
- Bài đọc: từ khó tự vào sổ từ (ôn thẻ) khi lần đầu đạt bài, hiện chip "Đã lưu N từ mới"; tắt được trong Cài đặt → Ôn thẻ
- AI giải thích ngữ pháp trong cửa sổ dịch nhanh (nút "Giải thích ngữ pháp"); cửa sổ rộng hơn và tự xuống dòng khi câu dài
- Nhật ký tiếng Anh buổi tối: mascot nhắc viết nhật ký (giờ chọn trong Cài đặt, mặc định 21:00), có 12 câu gợi ý, thưởng XP/xu lần đầu trong ngày, AI sửa bài viết khi bật
- AI qua Claude Code (`claude -p`, đăng nhập gói Pro/Max, không cần API key) hoặc API key Anthropic của riêng bạn; Cài đặt → AI chọn nhà cung cấp, xem trạng thái Claude Code, đặt hạn mức lượt mỗi ngày (mặc định 30); không dùng AI với hồ sơ trẻ em
- Sửa đơ chuột toàn hệ thống mỗi lần gọi AI qua Claude Code (chạy CLI trong tiến trình riêng)
- Bong bóng nhắc của mascot giữ 60 giây và không đè lên câu hỏi ôn đang mở
- Nội dung: thêm cờ `ng` cho các câu đúng/sai/không có thông tin ở 49 bài đọc và bài nghe
- Bài nghe VOA: chuẩn hoá âm lượng 12 bản thu (gói âm thanh 1.7.0)

## 2.2.0 — 2026-11-09

- Giảm RAM worker dịch (lúc rảnh từ 3,7 GB xuống khoảng 335 MB), dịch online Google/Azure bằng key bạn tự nhập (mã hoá cục bộ)
