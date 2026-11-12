# Hướng dẫn soạn bài học nền tảng

Mỗi file `NN-<ten>.json` trong thư mục này là **một chương** (unit) gồm nhiều bài (lesson). Định dạng đầy đủ nằm ở
[`src/shared/schemas/lesson.ts`](../../../src/shared/schemas/lesson.ts) — đọc file đó trước, mọi trường đều có chú thích.
Nội dung **tự soạn** (license `proprietary-own`): không chép nguyên văn sách giáo khoa/website có bản quyền; ví dụ và
bài tập phải do bạn tự nghĩ ra.

Người học: **người Việt**, từ mới bắt đầu (Pre-A1) tới trung cấp. Giải thích bằng **tiếng Việt tự nhiên, ngắn gọn**;
mọi ví dụ tiếng Anh dùng **tiếng Anh Mỹ**, từ vựng đơn giản và hữu ích trong đời sống.

## Cấu trúc file

```json
{
  "license": "proprietary-own",
  "unit": { "id": "alphabet", "title": "Bảng chữ cái & phát âm", "summary": "…", "icon": "🔤", "order": 1 },
  "lessons": [
    {
      "id": "alphabet.letters",
      "title": "Bảng chữ cái tiếng Anh",
      "summary": "26 chữ cái, tên chữ và cách đọc.",
      "level": "PA1_1",
      "minutes": 8,
      "blocks": [
        { "type": "text", "md": "Tiếng Anh có **26 chữ cái**…\n\n- ý 1\n- ý 2" },
        { "type": "sounds", "title": "Nghe từng chữ cái", "items": [
          { "text": "A a", "ipa": "/eɪ/", "note": "apple", "say": "A" }
        ]},
        { "type": "tip", "md": "Người Việt hay đọc `h` là “hát”; đúng là /eɪtʃ/ (“ết-ch”)." },
        { "type": "examples", "title": "Ví dụ", "items": [
          { "en": "My name is Lan.", "vi": "Tên tôi là Lan.", "note": "tuỳ chọn" }
        ]},
        { "type": "table", "title": "Bảng", "head": ["Ngôi", "Động từ"], "rows": [["I", "am"], ["he/she/it", "is"]] }
      ],
      "exercises": [
        { "type": "mcq", "prompt": "…?", "choices": ["a", "b", "c"], "answer": 1, "explain": "Giải thích ngắn." },
        { "type": "gap", "prompt": "She ___ a teacher.", "answers": ["is"], "choices": ["am", "is", "are"], "explain": "…" },
        { "type": "order", "hint": "Tôi là học sinh.", "answer": "I am a student." },
        { "type": "match", "prompt": "Ghép từ với nghĩa", "pairs": [{ "left": "cat", "right": "con mèo" }, …] },
        { "type": "listen", "say": "ship", "prompt": "Bạn nghe được từ nào?", "choices": ["ship", "sheep"], "answer": 0 }
      ]
    }
  ]
}
```

### Cú pháp văn bản (`md`, `note`...)
Không dùng HTML. Đoạn cách nhau bằng dòng trống (`\n\n`); dòng bắt đầu `- ` là mục danh sách;
`**chữ đậm**`; `` `cụm tiếng Anh hoặc ký hiệu` `` hiển thị nổi bật (dùng cho từ/câu tiếng Anh nằm giữa câu tiếng Việt).

## Yêu cầu chất lượng

1. **Đúng**: ngữ pháp, phiên âm IPA (Mỹ, trong dấu `/ /`), quy tắc phát âm. Không chắc thì bỏ ý đó, đừng bịa.
   Chỉ nêu quy tắc khi nó đủ ổn định; ghi rõ "thường" / "ngoại lệ" khi có ngoại lệ phổ biến.
