import sys, random
OUT = sys.argv[1]
random.seed(11)
CSS = """
body{margin:0}
.t{font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#2B2B3A}
.h{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;margin:0}
.card{background:#fff;border:1px solid #E6DCC3;border-radius:16px;box-sizing:border-box;overflow:hidden}
.chip{display:inline-flex;align-items:center;height:24px;padding:0 12px;border-radius:999px;font:700 12px 'Be Vietnam Pro',sans-serif}
.cap{padding:8px 14px 12px}
.d{font-size:12px;color:#5E5E73;line-height:1.4;margin-top:2px}
@keyframes rays{to{transform:rotate(360deg)}}
@keyframes drift{from{transform:translateX(-60px)}to{transform:translateX(380px)}}
@keyframes rain{from{transform:translate(0,-30px)}to{transform:translate(-14px,200px)}}
@keyframes snow{0%{transform:translate(0,-20px)}50%{transform:translate(10px,90px)}100%{transform:translate(-6px,200px)}}
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes flash{0%,86%,100%{opacity:0}88%{opacity:.85}90%{opacity:.1}92%{opacity:.7}96%{opacity:0}}
@keyframes bolt{0%,86%,100%{opacity:0}88%,92%{opacity:1}}
@keyframes glow{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes ripple{0%{transform:scale(.3);opacity:.9}100%{transform:scale(1.4);opacity:0}}
@keyframes sunrise{0%,100%{transform:translateY(6px)}50%{transform:translateY(-4px)}}
@keyframes fog{from{transform:translateX(-40px)}to{transform:translateX(40px)}}
.rays{animation:rays 40s linear infinite;transform-box:fill-box;transform-origin:center}
.cl{animation:drift var(--s,30s) linear infinite;animation-delay:var(--d,0s)}
.rn{animation:rain .8s linear infinite;animation-delay:var(--d,0s)}
.sn{animation:snow var(--s,6s) linear infinite;animation-delay:var(--d,0s)}
.st{animation:twinkle 3s ease-in-out infinite;animation-delay:var(--d,0s)}
.fl{animation:flash 5s infinite}
.bo{animation:bolt 5s infinite}
.gl{animation:glow 2.6s ease-in-out infinite}
.rp{animation:ripple 1.6s ease-out infinite;transform-box:fill-box;transform-origin:center;animation-delay:var(--d,0s)}
.sr{animation:sunrise 6s ease-in-out infinite}
.fg{animation:fog 10s ease-in-out infinite alternate}
@media (prefers-reduced-motion:reduce){.rays,.cl,.rn,.sn,.st,.fl,.bo,.gl,.rp,.sr,.fg{animation:none}}
"""
DEFS = """<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<g id="cloud"><ellipse cx="0" cy="0" rx="34" ry="12"/><ellipse cx="-16" cy="-8" rx="18" ry="12"/><ellipse cx="12" cy="-12" rx="22" ry="14"/></g>
<g id="house"><rect x="-26" y="-20" width="52" height="30" fill="#F2C94C"/><path d="M-32 -20L0 -40L32 -20Z" fill="#8A4B2A"/><rect x="-6" y="-8" width="12" height="18" rx="2" fill="#6B3E2E"/><rect x="-20" y="-14" width="9" height="9" rx="2" style="fill:var(--w,#BFE3F2)"/><rect x="11" y="-14" width="9" height="9" rx="2" style="fill:var(--w,#BFE3F2)"/></g>
<g id="lant"><path d="M0 -8V-3" stroke="#6B3E2E" stroke-width="1.5"/><ellipse cx="0" cy="4" rx="5" ry="6.5" fill="#E8604C"/><rect x="-3" y="-3" width="6" height="2" fill="#6B3E2E"/></g>
</defs></svg>"""

def tree(x, y, s=1, c='#4CAF6A'):
    return '<g transform="translate(%s %s) scale(%s)"><rect x="-2" y="-6" width="4" height="12" fill="#6B3E2E"/><circle cx="0" cy="-12" r="11" fill="%s"/></g>' % (x, y, s, c)

def scene(sky, ground, hill, body, night=False, snowy=False, w=310, h=190):
    s = '<svg width="100%%" viewBox="0 0 %d %d" style="display:block" role="img"><defs><linearGradient id="sk%s" x1="0" y1="0" x2="0" y2="1">%s</linearGradient></defs>' % (w, h, sky[0], sky[1])
    s += '<rect width="%d" height="%d" fill="url(#sk%s)"/>' % (w, h, sky[0])
    s += body[0]  # sky objects
    s += '<path d="M0 138C60 112 120 120 180 130C230 138 270 120 310 112V190H0Z" fill="%s"/>' % hill
    s += '<path d="M0 156C70 140 150 150 220 150C260 150 290 146 310 142V190H0Z" fill="%s"/>' % ground
    # village
    win = '#FFD66B' if night else '#BFE3F2'
    s += '<g transform="translate(70 142) scale(.8)" style="--w:%s">' % win + '<use href="#house"/></g>'
    s += '<g transform="translate(150 146) scale(.6)" style="--w:%s"><use href="#house"/></g>' % win
    s += '<g transform="translate(228 140) scale(.9)" style="--w:%s"><use href="#house"/></g>' % win
    for x in (60, 100, 140, 190, 250): s += '<g class="%s"><use href="#lant" transform="translate(%d 120)"/></g>' % ('gl' if night else '', x)
    s += tree(26, 150, .9, '#FFFFFF' if snowy else '#4CAF6A') + tree(284, 152, 1.1, '#FFFFFF' if snowy else '#3E9A5A')
    s += body[1]  # foreground sky effects (rain/snow/fog)
    return s + '</svg>'

