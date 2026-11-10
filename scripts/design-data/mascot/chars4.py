# Mascot v4: đuôi/cánh/lá nối khớp lắc lư (overlapping action), ánh sáng nhỏ huyền ảo, Huyền thoại chăm chút.
# Dựa trên v3.1 (chars2/chars3): giữ mặt, tỉ lệ, tay cố định và vị trí phụ kiện; chỉ thay phần phụ + ánh sáng.
from gen import common_defs, EYE
from chars import grad, arms, feet, face, star, sparkle_eyes, NECK
from chars2 import lin, rim, fur, claws
from fx4 import chain, motes, twinkles, foxfire, halo, glow, light_defs, sty
import chars
from detail4 import fox_tail, wolf_tail, dragon_tail, tube_grads, eyes4, whiskers

def sgn(x):
    return (x > 0) - (x < 0)

# ======================= KITSU =======================
def kitsu(stage, pose, p):
    lg = stage == 'legend'
    if lg:   # Thiên Hồ: lông trắng ánh ngọc trai, vân vàng, chóp đuôi xanh lửa ma
        O, O2, O3 = '#FFF7EE', '#E6C9A2', '#FFFFFF'
        W = '#FFFFFF'; D = '#E8A23A'
    else:
        O, O2, O3 = '#F59A45', '#DD7A28', '#FFC88A'
        W = '#FFF6EA'; D = '#6B3826'
    defs = (common_defs(p) + grad(p, 'hd', O3, O, O2) + grad(p, 'bd', O3, O, O2, .4, .25)
            + f'<clipPath id="{p}bc"><ellipse cx="80" cy="124" rx="27" ry="23"/></clipPath><clipPath id="{p}eL"><path d="M38 58Q26 22 34 6Q56 14 70 40Z"/></clipPath><clipPath id="{p}eR"><path d="M122 58Q134 22 126 6Q104 14 90 40Z"/></clipPath>'
            + f'<linearGradient id="{p}tp" x1="0" y1="1" x2="0" y2="0"><stop offset=".2" stop-color="#FFFFFF"/><stop offset=".62" stop-color="#BFE8FF"/><stop offset="1" stop-color="#62BDF2"/></linearGradient>'
            + light_defs(p, '#FFFFFF', '#8FD8FF'))
    rots = {'baby': [84], 'teen': [-76, 46, 78], 'adult': [-72, -40, 26, 52, 76], 'legend': [-86, -64, -43, -21, 0, 21, 43, 64, 86]}[stage]
    s = {'baby': 1.22, 'teen': 1.18, 'adult': 1.3, 'legend': 1.42}[stage]
    # đuôi ngoài vẽ trước (nằm sau), đuôi giữa đè lên
    order = sorted(range(len(rots)), key=lambda i: -abs(rots[i]))
    T, T2, T3 = ('#FFF9F2', '#E3C296', '#FFFFFF') if lg else ('#F08A35', '#C7631F', '#FFB46A')
    defs += tube_grads(p, 'tg', T3, T, T2)
    if stage != 'baby':   # quạt đuôi: đuôi giữa dài hơn để chóp ló trên đầu
        o = ''.join(fox_tail(p, rots[i], s * (1.22 - abs(rots[i]) / 400), i, T, T2, T3, W, lg, (80, 126)) for i in order)
    else:
        o = ''.join(fox_tail(p, rots[i], s, i, T, T2, T3, W, lg) for i in order)
    if lg:   # lửa ma nhỏ lơ lửng gần chóp các đuôi ngoài
        o += foxfire(p, 8, 64, .8, 0) + foxfire(p, 156, 60, .8, 1.1) + foxfire(p, 30, 22, .62, 1.9) + foxfire(p, 132, 18, .62, .6)
    o += feet(D)
    ab, af = arms(pose, O, D)
    o += ab
    o += (f'<ellipse cx="80" cy="124" rx="27" ry="23" fill="url(#{p}bd)"/><g clip-path="url(#{p}bc)"><ellipse cx="80" cy="104" rx="30" ry="9" fill="{O2}" opacity=".6"/>'
          f'<path d="M64 108L69 116L64 121L71 126L67 134L76 135L80 144L84 135L93 134L89 126L96 121L91 116L96 108Z" fill="{W}"/></g>'
          + fur(58, 132, O2, .5) + fur(98, 132, O2, .5))
    if NECK["on"] and stage == 'teen':
        o += ('<path d="M56 112Q80 124 104 112" stroke="#D93B3B" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
              '<circle cx="80" cy="121" r="6" fill="#FFC93C"/><path d="M75.5 121.5h9" stroke="#B8860B" stroke-width="1.4"/><circle cx="80" cy="124" r="1.2" fill="#8A5A12"/><circle cx="78" cy="119" r="1.6" fill="#fff" opacity=".8"/>')
    if NECK["on"] and stage == 'adult':
        o += ('<path d="M54 112Q80 126 106 112" stroke="#E8C88A" stroke-width="6.5" fill="none" stroke-linecap="round"/>'
              '<path d="M58 113l4 2M66 117l4 1.6M74 119l4 .8M82 119l4 -.6M90 118l4 -1.4M98 115l4 -2" stroke="#B88E4A" stroke-width="1.6" stroke-linecap="round"/>'
              # giấy shide đung đưa
              f'<g transform="translate(66 118)"><g class="sg" style="{sty(a=6, dl=-.3, d=2.6)}"><path d="M-1.6 0H2.2L3.4 4.6H.4L1.8 9.2H-1.2L.2 14L-3.6 8.4H-.6L-2 4.2H.8Z" fill="#FFFFFF"/></g></g>'
              f'<g transform="translate(94 118)"><g class="sg" style="{sty(a=6, dl=-1.1, d=2.6)}"><path d="M-1.6 0H2.2L3.4 4.6H.4L1.8 9.2H-1.2L.2 14L-3.6 8.4H-.6L-2 4.2H.8Z" fill="#FFFFFF"/></g></g>'
              '<circle cx="80" cy="122" r="5.5" fill="#D93B3B"/><circle cx="78.6" cy="120.6" r="1.6" fill="#fff" opacity=".7"/>')
    if lg:
        # dây vàng mảnh + hai dải lụa đỏ bay, ngọc hồ ly
        o += ('<path d="M55 112Q80 125 105 112" stroke="#F2B544" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
              '<path d="M58 113Q80 124 102 113" stroke="#FFF3C4" stroke-width="1" fill="none" opacity=".8"/>'
              f'<g transform="translate(62 117)"><g class="sg" style="{sty(a=8, dl=0, d=3)}"><path d="M0 0C-3 6 -1 10 -4 16C-2 15 0 15 1 17C1 11 3 6 2 0Z" fill="#D93B3B"/></g></g>'
              f'<g transform="translate(98 117)"><g class="sg" style="{sty(a=8, dl=-1.2, d=3)}"><path d="M0 0C3 6 1 10 4 16C2 15 0 15 -1 17C-1 11 -3 6 -2 0Z" fill="#D93B3B"/></g></g>'
              '<circle cx="80" cy="123" r="6.4" fill="#BDEBFF"/><circle cx="80" cy="123" r="6.4" fill="none" stroke="#F2B544" stroke-width="1.4"/>'
              '<path d="M80 118.6C82 121 82 124 80 126.6C78 124 78 121 80 118.6Z" fill="#fff" opacity=".9"/><circle cx="78" cy="121" r="1.2" fill="#fff"/>')
    # tai
    o += (f'<path d="M38 58Q26 22 34 6Q56 14 70 40Z" fill="url(#{p}hd)"/><path d="M122 58Q134 22 126 6Q104 14 90 40Z" fill="url(#{p}hd)"/>'
          f'<g clip-path="url(#{p}eL)"><path d="M20 0L46 0L40 22Q32 20 24 26Z" fill="{D}"/></g><g clip-path="url(#{p}eR)"><path d="M140 0L114 0L120 22Q128 20 136 26Z" fill="{D}"/></g>'
          f'<path d="M43 50Q36 30 40 20Q52 26 62 40Z" fill="#FFC9B5"/><path d="M117 50Q124 30 120 20Q108 26 98 40Z" fill="#FFC9B5"/>'
          f'<path d="M44 46q4 -6 3 -12M48 46q4 -4 5 -10M52 44q3 -3 5 -8M116 46q-4 -6 -3 -12M112 46q-4 -4 -5 -10M108 44q-3 -3 -5 -8" stroke="{W}" stroke-width="2.2" fill="none" stroke-linecap="round"/>')
    if lg:   # tua vàng nhỏ treo tai, đung đưa
        for x, dl in ((36, 0), (124, -.9)):
            o += (f'<circle cx="{x}" cy="42" r="2.8" fill="#FFD34D"/><g transform="translate({x} 44)"><g class="sg" style="{sty(a=7, dl=dl, d=2.4)}">'
                  f'<path d="M0 0v9" stroke="#D93B3B" stroke-width="2" stroke-linecap="round"/><path d="M-1.6 9h3.2l-.6 4h-2Z" fill="#D93B3B"/><circle cy="9" r="1.6" fill="#FFD34D"/></g></g>')
    o += (f'<path d="M34 80L20 86L31 90L22 98L35 98L30 106L44 100Z" fill="{O}"/><path d="M126 80L140 86L129 90L138 98L125 98L130 106L116 100Z" fill="{O}"/>'
          f'<path d="M34 84L24 88L32 91Z" fill="{W}"/><path d="M126 84L136 88L128 91Z" fill="{W}"/>')
    o += (f'<ellipse cx="80" cy="72" rx="51" ry="43" fill="url(#{p}hd)"/>' + rim('#fff', .45)
          + f'<path d="M30 80C32 106 54 116 80 116C106 116 128 106 130 80C120 92 104 94 92 88C88 96 84 100 80 100C76 100 72 96 68 88C56 94 40 92 30 80Z" fill="{W}"/>'
          + f'<path d="M72 36q8 -6 16 0q-4 6 -8 10q-4 -4 -8 -10Z" fill="{O2}" opacity=".55"/>' + fur(54, 48, '#fff', .35) + fur(100, 48, '#fff', .35))
    if stage == 'baby':   # lá biến hình đung đưa trên đầu
        o += (f'<g transform="translate(80 32)"><g class="sg" style="{sty(a=7, dl=0, d=2.8)}"><g transform="rotate(-18)"><path d="M0 4C-10 -4 -10 -18 0 -26C10 -18 10 -4 0 4Z" fill="#6ED27F"/>'
              '<path d="M0 4V-22M0 -8l-4 -4M0 -14l4 -4" stroke="#3E9C5C" stroke-width="1.4" fill="none" stroke-linecap="round"/></g></g></g>')
    if lg:
        # ấn lửa trên trán: ngọn lửa đỏ viền vàng mảnh, vân kẻ mắt đỏ, vân vàng hai má
        o += ('<path d="M80 33C86.5 41 86.5 49.5 80 56C73.5 49.5 73.5 41 80 33Z" fill="#E2483E"/><path d="M80 39.5C83 43.5 83 47.5 80 51C77 47.5 77 43.5 80 39.5Z" fill="#FFD34D"/>'
              '<circle cx="80" cy="47" r="1.2" fill="#fff"/>'
              '<path d="M46 76q8 -4.4 14.4 -2M114 76q-8 -4.4 -14.4 -2" stroke="#E2483E" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
              '<path d="M60.4 74l3 -2.6M99.6 74l-3 -2.6" stroke="#E2483E" stroke-width="2" stroke-linecap="round"/>'
              '<path d="M38 86q5 1 8 -2.6M40 92q4 0 6 -2M122 86q-5 1 -8 -2.6M120 92q-4 0 -6 -2" stroke="#F2B544" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".9"/>')
    else:
        o += '<circle cx="74" cy="55" r="2.6" fill="#E2483E"/><circle cx="86" cy="55" r="2.6" fill="#E2483E"/>'
    nose = f'<path d="M76 89.5q4 -2 8 0q-1 3.5 -4 4q-3 -.5 -4 -4Z" fill="{EYE}"/><circle cx="78.4" cy="90" r=".9" fill="#fff" opacity=".8"/>'
    o += face(p, pose, '#4FB0E6' if lg else '#B0672E', nose) + whiskers()
    o += af
    if lg and pose == 'idle':
        o += sparkle_eyes(80, 22, '#DDF6FF')
    if lg:
        o += motes(p, [(14, 100, 1.4, 5.2, 0, 4), (146, 92, 1.2, 4.6, 1.6, -3), (60, 8, 1, 5.8, 3, 2), (106, 0, 1.3, 5, 2.2, -2), (-4, 40, 1, 6, 4, 3), (164, 120, 1.1, 5.4, .8, -2)])
    return defs, o

