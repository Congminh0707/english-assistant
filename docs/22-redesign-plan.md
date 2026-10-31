# 22 — Kế hoạch thiết kế lại toàn app (2026-10-31)

> Kết quả cuối cùng đã tổng hợp ở [23](23-design-v2-spec.md).

Chủ dự án yêu cầu thiết kế lại toàn app, chia thành các phần riêng nhưng có một luồng kiểm tra đồng bộ. Đây là thiết kế trên canvas ([link trong 21](21-redesign-v2.md)), **chưa đổi code app**.

## 1. Nền chung (phải dùng, không chép)

Thư mục `scripts/design-data/sync/`:

| File | Vai trò |
| ---- | ------- |
| `tokens.json` | Nguồn sự thật: màu sáng/tối, bán kính, khoảng cách, cỡ chữ, font, chuyển động, kích thước cửa sổ |
| `board_kit.py` | Sinh bảng: CSS chung (`.card .btn .chip .bar .item .nav`), icon Lucide, `study_shell()`, `write()` |
| `screens.json` | Danh sách màn hình phải có bảng, gắn phần phụ trách |
| `check-boards.py` | Luồng kiểm tra đồng bộ |

## 2. Các phần việc

| Phần | Phạm vi | Bảng |
| ---- | ------- | ---- |
| S1 | Học chính: trang chủ, khoá học, bài học, bài tập, đọc, nghe | `S1*` |
| S2 | Ôn và luyện: ôn tập, luyện nói, từ vựng, mẫu câu, kiểm tra đầu vào | `S2*` |
| S3 | Tăng trưởng và tài khoản: thú cưng, cửa hàng, thống kê, cài đặt, onboarding, tiến hoá, báo cáo phụ huynh | `S3*` |
| S4 | Mascot trên màn hình: bong bóng, câu đố nhanh, popup dịch nhanh | `S4*` |
| S5 | Giao diện bé ngoài bản đồ: trang chính, học chữ, lượt 5 bước, ôn, sticker, thú cưng, cổng phụ huynh | `S5*` |
| KW | KidsWorld v3 (đã duyệt hướng, 2026-10-31): đưa từ lát mẫu ra 12 nơi + tầng 2–3 | theo [21 §10](21-redesign-v2.md) |

## 3. Luồng kiểm tra đồng bộ

Mỗi phần phải qua đủ ba bước trước khi đăng:

1. **Tự động:** `python check-boards.py <project>` đạt 0 lỗi: màu trong token, bán kính đúng thang, chữ ≥ 12px, đúng font, không emoji, không pixel, không còn Webby.
2. **Nhìn:** chụp từng bảng, tự xem ảnh, sửa chữ tràn, chồng lấn.
3. **Chung:** người điều phối ghép ảnh tất cả bảng thành một tấm để so nhịp, độ đậm, khoảng cách giữa các phần, rồi mới đăng.

Muốn đổi token hoặc component: báo người điều phối sửa ở `sync/`, không tự sửa trong từng phần.

## 4. Quy tắc nội dung

- Giữ đúng chức năng và trường dữ liệu đang có trong component Vue tương ứng. Chữ hiển thị tiếng Việt, dựa theo `src/shared/i18n/vi.json`.
- Mỗi màn hình tối đa một nút chính. Có trạng thái trống hoặc lỗi nếu màn đó có.
- Mỗi phần có ít nhất một bảng tối để kiểm tra theme.
- Nhân vật: Kitsu, Bi, Draco, Robo, Lupo bản vector mới. Không vẽ pixel, không dùng emoji làm icon.


## 5. Kết quả vòng 1 (2026-10-31)

110 bảng S0–S5 trên canvas, sinh bằng `sync/gen_s0.py … gen_s5.py`. `check-boards.py`: 0 lỗi, 0 cảnh báo, phủ 29/29 màn hình. Soát chéo bằng ảnh ghép 24 màn chính sau khi đồng bộ.

