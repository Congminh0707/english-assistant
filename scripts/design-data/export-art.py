# Xuất tranh từ bộ vẽ thiết kế sang asset của app: src/renderer/shared/art/scenes/<tên>.art.html
#   python scripts/design-data/export-art.py <project chứa *.dc.html> [--kids] [--only-kids]
# Mỗi file gồm <style> + <svg>, ArtScene.vue nhúng vào Shadow DOM nên id và lớp CSS không đụng nhau.
# Nhãn địa điểm không nằm trong tranh: app vẽ bằng HTML để đi qua i18n.
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
PROJ = sys.argv[1]
OUT = os.path.join(ROOT, 'src', 'renderer', 'shared', 'art', 'scenes')
os.makedirs(OUT, exist_ok=True)
os.environ['BOARD_OUT'] = PROJ
sys.path.insert(0, os.path.join(HERE, 'sync'))
import board_kit as K
V = K.village()
# KDEFS là <svg> ẩn chứa defs của Kitsu, vật trong tranh tham chiếu qua <use>
BASE = '<style>:host{display:block;overflow:hidden}svg{display:block;width:100%;height:100%}</style>'
ANIM = V.ANIM.replace('%%', '%')
if '<style' not in ANIM: ANIM = '<style>' + ANIM + '</style>'

