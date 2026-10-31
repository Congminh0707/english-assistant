# Cảnh địa điểm miền Trung theo chuẩn r5f (docs/22 §12): PHue, PDanang, PNhatrang, PDalat.
#   python gen_places_central.py <project> [vn_merged.json]   (hoặc đặt BOARD_OUT)
#   thêm --canvas để ghi 4 bảng vào canvas.json trong <project>
# Tái dùng bộ vẽ của gen_review2 (G) và gen_village3 (G.V); hàm mới nằm trong file này.
import json, math, os, random, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
proj = args[0] if args else os.environ['BOARD_OUT']
vn = args[1] if len(args) > 1 else 'C:/Users/01217/AppData/Local/Temp/vn/vn_merged.json'
want_canvas = '--canvas' in sys.argv
sys.argv = ['x', proj, vn]
sys.path.insert(0, HERE)
import gen_review2 as G
import place_parts as P
V = G.V
R = random.Random(23)
INK = '#1E1612'

# ---------- phần chung ----------
HG = '<radialGradient id="hg"><stop offset="0" stop-color="#FFD27A" stop-opacity=".85"/><stop offset=".5" stop-color="#FFAE4A" stop-opacity=".3"/><stop offset="1" stop-color="#FFAE4A" stop-opacity="0"/></radialGradient>'
def water_fx(y0, a=.8, b=.12, seed=3, scale=22):
    return (f'<filter id="wob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".006 .1" numOctaves="2" seed="{seed}"/><feDisplacementMap in="SourceGraphic" scale="{scale}" xChannelSelector="R" yChannelSelector="G"/></filter>'
            f'<linearGradient id="pfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="{a}"/><stop offset="1" stop-color="#fff" stop-opacity="{b}"/></linearGradient><mask id="pfm"><rect y="{y0}" width="1280" height="{720 - y0}" fill="url(#pfade)"/></mask>')

def mirror(svg, wl, y0, y1=720, x0=0, x1=1280):
    svg = re.sub(r'(id="|url\(#)(k\d+)', r'r', svg)  # bản sao soi bóng: đổi id, tránh trùng
    c = V.uid()
    return f'<clipPath id="{c}"><rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}"/></clipPath><g clip-path="url(#{c})"><g filter="url(#wob)" mask="url(#pfm)"><g transform="translate(0 {2 * wl}) scale(1 -1)">{svg}</g></g></g>'

def ripples(n, y0, y1, cols, x0=0, x1=1280, w0=16, w1=70, a0=.25, a1=.75):
    o = ''
    for _ in range(n):
        o += '<path class="lap" style="--t:%.1fs;--d:-%.1fs" d="M%d %dh%d" stroke="%s" stroke-width="2.2" opacity="%.2f" stroke-linecap="round"/>' % (R.uniform(3, 6), R.uniform(0, 4), R.randint(x0, x1), R.randint(y0, y1), R.randint(w0, w1), R.choice(cols), R.uniform(a0, a1))
    return o

def glints(n, y0, y1, cols, x0=0, x1=1280):
    o = ''
    for _ in range(n):
        o += '<ellipse class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" rx="%d" ry="1.2" fill="%s"/>' % (R.uniform(2, 5), R.uniform(0, 4), R.randint(x0, x1), R.randint(y0, y1), R.randint(2, 7), R.choice(cols))
    return o

def clouds(items, op=.75, t=300):
    return ''.join('<ellipse class="drift" style="--t:%ds;--d:-%ds" cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" opacity="%.2f"/>' % (t, x % 40, x, y, w / 2, h, c, op) for x, y, w, h, c in items)

def stars(n, y1):
    return ''.join('<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="#fff"/>' % (R.uniform(2, 5), R.uniform(0, 4), R.randint(0, 1280), R.randint(0, y1), R.uniform(.8, 1.6)) for _ in range(n))

def birds(pts, c='#2A2A4A'):
    return ''.join('<path d="M%d %dq6 -6 11 0q5 -6 11 0" stroke="%s" stroke-width="2" fill="none" stroke-linecap="round"/>' % (x, y, c) for x, y in pts)

def paving(top, bot, x0, x1, pal, line):
    """Lát đá từng viên, phối cảnh: gần to dần."""
    o = ''; y = top; row = 0
    while y < bot:
        h = 10 + (y - top) * .1; x = x0 - (row % 2) * 24
        while x < x1:
            w = 42 + R.randint(0, 18) + (y - top) * .35
            o += '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" rx="2" fill="%s" stroke="%s" stroke-width=".9"/>' % (x, y, w - 2, h - 1.5, R.choice(pal), line)
            x += w
        y += h; row += 1
    return o

def promenade(d, top, pal, line):
    c = V.uid()
    return f'<clipPath id="{c}"><path d="{d}"/></clipPath><path d="{d}" fill="{pal[0]}"/><g clip-path="url(#{c})">' + paving(top, 730, -30, 1300, pal, line) + '</g>' + f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="1.6"/>'

def brick(x, y, w, h, cols=('#B8603A', '#C9784A', '#A85234', '#BC6A40', '#D08A58'), line='#7A3A22', bh=5):
    c = V.uid(); o = f'<clipPath id="{c}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath><g clip-path="url(#{c})"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{cols[0]}"/>'
    yy = y; r = 0
    while yy < y + h:
        xx = x - (r % 2) * 7
        while xx < x + w:
            bw = R.randint(10, 16); o += '<rect x="%d" y="%d" width="%d" height="%d" fill="%s"/>' % (xx, yy, bw, bh, R.choice(cols)); xx += bw
        o += '<path d="M%d %dh%d" stroke="%s" stroke-width=".7" opacity=".6"/>' % (x, yy, w, line)
        yy += bh; r += 1
    return o + '</g>'

def roofk(cx, y, w, h, base, dark, edge='#3A2413', ridge=None, step=8):
    """Mái cong có đầu đao, ngói từng hàng, bờ nóc."""
    L, Q = cx - w / 2, cx + w / 2; tl, tr = cx - w * .33, cx + w * .33
    d = f'M{L - 12} {y - 12}Q{L + 6} {y + 2} {L + 30} {y}H{Q - 30}Q{Q - 6} {y + 2} {Q + 12} {y - 12}Q{tr + 26} {y - h * .45} {tr} {y - h}H{tl}Q{tl - 26} {y - h * .45} {L - 12} {y - 12}Z'
    # ngói lưu ly: bỏ vệt rêu của V.tiles
    o = re.sub(r'<ellipse [^>]*opacity=".3"/>', '', V.tiles(d, L - 14, y - h, Q + 14, y + 4, base, dark, step))
    o += f'<path d="M{L - 12} {y - 12}Q{L + 6} {y + 2} {L + 30} {y}H{Q - 30}Q{Q - 6} {y + 2} {Q + 12} {y - 12}" stroke="{edge}" stroke-width="3" fill="none" stroke-linecap="round"/>'
    rc = ridge or base
    o += f'<rect x="{tl - 6}" y="{y - h - 4}" width="{tr - tl + 12}" height="6" rx="3" fill="{rc}" stroke="{edge}" stroke-width="1.2"/>'
    return o

def curl(x, y, sg, s=1, c='#E9B44C'):
    return f'<path d="M{x} {y}q{sg * 14 * s} {-2 * s} {sg * 18 * s} {-14 * s}q{sg * 2 * s} {-8 * s} {-sg * 5 * s} {-7 * s}" stroke="{c}" stroke-width="{3 * s:.1f}" fill="none" stroke-linecap="round"/>'

def people_shadow(x, y, r=11):
    return f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="3" fill="#120A08" opacity=".35"/>'

def aodai(x, y, c='#7A4FB0', s=1, flip=1, hat=True):
    """Người mặc áo dài, nón lá: quần trắng, hai vạt dài."""
    o = f'<g transform="translate({x} {y}) scale({s * flip:.2f} {s:.2f})"><ellipse cy="1" rx="10" ry="3" fill="#120A08" opacity=".35"/>'
    o += '<path d="M-6 -60Q-11 -48 -8 -30H-1Q2 -46 2 -60Z" fill="#2A1E18"/>'
    o += '<path d="M-6 -24L-7 0H-1L0 -18L1 0H7L6 -24Z" fill="#FFF9EA" stroke="#B9A98A" stroke-width=".7"/>'
    o += f'<path d="M-7 -50Q-9 -36 -8 -28L-12 -6Q-6 -2 -1 -6L0 -24L1 -6Q6 -2 12 -8L8 -28Q9 -40 7 -50Q0 -54 -7 -50Z" fill="{c}" stroke="#1A1218" stroke-width=".7"/>'
    o += f'<path d="M-7 -48Q-11 -38 -9 -30M7 -48Q11 -38 9 -30" stroke="{c}" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
    o += '<rect x="-2" y="-53" width="4" height="4" fill="#E8B98E"/><circle cy="-57" r="5.4" fill="#E8B98E"/><path d="M-5.6 -58q5.6 -8 11 0q-5 -3 -11 0Z" fill="#2A1E18"/>'
    if hat: o += '<path d="M-16 -58L0 -74L16 -58Q0 -54 -16 -58Z" fill="#F0DCA8" stroke="#8A6A3A" stroke-width=".8"/><path d="M-8 -62Q0 -60 8 -62" stroke="#C9A464" stroke-width=".8" fill="none"/>'
    return o + '</g>'

def lamp(x, y, h=120, c='#2A2A3A'):
    return f'<rect x="{x - 2}" y="{y - h}" width="5" height="{h}" fill="{c}"/><rect x="{x - 5}" y="{y - 5}" width="11" height="5" fill="{c}"/><path d="M{x - 10} {y - h}h21l-4 -18h-13Z" fill="#FFE29A" stroke="{c}" stroke-width="1.6"/>' + G.halo(x, y - h - 10, 52)

def rail(x0, x1, y, step=74, h=20, c='#8A7A62', hi='#B8A888', dk='#3E3428'):
    """Lan can đá thấp mép kè."""
    o = f'<rect x="{x0}" y="{y - h}" width="{x1 - x0}" height="5" fill="{hi}" stroke="{dk}"/>'
    x = x0
    while x <= x1:
        o += f'<rect x="{x - 5}" y="{y - h - 5}" width="11" height="{h + 7}" fill="{c}" stroke="{dk}"/><rect x="{x - 7}" y="{y - h - 8}" width="15" height="4" fill="{hi}" stroke="{dk}"/>'
        x += step
    return o

# ---------- HUẾ ----------
def phuong(x, y, s=1):
    """Cây phượng: thân nâu, tán lá xanh điểm hoa đỏ."""
    o = f'<path d="M{x - 7 * s} {y}Q{x - 3 * s} {y - 50 * s} {x - 10 * s} {y - 80 * s}L{x + 8 * s} {y - 80 * s}Q{x + 5 * s} {y - 40 * s} {x + 9 * s} {y}Z" fill="#5A3A2A" stroke="{INK}"/>'
    for _ in range(26):
        dx, dy = R.uniform(-66, 66) * s, R.uniform(-54, 14) * s
        o += '<ellipse cx="%.0f" cy="%.0f" rx="%.0f" ry="%.0f" fill="%s"/>' % (x + dx, y - 104 * s + dy, R.uniform(16, 28) * s, R.uniform(11, 18) * s, R.choice(['#2F6A4A', '#3A7A52', '#245A44']))
    for _ in range(70):
        dx, dy = R.uniform(-78, 78) * s, R.uniform(-62, 22) * s
        o += '<circle cx="%.0f" cy="%.0f" r="%.1f" fill="%s"/>' % (x + dx, y - 104 * s + dy, R.uniform(2, 5) * s, R.choice(['#E2483E', '#F2684A', '#D92F2F', '#FF8A5A']))
    return o

def colonnade(x0, x1, y0, y1, n, glow=True):
    o = f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" fill="{"#F2B866" if glow else "#3A2A2A"}"/>'
    for k in range(n + 1):
        o += f'<rect x="{x0 + (x1 - x0) * k / n - 2.5:.1f}" y="{y0}" width="5" height="{y1 - y0}" fill="#A8301F" stroke="#4E1810" stroke-width=".7"/>'
    return o

