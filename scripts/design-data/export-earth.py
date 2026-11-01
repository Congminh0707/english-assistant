# Xuất dữ liệu tầng Trái Đất vào repo:
#   python scripts/design-data/export-earth.py <ne50.geojson>
# Bờ biển: Natural Earth 1:50m (phạm vi công cộng, docs/08 §8c). Gộp theo châu lục bằng shapely nên không còn biên giới quốc gia,
# giản lược, bỏ đảo rất nhỏ. Đầu ra: src/renderer/study/kids/game/earthLand.json { châu: [vòng phẳng lon,lat ×10] }.
import json, os, sys
from shapely.geometry import box, shape
from shapely.ops import unary_union
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
KEY = {'Asia': 'asia', 'Europe': 'europe', 'Africa': 'africa', 'North America': 'northAmerica', 'South America': 'southAmerica', 'Oceania': 'oceania', 'Antarctica': 'antarctica'}
# Vùng theo toạ độ: dùng cho đảo ngoài đại dương và phần lãnh thổ nằm xa nước chính (vd Guyane thuộc Pháp)
def zone(c):
    x, y = c.x, c.y
    if y < -60: return 'antarctica'
    if x < -30: return 'northAmerica' if y > 12 or (y > 7 and x < -77) else 'southAmerica'
    if x < 60: return 'europe' if y > 35 else 'africa'
    if x < 150 and y > -11: return 'asia'
    return 'oceania'

src = json.load(open(sys.argv[1], encoding='utf-8'))
groups = {}
for f in src['features']:
    g = shape(f['geometry']).buffer(0)
    home = KEY.get(f['properties'].get('CONTINENT'))
    parts = list(g.geoms) if hasattr(g, 'geoms') else [g]
    main = max(parts, key=lambda p: p.area).centroid
    for p in parts:
        c = p.centroid
        if f['properties'].get('ADMIN') == 'Russia':
            # Nga: phía tây dãy Ural thuộc châu Âu, phía đông thuộc châu Á
            if c.x < 0: groups.setdefault('asia', []).append(p)
            else:
                groups.setdefault('europe', []).append(p.intersection(box(0, -90, 60, 90)))
                groups.setdefault('asia', []).append(p.intersection(box(60, -90, 180, 90)))
            continue
        far = abs(c.x - main.x) > 45 or abs(c.y - main.y) > 35
        k = zone(c) if not home or far else home
        groups.setdefault(k, []).append(p)
out = {}
for k, geoms in groups.items():
    u = unary_union([g.buffer(0.02) for g in geoms]).buffer(-0.02).simplify(0.12)
    polys = list(u.geoms) if hasattr(u, 'geoms') else [u]
    rings = []
    for p in polys:
        if p.area < 0.25: continue
        for r in [p.exterior, *[i for i in p.interiors if abs(__import__('shapely').Polygon(i).area) > 1]]:
            flat = []
            for x, y in r.coords[:-1]:
                flat += [round(x * 10), round(y * 10)]
            rings.append(flat)
    out[k] = rings
p = os.path.join(ROOT, 'src', 'renderer', 'study', 'kids', 'game', 'earthLand.json')
json.dump(out, open(p, 'w', encoding='utf-8'), separators=(',', ':'))
print(p, os.path.getsize(p) // 1024, 'KB', {k: len(v) for k, v in out.items()})
