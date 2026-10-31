# "Làng chữ" bản làng quê: công trình dân gian Bắc Bộ, đường một nét, hoạt ảnh, ngày/chiều/đêm.
# Dùng lại bộ vẽ của gen_village2.py. python gen_village3.py <project>
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, 'gen_village2.py'), encoding='utf-8').read().replace("r1(); r2(); r3(); print('ok')", '').replace("""facade(185, 410, 240, 80, 5) + roof(185, 410, 300, 46) + '<rect x="130" y="330" width="110" height="36" fill="%s" %s/>' % (C['red'], OUT % C['ink']) + roof(185, 334, 170, 30, C['jade'], C['jade2'], C['gold'], C['gold'])
          + lantern(70, 410, 1.2) + lantern(300, 410, 1.2) + stonewall(-10, 490, 390, 46, [(185, 44)]) + trees(40, 490, .9) + trees(340, 490, .9)""", "truong(165, 520) + trees(30, 530, .8) + trees(345, 540, .7)").replace("'<path d=\"M-10 730V540C120 520 260 530 380 545V730Z\" fill=\"%s\"/>' % C['lime'] + ", "'<path d=\"M-10 730V590C120 570 260 580 380 595V730Z\" fill=\"%s\"/>' % C['lime'] + ")
exec(_src)

ANIM = """
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes glow{0%%,100%%{opacity:.45}50%%{opacity:.8}}
@keyframes sway{0%%,100%%{transform:rotate(-1.3deg)}50%%{transform:rotate(1.6deg)}}
@keyframes fly{0%%{transform:translate(-160px,20px)}50%%{transform:translate(560px,-16px)}100%%{transform:translate(1280px,24px)}}
@keyframes flap{0%%,100%%{transform:scaleY(1)}50%%{transform:scaleY(.25)}}
@keyframes drift{from{transform:translateX(-260px)}to{transform:translateX(1320px)}}
@keyframes flow{to{stroke-dashoffset:-120}}
@keyframes rock{0%%,100%%{transform:translateY(0) rotate(-1deg)}50%%{transform:translateY(3px) rotate(1deg)}}
@keyframes smoke{0%%{transform:translate(0,0) scale(.5);opacity:0}25%%{opacity:.6}100%%{transform:translate(16px,-54px) scale(1.5);opacity:0}}
@keyframes wing{0%%,100%%{transform:rotate(-13deg)}50%%{transform:rotate(19deg)}}
@keyframes wing2{0%%,100%%{transform:rotate(-9deg)}50%%{transform:rotate(15deg)}}
@keyframes cbob{0%%,100%%{transform:translateY(-1px)}50%%{transform:translateY(2px)}}
@keyframes lap{0%%,100%%{transform:translateX(-7px)}50%%{transform:translateX(7px)}}
@keyframes tail{0%%,100%%{transform:rotate(-8deg)}50%%{transform:rotate(9deg)}}
@keyframes wave{0%%,100%%{transform:skewY(0)}50%%{transform:skewY(7deg)}}
@keyframes twinkle{0%%,100%%{opacity:.25}50%%{opacity:1}}
@keyframes fire{0%%,100%%{opacity:.2}50%%{opacity:1}}
.cw{animation:wing 2.8s ease-in-out infinite;animation-delay:var(--d,0s);transform-origin:0 0}
.cw2{animation:wing2 2.8s ease-in-out infinite;animation-delay:var(--d,0s);transform-origin:0 0}
.cbody{animation:cbob 2.8s ease-in-out infinite;animation-delay:var(--d,0s)}
.lap{animation:lap var(--t,5s) ease-in-out infinite;animation-delay:var(--d,0s)}
.tl{animation:tail 2.2s ease-in-out infinite;transform-origin:0 0}
.spin{animation:spin 90s linear infinite;transform-origin:0 0}
.halo{animation:glow 4s ease-in-out infinite}
.sway{animation:sway var(--t,5s) ease-in-out infinite;animation-delay:var(--d,0s)}
.fly{animation:fly var(--t,52s) linear infinite;animation-delay:var(--d,0s)}
.flap{animation:flap .7s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.drift{animation:drift var(--t,90s) linear infinite;animation-delay:var(--d,0s)}
.flow{animation:flow 5s linear infinite}
.rock{animation:rock 3.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.smoke{animation:smoke 4s ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
.wave{animation:wave 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:left center}
.tw{animation:twinkle var(--t,3s) ease-in-out infinite;animation-delay:var(--d,0s)}
.ff{animation:fire var(--t,2.4s) ease-in-out infinite;animation-delay:var(--d,0s)}
@media (prefers-reduced-motion:reduce){.cw,.cw2,.cbody,.lap,.tl,.spin,.halo,.sway,.fly,.flap,.drift,.flow,.rock,.smoke,.wave,.tw,.ff{animation:none}}
"""
HEAD = HEAD.replace("</style>", ANIM + "</style>")
B = C['ink']

def crane(x, y, s=1, flip=1, d=0):
    """Hạc nhìn ngang, đầu về bên phải; hai cánh vỗ nhẹ quanh vai."""
    near = '<path d="M0 0C-14 -22 -30 -40 -52 -50C-44 -36 -52 -32 -46 -22C-52 -20 -46 -10 -36 -6C-24 -2 -10 2 0 4Z" fill="#fff" stroke="#6E5A4A" stroke-width="1.4"/><path d="M-52 -50C-44 -36 -52 -32 -46 -22C-52 -20 -46 -10 -36 -6L-30 -14Z" fill="#26263A"/>'
    far = '<path d="M0 0C-8 -18 -18 -34 -32 -44C-30 -28 -34 -14 -18 -4Z" fill="#E4E8F0" stroke="#6E5A4A" stroke-width="1.2"/>'
    return ('<g transform="translate(%d %d) scale(%.2f %.2f)"><g class="cbody" style="--d:-%.1fs">' % (x, y, s * flip, s, d)
            + '<g transform="translate(4 -3)"><g class="cw2" style="--d:-%.1fs">%s</g></g>' % (d, far)
            + '<path d="M-44 4L-92 13M-42 7L-88 19" stroke="#26263A" stroke-width="2.4" stroke-linecap="round"/><path d="M-92 13l-7 -3M-92 13l-7 3" stroke="#D9A24A" stroke-width="1.6"/>'
            + '<path d="M-46 6Q-8 -8 22 -2Q10 12 -22 12Q-38 12 -46 6Z" fill="#fff" stroke="#6E5A4A" stroke-width="1.4"/><path d="M-46 6L-58 2L-54 10Z" fill="#26263A"/>'
            + '<path d="M18 -1Q46 -3 62 -12" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M18 -1Q46 -3 62 -12" stroke="#26263A" stroke-width="2.4" fill="none" stroke-dasharray="14 40"  stroke-dashoffset="-24"/>'
            + '<circle cx="64" cy="-13" r="4.4" fill="#fff" stroke="#6E5A4A" stroke-width="1"/><circle cx="65" cy="-16" r="2.4" fill="#D32F2F"/><circle cx="66" cy="-13" r=".9" fill="#222"/><path d="M68 -13L86 -10L68 -10Z" fill="#D9A24A"/>'
            + '<g transform="translate(-4 -2)"><g class="cw" style="--d:-%.1fs">%s</g></g></g></g>' % (d, near))

def flock(y, t, d, s=1):
    o = '<g class="fly" style="--t:%ds;--d:-%ds">' % (t, d)
    for dx, dy, k, ph in [(0, 0, 1, 0), (-92, 24, .84, .7), (-66, -26, .76, 1.3)]:
        o += crane(-100 + dx, y + dy, s * k, 1, ph)
    return o + '</g>'

# ---------- mái ngói ta nhìn chếch: mặt trước + mặt hồi ----------
def tiles(d, x0, y0, x1, y1, base, dark, step=9):
    cid = uid(); o = '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="%s" %s/><g clip-path="url(#%s)">' % (cid, d, d, base, OUT % B, cid)
    y = y0; row = 0
    while y < y1:
        x = x0 + (row % 2) * step / 2
        while x < x1:
            o += '<path d="M%.1f %.1fq%.1f %.1f %.1f 0" fill="none" stroke="%s" stroke-width="1.1"/>' % (x, y, step / 2, step * .9, step, dark)
            x += step
        y += step * .62; row += 1
    for _ in range(int((x1 - x0) / 9)):  # vệt rêu, ngói bạc màu
        mx, my = R.uniform(x0, x1), R.uniform(y0, y1)
        o += '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" opacity=".3"/>' % (mx, my, R.uniform(7, 20), R.uniform(2, 5), R.choice(['#5E7A3A', '#3A2413', '#E0B070']))
    return o + '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="url(#rs)"/></g>' % (x0, y0, x1 - x0, y1 - y0)

def roofv(cx, y, w, h, base='#A85A3A', dark='#6E3522', side=None, curl=9):
    L, Rr = cx - w / 2, cx + w / 2; tl, tr = cx - w * .36, cx + w * .3
    d = 'M%.1f %.1fQ%.1f %.1f %.1f %.1fL%.1f %.1fQ%.1f %.1f %.1f %.1fL%.1f %.1fL%.1f %.1fZ' % (L - 10, y - curl, L + 2, y - 1, L + 18, y, Rr - 18, y, Rr - 2, y - 1, Rr + 10, y - curl, tr, y - h, tl, y - h)
    sd = 'M%.1f %.1fL%.1f %.1fQ%.1f %.1f %.1f %.1fL%.1f %.1fZ' % (tr, y - h, Rr + 10, y - curl, Rr + 18, y - curl - 8, Rr + 24, y - curl - 22, tr + 8, y - h + 2)
    o = '<path d="%s" fill="#4E2616" %s/>' % (sd, OUT % B)
    o += tiles(d, L - 12, y - h, Rr + 12, y + 2, base, dark)
    o += '<path d="M%.1f %.1fH%.1f" stroke="%s" stroke-width="4" stroke-linecap="round"/>' % (L + 16, y + 2, Rr - 16, '#4E2616')
    o += '<rect x="%.1f" y="%.1f" width="%.1f" height="7" rx="3" fill="#7A4A30" %s/>' % (tl - 8, y - h - 4, tr - tl + 16, OUT % B)
    for ex, sg in ((tl - 8, -1), (tr + 8, 1)): o += '<path d="M%.1f %.1fq%d -2 %d -11" stroke="#7A4A30" stroke-width="5" fill="none" stroke-linecap="round"/>' % (ex, y - h, sg * 7, sg * 9)
    return o

