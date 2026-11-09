# Mascot v3: 5 chibi characters, shared rig (fixed-length arms rotating at shoulder).
from gen import common_defs, eyes, blush, mouth, EYE

POSES = {'idle': (12, -12), 'walk': (10, -10), 'run': (28, -28), 'jump': (100, -100), 'sit': (12, -12), 'sleep': (6, -6), 'eat': (-50, 50), 'drink': (-50, 50),
         'read': (-40, 40), 'listen': (150, -12), 'say': (12, -125), 'hello': (125, -12), 'happy': (135, -135), 'sad': (4, -4), 'surprised': (100, -100),
         'levelup': (140, -140), 'hold': (-50, 50), 'car': (12, -12), 'boat': (12, -12), 'plane': (12, -12)}
FACE = {'happy': 'happy', 'levelup': 'happy', 'run': 'happy', 'sleep': 'closed', 'drink': 'closed'}
MOUTH = {'happy': 'open', 'levelup': 'open', 'hello': 'open', 'run': 'open', 'say': 'open', 'eat': 'open', 'surprised': 'o', 'jump': 'o', 'sad': 'sad'}

def grad(p, name, light, base, shade, cx=.38, cy=.3):
    return f'<radialGradient id="{p}{name}" cx="{cx}" cy="{cy}" r=".8"><stop offset="0" stop-color="{light}"/><stop offset=".55" stop-color="{base}"/><stop offset="1" stop-color="{shade}"/></radialGradient>'

def arm(fill, pad, deg, sx, sy, cls=''):
    a = (f'<g transform="translate({sx} {sy}) rotate({deg})">'
         f'<rect x="-7" y="-4" width="14" height="26" rx="7" fill="{fill}" stroke="#000" stroke-opacity=".14" stroke-width="2"/>'
         f'<ellipse cx="0" cy="21" rx="7.6" ry="7" fill="{pad}" stroke="#000" stroke-opacity=".14" stroke-width="2"/>'
         f'<path d="M-3 25.5v2.2M0 26v2.4M3 25.5v2.2" stroke="#000" stroke-opacity=".18" stroke-width="1.3" stroke-linecap="round"/></g>')
    return f'<g class="{cls}" style="transform-origin:{sx}px {sy}px">{a}</g>' if cls else a

def feet(color, beans=None):
    o = ''
    for x in (66, 94):
        o += f'<ellipse cx="{x}" cy="146" rx="12" ry="7.5" fill="{color}"/>'
        if beans:
            o += f'<circle cx="{x-4}" cy="147" r="1.8" fill="{beans}"/><circle cx="{x+4}" cy="147" r="1.8" fill="{beans}"/><ellipse cx="{x}" cy="149" rx="3" ry="2" fill="{beans}"/>'
        else:
            o += f'<path d="M{x-4} 147.5v3M{x} 148v3.2M{x+4} 147.5v3" stroke="#000" stroke-opacity=".2" stroke-width="1.4" stroke-linecap="round"/>'
    return o

def arms(pose, fill, pad):
    A = POSES[pose]
    cls = {'hello': 'wv', 'happy': 'chl', 'walk': 'swa', 'run': 'swa'}.get(pose, '')
    clsr = {'happy': 'chr', 'walk': 'swb', 'run': 'swb', 'say': 'wv'}.get(pose, '')
    b = arm(fill, pad, A[1], 106, 116, clsr) if A[1] > -90 else ''
    f = arm(fill, pad, A[0], 54, 116, cls) + (arm(fill, pad, A[1], 106, 116, clsr) if A[1] <= -90 else '')
    return b, f

def face(p, pose, iris, nose='', y=80, my=96):
    return eyes(p, iris, FACE.get(pose, 'open'), y) + blush(p, my - 1) + nose + mouth(MOUTH.get(pose, 'w'), my)

def star(x, y, r, fill):
    import math
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * .45
        pts.append('%.1f %.1f' % (x + rr * math.cos(a), y + rr * math.sin(a)))
    return f'<path d="M{"L".join(pts)}Z" fill="{fill}" stroke-linejoin="round"/>'

def sparkle_eyes(y=80, dx=22, c='#FFE27A'):
    return star(80 - dx - 3, y - 5, 4.6, c) + star(80 + dx - 3, y - 5, 4.6, c)