def lattice(x0, x1, y0, y1, n):
    o = f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" fill="#7A3020" stroke="{INK}"/>'
    w = (x1 - x0) / n
    for k in range(n):
        xx = x0 + k * w + 2
        o += f'<rect x="{xx:.1f}" y="{y0 + 3}" width="{w - 4:.1f}" height="{y1 - y0 - 6}" fill="#E9B44C" stroke="#4E1810" stroke-width=".8"/><path d="M{xx + (w - 4) / 2:.1f} {y0 + 3}v{y1 - y0 - 6}M{xx:.1f} {(y0 + y1) / 2}h{w - 4:.1f}" stroke="#7A3020" stroke-width="1"/>'
    return o

def upper_rail(x0, x1, y):
    o = f'<rect x="{x0}" y="{y - 11}" width="{x1 - x0}" height="3" fill="#C9962E" stroke="{INK}" stroke-width=".6"/><rect x="{x0}" y="{y - 2}" width="{x1 - x0}" height="4" fill="#8A3A24" stroke="{INK}" stroke-width=".6"/>'
    x = x0
    while x < x1:
        o += f'<path d="M{x} {y - 9}v8" stroke="#C9962E" stroke-width="1.6"/>'; x += 7
    return o

def ngomon():
    """Ngọ Môn nhìn chính diện theo ảnh: đế gạch đá chữ U, 3 cửa vuông giữa, 2 cửa vòm, lầu Ngũ Phụng mái vàng giữa, mái xanh hai bên."""
    GR, GD, YE, YD = '#2F8F6A', '#1C6A4C', '#F2B233', '#C47F14'
    o = ''
    # đế
    for sg in (-1, 1):
        x = -350 if sg < 0 else 140
        o += brick(x, -118, 210, 118, ('#8A5A44', '#7A4E3C', '#94644C', '#6E4636'), '#3E261C')
        o += f'<rect x="{x}" y="-118" width="210" height="118" fill="none" stroke="{INK}" stroke-width="1.6"/>'
        ax = sg * 222
        o += f'<path d="M{ax - 30} 0V-44A30 30 0 0 1 {ax + 30} -44V0Z" fill="#B8AE9A" stroke="{INK}"/><path d="M{ax - 20} 0V-42A20 20 0 0 1 {ax + 20} -42V0Z" fill="#1E1A22"/>'
        mx = sg * 308
        o += f'<circle cx="{mx}" cy="-64" r="17" fill="#C9BFA8" stroke="{INK}"/><circle cx="{mx}" cy="-64" r="11" fill="#5A4A40"/><path d="M{mx - 8} -64h16M{mx} -72v16M{mx - 5} -70l11 11M{mx - 5} -58l11 -11" stroke="#C9BFA8" stroke-width="1.1"/>'
    # phần giữa lát đá, lùi vào
    o += f'<rect x="-140" y="-114" width="280" height="114" fill="#A49A88" stroke="{INK}" stroke-width="1.6"/>'
    for r in range(11):
        for k in range(14):
            o += '<rect x="%d" y="%d" width="19" height="9" fill="%s" stroke="#6E6658" stroke-width=".6"/>' % (-140 + k * 20 + (r % 2) * 6 - 6, -112 + r * 10, R.choice(['#A49A88', '#B0A694', '#968C7A', '#BCB2A0']))
    o += '<rect x="-142" y="-114" width="284" height="10" fill="#000" opacity=".22"/>'
    for gx, c in ((-90, '#1E1A22'), (0, '#C9962E'), (90, '#1E1A22')):
        o += f'<rect x="{gx - 27}" y="-78" width="54" height="78" fill="#6E6658" stroke="{INK}"/><rect x="{gx - 21}" y="-72" width="42" height="72" fill="{c}"/>'
        if gx == 0:
            o += f'<path d="M0 -72V0" stroke="{INK}" stroke-width="1.6"/>' + ''.join(f'<circle cx="{sx}" cy="{yy}" r="1.3" fill="#7A4E1C"/>' for sx in (-14, -7, 7, 14) for yy in (-60, -44, -28, -12))
    # lan can đỉnh đế
    o += upper_rail(-352, 352, -118) + '<rect x="-354" y="-118" width="708" height="4" fill="#5A4A40"/>'
    for x in range(-340, 341, 68): o += f'<rect x="{x - 4}" y="-136" width="8" height="18" fill="#BCB2A0" stroke="{INK}" stroke-width=".8"/>'
    # hai lầu đầu hồi, hai tầng, mái xanh
    for sg in (-1, 1):
        cx = sg * 294
        o += colonnade(cx - 46, cx + 46, -160, -122, 4)
        o += roofk(cx, -158, 116, 22, GR, GD, ridge='#C9962E')
        o += lattice(cx - 34, cx + 34, -204, -176, 4) + upper_rail(cx - 40, cx + 40, -176)
        o += roofk(cx, -202, 96, 34, GR, GD, ridge='#E9B44C')
        o += curl(cx - 34, -236, -1, .9) + curl(cx + 34, -236, 1, .9)
        o += f'<circle cx="{cx}" cy="-245" r="5" fill="#E9B44C" stroke="{INK}"/>'
    # lầu bên
    for sg in (-1, 1):
        cx = sg * 190
        o += colonnade(cx - 44, cx + 44, -158, -122, 4)
        o += roofk(cx, -154, 112, 20, GR, GD, ridge='#C9962E')
    # lầu giữa, mái vàng hai tầng
    o += colonnade(-120, 120, -168, -122, 8)
    o += roofk(0, -166, 288, 26, YE, YD, ridge='#FFD97A', step=9)
    o += lattice(-98, 98, -214, -184, 9) + upper_rail(-104, 104, -184)
    o += roofk(0, -212, 246, 42, YE, YD, ridge='#FFD97A', step=9)
    o += curl(-62, -256, -1, 1.5) + curl(62, -256, 1, 1.5) + curl(-16, -256, -1, .9) + curl(16, -256, 1, .9)
    o += f'<circle cx="0" cy="-268" r="8" fill="#F2484A" stroke="#E9B44C" stroke-width="2.5"/><path d="M0 -258v-3" stroke="#E9B44C" stroke-width="3"/>'
    for x in (-96, -48, 0, 48, 96): o += G.den(x, -168, .6, '#F2484A', 4)
    return o

def trangtien(x0, y, span, n):
    """Cầu Tràng Tiền: 6 nhịp vòm thép, mỗi nhịp một lườn cong có giàn chéo, trụ đá."""
    o = ''
    for k in range(n):
        a = x0 + k * span; b = a + span; m = (a + b) / 2; h = span * .17
        pts = [(a + span * i / 10, y - h * math.sin(math.pi * i / 10)) for i in range(11)]
        top = 'M' + ' L'.join(f'{p[0]:.1f} {p[1]:.1f}' for p in pts)
        o += f'<path d="{top}" stroke="#F4F2F4" stroke-width="2.6" fill="none"/>'
        for i in range(10):
            p = pts[i]; q = pts[i + 1]
            o += f'<path d="M{p[0]:.1f} {y}L{q[0]:.1f} {q[1]:.1f}L{q[0]:.1f} {y}" stroke="#E4E0E8" stroke-width="1" fill="none"/>'
        o += f'<rect x="{b - 4}" y="{y}" width="8" height="24" fill="#BCA890" stroke="#3A3058"/>'
        for i in range(0, 11, 2): o += '<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%.1f" cy="%.1f" r="1.5" fill="#FFE29A"/>' % (R.uniform(2, 4), R.uniform(0, 3), pts[i][0], pts[i][1])
    o += f'<rect x="{x0 - 6}" y="{y - 1}" width="{span * n + 12}" height="4" fill="#E4E0E8" stroke="#3A3058" stroke-width=".7"/>'
    return o

def dragonboat(x, y, s=1):
    """Thuyền rồng sông Hương: đầu rồng mũi trái, đuôi lái phải, thân vảy vàng đỏ, cabin dài mái sáng."""
    o = f'<g class="rock"><g transform="translate({x} {y}) scale({s})">'
    o += '<ellipse cx="10" cy="12" rx="210" ry="11" fill="#1E1A4A" opacity=".4"/>'
    h = 'M-176 -24Q-154 8 -104 13H124Q176 8 202 -38Q164 -14 112 -16H-120Q-152 -16 -176 -24Z'
    c = V.uid()
    o += f'<clipPath id="{c}"><path d="{h}"/></clipPath><path d="{h}" fill="#F2B233" stroke="{INK}" stroke-width="2"/><g clip-path="url(#{c})">'
    for r in range(4):
        for k in range(30):
            xx = -190 + k * 14 + (r % 2) * 7; yy = -24 + r * 10
            o += f'<path d="M{xx} {yy}a7 7 0 0 0 14 0" fill="{"#D9432E" if (k + r) % 3 else "#2FA8C6"}" stroke="#7A2A10" stroke-width=".8"/>'
    o += '</g><path d="M-160 -16Q-20 -12 150 -16" stroke="#FFF3C2" stroke-width="3" fill="none"/>'
    # cabin
    o += '<rect x="-96" y="-58" width="226" height="44" fill="#F4EFE2" stroke="#1E1612" stroke-width="1.6"/>'
    for k in range(10):
        xx = -90 + k * 22
        o += f'<rect x="{xx}" y="-53" width="17" height="20" fill="#7FCBE0" stroke="#2A6A9A"/><path d="M{xx + 20} -58v44" stroke="#2A6A9A" stroke-width="3"/>'
    o += '<path d="M-110 -58Q10 -72 146 -60V-54Q10 -66 -110 -52Z" fill="#E9C25A" stroke="#1E1612" stroke-width="1.4"/><path d="M-110 -58L-120 -64M146 -60L156 -66" stroke="#D9432E" stroke-width="4" stroke-linecap="round"/>'
    for k in range(6): o += G.den(-74 + k * 38, -56, .46, '#F2484A', 2)
    # cổ, đầu rồng
    o += '<path d="M-152 -14C-176 -20 -188 -42 -176 -66C-172 -76 -156 -70 -154 -60C-150 -44 -142 -32 -128 -20Z" fill="#F2B233" stroke="#1E1612" stroke-width="2"/>'
    for k in range(6): o += f'<path d="M{-170 + k * 5} {-58 + k * 7}l8 -2l-3 7Z" fill="#D9432E"/>'
    o += '<path d="M-150 -68C-170 -90 -196 -86 -210 -70C-218 -62 -212 -54 -200 -56L-186 -54C-192 -50 -192 -44 -184 -46C-170 -48 -156 -54 -150 -68Z" fill="#F7C93C" stroke="#1E1612" stroke-width="2"/>'
    o += '<path d="M-168 -84Q-160 -104 -142 -104Q-156 -96 -158 -80ZM-156 -78Q-146 -92 -130 -88Q-144 -84 -148 -72Z" fill="#E9F0F4" stroke="#1E1612"/><path d="M-150 -66q14 -4 18 8M-150 -56q12 2 12 14M-154 -46q10 6 6 14" stroke="#D9432E" stroke-width="4" fill="none" stroke-linecap="round"/>'
    o += '<circle cx="-184" cy="-72" r="5" fill="#fff" stroke="#1E1612"/><circle cx="-185" cy="-72" r="2.2" fill="#D9432E"/><path d="M-206 -62l4 5l3 -4l3 4l3 -4" stroke="#fff" stroke-width="1.4" fill="none"/>'
    # đuôi
    o += '<path d="M194 -30Q214 -60 228 -92Q232 -60 218 -46Q240 -56 250 -44Q228 -34 204 -22Z" fill="#D9432E" stroke="#1E1612" stroke-width="1.6"/><path d="M204 -34Q216 -56 224 -78" stroke="#F7C93C" stroke-width="2" fill="none"/>'
    o += V.non(100, -14, '#2E5AA8').replace('<ellipse cy="1" rx="11" ry="3.4" fill="#0A4A30" opacity=".3"/>', '')
    return o + '</g></g>'