2. **Sư phạm**: mỗi bài một mục tiêu rõ; đi từ ví dụ → quy tắc → lỗi người Việt hay mắc (`tip`) → luyện tập.
   Mỗi bài có 4–8 khối nội dung, phần giải thích tổng cộng khoảng 200–550 từ tiếng Việt (không dài hơn).
   - **Hướng dẫn nói**: bài nào cũng nên có một khối giúp người học *phát âm được* nội dung của bài — khối `sounds`
     (bấm nghe + nút micro) cho dạng viết tắt, đuôi từ, từ bất quy tắc đổi âm; hoặc bảng "tập từng bước" (môi, lưỡi, hơi)
     ở bài phát âm. Cặp từ chỉ khác một âm viết thành một ô: `"text": "ship – sheep"`, `"say": "ship. sheep."`.
   - **Trường hợp đặc biệt**: thêm một khối "điều thú vị / chỗ sách ít nói" — ngoại lệ hay gặp và lý do của nó
     (vd `an hour` vì h câm, `a university` vì u đọc /ju/), khác biệt với tiếng Việt, cách người Mỹ nói ngoài đời.
     Chỉ đưa điều chắc chắn đúng.
   - IPA theo cách ghi của chương chữ cái: không dùng dấu dài `ː`; viết /ɜr/, /ər/ (không dùng ɝ, ɚ).
3. **Ví dụ**: câu tự nhiên, ngắn (≤ 12 từ), có bản dịch tiếng Việt tự nhiên (không dịch từng chữ). Mỗi bài có ít nhất
   một khối `examples` (6–10 câu) để người học nghe và đọc theo.
4. **Bài tập**: mỗi bài **10–12 bài tập** (tối đa 12), trộn ít nhất 3 dạng, xếp từ dễ đến khó. Bài phát âm dùng nhiều
   `listen` và `sounds`; bài ngữ pháp dùng `gap`, `order`, `mcq`. Mỗi bài nên kết thúc bằng 1–2 câu `speak` (hoặc
   `listen`) để người học nói thành tiếng điều vừa học.
   - `gap`: đúng **một** `___`; `answers` liệt kê mọi đáp án hợp lệ (ví dụ cả dạng viết tắt nếu chấp nhận được).
     Nên có `choices` (2–4 lựa chọn, gồm đáp án đúng) ở các bài đầu; bài khó hơn để người học tự gõ.
   - `order`: câu 3–12 từ và **chỉ có MỘT cách sắp xếp đúng** (tránh trạng từ có thể đứng nhiều chỗ). Hệ thống so khớp
     không phân biệt hoa/thường và dấu câu.
   - `listen`: đưa cặp/nhóm từ dễ nhầm (ship/sheep, cat/cut); TTS đọc `say`. Chỉ dùng khi phân biệt được bằng tai.
   - `match`: 3–6 cặp, không trùng vế.
   - `explain` (một câu ngắn) ở các câu dễ sai.
   - Đáp án đúng **không** luôn ở vị trí đầu; `answer` là chỉ số (từ 0) trong `choices`. App xáo lựa chọn của `mcq`,
     `listen`, `picture`, `gap` khi hiển thị (`tf` không xáo). Nếu một lựa chọn nhắc tới lựa chọn khác hoặc vị trí
     ("Both together", "All of the above", "cả hai", "cả A và B") hay là cặp Có/Không, đặt `"keepOrder": true`
     (mcq, gap, listen) để giữ đúng thứ tự đã soạn.
5. **Không đạo văn / không bản quyền**: tự viết. Không đưa tên thương hiệu, người thật nhạy cảm, nội dung chính trị/tôn giáo/18+.
   Phù hợp cả trẻ em lớn và người lớn.
6. **Định dạng**: JSON hợp lệ UTF-8, thụt 2 dấu cách, tiếng Việt có đủ dấu. `level` ∈ `PA1_1, PA1_2, A1_1, A1_2, A2_1,
   A2_2, B1_1, B1_2` (…) theo độ khó thực tế của bài.

## Kiểm tra

```bash
pnpm exec vitest run src/main/content/lessons.test.ts
```

Lệnh này kiểm tra schema và các quy tắc trên cho **mọi file** trong thư mục. Chỉ cần file của bạn không có lỗi
(file do người khác đang soạn có thể lỗi tạm thời — bỏ qua).

