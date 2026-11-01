# Cảnh nước Kê-ni-a (PKenya): thảo nguyên chiều muộn, cây keo, núi Kenya, voi, hươu cao cổ, ngựa vằn, sư tử, khỉ, làng Maasai.
#   BOARD_OUT=<project> python gen_places_kenya.py
# Cùng chuẩn với gen_places_south.py (page, bubble, kitsu 'walk'); chỉ ghi PKenya.dc.html, không đụng canvas.json.
import math, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('BOARD_OUT') or '.'
sys.argv = ['x', OUT, 'unused.json']
sys.path.insert(0, HERE)
import gen_review2 as G
V = G.V
R = random.Random(404)
INK = '#1E1612'

CSS = """<style>
@keyframes tail{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(11deg)}}
.tail{animation:tail 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:top center}
@keyframes ear{0%,100%{transform:rotate(0)}50%{transform:rotate(-7deg)}}
.ear{animation:ear 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:right center}
@keyframes graze{0%,100%{transform:rotate(0)}50%{transform:rotate(7deg)}}
.graze{animation:graze 4.6s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom right}
@keyframes heat{0%,100%{transform:translateX(0)}50%{transform:translateX(7px)}}
.heat{animation:heat 6s ease-in-out infinite}
@keyframes breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.025)}}
.breathe{animation:breathe 3.4s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom center}
@media (prefers-reduced-motion:reduce){.tail,.ear,.graze,.heat,.breathe{animation:none}}
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


# ---------- núi Kenya: hai đỉnh nhọn, tuyết, sương xa ----------
def mountain(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<path d="M-330 0L-190 -70L-120 -112L-84 -150L-52 -190L-30 -170L-8 -214L12 -178L40 -150L70 -118L130 -70L330 0Z" fill="url(#mtK)" stroke="#5A4466" stroke-width="2" stroke-linejoin="round"/>'
    o += '<path d="M-84 -150L-52 -190L-30 -170L-8 -214L12 -178L40 -150L22 -140L6 -158L-8 -134L-26 -154L-44 -130L-62 -150Z" fill="#FFFFFF" stroke="#5A4466" stroke-width="1.6" stroke-linejoin="round"/>'
    o += '<path d="M-52 -190L-44 -130L-62 -150ZM-8 -214L-8 -134L6 -158ZM12 -178L22 -140L40 -150Z" fill="#CFE0F2"/>'
    o += '<path d="M-120 -112L-84 -150L-60 -118L-90 -84ZM70 -118L40 -150L26 -110L56 -84Z" fill="#8E7AA6" opacity=".55"/>'
    for dx in (-160, -90, 80, 150, 230):
        o += '<path d="M%d -10Q%d -40 %d -62" stroke="#6A5278" stroke-width="2" fill="none" opacity=".4"/>' % (dx, dx + 8, dx + 22)
    return o + '</g>'

def hill(path, fill):
    return '<path d="%s" fill="%s"/>' % (path, fill)


# ---------- cây keo thảo nguyên: tán dẹt như chiếc ô ----------
def acacia(x, y, s=1, canopy=('#4E8A3E', '#6FA84A', '#9CC85A'), trunk='#4A2E1C', ink='#26180E', sw=True, flat=1.0):
    """Gốc (x,y); trục cong, ba cành chữ Y, tán nhiều tầng. Cao ~ 300*s."""
    c = V.uid()
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<ellipse cx="0" cy="3" rx="%d" ry="8" fill="#3A2410" opacity=".28"/>' % (110 * s ** .0 + 20)
    o += '<path d="M-12 4Q-8 -60 -4 -120Q-34 -170 -96 -204M-4 -120Q10 -170 24 -214M-4 -120Q40 -150 110 -190" stroke="%s" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' % ink
    o += '<path d="M-12 4Q-8 -60 -4 -120Q-34 -170 -96 -204M-4 -120Q10 -170 24 -214M-4 -120Q40 -150 110 -190" stroke="%s" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' % trunk
    o += '<path d="M-6 2Q-2 -50 0 -100" stroke="#6E4A2E" stroke-width="3" fill="none" opacity=".6"/>'
    can = ''
    for ox, oy, rx, ry, col in ((-100, -214, 108, 30, canopy[0]), (110, -198, 112, 30, canopy[0]), (14, -226, 126, 34, canopy[0]),
                                (-92, -226, 90, 26, canopy[1]), (104, -212, 92, 26, canopy[1]), (14, -242, 104, 28, canopy[1]),
                                (-80, -242, 60, 16, canopy[2]), (92, -226, 64, 16, canopy[2]), (20, -258, 70, 16, canopy[2])):
        can += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" stroke="%s" stroke-width="2"/>' % (ox, oy * flat, rx, ry * flat, col, '#254A1E')
    # lá nhỏ li ti trên tán
    leaves = ''
    for _ in range(46):
        lx = R.uniform(-190, 210); ly = R.uniform(-262, -190) * flat
        leaves += '<path d="M%.0f %.0fh%d" stroke="%s" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>' % (lx, ly, R.randint(6, 14), R.choice(['#C8E87A', '#3E7A34', '#B4DA6A']))
    can += leaves
    o += (('<g class="sway" style="--t:%.1fs;--d:-%.1fs;transform-origin:0px -160px">' % (6 + (x % 5) * .5, (x % 7) * .4)) if sw else '<g>') + can + '</g>'
    return o + '</g>'


# ---------- thú: nét mực, hai tầng sáng tối ----------
def elephant(x, y, s=1, flip=False):
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)"><g class="rock" style="animation-duration:5s">' % (x, y, -s if flip else s, s)
    o += '<ellipse cy="4" rx="150" ry="12" fill="#3A2410" opacity=".32"/>'
    g1, g2, g3 = '#9A948E', '#7C766F', '#B8B2AA'
    # chân sau xa, chân trước xa
    for lx, c in ((-62, g2), (74, g2)):
        o += '<path d="M%d -80L%d 0Q%d 8 %d 4L%d -80Z" fill="%s" stroke="%s" stroke-width="2.4"/>' % (lx - 20, lx - 22, lx, lx + 26, lx + 26, c, INK)
    # đuôi
    o += '<g class="tail" style="transform-origin:112px -128px"><path d="M112 -128Q132 -108 128 -64" stroke="%s" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M128 -64l-6 14l10 -3l6 -12Z" fill="#4A4642" stroke="%s"/></g>' % (INK, INK)
    # thân
    o += '<path d="M-100 -150Q-20 -214 90 -176Q146 -150 140 -86Q132 -60 100 -66L-92 -64Q-128 -82 -100 -150Z" fill="%s" stroke="%s" stroke-width="2.8" stroke-linejoin="round"/>' % (g1, INK)
    o += '<path d="M-90 -100Q10 -80 124 -92" stroke="%s" stroke-width="3" fill="none" opacity=".25"/><path d="M-70 -160Q-20 -198 60 -190" stroke="#D4CEC6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>' % g2
    for k in range(7): o += '<path d="M%d %dq10 6 22 2" stroke="%s" stroke-width="1.6" fill="none" opacity=".3"/>' % (-60 + k * 24, -130 + (k % 3) * 18, INK)
    # chân gần
    for lx in (-84, 54):
        o += '<path d="M%d -92L%d 0Q%d 9 %d 5L%d -92Z" fill="%s" stroke="%s" stroke-width="2.6"/>' % (lx - 6, lx - 12, lx + 10, lx + 40, lx + 52, g1, INK)
        for t in (-4, 14, 32): o += '<ellipse cx="%d" cy="-2" rx="5" ry="6.5" fill="#E8DFD0" stroke="%s" stroke-width="1.4"/>' % (lx + t + 4, INK)
    # đầu, vòi, ngà, tai
    o += '<path d="M-100 -168Q-170 -190 -176 -118Q-182 -58 -170 -6Q-158 12 -144 0Q-142 -40 -140 -70Q-110 -64 -92 -92Z" fill="%s" stroke="%s" stroke-width="2.8" stroke-linejoin="round"/>' % (g1, INK)
    for k in range(6): o += '<path d="M-172 %dq14 4 26 -2" stroke="%s" stroke-width="1.6" fill="none" opacity=".35"/>' % (-110 + k * 17, INK)
    o += '<path d="M-150 -78Q-196 -66 -204 -40Q-196 -58 -150 -62Z" fill="#F7F0DC" stroke="%s" stroke-width="2"/>' % INK
    o += '<circle cx="-140" cy="-130" r="5" fill="#141014"/><circle cx="-141.5" cy="-131.5" r="1.8" fill="#fff"/>'
    o += '<g class="ear"><path d="M-96 -178Q-30 -222 -50 -128Q-62 -66 -108 -88Q-132 -130 -96 -178Z" fill="%s" stroke="%s" stroke-width="2.6" stroke-linejoin="round"/><path d="M-92 -160Q-50 -190 -68 -126Q-78 -90 -100 -106" fill="%s" opacity=".6"/></g>' % (g2, INK, g3)
    return o + '</g></g>'

def giraffe(x, y, s=1, flip=False, neck=0):
    cid = V.uid()
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s)
    o += '<ellipse cy="3" rx="92" ry="9" fill="#3A2410" opacity=".3"/>'
    base, patch = '#F0B84A', '#A8602A'
    # chân sau/trước
    for lx, c in ((-52, '#D9A03A'), (50, '#D9A03A'), (-34, base), (66, base)):
        o += '<path d="M%d -92L%d -4L%d -4L%d -92Z" fill="%s" stroke="%s" stroke-width="2.4"/><path d="M%d -6h16l-2 8h-12Z" fill="#3A2412"/>' % (lx - 8, lx - 7, lx + 8, lx + 8, c, INK, lx - 8)
    body = 'M-72 -120Q-62 -154 -10 -156Q56 -158 76 -140Q92 -120 80 -96Q50 -86 -10 -90Q-64 -88 -72 -120Z'
    o += '<clipPath id="%s"><path d="%s"/><path d="M52 -140L84 -330Q96 -340 112 -332L100 -300L100 -330L62 -150Z"/></clipPath>' % (cid, body)
    o += '<path d="%s" fill="%s" stroke="%s" stroke-width="2.8" stroke-linejoin="round"/>' % (body, base, INK)
    # cổ dài (cong nhẹ)
    o += '<path d="M44 -138Q62 -230 74 -318L108 -312Q94 -224 82 -130Z" fill="%s" stroke="%s" stroke-width="2.8" stroke-linejoin="round"/>' % (base, INK)
    # vằn nâu
    o += '<g clip-path="url(#%s)">' % cid
    for px, py, pr in ((-44, -128, 15), (-14, -138, 14), (14, -118, 13), (38, -142, 13), (-60, -104, 9), (-26, -108, 10), (60, -108, 11)):
        o += '<path d="M%d %dl%d -%d l%d %d l-%d %dZ" fill="%s" stroke="#6E3A18" stroke-width="1.4" stroke-linejoin="round"/>' % (px - pr, py, pr, pr * .6, pr, pr * .8, pr * .4, pr * 1.2, patch)
    o += '</g>'
    for px, py in ((52, -170), (62, -200), (70, -230), (76, -258), (84, -286), (60, -150), (88, -230), (92, -262)):
        o += '<path d="M%d %dl10 -4l6 8l-8 8l-8 -4Z" fill="%s" stroke="#6E3A18" stroke-width="1.2"/>' % (px, py, patch)
    # bờm
    o += '<path d="M74 -318Q66 -230 56 -150" stroke="#8A4A1E" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="3 3"/>'
    # đầu
    o += '<g class="breathe" style="transform-origin:94px -318px"><path d="M72 -318Q60 -340 82 -350Q102 -356 126 -340Q138 -332 132 -322Q120 -308 100 -308Q86 -306 72 -318Z" fill="%s" stroke="%s" stroke-width="2.8" stroke-linejoin="round"/>' % (base, INK)
    o += '<ellipse cx="128" cy="-328" rx="9" ry="7" fill="#7A4A26" stroke="%s" stroke-width="1.6"/><circle cx="100" cy="-334" r="4.4" fill="#141014"/><circle cx="99" cy="-335.5" r="1.4" fill="#fff"/>' % INK
    o += '<path d="M84 -350L82 -372M98 -354L100 -374" stroke="%s" stroke-width="3" stroke-linecap="round"/><circle cx="82" cy="-374" r="4" fill="#7A4A26" stroke="%s"/><circle cx="100" cy="-376" r="4" fill="#7A4A26" stroke="%s"/>' % (INK, INK, INK)
    o += '<path d="M76 -330Q58 -338 54 -324Q66 -322 78 -322Z" fill="#D9A03A" stroke="%s" stroke-width="2"/></g>' % INK
    o += '<g class="tail" style="transform-origin:-72px -126px"><path d="M-72 -126Q-98 -108 -94 -68" stroke="%s" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-94 -68l-5 14l9 -2l4 -12Z" fill="#3A2412"/></g>' % INK
    return o + '</g>'

def zebra(x, y, s=1, flip=False, graze=True):
    cid = V.uid()
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s)
    o += '<ellipse cy="3" rx="82" ry="8" fill="#3A2410" opacity=".3"/>'
    W, K = '#FBF8EE', '#1E1A1E'
    for lx, c in ((-48, '#E6E0D0'), (44, '#E6E0D0'), (-30, W), (60, W)):
        o += '<path d="M%d -64L%d -4L%d -4L%d -64Z" fill="%s" stroke="%s" stroke-width="2.2"/><path d="M%d -4h12l-1 6h-10Z" fill="#2A2024"/>' % (lx - 6, lx - 5, lx + 7, lx + 8, c, INK, lx - 5)
        for t in (-44, -28, -14): o += '<path d="M%d %dh%d" stroke="%s" stroke-width="3"/>' % (lx - 5, t, 13, K)
    body = 'M-66 -84Q-58 -118 -4 -118Q58 -120 72 -100Q80 -80 66 -64Q30 -56 -14 -58Q-62 -56 -66 -84Z'
    o += '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="%s" stroke="%s" stroke-width="2.6" stroke-linejoin="round"/><g clip-path="url(#%s)">' % (cid, body, body, W, INK, cid)
    for k in range(13):
        px = -64 + k * 11
        o += '<path d="M%d -122Q%d -92 %d -56L%d -56Q%d -92 %d -122Z" fill="%s"/>' % (px, px + 10 + (k % 3) * 2, px + 4, px + 10, px + 16 + (k % 3) * 2, px + 7, K)
    o += '</g>'
    # cổ + đầu (cúi gặm cỏ hoặc ngẩng)
    hd = '<g class="graze" style="transform-origin:62px -104px"><path d="M52 -112Q76 -122 98 -140L124 -128Q112 -96 88 -78Q72 -76 62 -90Z" fill="%s" stroke="%s" stroke-width="2.6" stroke-linejoin="round"/>' % (W, INK)
    hd += ''.join('<path d="M%d %dl%d %d" stroke="%s" stroke-width="3.6"/>' % (62 + k * 11, -112 + k * 2, 10, -16, K) for k in range(4))
    hd += '<path d="M96 -140Q108 -166 128 -158Q146 -150 142 -132Q130 -118 116 -124Q106 -134 96 -140Z" fill="%s" stroke="%s" stroke-width="2.6" stroke-linejoin="round"/>' % (W, INK)
    hd += '<path d="M118 -164L116 -184Q126 -180 128 -162Z" fill="%s" stroke="%s" stroke-width="2"/><path d="M108 -160L102 -178Q114 -176 116 -158Z" fill="%s" stroke="%s" stroke-width="2"/>' % (W, INK, K, INK)
    hd += '<path d="M104 -150L120 -160M110 -140L132 -152" stroke="%s" stroke-width="3"/><ellipse cx="140" cy="-134" rx="6" ry="8" fill="#3A2A2A" stroke="%s" stroke-width="1.4"/><circle cx="124" cy="-148" r="3.6" fill="#141014"/><circle cx="123" cy="-149.3" r="1.2" fill="#fff"/>' % (K, INK)
    hd += '<path d="M92 -144Q82 -158 98 -170Q104 -150 112 -146Z" fill="%s"/></g>' % K
    o += hd
    o += '<g class="tail" style="transform-origin:-66px -90px"><path d="M-66 -90Q-90 -78 -84 -44" stroke="%s" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-84 -44l-5 12l9 -2l4 -10Z" fill="%s"/></g>' % (INK, K)
    return o + '</g>'

def lion(x, y, s=1, flip=False):
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s)
    o += '<ellipse cy="3" rx="96" ry="9" fill="#3A2410" opacity=".32"/>'
    fur, dk, mane = '#E2A64A', '#C98830', '#7A4420'
    # đuôi
    o += '<g class="tail" style="transform-origin:-80px -34px"><path d="M-80 -34Q-112 -30 -116 -10Q-114 4 -100 2" stroke="%s" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="-102" cy="2" rx="8" ry="6" fill="%s" stroke="%s" stroke-width="1.6"/></g>' % (INK, mane, INK)
    # thân nằm
    o += '<path d="M-88 -6Q-98 -50 -50 -62Q10 -70 50 -56Q74 -44 66 -6Z" fill="%s" stroke="%s" stroke-width="2.8" stroke-linejoin="round"/>' % (fur, INK)
    o += '<path d="M-70 -30Q-20 -44 40 -34" stroke="%s" stroke-width="3" fill="none" opacity=".5"/>' % dk
    o += '<path d="M-20 -6Q-16 -28 6 -28Q28 -26 30 -6Z" fill="%s" stroke="%s" stroke-width="2.4"/>' % (dk, INK)
    # bờm
    for k in range(18):
        a = k / 18 * math.pi * 2
        o += '<ellipse cx="%.0f" cy="%.0f" rx="22" ry="15" transform="rotate(%.0f %.0f %.0f)" fill="%s" stroke="%s" stroke-width="1.6"/>' % (66 + 34 * math.cos(a), -52 + 34 * math.sin(a), math.degrees(a), 66 + 34 * math.cos(a), -52 + 34 * math.sin(a), mane if k % 2 else '#9A5A2A', INK)
    # đầu
    o += '<ellipse cx="68" cy="-52" rx="33" ry="30" fill="%s" stroke="%s" stroke-width="2.6"/>' % (fur, INK)
    o += '<circle cx="46" cy="-76" r="9" fill="%s" stroke="%s" stroke-width="2"/><circle cx="92" cy="-78" r="9" fill="%s" stroke="%s" stroke-width="2"/>' % (fur, INK, fur, INK)
    o += '<ellipse cx="82" cy="-40" rx="17" ry="13" fill="#F6DCA6" stroke="%s" stroke-width="2"/><path d="M76 -48h12l-6 8Z" fill="#7A3A3A" stroke="%s" stroke-width="1.6" stroke-linejoin="round"/><path d="M82 -40v8M72 -32Q82 -26 92 -32" stroke="%s" stroke-width="1.8" fill="none"/>' % (INK, INK, INK)
    o += '<path d="M52 -62Q60 -66 68 -62M80 -64Q90 -68 98 -62" stroke="%s" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="60" cy="-58" r="3.4" fill="#141014"/><circle cx="88" cy="-58" r="3.4" fill="#141014"/>' % INK
    # chân trước
    o += '<path d="M30 -16Q58 -22 96 -12Q108 -8 104 2H34Q22 0 30 -16Z" fill="%s" stroke="%s" stroke-width="2.6"/><path d="M80 -2v-8M90 -2v-8" stroke="%s" stroke-width="1.6"/>' % (fur, INK, INK)
    return o + '</g>'

def rock(x, y, w, h, c='#A89478', dk='#7C6A54'):
    return ('<path d="M%d %dQ%d %d %d %dQ%d %d %d %dL%d %dQ%d %d %d %dZ" fill="%s" stroke="%s" stroke-width="2.4" stroke-linejoin="round"/>'
            '<path d="M%d %dQ%d %d %d %d" stroke="#D8C8A8" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/><path d="M%d %dL%d %dL%d %d" fill="%s" opacity=".4"/>'
            % (x - w / 2, y, x - w * .45, y - h, x, y - h, x + w * .4, y - h, x + w / 2, y - h * .2, x + w / 2, y, x + w * .2, y + 5, x - w * .3, y + 5, c, INK,
               x - w * .3, y - h * .6, x - w * .2, y - h * .9, x, y - h * .92, x + w * .1, y, x + w * .4, y - h * .7, x + w * .5, y, c))

def monkey(x, y, s=1):
    """Khỉ ngồi vắt vẻo, đuôi dài cuốn quanh cành."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><g class="rock" style="transform-origin:0px 0px;animation-duration:4s">' % (x, y, s)
    o += '<path d="M-14 -20Q-60 -10 -54 24Q-50 44 -30 40" stroke="%s" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-14 -20Q-60 -10 -54 24Q-50 44 -30 40" stroke="#5E3E26" stroke-width="5" fill="none" stroke-linecap="round"/>' % INK
    o += '<ellipse cx="0" cy="-22" rx="22" ry="28" fill="#7A5232" stroke="%s" stroke-width="2.6"/><ellipse cx="2" cy="-18" rx="12" ry="17" fill="#B8946A"/>' % INK
    o += '<path d="M-16 -36Q-36 -10 -30 12" stroke="%s" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-16 -36Q-36 -10 -30 12" stroke="#7A5232" stroke-width="5.5" fill="none" stroke-linecap="round"/>' % INK
    o += '<path d="M14 -36Q38 -28 34 -6" stroke="%s" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M14 -36Q38 -28 34 -6" stroke="#7A5232" stroke-width="5.5" fill="none" stroke-linecap="round"/>'  % INK
    o += '<circle cx="0" cy="-58" r="19" fill="#7A5232" stroke="%s" stroke-width="2.6"/><circle cx="-18" cy="-60" r="7" fill="#B8946A" stroke="%s" stroke-width="2"/><circle cx="18" cy="-60" r="7" fill="#B8946A" stroke="%s" stroke-width="2"/>' % (INK, INK, INK)
    o += '<ellipse cx="0" cy="-54" rx="12" ry="11" fill="#E8C9A0" stroke="%s" stroke-width="1.8"/><circle cx="-5" cy="-58" r="2.6" fill="#141014"/><circle cx="5" cy="-58" r="2.6" fill="#141014"/><ellipse cx="0" cy="-51" rx="3.2" ry="2" fill="#5A3A2A"/><path d="M-5 -46Q0 -42 5 -46" stroke="%s" stroke-width="1.6" fill="none"/>' % (INK, INK)
    return o + '</g></g>'

