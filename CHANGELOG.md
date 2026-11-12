# Changelog

Mỗi lần phát hành ghi một mục (tiếng Việt). `scripts/release/check-version.mjs` yêu cầu mục cho phiên bản mới nếu file này tồn tại.

## 2.4.0 — 2026-11-12

- Luyện viết trong bài học: dạng bài dịch Việt → Anh (so với đáp án mẫu, không khớp thì AI kiểm tra) và viết theo đề (AI nhận xét, đạt từ 60/100; không có AI thì đạt khi đủ số từ); chương "Luyện viết" 6 bài A1–B1
- Viết tự do theo đề: tab "Viết tự do" ở Hội trường, 30 đề A1–B2 hoặc đề tự đặt, 3 mức độ dài, lưu bài và xem lại, AI nhận xét, thưởng XP/xu lần đầu trong ngày
- Trả lời câu hỏi bằng giọng nói: ghi âm tối đa 30 giây, Whisper nhận dạng tại máy, hiện số liệu trôi chảy; chỉ khi bấm "Nhận xét bằng AI" mới gửi phần chữ (không gửi âm thanh); chương mới 6 bài A1–B1
- Viết là kỹ năng thứ năm trong trình độ (Elo); trang Thống kê có dòng Viết và khối "Viết tự do"
- "Bắt đầu từ đâu": thẻ "Hôm nay" luôn hiện ở trang chủ làng với một nút chính, kết quả kiểm tra trình độ có nút "Bắt đầu bài đầu tiên", ghim địa điểm có dòng chức năng, Trường làng gom tab thành 3 nhóm (Lộ trình / Kho bài / Luyện thi), lộ trình TOEIC thêm mục "Luyện TOEIC"
- Mascot: mục "Hôm nay" trong menu chuột phải, nhắc lộ trình theo giờ chọn trong Cài đặt (mặc định 10:00)
- Hạn mức AI qua Claude Code: mặc định 60 lượt mỗi ngày (trước là 30), thêm lựa chọn "Không giới hạn"
- Gói âm thanh 1.8.0: thêm 288 đoạn cho các bài Luyện viết và Trả lời câu hỏi

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
