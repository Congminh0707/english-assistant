# 06 — Trình độ, tiến bộ & phần thưởng

Có **hai hệ thống level tách biệt** — đừng nhầm:

|              | **Trình độ học (Learning level)**                   | **Level thú cưng (Pet level)**         |
| ------------ | --------------------------------------------------- | -------------------------------------- |
| Đo cái gì    | Năng lực tiếng Anh thật                             | Mức độ chăm chỉ                        |
| Tăng khi     | Làm bài đúng ở độ khó phù hợp                       | Bất kỳ hoạt động học nào (XP)          |
| Có thể giảm? | Có (nhẹ, nếu làm sai nhiều) — để luôn đúng trình độ | Không bao giờ                          |
| Dùng để      | Chọn nội dung phù hợp                               | Mở khoá ngoại hình, phụ kiện, tiến hoá |

---

## 1. Thang trình độ thống nhất

Hệ thống dùng **một thang điểm năng lực nội bộ 0–1200** (gọi là `rating`), chia thành 12 bậc. Mọi nội dung đều gắn một bậc (`level_code`).
Các chứng chỉ chỉ là **ánh xạ tham khảo** để người dùng dễ hiểu — không phải quy đổi chính thức.

| `level_code` | Rating    | Tên hiển thị (pixel badge) | CEFR        | Trẻ em (Cambridge YLE) | TOEIC L&R (tham khảo) | IELTS (tham khảo) | Tương đương VN    |
| ------------ | --------- | -------------------------- | ----------- | ---------------------- | --------------------- | ----------------- | ----------------- |
| `PA1_1`      | 0–99      | 🌱 Hạt mầm                 | Pre-A1 thấp | — (mầm non 3–5 tuổi)   | —                     | —                 | Mầm non           |
| `PA1_2`      | 100–199   | 🌿 Chồi non                | Pre-A1      | Pre A1 Starters        | —                     | —                 | Lớp 1–3           |
| `A1_1`       | 200–299   | 🐣 Gà con                  | A1          | A1 Movers (đầu)        | 120–175               | —                 | Lớp 4–5           |
| `A1_2`       | 300–399   | 🐥 Chim non                | A1          | A1 Movers              | 175–225               | —                 | Lớp 6–7           |
| `A2_1`       | 400–499   | 🦊 Cáo nhỏ                 | A2          | A2 Flyers / KET        | 225–400               | —                 | Lớp 8             |
| `A2_2`       | 500–599   | 🦊 Cáo nhanh               | A2          | KET                    | 400–550               | 3.0–3.5           | Lớp 9, thi vào 10 |
| `B1_1`       | 600–699   | 🦉 Cú học giả              | B1          | PET                    | 550–650               | 4.0–4.5           | THPT, VSTEP bậc 3 |
| `B1_2`       | 700–799   | 🦉 Cú thông thái           | B1          | PET                    | 650–785               | 5.0               | THPTQG khá        |
| `B2_1`       | 800–899   | 🐺 Sói bạc                 | B2          | FCE                    | 785–860               | 5.5–6.0           | VSTEP bậc 4       |
| `B2_2`       | 900–999   | 🐺 Sói đầu đàn             | B2          | FCE                    | 860–945               | 6.5               |                   |
| `C1`         | 1000–1099 | 🐉 Rồng                    | C1          | CAE                    | 945–990               | 7.0–8.0           | VSTEP bậc 5       |
| `C2`         | 1100–1200 | 👑 Rồng huyền thoại        | C2          | CPE                    | (vượt thang TOEIC)    | 8.5–9.0           | Bậc 6             |

> Ánh xạ TOEIC/IELTS dựa trên các bảng đối chiếu công khai của ETS / IELTS / Cambridge và chỉ mang tính **ước lượng**. Ghi rõ điều này trên giao diện.

### Lộ trình (track) — "phong cách" học, không phải độ khó

