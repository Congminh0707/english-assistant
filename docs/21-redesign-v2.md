# 21 — Thiết kế lại giao diện v2: nhật ký (**chưa áp dụng vào app**)

> Đây là nhật ký quá trình, có nhiều hướng đã bỏ (pixel, Cozy Paper Farm, Webby). **Bản đã chốt ở [23](23-design-v2-spec.md).**

Nhật ký + quy tắc của đợt thiết kế lại toàn bộ app trên **Claude Design** (canvas riêng tư "English Assistant Redesign", chủ dự án có link). Prompt gốc: [20](20-claude-design-prompt.md). Quyết định: [decisions #39](decisions.md). Khi áp dụng vào code: sửa [12](12-ui-ux-guidelines.md), [18](18-ui-rules.md), [05](05-mascot-system.md), [19](19-kids-world.md) **trước** theo mục 3–6 dưới đây, rồi mới sửa code (đúng quy trình 18 §8.4).

> Quy ước làm việc (chủ dự án yêu cầu 2026-10-30): **mọi việc đã làm, kể cả thiết kế, phải ghi vào docs** để áp dụng sau. Cập nhật file này sau mỗi bảng thiết kế mới.

## 1. Trạng thái các bảng trên canvas

| Bảng | Nội dung | Trạng thái |
| --- | --- | --- |
| Direction + design system | 3 hướng, chọn **A · Cozy Paper Farm**; màu sáng/tối, chữ, bo góc, nút, chip, icon, nguyên tắc | v1, cần cập nhật theo mục 3 |
| Study · Trang chủ (sáng), Ôn tập (tối) | màn mẫu người lớn | v1 |
| Mascot + popup dịch nhanh | bong bóng, menu chuột phải, popup dịch | v1 |
| Kids · Trang chính; Kids World · HUD | ô to, HUD tròn viền mực | v1, HUD sẽ làm lại theo mục 5 |
| Nhân vật · **Kitsu** | 5 giai đoạn, 1→3→5→9 đuôi | ✅ **chủ dự án duyệt** (2026-10-30) |
| Nhân vật · **Robo** | 5 giai đoạn (nhộng máy → thiên sứ) | ✅ **chủ dự án duyệt** (2026-10-30) |
| Nhân vật · **Bi v3** | mầm → cánh lá → cánh hoa → **hoa tiên** (cánh cầu vồng, mandala quay, đài sen) | v3 chờ duyệt ("tiến hoá wow hơn") |
| Nhân vật · **Draco v4** | rồng bánh bao tròn dễ thương → cánh vàng khổng lồ (rồng phương Tây mềm) | v4 chờ duyệt (v3 bị chê xấu) |
| Nhân vật · **Webby v4** | **nhện công (peacock spider)** xoè quạt, thoát xác; **bỏ dạng người** | v4 chờ duyệt (v3 dạng người bị bỏ) |
| Hoạt ảnh · Kitsu 6 trạng thái | idle, vui, ăn, ngủ, ngạc nhiên, lên cấp (CSS keyframes) | ✅ làm xong, chờ duyệt |
| **Kids World · Bản đồ Việt Nam 34 tỉnh** | ranh giới thật sau sáp nhập, 12 địa danh, tuyến xe/thuyền/máy bay, mây, mưa, giờ thật | ✅ chờ duyệt |
| Kids World · Tầng 2 Châu Á / Tầng 3 Trái Đất | bản đồ thật (Natural Earth), 12 địa danh mỗi tầng, máy bay bay từ Việt Nam / quả cầu xoay, đêm-ngày theo giờ | ✅ chờ duyệt |
| Kids World · Hoà mình vào Hội An | cảnh toàn màn hình hoàng hôn, 5 điểm chạm học, đèn lồng, thuyền, cầu Nhật Bản | ✅ chờ duyệt |
| Kids World · Thời gian & thời tiết | 8 trạng thái: bình minh, ngày, hoàng hôn, đêm, nhiều mây, mưa, giông, tuyết + quy tắc | ✅ chờ duyệt |
| Kids World · Di chuyển (xe, thuyền, máy bay) + dáng thú cưng | cảnh cuộn parallax, 6 dáng thú cưng (đi, chạy, nhảy, vẫy, nhìn quanh, ăn mừng) | ✅ chờ duyệt |
| Kids · Hoạt ảnh bài học vui | thẻ lật, đúng/sai nhẹ nhàng, thanh sao, combo, ghép cặp | ✅ chờ duyệt |
| Parent · Khu phụ huynh | theme người lớn, KPI, biểu đồ 7 ngày, giới hạn, từ cần ôn, PIN | ✅ chờ duyệt |

## 2. Dữ liệu & công cụ đã dùng (để làm lại khi áp dụng)

- **Danh sách 34 tỉnh/thành sau sáp nhập (7/2025):** `https://provinces.open-api.vn/api/v2/p/` (tên, mã). API **không có ranh giới**.
- **Ranh giới:** geoBoundaries VNM ADM1 (63 đơn vị cũ, phạm vi công cộng) → ghép thành 34 theo Nghị quyết 202/2025/QH15 bằng `scripts/design-data/vn-provinces-merge.py` (shapely `unary_union`, giản lược 0,012°). Côn Đảo gộp vào TP.HCM. **Hoàng Sa** (Đà Nẵng), **Trường Sa** (Khánh Hòa) vẽ cụm đảo theo toạ độ (112°E 16,5°N; 114°E 10°N).
- **Tỉ lệ thật:** chiếu equirectangular hiệu chỉnh cos(16°), **66 px/độ vĩ → 1 px ≈ 1,7 km** (≈ 1:6,3 triệu trên màn 96 dpi); thanh tỉ lệ 200 km trên bản đồ. Muốn 1:10.000.000 giảm K còn ≈ 42 px/độ.
- **Châu Á & Trái Đất:** Natural Earth 50 m (phạm vi công cộng) bằng `scripts/design-data/world-maps.py` (châu Á equirect; quả cầu chiếu orthographic + bản đồ phẳng nhỏ).
- **Tạo bảng:** `scripts/design-data/vn-map-board.py` + `vn-map-board.tpl.html` (sinh file `.dc.html` cho canvas).
- ⚠️ Nguồn mới (geoBoundaries, Natural Earth, provinces.open-api.vn) phải ghi vào [08](08-content-sources.md) **trước** khi đưa dữ liệu vào repo/app (đã thêm dòng chờ duyệt ở 08 §8c).

## 3. Quy tắc giao diện v2 (nháp — thay dần 18 khi áp dụng)

1. **Không pixel ở bất kỳ đâu** (chữ, viền, icon, nhân vật, huy hiệu): giao diện phẳng hiện đại; nhân vật/vật phẩm/huy hiệu vẽ vector mềm.
2. **Hướng A · Cozy Paper Farm:** nền giấy kem `#FBF4E4`, bề mặt trắng, viền be mảnh `#E6DCC3`, nút chính "nổi" 2 px (viền + bóng dưới đậm), không viền đen dày ở giao diện người lớn.
3. **Màu (sáng):** ink `#2B2B3A`, ink-soft `#5E5E73`, primary `#3F6FE0`, success `#2F8F52`, warning `#B9770E`, danger `#C94444`, xp `#7B4FE0`, coin `#E8B22E`; thêm tông `-soft` cho chip. **Tối:** bg `#1B1B26`, surface `#25253A`, line `#3A3A55`, primary `#7C9CFF`. **6 kỹ năng:** Nghe `#3F6FE0`, Nói `#D6568B`, Đọc `#2F8F52`, Viết `#E8B22E`, Từ vựng `#7B4FE0`, Ngữ pháp `#2B8FA8`.
4. **Chữ:** *Be Vietnam Pro* (UI, nội dung), *Baloo 2* (tiêu đề, số), *Noto Sans* dự phòng IPA — cả ba OFL, **phải đóng gói vào app** và ghi license ở 08 trước. Thang 12/13/14/16/20/26.
5. **Bo góc** 8/12/16/pill, **khoảng cách** 4/8/12/16/24, **nút** cao 24/30/36/44 (giữ như 18).
6. **Icon:** Lucide nét 2,2; không emoji (kể cả trong bong bóng thoại mascot).
7. **Nhân vật:** đầu to ~60% thân, mắt to có 2 điểm sáng, má hồng, **không viền đen** (chỉ đổi sắc), bóng đổ nhạt dưới chân; đọc được ở 48 px và 144 px.
8. **Tiến hoá phải thấy bằng hình dáng**, không chỉ thêm phụ kiện: đổi tỉ lệ cơ thể, số bộ phận (đuôi/chân/cánh), áo giáp/vảy, hào quang. Mỗi giai đoạn nhìn silhouette đã phân biệt được.
9. **Chuyển động:** squash & stretch, đuôi/phần phụ lệch pha, chớp mắt tự nhiên, vòng lặp ≥ 0,5 s, tối đa 3 vật chuyển động cùng lúc; **`prefers-reduced-motion` → đứng yên**; mascot yên lặng chỉ dùng trạng thái Ngủ.
10. Giao diện **bé**: cùng họ màu/bo góc/icon, nút to ≥ 64 px, không đồng hồ đỏ, phản hồi sai nhẹ nhàng. Giao diện **phụ huynh**: dùng theme người lớn (bình tĩnh), không dùng nút game (mục 6).

## 4. Tiến hoá nhân vật (yêu cầu của chủ dự án, 2026-10-30)

Nguyên tắc chung: **tiến hoá phải thấy bằng hình dáng**, đầu to/mắt to/dễ thương ở mọi cấp; cấp cuối "thoát xác" hoặc đổi dạng như hồ ly.

| Nhân vật | Trạng thái | Chuỗi tiến hoá (bản thiết kế hiện tại) |
| --- | --- | --- |
| **Kitsu** (cáo) | ✅ duyệt | trứng → cáo con (1 đuôi, lá) → cáo trẻ (3 đuôi, lửa ma, yếm Inari) → hồ ly (5 đuôi, ngọc hoshi no tama) → **cửu vĩ thiên hồ** (9 đuôi, lông trắng vàng, vòng sáng). Cập nhật docs/05 (đang ghi 1→3 đuôi). |
| **Robo** | ✅ duyệt | nhộng máy → Robo con → Robo trẻ (ăng-ten, giày phản lực) → chiến hữu (cánh tản nhiệt) → thiên sứ (thân ngọc trai vàng, cánh sáng, hào quang) |
| **Bi** | chờ duyệt v3 | trứng mầm → Bi con → **Bi lá** (cánh lá, nụ) → **Bi cánh hoa** (cánh bướm bằng cánh hoa) → **Bi hoa tiên** (cánh cầu vồng, mandala 12 cánh quay, đài sen, vương miện 3 hoa) |
| **Draco** | chờ duyệt v4 | trứng → rồng con tròn như bánh bao → rồng non (cánh nhỏ) → phi long (cánh rộng, 4 sừng, đuôi lửa) → **Long vương** (cánh vàng khổng lồ kiểu rồng phương Tây, lửa trên đầu). Đã bỏ góc nhọn/răng nanh dữ vì "xấu". |
| **Webby** | chờ duyệt v4 | kén tơ → nhện bông (2 mắt) → nhện nhảy (8 chân, 6 mắt) → **nhện công** (xoè quạt tơ 7 sắc có "mắt công") → **thoát xác** (bỏ lớp vỏ, quạt vàng–pha lê). **Đã bỏ dạng người/siêu anh hùng nhện** (v3) theo góp ý. |

Quy tắc vẽ nhân vật (v2): vector mềm không viền đen, màu theo biến CSS (`--g`, `--b`...), phần phụ (cánh, quạt, đuôi) đặt trong nhóm riêng để làm hoạt ảnh; hoạt ảnh gồm thở, chớp mắt, phụ kiện lệch pha; `prefers-reduced-motion` tắt hết. Tạo bảng bằng `scripts/design-data/char-boards-v4.py` (Draco, Webby, Bi) và `char-boards-v3.py` (gốc, còn helper).

## 5. Thế giới của bé v2 (yêu cầu, thay/bổ sung docs/19 khi áp dụng)

- **Tầng 1 — Việt Nam:** vẽ **đủ 34 tỉnh thành** theo ranh giới thật (mục 2), tỉ lệ đúng; mỗi tỉnh có ≥ 1 địa danh nổi tiếng để ghé (hiện có 12, **chưa cần thêm**, nhưng bản đồ phải đúng); công trình càng chi tiết càng tốt.
- **Vào địa danh = hoà mình:** chạm → thú cưng đi theo đường → camera phóng sát → cảnh địa danh toàn màn hình, các phần học (5 bước) là các "điểm chạm" trong cảnh.
- **Tầng 2 — châu Á:** vẽ lục địa châu Á (nước, biên giới), địa danh là nơi nổi tiếng của châu lục (Vạn Lý Trường Thành, Phú Sĩ, Taj Mahal, Angkor Wat, Petronas…). **Tầng 3 — thế giới:** vẽ Trái Đất với các châu lục, địa danh nổi tiếng thế giới (Eiffel, Kim tự tháp, Nữ thần Tự do, Opera Sydney…). Dữ liệu đã tạo (mục 2).
- **Thời gian thật + thời tiết:** theo giờ máy (bình minh, ngày, hoàng hôn, đêm có trăng/sao), thời tiết thật (nắng, mây, mưa, giông, tuyết ở vùng lạnh) lấy online khi có mạng, mặc định theo giờ + mùa khi offline; mây trôi, mưa/tuyết rơi, đèn lồng bật ban đêm.
- **Di chuyển:** xe/thuyền/máy bay và thú cưng phải chuyển động mượt, có trọng lượng (bánh quay, thân nhún, bọt/vệt nước, nghiêng cánh); thú cưng có dáng đi/chạy/nhảy/vẫy tay riêng, không trượt.
- **Bài học vui:** hoạt ảnh phản hồi (thẻ lật, đúng nảy + pháo giấy, sai lắc nhẹ, thanh sao đầy, combo), thú cưng phản ứng theo kết quả.
- **Khu phụ huynh:** chỉ cần theo **theme người lớn** + nâng cao trải nghiệm (luồng rõ ràng, báo cáo dễ đọc, đặt giới hạn thời gian nhanh), **không** dùng giao diện game.

## 6. Việc còn lại (đánh dấu khi xong)

- [x] Làm lại Webby (nhện công), Draco (rồng dễ thương), Bi (wow) — **chờ chủ dự án duyệt**.
- [x] Bảng tầng 2 (châu Á), tầng 3 (Trái Đất), cảnh Hội An, thời tiết/giờ, di chuyển, hoạt ảnh bài học, khu phụ huynh (2026-10-30).
- [ ] Duyệt xong nhân vật → làm bộ 6 hoạt ảnh trạng thái (idle, vui, ăn, ngủ, ngạc nhiên, lên cấp) cho Bi, Draco, Webby, Robo như Kitsu.
- [ ] Cảnh "hoà mình" cho 11 địa danh còn lại (làm theo mẫu Hội An); cảnh tầng 2–3 (Vạn Lý Trường Thành, Eiffel…).
- [ ] Bản đồ Việt Nam: viền tỉnh chi tiết hơn khi zoom, vẽ công trình từng địa danh, đường đi bám địa hình, tỉ lệ đúng 1:10.000.000 (hiện 1 px ≈ 1,7 km).
- [ ] Các màn Study còn lại (Đọc, Nghe, Ngữ pháp, Mẫu câu, Cửa hàng, Thống kê, Cài đặt, Thú cưng…) và màn bé còn lại (ABC, Sticker, Thú cưng, Ôn).
- [ ] Viết lại [18](18-ui-rules.md) theo mục 3 + `scripts/ui-audit.mjs` khi áp dụng; ghi font/dữ liệu mới vào [08](08-content-sources.md); sửa [05](05-mascot-system.md) (tiến hoá mới), [19](19-kids-world.md) (34 tỉnh, cảnh địa danh, thời tiết, tầng 2–3 châu Á/Trái Đất).
- [ ] Quyết định kỹ thuật khi áp dụng: lấy thời tiết thật (API khí tượng mở, tuỳ chọn, tắt được), bản đồ 3D hay 2D cho 34 tỉnh, gói tải thêm dữ liệu bản đồ.

## 7. Công cụ sinh bảng thiết kế (`scripts/design-data/`)

`vn-provinces-merge.py` (ghép 63→34), `vn-map-board.py` + `.tpl.html`, `world-maps.py` (dữ liệu châu Á/Trái Đất), `world-boards.py` (bảng châu Á/Trái Đất), `hoian-board.py`, `weather-board.py`, `travel-board.py`, `lessonfx-board.py`, `char-boards-v3.py`/`v4.py`. Các script đọc dữ liệu tải về tạm (`adm1.geojson`, `ne50.geojson`, `p2.json`) — **không** commit dữ liệu thô; xem [08 §8c](08-content-sources.md). Chụp thử cục bộ bằng Edge headless (`msedge --headless=new --screenshot`).


## 9. Vòng 3 (2026-10-31) — theo góp ý "Rồng Lv5 xấu, nhện xấu, KidsWorld là game 3D/2D nên giữ như hiện tại"

**Nhân vật (chờ duyệt)** — `scripts/design-data/char-boards-v5.py`
- **Draco Lv50**: v4 chỉ phóng to cánh Lv25 nên thành cái "dù". Vẽ cánh riêng: cánh tay cong → cổ tay vàng → 4 xương ngón, màng gradient kem → cam, mép lượn sóng giữa các đầu ngón (kiểu rồng phương Tây), giương cao ~26°; thêm vương miện nhỏ + hạt ngọc rồng. Lv1–4 giữ nguyên.
- **Webby v5 (vẽ lại hẳn dạng khác)**: bỏ 6 mắt + chân dài mảnh. Nhện là cục bông tròn lông xù, 2 mắt to + 2 chấm mắt phụ, chân ngắn mũm mĩm, bụng hình búi tóc có trái tim. Tiến hoá = thợ dệt tơ: kén → nhện bông (4 chân) → nhện thêu (8 chân, khăn, nơ) → nhện dệt cầu vồng (6 dải tơ múa) → **nhện tinh tú thoát xác** (vỏ cũ treo lại trên tơ, thân tím chàm đầy sao, lưới sương quay chậm).

**KidsWorld — quyết định thiết kế**: game là 3D three.js toon (+ canvas 2D dự phòng) nên **không dùng bản đồ SVG phẳng**. Các bảng cũ phẳng (KidsAsia, KidsEarth) bị thay dần; KidsMapVN, KidsWeather, KidsTravel, KidsLandmark đã làm lại bằng **ảnh chụp từ engine thật** (`scripts/design-data/kw3d/`) cộng đề xuất phủ lên (biên 34 tỉnh, ghim số, giờ/thời tiết, thú cưng vector, điểm chạm trong địa danh).
- Hiện trạng đọc từ code: `game/map3d.ts` (địa hình `vnHeightfield`, hậu kỳ viền mực theo độ sâu, mây, xe/thuyền/máy bay `map3dVehicles.ts`, công trình `landmarks3d/*`), thú cưng là sprite DOM phủ lên (`onPet`), tầng 2–3 3D **chưa có** (docs/19 §8 bước 5).
- Việc code về sau: dựng lại heightfield từ 34 tỉnh thật; ngày–đêm + thời tiết (uniform hậu kỳ + hạt vẽ sau hậu kỳ); chế độ "vào trong địa danh" (nới giới hạn camera + điểm chạm `hotspots[]`); xe: tăng/giảm tốc có đà, camera lò xo; tầng 2 châu Á / tầng 3 quả địa cầu bằng cùng phong cách toon + công trình 3D mới.
- **Chưa làm**: bảng 3D tầng 2 (châu Á) và tầng 3 (Trái Đất) — hiện còn bản phẳng cũ; cảnh vào trong 11 địa danh còn lại; thú cưng trong cảnh Hội An.


## 10. KidsWorld v3 — lát mẫu Hội An (2026-10-31, chờ duyệt)

Yêu cầu: làm đẹp lại toàn bộ cả 3D và 2D, từ chi tiết nhỏ nhất, được dùng thư viện miễn phí. Bảng `KidsV3` trên canvas. Nguyên mẫu ở `scripts/design-data/kw3d/slice/slice.ts`, **chưa đổi code app**.

**Hướng hình ảnh:** mô hình thu nhỏ ấm áp. Ánh sáng Lambert + bóng mềm + che sáng (GTAO) + viền mực mềm theo màu vật; ban đêm có bloom cho đèn lồng.

**Đã có trong lát:** địa hình màu theo độ cao; nước màu theo độ sâu, viền bọt, gợn; đường có lề, vạch, cầu, đèn đường; phố đá lát; ruộng thửa có bờ, lúa theo hàng; nhà phố cổ (mái ngói âm dương, cửa chớp, hoa giấy, đèn lồng); Chùa Cầu dựng tay; thuyền có mắt, thuyền thúng; cây CC0 tô lại màu; bản 2D nướng từ cảnh 3D.

**Thư viện (đề xuất, xem decisions #40):** giữ three.js; dùng các pass có sẵn trong `three/examples` (không thêm phụ thuộc). Tài nguyên phụ dùng CC0, tải dạng GLB thường. **Không** dùng glTF nén Draco/meshopt (cần wasm, phải nới CSP). **Không** dùng GSAP (giấy phép ràng buộc khi người dùng trả phí, không phải mã nguồn mở). Không cần PixiJS: Canvas của nó còn thử nghiệm, trong khi bản 2D nền nướng chạy được trên canvas thường.

**Còn dở trong lát:** Kitsu đang ngồi trên nóc xe (xe mẫu mui kín; xe mui trần của game sẽ ngồi đúng ghế); tách sprite từng vật cho 2D chưa chạy (chế độ `iso` vẫn hiện cả cảnh); chưa làm hoạt ảnh thật, ảnh là khung tĩnh; chưa đo fps, RAM (ảnh chụp bằng SwiftShader không nói gì về hiệu năng). GTAO và bloom phải là tuỳ chọn theo mức chất lượng để giữ mục tiêu ≥ 30 fps ở máy yếu.

**Bước sau khi duyệt:** đo hiệu năng trên máy thật → chuyển từng lớp vào `map3d.ts` → nhân ra 12 nơi → tầng 2–3.


## 11. Quyết định 2026-10-31

- Chủ dự án **duyệt hướng KidsWorld v3** ("Đúng hướng rồi đó").
- **Bỏ nhện Webby, thay bằng sói Lupo** (tên tạm), bảng `CharLupo`, script `scripts/design-data/char-boards-v6.py`. Tiến hoá theo pha trăng: trứng trăng → sói con → sói non → sói trăng → Nguyệt lang. Chờ duyệt hình. Khi áp dụng code: đổi `webster` trong `src/shared/characters.ts`, sprite, i18n và xử lý người đã mua Webby.
- Thiết kế lại toàn app: xem [22](22-redesign-plan.md).
