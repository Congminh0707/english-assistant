# Bảng trạng thái mascot: CMascotKitsu/Bi/Draco/Robo/Lupo, mỗi bảng 16 trạng thái có hoạt ảnh CSS + 3 dáng trên xe, thuyền, máy bay.
# Hình lấy từ defs của Char*.dc.html trong project (chỉ đọc): tách đầu, thân, chân, mắt, miệng để đổi nét mặt; tay là phần vẽ thêm cùng màu.
# python gen_mascot.py <project>   (không tham số: dùng BOARD_OUT)
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_cards import board

proj = None
BR = '#6B3E1E'

# ---------- đọc defs ----------
def defs_of(name):
    s = open(os.path.join(proj, 'Char%s.dc.html' % name), encoding='utf-8').read()
    return re.search(r'<defs>(.*?)</defs>', s, re.S).group(1)
def block(src, start):
    # lấy một khối <g ...>...</g> cân thẻ, bắt đầu tại chuỗi start
    i = src.index(start); j = i; depth = 0
    for m in re.finditer(r'<g\b|</g>', src[i:]):
        depth += 1 if m.group() != '</g>' else -1
        if depth == 0:
            j = i + m.end(); break
    return src[i:j]
def inner(src, gid):
    b = block(src, '<g id="%s">' % gid)
    return b[len('<g id="%s">' % gid):-len('</g>')]
ELEM = re.compile(r'<(?:ellipse|circle|path|rect|use)\b[^>]*?/>')
def pick(src, *subs):
    return ''.join(m.group() for m in ELEM.finditer(src) if any(s in m.group() for s in subs))
def drop(src, *subs):
    return ELEM.sub(lambda m: '' if any(s in m.group() for s in subs) else m.group(), src)
def rid(src, gid):
    # bỏ một khối <g id=...> khỏi defs để thay bằng bản tách lớp
    return src.replace(block(src, '<g id="%s">' % gid), '')

def kitsu():
    d = defs_of('Kitsu'); fox = inner(d, 'fox')
    eyes = pick(fox, 'cy="77"', 'cy="82"', 'cy="72.5"', 'cy="81.5"')
    head = drop(fox, 'cy="141"', 'cy="124"', 'cy="130"', 'cy="77"', 'cy="82"', 'cy="72.5"', 'cy="81.5"', 'M73 90')
    tails = ''.join('<g style="--fur:%s"><use href="#ktail" transform="%stranslate(80 122) scale(.85) translate(-80 -122)"/></g>' % (c, r) for c, r in (('#E88F3F', 'rotate(-62 80 122) '), ('#E88F3F', 'rotate(62 80 122) '), ('#F4A259', '')))
    feet = re.findall(r'<ellipse[^>]*cy="141"[^>]*/>', fox)
    return dict(id='Kitsu', vi='Kitsu', d=rid(d, 'fox'), back=tails, tail=(80, 122), torso=pick(fox, 'cy="124"', 'cy="130"'), feet=feet, head=head, over='<use href="#kbib"/>', eyes=eyes,
                mouth=pick(fox, 'M73 90'), limb='#F4A259', hand='#7A4332', sh=(23, 116), w=11, ex=22, ey=77, er=8, ec='#3A2430', mx=80, my=93, mc='#3A2430', hw=54, top=30, pivot=108, base=146)
def bi():
    d = defs_of('Bi'); b = inner(d, 'bbody')
    eyes = block(b, '<g class="blink">'); eyes = eyes[len('<g class="blink">'):-len('</g>')]
    body = b.replace(block(b, '<g class="blink">'), '')
    feet = re.findall(r'<ellipse[^>]*cy="140"[^>]*/>', b)
    head = drop(body, 'cy="140"', 'cy="106"', 'M72 104')
    wing = '<use href="#bleafw"/><g transform="translate(160 0) scale(-1 1)"><use href="#bleafw"/></g>'
    sprout = '<path d="M80 40C80 28 80 20 80 12" stroke="#4CAF6A" stroke-width="4" stroke-linecap="round"/><path d="M80 32C68 30 60 22 62 13C73 13 82 21 80 32Z" fill="#5BC46E"/><path d="M80 32C92 30 100 22 98 13C87 13 78 21 80 32Z" fill="#6ED27F"/><ellipse cx="80" cy="8" rx="6" ry="9" fill="#FF8FB1"/>'
    return dict(id='Bi', vi='Bi', d=rid(d, 'bbody'), back=wing, tail=(80, 110), torso='', feet=feet, head=sprout + head, over='<path d="M54 118Q80 132 106 118L104 128Q80 142 56 128Z" fill="#3F6FE0"/>', eyes=eyes,
                mouth=pick(b, 'M72 104'), limb='#7FD6C6', hand='#5FB8A8', sh=(50, 104), w=12, ex=24, ey=93, er=9, ec='#2B2B3A', mx=80, my=107, mc='#2B2B3A', hw=58, top=40, pivot=134, base=146)
def draco():
    d = defs_of('Draco'); h = inner(d, 'dhead'); t = inner(d, 'dtorso')
    eyes = block(h, '<g class="blink">'); eyes = eyes[len('<g class="blink">'):-len('</g>')]
    head = drop(h.replace(block(h, '<g class="blink">'), ''), 'M72 96')
    feet = [''.join(re.findall(r'<(?:ellipse|circle)[^>]*(?:cx="62" cy="150"|cx="56"|cx="62" cy="153")[^>]*/>', t)), ''.join(re.findall(r'<(?:ellipse|circle)[^>]*(?:cx="98"|cx="104")[^>]*/>', t))]
    torso = drop(t, 'cy="150"', 'cy="152"', 'cy="153"')
    wing = '<use href="#dwing" transform="translate(58 106) scale(.55) translate(-58 -106)"/><g transform="translate(160 0) scale(-1 1)"><use href="#dwing" transform="translate(58 106) scale(.55) translate(-58 -106)"/></g><use href="#dtail"/>'
    horn = '<use href="#dhorn"/><use href="#dhorn" transform="translate(160 0) scale(-1 1)"/>'
    return dict(id='Draco', vi='Draco', d=rid(rid(d, 'dhead'), 'dtorso'), back=wing, tail=(80, 118), torso=torso, feet=feet, head=horn + head, over='<path d="M52 108Q80 124 108 108L106 120Q80 136 54 120Z" fill="#E8604C"/>', eyes=eyes,
                mouth=pick(h, 'M72 96'), limb='#6ED3A0', hand='#4FB88A', sh=(35, 118), w=12, ex=28, ey=72, er=11, ec='#3A2430', mx=80, my=98, mc='#3A8F6A', hw=60, top=26, pivot=108, base=153)
