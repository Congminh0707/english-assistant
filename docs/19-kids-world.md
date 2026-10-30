# 19 — Bản đồ thế giới của bé (Phase 2b, giai đoạn A) — 🚧 đang làm (bước 1–4 xong, đang làm 4b; xem §8)

> Thiết kế chi tiết cho [14 — Phase 2b](14-roadmap.md#phase-2b--mở-rộng-từ-vựng-trẻ-em-đề-xuất-2026-10-29) giai đoạn A, [decisions #35](decisions.md) và [#36](decisions.md) (bản đồ 3D + gói tải thêm). Viết 2026-10-29, sửa lần 1 cùng ngày theo góp ý chủ dự án (mỗi nơi có công trình nổi bật, tăng số nơi, bản đồ 3D chi tiết, tài nguyên tải thêm). **Chờ duyệt.** Khi code xong từng phần, đổi 📋 → ✅ ở đây và ở [07 §9](07-learning-modules.md#9-phonics--mầm-non-p1), [10](10-data-model.md), [03](03-architecture.md), [15](15-packaging-and-release.md), [17](17-metrics.md).

## 1. Mục tiêu & phạm vi

- Bé học từ vựng bằng cách **đi qua một thế giới**: các tỉnh/thành Việt Nam → vài quốc gia → cả Trái Đất (cấp cao nhất). Thú cưng của bé đi trên bản đồ.
- Mỗi nơi có **công trình/cảnh nổi bật vẽ pixel** (Hội An: Chùa Cầu, TP.HCM: chợ Bến Thành…) và dạy một chủ điểm qua **lượt học 5 bước** (làm quen → chạm hình → chơi → nói theo → nghe câu).
- Bản đồ **3D chi tiết bằng three.js** (tham khảo cảm giác "thung lũng sống" của grandvalley.pages.dev — chỉ tham khảo phong cách, không lấy tài nguyên), tài nguyên 3D nằm trong **gói tải thêm**; chưa tải hoặc máy yếu → **bản đồ 2D** nhẹ.
- **Giai đoạn A làm đầy đủ tầng 1 (Việt Nam)**. Tầng 2–3 chỉ định nghĩa khung dữ liệu + luật mở khoá; nội dung soạn sau.
- Không đổi: FSRS ẩn với bé, không chấm khắt khe, lọc từ nhạy cảm, nội dung `proprietary-own`, PIN phụ huynh, giới hạn phút/ngày, quy tắc giao diện [18](18-ui-rules.md), cấu hình bảo mật Electron (CSP, sandbox).

## 2. Cấu trúc thế giới

| Tầng      | Nơi                                                      | Bậc ([06](06-levels-and-progression.md)) | Từ mới mỗi nơi | Câu (bé nghe, không phải đọc)             | Mở khoá                                                   |
| --------- | -------------------------------------------------------- | ---------------------------------------- | -------------- | ----------------------------------------- | --------------------------------------------------------- |
| 1 `vn`    | 12 tỉnh/thành Việt Nam (3 miền × 4)                      | PA1_1 (50–150 từ)                        | 10             | khung cố định ≤ 5 từ: _It's a cat._       | có sẵn, mọi nơi mở ngay                                   |
| 2 `world` | ✅ 6 quốc gia (decisions #38)                            | PA1_2                                    | 7              | ≤ 7 từ, thêm tính từ/số nhiều: _Two big…_ | xong **75 %** số nơi tầng 1 **và** ≥ 60 % từ tầng 1 ≥ mầm |
| 3 `earth` | ✅ Trái Đất: 3 vùng (thiên nhiên, băng & vũ trụ, đồ vật) | PA1_2 cao                                | 7              | câu hoàn chỉnh + ôn trộn mọi tầng         | xong 75 % số nơi tầng 2 + cùng điều kiện mầm              |

- **Luật mở tầng giữ nguyên** như đã chốt (6/8 nơi = 75 %, 60 % từ ≥ mầm), viết dạng tỉ lệ để số nơi tăng vẫn đúng: 12 nơi → cần 9 nơi.
- Mọi con số (12 nơi, 10 từ, 75 %, 60 %) là **tham số** trong `world.json` (§4), thêm nơi không cần sửa code.

### 2.1 "Cùng tầng thì ngang nhau" — đo được, không cảm tính

1. **Số từ**: mọi nơi trong tầng có đúng `wordsPerPlace` từ mới.
2. **Từ mới duy nhất**: mỗi từ là "từ mới" ở **đúng một nơi** trên toàn thế giới. Nơi khác chỉ được dùng lại từ của **tầng thấp hơn** (trong câu/ôn), không dùng từ của nơi cùng tầng — vì bé đi theo thứ tự bất kỳ.
3. **Câu**: mọi từ trong câu thuộc (từ của nơi đó) ∪ (từ tầng thấp hơn) ∪ (từ khung của tầng, vd `I, see, a, it's, this, is, my, the`); độ dài ≤ `maxSentenceWords`.
4. **Loại từ**: tầng 1 chỉ danh từ cụ thể + màu + số (vẽ được thành hình). Động từ/tính từ để giai đoạn C (dạy bằng hoạt ảnh mascot).

Cả 4 luật kiểm tra bằng test nội dung + `pnpm content:validate` (§4.3).

### 2.2 Phân bổ bài học tầng 1

- **12 nơi × 10 từ = 120 từ** — nằm trong khoảng PA1_1 (50–150) và phủ đủ các nhóm của PA1_1 ở [06](06-levels-and-progression.md): màu, số 1–10, con vật, gia đình, đồ chơi (+ đồ ăn, xe, quần áo, thời tiết).
- **Nhịp học**: 6 từ mới/ngày (`KIDS_NEW_PER_DAY`, chung mọi nơi) → ~20 ngày học từ mới + ôn → khớp DoD Phase 2b "≥ 4 tuần không hết từ mới" khi tính cả ngày nghỉ.
- **Gợi ý nơi kế tiếp** (không bắt buộc, bé vẫn chọn tự do): nơi "hôm nay nên tới" lấp lánh theo thứ tự gợi ý `suggestOrder` — chủ điểm gần gũi trước (gia đình, con vật, trái cây), trừu tượng hơn sau (số, màu, thời tiết). Cùng một độ khó nên thứ tự chỉ là gợi ý.
- **Vùng miền**: mỗi miền 4 nơi, chủ điểm trải đều để bé ở miền nào cũng có chủ điểm dễ gần.
- Thêm nơi về sau (vd Hải Phòng, Quy Nhơn, Vũng Tàu): giữ 10 từ/nơi; nếu tổng vượt 150 từ thì tách thành tầng 1b hoặc dời chủ điểm khó lên tầng 2 — `validateWorld` cảnh báo khi tổng từ của tầng vượt khoảng bậc.

| Miền  | Nơi       | Chủ điểm             | Công trình/cảnh nổi bật (vẽ pixel)     | Ví dụ từ (soạn đủ 10 khi làm nội dung)        |
| ----- | --------- | -------------------- | -------------------------------------- | --------------------------------------------- |
| Bắc   | Hà Nội    | Gia đình & ở nhà     | Tháp Rùa giữa Hồ Gươm, cầu Thê Húc đỏ  | mom, dad, baby, grandma, house, bed, door     |
| Bắc   | Hạ Long   | Biển                 | hòn Trống Mái, thuyền buồm trên vịnh   | boat, fish, crab, octopus, dolphin, whale     |
| Bắc   | Sa Pa     | Nông trại            | ruộng bậc thang, nhà sàn, đỉnh núi mây | horse, cow, pig, chicken, duck, goat          |
| Bắc   | Ninh Bình | Số đếm 1–10          | thuyền chèo qua hang núi đá Tràng An   | one … ten (đếm thuyền, đếm núi)               |
| Trung | Huế       | Màu sắc & hoa        | Ngọ Môn (Đại Nội), sông Hương          | red, blue, yellow, green, flower, rainbow     |
| Trung | Đà Nẵng   | Bầu trời & thời tiết | Cầu Rồng                               | sun, cloud, raindrop, moon, star, lightning   |
| Trung | Hội An    | Lễ hội & đồ chơi     | Chùa Cầu, phố đèn lồng                 | lantern, balloon, ball, drum, gift, kite      |
| Trung | Nha Trang | Quần áo đi biển      | tháp Trầm Hương, bãi biển              | hat, glasses, t-shirt, dress, shoe, socks     |
| Nam   | Đà Lạt    | Vườn rau             | ga Đà Lạt, hồ Xuân Hương, đồi thông    | strawberry, carrot, tomato, potato, mushroom  |
| Nam   | TP.HCM    | Phố & xe             | chợ Bến Thành                          | car, bus, bicycle, motorbike, train, airplane |
| Nam   | Cần Thơ   | Trái cây             | chợ nổi Cái Răng, bến Ninh Kiều        | banana, mango, watermelon, coconut, pineapple |
| Nam   | Phú Quốc  | Bữa ăn               | làng chài, thuyền thúng, bãi biển      | rice, noodles, bread, egg, soup, cake         |

- Hình từ: ưu tiên hình có sẵn (60 hình pixel + ~100 hình Twemoji trong `ALL_PICTURE_IDS`); **số hình còn thiếu do `validateWorld` liệt kê**, không ước bằng tay (biết trước: gia đình — emoji người dễ hiểu sai nên phải vẽ pixel; số 1–10; màu; vài vật như đèn lồng, xe máy, diều). Đo xong ghi [17](17-metrics.md).
- **Công trình**: tự vẽ, cách điệu (`proprietary-own`), không chép ảnh/tranh của người khác. Ưu tiên công trình công cộng, tránh điểm du lịch mang thương hiệu tư nhân. Nơi thờ tự (Chùa Cầu, tháp Chàm…) vẽ trang trọng, không biến thành trò đùa/nhân vật hoạt hình. Cần người Việt duyệt (`reviewed`).
- Tên nơi: đọc tiếng Anh bằng tên không dấu (_Ha Noi_), hiện kèm tên có dấu cho phụ huynh.

## 3. Trải nghiệm của bé

### 3.1 Màn hình & luồng

```
Trang chính (4 ô: Chơi / ABC / Sticker / Thú cưng)
  └─ Chơi → Bản đồ (3D nếu đã tải gói + máy đủ mạnh, ngược lại 2D)
        ├─ chạm một nơi → camera bay tới, thú cưng đi tới → Lượt chơi (5 bước, ~3–5 phút)
        │      └─ xong → rương thưởng (lần đầu xong nơi) → về bản đồ, cây mọc
        ├─ bình tưới (khi có từ đến hạn) → Ôn (KidsReview hiện có: nghe → chạm hình)
        └─ nút kính lúp −/+ → zoom ra tầng trên / vào tầng dưới (tầng đã mở)
```

- **ABC** (7 nhóm hoạt động chữ cái/âm/ghép vần/sight words/sách/tô chữ/nói) giữ nguyên ô riêng ở giai đoạn A; sau có thể thành nơi "Trường học" trên bản đồ (💡).
- **Sticker**: giữ nguyên — từ trả lời đúng lần đầu thì được dán; thêm trang sticker công trình (xong nơi → dán hình công trình).
- Hôm nay đã hết 6 từ mới: bé vẫn vào nơi được nhưng lượt chơi chỉ ôn từ đã gặp của nơi đó; mascot nói "Mai mình học thêm nhé!".

### 3.2 Lượt chơi tại một nơi (5 bước) — đã chốt

Mỗi lượt lấy một **đợt ≤ 4 từ** của nơi đó (chưa xong 5 bước, trong hạn mức từ mới hôm nay; thiếu thì lấy từ đã xong để ôn. Hết hạn mức hôm nay thì mọi nơi chỉ còn lượt ôn, kể cả nơi còn từ đã có thẻ nhưng chưa xong). Đi lần lượt cả đợt qua từng bước:

| Bước        | Bé làm gì                                                                   | Ghi nhận                                                                                                                 |
| ----------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1 Làm quen  | Hình to hiện ra, mascot đọc từ 2 lần; bé chạm hình để nghe lại              | tạo thẻ `pic:<id>` hướng `audio_picture` (nếu chưa có) — tính vào hạn mức từ mới                                         |
| 2 Chạm hình | Nghe từ → chạm 1 trong 3 hình (như thẻ hiện có)                             | **chấm FSRS một lần** cho mỗi từ qua `ratingFromTries` (kênh `kids:rate` hiện có)                                        |
| 3 Chơi      | Ghép cặp hình ↔ âm của cả đợt (lật thẻ đơn giản)                            | không chấm FSRS (tránh ôn nhiều lần/ngày làm lệch lịch); giai đoạn B thay bằng mini-game xoay vòng                       |
| 4 Nói theo  | Nghe → bé nói theo → chạm ngôi sao → vỗ tay (như hoạt động `speak` hiện có) | không chấm, **không ghi âm** (không cần quyền mic); nghe lại giọng mình để 💡 sau, theo [16](16-privacy-and-security.md) |
| 5 Nghe câu  | Nghe câu (_I see a crab._) → chạm hình của từ trong câu                     | không chấm FSRS; tính vào sao của lượt                                                                                   |

- Từ đã có thẻ từ trước (hồ sơ cũ) bỏ qua bước 1 — không mất tiến độ cũ.
- Bé thoát giữa chừng: thẻ đã tạo/chấm ở bước 1–2 giữ nguyên; từ chưa qua đủ 5 bước quay lại ở lượt sau. Không lưu vị trí bước giữa chừng.
- Sao của lượt: theo tỉ lệ đúng ngay ở bước 2 + 5 (`starsFor` hiện có).

### 3.3 Trạng thái của từ & của nơi

**Mức nhớ từ** (suy ra từ thẻ FSRS, không lưu thêm; hàm thuần `wordStage()` trong `src/shared/kidsWorld.ts`):

| Mức       | Điều kiện (tham số, chỉnh khi thử)              | Trên bản đồ                                     |
| --------- | ----------------------------------------------- | ----------------------------------------------- |
| `hidden`  | chưa có thẻ                                     | không hiện                                      |
| `seed`    | có thẻ, `state` mới/đang học                    | hạt giống                                       |
| `sprout`  | `state = review`, `stability < 21` ngày         | mầm                                             |
| `flower`  | `stability ≥ 21` ngày                           | hoa / vật thể (giai đoạn C: con vật đi lại)     |
| `thirsty` | đến hạn quá 1 ngày (cờ phụ, chồng lên mức trên) | hơi héo + giọt nước — không phạt, không mất mức |

**Trạng thái nơi**: `locked` (tầng chưa mở, mây che) · `open` · `done` (mọi từ mới của nơi đã qua đủ 5 bước) — nơi `done` có cờ, rương đã mở, công trình sáng đèn. Tiến độ nơi = số từ đã qua 5 bước / `wordsPerPlace`, hiện bằng hạt/mầm/hoa quanh công trình.

**Mở tầng**: hàm thuần `tierUnlocked(tier, placeStates, wordStages)` theo `unlock` của tầng (§4.1). Không bao giờ khoá lại tầng đã mở.

## 4. Nội dung (đi kèm app — nhẹ)

Nội dung chữ + hình từ vẫn **nằm trong bộ cài** (vài chục KB, cần cho bản đồ 2D và test). Chỉ tài nguyên 3D/âm thanh nền nằm trong gói tải thêm (§6).

### 4.1 Thư mục & file

```
content/curated/kids/world/
  world.json              # các tầng, tham số, luật mở khoá
  places/
    vn-hanoi.json         # một file mỗi nơi
    vn-hoian.json
    ...
```

`world.json`:

```jsonc
{
  "license": "proprietary-own",
  "tiers": [
    {
      "id": "vn",
      "order": 1,
      "title": "Viet Nam",
      "vi": "Việt Nam",
      "scene": "vn",
      "wordsPerPlace": 10,
      "maxSentenceWords": 5,
      "wordRange": [50, 150], // tổng từ tầng phải trong khoảng bậc PA1_1
      "frameWords": ["i", "see", "a", "an", "it's", "this", "is", "my", "the"],
      "unlock": null
    },
    {
      "id": "world",
      "order": 2,
      "title": "The World",
      "vi": "Các nước",
      "scene": "islands",
      "wordsPerPlace": 12,
      "maxSentenceWords": 7,
      "wordRange": [100, 350],
      "frameWords": ["..."],
      "unlock": { "tier": "vn", "placesDoneShare": 0.75, "sproutShare": 0.6 }
    }
  ]
}
```

`places/vn-hoian.json`:

```jsonc
{
  "license": "proprietary-own",
  "reviewed": false, // true khi người thật đã duyệt (từ, câu, địa danh, văn hoá, hình công trình)
  "place": {
    "id": "hoian",
    "tier": "vn",
    "region": "central",
    "order": 7,
    "suggestOrder": 5,
    "title": "Hoi An",
    "vi": "Hội An",
    "topic": "Festival and toys",
    "topicVi": "Lễ hội & đồ chơi",
    "landmark": "hoian-bridge", // id công trình: hình pixel 2D (bộ cài) + mô hình/sprite 3D (gói tải thêm)
    "landmarkVi": "Chùa Cầu",
    "pos": { "x": 58, "y": 52 }, // % trong cảnh 2D 16:9; cảnh 3D có toạ độ riêng trong gói
    "decor": ["lantern-street", "river"]
  },
  "words": [
    {
      "picture": "lantern",
      "sentence": { "en": "I see a lantern.", "vi": "Bé thấy một chiếc đèn lồng." }
    }
    // ... đúng wordsPerPlace mục
  ]
}
```

### 4.2 Nạp nội dung (main)

- `src/main/content/bundledLessons.ts`: thêm glob riêng `content/curated/kids/world/**/*.json` (glob `kids/*.json` hiện tại không đệ quy, giữ nguyên cho hoạt động ABC).
- Schema zod mới `src/shared/schemas/kidsWorld.ts`; lớp mới `src/main/content/KidsWorldLibrary.ts` (không mở rộng `KidsLibrary`): parse, bỏ file sai schema kèm cảnh báo, tra `place(id)`, `placesOfTier(tier)`, `placeOfWord(pictureId)`.
- Logic thuần (test ở Node): `src/shared/kidsWorld.ts` — `wordStage`, `placeProgress`, `tierUnlocked`, `pickVisitBatch`, `validateWorld`.
- Công trình: mô hình voxel trong `src/shared/voxels/landmarks/` (§5.2); hình 2D cho bản đồ 2D + sticker công trình được **chiếu tự động từ voxel** lúc build và đi kèm app.

### 4.3 Kiểm tra nội dung

`validateWorld()` chạy trong test nội dung và `pnpm content:validate`:

- `license` có ở mọi file; id nơi/tầng duy nhất; `place.tier` tồn tại; `pos` trong 0–100; `landmark` có mô hình voxel (và hình 2D đã chiếu).
- Mỗi `picture` có trong `ALL_PICTURE_IDS` (thiếu hình → liệt kê để vẽ); không thuộc `sensitive-words.json`.
- Luật "ngang nhau" §2.1 (đủ `wordsPerPlace`, từ mới duy nhất, từ trong câu hợp lệ, độ dài câu) + tổng từ tầng trong `wordRange`.
- `content:validate --release`: cảnh báo nơi `reviewed: false`.
- `pnpm stats` đếm thêm: số tầng, số nơi, số từ thế giới, số hình/công trình còn thiếu → [17](17-metrics.md).

## 5. Bản đồ

### 5.1 Hai chế độ hiển thị

| Chế độ | Khi nào                                                                                       | Công nghệ                                                    |
| ------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **3D** | đã tải gói `kids-world` + WebGL chạy được + máy đủ mạnh (đo fps lúc mở) + phụ huynh không tắt | three.js, nạp lười (dynamic import) chỉ khi mở bản đồ bé     |
| **2D** | chưa tải gói, không có WebGL, fps thấp, hoặc phụ huynh chọn "Bản đồ nhẹ"                      | SVG + hình pixel 2D (đi kèm app), animation CSS/rAF đơn giản |

Cả hai dùng chung dữ liệu (`kids:world`) và luồng (§3); bé không mất chức năng nào khi ở 2D. Tự hạ xuống 2D nếu fps trung bình < 24 trong 5 giây đầu (nhớ lựa chọn, phụ huynh bật lại được).

### 5.2 Bản đồ 3D (three.js)

**Phong cách**: mô hình thu nhỏ (diorama) sống động — địa hình cách điệu (đồi, sông, biển, ruộng), cây mọc dày (instancing), nước có sóng, mây trôi, thuyền/xe/người nhỏ di chuyển, ngày–đêm và thời tiết. Công trình mỗi nơi là điểm nhấn lớn, nhìn là nhận ra.

**Kiểu vẽ: VOXEL ("pixel 3D") — chủ dự án chốt 2026-10-29.** Công trình, nhà, cây, người, xe, thuyền dựng bằng khối lập phương (kiểu MagicaVoxel), xoay nhìn được mọi phía. Địa hình cũng là voxel (lưới độ cao) để cả cảnh cùng một phong cách; nước, mây, ánh sáng, bóng là hiệu ứng 3D thường. (Phương án sprite pixel "HD-2D" đã cân nhắc và không chọn — xem [decisions #36](decisions.md).)

**Dựng voxel — một nguồn, hai đầu ra** (để không phải vẽ hai lần):

- ✅ **Nguồn** (2026-10-30): mỗi mô hình là một file TypeScript thuần dữ liệu `src/shared/voxels/landmarks/<tên>.ts` (vd `hoianBridgePagoda.ts`), đăng ký ở `landmarks/index.ts` (`LANDMARKS`, `landmarkGrid`, `landmarkImage`); dựng bằng `src/shared/voxels/voxelGrid.ts` (`box`, `shell`, `cylinder`, `cylinderX`, `ellipsoid`, `hipRoof`, `gableRoof`, `mirrorX`, `fill`) và bảng màu chung `palette.ts` — giống cách `pixelGrid.ts` vẽ hình 2D; license `proprietary-own`, AI/dev vẽ bằng code, review bằng diff. Sau có thể nhập thêm file `.vox` của MagicaVoxel nếu có người vẽ tay (💡).
- ✅ **Chia mặt** (`src/shared/voxels/mesh.ts`, `meshVoxels`): greedy meshing → vị trí, pháp tuyến, màu theo đỉnh, chỉ số (không cần texture), thuần dữ liệu. Vì nguồn voxel nhỏ (vài nghìn khối) nên có thể chia mặt ngay lúc chạy trong renderer; gói `kids-world` chỉ cần chứa phần nặng (địa hình lớn, âm thanh) — chốt ở spike (§8 bước 5). Cây/người/xe lặp lại dùng `InstancedMesh`.
- ✅ **Chiếu 2D** (`src/shared/voxels/isometric.ts`, `isometric`/`isometricRects`): chiếu isometric lúc chạy (có cache theo id) ra ô pixel đã gộp như `pictures.ts` → bản đồ 2D và sticker công trình dùng **cùng một bản vẽ**, tự cập nhật khi sửa voxel; không cần bước build riêng.
- Kích thước mục tiêu: công trình ~32–64 khối mỗi chiều (đủ nhận ra Chùa Cầu, chợ Bến Thành…), vật nhỏ 8–16 khối.

**Camera & thao tác cho bé**: góc nhìn chéo từ trên mặc định; **kéo để xoay quanh** (giới hạn góc nghiêng, không lật ngược), kéo hai ngón/chuột phải để trượt, lăn chuột/kính lúp để zoom trong giới hạn; chạm nơi → camera bay mượt tới (~1,5 s) và xoay chậm quanh công trình. Nút "về chỗ cũ" khi bé lạc.

**Camera & thao tác cho bé**: góc nhìn chéo từ trên cố định; kéo để trượt bản đồ, lăn chuột/kính lúp để zoom trong giới hạn; chạm nơi → camera bay mượt tới (~1,5 s). Không có điều khiển tự do dễ lạc.

**Hiệu ứng**: thú cưng (sprite sheet hiện có, billboard) đi dọc đường tới nơi kế · mây che tầng khoá, tan khi mở + sao rơi · zoom tầng: tỉnh → các đảo quốc gia → quả địa cầu xoay · ngày–đêm theo giờ máy (đêm: đèn lồng Hội An sáng, đom đóm) · thời tiết nhẹ theo chủ điểm vừa học (mưa → cầu vồng) · cây mọc theo mức nhớ · chạm vật để nghe từ.

**Bản đồ**: tầng 1 vẽ **theo bản đồ Việt Nam thật, giản lược** (hình chữ S, có Hoàng Sa, Trường Sa; không vẽ nước láng giềng/biên giới — [decisions #37](decisions.md), thay cho "dải đất cách điệu" ban đầu); tầng 2 là các đảo nổi; tầng 3 là quả địa cầu cách điệu không có ranh giới quốc gia.

**Hiệu năng** (theo [03 §8](03-architecture.md#8-hiệu-năng--ngân-sách-tài-nguyên)):

- Render theo yêu cầu: chỉ vẽ khi có chuyển động; khi bé không thao tác thì hạ xuống ~20 fps cho cảnh nền, tối đa 60 fps khi camera di chuyển.
- Dừng hẳn vòng render khi cửa sổ ẩn/thu nhỏ (`visibilitychange`), giải phóng scene (geometry/texture `dispose()`) khi rời bản đồ.
- Mức chất lượng Thấp/Vừa/Cao (bóng, số cây, mật độ hạt mưa); tự chọn theo fps.
- Mục tiêu đo ở spike (§8 bước 5): RAM cửa sổ Học tập thêm ≤ 300 MB khi mở bản đồ 3D, GPU tích hợp đời cũ ≥ 30 fps ở mức Thấp.
- `prefers-reduced-motion` / "Giảm chuyển động": camera nhảy thẳng, tắt vật chạy nền.

**Bảo mật/CSP**: không đổi CSP của cửa sổ Học tập (`script-src 'self'`, `img-src 'self' data:`). three.js đóng gói cùng renderer (không CDN). Tài nguyên gói đọc ở main, gửi qua IPC dạng `ArrayBuffer` (như sprite 288px, [decisions #29](decisions.md)); renderer dựng texture bằng `DataTexture`/`CanvasTexture`, mô hình parse từ buffer — không cần `blob:`/protocol mới.

### 5.3 Bản đồ 2D (dự phòng, luôn có)

SVG 16:9 toạ độ % (§4.1 `pos`), hình công trình pixel 2D, đường đi `<path>`; thú cưng đi bằng `getPointAtLength` + rAF; mây che tầng khoá; ngày–đêm bằng lớp phủ màu; vài vật chạy CSS keyframes. Dừng khi ẩn, tôn trọng giảm chuyển động.

### 5.4 Chế độ game toàn màn hình — 🚧 đã code, chờ thử tay (chủ dự án yêu cầu 2026-10-30)

**Đã làm (2026-10-30)** — khác thiết kế gốc bên dưới ở mục 2 và 4 theo góp ý của chủ dự án:

- **Toàn màn hình**: kênh `study:fullscreen` (`boolean` → `boolean`, `src/main/ipc/study.ipc.ts`, chỉ nhận từ cửa sổ Học tập) gọi `BrowserWindow.setFullScreen`; `KidsGame.vue` bật khi mở, tắt khi thoát (nút Nhà / `Esc`). Không nới quyền `fullscreen` của trình duyệt. **Đổi code main → phải khởi động lại `pnpm dev`** mới có hiệu lực.
- **Bản đồ Việt Nam** (`src/shared/vnMap.ts`, decisions #37): các nơi theo `geo` thật, đường đi qua `via` bám đất liền (Sa Pa → Hà Nội theo thung lũng sông Hồng; Ninh Bình → Huế dọc dải miền Trung; Hội An → Nha Trang ven biển; Cần Thơ → Hà Tiên rồi đi thuyền ra Phú Quốc). Bố cục `geoLayout` (`src/shared/kidsWorldLayout.ts`): tách bệ không đè, ưu tiên trên đất, chấm đỏ = vị trí thật khi bệ bị dời; mỗi chặng `legs[i]` là các đoạn cong, đoạn biển có `sea`. Thứ tự đổi thành Sa Pa 1 → Hà Nội 2 → Hạ Long 3 → … → Phú Quốc 12.
- **Camera**: mặc định toàn cảnh (zoom 0,62), đi máy bay lùi thêm (0,5), tới nơi phóng to (1,25) rồi mới hiện thẻ "Bắt đầu"; kéo để trượt, lăn chuột để cuộn.
- **Đi lại bằng xe** (`TripVehicle.vue`, hai lớp kẹp thú cưng để trông như ngồi trong xe): **ô tô** trên đất (bánh quay, khói), **thuyền** khi đường ra biển (đường bộ dừng ở bờ + bến gỗ, thuyền lắc, bọt nước), **máy bay** khi quãng đường bộ > 1100 đơn vị (~4 độ vĩ — vd Ninh Bình → Huế): bay thẳng, cất/hạ cánh có nghiêng, bóng nhỏ dần theo độ cao, vệt mây. Mỗi xe đi **đều tốc độ riêng** (ô tô 420, thuyền 250, máy bay 950 đơn vị/giây; tăng/giảm tốc ở hai đầu; trần 9 s), không còn "gần thì chậm, xa thì nhanh". Tới nơi: nhảy mừng + pháo sáng.
- **Cảnh** (`game/scene.ts`, canvas 2D): biển có sóng + thuyền trôi, đất có cát/bọt sóng, núi tuyết Tây Bắc, cây theo miền (thông → cây tròn → dừa), sông, mây và chim (parallax), công trình voxel viền mực (`landmarkBitmap.ts`), cây từ trên bệ (hạt → mầm → hoa, khát nước có giọt xanh), cờ khi xong, sương + khoá khi chưa mở, lớp phủ chiều/tối. Vẽ ~30 khung/giây khi đứng yên, 60 khi chuyển động, dừng khi ẩn; giảm chuyển động → nhảy thẳng.
- **Âm thanh** tự tạo bằng WebAudio (`game/sfx.ts`, không có file/nguồn ngoài): chạm, mở, rương, đúng, còi xe, còi thuyền, máy bay, nước; tắt bằng nút loa (cài đặt `kids.gameSound`).
- **HUD** (`KidsGame.vue`): Nhà, Bản đồ, tổng sao + hoa, loa, bình tưới (số thẻ đến hạn), chọn tầng; `KidsVisit`/`KidsReview` hiện trong sân khấu; pháo giấy khi xong nơi lần đầu.
- Soi hình bản đồ không cần mở app: chưa có lệnh cố định (đã dùng script tạm trong phiên làm) — 💡 có thể thêm `pnpm kids:map-sheet` theo mẫu `pictures:sheet`.

**Thiết kế gốc (để đối chiếu):**

Bản 2D đầu tiên (bước 4) chạy được nhưng **chưa ra chất game**. Chủ dự án xem ảnh chụp và chốt: màn **Chơi** phải là một màn chơi game toàn màn hình, không phải khung nhỏ trong cửa sổ Học tập. Lỗi thấy trong ảnh chụp (2026-10-30):

- Bản đồ là khung ~1080×600 giữa cửa sổ, xung quanh trống; chữ hướng dẫn rất nhỏ.
- Các nơi **đè nhau** (Ninh Bình che Hà Nội; Huế/Đà Nẵng/Hội An/Đà Lạt chồng lên nhau), tên bị cắt ("Hà Nội · Gia đì", "Huế · Màu").
- Mây vẽ thành hai thanh trắng dẹt — trông như nút bị lỗi.
- Đất là một khối xanh chung chung, góc trái trống; ba nơi miền Nam xếp thành hàng ngang.
- 10 chấm nhỏ dưới mỗi nơi rối mắt; thú cưng đứng che tên nơi; nút chọn tầng/bình tưới trông như nút app.

**Thiết kế mới:**

1. **Toàn màn hình**: bấm ô Chơi → cửa sổ Học tập chuyển toàn màn hình (`BrowserWindow.setFullScreen` qua kênh IPC mới, chỉ khi bé bấm — không cướp focus khi không được yêu cầu); thoát bằng nút Nhà hoặc `Esc`, trả cửa sổ về kích thước cũ. Sân khấu game 16:9 co giãn vừa màn hình (letterbox màu trời), mọi toạ độ theo đơn vị sân khấu, không theo px cửa sổ.
2. **Bản đồ cuộn dọc kiểu "đường màn chơi"** (như Candy Crush/Duolingo): một dải đất cách điệu dài từ trên (Sa Pa) xuống dưới (Phú Quốc), uốn lượn ven biển — **vẫn không dựng hình dạng lãnh thổ/biên giới thật** (§5.2). Mỗi nơi cách nhau đủ xa (không đè), camera cuộn mượt theo thú cưng, kéo/lăn chuột để xem.
3. **Mỗi nơi là một ô màn chơi**: công trình đặt trên một đảo/bệ nhỏ, biển tên lớn (tên Anh to, tên Việt nhỏ). Thay 10 chấm bằng **3 sao + đếm hoa** (vd 🌸 4/10 bằng `UiIcon`). Nơi chưa mở: phủ sương mù + ổ khoá; mở khoá có hiệu ứng tan sương + sao rơi. Nơi gợi ý hôm nay có vòng sáng nhấp nháy.
4. **Chạm một nơi**: thú cưng đi **theo đường cong** tới đó, camera phóng to, hiện thẻ "Bắt đầu" (xem trước các hình sẽ học, nút Chơi to).
5. **Sinh động**: mây sprite thật trôi nhiều lớp (parallax), sóng biển, thuyền, chim bay, lá rơi; rương mở có pháo giấy; âm thanh chạm/đi/mở khoá/rương (nguồn CC0 phải ghi [08](08-content-sources.md) trước), có nút tắt tiếng; tôn trọng giảm chuyển động.
6. **HUD kiểu game**: nút Nhà góc trái, sao/xu giữa trên, bình tưới + chọn tầng là nút tròn lớn có viền dày; không dùng `.btn` kiểu app ở trong sân khấu (ngoại lệ ghi vào [18](18-ui-rules.md)).
7. **Lượt chơi 5 bước** (`KidsVisit`) cũng hiện trong sân khấu toàn màn hình, thẻ to.
8. **Công nghệ**: một `<canvas>` 2D cho cả cảnh (vòng rAF tự dừng khi ẩn/không chuyển động), HUD là Vue phủ lên trên. Công trình chiếu từ voxel ở **độ phân giải cao hơn** (ô 8–10 px mỗi khối thay vì 4 px) + viền tối + bóng đổ/AO, cache thành bitmap. Bản 3D three.js (§5.2) để sau, làm như bản nâng cấp của cùng sân khấu này.

### 5.5 Nâng chất lượng hình từ — ✅ xong cả 183 hình từ (2026-10-30)

Hình từ hiện có: ~84 hình pixel vẽ bằng code trên lưới 32×32 (`pictures.ts`, `picturesMore.ts`) + 99 hình Twemoji. Chủ dự án thấy hình pixel **chất lượng kém**; đang cân nhắc **tự vẽ bằng canvas**.

- Canvas tự nó không làm hình đẹp hơn — cái quyết định là **kiểu vẽ**. Hướng đề xuất: chuyển từ chấm điểm trên lưới sang **hình vector kiểu hoạt hình mũm mĩm** (khối tròn, tô màu chuyển, viền, điểm sáng) vẽ bằng `Path2D`, dùng **bộ "nét chung"** (mắt, má, bóng, viền, bảng màu) để mọi hình cùng một phong cách; xuất ra bitmap có cache như công trình.
- Mỗi lần vẽ: script xuất **bảng tổng hợp** (contact sheet) mọi hình ra PNG để soi và sửa — không vẽ mò.
- Thứ tự: 120 từ của bản đồ trước (gia đình, số, màu là dễ nhất), Twemoji giữ cho phần còn lại tới khi thay xong. License `proprietary-own`.
- Phương án dự phòng nếu tự vẽ không đạt: bộ có sẵn Fluent Emoji (Microsoft, MIT) hoặc Noto Emoji (Apache 2.0) — phải ghi [08](08-content-sources.md) trước khi dùng.
- ✅ **Phong cách duyệt (2026-10-30)** từ bản thử 10 hình (mom, baby, grandpa, cat, dog, apple, fish, three, lantern, motorbike).
- ✅ **Mã nguồn** `src/renderer/shared/art/`:
  - `kit.ts` — bộ nét chung trên khung 256×256: `shape` (tô màu chuyển + điểm sáng + viền mực `#3b2a3a`; màu phải dạng `#rrggbb`), `flat`, `tube`, `line`, `eye`, `happyEye`, `cheek`, `smile`, `face`, `shadow`, `ell`, `circle`, `rrect`, `star`, `P`.
  - `pictures/<nhóm>.ts` — mỗi file xuất `PICTURES: Record<id, Painter>` (id = id hình trong `ALL_PICTURE_IDS`); file mới tự được nạp (`import.meta.glob`). Quy ước: người/con vật/đồ ăn/vật trên trời có mặt cười; xe cộ, đồ dùng, quần áo không có mặt; chữ số = số to + đúng ngần ấy chấm đếm; màu = vệt sơn có mặt + cọ cùng màu.
  - `index.ts` — `vectorPictureUrl(id)` vẽ một lần ra PNG `data:` 384px, cache theo id. `PixelPicture.vue` **ưu tiên hình vector**, thiếu thì dùng PNG/Twemoji/pixel cũ như trước → mọi màn hình dùng thẻ hình (bé, bài tập chọn hình, album) đổi theo, không phải sửa từng chỗ.
  - `art.test.ts` — không trùng id, id có thật, mọi hình chạy không lỗi (canvas giả trong Node).
- ✅ **Soi hình**: `pnpm pictures:sheet [--file <nhóm>] [--ids a,b] --out x.png` — Node đóng gói trang (esbuild), Electron ẩn (userData tạm, không đụng dữ liệu app) vẽ và chụp bảng tổng hợp ở 184/64/40 px (`scripts/pictures/vector-sheet.mjs`, `vector-sheet-capture.cjs`).
- ✅ (2026-10-30) **Đủ 120 hình** cho 120 từ của bản đồ, 13 file: `trial` (10 hình đã duyệt), `family`, `numbers`, `sea`, `farm`, `colors`, `sky`, `festival`, `clothes`, `garden`, `fruit`, `city`, `meals` (vẽ song song bằng tác vụ con, mỗi nhóm soi bảng tổng hợp 2–3 lượt). Test `art.test.ts` bắt buộc mọi từ trên bản đồ có hình vector. ✅ Cùng ngày: vẽ lại bread, honey, milk, wave, shell và đũa của rice/noodles (chủ dự án thấy khó nhận ra; đũa không cắm dựng đứng vào cơm) + 63 hình còn lại (`critters`, `wild`, `food`, `things`, `nature`; lá cờ là cờ chung chung không thuộc nước nào, trái đất chỉ có mảng đất trừu tượng, không có đường biên) → **mọi hình từ đều là vector**; PNG/Twemoji/pixel cũ chỉ còn là dự phòng. Điểm nhỏ có thể chỉnh: tai heo hơi giống tai mèo ở 40 px; hoa hồng ở 40 px chỉ còn khối đỏ; má hồng hơi đục trên rau xanh.

## 6. Gói tải thêm `kids-world`

- **Nội dung gói**: địa hình/cảnh 3D từng tầng, mô hình hoặc sprite công trình độ chi tiết cao, vật trang trí, texture, âm thanh nền (chim, sóng, phố) — nguồn âm thanh phải có trong [08](08-content-sources.md) trước (vd Kenney CC0) hoặc tự tạo. Dung lượng: đo khi build, ghi [17](17-metrics.md); mục tiêu ≤ 50 MB.
- **Không nằm trong gói**: nội dung chữ, hình từ, hình công trình 2D (đi kèm app — bản đồ 2D luôn chạy).
- **Cơ chế**: theo mẫu gói sprite 288px — `src/shared/worldPack.ts` (id, manifest), `src/main/world/packSpec.ts` (size + sha256 bắt buộc), `WorldPackManager`/`WorldPackService`, release phụ `kids-world-<ver>` (pre-release) trên GitHub, quy trình build ghi vào [15](15-packaging-and-release.md).
- **Khi nào tải** (bé **không bao giờ** tự kích hoạt tải):
  1. **Lúc thiết lập trong app**: khi tạo hồ sơ trẻ em (màn hình chào lần đầu hoặc Cài đặt → thêm hồ sơ) có bước "Tải thế giới 3D cho bé (~N MB)" — Tải ngay / Để sau. Không tải trong bộ cài NSIS (giữ bộ cài nhẹ, tránh lỗi mạng khi cài).
  2. **Cài đặt → Tải thêm**: panel giống `SpritePackPanel` (tải, tiến độ, gỡ, phiên bản mới).
  3. **Khu vực phụ huynh** (sau PIN): nhắc "Bản đồ 3D chưa được tải" nếu hồ sơ trẻ em đang dùng bản 2D vì thiếu gói.
- Tải nền, tiếp tục được khi mất mạng; xong thì lần mở bản đồ kế tiếp tự dùng 3D.

## 7. Dữ liệu & IPC

### 7.1 DB — **không cần migration mới**

| Dữ liệu                 | Lưu ở đâu (đã có)                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Mức nhớ từ              | `srs_cards` (`content_id = 'pic:<id>'`, hướng `audio_picture`) — hồ sơ cũ giữ nguyên tiến độ                   |
| Từ đã qua đủ 5 bước     | `lesson_progress` với `lesson_id = 'kids.word.<pictureId>'` (`best` = điểm lượt, `completed_at`)               |
| Nơi đã xong + sao       | `lesson_progress` với `lesson_id = 'kids.place.<placeId>'`                                                     |
| Thưởng lần đầu xong nơi | `xp_events` lý do `kids.place`, `ref_id = placeId` (chống nhận lại, như `kids.activity`)                       |
| Nơi thú cưng đang đứng  | `settings` scope hồ sơ, khoá `kids.worldPlace` (mặc định: nơi `suggestOrder = 1`)                              |
| Chế độ bản đồ           | `settings` scope hồ sơ, khoá `kids.worldMode`: `auto` (mặc định) / `2d`; mức chất lượng 3D `kids.worldQuality` |

### 7.2 Kênh IPC (thêm vào `ipc-channels.ts` + `ipc-contract.ts`)

| Kênh              | Input (zod)                                                                                                                   | Output                                                                                                                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kids:world`      | `void`                                                                                                                        | `{ tiers: [{ id, title, vi, scene, unlocked, places: [{ id, title, vi, region, topic, topicVi, landmark, landmarkVi, pos, decor, state, stars, words: [{ pictureId, stage, thirsty }] }] }], currentPlaceId, todayPlaceId, newLeftToday, dueCount, packReady }` |
| `kids:visit`      | `{ placeId: string }`                                                                                                         | `{ placeId, batch: [{ pictureId, word, vi, cardId, isNew, sentence: { en, vi }, choices: string[] }], reviewOnly: boolean }` — đặt `kids.worldPlace`, tạo thẻ cho từ mới                                                                                        |
| `kids:visit-done` | `{ placeId, results: [{ pictureId, tapTries: 0\|1\|2, sentenceTries: 0\|1\|2, played: boolean, spoke: boolean }] }` (≤ 4 mục) | `{ stars, placeDone, firstTime, foodId: string \| null, tierUnlocked: string \| null, stages: [{ pictureId, stage }] }`                                                                                                                                         |
| `world:pack*`     | theo mẫu kênh gói sprite (trạng thái, tải, huỷ, gỡ, đọc file gói → `ArrayBuffer`)                                             | — đặt tên cụ thể khi code, ghi [03](03-architecture.md)                                                                                                                                                                                                         |

- ✅ (2026-10-30) Đã có 3 kênh `kids:world`, `kids:visit`, `kids:visit-done` (đặt tên kebab như `parent:set-pin`); schema ở `src/shared/schemas/kidsWorld.ts`, handler ở `src/main/ipc/app.ipc.ts`.
- Bước 2 chấm qua `kids:rate` hiện có → `kids:visit-done` **không** chấm FSRS lại. Từ được tính "đã qua 5 bước" khi chạm hình và nghe câu đều trả lời ra (`tapTries`, `sentenceTries` > 0), đã chơi và đã nói theo.
- ✅ (2026-10-30) `kids:next` (ôn bằng bình tưới): **thôi tự giới thiệu hình mới theo `KIDS_PICTURE_ORDER`** khi bản đồ có nội dung (`KidsService` dep `introduceInReview`; container tắt bản đồ bằng `kidsWorld: false` cho test cũ) — từ mới chỉ vào qua `kids:visit`; vẫn trả thẻ đến hạn như cũ. Hình không thuộc nơi nào chỉ còn trong album (khoá) tới khi được xếp vào một nơi.
- ✅ `kids:home`: thêm `{ worldPlacesDone, worldPlacesTotal }` cho ô Chơi.
- ✅ Handler: `KidsWorldService` (`src/main/services/KidsWorldService.ts`, không import `electron`) dùng `KidsWorldLibrary` (`src/main/content/`), `VocabRepository` (thêm `cardsByDirection`), `SrsService`, `LessonRepository`, `XpRepository`, `SettingsRepository` (scope `profile:<id>`), `XpService`, `KidsService` (`introducePicture`, `giveFood`), `Clock`. `starsFor` chuyển sang `src/shared/kids.ts` dùng chung.

### 7.3 Renderer

- ✅ (2026-10-30, bản 2D) `src/renderer/study/kids/KidsWorld.vue`: bản đồ 2D (dải đất + biển cách điệu, đường cong nối các nơi theo `order`, công trình `LandmarkPicture.vue` vẽ từ voxel lên canvas → ảnh `data:` có cache, hàng chấm mức nhớ từng từ, nơi gợi ý hôm nay nhún nhảy, thú cưng `PetSprite` đi tới nơi bằng CSS transition ~1,2 s, mây trôi, lớp phủ chiều/tối theo giờ máy, nút bình tưới có số thẻ đến hạn, nút chọn tầng; tôn trọng giảm chuyển động). `KidsVisit.vue`: lượt 5 bước (làm quen chỉ cho từ mới → chạm hình chấm `kids:rate` → lật thẻ ghép cặp → nói theo bấm sao → nghe câu chạm hình → `kids:visit-done`, màn hình sao + rương). Icon mới trong `UiIcon`: `next`, `water`, `gift`, `map`.
- 📋 Bản 3D: `world3d/` (scene, camera, địa hình, nước, cây instancing, công trình, thú cưng, thời tiết, ngày–đêm — nạp lười), `useWorldMotion.ts` (rAF theo đường cong, dừng khi ẩn); thú cưng ở bản 2D hiện đi đường thẳng, chưa đi theo đường cong.
- ✅ (2026-10-30) Thú cưng có **hoạt ảnh đi bộ** khi di chuyển trên bản đồ: `PetSprite` thêm prop `walking` (chạy khung `walk` 98–105, 12 fps, của sheet 96px hoặc gói 288px — `hires.ts` `hiresStrip(…, 'walk')` chỉ giải mã các hàng chứa hoạt ảnh) và `flip` (quay mặt sang trái theo hướng đi). `KidsWorld.vue` bật hai prop này khi đi; màn game toàn màn hình dùng lại được.
- ✅ `KidsApp.vue`: ô **Chơi** mở `KidsWorld` thay vì vào thẳng `KidsReview`; `KidsReview` mở từ bình tưới. → (2026-10-30) ô Chơi mở **`game/KidsGame.vue`** (toàn màn hình, §5.4) thay cho `KidsWorld`; `game/`: `KidsGame.vue`, `WorldMap.vue`, `TripVehicle.vue`, `scene.ts`, `landmarkBitmap.ts`, `sfx.ts`. Dữ liệu dùng chung: `src/shared/vnMap.ts`, `src/shared/kidsWorldLayout.ts` (+ test). Nội dung nơi thêm `geo`, `via`, `ferry` (schema `KidsPlaceSchema`).
- Chuỗi giao diện qua `vi.json`/`en.json`; class/token theo [18](18-ui-rules.md), chạy `pnpm ui:audit`.

## 8. Thứ tự làm (mỗi bước xong → cập nhật docs + `pnpm lint && pnpm test`)

1. ✅ (2026-10-30) Schema + `kidsWorld.ts` + `validateWorld` + test (dùng fixture): `src/shared/schemas/kidsWorld.ts`, `src/shared/kidsWorld.ts` (`wordStage`, `isThirsty`, `placeProgress`, `placeState`, `tierUnlocked`, `pickVisitBatch`, `validateWorld`, `missingPictures`), `src/shared/kidsWorld.test.ts` (22 test). Chưa nối vào main/IPC/giao diện.
2. ✅ (2026-10-30) Nội dung tầng 1: ✅ `content/curated/kids/world/world.json` (3 tầng) + 12 file `places/vn-XX-<nơi>.json` (120 từ, `reviewed: false`); ✅ 24 hình từ còn thiếu (`src/shared/picturesMore.ts`: gia đình, số 1–10, 5 màu, vỏ sò, diều, đèn lồng, xe máy); ✅ lõi voxel (`voxelGrid.ts`, `mesh.ts`, `isometric.ts`, `palette.ts`) + **12 công trình voxel** (`src/shared/voxels/landmarks/`, 4–12 nghìn khối mỗi cái; Hòn Trống Mái nhìn giống vòm hai cột hơn là "hai con gà" — có thể vẽ lại sau); ✅ test nội dung `src/main/content/kidsWorld.content.test.ts` + test voxel `src/shared/voxels/voxels.test.ts`.
3. ✅ (2026-10-30) `KidsWorldLibrary` + `KidsWorldService` + kênh `kids:world`/`kids:visit`/`kids:visit-done` + `kids:home` có tiến độ bản đồ + test service `src/main/services/KidsWorldService.test.ts` (7 test: bản đồ ban đầu, lượt chơi, hạn mức, xong nơi + rương một lần, mở tầng 2 khi đủ 9/12 nơi + mầm). Còn: đổi `kids:next` → làm cùng bước 4.
4. ✅ (2026-10-30) `KidsVisit.vue` (5 bước) + **bản đồ 2D** + ô Chơi mở bản đồ + `kids:next` thôi tự giới thiệu hình mới; lint/typecheck/`ui:audit` (0 lỗi; cảnh báo mã màu cứng như các màn hình bé khác)/429 test/`pnpm build` qua. **Chưa thử tay trong app thật** với hồ sơ trẻ em mới **và** hồ sơ cũ đã có thẻ — việc còn lại của bước này. Đến đây tính năng đã dùng được, không phụ thuộc 3D.
   4b. 🚧 (2026-10-30) **Chế độ game toàn màn hình** (§5.4): ✅ đã code đủ (kênh `study:fullscreen`, sân khấu canvas 16:9, bản đồ Việt Nam thật + đường bám đất liền, ô màn chơi + sao/hoa, đi ô tô/thuyền/máy bay, hiệu ứng + âm thanh WebAudio, HUD game, `KidsVisit` trong sân khấu); lint/typecheck/441 test/`ui:audit` qua. **Còn: thử tay trong app** (khởi động lại `pnpm dev`), duyệt hình bản đồ + vị trí (địa lý/chủ quyền). `KidsWorld.vue` + `LandmarkPicture.vue` (bản đồ 2D cũ) không còn được dùng — xoá khi chắc không cần.
5. 🚧 (2026-10-30) **Tầng 2–3 + spike 3D**: ✅ nội dung 9 nơi (`w-*.json`, `e-*.json`, 7 từ/nơi, hết 63 hình còn lại — decisions #38), ✅ 9 công trình voxel mới (`landmarks/japanFuji…earthWorkshopTower`, `scenery.ts`), ✅ `three` + `game/landmark3d.ts`/`Landmark3D.vue`: công trình xoay được trên thẻ nơi (kéo xoay, tự xoay chậm, dừng khi ẩn, fallback 2D khi không có WebGL); `pnpm landmarks:sheet` soi 12→21 công trình. ✅ **Bản đồ 3D tầng Việt Nam** (`vnHeightfield.ts` địa hình mịn + cây/nhà, `map3d.ts`, `WorldMap3D.vue`, nút 3D/2D ở HUD game; 1 đơn vị thế giới = 22,5 đơn vị sân khấu, đỉnh lưới cách 0,5, công trình ~18 đơn vị; hậu kỳ viền mực theo độ sâu; thú cưng + xe đi trên bản đồ; làm lại 2026-10-30 theo góp ý "đồng bùi nhùi" — bản voxel khối vuông đầu tiên đã bỏ). **Chưa làm**: vẽ lại 11 công trình ở ×2, ngày–đêm, thời tiết, tầng 2–3 dạng đảo/địa cầu, đo fps/RAM trên máy yếu + tự hạ 2D khi fps thấp, gói `kids-world`.
   Gốc: **Spike 3D voxel** (1 cảnh địa hình voxel, 2–3 công trình, greedy meshing, cây instancing, ngày–đêm): đo fps trên máy yếu/GPU tích hợp, RAM, dung lượng gói ước tính → báo chủ dự án, chốt rồi mới làm tiếp.
6. Bản đồ 3D đầy đủ tầng 1 + gói `kids-world` (build script, release phụ, `packSpec`, panel tải, bước tải khi tạo hồ sơ trẻ em, nhắc trong khu phụ huynh). **Đây là phần tốn công nhất** (địa hình voxel, 12 công trình voxel chi tiết, cây/nước/người/xe voxel, hiệu ứng) — có thể chia nhiều đợt, mỗi đợt thêm vài nơi.
7. Đo `pnpm stats`, dung lượng gói; cập nhật [17](17-metrics.md), 07 §9, 10, 03, 15; đánh dấu roadmap.

## 9. Câu hỏi còn mở (chủ dự án quyết khi duyệt)

1. ~~Kiểu vẽ công trình trong 3D~~ → **đã chốt voxel** (2026-10-29, §5.2).
2. Danh sách 12 nơi, chủ điểm, công trình §2.2 có đổi gì không?
3. Bé 6–8 tuổi (rating khởi điểm 100) vẫn đi từ tầng 1? Đề xuất: có — phân tầng tuổi để giai đoạn D.
4. ~~Hình từ (§5.5)~~ → **đã chốt tự vẽ vector bằng canvas** (2026-10-30), đủ 183/183 hình.
5. ~~Toàn màn hình (§5.4)~~ → **toàn màn hình thật** (che thanh tác vụ), `Esc` hoặc nút Nhà để thoát (2026-10-30, theo đề xuất).
