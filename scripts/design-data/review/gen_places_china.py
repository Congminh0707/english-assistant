# Cảnh địa điểm tầng 2: Trung Quốc (PChina), chuẩn R5Arrive/PHanoi (docs/22 §12): Vạn Lý Trường Thành trên núi, đình bên hồ, rừng tre, thú rừng.
#   BOARD_OUT=<project> PYTHONIOENCODING=utf-8 python gen_places_china.py   (hoặc python gen_places_china.py <project> <vn_merged.json>)
# 5 biển chạm theo bước bài: Gấu trúc, Hổ, Nai, Gấu, Núi (cáo là thú cưng, sói nhỏ trên sườn núi không có biển).
import math, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__))
proj = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('BOARD_OUT') or '.'
vnjson = sys.argv[2] if len(sys.argv) > 2 else 'C:/Users/01217/AppData/Local/Temp/vn/vn_merged.json'
sys.argv = ['x', proj, vnjson]
sys.path.insert(0, HERE)
import gen_review2 as G
V = G.V
R = random.Random(52)
INK = '#2A1810'
RED = '#D7261E'

CSS = """<style>
@keyframes cmist{0%,100%{transform:translateX(-30px)}50%{transform:translateX(30px)}}
@keyframes cpetal{0%{transform:translate(0,0) rotate(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translate(-120px,420px) rotate(540deg);opacity:0}}
@keyframes cchew{0%,100%{transform:translateY(0)}50%{transform:translateY(2.5px)}}
@keyframes cflag{0%,100%{transform:skewY(-6deg)}50%{transform:skewY(7deg)}}
@keyframes csteam{0%{transform:translate(0,0) scale(.5);opacity:0}30%{opacity:.55}100%{transform:translate(10px,-40px) scale(1.5);opacity:0}}
@keyframes ctail{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(6deg)}}
.cmist{animation:cmist var(--t,30s) ease-in-out infinite;animation-delay:var(--d,0s)}
.cpetal{animation:cpetal var(--t,13s) linear infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
.cchew{animation:cchew .9s ease-in-out infinite}
.cflag{animation:cflag 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:left center}
.csteam{animation:csteam 4s ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
.ctail{animation:ctail 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:left center}
@media (prefers-reduced-motion:reduce){.cmist,.cchew,.cflag,.csteam,.ctail{animation:none}.cpetal{animation:none;opacity:0}}
</style>"""
HG = '<radialGradient id="hg"><stop offset="0" stop-color="#FFD27A" stop-opacity=".85"/><stop offset=".5" stop-color="#FFAE4A" stop-opacity=".3"/><stop offset="1" stop-color="#FFAE4A" stop-opacity="0"/></radialGradient>'

def lin(id_, stops, x2=0, y2=1):
    return '<linearGradient id="%s" x1="0" y1="0" x2="%s" y2="%s">' % (id_, x2, y2) + ''.join('<stop offset="%s" stop-color="%s"/>' % s for s in stops) + '</linearGradient>'

def page(name, title, aria, defs, o, place, css=''):
    hud = '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về bản đồ</span><span class="pill">%s</span></div>' % place
    V.write(name, title, 1280, 720, CSS + css + '<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="%s"><defs>' % aria + V.DEFS + HG + defs + '</defs>' + o + '<rect width="1280" height="720" filter="url(#grain)" opacity=".25"/></svg>' + hud + '</div>')

def cloud(x, y, w, c1, c2, op=.92, t=260):
    o = '<g class="drift" style="--t:%ds;--d:-%ds" opacity="%.2f">' % (t, x % 37, op)
    n = 7
    for k in range(n):
        u = k / (n - 1); h = math.sin(u * math.pi); r = (.12 + .13 * h) * w
        o += '<circle cx="%.0f" cy="%.0f" r="%.0f" fill="%s"/>' % (x + (u - .5) * w, y - h * w * .1, r, c2)
    for k in range(n):
        u = k / (n - 1); h = math.sin(u * math.pi); r = (.1 + .11 * h) * w
        o += '<circle cx="%.0f" cy="%.0f" r="%.0f" fill="%s"/>' % (x + (u - .5) * w * .92 - w * .02, y - h * w * .14 - w * .03, r, c1)
    return o + '<ellipse cx="%.0f" cy="%.0f" rx="%.0f" ry="%.0f" fill="%s"/></g>' % (x, y + w * .1, w * .62, w * .07, c2)

