# Tầng 3 Trái Đất (PEarth): quả địa cầu tròn quay thật trong vũ trụ (CSS thuần, đường bờ biển tính sẵn từng khung), 7 châu lục tô màu riêng, không đường biên quốc gia, địa điểm là kỳ quan thế giới.
#   BOARD_OUT=<project> python gen_earth.py
# Dữ liệu ne50.geojson chỉ dùng lúc sinh; bảng là dữ liệu mẫu, content/ chưa có các nơi này (docs/22 §13).
import html, json, math, random
import gen_places_south as S
from shapely.geometry import shape, box
from shapely.ops import unary_union
from shapely import segmentize
V = S.V
INK = S.INK
R = random.Random(77)
CX, CY, RAD = 660, 368, 322
TILT = math.radians(5)
N = 24          # số khung cho một vòng quay; trình duyệt nội suy giữa các khung
TURN = 90       # giây một vòng
LON0 = 40       # kinh độ ở giữa quả cầu lúc đầu

def ortho(lon, lat, lam0):
    # chiếu trực giao; x, y trên đĩa, z > 0 là mặt trước
    l, p = math.radians(lon - lam0), math.radians(lat)
    x = math.cos(p) * math.sin(l)
    y = math.cos(TILT) * math.sin(p) - math.sin(TILT) * math.cos(p) * math.cos(l)
    z = math.sin(TILT) * math.sin(p) + math.cos(TILT) * math.cos(p) * math.cos(l)
    return x, y, z

def unfold(lon, lat, lam0):
    # mặt sau gập ra ngoài đĩa (bị clip), nhờ vậy số điểm giữ nguyên và nội suy không giật ở mép
    x, y, z = ortho(lon, lat, lam0)
    if z < 0:
        rho = math.hypot(x, y) or 1e-6
        k = (2 - rho) / rho
        x, y = x * k, y * k
    return CX + RAD * x, CY - RAD * y

def continents():
    d = json.load(open(S.TMP + 'ne50.geojson', encoding='utf-8'))
    groups = {}
    def add(k, g):
        if not g.is_empty: groups.setdefault(k, []).append(g)
    for f in d['features']:
        c = f['properties'].get('CONTINENT')
        if c == 'Seven seas (open ocean)': continue
        g = shape(f['geometry']).buffer(0)
        if c == 'Europe':
            # Nga chia theo dãy Ural; lãnh thổ hải ngoại về đúng châu lục của nó
            add('Asia', g.intersection(box(60, -90, 180, 90)))
            g = g.intersection(box(-180, -90, 60, 90))
            for p in (g.geoms if hasattr(g, 'geoms') else [g]):
                q = p.representative_point()
                add('South America' if q.x < -30 and q.y < 20 else 'Africa' if q.y < 30 else 'Europe', p)
        else: add(c, g)
    return {k: unary_union([g.buffer(.05) for g in gs]).buffer(-.05).simplify(.5) for k, gs in groups.items()}

def polys(g):
    return [p for p in (g.geoms if hasattr(g, 'geoms') else [g]) if p.geom_type == 'Polygon' and p.area > 1.2]

def tiles(g):
    # chia ô 40° để không ô nào ôm trọn điểm đối diện: ô tô màu, viền bờ biển vẽ riêng
    out = []
    for p in polys(g):
        for lo in range(-180, 180, 40):
            for la in range(-90, 90, 40):
                t = p.intersection(box(lo, la, lo + 40, la + 40))
                for q in polys(t): out.append(list(segmentize(q, 7).exterior.coords))
    return out

def frames(rings, closed):
    res = []
    for f in range(N):
        lam = LON0 + f * 360 / N
        d = ''
        for r_ in rings:
            pts = [unfold(c[0], c[1], lam) for c in r_]
            if all(ortho(c[0], c[1], lam)[2] < 0 for c in r_): pts = [pts[0]] * len(pts)
            d += 'M' + 'L'.join('%.1f %.1f' % p for p in pts) + ('Z' if closed else '')
        res.append(d)
    return res

def morph(name, fr):
    b = ''.join('%.3f%%{d:path("%s")}' % (i * 100 / N, d) for i, d in enumerate(fr))
    return '@keyframes %s{%s100%%{d:path("%s")}}' % (name, b, fr[0])

