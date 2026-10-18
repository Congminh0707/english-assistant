# 06 — Trình độ, tiến bộ & phần thưởng

Có **hai hệ thống level tách biệt** — đừng nhầm:

| | **Trình độ học (Learning level)** | **Level thú cưng (Pet level)** |
|---|---|---|
| Đo cái gì | Năng lực tiếng Anh thật | Mức độ chăm chỉ |
| Tăng khi | Làm bài đúng ở độ khó phù hợp | Bất kỳ hoạt động học nào (XP) |
| Có thể giảm? | Có (nhẹ, nếu làm sai nhiều) — để luôn đúng trình độ | Không bao giờ |
| Dùng để | Chọn nội dung phù hợp | Mở khoá ngoại hình, phụ kiện, tiến hoá |

---

## 1. Thang trình độ thống nhất

Hệ thống dùng **một thang điểm năng lực nội bộ 0–1200** (gọi là `rating`), chia thành 12 bậc. Mọi nội dung đều gắn một bậc (`level_code`).
Các chứng chỉ chỉ là **ánh xạ tham khảo** để người dùng dễ hiểu — không phải quy đổi chính thức.

| `level_code` | Rating | Tên hiển thị (pixel badge) | CEFR | Trẻ em (Cambridge YLE) | TOEIC L&R (tham khảo) | IELTS (tham khảo) | Tương đương VN |
|---|---|---|---|---|---|---|---|
| `PA1_1` | 0–99 | 🌱 Hạt mầm | Pre-A1 thấp | — (mầm non 3–5 tuổi) | — | — | Mầm non |
| `PA1_2` | 100–199 | 🌿 Chồi non | Pre-A1 | Pre A1 Starters | — | — | Lớp 1–3 |
| `A1_1` | 200–299 | 🐣 Gà con | A1 | A1 Movers (đầu) | 120–175 | — | Lớp 4–5 |
| `A1_2` | 300–399 | 🐥 Chim non | A1 | A1 Movers | 175–225 | — | Lớp 6–7 |
| `A2_1` | 400–499 | 🦊 Cáo nhỏ | A2 | A2 Flyers / KET | 225–400 | — | Lớp 8 |
| `A2_2` | 500–599 | 🦊 Cáo nhanh | A2 | KET | 400–550 | 3.0–3.5 | Lớp 9, thi vào 10 |
| `B1_1` | 600–699 | 🦉 Cú học giả | B1 | PET | 550–650 | 4.0–4.5 | THPT, VSTEP bậc 3 |
| `B1_2` | 700–799 | 🦉 Cú thông thái | B1 | PET | 650–785 | 5.0 | THPTQG khá |
| `B2_1` | 800–899 | 🐺 Sói bạc | B2 | FCE | 785–860 | 5.5–6.0 | VSTEP bậc 4 |
| `B2_2` | 900–999 | 🐺 Sói đầu đàn | B2 | FCE | 860–945 | 6.5 | |
| `C1` | 1000–1099 | 🐉 Rồng | C1 | CAE | 945–990 | 7.0–8.0 | VSTEP bậc 5 |
| `C2` | 1100–1200 | 👑 Rồng huyền thoại | C2 | CPE | (vượt thang TOEIC) | 8.5–9.0 | Bậc 6 |

> Ánh xạ TOEIC/IELTS dựa trên các bảng đối chiếu công khai của ETS / IELTS / Cambridge và chỉ mang tính **ước lượng**. Ghi rõ điều này trên giao diện.

### Lộ trình (track) — "phong cách" học, không phải độ khó

Độ khó do `level_code` quyết định. **Track** quyết định chủ đề, giao diện, ngôn ngữ giải thích, dạng bài:

