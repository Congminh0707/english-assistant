# 24 — Thẻ từ vẽ bằng ChatGPT Image (nét bút + màu bột)

Từ 2026-11-03 thẻ từ vựng (Kids World, 189 từ) được tạo bằng ChatGPT Image theo từng batch (lưới 4×4, hiếm khi 3×3 hoặc 3×1, nền trong suốt), thay hướng chibi SVG tự vẽ ở [14-roadmap](14-roadmap.md). Prompt từng batch: [25-card-batch-prompts.md](25-card-batch-prompts.md).

- Ảnh gốc: `C:\Users\01217\Downloads\EnglishCard\Batch N.png` (ngoài repo, giữ lại để cắt lại khi cần).
- Cuộc trò chuyện gốc: https://chatgpt.com/share/6ae9d85e-03dc-83ec-961c-3de654783f86 (trang cần JS, AI không đọc được; lấy prompt bằng cách dán vào chat). Một batch có thể được tạo lại nhiều lần trong chat: **lấy prompt cuối cùng của batch đó.**
- Nguồn ảnh: ChatGPT Image. Chủ dự án tự kiểm điều khoản thương mại trước khi phát hành, rồi ghi nguồn vào [08-content-sources](08-content-sources.md).

## Cách chạy một batch (tạo ảnh mới hoặc làm lại)

1. **Chuẩn bị hai ảnh tham chiếu** gửi kèm prompt:
   - ảnh 1 (phong cách): sheet đã duyệt, hiện là Batch 4 (động vật & thiên nhiên);
   - ảnh 2 (nội dung): ảnh chụp các thẻ vector cũ của đúng các từ trong batch, để giữ chủ thể, tư thế, màu chính.