**Đã đổi nền chung sau khi gom đề xuất:** nhãn điều hướng khớp `vi.json` + thêm Luyện tập; chữ nút chính bản tối dùng `--bg`; làm đậm `--warning`; thêm cỡ chữ 64/112/160; `.btn--xs`; icon `coins moon download`; kích thước cửa sổ theo code (popup 400×360, mascot 360×440). Bảng cũ `StudyHome`, `Review`, `Mascot`, `KidsHome` đã thay bằng `S1Home`, `S2Review`, `S4*`, `S5KidsHome`. `Main` chưa thay, dùng `S0System` làm chuẩn.

**Chưa gộp vào kit:** các lớp riêng trùng nhau giữa phần (`.tabs`, ô chọn, ghi chú, `btn--sm`, HUD của bé) và các icon đang `ICONS.update` trong từng generator; icon S3, S5 viết từ trí nhớ, cần đối chiếu Lucide. Icon Lucide giấy phép ISC, ghi vào docs/08 khi đưa vào app.

**Cần chủ dự án quyết:** (1) cấu trúc điều hướng: Bài học, Ngữ pháp, Bài đọc, Nghe nằm trong tab của Lộ trình như bảng S1 hay ra thanh bên; (2) khác với app hiện tại: Cài đặt có menu con, Thống kê và Cửa hàng chia tab, gộp danh sách và chi tiết khoá học, bubble nhắc ôn thay vì đẩy thẳng thẻ quiz, album lật trang, ABC theo tab; (3) Lupo chưa có trong code (đang mượn giá của `webster`).

**Dữ liệu mẫu:** nhiều số liệu và câu ví dụ trong bảng là mẫu, không phải dữ liệu thật; một số chuỗi mới chưa có trong i18n.

**Còn thiếu:** vài trạng thái phụ (đang ghi âm, lỗi micro, tải model, kết quả không đạt…), bản tối của một số màn, tranh vector cho bài chọn hình, phụ kiện và đồ ăn còn thiếu, chưa đo tương phản bằng số. Chưa soát từng bảng ở cỡ gốc sau lần đồng bộ cuối.


## 6. Vòng review hướng UI mới (2026-10-31, chờ duyệt)

Chủ dự án chê UI S1–S5 cũ và theo lối mòn AI (thẻ bo góc xếp lưới, thanh bên chuẩn, nền kem, ô thống kê). Bốn bảng `R1Home`, `R2Review`, `R3Lesson`, `R4Myth` thử hướng mới, sinh bằng `scripts/design-data/review/gen_review.py`, chưa theo `tokens.json` (`check-boards.py` bỏ qua `R*`). Duyệt xong mới đổi token và áp lại cho S1–S5.

**Hướng:** tranh mộc bản nhiều lớp màu phẳng, màu màn hình đổi theo giờ trong ngày (sáng ngọc, hoàng hôn dải màu, đêm chàm), đồng bộ với thế giới của bé. Không thẻ, không thanh bên; menu là dòng chữ trên cùng. Font đề xuất: Fraunces (tiêu đề), Lexend (nội dung, dễ đọc), đều có tiếng Việt, cần bundle và ghi docs/08 khi áp dụng.

**Dữ liệu thành hình:** từ đến hạn là đèn hoa đăng trên sông, chuỗi ngày là dấu chân, tiến độ ôn là hàng đèn sáng dần, 4 mức ôn là 4 viên đá, ngữ pháp là trục thời gian thay bảng công thức.

**Cấp cuối thần thoại** (`review/myth.js`, `build_myth.py`, canvas cộng sáng + SVG): Ngân Lang (Lupo, tên mới thay Nguyệt lang, thân dệt bằng sợi bạc), Cửu Vĩ Hồ (Kitsu), Long Vương (Draco), Mộc Thần (Bi, cây đa, rễ phụ thành tơ sáng), Thiên Cơ (Robo, thiên cầu). Đây là ảnh tĩnh render trước; khi đưa vào app cần nướng thành ảnh hoặc sprite và thêm hoạt ảnh nhẹ.


## 7. Cập nhật vòng review (2026-10-31)