# ---------------- KITSU ----------------
def kitsu(stage, pose, p):
    lg = stage == 'legend'
    O, O2, O3 = ('#FFAE55', '#EE8A34', '#FFD49A') if lg else ('#F59A45', '#E07F2C', '#FFC07A')
    W = '#FFF6EA'; D = '#6B3826'
    defs = common_defs(p) + grad(p, 'hd', O3, O, O2) + grad(p, 'bd', O3, O, O2, .4, .25) + \
        f'<clipPath id="{p}bc"><ellipse cx="80" cy="124" rx="27" ry="23"/></clipPath><clipPath id="{p}eL"><path d="M38 58Q26 22 34 6Q56 14 70 40Z"/></clipPath><clipPath id="{p}eR"><path d="M122 58Q134 22 126 6Q104 14 90 40Z"/></clipPath>'
    tip = '#DDF4FF' if lg else W
    def tail(rot, s):
        return (f'<g transform="translate(82 134) rotate({rot}) scale({s})">'
                f'<path d="M0 0C-18 -10 -26 -40 -14 -66C-6 -82 14 -82 18 -66C24 -42 16 -14 0 0Z" fill="url(#{p}bd)"/>'
                f'<path d="M-14 -66C-6 -82 14 -82 18 -66C14 -60 10 -62 8 -56C4 -62 0 -58 -4 -60C-8 -56 -10 -62 -14 -66Z" fill="{tip}"/>'
                f'<path d="M-4 -20q4 -6 2 -14M6 -30q3 -6 0 -12" stroke="{O2}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>')
    rots = {'baby': [52], 'teen': [-50, 42, 66], 'adult': [-70, -46, 22, 46, 70], 'legend': [-84, -63, -42, -21, 0, 21, 42, 63, 84]}[stage]
    s = 1.42 if lg else 1.08
    back = ''.join(tail(r, s) for r in rots)
    if lg:
        back = f'<g class="fan" style="transform-origin:82px 134px">{back}</g>'
    else:
        back = f'<g class="wag" style="transform-origin:82px 134px">{back}</g>'
    ear = (f'<path d="M38 58Q26 22 34 6Q56 14 70 40Z" fill="url(#{p}hd)"/><path d="M122 58Q134 22 126 6Q104 14 90 40Z" fill="url(#{p}hd)"/>'
           f'<g clip-path="url(#{p}eL)"><path d="M20 0L46 0L40 22Q32 20 24 26Z" fill="{D}"/></g><g clip-path="url(#{p}eR)"><path d="M140 0L114 0L120 22Q128 20 136 26Z" fill="{D}"/></g>'
           f'<path d="M43 50Q36 30 40 20Q52 26 62 40Z" fill="#FFC9B5"/><path d="M117 50Q124 30 120 20Q108 26 98 40Z" fill="#FFC9B5"/>'
           f'<path d="M44 46q4 -6 3 -12M48 46q4 -4 5 -10M116 46q-4 -6 -3 -12M112 46q-4 -4 -5 -10" stroke="{W}" stroke-width="2.2" fill="none" stroke-linecap="round"/>')
    tufts = (f'<path d="M34 80L22 86L32 90L24 98L36 98L32 106L44 100Z" fill="{O}"/><path d="M126 80L138 86L128 90L136 98L124 98L128 106L116 100Z" fill="{O}"/>')
    head = (f'<ellipse cx="80" cy="72" rx="51" ry="43" fill="url(#{p}hd)"/>'
            f'<path d="M30 80C32 106 54 116 80 116C106 116 128 106 130 80C120 92 104 94 92 88C88 96 84 100 80 100C76 100 72 96 68 88C56 94 40 92 30 80Z" fill="{W}"/>'
            f'<path d="M72 38q8 -6 16 0q-4 6 -8 10q-4 -4 -8 -10Z" fill="{O2}" opacity=".55"/>'
            f'<ellipse cx="62" cy="46" rx="15" ry="7" fill="#fff" opacity=".35" transform="rotate(-18 62 46)"/>')
    head += '<path d="M80 36l4.5 7.5l-4.5 7.5l-4.5 -7.5Z" fill="#7FD3FF"/><path d="M66 50q-6 -3 -11 1M94 50q6 -3 11 1" stroke="#D93B3B" stroke-width="3" fill="none" stroke-linecap="round"/>' if lg else '<circle cx="74" cy="56" r="2.6" fill="#E2483E"/><circle cx="86" cy="56" r="2.6" fill="#E2483E"/>'
    nose = f'<path d="M76 89.5q4 -2 8 0q-1 3.5 -4 4q-3 -.5 -4 -4Z" fill="{EYE}"/><circle cx="78.4" cy="90" r=".9" fill="#fff" opacity=".8"/>'
    body = (f'<ellipse cx="80" cy="124" rx="27" ry="23" fill="url(#{p}bd)"/>'
            f'<g clip-path="url(#{p}bc)"><ellipse cx="80" cy="104" rx="30" ry="9" fill="{O2}" opacity=".6"/>'
            f'<path d="M66 108L70 114L66 120L72 124L68 132L76 134L80 142L84 134L92 132L88 124L94 120L90 114L94 108Z" fill="{W}"/></g>')
    collar = ''
    if stage in ('teen', 'adult'):
        collar = ('<path d="M56 112Q80 124 104 112" stroke="#D93B3B" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
                  '<circle cx="80" cy="121" r="6" fill="#FFC93C"/><path d="M75.5 121.5h9" stroke="#B8860B" stroke-width="1.4"/><circle cx="80" cy="124" r="1.2" fill="#8A5A12"/><circle cx="78" cy="119" r="1.6" fill="#fff" opacity=".8"/>')
    if lg:
        collar = '<path d="M56 112Q80 124 104 112" stroke="#6E4BD8" stroke-width="5.5" fill="none" stroke-linecap="round"/>' + star(80, 123, 8, '#FFE27A')
    ab, af = arms(pose, O, D)
    fig = back + feet(D) + ab + body + collar + ear + tufts + head + face(p, pose, '#B0672E', nose) + af
    if lg and pose == 'idle':
        fig += sparkle_eyes()
    return defs, fig

