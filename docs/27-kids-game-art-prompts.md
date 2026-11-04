# 27 — Game của bé vẽ bằng ChatGPT Image (kế hoạch + prompt)

Từ 2026-11-04 năm mini-game của bé (`src/renderer/study/kids/games/`) làm lại hình theo style cảnh Hà Nội ([26](26-scene-art-prompts.md)): **mỗi game một tranh nền trống** + **sprite khung game**; logic chơi giữ nguyên. Hình từ vựng bên trong vẫn là thẻ ChatGPT ([24](24-card-art-prompts.md)) đặt vào khung.

Cách chạy, GLOBAL STYLE, lỗi đã gặp, cách ghép/nhúng: dùng nguyên [26](26-scene-art-prompts.md). Khác: nền game **không có** lớp trời/thời tiết động, nên bầu trời cứ vẽ xanh trống như cảnh.

- Ảnh nháp/duyệt: `scripts/design-data/review/kids-games/` (`<game>-bg.png`, `<game>-sprites-N.png`).
- Nguồn ảnh: ChatGPT Image; chủ dự án tự kiểm điều khoản thương mại trước khi phát hành.

## Kế hoạch

| Game | Nền (16:9, trống) | Sprite (lưới 6 cột, nền trong) |
|---|---|---|
| Memory | bàn gỗ/chiếu trải trong vườn làng, giữa trống để xếp 8–12 thẻ | mặt sau thẻ (1 khung), khung thẻ mặt trước, lóe sao khi ghép đúng (6 khung) |
| Balloon | đồng cỏ, đồi xa, làng nhỏ; trời xanh trống | bóng bay 3 màu + dây (đung đưa 6 khung), nổ 6 khung |
| Pet | sân nhà có thảm cỏ, bàn gỗ thấp đặt đồ ăn | bát/đĩa trống, bướm bay (6 khung) |
| Fishing | ao sen, lau sậy, mặt nước rộng | thân cá 3 màu bơi 6 khung (quay phải), gợn nước 6 khung |
| Spell | hiên lớp học làng, bảng gỗ trống, bàn gỗ | ô chữ gỗ, ô trống, bút chì (6 khung xoay nhẹ) |

Vùng chơi (thẻ, bóng, cá, nút) luôn nằm ở **giữa và dưới**, nên mỗi nền để trống ≥ 60 % diện tích giữa; cảnh vật chỉ ở viền.

## Prompt nền

Mở đầu bằng GLOBAL STYLE (dòng tham chiếu Hà Nội) rồi dán:

```markdown
# SCENE — MEMORY GAME GARDEN, VIETNAM
Create ONE wide 16:9 background following GLOBAL STYLE.
SEASON / TIME: sunny late morning, soft warm light.
LEFT / RIGHT EDGES: bushy green trees, a few flowers, a bamboo fence.
CENTRE: a big empty low wooden table top seen slightly from above, taking about 60% of the frame, plain warm wood grain, nothing on it.
FOREGROUND: small flower bushes at the lower corners.
SKY: plain empty light blue sky strip at the top only.
```

```markdown
# SCENE — BALLOON GAME MEADOW, VIETNAM
Create ONE wide 16:9 background following GLOBAL STYLE.
SEASON / TIME: bright spring morning.
LEFT / RIGHT EDGES: round green hills, a small village with fish-scale tile roofs far away, a bamboo clump.
CENTRE: wide empty open sky taking the top two thirds, with a gentle green meadow below.
FOREGROUND: tall grass tufts and a few wild flowers at the bottom edge.
SKY: plain empty light blue sky only.
```

```markdown
# SCENE — PET FEEDING YARD, VIETNAM
Create ONE wide 16:9 background following GLOBAL STYLE.
SEASON / TIME: sunny afternoon.
LEFT: the front of a cosy village house with terracotta roof, wooden door, a papaya tree.
RIGHT: a low empty wooden feeding table with nothing on it, a fence and a flower pot.
CENTRE: an open grassy yard with a dirt path, empty.
FOREGROUND: grass tufts, a few small flowers.
SKY: plain empty light blue sky only.
```

```markdown
# SCENE — FISHING POND, VIETNAM
Create ONE wide 16:9 background following GLOBAL STYLE.
SEASON / TIME: warm summer morning.
LEFT / RIGHT EDGES: reeds, lotus leaves with a few pink lotus flowers, a small wooden jetty at the right edge.
CENTRE: a wide empty teal pond taking about 65% of the frame, with white wavy strokes on the water, no fish.
FOREGROUND: grassy bank with tufts at the bottom edge.
SKY: plain empty light blue sky strip at the top only.
```

```markdown
# SCENE — VILLAGE SCHOOL PORCH, VIETNAM
Create ONE wide 16:9 background following GLOBAL STYLE.
SEASON / TIME: calm morning.
LEFT: a green wooden blackboard with nothing written on it, on the wall of a small school with a tile roof.
RIGHT: a window with green shutters and a flower pot.
CENTRE: a wide empty wooden floor and a plain warm wall, open space.
FOREGROUND: one low stone porch step and a few fallen leaves.
SKY: plain light blue sky visible above the roof only.
```

