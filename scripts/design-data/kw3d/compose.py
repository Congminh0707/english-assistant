import base64, io, json, sys
from PIL import Image
D = 'C:/Users/01217/AppData/Local/Temp/kw3d/'
OUT = sys.argv[1]

def img(name, w=None, q=80):
    im = Image.open(D + name + '.png').convert('RGB')
    if w and im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

HEAD = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>%s</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&amp;family=Baloo+2:wght@700;800&amp;display=swap">
<style>
body{margin:0}
.t{font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#2B2B3A;background:#FBF4E4;box-sizing:border-box}
.h{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;margin:0}
.chip{display:inline-flex;align-items:center;height:24px;padding:0 12px;border-radius:999px;font:700 12px 'Be Vietnam Pro',sans-serif;background:#FFF0CC;color:#7A4A06}
.card{background:#fff;border:1px solid #E6DCC3;border-radius:16px;box-shadow:0 1px 2px rgba(43,43,58,.06),0 1px 3px rgba(43,43,58,.08)}
.shot{position:relative;border-radius:16px;overflow:hidden;border:3px solid #3b2a3a;box-shadow:0 4px 0 #3b2a3a;background:#9ADBF2}
.shot img{display:block;width:100%%;height:100%%;object-fit:cover}
.hud{position:absolute;background:#fff;border:3px solid #3b2a3a;box-shadow:0 3px 0 #3b2a3a;border-radius:999px;display:flex;align-items:center;justify-content:center;font:800 15px 'Baloo 2',sans-serif;color:#3b2a3a}
.cap{font-size:13px;color:#5E5E73;line-height:1.45}
.cap b{color:#2B2B3A}
ul.n{margin:6px 0 0;padding-left:18px;font-size:13px;line-height:1.55;color:#3a3a4c}
@keyframes cl{0%%{transform:translateX(-120%%)}100%%{transform:translateX(1400%%)}}
@keyframes rn{0%%{transform:translateY(-10%%)}100%%{transform:translateY(110%%)}}
@keyframes tw{0%%,100%%{opacity:.25}50%%{opacity:1}}
@keyframes bp{0%%,100%%{transform:translate(-50%%,0) scale(1)}50%%{transform:translate(-50%%,-6px) scale(1.06)}}
.hs{position:absolute;transform:translate(-50%%,0);animation:bp 1.8s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.hs{animation:none}}
</style>
</helmet>
"""
TAIL = """</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":%d,"height":%d}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
"""
ICON = {
 'home': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b2a3a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
 'vol': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b2a3a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
 'drop': '<svg width="22" height="22" viewBox="0 0 24 24" fill="#7CC4EA" stroke="#3b2a3a" stroke-width="2.4" stroke-linejoin="round"><path d="M12 2.7S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.7 12 2.7Z"/></svg>',
 'star': '<svg width="22" height="22" viewBox="0 0 24 24" fill="#E8B22E" stroke="#3b2a3a" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"/></svg>',
 'sun': '<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFD66B" stroke="#3b2a3a" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" fill="none"/></svg>',
 'lock': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E5E73" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
}

def page(title, w, h, body):
    return HEAD % title + body + TAIL % (w, h)

def hdr(h1, chip, sub):
    return ('<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap"><h1 class="h" style="font-size:36px;line-height:1">%s</h1><span class="chip">%s</span><span class="cap">%s</span></div>' % (h1, chip, sub))

def hudbar(tier=1, sky='Trưa', icon='sun'):
    return ('<div class="hud" style="left:14px;top:14px;width:46px;height:46px">%s</div>'
            '<div class="hud" style="left:70px;top:14px;height:46px;padding:0 16px;gap:8px">%s 46 <span style="width:3px;height:22px;background:#E6DCC3;border-radius:2px"></span>%s 12/34</div>'
            '<div class="hud" style="right:14px;top:14px;width:46px;height:46px">%s</div>'
            '<div class="hud" style="right:14px;top:70px;width:46px;height:46px;background:#DDF0FF">%s</div>'
            '<div class="hud" style="right:70px;top:14px;height:46px;padding:0 14px;gap:6px">%s %s</div>'
            '<div class="hud" style="left:14px;bottom:14px;height:44px;padding:0 6px;gap:4px;font-size:14px"><span style="background:#3b2a3a;color:#fff;border-radius:999px;padding:3px 12px">Tầng 1</span><span style="padding:3px 10px;color:#5E5E73">Tầng 2</span><span style="padding:3px 10px;color:#5E5E73">Tầng 3</span></div>'
            % (ICON['home'], ICON['star'], ICON['drop'], ICON['vol'], ICON['drop'], ICON[icon], sky))

# ---------------- 1. Bản đồ Việt Nam ----------------
def board_vn():
    A = img('vn_all', 760); B = img('zoom_region', 560); C = img('zoom_prov', 560); Dd = img('zoom_lm', 560)
    body = ('<div class="t" style="width:1560px;height:1130px;padding:28px 36px;display:flex;flex-direction:column;gap:16px">'
            + hdr('Kids World · Bản đồ Việt Nam 3D · 34 tỉnh', 'Ảnh chụp từ engine thật + đề xuất', 'Giữ nguyên phong cách game hiện tại: three.js toon, viền mực, công trình 3D, xe 3D. Phần mới: biên 34 tỉnh, ghim số, giờ/thời tiết.')
            + '<div style="display:flex;gap:20px;flex:1;min-height:0">'
            '<div class="shot" style="width:760px;height:1000px;flex:none"><img src="%s" alt="Toàn cảnh Việt Nam 3D với biên 34 tỉnh">%s</div>' % (A, hudbar(1, 'Trưa'))
            + '<div style="flex:1;display:flex;flex-direction:column;gap:14px;min-width:0">'
            '<div class="card" style="padding:14px 16px"><div class="h" style="font-size:20px">Thang zoom: toàn quốc → vùng → tỉnh → địa danh</div><div class="cap" style="margin-top:2px">Bé chạm ghim hoặc kính lúp để đi vào; mỗi nấc đổi mức chi tiết (nhãn tỉnh ở xa, nhãn địa danh ở gần, vào hẳn công trình ở cuối).</div></div>'
            '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">'
            '<div><div class="shot" style="height:200px"><img src="%s" alt="Vùng"></div><div class="cap" style="margin-top:8px"><b>② Vùng</b> · nhãn 34 tỉnh + ghim số</div></div>'
            '<div><div class="shot" style="height:200px"><img src="%s" alt="Tỉnh"></div><div class="cap" style="margin-top:8px"><b>③ Tỉnh</b> · công trình + đường + xe nhỏ</div></div>'
            '<div><div class="shot" style="height:200px"><img src="%s" alt="Địa danh"></div><div class="cap" style="margin-top:8px"><b>④ Địa danh</b> · camera lượn quanh, thẻ "Bắt đầu"</div></div></div>'
            % (B, C, Dd)
            + '<div class="card" style="padding:16px 18px"><div class="h" style="font-size:20px">Ghi chú thiết kế (để áp dụng)</div><ul class="n">'
            '<li><b>Dữ liệu 34 tỉnh</b>: tên từ provinces.open-api.vn (v2); ranh giới ghép từ geoBoundaries (63 tỉnh cũ) theo Nghị quyết 202/2025/QH15 — script <code>scripts/design-data/vn-provinces-merge.py</code>. Đường trắng mỏng trên ảnh là biên tỉnh, vẽ phủ lên địa hình.</li>'
            '<li><b>Việc code cần làm</b>: bờ biển/địa hình hiện là hình giản lược (<code>vnMap.ts</code>). Cần dựng lại <code>vnHeightfield</code> từ polygon 34 tỉnh thật (cùng nguồn) để biên khít với bờ biển.</li>'
            '<li><b>Tỉ lệ</b>: 1 px nguồn ≈ 1,7 km (xấp xỉ 1:6 triệu). Giữ đúng tỉ lệ ngang/dọc hình chữ S; Hoàng Sa, Trường Sa là cụm đảo ngoài khơi.</li>'
            '<li><b>Ghim</b>: tròn xanh dương = chưa học, xanh lá + dấu tích = xong, ô khoá = chưa mở. Ở xa dùng ghim số thay thẻ tên to (thẻ to chồng nhau — xem ảnh chụp hiện trạng).</li>'
            '<li><b>Mỗi tỉnh 1–nhiều địa danh</b>: dữ liệu <code>place.provinceId</code>; nhiều địa danh cùng tỉnh xếp thành cụm ghim, bấm vào tỉnh sẽ zoom và tách cụm.</li>'
            '<li><b>Thú cưng</b> (sprite 2D vector mới) đứng trên ghim hiện tại; xe 3D giữ nguyên.</li></ul></div>'
            '</div></div></div>')
    return page('Kids World bản đồ Việt Nam 3D', 1560, 1130, body)

# ---------------- 2. Thời gian & thời tiết ----------------
def board_weather():
    names = [('f_dawn', 'Bình minh · 5–7 giờ', 'sun'), ('f_noon', 'Ban ngày · 7–16 giờ', 'sun'), ('f_dusk', 'Hoàng hôn · 16–18 giờ', 'sun'), ('f_night', 'Ban đêm · 18–5 giờ', 'sun'),
             ('f_rain', 'Mưa', 'sun'), ('f_nightrain', 'Mưa ban đêm', 'sun'), ('f_snow', 'Tuyết (vùng núi cao)', 'sun'), ('f_fog', 'Sương mù', 'sun')]
    tiles = ''
    for n, t, _ in names:
        tiles += '<div><div class="shot" style="height:208px"><img src="%s" alt="%s"></div><div style="font:700 14px \'Be Vietnam Pro\';margin-top:6px">%s</div></div>' % (img(n, 520, 78), t, t)
    body = ('<div class="t" style="width:1360px;height:900px;padding:28px 36px;display:flex;flex-direction:column;gap:14px">'
            + hdr('Kids World · Giờ thật & thời tiết', 'Chụp từ engine thật', 'Cùng một góc nhìn (Đà Nẵng – Hội An), đổi giờ và thời tiết; chưa có trong game hiện tại.')
            + '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px">' + tiles + '</div>'
            '<div style="display:grid;grid-template-columns:1.1fr 1fr;gap:14px;flex:1;min-height:0">'
            '<div class="card" style="padding:14px 18px"><div class="h" style="font-size:20px">Quy tắc</div><ul class="n">'
            '<li><b>Giờ</b> lấy theo đồng hồ máy của bé (múi giờ máy). Chuyển cảnh mượt 20 giây giữa các mốc; trăng/sao hiện khi tối, đèn lồng và cửa sổ nhà sáng ấm (cộng sáng).</li>'
            '<li><b>Thời tiết</b>: có mạng thì lấy theo vị trí thành phố của bé (Open-Meteo, cần ghi docs/08 trước khi dùng); không có mạng hoặc phụ huynh tắt → thời tiết theo mùa/giờ giả lập. Không gửi vị trí chính xác, chỉ tên thành phố.</li>'
            '<li><b>Mưa</b>: mây xám lớn, sọc mưa nhẹ (không đen), nước gợn; sau mưa có cầu vồng 20 giây. <b>Tuyết</b> chỉ ở vùng núi (Sa Pa), phủ trắng màu cỏ.</li>'
            '<li><b>Thông tin cho bé</b>: chip nhỏ góc trên (biểu tượng + chữ "Trời nắng") — bấm để nghe từ vựng thời tiết (sunny, rainy…), nối với bài "Bầu trời" ở Đà Nẵng.</li></ul></div>'
            '<div class="card" style="padding:14px 18px"><div class="h" style="font-size:20px">Cách làm trong code</div><ul class="n">'
            '<li>Hậu kỳ viền mực hiện có (<code>map3d.ts</code>) thêm 3 uniform: nhân màu, cộng màu, mức tuyết → đổi giờ/thời tiết gần như miễn phí.</li>'
            '<li>Đèn mặt trời/bầu trời đổi cường độ + màu theo mốc; sương mù đổi màu theo bảng.</li>'
            '<li>Mưa/tuyết là LineSegments/Points vẽ sau hậu kỳ (không bị viền mực), số hạt theo mức chất lượng; tắt khi giảm chuyển động.</li>'
            '<li>Ảnh trên được sinh bằng <code>scripts/design-data/kw3d/</code> (xem docs/21).</li></ul></div></div></div>')
    return page('Kids World giờ và thời tiết', 1360, 900, body)

# ---------------- 3. Di chuyển ----------------
def board_travel():
    V = [('v_car', 'Ô tô mui trần', 'Bánh quay, thân nhún theo dốc, bụi khói nhỏ; thú cưng ngồi ghế trước, tai/đuôi bay theo gió.'),
         ('v_boat', 'Thuyền máy (phà)', 'Rời bến gỗ, vệt bọt trắng kéo dài phía sau, thuyền lắc nhẹ theo sóng.'),
         ('v_plane', 'Máy bay nhỏ', 'Cất cánh có ngóc đầu, cánh quạt quay, bóng nhỏ dần theo độ cao, vệt mây sau đuôi.')]
    tiles = ''
    for n, t, d in V:
        tiles += '<div><div class="shot" style="height:300px"><img src="%s" alt="%s"></div><div class="h" style="font-size:20px;margin-top:8px">%s</div><div class="cap">%s</div></div>' % (img(n, 640, 80), t, t, d)
    body = ('<div class="t" style="width:1360px;height:900px;padding:28px 36px;display:flex;flex-direction:column;gap:14px">'
            + hdr('Kids World · Xe, thuyền, máy bay + thú cưng', 'Chụp từ engine thật', 'Giữ xe 3D hiện tại; thay thú cưng pixel bằng sprite vector mới (Kitsu) và thêm các chi tiết chuyển động.')
            + '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">' + tiles + '</div>'
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;flex:1;min-height:0">'
            '<div class="card" style="padding:14px 18px"><div class="h" style="font-size:20px">Cải thiện chuyển động phương tiện</div><ul class="n">'
            '<li><b>Tăng/giảm tốc có đà</b>: nhún ra sau khi xuất phát, chúi về trước khi phanh; thú cưng nghiêng theo.</li>'
            '<li><b>Camera đi theo</b> có độ trễ (lò xo) và hơi nghiêng vào cua; zoom ra khi nhanh, vào khi tới nơi.</li>'
            '<li><b>Hiệu ứng vệt</b>: bụi đường (ô tô), bọt + sóng đuôi (thuyền), vệt mây (máy bay) — hạt dùng lại, tắt khi giảm chuyển động.</li>'
            '<li><b>Còi và âm</b> theo xe (đã có <code>sfx.ts</code>); thêm tiếng nước, gió.</li>'
            '<li><b>Chuyển phương tiện</b> ở bến: ô tô đỗ → thuyền ghé cầu gỗ → thú cưng nhảy lên (0,6 giây), có dấu "!" mỉm cười.</li></ul></div>'
            '<div class="card" style="padding:14px 18px"><div class="h" style="font-size:20px">Chuyển động của thú cưng</div><ul class="n">'
            '<li>Đi bộ trên ghim: nhún theo nhịp bước, đuôi đung đưa; chạy khi quãng dài; nhìn quanh khi chờ.</li>'
            '<li>Trên xe: ngồi, hai tai bay, mắt nheo; máy bay: bám cửa sổ, vẫy tay.</li>'
            '<li>Tới nơi: nhảy mừng + pháo giấy (đã có), rồi quay mặt vào công trình.</li>'
            '<li>Bộ 6 trạng thái hoạt ảnh đầy đủ ở bảng <i>Hoạt ảnh · Kitsu</i>; các nhân vật khác làm sau khi duyệt hình.</li>'
            '<li>Sprite vector xuất ra PNG nhiều khung (sheet) để giữ cách ghép <code>PetSprite</code> hiện có.</li></ul></div></div></div>')
    return page('Kids World di chuyển', 1360, 900, body)

# ---------------- 4. Hoà mình vào địa danh ----------------
def board_landmark():
    A = img('i_1', 760); B = img('i_2', 760); C = img('i_3', 1280, 82)
    hot = [(300, 300, 'Đèn lồng', 'lantern', '#FFB347'), (640, 395, 'Chùa Cầu', 'bridge', '#E8604C'), (990, 330, 'Thuyền', 'boat', '#4FA6E8'), (140, 540, 'Hoa đăng', 'flower', '#FF8FB1')]
    hs = ''.join('<div class="hs" style="left:%dpx;top:%dpx;text-align:center"><div style="background:#fff;border:3px solid #3b2a3a;box-shadow:0 3px 0 #3b2a3a;border-radius:16px;padding:6px 14px;font:800 17px \'Baloo 2\';color:#3b2a3a;white-space:nowrap"><span style="display:inline-block;width:12px;height:12px;border-radius:50%%;background:%s;margin-right:6px;vertical-align:-1px"></span>%s</div><div style="width:3px;height:16px;background:#3b2a3a;margin:0 auto"></div><div style="width:14px;height:14px;border-radius:50%%;background:%s;border:3px solid #fff;box-shadow:0 0 0 3px #3b2a3a;margin:0 auto"></div></div>' % (x, y - 70, c, t, c) for x, y, t, _, c in hot)
    body = ('<div class="t" style="width:1280px;height:1130px;padding:24px 28px;display:flex;flex-direction:column;gap:14px">'
            + hdr('Kids World · Hoà mình vào địa danh (Hội An)', 'Chụp từ engine thật + đề xuất', 'Chạm ghim → camera bay xuống, đi vào trong công trình → chọn phần học bằng các điểm chạm.')
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div><div class="shot" style="height:213px"><img src="%s" alt="Bước 1"></div><div class="cap" style="margin-top:6px"><b>① Tới nơi</b> · thú cưng dừng ở ghim, thẻ tên bật lên</div></div>' % A
            + '<div><div class="shot" style="height:213px"><img src="%s" alt="Bước 2"></div><div class="cap" style="margin-top:6px"><b>② Zoom vào</b> · camera hạ thấp, hậu cảnh mờ dần, nhạc nền địa danh</div></div></div>' % B
            + '<div class="shot" style="width:1224px;height:620px"><img src="%s" alt="Bên trong Hội An">%s'
              '<div class="hud" style="left:14px;top:14px;width:46px;height:46px">%s</div>'
              '<div class="hud" style="left:70px;top:14px;height:46px;padding:0 18px;font-size:17px">Hội An · Phố đèn lồng</div>'
              '<div class="hud" style="left:50%%;transform:translateX(-50%%);bottom:18px;height:50px;padding:0 20px;gap:10px;font-size:16px"><span style="width:120px;height:10px;border-radius:999px;background:#E6DCC3;overflow:hidden;display:inline-block"><i style="display:block;width:40%%;height:100%%;background:#4CAF6A"></i></span>2/5 phần · 4 từ mới</div>'
              '<div class="hud" style="right:14px;bottom:14px;height:46px;padding:0 18px;background:#4CAF6A;color:#fff;font-size:18px">Ra ngoài</div></div>' % (C, hs, ICON['home'])
            + '<div class="card" style="padding:12px 18px;display:grid;grid-template-columns:1fr 1fr;gap:20px"><ul class="n" style="margin:0">'
            '<li><b>Điểm chạm</b> = 1 phần học (5 phần: làm quen, chạm hình, chơi, nói theo, nghe câu — như lượt 5 bước hiện có). Bé chạm vật thật trong cảnh (đèn lồng, thuyền…) để vào phần đó.</li>'
            '<li>Điểm chưa làm: bong bóng nhún nhẹ; đã xong: tick xanh + vật phát sáng.</li></ul>'
            '<ul class="n" style="margin:0"><li><b>Code</b>: nới giới hạn camera (<code>dist ≥ 1,6</code>, <code>pitch ≥ 0,12</code>) khi ở chế độ vào trong; điểm chạm là các <code>Object3D</code> đặt theo <code>landmark.hotspots[]</code> trong dữ liệu địa danh, chiếu ra màn hình để vẽ bong bóng.</li>'
            '<li>Mỗi địa danh cần cảnh nội thất/cận cảnh riêng (12 nơi tầng 1 + tầng 2–3) — làm dần, mỗi nơi tối đa 5 điểm chạm.</li></ul></div></div>')
    return page('Kids World hoà mình vào địa danh', 1280, 1130, body)

boards = {'KidsMapVN': board_vn, 'KidsWeather': board_weather, 'KidsTravel': board_travel, 'KidsLandmark': board_landmark}
for k, f in boards.items():
    open(OUT + '/' + k + '.dc.html', 'w', encoding='utf-8').write(f())
    print(k, 'ok')
