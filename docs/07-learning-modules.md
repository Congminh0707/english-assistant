# 07 — Các module học tập

## 1. Cấu trúc nội dung

```text
Track (preschool | primary | teen | general | toeic | ielts)
 └─ Course            "Tiếng Anh giao tiếp A2"
     └─ Unit          "Unit 3: Shopping"
         └─ Lesson    "Hỏi giá & mặc cả"  (5–15 phút)
             └─ Exercise items (5–20 câu, nhiều dạng)
```

Ngoài lộ trình (Course), còn các **thư viện độc lập** dùng chung mọi track, lọc theo level:

| Thư viện | Nội dung |
|---|---|
| Vocabulary decks | Bộ từ theo level / chủ đề / kỳ thi / nghề |
| Reading library | Truyện, bài đọc phân level |
| Listening library | Bài nghe có transcript |
| Video library | Video nhúng (YouTube) có câu hỏi |
| Phrasebook | Mẫu câu theo tình huống |
| Grammar reference | Điểm ngữ pháp theo CEFR |
| Exam center | Đề luyện TOEIC/IELTS theo format |

Định dạng dữ liệu (JSON schema) của mọi loại trên: [09-content-pipeline.md](09-content-pipeline.md#3-schema-nội-dung).

## 2. Danh mục dạng bài tập (exercise types)

Mỗi dạng bài = **1 schema dữ liệu** + **1 component Vue** trong `src/renderer/shared/exercises/` + **1 hàm chấm điểm** trong `src/shared/scoring/`.
Thêm dạng bài mới = thêm đủ 3 thứ này + đăng ký vào `exerciseRegistry`.

| `type` | Tên | Kỹ năng | Bậc phù hợp | Chấm điểm |
|---|---|---|---|---|
| `picture_choice` | Nghe/đọc từ → chọn hình | vocab, listening | PA1–A1 | đúng/sai |
| `tap_pairs` | Nối cặp (từ–hình, từ–nghĩa, âm–chữ) | vocab, phonics | PA1–B1 | tỉ lệ cặp đúng |
| `mcq` | Trắc nghiệm 1 đáp án | mọi kỹ năng | mọi bậc | đúng/sai |
| `multi_select` | Chọn nhiều đáp án | reading, listening | A2+ | điểm từng phần |
| `gap_fill` | Điền từ vào chỗ trống (gõ hoặc chọn từ ngân hàng) | grammar, vocab | A1+ | so khớp, chấp nhận biến thể |
| `word_order` | Sắp xếp từ thành câu | grammar, writing | PA1_2–B1 | so khớp với các đáp án hợp lệ |
| `dictation` | Nghe chép chính tả | listening | A1+ | khoảng cách chỉnh sửa theo từ (WER) |
| `listen_choice` | Nghe đoạn → trả lời câu hỏi | listening | PA1+ | đúng/sai |
| `true_false_ng` | Đúng / Sai / Không có thông tin | reading | B1+ | đúng/sai |
| `matching_headings` | Nối tiêu đề với đoạn | reading | B2+ | tỉ lệ đúng |
| `error_spotting` | Tìm lỗi sai trong câu | grammar | A2+ | đúng/sai |
| `transform` | Viết lại câu không đổi nghĩa | grammar, writing | B1+ | so khớp mẫu + (tuỳ chọn) AI |
| `translate_sentence` | Dịch câu Việt → Anh — ✅ 2026-11-11, `type: 'translate'` ([Luyện viết](#luyện-viết-translate-write--2026-11-11)) | writing (Elo: writing từ 2026-11-11, trước đó grammar) | A1+ | so khớp đáp án mẫu (chuẩn hoá viết tắt/dấu câu) → không khớp thì AI `translation_check` nếu có |
| `speak_repeat` | Nghe → nói lại (shadowing) | speaking | PA1+ | STT + so khớp từ / phát âm |
| `pronounce_word` | Phát âm từ đơn / cặp âm tối thiểu | speaking | PA1+ | điểm phát âm |
| `speak_answer` | Trả lời câu hỏi bằng giọng nói — ✅ 2026-11-11, `type: 'respond'` ([Trả lời câu hỏi](#trả-lời-câu-hỏi-bằng-giọng-nói-respond--2026-11-11)) | speaking (không vào Elo) | A1+ | Whisper nhận dạng tại máy → người học bấm thì AI `speaking_feedback` chấm chữ nhận dạng (đạt ≥ 60/100, không chấm phát âm); không AI → đạt khi nói đủ số từ |
| `roleplay` | Hội thoại nhập vai với AI | speaking, writing | A2+ | AI theo rubric |
| `write_free` | Viết đoạn/bài theo đề — ✅ 2026-11-11 (một phần), `type: 'write'` ([Luyện viết](#luyện-viết-translate-write--2026-11-11)) | writing (Elo: writing từ 2026-11-11, trước đó grammar; chỉ khi AI chấm) | A1+ | AI `writing_feedback` theo rubric (đạt ≥ 60/100); không AI → đạt khi đủ số từ. Chưa có LanguageTool |
| `trace_letter` | Tô chữ cái bằng chuột | phonics | PA1 | tỉ lệ phủ nét |
| `video_quiz` | Xem đoạn video → trả lời | listening | A1+ | đúng/sai |

**Quy tắc chung cho mọi dạng bài:**
- Luôn có **giải thích** sau khi trả lời (tiếng Việt cho ≤ B1, tiếng Anh từ B2, có nút chuyển ngôn ngữ).
- Mỗi câu có nút 🔊 nếu có câu tiếng Anh, bấm vào từ bất kỳ để tra nhanh.
- Kết quả từng câu lưu vào `attempts` (xem [10](10-data-model.md)) để cập nhật rating & thống kê.
- Từ sai → tự gợi ý thêm vào sổ từ SRS.

---

> ✅ **Đã làm (Phase 1/2)** — `PracticeService` + `src/shared/practice.ts` + trang "Luyện tập" trong cửa sổ Học tập (xem [decisions #13](decisions.md)): 5 dạng bài sinh từ câu Tatoeba có bản dịch Việt và từ vựng đúng trình độ — `cloze` (điền từ), `word_order` (sắp xếp câu), `listen_choice` (nghe chọn nghĩa), `dictation` (nghe chép, đạt khi đúng ≥ 90% số từ), `match_pairs` (ghép từ–nghĩa). Khác với thiết kế registry ở trên: chưa tách component dùng chung (`PracticeSession.vue` chứa cả 5 dạng) và chưa có `exerciseRegistry`; sẽ tách khi thêm dạng bài thứ 6+. Trang này nằm ở Hội trường; từ 2026-11-11 Hội trường có thêm tab "Viết tự do" ([Viết tự do theo đề](#viết-tự-do-theo-đề--2026-11-11)). Chưa có: `picture_choice`, `tap_pairs` hình, `true_false_ng`, `speak_repeat`..., bài đọc, ngữ pháp có giải thích, rating theo kỹ năng.

## 3. Module Từ vựng + SRS (P0)

> ✅ **Đã làm (Phase 1)**: lưu từ từ popup → thẻ `en_vi`; `SrsService` (ts-fsrs, có fuzz) tính lịch, ghi `srs_reviews`; mascot hỏi ôn thẻ đến hạn bằng trắc nghiệm 4 đáp án (`MicroLearningService`, đáp án nhiễu là nghĩa của từ cùng level), quy đổi: đúng ≤ 6 giây → *Được*, đúng chậm hơn → *Khó*, sai → *Quên*. Cửa sổ Học tập (`StudyService`) có phiên ôn đầy đủ: lật thẻ → người dùng tự chấm *Quên/Khó/Được/Dễ* (phím `Space`/`1–4`, nút hiện khoảng ôn lại dự kiến), nguồn ghi `srs_reviews.source = 'study'`; sổ từ cho phép xoá từ (xoá mềm thẻ `deleted_at` + `suspended`, giữ nhật ký ôn; lưu lại từ sẽ dùng lại thẻ cũ). Streak tính theo ngày cục bộ có ít nhất một lần ôn. Chưa làm: các hướng thẻ khác (`vi_en`, `audio_en`, `cloze`), giới hạn từ mới/ngày.

- **Nguồn từ**: bộ từ có sẵn theo level (NGSL, CEFR-J, TSL, NAWL..., bộ từ trẻ em tự soạn) + từ người dùng tự lưu khi dịch/đọc.
- **Thẻ (card)**: mặt trước có thể là từ tiếng Anh, hình ảnh, âm thanh hoặc nghĩa tiếng Việt. Mỗi từ sinh nhiều "hướng" thẻ:
  `en→vi` (nhận diện), `vi→en` (nhớ lại), `audio→en` (nghe), `cloze` (điền vào câu ngữ cảnh).
  Trẻ em: chỉ `audio→picture` và `picture→audio`.
- **Thuật toán**: **FSRS** qua thư viện `ts-fsrs`. Người dùng chấm: *Quên / Khó / Được / Dễ*. Mục tiêu nhớ (retention) mặc định 90%.
- **Giới hạn**: mặc định 10 từ mới/ngày (trẻ em 5), không giới hạn ôn. Chỉnh trong cài đặt.
- **Ôn qua mascot**: thẻ đến hạn được mascot hỏi dạng trắc nghiệm nhanh trong bong bóng (D2). Kết quả trắc nghiệm quy đổi: đúng nhanh → *Được*, đúng chậm → *Khó*, sai → *Quên*.
- **Trang từ**: nghĩa, IPA US/UK, loại từ, level, ví dụ (từ Tatoeba), collocation, word family, ảnh (nếu có), câu ngữ cảnh người dùng đã gặp.

> ✅ **Thẻ nhiều dạng (Phase 2)** — `SrsService`/`StudyService`: thẻ gốc `en_vi` do lưu từ tạo ra; khi thẻ gốc vào ôn dài hạn (FSRS state = Review) tự tạo thẻ phụ `vi_en`, `audio_en`, `cloze` (chỉ khi có câu chứa từ — `src/shared/cards.ts#makeCloze`) với `due` = ngày hôm sau, theo cài đặt `review.dir*`. Chấm đáp án gõ bằng `checkTyped` (đúng / gần đúng — sai 1 ký tự với từ ≥ 5 chữ / sai) → gợi ý Được/Khó/Quên; người dùng vẫn tự chọn mức chấm. Hạn mức từ mới (`review.newPerDay`) chỉ tính thẻ gốc chưa học; thẻ phụ không bị giới hạn. Mascot chỉ hỏi thẻ `en_vi`. Hoàn tác lần chấm gần nhất trong phiên (khôi phục lịch cũ + xoá lượt ôn; XP đã cộng không thu hồi). Mẫu câu Phrasebook lưu thành thẻ với `content_id = phrase:<nhóm>:<băm FNV-1a của câu>` (không có thẻ điền từ). `audio_picture` để dành cho track trẻ em.

## 3b. Bài học nền tảng (Foundation) — ✅ đã làm

Lộ trình học từ đầu cho người Việt, **tự soạn** (`proprietary-own`, [08](08-content-sources.md)), nằm ở `content/curated/lessons/*.json` — hướng dẫn soạn: [`AUTHORING.md`](../content/curated/lessons/AUTHORING.md), schema: `src/shared/schemas/lesson.ts`. File JSON được đóng gói thẳng vào app (`bundledLessons.ts`), kiểm tra bằng `src/main/content/lessons.test.ts` (schema + đáp án hợp lệ + id không trùng).

| Chương | Bài |
|---|---|
| 1. 🔤 Bảng chữ cái & phát âm | chữ cái, nguyên âm/phụ âm, nguyên âm ngắn, nguyên âm dài & đôi, tổ hợp chữ cái, phụ âm khó với người Việt, âm tiết & trọng âm, đuôi -s/-es/-ed |
| 2. 📝 Mẫu câu cơ bản (1) | to be, đại từ & tính từ sở hữu, a/an/the, số nhiều & không đếm được, this/that/these/those, there is/are |
| 3. ⏰ Các thì | hiện tại đơn, hiện tại tiếp diễn, đơn vs tiếp diễn, quá khứ đơn, quá khứ tiếp diễn, tương lai (will/going to), hiện tại hoàn thành, ôn tập |
| 4. 🧱 Mẫu câu cơ bản (2) | have/has (got), can/can't & mệnh lệnh, câu hỏi Wh-, in/on/at, so sánh tính từ, từ nối |
| 5. 💬 Giao tiếp hằng ngày | chào hỏi, số đếm, giờ/thứ/ngày, lịch sự, hỏi đường, mua sắm |

58 bài / 9 chương, 645 bài tập (đo 2026-11-10, [17 §2](17-metrics.md)); từ 2026-11-11 thêm chương "Luyện viết" → 64 bài / 10 chương / 688 bài tập, rồi chương "Trả lời câu hỏi bằng giọng nói" → 70 bài / 11 chương / 726 bài tập (đo 2026-11-11). Từ 2026-11-10 mỗi bài chương 01–05 có thêm khối **hướng dẫn nói** (lưới `sounds` cho dạng viết tắt, đuôi từ, từ đổi âm; bảng tập khẩu hình từng bước ở bài phát âm), khối **trường hợp đặc biệt** (vd `an hour` / `a university`, `been` – `gone`, `on the bus` – `in a car`) và 1–2 bài tập `speak`/`listen` ở cuối; chương chữ cái thêm 3 bài: nguyên âm + r, chữ câm, nối âm (quy tắc soạn ở `content/curated/lessons/AUTHORING.md`). Mỗi bài: giải thích tiếng Việt ngắn, bảng, ví dụ có nút nghe (TTS), mẹo lỗi người Việt hay mắc, lưới âm bấm nghe, 8–12 bài tập (trắc nghiệm, điền chỗ trống, sắp xếp câu, ghép cặp, nghe rồi chọn) chấm tại chỗ. Tiến độ lưu ở `lesson_progress` (điểm cao nhất, số lần làm); **lần đầu đạt ≥ 70% thưởng +15 XP, +5 xu** (+5 XP nếu 100%), mỗi bài thưởng một lần. Câu `say` của chữ cái viết thành tên chữ ("bee", "double-you") để giọng máy đọc đúng. Hạn chế: giọng TTS của Windows có thể là giọng Anh (vd "zed"); phần giải thích chỉ có tiếng Việt; chưa có bài đọc hiểu/viết; chưa có phiên bản cho trẻ em (phonics từng chữ có hình).

## 4. Module Ngữ pháp (P1)

- Mỗi **điểm ngữ pháp** (grammar point) có: id, tên vi/en, bậc, giải thích ngắn (≤ 150 từ), công thức, 3–5 ví dụ, lỗi người Việt hay mắc, liên kết điểm liên quan.
- Bài tập: `gap_fill`, `mcq`, `word_order`, `error_spotting`, `transform`.
- **Lỗi đặc trưng của người Việt** cần có nội dung riêng: thiếu *s/es* ngôi 3, thiếu mạo từ *a/an/the*, nhầm *thì*, bỏ động từ *to be*, trật tự tính từ, phát âm âm cuối...
- Ngữ pháp được "gắn" vào bài đọc/nghe: khi bài đọc có cấu trúc mới, hiện thẻ nhắc nhỏ.

## 5. Module Đọc — Reading (P1)

> ✅ **Đã làm (Phase 2)** — bài đọc dùng chung cơ chế với bài học nền tảng (`LessonService` + `kind`): file `content/curated/readings/*.json`, block `passage` (đoạn văn + bản dịch Việt từng đoạn) hiển thị bằng `ReadingPassage.vue`; câu hỏi đọc hiểu là các bài tập `mcq`/`tf`/`gap`; thưởng XP như bài học. Ngữ pháp (`content/curated/grammar`) cũng dùng cơ chế này; mẫu câu (`content/curated/phrasebook`) là thư viện riêng (`PhrasebookLibrary`). Tiến độ lưu chung ở `lesson_progress` (id bài không trùng nhau giữa các loại — có test).

- **Thư viện truyện/bài đọc** phân level (nguồn: StoryWeaver, Gutenberg rút gọn, VOA, bài tự soạn — xem [08](08-content-sources.md)).
- **Trình đọc tương tác**:
  - Bấm vào từ → popup nghĩa trong ngữ cảnh + 💾 lưu.
  - Tô màu nhẹ các từ **trên level** người dùng (tuỳ chọn bật/tắt).
  - Nút 🔊 đọc cả câu/đoạn (TTS hoặc audio gốc nếu có), câu đang đọc được highlight.
  - Chế độ song ngữ: hiện bản dịch tiếng Việt theo từng đoạn (bật/tắt).
- **Sau khi đọc**: 3–8 câu hỏi đọc hiểu (`mcq`, `true_false_ng`, `gap_fill` tóm tắt) + từ mới của bài vào SRS.
  - ✅ **Đã làm (2026-11-10)** — từ mới của bài vào SRS tự động: lần đầu đạt một bài đọc (`passed && firstCompletion`), main tự lưu tối đa **8** từ khó của bài vào sổ từ (tạo thẻ ôn) kèm câu đầu tiên chứa từ làm ngữ cảnh. Chọn từ ở `src/main/content/hardWords.ts` (`pickHardWords`): tách câu (`splitSentences`) và từ (`tokenizeWords`) mọi đoạn `passage`, bỏ tên riêng, tra level bằng cùng hàm với kênh `dictionary:levels` (`wordLevel`), giữ từ có level > `learning.level`, bỏ từ đã có trong sổ (theo `contentId`, gộp các dạng của một mục từ), theo thứ tự xuất hiện. `container.ts` nối callback `onFirstPass` cho `LessonService` của bài đọc, lưu qua `StudyService.saveMany` (cùng đường với `vocab:save-many`); kết quả `lesson:complete` có thêm `savedWords`, thẻ kết quả hiện chip "Đã lưu N từ mới". Không áp dụng cho hồ sơ trẻ em; tắt được bằng cài đặt `review.autoSaveReading` (mặc định bật, mục Ôn thẻ trong Cài đặt). Nút "Lưu N từ khó" thủ công trong trình đọc vẫn giữ.
- **Bậc thấp**: truyện tranh/picture book, mỗi trang 1–2 câu, có audio.
- **Bậc cao**: bài báo, văn bản học thuật, dạng bài IELTS Reading.
- 💡 Đọc web: dán URL → lấy nội dung sạch → ước lượng level → đọc với các công cụ trên.

## 6. Module Nghe — Listening (P1)

> ✅ **Đã làm (Phase 2)** — bài nghe là bài học kiểu `listening` (cùng cơ chế với bài đọc, xem [decisions #15](decisions.md)): block `audio` gồm các câu thoại (có bản dịch Việt, người nói A/B hoặc độc thoại), phát bằng TTS từng câu. `ListeningPlayer.vue`: phát liên tục (`useTts().speakAsync` đợi đọc xong từng câu), người nói A giọng Mỹ và B giọng Anh, tốc độ 0.6×/0.8×/1×, nghe lại câu, lặp đoạn A–B, ẩn/hiện lời thoại (mặc định ẩn để luyện nghe) và bản dịch, tự chép câu đang nghe (chấm bằng `dictationAccuracy`, đạt ≥ 90%). 30 bài A1–B1 trong 6 chương (chào hỏi, đời sống, du lịch, giao tiếp xã hội, học tập & công việc, bài nói ngắn). Bài nghe cũng có trong bài kiểm tra đầu vào/lên cấp (`kind = listening`, câu hỏi kèm `say`). Chưa dùng audio thu sẵn (VOA/LibriVox/Whisper căn chỉnh) — TTS đủ cho nội dung tự soạn; sinh sẵn audio lúc build để sau, khi chốt dung lượng bộ cài.

- **Nguồn audio**: VOA Learning English (public domain), Tatoeba audio, LibriVox, audio TTS do app sinh cho bài tự soạn.
- **Trình phát**: tốc độ 0.5x–1.5x, lặp lại câu (A–B loop), tua theo câu, ẩn/hiện transcript.
- **Dạng bài**: `dictation` (từng câu), `gap_fill` trên transcript, `listen_choice`, `true_false_ng`, TOEIC Part 1–4.
- **Luyện nghe theo câu**: bài dài được tách thành các câu có timestamp (căn chỉnh tự động bằng Whisper — xem [09](09-content-pipeline.md#5-xử-lý-audio)).
- **Trẻ em**: bài hát, nghe từ → chọn hình.

**Bản thu thật (VOA)**: block `audio` có `recording` thì dùng `RealAudioPlayer`: phát cả file MP3 trong gói âm thanh (không TTS, không căn giờ từng câu), chỉnh tốc độ 0,6–1×, lời thoại hiện theo đoạn kèm bản dịch, dòng ghi công + link trang gốc. Chưa cài gói → hiện lời thoại và nút tải gói. Xem [decisions #52](decisions.md).

## 7. Module Nói — Speaking (P2)

Chi tiết kỹ thuật: [11-ai-and-speech.md](11-ai-and-speech.md#4-nhận-dạng-giọng-nói-stt--chấm-phát-âm).

| Hoạt động | Mô tả | Cần AI online? |
|---|---|---|
| **Phát âm từ** | Nghe mẫu → ghi âm → so sánh. Có cặp âm tối thiểu (*ship/sheep*, *light/right*). | Không (Whisper local) |
| **Shadowing** | Nghe câu → nói theo ngay. So khớp từ, highlight từ sai/thiếu. | Không |
| **Đọc to đoạn văn** | Đọc to → đo tốc độ (WPM), độ chính xác. | Không |
| **Trả lời câu hỏi** | IELTS Speaking Part 1/2/3, TOEIC Speaking (tuỳ chọn). Ghi âm → STT → AI nhận xét theo rubric (Fluency, Lexical, Grammar, Pronunciation). | Có (hoặc Ollama local) |
| **Nhập vai** | Gọi món, phỏng vấn xin việc, hỏi đường... AI đóng vai, giới hạn từ vựng theo level người dùng. | Có (hoặc Ollama local) |

- Âm thanh ghi âm chỉ lưu local, tự xoá sau 7 ngày (tuỳ chỉnh). Xem [16](16-privacy-and-security.md).
- Trẻ em: chỉ "nói theo" có phản hồi vui (sao, vỗ tay), **không** chấm điểm khắt khe, không dùng AI hội thoại tự do.

## 8. Module Viết — Writing (P2)

| Bậc | Hoạt động |
|---|---|
| PA1 | Tô chữ (`trace_letter`), chép từ |
| A1–A2 | Sắp xếp câu, điền từ, viết câu theo hình/gợi ý, dịch câu ngắn |
| A2–B1 | Viết tin nhắn/email ngắn theo tình huống, nhật ký 3–5 câu |
| B1–B2 | Đoạn văn, email trang trọng, IELTS Task 1 (mô tả biểu đồ) |
| B2–C2 | Essay IELTS Task 2, bài luận lập luận |

**Pipeline chấm bài viết tự do:**
1. Đếm từ, kiểm tra yêu cầu đề (độ dài, thời gian).
2. **LanguageTool** → lỗi chính tả/ngữ pháp (offline nếu chạy server local, hoặc API công khai có giới hạn).
3. Thống kê: độ đa dạng từ vựng, tỉ lệ từ theo level, độ dài câu.
4. **AI (tuỳ chọn)**: chấm theo rubric (IELTS: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy), đưa ra bản sửa + giải thích + 3 điểm cần cải thiện.
5. Lưu bài + feedback; lỗi lặp lại → gợi ý bài ngữ pháp liên quan.

## 9. Phonics & Mầm non (P1)

> ✅ 2026-11-01: thế giới của bé theo thiết kế v2: tầng 1 VN, 6 nước, 9 kỳ quan (27 nơi, 189 từ lúc đó). Tầng 3 là 9 kỳ quan, 3 từ mỗi nơi. 12 nơi tầng 1 có cảnh riêng với 5 điểm chạm. Chi tiết ở [19](19-kids-world.md).
> ✅ 2026-11-05: thêm tầng `town` (Làng của bé, 7 nơi × 16 từ) và `basics` (Màu-số-hình, 3 nơi × 12 từ): tổng **37 nơi, 337 từ**. Hai tầng mới `reviewed: false`, chưa có cảnh riêng. Chi tiết ở [28](28-kids-expansion.md).

> 🚧 **Mở rộng từ vựng (Phase 2b)**: bản đồ thế giới (tỉnh/thành Việt Nam → các nước → Trái Đất), mỗi nơi một chủ điểm có công trình voxel, lượt học 5 bước — thiết kế ở [19](19-kids-world.md). 2026-10-30: đã có tầng 1 (12 nơi, 120 từ), service + IPC, bản đồ 2D và lượt chơi; ô **Chơi** của bé giờ mở bản đồ, từ mới chỉ vào qua các nơi (bình tưới để ôn). Đã thử tay OK (2026-11-11); bản 3D chưa làm.

> ✅ **Đã làm (Phase 2)** — xem [decisions #18](decisions.md). Hồ sơ trẻ em (`isChild`) vào thẳng `KidsApp` (không thanh bên chữ): màn hình chính 4 ô lớn (Chơi / ABC / Sticker / Thú cưng), mọi nút có hình pixel và được đọc to. **Thẻ** `audio_picture`: nghe từ → chạm 1 trong 3 hình (`KidsService.nextCard`, mỗi ngày giới thiệu ≤ 6 hình mới, chấm theo số lần thử: đúng ngay → Được/Dễ, lần hai → Khó, hai lần sai → Quên; bé không thấy mức chấm). **Hoạt động** (`content/curated/kids/*.json`, `KidsLibrary`): `letters` (A–Z kèm hình ví dụ), `sounds` (âm đầu → chọn hình), `blend` (bấm từng chữ nghe âm rồi ghép: c-a-t), `sight` (từ nhìn là nhớ); mỗi hoạt động học rồi chơi, tối đa 3 sao, lần đầu hoàn thành được đồ ăn thưởng. **Album sticker**: mỗi hình trả lời đúng một lần được dán. **Phụ huynh**: ổ khoá nhỏ → PIN 4 số (băm có muối, `ParentService`), giới hạn phút mỗi ngày (`kids.dailyMinutes`, đồng hồ đếm ở main theo báo cáo định kỳ của giao diện, hết giờ bé thấy màn hình nghỉ ngơi), gia hạn 10 phút bằng PIN, báo cáo 7 ngày (thời gian dùng, số thẻ ôn, sticker, hoạt động, từ hay quên). Phần thưởng đồ ăn/sticker thay cho số XP trong giao diện của bé. Chưa có: picture book, tập viết chữ, nói lặp lại.

- Bảng chữ cái: âm + tên chữ + từ ví dụ + hình + bài hát.
- Phonics theo thứ tự phổ biến (s, a, t, p, i, n → ...), ghép âm CVC (*c-a-t*), sight words (danh sách tự soạn, đối chiếu Dolch — xem [08](08-content-sources.md#2-từ-vựng-và-danh-sách-từ-theo-level)).
- Dạng bài: `picture_choice`, `tap_pairs`, `trace_letter`, `speak_repeat` (không chấm khắt khe).
- Giao diện: nút to, ít chữ, giọng đọc hướng dẫn, phần thưởng là sticker/thức ăn cho thú cưng.
- Giới hạn phiên ≤ 10 phút, sau đó mascot "buồn ngủ" và gợi ý nghỉ.

## 10. Video (P2)

- Chỉ dùng **YouTube IFrame Player API** để nhúng (không tải video về). Danh mục video do người làm nội dung chọn, lưu `videoId`, đoạn bắt đầu/kết thúc, level, câu hỏi, từ vựng.
- Phụ đề: chỉ hiển thị phụ đề nếu nội dung có transcript hợp lệ (tự soạn hoặc nguồn mở); không cào phụ đề YouTube.
- Dạng bài `video_quiz`: video tự dừng ở mốc thời gian → hiện câu hỏi.
- Lưu ý kỹ thuật: YouTube embed có thể lỗi khi trang chạy từ `file://` → cần đăng ký custom protocol `app://` (xem [11](11-ai-and-speech.md#8-nhúng-youtube-trong-electron)).

## 11. Mẫu câu giao tiếp — Phrasebook (P1)

- Theo tình huống: chào hỏi, giới thiệu, nhà hàng, mua sắm, sân bay, khách sạn, công sở, họp, email, phỏng vấn, khám bệnh...
- Mỗi mẫu câu: câu Anh, nghĩa Việt, mức trang trọng, audio, biến thể, ghi chú văn hoá.
- Luyện: nghe → nhắc lại → chọn phản hồi phù hợp → nhập vai ngắn.

## 12. Luyện thi (P2)

### TOEIC Listening & Reading (đề tự soạn theo format công khai)
| Part | Nội dung | Số câu chuẩn | Dạng bài trong app |
|---|---|---|---|
| 1 | Mô tả tranh | 6 | `listen_choice` + ảnh |
| 2 | Hỏi – đáp | 25 | `listen_choice` (3 lựa chọn, không có chữ) |
| 3 | Hội thoại ngắn | 39 | `listen_choice` nhóm 3 câu |
| 4 | Bài nói ngắn | 30 | `listen_choice` nhóm 3 câu |
| 5 | Hoàn thành câu | 30 | `mcq` |
| 6 | Hoàn thành đoạn văn | 16 | `mcq` trong đoạn |
| 7 | Đọc hiểu (đơn/đa đoạn) | 54 | `mcq` |

- Chế độ: luyện theo Part (không giới hạn giờ) · Mini test (~ 30 phút) · Full test (2 giờ, 200 câu).
- Ước lượng điểm từ rating listening/reading (ghi rõ là ước lượng).
- Nghe: app tự phát khi vào mục nghe, có thể bấm Nghe để phát lại (khác đề thật: cho phép nghe lại nhiều lần).
- Ảnh Part 1: dùng ảnh có license mở (Unsplash/Pexels license cho phép dùng — kiểm tra điều khoản) hoặc ảnh pixel/minh hoạ tự vẽ.

### IELTS (Academic & General)
| Kỹ năng | Dạng bài | Hỗ trợ trong app |
|---|---|---|
| Listening | 4 section, nhiều dạng câu hỏi | Audio TTS nhiều giọng cho đề tự soạn |
| Reading | 3 passage, T/F/NG, matching headings, summary completion... | Đầy đủ dạng |
| Writing | Task 1 (biểu đồ/thư), Task 2 (essay) | Chấm AI theo band descriptors công khai |
| Speaking | Part 1, 2 (cue card), 3 | Ghi âm + STT + chấm AI |

> **Bản quyền:** Không sao chép đề thi thật của ETS/IDP/British Council/Cambridge. Chỉ mô phỏng **format** và tự soạn nội dung (có thể dùng AI sinh + người duyệt). Xem [08](08-content-sources.md).

## 13. Lộ trình hằng ngày (Daily plan — P0)

Thuật toán gợi ý mỗi ngày (chạy trong `DailyPlanService`):

1. **Ôn SRS đến hạn** (tối đa ~ 8 phút).
2. **Từ mới**: theo giới hạn ngày, ưu tiên từ của bài học tiếp theo.
3. **Bài học tiếp theo** trong Course đang theo.
4. **Kỹ năng yếu nhất** (rating thấp nhất hoặc lâu chưa luyện): 1 bài ngắn.
5. Tổng thời gian theo mục tiêu người dùng đặt: 10 / 20 / 30 / 60 phút.

Mascot nhắc lộ trình vào giờ người dùng chọn (đã làm 2026-11-11), và hiển thị tiến độ hôm nay khi hover (chưa làm).

> ✅ **Đã làm (2026-11-10)** — `DailyPlanService.plan()` (kênh `study:plan`, khối "Hôm nay" trên cùng ngăn kéo `TodayDrawer` của bản đồ làng). Suy ra mỗi lần hỏi, không lưu bảng riêng, tối đa 5 mục:
> 1. **Ôn thẻ** (`review`, luôn đứng đầu): `count = dueCount`, `minutes = min(8, max(2, ceil(count/4)))`, xong khi hết thẻ đến hạn (`count = 0`, vẫn hiện mục, tiêu đề "Thẻ đến hạn đã ôn xong"); người chưa có thẻ nào thì bỏ mục.
> 2. **Bài kế tiếp trong khoá** (`lesson`): khoá đang theo = khoá học dở (có bước xong, còn bước chưa xong) có tỉ lệ xong cao nhất; chưa học khoá nào thì khoá đầu tiên có `levelFrom ≤ learning.level`. Bước hiện ra là bước đầu tiên chưa xong **hoặc đã xong trong hôm nay** (để vẫn thấy dấu ✓ tới hết ngày; sang ngày sau chuyển sang bước kế); khoá vừa xong bước cuối trong hôm nay vẫn được tính là khoá đang theo. Phụ đề = tên khoá.
> 3. **Kỹ năng yếu nhất** (`skill`): rating Elo thấp nhất trong ngữ pháp / đọc / nghe (bằng nhau thì theo thứ tự đó; bỏ từ vựng vì đã có ôn thẻ); bài đầu tiên chưa xong (hoặc xong hôm nay) của kho tương ứng có level ≤ `learning.level` + 1 bậc và khác bài ở mục 2. Không có bài → mục `practice` (Luyện tập nhanh, 5 phút), xong khi hôm nay đã có ≥ 1 phiên luyện tập được ghi sổ XP (`exercise.session`; chỉ 5 phiên đầu/ngày ghi sổ).
> 4. Tổng phút < mục tiêu `learning.dailyMinutes` (10/20/30/60, mặc định 20, chọn ngay trong khối) → thêm tối đa 2 bước tiếp theo của cùng khoá (chưa xong, hoặc xong hôm nay thì giữ lại với dấu ✓).
>
> "Xong" của mục bài học = `lesson_progress.completedAt` nằm trong ngày cục bộ hôm nay. Bấm "Làm" mở thẳng: ôn thẻ → Giếng làng, luyện tập → Hội trường, bài → trang của loại bài với `startId`. Khối CTA ôn thẻ cũ trong ngăn kéo bỏ (mục ôn thẻ thay thế). Chưa có: bước "từ mới" (2), tiến độ lộ trình khi hover mascot.
>
> **Cập nhật 2026-11-11 (nhánh `feat/start-here`, "bắt đầu từ đâu" cho người lớn):**
> - **Mục TOEIC** (`kind = 'toeic'`): hồ sơ có `track = toeic` có thêm mục "Luyện TOEIC" (10 phút, một lượt luyện ngắn một Part) đặt ngay sau bài của khoá; xong khi hôm nay đã nộp **bất kỳ** bài TOEIC nào (mọi chế độ: Part / mini / full — `ExamRepository.countSince`, `DailyPlanService` có dep `exams`). Mục kỹ năng yếu/luyện tập chỉ thêm khi còn dưới `MAX_ITEMS`. Bấm "Làm" mở trang Luyện thi TOEIC.
> - **Thẻ "Hôm nay" trên trang chủ** (`VillageMap`): luôn hiện ở giữa phía dưới khi có lộ trình: chip tiến độ xong/tổng, mục kế tiếp chưa xong (icon, tên, phút · phụ đề), một nút chính ("Bắt đầu" nếu hôm nay chưa xong gì, ngược lại "Học tiếp") nhận phím Enter, nút phụ "Xem cả lộ trình" mở `TodayDrawer`. Xong hết → dòng chúc mừng; chưa có lộ trình mà có thẻ đến hạn → nút ôn thẻ như cũ. Enter mở mục kế tiếp (bỏ qua khi có hộp thoại mở, đang gõ trong ô nhập, hoặc có phím bổ trợ). Hàm dùng chung (tên/phụ đề/đích mở của mục, mục kế tiếp) ở `src/renderer/study/planItem.ts`.
> - **Kiểm tra trình độ → bài đầu tiên**: màn kết quả của chế độ placement có nút chính "Bắt đầu bài đầu tiên" (mở mục chưa xong đầu tiên của lộ trình mới tính), "Về trang chủ", "Làm lại"; chế độ checkpoint giữ nguyên.
> - **Mascot nhắc lộ trình**: cài đặt `plan.reminderHour` (0–23, mặc định 10, `null` = tắt; chỉnh ở menu chuột phải của mascot và Cài đặt → Hồ sơ và học tập). `planJob.ts` mỗi lần tới giờ, một lần mỗi ngày cục bộ (`plan.remindedDay`), chỉ hồ sơ người lớn, cùng điều kiện `canShow` như nhật ký/thẻ hỏi, chỉ khi lộ trình còn việc → bong bóng "còn N việc · M phút"; bấm → cửa sổ Học tập ở trang chủ. Xem [05](05-mascot-system.md).

## 14. Nhật ký tiếng Anh — ✅ 2026-11-10

Ý tưởng [01 G3](01-features.md): mỗi tối mascot hỏi "Hôm nay bạn làm gì?", người dùng viết 2–3 câu tiếng Anh, AI sửa nhẹ. Là nguồn Writing đầu tiên của app. **Chỉ người lớn** (hồ sơ trẻ em không có tab, không nhắc, `diary:save` bị chặn `FORBIDDEN`).

- **Trang**: tab "Nhật ký" ở **Thư viện** (cạnh Sổ từ), `DiaryPage.vue` (chỉ hiển thị, logic ở `DiaryService`). Câu gợi ý của ngày (1 trong 12 câu `study.diary.prompts.1..12`, chọn bằng 32 bit đầu của băm `fnv1a64(ngày)` `% 12 + 1` nên cố định trong ngày), ô viết (tối đa 1.200 ký tự, đếm từ), nút "Lưu" và "Sửa bằng AI" (chỉ hiện khi AI đã bật + có key, xem [11 §5](11-ai-and-speech.md)). Sau khi sửa: bản `corrected`, danh sách `cũ → mới` kèm lý do tiếng Việt, một câu khen. Dưới cùng: 30 ngày gần nhất (ngày + dòng đầu).
- **Lưu**: mỗi hồ sơ một entry mỗi ngày cục bộ (bảng `diary_entries`, [10](10-data-model.md)); lưu lại cùng ngày thì cập nhật chữ, đổi chữ thì xoá bản AI sửa cũ.
- **Thưởng**: lần đầu trong ngày entry có ≥ 10 từ → +10 XP, +3 xu (`xp_events.reason = 'diary.written'`, `ref_id` = ngày; idempotent). Sửa bằng AI không cho XP.
- **AI**: `AiService.correctDiary({ text, level: learning.level })` (prompt `diary_correct`); kết quả `{changes, praise_vi}` lưu ở cột `changes_json`. Người dùng sửa chữ trong lúc chờ AI thì bỏ kết quả cũ (`diary:correct` trả `stale: true`, trang báo bấm sửa lại).
- **Mascot nhắc**: cài đặt `diary.hour` (0–23, mặc định 21, `null` = tắt; Cài đặt → Hồ sơ và học tập: Tắt, 19:00…23:00). Job `diaryJob.ts` mỗi 5 phút: đã tới giờ, hôm nay chưa viết, chưa nhắc hôm nay, mascot đang hiện (không yên lặng/ẩn/ngủ, popup đóng), hồ sơ người lớn → mascot nói `mascot.diaryPrompt` (ưu tiên ngang thẻ hỏi ôn để không bị rơi khỏi hàng đợi); tối đa một lần mỗi ngày (nhớ trong bộ nhớ). Bấm bong bóng → mở cửa sổ Học tập ở trang nhật ký (`mascot:open-diary` → `StudyWindow.open('diary')` → sự kiện `study:open-page`).
- Chưa có: lưu từ AI sửa vào sổ từ. (Kỹ năng Viết trong Elo + thống kê Viết: ✅ 2026-11-11, [06 §2](06-levels-and-progression.md), [decisions #62](decisions.md). Viết tự do theo đề ở Hội trường: ✅ 2026-11-11, xem [Viết tự do theo đề](#viết-tự-do-theo-đề--2026-11-11). Dạng bài dịch câu / viết theo đề trong bài học: ✅ 2026-11-11, xem [Luyện viết](#luyện-viết-translate-write--2026-11-11).)

## Bài nói (`speak`) — 2026-10-21

Dạng bài `speak` (`{ type: 'speak', say, prompt?, word?, explain? }`) hiển thị câu/từ mẫu, nút 🔊 nghe mẫu và 🎤 ghi âm; Whisper nhận dạng offline rồi chấm theo từng từ (xem docs/11 §4). Đạt khi độ chính xác ≥ 70 (`SPEAK_PASS`); nút "Bỏ qua câu này" cho máy không có micro (tính là chưa đạt). Tính vào kỹ năng từ vựng trong Elo (chưa có kỹ năng nói riêng). Nội dung: unit `speak` "Luyện nói" (`content/curated/lessons/07-speaking.json`, 5 bài: giới thiệu, câu hằng ngày, âm khó /θ ð ʃ r/, âm cuối, đọc theo câu dài/shadowing).

## Luyện viết (`translate`, `write`) — 2026-11-11

Hai dạng bài viết trong bài học, dùng lại lớp AI sẵn có (`AiService`, [11 §5](11-ai-and-speech.md), [decisions #59](decisions.md)):

- **`translate`** (`{ type: 'translate', vi, answers[1..20], explain? }`): người học gõ bản dịch tiếng Anh của câu `vi`. Chấm ở main (`WritingService.checkTranslation`, kênh `writing:check-translation`): trước hết so khớp với `answers` sau chuẩn hoá (`src/shared/translationMatch.ts`: hoa/thường, khoảng trắng, dấu câu kể cả dấu phẩy giữa câu, nháy cong/thẳng; `I'm` = `I am`, `don't` = `do not`, `won't` = `will not`, `can't` = `cannot` = `can not`, `let's` = `let us`, `'s` sau đại từ/từ để hỏi = is hoặc has, `'d` = would hoặc had; sở hữu cách giữ nguyên). Khớp → đúng, **không gọi AI**. Không khớp và AI dùng được → tác vụ `translation_check` (`{ ok, corrected, note_vi }`) quyết định. AI không dùng được (chưa bật, hồ sơ trẻ em, hết lượt CLI hôm nay — trừ khi chọn "Không giới hạn" ở Cài đặt, [11 §5](11-ai-and-speech.md) —, bận, lỗi) → sai, hiện đáp án mẫu và lý do; không bao giờ chặn bài.
- **`write`** (`{ type: 'write', prompt, minWords 3–200, maxWords? ≤ 250, sample?, explain? }`): ô viết tối đa 1.200 ký tự (như nhật ký), nút nộp chỉ bật khi số từ trong khoảng `minWords–maxWords` (main kiểm lại). Có AI → `writing_feedback` (điểm 4 tiêu chí 0–5: đúng đề, ngữ pháp, từ vựng, mạch lạc; điểm tổng 0–100; tối đa 8 chỗ sửa; bản viết lại; 2–3 mẹo tiếng Việt), **đạt khi `overall ≥ 60`** (`WRITE_PASS`, `src/shared/writing.ts`). Không có AI (hoặc AI lỗi) → đạt khi đủ số từ, hiện bài mẫu + lý do không có AI (thông báo `errors.aiOff` chỉ chỗ bật AI trong Cài đặt).
- **Giao diện**: `LessonExercises.vue` (ô gõ chung với `gap` cho `translate`; `exercises/WriteBoard.vue` cho `write`, Enter trong ô viết là xuống dòng), `exercises/WritingFeedback.vue` hiện nhận xét/bản sửa AI hoặc đáp án mẫu/bài mẫu. Trong lúc chờ chấm: nút "Kiểm tra" thành "Đang chấm…", dòng trạng thái "AI đang chấm bài…" (khi AI sẵn sàng), ô nhập khoá nhưng **giữ nguyên chữ**; store `useWritingStore` không ném lỗi — kênh IPC lỗi thì chấm tại chỗ như không có AI. Không lưu bài viết hay kết quả AI (ngoài cache LRU trong bộ nhớ sẵn có của `AiService`).
- **Điểm, XP, Elo**: như `speak` — mỗi câu tính vào điểm bài (đạt bài ≥ 70%, thưởng lần đầu như mọi bài). Kỹ năng Elo: từ 2026-11-11 cả hai tính vào kỹ năng **Viết** (`writing`, `lessonExerciseSkill`, [decisions #62](decisions.md)); trước đó tính vào ngữ pháp (decisions #59) và các dòng thống kê cũ vẫn ở ngữ pháp, không chuyển dữ liệu. Khác `speak`: bài `write` chỉ được chấm theo số từ (không có AI) **không** gửi vào `byType` (không phải bằng chứng kỹ năng, `countsForSkill`), chỉ tính vào điểm bài; câu `translate` sai khi không có AI vẫn tính (có thể là bản dịch đúng mà danh sách đáp án thiếu — vì vậy nội dung phải liệt kê đủ đáp án).
- **Nội dung**: chương `write` "Luyện viết" (`content/curated/lessons/10-writing.json`, order 10, không thuộc khoá nào — giống chương "Luyện nói"): 6 bài A1_1 → B1_2 (giới thiệu bản thân, một ngày của tôi, cuối tuần vừa rồi, lời mời và kế hoạch, nêu ý kiến, email hỏi thông tin lịch sự), mỗi bài 3–4 khối dạy, 2 câu khởi động (`gap`/`order`/`mcq`), 4–5 câu `translate` (tổng 25) và 1 đề `write`. Quy tắc soạn ở `content/curated/lessons/AUTHORING.md`; test nội dung kiểm đáp án trùng sau chuẩn hoá, câu Việt có dấu, bài mẫu nằm trong khoảng số từ.
- **Âm thanh**: khối ví dụ + lời giải `gap`/`order` của 6 bài thêm 78 đoạn vào danh sách gói `listening-audio` (`--list` 11 888 → 11 966, chưa build lại gói); câu chưa có trong gói được đọc bằng giọng tự nhiên/giọng Windows (`useTts.dispatch`). Câu `translate`/`write` không đọc to.
- Chưa có (ngoài phạm vi): LanguageTool, lưu chỗ AI sửa vào sổ từ, viết cho hồ sơ trẻ em, `transform`/`roleplay`. (`speak_answer`: ✅ 2026-11-11, dạng `respond`, xem [Trả lời câu hỏi bằng giọng nói](#trả-lời-câu-hỏi-bằng-giọng-nói-respond--2026-11-11).)

## Trả lời câu hỏi bằng giọng nói (`respond`) — 2026-11-11

Dạng bài `speak_answer` của bảng §2, tên trong schema là **`respond`** (`speak` đã là đọc to/shadowing). Dùng lại Whisper tại máy ([11 §4](11-ai-and-speech.md)) và lớp AI sẵn có ([11 §5](11-ai-and-speech.md), [decisions #61](decisions.md)).

- **Schema**: `{ type: 'respond', question (tiếng Anh, ≤ 300 ký tự), vi? (nghĩa Việt, bấm mới hiện), minWords 3–60, sample? (câu trả lời mẫu ≤ 400 ký tự), explain? }`.
- **Luồng trên màn hình** (`exercises/RespondBoard.vue` trong `LessonExercises.vue`): câu hỏi + nút nghe (bình thường/chậm) + nút "Xem nghĩa tiếng Việt" → nút **Bấm để nói** có thanh mức âm và số giây còn lại (giới hạn 30 giây giữ nguyên, chạm giới hạn thì tự dừng và nhận dạng phần đã ghi; không chia đoạn) → "Máy nghe được: …" + dòng số liệu (số từ / cần ít nhất, từ/phút, lần ngừng lâu, từ đệm, lặp từ) + nút **Ghi lại** (ghi lại bao nhiêu lần tuỳ ý trước khi chấm). Im lặng / chỉ có từ đệm → "Không nghe thấy gì…" (như `speech.nothing`), không gửi gì, không tính là một lần trả lời.
- **Chấm**: ở main (`SpeakingService.feedback`, kênh `speaking:feedback`): renderer gửi `kind + lessonId + index + transcript + words[] + useAi`, main tự lấy câu hỏi/`minWords` từ nội dung bài và **tự tính lại** số liệu trôi chảy. AI dùng được (bật, người lớn, có nhà cung cấp) → nút chính là **"Nhận xét bằng AI"**, cạnh đó dòng báo "Chỉ gửi chữ máy nghe được cho Claude, không gửi âm thanh"; nút phụ "Chấm không cần AI". AI không dùng được → nút "Kiểm tra" chấm tại máy. Phím Enter **không** chấm/gửi câu `respond` (chỉ chuyển câu sau khi đã chấm).
  - Có nhận xét AI: điểm 4 tiêu chí 0–5 (trả lời đúng câu hỏi, ngữ pháp, từ vựng, trôi chảy — **không có phát âm** vì AI không nghe âm thanh), điểm tổng 0–100, tối đa 6 chỗ sửa, câu trả lời tốt hơn, 2–3 mẹo; **đạt khi `overall ≥ 60`** (`RESPOND_PASS`, `src/shared/speaking.ts`).
  - Không AI (tắt, hồ sơ trẻ em, chọn "Chấm không cần AI"): **đạt khi nói đủ `minWords` từ** (`respondWordCount`: bỏ dấu câu và từ đệm um/uh/er/erm/hmm). Hiện số liệu trôi chảy và câu trả lời mẫu.
  - Bấm "Nhận xét bằng AI" mà AI lỗi (hết lượt, bận, lỗi mạng/định dạng, vừa tắt) → **chưa chốt câu**: hiện lý do, cho "Thử lại nhận xét AI" hoặc "Chấm không cần AI" (dùng kết quả chấm tại máy main đã trả).
  - Kết quả ghi nhãn **tham khảo** (`speech.disclaimer`) + "không chấm phát âm — luyện ở các bài đọc to". Câu trả lời mẫu có nút nghe.
- **Không có micro / bị từ chối quyền / chưa tải model Whisper**: như `speak` — thông báo lỗi micro, mời tải model (`SttModelSetup.vue`, tách ra từ `SpeakPractice` để dùng chung), nút **"Bỏ qua câu này"** tính là chưa đạt (giống `skipSpeak`).
- **Số liệu trôi chảy** (`answerFluency`, `src/shared/speech.ts`, hàm thuần có test): thời lượng, từ/phút và số quãng ngừng > 0,8 giây lấy từ `fluencyStats` (chỉ đo khi có ≥ 3 từ có mốc thời gian), cộng số từ, số lần lặp từ liền nhau, số từ đệm (chỉ `um`, `uh`, `er`, `erm`, `hmm` — không đếm `like`/`so`). Main đưa các số này vào prompt; AI được dặn chấm tiêu chí trôi chảy theo các số này.
- **Điểm, XP, Elo**: mỗi câu tính vào điểm bài (đạt bài ≥ 70%, thưởng lần đầu như mọi bài). **Không vào Elo** (`countsForSkill` luôn false cho `respond`): Elo chưa có kỹ năng Nói và điểm dựa trên chữ máy nhận dạng.
- **Riêng tư**: âm thanh chỉ đi renderer → main → Whisper, không lưu, không log; lời nhận dạng không lưu (không DB, không cài đặt) và chỉ gửi cho Claude khi người học bấm ([16](16-privacy-and-security.md#micro--bài-nói)).
- **Nội dung**: chương `respond` "Trả lời câu hỏi bằng giọng nói" (`content/curated/lessons/11-speaking-answers.json`, order 11, không thuộc khoá nào): 6 bài A1_1 → B1_2 (giới thiệu bản thân, một ngày của bạn, thời gian rảnh và cuối tuần, việc học/công việc và kế hoạch, nêu ý kiến, kể trải nghiệm và so sánh), mỗi bài 3 khối dạy (cụm câu hữu ích, khung trả lời: trả lời + lý do + ví dụ), 2 câu khởi động (`gap`/`order`/`mcq`) và 4–5 câu `respond` (tổng 26; `minWords` A1 5–8, A2 10–15, B1 20–28). Test nội dung: câu mẫu ≥ `minWords` và ≤ 70 từ, `minWords` ≤ 30, nghĩa Việt có dấu.
- **Âm thanh**: câu hỏi (0,9 / 0,6) và câu trả lời mẫu (0,9) được đưa vào danh sách gói `listening-audio` (`--list` 11 966 → 12 176, chưa build lại gói).
- Chưa có (ngoài phạm vi): trang nói tự do, lịch sử câu trả lời, rubric IELTS Speaking, `roleplay`, kỹ năng Nói trong Elo.

## Viết tự do theo đề — 2026-11-11

Viết đoạn/bài theo đề, không bị giới hạn trong 6 bài "Luyện viết" cố định ([decisions #60](decisions.md)). **Chỉ người lớn** (tab ẩn với hồ sơ trẻ em; mọi kênh `free-writing:*` bị chặn `FORBIDDEN` / `errors.forbidden` như `diary:save`).

- **Chỗ vào**: **Hội trường** (địa điểm `hall` trên bản đồ làng) giờ có hai tab: "Luyện tập" (`PracticeSession.vue`, luồng luyện tập nhanh giữ nguyên) và **"Viết tự do"** (trang `writing`, `FreeWritingPage.vue`). Không nằm trong menu con.
- **Đề**: `content/curated/free-writing/topics.json` (`license: proprietary-own`, tự soạn, schema `FreeWritingTopicFileSchema`, nạp bằng `bundledFreeWritingFiles` → `FreeWritingTopics`, test `freeWriting.content.test.ts`): **30 đề** — A1 8, A2 8, B1 7, B2 7; mỗi đề có `id` (bắt đầu bằng bậc, vd `a2-hobby`), `level` (LevelCode), tên ngắn tiếng Việt, `prompt` (tiếng Việt cho A1–A2; tiếng Anh kèm một câu tiếng Việt trong ngoặc cho B1; tiếng Anh cho B2) và 3–5 gợi ý (câu mở đầu / cụm từ hữu ích, tuỳ chọn dùng). Bậc lọc A1/A2/B1/B2 suy từ `level` (`bandOfLevel`; từ C1 dùng đề B2); mặc định theo `learning.level`. Người học chọn bậc (chip), chọn đề trong danh sách, bấm **"Đề khác"** (đề ngẫu nhiên cùng bậc, khác đề đang chọn), hoặc bật **"Tự đặt đề"** (ô chữ ≤ 200 ký tự, `FREE_TOPIC_MAX_CHARS`; khoảng số từ theo bậc đang chọn).
- **Độ dài** (`FREE_WRITING_RANGES`, `src/shared/freeWriting.ts`; chỉ là gợi ý, không chặn lưu; được nói cho AI là độ dài đề yêu cầu):

  | Bậc | Ngắn | Vừa | Dài |
  |---|---|---|---|
  | A1 | 20–40 từ | 40–70 | 70–100 |
  | A2 | 30–60 | 60–100 | 100–150 |
  | B1 | 50–90 | 90–150 | 150–220 |
  | B2 | 80–130 | 130–200 | 200–300 |

  Mức dài nhất 300 từ để nhận xét AI (bản viết lại + chỗ sửa) vừa `max_tokens` 4096. Ô viết tối đa **3.000 ký tự** (`FREE_WRITING_MAX_CHARS`, kiểm cả ở zod của kênh IPC), cao hơn 1.200 của bài `write`.
- **Lưu & nhận xét**: nút "Lưu" và "Lưu và nhận xét bằng AI" (chỉ hiện khi AI dùng được; cần ≥ 10 từ, `FREE_WRITING_FEEDBACK_MIN_WORDS`). Luôn **lưu trước** (`free-writing:create`) rồi mới gọi `free-writing:feedback`, nên AI chậm/lỗi không làm mất bài; lưu lỗi thì chữ vẫn ở nguyên trong ô. Bản nháp (đề, độ dài, chữ) nằm trong `useFreeWritingStore` nên đổi tab/địa điểm rồi quay lại vẫn còn (đóng cửa sổ thì mất bản nháp chưa lưu). Nhận xét dùng lại tác vụ `writing_feedback` ([11 §5](11-ai-and-speech.md)): chữ đề (đề tự soạn do main lấy theo mã, hoặc đề tự đặt) chỉ nằm trong thẻ `<task>` ở phần `user`, không ghép vào system prompt; thẻ đóng `</task>` trong đề tự đặt bị vô hiệu hoá như mọi dữ liệu khác. Hiện bằng `WritingFeedback.vue` với `graded=false`: **không có ngưỡng đạt**, chỉ hiện điểm tổng (chip trung tính) + 4 tiêu chí, chỗ sửa, bản viết lại, mẹo. Không có AI (tắt, hết lượt hôm nay, bận, lỗi): bài vẫn được lưu, trang báo "Chưa có nhận xét AI" + lý do (`aiReason`, cùng khoá `errors.*` như bài học) và bài đã lưu có nút **"Nhận xét bằng AI"** để thử lại sau (chỗ duy nhất khác bài `write` trong bài học). Đã có nhận xét thì bấm lại không tốn lượt. Chữ đổi trong lúc chờ AI → bỏ nhận xét (`stale`).
- **Bài đã viết**: danh sách mới nhất trước (ngày, tên đề, số từ, điểm nếu có), 20 bài mỗi trang + "Xem thêm" (`free-writing:list` theo offset). Mở một bài: xem chữ + nhận xét (chỉ đọc), nút Sửa (sửa chữ thì nhận xét cũ bị bỏ, như nhật ký; đề và độ dài giữ nguyên), Xoá (hỏi xác nhận), Viết bài mới. Bảng `free_writing_entries` ([10](10-data-model.md), migration `0010`).
- **Thưởng**: bài đầu tiên trong ngày cục bộ có ≥ **20 từ** (`FREE_WRITING_REWARD_MIN_WORDS` = mức "ngắn" thấp nhất) → **+15 XP, +5 xu** (`xp_events.reason = 'free-writing.written'`, `ref_id` = ngày; idempotent; sửa chữ một bài **viết trong hôm nay** cho đủ từ cũng tính, còn mở bài của ngày trước ra sửa hoặc lưu lại chữ không đổi thì không). Cao hơn nhật ký (≥ 10 từ, +10 XP, +3 xu) vì bài dài hơn, nhưng vẫn một lần/ngày để không "cày" được. Nhận xét AI không cho thêm XP.
- **Elo (từ 2026-11-11, [decisions #62](decisions.md))**: nhận xét AI **mới** đầu tiên của mỗi bài được tính vào kỹ năng **Viết** một lần: 1 câu ở độ khó theo bậc đề (A1 → A1_1, A2 → A2_1, B1 → B1_1, B2 → B2_1; `bandDifficultyLevel`), đúng khi `overall ≥ 60` (`WRITE_PASS`; giao diện vẫn không hiện đạt/trượt), `exercise_stats.source = 'free-writing'`, `kind = 'free'`. Ghi ở main trong `FreeWritingService.feedback`, cùng transaction với lưu nhận xét và đánh dấu `rated_at` (migration 0011). Không ghi khi: đã có nhận xét (trả luôn), AI tắt/lỗi, chữ đổi trong lúc chờ (`stale`), đổi hồ sơ trong lúc chờ, hoặc bài đã được tính trước đó (sửa chữ rồi xin nhận xét lại vẫn lưu nhận xét/điểm mới).
- **Thống kê**: trang Thống kê → tab Trình độ có dòng kỹ năng Viết và khối "Viết tự do" (số bài, số từ đã viết, số bài 30 ngày, số bài có nhận xét AI, điểm AI trung bình), qua kênh `study:stats` (trường `writing`); ẩn với hồ sơ trẻ em.
- Chưa có (ngoài phạm vi): lưu chỗ sửa vào sổ từ, LanguageTool, đưa vào lộ trình hôm nay, mascot nhắc, hồ sơ trẻ em.

## Phiên ôn từ: thứ tự & ẩn từ vừa ôn — 2026-10-21

- **Thứ tự** (`review.order`): `random` (mặc định) xáo trộn các thẻ đến hạn; còn `mixed` (xen kẽ theo hạn), `new-first`, `review-first`. Trước đây luôn đi tuần tự theo hạn nên mỗi lần vào lại gặp lại đúng những thẻ đầu.
- **Ẩn từ vừa ôn** (`review.hideMinutes`: 0/10/30/60/180/720, mặc định 30): sau khi ôn một thẻ, mọi thẻ của *từ* đó (Anh→Việt, Việt→Anh, nghe-gõ, điền từ) bị ẩn trong N phút, kể cả khi chấm "Quên" (FSRS vốn cho học lại sau ~1 phút). Áp dụng cả cho số thẻ còn lại và câu hỏi của mascot; chế độ trẻ em không ẩn (cần lặp lại ngay). Cài đặt → Ôn từ. `SrsService.dueCards(limit, directions, bury)` + `VocabRepository.dueWhere(buryAfter)`.
- **Thẻ điền từ**: ô chữ mỗi chữ một ô (chữ đầu hiện sẵn), nghĩa của từ cần điền + số chữ cái, nút "Gợi ý thêm 1 chữ", nút "Nghe câu" (đọc cả câu — là gợi ý bằng tai nên có lộ đáp án), hình pixel của từ nếu có (`pictureForWord`).

### Thẻ nhận diện tương tác — 2026-10-21

- **Trắc nghiệm nghĩa** (`review.choices`, mặc định bật): thẻ `en_vi` hiện 4 lựa chọn nghĩa (1 đúng + 3 nhiễu cùng level, `DictionaryService.quizData`); chọn xong lộ đáp án và gợi ý mức chấm (đúng → Được, sai → Quên), vẫn bấm 1–4 để tự chấm lại. Không dựng đủ 3 nghĩa nhiễu (từ điển nhỏ) hoặc là mẫu câu → rơi về lật thẻ. `StudyCard.choices/choiceAnswer`.
- **Nói to** (tuỳ chọn): nút "🎤 Nói to từ này" mở `SpeakPractice` (chấm âm vị nếu đã tải wav2vec2, nếu không thì Whisper); không ảnh hưởng mức chấm.
- **Từ nhiều nghĩa**: thẻ nhận diện hiện câu ngữ cảnh người dùng đã lưu (từ được tô đậm) ngay ở mặt trước để biết đang hỏi nghĩa nào; thẻ điền từ chỉ hiện "nghĩa của từ cần điền" khi từ có đúng 1 nghĩa (nhiều nghĩa thì dựa vào câu dịch).
- **Thống nhất nghĩa giữa mascot và màn ôn**: lựa chọn của mascot trước đây chỉ lấy nghĩa đầu (ngắn), trong khi màn ôn hiện đủ nghĩa; nay cả hai dùng `formatMeanings` (tối đa 2 nghĩa đầu, cách nhau `; `).
- Dòng gợi ý phím tắt đổi theo trạng thái (chọn nghĩa / gõ / lật / chấm 1 Quên · 2 Khó · 3 Được · 4 Dễ).