def phue():
    o = HG + water_fx(492, .78, .14, 3)
    o += '<linearGradient id="hueSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E2F7E"/><stop offset=".38" stop-color="#7A5AB4"/><stop offset=".68" stop-color="#E788A4"/><stop offset="1" stop-color="#FFC88C"/></linearGradient>'
    o += '<linearGradient id="hueWat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9A0A8"/><stop offset=".3" stop-color="#8A64AE"/><stop offset=".7" stop-color="#3E3C8A"/><stop offset="1" stop-color="#242A62"/></linearGradient>'
    o += '<rect width="1280" height="480" fill="url(#hueSky)"/>'
    o += clouds([(120, 76, 300, 22, '#F2A4C0'), (450, 118, 250, 15, '#FFC4B0'), (780, 66, 340, 24, '#E88ABA'), (1010, 150, 240, 15, '#FFC4A0'), (250, 182, 210, 11, '#FFB6A0')])
    o += stars(24, 90) + birds([(860, 196), (896, 176), (936, 204), (150, 150), (186, 166)], '#2E2460')
    # mặt trời lặn sau núi Ngự
    o += '<circle cx="1064" cy="356" r="36" fill="#FFE29A"/>' + G.halo(1064, 356, 150, 1)
    far = '<path d="M-10 410C60 350 120 362 190 330C260 300 330 340 420 320C500 300 560 346 640 330C740 306 820 356 900 342C960 332 1000 380 1290 356V450H-10Z" fill="#7A6AB8"/>'
    far += '<path d="M640 430C760 380 880 400 960 372C1010 330 1060 306 1090 304C1124 306 1170 340 1200 372C1240 384 1262 380 1290 376V450H640Z" fill="#54508E"/>'
    far += '<path d="M840 444C900 416 980 424 1050 418C1120 412 1200 424 1290 416V444Z" fill="#2E4A5A"/>' + ''.join('<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s"/>' % (R.randint(840, 1290), R.randint(420, 440), R.randint(16, 34), R.randint(7, 14), R.choice(['#2E5A5A', '#264A52', '#3A6A5A'])) for _ in range(34))
    o += far
    o += '<rect y="438" width="1280" height="282" fill="url(#hueWat)"/>'
    bridge = trangtien(884, 436, 66, 6)
    o += bridge
    land = 'M-10 396H800Q870 400 890 446Q900 470 890 486H-10Z'
    ngo = f'<g transform="translate(470 438)">' + ngomon() + '</g>'
    # cây sau công trình
    o += '<g style="filter:brightness(.7) saturate(1.1)">' + V.tree(40, 400, 1.5) + V.tree(880, 410, 1.2) + V.tree(120, 392, 1.1) + V.tree(820, 400, .9) + '</g>'
    o += f'<path d="{land}" fill="#5F8F4E" stroke="{INK}" stroke-width="1.4"/>'
    o += ngo
    # hào sen + cầu đá trước cửa
    o += '<path d="M60 446H880Q890 460 884 472H60Z" fill="#7C6CB0" stroke="#3E3428" stroke-width="1.2"/>'
    o += ''.join(V.lotusleaf(x, y, 8) for x, y in [(90, 460), (150, 456), (214, 464), (270, 455), (330, 462), (610, 462), (668, 456), (726, 464), (780, 456), (840, 462)])
    o += ''.join(V.lotus(x, y, .4) for x, y in [(180, 458), (300, 456), (640, 458), (760, 460)])
    o += '<path d="M410 438H530L546 480H394Z" fill="#B0A694" stroke="#3E3428" stroke-width="1.2"/>'
    for k in range(5): o += f'<path d="M{408 - k * 3} {444 + k * 8}H{532 + k * 3}" stroke="#8A8070" stroke-width="1"/>'
    for sg, x0, x1 in ((-1, 410, 394), (1, 530, 546)):
        o += f'<path d="M{x0} 432L{x1} 472" stroke="#D4CCBA" stroke-width="5"/><path d="M{x0} 438L{x1} 480" stroke="#6E6658" stroke-width="1.6"/>'
        for t in (0, .33, .66, 1): o += f'<rect x="{x0 + (x1 - x0) * t - 3:.0f}" y="{430 + 44 * t:.0f}" width="6" height="11" fill="#E4DCCA" stroke="#3E3428" stroke-width=".8"/>'
    o += G.stonequay((-10, 472), (890, 472), (884, 494), (-10, 494))
    # mặt sông: bóng
    o += '<g filter="url(#wob)" mask="url(#pfm)">' + ''.join(f'<rect x="{x}" y="{505 + i * 6}" width="{w}" height="150" fill="{c}" opacity=".32"/>' for i, (x, w, c) in enumerate([(960, 200, '#FFC66E'), (1040, 60, '#FFE29A')])) + '</g>'
    o += mirror(ngo + bridge, 492, 494) + mirror(far, 492, 494)
    o += ripples(170, 500, 636, ['#FFC4A0', '#FFE29A', '#E9A0C8', '#BFB0F0'])
    o += ripples(30, 500, 640, ['#FFE29A', '#FFF3C2'], 960, 1180, 20, 90, .5, .9)
    o += glints(70, 504, 634, ['#FFE29A', '#FFC4A0', '#fff'])
    # đò nhỏ + hoa đăng
    o += '<g class="rock" style="animation-delay:-1.2s">' + V.sampan(232, 566, .74) + '</g>'
    o += '<g class="rock" style="animation-delay:-2.2s">' + V.sampan(1104, 522, .4) + '</g>'
    o += dragonboat(668, 574, 1.05)
    for x, y, s_ in [(120, 616, .7), (952, 590, .8), (1002, 622, .66), (1168, 600, .74), (1216, 622, .6)]: o += G.hoadang(x, y, s_, R.choice(G.LC_))
    # đường ven sông
    pal = ['#C4A67E', '#B99A72', '#CFB48C', '#A98C66', '#BFA078']
    road = 'M-10 642Q640 628 1290 646V730H-10Z'
    o += phuong(52, 642, .86) + phuong(1228, 646, .84)
    o += promenade(road, 628, pal, '#7A6244')
    for x0, x1 in ((6, 1274),): o += rail(x0, x1, 648, 84, 16)
    o += G.moss(0, 640, 1280, 652, 40) + lamp(170, 662, 118) + lamp(952, 660, 118)
    o += aodai(376, 700, '#7A4FB0', 1.08) + aodai(420, 696, '#B98AD8', 1.04, -1) + aodai(468, 702, '#F7F2FF', 1.06)
    o += P.xichlo(872, 700, .95, '#B02A3E', '#7A2A5A', '#F2F2E8') + G.walker(742, 700, '#2FB8C6', s=1.1) + V.non(1148, 702, '#D9543C', True) + G.bike(1040, 706)
    o += V.kitsu(236, 704, 92, 'ehappy', 'walk')
    for t, x, y, dn in [('Ngọ Môn', 470, 112, True), ('Sông Hương', 318, 512, False), ('Thuyền rồng', 700, 476, False), ('Cầu Tràng Tiền', 1090, 396, True), ('Áo dài', 396, 590, False)]:
        o += G.bubble(x, y, t, dn)
    return o

# ---------- ĐÀ NẴNG ----------
def tower(x, w, top, base, col, wc=('#FFE29A', '#FFC66E', '#BFE4FF'), crown=None, dens=.6):
    o = f'<rect x="{x}" y="{top}" width="{w}" height="{base - top}" fill="{col}" stroke="#0A0C24" stroke-width=".8"/>'
    step_x, step_y = max(6, w // 7), 9
    yy = top + 6
    while yy < base - 6:
        xx = x + 3
        while xx < x + w - 4:
            if R.random() < dens: o += f'<rect x="{xx}" y="{yy}" width="3.6" height="5" fill="{R.choice(wc)}" opacity="{R.uniform(.55, 1):.2f}"/>'
            xx += step_x
        yy += step_y
    if crown: o += f'<rect class="tw" style="--t:3s" x="{x}" y="{top - 3}" width="{w}" height="4" fill="{crown}"/><path d="M{x + w / 2} {top}v-16" stroke="#C8C8E0" stroke-width="1.6"/><circle class="tw" style="--t:2s" cx="{x + w / 2}" cy="{top - 18}" r="2.2" fill="#F2484A"/>'
    return o

def skyline():
    o = '<path d="M820 372C900 300 960 262 1040 250C1110 240 1200 276 1290 262V380H820Z" fill="#141A52"/>'
    for x, w, h in [(0, 54, 150), (60, 40, 110), (110, 62, 120), (182, 44, 150), (236, 56, 98), (300, 48, 132), (356, 62, 104), (430, 46, 158), (484, 58, 118), (552, 44, 96), (604, 58, 142), (672, 46, 104), (726, 56, 130), (792, 46, 92), (846, 58, 116), (912, 46, 88), (968, 52, 112), (1028, 44, 84), (1082, 56, 104), (1148, 48, 80), (1204, 64, 100)]:
        o += tower(x, w, 372 - h, 374, R.choice(['#1E2460', '#262A70', '#1A2058']), dens=.42)
    for x, w, h, c, cr in [(8, 56, 262, '#2A3480', '#2FB8C6'), (216, 48, 206, '#32308A', '#F268A6'), (470, 52, 186, '#2A3480', '#F7B91A'), (640, 44, 216, '#32308A', '#2FB8C6'), (1000, 48, 190, '#2A3480', '#7FD45A')]:
        o += tower(x, w, 374 - h, 376, c, crown=cr, dens=.68)
    o += ''.join(f'<rect x="{R.randint(0, 1260)}" y="{R.randint(366, 376)}" width="{R.randint(10, 26)}" height="4" fill="{R.choice(["#FFE29A", "#F268A6", "#2FB8C6"])}" opacity=".85"/>' for _ in range(26))
    return o

def swingbridge():
    """Cầu sông Hàn (cầu quay): dầm trắng, tháp chữ A nghiêng và dây văng."""
    o = '<path d="M1026 356H1290" stroke="#E9ECF8" stroke-width="5"/><path d="M1026 361H1290" stroke="#2A3480" stroke-width="2"/>'
    for x in (1050, 1100, 1200, 1250): o += f'<rect x="{x - 5}" y="360" width="10" height="20" fill="#C8CCE0" stroke="#10143A"/>'
    o += '<ellipse cx="1150" cy="378" rx="30" ry="6" fill="#C8CCE0" stroke="#10143A"/><rect x="1132" y="358" width="36" height="20" fill="#AEB2D0" stroke="#10143A"/>'
    o += '<path d="M1132 356L1150 280L1168 356" stroke="#F4F6FF" stroke-width="5" fill="none"/><path d="M1150 280v-12" stroke="#FFE29A" stroke-width="3"/>'
    for k in range(6):
        o += f'<path d="M1150 {286 + k * 3}L{1080 + k * 11} 354M1150 {286 + k * 3}L{1220 - k * 11} 354" stroke="#BFE4FF" stroke-width=".9"/>'
    return o + ''.join(f'<circle class="tw" style="--t:2.6s;--d:-{k * .4:.1f}s" cx="{1036 + k * 26}" cy="352" r="1.6" fill="#FFE29A"/>' for k in range(10))

DRD = 400
HUMPS = [(40, 200, 64), (200, 490, 216), (490, 790, 236)]
HEAD = (926, 178)
def body_pts():
    p = []
    low = DRD + 26
    for a, b, h in HUMPS:
        for x in range(a, b, 5):
            t = (x - a) / (b - a)
            p.append((x, low - (h + 26) * (.5 - .5 * math.cos(2 * math.pi * t))))
    a = HUMPS[-1][1]
    for x in range(a, HEAD[0] + 1, 5):
        t = (x - a) / (HEAD[0] - a)
        p.append((x, low - (low - HEAD[1]) * (.5 - .5 * math.cos(math.pi * t))))
    return p

def dragon_body():
    pts = body_pts(); top, bot = [], []
    W = lambda x: 5 + 19 * (x - 40) / (HEAD[0] - 40)
    n = len(pts)
    for i, (x, y) in enumerate(pts):
        a = pts[max(i - 1, 0)]; b = pts[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L; w = W(x)
        top.append((x + nx * w * -1, y + ny * -w)); bot.append((x + nx * w, y + ny * w))
    d = 'M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in top + bot[::-1]) + 'Z'
    o = f'<path d="{d}" fill="#FFC83A" filter="url(#dnBlur)" opacity=".9"/>'
    # dây treo từ thân xuống mặt cầu
    for x, y in pts[::5]:
        if y < DRD - 8: o += f'<path d="M{x} {y:.0f}V{DRD}" stroke="#FFF3C2" stroke-width="1.1" opacity=".75"/>'
    o += f'<path d="{d}" fill="url(#dnBody)" stroke="#7A3A08" stroke-width="2"/>'
    leds = ['#FFE27A', '#FFF3C2', '#FFB23A']
    for i in range(0, n, 3):
        x, y = pts[i]; a = pts[max(i - 1, 0)]; b = pts[min(i + 1, n - 1)]
        ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0])); w = W(x)
        for off in (-.5, .1, .6):
            yy = off * w
            if w < 9 and off != .1: continue
            o += f'<g transform="translate({x} {y:.1f}) rotate({ang:.0f})"><path d="M-5 {yy:.1f}a5 {min(5, w / 3):.1f} 0 0 0 10 0" fill="none" stroke="#B8640E" stroke-width="1"/><circle class="tw" style="--t:{R.uniform(1.6, 3.4):.1f}s;--d:-{R.uniform(0, 3):.1f}s" cy="{yy:.1f}" r="1.3" fill="{R.choice(leds)}"/></g>' if i % 6 == 0 or off == .1 else ''
    for i in range(0, n, 6):
        x, y = top[i]
        a = pts[max(i - 1, 0)]; b = pts[min(i + 1, n - 1)]
        ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0])); s = .5 + W(pts[i][0]) / 18
        o += f'<path transform="translate({x:.1f} {y:.1f}) rotate({ang:.0f}) scale({s:.2f})" d="M-5 1L2 -9L6 1Z" fill="#FF8A2A" stroke="#7A3A08" stroke-width=".7"/>'
    return o

