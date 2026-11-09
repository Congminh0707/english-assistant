# Xuất mascot v3 sang asset của app: src/renderer/shared/art/pets/<id>.pet.json
#   python scripts/design-data/mascot/export.py
# Mỗi file: css (hoạt ảnh chung), vb (khung nhìn), egg {defs, svg}, stages {baby|teen|adult|legend: {scale, defs, bg, fg, states{dáng: svg}}},
# acc {id phụ kiện: {slot, defs, b (sau thân), f (trước thân)}}. PetFigure ráp: defs + bg + <g stage scale>[b + dáng + f] + fg.
# Đồ cổ mặc định của giai đoạn (khăn, chuông, dây thừng) nằm trong <g class="nk"> để ẩn khi đeo phụ kiện cổ.
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'src', 'renderer', 'shared', 'art', 'pets')

import build                       # noqa: E402  (nạp chars2/chars3: bản vẽ v3 cho cả 5 con)
from chars import CHARS, NECK, egg, star   # noqa: E402
import acc2                        # noqa: E402

POSE_IDS = ['idle', 'walk', 'run', 'jump', 'sit', 'sleep', 'eat', 'drink', 'read', 'listen', 'say', 'hello', 'happy', 'sad', 'surprised', 'levelup', 'car', 'boat', 'plane']
VEHICLES = ('car', 'boat', 'plane')
STAGES = ('baby', 'teen', 'adult', 'legend')
VB = {'fig': '-16 -8 192 168', 'legend': '-40 -36 240 196', 'veh': '-40 -50 240 210'}
ROOT_CLS = {'idle': 'br', 'walk': 'bob', 'run': 'run', 'jump': 'jmp', 'sit': '', 'sleep': 'slp', 'eat': 'br', 'drink': 'br', 'read': 'br', 'listen': 'br',
            'say': 'br', 'hello': 'br', 'happy': 'hop', 'sad': 'sigh', 'surprised': 'jmp', 'levelup': 'rise'}

EXTRA_CSS = '''
.run{animation:bob .32s ease-in-out infinite;transform-origin:80px 150px}
.slp{animation:br 4s ease-in-out infinite;transform-origin:80px 150px}
.sigh{animation:sigh 3s ease-in-out infinite;transform-origin:80px 150px}
@keyframes sigh{50%{transform:translateY(2px) scale(1.02,.97)}}
.rise{animation:fl 1.6s ease-in-out infinite}
.zz{animation:zz 2.4s ease-in infinite}
@keyframes zz{0%{opacity:0;transform:translate(0,6px)}30%{opacity:1}100%{opacity:0;transform:translate(10px,-22px)}}
.ring{animation:ring 1.4s ease-out infinite}
@keyframes ring{from{opacity:1}to{opacity:0}}
.bar{animation:bar .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
@keyframes bar{to{transform:scaleY(.35)}}
.tear{animation:tear 1.8s ease-in infinite}
@keyframes tear{0%{opacity:0;transform:translateY(-3px)}30%{opacity:1}100%{opacity:0;transform:translateY(12px)}}
.pop{animation:pop 1s ease-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes pop{0%{transform:scale(0)}30%{transform:scale(1.2)}50%,100%{transform:scale(1)}}
.road{animation:road .6s linear infinite}
@keyframes road{to{transform:translateX(-60px)}}
.wheel{animation:spin .6s linear infinite;transform-box:fill-box;transform-origin:50% 50%}
.rock{animation:wob 2.6s ease-in-out infinite;transform-box:view-box;transform-origin:80px 120px}
.cloud{animation:cloud 6s linear infinite}
@keyframes cloud{from{transform:translateX(40px)}to{transform:translateX(-80px)}}
.prop{animation:propr .12s linear infinite;transform-box:fill-box;transform-origin:50% 50%}
@keyframes propr{50%{transform:scaleY(.2)}}
.still *{animation:none!important}
.no-nk .nk{display:none}
.hide-hand .acc-hand{display:none}
'''

INK = '#6B4A30'

# ---------------- đạo cụ theo dáng (toạ độ hình 160×160) ----------------
def apple(x, y):
    return (f'<g transform="translate({x} {y})"><path d="M0 -10C-7 -15 -16 -12 -16 -2C-16 9 -7 16 0 14C7 16 16 9 16 -2C16 -12 7 -15 0 -10Z" fill="#E8483E"/>'
            '<path d="M0 -10Q0 -15 3 -18" stroke="#6B4A30" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M3 -14Q10 -20 14 -15Q9 -9 3 -14Z" fill="#5BC46E"/>'
            '<ellipse cx="-8" cy="-4" rx="3" ry="5" fill="#fff" opacity=".45" transform="rotate(-20 -8 -4)"/></g>')