def robo():
    d = defs_of('Robo'); b = inner(d, 'rbody')
    eyes = block(b, '<g class="blink">'); eyes = eyes[len('<g class="blink">'):-len('</g>')]
    b2 = b.replace(block(b, '<g class="blink">'), '')
    feet = re.findall(r'<rect[^>]*y="138"[^>]*/>', b)
    torso = pick(b2, 'y="108"', 'y="116"', 'cy="125"', 'cy="123.5"').replace(' class="core"', ' class="core"')
    head = drop(b2, 'y="138"', 'cy="124"', 'y="108"', 'y="116"', 'cy="125"', 'cy="123.5"', 'M71 88')
    fins = '<use href="#rfin"/><use href="#rfin" transform="translate(160 0) scale(-1 1)"/>'
    return dict(id='Robo', vi='Robo', d=rid(d, 'rbody'), back=fins, tail=(80, 40), torso=torso, feet=feet, head='<use href="#rant"/>' + head, over='<rect x="46" y="104" width="22" height="10" rx="5" fill="#FF8A4C"/><rect x="92" y="104" width="22" height="10" rx="5" fill="#FF8A4C"/>', eyes=eyes,
                mouth=pick(b, 'M71 88'), limb='#9FB6D6', hand='#C9D9EE', sh=(32, 116), w=10, ex=22, ey=68, er=10, ec='#5CE1E6', mx=80, my=91, mc='#5CE1E6', hw=64, top=26, pivot=110, base=147)
def lupo():
    d = defs_of('Lupo'); h = inner(d, 'lhead'); t = inner(d, 'lbody')
    eyes = block(h, '<g class="blink">'); eyes = eyes[len('<g class="blink">'):-len('</g>')]
    head = drop(h.replace(block(h, '<g class="blink">'), ''), 'M80 91V94')
    feet = [''.join(re.findall(r'<ellipse[^>]*cx="65"[^>]*/>', t)) + '<circle cx="61" cy="148" r="1.8" style="fill:var(--ein,#FFC9D2)"/><circle cx="66" cy="149" r="1.8" style="fill:var(--ein,#FFC9D2)"/>',
            ''.join(re.findall(r'<ellipse[^>]*cx="95"[^>]*/>', t)) + '<circle cx="94" cy="149" r="1.8" style="fill:var(--ein,#FFC9D2)"/><circle cx="99" cy="148" r="1.8" style="fill:var(--ein,#FFC9D2)"/>']
    torso = pick(t, 'M80 96', 'M56 106')
    moon = '<use href="#lmoon" transform="translate(80 46) scale(.5)"/>'
    return dict(id='Lupo', vi='Lupo', d=rid(rid(d, 'lhead'), 'lbody'), back='<use href="#ltail"/>', tail=(100, 128), torso=torso + '<path d="M52 104Q80 122 108 104L106 116Q80 134 54 116Z" fill="#3F6FE0"/>', feet=feet, head=head + moon, over='', eyes=eyes,
                mouth=pick(h, 'M80 91V94'), limb='#8FA6C8', hand='#FFF6E6', sh=(30, 116), w=11, ex=23, ey=77, er=9, ec='#2E2A44', mx=80, my=100, mc='#3A2F40', hw=56, top=26, pivot=108, base=150)

# ---------- nét mặt ----------
def eyes(c, kind):
    x0, x1, y, r, col = 80 - c['ex'], 80 + c['ex'], c['ey'], c['er'], c['ec']
    glow = '#fff'
    if kind == 'open': return '<use href="#c-eopen"/>'
    if kind == 'closed':
        return '<path d="M%d %dq%d %d %d 0M%d %dq%d %d %d 0" stroke="%s" stroke-width="4" fill="none" stroke-linecap="round"/>' % (x0 - r, y, r, r, 2 * r, x1 - r, y, r, r, 2 * r, col)
    if kind == 'happy':
        return '<path d="M%d %dq%d %d %d 0M%d %dq%d %d %d 0" stroke="%s" stroke-width="4.4" fill="none" stroke-linecap="round"/>' % (x0 - r, y + 3, r, -r - 3, 2 * r, x1 - r, y + 3, r, -r - 3, 2 * r, col)
    if kind == 'down':
        o = ''
        for x in (x0, x1):
            o += '<ellipse cx="%d" cy="%d" rx="%d" ry="%.1f" fill="%s"/><circle cx="%.1f" cy="%d" r="2.4" fill="%s"/><path d="M%d %dq%d -6 %d 0" stroke="%s" stroke-width="3.6" fill="none" stroke-linecap="round"/>' % (x, y + 4, r, r * .72, col, x - 2.4, y + 2, glow, x - r - 2, y - 2, r + 2, 2 * r + 4, col)
        return o
    if kind == 'surp':
        return ''.join('<ellipse cx="%d" cy="%d" rx="%.1f" ry="%.1f" fill="%s"/><circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/><circle cx="%.1f" cy="%.1f" r="2" fill="%s"/>' % (x, y - 1, r * 1.22, r * 1.5, col, x - 3, y - 7, r * .55, glow, x + 3.5, y + 4, glow) for x in (x0, x1))
    if kind == 'sad':
        o = ''
        for x, sg in ((x0, -1), (x1, 1)):
            o += '<ellipse cx="%d" cy="%d" rx="%.1f" ry="%.1f" fill="%s"/><circle cx="%.1f" cy="%d" r="3" fill="%s"/><circle cx="%.1f" cy="%d" r="1.6" fill="%s"/>' % (x, y + 2, r * .85, r * 1.05, col, x - 2.4, y - 2, glow, x + 2.6, y + 6, glow)
            o += '<path d="M%d %dL%d %d" stroke="%s" stroke-width="3.2" stroke-linecap="round"/>' % (x - sg * 2, y - r - 7, x + sg * 11, y - r - 3, col)
        return o
    return ''