def stars(n=26):
    return ''.join('<circle class="st" style="--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="#fff"/>' % (random.uniform(0, 3), random.randint(6, 300), random.randint(4, 90), random.uniform(.8, 1.8)) for _ in range(n))

def raindrops(n=26, col='#6F8FB8'):
    return ''.join('<path class="rn" style="--d:-%.2fs" d="M%d 0l-4 12" stroke="%s" stroke-width="1.8" stroke-linecap="round"/>' % (random.uniform(0, .8), random.randint(0, 320), col) for _ in range(n))

def snowflakes(n=34):
    return ''.join('<circle class="sn" style="--s:%.1fs;--d:-%.1fs" cx="%d" cy="0" r="%.1f" fill="#fff"/>' % (random.uniform(4, 8), random.uniform(0, 8), random.randint(0, 310), random.uniform(1.4, 3)) for _ in range(n))

def clouds(cols, ys, scale=1, s=40):
    out = ''
    for i, y in enumerate(ys):
        out += '<g class="cl" style="--s:%ds;--d:-%ds"><g transform="translate(0 %d) scale(%s)" fill="%s"><use href="#cloud"/></g></g>' % (s + i * 14, i * 11, y, scale, cols)
    return out

P = []
# dawn
P.append(('Bình minh', '5:00 – 7:00', 'Trời hồng cam, mặt trời nhô dần, sương mỏng', 'dawn',
          ('<stop offset="0" stop-color="#8E9BDB"/><stop offset=".55" stop-color="#FFB7A8"/><stop offset="1" stop-color="#FFE3B0"/>'),
          '#6DBE6A', '#8FD18A',
          ('<g class="sr"><circle cx="210" cy="118" r="24" fill="#FFE08A"/><circle cx="210" cy="118" r="36" fill="#FFE08A" opacity=".35"/></g>' + clouds('#FFE9E0', [40, 70], .8, 50),
           '<g class="fg" opacity=".35"><ellipse cx="80" cy="150" rx="90" ry="9" fill="#fff"/><ellipse cx="240" cy="156" rx="80" ry="8" fill="#fff"/></g>'), False, False))
# day
P.append(('Ban ngày nắng', '7:00 – 16:00', 'Trời xanh, nắng quay tia, mây trôi chậm', 'day',
          ('<stop offset="0" stop-color="#5EB8EE"/><stop offset="1" stop-color="#CFEFFA"/>'),
          '#58B866', '#7CCB7C',
          ('<g transform="translate(246 44)"><g class="rays"><g stroke="#FFD66B" stroke-width="4" stroke-linecap="round"><path d="M0 -40V-30M0 30V40M-40 0H-30M30 0H40M-28 -28L-21 -21M21 21L28 28M-28 28L-21 21M21 -21L28 -28"/></g></g><circle r="22" fill="#FFD66B"/></g>' + clouds('#fff', [36, 74, 100], 1, 36), ''), False, False))
# dusk
P.append(('Hoàng hôn', '16:00 – 18:30', 'Trời tím cam, nắng thấp, đèn lồng bắt đầu sáng', 'dusk',
          ('<stop offset="0" stop-color="#5B4B9E"/><stop offset=".55" stop-color="#F58F6B"/><stop offset="1" stop-color="#FFD08A"/>'),
          '#4E9A64', '#6DB06E',
          ('<g class="sr"><circle cx="64" cy="116" r="26" fill="#FF9F4A"/><circle cx="64" cy="116" r="40" fill="#FF9F4A" opacity=".3"/></g>' + clouds('#F8B7A8', [40, 76], .9, 44) + stars(6), ''), False, False))
# night
P.append(('Đêm trăng sao', '18:30 – 5:00', 'Trăng khuyết, sao nhấp nháy, đèn lồng và cửa sổ sáng', 'night',
          ('<stop offset="0" stop-color="#0F1747"/><stop offset="1" stop-color="#34438C"/>'),
          '#23483F', '#2E5C4C',
          (stars(30) + '<g transform="translate(240 40)"><circle r="22" fill="#FFF3C4"/><circle cx="9" cy="-4" r="19" fill="#1B2565"/></g>' + clouds('#4A5694', [60], .9, 60), ''), True, False))
