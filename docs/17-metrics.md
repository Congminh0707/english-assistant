# 17 — Bảng số liệu (nguồn duy nhất cho các con số)

Mọi con số có thể thay đổi theo thời gian (số từ, số bài, dung lượng pack, số test…) **ghi ở đây**; các tài liệu khác chỉ nêu số liệu **lịch sử** (kèm ngày) hoặc trỏ về trang này. Số liệu **đo bằng lệnh**, không ước lượng bằng tay.

## Cách cập nhật (bắt buộc)

Chạy lại và sửa bảng bên dưới **mỗi khi**: build content pack mới, thêm/xoá nội dung trong `content/curated/`, thêm kênh IPC/migration/nhân vật/vật phẩm, đổi phiên bản, hoặc trước mỗi lần phát hành.

```bash
pnpm content:stats     # từ điển: số từ, nghĩa Việt, câu, dạng từ, từ nhạy cảm, nghĩa AI sinh (đọc pack mới nhất trong content/packs)
pnpm stats             # app: phiên bản, bài học/đọc/nghe/ngữ pháp…, nhân vật, vật phẩm, kênh IPC, migration
pnpm lint && pnpm test # số file/số test ở cuối kết quả
pnpm content:validate --release   # kiểm tra nghĩa AI sinh đã `approved` (in số từ AI sinh)
```

Sau khi sửa bảng, cập nhật cột **Đo ngày** và (nếu đổi) nhắc lại trong mục tương ứng của [09 §10.3](09-content-pipeline.md) / [14](14-roadmap.md).

## 1. App

| Hạng mục                                       | Giá trị                                                                                     | Đo bằng      | Đo ngày    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------ | ---------- |
| Phiên bản app                                  | 2.2.0                                                                                       | `pnpm stats` | 2026-11-09 |
| Test (Vitest)                                  | 554 test / 60 file                                                                          | `pnpm test`  | 2026-11-10 |
| Kênh IPC                                       | 107 invoke · 4 send · 13 event                                                              | `pnpm stats` | 2026-11-09 |
| Migration DB (Drizzle)                         | 9 (`0000`–`0008`)                                                                           | `pnpm stats` | 2026-11-05 |
| Nhân vật thú cưng                              | 5 (Bi, Lupo, Draco, Robo, Kitsu)                                                           | `pnpm stats` | 2026-10-22 |
| Dáng vector mỗi nhân vật | 19 dáng × 4 giai đoạn vẽ riêng + trứng = 77 hình mỗi con (mascot v4, xem 05)                | `pnpm stats` | 2026-11-10 |
| Vật phẩm cửa hàng                              | 46 = 17 đồ ăn + 25 phụ kiện (5 vị trí, vẽ riêng cho từng con) + 4 nhân vật                  | `pnpm stats` | 2026-11-09 |

## 2. Nội dung tự soạn (`content/curated/`)

| Hạng mục               | Số lượng                                         | Ghi chú                                                                          | Đo ngày    |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- | ---------- |
| Bài học nền tảng       | 58 bài / 9 chương / 645 bài tập                  | chữ cái–phát âm, mẫu câu, các thì, cấu trúc, giao tiếp, hình minh hoạ, luyện nói | 2026-11-10 |
| Điểm ngữ pháp          | 56                                               |                                                                                  | 2026-11-05 |
| Bài đọc                | 74                                               |                                                                                  | 2026-11-05 |
| Bài nghe               | 46                                               | đọc bằng TTS; có gói audio MP3 tạo sẵn tải thêm                                  | 2026-11-05 |
| Sổ mẫu câu             | 108 mẫu câu                                      |                                                                                  | 2026-10-22 |
| Câu kiểm tra đầu vào   | 60                                               |                                                                                  | 2026-10-22 |
| Hoạt động trẻ em       | 25                                               |                                                                                  | 2026-10-22 |
| Bản đồ thế giới của bé | 37 nơi / 337 từ / 21 công trình voxel            | tầng 1 VN 12×10, 6 nước 6×7, 9 kỳ quan 9×3, Làng của bé 7×16, Màu-số-hình 3×12 (docs/28); cả 37 nơi đã duyệt; 10 nơi `town`/`basics` được chủ dự án duyệt 2026-11-06 (`reviewed: true`) | 2026-11-05 |
| Hình từ (bé)           | 337 = pixel tự vẽ + Twemoji + thẻ ChatGPT                      | `ALL_PICTURE_IDS`                                                                | 2026-11-01 |
| Hình từ vector (bé)    | 189/189 (mọi hình từ), ưu tiên hơn pixel/Twemoji | `pnpm stats` (`src/renderer/shared/art/pictures/`)                               | 2026-11-01 |
| Khoá học               | 5 khoá / 22 unit                                 |                                                                                  | 2026-11-05 |
| Video (YouTube nhúng) | 12 video / 12 câu hỏi (mỗi video 1 câu ở cuối)   | `content/curated/videos/`; 8 video VOA đầy đủ, 4 đoạn podcast VOA; chỉ nhúng, không tải | 2026-11-05 |
| Ngân hàng TOEIC        | 267 câu / 7 Part (12·45·45·36·45·24·60)          | `content/curated/toeic/`; đủ mini + full; AI sinh + AI tự duyệt, đo bằng `ToeicBank.info()` | 2026-11-05 |

