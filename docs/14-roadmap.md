# 14 — Lộ trình phát triển

Thời gian ước tính cho **1 dev part-time (~15–20 giờ/tuần)**, mới làm desktop lần đầu. Có AI hỗ trợ code thì nhanh hơn. Mỗi phase kết thúc bằng một bản chạy được.

```mermaid
gantt
  dateFormat  YYYY-MM-DD
  axisFormat  %m/%Y
  section Nền tảng
  Phase 0 - Spike cửa sổ mascot     :p0, 2026-11-01, 14d
  Phase 1 - MVP mascot + dịch + SRS  :p1, after p0, 56d
  section Học tập
  Phase 2 - Đọc, Nghe, Trẻ em        :p2, after p1, 56d
  Phase 3 - Nói, Viết, AI            :p3, after p2, 56d
  Phase 4 - Luyện thi + Laravel      :p4, after p3, 70d
  section Hoàn thiện
  Phase 5 - Polish & phát hành rộng  :p5, after p4, 42d
```

> Song song với code, **pipeline nội dung** ([09](09-content-pipeline.md)) phải chạy từ Phase 1 — nội dung là phần tốn thời gian nhất.

---

## Phase 0 — Spike: cửa sổ mascot (≈ 2 tuần)

Mục tiêu: chứng minh các kỹ thuật khó nhất chạy được trên Windows.

