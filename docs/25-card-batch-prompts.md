# 25 — Prompt từng batch thẻ từ

Prompt cuối cùng của mỗi batch đã dùng trong ChatGPT Image (batch tạo lại nhiều lần thì lấy bản cuối). Quy trình, GLOBAL INSTRUCTIONS và tool cắt: [24-card-art-prompts.md](24-card-art-prompts.md). Batch 1–3 và 5–13 dán GLOBAL INSTRUCTIONS trước prompt, kèm hai ảnh tham chiếu. Batch 4 là batch đầu tiên, chạy không có ảnh tham chiếu và ra sheet dùng làm ảnh phong cách (ảnh 1) cho các batch sau.

Thứ tự id hình của từng batch nằm ở [`scripts/design-data/cards-batches.json`](../scripts/design-data/cards-batches.json).

| Batch | Chủ đề | Lưới | Id (trái → phải, trên → dưới) |
|---|---|---|---|
| 1 | Family & Numbers | 4×4 | mom dad baby grandma grandpa house door bed chair television one two three four five six |
| 2 | Numbers & Colors | 3×3 | seven eight nine ten red blue yellow green pink |
| 3 | Sea & Farm Animals | 4×4 | boat fish crab octopus dolphin whale shark turtle wave shell horse cow pig chicken duck goat |
| 4 | Animals & Nature | 4×4 | sheep dog cat rabbit flower rose sunflower butterfly rainbow sun cloud moon star raindrop lightning bird |
| 5 | Objects & Celebrations | 4×4 | airplane kite lantern balloon gift drum ball bell cake candy crown guitar hat glasses tshirt dress |
| 6 | Clothes & Vegetables | 4×4 | shoe socks backpack watch headphones camera strawberry carrot tomato potato broccoli mushroom cucumber onion garlic corn |
| 7 | Vehicles & Fruits | 4×4 | car bus bicycle motorbike train van phone laptop clock key banana mango watermelon coconut pineapple orange |
| 8 | Fruits & Food | 4×4 | grapes lemon peach apple rice noodles bread egg soup milk spoon fork honey cookie sushi toothbrush |
| 9 | Fruits, Food & Wild Animals | 4×4 | cherry pear kiwi avocado salad panda tiger deer fox wolf bear mountain kangaroo koala ant frog |
| 10 | Animals & Western Food | 4×4 | bee snail swan elephant giraffe zebra lion monkey snake owl cheese coffee jam icecream pancake sandwich |
| 11 | American Food & Objects | 4×4 | chocolate pizza hamburger hotdog fries popcorn donut rocket torch flag books cactus scissors pencil llama volcano |
| 12 | Miscellaneous | 4×4 | mouse heart tree earth hammer fire trophy pyramid sand camel dome tulip tea brick snowman snowflake |
| 13 | Final Objects | 3×1 | piano penguin lightbulb |

Ghi chú nội dung: batch 4 đã soạn lại với mô tả riêng từng vật và quy tắc "chỉ động vật có mặt" (bản đầu cho hoa, mặt trời… có mặt, mâu thuẫn với quy tắc cấm). `umbrella` chưa có trong batch nào.

---

## Batch 01 — Family & Numbers

```markdown
# Batch 01 — Family & Numbers

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Mom — A friendly mother character, shown from the waist up or full body. Give her a warm, caring expression, a complete human face with two eyes, a small nose, a smiling mouth and soft pink cheeks. Preserve the clothing and hairstyle from IMAGE 2.
2. Dad — A friendly father character with a complete human face, two eyes, a small nose, a smiling mouth and soft pink cheeks. Preserve the hairstyle and clothing from IMAGE 2.
3. Baby — An adorable small baby character with a round baby face, two eyes, a tiny nose, a happy smiling mouth and soft pink cheeks. Preserve the original pose and clothing.
4. Grandma — A kind elderly grandmother with a complete human face, two eyes, a small nose, a gentle smile and soft pink cheeks. Preserve her hairstyle and clothing.

**Row 2**
5. Grandpa — A kind elderly grandfather with a complete human face, two eyes, a small nose, a gentle smile and soft pink cheeks. Preserve his original hairstyle, clothing and appearance.
6. House — A charming, recognizable small house with a roof, walls, windows and entrance. No face or anthropomorphic features.
7. Door — A simple recognizable door with its frame, panels and handle. No face.
8. Bed — A cozy bed with mattress, pillow and blanket. No face.

**Row 3**
9. Chair — A clearly recognizable chair with seat, backrest and legs. No face.
10. Television — A classic television set with a visible screen and controls. No face or facial expression on the screen.
11. One — A large, clearly readable numeral 1. Place exactly one small, separate counting dot beside or underneath it. No faces.
12. Two — A large, clearly readable numeral 2. Place exactly two small, separate counting dots underneath it. No faces.

**Row 4**
13. Three — A large, clearly readable numeral 3. Place exactly three small, separate counting dots underneath it. No faces.
14. Four — A large, clearly readable numeral 4. Place exactly four small, separate counting dots underneath it. No faces.
15. Five — A large, clearly readable numeral 5. Place exactly five small, separate counting dots underneath it. No faces.
16. Six — A large, clearly readable numeral 6. Place exactly six small, separate counting dots underneath it. No faces.

**IMPORTANT FACIAL RULE**

Only Mom, Dad, Baby, Grandma and Grandpa have human facial features. Every house, household object and number must remain completely faceless.

Numbers must be clean, correctly shaped and easy for young children to recognize. Do not add extra dots or decorative symbols to the numerals.
```

