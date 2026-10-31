# 23 — Thiết kế v2 "Làng chữ" (bản đã chốt)

> **Đây là nguồn sự thật về hình ảnh và trải nghiệm của giao diện mới.** Chủ dự án đã duyệt thiết kế trên canvas ngày 2026-10-31. **Code app chưa đổi:** phần đang chạy vẫn theo [05](05-mascot-system.md), [12](12-ui-ux-guidelines.md), [18](18-ui-rules.md), [19](19-kids-world.md) cho tới khi từng màn được áp dụng ([14 — Áp dụng thiết kế v2](14-roadmap.md#áp-dụng-thiết-kế-v2--làng-chữ)). Nhật ký quá trình: [21](21-redesign-v2.md), [22](22-redesign-plan.md).

**Canvas (riêng tư, chủ dự án có link):** https://claude.ai/artifact/3hhHSz525f9d3bTXAiC1nX (bản 56). Bảng HTML nằm trên canvas, trong repo chỉ có generator.

## 1. Ý tưởng

App là một **ngôi làng Việt Nam** vẽ phẳng, nhiều chi tiết, màu tươi, cảm giác giấy, viền nâu sẫm. Mỗi mục menu là một địa điểm trong làng; thú cưng đi trên đường tới đó. Màn trong có cảnh của địa điểm ở phía trên và nội dung trên nền giấy ở dưới.

Quy tắc hình ảnh:

- **Không dùng pixel ở bất cứ đâu.** Thú cưng vẽ chibi.
- Vẽ vật có thật thì **tra ảnh thật trước**. Ảnh chỉ để quan sát, không chép, không đưa vào repo.
- Làng theo kiểu nông thôn Việt Nam, không kiểu cung điện. Nhà ở bên đường, không nằm trên đường. Đường là một nét liền, cầu nằm trên đường.
- Có hoạt ảnh sống: nắng, chim hạc vỗ cánh (trong làng và Việt Nam), sông chảy, cây đung đưa, mây trôi, ngày, chiều, đêm theo giờ. Luôn tôn trọng `prefers-reduced-motion`.
- Phím tắt và giải thích: `Enter`, `1-4`, `R`, `Z`, `Esc`, `Ctrl K`; nút kết quả có giải thích; gợi ý mức đánh giá; ước lượng thời gian.

Token: `scripts/design-data/sync/tokens.json` (giấy `#FBEFD8`, đỏ `#D32F2F`, vàng `#F7B91A`, ngọc `#0B7A52`, nền tối `#141A3A`). Font: Be Vietnam Pro, Noto Sans IPA; Baloo 2 chỉ dùng cho giao diện trẻ em. Icon: Lucide qua `<UiIcon>`.

## 2. Thú cưng

5 thú cưng cuối cùng, chibi, 5 cấp tiến hoá: **Kitsu** (Cửu Vĩ Hồ), **Bi** (Mộc Thần), **Draco** (Long Vương), **Robo** (Thiên Cơ), **Lupo** (Ngân Lang). **Lupo thay Webby, bỏ nhện.**

Mỗi con có 16 trạng thái hoạt ảnh: đứng, đi, chạy, nhảy, ngồi, ngủ, ăn, uống, đọc, nghe, nói theo, chào, vui, buồn nhẹ, ngạc nhiên, lên cấp. Thêm 3 dáng đi xe, thuyền, máy bay. Bảng: `CMascot*`, `Char*`, `R4Myth`, `R7Mascot`.

## 3. Thế giới của bé

| Tầng | Bảng | Thiết kế |
| ---- | ---- | -------- |
| Bản đồ Việt Nam | `R5World`, `R5North`, `R5South` | Bản đồ 2D giữ luật bản đồ hiện tại, công trình 3D đặt trên bệ tròn |
| Trong địa điểm | `R5Arrive` (Hội An, chuẩn), `PSapa`, `PHanoi`, `PHalong`, `PNinhbinh`, `PHue`, `PDanang`, `PNhatrang`, `PDalat`, `PHcmc`, `PCantho`, `PPhuquoc` | Cảnh rộng 1280×720 đúng phong cảnh nơi đó, đường có thú cưng đứng trên, 5 điểm chạm là vật có thật, nút Về bản đồ |
| Tầng 2 Các nước | `PAsia` | Đất gộp một khối, không biên giới; núi xếp dãy, rừng theo vùng thật; **không có chim hạc, thay bằng máy bay** chạy trên đường bay nét đứt; có Hoàng Sa, Trường Sa theo `src/shared/vnMap.ts` |
| Tầng 3 Trái Đất | `PEarth` | **Quả địa cầu tròn quay** trong vũ trụ; 7 châu lục tô màu riêng, không biên giới; địa điểm là **kỳ quan thế giới** |

**Kỳ quan tầng 3:** Tượng Nữ thần Tự do, Chichén Itzá (Bắc Mỹ); Machu Picchu, Tượng Chúa Cứu Thế (Nam Mỹ); Đấu trường La Mã (châu Âu); Kim tự tháp Giza (châu Phi); Lăng Taj Mahal, Vạn Lý Trường Thành (châu Á); Nhà hát Sydney (châu Đại Dương). Châu Nam Cực chỉ có chim cánh cụt.

**Khi vào code:**

- Quả cầu dùng three.js để kéo xoay được, dừng khi chọn, chỉ hiện nhãn của nơi gần tâm. Bảng dùng CSS thuần nên chỉ thể hiện ý.
- `content/curated/kids/world/places/e-*.json` hiện là 3 nơi cũ (hoang dã, băng giá, đồ vật thông minh), **không khớp thiết kế**. Phải soạn lại nội dung tầng 3 theo kỳ quan, có `source.license`.
- Bảng dùng dữ liệu mẫu (46 sao, câu hỏi, số liệu). Vạn Lý Trường Thành trùng với Trung Quốc ở tầng 2, cần chọn cách xử lý khi soạn nội dung.
- Cảnh và bản đồ khá nặng (bản đồ khoảng 2 MB, cảnh 250–720 KB), cần xuất thành ảnh trong app.

## 4. Thẻ từ

Nét sạch: viền nâu, tô 2 mảng, một vệt sáng, đúng màu theme. Đồ vật không có mặt; con vật giữ mắt và mũi, bỏ miệng cười. Đủ 183/183 từ: `CCards1`–`CCards5`, mẫu `R6Cards`.

## 5. Các màn

| Nhóm | Bảng | Ghi chú |
| ---- | ---- | ------- |
| Hệ thống | `S0System` | Màu, chữ, bo góc, nút, icon |
| Trang chủ làng | `R1Home`, `R1HomeDusk`, `R1HomeNight`, `S1Home*` | Bản đồ làng theo giờ |
| Học tập, ôn tập | `R2Review`, `R3Lesson`, `S1*`, `S2*` | Cảnh địa điểm + nội dung trên giấy |
| Thú cưng, cài đặt, phụ huynh | `S3*` | Có bản tối, lỗi, đang tải |
| Mascot, popup | `S4*` | word-card, reward, translate-hint chỉ có trong [05](05-mascot-system.md), code mới có `say`, `stats`, `quiz` |
| Trẻ em | `S5*` | Baloo 2, ô to |

## 6. Công cụ và cách sinh lại

Generator ở `scripts/design-data/`, cách dùng ở [22 §1, §12](22-redesign-plan.md):

- `sync/`: `tokens.json`, `board_kit.py`, `gen_s0.py`–`gen_s6.py`, `screens.json`, `check-boards.py` (phải 0 lỗi; bỏ qua token ở `P*`, `C*`, `R*`).
- `review/`: `gen_village3.py`, `gen_review2.py`, `gen_places_north.py`, `gen_places_central.py`, `gen_places_south.py`, `gen_earth.py`, `place_parts.py`, `gen_cards.py`, `gen_mascot.py`.
- Thứ tự sinh màn S: `gen_s0`..`gen_s5`, `gen_village3`, rồi `gen_s6`.
- `vn_merged.json`, `asia.json`, `ne50.geojson`, ảnh mô hình công trình là **dữ liệu tạm, không có trong repo**; phải dựng lại trước khi chạy generator bản đồ.

## 7. Điểm còn yếu của thiết kế

- `PHcmc`, `PPhuquoc`, phần nào `PCantho` thưa hơn `R5Arrive`.
- Nhà sàn, cây bẹo, cây sao, mặt tiền nhà ống, nhà người Mông vẽ theo hiểu biết chung vì thiếu ảnh. Ngọ Môn, tháp Bà, ga Đà Lạt ghép gần cảnh khác, không đúng địa lý.
- Mô hình 3D Hội An và Đà Nẵng chưa dựng lại riêng cho bệ tròn.
- Chưa có: biến thể thời tiết, 20 phụ kiện, 18 đồ ăn, bản đồ cho cửa sổ nhỏ 900×640, kiểm tra tương phản.
- Hoạt ảnh chưa xem chạy liên tục trên canvas; `prefers-reduced-motion` chưa thử.
- Thẻ xoài còn gần giống đào và cam. Tay của Kitsu, Draco, Lupo là phần vẽ thêm.