# ---------- ghép vào hình v3.1: cắt phần cũ, thay phần mới ----------
import re
import chars2, chars3
FEET = '<ellipse cx="66" cy="146"'

def swap(o, start, new, end=FEET):
    i = o.find(start)
    if i < 0:
        return o
    j = o.find(end, i)
    return o[:i] + new + o[j:]

def pivot(x, y, inner, a, dl, d=3.2):
    """Bọc một phần hình để lắc quanh điểm (x, y) mà không đổi toạ độ bên trong."""
    return f'<g transform="translate({x} {y})"><g class="sg" style="{sty(a=a, dl=dl, d=d)}"><g transform="translate({-x} {-y})">{inner}</g></g></g>'

# ======================= LUPO =======================
def before_front_arm(o, add):
    """Chèn chi tiết mặt vào trước tay trước (tay giơ lên phải che được ria)."""
    i = o.rfind('translate(54 116) rotate(')
    if i < 0:
        return o + add
    i = o.rfind('<g', 0, i)
    j = o.rfind('<g class=', 0, i)
    if j >= 0 and o[j:i].endswith('style="transform-origin:54px 116px">'):
        i = j
    return o[:i] + add + o[i:]

def lupo(stage, pose, p):
    defs, o = chars2.lupo(stage, pose, p)
    lg = stage == 'legend'
    if lg:
        o = re.sub(r'<g class="cape" style="transform-origin:80px 112px"><path d="M30 96.*?</g>', '', o, count=1)
    o = swap(o, '<g class="wag" style="transform-origin:100px 134px">', wolf_tail(p, stage))
    defs += light_defs(p, '#FFFFFF', '#B9C6FF')
    if lg:
        o += motes(p, [(10, 96, 1.3, 5.4, 0, 3), (150, 84, 1.1, 4.8, 1.7, -3), (34, 6, 1, 6, 3.1, 2), (124, 2, 1.2, 5.2, 2.2, -2), (-6, 50, 1, 6.2, 4, 3)])
        # chòm sao nhỏ nối nét mảnh
        o += '<path d="M158 14L172 30L166 52L182 66" stroke="#FFF3B8" stroke-width=".7" fill="none" opacity=".45"/>'
        o += twinkles([(158, 14, 3, 3.4, 0), (172, 30, 2.2, 3, 1.2), (166, 52, 2.6, 3.8, 2.1), (182, 66, 2, 3.2, .6), (-14, 100, 2.4, 3.6, 1.5)], '#FFF6CF')
    o = before_front_arm(o, whiskers())
    return defs, o