## Batch 02 — Numbers & Colors

```markdown
# Batch 02 — Numbers & Colors

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 9 individual subjects.
- Strict 3 columns × 3 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Seven — A large, clearly readable numeral 7. Place exactly seven small, separate counting dots beside or underneath it. The numeral and dots must be easy to count. No faces.
2. Eight — A large, clearly readable numeral 8. Place exactly eight small, separate counting dots beside or underneath it. No faces.
3. Nine — A large, clearly readable numeral 9. Place exactly nine small, separate counting dots beside or underneath it. No faces.

**Row 2**
4. Ten — A large, clearly readable numeral 10. Place exactly ten small, separate counting dots beside or underneath it. Keep the numeral 10 visually clear. No faces.
5. Red — A beautiful puddle of bright red liquid paint spilled onto a flat surface. Organic irregular splatter shape with naturally spreading edges, soft flowing paint, and subtle variations of red tones. Matte gouache paint texture, with a hand-painted appearance. No container, no candy, no gem, no face.
6. Blue — A beautiful puddle of bright blue liquid paint spilled onto a flat surface. Organic irregular splatter shape with naturally spreading edges, soft flowing paint, and subtle variations of blue tones. Matte gouache paint texture, with a hand-painted appearance. No container, no candy, no gem, no face.

**Row 3**
7. Yellow — A beautiful puddle of bright yellow liquid paint spilled onto a flat surface. Organic irregular splatter shape with naturally spreading edges, soft flowing paint, and subtle variations of yellow tones. Looks like real paint poured and spread out. No container, no candy, no gem, no face.
8. Green — A beautiful puddle of bright green liquid paint spilled onto a flat surface. Organic irregular splatter shape with naturally spreading edges, soft flowing paint, and subtle variations of green tones. Looks like real paint poured and spread out. No container, no candy, no gem, no face.
9. Pink — A beautiful puddle of bright pink liquid paint spilled onto a flat surface. Organic irregular splatter shape with naturally spreading edges, soft flowing paint, and subtle variations of pink tones. Looks like real paint poured and spread out. No container, no candy, no gem, no face.

**IMPORTANT**

- The numbers must be correctly written: 7, 8, 9 and 10.
- The counting dots must be exact: 7 dots, 8 dots, 9 dots and 10 dots respectively.
- Do not add extra dots, hidden dots or decorative circles that could be mistaken for counting dots.
- All numbers and dots must remain completely faceless.
```

## Batch 03 — Sea Animals & Farm Animals

