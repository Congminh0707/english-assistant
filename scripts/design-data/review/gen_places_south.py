# Cảnh địa điểm miền Nam (PHcmc, PCantho, PPhuquoc) và bản đồ tầng 2 (PAsia), chuẩn: docs/22 §12, hàm r5f.
#   BOARD_OUT=<project> python gen_places_south.py [vn_merged.json]  (PEarth nay ở gen_earth.py)
# Bản đồ cần shapely (gộp mọi nước thành một khối, không còn đường biên).
import html, json, math, os, random, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.environ.get('BOARD_OUT') or '.'
TMP = 'C:/Users/01217/AppData/Local/Temp/vn/'
sys.argv = ['x', OUT, sys.argv[1] if len(sys.argv) > 1 else TMP + 'vn_merged.json']
sys.path.insert(0, HERE)
import gen_review2 as G
V = G.V
R = random.Random(31)
INK = '#1E1612'
PLACES = os.path.join(ROOT, 'content', 'curated', 'kids', 'world', 'places')

CSS = """<style>
@keyframes ride{from{transform:translateX(0)}to{transform:translateX(var(--dx,1400px))}}
.ride{animation:ride var(--t,16s) linear infinite;animation-delay:var(--d,0s)}
@keyframes fall{0%{transform:translate(0,0) rotate(0);opacity:0}8%{opacity:1}90%{opacity:1}100%{transform:translate(var(--dx,60px),var(--dy,300px)) rotate(1080deg);opacity:0}}
.seed{animation:fall var(--t,9s) linear infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
@keyframes row{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(9deg)}}
.row{animation:row 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:top center}
@keyframes lift{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.lift{animation:lift 4.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.ride,.row,.lift,.plane{animation:none}.seed{animation:none;opacity:0}}
</style>"""
HG = '<radialGradient id="hg"><stop offset="0" stop-color="#FFD27A" stop-opacity=".85"/><stop offset=".5" stop-color="#FFAE4A" stop-opacity=".3"/><stop offset="1" stop-color="#FFAE4A" stop-opacity="0"/></radialGradient>'

def lin(id_, stops, x2=0, y2=1):
    return '<linearGradient id="%s" x1="0" y1="0" x2="%s" y2="%s">' % (id_, x2, y2) + ''.join('<stop offset="%s" stop-color="%s"/>' % s for s in stops) + '</linearGradient>'

def water_defs(top, scale=20, seed=3):
    """Giống r5f: gợn méo bằng feDisplacementMap, mờ dần về phía người xem."""
    return ('<filter id="wob" x="-5%%" y="-5%%" width="110%%" height="110%%"><feTurbulence type="fractalNoise" baseFrequency=".006 .1" numOctaves="2" seed="%d"/><feDisplacementMap in="SourceGraphic" scale="%d" xChannelSelector="R" yChannelSelector="G"/></filter>' % (seed, scale)
        + '<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient><mask id="fm"><rect y="%d" width="1280" height="%d" fill="url(#fade)"/></mask>' % (top, 720 - top))

def reflect(inner, axis, top):
    c = V.uid()
    return '<clipPath id="%s"><rect y="%d" width="1280" height="%d"/></clipPath><g clip-path="url(#%s)"><g filter="url(#wob)" mask="url(#fm)"><g transform="translate(0 %d) scale(1 -1)">%s</g></g></g>' % (c, top, 720 - top, c, axis * 2, inner)

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

def coco(x, y, h, lean=30, c='#1F5A3A', trunk='#6B4A32', ink='#163020', fr=11, L=78):
    """Dừa: thân cong mảnh có đốt, tàu dài rủ, lá chét; c=trunk=ink tối thành bóng đen ngược sáng."""
    tx, ty = x + lean, y - h
    o = '<path d="M%d %dQ%d %d %d %d" stroke="%s" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (x, y, x + lean * .1, y - h * .6, tx, ty, trunk, max(3, h * .022))
    for k in range(1, 12):
        t = k / 12; px = (1 - t) ** 2 * x + 2 * (1 - t) * t * (x + lean * .1) + t * t * tx; py = (1 - t) ** 2 * y + 2 * (1 - t) * t * (y - h * .6) + t * t * ty
        o += '<path d="M%.0f %.0fh%.1f" stroke="%s" stroke-width="1" opacity=".5"/>' % (px - h * .012, py, h * .024, ink)
    fronds = ''
    for k in range(fr):
        a = math.pi * (-.06 + 1.12 * k / (fr - 1)); l = L * (.82 + .3 * math.sin(k * 2.3) ** 2)
        ex, ey = tx + math.cos(a) * l, ty - math.sin(a) * l * .42 + l * .42
        mx, my = tx + math.cos(a) * l * .55, ty - math.sin(a) * l * .6 - l * .12
        fronds += '<path d="M%d %dQ%.0f %.0f %.0f %.0f" stroke="%s" stroke-width="2" fill="none"/>' % (tx, ty, mx, my, ex, ey, ink)
        for j in range(3, 12):
            t = j / 12; qx = (1 - t) ** 2 * tx + 2 * (1 - t) * t * mx + t * t * ex; qy = (1 - t) ** 2 * ty + 2 * (1 - t) * t * my + t * t * ey
            ln = l * .26 * math.sin(t * math.pi) + 4
            fronds += '<path d="M%.0f %.0fl%.1f %.1fM%.0f %.0fl%.1f %.1f" stroke="%s" stroke-width="1.8" stroke-linecap="round"/>' % (qx, qy, -ln * .35, ln, qx, qy, ln * .35, ln, c)
    o += V.sway(fronds, tx, ty, 4.2 + (x % 5) * .3, (x % 7) * .4)
    for sg in (-1, 0, 1): o += '<circle cx="%d" cy="%d" r="%.1f" fill="%s"/>' % (tx + sg * 5, ty + 5, max(2.4, h * .012), trunk)
    return o

# ---------- PHcmc: chợ Bến Thành chiều nắng vàng ----------
def sao(x, y, h, s=1):
    """Cây sao: thân thẳng cao, vỏ xám nhạt, tán nhỏ gọn trên ngọn, cành chếch lên."""
    w = 24 * s
    o = '<path d="M%.0f %dQ%.0f %d %.0f %dL%.0f %dQ%.0f %d %.0f %dZ" fill="#A89A84" stroke="%s" stroke-width="1.6"/>' % (x - w / 2 - 4 * s, y, x - w * .34, y - h * .5, x - w * .22, y - h, x + w * .22, y - h, x + w * .34, y - h * .5, x + w / 2 + 4 * s, y, INK)
    o += '<path d="M%.0f %dQ%.0f %d %.0f %dL%.0f %dQ%.0f %d %.0f %dZ" fill="#7E705E" opacity=".65"/>' % (x + w * .02, y, x + w * .05, y - h * .5, x + w * .05, y - h, x + w * .22, y - h, x + w * .34, y - h * .5, x + w / 2 + 4 * s, y)
    for _ in range(int(h / 9)):
        py = R.randint(int(y - h), y); px = x + R.uniform(-w * .3, w * .3)
        o += '<path d="M%.0f %dq%.1f %d %.1f %d" stroke="#5E5244" stroke-width="1.1" fill="none" opacity=".7"/>' % (px, py, R.uniform(-2, 2), R.randint(6, 12), R.uniform(-2, 2), R.randint(14, 30))
    crown = ''
    for sg, bx, by in ((-1, 70, 110), (1, 74, 120), (-1, 120, 40), (1, 112, 54), (-1, 40, 170), (1, 44, 176)):
        crown += '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0f" stroke="#5E5244" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (x, y - h, x + sg * bx * s * .4, y - h - by * s * .3, x + sg * bx * s, y - h - by * s, 5 * s)
    pal = ['#1F6A42', '#2C8A50', '#17563A', '#3CA45C', '#6FBE5A']
    for _ in range(int(150 * s)):
        a, r_ = R.uniform(0, 6.28), R.uniform(0, 1) ** .55
        cx, cy = x + math.cos(a) * r_ * 150 * s, y - h - 90 * s + math.sin(a) * r_ * 92 * s
        c_ = pal[min(4, max(0, int(2.4 - (cy - (y - h - 90 * s)) / (40 * s) + R.uniform(-1, 1))))]
        crown += '<circle cx="%.0f" cy="%.0f" r="%.1f" fill="%s"/>' % (cx, cy, R.uniform(9, 19) * s, c_)
    for _ in range(int(70 * s)):
        a, r_ = R.uniform(0, 6.28), R.uniform(.2, 1)
        crown += '<ellipse cx="%.0f" cy="%.0f" rx="5" ry="2.4" fill="#8FD86A" transform="rotate(%d %d %d)" opacity=".85"/>' % (x + math.cos(a) * r_ * 150 * s - 12, y - h - 106 * s + math.sin(a) * r_ * 76 * s, R.randint(-40, 40), x, y - h)
    return o + V.sway(crown, x, y - h, 6, x % 4)

def seed(x, y, dx, dy, t, d, s=1):
    # quả sao hai cánh rơi xoay
    return '<g class="seed" style="--dx:%dpx;--dy:%dpx;--t:%.1fs;--d:-%.1fs"><g transform="translate(%d %d) scale(%.2f)"><path d="M0 0Q-5 -12 -4 -26Q2 -24 3 -1Z" fill="#E8604C" stroke="#7A2A1A" stroke-width=".7"/><path d="M0 0Q6 -11 9 -24Q13 -18 4 0Z" fill="#E88A4C" stroke="#7A2A1A" stroke-width=".7"/><circle cy="3" r="4" fill="#8A5A2E" stroke="#3A2413" stroke-width=".7"/></g></g>' % (dx, dy, t, d, x, y, s)

def moto(x, y, s=1, flip=False, shirt='#F4F0E4', helmet='#2E5AA8', body='#C7322E', pants='#3E5A8A', back=None, mask='#E8E2D2'):
    """Xe số/tay ga kiểu Sài Gòn theo ảnh: yếm trước, sàn để chân, yên dài, người đội mũ bảo hiểm, khẩu trang."""
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s)
    o += '<ellipse cy="1" rx="50" ry="4.4" fill="#120A08" opacity=".4"/>'
    for wx in (-30, 32):
        o += '<circle cx="%d" cy="-14" r="14" fill="#1E1A1E"/><circle cx="%d" cy="-14" r="8.6" fill="#B9B4AA" stroke="#2A2428"/><circle cx="%d" cy="-14" r="2.6" fill="#2A2428"/>' % (wx, wx, wx)
        for k in range(5): o += '<path d="M%d -14l%.1f %.1f" stroke="#2A2428" stroke-width="1.5"/>' % (wx, 8 * math.cos(k * 1.26), 8 * math.sin(k * 1.26))
    o += '<path d="M-44 -6H-14" stroke="#C9C4BA" stroke-width="3.4" stroke-linecap="round"/>'
    o += '<path d="M-44 -28Q-42 -40 -22 -38H-2Q2 -22 12 -20L24 -44L32 -42L22 -13H-12Q-30 -11 -44 -28Z" fill="%s" stroke="%s" stroke-width="1.3"/>' % (body, INK)
    o += '<path d="M-40 -30Q-26 -24 -8 -24" stroke="#fff" stroke-width="1.6" opacity=".55" fill="none"/><path d="M-46 -38Q-22 -46 0 -38L-2 -32H-42Z" fill="#26222A" stroke="%s" stroke-width=".9"/>' % INK
    o += '<path d="M24 -14Q36 -30 46 -14Z" fill="%s" stroke="%s" stroke-width="1.1"/><path d="M28 -44L40 -19" stroke="#B9B4AA" stroke-width="2.6"/>' % (body, INK)
    o += '<path d="M21 -52h15" stroke="#26222A" stroke-width="3.6" stroke-linecap="round"/><ellipse cx="35" cy="-44" rx="5" ry="4.4" fill="#FFF3B0" stroke="%s"/><path d="M26 -54l-3 -11" stroke="#26222A" stroke-width="1.4"/><ellipse cx="22" cy="-67" rx="3.4" ry="4.4" fill="#2A2428"/>' % INK
    def rider(ox, sh, hl, big=True):
        r_ = '<g transform="translate(%d 0)">' % ox
        r_ += '<path d="M-12 -44L8 -36L10 -14" stroke="%s" stroke-width="%.1f" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 -12h9" stroke="#3A2A20" stroke-width="4" stroke-linecap="round"/>' % (pants, 10 if big else 8.5)
        r_ += '<path d="M-20 -78Q-22 -56 -18 -40H0Q6 -60 -2 -80Q-12 -86 -20 -78Z" fill="%s" stroke="%s" stroke-width="1"/>' % (sh, INK)
        if big: r_ += '<path d="M-8 -74Q8 -66 21 -54" stroke="%s" stroke-width="6.4" fill="none" stroke-linecap="round"/><path d="M19 -56l5 3" stroke="#E8B98E" stroke-width="5" stroke-linecap="round"/>' % sh
        r_ += '<rect x="-13" y="-90" width="7" height="8" fill="#E8B98E"/><circle cx="-8" cy="-97" r="10" fill="#E8B98E" stroke="%s" stroke-width=".7"/>' % INK
        r_ += '<path d="M-7 -95Q3 -97 3 -93L2 -88Q-5 -85 -11 -90Z" fill="%s" stroke="#8A8272" stroke-width=".6"/>' % mask
        r_ += '<path d="M-20 -99Q-19 -111 -7 -111Q4 -110 5 -100L11 -98L-2 -100L-20 -96Z" fill="%s" stroke="%s" stroke-width="1"/><path d="M-14 -106Q-8 -109 -2 -106" stroke="#fff" stroke-width="1.6" opacity=".7" fill="none"/>' % (hl, INK)
        return r_ + '</g>'
    if back: o += rider(-22, back[0], back[1], False)
    return o + rider(0, shirt, helmet) + '</g>'

def bus(x, y, s=1, flip=False):
    # xe buýt thành phố xanh lá, viền trắng
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)"><ellipse cy="2" rx="180" ry="7" fill="#120A08" opacity=".35"/>' % (x, y, -s if flip else s, s)
    o += '<path d="M-168 -16V-112Q-168 -124 -154 -124H150Q166 -122 170 -92L174 -16Z" fill="#2F9A5A" stroke="%s" stroke-width="1.8"/><path d="M-168 -56H174V-34H-168Z" fill="#F2F0E2"/><path d="M-168 -30H174" stroke="#E8A23C" stroke-width="4"/>' % INK
    for k in range(6):
        wx = -156 + k * 50
        o += '<rect x="%d" y="-112" width="44" height="46" rx="3" fill="#BFE0E4" stroke="#1A3A30"/><path d="M%d -112L%d -66" stroke="#fff" opacity=".6" stroke-width="5"/>' % (wx, wx + 26, wx + 8)
        if k % 2: o += '<circle cx="%d" cy="-82" r="7" fill="#7A5A44" opacity=".6"/><rect x="%d" y="-74" width="16" height="8" fill="#7A5A44" opacity=".6"/>' % (wx + 20, wx + 12)
    o += '<path d="M146 -112H160Q168 -100 170 -66H146Z" fill="#CFEAEC" stroke="#1A3A30"/>'
    for wx in (-104, 112): o += '<path d="M%d -16a26 26 0 0 1 52 0Z" fill="#1E1A1E"/><circle cx="%d" cy="-15" r="19" fill="#1E1A1E"/><circle cx="%d" cy="-15" r="10" fill="#B9B4AA"/>' % (wx - 26, wx, wx)
    o += '<rect x="-160" y="-52" width="40" height="13" rx="2" fill="#2F9A5A"/><circle cx="170" cy="-26" r="5" fill="#FFF3B0" stroke="%s"/></g>' % INK
    return o

def taxi(x, y, flip=False, c='#F4F0E4'):
    o = '<g transform="translate(%d %d) scale(%d 1)"><ellipse cy="2" rx="86" ry="5" fill="#120A08" opacity=".35"/>' % (x, y, -1 if flip else 1)
    o += '<path d="M-84 -14Q-88 -38 -66 -42L-40 -66Q-30 -72 -8 -72H16Q32 -72 46 -46L74 -40Q88 -36 86 -14Z" fill="%s" stroke="%s" stroke-width="1.6"/>' % (c, INK)
    o += '<path d="M-32 -44L-18 -64H4V-44ZM10 -44V-64H24Q32 -60 38 -44Z" fill="#9CC4CE" stroke="#1A3A30"/><path d="M-84 -26H86" stroke="#2F9A5A" stroke-width="3"/>'
    for wx in (-48, 52): o += '<circle cx="%d" cy="-13" r="14" fill="#1E1A1E"/><circle cx="%d" cy="-13" r="7" fill="#B9B4AA"/>' % (wx, wx)
    return o + '</g>'