def dragon_head(x, y, s=1.2):
    o = f'<g transform="translate({x} {y}) scale({s})">'
    # bờm lửa sau gáy
    for ax, ay, l, r in [(-20, -30, 48, -150), (-34, -14, 52, -175), (-36, 6, 46, 160), (-26, 22, 40, 130), (-6, 32, 30, 100), (20, 34, 24, 96), (42, 32, 18, 92)]:
        o += f'<path transform="translate({ax} {ay}) rotate({r})" d="M0 -9Q{l * .6} -8 {l} 0Q{l * .6} 8 0 9Z" fill="#FF9A2A" stroke="#7A3A08"/>'
    o += '<path d="M4 -34C-14 -60 -40 -66 -68 -56C-44 -52 -22 -44 -8 -24ZM22 -36C10 -60 -8 -72 -36 -72C-16 -62 0 -50 8 -32Z" fill="#FFF3C2" stroke="#7A3A08" stroke-width="1.4"/>'
    o += '<path d="M-34 20C-30 -16 -6 -36 24 -38C46 -40 62 -32 86 -36C98 -38 104 -26 94 -20C76 -12 62 -10 46 -6C56 4 66 8 80 8C90 10 88 22 76 24C44 32 0 38 -34 20Z" fill="url(#dnBody)" stroke="#7A3A08" stroke-width="2"/>'
    o += '<path d="M46 -6C56 4 66 8 80 8L92 -19C76 -12 62 -10 46 -6Z" fill="#7A1A10"/>'
    o += ''.join(f'<path d="M{a} {b}l3 7l3 -7Z" fill="#fff"/>' for a, b in [(58, -11), (66, -12.5), (74, -14.5), (82, -16.5)])
    o += ''.join(f'<path d="M{a} {b}l3 -7l3 7Z" fill="#fff"/>' for a, b in [(60, 5), (68, 8), (76, 9)])
    o += '<circle cx="30" cy="-20" r="7" fill="#fff" stroke="#7A3A08" stroke-width="1.6"/><circle cx="32" cy="-20" r="3.4" fill="#D92F2F"/><circle cx="33" cy="-21" r="1" fill="#fff"/>'
    o += '<path d="M14 -30Q28 -36 42 -28" stroke="#7A3A08" stroke-width="3" fill="none"/><circle cx="88" cy="-29" r="2" fill="#7A3A08"/>'
    o += '<path d="M92 -32C110 -48 122 -46 136 -60M84 22C100 38 116 38 128 52" stroke="#FFE27A" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
    for a, b, r_ in [(-8, -8, 7), (6, 6, 7), (-14, 12, 6), (18, 14, 6), (36, 18, 5)]:
        o += f'<path d="M{a - r_} {b}a{r_} {r_} 0 0 0 {2 * r_} 0" fill="none" stroke="#B8640E" stroke-width="1.2"/>'
    return o + '</g>'

def fire(x, y):
    o = f'<g transform="translate({x} {y}) rotate(-11)">'
    o += '<path d="M0 0C70 -46 150 -34 262 -66C218 -34 240 -14 292 -6C226 12 216 26 256 54C160 44 70 40 0 12Z" fill="#FF7A1A" filter="url(#dnBlur)" opacity=".85"/>'
    o += '<path d="M0 0C70 -40 150 -30 250 -60C210 -30 230 -12 276 -4C214 10 206 24 240 48C160 40 70 36 0 12Z" fill="url(#dnFire)" stroke="#E2361A" stroke-width="1.2"/>'
    o += '<path class="ff" style="--t:.9s" d="M6 2C70 -22 130 -14 210 -30C180 -12 190 -2 226 2C174 12 168 18 192 30C130 24 70 22 6 10Z" fill="#FFD23A"/>'
    o += '<path class="ff" style="--t:.7s;--d:-.3s" d="M8 5C60 -6 110 -2 158 -8C140 0 146 6 164 8C124 12 70 14 8 9Z" fill="#FFF7C2"/>'
    o += '<path class="ff" style="--t:1.2s;--d:-.5s" d="M120 -40C170 -70 210 -66 240 -92C226 -66 214 -54 186 -34Z" fill="#FF9A2A"/>'
    o += '<path class="ff" style="--t:1s;--d:-.2s" d="M130 34C170 56 200 60 226 82C214 58 204 44 180 28Z" fill="#FF9A2A"/>'
    for _ in range(30):
        o += '<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="%s"/>' % (R.uniform(.8, 2), R.uniform(0, 2), R.randint(90, 310), R.randint(-90, 80), R.uniform(1, 2.4), R.choice(['#FFD23A', '#FF9A2A', '#FFF3C2']))
    return o + '</g>'

def dragonbridge():
    o = ''
    for x in (200, 490, 790):
        o += f'<path d="M{x - 26} {DRD + 6}H{x + 26}L{x + 16} {DRD + 46}H{x - 16}Z" fill="#3A4288" stroke="#0A0C24" stroke-width="1.4"/><ellipse cx="{x}" cy="{DRD + 46}" rx="26" ry="5" fill="#2A3480" stroke="#0A0C24"/><rect x="{x - 14}" y="{DRD + 8}" width="6" height="36" fill="#7FB8F0" opacity=".4"/>'
    o += dragon_body()
    o += f'<rect x="-10" y="{DRD - 6}" width="1300" height="14" fill="#232868" stroke="#0A0C24" stroke-width="1.4"/><rect x="-10" y="{DRD + 6}" width="1300" height="3" fill="#FFC83A"/><path d="M-10 {DRD - 12}H1290" stroke="#BFC4E8" stroke-width="1.6"/>'
    for x in range(10, 1280, 30): o += f'<path d="M{x} {DRD - 6}v-6" stroke="#BFC4E8"/>'
    for x in range(30, 1280, 120): o += f'<path d="M{x} {DRD - 6}v-24q0 -5 7 -5" stroke="#8A90C4" stroke-width="1.6" fill="none"/>' + G.halo(x + 8, DRD - 34, 18) + f'<circle cx="{x + 8}" cy="{DRD - 34}" r="2.4" fill="#FFF3C2"/>'
    return o

def cruiseboat(x, y, s=1, c='#2A6A8A'):
    o = f'<g class="rock"><g transform="translate({x} {y}) scale({s})"><ellipse cy="14" rx="150" ry="9" fill="#FFAE4A" opacity=".28"/><path d="M-138 -14Q-120 12 -90 14H104Q134 10 150 -20L126 -12H-110Z" fill="{c}" stroke="#0C1030" stroke-width="2"/><path d="M-124 -8H136" stroke="#FFF3C2" stroke-width="2.4"/>'
    o += '<rect x="-96" y="-52" width="192" height="40" fill="#F4EFE2" stroke="#0C1030" stroke-width="1.6"/>'
    for k in range(9): o += f'<rect x="{-90 + k * 20}" y="-46" width="15" height="24" fill="#FFD27A" stroke="#6A4A1A" stroke-width=".8"/>'
    o += '<path d="M-106 -52H106L98 -62H-98Z" fill="#D9432E" stroke="#0C1030" stroke-width="1.4"/>'
    for k in range(9): o += G.den(-88 + k * 22, -52, .42, G.LC_[k % 6], 3)
    return o + '</g></g>'