**Fishing — bản v2 (chủ dự án chốt 2026-11-04, thay bản ao ngang ở trên):** cảnh trên bờ giữ nguyên nhưng nén vào 28 % trên cùng, nước chiếm 72 % dưới dạng mặt cắt ngang như game câu cá (mặt nước sóng trắng, nước xanh đậm dần xuống đáy, thân sen rủ hai bên, đáy ao có sỏi/rong ở hai góc, giữa trống). Cá bơi trong lòng nước. Prompt đã gửi: "same top scene as my approved FISHING POND image, squeeze above-water scene into the top 28 %, water fills remaining 72 % as a side cross-section view, wide empty centre, pebbled pond bed at the bottom corners". Ảnh v2 là ảnh cuối trong chat Hà Nội.

## Prompt sprite

Dùng [mẫu prompt sprite](26-scene-art-prompts.md#mẫu-prompt-sprite) (6 cột × ≤ 3 hàng). Hàng:

- **Memory**: R1 mặt sau thẻ (gỗ + sao vàng) 6 khung ngả nhẹ; R2 khung thẻ mặt trước trống; R3 lóe sao 6 khung.
- **Balloon**: R1–R3 bóng đỏ/vàng/xanh đung đưa có dây (6 khung); bảng 2: nổ cho 3 màu.
- **Pet**: R1 bát trống; R2 đĩa trống; R3 bướm vỗ cánh.
- **Fishing**: R1–R3 cá cam/xanh/vàng bơi (đuôi vẫy, quay phải); bảng 2: gợn nước, cần câu.
- **Spell**: R1 ô chữ gỗ trống; R2 ô trống gạch dưới; R3 bút chì xoay nhẹ.

## Tiến độ

- [x] Nền Memory · Balloon · Pet · Fishing · Spell đã vẽ xong (2026-11-04) trong chat Hà Nội `https://chatgpt.com/c/6aea8b1e-ff74-83ec-96c9-c932902a4c2a`, đúng thứ tự đó (5 ảnh cuối chat). 🚧 **Chưa lưu ra đĩa**: trang ChatGPT chặn gửi ảnh sang máy local, chủ dự án tải tay vào `scripts/design-data/review/kids-games/<game>-bg.png`.
- [x] Nền đã tải vào `scripts/design-data/review/kids-games/` (5 file `<game>-bg.png`; Fishing là bản v2).
- [x] 7 bảng sprite đã vẽ (2026-11-04, nền trong, 6 cột × 3 hàng), 7 ảnh cuối chat Hà Nội theo thứ tự: `memory-sprites-1` (mặt sau thẻ / mặt trước trống / sao lóe) · `balloon-sprites-1` (đỏ/vàng/xanh đung đưa) · `balloon-sprites-2` (nổ 3 màu) · `pet-sprites-1` (bát / đĩa / bướm) · `fishing-sprites-1` (cá cam / xanh / vàng) · `fishing-sprites-2` (bong bóng / gợn nước / bắn nước) · `spell-sprites-1` (ô chữ gỗ / ô trống / bút chì). Đã tải vào `kids-games/`. Ghi chú: bóng đung đưa rất ít (khung gần giống nhau); cá đứng hình sprite chỉ là thân cá, hình từ vựng phải gắn thêm (bong bóng/khung tròn dưới bụng) ở bước sửa `FishingGame.vue`.
- [x] Nhúng (`python scripts/design-data/embed-kids-games.py` → `src/renderer/study/kids/games/art/<game>/`, ~2 MB) + sửa 5 `games/*.vue` + menu `KidsGames.vue` (hình đại diện là sprite). Chụp thử bằng `pnpm ui:shot` cả 5 game: đạt. Bát (`bowl`) dùng làm chỗ hiện món đã cho ăn; bong bóng/gợn/bắn nước dùng ở câu cá; bút chì xoay khi điền đúng.

## Màn game toàn màn hình (2026-11-04, chủ dự án yêu cầu)

Khung nhỏ có viền bị bỏ: `GameStage.vue` là lớp `position: fixed; inset: 0` (z-index 1) phủ cả cửa sổ bằng tranh nền (`background-size: cover`), nằm dưới thanh Home/sao/khoá của `KidsApp` (`.bar` z-index 5). Bộ đếm lượt + nút nghe lại nằm ở `GameHud.vue` (dưới nút Home). Cỡ hình theo cửa sổ: `useStageScale.ts` cho hệ số `s` = min(rộng/1100, cao/800) trong [0.75, 1.6]; CSS dùng `calc(Npx * var(--s))` (`--s` đặt ở GameStage), cỡ số của `PictureImage`/`SpriteLoop` dùng `px(n)`. Thẻ Memory 190 px ở 1100×800 (trước 132), 3 cột khi 6 thẻ, 4 cột còn lại. Bóng bay đổi cỡ theo bề ngang (`--bw`) để 4 quả luôn vừa; `SpriteLoop` có `fill` (phủ bề ngang khung cha). Sprite xuất gần cỡ gốc (tối đa 280 px, không phóng to khi nhúng).

**Memory — nền v2 (2026-11-04, chủ dự án bỏ cái bàn):** vườn làng với bãi cỏ phẳng trống chiếm giữa và 2/3 dưới, hàng rào tre + cây ở viền, cây hoa hồng trên góc phải, không bàn. Là ảnh cuối trong chat Hà Nội. Đã tải đè `memory-bg.png` và nhúng lại (`embed-kids-games.py`), chụp thử ở 1400×850: đạt.
