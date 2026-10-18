# 00 — Tầm nhìn & Phạm vi

## 1. Vấn đề

Người học tiếng Anh ở Việt Nam thường phải mở **rất nhiều thứ cùng lúc**: Google Translate, từ điển, app flashcard, YouTube,
web luyện TOEIC/IELTS, app luyện phát âm... Mỗi lần học là một lần "chuyển ngữ cảnh", dễ bỏ cuộc.
Trong khi đó, phần lớn thời gian họ **đang ngồi trước máy tính** để làm việc/học/giải trí.

## 2. Giải pháp

Một **Desktop Mascot** — nhân vật chibi/pixel nhỏ sống ở góc màn hình (đi dạo trên taskbar, ngủ, nhảy, phản ứng khi được click) — đóng vai:

- **Thú cưng**: được nuôi, cho ăn, chơi cùng, lên level, mở khoá trang phục/biểu cảm. → tạo động lực quay lại mỗi ngày.
- **Trợ lý dịch**: bôi đen/copy chữ → mascot dịch ngay, giải thích từ, phát âm, lưu vào sổ từ.
- **Gia sư**: đưa ra bài học siêu ngắn (micro-learning) đúng trình độ, đúng lúc người dùng rảnh, không làm phiền khi đang bận.
- **Phòng luyện**: một cửa sổ "Học tập" đầy đủ khi người dùng muốn học sâu (nghe, nói, đọc, viết, luyện thi).

> Câu định vị: *"Vừa dùng máy tính vừa học — không cần mở thêm web hay app nào khác."*

## 3. Đối tượng người dùng (persona)

| Persona | Tuổi | Mục tiêu | Ghi chú thiết kế |
|---|---|---|---|
| **Bé Na** (mầm non) | 4–6 | Làm quen âm, chữ cái, từ đơn giản qua hình ảnh & âm thanh | Phụ huynh ngồi cùng. Không cần đọc chữ, chủ yếu nghe – chạm – hình. Giới hạn thời gian. |
| **Bin** (tiểu học) | 6–11 | Cambridge Starters/Movers/Flyers, từ vựng chủ đề | Game hoá mạnh, phần thưởng thú cưng, chế độ phụ huynh. |
| **Linh** (THCS/THPT) | 12–18 | Ngữ pháp, đọc hiểu, thi vào 10/THPTQG, giao tiếp | Lộ trình rõ ràng, luyện đề. |
| **Minh** (sinh viên/đi làm) | 18–30 | TOEIC 450 → 750+, đọc tài liệu chuyên ngành | Dịch nhanh khi làm việc, học xen kẽ, luyện đề TOEIC. |
| **Hà** (luyện IELTS) | 17–30 | IELTS 6.5 → 8.0 | Writing/Speaking có chấm & feedback, từ vựng học thuật. |
| **Phụ huynh / giáo viên** | — | Theo dõi tiến độ con/học sinh | Báo cáo, giới hạn thời gian, cài đặt nội dung. |

## 4. Nguyên tắc sản phẩm (đọc kỹ — dùng để quyết định khi phân vân)

1. **Không làm phiền.** Mascot là bạn đồng hành, không phải quảng cáo popup. Tự im lặng khi người dùng đang fullscreen, họp, chơi game, gõ phím liên tục.
2. **Học trong 30 giây.** Mọi tương tác "chủ động" của mascot phải hoàn thành được trong ≤ 30 giây. Học sâu thì để người dùng tự mở cửa sổ Học tập.
3. **Offline-first.** Các chức năng cốt lõi (từ điển, flashcard, bài đọc, bài nghe đã tải) chạy không cần mạng. AI/online là phần cộng thêm.
4. **Miễn phí là mặc định.** Không bắt buộc API trả phí. Có tuỳ chọn "mang theo API key của bạn" (BYOK) hoặc chạy model local.
5. **Đúng trình độ.** Nội dung luôn được gắn level; mascot không bao giờ đưa bài C1 cho bé mầm non.
6. **Thưởng, không phạt.** Thú cưng có thể đói/buồn nhưng **không chết**, không mất tiến độ. Không tạo cảm giác tội lỗi (đặc biệt với trẻ em).
7. **Tôn trọng bản quyền.** Chỉ đóng gói nội dung có giấy phép mở; nội dung có bản quyền thì nhúng (embed) chính thức hoặc dẫn link. Xem [08](08-content-sources.md).
8. **Riêng tư.** Đọc clipboard, micro, chụp màn hình đều phải **opt-in** và xử lý local khi có thể. Xem [16](16-privacy-and-security.md).
9. **Đơn giản trước, đẹp sau.** Ưu tiên chạy được end-to-end, rồi mới trau chuốt animation/hiệu ứng.

## 5. Phạm vi

### Trong phạm vi (In scope)
- App desktop **Windows 10/11** (64-bit). Kiến trúc chọn sẵn để sau này build được macOS/Linux nếu cần.
- Giao diện tiếng Việt (mặc định) + tiếng Anh.
- Học tiếng Anh cho người Việt (giải thích bằng tiếng Việt, càng lên cao càng dùng nhiều tiếng Anh).
- Nhiều hồ sơ (profile) trên một máy — ví dụ bố và con dùng chung máy.
- Nội dung từ mầm non (Pre-A1) tới C2 / TOEIC 990 / IELTS 9.0.

### Ngoài phạm vi (giai đoạn đầu)
- App mobile, web app.
- Lớp học trực tuyến, chat với người thật.
- Bán khoá học, thanh toán trong app.
- Chứng chỉ chính thức (chỉ là **luyện tập** theo format đề, không phải đề thật).

### Có thể làm sau (💡)
- Đồng bộ đám mây qua backend **Laravel** (thế mạnh của team) — xem [03](03-architecture.md#7-backend-laravel-tuỳ-chọn-giai-đoạn-sau).
- "Content Studio" bằng Laravel + Filament để soạn/duyệt bài học và xuất gói nội dung.
- Bản macOS.
- Chế độ lớp học: giáo viên giao bài cho nhiều học sinh.

## 6. Chỉ số thành công (để biết sản phẩm có đang đúng hướng)

| Chỉ số | Mục tiêu ban đầu |
|---|---|
| Người dùng mở app (mascot chạy) ≥ 5 ngày/tuần | 40% người dùng tích cực |
| Số micro-lesson hoàn thành / ngày | ≥ 5 |
| Tỉ lệ bấm "Tắt/Ẩn mascot" vì phiền | < 10% phiên |
| Từ vựng đạt trạng thái "thuộc" (SRS) sau 30 ngày | ≥ 150 từ |
| Thời gian từ khi bôi đen chữ → có bản dịch | < 1 giây (offline) |

> Các chỉ số này đo **local** trên máy (không gửi đi đâu), hiển thị trong màn hình Thống kê cho chính người dùng.
