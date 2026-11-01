# Cảnh địa điểm tầng 2: ÚC (australia, bảng PAustralia). Chuẩn r5f, docs/22 §12.
#   BOARD_OUT=<project> PYTHONIOENCODING=utf-8 python gen_places_australia.py
# 5 biển bước học (G.bubble): Chuột túi, Gấu koala, Con kiến, Con ếch, Thiên nga đen. Ong và ốc sên vẽ làm chi tiết nhỏ.
# Đài Con Sò (Sydney) chỉ là nền xa nhỏ: kỳ quan riêng thuộc tầng 3.
import math, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('BOARD_OUT') or '.'
sys.argv = ['x', OUT, 'C:/Users/01217/AppData/Local/Temp/vn/vn_merged.json']
sys.path.insert(0, HERE)
import gen_review2 as G
V = G.V
R = random.Random(61)
INK = '#2A1810'

CSS = """<style>
@keyframes hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.hop{animation:hop 3.6s ease-in-out infinite}
@keyframes ear{0%,86%,100%{transform:rotate(0)}92%{transform:rotate(-14deg)}}
.ear{animation:ear 5s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom center}
@keyframes buzz{0%{transform:translate(0,0)}25%{transform:translate(14px,-8px)}50%{transform:translate(4px,-16px)}75%{transform:translate(-12px,-6px)}100%{transform:translate(0,0)}}
.buzz{animation:buzz var(--t,3s) ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes ring{0%{transform:scale(.6);opacity:.7}100%{transform:scale(1.5);opacity:0}}
.ring{animation:ring 3.6s ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
@keyframes ant{0%{transform:translate(0,0)}100%{transform:translate(var(--dx,40px),var(--dy,-6px))}}
.ant{animation:ant var(--t,6s) linear infinite alternate}
@keyframes shim{0%,100%{opacity:.3}50%{opacity:.7}}
.shim{animation:shim 4s ease-in-out infinite;animation-delay:var(--d,0s)}
@media (prefers-reduced-motion:reduce){.hop,.ear,.buzz,.ring,.ant,.shim{animation:none}}
</style>"""
HG = '<radialGradient id="hg"><stop offset="0" stop-color="#FFD27A" stop-opacity=".85"/><stop offset=".5" stop-color="#FFAE4A" stop-opacity=".3"/><stop offset="1" stop-color="#FFAE4A" stop-opacity="0"/></radialGradient>'

def lin(id_, stops, x2=0, y2=1):
    return '<linearGradient id="%s" x1="0" y1="0" x2="%s" y2="%s">' % (id_, x2, y2) + ''.join('<stop offset="%s" stop-color="%s"/>' % s for s in stops) + '</linearGradient>'

def page(name, title, aria, defs, o, place):
    hud = '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về bản đồ</span><span class="pill">%s</span></div>' % place
    V.write(name, title, 1280, 720, CSS + '<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="%s"><defs>' % aria + V.DEFS + HG + defs + '</defs>' + o + '<rect width="1280" height="720" filter="url(#grain)" opacity=".25"/></svg>' + hud + '</div>')

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

# ---------- chi tiết ----------
def gum(x, y, h, lean=0, s=1, dark=False):
    """Bạch đàn: thân trắng kem bong vỏ, cành cong, tán lá hình lưỡi liềm rủ xuống."""
    tx = x + lean
    bark = '#8A7A68' if dark else '#E9DFC8'
    sh = '#5E5040' if dark else '#B9A98A'
    w = 15 * s
    o = '<path d="M%.0f %dQ%.0f %.0f %.0f %.0fL%.0f %.0fQ%.0f %.0f %.0f %dZ" fill="%s" stroke="%s" stroke-width="1.6"/>' % (x - w, y, x - w * .6 + lean * .1, y - h * .55, tx - w * .45, y - h, tx + w * .45, y - h, x + w * .6 + lean * .1, y - h * .55, x + w, y, bark, INK)
    o += '<path d="M%.0f %dQ%.0f %.0f %.0f %.0fL%.0f %.0fQ%.0f %.0f %.0f %dZ" fill="%s" opacity=".5"/>' % (x + w * .15, y, x + w * .25 + lean * .1, y - h * .55, tx + w * .1, y - h, tx + w * .45, y - h, x + w * .6 + lean * .1, y - h * .55, x + w, y, sh)
    for _ in range(int(h / 22)):
        py = R.randint(int(y - h * .9), y - 4); px = x + (tx - x) * (y - py) / h + R.uniform(-w * .6, w * .6)
        o += '<path d="M%.0f %dq%.1f %d %.1f %d" stroke="%s" stroke-width="1.3" fill="none" opacity=".75"/>' % (px, py, R.uniform(-3, 3), R.randint(6, 12), R.uniform(-3, 3), R.randint(14, 26), sh)
    crown = ''
    top = y - h
    for sg, bx, by in ((-1, 110, 60), (1, 120, 70), (-1, 60, 120), (1, 70, 125), (-1, 20, 150), (1, 24, 150)):
        crown += '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0f" stroke="%s" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (tx, top + 18 * s, tx + sg * bx * s * .4, top - by * s * .2, tx + sg * bx * s, top - by * s * .5, sh, 6 * s)
    pal = ['#4E7E62', '#5E9272', '#7DAE86', '#3E6A52', '#9CC49A'] if not dark else ['#2E5040', '#3A6450', '#274638']
    for _ in range(int(120 * s)):
        a, r_ = R.uniform(0, 6.28), R.uniform(0, 1) ** .6
        cx, cy = tx + math.cos(a) * r_ * 130 * s, top - 30 * s + math.sin(a) * r_ * 70 * s
        c_ = R.choice(pal)
        rot = R.randint(-70, 70)
        crown += '<path d="M0 0Q%.0f %.0f %.0f %.0f Q%.0f %.0f 0 0Z" fill="%s" stroke="#2E4A38" stroke-width=".6" transform="translate(%.0f %.0f) rotate(%d)"/>' % (9 * s, 12 * s, 3 * s, 34 * s, -4 * s, 14 * s, c_, cx, cy, rot)
    return o + V.sway(crown, tx, top, 5.4 + (x % 5) * .3, (x % 7) * .4)