def cup(x, y):
    return (f'<g transform="translate({x} {y})"><path d="M5 -12L12 -32L17 -30" stroke="#E8483E" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
            '<path d="M-11 -14H11L8 13H-8Z" fill="#CFEFF7"/><path d="M-10 -3H10L8 13H-8Z" fill="#FFB8C8"/><ellipse cx="-5" cy="-6" rx="2" ry="5" fill="#fff" opacity=".6"/></g>')

BOOK = ('<path d="M46 112Q80 102 80 116Q80 102 114 112V142Q80 132 80 146Q80 132 46 142Z" fill="#FFFDF5"/>'
        '<path d="M46 112Q80 102 80 116V146Q80 132 46 142Z" fill="#F4EBD6"/>'
        '<path d="M80 116V146M54 120Q66 116 74 120M54 128Q66 124 74 128M86 120Q96 116 106 120M86 128Q96 124 106 128" stroke="#D6BE90" stroke-width="2" fill="none" stroke-linecap="round"/>'
        '<path d="M100 108V122l4 -4l4 4V110" fill="#E8483E"/>')

def hearts():
    h = lambda x, y, d: f'<g transform="translate({x} {y})"><path class="up" style="animation-delay:-{d}s" d="M0 4c-5 -9 -16 -3 -11 6l11 11l11 -11c5 -9 -6 -15 -11 -6Z" fill="#FF6F8E"/></g>'
    return h(10, 40, 0) + h(150, 34, .7) + build.spk(150, 4, .9, .4) + build.spk(6, 8, .7, 1.1)

def zs():
    return ''.join(f'<text class="zz" style="animation-delay:-{d}s" x="{x}" y="{y}" font-family="Be Vietnam Pro, sans-serif" font-weight="800" font-size="{s}" fill="#7C8AC0">z</text>'
                   for x, y, s, d in ((122, 30, 18, 0), (136, 14, 22, .8), (150, -4, 26, 1.6)))

def waves(x, y, flip):
    return ''.join(f'<path class="ring" style="animation-delay:-{k*.45:.2f}s" d="M{x + flip*k*8} {y - 8 - k*4}q{flip*(7 + k*3)} {8 + k*4} 0 {16 + k*8}" stroke="#3C8FD6" stroke-width="3" fill="none" stroke-linecap="round"/>' for k in range(3))

def speech():
    bars = ''.join(f'<rect class="bar" style="animation-delay:-{k*.18:.2f}s" x="{126 + k*9}" y="-6" width="5" height="14" rx="2.5" fill="#3C8FD6"/>' for k in range(4))
    return f'<path d="M120 -16h44q8 0 8 8v14q0 8 -8 8h-26l-12 10l2 -10h-8q-8 0 -8 -8v-14q0 -8 8 -8Z" fill="#FFFFFF" stroke="#D9CDB4" stroke-width="2"/>{bars}'

def rays():
    return ('<g class="spin" style="transform-origin:80px 80px">' + ''.join(f'<path d="M80 80L72 -30H88Z" fill="#FFD66B" opacity=".35" transform="rotate({i*45} 80 80)"/>' for i in range(8)) + '</g>')

def arrow():
    return '<path class="up" d="M80 -18l14 14h-8v12h-12v-12h-8Z" fill="#3CCB6B"/>'

def dust(fast=False):
    o = ''.join(f'<circle class="up" style="animation-delay:-{d}s" cx="{x}" cy="{y}" r="{r}" fill="#E9D3A8"/>' for x, y, r, d in ((22, 146, 5, 0), (8, 142, 4, .5)))
    if fast:
        o += '<path d="M-20 70H0M-26 96H-6M-18 122H2" stroke="#D9C49A" stroke-width="3" stroke-linecap="round"/>'
    return o

