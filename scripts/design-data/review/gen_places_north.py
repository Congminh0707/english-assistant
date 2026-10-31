# Cảnh địa điểm miền Bắc theo chuẩn R5Arrive (docs/22 §12): PSapa, PHanoi, PHalong, PNinhbinh.
#   python gen_places_north.py <project> <vn_merged.json>   (mặc định lấy BOARD_OUT)
# Ảnh tham khảo chỉ để quan sát, không nằm trong repo.
import json, math, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__))
proj = sys.argv[1] if len(sys.argv) > 1 else os.environ['BOARD_OUT']
vnjson = sys.argv[2] if len(sys.argv) > 2 else 'C:/Users/01217/AppData/Local/Temp/vn/vn_merged.json'
sys.argv = ['x', proj, vnjson]
sys.path.insert(0, HERE)
import gen_review2 as G
import place_parts as P
V = G.V
K = '#2A1810'
TAU = math.pi * 2

CSS = """<style>
@keyframes pmist{0%,100%{transform:translateX(-26px)}50%{transform:translateX(26px)}}
@keyframes pleaf{0%{transform:translate(0,-30px) rotate(0);opacity:0}12%{opacity:1}88%{opacity:1}100%{transform:translate(-90px,330px) rotate(420deg);opacity:0}}
@keyframes psail{0%,100%{transform:skewX(-.8deg)}50%{transform:skewX(1deg)}}
@keyframes pglow{0%,100%{opacity:.55}50%{opacity:.95}}
.pmist{animation:pmist var(--t,26s) ease-in-out infinite;animation-delay:var(--d,0s)}
.pleaf{animation:pleaf var(--t,14s) linear infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
.psail{animation:psail 6s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom center}
.pglow{animation:pglow 5s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.pmist,.pleaf,.psail,.pglow{animation:none}}
</style>"""

def base_defs():
    return ('<radialGradient id="hg"><stop offset="0" stop-color="#FFE29A" stop-opacity=".85"/><stop offset=".5" stop-color="#FFC66E" stop-opacity=".3"/><stop offset="1" stop-color="#FFC66E" stop-opacity="0"/></radialGradient>'
            '<filter id="wob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".006 .1" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="20" xChannelSelector="R" yChannelSelector="G"/></filter>'
            '<linearGradient id="pfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>')

def grad(id_, stops, x2=0, y2=1):
    s = ''.join('<stop offset="%s" stop-color="%s"/>' % (o_, c) for o_, c in stops)
    return '<linearGradient id="%s" x1="0" y1="0" x2="%s" y2="%s">%s</linearGradient>' % (id_, x2, y2, s)

def page(pid, title, name, aria, defs, o):
    hud = '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về bản đồ</span><span class="pill">%s</span></div>' % name
    V.write(pid, title, 1280, 720, CSS + '<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="%s"><defs>%s</defs>%s<rect width="1280" height="720" filter="url(#grain)" opacity=".25"/></svg>%s</div>' % (aria, V.DEFS + base_defs() + defs, o, hud))

def smooth(pts, close=''):
    d = 'M%.0f %.0f' % pts[0]
    for i in range(1, len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        d += 'Q%.0f %.0f %.0f %.0f' % (a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    return d + 'L%.0f %.0f' % pts[-1] + close

def reflect(c, axis, H=240, op=.8):
    u, m = V.uid(), V.uid()
    return ('<clipPath id="%s"><rect y="%d" width="1280" height="%d"/></clipPath><mask id="%s" maskUnits="userSpaceOnUse" x="0" y="%d" width="1280" height="%d"><rect y="%d" width="1280" height="%d" fill="url(#pfade)"/></mask>'
            '<g clip-path="url(#%s)"><g mask="url(#%s)"><g filter="url(#wob)" opacity="%.2f"><g transform="translate(0 %d) scale(1 -1)">%s</g></g></g></g>') % (u, axis, 720 - axis, m, axis, H, axis, H, u, m, op, 2 * axis, c)

def ripples(R, n, x0, x1, y0, y1, cols, a=.25, b=.7, L=(14, 60)):
    o = ''
    for _ in range(n):
        y = R.randint(y0, y1); w = R.randint(*L) * (.45 + .55 * (y - y0) / max(1, y1 - y0))
        o += '<path class="lap" style="--t:%.1fs;--d:-%.1fs" d="M%d %dh%d" stroke="%s" stroke-width="2" opacity="%.2f" stroke-linecap="round"/>' % (R.uniform(3, 6), R.uniform(0, 4), R.randint(x0, x1), y, w, R.choice(cols), R.uniform(a, b))
    return o

def sparkle(R, n, x0, x1, y0, y1, cols):
    return ''.join('<ellipse class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" rx="%d" ry="1.2" fill="%s"/>' % (R.uniform(2, 5), R.uniform(0, 4), R.randint(x0, x1), R.randint(y0, y1), R.randint(2, 7), R.choice(cols)) for _ in range(n))

def puff(x, y, w, h, c, R, n=9, cls='pmist', op=.92):
    o = '<g class="%s" style="--t:%ds;--d:-%ds" opacity="%.2f">' % (cls, R.randint(20, 40), R.randint(0, 20), op)
    for k in range(n):
        t = k / (n - 1)
        o += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s"/>' % (x + t * w, y + R.randint(-int(h * .25), int(h * .25)), R.randint(int(w / n * .9), int(w / n * 1.9)), h * (.45 + .55 * math.sin(math.pi * t)) * R.uniform(.7, 1.1), c)
    return o + '</g>'

def fir(x, y, s=1, c=('#1F4A3A', '#2F6A4A')):
    o = '<g transform="translate(%d %d) scale(%.2f)"><rect x="-3" y="-14" width="6" height="16" fill="#3A2A20"/>' % (x, y, s)
    for k in range(5):
        w = 30 - k * 5; yy = -10 - k * 18
        o += '<path d="M%d %dQ0 %d %d %dQ%d %d 0 %dQ%d %d %d %dZ" fill="%s" stroke="#102A22" stroke-width=".8"/>' % (-w, yy, yy + 7, w, yy, w * .5, yy - 12, yy - 28, -w * .5, yy - 12, -w, yy, c[k % 2])
    return o + '</g>'

def ribbon(pts, w0, w1, fill, stroke='none', sw=1.4):
    n = len(pts); a, b = [], []
    for i, (x, y) in enumerate(pts):
        x2, y2 = pts[min(i + 1, n - 1)]; x1, y1 = pts[max(i - 1, 0)]
        dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy) or 1
        w = (w0 + (w1 - w0) * i / (n - 1)) / 2
        a.append((x - dy / L * w, y + dx / L * w)); b.append((x + dy / L * w, y - dx / L * w))
    return '<path d="%s" fill="%s" stroke="%s" stroke-width="%s"/>' % (smooth(a + b[::-1], 'Z'), fill, stroke, sw)

def spline(pts, n=14):
    # Catmull-Rom: điểm dày cho dải đường
    r = []; P = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(P) - 2):
        for j in range(n):
            t = j / n; a, b, c, d = P[i - 1], P[i], P[i + 1], P[i + 2]
            r.append(tuple(.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t ** 3) for k in (0, 1)))
    return r + [pts[-1]]

# ---------- núi đá vôi dùng chung cho Hạ Long, Tràng An ----------
def karst(x, base, w, h, R, fill, flat=False, bumps=None, greens=('#1F5A3A', '#2F7A4A', '#46985A', '#7FC06A'), cliff='#C8C2AC', notch=True):
    if bumps is None:
        bumps = [(.5, .5, 1)] if R.random() < .3 else [(.34, .34, R.uniform(.8, 1)), (.68, .32, R.uniform(.72, 1))]
    p1, p2 = R.uniform(0, TAU), R.uniform(0, TAU)
    def env(t):
        v = 0
        for c, r, hh in bumps:
            u = abs(t - c) / r
            if u < 1: v = max(v, hh * (1 - u ** 2.5) ** .62)
        return v * (1 + .07 * math.sin(t * 19 + p1) + .045 * math.sin(t * 37 + p2))
    n = max(16, int(w / 9)); pts = [(x - w / 2, base)]
    for i in range(1, n):
        t = i / n; pts.append((x - w / 2 + t * w + R.uniform(-3, 3), base - env(t) * h * (1 + R.uniform(-.03, .03))))
    pts.append((x + w / 2, base))
    d = smooth(pts, 'Z')
    if flat: return '<path d="%s" fill="%s"/>' % (d, fill)
    cid = V.uid()
    o = '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="%s"/><g clip-path="url(#%s)">' % (cid, d, d, fill, cid)
    boxes = []
    for _ in range(int(w / 62) + 2):
        cx, top = x - w / 2 + R.random() * w, 0
        t = (cx - x + w / 2) / w; hh = env(t) * h
        if hh < 40: continue
        cy = base - hh * R.uniform(.12, .72); bw, bh = R.uniform(9, 22), R.uniform(12, 38)
        boxes.append((cx, cy, bw, bh))
        o += '<path d="M%.0f %.0fq%.0f %.0f %.0f %.0fl%.0f %.0fq%.0f %.0f %.0f %.0fZ" fill="%s"/>' % (cx - bw, cy - bh, bw, -6, bw * 2, 4, -bw * .3, bh * 2, -bw * .7, 8, -bw * 1.4, -4, R.choice([cliff, '#B5B09A', '#D9D3BE']))
        for k in range(4):
            xx = cx - bw + k * bw * .6
            o += '<path d="M%.0f %.0fv%.0f" stroke="#8A8672" stroke-width="1.5" opacity=".7"/>' % (xx, cy - bh + R.uniform(2, 14), bh * R.uniform(1, 1.8))
    m = int(w * h / 420)
    for c, sz, a in ((greens[0], 9, 0), (greens[1], 7.5, 0), (greens[2], 5.4, -2), (greens[3], 3.4, -4)):
        for _ in range(min(420, m)):
            t = R.random(); hh = env(t) * h
            xx = x - w / 2 + t * w; yy = base - hh + hh * R.random() ** 1.5
            if any(abs(xx - b[0]) < b[2] and abs(yy - b[1]) < b[3] for b in boxes) and R.random() < .86: continue
            o += '<ellipse cx="%.0f" cy="%.0f" rx="%.1f" ry="%.1f" fill="%s"/>' % (xx + a, yy + a, sz * R.uniform(.7, 1.3), sz * R.uniform(.55, .9), c)
    if notch:
        o += '<path d="M%d %dq%d -6 %d -1t%d 0t%d 0V%dH%dZ" fill="#2A3A34" opacity=".72"/>' % (x - w / 2, base - 5, w / 6, w / 3, w / 3, w / 3, base + 2, x - w / 2)
    return o + '</g><path d="%s" fill="none" stroke="#14302A" stroke-width="1.3"/>' % d

