# 12 — Hướng dẫn UI/UX

> Thiết kế v2 "Làng chữ" ([23](23-design-v2-spec.md)) là bản đang dùng. Quy tắc chi tiết, bắt buộc và kiểm tự động: [18-ui-rules.md](18-ui-rules.md) (`pnpm ui:audit`). Lịch sử thiết kế: [21](21-redesign-v2.md), [22](22-redesign-plan.md).

## 1. Phong cách tổng thể

- **Làng Việt Nam vẽ phẳng, ấm áp**: nền giấy kem, viền mảnh màu nâu, bo góc, bóng mềm, tranh minh hoạ vector (SVG). Cảm giác vui, gọn, gần gũi như một trò chơi nhỏ, không như phần mềm văn phòng. Không còn pixel art.
- Thú cưng là 5 nhân vật chibi vẽ vector (Bi, Lupo, Draco, Robo, Kitsu), mỗi con 16 trạng thái và 3 dáng đi xe, thuyền, máy bay ([05](05-mascot-system.md)).
- Chữ nội dung bài học dùng font thường dễ đọc (`Be Vietnam Pro`); giao diện của bé dùng `Baloo 2`.
- Một hệ màu, hai chế độ **Sáng / Tối** (Cài đặt → Giao diện, setting `ui.theme`: sáng, tối, theo hệ thống). `src/renderer/shared/theme.ts` gán `documentElement.dataset.theme` ở cả ba cửa sổ. Ban đêm làng chuyển sang tranh `village-night`.
- Ctrl K mở ô tìm từ ở cửa sổ Học tập (không có ở giao diện của bé).

## 2. Design tokens

Định nghĩa trong `src/renderer/shared/styles/tokens.css` (nguồn: `scripts/design-data/sync/tokens.json`). Không viết mã màu cứng trong component.

- **Màu:** `--c-bg`, `--c-surface`, `--c-surface-2`, `--c-line`, `--c-ink`, `--c-ink-soft`, `--c-primary` (đỏ cờ) và `-soft`, `--c-success`, `--c-warning`, `--c-danger`, `--c-xp` (xanh ngọc), `--c-coin` (vàng); mỗi màu có cặp `-soft`. Bản tối là `:root[data-theme='dark']`.
- **Bán kính:** `--r-sm` 8, `--r-md` 12, `--r-lg` 16, `--r-pill` 999.
- **Khoảng cách:** `--sp-1…7` (4/8/12/16/24/32/40). **Cỡ chữ:** `--fs-xs…3xl`.
- **Bóng:** `--shadow-sm`, `--shadow-md`. **Nút:** `--btn-h` 36, `--btn-h-sm` 30.
- **Lớp dùng chung** (`shared/styles/ui.css`): `.btn` (+ `--primary --success --danger --ghost --sm --block`), `.card`, `.chip`, `.page-title`; ô nhập/`select` cùng bán kính và chiều cao.
- **Icon:** `<UiIcon>` (lucide, nét 2.2); emoji không dùng làm icon.

## 3. Font chữ