def spin(x, y, s=1, c='#C9B25A'):
    """Cỏ spinifex: gò gai vàng."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="0" rx="22" ry="4" fill="#5A2A14" opacity=".3"/>' % (x, y, s)
    for k in range(17):
        a = math.radians(-170 + k * 160 / 16); l = R.uniform(18, 30)
        o += '<path d="M0 -2Q%.0f %.0f %.0f %.0f" stroke="%s" stroke-width="1.6" fill="none" stroke-linecap="round"/>' % (math.cos(a) * l * .5, math.sin(a) * l * .9, math.cos(a) * l, math.sin(a) * l * .8 + 4, c if k % 3 else '#A8923E')
    return o + '</g>'

def rock(x, y, w, h, c='#B8532E', c2='#8E3A22'):
    return '<path d="M%d %dQ%d %d %d %dQ%d %d %d %dZ" fill="%s" stroke="%s" stroke-width="1.4"/><path d="M%d %dQ%d %d %d %d" fill="none" stroke="#E08A5A" stroke-width="2" opacity=".6"/>' % (x - w / 2, y, x - w * .4, y - h * 1.3, x, y - h, x + w * .4, y - h * 1.2, x + w / 2, y, c, INK, x - w * .3, y - h * .5, x - w * .15, y - h * .95, x + w * .05, y - h * .9)

def uluru(x, y, w, h, c1='#C45A30', c2='#8E3A28', op=1):
    d = 'M%d %dC%d %d %d %d %d %dC%d %d %d %d %d %dL%d %dZ' % (x - w / 2, y, x - w * .46, y - h * .55, x - w * .3, y - h * .95, x - w * .12, y - h, x + w * .1, y - h * 1.02, x + w * .34, y - h * .92, x + w * .46, y - h * .5, x + w / 2, y)
    o = '<g opacity="%.2f"><path d="%s" fill="%s"/>' % (op, d, c1)
    o += '<path d="M%d %dC%d %d %d %d %d %dL%d %dZ" fill="%s" opacity=".55"/>' % (x + w * .1, y - h, x + w * .34, y - h * .92, x + w * .46, y - h * .5, x + w / 2, y, x + w * .1, y, c2)
    for k in range(5):
        o += '<path d="M%.0f %.0fq%.0f %.0f %.0f %.0f" stroke="%s" stroke-width="1.4" fill="none" opacity=".5"/>' % (x - w * .3 + k * w * .16, y - h * (.8 - k * .08), w * .03, h * .3, w * .02, h * (.7 - k * .05), c2)
    return o + '</g>'

def opera(x, y, s=1):
    """Đài Con Sò thu nhỏ ở xa: vài cánh buồm trắng chồng nhau trên bục."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><rect x="-70" y="-6" width="140" height="10" fill="#D8CDB8" stroke="%s" stroke-width="1.4"/>' % (x, y, s, INK)
    for cx, h, w, c in ((-44, 40, 32, '#FFF9EA'), (-14, 54, 38, '#FFFFFF'), (20, 62, 44, '#FFF9EA'), (52, 36, 28, '#F4EEDC')):
        o += '<path d="M%d -6Q%d %d %d %dQ%d %d %d -6Z" fill="%s" stroke="%s" stroke-width="1.4"/>' % (cx - w / 2, cx - w / 2, -h * .9, cx + w * .1, -h, cx + w * .5, -h * .4, cx + w / 2, c, INK)
        o += '<path d="M%d -6Q%d %d %d %d" stroke="#CDBFA4" stroke-width="1" fill="none"/>' % (cx, cx - 2, -h * .5, cx + w * .1, -h * .96)
    return o + '</g>'