- Chủ dự án duyệt hướng mộc bản theo giờ. Art cấp cuối đổi sang **tranh mực chi tiết, vẫn đầu to chibi, sáng toả quanh thân** (bộ cọ `review/ink.js`, `ink_<pet>.js`); bản sợi cũ `myth.js` bỏ.
- Quy tắc art: nét mực thuôn, lông theo hướng, mắt phát sáng là điểm nhấn, ánh sáng toả từ viền hình ra ngoài, mỗi con một bảng màu và một biểu tượng thần thoại. Không vẽ mặt giống người.
- **Quy tắc UX áp cho mọi màn:** một việc chính ở vị trí cố định, bấm được bằng phím (`Enter`); ôn bằng phím `1`–`4`, `R` nghe lại, `Z` hoàn tác, `Esc` dừng mà giữ tiến độ; nút nói rõ kết quả ("gặp lại sau 2 ngày"); luôn có gợi ý mức ôn; tìm nhanh `Ctrl K` ở mọi màn; ước lượng thời gian trước khi bắt đầu; bài học có bước đang ở đâu và đường quay lại; câu nào cũng nghe được; viền focus rõ.
- Chưa làm: áp hướng mới cho S1–S5 (đổi `tokens.json`, `board_kit.py`, làm lại bảng), chưa đo tương phản bằng số. Phím tắt và `Ctrl K` mới là thiết kế, chưa có trong app.


## 8. Hướng "Làng chữ" (2026-10-31, thay hướng mộc bản dải màu, chờ duyệt)

Chủ dự án chê 3 màn dải màu, chốt: hiện đại, đơn giản, có nét văn hoá Việt Nam, dạng bản đồ; nhân vật **giữ chibi**, ảnh mực chỉ tham khảo cách diễn đạt.

- **App là một làng Việt** minh hoạ phẳng có hạt nhiễu nhẹ, mặt trời hoa văn trống đồng. Mỗi mục là một địa điểm, thú cưng đi trên đường vàng tới đó. Sinh bằng `review/gen_village.py`, font Be Vietnam Pro.
- **Bản đồ mục:** Trường làng = Lộ trình, bài học; Giếng làng = Ôn từ; Đình làng = Luyện tập; Thư các = Sổ từ; Bến thuyền = Mẫu câu; Chợ quê = Cửa hàng; Tháp vinh danh = Thành tựu, Thống kê; Nhà của Kitsu = Thú cưng. Cài đặt và Tìm từ là nút góc trên.
- **Khuôn màn trong:** một bên là cảnh của địa điểm kèm thú cưng, một bên là nội dung trên nền giấy; nút `Esc` về làng.
- **UX bản đồ:** nút chính gợi ý điểm nên tới, huy hiệu số việc chờ, đường nét đứt cho thấy thú cưng đang đi; quy tắc phím ở §7 giữ nguyên.
- **Nhân vật:** `review/ink_chibi.js` vẽ Ngân Lang, Cửu Vĩ Hồ, Long Vương đầu to chibi, lông và nét mực chi tiết, sáng toả quanh thân; Mộc Thần và Thiên Cơ vẽ lại ở `review/ink_chibi2.js`: Mộc Thần thân mịn, cây đa non trên đầu, vòng hoa, đài sen; Thiên Cơ robot tương lai vỏ ngọc trai, kính mặt liền, tay rời bay, cánh năng lượng, sàn lưới. Bản cũ `ink_lupo.js`, `ink_kitsu.js`, `ink_draco.js`, `ink_bi.js`, `ink_robo.js` bỏ.


## 9. "Làng chữ" bản chi tiết (2026-10-31, chờ duyệt)

Chủ dự án chốt tạm 5 chibi; yêu cầu 3 trang vẽ chi tiết và tươi hơn theo ảnh mẫu tranh vector Huế. `review/gen_village2.py` thay `gen_village.py`.

- **Phong cách:** vector có viền nâu đậm, màu tươi (đỏ son, vàng ngói, xanh ngọc, ngọc lam, hồng núi), nền giấy vân, nét truyền thống rõ.
- **Chi tiết đã có:** mái ngói từng hàng, đầu đao cuộn, cửa bức bàn, đèn lồng, tường đá từng viên có rêu và vòm cầu, mây tường vân, hạc, núi hồng, thuyền rồng, lá sen và hoa sen, sạp chợ.
- **Bảng màu mới** nằm trong `C` của `gen_village2.py`, thay bảng `tokens.json` khi duyệt. Nhãn địa điểm dạng băng rôn, nút chính đỏ viền vàng.

