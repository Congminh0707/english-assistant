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
   Mỗi bài có 3–6 khối nội dung, phần giải thích tổng cộng khoảng 150–400 từ tiếng Việt (không dài hơn).
3. **Ví dụ**: câu tự nhiên, ngắn (≤ 12 từ), có bản dịch tiếng Việt tự nhiên (không dịch từng chữ). Mỗi bài có ít nhất
   một khối `examples` (6–10 câu) để người học nghe và đọc theo.
4. **Bài tập**: mỗi bài **8–10 bài tập**, trộn ít nhất 3 dạng, xếp từ dễ đến khó. Bài phát âm dùng nhiều `listen`
   và `sounds`; bài ngữ pháp dùng `gap`, `order`, `mcq`.
   - `gap`: đúng **một** `___`; `answers` liệt kê mọi đáp án hợp lệ (ví dụ cả dạng viết tắt nếu chấp nhận được).
     Nên có `choices` (2–4 lựa chọn, gồm đáp án đúng) ở các bài đầu; bài khó hơn để người học tự gõ.
   - `order`: câu 3–12 từ và **chỉ có MỘT cách sắp xếp đúng** (tránh trạng từ có thể đứng nhiều chỗ). Hệ thống so khớp
     không phân biệt hoa/thường và dấu câu.
   - `listen`: đưa cặp/nhóm từ dễ nhầm (ship/sheep, cat/cut); TTS đọc `say`. Chỉ dùng khi phân biệt được bằng tai.
   - `match`: 3–6 cặp, không trùng vế.
   - `explain` (một câu ngắn) ở các câu dễ sai.
   - Đáp án đúng **không** luôn ở vị trí đầu; `answer` là chỉ số (từ 0) trong `choices`.
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
