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
- [x] Profile: tự tạo profile mặc định + thú cưng + túi đồ khởi đầu; màn hình chào lần đầu (tên, mục tiêu/độ tuổi, tên thú cưng, trình độ); tạo/chuyển hồ sơ trong Cài đặt; hồ sơ trẻ em (track mầm non/tiểu học) bật `isChild` — chưa thử tay
- [x] Cài đặt (trang trong cửa sổ Học tập + menu chuột phải): ngôn ngữ, kích thước mascot, khởi động cùng Windows, trình độ, mục tiêu ôn/ngày, tần suất nhắc, chế độ yên lặng — **còn** đổi phím tắt
- [x] i18n vi/en dùng chung main + renderer, design tokens, `PxPanel`, `PxBar`
- [x] Cài content pack (`core-dictionary`) — `ContentPackService`: tự cài gói đi kèm lúc khởi động (giải nén theo luồng, kiểm tra sha256, nâng cấp khi có bản mới)

**Mascot**
- [x] State machine: idle, walk, drag, fall, land, happy, eat, **sleep** (người dùng vắng ≥ 10 phút hoặc năng lượng ≤ 20 → ngủ, hồi 12 năng lượng/giờ; thức dậy khi quay lại) — chưa thử tay
- [x] Bong bóng thoại + hàng đợi ưu tiên, lời chào theo giờ, thẻ chỉ số khi rê chuột, vuốt ve (click)
- [x] Menu chuột phải (Cho ăn, Ẩn 30 phút/1 giờ, Kích thước, Ngôn ngữ, Khởi động cùng Windows, Thoát)
- [x] Chỉ số nuôi + `PetDecayJob` + nhắc đói + cho ăn + túi đồ
- [x] XP, xu, level thú cưng: sổ cái `xp_events` + `XpService`; nguồn XP: lưu từ (+1), ôn thẻ (+2), nhiệm vụ ngày
- [x] Chế độ yên lặng: fullscreen, hẹn giờ ẩn, **app họp** (Zoom/Teams/Webex/Skype, tab Meet/Teams trên trình duyệt), **giờ không làm phiền** (khung giờ tuỳ chọn, vắt qua nửa đêm được)
- [x] Icon app dạng pixel: đầu mèo "AI" (`pnpm sprites:icon` → `build/icon.ico|png`, `resources/icon.png`)

**Dịch & từ điển**
- [x] Popup dịch: copy + `Ctrl+Alt+T` → tra từ điển offline (từ gốc, dạng đã chia, tra ngược tiếng Việt), ô tìm kiếm, ví dụ, nhãn level, nhãn "AI" cho nghĩa chưa duyệt — đã thử tay OK
- [x] TTS hệ thống (US/UK) qua `speechSynthesis`
- [x] Giọng đọc tự nhiên offline Kokoro-82M (tuỳ chọn trong Cài đặt): tải model ~92 MB xác minh sha256, 8 giọng Mỹ/Anh, bộ nhớ đệm + tạo trước cho bài học, tự rơi về giọng Windows khi lỗi — đã kiểm tra worker trong Electron (dev + đóng gói); có khối "Giấy phép & ghi công" trong Cài đặt; chưa thử tay giao diện. **Còn**: giải quyết rủi ro GPL của eSpeak-NG trước khi thương mại, sinh sẵn audio lúc build
- [x] Dịch câu: opus-mt en→vi chạy offline trong utilityProcess; popup hỏi rồi tải model (~107 MB, xác minh sha256) khi copy câu — đã kiểm tra worker trong Electron (dev + layout đóng gói) và thử tay popup OK (2026-10-19). **Đã thêm (2026-10-19):** dịch Việt→Anh (`Xenova/opus-mt-vi-en`, ~107 MB, tự nhận chiều theo dấu tiếng Việt, mỗi chiều một model riêng) và khối "Dịch câu offline" trong Cài đặt (tải/huỷ/xoá từng model); chưa thử tay giao diện. **Còn**: LLM API như phương án mở rộng
- [x] Lưu từ → sổ từ (`saved_words`) + tạo thẻ SRS FSRS (`srs_cards`) kèm câu ngữ cảnh, +1 XP cho từ mới

