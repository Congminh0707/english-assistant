# 30 — Rà soát sản phẩm 2026-11-10: giữ / bỏ / phát triển thêm

Bản rà soát toàn app (tính năng, bài học, chất lượng nội dung) do AI thực hiện ngày 2026-11-10, dựa trên docs 00/01/07/11/14/17, mẫu nội dung trong `content/curated/` và cây `src/renderer/study` + `src/main/services`. Dùng làm **danh sách theo dõi**: mỗi mục có ô checklist, xong thì đánh `[x]` kèm ngày. Số liệu trích từ [17](17-metrics.md) tại ngày đo; không cập nhật số ở đây.

## 1. Kết luận chung

- App đã rất **rộng** so với một dev part-time: 107 kênh IPC, 38 service, 553 test, nội dung PA1 → C2, TOEIC 7 Part, thế giới 3D cho bé, 5 mascot vẽ tay, 4 engine dịch.
- Điểm mạnh: vòng lặp cốt lõi (popup dịch → lưu từ → SRS → mascot hỏi) và nền tảng kỹ thuật sạch.
- Điểm yếu: **độ rộng vượt độ sâu**. Nhiều mục còn ghi "chưa thử tay"; 100 % nội dung do AI soạn, chưa có giáo viên duyệt; phần lớn công sức gần đây đổ vào art/3D thay vì vào việc người học cần.
- Tính năng P0 duy nhất chưa làm: **Lộ trình hằng ngày** (C13, [01](01-features.md)).

## 2. GIỮ (lõi, đang chạy tốt)

| Hạng mục | Lý do giữ |
|---|---|
| Mascot + micro-learning (D1, D2, chế độ yên lặng, quiz tự đóng 30 s) | Định vị sản phẩm; chưa app nào khác có |
| Popup dịch + từ điển offline + lưu từ kèm câu ngữ cảnh | Đã thử tay OK, < 1 s |
| SRS FSRS 4 hướng thẻ, ẩn từ vừa ôn, hoàn tác, trắc nghiệm nghĩa | Hoàn thiện hơn Anki mặc định |
| Bài học nền tảng (58 bài) | Nội dung giá trị nhất, nhắm đúng A1–B1 là đa số người dùng; mẫu `tenses.present-simple` chuẩn |
| Đọc, Nghe, Ngữ pháp, Phrasebook | Mẫu kiểm tra ổn (`gramc1.conditional-inversion` đúng, bản dịch Việt tự nhiên) |
| Trẻ em: bản đồ 2D + lượt 5 bước + mini-game + khu phụ huynh | Chủ dự án đã thử tay OK |
| Gói audio tạo sẵn | Hoàn thành việc đang làm ở [14](14-roadmap.md) |
| Ngân hàng TOEIC 267 câu | Đúng format, giải thích Việt ngắn gọn |

## 3. BỎ hoặc ĐÓNG BĂNG

- [ ] **Bản đồ 3D three.js** (`src/renderer/study/kids/game/*.ts` + `landmarks3d/`, ≈ 7.700 dòng, 8 vòng chỉnh trong một ngày). Góp ý vòng 2: "3D xấu hơn 2D"; fps máy yếu chưa đo; gói `kids-world` chưa build. Bé 4–6 tuổi không cần 3D. **Việc:** giấu nút 3D/2D trên HUD sau một cài đặt nâng cao, ngừng đầu tư; giữ code.
- [ ] **wav2vec2 chấm âm vị (355 MB).** Thử: think → nghe thành /f/; ngưỡng chưa hiệu chỉnh với giọng Việt. Whisper chấm theo từ đủ dùng. **Việc:** bỏ mục tải trong Cài đặt, giữ `PronunciationService`.
- [ ] **NLLB-200 (870 MB).** CC-BY-NC chặn thương mại, 3,7 GB RAM khi nạp, ~4 s một đoạn. opus-mt + Google/Azure/Claude BYOK đã đủ. **Việc:** bỏ tuỳ chọn `translate.highQuality`, ghi vào [decisions.md](decisions.md).
- [ ] **Module Video.** 12 video, mỗi video 1 câu hỏi cuối; quá mỏng để là một địa điểm riêng. **Việc:** gộp vào trang Nghe hoặc ẩn tới khi ≥ 40 video có checkpoint giữa bài.
- [ ] **IELTS (C11), đồng bộ Laravel (F5), Content Studio.** Chưa có pipeline LLM thì IELTS Writing/Speaking không chấm được. Để roadmap, không bắt đầu.
- [ ] **Vòng vẽ lại mascot.** v3 (2026-11-09) → v4 (2026-11-10). Chốt v4, chỉ sửa bug.
- [ ] **Mở rộng tầng/nơi cho bé.** 37 nơi / 337 từ đã vượt DoD "4 tuần không hết từ". Dừng thêm nơi.