## Dạng bài `speak` (nói)

`{ "type": "speak", "say": "Nice to meet you.", "prompt": "Giới thiệu…", "word": true }` — người học đọc to `say`, được chấm bằng nhận dạng giọng nói offline (đạt khi ≥ 70%). `word: true` cho một từ đơn (pronounce_word). Không cần `answer`; `explain` tuỳ chọn.

## Dạng bài `translate` (dịch Việt → Anh) và `write` (viết theo đề)

`{ "type": "translate", "vi": "Tôi tên là Nam.", "answers": ["My name is Nam.", "I am Nam."], "explain": "…" }` — người học gõ bản dịch tiếng Anh. Chấm bằng so khớp với `answers` sau chuẩn hoá (`src/shared/translationMatch.ts`: bỏ qua hoa/thường, khoảng trắng, dấu câu, nháy cong; `I'm` = `I am`, `don't` = `do not`, `can't` = `cannot` = `can not`, `'s` sau đại từ = is/has, `'d` = would/had). Không khớp mà người học đã bật AI thì AI xét câu có chấp nhận được không; **tắt AI thì `answers` là cách chấm duy nhất** — liệt kê mọi bản dịch tự nhiên (đổi từ đồng nghĩa, đổi vị trí trạng ngữ thời gian, có/không `o'clock`, chữ số/chữ). Không cần ghi lại biến thể chỉ khác viết tắt hay dấu câu (test báo trùng). Tối đa 20 đáp án, câu Việt có dấu đầy đủ.

`{ "type": "write", "prompt": "Viết 3–5 câu…", "minWords": 15, "maxWords": 60, "sample": "…" }` — đề bằng tiếng Việt; người học phải viết đủ `minWords` (và không quá `maxWords`) mới nộp được. AI chấm (đạt khi điểm tổng ≥ 60); tắt AI thì đạt khi đủ số từ và hiện `sample`. `sample` phải nằm trong khoảng số từ của đề (test kiểm tra).

## Dạng bài đọc nâng cao: `headings`, `summary`, `mcq.focus`

`{ "type": "headings", "prompt": "…(tuỳ chọn)", "headings": ["…", "…", "…", "…", "…"], "answers": [2, 0, 4, 1], "explain": "…" }` —
ghép tiêu đề với đoạn. `answers[i]` là chỉ số (từ 0) trong `headings` của tiêu đề **đoạn i** của block `passage` đầu
tiên, nên `answers` có đúng bằng số đoạn (test kiểm). 3–8 tiêu đề, ít nhất **một tiêu đề thừa**, mỗi tiêu đề dùng một
lần, không trùng nhau (schema kiểm). App xáo danh sách tiêu đề.

`{ "type": "summary", "text": "… ___ … ___ …", "answers": ["…", "…"], "distractors": ["…"], "explain": "…" }` — hoàn
thành tóm tắt bằng ngân hàng từ. Số `___` trong `text` bằng số `answers` (2–6, theo thứ tự chỗ trống), 1–4 từ nhiễu;
đáp án và từ nhiễu không trùng nhau (không phân biệt hoa/thường). Chấm không phân biệt hoa/thường.

Hai dạng này chấm **tất cả hoặc không** (sai một mục là sai cả câu; sau khi chấm app tô đúng/sai từng mục) và **không
đọc to** (không vào gói âm thanh).

`mcq` có thể thêm `"focus"`: `"detail"` (chi tiết — mặc định, không hiện nhãn), `"main_idea"` (ý chính),
`"inference"` (suy luận), `"vocab"` (từ trong ngữ cảnh), `"purpose"` (mục đích của tác giả). Nhãn hiện trên câu hỏi;
cách chấm không đổi.

## Bài đọc từ B1_1 (`content/curated/readings`)

Bài mẫu: `readb1.making-new-friends` (B1) và `readc1.nudges` (C1) — đọc hai bài này trước khi soạn.