Độ khó do `level_code` quyết định. **Track** quyết định chủ đề, giao diện, ngôn ngữ giải thích, dạng bài:

| Track       | Đối tượng       | Đặc điểm                                                                                                                      |
| ----------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `preschool` | 3–6 tuổi        | Không cần đọc chữ: hình + âm thanh + chạm. Phụ huynh hỗ trợ. Phonics, bài hát, từ chủ đề (màu, con vật, số). Phiên ≤ 10 phút. |
| `primary`   | 6–11 tuổi       | Game hoá mạnh, chủ đề gần gũi, chuẩn Starters/Movers/Flyers. Giải thích tiếng Việt.                                           |
| `teen`      | 12–18 tuổi      | Theo chương trình phổ thông: ngữ pháp hệ thống, đọc hiểu, luyện đề.                                                           |
| `general`   | Người lớn       | Giao tiếp, công sở, du lịch, đọc báo.                                                                                         |
| `toeic`     | Người đi làm/SV | Từ vựng TOEIC (TSL), 7 Part, ngữ cảnh doanh nghiệp.                                                                           |
| `ielts`     | Du học/định cư  | Từ học thuật (NAWL/AWL), 4 kỹ năng, Writing/Speaking chấm theo band.                                                          |

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
const K_USER = 24 // lớn lúc đầu (placement) rồi giảm dần còn 12
const K_ITEM = 8 // độ khó item cũng tự hiệu chỉnh theo dữ liệu (chỉ local)
const expected = 1 / (1 + 10 ** ((item.difficulty - user.rating) / 400))
const score = attempt.score // 0..1 (đúng/sai hoặc điểm từng phần)
user.rating += K_USER * (score - expected)
item.difficulty -= K_ITEM * (score - expected)
```

- Bài **quá dễ** (expected > 0.9) gần như không tăng rating → khuyến khích làm bài đúng sức.
- Bài ôn SRS **không** ảnh hưởng rating (đó là ôn tập, không phải đo năng lực) — chỉ ảnh hưởng XP.

> ✅ **Đã làm (2026-11-11) — kỹ năng thứ năm `writing`** ([decisions #62](decisions.md)). Code có 5 kỹ năng Elo: `vocab`, `grammar`, `reading`, `listening`, `writing` (`SKILLS` trong `src/shared/progress.ts`; Nói vẫn chưa có Elo riêng). Cột `skill` của `skill_ratings`/`exercise_stats` là text nên không cần migration.
> - **Vào Viết**: dạng bài `translate` và `write` trong mọi loại bài học (`lessonExerciseSkill`; trước đó tính vào ngữ pháp, decisions #59). Quy tắc `countsForSkill` giữ nguyên: `write` chỉ tính khi AI chấm, `respond` không bao giờ tính, `speak` vẫn tính vào từ vựng. **Viết tự do** cũng tính: nhận xét AI mới đầu tiên của mỗi bài = 1 câu (`source = 'free-writing'`, `kind = 'free'`), đúng khi `overall ≥ 60` (`WRITE_PASS`), độ khó theo bậc đề qua `bandDifficultyLevel` (`src/shared/freeWriting.ts`): **A1 → A1_1, A2 → A2_1, B1 → B1_1, B2 → B2_1** (bậc con đầu của bậc CEFR, đề viết cho người "vào" bậc đó; đề tự đặt dùng bậc đang lọc). Mỗi bài tính tối đa một lần (`free_writing_entries.rated_at`, migration 0011): sửa chữ rồi xin nhận xét lại vẫn lưu nhận xét/điểm mới nhưng không ghi Elo lần hai; nhận xét đã có, AI tắt/lỗi, chữ đổi trong lúc chờ (`stale`), đổi hồ sơ trong lúc chờ → không ghi.
> - **Rating khởi đầu**: chưa có bài kiểm tra nào đo Viết và không có cài đặt `learning.levelWriting` → lấy **giữa bậc của `learning.level`** (trình độ chung) khi chưa có dòng `skill_ratings`.
> - **Lịch sử**: các dòng `exercise_stats` cũ của `translate`/`write` (trước 2026-11-11) **vẫn ở `grammar`**, không chuyển dữ liệu, và các câu đó đã cộng vào rating ngữ pháp. Trong 30 ngày đầu, bảng độ chính xác có thể hiện "Dịch câu" hai dòng (một dòng ngữ pháp cũ, một dòng Viết mới).
> - **Không dùng cho lộ trình và lên cấp**: `DailyPlanService` chỉ chọn kỹ năng yếu trong danh sách tường minh ngữ pháp/đọc/nghe (Viết không có kho bài/mục lộ trình riêng). Gợi ý lên cấp chỉ xét `LEVEL_UP_SKILLS` (4 kỹ năng mà bài kiểm tra đo): `StatsService` trả `ahead = 0` cho Viết nên nút "Sẵn sàng lên cấp" không bao giờ hiện ở dòng Viết; bài kiểm tra đầu vào/lên cấp (`PlacementService`) dùng danh sách kỹ năng riêng, không đụng Viết. Rating/level Viết chỉ để xem.
> - **Chỉ người lớn**: hồ sơ trẻ em không thấy dòng Viết, độ chính xác Viết, khối viết tự do ở trang Thống kê (lọc ở `StatsService`).

### Chọn bài tiếp theo

Ưu tiên item có `difficulty` trong khoảng `rating − 50 … rating + 100` (hơi khó hơn một chút — "vùng phát triển gần"), mục tiêu tỉ lệ đúng ~ 70–80%.

## 3. Kiểm tra đầu vào (placement)

1. Chọn track. Trẻ em: phụ huynh chọn độ tuổi → rating khởi điểm (3–5 tuổi: 0; 6–8: 100; 9–11: 200), có thể bỏ qua test.
2. Người lớn: tự đánh giá nhanh ("Tôi mới bắt đầu / biết cơ bản / giao tiếp được / khá / giỏi") → rating khởi điểm 150 / 350 / 600 / 850 / 1000.
3. Test thích ứng (computer adaptive): ~ 6 câu từ vựng, 6 ngữ pháp, 4 đọc, 4 nghe. K lớn (48) để hội tụ nhanh. Mỗi câu chọn item gần rating hiện tại nhất.
4. Speaking/Writing: tuỳ chọn (cần mic/AI). Nếu bỏ qua → lấy rating tổng làm khởi điểm, đánh dấu "chưa xác thực".
5. Kết quả: "Bạn đang ở khoảng **A2 – Cáo nhỏ** (≈ TOEIC 300–400)". Có nút "Làm lại sau 2 tuần".

> ✅ **Cập nhật (Phase 2)** — 20 câu xen kẽ từ vựng (12) / ngữ pháp (5) / đọc hiểu (3); mỗi kỹ năng có bậc thang độ khó riêng; kết quả lưu trình độ từng kỹ năng + trình độ chung (trọng số 0,5/0,3/0,2); ngân hàng ngữ pháp/đọc hiểu tự soạn ở `content/curated/placement`. Phần nghe và Elo theo kỹ năng chưa có.
> ✅ **Đã làm (Phase 1)** — bản đầu chỉ từ vựng: `PlacementService`, 20 câu chọn nghĩa, độ khó thích nghi kiểu "staircase" (bắt đầu A2.1; đúng → khó hơn một bậc, sai hoặc "Tôi không biết" → dễ hơn một bậc; trình độ = trung bình bậc các câu sau 5 câu khởi động, `src/shared/placement.ts`). Kết quả lưu vào `learning.level` (quyết định từ của khoảnh khắc). Hồ sơ trẻ em không gặp từ nhạy cảm. Chưa có ngữ pháp/đọc/nghe, chưa dùng Elo theo kỹ năng.

## 4. Lên cấp trình độ (checkpoint)

- Khi rating một kỹ năng vượt ngưỡng bậc tiếp theo → mở khoá **"Thử thách lên cấp"** cho kỹ năng đó (10–15 câu ở bậc mới).
- Đạt ≥ 80% → lên cấp chính thức: hiệu ứng ăn mừng, huy hiệu pixel, mascot nhận phụ kiện đặc biệt.
- Chưa đạt → không mất gì, gợi ý ôn các điểm sai, thử lại sau 24 giờ.
- Level hiển thị trên hồ sơ = level đã **qua checkpoint** (ổn định, không nhảy lên xuống); rating thì thay đổi liên tục ở bên dưới.
- Kỹ năng Viết (2026-11-11) không mở thử thách lên cấp và không ảnh hưởng quyết định lên cấp (xem §2, decisions #62).

## 5. Khung chương trình theo bậc (curriculum skeleton)

Mỗi bậc có mục tiêu "can-do" (người học làm được gì). Người làm nội dung dùng bảng này để soạn/gắn level. Danh sách ngữ pháp chi tiết nằm trong `content/curated/curriculum/grammar-inventory.yaml` (soạn theo bảng này).

| Bậc   | Vốn từ tích luỹ (ước lượng)                          | Ngữ pháp tiêu biểu                                                                | Đọc / nghe                             | Nói / viết                                 |
| ----- | ---------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------ |
| PA1_1 | 50–150 từ (màu, số 1–10, con vật, gia đình, đồ chơi) | — (cụm từ cố định: _It's a cat._)                                                 | Nghe từ đơn + hình; bài hát            | Nhắc lại từ; chọn hình                     |
| PA1_2 | 300–500                                              | _to be_, _have got_, _this/that_, số nhiều, _can_                                 | Câu 3–6 từ có hình                     | Trả lời 1–2 từ; tô/chép chữ                |
| A1_1  | 600–800                                              | Hiện tại đơn, _there is/are_, giới từ nơi chốn, đại từ                            | Đoạn 50–80 từ                          | Câu đơn giới thiệu bản thân                |
| A1_2  | 800–1000                                             | Hiện tại tiếp diễn, _like + V-ing_, _some/any_, câu hỏi Wh-                       | Đoạn 80–150 từ, tin nhắn               | Viết 3–5 câu về sở thích                   |
| A2_1  | 1000–1500                                            | Quá khứ đơn, so sánh hơn/nhất, _going to_, trạng từ tần suất                      | Email, thông báo ngắn                  | Kể chuyện ngắn đã xảy ra                   |
| A2_2  | 1500–2000                                            | _will_, hiện tại hoàn thành (cơ bản), modal _must/should_, mệnh đề _because/when_ | Bài 200 từ, hội thoại thường ngày      | Email 50–80 từ                             |
| B1_1  | 2000–2700                                            | HTHT vs QKĐ, câu bị động cơ bản, điều kiện loại 1–2, mệnh đề quan hệ              | Bài báo đơn giản, podcast chậm         | Đoạn văn 100–150 từ, thảo luận chủ đề quen |
| B1_2  | 2700–3250                                            | Câu tường thuật, _used to_, gerund vs infinitive, QK tiếp diễn                    | Bài 400 từ, nghe tin tức chậm          | Bài luận ý kiến ngắn                       |
| B2_1  | 3250–4200                                            | Điều kiện loại 3/hỗn hợp, bị động nâng cao, modal suy luận quá khứ                | Báo chí, bài giảng ngắn                | IELTS Task 2 ~ 250 từ (band 5.5–6)         |
| B2_2  | 4200–5000                                            | Đảo ngữ cơ bản, mệnh đề rút gọn, collocation học thuật                            | Văn bản lập luận, TOEIC Part 7 đa đoạn | Trình bày, phản biện                       |
| C1    | 5000–8000                                            | Đảo ngữ nâng cao, cleft sentences, hedging, văn phong trang trọng                 | Học thuật, văn học                     | Essay band 7+, thuyết trình                |
| C2    | 8000+                                                | Sắc thái, thành ngữ, phong cách tu từ                                             | Mọi loại văn bản                       | Viết/nói gần bản ngữ                       |

Các bộ từ vựng theo bậc lấy từ nguồn mở (NGSL, CEFR-J, TSL, NAWL..., bộ từ trẻ em tự soạn) — xem [08](08-content-sources.md#2-từ-vựng-và-danh-sách-từ-theo-level).

## 6. XP, xu, đồ ăn (nền kinh tế trong app)

### Nguồn thưởng

| Hoạt động                          | XP                  | Xu 🪙 | Đồ ăn            |
| ---------------------------------- | ------------------- | ----- | ---------------- |
| Ôn 1 thẻ SRS                       | 2                   | —     | —                |
| Hoàn thành phiên ôn SRS (≥ 10 thẻ) | 10                  | 5     | 🍙 ×1            |
| Trả lời quiz micro-learning đúng   | 5                   | 1     | —                |
| Hoàn thành 1 bài học (lesson)      | 20–40 (theo độ dài) | 10    | 🍙 ×1            |
| Đạt điểm ≥ 90% một bài             | +10 thưởng          | +5    | 🍰 ×1            |
| Lưu từ mới vào sổ                  | 1                   | —     | —                |
| Nhiệm vụ ngày (mỗi nhiệm vụ)       | 15                  | 10    | ngẫu nhiên       |
| Qua checkpoint lên cấp             | 200                 | 100   | 🎂 ×1 + phụ kiện |
| Streak 7 ngày                      | 50                  | 30    | 🍉               |

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

| Món          | Hunger + | Mood +          | Cách có                |
| ------------ | -------- | --------------- | ---------------------- |
| 🍙 Cơm nắm   | 20       | 2               | Thưởng bài học / 10 xu |
| 🍰 Bánh ngọt | 15       | 10              | Điểm cao / 25 xu       |
| 🍉 Dưa hấu   | 25       | 8               | Streak / 30 xu         |
| 🥤 Trà sữa   | 5        | 5 (+ energy 20) | 20 xu                  |
| 🎂 Bánh kem  | 50       | 30              | Lên cấp                |

> ✅ **Đã làm (Phase 1/2)** — trang "Cửa hàng" trong cửa sổ Học tập (`ShopService`, `src/shared/shop.ts`): mua đồ ăn (túi tối đa 99/loại) và **phụ kiện** cho mascot — 🎀 nơ 30 xu, 👓 kính 60, 🧣 khăn 80, 🎩 mũ chóp 120 (Lv 5), 👑 vương miện 300 (Lv 10). Mỗi vị trí (đầu/mặt/cổ) đeo một món, đeo món mới thay món cũ. Chi xu ghi vào sổ XP với `coins` âm (`reason = shop.purchase`) nên tổng xu luôn tính lại được. Xu kiếm từ nhiệm vụ ngày và luyện tập.

> ✅ **Cập nhật (2026-10-20)** — thêm đồ ăn 🍎 táo 8 xu, 🍦 kem 22, 🍕 pizza 35, 🍜 ramen 45, ⚡ nước tăng lực 35 (energy +40); phụ kiện 🌸 hoa 40, 🥳 nón tiệc 70, 🕶️ kính râm 90 (Lv 3), 🎧 tai nghe 150 (Lv 5), 🦸 áo choàng 200 (Lv 8), 🪽 cánh 450 (Lv 15) — thêm vị trí `back` (áo choàng/cánh). **Nhân vật thú cưng** cũng bán trong cửa hàng (`char:<id>`): Lupo 500 xu (Lv 5; trước 2026-11-01 là Webby, migration 0007 chuyển), Kitsu 600 (Lv 5), Draco 700 (Lv 8), Robo 700 (Lv 8); Bi có sẵn. Level/XP thuộc về hồ sơ nên đổi nhân vật vẫn giữ tiến độ và giai đoạn tiến hoá. Nguồn sự thật: `src/shared/shop.ts`, `src/shared/pet.ts`, `src/shared/characters.ts`.

Phụ kiện (mũ, kính, áo...) mua bằng xu, một số chỉ mở khoá qua thành tựu. **Không có tiền thật** trong app.

## 7. Streak, nhiệm vụ ngày, thành tựu

- **Streak**: ngày có ≥ 1 hoạt động học "thật" (≥ 5 thẻ SRS hoặc 1 bài học). Mỗi 7 ngày streak tặng 1 **vé giữ streak** (tối đa giữ 2 vé); bỏ lỡ 1 ngày tự dùng vé.
- **Nhiệm vụ ngày**: 3 nhiệm vụ chọn ngẫu nhiên từ pool, ưu tiên kỹ năng yếu nhất. Ví dụ: "Ôn 20 thẻ", "Nghe 1 bài", "Lưu 3 từ mới từ việc dịch", "Nói 5 câu shadowing".
  > ✅ **Thành tựu (Phase 2)** — `AchievementService`: 32 huy hiệu (xem `src/shared/achievements.ts`) tính từ số liệu thống kê; mở khoá thưởng XP + xu theo hạng (đồng 20/5, bạc 50/10, vàng 120/25, kim cương 300/60), ghi `xp_events` (`reason = achievement.unlocked`, `refId = <id>`) nên mỗi thành tựu thưởng một lần/hồ sơ; thưởng bù cho thành tựu đã đạt từ trước. Mascot báo trong bong bóng thoại.
  > ✅ **Huy hiệu v3 vector (2026-11-09, thay ảnh PNG dưới đây)** — 32 SVG, một file mỗi thành tựu (`src/renderer/shared/assets/badges/<id>.svg`, ≈ 250 KB), sinh bằng `pnpm badges` (`scripts/design-data/mascot/export_badges.py`). Khung theo hạng: đồng = đồng xu đinh tán, bạc = sao tám cánh + ngọc xanh, vàng = khiên có cánh + vương miện + 3 ngọc + vầng tia xoay, kim cương = pha lê 10 mặt + cánh lông vũ + vương miện ngọc + tia sáng; nền men màu theo nhóm; dải băng ghi mốc; vệt sáng lướt qua (tắt khi giảm chuyển động). Chưa mở: `BadgeImage` làm xám + biểu tượng khoá.
  > ↩️ **Huy hiệu độ phân giải cao (2026-10-23, đã thay)** — ảnh PNG 256×256 vẽ bằng mã (`src/shared/badgeArt.ts`, `BADGE_HIRES_SCALE = 8`): huy chương 4 hạng có viền vát, đinh tán, ngọc theo hạng, nền chuyển sắc; mỗi biểu tượng có bản vẽ chi tiết riêng nhiều lớp tô bóng + quầng sáng + bóng đổ. Sinh bằng `pnpm badges` → `src/renderer/shared/assets/badges/` (37 ảnh ≈ 1,5 MB: 9 biểu tượng × 4 hạng + khoá); `BadgeImage.vue` dùng ảnh, thiếu ảnh thì rơi về bản pixel 32×32. Đổi thiết kế → chạy lại `pnpm badges` và commit ảnh.
  > ✅ **Đã làm (Phase 1)** — `MissionService`: 3 nhiệm vụ cố định mỗi ngày (theo ngày cục bộ): _Ôn N thẻ_ (N = `learning.dailyGoal`: 5/10/20/30, +20 XP +10 xu), _Lưu 3 từ mới_ (+10 XP +5 xu), _Ôn hết thẻ đến hạn_ (+15 XP +10 xu); làm cả ba thưởng thêm +25 XP +20 xu. Tiến độ tính trực tiếp từ nhật ký ôn và sổ XP; thưởng ghi vào `xp_events` (`reason = mission.completed`, `refId = <ngày>:<nhiệm vụ>`) nên mỗi nhiệm vụ chỉ thưởng một lần/ngày. Mascot ăn mừng khi xong. Chưa có pool ngẫu nhiên theo kỹ năng.
- **Thành tựu** (ví dụ): Từ đầu tiên · 100 từ thuộc · 1000 từ thuộc · 7/30/100 ngày liên tục · Đọc 10 truyện · Nghe 1 giờ · Qua checkpoint B1 · Chủ nuôi tận tâm (cho ăn 30 ngày) · Cú đêm (học sau 22h — chỉ người lớn) · Dịch 500 lần.

Danh sách đầy đủ định nghĩa trong `src/shared/constants/achievements.ts` (id, tên vi/en, điều kiện, icon, phần thưởng).

> ✅ **Vật phẩm cửa hàng mở rộng (2026-10-21)** — Đồ ăn thêm: 🍌 chuối 9 xu, 🍪 bánh quy 15, 🍩 donut 20, 🧋 trà sữa trân châu 26 (energy +24), 🍲 súp nóng 28, 🍣 sushi 38, 🍔 bánh mì kẹp 40, 🍱 bữa tiệc 90 (no +60, vui +35). Phụ kiện thêm (tổng 20): 🎀 nơ cổ 70, 🧢 mũ lưỡi trai 60 (Lv 2), 🐱 bờm tai mèo 90 (Lv 2), 🎒 ba lô 180 (Lv 3, có lớp sau lưng), 🏴‍☠️ bịt mắt 100 (Lv 4), 🥷 mặt nạ 130 (Lv 6), 🧙 mũ phù thuỷ 160 (Lv 6), 🏅 huy chương 220 (Lv 10), 😇 hào quang 350 (Lv 12). Nguồn sự thật: `src/shared/shop.ts`, `src/shared/pet.ts`; hình vẽ ở `scripts/sprites/accessories.mjs`.

> ✅ **Phụ kiện v2 cho mascot v3 (2026-11-09, [decisions #53](decisions.md))** — 25 món, 5 vị trí: đầu 10 (nơ, vòng hoa, nón tiệc, mũ lưỡi trai, **mũ len** 90 xu Lv 2, mũ chóp, tai nghe, mũ phù thuỷ, vương miện, hào quang), mặt 4 (kính tròn, **kính tim** thay kính râm, bịt mắt, mặt nạ), cổ 3 (khăn len, nơ cổ, huy chương), **tay** 5 — vị trí mới, cầm ở tay phải (bóng bay 50, kẹo mút 40, kiếm gỗ 110 Lv 4, ô lá 140 Lv 5, đũa phép 240 Lv 9), lưng 3 (áo choàng bay ra một bên, **cánh tiên** 260 Lv 8, đôi cánh). Bỏ 🎒 ba lô và 🐱 bờm tai mèo (bị thân che/lẫn vào tai thật): `RETIRED_ACCESSORIES` + `ShopService.refundRetired()` hoàn đúng giá cũ cho ai đã mua (`reason = shop.refund`, chạy khi mở cửa hàng). Mỗi món vẽ riêng cho từng nhân vật theo toạ độ neo (`scripts/design-data/mascot/acc2.py`), lưu trong `pets/<id>.pet.json` (`acc`), biểu tượng cửa hàng `art/items/acc-*.svg` cùng hình. Đeo đồ cổ thì ẩn khăn/chuông/dây thừng mặc định của giai đoạn; đồ cầm tay ẩn ở các dáng tay phải không nghỉ (chạy, nhảy, ăn, đọc, vui...). Cửa hàng có lọc theo vị trí và **thử đồ** (rê chuột/focus một món → hình xem trước mặc thử).
