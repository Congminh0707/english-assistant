# Xuất dữ liệu tầng Trái Đất vào repo:
#   python scripts/design-data/export-earth.py <ne50.geojson> <ảnh kỳ quan .png đã chụp, xem --wonders-html>
# Bờ biển: Natural Earth 1:50m (phạm vi công cộng, docs/08 §8c). Gộp theo châu lục bằng shapely nên không còn biên giới quốc gia,
# giản lược, bỏ đảo rất nhỏ. Đầu ra: src/renderer/study/kids/game/earthLand.json { châu: [vòng phẳng lon,lat ×10] }.
import json, os, sys
from shapely.geometry import shape
from shapely.ops import unary_union
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
KEY = {'Asia': 'asia', 'Europe': 'europe', 'Africa': 'africa', 'North America': 'northAmerica', 'South America': 'southAmerica', 'Oceania': 'oceania', 'Antarctica': 'antarctica'}
# Đảo ngoài đại dương: xếp theo vùng gần nhất
def seven_seas(c):
    x, y = c.x, c.y
    if -40 < x < 25: return 'africa' if y < 20 else 'europe'
    if 25 <= x < 110: return 'africa' if x < 60 else 'asia'
    return 'oceania'

src = json.load(open(sys.argv[1], encoding='utf-8'))
groups = {}
for f in src['features']:
    g = shape(f['geometry']).buffer(0)
    c = f['properties'].get('CONTINENT')
    k = KEY.get(c) or seven_seas(g.centroid)
    groups.setdefault(k, []).append(g)
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