1. **Không đổi** block `passage`, `id`, `title`, `summary`, `level` của bài đã phát hành.
2. **Câu `gap` có sẵn**: giữ nguyên từng byte hoặc xoá; không sửa, không thêm `gap`, `order`, `listen`, `speak`,
   `respond` mới — chữ của chúng nằm trong gói âm thanh đã phát hành. Kiểm tra:
   `node scripts/audio/build-listening-audio.mjs --list` phải in cùng `TOTAL` như trước khi sửa.
3. **Số câu**: 7–10 bài tập (schema tối đa 12), gồm ít nhất 1 `summary`, ít nhất 1 `mcq` `"focus": "inference"`, ít
   nhất 1 `mcq` `"focus": "vocab"` dạng `In paragraph 2, the word "X" is closest in meaning to …`. Từ **B2_1** trở
   lên có **đúng 1** `headings`; B1 tuỳ chọn.
4. Giữ các `mcq`/`tf` tốt có sẵn; xoá hoặc viết lại câu chỉ bắt tìm một cụm chữ y nguyên trong bài. Nếu một câu `tf`
   có `ng: true` thì mọi câu `tf` của bài đều có.
5. `mcq` mới: B2 trở lên **4 lựa chọn**, B1 3–4. Lựa chọn nhiễu hợp lý nhưng bài đọc cho thấy rõ là sai; chỉ **một**
   đáp án bảo vệ được.
6. Đáp án đúng của `mcq` **không được nổi bật nhờ độ dài** hay mức chi tiết: viết lựa chọn nhiễu dài và cụ thể như đáp
   án (câu `vocab`: mọi lựa chọn cùng một kiểu — cùng là từ đơn, hoặc cùng là cụm ngắn dài tương đương). Quy tắc nhanh:
   đáp án đúng không bao giờ dài hơn 1,3 lần lựa chọn nhiễu dài nhất.
7. `summary.text` **diễn đạt lại** bài (không chép câu của bài); đáp án là một từ hoặc cụm ≤ 3 từ; từ nhiễu hợp ngữ
   pháp với chỗ trống (người học không loại được chỉ nhờ ngữ pháp).
8. Tiêu đề (`headings`) nêu ý chính của đoạn bằng lời mới; tiêu đề sai vẫn đúng chủ đề nhưng chỉ là một chi tiết hoặc
   điều bài không nói.
9. `explain`: tiếng Việt cho B1, tiếng Anh từ B2; mọi câu mới đều có và **nêu đoạn chứng minh** đáp án ("Đoạn 2: …" /
   "Paragraph 2: …").
10. Số câu tăng từ 3 trở lên thì tăng `minutes` thêm 2 (tối đa 30).

## Dạng bài `respond` (trả lời câu hỏi bằng giọng nói = `speak_answer`)

`{ "type": "respond", "question": "What did you do last weekend?", "vi": "Cuối tuần trước bạn đã làm gì?", "minWords": 12, "sample": "…", "explain": "…" }` — câu hỏi tiếng Anh (≤ 300 ký tự, có nút nghe nên được đưa vào gói `listening-audio`), `vi` là nghĩa tiếng Việt người học bấm mới hiện. Người học nói ≤ 30 giây, Whisper nhận dạng tại máy; bấm "Nhận xét bằng AI" thì AI chấm chữ nhận dạng (đạt khi điểm tổng ≥ 60), không thì đạt khi nói đủ `minWords` từ (không tính từ đệm um/uh). Chọn `minWords` vừa sức 30 giây: A1 ~5–8, A2 ~10–15, B1 ~20–30 (test chặn > 30). `sample` (≤ 400 ký tự) là câu trả lời tự nhiên kiểu nói, ít nhất `minWords` từ và không quá 70 từ (test kiểm tra), có nút nghe sau khi chấm. Câu hỏi đời thường tự soạn — không chép đề thi IELTS/TOEIC thật. Bài có `respond` vẫn cần ≥ 6 bài tập và ≥ 2 dạng (thêm 1–2 câu khởi động `gap`/`order`/`mcq`).
