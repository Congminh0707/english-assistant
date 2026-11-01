# Cảnh địa điểm tầng 2: Pháp (PFrance) - Paris, tháp Eiffel, sông Seine, quán cà phê và quầy hàng ăn nhẹ. Chuẩn: docs/22 §12.
#   BOARD_OUT=<project> python gen_places_france.py
# 5 biển chạm: Cà phê, Phô mai, Mứt, Bánh kếp, Kem (đúng 5 từ trong w-05-france.json: coffee, cheese, jam, pancake, icecream).
import math, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gen_places_south as S   # helper dùng chung: page, cloud, lin, water_defs, reflect (nó tự nạp gen_review2)
G, V, lin, cloud, water_defs, reflect = S.G, S.V, S.lin, S.cloud, S.water_defs, S.reflect
INK = S.INK
R = random.Random(75)

CSS = """<style>
@keyframes steam{0%{transform:translate(0,0) scale(.6);opacity:0}30%{opacity:.7}100%{transform:translate(3px,-22px) scale(1.4);opacity:0}}
.steam{animation:steam 3.2s ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
@keyframes flagw{0%,100%{transform:skewY(0) scaleX(1)}50%{transform:skewY(5deg) scaleX(.94)}}
.flagw{animation:flagw 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:left center}
@keyframes bulb{0%,100%{opacity:.55}50%{opacity:1}}
.bulb{animation:bulb 2.2s ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes pig{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.pig{animation:pig 1.1s ease-in-out infinite;animation-delay:var(--d,0s)}
@media (prefers-reduced-motion:reduce){.steam,.flagw,.bulb,.pig{animation:none}.steam{opacity:0}}
</style>"""

STONE = '#F0E2C2'; STONE_D = '#D8C39A'; ZINC = '#6C7C94'; ZINC_D = '#4E5C74'


def uid():
    return V.uid()


def awning(x0, x1, y, h, c1, c2, n=10, slope=14, fringe=True):
    """Mái che sọc: hình thang nhìn chếch, tua cuốn tròn ở mép dưới."""
    o = ''
    tw = (x1 - x0 - 2 * slope) / n; bw = (x1 - x0) / n
    for i in range(n):
        c = c1 if i % 2 == 0 else c2
        a, b = x0 + slope + i * tw, x0 + slope + (i + 1) * tw
        c_, d_ = x0 + i * bw, x0 + (i + 1) * bw
        o += '<path d="M%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fZ" fill="%s" stroke="%s" stroke-width="1"/>' % (a, y, b, y, d_, y + h, c_, y + h, c, INK)
        if fringe:
            o += '<path d="M%.1f %.1fa%.1f %.1f 0 0 0 %.1f 0Z" fill="%s" stroke="%s" stroke-width="1"/>' % (c_, y + h, bw / 2, bw * .42, bw, c, INK)
    return o + '<path d="M%.1f %.1fH%.1f" stroke="#fff" stroke-width="2" opacity=".35"/>' % (x0 + slope, y + 2, x1 - slope)


def platane(x, y, h, s=1):
    """Cây tiêu huyền (platane) Paris: thân loang xám kem, tán tròn xanh lá."""
    w = 12 * s
    o = '<path d="M%.0f %dQ%.0f %d %.0f %dL%.0f %dQ%.0f %d %.0f %dZ" fill="#C9C0AC" stroke="%s" stroke-width="1.3"/>' % (x - w / 2 - 2, y, x - w * .4, y - h * .5, x - w * .3, y - h, x + w * .3, y - h, x + w * .4, y - h * .5, x + w / 2 + 2, y, INK)
    for _ in range(int(h / 14)):
        o += '<ellipse cx="%.0f" cy="%.0f" rx="%.1f" ry="%.1f" fill="%s" opacity=".75"/>' % (x + R.uniform(-w * .3, w * .3), y - R.uniform(10, h - 8), R.uniform(2, 4.5), R.uniform(3, 7), R.choice(['#8C8672', '#A8A08A', '#7A7460']))
    crown = '<path d="M%d %dl-%d -%d M%d %dl%d -%d" stroke="#8C8672" stroke-width="%.1f" stroke-linecap="round"/>' % (x, y - h, 26 * s, 24 * s, x, y - h, 26 * s, 26 * s, 5 * s)
    pal = ['#2C7A4A', '#3C9658', '#58B25E', '#7ACB66']
    top = y - h - 54 * s
    for _ in range(int(120 * s)):
        a, r_ = R.uniform(0, 6.28), R.uniform(0, 1) ** .6
        cx, cy = x + math.cos(a) * r_ * 76 * s, top + 8 * s + math.sin(a) * r_ * 58 * s
        c_ = pal[min(3, max(0, int(2.2 - (cy - top) / (34 * s) + R.uniform(-1, 1.2))))]
        crown += '<circle cx="%.0f" cy="%.0f" r="%.1f" fill="%s"/>' % (cx, cy, R.uniform(8, 16) * s, c_)
    for _ in range(40):
        a, r_ = R.uniform(0, 6.28), R.uniform(.2, 1)
        crown += '<circle cx="%.0f" cy="%.0f" r="2.4" fill="#C4EC8C" opacity=".8"/>' % (x + math.cos(a) * r_ * 70 * s, top + 4 * s + math.sin(a) * r_ * 50 * s)
    return o + V.sway(crown, x, y - h, 5.4 + (x % 5) * .3, (x % 7) * .5)


