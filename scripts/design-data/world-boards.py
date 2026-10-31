import json, math, sys
OUT = sys.argv[1]
asia = json.load(open('asia.json', encoding='utf-8'))
earth = json.load(open('earth.json', encoding='utf-8'))

CSS = """
body{margin:0}
.t{font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#2B2B3A}
.h{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;margin:0}
.card{background:#fff;border:1px solid #E6DCC3;border-radius:16px;padding:14px 16px;box-sizing:border-box}
.chip{display:inline-flex;align-items:center;height:24px;padding:0 12px;border-radius:999px;font:700 12px 'Be Vietnam Pro',sans-serif}
.pnum{font:800 14px 'Baloo 2';fill:#fff;text-anchor:middle}
.lt{font:800 13px 'Baloo 2';fill:#2B2B3A}
.ls{font:500 10px 'Be Vietnam Pro';fill:#5E5E73}
.cn{font:600 10px 'Be Vietnam Pro';fill:#3A4A2E;text-anchor:middle;paint-order:stroke;stroke:#ffffffcc;stroke-width:3px;stroke-linejoin:round}
@keyframes drift{from{transform:translateX(-200px)}to{transform:translateX(1500px)}}
@keyframes ring{0%{transform:scale(.8);opacity:1}100%{transform:scale(1.6);opacity:0}}
@keyframes fly{from{offset-distance:0%}to{offset-distance:100%}}
@keyframes twinkle{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes rot{from{transform:translateX(0)}to{transform:translateX(-30px)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.cl{animation:drift var(--s,90s) linear infinite;animation-delay:var(--d,0s)}
.rec{animation:ring 1.8s ease-out infinite;transform-box:fill-box;transform-origin:center}
.plane{offset-rotate:auto;animation:fly var(--s,14s) linear infinite;animation-delay:var(--d,0s)}
.star{animation:twinkle 3s ease-in-out infinite;animation-delay:var(--d,0s)}
.pet{animation:bob 1.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.cl,.rec,.plane,.star,.pet{animation:none}}
"""
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&family=Baloo+2:wght@700;800&display=swap">
<style>%s</style>
</helmet>
"""
def tail(w, h):
    return """</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":%d,"height":%d}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