def boat(x, y, s=1, c='#E2483E'):
    return '<g class="rock"><g transform="translate(%d %d) scale(%.2f)"><path d="M-24 0L24 0L16 9H-16Z" fill="#F4EEDC" stroke="%s" stroke-width="1.4"/><path d="M0 -4V-46L24 -8Z" fill="%s" stroke="%s" stroke-width="1.2"/><path d="M-3 -6V-36L-18 -6Z" fill="#FFF9EA" stroke="%s" stroke-width="1.2"/></g></g>' % (x, y, s, INK, c, INK, INK)

def kangaroo(x, y, s=1, flip=False):
    """Chuột túi đỏ đứng, nhìn sang trái: tai dài, chân sau to, đuôi dày chống đất."""
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s)
    o += '<ellipse cx="14" cy="2" rx="86" ry="9" fill="#3A1408" opacity=".35"/>'
    body, belly, dk = '#D9784A', '#F2D2A8', '#A9532E'
    # đuôi
    o += '<path d="M34 -64Q96 -40 124 -4Q104 6 78 -2Q44 -14 22 -34Z" fill="%s" stroke="%s" stroke-width="1.8"/>' % (dk, INK)
    # chân sau
    o += '<path d="M6 -92Q42 -92 56 -56Q60 -30 44 -12L58 -6V2H18L12 -10Q-2 -30 -6 -56Z" fill="%s" stroke="%s" stroke-width="1.8"/>' % (body, INK)
    o += '<path d="M20 -34Q42 -34 46 -16L58 -4" stroke="%s" stroke-width="2" fill="none" opacity=".5"/>' % dk
    o += '<path d="M10 2H64" stroke="%s" stroke-width="4" stroke-linecap="round"/>' % INK
    # thân + bụng
    o += '<path d="M-26 -150Q-44 -120 -30 -92Q-10 -50 26 -56Q56 -76 40 -120Q22 -150 -10 -158Z" fill="%s" stroke="%s" stroke-width="1.8"/>' % (body, INK)
    o += '<path d="M-26 -126Q-40 -100 -22 -84Q-4 -64 14 -70Q4 -96 -4 -124Z" fill="%s" opacity=".95"/>' % belly
    # túi (có em bé thò đầu)
    o += '<path d="M-14 -82Q0 -64 18 -72" stroke="%s" stroke-width="2" fill="none"/><circle cx="0" cy="-80" r="9" fill="#E8A074" stroke="%s" stroke-width="1.4"/><path d="M-4 -88l-3 -9l7 5" fill="#E8A074" stroke="%s" stroke-width="1.2"/><circle cx="-3" cy="-81" r="1.6" fill="%s"/>' % (dk, INK, INK, INK)
    # tay trước
    o += '<path d="M-24 -118Q-46 -108 -50 -92" stroke="%s" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-50 -92l-4 4M-50 -92l1 5" stroke="%s" stroke-width="2"/>' % (body, INK)
    # cổ + đầu
    o += '<path d="M-24 -150Q-34 -170 -30 -184L-6 -186Q4 -170 6 -150Z" fill="%s" stroke="%s" stroke-width="1.8"/>' % (body, INK)
    o += '<path d="M-30 -190Q-44 -196 -58 -184Q-64 -178 -56 -174L-34 -170Q-14 -166 -6 -176L-4 -190Z" fill="%s" stroke="%s" stroke-width="1.8"/>' % (body, INK)
    o += '<ellipse cx="-60" cy="-182" rx="4.6" ry="3.4" fill="#2A1810"/><path d="M-50 -170Q-38 -166 -26 -170" stroke="#F2D2A8" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>'
    o += '<circle cx="-30" cy="-184" r="4.4" fill="#2A1810"/><circle cx="-31" cy="-185.4" r="1.4" fill="#fff"/>'
    o += '<g class="ear"><path d="M-14 -190Q-12 -226 2 -234Q14 -216 4 -188Z" fill="%s" stroke="%s" stroke-width="1.8"/><path d="M-6 -194Q-5 -216 1 -224Q6 -212 1 -194Z" fill="#F2B0A0"/></g>' % (body, INK)
    o += '<path d="M-4 -186Q10 -214 20 -214Q22 -196 4 -184Z" fill="%s" stroke="%s" stroke-width="1.6" opacity=".95"/>' % (dk, INK)
    return o + '</g>'