def eiffel(cx, y0, H=350, W0=104):
    """Tháp Eiffel: bóng sắt cong, vòm chân, 3 sàn, lưới giằng chéo cắt theo hình tháp."""
    hw = lambda t: W0 * (1 - t) ** 2.8 + 2.6 + 6 * (1 - t) ** 7
    ts = [i / 40 for i in range(0, 35)]            # tới t=.875 thì chuyển sang chóp
    L = [(cx - hw(t), y0 - t * H) for t in ts]; Rr = [(cx + hw(t), y0 - t * H) for t in ts]
    tt = .875
    sil = 'M' + 'L'.join('%.1f %.1f' % p for p in L) + 'L%.1f %.1f' % (cx - 1.6, y0 - H * .93) + 'L%.1f %.1f' % (cx, y0 - H) + 'L%.1f %.1f' % (cx + 1.6, y0 - H * .93) + 'L' + 'L'.join('%.1f %.1f' % p for p in reversed(Rr)) + 'Z'
    a_w = hw(0) * .62; a_h = H * .17
    arch = 'M%.1f %.1fC%.1f %.1f %.1f %.1f %.1f %.1fZ' % (cx - a_w, y0, cx - a_w * .85, y0 - a_h * 1.7, cx + a_w * .85, y0 - a_h * 1.7, cx + a_w, y0)
    cid = uid()
    o = '<clipPath id="%s"><path d="%s %s" clip-rule="evenodd"/></clipPath>' % (cid, sil, arch)
    o += '<path d="%s %s" fill="#8A6F5C" fill-rule="evenodd" stroke="%s" stroke-width="1.6" stroke-linejoin="round"/>' % (sil, arch, INK)
    lat = '<g clip-path="url(#%s)" stroke="#3E2E24" stroke-width="1.05" fill="none" opacity=".85">' % cid
    bands = [0, .045, .09, .135, .18, .225, .27, .315, .36, .42, .48, .54, .6, .67, .74, .81, .875]
    for a, b in zip(bands, bands[1:]):
        xl, xr = cx - hw(a), cx + hw(a); xl2, xr2 = cx - hw(b), cx + hw(b)
        ya, yb = y0 - a * H, y0 - b * H
        lat += '<path d="M%.1f %.1fL%.1f %.1fM%.1f %.1fL%.1f %.1fM%.1f %.1fH%.1f"/>' % (xl, ya, xr2, yb, xr, ya, xl2, yb, xl2 - 1, yb, xr2 + 1)
        if a < .5:
            m = cx; lat += '<path d="M%.1f %.1fL%.1f %.1fM%.1f %.1fL%.1f %.1f"/>' % (xl, ya, m, yb, xr, ya, m, yb)
    lat += '<path d="M%.1f %.1fV%.1f" stroke-width="1.3"/>' % (cx, y0 - H * .2, y0 - H * .9)
    o += lat + '</g>'
    # mặt phải tối hơn cho khối
    o += '<g clip-path="url(#%s)"><rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#3A2A20" opacity=".22"/></g>' % (cid, cx + hw(0) * .05, y0 - H, hw(0) * 1.2, H)
    # sàn quan sát
    for t, ext, hh in ((.18, 7, 9), (.36, 6, 8), (.875, 5, 6)):
        w_ = hw(t) + ext
        o += '<rect x="%.1f" y="%.1f" width="%.1f" height="%d" rx="1.5" fill="#5B4636" stroke="%s" stroke-width="1.4"/><path d="M%.1f %.1fH%.1f" stroke="#C9A98A" stroke-width="1.2" opacity=".6"/>' % (cx - w_, y0 - t * H - hh / 2, 2 * w_, hh, INK, cx - w_ + 2, y0 - t * H - hh / 2 + 2, cx + w_ - 2)
    o += '<rect x="%.1f" y="%.1f" width="9" height="9" fill="#6E5644" stroke="%s" stroke-width="1.2"/>' % (cx - 4.5, y0 - H * .875 - 15, INK)
    o += '<path d="M%.1f %.1fV%.1f" stroke="%s" stroke-width="2.2"/>' % (cx, y0 - H * .93, y0 - H - 12, INK)
    o += '<circle class="bulb" cx="%.1f" cy="%.1f" r="3.4" fill="#FFE27A" stroke="#C94A2A" stroke-width="1"/>' % (cx, y0 - H - 13)
    return o


def haus(x, yb, w, fl, wall=STONE, roof=ZINC, dormers=True, chim=2, hazed=False):
    """Nhà Haussmann: tường đá kem, cửa sổ cao có lan can sắt, mái mansard xám xanh có cửa sổ mái và ống khói."""
    fh = 21; hh = fl * fh; yt = yb - hh
    o = '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="%s" stroke="%s" stroke-width="1.3"/>' % (x, yt, w, hh, wall, INK)
    o += '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="#000" opacity=".06"/>' % (x + w * .62, yt, w * .38, hh)
    n = max(2, int(w / 21))
    for f in range(fl - 1):
        yy = yb - (f + 1) * fh - 1 + (fh - 15) / 2
        if f == 0: continue
        for k in range(n):
            wx = x + (k + .5) * w / n - 3.5
            o += '<rect x="%.1f" y="%.1f" width="7" height="14" rx="3" fill="#5E7088" stroke="%s" stroke-width=".8"/><path d="M%.1f %.1fv14" stroke="#B6C6D6" stroke-width=".8" opacity=".7"/>' % (wx, yy, INK, wx + 3.5, yy)
            if f in (1, fl - 2): o += '<path d="M%.1f %.1fH%.1f" stroke="#2A2A32" stroke-width="1.6"/><path d="M%.1f %.1fv-3M%.1f %.1fv-3M%.1f %.1fv-3" stroke="#2A2A32" stroke-width="1"/>' % (wx - 3, yy + 15, wx + 10, wx - 1, yy + 15, wx + 3.5, yy + 15, wx + 8, yy + 15)
    for f in range(1, fl):
        o += '<path d="M%.0f %.0fH%.0f" stroke="%s" stroke-width="1.2" opacity=".7"/>' % (x, yb - f * fh, x + w, STONE_D)
    # tầng trệt: cửa hiệu
    for k in range(n):
        o += '<rect x="%.1f" y="%.1f" width="%.1f" height="%d" fill="%s" stroke="%s" stroke-width=".8"/>' % (x + (k + .15) * w / n, yb - 17, w / n * .7, 17, R.choice(['#2F5A4A', '#7A3A3A', '#2F4A6A']), INK)
    # mái mansard
    rt = 28
    o += '<path d="M%.0f %.0fL%.0f %.0fL%.0f %.0fL%.0f %.0fZ" fill="%s" stroke="%s" stroke-width="1.3"/>' % (x - 3, yt, x + w + 3, yt, x + w - 9, yt - rt, x + 9, yt - rt, roof, INK)
    o += '<path d="M%.0f %.0fH%.0f" stroke="#fff" stroke-width="1" opacity=".25"/>' % (x + 2, yt - 4, x + w - 2)
    for k in range(0, int(w / 7)):
        o += '<path d="M%.1f %.1fL%.1f %.1f" stroke="%s" stroke-width=".7" opacity=".55"/>' % (x + 4 + k * 7, yt - 1, x + 11 + k * 6.1 * (w - 18) / (w - 4) - 4, yt - rt + 1, ZINC_D)
    if dormers:
        for k in range(max(1, int(w / 40))):
            dx = x + (k + .5) * w / max(1, int(w / 40)) - 7
            o += '<path d="M%.1f %.1fh14v-13l-7 -7l-7 7Z" fill="%s" stroke="%s" stroke-width="1"/><rect x="%.1f" y="%.1f" width="6" height="9" rx="1" fill="#E8F0F4" opacity=".9"/>' % (dx, yt - 4, wall, INK, dx + 4, yt - 15)
    for c in range(chim):
        cx_ = x + w * (.2 + .55 * c) + R.uniform(-4, 4)
        o += '<rect x="%.1f" y="%.1f" width="9" height="16" fill="#B86A52" stroke="%s" stroke-width="1"/><rect x="%.1f" y="%.1f" width="3" height="5" fill="#8A4A38"/><rect x="%.1f" y="%.1f" width="3" height="5" fill="#8A4A38"/>' % (cx_, yt - rt - 12, INK, cx_ + .8, yt - rt - 17, cx_ + 5.2, yt - rt - 17)
    return o