```markdown
# Batch 03 — Sea Animals & Farm Animals

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Boat — A small, charming boat viewed from the side, with a clear hull and simple recognizable details. No face.
2. Fish — A cute colorful fish with a rounded body, fins, tail and scales. Give it friendly animal eyes, a small mouth and soft pink cheeks.
3. Crab — A cute crab with a rounded shell, two claws and multiple legs. Give it two friendly eyes and a small smiling mouth.
4. Octopus — A friendly octopus with a rounded head and eight clearly visible curling tentacles. Give it two eyes and a smiling mouth.

**Row 2**
5. Dolphin — A cheerful dolphin with a curved streamlined body, recognizable snout and fins. Give it friendly eyes and a smiling mouth.
6. Whale — A cute large whale with a rounded body, tail flukes and small fins. Give it friendly eyes and a gentle smiling mouth.
7. Shark — A child-friendly shark with a recognizable pointed snout, dorsal fin, side fins and tail. Give it friendly eyes and a gentle smile. Keep it non-scary.
8. Turtle — A cute turtle with a clearly patterned shell, head, four legs and tail. Give it friendly eyes and a small smile.

**Row 3**
9. Wave — A single stylized blue ocean wave with a curling crest and simple foam details. No face.
10. Shell — A beautiful recognizable seashell with curved ridges and natural details. No face.
11. Horse — A friendly horse standing in a recognizable pose, with mane, ears, muzzle and tail. Give it a complete friendly animal face.
12. Cow — A cute cow with recognizable spots, ears, horns, muzzle and legs. Give it friendly eyes, a nose and a gentle smile.

**Row 4**
13. Pig — A cute pink pig with rounded body, snout, ears and short legs. Give it friendly eyes and a small smiling mouth.
14. Chicken — A small chicken with feathers, beak, comb and wings. Give it friendly animal eyes and a cute expression.
15. Duck — A cute duck with a rounded body, wings, orange bill and feet. Give it friendly eyes and a gentle smile.
16. Goat — A friendly goat with recognizable horns, ears, beard and hooves. Give it friendly eyes and a small smile.

**IMPORTANT FACIAL RULE**
All animals must have faces: fish, crab, octopus, dolphin, whale, shark, turtle, horse, cow, pig, chicken, duck and goat.

Boat, wave and shell must remain completely faceless. Do not add anthropomorphic features to sea objects.
```

## Batch 04 — Animals & Nature

Batch đầu tiên: style viết thẳng trong prompt, không GLOBAL INSTRUCTIONS, không ảnh tham chiếu.

```markdown
# Batch 04 — Animals & Nature

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**ART STYLE (VERY IMPORTANT)**

Hand-drawn children's picture-book illustration: loose, confident pen-and-ink linework combined with opaque gouache paint.

- Line: dark-brown ink pen outlines, slightly irregular and hand-drawn, varied line weight (thicker on the outer contour, thinner on inner details). Small natural wobbles are welcome; do NOT use perfectly uniform vector strokes.
- Color: matte, opaque gouache fills — chalky, velvety, soft-edged, with faint brush-stroke texture and subtle uneven paint density. Slightly imperfect fill that does not always reach the ink line (tiny gaps of paper showing are fine).
- Palette: warm, bright, cheerful but slightly softened (poster-paint look), not neon and not glossy.
- Shading: flat gouache layering only — a second slightly darker or lighter tone for shadow and highlight shapes, with dry-brush edges. NO gradients, NO glossy highlights, NO airbrush, NO 3D rendering.
- Same pen weight, same paint texture and same lighting on every cell so the whole sheet looks painted by one hand.

**CHARACTER FACIAL FEATURES RULE (VERY IMPORTANT)**

- ONLY animals are allowed to have eyes, mouths, cheeks or facial expressions.
- ALL non-animal subjects MUST remain completely faceless: flower, rose, sunflower, rainbow, sun, cloud, moon, star, raindrop, lightning. No eyes, mouth, nose, cheeks or expressions on them, ever.
- Keep non-animal objects cute through shape, color, proportion and paint texture only.
- Animal faces (sheep, dog, cat, rabbit, butterfly, bird): friendly smile, large simple ink-dot eyes, soft pink gouache cheeks.

**LAYOUT**

- ONE image, strict grid of 4 columns × 4 rows (16 cells).
- Fully transparent background (PNG with alpha). If transparency is not possible, use pure flat white (#FFFFFF) with no paper texture.
- Minimum 60px empty padding between cells.
- One centered object per cell, filling about 75% of its cell.
- No borders, grid lines, cast shadows, scenery, text or watermark.
- Nothing cropped or overlapping.

**DESIGN RULES**

- Sheep: fluffy cream wool made of dabbed gouache clumps, small dark face and ears.
- Dog: friendly puppy, sitting, front view.
- Cat: sitting, front view, simple stripes optional.
- Rabbit: sitting, long upright ears with pink inner ear.
- Flower: one simple colorful flower with stem and two leaves.
- Rose: recognizable red rose with green stem and leaves.
- Sunflower: yellow petals, brown circular center, green stem.
- Butterfly: wings open, front view, simple colorful wing patterns.
- Rainbow: colorful curved rainbow with distinct bands.
- Sun: round yellow sun with short rays.
- Cloud: fluffy white-blue cloud.
- Moon: crescent moon.
- Star: five-pointed star.
- Raindrop: single blue water droplet with one highlight shape.
- Lightning: single yellow lightning bolt.
- Bird: small songbird, side-front view, simple wing and beak.

**EXACT ORDER — LEFT TO RIGHT, TOP TO BOTTOM**

Row 1: 1. sheep  2. dog  3. cat  4. rabbit
Row 2: 5. flower  6. rose  7. sunflower  8. butterfly
Row 3: 9. rainbow  10. sun  11. cloud  12. moon
Row 4: 13. star  14. raindrop  15. lightning  16. bird

IMPORTANT: Every object must be isolated, recognizable and consistent in hand-drawn ink + gouache style. Do not add extra flowers, scenery or multiple animals. Faces ONLY on animals.
```

