import json, math, random
from shapely.geometry import shape, box
m = json.load(open('vn_merged.json', encoding='utf-8'))
ne = json.load(open('ne50.geojson', encoding='utf-8'))
K = m['K']; C = math.cos(math.radians(16)); LON0, LAT0 = 102.0, 23.5
def prj(lo, la): return ((lo - LON0) * C * K, (LAT0 - la) * K)
OX, OY = 40, 30
clip = box(98, 5, 118, 26)
nb = ''
for f in ne['features']:
    p = f['properties']
    if p['ADMIN'] in ('Laos', 'Cambodia', 'China', 'Thailand', 'Myanmar', 'Malaysia', 'Philippines', 'Taiwan'):
        g = shape(f['geometry']).intersection(clip)
        if g.is_empty: continue
        polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
        for pl in polys:
            if pl.area < .02: continue
            nb += 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in (prj(*c) for c in pl.simplify(.03).exterior.coords)) + 'Z'
north = ['Hà Nội', 'Cao Bằng', 'Tuyên Quang', 'Điện Biên', 'Lai Châu', 'Sơn La', 'Lào Cai', 'Thái Nguyên', 'Lạng Sơn', 'Quảng Ninh', 'Bắc Ninh', 'Phú Thọ', 'Hải Phòng', 'Hưng Yên', 'Ninh Bình']
central = ['Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Trị', 'Huế', 'Đà Nẵng', 'Quảng Ngãi', 'Gia Lai', 'Khánh Hòa', 'Đắk Lắk', 'Lâm Đồng']
pal = {'n': ['#BFE3A0', '#CBEAB0', '#B4DB96', '#D2EDB8'], 'c': ['#F5DC9C', '#F9E6B2', '#EFD08A', '#FBEBC0'], 's': ['#A9DEC4', '#B9E7D0', '#9CD6BA', '#C4EBD8']}
names = {'TP.HCM': 'TP. Hồ Chí Minh'}
provs = ''; labels = ''
for i, (n, v) in enumerate(m['prov'].items()):
    r = 'n' if n in north else 'c' if n in central else 's'
    col = pal[r][i % 4]
    provs += f'<path d="{v["d"]}" fill="{col}" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><title>{names.get(n, n)}</title></path>'
    cx, cy = v['c']
    fs = 10.5 if v['area'] > 1.2 else 9
    labels += f'<text x="{cx:.0f}" y="{cy:.0f}" class="pn" style="font-size:{fs}px">{names.get(n, n)}</text>'
order = ['Sa Pa', 'Hà Nội', 'Hạ Long', 'Tràng An', 'Huế', 'Đà Nẵng', 'Hội An', 'Nha Trang', 'Đà Lạt', 'Sài Gòn', 'Cần Thơ', 'Phú Quốc']
info = {'Sa Pa': ('Sa Pa', 'Lào Cai', 'Ruộng bậc thang'), 'Hà Nội': ('Hà Nội', 'Hà Nội', 'Hồ Gươm'), 'Hạ Long': ('Hạ Long', 'Quảng Ninh', 'Vịnh Hạ Long'), 'Tràng An': ('Tràng An', 'Ninh Bình', 'Thuyền qua hang'), 'Huế': ('Huế', 'Huế', 'Đại Nội'), 'Đà Nẵng': ('Đà Nẵng', 'Đà Nẵng', 'Cầu Rồng'), 'Hội An': ('Hội An', 'Đà Nẵng', 'Phố cổ đèn lồng'), 'Nha Trang': ('Nha Trang', 'Khánh Hòa', 'Tháp Bà Ponagar'), 'Đà Lạt': ('Đà Lạt', 'Lâm Đồng', 'Ga Đà Lạt'), 'Sài Gòn': ('Sài Gòn', 'TP. Hồ Chí Minh', 'Chợ Bến Thành'), 'Cần Thơ': ('Cần Thơ', 'Cần Thơ', 'Chợ nổi Cái Răng'), 'Phú Quốc': ('Phú Quốc', 'An Giang', 'Làng chài Hàm Ninh')}
side = {'Sa Pa': 'L', 'Hà Nội': 'L', 'Hạ Long': 'R', 'Tràng An': 'L', 'Huế': 'R', 'Đà Nẵng': 'R', 'Hội An': 'R', 'Nha Trang': 'R', 'Đà Lạt': 'L', 'Sài Gòn': 'R', 'Cần Thơ': 'L', 'Phú Quốc': 'L'}
pts = [m['lm'][n]['xy'] for n in order]
vt = ['car', 'boat', 'car', 'plane', 'car', 'car', 'car', 'car', 'car', 'car', 'boat']
route = ''
for i in range(len(pts) - 1):
    (x1, y1), (x2, y2) = pts[i], pts[i + 1]
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2; dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy) or 1
    off = 18 if vt[i] != 'plane' else 60
    sg = 1 if i % 2 else -1
    cx, cy = mx - dy / L * off * sg, my + dx / L * off * sg
    t = vt[i]
    d = f'M{x1:.0f} {y1:.0f}Q{cx:.0f} {cy:.0f} {x2:.0f} {y2:.0f}'
    if t == 'car':
        route += f'<path d="{d}" fill="none" stroke="#E5C48A" stroke-width="7" stroke-linecap="round"/><path d="{d}" fill="none" stroke="#F6E3B4" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="2 7"/>'
    elif t == 'boat':
        route += f'<path d="{d}" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 8"/>'
    else:
        route += f'<path d="{d}" fill="none" stroke="#7C9CFF" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 8"/>'
    px = 0.25 * x1 + 0.5 * cx + 0.25 * x2; py = 0.25 * y1 + 0.5 * cy + 0.25 * y2
    route += f'<g transform="translate({px:.0f} {py:.0f})"><circle r="12" fill="#fff" stroke="#2B2B3A" stroke-width="2"/><use href="#v-{t}" width="16" height="16" x="-8" y="-8"/></g>'