- **Lượt 2 (2026-10-31):** quay về bố cục bản đồ phẳng (đồi, đường vàng, sông, cầu), bỏ tường thành giữa. Vật thể nâng độ hoàn thiện: mái có khối, bóng dưới hiên, bóng đổ, cây tán nhiều lớp, cau có lá chét, tre có đốt, núi đá vôi có mặt sáng tối và sương, ruộng bậc thang, cỏ, đường có sỏi, cầu đá, thuyền có người nón lá.

- **Lượt 3 (2026-10-31), `review/gen_village3.py`:** bỏ công trình kiểu cung đình, vẽ theo làng quê Bắc Bộ. Đình: mái ngói ta nâu chiếm 2/3 chiều cao, cột lim trên tảng đá, sân gạch, hai trụ nghi môn. Trường làng: nhà ngói đỏ tường vôi vàng, hiên, cột cờ, trống. Thư các: gác gỗ giữa ao sen, cầu ván. Tháp Bút + đài nghiên trên gò (thay Tháp vinh danh). Nhà tranh: vách đất, mái rạ, chum nước, rào tre, khói bếp. Chợ quê: lều lá, sạp mẹt, người đội nón. Giếng: gạch rêu, cần vọt. Thêm trâu, người, bụi râm bụt.
- **Đường:** một mạng liền, cầu nằm đúng trên đường, cùng bề rộng; đường nhánh nhỏ vào từng công trình; công trình đặt cạnh đường, không đè lên. Sân và bóng mềm, cỏ mọc đè mép sân để hoà với đất.
- **Hoạt ảnh (CSS, tắt khi giảm chuyển động):** nắng quay và thở, chim bay vỗ cánh, sông chảy, cây đung đưa, thuyền bập bềnh, mây trôi có bóng trên đất, khói bếp, cờ bay; đêm có sao nhấp nháy, đom đóm, trăng, đèn cửa.
- **Giờ:** 3 bảng `R1Home` (ngày), `R1HomeDusk`, `R1HomeNight`. Khi làm thật, chọn theo đồng hồ máy và chuyển mượt.

- **Lượt 4 (2026-10-31):** Thư các có cầu gỗ thẳng từ bờ ao vào cửa, có tay vịn và cọc, đường nhánh nối đúng chân cầu. Tháp Bút đổi sang tháp 7 tầng bát giác kiểu tháp Việt (lấy cảm hứng tháp Phước Duyên, vẽ cách điệu, không phải bản sao), cửa vòm, mái ngói vểnh, đỉnh hồ lô.

- **Lượt 5 (2026-10-31):** mạng đường vẽ gộp theo lớp (`network()`), chỗ giao liền, không lộ viền. Hạc bay theo đàn, hai cánh vỗ nhẹ, thay chấm đen. Trâu có sừng, mục đồng thổi sáo, đuôi vẫy; người có áo quần, tay, mặt, nón, thêm quang gánh; sông có vảy sóng, ánh lấp lánh, bọt bờ, gợn quanh cầu và thuyền.

- **Lượt 6 (2026-10-31):** tra ảnh thật trên Wikimedia Commons (chỉ để quan sát, không sao chép, không đưa vào repo) rồi vẽ lại. Trâu: thân xám đen, vai gồ, đầu dài thấp, sừng đen cong ra sau ôm đầu, chân ngắn dính bùn. Trẻ chăn trâu ngồi dạng chân trên lưng, nón lá, cầm dây. Thuyền: gỗ đáy phẳng, sơn xanh, người ngồi đuôi chèo bằng chân như Tam Cốc, áo caro, nón lá, sọt nông sản ở mũi. Quy tắc mới: vật thật phải tra ảnh tham khảo trước khi vẽ.