def koala(x, y, s=1):
    """Koala ôm cành: tai tròn lông trắng, mũi đen to."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<ellipse cx="0" cy="26" rx="40" ry="38" fill="#8E8F96" stroke="%s" stroke-width="1.6"/><ellipse cx="2" cy="32" rx="22" ry="26" fill="#C8C8CC"/>' % INK
    o += '<path d="M-26 26Q-36 44 -30 60" stroke="#7A7B84" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M26 22Q38 40 30 58" stroke="#7A7B84" stroke-width="11" fill="none" stroke-linecap="round"/>'
    o += '<circle cx="0" cy="-12" r="29" fill="#9A9BA2" stroke="%s" stroke-width="1.6"/>' % INK
    for sx in (-1, 1):
        o += '<circle cx="%d" cy="-30" r="17" fill="#8E8F96" stroke="%s" stroke-width="1.6"/><circle cx="%d" cy="-30" r="10" fill="#EDEAE6"/><path d="M%d -36q%d 4 0 12" stroke="#C6C2BC" stroke-width="1.4" fill="none"/>' % (sx * 27, INK, sx * 27, sx * 27 - sx * 3, sx * 3)
    o += '<circle cx="-10" cy="-15" r="3.6" fill="#1A1210"/><circle cx="10" cy="-15" r="3.6" fill="#1A1210"/><circle cx="-11" cy="-16.2" r="1.2" fill="#fff"/><circle cx="9" cy="-16.2" r="1.2" fill="#fff"/>'
    o += '<ellipse cx="0" cy="-3" rx="8" ry="11" fill="#2A1E1C" stroke="%s" stroke-width="1.2"/><ellipse cx="-2.4" cy="-7" rx="2.2" ry="3" fill="#6A5A58" opacity=".7"/>' % INK
    o += '<path d="M-4 12Q0 17 4 12" stroke="#1A1210" stroke-width="1.6" fill="none"/>'
    o += '<path d="M-33 40Q-44 36 -42 50M33 40Q44 36 42 50" stroke="#2A2220" stroke-width="3" fill="none" stroke-linecap="round"/>'
    return o + '</g>'

def swan(x, y, s=1, flip=False):
    """Thiên nga đen: mình đen, cổ cong chữ S, mỏ đỏ đầu trắng, lông cánh trắng ở mép."""
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s)
    for k in range(3):
        o += '<ellipse class="ring" style="--d:-%.1fs" cx="0" cy="8" rx="52" ry="10" fill="none" stroke="#E8F6F2" stroke-width="2"/>' % (k * 1.2)
    o += '<ellipse cy="6" rx="46" ry="8" fill="#0F3A4A" opacity=".35"/>'
    o += '<path d="M-44 -4Q-40 -26 -6 -26Q30 -30 48 -22Q44 6 14 8H-30Q-44 6 -44 -4Z" fill="#26242C" stroke="%s" stroke-width="1.6"/>' % INK
    o += '<path d="M-6 -22Q14 -30 40 -22Q34 -10 10 -6Q-8 -8 -6 -22Z" fill="#3A3640"/><path d="M-6 -22Q14 -30 40 -22" stroke="#F4EEDC" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M8 -26Q22 -30 36 -23" stroke="#fff" stroke-width="1.4" fill="none" opacity=".7"/>'
    o += '<path d="M-34 -14Q-52 -34 -40 -62Q-30 -84 -40 -96" stroke="#26242C" stroke-width="10" fill="none" stroke-linecap="round"/>'
    o += '<ellipse cx="-44" cy="-98" rx="10" ry="8.4" fill="#26242C" stroke="%s" stroke-width="1.4"/>' % INK
    o += '<path d="M-52 -102Q-66 -100 -68 -94Q-60 -88 -50 -92Z" fill="#E2483E" stroke="%s" stroke-width="1.2"/><path d="M-62 -101q-3 5 0 9" stroke="#fff" stroke-width="2.4" fill="none"/>' % INK
    o += '<circle cx="-46" cy="-100" r="2.2" fill="#FFF3B0"/><circle cx="-46" cy="-100" r="1" fill="%s"/>' % INK
    return o + '</g>'

def frog(x, y, s=1):
    """Ếch xanh (green tree frog) ngồi trên lá sen."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="6" rx="26" ry="5" fill="#0F3A2A" opacity=".35"/>' % (x, y, s)
    o += '<path d="M-22 4Q-30 -12 -14 -14Q-4 -4 4 4Z" fill="#6FBE52" stroke="%s" stroke-width="1.5"/><path d="M22 4Q30 -12 14 -14Q4 -4 -4 4Z" fill="#6FBE52" stroke="%s" stroke-width="1.5"/>' % (INK, INK)
    o += '<path d="M-20 4Q-26 -22 0 -26Q26 -22 20 4Z" fill="#7FD65A" stroke="%s" stroke-width="1.6"/><path d="M-10 4Q0 -6 10 4" fill="#E8F6B8" opacity=".9"/>' % INK
    o += '<circle cx="-9" cy="-28" r="7.6" fill="#7FD65A" stroke="%s" stroke-width="1.5"/><circle cx="9" cy="-28" r="7.6" fill="#7FD65A" stroke="%s" stroke-width="1.5"/>' % (INK, INK)
    o += '<circle cx="-9" cy="-28" r="4.6" fill="#FFF3B0"/><circle cx="9" cy="-28" r="4.6" fill="#FFF3B0"/><ellipse cx="-9" cy="-28" rx="1.5" ry="3.4" fill="%s"/><ellipse cx="9" cy="-28" rx="1.5" ry="3.4" fill="%s"/>' % (INK, INK)
    o += '<path d="M-9 -12Q0 -7 9 -12" stroke="%s" stroke-width="1.6" fill="none" stroke-linecap="round"/>' % INK
    o += '<path d="M-17 5l-6 5l8 -1M17 5l6 5l-8 -1" stroke="%s" stroke-width="1.6" fill="#6FBE52"/>' % INK
    return o + '</g>'

