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

1. **Phong cách chuẩn = cảnh Hà Nội đã duyệt** (`hanoi-v6-bg.png`, chủ dự án chốt 2026-11-04; không đính kèm ảnh Làng chữ nữa). Hai cách:
   - **Mặc định (AI tự làm):** vẽ tiếp trong chat Hà Nội `https://chatgpt.com/c/6aea8b1e-ff74-83ec-96c9-c932902a4c2a` (đã có ảnh Làng chữ + nền Hà Nội + mọi bảng sprite). Mở đầu prompt bằng [dòng tham chiếu Hà Nội](#global-style) và câu **"Create a BRAND-NEW image, do not edit any previous image"**, vì trong chat có sẵn ảnh, ChatGPT hay sửa đè ảnh cũ. AI **không tự đính kèm ảnh được** (đã thử 2026-11-04: ô file, dán/kéo thả giả, clipboard + Ctrl+V; ChatGPT chỉ nhận thao tác thật, Claude Browser không có công cụ tải file).
   - **Chủ dự án tự đính kèm** `hanoi-v6-bg.png` vào chat mới: dùng dòng "The attached image…" của GLOBAL STYLE.
2. Dán [GLOBAL STYLE](#global-style) + [prompt cảnh](#mẫu-prompt-cảnh) của nơi đó. Tải ảnh, đặt `<nơi>-bg.png`. So nét với Hà Nội trước khi làm sprite.
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

Dán nguyên văn đầu mọi prompt (cảnh và sprite). Dòng tham chiếu đầu tiên chọn theo cách làm ở bước 1:

- Vẽ tiếp trong chat Hà Nội (mặc định): `Create a BRAND-NEW image, do not edit any previous image. Use the Hoan Kiem Lake (Hanoi) background I approved earlier in this chat as the exact art style reference: same hand-inked wobbly outlines, same warm earthy matte palette, same chunky shapes, same level of detail.`
- Chủ dự án đính kèm `hanoi-v6-bg.png` vào chat mới: `The attached image (Hoan Kiem Lake, Hanoi) is the exact art style reference: same hand-inked wobbly outlines, same warm earthy matte palette, same chunky shapes, same level of detail.`

```markdown
# GLOBAL STYLE — "LANG CHU" KIDS GAME SCENES

<dòng tham chiếu ở trên>. Match its shapes, proportions, level of detail, colour mood and friendliness.

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

## Kế hoạch 11 cảnh còn lại (viết 2026-11-04; ĐÃ làm và nhúng cùng ngày, xem mục Công cụ dựng bên dưới)

Luật giống Hà Nội (GLOBAL STYLE, nền trống, vật đứng yên chạy ngẫu nhiên 5–10 s, trời/thời tiết là lớp riêng, prompt chuẩn ở trên). **Thêm luật: mỗi cảnh có ít nhất một hoạt ảnh LIÊN TỤC làm nét riêng của nơi đó** (Hà Nội: lá thu rơi). Nét riêng nào khó vẽ/khó tìm tài liệu thì bỏ, không bắt buộc. Trước khi soạn prompt mỗi nơi: **tìm ảnh/tư liệu thật** (công trình, trang phục, xe, mùa) và ghi 1–2 dòng "Tham khảo" như mục Hà Nội.

### Động cơ cần thêm vào `SceneAnim` (làm trước, dùng chung)

| Kiểu | Làm gì | Dùng ở |
|---|---|---|
| `lane` | dòng vật đi liên tục dọc một đường (vào mép này, ra mép kia hoặc khuất sau công trình), khoảng cách ngẫu nhiên, nhiều làn, hai chiều (lật ngang bằng CSS), khung lặp 4–6 (bánh xe, mái chèo) | xe máy/xe buýt TP.HCM, xe trên Cầu Rồng, thuyền Hạ Long/Ninh Bình/Cần Thơ/Huế, hoa đăng Hội An, tàu Đà Lạt |
| `emitter` | hạt sinh liên tục trong một vùng, trôi theo hướng, mờ dần (như lá Hà Nội nhưng tổng quát: hướng, tốc độ, xoay, đổi độ mờ) | sương núi Sa Pa/Đà Lạt, khói bếp, hoa đăng, bong bóng, đom đóm đêm |
| `burst` theo đợt | hiệu ứng ngắn lặp ngẫu nhiên (đã có cho cá chép, mở rộng thêm lớp phát sáng) | lửa/nước Cầu Rồng, cá nhảy |
| `wave` | dải sóng vỗ bờ lặp liên tục (sprite 6 khung chạy vòng, không ping-pong) | Nha Trang, Phú Quốc, Hạ Long |
| `clock` | kim đồng hồ quay theo giờ máy | Tháp đồng hồ chợ Bến Thành |

Kèm: `sky.birds` theo nơi (`crane` / `gull` hải âu / `none`), tỉ lệ thời tiết theo nơi (vd Huế mưa nhiều hơn, Sa Pa có sương), giờ cố định nếu cảnh cần (Phú Quốc hoàng hôn). Mỗi kiểu mới có test thuần trong `sceneAnim.test.ts` và luật giảm chuyển động (đứng yên/ẩn).

### Từng nơi

Biển chạm giữ nhãn hiện có (`kids.game.spots.<nơi>`); chấm đặt đúng đỉnh vật như Hà Nội. Vật đứng yên tối đa 6, nên có đồ vật trùng chủ điểm từ học của nơi đó.

| # | Nơi (chủ điểm) | Mùa / giờ | Nét riêng LIÊN TỤC | Vật đứng yên (ngẫu nhiên) | Biển chạm | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | **TP.HCM** (phố & xe) | nắng, trưa | `lane` 2 làn hai chiều trước chợ Bến Thành: xe máy (nhiều, nhanh), xe buýt xanh, taxi, xích lô thỉnh thoảng — thể hiện đông đúc | cô bán bánh mì xe đẩy, chú xe ôm ngồi chờ, bé cầm bóng bay đợi qua đường, cụ bán vé số | Tháp đồng hồ (`clock`), Chợ Bến Thành, Cây sao, Xe buýt, Xe máy | làm đầu tiên để dựng `lane`; trời không hạc (`none`) |
| 2 | **Hạ Long** (biển) | hè, sáng | `lane` thuyền buồm nâu cánh dơi trôi chậm qua vịnh + sóng lấp lánh | ngư dân kéo lưới trên bè, cá nhảy ở lồng cá, mực/sứa nổi lên, bé vẫy từ nhà bè | Đảo đá (Trống Mái), Thuyền buồm, Hang đá, Làng chài, Lồng cá | `birds: gull`; có thể có cá heo nhảy (`burst`) |
| 3 | **Hội An** (lễ hội & đồ chơi) | chiều tà/tối (đèn sáng) | `emitter`/`lane` hoa đăng trôi trên sông Hoài + đèn lồng đung đưa liên tục | bé thả hoa đăng, bà bán đèn lồng, ông lái đò, bé cầm diều | Chùa Cầu, Đèn lồng, Hoa đăng, Thuyền, Nhà cổ | tranh nền nên ở giờ hoàng hôn; đêm thì đèn phát sáng (lớp glow) |
| 4 | **Ninh Bình** (số 1–10) | lúa chín tháng 5–6 | `lane` thuyền nan chèo chân nối đuôi đi vào miệng hang rồi khuất | trâu gặm cỏ vẫy đuôi, cò trắng đáp xuống ruộng, người chèo nghỉ, dê núi trên vách | Núi đá, Hang, Ruộng lúa, Chèo chân, Trâu | số thuyền/cò đếm được, hợp chủ điểm đếm |
| 5 | **Sa Pa** (nông trại) | thu, lúa chín vàng | `emitter` mây/sương trôi qua sườn núi Fansipan + khói bếp nhà sàn | trâu, gà mẹ gà con, ngựa thồ, bé H'Mông địu gùi, vịt dưới ruộng nước | Núi mây, Ruộng bậc thang, Bản làng, Trâu, Ruộng nước | tôn trọng trang phục dân tộc (vẽ trang trọng, không chế giễu) |
| 6 | **Đà Nẵng** (bầu trời & thời tiết) | chiều/tối | `lane` dòng xe trên Cầu Rồng + `burst` rồng phun lửa/nước theo đợt; đêm đèn cầu đổi màu | người câu cá trên kè sông Hàn, bé thả diều, cô chạy bộ | Cầu Rồng, Lửa rồng, Sông Hàn, Cao ốc, Cầu quay | chủ điểm thời tiết: tỉ lệ thời tiết đa dạng hơn |
| 7 | **Huế** (màu sắc & hoa) | xuân, mưa phùn nhẹ | `lane` thuyền rồng trôi chậm trên sông Hương + diều đung đưa trên trời | cô gái áo dài nón lá (tà áo bay), bà bán chè, bé cầm bó hoa, ông chèo đò | Ngọ Môn, Sông Hương, Thuyền rồng, Cầu Tràng Tiền, Áo dài | tỉ lệ mưa cao hơn; Ngọ Môn vẽ trang trọng |
| 8 | **Nha Trang** (quần áo đi biển) | hè, nắng | `wave` sóng vỗ bờ + ca nô/thuyền thúng ngoài khơi (`lane`) | bé đội mũ, kính râm xây lâu đài cát, cua chạy, cô bán dừa, ông nằm dù | Tháp Bà, Hòn đảo, Biển, Thuyền thúng, Bãi cát | quần áo vật đứng trùng từ học (hat, glasses, t-shirt, dress, shoe, socks); Tháp Bà vẽ trang trọng |
| 9 | **Đà Lạt** (vườn rau) | thu-đông, dã quỳ vàng | `lane` tàu hơi nước ra vào ga + `emitter` khói tàu và sương đồi thông | cô bán dâu tây, bé hái cà rốt, thiên nga đạp trên hồ, ngựa kéo | Ga Đà Lạt, Tàu hơi nước, Đồi thông, Hồ Xuân Hương, Hoa | có sương sớm, trời mát |
| 10 | **Cần Thơ** (trái cây) | sáng sớm (chợ họp) | `lane` ghe xuồng chợ nổi trôi liên tục + cây bẹo treo hàng đung đưa | cô bán trái cây chèo xuồng, ghe chở dưa hấu, bé ăn trái thơm, chú pha cà phê trên xuồng | Cây bẹo, Dưa hấu, Chợ nổi, Trái thơm, Bến Ninh Kiều | `birds: none` hoặc cò |
| 11 | **Phú Quốc** (bữa ăn) | hoàng hôn cố định | `wave` sóng + `lane` thuyền câu mực ra khơi, mặt trời lặn chậm | ngư dân vá lưới, gia đình ăn cơm trên nhà sàn, chó Phú Quốc vẫy đuôi, bé nhặt vỏ sò | Hoàng hôn, Làng chài, Nhà sàn, Thuyền thúng, Lưới cá | trời giữ hoàng hôn (không chọn ngẫu nhiên ban ngày); đêm thì thuyền câu mực sáng đèn |

### Thứ tự làm

1. Động cơ `lane` + TP.HCM (nét riêng rõ nhất, chủ điểm xe).
2. Các nơi dùng `lane` trên nước: Hạ Long, Ninh Bình, Cần Thơ, Huế.
3. `emitter` tổng quát (sương, khói, hoa đăng): Sa Pa, Đà Lạt, Hội An.
4. `wave`: Nha Trang, Phú Quốc. 5. `burst` phát sáng + đổi màu đêm: Đà Nẵng.

Mỗi nơi: chat Hà Nội (hoặc chat mới có `hanoi-v6-bg.png` do chủ dự án đính kèm) → nền → sprite (đứng yên, và sprite cho nét liên tục: xe/thuyền 4–6 khung lặp vòng, mặt quay sang phải) → ghép thử (`anim6.py`, `preview.html`) → chủ dự án duyệt → `embed-scene.py` → biển/thú cưng ở `placeArtPhoto.ts` → `pnpm lint && pnpm test && pnpm ui:audit` → cập nhật docs/17, roadmap, commit.

## Tiến độ 11 cảnh (2026-11-04, tối)

Đã vẽ trong chat Hà Nội (ChatGPT Image), **chưa nhúng vào app**. Lưu ở `scripts/design-data/review/kids-games/` (đã gitignore `*.png`); `*-WRONG.png` là bản tải nhầm, bỏ qua; dùng `sapa-sprites-B-fixed`, `phuquoc-sprites-A-fixed`.

- Nền: `hcm-bg`, `halong-bg`, `hoian-bg` (không đèn lồng, đèn lồng là sprite riêng), `ninhbinh-bg`, `sapa-bg`, `danang-bg`, `hue-bg`, `nhatrang-bg`, `dalat-bg`, `cantho-bg`, `phuquoc-bg`.
- Sprite (6×3): `<nơi>-sprites-A` (vật đứng yên) và `-B` (xe/thuyền/sóng/khói); riêng `hcm-sprites-A/B`, `hoian-lanterns` (đèn lồng lắc, glow bằng code), `danang-fx` (lửa, nước phun từ miệng rồng, hướng phun cần lật theo đầu rồng), `cantho-sprites-C` (xuồng chèo 2 mái hai bên, thay hàng 3 của B), `phuquoc-sprites-A` (dùng bản `-fixed`).
- Còn làm: động cơ `lane`/`emitter`/`wave`/`clock`, glow đèn lồng Hội An, ghép thử (`anim6.py`), chủ dự án duyệt, `embed-scene.py`.
- Đà Nẵng: `danang-bg` và `danang-bg-v2` sai (cầu đứt đoạn, đầu rồng rời thân). Tham khảo ảnh thật (Wikimedia Commons `Cầu Rồng.jpg`): sàn cầu xám đen liền một dải trên các trụ bê tông, thân rồng là ống vàng liền thành chuỗi vòm nhỏ dần về bên trái bám vào sàn bằng dây cáp, đầu ngóc lên ở đầu cầu. Dùng `danang-bg-v3` (đầu rồng ~70 % chiều ngang, quay phải, miệng mở trống, bên phải để trống cho lửa/nước) với `danang-fx` không cần lật ngang.

### Công cụ dựng 11 cảnh (2026-11-04)

- Cấu hình mỗi nơi: `scripts/design-data/scene_cfg/<nơi>.py` (`CFG`: vật đứng/loop `actors`, dòng vật `lanes`, `sky`, `mist`, `clock`, `birds`); id nơi: hcmc, halong, hoian, ninhbinh, sapa, danang, hue, nhatrang, dalat, cantho, phuquoc.
- Dựng: `python scripts/design-data/scene_build.py <nơi> [--composite] [--embed]` → `review/kids-games/out/<nơi>/` (spec.json, webp, `composite.png` ghép tĩnh theo y chân). `--embed` ghi vào app, **chỉ chạy sau khi chủ dự án duyệt** (và sửa `placeArtPhoto.ts`).
- Tách nền sheet RGB/RGBA nền trắng: loang từ viền ô (`matte_cell`); cờ `deholes: True` ở actor/variant xoá thêm nền kín giữa nét vẽ, chỉ bật cho hàng không có màu trắng thật.
- Xem trước chạy bằng đúng logic app: `node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/bin/esbuild src/renderer/study/kids/game/sceneAnim.ts --bundle --format=iife --global-name=SA --outfile=scripts/design-data/review/scene-preview/sa.js`, chạy server `scene-preview-all` (`.claude/launch.json`, cổng 8767), mở `http://localhost:8767/scene-preview/preview.html?place=<nơi>`.
- Engine mới trong `sceneAnim.ts`: `loop` (sóng, khói, đèn lồng, diều), `LaneRunner` (dòng vật, y1/s1 đường chéo, fade, trong một làn vật không vượt nhau nên tách làn nhanh/chậm), mist, clock, glow; `SceneAnim.vue` hỗ trợ tất cả, `.scene-anim` có `isolation: isolate` (z-index vật/lá không thoát ra ngoài lớp cảnh). Test: `sceneAnim.test.ts` (17).
- QA Opus 2026-11-04 và các việc còn lại: mảng nền kín còn lẻ tẻ; vệt gợn nước ông câu cá Đà Nẵng nằm trên gạch; HCMC chỉ có một sprite xe máy; mỗi frame render lại cả component, lane dùng left/top (nên chuyển sang transform nếu giật); chưa chạy thử trong Electron.
- Vòng sửa theo chủ dự án + QA Opus vòng 2 (2026-11-04): Hội An lane chéo theo lòng kênh (`s0`/`s1`), Ninh Bình một lane `dir 0 + exclusive`, Sa Pa/Đà Lạt sương riêng (`gen_mist.py` → `sceneAnim/mist/`), Đà Nẵng lửa/nước chỉ ban đêm (`night`, bộ lập lịch bỏ qua vật night ban ngày, `lalign` căn mép trái để gốc lửa ở miệng rồng, `flip` cho nước, `erase` vệt nước ông câu cá), HCM thêm 6 loại xe (sheet C, D), Huế sửa halo + làn sông, Cần Thơ/Phú Quốc tránh cọc tre và nhà sàn. Công cụ thêm: `erase`, `crop`, `lalign`, `deholes` mạnh hơn (gỡ halo). Còn lại: chưa xem lại động trong trình duyệt sau đợt này, bé thả hoa đăng Hội An có thể còn vệt gờ đá nhỏ.
- Đã nhúng 11 cảnh vào app (2026-11-04): `scene_build.py <nơi> --embed`, biển chạm ở `placeArtPhoto.ts` (toạ độ ước từ ảnh, chỉnh khi thử tay). Đà Nẵng: lửa lật ngang như nước; thuyền chỉ chạy trong x 300–1800 để không vào gốc cây trái.

## Làm lại nền 5 nơi sau khi chủ dự án thử tay (2026-11-05) — CHƯA làm, chờ chủ dự án tạo ảnh

Phản hồi: biển chạm đè nhau / đặt trên vật di chuyển. **Luật mới:** biển chạm chỉ đặt trên vật CỐ ĐỊNH vẽ sẵn trong nền (công trình, cây, đảo, thuyền neo); không đặt trên vật có sprite chạy (`lane`) như thuyền thúng, thuyền rồng, ghe. Hai biển cách nhau ≥ 200 px ngang (nhãn rộng ~170 px) hoặc ≥ 90 px dọc (ảnh gốc 1672×941).

| Nơi | Vấn đề | Việc làm |
|---|---|---|
| Đà Nẵng | điểm không hợp, thiếu Cầu quay sông Hàn | nền mới (prompt dưới); Cầu Rồng ở giữa-trái, cầu quay xa phía sau bên phải; biển: Cầu Rồng, Lửa rồng, Sông Hàn, Cao ốc, Cầu quay |
| Nha Trang | "Thuyền thúng" đặt trên vật chạy | nền mới có vài thuyền thúng ÚP/NEO trên cát (cố định); sprite thuyền thúng ngoài khơi vẫn chạy nhưng biển chạm đặt ở thuyền neo trên cát |
| Huế | biển đè nhau; sông Hương/thuyền rồng nhỏ, bị chặn | nền mới: sông Hương rộng bên trái + Cầu Tràng Tiền rõ; thuyền rồng NEO ở bến (cố định, vẽ trong nền); `lane` sông bỏ hoặc chỉ cho thuyền nhỏ |
| Sa Pa | ruộng nước | nền mới ruộng bậc thang (prompt dưới); bỏ sprite vịt ở ruộng nước (`duck`) |
| Cần Thơ | cây bẹo/chợ nổi/trái thơm đè lên | ĐÃ sửa toạ độ trong `placeArtPhoto.ts` (đặt trên cọc bẹo cố định); nền giữ nguyên |
| TP.HCM | đồng hồ thiếu vạch/số | ĐÃ thêm 12 vạch giờ + số 12-3-6-9 trong `SceneAnim.vue` (chưa xem bản chạy) |

Sau khi có nền: đặt `<nơi>-bg.png` vào `scripts/design-data/review/kids-games/`, chỉnh `scene_cfg/<nơi>.py` (toạ độ vật), `scene_build.py <nơi>`, duyệt, rồi `--embed` và cập nhật `spots` ở `placeArtPhoto.ts`.

Prompt cảnh (dán sau GLOBAL STYLE, theo [mẫu](#mẫu-prompt-cảnh)):

```markdown
# SCENE — DA NANG, VIETNAM
SEASON / TIME: summer afternoon, warm light.
LEFT: a few modern high-rise towers and green hills across the river.
CENTRE: the golden Dragon Bridge (Cau Rong) arching over the Han River, dragon head at its right end (mouth closed, no fire).
RIGHT-BACKGROUND: the Han River Swing Bridge (Cau quay song Han), a long white steel bridge with a rotating middle span and tall lattice towers, clearly visible in the distance, slightly smaller than the Dragon Bridge.
FOREGROUND: pink bougainvillea bush at the left edge.
GROUND (bottom third, empty): river promenade of stone tiles with a low carved balustrade.
CHARACTERISTIC DETAILS: lamp posts on the bridge; calm teal river with white wavy strokes, empty of boats.
SKY: plain empty light blue sky only.
```

```markdown
# SCENE — NHA TRANG, VIETNAM
SEASON / TIME: summer, bright sun.
LEFT: Po Nagar Cham towers (Thap Ba) on a green hill, dignified and clearly drawn.
CENTRE: calm turquoise bay with ONE green island on the horizon.
RIGHT: coconut palms and a thatched beach hut at the edge.
FOREGROUND ON SAND (fixed, parked): two round basket boats (thuyen thung) turned upside down / moored on the sand in the middle of the beach, well apart from each other.
GROUND (bottom third, empty): open golden sand.
SKY: plain empty light blue sky only.
```

```markdown
# SCENE — HUE, VIETNAM
SEASON / TIME: spring, soft light.
LEFT: a wide Perfume River (Song Huong) filling the left third, with the long arched Truong Tien Bridge clearly visible across it; a decorated dragon boat MOORED at a stone landing on the bank (docked, still).
CENTRE: Ngo Mon Gate, dignified, stone base and golden-roof pavilion.
RIGHT: apricot blossom branch at the top corner, a red lantern post.
GROUND (bottom third, empty): stone paved courtyard.
KEEP landmarks well apart so labels do not overlap.
SKY: plain empty light blue sky only.
```

```markdown
# SCENE — SA PA, VIETNAM
SEASON / TIME: autumn, ripe golden rice.
CENTRE / RIGHT: steep hillsides carved into many curved TERRACED RICE FIELDS stepping down in layers (ruong bac thang), golden-yellow ripe rice, NOT flat flooded paddies; Fansipan peak far behind.
LEFT: a few stilt houses of a hill village on the slope.
GROUND (bottom third, empty): dirt path with dotted edges and grass.
SKY: plain empty pale blue sky only.
```