def owl(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<path d="M-14 0Q-18 -30 -8 -42Q0 -48 8 -42Q18 -30 14 0Z" fill="#9A7A52" stroke="%s" stroke-width="2.2"/><path d="M-8 -6Q0 -2 8 -6M-9 -14Q0 -9 9 -14M-8 -22Q0 -17 8 -22" stroke="#6E5236" stroke-width="1.6" fill="none"/>' % INK
    o += '<ellipse cx="0" cy="-28" rx="8" ry="11" fill="#E8D6B0"/><path d="M-12 -44L-8 -52L-3 -44M12 -44L8 -52L3 -44" fill="#9A7A52" stroke="%s" stroke-width="1.6" stroke-linejoin="round"/>' % INK
    o += '<circle cx="-5" cy="-37" r="5.6" fill="#FFF3C8" stroke="%s" stroke-width="1.6"/><circle cx="5" cy="-37" r="5.6" fill="#FFF3C8" stroke="%s" stroke-width="1.6"/><circle cx="-5" cy="-37" r="2.6" fill="#141014"/><circle cx="5" cy="-37" r="2.6" fill="#141014"/><path d="M-2 -33h4l-2 4Z" fill="#E2A23C"/>' % (INK, INK)
    return o + '</g>'

def snake(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    d = 'M-46 -2Q-34 -22 -20 -8Q-6 6 8 -10Q22 -26 34 -12Q42 -4 40 -18'
    o += '<path d="%s" stroke="%s" stroke-width="14" fill="none" stroke-linecap="round"/><path d="%s" stroke="#7FA83A" stroke-width="9.5" fill="none" stroke-linecap="round"/><path d="%s" stroke="#D9C84A" stroke-width="2.6" fill="none" stroke-dasharray="3 7" stroke-linecap="round"/>' % (d, INK, d, d)
    o += '<ellipse cx="42" cy="-22" rx="10" ry="7" fill="#7FA83A" stroke="%s" stroke-width="2.2"/><circle cx="46" cy="-24" r="2.4" fill="#141014"/><path d="M51 -21l9 2m-9 -1l9 -6" stroke="#D32F2F" stroke-width="1.6" stroke-linecap="round"/>' % INK
    return o + '</g>'


# ---------- người Maasai và nhà (kính trọng, không phóng đại) ----------
def maasai(x, y, s=1, cloth='#C7322E', stripe='#2E5AA8', staff=True, flip=False):
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)">' % (x, y, -s if flip else s, s)
    o += '<ellipse cy="2" rx="16" ry="4" fill="#3A2410" opacity=".3"/>'
    if staff: o += '<path d="M18 2L20 -112" stroke="#5A3A20" stroke-width="3" stroke-linecap="round"/>'
    o += '<path d="M-7 -30L-6 0M7 -30L6 0" stroke="#5E3A28" stroke-width="5" stroke-linecap="round"/>'
    o += '<path d="M-14 -78Q-18 -50 -14 -24L14 -24Q18 -50 14 -78Q0 -84 -14 -78Z" fill="%s" stroke="%s" stroke-width="2.2" stroke-linejoin="round"/>' % (cloth, INK)
    o += '<path d="M-15 -62h30M-16 -42h32" stroke="%s" stroke-width="2.6"/><path d="M-14 -52h28M-15 -32h30" stroke="#FFF3D0" stroke-width="1.4"/>' % stripe
    o += '<path d="M-14 -78Q-4 -70 0 -66Q4 -70 14 -78" fill="none" stroke="#F2C25A" stroke-width="3.2"/><circle cx="-5" cy="-72" r="1.8" fill="#2E5AA8"/><circle cx="5" cy="-72" r="1.8" fill="#2FA860"/>'
    o += '<circle cx="0" cy="-92" r="11" fill="#6E4430" stroke="%s" stroke-width="2.2"/><path d="M-11 -94Q0 -108 11 -94" fill="#1E1210"/><circle cx="-4" cy="-92" r="1.4" fill="#141014"/><circle cx="4" cy="-92" r="1.4" fill="#141014"/><path d="M-3 -86Q0 -84 3 -86" stroke="#2A1810" stroke-width="1.2" fill="none"/>' % INK
    o += '<path d="M-14 -74L-24 -52M14 -74L20 -60" stroke="%s" stroke-width="5" stroke-linecap="round"/><path d="M-14 -74L-24 -52M14 -74L20 -60" stroke="#6E4430" stroke-width="2.6" stroke-linecap="round"/>' % INK
    return o + '</g>'

def hut(x, y, s=1, wall='#B8825A', thatch='#D9B05A', th2='#B98A34', door=True):
    """Nhà tròn mái tranh hình nón."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<ellipse cy="4" rx="76" ry="9" fill="#3A2410" opacity=".3"/>'
    o += '<path d="M-60 4L-60 -48Q0 -58 60 -48L60 4Q0 12 -60 4Z" fill="%s" stroke="%s" stroke-width="2.6" stroke-linejoin="round"/>' % (wall, INK)
    o += '<path d="M-60 -20Q0 -10 60 -20" stroke="#8A5A38" stroke-width="2" fill="none" opacity=".5"/>'
    if door: o += '<path d="M-14 6L-14 -26Q0 -38 14 -26L14 8Q0 12 -14 6Z" fill="#2A1A12" stroke="%s" stroke-width="2"/>' % INK
    o += '<path d="M-78 -42Q-40 -52 0 -112Q40 -52 78 -42Q0 -30 -78 -42Z" fill="%s" stroke="%s" stroke-width="2.6" stroke-linejoin="round"/>' % (thatch, INK)
    for k in range(-5, 6): o += '<path d="M%d -34L%d -102" stroke="%s" stroke-width="1.8" opacity=".7"/>' % (k * 13, k * 2, th2)
    o += '<path d="M-72 -42Q0 -26 72 -42" stroke="%s" stroke-width="3" fill="none" opacity=".6"/>' % th2
    o += '<path d="M0 -112l0 -14" stroke="%s" stroke-width="3"/>' % INK
    return o + '</g>'

def thorn_fence(x0, x1, y, n=22):
    o = ''
    for k in range(n):
        x = x0 + (x1 - x0) * k / (n - 1) + R.uniform(-4, 4); h = R.uniform(18, 30)
        o += '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0fM%.0f %.0fl10 -8M%.0f %.0fl-9 -6" stroke="#4A3220" stroke-width="3" fill="none" stroke-linecap="round"/>' % (x, y, x + R.uniform(-6, 6), y - h * .6, x + R.uniform(-5, 5), y - h, x + 1, y - h * .5, x, y - h * .75)
        o += '<ellipse cx="%.0f" cy="%.0f" rx="9" ry="4" fill="#5E8A3A" opacity=".8"/>' % (x, y - h * .5)
    return o

def tuft(x, y, s=1):
    c = R.choice(['#8A9A3A', '#A8A848', '#B8A84A', '#6E8A34'])
    return '<path d="M%.0f %.0fl-5 -%d M%.0f %.0fl1 -%d M%.0f %.0fl6 -%d" stroke="%s" stroke-width="2" stroke-linecap="round" fill="none"/>' % (x, y, 14 * s, x, y, 18 * s, x, y, 13 * s, c)

def flower(x, y, c='#F2C53A'):
    return '<path d="M%d %dV%d" stroke="#5E7A2A" stroke-width="1.6"/><circle cx="%d" cy="%d" r="3.4" fill="%s" stroke="#7A5A10" stroke-width=".8"/><circle cx="%d" cy="%d" r="1.3" fill="#7A3A1A"/>' % (x, y, y - 12, x, y - 13, c, x, y - 13)

def termite(x, y, s=1):
    return ('<g transform="translate(%d %d) scale(%.2f)"><path d="M-22 2Q-20 -26 -12 -42Q-4 -62 0 -62Q6 -54 12 -40Q22 -20 24 2Z" fill="#B87A4E" stroke="%s" stroke-width="2.2" stroke-linejoin="round"/><path d="M-10 -16Q0 -10 12 -16M-8 -32Q0 -26 8 -32" stroke="#8A5A36" stroke-width="1.6" fill="none"/></g>' % (x, y, s, INK))


def pkenya():
    d = (lin('skK', [('0', '#3E78C0'), ('.34', '#7FB0DC'), ('.6', '#FFD8A0'), ('.82', '#FFB56A'), ('1', '#FF9A5A')])
         + lin('mtK', [('0', '#A8A0C8'), ('.5', '#8E7AA6'), ('1', '#C8A8B8')])
         + lin('grK', [('0', '#D8B866'), ('.3', '#C89C48'), ('.7', '#A8782E'), ('1', '#7E5A22')])
         + lin('hazeK', [('0', '#FFD8A0'), ('1', '#FFD8A0')]).replace('stop-color="#FFD8A0"/></linearGradient>', 'stop-color="#FFD8A0" stop-opacity="0"/></linearGradient>', 1)
         + lin('trackK', [('0', '#E8CE96'), ('1', '#C8A468')]))
    HZ = 352
    o = '<rect width="1280" height="%d" fill="url(#skK)"/>' % (HZ + 6)
    # mặt trời thấp bên phải, tia nắng
    o += '<circle cx="1010" cy="300" r="260" fill="url(#hg)"/><circle cx="1010" cy="300" r="52" fill="#FFF3C0"/><circle cx="1010" cy="300" r="40" fill="#FFE27A"/>'
    for a in range(-80, 80, 22):
        o += '<path d="M1010 300L%.0f %.0f" stroke="#FFF0B0" stroke-width="18" opacity=".1"/>' % (1010 + 700 * math.sin(math.radians(a)), 300 - 700 * math.cos(math.radians(a)))
    for x, y, w_ in ((190, 70, 300), (560, 46, 240), (880, 96, 300), (1150, 54, 260), (40, 168, 170), (700, 170, 150)):
        o += cloud(x, y, w_, '#FFF1DC', '#F7B890', .88)
    o += V.flock(60, 70, 18, .4) + V.flock(120, 90, 40, .3)
    # núi Kenya + dải đồi xa
    o += mountain(210, HZ - 12, 1.22)
    o += '<path d="M-10 %d Q180 %d 340 %d T640 %d T980 %d T1290 %d V%d H-10Z" fill="#B49CB8" opacity=".85"/>' % (HZ - 30, HZ - 56, HZ - 30, HZ - 40, HZ - 28, HZ - 48, HZ)
    o += '<rect y="%d" width="1280" height="46" fill="url(#hazeK)" opacity=".9"/>' % (HZ - 40)
    o += '<path d="M-10 %d Q220 %d 480 %d T900 %d T1290 %d V%d H-10Z" fill="#9AA46A" opacity=".8"/>' % (HZ - 4, HZ - 26, HZ - 8, HZ - 20, HZ - 6, HZ + 20)
    # mặt đất xa → gần
    o += '<rect y="%d" width="1280" height="%d" fill="url(#grK)"/>' % (HZ, 720 - HZ)
    for x in range(-40, 1320, 90):
        o += '<ellipse cx="%d" cy="%d" rx="%d" ry="9" fill="%s" opacity=".35"/>' % (x + R.randint(-20, 20), HZ + R.randint(8, 70), R.randint(50, 120), R.choice(['#8AA040', '#E8D088', '#7A9A38']))
    # đàn gnu/ngựa vằn xa (chấm nhỏ), cây keo xa
    for k in range(30):
        x = R.randint(0, 1280); y = HZ + R.randint(6, 22)
        o += '<path d="M%d %dl-2 -6h6l3 -3h3l1 4l-3 5Z" fill="%s" opacity=".75"/>' % (x, y, R.choice(['#4A3A30', '#5E4A3A', '#3A3030']))
    far = ''
    for x, y, s_ in ((150, HZ + 22, .26), (360, HZ + 14, .2), (830, HZ + 18, .24), (1100, HZ + 24, .3), (1230, HZ + 16, .2), (950, HZ + 10, .16)):
        far += '<g style="filter:brightness(.82) saturate(.8)">' + acacia(x, y, s_, ('#6E8A4A', '#86A058', '#A4B86A'), '#5A4430', '#3A2A1C', sw=False) + '</g>'
    o += far
    # ===== làng Maasai (boma) phía xa phải =====
    o += thorn_fence(930, 1270, HZ + 70, 26)
    o += hut(1000, HZ + 60, .62) + hut(1130, HZ + 66, .7, '#A87650', '#CFA250') + hut(1236, HZ + 66, .56, '#B8825A')
    o += maasai(1068, HZ + 82, .6) + maasai(1190, HZ + 86, .62, '#2E5AA8', '#C7322E', True, True)
    o += termite(880, HZ + 60, .5)

    # ===== cây keo lớn: điểm nhấn =====
    o += acacia(520, 560, 1.7, sw=True)
    # hươu cao cổ sau cây, đầu vươn lên
    o += '<g class="heat">' + giraffe(850, 452, .96, True) + '</g>'
    # đàn ngựa vằn xa hơn
    o += zebra(372, 384, .34, True, False)
    # ngựa vằn chính
    o += zebra(210, 540, 1.0, False)
    # voi (tiền cảnh phải)
    o += elephant(1036, 626, .92, False)
    # đá + sư tử nằm
    o += rock(700, 672, 190, 74) + lion(700, 596, 1.0, False)
    # khỉ trên cành keo, cú trong tán
    o += monkey(612, 400, .98)
    o += owl(432, 276, .8)
    o += snake(900, 700, 1.1)
    # bụi rậm / cỏ cao trước mặt
    o += '<path d="M0 636Q260 606 470 668Q560 698 640 722L0 722Z" fill="url(#trackK)" opacity=".92"/><path d="M0 636Q260 606 470 668Q560 698 640 722" stroke="#8A6A38" stroke-width="2" fill="none" opacity=".6"/>'
    for k in range(34): o += '<ellipse cx="%d" cy="%d" rx="%d" ry="3" fill="#A88A58" opacity=".5"/>' % (R.randint(10, 480), R.randint(662, 714), R.randint(6, 20))
    for _ in range(220):
        x = R.randint(0, 1280); y = R.randint(HZ + 24, 716)
        if x < 600 and y > 640 + x * .06: continue
        o += tuft(x, y, .5 + (y - HZ) / 300.0)
    for _ in range(26): o += flower(R.randint(0, 1280), R.randint(560, 712), R.choice(['#F2C53A', '#FFF3D0', '#E86AA8']))
    # tiền cảnh: cỏ cao hai mép, cây keo nhỏ góc phải
    for x0 in range(-10, 220, 22): o += '<path d="M%d 724Q%d 690 %d 660" stroke="#7E8A2E" stroke-width="3.2" fill="none" stroke-linecap="round"/>' % (x0, x0 + R.randint(-8, 8), x0 + R.randint(-20, 20))
    # bụi bay lấp lánh trong nắng
    for _ in range(44):
        o += '<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="#FFF3C8"/>' % (R.uniform(2, 5), R.uniform(0, 4), R.randint(300, 1280), R.randint(380, 640), R.uniform(1, 2.2))
    # thú cưng đi dạo
    o += V.kitsu(400, 700, 104, 'ehappy', 'walk')
    # 5 biển chạm (nhãn khớp từ vựng bài học)
    for t_, x, y, dn in [('Hươu cao cổ', 872, 66, True), ('Khỉ', 612, 330, True), ('Ngựa vằn', 190, 388, False), ('Sư tử', 640, 498, False), ('Voi', 1000, 452, False)]:
        o += G.bubble(x, y, t_, dn)
    page('PKenya', 'Kids World, Kê-ni-a thảo nguyên', 'Thảo nguyên Kê-ni-a lúc chiều muộn: cây keo lớn, núi Kenya, hươu cao cổ, voi, ngựa vằn, sư tử nằm trên đá, khỉ trên cành và làng Maasai xa xa', d, o, 'Kê-ni-a')


if __name__ == '__main__':
    pkenya(); print('ok')