def far_row(x0, x1, yb):
    o = ''; x = x0
    while x < x1:
        w = R.randint(70, 118); fl = R.randint(5, 7)
        o += haus(x, yb, w, fl, R.choice(['#EFE0C4', '#E8D8B8', '#F2E6CE']), R.choice([ZINC, '#7A8CA4', '#62708A']), True, R.randint(1, 2))
        x += w + R.randint(-4, 2)
    return o


def stripes_flag(x, y, s=1):
    return '<g class="flagw" transform="translate(%d %d) scale(%.2f)"><rect width="12" height="22" fill="#2A4FA8"/><rect x="12" width="12" height="22" fill="#FFF9EA"/><rect x="24" width="12" height="22" fill="#D63A3A"/><rect width="36" height="22" fill="none" stroke="%s" stroke-width="1"/></g>' % (x, y, s, INK)


def bistro_chair(x, y, s=1, c='#3A2A22', flip=False):
    sx = -s if flip else s
    return '<g transform="translate(%d %d) scale(%.2f %.2f)"><path d="M-8 0L-10 22M8 0L10 22M-8 0Q0 -4 8 0" stroke="%s" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cy="-1" rx="10" ry="4" fill="#C9763A" stroke="%s" stroke-width="1"/><path d="M-8 -3Q-9 -22 0 -22Q9 -22 8 -3" stroke="%s" stroke-width="2.2" fill="none"/><path d="M-5 -6Q0 -18 5 -6" stroke="#C9763A" stroke-width="1.6" fill="none"/></g>' % (x, y, sx, s, c, INK, c)


def bistro_table(x, y, s=1, cups=True):
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="26" rx="14" ry="3.4" fill="#120A08" opacity=".3"/><path d="M0 0V26M-10 26H10" stroke="#2E2A2A" stroke-width="3" stroke-linecap="round"/><ellipse rx="22" ry="6" fill="#F7F0E0" stroke="%s" stroke-width="1.3"/><ellipse rx="22" ry="6" fill="none" stroke="#C0392B" stroke-width="2" stroke-dasharray="3 3" opacity=".7"/>' % (x, y, s, INK)
    if cups:
        for dx in (-8, 9):
            o += '<ellipse cx="%d" cy="-2" rx="5" ry="2" fill="#fff" stroke="%s" stroke-width=".8"/><ellipse cx="%d" cy="-3" rx="3.4" ry="1.2" fill="#6A3A22"/><path class="steam" style="--d:-%ds" d="M%d -6q-3 -4 0 -8q3 -4 0 -8" stroke="#fff" stroke-width="1.4" fill="none" opacity=".7" stroke-linecap="round"/>' % (dx, INK, dx, abs(dx) % 3, dx)
    return o + '</g>'


def beret(x, y, s, c='#B22A32'):
    return '<g transform="translate(%.1f %.1f) scale(%.2f)"><ellipse cx="1" cy="-2" rx="8.5" ry="4.4" fill="%s" stroke="%s" stroke-width=".8" transform="rotate(-8)"/><circle cx="2" cy="-6.6" r="1.3" fill="%s"/></g>' % (x, y, s, c, INK, c)


def baker(x, y, s, top, bag=True):
    o = G.walker(x, y, top, s=s)
    o += beret(x, y - 49 * s, s)
    if bag: o += '<g transform="translate(%.1f %.1f) rotate(24)"><rect x="-2.2" y="-%.1f" width="4.4" height="%.1f" rx="2.2" fill="#D9A03C" stroke="#7A4A18" stroke-width=".7"/></g>' % (x + 7 * s, y - 28 * s, 22 * s, 22 * s)
    return o


def lamp(x, y, h=130):
    """Cột đèn đường Paris xanh đậm, chụp đèn cầu."""
    o = '<ellipse cx="%d" cy="%d" rx="9" ry="2.6" fill="#120A08" opacity=".35"/>' % (x, y)
    o += '<path d="M%d %dV%d" stroke="#1F3A2E" stroke-width="5" stroke-linecap="round"/><path d="M%d %dh14v-6h-14zM%d %dh10v-8h-10z" fill="#1F3A2E"/>' % (x, y, y - h, x - 7, y, x - 5, y - 14)
    o += '<path d="M%d %dQ%d %d %d %d" stroke="#1F3A2E" stroke-width="3" fill="none"/><circle cx="%d" cy="%d" r="9" fill="#FFF0B8" stroke="#1F3A2E" stroke-width="2"/><circle cx="%d" cy="%d" r="16" fill="url(#hg)" opacity=".6"/>' % (x, y - h + 6, x, y - h - 8, x + 12, y - h - 8, x + 12, y - h - 2, x + 12, y - h - 2)
    return o + '<path d="M%d %dh8" stroke="#1F3A2E" stroke-width="3"/>' % (x - 4, y - h - 14)


