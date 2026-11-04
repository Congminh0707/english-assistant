# 26 — Cảnh địa điểm vẽ bằng ChatGPT Image (prompt chuẩn)

Từ 2026-11-04 cảnh 12 nơi tầng 1 (Việt Nam) làm lại bằng ChatGPT Image, cùng cách 6 nước ([decisions #46](decisions.md)). Mỗi nơi gồm **một tranh nền trống** + **các bảng sprite** cho vật động. Trời (mây, chim, mặt trời) và thời tiết là lớp động riêng của app (`SceneWeather.vue`), **không vẽ vào tranh**.

- Ảnh nháp/duyệt: `scripts/design-data/review/vn-scenes/` (`<nơi>-bg.png`, `<nơi>-sprites-N.png`, `compose*.py` ghép thử).
- Nguồn ảnh: ChatGPT Image; chủ dự án tự kiểm điều khoản thương mại trước khi phát hành.

## Trong app (decisions #48)

| Phần | Chỗ |
|---|---|
| Nền | `src/renderer/shared/art/scenes/kids-p<nơi>.art.html` (WebP q80 base64, SVG `xMidYMid slice`) |
| Khung sprite | `src/renderer/study/kids/game/sceneAnim/<nơi>/<vật>-<0..5>.webp`, `leaf-<0..5>.webp` |
| Vị trí, nhịp | `src/renderer/study/kids/game/sceneAnim/<nơi>.json` (toạ độ nền 1672×941, chân vật = giữa đáy) |
| Biển chạm, thú cưng | `game/placeArtPhoto.ts` (tâm biển = đỉnh công trình − 24 đơn vị ảnh gốc, chấm tròn rơi đúng đỉnh) |
| Chạy | `game/SceneAnim.vue` + `game/sceneAnim.ts` (`ActorScheduler`, `spawnLeaf`, `stepLeaf`; test `sceneAnim.test.ts`) |

Nhúng (ghi đè 3 chỗ đầu): `python scripts/design-data/embed-scene.py <nơi> <bg.png> <sheet>:<rows> ...`; vị trí/cỡ/nhịp lấy từ `PLACE`, `LEAF`, `TICK` của `review/vn-scenes/anim6.py`, tên vật ở `NAMES` của `embed-scene.py`.

**Luật hoạt ảnh (chủ dự án duyệt 2026-11-04):**
- Vật đứng yên ở khung 0; thỉnh thoảng làm **một lượt** ping-pong 0→5→0 (400–600 ms/khung, ±15 %); cá chép (`burst`) 0→5 nhanh 200 ms/khung.
- Mỗi vật nghỉ **5–10 s ngẫu nhiên** giữa hai lượt; hai lượt bất kỳ bắt đầu cách nhau 2–4 s; tối đa 2 vật cùng lúc; không chọn lại vật vừa chạy; ưu tiên vật chờ lâu (không vật nào bị bỏ quên).
- Lá rơi liên tục, chậm (18–34 px/s), tốc độ lúc nhanh lúc chậm, lắc là tổng 2 sóng, xoay xuôi/ngược; chạm đất thì mọc lại ở tán cây với nhịp mới.
- Giảm chuyển động: chỉ khung 0, không lá. Cửa sổ ẩn: rAF tự dừng.

**Bầu trời và thời tiết** (dùng chung mọi cảnh, không vẽ vào tranh nền):
- Sprite chung `game/sceneAnim/sky/`: `crane-0..5` (hạc vỗ cánh, cắt bằng một khung chung để thân không nhảy), `cloud-0..2` (mây xoắn kem), `sun`, `moon`, `raincloud`. Nguồn: `review/vn-scenes/sky-sprites.png` (bảng 6×2), xuất bằng `embed-scene.py --sky <ảnh>`.
- Mỗi nơi khai vùng trời trống trong `sceneAnim/<nơi>.json` → `sky: { x: [min, max], y: [min, max] (mép trên của mây), sun: [x, y] }` (sửa ở `SKY` của `embed-scene.py`). Hà Nội: x 820–1672 (bên trái là tán cây), y 10–70, mặt trời (1290, 95).
- Thời tiết **chọn ngẫu nhiên một lần khi vào nơi đó từ bản đồ** (`KidsGame.enter` → `pickWeather`: đêm theo giờ máy 19h–6h, ban ngày mưa 20 % / nắng 35 % / quang 45 %); vào bài học rồi quay lại cảnh vẫn giữ; thoát ra bản đồ rồi vào lại mới đổi.
- Quang: mặt trời + 3 mây + hạc. Nắng: mặt trời + 2 mây + hạc + vệt nắng (`SceneWeather`). Mưa: 4 mây mưa + mưa rơi, không mặt trời, không hạc. Đêm: mặt trăng + 2 mây + lớp tối và sao, không hạc.
- Mây trôi sang trái 5–11 px/s, hiện dần ở mép phải và mờ dần trước mép trái vùng trời (không đè lên cây/nhà). Hạc: đàn 1–3 con bay từ phải sang trái, mỗi đàn cách nhau 12–30 s ngẫu nhiên. Mặt trời xoay rất chậm (90 s/vòng), mặt trăng lắc nhẹ. Giảm chuyển động: mây, mặt trời đứng yên, không hạc.

## Cách chạy một nơi

1. Mở chat mới ở ChatGPT, **đính kèm ảnh tham chiếu phong cách**: ảnh chụp bản đồ Làng chữ (màn chính).
2. Dán [GLOBAL STYLE](#global-style) + [prompt cảnh](#mẫu-prompt-cảnh) của nơi đó. Tải ảnh, đặt `<nơi>-bg.png`.
3. Cùng chat: dán [prompt sprite](#mẫu-prompt-sprite) (mỗi bảng tối đa 3 vật × 6 khung). Đặt `<nơi>-sprites-N.png`.
4. Ghép thử bằng `compose*.py`, xem ảnh, chỉnh vị trí/cỡ trước khi nhúng vào app.
5. Tạo lại khi gặp lỗi ở bảng dưới; **chỉ sửa phần cảnh/sprite, không sửa GLOBAL STYLE** trừ khi chủ dự án đổi phong cách.

### Lỗi đã gặp

| Lỗi | Cách xử lý trong prompt |
|---|---|
| Tranh bóng, giống ảnh thật/sơn dầu | GLOBAL STYLE cấm gradient, bóng, phản chiếu thật |
| Nét quá "sạch vector", không mộc mạc | nét mực tay hơi run, dày mỏng không đều, màu đất ấm |
| Giống tranh Đông Hồ quá (nền giấy, trời giấy) | chỉ chút hạt giấy rất nhẹ, trời vẫn xanh |
| Mây/hạc/mặt trời trong tranh | EXCLUDE cố định ở cuối prompt cảnh |
| Người/xe vẽ sẵn đè lên nhau | nền luôn trống, người/xe là sprite đặt bằng code |
| Xích lô không có người đạp | ghi rõ khách ngồi trước, người đạp ngồi yên sau |
| Sprite 2 khung giật | 6 khung một vòng lặp, khác nhau rất ít |
| Người/xe đi ngang rồi nhảy về chỗ cũ, nhanh và giật | **vật đứng yên tại chỗ, chỉ cử động nhẹ** (vẫy tay, chớp mắt, quạt, thở); chỉ cho di chuyển khi đi liên tục ra khỏi khung |
| Quầng mờ màu quanh sprite | ghi "NO glow, NO shadow halo"; script bỏ alpha ≤ 40 |

## GLOBAL STYLE

Dán nguyên văn đầu mọi prompt (cảnh và sprite).

```markdown
# GLOBAL STYLE — "LANG CHU" KIDS GAME SCENES

The attached image is the art style reference (my game's village map). Match its shapes, proportions, level of detail, colour mood and friendliness.

STYLE
- Cosy, rustic, hand-drawn children's-book illustration of Vietnam, made into a game background.
- Chunky simple rounded shapes like the reference: bean-shaped bushy trees, fish-scale tile roofs, wooden posts, dirt paths with dotted edges, V-shaped grass blades, water with white wavy strokes.
- Outlines: hand-inked dark-brown lines, slightly wobbly and of uneven thickness, like drawn with a brush pen. Not perfect vector lines.
- Colour: flat matte fills, warm earthy natural palette (terracotta, ochre, moss green, rice-straw yellow, soft teal water, cream). Saturated but not neon. Simple lighter highlight patches only.
- A very light hand-painted texture inside fills is OK; no visible paper background.
- NOT: realistic, painterly, oil paint, 3D, glossy, gradients, lens light, reflections with detail, photo lighting, anime.

COMPOSITION RULES
- Wide 16:9, eye-level view from a ground area at the front.
- Landmarks clear and recognisable, each with breathing space; detailed but not cluttered.
- Bottom third: open, flat walkable ground, empty, for characters added later.
- Leave the upper sky area empty and calm.

ALWAYS EXCLUDE
- No sun, no clouds, no birds, no rain, no rainbow (sky and weather are separate animations).
- No people, no animals, no vehicles, no boats with people (added later as sprites).
- No text, letters, signs with words, logos, UI, borders or watermark.
```

## Mẫu prompt cảnh

```markdown
# SCENE — <PLACE NAME>, VIETNAM

Create ONE wide 16:9 background following GLOBAL STYLE.

SEASON / TIME: <season, time of day, light colour>
LEFT: <landmark or element>
CENTRE: <main landmark>
RIGHT: <element>
FOREGROUND: <1–3 characteristic plants/props at the edges>
GROUND (bottom third, empty): <surface: stone promenade / dirt path / sand / wooden pier>
CHARACTERISTIC DETAILS (max 3, small): <...>
SKY: plain empty <light blue / warm pale> sky only.
```

## Mẫu prompt sprite

```markdown
# SPRITE SHEET — <PLACE NAME>

Following GLOBAL STYLE, make an animation sprite sheet on a plain transparent background.
Grid: 6 columns x <N ≤ 3> rows of equal square cells, no grid lines.
Each ROW is ONE looping animation of 6 consecutive frames (left to right) of the same character, same size, same anchor point (feet/wheels on the same baseline) in every cell. Neighbouring frames differ only slightly so the loop plays smoothly; frame 6 flows back into frame 1.
Characters face RIGHT. Keep each one fully inside its cell with wide margins; nothing cropped; no text.

Row 1: <character + what moves>
Row 2: <...>
Row 3: <...>
```

## Hà Nội (Hồ Gươm)

Tham khảo (2026-11-04): Hồ Gươm mùa thu có lá vàng của bàng, sấu, lộc vừng, hoa sữa, liễu rủ; Tháp Rùa ba tầng, rêu trên mái; xích lô: khách ngồi ghế trước, người đạp ngồi yên sau.

```markdown
# SCENE — HOAN KIEM LAKE, HANOI, VIETNAM

Create ONE wide 16:9 background following GLOBAL STYLE.

SEASON / TIME: early autumn morning, soft warm light.
LEFT: red wooden The Huc bridge curving to Ngoc Son Temple (red-roofed gate) on a small green islet.
CENTRE: Turtle Tower, small 3-storey grey stone tower with moss, on a tiny grassy islet with a few lotus.
RIGHT: a row of yellow colonial Old Quarter shophouses with terracotta roofs, green shutters and small flower balconies.
FOREGROUND: a big autumn tree with golden and orange leaves at the left edge, a drooping willow, one wooden bench, one green lamp post.
GROUND (bottom third, empty): beige-pink stone promenade along the lake, low stone railing.
CHARACTERISTIC DETAILS (max 3, small): golden leaves scattered on the ground, small cream hoa sua flowers on a bush.
SKY: plain empty light blue sky only.
```

Sprite bảng 1 (6×3): xích lô (người đạp phía sau, bàn đạp quay đủ vòng), người bán hàng gánh sen và trái cây (đi bộ), bé đội nón cầm bóng bay (đi bộ). Bảng 2 (6×4): xe đạp chở hoa cúc, hai cụ chơi cờ tướng, cá chép nhảy, **một chiếc lá vàng xoay 6 khung** (lá rơi mùa thu; đường rơi đung đưa do code vẽ, không vẽ vào tranh).

Bảng 3 (6×3, **đứng yên**, thay bảng 1 có người đi bộ): bé đội nón đứng vẫy tay, chớp mắt (chỉ khung 4), bóng bay đung đưa; chị bán hàng ngồi ghế thấp sau thúng xoài/chuối/cam và sen, quạt nan; xích lô đỗ, bác xích lô ngả lưng trên ghế khách quạt nón, thở nhẹ.

Dùng (2026-11-04): nền `hanoi-v6-bg.png`, `hanoi-v6-sprites-2.png` (xe đạp hoa, cờ tướng, cá chép, lá), `hanoi-v6-sprites-3.png`. `hanoi-v6-sprites-1.png` (người đi bộ) bỏ. Ghép thử:

```bash
cd scripts/design-data/review/vn-scenes
python anim6.py hanoi-v6-bg.png hanoi-v6-test.gif hanoi-v6-sprites-2.png:4 hanoi-v6-sprites-3.png:3
```

Xem trước có hẹn giờ ngẫu nhiên như app (không cần mở app): `python export_preview.py hanoi hanoi-v6-bg.png hanoi-v6-sprites-2.png:4 hanoi-v6-sprites-3.png:3`, chạy server `scene-preview` (`.claude/launch.json`, cổng 8766) rồi mở `http://localhost:8766/preview.html?place=hanoi`.

`anim6.py`: cắt theo ô lưới, bỏ điểm alpha ≤ 40, căn mọi khung theo đáy + tâm ngang để không rung. Nhịp (chủ dự án duyệt tốc độ 2026-11-04): tick 200 ms, GIF 120 tick (24 s); vật đứng yên chạy **ping-pong** 1→6→2 (400–600 ms/khung), cá chép chạy một lượt rồi nghỉ (chu kỳ 8 s), mỗi lá rơi 1 lượt/24 s, tốc độ rơi dao động, lắc ngang là tổng 2 sin khác tần số, số vòng xoay riêng từng lá (bất quy tắc) → mọi tần số nguyên lần trong 24 s nên lặp không giật. Vị trí ở `PLACE`, lá ở `LEAVES`. Trong app dùng cùng nhịp này.