def benthanh():
    W_, W2 = '#EAD29A', '#D9BC7E'     # tường vàng kem theo ảnh
    SH = '#B8975E'
    G0 = 478
    o = ''
    # hai cánh chợ: mái ngói đỏ phía sau, gờ tường phẳng, vòm cuốn nhỏ
    for x, w_, y_, h_ in ((-40, 480, 340, 40), (840, 480, 340, 40)):
        o += '<path d="M%d %dL%d %dH%dL%d %dZ" fill="#B2482E" stroke="%s" stroke-width="1.4"/>' % (x, y_ + 34, x + 34, y_ - h_ + 34, x + w_ - 34, x + w_, y_ + 34, INK)
        for k in range(int(w_ / 11)): o += '<path d="M%d %dL%d %d" stroke="#7E2E1E" stroke-width="1.2"/>' % (x + k * 11, y_ + 34, x + 18 + k * 10.2, y_ - h_ + 34)
    for x0, x1 in ((-20, 424), (856, 1300)):
        o += '<rect x="%d" y="372" width="%d" height="106" fill="%s" stroke="%s" stroke-width="1.6"/><rect x="%d" y="366" width="%d" height="10" fill="#F4E4B8" stroke="%s"/><rect x="%d" y="398" width="%d" height="5" fill="%s"/>' % (x0, x1 - x0, W_, INK, x0 - 4, x1 - x0 + 8, INK, x0, x1 - x0, SH)
        n = int((x1 - x0) / 74)
        for k in range(n):
            ax = x0 + 18 + k * 74
            o += '<path d="M%d 478V432a30 28 0 0 1 60 0V478Z" fill="#3A4A58" stroke="%s" stroke-width="1.4"/><path d="M%d 432a30 28 0 0 1 60 0Z" fill="#6E5A44" stroke="%s"/>' % (ax, INK, ax, INK)
            for j in range(1, 6): o += '<path d="M%d 432L%d %d" stroke="#3A2A20" stroke-width="1"/>' % (ax + 30, ax + 30 + 30 * math.cos(j * math.pi / 6), 432 - 28 * math.sin(j * math.pi / 6))
            o += '<rect x="%d" y="438" width="52" height="30" fill="%s" stroke="#D1A24A"/>' % (ax + 4, ['#FFD27A', '#3E7A9A', '#FFC66E', '#2F6A5A'][k % 4])
            o += '<path d="M%d 438v30M%d 438v30" stroke="#3A2A20" stroke-width="1"/>' % (ax + 20, ax + 38)
    # khối chính
    o += '<rect x="420" y="338" width="440" height="140" fill="%s" stroke="%s" stroke-width="2"/><rect x="414" y="332" width="452" height="9" fill="#F4E4B8" stroke="%s"/>' % (W_, INK, INK)
    for _ in range(26):
        o += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" opacity=".18"/>' % (R.randint(424, 856), R.randint(345, 470), R.randint(6, 26), R.randint(3, 10), R.choice(['#9A6A1E', '#FFE29A', '#7A5A2A']))
    # phần khối bên: cửa cuốn, băng thoáng chữ V, tranh gắn tường
    for x in (440, 744):
        o += '<rect x="%d" y="424" width="96" height="54" fill="#8E9090" stroke="%s" stroke-width="1.4"/>' % (x, INK)
        for k in range(1, 14): o += '<path d="M%d %dh96" stroke="#5E6062" stroke-width=".9"/>' % (x, 424 + k * 4)
        o += '<rect x="%d" y="396" width="96" height="24" fill="#F4E4B8" stroke="%s"/>' % (x, INK)
        for k in range(4):
            xx = x + 5 + k * 22
            for j in range(3): o += '<path d="M%d %dl10 5l10 -5" stroke="#5A4A3A" stroke-width="1.7" fill="none"/>' % (xx, 400 + j * 5)
        o += '<rect x="%d" y="358" width="22" height="20" fill="#6E5A3A" stroke="%s" stroke-width="1.4"/><rect x="%d" y="362" width="14" height="12" fill="#C9A464"/>' % (x + 37, INK, x + 41)
    # bốn trụ áp tường + tầng giữa cao hơn
    o += '<rect x="534" y="296" width="212" height="182" fill="%s" stroke="%s" stroke-width="2"/><rect x="528" y="290" width="224" height="9" fill="#F4E4B8" stroke="%s"/>' % (W_, INK, INK)
    for x, w_ in ((530, 16), (552, 13), (715, 13), (734, 16)):
        o += '<rect x="%d" y="296" width="%d" height="182" fill="#F6ECCB" stroke="%s" stroke-width="1.2"/><rect x="%d" y="296" width="%d" height="182" fill="%s" opacity=".55"/>' % (x, w_, INK, x + w_ - 4, 3, SH)
    # vòm cửa chính
    o += '<path d="M570 478V404a70 62 0 0 1 140 0V478Z" fill="#2A1C16" stroke="%s" stroke-width="2.4"/>' % INK
    o += '<path d="M562 478V404a78 70 0 0 1 156 0V478H710V404a70 62 0 0 0 -140 0V478Z" fill="#F4E4B8" stroke="%s" stroke-width="1.3"/>' % INK
    o += G.halo(640, 440, 70, .6) + '<path d="M582 478V430H698V478Z" fill="#6A3A22"/>'
    for k in range(9):
        o += '<rect x="%d" y="%d" width="12" height="%d" fill="%s" stroke="%s" stroke-width=".7"/>' % (586 + k * 12, 444 + (k % 3) * 4, 34 - (k % 3) * 4, G.LC_[k % 6], INK)
    o += '<path d="M582 430H698" stroke="#FFD27A" stroke-width="3"/>' + G.walker(620, 476, '#F268A6', s=.62) + G.walker(662, 476, '#2FB8C6', s=.66)
    o += '<rect x="612" y="310" width="56" height="28" fill="#6E5A3A" stroke="%s" stroke-width="1.6"/><rect x="617" y="314" width="46" height="20" fill="#C9A464"/><path d="M640 316l11 8l-11 8l-11 -8Z" fill="#8A5A2E"/>' % INK
    # thân tháp
    o += '<rect x="548" y="172" width="20" height="120" fill="%s" stroke="%s" stroke-width="1.4"/>' % (SH, INK)
    o += '<ellipse cx="558" cy="232" rx="7" ry="24" fill="#1F5A7A" stroke="#F4F0E4" stroke-width="2"/>'
    o += '<rect x="566" y="172" width="150" height="120" fill="%s" stroke="%s" stroke-width="2"/>' % (W_, INK)
    for x, w_ in ((566, 20), (696, 20)):
        o += '<rect x="%d" y="172" width="%d" height="120" fill="#F6ECCB" stroke="%s" stroke-width="1.1"/>' % (x, w_, INK)
        for k in range(3): o += '<path d="M%d %dh%d" stroke="%s" stroke-width="2"/>' % (x + 3, 184 + k * 7, w_ - 6, SH)
    o += '<path d="M592 182L641 196L690 182" fill="none" stroke="#F4E4B8" stroke-width="7"/><path d="M592 186L641 200L690 186" fill="none" stroke="%s" stroke-width="1.2"/>' % SH
    # mặt đồng hồ: viền trắng, nền xanh, số chỉ bằng vạch
    o += '<circle cx="641" cy="226" r="40" fill="#F4E4B8" stroke="%s" stroke-width="1.4"/><circle cx="641" cy="226" r="33" fill="#2F7EA8" stroke="#F4F0E4" stroke-width="4"/>' % INK
    for k in range(12):
        a = k * math.pi / 6
        o += '<path d="M%.1f %.1fL%.1f %.1f" stroke="#F4F0E4" stroke-width="%.1f"/>' % (641 + math.sin(a) * 28, 226 - math.cos(a) * 28, 641 + math.sin(a) * 23, 226 - math.cos(a) * 23, 3.4 if k % 3 == 0 else 1.8)
    o += '<path d="M641 226L654 216" stroke="#F4F0E4" stroke-width="3.6" stroke-linecap="round"/><path d="M641 226L637 202" stroke="#F4F0E4" stroke-width="2.6" stroke-linecap="round"/><circle cx="641" cy="226" r="3" fill="#F7D21A"/>'
    # chữ thật trên mặt tiền (theo ảnh)
    o += '<text x="640" y="287" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="24" letter-spacing="1" fill="#241410" stroke="#F4E4B8" stroke-width="3" paint-order="stroke">CHỢ BẾN THÀNH</text>'
    # tầng trên: gờ lớn, băng hoa gió, consoles, mái ngói rộng
    o += '<path d="M552 164H730L720 174H556Z" fill="#F4E4B8" stroke="%s" stroke-width="1.5"/>' % INK
    o += '<rect x="574" y="122" width="134" height="44" fill="%s" stroke="%s" stroke-width="1.6"/><rect x="592" y="134" width="98" height="12" fill="#3A3A3A" stroke="%s"/>' % (W_, INK, INK)
    for k in range(13): o += '<path d="M%d 134v12" stroke="#B9B4AA" stroke-width="1.4"/>' % (596 + k * 7.6)
    for x in (580, 690):
        o += '<rect x="%d" y="126" width="12" height="38" fill="#F6ECCB" stroke="%s"/>' % (x, INK)
    o += '<path d="M520 124L598 84H686L764 124L752 132H532Z" fill="#7E4E3A" stroke="%s" stroke-width="1.6"/>' % INK
    tid = V.uid()
    o += '<clipPath id="%s"><path d="M520 124L598 84H686L764 124Z"/></clipPath><path d="M520 124L598 84H686L764 124Z" fill="#C2532E" stroke="%s" stroke-width="1.6"/><g clip-path="url(#%s)">' % (tid, INK, tid)
    for k in range(32): o += '<path d="M%d 126L%d 84" stroke="#8A3218" stroke-width="1.4"/>' % (518 + k * 8, 596 + k * 3)
    for k in range(5): o += '<path d="M510 %dH770" stroke="#E07A4C" stroke-width="1" opacity=".7"/>' % (92 + k * 7)
    o += '</g><path d="M520 124L532 132H752L764 124" stroke="#F4E4B8" stroke-width="3" fill="none"/>'
    o += '<path d="M642 84V52M642 30V50" stroke="#3A3A3A" stroke-width="3"/><circle cx="642" cy="64" r="5.4" fill="#7E4E3A" stroke="%s"/><path d="M634 84q8 -14 16 0Z" fill="#7E4E3A" stroke="%s"/><circle cx="642" cy="52" r="3" fill="#3A3A3A"/>' % (INK, INK)
    # cột đèn hai bên mặt tiền
    for x, sg in ((392, 1), (892, -1)):
        o += '<path d="M%d 480V330q0 -12 %d -12" stroke="#4A4A50" stroke-width="4" fill="none"/><ellipse cx="%d" cy="318" rx="10" ry="4" fill="#E8E2D2" stroke="#2A2A30"/>' % (x, sg * 14, x + sg * 16)
    return o

def skyline():
    o = ''
    for x, w_, h_, c_ in [(-10, 80, 230, '#C79A86'), (70, 60, 186, '#B98C80'), (136, 90, 262, '#D2A58E'), (232, 64, 170, '#BE9080'), (306, 96, 214, '#CFA48C'), (884, 92, 226, '#CFA48C'), (982, 66, 184, '#BE9080'), (1054, 100, 278, '#D2A58E'), (1160, 66, 196, '#B98C80'), (1224, 80, 240, '#C79A86')]:
        y_ = 372 - h_
        o += '<rect x="%d" y="%d" width="%d" height="%d" fill="%s"/><rect x="%d" y="%d" width="%d" height="%d" fill="#FFE2B0" opacity=".5"/>' % (x, y_, w_, h_, c_, x, y_, 8, h_)
        for r_ in range(int(h_ / 16)):
            for k in range(int(w_ / 14)):
                o += '<rect x="%d" y="%d" width="7" height="8" fill="%s"/>' % (x + 12 + k * 14, y_ + 8 + r_ * 16, R.choice([c_, '#B8988C', '#A88A80', '#EFD2AC']))
    return o

def pavers(y0, y1):
    o = '<rect y="%d" width="1280" height="%d" fill="#D9B48C"/>' % (y0, y1 - y0)
    y_ = y0; r_ = 0
    while y_ < y1:
        h_ = 12 + (y_ - y0) * .1; x_ = -40 + (r_ % 2) * 22
        while x_ < 1290:
            w_ = 44 + (y_ - y0) * .24
            o += '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="%s" stroke="#9A7656" stroke-width=".8"/>' % (x_, y_, w_ - 1.5, h_ - 1.2, R.choice(['#E2BE96', '#D5A880', '#C99878', '#E8CCA4', '#C98A70']))
            x_ += w_
        y_ += h_; r_ += 1
    return o

# ---- PHcmc: lớp chi tiết phố Sài Gòn (mật độ ngang R5Arrive). Random riêng HR để không đổi cảnh khác. ----
HR = random.Random(77)
HC_CSS = """<style>
@keyframes hcflag{0%,100%{transform:skewY(-5deg) scaleX(1)}50%{transform:skewY(6deg) scaleX(.9)}}
.hc-flag{animation:hcflag var(--t,2.6s) ease-in-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:left center}
@keyframes hcbunt{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
.hc-bunt{animation:hcbunt var(--t,3.4s) ease-in-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:top center}
@keyframes hcsteam{0%{transform:translate(0,0) scale(.6);opacity:0}30%{opacity:.6}100%{transform:translate(7px,-36px) scale(1.5);opacity:0}}
.hc-steam{animation:hcsteam var(--t,3.6s) ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
@keyframes hcpeck{0%,60%,100%{transform:rotate(0)}70%,85%{transform:rotate(22deg)}}
.hc-peck{animation:hcpeck var(--t,4s) ease-in-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:50% 100%}
@keyframes hcglint{0%,100%{opacity:.35}50%{opacity:1}}
.hc-glint{animation:hcglint var(--t,5s) ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes hcwire{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.hc-dangle{animation:hcwire 3.8s ease-in-out infinite;transform-box:fill-box;transform-origin:top center}
@media (prefers-reduced-motion:reduce){.hc-flag,.hc-bunt,.hc-steam,.hc-peck,.hc-glint,.hc-dangle{animation:none}.hc-steam{opacity:0}}
</style>"""
HC_SKY = [(-10, 80, 230), (70, 60, 186), (136, 90, 262), (232, 64, 170), (306, 96, 214), (884, 92, 226), (982, 66, 184), (1054, 100, 278), (1160, 66, 196), (1224, 80, 240)]

def hc_far():
    """Lớp nhà cao xa mờ trong khói bụi + tháp kính thon (không hiệu, không logo)."""
    o = ''
    for x, w_, h_ in ((20, 60, 150), (100, 46, 190), (200, 56, 140), (290, 64, 176), (390, 46, 124), (850, 54, 150), (920, 50, 210), (1000, 46, 160), (1140, 54, 208), (1210, 60, 150)):
        y_ = 372 - h_
        o += '<rect x="%d" y="%d" width="%d" height="%d" fill="#E4BCA6" opacity=".6"/>' % (x, y_, w_, h_)
        for r_ in range(int(h_ / 14)):
            o += '<path d="M%d %dh%d" stroke="#D2A28C" stroke-width="1.6" opacity=".6"/>' % (x + 4, y_ + 8 + r_ * 14, w_ - 8)
    tx = 806
    o += '<path d="M%d 372L%d 150L%d 112L%d 150L%d 372Z" fill="#C9A090" opacity=".85"/><path d="M%d 372L%d 150L%d 112V372Z" fill="#B88A7C" opacity=".6"/><path d="M%d 112V70" stroke="#8A6A60" stroke-width="2.2"/>' % (tx - 20, tx - 12, tx, tx + 12, tx + 20, tx, tx, tx, tx)
    for k in range(34):
        o += '<path d="M%.1f %.1fh%.1f" stroke="#FFE9C4" stroke-width="1.2" opacity=".45"/>' % (tx - 18 + k * .3, 160 + k * 6.2, 36 - k * .6)
    o += '<path d="M%d 150L%d 372" stroke="#FFF3D6" stroke-width="2" opacity=".5"/>' % (tx - 8, tx - 15)
    return o

