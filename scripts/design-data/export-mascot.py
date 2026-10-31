# Xuất thú cưng chibi sang asset của app: src/renderer/shared/art/pets/<id>.pet.json
#   python scripts/design-data/export-mascot.py <project chứa Char*.dc.html>
# Hình lấy từ review/gen_mascot.py (defs của Char*). Mỗi file: css, defs (một lần), egg, states{tên: svg}.
# 19 trạng thái: 16 hoạt ảnh + car/boat/plane. Giai đoạn baby/teen/adult/legend dùng chung hình, khác nhau ở tỉ lệ + màu (CSS lớp .st-*),
# Kitsu thêm số đuôi 1/3/5/9 (lớp .k21 .k42 .k63 .k84); egg là hình trứng trong Char*.
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'src', 'renderer', 'shared', 'art', 'pets')
sys.path.insert(0, os.path.join(HERE, 'review'))
import gen_mascot as G
G.proj = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

IDS = ['idle', 'walk', 'run', 'jump', 'sit', 'sleep', 'eat', 'drink', 'read', 'listen', 'say', 'hello', 'happy', 'sad', 'surprised', 'levelup', 'car', 'boat', 'plane']
FIG_VB = '-16 -8 192 168'   # hình đứng/đi...
VEH_VB = '-40 -50 240 210'  # trên phương tiện
# vị trí tâm đáy cho thu nhỏ theo giai đoạn
STAGE_CSS = """
.stg{transform-origin:80px 152px;transform-box:view-box}
.st-baby .stg{transform:scale(.72)}.st-teen .stg{transform:scale(.84)}.st-adult .stg{transform:scale(.92)}
.st-legend .stg{--fur2:#FFF6E5}
.still *{animation:none!important}
.k21{display:var(--d21,none)}.k42{display:var(--d42,none)}.k63{display:var(--d63,none)}.k84{display:var(--d84,none)}
.st-teen .stg{--d63:inline}.st-adult .stg{--d42:inline;--d84:inline}.st-legend .stg{--d21:inline;--d42:inline;--d63:inline;--d84:inline}
.st-legend svg.ps{filter:drop-shadow(0 0 7px rgba(255,214,107,.85))}
.st-egg .stg{transform:none}
"""
SKIP_OFF = ('body{', '.t{', '.h{', '.st{', '.chip{', '.sw{', '.d{')

def egg_of(name):
    s = open(os.path.join(G.proj, 'Char%s.dc.html' % name), encoding='utf-8').read()
    b = s[s.index('</defs></svg>'):]
    m = re.search(r'aria-label="[^"]*">(.*?)</svg>', b, re.S)
    css = re.search(r'<style>(.*?)</style>', s, re.S).group(1)
    rules = [r for r in re.findall(r'@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}|[^@{}]+\{[^{}]*\}', css) if not r.strip().startswith(SKIP_OFF)]
    # màu riêng của giai đoạn trưởng thành và huyền thoại (biến CSS ở thẻ <g> bọc hình)
    blocks = re.findall(r'aria-label="[^"]*">(.*?)</svg>', b, re.S)
    stage_vars = ''
    for i, nm in ((3, 'adult'), (4, 'legend')):
        mv = re.search(r'<g (?:class="bob"|transform="[^"]*") style="((?:--[a-z0-9]+:[^;"]+;?)+)"', blocks[i])
        if mv: stage_vars += '\n.st-%s .stg{%s}' % (nm, mv.group(1))
    return m.group(1), '\n'.join(rules) + stage_vars

def kitsu_back():
    # 9 đuôi, lớp k<góc> để CSS chọn số đuôi theo giai đoạn: 1 (giữa), 3 (+-63), 5 (+-42, +-84), 9 (tất cả)
    out = ''
    for a in (-84, 84, -63, 63, -42, 42, -21, 21, 0):
        cl = 'kc' if a == 0 else 'kt k%d' % abs(a)
        tr = ('rotate(%d 80 122) ' % a if a else '') + 'translate(80 122) scale(.85) translate(-80 -122)'
        fur = '' if a == 0 else ' style="--fur:var(--fur2,#E88F3F)"'
        out += '<g class="%s"%s><use href="#ktail" transform="%s"/></g>' % (cl, fur, tr)
    return out

def build(fn, ident):
    c = fn()
    if ident == 'kitsu': c['back'] = kitsu_back()
    defs = c['d'] + ''.join('<g id="%s">%s</g>' % kv for kv in (('c-back', c['back']), ('c-torso', c['torso']), ('c-foot0', c['feet'][0]), ('c-foot1', c['feet'][1]), ('c-head', c['head']), ('c-over', c['over']), ('c-eopen', '<g class="blink">%s</g>' % c['eyes']), ('c-mouth', c['mouth'])))
    if 'id="aura"' not in defs:
        defs += '<radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>'
    sts = G.states(c)
    assert len(sts) == len(IDS), len(sts)
    states = {}
    for sid, (svg, _n, _d) in zip(IDS, sts):
        vb = VEH_VB if sid in ('car', 'boat', 'plane') else FIG_VB
        # vật phương tiện đã có nền riêng; bọc thân trong .stg chỉ với dáng đứng
        body = svg if sid in ('car', 'boat', 'plane') else '<g class="stg">%s</g>' % svg
        states[sid] = '<svg class="ps" data-s="%s" viewBox="%s" preserveAspectRatio="xMidYMax meet" aria-hidden="true">%s</svg>' % (sid, vb, body)
    egg, egg_css = egg_of(c['id'])
    states['egg'] = '<svg class="ps" data-s="egg" viewBox="%s" preserveAspectRatio="xMidYMax meet" aria-hidden="true">%s</svg>' % (FIG_VB, egg)
    css = G.CSS.replace('%EY', str(c['ey'])) + '\n' + egg_css + STAGE_CSS
    # bỏ phần CSS của bảng (.ms .mn .md .gr)
    css = re.sub(r'\.(ms|mn|md|gr)[ {][^\n]*\n?', '', css)
    path = os.path.join(OUT, ident + '.pet.json')
    json.dump({'css': css, 'defs': defs, 'states': states}, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(ident, os.path.getsize(path) // 1024, 'KB')

for ident, fn in (('kitsu', G.kitsu), ('bi', G.bi), ('draco', G.draco), ('robo', G.robo), ('lupo', G.lupo)):
    build(fn, ident)