**Học**
- [x] Bài học nền tảng: 34 bài / 5 chương (chữ cái & phát âm, mẫu câu 1–2, các thì, giao tiếp hằng ngày) tự soạn + trang "Bài học" (đọc bài, bài tập 5 dạng, thưởng XP lần đầu đạt, tiến độ) — chưa thử tay; **cần giáo viên người thật rà soát nội dung** ([07 §3b](07-learning-modules.md))
- [x] Thẻ ôn nhiều dạng (2026-10-19): thẻ gốc `en_vi` (lật thẻ) + 3 thẻ phụ tự tạo khi từ vào ôn dài hạn — `vi_en` (thấy nghĩa, gõ từ), `audio_en` (nghe, gõ), `cloze` (điền từ vào câu ngữ cảnh/ví dụ), đến hạn từ ngày hôm sau; gõ đáp án có chấm gần đúng và gợi ý mức chấm; tự đọc từ; hoàn tác lần chấm (Ctrl+Z/U); quản lý thẻ trong Sổ từ (lọc theo trạng thái/hay quên, sắp xếp, tạm dừng, đặt lại, xoá); lưu các từ khó của bài đọc và mẫu câu Phrasebook vào sổ thẻ; cài đặt hạn mức từ mới/ngày, thứ tự thẻ, bật/tắt từng hướng, tạo thẻ bù — chưa thử tay
- [x] SRS với ts-fsrs: `SrsService` (lịch FSRS, nhật ký `srs_reviews`, +2 XP/lần ôn) + phiên ôn đầy đủ trong cửa sổ Học tập (lật thẻ → chấm Quên/Khó/Được/Dễ, phím Space/1–4, hiện khoảng ôn lại dự kiến) — chưa thử tay
- [x] Micro-learning: quiz thẻ đến hạn (4 đáp án, chấm ở main: đúng nhanh → Được, đúng chậm → Khó, sai → Quên) + "Từ của khoảnh khắc" đúng trình độ khi không có thẻ đến hạn; tự nhắc mỗi 15/25/45 phút hoặc tắt, "🧠 Ôn từ ngay" trong menu chuột phải — đã thử tay OK (2026-10-19)
- [x] Trình độ: bài kiểm tra đầu vào từ vựng thích nghi (20 câu, `PlacementService`) + chọn tay (menu chuột phải, Cài đặt, màn hình chào) → `learning.level`
- [x] Cửa sổ Học tập: thanh bên (thú cưng, level, XP), trang chủ (thẻ đến hạn, streak, ôn hôm nay, tổng thẻ, **nhiệm vụ ngày**), phiên ôn, sổ từ, kiểm tra trình độ, cài đặt, màn hình chào; mở từ menu mascot/tray — **còn** lộ trình theo bài
- [x] Luyện tập: 5 dạng bài (điền từ, sắp xếp câu, nghe chọn nghĩa, nghe chép, ghép cặp) sinh từ câu Tatoeba + từ vựng đúng trình độ, phiên 10 bài, thưởng XP (tối đa 5 phiên/ngày) — đã thử tay OK (2026-10-19)
- [x] Placement nhiều kỹ năng: 20 câu xen kẽ từ vựng (10) / ngữ pháp (4) / đọc hiểu (3) / nghe (3), mỗi kỹ năng một "bậc thang" độ khó riêng, lưu trình độ theo kỹ năng (`learning.levelVocab/Grammar/Reading/Listening`) và trình độ chung; ngân hàng tự soạn ở `content/curated/placement` (33 câu ngữ pháp, 12 đọc hiểu, 15 nghe); Elo theo kỹ năng khởi tạo từ kết quả này — chưa thử tay