## Batch 05 — Objects & Celebrations

```markdown
# Batch 05 — Objects & Celebrations

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Airplane — A small recognizable passenger airplane viewed from a three-quarter side angle. Show its fuselage, wings, cockpit windows, tail and engines. No face.
2. Kite — A colorful diamond-shaped kite with a simple tail and ribbons. Keep the shape clear and recognizable. No face.
3. Lantern — A traditional decorative lantern with a recognizable frame, top handle and warm-colored panels. No face.
4. Balloon — One inflated round party balloon with a tied neck and a thin string. Use a cheerful bright color. No face.

**Row 2**
5. Gift — A neatly wrapped present with a lid, ribbon and large bow. No face.
6. Drum — A small traditional or toy drum with a cylindrical body, drumhead and visible side details. No face.
7. Ball — A colorful round play ball with clear curved panel markings. No face.
8. Bell — A recognizable hanging bell with a rounded body, clapper and small top loop. No face.

**Row 3**
9. Cake — A cheerful celebration cake with frosting, layers and a few simple decorations. Preserve the specific cake design in IMAGE 2. No face.
10. Candy — A colorful wrapped candy with twisted ends and a clearly recognizable sweet shape. No face.
11. Crown — A small golden royal crown with distinct points and simple decorative details. No face.
12. Guitar — A recognizable guitar with a body, neck, strings and tuning pegs. Preserve the instrument type in IMAGE 2. No face.

**Row 4**
13. Hat — Reproduce the exact type and design of hat shown in IMAGE 2. Preserve its silhouette, brim, crown, main colors and recognizable details. Do not substitute another kind of hat. No face.
14. Glasses — A pair of recognizable eyeglasses with two lenses, bridge and arms. No face. Do not draw eyes behind the lenses.
15. T-shirt — A simple short-sleeved T-shirt with a clearly recognizable neckline and sleeves. Preserve the color and design from IMAGE 2. No face.
16. Dress — A cute recognizable dress with a clear bodice and skirt. Preserve the original shape and colors. No face.

**IMPORTANT FACIAL RULE**
All 16 subjects are non-animal objects and must remain completely faceless. Do not add eyes, noses, mouths, cheeks or expressions to any object.
```

## Batch 06 — Clothes & Vegetables

```markdown
# Batch 06 — Clothes & Vegetables

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Shoe — One clearly recognizable everyday shoe, showing its upper, sole, laces or straps as appropriate to IMAGE 2. No face.
2. Socks — A pair of socks arranged neatly together. Show their openings, heels and toes clearly. No face.
3. Backpack — A small school backpack with a main compartment, front pocket, shoulder straps and zipper details. No face.
4. Watch — A wristwatch with a clear circular or original reference-shaped dial, hands, case and strap. No face or facial features on the dial.

**Row 2**
5. Headphones — A recognizable pair of over-ear headphones with a curved headband and two ear cups. No face.
6. Camera — A compact camera with a lens, body, shutter button and simple controls. No face.
7. Strawberry — One ripe red strawberry with a heart-like silhouette, small surface seeds and a green leafy top. No face.
8. Carrot — One orange carrot with a tapered root, subtle ridges and a leafy green top. No face.

**Row 3**
9. Tomato — One ripe round red tomato with a green star-shaped calyx and short stem. No face.
10. Potato — One or two recognizable brown potatoes with irregular rounded shapes and a few small natural indentations. No face.
11. Broccoli — A single broccoli head with a textured cluster of green florets and a thick green stalk. No face.
12. Mushroom — One recognizable mushroom with a rounded cap and short stem. Preserve the color and type in IMAGE 2. No face.

**Row 4**
13. Cucumber — One fresh green cucumber with a long cylindrical shape, slightly tapered ends and subtle bumpy texture. No face.
14. Onion — One whole onion with papery outer skin, rounded shape and a small dried stem. No face.
15. Garlic — One whole garlic bulb with several clearly defined cloves beneath pale papery skin. No face.
16. Corn — One ear of corn with visible golden kernels and green husk leaves. No face.

**IMPORTANT FACIAL RULE**
All subjects in this batch are non-animal objects, clothing, accessories or vegetables. Every single item must remain completely faceless. Do not anthropomorphize any fruit or vegetable.
```

