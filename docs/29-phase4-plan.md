# 29 — Kế hoạch Phase 4: Luyện thi + Backend Laravel

> Trạng thái: **đã chốt phạm vi 2026-11-05**. Làm trước: bước 1 (TOEIC), 3 (Video), 4 (B2–C2). **Hoãn**: bước 2 (IELTS), 5 (Laravel), 6 (Đồng bộ) — giữ nguyên mô tả bên dưới làm tham khảo, chưa lên chi tiết. Nguồn: 6 hạng mục ở [14-roadmap.md](14-roadmap.md) mục "Phase 4". Thứ tự làm theo thứ tự trong roadmap (chủ dự án chốt).
> Đặc tả nghiệp vụ gốc: [07 §10, §12](07-learning-modules.md), [03 §7](03-architecture.md#7-backend-laravel-tuỳ-chọn-giai-đoạn-sau), [11 §8](11-ai-and-speech.md).

## 0. Điều kiện tiên quyết và rủi ro

- **Phase 3 chưa xong các mục AI**: "Cấu hình AI", "LLM: `writing_feedback`/`speaking_feedback`", "LanguageTool", dạng bài `write_free`/`speak_answer`. Chấm IELTS Writing/Speaking (bước 2) **phụ thuộc** các mục này. Cách xử lý: làm các mục Phase 3 đó như bước 2.0 (xem dưới), hoặc ra bước 2 phần Reading/Listening trước và để Writing/Speaking chờ.
- **Bản quyền**: không chép đề thật ETS/IDP/British Council/Cambridge. Chỉ mô phỏng format, tự soạn (AI sinh + người duyệt). Mỗi bản ghi có `source.license` ([08](08-content-sources.md)). Ảnh TOEIC Part 1 phải license mở hoặc tự vẽ.
- **Quy mô DoD** (≥ 5 đề mini + ngân hàng câu theo Part) cần lượng nội dung lớn; nội dung là nút thắt chính, không phải code.
- **Backend Laravel là dự án riêng** (PHP, repo/thư mục riêng, không nằm trong bundle Electron). Cần quyết định vị trí repo và hosting trước bước 5.

## 0.1 Quyết định của chủ dự án (2026-11-05)

- IELTS tạm bỏ qua. Laravel chưa làm ngay. Đồng bộ chưa lên chi tiết (chưa quyết có gồm hồ sơ trẻ em không).
- Nội dung TOEIC/IELTS: **tự sinh bằng AI, tự duyệt**, dùng model tuỳ ý (ghi model vào `source`, bản ghi chưa người duyệt để `draft`/`reviewed` theo quy ước pipeline [09](09-content-pipeline.md)).
- Vì IELTS hoãn nên không còn phụ thuộc vào các mục AI của Phase 3 trong phạm vi hiện tại.

## 1. Thứ tự và phụ thuộc

```
1 TOEIC ──► 2 IELTS ──► 3 Video ──► 4 B2–C2 ──► 5 Laravel ──► 6 Đồng bộ
  (khung "exam center" dùng chung)                  (pack store)   (cần auth từ 5)
```

Bước 1 dựng khung Exam Center dùng lại cho bước 2. Bước 5 trước bước 6 vì đồng bộ cần Sanctum. Bước 3 và 4 độc lập, đổi chỗ được.

## 2. Các bước

### Bước 1 — TOEIC (roadmap 304)

**Mục tiêu:** 7 Part, luyện theo Part, mini test (~30 phút), full test (2 giờ, 200 câu), ước lượng điểm.

1. Mô hình dữ liệu: bảng `exams` đã có trong kế hoạch ([10](10-data-model.md): exam, part, level, data JSON). Thêm bảng lượt làm bài `exam_attempts` (exam, mode, started_at, finished_at, raw_score, est_score). Migration mới, không sửa migration cũ; cập nhật docs/10.
2. Định dạng đề (zod, trong `src/shared/`): đề → nhóm câu (Part 3/4 nhóm 3 câu, Part 6/7 đoạn) → câu hỏi. Tái dùng dạng bài `listen_choice`, `mcq`.
3. Service `ExamService` (main, không import electron), kênh IPC `exam:*` theo quy trình AGENTS.md (channels → contract → handler → store).
4. Giao diện: Exam Center (vào từ một địa điểm trong `places.ts`), chọn Part / mini / full, đồng hồ, trang kết quả, bảng ước lượng điểm (ghi rõ là ước lượng; công thức từ số câu đúng Listening/Reading quy đổi bảng công khai, tự lập).
5. Nội dung: pipeline sinh bằng AI + duyệt ([09](09-content-pipeline.md)); validate bằng `pnpm content:validate`. Mốc tối thiểu cho DoD: ngân hàng câu mỗi Part, đủ ghép ≥ 5 đề mini.
6. Audio Part 1–4: TTS nhiều giọng, gói tải thêm theo mẫu `listening-audio`.

**Xong khi:** làm được 1 mini test trọn vẹn offline, có điểm ước lượng; `pnpm lint && pnpm test && pnpm ui:audit` pass.

### Bước 2 — IELTS (roadmap 305)

- 2.0 (nếu chưa làm): hoàn thành phần Phase 3 cần dùng: cấu hình AI (provider, key mã hoá, giới hạn chi phí), `writing_feedback`, `speaking_feedback`.
- Reading: 3 passage, dạng T/F/NG, matching headings, summary completion… (mở rộng dạng bài; mỗi dạng mới cần renderer + chấm).
- Listening: 4 section, audio TTS nhiều giọng.
- Writing Task 1/2: chấm AI theo band descriptors công khai (Task Response, Coherence, Lexical, Grammar) + LanguageTool.
- Speaking Part 1–3: ghi âm → STT (Whisper đã có) → chấm AI theo rubric (Fluency, Lexical, Grammar, Pronunciation).
- Tái dùng Exam Center và `exam_attempts` từ bước 1.

**Xong khi:** mỗi kỹ năng có ít nhất 1 đề chạy hết luồng; Writing/Speaking có feedback AI, không có AI thì vẫn làm bài và tự đối chiếu mẫu.

### Bước 3 — Video library (roadmap 306)

- Chỉ nhúng YouTube IFrame Player API, không tải video, không cào phụ đề ([07 §10](07-learning-modules.md), [11 §8](11-ai-and-speech.md)).
- Cần giải quyết trước: YouTube embed lỗi khi chạy từ `file://` → đăng ký custom protocol `app://`. Kiểm tra CSP và cấu hình bảo mật (`contextIsolation`, `sandbox` giữ nguyên).
- Dữ liệu: `library_items` (kind `video`): `videoId`, đoạn bắt đầu/kết thúc, level, câu hỏi theo mốc thời gian, từ vựng.
- Dạng bài `video_quiz`: video tự dừng ở checkpoint → hiện câu hỏi.
- Phụ đề chỉ khi có transcript hợp lệ (tự soạn/nguồn mở).
- Danh mục video do người làm nội dung chọn; ghi nguồn vào [08](08-content-sources.md) trước.

### Bước 4 — Track B2–C2 (roadmap 307)

- Nội dung thuần: bài học, đọc (báo chí, học thuật), nghe, ngữ pháp bậc cao theo [06](06-levels-and-progression.md) (B2_1 → C1 → C2).
- Dùng pipeline hiện có ([09](09-content-pipeline.md)); không cần cơ chế mới trừ khi thiếu dạng bài.
- Cập nhật số liệu bằng `pnpm stats` / `pnpm content:stats` và [17-metrics.md](17-metrics.md).

### Bước 5 — Backend Laravel (roadmap 308)

Dự án riêng. Gồm:

1. **Khởi tạo** repo Laravel + MySQL/PostgreSQL, CI, môi trường staging.
2. **API Sanctum**: đăng ký/đăng nhập, token cho app desktop. `/api/v1/packs` (danh sách, tải), `/api/v1/sync` (để bước 6).
3. **Content Studio (Filament)**: CRUD bài học/đề thi/video, gắn level, upload audio, quy trình duyệt (draft → reviewed → published), job sinh nội dung bằng AI, kiểm `source.license` bắt buộc.
4. **Xuất pack**: cùng định dạng content pack của [09](09-content-pipeline.md), ký/băm để app kiểm tra toàn vẹn.
5. **Phía app**: client tải pack (mở rộng `ContentPackService`/cơ chế gói tải thêm đã có), kiểm tra phiên bản, hỏi trước khi cập nhật.
6. Bảo mật: xem [16](16-privacy-and-security.md); không gửi clipboard/audio/API key lên server.

**Xong khi:** phát hành 1 pack mới từ Studio, app tải và dùng được mà không cần cập nhật bản cài (đúng DoD).

### Bước 6 — Đồng bộ tiến độ (roadmap 309)

- Tuỳ chọn, đăng nhập mới bật; app mặc định vẫn offline hoàn toàn.
- Last-write-wins theo `updated_at`; mỗi bản ghi người dùng cần `uuid`, `updated_at`, `deleted_at` ([03 §7](03-architecture.md)). **Việc cần kiểm tra đầu tiên**: schema `user.db` hiện tại đã có đủ 3 cột này chưa; thiếu thì cần migration.
- Việc cần quyết: bảng nào đồng bộ (tiến độ, SRS, XP, thú cưng, kho đồ…), xử lý hồ sơ trẻ em (dữ liệu trẻ em: đồng ý của phụ huynh, tối thiểu hoá dữ liệu).
- Test: xung đột hai thiết bị, xoá mềm, offline rồi online lại.

## 3. Quy trình cho mỗi bước

1. Ghi dòng `🚧 Đang làm: <việc> — bước tiếp theo: <...>` vào Nhật ký tiến độ của [14-roadmap.md](14-roadmap.md).
2. Làm theo chuỗi: schema → migration → docs/10 → kênh IPC → service → store → UI → nội dung.
3. Sau mỗi bước nhỏ: cập nhật docs ngay; chạy `pnpm lint && pnpm test`, và `pnpm ui:audit` nếu đụng giao diện.
4. Đổi số liệu → `pnpm stats` / `pnpm content:stats`, sửa [17-metrics.md](17-metrics.md).
5. Quyết định kỹ thuật lớn (custom protocol `app://`, thư viện mới, cấu trúc backend) → [decisions.md](decisions.md) và [02-tech-stack.md](02-tech-stack.md).

## 4. Câu hỏi còn mở (để dành cho các bước hoãn)

- Repo và hosting của backend Laravel (bước 5).
- Đồng bộ có gồm hồ sơ trẻ em không (bước 6).