pins = ''
locked = {'Cần Thơ', 'Phú Quốc'}
disp = {'Sa Pa': (0, 0), 'Hà Nội': (-26, 6), 'Hạ Long': (34, -8), 'Tràng An': (44, 18), 'Huế': (44, -14), 'Đà Nẵng': (56, 8), 'Hội An': (60, 44), 'Nha Trang': (36, 0), 'Đà Lạt': (-44, -6), 'Sài Gòn': (38, 12), 'Cần Thơ': (6, 36), 'Phú Quốc': (-34, -4)}
side = {'Sa Pa': 'R', 'Hà Nội': 'L', 'Hạ Long': 'R', 'Tràng An': 'R', 'Huế': 'R', 'Đà Nẵng': 'R', 'Hội An': 'R', 'Nha Trang': 'R', 'Đà Lạt': 'L', 'Sài Gòn': 'R', 'Cần Thơ': 'R', 'Phú Quốc': 'L'}
for i, n in enumerate(order):
    x, y = m['lm'][n]['xy']; nm, pv, sub = info[n]; lk = n in locked; rec = n == 'Hội An'
    dx, dy = disp[n]
    ring = '<circle r="26" fill="none" stroke="#FFD66B" stroke-width="4" class="rec"/>' if rec else ''
    col = '#9AA3B2' if lk else '#3F6FE0'
    icon = '<use href="#lk" x="-7" y="-7" width="14" height="14" stroke="#fff" fill="none" stroke-width="2.6" stroke-linecap="round"/>' if lk else f'<text y="5" class="pnum">{i + 1}</text>'
    w = 124; lx = (18 if side[n] == 'R' else -18 - w)
    lead = f'<path d="M{x:.0f} {y:.0f}L{x + dx:.0f} {y + dy:.0f}" stroke="#2B2B3A" stroke-width="2" opacity=".6"/><circle cx="{x:.0f}" cy="{y:.0f}" r="4" fill="#E8604C" stroke="#fff" stroke-width="1.5"/>' if (dx or dy) else ''
    pins += f'{lead}<g transform="translate({x + dx:.0f} {y + dy:.0f})">{ring}<circle r="15" fill="{col}" stroke="#fff" stroke-width="3.5"/>{icon}<g transform="translate({lx} -17)"><rect width="{w}" height="34" rx="12" fill="#fff" stroke="#E6DCC3"/><text x="10" y="14" class="lt">{nm}</text><text x="10" y="27" class="ls">{pv} · {sub}</text></g></g>'
hs = prj(112.0, 16.5); ts = prj(114.0, 10.0)
def cluster(c, seed):
    out = ''
    random.seed(seed)
    for _ in range(9):
        out += f'<ellipse cx="{c[0] + random.uniform(-26, 26):.0f}" cy="{c[1] + random.uniform(-18, 18):.0f}" rx="{random.uniform(2, 4.5):.1f}" ry="{random.uniform(1.6, 3):.1f}" fill="#F5E3B0" stroke="#fff" stroke-width="1.2"/>'
    return out
isl = cluster(hs, 3) + cluster(ts, 7) + f'<text x="{hs[0] + 70:.0f}" y="{hs[1] - 26:.0f}" class="isl" style="text-anchor:end">Quần đảo Hoàng Sa · Đà Nẵng</text><text x="{ts[0] + 48:.0f}" y="{ts[1] - 26:.0f}" class="isl" style="text-anchor:end">Quần đảo Trường Sa · Khánh Hòa</text>'
regs = [('Bắc Bộ', '#BFE3A0'), ('Trung Bộ &amp; Tây Nguyên', '#F5DC9C'), ('Nam Bộ', '#A9DEC4')]
rows = ''.join(f'<div style="display:flex;align-items:center;gap:8px"><span style="width:18px;height:18px;border-radius:6px;background:{c};border:1px solid rgba(43,43,58,.15)"></span>{n}</div>' for n, c in regs)
plist = ''.join(f'<div style="display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:10px;background:{"#EEF1F6" if n in locked else "#fff"};border:1px solid #E6DCC3"><span style="width:22px;height:22px;border-radius:50%;background:{"#9AA3B2" if n in locked else "#3F6FE0"};color:#fff;font:800 12px Baloo 2,sans-serif;display:flex;align-items:center;justify-content:center;flex:none">{i + 1}</span><span style="font-size:13px"><b>{info[n][0]}</b> <span style="color:#5E5E73">· {info[n][1]} · {info[n][2]}</span></span></div>' for i, n in enumerate(order))
bar = 200 / (111.2 / K)
hoi = m['lm']['Hội An']['xy']
tpl = open('map_tpl.html', encoding='utf-8').read()
for k, v in {'@@NB@@': nb, '@@PROVS@@': provs, '@@LABELS@@': labels, '@@ISL@@': isl, '@@ROUTE@@': route, '@@PINS@@': pins, '@@ROWS@@': rows, '@@PLIST@@': plist, '@@BAR@@': f'{bar:.0f}', '@@BAR10@@': f'{bar + 10:.0f}', '@@PETX@@': f'{hoi[0] + 30:.0f}', '@@PETY@@': f'{hoi[1] + 70:.0f}', '@@OX@@': str(OX), '@@OY@@': str(OY)}.items():
    tpl = tpl.replace(k, v)
open('KidsMapVN.dc.html', 'w', encoding='utf-8').write(tpl)
print(len(tpl))