def track(name, lon, lat, sc=1.0, zmin=.16):
    # giữ vật trên mặt cầu: mờ dần khi quay ra sau, nhỏ lại gần mép
    b = ''; first = ''
    for i in range(N + 1):
        x, y, z = ortho(lon, lat, LON0 + i * 360 / N)
        s_ = sc * (.62 + .38 * max(z, 0))
        op = max(0, min(1, (z - zmin) / .14))
        v = 'transform:translate(%.1fpx,%.1fpx) scale(%.3f);opacity:%.2f' % (CX + RAD * x, CY - RAD * y, s_, op)
        if i == 0: first = v
        b += '%.3f%%{%s}' % (i * 100 / N, v)
    return '@keyframes %s{%s}' % (name, b), first

COL = {'Asia': '#F2C04A', 'Europe': '#E88AAE', 'Africa': '#F2903E', 'North America': '#58BE6A', 'South America': '#2FB898', 'Oceania': '#B48AE0', 'Antarctica': '#EEF8FC'}
DARK = {'Asia': '#A8761A', 'Europe': '#A83E6A', 'Africa': '#A8501A', 'North America': '#1F7A3E', 'South America': '#0F7460', 'Oceania': '#6A44A0', 'Antarctica': '#7FB0C8'}

# ---------- kỳ quan: tâm bệ ở (0,0), bệ bán kính 60 ----------
def stone(d, c='#F2F0EA', w=1.3): return '<path d="%s" fill="%s" stroke="%s" stroke-width="%s" stroke-linejoin="round"/>' % (d, c, INK, w)

def w_taj():
    o = S.plate(0, 0, 60, '#6FBE5A')
    o += '<path d="M-7 18H7L4 3H-4Z" fill="#4FB8D0" stroke="%s" stroke-width=".8"/>' % INK
    o += stone('M-42 4V-3H42V4Z', '#E8DCC8')
    for mx in (-38, 38):
        o += stone('M%d -2L%d -42H%dL%d -2Z' % (mx - 3, mx - 2, mx + 2, mx + 3)) + stone('M%d -42h8v-2h-8Z' % (mx - 4)) + stone('M%d -44q4 -7 8 0Z' % (mx - 4))
    o += stone('M-25 -3V-30H25V-3Z')
    o += stone('M-7 -3V-16Q0 -25 7 -16V-3Z', '#8AA6B0') + stone('M-20 -3V-11Q-16 -16 -12 -11V-3ZM12 -3V-11Q16 -16 20 -11V-3ZM-20 -15V-22Q-16 -26 -12 -22V-15ZM12 -15V-22Q16 -26 20 -22V-15Z', '#A9BCC4', .9)
    for mx in (-18, 18): o += stone('M%d -30V-35H%dV-30Z' % (mx - 5, mx + 5)) + stone('M%d -35q5 -9 10 0Z' % (mx - 5))
    o += stone('M-13 -30Q-19 -44 -9 -52Q-3 -56 0 -63Q3 -56 9 -52Q19 -44 13 -30Z') + '<path d="M0 -63v-7" stroke="#B8922A" stroke-width="1.6"/>'
    return o

def w_colosseum():
    o = S.plate(0, 0, 60, '#C9B98A', '#9A855A')
    o += '<ellipse cx="0" cy="-34" rx="46" ry="11" fill="#8A6A4A" stroke="%s"/>' % INK
    o += stone('M-48 -33Q0 -14 34 -22L38 -30L44 -24V4Q0 16 -48 2Z', '#D9B98C')
    for row_, yy in enumerate((-2, -14, -25)):
        for i in range(9):
            ax = -44 + i * 10
            if ax > 30 and row_ == 2: continue
            yo = yy + 7 * (1 - ((ax + 2) / 46) ** 2)
            o += '<path d="M%d %.1fv-5q3 -4 6 0v5Z" fill="#6A4A34"/>' % (ax, yo)
    return o

def w_giza():
    o = S.plate(0, 0, 60, '#F2D48E', '#C49A52')
    o += '<path d="M-2 0L24 -40L50 0Z" fill="#E8C47E" stroke="%s" stroke-width="1.3" stroke-linejoin="round"/><path d="M24 -40L50 0H30Z" fill="#B88A4E"/>' % INK
    o += '<path d="M-46 4L-8 -60L30 4Z" fill="#F2D48E" stroke="%s" stroke-width="1.3" stroke-linejoin="round"/><path d="M-8 -60L30 4H2Z" fill="#C49A52"/><path d="M-13 -52L-8 -60L-3 -52L-8 -49Z" fill="#FFF3DC"/>' % INK
    for i in range(1, 7): o += '<path d="M%d %dH%d" stroke="#A8824A" stroke-width=".6" opacity=".7"/>' % (-8 - i * 5.3, -60 + i * 9, -8 + i * 5.3)
    # nhân sư
    o += stone('M14 14H-22Q-24 6 -18 4H-2Q0 -8 8 -8Q16 -8 16 2L18 14Z', '#E0B878', 1.2) + '<path d="M2 -6L14 -6L16 4L12 2H6L1 4Z" fill="#C8A040" stroke="%s" stroke-width=".8"/>' % INK
    return o

