# Hướng UI "Làng chữ": app là một làng Việt minh hoạ phẳng, mỗi mục là một địa điểm, thú cưng đi trên bản đồ.
# python gen_village.py <project>
import os, sys
proj = sys.argv[1]
s = open(os.path.join(proj, 'AnimKitsu.dc.html'), encoding='utf-8').read()
i = s.index('<svg width="0" height="0"'); KDEFS = s[i:s.index('</defs></svg>', i) + len('</defs></svg>')]

C = dict(ink='#17362F', deep='#0F4C4A', teal='#1F7A6D', green='#2F8F5B', leaf='#5DA94F', lime='#A4C95A', mustard='#E9B44C', sun='#F4C95D', coral='#E2583E', roof='#B8452F', roof2='#8F3423', cream='#F7EBD3', paper='#FBF6EA', sky='#C9E6DA', river='#5CB8B2', river2='#86D0C4', wall='#F1DDB4', wood='#6B3E26', soft='#5D6F67')

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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;800&amp;family=Noto+Sans:wght@400&amp;display=swap">
<style>
body{margin:0}
.v{position:relative;overflow:hidden;font-family:'Be Vietnam Pro',sans-serif;font-size:15px;line-height:1.5;color:#17362F;box-sizing:border-box}
.v *{box-sizing:border-box}
.abs{position:absolute}
.t1{font-weight:800;letter-spacing:-.02em;line-height:1.05;margin:0}
.pill{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:20px;background:#FBF6EA;font-weight:600;font-size:14px;box-shadow:0 2px 0 rgba(23,54,47,.18)}
.go{display:inline-flex;align-items:center;gap:10px;height:52px;padding:0 26px;border:0;border-radius:26px;background:#E2583E;color:#fff;font:600 17px 'Be Vietnam Pro',sans-serif;cursor:pointer}
.ghost{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;border:0;background:transparent;color:#17362F;font:600 14px 'Be Vietnam Pro',sans-serif;cursor:pointer}
.ipa{font-family:'Noto Sans',sans-serif}
kbd{font:500 12px 'Be Vietnam Pro',sans-serif;padding:1px 6px;border-radius:6px;background:rgba(23,54,47,.09);margin-left:2px}
button:focus-visible{outline:3px solid #E9B44C;outline-offset:3px}
@keyframes bob{0%%,100%%{transform:translateY(0)}50%%{transform:translateY(-5px)}}
@keyframes pulse{0%%,100%%{transform:scale(1)}50%%{transform:scale(1.12)}}
@keyframes dash{to{stroke-dashoffset:-44}}
.walk{animation:bob .7s ease-in-out infinite}
.next{animation:pulse 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.trail{animation:dash 1.4s linear infinite}
@media (prefers-reduced-motion:reduce){.walk,.next,.trail{animation:none}}
</style>
</helmet>
%s
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":%d,"height":%d}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
"""
def write(n, t, w, h, b): open(os.path.join(proj, n + '.dc.html'), 'w', encoding='utf-8').write(HEAD % (t, KDEFS + b, w, h))

GRAIN = '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .2  0 0 0 0 .18  0 0 0 .55 -.18"/></filter>'

def kitsu(x, y, w, face='eopen', cls=''):
    return '<g transform="translate(%d %d)"><g%s><svg x="%d" y="%d" width="%d" height="%d" viewBox="-20 -20 200 180"><g transform="translate(80 143) scale(.9) translate(-80 -143)"><use href="#tails3"/><use href="#fbody"/><use href="#%s"/><use href="#kbib"/></g></svg></g></g>' % (x, y, (' class="%s"' % cls) if cls else '', -w / 2, -w * .86, w, w * .9, face)

def roof(cx, y, w, h, c=None, c2=None, tiers=1):
    c = c or C['roof']; c2 = c2 or C['roof2']
    o = ''
    for k in range(tiers):
        yy = y - k * h * .78; ww = w * (1 - k * .26); hh = h * (1 - k * .12)
        L, Rr = cx - ww / 2, cx + ww / 2
        o += '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0fL%.0f %.0fQ%.0f %.0f %.0f %.0fQ%.0f %.0f %.0f %.0fZ" fill="%s"/>' % (L - 12, yy - 8, L + 10, yy + 6, L + ww * .2, yy - hh, Rr - ww * .2, yy - hh, Rr - 10, yy + 6, Rr + 12, yy - 8, cx, yy + 12, L - 12, yy - 8, c)
        o += '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0fQ%.0f %.0f %.0f %.0fL%.0f %.0fQ%.0f %.0f %.0f %.0fZ" fill="%s"/>' % (L - 12, yy - 8, cx, yy + 12, Rr + 12, yy - 8, cx, yy + 22, L - 2, yy + 4, cx, yy + 22, L - 2, yy + 4, L - 12, yy - 8, c2)
        o += '<rect x="%.0f" y="%.0f" width="%.0f" height="5" rx="2.5" fill="%s"/>' % (L + ww * .2 - 4, yy - hh - 3, ww * .6 + 8, C['cream'])
    return o

def wall(cx, y, w, h, doors=3, c=None):
    o = '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="%s"/>' % (cx - w / 2, y, w, h, c or C['wall'])
    o += '<rect x="%.0f" y="%.0f" width="%.0f" height="7" fill="%s" opacity=".25"/>' % (cx - w / 2, y, w, C['wood'])
    dw = w / (doors * 2 + 1)
    for i in range(doors):
        o += '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" rx="%.0f" fill="%s"/>' % (cx - w / 2 + dw * (2 * i + 1), y + h * .3, dw, h * .7, dw / 2, C['wood'])
    return o

def areca(x, y, s=1):
    fr = ''.join('<path d="M0 0Q%d %d %d %d" stroke="%s" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (dx * .5, dy - 16, dx, dy, C['leaf'] if i % 2 else C['green'], 5 * s) for i, (dx, dy) in enumerate([(-34, 10), (-26, -14), (-8, -24), (10, -24), (28, -12), (34, 12)]))
    return '<g transform="translate(%d %d) scale(%.2f)"><rect x="-3" y="-78" width="6" height="78" fill="%s"/><g transform="translate(0 -78)">%s</g></g>' % (x, y, s, C['wood'], fr)

def bamboo(x, y, n=5):
    o = ''
    for i in range(n):
        xx = x + i * 11; h = 58 + (i * 37) % 36
        o += '<path d="M%d %dQ%d %d %d %d" stroke="%s" stroke-width="4" fill="none"/>' % (xx, y, xx + 2, y - h / 2, xx + 8, y - h, C['green'])
        for k in range(3): o += '<ellipse cx="%d" cy="%d" rx="13" ry="4" transform="rotate(%d %d %d)" fill="%s"/>' % (xx + 9 + k * 4, y - h + k * 14, -22, xx + 9, y - h, C['leaf'] if k % 2 else C['teal'])
    return o

def tree(x, y, r, c=None):
    return '<rect x="%d" y="%d" width="8" height="%d" fill="%s"/><circle cx="%d" cy="%d" r="%d" fill="%s"/><path d="M%d %dA%d %d 0 0 0 %d %dZ" fill="%s" opacity=".35"/>' % (x - 4, y - r, r, C['wood'], x, y - r * 1.5, r, c or C['teal'], x - r, y - r * 1.5, r, r, x + r, y - r * 1.5, C['deep'])

def banyan(x, y):
    o = '<path d="M%d %dQ%d %d %d %dL%d %dQ%d %d %d %dZ" fill="%s"/>' % (x - 22, y, x - 8, y - 40, x - 12, y - 86, x + 14, y - 86, x + 10, y - 40, x + 26, y, C['wood'])
    for dx, dy, r, c in [(-52, -116, 46, C['teal']), (44, -120, 50, C['teal']), (-4, -148, 56, C['green']), (-74, -92, 30, C['green']), (74, -94, 32, C['green'])]:
        o += '<circle cx="%d" cy="%d" r="%d" fill="%s"/>' % (x + dx, y + dy, r, c)
    for dx in (-60, -34, 38, 66): o += '<path d="M%d %dv%d" stroke="%s" stroke-width="2.5"/>' % (x + dx, y - 80, 52 + (dx % 13), C['wood'])
    return o

def well(x, y):
    return ('<ellipse cx="%d" cy="%d" rx="34" ry="13" fill="%s"/><rect x="%d" y="%d" width="68" height="20" fill="%s"/><ellipse cx="%d" cy="%d" rx="34" ry="13" fill="%s"/><ellipse cx="%d" cy="%d" rx="25" ry="8" fill="%s"/>'
            % (x, y + 20, C['roof2'], x - 34, y, C['roof'], x, y, '#CF6A49', x, y, C['river']))

def label(x, y, text, sub=None, badge=None, next_=False):
    w = 16 + len(text) * 8.6 + 14
    o = '<g transform="translate(%d %d)"><rect x="%.0f" y="-15" width="%.0f" height="30" rx="15" fill="%s"/><text y="5" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="600" font-size="14" fill="%s">%s</text>' % (x, y, -w / 2, w, C['coral'] if next_ else C['paper'], '#fff' if next_ else C['ink'], text)
    if badge: o += '<g class="next"><circle cx="%.0f" cy="-14" r="13" fill="%s"/><text x="%.0f" y="-9" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="13" fill="%s">%s</text></g>' % (w / 2, C['sun'], w / 2, C['ink'], badge)
    return o + '</g>'

def scene():
    o = '<rect width="1100" height="720" fill="%s"/>' % C['sky']
    # mặt trời trống đồng
    rays = ''.join('<path d="M0 -52L6 -82L-6 -82Z" transform="rotate(%d)" fill="%s"/>' % (a, C['sun']) for a in range(0, 360, 30))
    o += '<g transform="translate(690 92)"><circle r="46" fill="%s"/><circle r="30" fill="none" stroke="%s" stroke-width="2"/><circle r="16" fill="%s"/>%s</g>' % (C['sun'], C['coral'], C['coral'], rays)
    # núi đá vôi
    o += '<path d="M-20 240C20 120 60 96 96 170C120 90 170 60 204 160C240 120 268 120 300 200L320 260H-20Z" fill="#7FBFA9"/>'
    o += '<path d="M760 240C790 120 830 80 868 170C900 80 950 96 985 180C1020 120 1070 110 1120 190V270H760Z" fill="#7FBFA9"/>'
    o += '<path d="M280 250C330 170 370 150 410 214C450 170 500 180 530 244Z" fill="#9CCFB7"/>'
    # đồi
    o += '<path d="M-10 250C160 190 320 240 520 222C720 204 900 232 1110 200V730H-10Z" fill="%s"/>' % C['lime']
    o += '<path d="M-10 330C200 270 420 350 620 310C820 270 960 320 1110 280V730H-10Z" fill="%s"/>' % C['leaf']
    # ruộng bậc thang bên phải
    for k in range(7): o += '<path d="M%d %dQ%d %d %d %d" stroke="%s" stroke-width="9" fill="none" stroke-linecap="round"/>' % (690 - k * 6, 300 - k * 13, 880, 232 - k * 15, 1110, 268 - k * 13, C['green'] if k % 2 else '#7DB653')
    # sông
    o += '<path d="M-20 500C170 440 300 540 480 512S770 440 1120 506V600C780 530 640 620 470 600S170 530 -20 590Z" fill="%s"/>' % C['river']
    for x, y, w in [(90, 500, 70), (300, 540, 90), (620, 510, 80), (860, 498, 100), (980, 540, 60)]: o += '<path d="M%d %dh%d" stroke="%s" stroke-width="3" stroke-linecap="round"/>' % (x, y, w, C['river2'])
    # đất dưới
    o += '<path d="M-10 600C170 540 300 620 470 610S780 540 1110 610V730H-10Z" fill="%s"/>' % C['green']
    # ao sen
    o += '<ellipse cx="720" cy="668" rx="74" ry="26" fill="%s"/>' % C['river']
    for x, y in [(680, 664), (718, 674), (760, 662), (700, 682)]: o += '<ellipse cx="%d" cy="%d" rx="13" ry="5" fill="%s"/>' % (x, y, C['teal'])
    o += '<path d="M730 658q-7 -12 0 -16q7 4 0 16Z" fill="#F2A0AE"/><path d="M692 654q-6 -10 0 -14q6 4 0 14Z" fill="#F2A0AE"/>'
    # đường vàng + cầu
    road = 'M170 640C260 610 330 640 400 610C440 590 430 540 420 500C410 450 330 450 330 410C330 370 440 360 520 350C600 340 610 300 520 280C430 262 300 270 250 250'
    road2 = 'M520 350C640 340 760 340 850 300C920 268 900 230 880 214M520 350C600 420 620 470 600 540C590 580 700 620 860 600'
    o += '<path d="%s" stroke="%s" stroke-width="20" fill="none" stroke-linecap="round"/><path d="%s" stroke="%s" stroke-width="20" fill="none" stroke-linecap="round"/>' % (road, C['mustard'], road2, C['mustard'])
    o += '<path d="%s" stroke="%s" stroke-width="2" stroke-dasharray="10 12" fill="none"/><path d="%s" stroke="%s" stroke-width="2" stroke-dasharray="10 12" fill="none"/>' % (road, C['sun'], road2, C['sun'])
    for bx, by in [(424, 540), (604, 520)]: o += '<path d="M%d %dq30 -18 60 0" stroke="%s" stroke-width="22" fill="none"/><path d="M%d %dq30 -18 60 0" stroke="%s" stroke-width="3" fill="none"/>' % (bx - 30, by, C['wood'], bx - 30, by - 13, C['roof2'])
    # cây trang trí
    for f in [areca(60, 330), areca(96, 346, .8), areca(1040, 420), areca(1072, 440, .8), areca(486, 470, .7), bamboo(690, 430), bamboo(30, 700), bamboo(980, 700), tree(740, 420, 22), tree(160, 460, 20, C['deep']), tree(960, 300, 18)]: o += f
    # 1 Trường làng: cổng tam quan
    o += '<g>' + wall(250, 196, 150, 50) + roof(250, 196, 170, 34) + '<rect x="222" y="150" width="56" height="50" fill="%s"/>' % C['wall'] + roof(250, 152, 80, 22) + '</g>'
    # 2 Giếng làng + cây đa
    o += banyan(240, 420) + well(330, 396)
    # 3 Đình làng: mái lớn
    o += '<g>' + wall(560, 296, 190, 56, 5) + roof(560, 296, 214, 46, tiers=2) + '</g>'
    # 4 Thư các: gác cao
    o += '<g><rect x="856" y="150" width="64" height="66" fill="%s"/><circle cx="888" cy="176" r="15" fill="%s"/><circle cx="888" cy="176" r="10" fill="%s"/>' % (C['wall'], C['wood'], C['sun']) + roof(888, 150, 96, 28, tiers=2) + '<rect x="838" y="216" width="100" height="10" fill="%s"/><rect x="848" y="226" width="12" height="40" fill="%s"/><rect x="916" y="226" width="12" height="40" fill="%s"/></g>' % (C['wood'], C['wall'], C['wall'])
    # 5 Bến thuyền
    o += '<rect x="470" y="596" width="90" height="10" fill="%s"/>' % C['wood'] + ''.join('<rect x="%d" y="600" width="6" height="26" fill="%s"/>' % (x, C['roof2']) for x in (478, 510, 544))
    o += '<g transform="translate(350 560)"><path d="M-62 -6Q0 26 66 -10L52 16Q0 30 -48 16Z" fill="%s"/><path d="M-30 -4Q0 -46 34 -6Z" fill="%s"/><path d="M60 -8L52 -44" stroke="%s" stroke-width="3"/></g>' % (C['wood'], C['mustard'], C['wood'])
    # 6 Chợ quê
    for x, c in [(800, C['coral']), (880, C['mustard']), (960, C['teal'])]:
        o += '<rect x="%d" y="600" width="64" height="30" fill="%s"/><path d="M%d 604L%d 576H%dL%d 604Z" fill="%s"/>' % (x - 32, 630 - 30, x - 40, x - 28, x + 28, x + 40, c) + wall(x, 604, 64, 28, 1)
    # 7 Nhà tranh của thú cưng
    o += wall(120, 620, 100, 46, 2) + '<path d="M50 626Q120 556 190 626Z" fill="%s"/><path d="M50 626Q120 600 190 626Z" fill="%s"/>' % (C['mustard'], '#C8933A')
    # 8 Tháp thành tựu
    o += '<g><path d="M1014 400L1000 270H1024Z" fill="%s" transform="translate(-30 0)"/></g>' % C['wall']
    for k in range(4): o += '<rect x="%d" y="%d" width="%d" height="26" fill="%s"/>' % (960 - (4 - k) * 3, 370 - k * 30, 28 + (4 - k) * 6, C['wall']) + roof(974, 370 - k * 30, 46 + (4 - k) * 8, 12)
    # chim, mây
    for x, y in [(460, 70), (510, 96), (420, 110)]: o += '<path d="M%d %dq12 -12 22 0q10 -12 22 0" stroke="%s" stroke-width="3" fill="none" stroke-linecap="round"/>' % (x, y, C['ink'])
    for x, y, w in [(90, 60, 130), (900, 56, 110)]: o += '<rect x="%d" y="%d" width="%d" height="20" rx="10" fill="%s"/><rect x="%d" y="%d" width="%d" height="20" rx="10" fill="%s"/>' % (x, y, w, C['paper'], x + 24, y - 14, w * .55, C['paper'])
    return o

def r1():
    pins = (label(250, 118, 'Trường làng') + label(888, 96, 'Thư các') + label(560, 196, 'Đình làng') + label(330, 450, 'Giếng làng', badge='24', next_=True) + label(974, 416, 'Tháp vinh danh') + label(515, 574, 'Bến thuyền') + label(880, 664, 'Chợ quê') + label(120, 690, 'Nhà của Kitsu'))
    trail = '<path class="trail" d="M430 560C436 520 420 480 372 450" stroke="#E2583E" stroke-width="5" stroke-dasharray="4 18" stroke-linecap="round" fill="none"/>'
    body = ('<div class="v" style="width:1100px;height:720px">'
            '<svg class="abs" style="left:0;top:0" width="1100" height="720" role="img" aria-label="Bản đồ làng, mỗi địa điểm là một mục">' + '<defs>' + GRAIN + '</defs>' + scene() + trail + kitsu(430, 580, 92, 'ehappy', 'walk') + pins
            + '<rect width="1100" height="720" filter="url(#grain)" opacity=".5"/></svg>'
            '<div class="abs" style="left:20px;top:18px;display:flex;gap:8px"><span class="pill">12 ngày liền</span><span class="pill">540 xu</span><span class="pill">Cấp 12</span></div>'
            '<div class="abs" style="right:20px;top:18px;display:flex;gap:8px"><span class="pill">Tìm từ <kbd>Ctrl K</kbd></span><span class="pill">Cài đặt</span></div>'
            '<div class="abs" style="left:300px;bottom:16px"><button class="go">Tới Giếng làng, ôn 24 từ <kbd style="background:rgba(255,255,255,.22);color:#fff">Enter</kbd></button></div></div>')
    write('R1Home', 'Làng chữ, bản đồ chính', 1100, 720, body)

def side(x, w, scene_svg, h=720):
    return '<svg class="abs" style="left:%dpx;top:0" width="%d" height="%d" viewBox="0 0 %d %d" aria-hidden="true"><defs>%s</defs>%s<rect width="%d" height="%d" filter="url(#grain)" opacity=".5"/></svg>' % (x, w, h, w, h, GRAIN, scene_svg, w, h)

def r2():
    sc = ('<rect width="420" height="720" fill="%s"/><path d="M-10 260C60 170 110 150 150 220C180 150 240 120 280 210C320 170 380 190 430 250V330H-10Z" fill="#9CCFB7"/><path d="M-10 330C120 280 280 340 430 300V730H-10Z" fill="%s"/><path d="M-10 560C120 520 280 590 430 540V730H-10Z" fill="%s"/>' % (C['sky'], C['lime'], C['leaf'])
          + banyan(150, 500) + well(280, 520)
          + '<g transform="translate(280 470)"><path d="M-42 50V-34H42V50" stroke="%s" stroke-width="7" fill="none"/></g>' % C['wood'] + roof(280, 436, 110, 24)
          + '<rect x="276" y="450" width="2" height="46" fill="%s"/><path d="M268 494H288L284 516H272Z" fill="%s"/>' % (C['wood'], C['mustard'])
          + kitsu(170, 660, 170, 'eopen'))
    lamps = ''.join('<div style="width:14px;height:14px;border-radius:7px;background:%s"></div>' % (C['coral'] if i < 7 else '#E8E0CC') for i in range(24))
    opts = ''.join('<div style="display:flex;align-items:center;gap:14px;height:52px;padding:0 18px;border-radius:14px;background:%s;font-size:18px;font-weight:%s;color:%s"><kbd>%d</kbd>%s</div>' % ('#DFF0E3' if a else '#F3EDDD', 600 if a else 500, C['ink'], i + 1, t) for i, (t, a) in enumerate([('hào hứng', 0), ('miễn cưỡng', 1), ('nhút nhát', 0), ('tức giận', 0)]))
    rate = ''.join('<button style="flex:1;height:84px;border:0;border-radius:16px;background:%s;color:%s;font:600 16px \'Be Vietnam Pro\',sans-serif;cursor:pointer"><kbd>%d</kbd> %s<div style="font:400 13px \'Be Vietnam Pro\',sans-serif">sau %s</div></button>' % (C['coral'] if s_ else '#F3EDDD', '#fff' if s_ else C['ink'], i + 1, t, d) for i, (t, d, s_) in enumerate([('Quên', '10 phút', 0), ('Khó', '3 giờ', 0), ('Được', '2 ngày', 1), ('Dễ', '6 ngày', 0)]))
    body = ('<div class="v" style="width:1100px;height:720px;background:%s">' % C['paper'] + side(0, 420, sc)
            + '<div class="abs" style="left:20px;top:18px"><span class="pill">Về làng <kbd>Esc</kbd></span></div>'
            '<div class="abs" style="left:468px;right:40px;top:28px"><div style="display:flex;justify-content:space-between;font-size:14px;color:%s;font-weight:500"><span>Giếng làng</span><span>7 trên 24 từ</span></div><div style="display:flex;gap:6px;margin-top:8px">%s</div></div>' % (C['soft'], lamps)
            + '<h1 class="t1 abs" style="left:468px;top:108px;font-size:76px">reluctant</h1>'
            '<div class="abs" style="left:468px;top:200px;display:flex;align-items:center;gap:14px;color:%s"><span class="ipa">/rɪˈlʌktənt/</span><span>tính từ</span><button class="ghost">Nghe <kbd>R</kbd></button></div>' % C['soft']
            + '<div class="abs" style="left:468px;top:252px;width:590px;font-size:17px">She was <b style="color:%s">reluctant</b> to lend him the money.</div>' % C['coral']
            + '<div class="abs" style="left:468px;right:40px;top:304px;display:grid;grid-template-columns:1fr 1fr;gap:10px">' + opts + '</div>'
            '<div class="abs" style="left:468px;top:446px;font-size:15px;color:%s">Đúng rồi. Lần sau muốn gặp lại từ này khi nào? Gợi ý: Được.</div>' % C['soft']
            + '<div class="abs" style="left:468px;right:40px;top:484px;display:flex;gap:10px">' + rate + '</div>'
            '<div class="abs" style="left:468px;right:40px;top:586px;display:flex;justify-content:space-between"><button class="ghost" style="padding:0">Hoàn tác <kbd>Z</kbd></button></div></div>')
    write('R2Review', 'Giếng làng, ôn từ', 1100, 720, body)

def r3():
    sc = ('<rect width="360" height="720" fill="%s"/><path d="M-10 300C80 220 120 200 170 260C220 190 300 200 370 270V340H-10Z" fill="#9CCFB7"/><path d="M-10 340C120 300 240 350 370 310V730H-10Z" fill="%s"/>' % (C['sky'], C['lime'])
          + wall(180, 420, 240, 90, 3) + roof(180, 420, 280, 52) + '<rect x="130" y="330" width="100" height="60" fill="%s"/>' % C['wall'] + roof(180, 334, 140, 30)
          + '<path d="M-10 560C120 520 240 570 370 530V730H-10Z" fill="%s"/>' % C['leaf'] + areca(40, 560) + areca(324, 548, .9) + kitsu(180, 690, 170, 'eopen'))
    ex = [('I', 'was', 'at home last night.', 'Tối qua tôi ở nhà.'), ('We', 'watched', 'a movie yesterday.', 'Hôm qua chúng tôi xem phim.'), ('She', 'went', 'to Da Nang last summer.', 'Hè năm ngoái cô ấy đi Đà Nẵng.')]
    rows = ''.join('<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-top:1px solid #E8E0CC"><button aria-label="Nghe câu" style="width:36px;height:36px;flex:none;border:0;border-radius:18px;background:#DFF0E3;cursor:pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="%s"><polygon points="6 3 20 12 6 21"/></svg></button><div><div style="font-size:19px;font-weight:500">%s <b style="color:%s;font-weight:800">%s</b> %s</div><div style="font-size:14px;color:%s">%s</div></div></div>' % (C['deep'], a, C['coral'], b, c, C['soft'], d) for a, b, c, d in ex)
    steps = ''.join('<span style="font-size:14px;font-weight:%s;color:%s">%s</span>' % (600 if i == 0 else 500, C['coral'] if i == 0 else C['soft'], t) for i, t in enumerate(['1 Hiểu bài', '2 Ví dụ', '3 Luyện tập']))
    body = ('<div class="v" style="width:1100px;height:720px;background:%s">' % C['paper'] + side(740, 360, sc)
            + '<div class="abs" style="left:48px;top:24px;display:flex;gap:20px;align-items:center"><span class="pill" style="background:#F3EDDD;box-shadow:none">Về Trường làng <kbd>Esc</kbd></span>' + steps + '</div>'
            '<h1 class="t1 abs" style="left:48px;top:86px;font-size:56px">Thì quá khứ đơn</h1>'
            '<p class="abs" style="left:48px;top:158px;width:620px;margin:0;font-size:17px">Dùng khi việc đã xảy ra và đã kết thúc, thường kèm mốc thời gian như yesterday, last night, in 2019.</p>'
            '<svg class="abs" style="left:48px;top:226px" width="640" height="76" aria-label="Trục thời gian"><line x1="0" y1="48" x2="628" y2="48" stroke="%s" stroke-width="3"/><path d="M618 40L632 48L618 56" fill="none" stroke="%s" stroke-width="3"/><circle cx="210" cy="48" r="12" fill="%s"/><line x1="500" y1="34" x2="500" y2="62" stroke="%s" stroke-width="3"/><text x="210" y="22" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="600" font-size="14" fill="%s">việc đã xong</text><text x="500" y="22" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="600" font-size="14" fill="%s">bây giờ</text></svg>' % (C['deep'], C['deep'], C['coral'], C['deep'], C['coral'], C['deep'])
            + '<div class="abs" style="left:48px;top:316px;width:640px">' + rows + '</div>'
            '<div class="abs" style="left:48px;top:560px;width:640px;background:#FBEBD0;border-radius:14px;padding:12px 16px;font-size:15px">Hay nhầm: viết <b>Did he went?</b> Sau did, động từ về nguyên mẫu: <b style="color:%s">Did he go?</b></div>' % C['coral']
            + '<div class="abs" style="left:48px;top:636px;display:flex;align-items:center;gap:16px"><button class="go">Làm 10 câu luyện tập</button><span style="color:%s">Khoảng 4 phút</span></div></div>' % C['soft'])
    write('R3Lesson', 'Trường làng, bài học', 1100, 720, body)

r1(); r2(); r3(); print('ok')