def mouth(c, kind):
    x, y, col = c['mx'], c['my'], c['mc']
    if kind == 'smile': return '<use href="#c-mouth"/>'
    if kind == 'talk': return '<ellipse class="q-talk" style="transform-origin:%dpx %dpx" cx="%d" cy="%d" rx="6" ry="6.5" fill="%s"/>' % (x, y, x, y + 1, col)
    if kind == 'chew': return '<ellipse class="q-chew" style="transform-origin:%dpx %dpx" cx="%d" cy="%d" rx="6" ry="3.4" fill="%s"/>' % (x, y, x, y + 1, col)
    if kind == 'o': return '<ellipse cx="%d" cy="%d" rx="4.4" ry="5.6" fill="%s"/>' % (x, y + 1, col)
    if kind == 'sad': return '<path d="M%d %dq7 -6 14 0" stroke="%s" stroke-width="2.6" fill="none" stroke-linecap="round"/>' % (x - 7, y + 4, col)
    if kind == 'flat': return '<path d="M%d %dh8" stroke="%s" stroke-width="2.6" stroke-linecap="round"/>' % (x - 4, y + 2, col)
    return ''

# ---------- tay ----------
def arm(c, side, hx, hy, cls='', via=None):
    # tay ngắn cùng màu thân; side -1 bên trái hình; hx, hy là toạ độ bàn tay
    sx, sy = 80 + side * c['sh'][0], c['sh'][1]
    mx, my = via if via else ((sx + hx) / 2 + side * 3, (sy + hy) / 2 + 2)
    o = '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0f" stroke="%s" stroke-width="%d" fill="none" stroke-linecap="round"/><circle cx="%.0f" cy="%.0f" r="%.1f" fill="%s"/>' % (sx, sy, mx, my, hx, hy, c['limb'], c['w'], hx, hy, c['w'] * .68, c['hand'])
    return '<g class="%s" style="transform-origin:%.0fpx %.0fpx">%s</g>' % (cls, sx, sy, o) if cls else o
def rest(c, side, cls=''):
    return arm(c, side, 80 + side * (c['sh'][0] + 7), c['sh'][1] + 19, cls)

# ---------- phụ kiện, hiệu ứng ----------
GRD = '<ellipse cx="80" cy="150" rx="74" ry="9" fill="#7EDB62"/><path d="M22 151l-3 -8M36 155l0 -8M124 153l3 -8M138 151l4 -7" stroke="#0E8A58" stroke-width="2" fill="none"/>'
SPK = lambda x, y, d, s=1, c='#FFD66B': '<g transform="translate(%d %d) scale(%s)"><path class="q-tw" style="--d:-%.1fs" d="M0 -9C1 -3 3 -1 9 0C3 1 1 3 0 9C-1 3 -3 1 -9 0C-3 -1 -1 -3 0 -9Z" fill="%s"/></g>' % (x, y, s, d, c)
HEART = lambda x, y, d: '<g transform="translate(%d %d)"><path class="q-up" style="--d:-%.1fs" d="M0 4c-5 -9 -16 -3 -11 6l11 11l11 -11c5 -9 -6 -15 -11 -6Z" fill="#E8604C"/></g>' % (x, y, d)
Z = lambda x, y, d: '<text class="q-z" style="--d:-%.1fs" x="%d" y="%d" font-family="Be Vietnam Pro" font-weight="800" font-size="22" fill="%s">z</text>' % (d, x, y, BR)
DUST = lambda xs: ''.join('<circle class="q-dust" style="--d:-%.2fs" cx="%d" cy="%d" r="%d" fill="#E9C68A"/>' % (d, x, y, r) for x, y, r, d in xs)
BOOK = '<g class="q-page"><path d="M46 112Q80 102 80 116Q80 102 114 112V142Q80 132 80 146Q80 132 46 142Z" fill="#FFF9EA" stroke="%s" stroke-width="2.4" stroke-linejoin="round"/><path d="M80 116V146M54 118Q66 114 74 118M54 126Q66 122 74 126M86 118Q96 114 106 118M86 126Q96 122 106 126" stroke="#C9A06A" stroke-width="2" fill="none"/></g>' % BR
def apple(x, y): return '<g transform="translate(%d %d)"><path d="M0 -12C-8 -18 -19 -14 -19 -2C-19 10 -8 19 0 17C8 19 19 10 19 -2C19 -14 8 -18 0 -12Z" fill="#E2483E" stroke="%s" stroke-width="2.4"/><path d="M0 -12Q0 -18 4 -22" stroke="%s" stroke-width="2.4" fill="none"/><path d="M3 -16Q12 -24 17 -18Q11 -11 3 -16Z" fill="#3CCB6B"/><path d="M-13 -4Q-12 -10 -7 -11" stroke="#FFD6CC" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>' % (x, y, BR, BR)
def cup(x, y):
    return '<g transform="translate(%d %d)"><path d="M6 -14L14 -38L20 -36" stroke="#E2483E" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-13 -16H13L10 16H-10Z" fill="#BFE6F2" stroke="%s" stroke-width="2.4" stroke-linejoin="round"/><path d="M-11.5 -4H11.5L10 16H-10Z" fill="#FFF3F0"/><path d="M-13 -16H13L10 16H-10Z" fill="none" stroke="%s" stroke-width="2.4" stroke-linejoin="round"/></g>' % (x, y, BR, BR)