def cheese_wheel(x, y, w=40, h=17, c='#F2C84C', side='#D9A52E', hole=True, cut=False):
    o = '<path d="M%.1f %.1fv%d a%.1f %.1f 0 0 0 %.1f 0v-%d" fill="%s" stroke="%s" stroke-width="1.2"/>' % (x - w / 2, y, h, w / 2, w * .2, w, h, side, INK)
    o += '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" stroke="%s" stroke-width="1.2"/>' % (x, y, w / 2, w * .2, c, INK)
    if hole:
        for dx, dy, r_ in ((-.22, -.04, 3.2), (.2, .06, 2.6), (.02, -.1, 2), (-.05, .1, 2.2)):
            o += '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#B8861E" opacity=".7"/>' % (x + dx * w, y + dy * w * .4, r_, r_ * .5)
    return o


def cheese_wedge(x, y, s=1, c='#F6D45A'):
    return '<g transform="translate(%.1f %.1f) scale(%.2f)"><path d="M-14 0L14 -4L14 8L-14 8Z" fill="%s" stroke="%s" stroke-width="1.1"/><path d="M-14 0L14 -4L14 -8L-14 -4Z" fill="#FFE98A" stroke="%s" stroke-width="1.1"/><circle cx="-4" cy="4" r="2" fill="#C99A2A"/><circle cx="6" cy="2" r="1.6" fill="#C99A2A"/></g>' % (x, y, s, c, INK, INK)


def jar(x, y, c, lid='#C0392B', s=1, lab='#FFF3D6'):
    o = '<g transform="translate(%.1f %.1f) scale(%.2f)"><rect x="-8" y="-24" width="16" height="22" rx="4" fill="%s" stroke="%s" stroke-width="1.1"/><rect x="-8" y="-24" width="16" height="6" rx="2" fill="#fff" opacity=".18"/><rect x="-5.5" y="-16" width="11" height="9" rx="1.5" fill="%s" stroke="#7A4A18" stroke-width=".6"/><circle cx="0" cy="-11.5" r="2.4" fill="%s"/>' % (x, y, s, c, INK, lab, c)
    o += '<rect x="-9" y="-30" width="18" height="7" rx="2" fill="%s" stroke="%s" stroke-width="1"/>' % (lid, INK)
    for k in (0, 2): o += '<rect x="%d" y="-30" width="4.5" height="3.5" fill="#fff" opacity=".85"/><rect x="%.1f" y="-26.5" width="4.5" height="3.5" fill="#fff" opacity=".85"/>' % (-9 + k * 4.5, -9 + (k + 1) * 4.5)
    o += '<path d="M-5 -22v14" stroke="#fff" stroke-width="1.6" opacity=".35"/></g>'
    return o


def cone(x, y, scoops, s=1):
    o = '<g transform="translate(%.1f %.1f) scale(%.2f)"><path d="M-7 -20L0 4L7 -20Z" fill="#D9A25A" stroke="%s" stroke-width="1"/><path d="M-5 -18L3 -2M2 -18L-3 -4M5 -17L0 2" stroke="#9A6A2E" stroke-width=".7"/>' % (x, y, s, INK)
    for i, c in enumerate(scoops):
        o += '<circle cy="%d" r="%.1f" fill="%s" stroke="%s" stroke-width="1"/><path d="M-4 %d q3 -3 6 -1" stroke="#fff" stroke-width="1.2" opacity=".5" fill="none"/>' % (-24 - i * 11, 8.2 - i * .5, c, INK, -27 - i * 11)
    return o + '</g>'


def parasol(x, y_apex, w, rim, c1, c2, n=8, pole=0):
    """Dù lớn kẻ sọc nhìn ngang: nón dẹt, mép lượn sóng."""
    o = ''
    for i in range(n):
        a, b = -w / 2 + i * w / n, -w / 2 + (i + 1) * w / n
        c = c1 if i % 2 == 0 else c2
        o += '<path d="M0 0L%.1f %.1fQ%.1f %.1f %.1f %.1fZ" fill="%s" stroke="%s" stroke-width="1"/>' % (a, rim, (a + b) / 2, rim + 7, b, rim, c, INK)
    o = '<g transform="translate(%d %d)">%s' % (x, y_apex, o)
    o += '<circle r="3" fill="#7A4A18"/></g>'
    if pole: o += '<path d="M%d %dV%d" stroke="#6A4A32" stroke-width="3.4" stroke-linecap="round"/>' % (x, y_apex + rim, pole)
    return o


def bouquin(x, y, w=64):
    """Hộp sách bán rong ven sông (bouquiniste): thùng xanh đậm, nắp mở, sách nhiều màu."""
    o = '<rect x="%.0f" y="%.0f" width="%.0f" height="22" fill="#1F5A3A" stroke="%s" stroke-width="1.3"/>' % (x, y - 22, w, INK)
    o += '<path d="M%.0f %.0fL%.0f %.0fH%.0fL%.0f %.0fZ" fill="#2A7A4E" stroke="%s" stroke-width="1.1"/>' % (x - 2, y - 22, x + 3, y - 31, x + w - 3, x + w + 2, y - 22, INK)
    bx = x + 4
    while bx < x + w - 6:
        bw = R.randint(3, 5); bh = R.randint(10, 16)
        o += '<rect x="%.0f" y="%.0f" width="%d" height="%d" fill="%s"/>' % (bx, y - 5 - bh, bw, bh, R.choice(['#D9543C', '#F2C84C', '#4E8AC8', '#F4F0E4', '#8A5AA8', '#3CA45C']))
        bx += bw + 1
    return o + '<rect x="%.0f" y="%.0f" width="%.0f" height="9" fill="#17452C" stroke="%s" stroke-width="1"/>' % (x, y - 9, w, INK)


