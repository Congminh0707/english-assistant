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
| Phiên bản app                                  | 1.6.0                                                                                       | `pnpm stats` | 2026-10-30 |
| Test (Vitest)                                  | 448 test / 49 file                                                                          | `pnpm test`  | 2026-11-01 |
| Kênh IPC                                       | 98 invoke · 4 send · 13 event                                                               | `pnpm stats` | 2026-11-01 |
| Migration DB (Drizzle)                         | 8 (`0000`–`0007`)                                                                           | `pnpm stats` | 2026-11-01 |
| Nhân vật thú cưng                              | 5 (Bi, Lupo, Draco, Robo, Kitsu)                                                           | `pnpm stats` | 2026-10-22 |
| Dáng vector mỗi nhân vật | 20 dáng vector mỗi con (19 trạng thái + trứng; xem 05)                                      | `pnpm stats` | 2026-11-01 |
| Vật phẩm cửa hàng                              | 41 = 17 đồ ăn + 20 phụ kiện + 4 nhân vật bán bằng xu (Bi có sẵn)                            | `pnpm stats` | 2026-10-22 |

## 2. Nội dung tự soạn (`content/curated/`)

| Hạng mục               | Số lượng                                         | Ghi chú                                                                          | Đo ngày    |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- | ---------- |
| Bài học nền tảng       | 43 bài / 7 chương / 423 bài tập                  | chữ cái–phát âm, mẫu câu, các thì, cấu trúc, giao tiếp, hình minh hoạ, luyện nói | 2026-10-22 |
| Điểm ngữ pháp          | 40                                               |                                                                                  | 2026-10-22 |
| Bài đọc                | 50                                               |                                                                                  | 2026-10-22 |
| Bài nghe               | 30                                               | đọc bằng TTS; có gói audio MP3 tạo sẵn tải thêm                                  | 2026-10-22 |
| Sổ mẫu câu             | 108 mẫu câu                                      |                                                                                  | 2026-10-22 |
| Câu kiểm tra đầu vào   | 60                                               |                                                                                  | 2026-10-22 |
| Hoạt động trẻ em       | 25                                               |                                                                                  | 2026-10-22 |
| Bản đồ thế giới của bé | 27 nơi / 189 từ / 21 công trình voxel            | tầng 1 VN 12×10, tầng 2 (6 nước) 6×7, tầng 3 (9 kỳ quan) 9×3; `reviewed: false` ở tầng 3 (docs/19) | 2026-11-01 |
| Hình từ (bé)           | 189 = pixel tự vẽ + Twemoji                      | `ALL_PICTURE_IDS`                                                                | 2026-11-01 |
| Hình từ vector (bé)    | 189/189 (mọi hình từ), ưu tiên hơn pixel/Twemoji | `pnpm stats` (`src/renderer/shared/art/pictures/`)                               | 2026-11-01 |
| Khoá học               | 3 khoá / 14 unit                                 |                                                                                  | 2026-10-22 |

Tất cả do AI soạn, **chưa có giáo viên người thật duyệt** ([08](08-content-sources.md)).

## 3. Từ điển (`core-dictionary` 1.6.0 — `pnpm content:stats`, đo 2026-10-25)

| Hạng mục                               | Số lượng                                                                                                                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File `.eapack` / `content.db` giải nén | 26,6 MB / 141,9 MB                                                                                                                                                                                                                                                                                |
| Mục từ (`words`)                       | **43.434**                                                                                                                                                                                                                                                                                        |
| — trong top 10k (`freq_rank ≤ 10.000`) | 10.000, **đủ 10.000 có nghĩa Việt**                                                                                                                                                                                                                                                               |
| — ngoài top 10k                        | 33.434: 8.625 có nghĩa Việt, **24.809 chưa có nghĩa Việt**                                                                                                                                                                                                                                        |
| Từ có nghĩa Việt (`vi_short`)          | 18.623 (43 %)                                                                                                                                                                                                                                                                                     |
| Từ có IPA Mỹ                           | 36.926                                                                                                                                                                                                                                                                                            |
| Từ dùng nghĩa Việt **AI sinh**         | 7.428 (5.536 trong top 10k), tất cả `approved` (`validate --release` đạt). File curated `vi-generated.json` có 32.933 mục: 8.015 `approved`, 24.795 `draft` (chưa duyệt, **không vào pack**), 123 `rejected` (8.015 `approved` gồm 3.240 mục `replace` của vi-recheck); đã sinh đủ, 0 từ chưa sinh (đo lại 2026-11-03). 1.877 mục duyệt bằng AI (`claude-cli-review`), không phải người |
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
| Gói audio bài nghe         | 22,3 MB (1050 đoạn, đủ giọng Anh + Mỹ cho mọi câu)                  | release `listening-audio-1.3.0`                                                                 |
| Gói bản đồ bé `kids-world` | 📋 chưa build — đo khi build ([19 §6](19-kids-world.md))            | mục tiêu ≤ 50 MB                                                                                |
| Bản đồ bé: fps đo trong app thật (2026-11-01, 1600×900, máy dev, hồ sơ trẻ em mới) | 2D cao 56, 2D thấp 56, 3D cao 56, 3D thấp 56, quả cầu cao 56 | đếm `requestAnimationFrame` trong 5 giây; chưa đo trên máy yếu thật. Tự hạ khi dưới 24 fps ([19](19-kids-world.md)) |
| Gói sprite thú cưng 288px  | đã bỏ 2026-11-01 (decisions #45); bộ cài không còn sprite pixel, thú cưng vector `art/pets` ≈ 260 KB | `pnpm stats` | 2026-11-01 |

> Các kích thước model lấy từ `modelFiles.ts` / manifest; đổi model → đo lại và sửa bảng.