def phones(c):
    hw, top, y = c['hw'], c['top'], c['ey']
    return '<path d="M%d %dC%d %d %d %d %d %d" stroke="#3C7FC0" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="%d" y="%d" width="15" height="30" rx="7" fill="#E2483E" stroke="%s" stroke-width="2"/><rect x="%d" y="%d" width="15" height="30" rx="7" fill="#E2483E" stroke="%s" stroke-width="2"/>' % (80 - hw, y - 8, 80 - hw, top - 18, 80 + hw, top - 18, 80 + hw, y - 8, 80 - hw - 8, y - 12, BR, 80 + hw - 7, y - 12, BR)
def waves(x, y, flip=1):
    return ''.join('<path class="q-ring" style="--d:-%.1fs" d="M%d %dq%d %d 0 %d" stroke="#3C8FD6" stroke-width="3" fill="none" stroke-linecap="round"/>' % (k * .5, x + flip * k * 9, y - 9 - k * 4, flip * (8 + k * 3), 9 + k * 4, 18 + k * 8) for k in range(3))
def speech(x, y):
    bars = ''.join('<rect class="q-bar" style="--d:-%.1fs;transform-origin:%dpx %dpx" x="%d" y="%d" width="5" height="16" rx="2.5" fill="#3C8FD6"/>' % (k * .22, x + 13 + k * 10, y + 14, x + 11 + k * 10, y + 6, ) for k in range(4))
    return '<path d="M%d %dh46q8 0 8 8v14q0 8 -8 8h-30l-13 12l2 -12h-5q-8 0 -8 -8v-14q0 -8 8 -8Z" fill="#FFF9EA" stroke="%s" stroke-width="2.4" stroke-linejoin="round"/>%s' % (x + 8, y - 6, BR, bars)

# ---------- ráp nhân vật ----------
def figure(c, face='open', mth='smile', root='q-breath', head_cls='', feet=('', ''), armsB='', armsF='', headX='', back_cls='q-wag', tf=''):
    org = 'transform-origin:80px %dpx' % c['base']
    hd = '<g class="%s" style="transform-origin:80px %dpx">%s<use href="#c-head"/>%s%s</g>' % (head_cls, c['pivot'], '', eyes(c, face) + mouth(c, mth), headX)
    t = c['tail']
    b = '<g class="%s" style="transform-origin:%dpx %dpx"><use href="#c-back"/></g>' % (back_cls, t[0], t[1])
    fo = '<g class="%s"><use href="#c-foot0"/></g><g class="%s"><use href="#c-foot1"/></g>' % feet
    body = b + fo + '<use href="#c-torso"/>' + armsB + hd + '<use href="#c-over"/>' + armsF
    if tf: body = '<g transform="%s">%s</g>' % (tf, body)
    return '<g class="%s" style="%s">%s</g>' % (root, org, body)
def sit_tf(c): return 'translate(0 %d) translate(80 %d) scale(1.02 .86) translate(-80 %d)' % (0, c['base'], -c['base'])
def sit_feet(c):
    y = c['base'] - 2
    return ''.join('<ellipse cx="%d" cy="%d" rx="15" ry="9.5" fill="%s"/><ellipse cx="%d" cy="%d" rx="9" ry="5.5" fill="#FFF9EA" opacity=".55"/>' % (x, y, c['hand'], x, y) for x in (50, 110))

# ---------- phương tiện ----------
ST = 'stroke="%s" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"' % BR
def rider(c, x, y, s, face='open', mth='smile', cls='q-bob', extra=''):
    return '<g transform="translate(%d %d) scale(%s) translate(-80 -128)"><g class="%s" style="transform-origin:80px 130px"><use href="#c-torso"/><g transform="translate(80 118) scale(.6) translate(-80 -118)"><use href="#c-back"/></g><use href="#c-head"/>%s%s<use href="#c-over"/></g>%s</g>' % (x, y, s, cls, eyes(c, face), mouth(c, mth), extra)
def wheel(x, y, r=16):
    return '<g class="q-spin" style="transform-origin:%dpx %dpx"><circle cx="%d" cy="%d" r="%d" fill="#3A3540" stroke="%s" stroke-width="2.6"/><circle cx="%d" cy="%d" r="%d" fill="#E7DFC9"/><path d="M%d %dv%dM%d %dh%d" stroke="#3A3540" stroke-width="2.6"/></g>' % (x, y, x, y, r, BR, x, y, r - 7, x, y - (r - 7), 2 * (r - 7), x - (r - 7), y, 2 * (r - 7))
def v_car(c):
    road = '<rect x="-40" y="146" width="240" height="14" fill="#C9B28C"/><g class="q-road"><path d="M-60 153H-30M0 153H30M60 153H90M120 153H150M180 153H210M240 153H270" stroke="#FFF9EA" stroke-width="3.4" stroke-linecap="round"/></g>'
    seat = '<path d="M8 104Q4 60 28 58Q40 60 40 104Z" fill="#8F2A22" %s/>' % ST
    body = '<path d="M-20 134V112Q-20 100 -6 98L38 96Q52 112 92 106L126 82L136 88L124 102L164 102Q184 104 186 122V134Q186 142 176 142H-10Q-20 142 -20 134Z" fill="#E2483E" %s/><path d="M-20 124H186V134Q186 142 176 142H-10Q-20 142 -20 134Z" fill="#B3261E"/><path d="M-20 134V112Q-20 100 -6 98L38 96Q52 112 92 106L126 82L136 88L124 102L164 102Q184 104 186 122V134Q186 142 176 142H-10Q-20 142 -20 134Z" fill="none" %s/><path d="M-8 110Q14 106 32 106" stroke="#FFC4B8" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="178" cy="116" r="5.4" fill="#FFE08A" %s/>' % (ST, ST, ST)
    hand = '<path d="M84 106L110 90" stroke="%s" stroke-width="8" stroke-linecap="round"/><circle cx="112" cy="88" r="11" fill="none" stroke="#3A3540" stroke-width="3.6"/><circle cx="110" cy="90" r="5.4" fill="%s"/>' % (c['limb'], c['hand'])
    return road + seat + rider(c, 46, 110, .8) + hand + body + wheel(28, 142, 18) + wheel(142, 142, 18)