def hc_roof():
    """Chi tiết nhà cao: bồn nước mái, ăng-ten, máy lạnh, biển quảng cáo trống chữ, cửa sổ sáng nắng, đồ phơi."""
    o = ''
    for i, (x, w_, h_) in enumerate(HC_SKY):
        y_ = 372 - h_
        if i % 2 == 0:
            o += '<rect x="%d" y="%d" width="16" height="12" rx="3" fill="#6E7C86" stroke="%s" stroke-width="1"/><path d="M%d %dl8 -7l8 7Z" fill="#8A5A44" stroke="%s" stroke-width="1"/><path d="M%d %dv8M%d %dv8" stroke="%s"/>' % (x + 8, y_ - 12, INK, x + 8, y_ - 12, INK, x + 12, y_, x + 20, y_, INK)
        else:
            o += '<path d="M%d %dV%d" stroke="#5A4A44" stroke-width="2"/><path d="M%d %dh16M%d %dh10" stroke="#5A4A44" stroke-width="1.6"/><circle cx="%d" cy="%d" r="2.4" fill="#E2483E" class="hc-glint" style="--d:-%.1fs"/>' % (x + w_ // 2, y_, y_ - 26, x + w_ // 2 - 8, y_ - 20, x + w_ // 2 - 5, y_ - 12, x + w_ // 2, y_ - 27, HR.uniform(0, 4))
        if i % 3 == 1:
            o += '<rect x="%d" y="%d" width="14" height="%d" fill="%s" stroke="%s" stroke-width="1"/><path d="M%d %dh8M%d %dh8M%d %dh8" stroke="#fff" stroke-width="2" opacity=".75"/>' % (x + w_ - 20, y_ + 24, min(70, h_ // 3), HR.choice(['#2F7EA8', '#E2483E', '#2FA860', '#F2B53C']), INK, x + w_ - 17, y_ + 34, x + w_ - 17, y_ + 44, x + w_ - 17, y_ + 54)
        for _ in range(int(h_ / 24)):
            wx = x + 12 + HR.randint(0, max(0, int(w_ / 14) - 1)) * 14; wy = y_ + 8 + HR.randint(0, max(0, int(h_ / 16) - 2)) * 16
            if HR.random() < .5:
                o += '<rect x="%d" y="%d" width="10" height="6" rx="1" fill="#D8D4C8" stroke="#6E6A60" stroke-width=".8"/><circle cx="%d" cy="%d" r="2" fill="#6E6A60"/>' % (wx - 1, wy + 8, wx + 4, wy + 11)
            else:
                o += '<rect x="%d" y="%d" width="7" height="8" fill="#FFE9A8" opacity=".85"/>' % (wx, wy)
        if i % 2 == 0 and w_ > 62:
            lx = x + 10; ly = y_ + int(h_ * .5)
            o += '<path d="M%d %dh%d" stroke="#5A4A44" stroke-width="1"/>' % (lx, ly, w_ - 22) + ''.join('<rect x="%d" y="%d" width="6" height="%d" fill="%s"/>' % (lx + 3 + k * 9, ly, HR.randint(7, 12), HR.choice(['#F268A6', '#F4F0E4', '#2FB8C6', '#F2C25A'])) for k in range(int((w_ - 22) / 9)))
    return o

def hc_umbrella(x, y, w_, c1, c2, pole=44):
    """Dù che nắng hình nón thấp, múi sọc, viền răng cưa."""
    o = '<path d="M%d %dV%d" stroke="#5A3A24" stroke-width="2.4"/>' % (x, y + pole, y - 6)
    n = 6; ax, ay = x, y - w_ * .42
    for k in range(n):
        a0 = x - w_ + 2 * w_ * k / n; a1 = x - w_ + 2 * w_ * (k + 1) / n
        o += '<path d="M%.1f %.1fL%.1f %.1fL%.1f %.1fQ%.1f %.1f %.1f %.1fZ" fill="%s" stroke="%s" stroke-width="1"/>' % (a0, y, ax, ay, a1, y, (a0 + a1) / 2, y + 7, a0, y, c1 if k % 2 == 0 else c2, INK)
    return o + '<circle cx="%d" cy="%.1f" r="2.2" fill="#5A3A24"/>' % (ax, ay - 1)

def hc_cart(x, y, kind, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="1" rx="38" ry="4" fill="#120A08" opacity=".4"/>' % (x, y, s)
    if kind == 'banhmi':
        o += '<rect x="-28" y="-26" width="50" height="15" fill="#C7322E" stroke="%s" stroke-width="1.2"/><rect x="-28" y="-56" width="50" height="30" rx="2" fill="#CFEAEC" opacity=".75" stroke="%s" stroke-width="1.2"/>' % (INK, INK)
        for k in range(5): o += '<ellipse cx="%d" cy="%d" rx="8" ry="3.4" fill="#E2B060" stroke="#8A5A24" stroke-width=".8" transform="rotate(%d %d %d)"/>' % (-18 + k * 9, -34 - (k % 2) * 9, -12 + k * 6, -18 + k * 9, -34)
        o += '<path d="M-24 -52L-16 -30" stroke="#fff" stroke-width="4" opacity=".5"/>' + hc_umbrella(-3, -98, 34, '#F4F0E4', '#E2483E')
    elif kind == 'fruit':
        o += '<rect x="-30" y="-24" width="62" height="8" fill="#8F5A2E" stroke="%s"/><path d="M-26 -16v12M26 -16v12" stroke="#4E2A16" stroke-width="3"/>' % INK
        for k, c_ in enumerate(['#F2B53C', '#E2483E', '#7FD45A', '#F2884A', '#E86AA8', '#3CA45C']):
            bx = -24 + k * 10
            o += '<path d="M%d -24a6 4 0 0 1 12 0Z" fill="#B88A52" stroke="#6B4322" stroke-width=".8"/>' % bx + ''.join('<circle cx="%d" cy="%d" r="3.6" fill="%s" stroke="#4A2A12" stroke-width=".5"/>' % (bx + 2 + j * 4, -27 - (j % 2) * 3, c_) for j in range(3))
        o += hc_umbrella(0, -92, 36, '#F2C25A', '#2FA860', 70)
    else:
        o += '<rect x="-26" y="-30" width="48" height="19" rx="2" fill="#2E7AB0" stroke="%s" stroke-width="1.2"/><path d="M-26 -22H22" stroke="#fff" stroke-width="1.6" opacity=".6"/>' % INK
        for k in range(6): o += '<circle cx="%d" cy="%d" r="5.6" fill="%s" stroke="#1F4A2A" stroke-width=".8"/>' % (-18 + k * 8, -35 - (k % 2) * 3, ['#5FB04A', '#8FCB54'][k % 2])
        o += '<circle cx="14" cy="-38" r="3.2" fill="#E8604C"/><circle cx="19" cy="-36" r="2.8" fill="#fff" stroke="#8A8272" stroke-width=".6"/>' + hc_umbrella(-2, -94, 38, '#2FB8C6', '#F4F0E4', 66)
    for wx in (-18, 14): o += '<circle cx="%d" cy="-7" r="7" fill="#1E1A1E"/><circle cx="%d" cy="-7" r="3" fill="#B9B4AA"/>' % (wx, wx)
    return o + '</g>'

def hc_steam(x, y, n=3):
    return ''.join('<circle class="hc-steam" style="--d:-%.1fs;--t:%.1fs" cx="%d" cy="%d" r="5" fill="#fff" opacity=".5"/>' % (k * 1.2, 3.6 + k * .4, x + (k - 1) * 5, y) for k in range(n))

def hc_stools(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="1" rx="34" ry="4" fill="#120A08" opacity=".3"/>' % (x, y, s)
    o += '<path d="M0 -4V-22" stroke="#4E4A52" stroke-width="3"/><ellipse cx="0" cy="-23" rx="16" ry="4.6" fill="#E8DDC0" stroke="%s" stroke-width="1"/>' % INK
    o += '<ellipse cx="-6" cy="-26" rx="3.6" ry="1.8" fill="#6B3E1E"/><rect x="-7" y="-29" width="3" height="3" fill="#fff"/><rect x="5" y="-31" width="2.6" height="7" fill="#F4F0E4" stroke="#8A8272" stroke-width=".5"/>'
    for sx, c_ in ((-26, '#2E5AA8'), (26, '#E2483E'), (0, '#2FA860')):
        yy = 0 if sx else 6
        o += '<path d="M%d %dh12l-2 -12h-8Z" fill="%s" stroke="%s" stroke-width="1"/><ellipse cx="%d" cy="%d" rx="6.4" ry="2" fill="%s" stroke="%s" stroke-width=".8"/>' % (sx - 6, yy - 2, c_, INK, sx, yy - 14, c_, INK)
    return o + '</g>'

def hc_pigeon(x, y, flip=False, peck=False, d=0):
    o = '<g transform="translate(%d %d) scale(%d 1)">' % (x, y, -1 if flip else 1)
    o += '<ellipse cy="1" rx="8" ry="1.6" fill="#120A08" opacity=".3"/><path d="M-1 -4V0M3 -4V0" stroke="#C86A6A" stroke-width="1.1"/>'
    body = '<ellipse cx="0" cy="-8" rx="9" ry="5.4" fill="#9AA0AE" stroke="#3E4250" stroke-width=".8"/><path d="M-9 -9L-15 -5L-8 -5Z" fill="#7A8090"/><path d="M-4 -9q5 -3 9 1q-4 4 -9 -1Z" fill="#7C8294"/><ellipse cx="3.4" cy="-10.6" rx="3.6" ry="2.6" fill="#7FB0A8"/>'
    head = '<circle cx="8" cy="-12.6" r="3.4" fill="#A6ACBA" stroke="#3E4250" stroke-width=".7"/><circle cx="9" cy="-13" r=".9" fill="#E8742C"/><path d="M11 -12.4l3 .8l-3 .6Z" fill="#E8B060"/>'
    o += body + ('<g class="hc-peck" style="--d:-%.1fs">%s</g>' % (d, head) if peck else head)
    return o + '</g>'

def hc_flag(x, y, h=30, s=1):
    d_ = HR.uniform(0, 2.4)
    o = '<path d="M%d %dV%d" stroke="#C9C4BA" stroke-width="2" stroke-linecap="round"/>' % (x, y, y - h * s)
    fw, fh = 28 * s, 19 * s; fy = y - h * s
    o += '<g class="hc-flag" style="--d:-%.1fs"><rect x="%d" y="%.1f" width="%.1f" height="%.1f" fill="#D9261C" stroke="#7A1410" stroke-width=".8"/><path d="M%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fZ" fill="#F7D21A"/></g>' % (d_, x, fy, fw, fh, *star(x + fw / 2, fy + fh / 2, 6.2 * s))
    return o

def star(cx, cy, r):
    pts = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5; rr = r if k % 2 == 0 else r * .42
        pts += [cx + math.cos(a) * rr, cy + math.sin(a) * rr]
    return pts

def hc_bunting(x0, y0, x1, y1, sag=24, n=16, cols=('#E2483E', '#F7D21A', '#2FA860', '#2E7AB0', '#F268A6')):
    """Dây cờ tam giác treo võng giữa hai cột."""
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2 + sag * 2
    o = '<path d="M%d %dQ%.0f %.0f %d %d" stroke="#3A2A20" stroke-width="1.3" fill="none"/>' % (x0, y0, mx, my, x1, y1)
    for k in range(n):
        t = (k + .5) / n
        px = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t * t * x1; py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t * t * y1
        o += '<path d="M%.1f %.1fh10l-5 13Z" fill="%s" stroke="#4A2A12" stroke-width=".6" class="hc-bunt" style="--d:-%.1fs;--t:%.1fs"/>' % (px - 5, py, cols[k % len(cols)], HR.uniform(0, 3), HR.uniform(2.8, 4))
    return o

def hc_banyan(x, b, s=1, lamps=False):
    """Cây đa phố: thân to rễ bạnh, tán rộng, rễ phụ rủ xuống, tuỳ chọn dây đèn."""
    o = '<ellipse cx="%d" cy="%d" rx="%d" ry="6" fill="#120A08" opacity=".28"/>' % (x + 10 * s, b + 1, 48 * s)
    o += '<path d="M%.0f %dQ%.0f %.0f %.0f %.0fL%.0f %.0fQ%.0f %.0f %.0f %dQ%.0f %.0f %.0f %dQ%.0f %.0f %.0f %dZ" fill="#8A6C4E" stroke="%s" stroke-width="1.5"/>' % (x - 32 * s, b, x - 14 * s, b - 14 * s, x - 11 * s, b - 56 * s, x + 11 * s, b - 56 * s, x + 14 * s, b - 14 * s, x + 34 * s, b, x + 8 * s, b - 8 * s, x, b - 3, x - 8 * s, b - 8 * s, x - 32 * s, b, INK)
    o += '<path d="M%.0f %dQ%.0f %.0f %.0f %.0fL%.0f %.0fQ%.0f %.0f %.0f %dZ" fill="#6B5038" opacity=".55"/>' % (x + 4 * s, b - 2, x + 8 * s, b - 20 * s, x + 6 * s, b - 56 * s, x + 11 * s, b - 56 * s, x + 14 * s, b - 14 * s, x + 34 * s, b)
    for k in range(9):
        yy = b - 8 * s - k * 6 * s
        o += '<path d="M%.0f %.0fq%.1f %.1f %.1f %.1f" stroke="#4E3A28" stroke-width="1" fill="none" opacity=".7"/>' % (x - 9 * s + (k * 5 % 14) * s, yy, 2 * s, -4 * s, 1.5 * s, -9 * s)
    cy0 = b - 92 * s
    can = ''
    pal = ['#17563A', '#1F6A42', '#2C8A50', '#3CA45C', '#5DB85A']
    for _ in range(int(110 * s ** .6)):
        a, r_ = HR.uniform(0, 6.28), HR.uniform(0, 1) ** .6
        px, py = x + math.cos(a) * r_ * 78 * s, cy0 + math.sin(a) * r_ * 40 * s
        can += '<circle cx="%.0f" cy="%.0f" r="%.1f" fill="%s"/>' % (px, py, HR.uniform(8, 15) * s, pal[min(4, max(0, int(2.2 - (py - cy0) / (20 * s) + HR.uniform(-1, 1.2))))])
    for _ in range(40):
        a, r_ = HR.uniform(0, 6.28), HR.uniform(.1, 1)
        can += '<ellipse cx="%.0f" cy="%.0f" rx="5" ry="2.4" fill="#9BE070" opacity=".8" transform="rotate(%d %.0f %.0f)"/>' % (x + math.cos(a) * r_ * 78 * s - 4, cy0 - 12 * s + math.sin(a) * r_ * 28 * s, HR.randint(-40, 40), x, cy0)
    o += V.sway(can, x, int(cy0 + 20 * s), 6, x % 4)
    for k in range(11):
        rx = x + (-70 + k * 14) * s + HR.uniform(-3, 3); y0 = cy0 + 14 * s + 10 * s * math.sin(k * .9)
        L = HR.choice((22, 30, 40, 52)) * s if k not in (3, 7) else (b - 4 - y0)
        st = '<path d="M%.0f %.0fq%.1f %.1f %.1f %.1f" stroke="#6B4A32" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (rx, y0, HR.uniform(-4, 4), L * .5, HR.uniform(-3, 3), L, 1.3 if L < b - y0 - 5 else 2.4)
        o += V.sway(st, int(rx), int(y0), 3.4 + (k % 4) * .5, k * .7)
    if lamps:
        for lx0, lx1, ly in ((-66, -8, 8), (6, 70, 4)):
            ax, ay, bx, by = x + lx0 * s, cy0 + ly * s + 4, x + lx1 * s, cy0 + (ly + 4) * s + 4
            o += '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0f" stroke="#3A2A20" stroke-width="1.1" fill="none"/>' % (ax, ay, (ax + bx) / 2, max(ay, by) + 22 * s, bx, by)
            for j in range(1, 8):
                t = j / 8; px = (1 - t) ** 2 * ax + 2 * (1 - t) * t * (ax + bx) / 2 + t * t * bx; py = (1 - t) ** 2 * ay + 2 * (1 - t) * t * (max(ay, by) + 22 * s) + t * t * by
                o += '<circle cx="%.0f" cy="%.0f" r="9" fill="url(#hg)" opacity=".7"/><circle class="hc-glint" style="--d:-%.1fs;--t:%.1fs" cx="%.0f" cy="%.0f" r="2.6" fill="#FFE9A0" stroke="#7A5A1E" stroke-width=".6"/>' % (px, py + 2, HR.uniform(0, 4), HR.uniform(3, 6), px, py + 3)
    return o

def hc_pole(x, top, base):
    """Cột điện bê tông, xà ngang, sứ cách điện, biến thế, hộp công tơ."""
    o = '<path d="M%d %dL%.1f %dL%.1f %dL%d %dZ" fill="#A8A296" stroke="%s" stroke-width="1.2"/><path d="M%d %dL%d %d" stroke="#7A7468" stroke-width="2"/>' % (x - 4, base, x - 2.5, top, x + 2.5, top, x + 4, base, INK, x + 1, base, x + 1, top)
    for dy, w_ in ((0, 24), (14, 18)):
        o += '<rect x="%.1f" y="%d" width="%d" height="3.4" fill="#6A5A48" stroke="%s" stroke-width=".8"/>' % (x - w_ / 2, top + dy, w_, INK)
        for ix in (-w_ / 2 + 2, 0, w_ / 2 - 2): o += '<rect x="%.1f" y="%d" width="3" height="4" rx="1" fill="#E8E2D2" stroke="#6A6258" stroke-width=".6"/>' % (x + ix - 1.5, top + dy - 4)
    o += '<rect x="%d" y="%d" width="13" height="19" rx="3" fill="#7C8890" stroke="%s" stroke-width="1"/><rect x="%d" y="%d" width="15" height="3" fill="#5A646C"/>' % (x + 4, top + 22, INK, x + 3, top + 22)
    o += '<rect x="%d" y="%d" width="10" height="14" fill="#2E7AB0" stroke="%s" stroke-width=".8"/><path d="M%d %dh6M%d %dh6" stroke="#fff" stroke-width="1.6"/>' % (x - 14, top + 46, INK, x - 12, top + 52, x - 12, top + 57)
    return o

def hc_wire(x0, y0, x1, y1, sag=16, w_=1.3, op=.85):
    return '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0f" stroke="#24181C" stroke-width="%.1f" fill="none" opacity="%.2f"/>' % (x0, y0, (x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1, w_, op)

def hc_tangle(x, y, n=7):
    o = ''
    for _ in range(n):
        o += '<ellipse cx="%.0f" cy="%.0f" rx="%.1f" ry="%.1f" fill="none" stroke="#24181C" stroke-width="1.1" opacity=".8" transform="rotate(%d %.0f %.0f)"/>' % (x + HR.uniform(-9, 9), y + HR.uniform(-4, 6), HR.uniform(8, 20), HR.uniform(3, 7), HR.randint(-40, 40), x, y)
    return o

def hc_wires():
    """Dây điện chằng chịt, hai cột bê tông, giày vắt dây, cáp thòng."""
    o = ''
    for ax, ay in ((205, 262), (1005, 250)): o += hc_pole(ax, ay, 504)
    for k, (dy, sg) in enumerate(((4, 14), (10, 18), (16, 22), (22, 26))):
        o += hc_wire(205, 262 + dy, -12, 292 + k * 10, sg) + hc_wire(205, 262 + dy, 394, 336 + k * 2, 18 + k * 3)
        o += hc_wire(1005, 250 + dy, 1292, 286 + k * 10, sg) + hc_wire(1005, 250 + dy, 892, 336 + k * 2, 18 + k * 3)
    o += hc_wire(205, 264, 70, 226, 12, 1) + hc_wire(70, 226, -12, 240, 8, 1)
    o += hc_tangle(205, 292) + hc_tangle(1005, 280) + hc_tangle(110, 276, 4) + hc_tangle(1140, 276, 4)
    o += '<path d="M150 290q-4 20 -10 30q6 6 12 0q4 -12 -2 -30" fill="none" stroke="#24181C" stroke-width="1.2"/>'
    o += '<g class="hc-dangle"><path d="M1102 281v22" stroke="#24181C" stroke-width="1"/><path d="M1096 302q6 -3 12 0l3 8h-18Z" fill="#E8E2D2" stroke="%s" stroke-width=".9"/><path d="M1111 302q6 -3 12 0l3 8h-18Z" fill="#E8604C" stroke="%s" stroke-width=".9"/></g>' % (INK, INK)
    return o

def hc_market_detail():
    """Chi tiết dãy chợ hai cánh: biển cửa hàng chung chung, hàng treo trong vòm, cờ, dây cờ, đèn lồng, chim."""
    o = ''
    words = ['ÁO DÀI', 'CÀ PHÊ', 'NÓN LÁ', 'PHỞ', 'QUÀ', 'TRÁI CÂY', 'TRÀ', 'BÁNH MÌ']
    cols = ['#2A1A14', '#7A2A1A', '#1F4A3A', '#2E3A5A']
    for x0, off in ((-20, 0), (856, 3)):
        for k in range(int(444 / 74)):
            ax = x0 + 18 + k * 74
            if ax < 0 or ax + 60 > 1280: continue
            o += '<rect x="%d" y="380" width="56" height="16" rx="2" fill="%s" stroke="#D1A24A" stroke-width="1.2"/><text x="%d" y="392" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="9.5" fill="#F7D96A">%s</text>' % (ax + 2, cols[(k + off) % 4], ax + 30, words[(k + off) % 8])
            for j in range(3):
                o += '<path d="M%d 438v%d" stroke="#3A2A20" stroke-width=".9"/><path d="M%d %dh8l-2 12h-4Z" fill="%s" stroke="%s" stroke-width=".6"/>' % (ax + 10 + j * 15, 4 + j % 2 * 3, ax + 6 + j * 15, 442 + j % 2 * 3, HR.choice(['#E2483E', '#2FB8C6', '#F268A6', '#F7D21A']), INK)
            o += '<path d="M%d 404v8" stroke="#3A2413"/><ellipse cx="%d" cy="418" rx="5" ry="6.4" fill="#E2483E" stroke="#5A2A10" stroke-width=".9"/><path d="M%d 424v5" stroke="#E9B44C" stroke-width="1.4"/>' % (ax + 30, ax + 30, ax + 30)
    for x in (30, 150, 270, 1010, 1130, 1250):
        o += '<path d="M%d 366h14l-2 9h-10Z" fill="#B9694C" stroke="%s" stroke-width=".9"/>' % (x, INK) + ''.join('<circle cx="%d" cy="%d" r="2.6" fill="%s"/>' % (x + HR.randint(-2, 16), 364 - HR.randint(0, 8), HR.choice(['#E8418F', '#F268A6', '#F7D21A', '#2FA860'])) for _ in range(9))
    for x in (36, 192, 300, 940, 1110, 1240): o += hc_flag(x, 348, 30)
    o += hc_bunting(392, 322, -6, 334, 26, 17) + hc_bunting(892, 322, 1286, 334, 26, 17)
    for x, y, f in ((570, 171, False), (600, 171, True), (700, 171, False), (560, 130, False)):
        o += hc_pigeon(x, y, f, peck=(x == 570), d=HR.uniform(0, 4))
    return o

def hc_cargo(x, y, s, flip, kind, shirt, helmet, body='#C7322E', pants='#3E5A8A', back=None):
    """Xe máy chở hàng: thùng giao hàng, chậu hoa, chồng thùng carton hoặc rổ."""
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s)
    if kind == 'box':
        o += '<rect x="-72" y="-96" width="36" height="34" rx="3" fill="#2FA860" stroke="%s" stroke-width="1.4"/><path d="M-72 -86h36" stroke="#1F7A44" stroke-width="2"/><rect x="-68" y="-62" width="28" height="3" fill="#3A3A3A"/>' % INK
    elif kind == 'flower':
        for k in range(4):
            bx = -70 + k * 9
            o += '<path d="M%d -64h8l-1 12h-6Z" fill="#6A8AB0" stroke="%s" stroke-width=".8"/>' % (bx, INK) + ''.join('<circle cx="%.1f" cy="%.1f" r="4.4" fill="%s"/>' % (bx + 4 + HR.uniform(-4, 4), -70 - j * 5 - HR.uniform(0, 4), HR.choice(['#E8418F', '#F7D21A', '#E2483E', '#fff', '#F268A6'])) for j in range(5)) + '<path d="M%d -66v-18" stroke="#2F7A3A" stroke-width="1.6"/>' % (bx + 4)
    elif kind == 'cartons':
        for j, (yy, ww) in enumerate(((-60, 38), (-80, 34), (-98, 28))):
            o += '<rect x="%d" y="%d" width="%d" height="18" fill="%s" stroke="%s" stroke-width="1.1"/><path d="M-55 %dv18" stroke="#8A6A3A" stroke-width="1.2"/>' % (-74 + (38 - ww) // 2, yy, ww, ['#C9A464', '#D9B474', '#B88A52'][j], INK, yy)
        o += '<path d="M-76 -58L-34 -100" stroke="#E2483E" stroke-width="1.6"/>'
    else:
        for j in range(3):
            o += '<ellipse cx="-56" cy="%d" rx="15" ry="6" fill="#D9B060" stroke="#6B4322" stroke-width="1"/>' % (-62 - j * 9)
    o += moto(0, 0, 1, False, shirt, helmet, body, pants, back) + '</g>'
    return o

def hc_cyclo(x, y, s=1, flip=False):
    """Xích lô: khách ngồi trước dưới mui, người đạp phía sau."""
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)"><ellipse cy="2" rx="62" ry="4.4" fill="#120A08" opacity=".35"/>' % (x, y, -s if flip else s, s)
    o += '<circle cx="62" cy="-17" r="17" fill="none" stroke="#1E1A1E" stroke-width="3"/><circle cx="62" cy="-17" r="2.6" fill="#2A2428"/><circle cx="-34" cy="-14" r="14" fill="none" stroke="#1E1A1E" stroke-width="3"/><circle cx="-34" cy="-14" r="2.4" fill="#2A2428"/>'
    for k in range(6): o += '<path d="M62 -17l%.1f %.1f" stroke="#7A7A80" stroke-width=".8"/>' % (17 * math.cos(k * 1.05), 17 * math.sin(k * 1.05))
    o += '<path d="M-44 -22Q-48 -46 -30 -46H-6V-22Q-24 -16 -44 -22Z" fill="#E2483E" stroke="%s" stroke-width="1.4"/><path d="M-44 -46Q-36 -70 -14 -62L-6 -46Z" fill="#F2C25A" stroke="%s" stroke-width="1.2"/>' % (INK, INK)
    o += '<path d="M-32 -48a8 8 0 1 1 16 0Z" fill="#E8B98E" stroke="%s" stroke-width=".8"/><circle cx="-24" cy="-60" r="6" fill="#E8B98E" stroke="%s" stroke-width=".8"/><path d="M-32 -64h16l-8 -8Z" fill="#E8DDB0" stroke="#8A7A4A" stroke-width=".8"/>' % (INK, INK)
    o += '<path d="M-6 -20H44L62 -17M44 -20L50 -52M50 -52H66" stroke="#3A3A44" stroke-width="3" fill="none" stroke-linejoin="round"/>'
    o += '<path d="M38 -50Q48 -64 40 -78Q34 -84 28 -78Q24 -64 34 -50Z" fill="#F7F2E4" stroke="%s" stroke-width="1"/><circle cx="34" cy="-90" r="6.4" fill="#E8B98E" stroke="%s" stroke-width=".8"/><path d="M26 -88h16l-8 -12Z" fill="#E8DDB0" stroke="#8A7A4A" stroke-width=".8"/>' % (INK, INK)
    return o + '</g>'

def hc_fx_road():
    """Nắng chói trên mặt đường, vệt lốp, nắp cống."""
    o = '<ellipse cx="350" cy="560" rx="260" ry="26" fill="#FFE9B0" opacity=".16"/><ellipse cx="1000" cy="610" rx="300" ry="30" fill="#FFE9B0" opacity=".12"/><ellipse cx="660" cy="530" rx="180" ry="8" fill="#FFF3D0" opacity=".18"/>'
    for x, y, w_ in ((60, 610, 120), (400, 586, 160), (860, 598, 140), (1150, 560, 120)):
        o += '<ellipse cx="%d" cy="%d" rx="%d" ry="3" fill="#2E2A28" opacity=".22"/>' % (x, y, w_)
    for x, y in ((220, 540), (860, 526)):
        o += '<ellipse cx="%d" cy="%d" rx="16" ry="4.4" fill="#4A4440" stroke="#2A2420"/><path d="M%d %dh28M%d %dh24" stroke="#2A2420" stroke-width="1"/>' % (x, y, x - 14, y - 1, x - 12, y + 1)
    return o

def hc_sun_rays():
    """Tia nắng chiều xiên từ mặt trời, rất nhạt; hạt bụi lấp lánh."""
    o = ''
    for a0, a1, op in ((.10, .26, .09), (.34, .44, .07), (.52, .70, .08), (.78, .88, .06)):
        o += '<path d="M180 210L%.0f %.0fL%.0f %.0fZ" fill="url(#hcray)" opacity="%.2f"/>' % (180 + 1400 * math.cos(a0), 210 + 1400 * math.sin(a0), 180 + 1400 * math.cos(a1), 210 + 1400 * math.sin(a1), op * 5)
    for _ in range(26):
        o += '<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="#FFF3C8"/>' % (HR.uniform(3, 7), HR.uniform(0, 5), HR.randint(160, 1100), HR.randint(150, 500), HR.uniform(1, 2.2))
    return o

def hc_sidewalk_back():
    """Vỉa hè trước chợ: xe đẩy, quán ghế nhựa, xe đậu, khách mua, người bán rong."""
    o = ''
    for x in (38, 60): o += moto(x, 503, .4, False, '#F4F0E4', '#E2483E', ['#2E5AA8', '#C7322E'][x % 2])
    o += hc_cart(540, 502, 'banhmi', .84) + hc_steam(550, 458)
    o += hc_cart(732, 502, 'fruit', .84) + hc_cart(1206, 502, 'drink', .8) + V.non(1252, 500, '#2FB8C6', True)
    o += hc_stools(292, 500, .78) + hc_steam(300, 470, 2)
    o += G.walker(560, 500, '#E2483E', s=.78) + G.walker(772, 500, '#F2C25A', '#7A4A2A', s=.8)
    for x in (676, 700, 724): o += moto(x, 504, .36, True, '#F4F0E4', '#2E5AA8', ['#C7322E', '#2E5AA8', '#E8E2D2'][x % 3])
    return o

def hc_foreground():
    """Vỉa hè gần: ô lưới gốc cây, lá/cánh hoa rụng, xe đẩy có khói, chim bồ câu, chậu cây, bóng cây dài."""
    o = ''
    for x, y in ((70, 694), (1212, 702)):
        o += '<ellipse cx="%d" cy="%d" rx="32" ry="8" fill="#5A4A3A" stroke="%s" stroke-width="1.2"/><ellipse cx="%d" cy="%d" rx="20" ry="4.6" fill="#2E2620"/>' % (x, y + 2, INK, x, y + 2) + ''.join('<path d="M%d %dL%d %d" stroke="#8A7A66" stroke-width="1"/>' % (x - 28 + k * 7, y - 4, x - 24 + k * 7, y + 8) for k in range(9))
    o += '<path d="M90 698L250 688L330 712L112 716Z" fill="#7A5A44" opacity=".28"/><path d="M1190 706L1280 690V716L1200 716Z" fill="#7A5A44" opacity=".28"/>'
    for x, y, c_ in ((190, 668, '#E8604C'), (330, 704, '#F7D21A'), (780, 676, '#8A5A2E'), (900, 706, '#E8604C'), (1020, 668, '#F268A6'), (460, 712, '#E88A4C')):
        o += '<ellipse cx="%d" cy="%d" rx="4.4" ry="1.8" fill="%s" opacity=".85" transform="rotate(%d %d %d)"/>' % (x, y, c_, HR.randint(-50, 50), x, y)
    o += hc_cart(420, 708, 'banhmi', 1.0) + hc_steam(430, 658, 3)
    o += hc_pigeon(780, 692, False, True, 1) + hc_pigeon(808, 700, True) + hc_pigeon(520, 690, True, True, 2.4) + hc_pigeon(548, 702, False)
    o += hc_cart(960, 712, 'fruit', 1.0)
    for x in (1140, 150):
        o += '<path d="M%d 690h26l-4 22h-18Z" fill="#B9694C" stroke="%s" stroke-width="1.2"/>' % (x - 13, INK) + G.palm(x, 692, .6)
    return o

def hc_traffic_extra():
    """Làn giữa tĩnh, xe giao hàng, nhóm xe chạy làn gần (đi sang phải) và xích lô."""
    o = '<g class="ride" style="--t:36s;--dx:1760px;--d:-14s">'
    items = [('m', '#F4F0E4', '#2E5AA8', '#C7322E'), ('cargo', 'box'), ('m', '#F268A6', '#F4F0E4', '#2E5AA8'), ('cyclo',), ('m', '#2FB8C6', '#1E1A1E', '#E8E2D2'), ('cargo', 'flower'), ('m', '#7A4FA8', '#F2C25A', '#C7322E'), ('cargo', 'cartons'), ('m', '#F2C25A', '#2FA860', '#2E5AA8'), ('m', '#F4F0E4', '#E2483E', '#E8A23C')]
    x_ = -2000
    for i, it in enumerate(items):
        if it[0] == 'm': o += moto(x_, 612, .8, False, it[1], it[2], it[3], '#3E5A8A', ('#F268A6', '#F4F0E4') if i % 3 == 0 else None)
        elif it[0] == 'cyclo': o += hc_cyclo(x_, 612, .8)
        else: o += hc_cargo(x_, 612, .82, False, it[1], '#2FA860' if it[1] == 'box' else '#F4F0E4', '#2FA860' if it[1] == 'box' else '#2E5AA8', '#C7322E')
        x_ += 150
    o += '</g>'
    o += moto(120, 604, .76, True, '#2FB8C6', '#F4F0E4', '#C7322E') + hc_cargo(250, 606, .76, True, 'box', '#2FA860', '#2FA860', '#E8E2D2') + moto(520, 604, .76, True, '#F268A6', '#2E5AA8', '#E8E2D2', back=('#F2C25A', '#E2483E'))
    o += hc_cargo(980, 604, .76, True, 'flower', '#F4F0E4', '#E2483E', '#2E5AA8') + moto(1130, 606, .76, True, '#F2C25A', '#1E1A1E', '#C7322E') + hc_cyclo(860, 604, .74, True)
    return o

def phcmc():
    d = lin('skS', [('0', '#3E7CC4'), ('.4', '#8FB8DC'), ('.72', '#FFD9A8'), ('1', '#FFC27A')]) + '<linearGradient id="hcray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0B8" stop-opacity=".8"/><stop offset="1" stop-color="#FFF0B8" stop-opacity="0"/></linearGradient>'
    o = '<rect width="1280" height="500" fill="url(#skS)"/>'
    o += '<circle cx="180" cy="210" r="150" fill="url(#hg)"/><circle cx="180" cy="210" r="40" fill="#FFF3C8"/>'
    for x, y, w_ in ((340, 110, 330), (930, 90, 380), (1190, 200, 240), (70, 90, 240), (800, 200, 180)): o += cloud(x, y, w_, '#FFF4E2', '#F7BC94')
    o += V.flock(40, 60, 12, .4) + hc_far() + skyline() + hc_roof()
    # cây phố xa
    for x, y, s_ in ((470, 356, .8), (820, 352, .8), (30, 400, .9), (1248, 400, .9)): o += '<g style="filter:brightness(.8)">' + V.tree(x, y, s_) + '</g>'
    o += benthanh() + hc_market_detail() + hc_banyan(312, 486, .85) + hc_banyan(1150, 486, .8, True)
    # vỉa hè trước chợ, bồn cây, người đi lại
    o += '<rect y="476" width="1280" height="26" fill="#C9B69A"/>'
    for k in range(40): o += '<path d="M%d 476l-14 26" stroke="#9A8A72" stroke-width="1"/>' % (k * 34)
    o += '<path d="M0 476H1280" stroke="%s" stroke-width="1.6"/><rect y="499" width="1280" height="6" fill="#A8A296" stroke="%s"/>' % (INK, INK)
    for x, s_ in ((240, .9), (1030, .9)):
        o += '<rect x="%d" y="470" width="44" height="22" fill="#A8704C" stroke="%s"/>' % (x - 22, INK) + G.palm(x, 470, s_)
    o += G.walker(330, 498, '#F268A6', s=.86) + G.walker(360, 496, '#F7F2E4', '#2E3A5A', s=.86) + V.non(476, 496, '#2F8F5B', True) + G.walker(808, 498, '#2FB8C6', s=.88) + G.walker(836, 494, '#F2C25A', '#7A4A2A', s=.84)
    o += G.bike(948, 498, '#E2483E') + G.stall(120, 466, '#2FB8C6') + V.non(96, 498, '#D9543C')
    o += hc_sidewalk_back() + hc_wires()
    # đường nhựa, nắng chiều, bóng đổ dài
    o += lin('road_', [('0', '#7E7670'), ('1', '#5E5854')]).join(['<defs>', '</defs>']) + '<rect y="505" width="1280" height="140" fill="url(#road_)"/>'
    for x in range(-30, 1290, 150): o += '<path d="M%d 574h76" stroke="#F4F0E4" stroke-width="4"/>' % x
    for k in range(11): o += '<path d="M%d 508L%d 642" stroke="#F4F0E4" stroke-width="13" opacity=".92"/>' % (560 + k * 18, 524 + k * 26)
    o += '<path d="M0 505H1280" stroke="#3A3430" stroke-width="2"/>'
    for k in range(120): o += '<circle cx="%d" cy="%d" r="%.1f" fill="#4A4440" opacity=".4"/>' % (R.randint(0, 1280), R.randint(508, 642), R.uniform(.6, 1.6))
    o += hc_fx_road()
    # dòng xe: hai làn, chạy liên tục
    far = moto(0, 0, .58, False, '#F4F0E4', '#E2483E', '#2E5AA8')
    o += '<g class="ride" style="--t:30s;--dx:-1660px">'
    # xe chiều về (làn xa, đi sang trái)
    x_ = 1400
    for k in range(9):
        o += moto(x_ + k * 92, 566, .62, True, ['#F4F0E4', '#2FB8C6', '#F2C25A', '#E86AA8'][k % 4], ['#2E5AA8', '#E2483E', '#F2C25A', '#1E1A1E'][k % 4], ['#C7322E', '#2E5AA8', '#E8E2D2'][k % 3])
    o += '</g>' + bus(1020, 566, .94, True)
    o += moto(760, 570, .62, True, '#F2C25A', '#2FA860', '#2E5AA8') + moto(860, 566, .62, True, '#F4F0E4', '#2E5AA8', '#C7322E', back=('#E86AA8', '#F7F2E4'))
    o += moto(690, 566, .6, True, '#E86AA8', '#F4F0E4', '#E8E2D2') + moto(330, 568, .62, True, '#2FB8C6', '#E2483E', '#C7322E')
    o += moto(420, 570, .62, True, '#F4F0E4', '#1E1A1E', '#2E5AA8', back=('#7FD45A', '#F2C25A')) + moto(250, 566, .6, True, '#F2C25A', '#2E5AA8', '#E8E2D2')
    o += hc_traffic_extra()
    # làn gần (đi sang phải), lớn hơn
    o += taxi(120, 632) + moto(330, 638, .92, False, '#F4F0E4', '#1E5AA8', '#C7322E', '#3E5A8A', ('#F268A6', '#F4F0E4')) + moto(470, 636, .94, False, '#E8E2D2', '#E2483E', '#E8A23C') + moto(620, 640, .96, False, '#2FB8C6', '#F7F2E4', '#2E5AA8', '#2A2A3A') + moto(760, 636, .92, False, '#F268A6', '#1E1A1E', '#C7322E')
    o += moto(900, 640, .96, False, '#F4F0E4', '#F2C25A', '#E8E2D2', '#3E5A8A', ('#2FB8C6', '#E2483E')) + moto(1040, 636, .94, False, '#7A4FA8', '#2E5AA8', '#C7322E')
    # vỉa hè gần: gạch hoa, thú cưng đứng trên vỉa hè
    o += pavers(644, 720) + '<path d="M0 644H1280" stroke="%s" stroke-width="2"/><rect y="640" width="1280" height="5" fill="#E8E2D2"/>' % INK
    o += hc_foreground() + hc_sun_rays()
    # cây sao hai bên khung: thân thẳng, tán cao
    o += sao(70, 692, 470, 1.1) + sao(1212, 700, 500, 1.2)
    for x, y, dx, dy, t, d_ in ((300, 90, 80, 400, 11, 0), (420, 40, 120, 500, 14, 5), (980, 70, -60, 460, 12, 3), (1090, 150, -90, 380, 10, 7), (240, 180, 60, 330, 9, 4), (1040, 30, 40, 520, 15, 9)):
        o += seed(x, y, dx, dy, t, d_, .8)
    o += G.walker(250, 700, '#F2C25A', '#2E3A5A', s=1.34) + G.walker(1090, 706, '#2FA860', '#3A2A20', s=1.34) + V.kitsu(620, 712, 104, 'ehappy', 'walk')
    for t_, x, y, dn in [('Tháp đồng hồ', 642, 18, True), ('Chợ Bến Thành', 456, 300, True), ('Cây sao', 120, 320, False), ('Xe buýt', 1046, 410, False), ('Xe máy', 640, 520, False)]:
        o += G.bubble(x, y, t_, dn)
    page('PHcmc', 'Kids World, TP. Hồ Chí Minh chiều nắng', 'Chợ Bến Thành chiều nắng vàng: tháp đồng hồ, dòng xe máy, xe buýt, hàng cây sao', d, o, 'TP. Hồ Chí Minh', HC_CSS)


# ---------- PCantho: chợ nổi lúc bình minh, nhìn từ kè Ninh Kiều ----------
NOSH = '<ellipse cy="1" rx="11" ry="3.4" fill="#0A4A30" opacity=".3"/>'

def melon(x, y, r=11):
    o = '<ellipse cx="%.0f" cy="%.0f" rx="%.1f" ry="%.1f" fill="%s" stroke="#123A22" stroke-width=".9"/>' % (x, y, r, r * .8, R.choice(['#2F7A3E', '#27703A', '#3A8A46']))
    for k in (-.5, 0, .5): o += '<path d="M%.1f %.1fQ%.1f %.1f %.1f %.1f" stroke="#123A22" stroke-width="1.2" fill="none"/>' % (x + k * r * .3, y - r * .76, x + k * r * 1.7, y, x + k * r * .3, y + r * .76)
    return o + '<path d="M%.1f %.1fq4 -3 8 -1" stroke="#A8DC8A" stroke-width="1.4" fill="none"/>' % (x - r * .5, y - r * .36)

def pine(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse rx="8" ry="11" fill="#E8A83C" stroke="#7A4A16"/><path d="M-7 -5L7 7M-8 2L3 11M-3 -10L8 1M7 -5L-7 7M8 2L-3 11M3 -10L-8 1" stroke="#9A6A1E" stroke-width=".9"/>' % (x, y, s)
    for a in (-34, -16, 0, 16, 34): o += '<path d="M0 -10L%.1f %.1f" stroke="#2F8A4A" stroke-width="3.4" stroke-linecap="round"/>' % (math.sin(math.radians(a)) * 14, -10 - math.cos(math.radians(a)) * 14)
    return o + '</g>'

def bananas(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)"><path d="M0 -16V30" stroke="#6E8A2E" stroke-width="3"/>' % (x, y, s)
    for k in range(5):
        for sg in (-1, 1): o += '<path d="M0 %dQ%d %d %d %d" stroke="%s" stroke-width="5.4" fill="none" stroke-linecap="round"/>' % (-8 + k * 8, sg * 12, -8 + k * 8, sg * 15, 8 + k * 8, ['#F2C53A', '#E8B62A', '#A8C43A'][k % 3])
    return o + '</g>'

def beo(x, y, h, kind=0, k_=1):
    """Cây bẹo: sào tre cao trên ghe, buộc mẫu hàng ghe đang bán."""
    o = '<path d="M%d %dL%d %d" stroke="#B98A4A" stroke-width="4.4"/>' % (x, y, x + 8, y - h)
    for k in range(int(h / 22)): o += '<path d="M%d %dh5" stroke="#6B4322" stroke-width="1.4"/>' % (x + 8 * (k * 22 / h) - 2.5, y - k * 22)
    t = x + 8; g = '<g transform="translate(%d %d) scale(%.2f) translate(%d %d)">' % (t, y - h, k_, -t, h - y)
    items = [[('p', -13, 12), ('b', 15, 16), ('m', -11, 50), ('p', 15, 56), ('c', -8, 84)], [('b', -14, 14), ('c', 14, 12), ('p', -13, 52), ('m', 14, 56)], [('m', -12, 14), ('m', 13, 18), ('b', -12, 54), ('p', 14, 56)]][kind % 3]
    for it, dx, dy in items:
        px, py = t + dx, y - h + dy
        g += '<path d="M%d %dL%d %d" stroke="#3A2A20" stroke-width="1.1"/>' % (t, y - h + dy - 12, px, py - 8)
        if it == 'p': g += pine(px, py + 4, .9)
        elif it == 'b': g += bananas(px, py, .78)
        elif it == 'm': g += melon(px, py + 4, 12)
        else: g += '<circle cx="%d" cy="%d" r="11" fill="#7FA83A" stroke="#2A4A1A"/><circle cx="%d" cy="%d" r="5" fill="#C4DC7A"/>' % (px, py + 4, px, py + 2)
    return o + V.sway(g + '</g>', t, y - h, 3.6, x % 3)

def ghe(x, y, s=1, kind='melon', hull='#6A4530', band='#2F8A8A', cabin='#3E8EB8', flip=False, pole=None):
    """Ghe hàng miền Tây theo ảnh: thân gỗ thấp, mũi cong có mắt, lốp xe chắn, cabin sơn xanh, khung bạt, hàng chất cao."""
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s)
    if kind == 'melon':
        for r_ in range(5):
            for k in range(15 - r_ * 2): o += melon(-112 + r_ * 16 + k * 19.5, -32 - r_ * 14 + R.uniform(-1, 1), 12)
    elif kind == 'pine':
        for r_ in range(4):
            for k in range(14 - r_ * 2): o += pine(-104 + r_ * 16 + k * 16, -34 - r_ * 16, .94)
    elif kind == 'coco':
        for r_ in range(4):
            for k in range(13 - r_ * 2):
                cx, cy = -104 + r_ * 18 + k * 18, -32 - r_ * 16
                o += '<circle cx="%d" cy="%d" r="11" fill="%s" stroke="#2A4A1A"/><circle cx="%d" cy="%d" r="3" fill="#E8E2A0"/>' % (cx, cy, R.choice(['#7FA83A', '#6E9A32', '#92B844']), cx - 2, cy - 3)
    else:
        for k in range(13):
            o += '<path d="M%d -22l26 0l-4 -22h-18Z" fill="#C9A464" stroke="#6B4322"/>' % (-124 + k * 21)
            for j in range(6): o += '<circle cx="%d" cy="%d" r="6" fill="%s" stroke="#5A3A1A" stroke-width=".6"/>' % (-122 + k * 21 + R.randint(2, 20), -46 - R.randint(0, 9), R.choice(['#F2A23C', '#E2483E', '#F2C53A', '#7FB84A']))
    for px in (-112, -36, 40, 112): o += '<path d="M%d -24V-112" stroke="#B9B4AA" stroke-width="2.6"/>' % px
    o += '<path d="M-128 -106Q-40 -128 34 -112T126 -118L128 -104Q40 -94 -30 -100T-130 -92Z" fill="#26262E" stroke="#0E0E14" stroke-width="1.4"/><path d="M-120 -108Q-40 -122 40 -108" stroke="#5A5A66" stroke-width="1.4" fill="none"/>'
    o += '<path d="M-214 -18V-74H-140V-18Z" fill="%s" stroke="%s" stroke-width="1.6"/><rect x="-206" y="-66" width="26" height="24" fill="#FFD27A" stroke="%s"/><rect x="-174" y="-66" width="26" height="24" fill="#2A3A4A" stroke="%s"/><path d="M-222 -74H-132L-136 -84H-218Z" fill="#8A9A9E" stroke="%s"/><rect x="-210" y="-34" width="62" height="6" fill="#F2C53A"/>' % (cabin, INK, INK, INK, INK)
    o += '<path d="M-226 -22Q-222 30 -176 36H150Q200 22 238 -60Q206 -30 170 -24Z" fill="%s" stroke="%s" stroke-width="2"/>' % (hull, INK)
    for k in range(1, 6): o += '<path d="M%d %dQ0 %d %d %d" stroke="#3A2418" stroke-width="1.2" opacity=".75" fill="none"/>' % (-222 + k * 5, -22 + k * 9, -14 + k * 10, 196 - k * 12, -22 + k * 3)
    o += '<path d="M-226 -22H170Q206 -30 238 -60L230 -38Q200 -14 168 -12H-224Z" fill="%s" stroke="%s" stroke-width="1.2"/><path d="M-214 24H150" stroke="#D9543C" stroke-width="3.4"/>' % (band, INK)
    o += '<circle cx="186" cy="-22" r="12" fill="#F4F0E4" stroke="%s" stroke-width="1.6"/><circle cx="190" cy="-22" r="6" fill="#141014"/><circle cx="188" cy="-24" r="2" fill="#fff"/><path d="M170 -30Q186 -42 202 -30" stroke="#D9543C" stroke-width="3" fill="none"/>' % INK
    for px in (-150, -60, 40, 124): o += '<ellipse cx="%d" cy="16" rx="13" ry="15" fill="none" stroke="#1E1A1E" stroke-width="7"/><path d="M%d -12V2" stroke="#3A2A20" stroke-width="1.4"/>' % (px, px)
    o += '</g>'
    if pole is not None:
        px = x + (-1 if flip else 1) * -90 * s
        o += beo(int(px), int(y - 40 * s), int(250 * s), pole, max(.26, s * .95))
    return o

def xuong(x, y, s=1, top='#D9543C', goods='fruit', flip=False):
    # xuồng ba lá: người đứng chèo, nón lá, bán đồ ăn hoặc trái cây
    o = '<g class="rock" style="animation-delay:-%.1fs"><g transform="translate(%d %d) scale(%.2f %.2f)">' % (x % 3, x, y, -s if flip else s, s)
    o += '<ellipse cy="15" rx="96" ry="7" fill="#3A2412" opacity=".4"/><path d="M-96 -12Q-70 14 -40 14H52Q88 10 104 -18Q40 -2 -40 -2Q-74 -2 -96 -12Z" fill="#5E7A5E" stroke="%s" stroke-width="1.6"/><path d="M-90 -8Q-20 4 98 -13" stroke="#EFE6CC" stroke-width="2.6" fill="none"/>' % INK
    if goods == 'fruit':
        for j in range(16): o += '<circle cx="%d" cy="%d" r="7" fill="%s" stroke="#5A3A1A" stroke-width=".7"/>' % (R.randint(-6, 70), -6 - R.randint(0, 13), R.choice(['#F2A23C', '#E2483E', '#7FB84A', '#F2C53A']))
    else:
        o += '<rect x="16" y="-32" width="36" height="28" fill="#B9B4AA" stroke="%s"/><ellipse cx="34" cy="-32" rx="18" ry="5" fill="#E8D8B0" stroke="%s"/><path d="M26 -44q4 -6 0 -12M40 -46q4 -6 0 -12" class="smoke" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>' % (INK, INK)
    o += '<g transform="translate(-48 -4) scale(1.06)">' + V.non(0, 0, top).replace(NOSH, '') + '</g>'
    o += '<g class="row"><path d="M-40 -34L-74 34" stroke="#8F5A2E" stroke-width="3.2"/><path d="M-74 34l-8 14l8 2l6 -14Z" fill="#6B4322"/></g>'
    return o + '</g></g>'

def bank(y0):
    # bờ xa: nhà tôn trên cột, vài nhà cao, cột ăng-ten mảnh, dừa
    o = ''
    for x, w_, h_ in ((640, 70, 96), (150, 56, 60), (1120, 60, 76), (420, 46, 54)):
        o += '<rect x="%d" y="%d" width="%d" height="%d" fill="#B8A0A8"/>' % (x, y0 - h_, w_, h_)
        for r_ in range(int(h_ / 13)):
            for k in range(int(w_ / 13)): o += '<rect x="%d" y="%d" width="7" height="6" fill="#9C8690"/>' % (x + 5 + k * 13, y0 - h_ + 6 + r_ * 13)
    o += '<path d="M892 %dV%dM884 %dL892 %dL900 %d" stroke="#8C7A80" stroke-width="2" fill="none"/>' % (y0, y0 - 118, y0, y0 - 80, y0)
    for x, s_ in ((60, 1), (230, 1.2), (350, .9), (560, 1.1), (760, 1.3), (960, 1), (1230, 1.2)):
        for k in range(4): o += '<circle cx="%d" cy="%d" r="%d" fill="#5E7A6A"/>' % (x + k * 30 * s_ - 40, y0 - 24 - (k % 2) * 14, 26 * s_)
    for x in range(-20, 1300, 58):
        w_ = R.randint(46, 56); h_ = R.randint(20, 34); c_ = R.choice(['#C4A49A', '#8FA8A4', '#D2AE90', '#A89AB0'])
        o += '<rect x="%d" y="%d" width="%d" height="%d" fill="%s" stroke="#6A5A5E" stroke-width=".7"/><path d="M%d %dL%d %dL%d %dZ" fill="#8A7E86" stroke="#5E5258" stroke-width=".7"/>' % (x, y0 - h_, w_, h_ - 4, c_, x - 5, y0 - h_, x + w_ / 2, y0 - h_ - 15, x + w_ + 5, y0 - h_)
        for k in range(3): o += '<path d="M%d %dv9" stroke="#5E5258" stroke-width="1.5"/>' % (x + 4 + k * 20, y0 - 5)
    for x, h_, l_ in ((96, 88, 14), (318, 100, -18), (500, 78, 10), (838, 96, 16), (1060, 84, -14), (1180, 104, 18)):
        o += coco(x, y0 - 4, h_, l_, '#3E6A58', '#6A5A5E', '#2F5A4A', 9, 40)
    return o

def hex_pavers(pts):
    c = V.uid(); o = '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="#A89E90"/><g clip-path="url(#%s)">' % (c, pts, pts, c)
    y_ = 470; r_ = 0
    while y_ < 730:
        h_ = 11 + (y_ - 470) * .07; w_ = 30 + (y_ - 470) * .13; x_ = -30 + (r_ % 2) * w_ * .52
        while x_ < 640:
            o += '<path d="M%.0f %.0fh%.0fl%.0f %.0fl%.0f %.0fh%.0fl%.0f %.0fZ" fill="%s" stroke="#6E665A" stroke-width=".9"/>' % (x_, y_, w_ * .6, w_ * .2, h_ / 2, -w_ * .2, h_ / 2, -w_ * .6, -w_ * .2, -h_ / 2, R.choice(['#B4AA9C', '#A49A8C', '#BEB4A4', '#988E82']))
            x_ += w_ * 1.04
        y_ += h_ * .98; r_ += 1
    return o + '</g>'

def globe_lamp(x, y, s=1):
    o = '<path d="M%d %dV%d" stroke="#2A2A30" stroke-width="%.1f"/>' % (x, y, y - 120 * s, 4 * s)
    for sg in (-1, 1): o += '<path d="M%d %dq%d -4 %d -14" stroke="#2A2A30" stroke-width="2" fill="none"/><circle cx="%d" cy="%d" r="%.1f" fill="#FFF3C8" stroke="#2A2A30"/>' % (x, y - 112 * s, sg * 16 * s, sg * 18 * s, x + sg * 18 * s, y - 132 * s, 8 * s)
    return o + '<circle cx="%d" cy="%d" r="%.1f" fill="#FFF3C8" stroke="#2A2A30"/>' % (x, y - 138 * s, 8 * s)

def balustrade(x0, y0, x1, y1, n=11):
    o = ''; tops = []
    for k in range(n):
        t = k / (n - 1); h_ = 24 + 26 * t
        tops.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - h_, y0 + (y1 - y0) * t - h_ * .46))
    for a_, b_ in zip(tops, tops[1:]):
        o += '<path d="M%.0f %.0fL%.0f %.0fM%.0f %.0fL%.0f %.0f" stroke="#D2CEC2" stroke-width="%.1f"/>' % (a_[0], a_[1] + 3, b_[0], b_[1] + 3, a_[0], a_[2], b_[0], b_[2], 3 + (a_[0] - x0) / (x1 - x0) * 3)
    for k, (x, tp, _) in enumerate(tops):
        t = k / (n - 1); h_ = 24 + 26 * t; w_ = 7 + 7 * t
        o += '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="#F4F0E4" stroke="%s" stroke-width="1.2"/><rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="#B9B4AA"/>' % (x - w_ / 2, tp, w_, h_, INK, x + w_ * .1, tp, w_ * .4, h_)
    return o

CT_CSS = """<style>
@keyframes ctring{0%{transform:scale(.3);opacity:.55}100%{transform:scale(1.5);opacity:0}}
.ctring{animation:ctring 4.2s ease-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes ctglint{0%,100%{opacity:.5}50%{opacity:.85}}
.ctglint{animation:ctglint 5s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.ctring,.ctglint{animation:none}.ctring{opacity:.25}}
</style>"""

def pumpkin(x, y, r=9):
    o = '<g transform="translate(%.0f %.0f)"><ellipse rx="%.1f" ry="%.1f" fill="%s" stroke="#7A3E10" stroke-width=".9"/>' % (x, y, r, r * .78, R.choice(['#E8892E', '#EE9A3A', '#DC7A26']))
    for k in (-.55, 0, .55): o += '<path d="M%.1f %.1fQ%.1f 0 %.1f %.1f" stroke="#9A4E14" stroke-width="1" fill="none"/>' % (k * r * .4, -r * .74, k * r * 1.4, k * r * .4, r * .74)
    return o + '<path d="M0 %.1fq1 -5 4 -6" stroke="#4A6A1E" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>' % (-r * .72)

def ct_xuong(x, y, s=1, top='#D9543C', goods='melon', flip=False, pole=None):
    """Xuồng ba lá chất đầy dưa/bí/thơm, người nón lá chèo, có cây bẹo."""
    o = '<g class="rock" style="animation-delay:-%.1fs"><g transform="translate(%d %d) scale(%.2f %.2f)">' % (x % 3, x, y, -s if flip else s, s)
    o += '<ellipse cy="15" rx="96" ry="7" fill="#3A2412" opacity=".4"/><path d="M-96 -12Q-70 14 -40 14H52Q88 10 104 -18Q40 -2 -40 -2Q-74 -2 -96 -12Z" fill="#7A6A4E" stroke="%s" stroke-width="1.6"/><path d="M-90 -8Q-20 4 98 -13" stroke="#EFE6CC" stroke-width="2.6" fill="none"/>' % INK
    for r_ in range(3):
        for k in range(8 - r_ * 2):
            px, py = -2 + r_ * 8 + k * 14, -6 - r_ * 9
            if goods == 'melon': o += melon(px, py, 8)
            elif goods == 'pumpkin': o += pumpkin(px, py, 8.5)
            else: o += pine(px, py - 2, .62)
    o += '<g transform="translate(-48 -4) scale(1.06)">' + V.non(0, 0, top).replace(NOSH, '') + '</g>'
    o += '<g class="row"><path d="M-40 -34L-74 34" stroke="#8F5A2E" stroke-width="3.2"/><path d="M-74 34l-8 14l8 2l6 -14Z" fill="#6B4322"/></g>'
    if pole is not None: o += beo(60, -8, 180, pole, .5)
    return o + '</g></g>'

def nipa(x, y, s=1):
    """Dừa nước ven bờ: tàu lá dài xoè từ gốc."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    for a in (-62, -38, -16, 8, 30, 56):
        o += '<path d="M0 0Q%.0f %.0f %.0f %.0f" stroke="%s" stroke-width="4.4" fill="none" stroke-linecap="round"/>' % (math.sin(math.radians(a)) * 22, -30 - abs(a) * .1, math.sin(math.radians(a)) * 46, -52 + abs(a) * .5, R.choice(['#2F6A46', '#3C7E52', '#265A3C']))
    return o + '</g>'

def stilt_house(x, y, s=1, wall='#B9A484', roof='#7A8A8E'):
    """Nhà sàn ven sông Hậu: cột tre, vách ván, mái tôn, dây phơi áo."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    for k in range(4): o += '<path d="M%d 0V30" stroke="#4A3A2E" stroke-width="3"/>' % (-27 + k * 18)
    o += '<rect x="-34" y="-4" width="68" height="6" fill="#6A4A34" stroke="%s" stroke-width=".9"/><rect x="-28" y="-34" width="56" height="30" fill="%s" stroke="%s" stroke-width="1"/>' % (INK, wall, INK)
    o += '<rect x="-20" y="-28" width="14" height="14" fill="#FFD27A" stroke="%s"/><rect x="8" y="-30" width="12" height="26" fill="#4A3A2E" stroke="%s"/>' % (INK, INK)
    o += '<path d="M-38 -32L0 -52L38 -32Z" fill="%s" stroke="%s"/>' % (roof, INK)
    o += '<path d="M34 -20Q50 -12 66 -20" stroke="#4A3A2E" stroke-width="1" fill="none"/>'
    for k, c in enumerate(('#E2483E', '#F2C53A', '#3E8EB8')): o += '<rect x="%d" y="%d" width="7" height="10" fill="%s"/>' % (40 + k * 9, -20 + (1 if k == 1 else 0) * 5, c)
    return o + '</g>'

def ct_extra():
    """Chi tiết thêm cho PCantho, gom theo lớp; dùng seed riêng để không đổi dãy ngẫu nhiên của cảnh gốc và các cảnh sau."""
    st = R.getstate(); R.seed(77); L = {}
    g = '<g class="ctglint"><path d="M850 262L910 262L1010 720L760 720Z" fill="#FFE9A8" opacity=".14"/>'
    for k in range(26):
        y = 268 + k * 17; w_ = 24 + k * 6; g += '<rect x="%.0f" y="%d" width="%.0f" height="2.6" rx="1.3" fill="#FFF3C8" opacity="%.2f"/>' % (880 - w_ / 2 + R.randint(-14, 14), y, w_, .6 - k * .016)
    L['glint'] = g + '</g>'
    rings = ''
    for x, y, rx in ((330, 548, 70), (1090, 548, 70), (640, 585, 120), (900, 646, 44), (590, 692, 56), (420, 654, 40), (1060, 690, 54)):
        rings += '<ellipse class="ctring" style="animation-delay:-%.1fs" cx="%d" cy="%d" rx="%d" ry="%d" fill="none" stroke="#FFE9B8" stroke-width="1.6"/>' % (R.uniform(0, 4), x, y, rx, rx * .14)
    L['rings'] = rings
    nb = ''
    for x in (14, 96, 168, 262, 352, 452, 536, 702, 842, 934, 1030, 1150, 1244): nb += nipa(x, 266 + R.randint(-2, 3), R.uniform(.5, .8))
    for x, w_, r_ in ((60, '#B9A484', '#7A8A8E'), (470, '#A8B49A', '#8A6A5E'), (640, '#C4A49A', '#6A7A8E'), (1000, '#B9A484', '#8A6A5E'), (1190, '#A8B49A', '#7A8A8E')): nb += stilt_house(x, 268, .62, w_, r_)
    L['bank'] = nb
    gh = ghe(270, 522, .5, 'mix', '#5E4234', '#D9744C', '#6AA0B8', False, None) + ghe(1130, 522, .58, 'coco', '#6A4530', '#3E6AA8', '#B86A5A', True, 2)
    L['boats'] = gh
    L['front'] = ct_xuong(560, 688, .8, '#F2C25A', 'pumpkin', False, None) + ct_xuong(912, 650, .62, '#E86AA8', 'melon', True, 1) + ct_xuong(424, 654, .54, '#2FB8C6', 'pine', False, 2) + ct_xuong(770, 700, .5, '#D9543C', 'pumpkin', True, None)
    hy = ''
    for x, y in ((470, 612), (735, 718), (1010, 706), (960, 578), (350, 690), (1250, 600)):
        hy += '<g class="rock" style="animation-delay:-%.1fs">' % R.uniform(0, 3)
        for _ in range(12): hy += '<ellipse cx="%d" cy="%d" rx="%d" ry="4.4" fill="%s" stroke="#1F4A2A" stroke-width=".7"/>' % (x + R.randint(-26, 26), y + R.randint(-5, 5), R.randint(8, 12), R.choice(['#3CA45C', '#2F8A4A', '#5AB864']))
        for _ in range(3): hy += '<path d="M%d %dv-8" stroke="#2F8A4A" stroke-width="1.4"/><circle cx="%d" cy="%d" r="3.2" fill="%s"/>' % (x + R.randint(-14, 14), y, x + R.randint(-14, 14), y - 9, R.choice(['#B98ADC', '#C9A0E8', '#A874D0']))
        hy += '</g>'
    L['hyacinth'] = hy
    R.setstate(st); return L

def pcantho():
    d = lin('skC', [('0', '#6A78B8'), ('.34', '#C49AB8'), ('.68', '#FFC9A0'), ('1', '#FFE2A0')]) + lin('watC', [('0', '#F2C48E'), ('.16', '#C89462'), ('.5', '#94683E'), ('1', '#66462A')]) + water_defs(250, 24, 5)
    o = '<rect width="1280" height="262" fill="url(#skC)"/><circle cx="880" cy="200" r="210" fill="url(#hg)"/><circle cx="880" cy="202" r="44" fill="#FFF0B0"/><circle cx="880" cy="202" r="34" fill="#FFE27A"/>'
    for x, y, w_ in ((180, 90, 300), (540, 60, 260), (1090, 90, 320), (760, 130, 150), (360, 160, 170)): o += cloud(x, y, w_, '#FFE4D2', '#E8A8A8', .85)
    o += V.flock(46, 70, 16, .34) + bank(248) + '<rect y="246" width="1280" height="474" fill="url(#watC)"/>'
    # ghe xa nhỏ dần, nằm dày thành chợ
    fleet = ''
    for k, x in enumerate(range(120, 1280, 122)):
        fleet += ghe(x, 266 + (k % 2) * 2, .23, ['mix', 'coco', 'pine', 'melon'][k % 4], ['#6A5040', '#5E4A3E'][k % 2], ['#5E9A9A', '#8A6AA0', '#D9744C'][k % 3], ['#6AA0B8', '#B86A5A', '#B8A04C'][k % 3], bool(k % 2), k % 3)
    mid = ghe(380, 322, .52, 'coco', '#6A4530', '#D9744C', '#3E8EB8', False, 1) + ghe(1120, 320, .54, 'mix', '#5A3E30', '#2F8A8A', '#C76A4C', True, 0)
    near = ghe(1000, 402, .86, 'pine', '#5A3E30', '#3E6AA8', '#2F9A7A', True, 2)
    hero = ghe(680, 536, 1.14, 'melon', '#6A4530', '#2F8A8A', '#3E8EB8', False, 0)
    o += reflect(mid + near + hero, 566, 300)
    for _ in range(200):
        x = R.choice([R.randint(0, 1280), R.randint(760, 1000)]); y = R.randint(272, 716); w_ = R.randint(14, 74) * (.4 + (y - 250) / 470)
        o += '<path class="lap" style="--t:%.1fs;--d:-%.1fs" d="M%d %dh%d" stroke="%s" stroke-width="2.2" opacity="%.2f" stroke-linecap="round"/>' % (R.uniform(3, 6), R.uniform(0, 4), x, y, w_, R.choice(['#FFE29A', '#FFD08A', '#E8B478', '#7A5230']), R.uniform(.25, .7))
    for _ in range(40):
        y = R.randint(262, 420); x = 880 + (y - 262) * R.uniform(-.4, .4)
        o += '<ellipse class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" rx="%d" ry="1.6" fill="#FFF3C8"/>' % (R.uniform(2, 5), R.uniform(0, 4), x, y, R.randint(6, 20))
    ex = ct_extra()
    o += ex['glint'] + ex['rings']
    # lục bình trôi
    for x, y in ((860, 690), (1070, 610), (1200, 690), (520, 690)):
        o += '<g class="rock">' + ''.join('<ellipse cx="%d" cy="%d" rx="9" ry="4" fill="%s" stroke="#1F4A2A" stroke-width=".7"/>' % (x + R.randint(-20, 20), y + R.randint(-5, 5), R.choice(['#3CA45C', '#2F8A4A', '#5AB864'])) for _ in range(9)) + '<circle cx="%d" cy="%d" r="3" fill="#B98ADC"/></g>' % (x, y - 6)
    o += ex['bank'] + ex['hyacinth']
    o += fleet + '<g class="rock">' + mid + '</g><g class="rock" style="animation-delay:-1s">' + near + '</g>'
    o += xuong(250, 412, .62, '#2FB8C6', 'soup', True) + xuong(800, 330, .46, '#F2C25A', 'fruit') + xuong(610, 318, .44, '#E86AA8', 'fruit')
    o += reflect(ex['boats'], 566, 300) + '<g class="rock" style="animation-delay:-3s">' + ex['boats'] + '</g>' + ex['front']
    o += '<g class="rock" style="animation-delay:-2s">' + hero + '<g transform="translate(680 536) scale(1.14)"><g transform="translate(-178 -74)">' + V.non(0, 0, '#F4F0E4').replace(NOSH, '') + '</g><g transform="translate(142 -58)">' + V.non(0, 0, '#2F8F5B').replace(NOSH, '') + '</g></g></g>'
    o += xuong(1110, 660, 1.04, '#D9543C', 'fruit', True)
    # bến Ninh Kiều: kè chéo tiền cảnh, gạch lục giác, lan can trắng, đèn chùm
    o += '<path d="M-10 450L500 730H470L-10 470Z" fill="#6E6556" stroke="%s" stroke-width="1.6"/>' % INK
    o += hex_pavers('M-10 476L440 730H-10Z') + '<path d="M-10 476L440 730" stroke="%s" stroke-width="1.6"/>' % INK
    o += '<path d="M-10 520Q70 556 150 640Q60 660 -10 648Z" fill="#4FA85A" stroke="#1F5A3A" stroke-width="1.4"/>'
    for _ in range(70): o += '<circle cx="%d" cy="%d" r="%d" fill="%s"/>' % (R.randint(-6, 110), R.randint(530, 640), R.randint(4, 9), R.choice(['#3C9450', '#2F8A4A', '#6FBE5A']))
    o += globe_lamp(34, 556, 1.0) + V.tree(-6, 500, 1.3) + balustrade(20, 466, 420, 700, 12) + globe_lamp(226, 620, 1.4)
    o += G.walker(130, 610, '#F2C25A', '#2E3A5A', s=1.02) + V.non(90, 586, '#D9543C') + V.kitsu(232, 704, 108, 'ehappy', 'walk')
    for t_, x, y, dn in [('Cây bẹo', 587, 186, True), ('Dưa hấu', 720, 392, True), ('Chợ nổi', 300, 216, False), ('Trái thơm', 1000, 262, False), ('Bến Ninh Kiều', 120, 418, False)]:
        o += G.bubble(x, y, t_, dn)
    page('PCantho', 'Kids World, Cần Thơ bình minh', 'Chợ nổi Cái Răng lúc bình minh: ghe chở dưa hấu, cây bẹo treo hàng, xuồng bán đồ ăn, bến Ninh Kiều', d, o, 'Cần Thơ', CT_CSS)


# ---------- PPhuquoc: làng chài lúc hoàng hôn trên biển ----------
def nhasan(x, y, w_, h_, wall, roof, s=1):
    """Nhà sàn trên biển: cột gỗ, sàn ván, vách ván, mái tôn gợn (không có ảnh riêng, vẽ theo mô tả chung)."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    for k in range(int(w_ / 22) + 1):
        o += '<path d="M%d 0V56" stroke="#2A1C22" stroke-width="4"/><path d="M%d 30L%d 54" stroke="#3A2A30" stroke-width="1.6"/>' % (-w_ / 2 + k * 22, -w_ / 2 + k * 22, -w_ / 2 + k * 22 + 22)
    o += '<rect x="%d" y="-6" width="%d" height="9" fill="#5A3E3A" stroke="%s"/><rect x="%d" y="%d" width="%d" height="%d" fill="%s" stroke="%s" stroke-width="1.3"/>' % (-w_ / 2 - 10, w_ + 20, INK, -w_ / 2, -h_ - 6, w_, h_, wall, INK)
    for k in range(int(w_ / 9)): o += '<path d="M%d %dV-6" stroke="#2A1C22" stroke-width=".9" opacity=".45"/>' % (-w_ / 2 + k * 9, -h_ - 6)
    o += '<rect x="%d" y="%d" width="22" height="20" fill="#FFD27A" stroke="%s"/><path d="M%d %dv20" stroke="%s"/><rect x="%d" y="%d" width="20" height="%d" fill="#2A1C22" stroke="%s"/>' % (-w_ * .3, -h_ + 2, INK, -w_ * .3 + 11, -h_ + 2, INK, w_ * .12, -h_ + 2, h_ - 8, INK)
    o += G.halo(-w_ * .3 + 11, -h_ + 12, 30, .55)
    o += '<path d="M%d %dL0 %dL%d %dZ" fill="%s" stroke="%s" stroke-width="1.4"/>' % (-w_ / 2 - 14, -h_ - 4, -h_ - 40, w_ / 2 + 14, -h_ - 4, roof, INK)
    for k in range(1, int(w_ / 8)):
        bx = -w_ / 2 - 14 + k * 8 * (w_ + 28) / w_
        o += '<path d="M%.0f %dL%.0f %d" stroke="#2A1C22" stroke-width=".9" opacity=".5"/>' % (bx, -h_ - 5, bx * .06, -h_ - 39)
    return o + '</g>'

def thung(x, y, s=1, oar=True, man=False, rx=70):
    """Thuyền thúng: tre đan, vành tre tròn, phết dầu nâu sẫm, mái chèo gác ngang."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="24" rx="%d" ry="9" fill="#3A1A2A" opacity=".4"/>' % (x, y, s, rx + 8)
    c = V.uid(); d_ = 'M%d -8Q%d 26 0 28Q%d 26 %d -8Z' % (-rx, -rx + 4, rx - 4, rx)
    o += '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="#4A3228" stroke="%s" stroke-width="1.8"/><g clip-path="url(#%s)">' % (c, d_, d_, INK, c)
    for k in range(-14, 15):
        o += '<path d="M%d -10Q%d 8 %d 30" stroke="#6E4E3A" stroke-width="1.5" fill="none"/><path d="M%d -10Q%d 8 %d 30" stroke="#2E1E18" stroke-width="1.2" fill="none"/>' % (k * 6, k * 7, k * 4 + 16, k * 6, k * 7, k * 4 - 16)
    o += '<path d="M-60 2Q-30 22 -6 26" stroke="#FFC08A" stroke-width="5" opacity=".28" fill="none"/></g>'
    o += '<ellipse cy="-9" rx="%d" ry="10" fill="#2A1A16" stroke="%s" stroke-width="1"/><ellipse cy="-9" rx="%d" ry="10" fill="none" stroke="#C9A464" stroke-width="4.4"/><ellipse cy="-10" rx="%d" ry="9" fill="none" stroke="#8F6A38" stroke-width="1.2"/>' % (rx - 2, INK, rx, rx - 4)
    for k in range(10):
        a = k * .628; o += '<path d="M%.0f %.0fv4" stroke="#6B4322" stroke-width="1.4"/>' % (math.cos(a) * rx, -11 + math.sin(a) * 10)
    if man:
        o += '<g transform="translate(-6 -10) scale(1.06)">' + V.non(0, 0, '#2E5AA8').replace(NOSH, '') + '</g><g class="row"><path d="M2 -40L54 26" stroke="#8F5A2E" stroke-width="3"/></g>'
    elif oar:
        o += '<path d="M%d -24L%d -2" stroke="#C9A464" stroke-width="4" stroke-linecap="round"/>' % (-rx - 18, rx + 24)
    return o + '</g>'

def fishing(x, y, s=1, hull='#E8743C', band='#2E5AA8', tarp='#2E6AC8', flip=False):
    """Ghe biển Phú Quốc theo ảnh: thân cam viền xanh, cabin trắng, bạt xanh, cột đèn câu."""
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s)
    o += '<path d="M-150 -30Q-146 16 -108 22H96Q150 12 182 -66Q146 -38 110 -32Z" fill="%s" stroke="%s" stroke-width="2"/>' % (hull, INK)
    o += '<path d="M-150 -30H110Q146 -38 182 -66L176 -50Q146 -22 108 -20H-148Z" fill="%s" stroke="%s"/><path d="M-138 8H104" stroke="#F4F0E4" stroke-width="3.4"/>' % (band, INK)
    o += '<rect x="-112" y="-82" width="96" height="50" fill="#F4E8DC" stroke="%s" stroke-width="1.5"/><path d="M-120 -82H-8L-14 -94H-114Z" fill="%s" stroke="%s"/>' % (INK, tarp, INK)
    for k in range(3): o += '<rect x="%d" y="-72" width="20" height="20" fill="%s" stroke="%s"/>' % (-104 + k * 28, '#FFD27A' if k != 1 else '#3A3A5A', INK)
    o += '<path d="M-60 -94V-168M-60 -150H40M40 -32V-132M-60 -142L40 -132" stroke="#2A1C22" stroke-width="3" fill="none"/>'
    for k in range(8): o += '<circle cx="%d" cy="%.0f" r="4.4" fill="#FFF3C8" stroke="#2A1C22"/>' % (-52 + k * 13, -146 + k * 1.1)
    return o + '<path d="M-6 -36L84 -36L54 -74H4Z" fill="%s" stroke="%s" stroke-width="1.4"/></g>' % (tarp, INK)

def net_rack(x, y, s=1):
    # giàn phơi lưới
    o = '<g transform="translate(%d %d) scale(%.2f)"><path d="M-70 0V-74M70 0V-74M-82 -72H82" stroke="#4A2E2A" stroke-width="4"/><path d="M-74 -70Q-70 -22 -58 -6Q0 12 58 -6Q70 -22 74 -70Z" fill="#2FA8A0" opacity=".42" stroke="#1F6A70"/>' % (x, y, s)
    for k in range(-7, 8): o += '<path d="M%d -70Q%d -22 %d 2" stroke="#BFF0E4" stroke-width=".8" fill="none" opacity=".7"/>' % (k * 10, k * 9, k * 7)
    for k in range(7): o += '<path d="M%d %dQ0 %d %d %d" stroke="#BFF0E4" stroke-width=".8" fill="none" opacity=".7"/>' % (-74 + k * 2, -62 + k * 10, -52 + k * 12, 74 - k * 2, -62 + k * 10)
    for k in range(9): o += '<circle cx="%d" cy="-68" r="2.6" fill="#E8743C" stroke="#5A2A10" stroke-width=".6"/>' % (-64 + k * 16)
    return o + '</g>'

# --- PPhuquoc: chi tiết đời sống đảo (thêm cho đủ độ dày như R5Arrive) ---
RP = random.Random(77)
PQ_CSS = """<style>
@keyframes sidle{0%,100%{transform:translateX(-9px)}50%{transform:translateX(9px)}}
.sidle{animation:sidle var(--t,5s) ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes glint{0%,100%{opacity:.15;transform:scale(.6)}50%{opacity:1;transform:scale(1.1)}}
.glint{animation:glint var(--t,3s) ease-in-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
@keyframes ray{0%,100%{opacity:.55}50%{opacity:.9}}
.ray{animation:ray 7s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.sidle,.glint,.ray{animation:none}}
</style>"""

def pq_barrel(x, y, s=1, c='#7A4A32'):
    """Thùng nước mắm gỗ: thân phình, đai tre, nắp, vòi."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="3" rx="22" ry="6" fill="#2A1038" opacity=".4"/>' % (x, y, s)
    o += '<path d="M-17 0Q-23 -22 -17 -44H17Q23 -22 17 0Q0 6 -17 0Z" fill="%s" stroke="%s" stroke-width="1.5"/>' % (c, INK)
    for k in range(-2, 3):
        o += '<path d="M%d -42Q%d -22 %d -2" stroke="#4A2A1E" stroke-width="1" fill="none" opacity=".6"/>' % (k * 6, k * 7.5, k * 6)
    for yy in (-36, -8):
        o += '<path d="M%d %dQ0 %d %d %d" stroke="#C9A464" stroke-width="3" fill="none"/>' % (-19 if yy < -20 else -21, yy, yy + 5, 19 if yy < -20 else 21, yy)
    o += '<ellipse cy="-44" rx="17" ry="5" fill="#9A6A48" stroke="%s" stroke-width="1.2"/><ellipse cy="-44" rx="11" ry="3" fill="#6A4028"/><path d="M-17 -14l-9 3v4" stroke="#2A1C22" stroke-width="2.4" fill="none"/>' % INK
    o += '<path d="M10 -40Q14 -22 10 -4" stroke="#FFC08A" stroke-width="3" opacity=".3" fill="none"/>'
    return o + '</g>'

def pq_fish(x, y, s=1, c='#CFD8E8'):
    return '<g transform="translate(%.0f %.0f) scale(%.2f)"><path d="M-8 0Q0 -5 8 0Q0 5 -8 0ZM8 0l5 -4v8Z" fill="%s" stroke="#4A3A5A" stroke-width=".7"/><circle cx="-5" cy="-.8" r=".9" fill="#2A1C22"/></g>' % (x, y, s, c)

def pq_rack(x, y, s=1, rows=3, w_=120):
    """Giàn phơi cá/mực: khung tre, dây ngang, cá treo từng hàng."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="2" rx="%d" ry="5" fill="#2A1038" opacity=".35"/>' % (x, y, s, w_ / 2 + 6)
    o += '<path d="M%d 0V-%d M0 0V-%d M%d 0V-%d" stroke="#6B4322" stroke-width="4" stroke-linecap="round"/>' % (-w_ / 2, 20 + rows * 22, 20 + rows * 22, w_ / 2, 20 + rows * 22)
    for r_ in range(rows):
        yy = -22 - r_ * 22
        o += '<path d="M%d %dH%d" stroke="#8F5A2E" stroke-width="2.4"/>' % (-w_ / 2 - 6, yy, w_ / 2 + 6)
        for k in range(int(w_ / 15)):
            fx = -w_ / 2 + 8 + k * 15
            o += '<path d="M%.0f %dv5" stroke="#6B4322" stroke-width=".8"/><path d="M%.0f %dq-4 8 0 17q4 -9 0 -17Z" fill="%s" stroke="#4A3A5A" stroke-width=".6"/>' % (fx, yy, fx, yy + 4, RP.choice(['#CFD8E8', '#E8C8B0', '#F0B8A0', '#BFD0E0']))
    return o + '</g>'

def pq_basket(x, y, s=1, fish=True):
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="3" rx="19" ry="5" fill="#2A1038" opacity=".35"/><path d="M-18 -16Q-16 2 0 3Q16 2 18 -16Z" fill="#B88A4E" stroke="%s" stroke-width="1.3"/>' % (x, y, s, INK)
    for k in range(-3, 4):
        o += '<path d="M%d -16Q%d -6 %d 2" stroke="#6E4A2A" stroke-width=".9" fill="none"/>' % (k * 5, k * 5, k * 3)
    o += '<path d="M-18 -9Q0 -4 18 -9" stroke="#6E4A2A" stroke-width=".9" fill="none"/><ellipse cy="-16" rx="18" ry="5" fill="#6A4A2A" stroke="%s" stroke-width="1"/>' % INK
    if fish:
        for k, c_ in enumerate(['#CFD8E8', '#F0B8A0', '#BFD0E0']):
            o += pq_fish(-8 + k * 8, -17 - (k % 2) * 2, .75, c_)
    return o + '</g>'

def pq_crab(x, y, t=5, d=0):
    o = '<g class="sidle" style="--t:%.1fs;--d:-%.1fs"><g transform="translate(%d %d)"><ellipse rx="7" ry="4.4" fill="#E8584A" stroke="#5A1A18" stroke-width=".9"/>' % (t, d, x, y)
    for sg in (-1, 1):
        o += '<path d="M%d -2l%d -6M%d -5l%d -2M%d 1l%d 3M%d 3l%d 4" stroke="#5A1A18" stroke-width="1" fill="none" stroke-linecap="round"/>' % (sg * 6, sg * 4, sg * 4, sg * 5, sg * 6, sg * 5, sg * 5, sg * 4)
        o += '<circle cx="%d" cy="-9" r="2.6" fill="#F27A62" stroke="#5A1A18" stroke-width=".7"/><circle cx="%d" cy="-4" r="1.2" fill="#fff"/>' % (sg * 11, sg * 2)
    return o + '</g></g>'

def pq_shells(x0, x1, y0, y1, n):
    o = ''
    for _ in range(n):
        x, y, k = RP.randint(x0, x1), RP.randint(y0, y1), RP.random()
        sz = .7 + (y - y0) / max(1, y1 - y0) * .8
        if k < .4:
            o += '<g transform="translate(%d %d) scale(%.2f) rotate(%d)"><path d="M0 0L-6 -7Q0 -11 6 -7Z" fill="#FFE8DC" stroke="#9A5A7A" stroke-width=".8"/><path d="M0 0L-3 -9M0 0V-10M0 0L3 -9" stroke="#C88AA0" stroke-width=".6"/></g>' % (x, y, sz, RP.randint(-30, 30))
        elif k < .6:
            o += '<g transform="translate(%d %d) scale(%.2f) rotate(%d)"><path d="M0 -8L2.4 -2.6L8 -2.4L3.6 1.4L5 7L0 4L-5 7L-3.6 1.4L-8 -2.4L-2.4 -2.6Z" fill="#F29A62" stroke="#8A3A22" stroke-width=".8"/></g>' % (x, y, sz, RP.randint(0, 70))
        elif k < .8:
            o += '<g transform="translate(%d %d) scale(%.2f)"><path d="M-6 0Q-7 -9 0 -9Q7 -9 6 -2Q5 3 -1 3Q-6 3 -4 -3" fill="#F8D8C8" stroke="#8A4A6A" stroke-width=".9"/><path d="M-3 -2Q0 -6 3 -3" stroke="#C88AA0" stroke-width=".7" fill="none"/></g>' % (x, y, sz)
        else:
            o += '<ellipse cx="%d" cy="%d" rx="%.1f" ry="%.1f" fill="%s" stroke="#4A2A5A" stroke-width=".9"/><path d="M%.0f %dq4 -3 8 -1" stroke="#fff" stroke-width="1" opacity=".3" fill="none"/>' % (x, y, 8 * sz, 4.6 * sz, RP.choice(['#8A6A8E', '#A07A98', '#7A5A80']), x - 4 * sz, y - 2)
    return o

def pq_tuft(x, y, s=1, c='#2F6A4A'):
    """Cỏ/bụi ven cát, ngả theo gió."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    for k in range(-4, 5):
        o += '<path d="M%d 0Q%d -14 %d %d" stroke="%s" stroke-width="2.2" fill="none" stroke-linecap="round"/>' % (k * 2, k * 3, k * 5 + 4, -22 + abs(k) * 2, c if k % 2 else '#4A8A5A')
    return V.sway(o + '</g>', x, y, 3.6 + (x % 4) * .3, (x % 5) * .5)

def pq_gull(x, y, s=1, d=0):
    return '<g class="lap" style="--t:%.1fs;--d:-%.1fs"><path d="M%d %dq%.0f %.0f %.0f 0q%.0f %.0f %.0f 0" stroke="#2A1438" stroke-width="%.1f" fill="none" stroke-linecap="round"/></g>' % (5 + d % 3, d, x, y, 7 * s, -7 * s, 14 * s, 7 * s, 7 * s, 14 * s, max(1.3, 1.8 * s))

def pq_sparkle(x, y, r=5, c='#FFF3B0', t=3, d=0):
    return '<path class="glint" style="--t:%.1fs;--d:-%.1fs" d="M%d %dL%.1f %.1fL%d %dL%.1f %.1fL%d %dL%.1f %.1fL%d %dL%.1f %.1fZ" fill="%s"/>' % (t, d, x, y - r, x + r * .25, y - r * .25, x + r, y, x + r * .25, y + r * .25, x, y + r, x - r * .25, y + r * .25, x - r, y, x - r * .25, y - r * .25, c)

def pq_lanterns(x0, y0, x1, y1, sag, n, cols=('#F2484A', '#FFB02E', '#F2484A', '#FFD27A')):
    """Dây đèn lồng giăng giữa các nhà sàn."""
    cy_ = (y0 + y1) / 2 + sag * 2
    o = '<path d="M%d %dQ%.0f %.0f %d %d" stroke="#2A1C22" stroke-width="1.4" fill="none"/>' % (x0, y0, (x0 + x1) / 2, cy_, x1, y1)
    for k in range(1, n + 1):
        t = k / (n + 1)
        px = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * (x0 + x1) / 2 + t * t * x1
        py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy_ + t * t * y1
        o += G.halo(px, py + 6, 15, .6) + '<ellipse cx="%.0f" cy="%.0f" rx="4.2" ry="5.4" fill="%s" stroke="#5A1A18" stroke-width=".8"/><path d="M%.0f %.0fv2" stroke="#2A1C22"/>' % (px, py + 6, cols[k % len(cols)], px, py)
    return o

def pq_stilts_detail(x, y, w_, s=1):
    """Chi tiết nhà sàn: thang, xà ngang giữa cột, lưới phơi, phao."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<path d="M%d 34H%d" stroke="#3A2A30" stroke-width="2.4"/>' % (-w_ / 2, w_ / 2)
    o += '<path d="M%d 0L%d 52M%d 0L%d 52" stroke="#6B4322" stroke-width="2.4"/>' % (w_ / 2 + 6, w_ / 2 + 22, w_ / 2 + 14, w_ / 2 + 30)
    for k in range(6):
        o += '<path d="M%.0f %dh7" stroke="#6B4322" stroke-width="1.6"/>' % (w_ / 2 + 7 + k * 3, 6 + k * 8)
    o += '<path d="M%d -6Q%d 16 0 2Q%d 16 %d -6" fill="#2FA8A0" opacity=".45" stroke="#1F6A70" stroke-width=".8"/>' % (-w_ / 2 - 8, -w_ / 4, w_ / 4, w_ / 2 + 8)
    o += '<circle cx="%d" cy="-14" r="5" fill="#E8743C" stroke="#5A2A10" stroke-width=".8"/><circle cx="%d" cy="-14" r="5" fill="#F4F0E4" stroke="#5A2A10" stroke-width=".8"/>' % (-w_ / 2 - 16, -w_ / 2 - 28)
    return o + '</g>'

def pphuquoc():
    HZ = 348
    d = lin('skP', [('0', '#3A2E96'), ('.3', '#8A3EB8'), ('.58', '#E8589A'), ('.8', '#FF9A4A'), ('1', '#FFDC6A')]) + lin('seaP', [('0', '#FFB26A'), ('.16', '#F0789A'), ('.55', '#9A4AA8'), ('1', '#4E2E86')]) + lin('sandP', [('0', '#F2A49A'), ('.5', '#E88AA4'), ('1', '#C86E9E')]) + water_defs(HZ, 22, 8)
    o = '<rect width="1280" height="%d" fill="url(#skP)"/>' % (HZ + 2)
    for _ in range(50): o += '<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="1.2" fill="#fff"/>' % (R.uniform(2, 5), R.uniform(0, 4), R.randint(0, 1280), R.randint(0, 96))
    for x, y, w_, h_, c_ in [(160, 110, 340, 13, '#F27AA8'), (480, 70, 280, 10, '#C86AC8'), (900, 96, 420, 14, '#F27AA8'), (1120, 170, 320, 10, '#FFA88A'), (300, 210, 300, 9, '#FF9A8A'), (760, 240, 380, 8, '#FFC47A'), (1000, 280, 260, 6, '#FFD08A')]:
        o += '<ellipse class="drift" style="--t:300s;--d:-%ds" cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" opacity=".7"/>' % (x % 40, x, y, w_ / 2, h_, c_)
    # mây tầng thấp ánh cam, tia nắng quạt, đàn chim về tổ
    for x, y, w_, c_ in [(140, 300, 420, '#FFB88A'), (1010, 318, 360, '#FFC47A'), (560, 330, 300, '#FF9A8A')]:
        o += '<ellipse class="drift" style="--t:380s;--d:-%ds" cx="%d" cy="%d" rx="%d" ry="5" fill="%s" opacity=".55"/>' % (x % 53, x, y, w_ / 2, c_)
    o += cloud(330, 150, 150, '#FFC0B0', '#E87AA8', .55, 340) + cloud(1050, 120, 170, '#FFD0A8', '#F07AA0', .5, 420)
    o += '<g class="ray" opacity=".55">'
    for k in range(-5, 6):
        a = math.radians(k * 11 - 2)
        o += '<path d="M790 %d L%.0f %.0f L%.0f %.0f Z" fill="#FFE8A0" opacity="%.2f"/>' % (HZ - 18, 790 + math.sin(a - .035) * 760, HZ - 18 - math.cos(a - .035) * 760, 790 + math.sin(a + .035) * 760, HZ - 18 - math.cos(a + .035) * 760, .07 + .04 * (k % 2))
    o += '</g>'
    sc = V.uid()
    o += '<circle cx="790" cy="%d" r="240" fill="url(#hg)"/><clipPath id="%s"><rect width="1280" height="%d"/></clipPath><g clip-path="url(#%s)"><circle cx="790" cy="%d" r="58" fill="#FFF0A0"/><circle cx="790" cy="%d" r="46" fill="#FFD24A"/></g>' % (HZ - 20, sc, HZ, sc, HZ - 18, HZ - 18)
    o += '<path d="M880 %dQ930 %d 990 %dQ1040 %d 1100 %dT1280 %dV%dH880Z" fill="#7A3A8E"/><path d="M380 %dQ430 %d 500 %dT620 %dZ" fill="#8A3E8E"/>' % (HZ, HZ - 16, HZ - 8, HZ - 26, HZ - 10, HZ - 22, HZ, HZ, HZ - 12, HZ - 5, HZ)
    o += V.flock(190, 66, 8, .36) + '<rect y="%d" width="1280" height="372" fill="url(#seaP)"/>' % HZ
    # chân trời: đảo xa nhiều lớp, thuyền buồm xa, cụm dừa xa, sương cam
    o += '<path d="M0 %d Q60 %d 140 %d T300 %d V%d H0Z" fill="#9A4A98" opacity=".75"/><path d="M1030 %d Q1090 %d 1160 %d T1280 %d V%d H1030Z" fill="#6E3486" opacity=".8"/>' % (HZ, HZ - 22, HZ - 12, HZ - 4, HZ + 1, HZ, HZ - 20, HZ - 10, HZ - 24, HZ + 1)
    for x, h_ in ((1100, 40), (1124, 52), (1150, 34), (60, 30), (90, 38)):
        o += coco(x, HZ - 4, h_, 6 if x > 1000 else -5, '#3A1E5A', '#3A1E5A', '#3A1E5A', 7, 16)
    for x, y, s_ in ((350, HZ + 6, .5), (590, HZ + 4, .38), (1000, HZ + 7, .46), (1240, HZ + 10, .6)):
        o += '<g transform="translate(%d %d) scale(%.2f)" opacity=".85"><path d="M-30 0H34L26 9H-22Z" fill="#3A1E5A"/><path d="M2 -2V-44L30 -4Z" fill="#FFC8A0" opacity=".9"/><path d="M-2 -2V-36L-24 -4Z" fill="#E88AA8" opacity=".9"/></g>' % (x, y, s_)
    o += '<rect y="%d" width="1280" height="14" fill="#FFB890" opacity=".35"/>' % (HZ - 6)
    for x, y, s_, d_ in ((470, 90, 1, 0), (500, 112, .8, 2), (560, 80, .7, 4), (420, 150, .9, 1), (980, 60, .9, 3), (1040, 84, .7, 5), (1180, 230, .8, 2)):
        o += pq_gull(x, y, s_, d_)
    boats = fishing(905, 398, .5) + fishing(1160, 430, .74, '#2E6AC8', '#F4F0E4', '#E8743C', True) + fishing(650, 386, .36, '#D9543C', '#2FB8C6', '#2E6AC8', True) + fishing(510, 374, .3)
    village = ''
    for x, y, w_, h_, wl, rf, s_ in [(44, 330, 96, 44, '#8A5A6A', '#6A4A7A', .74), (124, 328, 84, 40, '#7A6A8A', '#8A4A4E', .74), (200, 336, 92, 44, '#A87A6A', '#5A5A8A', .78), (280, 330, 84, 40, '#6E6A8E', '#8A5A4E', .72), (346, 338, 76, 38, '#946A6E', '#54507E', .7), (-20, 392, 120, 54, '#B2806A', '#7E4A52', 1.04), (106, 396, 112, 50, '#6E7AA0', '#8E5A4E', 1.08), (226, 400, 116, 52, '#BE8E72', '#4E5E8E', 1.12), (346, 404, 100, 48, '#8E6E8E', '#96584E', 1.04)]:
        village += nhasan(x, y, w_, h_, wl, rf, s_)
    # đời sống trên nhà sàn: đèn lồng, ván nối, lưới phơi, thang, thuyền thúng buộc dưới sàn, khói bếp
    village += pq_lanterns(30, 372, 150, 372, 6, 4) + pq_lanterns(150, 368, 296, 376, 7, 5) + pq_lanterns(296, 376, 420, 384, 6, 4)
    village += pq_lanterns(-10, 428, 110, 432, 8, 4) + pq_lanterns(110, 432, 240, 436, 8, 5, ('#FFB02E', '#F2484A', '#FFD27A'))
    for x, y, w_ in ((60, 440, 96), (170, 444, 92), (290, 450, 96)):
        village += pq_stilts_detail(x, y, w_, .85)
    village += '<path d="M-10 416H70M150 418H190M262 420H330" stroke="#5A3E3A" stroke-width="5"/>'
    for x, y, c_ in ((72, 312, '#E8743C'), (298, 328, '#3E8EB8'), (176, 292, '#C9A464')):
        village += '<g class="smoke" style="--d:-%.1fs"><circle cx="%d" cy="%d" r="5" fill="#F4E6EE" opacity=".55"/></g><g class="smoke" style="--d:-%.1fs"><circle cx="%d" cy="%d" r="4" fill="#F4E6EE" opacity=".45"/></g>' % (x % 4, x, y, x % 3 + 1.8, x + 6, y - 10)
    village += thung(210, 472, .3, False, False, 60) + thung(110, 474, .26, False, False, 60) + thung(340, 476, .28, True, False, 60)
    o += reflect(boats + village, HZ + 110, HZ + 4)
    for _ in range(90):
        y = R.randint(HZ + 3, 500); sp = (y - HZ) * .3 + 26; x = 790 + R.uniform(-1, 1) * sp
        o += '<ellipse class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" rx="%d" ry="1.8" fill="%s"/>' % (R.uniform(2, 5), R.uniform(0, 4), x, y, R.randint(6, 30), R.choice(['#FFF3B0', '#FFE27A', '#FFC66E']))
    for _ in range(150):
        x, y = R.randint(0, 1280), R.randint(HZ + 3, 520)
        o += '<path class="lap" style="--t:%.1fs;--d:-%.1fs" d="M%d %dh%d" stroke="%s" stroke-width="2" opacity="%.2f" stroke-linecap="round"/>' % (R.uniform(3, 6), R.uniform(0, 4), x, y, R.randint(14, 66), R.choice(['#FFC0A0', '#F7A0C4', '#D08AD8', '#FFE29A']), R.uniform(.2, .6))
    for _ in range(26):
        y = RP.randint(HZ + 6, 480); sp = (y - HZ) * .34 + 40
        o += pq_sparkle(int(790 + RP.uniform(-1, 1) * sp), y, RP.uniform(3, 6.5), RP.choice(['#FFF3B0', '#FFFFFF', '#FFE27A']), RP.uniform(2, 4.5), RP.uniform(0, 4))
    # phao neo, hàng phao nuôi trai, bóng bay màu cam trên mặt nước
    for x, y in ((560, 438), (600, 444), (650, 430), (1100, 482), (1135, 490), (980, 452)):
        o += '<g class="lap" style="--t:%.1fs;--d:-%.1fs"><ellipse cx="%d" cy="%d" rx="9" ry="2.6" fill="#2A1038" opacity=".3"/><ellipse cx="%d" cy="%d" rx="5.4" ry="4" fill="#E8743C" stroke="%s" stroke-width=".9"/><path d="M%d %dq2 -2 5 -1" stroke="#fff" stroke-width="1" fill="none" opacity=".6"/></g>' % (RP.uniform(3, 5), RP.uniform(0, 4), x, y + 4, x, y, INK, x - 3, y - 1)
    o += '<path d="M540 436Q600 446 668 432" stroke="#2A1C22" stroke-width="1" fill="none" opacity=".6"/>'
    o += '<g class="rock">' + boats + '</g>' + village + thung(636, 452, .62, False, True) + thung(470, 436, .42, False, True)
    # bãi cát, sóng liếm bờ
    o += '<path d="M-10 492Q150 462 330 492Q560 532 760 512Q1000 486 1290 532V560H-10Z" fill="#FFE2E2" opacity=".7" class="lap" style="--t:5s"/>'
    o += '<path d="M-10 500Q150 470 330 500Q560 540 760 520Q1000 494 1290 540V730H-10Z" fill="url(#sandP)" stroke="#FFF0EE" stroke-width="3"/>'
    for _ in range(260):
        x, y = R.randint(-10, 1280), R.randint(530, 718); w_ = R.randint(20, 90) * (.5 + (y - 500) / 300)
        o += '<path d="M%d %dq%.0f %d %.0f 0" stroke="%s" stroke-width="1.4" fill="none" opacity=".5"/>' % (x, y, w_ / 2, R.randint(-5, 5), w_, R.choice(['#FFD2CC', '#B85E96', '#F7AAB8', '#A85090']))
    # cát ướt phản chiếu mặt trời, bóng dừa đổ về phía người xem, vỏ sò, đá, cỏ, cua
    o += '<path d="M700 518Q790 508 880 520L1000 720H560Z" fill="#FFE2B0" opacity=".16"/><path d="M740 524Q790 516 840 526L900 720H680Z" fill="#FFF0C8" opacity=".14"/>'
    for x, y, w_, a_ in ((120, 600, 130, 14), (1130, 640, 150, -16), (1040, 590, 100, -10), (1235, 680, 120, -12)):
        o += '<path d="M%d %dL%d %dL%d %dZ" fill="#5A2A6A" opacity=".2"/>' % (x - 6, y - 20, x + w_ * (1 if a_ > 0 else -1) * .5, y + 60, x + 8, y - 20)
    o += pq_shells(20, 380, 540, 710, 16) + pq_shells(740, 1260, 530, 712, 22)
    for x, y, s_ in ((30, 540, 1.1), (210, 530, 1), (1180, 542, 1.2), (900, 700, 1.4), (690, 560, .8)):
        o += '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="3" rx="26" ry="6" fill="#2A1038" opacity=".3"/><path d="M-24 0Q-24 -16 -8 -20Q4 -26 16 -16Q28 -8 24 0Z" fill="#8A6A8E" stroke="%s" stroke-width="1.4"/><path d="M-10 -14Q0 -22 10 -14" stroke="#C8A8C8" stroke-width="2" fill="none" opacity=".6"/><path d="M-6 -4Q4 -10 14 -4" stroke="#5A3A66" stroke-width="1.2" fill="none"/></g>' % (x, y, s_, INK)
    o += '<path d="M780 640Q830 632 880 646" stroke="#7A4A32" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M830 636l12 -12M850 640l10 -8" stroke="#7A4A32" stroke-width="3" stroke-linecap="round"/>'
    for x, y, s_ in ((16, 526, 1), (232, 526, .9), (1150, 530, 1.1), (1060, 520, .8), (700, 536, .8), (700, 700, 1.2), (60, 640, 1.1)):
        o += pq_tuft(x, y, s_, '#2A5A44')
    for x, y, t_, d_ in ((240, 650, 5, 0), (940, 698, 6, 2), (1205, 650, 4.6, 1), (410, 520, 5.2, 3)):
        o += pq_crab(x, y, t_, d_)
    # cầu ván từ làng ra bãi: lối đi của thú cưng
    pier = 'M380 462L436 448L720 720H470Z'; wid = V.uid()
    o += '<clipPath id="%s"><path d="%s"/></clipPath>' % (wid, pier)
    o += '<path d="%s" fill="#A8704C" stroke="%s" stroke-width="1.8"/><g clip-path="url(#%s)">' % (pier, INK, wid)
    y_ = 448
    while y_ < 722:
        h_ = 6 + (y_ - 448) * .06
        o += '<rect x="340" y="%.0f" width="460" height="%.0f" fill="%s" stroke="#4A2E22" stroke-width="1"/>' % (y_, h_ - 1, R.choice(['#B47C54', '#A06A48', '#C08A60', '#98623E', '#AE7450']))
        y_ += h_
    o += '</g>'
    for x0, y0, x1, y1 in ((380, 462, 470, 720), (436, 448, 720, 720)):
        o += '<path d="M%d %dL%d %d" stroke="#6B4322" stroke-width="5"/>' % (x0, y0 - 18, x1, y1 - 50)
        for k in range(8):
            t = k / 7; x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            o += '<path d="M%.0f %.0fv%.0f" stroke="#5A3628" stroke-width="%.1f"/>' % (x, y, -22 - 34 * t, 3 + 3 * t)
    o += thung(170, 610, 1.3) + thung(320, 680, 1.06) + thung(60, 690, 1.0, False) + thung(860, 610, 1.16) + thung(1010, 660, 1.5)
    o += net_rack(1190, 598, 1.1) + net_rack(760, 548, .7) + V.non(1130, 616, '#D9543C') + V.non(800, 590, '#2FB8C6') + G.walker(900, 540, '#F2C25A', s=.84)
    # xóm nước mắm & cá phơi: thùng nước mắm, giàn phơi cá, rổ cá, người làng
    o += pq_rack(246, 552, .8, 3, 110) + pq_rack(985, 560, .85, 2, 130) + pq_rack(1195, 700, .75, 2, 100)
    o += pq_barrel(318, 566, .95) + pq_barrel(352, 574, 1.0, '#6A3E2C') + pq_barrel(334, 548, .85, '#8A5638')
    o += pq_barrel(842, 556, .85) + pq_barrel(870, 564, .9, '#6A3E2C') + pq_barrel(1070, 700, 1.1) + pq_barrel(1102, 712, 1.0, '#8A5638')
    o += pq_basket(402, 642, 1.1) + pq_basket(1100, 580, .9) + pq_basket(715, 640, 1.0) + pq_basket(1000, 702, .9, False)
    o += V.non(280, 604, '#2FB8C6', True) + V.non(1235, 664, '#D9543C') + V.non(370, 690, '#F2C25A') + G.walker(1160, 708, '#3E8EB8', s=.9) + G.walker(960, 592, '#E8743C', s=.8) + G.walker(35, 608, '#8A5AD8', s=.9) + G.walker(680, 600, '#2FB8C6', s=.7)
    for x, y in ((230, 560), (780, 680), (1120, 700)):
        o += '<circle cx="%d" cy="%d" r="8" fill="#E8743C" stroke="%s"/><circle cx="%d" cy="%d" r="3" fill="#FFE29A"/>' % (x, y, INK, x - 2, y - 3)
    bl, bt_ = '#1E1438', '#2A1A40'
    o += coco(1136, 560, 330, -56, bl, bt_, bl, 12, 96) + coco(1230, 586, 420, 60, bl, bt_, bl, 12, 110) + coco(1040, 520, 250, 34, bl, bt_, bl, 11, 80) + coco(120, 540, 300, 70, bl, bt_, bl, 11, 90)
    o += coco(1000, 516, 190, -26, bl, bt_, bl, 10, 66) + coco(1190, 524, 210, 28, bl, bt_, bl, 10, 72) + coco(24, 548, 220, 36, bl, bt_, bl, 10, 74)
    # tán lá dừa phía trước góc dưới, và vùng tối quanh khung cho ấm hơn
    o += '<radialGradient id="vgP" cx=".5" cy=".55" r=".75"><stop offset=".6" stop-color="#2A1038" stop-opacity="0"/><stop offset="1" stop-color="#2A1038" stop-opacity=".42"/></radialGradient><rect y="340" width="1280" height="380" fill="url(#vgP)" pointer-events="none"/>'
    o += V.kitsu(590, 672, 106, 'ehappy', 'walk')
    for t_, x, y, dn in [('Hoàng hôn', 790, 236, True), ('Làng chài', 270, 214, True), ('Nhà sàn', 400, 300, False), ('Thuyền thúng', 1010, 590, False), ('Lưới cá', 760, 462, False)]:
        o += G.bubble(x, y, t_, dn)
    page('PPhuquoc', 'Kids World, Phú Quốc hoàng hôn', 'Làng chài Phú Quốc lúc hoàng hôn: nhà sàn trên biển, thuyền thúng trên cát, ghe đánh cá, hàng dừa', d, o, 'Phú Quốc', PQ_CSS)


# ---------- bản đồ phẳng tầng 2-3: không biên giới, mọi nước gộp một khối ----------
def place(f):
    d = json.load(open(os.path.join(PLACES, f), encoding='utf-8'))
    return d['place'], len(d['words'])

def plate(x, y, r=78, top='#6FBE5A', side='#B98A4A'):
    # bệ tròn phẳng, cùng ý với bệ của R5World
    return ('<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="#0A3A40" opacity=".3" filter="url(#soft)"/><ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" stroke="%s" stroke-width="2"/><ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" stroke="%s" stroke-width="2"/>'
        % (x + 4, y + 20, r * 1.04, r * .36, x, y + 10, r, r * .36, side, INK, x, y, r, r * .36, top, INK))

def done_flag(x, y):
    return '<path d="M%d %dv-58" stroke="%s" stroke-width="3.4"/><path class="wave" d="M%d %dl30 9l-30 11Z" fill="#E2483E" stroke="%s" stroke-width="2"/>' % (x, y, INK, x + 2, y - 58, INK)

def lm_fuji(x, y):
    o = plate(x, y, 84)
    o += '<ellipse cx="%d" cy="%d" rx="40" ry="10" fill="#4FB8D0" stroke="%s"/>' % (x + 34, y + 4, INK)
    o += '<path d="M%d %dL%d %dQ%d %d %d %dL%d %dZ" fill="#5E7AB0" stroke="%s" stroke-width="2"/>' % (x - 74, y - 2, x - 18, y - 104, x, y - 112, x + 18, y - 104, x + 70, y - 2, INK)
    o += '<path d="M%d %dL%d %dQ%d %d %d %dL%d %dl-10 12l-9 -14l-9 16l-10 -14l-9 12l-9 -14Z" fill="#FFF9EA" stroke="%s" stroke-width="1.4"/>' % (x - 38, y - 68, x - 18, y - 104, x, y - 112, x + 18, y - 104, x + 36, y - 68, INK)
    tx = x - 44
    return o + '<path d="M%d %dv-40M%d %dv-40" stroke="#E2483E" stroke-width="5"/><path d="M%d %dq22 5 44 0l-3 7q-19 4 -38 0Z" fill="#C7322E" stroke="%s"/><path d="M%d %dh38" stroke="#E2483E" stroke-width="4"/>' % (tx - 13, y + 12, tx + 13, y + 12, tx - 22, y - 34, INK, tx - 19, y - 16)

def lm_wall(x, y):
    o = plate(x, y, 84)
    o += '<path d="M%d %dQ%d %d %d %dT%d %dV%dH%dZ" fill="#4F9A5A" stroke="%s" stroke-width="1.6"/>' % (x - 74, y + 2, x - 44, y - 62, x - 4, y - 28, x + 74, y - 4, y + 8, x - 74, INK)
    path = 'M%d %dQ%d %d %d %dT%d %d' % (x - 72, y + 6, x - 42, y - 56, x - 2, y - 24, x + 72, y)
    o += '<path d="%s" stroke="%s" stroke-width="15" fill="none"/><path d="%s" stroke="#D9C8A0" stroke-width="12" fill="none"/><path d="%s" stroke="#8A7A5E" stroke-width="5" stroke-dasharray="5 7" fill="none" transform="translate(0 -6)"/>' % (path, INK, path, path)
    for tx, ty in ((x - 34, y - 34), (x + 34, y - 10)):
        o += '<rect x="%d" y="%d" width="26" height="26" fill="#D9C8A0" stroke="%s" stroke-width="1.5"/><path d="M%d %dv-6h6v6h4v-6h6v6h4v-6h6v6" fill="none" stroke="%s" stroke-width="1.5"/><rect x="%d" y="%d" width="8" height="12" fill="#3A2A20"/>' % (tx - 13, ty - 16, INK, tx - 13, ty - 16, INK, tx - 4, ty - 2)
    return o

def waves(n, ok):
    o = ''; c = 0
    while c < n:
        x, y, w_ = R.randint(0, 1280), R.randint(0, 720), R.choice([22, 28, 34])
        if ok(x, y):
            o += '<path d="M%d %dq%.1f -7 %.1f 0q%.1f -7 %.1f 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>' % (x, y, w_ / 4, w_ / 2, w_ / 4, w_ / 2)
        c += 1
    return o

def peak(x, y, s=1, seed=0):
    # núi tuyết: mặt nắng, mặt khuất, chóp tuyết răng cưa, chân đồi xanh hoà vào đất
    r_ = random.Random(seed); h = 66 * s * r_.uniform(.9, 1.12); w = 50 * s * r_.uniform(.9, 1.1)
    P_ = lambda a, b: '%.1f %.1f' % (x + a * w, y - b * h)
    o = '<path d="M%sQ%s %s Z" fill="#7FBE6A"/>' % (P_(-1.25, 0), P_(0, .3), P_(1.25, 0))
    o += '<path d="M%sL%sL%sL%sL%sL%sL%sZ" fill="#A7B2C8" stroke="#3E4A62" stroke-width="1" stroke-linejoin="round"/>' % (P_(-1, 0), P_(-.6, .4), P_(-.34, .6), P_(.02, 1), P_(.38, .58), P_(.66, .3), P_(1, 0))
    o += '<path d="M%sL%sL%sL%sL%sL%sL%sZ" fill="#6C7894"/>' % (P_(.02, 1), P_(.38, .58), P_(.66, .3), P_(1, 0), P_(.2, 0), P_(.08, .34), P_(.2, .56))
    o += '<path d="M%sL%sL%sL%sL%sL%sL%sL%sZ" fill="#FFFDF6" stroke="#8FA4BC" stroke-width=".8" stroke-linejoin="round"/>' % (P_(.02, 1), P_(-.28, .6), P_(-.14, .68), P_(-.06, .56), P_(.04, .66), P_(.14, .54), P_(.24, .64), P_(.34, .6))
    o += '<path d="M%sL%sL%sL%sL%sZ" fill="#CFE0F0"/>' % (P_(.02, 1), P_(.34, .6), P_(.24, .64), P_(.14, .54), P_(.08, .72))
    return o

def fir(x, y, s=1):
    o = '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#0A3A2A" opacity=".2"/><rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#6B4A32"/>' % (x + 3 * s, y, 15 * s, 4 * s, x - 2.4 * s, y - 10 * s, 4.8 * s, 10 * s)
    for i, (w_, c1, c2) in enumerate(((17, '#176A58', '#2A8C6A'), (14, '#1E7A60', '#38A076'), (10, '#2A8C6A', '#58B884'))):
        yb, yt = y - (8 + i * 11) * s, y - (29 + i * 11) * s
        o += '<path d="M%.1f %.1fL%.1f %.1fL%.1f %.1fZ" fill="%s" stroke="#0E4A3E" stroke-width=".8" stroke-linejoin="round"/><path d="M%.1f %.1fL%.1f %.1fL%.1f %.1fZ" fill="%s"/>' % (x - w_ * s, yb, x, yt, x + w_ * s, yb, c1, x - w_ * s, yb, x, yt, x - w_ * .1 * s, yb, c2)
    return o

def broadleaf(x, y, s=1, k=0):
    c = (('#1F8A5A', '#3FB06A', '#8FDB78'), ('#2E9A52', '#62BE5A', '#B6E67A'), ('#178468', '#34AE84', '#84DEA8'))[k % 3]
    o = '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#0A3A2A" opacity=".2"/><path d="M%.1f %.1fL%.1f %.1fH%.1fL%.1f %.1fZ" fill="#6B4A32"/>' % (x + 3 * s, y, 19 * s, 5 * s, x - 3.4 * s, y, x - 1.6 * s, y - 22 * s, x + 1.6 * s, x + 3.4 * s, y)
    blob = lambda cx, cy, r, f, st='': '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"%s/>' % (x + cx * s, y + cy * s, r * s, f, st)
    e = ' stroke="#0E5A3E" stroke-width=".9"'
    o += blob(-11, -24, 11, c[0], e) + blob(11, -25, 12, c[0], e) + blob(0, -36, 13.5, c[0], e)
    o += blob(-10, -26, 8.4, c[1]) + blob(10, -27, 9, c[1]) + blob(-1, -36, 10.6, c[1]) + blob(0, -25, 9, c[1])
    return o + blob(-4, -40, 5, c[2]) + blob(-13, -29, 3.6, c[2]) + blob(7, -31, 3.6, c[2])

def hud_map(tier, card_t, card_s, btn):
    h = '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về làng</span><span class="pill">%s</span><span class="pill">46 sao</span></div>' % tier
    return h + '<div class="abs" style="left:28px;bottom:28px;width:300px;background:#FFF9EA;border:3px solid #F7B91A;border-radius:20px;padding:16px 18px"><div class="t1" style="font-size:28px">%s</div><div style="margin:4px 0 12px;font-weight:500">%s</div><button class="go" style="width:100%%;justify-content:center">%s</button></div>' % (card_t, card_s, btn)

def planes(routes):
    # máy bay chạy trên đúng đường bay nét đứt, nhìn từ trên xuống, mũi hướng theo đường
    pl = '<path d="M4 3L-20 -2L-20 2Z" fill="#0A3A40" opacity=".22" transform="translate(5 8) scale(1.5)"/><path d="M26 0Q24 -5 14 -5H-20L-27 -13H-32L-28 0L-32 13H-27L-20 5H14Q24 5 26 0Z" fill="#FFFDF6" stroke="%s" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 -4L-10 -27H-17L-7 -4ZM8 4L-10 27H-17L-7 4Z" fill="#E2483E" stroke="%s" stroke-width="1.4" stroke-linejoin="round"/><path d="M-32 0h10" stroke="#E2483E" stroke-width="3"/><path d="M19 -3.4q5 3.4 0 6.8" fill="#4FB8D0"/>' % (INK, INK)
    o = ''; css = '@keyframes plane{0%,4%{offset-distance:0%;opacity:0}12%{opacity:1}88%{opacity:1}96%,100%{offset-distance:100%;opacity:0}}.plane{offset-rotate:auto;animation:plane var(--t,26s) ease-in-out infinite;animation-delay:var(--d,0s)}'
    for i, (p_, q_, b_, t_, d_) in enumerate(routes):
        o += '<g class="plane" style="offset-path:path(\'M%d %dQ%d %d %d %d\');--t:%ds;--d:-%ds">%s</g>' % (p_[0], p_[1], (p_[0] + q_[0]) / 2, (p_[1] + q_[1]) / 2 + b_, q_[0], q_[1], t_, d_, pl)
    return '<style>' + css + '</style>' + o

def edge_chip(x, y, name, ang):
    # chỉ về hướng thật của nơi nằm ngoài khung bản đồ
    a = math.radians(ang); ax, ay = x + math.cos(a) * 62, y + math.sin(a) * 34
    return V.label(x, y, name) + '<path d="M0 -9L15 0L0 9Z" transform="translate(%d %d) rotate(%d)" fill="#D32F2F" stroke="#FFF9EA" stroke-width="2"/>' % (ax, ay, ang)

def land_union():
    from shapely.geometry import Polygon
    from shapely.ops import unary_union
    a = json.load(open(TMP + 'asia.json', encoding='utf-8'))
    polys = []
    for v in a['countries'].values():
        for ring in re.findall(r'M([^Z]+)Z', v['d']):
            p = [tuple(map(float, q.split())) for q in ring.split('L')]
            if len(p) > 3:
                g_ = Polygon(p).buffer(0)
                if not g_.is_empty: polys.append(g_)
    return a, unary_union([p.buffer(.5) for p in polys]).buffer(-.5)

def pasia():
    a, land = land_union()
    from shapely import affinity
    from shapely.geometry import Point
    S, X0, Y0 = 1.64, 429, 106
    conv = lambda x, y: ((x - X0) * S, (y - Y0) * S)
    C_ = math.cos(math.radians(26))
    ll = lambda lo, la: conv((lo - 25) * C_ * 10.6, (56 - la) * 10.6)
    land = affinity.affine_transform(land, [S, 0, 0, S, -X0 * S, -Y0 * S])
    geoms = [land] if land.geom_type == 'Polygon' else list(land.geoms)
    dd = ''.join('M' + 'L'.join('%.1f %.1f' % c for c in g_.exterior.coords) + 'Z' for g_ in geoms if g_.area > 3 and g_.bounds[2] > -40 and g_.bounds[0] < 1320 and g_.bounds[3] > -40 and g_.bounds[1] < 760)
    cid = V.uid()
    o = '<rect width="1280" height="720" fill="url(#riv)"/>' + waves(240, lambda x, y: not land.buffer(6).contains(Point(x, y)))
    o += '<clipPath id="%s"><path d="%s"/></clipPath>' % (cid, dd)
    o += '<path d="%s" fill="#F2DDA6" stroke="#F2DDA6" stroke-width="9" stroke-linejoin="round"/><path d="%s" fill="url(#hill1)" stroke="#2A6A4A" stroke-width="1.4"/>' % (dd, dd)
    o += '<g clip-path="url(#%s)">' % cid
    for lo, la, rx, ry, c_, op in ((100, 44, 190, 70, '#E8D08E', .75), (84, 33, 190, 70, '#D6C89A', .45), (78, 22, 130, 120, '#A8C45A', .6), (112, 30, 170, 90, '#4FB86A', .6), (102, 15, 120, 120, '#2F9A5A', .6), (125, 50, 220, 70, '#8FC47A', .6)):
        x, y = ll(lo, la); o += '<ellipse cx="%.0f" cy="%.0f" rx="%d" ry="%d" fill="%s" opacity="%.2f" filter="url(#soft)"/>' % (x, y, rx, ry, c_, op)
    o += '</g>'
    # Himalaya, Karakoram, Thiên Sơn, Hoành Đoạn: dãy núi xếp lớp, sau trước
    rng = [(80, 34.5, 1), (84, 33, .95), (88, 32.6, .9), (92, 33, .8), (77, 34.5, .9), (76, 33, 1.05), (79, 31.5, 1.15), (83, 29.8, 1.2), (87, 28.4, 1.3), (91, 28.2, 1.2), (95, 28.6, 1.05), (99, 27.4, .85), (100, 32, .76), (103, 34, .62)]
    tall = [ll(lo, la) + (s_,) for lo, la, s_ in rng]
    for i, (x, y, s_) in enumerate(sorted(tall, key=lambda t: t[1])):
        o += peak(x, y, s_, i)
    block = [(0, 400, 240, 490), (30, 520, 340, 720), (380, 380, 620, 580), (530, 190, 760, 390), (0, 0, 380, 70), (1040, 220, 1230, 420)]
    grove = []
    # rừng theo vùng thật: lá rộng ở Hoa Nam và Đông Nam Á, thông ở phương Bắc
    for lo, la, n_, sp, ki in ((112, 26, 9, 54, 0), (118, 31, 7, 44, 0), (105, 29, 8, 46, 0), (110, 34, 6, 40, 0), (101, 13, 8, 44, 0), (103, 20, 9, 40, 0), (114, 1, 6, 50, 0), (122, 16, 4, 24, 0), (79, 18, 8, 56, 0), (84, 24, 7, 50, 0), (122, 43, 9, 52, 1), (130, 45, 7, 46, 1), (113, 45, 6, 60, 1), (127, 37, 4, 20, 1), (137.5, 37, 4, 20, 1), (142, 43, 3, 14, 1)):
        cx, cy = ll(lo, la); c_ = 0; tries = 0
        while c_ < n_ and tries < 80:
            tries += 1
            x, y = cx + R.gauss(0, sp), cy + R.gauss(0, sp * .55)
            if land.buffer(-9).contains(Point(x, y)) and not any(a_ < x < c2 and b_ < y < d2 for a_, b_, c2, d2 in block):
                grove.append((x, y, ki)); c_ += 1
    for x, y, ki in sorted(grove, key=lambda t: t[1]):
        s_ = R.uniform(.5, .72)
        o += V.sway((fir(x, y, s_) if ki else broadleaf(x, y, s_, R.randint(0, 2))), x, y, 4.6 + (int(x) % 5) * .4, (int(x) % 7) * .5)
    pos = {'vn': ll(106, 16), 'china': conv(*a['lm']['Vạn Lý Trường Thành']['xy']), 'japan': conv(*a['lm']['Núi Phú Sĩ']['xy'])}
    pads = {'vn': (490, 470), 'china': (640, 300), 'japan': (1130, 330)}
    # đường bay nối các nơi và các nơi ngoài khung
    st = 'fill="none" stroke="#FFF9EA" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round"'
    for p_, q_, b_ in ((pads['vn'], pads['china'], 60), (pads['china'], pads['japan'], -70), (pos['vn'], (1040, 656), 0), (pads['japan'], (1176, 470), 20), (pads['china'], (120, 420), 70), (pads['china'], (120, 170), -40)):
        o += '<path d="M%d %dQ%d %d %d %d" %s/>' % (p_[0], p_[1], (p_[0] + q_[0]) / 2, (p_[1] + q_[1]) / 2 + b_, q_[0], q_[1], st)
    # quần đảo Việt Nam, đúng quy ước src/shared/vnMap.ts
    for nm, lo, la in (('Hoàng Sa', 112, 16.5), ('Trường Sa', 114, 10)):
        x, y = ll(lo, la)
        for dx, dy in ((0, 0), (9, 6), (-7, 8), (5, -7)): o += '<circle cx="%d" cy="%d" r="2.4" fill="#F2DDA6" stroke="#2A6A4A"/>' % (x + dx, y + dy)
        o += '<text x="%d" y="%d" font-family="Be Vietnam Pro" font-weight="700" font-size="13" fill="#FFF9EA" stroke="#0B5A6A" stroke-width="3" paint-order="stroke">%s</text>' % (x + 16, y + 5, nm)
    # chấm vị trí thật, đường chỉ tới bệ
    for k in pos:
        ax, ay = pos[k]; x, y = pads[k]
        o += '<path d="M%d %dL%d %d" stroke="#D32F2F" stroke-width="2.6" stroke-dasharray="2 7" stroke-linecap="round"/><circle cx="%d" cy="%d" r="6.5" fill="#D32F2F" stroke="#FFF9EA" stroke-width="2.6"/>' % (ax, ay, x, y, ax, ay)
    # máy bay dưới bệ và nhãn: cất cánh từ sau công trình, không đè lên chữ
    o += planes(((pads['vn'], pads['china'], 60, 26, 0), (pads['china'], pads['japan'], -70, 30, 12), (pads['japan'], (1176, 470), 20, 18, 5), (pads['china'], (120, 170), -40, 34, 20)))
    ch, cw = place('w-02-china.json'), None
    jp, jw = place('w-01-japan.json')
    o += G.pad(pads['vn'][0], pads['vn'][1] - 16, 'hanoi-turtle-tower', 170) + done_flag(pads['vn'][0] + 58, pads['vn'][1] + 6) + V.label(pads['vn'][0], pads['vn'][1] + 62, 'Việt Nam')
    o += lm_wall(*pads['china']) + done_flag(pads['china'][0] + 62, pads['china'][1]) + V.label(pads['china'][0], pads['china'][1] + 54, ch[0]['vi'])
    o += lm_fuji(*pads['japan']) + V.label(pads['japan'][0], pads['japan'][1] + 54, jp['vi'], hot=True) + V.kitsu(pads['japan'][0] + 40, pads['japan'][1] + 18, 62, 'ehappy', 'walk')
    for f, x, y, ang in (('w-05-france.json', 120, 150, 205), ('w-04-kenya.json', 120, 440, 165), ('w-03-australia.json', 1060, 676, 45), ('w-06-usa.json', 1180, 490, 0)):
        o += edge_chip(x, y, place(f)[0]['vi'], ang)
    o += V.driftcloud(70, .7, 110, 30, False)
    V.write('PAsia', 'Kids World, tầng 2 Các nước', 1280, 720, CSS + '<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="Bản đồ châu Á cho bé, không vẽ biên giới, có Trung Quốc, Nhật Bản và lối đi tới các nước khác"><defs>' + V.DEFS + HG + '</defs>' + o + '<rect width="1280" height="720" filter="url(#grain)" opacity=".3"/></svg>' + hud_map('Tầng 2 Các nước', jp['vi'], html.escape('%s, %d từ' % (jp['landmarkVi'], jw)), 'Vào ' + jp['vi']) + '</div>')

def add_canvas():
    # đọc lại ngay trước khi ghi: các phần việc khác cũng ghi file này
    p = os.path.join(OUT, 'canvas.json')
    raw = open(p, encoding='utf-8').read()
    c = json.loads(raw)
    items = [('PHcmc', 'Cảnh · TP. Hồ Chí Minh'), ('PCantho', 'Cảnh · Cần Thơ'), ('PPhuquoc', 'Cảnh · Phú Quốc'), ('PAsia', 'Bản đồ · Tầng 2 Các nước'), ('PEarth', 'Bản đồ · Tầng 3 Trái Đất')]
    for i, (n, t) in enumerate(items):
        k = n + '.dc.html'
        c['boards'][k] = {'h': 720, 'title': t, 'w': 1280, 'x': i * 1360, 'y': -6980}
        if k not in c['order']: c['order'].append(k)
    open(p, 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii='\\u' in raw, indent=2 if raw.lstrip()[:3] == '{\n ' else None))


if __name__ == '__main__':
    phcmc(); pcantho(); pphuquoc(); pasia(); add_canvas(); print('ok')