# ======================= DRACO =======================
def draco(stage, pose, p):
    defs, o = chars2.draco(stage, pose, p)
    lg = stage == 'legend'
    G, G2, Bl = ('#4FE3B0', '#1FA98A', '#FFE38A') if lg else ('#6ED3A0', '#43B07C', '#FFEDC4')
    o = swap(o, '<g class="swish" style="transform-origin:96px 138px">', dragon_tail(p, stage, G, G2, Bl, '#C4FFE9' if lg else '#B4F2D2'))
    # cánh nhỏ lại; vỗ ở gốc, nửa ngoài màng cánh vỗ trễ hơn (follow-through)
    k = .78 if lg else .88
    def wingfix(m):
        side, x, rot, sc, w = m.group(1), m.group(3), m.group(4), m.group(5), m.group(6)
        sc = ' '.join(f'{float(v) * k:.3f}' for v in sc.split())
        dl = 0 if side == 'L' else -.05
        return (f'<g transform="translate({x} 108) rotate({rot}) scale({sc})"><g class="sg" style="{sty(a=8, dl=dl, d=2.4)}">'
                f'{pivot(-30, -26, w, 4, dl - .3, 2.4)}</g></g>')
    o = re.sub(r'<g class="wg([LR])" style="transform-origin:(\d+)px 108px"><g transform="translate\((\d+) 108\) rotate\(([-\d.]+)\) scale\(([-\d. ]+)\)">(.*?)</g></g>', wingfix, o)
    # bờm lửa: từng ngọn lắc lệch nhịp quanh gốc
    n = [0]
    def flame(m):
        n[0] += 1
        return pivot(80, 34, m.group(0), 6, -n[0] * .27, 1.6)
    o = re.sub(r'<path d="M80 34C72 22 74 10 80 2C86 10 88 22 80 34Z"[^>]*/>', flame, o)
    defs += light_defs(p, '#FFF3C4', '#FF9A4A')
    if lg:   # đốm than hồng nhỏ bay lên, ngọc rồng nhỏ lơ lửng
        o += motes(p, [(18, 120, 1.2, 4.2, 0, 4), (142, 112, 1, 3.8, 1.4, -3), (52, 20, .9, 4.6, 2.5, 2), (112, 14, 1.1, 4.4, 3.2, -2), (-4, 70, .9, 5, .8, 3), (164, 64, 1, 4.8, 2, -2)])
        o += (f'<g transform="translate(150 30)"><g class="kb" style="--d:3.4s"><circle r="7" fill="url(#{p}pearl)"/><circle r="7" fill="none" stroke="#FFD34D" stroke-width="1.2"/>'
              '<circle cx="-2.2" cy="-2.6" r="2" fill="#fff"/></g></g>')
        o += twinkles([(-12, 30, 2.6, 3.2, .4), (170, 96, 2.2, 3.6, 1.8)], '#FFE9B0')
    return defs, o

