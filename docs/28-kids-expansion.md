# 28 — Mở rộng thẻ từ & chương trình học trẻ em (đề xuất 2026-11-05)

Yêu cầu của chủ dự án (2026-11-05): tạm dừng chỉnh giao diện, đẩy mạnh tính năng; trước hết **thêm nhiều từ vào bộ thẻ trẻ em** và **mở rộng chương trình học**. Tài liệu này là kế hoạch; chưa có thẻ/nội dung nào được thêm vào code.

## 1. Hiện trạng

- 189 thẻ (`src/renderer/shared/art/cards/*.svg`, ảnh ChatGPT Image nhúng WebP), mỗi từ tầng 1–3 đã có chủ: 12 nơi × 10 + 6 nước × 7 + 9 kỳ quan × 3 = 189 ([19](19-kids-world.md)).
- Một từ chỉ được là "từ mới" ở đúng một nơi, nên **thêm từ = thêm nơi** (hoặc thêm tầng), không nhét vào nơi sẵn có.
- Mọi hình mới đi theo quy trình [24](24-card-art-prompts.md): chủ dự án tạo batch trên ChatGPT Image, AI cắt bằng `cut-cards.py`. **AI không tự vẽ thẻ** (quyết định [#47](decisions.md)).

## 2. Đề xuất: thêm 112 thẻ trong 7 batch (14–20), 7 chủ điểm mới

Tất cả id chưa trùng 189 thẻ hiện có. Mỗi batch = lưới 4×4 = 16 thẻ = một chủ điểm = một "nơi" mới.

| Batch | Chủ điểm | 16 id (trái → phải, trên → dưới) |
| --- | --- | --- |
| 14 | Trường học | pen, ruler, eraser, notebook, crayon, paintbrush, glue, desk, blackboard, globe, map, paper, tape, calculator, school, lunchbox |
| 15 | Cơ thể | head, eye, ear, nose, mouth, hand, foot, leg, arm, hair, tooth, finger, face, tongue, knee, belly |
| 16 | Quần áo & đồ trong nhà | jacket, pants, skirt, boots, scarf, gloves, pajamas, raincoat, sofa, lamp, table, mirror, towel, soap, cup, bowl |
| 17 | Nghề nghiệp | doctor, teacher, farmer, chef, police, firefighter, nurse, driver, pilot, artist, singer, dancer, builder, astronaut, fisherman, postman |
| 18 | Phương tiện & nơi chốn | truck, taxi, ship, helicopter, ambulance, firetruck, tractor, road, hospital, park, shop, farm, beach, zoo, library, bridge |
| 19 | Động vật 2 | bat, squirrel, hedgehog, parrot, eagle, flamingo, seal, jellyfish, starfish, seahorse, ladybug, spider, worm, hippo, rhino, crocodile |
| 20 | Món ngon Việt & thế giới | dragonfruit, lychee, papaya, durian, pho, springroll, juice, water, pasta, sausage, lollipop, yogurt, peanut, pumpkin, cabbage, bean |

### 2.1 Mở rộng batch hiện có (yêu cầu 2026-11-05): màu sắc chưa phủ hết màu cơ bản

Hiện chỉ có 5 màu (red, blue, yellow, green, pink, batch 02). Thiếu hầu hết màu cơ bản. Thêm **batch 21 — Colors 2** (lưới 4×3 = 12), cùng kiểu "vũng sơn gouache" như batch 02:

| Batch | Chủ điểm | 12 id (trái → phải, trên → dưới) |
| --- | --- | --- |
| 21 | Màu sắc 2 | orangecolor, purple, brown, black, white, gray, gold, silver, lightblue, beige, turquoise, lime |

- Cộng với 5 màu cũ → **17 màu**, phủ: đỏ, cam, vàng, xanh lá, xanh dương, tím, hồng, nâu, đen, trắng, xám, vàng kim, bạc, xanh nhạt, be, xanh ngọc, xanh chanh.
- `orange` đã là id của quả cam, nên màu cam dùng id `orangecolor` (nhãn hiển thị "orange" / "màu cam").
- Lưu ý prompt: `white` và `black` cần viền mực nâu rõ để tách khỏi nền trong suốt; `gold`/`silver` chỉ dùng mảng gouache phẳng hai tông (không bóng kim loại, đúng luật "no glossy"); thêm "no container, no gem, no face" như batch 02.
- Nên đưa 12 màu mới vào một nơi chủ điểm "Màu sắc" (nơi `town`, xem §3) thay vì nhét vào Huế vì luật "từ mới duy nhất ở một nơi".

Tuỳ chọn cùng đợt (cùng kiểu vá chỗ thiếu của batch cũ):

| Batch | Chủ điểm | 12 id |
| --- | --- | --- |
| 22 | Số 2 | zero, eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty, hundred (số lớn + hình đồ vật đếm nhóm 5/10 thay chấm đếm, vì 11–20 chấm khó đếm) |
| 23 | Hình khối | circle, square, triangle, rectangle, oval, diamond, hexagon, cross, crescent, cube, sphere, cone |

Tổng đề xuất: 112 + 12 + 12 + 12 = **148 thẻ mới** (189 → 337).

Ghi chú soát:

- Cơ thể (batch 15) là **bộ phận trên người**: cần quy tắc mặt riêng (mắt, mũi, miệng vẽ **rời** như hình minh hoạ giải phẫu thân thiện, không gắn lên mặt giả). Mô tả mỗi hình ghi "isolated body part, friendly, non-scary, no gore". `face` vẽ khuôn mặt bé đầy đủ.
- Nghề nghiệp (batch 17): người → mặt đầy đủ theo [24](24-card-art-prompts.md); đa dạng giới tính/màu da; đồng phục đúng nghề.
- Batch 20: cần người Việt duyệt món (`pho`, `springroll`, `dragonfruit`…) giống tầng 1 ([19 §2.2](19-kids-world.md)).
- Có thể thêm batch 21+ (thiên nhiên: leaf, grass, rock, river, lake, forest, island, desert, rain, snow, wind, fog, tent, campfire, fireworks, rainbow2) khi 14–20 xong.

## 3. Chương trình học mở rộng

Thêm **tầng 1b "Làng của bé" (`town`)**, nằm giữa `vn` và `world` hoặc song song với `vn` (xem quyết định mở §5):

- 7 nơi mới ứng với batch 14–20, `wordsPerPlace: 16` → 112 từ (tầng `vn` 120 từ + `town` 112 = 232 từ, vượt `wordRange` 50–150 nên `town` cần `wordRange` riêng).
- Câu (bé nghe): khung `maxSentenceWords: 6`, thêm khung `I have`, `I like`, `this is my` để dùng cho cơ thể/đồ dùng/nghề (_I have two eyes. She is a doctor._).
- Tầng mở khi xong 75 % tầng `vn` (cùng luật tỷ lệ); `world` mở khi xong 75 % của tầng liền trước.
- Mỗi nơi cần: dữ liệu `places/tw-NN-*.json` (about vi/en, 16 `words` + câu), cảnh tầng 1 theo [26](26-scene-art-prompts.md) (ChatGPT Image nền trống + sprite), toạ độ trên bản đồ. Đây là phần tốn art nhất; có thể ra mắt trước bằng cảnh nền đơn giản.

Song song, các hoạt động ABC (`content/curated/kids/01…07`) và game (Phase 2b giai đoạn B) tự hưởng lợi vì dùng chung kho thẻ.

## 4. Thứ tự làm

1. [x] (2026-11-05, batch 14–23 đã tải về `Downloads\EnglishCard`) Chủ dự án tạo batch 14–20 trên ChatGPT Image (GLOBAL INSTRUCTIONS + mẫu ở [24](24-card-art-prompts.md); batch mới **không có ảnh 2 (thẻ cũ)**, bỏ mục IMAGE 2 và mô tả chủ thể bằng chữ).
2. [x] AI: điền `cards-batches.json` (batch 14–23), cắt 148 thẻ (7,6 MB `art/cards`, 337 file), preview đã xem. `cards.test.ts` đang đỏ (148 "id lạ") **cho tới khi xong bước 3**.
3. [x] (2026-11-05) AI: 148 id + nghĩa vi/en ở `src/shared/picturesKids2.ts` (nối vào `PICTURE_WORDS`/`ALL_PICTURE_IDS`/`pictureFor`; `orangecolor` đọc "orange", `pictureForWord('orange')` vẫn ra quả cam). `cards.test.ts` xanh, `pnpm test` 480 pass. **Còn thiếu: sinh âm thanh Kokoro cho từ mới** (`node scripts/audio/build-listening-audio.mjs`, nặng) — chưa chạy.
4. [x] (2026-11-05) Nội dung bài học: tầng `town` "Làng của bé" (7 nơi `tw-01…07` × 16 từ = 112) và tầng `basics` "Màu, số, hình" (3 nơi `bs-01…03` × 12 từ = 36: batch 21–23) trong `world.json`; đủ 148 thẻ mới. Mỗi từ có câu ≤ 6 từ (khung `have/like/he/she`). `reviewed: false` (chờ người Việt duyệt). `pnpm content:validate` + `pnpm test` (480) xanh. Thứ tự tầng (chủ dự án chốt 2026-11-05): **`town` → `basics` → `vn` → `world` → `earth`**. `town` mở sẵn; `basics` mở khi xong 75 % `town`; `vn` mở khi xong 75 % `basics`; `world` mở khi xong 75 % `vn` (như cũ). Câu của `town`/`basics` chỉ dùng từ khung (thêm `two`) + từ của chính tầng (`basics` thêm từ `town`), vì tầng thấp hơn không được dùng từ tầng cao. Hồ sơ cũ đã chơi `vn` sẽ thấy `vn` bị khoá lại tới khi xong `town` + `basics`. `scene: "town"`, `landmarks: false` (chưa có mô hình công trình; schema thêm cờ `landmarks`, validator bỏ qua kiểm công trình cho tầng đó). **Chưa làm (UI, theo yêu cầu 2026-11-05):** cảnh/bản đồ riêng của 10 nơi mới (đang rơi về `WorldMap` 2D chung theo `pos`), ảnh `about`, âm thanh Kokoro.
5. [ ] AI: cảnh/ bản đồ cho tầng mới; thử tay.
6. [ ] Cập nhật [17-metrics](17-metrics.md) (`pnpm stats`, `pnpm content:stats`), [14](14-roadmap.md), [10](10-data-model.md) nếu đổi schema (dự kiến không cần migration).

## 5. Quyết định cần chủ dự án chốt

1. Danh sách 7 chủ điểm / 112 từ ở §2 có ổn không (thêm, bỏ, đổi từ)?
2. Tầng `town` đặt **trước** `world` (bé học hết Việt Nam + Làng rồi mới ra nước ngoài) hay **song song** với `vn`?
3. Cảnh cho 7 nơi mới: làm đủ cảnh động như tầng 1, hay ra mắt trước bằng cảnh nền đơn giản?