- **Lượt 7 (2026-10-31):** hai màn trong dùng chung trời, núi, đồi, sông, đường, hạc, mây và hoạt ảnh với bản đồ (`panel_well`, `panel_school` trong `gen_village3.py`); cảnh Giếng làng và Trường làng đúng công trình trên bản đồ; mép giấy lượn viền vàng ngăn cảnh và nội dung. Chưa có bản đêm và hoàng hôn cho màn trong.

- **Lượt 8 (2026-10-31):** trâu thu nhỏ 2/3. Sừng vẽ lại theo ảnh: bản dẹt, gốc trên đỉnh đầu, hai lưỡi liềm hai bên, mũi quặp vào, có ngấn. Tre vẽ lại theo ảnh bụi tre: nhiều thân mọc túm, có đốt, ngọn cong rủ, cành mảnh, lá hẹp thành chùm, gốc có mo tre.


## 10. Áp "Làng chữ" cho toàn bộ S1–S5 (2026-10-31) — ĐÃ XONG, chờ duyệt

- `sync/tokens.json`: bảng màu Làng chữ (giấy, đỏ son, vàng ngói, xanh ngọc, ngọc lam) và bản tối xanh đêm. `sync/board_kit.py`: nút tròn, viền đôi, chữ Be Vietnam Pro đậm; thanh bên thay bằng cảnh địa điểm 216px (`place_scene`, vẽ từ `review/gen_village3.py`, `panel_place`), kèm nút Về làng và tên địa điểm.
- Mục ứng với địa điểm: `PLACE` trong `board_kit.py`. `S1Home`, `S1HomeDark` là bản đồ làng. Màn bé và onboarding dùng phông `kid_scene`. Giao diện bé giữ font Baloo 2 tròn cho trẻ nhỏ.
- Kiểm tra: `check-boards.py` 0 lỗi, phủ 29/29; soát 36 màn chính qua ảnh ghép, chưa xem từng bảng cỡ gốc. `strip_svg` sửa để bóc được svg lồng nhau.
- Chạy lại: `BOARD_OUT=<project> PYTHONIOENCODING=utf-8 python gen_s0.py … gen_s5.py`, rồi `python ../review/gen_village3.py <project>`, rồi `python gen_s6.py` (S1HomeDone lấy từ bản đồ S1Home nên phải chạy sau cùng).
- **Hoàn thiện (2026-10-31):** `sync/gen_s6.py` thêm 36 bảng trạng thái còn thiếu ở §5, xếp dưới các bảng S (ghi chú `secS6`), bỏ `Main` khỏi canvas. Icon gộp vào `board_kit` theo đúng path lucide-vue-next 1.0.0; gộp `.tabs .tab .grow .clip`. Chưa gộp vì khác nhau: `.s1-tip`, `.s1-fb`, `.s2-note`, `.note--*`, nút XS của S4. `word-card`, `reward`, `translate-hint` theo docs/05, code mới có `say | stats | quiz`. Kích thước model ghi theo MiB như app hiển thị (Whisper 76, wav2vec2 339, Kokoro 88).
- **Khi làm code:** nướng cảnh tĩnh thành ảnh; bỏ thanh bên đổi cách điều hướng nên cần viết lại khung `App.vue`; viết lại `docs/18-ui-rules.md`, token CSS, `scripts/ui-audit.mjs`; bundle font, ghi docs/08; đổi Webby thành Lupo.


## 11. Mẫu vòng sau (2026-10-31, chờ duyệt, `review/gen_review2.py`)

- `R5World`: KidsWorld vẽ cùng nét trang chủ thay pixel/voxel: bản đồ 34 tỉnh, biển sóng, đường, 4 địa danh mẫu (Sa Pa, Hà Nội, Hạ Long, Hội An). Thay 3D three.js hay chỉ đổi bản 2D là việc chủ dự án cần chốt.
- `R6Cards`: thẻ từ chân thật hơn hình hiện tại: chó có lông, táo khối sáng, thuyền. Đề xuất 183 hình làm dần theo nhóm.
- `R7Mascot`: 6 trạng thái Kitsu có hoạt ảnh; đề xuất bộ đầy đủ 16 trạng thái cho 5 con, thêm 3 dáng trên xe, thuyền, máy bay.