def props(n, pose, p):
    """(sau thân, trong khối thân, trên cùng) cho một dáng"""
    a = acc2.ANCHOR[n]
    behind = inner = top = ''
    if pose == 'walk': behind = dust()
    if pose == 'run': behind = dust(True)
    if pose == 'eat': inner = apple(80, 124)
    if pose == 'drink': inner = cup(76, 124)
    if pose == 'read': inner = BOOK
    if pose == 'listen':
        d, b, f = acc2.draw('headphones', n, p + 'hp')
        inner = f'<defs>{d}</defs>{f}'
        top = waves(80 + 62, a['ey'], 1) + waves(80 - 62, a['ey'], -1)
    if pose == 'say': top = speech()
    if pose == 'sleep': top = zs()
    if pose == 'happy': top = hearts()
    if pose == 'sad':
        inner = f'<path class="tear" d="M{80 - a["dx"] - 4} {a["ey"] + 12}q5 7 0 10q-5 -3 0 -10Z" fill="#7FC8EC"/>'
    if pose == 'surprised':
        top = '<text class="pop" x="146" y="34" font-family="Be Vietnam Pro, sans-serif" font-weight="800" font-size="40" fill="#E2483E">!</text>'
    if pose == 'levelup':
        behind = rays()
        top = arrow() + build.spk(12, 30, 1.1, 0) + build.spk(150, 26, 1.1, .5) + build.spk(30, -10, .9, 1) + build.spk(134, -14, .9, 1.4)
    return behind, inner, top

# ---------------- phương tiện (figure đã thu theo giai đoạn) ----------------
ST = f'stroke="{INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"'

def wheel(x, y, r=16):
    return (f'<g class="wheel"><circle cx="{x}" cy="{y}" r="{r}" fill="#3A3540"/><circle cx="{x}" cy="{y}" r="{r-7}" fill="#E7DFC9"/>'
            f'<path d="M{x} {y-(r-7)}v{2*(r-7)}M{x-(r-7)} {y}h{2*(r-7)}" stroke="#3A3540" stroke-width="2.6"/></g>')

def rider(fig, x, y, s):
    return f'<g transform="translate({x} {y}) scale({s}) translate(-80 -150)">{fig}</g>'

def v_car(fig):
    road = ('<rect x="-40" y="146" width="240" height="14" fill="#C9B28C"/><g class="road"><path d="M-60 153H-30M0 153H30M60 153H90M120 153H150M180 153H210M240 153H270" stroke="#FFF9EA" stroke-width="3.4" stroke-linecap="round"/></g>')
    body = ('<path d="M-20 134V112Q-20 100 -6 98L38 96Q52 112 92 106L126 82L136 88L124 102L164 102Q184 104 186 122V134Q186 142 176 142H-10Q-20 142 -20 134Z" fill="#E8504A"/>'
            '<path d="M-20 124H186V134Q186 142 176 142H-10Q-20 142 -20 134Z" fill="#B8322E"/><path d="M-8 110Q14 106 32 106" stroke="#FFC4B8" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
            '<circle cx="178" cy="116" r="5.4" fill="#FFE08A"/>')
    return road + rider(fig, 46, 128, .62) + body + wheel(28, 142, 18) + wheel(142, 142, 18)

def v_boat(fig):
    water = '<rect x="-40" y="132" width="240" height="28" fill="#4CC3D6"/>'
    sail = '<path d="M118 112V6" stroke="#8A5A3C" stroke-width="4"/><path d="M122 12Q182 56 176 100H122Z" fill="#F2C76A"/><path d="M122 52Q150 62 176 72" stroke="#C99A3A" stroke-width="2.4" fill="none"/>'
    hull = ('<g transform="translate(-40 -64) scale(.62)"><path d="M50 236Q120 256 200 256T352 226Q334 300 280 318H128Q72 310 50 236Z" fill="#2F8C7E"/>'
            '<path d="M66 262Q200 292 338 256" stroke="#EFE6CC" stroke-width="9" fill="none"/></g>')
    wv = '<g class="road"><path d="M-64 136q10 -8 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="#D5F4F7" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>'
    return water + '<g class="rock">' + sail + rider(fig, 50, 116, .6) + hull + '</g>' + wv