# ---------------- BI ----------------
def bi(stage, pose, p):
    lg = stage == 'legend'
    T, T2, T3 = ('#9DEFE0', '#6FD3C2', '#D6FFF7') if lg else ('#7FD6C6', '#5BB9A9', '#B5F0E4')
    C = '#F0FFFB'
    defs = common_defs(p) + grad(p, 'hd', T3, T, T2) + grad(p, 'bd', T3, T, T2, .4, .25) + f'<clipPath id="{p}bc"><ellipse cx="80" cy="124" rx="27" ry="23"/></clipPath>'
    def leaf(x, y, rot, s, c1='#6ED27F', c2='#4FB565'):
        return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><path d="M0 0C-10 -14 -10 -34 0 -48C10 -34 10 -14 0 0Z" fill="{c1}"/>'
                f'<path d="M0 0C-10 -14 -10 -34 0 -48C0 -32 0 -16 0 0Z" fill="{c2}"/><path d="M0 -4V-42M0 -16l-5 -6M0 -26l5 -6M0 -34l-4 -4" stroke="#3E9C5C" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/></g>')
    back = ''
    if stage == 'teen':
        back = f'<g class="flL" style="transform-origin:58px 112px">{leaf(58,112,-60,.7)}</g><g class="flR" style="transform-origin:102px 112px">{leaf(102,112,60,.7)}</g>'
    if stage == 'adult':
        back = f'<g class="flL" style="transform-origin:58px 112px">{leaf(58,112,-58,1)}{leaf(58,116,-92,.75,"#5BC46E","#46A85A")}</g><g class="flR" style="transform-origin:102px 112px">{leaf(102,112,58,1)}{leaf(102,116,92,.75,"#5BC46E","#46A85A")}</g>'
    if lg:
        def petal(x, y, rot, s, c):
            return f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><path d="M0 0C-16 -16 -16 -44 0 -58C16 -44 16 -16 0 0Z" fill="{c}"/><path d="M0 -6C-4 -20 -4 -36 0 -50" stroke="#fff" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/></g>'
        wl = petal(58, 112, -48, 1.15, '#FFD0E0') + petal(58, 114, -80, 1.2, '#FFF0C9') + petal(58, 116, -112, 1, '#FFD0E0')
        wr = petal(102, 112, 48, 1.15, '#FFD0E0') + petal(102, 114, 80, 1.2, '#FFF0C9') + petal(102, 116, 112, 1, '#FFD0E0')
        back = f'<g class="flL" style="transform-origin:58px 112px">{wl}</g><g class="flR" style="transform-origin:102px 112px">{wr}</g>'
    sprout = '<path d="M80 34C80 26 80 20 81 13" stroke="#3E9C5C" stroke-width="3.6" fill="none" stroke-linecap="round"/>' + leaf(80, 28, -55, .42) + leaf(81, 28, 55, .42)
    if stage in ('adult',):
        sprout += '<ellipse cx="81" cy="9" rx="6.5" ry="8.5" fill="#FF8FB1"/><path d="M78 6q3 -4 6 0" stroke="#FFD2E0" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
    ears = (f'<circle cx="42" cy="44" r="13" fill="url(#{p}hd)"/><circle cx="118" cy="44" r="13" fill="url(#{p}hd)"/>'
            '<circle cx="42" cy="45" r="7" fill="#FFC2D2"/><circle cx="118" cy="45" r="7" fill="#FFC2D2"/>')
    head = (f'<ellipse cx="80" cy="73" rx="51" ry="43" fill="url(#{p}hd)"/>'
            f'<ellipse cx="80" cy="99" rx="28" ry="15" fill="{C}"/>'
            f'<ellipse cx="62" cy="47" rx="15" ry="7" fill="#fff" opacity=".4" transform="rotate(-18 62 47)"/>'
            f'<circle cx="104" cy="52" r="2.2" fill="{T2}"/><circle cx="111" cy="58" r="1.6" fill="{T2}"/>')
    body = (f'<ellipse cx="80" cy="124" rx="27" ry="23" fill="url(#{p}bd)"/><g clip-path="url(#{p}bc)"><ellipse cx="80" cy="104" rx="30" ry="9" fill="{T2}" opacity=".6"/>'
            f'<ellipse cx="80" cy="132" rx="16" ry="13" fill="{C}"/></g>')
    band = ''
    if stage in ('teen', 'adult'):
        band = '<path d="M55 113Q80 126 105 113L104 121Q80 134 56 121Z" fill="#3F6FE0"/><path d="M96 120l9 10l4 -11Z" fill="#3F6FE0"/><path d="M60 117q20 8 40 0" stroke="#7FA2FF" stroke-width="1.6" fill="none" stroke-dasharray="2 3"/>'
    if lg:
        band = star(80, 124, 8.5, '#FFC93C')
    ab, af = arms(pose, T, T2)
    crown = ''
    if lg:
        def flower(x, y, s):
            o = f'<g transform="translate({x} {y}) scale({s})">'
            for i in range(5):
                o += f'<ellipse cx="0" cy="-6" rx="4.4" ry="6" fill="#FF9EC0" transform="rotate({i*72})"/>'
            return o + '<circle r="3.4" fill="#FFC93C"/></g>'
        crown = leaf(52, 38, -70, .35) + leaf(108, 38, 70, .35) + flower(44, 44, .9) + flower(61, 33, 1) + flower(80, 28, 1.3) + flower(99, 33, 1) + flower(116, 44, .9)
        sprout = ''
    fig = back + feet(T2) + ab + body + band + sprout + ears + head + face(p, pose, '#2F8C7E', '', 82, 98) + crown + af
    if lg and pose == 'idle':
        fig += sparkle_eyes(82)
    return defs, fig