- **Lượt 2 (2026-10-31):** bản đồ chỉ còn điểm nhỏ và nhãn, `R5Arrive` là cảnh Hội An khi tới nơi (camera sà vào điểm rồi mở cảnh), chọn phần học bằng điểm chạm. Thẻ từ đổi sang nét gọn: viền nâu, tô 2 mảng, một vệt sáng, cùng bảng màu làng. Đồ vật không có mặt; con vật giữ mắt và mũi, bỏ miệng cười.

- **Lượt 3 (2026-10-31):** bản đồ theo luật 2D hiện có (`game/scene.ts`, `geoLayout`): bệ đất, công trình nổi, chấm vị trí thật có đường chỉ tới bệ, cây từ quanh bệ, cờ khi xong, camera kéo được. Công trình dùng đúng mô hình 3D `game/landmarks3d` render toon viền mực (`scripts/design-data/kw3d/lm.ts`), nên 3D vẫn là 3D. Cảnh Hội An vẽ lại theo ảnh Chùa Cầu: nhìn chính diện qua kênh, chân đá nhiều trụ, mái ngói nâu, bóng nước, nhà vàng, tường hồng, kè đá, chậu cau, hoa giấy.

- **Lượt 4 (2026-10-31):** đã tra ảnh Ngọ Môn, cầu Rồng, tháp Bà Ponagar, ga Đà Lạt. Mô hình bản đồ bỏ đế vuông và nhà phụ, đặt lên bệ tròn dựng trong 3D (`kw3d/lm.ts`), công trình to, cùng góc nhìn, liền bệ. Cảnh Hội An thu về góc rộng, thêm phố hai bên và phố lát đá; thú cưng đứng trên phố. Hiện lọc từ mô hình cũ; khi làm thật nên dựng lại bản đồ dùng mô hình `landmarks3d` riêng cho bệ tròn.

- **Lượt 5 (2026-10-31):** bản đồ 2D được duyệt. Cảnh Hội An vẽ lại theo 4 ảnh chủ dự án gửi (`r5f`): hoàng hôn, Chùa Cầu có tường hồng, gian sáng đèn, mái tối viền vàng, bờ nóc trang trí; quán đèn lồng, nhà vàng, kè đá, hoa đăng, thuyền kết đèn, người đi bộ, xe đạp, bóng nước. Ảnh chỉ để tham khảo, không đưa vào repo.

- **Lượt 6 (2026-10-31):** đủ 12 công trình trên bệ tròn 3D, nơi sông nước có mặt nước; Hội An giữ nhà kè, Đà Nẵng giữ đường và cao ốc. Đường bo cong (Chaikin), ba bảng `R5World`, `R5North`, `R5South`. Hai vỉa hè cảnh Hội An lát đá từng viên. Mô hình vẫn lọc từ `landmarks3d`, chưa dựng tay riêng.

- **Lượt 7 (2026-10-31):** Hội An thêm lớp chi tiết: phố xa, ban công chậu hoa, biển hiệu, bàn quán, hoa giấy, dây leo, sạp hàng, rêu, bậc nước, cọc buộc, thuyền buộc bờ, chạm khắc cầu, vòm đá, ánh nước, súng, 46 hoa đăng.

- **Lượt 8 (2026-10-31):** Chùa Cầu vẽ lại theo ảnh: sàn và mái cong, lòng cầu nhìn xuyên thấy sông chảy về xa, hai vòm hẹp, băng bờ nóc rồng chầu ngọc. Nhà phố cổ đặc trưng: tường vàng ố, cửa bức bàn gỗ có mắt cửa, gác hiên gỗ, mái ngói âm dương rêu, đèn lồng (`oldhouse`, `amroof`). Hoa đăng tránh thuyền.

- **Lượt 9 (2026-10-31):** dãy nhà Hội An có phối cảnh (xa nhỏ dần về cầu), biển hiệu đặt trên mặt tiền, bóng nước gợn và mờ dần (`feDisplacementMap`), thêm bóng ánh đèn của nhà.