| Track | Đối tượng | Đặc điểm |
|---|---|---|
| `preschool` | 3–6 tuổi | Không cần đọc chữ: hình + âm thanh + chạm. Phụ huynh hỗ trợ. Phonics, bài hát, từ chủ đề (màu, con vật, số). Phiên ≤ 10 phút. |
| `primary` | 6–11 tuổi | Game hoá mạnh, chủ đề gần gũi, chuẩn Starters/Movers/Flyers. Giải thích tiếng Việt. |
| `teen` | 12–18 tuổi | Theo chương trình phổ thông: ngữ pháp hệ thống, đọc hiểu, luyện đề. |
| `general` | Người lớn | Giao tiếp, công sở, du lịch, đọc báo. |
| `toeic` | Người đi làm/SV | Từ vựng TOEIC (TSL), 7 Part, ngữ cảnh doanh nghiệp. |
| `ielts` | Du học/định cư | Từ học thuật (NAWL/AWL), 4 kỹ năng, Writing/Speaking chấm theo band. |

Người dùng có thể đổi track bất kỳ lúc nào; rating vẫn giữ nguyên.

## 2. Rating theo từng kỹ năng

Mỗi profile có rating riêng cho từng kỹ năng:

`vocabulary`, `grammar`, `listening`, `reading`, `speaking`, `writing` (+ `phonics` cho track trẻ em).

**Level tổng** = trung bình có trọng số của các kỹ năng đã có dữ liệu (kỹ năng chưa đo thì bỏ qua). Màn hình Hồ sơ hiển thị biểu đồ radar 6 kỹ năng.

### Cập nhật rating — Elo đơn giản

Mỗi bài tập (exercise item) có `difficulty` (cùng thang 0–1200, khởi tạo = giữa bậc `level_code` của nó).
Sau mỗi lần làm:

```ts
// src/main/services/RatingService.ts (giản lược)
const K_USER = 24      // lớn lúc đầu (placement) rồi giảm dần còn 12
const K_ITEM = 8       // độ khó item cũng tự hiệu chỉnh theo dữ liệu (chỉ local)
const expected = 1 / (1 + 10 ** ((item.difficulty - user.rating) / 400))
const score = attempt.score  // 0..1 (đúng/sai hoặc điểm từng phần)
user.rating += K_USER * (score - expected)
item.difficulty -= K_ITEM * (score - expected)
```

- Bài **quá dễ** (expected > 0.9) gần như không tăng rating → khuyến khích làm bài đúng sức.
- Bài ôn SRS **không** ảnh hưởng rating (đó là ôn tập, không phải đo năng lực) — chỉ ảnh hưởng XP.

### Chọn bài tiếp theo
Ưu tiên item có `difficulty` trong khoảng `rating − 50 … rating + 100` (hơi khó hơn một chút — "vùng phát triển gần"), mục tiêu tỉ lệ đúng ~ 70–80%.

## 3. Kiểm tra đầu vào (placement)

1. Chọn track. Trẻ em: phụ huynh chọn độ tuổi → rating khởi điểm (3–5 tuổi: 0; 6–8: 100; 9–11: 200), có thể bỏ qua test.
2. Người lớn: tự đánh giá nhanh ("Tôi mới bắt đầu / biết cơ bản / giao tiếp được / khá / giỏi") → rating khởi điểm 150 / 350 / 600 / 850 / 1000.
3. Test thích ứng (computer adaptive): ~ 6 câu từ vựng, 6 ngữ pháp, 4 đọc, 4 nghe. K lớn (48) để hội tụ nhanh. Mỗi câu chọn item gần rating hiện tại nhất.
4. Speaking/Writing: tuỳ chọn (cần mic/AI). Nếu bỏ qua → lấy rating tổng làm khởi điểm, đánh dấu "chưa xác thực".
5. Kết quả: "Bạn đang ở khoảng **A2 – Cáo nhỏ** (≈ TOEIC 300–400)". Có nút "Làm lại sau 2 tuần".

## 4. Lên cấp trình độ (checkpoint)