def pfrance():
    d = lin('skF', [('0', '#5FA8E4'), ('.45', '#A8D4F2'), ('.8', '#FFE9CC'), ('1', '#FFE0B0')]) + lin('watF', [('0', '#A6D4DE'), ('.45', '#5FA2BC'), ('1', '#3E7E9E')]) + water_defs(396, 16, 7)
    o = '<rect width="1280" height="420" fill="url(#skF)"/>'
    o += '<circle cx="1010" cy="170" r="190" fill="url(#hg)"/><circle cx="1010" cy="170" r="34" fill="#FFF6D0"/>'
    for x, y, w_ in ((250, 100, 300), (560, 54, 240), (930, 80, 320), (1200, 190, 220), (70, 220, 200)): o += cloud(x, y, w_, '#FFFFFF', '#CFE0F2', .9)
    o += V.flock(60, 56, 14, .4)
    # ---------- bờ bên kia: dãy nhà Haussmann xa, tháp Eiffel ----------
    far = '<g opacity=".78" style="filter:saturate(.7) brightness(1.06)">' + far_row(-10, 1290, 396) + '</g>'
    tower = eiffel(690, 400, 356, 116)
    bank = ''
    for x, w_, fl in ((446, 100, 6), (808, 84, 5), (896, 100, 6)):
        bank += haus(x, 398, w_, fl, '#F1E3C6', ZINC, True, 2)
    trees_far = ''
    for x in range(40, 1260, 52): trees_far += '<circle cx="%d" cy="%d" r="%d" fill="%s"/>' % (x + R.randint(-8, 8), 392, R.randint(9, 14), R.choice(['#3C9658', '#58B25E', '#2C7A4A']))
    o += far + tower + bank + '<rect y="394" width="1280" height="6" fill="#6A8A6A"/>' + trees_far
    # ---------- sông Seine ----------
    o += '<rect y="396" width="1280" height="320" fill="url(#watF)"/>'
    o += reflect('<g opacity=".8">' + far + tower + bank + '</g>', 396, 398)
    for _ in range(150):
        x = R.randint(0, 1280); y = R.randint(402, 470); w_ = R.randint(14, 60)
        o += '<path class="lap" style="--t:%.1fs;--d:-%.1fs" d="M%d %dh%d" stroke="%s" stroke-width="1.8" opacity="%.2f" stroke-linecap="round"/>' % (R.uniform(3, 6), R.uniform(0, 4), x, y, w_, R.choice(['#FFFFFF', '#D8F0F6', '#BFE4EE']), R.uniform(.25, .6))
    for _ in range(30):
        x = R.randint(500, 900); y = R.randint(404, 450)
        o += '<ellipse class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" rx="%d" ry="1.4" fill="#FFF8D8"/>' % (R.uniform(2, 5), R.uniform(0, 4), x, y, R.randint(5, 14))
    # tàu du lịch (bateau-mouche) chạy chậm
    boat = ('<g transform="translate(0 438)"><ellipse cy="6" rx="110" ry="5" fill="#2E5A72" opacity=".4"/>'
            '<path d="M-100 -6H100L90 8H-90Z" fill="#F7F4EC" stroke="%s" stroke-width="1.4"/><path d="M-96 0H96" stroke="#2A4FA8" stroke-width="3"/>'
            '<path d="M-86 -6V-22Q-86 -26 -80 -26H70Q78 -26 82 -20L88 -6Z" fill="#CFEAF2" stroke="%s" stroke-width="1.3"/>'
            '<path d="M-60 -24V-8M-30 -24V-8M0 -24V-8M30 -24V-8M60 -24V-8" stroke="#fff" stroke-width="1.6" opacity=".7"/>'
            '<rect x="-30" y="-34" width="52" height="9" rx="2" fill="#F7F4EC" stroke="%s" stroke-width="1.2"/><path d="M-70 -26l0 -16" stroke="%s" stroke-width="1.6"/></g>') % (INK, INK, INK, INK)
    boat += '<g transform="translate(-70 396)">' + stripes_flag(0, 0, .42) + '</g>'
    o += '<g class="ride" style="--t:90s;--dx:1700px;--d:-34s"><g transform="translate(-220 0)">' + boat + '</g></g>'
    # ---------- kè đá + hộp sách ven sông ----------
    o += '<rect y="470" width="1280" height="22" fill="#CDBFA4" stroke="%s" stroke-width="1.6"/>' % INK
    for r_ in range(2):
        for k in range(0, 1300, 46):
            o += '<path d="M%d %dv11" stroke="#8E8068" stroke-width="1" opacity=".7"/>' % (k + (r_ % 2) * 23, 470 + r_ * 11)
    o += '<path d="M0 481H1280" stroke="#8E8068" stroke-width="1" opacity=".7"/><rect y="466" width="1280" height="6" fill="#E3D6BC" stroke="%s" stroke-width="1.2"/>' % INK
    for x in (448, 520, 1000, 1076, 1150, 1216): o += bouquin(x, 466, 60)
    # ---------- mặt đường lát đá ----------
    o += '<defs>' + lin('pvF', [('0', '#D9CBB0'), ('1', '#BFAE90')]) + '</defs><rect y="492" width="1280" height="228" fill="url(#pvF)"/>'
    for row in range(14):
        y = 496 + row * row * .7 + row * 6
        o += '<path d="M0 %.0fH1280" stroke="#A8977A" stroke-width="%.1f" opacity=".5"/>' % (y, .8 + row * .06)
        for k in range(-1, 48):
            x = k * (22 + row * 3) + (row % 2) * (11 + row * 1.5)
            o += '<path d="M%.0f %.0fl%.1f %.1f" stroke="#A8977A" stroke-width="%.1f" opacity=".45"/>' % (x, y, -2 - row * .3, 6 + row * .9, .8 + row * .05)
    for _ in range(80): o += '<circle cx="%d" cy="%d" r="%.1f" fill="#8E7E62" opacity=".35"/>' % (R.randint(0, 1280), R.randint(496, 716), R.uniform(.6, 1.6))
    # ---------- cây tiêu huyền dọc kè ----------
    o += platane(412, 520, 150, .9) + platane(1262, 540, 220, 1.0)

    # ---------- Quán CAFÉ (trái) ----------
    cf = '<defs>' + lin('cfW', [('0', '#F4E8CC'), ('1', '#E3D0A8')]) + '</defs>'
    cf += '<rect x="20" y="268" width="378" height="260" fill="url(#cfW)" stroke="%s" stroke-width="1.6"/>' % INK
    cf += '<rect x="316" y="268" width="82" height="260" fill="#000" opacity=".07"/>'
    for f in range(3):
        cf += '<path d="M20 %dH398" stroke="%s" stroke-width="1.4" opacity=".6"/>' % (306 + f * 54, STONE_D)
    # mansard
    cf += '<path d="M8 268L408 268L384 214L32 214Z" fill="%s" stroke="%s" stroke-width="1.6"/>' % (ZINC, INK)
    for k in range(28): cf += '<path d="M%d 268L%d 214" stroke="%s" stroke-width=".8" opacity=".5"/>' % (14 + k * 14.2, 36 + k * 12.6, ZINC_D)
    cf += '<path d="M10 262H406" stroke="#fff" stroke-width="1.2" opacity=".3"/>'
    for dx in (82, 194, 306):
        cf += '<path d="M%d 262h38v-30l-19 -18l-19 18Z" fill="#F1E3C6" stroke="%s" stroke-width="1.3"/><rect x="%d" y="236" width="14" height="22" rx="7" fill="#5E7088" stroke="%s"/><path d="M%d 240v14" stroke="#CFE0EE" stroke-width="1"/>' % (dx, INK, dx + 12, INK, dx + 19)
    for cx_ in (60, 340): cf += '<rect x="%d" y="188" width="14" height="30" fill="#B86A52" stroke="%s" stroke-width="1.2"/><rect x="%d" y="182" width="5" height="8" fill="#8A4A38"/><rect x="%d" y="182" width="5" height="8" fill="#8A4A38"/>' % (cx_, INK, cx_ + 1, cx_ + 8)
    # cửa sổ cao + ban công sắt + chậu hoa phong lữ
    for k in range(5):
        wx = 48 + k * 74
        for wy in (280, 334):
            cf += '<rect x="%d" y="%d" width="26" height="40" rx="12" fill="#5E7088" stroke="%s" stroke-width="1.3"/><path d="M%d %dv40M%d %dh26" stroke="#E8F0F6" stroke-width="1.1" opacity=".75"/>' % (wx, wy, INK, wx + 13, wy, wx, wy + 22)
            cf += '<rect x="%d" y="%d" width="6" height="40" fill="%s" stroke="%s" stroke-width=".7"/><rect x="%d" y="%d" width="6" height="40" fill="%s" stroke="%s" stroke-width=".7"/>' % (wx - 7, wy, '#4F8F7A', INK, wx + 27, wy, '#4F8F7A', INK)
            cf += '<path d="M%d %dH%d" stroke="#2A2A32" stroke-width="2.4"/>' % (wx - 8, wy + 40, wx + 35)
            for q in range(7): cf += '<path d="M%d %dv-6" stroke="#2A2A32" stroke-width="1.2"/>' % (wx - 6 + q * 6, wy + 40)
        for q in range(4): cf += '<circle cx="%d" cy="%d" r="3.4" fill="%s"/>' % (wx + 2 + q * 7, 372 - (q % 2) * 2, R.choice(['#E2483E', '#F26A6A']))
        cf += '<rect x="%d" y="374" width="30" height="5" rx="1" fill="#7A4A32" stroke="%s" stroke-width=".8"/>' % (wx - 2, INK)
    cf += '<rect x="20" y="404" width="378" height="124" fill="#FFF0D6" stroke="%s" stroke-width="1.6"/>' % INK
    # tầng trệt: biển CAFÉ, cửa kính
    cf += '<rect x="44" y="414" width="330" height="26" rx="4" fill="#1F4A3A" stroke="%s" stroke-width="1.4"/><text x="209" y="434" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="19" letter-spacing="7" fill="#F7D774">CAFÉ</text>' % INK
    for wx in (40, 128, 262):
        cf += '<rect x="%d" y="462" width="76" height="58" fill="#FFD98A" stroke="#1F4A3A" stroke-width="3"/><path d="M%d 462v58M%d 491h76" stroke="#1F4A3A" stroke-width="2"/><circle cx="%d" cy="478" r="14" fill="#FFF3B0" opacity=".7"/>' % (wx, wx + 38, wx, wx + 38)
    cf += '<rect x="214" y="458" width="42" height="68" rx="3" fill="#1F4A3A" stroke="%s" stroke-width="1.4"/><rect x="220" y="466" width="30" height="40" fill="#FFD98A"/><circle cx="245" cy="500" r="2" fill="#F7D774"/>' % INK
    cf += '<rect x="342" y="462" width="40" height="58" fill="#FFD98A" stroke="#1F4A3A" stroke-width="3"/>'
    cf += awning(22, 396, 444, 24, '#C93A3A', '#FFF6E8', 12, 12)
    cf += '<path d="M20 528H398" stroke="%s" stroke-width="2"/>' % INK
    cf += '<g transform="translate(212 214)"><path d="M0 0V-62" stroke="#3A2A22" stroke-width="3"/>' + stripes_flag(0, -62, 1.0) + '</g>'
    o += cf
    # sân hiên: bàn ghế bistro, bụi hoàng dương, chậu hoa
    for x, flip in ((60, False), (140, True)): o += bistro_chair(x, 566, 1.0, flip=flip)
    o += bistro_table(100, 552, 1.0)
    for x, flip in ((230, False), (322, True)): o += bistro_chair(x, 574, 1.05, flip=flip)
    o += bistro_table(276, 560, 1.05)
    for x in (34, 392, 214):
        o += '<rect x="%d" y="526" width="26" height="14" rx="2" fill="#7A4A32" stroke="%s" stroke-width="1"/><circle cx="%d" cy="518" r="13" fill="#2F8A4A" stroke="#1F5A3A" stroke-width="1.2"/><circle cx="%d" cy="514" r="6" fill="#58B25E" opacity=".7"/>' % (x - 13 + 13, INK, x + 13, x + 11)
    o += lamp(410, 570, 160)

    # ---------- Quầy PHÔ MAI (giữa-trái) ----------
    ch = ''
    ch += '<path d="M446 478V578M600 478V578" stroke="#6A4A32" stroke-width="5" stroke-linecap="round"/>'
    ch += '<rect x="452" y="500" width="142" height="20" fill="#FFF0D6" stroke="%s" stroke-width="1"/><path d="M452 520H594" stroke="#6A4A32" stroke-width="3"/>' % INK
    for dx in range(0, 6): ch += '<path d="M%d 500v20" stroke="#6A4A32" stroke-width="1" opacity=".4"/>' % (468 + dx * 24)
    ch += awning(436, 610, 458, 32, '#2F8A5A', '#FFF6E8', 10, 12)
    ch += '<rect x="476" y="466" width="94" height="18" rx="3" fill="#1F4A3A" stroke="%s" stroke-width="1.2" opacity=".0"/>' % INK
    ch += '<rect x="440" y="552" width="166" height="52" fill="#B9835A" stroke="%s" stroke-width="1.4"/>' % INK
    for k in range(6): ch += '<path d="M%d 552v52" stroke="#7A4A32" stroke-width="1" opacity=".5"/>' % (440 + k * 28)
    ch += '<path d="M434 552H612L606 540H440Z" fill="#E8DFD0" stroke="%s" stroke-width="1.3"/><path d="M440 540H606" stroke="#C0392B" stroke-width="2.4" stroke-dasharray="4 4"/>' % INK
    # bàn bày phô mai
    ch += cheese_wheel(480, 534, 54, 20, '#F2C84C', '#D9A52E') + cheese_wheel(480, 514, 48, 18, '#F6D45A', '#DDAE36')
    ch += cheese_wheel(546, 534, 56, 20, '#F7E3A0', '#E2C26A') + cheese_wheel(546, 514, 44, 16, '#E8A04C', '#C07A2C', False)
    ch += '<path d="M512 536L535 528L535 522L512 530Z" fill="#E8E0C8" stroke="%s" stroke-width="1"/>' % INK
    ch += cheese_wedge(582, 532, 1.0) + cheese_wedge(450, 540, .8, '#F0B84A')
    ch += '<path d="M580 533a6 6 0 0 1 12 0Z" fill="#B4C8D8" stroke="%s" stroke-width="1" opacity="0"/>' % INK
    ch += '<rect x="500" y="568" width="48" height="26" rx="2" fill="#2E3A3A" stroke="%s" stroke-width="1.2"/><text x="524" y="586" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="10" fill="#fff">FROMAGE</text>' % INK
    o += ch
    o += baker(630, 618, .92, '#F268A6', True)

    # ---------- Bàn bán MỨT (giữa) ----------
    jm = ''
    jm += '<path d="M672 520V604M732 520V604" stroke="#6A4A32" stroke-width="3.4" stroke-linecap="round" opacity="0"/>'
    jm += '<ellipse cx="702" cy="610" rx="64" ry="7" fill="#120A08" opacity=".25"/>'
    jm += '<path d="M650 574H754L762 600H642Z" fill="#B9835A" stroke="%s" stroke-width="1.3"/>' % INK
    jm += '<path d="M648 570H756L748 556H656Z" fill="#FFF6E8" stroke="%s" stroke-width="1.3"/>' % INK
    for q in range(6):
        for rr in range(2):
            jm += '<rect x="%d" y="%d" width="8" height="7" fill="#D63A3A" opacity=".75"/>' % (655 + q * 16 + rr * 8, 557 + rr * 7 if q * 16 + rr * 8 < 90 else -50)
    jm += '<path d="M656 556L664 540L744 540L748 556Z" fill="#8A5A38" stroke="%s" stroke-width="1.2"/>' % INK
    for i, (c, lid) in enumerate([('#B3203C', '#C0392B'), ('#7A2E6A', '#2A4FA8'), ('#E8872C', '#C0392B'), ('#C0392B', '#2F8A5A'), ('#8A3A5A', '#C0392B')]):
        jm += jar(668 + i * 17, 540, c, lid, 1.05)
    for i, (c, lid) in enumerate([('#E8A22C', '#2A4FA8'), ('#B3203C', '#C0392B'), ('#5A2E7A', '#C0392B')]):
        jm += jar(678 + i * 22, 563, c, lid, 1.15)
    jm += '<g transform="translate(734 566)"><path d="M-9 0L-7 -12H7L9 0Z" fill="#B9835A" stroke="%s" stroke-width="1"/>' % INK + ''.join('<circle cx="%d" cy="-13" r="3.4" fill="#D63A3A" stroke="#7A1A1A" stroke-width=".6"/>' % dx for dx in (-5, 0, 5)) + '</g>'
    jm += '<rect x="680" y="580" width="40" height="14" rx="2" fill="#FFF3D6" stroke="%s" stroke-width="1"/><text x="700" y="591" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="9" fill="#B3203C">CONFITURE</text>' % INK
    o += jm

    # ---------- Quầy BÁNH KẾP (crêperie, phải) ----------
    cr = ''
    cr += '<ellipse cx="906" cy="602" rx="92" ry="7" fill="#120A08" opacity=".28"/>'
    cr += '<path d="M832 470L906 438L980 470Z" fill="#274A8A" stroke="%s" stroke-width="1.6"/><path d="M846 466L906 442" stroke="#fff" stroke-width="1.2" opacity=".35"/>' % INK
    cr += '<rect x="840" y="470" width="132" height="132" fill="#F7EFDC" stroke="%s" stroke-width="1.6"/><rect x="840" y="566" width="132" height="36" fill="#4FA3C7" stroke="%s" stroke-width="1.2"/>' % (INK, INK)
    cr += '<rect x="852" y="484" width="108" height="50" fill="#FFE4A8" stroke="#274A8A" stroke-width="3"/><path d="M906 484V534" stroke="#274A8A" stroke-width="2"/>'
    cr += awning(830, 982, 470, 20, '#2A4FA8', '#FFF6E8', 10, 10)
    cr += '<rect x="836" y="536" width="140" height="12" rx="2" fill="#B9835A" stroke="%s" stroke-width="1.3"/>' % INK
    # billig + bánh kếp, đĩa bánh chồng
    cr += '<ellipse cx="880" cy="528" rx="26" ry="7" fill="#2A2A32" stroke="%s" stroke-width="1.2"/><ellipse cx="880" cy="526" rx="22" ry="5.4" fill="#F0B84A"/><path d="M866 526q14 -3 28 0" stroke="#C07A2C" stroke-width="1" fill="none"/><path d="M910 522L936 514" stroke="#6A4A32" stroke-width="3" stroke-linecap="round"/>'
    cr += '<path class="steam" style="--d:-1s" d="M878 516q-4 -5 0 -9q4 -5 0 -9" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8" stroke-linecap="round"/>'
    cr += '<ellipse cx="946" cy="532" rx="20" ry="5" fill="#fff" stroke="%s" stroke-width="1"/>' % INK
    for i in range(4): cr += '<ellipse cx="946" cy="%d" rx="15" ry="4" fill="%s" stroke="#9A6A2E" stroke-width=".8"/>' % (528 - i * 3.6, ['#F0C070', '#E8B060', '#F2C87C', '#EAB468'][i])
    cr += '<circle cx="946" cy="513" r="3" fill="#C0392B"/><path d="M940 514q6 -4 12 0" stroke="#6A3A22" stroke-width="2" fill="none"/>'
    cr += '<rect x="936" y="552" width="40" height="44" rx="2" fill="#2A2A32" stroke="%s" stroke-width="1.2"/><text x="956" y="571" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="10" fill="#fff">CRÊPES</text><path d="M944 580h24M944 587h18" stroke="#F0C070" stroke-width="1.6" stroke-linecap="round"/>' % INK
    cr += '<g class="pig" style="--d:-.4s"><circle cx="1000" cy="556" r="0" fill="none"/></g>'
    o += cr
    o += lamp(1038, 580, 150)

    # ---------- Xe đẩy KEM (phải) ----------
    ic = ''
    ic += '<ellipse cx="1150" cy="628" rx="78" ry="7" fill="#120A08" opacity=".28"/>'
    ic += parasol(1146, 474, 150, 30, '#F26AA0', '#FFF6E8', 8, 548)
    ic += '<path d="M1086 560H1206V608H1086Z" fill="#9ADBC0" stroke="%s" stroke-width="1.6"/><path d="M1086 572H1206" stroke="#fff" stroke-width="2" opacity=".6"/>' % INK
    for k in range(10): ic += '<path d="M%d 560a6 6 0 0 0 12 0Z" fill="#F7F0E0" stroke="%s" stroke-width=".8"/>' % (1086 + k * 12, INK)
    ic += '<rect x="1090" y="572" width="112" height="30" rx="3" fill="#FFF6E8" stroke="%s" stroke-width="1.1"/><text x="1146" y="593" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="13" letter-spacing="2" fill="#E0457F">GLACES</text>' % INK
    ic += '<path d="M1086 552H1206V562H1086Z" fill="#E8DFD0" stroke="%s" stroke-width="1.3"/>' % INK
    for i, sc in enumerate([('#F7D774', '#F26AA0', '#7A4A32'), ('#FFFFFF', '#9ADBC0'), ('#F26AA0', '#FFF6E8', '#C0392B', '#F7D774')]):
        ic += cone(1112 + i * 34, 552, sc, .78)
    ic += '<circle cx="1112" cy="614" r="14" fill="#3A2A22" stroke="%s" stroke-width="1.3"/><circle cx="1112" cy="614" r="6" fill="#C9C4BA"/><circle cx="1182" cy="614" r="14" fill="#3A2A22" stroke="%s" stroke-width="1.3"/><circle cx="1182" cy="614" r="6" fill="#C9C4BA"/>' % (INK, INK)
    ic += '<path d="M1086 566L1064 548L1058 552" stroke="#6A4A32" stroke-width="3" fill="none" stroke-linecap="round"/>'
    o += ic

    # ---------- chim bồ câu, người đi dạo, hoa oải hương ----------
    for x, y in ((800, 660), (822, 672), (780, 676)):
        o += '<g class="pig" style="--d:-%.1fs" transform="translate(%d %d)"><ellipse rx="8" ry="5" fill="#9AA0B0" stroke="%s" stroke-width=".9"/><circle cx="6" cy="-4" r="3.4" fill="#7E8498" stroke="%s" stroke-width=".8"/><path d="M9 -4l4 1" stroke="#E8A23C" stroke-width="1.6"/><path d="M-8 0l-5 3" stroke="#7E8498" stroke-width="2.4"/></g>' % (x % 3 * .4, x, y, INK, INK)
    o += baker(480, 668, 1.12, '#2A4FA8', True) + baker(1020, 650, 1.1, '#F2C25A', False)
    o += '<g transform="translate(1210 706)"><rect x="-44" y="-18" width="88" height="22" rx="3" fill="#B9835A" stroke="%s" stroke-width="1.3"/>' % INK
    for q in range(26):
        lx = R.uniform(-40, 40)
        o += '<path d="M%.1f -16q%.1f -22 %.1f -%d" stroke="%s" stroke-width="2" stroke-linecap="round" fill="none"/>' % (lx, R.uniform(-3, 3), R.uniform(-3, 3), R.randint(22, 38), R.choice(['#8A5AC8', '#A07AD8', '#6E44B0']))
    o += '</g>'
    o += '<g transform="translate(94 704)"><rect x="-38" y="-16" width="76" height="20" rx="3" fill="#B9835A" stroke="%s" stroke-width="1.3"/>' % INK
    for q in range(22):
        lx = R.uniform(-34, 34)
        o += '<path d="M%.1f -14q%.1f -20 %.1f -%d" stroke="%s" stroke-width="2" stroke-linecap="round" fill="none"/>' % (lx, R.uniform(-3, 3), R.uniform(-3, 3), R.randint(20, 34), R.choice(['#8A5AC8', '#A07AD8', '#6E44B0']))
    o += '</g>'
    # thú cưng đi dạo
    o += V.kitsu(700, 708, 104, 'ehappy', 'walk')
    # ---------- 5 biển chạm ----------
    for t_, x, y, dn in [('Cà phê', 205, 372, False), ('Phô mai', 524, 424, False), ('Mứt', 700, 482, False), ('Bánh kếp', 906, 424, False), ('Kem', 1146, 448, False)]:
        o += G.bubble(x, y, t_, dn)
    S.page('PFrance', 'Kids World, Pháp bên sông Seine', 'Bờ sông Seine ở Paris: tháp Eiffel, nhà Haussmann, quán cà phê, quầy phô mai, mứt, bánh kếp và xe kem', d, o, 'Paris', CSS)


if __name__ == '__main__':
    pfrance(); print('ok')
