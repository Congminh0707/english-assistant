# Xuất tranh từ bộ vẽ thiết kế sang asset của app: src/renderer/shared/art/scenes/<tên>.art.html
#   python scripts/design-data/export-art.py <project chứa *.dc.html> [--kids]
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

for ph in ('day', 'dusk', 'night'):
    put('village-' + ph, wrap(1100, 720, V.village(ph)))
for key in ('courses', 'review', 'practice', 'settings', 'words', 'phrases', 'pet', 'shop', 'stats'):
    for dark in (False, True):
        s = K.place_scene(key, dark)
        put('place-%s%s' % (key, '-dark' if dark else ''), s.replace('<svg ', '<svg viewBox="0 0 216 720" preserveAspectRatio="xMidYMax slice" ', 1) if 'viewBox' not in s[:200] else s)

if '--kids' in sys.argv:
    # Cảnh địa điểm và bản đồ: lấy nguyên tranh trên bảng, bỏ phần HUD HTML
    for f in sorted(os.listdir(PROJ)):
        n = f.replace('.dc.html', '')
        if not re.match(r'^(R5Arrive|R5World|PAsia|PEarth|PSapa|PHanoi|PHalong|PNinhbinh|PHue|PDanang|PNhatrang|PDalat|PHcmc|PCantho|PPhuquoc)$', n): continue
        h = open(os.path.join(PROJ, f), encoding='utf-8').read()
        css = ''.join(re.findall(r'<style>.*?</style>', h, re.S))
        css = re.sub(r'body\{margin:0\}', '', css)
        body = h[h.index('</helmet>'):]
        i = body.index('<svg class="abs"'); j = body.index('</svg>', body.rindex('filter="url(#grain)"'))
        svg = re.sub(r'^<svg class="abs" style="[^"]*" width="(\d+)" height="(\d+)"', r'<svg viewBox="0 0 \1 \2" preserveAspectRatio="xMidYMid slice"', body[i:j + 6])
        put('kids-' + n.lower(), svg, css)
