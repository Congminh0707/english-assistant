# 20 — Prompt cho Claude Design (thiết kế lại giao diện)

Tài liệu này là **prompt dán thẳng vào Claude Design** để làm lại toàn bộ giao diện English Assistant. Phần trong khối `~~~` (từ "BEGIN PROMPT" đến "END PROMPT") là prompt; viết bằng tiếng Anh vì công cụ thiết kế hiểu tốt nhất, còn **chữ hiển thị trong app vẫn là tiếng Việt** (có ví dụ cụ thể bên dưới).

Cách dùng gợi ý: dán cả prompt ở lượt đầu → cho ra **Design system + 3 hướng thẩm mỹ** → chọn 1 hướng → yêu cầu lần lượt từng nhóm màn hình (mục 6) → xuất token/ảnh để đưa lại vào `tokens.css` / `ui.css` theo [18-ui-rules.md](18-ui-rules.md).

Số liệu trong prompt lấy từ [17-metrics.md](17-metrics.md) (đo 2026-10-30); khi đổi, sửa cả hai nơi.

~~~
=== BEGIN PROMPT ===

# ROLE
You are a senior product designer + design-systems lead. Redesign the full UI of a desktop app called "English Assistant". Deliver a coherent design system first, then high-fidelity screens. Be opinionated: give me a strong, distinctive visual identity, not a generic SaaS look.

# 1. PRODUCT IN ONE PARAGRAPH
English Assistant is a Windows desktop app (Electron + Vue 3 + Tailwind) that helps Vietnamese speakers learn English while they use their computer — from preschool kids to adults aiming for TOEIC 990 / IELTS 9.0. A small chibi **desktop mascot** (a virtual pet) lives on the desktop, walks along the taskbar, talks in speech bubbles, nags gently to study, and grows as the learner studies. Learners also get a **quick-translate popup** (select text → hotkey → popup near the cursor) and a full **Study window** (flashcards with spaced repetition, lessons, reading, listening, grammar, phrasebook, placement test, stats, pet shop). A separate **Kids mode** (ages ~3–10) has its own playful UI, including a fullscreen 3D cartoon map of Vietnam where a child travels to landmarks (Hội An, Hạ Long, Huế…) to learn 183 picture-words. It is fully offline-capable, free to use, with a gamified "feed your pet with coins earned from learning" loop.

Tone/feel: warm, friendly, playful but not childish for adults; calm and focused during study; delightful for kids. Think "cozy farm-sim meets a modern language-learning app", NOT "corporate office software".

# 2. SURFACES TO DESIGN (5 distinct windows)
1. **Mascot window** — transparent frameless always-on-top window: the pet sprite + speech bubbles + small interaction cards. Must never steal focus; must look good on any wallpaper (light, dark, busy).
2. **Quick-translate popup** — small floating card near the cursor (≈ 380×260). Word, IPA, speaker buttons (US/UK), CEFR badge, part of speech, main Vietnamese meaning (large), example sentence, actions: Save / Details / Pin. Keyboard: Esc close, S save, Space pronounce.
3. **Study window (adult/teen)** — resizable desktop window, min ≈ 800px wide, comfortable at 1100+. Left sidebar nav + top status strip + content area.
4. **Kids mode** — big, friendly, touch-friendly UI inside the same window (tap targets ≥ 64px), almost no text, icon + picture + voice driven.
5. **Kids World game stage** — fullscreen 3D cartoon map (three.js, toon shading + ink outlines) with a game HUD on top. You design the HUD, cards, overlays, and the art direction of the map UI; the 3D models themselves already exist.