## 12. Vòng cuối: áp toàn app, làm đủ phần thiếu (2026-10-31, đang làm)

**Chuẩn cảnh địa điểm = `R5Arrive` (hàm `r5f` trong `review/gen_review2.py`), đã duyệt.** Mỗi nơi một bảng 1280×720 `P<id>.dc.html`, cùng độ chi tiết, nhưng là phong cảnh và nét đặc trưng thật của nơi đó.

Quy tắc bắt buộc:
1. Tra ảnh thật trước khi vẽ (API Wikimedia Commons, xem `C:/Users/01217/AppData/Local/Temp/myth/ref.py`; thư mục riêng; ảnh chỉ để quan sát, không chép, không đưa vào repo).
2. Tái dùng bộ vẽ: `import gen_review2 as G` (cần `sys.argv=['x',proj,vnjson]` trước import), `G.V` là `gen_village3`: `tree cau tre non kitsu sampan flock driftcloud lotusleaf lotus tiles roofv label`; `G.den hoadang walker bike moss vine bougain halo stonequay amroof balcony sign bubble`. Thiếu thì viết hàm mới trong generator của mình, không sửa file chung.
3. Có: bầu trời đúng giờ đẹp của nơi đó, công trình chính nhìn đúng và chi tiết, lớp nền xa, tiền cảnh có đường cho thú cưng đứng trên đường, người đặc trưng, nước có bóng gợn nếu có nước, hoạt ảnh CSS (có `prefers-reduced-motion`), 5 điểm chạm `bubble` là vật có thật, nút Về bản đồ + tên nơi. Nhãn không che vật chính, vật không đè nhau. Nơi thờ tự vẽ trang trọng.
4. Không dùng tên riêng hay chữ chưa chắc; không sửa `src/`, `content/`, không commit, không publish, không sửa `sync/` chung trừ khi được giao.
5. Soát: chụp Edge headless, tự đọc ảnh, sửa tới khi đạt; `cd scripts/design-data/sync && python check-boards.py <project>` 0 lỗi (thêm `P*`, `C*` vào bỏ qua nếu chưa có). Báo thật phần chưa xem.

BOARD_OUT = `C:/Users/01217/AppData/Local/Temp/claude/D--Gonbi-Projects-App-english-assistant/c1c78865-4583-4473-9d0d-3448ab8ce72b/scratchpad/ea/project`; `vn_merged.json` ở `C:/Users/01217/AppData/Local/Temp/vn/vn_merged.json`.

**Thẻ từ và mascot (2026-10-31, xong trên canvas, chờ duyệt):**

- `review/gen_cards.py`: đủ 183/183 từ trong `content/curated/kids/world/places/*.json` (tầng 1: 120/120, còn lại: 63/63). Bảng `CCards1..5`, mỗi bảng 40 thẻ, bảng 5 có 23 thẻ. **Từ chưa vẽ: không còn.** Nghĩa Việt đọc từ `src/shared/pictures*.ts`. Generator tự tính danh sách từ thiếu và in ra khi chạy.
- `s_apple`, `s_dog`, `s_boat` chép nguyên mẫu. `s_fish` giữ dáng bản đang hiện ở `R6Cards` nhưng tô phẳng 2 mảng, bỏ gradient và vảy, để đúng luật thẻ.
- `review/gen_mascot.py`: `CMascotKitsu`, `CMascotBi`, `CMascotDraco`, `CMascotRobo`, `CMascotLupo`, mỗi bảng 16 trạng thái + 3 dáng xe, thuyền, máy bay, hoạt ảnh CSS có `prefers-reduced-motion`. Hình đọc từ defs `Char*.dc.html` lúc chạy (chỉ đọc), tách đầu, thân, chân, mắt, miệng. Tay là phần vẽ thêm cùng màu thân, chưa có trong bản gốc của Kitsu, Draco, Lupo.
- Canvas: `CMascot*` tại y=-9100, `CCards*` tại y=-10660, ghi chú `secC`, đều nằm trên y=-7820.
- Chưa kiểm: chưa bật thật `prefers-reduced-motion` để xem; chưa xem hoạt ảnh liên tục, chỉ so hai thời điểm ở bảng Kitsu; chưa thử thẻ trong màn thật của app. Hình chưa đưa vào `src/`.