2. **Dán** [GLOBAL INSTRUCTIONS](#global-instructions) + prompt batch (theo [mẫu](#mẫu-prompt-batch)). Đặt tên ảnh tải về `Batch N.png`, thư mục `Downloads\EnglishCard`.
3. **Điền thứ tự id** 16 hình (trái → phải, trên → dưới) vào [`scripts/design-data/cards-batches.json`](../scripts/design-data/cards-batches.json). Id phải là id hình trong `shared/pictures*.ts` (thường là từ tiếng Anh viết thường, `T-shirt` → `tshirt`). Lưới khác 4×4 khai `{ "grid": [cột, hàng], "ids": [...] }`.
4. **Cắt:** `python scripts/design-data/cut-cards.py N --preview` (bỏ `N` để cắt hết). Xem `scripts/design-data/review/cards-ink/preview-batch-N.png` (luôn xem ảnh trước khi báo xong).
5. `pnpm vitest run src/renderer/shared/art/cards.test.ts`; đo dung lượng, cập nhật [17-metrics](17-metrics.md).
6. **Không chạy `export-cards.py`** sau đó (nó ghi đè lại thẻ vector cũ cùng id).

Tiến độ: batch 1–13 (188 từ) đã cắt 2026-11-03, ≈ 4,1 MB (`art/cards` 4,5 MB). `umbrella` chưa có trong batch nào (giữ thẻ vector cũ).

### Tool cắt (`cut-cards.py`)

- Không chia theo ô lưới (ChatGPT hay đặt vật lệch ô, hai vật sát nhau). Mỗi bước: tách vật theo cụm điểm ảnh liên thông trên cả sheet → lấy N cụm lớn nhất làm vật chính → cụm nhỏ (chấm đếm, tia nắng, râu, chiếc tất thứ hai) gắn vào vật có phần gần nhất, mảnh vụn xa bị bỏ → sắp theo thứ tự đọc (chia theo tâm y thành `hàng` nhóm, mỗi nhóm sắp theo tâm x).
- Mỗi thẻ: crop khít, căn giữa khung vuông 256 (vật tối đa 92%), WebP q86 nhúng base64 trong `art/cards/<id>.svg` nên `PictureImage.vue` và `cards.test.ts` không đổi. ≈ 22 KB/thẻ.
- Cảnh báo khi tách được ít cụm hơn số id: batch bị bỏ qua, xem ảnh gốc, tạo lại hoặc chỉnh tay. Thẻ ra thiếu/dư mảnh thì chỉnh `MIN_PART`, `MAX_GAP` đầu file.
- Cần Python 3 với `Pillow`, `numpy` (chạy `python`, không dùng `-I`).

### Lỗi gặp và cách tránh

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| Chân thú/thân hoa bị cắt | chia lưới cố định, vật tràn ranh ô | tách theo cụm liên thông (đã làm) |
| Hai vật (mom + grandpa) thành một thẻ | dãn mask để nối phần rời làm hai vật sát nhau dính | không dãn mask, gắn phần phụ theo khoảng cách |
| Chấm của "seven" sang "ten" | chấm gần chữ 10 hơn chữ 7 | gắn dần theo khoảng cách tới bất kỳ phần nào đã thuộc vật |
| Số chấm đếm sai | ChatGPT vẽ sai | đếm trên preview, tạo lại batch |

## GLOBAL INSTRUCTIONS

Dán nguyên văn ở đầu prompt của mọi batch (trừ Batch 4, batch đầu tiên, prompt riêng ở [25](25-card-batch-prompts.md#batch-04--animals--nature)). Kèm hai ảnh tham chiếu.

```markdown
# GLOBAL INSTRUCTIONS — VOCABULARY PICTURE-CARD SPRITE SHEETS

I attach TWO reference images.

**IMAGE 1 — ART STYLE REFERENCE**
Use this image as the primary reference for illustration style, line quality, color treatment, proportions, visual consistency and overall artistic appearance.

**IMAGE 2 — CONTENT REFERENCE**
This image contains the current vocabulary cards for the batch. Use it as the reference for the exact subjects, poses, main colors, recognizable features and visual ideas of each item.

## REFERENCE PRIORITY

- Follow IMAGE 1 for the illustration style.
- Follow IMAGE 2 for the subject matter and visual identity of each vocabulary item.
- Redraw every subject as a polished illustration in the requested art style.
- Preserve the original subject, pose, main colors, recognizable features and concept from IMAGE 2 as closely as possible.
- Keep the exact item order specified in the batch prompt.
- Do not omit, duplicate, merge, replace or rearrange any item.
- Do not copy card frames, borders, backgrounds, shadows, text labels, numbers used as labels or decorative interface elements from IMAGE 2. Only redraw the vocabulary subjects themselves.

## ART STYLE — VERY IMPORTANT

Hand-drawn children's picture-book illustration, combining loose, confident pen-and-ink linework with opaque gouache paint.

**Linework**

- Use dark warm-brown ink outlines.
- Lines should look genuinely hand-drawn, slightly irregular and organic.
- Use varied line weight: thicker outer contours and thinner inner details.
- Allow small natural wobbles and subtle imperfections.
- Avoid perfectly uniform vector outlines, mechanical geometry or overly clean digital strokes.
- Keep linework confident, clear and readable at small mobile-game icon sizes.

**Gouache painting**

- Use opaque, matte gouache paint with a soft, chalky and velvety appearance.
- Include subtle visible brush-stroke texture and slightly uneven paint density.
- Use flat, layered gouache shapes with a second darker or lighter tone for shadows and highlights.
- Allow subtle dry-brush edges and tiny natural paint irregularities.
- The paint should feel handmade, like a carefully illustrated children's picture book.

**Colors**

- Use warm, cheerful, bright colors with a slightly softened, painted quality.
- Keep colors rich and attractive, but never neon or excessively saturated.
- Maintain consistent color richness and lighting across the entire sheet.
- Use simple, clearly separated color areas so each subject remains recognizable.

**STRICTLY AVOID**

- No gradients.
- No glossy or plastic-looking highlights.
- No airbrush effects.
- No 3D rendering.
- No photorealism.
- No flat corporate vector appearance.
- No smooth digital gradient shading.
- No excessive texture that makes the subjects visually messy.

## CHARACTER FACIAL FEATURES RULE — CRITICAL

There are exactly TWO categories allowed to have facial features:

**1. HUMANS — MUST HAVE COMPLETE FACES**

- Every human character must have two eyes, a small nose, a smiling mouth and soft pink cheeks.
- Use friendly, natural children's picture-book expressions.
- Preserve age-appropriate facial proportions.
- Do not accidentally omit the eyes or nose from human characters.

**2. ANIMALS — MUST HAVE FRIENDLY ANIMAL FACES**

- Every animal must have recognizable species-appropriate facial features.
- Use two simple dark-brown ink-dot eyes, a small nose or appropriate animal snout, a friendly mouth and soft pink gouache cheeks where suitable.
- Keep expressions cute, gentle and child-friendly.
- Preserve the recognizable anatomy of each animal.

**3. EVERYTHING THAT IS NOT A HUMAN OR AN ANIMAL MUST BE COMPLETELY FACELESS**
Never add eyes, noses, mouths, cheeks, eyebrows or facial expressions to:

- Fruits and vegetables.
- Flowers, trees and plants.
- Sun, moon, stars, clouds, rainbows and weather objects.
- Hearts, symbols and decorative shapes.
- Food, drinks and desserts.
- Vehicles, tools, furniture, clothes, electronics and everyday objects.
- Snowmen and other constructed non-animal subjects.

Make non-animal objects appealing through their shapes, colors, proportions and gouache painting only.

**ABSOLUTE RULE: HUMAN = FACE. ANIMAL = FACE. EVERYTHING ELSE = NO FACE.**

## SPRITE SHEET LAYOUT

- Follow the exact grid dimensions specified in the batch prompt.
- Each subject occupies one individual grid cell.
- Keep all subjects visually centered and similarly sized.
- Use consistent visual scale and proportions across the sheet.
- Leave comfortable, even transparent spacing between subjects.
- Do not allow subjects to touch or overlap neighboring cells.
- Keep every subject fully visible, with no cropped parts.
- Use a transparent background (true alpha transparency).
- No background scenery, floor, card frames, borders, grid lines or decorative panels.
- No text, captions, labels, logos or watermarks.
- No cast shadows outside the subject.
- Output one complete, clean sprite sheet with every requested item.

The entire sheet must look like it was illustrated by ONE artist, using the same pen, gouache paint, color palette, texture, line weight and lighting throughout.
```

## Mẫu prompt batch

Sau GLOBAL INSTRUCTIONS, mỗi batch có cùng khung; chỉ đổi tiêu đề, lưới, danh sách chủ thể và quy tắc mặt.

```markdown
# Batch NN — <Chủ đề>

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. <Từ> — <mô tả hình, giữ chủ thể/tư thế/màu chính theo IMAGE 2>. <Động vật/người: mô tả mặt. Vật khác: "No face.">
2. ...

**Row 2** ...

**IMPORTANT FACIAL RULE**
<liệt kê con vật/người PHẢI có mặt; mọi thứ còn lại PHẢI không mặt>
```

Quy tắc viết mô tả chủ thể (rút từ các batch đã làm):

- Động vật và người: nêu rõ "friendly eyes, small nose/muzzle, gentle smile, soft pink cheeks". Con dễ đáng sợ (rắn, cá mập, sói): thêm "child-friendly, non-scary".
- Vật không sống: kết câu bằng "No face." Với vật dễ bị vẽ thành mặt thì nói rõ: đèn xe, màn hình, mặt đồng hồ, kính ("do not draw eyes behind the lenses"), người tuyết ("no carrot nose, no coal eyes").
- Số: "a large, clearly readable numeral N" kèm "exactly N small, separate counting dots underneath it"; cuối prompt nhắc "do not add extra dots". Kiểm số chấm trên preview.
- Màu: "puddle of bright X liquid paint… no container, no candy, no gem, no face".
- Cờ, mũ, trà…: "Reproduce the exact … shown in IMAGE 2" để không bị thay đổi.
- Số ô khác 16: ghi đúng "Exactly N subjects / Strict C columns × R rows" và khai `grid` trong `cards-batches.json`.
