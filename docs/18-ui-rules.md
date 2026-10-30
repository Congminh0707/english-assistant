# 18 — Quy tắc giao diện (UI rules)

Bộ quy tắc **bắt buộc** cho giao diện cửa sổ Học tập và component dùng chung, để mọi trang đồng bộ (bo góc, nút, icon, huy hiệu, màu). Lý do và bối cảnh: [12 §1b](12-ui-ux-guidelines.md), [decisions #28](decisions.md). Kiểm tra tự động: `pnpm ui:audit` (bắt cả nút còn lớp cũ như `primary/small/link` hoặc `<button>` không có lớp, emoji làm icon, khối thiếu bo góc, kiểu pixel cũ) (chạy trước khi xong task giao diện; phải **0 lỗi**).

**Phạm vi:** `src/renderer/study/**`, `src/renderer/shared/components/**` `src/renderer/mascot/components/**` (bong bóng mascot) và `src/renderer/popup/**`. Phần tử gốc của cửa sổ/bong bóng phải có class `modern` và nạp `shared/styles/ui.css`. Còn kiểu pixel chỉ ở `PxPanel`/`PxBar` mặc định, sprite, huy hiệu, hình minh hoạ (đọc `--px`, `--c-border` qua `PxPanel`/`PxBar`) nên không áp các quy tắc dưới; giao diện trẻ em dùng `kids.css` (lớp `.k-*`) với cùng token nhưng nút to hơn.

## 1. Nguyên tắc

1. **Một hệ, không tự chế.** Màu, cỡ chữ, khoảng cách, bán kính, bóng đều lấy từ token (`shared/styles/tokens.css`). Không viết mã màu hex, `px` bán kính hay `box-shadow` riêng trong component (chỉ `#fff` trên nền màu được phép).
2. **Dùng lớp dùng chung trước, CSS riêng sau.** Nút, thẻ, chip, ô nhập có sẵn trong `shared/styles/ui.css`; thiếu biến thể → thêm vào `ui.css` (và mục dưới), không viết lại trong component.
3. **Đã bo góc thì bo góc tất cả.** Mọi khối có nền hoặc viền (hàng danh sách, ô nhắc, ô nhập, nút, huy hiệu…) phải có `border-radius` theo bảng §2. Không để góc vuông lẫn góc bo trong cùng một trang. 4. **Icon là SVG (lucide), không phải emoji.** Dùng `<UiIcon name="…" />`. Emoji chỉ được nằm trong **dữ liệu nội dung** (tên chương, hình món đồ cửa hàng chờ ảnh thật, câu thoại mascot), không dùng làm nút/biểu tượng trong template.
4. **Thẳng hàng quan trọng hơn đẹp.** Thẻ trong lưới cùng chiều cao; hàng nút nằm đáy (`margin-top: auto`); dòng ghi chú chừa chỗ cố định → nút luôn thẳng hàng dù có/không có ghi chú.
5. **Sprite giữ pixel art** (`image-rendering: pixelated`); phần còn lại phẳng, bo góc, bóng mềm.

## 2. Bán kính

| Token      | Giá trị | Dùng cho                                                          |
| ---------- | ------- | ----------------------------------------------------------------- |
| `--r-sm`   | 8px     | ô nhỏ trong dòng (kbd, ô chữ, từ bấm được, nút `--xs`/`--sm`), mã |
| `--r-md`   | 12px    | nút, ô nhập, hàng danh sách, hộp ghi chú/phản hồi, ô lựa chọn     |
| `--r-lg`   | 16px    | thẻ (`.card`), khung lớn                                          |
| `--r-pill` | 999px   | huy hiệu, nhãn level, chip, thanh tiến độ                         |

Không bo: ô lưới lịch/hàng cột biểu đồ (có bo riêng theo thiết kế), lớp phủ toàn màn hình, khung layout (`.side`, `.content`).

## 3. Nút

Lớp: `.btn` + một biến thể màu (`--primary` hành động chính, `--success` mua/xác nhận, `--danger`, `--ghost` không viền) + cỡ (`--xs` 24px, `--sm` 30px, mặc định 36px, `--lg` 44px) + hình (`--icon` vuông, `--pill`, `--block` full chiều rộng).

- Mỗi màn hình **tối đa một** nút `--primary`/`--success` nổi bật; các nút phụ dùng `.btn` thường hoặc `--ghost`.
- Nút chỉ có icon: `class="btn btn--icon btn--sm"` + `title`/`aria-label` (vd nút loa, nút lưu, nút mic).
- Nút vô hiệu hoá dùng `:disabled` (đã có kiểu mờ), không tự đổi màu.
- Tuyệt đối **không** định nghĩa lại `.btn` trong `<style scoped>` của component.
- **Ngoại lệ — sân khấu game của bé** (`src/renderer/study/kids/game/`, [19 §5.4](19-kids-world.md)): nút HUD/thẻ trong màn game toàn màn hình là nút tròn lớn viền mực dày kiểu game (lớp riêng của component, không dùng `.btn`), màu cứng theo bảng màu tranh vẽ; vẫn phải có `aria-label`, icon bằng `<UiIcon>`, chuỗi qua i18n.

## 4. Icon

- Component duy nhất: `shared/components/UiIcon.vue` (`<UiIcon name="volume" />`, `size` mặc định 16, nét 2.2). Thêm icon mới = thêm vào bảng `ICONS` trong file đó (không import lucide rải rác trong component, trừ icon trang trí cố định trong một trang như thẻ thống kê).
- Tên đang có: `volume` (loa), `slow` (nghe chậm), `mic`, `stop`, `save`, `saved`, `check`, `done`, `dot`, `play`, `pause`, `trash`, `reset`, `hint`, `lock`, `close`, `repeat`, `star`, `headphones`, `test`, `home`, `game`, `pencil`, `write`, `party`, `pet`, `backspace`.
- Cùng một hành động phải dùng cùng một icon ở mọi trang (loa = nghe, bookmark = lưu từ/câu, mic = nói).
- Thư viện: `lucide-vue-next` (ISC, ghi ở [08](08-content-sources.md)).

## 5. Huy hiệu / nhãn / chip

- Nhãn level (A1, B2…), trạng thái, số đếm: **pill** (`--r-pill`), chữ `--fs-xs` đậm, một cặp màu nền nhạt + chữ đậm cùng tông (`--c-*-soft`). Dùng lớp `.chip` (+ `--success --primary --warning --danger`) cho nhãn mới; nhãn level hiện có giữ màu tím XP.
- Bộ lọc dạng chip bấm được: `btn btn--sm btn--pill`, đang chọn thêm `btn--primary`.
- Nhãn cùng loại trong một trang phải cùng kích thước và bán kính.

## 6. Thẻ, hàng danh sách, ô nhập

- Thẻ: `.card` (nền trắng, viền `--c-line` 1px, `--r-lg`, `--shadow-sm`, đệm `--sp-4`). Hàng trong thẻ: viền mảnh hoặc nền `--c-surface-2`, `--r-md`.
- Ô nhập/`select`: kiểu chung đã có trong `ui.css` (cao 30px, `--r-sm`); đừng đặt lại viền/bán kính.
- Tiêu đề trang: `<h1 class="page-title">`; tiêu đề khối `h2` cỡ `--fs-lg`.
- Khoảng cách theo `--sp-1…5` (4/8/12/16/24); không dùng số lẻ như 5px, 7px, 10px.
- Cỡ chữ theo `--fs-xs…2xl` (12/13/14/16/20/26).

## 7. Trạng thái & truy cập

- Hover: nền `--c-surface-2` (nút/hàng); focus bàn phím: viền 2px `--c-primary` (đã có cho `.btn`, `.nav-item`, ô nhập). Không tắt `outline`.
- Tương phản chữ/nền đạt AA; không dùng màu làm cách phân biệt duy nhất (kèm icon/chữ).
- Hoạt ảnh ngắn (≤ 150ms) và tôn trọng `prefers-reduced-motion`.

## 8. Quy trình khi làm/sửa giao diện

1. Dùng lớp/component dùng chung; nếu thiếu, thêm vào `ui.css` hoặc `UiIcon` rồi mới dùng.
2. `pnpm ui:audit` → 0 lỗi (cảnh báo màu hex nên giảm dần, không tăng).
3. `pnpm lint && pnpm test`; chạy app (hoặc mở trang `study` với dữ liệu mẫu) và xem lại các trang đụng tới ở độ rộng ~800px và ≥ 1100px.
4. Thêm quy tắc mới/ngoại lệ → sửa file này **trước**, rồi mới sửa code. Ngoại lệ có chủ đích → thêm vào `PIXEL_OK` trong `scripts/ui-audit.mjs` kèm chú thích lý do.

## 9. Checklist rà soát nhanh (mỗi trang)

- [ ] Mọi khối có nền/viền đều bo góc đúng bậc (§2).
- [ ] Nút dùng `.btn` (đúng cỡ/biến thể); nút icon có `title`.
- [ ] Không còn emoji làm icon; icon đúng tên chuẩn (§4).
- [ ] Nhãn/huy hiệu cùng pill, cùng cỡ.
- [ ] Thẻ lưới cùng chiều cao, nút thẳng hàng.
- [ ] Không màu hex/px bán kính riêng; khoảng cách theo `--sp-*`.
- [ ] Xem ở ~800px không vỡ bố cục, không thanh cuộn ngang thừa.

## 10. Bản đồ 3D & công trình 3D (màn game bé — docs/19 §5.2)

Áp dụng cho `src/renderer/study/kids/game/map3d.ts`, `landmarks3d/*`, `map3dVehicles.ts`. Mục tiêu: **một bức tranh hoạt hình thống nhất, đẹp và chi tiết, bám sát công trình thật**.

**Phong cách chung**

- Chất liệu: luôn qua `toon()` (`game/toon.ts`, 4 bậc sáng). Không dùng `MeshLambert/Standard` riêng lẻ trừ mặt nước (Phong trong mờ) và hiệu ứng (mây, khói: Basic trong mờ).
- Viền mực do hậu kỳ theo độ sâu (không vẽ viền bằng tay). Nhãn tên vẽ **sau** hậu kỳ (scene riêng) để viền không cắt chữ.
- Màu: tươi nhưng không chói; dùng đúng màu thật của công trình (ngói âm dương nâu sẫm Hội An, ngói lưu ly vàng Huế, gạch nung đỏ tháp Chăm, tường vàng kem Bến Thành…). Tránh đen tuyệt đối (tối nhất `#2b2b36`) và trắng tuyệt đối trên mảng lớn (`#f6f4ee`).
- Không voxel/pixel trên bản đồ 3D — voxel chỉ cho bản đồ 2D/sticker.

**Hình khối & chi tiết (bám thực tế)**

- Mỗi công trình phải có **≥ 3 đặc điểm nhận diện thật** (ghi ở đầu hàm dựng), vd Ngọ Môn: đài hình chữ U có hai cánh vươn ra trước, 5 cửa (3 trước + 2 ở hai cánh), lầu Ngũ Phụng 2 tầng mái ngói vàng/xanh.
- Tỉ lệ đúng tương đối (cao/rộng, số tầng, số cửa, số cột) — đếm theo ảnh thật; không ước đại.
- Mái Việt/Á Đông: dùng `eaveRoof`/`gable` + đầu đao, có diềm mái; ngói nhiều lớp (dải ngói) khi nhìn gần.
- Chi tiết theo 3 cấp: **khối chính** (thấy từ toàn cảnh) → **đặc điểm** (cửa vòm, cột, lan can, bảng tên, đèn lồng) → **trang trí nhỏ** (con giống, hoa văn, chậu cây, người). Cấp 3 chỉ cần khi camera cận cảnh (chân công trình ~10 đơn vị cục bộ).
- Công trình **nằm lọt trong bản đồ**: đất quanh được nâng ngang mặt nền mô hình (`PLATES` trong `landmarks3d/index.ts`: `top`, `channel` cho lòng sông của mô hình), không thành khối đặt lên; các công trình cách nhau ≥ 1,75 lần bề rộng để không đè nhau.
- Nền công trình: hình tròn/hữu cơ hoặc theo đúng hình thật (hồ, sông, quảng trường) — không tấm vuông dán lên đất. Công trình trên nước (chợ nổi, vịnh) phải nằm trên mặt nước thật (nền nước).
- Có người/xe/thuyền nhỏ để thấy tỉ lệ và sự sống.

**Hoạt ảnh**

- Mỗi nơi có ít nhất một hoạt ảnh lặp riêng (`group.userData.tick(t)`): chậm, êm (chu kỳ ≥ 4 giây), không giật, không nhấp nháy mạnh.
- Phương tiện: **xe mui trần**, **ca nô**, **máy bay phản lực nhỏ**; bánh xe lăn theo quãng đường, thuyền chòng chành, máy bay quay cánh quạt; tốc độ đi chậm vừa phải (ô tô 150, thuyền 95, máy bay 300 đơn vị sân khấu/giây), chuyến dài thì bay lâu hơn (tối đa 24 giây).
- Tôn trọng giảm chuyển động: camera nhảy thẳng, không lượn vòng.

**Camera & tỉ lệ**

- Công trình rộng `LANDMARK_SPAN` = 3,4 đơn vị thế giới; tới nơi thì cận cảnh (khoảng cách ~4,6, nghiêng 0,5) và lượn chậm quanh công trình.
- Camera không bao giờ chui vào đất/núi (luôn cao hơn mặt đất dưới nó).
- Đường đi bám địa hình, **một tuyến chính chạy ngang qua bên cạnh** mỗi nơi (điểm dừng nằm trên đường, lệch vuông góc với hướng đi) — không rẽ vào rồi quay ra (không có hai đường song song ra vào), không cắt ngang công trình.
- Đường là **đường mòn đất** cùng tông bản đồ (vàng đất, mép mềm tan vào cỏ, vệt mòn sáng ở giữa, không vạch sơn), **nét liền** — cả nước là **một tuyến xuyên suốt**, chỉ mờ dần ở hai đầu tuyến; cây/nhà không mọc trên đường. Qua sông ngắn thì **cầu gỗ nối liền** với đường; qua biển/sông lớn thì **bến gỗ** ở hai bờ + đường phà chấm trắng. Mặt đất dưới đường được san theo cao độ đường đã làm mượt để xe không rung giật.

**Quy trình rà soát**

1. `pnpm landmarks3d:sheet --ids a,b --out x.png` xuất ảnh các công trình (toàn cảnh + cận cảnh) để soi, so với ảnh thật.
2. Kiểm tra trên bản đồ: `KIDS_UNLOCK_ALL=1 pnpm dev`, bật 3D, đi tới từng nơi.
3. Ngân sách: mỗi công trình ≤ ~60 nghìn tam giác; toàn bản đồ giữ ≥ 30 fps trên GPU tích hợp ở 1080p.