def pad(x, y, rx=26, flower=False):
    o = '<ellipse cx="%d" cy="%d" rx="%d" ry="%.1f" fill="#2F8A4A" stroke="#14502C" stroke-width="1.2"/><path d="M%d %dL%d %d" stroke="#14502C" stroke-width="1.2"/><ellipse cx="%d" cy="%d" rx="%d" ry="%.1f" fill="#4FB45C" opacity=".6"/>' % (x, y, rx, rx * .26, x, y, x + rx * .8, y - rx * .1, x - rx * .1, y - 2, rx * .6, rx * .14)
    if flower:
        for a_ in (-50, -20, 0, 20, 50):
            o += '<ellipse cx="%d" cy="%d" rx="4" ry="9" fill="#F8B8D8" stroke="#B8508A" stroke-width=".8" transform="rotate(%d %d %d)"/>' % (x, y - 12, a_, x, y - 3)
        o += '<circle cx="%d" cy="%d" r="3" fill="#FFD84A"/>' % (x, y - 4)
    return o

def reeds(x, y, n=9, h=70):
    o = ''
    for k in range(n):
        xx = x + k * 7 + R.randint(-3, 3); hh = h * R.uniform(.6, 1.1)
        o += '<path d="M%d %dQ%d %d %d %d" stroke="%s" stroke-width="2.4" fill="none" stroke-linecap="round"/>' % (xx, y, xx + R.randint(-6, 6), y - hh * .6, xx + R.randint(-14, 14), y - hh, R.choice(['#5E8A3C', '#7BA04A', '#4A7A34']))
    cx = x + 20
    o += '<path d="M%d %dV%d" stroke="#4A7A34" stroke-width="2.2"/><rect x="%d" y="%d" width="7" height="22" rx="3.5" fill="#7A4A2A" stroke="%s"/>' % (cx, y, y - h * 1.15, cx - 3.5, y - h * 1.15 - 18, INK)
    return V.sway(o, x + 30, y, 3.6 + (x % 4) * .3, (x % 5) * .4)

def mound(x, y, s=1):
    """Gò mối cao của kiến/mối: đất đỏ có rãnh, kiến bò thành vệt."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="2" rx="62" ry="8" fill="#3A1408" opacity=".35"/>' % (x, y, s)
    o += '<path d="M-52 0Q-46 -30 -30 -52Q-20 -96 -8 -118Q0 -130 8 -116Q22 -92 30 -54Q48 -30 54 0Z" fill="#B8602E" stroke="%s" stroke-width="1.8"/>' % INK
    o += '<path d="M10 -112Q24 -90 30 -54Q48 -30 54 0H20Q26 -40 12 -70Z" fill="#8E3E20" opacity=".6"/>'
    for k in range(9):
        yy = -6 - k * 12; o += '<path d="M%d %dq%d %d %d %d" stroke="#7A3418" stroke-width="1.4" fill="none" opacity=".7"/>' % (-34 + k * 3 + R.randint(-3, 3), yy, 10, R.randint(-5, 2), 26 - k * 2, R.randint(-4, 3))
    o += '<path d="M-22 -22Q-8 -30 4 -20Q-6 -12 -22 -22Z" fill="#4A1E10"/>'
    return o + '</g>'

def ants(x, y):
    """Đàn kiến nhỏ bò dọc đường đất."""
    o = ''
    for k in range(7):
        o += '<g class="ant" style="--dx:%dpx;--dy:%dpx;--t:%.1fs;animation-delay:-%.1fs"><g transform="translate(%d %d)"><circle cx="0" cy="0" r="2.4" fill="%s"/><circle cx="4" cy="0" r="1.9" fill="%s"/><circle cx="-4" cy="0" r="2" fill="%s"/><path d="M-3 1l-3 4M0 1l0 4M3 1l3 4M-3 -1l-3 -3M3 -1l3 -3" stroke="%s" stroke-width=".8"/></g></g>' % (R.randint(-40, 50), R.randint(-6, 8), R.uniform(4, 8), R.uniform(0, 6), x + k * 13, y + (k % 3) * 4, INK, INK, INK, INK)
    return o

def big_ant(x, y, s=1):
    """Một con kiến đen to dễ nhìn, nhìn nghiêng."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="9" rx="26" ry="3.4" fill="#3A1408" opacity=".35"/>' % (x, y, s)
    o += '<path d="M-12 -4l-8 12M0 -4l0 12M12 -4l8 12M-12 -6l-10 -8M12 -6l10 -8" stroke="%s" stroke-width="2" fill="none" stroke-linecap="round"/>' % INK
    o += '<ellipse cx="-16" cy="-6" rx="11" ry="8" fill="#3A2E2A" stroke="%s" stroke-width="1.2"/><ellipse cx="0" cy="-6" rx="7" ry="6" fill="#4A3C36" stroke="%s" stroke-width="1.2"/><circle cx="12" cy="-8" r="7" fill="#3A2E2A" stroke="%s" stroke-width="1.2"/>' % (INK, INK, INK)
    o += '<circle cx="15" cy="-10" r="1.8" fill="#fff"/><path d="M16 -14Q22 -24 28 -22M14 -14Q16 -26 22 -28" stroke="%s" stroke-width="1.4" fill="none"/>' % INK
    return o + '</g>'