def w_chichen():
    o = S.plate(0, 0, 60)
    for i in range(9):
        w_, y_ = 50 - i * 3.6, 6 - i * 5.8
        o += stone('M%.1f %.1fh%.1fv-5.8h%.1fZ' % (-w_, y_, 2 * w_, -2 * w_), '#D6CFBC' if i % 2 else '#BDB5A0', .9)
    o += '<path d="M-9 6L-6 -46H6L9 6Z" fill="#EDE8DA" stroke="%s" stroke-width="1"/>' % INK
    for i in range(12): o += '<path d="M%.1f %.1fh%.1f" stroke="#A89E88" stroke-width=".8"/>' % (-8.5 + i * .25, 2 - i * 4, 17 - i * .5)
    o += stone('M-13 -46V-61H13V-46Z', '#CFC7B2') + '<rect x="-4" y="-57" width="8" height="11" fill="#4A4034"/>'
    return o

def w_machu():
    o = S.plate(0, 0, 60)
    o += '<path d="M-20 -4L4 -74Q14 -82 20 -64L46 -4Z" fill="#3E8A52" stroke="%s" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 -76L20 -64L46 -4H20Z" fill="#2A6A44"/>' % INK
    o += '<path d="M-54 8Q-44 -30 -24 -22Q-2 -18 8 8Z" fill="#6FB25A" stroke="%s" stroke-width="1.2"/>' % INK
    for i in range(5): o += '<path d="M%d %dq24 -6 %d 2" stroke="#3E7A3E" stroke-width="1.3" fill="none"/>' % (-48 + i * 3, 4 - i * 5, 50 - i * 4)
    for x_, y_, w_ in ((-30, -24, 11), (-16, -24, 13), (-24, -13, 11), (-8, -12, 12), (-38, -12, 9)):
        o += stone('M%d %dv-7h%dv7Z' % (x_, y_, w_), '#BDB5A0', .9) + '<path d="M%d %dl%.1f -6l%.1f 6Z" fill="#A8703E" stroke="%s" stroke-width=".7"/>' % (x_ - 1, y_ - 7, w_ / 2 + 1, w_ / 2 + 1, INK)
    return o

def w_christ():
    o = S.plate(0, 0, 60)
    o += '<path d="M-52 8Q-30 -16 -14 -30Q-6 -38 8 -32Q26 -20 52 8Z" fill="#3E8A52" stroke="%s" stroke-width="1.3" stroke-linejoin="round"/>' % INK
    o += stone('M-6 -33V-44H6V-33Z', '#CFC7B2', 1) + stone('M-4 -44L-6 -70H6L4 -44Z', '#F2F0EA', 1) + stone('M-26 -72L-6 -74H6L26 -72V-68L5 -68H-5L-26 -68Z', '#F2F0EA', 1) + '<circle cy="-78" r="4.6" fill="#F2F0EA" stroke="%s"/>' % INK
    return o

def w_liberty():
    o = S.plate(0, 0, 60, '#4FB8D0', '#2F8A9A')
    o += '<path d="M-34 6L-18 -6H18L34 6L18 14H-18Z" fill="#CFC7B2" stroke="%s" stroke-width="1.1" stroke-linejoin="round"/>' % INK
    o += stone('M-11 -6L-8 -32H8L11 -6Z', '#D9C8A0', 1.1) + stone('M-10 -32h20v-3h-20Z', '#D9C8A0', 1)
    teal = '#5EBEA8'
    o += stone('M-7 -35Q-9 -60 -3 -66H5Q9 -60 7 -35Z', teal, 1) + stone('M3 -64L13 -80L8 -82L0 -66Z', teal, .9)
    o += '<path d="M9 -82l4 3l-1 -5Z" fill="#B8922A"/><path d="M11 -84q-4 -7 2 -11q3 6 0 11Z" fill="#F7B91A" stroke="#C7322E" stroke-width=".7"/><circle cy="-70" r="4.4" fill="%s" stroke="%s" stroke-width=".9"/>' % (teal, INK)
    for a in (-46, -22, 0, 22, 46): o += '<path d="M0 -74v-7" stroke="%s" stroke-width="1.5" transform="rotate(%d 0 -72)"/>' % (teal, a)
    return o

