# 01 — Tính năng

Ký hiệu ưu tiên: **P0** = phải có trong MVP · **P1** = ngay sau MVP · **P2** = về sau · **💡** = đề xuất / ý tưởng.
Lộ trình chi tiết: [14-roadmap.md](14-roadmap.md).

---

## A. Mascot & thú cưng

| ID | Tính năng | Ưu tiên | Mô tả |
|---|---|---|---|
| A1 | Cửa sổ mascot trong suốt | P0 | Nhân vật hiển thị trên desktop, không có khung, luôn ở trên cùng, phần trong suốt click xuyên qua được. |
| A2 | Animation cơ bản | P0 | idle, walk, sleep, drag (bị nhấc lên), fall (rơi xuống), happy, sad, talk. |
| A3 | Di chuyển | P0 | Tự đi dạo dọc mép trên taskbar, đổi hướng, dừng lại nghỉ. Kéo thả bằng chuột. |
| A4 | Bong bóng thoại | P0 | Mascot nói câu ngắn (nhắc học, khen, dịch nhanh). |
| A5 | Menu chuột phải | P0 | Học ngay · Dịch · Cho ăn · Chơi · Ẩn 30 phút · Cài đặt · Thoát. |
| A6 | Tray icon | P0 | Icon ở khay hệ thống, hiện/ẩn mascot, mở cửa sổ Học tập. |
| A7 | Chỉ số nuôi | P0 | Đói (hunger), Vui (mood), Năng lượng (energy), Thân thiết (affection). Giảm chậm theo thời gian, tăng khi học/cho ăn/chơi. |
| A8 | Cho ăn bằng thức ăn kiếm từ việc học | P0 | Học → nhận xu/đồ ăn → cho mascot ăn. Vòng lặp động lực chính. |
| A9 | Level thú cưng & tiến hoá | P1 | XP từ học tập → lên level → mở khoá biểu cảm, trang phục, "tiến hoá" ngoại hình. |
| A10 | Cửa hàng trang phục/phụ kiện | P1 | Mua bằng xu trong game (không có tiền thật). |
| A11 | Phản ứng theo ngữ cảnh | P1 | Buổi tối ngáp, sáng chào, người dùng làm việc lâu → nhắc nghỉ mắt, CPU cao → "nóng quá". |
| A12 | Chế độ yên lặng thông minh | P0 | Tự ẩn/im khi có app fullscreen (game, xem phim, thuyết trình), khi đang họp (Zoom/Teams/Meet). |
| A13 | Nhiều nhân vật | P2 | Chọn mascot khác (mèo, cáo, robot...), mỗi con có tính cách câu thoại riêng. |
| A14 | Mini-game | P2 | Game nhỏ dùng từ vựng: bắt chữ rơi, nối từ, đoán hình. Chơi xong nhận đồ ăn. |
| A15 | Tương tác vật lý vui | 💡 | Ném mascot, mascot bám mép cửa sổ đang mở, trèo lên cửa sổ (kiểu Shimeji). |

## B. Trợ lý dịch & tra cứu (dùng khi đang làm việc)

| ID | Tính năng | Ưu tiên | Mô tả |
|---|---|---|---|
| B1 | Dịch nhanh bằng phím tắt | P0 | Copy chữ (Ctrl+C) rồi bấm phím tắt (mặc định `Ctrl+Alt+T`) → popup dịch cạnh con trỏ. |
| B2 | Theo dõi clipboard (opt-in) | P1 | Bật thì mỗi lần copy tiếng Anh, mascot hiện icon nhỏ "dịch không?". |
| B3 | Từ điển Anh–Việt offline | P0 | Nghĩa, loại từ, IPA, ví dụ, từ đồng nghĩa, level CEFR của từ. |
| B4 | Phát âm | P0 | Nghe từ/câu (TTS), giọng US/UK. |
| B5 | Lưu vào sổ từ | P0 | Một click → thêm vào flashcard SRS, kèm câu ngữ cảnh đã copy. |
| B6 | Dịch câu/đoạn | P0 | Offline (model nhỏ) hoặc online (LLM/BYOK) cho chất lượng cao hơn. |
| B7 | OCR vùng màn hình | P1 | Phím tắt → kéo chọn vùng màn hình → nhận chữ → dịch. Dùng cho ảnh, video, game, PDF scan. |
| B8 | Giải thích ngữ pháp câu | P1 | "Vì sao câu này dùng thì hiện tại hoàn thành?" — cần LLM. |
| B9 | Dịch Việt → Anh & gợi ý viết | P1 | Gõ tiếng Việt → gợi ý câu tiếng Anh tự nhiên, nhiều mức trang trọng. |
| B10 | Kiểm tra ngữ pháp đoạn văn | P1 | Dán đoạn tiếng Anh (email, bài viết) → gạch lỗi + giải thích. |