Tất cả do AI soạn, **chưa có giáo viên người thật duyệt** ([08](08-content-sources.md)).

## 3. Từ điển (`core-dictionary` 1.7.0 — `pnpm content:stats`, đo 2026-11-06)

| Hạng mục                               | Số lượng                                                                                                                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File `.eapack` / `content.db` giải nén | 29,1 MB / 155,0 MB                                                                                                                                                                                                                                                                                |
| Mục từ (`words`)                       | **43.434**                                                                                                                                                                                                                                                                                        |
| — trong top 10k (`freq_rank ≤ 10.000`) | 10.000, 9.999 có nghĩa Việt (1 từ chưa có)                                                                                                                                                                                                                                                               |
| — ngoài top 10k                        | 33.434: 32.459 có nghĩa Việt, **975 chưa có nghĩa Việt**                                                                                                                                                                                                                                        |
| Từ có nghĩa Việt (`vi_short`)          | 42.458 (97,8 %)                                                                                                                                                                                                                                                                                     |
| Từ có IPA Mỹ                           | 36.926                                                                                                                                                                                                                                                                                            |
| Từ dùng nghĩa Việt **AI sinh**         | 31.262 (5.536 trong top 10k), tất cả `approved` (`validate --release` đạt). File curated `vi-generated.json` có 32.933 mục: 31.925 `approved`, 0 `draft`, 1.008 `rejected` (đo 2026-11-06; 31.925 `approved` gồm 3.240 mục `replace` của vi-recheck); đã sinh đủ, 0 từ chưa sinh. Pack 1.7.0 đã build lại sau khi duyệt hết (2026-11-06). Người duyệt (`review.by`): `gpt-6` 29.912 mục (AI), `Minh` 2.864, `claude-cli-review` 123, `claude-cli (user-delegated)` 34; chủ dự án xác nhận đã approve toàn bộ (2026-11-06) |
| Từ gắn cờ nhạy cảm (`sensitive`)       | 562 (106 liệt kê tay trong `sensitive-words.json` + tự gắn cho từ mới có nhãn tục/xúc phạm)                                                                                                                                                                                                       |
| Dạng từ (`word_forms`)                 | 78.334                                                                                                                                                                                                                                                                                            |
| Câu (`sentences`) / có bản dịch Việt   | 77.446 / 19.594                                                                                                                                                                                                                                                                                   |
| `sentence_words`                       | 368.213                                                                                                                                                                                                                                                                                           |
| Decks                                  | 12                                                                                                                                                                                                                                                                                                |

Các bản trước (1.0.0 → 1.2.0) ghi ở [09 §10.3](09-content-pipeline.md) như lịch sử.

## 4. Model offline tải thêm (app hiển thị theo MiB; docs ghi MB thập phân kèm MiB)

| Model                      | Kích thước tải                                                      | Ghi chú                                                                                         |
| -------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| opus-mt en→vi / vi→en      | ~107 MB (102 MiB) mỗi chiều                                         | dịch nhanh, chất lượng trung bình                                                               |
| NLLB-200 (chất lượng cao)  | ~870 MB (831 MiB), dùng cả hai chiều; CC-BY-NC                      | `translate.highQuality`                                                                         |
| Whisper base.en            | ~80 MB                                                              | chấm nói                                                                                        |
| wav2vec2 phoneme int8      | ~355 MB                                                             | chấm âm vị, tuỳ chọn                                                                            |
| Gói audio bài nghe         | 264,4 MB (11 888 đoạn: bài nghe Anh + Mỹ gồm B2–C2, 972 từ/câu trẻ em × 4 tốc độ, bài học + ngữ pháp + bài đọc + cụm từ + TOEIC Part 1–4 + kiểm tra nghe, 12 bản thu thật) | release `listening-audio-1.6.0` (đo 2026-11-10)                                                 |
| Gói bản đồ bé `kids-world` | 📋 chưa build — đo khi build ([19 §6](19-kids-world.md))            | mục tiêu ≤ 50 MB                                                                                |
| Bản đồ bé: fps đo trong app thật (2026-11-01, 1600×900, máy dev, hồ sơ trẻ em mới) | 2D cao 56, 2D thấp 56, 3D cao 56, 3D thấp 56, quả cầu cao 56 | đếm `requestAnimationFrame` trong 5 giây; chưa đo trên máy yếu thật. Tự hạ khi dưới 24 fps ([19](19-kids-world.md)) |
| Gói sprite thú cưng 288px  | đã bỏ 2026-11-01 (decisions #45); bộ cài không còn sprite pixel, thú cưng vector `art/pets` 5 file = 5.399 KB (mascot v4: bi 837, kitsu 1.853, draco 1.145, robo 580, lupo 984) | `pnpm mascot` | 2026-11-10 |

> Các kích thước model lấy từ `modelFiles.ts` / manifest; đổi model → đo lại và sửa bảng.