def pdanang():
    o = HG + water_fx(446, .85, .14, 5, 18)
    o += '<linearGradient id="dnSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050828"/><stop offset=".55" stop-color="#141C5E"/><stop offset=".85" stop-color="#3A2078"/><stop offset="1" stop-color="#7A2A7A"/></linearGradient>'
    o += '<linearGradient id="dnWat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1E6A"/><stop offset=".5" stop-color="#101A52"/><stop offset="1" stop-color="#070E30"/></linearGradient>'
    o += '<linearGradient id="dnBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset=".55" stop-color="#F7B91A"/><stop offset="1" stop-color="#D1780E"/></linearGradient>'
    o += '<radialGradient id="dnFire" cx="0" cy=".4" r="1"><stop offset="0" stop-color="#FFF3C2"/><stop offset=".35" stop-color="#FFC83A"/><stop offset=".7" stop-color="#FF7A1A"/><stop offset="1" stop-color="#E2361A"/></radialGradient>'
    o += '<filter id="dnBlur" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>'
    o += '<rect width="1280" height="400" fill="url(#dnSky)"/>' + stars(90, 240)
    o += clouds([(160, 80, 320, 16, '#2A2E7A'), (760, 60, 300, 14, '#30307E'), (1060, 130, 240, 11, '#3A2E80')], .6)
    o += G.halo(660, 74, 60, .4) + '<path d="M672 54A22 22 0 1 0 678 88A18 18 0 1 1 672 54Z" fill="#FFF3C2"/>'
    far = skyline()
    o += far
    o += '<rect y="372" width="1280" height="348" fill="url(#dnWat)"/>' + f'<rect y="372" width="1280" height="28" fill="#FF9A5A" opacity=".1"/>'
    o += swingbridge()
    o += ''.join(f'<path class="lap" style="--t:4s;--d:-{k % 4}s" d="M{R.randint(0, 1260)} {R.randint(376, 392)}h{R.randint(12, 44)}" stroke="{R.choice(["#FFE29A", "#F268A6", "#2FB8C6"])}" stroke-width="2" opacity=".6"/>' for k in range(50))
    br = dragonbridge()
    hd = dragon_head(HEAD[0] + 8, HEAD[1] + 2, 1.15); fi = fire(HEAD[0] + 104, HEAD[1] - 4)
    o += br + fi + hd
    # xe chạy trên cầu
    for k, (c, t) in enumerate([('#F2484A', 22), ('#FFF3C2', 30), ('#2FB8C6', 26)]):
        o += f'<g transform="translate({(340, 690, 1060)[k]} 0)"><g class="drift" style="--t:{t}s;--d:-{k * 7}s"><rect x="0" y="{DRD - 12}" width="17" height="7" rx="2.5" fill="{c}" stroke="#0C1030"/><circle cx="4" cy="{DRD - 5}" r="1.8" fill="#0C1030"/><circle cx="13" cy="{DRD - 5}" r="1.8" fill="#0C1030"/></g></g>'
    # bóng nước: thân rồng, lửa, sắc đèn
    o += '<g filter="url(#wob)" mask="url(#pfm)">' + ''.join(f'<rect x="{x}" y="456" width="{w}" height="180" fill="{c}" opacity=".3"/>' for x, w, c in [(30, 60, '#2FB8C6'), (216, 50, '#F268A6'), (470, 54, '#F7B91A'), (640, 46, '#2FB8C6'), (1000, 200, '#FF7A1A')]) + '</g>'
    o += mirror(br + fi + hd, 446, 448, 640)
    o += ripples(190, 450, 636, ['#FFC66E', '#FFE29A', '#F268A6', '#2FB8C6', '#BFE4FF'])
    o += ripples(40, 450, 620, ['#FF9A2A', '#FFC83A'], 960, 1240, 20, 80, .5, .9)
    o += glints(90, 450, 636, ['#FFE29A', '#FFC66E', '#fff'])
    o += cruiseboat(380, 566, .92) + '<g class="rock" style="animation-delay:-2s">' + V.sampan(1060, 590, .5) + '</g>'
    # đường ven sông
    pal = ['#8A82A4', '#7A7298', '#958CAE', '#6E668C', '#837BA0']
    road = 'M-10 640Q640 626 1290 644V730H-10Z'
    o += promenade(road, 626, pal, '#3E3860')
    o += '<rect width="1280" height="94" y="626" fill="#FFC66E" opacity=".1"/>'
    # lan can sắt
    o += '<path d="M-10 622Q640 608 1290 626" stroke="#14163A" stroke-width="4" fill="none"/><path d="M-10 632Q640 618 1290 636" stroke="#14163A" stroke-width="1.6" fill="none"/>'
    for x in range(0, 1281, 18):
        t = x / 1280; y0 = 622 - 56 * t * (1 - t) + 4 * t
        o += f'<path d="M{x} {y0:.0f}v22" stroke="#14163A" stroke-width="{3 if x % 90 == 0 else 1.4}"/>'
    o += lamp(170, 668, 128, '#14163A') + lamp(640, 660, 128, '#14163A') + lamp(1120, 668, 128, '#14163A')
    o += G.halo(170, 690, 90, .6) + G.halo(640, 684, 90, .6) + G.halo(1120, 690, 90, .6)
    o += G.palm(70, 708, 1.15) + G.palm(1226, 706, 1.15)
    o += G.stall(902, 664, '#2FB8C6') + G.walker(460, 700, '#F268A6', s=1.14) + G.walker(492, 696, '#2FB8C6', '#7A4A2A', s=1.1) + G.walker(760, 702, '#F7B91A', s=1.16) + aodai(1046, 700, '#E8418F', 1.04, 1, False) + G.bike(560, 708) + V.non(350, 702, '#D9543C', True)
    o += V.kitsu(236, 708, 92, 'ehappy', 'walk')
    for t, x, y, dn in [('Cầu Rồng', 344, 142, True), ('Lửa rồng', 1120, 44, False), ('Sông Hàn', 84, 498, False), ('Cao ốc', 62, 78, True), ('Cầu quay', 1150, 226, True)]:
        o += G.bubble(x, y, t, dn)
    return o

# ---------- NHA TRANG ----------
def kalan(cx, base, s=1):
    """Tháp Chăm: thân gạch vuông có trụ áp, tiền sảnh vòm nhọn, các tầng thu nhỏ có tháp góc, chóp."""
    o = f'<g transform="translate({cx} {base}) scale({s})">'
    o += brick(-84, -14, 168, 14, line='#5A2A1A') + brick(-76, -30, 152, 16, line='#5A2A1A')
    o += brick(-66, -176, 132, 148)
    for x in (-66, -44, 30, 52): o += brick(x, -176, 14, 148, ('#C9784A', '#D08A58', '#BC6A40'), bh=6)
    for x in (-52, 40):
        o += f'<path d="M{x} -128L{x + 8} -152L{x + 16} -128V-60H{x}Z" fill="#7A3A22" stroke="#4E2010"/>'
    o += f'<rect x="-70" y="-182" width="140" height="8" fill="#D08A58" stroke="#5A2A1A"/><rect x="-74" y="-190" width="148" height="8" fill="#A85234" stroke="#5A2A1A"/>'
    # tiền sảnh + vòm cửa
    o += brick(-34, -118, 68, 92, ('#C9784A', '#D08A58', '#B8603A'))
    o += '<path d="M-40 -118Q-30 -142 -14 -146Q-4 -152 0 -174Q4 -152 14 -146Q30 -142 40 -118Z" fill="#B8603A" stroke="#5A2A1A" stroke-width="1.4"/><path d="M-22 -122Q-10 -134 0 -152Q10 -134 22 -122Z" fill="#8F4A2A"/><circle cy="-130" r="6" fill="#D9A878" stroke="#5A2A1A"/>'
    o += '<rect x="-18" y="-96" width="36" height="66" fill="#16100E" stroke="#D9D0C0" stroke-width="2.4"/>'
    # các tầng
    tiers = [(-190, 58, 46), (-236, 46, 40), (-276, 34, 34)]
    for y, hw, h in tiers:
        o += brick(-hw, y - h, 2 * hw, h)
        o += f'<rect x="{-hw - 4}" y="{y - h - 6}" width="{2 * hw + 8}" height="6" fill="#A85234" stroke="#5A2A1A"/>'
        o += f'<path d="M-12 {y}V{y - h * .55}L0 {y - h}L12 {y - h * .55}V{y}Z" fill="#7A3A22" stroke="#4E2010"/>'
        for sg in (-1, 1):
            xx = sg * (hw + 2)
            o += f'<path d="M{xx - 11} {y + 1}V{y - 18}L{xx - 7} {y - 22}V{y - 30}L{xx} {y - 40}L{xx + 7} {y - 30}V{y - 22}L{xx + 11} {y - 18}V{y + 1}Z" fill="#C9784A" stroke="#5A2A1A"/><path d="M{xx - 3} {y + 1}v-15h6v15Z" fill="#7A3A22"/>'
    o += '<path d="M-22 -316Q-24 -344 0 -362Q24 -344 22 -316Z" fill="#B8603A" stroke="#5A2A1A"/><path d="M-22 -326h44M-18 -340h36" stroke="#7A3A22"/>'
    # mảng tối bên phải + rêu
    o += '<path d="M28 -30V-176H66V-30Z" fill="#3A1A10" opacity=".22"/>'
    o += ''.join('<ellipse cx="%d" cy="%d" rx="%.0f" ry="%.1f" fill="%s" opacity=".55"/>' % (R.randint(-54, 54) if y_ > -176 else R.randint(-int((y_ + 330) * .28), int((y_ + 330) * .28)), y_, R.uniform(3, 8), R.uniform(1.2, 2.8), R.choice(['#3E5A3A', '#5A3A2A', '#2F4A36'])) for y_ in [R.randint(-290, -20) for _ in range(34)])
    return o + '</g>'

def pillar(x, y, s=1):
    o = f'<g transform="translate({x} {y}) scale({s})"><ellipse cy="2" rx="20" ry="4" fill="#120A08" opacity=".3"/><path d="M-19 0V-10L-15 -13H15L19 -10V0Z" fill="#7A4030" stroke="#3A1A10"/>'
    o += brick(-13, -86, 26, 74, ('#C9784A', '#D9925C', '#B8603A', '#CF8250'))
    o += '<path d="M5 -86H13V-12H5Z" fill="#3A1A10" opacity=".26"/><path d="M-6 -86H-13V-12H-6Z" fill="#fff" opacity=".1"/>'
    o += '<path d="M-17 -86L-20 -90V-96L-14 -101H14L20 -96V-90L17 -86Z" fill="#5A3A2E" stroke="#2A1610"/><path d="M-14 -101L-9 -105H9L14 -101Z" fill="#8A6A5A" stroke="#2A1610"/>'
    return o + '</g>'

def coco(x, y, s=1, lean=26):
    o = f'<path d="M{x - 5 * s} {y}Q{x - 2 * s + lean * .2} {y - 100 * s} {x + lean * s} {y - 186 * s}L{x + (lean + 6) * s} {y - 184 * s}Q{x + 12 * s} {y - 100 * s} {x + 6 * s} {y}Z" fill="#8A6A48" stroke="{INK}"/>'
    tx, ty = x + (lean + 3) * s, y - 188 * s
    for k in range(4): o += f'<path d="M{x - 3 * s + k * lean * s * .22:.0f} {y - 40 * s - k * 36 * s:.0f}h{9 * s:.0f}" stroke="#5A4230" stroke-width="1.4"/>'
    g = '<g>'
    for a in (-170, -140, -112, -80, -48, -18, 12, 170, 200):
        r = math.radians(a); L = 92 * s; ex, ey = tx + math.cos(r) * L, ty + math.sin(r) * L * .55 + 34 * s
        mx, my = tx + math.cos(r) * L * .55, ty + math.sin(r) * L * .55 - 14 * s
        g += f'<path d="M{tx:.0f} {ty:.0f}Q{mx:.0f} {my:.0f} {ex:.0f} {ey:.0f}Q{mx:.0f} {my + 16 * s:.0f} {tx:.0f} {ty:.0f}Z" fill="{R.choice(["#2FA860", "#1F8A4E", "#3CCB6B"])}" stroke="#0B6A42" stroke-width=".8"/>'
    o += f'<g class="sway" style="--t:{4 + x % 3}s;--d:-{x % 4}s;transform-origin:{tx:.0f}px {ty:.0f}px">' + g + '</g></g>'
    return o + f'<circle cx="{tx - 4 * s:.0f}" cy="{ty + 5 * s:.0f}" r="{4 * s:.1f}" fill="#6B4322"/><circle cx="{tx + 5 * s:.0f}" cy="{ty + 6 * s:.0f}" r="{4 * s:.1f}" fill="#7A5230"/>'

def thung(x, y, s=1, net=False, wet=False):
    """Thuyền thúng: tre đan, trát đen phần dưới, vành buộc tròn."""
    c = V.uid()
    o = f'<g transform="translate({x} {y}) scale({s})"><ellipse cy="28" rx="66" ry="10" fill="#3A2A18" opacity="{0 if wet else .32}"/>'
    bowl = 'M-60 -6Q-56 28 -22 34H22Q56 28 60 -6Z'
    o += f'<clipPath id="{c}"><path d="{bowl}"/></clipPath><path d="{bowl}" fill="#8A6438" stroke="{INK}" stroke-width="1.6"/><g clip-path="url(#{c})">'
    for k in range(-13, 14): o += f'<path d="M{k * 9} -8Q{k * 7} 12 {k * 4} 38" stroke="#5A4024" stroke-width="1.2" fill="none"/>'
    for r in range(5): o += f'<path d="M-66 {2 + r * 7}Q0 {16 + r * 7} 66 {2 + r * 7}" stroke="#C9A464" stroke-width="1" fill="none"/>'
    o += '<path d="M-66 18Q0 44 66 18V40H-66Z" fill="#2A2018" opacity=".62"/></g>'
    o += '<ellipse cy="-8" rx="62" ry="17" fill="#3A2A1C" stroke="#1A120C" stroke-width="1"/><ellipse cy="-5" rx="52" ry="11" fill="#6E5234"/>'
    o += '<ellipse cy="-8" rx="62" ry="17" fill="none" stroke="#B8905A" stroke-width="5"/>'
    for k in range(0, 360, 20):
        r = math.radians(k); o += f'<path d="M{62 * math.cos(r):.0f} {-8 + 17 * math.sin(r) - 3:.0f}v6" stroke="#5A4024" stroke-width="1.3"/>'
    if net: o += '<path d="M-30 -8Q-10 -22 24 -6Q4 2 -30 -8Z" fill="#2F8F6A" stroke="#1F6A4E"/>' + ''.join(f'<path d="M{-26 + k * 8} -10l6 7" stroke="#7FD4A8" stroke-width=".6"/>' for k in range(7))
    return o + '</g>'