# ---------------- DRACO ----------------
def draco(stage, pose, p):
    lg = stage == 'legend'
    G, G2, G3 = ('#5FE6A8', '#33BE80', '#B8FFDB') if lg else ('#6ED3A0', '#46B37E', '#A8EDC8')
    Bl = '#FFE08A' if lg else '#FFEBC2'
    H = '#FFD34D' if lg else '#FFF0C8'
    defs = common_defs(p) + grad(p, 'hd', G3, G, G2) + grad(p, 'bd', G3, G, G2, .4, .25) + f'<clipPath id="{p}bc"><ellipse cx="80" cy="124" rx="27" ry="23"/></clipPath>'
    def wing(s, mem, bone):
        w = (f'<path d="M0 0C-16 -26 -38 -44 -58 -46C-52 -34 -54 -24 -60 -16C-48 -16 -42 -8 -46 2C-32 0 -18 4 0 6Z" fill="{mem}"/>'
             f'<path d="M-2 2L-54 -42M-2 4L-54 -14M-2 5L-42 0" stroke="{bone}" stroke-width="2.6" fill="none" stroke-linecap="round"/>')
        return f'<g transform="translate(58 108) scale({s})">{w}</g>', f'<g transform="translate(102 108) scale({-s} {s})">{w}</g>'
    back = ''
    if stage != 'baby':
        s = {'teen': .7, 'adult': 1, 'legend': 1.8}[stage]
        mem, bone = ('#FF9F5A', '#FFE27A') if lg else ('#B8F0D2', G2)
        l, r = wing(s, mem, bone)
        back = f'<g class="wgL" style="transform-origin:58px 108px">{l}</g><g class="wgR" style="transform-origin:102px 108px">{r}</g>'
    tail = (f'<g class="swish" style="transform-origin:96px 138px"><path d="M94 134C118 144 138 134 140 114C150 124 148 142 134 148C118 154 100 150 92 144Z" fill="url(#{p}bd)"/>'
            f'<path d="M134 116L144 96L151 118Z" fill="#FF9A5A"/><path d="M110 142l4 -6l3 6M122 140l4 -6l3 5" fill="#FF9A5A"/>')
    if lg:
        tail += '<g transform="translate(146 92) scale(1.3)"><path class="fire" d="M0 -14C8 -4 10 4 0 10C-10 4 -8 -4 0 -14Z" fill="#FF7A3C"/><path d="M0 -4C4 1 4 5 0 8C-4 5 -4 1 0 -4Z" fill="#FFE27A"/></g>'
    tail += '</g>'
    horns = (f'<path d="M50 42C44 28 40 18 33 10C49 12 59 24 62 36Z" fill="{H}"/><path d="M110 42C116 28 120 18 127 10C111 12 101 24 98 36Z" fill="{H}"/>'
             '<path d="M44 30l7 -3M40 22l6 -3M116 30l-7 -3M120 22l-6 -3" stroke="#000" stroke-opacity=".15" stroke-width="1.6" stroke-linecap="round"/>')
    spikes = '<path d="M68 36Q72 22 76 34Q80 18 84 34Q88 22 92 36Z" fill="#FF9A5A"/>'
    if lg:
        spikes = '<path d="M64 34L70 8L78 28L82 4L86 28L94 8L98 34Z" fill="#FFD34D"/><circle cx="82" cy="24" r="4" fill="#E8604C"/>'
    head = (f'<ellipse cx="80" cy="73" rx="51" ry="43" fill="url(#{p}hd)"/>'
            f'<ellipse cx="80" cy="99" rx="25" ry="13" fill="{G3}"/>'
            '<circle cx="73" cy="95" r="1.9" fill="#2E6B50"/><circle cx="87" cy="95" r="1.9" fill="#2E6B50"/>'
            f'<ellipse cx="62" cy="47" rx="15" ry="7" fill="#fff" opacity=".4" transform="rotate(-18 62 47)"/>'
            f'<circle cx="100" cy="48" r="3" fill="{G2}"/><circle cx="108" cy="54" r="2.2" fill="{G2}"/><circle cx="98" cy="57" r="1.8" fill="{G2}"/>')
    ears = f'<path d="M30 70L14 60L28 84Z" fill="{G2}"/><path d="M130 70L146 60L132 84Z" fill="{G2}"/>'
    fang = '<path d="M84 99.5l2 3.6l1.8 -3.8Z" fill="#fff"/>'
    body = (f'<ellipse cx="80" cy="124" rx="27" ry="23" fill="url(#{p}bd)"/><g clip-path="url(#{p}bc)"><ellipse cx="80" cy="104" rx="30" ry="9" fill="{G2}" opacity=".6"/>'
            f'<ellipse cx="80" cy="132" rx="16" ry="15" fill="{Bl}"/><path d="M68 126h24M66 133h28M68 140h24" stroke="#E2B060" stroke-width="1.8" stroke-linecap="round" opacity=".8"/></g>')
    scarf = ''
    if stage == 'adult':
        scarf = '<path d="M56 113Q80 125 104 113" stroke="#E8604C" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
    if lg:
        scarf = '<path d="M56 113Q80 125 104 113" stroke="#FFD34D" stroke-width="5.5" fill="none" stroke-linecap="round"/>' + star(80, 124, 8, '#E8604C')
    ab, af = arms(pose, G, G2)
    fig = back + tail + feet(G2) + ab + body + scarf + horns + ears + spikes + head + face(p, pose, '#3C8F68', fang, 80, 101) + af
    if lg and pose == 'idle':
        fig += sparkle_eyes()
    return defs, fig