def v_boat(c):
    sky = '<g class="q-rock" style="transform-origin:80px 120px">'
    sail = '<path d="M118 112V6" stroke="%s" stroke-width="4"/><path d="M122 12Q182 56 176 100H122Z" fill="#E5B85C" %s/><path d="M122 52Q150 62 176 72" stroke="#9A7128" stroke-width="2.6" fill="none"/>' % (BR, ST)
    hull = '<g transform="translate(-40 -64) scale(.62)"><path d="M50 236Q120 256 200 256T352 226Q334 300 280 318H128Q72 310 50 236Z" fill="#2F7A6E" stroke="%s" stroke-width="5" stroke-linejoin="round"/><path d="M66 262Q200 292 338 256" stroke="#EFE6CC" stroke-width="9" fill="none"/></g>' % BR
    water = '<rect x="-40" y="132" width="240" height="28" fill="#27B6CC"/>'
    wv = '<g class="q-road"><path d="M-64 136q10 -8 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="#D5F4F7" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>'
    hand = '<path d="M90 96L114 80" stroke="%s" stroke-width="8" stroke-linecap="round"/><circle cx="115" cy="79" r="5.4" fill="%s"/>' % (c['limb'], c['hand'])
    return water + sky + sail + rider(c, 52, 98, .78) + hand + hull + '</g>' + wv
def v_plane(c):
    cl = lambda x, y, s, d: '<g class="q-cloud" style="--d:-%.1fs"><g transform="translate(%d %d) scale(%s)"><path d="M-30 10C-44 10 -44 -6 -30 -6C-28 -22 -4 -22 2 -8C18 -14 30 -2 22 10Z" fill="#FFF9EA" %s/></g></g>' % (d, x, y, s, ST)
    bg = '<rect x="-40" y="-50" width="240" height="210" fill="#BFE9F2"/>' + cl(40, -20, 1, 0) + cl(160, 30, .8, 2.5) + cl(100, 130, 1.1, 1.2)
    tail = '<path d="M-14 84L-34 44L-16 44L6 82Z" fill="#E2483E" %s/>' % ST
    body = '<path d="M-22 96Q-30 84 -8 80L60 78Q98 98 140 78L172 82Q196 90 196 100Q194 116 166 120L20 122Q-12 118 -22 96Z" fill="#F7C43A" %s/><path d="M-14 106Q60 116 190 108Q184 118 166 120L20 122Q-6 120 -14 106Z" fill="#D9962A"/><path d="M-22 96Q-30 84 -8 80L60 78Q98 98 140 78L172 82Q196 90 196 100Q194 116 166 120L20 122Q-12 118 -22 96Z" fill="none" %s/>' % (ST, ST)
    wing = '<path d="M64 110L120 110L88 150L50 150Z" fill="#E2483E" %s/><path d="M8 94H42" stroke="#FFF3B0" stroke-width="3.4" stroke-linecap="round"/>' % ST
    prop = '<circle cx="196" cy="100" r="6" fill="#6B5A4E" %s/><g class="q-prop" style="transform-origin:199px 100px"><ellipse cx="199" cy="100" rx="4.4" ry="30" fill="#6B5A4E" opacity=".75"/></g>' % ST
    return bg + '<g class="q-rock" style="transform-origin:80px 100px">' + tail + rider(c, 96, 92, .7, cls='') + body + wing + prop + '</g>'

