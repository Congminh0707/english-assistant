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
| `translate_sentence` | Dịch câu Việt → Anh | writing | A1+ | so khớp đáp án mẫu + AI nếu có |
| `speak_repeat` | Nghe → nói lại (shadowing) | speaking | PA1+ | STT + so khớp từ / phát âm |
| `pronounce_word` | Phát âm từ đơn / cặp âm tối thiểu | speaking | PA1+ | điểm phát âm |
| `speak_answer` | Trả lời câu hỏi bằng giọng nói | speaking | A2+ | AI (độ trôi chảy, từ vựng, ngữ pháp) |
| `roleplay` | Hội thoại nhập vai với AI | speaking, writing | A2+ | AI theo rubric |
| `write_free` | Viết đoạn/bài theo đề | writing | A2+ | LanguageTool + AI theo rubric |
| `trace_letter` | Tô chữ cái bằng chuột | phonics | PA1 | tỉ lệ phủ nét |
| `video_quiz` | Xem đoạn video → trả lời | listening | A1+ | đúng/sai |

**Quy tắc chung cho mọi dạng bài:**
- Luôn có **giải thích** sau khi trả lời (tiếng Việt cho ≤ B1, tiếng Anh từ B2, có nút chuyển ngôn ngữ).
- Mỗi câu có nút 🔊 nếu có câu tiếng Anh, bấm vào từ bất kỳ để tra nhanh.
- Kết quả từng câu lưu vào `attempts` (xem [10](10-data-model.md)) để cập nhật rating & thống kê.
- Từ sai → tự gợi ý thêm vào sổ từ SRS.

---

> ✅ **Đã làm (Phase 1/2)** — `PracticeService` + `src/shared/practice.ts` + trang "Luyện tập" trong cửa sổ Học tập (xem [decisions #13](decisions.md)): 5 dạng bài sinh từ câu Tatoeba có bản dịch Việt và từ vựng đúng trình độ — `cloze` (điền từ), `word_order` (sắp xếp câu), `listen_choice` (nghe chọn nghĩa), `dictation` (nghe chép, đạt khi đúng ≥ 90% số từ), `match_pairs` (ghép từ–nghĩa). Khác với thiết kế registry ở trên: chưa tách component dùng chung (`PracticeSession.vue` chứa cả 5 dạng) và chưa có `exerciseRegistry`; sẽ tách khi thêm dạng bài thứ 6+. Chưa có: `picture_choice`, `tap_pairs` hình, `true_false_ng`, `speak_repeat`..., bài đọc, ngữ pháp có giải thích, rating theo kỹ năng.

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

43 bài / 7 chương, 423 bài tập (đo 2026-10-22, [17 §2](17-metrics.md)). Mỗi bài: giải thích tiếng Việt ngắn, bảng, ví dụ có nút nghe (TTS), mẹo lỗi người Việt hay mắc, lưới âm bấm nghe, 8–12 bài tập (trắc nghiệm, điền chỗ trống, sắp xếp câu, ghép cặp, nghe rồi chọn) chấm tại chỗ. Tiến độ lưu ở `lesson_progress` (điểm cao nhất, số lần làm); **lần đầu đạt ≥ 70% thưởng +15 XP, +5 xu** (+5 XP nếu 100%), mỗi bài thưởng một lần. Câu `say` của chữ cái viết thành tên chữ ("bee", "double-you") để giọng máy đọc đúng. Hạn chế: giọng TTS của Windows có thể là giọng Anh (vd "zed"); phần giải thích chỉ có tiếng Việt; chưa có bài đọc hiểu/viết; chưa có phiên bản cho trẻ em (phonics từng chữ có hình).

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

> 🚧 **Mở rộng từ vựng (Phase 2b)**: bản đồ thế giới (tỉnh/thành Việt Nam → các nước → Trái Đất), mỗi nơi một chủ điểm có công trình voxel, lượt học 5 bước — thiết kế ở [19](19-kids-world.md). 2026-10-30: đã có tầng 1 (12 nơi, 120 từ), service + IPC, bản đồ 2D và lượt chơi; ô **Chơi** của bé giờ mở bản đồ, từ mới chỉ vào qua các nơi (bình tưới để ôn). Chưa thử tay; bản 3D chưa làm.

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

Mascot nhắc lộ trình vào giờ người dùng chọn, và hiển thị tiến độ hôm nay khi hover.

## Bài nói (`speak`) — 2026-10-21

Dạng bài `speak` (`{ type: 'speak', say, prompt?, word?, explain? }`) hiển thị câu/từ mẫu, nút 🔊 nghe mẫu và 🎤 ghi âm; Whisper nhận dạng offline rồi chấm theo từng từ (xem docs/11 §4). Đạt khi độ chính xác ≥ 70 (`SPEAK_PASS`); nút "Bỏ qua câu này" cho máy không có micro (tính là chưa đạt). Tính vào kỹ năng từ vựng trong Elo (chưa có kỹ năng nói riêng). Nội dung: unit `speak` "Luyện nói" (`content/curated/lessons/07-speaking.json`, 5 bài: giới thiệu, câu hằng ngày, âm khó /θ ð ʃ r/, âm cuối, đọc theo câu dài/shadowing).

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