def fishboat(x, y, s=1, c='#2E7AB8'):
    o = f'<g class="rock"><g transform="translate({x} {y}) scale({s})"><ellipse cy="12" rx="90" ry="6" fill="#0B4A6A" opacity=".35"/><path d="M-84 -18Q-70 12 -40 12H60Q86 8 96 -26Q40 -10 -20 -10Q-60 -10 -84 -18Z" fill="{c}" stroke="{INK}" stroke-width="1.6"/><path d="M-80 -12Q0 2 92 -18" stroke="#FFF9EA" stroke-width="2.6" fill="none"/><path d="M-70 2Q0 12 76 -2" stroke="#D9432E" stroke-width="3" fill="none"/>'
    o += f'<rect x="-30" y="-36" width="46" height="26" fill="#F4EFE2" stroke="{INK}"/><rect x="-24" y="-31" width="14" height="11" fill="#7FCBE0"/><rect x="-6" y="-31" width="14" height="11" fill="#7FCBE0"/><path d="M-36 -36h58" stroke="#D9432E" stroke-width="4"/><path d="M40 -12V-60" stroke="#6B3E1E" stroke-width="2.4"/><circle cx="-62" cy="-8" r="3.4" fill="#fff" stroke="{INK}"/><circle cx="-63" cy="-8" r="1.4" fill="{INK}"/>'
    return o + '</g></g>'

def pnhatrang():
    o = HG + water_fx(372, .55, .08, 7, 12)
    o += '<linearGradient id="ntSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F7FD0"/><stop offset=".5" stop-color="#7FC8EC"/><stop offset=".82" stop-color="#FFE4BC"/><stop offset="1" stop-color="#FFC890"/></linearGradient>'
    o += '<linearGradient id="ntSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FA8C8"/><stop offset=".4" stop-color="#18B4BE"/><stop offset=".8" stop-color="#3CD4C4"/><stop offset="1" stop-color="#A8ECD4"/></linearGradient>'
    o += '<linearGradient id="ntSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E2B0"/><stop offset="1" stop-color="#EBCB8C"/></linearGradient>'
    o += '<filter id="ntBlur" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="12"/></filter>'
    o += '<rect width="1280" height="400" fill="url(#ntSky)"/>'
    o += clouds([(640, 70, 280, 18, '#FFF3E0'), (980, 140, 240, 15, '#FFDCC4'), (1160, 60, 280, 20, '#FFF9F0'), (760, 196, 200, 11, '#FFD8BC')], .85)
    o += birds([(760, 120), (796, 100), (840, 132), (1120, 200), (1150, 186)], '#3A4A6A')
    # mặt trời buổi sáng trên biển
    o += '<circle cx="1044" cy="306" r="28" fill="#FFF3C2"/>' + G.halo(1044, 306, 130, 1)
    # đảo xa
    isl = '<path d="M590 372C640 340 700 350 750 322C800 300 860 346 910 352C940 356 960 366 980 372Z" fill="#6AA0B8"/><path d="M1090 372C1120 346 1160 356 1200 334C1240 320 1270 340 1290 346V372Z" fill="#5A94AE"/><path d="M730 372C770 356 820 360 860 372Z" fill="#4A8AA0"/>'
    o += isl
    o += '<rect y="370" width="1280" height="210" fill="url(#ntSea)"/>'
    o += mirror(isl, 372, 372, 450)
    o += '<path d="M1034 372H1054L1120 530H968Z" fill="#FFF3C2" opacity=".55" filter="url(#ntBlur)"/>'
    o += ripples(120, 378, 548, ['#fff', '#D8F7F0', '#8FE8DC'], 460, 1280, 16, 70, .35, .8)
    o += ripples(34, 378, 500, ['#FFF3C2', '#fff'], 960, 1120, 16, 70, .6, 1)
    o += glints(60, 380, 530, ['#fff', '#FFF3C2'], 460, 1280)
    o += fishboat(830, 438, .62) + fishboat(1140, 398, .42, '#2FA8A0') + fishboat(690, 410, .4, '#D9543C')
    # cát + sóng vỗ
    sand = 'M-10 560C200 540 400 560 640 532C820 512 1040 548 1290 520V730H-10Z'
    o += '<path class="lap" style="--t:5s" d="M-10 548C200 528 400 548 640 520C820 500 1040 536 1290 508V530H-10Z" fill="#E4FBF2" opacity=".9"/>'
    o += '<path class="lap" style="--t:4s;--d:-1s" d="M300 534C460 540 560 520 660 510" stroke="#fff" stroke-width="3" fill="none" opacity=".9"/><path class="lap" style="--t:6s;--d:-2s" d="M820 508C960 500 1120 530 1270 500" stroke="#fff" stroke-width="3" fill="none" opacity=".9"/>'
    o += f'<path d="{sand}" fill="url(#ntSand)"/>'
    o += ''.join('<ellipse cx="%d" cy="%d" rx="%d" ry="1.4" fill="%s" opacity=".6"/>' % (R.randint(0, 1280), R.randint(560, 640), R.randint(4, 20), R.choice(['#D9B878', '#FFF3D0', '#C9A464'])) for _ in range(120))
    # đồi, tháp
    hill = 'M-10 214C60 240 180 268 300 268H420C520 272 560 330 610 396C640 440 660 500 640 540C440 562 200 546 -10 562Z'
    o += f'<path d="{hill}" fill="url(#hill2)" stroke="#0B5A42" stroke-width="1.4"/>'
    o += ''.join('<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s"/>' % (x, y, R.randint(20, 42), R.randint(12, 22), R.choice(['#2F8A5A', '#1F7A4E', '#3AA068', '#25704A'])) for x, y in [(R.randint(0, 640), R.randint(440, 540)) for _ in range(46)])
    for x, y, w_, h in [(40, 520, 90, 40), (170, 534, 60, 26), (500, 524, 80, 36), (590, 500, 50, 30), (340, 540, 70, 22)]:
        o += f'<path d="M{x} {y}Q{x + 6} {y - h} {x + w_ * .4:.0f} {y - h}Q{x + w_} {y - h + 6} {x + w_} {y}Z" fill="#8A8478" stroke="#3E3428" stroke-width="1.2"/><path d="M{x + 10} {y - h * .6:.0f}Q{x + 26} {y - h * .4:.0f} {x + 22} {y - 4}" stroke="#5E584E" fill="none"/>'
    o += V.tree(630, 470, .7) + V.tree(36, 268, .9) + V.tree(610, 356, .8) + V.tree(540, 288, .72)
    # nền gạch: thềm dưới với cột, thềm trên với tháp
    o += brick(0, 416, 560, 26, ('#A85234', '#B8603A', '#94462C'), '#5A2A1A')
    o += '<path d="M0 396H570L586 418H-10Z" fill="#CF9A6A" stroke="#5A2A1A" stroke-width="1.2"/>'
    o += brick(0, 276, 200, 118, ('#8F5038', '#9E5A40', '#7E4632'), '#3E2014') + brick(444, 276, 110, 118, ('#8F5038', '#9E5A40', '#7E4632'), '#3E2014')
    o += '<path d="M0 262H556L566 278H-10Z" fill="#C98E60" stroke="#5A2A1A"/>'
    o += brick(200, 276, 244, 118, ('#8F5038', '#9E5A40', '#7E4632'), '#3E2014')
    # bậc đá dốc lên tháp
    o += '<path d="M268 394L292 276H372L396 394Z" fill="#B87A54" stroke="#5A2A1A" stroke-width="1.4"/>'
    for k in range(1, 15):
        t = k / 15; yy = 276 + 118 * t
        o += f'<path d="M{292 - 24 * t:.0f} {yy:.0f}H{372 + 24 * t:.0f}" stroke="#6E3E26" stroke-width="1.5"/>'
    o += '<path d="M268 394L292 276h-14L250 394ZM396 394L372 276h14L414 394Z" fill="#8F5038" stroke="#5A2A1A"/>'
    # ba tháp + cây sau
    o += kalan(120, 268, .46) + kalan(530, 270, .52) + kalan(332, 266, .66)
    for x, y, s_ in [(34, 416, .94), (120, 416, .98), (206, 416, 1), (458, 416, 1), (544, 416, .98)]: o += pillar(x, y, s_)
    # lư hương đá dưới chân bậc, trang trọng
    o += '<rect x="316" y="404" width="32" height="10" fill="#7A4030" stroke="#3A1A10"/><path d="M322 404q10 -20 20 0Z" fill="#5A5A62" stroke="#2A2A30"/>'
    # thuyền thúng trên cát
    o += thung(736, 584, .92) + thung(888, 566, .8, True) + thung(1040, 594, 1.02, True) + thung(1196, 572, .84) + thung(620, 608, .74)
    o += '<g class="rock" style="animation-delay:-1s">' + thung(1000, 478, .56, False, True) + V.non(1000, 470, '#D9543C').replace('<ellipse cy="1" rx="11" ry="3.4" fill="#0A4A30" opacity=".3"/>', '') + '</g>'
    o += V.non(820, 590, '#2E5AA8') + V.non(960, 616, '#E2C25A') + V.non(1124, 606, '#7FD45A')
    o += '<path d="M1090 626L1250 616" stroke="#6B4322" stroke-width="2"/>' + ''.join(f'<path d="M{1096 + k * 13} {625 - k * .7:.0f}q5 14 -2 22" stroke="#2F8F6A" stroke-width="1.6" fill="none"/>' for k in range(12))
    # đường ven biển + dừa
    pal = ['#D9C4A0', '#CDB68E', '#E4D2B0', '#C4AC84', '#DCC8A4']
    road = 'M-10 652Q640 636 1290 650V730H-10Z'
    o += coco(470, 664, .98, 30) + coco(1252, 664, 1.12, -38)
    o += promenade(road, 636, pal, '#9A8460')
    o += '<path d="M-10 652Q640 636 1290 650" stroke="#FFF9EA" stroke-width="4" fill="none"/>'
    o += coco(36, 690, 1.3, 34) + G.walker(420, 706, '#F268A6', s=1.12) + G.walker(456, 702, '#FFF9EA', '#7A4A2A', s=1.08) + G.bike(530, 708) + G.walker(892, 706, '#2FB8C6', s=1.14) + V.non(1000, 704, '#F7B91A')
    o += V.kitsu(718, 708, 92, 'ehappy', 'walk')
    for t, x, y, dn in [('Tháp Bà', 424, 40, True), ('Hòn đảo', 760, 268, True), ('Biển', 930, 372, False), ('Thuyền thúng', 1040, 522, False), ('Bãi cát', 300, 590, False)]:
        o += G.bubble(x, y, t, dn)
    return o

# ---------- ĐÀ LẠT ----------
def pine(x, y, s=1, c=('#1F5A44', '#2A6E50', '#174A3A'), trunk='#4E3A2E'):
    o = f'<path d="M{x - 2.5 * s:.1f} {y}L{x - .8 * s:.1f} {y - 200 * s:.1f}H{x + .8 * s:.1f}L{x + 2.5 * s:.1f} {y}Z" fill="{trunk}"/>'
    for k in range(7):
        t = k / 6; yy = y - (70 + 130 * t) * s; w = (40 - 26 * t) * s * (1 + (k % 2) * .15)
        sg = -1 if k % 2 else 1
        o += f'<path d="M{x} {yy + 8 * s:.1f}Q{x + sg * w * .6:.1f} {yy:.1f} {x + sg * w:.1f} {yy - 6 * s:.1f}" stroke="{trunk}" stroke-width="{1.6 * s:.1f}" fill="none"/>'
        for dx, r in ((-w, .55), (-w * .4, .75), (w * .3, .8), (w, .55)):
            o += f'<ellipse cx="{x + dx:.1f}" cy="{yy - 4 * s:.1f}" rx="{20 * s * r:.1f}" ry="{9 * s * r:.1f}" fill="{R.choice(c)}"/>'
    return o

