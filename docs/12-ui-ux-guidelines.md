# 12 — Hướng dẫn UI/UX

## 1. Phong cách tổng thể

- **Chibi + pixel art**: nhân vật, icon, huy hiệu, khung viền, nút bấm mang chất pixel; nhưng **chữ nội dung bài học phải dễ đọc** (font thường, không pixel).
- Cảm giác: ấm áp, vui, gọn — giống một game nông trại nhỏ, không giống phần mềm văn phòng.
- Một hệ màu, hai chế độ **Sáng / Tối** (theo hệ thống, có thể chỉnh).

## 2. Design tokens

Định nghĩa trong `src/renderer/shared/styles/tokens.css` (biến CSS) và nối vào `tailwind.config` — không viết mã màu cứng trong component.

```css
:root {
  /* Bảng màu pixel ấm (gợi ý, chỉnh khi có art chính thức) */
  --c-bg:        #fdf6e3;  /* nền giấy kem */
  --c-surface:   #ffffff;
  --c-ink:       #2b2b3a;  /* chữ chính */
  --c-ink-soft:  #6b6b80;
  --c-primary:   #5b8def;  /* xanh dương — hành động chính */
  --c-success:   #4caf6a;
  --c-warning:   #f2b33d;
  --c-danger:    #e05a5a;
  --c-xp:        #9b6bff;  /* tím — XP/level */
  --c-coin:      #f5c542;
  --c-border:    #2b2b3a;  /* viền pixel đậm */

  --px: 2px;               /* đơn vị viền pixel */
  --radius: 0;             /* pixel style: góc vuông, dùng box-shadow bậc thang để giả bo góc */
  --font-ui: 'Be Vietnam Pro', system-ui, sans-serif;  /* chữ nội dung & UI */
  --font-pixel: 'VT323', monospace;                    /* tiêu đề/số liệu — font pixel CÓ dấu tiếng Việt (xem mục 3) */
}
:root[data-theme='dark'] {
  --c-bg: #1e1e2a; --c-surface: #2a2a3a; --c-ink: #f2efe6; --c-ink-soft: #a8a6b8; --c-border: #0e0e14;
}
```

Viền pixel dùng `box-shadow` nhiều lớp hoặc `border-image`, hoặc thư viện CSS **NES.css** (MIT) để tham khảo. Mọi phần tử pixel phải có `image-rendering: pixelated`.

## 3. Font chữ — lưu ý tiếng Việt