- Khi rating một kỹ năng vượt ngưỡng bậc tiếp theo → mở khoá **"Thử thách lên cấp"** cho kỹ năng đó (10–15 câu ở bậc mới).
- Đạt ≥ 80% → lên cấp chính thức: hiệu ứng ăn mừng, huy hiệu pixel, mascot nhận phụ kiện đặc biệt.
- Chưa đạt → không mất gì, gợi ý ôn các điểm sai, thử lại sau 24 giờ.
- Level hiển thị trên hồ sơ = level đã **qua checkpoint** (ổn định, không nhảy lên xuống); rating thì thay đổi liên tục ở bên dưới.

## 5. Khung chương trình theo bậc (curriculum skeleton)

Mỗi bậc có mục tiêu "can-do" (người học làm được gì). Người làm nội dung dùng bảng này để soạn/gắn level. Danh sách ngữ pháp chi tiết nằm trong `content/curated/curriculum/grammar-inventory.yaml` (soạn theo bảng này).

| Bậc | Vốn từ tích luỹ (ước lượng) | Ngữ pháp tiêu biểu | Đọc / nghe | Nói / viết |
|---|---|---|---|---|
| PA1_1 | 50–150 từ (màu, số 1–10, con vật, gia đình, đồ chơi) | — (cụm từ cố định: *It's a cat.*) | Nghe từ đơn + hình; bài hát | Nhắc lại từ; chọn hình |
| PA1_2 | 300–500 | *to be*, *have got*, *this/that*, số nhiều, *can* | Câu 3–6 từ có hình | Trả lời 1–2 từ; tô/chép chữ |
| A1_1 | 600–800 | Hiện tại đơn, *there is/are*, giới từ nơi chốn, đại từ | Đoạn 50–80 từ | Câu đơn giới thiệu bản thân |
| A1_2 | 800–1000 | Hiện tại tiếp diễn, *like + V-ing*, *some/any*, câu hỏi Wh- | Đoạn 80–150 từ, tin nhắn | Viết 3–5 câu về sở thích |
| A2_1 | 1000–1500 | Quá khứ đơn, so sánh hơn/nhất, *going to*, trạng từ tần suất | Email, thông báo ngắn | Kể chuyện ngắn đã xảy ra |
| A2_2 | 1500–2000 | *will*, hiện tại hoàn thành (cơ bản), modal *must/should*, mệnh đề *because/when* | Bài 200 từ, hội thoại thường ngày | Email 50–80 từ |
| B1_1 | 2000–2700 | HTHT vs QKĐ, câu bị động cơ bản, điều kiện loại 1–2, mệnh đề quan hệ | Bài báo đơn giản, podcast chậm | Đoạn văn 100–150 từ, thảo luận chủ đề quen |
| B1_2 | 2700–3250 | Câu tường thuật, *used to*, gerund vs infinitive, QK tiếp diễn | Bài 400 từ, nghe tin tức chậm | Bài luận ý kiến ngắn |
| B2_1 | 3250–4200 | Điều kiện loại 3/hỗn hợp, bị động nâng cao, modal suy luận quá khứ | Báo chí, bài giảng ngắn | IELTS Task 2 ~ 250 từ (band 5.5–6) |
| B2_2 | 4200–5000 | Đảo ngữ cơ bản, mệnh đề rút gọn, collocation học thuật | Văn bản lập luận, TOEIC Part 7 đa đoạn | Trình bày, phản biện |
| C1 | 5000–8000 | Đảo ngữ nâng cao, cleft sentences, hedging, văn phong trang trọng | Học thuật, văn học | Essay band 7+, thuyết trình |
| C2 | 8000+ | Sắc thái, thành ngữ, phong cách tu từ | Mọi loại văn bản | Viết/nói gần bản ngữ |

Các bộ từ vựng theo bậc lấy từ nguồn mở (NGSL, CEFR-J, TSL, NAWL..., bộ từ trẻ em tự soạn) — xem [08](08-content-sources.md#2-từ-vựng-và-danh-sách-từ-theo-level).

## 6. XP, xu, đồ ăn (nền kinh tế trong app)

### Nguồn thưởng

| Hoạt động | XP | Xu 🪙 | Đồ ăn |
|---|---|---|---|
| Ôn 1 thẻ SRS | 2 | — | — |
| Hoàn thành phiên ôn SRS (≥ 10 thẻ) | 10 | 5 | 🍙 ×1 |
| Trả lời quiz micro-learning đúng | 5 | 1 | — |
| Hoàn thành 1 bài học (lesson) | 20–40 (theo độ dài) | 10 | 🍙 ×1 |
| Đạt điểm ≥ 90% một bài | +10 thưởng | +5 | 🍰 ×1 |
| Lưu từ mới vào sổ | 1 | — | — |
| Nhiệm vụ ngày (mỗi nhiệm vụ) | 15 | 10 | ngẫu nhiên |
| Qua checkpoint lên cấp | 200 | 100 | 🎂 ×1 + phụ kiện |
| Streak 7 ngày | 50 | 30 | 🍉 |

### Chống "cày" vô nghĩa
- Làm lại cùng một bài trong 24 giờ: XP ×0.3.
- XP từ quiz micro-learning tối đa 100/ngày.
- Bài quá dễ so với rating (expected > 0.95): XP ×0.5.

### Level thú cưng
XP cần để từ level `n` lên `n+1`:

```ts
export const xpForNextLevel = (n: number) => Math.round(50 * Math.pow(n, 1.5))
// lv1→2: 50 · lv5→6: 559 · lv10→11: 1581 · lv25→26: 6250 · lv50→51: 17678
```

Mở khoá theo level: lv 2 (nở trứng), 5 (biểu cảm mới), 10 (tiến hoá Thiếu niên), 15, 20 (phụ kiện), 25 (Trưởng thành), 50 (Huyền thoại). Bảng mở khoá: `src/shared/constants/unlocks.ts`.

### Đồ ăn & cửa hàng
| Món | Hunger + | Mood + | Cách có |
|---|---|---|---|
| 🍙 Cơm nắm | 20 | 2 | Thưởng bài học / 10 xu |
| 🍰 Bánh ngọt | 15 | 10 | Điểm cao / 25 xu |
| 🍉 Dưa hấu | 25 | 8 | Streak / 30 xu |
| 🥤 Trà sữa | 5 | 5 (+ energy 20) | 20 xu |
| 🎂 Bánh kem | 50 | 30 | Lên cấp |

Phụ kiện (mũ, kính, áo...) mua bằng xu, một số chỉ mở khoá qua thành tựu. **Không có tiền thật** trong app.

## 7. Streak, nhiệm vụ ngày, thành tựu

- **Streak**: ngày có ≥ 1 hoạt động học "thật" (≥ 5 thẻ SRS hoặc 1 bài học). Mỗi 7 ngày streak tặng 1 **vé giữ streak** (tối đa giữ 2 vé); bỏ lỡ 1 ngày tự dùng vé.
- **Nhiệm vụ ngày**: 3 nhiệm vụ chọn ngẫu nhiên từ pool, ưu tiên kỹ năng yếu nhất. Ví dụ: "Ôn 20 thẻ", "Nghe 1 bài", "Lưu 3 từ mới từ việc dịch", "Nói 5 câu shadowing".
- **Thành tựu** (ví dụ): Từ đầu tiên · 100 từ thuộc · 1000 từ thuộc · 7/30/100 ngày liên tục · Đọc 10 truyện · Nghe 1 giờ · Qua checkpoint B1 · Chủ nuôi tận tâm (cho ăn 30 ngày) · Cú đêm (học sau 22h — chỉ người lớn) · Dịch 500 lần.

Danh sách đầy đủ định nghĩa trong `src/shared/constants/achievements.ts` (id, tên vi/en, điều kiện, icon, phần thưởng).