def put(name, svg, css=ANIM):
    # Bộ lọc giấy phủ toàn tranh rất nặng khi tranh động, app bỏ đi
    svg = re.sub(r'<rect width="\d+" height="\d+" filter="url\(#grain\)"[^>]*/>', '', svg)
    p = os.path.join(OUT, name + '.art.html')
    open(p, 'w', encoding='utf-8').write(BASE + (css or '') + V.KDEFS + svg)
    print(name, os.path.getsize(p) // 1024, 'KB')

def wrap(w, h, inner, slice_='xMidYMid slice'):
    return '<svg viewBox="0 0 %d %d" preserveAspectRatio="%s" aria-hidden="true"><defs>%s</defs>%s</svg>' % (w, h, slice_, V.DEFS, inner)

if '--only-kids' not in sys.argv:
    for ph in ('day', 'dusk', 'night'):
        put('village-' + ph, wrap(1100, 720, V.village(ph)))
    for key in ('courses', 'review', 'practice', 'settings', 'words', 'phrases', 'pet', 'shop', 'stats'):
        for dark in (False, True):
            s = K.place_scene(key, dark)
            put('place-%s%s' % (key, '-dark' if dark else ''), s.replace('<svg ', '<svg viewBox="0 0 216 720" preserveAspectRatio="xMidYMax slice" ', 1) if 'viewBox' not in s[:200] else s)

# Biển tên, chấm chạm và thú cưng vẽ sẵn trong tranh được gỡ ra: app dựng lại bằng HTML (nút thật, i18n, đúng thú cưng của bé)
HEX = r'<g transform="translate\((-?[\d.]+) (-?[\d.]+)\)"><path d="M-[\d.]+ -15H[^"]*"[^>]*/><text[^>]*>([^<]+)</text></g>'
SPOT = re.compile(r'<g class="next"[^>]*>' + HEX + r'</g><circle cx="-?[\d.]+" cy="-?[\d.]+" r="6"[^>]*/>')
PET = re.compile(r'<g transform="translate\((-?[\d.]+) (-?[\d.]+)\)"><g class="walk"><svg x="-?\d+" y="-?\d+" width="(\d+)" height="\d+" viewBox="-20 -20 200 180">.*?</svg></g></g>', re.S)
PLACE_OF = {'R5Arrive': 'hoian', 'PSapa': 'sapa', 'PHanoi': 'hanoi', 'PHalong': 'halong', 'PNinhbinh': 'ninhbinh', 'PHue': 'hue', 'PDanang': 'danang', 'PNhatrang': 'nhatrang', 'PDalat': 'dalat', 'PHcmc': 'hcmc', 'PCantho': 'cantho', 'PPhuquoc': 'phuquoc'}
COUNTRY_OF = {'Việt Nam': 'vn', 'Trung Quốc': 'china', 'Nhật Bản': 'japan', 'Pháp': 'france', 'Kê-ni-a': 'kenya', 'Úc': 'australia', 'Hoa Kỳ': 'usa'}
gen_place, gen_asia = {}, {}

def strip_scene(n, svg):
    pet = PET.search(svg)
    px = {'x': float(pet.group(1)), 'y': float(pet.group(2)), 'w': int(pet.group(3))} if pet else None
    svg = PET.sub('', svg)
    if n == 'PAsia':
        for m in re.finditer(HEX, svg):
            gen_asia[COUNTRY_OF[m.group(3)]] = (float(m.group(1)), float(m.group(2)))
        gen_asia['pet'] = px
        return re.sub(HEX, '', svg)
    if n in PLACE_OF:
        spots = [(float(m.group(1)), float(m.group(2)), m.group(3)) for m in SPOT.finditer(svg)]
        assert len(spots) == 5, (n, len(spots))
        gen_place[PLACE_OF[n]] = {'art': 'kids-' + n.lower(), 'pet': px, 'spots': spots}
        return SPOT.sub('', svg)
    return svg

if '--kids' in sys.argv:
    # Cảnh địa điểm và bản đồ: lấy nguyên tranh trên bảng, bỏ phần HUD HTML
    for f in sorted(os.listdir(PROJ)):
        n = f.replace('.dc.html', '')
        if not re.match(r'^(R5Arrive|PAsia|PSapa|PHanoi|PHalong|PNinhbinh|PHue|PDanang|PNhatrang|PDalat|PHcmc|PCantho|PPhuquoc)$', n): continue
        h = open(os.path.join(PROJ, f), encoding='utf-8').read()
        css = ''.join(re.findall(r'<style>.*?</style>', h, re.S))
        css = re.sub(r'body\{margin:0\}', '', css)
        body = h[h.index('</helmet>'):]
        i = body.index('<svg class="abs"'); j = body.index('</svg>', body.rindex('filter="url(#grain)"'))
        svg = re.sub(r'^<svg class="abs" style="[^"]*" width="(\d+)" height="(\d+)"', r'<svg viewBox="0 0 \1 \2" preserveAspectRatio="xMidYMid slice"', body[i:j + 6])
        put('kids-' + n.lower(), strip_scene(n, svg), css)
    # Nền màn học của bé (bảng S5KidsVisit): khung sau thẻ từ, không có nhân vật
    h = open(os.path.join(PROJ, 'S5KidsVisit.dc.html'), encoding='utf-8').read()
    body = h[h.index('</helmet>'):]
    i = body.index('<svg', body.index('class="t kids"')); j = body.index('</svg>', i)
    css = ''.join(re.findall(r'<style>.*?</style>', h, re.S)).replace('body{margin:0}', '')
    put('kids-visitbg', re.sub(r'^<svg [^>]*>', '<svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">', body[i:j + 6]), css)
    # Toạ độ điểm chạm: sinh tự động, không chép tay. Tranh viewBox 1280×720, sân khấu 16:9 nên chỉ cần nhân tỉ lệ.
    L = ['// Sinh bởi scripts/design-data/export-art.py --kids, không sửa tay. Toạ độ theo tranh 1280×720.',
         'export interface PlaceArt {', '  art: string', '  pet: { x: number; y: number; w: number }', '  /** Chỗ đặt biển chạm, theo thứ tự trên bảng */', '  spots: ReadonlyArray<{ x: number; y: number }>', '}', '',
         'export const PLACE_ART: Readonly<Record<string, PlaceArt>> = {']
    for k, v in gen_place.items():
        L += ['  %s: {' % k, "    art: '%s'," % v['art'], '    pet: { x: %g, y: %g, w: %d },' % (v['pet']['x'], v['pet']['y'], v['pet']['w']), '    spots: [']
        L += ['      { x: %g, y: %g }%s // %s' % (x, y, ',' if i < 4 else '', t) for i, (x, y, t) in enumerate(v['spots'])]
        L += ['    ]', '  },']
    L[-1] = '  }'
    L += ['}', '', '/** Biển tên trên bản đồ tầng 2 (PAsia) */', 'export const ASIA_ART = {', "  art: 'kids-pasia',", '  pet: { x: %g, y: %g, w: %d },' % (gen_asia['pet']['x'], gen_asia['pet']['y'], gen_asia['pet']['w']), '  spots: {']
    keys = [k for k in gen_asia if k != 'pet']
    L += ['    %s: { x: %g, y: %g }%s' % (k, gen_asia[k][0], gen_asia[k][1], ',' if k != keys[-1] else '') for k in keys]
    L += ['  } as Readonly<Record<string, { x: number; y: number }>>', '}', '']
    gp = os.path.join(ROOT, 'src', 'renderer', 'study', 'kids', 'game', 'placeArt.generated.ts')
    open(gp, 'w', encoding='utf-8', newline='\n').write('\n'.join(L))