# ---------------- ROBO ----------------
def robo(stage, pose, p):
    lg = stage == 'legend'
    M, M2, M3 = ('#EEF3FB', '#C7D5EA', '#FFFFFF') if lg else ('#A9BEDD', '#8299BD', '#D6E3F5')
    acc = '#FFC93C' if lg else '#FF8A4C'
    cy = '#9FF6FF' if lg else '#5CE1E6'
    defs = common_defs(p) + grad(p, 'hd', M3, M, M2) + grad(p, 'bd', M3, M, M2, .4, .25)
    back = ''
    def fin(s, rot=0):
        f = '<path d="M0 0C-14 -12 -26 -28 -28 -46C-16 -38 -4 -28 4 -14Z" fill="%s"/>' % ('#7FE9FF' if lg else acc)
        return f'<g transform="translate(52 108) rotate({rot}) scale({s})">{f}</g><g transform="translate(108 108) rotate({-rot}) scale({-s} {s})">{f}</g>'
    if stage == 'teen': back = fin(1)
    if stage == 'adult': back = fin(1.4)
    if lg:
        back = '<g class="jet1"><g transform="translate(66 154)"><path class="jet" d="M-8 0C-8 14 -3 24 0 30C3 24 8 14 8 0Z" fill="#7FE9FF"/><path d="M-3 0C-3 8 -1 12 0 16C1 12 3 8 3 0Z" fill="#fff"/></g><g transform="translate(94 154)"><path class="jet" d="M-8 0C-8 14 -3 24 0 30C3 24 8 14 8 0Z" fill="#7FE9FF"/><path d="M-3 0C-3 8 -1 12 0 16C1 12 3 8 3 0Z" fill="#fff"/></g></g>' + fin(2.1, -6) + fin(1.4, 28)
    feet_ = ''.join(f'<rect x="{x-12}" y="139" width="24" height="13" rx="6.5" fill="{M2}"/><rect x="{x-9}" y="148" width="18" height="3" rx="1.5" fill="#000" opacity=".15"/>' for x in (66, 94))
    body = (f'<rect x="53" y="102" width="54" height="44" rx="20" fill="url(#{p}bd)"/><rect x="53" y="102" width="54" height="9" fill="{M2}" opacity=".7"/>'
            f'<rect x="66" y="117" width="28" height="20" rx="8" fill="#26324F"/>')
    body += (f'<path class="led" d="M80 133c-6 -7 -13 -2 -9.5 3.5l9.5 7l9.5 -7c3.5 -5.5 -3.5 -10.5 -9.5 -3.5Z" transform="translate(0 -9)" fill="#FF6F8E"/>' if stage in ('adult', 'legend')
             else f'<circle class="led" cx="80" cy="127" r="5" fill="{cy}"/>')
    body += '<circle cx="59" cy="132" r="1.6" fill="#000" opacity=".2"/><circle cx="101" cy="132" r="1.6" fill="#000" opacity=".2"/>'
    pads = ''
    if stage != 'baby':
        pads = f'<rect x="44" y="104" width="20" height="12" rx="6" fill="{acc}"/><rect x="96" y="104" width="20" height="12" rx="6" fill="{acc}"/>'
    ant = (f'<g class="ant" style="transform-origin:80px 34px"><path d="M80 34V15" stroke="{M2}" stroke-width="3.4" stroke-linecap="round"/>'
           f'<circle cx="80" cy="12" r="7" fill="{acc}"/><circle cx="77.5" cy="9.5" r="2.2" fill="#fff" opacity=".9"/></g>')
    bolts = f'<circle cx="28" cy="76" r="9" fill="{acc}"/><circle cx="28" cy="76" r="3.5" fill="#000" opacity=".15"/><circle cx="132" cy="76" r="9" fill="{acc}"/><circle cx="132" cy="76" r="3.5" fill="#000" opacity=".15"/>'
    head = (f'<rect x="28" y="31" width="104" height="86" rx="38" fill="url(#{p}hd)"/>'
            f'<ellipse cx="60" cy="42" rx="14" ry="5.5" fill="#fff" opacity=".55" transform="rotate(-12 60 42)"/>'
            f'<rect x="38" y="54" width="84" height="48" rx="24" fill="#26324F"/><path d="M48 60q10 -4 22 -3" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none" stroke-linecap="round"/>'
            '<circle cx="40" cy="44" r="1.6" fill="#000" opacity=".2"/><circle cx="120" cy="44" r="1.6" fill="#000" opacity=".2"/>')
    # eyes as glowing ovals with recipe highlights
    ek = FACE.get(pose, 'open')
    if ek == 'happy':
        ey = ''.join(f'<path d="M{x-8} 80q8 -10 16 0" stroke="{cy}" stroke-width="4.4" fill="none" stroke-linecap="round"/>' for x in (60, 100))
    else:
        ey = ''.join(f'<ellipse cx="{x}" cy="78" rx="8.5" ry="11" fill="{cy}"/><ellipse cx="{x}" cy="84" rx="7" ry="4.5" fill="#2FB8D0"/><circle cx="{x-3}" cy="73" r="3.4" fill="#fff"/><circle cx="{x+3}" cy="82" r="1.6" fill="#fff"/>' for x in (60, 100))
    mk = MOUTH.get(pose, 'w')
    mo = (f'<path d="M74 93q3 3 6 0q3 3 6 0" stroke="{cy}" stroke-width="2.3" fill="none" stroke-linecap="round"/>' if mk == 'w'
          else f'<rect x="74" y="91" width="12" height="7" rx="3.5" fill="{cy}"/>')
    cheeks = f'<g filter="url(#{p}blur)" opacity=".8"><ellipse cx="46" cy="104" rx="7" ry="4" fill="#FF8FA8"/><ellipse cx="114" cy="104" rx="7" ry="4" fill="#FF8FA8"/></g>'
    halo = ''
    if lg:
        halo = '<path d="M58 28Q80 16 102 28" stroke="#FFC93C" stroke-width="5" fill="none" stroke-linecap="round"/>'
    ab, af = arms(pose, M, M2 if not lg else '#FFE27A')
    fig = back + feet_ + ab + body + pads + ant + bolts + head + ey + mo + cheeks + halo + af
    if lg and pose == 'idle':
        fig += star(57, 73, 4.6, '#FFE27A') + star(97, 73, 4.6, '#FFE27A')
    return defs, fig

