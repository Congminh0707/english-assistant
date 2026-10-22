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

| Hạng mục | Giá trị | Đo bằng | Đo ngày |
|---|---|---|---|
| Phiên bản app | 1.2.1 | `pnpm stats` | 2026-10-22 |
| Test (Vitest) | 358 test / 38 file | `pnpm test` | 2026-10-22 |
| Kênh IPC | 87 invoke · 4 send · 13 event | `pnpm stats` | 2026-10-22 |
| Migration DB (Drizzle) | 7 (`0000`–`0006`) | `pnpm stats` | 2026-10-22 |
| Nhân vật thú cưng | 5 (Bi, Webby, Draco, Robo, Kitsu) | `pnpm stats` | 2026-10-22 |
| Hoạt ảnh mỗi nhân vật (giai đoạn trưởng thành) | 25 (Bi, Webby, Draco: 20 chung + 3 `quirk_*` + 2 `click_*`) · 26 (Robo, Kitsu: 4 `quirk_*`) | `pnpm stats` | 2026-10-22 |
| Vật phẩm cửa hàng | 41 = 17 đồ ăn + 20 phụ kiện + 4 nhân vật bán bằng xu (Bi có sẵn) | `pnpm stats` | 2026-10-22 |

## 2. Nội dung tự soạn (`content/curated/`)

| Hạng mục | Số lượng | Ghi chú | Đo ngày |
|---|---|---|---|
| Bài học nền tảng | 43 bài / 7 chương / 423 bài tập | chữ cái–phát âm, mẫu câu, các thì, cấu trúc, giao tiếp, hình minh hoạ, luyện nói | 2026-10-22 |
| Điểm ngữ pháp | 40 | | 2026-10-22 |
| Bài đọc | 50 | | 2026-10-22 |
| Bài nghe | 30 | đọc bằng TTS; có gói audio MP3 tạo sẵn tải thêm | 2026-10-22 |
| Sổ mẫu câu | 108 mẫu câu | | 2026-10-22 |
| Câu kiểm tra đầu vào | 60 | | 2026-10-22 |
| Hoạt động trẻ em | 25 | | 2026-10-22 |
| Khoá học | 3 khoá / 14 unit | | 2026-10-22 |

Tất cả do AI soạn, **chưa có giáo viên người thật duyệt** ([08](08-content-sources.md)).

## 3. Từ điển (`core-dictionary` 1.3.0 — `pnpm content:stats`, đo 2026-10-22)

| Hạng mục | Số lượng |
|---|---|
| File `.eapack` / `content.db` giải nén | 26,3 MB / 140,3 MB |
| Mục từ (`words`) | **43.628** |
| — trong top 10k (`freq_rank ≤ 10.000`) | 10.000, **đủ 10.000 có nghĩa Việt** |
| — ngoài top 10k | 33.628: 6.766 có nghĩa Việt, **26.862 chưa có nghĩa Việt** |
| Từ có nghĩa Việt (`vi_short`) | 16.766 (38 %) |
| Từ có IPA Mỹ | 37.068 |
| Từ dùng nghĩa Việt **AI sinh** | 2.445 (2.419 trong top 10k); file curated có 3.030 mục, **tất cả `approved`** (`validate --release` đạt) |
| Từ gắn cờ nhạy cảm (`sensitive`) | 569 (106 liệt kê tay trong `sensitive-words.json` + tự gắn cho từ mới có nhãn tục/xúc phạm) |
| Dạng từ (`word_forms`) | 78.590 |
| Câu (`sentences`) / có bản dịch Việt | 77.511 / 19.594 |
| `sentence_words` | 368.555 |
| Decks | 12 |

Các bản trước (1.0.0 → 1.2.0) ghi ở [09 §10.3](09-content-pipeline.md) như lịch sử.

## 4. Model offline tải thêm (app hiển thị theo MiB; docs ghi MB thập phân kèm MiB)

| Model | Kích thước tải | Ghi chú |
|---|---|---|
| opus-mt en→vi / vi→en | ~107 MB (102 MiB) mỗi chiều | dịch nhanh, chất lượng trung bình |
| mBART-50 (chất lượng cao) | ~890 MB (848 MiB), dùng cả hai chiều | `translate.highQuality` |
| Whisper base.en | ~80 MB | chấm nói |
| wav2vec2 phoneme int8 | ~355 MB | chấm âm vị, tuỳ chọn |
| Gói audio bài nghe | 14,3 MB | release `listening-audio-1.0.0` |

> Các kích thước model lấy từ `modelFiles.ts` / manifest; đổi model → đo lại và sửa bảng.