## C. Học tập (cửa sổ Học tập)

Chi tiết từng module ở [07-learning-modules.md](07-learning-modules.md).

| ID | Module | Ưu tiên | Tóm tắt |
|---|---|---|---|
| C1 | Kiểm tra đầu vào (placement) | P0 | Bài test thích ứng 10–15 phút → xác định level ban đầu cho từng kỹ năng. Trẻ em: phụ huynh chọn độ tuổi. |
| C2 | Từ vựng + SRS | P0 | Flashcard lặp lại ngắt quãng (thuật toán FSRS), theo bộ từ theo level/chủ đề/kỳ thi. |
| C3 | Ngữ pháp | P1 | Điểm ngữ pháp theo CEFR: giải thích ngắn + bài tập. |
| C4 | Đọc (Reading) | P1 | Truyện/bài đọc phân level, bấm vào từ để tra, câu hỏi đọc hiểu. |
| C5 | Nghe (Listening) | P1 | Nghe chép chính tả (dictation), điền từ, chọn đáp án, tốc độ 0.75x–1.25x. |
| C6 | Nói (Speaking) | P2 | Shadowing, phát âm từ/câu có chấm điểm, hội thoại nhập vai với AI. |
| C7 | Viết (Writing) | P2 | Sắp xếp câu, viết câu theo gợi ý, viết đoạn/essay có feedback. |
| C8 | Phonics (trẻ em) | P1 | Chữ cái, âm, ghép vần với hình + âm thanh. |
| C9 | Video | P2 | Video YouTube nhúng (embed) theo level, kèm câu hỏi & từ vựng. |
| C10 | Luyện thi TOEIC | P2 | Đủ 7 Part L&R theo format, đề tự soạn; ước lượng điểm. |
| C11 | Luyện thi IELTS | P2 | 4 kỹ năng; Writing Task 1/2 và Speaking Part 1–3 chấm theo band descriptors (AI). |
| C12 | Mẫu câu giao tiếp | P1 | Câu mẫu theo tình huống (chào hỏi, công sở, du lịch...), nghe & nói lại. |
| C13 | Lộ trình hằng ngày | P0 | Mỗi ngày gợi ý 10–20 phút: ôn SRS + 1 bài mới + 1 kỹ năng yếu nhất. |

> **Trạng thái triển khai (cập nhật 2026-10-20):** đã làm C1 (placement 4 kỹ năng + checkpoint lên cấp), C2, C3 (40 điểm ngữ pháp),
> C4 (50 bài đọc), C5 một phần (30 bài nghe dùng TTS, chưa có audio thu sẵn), C8 (phonics + chế độ trẻ em), C12 (sổ mẫu câu),
> khoá học Course → Unit → Lesson, thống kê nâng cao (Elo theo kỹ năng, độ chính xác theo dạng bài, thời gian học).
> Chưa làm: C6, C7, C9, C10, C11. Bảng theo dõi chi tiết ở [14-roadmap.md](14-roadmap.md).

## D. Micro-learning (mascot chủ động)

| ID | Tính năng | Ưu tiên | Mô tả |
|---|---|---|---|
| D1 | "Từ của khoảnh khắc" | P0 | Định kỳ (mặc định 25 phút, chỉnh được) mascot giơ bảng một từ/câu, click để xem hoặc bỏ qua. |
| D2 | Ôn thẻ SRS nhanh | P0 | Thẻ đến hạn ôn → mascot hỏi 1–3 câu trắc nghiệm trong bong bóng. |
| D3 | Nghỉ giải lao học tập (Pomodoro) | P1 | Hết 25 phút làm việc → 5 phút nghỉ với 1 bài nghe/1 mini-game. |
| D4 | Câu đố ngày | P1 | Một câu hỏi mỗi ngày, trả lời đúng nhận thưởng lớn. |
| D5 | Học từ chính thứ mình đọc | 💡 | Các từ người dùng hay tra → tự sinh bài ôn từ chính các câu ngữ cảnh đó. |