**Kết quả §12 (2026-10-31):** xong 13 cảnh `P*` (11 nơi, `PAsia`, `PEarth`), `CCards1–5` đủ 183/183 từ, 5 bảng `CMascot*` 16 trạng thái + 3 dáng, 36 bảng trạng thái còn thiếu (`sync/gen_s6.py`). `check-boards.py`: 198 bảng, 0 lỗi, 0 cảnh báo, phủ 29/29 (bỏ qua token ở `P*`, `C*`, `R*`). Chờ chủ dự án duyệt. Thứ tự sinh lại: gen_s0..s5, `gen_village3`, `gen_s6`.
Chưa đạt: `PHcmc`, `PPhuquoc` còn thưa hơn `R5Arrive`; nhà sàn, cây bẹo, mặt tiền nhà ống vẽ theo hiểu biết chung; hoạt ảnh chưa xem chạy liên tục; word-card, reward, translate-hint chưa có trong code; xoài trong thẻ từ cần duyệt.


## 13. Sửa sau review (2026-10-31)

- Xích lô (`PHanoi`, `PHue`) và thuyền vịt (`PDalat`) vẽ lại theo ảnh thật, dùng chung `review/place_parts.py`: khách ngồi trước dưới mui, người đạp ngồi sau; thuyền vịt có thân đầy, cổ chữ S có viền, hai người ngồi dưới mui nhỏ.
- `PAsia`: bỏ chim hạc, thay bằng 4 máy bay chạy trên đường bay nét đứt (CSS `offset-path`), bay dưới bệ và nhãn.
- `PEarth` làm lại trong `review/gen_earth.py`: toàn cầu kiểu Mollweide (thấy đủ mọi châu lục cùng lúc), 7 châu lục tô màu riêng, không vẽ biên giới; vũ trụ có sao, sao băng, Mặt Trời, hành tinh vành đai, Mặt Trăng, vệ tinh, tên lửa bay quanh; mây trôi và dải ngày đêm lướt qua. Địa điểm là 9 kỳ quan ghim đúng vị trí: Tượng Nữ thần Tự do, Chichén Itzá, Machu Picchu, Tượng Chúa Cứu Thế, Đấu trường La Mã, Kim tự tháp Giza, Lăng Taj Mahal, Vạn Lý Trường Thành, Nhà hát Sydney. Châu Nam Cực không có kỳ quan, chỉ có chim cánh cụt.
- **Cần làm khi vào code:** `content/curated/kids/world/places/e-*.json` hiện là ba nơi (hoang dã, băng giá, đồ vật thông minh), không khớp thiết kế mới. Phải soạn lại nội dung tầng 3 theo kỳ quan; `e-*` trên bảng chưa có trong content.

- Sau review lần 2: `PEarth` đổi từ bầu dục Mollweide sang quả cầu tròn quay thật. Trình bày bằng CSS thuần vì chưa chắc canvas chạy script: đường bờ biển tính sẵn 24 khung, trình duyệt nội suy `d: path()`; kỳ quan, tên châu, núi, cây trượt theo mặt cầu và mờ khi quay ra sau. Trong app dùng three.js để kéo xoay được, dừng khi chọn.
- `PAsia`: núi vẽ lại (`peak`: mặt nắng, mặt khuất, tuyết, chân đồi) xếp thành dãy Himalaya, Karakoram, Thiên Sơn; cây lá rộng và thông (`broadleaf`, `fir`) mọc theo vùng thật.
- Gỡ 10 bảng `Kids*` cũ khỏi canvas (file nguồn cục bộ vẫn còn).
- Lưu ý soát: ảnh chụp headless không ghi được hoạt ảnh `transform` theo virtual time (vật như đứng yên). Muốn xem, tua bằng `document.getAnimations().forEach(a=>{a.pause();a.currentTime=...})` trong bản sao tạm.