def w_sydney():
    o = S.plate(0, 0, 60, '#4FB8D0', '#2F8A9A')
    o += '<path d="M-46 8L-38 -2H44L50 8Z" fill="#D9B98C" stroke="%s" stroke-width="1.1" stroke-linejoin="round"/>' % INK
    for x_, h_ in ((22, 26), (4, 38), (-14, 46), (-30, 34)):
        o += stone('M%d -2Q%d %d %d %dQ%d %d %d -2Z' % (x_ - 15, x_ - 6, -h_ + 6, x_ + 19, -h_, x_ + 13, -h_ / 2, x_ + 18), '#FFFDF6', 1.1)
    return o

def w_wall():
    return '<g transform="scale(.72)">' + S.lm_wall(0, 0) + '</g>'

def lm(fn, x, y, s=1):
    return '<g transform="translate(%d %d) scale(%.2f)">%s</g>' % (x, y, s, fn())

def penguin(x, y, s=1):
    return '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="-13" rx="9" ry="13" fill="#26303E" stroke="%s"/><ellipse cy="-11" rx="5.6" ry="9.6" fill="#fff"/><circle cy="-26" r="6.6" fill="#26303E"/><path d="M5 -27l6 2l-6 2Z" fill="#F7B91A"/><circle cx="2.4" cy="-27" r="1.2" fill="#fff"/><path d="M-5 0h4M2 0h4" stroke="#F7B91A" stroke-width="2.4" stroke-linecap="round"/></g>' % (x, y, s, INK)

def planet():
    return ('<g transform="translate(1190 92)"><circle r="24" fill="#E8A85A" stroke="#7A4A1E" stroke-width="1.4"/><path d="M-23 -6Q0 2 23 -7M-22 8Q0 15 22 7" stroke="#C47E3A" stroke-width="4" fill="none"/>'
            '<ellipse rx="42" ry="10" fill="none" stroke="#F2DDA6" stroke-width="3.4" transform="rotate(-16)"/></g>')