def pines(n, x0, x1, yf, s0, s1, c, trunk='#4E3A2E'):
    o = ''
    pts = sorted((R.randint(x0, x1), R.uniform(s0, s1)) for _ in range(n))
    for x, s in pts: o += pine(x, yf(x), s, c, trunk)
    return o

def station(cx, base):
    """Ga Đà Lạt theo ảnh: ba đầu hồi nhọn tường vàng, mái ngói nâu đỏ lớn, mái hiên bo tròn, cột đỏ."""
    o = f'<g transform="translate({cx} {base})">'
    # hai cánh: mái chính
    wl = 'M-350 -120L-300 -176H-150V-120Z'; wr = 'M150 -130V-204H300L392 -120Z'
    o += V.tiles(wl, -352, -178, -148, -118, '#A85A3A', '#7A3A22', 9) + V.tiles(wr, 148, -206, 394, -118, '#A85A3A', '#7A3A22', 9)
    # thân cánh
    o += f'<rect x="-340" y="-122" width="210" height="60" fill="#F0C65A" stroke="{INK}"/><rect x="140" y="-124" width="244" height="62" fill="#F0C65A" stroke="{INK}"/>'
    o += '<rect x="140" y="-124" width="244" height="6" fill="#FFF3D0" stroke="#8A6A3A"/><rect x="140" y="-92" width="244" height="5" fill="#FFF3D0"/>'
    for k in range(13):
        o += f'<rect x="{150 + k * 18}" y="-114" width="13" height="19" fill="#FFF9EA" stroke="#6E5A3A"/><path d="M{156 + k * 18} -114v19M{150 + k * 18} -105h13" stroke="#6E5A3A" stroke-width=".8"/>'
    for k in range(9):
        o += f'<rect x="{-330 + k * 22}" y="-112" width="15" height="19" fill="#FFF9EA" stroke="#6E5A3A"/><path d="M{-323 + k * 22} -112v19M{-330 + k * 22} -103h15" stroke="#6E5A3A" stroke-width=".8"/>'
    # tường giữa, dưới ba đầu hồi
    o += f'<rect x="-132" y="-124" width="274" height="62" fill="#F0C65A" stroke="{INK}"/>'
    for k in range(13):
        o += f'<rect x="{-124 + k * 20}" y="-112" width="14" height="19" fill="#FFF9EA" stroke="#6E5A3A"/><path d="M{-117 + k * 20} -112v19M{-124 + k * 20} -103h14" stroke="#6E5A3A" stroke-width=".8"/>'
    # ba đầu hồi
    for gx, top in ((-108, -226), (108, -226), (0, -226)):
        d = f'M{gx - 62} -122V-156L{gx} {top}L{gx + 62} -156V-122Z'
        o += f'<path d="{d}" fill="#F7CF5E" stroke="{INK}" stroke-width="1.8"/>'
        o += f'<path d="M{gx - 72} -146L{gx} {top - 12}L{gx + 72} -146" stroke="#8F4A2A" stroke-width="11" fill="none" stroke-linejoin="miter"/><path d="M{gx - 72} -146L{gx} {top - 12}L{gx + 72} -146" stroke="#FFF9EA" stroke-width="2" fill="none" transform="translate(0 7)"/>'
        for wx in (-30, 0, 30):
            o += f'<rect x="{gx + wx - 11}" y="-186" width="22" height="60" fill="#FFF9EA" stroke="#6E5A3A"/>'
            for yy in (-174, -162, -150, -138): o += f'<path d="M{gx + wx - 11} {yy}h22" stroke="#6E5A3A" stroke-width=".8"/>'
            o += f'<path d="M{gx + wx} -186v60" stroke="#6E5A3A" stroke-width=".8"/>'
        o += f'<rect x="{gx - 44}" y="-192" width="88" height="5" fill="#FFF9EA" stroke="#8A6A3A"/>'
    # đồng hồ và biển ga
    o += f'<circle cx="0" cy="-204" r="11" fill="#FFF9EA" stroke="{INK}" stroke-width="1.6"/><path d="M0 -204v-7M0 -204l5 3" stroke="{INK}" stroke-width="1.4"/>'
    o += '<rect x="-36" y="-187" width="72" height="16" fill="#5A3A22" stroke="#FFF9EA"/><text x="0" y="-174.500" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="12" fill="#F7D96A">DALAT</text>'
    # thân dưới + mái hiên cong
    o += f'<rect x="-352" y="-66" width="746" height="66" fill="#E9B44C" stroke="{INK}"/>'
    for x, w in [(-336, 64), (-256, 64), (-160, 56), (-60, 56), (40, 56), (150, 64), (236, 64), (322, 56)]:
        o += f'<rect x="{x}" y="-54" width="{w}" height="50" fill="#8F2F24" stroke="{INK}"/><rect x="{x + 6}" y="-48" width="{w - 12}" height="26" fill="#FFF3D0" stroke="#6E3522"/>'
    o += f'<path d="M-400 -82Q0 -100 440 -82L452 -62H-412Z" fill="#B5613C" stroke="{INK}" stroke-width="1.6"/>'
    for k in range(4): o += f'<path d="M{-400 - k * 3} {-82 + k * 6}Q0 {-100 + k * 7} {440 + k * 3} {-82 + k * 6}" stroke="#7A3A22" stroke-width="1" fill="none"/>'
    o += '<rect x="-414" y="-62" width="868" height="9" rx="4" fill="#FFF3D0" stroke="#8A6A3A"/><rect x="-414" y="-53" width="868" height="4" fill="#8F2F24"/>'
    for x in range(-396, 441, 88): o += f'<rect x="{x}" y="-50" width="10" height="50" fill="#B5322A" stroke="{INK}"/><rect x="{x - 3}" y="-50" width="16" height="4" fill="#E9B44C"/>'
    return o + '</g>'

def wheel(x, y, r):
    o = f'<circle cx="{x}" cy="{y}" r="{r}" fill="#B5322A" stroke="#16110E" stroke-width="3"/>'
    for a in range(0, 180, 30):
        c, s = math.cos(math.radians(a)) * r, math.sin(math.radians(a)) * r
        o += f'<path d="M{x - c:.1f} {y - s:.1f}L{x + c:.1f} {y + s:.1f}" stroke="#16110E" stroke-width="1.3"/>'
    return o + f'<circle cx="{x}" cy="{y}" r="{r * .25:.1f}" fill="#E9B44C" stroke="#16110E"/>'

def loco(x, y):
    """Đầu máy hơi nước đen, bánh đỏ, mũi quay trái."""
    o = f'<g transform="translate({x} {y})">'
    o += '<path d="M-124 -18L-146 0H-108V-18Z" fill="#B5322A" stroke="#16110E"/><rect x="-126" y="-30" width="10" height="14" fill="#B5322A" stroke="#16110E"/>'
    o += '<rect x="-112" y="-24" width="196" height="9" fill="#2A2420" stroke="#0E0A08"/><rect x="-112" y="-18" width="196" height="4" fill="#B5322A"/>'
    o += '<rect x="-108" y="-82" width="146" height="58" rx="26" fill="#26221E" stroke="#0E0A08" stroke-width="1.6"/><rect x="-102" y="-78" width="136" height="10" rx="5" fill="#5A524A"/>'
    o += '<circle cx="-108" cy="-54" r="26" fill="#3A342E" stroke="#0E0A08" stroke-width="1.6"/><circle cx="-108" cy="-54" r="16" fill="#26221E" stroke="#E9B44C" stroke-width="1.6"/><circle cx="-108" cy="-54" r="3.4" fill="#E9B44C"/>'
    for xx in (-76, -36, 8): o += f'<path d="M{xx} -82v58" stroke="#E9B44C" stroke-width="1.6"/>'
    o += '<path d="M-90 -80V-112H-98V-122H-68V-112H-76V-80Z" fill="#26221E" stroke="#0E0A08" stroke-width="1.6"/><rect x="-100" y="-124" width="34" height="5" fill="#E9B44C"/>'
    o += '<path d="M-44 -80Q-44 -100 -30 -100Q-16 -100 -16 -80Z" fill="#E9B44C" stroke="#0E0A08"/><path d="M-4 -82V-96Q6 -100 16 -96V-82Z" fill="#3A342E" stroke="#0E0A08"/>'
    o += '<circle cx="-112" cy="-92" r="6" fill="#FFE29A" stroke="#0E0A08"/>' + G.halo(-114, -92, 26, .8)
    o += '<path d="M34 -112H102V-24H34Z" fill="#2E2822" stroke="#0E0A08" stroke-width="1.6"/><path d="M26 -114Q68 -128 110 -114V-108H26Z" fill="#B5322A" stroke="#0E0A08" stroke-width="1.4"/><rect x="46" y="-100" width="24" height="26" fill="#BFE4F0" stroke="#E9B44C" stroke-width="1.6"/><rect x="76" y="-100" width="18" height="26" fill="#BFE4F0" stroke="#E9B44C" stroke-width="1.6"/><rect x="38" y="-62" width="60" height="4" fill="#E9B44C"/>'
    o += wheel(-70, -18, 18) + wheel(-22, -18, 18) + wheel(26, -18, 18) + wheel(74, -12, 12)
    o += '<path d="M-70 -18H26" stroke="#E4E0D8" stroke-width="4"/><rect x="-92" y="-32" width="28" height="12" fill="#3A342E" stroke="#0E0A08"/>'
    for i, (dx, dy, r, d) in enumerate([(-82, -128, 13, 0), (-78, -142, 16, 1), (-66, -160, 20, 2), (-46, -180, 25, 3), (-74, -136, 14, 1.5)]):
        o += f'<circle class="smoke" style="--d:-{d}s" cx="{dx}" cy="{dy}" r="{r}" fill="#F4F4F0"/>'
    o += '<circle cx="-82" cy="-140" r="15" fill="#E8E8E4" opacity=".85"/><circle cx="-70" cy="-162" r="20" fill="#F4F4F0" opacity=".7"/><circle cx="-44" cy="-186" r="25" fill="#F4F4F0" opacity=".5"/><circle cx="-14" cy="-208" r="28" fill="#F4F4F0" opacity=".3"/>'
    return o + '</g>'

def coach(x, y, w=190):
    o = f'<g transform="translate({x} {y})"><rect x="0" y="-78" width="{w}" height="58" fill="#C98E4A" stroke="#16110E" stroke-width="1.6"/>'
    for k in range(int(w / 8)): o += f'<path d="M{k * 8 + 4} -78v58" stroke="#8F5A2E" stroke-width=".8"/>'
    o += f'<path d="M-8 -80Q{w / 2} -98 {w + 8} -80V-74H-8Z" fill="#7A2A20" stroke="#16110E" stroke-width="1.4"/><rect x="0" y="-52" width="{w}" height="4" fill="#FFF3D0"/>'
    for k in range(int(w / 34)): o += f'<rect x="{10 + k * 34}" y="-72" width="24" height="20" fill="#BFE4F0" stroke="#5A3418" stroke-width="1.4"/>'
    o += f'<rect x="0" y="-22" width="{w}" height="6" fill="#2A2420"/>'
    for cx in (30, w - 30): o += f'<circle cx="{cx}" cy="-9" r="9" fill="#2A2420" stroke="#0E0A08"/><circle cx="{cx}" cy="-9" r="3" fill="#B5322A"/>'
    return o + '</g>'

def flowers(x0, x1, y0, y1, n, cols, r0=2, r1=4.6):
    return ''.join('<circle cx="%d" cy="%d" r="%.1f" fill="%s"/>' % (R.randint(x0, x1), R.randint(y0, y1), R.uniform(r0, r1), R.choice(cols)) for _ in range(n))