## Batch 07 — Vehicles & Fruits

```markdown
# Batch 07 — Vehicles & Fruits

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Car — A small recognizable passenger car viewed from a three-quarter angle. Include windows, wheels, headlights and doors. No face; headlights must not look like eyes.
2. Bus — A friendly-looking but completely faceless passenger bus with windows, wheels and front details. No eyes or mouth on the windshield or front.
3. Bicycle — A recognizable bicycle with two wheels, frame, handlebars, seat, pedals and chain. No face.
4. Motorbike — A small motorcycle with two wheels, handlebars, seat, fuel tank and visible body details. No face.

**Row 2**
5. Train — A recognizable train locomotive or carriage based on IMAGE 2, with wheels, windows and railway details. No face.
6. Van — A compact passenger or delivery van with windows, doors and wheels. No face.
7. Phone — A modern smartphone with a clear rectangular screen, rounded corners and simple side buttons. No face or expression on the screen.
8. Laptop — An open laptop showing its screen, keyboard and trackpad. No face or expression on the screen.

**Row 3**
9. Clock — A recognizable clock with a round or reference-specific body, clear numbers or markers and hands. No face.
10. Key — A single metal key with a recognizable bow and toothed blade. No face.
11. Banana — One ripe yellow banana, curved with a visible stem and tip. No face.
12. Mango — One ripe mango with its characteristic oval shape, subtle color variation and a small green leaf if appropriate. No face.

**Row 4**
13. Watermelon — A whole or cut watermelon matching IMAGE 2. Show recognizable green rind and red flesh with dark seeds if cut. No face.
14. Coconut — A whole or cut coconut with a recognizable fibrous brown shell and white flesh if shown cut. No face.
15. Pineapple — One pineapple with a textured golden body and spiky green crown leaves. No face.
16. Orange — One ripe orange fruit with a textured orange peel and a small green leaf if appropriate. No face.

**IMPORTANT FACIAL RULE**
All vehicles, electronics, everyday objects and fruits must remain completely faceless. Do not make headlights, screens or fruit markings resemble eyes or mouths.
```

## Batch 08 — Fruits & Food

```markdown
# Batch 08 — Fruits & Food

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Grapes — A small bunch of round grapes attached to a short stem with one or two leaves. Show clearly separated grape shapes. No face.
2. Lemon — One bright yellow lemon with an oval shape, slightly pointed ends and a subtle textured peel. No face.
3. Peach — One ripe peach with a rounded shape, soft indentation and characteristic pink-yellow skin. No face.
4. Apple — One fresh apple with a rounded shape, small stem and one green leaf. Preserve its color from IMAGE 2. No face.

**Row 2**
5. Rice — A small neat bowl or serving of cooked white rice, with individual grains visible. Follow the presentation in IMAGE 2. No face.
6. Noodles — A serving of noodles with clearly visible strands, arranged in a bowl or bundle as shown in IMAGE 2. No face.
7. Bread — A recognizable loaf or slice of bread with a golden crust and soft inner crumb. Preserve the exact bread type from IMAGE 2. No face.
8. Egg — One egg, either whole or cut/opened as shown in IMAGE 2. Clearly show the shell and/or yolk. No face.

**Row 3**
9. Soup — A small bowl of soup with visible broth and simple ingredients. Keep the bowl and food clearly recognizable. No face.
10. Milk — A glass, bottle or carton of milk matching IMAGE 2. Show the white milk clearly. No face.
11. Spoon — One simple metal or wooden spoon with a clear handle and bowl. No face.
12. Fork — One recognizable fork with a handle and distinct prongs. No face.

**Row 4**
13. Honey — A small honey jar or honey container with golden honey visible. Include a dipper only if shown in IMAGE 2. No face.
14. Cookie — One or a small group of recognizable cookies with baked texture and simple details. No face.
15. Sushi — A clearly recognizable sushi piece or small serving, with rice, seaweed and filling as appropriate to IMAGE 2. No face.
16. Toothbrush — One colorful toothbrush with a handle, neck and visible bristles. No face.

**IMPORTANT FACIAL RULE**
All fruits, food, drinks, utensils and everyday objects must remain completely faceless. Never add eyes, noses, mouths or expressions to food, bowls, containers or the toothbrush.
```