def pearth():
    g = continents()
    css = ''
    spin = '.sp{animation:%%s %ds linear infinite}' % TURN
    land = ''; rim = ''; coast = ''
    order = ('Antarctica', 'Asia', 'Europe', 'Africa', 'North America', 'South America', 'Oceania')
    for i, k in enumerate(order):
        ft = frames(tiles(g[k]), True)
        # bờ biển cắt đoạn ngắn: đoạn nằm hẳn sau lưng thu về một điểm, không kẻ ngang qua mặt cầu
        fc = frames([c_[n_:n_ + 11] for c_ in (list(segmentize(p, 7).exterior.coords) for p in polys(g[k])) for n_ in range(0, len(c_) - 1, 10)], False)
        css += morph('f%d' % i, ft) + morph('c%d' % i, fc)
        an = lambda n: 'style="animation:%s%d %ds linear infinite"' % (n, i, TURN)
        rim += '<path class="rot" d="%s" %s fill="none" stroke="#F2DDA6" stroke-width="6" stroke-linejoin="round"/>' % (fc[0], an('c'))
        land += '<path class="rot" d="%s" %s fill="%s" stroke="%s" stroke-width="1.2"/>' % (ft[0], an('f'), COL[k], COL[k])
        coast += '<path class="rot" d="%s" %s fill="none" stroke="%s" stroke-width="1.5" stroke-linejoin="round"/>' % (fc[0], an('c'), DARK[k])
    d = S.lin('spaceE', [('0', '#0C1236'), ('.6', '#1A2460'), ('1', '#2E3C88')])
    d += '<radialGradient id="oc" cx=".6" cy=".6" r=".7"><stop offset="0" stop-color="#3FC4E8"/><stop offset=".65" stop-color="#1E86C8"/><stop offset="1" stop-color="#17549E"/></radialGradient>'
    d += '<radialGradient id="shadeE" cx=".66" cy=".66" r=".82"><stop offset="0" stop-color="#FFF3DC" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".82" stop-color="#06143E" stop-opacity=".34"/><stop offset="1" stop-color="#06143E" stop-opacity=".72"/></radialGradient>'
    d += '<radialGradient id="atmE"><stop offset=".85" stop-color="#7FD8F2" stop-opacity=".7"/><stop offset="1" stop-color="#7FD8F2" stop-opacity="0"/></radialGradient>'
    d += '<radialGradient id="sunE"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".3" stop-color="#FFC84A"/><stop offset=".55" stop-color="#FF9A3A" stop-opacity=".5"/><stop offset="1" stop-color="#FF9A3A" stop-opacity="0"/></radialGradient>'
    o = '<rect width="1280" height="720" fill="url(#spaceE)"/>'
    for _ in range(210):
        o += '<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="%s"/>' % (R.uniform(2, 6), R.uniform(0, 4), R.randint(0, 1280), R.randint(0, 720), R.uniform(.7, 2), R.choice(['#fff', '#fff', '#BFE4FF', '#FFE8B8']))
    o += planet() + '<circle cx="1236" cy="664" r="120" fill="url(#sunE)"/>'
    o += '<g class="ride" style="--dx:900px;--t:11s;--d:-3s"><path d="M-110 40L0 0" stroke="#FFF3DC" stroke-width="2.4" stroke-linecap="round" opacity=".8" transform="translate(-200 60)"/></g>'
    o += '<circle cx="%d" cy="%d" r="%d" fill="url(#atmE)"/>' % (CX, CY, RAD * 1.13)
    c = V.uid()
    o += '<clipPath id="%s"><circle cx="%d" cy="%d" r="%d"/></clipPath><g clip-path="url(#%s)"><circle cx="%d" cy="%d" r="%d" fill="url(#oc)"/>' % (c, CX, CY, RAD, c, CX, CY, RAD)
    o += rim + land + coast
    for x, y, w_, op, t_ in ((560, 150, 190, .5, 200), (760, 250, 170, .42, 260), (820, 470, 200, .46, 230), (520, 520, 180, .4, 300), (660, 610, 150, .35, 190)):
        o += '<ellipse class="drift" style="--t:%ds;--d:-%ds" cx="%d" cy="%d" rx="%d" ry="%d" fill="#fff" opacity="%.2f"/>' % (t_, x % 30, x, y, w_ / 2, w_ / 11, op)
    o += '<circle cx="%d" cy="%d" r="%d" fill="url(#shadeE)"/></g><circle cx="%d" cy="%d" r="%d" fill="none" stroke="#BFF0F8" stroke-width="3"/>' % (CX, CY, RAD, CX, CY, RAD)
    # vật gắn trên mặt cầu, quay cùng đất
    items = []
    def put(name, lon, lat, inner, sc=1.0, zmin=.16):
        nonlocal css
        k, first = track(name, lon, lat, sc, zmin)
        css += k
        items.append((lat, '<g class="glob" style="animation:%s %ds linear infinite;%s">%s</g>' % (name, TURN, first, inner)))
    for i, (lo, la, s_) in enumerate(((84, 29, .62), (90, 28, .56), (76, 34, .5), (-110, 44, .56), (-70, -40, .5), (-77, -4, .4), (10, 46, .36), (100, 34, .46))):
        put('m%d' % i, lo, la, S.peak(0, 0, s_, i), 1.0, .3)
    for i, (lo, la, ki) in enumerate(((-64, -11, 0), (-52, -10, 0), (22, -1, 0), (112, 0, 0), (100, 60, 1), (125, 58, 1), (-100, 56, 1), (30, 62, 1))):
        put('t%d' % i, lo, la, (S.fir(-14, -4, .46) + S.fir(12, -6, .4) + S.fir(0, 2, .56)) if ki else (S.broadleaf(-16, -4, .46, i) + S.broadleaf(15, -6, .42, i + 1) + S.broadleaf(0, 3, .54, i + 2)), 1.0, .3)
    for i, (t_, lo, la, co) in enumerate((('Châu Á', 96, 52, '#7A4A10'), ('Châu Âu', 46, 52, '#7A1E4A'), ('Châu Phi', 22, 6, '#7A3410'), ('Bắc Mỹ', -102, 50, '#0F5A2E'), ('Nam Mỹ', -60, 1, '#0A5A48'), ('Châu Đại Dương', 134, -26, '#4A2A7A'), ('Châu Nam Cực', 40, -76, '#3E6E8A'))):
        put('n%d' % i, lo, la, '<text text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="24" fill="%s" stroke="#FFF9EA" stroke-width="4" paint-order="stroke">%s</text>' % (co, t_), 1.0, .08 if la < -60 else .42 if t_ == 'Châu Đại Dương' else .22)
    for i, (x_, s_) in enumerate(((-30, .9), (-8, .8), (14, .84))):
        put('p%d' % i, 100 + x_, -71, penguin(0, 0, s_), 1.0, .06)
    W = [('Tượng Nữ thần Tự do', -74, 40.7, w_liberty), ('Chichén Itzá', -88.6, 20.7, w_chichen), ('Machu Picchu', -72.5, -13.2, w_machu), ('Tượng Chúa Cứu Thế', -43.2, -22.9, w_christ), ('Đấu trường La Mã', 12.5, 41.9, w_colosseum), ('Kim tự tháp Giza', 31.1, 30, w_giza), ('Lăng Taj Mahal', 78, 27.2, w_taj), ('Vạn Lý Trường Thành', 117, 40.4, w_wall), ('Nhà hát Sydney', 151.2, -33.9, w_sydney)]
    for i, (t_, lo, la, f) in enumerate(W):
        inner = '<g transform="translate(0 -6)">' + f() + '</g>' + V.label(0, -96 if t_ == 'Đấu trường La Mã' else 34, html.escape(t_), hot=t_ == 'Kim tự tháp Giza')
        if t_ == 'Kim tự tháp Giza': inner += V.kitsu(56, -12, 54, 'ehappy', 'walk')
        put('w%d' % i, lo, la, inner, .74)
    o += ''.join(x for _, x in sorted(items, key=lambda a: -a[0]))
    # Mặt Trăng, vệ tinh, tên lửa bay quanh Trái Đất
    path = 'M%d %da%d %d 0 1 1 %d 0a%d %d 0 1 1 %d 0' % (CX - 410, CY, 410, 346, 820, 410, 346, -820)
    moon = '<circle r="20" fill="#E8E2D2" stroke="#6A6458" stroke-width="1.4"/><circle cx="-6" cy="-5" r="4.4" fill="#C8C0AE"/><circle cx="7" cy="5" r="3" fill="#C8C0AE"/><circle cx="-3" cy="9" r="2.2" fill="#C8C0AE"/>'
    sat = '<rect x="-7" y="-6" width="14" height="12" rx="2" fill="#F2C25A" stroke="%s"/><path d="M-26 -5h17v10h-17ZM9 -5h17v10h-17Z" fill="#2E5AA8" stroke="#BFE4FF"/><path d="M0 -6v-8" stroke="#E8E2D2" stroke-width="1.6"/><circle cy="-15" r="2.4" fill="#E2483E"/>' % INK
    rocket = '<g transform="rotate(90)"><path d="M-9 12Q-11 -10 0 -26Q11 -10 9 12Z" fill="#F4F0E4" stroke="%s" stroke-width="1.4"/><circle cy="-6" r="4.4" fill="#4FB8D0" stroke="%s"/><path d="M-9 4l-8 12l8 -3ZM9 4l8 12l-8 -3Z" fill="#E2483E" stroke="%s"/><path class="tw" style="--t:.5s" d="M-5 13q5 14 10 0Z" fill="#F7B91A"/></g>' % (INK, INK, INK)
    css += '@keyframes orb{to{offset-distance:100%%}}.orb{offset-path:path("%s");offset-rotate:0deg;animation:orb var(--t,60s) linear infinite;animation-delay:var(--d,0s)}.orbr{offset-rotate:auto}' % path
    css += '@media (prefers-reduced-motion:reduce){.rot,.glob{animation:none!important}.orb{animation:none;offset-distance:var(--o,0%)}}'
    o += '<g class="orb" style="--t:80s;--d:-22s;--o:27%%">%s</g><g class="orb" style="--t:46s;--d:-30s;--o:65%%">%s</g><g class="orb orbr" style="--t:34s;--d:-4s;--o:12%%">%s</g>' % (moon, sat, rocket)
    aria = 'Quả địa cầu tròn đang quay trong vũ trụ, bảy châu lục tô màu riêng, không vẽ biên giới, các kỳ quan thế giới nằm trên mặt cầu'
    V.write('PEarth', 'Kids World, tầng 3 Trái Đất', 1280, 720, S.CSS + '<style>' + css + '</style><div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="%s"><defs>%s</defs>%s<rect width="1280" height="720" filter="url(#grain)" opacity=".3"/></svg>%s</div>' % (aria, V.DEFS + S.HG + d, o, S.hud_map('Tầng 3 Trái Đất', 'Kim tự tháp Giza', 'Ai Cập, châu Phi', 'Đến Giza')))

if __name__ == '__main__':
    pearth(); print('ok')