## 4. RỦI RO nội dung (ưu tiên xử lý)

- [ ] **Chưa có giáo viên người thật duyệt.** TOEIC và track B2–C2 là "AI sinh, AI tự duyệt". Một đáp án TOEIC sai làm mất uy tín cả ngân hàng. **Việc:** nhờ một giáo viên rà **mẫu 10 %**, ưu tiên TOEIC Part 5–7 và bài học A1–A2; gắn `reviewedBy` người thật; hiện nhãn "AI soạn" ở giao diện cho phần chưa duyệt.
- [ ] **Gắn level lệch.** Unit `readb1` ([readings/10-b1.json](../content/curated/readings/10-b1.json)) có bài `A2_2`. **Việc:** `pnpm content:validate` kiểm tra level bài nằm trong dải của unit.
- [ ] **Câu hỏi đọc hiểu nông.** Phần lớn là `mcq` 3 lựa chọn + `tf` hỏi chi tiết bề mặt. B1+ cần `true_false_ng` chuẩn, `matching_headings`, suy luận, từ trong ngữ cảnh (đã thiết kế ở [07 §2](07-learning-modules.md), chưa làm).
- [ ] **Cờ `ng: true` đi cùng `answer: "false"`** (vd `readc2.in-praise-of-boredom`). Người soạn dễ nhầm NG với False. **Việc:** quy ước `ng: true` chỉ đi với `answer: "ng"`, hoặc đổi tên cờ thành `allowNg`; thêm kiểm tra vào `content:validate`.
- [ ] **Nợ "chưa thử tay".** Speaking/Whisper, phụ kiện, placement, phrasebook, mini-game, nhiều màn trẻ em. **Việc:** trước bản 2.3, một phiên QA tay theo checklist, không thêm tính năng.

## 5. PHÁT TRIỂN THÊM (theo đòn bẩy, làm từ trên xuống)

1. [ ] **Lộ trình hằng ngày (C13, P0).** Chưa có `DailyPlanService`; người lớn mở cửa sổ Học tập thấy thống kê, không thấy "hôm nay làm gì". Gộp: ôn đến hạn → bài tiếp trong khoá → một bài của kỹ năng yếu nhất (Elo đã có trong `ProgressService`). Thiết kế ở [07 §13](07-learning-modules.md).
2. [ ] **Từ mới của bài đọc tự vào SRS** (ghi "còn" từ Phase 2). Rẻ, nối Đọc với Ôn.
3. [ ] **LLM BYOK tổng quát (F4) + `grammar_explain` trong popup (B8).** Đã có `SecretStore` và `CloudTranslator`; cần thêm provider chung + một prompt. Đúng persona "Minh đi làm" đọc tài liệu.
4. [ ] **Nhật ký tiếng Anh (G3) + dạng bài `translate_sentence`.** Writing hiện bằng 0. Nhật ký 3 câu mỗi tối qua LLM là cách rẻ nhất có Writing, hợp với mascot ("Hôm nay bạn làm gì?").
5. [ ] **Dạng bài đọc nâng cao cho B1+** (`true_false_ng`, `matching_headings`, điền tóm tắt) trên registry `exercises/lessonExercises.ts` đã có.
6. [ ] **TOEIC: ước lượng điểm + mini test tính giờ.** Ngân hàng đủ, thiếu lớp "thi thử" để người học thấy tiến bộ.
7. [ ] **Phân tầng tuổi cho ABC và lượt 5 bước** (mini-game đã có `kids.ageBand`, phần còn lại chưa).

## 6. Số liệu lúc rà (2026-11-10, trích [17](17-metrics.md))

| Hạng mục | Giá trị |
|---|---|
| Nội dung AI soạn chưa người duyệt | 100 % bài học / đọc / nghe / ngữ pháp / TOEIC |
| Code 3D bé | ≈ 7.700 dòng (`kids/game/*.ts`, `landmarks3d/*.ts`) |
| Model tải thêm | opus-mt 107 + 107 MB, NLLB 870 MB, Whisper 80 MB, wav2vec2 355 MB, audio 145 MB |
| Tính năng P0 chưa làm | 1 (Lộ trình hằng ngày C13) |

## 7. Cách theo dõi

- Mỗi mục ở §3–§5 khi làm xong: đánh `[x]` kèm ngày và link commit/decisions. Mục bỏ hẳn: ghi lý do vào [decisions.md](decisions.md).
- Rà lại toàn bộ danh sách này trước mỗi bản phát hành lớn (2.3, 3.0) và sau khi có giáo viên duyệt nội dung lần đầu.