""" % (w, h)

DEFS = """<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ADBF2"/><stop offset="1" stop-color="#5FB6DC"/></linearGradient>
<radialGradient id="ocean" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="#8EDDF5"/><stop offset=".6" stop-color="#4FA9DA"/><stop offset="1" stop-color="#2F6FB5"/></radialGradient>
<radialGradient id="atmo" cx="50%" cy="50%" r="50%"><stop offset=".86" stop-color="#9DD8FF" stop-opacity=".0"/><stop offset=".95" stop-color="#9DD8FF" stop-opacity=".55"/><stop offset="1" stop-color="#9DD8FF" stop-opacity="0"/></radialGradient>
<linearGradient id="night" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0B1030" stop-opacity="0"/><stop offset=".55" stop-color="#0B1030" stop-opacity=".0"/><stop offset="1" stop-color="#0B1030" stop-opacity=".62"/></linearGradient>
<symbol id="lk" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>
<g id="cloud"><ellipse cx="0" cy="0" rx="34" ry="12" fill="#fff" opacity=".85"/><ellipse cx="-16" cy="-8" rx="18" ry="12" fill="#fff" opacity=".85"/><ellipse cx="12" cy="-12" rx="22" ry="14" fill="#fff" opacity=".85"/></g>
<g id="jet"><path d="M-12 0L10 -3L14 0L10 3Z" fill="#fff" stroke="#2B2B3A" stroke-width="1.6" stroke-linejoin="round"/><path d="M-2 0L-8 -9L-4 -9L4 -1ZM-2 0L-8 9L-4 9L4 1Z" fill="#7C9CFF" stroke="#2B2B3A" stroke-width="1.2" stroke-linejoin="round"/><path d="M-12 0L-16 -5L-12 -5Z" fill="#E8604C"/></g>
<g id="pet"><ellipse cx="0" cy="20" rx="14" ry="4" fill="#2B2B3A" opacity=".18"/><path d="M0 -4C-14 -4 -20 6 -20 14C-20 22 -10 24 0 24C10 24 20 22 20 14C20 6 14 -4 0 -4Z" fill="#6BC7B8"/><ellipse cx="-7" cy="10" rx="3" ry="4" fill="#2B2B3A"/><ellipse cx="7" cy="10" rx="3" ry="4" fill="#2B2B3A"/><circle cx="-8" cy="8" r="1.2" fill="#fff"/><circle cx="6" cy="8" r="1.2" fill="#fff"/><path d="M0 -4c-2-6 4-8 7-4" stroke="#4CAF6A" stroke-width="3" fill="none" stroke-linecap="round"/></g>
</defs></svg>"""

# ---------------- ASIA ----------------
vi = {'China': 'Trung Quốc', 'India': 'Ấn Độ', 'Japan': 'Nhật Bản', 'South Korea': 'Hàn Quốc', 'North Korea': 'Triều Tiên', 'Thailand': 'Thái Lan', 'Vietnam': 'Việt Nam', 'Cambodia': 'Campuchia', 'Laos': 'Lào', 'Myanmar': 'Myanmar', 'Malaysia': 'Malaysia', 'Indonesia': 'Indonesia', 'Philippines': 'Philippines', 'Mongolia': 'Mông Cổ', 'Kazakhstan': 'Kazakhstan', 'Saudi Arabia': 'Ả Rập Xê Út', 'Iran': 'Iran', 'Pakistan': 'Pakistan', 'Nepal': 'Nepal', 'Afghanistan': 'Afghanistan', 'Turkey': 'Thổ Nhĩ Kỳ', 'Russia': 'Nga', 'Uzbekistan': 'Uzbekistan', 'Iraq': 'Iraq', 'Bangladesh': 'Bangladesh'}
pal = ['#BFE3A0', '#F5DC9C', '#A9DEC4', '#F6C9B5', '#CFC3F0', '#BFE0F5']
cs = ''; cl = ''
for i, (n, v) in enumerate(sorted(asia['countries'].items())):
    if v['asia']:
        col = '#F5DC9C' if n == 'Vietnam' else pal[i % len(pal)]
        stroke = '#fff'
    else:
        col = '#E7E0CC'; stroke = '#fff'
    cs += '<path d="%s" fill="%s" stroke="%s" stroke-width="1.4" stroke-linejoin="round"/>' % (v['d'], col, stroke)
    if n in vi:
        x, y = v['c']
        cl += '<text x="%.0f" y="%.0f" class="cn">%s</text>' % (x, y, vi[n])
lmk = ['Vạn Lý Trường Thành', 'Núi Phú Sĩ', 'Cung Gyeongbok', 'Taj Mahal', 'Đỉnh Everest', 'Angkor Wat', 'Cung điện Hoàng gia', 'Tháp đôi Petronas', 'Marina Bay', 'Borobudur', 'Burj Khalifa', 'Petra']
locked = {'Burj Khalifa', 'Petra', 'Borobudur'}
disp = {'Vạn Lý Trường Thành': (0, -24, 'L'), 'Núi Phú Sĩ': (-6, 30, 'R'), 'Cung Gyeongbok': (26, -6, 'R'), 'Taj Mahal': (0, 0, 'L'), 'Đỉnh Everest': (0, -30, 'R'), 'Angkor Wat': (-34, 26, 'L'), 'Cung điện Hoàng gia': (-60, 0, 'L'), 'Tháp đôi Petronas': (-44, 24, 'L'), 'Marina Bay': (28, 34, 'R'), 'Borobudur': (0, 0, 'R'), 'Burj Khalifa': (0, 0, 'R'), 'Petra': (0, 0, 'R')}
pins = ''
for i, n in enumerate(lmk):
    x, y = asia['lm'][n]['xy']; co = asia['lm'][n]['country']
    dx, dy, sd = disp[n]; lk = n in locked; rec = n == 'Angkor Wat'
    col = '#9AA3B2' if lk else '#3F6FE0'
    ring = '<circle r="26" fill="none" stroke="#FFD66B" stroke-width="4" class="rec"/>' if rec else ''
    icon = '<use href="#lk" x="-7" y="-7" width="14" height="14" stroke="#fff" fill="none" stroke-width="2.6" stroke-linecap="round"/>' if lk else '<text y="5" class="pnum">%d</text>' % (i + 1)
    w = 150; lx = 18 if sd == 'R' else -18 - w
    lead = '<path d="M%.0f %.0fL%.0f %.0f" stroke="#2B2B3A" stroke-width="2" opacity=".6"/><circle cx="%.0f" cy="%.0f" r="4" fill="#E8604C" stroke="#fff" stroke-width="1.5"/>' % (x, y, x + dx, y + dy, x, y) if (dx or dy) else ''
    pins += '%s<g transform="translate(%.0f %.0f)">%s<circle r="15" fill="%s" stroke="#fff" stroke-width="3.5"/>%s<g transform="translate(%d -17)"><rect width="%d" height="34" rx="12" fill="#fff" stroke="#E6DCC3"/><text x="10" y="14" class="lt">%s</text><text x="10" y="27" class="ls">%s</text></g></g>' % (lead, x + dx, y + dy, ring, col, icon, lx, w, n, co)
# VN home: Hanoi approx
vnx, vny = asia['countries']['Vietnam']['c']
# plane arcs from VN to angkor, taj, great wall
def arc(x1, y1, x2, y2, bend=-60):
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    return 'M%.0f %.0fQ%.0f %.0f %.0f %.0f' % (x1, y1, mx, my + bend, x2, y2)
arcs = ''; planes = ''
for k, (n, bend, s, d) in enumerate([('Vạn Lý Trường Thành', -60, 16, 0), ('Taj Mahal', -80, 20, -6), ('Núi Phú Sĩ', -50, 14, -3)]):
    x, y = asia['lm'][n]['xy']
    dpath = arc(vnx, vny, x, y, bend)
    arcs += '<path d="%s" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" opacity=".9"/>' % dpath
    planes += '<g class="plane" style="offset-path:path(\'%s\');--s:%ds;--d:%ds"><use href="#jet"/></g>' % (dpath, s, d)
asia_html = (HEAD % ('Kids Asia tier 2', CSS) + DEFS +
    '<div class="t" style="width:1320px;height:1010px;background:#FBF4E4;padding:24px 40px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px">'
    '<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap"><h1 class="h" style="font-size:40px;line-height:1">Tầng 2 · Châu Á</h1><span class="chip" style="background:#FFF0CC;color:#7A4A06">Bản thiết kế — chưa áp dụng</span><span class="chip" style="background:#E4ECFF;color:#2F58BC">Natural Earth 50 m · phạm vi công cộng</span><span style="font-size:14px;color:#5E5E73">Địa danh nổi tiếng của châu lục; máy bay bay từ Việt Nam tới nơi được chọn.</span></div>'
    '<div style="width:1240px;height:760px;border-radius:24px;overflow:hidden;position:relative;border:3px solid #2B2B3A;box-shadow:0 6px 0 #2B2B3A;flex:none"><svg width="1240" height="760" viewBox="-20 -8 1250 760" role="img" aria-label="Bản đồ châu Á">'
    '<rect x="-20" y="-8" width="1250" height="760" fill="url(#sea)"/>' + cs + cl + arcs + '<g transform="translate(%.0f %.0f)"><use href="#pet" class="pet"/><rect x="-44" y="-52" width="88" height="24" rx="12" fill="#fff" stroke="#2B2B3A" stroke-width="2"/><text y="-36" style="font:800 12px Baloo 2;text-anchor:middle;fill:#2B2B3A">Bạn ở đây</text></g>' % (vnx - 4, vny - 6) + pins + planes +
    '<g class="cl" style="--s:90s;--d:-10s"><use href="#cloud" transform="translate(0 90)"/></g><g class="cl" style="--s:120s;--d:-70s"><use href="#cloud" transform="translate(0 250) scale(1.3)"/></g><g class="cl" style="--s:100s;--d:-40s"><use href="#cloud" transform="translate(0 690) scale(.9)"/></g>'
    '<g transform="translate(24 24)"><rect width="206" height="48" rx="16" fill="#fff" stroke="#2B2B3A" stroke-width="3"/><circle cx="26" cy="24" r="12" fill="#FFD66B"/><text x="48" y="21" style="font:800 15px Baloo 2;fill:#2B2B3A">15:20 · Nắng đẹp</text><text x="48" y="38" style="font:500 11px Be Vietnam Pro;fill:#5E5E73">giờ và thời tiết thật nơi bé tới</text></g>'
    '</svg></div>'
    '<div style="display:flex;gap:14px"><div class="card" style="flex:1;font-size:13px;line-height:1.55"><b>12 địa danh châu Á:</b> ' + ' · '.join('%d %s' % (i + 1, n) for i, n in enumerate(lmk)) + '. <b>Ổ khoá</b> = chưa mở. <b>Vòng vàng</b> = gợi ý hôm nay. Chạm một nơi → máy bay cất cánh từ Việt Nam, bay theo đường cong (nghiêng cánh, vệt mây), hạ cánh rồi zoom vào địa danh.</div></div>'
    '</div>' + tail(1320, 1010))
open(OUT + '/KidsAsia.dc.html', 'w', encoding='utf-8').write(asia_html)

# ---------------- EARTH ----------------
R = earth['R']
LON_C, LAT_C = 45.0, 18.0
cl_ = math.radians(LAT_C); sl = math.sin(cl_); cc = math.cos(cl_)
def orth(lo, la):
    lam = math.radians(lo - LON_C); ph = math.radians(la)
    cosc = sl * math.sin(ph) + cc * math.cos(ph) * math.cos(lam)
    x = math.cos(ph) * math.sin(lam); y = cc * math.sin(ph) - sl * math.cos(ph) * math.cos(lam)
    return R + x * R, R - y * R, cosc
grat = ''
for lo in range(-180, 180, 30):
    seg = []
    for la in range(-90, 91, 4):
        x, y, c = orth(lo, la)
        if c > 0: seg.append((x, y))
        else:
            if len(seg) > 1: grat += 'M' + 'L'.join('%.1f %.1f' % p for p in seg)
            seg = []
    if len(seg) > 1: grat += 'M' + 'L'.join('%.1f %.1f' % p for p in seg)
for la in range(-60, 90, 30):
    seg = []
    for lo in range(-180, 181, 4):
        x, y, c = orth(lo, la)
        if c > 0: seg.append((x, y))
        else:
            if len(seg) > 1: grat += 'M' + 'L'.join('%.1f %.1f' % p for p in seg)
            seg = []
    if len(seg) > 1: grat += 'M' + 'L'.join('%.1f %.1f' % p for p in seg)
colors = {'asia': '#F5DC9C', 'eu': '#BFE3A0', 'af': '#F6C9B5', 'na': '#A9DEC4', 'sa': '#CFC3F0', 'oc': '#F9E6B2', 'an': '#F4F8FB'}
land = ''.join('<path d="%s" fill="%s" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>' % (d, colors[k]) for k, d in earth['cont'].items())
names = ['Tháp Eiffel', 'Đấu trường La Mã', 'Kim tự tháp Giza', 'Núi Kilimanjaro', 'Vạn Lý Trường Thành', 'Nhà hát Opera Sydney', 'Uluru', 'Tượng Nữ thần Tự do', 'Grand Canyon', 'Tượng Chúa Cứu Thế', 'Machu Picchu', 'Chim cánh cụt']
gpins = ''; fpins = ''
for i, n in enumerate(names):
    v = earth['lm'][n]; x, y = v['xy']; fx, fy = v['flat']
    if v['vis']:
        gpins += '<g transform="translate(%.0f %.0f)"><circle r="14" fill="#3F6FE0" stroke="#fff" stroke-width="3.5"/><text y="5" class="pnum">%d</text></g>' % (x, y, i + 1)
    fpins += '<g transform="translate(%.0f %.0f)"><circle r="9" fill="%s" stroke="#fff" stroke-width="2"/><text y="3.5" style="font:800 9px Baloo 2;fill:#fff;text-anchor:middle">%d</text></g>' % (fx, fy, '#3F6FE0' if v['vis'] else '#E8604C', i + 1)
flat = ''.join('<path d="%s" fill="%s" stroke="#fff" stroke-width="1"/>' % (d, colors[k]) for k, d in earth['flat'].items())
import random
random.seed(5)
stars = ''.join('<circle class="star" style="--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="#fff"/>' % (random.uniform(0, 3), random.randint(0, 1320), random.randint(0, 980), random.uniform(.8, 2.2)) for _ in range(90))
lst = ''.join('<div style="display:flex;gap:8px;align-items:center;padding:5px 8px;border-radius:10px;background:#fff;border:1px solid #E6DCC3"><span style="width:22px;height:22px;border-radius:50%%;background:%s;color:#fff;font:800 12px Baloo 2,sans-serif;display:flex;align-items:center;justify-content:center;flex:none">%d</span><span style="font-size:13px"><b>%s</b> <span style="color:#5E5E73">· %s · %s</span></span></div>' % ('#3F6FE0' if earth['lm'][n]['vis'] else '#E8604C', i + 1, n, earth['lm'][n]['country'], earth['lm'][n]['cont']) for i, n in enumerate(names))
earth_html = (HEAD % ('Kids Earth tier 3', CSS) + DEFS +
    '<div class="t" style="width:1320px;height:980px;background:#0E1230;padding:24px 40px;box-sizing:border-box;display:flex;gap:28px;position:relative;overflow:hidden">'
    '<svg width="1320" height="980" style="position:absolute;left:0;top:0" aria-hidden="true">' + stars + '</svg>'
    '<div style="position:relative;width:640px;flex:none"><svg width="640" height="640" viewBox="-20 -20 640 640" role="img" aria-label="Trái Đất">'
    '<circle cx="300" cy="300" r="318" fill="url(#atmo)"/><circle cx="300" cy="300" r="300" fill="url(#ocean)"/>'
    '<path d="' + grat + '" fill="none" stroke="#fff" stroke-width="1" opacity=".28"/>' + land +
    '<g class="cl" style="--s:80s;--d:-20s;opacity:.8"><use href="#cloud" transform="translate(0 140) scale(1.4)"/></g><g class="cl" style="--s:110s;--d:-60s;opacity:.8"><use href="#cloud" transform="translate(0 400) scale(1.8)"/></g>'
    '<clipPath id="gc"><circle cx="300" cy="300" r="300"/></clipPath><rect x="0" y="0" width="600" height="600" fill="url(#night)" clip-path="url(#gc)"/>'
    + gpins + '</svg>'
    '<div style="position:absolute;left:10px;bottom:-8px;display:flex;gap:8px"><span class="chip" style="background:#fff;color:#2B2B3A">Kéo để xoay · lăn để zoom</span><span class="chip" style="background:#FFF0CC;color:#7A4A06">Đêm/ngày theo giờ thật</span></div></div>'
    '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;color:#F3EFE4">'
    '<div><h1 class="h" style="font-size:40px;line-height:1;color:#fff">Tầng 3 · Trái Đất</h1><div style="font-size:14px;color:#B3B1C6;margin-top:6px;line-height:1.5">Quả cầu có các châu lục (Natural Earth, phạm vi công cộng), mây trôi, phần ban đêm tối dần theo giờ thật. 12 địa danh nổi tiếng thế giới — chạm một nơi để quả cầu xoay và máy bay đưa bé tới. Bản thiết kế, chưa áp dụng.</div></div>'
    '<div style="background:#1B1F45;border:1px solid #3A3A55;border-radius:16px;padding:12px"><div style="font:700 12px Be Vietnam Pro;letter-spacing:.08em;color:#B3B1C6;margin-bottom:8px">BẢN ĐỒ PHẲNG · ĐỎ = Ở MẶT SAU QUẢ CẦU</div><svg width="100%" viewBox="0 0 504 252" role="img" aria-label="Bản đồ thế giới phẳng"><rect width="504" height="252" rx="12" fill="#2F6FB5"/>' + flat + fpins + '</svg></div>'
    '<div style="display:flex;flex-direction:column;gap:5px;color:#2B2B3A">' + lst + '</div></div>'
    '</div>' + tail(1320, 980))
open(OUT + '/KidsEarth.dc.html', 'w', encoding='utf-8').write(earth_html)
print('ok')