def thatch(cx, y, w, h, c1='#E5B85C', c2='#B98A34'):
    L, Rr = cx - w / 2, cx + w / 2; tl, tr = cx - w * .3, cx + w * .3
    d = 'M%.1f %.1fL%.1f %.1fQ%.1f %.1f %.1f %.1fL%.1f %.1fQ%.1f %.1f %.1f %.1fZ' % (L - 8, y + 2, tl, y - h, cx, y - h - 8, tr, y - h, Rr + 8, y + 2, cx, y + 9, L - 8, y + 2)
    cid = uid(); o = '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="%s" %s/><g clip-path="url(#%s)">' % (cid, d, d, c1, OUT % B, cid)
    for _ in range(int(w * 5)):
        x = R.uniform(L - 6, Rr + 6); yy = R.uniform(y - h, y)
        o += '<path d="M%.1f %.1fl%.1f %.1f" stroke="%s" stroke-width="1" opacity=".75"/>' % (x, yy, (x - cx) * .05, R.uniform(10, 22), R.choice([c2, '#F4D88A', '#8F6A28']))
    o += '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="url(#rs)"/></g>' % (L - 10, y - h - 8, w + 20, h + 20)
    o += '<path d="M%.1f %.1fQ%.1f %.1f %.1f %.1f" stroke="%s" stroke-width="6" fill="none" stroke-linecap="round"/>' % (tl, y - h, cx, y - h - 8, tr, y - h, '#9A7128')
    for x in (tl + 20, cx, tr - 20): o += '<path d="M%.1f %.1fv12" stroke="#9A7128" stroke-width="3"/>' % (x, y - h - 4)
    return o

def yard(cx, cy, rx, ry, c='#E3C48E'):
    # sân đất hoà vào cỏ: nhiều mảng chồng, viền cỏ mọc đè lên
    o = '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="#0A4A30" opacity=".22" filter="url(#soft)"/>' % (cx + 6, cy + 4, rx + 8, ry + 4)
    o += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s"/>' % (cx, cy, rx, ry, c)
    for _ in range(int(rx / 3)):
        a = R.random() * 6.28
        o += '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s"/>' % (cx + math.cos(a) * rx * 1.02, cy + math.sin(a) * ry * 1.02, R.uniform(8, 20), R.uniform(3, 7), R.choice(['#6FCB55', '#4CC768', '#8FDB62']))
    return o + grass(int(rx * 1.3), cx - rx * 1.1, cy - ry * 1.1, cx + rx * 1.1, cy + ry * 1.1, lambda x, y: ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > .8)

def bush(x, y, s=1, c=None):
    o = '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#0A4A30" opacity=".22"/>' % (x + 3, y, 19 * s, 4 * s)
    for k in range(9):
        o += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="url(#lf%d)"/>' % (x + R.uniform(-15, 15) * s, y - R.uniform(3, 15) * s, R.uniform(5, 9) * s, k % 3 + 1)
    if c:
        for k in range(5): o += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (x + R.uniform(-14, 14) * s, y - R.uniform(4, 16) * s, 2.6 * s, c)
    return o

def fence(x0, y0, x1, y1):
    n = int(math.hypot(x1 - x0, y1 - y0) / 7); o = ''
    for k in range(n + 1):
        t = k / n; x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        o += '<path d="M%.1f %.1fl1 -17" stroke="#B98A4A" stroke-width="2.4"/>' % (x, y)
    for dy in (5, 11): o += '<path d="M%.1f %.1fL%.1f %.1f" stroke="#7A5428" stroke-width="2"/>' % (x0, y0 - dy, x1, y1 - dy)
    return o

def bamboo(x, y, n=6, s=1):
    N = n * 2 + 3; W = 8 * n * s
    o = '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#0A4A30" opacity=".3"/>' % (x + W / 2, y + 1, W * .75, 6 * s)
    order = sorted(range(N), key=lambda i: abs(i - N / 2), reverse=False)  # giữa vẽ trước, thân ngoài đè lên
    dark, mid, lite = '', '', ''
    stems = ''
    for i in order:
        f = i / (N - 1) - .5
        bx = x + W / 2 + f * W * .7; h = (120 + R.uniform(0, 46)) * s * (1 + n * .04)
        tx = bx + f * W * 1.5 + R.uniform(-5, 5) * s; ty = y - h
        sg = 1 if f >= 0 else -1
        cx_, cy_ = bx + f * 6 * s, y - h * .72
        qx = lambda t: (1 - t) ** 2 * bx + 2 * (1 - t) * t * cx_ + t * t * (tx + sg * 22 * s)
        qy = lambda t: (1 - t) ** 2 * y + 2 * (1 - t) * t * cy_ + t * t * (ty + 12 * s)
        col = R.choice(['#7DB83E', '#9CC84A', '#5FA438', '#B8D45A'])
        stems += '<path d="M%.1f %.1fQ%.1f %.1f %.1f %.1f" stroke="%s" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (bx, y, cx_, cy_, tx + sg * 22 * s, ty + 12 * s, col, 3.4 * s)
        stems += '<path d="M%.1f %.1fQ%.1f %.1f %.1f %.1f" stroke="#E8F0A0" stroke-width="%.1f" fill="none" opacity=".55"/>' % (bx - .8 * s, y, cx_ - .8 * s, cy_, tx + sg * 22 * s, ty + 12 * s, .9 * s)
        for k in range(1, 7):
            t = k / 7
            stems += '<path d="M%.1f %.1fh%.1f" stroke="#3E7A2E" stroke-width="%.1f" stroke-linecap="round"/>' % (qx(t) - 2 * s, qy(t), 4 * s, 1.5 * s)
        t = .42
        while t < 1:
            px, py = qx(t), qy(t)
            for side_ in (-1, 1):
                L = R.uniform(14, 24) * s; ex, ey = px + side_ * L, py - R.uniform(-2, 9) * s
                stems += '<path d="M%.1f %.1fQ%.1f %.1f %.1f %.1f" stroke="#6E9A3A" stroke-width="%.1f" fill="none"/>' % (px, py, (px + ex) / 2, py - 6 * s, ex, ey, .9 * s)
                for j in range(5):
                    u = j / 4; lx = px + (ex - px) * (.3 + u * .7); ly = py + (ey - py) * (.3 + u * .7) - 3 * s * (1 - u)
                    dx = side_ * R.uniform(3, 9) * s; dy = R.uniform(9, 15) * s
                    leaf = 'M%.1f %.1fq%.1f %.1f %.1f %.1fq%.1f %.1f %.1f %.1fz' % (lx, ly, dx * .2 + 1.6 * s, dy * .4, dx, dy, dx * -.1 - 2 * s, dy * -.5, -dx, -dy)
                    c_ = R.random()
                    if c_ < .34: dark += leaf
                    elif c_ < .74: mid += leaf
                    else: lite += leaf
            t += .1
    o += stems + '<path d="%s" fill="#1F8A4E"/><path d="%s" fill="#3EB45E"/><path d="%s" fill="#8FDC6A"/>' % (dark, mid, lite)
    # gốc bụi: mo tre, lá khô
    for _ in range(N): o += '<path d="M%.1f %.1fq%.1f -7 %.1f -11" stroke="%s" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (x + W / 2 + R.uniform(-W * .4, W * .4), y + 1, R.uniform(-3, 3), R.uniform(-5, 5), R.choice(['#C9A464', '#A9843E']), 2.2 * s)
    return o

def sway(content, x, y, t=5, d=0):
    return '<g class="sway" style="--t:%.1fs;--d:-%.1fs;transform-origin:%dpx %dpx">%s</g>' % (t, d, x, y, content)
def tree(x, y, s=1): return sway(trees(x, y, s), x, y, 4.6 + (x % 5) * .4, (x % 7) * .5)
def cau(x, y, s=1): return sway(areca(x, y, s), x, y, 3.8 + (x % 4) * .4, (x % 5) * .6)
def tre(x, y, n=6, s=1): return sway(bamboo(x, y, n, s), x + n * 5, y, 3.4, (x % 3))