# ---------- 16 trạng thái ----------
def states(c):
    S = c['sh']; ly = c['my'] + 18  # chỗ đặt đồ ngang miệng
    idle = GRD + figure(c, armsB=rest(c, -1, 'q-sw') + rest(c, 1, 'q-sw2'))
    walk = GRD + '<g class="q-road"><path d="M-30 156H-10M30 156H50M90 156H110M150 156H170M210 156H230" stroke="#0E8A58" stroke-width="3" stroke-linecap="round"/></g>' + DUST([(16, 146, 6, 0), (2, 142, 5, .3)]) + figure(c, root='q-walk', feet=('q-fa', 'q-fb'), armsB=rest(c, -1, 'q-sw') + rest(c, 1, 'q-sw2'))
    run = GRD + '<path class="q-speed" d="M-30 70H-6M-36 96H-14M-28 122H-4" stroke="#C9A06A" stroke-width="3.4" fill="none" stroke-linecap="round"/>' + DUST([(14, 146, 8, 0), (-4, 140, 6, .2), (-20, 144, 5, .4)]) + figure(c, face='happy', mth='talk', root='q-run', feet=('q-fra', 'q-frb'), armsB=arm(c, -1, 80 - S[0] - 18, S[1] - 2, 'q-pa') + arm(c, 1, 80 + S[0] + 16, S[1] + 16, 'q-pb'))
    jump = '<ellipse class="q-shade" style="transform-origin:80px 150px" cx="80" cy="150" rx="66" ry="9" fill="#7EDB62"/>' + figure(c, root='q-jump', armsB=arm(c, -1, 80 - S[0] - 16, S[1] - 26) + arm(c, 1, 80 + S[0] + 16, S[1] - 26))
    sit = GRD + figure(c, tf=sit_tf(c), feet=('q-hide', 'q-hide'), armsF=arm(c, -1, 66, S[1] + 22) + arm(c, 1, 94, S[1] + 22)) + sit_feet(c)
    sleep = GRD + figure(c, face='closed', mth='flat', tf=sit_tf(c), root='q-sleep', head_cls='q-nod', feet=('q-hide', 'q-hide'), back_cls='', armsF=arm(c, -1, 68, S[1] + 22) + arm(c, 1, 92, S[1] + 22)) + sit_feet(c) + Z(124, 22, 0) + Z(142, 2, 1) + Z(158, -18, 2)
    eat = GRD + figure(c, face='happy', mth='chew', head_cls='q-chewh', armsF='<g class="q-feed">' + apple(80, ly + 15) + arm(c, -1, 62, ly + 18) + arm(c, 1, 98, ly + 18) + '</g>') + '<circle class="q-up" style="--d:-.3s" cx="52" cy="%d" r="2.6" fill="#E2483E"/><circle class="q-up" style="--d:-1.1s" cx="112" cy="%d" r="2.2" fill="#E2483E"/>' % (ly, ly)
    drink = GRD + figure(c, face='closed', mth='flat', head_cls='q-sip', armsF='<g class="q-sipc">' + cup(72, ly + 22) + arm(c, -1, 56, ly + 26) + arm(c, 1, 88, ly + 26) + '</g>') + ''.join('<circle class="q-up" style="--d:-%.1fs" cx="%d" cy="%d" r="2.6" fill="#BFE6F2" stroke="%s"/>' % (d, x, ly + 4, BR) for x, d in ((118, 0), (130, .7), (108, 1.2)))
    read = GRD + figure(c, face='down', head_cls='q-read', armsF=BOOK + arm(c, -1, 50, 132) + arm(c, 1, 110, 132))
    listen = GRD + figure(c, head_cls='q-tilt', headX=phones(c), armsB=rest(c, 1, 'q-sw'), armsF=arm(c, -1, 80 - c['hw'] - 2, c['ey'] + 4, via=(80 - c['hw'] - 14, c['sh'][1] - 2))) + waves(80 + c['hw'] + 16, c['ey'], 1) + waves(80 - c['hw'] - 14, c['ey'], -1)
    say = GRD + speech(112, -26) + figure(c, mth='talk', head_cls='q-sayh', armsB=rest(c, -1, 'q-sw'), armsF=arm(c, 1, 80 + c['hw'] + 6, c['ey'] + 4, via=(80 + c['hw'] + 10, c['sh'][1] + 4)))
    hello = GRD + figure(c, armsB=rest(c, 1, 'q-sw'), armsF=arm(c, -1, 80 - c['hw'] - 10, c['ey'] - 6, 'q-wave', via=(80 - c['hw'] - 16, c['sh'][1] + 6)))
    happy = GRD + figure(c, face='happy', root='q-hop', armsB=arm(c, -1, 80 - S[0] - 18, S[1] - 34, 'q-pa') + arm(c, 1, 80 + S[0] + 18, S[1] - 34, 'q-pb')) + HEART(16, 40, 0) + HEART(146, 40, .7) + SPK(150, 0, .4, .9) + SPK(6, 4, 1.1, .7)
    sad = GRD + figure(c, face='sad', mth='sad', root='q-sigh', head_cls='q-droop', back_cls='', armsB=rest(c, -1) + rest(c, 1)) + '<path class="q-tear" d="M%d %dq5 7 0 10q-5 -3 0 -10Z" fill="#7FC8EC" stroke="%s" stroke-width="1.6"/>' % (80 - c['ex'] - 5, c['ey'] + 14, BR)
    surp = GRD + figure(c, face='surp', mth='o', root='q-start', armsB=arm(c, -1, 80 - S[0] - 22, S[1] - 12) + arm(c, 1, 80 + S[0] + 22, S[1] - 12)) + '<text class="q-pop" style="transform-origin:170px 10px" x="162" y="24" font-family="Be Vietnam Pro" font-weight="800" font-size="42" fill="#E2483E">!</text>'
    rays = ''.join('<path d="M80 80L%d -60L%d -60Z" fill="#FFD66B" opacity=".42" transform="rotate(%d 80 80)"/>' % (66, 94, a) for a in range(0, 360, 45))
    lvl = GRD + '<circle cx="80" cy="80" r="100" fill="url(#aura)"/><g class="q-turn" style="transform-origin:80px 80px">' + rays + '</g>' + figure(c, face='happy', root='q-rise', armsB=arm(c, -1, 80 - S[0] - 16, S[1] - 38) + arm(c, 1, 80 + S[0] + 16, S[1] - 38)) + SPK(12, 30, 0, 1.2) + SPK(150, 26, .5, 1.2) + SPK(28, -14, 1, 1) + SPK(134, -18, 1.4, 1) + '<path class="q-up" style="--d:-.2s" d="M80 -22l16 16h-10v14h-12v-14h-10Z" fill="#3CCB6B" stroke="%s" stroke-width="2.4" stroke-linejoin="round"/>' % BR
    return [(idle, 'Đứng', 'Thở, chớp mắt, đuôi đưa'), (walk, 'Đi', 'Nhún theo bước, hai chân luân phiên'), (run, 'Chạy', 'Nghiêng người, chân nhanh, bụi bay'), (jump, 'Nhảy', 'Nén, bật cao, chạm đất nén lại'),
            (sit, 'Ngồi', 'Hạ thân, chân duỗi trước'), (sleep, 'Ngủ', 'Mắt nhắm, đầu gật, chữ z bay'), (eat, 'Ăn', 'Đưa táo lên miệng, miệng nhai'), (drink, 'Uống', 'Đưa cốc lên, ống hút, bọt bay'),
            (read, 'Đọc', 'Nhìn xuống sách, lật trang'), (listen, 'Nghe', 'Tai nghe, tay giữ, sóng âm toả'), (say, 'Nói theo', 'Miệng mở, bong bóng âm thanh'), (hello, 'Chào', 'Một tay vẫy qua lại'),
            (happy, 'Vui', 'Nhảy tưng, tim và sao bay'), (sad, 'Buồn nhẹ', 'Đầu cúi, thở dài, một giọt nước mắt'), (surp, 'Ngạc nhiên', 'Mắt to, giật nảy, dấu chấm than'), (lvl, 'Lên cấp', 'Vầng sáng quay, sao, mũi tên lên'),
            (v_car(c), 'Trên xe', 'Bánh quay, đường chạy, tay lái'), (v_boat(c), 'Trên thuyền', 'Thuyền lắc, sóng chạy, buồm căng'), (v_plane(c), 'Trên máy bay', 'Cánh quạt quay, mây trôi')]