# ---------------- LUPO ----------------
def lupo(stage, pose, p):
    lg = stage == 'legend'
    S, S2, S3 = ('#F2F5FF', '#CBD3EE', '#FFFFFF') if lg else ('#CED7EA', '#A9B6D2', '#EEF2FA')
    I = '#4D58B8' if lg else '#8095BE'
    Cr = '#FFF8EC'
    defs = common_defs(p) + grad(p, 'hd', S3, S, S2) + grad(p, 'bd', S3, S, S2, .4, .25) + f'<clipPath id="{p}bc"><ellipse cx="80" cy="124" rx="27" ry="23"/></clipPath>'
    ts = {'baby': .9, 'teen': 1.05, 'adult': 1.2, 'legend': 1.5}[stage]
    tail = (f'<g class="wag" style="transform-origin:100px 134px"><g transform="translate(100 134) scale({ts}) translate(-100 -134)">'
            f'<path d="M98 136C124 140 144 122 140 96C138 80 124 74 118 86C128 104 120 122 96 126Z" fill="{I}"/>'
            f'<path d="M118 86C124 74 138 80 140 96C134 100 122 96 118 86Z" fill="{"#FFF3B8" if lg else Cr}"/>'
            f'<path d="M124 112q8 -6 8 -14" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none" stroke-linecap="round"/>')
    if lg:
        tail += '<circle cx="126" cy="114" r="1.8" fill="#FFF3B8"/><circle cx="132" cy="100" r="1.4" fill="#FFF3B8"/><circle cx="116" cy="124" r="1.4" fill="#FFF3B8"/>'
    tail += '</g></g>'
    cape = ''
    if stage == 'adult' or lg:
        c = '#2C2F7A'
        cape = (f'<g class="cape" style="transform-origin:80px 112px"><path d="M54 112Q80 120 106 112L{124 if lg else 116} 154Q80 164 {36 if lg else 44} 154Z" fill="{c}"/>'
                + star(56, 138, 3.4, '#FFE27A') + star(102, 142, 2.6, '#FFF3B8') + star(80, 152, 2.2, '#FFF3B8') + '</g>')
    ears = (f'<path d="M40 52C34 34 34 16 40 6C52 12 64 26 70 38Z" fill="{I}"/><path d="M120 52C126 34 126 16 120 6C108 12 96 26 90 38Z" fill="{I}"/>'
            '<path d="M44 44C40 32 41 22 44 15C52 20 59 28 62 36Z" fill="#FFC9D2"/><path d="M116 44C120 32 119 22 116 15C108 20 101 28 98 36Z" fill="#FFC9D2"/>'
            f'<path d="M46 40q3 -6 2 -12M114 40q-3 -6 -2 -12" stroke="{Cr}" stroke-width="2" fill="none" stroke-linecap="round"/>')
    tufts = f'<path d="M34 80L20 88L32 92L22 100L36 100L30 108L44 102Z" fill="{S}"/><path d="M126 80L140 88L128 92L138 100L124 100L130 108L116 102Z" fill="{S}"/>'
    moon = '<path d="M86 42A11 11 0 1 0 86 62A8.5 8.5 0 1 1 86 42Z" fill="#FFD34D"/>'
    head = (f'<ellipse cx="80" cy="73" rx="51" ry="43" fill="url(#{p}hd)"/>'
            f'<path d="M80 34C66 34 56 46 58 66C68 60 76 56 80 48C84 56 92 60 102 66C104 46 94 34 80 34Z" fill="{I}" opacity=".5"/>'
            f'<path d="M40 88C46 112 114 112 120 88C108 98 94 94 80 104C66 94 52 98 40 88Z" fill="{Cr}"/>'
            f'<ellipse cx="60" cy="48" rx="13" ry="6" fill="#fff" opacity=".5" transform="rotate(-18 60 48)"/>' + moon)
    nose = f'<ellipse cx="80" cy="94" rx="5" ry="3.6" fill="{EYE}"/><circle cx="78.4" cy="93" r="1" fill="#fff" opacity=".8"/>'
    body = (f'<ellipse cx="80" cy="124" rx="27" ry="23" fill="url(#{p}bd)"/><g clip-path="url(#{p}bc)"><ellipse cx="80" cy="104" rx="30" ry="9" fill="{S2}" opacity=".7"/>'
            f'<path d="M66 108L70 114L66 120L72 124L68 132L76 134L80 142L84 134L92 132L88 124L94 120L90 114L94 108Z" fill="{Cr}"/></g>')
    scarf = ''
    if stage in ('teen', 'adult'):
        scarf = '<path d="M55 113Q80 126 105 113L104 121Q80 134 56 121Z" fill="#3F6FE0"/><path d="M62 120l-8 13l10 -2Z" fill="#3F6FE0"/>'
    if lg:
        scarf = '<path d="M56 113Q80 125 104 113" stroke="#FFD34D" stroke-width="5" fill="none" stroke-linecap="round"/>' + star(80, 123, 8, '#FFF3B8')
    ab, af = arms(pose, S, Cr)
    fig = cape + tail + feet(Cr, '#FFB3C2') + ab + body + scarf + ears + tufts + head + face(p, pose, '#5B6BC8', nose, 82, 99) + af
    if lg and pose == 'idle':
        fig += sparkle_eyes(82)
    return defs, fig