# ======================= BI =======================
LEAF = r'(<g transform="translate\([^)]*\) rotate\([^)]*\) scale\([^)]*\)">)(<path d="M0 0C-12 -14 -12 -36 0 -50C12 -36 12 -14 0 0Z"[^>]*/><path [^>]*/>)(</g>)'

def bi(stage, pose, p):
    defs, o = chars2.bi(stage, pose, p)
    lg = stage == 'legend'
    n = [0]
    def leafsw(m):   # mỗi lá tự rung lệch nhịp → cánh lá như có gió
        n[0] += 1
        return f'{m.group(1)}<g class="sg" style="{sty(a=5 + (n[0] % 3) * 1.5, dl=-n[0] * .37, d=3)}">{m.group(2)}</g>{m.group(3)}'
    if lg:   # cánh lá Thần Rừng nhỏ lại ~22%
        o = re.sub(r'translate\((58|102) 112\) rotate\(([-\d.]+)\) scale\(([\d.]+)\)', lambda m: f'translate({m.group(1)} 112) rotate({m.group(2)}) scale({float(m.group(3)) * .78:.3f})', o)
    o = re.sub(LEAF, leafsw, o)
    # mầm trên đầu: cả cụm lắc quanh gốc, lá đã tự rung thêm
    i = o.find('<path d="M80 34')
    j = o.find(f'<clipPath id="{p}eye0"')
    k = o.find('<g transform="translate(114 40)', i)
    if 0 <= k < j:
        j = k
    if 0 <= i < j and not lg:
        o = o[:i] + pivot(80, 34, o[i:j], 6, -.5, 3.4) + o[j:]
    defs += light_defs(p, '#FFFDE0', '#C8F56A')
    if lg:   # đom đóm nhỏ
        o += motes(p, [(6, 104, 1.4, 5.6, 0, 4), (154, 96, 1.2, 5, 1.8, -3), (24, 30, 1, 6, 3.2, 3), (136, 22, 1.2, 5.4, 2.4, -2), (80, -24, 1, 6.4, 4.2, 2), (-10, 60, 1, 5.8, .9, 3)])
        o += twinkles([(-16, 86, 3, 3.2, 0), (176, 70, 2.6, 3.6, 1.5), (100, -30, 2.2, 3, 2.4)], '#FFF3B0')
    return defs, o