# ---------- CSS ----------
CSS = """@keyframes blink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}}
@keyframes beacon{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes ant{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(7deg)}}
@keyframes core{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}
@keyframes q-breath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,.975)}}
@keyframes q-wag{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes q-walk{0%,100%{transform:translateY(0) rotate(-3deg)}25%{transform:translateY(-6px) rotate(0)}50%{transform:translateY(0) rotate(3deg)}75%{transform:translateY(-6px) rotate(0)}}
@keyframes q-run{0%,100%{transform:translate(4px,0) rotate(6deg)}50%{transform:translate(4px,-10px) rotate(6deg)}}
@keyframes q-foot{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes q-footr{0%,100%{transform:translate(-5px,0)}50%{transform:translate(6px,-15px)}}
@keyframes q-jump{0%,100%{transform:translateY(0) scale(1.06,.92)}20%{transform:translateY(0) scale(.96,1.05)}50%{transform:translateY(-38px) scale(.98,1.02)}80%{transform:translateY(0) scale(1.05,.94)}}
@keyframes q-shade{0%,100%{transform:scale(1)}50%{transform:scale(.7)}}
@keyframes q-hop{0%,100%{transform:translateY(0) scale(1.03,.96)}50%{transform:translateY(-20px) scale(.98,1.03)}}
@keyframes q-sleep{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.97)}}
@keyframes q-nod{0%,70%,100%{transform:rotate(0)}85%{transform:translateY(5px) rotate(4deg)}}
@keyframes q-chewh{0%,100%{transform:translateY(0)}50%{transform:translateY(1.6px)}}
@keyframes q-chew{0%,100%{transform:scale(1,1)}50%{transform:scale(.7,.35)}}
@keyframes q-feed{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
@keyframes q-sip{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(-7deg)}}
@keyframes q-read{0%,100%{transform:translateY(2px)}50%{transform:translateY(4px) rotate(1.5deg)}}
@keyframes q-tilt{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
@keyframes q-talk{0%,100%{transform:scale(1,.5)}50%{transform:scale(1,1.1)}}
@keyframes q-sayh{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes q-wave{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(18deg)}}
@keyframes q-sw{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
@keyframes q-pa{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(16deg)}}
@keyframes q-sigh{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.965)}}
@keyframes q-droop{0%,100%{transform:translateY(3px) rotate(0)}50%{transform:translateY(6px) rotate(2deg)}}
@keyframes q-tear{0%,30%{transform:translateY(0);opacity:1}100%{transform:translateY(22px);opacity:0}}
@keyframes q-start{0%,60%,100%{transform:translateY(0) scale(1,1)}72%{transform:translateY(-14px) scale(.95,1.07)}86%{transform:translateY(0) scale(1.05,.94)}}
@keyframes q-pop{0%,55%{transform:scale(.8);opacity:.45}72%{transform:scale(1.2);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes q-rise{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes q-turn{to{transform:rotate(360deg)}}
@keyframes q-z{0%{transform:translate(0,0) scale(.6);opacity:0}30%{opacity:1}100%{transform:translate(20px,-40px) scale(1.2);opacity:0}}
@keyframes q-up{0%{transform:translateY(10px);opacity:0}30%{opacity:1}100%{transform:translateY(-50px);opacity:0}}
@keyframes q-tw{0%,100%{transform:scale(.5);opacity:.4}50%{transform:scale(1.15);opacity:1}}
@keyframes q-page{0%,100%{transform:rotateY(0)}50%{transform:rotateY(38deg)}}
@keyframes q-dust{0%{transform:scale(.4);opacity:.7}100%{transform:scale(1.4) translateX(-22px);opacity:0}}
@keyframes q-road{to{transform:translateX(-60px)}}
@keyframes q-speed{0%,100%{opacity:.25;transform:translateX(6px)}50%{opacity:1;transform:translateX(-6px)}}
@keyframes q-ring{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes q-bar{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1.05)}}
@keyframes q-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes q-spin{to{transform:rotate(360deg)}}
@keyframes q-rock{0%,100%{transform:rotate(-3deg) translateY(0)}50%{transform:rotate(3deg) translateY(-4px)}}
@keyframes q-prop{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.12)}}
@keyframes q-cloud{from{transform:translateX(60px)}to{transform:translateX(-60px)}}
.blink{animation:blink 5s infinite;transform-origin:80px %EYpx}
.ant{animation:ant 2.4s ease-in-out infinite;transform-origin:80px 26px}
.beacon{animation:beacon 1.4s ease-in-out infinite}
.core{animation:core 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.q-breath{animation:q-breath 3.2s ease-in-out infinite}
.q-wag{animation:q-wag 2.2s ease-in-out infinite}
.q-walk{animation:q-walk .9s ease-in-out infinite}
.q-run{animation:q-run .42s ease-in-out infinite}
.q-fa{animation:q-foot .9s ease-in-out infinite}
.q-fb{animation:q-foot .9s ease-in-out infinite;animation-delay:-.45s}
.q-fra{animation:q-footr .42s ease-in-out infinite}
.q-frb{animation:q-footr .42s ease-in-out infinite;animation-delay:-.21s}
.q-hide{display:none}
.q-jump{animation:q-jump 1.1s ease-in-out infinite}
.q-shade{animation:q-shade 1.1s ease-in-out infinite}
.q-hop{animation:q-hop .7s ease-in-out infinite}
.q-sleep{animation:q-sleep 3.6s ease-in-out infinite}
.q-nod{animation:q-nod 3.6s ease-in-out infinite}
.q-chewh{animation:q-chewh .5s ease-in-out infinite}
.q-chew{animation:q-chew .5s ease-in-out infinite}
.q-feed{animation:q-feed 1s ease-in-out infinite}
.q-sip{animation:q-sip 2.2s ease-in-out infinite}
.q-sipc{animation:q-feed 2.2s ease-in-out infinite}
.q-read{animation:q-read 3s ease-in-out infinite}
.q-tilt{animation:q-tilt 2.4s ease-in-out infinite}
.q-talk{animation:q-talk .46s ease-in-out infinite}
.q-sayh{animation:q-sayh .46s ease-in-out infinite}
.q-wave{animation:q-wave .7s ease-in-out infinite}
.q-sw{animation:q-sw 1.8s ease-in-out infinite}
.q-sw2{animation:q-sw 1.8s ease-in-out infinite;animation-delay:-.9s}
.q-pa{animation:q-pa .42s ease-in-out infinite}
.q-pb{animation:q-pa .42s ease-in-out infinite;animation-delay:-.21s}
.q-sigh{animation:q-sigh 4s ease-in-out infinite}
.q-droop{animation:q-droop 4s ease-in-out infinite}
.q-tear{animation:q-tear 2.6s ease-in infinite}
.q-start{animation:q-start 2.2s ease-in-out infinite}
.q-pop{animation:q-pop 2.2s ease-out infinite}
.q-rise{animation:q-rise 1.6s ease-in-out infinite}
.q-turn{animation:q-turn 9s linear infinite}
.q-z{animation:q-z 3s ease-out infinite;animation-delay:var(--d,0s)}
.q-up{animation:q-up 1.8s ease-out infinite;animation-delay:var(--d,0s)}
.q-tw{animation:q-tw 1.6s ease-in-out infinite;animation-delay:var(--d,0s)}
.q-page{animation:q-page 2.4s ease-in-out infinite;transform-origin:80px 124px}
.q-dust{animation:q-dust .8s ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
.q-road{animation:q-road 1s linear infinite}
.q-speed{animation:q-speed .42s ease-in-out infinite}
.q-ring{animation:q-ring 1.5s ease-in-out infinite;animation-delay:var(--d,0s)}
.q-bar{animation:q-bar .6s ease-in-out infinite;animation-delay:var(--d,0s)}
.q-bob{animation:q-bob 1s ease-in-out infinite}
.q-spin{animation:q-spin .7s linear infinite}
.q-rock{animation:q-rock 3s ease-in-out infinite}
.q-prop{animation:q-prop .14s linear infinite}
.q-cloud{animation:q-cloud 7s linear infinite;animation-delay:var(--d,0s)}
@media (prefers-reduced-motion:reduce){.blink,.ant,.beacon,.core,.q-breath,.q-wag,.q-walk,.q-run,.q-fa,.q-fb,.q-fra,.q-frb,.q-jump,.q-shade,.q-hop,.q-sleep,.q-nod,.q-chewh,.q-chew,.q-feed,.q-sip,.q-sipc,.q-read,.q-tilt,.q-talk,.q-sayh,.q-wave,.q-sw,.q-sw2,.q-pa,.q-pb,.q-sigh,.q-droop,.q-tear,.q-start,.q-pop,.q-rise,.q-turn,.q-z,.q-up,.q-tw,.q-page,.q-dust,.q-road,.q-speed,.q-ring,.q-bar,.q-bob,.q-spin,.q-rock,.q-prop,.q-cloud{animation:none}.q-z,.q-up,.q-pop,.q-tear{opacity:1}}
.ms{background:#FFF9EA;border:3px solid #E7C98E;border-radius:16px;padding:6px 6px 8px;text-align:center;overflow:hidden}
.ms svg{display:block;width:100%;height:190px;border-radius:10px;background:#DCEFE6}
.mn{font-weight:800;font-size:20px;line-height:1.2;color:#6B3E1E;margin-top:4px}
.md{font-size:13px;font-weight:500;line-height:1.3}
.gr{display:grid;grid-template-columns:repeat(5,238px);grid-auto-rows:272px;gap:12px 12px}"""