- `Be Vietnam Pro` (chữ nội dung và giao diện), `Baloo 2` (giao diện của bé), `Noto Sans` cho IPA (`ə ʃ ʒ θ ð ŋ ˈ ˌ ː`). Font đóng gói trong app, không tải lúc chạy (app phải dùng được offline).
- Danh sách font và giấy phép: [08](08-content-sources.md#8-hình-ảnh-âm-thanh-font-cho-giao-diện).

## 4. Bố cục các cửa sổ

### Mascot

- Nhân vật chibi + bong bóng thoại phía trên. Bong bóng: nền giấy, viền mảnh, đuôi chỉ về nhân vật, rộng tối đa 260 px, chữ ≥ 14 px. Mascot sát mép phải màn hình thì bong bóng lệch sang trái (luôn nằm trong màn hình).

### Popup dịch nhanh

Từ + IPA + nút phát âm US/UK, nhãn level và loại từ, nghĩa chính to rõ, ví dụ, hàng nút Lưu / Chi tiết / Ghim. Phím: `Esc` đóng, `S` lưu, `Space` phát âm. Tự đóng khi click ra ngoài (trừ khi ghim).

### Cửa sổ Học tập

- **Bản đồ làng** là trang chủ (`VillageMap`): 8 địa điểm là 8 nhóm trang (Trường làng = 3 nhóm tab: Lộ trình / Kho bài [Bài học, Ngữ pháp, Bài đọc, Nghe, Video] / Luyện thi [TOEIC]; Thư các = Sổ từ; Đình làng = Luyện tập; Giếng làng = Ôn tập; Tháp Bút = Thống kê + Kiểm tra trình độ; Bến thuyền = Mẫu câu; Chợ quê = Cửa hàng; Nhà thú cưng = Thú cưng). Làng đổi theo giờ (ngày, chiều, đêm). Thanh trên: chuỗi ngày, xu, level; nút Hôm nay (ngăn kéo nhiệm vụ, mục tiêu), Tìm từ (Ctrl K), Cài đặt.
- **Thẻ "Hôm nay"** (cập nhật 2026-11-11): luôn hiện ở giữa phía dưới trang chủ khi có lộ trình (chip xong/tổng, mục kế tiếp, một nút chính "Bắt đầu"/"Học tiếp" + Enter, nút phụ "Xem cả lộ trình"). Mỗi ghim địa điểm có thêm một dòng chức năng (`study.placeHint.*`); ghim của nơi có mục kế tiếp được làm nổi bật kèm mũi tên; vị trí ghim bị kẹp để không đè thẻ.
- **Vào một địa điểm** (`PlaceShell`): cột trái là cảnh địa điểm có nút "Về làng" (Esc), cột phải là nội dung trên nền giấy; nhiều trang thì có hàng tab. Khi đang học một bài (đọc bài, làm bài tập, kết quả) tab ẩn, chỉ còn nút quay lại.
- Cỡ cửa sổ hỗ trợ từ 680×520 (cột cảnh thu còn 128 px, thanh trên của làng chỉ còn icon) đến toàn màn hình.
- Màn làm bài: một câu mỗi màn hình, thanh tiến trình trên cùng, nút "Kiểm tra" to ở dưới, phản hồi đúng/sai có màu + icon, hàng phím tắt (`Enter`, `1-4`, `R`, `Z`, `/`).

## 5. Chế độ trẻ em (track `preschool`, `primary`)

| Quy tắc                | Chi tiết                                                                         |
| ---------------------- | -------------------------------------------------------------------------------- |
| Nút to                 | Vùng bấm ≥ 64×64 px                                                              |
| Ít chữ                 | Icon + hình + giọng đọc hướng dẫn; chữ tiếng Việt ngắn                           |
| Không có thứ "đáng sợ" | Không đồng hồ đếm ngược đỏ, không âm báo sai chói tai — thay bằng "Thử lại nhé!" |
| Không link ra ngoài    | Không mở trình duyệt, không video ngoài danh mục đã duyệt                        |
| Khoá phụ huynh         | Cài đặt, đổi profile, thoát app (tuỳ chọn) cần PIN                               |
| Giới hạn thời gian     | Hết giờ → màn đêm "Time to rest!" (nền `kids-bg-night`), cần PIN để dùng thêm    |
| Không AI tự do         | Xem [11](11-ai-and-speech.md#kiểm-soát-chi-phí--an-toàn)                         |

**Giao diện** (`renderer/study/kids/`, `kids.css`): nền cảnh đồng cỏ + sông (`kids-bg`, bản đêm `kids-bg-night` khi giao diện tối), ô viền mực 4px có bóng 8px, nút xanh `.k-primary`, `.k-round`, `.k-bubble`. Trang chính có thú cưng thật của hồ sơ (`PetSprite`) cùng bốn ô lớn; hình từ vựng là thẻ từ vẽ vector (`PictureImage`, tên cũ của component thẻ từ).

**Đã triển khai** (hồ sơ `isChild`): KidsApp, KidsHome, KidsReview, KidsUnits, KidsActivity, KidsAlbum, KidsPet, ParentGate, bản đồ thế giới ([19](19-kids-world.md)), thẻ nghe–chạm–chọn hình, hoạt động chữ cái/âm/ghép vần/từ thường gặp/sách tranh/tô chữ/nói theo, sticker, khu phụ huynh (PIN băm muối, khoá tạm khi sai nhiều lần, quên PIN → thử thách, giới hạn thời gian/ngày, báo cáo 7 ngày). Chi tiết ở [07](07-learning-modules.md).

## 6. Âm thanh

- Hiệu ứng ngắn: đúng, sai, lên level, nhận xu, mascot ăn. Âm lượng riêng cho hiệu ứng / giọng đọc / mascot.
- Mặc định **tắt âm thanh chủ động của mascot** khi người dùng không ở cửa sổ Học tập (tránh làm phiền khi đang họp/làm việc).

## 7. Animation & chuyển động

- Nhân vật 6–12 fps; chuyển cảnh UI 150–250 ms, easing đơn giản.
- Tôn trọng `prefers-reduced-motion`: giảm hiệu ứng rung, hạt, nhảy; tranh động dừng.

## 8. Accessibility

- Tương phản chữ ≥ 4.5:1.
- Toàn bộ cửa sổ Học tập dùng được bằng bàn phím (Tab, Enter, phím số 1–4 chọn đáp án, Esc về làng).
- Không chỉ dùng màu để báo đúng/sai — kèm icon.
- Nút icon có `aria-label` (vi/en).

## 9. Ngôn ngữ & giọng văn

- Xưng hô thân thiện: mascot xưng "mình", gọi người dùng "bạn" (trẻ em: "bé"/tên). Không dùng giọng ra lệnh.
- Khen cụ thể ("Bạn nhớ được 15 từ hôm nay!") thay vì chung chung.
- Lỗi kỹ thuật: nói rõ chuyện gì xảy ra + cách khắc phục, không hiện stack trace.
- Toàn bộ chuỗi giao diện qua `vue-i18n` (`vi.json`, `en.json`) — không viết cứng chữ trong component.