# ---------- đình làng: mái rộng 2/3 chiều cao, cột lim trên tảng đá, ao trước sân, nghi môn ----------
def dinh(cx, y):
    w = 220
    o = yard(cx, y + 18, 150, 30, '#D9A878')
    for r in range(4):  # sân gạch
        o += ''.join('<rect x="%d" y="%d" width="15" height="6" fill="%s" stroke="#9A5F3A" stroke-width=".6"/>' % (cx - 96 + i * 17 - r * 2, y + 6 + r * 7, R.choice(['#C4775A', '#B9694C', '#D08A68'])) for i in range(12 + r // 2))
    o += '<rect x="%d" y="%d" width="%d" height="9" fill="#9A8F7A" %s/>' % (cx - w / 2 - 6, y - 8, w + 12, OUT % B)
    o += '<rect x="%d" y="%d" width="%d" height="46" fill="#2A1710"/>' % (cx - w / 2 + 4, y - 54, w - 8)
    o += '<rect x="%d" y="%d" width="%d" height="46" fill="url(#es)"/>' % (cx - w / 2 + 4, y - 54, w - 8)
    for i in range(7):
        x = cx - w / 2 + 12 + i * (w - 24) / 6
        o += '<rect x="%.1f" y="%d" width="8" height="46" fill="#7A3E22" stroke="#3A1810"/><rect x="%.1f" y="%d" width="3" height="46" fill="#A8603A"/><rect x="%.1f" y="%d" width="13" height="5" fill="#B9B09A" stroke="#6E6450" stroke-width=".8"/>' % (x - 4, y - 54, x - 3, y - 54, x - 6.5, y - 10)
    for i in range(3):
        o += '<rect x="%.1f" y="-0" width="0" height="0"/>' % cx
    o += '<rect x="%d" y="%d" width="56" height="18" fill="#D1A24A" stroke="#6B3E1E"/>' % (cx - 28, y - 52)
    o += roofv(cx, y - 52, w + 54, 96)
    o += '<circle cx="%d" cy="%d" r="6" fill="#D1A24A" stroke="#6B3E1E"/>' % (cx - 8, y - 152)
    # nghi môn hai trụ
    for sg in (-1, 1):
        x = cx + sg * 112
        o += '<g><rect x="%d" y="%d" width="15" height="62" fill="#E8E0CC" %s/><rect x="%d" y="%d" width="15" height="12" fill="url(#es)"/><rect x="%d" y="%d" width="23" height="7" fill="#C9BFA6" %s/><path d="M%d %dq10 -18 20 0Z" fill="#9A8F7A" %s/></g>' % (x - 7, y + 4, OUT % B, x - 7, y + 4, x - 11, y - 3, OUT % B, x - 10, y - 3, OUT % B)
    return o

# ---------- trường làng: nhà ngói đỏ tường vôi vàng, hiên cột, cột cờ, trống ----------
def truong(cx, y):
    w = 190
    o = yard(cx + 4, y + 16, 138, 26)
    o += '<path d="M%d %dh%dv-6h%dv6Z" fill="#7A6E5C"/>' % (cx - w / 2 - 28, y, 0, 0)
    o += '<rect x="%d" y="%d" width="%d" height="50" fill="#F2D27A" %s/>' % (cx - w / 2, y - 50, w, OUT % B)
    o += '<rect x="%d" y="%d" width="46" height="50" fill="#D9B45E" %s/>' % (cx + w / 2, y - 50, OUT % B)
    o += '<rect x="%d" y="%d" width="%d" height="12" fill="#8FA08A"/><rect x="%d" y="%d" width="%d" height="7" fill="#C9BFA6" %s/>' % (cx - w / 2, y - 12, w, cx - w / 2 - 6, y - 3, w + 58, OUT % B)
    for i in range(4):
        x = cx - w / 2 + 16 + i * 44
        o += '<rect x="%d" y="%d" width="30" height="32" fill="#2F7F6A" %s/><path d="M%d %dv32M%d %dh30" stroke="#7FCDB4" stroke-width="1.4"/>' % (x, y - 44, OUT % B, x + 15, y - 44, x, y - 28)
    o += '<rect x="%d" y="%d" width="%d" height="20" fill="url(#es)"/>' % (cx - w / 2, y - 50, w)
    for i in range(5): o += '<rect x="%d" y="%d" width="5" height="50" fill="#EDE3CC" stroke="#8A7A5A"/>' % (cx - w / 2 + 5 + i * 44, y - 50)
    o += roofv(cx, y - 50, w + 34, 50, '#D0623A', '#8E3A20', curl=4)
    o += '<rect x="%d" y="%d" width="74" height="16" rx="2" fill="#FFF3D6" stroke="#6B3E1E"/><text x="%d" y="%d" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="10" fill="#C7321F">TRƯỜNG LÀNG</text>' % (cx - 37, y - 70, cx, y - 58)
    fx = cx - w / 2 - 34
    o += '<rect x="%d" y="%d" width="4" height="96" fill="#D9D3C2" stroke="#7A6E5C" stroke-width=".8"/><g class="wave"><path d="M%d %dh38v24h-38Z" fill="#D32F2F" stroke="#7A1414"/><path d="M%d %dl3 7h7l-5.5 4l2 7l-6 -4.5l-6 4.5l2 -7l-5.5 -4h7Z" fill="#F7D21A"/></g>' % (fx, y - 92, fx + 4, y - 92, fx + 22, y - 87)
    o += '<g transform="translate(%d %d)"><ellipse cy="14" rx="14" ry="4" fill="#0A4A30" opacity=".3"/><rect x="-11" y="-12" width="22" height="24" rx="6" fill="#A0522D" %s/><ellipse cy="-12" rx="11" ry="4" fill="#E9D6AE" %s/></g>' % (cx + w / 2 + 62, y + 2, OUT % B, OUT % B)
    return o

# ---------- thư các: gác gỗ nhỏ giữa ao, cầu ván ra đường ----------
def thuvien(cx, y):
    o = '<ellipse cx="%d" cy="%d" rx="112" ry="36" fill="#E9D49A"/><ellipse cx="%d" cy="%d" rx="104" ry="31" fill="url(#riv)" stroke="#0E93A6"/>' % (cx, y + 8, cx, y + 7)
    o += '<path class="flow" d="M%d %dh120" stroke="#fff" stroke-width="2.4" stroke-dasharray="26 34" opacity=".7"/>' % (cx - 60, y + 22)
    o += lotusleaf(cx - 74, y + 12, 15) + lotusleaf(cx + 76, y + 16, 13) + lotusleaf(cx - 44, y + 26, 11) + lotus(cx - 72, y + 8, .55) + lotus(cx + 80, y + 12, .5)
    for dx in (-36, 36): o += '<rect x="%d" y="%d" width="6" height="34" fill="#4E2616"/>' % (cx + dx - 3, y - 18)
    o += '<rect x="%d" y="%d" width="88" height="7" fill="#7A4A30" %s/>' % (cx - 44, y - 22, OUT % B)
    # cầu gỗ thẳng từ bờ ao vào cửa, rộng dần về phía người xem, có cọc và tay vịn
    y0, y1, w0, w1 = y - 16, y + 40, 15, 21
    for sg in (-1, 1):
        for t in (.3, .65):
            yy = y0 + (y1 - y0) * t; xx = cx + sg * (w0 + (w1 - w0) * t)
            o += '<rect x="%.1f" y="%.1f" width="4" height="14" fill="#4E2616"/>' % (xx - 2, yy)
    o += '<path d="M%d %dL%d %dL%d %dL%d %dZ" fill="#6B3E1E" %s/>' % (cx - w0, y0, cx + w0, y0, cx + w1, y1, cx - w1, y1, OUT % B)
    yy = y0 + 1; k = 0
    while yy < y1 - 3:
        t = (yy - y0) / (y1 - y0); hw = w0 + (w1 - w0) * t
        o += '<rect x="%.1f" y="%.1f" width="%.1f" height="5" fill="%s" stroke="#5A3418" stroke-width=".7"/>' % (cx - hw, yy, hw * 2, ['#C9975A', '#B9854A', '#D6A66A'][k % 3]); yy += 6; k += 1
    for sg in (-1, 1):
        o += '<path d="M%d %dL%d %d" stroke="#5A3418" stroke-width="3" stroke-linecap="round"/>' % (cx + sg * (w0 + 2), y0 - 12, cx + sg * (w1 + 2), y1 - 12)
        for t in (0, .5, 1):
            xx = cx + sg * (w0 + 2 + (w1 - w0) * t); yy = y0 + (y1 - y0) * t
            o += '<rect x="%.1f" y="%.1f" width="3.4" height="13" fill="#8F5A2E" stroke="#3A2413" stroke-width=".6"/>' % (xx - 1.7, yy - 12)
    o += '<rect x="%d" y="%d" width="70" height="40" fill="#8F5A2E" %s/>' % (cx - 35, y - 62, OUT % B)
    for k in range(6): o += '<path d="M%d %dv40" stroke="#5A3418" stroke-width="1.4"/>' % (cx - 35 + k * 14, y - 62)
    o += '<rect x="%d" y="%d" width="22" height="32" fill="#3A1F12" %s/><path d="M%d %dv32" stroke="#8F5A2E" stroke-width="1.4"/>' % (cx - 11, y - 54, OUT % B, cx, y - 54)
    for sg in (-1, 1): o += '<rect x="%d" y="%d" width="14" height="16" fill="#FFD77A" %s/><path d="M%d %dv16" stroke="#6B3E1E"/>' % (cx + sg * 24 - 7, y - 54, OUT % B, cx + sg * 24, y - 54)
    o += '<rect x="%d" y="%d" width="70" height="14" fill="url(#es)"/>' % (cx - 35, y - 62)
    o += roofv(cx, y - 60, 112, 32) + '<rect x="%d" y="%d" width="40" height="20" fill="#8F5A2E" %s/>' % (cx - 20, y - 112, OUT % B) + roofv(cx, y - 106, 70, 24)
    return o

# ---------- tháp bút + đài nghiên trên gò đá ----------
def thapbut(cx, y):
    # gò cỏ + sân đá + bậc lên
    o = '<path d="M%d %dQ%d %d %d %d Q%d %d %d %d Z" fill="url(#hill2)"/>' % (cx - 110, y + 12, cx - 50, y - 34, cx, y - 36, cx + 56, y - 34, cx + 112, y + 12)
    o += '<ellipse cx="%d" cy="%d" rx="104" ry="9" fill="#0A4A30" opacity=".25"/>' % (cx + 4, y + 12)
    for k in range(5):
        w_ = 22 + k * 3; yy = y - 34 + k * 9
        o += '<rect x="%d" y="%d" width="%d" height="9" fill="%s" stroke="#6E6854" stroke-width=".9"/>' % (cx - w_ / 2, yy, w_, ['#CFC8B4', '#BDB7A4'][k % 2])
    # nền bát giác hai bậc
    def octo(w, yy, h, f, s_):
        q = w * .2
        return ('<path d="M%.1f %.1fL%.1f %.1fH%.1fL%.1f %.1fV%.1fH%.1fZ" fill="%s" %s/><path d="M%.1f %.1fV%.1fM%.1f %.1fV%.1f" stroke="#6E6854" stroke-width="1"/>' % (cx - w / 2, yy + 6, cx - w / 2 + q, yy, cx + w / 2 - q, cx + w / 2, yy + 6, yy + h, cx - w / 2, f, OUT % B, cx - w / 2 + q, yy, yy + h, cx + w / 2 - q, yy, yy + h))
    o += octo(112, y - 54, 20, '#BDB7A4', 0) + octo(92, y - 66, 14, '#CFC8B4', 0)
    # 7 tầng bát giác, thu nhỏ dần lên đỉnh
    base = y - 66; n = 7
    for k in range(n):
        t = k / (n - 1); w_ = 74 - 40 * t; h_ = 29 - 11 * t; top = base - h_; q = w_ * .22
        o += '<path d="M%.1f %.1fH%.1fV%.1fH%.1fZ" fill="#F6E7C6" %s/>' % (cx - w_ / 2 + q, top, cx + w_ / 2 - q, base, cx - w_ / 2 + q, OUT % B)
        o += '<path d="M%.1f %.1fL%.1f %.1fV%.1fH%.1fZ" fill="#DCC296" %s/>' % (cx - w_ / 2, top + 3, cx - w_ / 2 + q, top, base, cx - w_ / 2, OUT % B)
        o += '<path d="M%.1f %.1fL%.1f %.1fV%.1fH%.1fZ" fill="#BC9A68" %s/>' % (cx + w_ / 2, top + 3, cx + w_ / 2 - q, top, base, cx + w_ / 2, OUT % B)
        o += '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="url(#es)"/>' % (cx - w_ / 2, top, w_, h_ * .5)
        # cửa vòm chính và ô vòm hai mặt bên
        aw = w_ * .22; ah = h_ * .62; by = base - 2
        o += '<path d="M%.1f %.1fV%.1fA%.1f %.1f 0 0 1 %.1f %.1fV%.1fZ" fill="%s" stroke="#C99A3A" stroke-width="1.4"/>' % (cx - aw / 2, by, by - ah + aw / 2, aw / 2, aw / 2, cx + aw / 2, by - ah + aw / 2, by, '#3A1F12' if k == 0 else '#4A2C18')
        for sg in (-1, 1):
            sx = cx + sg * (w_ / 2 - q / 2)
            o += '<path d="M%.1f %.1fV%.1fA%.1f %.1f 0 0 1 %.1f %.1fV%.1fZ" fill="#6E4A2A"/>' % (sx - q * .2, by, by - ah * .75 + q * .2, q * .2, q * .2, sx + q * .2, by - ah * .75 + q * .2, by)
        # diềm gạch + mái ngói cong vểnh góc
        ew = w_ + 16 - 2 * t; eh = 9 - 3 * t; ey = top + 1
        o += '<rect x="%.1f" y="%.1f" width="%.1f" height="3.4" fill="#FFF3D6" stroke="#8A7A5A" stroke-width=".7"/>' % (cx - w_ / 2 + 1, ey + 1, w_ - 2)
        d = 'M%.1f %.1fQ%.1f %.1f %.1f %.1fH%.1fQ%.1f %.1f %.1f %.1fL%.1f %.1fH%.1fZ' % (cx - ew / 2 - 4, ey - eh + 2, cx - ew / 2 + 1, ey + 1, cx - ew / 2 + 9, ey + 1, cx + ew / 2 - 9, cx + ew / 2 - 1, ey + 1, cx + ew / 2 + 4, ey - eh + 2, cx + w_ / 2 - q * .8, ey - eh, cx - w_ / 2 + q * .8)
        o += tiles(d, cx - ew / 2 - 5, ey - eh - 1, cx + ew / 2 + 5, ey + 2, '#B5613C', '#6E3522', 5)
        base = ey - eh + 1
    # đỉnh hồ lô đồng
    o += '<ellipse cx="%d" cy="%d" rx="13" ry="5" fill="#B5613C" %s/><ellipse cx="%d" cy="%d" rx="8" ry="6.5" fill="#E8B22E" %s/><ellipse cx="%d" cy="%d" rx="5" ry="4.5" fill="#F7D35A" %s/><circle cx="%d" cy="%d" r="3" fill="#FFE99A" %s/><path d="M%d %dv-11" stroke="#C99A3A" stroke-width="2.4" stroke-linecap="round"/>' % (cx, base, OUT % B, cx, base - 7, OUT % B, cx, base - 16, OUT % B, cx, base - 22, OUT % B, cx, base - 24)
    # lư hương đá thay đài nghiên, hai bụi cây hai bên sân
    o += bush(cx - 66, y - 18, .9) + bush(cx + 66, y - 18, .9, '#F2468A')
    return o

# ---------- nhà tranh của thú cưng: vách đất, mái rạ, chum nước, rào tre ----------
def nhatranh(cx, y):
    o = yard(cx + 6, y + 8, 110, 20)
    o += '<rect x="%d" y="%d" width="118" height="44" fill="#C99A62" %s/>' % (cx - 59, y - 44, OUT % B)
    for k in range(10): o += '<path d="M%d %dv44" stroke="#A9794A" stroke-width="1.4"/>' % (cx - 56 + k * 12, y - 44)
    o += '<rect x="%d" y="%d" width="30" height="36" rx="2" fill="#3A1F12" %s/>' % (cx - 15, y - 36, OUT % B)
    for sg in (-1, 1): o += '<rect x="%d" y="%d" width="18" height="16" fill="#FFD77A" %s/><path d="M%d %dv16" stroke="#6B3E1E"/>' % (cx + sg * 38 - 9, y - 34, OUT % B, cx + sg * 38, y - 34)
    o += '<rect x="%d" y="%d" width="118" height="14" fill="url(#es)"/>' % (cx - 59, y - 44)
    o += thatch(cx, y - 42, 156, 56)
    o += '<path d="M%d %dv-22" stroke="#7A5428" stroke-width="7"/>' % (cx + 44, y - 74)
    for k, dx in enumerate((0, 8, -4)): o += '<circle class="smoke" style="--d:-%.1fs" cx="%d" cy="%d" r="9" fill="#F2EBDD" opacity=".6"/>' % (k * 1.3, cx + 44 + dx, y - 100)
    o += '<g transform="translate(%d %d)"><ellipse cy="13" rx="16" ry="4" fill="#0A4A30" opacity=".3"/><path d="M-13 -8Q-16 12 -8 14H8Q16 12 13 -8Z" fill="#8F4A2A" %s/><ellipse cy="-8" rx="13" ry="4.5" fill="#3A2413" %s/></g>' % (cx - 84, y + 2, OUT % B, OUT % B)
    o += fence(cx - 118, y + 6, cx - 66, y + 10)
    return o

# ---------- chợ quê: lều lá trên cột tre, sạp mẹt, quang gánh ----------
def leu(x, y, w=86):
    o = yard(x, y + 6, w * .62, 11, '#D9B785')
    for dx in (-w / 2 + 6, w / 2 - 6): o += '<path d="M%.1f %.1fv-40" stroke="#A9743A" stroke-width="4"/>' % (x + dx, y)
    o += '<rect x="%.1f" y="%.1f" width="%d" height="9" fill="#B98A4A" %s/>' % (x - w / 2 + 8, y - 14, w - 16, OUT % B)
    for k in range(4):
        fx = x - w / 2 + 20 + k * (w - 40) / 3
        o += '<ellipse cx="%.1f" cy="%.1f" rx="10" ry="4" fill="#C9A464" stroke="#7A5428"/>' % (fx, y - 15)
        col = ['#E2492E', '#F7C21A', '#6FC24A', '#F09A2C'][k]
        for j in range(5): o += '<circle cx="%.1f" cy="%.1f" r="2.8" fill="%s"/>' % (fx + R.uniform(-6, 6), y - 17 - R.uniform(0, 3), col)
    o += thatch(x, y - 38, w + 22, 26, '#C9B068', '#8A7A3A')
    return o

def non(x, y, c='#2E5AA8', ganh=False, pant='#2A2A3A', skin='#F2C9A0'):
    """Người đội nón lá: áo, quần, tay, mặt; ganh=True thêm đòn gánh hai thúng."""
    o = '<g transform="translate(%d %d)"><ellipse cy="1" rx="%d" ry="3.4" fill="#0A4A30" opacity=".3"/>' % (x, y, 22 if ganh else 11)
    o += '<path d="M-5 -16L-6 -1H-1L0 -14L1 -1H6L5 -16Z" fill="%s" stroke="#1A1A24" stroke-width=".8"/><path d="M-7 -1h6M1 -1h6" stroke="#7A5428" stroke-width="2" stroke-linecap="round"/>' % pant
    o += '<path d="M-7 -30Q-8 -18 -7 -13H7Q8 -18 7 -30Q0 -34 -7 -30Z" fill="%s" stroke="#1A1A24" stroke-width=".9"/><path d="M0 -32V-13" stroke="#fff" stroke-width=".7" opacity=".6"/>' % c
    if ganh:
        o += '<path d="M-22 -33Q0 -38 22 -33" stroke="#8F5A2E" stroke-width="2.4" fill="none"/>'
        for sg in (-1, 1):
            xx = sg * 21
            o += '<path d="M%d -33L%d -14M%d -33L%d -14" stroke="#6B4322" stroke-width=".8"/><path d="M%d -14Q%d -3 %d -3Q%d -3 %d -14Z" fill="#C9A464" stroke="#6B4322"/><ellipse cx="%d" cy="-14" rx="8.5" ry="2.6" fill="#E2492E" stroke="#6B4322" stroke-width=".7"/>' % (xx - 2, xx - 7, xx + 2, xx + 7, xx - 8, xx - 8, xx, xx + 8, xx + 8, xx)
        o += '<path d="M6 -29Q11 -30 12 -34" stroke="%s" stroke-width="3" fill="none" stroke-linecap="round"/>' % c
    else:
        o += '<path d="M-7 -28Q-11 -22 -9 -16M7 -28Q11 -22 9 -16" stroke="%s" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="-9" cy="-15" r="1.7" fill="%s"/><circle cx="9" cy="-15" r="1.7" fill="%s"/>' % (c, skin, skin)
    o += '<rect x="-1.8" y="-35" width="3.6" height="4" fill="%s"/><circle cy="-38" r="5" fill="%s" stroke="#1A1A24" stroke-width=".7"/><circle cx="1.6" cy="-38" r=".8" fill="#222"/><path d="M3 -36q-1.6 1 -3 .4" stroke="#7A3A2A" stroke-width=".7" fill="none"/>' % (skin, skin)
    o += '<path d="M-15 -39L0 -53L15 -39Q0 -35 -15 -39Z" fill="#F7E2A8" stroke="#8A6A3A" stroke-width="1"/>'
    for k in (1, 2): o += '<path d="M%.1f %.1fQ0 %.1f %.1f %.1f" stroke="#D9B878" stroke-width=".8" fill="none"/>' % (-15 + k * 4.4, -39 - k * 4, -37 - k * 3.2, 15 - k * 4.4, -39 - k * 4)
    return o + '</g>'

def trau(x, y):
    # theo ảnh thật: thân thùng xám đen, vai gồ, cổ thấp, đầu dài, sừng đen cong ra sau ôm đầu, chân ngắn dính bùn
    K = '#141216'
    o = '<linearGradient id="bufb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A585E"/><stop offset=".45" stop-color="#37353A"/><stop offset="1" stop-color="#232126"/></linearGradient>'
    o += '<g transform="translate(%d %d) scale(.66)"><ellipse cy="1" rx="52" ry="6" fill="#0A4A30" opacity=".32"/>' % (x, y)
    o += '<g transform="translate(-47 -38)"><g class="tl"><path d="M0 0Q-7 10 -5 25" stroke="#2A282C" stroke-width="2.6" fill="none"/><path d="M-5 24q-4 7 -1 11q5 -4 1 -11Z" fill="#141216"/></g></g>'
    # chân phía xa
    for lx in (-30, 16): o += '<path d="M%d -22q-2 10 -1 16l-1 6h9l1 -6q2 -8 2 -16Z" fill="#242226" stroke="%s" stroke-width="1"/>' % (lx, K)
    # thân
    o += '<path d="M-47 -36Q-44 -47 -28 -48Q-8 -46 6 -51Q18 -56 28 -48Q36 -42 38 -32L34 -18Q24 -12 8 -13Q-16 -11 -36 -14Q-48 -18 -47 -36Z" fill="url(#bufb)" stroke="%s" stroke-width="1.6"/>' % K
    o += '<path d="M-38 -44Q-14 -44 6 -49Q16 -52 24 -47" stroke="#8A8890" stroke-width="2.6" fill="none" opacity=".6" stroke-linecap="round"/><path d="M-20 -38q3 10 0 20M2 -40q4 10 2 22" stroke="#1E1C20" stroke-width="1.3" fill="none" opacity=".7"/><path d="M-40 -26q6 8 14 8" stroke="#1E1C20" stroke-width="1.3" fill="none" opacity=".6"/>'
    # chân gần, bùn khô dưới gối
    for lx in (-38, 8):
        o += '<path d="M%d -24q-3 11 -1 18l-1 6h11l1 -6q3 -9 3 -18Z" fill="#37353A" stroke="%s" stroke-width="1.2"/><path d="M%d -9q6 2 11 0v3l-1 6h-11Z" fill="#7A6650" opacity=".85"/><path d="M%d -1v-3M%d -1v-3" stroke="%s" stroke-width="1"/>' % (lx, K, lx - 1, lx + 3, lx + 7, K)
    # sừng xa
    # cổ + đầu dài thấp
    o += '<path d="M24 -46Q40 -54 50 -50Q60 -46 64 -34L72 -20Q74 -13 66 -12Q60 -11 56 -16Q46 -20 36 -22Q24 -24 22 -34Z" fill="#37353A" stroke="%s" stroke-width="1.5"/>' % K
    o += '<path d="M42 -48Q54 -46 60 -36" stroke="#7A7880" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/>'
    o += '<path d="M60 -22Q68 -24 73 -19Q74 -12 66 -12Q60 -12 57 -16Z" fill="#6E6A6C" stroke="%s" stroke-width="1"/><ellipse cx="69" cy="-18" rx="1.6" ry="1.1" fill="#0C0A0C"/><path d="M60 -13q5 3 11 0" stroke="#141216" stroke-width="1" fill="none"/>' % K
    o += '<path d="M40 -36Q30 -38 26 -33Q32 -29 42 -32Z" fill="#2E2C31" stroke="%s" stroke-width="1"/>' % K
    o += '<circle cx="51" cy="-38" r="2.5" fill="#0C0A0C"/><circle cx="50.2" cy="-38.8" r=".8" fill="#fff"/><path d="M47 -41.5q4 -2 7 0" stroke="#141216" stroke-width="1.1" fill="none"/>'
    # sừng: bản dẹt, gốc dày trên đỉnh đầu, cong ra hai bên thành lưỡi liềm, mũi quặp vào; có ngấn ngang
    for d_ in ('M47 -46C33 -44 17 -50 16 -66C16 -73 21 -78 28 -81C25 -73 28 -65 36 -61C43 -58 49 -57 52 -53Z', 'M55 -50C65 -50 79 -56 80 -71C80 -77 76 -81 69 -83C72 -75 69 -68 63 -63C58 -60 54 -58 51 -54Z'):
        o += '<path d="%s" fill="#1A181C" stroke="%s" stroke-width="1"/>' % (d_, K)
    for d_ in ('M42 -47l1 -9M35 -48l3 -9M28 -51l5 -7M22 -57l7 -4', 'M59 -51l-2 -8M66 -53l-5 -7M72 -58l-7 -5'): o += '<path d="%s" stroke="#55525A" stroke-width="1.1"/>' % d_
    o += '<path d="M60 -44Q68 -46 73 -41Q68 -38 60 -40Z" fill="#2E2C31" stroke="%s" stroke-width="1"/>' % K
    # trẻ chăn trâu ngồi dạng chân trên lưng, cầm dây thừng
    skin = '#E8B98E'
    o += '<path d="M2 -71Q38 -46 66 -17" stroke="#C9A464" stroke-width="1.3" fill="none"/>'
    o += '<g transform="translate(-12 -49)">'
    o += '<path d="M-3 -1Q-7 8 -3 12L9 10Q13 2 8 -3Z" fill="#3A5A8C" stroke="#1A1A24" stroke-width="1"/>'
    o += '<path d="M4 9Q9 16 6 27" stroke="%s" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="M6 27q5 3 9 1" stroke="%s" stroke-width="4" fill="none" stroke-linecap="round"/>' % (skin, skin)
    o += '<path d="M-7 -25Q-9 -10 -5 0L9 0Q11 -12 8 -25Q0 -29 -7 -25Z" fill="#F0E8D8" stroke="#1A1A24" stroke-width="1"/><path d="M0 -26V-1" stroke="#B9AE96" stroke-width=".8"/>'
    o += '<path d="M6 -22Q10 -16 14 -22" stroke="#F0E8D8" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M12 -20L15 -22" stroke="%s" stroke-width="4.4" stroke-linecap="round"/>' % skin
    o += '<rect x="-1.6" y="-30" width="4" height="4" fill="%s"/><circle cx=".5" cy="-34" r="6" fill="%s" stroke="#1A1A24" stroke-width=".8"/><path d="M-5 -36q-1 5 3 7q-4 -1 -5 -4Z" fill="#26222A"/><circle cx="3.4" cy="-34" r=".9" fill="#222"/><path d="M3.5 -31q1.4 .5 2.4 -.3" stroke="#7A3A2A" stroke-width=".7" fill="none"/>' % (skin, skin)
    o += '<path d="M-16 -35L1 -50L17 -37Q0 -33 -16 -35Z" fill="#F7E2A8" stroke="#8A6A3A" stroke-width="1"/><path d="M-10 -39Q1 -36 11 -40M-5 -44Q1 -42 7 -44" stroke="#D9B878" stroke-width=".8" fill="none"/></g>'
    return o + '</g>'

def sampan(x, y, s=1):
    # theo ảnh Tam Cốc: thuyền gỗ đáy phẳng thấp, sơn xanh, có đà ngang; người ngồi đuôi chèo bằng chân, nón lá, áo sơ mi caro
    K = '#1A1A24'; skin = '#E8B98E'
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<ellipse cy="15" rx="108" ry="9" fill="#0B6E88" opacity=".42"/>'
    o += '<path d="M-96 -4Q-84 -8 -60 -6H62Q84 -8 100 -14Q92 2 78 8Q40 13 -60 13Q-86 10 -96 -4Z" fill="#2F7A6E" stroke="%s" stroke-width="1.6"/>' % K
    o += '<path d="M-90 -2Q-30 3 92 -7" stroke="#EFE6CC" stroke-width="3.4" fill="none"/><path d="M-84 6Q-20 11 80 4" stroke="#1F5A52" stroke-width="2" fill="none"/>'
    o += '<path d="M-70 -7H70Q60 -2 -60 -2Z" fill="#6B4C2E"/>'
    for k in (-30, 0, 30, 58): o += '<path d="M%d -7.5h7v6h-7Z" fill="#C9975A" stroke="#5A3418" stroke-width=".8"/>' % k
    # sọt nông sản ở mũi
    o += '<path d="M46 -8Q46 -22 58 -23Q72 -22 72 -9Z" fill="#C9A464" stroke="#6B4322" stroke-width="1.1"/><path d="M48 -14h22M47 -11h24" stroke="#8F6A28" stroke-width="1"/><circle cx="54" cy="-23" r="4" fill="#F28FB0"/><circle cx="62" cy="-24" r="3.6" fill="#7FCB6A"/>'
    # mái chèo: từ bàn chân xuống nước, có bọt
    o += '<path d="M2 -24L30 -4L74 30" stroke="#B98A4A" stroke-width="3.6" stroke-linecap="round"/><path d="M68 24L84 37L76 42L60 29Z" fill="#C9975A" stroke="#5A3418"/>'
    o += '<path d="M28 -3l6 3" stroke="#5A3418" stroke-width="4"/><path class="lap" style="--t:3s" d="M60 34q12 -6 26 0" stroke="#fff" stroke-width="2.2" fill="none"/>'
    # người ngồi chèo chân
    o += '<path d="M-50 -7L-46 -12H-22L-20 -7Z" fill="#8F5A2E" stroke="#3A2413" stroke-width=".8"/>'
    o += '<path d="M-40 -14Q-24 -30 -12 -28Q-4 -26 2 -24" stroke="#7A4FA8" stroke-width="7.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-1 -25L7 -30" stroke="%s" stroke-width="4.8" stroke-linecap="round"/>' % skin
    o += '<path d="M-48 -44Q-52 -28 -46 -11L-30 -11Q-27 -28 -32 -44Q-40 -48 -48 -44Z" fill="#F4F0E4" stroke="%s" stroke-width="1"/>' % K
    for k in range(4): o += '<path d="M%d -46V-12M-50 %dH-29" stroke="#2E5AA8" stroke-width="1.1" opacity=".75"/>' % (-46 + k * 5, -40 + k * 8)
    o += '<path d="M-34 -41Q-26 -32 -16 -32" stroke="#F4F0E4" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-18 -32h4" stroke="%s" stroke-width="4" stroke-linecap="round"/>' % skin
    o += '<rect x="-42" y="-50" width="5" height="5" fill="%s"/><circle cx="-38" cy="-54" r="6.4" fill="%s" stroke="%s" stroke-width=".8"/><path d="M-44 -50q-3 8 -1 13" stroke="#26222A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="-34.6" cy="-54" r=".9" fill="#222"/>' % (skin, skin, K)
    o += '<path d="M-58 -54L-38 -74L-16 -56Q-38 -51 -58 -54Z" fill="#F7E2A8" stroke="#8A6A3A" stroke-width="1.1"/><path d="M-50 -59Q-38 -56 -25 -60M-44 -65Q-38 -63 -31 -65" stroke="#D9B878" stroke-width=".9" fill="none"/>'
    return o + '</g>'

# ---------- đường + cầu một nét ----------
MAIN = 'M-20 672C120 672 240 656 330 646C396 638 432 632 432 596L432 492C432 440 440 416 490 406C540 396 600 402 640 402C760 402 860 438 1120 428'
SPURS = ['M490 406C410 424 330 424 292 396C266 376 270 350 262 334', 'M432 470C380 462 330 472 286 466', 'M770 408Q768 366 760 318', 'M560 400Q548 386 500 376', 'M930 426Q966 420 990 402']
BR = 'M640 402C648 430 640 450 640 480L640 596C640 636 700 654 780 654L1120 654'

def road(d):
    return ('<path d="%s" stroke="#8A6A3A" stroke-width="30" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/><path d="%s" stroke="#D9AE6A" stroke-width="25" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="%s" stroke="#E9C68A" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="%s" stroke="#B98A4A" stroke-width="2.6" stroke-dasharray="1 13" stroke-linecap="round" fill="none"/>' % (d, d, d, d))

def network(mains, spurs=()):
    all_ = [(d, 30, 25, 13) for d in mains] + [(d, 16, 12, 6) for d in spurs]
    st = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'
    o = '<g opacity=".5">' + ''.join('<path d="%s" stroke="#8A6A3A" stroke-width="%d" %s/>' % (d, a, st) for d, a, b, c_ in all_) + '</g>'
    o += ''.join('<path d="%s" stroke="#D9AE6A" stroke-width="%d" %s/>' % (d, b, st) for d, a, b, c_ in all_)
    o += ''.join('<path d="%s" stroke="#E9C68A" stroke-width="%d" %s/>' % (d, c_, st) for d, a, b, c_ in all_)
    o += ''.join('<path d="%s" stroke="#B98A4A" stroke-width="2.6" stroke-dasharray="1 13" stroke-linecap="round" fill="none"/>' % d for d in mains)
    return o

def bridge(x, y0, y1):
    # cầu nằm đúng trên đường: cùng bề rộng, hai đầu nối liền mặt đường
    w = 25
    o = '<rect x="%d" y="%d" width="%d" height="%d" fill="#0B6E88" opacity=".4"/>' % (x - w / 2 + 8, y0, w + 8, y1 - y0)
    o += '<path d="M%d %dQ%d %d %d %dL%d %dQ%d %d %d %dZ" fill="#C9A06A" %s/>' % (x - w / 2, y0, x - w / 2 - 4, (y0 + y1) / 2, x - w / 2, y1, x + w / 2, y1, x + w / 2 + 4, (y0 + y1) / 2, x + w / 2, y0, OUT % B)
    yy = y0 + 4
    while yy < y1 - 2:
        o += '<rect x="%d" y="%d" width="%d" height="6" fill="%s" stroke="#7A5428" stroke-width=".7"/>' % (x - w / 2 - 2, yy, w + 4, R.choice(['#D9B57A', '#C9A06A', '#E3C48E'])); yy += 7
    for sg in (-1, 1):
        rx = x + sg * (w / 2 + 3)
        o += '<path d="M%d %dQ%d %d %d %d" stroke="#6B4322" stroke-width="3.4" fill="none"/>' % (rx, y0 - 6, rx + sg * 3, (y0 + y1) / 2, rx, y1 + 6)
        for k in range(8): o += '<rect x="%d" y="%d" width="4" height="9" fill="#8F5A2E"/>' % (rx - 2, y0 - 6 + k * (y1 - y0 + 12) / 7 - 8)
    return o

def bird(y, t, d, s=1):
    return '<g class="fly" style="--t:%ds;--d:-%ds"><g transform="translate(-80 %d) scale(%.2f)"><path class="flap" d="M-14 0Q-7 -9 0 0Q7 -9 14 0" stroke="%s" stroke-width="2.6" fill="none" stroke-linecap="round"/></g></g>' % (t, d, y, s, B)

def driftcloud(y, s, t, d, shadow=True, col='#FFFFFF'):
    o = '<g class="drift" style="--t:%ds;--d:-%ds">' % (t, d) + cloud(0, y, s, col, '#E8A9B8') + '</g>'
    if shadow: o += '<g class="drift" style="--t:%ds;--d:-%ds"><ellipse cx="60" cy="%d" rx="%d" ry="%d" fill="#0A3A40" opacity=".13" filter="url(#soft)"/></g>' % (t, d, y + 330, 150 * s, 36 * s)
    return o

PH = {
 'day':   dict(sky='url(#sky)', ov=None, stars=False),
 'dusk':  dict(sky='url(#skyD)', ov=('#E8703A', .5), stars=False),
 'night': dict(sky='url(#skyN)', ov=('#0C1648', .68), stars=True),
}

def village(ph):
    P = PH[ph]; night = ph == 'night'
    o = '<linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A5BB0"/><stop offset=".5" stop-color="#F08A6A"/><stop offset="1" stop-color="#FFD48A"/></linearGradient><linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050A2A"/><stop offset="1" stop-color="#1E2A6A"/></linearGradient>'
    o += '<rect width="1100" height="720" fill="%s"/>' % P['sky']
    if P['stars']:
        for _ in range(90): o += '<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="#fff"/>' % (R.uniform(2, 5), R.uniform(0, 4), R.randint(0, 1100), R.randint(0, 250), R.uniform(.7, 2))
        pass
    else:
        sx, sy = (690, 92) if ph == 'day' else (880, 190)
        rays = ''.join('<path d="M0 -46L7 -80L-7 -80Z" transform="rotate(%d)" fill="%s"/>' % (a, C['gold']) for a in range(0, 360, 30))
        beams = ''.join('<path d="M0 0L-16 -300L16 -300Z" transform="rotate(%d)" fill="#FFF6C8" opacity=".14"/>' % a for a in range(0, 360, 30))
        o += '<g transform="translate(%d %d)"><g class="spin">%s</g><circle class="halo" r="96" fill="#FFF3B0" filter="url(#soft)"/><g class="spin">%s</g><circle r="42" fill="%s" stroke="%s" stroke-width="2"/><circle r="29" fill="none" stroke="%s" stroke-width="2"/><circle r="15" fill="%s"/></g>' % (sx, sy, beams, rays, C['gold'], C['red'], C['red'], C['red'])
    for d, fill in [('M-30 280C0 130 40 96 80 180C100 100 150 56 196 170C230 120 262 130 300 214L330 290H-30Z', 'url(#kar)'), ('M740 280C780 120 826 76 866 170C900 80 952 96 990 188C1030 120 1076 110 1130 196V300H740Z', 'url(#kar)'), ('M280 280C330 176 372 150 410 216C450 170 504 182 540 264Z', 'url(#kar2)')]:
        o += '<path d="%s" fill="%s"/>' % (d, fill)
    for d in ['M80 180Q70 230 90 280', 'M196 170Q170 220 186 280', 'M866 170Q850 220 870 280', 'M990 188Q970 230 990 290', 'M410 216Q396 240 410 270']: o += '<path d="%s" stroke="#117F72" stroke-width="3" fill="none" opacity=".45"/>' % d
    o += '<rect x="-20" y="232" width="1140" height="36" fill="#fff" opacity=".5" filter="url(#soft)"/>'
    o += '<path d="M-10 262C160 202 320 252 520 234C720 216 900 244 1110 212V730H-10Z" fill="url(#hill1)"/>'
    # ruộng bậc thang xa
    tid = uid()
    o += '<clipPath id="%s"><path d="M560 262C700 226 960 216 1110 226V286C900 276 700 280 560 262Z"/></clipPath><g clip-path="url(#%s)">' % (tid, tid)
    for k in range(6): o += '<path d="M540 %dQ820 %d 1120 %d" stroke="%s" stroke-width="10" fill="none"/><path d="M540 %dQ820 %d 1120 %d" stroke="#FFF7C2" stroke-width="1.3" fill="none" opacity=".8"/>' % (276 - k * 3, 236 + k * 7, 224 + k * 11, ['#9BE564', '#C7EB6A', '#3CCB6B', '#7FE3E0'][k % 4], 271 - k * 3, 231 + k * 7, 219 + k * 11)
    o += '</g>'
    o += '<path d="M-10 312C200 262 420 322 620 296C820 270 960 300 1110 276V730H-10Z" fill="url(#hill2)"/>'
    o += grass(460, 0, 310, 1100, 500, lambda x, y: True)
    # đường liền một nét; sông vẽ đè lên rồi cầu đặt đúng chỗ giao
    o += network([MAIN, BR], SPURS)
    rv = 'M-20 498C170 448 300 530 480 508S770 448 1120 502V594C780 538 640 610 470 596S170 532 -20 586Z'
    o += '<path d="%s" fill="#0B6E88" transform="translate(0 5)" opacity=".35"/><path d="%s" fill="url(#riv)"/><path d="%s" fill="none" stroke="#E8FFF8" stroke-width="4" opacity=".7"/>' % (rv, rv, rv)
    for dy, w_, op in [(516, 2.6, .8), (536, 3, .9), (556, 2.6, .8), (574, 2.2, .6)]:
        o += '<path class="flow" d="M-40 %dC170 %d 300 %d 480 %dS770 %d 1140 %d" stroke="#fff" stroke-width="%.1f" stroke-dasharray="46 74" fill="none" stroke-linecap="round" opacity="%.1f"/>' % (dy, dy - 46, dy + 34, dy + 8, dy - 54, dy + 4, w_, op)
    rid = uid()
    o += '<clipPath id="%s"><path d="%s"/></clipPath><g clip-path="url(#%s)">' % (rid, rv, rid)
    o += '<path d="%s" fill="none" stroke="#0E93A6" stroke-width="26" opacity=".35"/>' % rv
    for row, yy in enumerate(range(452, 604, 13)):
        o += '<g class="lap" style="--t:%.1fs;--d:-%.1fs">' % (4 + row % 3, row * .9)
        xx = -30 + (row % 2) * 22
        while xx < 1120:
            if R.random() < .62:
                w_ = R.choice([18, 24, 30]); yj = yy + R.uniform(-3, 3)
                o += '<path d="M%.1f %.1fq%.1f -7 %.1f 0q%.1f -7 %.1f 0" stroke="%s" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="%.2f"/>' % (xx, yj, w_ / 4, w_ / 2, w_ / 4, w_ / 2, R.choice(['#fff', '#BDF4F0', '#0E93A6']), R.uniform(.45, .9))
            xx += 44
        o += '</g>'
    for _ in range(46): o += '<g class="tw" style="--t:%.1fs;--d:-%.1fs" transform="translate(%d %d)"><path d="M0 -4L1 -1L4 0L1 1L0 4L-1 1L-4 0L-1 -1Z" fill="#fff"/></g>' % (R.uniform(2, 4.5), R.uniform(0, 4), R.randint(0, 1100), R.randint(460, 596))
    o += '<path class="flow" d="%s" fill="none" stroke="#fff" stroke-width="3.4" stroke-dasharray="18 26" opacity=".85"/>' % rv
    o += '</g>'
    o += '<path d="M-10 594C170 540 300 612 470 604S780 546 1110 602V730H-10Z" fill="url(#hill3)"/><path d="M-10 594C170 540 300 612 470 604S780 546 1110 602" fill="none" stroke="#F2DDA6" stroke-width="5"/>'
    o += network(['M-20 672C120 672 240 656 330 646C396 638 432 632 432 604', 'M640 604C640 636 700 654 780 654L1120 654'])
    o += grass(300, 0, 610, 1100, 716, lambda x, y: True)
    for bx in (432, 640):
        for yy in (514, 556, 588):
            o += '<ellipse class="lap" style="--t:3.6s" cx="%d" cy="%d" rx="26" ry="5" fill="none" stroke="#fff" stroke-width="1.8" opacity=".7"/>' % (bx, yy)
    o += bridge(432, 488, 604) + bridge(640, 478, 604)
    # sau → trước theo trục y
    o += tree(690, 262, .5) + tree(1040, 268, .55)
    o += thuvien(760, 280)
    o += truong(200, 312)
    o += dinh(490, 322)
    o += cau(330, 300, .7) + cau(610, 330, .7) + tree(68, 322, .75)
    o += thapbut(990, 390)
    o += bush(650, 340, 1.1, '#F2468A') + bush(340, 330, 1, '#F7D21A') + bush(860, 350, 1.1) + bush(590, 450, 1, '#F2468A') + bush(380, 500, .8)
    # đa + giếng
    o += yard(205, 458, 92, 18)
    o += tree(64, 478, 1.55)
    o += well(232, 452, .72)
    o += non(190, 470, '#C7321F') + trau(808, 472) + bush(520, 460, 1) + cau(880, 470, .85) + cau(1064, 476, .8) + tre(690, 470, 6, .78) + cau(500, 486, .65)
    # bến, thuyền
    o += '<rect x="500" y="606" width="96" height="9" fill="%s" %s/>' % (C['brown'], OUT % B) + ''.join('<rect x="%d" y="612" width="6" height="18" fill="#6B3E1E"/>' % x for x in (508, 542, 582))
    for bx, by, bw in [(335, 562, 62), (860, 550, 72)]:
        for k in range(3): o += '<ellipse class="lap" style="--t:%.1fs" cx="%d" cy="%d" rx="%d" ry="%d" fill="none" stroke="#fff" stroke-width="1.6" opacity="%.1f"/>' % (3.4 + k, bx, by + k * 3, bw + k * 12, 6 + k * 2, .8 - k * .2)
    o += '<g class="rock">' + sampan(335, 552, .56) + '</g>' + '<g class="rock" style="animation-delay:-1.5s">' + sampan(860, 540, .6) + '</g>'
    # dưới: nhà, chợ, ao
    o += nhatranh(150, 642) + cau(40, 648, .8) + tre(248, 640, 4, .7)
    o += tree(1050, 640, .9)
    o += leu(790, 638) + leu(890, 626) + leu(985, 640) + non(840, 650) + non(940, 652, '#C7321F', True) + non(1034, 690, '#2F8F5B', False, '#5A3A22')
    o += '<ellipse cx="620" cy="686" rx="0" ry="0"/>'
    o += bush(720, 640, 1) + bush(40, 700, 1) + bush(1080, 706, 1)
    if P['ov']: o += '<rect width="1100" height="720" fill="%s" opacity="%.2f" style="mix-blend-mode:multiply"/>' % P['ov']
    # đèn cửa ban đêm + đom đóm
    if night:
        o += '<radialGradient id="wg"><stop offset="0" stop-color="#FFD27A" stop-opacity=".85"/><stop offset=".45" stop-color="#FFB84A" stop-opacity=".3"/><stop offset="1" stop-color="#FFB84A" stop-opacity="0"/></radialGradient><radialGradient id="mg"><stop offset="0" stop-color="#E6EEFF" stop-opacity=".6"/><stop offset="1" stop-color="#E6EEFF" stop-opacity="0"/></radialGradient>'
        o += '<g transform="translate(860 92)"><circle r="130" fill="url(#mg)"/><circle r="40" fill="#FFF8DC"/><circle cx="-12" cy="-8" r="8" fill="#E6DCB8"/><circle cx="14" cy="10" r="11" fill="#E6DCB8"/><circle cx="10" cy="-18" r="5" fill="#E6DCB8"/></g>'
        for x, y, r in [(112, 618, 26), (188, 618, 26), (760, 244, 30), (490, 290, 60), (990, 250, 26), (154, 282, 20), (244, 282, 20), (790, 604, 22), (890, 592, 22), (985, 606, 22), (700, 586, 0)]:
            if r: o += '<circle cx="%d" cy="%d" r="%d" fill="url(#wg)"/>' % (x, y, r * 1.5)
        for _ in range(26): o += '<circle class="ff" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="2.4" fill="#E8FF8A"/>' % (R.uniform(1.6, 3.4), R.uniform(0, 3), R.randint(20, 1080), R.randint(330, 700))
    # chim, mây trôi
    o += flock(84, 54, 6, .5) + flock(122, 76, 44, .4)
    cl = '#FFFFFF' if ph == 'day' else '#FFD9C8' if ph == 'dusk' else '#4A5590'
    o += driftcloud(64, .9, 96, 10, True, cl) + driftcloud(120, .7, 130, 70, False, cl) + driftcloud(40, .6, 110, 40, False, cl)
    return o

def pins():
    return (label(200, 200, 'Trường làng') + label(760, 120, 'Thư các') + label(490, 150, 'Đình làng') + label(226, 500, 'Giếng làng', '24', True) + label(990, 66, 'Tháp Bút') + label(548, 590, 'Bến thuyền') + label(888, 690, 'Chợ quê') + label(150, 680, 'Nhà của Kitsu'))

def r1x(name, title, ph):
    trail = '<path class="trail" d="M426 470C380 462 330 472 290 466" stroke="%s" stroke-width="5" stroke-dasharray="4 16" stroke-linecap="round" fill="none"/>' % C['red']
    body = ('<div class="v" style="width:1100px;height:720px"><svg class="abs" style="left:0;top:0" width="1100" height="720" role="img" aria-label="Bản đồ làng, mỗi địa điểm là một mục"><defs>' + DEFS + '</defs>' + village(ph) + trail + kitsu(432, 500, 84, 'ehappy', 'walk') + pins() + '<rect width="1100" height="720" filter="url(#grain)" opacity=".4"/></svg>'
            '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">12 ngày liền</span><span class="pill">540 xu</span><span class="pill">Cấp 12</span></div>'
            '<div class="abs" style="right:20px;top:16px;display:flex;gap:8px"><span class="pill">Tìm từ <kbd>Ctrl K</kbd></span><span class="pill">Cài đặt</span></div>'
            '<div class="abs" style="left:300px;bottom:12px"><button class="go">Tới Giếng làng, ôn 24 từ <kbd style="background:rgba(255,255,255,.22);color:#fff">Enter</kbd></button></div></div>')
    write(name, title, 1100, 720, body)

# màn trong dùng công trình làng quê
def _well_q(x, y, s=1):
    return ('<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="28" rx="56" ry="10" fill="#0A4A30" opacity=".3"/><rect x="-46" y="0" width="92" height="28" fill="#A0705A" %s/>' % (x, y, s, OUT % B)
            + ''.join('<path d="M%d 0v28" stroke="#6E4A36" stroke-width="1.2"/>' % k for k in range(-40, 44, 12)) + '<path d="M-46 10h92M-46 20h92" stroke="#6E4A36" stroke-width="1"/>'
            + '<ellipse rx="46" ry="15" fill="#C9B69A" %s/><ellipse rx="34" ry="10" fill="%s" stroke="%s" stroke-width="1.5"/><path d="M-14 0q14 -5 28 0" stroke="#fff" stroke-width="2" fill="none"/>' % (OUT % B, C['teal'], C['teal3'])
            + '<rect x="30" y="-78" width="7" height="84" fill="#8F5A2E" %s/><path d="M34 -74L-22 -92" stroke="#6B4322" stroke-width="5" stroke-linecap="round"/><path d="M-20 -92V-34" stroke="#6B4322" stroke-width="1.6"/><path d="M-28 -36H-12L-14 -18H-26Z" fill="#B98A4A" %s/></g>' % (OUT % B, OUT % B))

well = _well_q

# ---------- cảnh màn trong: cùng trời, núi, đồi, sông, hoạt ảnh với bản đồ ----------
def _base(w, sunx):
    rays = ''.join('<path d="M0 -38L6 -66L-6 -66Z" transform="rotate(%d)" fill="%s"/>' % (a_, C['gold']) for a_ in range(0, 360, 30))
    beams = ''.join('<path d="M0 0L-13 -240L13 -240Z" transform="rotate(%d)" fill="#FFF6C8" opacity=".14"/>' % a_ for a_ in range(0, 360, 30))
    o = '<rect width="%d" height="720" fill="url(#sky)"/>' % w
    o += '<g transform="translate(%d 92)"><g class="spin">%s</g><circle class="halo" r="78" fill="#FFF3B0" filter="url(#soft)"/><g class="spin">%s</g><circle r="34" fill="%s" stroke="%s" stroke-width="2"/><circle r="23" fill="none" stroke="%s" stroke-width="2"/><circle r="12" fill="%s"/></g>' % (sunx, beams, rays, C['gold'], C['red'], C['red'], C['red'])
    o += '<path d="M-30 280C0 130 40 96 80 180C100 100 150 56 196 170C230 120 262 130 300 214L330 290H-30Z" fill="url(#kar)"/><path d="M230 280C260 150 300 120 330 190C352 130 400 136 %d 210V290H230Z" fill="url(#kar2)"/>' % (w + 30)
    for d in ['M80 180Q70 230 90 280', 'M196 170Q170 220 186 280', 'M330 190Q316 230 330 280']: o += '<path d="%s" stroke="#117F72" stroke-width="3" fill="none" opacity=".45"/>' % d
    o += '<rect x="-20" y="232" width="%d" height="36" fill="#fff" opacity=".5" filter="url(#soft)"/>' % (w + 40)
    o += '<path d="M-10 262C100 222 220 262 %d 236V730H-10Z" fill="url(#hill1)"/>' % (w + 10)
    o += '<path d="M-10 316C110 276 240 330 %d 296V730H-10Z" fill="url(#hill2)"/>' % (w + 10)
    return o + grass(150, 0, 320, w, 590, lambda x, y: True)

def _river(w, top, bot):
    rv = 'M-20 %dC%d %d %d %d %d %dV%dC%d %d %d %d -20 %dZ' % (top + 10, w * .3, top - 26, w * .6, top + 30, w + 20, top, bot, w * .6, bot + 30, w * .3, bot - 24, bot + 8)
    rid = uid()
    o = '<path d="%s" fill="#0B6E88" transform="translate(0 5)" opacity=".35"/><path d="%s" fill="url(#riv)"/><path d="%s" fill="none" stroke="#E8FFF8" stroke-width="4" opacity=".7"/>' % (rv, rv, rv)
    o += '<clipPath id="%s"><path d="%s"/></clipPath><g clip-path="url(#%s)"><path d="%s" fill="none" stroke="#0E93A6" stroke-width="22" opacity=".35"/>' % (rid, rv, rid, rv)
    for row, yy in enumerate(range(top - 10, bot + 10, 13)):
        o += '<g class="lap" style="--t:%.1fs;--d:-%.1fs">' % (4 + row % 3, row * .9)
        xx = -20 + (row % 2) * 22
        while xx < w + 20:
            if R.random() < .6:
                w_ = R.choice([18, 24, 30])
                o += '<path d="M%.1f %.1fq%.1f -7 %.1f 0q%.1f -7 %.1f 0" stroke="%s" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="%.2f"/>' % (xx, yy + R.uniform(-3, 3), w_ / 4, w_ / 2, w_ / 4, w_ / 2, R.choice(['#fff', '#BDF4F0', '#0E93A6']), R.uniform(.45, .9))
            xx += 44
        o += '</g>'
    for dy in (.3, .55, .8): o += '<path class="flow" d="M-30 %dC%d %d %d %d %d %d" stroke="#fff" stroke-width="2.6" stroke-dasharray="46 74" fill="none" stroke-linecap="round" opacity=".8"/>' % (top + (bot - top) * dy, w * .3, top + (bot - top) * dy - 34, w * .6, top + (bot - top) * dy + 26, w + 30, top + (bot - top) * dy)
    for _ in range(14): o += '<g class="tw" style="--t:%.1fs;--d:-%.1fs" transform="translate(%d %d)"><path d="M0 -4L1 -1L4 0L1 1L0 4L-1 1L-4 0L-1 -1Z" fill="#fff"/></g>' % (R.uniform(2, 4.5), R.uniform(0, 4), R.randint(0, w), R.randint(top + 8, bot - 8))
    o += '<path class="flow" d="%s" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="18 26" opacity=".8"/></g>' % rv
    return o

def _front(w, y):
    return '<path d="M-10 %dC120 %d 260 %d %d %dV730H-10Z" fill="url(#hill3)"/><path d="M-10 %dC120 %d 260 %d %d %d" fill="none" stroke="#F2DDA6" stroke-width="5"/>' % (y, y - 22, y + 18, w + 10, y - 6, y, y - 22, y + 18, w + 10, y - 6) + grass(50, 0, y + 12, w, 716, lambda a_, b_: True)

def _edge(w, x):
    # mép giấy lượn giữa cảnh và nội dung
    if x == 0:
        return '<path d="M%d 0C%d 120 %d 240 %d 360S%d 600 %d 720H%dV0Z" fill="%s"/><path d="M%d 0C%d 120 %d 240 %d 360S%d 600 %d 720" fill="none" stroke="%s" stroke-width="3"/>' % (w - 14, w - 26, w - 2, w - 16, w - 2, w - 14, w, C['paper'], w - 14, w - 26, w - 2, w - 16, w - 2, w - 14, C['gold'])
    return '<path d="M14 0C26 120 2 240 16 360S2 600 14 720H0V0Z" fill="%s"/><path d="M14 0C26 120 2 240 16 360S2 600 14 720" fill="none" stroke="%s" stroke-width="3"/>' % (C['paper'], C['gold'])

def panel_well(w):
    o = _base(w, 320) + network(['M-20 556C70 536 150 548 216 522C250 506 300 512 %d 498' % (w + 20)])
    o += yard(190, 500, 150, 26) + cau(380, 430, .8) + tree(84, 478, 1.5)
    o += non(330, 478, '#C7321F') + bush(392, 500, .9, '#F2468A') + bush(36, 520, .9)
    o += _well_q(252, 440, 1.1) + kitsu(160, 536, 124, 'eopen')
    o += _river(w, 588, 672)
    for k in range(3): o += '<ellipse class="lap" style="--t:%.1fs" cx="250" cy="%d" rx="%d" ry="%d" fill="none" stroke="#fff" stroke-width="1.6" opacity="%.1f"/>' % (3.4 + k, 642 + k * 3, 84 + k * 12, 6 + k * 2, .8 - k * .2)
    o += '<g class="rock">' + sampan(250, 626, .62) + '</g>' + _front(w, 686)
    return o

def panel_school(w):
    o = _base(w, 300) + network(['M186 346C186 400 150 430 170 480L170 730'])
    o += truong(176, 340) + tree(44, 372, .62) + cau(346, 372, .62)
    o += bush(280, 400, 1, '#F7D21A') + bush(60, 430, 1, '#F2468A') + non(262, 452, '#2E5AA8') + tre(278, 520, 5, .8) + bush(50, 520, 1)
    o += kitsu(170, 524, 120, 'eopen')
    o += _river(w, 572, 650) + bridge(170, 556, 664)
    return o + _front(w, 660) + network(['M170 660V730']) + bush(70, 704, 1) + bush(300, 700, 1, '#F2468A')

def side(x, w, inner):
    sc = panel_well(w) if w > 400 else panel_school(w)
    sc += flock(70, 44, 8, .42) + driftcloud(58, .62, 90, 30, False) + _edge(w, x)
    return '<svg class="abs" style="left:%dpx;top:0" width="%d" height="720" viewBox="0 0 %d 720" aria-hidden="true"><defs>%s</defs>%s<rect width="%d" height="720" filter="url(#grain)" opacity=".4"/></svg>' % (x, w, w, DEFS, sc, w)

_kid = {}
def kid_scene(w=1280, kind='meadow', cls='bgscene'):
    """Phông cảnh làng cho màn bé và onboarding: trời, núi, đồi, sông, không che nội dung giữa."""
    if (w, kind) not in _kid:
        o = _base(w, w - 240 if w > 500 else 300)
        if w > 500: o += '<g transform="translate(%d 0)"><path d="M-30 280C0 130 40 96 80 180C100 100 150 56 196 170C230 120 262 130 300 214L330 290H-30Z" fill="url(#kar)"/></g><path d="M-10 262C300 210 700 268 %d 226V330H-10Z" fill="url(#hill1)"/>' % (w - 620, w + 10)
        if kind == 'sea':
            o += _river(w, 420, 640)
        else:
            o += _river(w, 610, 668)
        o += tree(70, 600, 1.1) + (cau(w - 60, 590, .9) + cau(w - 110, 610, .7) + tre(w - 240, 600, 4, .7) if w > 500 else cau(350, 560, .8))
        o += _front(w, 672)
        if kind == 'night':
            o += '<rect width="%d" height="720" fill="#0C1648" opacity=".62" style="mix-blend-mode:multiply"/><circle cx="%d" cy="96" r="34" fill="#FFF8DC"/>' % (w, w - 240)
            for _ in range(60): o += '<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="#fff"/>' % (R.uniform(2, 5), R.uniform(0, 4), R.randint(0, w), R.randint(0, 220), R.uniform(.7, 1.7))
        _kid[(w, kind)] = o + flock(90, 60, 10, .45) + driftcloud(70, .7, 110, 30, False)
    return '<svg class="%s" style="position:absolute;left:0;top:0" width="%d" height="720" viewBox="0 0 %d 720" aria-hidden="true"><defs>%s</defs>%s</svg>' % (cls, w, w, DEFS, _kid[(w, kind)])

def panel_place(key, dark=False):
    w = 216
    fit = lambda c, sc, x, y: '<g transform="translate(%d %d) scale(%.2f)">%s</g>' % (x, y, sc, c)
    o = _base(w, 160)
    if key == 'review':
        o += yard(116, 500, 96, 18) + tree(44, 478, .9) + _well_q(136, 452, .72) + non(186, 500, '#C7321F')
    elif key == 'courses':
        o += fit(truong(0, 0), .52, 112, 460) + cau(196, 500, .55) + bush(30, 510, .8, '#F2468A')
    elif key in ('practice', 'settings'):
        o += fit(dinh(0, 0), .6, 106, 470) + bush(190, 520, .8, '#F2468A')
    elif key == 'words':
        o += fit(thuvien(0, 0), .78, 106, 440) + tre(166, 530, 3, .55)
    elif key == 'phrases':
        o += '<rect x="20" y="560" width="110" height="8" fill="#6B3E1E"/>' + cau(186, 510, .6) + tree(40, 500, .7)
    elif key == 'pet':
        o += fit(nhatranh(0, 0), .72, 112, 500) + cau(196, 480, .5)
    elif key == 'shop':
        o += fit(leu(0, 0), .9, 62, 470) + fit(leu(0, 0), .9, 158, 520) + non(84, 530) + non(190, 560, '#C7321F', True)
    elif key == 'stats':
        o += fit(thapbut(0, 0), .62, 110, 480) + bush(28, 520, .7)
    else:
        o += tree(84, 480, 1.1) + cau(180, 500, .6)
    o += network(['M-20 590C60 572 150 596 236 576']) + kitsu(108, 590, 84, 'eopen')
    o += _river(w, 628, 684)
    if key == 'phrases': o += '<g class="rock">' + sampan(104, 646, .5) + '</g>'
    o += _front(w, 692) + flock(70, 40, 8, .3) + driftcloud(52, .42, 80, 20, False)
    if dark:
        o += '<rect width="216" height="720" fill="#0C1648" opacity=".55" style="mix-blend-mode:multiply"/><circle cx="160" cy="92" r="26" fill="#FFF8DC"/><circle cx="152" cy="86" r="5" fill="#E6DCB8"/><circle cx="170" cy="100" r="7" fill="#E6DCB8"/>'
        for _ in range(26): o += '<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="#fff"/>' % (R.uniform(2, 5), R.uniform(0, 4), R.randint(0, 216), R.randint(0, 200), R.uniform(.7, 1.7))
    bg_ = '#141A3A' if dark else C['paper']
    o += _edge(w, 0).replace(C['paper'], bg_)
    return '<svg style="display:block" width="216" height="720" viewBox="0 0 216 720" role="img" aria-label="Cảnh %s"><defs>%s</defs>%s</svg>' % (key, DEFS, o)

if __name__ == '__main__':
    r1x('R1Home', 'Làng chữ, bản đồ ban ngày', 'day')
    r1x('R1HomeDusk', 'Làng chữ, hoàng hôn', 'dusk')
    r1x('R1HomeNight', 'Làng chữ, ban đêm', 'night')
    r2(); r3()
    r1x('S1Home', 'Trang chủ, bản đồ làng', 'day')
    r1x('S1HomeDark', 'Trang chủ, ban đêm', 'night')
    print('ok')