def cave(x, base, w, h, R):
    # miệng hang thấp: nhũ đá, trong sáng đèn
    a = 'M%d %dC%d %d %d %d %d %dC%d %d %d %d %d %dZ' % (x - w / 2, base, x - w / 2, base - h * .9, x - w * .3, base - h, x, base - h, x + w * .3, base - h, x + w / 2, base - h * .9, x + w / 2, base)
    cid, gid = V.uid(), V.uid()
    o = '<radialGradient id="%s" cx=".5" cy=".85" r=".8"><stop offset="0" stop-color="#FFD27A"/><stop offset=".4" stop-color="#8A5A2A"/><stop offset="1" stop-color="#1A120C"/></radialGradient><clipPath id="%s"><path d="%s"/></clipPath>' % (gid, cid, a)
    o += '<path d="%s" fill="#D6CFB6" stroke="#6E6A58" stroke-width="10"/><path d="%s" fill="url(#%s)" stroke="#2A2A22" stroke-width="2.4"/><g clip-path="url(#%s)">' % (a, a, gid, cid)
    for k in range(int(w / 7)):
        xx = x - w / 2 + 6 + k * 7; L = R.randint(8, 30)
        yy = base - h * (1 - .8 * ((xx - x) / (w / 2)) ** 2) - 4
        o += '<path d="M%d %dh8l-4 %dZ" fill="%s"/>' % (xx - 4, yy, L, R.choice(['#6E5A3E', '#8A7450', '#4E3E2A']))
    o += '<ellipse class="pglow" cx="%d" cy="%d" rx="%d" ry="%d" fill="#FFE29A" opacity=".7"/></g>' % (x, base - h * .28, w * .2, h * .12)
    return o

# ---------- SA PA ----------
def ridge(R, y, amp, col, peak=None):
    pts = [(-20, 330)]
    for i in range(23):
        x = -20 + i * 60
        h = y + math.sin(i * 1.3 + amp) * amp * .5 + R.uniform(-amp * .3, amp * .3)
        if peak: h -= peak[1] * math.exp(-((x - peak[0]) / peak[2]) ** 2)
        pts.append((x, h))
    pts.append((1300, 330))
    return '<path d="%s" fill="%s"/>' % (smooth(pts, 'Z'), col)

def terraces(cx, cy, rx, ry, n, dy, R, stages, water=.14):
    ph = [R.uniform(0, TAU) for _ in range(3)]
    o = ''; ticks = {}
    for k in range(n):
        t = k / n; sc = 1 - t * .92; yy = cy - k * dy
        pts = []
        for i in range(49):
            a = i / 48 * TAU
            q = 1 + .075 * math.sin(3 * a + ph[0]) + .05 * math.sin(5 * a + ph[1] + t * 1.3) + .028 * math.sin(9 * a + ph[2] + t * 2.2)
            pts.append((cx + math.cos(a) * rx * sc * q, yy + math.sin(a) * ry * sc * q))
        wet = R.random() < water
        col = R.choice(['#BFE0E8', '#D9EEF0']) if wet else R.choice(stages)
        u = V.uid()
        o += '<defs><path id="%s" d="%s"/></defs><use href="#%s" y="5" fill="#7A5A30"/><use href="#%s" fill="%s" stroke="#FFF0B0" stroke-width=".9" stroke-opacity=".7"/>' % (u, smooth(pts, 'Z'), u, u, col)
        if not wet:
            for i in range(0, 49, 2):
                if 0 < pts[i][0] < 1280 and pts[i][1] < 720:
                    c = R.choice(['#C78A1E', '#8FA83A', '#F7E08A'])
                    ticks[c] = ticks.get(c, '') + 'M%.0f %.0fl%d %d' % (pts[i][0] + R.randint(-5, 5), pts[i][1] + R.randint(-5, -1), R.randint(-2, 2), -4)
    return o + ''.join('<path d="%s" stroke="%s" stroke-width="1.2" fill="none" opacity=".75"/>' % (v, c) for c, v in ticks.items())