def smooth(pts, close=''):
    d = 'M%.0f %.0f' % pts[0]
    for i in range(1, len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        d += 'Q%.0f %.0f %.0f %.0f' % (a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    return d + 'L%.0f %.0f' % pts[-1] + close

def ridge(y0, amp, col, seed, peaks=(), base=470, step=40):
    """Dãy núi xa kiểu tranh thuỷ mặc: đỉnh nhọn, phối màu nhạt dần."""
    r = random.Random(seed)
    pts = [(-30, base)]
    for i in range(int(1340 / step)):
        x = -20 + i * step
        h = y0 + math.sin(i * 1.1 + seed) * amp * .5 + r.uniform(-amp * .4, amp * .4)
        for px, ph, pw in peaks: h -= ph * math.exp(-((x - px) / pw) ** 2)
        pts.append((x, h))
    pts.append((1320, base))
    return '<path d="%s" fill="%s"/>' % (smooth(pts, 'Z'), col)

def mist(y, h, op=.55, t=30, d=0, col='#F6EEE4'):
    return '<g class="cmist" style="--t:%ds;--d:-%ds"><ellipse cx="640" cy="%d" rx="760" ry="%d" fill="%s" opacity="%.2f"/><ellipse cx="260" cy="%d" rx="320" ry="%d" fill="%s" opacity="%.2f"/></g>' % (t, d, y, h, col, op, y - h * .4, h * .7, col, op * .8)

# ---------- cây, đá ----------
def pine(x, y, s=1, lean=0):
    """Thông Hoàng Sơn: thân cong vặn, tán dẹt từng tầng."""
    o = '<ellipse cx="%d" cy="%d" rx="%.0f" ry="%.0f" fill="#0A3A22" opacity=".28"/>' % (x, y, 36 * s, 6 * s)
    o += '<path d="M%d %dQ%.0f %.0f %.0f %.0fQ%.0f %.0f %.0f %.0f" stroke="#4A2E1C" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (x, y, x + 12 * s * (1 + lean), y - 60 * s, x - 6 * s, y - 120 * s, x - 14 * s, y - 150 * s, x + 6 * s + lean * 20 * s, y - 190 * s, 11 * s)
    o += '<path d="M%d %dQ%.0f %.0f %.0f %.0f" stroke="#7A5232" stroke-width="%.1f" fill="none" stroke-linecap="round" opacity=".7"/>' % (x - 2 * s, y - 4, x + 10 * s, y - 60 * s, x - 8 * s, y - 118 * s, 3 * s)
    pads = ((x + 4 * s, y - 70 * s, 58, -1), (x - 24 * s, y - 128 * s, 66, 1), (x + 26 * s, y - 160 * s, 52, 1), (x + 4 * s + lean * 20 * s, y - 196 * s, 46, -1))
    cr = ''
    br = ''
    for cx, cy, w, sg in pads:
        w *= s
        br += '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0f" stroke="#4A2E1C" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (x - 6 * s + lean * 10 * s, cy + 14 * s, (x + cx) / 2, cy + 10 * s, cx - sg * w * .25, cy, 4 * s)
        for k in range(9):
            u = k / 8 - .5
            ex, ey = cx + u * w * 1.5, cy - (1 - (2 * u) ** 2) * w * .1 + R.uniform(-2, 2)
            cr += '<ellipse cx="%.0f" cy="%.0f" rx="%.1f" ry="%.1f" fill="%s"/>' % (ex, ey + 4, w * .26, w * .12, '#1C5A34')
        for k in range(10):
            u = k / 9 - .5
            ex, ey = cx + u * w * 1.4, cy - (1 - (2 * u) ** 2) * w * .13 - 3
            cr += '<ellipse cx="%.0f" cy="%.0f" rx="%.1f" ry="%.1f" fill="%s"/>' % (ex, ey, w * .22, w * .1, R.choice(['#2C7A46', '#3A9457', '#4AA862']))
        for k in range(18):
            ex = cx + R.uniform(-w * .7, w * .7); ey = cy + R.uniform(-w * .08, w * .1)
            cr += '<path d="M%.0f %.0fl%.1f %.1f" stroke="#18482C" stroke-width="1.1" opacity=".7"/>' % (ex, ey, R.uniform(-3, 3), R.uniform(4, 8))
    return o + br + V.sway(cr, x, y - 60 * s, 5.4 + (x % 5) * .3, (x % 7) * .4)

def pinetuft(x, y, s=1):
    """Cụm thông nhỏ trên sườn núi."""
    o = '<path d="M%d %dv%d" stroke="#4A2E1C" stroke-width="%.1f"/>' % (x, y, 7 * s, 1.8 * s)
    for k, (dx, dy, rx) in enumerate(((0, 0, 8), (-5, -3, 6), (5, -4, 6), (0, -6, 5))):
        o += '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s"/>' % (x + dx * s, y + dy * s, rx * s, 3.6 * s, ['#245E3A', '#2F7A48', '#3A9457', '#2A6C42'][k])
    return o

def rock(x, y, w, h, c='#9A9AA2', hi='#C8C8CE', dk='#5E5E6A'):
    pts = [(x - w / 2, y), (x - w * .46, y - h * .5), (x - w * .22, y - h * .9), (x + w * .12, y - h), (x + w * .42, y - h * .64), (x + w / 2, y)]
    d = smooth(pts, 'Z')
    o = '<path d="%s" fill="%s" stroke="%s" stroke-width="1.6" stroke-linejoin="round"/>' % (d, c, INK)
    o += '<path d="M%.0f %.0fL%.0f %.0fL%.0f %.0fL%.0f %.0fZ" fill="%s" opacity=".55"/>' % (x - w * .46, y - h * .5, x - w * .22, y - h * .9, x + w * .12, y - h, x - w * .05, y - h * .45, hi)
    o += '<path d="M%.0f %.0fL%.0f %.0fL%.0f %.0fL%.0f %.0fZ" fill="%s" opacity=".5"/>' % (x + w * .12, y - h, x + w * .42, y - h * .64, x + w / 2, y, x + w * .1, y - h * .3, dk)
    o += '<path d="M%.0f %.0fl%d %d" stroke="%s" stroke-width="1" fill="none" opacity=".6"/>' % (x - w * .1, y - h * .2, 8, -h * .3, dk)
    return o

def grass(n, x0, x1, y0, y1, cols=('#3F9A4E', '#5BB45A', '#2F8040', '#7AC862')):
    o = ''
    for _ in range(n):
        x = R.uniform(x0, x1); y = R.uniform(y0, y1); h = R.uniform(6, 15) * (.6 + (y - y0) / max(1, y1 - y0) * .7)
        o += '<path d="M%.0f %.0fq%.1f %.1f %.1f %.1f" stroke="%s" stroke-width="1.6" fill="none" stroke-linecap="round"/>' % (x, y, R.uniform(-2, 2), -h * .6, R.uniform(-4, 4), -h, R.choice(cols))
    return o

def flowers(n, x0, x1, y0, y1, cols=('#FFFFFF', '#FFD84A', '#F26B9C', '#FF9A4A')):
    o = ''
    for _ in range(n):
        x = R.uniform(x0, x1); y = R.uniform(y0, y1)
        o += '<circle cx="%.0f" cy="%.0f" r="%.1f" fill="%s"/><circle cx="%.0f" cy="%.0f" r="1" fill="#E9A400"/>' % (x, y, R.uniform(1.8, 3.2), R.choice(cols), x, y)
    return o

# ---------- Vạn Lý Trường Thành ----------
CREST = [(540, 392), (590, 360), (640, 338), (690, 330), (738, 300), (786, 276), (830, 244), (872, 222), (918, 204), (964, 222), (1010, 208), (1062, 190), (1112, 208), (1160, 240), (1204, 262), (1252, 292), (1310, 312)]
TOWERS = {3: 'plain', 6: 'plain', 9: 'hut', 12: 'plain', 14: 'plain'}

def wall_seg(p, q):
    L = math.hypot(q[0] - p[0], q[1] - p[1]); a = math.degrees(math.atan2(q[1] - p[1], q[0] - p[0]))
    o = '<g transform="translate(%.1f %.1f) rotate(%.1f)">' % (p[0], p[1], a)
    o += '<rect y="-15" width="%.1f" height="15" fill="#C9B898" stroke="%s" stroke-width="1.2"/>' % (L + 1, INK)
    o += '<rect y="-5" width="%.1f" height="5" fill="#8E7C62" opacity=".75"/><rect y="-15" width="%.1f" height="3" fill="#E6D8B8"/>' % (L + 1, L + 1)
    for k in range(int(L / 10) + 1): o += '<path d="M%d -12v8" stroke="#7A6A52" stroke-width=".8" opacity=".7"/>' % (k * 10 + (3 if k % 2 else 0))
    for k in range(int(L / 9)):
        o += '<rect x="%d" y="-20" width="5.4" height="5.4" fill="#D6C6A4" stroke="%s" stroke-width=".9"/>' % (k * 9 + 1, INK)
    return o + '</g>'

def tower(p, kind, flag=False):
    x, y = p
    o = '<g transform="translate(%.1f %.1f)">' % (x, y)
    o += '<rect x="-17" y="-44" width="34" height="46" fill="#CDBB98" stroke="%s" stroke-width="1.4"/>' % INK
    o += '<rect x="-17" y="-44" width="9" height="46" fill="#E8DAB8" opacity=".7"/><rect x="9" y="-44" width="8" height="46" fill="#7E6C52" opacity=".5"/><rect x="-17" y="-8" width="34" height="10" fill="#8E7C62" opacity=".6"/>'
    for k in range(5): o += '<rect x="%d" y="-50" width="5" height="6" fill="#D9C9A6" stroke="%s" stroke-width=".9"/>' % (-17 + k * 7.2, INK)
    for wx in (-9, 3): o += '<path d="M%d -22V-32Q%d -37 %d -32V-22Z" fill="#2A1A12" stroke="%s" stroke-width=".8"/>' % (wx, wx + 3, wx + 6, INK)
    o += '<path d="M-5 2V-12Q0 -17 5 -12V2Z" fill="#3A2216"/>'
    if kind == 'hut':
        o += '<rect x="-11" y="-62" width="22" height="13" fill="#B9421C" stroke="%s" stroke-width="1.2"/><path d="M-19 -60Q-12 -64 0 -76Q12 -64 19 -60Q8 -62 0 -62Q-8 -62 -19 -60Z" fill="#4E5A66" stroke="%s" stroke-width="1.3"/><path d="M-19 -60q-3 -2 -5 -6M19 -60q3 -2 5 -6" stroke="%s" stroke-width="1.6" fill="none" stroke-linecap="round"/>' % (INK, INK, INK)
    if flag:
        o += '<path d="M0 -50V-84" stroke="#5A3A22" stroke-width="2"/><path class="cflag" d="M1 -84H22L16 -77L22 -70H1Z" fill="%s" stroke="#7A1410" stroke-width=".9"/>' % RED
    return o + '</g>'

def great_wall():
    o = ''
    for i in range(len(CREST) - 1): o += wall_seg(CREST[i], CREST[i + 1])
    for i, k in TOWERS.items(): o += tower(CREST[i], k, flag=(i == 9))
    return o

def wallmountain():
    top = CREST
    pts = [(480, 560), (500, 440)] + top + [(1310, 560)]
    d = smooth(pts, 'Z')
    o = '<clipPath id="wmc"><path d="%s"/></clipPath><path d="%s" fill="url(#wmg)" stroke="#3A4A38" stroke-width="2"/><g clip-path="url(#wmc)">' % (d, d)
    # sườn sáng phía mặt trời, bóng bên phải, khe núi
    for k in range(60):
        x = R.uniform(480, 1300); y0 = R.uniform(200, 520)
        o += '<path d="M%.0f %.0fq%.1f %.1f %.1f %.1f" stroke="%s" stroke-width="%.1f" fill="none" opacity="%.2f" stroke-linecap="round"/>' % (x, y0, R.uniform(-8, 8), R.uniform(10, 24), R.uniform(-14, 14), R.uniform(30, 70), R.choice(['#3A4A3A', '#2F3E34', '#5A6A52']), R.uniform(1.4, 3), R.uniform(.25, .55))
    o += '<path d="M700 330Q640 420 600 520L520 560L480 560L500 440Z" fill="#E8D8A8" opacity=".25"/>'
    for sx, sy in ((830, 244), (1062, 190)): o += '<path d="M%d %dQ%d %d %d 520L%d 520Q%d %d %d %dZ" fill="#2E3E34" opacity=".18"/>' % (sx, sy, sx + 30, sy + 140, sx + 50, sx - 40, sx - 10, sy + 150, sx, sy)
    for _ in range(46):
        x = R.uniform(500, 1290); yy = R.uniform(300, 500)
        # chỉ vẽ cây ở dưới đường sống núi
        ci = min(range(len(CREST)), key=lambda i: abs(CREST[i][0] - x))
        if yy > CREST[ci][1] + 40: o += pinetuft(int(x), int(yy), R.uniform(.8, 1.3))
    return o + '</g>'

# ---------- đình, tháp ----------
def pavilion(x, y, s=1):
    """Đình lục giác hai tầng mái cong, cột đỏ, lan can, đèn lồng; (x,y) là mặt đất giữa nền đá."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    # nền đá ba bậc
    for k, (w, h, c) in enumerate(((156, 12, '#B8B0A0'), (132, 12, '#CFC7B6'), (112, 10, '#DDD5C4'))):
        yy = -sum(((12, 12, 10)[j] for j in range(k)))
        o += '<rect x="%d" y="%d" width="%d" height="%d" fill="%s" stroke="%s" stroke-width="1.4"/>' % (-w / 2, yy - h, w, h, c, INK)
    base = -34
    # sàn tối, cột đỏ
    o += '<rect x="-52" y="%d" width="104" height="6" fill="#6A3A22" stroke="%s" stroke-width="1"/>' % (base - 6, INK)
    o += '<rect x="-48" y="%d" width="96" height="62" fill="#2A140E"/>' % (base - 68)
    # lan can (hàng song) giữa hai cột
    for k in range(17): o += '<rect x="%d" y="%d" width="2" height="16" fill="#E8B84A"/>' % (-46 + k * 5.7, base - 24)
    o += '<rect x="-50" y="%d" width="100" height="4" fill="%s" stroke="%s" stroke-width=".9"/><rect x="-50" y="%d" width="100" height="4" fill="%s" stroke="%s" stroke-width=".9"/>' % (base - 26, RED, INK, base - 10, RED, INK)
    for px in (-48, -16, 16, 48):
        o += '<rect x="%d" y="%d" width="9" height="66" fill="%s" stroke="%s" stroke-width="1.2"/><rect x="%d" y="%d" width="3" height="66" fill="#F2584A" opacity=".7"/><rect x="%d" y="%d" width="15" height="6" fill="#E8B84A" stroke="%s" stroke-width=".9"/><rect x="%d" y="%d" width="13" height="5" fill="#8A7A6A" stroke="%s" stroke-width=".8"/>' % (px - 4.5, base - 70, RED, INK, px - 4, base - 70, px - 7.5, base - 74, INK, px - 6.5, base - 4, INK)
    # hoa văn lưới dưới mái
    o += '<rect x="-50" y="%d" width="100" height="8" fill="#1F6E5A" stroke="%s" stroke-width="1"/>' % (base - 78, INK)
    for k in range(13): o += '<circle cx="%d" cy="%d" r="2.2" fill="#F7C84A"/>' % (-45 + k * 7.5, base - 74)
    # mái tầng một
    def roof(cy, w, h, c1='#4F6E68', c2='#35524D'):
        r = ''
        r += '<path d="M%d %dQ%d %d %d %dL%d %dQ%d %d %d %dQ%d %d %d %dQ%d %d %d %dZ" fill="%s" stroke="%s" stroke-width="1.8" stroke-linejoin="round"/>' % (-w, cy, -w * .62, cy - 6, -w * .26, cy - h, w * .26, cy - h, w * .62, cy - 6, w, cy, w - 6, cy - 6, w * .9, cy - 14, w * .5, cy + 4, c1, INK)
        return r
    def eave(cy, w, h, c1='#4F6E68', c2='#2E4A46'):
        d = 'M%.0f %.0fQ%.0f %.0f %.0f %.0fL%.0f %.0fQ%.0f %.0f %.0f %.0fQ%.0f %.0f %.0f %.0fL%.0f %.0fQ%.0f %.0f %.0f %.0fZ' % (-w - 8, cy - 14, -w * .8, cy + 2, -w * .55, cy, w * .55, cy, w * .8, cy + 2, w + 8, cy - 14, w * .6, cy - h * .5, w * .22, cy - h, -w * .22, cy - h, -w * .6, cy - h * .5, -w - 8, cy - 14)
        return d
    for cy, w, h in ((base - 78, 74, 40), (base - 122, 52, 34)):
        d = eave(cy, w, h)
        cid = V.uid()
        o += '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="#4F6E68" stroke="%s" stroke-width="1.8" stroke-linejoin="round"/><g clip-path="url(#%s)">' % (cid, d, d, INK, cid)
        n = int(w / 5)
        for k in range(n + 1):
            xb = -w - 8 + (2 * w + 16) * k / n; xt = -w * .22 + w * .44 * k / n
            o += '<path d="M%.1f %.1fL%.1f %.1f" stroke="#2E4A46" stroke-width="2.4"/><path d="M%.1f %.1fL%.1f %.1f" stroke="#8FB0A6" stroke-width=".9" opacity=".7"/>' % (xb, cy, xt, cy - h, xb + 2, cy, xt + 1, cy - h)
        o += '<rect x="%d" y="%d" width="%d" height="10" fill="#1A3A36" opacity=".45"/>' % (-w - 10, cy - 8, 2 * w + 20) + '</g>'
        # gờ vàng + đầu đao nhọn
        o += '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0f" stroke="#E8B84A" stroke-width="3" fill="none" stroke-linecap="round"/>' % (-w * .55, cy, 0, cy + 5, w * .55, cy)
        for sg in (-1, 1): o += '<path d="M%.0f %.0fq%d -4 %d -14" stroke="%s" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="%.0f" cy="%.0f" r="2.6" fill="#E8B84A" stroke="%s" stroke-width=".8"/>' % (sg * (w + 8), cy - 14, sg * 6, sg * 9, INK, sg * (w + 17), cy - 28, INK)
    # tầng hai: cột ngắn lộ dưới mái trên
    o += '<rect x="-30" y="%d" width="60" height="12" fill="#2A140E"/>' % (base - 118)
    for px in (-26, 0, 26): o += '<rect x="%d" y="%d" width="6" height="12" fill="%s" stroke="%s" stroke-width=".8"/>' % (px - 3, base - 118, RED, INK)
    # chóp
    o += '<path d="M0 %d V%d" stroke="%s" stroke-width="3"/><circle cy="%d" r="6" fill="#E8B84A" stroke="%s" stroke-width="1.2"/><path d="M0 %d l-3 -8 l3 -4 l3 4Z" fill="#E8B84A"/>' % (base - 156, base - 172, INK, base - 176, INK, base - 180)
    # đèn lồng treo mép mái
    for sg in (-1, 1):
        for lx, ly, ls in ((sg * 78, base - 90, 1.0), (sg * 58, base - 52, .82)):
            o += G.den(lx, ly, ls * .9, RED, 10)
    return o + '</g>'

def pagoda(x, y, s=1, col='#7A8AA8'):
    """Tháp xa nhiều tầng, chìm trong sương."""
    o = '<g transform="translate(%d %d) scale(%.2f)" opacity=".85">' % (x, y, s)
    o += '<rect x="-14" y="-12" width="28" height="12" fill="%s"/>' % col
    for k in range(6):
        w = 34 - k * 4; yy = -12 - k * 16
        o += '<rect x="%.0f" y="%d" width="%.0f" height="12" fill="%s"/><path d="M%.0f %dQ%.0f %d %.0f %dL%.0f %dQ%.0f %d %.0f %dZ" fill="#5A6A88"/>' % (-w * .5 + 3, yy - 12, w - 6, col, -w - 4, yy - 12, -w * .5, yy - 12, -w * .3, yy - 20, w * .3, yy - 20, w * .5, yy - 12, w + 4, yy - 12)
    return o + '<path d="M0 -112V-134" stroke="#5A6A88" stroke-width="2"/></g>'

def lantern_post(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="1" rx="12" ry="3.4" fill="#0A3A22" opacity=".35"/>' % (x, y, s)
    o += '<rect x="-7" y="-14" width="14" height="14" fill="#B8B0A0" stroke="%s" stroke-width="1.2"/><rect x="-4.5" y="-70" width="9" height="58" fill="#C9C1B0" stroke="%s" stroke-width="1.2"/>' % (INK, INK)
    o += '<path d="M-20 -70Q0 -78 20 -70" stroke="#5A3A22" stroke-width="3" fill="none"/>' + G.halo(0, -52, 40, .8)
    o += '<g class="sway" style="--t:3.4s;transform-origin:0px -70px"><path d="M0 -70v8" stroke="%s"/><ellipse cy="-48" rx="15" ry="18" fill="%s" stroke="#5A1410" stroke-width="1.3"/><ellipse cy="-48" rx="7" ry="14" fill="#FF8A5A" opacity=".5"/><rect x="-7" y="-66" width="14" height="4" fill="#E8B84A"/><rect x="-7" y="-33" width="14" height="4" fill="#E8B84A"/><path d="M0 -29v12" stroke="%s" stroke-width="2.2"/><path d="M-3 -17h6" stroke="#E8B84A" stroke-width="2"/></g>' % (INK, RED, RED)
    return o + '</g>'

# ---------- thú ----------
def shadow(rx):
    return '<ellipse cy="1" rx="%d" ry="%d" fill="#0A3A22" opacity=".32"/>' % (rx, rx * .16)

def panda(x, y, s=1):
    BK = '#2A262E'
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s) + shadow(54)
    o += '<ellipse cx="-30" cy="-12" rx="22" ry="14" fill="%s" stroke="%s" stroke-width="1.4"/><ellipse cx="30" cy="-12" rx="22" ry="14" fill="%s" stroke="%s" stroke-width="1.4"/>' % (BK, INK, BK, INK)
    o += '<ellipse cy="-44" rx="45" ry="42" fill="#FBF8F0" stroke="%s" stroke-width="1.6"/><path d="M-40 -64Q0 -88 40 -64Q42 -52 36 -48Q0 -66 -36 -48Q-42 -52 -40 -64Z" fill="%s"/>' % (INK, BK)
    # tre ăn dở
    o += '<path d="M-24 -30L16 -88" stroke="#5E9A38" stroke-width="8" stroke-linecap="round"/><path d="M-24 -30L16 -88" stroke="#9CC84A" stroke-width="3" stroke-linecap="round"/>'
    for t in (.3, .6): o += '<path d="M%.0f %.0fl7 -3" stroke="#3A6A24" stroke-width="2.4"/>' % (-24 + 40 * t - 4, -30 - 58 * t)
    o += '<path d="M16 -88q10 -4 16 -16M14 -84q12 2 20 -6" stroke="#3FA050" stroke-width="3.2" fill="none" stroke-linecap="round"/><ellipse cx="30" cy="-104" rx="9" ry="3.6" fill="#5FBE5A" transform="rotate(-50 30 -104)"/><ellipse cx="34" cy="-92" rx="9" ry="3.4" fill="#4AAE50" transform="rotate(-20 34 -92)"/>'
    # tay đen ôm tre
    o += '<ellipse cx="-24" cy="-48" rx="12" ry="26" fill="%s" stroke="%s" stroke-width="1.2" transform="rotate(-32 -24 -48)"/><ellipse cx="14" cy="-50" rx="12" ry="24" fill="%s" stroke="%s" stroke-width="1.2" transform="rotate(30 14 -50)"/>' % (BK, INK, BK, INK)
    o += '<g class="cchew"><circle cy="-102" r="33" fill="#FBF8F0" stroke="%s" stroke-width="1.6"/><circle cx="-26" cy="-128" r="11" fill="%s" stroke="%s" stroke-width="1.2"/><circle cx="26" cy="-128" r="11" fill="%s" stroke="%s" stroke-width="1.2"/>' % (INK, BK, INK, BK, INK)
    o += '<ellipse cx="-14" cy="-102" rx="9" ry="12" fill="%s" transform="rotate(24 -14 -102)"/><ellipse cx="14" cy="-102" rx="9" ry="12" fill="%s" transform="rotate(-24 14 -102)"/>' % (BK, BK)
    o += '<circle cx="-14" cy="-103" r="3.4" fill="#fff"/><circle cx="14" cy="-103" r="3.4" fill="#fff"/><circle cx="-13" cy="-102.5" r="1.9" fill="#111"/><circle cx="15" cy="-102.5" r="1.9" fill="#111"/>'
    o += '<ellipse cy="-90" rx="6" ry="4" fill="#1A1620"/><path d="M0 -86q-5 7 -11 3M0 -86q5 7 11 3" stroke="%s" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="-24" cy="-88" rx="5" ry="3" fill="#F2A0A0" opacity=".5"/><ellipse cx="24" cy="-88" rx="5" ry="3" fill="#F2A0A0" opacity=".5"/></g>' % INK
    return o + '</g>'

def tiger(x, y, s=1, flip=False):
    OR, DK = '#EE9A3A', '#2A1A12'
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s) + shadow(70)
    o += '<g class="ctail"><path d="M58 -46Q104 -44 98 -86" stroke="%s" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M98 -70Q100 -80 98 -88" stroke="%s" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M70 -45l1 -12M82 -46l2 -12M93 -50l4 -10" stroke="%s" stroke-width="3.6" stroke-linecap="round"/></g>' % (OR, DK, DK)
    # chân sau/trước
    o += '<path d="M24 -40Q26 -18 22 0H46Q44 -20 52 -44Z" fill="#E58A30" stroke="%s" stroke-width="1.5" stroke-linejoin="round"/><rect x="20" y="-4" width="28" height="6" rx="3" fill="#FFF0D2" stroke="%s" stroke-width="1"/>' % (INK, INK)
    o += '<path d="M-46 -40L-50 0H-26L-24 -40Z" fill="#E58A30" stroke="%s" stroke-width="1.5" stroke-linejoin="round"/><rect x="-54" y="-4" width="30" height="6" rx="3" fill="#FFF0D2" stroke="%s" stroke-width="1"/>' % (INK, INK)
    o += '<ellipse cx="4" cy="-52" rx="64" ry="32" fill="%s" stroke="%s" stroke-width="1.7"/>' % (OR, INK)
    cid = V.uid()
    o += '<clipPath id="%s"><ellipse cx="4" cy="-52" rx="64" ry="32"/></clipPath><g clip-path="url(#%s)"><ellipse cx="4" cy="-26" rx="56" ry="14" fill="#FFF0D2"/>' % (cid, cid)
    for k in range(9):
        sx = -42 + k * 12
        o += '<path d="M%d -88q%d 14 %d 30q-3 %d %d 12" stroke="%s" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (sx, 4 if k % 2 else -4, (k % 3) - 1, 6, 3, DK, 5 - (k % 2))
    o += '</g>'
    o += '<path d="M-34 -80Q-60 -84 -66 -62L-40 -34Q-30 -50 -34 -80Z" fill="%s" stroke="%s" stroke-width="1.5"/>' % (OR, INK)
    # đầu hướng trái
    o += '<circle cx="-62" cy="-66" r="26" fill="%s" stroke="%s" stroke-width="1.7"/>' % (OR, INK)
    o += '<circle cx="-78" cy="-90" r="9" fill="%s" stroke="%s" stroke-width="1.4"/><circle cx="-47" cy="-92" r="9" fill="%s" stroke="%s" stroke-width="1.4"/><circle cx="-78" cy="-90" r="4.4" fill="#FFF0D2"/><circle cx="-47" cy="-92" r="4.4" fill="#FFF0D2"/>' % (OR, INK, OR, INK)
    o += '<ellipse cx="-60" cy="-52" rx="22" ry="11" fill="#FFF3DC"/><ellipse cx="-72" cy="-56" rx="12" ry="9" fill="#FFF8EA" stroke="%s" stroke-width="1"/>' % INK
    o += '<path d="M-82 -62l5 -2l-1 6Z" fill="#E0607A" stroke="%s" stroke-width=".8"/><path d="M-79 -56q-2 7 -10 5M-78 -56q3 7 9 4" stroke="%s" stroke-width="1.3" fill="none"/>' % (INK, INK)
    o += '<path d="M-70 -92l2 12M-62 -94l0 14M-54 -92l-2 12" stroke="%s" stroke-width="3" stroke-linecap="round"/><path d="M-84 -74l9 4M-84 -66l9 2M-42 -74l-8 5" stroke="%s" stroke-width="2.4" stroke-linecap="round"/>' % (DK, DK)
    o += '<ellipse cx="-68" cy="-72" rx="5" ry="4.4" fill="#F4E04A" stroke="%s" stroke-width="1"/><ellipse cx="-68" cy="-72" rx="1.4" ry="3.6" fill="#111"/><ellipse cx="-50" cy="-72" rx="4.6" ry="4.2" fill="#F4E04A" stroke="%s" stroke-width="1"/><ellipse cx="-50" cy="-72" rx="1.3" ry="3.4" fill="#111"/>' % (INK, INK)
    return o + '</g>'

def deer(x, y, s=1, flip=False):
    BR, LT = '#B7794A', '#E8C9A0'
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s) + shadow(50)
    for lx, ph in ((-30, 0), (-20, 1), (22, 0), (32, 1)):
        o += '<path d="M%d -46L%d -20L%d 0" stroke="%s" stroke-width="5.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M%d -3l-1 4h6l-1 -4Z" fill="#3A2A20"/>' % (lx, lx + (2 if ph else -2), lx + (1 if ph else 0), '#8A5A32' if ph else '#9A6A3E', lx - 2)
    o += '<path d="M-48 -60Q-52 -84 -20 -84Q24 -88 38 -70L44 -54Q20 -36 -16 -38Q-46 -38 -48 -60Z" fill="%s" stroke="%s" stroke-width="1.6"/>' % (BR, INK)
    o += '<path d="M-44 -48Q-10 -34 40 -52L38 -64Q8 -40 -44 -54Z" fill="%s" opacity=".75"/>' % LT
    o += '<ellipse cx="-48" cy="-62" rx="9" ry="14" fill="#FFF3DC" stroke="%s" stroke-width="1.2"/>' % INK
    for dx, dy in ((-26, -76), (-10, -66), (6, -78), (20, -68), (-34, -62), (-2, -56), (-18, -52), (12, -56)): o += '<circle cx="%d" cy="%d" r="2.2" fill="#FFF3DC"/>' % (dx, dy)
    o += '<path d="M34 -72Q52 -92 58 -112L74 -108Q64 -88 46 -62Z" fill="%s" stroke="%s" stroke-width="1.5" stroke-linejoin="round"/>' % (BR, INK)
    # sừng
    o += '<path d="M64 -126Q56 -148 66 -164M62 -140Q50 -150 48 -162M64 -152Q74 -156 80 -168M66 -164Q70 -172 66 -178" stroke="#E8D3A0" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 -126Q56 -148 66 -164" stroke="#8A6A3A" stroke-width=".9" fill="none"/>'
    o += '<ellipse cx="74" cy="-118" rx="15" ry="11" fill="%s" stroke="%s" stroke-width="1.5" transform="rotate(-24 74 -118)"/>' % (BR, INK)
    o += '<ellipse cx="84" cy="-111" rx="8" ry="6" fill="%s" transform="rotate(-24 84 -111)"/><ellipse cx="91" cy="-114" rx="3.2" ry="2.6" fill="#2A1A12"/><circle cx="76" cy="-122" r="2.6" fill="#1A1210"/><circle cx="76.8" cy="-122.8" r=".9" fill="#fff"/>' % LT
    o += '<ellipse cx="60" cy="-130" rx="6" ry="11" fill="%s" stroke="%s" stroke-width="1.2" transform="rotate(-38 60 -130)"/><ellipse cx="60" cy="-130" rx="2.8" ry="7" fill="#F2B8A0" transform="rotate(-38 60 -130)"/>' % (BR, INK)
    return o + '</g>'

def bear(x, y, s=1):
    BK, TAN = '#2E2A34', '#D9B27A'
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s) + shadow(56)
    o += '<ellipse cx="-30" cy="-10" rx="22" ry="13" fill="%s" stroke="%s" stroke-width="1.4"/><ellipse cx="30" cy="-10" rx="22" ry="13" fill="%s" stroke="%s" stroke-width="1.4"/>' % (BK, INK, BK, INK)
    o += '<ellipse cx="-30" cy="-8" rx="9" ry="5" fill="#4A4250"/><ellipse cx="30" cy="-8" rx="9" ry="5" fill="#4A4250"/>'
    o += '<ellipse cy="-48" rx="46" ry="44" fill="%s" stroke="%s" stroke-width="1.6"/>' % (BK, INK)
    o += '<path d="M-24 -86Q0 -58 24 -86Q18 -66 8 -48Q0 -40 -8 -48Q-18 -66 -24 -86Z" fill="#F3E7C8" stroke="%s" stroke-width="1"/>' % INK
    o += '<ellipse cx="-42" cy="-46" rx="12" ry="24" fill="%s" stroke="%s" stroke-width="1.3" transform="rotate(12 -42 -46)"/><ellipse cx="42" cy="-46" rx="12" ry="24" fill="%s" stroke="%s" stroke-width="1.3" transform="rotate(-12 42 -46)"/>' % (BK, INK, BK, INK)
    o += '<circle cx="-48" cy="-24" r="7" fill="#4A4250"/><circle cx="48" cy="-24" r="7" fill="#4A4250"/>'
    o += '<g class="cchew"><circle cy="-104" r="34" fill="%s" stroke="%s" stroke-width="1.6"/><circle cx="-28" cy="-130" r="14" fill="%s" stroke="%s" stroke-width="1.4"/><circle cx="28" cy="-130" r="14" fill="%s" stroke="%s" stroke-width="1.4"/><circle cx="-28" cy="-129" r="7" fill="#B98A5A"/><circle cx="28" cy="-129" r="7" fill="#B98A5A"/>' % (BK, INK, BK, INK, BK, INK)
    o += '<ellipse cy="-94" rx="17" ry="14" fill="%s" stroke="%s" stroke-width="1"/><ellipse cy="-100" rx="6.5" ry="4.4" fill="#16121A"/><path d="M0 -96v5M0 -91q-5 6 -10 2M0 -91q5 6 10 2" stroke="%s" stroke-width="1.5" fill="none" stroke-linecap="round"/>' % (TAN, INK, INK)
    o += '<circle cx="-14" cy="-110" r="3.6" fill="#fff"/><circle cx="14" cy="-110" r="3.6" fill="#fff"/><circle cx="-13.4" cy="-109.6" r="2" fill="#111"/><circle cx="14.6" cy="-109.6" r="2" fill="#111"/><path d="M-22 -118q8 -4 12 0M22 -118q-8 -4 -12 0" stroke="#4A4250" stroke-width="2" fill="none" stroke-linecap="round"/></g>'
    return o + '</g>'

def wolf(x, y, s=1):
    """Sói xám nhỏ ngồi hú trên sườn núi (không có biển)."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="1" rx="22" ry="4" fill="#0A2A1A" opacity=".3"/>' % (x, y, s)
    o += '<path d="M-14 0Q-18 -16 -8 -26Q0 -38 0 -50L-12 -66L-4 -64L6 -60Q14 -58 14 -46Q16 -30 20 -12L22 0Z" fill="#8E96A4" stroke="%s" stroke-width="1.3" stroke-linejoin="round"/>' % INK
    o += '<path d="M8 -60L12 -70L16 -58Z" fill="#8E96A4" stroke="%s" stroke-width="1"/><path d="M4 -52Q14 -40 14 -24" stroke="#D9DEE6" stroke-width="3" fill="none" opacity=".8"/><path d="M-12 -4Q-34 -2 -32 -22" stroke="#6E7684" stroke-width="7" fill="none" stroke-linecap="round"/>' % INK
    return o + '</g>'

def petal(x, y, t, d, s=1):
    return '<g class="cpetal" style="--t:%.1fs;--d:-%.1fs"><g transform="translate(%d %d) scale(%.2f)"><ellipse rx="5" ry="3" fill="#FFC0D0" stroke="#D86A8A" stroke-width=".6" transform="rotate(30)"/></g></g>' % (t, d, x, y, s)

def blossom(x, y, ang, L, s=1):
    """Cành đào hoa nở: cành cong, nụ và hoa năm cánh."""
    r = random.Random(int(x + y))
    o = ''
    pts = [(x, y)]
    cx, cy, a = x, y, math.radians(ang)
    for k in range(6):
        a += r.uniform(-.28, .28); cx += math.cos(a) * L / 6; cy += math.sin(a) * L / 6; pts.append((cx, cy))
    o += '<path d="%s" stroke="#4A2E24" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (smooth(pts), 6 * s)
    for i, (px, py) in enumerate(pts[1:], 1):
        for _ in range(7):
            bx = px + r.uniform(-34, 34) * s; by = py + r.uniform(-22, 26) * s
            o += '<path d="M%.0f %.0fL%.0f %.0f" stroke="#4A2E24" stroke-width="1.4"/>' % (px, py, bx, by)
            c = r.choice(['#FFC6D4', '#FFAEC2', '#FFD9E2', '#FF93B0']); rr = r.uniform(6, 10) * s
            for k in range(5):
                ang_ = k * 72 + r.uniform(0, 20)
                o += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (bx + math.cos(math.radians(ang_)) * rr * .55, by + math.sin(math.radians(ang_)) * rr * .55, rr * .55, c)
            o += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#E86A8A"/>' % (bx, by, rr * .22)
    return V.sway(o, x, y, 6, 1)

def pavers(pts):
    return ''.join('<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="#CFC8B6" stroke="#6E6656" stroke-width="1.2"/><ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="#fff" opacity=".28"/>' % (x, y, w, w * .36, x - 2, y - 1, w * .7, w * .22) for x, y, w in pts)

def china():
    d = (lin('skC', [('0', '#79B6DE'), ('.38', '#BCDCEA'), ('.72', '#F8E4CC'), ('1', '#FFD9AE')])
         + lin('wmg', [('0', '#A4B88E'), ('.45', '#7E9A72'), ('1', '#4F6E50')], .3, 1)
         + lin('lkC', [('0', '#CFE6E6'), ('.5', '#8CC4C8'), ('1', '#4F9CA6')])
         + '<filter id="wob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".006 .1" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="14" xChannelSelector="R" yChannelSelector="G"/></filter>'
         + '<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient><mask id="fm"><rect y="400" width="1280" height="160" fill="url(#fade)"/></mask>')
    o = '<rect width="1280" height="520" fill="url(#skC)"/>'
    # mặt trời ban mai sau núi trái
    o += '<circle cx="470" cy="200" r="230" fill="url(#hg)"/><circle cx="470" cy="204" r="46" fill="#FFF3C8"/><circle cx="470" cy="204" r="36" fill="#FFE59A"/>'
    for x, y, w_ in ((250, 100, 300), (760, 70, 360), (1120, 110, 280), (60, 190, 240), (620, 150, 160)): o += cloud(x, y, w_, '#FFF8EC', '#F7D3C2', .9)
    o += V.flock(80, 70, 20, .42)
    # núi xa thuỷ mặc nhạt dần
    o += ridge(260, 70, '#C9D4E8', 3, ((130, 130, 70), (330, 90, 60), (1190, 140, 80)))
    o += ridge(292, 60, '#A9BCD6', 6, ((60, 90, 50), (260, 150, 55), (440, 70, 50), (1120, 60, 60)))
    o += pagoda(150, 346, .9, '#8C9CBE') + mist(330, 20, .5, 34, 0)
    o += ridge(330, 50, '#8AA6B8', 9, ((200, 120, 60), (370, 80, 50), (560, 40, 60)))
    o += mist(372, 26, .6, 28, 9)
    # núi Trường Thành
    o += '<path d="M470 560L520 400L560 300L620 250L690 220L760 200L1000 140L1180 150L1300 210V560Z" fill="#B8C9D8" opacity=".55"/>'
    o += wallmountain() + '<g>' + great_wall() + '</g>'
    # sói nhỏ trên mỏm đá chân núi
    o += rock(742, 318, 52, 22) + wolf(744, 306, .56)
    o += mist(436, 22, .6, 26, 4, '#F2F2EC')
    # đồi xanh trái, thông xa
    o += ridge(430, 30, '#6FA06A', 12, (), 470, 50)
    for x, y, s_ in ((90, 436, .5), (210, 432, .44), (520, 432, .4), (760, 456, .52), (880, 452, .5), (1010, 446, .56), (1150, 450, .5), (1250, 456, .62)): o += '<g style="filter:brightness(.88)">' + pine(x, y, s_) + '</g>'
    # hồ + đảo đình
    lake = [(-30, 452), (120, 440), (300, 436), (480, 440), (640, 452), (700, 480), (640, 520), (480, 540), (260, 548), (80, 552), (-30, 556)]
    ld = smooth(lake, 'Z')
    o += '<clipPath id="lkc"><path d="%s"/></clipPath><path d="%s" fill="#6E9A58" stroke="#3E6A3A" stroke-width="2"/>' % (ld, smooth([(x - 6, y - 6) for x, y in lake], 'Z'))
    o += '<path d="%s" fill="url(#lkC)"/><g clip-path="url(#lkc)">' % ld
    refl = pavilion(450, 482, .98) + rock(360, 490, 60, 24) + rock(540, 490, 70, 28)
    o += '<g filter="url(#wob)" mask="url(#fm)"><g transform="translate(0 %d) scale(1 -1)">%s</g></g>' % (482 * 2, refl)
    for _ in range(90):
        x = R.randint(0, 700); y = R.randint(446, 548); w_ = R.randint(14, 60)
        o += '<path class="lap" style="--t:%.1fs;--d:-%.1fs" d="M%d %dh%d" stroke="%s" stroke-width="2" opacity="%.2f" stroke-linecap="round"/>' % (R.uniform(3, 6), R.uniform(0, 4), x, y, w_, R.choice(['#fff', '#FFF3C8', '#9AD0D4']), R.uniform(.25, .65))
    o += '</g>'
    # sen/lục bình
    for x, y in ((140, 520), (610, 526), (300, 534), (220, 470)):
        o += '<g class="rock">' + ''.join('<ellipse cx="%d" cy="%d" rx="11" ry="4.6" fill="%s" stroke="#1F5A2A" stroke-width=".8"/>' % (x + R.randint(-18, 18), y + R.randint(-4, 4), R.choice(['#3CA45C', '#2F8A4A', '#5AB864'])) for _ in range(5)) + '<circle cx="%d" cy="%d" r="4" fill="#FFB6C8"/></g>' % (x, y - 4)
    # đảo + đình
    o += '<ellipse cx="450" cy="486" rx="108" ry="18" fill="#7C9A62" stroke="#3E6A3A" stroke-width="1.6"/>' + rock(364, 492, 62, 28) + rock(542, 492, 76, 32) + rock(480, 496, 50, 18)
    o += pavilion(450, 482, .98)
    o += pine(556, 478, .7, 0) + '<g>' + pine(352, 482, .52, .2) + '</g>'
    # đường đá bước vào đảo
    o += pavers([(380, 540, 18), (396, 520, 16), (414, 505, 15), (430, 496, 13)])
    # bờ phải: sườn đồi nối chân núi
    land = [(640, 452), (700, 462), (760, 452), (900, 440), (1100, 446), (1310, 440), (1310, 740), (560, 740), (590, 600), (650, 560), (700, 500)]
    o += '<path d="%s" fill="#7AAE5E" stroke="#3E6A3A" stroke-width="2"/>' % smooth(land, 'Z')
    o += grass(120, 640, 1290, 450, 560, ('#4F9A4A', '#6AB458', '#3E8644'))
    # đồng cỏ tiền cảnh
    fg = [(-30, 556), (80, 560), (240, 556), (420, 548), (560, 546), (700, 530), (900, 540), (1100, 548), (1310, 540), (1310, 740), (-30, 740)]
    o += lin('grF', [('0', '#6FB458'), ('1', '#3A8040')]).join(['<defs>', '</defs>']) + '<path d="%s" fill="url(#grF)" stroke="#3E6A3A" stroke-width="1.6"/>' % smooth(fg, 'Z')
    o += grass(420, -20, 1300, 556, 720) + flowers(90, 0, 1280, 560, 718)
    # lối đi đá cuội uốn về phía giữa
    o += '<path d="M470 740Q560 650 600 580Q630 548 620 548" stroke="#E4D2A8" stroke-width="46" fill="none" stroke-linecap="round" opacity=".3"/>'
    # tre bên trái + gấu trúc
    o += V.tre(10, 700, 8, 1.7) + V.tre(120, 690, 6, 1.4)
    o += rock(300, 682, 86, 38) + rock(76, 712, 70, 26) + pine(1228, 706, 1.05, .3)
    o += panda(214, 676, 1.18)
    o += '<g>' + V.tre(300, 706, 4, 1.0) + '</g>'
    # nai bên hồ, hổ trên đá, gấu đen dưới thông
    o += deer(612, 560, 1.0) + rock(830, 576, 150, 44)
    o += tiger(830, 572, 1.02, False)
    o += rock(1010, 650, 70, 24) + bear(1126, 664, 1.12)
    o += lantern_post(364, 560, .9) + lantern_post(706, 566, 1.0) + lantern_post(1040, 556, .84)
    # hơi nước hấp bánh bao: nồi hấp tre bên cột đèn (món ăn của bé, trang trí)
    o += '<g transform="translate(748 616)"><ellipse cy="1" rx="30" ry="6" fill="#0A3A22" opacity=".3"/><rect x="-26" y="-10" width="52" height="10" rx="3" fill="#C99A5A" stroke="%s" stroke-width="1.4"/><rect x="-26" y="-22" width="52" height="12" rx="3" fill="#D9AE6A" stroke="%s" stroke-width="1.4"/><ellipse cy="-22" rx="26" ry="5" fill="#B88A4A" stroke="%s"/><ellipse cx="-8" cy="-26" rx="8" ry="6" fill="#FFF8EC" stroke="#B8A890"/><ellipse cx="9" cy="-27" rx="8" ry="6" fill="#FFF8EC" stroke="#B8A890"/><path d="M-12 -26q4 -3 8 0M5 -27q4 -3 8 0" stroke="#C8B89A" fill="none"/>' % (INK, INK, INK)
    for k in range(3): o += '<path class="csteam" style="--d:-%.1fs" d="M%d -34q-5 -8 0 -16q5 -8 0 -16" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>' % (k * 1.3, -10 + k * 10)
    o += '</g>'
    # đào nở rủ góc phải trên + cánh hoa rơi
    o += blossom(1290, 40, 195, 300, 1.0) + blossom(1290, 120, 200, 170, .8)
    for x, y, t_, d_ in ((1100, 90, 12, 0), (1040, 140, 14, 5), (980, 60, 11, 3), (1180, 170, 15, 8), (900, 110, 13, 9), (1220, 70, 10, 2)): o += petal(x, y, t_, d_, 1.1)
    # thú cưng và người đi bộ
    o += V.kitsu(640, 712, 104, 'ehappy', 'walk')
    for t_, x, y, dn in [('Núi', 900, 112, False), ('Gấu trúc', 226, 462, False), ('Nai', 618, 336, False), ('Hổ', 840, 420, False), ('Gấu', 1126, 450, False)]:
        o += G.bubble(x, y, t_, dn)
    page('PChina', 'Kids World, Trung Quốc buổi sớm', 'Vạn Lý Trường Thành trên núi buổi sớm, đình bên hồ, rừng tre với gấu trúc, hổ, nai và gấu đen', d, o, 'Trung Quốc')

if __name__ == '__main__':
    china(); print('ok')