# 3. HARD CONSTRAINTS (do not violate)
- Platform: Windows 10/11 desktop, mouse + keyboard primary (kids also use touch). Offline app: **no web-font CDN assumptions** — pick fonts that can be bundled (OFL / open license) and that **fully support Vietnamese diacritics** (ă â đ ê ô ơ ư + all 5 tone marks, uppercase too) **and IPA symbols** (ə ʃ ʒ θ ð ŋ ˈ ˌ ː). Suggest a UI font, a display/heading font, and an IPA-capable fallback.
- **NO pixel-art look anywhere** (the owner has moved on from it): no pixel fonts, no stepped/pixelated borders or shadows, no 8-bit icons, no pixelated sprites. All UI is flat modern: rounded corners, thin borders, soft shadows, Lucide-style line icons. Characters, items and badges are redrawn as **smooth modern vector/illustrated chibi art** (soft gradients or flat shapes, rounded forms, optional subtle ink outline) — propose that style and show the 5 characters (and their 5 evolution stages) in it.
- Icons: a single consistent **line-icon set (Lucide-style, 2–2.2px stroke)**. **No emoji as icons.** Same action = same icon everywhere (speaker = listen, bookmark = save word, mic = speak).
- Design tokens only (no one-off hex/px): radii **8 / 12 / 16 / pill(999)**; spacing scale **4 / 8 / 12 / 16 / 24**; type scale **12 / 13 / 14 / 16 / 20 / 26**; button heights **24 / 30 / 36 / 44**; shadows `sm` + `md`. You may propose new values but must present them as a token table I can paste into CSS variables, and keep the scale small.
- Existing semantic colors to keep as roles (you may re-tune the exact hues): primary (blue, main action), success (green), warning (amber), danger (red), **XP/level (purple)**, **coin (gold)**; each with a "soft" tint for badges. Current values for reference: bg `#fdf6e3` (cream paper), surface `#ffffff`, ink `#2b2b3a`, ink-soft `#6b6b80`, primary `#5b8def`, success `#4caf6a`, warning `#f2b33d`, danger `#e05a5a`, xp `#9b6bff`, coin `#f5c542`, line `#e3e6ee`, surface-2 `#f3f5fa`.
- **Light + Dark themes** required for everything (system-following). Provide both token sets.
- Accessibility: text contrast ≥ 4.5:1 (AA), visible 2px keyboard focus ring, never use color as the only right/wrong signal (add icon + text), full keyboard support (Tab/Enter, number keys 1–4 to pick answers), user-adjustable text size 90–150% (layouts must not break at 150%), respect `prefers-reduced-motion` (animations ≤ 150ms for UI; no flashing).
- Kids safety/UX: no red countdown timers, no harsh "wrong" buzzer visuals — use gentle "Thử lại nhé!" (Try again!) style feedback; no external links; settings/parent area behind a PIN gate.
- Mascot must be **quiet-mode friendly**: design a visible-but-calm "quiet/sleeping" state (pet asleep, 💤-style indicator drawn as soft vector/line icon), and a hidden-for-30-min state.
- Copyright: all characters, icons, art direction must be **original**. Do not imitate or reference existing trademarked characters/IP (no Pokémon, Spider-Man, Duolingo owl, Tamagotchi etc.). Style inspiration by *mood* only is fine.
- Mixed-language UI: all UI strings are Vietnamese (with English learning content). Use real Vietnamese copy in mockups (examples in §7), never lorem ipsum, and leave ~30% extra width for Vietnamese strings.