def hydrangea(x, y, s=1, c=('#7A9CE8', '#9AB4F0', '#B48AE0', '#6A8AD8')):
    o = ''
    for dx, dy, r in [(-22, 2, 18), (20, 4, 18), (0, -8, 20)]:
        o += f'<ellipse cx="{x + dx * s:.0f}" cy="{y + dy * s + 16 * s:.0f}" rx="{r * 1.2 * s:.0f}" ry="{r * .7 * s:.0f}" fill="#2F7A4E"/>'
    for dx, dy, r in [(-20, -4, 14), (18, -2, 15), (0, -14, 16)]:
        o += f'<circle cx="{x + dx * s:.0f}" cy="{y + dy * s:.0f}" r="{r * s:.0f}" fill="{c[0]}"/>' + flowers(int(x + (dx - r) * s), int(x + (dx + r) * s), int(y + (dy - r) * s), int(y + (dy + r) * s), 22, c, 1.4 * s, 2.8 * s)
    return o

def blossom(x, y, s=1, cols=('#F7A6C4', '#FFC4D8', '#F28AB0', '#FFE0EA')):
    o = f'<path d="M{x - 6 * s} {y}Q{x} {y - 40 * s} {x - 14 * s} {y - 76 * s}M{x} {y - 40 * s}Q{x + 10 * s} {y - 60 * s} {x + 26 * s} {y - 74 * s}" stroke="#4E342A" stroke-width="{6 * s}" fill="none" stroke-linecap="round"/>'
    for _ in range(14): o += '<ellipse cx="%.0f" cy="%.0f" rx="%.0f" ry="%.0f" fill="%s" opacity=".9"/>' % (x + R.uniform(-52, 56) * s, y - 92 * s + R.uniform(-38, 28) * s, R.uniform(14, 24) * s, R.uniform(10, 16) * s, cols[R.randint(0, 2)])
    return o + flowers(int(x - 64 * s), int(x + 68 * s), int(y - 134 * s), int(y - 56 * s), 110, cols, 1.6 * s, 3.4 * s)

def pdalat():
    o = HG + water_fx(492, .62, .1, 9, 14)
    o += '<linearGradient id="dlSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FA0E0"/><stop offset=".55" stop-color="#A8DCF0"/><stop offset=".9" stop-color="#FFF3DC"/></linearGradient>'
    o += '<linearGradient id="dlLake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8AC4C8"/><stop offset=".5" stop-color="#3E94A4"/><stop offset="1" stop-color="#1F6A80"/></linearGradient>'
    o += '<filter id="dlMist" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="10"/></filter>'
    o += '<rect width="1280" height="500" fill="url(#dlSky)"/>'
    o += clouds([(180, 66, 300, 24, '#FFFFFF'), (540, 112, 240, 16, '#FFF9F0'), (860, 56, 320, 22, '#FFFFFF'), (1100, 146, 220, 14, '#FFF3E8')], .9)
    o += '<circle cx="250" cy="120" r="26" fill="#FFF7C2"/>' + G.halo(250, 120, 110, .9) + birds([(420, 176), (456, 160), (500, 186)], '#3A5A7A')
    h1 = lambda x: 268 + 36 * math.sin(x / 190 + 1) - 24 * math.sin(x / 90)
    h2 = lambda x: 318 + 40 * math.sin(x / 150 - 1.2)
    h3 = lambda x: 356 + 30 * math.sin(x / 120 + 2)
    def ridge(f, col):
        return 'M-10 500' + ''.join(f'L{x} {f(x):.0f}' for x in range(-10, 1300, 20)) + f'L1290 500Z'
    back = f'<path d="{ridge(h1, 0)}" fill="#8FC0CC"/>'
    back += pines(26, -20, 1300, lambda x: h1(x) + 12, .3, .42, ('#6AA4AE', '#78B0B8', '#5E98A4'), '#5E8894')
    back += '<ellipse cx="640" cy="316" rx="760" ry="24" fill="#FFFFFF" opacity=".6" filter="url(#dlMist)"/>'
    back += f'<path d="{ridge(h2, 0)}" fill="#5FA488"/>'
    back += pines(28, -20, 1300, lambda x: h2(x) + 14, .5, .68, ('#3A8066', '#2F7058', '#468E70'), '#3E5A50')
    back += '<ellipse cx="500" cy="372" rx="660" ry="20" fill="#FFFFFF" opacity=".55" filter="url(#dlMist)"/>'
    back += f'<path d="{ridge(h3, 0)}" fill="#3F8A5C"/>'
    back += pines(26, -20, 1300, lambda x: h3(x) + 24, .84, 1.12, ('#1F5A44', '#2A6E50', '#174A3A'))
    o += back
    o += '<rect x="-10" y="410" width="1300" height="100" fill="#6FAE5A"/>'
    st = station(560, 424)
    o += st
    o += '<rect x="-10" y="424" width="1300" height="10" fill="#C9BCA4" stroke="#6E6252" stroke-width="1"/>'
    # đường ray
    o += '<rect x="-10" y="434" width="1300" height="30" fill="#8A7E6E"/>'
    o += ''.join('<circle cx="%d" cy="%d" r="%.1f" fill="%s"/>' % (R.randint(0, 1280), R.randint(436, 462), R.uniform(1, 2.2), R.choice(['#A89C8A', '#6E6456', '#BCB09E'])) for _ in range(160))
    for x in range(-6, 1290, 15): o += f'<rect x="{x}" y="440" width="7" height="20" fill="#5A4030"/>'
    o += '<rect x="-10" y="444" width="1300" height="3" fill="#D4D0C8" stroke="#3A3430" stroke-width=".6"/><rect x="-10" y="456" width="1300" height="3" fill="#D4D0C8" stroke="#3A3430" stroke-width=".6"/>'
    o += loco(806, 450) + coach(920, 450, 186) + coach(1114, 450, 190)
    # cỏ, hồ, ruộng hoa
    o += '<path d="M-10 462H1290V660H-10Z" fill="#7FBF62"/>' + ''.join(f'<path d="M{R.randint(0, 1280)} {R.randint(466, 650)}q2 -6 5 -8" stroke="#4E9A4A" stroke-width="1.3" fill="none"/>' for _ in range(180))
    lake = 'M-10 496C120 482 330 486 480 496C600 504 660 540 640 590C620 636 420 648 240 640C120 636 40 640 -10 644Z'
    c = V.uid()
    o += f'<clipPath id="{c}"><path d="{lake}"/></clipPath><path d="{lake}" fill="url(#dlLake)" stroke="#2F6A5A" stroke-width="2"/>'
    o += f'<g clip-path="url(#{c})">' + mirror(back, 486, 486, 650) + ripples(90, 496, 640, ['#fff', '#BFECEC', '#8FD4D8'], -10, 640, 14, 60, .3, .7) + glints(36, 496, 640, ['#fff', '#FFF3C2'], 0, 620) + '</g>'
    o += P.swanboat(380, 566, 1) + P.swanboat(148, 600, .86, '#F2C25A') + P.swanboat(520, 530, .62, '#E8749A')
    o += V.lotusleaf(70, 540, 11) + ''.join(f'<path d="M{x} {y}q-3 -12 -6 -18M{x + 4} {y}q0 -12 3 -20M{x + 8} {y}q3 -10 8 -14" stroke="#3E8A5A" stroke-width="1.8" fill="none"/>' for x, y in [(612, 590), (600, 616), (20, 642), (560, 636)])
    # ruộng hoa nhiều màu theo luống
    rows = [(['#F268A6', '#FF8AC0', '#E8418F'], 480), (['#F7D21A', '#FFE27A', '#F2B233'], 512), (['#E2483E', '#F2684A', '#FFF9EA'], 544), (['#B48AE0', '#9AB4F0', '#FFFFFF'], 576), (['#F2884A', '#F7B91A', '#FFD27A'], 608)]
    for i, (cl, y) in enumerate(rows):
        x0 = 680 - i * 8
        o += f'<path d="M{x0} {y}H1290V{y + 26}H{x0 - 8}Z" fill="#3E8A4E"/>' + ''.join(f'<ellipse cx="{R.randint(x0, 1280)}" cy="{R.randint(y + 2, y + 26)}" rx="7" ry="3.4" fill="{R.choice(["#2F7A4E", "#4E9A5A"])}"/>' for _ in range(60))
        o += flowers(x0, 1284, y - 2, y + 24, 340, cl, 2.2 + i * .25, 4 + i * .3)
    # cây hoa
    o += blossom(584, 482, .62) + blossom(84, 490, .66)
    # đường + bồn hoa
    pal = ['#B8AC9A', '#A89C8A', '#C4B8A6', '#9C907E', '#BCB09E']
    road = 'M-10 654Q640 638 1290 654V730H-10Z'
    o += promenade(road, 638, pal, '#6E6252')
    for x, y, s_ in [(44, 654, .92), (214, 650, .78), (462, 648, .8), (860, 650, .82), (1060, 652, .86), (1230, 654, .92)]: o += hydrangea(x, y, s_, ('#7A9CE8', '#9AB4F0', '#B48AE0', '#6A8AD8') if int(x) % 3 else ('#F7A6C4', '#FFC4D8', '#E88AB8', '#F7C4E0'))
    o += lamp(664, 664, 112, '#2F4A4A') + G.bike(986, 704, '#E2483E')
    o += V.non(1140, 706, '#2FB8C6', True) + G.walker(530, 702, '#B5322A', s=1.12) + G.walker(566, 700, '#E9C25A', '#7A4A2A', s=1.08) + aodai(420, 702, '#FFFFFF', 1.04, 1, False)
    o += V.kitsu(760, 708, 92, 'ehappy', 'walk')
    for t, x, y, dn in [('Ga Đà Lạt', 500, 156, True), ('Tàu hơi nước', 1096, 320, False), ('Đồi thông', 1076, 196, True), ('Hồ Xuân Hương', 280, 512, False), ('Hoa', 960, 560, False)]:
        o += G.bubble(x, y, t, dn)
    return o

# ---------- xuất ----------
def page(name, title, place, aria, body):
    hud = f'<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về bản đồ</span><span class="pill">{place}</span></div>'
    V.write(name, title, 1280, 720, f'<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="{aria}"><defs>' + V.DEFS + '</defs>' + body + '<rect width="1280" height="720" filter="url(#grain)" opacity=".25"/></svg>' + hud + '</div>')

BOARDS = [
    ('PHue', 0, 'Kids World, Huế hoàng hôn', 'Huế', 'Huế lúc hoàng hôn tím: Ngọ Môn, sông Hương, thuyền rồng, cầu Tràng Tiền phía xa', phue),
    ('PDanang', 1360, 'Kids World, Đà Nẵng về đêm', 'Đà Nẵng', 'Đà Nẵng về đêm: cầu Rồng phun lửa trên sông Hàn, cao ốc sáng đèn, cầu quay phía xa', pdanang),
    ('PNhatrang', 2720, 'Kids World, Nha Trang buổi sáng', 'Nha Trang', 'Nha Trang buổi sáng: tháp Bà Ponagar trên đồi, biển, bãi cát, thuyền thúng', pnhatrang),
    ('PDalat', 4080, 'Kids World, Đà Lạt buổi sáng', 'Đà Lạt', 'Đà Lạt buổi sáng: ga ba mái nhọn, tàu hơi nước, đồi thông, hồ Xuân Hương, ruộng hoa', pdalat),
]

def add_canvas():
    # đọc ngay trước khi ghi: generator khác có thể cùng ghi canvas.json. Giữ đúng định dạng json.dumps mặc định của file.
    p = os.path.join(proj, 'canvas.json')
    d = json.load(open(p, encoding='utf-8'))
    for n, x, t, place, *_ in BOARDS:
        f = n + '.dc.html'
        d['boards'][f] = {'h': 720, 'title': 'Địa điểm · ' + place, 'w': 1280, 'x': x, 'y': -6140}
        if f not in d['order']: d['order'].append(f)
    open(p, 'w', encoding='utf-8').write(json.dumps(d))

if __name__ == '__main__':
    only = os.environ.get('ONLY')
    for n, x, t, place, aria, fn in BOARDS:
        if only and n not in only.split(','): continue
        page(n, t, place, aria, fn())
    if want_canvas: add_canvas()
    print('ok')