# ======================= ROBO =======================
def robo(stage, pose, p):
    defs, o = chars3.robo(stage, pose, p)
    lg = stage == 'legend'
    # ăng-ten lò xo
    o = o.replace('scale(-1.45 1.45)', 'scale(-1.3 1.3)').replace('scale(1.45 1.45)', 'scale(1.3 1.3)')
    o = re.sub(r'<g transform="translate\((66|94) 154\)">(<path class="jet")', lambda m: f'<g transform="translate({m.group(1)} 152) scale(.6)" opacity=".7">{m.group(2)}', o)
    o = re.sub(r'<g class="ant" style="transform-origin:80px 34px">(.*?)</g>', lambda m: pivot(80, 34, m.group(1), 9, 0, 1.6), o)
    # vây lưng đung đưa nhẹ
    for x, dl in (('52', 0), ('108', -.8)):
        o = re.sub(r'(<g transform="translate\(' + x + r' 108\) rotate\([^)]*\) scale\([^)]*\)">)(.*?)(</g>)',
                   lambda m: f'{m.group(1)}<g class="sg" style="{sty(a=4, dl=dl, d=2.6)}">{m.group(2)}</g>{m.group(3)}', o, count=1)
    # ô lục giác sáng lần lượt như dòng năng lượng
    n = [0]
    def hexp(m):
        n[0] += 1
        return f'{m.group(0)[:-2]} class="pu" style="{sty(d=2.4, dl=-(n[0] % 6) * .4, o=1, o0=.55)}"/>'
    o = re.sub(r'<polygon points="[^"]*" fill="url\(#' + p + r'hx\)" opacity="[^"]*"/>', hexp, o)
    defs += light_defs(p, '#FFFFFF', '#7FE9FF')
    if lg:   # hạt dữ liệu nhỏ trôi lên
        for x, y, d, dl in ((10, 100, 4.4, 0), (150, 90, 4, 1.5), (30, 16, 5, 2.8), (128, 10, 4.6, 2), (-6, 58, 5.2, 3.6)):
            o += (f'<g transform="translate({x} {y})"><g class="mt" style="{sty(d=d, dl=-dl, x=2)}"><circle r="4.4" fill="url(#{p}mo)"/>'
                  '<rect x="-1.3" y="-1.3" width="2.6" height="2.6" rx=".5" fill="#fff" transform="rotate(45)"/></g></g>')
        o += twinkles([(-14, 34, 2.6, 3, .3), (174, 40, 2.4, 3.4, 1.6)], '#BFF8FF')
    return defs, o