W, H = 1320, 1240
def make(c):
    defs = c['d'] + ''.join('<g id="%s">%s</g>' % kv for kv in (('c-back', c['back']), ('c-torso', c['torso']), ('c-foot0', c['feet'][0]), ('c-foot1', c['feet'][1]), ('c-head', c['head']), ('c-over', c['over']), ('c-eopen', '<g class="blink">%s</g>' % c['eyes']), ('c-mouth', c['mouth'])))
    if 'id="aura"' not in defs: defs += '<radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>'
    cells = ''.join('<div class="ms"><svg viewBox="-40 -50 240 210" role="img" aria-label="%s %s">%s</svg><div class="mn">%s</div><div class="md">%s</div></div>' % (c['vi'], n, s, n, note) for s, n, note in states(c))
    note = '<div class="ms" style="padding:14px;text-align:left"><div class="mn">Ghi chú</div><div class="md" style="margin-top:6px">Hình từ defs của bảng Char %s, tách đầu, thân, chân để đổi nét mặt. Tay là phần vẽ thêm cùng màu. Mọi hoạt ảnh là CSS, dừng khi bật giảm chuyển động.</div></div>' % c['vi']
    body = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>%s</defs></svg><div class="v" style="width:%dpx;height:%dpx;padding:24px 34px"><div class="t1" style="font-size:32px;margin-bottom:6px">Mascot %s: 16 trạng thái và 3 dáng trên phương tiện</div><div style="font-size:15px;margin-bottom:14px">Mẫu theo R7Mascot. Bản trên canvas chạy hoạt ảnh thật.</div><div class="gr">%s%s</div></div>' % (defs, W, H, c['vi'], cells, note)
    board(proj, 'CMascot' + c['id'], 'Mascot ' + c['vi'], W, H, body, CSS.replace('%EY', str(c['ey'])))

def main(p):
    global proj
    proj = p
    for f in (kitsu, bi, draco, robo, lupo):
        make(f())
    print('ok')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.environ['BOARD_OUT'])