## Batch 09 — Fruits, Food & Wild Animals

```markdown
# Batch 09 — Fruits, Food & Wild Animals

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Cherry — A pair of ripe red cherries joined by curved green stems, with one or two leaves. No face.
2. Pear — One ripe pear with a recognizable rounded bottom, narrow neck and small stem. No face.
3. Kiwi — A whole or cut kiwi matching IMAGE 2. If cut, show the green flesh, pale center and tiny black seeds. No face.
4. Avocado — One avocado, preferably shown with a cut half if IMAGE 2 shows it. Include green flesh and a large brown pit. No face.

**Row 2**
5. Salad — A small colorful serving of fresh salad with recognizable green leaves and simple vegetable ingredients. No face.
6. Panda — A cute panda with a rounded black-and-white body, recognizable eye patches, ears and paws. Give it friendly eyes, a small nose, smiling mouth and soft pink cheeks.
7. Tiger — A cute tiger with orange fur, dark stripes, rounded ears and a recognizable muzzle. Give it friendly eyes and a gentle smile.
8. Deer — A gentle deer with a slim body, recognizable legs, ears and antlers if appropriate to IMAGE 2. Give it friendly eyes, a small nose and a gentle mouth.

**Row 3**
9. Fox — A cute fox with pointed ears, a narrow muzzle, orange fur and a bushy tail. Give it friendly eyes and a small smiling mouth.
10. Wolf — A friendly wolf with recognizable pointed ears, muzzle and fluffy fur. Give it gentle eyes and a friendly expression. Avoid a scary or aggressive appearance.
11. Bear — A cute bear with a rounded body, small rounded ears and a recognizable muzzle. Give it friendly eyes, a nose and a gentle smile.
12. Mountain — A simple recognizable mountain peak with slopes and a snowcap or natural details as shown in IMAGE 2. No face.

**Row 4**
13. Kangaroo — A cute kangaroo standing upright with long ears, strong hind legs, small forearms and a recognizable tail. Give it friendly eyes, a small nose and a smiling mouth.
14. Koala — A cute koala with large fluffy ears, round nose and soft gray fur. Give it friendly eyes and a gentle smile.
15. Ant — A small recognizable ant with three body sections, six legs and antennae. Give it two friendly eyes and a small smiling mouth.
16. Frog — A cute green frog with a rounded body, large eyes, visible legs and feet. Give it a small smiling mouth and soft pink cheeks.

**IMPORTANT FACIAL RULE**
Panda, tiger, deer, fox, wolf, bear, kangaroo, koala, ant and frog are animals and MUST have friendly facial features.

Cherry, pear, kiwi, avocado, salad and mountain are NOT animals and must remain completely faceless. Do not anthropomorphize fruit, food or nature scenery.
```

## Batch 10 — Animals & Western Food