def v_plane(fig):
    cl = lambda x, y, s, d: (f'<g class="cloud" style="animation-delay:-{d}s"><g transform="translate({x} {y}) scale({s})"><path d="M-30 10C-44 10 -44 -6 -30 -6C-28 -22 -4 -22 2 -8C18 -14 30 -2 22 10Z" fill="#FFFFFF"/></g></g>')
    bg = '<rect x="-40" y="-50" width="240" height="210" fill="#CDEFF7"/>' + cl(40, -20, 1, 0) + cl(160, 30, .8, 2.5) + cl(100, 130, 1.1, 1.2)
    tail = '<path d="M-14 84L-34 44L-16 44L6 82Z" fill="#E8504A"/>'
    body = ('<path d="M-22 96Q-30 84 -8 80L60 78Q98 98 140 78L172 82Q196 90 196 100Q194 116 166 120L20 122Q-12 118 -22 96Z" fill="#F7C43A"/>'
            '<path d="M-14 106Q60 116 190 108Q184 118 166 120L20 122Q-6 120 -14 106Z" fill="#D9962A"/>')
    wing = '<path d="M64 110L120 110L88 150L50 150Z" fill="#E8504A"/><path d="M8 94H42" stroke="#FFF3B0" stroke-width="3.4" stroke-linecap="round"/>'
    prop = '<circle cx="196" cy="100" r="6" fill="#6B5A4E"/><ellipse class="prop" cx="199" cy="100" rx="4.4" ry="30" fill="#6B5A4E" opacity=".7"/>'
    return bg + '<g class="rock">' + tail + rider(fig, 96, 108, .56) + body + wing + prop + '</g>'

VEH = {'car': v_car, 'boat': v_boat, 'plane': v_plane}

def tag_neck(full, bare):
    """Bọc phần đồ cổ mặc định (có trong full, không có trong bare) vào <g class="nk">"""
    if full == bare:
        return full
    i = 0
    while i < len(bare) and full[i] == bare[i]:
        i += 1
    j = 0
    while j < len(bare) - i and full[-1 - j] == bare[-1 - j]:
        j += 1
    # lùi về ranh giới thẻ để không cắt giữa thuộc tính
    while i > 0 and full[i] != '<':
        i -= 1
    end = len(full) - j
    while end < len(full) and full[end - 1] != '>':
        end += 1
    return full[:i] + '<g class="nk">' + full[i:end] + '</g>' + full[end:]

def figure(n, stage, pose, p):
    fn = CHARS[n]
    d, full = fn(stage, pose, p)
    NECK['on'] = False
    _, bare = fn(stage, pose, p)
    NECK['on'] = True
    return d, tag_neck(full, bare)

def export(n):
    out = {'css': build.CSS + EXTRA_CSS, 'vb': VB, 'stages': {}, 'acc': {}}
    ed, ef = egg(n, n[0] + 'e')
    out['egg'] = {'defs': ed, 'svg': ef}
    for st in STAGES:
        p = n[0] + st[0]
        sc = build.SC[st]
        defs = ''
        states = {}
        for pose in POSE_IDS:
            if pose in VEHICLES:
                d, f = figure(n, st, 'idle', p)
                defs = defs or d
                fig = f'<g transform="translate(80 150) scale({sc}) translate(-80 -150)">{f}</g>'
                states[pose] = VEH[pose](fig)
                continue
            d, f = figure(n, st, pose, p)
            defs = defs or d
            b, inn, top = props(n, pose, p)
            rc = ROOT_CLS[pose]
            body = f'<g class="{rc}" style="transform-origin:80px 150px">{f}{inn}</g>'
            if pose == 'sit':
                body = f'<g transform="translate(80 150) scale(1.04 .9) translate(-80 -150)">{f}{inn}</g>'
            states[pose] = b + body + top
        entry = {'scale': sc, 'defs': defs, 'states': states}
        if st == 'legend':
            col, bd = build.BACKDROP[n]
            entry['defs'] += (f'<radialGradient id="{p}gl"><stop offset="0" stop-color="{col}" stop-opacity=".8"/><stop offset=".6" stop-color="{col}" stop-opacity=".22"/>'
                              f'<stop offset="1" stop-color="{col}" stop-opacity="0"/></radialGradient>')
            entry['bg'] = f'<circle cx="80" cy="84" r="100" fill="url(#{p}gl)"/>' + bd
            entry['fg'] = build.FRONT[n]
        out['stages'][st] = entry
    for a in acc2.ACC:
        aid = a[0]
        d, b, f = acc2.draw(aid, n, 'a' + aid.replace('-', ''))
        out['acc']['acc:' + aid] = {'slot': a[2], 'defs': d, 'b': b, 'f': f}
    path = os.path.join(OUT, n + '.pet.json')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(',', ':'))
    print(n, os.path.getsize(path) // 1024, 'KB')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for n in (sys.argv[1:] or ['bi', 'kitsu', 'draco', 'robo', 'lupo']):
        export(n)