- Nhiều font pixel **không có dấu tiếng Việt** → chữ "Học tập" bị vỡ. Chỉ dùng font pixel đã kiểm tra hiển thị đủ: `ă â đ ê ô ơ ư` + 5 dấu thanh, cả chữ hoa.
- Font pixel chỉ dùng cho: tiêu đề ngắn, số XP/level, nhãn huy hiệu. Nội dung bài học, giải thích, bản dịch → `--font-ui`.
- Danh sách font đã kiểm tra & license: xem [08](08-content-sources.md#8-hình-ảnh-âm-thanh-font-cho-giao-diện).
- Đóng gói font vào app (không tải từ Google Fonts lúc chạy — app phải offline được).
- Chữ IPA cần font hỗ trợ ký tự IPA (`ə ʃ ʒ θ ð ŋ ˈ ˌ ː`) — kiểm tra font UI; nếu thiếu, dùng font riêng cho IPA (ví dụ Noto Sans / Charis SIL — OFL).

## 4. Bố cục các cửa sổ

### Mascot
- Nhân vật + bong bóng thoại phía trên. Bong bóng: nền trắng viền pixel, đuôi chỉ về nhân vật, rộng tối đa 260 px, chữ ≥ 14 px.
- Khi mascot ở sát mép phải màn hình → bong bóng lệch sang trái (luôn nằm trong màn hình).

### Popup dịch nhanh
```
┌──────────────────────────────────────┐
│ appointment  /əˈpɔɪntmənt/  🔊 US UK │  ← từ + IPA + phát âm
│ [A2] noun                            │  ← level badge, loại từ
│ cuộc hẹn                              │  ← nghĩa chính (to, rõ)
│ • I have a dental appointment at 3.  │  ← ví dụ
│ ─────────────────────────────────────│
│ [💾 Lưu]  [📖 Chi tiết]  [📌 Ghim]   │
└──────────────────────────────────────┘
```
Phím: `Esc` đóng, `S` lưu, `Space` phát âm. Tự đóng khi click ra ngoài (trừ khi ghim).

### Cửa sổ Học tập (Study)
```
┌──────────┬──────────────────────────────────────────┐
│ [Avatar] │  Hôm nay: ▓▓▓▓▓░░░ 12/20 phút  🔥 7 ngày  │
│ Lv 12 🦊 │──────────────────────────────────────────│
│──────────│                                          │
│ 🏠 Trang chủ                                         │
│ 🗂 Từ vựng│        (Nội dung trang)                  │
│ 📘 Ngữ pháp                                          │
│ 📖 Đọc   │                                          │
│ 🎧 Nghe  │                                          │
│ 🎤 Nói   │                                          │
│ ✍ Viết   │                                          │
│ 🎬 Video │                                          │
│ 🏆 Luyện thi                                         │
│ 🐾 Thú cưng                                          │
│ 📊 Thống kê                                          │
│ ⚙ Cài đặt│                                          │
└──────────┴──────────────────────────────────────────┘
```
- Trang chủ: lộ trình hôm nay (thẻ SRS đến hạn, bài tiếp theo, kỹ năng yếu), nhiệm vụ ngày, nút lớn "Bắt đầu học".
- Màn làm bài: một câu mỗi màn hình, thanh tiến trình trên cùng, nút "Kiểm tra" to ở dưới, phản hồi đúng/sai có âm thanh + màu + rung nhẹ, mascot mini ở góc phản ứng theo.

## 5. Chế độ trẻ em (track `preschool`, `primary`)

| Quy tắc | Chi tiết |
|---|---|
| Nút to | Vùng bấm ≥ 64×64 px |
| Ít chữ | Icon + hình + giọng đọc hướng dẫn; chữ tiếng Việt ngắn |
| Không có thứ "đáng sợ" | Không đồng hồ đếm ngược đỏ, không âm báo sai chói tai — thay bằng "Thử lại nhé!" |
| Không link ra ngoài | Không mở trình duyệt, không video ngoài danh mục đã duyệt |
| Khoá phụ huynh | Cài đặt, đổi profile, thoát app (tuỳ chọn) cần PIN |
| Giới hạn thời gian | Hết giờ → mascot đi ngủ, cửa sổ học đóng nhẹ nhàng |
| Không AI tự do | Xem [11](11-ai-and-speech.md#kiểm-soát-chi-phí--an-toàn) |

## 6. Âm thanh

- Hiệu ứng ngắn kiểu 8-bit: đúng, sai, lên level, nhận xu, mascot ăn. Âm lượng riêng cho hiệu ứng / giọng đọc / mascot.
- Mặc định **tắt âm thanh chủ động của mascot** khi người dùng không ở cửa sổ Học tập (tránh làm phiền khi đang họp/làm việc).

## 7. Animation & chuyển động

- Pixel art: 6–12 fps cho nhân vật; UI transition 150–250 ms, easing đơn giản.
- Tôn trọng `prefers-reduced-motion`: giảm hiệu ứng rung, hạt, nhảy.

## 8. Accessibility

- Tương phản chữ ≥ 4.5:1.
- Toàn bộ cửa sổ Study dùng được bằng bàn phím (Tab, Enter, phím số 1–4 chọn đáp án).
- Cỡ chữ chỉnh được (90%–150%).
- Không chỉ dùng màu để báo đúng/sai — kèm icon ✓ ✗.
- Ảnh có `alt`; nút icon có `aria-label` (vi/en).

## 9. Ngôn ngữ & giọng văn

- Xưng hô thân thiện: mascot xưng "Bi" / "mình", gọi người dùng "bạn" (trẻ em: "bé"/tên). Không dùng giọng ra lệnh.
- Khen cụ thể ("Bạn nhớ được 15 từ hôm nay!") thay vì chung chung.
- Lỗi kỹ thuật: nói rõ chuyện gì xảy ra + cách khắc phục, không hiện stack trace.
- Toàn bộ chuỗi giao diện qua `vue-i18n` (`vi.json`, `en.json`) — không viết cứng chữ trong component.