CHARS = {'bi': bi, 'kitsu': kitsu, 'draco': draco, 'robo': robo, 'lupo': lupo}

# ---------------- EGGS ----------------
EGG = {
    'bi': ('#E6FBF5', '#BDEFE3', '<path d="M80 50C80 42 80 36 81 30" stroke="#3E9C5C" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M80 44C70 43 64 37 65 30C74 30 81 36 80 44Z" fill="#5BC46E"/><path d="M81 44C91 43 97 37 96 30C87 30 80 36 81 44Z" fill="#6ED27F"/><path d="M44 104q12 -8 18 2t18 0t18 0t18 -2" stroke="#7FD6C6" stroke-width="6" fill="none" stroke-linecap="round"/>'),
    'kitsu': ('#FFF4E6', '#FFD9B0', '<path d="M56 64L50 40L68 54Z M104 64L110 40L92 54Z" fill="#F59A45"/><path d="M50 40L53 50L58 46Z M110 40L107 50L102 46Z" fill="#6B3826"/><path d="M42 98q38 18 76 0" stroke="#F59A45" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M118 122C138 118 142 98 132 90C130 102 124 110 118 112Z" fill="#F59A45"/><path d="M132 90C138 94 140 100 138 106C134 102 132 96 132 90Z" fill="#FFF6EA"/>'),
    'draco': ('#E8F8EF', '#BFEBD3', '<path d="M60 60L64 44L70 58Z M90 58L96 44L100 60Z" fill="#FFF0C8"/><path d="M48 82l8 7l8 -7l8 7l8 -7l8 7l8 -7l8 7l8 -7" stroke="#6ED3A0" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="56" cy="138" r="5" fill="#A8EDC8"/><circle cx="106" cy="100" r="6" fill="#A8EDC8"/>'),
    'robo': ('#EEF3FA', '#C8D6EA', '<path d="M80 48V34" stroke="#8299BD" stroke-width="3.4" stroke-linecap="round"/><circle class="led" cx="80" cy="31" r="5.5" fill="#FF8A4C"/><path d="M44 96H116" stroke="#A9BEDD" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/><rect x="58" y="104" width="44" height="24" rx="12" fill="#26324F"/>'),
    'lupo': ('#F1F4FB', '#CED7EA', '<path d="M56 64L52 40L68 54Z M104 64L108 40L92 54Z" fill="#8095BE"/><path d="M86 74A10 10 0 1 0 86 92A7.5 7.5 0 1 1 86 74Z" fill="#FFD34D"/><circle cx="56" cy="104" r="2.4" fill="#A9B6D2"/><circle cx="108" cy="98" r="3" fill="#A9B6D2"/><circle cx="98" cy="140" r="2.4" fill="#A9B6D2"/>'),
}
def egg(n, p):
    a, b, deco = EGG[n]
    defs = f'<radialGradient id="{p}eg" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></radialGradient><filter id="{p}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>'
    eye = '#2A1D35' if n != 'robo' else '#5CE1E6'
    fig = ('<g class="wob" style="transform-origin:80px 150px">'
           f'<path d="M80 46C52 46 38 92 40 116C42 144 60 152 80 152C100 152 118 144 120 116C122 92 108 46 80 46Z" fill="url(#{p}eg)"/>'
           + deco +
           f'<path d="M66 118q6 -6 12 0M86 118q6 -6 12 0" stroke="{eye}" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
           f'<g filter="url(#{p}blur)" opacity=".7"><ellipse cx="60" cy="127" rx="7" ry="4" fill="#FF8FA8"/><ellipse cx="104" cy="127" rx="7" ry="4" fill="#FF8FA8"/></g>'
           f'<ellipse cx="62" cy="64" rx="9" ry="14" fill="#fff" opacity=".55" transform="rotate(20 62 64)"/></g>')
    return defs, fig
NECK = {'on': True}