def wattle(x, y, s=1):
    """Bụi keo vàng (quốc hoa Úc) với ong bay."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    br = ''
    for k in range(7):
        a = math.radians(-150 + k * 20)
        ex, ey = math.cos(a) * 66, math.sin(a) * 56
        br += '<path d="M0 0Q%.0f %.0f %.0f %.0f" stroke="#5E7A3A" stroke-width="3" fill="none"/>' % (ex * .4, ey * .9, ex, ey)
        for j in range(6):
            t = (j + 2) / 8
            br += '<circle cx="%.0f" cy="%.0f" r="%.1f" fill="%s" stroke="#C99A1A" stroke-width=".6"/>' % (ex * t + R.uniform(-5, 5), ey * t + R.uniform(-5, 5), R.uniform(4, 7.5), R.choice(['#FFD83A', '#F8C81A', '#FFE86A']))
        br += '<path d="M%.0f %.0fq-10 10 -22 6" stroke="#6E9A48" stroke-width="2" fill="none"/>' % (ex * .5, ey * .5)
    o += V.sway(br, 0, 0, 4, (x % 5) * .5) + '</g>'
    return o

def bee(x, y, s=1, t=3, d=0):
    return '<g class="buzz" style="--t:%.1fs;--d:-%.1fs"><g transform="translate(%d %d) scale(%.2f)"><ellipse cx="-3" cy="-7" rx="6" ry="3.4" fill="#EAF6FF" stroke="#8AA4B4" stroke-width=".8" opacity=".85"/><ellipse cx="4" cy="-8" rx="6" ry="3.4" fill="#EAF6FF" stroke="#8AA4B4" stroke-width=".8" opacity=".85"/><ellipse rx="9" ry="6" fill="#FFC81A" stroke="%s" stroke-width="1.2"/><path d="M-3 -5V5M2 -5.4V5.4" stroke="%s" stroke-width="2.4"/><circle cx="8" cy="-1" r="3.6" fill="#3A2A18"/><path d="M-9 0l-4 1" stroke="%s" stroke-width="1.6"/></g></g>' % (t, d, x, y, s, INK, INK, INK)

def snail(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<path d="M-26 0Q-28 -9 -18 -9H12Q30 -10 32 -24Q36 -34 30 -34Q26 -22 14 -16Q-18 -16 -26 0Z" fill="#E8C8A0" stroke="%s" stroke-width="1.4"/>' % INK
    o += '<path d="M30 -32l-3 -12M34 -30l5 -10" stroke="%s" stroke-width="1.6"/><circle cx="26.6" cy="-45" r="2.2" fill="%s"/><circle cx="39.4" cy="-41" r="2.2" fill="%s"/>' % (INK, INK, INK)
    o += '<circle cx="-4" cy="-18" r="17" fill="#C07A3C" stroke="%s" stroke-width="1.6"/><path d="M-4 -18m-11 0a11 11 0 1 1 11 11a7 7 0 1 1 -7 -7a3 3 0 1 1 3 3" fill="none" stroke="#6E3A18" stroke-width="2"/><path d="M-14 -28Q-6 -34 4 -30" stroke="#F0B878" stroke-width="2" fill="none" opacity=".7"/>' % INK
    return o + '</g>'

def pea(x, y, s=1):
    """Sturt's desert pea: hoa đỏ có mắt đen, hoa dại sa mạc."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><path d="M0 0V-14" stroke="#5E7A3A" stroke-width="2"/>' % (x, y, s)
    for a_ in (-60, -30, 0, 30, 60):
        o += '<path d="M0 -14Q%.0f -26 %.0f -30Q%.0f -22 0 -14Z" fill="#D8282E" stroke="#7A1018" stroke-width=".8" transform="rotate(%d 0 -14)"/>' % (-6, 0, 6, a_)
    return o + '<circle cx="0" cy="-17" r="3.4" fill="#2A1010"/></g>'