## E. Hồ sơ, động lực, thống kê

| ID | Tính năng | Ưu tiên | Mô tả |
|---|---|---|---|
| E1 | Nhiều profile | P0 | Mỗi profile có level, mascot, sổ từ riêng. |
| E2 | Streak & nhiệm vụ ngày | P0 | Chuỗi ngày học, 3 nhiệm vụ/ngày. Có "vé giữ streak" để không phạt nặng. |
| E3 | Thành tựu (achievements) | P1 | Huy hiệu pixel: "100 từ đầu tiên", "7 ngày liên tục"... |
| E4 | Thống kê | P1 | Biểu đồ thời gian học, kỹ năng, dự đoán band/điểm. |
| E5 | Chế độ phụ huynh | P1 | Khoá bằng PIN, giới hạn thời gian/ngày, xem báo cáo, chọn nội dung. |
| E6 | Xuất/nhập dữ liệu | P1 | Backup file, nhập/xuất bộ thẻ (định dạng Anki .apkg — 💡). |

## F. Hệ thống

| ID | Tính năng | Ưu tiên | Mô tả |
|---|---|---|---|
| F1 | Cài đặt | P0 | Phím tắt, tần suất nhắc, giọng đọc, kích thước mascot, ngôn ngữ, khởi động cùng Windows. |
| F2 | Gói nội dung (content pack) | P0 | Nội dung đóng gói thành file, cài thêm/cập nhật không cần cập nhật app. |
| F3 | Auto-update | P1 | Tự cập nhật app qua GitHub Releases. |
| F4 | Cấu hình AI | P1 | Chọn provider: Không dùng / Local (Ollama) / Claude / OpenAI / Gemini; nhập API key (lưu mã hoá). |
| F5 | Đồng bộ cloud (Laravel) | P2 | Đăng nhập, đồng bộ tiến độ nhiều máy. |
| F6 | Chế độ hiệu năng thấp | P1 | Giảm FPS animation, tắt hiệu ứng khi chạy pin/máy yếu. |

---

## G. Đề xuất mở rộng (💡 — chưa cam kết, cân nhắc sau MVP)

1. **Đọc web có hỗ trợ**: dán URL bài báo → app tải bản text sạch (Readability), tô màu từ trên level người dùng, bấm để tra. Biến mọi bài báo thành bài đọc.
2. **Phụ đề kép cho video**: với video có phụ đề hợp lệ, hiển thị Anh + Việt, bấm vào từ để lưu.
3. **Nhật ký tiếng Anh**: mỗi tối mascot hỏi "Hôm nay bạn làm gì?" → người dùng viết 2–3 câu → AI sửa nhẹ nhàng. Rất hiệu quả cho Writing.
4. **Chế độ "Gõ phím luyện từ"**: gõ lại câu tiếng Anh nghe được (luyện nghe + chính tả + gõ phím).
5. **Từ vựng theo nghề**: bộ từ IT, kế toán, y tế, khách sạn... — hữu ích cho người đi làm.
6. **Tích hợp "nghe thụ động"**: phát podcast/bài nghe ở nền theo level khi người dùng làm việc nhẹ.
7. **Thử thách bạn bè** (cần backend): so streak, thi đố từ.
8. **Mascot nói chuyện bằng giọng** (TTS) với hội thoại AI giới hạn chủ đề — cẩn thận với trẻ em (lọc nội dung).
9. **Bàn phím ảo IPA**: luyện nhận diện phiên âm.
10. **Chế độ giáo viên**: xuất bài tập thành link/QR cho học sinh (cần backend).
11. **Plugin trình duyệt** gửi từ đang đọc trên Chrome về app (qua local server/WebSocket).
12. **Widget lịch ôn tập** trên desktop (mini calendar heatmap kiểu GitHub).