```markdown
# Batch 10 — Animals & Western Food

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Bee — A cute little bee with a rounded yellow-and-black striped body, two wings, antennae and small legs. Give it two friendly eyes, a small smiling mouth and soft pink cheeks.
2. Snail — A cute snail with a rounded spiral shell, soft body, two eye stalks and a small foot. Give it friendly eyes and a gentle smile.
3. Swan — An elegant white swan with a long curved neck, orange beak and folded wings. Give it friendly eyes and a gentle expression.
4. Elephant — A cute baby elephant with a large rounded head, big ears, long trunk and short legs. Give it friendly eyes, a small mouth and soft pink cheeks.

**Row 2**
5. Giraffe — A cute giraffe with a long neck, small horns, recognizable spots and four legs. Give it friendly eyes, a small muzzle and a gentle smile.
6. Zebra — A friendly zebra with a recognizable black-and-white striped body, mane and four legs. Give it friendly eyes and a small smiling muzzle.
7. Lion — A cute lion with a rounded mane, ears, paws and tail. Give it friendly eyes, a small nose and a gentle smile.
8. Monkey — A playful monkey with a rounded body, long arms, legs and a curved tail. Give it friendly eyes, a small nose and a happy mouth.

**Row 3**
9. Snake — A cute snake with a curved or coiled body, recognizable scales and a small forked tongue if shown in IMAGE 2. Give it friendly eyes and a gentle smiling mouth. Keep it non-threatening.
10. Owl — A cute owl with a rounded body, two wings, feather tufts and recognizable facial disk. Give it two large friendly eyes and a small beak.
11. Cheese — A recognizable yellow cheese wedge with holes and a cut surface. No face.
12. Coffee — A cup or mug of coffee with visible brown coffee. Preserve the presentation from IMAGE 2. No face on the cup or drink.

**Row 4**
13. Jam — A small glass jar filled with colorful jam, with a lid and visible fruit-colored contents. No face.
14. Icecream — A scoop or serving of ice cream matching IMAGE 2, with a clearly recognizable scoop and cone or container. No face.
15. Pancake — A small stack of pancakes with rounded edges and visible layers. Add syrup or butter only if shown in IMAGE 2. No face.
16. Sandwich — A recognizable sandwich with bread slices and visible filling. Preserve the ingredients and shape from IMAGE 2. No face.

**IMPORTANT FACIAL RULE**
Bee, snail, swan, elephant, giraffe, zebra, lion, monkey, snake and owl are animals and MUST have facial features.

Cheese, coffee, jam, ice cream, pancake and sandwich must remain completely faceless. Do not add faces to food, drinks, cups or containers.
```

## Batch 11 — American Food & Miscellaneous Objects

```markdown
# Batch 11 — American Food & Miscellaneous Objects

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Chocolate — A recognizable chocolate bar or pieces of chocolate with clearly visible segments. Use rich brown gouache colors. No face.
2. Pizza — One triangular pizza slice with recognizable crust, cheese and toppings. Preserve the topping arrangement from IMAGE 2. No face.
3. Hamburger — A recognizable hamburger with a top bun, patty, cheese and vegetable layers. No face.
4. Hotdog — A hotdog in a long bun with a sausage and simple toppings. No face.

**Row 2**
5. Fries — A small serving of golden French fries in a paper container. Show several separate fries. No face.
6. Popcorn — A bucket or container filled with fluffy popcorn pieces. Preserve the container and colors from IMAGE 2. No face.
7. Donut — One round donut with a central hole and colorful frosting or sprinkles as shown in IMAGE 2. No face.
8. Rocket — A cute, clearly recognizable rocket with a pointed nose cone, body, fins and window. No face or expression on the window.

**Row 3**
9. Torch — A handheld flashlight with a cylindrical body, head, lens and button. No face.
10. Flag — Reproduce the exact flag shown in IMAGE 2. Preserve its correct colors, patterns and proportions. Do not invent or alter its design. No face.
11. Books — A small neat stack of books with visible covers, pages and spines. No faces or writing.
12. Cactus — A recognizable green cactus with a main upright stem and arms, with small spines. No face.

**Row 4**
13. Scissors — A recognizable pair of scissors with two handles, two blades and a central pivot. No face.
14. Pencil — One sharpened pencil with a visible graphite tip, wooden body and eraser if appropriate. No face.
15. Llama — A cute friendly llama with a long neck, fluffy wool, upright ears and four legs. Give it a complete animal face with two eyes, a small nose, a smiling mouth and soft pink cheeks. Preserve its recognizable llama appearance.
16. Volcano — A recognizable volcano with a cone-shaped mountain, crater and a small amount of flowing lava or smoke if shown in IMAGE 2. No face.

**IMPORTANT FACIAL RULE**
Llama is an animal and MUST have a friendly, complete animal face.

Every other subject in this batch is food, a plant or an object and must remain completely faceless. In particular, do not add faces to the rocket, cactus, volcano or food.
```

## Batch 12 — Miscellaneous Vocabulary