# 4. CURRENT STATE (what exists today — improve it, don't just recolor)
- Study window: left sidebar (avatar, level, nav list), top strip (today's progress bar, streak), content cards. It already moved from heavy-outline pixel UI to flat modern UI (pixel is now fully retired); it still feels generic/"admin dashboard", icons and cards are plain, there is little personality, and the pet/mascot barely appears inside the Study window. Nav pages today (14): Home, Courses, Lessons, Reading, Listening, Grammar, Phrasebook, Review (SRS), Practice, Word list, Pet, Shop, Stats, Placement test, Settings (+ Parent area for child profiles).
- Mascot bubbles and popup were recently flattened to the modern style; they work but are visually plain.
- Kids mode uses a "soft 3D" button style (thin border + thicker bottom edge, big radius) and class set `.k-*`; the 3D map HUD uses chunky round game buttons with thick ink outlines.
- Characters (original; CURRENT art is low-res pixel sprites that must be REPLACED by a modern vector style; 5 evolution stages each: Egg → Baby → Teen → Adult → Legendary): **Bi** (round chibi creature, default), **Webby** (masked spider-hero-ish kid, original design), **Draco** (dragon), **Robo** (robot with glowing visor), **Kitsu** (fox, tails grow 1→3). 20+ animations (idle, walk, sleep, eat, happy, sad, dance, wave, think…). 41 shop items (17 foods, 20 accessories, 4 buyable characters).
- Content scale (so empty/full states are realistic): 43,434-word offline dictionary, 43 base lessons, 40 grammar points, 50 reading passages, 30 listening tracks, 108 phrasebook sentences, 3 courses / 14 units, 21 Vietnam landmark "places" in 3 world tiers.

# 5. DELIVERABLES — IN THIS ORDER
**Step A — Brand & visual direction (3 options).** Propose **three** clearly different directions (e.g., "Cozy Paper Farm" warm/cream hand-crafted; "Soft Arcade" playful bold gradients; "Calm Focus Ink" minimal editorial with one accent). For each: mood words, palette (light + dark) with token names, typography pairing (with Vietnamese support), corner/border/shadow language, illustration & icon style, motion personality, and one hero mockup of the Study Home screen. Then **recommend one** and explain why for this audience (teen/adult commuters at their PC + kids).

**Step B — Design system for the chosen direction.** Deliver:
1. Foundations: color tokens (light/dark, semantic + soft tints + data-viz palette for 6 skills: listening, speaking, reading, writing, vocabulary, grammar), type scale, spacing, radii, shadows, z-layers, motion tokens (durations/easings).
2. Components with all states (default/hover/active/focus/disabled/loading/error): buttons (primary, success, danger, ghost, icon-only, pill, block; sizes xs/sm/md/lg), chips/badges (CEFR A1–C2, status, counters), cards (flat, interactive, selected, locked), list rows, inputs/selects/switches/sliders/segmented controls/tabs, progress bars (linear, XP, circular), tooltips, toasts, modals/dialogs, empty states, skeleton loaders, sidebar nav item, stat tile, chart styles (activity heatmap calendar, bar, line, accuracy-by-type bars).
3. Learning-specific components: flashcard (front/back/flip, with IPA + audio + save), SRS rating buttons (Again / Hard / Good / Easy with next-interval hints), multiple-choice answer list (idle/selected/correct/wrong — with icon + color), word-order (drag chips) board, match-pairs board, fill-in-the-blank, audio player with speed 0.75×/1×/1.25×, reading passage with tappable words + inline word popover, dictation input, pronunciation/speaking recorder with waveform + score ring, lesson progress header, "Check" bar that slides up with feedback (correct/incorrect + explanation), streak flame + daily-mission list, level badge + XP bar, coin wallet, shop item card (food/accessory/character; owned/locked/can't afford), pet stat bars (hunger, mood, energy, affection).
4. Iconography: list the icon set (name → concept) for the ~40 icons needed, plus rules.
5. Mascot UI kit: speech-bubble variants (say, word-of-the-moment card with "Show / Skip", quick SRS quiz with 3 choices, level-up, reminder-to-rest-eyes, translate-prompt chip after copy), bubble tail behavior (flips left when pet is at right screen edge, max width 260px, text ≥ 14px), right-click context menu (Học ngay · Dịch · Cho ăn · Chơi · Ẩn 30 phút · Cài đặt · Thoát), tray menu, pet-stats mini panel, evolution full-screen celebration overlay.
6. Kids kit: big 3D-soft buttons, 4-tile home (Chơi / ABC / Sticker / Thú cưng), activity cards, star rating (3 stars), sticker album page, tracing-letter canvas frame, parent gate (PIN keypad), parent report.
7. Kids World HUD kit: home button, total stars + flowers counter, sound toggle, watering-can (due-reviews counter), tier selector, place label (English big, Vietnamese small), "Bắt đầu" start card with picture preview, locked-place fog + padlock, place-done flag/chest-open celebration, 5-step visit progress (Meet → Tap picture → Play → Speak → Listen to sentence).

**Step C — High-fidelity screens** (light + dark, desktop ≈ 1100×720 unless stated; plus one ≈ 800px-wide variant of Home and Review to prove responsiveness). Do them in the groups in §6. For each screen show: default state, plus the key alternate states listed.

**Step D — Interaction & motion spec.** Short spec for: card flip, answer correct/incorrect feedback, XP gain / level-up, coin earn → fly to wallet, feeding the pet (drag food to pet), evolution overlay, bubble appear/dismiss, page transitions, kids celebration (confetti), fog dissolve on unlock. Include durations/easings, and the reduced-motion fallback for each.

**Step E — Handoff.** Provide: (1) a CSS-variables token sheet (`:root` and `[data-theme="dark"]`) matching the names in §3 (`--c-*`, `--c-*-soft`, `--r-sm/md/lg/pill`, `--shadow-sm/md`, `--sp-1…5`, `--fs-xs…2xl`, `--btn-h`, `--btn-h-sm`), (2) a component inventory with class names in the pattern `.btn .btn--primary .btn--sm`, `.card`, `.chip .chip--success`, `.page-title`, (3) Tailwind theme extension snippet, (4) a short rules page ("do / don't") in the style of a UI rulebook, (5) an export of icons as SVG.

# 6. SCREEN LIST (design these)
**Group 1 — Mascot & popup (transparent windows; show over a busy wallpaper AND over a white document)**
- Pet idle on taskbar edge with stats bubble open (Hunger / Mood / Energy / Affection, level, XP, coins).
- "Word of the moment" bubble (word, IPA, tiny meaning, Show / Skip).
- Quick SRS quiz bubble (question + 3 choices; correct and wrong feedback).
- Quick-translate popup: word result (noun, CEFR A2, "appointment /əˈpɔɪntmənt/ — cuộc hẹn"), sentence translation result, "word not found" state, offline-translation vs. AI-translation state, pinned state.
- Right-click menu; tray menu; quiet mode (pet asleep); level-up/evolution celebration.

**Group 2 — Study window core**
- First-run onboarding (create profile: adult vs. child; choose goal TOEIC / IELTS / daily communication / kids; choose a starter pet among 5; placement-test offer).
- Placement test (adaptive; question screen, progress, result with level per skill A1–C2 radar/bars).
- Study Home: today's plan (due SRS cards count, next lesson, weakest skill suggestion), 3 daily missions, streak + streak-freeze ticket, big "Bắt đầu học" CTA, pet companion widget, XP/level, coins. Provide an empty state (new user) and a busy state.
- Review (SRS) session: card front, card back, rating buttons with intervals, session complete summary.
- Words list (search among 43k, filter by level/topic, saved-word notebook with context sentences), word detail drawer (meanings, IPA, audio US/UK, examples, forms, synonyms, CEFR).

**Group 3 — Learning modules**
- Courses (3 courses → units → lessons map/path with locked/in-progress/done), Lesson viewer + exercise screen (all 6 exercise types), correct/incorrect feedback bar, lesson complete screen.
- Reading (passage list by level, reader with tappable words and word popover, comprehension questions).
- Listening (track list, player with speed control, dictation exercise, fill-the-blank, results).
- Grammar (list by CEFR level, point page: short explanation + examples + exercises).
- Phrasebook (situation categories, sentence cards with listen + repeat).
- Practice / Speaking (record, waveform, pronunciation score ring with per-word highlights).

**Group 4 — Pet, shop, stats, settings**
- Pet page: character select (5), evolution tree per character (locked stages as silhouettes "???"), stats, feed/play actions, equipped accessories preview.
- Shop: tabs Foods / Accessories / Characters; item cards equal height, buttons bottom-aligned; states: affordable, can't afford, owned, equipped.
- Stats: activity calendar heatmap (full width), study-time chart, per-skill rating (Elo-like) lines, accuracy by exercise type with red/amber/green bars, predicted IELTS band / TOEIC score, streak history.
- Settings: sections (General, Mascot [size 1×/2×/3×, quiet mode rules, reminder frequency, "word of the moment" interval], Hotkeys [`Ctrl+Alt+T`], Voice/TTS [US/UK], AI provider [None / Local / Claude / OpenAI / Gemini + API key field], Language, Theme, Text size, Data export/import, Parent controls), with a good pattern for long settings pages.

**Group 5 — Kids mode**
- Kids Home (4 big tiles), Kids Review (listen → tap the picture, 3 options, gentle feedback), ABC activities hub (7 activity types: letters, sounds, blending, sight words, picture books, tracing, speak-along), tracing canvas, Sticker album, Kids Pet, Parent gate + Parent area (time limit per day, 7-day report, PIN setup, "time's up" gentle sleep screen).

**Group 6 — Kids World game stage (fullscreen 16:9 stage, HUD overlay)**
- Map overview (3D toon map of Vietnam, ~12 places on tier 1; show 2 places locked under fog, 1 recommended place with a pulsing ring, pet traveling in a convertible/boat/plane along a dirt road, floating place labels with English big + Vietnamese small, 3 stars + flower count).
- Arrive at place → close-up camera + "Bắt đầu" card with picture preview of the words.
- 5-step visit screens inside the stage (Meet, Tap picture, Match game, Speak along, Listen to sentence) with oversized cards and the kid-safe feedback style.
- Place complete: chest opens, confetti, flag raised, sticker earned; tier-unlock moment (fog dissolving, zoom-out to next tier).
- 2D fallback map variant (for low-end GPUs): same HUD.

# 7. REAL COPY TO USE (Vietnamese UI strings)
Nav: Trang chủ · Khoá học · Bài học · Đọc · Nghe · Ngữ pháp · Mẫu câu · Ôn tập · Luyện tập · Sổ từ · Thú cưng · Cửa hàng · Thống kê · Kiểm tra đầu vào · Cài đặt.
CTAs: Bắt đầu học · Kiểm tra · Tiếp tục · Bỏ qua · Lưu từ · Nghe lại · Thử lại nhé! · Giỏi lắm! · Mai mình học thêm nhé!
Ratings: Quên · Khó · Được · Dễ.
Status: Hôm nay: 12/20 phút · Chuỗi 7 ngày · Lv 12 · 340 XP · 1.250 xu · Đến hạn ôn: 18 thẻ · Hunger/Đói · Vui · Năng lượng · Thân thiết.
Mascot lines: "Đến giờ ôn từ rồi nè!" · "Cậu làm việc lâu rồi, nghỉ mắt chút nhé." · "Từ của khoảnh khắc: *appointment* — cuộc hẹn."
Kids: Chơi · ABC · Sticker · Thú cưng · Bắt đầu · Làm quen · Chạm hình · Chơi · Nói theo · Nghe câu.
Places (examples): Sa Pa · Hà Nội · Vịnh Hạ Long · Ninh Bình · Huế · Đà Nẵng · Hội An · Nha Trang · Đà Lạt · Sài Gòn · Cần Thơ · Phú Quốc.
Sample content: word *appointment* /əˈpɔɪntmənt/ noun A2 "cuộc hẹn"; example "I have a dental appointment at 3 p.m."; kids words like *crab, boat, lantern, temple*.

# 8. DESIGN QUALITY BAR
- Distinctive identity: a recognizable logo/wordmark for "English Assistant" + app icon (Windows 256px, tray 16px) tied to the mascot; propose a name lockup that works in Vietnamese.
- Strong hierarchy: max **one** primary button per screen; consistent card heights and aligned button rows in grids; generous but not wasteful whitespace on a laptop 1366×768 screen.
- Delight with restraint: pet appears contextually inside Study screens (reacts to correct answers, sleeps when idle, shows in empty states) without blocking content.
- Motivation without anxiety: streak/XP/coin feedback feels rewarding but never shames or punishes the learner; "freeze ticket" instead of harsh streak loss.
- Data-viz: clear, accessible, colorblind-safe series; same colors for the same skill everywhere.
- Consistency across the 5 surfaces: Kids and Game HUD may be chunkier and more saturated but must share the same token roots (hue family, radii steps, icon set) so the product feels like one brand.
- Density: Adult Study = comfortable-compact; Kids = spacious and oversized.

# 9. OUTPUT FORMAT
Work step by step (A → E). After each step, summarize decisions in a short list, then continue. Present screens as a labeled gallery (Light / Dark side by side). Use realistic Vietnamese content everywhere. Where a decision is a trade-off, state it in one sentence and pick a default. Do not ask me clarifying questions unless something is blocking; make sensible assumptions and list them at the end.

=== END PROMPT ===
~~~

## Ghi chú cho người dùng prompt

- **Trước khi áp thiết kế vào code**: đọc lại [18-ui-rules.md](18-ui-rules.md) (ngoại lệ game) — **bản prompt này đã bỏ hẳn phong cách pixel, kể cả nhân vật** và sửa tài liệu này **trước** nếu hướng thiết kế mới đổi quy tắc ([18 §8.4](18-ui-rules.md)). Đổi token → `tokens.css`, `ui.css`; chạy `pnpm ui:audit` (0 lỗi) và `pnpm lint && pnpm test`.
- Font mới phải ghi license vào [08-content-sources.md](08-content-sources.md) trước khi đưa vào repo.
- Có thể đính kèm cho Claude Design: ảnh chụp các màn hiện tại (Study Home, Review, Kids Home, bản đồ 3D, bong bóng mascot), sprite 5 nhân vật (`content/.build/characters-preview.png` bằng `PREVIEW=1 pnpm sprites:characters`), và `src/renderer/shared/styles/tokens.css`.
