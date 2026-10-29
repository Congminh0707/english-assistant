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

## Nhật ký tiến độ (cập nhật liên tục)

- [x] 2026-10-28: sửa hoạt ảnh level cao bị cắt — khung sprite thêm lề (docs/05 §10b); sheet bộ cài đã sinh lại, lint/test pass.
- [x] 2026-10-28: gói hires 1.1.0 đã build (69.090.373 B, 65,9 MB; packSpec đã cập nhật). 🚧 Còn: tải `content/.build/pet-sprites-hires-1.1.0.zip` lên GitHub Release tag `pet-sprites-hires-1.1.0` (pre-release), rồi đo lại `pnpm stats` (docs/17).
- [x] 2026-10-29: dịch popup — NLLB-200 thay mBART-50 (từ không có trong từ điển cũng dịch máy; nạp sẵn model khi mở popup/khởi động) + dịch online tuỳ chọn (Claude, key người dùng, safeStorage). `pnpm lint && pnpm test` (385) pass; 🚧 Còn: thử tay trong app thật (tải NLLB ~870 MB, dán key, bôi đen dịch), đo lại thời gian, commit.

- [x] 2026-10-29: lên kế hoạch **mở rộng mạnh từ vựng trẻ em** — đã ghi roadmap [Phase 2b](#phase-2b--mở-rộng-từ-vựng-trẻ-em-đề-xuất-2026-10-29) + [decisions #35](decisions.md). Chưa code; chủ dự án đã đồng ý làm A + B.
- [x] 2026-10-29: thiết kế chi tiết giai đoạn A → `docs/19-kids-world.md` (12 nơi có công trình, bản đồ 3D three.js voxel + 2D dự phòng, gói tải thêm `kids-world`, decisions #36).
- [x] 2026-10-30: bước 1 docs/19 §8 — schema `src/shared/schemas/kidsWorld.ts` + logic thuần `src/shared/kidsWorld.ts` + 22 test (commit `e1a1527`).
- [x] 2026-10-30: bước 2 docs/19 §8 — nội dung tầng 1 (`content/curated/kids/world/`: 12 nơi × 10 từ), 24 hình pixel mới (`src/shared/picturesMore.ts`), lõi voxel + 12 công trình voxel (`src/shared/voxels/`), test nội dung + voxel.
- [x] 2026-10-30: bước 3 docs/19 §8 — `KidsWorldLibrary`, `KidsWorldService`, kênh `kids:world`/`kids:visit`/`kids:visit-done`, `kids:home` có tiến độ bản đồ, test service (7). `pnpm stats` đếm thêm nơi/từ/công trình/hình. lint 0 lỗi, typecheck sạch, 428 test pass.
- 🚧 Đang làm (2026-10-30): bước 4 docs/19 §8 — ✅ code xong: `src/renderer/study/kids/KidsWorld.vue` (bản đồ 2D), `KidsVisit.vue` (lượt 5 bước), `LandmarkPicture.vue`, ô Chơi mở bản đồ, `kids:next` thôi tự giới thiệu hình mới; lint 0 lỗi, typecheck, `ui:audit` 0 lỗi, 429 test, `pnpm build` qua. **Còn: thử tay trong app thật** (`pnpm dev`, tạo hồ sơ trẻ em mới + hồ sơ cũ đã có thẻ hình: đi bản đồ, chơi đủ 5 bước, xong một nơi nhận rương, bình tưới). Sau đó: bước 5 spike 3D.

> Quy tắc: ghi `🚧 Đang làm` trước khi bắt đầu việc dài, xoá/đổi thành `[x]` ngay khi xong. Xem AGENTS.md.

- ✅ Xong (2026-10-25): **Sửa lỗi báo cáo**: `PicText` giữ nguyên chữ ASCII (pig/hat) trừ bài chọn hình (`ids`) → ghép cặp & "cặp vô thanh – hữu thanh" không còn thay chữ bằng ảnh; bài đọc không tra/lưu tên riêng (Hue, Da Nang); trạng thái "đã lưu" tính theo thẻ ôn còn dùng của profile. Tên riêng dùng `shared/properNouns.ts` (có test); pack từ điển 1.6.0 đã lọc từ không phải tiếng Anh chuẩn (đã build, chưa phát hành — xem docs/09). lint 0 lỗi, 371 test, ui:audit 0 lỗi.
- ✅ Xong (2026-10-20): **Làm lại sprite chi tiết gấp 4** (khung 96×96, 20 hoạt ảnh, phụ kiện lớp sau lưng, MascotBrain tự chơi) — lint/typecheck/310 test/build qua; **đã thử tay OK (2026-10-20) trong app** (xem mascot mới đi/nhảy/ngủ, đổi kích thước 1/2/3, đeo cánh/áo choàng, trang Thú cưng). Sheet ~16 MB cho cả bộ: cân nhắc nén/lược bớt khi đóng gói.
- ✅ Xong (2026-10-20): **Nhiều thú cưng (5 nhân vật) + trang Thú cưng/cây tiến hoá + màn hình tiến hoá + vật phẩm cửa hàng mới** — lint/typecheck/310 test/build qua; đã thử tay OK (2026-10-20) trong app (cần: mua & chọn nhân vật, xem mascot đổi hình, đeo cánh/áo choàng, màn tiến hoá khi lên level 2/10/25/50).
- ✅ Xong (2026-10-20): workflow phát hành `.github/workflows/release.yml` — chỉ chạy khi push nhánh `release`, chỉ phát hành khi version trong package.json chưa có tag (`scripts/release/check-version.mjs`), tự tạo release + tag (không push tag); **chưa chạy thử trên GitHub**. Cần làm một lần: tải content pack lên release `content-pack-1.2.0` (docs/15 §6) và tạo nhánh `release`.
- ✅ Xong (2026-10-21): phát hành `v1.0.0`, `v1.0.1` bằng workflow (release tự tạo tag); **đã thử cập nhật tự động v1.0.0 → v1.0.1 OK** và icon khay hệ thống đã hiện ở bản cài. Ký số: bỏ qua theo yêu cầu (bàn lại khi cần).
- ✅ Xong code (2026-10-21, **chưa thử tay**): **Chấm phát âm theo âm vị (wav2vec2, tải tuỳ chọn 355 MB)** — `duyentq/sonari-wav2vec2-phoneme-int8` rev f0652c4 (sha256 cd51f953…), worker `phonemeWorker` (onnxruntime-node + phonemizer/espeak), `PronunciationService.evaluate` + kênh `pron:evaluate`, so khớp âm vị `shared/phonemes.ts` (+ mẹo sửa tiếng Việt cho 26 âm), `SpeakPractice` chế độ âm vị; bảng chữ cái/âm (khối `sounds`) có nút 🎤 luyện từng ô, bài nói `speak` ưu tiên chấm âm vị khi đã tải model. Đã thử worker đã build với giọng Kokoro: sheep/right đúng, think → θ bị nghe thành /f/. Chưa: hoạt động chữ cái/âm của bé (kids) chưa dùng; ngưỡng điểm chưa hiệu chỉnh với giọng người Việt thật.
- ✅ Xong code (2026-10-21, **chưa thử tay**): **Phase 3 — bài nói**: ghi âm micro (`useRecorder`, quyền micro chỉ cho trang của app) → Whisper base.en offline (`SttService`/`WhisperEngine`, model ~80 MB tải khi đồng ý) → chấm theo từ + độ trôi chảy (`shared/speech.ts`) → dạng bài `speak` (speak_repeat/pronounce_word) + unit "Luyện nói" (5 bài); panel Cài đặt → Nhận dạng giọng nói. wav2vec2 chỉ là khung tải tuỳ chọn (`PronunciationService`, chưa có ONNX để tải, không có paywall). Cần thử tay: cấp quyền micro, tải model, nói thử, thấy điểm từng từ.
- ✅ Xong (2026-10-21): **việc nhỏ treo** — chỉ báo "đang tạo giọng đọc" ở mascot; câu thoại riêng 5 nhân vật + câu chung + nói bâng quơ (`mascot.chars.*`); gói âm thanh bài nghe tạo sẵn tải thêm (MP3 14,3 MB, release `listening-audio-1.0.0`, tải trong Cài đặt/trang Nghe, đã thử tải thật từ GitHub). Chưa thử tay trong app (nghe bài nghe với gói, mascot nói câu riêng).
- Trước đó: workflow phát hành xong, v1.0.1 đã phát hành & thử auto-update OK.

- ✅ Xong code (2026-10-21, **chưa thử tay**): **Sửa màn Ôn từ** — thứ tự ngẫu nhiên (mặc định mới `review.order = random`, xáo trong bể 150 thẻ đến hạn) + **ẩn từ vừa ôn** `review.hideMinutes` (mặc định 30 phút; ẩn theo từ, gồm mọi dạng thẻ và cả thẻ chấm "Quên"; chế độ trẻ em không ẩn) để thoát ra vào lại không phải làm lại từ đầu; thẻ điền từ có ô chữ (chữ đầu + số chữ), nghĩa của từ, nút "Gợi ý thêm 1 chữ" và "Nghe câu"; hình pixel minh hoạ khi từ có hình; bố cục căn giữa, chữ lớn hơn, nút "Không nhớ" rõ ràng. Cài đặt → Ôn từ có "Ngẫu nhiên" và "Ẩn từ vừa ôn".
- ✅ Xong code (2026-10-21, **chưa thử tay**): **Thẻ nhận diện tương tác** — trắc nghiệm nghĩa 4 lựa chọn (`review.choices`), nút 🎤 nói to, câu ngữ cảnh có từ tô đậm ở mặt trước (từ nhiều nghĩa), nghĩa mascot/màn ôn thống nhất (`formatMeanings`), dòng gợi ý phím tắt đổi theo trạng thái; thẻ điền từ chỉ hiện nghĩa khi từ có 1 nghĩa.

- ✅ Xong code (2026-10-21, **chưa thử tay**): **Biểu cảm/hành động riêng từng nhân vật** — 17 hoạt ảnh `quirk_*` (Bi 3, Webby 3, Draco 3, Robo 4, Kitsu 4) + chỉnh hoạt ảnh chung theo nhân vật (TWEAKS) + 5 kiểu mắt & 6 hiệu ứng mới; `sheet.json` riêng từng nhân vật; `MascotBrain` tự chọn quirk. **Vật phẩm cửa hàng**: +8 đồ ăn, +9 phụ kiện (tổng 20; xem docs/06). Chi tiết docs/05 §10.
- ✅ Xong code (2026-10-21, **chưa thử tay**): **Phản ứng tương tác riêng từng nhân vật** — 2 phản ứng bấm `click_*` mỗi nhân vật (10 hoạt ảnh) chọn ngẫu nhiên cùng happy/love; kéo/rơi/chạm đất/ăn chỉnh theo tính cách (`INTERACTION_TWEAKS`). Chi tiết docs/05 §10.

- ✅ Phát hành `v1.1.0` (2026-10-22): bài nói (Whisper + wav2vec2 tuỳ chọn), màn Ôn từ mới, 5 thú cưng có hành động/phản ứng riêng, thêm vật phẩm cửa hàng. Đã chạy lint/typecheck/test/build local trước khi đẩy; workflow GitHub tạo release + tag.

- ✅ Xong (2026-10-22): **mở rộng từ điển 24,6k → 43,6k từ** (nguồn wordfreq, docs/09 §10.3): đã duyệt hết nghĩa AI sinh (`validate --release` đạt), tải pack lên release `content-pack-1.3.0`, đổi `CONTENT_PACK_TAG`, phát hành app `v1.2.0`. **Còn dở:** sinh nghĩa Việt cho **26.862 từ** chưa có (`content:enrich vi`, theo đợt rồi duyệt).
- ✅ Xong code (2026-10-22, **chưa thử tay trong app**): **Tra từ gõ sai chính tả** — gợi ý "Có phải bạn muốn tìm…" (registation → registration) trong popup. (Mở rộng độ phủ từ điển đã làm ở pack 1.3.0 — dòng ngay trên.)
- ✅ Xong code (2026-10-22, **chưa thử tay trong app**): **Dịch câu/đoạn chuẩn hơn (offline)** — model tuỳ chọn mBART-50 chất lượng cao (~890 MB (848 MiB), Anh↔Việt một model), ưu tiên khi đã tải; nút tải trong popup + Cài đặt; dịch nhóm 2–3 câu, giới hạn 1200 ký tự; test dịch vụ (chọn engine, cache theo engine). Đã chạy worker đã build với model thật OK (2–8 s). Chi tiết docs/11 §2, decisions #27.
- ✅ Xong code (2026-10-23, **chưa thử tay**): **Mascot đôi lúc hiện sprite 96px dù đã tải gói 288px** — nguyên nhân: lúc khởi động mascot gọi `loadLook` trước khi biết trạng thái gói (`startHires` không chờ) → nạp 96px; khi trạng thái về, `watch(hiresVersion)` bỏ qua vì animator chưa dựng → kẹt đến khi đổi thú cưng. Sửa: `startHires()` trả Promise và mascot `await` trước khi chọn sprite; nhớ cờ `hiresChangedEarly` để làm lại sau khi dựng; không nhớ kết quả lỗi `null` của sheet trong cache. Test `hires.test.ts`.
- ✅ Xong code (2026-10-23, chưa thử tay trong app thật, chưa commit): **Sửa thông tin cá nhân & thú cưng tuỳ ý** — kênh `profile:update` (tên hồ sơ ≤ 40 ký tự, mục tiêu học/track — đổi sang track trẻ em thì bật chế độ trẻ em, giữ nguyên level/XP — và tên thú cưng ≤ 20 ký tự; sửa được cả hồ sơ không đang dùng), `ProfileService.update`, nút ✎ "Sửa" từng hồ sơ trong Cài đặt, nút đổi tên ngay trên thẻ chính trang Thú cưng; mascot cập nhật tên qua `pet.updated`. Test `sửa hồ sơ`.
- ✅ Xong (2026-10-28, chưa commit): **Công cụ dev tăng level** — kênh `dev:level-up` (chỉ đăng ký khi chạy dev, cùng cờ `devTools`) + nút "Tăng 10 level" cạnh nút cộng xu ở Cài đặt; cộng đủ XP (`totalXpForLevel` trong `src/shared/pet.ts`) qua `xp.grant` (`reason = dev.grant`) nên sổ XP vẫn khớp và có sự kiện level-up.
- ✅ Xong (2026-10-23, chưa commit): **Công cụ dev cộng xu** — kênh `dev:grant-coins` (chỉ đăng ký khi chạy dev: `registerAppIpc(..., devTools = !app.isPackaged)`) + nút "Cộng 1.000.000 xu" ở Cài đặt chỉ hiện khi `import.meta.env.DEV`; ghi sổ XP (`reason = dev.grant`) nên tổng xu vẫn tính lại được. Bản đóng gói không có handler. (Đã thử sửa thẳng `user.db` bằng công cụ ngoài nhưng SQLite ngoài báo "database disk image is malformed" nên bỏ, không đụng dữ liệu.)
- 🚧 Đang làm (2026-10-23): **Duyệt lại nghĩa Việt HIỆN CÓ bằng opus** (her → "chỉ/bả", them → "bầy quân", you → "various", a → "ờ"… do Wiktionary/suy ngược sai/thô/thiếu lịch sự). Công cụ mới `pnpm content:enrich vi-recheck [--from-rank N --to-rank M --limit N --model claude-opus-5-5]` (xét theo tần suất, trả `keep`/`replace`; `replace` ghi `vi-generated.json` với `replace: true` → stage merge THAY hẳn nghĩa Wiktionary; sổ đã xét `curated/vocab/vi-recheck.json`, chạy lại không xét lại). Thử 100 từ đầu: 23 giữ, 77 sửa (she → cô ấy/chị ấy/bà ấy; you → bạn/các bạn…; a → một/(mạo từ…); they → họ/chúng…); chi phí ≈ 4% hạn mức 5 giờ/100 từ (opus-5-5, effort medium) → 3.000 từ ≈ 120%, chia ~3 đợt. **Còn:** chạy tiếp rank ≤ 3.000 (rồi mở rộng top 10k), xong thì `content:normalize merge level` → `content:validate --release` → `content:build` (pack mới) → release. **Tiến độ (2026-10-23):** đã xét 1.000 từ đầu (giữ 270 / sửa 730), đang chạy tiếp nốt top 3.000; **đã lên lịch 1 lần** tác vụ Windows `EnglishAssistant-ViRecheck-Once` lúc **01:40 ngày 24/10 (giờ máy, sau khi hạn mức 5 giờ reset 01:30)** chạy `content/.build/enrich-vi/scheduled-recheck.ps1` (vi-recheck rank ≤ 10.000, tối đa 2.000 từ → `content:normalize merge level` → `content:validate --release`; không commit/release; log `content/.build/enrich-vi/scheduled-recheck.log`; tự xoá sau 1 ngày; xem/xoá: `Get-ScheduledTask`/`Unregister-ScheduledTask`). **Cập nhật 2026-10-24:** tác vụ hẹn giờ đã chạy xong (5.000 từ đã xét, validate đạt); đã phát hành pack 1.5.0 (`content-pack-1.5.0`) + app v1.3.2. Còn: xét rank 5.001–10.000 và `hers`.
- ✅ Phát hành `v1.3.1` (2026-10-23): rà lại toàn bộ UI — 25 nút còn lớp cũ (`primary`, `small`, `link`, `tool`, `ghost`: màn kết quả bài học "Bài tiếp theo", Cài đặt, Báo cáo phụ huynh, Bài đọc, Ôn từ, Onboarding) chuyển sang `.btn`; sao ở màn kết quả tô vàng; mọi `h1` cùng cỡ, `h2` cùng `--fs-lg`; thanh `<progress>`/checkbox theo token; `ui:audit` bắt thêm nút kiểu cũ/không lớp (nguyên nhân sót: trình thay thế trước dừng ở `>` nằm trong thuộc tính `v-if`).
- ✅ Phát hành `v1.3.0` (2026-10-23): dọn UI đồng bộ toàn app (token + `.modern`, `UiIcon` lucide, bo góc, popup/bong bóng mascot hiện đại, `pnpm ui:audit`), sửa nhiệm vụ/lưới ô âm/lag trang Thú cưng, mascot luôn dùng sprite 288px khi đã tải gói, sửa hồ sơ + tên thú cưng (`profile:update`), gói sprite 288px, huy hiệu 256px, hình trẻ em 256px + Twemoji, gói tải thêm cập nhật có hỏi. Đã chạy lint/typecheck/370 test/build local trước khi đẩy; **chưa thử tay trong app thật**. Các mục chi tiết bên dưới (ghi lúc làm) vẫn giữ để tra cứu. Dòng gốc: **đã xong code các bước 1–4, chưa thử tay trong app thật; chưa commit**): **Dọn UI + lỗi vặt (tạm dừng thêm chức năng)** — thứ tự: (1) ✅ sửa thanh nhiệm vụ tụt sau khi đã xong (`MissionService.state`, có test); (2) căn thẻ Cửa hàng/Thú cưng (nút, mô tả, trạng thái "đã có"); (3) hệ design token hiện đại + `.btn/.card/.chip` dùng chung, thử trên Trang chủ/nav/Thú cưng/Cửa hàng rồi mới quét toàn app (docs/12 + decisions); (4) giao diện trẻ em; (5) ảnh thật thay pixel — **đã huỷ** (giữ hình pixel tự vẽ, decisions #30). Đã xong: bước 1 (nhiệm vụ), 2–3 (token + `ui.css` + Trang chủ/nav/Nhiệm vụ/Cửa hàng/Thú cưng/Thống kê, quét tự động các trang còn lại), 4 (kids: nút 3D mềm). Chi tiết docs/12 §1b, decisions #28. Đợt 3 (2026-10-23): lưới ô âm trong bài học (nút micro nằm trong thẻ, các ô cùng chiều cao), bảng bài học bo góc, bong bóng mascot hiện đại (`shared/styles/ui.css` dùng chung `.modern`), `ui:audit` quét thêm `mascot/components`. Sửa lag trang Thú cưng (2026-10-23, **chưa kiểm trên app thật**): nguyên nhân thật là mỗi sheet gói 288px là **2304×8928 ≈ 82 MB khi giải mã**, trang có ~12 sprite dùng làm `background-image` ≈ 1 GB ảnh → giật. Nay `PetSprite` (gói 288px) chỉ lấy **hàng idle** (2304×288 ≈ 2,6 MB, `hiresIdleBitmap` trong `shared/pet/hires.ts`, giải mã tuần tự, nhớ lại) và **vẽ lên canvas**; trong lúc nạp vẫn hiện sprite 96px của bộ cài. Đã sửa thêm: vị trí khung bằng biến CSS `--f` thay vì gán lại style mỗi 170 ms. **Còn:** cửa sổ mascot vẫn nạp nguyên sheet (cần mọi hoạt ảnh) — xem nếu mascot cũng nặng. Đợt 4: popup Dịch nhanh hiện đại (cửa sổ `transparent`, `PopupWindow.ts`), thay bóng đổ focus kiểu pixel bằng vòng focus, nền study `#f5f6fa`; `ui:audit` quét thêm `popup`. Đợt 2 (2026-10-23): bo góc đồng nhất toàn app, thay emoji bằng `UiIcon` (lucide), nút nghe/lưu thành `.btn--icon`, viết [docs/18-ui-rules.md](18-ui-rules.md) + `pnpm ui:audit` (0 lỗi). Kiểm tra: `pnpm lint && pnpm test` + chụp ảnh app trước/sau.
- ↩️ Huỷ (2026-10-23): **ảnh thật cho hình từ vựng trẻ em** — chủ dự án quyết định giữ hình pixel tự vẽ; đã hoàn tác toàn bộ code/ảnh/script/docs liên quan (decisions #30). Giao diện (token, `UiIcon`, bo góc, `ui:audit`) giữ nguyên.
- 🚧 Đang làm (2026-10-23): **Sprite thú cưng 288px làm gói tải thêm** (chủ dự án chọn 288px, bộ cài giữ 96px). **Xong code:** `SPRITE_SCALE`/`SPRITE_OUT` trong `scripts/sprites`, `SpritePackManager/Service` + kênh `sprites:*` + test, `PetSprite`/mascot dùng gói khi đã cài, panel Cài đặt "Thú cưng nét hơn", script `build-hires-pack.mjs`. **Đã sinh + đóng gói** (25 bộ, zip 57,2 MB, sha256 071e362d…; `packSpec.ts` đã điền; cài thử gói thật bằng `SpritePackManager` OK). **Release `pet-sprites-hires-1.0.0` đã đăng (kiểm bằng `gh release list`, 2026-10-23).** **Còn:** thử tay trong app (tải gói, thấy mascot/trang Thú cưng nét hơn, gỡ gói quay lại 96px) → phát hành app. **Chưa làm:** huy hiệu (`badgeArt.ts`) và hình/vật phẩm pixel (`pictures.ts`) vẫn 32×32; chủ dự án cũng muốn nâng độ phân giải — làm sau khi duyệt mẫu. Chi tiết docs/05 §11, decisions #29.
- ✅ Xong code (2026-10-23, chưa thử tay trong app): **Huy hiệu Thành tựu 256×256** (chủ dự án duyệt mẫu ngọn lửa rồi cả bộ): 9 biểu tượng vẽ chi tiết × 4 hạng + khoá, 37 PNG ≈ 1,5 MB (`pnpm badges`), `PixelBadge` dùng ảnh. (Vật phẩm cửa hàng: xem dòng 2026-10-24.)
- ✅ Xong code (2026-10-23, chưa thử tay): **Cập nhật gói tải thêm có hỏi** — đổi version gói âm thanh/sprite 288px thì bản cũ vẫn dùng, panel Cài đặt hiện "Có bản mới" + nút Cập nhật (không tự tải ngầm); từ điển vẫn tự cập nhật. docs/15 §6d. Chưa commit.
- ✅ Phát hành `v1.4.0` (2026-10-24): biểu tượng vật phẩm cửa hàng Twemoji, chấm phát âm âm vị cho bé, hiệu chỉnh ngưỡng giọng Việt (heuristic), sửa chế độ phụ huynh sau đổi hồ sơ, thẻ hỏi ôn mascot không bị cắt. Đã chạy lint/typecheck/test local trước khi đẩy.
- ✅ Xong code (2026-10-24, chưa thử tay): **Thẻ hỏi ôn ở mascot bị cắt khi nghĩa dài** — cửa sổ mascot 320×320 → 360×440, thẻ rộng 216 → 300 px (bong bóng tối đa 336 px).
- ✅ Xong code (2026-10-24, chưa thử tay): **Sửa lỗi chế độ phụ huynh còn sót sau khi đổi hồ sơ** — `parentMode` trong `study/App.vue` nay tự tắt khi đổi hồ sơ hoặc sang hồ sơ không phải trẻ em (trước đó banner "Quay lại màn hình bé" còn hiện ở hồ sơ người lớn).
- ✅ Xong code (2026-10-24, chưa thử tay, chưa commit): **(1) Biểu tượng vật phẩm cửa hàng nét hơn** — emoji hệ thống của đồ ăn/phụ kiện/nhân vật trong Cửa hàng thay bằng SVG Twemoji (CC-BY 4.0, ghi công sẵn) đóng gói ở `assets/items/` (42 file, 171 KB, `node scripts/images/twemoji-items.mjs`), component `ItemEmoji`; menu chuột phải của mascot vẫn dùng emoji chữ (menu hệ thống). (Hình minh hoạ `pictures.ts` đã 256 px từ trước.) **(2) Chấm phát âm cho bé** — `SpeakPractice kids` + `KidsActivity` (xem docs/11 §4). **(3) Hiệu chỉnh ngưỡng giọng Việt** theo heuristic `VIETNAMESE_NEAR` (docs/11 §4); **còn:** đo bằng ghi âm người Việt thật. Lint/typecheck/371 test qua.
- ✅ Xong code (2026-10-23, chưa thử tay, chưa commit): **Sticker/hình minh hoạ độ phân giải cao + thêm 99 từ mới** — 60 hình vẽ lại 256×256 (`pnpm pictures` → `assets/pictures/*.png`, đổ sáng mượt), 99 hình Twemoji (CC-BY 4.0, `scripts/images/twemoji.mjs` → `assets/pictures/twemoji/*.svg`, danh sách ở `src/shared/pictureExtras.ts`); `PixelPicture` dùng ảnh, `ALL_PICTURE_IDS` (159 hình) đưa vào bộ thẻ/album trẻ em; ghi công Twemoji ở Cài đặt → Giấy phép & ghi công. **Còn:** ảnh thật CC0/CC-BY của phiên song song (kids photos) vẫn dang dở.
- ✅ Phát hành `v1.2.2` (2026-10-22): pack **1.4.0** (thêm 1.877 nghĩa AI sinh đã duyệt; từ nay `draft` không vào pack), release `content-pack-1.4.0`, `CONTENT_PACK_TAG` đổi theo; `vi-review` duyệt theo `freqRank`. Số liệu ở docs/17.
- ✅ Sửa CI (2026-10-22): lần chạy release v1.2.2 đầu tiên lỗi test `chế độ trẻ em` (hook cài pack quá 30 s; cả bộ test chạy 485 s trên runner so với 66 s ở máy dev) → `vitest.config.ts` nới timeout lên 120 s khi `CI` được đặt; chạy lại workflow bằng push mới lên `release`.
- 🚧 Tạm dừng (2026-10-22, theo hạn mức phiên 5 giờ): **Sinh + duyệt nghĩa Việt cho từ ngoài top 10k bằng Claude CLI.** Trạng thái `vi-generated.json` (22.263 mục): 4.907 `approved` (3.030 cũ + 1.877 duyệt AI đợt này), 17.233 `draft`, 123 `rejected`; còn **7.629 từ chưa sinh**. **Tiếp tục:** (1) sinh nốt: `pnpm content:enrich vi --provider claude-cli --model sonnet --effort low --batch 40 --concurrency 3 [--limit N]` (idempotent; ~0,3% hạn mức Pro mỗi lô 40 từ); (2) duyệt (theo `freqRank` từ thấp lên cao, từ phổ biến trước — sửa 2026-10-22; 2.000 mục duyệt đợt đầu toàn là từ a/b vì lúc đó duyệt theo thứ tự chữ cái): `pnpm content:enrich vi-review --model sonnet --batch 25 --concurrency 3 [--limit N]` (~1,2% hạn mức / 100 từ với sonnet, ~2% với opus mặc định; sonnet sửa ~46% mục, opus ~16% — sonnet khắt khe hơn nhưng rẻ hơn chút, đã chọn sonnet theo yêu cầu); `by` = `claude-cli-review:<model>` (duyệt bằng AI, không phải người); (3) có thêm `approved` → `content:normalize merge level` → `content:validate --release` → tăng version pack trong `scripts/content/packs.ts` → `content:build` → tải lên release `content-pack-<ver>`, đổi `CONTENT_PACK_TAG`, tăng version app, phát hành → `content:stats` rồi cập nhật docs/17 §3 + docs/09 §10.3. (Pack 1.4.0 đã phát hành với phần `approved`; `draft` không vào pack nên `validate --release` đạt.) `missing-vi.json` nay gồm mọi từ (`level/apply.ts`).
- ✅ Phát hành `v1.2.1` (2026-10-22): sửa popup dịch (câu dài không bị cắt ở 200 ký tự, có thông báo khi vượt 1.200 ký tự; trạng thái model dịch không còn báo sai), `pnpm stats` / `pnpm content:stats`, docs/17-metrics.md, công cụ `content:enrich vi-review`. **Không đổi content pack** (vẫn `content-pack-1.3.0`): 11.636 nghĩa AI sinh mới đang `draft`, chưa duyệt nên chưa đưa vào pack (quy tắc `validate --release`). Đã chạy lint/typecheck/358 test/build local trước khi đẩy.
- ✅ Xong (2026-10-22): **Rà lại docs + số liệu** — thêm [17-metrics.md](17-metrics.md) (bảng số liệu đo bằng lệnh) và lệnh `pnpm stats` / `pnpm content:stats`; sửa số cũ sai (bài học 34→43, mBART ~875→~890 MB, từ nhạy cảm, độ phủ 24,6k→43,6k, 26.862 từ chưa có nghĩa Việt, roadmap pack 1.3.0 đã phát hành); quy tắc "cập nhật số liệu" thêm vào AGENTS.md và docs/README. Lint/typecheck/358 test qua.
- ✅ Xong code (2026-10-22, chưa thử tay): **Sửa popup dịch** — (1) văn bản dài bị cắt ở 200 ký tự (`MAX_QUERY` trong `normalizeQuery`) → nâng lên 1200 (= `TRANSLATE_MAX_CHARS`), clipboard/selection chỉ chặn 20k ký tự; vượt 1200 thì cắt và popup hiện thông báo `translate.truncated` (`LookupResult.truncated`); (2) popup báo "chưa tải model" dù đã tải → làm mới `translate:status` trước mỗi lần dịch (`useTranslateModels.refresh`), tự dịch lại khi `canTranslate` chuyển true, khối tải chỉ hiện khi thật sự chưa dịch được; (3) sửa chuỗi `v-if/v-else-if` bị gợi ý nâng cấp chèn giữa. Kiểm tra: `pnpm lint && pnpm test`.

- ✅ Xong code (2026-10-22, **chưa thử tay**): **Bôi đen rồi Ctrl+Alt+T là dịch được** (không cần Ctrl+C): `system/selection.ts` gửi Ctrl+C giả lập, đọc chữ, khôi phục clipboard; bỏ qua terminal; có công tắc `translate.autoCopy`. Chi tiết docs/11 + docs/16.

## Phase 0 — Spike: cửa sổ mascot (≈ 2 tuần)

Mục tiêu: chứng minh các kỹ thuật khó nhất chạy được trên Windows.

- [x] Tạo project electron-vite + Vue + TS ([04](04-getting-started.md)), ghim Node/pnpm bằng Volta
- [x] Cửa sổ trong suốt, không khung, luôn trên cùng, không hiện taskbar, không cướp focus
- [x] Click xuyên qua vùng trong suốt, bắt được click trên nhân vật — đã thử tay OK (2026-10-18)
- [x] Kéo thả nhân vật; thả ra rơi xuống mép taskbar (có trọng lực); click → nhảy vui — đã thử tay OK (2026-10-18)
- [x] Animation sprite sheet (idle + walk + drag/fall/land/happy) bằng canvas, nhân vật tự đi qua lại — sprite tạm (`pnpm sprites:characters`)
- [x] Tray icon: Hiện/Ẩn, Đưa về góc, Thoát
- [x] Phím tắt toàn cục `Ctrl+Alt+T` bật/tắt popup trống cạnh con trỏ (Esc / click ra ngoài để đóng) — _đã code, cần thử tay_
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

- [x] Bài học nền tảng: 34 bài / 5 chương lúc đầu (chữ cái & phát âm, mẫu câu 1–2, các thì, giao tiếp hằng ngày); hiện **43 bài / 7 chương** (thêm hình minh hoạ, luyện nói — [17 §2](17-metrics.md)) tự soạn + trang "Bài học" (đọc bài, bài tập 5 dạng, thưởng XP lần đầu đạt, tiến độ) — chưa thử tay; **cần giáo viên người thật rà soát nội dung** ([07 §3b](07-learning-modules.md))
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
- [x] Đủ nghĩa tiếng Việt cho toàn bộ top 10k (2.442 từ nhờ nghĩa AI sinh; `fu` bị loại). ngoài top 10k vẫn chưa có nghĩa tiếng Việt (9.714 từ ở bản 1.2.0; **26.862 từ ở bản 1.3.0**)
- [x] 69 mục độ tin cậy thấp đã xử lý: 68 loại khỏi pack (`curated/vocab/excluded-words.json`), `jewelry` sửa ở `merge`
- [x] Pipeline `merge`: không lập mục riêng cho dạng biến tố chỉ mang nghĩa hiếm (came, ran, apples… — 1.885 mục) → gói `core-dictionary` 1.2.0 (24.616 từ)
- [x] Lọc từ nhạy cảm ở profile trẻ em: `curated/vocab/sensitive-words.json` (104 từ lúc đầu, nay 106; pack 1.3.0 gắn cờ tổng 569 từ gồm cả từ tự nhận diện) → cột `words.sensitive`; ẩn khi tra từ, hỏi ôn, từ của khoảnh khắc — **còn** màn hình tạo profile trẻ em để bật `isChild`, lọc câu ví dụ có từ nhạy cảm

**DoD:** Dùng liên tục 1 tuần không lỗi nghiêm trọng; dịch từ < 1s; học & ôn từ vựng hằng ngày được; thú cưng phản ứng với việc học.

## Phase 2 — Đọc, Nghe, Trẻ em (≈ 8 tuần)

- [x] Hệ thống dạng bài tập (registry): logic từng dạng (`mcq`, `gap`, `order`, `match`=tap_pairs, `listen`, `tf`, `picture`) nằm ở `exercises/lessonExercises.ts` (khởi tạo, đủ để chấm, chấm đúng/sai, lời giải — có test), phần hiển thị dùng thành phần chung `ChoiceList`/`WordOrderBoard`/`MatchBoard`/`AudioPrompt` cho cả bài học lẫn luyện tập; thêm dạng mới = một mục trong registry + schema. **Còn**: `speak_repeat` có chấm giọng (chờ Whisper, Phase 3)
- [x] Course → Unit → Lesson: 3 khoá (Nền tảng A1, Giao tiếp A2, Tiến tới B1) ghép bài học/ngữ pháp/đọc/nghe thành lộ trình có thứ tự (`CourseService`, trang "Lộ trình"), tiến độ dùng chung `lesson_progress`; rating Elo theo 4 kỹ năng (từ vựng, ngữ pháp, đọc, nghe) cập nhật sau mỗi bài/câu (`ProgressService`, `shared/progress.ts`) — đã thử tay OK (2026-10-20)
- [x] Trình đọc tương tác (bấm từ tra + lưu kèm câu ngữ cảnh, gạch chân từ trên level, TTS theo câu/cả bài, song ngữ từng đoạn) + bài đọc A1–B1 có câu hỏi đọc hiểu (12 bài lúc đầu, nay 50 bài) (`ReadingPassage.vue`, `content/curated/readings`) — đã thử tay OK (2026-10-20). **Còn**: nhiều bài đọc hơn (mục tiêu 50), từ mới của bài vào SRS tự động
- [x] Trình nghe: phát liên tục từng câu bằng TTS (người nói A/B giọng Mỹ/Anh khác nhau), tốc độ 0.6×/0.8×/1×, nghe lại câu, lặp A–B, ẩn/hiện lời thoại và bản dịch, tự chép lời có chấm; 30 bài nghe A1–B1 (`ListeningPlayer.vue`, `content/curated/listening`); phần nghe trong bài kiểm tra đầu vào — đã thử tay OK (2026-10-20). **Còn**: audio thật (sinh sẵn lúc build) thay cho TTS khi cần chất lượng cao
- [x] Ngữ pháp: trang "Ngữ pháp" với 14 điểm (động từ khuyết thiếu, V-ing/to V, used to, bị động, cụm động từ, điều kiện 0/1/2, mệnh đề quan hệ, tường thuật, câu hỏi đuôi, đếm được/không đếm được, trạng từ tần suất, sở hữu, too/enough) + bài tập — chưa thử tay. **Còn**: đủ 40 điểm
- [x] Phrasebook: 12 nhóm tình huống, ~100 mẫu câu có nghe (TTS), nghĩa Việt, tìm kiếm, bấm để sao chép — chưa thử tay. **Còn**: lưu mẫu câu vào SRS
- [x] Track trẻ em (2026-10-19/20, đã thử tay OK (2026-10-20)): giao diện riêng cho hồ sơ `isChild` (ô to có hình pixel + đọc to, không cần biết đọc), thẻ "nghe → chạm hình" (SRS hướng `audio_picture`, 60 hình pixel 64×64 tự vẽ), 25 hoạt động: chữ cái A–Z, âm (phonics), ghép âm CVC, từ nhìn là nhớ, sách tranh (4 truyện), tập viết chữ (tô theo chữ mẫu, chấm độ phủ), nói theo (tự xác nhận); album sticker, quà đồ ăn cho thú cưng, khu vực phụ huynh (PIN 4 số, quên PIN → giải phép nhân, giới hạn phút mỗi ngày, gia hạn, báo cáo 7 ngày). **Còn**: chấm giọng nói thật (chờ Whisper), âm đơn lẻ của TTS còn thô (cần audio thật), thêm sách tranh
- [x] Cửa hàng: mua đồ ăn + phụ kiện (nơ, kính, khăn, mũ chóp Lv5, vương miện Lv10) bằng xu, đeo/tháo, mascot vẽ lớp phụ kiện (`ShopService`, `acc-*.png` sinh từ `make-placeholder.mjs`) — chưa thử tay
- [x] Thành tựu, checkpoint lên cấp, tiến hoá thú cưng (đã thử tay OK (2026-10-20)): 32 huy hiệu pixel art có thưởng XP và mascot báo; bài kiểm tra lên cấp 10 câu (đạt ≥ 80% lên một bậc, lần đầu qua bậc có thưởng; Thống kê gợi ý khi Elo của kỹ năng vượt level hiện tại); thú cưng tiến hoá 5 giai đoạn egg → baby → teen → adult → legend (sheet + phụ kiện từng giai đoạn sinh bằng `pnpm sprites:placeholder`, mascot đổi sheet và ăn mừng khi lên mốc level 2/10/25/50)
- [x] Thống kê cơ bản: trang "Thống kê" (`StatsService`) — streak hiện tại/dài nhất, lịch hoạt động 16 tuần, lượt ôn 14 ngày, tỉ lệ nhớ, so tuần này với tuần trước, thẻ theo trạng thái FSRS, từ trong sổ theo level; tính từ `srs_reviews` + sổ XP, không có bảng riêng — chưa thử tay
- [x] Thống kê nâng cao: từ hay quên nhất, độ chính xác 30 ngày theo dạng bài và hướng thẻ (bảng `exercise_stats`), rating Elo theo kỹ năng, thời gian học theo ngày/tuần/tổng (bảng `usage_days`) — đã thử tay OK (2026-10-20)
- [x] Nội dung: đủ 30/30 bài nghe, 50/50 bài đọc, 40/40 điểm ngữ pháp, 3 khoá học (yêu cầu 2)
- [x] Auto-update: `electron-updater` qua GitHub Releases (`UpdateManager`): kiểm tra nền sau 45 giây và mỗi 6 giờ (tắt được), chỉ tải/cài khi người dùng đồng ý, UI trong Cài đặt; `user.db` được sao lưu tự động trước khi migrate (giữ 3 bản). **Còn**: phát hành bản đầu (`GH_TOKEN=... pnpm release:win`), ký số code signing, kiểm thử cập nhật thật giữa hai bản

**DoD:** Một người A1–B1 và một bé 6–8 tuổi đều có lộ trình học ≥ 4 tuần không hết bài.

## Phase 2b — Mở rộng từ vựng trẻ em (đề xuất 2026-10-29)

Hiện trạng: bé chỉ có một dạng thẻ (`audio_picture`: nghe từ → chạm 1 trong 3 hình, ≤ 6 hình mới/ngày) + 4 hoạt động chữ cái/âm/ghép vần/sight words. Điểm nghẽn: (1) số từ bị giới hạn bởi số hình pixel đã vẽ (`src/shared/pictures.ts`); (2) mỗi từ chỉ được dạy một cách; (3) không có bản đồ tiến độ cho bé; (4) phụ huynh chưa có việc làm cùng bé. Quyết định: [decisions #35](decisions.md). Ràng buộc giữ nguyên: hình pixel tự vẽ ([#30](decisions.md)), không chấm khắt khe/không AI hội thoại tự do với trẻ, lọc từ nhạy cảm, nội dung tự soạn (`source.license`), IPC/i18n như quy ước.

**Giai đoạn A — Thế giới từ theo chủ đề + chuỗi 5 bước (làm trước)**

- [ ] Thiết kế chi tiết → **[docs/19-kids-world.md](19-kids-world.md)** (📋 viết 2026-10-29, sửa lần 1 cùng ngày, chờ duyệt): nội dung `content/curated/kids/world/`, không cần migration (dùng `srs_cards`, `lesson_progress`, `settings`), kênh IPC mới `kids:world`/`kids:visit`/`kids:visitDone` + kênh gói `kids-world`.
- [ ] Nội dung tầng 1: **mỗi nơi là một chủ điểm và có công trình nổi bật vẽ pixel** — 12 tỉnh/thành (3 miền × 4) × 10 từ = 120 từ (PA1_1, ~20 ngày học từ mới): Hà Nội (gia đình — Tháp Rùa), Hạ Long (biển — hòn Trống Mái), Sa Pa (nông trại — ruộng bậc thang), Ninh Bình (số đếm — Tràng An), Huế (màu & hoa — Ngọ Môn), Đà Nẵng (bầu trời & thời tiết — Cầu Rồng), Hội An (lễ hội & đồ chơi — Chùa Cầu), Nha Trang (quần áo — tháp Trầm Hương), Đà Lạt (vườn rau — ga Đà Lạt), TP.HCM (phố & xe — chợ Bến Thành), Cần Thơ (trái cây — chợ nổi Cái Răng), Phú Quốc (bữa ăn — làng chài); `content:validate` kiểm tra luật "cùng tầng ngang nhau" (docs/19 §2.1). Tầng 2–3: chỉ khung dữ liệu + luật mở khoá.
- [ ] **Bản đồ thế giới 3 tầng** trong `KidsApp` (chốt 2026-10-29, [decisions #35](decisions.md)): tỉnh/thành Việt Nam → các nước → Trái Đất (cấp cao nhất). **Cùng tầng = cùng độ khó và cùng số từ**, khác chủ điểm; bé chọn nơi nào trước cũng được. Mở tầng sau khi xong **75 %** số nơi tầng trước (= 6/8 đã chốt) và ≥ 60 % từ ≥ mầm.
- [ ] Mức nhớ từng từ hạt giống → mầm → bông hoa (dựa FSRS, bé không thấy điểm; từ sắp quên héo nhẹ, không phạt, không mất chuỗi ngày).
- [ ] **Bản đồ 2D** (luôn có, đi kèm app): SVG + công trình pixel 2D, thú cưng đi dọc đường, mây tan khi mở khoá, ngày–đêm; dùng khi chưa tải gói/không có WebGL/máy yếu.
- [ ] **Bản đồ 3D chi tiết bằng three.js** ([decisions #36](decisions.md), tham khảo phong cách grandvalley.pages.dev): diorama sống động (địa hình, sông/biển, cây dày, mây, thuyền/xe/người nhỏ, ngày–đêm, thời tiết), camera bay tới nơi bé chạm, zoom tỉnh → đảo quốc gia → địa cầu. Làm **spike đo fps/RAM/dung lượng trước** rồi mới làm đủ. Render theo yêu cầu, dừng khi ẩn, mức chất lượng, tự hạ về 2D khi fps thấp. Phần sau (giai đoạn C): từ đã học xuất hiện trong thế giới, rương thưởng, lễ ăn mừng cuối tầng, phương tiện, nhiệm vụ nhỏ.
- [ ] **Gói tải thêm `kids-world`** (tài nguyên 3D + âm thanh nền, không nằm trong bộ cài): tải ở bước tạo hồ sơ trẻ em, Cài đặt → Tải thêm, hoặc nhắc trong khu phụ huynh; theo mẫu gói sprite 288px (`packSpec` size + sha256, release phụ).
- [ ] Chuỗi 5 bước mỗi từ: làm quen (hình + mascot nói) → chạm hình (đã có) → chơi → nói theo (sao/vỗ tay, không chấm khắt khe) → dùng trong câu ("I see a cat").
- [ ] Hình mới cho các từ chưa có hình — ưu tiên hình có sẵn (60 hình pixel + ~100 hình Twemoji trong `ALL_PICTURE_IDS`); số hình thiếu do `validateWorld` liệt kê (biết trước: gia đình, số 1–10, màu, vài vật) + 12 công trình **voxel** (`src/shared/voxels/`, chốt 2026-10-29), hình 2D cho bản đồ 2D/sticker chiếu tự động từ voxel lúc build.
- [ ] Địa lý/văn hoá: bản đồ cách điệu, **không vẽ đường biên giới/chủ quyền**, tránh chủ đề tranh chấp; món ăn/địa danh/cờ phải đúng, cần người Việt duyệt trước khi phát hành (nội dung hiện do AI soạn).

**Giai đoạn B — Mini-game (làm sau A)**

- [ ] Lật thẻ ghép cặp (memory) · bắn bóng bay đúng từ nghe được · Simon says (TPR) · phân loại (con vật/đồ ăn).
- [ ] Mỗi game dùng chung bộ từ chủ đề, có sao thưởng/sticker như hoạt động hiện tại.

**Giai đoạn C — Động từ/tính từ qua mascot + thú cưng "học trò"**

- [ ] Dạy động từ/tính từ bằng hoạt ảnh sẵn có của mascot (chạy, ngủ, ăn, vui, buồn…) thay vì vẽ hình mới.
- [ ] Bé "dạy" thú cưng từ mới (học bằng cách dạy người khác).
- [ ] Thêm game: tô màu theo lệnh, kéo đồ vào cảnh, tìm đồ trong cảnh (I-spy), đếm số.

**Giai đoạn D — Phân tầng tuổi + audio**

- [ ] 3–4 tuổi: chỉ hình/âm, không chữ, phiên 3–5 phút · 5–6: hiện chữ, nhận mặt chữ · 7–8: ghép chữ, điền chữ thiếu, câu ngắn (cùng bộ từ, khác cách chơi).
- [ ] Gói audio MP3 tạo sẵn cho từ/câu của bé (như gói bài nghe 1.2.0); đánh dấu `reviewed` theo chủ đề khi có người duyệt.

**Giai đoạn E — Gói phụ huynh**

- [ ] "Từ của tuần" + gợi ý câu hỏi hỏi bé ở nhà · báo cáo "bé đã biết N từ" · thẻ từ in được (PDF).

**DoD:** Bé 3–6 tuổi có lộ trình từ vựng ≥ 4 tuần không hết từ mới, mỗi từ gặp ≥ 3 cách chơi khác nhau; phụ huynh thấy số từ bé đã biết.

## Phase 3 — Nói, Viết, AI (≈ 8 tuần)

- [x] Ghi âm + Whisper local (utilityProcess) + `ModelManager` (Whisper base.en q8, chưa thử tay)
- [x] `speak` (= speak_repeat/pronounce_word, chấm cấp 1–2: từ + độ trôi chảy) + 5 bài "Luyện nói" gồm shadowing (chưa thử tay). Còn: hoạt động nói theo của bé (kids) vẫn tự đánh giá; cấp 3 âm vị (wav2vec2) chờ có ONNX
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

| Rủi ro                                    | Mức        | Giảm thiểu                                                                                       |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| Thiếu nội dung chất lượng                 | Cao        | Bắt đầu pipeline sớm; dùng AI sinh + duyệt; ưu tiên rule-based từ dữ liệu mở                     |
| Vấn đề license nội dung                   | Cao        | Chính sách ở [08](08-content-sources.md); mọi bản ghi có `source.license`; tách pack share-alike |
| Cửa sổ trong suốt lỗi trên một số máy/GPU | Trung bình | Spike Phase 0 trên nhiều máy; tuỳ chọn tắt hardware acceleration                                 |
| Model AI local nặng, chậm trên máy yếu    | Trung bình | Model nhỏ lượng tử hoá; tải theo nhu cầu; fallback online                                        |
| Mascot gây phiền → người dùng tắt         | Cao        | Chế độ yên lặng thông minh, tần suất mặc định thấp, dễ chỉnh                                     |
| Phạm vi quá lớn cho 1 người               | Cao        | Bám MVP, cắt tính năng 💡, mỗi phase phải ra bản dùng được                                       |
| Antivirus cảnh báo app chưa ký            | Trung bình | Code signing (Phase 5); không dùng kỹ thuật hook bàn phím                                        |