def hmong_house(x, y, s=1, k=0, smoke=True):
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="2" rx="86" ry="7" fill="#1A2A1A" opacity=".3"/><rect x="-68" y="-10" width="136" height="11" fill="#8A8272" stroke="%s"/>' % (x, y, s, K)
    for i in range(7): o += '<path d="M%d -10v10M%d -5h20" stroke="#5A5448" stroke-width="1"/>' % (-60 + i * 20, -66 + i * 20)
    o += '<rect x="-62" y="-54" width="124" height="44" fill="%s" stroke="%s" stroke-width="1.3"/>' % (['#6B4A30', '#7A5636', '#5E4230'][k % 3], K)
    for i in range(1, 16): o += '<path d="M%d -54v44" stroke="#3E2A1C" stroke-width="1"/>' % (-62 + i * 8)
    o += '<rect x="-13" y="-46" width="26" height="36" fill="#2E1E14" stroke="#1A120C"/><path d="M0 -46v36" stroke="#6B4A30"/><rect x="-46" y="-42" width="20" height="14" fill="#2A1E16" stroke="#C9A464"/><path d="M-36 -42v14M-46 -35h20" stroke="#C9A464"/><rect x="28" y="-42" width="20" height="14" fill="#FFD27A" stroke="#C9A464"/><path d="M38 -42v14M28 -35h20" stroke="#6B4A30"/>'
    o += '<path d="M-82 -48L-44 -92H44L82 -48Z" fill="#5C5650" stroke="#221C18" stroke-width="1.6"/><path d="M-82 -48H82" stroke="#2E2822" stroke-width="3.4"/>'
    for r in range(1, 5):
        yy = -48 - r * 8.8; xl = -82 + r * 7.6
        o += '<path d="M%.0f %.0fH%.0f" stroke="#3A342E" stroke-width="1.1"/>' % (xl, yy, -xl)
        for i in range(int(-xl * 2 / 11)): o += '<path d="M%.0f %.0fv8.8" stroke="#46403A" stroke-width=".8"/>' % (xl + i * 11 + (r % 2) * 5, yy)
    # ngô treo, củi xếp
    o += '<path d="M54 -50q3 16 0 22M58 -50q3 14 0 20" stroke="#E8B93A" stroke-width="4" fill="none" stroke-linecap="round"/>'
    for i in range(4): o += '<ellipse cx="%d" cy="%d" rx="3" ry="3" fill="#A9835A" stroke="#4E3420"/>' % (70 + (i % 2) * 6, -3 - (i // 2) * 6)
    if smoke:
        for i in range(3): o += '<circle class="smoke" style="--d:-%.1fs" cx="-20" cy="-96" r="7" fill="#EDE8DC"/>' % (i * 1.3)
    return o + '</g>'

def hmong(x, y, s=1, scarf='#D9346C', basket=True, skirt='#2A3560'):
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="1" rx="13" ry="3.4" fill="#1A1A10" opacity=".35"/>' % (x, y, s)
    o += '<path d="M-5 -13v12M5 -13v12" stroke="#1E2438" stroke-width="5"/><path d="M-7 -1h6M2 -1h6" stroke="#2A1810" stroke-width="2.4" stroke-linecap="round"/>'
    o += '<path d="M-9 -24L-11 -10H11L9 -24Z" fill="%s" stroke="#141830"/><path d="M-10 -16H10" stroke="#D9346C" stroke-width="2"/><path d="M-10 -13H10" stroke="#F2C25A" stroke-width="1.4"/>' % skirt
    o += '<path d="M-8 -40Q-9 -30 -8 -23H8Q9 -30 8 -40Q0 -44 -8 -40Z" fill="#1E2748" stroke="#101428"/><path d="M0 -41V-24" stroke="#3AA8A0" stroke-width="2"/><path d="M-8 -26H8" stroke="#D9346C" stroke-width="2.6"/>'
    o += '<path d="M-8 -38Q-12 -30 -9 -22M8 -38Q12 -30 9 -22" stroke="#1E2748" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cy="-48" r="5.6" fill="#D9A070" stroke="#3A2413" stroke-width=".7"/><circle cx="2" cy="-48" r=".8" fill="#222"/>'
    o += '<path d="M-7 -49Q-8 -58 0 -58Q8 -58 7 -49Q0 -53 -7 -49Z" fill="%s" stroke="#6E1438"/><path d="M-6 -54H6M-6 -51H6" stroke="#F2C25A" stroke-width="1"/>' % scarf
    if basket:
        o += '<path d="M-22 -44H-7L-9 -18H-20Z" fill="#C9A464" stroke="#6B4322"/><path d="M-21 -38H-8M-20 -32H-8M-20 -26H-9M-16 -44V-18M-12 -44V-18" stroke="#8F6A28" stroke-width=".8"/><path d="M-7 -42L-2 -38" stroke="#6B4322" stroke-width="1.4"/><ellipse cx="-14" cy="-44" rx="8" ry="2.4" fill="#4FA050" stroke="#6B4322"/>'
    return o + '</g>'

def sapa():
    R = random.Random(11); G.Rr.seed(11)
    d = grad('sSky', [(0, '#2B4C93'), (.4, '#6E93CC'), (.72, '#F4B78C'), (1, '#FFE3A6')]) + grad('sPad', [(0, '#F7D9A6'), (.45, '#BFD8E8'), (1, '#7FA8D0')])
    o = '<rect width="1280" height="340" fill="url(#sSky)"/>'
    o += '<circle cx="1020" cy="128" r="150" fill="url(#hg)"/><circle cx="1020" cy="128" r="26" fill="#FFF3C8"/>'
    for i in range(12):
        a = i / 12 * TAU; o += '<path class="tw" style="--t:6s;--d:-%ds" d="M%d %dL%d %d" stroke="#FFF3C8" stroke-width="2" opacity=".5"/>' % (i, 1020 + math.cos(a) * 42, 128 + math.sin(a) * 42, 1020 + math.cos(a) * 84, 128 + math.sin(a) * 84)
    for x, y, w_, h_, c_ in [(160, 70, 320, 16, '#F7C4B0'), (560, 104, 260, 12, '#FFD8B8'), (760, 52, 300, 14, '#F2B4B8'), (300, 140, 220, 10, '#FFD0A8')]:
        o += '<ellipse class="drift" style="--t:320s;--d:-%ds" cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" opacity=".8"/>' % (x % 40, x, y, w_ / 2, h_, c_)
    # núi xa, biển mây lớp lớp
    o += ridge(R, 214, 40, '#8EA0CE', (760, 96, 150)) + puff(-40, 244, 1360, 22, '#FFE9D2', R, 16)
    o += ridge(R, 238, 34, '#6A83B4', (1060, 70, 170)) + puff(-40, 268, 1360, 26, '#FFF3E0', R, 16)
    o += ridge(R, 268, 26, '#4A7090', (210, 60, 200)) + puff(-40, 292, 1360, 26, '#FFF7E8', R, 16)
    o += '<rect y="312" width="1280" height="260" fill="#5E8E62"/>' + puff(280, 322, 760, 20, '#FFF7E8', R, 10, op=.8)
    o += V.flock(120, 70, 8, .4)
    # sườn ruộng bậc thang
    st = ['#E8B93A', '#F2CC52', '#D9A92A', '#EFC545', '#C7C24A', '#9CC24A']
    o += terraces(1080, 520, 430, 170, 24, 9, R, st)
    o += terraces(230, 560, 540, 200, 28, 9, R, st)
    for x, y, s_ in [(1044, 306, .7), (1090, 312, .9), (1130, 304, .66), (1190, 318, .8), (980, 322, .62), (1250, 330, .84)]: o += fir(x, y, s_)
    for x, y, s_ in [(150, 312, .8), (205, 306, .9), (262, 314, .7), (96, 326, .62), (320, 328, .66)]: o += fir(x, y, s_)
    # lều canh ruộng trên sườn
    o += '<g transform="translate(936 408) scale(.42)">' + V.thatch(0, -40, 90, 40) + '<path d="M-30 -40V0M30 -40V0" stroke="#5A3A20" stroke-width="5"/></g>'
    # đồi giữa + bản làng
    o += puff(470, 366, 360, 16, '#FFF7E8', R, 8, op=.72)
    o += terraces(650, 480, 300, 92, 10, 7, R, ['#9CC24A', '#AFCF56', '#C7C24A'], water=.2)
    for x, y, s_ in [(528, 396, .86), (786, 392, .8), (458, 428, .7), (850, 428, .7)]: o += fir(x, y, s_, ('#254F3A', '#34754C'))
    o += V.tre(430, 462, 5, .6)
    o += hmong_house(590, 412, .62, 1) + hmong_house(720, 408, .66, 0) + hmong_house(650, 450, .88, 2)
    o += '<path d="M770 450q40 6 66 -2M770 456q40 6 66 -2" stroke="#6B4A30" stroke-width="2" fill="none"/>'
    for i in range(7): o += '<path d="M%d %dv14" stroke="#5A3A20" stroke-width="2.4"/>' % (772 + i * 11, 444 + (i % 3))
    # ruộng nước tiền cảnh phải, soi trời
    pad = 'M820 730C790 640 760 580 742 528C900 556 1100 556 1290 532V730Z'
    cp = V.uid()
    o += '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="url(#sPad)" stroke="#6B4A28" stroke-width="5"/><g clip-path="url(#%s)">' % (cp, pad, pad, cp)
    o += reflect(terraces(1040, 560, 300, 120, 12, 7, random.Random(4), st, 0).replace('stroke-opacity=".7"', 'stroke-opacity=".3"'), 536, 170, .5)
    o += ripples(R, 60, 760, 1270, 546, 716, ['#fff', '#FFE9C8', '#BFE0E8'])
    tufts = ''
    for r_ in range(9):
        for i in range(19):
            x = 800 + i * 26 + (r_ % 2) * 12; y = 566 + r_ * 18
            tufts += 'M%d %dl-3 -7M%d %dv-9M%d %dl3 -7' % (x, y, x, y, x, y)
    o += '<path d="%s" stroke="#4FA050" stroke-width="1.5" fill="none" opacity=".85"/></g>' % tufts
    o += '<path d="%s" fill="none" stroke="#8A6A3A" stroke-width="3"/><path d="M900 546L1000 730" stroke="#8A6A3A" stroke-width="8"/><path d="M904 545L1004 729" stroke="#B9935A" stroke-width="2.4"/>' % pad
    # bờ cỏ + đường đất uốn lên bản
    o += '<path d="M-10 594C200 566 420 524 548 462L742 470C746 520 780 620 830 730H-10Z" fill="#7FA84A" stroke="#4E7A32" stroke-width="1.5"/>'
    for _ in range(420):
        x, y = R.randint(0, 800), R.randint(470, 716)
        if y > 594 - x * .2 or x > 500:
            o += '<path d="M%d %dl%d -%d" stroke="%s" stroke-width="1.6"/>' % (x, y, R.randint(-3, 3), R.randint(5, 10), R.choice(['#5E8A38', '#A2C45A', '#4E7A32']))
    rp = spline([(-60, 776), (110, 716), (250, 668), (420, 610), (520, 540), (610, 486), (652, 456)])
    o += ribbon(rp, 150, 16, '#6B4A2A') + ribbon(rp, 140, 12, '#C49A62')
    for i in range(0, len(rp), 2):
        x, y = rp[i]; w_ = 62 * (1 - i / len(rp)) + 3
        for _ in range(3): o += '<ellipse cx="%d" cy="%d" rx="%.1f" ry="%.1f" fill="%s"/>' % (x + R.uniform(-w_, w_), y + R.uniform(-w_ / 3, w_ / 3), R.uniform(1.5, 6) * (w_ / 40 + .4), R.uniform(1, 2.4) * (w_ / 40 + .4), R.choice(['#9A7648', '#D9B684', '#8A6A40']))
    o += fir(46, 596, 2) + fir(-10, 640, 2.5) + V.tre(762, 566, 5, .6)
    for x, y in [(120, 640), (170, 618), (640, 620), (700, 670), (560, 660), (760, 700)]:
        for k in range(5): o += '<circle cx="%d" cy="%d" r="%.1f" fill="%s"/>' % (x + R.randint(-20, 20), y + R.randint(-8, 8), R.uniform(2, 3.6), R.choice(['#F2C25A', '#F268A6', '#fff']))
    # người, trâu, thú cưng
    o += hmong(560, 516, .88, '#D9346C') + hmong(590, 526, .92, '#2FB8C6', basket=False) + hmong(470, 596, 1.14, '#E0483A')
    o += '<g transform="translate(676 618) scale(1.1)">' + V.trau(0, 0) + '</g>'
    o += V.kitsu(292, 660, 92, 'ehappy', 'walk')
    for t_, x, y, dn in [('Núi mây', 760, 86, True), ('Ruộng bậc thang', 214, 400, True), ('Bản làng', 650, 318, False), ('Trâu', 676, 512, False), ('Ruộng nước', 1090, 620, False)]:
        o += G.bubble(x, y, t_, dn)
    page('PSapa', 'Kids World, Sa Pa bình minh', 'Sa Pa', 'Sa Pa lúc bình minh: ruộng bậc thang, bản làng, núi trong biển mây', d, o)

# ---------- HÀ NỘI ----------
def arch(x, y, w, h, c='#2E2A24'):
    return '<path d="M%.1f %.1fV%.1fQ%.1f %.1f %.1f %.1fQ%.1f %.1f %.1f %.1fV%.1fZ" fill="%s" stroke="#6E6650" stroke-width="1.5"/>' % (x - w / 2, y, y - h * .55, x - w / 2, y - h * .86, x, y - h, x + w / 2, y - h * .86, x + w / 2, y - h * .55, y, c)

def thaprua(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    def tier(w, h, b, n, aw, ah):
        p = '<rect x="%d" y="%d" width="%d" height="%d" fill="url(#hWall)" stroke="#5E5844" stroke-width="1.5"/>' % (-w / 2, b - h, w, h)
        for i in range(n):
            ax = -w / 2 + w * (i + .5) / n
            p += arch(ax, b - 3, aw, ah)
        for k in range(10):
            p += '<path d="M%d %dv%d" stroke="#7E7860" stroke-width="%.1f" opacity=".35"/>' % (-w / 2 + (k * 37) % w, b - h + 4 + k % 5, 8 + k * 2, 1 + k % 3)
        p += '<rect x="%d" y="%d" width="%d" height="6" fill="#B9AE8C" stroke="#5E5844"/><path d="M%d %dh%dl6 -5h%dZ" fill="#8A8468" stroke="#5E5844"/>' % (-w / 2 - 5, b - h - 3, w + 10, -w / 2 - 12, b - h + 1, w + 24, -w - 12)
        return p
    o += '<rect x="-66" y="-10" width="132" height="10" fill="#A79C7C" stroke="#5E5844"/>'
    o += tier(116, 76, -10, 3, 26, 52) + tier(84, 56, -88, 2, 22, 38)
    for i in range(9): o += '<rect x="%d" y="-96" width="6" height="8" fill="#B9AE8C" stroke="#5E5844" stroke-width=".8"/>' % (-48 + i * 12)
    o += tier(56, 44, -146, 1, 16, 24)
    o += '<circle cy="-167" r="6" fill="#2E2A24" stroke="#6E6650" stroke-width="1.4"/>'
    o += '<path d="M-36 -192Q0 -188 36 -192L24 -204Q0 -222 -24 -204Z" fill="#8A7E5E" stroke="#4E4834" stroke-width="1.6"/><path d="M-36 -192l-5 -7M36 -192l5 -7" stroke="#4E4834" stroke-width="3" stroke-linecap="round"/><path d="M0 -214v-16" stroke="#4E4834" stroke-width="3"/><circle cy="-232" r="4.4" fill="#C9A464" stroke="#4E4834"/>'
    return o + '</g>'

def lotree(x, y, s, cols):
    o = ''
    for c, n, r in ((cols[0], 22, 22), (cols[1], 20, 16), (cols[2], 14, 10)):
        for _ in range(n):
            a = G.Rr.random() * TAU; q = math.sqrt(G.Rr.random())
            o += '<circle cx="%.0f" cy="%.0f" r="%.1f" fill="%s"/>' % (x + math.cos(a) * q * 50 * s, y - 56 * s + math.sin(a) * q * 40 * s - (0 if c == cols[0] else 5 * s), r * s * G.Rr.uniform(.6, 1), c)
    return '<path d="M%d %dv%d" stroke="#3A2A20" stroke-width="%.1f"/>' % (x, y, -46 * s, 7 * s) + o

def willow(x, y, s=1):
    o = '<path d="M%d %dq%d %d %d %d" stroke="#4A3A2A" stroke-width="%.1f" fill="none"/>' % (x, y, 6 * s, -60 * s, -6 * s, -130 * s, 9 * s)
    for a_ in range(170):
        t = G.Rr.random(); xx = x - 80 * s + t * 160 * s; yy = y - 130 * s - 34 * s * math.sin(t * math.pi) + G.Rr.uniform(0, 44) * s
        o += '<ellipse cx="%.0f" cy="%.0f" rx="%.0f" ry="%.0f" fill="%s"/>' % (xx, yy, 7 * s, 5 * s, G.Rr.choice(['#6E9A3A', '#8FB84A', '#5A8A38', '#A2C45A']))
    for i in range(48):
        xx = x - 80 * s + i * 3.4 * s; top = y - 150 * s + abs(i - 24) ** 1.5 * .8 * s; L = 74 + (i * 37) % 54
        o += '<path class="sway" style="--t:%.1fs;--d:-%ds;transform-origin:%dpx %dpx" d="M%d %dq%d %d %d %d" stroke="%s" stroke-width="2.4" fill="none" stroke-dasharray="6 1"/>' % (4 + i % 3, i % 4, xx, top, xx, top, -4 + i % 8, L * s / 2, -2 + i % 5, L * s, ['#7FA83A', '#A2C45A', '#5E8A38'][i % 3])
    return o

def ngocson(x, base):
    # cổng lầu hai tầng + nhà đền sau lùm cây; nơi thờ tự: trang trọng, không người, không chữ
    o = '<g transform="translate(%d %d)">' % (x, base)
    o += '<rect x="-150" y="-52" width="130" height="30" fill="#6E2A20" stroke="%s"/>' % K
    for i in range(7): o += '<rect x="%d" y="-52" width="5" height="30" fill="#8F2F24"/>' % (-146 + i * 20)
    o += V.roofv(-85, -50, 160, 24, '#7E6A52', '#463A2C', curl=8)
    o += '<rect x="-34" y="-46" width="68" height="46" fill="#BDB08C" stroke="%s" stroke-width="1.3"/>' % K
    o += '<path d="M-15 0V-22Q-15 -38 0 -38Q15 -38 15 -22V0Z" fill="#2A1E16" stroke="#4E4834" stroke-width="2"/>'
    for sg in (-1, 1): o += '<rect x="%d" y="-44" width="11" height="22" fill="#5E7E86" stroke="#3A4A4E"/><path d="M%d -40v14" stroke="#C9A464" stroke-width="1"/>' % (sg * 25 - 5.5, sg * 25)
    o += V.roofv(0, -46, 88, 14, '#7E6A52', '#463A2C', curl=8)
    o += '<rect x="-24" y="-82" width="48" height="26" fill="#C9B890" stroke="%s" stroke-width="1.2"/><circle cy="-69" r="8" fill="#2A1E16" stroke="#4E4834" stroke-width="2"/><path d="M-8 -69H8M0 -77V-61" stroke="#C9A464" stroke-width="1"/>' % K
    o += V.roofv(0, -80, 66, 22, '#7E6A52', '#463A2C', curl=8) + '<circle cy="-104" r="3.4" fill="#C9A464" stroke="#4E4834"/>'
    for sg in (-1, 1): o += '<path d="M%d -92q%d -8 %d -4" stroke="#463A2C" stroke-width="3" fill="none" stroke-linecap="round"/>' % (sg * 24, sg * 6, sg * 10)
    return o + '</g>'

def thehuc(R):
    A, B = (262, 340), (664, 604)
    N = 44
    def at(t):
        cx = A[0] + (B[0] - A[0]) * t ** 1.2; cy = A[1] + (B[1] - A[1]) * t ** 1.5
        hw = 7 + t * 34; rise = 8 + t * 10 + 26 * math.sin(math.pi * t ** .8) * (.45 + .55 * t)
        return cx, cy, hw, rise
    far, near, deck = [], [], []
    for i in range(N + 1):
        cx, cy, hw, r_ = at(i / N)
        far.append((cx + hw * .62, cy - r_ - hw * .5)); near.append((cx - hw * .62, cy - r_ + hw * .5))
    rf = ''
    o = ''
    def legs(side):
        p = ''; q = ''
        for i in range(0, 25):
            t = i / 24 + .004; cx, cy, hw, r_ = at(t)
            s_ = .4 + t * .9
            x = cx + side * hw * .62; yt = cy - r_ + (-side) * hw * .5; yb = cy + (-side) * hw * .5
            p += '<path d="M%.0f %.0fL%.0f %.0f" stroke="#7E1A14" stroke-width="%.1f"/><path d="M%.1f %.0fL%.1f %.0f" stroke="#D9402E" stroke-width="%.1f"/>' % (x, yt, x + side * 3 * s_, yb, 6 * s_, x - 1, yt, x + side * 3 * s_ - 1, yb, 2.6 * s_)
            q += '<path d="M%.0f %.0fv%.0f" stroke="#C8281E" stroke-width="%.1f"/>' % (x, yb, (yb - yt) * 1.5, 6 * s_)
        return p, q
    pf, qf = legs(1); pn, qn = legs(-1)
    rf = '<g filter="url(#wob)" opacity=".62">' + qf + qn + '</g>'
    o += rf + pf
    o += '<path d="%s" fill="#A85A3A" stroke="#6E1A14" stroke-width="2"/>' % smooth(far + near[::-1], 'Z')
    for i in range(1, N, 1):
        o += '<path d="M%.0f %.0fL%.0f %.0f" stroke="#7E3A24" stroke-width=".9" opacity=".7"/>' % (far[i][0], far[i][1], near[i][0], near[i][1])
    def rail(e, h0, h1, side):
        p = ''
        L = len(e) - 1
        top = [(x, y - (h0 + (h1 - h0) * i / L)) for i, (x, y) in enumerate(e)]
        for i in range(0, L + 1, 2):
            x, y = e[i]; yt = top[i][1]; s_ = .55 + 1.1 * i / L
            p += '<path d="M%.0f %.0fV%.0f" stroke="#C8281E" stroke-width="%.1f"/>' % (x, y, yt - 2 * s_, 3.4 * s_) + '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#E2432E" stroke="#7E1A14" stroke-width=".7"/>' % (x - 2.6 * s_, yt - 4 * s_, 5.2 * s_, 3.4 * s_)
        p += '<path d="%s" stroke="#7E1A14" stroke-width="5" fill="none"/><path d="%s" stroke="#E2432E" stroke-width="3.4" fill="none"/>' % (smooth(top), smooth(top))
        mid = [(x, (y + t_[1]) / 2) for (x, y), t_ in zip(e, top)]
        return p + '<path d="%s" stroke="#D9402E" stroke-width="2.4" fill="none"/>' % smooth(mid)
    o += rail(far, 7, 22, 1) + pn + rail(near, 7, 24, -1)
    return o

def tube(x, base, w, h, wall, k=0, shop=None):
    o = '<g transform="translate(%d %d)"><rect x="0" y="%d" width="%d" height="%d" fill="%s" stroke="%s" stroke-width="1.4"/>' % (x, base, -h, w, h, wall, K)
    G.Rr.random()
    for _ in range(8): o += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="#7A6238" opacity=".14"/>' % (G.Rr.randint(4, w - 4), -G.Rr.randint(50, h - 4), G.Rr.randint(5, 16), G.Rr.randint(4, 12))
    # mái ngói, tường hồi
    o += '<path d="M%d %dL%d %dL%d %dL%d %dZ" fill="#8F4E30" stroke="%s" stroke-width="1.4"/>' % (-6, -h, 8, -h - 22, w - 8, -h - 22, w + 6, -h, K)
    for i in range(1, 5): o += '<path d="M%d %dH%d" stroke="#6E3522" stroke-width="1"/>' % (i * 1.6 - 5, -h - i * 4.4, w + 5 - i * 1.6)
    floors = (h - 64) // 62
    for f in range(floors):
        yy = -h + 16 + f * 62
        o += '<rect x="%d" y="%d" width="%d" height="46" fill="#2E6A5A" stroke="#143A32" stroke-width="1.2"/>' % (w * .2, yy, w * .6)
        for j in range(8): o += '<path d="M%.0f %dH%.0f" stroke="#143A32" stroke-width=".9"/>' % (w * .2, yy + 3 + j * 6, w * .8)
        o += '<path d="M%d %dv46" stroke="#143A32" stroke-width="1.6"/><path d="M%d %dh%d" stroke="#3A2A20" stroke-width="3"/>' % (w / 2, yy, w * .12, yy + 48, w * .76)
        for j in range(5): o += '<path d="M%.0f %dv-12" stroke="#3A2A20" stroke-width="1.1"/>' % (w * .14 + j * w * .18, yy + 48)
        for j in range(4): o += '<circle cx="%.0f" cy="%d" r="3.4" fill="%s"/>' % (w * .22 + j * w * .19, yy + 44, ['#E8418F', '#2FA860', '#F2C25A', '#D9402E'][(j + f) % 4])
    # tầng trệt: cửa hàng + mái che sọc
    o += '<rect x="%.0f" y="-54" width="%.0f" height="54" fill="#3A2A1E" stroke="#1A120C"/><path d="M4 -58H%dL%d -42H-4Z" fill="%s" stroke="%s"/>' % (4, w - 8, w - 4, w + 4, ['#D9402E', '#2E6A5A', '#E8B23E'][k % 3], K)
    for i in range(0, int(w), 12): o += '<path d="M%d -58l-2 16" stroke="#fff" stroke-width="3" opacity=".55"/>' % (i + 6)
    for i in range(int((w - 12) / 13)):
        o += '<circle cx="%d" cy="-28" r="4.6" fill="%s"/><circle cx="%d" cy="-14" r="4.6" fill="%s"/>' % (11 + i * 13, ['#F2C25A', '#D9402E', '#7FD45A'][i % 3], 11 + i * 13, ['#2FB8C6', '#F268A6', '#F2C25A'][i % 3])
    if shop: o += G.sign(w * .12, -78, w * .76, shop)
    return o + '</g>'

def hanoi():
    R = random.Random(21); G.Rr.seed(21)
    d = grad('hSky', [(0, '#5A8EC6'), (.5, '#A9C8DC'), (.8, '#F8DDAE'), (1, '#FFCB8C')]) + grad('hWat', [(0, '#E6C98E'), (.18, '#9FB382'), (.6, '#5E8E72'), (1, '#3A6E5E')]) + grad('hWall', [(0, '#D6CCAC'), (.6, '#BDB290'), (1, '#9A9274')])
    o = '<rect width="1280" height="300" fill="url(#hSky)"/><circle cx="1080" cy="200" r="200" fill="url(#hg)"/>'
    for x, y, w_, h_ in [(200, 90, 320, 22), (640, 60, 340, 18), (960, 118, 260, 14), (460, 150, 200, 12)]:
        o += '<ellipse class="drift" style="--t:300s;--d:-%ds" cx="%d" cy="%d" rx="%d" ry="%d" fill="#FFF3DC" opacity=".85"/>' % (x % 40, x, y, w_ / 2, h_)
    far = ''
    for x in range(-10, 1290, 62):
        h_ = R.randint(34, 86); wc = R.choice(['#D9C6A0', '#C9B48E', '#E0CFA8', '#BCA98A'])
        far += '<rect x="%d" y="%d" width="%d" height="%d" fill="%s" opacity=".85"/><path d="M%d %dL%d %dL%d %dZ" fill="#9A6A4E" opacity=".85"/>' % (x, 280 - h_, 54, h_, wc, x - 4, 280 - h_, x + 27, 280 - h_ - 15, x + 58, 280 - h_)
        for j in range(h_ // 18): far += '<rect x="%d" y="%d" width="30" height="7" fill="#8A7E68" opacity=".6"/>' % (x + 12, 288 - h_ + j * 16)
    for x in range(-20, 1300, 44): far += lotree(x, 292, R.uniform(.5, .78), R.choice([('#4F8A52', '#6FA85A', '#A2C45A'), ('#5E9458', '#88B052', '#C2CE5E'), ('#6E9A4C', '#C9B24A', '#E8B23E')]))
    far += '<rect y="284" width="1280" height="10" fill="#6E7E5A"/>'
    o += far
    o += '<rect y="292" width="1280" height="340" fill="url(#hWat)"/>'
    o += reflect(far, 292, 150, .62)
    # đảo Tháp Rùa
    tw = '<ellipse cx="824" cy="430" rx="150" ry="16" fill="#6FA84A" stroke="#46753A"/><ellipse cx="824" cy="426" rx="130" ry="10" fill="#8FC254"/>' + thaprua(824, 428, 1.02)
    for x, s_ in ((694, .36), (940, .4)): tw += lotree(x, 428, s_, ('#3E7A4A', '#5E9A52', '#88B85A'))
    o += reflect(tw, 438, 250, .72) + tw
    o += '<path d="M672 438Q824 452 976 438" stroke="#3E6A3A" stroke-width="3" fill="none"/>'
    # đảo Ngọc Sơn: lùm cây, đền, kè đá
    isl = '<path d="M-10 276H330Q356 310 330 350H-10Z" fill="#4E6A3E"/>'
    for x, y, s_ in [(14, 270, 1.3), (70, 258, 1.15), (130, 262, 1.2), (312, 280, 1.15), (352, 306, .95), (262, 250, 1.05)]:
        isl += lotree(x, y, s_, ('#2F6A42', '#4F8F4C', '#7FB452'))
    isl += ngocson(232, 344)
    for x, y, s_ in [(-6, 346, .9), (38, 348, .8), (306, 348, .74), (348, 346, .6)]: isl += lotree(x, y, s_, ('#3E7A4A', '#5E9A52', '#A2C45A'))
    isl += '<path d="M-10 344H362L374 356H-10Z" fill="#9A9078" stroke="#4E4834"/>'
    for i in range(16): isl += '<path d="M%d 345v10" stroke="#6E6650"/>' % (i * 25)
    o += reflect(isl, 356, 200, .72) + isl
    o += thehuc(R)
    o += ripples(R, 130, 0, 1040, 300, 620, ['#fff', '#FFE9B8', '#CFE3C8', '#E6C98E'], .2, .55)
    o += sparkle(R, 60, 380, 1030, 300, 600, ['#FFE9B8', '#fff'])
    for x, y in ((420, 548), (140, 470), (96, 500), (960, 560), (1010, 520)): o += V.lotusleaf(x, y, 13)
    # BỜ HỒ + PHỐ CỔ bên phải, xa nhỏ dần
    land = 'M-10 632C240 616 500 606 640 602C820 596 940 520 1000 452L1290 410V730H-10Z'
    o += '<path d="M-10 620C240 604 500 594 640 590C810 584 930 510 994 444" fill="none" stroke="#7E7A64" stroke-width="10"/>'
    o += '<path d="%s" fill="#B5AC96" stroke="#5E5844" stroke-width="2"/>' % land
    cl = V.uid()
    o += '<clipPath id="%s"><path d="%s"/></clipPath><g clip-path="url(#%s)">' % (cl, land, cl)
    yy, row = 400, 0
    while yy < 730:
        h_ = 8 + (yy - 400) * .05; xx = -30 - (row % 2) * 18
        while xx < 1290:
            w_ = 34 + R.randint(0, 12) + (yy - 400) * .12
            o += '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" rx="1" fill="%s" stroke="#8A8270" stroke-width=".8"/>' % (xx, yy, w_ - 1, h_ - 1, R.choice(['#C4BCA6', '#B9B09A', '#CDC5AE', '#AFA690']))
            xx += w_
        yy += h_; row += 1
    o += '</g><path d="M-10 632C240 616 500 606 640 602C820 596 940 520 1000 452" fill="none" stroke="#E6DEC6" stroke-width="5"/>'
    # bậc đá chân cầu
    o += '<path d="M612 590L706 572L724 604L640 618Z" fill="#CFC7B0" stroke="#5E5844" stroke-width="1.6"/><path d="M620 598L712 582M628 608L718 592" stroke="#8A8270" stroke-width="1.4"/>'
    for x, y in ((628, 566), (716, 548)): o += '<rect x="%d" y="%d" width="13" height="42" fill="#C8281E" stroke="#7E1A14" stroke-width="1.4"/><path d="M%d %dh19l-3 -7h-13Z" fill="#7E6A52" stroke="#463A2C"/>' % (x - 6, y, x - 9, y)
    # dãy nhà ống: scale tăng về mép phải
    for x, b_, s_, w_, h_, c_, k, nm in [(972, 454, .46, 80, 200, '#E8B23E', 0, None), (1008, 448, .56, 80, 240, '#E3C47A', 1, None), (1050, 446, .68, 84, 210, '#D9A24A', 2, 'Trà đá'), (1104, 444, .84, 80, 250, '#E8C25A', 0, None), (1168, 444, 1.04, 84, 230, '#DDB05A', 1, 'Phở'), (1250, 448, 1.3, 84, 260, '#E8B23E', 2, None)]:
        o += '<g transform="translate(%d %d) scale(%.2f)">%s</g>' % (x, b_, s_, tube(0, 0, w_, h_, c_, k, nm))
    # lộc vừng khung trái trên, liễu bờ hồ, ghế, đèn
    o += willow(92, 626, 1.5) + willow(404, 616, .8)
    o += '<g><rect x="798" y="572" width="5" height="60" fill="#2A2A3A"/><circle cx="800" cy="566" r="9" fill="#FFF3C8" stroke="#2A2A3A" stroke-width="2"/></g>'
    o += '<g transform="translate(250 616)"><rect x="-44" y="-22" width="88" height="6" fill="#7A4A2A" stroke="#3A2413"/><rect x="-44" y="-12" width="88" height="5" fill="#8F5A2E" stroke="#3A2413"/><path d="M-36 -8V0M36 -8V0" stroke="#2A2A3A" stroke-width="4"/></g>'
    o += G.walker(226, 610, '#E6E0D0', '#D8D4CC', s=.96) + G.walker(262, 612, '#2E6A5A', '#D8D4CC', s=.92)
    # xe đạp bán hoa
    o += '<g transform="translate(676 694) scale(1.2)">' + V.non(0, 0, '#F268A6') + '</g><g transform="translate(610 690) scale(1.5)">' + G.bike(0, 0, '#2E6A5A') + '<path d="M-30 -24h26l-3 8h-20Z" fill="#C9A464" stroke="#6B4322"/>' + ''.join('<circle cx="%d" cy="%d" r="%.1f" fill="%s"/>' % (R.randint(-28, -6), R.randint(-34, -22), R.uniform(2, 3.6), R.choice(['#E8418F', '#F268A6', '#fff', '#F2C25A'])) for _ in range(36)) + '</g>'
    o += '<g transform="translate(980 570) scale(1.2)">' + V.non(0, 0, '#E86AA8', True) + '</g>'
    o += P.xichlo(910, 688, 1.2)
    o += V.kitsu(500, 690, 92, 'ehappy', 'walk')
    o += G.walker(1150, 610, '#D9402E', s=1.2) + G.walker(1196, 640, '#2FB8C6', '#7A4A2A', s=1.34)
    # quán trà đá ghế nhựa đỏ
    for x, y in ((1014, 500), (1056, 508), (1036, 522)): o += '<path d="M%d %dh18l3 14h-3l-2 -9h-14l-2 9h-3Z" fill="#D9402E" stroke="#7E1A14"/>' % (x, y)
    o += '<rect x="1020" y="492" width="44" height="6" fill="#8F5A2E" stroke="#3A2413"/><path d="M1026 498v14M1058 498v14" stroke="#3A2413" stroke-width="2"/><rect x="1032" y="482" width="8" height="10" fill="#FFE29A" stroke="#6B4322"/><rect x="1044" y="482" width="8" height="10" fill="#FFE29A" stroke="#6B4322"/>'
    # cành khung trên và lá vàng rơi
    o += '<path d="M-10 94C120 76 240 102 360 66M120 86Q150 136 200 148M250 90Q290 120 340 124M60 90Q70 126 40 156" stroke="#3A2A20" stroke-width="5" fill="none" stroke-linecap="round"/>'
    for _ in range(190):
        t = R.random(); x = -10 + t * 370; y = 66 + R.uniform(0, 80) + 16 * math.sin(t * 8)
        o += '<ellipse cx="%d" cy="%d" rx="6" ry="3.4" fill="%s" transform="rotate(%d %d %d)"/>' % (x, y, R.choice(['#E8922E', '#E2B23A', '#C8461E', '#A2B83E', '#D9602A']), R.randint(0, 180), x, y)
    for i in range(9):
        o += '<ellipse class="pleaf" style="--t:%ds;--d:-%ds" cx="%d" cy="%d" rx="5" ry="3" fill="%s"/>' % (12 + i, i * 2, 100 + i * 42, 120, ['#E8922E', '#E2B23A', '#C8461E'][i % 3])
    for t_, x, y, dn in [('Tháp Rùa', 824, 160, True), ('Đền Ngọc Sơn', 232, 196, True), ('Cầu Thê Húc', 610, 344, False), ('Phố cổ', 1120, 130, False), ('Xích lô', 880, 530, False)]:
        o += G.bubble(x, y, t_, dn)
    page('PHanoi', 'Kids World, Hà Nội chiều thu', 'Hà Nội', 'Hồ Gươm chiều thu: Tháp Rùa, cầu Thê Húc đỏ, đền Ngọc Sơn, phố cổ', d, o)

# ---------- HẠ LONG ----------
def junk(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    def sail(cx, h, w):
        cid = V.uid()
        d_ = 'M%d %dQ%d %d %d %dQ%d %d %d 0Q%d 8 %d 0Z' % (cx - w * .32, -h + 12, cx + w * .1, -h - 12, cx + w * .42, -h + 2, cx + w * .62, -h * .5, cx + w * .56, cx, cx - w * .44)
        p = '<g class="psail"><clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="url(#jSail)" stroke="#6E1A10" stroke-width="2"/><g clip-path="url(#%s)">' % (cid, d_, d_, cid)
        for i in range(1, 9):
            yy = -h + i * h / 9
            p += '<path d="M%d %dQ%d %d %d %d" stroke="#6E1A10" stroke-width="1.8" fill="none"/><path d="M%d %dQ%d %d %d %d" stroke="#F7A06A" stroke-width="1" fill="none" opacity=".7"/>' % (cx - w * .6, yy + 6, cx, yy + 12, cx + w * .7, yy - 6, cx - w * .6, yy + 9, cx, yy + 15, cx + w * .7, yy - 3)
        for f in (-.36, -.12, .12, .34): p += '<path d="M%d 0L%d %d" stroke="#6E1A10" stroke-width=".9" opacity=".5"/>' % (cx + f * w, cx + f * .4 * w, -h)
        return p + '</g></g>'
    # thân thuyền trước, buồm sau
    o += '<path d="M-70 -30V-226M64 -30V-190M-136 -24V-110" stroke="#3A2010" stroke-width="5"/>'
    o += sail(-72, 190, 150) + sail(62, 158, 130) + sail(-138, 84, 60)
    o += '<path d="M-70 -226v-16l18 6l-18 6" fill="#D9402E" stroke="#6E1A10"/>'
    o += '<rect x="-112" y="-34" width="176" height="28" fill="#B9662A" stroke="#3A1E10" stroke-width="1.4"/>'
    for i in range(9): o += '<rect x="%d" y="-29" width="13" height="14" fill="#FFE29A" stroke="#5A2A10"/>' % (-106 + i * 19)
    o += '<path d="M-120 -34H72L60 -44H-108Z" fill="#7A3A18" stroke="#3A1E10"/><path d="M-160 -18Q-120 -2 -60 -6H100Q136 -8 176 -38Q168 10 130 24Q20 34 -100 24Q-150 16 -160 -18Z" fill="#6B3A1E" stroke="#2A1208" stroke-width="2"/><path d="M-154 -8Q-40 6 170 -28" stroke="#E9B44C" stroke-width="3.4" fill="none"/><path d="M-146 6Q-30 20 150 -6" stroke="#2F7A6E" stroke-width="3" fill="none"/>'
    for i in range(7): o += '<circle cx="%d" cy="%d" r="3" fill="#E9B44C"/>' % (-120 + i * 42, 8 + abs(i - 3) * .4)
    return o + '</g>'

def raft(x, y, w, roof, R, nh=True):
    o = '<g transform="translate(%d %d)">' % (x, y)
    if nh:
        o += '<rect x="%d" y="-56" width="%d" height="50" fill="#D9CDB0" stroke="%s" stroke-width="1.2"/>' % (w * .12, w * .72, K)
        for i in range(int(w * .72 / 9)): o += '<path d="M%d -56v50" stroke="#A8987A" stroke-width=".9"/>' % (w * .12 + i * 9)
        o += '<rect x="%d" y="-44" width="22" height="38" fill="#3A5A6A" stroke="%s"/><rect x="%d" y="-46" width="28" height="18" fill="#7FD0E0" stroke="%s"/>' % (w * .3, K, w * .56, K)
        o += '<path d="M%d -56L%d -82H%dL%d -56Z" fill="%s" stroke="%s" stroke-width="1.6"/>' % (w * .04, w * .16, w * .8, w * .92, roof, K)
        for i in range(1, int(w * .8 / 12)): o += '<path d="M%d -56L%d -82" stroke="#0E4A52" stroke-width="1"/>' % (w * .06 + i * 12, w * .17 + i * 9.4)
        o += '<path d="M%d -30Q%d -22 %d -30" stroke="#EDE8DC" stroke-width="1.2" fill="none"/>' % (w * .86, w * .96, w * 1.02)
    o += '<rect x="0" y="-6" width="%d" height="10" fill="#A8794A" stroke="%s"/>' % (w, K)
    for i in range(int(w / 10)): o += '<path d="M%d -6v10" stroke="#6E4A2A" stroke-width="1"/>' % (i * 10)
    for i in range(int(w / 26) + 1):
        o += '<ellipse cx="%d" cy="9" rx="11" ry="7" fill="%s" stroke="#1A2A3A"/>' % (10 + i * 26, R.choice(['#2E6AA8', '#EDE8DC', '#2E86A8']))
    return o + '</g>'

def cage(x, y, n, m, R):
    o = ''
    w_, h_ = 62, 24
    for i in range(n):
        for j in range(m):
            cx, cy = x + i * w_ + j * 22, y + j * h_
            o += '<path d="M%d %dh%dl18 %dh-%dZ" fill="#0E7A74" fill-opacity=".55" stroke="#8F6A3A" stroke-width="4"/>' % (cx, cy, w_, h_, w_)
            for k in range(3):
                o += '<ellipse class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" rx="6" ry="1.6" fill="#D6F3EE"/>' % (R.uniform(2, 4), R.uniform(0, 3), cx + 18 + R.randint(0, 40), cy + 6 + R.randint(0, 12))
    return o

def halong():
    R = random.Random(31); G.Rr.seed(31)
    d = grad('lSky', [(0, '#3F9AD6'), (.5, '#9AD6EC'), (.85, '#E6F3E6'), (1, '#FFF3D0')]) + grad('lWat', [(0, '#BCE8D8'), (.16, '#6FCFBE'), (.55, '#26A898'), (1, '#0F7A78')]) + grad('lKar', [(0, '#2F6A46'), (1, '#24503E')]) + grad('jSail', [(0, '#E8622E'), (.5, '#D9402A'), (1, '#A8281E')], 1, 0) + grad('lF1', [(0, '#9FC4CC'), (1, '#D6EAE4')]) + grad('lF2', [(0, '#7FAFB0'), (1, '#BFE0D8')]) + grad('lF3', [(0, '#5E9A8E'), (1, '#9CCFC0')])
    o = '<rect width="1280" height="310" fill="url(#lSky)"/><circle cx="240" cy="90" r="170" fill="url(#hg)" opacity=".8"/>'
    for x, y, w_, h_ in [(120, 84, 200, 34), (450, 56, 150, 24), (820, 96, 240, 40), (1110, 54, 170, 26)]:
        c = ''.join('<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s"/>' % (x + (k - 3) * w_ / 7, y - abs(math.sin(k * 1.7)) * h_ * .8 + h_ * .2, w_ / 4.4, h_ * R.uniform(.6, 1), '#FFFFFF' if k % 2 else '#F2F8FA') for k in range(7))
        o += '<g class="drift" style="--t:%ds;--d:-%ds">%s</g>' % (R.randint(240, 340), R.randint(0, 60), c)
    fa = ''.join(karst(x, 312, w_, h_, R, 'url(#lF1)', flat=True) for x, w_, h_ in [(80, 230, 70), (280, 200, 92), (470, 240, 62), (690, 220, 88), (900, 260, 66), (1140, 280, 98)])
    fb = ''.join(karst(x, 316, w_, h_, R, 'url(#lF2)', flat=True) for x, w_, h_ in [(190, 180, 104), (420, 160, 74), (610, 150, 118), (820, 190, 82), (1000, 150, 112)])
    fc = ''.join(karst(x, 322, w_, h_, R, 'url(#lF3)', flat=True) for x, w_, h_ in [(320, 120, 92), (540, 110, 64), (760, 130, 104), (900, 90, 60)])
    o += fa + fb + fc + '<rect y="296" width="1280" height="26" fill="#EAF6EE" opacity=".5"/>'
    o += '<rect y="318" width="1280" height="402" fill="url(#lWat)"/>' + reflect(fa + fb + fc, 322, 90, .5)
    # đảo giữa
    m1 = karst(92, 402, 250, 196, R, 'url(#lKar)')
    m2 = karst(360, 372, 170, 130, R, 'url(#lKar)')
    # đảo lớn phải có hang
    m3 = karst(1078, 462, 470, 320, R, 'url(#lKar)', bumps=[(.3, .3, .86), (.68, .33, 1)])
    cv = cave(1010, 462, 130, 92, R)
    o += reflect(m2, 372, 120, .7) + m2
    o += reflect(m1, 402, 150, .7) + m1
    o += reflect(m3 + cv, 462, 220, .78) + m3 + cv
    # bậc đá lên hang + ca nô nhỏ tới cửa hang
    o += '<g class="rock"><path d="M926 470q22 12 44 -2l-6 8q-16 7 -32 1Z" fill="#20506A" stroke="#0C2030"/><path d="M938 466v-12" stroke="#2E5A6A" stroke-width="5"/></g>' + '<g transform="translate(938 468) scale(.5)">' + V.non(0, 0, '#D9402E').replace('<ellipse cy="1" rx="11" ry="3.4" fill="#0A4A30" opacity=".3"/>', '') + '</g>'
    jk = junk(636, 498, .98)
    o += reflect(jk.replace('#FFE29A', '#A8602E'), 516, 190, .6)
    o += ripples(R, 150, 0, 1280, 330, 716, ['#fff', '#D6F3EE', '#9BE8D8'], .25, .7)
    o += jk
    o += '<ellipse cx="640" cy="524" rx="190" ry="10" fill="#fff" opacity=".22"/>'
    # đàn hải âu
    o += V.flock(150, 60, 10, .55) + V.flock(226, 74, 4, .4)
    # làng chài nổi trái + lồng cá
    for x, y, w_, c_ in [(236, 446, 70, '#3AA8A0'), (310, 452, 60, '#2E8AA0'), (30, 470, 110, '#2E8AA0'), (146, 484, 90, '#2FA8A0')]:
        rr = raft(x, y, w_, c_, R); o += reflect(rr, y + 14, 70, .5) + rr
    o += cage(40, 520, 4, 2, R)
    # thuyền con buộc bè
    o += '<g class="rock"><path d="M360 520q40 22 92 -6l-10 14q-36 14 -70 4Z" fill="#8F3A2A" stroke="#120A08" stroke-width="1.6"/><path d="M366 523q40 18 82 -4" stroke="#EFE6CC" stroke-width="2" fill="none"/></g>'
    # cầu ván tiền cảnh: đường cho thú cưng
    dk = 'M-10 624C160 612 360 618 500 660L580 730H-10Z'
    o += '<path d="M-10 636C160 624 360 630 500 672L568 730" fill="none" stroke="#0A4A4A" stroke-width="12" opacity=".35"/><path d="%s" fill="#B98A58" stroke="#4E3018" stroke-width="2.4"/>' % dk
    cl = V.uid()
    o += '<clipPath id="%s"><path d="%s"/></clipPath><g clip-path="url(#%s)">' % (cl, dk, cl)
    for i in range(44): o += '<path d="M%d 600L%d 736" stroke="#6E4A2A" stroke-width="1.8"/>' % (-20 + i * 16, -40 + i * 18)
    for y in (640, 666, 696): o += '<path d="M-10 %dC160 %d 340 %d 560 %d" stroke="#8F6A3E" stroke-width="1" fill="none" opacity=".6"/>' % (y, y - 12, y - 6, y + 26)
    o += '</g>'
    for x, y in [(30, 616), (150, 606), (280, 610), (404, 628), (510, 662)]:
        o += '<rect x="%d" y="%d" width="9" height="86" fill="#6E4A2A" stroke="#2A1810"/><circle cx="%d" cy="%d" r="6" fill="#8F6A3E" stroke="#2A1810"/>' % (x, y - 42, x + 4, y - 44)
    o += '<path d="M34 576Q90 592 154 566Q214 586 284 570Q344 590 408 588Q460 600 514 622" stroke="#C9A464" stroke-width="3" fill="none"/>'
    # lưới phơi, giỏ cá, người làng chài
    o += '<g transform="translate(160 672)"><path d="M-50 0Q-20 -32 40 -6L50 6H-52Z" fill="#E86A3A" opacity=".85" stroke="#8F3A1A"/><path d="M-40 -6L40 2M-26 -16L44 0M-10 -22L30 -8M-30 2L-10 -24M-6 4L14 -18M18 4L30 -6" stroke="#FFD2B0" stroke-width="1"/></g>'
    o += '<path d="M440 690q-6 -30 14 -32q22 2 14 32Z" fill="#C9A464" stroke="#6B4322"/><path d="M442 672h26M441 682h28" stroke="#8F6A28"/>'
    o += '<g transform="translate(70 668) scale(1.3)">' + V.non(0, 0, '#2E5AA8', True) + '</g>'
    o += V.kitsu(330, 704, 92, 'ehappy', 'walk')
    # thuyền chèo bán hàng phải
    o += '<g class="rock">' + V.sampan(960, 640, .95) + '</g>'
    o += sparkle(R, 90, 0, 1280, 340, 716, ['#fff', '#D6F3EE'])
    for t_, x, y, dn in [('Đảo đá', 340, 214, True), ('Thuyền buồm', 780, 300, True), ('Hang đá', 1010, 330, False), ('Làng chài', 84, 352, False), ('Lồng cá', 300, 496, False)]:
        o += G.bubble(x, y, t_, dn)
    page('PHalong', 'Kids World, vịnh Hạ Long', 'Hạ Long', 'Vịnh Hạ Long: đảo đá vôi, thuyền buồm đỏ, hang đá, làng chài nổi', d, o)

# ---------- NINH BÌNH ----------
def tourboat(x, y, s=1):
    o = '<g class="rock"><g transform="translate(%d %d) scale(%.2f)"><ellipse cy="12" rx="74" ry="6" fill="#0A3A3A" opacity=".4"/>' % (x, y, s)
    o += '<path d="M-74 -6Q-40 12 30 10Q60 8 80 -12Q40 -2 -20 -2Q-50 -2 -74 -6Z" fill="#2F6A5E" stroke="%s" stroke-width="1.6"/><path d="M-70 -3Q-10 4 76 -9" stroke="#EFE6CC" stroke-width="2.4" fill="none"/>' % K
    for i, (px, c_) in enumerate(((-30, '#F2702E'), (-2, '#F2702E'), (24, '#F2702E'))):
        o += '<path d="M%d -2Q%d -20 %d -24Q%d -24 %d -20Q%d -10 %d -2Z" fill="%s" stroke="#8F3A10"/><path d="M%d -24V-3" stroke="#FFD27A" stroke-width="1.6"/><circle cx="%d" cy="-31" r="5" fill="#E8B98E" stroke="#3A2413" stroke-width=".7"/><path d="M%d -32Q%d -40 %d -32Z" fill="#2A1E18"/>' % (px - 8, px - 8, px - 2, px + 4, px + 8, px + 9, px + 8, c_, px, px, px - 5, px, px + 5)
    o += '<path d="M-58 -2Q-60 -18 -54 -22H-44Q-40 -18 -42 -2Z" fill="#3AA8A0" stroke="#14584E"/><circle cx="-50" cy="-29" r="5" fill="#E8B98E" stroke="#3A2413" stroke-width=".7"/><path d="M-64 -30L-50 -44L-36 -30Q-50 -27 -64 -30Z" fill="#F7E2A8" stroke="#8A6A3A"/><path d="M-42 -16L-20 12M-44 -14L-66 14" stroke="#B98A4A" stroke-width="2.4"/>'
    return o + '</g></g>'

def ninhbinh():
    R = random.Random(41); G.Rr.seed(41)
    d = grad('nSky', [(0, '#7FBBD6'), (.5, '#BFE0DE'), (.82, '#F4EDD2'), (1, '#FFE9BE')]) + grad('nWat', [(0, '#C9DDB8'), (.2, '#6FAE8E'), (.6, '#2F7E72'), (1, '#1A5A5A')]) + grad('nKar', [(0, '#2F6A46'), (1, '#24503E')]) + grad('nF1', [(0, '#A9C8CC'), (1, '#E0ECDC')]) + grad('nF2', [(0, '#86AEA8'), (1, '#C8E0CC')]) + grad('nRice', [(0, '#F2D65A'), (1, '#D9A92A')])
    o = '<rect width="1280" height="330" fill="url(#nSky)"/><circle cx="880" cy="120" r="190" fill="url(#hg)" opacity=".9"/><circle cx="880" cy="120" r="30" fill="#FFF6D8"/>'
    for x, y, w_, h_ in [(180, 80, 300, 16), (560, 52, 260, 12), (1060, 92, 300, 18)]:
        o += '<ellipse class="drift" style="--t:300s;--d:-%ds" cx="%d" cy="%d" rx="%d" ry="%d" fill="#FFF9EC" opacity=".85"/>' % (x % 40, x, y, w_ / 2, h_)
    o += ''.join(karst(x, 330, w_, h_, R, 'url(#nF1)', flat=True) for x, w_, h_ in [(60, 220, 130), (300, 170, 96), (470, 190, 150), (760, 200, 110), (1000, 240, 162), (1230, 190, 120)])
    o += ''.join(karst(x, 340, w_, h_, R, 'url(#nF2)', flat=True) for x, w_, h_ in [(180, 200, 170), (620, 150, 120), (880, 160, 170), (1140, 210, 200)])
    o += puff(-40, 322, 1360, 20, '#F7F6E6', R, 14, op=.8)
    # đồng lúa chín hai bờ
    o += '<rect y="340" width="1280" height="180" fill="url(#nRice)"/>'
    fld = ''
    for y, c_ in ((352, '#E8C23E'), (366, '#F2D65A'), (384, '#9CC24A'), (404, '#EFC545'), (428, '#D9B02E')):
        fld += '<path d="M-10 %dH1290" stroke="%s" stroke-width="%d"/><path d="M-10 %dH1290" stroke="#8A7A3A" stroke-width="1.6"/>' % (y, c_, 10 + (y - 352) // 9, y + 8 + (y - 352) // 18)
    o += fld
    tk = {}
    for y in range(344, 456, 7):
        for i in range(90):
            c_ = R.choice(['#C78A1E', '#F7E08A', '#A8B83E']); tk[c_] = tk.get(c_, '') + 'M%d %dl1 -%d' % (i * 15 + R.randint(-6, 6), y + R.randint(-3, 3), 3 + (y - 344) // 22)
    for c_, v in tk.items(): o += '<path d="%s" stroke="%s" stroke-width="1.2" fill="none"/>' % (v, c_)
    for x0, x1 in ((120, -60), (250, 90), (1040, 1200), (1160, 1340)): o += '<path d="M%d 340L%d 460" stroke="#7E9A3E" stroke-width="3"/>' % (x0, x1)
    # núi chính có hang, sông chảy từ hang
    mn = karst(690, 452, 560, 306, R, 'url(#nKar)', bumps=[(.27, .27, .8), (.56, .3, 1), (.84, .17, .66)])
    cv = cave(690, 452, 170, 104, R)
    ml = karst(1160, 500, 300, 280, R, 'url(#nKar)', bumps=[(.5, .5, 1)])
    # sông
    riv = 'M-10 730V700C120 690 330 640 420 570C520 500 560 470 590 452H790C860 480 900 500 1000 502H1290V730Z'
    o += mn + ml + cv
    cr = V.uid()
    o += '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="url(#nWat)"/><g clip-path="url(#%s)">' % (cr, riv, riv, cr)
    o += reflect(mn + cv, 452, 200, .72) + reflect(ml, 500, 170, .72)
    o += ripples(R, 120, 300, 1280, 462, 716, ['#fff', '#D6EEDC', '#FFE9B8'], .2, .6) + sparkle(R, 60, 420, 1280, 470, 716, ['#fff', '#FFE9B8']) + '</g>'
    o += '<path d="M-10 700C120 690 330 640 420 570C520 500 560 470 590 452" fill="none" stroke="#6B4A28" stroke-width="5"/><path d="M790 452C860 480 900 500 1000 502H1290" fill="none" stroke="#3E5A3A" stroke-width="4"/>'
    # ruộng trái, bờ đê + đường
    bank = 'M-10 460H570L590 452C560 470 520 500 420 570C330 640 120 690 -10 700Z'
    cb = V.uid()
    o += '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="url(#nRice)"/><g clip-path="url(#%s)">' % (cb, bank, bank, cb)
    rk = {}
    for r_ in range(13):
        y = 462 + r_ * r_ * 1.25 + r_ * 4
        for i in range(70):
            x = i * 12 + (r_ % 2) * 6; c_ = R.choice(['#C78A1E', '#F7E08A', '#E8B93A', '#B9941E'])
            rk[c_] = rk.get(c_, '') + 'M%d %.0fq-2 -%d 3 -%d' % (x, y + R.randint(-2, 2), 4 + r_, 6 + r_)
    for c_, v in rk.items(): o += '<path d="%s" stroke="%s" stroke-width="1.5" fill="none"/>' % (v, c_)
    o += '</g>'
    for x, s_ in ((-6, 1), (510, .7)): o += V.tre(x, 470, 7, s_)
    # đê lát đá chạy vào núi
    rp = spline([(-30, 672), (150, 610), (300, 546), (430, 486), (540, 456)])
    o += ribbon(rp, 74, 10, '#6E5E44') + ribbon(rp, 62, 8, '#C4AE82')
    for i in range(1, len(rp), 2):
        x, y = rp[i]; w_ = 26 * (1 - i / len(rp)) + 2
        for k in range(3): o += '<ellipse cx="%d" cy="%d" rx="%.1f" ry="%.1f" fill="%s" stroke="#8A7656" stroke-width=".5"/>' % (x + R.uniform(-w_, w_), y + R.uniform(-w_ / 2, w_ / 2), R.uniform(1.5, 4) * (w_ / 22 + .5), R.uniform(1, 2) * (w_ / 22 + .5), R.choice(['#B9A274', '#D6C39A', '#A8946A']))
    o += '<g transform="translate(372 494) scale(.82)">' + G.bike(0, 0, '#3A4A5A') + '<path d="M-28 -26h18l-3 10h-12Z" fill="#C9A464" stroke="#6B4322"/>' + ''.join('<circle cx="%d" cy="%d" r="3" fill="%s"/>' % (-28 + k * 3, -28 - k % 3 * 2, '#4FA050') for k in range(7)) + '</g>'
    o += '<g transform="translate(170 508) scale(1.25)">' + V.non(0, 0, '#2E5AA8', True) + '</g>'
    o += '<g transform="translate(330 438) scale(.86)">' + V.trau(0, 0) + '</g>'
    o += V.kitsu(150, 616, 92, 'ehappy', 'walk')
    # bờ phải: tre, súng
    o += '<path d="M1290 490C1140 500 1060 500 1000 494" stroke="#3E7A4A" stroke-width="10" fill="none"/>' + V.tre(1080, 500, 6, .86)
    for x, y in [(1010, 660), (1056, 690), (1110, 664), (1180, 696), (1224, 668)]: o += V.lotusleaf(x, y, 15)
    o += V.lotus(1140, 684, .7) + V.lotus(1240, 700, .6)
    # thuyền
    o += tourboat(696, 462, .62) + tourboat(820, 548, .86)
    o += '<g class="rock">' + V.sampan(640, 646, 1.28) + '</g>'
    o += V.flock(130, 60, 7, .5) + V.flock(236, 70, 3, .36)
    for t_, x, y, dn in [('Núi đá', 640, 112, True), ('Hang', 838, 372, True), ('Ruộng lúa', 176, 392, False), ('Chèo chân', 596, 516, False), ('Trâu', 328, 340, False)]:
        o += G.bubble(x, y, t_, dn)
    page('PNinhbinh', 'Kids World, Tràng An Ninh Bình', 'Ninh Bình', 'Tràng An buổi sáng: thuyền qua hang, núi đá, ruộng lúa, người chèo bằng chân', d, o)

# ---------- canvas ----------
def add_canvas():
    p = os.path.join(proj, 'canvas.json')
    c = json.load(open(p, encoding='utf-8'))
    items = [('PSapa', 0, 'Sa Pa'), ('PHanoi', 1360, 'Hà Nội'), ('PHalong', 2720, 'Hạ Long'), ('PNinhbinh', 4080, 'Ninh Bình')]
    for n, x, t in items:
        k = n + '.dc.html'
        c['boards'][k] = {'x': x, 'y': -5300, 'w': 1280, 'h': 720, 'title': 'Địa điểm · ' + t}
        if k not in c['order']: c['order'].append(k)
    json.dump(c, open(p, 'w', encoding='utf-8'))

if __name__ == '__main__':
    sapa(); hanoi(); halong(); ninhbinh(); add_canvas(); print('ok')