def fence(x0, y0, x1, y1, n=9):
    o = ''
    for k in range(n):
        t = k / (n - 1); x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t
        o += '<path d="M%.0f %.0fV%.0f" stroke="#6A4630" stroke-width="3.6"/>' % (x, y, y - 24)
    for dy in (-8, -18):
        o += '<path d="M%d %dL%d %d" stroke="#8A5E40" stroke-width="2"/>' % (x0, y0 + dy, x1, y1 + dy)
    return o

def windmill(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)"><path d="M-14 0L-4 -84H4L14 0M-10 -22H10M-7 -48H7" stroke="#6A5A4A" stroke-width="2.4" fill="none"/>' % (x, y, s)
    blades = ''.join('<path d="M0 0L%.0f %.0fL%.0f %.0fZ" fill="#C8C2B8" stroke="#6A5A4A" stroke-width=".8" transform="rotate(%d)"/>' % (-3, -34, 3, -34, a_) for a_ in range(0, 360, 45))
    return o + '<g transform="translate(0 -88)"><g class="spin" style="animation-duration:14s">' + blades + '</g></g></g>'

# ---------- cảnh ----------
def paustralia():
    d = (lin('skA', [('0', '#3E86D0'), ('.45', '#8CC4E8'), ('.8', '#FFE2B0'), ('1', '#FFC890')]) + lin('wtA', [('0', '#9ADCE8'), ('.4', '#3FA8C0'), ('1', '#1E7C98')])
         + lin('grA', [('0', '#D9733E'), ('.5', '#C65A30'), ('1', '#A8441F')]) + '<clipPath id="wclip"><path d="M0 332H520Q552 400 520 470Q490 560 556 640Q574 690 612 720H0Z"/></clipPath>')
    o = '<rect width="1280" height="350" fill="url(#skA)"/><circle cx="760" cy="150" r="190" fill="url(#hg)"/><circle cx="760" cy="150" r="42" fill="#FFF3C0"/><circle cx="760" cy="150" r="32" fill="#FFE27A"/>'
    for x, y, w_ in ((250, 80, 300), (620, 54, 250), (1100, 100, 320), (1000, 220, 190), (430, 190, 190)): o += cloud(x, y, w_, '#FFFFFF', '#CFE4F2', .9)
    o += V.flock(170, 56, 20, .32)
    # đồi xa + Uluru
    o += '<path d="M500 336Q620 306 760 322Q880 310 1020 322Q1160 308 1280 326V340H500Z" fill="#8E9CC4" opacity=".7"/>'
    o += uluru(780, 340, 280, 44, '#C85E34', '#8E3A28') + '<path d="M650 338H910" stroke="#E8A878" stroke-width="3" opacity=".4"/>'
    # bờ xa bên kia vịnh + Đài Con Sò nhỏ
    o += '<path d="M0 330Q60 316 130 324Q220 308 300 322Q420 314 520 332H0Z" fill="#6FA070" stroke="#3E6A4A" stroke-width="1"/>'
    o += '<path d="M60 322Q200 312 330 324L336 332H40Z" fill="#8EC080"/>'
    for x, y, s_ in ((40, 330, .5), (96, 328, .45), (380, 330, .5), (460, 332, .42)): o += '<g style="filter:brightness(.85)">' + gum(x, y, 60, 4, s_) + '</g>'
    o += opera(250, 326, .52)
    # nước vịnh
    o += '<g clip-path="url(#wclip)"><rect y="326" width="620" height="394" fill="url(#wtA)"/>'
    o += '<path d="M0 340H520" stroke="#E8F8FA" stroke-width="2" opacity=".5"/>'
    for _ in range(150):
        y = R.randint(340, 716); x = R.randint(0, 600); w_ = R.randint(14, 70) * (.4 + (y - 330) / 400)
        o += '<path class="lap" style="--t:%.1fs;--d:-%.1fs" d="M%d %dh%d" stroke="%s" stroke-width="2" opacity="%.2f" stroke-linecap="round"/>' % (R.uniform(3, 6), R.uniform(0, 4), x, y, w_, R.choice(['#E8FAFA', '#B8ECF2', '#FFF3C0']), R.uniform(.3, .7))
    for _ in range(26):
        y = R.randint(342, 440); x = 250 + R.randint(-200, 220)
        o += '<ellipse class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" rx="%d" ry="1.6" fill="#FFF8D0"/>' % (R.uniform(2, 5), R.uniform(0, 4), x, y, R.randint(6, 18))
    o += boat(120, 350, .7, '#E2483E') + boat(350, 358, .5, '#F2C25A') + boat(430, 346, .4, '#2E6AC8')
    # lá sen
    for x, y, rx, fl in ((70, 668, 40, False), (160, 650, 34, True), (260, 690, 42, False), (110, 700, 30, False), (330, 640, 26, False), (60, 600, 26, True)): o += pad(x, y, rx, fl)
    o += '</g>'
    # bờ cát viền nước
    o += '<path d="M520 332Q552 400 520 470Q490 560 556 640Q574 690 612 720" stroke="#E8CFA0" stroke-width="12" fill="none" opacity=".9"/><path d="M520 332Q552 400 520 470Q490 560 556 640Q574 690 612 720" stroke="%s" stroke-width="1.6" fill="none"/>' % INK
    # đất đỏ
    o += '<path d="M520 332H1280V720H612Q574 690 556 640Q490 560 520 470Q552 400 520 332Z" fill="url(#grA)"/>'
    o += '<path d="M520 338Q700 330 900 340Q1100 330 1280 340V372Q1100 360 900 372Q700 360 520 372Z" fill="#E08850" opacity=".5"/>'
    # bụi cây xa
    for x, y, s_ in ((560, 345, .55), (640, 342, .5), (900, 345, .5), (1010, 343, .55), (1190, 344, .6)): o += '<g style="filter:brightness(.8)">' + gum(x, y, 74, R.randint(-8, 8), s_) + '</g>'
    o += windmill(1130, 348, .62) + fence(600, 352, 760, 346, 8) + fence(900, 346, 1050, 352, 7)
    # hạt đất, đường mòn
    for _ in range(170): o += '<circle cx="%d" cy="%d" r="%.1f" fill="%s" opacity=".5"/>' % (R.randint(540, 1280), R.randint(350, 718), R.uniform(.8, 2.2), R.choice(['#8E3A1C', '#E8A070', '#7A2E14']))
    o += '<path d="M620 720Q700 640 800 600Q960 560 1110 530Q1200 520 1280 540V572Q1190 556 1110 566Q960 600 860 640Q790 670 760 720Z" fill="#E8A878" opacity=".45"/>'
    # đá, spinifex, hoa dại
    for x, y, w_, h_ in ((1210, 440, 60, 22), (860, 686, 70, 26), (700, 420, 40, 14), (580, 470, 34, 12)): o += rock(x, y, w_, h_)
    for x, y, s_ in ((620, 400, .6), (940, 420, .7), (580, 560, .8), (1000, 700, 1.2), (1240, 690, 1.3), (750, 700, 1.0), (1180, 630, .9), (860, 470, .8)): o += spin(x, y, s_)
    for x, y, s_ in ((640, 600, 1), (668, 606, .9), (900, 566, 1), (930, 572, .85), (1230, 560, 1), (1200, 584, .9), (780, 716, 1.1)): o += pea(x, y, s_)
    # cây koala (bạch đàn lớn bên phải)
    o += gum(1010, 600, 410, -22, 1.5)
    o += koala(982, 382, .8)
    o += '<path d="M954 420Q982 436 1010 424" stroke="#6A5A44" stroke-width="12" fill="none" stroke-linecap="round"/>'
    # gò kiến
    o += mound(1156, 590, 1.2) + ants(1090, 618)
    # keo vàng + ong, ốc sên
    o += wattle(850, 612, 1.2) + bee(830, 556, 1.2, 2.8, 0) + bee(880, 548, 1.0, 3.4, 1.2) + bee(910, 580, 1.1, 2.4, 2.2)
    o += snail(930, 690, .7)
    # chuột túi
    o += '<g class="hop">' + kangaroo(740, 560, 1.05) + '</g>'
    # kiến to ở đất phía trước mound
    o += big_ant(1112, 640, 1.1) + big_ant(1180, 652, .8)
    # thiên nga đen ở vịnh
    o += '<g class="rock">' + swan(360, 540, 1.25) + '</g>' + '<g class="rock" style="animation-delay:-1.4s">' + swan(210, 470, .62, True) + '</g>'
    # ếch trên lá sen (vẽ lại lá sen nổi bật)
    o += pad(190, 640, 40, False) + '<g class="hop">' + frog(190, 636, 1.15) + '</g>'
    # lau sậy
    o += reeds(470, 626, 10, 96) + reeds(518, 520, 7, 76) + reeds(30, 716, 9, 110)
    # cây lớn bên trái đầu ảnh (tiền cảnh, bóng tối)
    o += gum(1262, 716, 520, -40, 1.7, True)
    # cánh hoa/bụi thấp tiền cảnh
    o += wattle(40, 716, .9)
    # thú cưng
    o += V.kitsu(650, 706, 106, 'ehappy', 'walk')
    # biển chạm
    for t_, x, y, dn in [('Chuột túi', 700, 285, False), ('Gấu koala', 1090, 330, False), ('Con kiến', 1150, 456, False), ('Con ếch', 250, 590, False), ('Thiên nga đen', 425, 405, False)]:
        o += G.bubble(x, y, t_, dn)
    page('PAustralia', 'Kids World, Úc nắng chiều', 'Miền đất Úc đầy nắng: chuột túi đỏ, gấu koala trên cây bạch đàn, gò kiến, ếch trên lá sen, thiên nga đen trong vịnh, đá Uluru xa và Đài Con Sò nhỏ', d, o, 'Úc')


if __name__ == '__main__':
    paustralia(); print('ok')