```markdown
# Batch 12 — Miscellaneous Vocabulary

Create a vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 16 individual subjects.
- Strict 4 columns × 4 rows grid.
- Read left to right, top to bottom.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**Row 1**

1. Mouse — A cute small mouse with a rounded gray body, large round ears, tiny paws, a long thin tail and a recognizable muzzle. Give it two friendly eyes, a small nose, a smiling mouth and soft pink cheeks.
2. Heart — One clearly recognizable heart shape with a warm red or pink gouache finish. No face, no eyes and no mouth.
3. Tree — A small recognizable tree with a trunk, branches and a rounded leafy canopy. No face.
4. Earth — A cute illustrated globe of planet Earth, with recognizable blue oceans and green landmasses. No face, no eyes and no mouth.

**Row 2**
5. Hammer — A recognizable hand hammer with a wooden or colored handle and metal head. Show the claw or striking face clearly. No face.
6. Fire — A single stylized flame with layered warm orange, yellow and red gouache shapes. No face.
7. Trophy — A golden trophy cup with two handles, a stem and a base. No face.
8. Pyramid — A recognizable ancient pyramid with triangular sides and simple stone-block details. No face.

**Row 3**
9. Sand — A small pile or mound of golden sand with a softly irregular shape and subtle grain texture. No face.
10. Camel — A friendly camel with a recognizable long neck, hump or humps, long legs and distinctive muzzle. Give it two friendly eyes, a small nose, a smiling mouth and soft pink cheeks.
11. Dome — A recognizable architectural dome with a curved roof and supporting base, following the reference design. No face.
12. Tulip — One beautiful tulip flower with a recognizable cup-shaped blossom, green stem and leaves. No face.

**Row 4**
13. Tea — A small cup or teapot of tea matching IMAGE 2. Show the tea clearly and preserve the original shape and color. No face on the cup, teapot or drink.
14. Brick — One or a small stack of recognizable red or terracotta bricks, with clear rectangular shapes and subtle surface texture. No face.
15. Snowman — A simple snowman made from stacked snowballs, with recognizable rounded body sections and winter accessories if shown in IMAGE 2. IMPORTANT: no eyes, no nose, no mouth and no facial expression. It must be completely faceless.
16. Snowflake — One clear symmetrical snowflake with delicate branching arms. Use pale icy blue or white gouache. No face.

**IMPORTANT FACIAL RULE**
Mouse and camel are animals and MUST have complete friendly animal faces.

Heart, tree, Earth, hammer, fire, trophy, pyramid, sand, dome, tulip, tea, brick, snowman and snowflake must remain completely faceless.

**SPECIAL WARNING:** Do not give the snowman a traditional carrot nose, coal eyes or coal mouth. The snowman must have no facial features at all.
```

## Batch 13 — Final Objects

```markdown
# Batch 13 — Final Objects

Create the final vocabulary picture-card sprite sheet for a children's English learning game.

**LAYOUT**

- Exactly 3 individual subjects.
- Strict 3 columns × 1 row grid.
- Read left to right.
- Transparent background.
- Follow the GLOBAL INSTRUCTIONS and reference images.

**SUBJECTS — EXACT ORDER**

**1. Piano**
A beautiful, clearly recognizable piano matching the design in IMAGE 2. Preserve its type, silhouette, proportions and main colors. Show the keyboard with clearly visible black and white keys. Include the piano body, legs and lid or other details if present in the reference. Use warm, hand-painted gouache surfaces and dark-brown hand-drawn outlines.

The piano is a non-living object. It must remain completely faceless. Do not add eyes, nose, mouth or expressions to the piano or its keys.

**2. Penguin**
A cute, friendly penguin standing upright, with a rounded body, black or dark-colored back, white belly, small wings, orange beak and orange feet. Preserve the pose and recognizable appearance from IMAGE 2.

The penguin is an animal and MUST have a friendly animal face: two dark-brown eyes, a small orange beak with a gentle smiling expression and soft pink gouache cheeks where appropriate.

**3. Lightbulb**
A clearly recognizable traditional lightbulb with a rounded glass bulb, visible filament and metal screw base. Use a warm yellow glow suggested through flat layered gouache paint shapes only. No gradients, airbrush or glossy effects.

The lightbulb is a non-living object. It must remain completely faceless. Do not add eyes, nose, mouth or expressions.

**IMPORTANT FACIAL RULE**

- Penguin: MUST have a friendly animal face.
- Piano and lightbulb: MUST remain completely faceless.

Keep the three subjects similarly sized, fully visible, centered in their own cells and separated by even transparent spacing.
```