**Nội dung (song song)**
- [x] Pipeline: fetch + normalize Tatoeba, NGSL, CEFR-J, kaikki (Wiktionary), CMUdict
- [x] Build `core-dictionary` + `decks` theo level (v1.0.0 — [09 §10](09-content-pipeline.md#10-đã-làm-pipeline-core-dictionary-v1))
- [x] Công cụ sinh nghĩa tiếng Việt ngắn bằng LLM cho từ phổ biến còn thiếu (`pnpm content:enrich vi` → `curated/vocab/vi-generated.json`, [09 §10.5](09-content-pipeline.md#105-nghĩa-tiếng-việt-do-llm-sinh-contentenrich-vi)) — mẫu 50 từ
- [x] Sinh đủ từ còn lại: 2.693/2.762 từ (sinh trong phiên Claude, `claude-opus-5-5`, 2026-10-19, không cần API key) → gói `core-dictionary` 1.1.0
- [x] Duyệt nghĩa AI sinh tới `approved`: cả 2.442 từ `approved` (`review.by = Minh`; 303 từ cuối duyệt qua `vocab-303-review.csv`, 63 từ sửa nghĩa) → `content:validate --release` đạt
- [x] Đủ nghĩa tiếng Việt cho toàn bộ top 10k (2.442 từ nhờ nghĩa AI sinh; `fu` bị loại). 9.714 từ ngoài top 10k vẫn chưa có nghĩa tiếng Việt
- [x] 69 mục độ tin cậy thấp đã xử lý: 68 loại khỏi pack (`curated/vocab/excluded-words.json`), `jewelry` sửa ở `merge`
- [x] Pipeline `merge`: không lập mục riêng cho dạng biến tố chỉ mang nghĩa hiếm (came, ran, apples… — 1.885 mục) → gói `core-dictionary` 1.2.0 (24.616 từ)
- [x] Lọc từ nhạy cảm ở profile trẻ em: `curated/vocab/sensitive-words.json` (104 từ) → cột `words.sensitive`; ẩn khi tra từ, hỏi ôn, từ của khoảnh khắc — **còn** màn hình tạo profile trẻ em để bật `isChild`, lọc câu ví dụ có từ nhạy cảm

**DoD:** Dùng liên tục 1 tuần không lỗi nghiêm trọng; dịch từ < 1s; học & ôn từ vựng hằng ngày được; thú cưng phản ứng với việc học.

## Phase 2 — Đọc, Nghe, Trẻ em (≈ 8 tuần)

- [x] Hệ thống dạng bài tập (registry): logic từng dạng (`mcq`, `gap`, `order`, `match`=tap_pairs, `listen`, `tf`, `picture`) nằm ở `exercises/lessonExercises.ts` (khởi tạo, đủ để chấm, chấm đúng/sai, lời giải — có test), phần hiển thị dùng thành phần chung `ChoiceList`/`WordOrderBoard`/`MatchBoard`/`AudioPrompt` cho cả bài học lẫn luyện tập; thêm dạng mới = một mục trong registry + schema. **Còn**: `speak_repeat` có chấm giọng (chờ Whisper, Phase 3)
- [x] Course → Unit → Lesson: 3 khoá (Nền tảng A1, Giao tiếp A2, Tiến tới B1) ghép bài học/ngữ pháp/đọc/nghe thành lộ trình có thứ tự (`CourseService`, trang "Lộ trình"), tiến độ dùng chung `lesson_progress`; rating Elo theo 4 kỹ năng (từ vựng, ngữ pháp, đọc, nghe) cập nhật sau mỗi bài/câu (`ProgressService`, `shared/progress.ts`) — chưa thử tay
- [x] Trình đọc tương tác (bấm từ tra + lưu kèm câu ngữ cảnh, gạch chân từ trên level, TTS theo câu/cả bài, song ngữ từng đoạn) + 12 bài đọc A1–B1 có câu hỏi đọc hiểu (`ReadingPassage.vue`, `content/curated/readings`) — chưa thử tay. **Còn**: nhiều bài đọc hơn (mục tiêu 50), từ mới của bài vào SRS tự động
- [x] Trình nghe: phát liên tục từng câu bằng TTS (người nói A/B giọng Mỹ/Anh khác nhau), tốc độ 0.6×/0.8×/1×, nghe lại câu, lặp A–B, ẩn/hiện lời thoại và bản dịch, tự chép lời có chấm; 30 bài nghe A1–B1 (`ListeningPlayer.vue`, `content/curated/listening`); phần nghe trong bài kiểm tra đầu vào — chưa thử tay. **Còn**: audio thật (sinh sẵn lúc build) thay cho TTS khi cần chất lượng cao
- [x] Ngữ pháp: trang "Ngữ pháp" với 14 điểm (động từ khuyết thiếu, V-ing/to V, used to, bị động, cụm động từ, điều kiện 0/1/2, mệnh đề quan hệ, tường thuật, câu hỏi đuôi, đếm được/không đếm được, trạng từ tần suất, sở hữu, too/enough) + bài tập — chưa thử tay. **Còn**: đủ 40 điểm
- [x] Phrasebook: 12 nhóm tình huống, ~100 mẫu câu có nghe (TTS), nghĩa Việt, tìm kiếm, bấm để sao chép — chưa thử tay. **Còn**: lưu mẫu câu vào SRS
- [x] Track trẻ em (2026-10-19/20, chưa thử tay): giao diện riêng cho hồ sơ `isChild` (ô to có hình pixel + đọc to, không cần biết đọc), thẻ "nghe → chạm hình" (SRS hướng `audio_picture`, 60 hình pixel 64×64 tự vẽ), 25 hoạt động: chữ cái A–Z, âm (phonics), ghép âm CVC, từ nhìn là nhớ, sách tranh (4 truyện), tập viết chữ (tô theo chữ mẫu, chấm độ phủ), nói theo (tự xác nhận); album sticker, quà đồ ăn cho thú cưng, khu vực phụ huynh (PIN 4 số, quên PIN → giải phép nhân, giới hạn phút mỗi ngày, gia hạn, báo cáo 7 ngày). **Còn**: chấm giọng nói thật (chờ Whisper), âm đơn lẻ của TTS còn thô (cần audio thật), thêm sách tranh
- [x] Cửa hàng: mua đồ ăn + phụ kiện (nơ, kính, khăn, mũ chóp Lv5, vương miện Lv10) bằng xu, đeo/tháo, mascot vẽ lớp phụ kiện (`ShopService`, `acc-*.png` sinh từ `make-placeholder.mjs`) — chưa thử tay
- [x] Thành tựu, checkpoint lên cấp, tiến hoá thú cưng (chưa thử tay): 32 huy hiệu pixel art có thưởng XP và mascot báo; bài kiểm tra lên cấp 10 câu (đạt ≥ 80% lên một bậc, lần đầu qua bậc có thưởng; Thống kê gợi ý khi Elo của kỹ năng vượt level hiện tại); thú cưng tiến hoá 5 giai đoạn egg → baby → teen → adult → legend (sheet + phụ kiện từng giai đoạn sinh bằng `pnpm sprites:placeholder`, mascot đổi sheet và ăn mừng khi lên mốc level 2/10/25/50)
- [x] Thống kê cơ bản: trang "Thống kê" (`StatsService`) — streak hiện tại/dài nhất, lịch hoạt động 16 tuần, lượt ôn 14 ngày, tỉ lệ nhớ, so tuần này với tuần trước, thẻ theo trạng thái FSRS, từ trong sổ theo level; tính từ `srs_reviews` + sổ XP, không có bảng riêng — chưa thử tay
- [x] Thống kê nâng cao: từ hay quên nhất, độ chính xác 30 ngày theo dạng bài và hướng thẻ (bảng `exercise_stats`), rating Elo theo kỹ năng, thời gian học theo ngày/tuần/tổng (bảng `usage_days`) — chưa thử tay
- [x] Nội dung: đủ 30/30 bài nghe, 50/50 bài đọc, 40/40 điểm ngữ pháp, 3 khoá học (yêu cầu 2)
- [x] Auto-update: `electron-updater` qua GitHub Releases (`UpdateManager`): kiểm tra nền sau 45 giây và mỗi 6 giờ (tắt được), chỉ tải/cài khi người dùng đồng ý, UI trong Cài đặt; `user.db` được sao lưu tự động trước khi migrate (giữ 3 bản). **Còn**: phát hành bản đầu (`GH_TOKEN=... pnpm release:win`), ký số code signing, kiểm thử cập nhật thật giữa hai bản

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