# cloudy
P.append(('Nhiều mây', 'mây ≥ 70 %', 'Trời xám nhạt, mây dày trôi, không nắng', 'cloudy',
          ('<stop offset="0" stop-color="#9DB0C6"/><stop offset="1" stop-color="#DDE4EC"/>'),
          '#5E9F6A', '#76B07A',
          (clouds('#EEF2F7', [30, 62, 92, 118], 1.4, 34), ''), False, False))
# rain
P.append(('Mưa', 'mưa nhẹ → vừa', 'Mưa rơi chéo, vòng gợn trên mặt nước, đèn lồng vẫn sáng', 'rain',
          ('<stop offset="0" stop-color="#7C90AA"/><stop offset="1" stop-color="#B8C6D6"/>'),
          '#4F8F62', '#659F70',
          (clouds('#C9D3DF', [30, 64, 94], 1.4, 30), raindrops(34) + '<g fill="none" stroke="#fff" stroke-width="1.6"><ellipse class="rp" style="--d:0s" cx="90" cy="172" rx="14" ry="4"/><ellipse class="rp" style="--d:-.5s" cx="180" cy="176" rx="14" ry="4"/><ellipse class="rp" style="--d:-1s" cx="250" cy="170" rx="14" ry="4"/></g>'), False, False))
# storm
P.append(('Giông', 'mưa to · sấm chớp', 'Mây đen, chớp loé nhẹ (không nhấp nháy mạnh), thú cưng nép trong nhà', 'storm',
          ('<stop offset="0" stop-color="#2F3552"/><stop offset="1" stop-color="#6A7392"/>'),
          '#3D6F55', '#4A7F63',
          (clouds('#4C5470', [28, 62, 96], 1.6, 28) + '<path class="bo" d="M200 70L186 104L202 104L190 134L222 96L206 96L216 70Z" fill="#FFE98A"/><rect class="fl" width="310" height="190" fill="#fff" opacity=".0"/>', raindrops(40, '#9DB6E0')), True, False))
# snow
P.append(('Tuyết (Sa Pa, vùng lạnh)', 'nhiệt độ ≤ 2 °C', 'Tuyết rơi lả tả, mặt đất phủ trắng, cây đóng băng', 'snow',
          ('<stop offset="0" stop-color="#BFD6EE"/><stop offset="1" stop-color="#F4F8FB"/>'),
          '#F4F8FB', '#E3EEF7',
          (clouds('#fff', [32, 70], 1.3, 40), snowflakes(40)), False, True))

cards = ''
for name, rng, desc, key, sky, ground, hill, body, night, snowy in P:
    cards += '<div class="card">%s<div class="cap"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h" style="font-size:20px">%s</div><span class="chip" style="background:#F6EEDB;color:#5E5E73">%s</span></div><div class="d">%s</div></div></div>' % (scene((key, sky), ground, hill, body, night, snowy), name, rng, desc)

html = ("""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Kids weather time</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&family=Baloo+2:wght@700;800&display=swap">
<style>""" + CSS + """</style>
</helmet>
""" + DEFS + """
<div class="t" style="width:1360px;height:900px;background:#FBF4E4;padding:28px 40px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap"><h1 class="h" style="font-size:40px;line-height:1">Thời gian &amp; thời tiết của bản đồ</h1><span class="chip" style="background:#FFF0CC;color:#7A4A06">Bản thiết kế — chưa áp dụng</span><span style="font-size:14px;color:#5E5E73">Mọi cảnh (bản đồ, địa danh, đường đi) dùng chung một bộ trạng thái bầu trời.</span></div>
<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px">""" + cards + """</div>
<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">
<div class="card" style="padding:12px 16px;font-size:13px;line-height:1.55"><b>Quy tắc giờ thật:</b> lấy giờ máy của bé. Bình minh 5:00–7:00, ngày 7:00–16:00, hoàng hôn 16:00–18:30, đêm 18:30–5:00; chuyển cảnh mượt trong 20 giây (không nhảy cảnh). Địa danh ở múi giờ khác (tầng 2–3) dùng giờ địa phương của nơi đó.</div>
<div class="card" style="padding:12px 16px;font-size:13px;line-height:1.55"><b>Thời tiết thật:</b> tra thời tiết nơi bé tới (API khí tượng mở, có mạng) mỗi 30 phút; không có mạng hoặc phụ huynh tắt thì dùng theo mùa/vùng (Sa Pa mùa đông có tuyết). Không gửi vị trí chính xác của bé — chỉ toạ độ địa danh trên bản đồ.</div>
<div class="card" style="padding:12px 16px;font-size:13px;line-height:1.55"><b>An toàn &amp; truy cập:</b> chớp giông không nhấp nháy mạnh (tối đa 1 lần/5 s, độ sáng thấp); giảm chuyển động → cảnh tĩnh, vẫn đủ màu bầu trời; ban đêm đèn lồng và cửa sổ sáng, chữ trên thẻ luôn đạt tương phản.</div>
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1360,"height":900}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
""")
open(OUT + '/KidsWeather.dc.html', 'w', encoding='utf-8').write(html)
print(len(html))