def egg(n, p):
    import chars
    d, f = chars.egg(n, p)
    if n == 'kitsu':   # đuôi trứng thon 3 khúc, lắc nhẹ, nằm sau vỏ
        f = f.replace('<path d="M118 122C138 118 142 98 132 90C130 102 124 110 118 112Z" fill="#F59A45"/><path d="M132 90C138 94 140 100 138 106C134 102 132 96 132 90Z" fill="#FFF6EA"/>', '')
        segs = [(9, 3, 5.2, 0, '#F08A35', '#C7631F', '#FFB46A'), (10, 5.2, 6, -14, '#F08A35', '#C7631F', '#FFB46A'), (8, 6, 5, -14, '#F08A35', '#C7631F', '#FFB46A')]
        tip = ('<g transform="rotate(16) scale(.7)"><path d="M-7.2 0C-8.8 -7 -6 -15 -1 -23C.2 -20 1.8 -19 3.4 -19.4C2.4 -17 3.8 -14.6 5.8 -13.4C8.4 -9 8.6 -4 8 0'
               'L5 4.2L2.6 .4L0 4.8L-2.6 .4L-5 4.2Z" fill="#FFF6EA"/></g>')
        t = f'<g transform="translate(112 132) rotate(62)">{chain(segs, [2, 4, 6, 8], 0, .22, tip, 3)}</g>'
        f = f.replace('<g class="wob" style="transform-origin:80px 150px">', '<g class="wob" style="transform-origin:80px 150px">' + t, 1)
    return d, f

def _v4(fn):
    def w(stage, pose, p):
        old = chars.eyes
        chars.eyes = eyes4
        try:
            return fn(stage, pose, p)
        finally:
            chars.eyes = old
    return w

CHARS4 = {'bi': _v4(bi), 'kitsu': _v4(kitsu), 'draco': _v4(draco), 'robo': robo, 'lupo': _v4(lupo)}