- [x] Tạo project electron-vite + Vue + TS ([04](04-getting-started.md)), ghim Node/pnpm bằng Volta
- [x] Cửa sổ trong suốt, không khung, luôn trên cùng, không hiện taskbar, không cướp focus
- [x] Click xuyên qua vùng trong suốt, bắt được click trên nhân vật — đã thử tay OK (2026-10-18)
- [x] Kéo thả nhân vật; thả ra rơi xuống mép taskbar (có trọng lực); click → nhảy vui — đã thử tay OK (2026-10-18)
- [x] Animation sprite sheet (idle + walk + drag/fall/land/happy) bằng canvas, nhân vật tự đi qua lại — sprite tạm (`pnpm sprites:placeholder`)
- [x] Tray icon: Hiện/Ẩn, Đưa về góc, Thoát
- [x] Phím tắt toàn cục `Ctrl+Alt+T` bật/tắt popup trống cạnh con trỏ (Esc / click ra ngoài để đóng) — *đã code, cần thử tay*
- [x] Phát hiện app fullscreen → ẩn mascot (cùng màn hình với mascot; game DirectX độc quyền & chế độ trình chiếu ẩn ở mọi màn hình) — đã xác nhận thực tế với một game toàn màn hình
- [x] Build được installer `.exe` (`pnpm build:win`, ~112 MB) — [ ] cài thử trên máy khác
- [ ] Kiểm tra LibreSprite có xuất tag trong JSON không ([05](05-mascot-system.md#quy-trình-art))

**Đo CPU (bản dev, 2026-10-18):** đứng yên ~1–2% tổng các tiến trình Electron; đang đi bộ ~3–12%. Cần đo lại trên bản production và tối ưu thêm nếu vượt ngân sách ([03](03-architecture.md#8-hiệu-năng--ngân-sách-tài-nguyên)).

**DoD:** Cài trên một máy Windows sạch, mascot đi dạo trên taskbar, kéo thả được, không cản trở dùng máy, CPU idle < 2%.

## Phase 1 — MVP (≈ 8 tuần)

Mục tiêu: dùng được hằng ngày: thú cưng + dịch nhanh + từ vựng.

**Nền tảng**
- [x] Cấu trúc thư mục theo [03](03-architecture.md), `ipc-contract` (zod), container, event bus, Clock, AppError
- [x] SQLite `user.db` + Drizzle + migration tự chạy (cả bản đóng gói)
- [x] Vitest: 19 test cho logic thú cưng/XP, i18n, services (SQLite in-memory + FakeClock)
- [ ] Profile: ✅ tự tạo profile mặc định + thú cưng + túi đồ khởi đầu — **còn** màn hình tạo/chọn profile, onboarding (cần cửa sổ Học tập)
- [ ] Cài đặt: ✅ ngôn ngữ, kích thước mascot, khởi động cùng Windows (chỉ bản cài) qua menu chuột phải — **còn** đổi phím tắt, tần suất nhắc (cần cửa sổ Học tập)
- [x] i18n vi/en dùng chung main + renderer, design tokens, `PxPanel`, `PxBar`
- [x] Cài content pack (`core-dictionary`) — `ContentPackService`: tự cài gói đi kèm lúc khởi động (giải nén theo luồng, kiểm tra sha256, nâng cấp khi có bản mới)

**Mascot**
- [ ] State machine: ✅ idle, walk, drag, fall, land, happy, eat — **còn** sleep (năng lượng thấp / người dùng vắng mặt)
- [x] Bong bóng thoại + hàng đợi ưu tiên, lời chào theo giờ, thẻ chỉ số khi rê chuột, vuốt ve (click)
- [x] Menu chuột phải (Cho ăn, Ẩn 30 phút/1 giờ, Kích thước, Ngôn ngữ, Khởi động cùng Windows, Thoát)
- [x] Chỉ số nuôi + `PetDecayJob` + nhắc đói + cho ăn + túi đồ
- [ ] XP, xu, level thú cưng: ✅ sổ cái `xp_events` + `XpService` + test — **chưa có nguồn XP** cho tới khi có bài học/SRS
- [ ] Chế độ yên lặng: ✅ fullscreen, hẹn giờ ẩn — **còn** app họp, giờ không làm phiền

**Dịch & từ điển**
- [x] Popup dịch: copy + `Ctrl+Alt+T` → tra từ điển offline (từ gốc, dạng đã chia, tra ngược tiếng Việt), ô tìm kiếm, ví dụ, nhãn level, nhãn "AI" cho nghĩa chưa duyệt — đã thử tay OK
- [x] TTS hệ thống (US/UK) qua `speechSynthesis`
- [ ] Dịch câu: opus-mt local (tải model khi cần) — hoặc tạm thời LLM BYOK nếu opus-mt chưa xong
- [x] Lưu từ → sổ từ (`saved_words`) + tạo thẻ SRS FSRS (`srs_cards`) kèm câu ngữ cảnh, +1 XP cho từ mới

**Học**
- [ ] SRS với ts-fsrs: ✅ `SrsService` (lịch FSRS, nhật ký `srs_reviews`, +2 XP/lần ôn) — **còn** phiên ôn đầy đủ trong cửa sổ Study
- [x] Micro-learning: quiz thẻ đến hạn (4 đáp án, chấm ở main: đúng nhanh → Được, đúng chậm → Khó, sai → Quên) + "Từ của khoảnh khắc" đúng trình độ khi không có thẻ đến hạn; tự nhắc mỗi 15/25/45 phút hoặc tắt, "🧠 Ôn từ ngay" trong menu chuột phải — đã thử tay OK (2026-10-19)
- [ ] Trình độ: ✅ chọn tay trong menu chuột phải (`learning.level`) — **còn** bài kiểm tra đầu vào
- [ ] Trang chủ Study: lộ trình hôm nay, streak, nhiệm vụ ngày
- [ ] Placement rút gọn (từ vựng + ngữ pháp) & rating theo kỹ năng

**Nội dung (song song)**
- [x] Pipeline: fetch + normalize Tatoeba, NGSL, CEFR-J, kaikki (Wiktionary), CMUdict
- [x] Build `core-dictionary` + `decks` theo level (v1.0.0 — [09 §10](09-content-pipeline.md#10-đã-làm-pipeline-core-dictionary-v1))
- [x] Công cụ sinh nghĩa tiếng Việt ngắn bằng LLM cho từ phổ biến còn thiếu (`pnpm content:enrich vi` → `curated/vocab/vi-generated.json`, [09 §10.5](09-content-pipeline.md#105-nghĩa-tiếng-việt-do-llm-sinh-contentenrich-vi)) — mẫu 50 từ
- [x] Sinh đủ từ còn lại: 2.693/2.762 từ (sinh trong phiên Claude, `claude-opus-5-5`, 2026-10-19, không cần API key) → gói `core-dictionary` 1.1.0
- [ ] Duyệt nghĩa AI sinh tới `approved` (`content:validate --release` đạt) + xem 69 mục độ tin cậy thấp đang giữ lại (`content/.build/enrich-vi/held-low-confidence.json`)
- [ ] Pipeline: bỏ/gộp mục riêng của dạng biến tố chỉ mang nghĩa hiếm (came, am, apples…) — app đang tạm xếp từ gốc lên trước
- [ ] Lọc từ tục/nhạy cảm khi tra từ ở profile trẻ em (vd `came` → `cum`)

**DoD:** Dùng liên tục 1 tuần không lỗi nghiêm trọng; dịch từ < 1s; học & ôn từ vựng hằng ngày được; thú cưng phản ứng với việc học.

## Phase 2 — Đọc, Nghe, Trẻ em (≈ 8 tuần)

- [ ] Hệ thống dạng bài tập (registry) + các dạng: `mcq`, `gap_fill`, `word_order`, `tap_pairs`, `picture_choice`, `listen_choice`, `dictation`, `true_false_ng`
- [ ] Course → Unit → Lesson player, lưu tiến độ, chấm điểm, rating Elo
- [ ] Trình đọc tương tác (bấm từ tra, highlight từ trên level, TTS theo câu, song ngữ)
- [ ] Trình nghe (tốc độ, A–B loop, theo câu, transcript)
- [ ] Ngữ pháp: trang điểm ngữ pháp + bài tập
- [ ] Phrasebook
- [ ] Track trẻ em: phonics, chữ cái, picture book, chế độ phụ huynh (PIN, giới hạn thời gian)
- [ ] Checkpoint lên cấp, thành tựu, cửa hàng phụ kiện, tiến hoá thú cưng
- [ ] Thống kê cơ bản
- [ ] Nội dung: 50 bài đọc + 30 bài nghe A1–B1, 40 điểm ngữ pháp, 2 course A1–A2
- [ ] Auto-update

**DoD:** Một người A1–B1 và một bé 6–8 tuổi đều có lộ trình học ≥ 4 tuần không hết bài.

## Phase 3 — Nói, Viết, AI (≈ 8 tuần)

- [ ] Ghi âm + Whisper local (utilityProcess) + `ModelManager`
- [ ] `speak_repeat`, `pronounce_word` (chấm cấp 1–2), shadowing
- [ ] Cấu hình AI (provider, key mã hoá, giới hạn chi phí)
- [ ] LLM: giải thích ngữ pháp/câu, dịch nâng cao, `writing_feedback`, `speaking_feedback`, roleplay (người lớn)
- [ ] LanguageTool cho Writing
- [ ] Dạng bài `write_free`, `translate_sentence`, `transform`, `speak_answer`, `roleplay`
- [ ] Nhật ký tiếng Anh (💡) nếu kịp
- [ ] OCR vùng màn hình
- [ ] Theo dõi clipboard (opt-in)

**DoD:** Luyện nói/viết được hoàn toàn offline ở mức cơ bản; có AI thì nhận feedback chi tiết theo rubric.

## Phase 4 — Luyện thi + Backend Laravel (≈ 10 tuần)

- [ ] TOEIC: 7 Part, mini test, full test, ước lượng điểm
- [ ] IELTS: Reading/Listening dạng bài đầy đủ, Writing Task 1/2, Speaking Part 1–3 chấm AI
- [ ] Video library (YouTube embed + checkpoint)
- [ ] Track B2–C2 nội dung
- [ ] **Laravel**: API Sanctum, Content Studio (Filament) soạn/duyệt/sinh nội dung bằng AI, xuất pack, kho pack tải về
- [ ] Đồng bộ tiến độ (tuỳ chọn đăng nhập)

**DoD:** Người luyện TOEIC/IELTS có ≥ 5 đề mini + ngân hàng câu theo Part; pack mới phát hành qua backend mà không cần cập nhật app.

## Phase 5 — Polish & phát hành rộng (≈ 6 tuần)

- [ ] Nhiều nhân vật, mini-game
- [ ] Chấm phát âm cấp 3 (âm vị)
- [ ] Tối ưu hiệu năng, chế độ pin yếu
- [ ] Ký số code signing, trang giới thiệu, hướng dẫn sử dụng
- [ ] Thu thập phản hồi (form/issue, không tracking ẩn)
- [ ] Bản macOS (tuỳ nhu cầu)

---

## Rủi ro chính & cách giảm

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Thiếu nội dung chất lượng | Cao | Bắt đầu pipeline sớm; dùng AI sinh + duyệt; ưu tiên rule-based từ dữ liệu mở |
| Vấn đề license nội dung | Cao | Chính sách ở [08](08-content-sources.md); mọi bản ghi có `source.license`; tách pack share-alike |
| Cửa sổ trong suốt lỗi trên một số máy/GPU | Trung bình | Spike Phase 0 trên nhiều máy; tuỳ chọn tắt hardware acceleration |
| Model AI local nặng, chậm trên máy yếu | Trung bình | Model nhỏ lượng tử hoá; tải theo nhu cầu; fallback online |
| Mascot gây phiền → người dùng tắt | Cao | Chế độ yên lặng thông minh, tần suất mặc định thấp, dễ chỉnh |
| Phạm vi quá lớn cho 1 người | Cao | Bám MVP, cắt tính năng 💡, mỗi phase phải ra bản dùng được |
| Antivirus cảnh báo app chưa ký | Trung bình | Code signing (Phase 5); không dùng kỹ thuật hook bàn phím |
