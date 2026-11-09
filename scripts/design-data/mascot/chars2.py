# Mascot v3.1: richer Bi, Draco, Lupo with mythic legend forms.
from gen import common_defs, EYE
from chars import grad, arms, feet, face, star, sparkle_eyes, CHARS, NECK

def lin(p, name, stops, x2=0, y2=1):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{p}{name}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'

def fur(x, y, c, op=.35, s=1):
    return f'<path d="M{x} {y}q{2*s} {-4*s} {1*s} {-8*s}M{x+4*s} {y+1}q{2*s} {-4*s} {1*s} {-7*s}" stroke="{c}" stroke-opacity="{op}" stroke-width="1.6" fill="none" stroke-linecap="round"/>'

def rim(c='#fff', op=.5):
    return f'<path d="M40 56C48 38 64 31 80 30" stroke="{c}" stroke-opacity="{op}" stroke-width="3" fill="none" stroke-linecap="round"/>'

def claws(c='#fff', y=150):
    return ''.join(f'<path d="M{x-5} {y}l-1 3M{x} {y+1}v3M{x+5} {y}l1 3" stroke="{c}" stroke-width="2" stroke-linecap="round"/>' for x in (66, 94))

# ======================= DRACO =======================
def draco(stage, pose, p):
    lg = stage == 'legend'
    if lg:
        G, G2, G3 = '#4FE3B0', '#1FA98A', '#C4FFE9'
    else:
        G, G2, G3 = '#6ED3A0', '#43B07C', '#B4F2D2'
    Bl, Bl2 = ('#FFE38A', '#E9B23C') if lg else ('#FFEDC4', '#E8C27E')
    defs = (common_defs(p) + grad(p, 'hd', G3, G, G2) + grad(p, 'bd', G3, G, G2, .4, .25)
            + f'<clipPath id="{p}bc"><ellipse cx="80" cy="124" rx="27" ry="23"/></clipPath>'
            + lin(p, 'wm', [(0, '#C9F5DE'), (1, '#7FD9AE')] if not lg else [(0, '#FFE9A8'), (.5, '#FF9F7A'), (1, '#C25BD8')])
            + lin(p, 'hn', [(0, '#FFF6DA'), (1, '#E8CF92')] if not lg else [(0, '#FFF3B0'), (1, '#E0A21E')])
            + f'<radialGradient id="{p}pearl" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#BDF3FF"/><stop offset="1" stop-color="#6FA8FF"/></radialGradient>')
    o = ''
    # ---- wings
    def wing(s, rot=0):
        w = (f'<path d="M0 0C-14 -28 -36 -48 -60 -52C-54 -40 -58 -30 -66 -24C-54 -20 -50 -12 -56 -2C-44 -4 -38 2 -40 10C-26 4 -12 6 0 8Z" fill="url(#{p}wm)"/>'
             f'<path d="M-1 3L-58 -48M-1 5L-62 -22M-1 6L-52 0M-1 7L-38 9" stroke="{"#FFE27A" if lg else G2}" stroke-width="2.8" fill="none" stroke-linecap="round"/>'
             f'<circle cx="-58" cy="-48" r="3" fill="{"#FFE27A" if lg else Bl}"/>')
        if lg:
            w += ''.join(star(x, y, 2.6, '#FFF6CF') for x, y in ((-40, -30), (-50, -8), (-28, -10), (-20, -28)))
        return (f'<g class="wgL" style="transform-origin:58px 108px"><g transform="translate(58 108) rotate({rot}) scale({s})">{w}</g></g>'
                f'<g class="wgR" style="transform-origin:102px 108px"><g transform="translate(102 108) rotate({-rot}) scale({-s} {s})">{w}</g></g>')
    if stage == 'teen': o += wing(.62)
    if stage == 'adult': o += wing(.95)
    if lg: o += wing(1.55, -8)
    # ---- tail
    t = (f'<g class="swish" style="transform-origin:96px 138px"><path d="M92 132C118 144 140 134 142 112C152 122 150 142 136 148C118 156 100 152 90 146Z" fill="url(#{p}bd)"/>'
         f'<path d="M100 146C116 150 130 146 138 138" stroke="{Bl}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>')
    if stage != 'baby':
        t += f'<path d="M108 138l3 -8l4 7M120 136l3 -8l4 6M131 128l4 -7l2 7" fill="#FF9A5A"/>'
    if lg:
        t += '<g transform="translate(144 104) scale(1.5)"><path class="fire" d="M0 -16C9 -6 11 4 0 10C-11 4 -9 -6 0 -16Z" fill="#FF7A3C"/><path class="fire" d="M0 -6C5 0 5 5 0 8C-5 5 -5 0 0 -6Z" fill="#FFE27A"/></g>'
    else:
        t += '<path d="M136 116L146 96L153 119Z" fill="#FF9A5A"/>'
    o += t + '</g>'
    # ---- feet with claws
    o += feet(G2) + claws('#FFF6DA')
    ab, af = arms(pose, G, G2)
    o += ab
    # ---- body
    o += (f'<ellipse cx="80" cy="124" rx="27" ry="23" fill="url(#{p}bd)"/><g clip-path="url(#{p}bc)"><ellipse cx="80" cy="104" rx="30" ry="9" fill="{G2}" opacity=".6"/>'
          f'<path d="M64 118Q80 112 96 118L94 146H66Z" fill="{Bl}"/>'
          + ''.join(f'<path d="M{66+k} {122+k*7}Q80 {118+k*7} {94-k} {122+k*7}" stroke="{Bl2}" stroke-width="1.8" fill="none"/>' for k in range(4))
          + f'<circle cx="58" cy="128" r="2" fill="{G3}" opacity=".7"/><circle cx="103" cy="132" r="2" fill="{G3}" opacity=".7"/></g>')
    if NECK["on"] and stage == 'adult':
        o += '<path d="M56 113Q80 125 104 113" stroke="#E8604C" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M98 118l8 11l4 -10Z" fill="#E8604C"/>'
    # ---- head frills (side fins)
    def frill(sx):
        return (f'<g transform="translate({80 + sx*48} 78) scale({sx} 1)"><path d="M0 -14L16 -22L12 -10L22 -8L12 0L18 8L0 6Z" fill="{G2}"/>'
                f'<path d="M2 -10L14 -18M2 -4L18 -7M2 2L14 6" stroke="{G3}" stroke-width="1.6" stroke-linecap="round"/></g>')
    o += frill(-1) + frill(1)
    # ---- horns
    if stage == 'baby':
        o += f'<ellipse cx="56" cy="38" rx="6" ry="9" fill="url(#{p}hn)" transform="rotate(-28 56 38)"/><ellipse cx="104" cy="38" rx="6" ry="9" fill="url(#{p}hn)" transform="rotate(28 104 38)"/>'
    elif lg:
        # golden branching antler horns (eastern dragon)
        for sx in (-1, 1):
            o += (f'<g transform="translate(80 0) scale({sx} 1) translate(-80 0)"><path d="M58 42C50 28 46 16 36 4" stroke="url(#{p}hn)" stroke-width="7" fill="none" stroke-linecap="round"/>'
                  f'<path d="M48 24C40 22 34 18 30 12M42 12C38 6 38 0 40 -6M52 32C44 34 36 32 30 28" stroke="url(#{p}hn)" stroke-width="5" fill="none" stroke-linecap="round"/></g>')
    else:
        s = 1 if stage == 'adult' else .85
        for sx in (-1, 1):
            o += (f'<g transform="translate(80 0) scale({sx} 1) translate(-80 0)"><g transform="translate(58 42) scale({s}) translate(-58 -42)"><path d="M52 44C44 30 40 18 32 9C48 11 58 24 62 36Z" fill="url(#{p}hn)"/>'
                  f'<path d="M45 33l8 -3M41 25l7 -3M37 17l6 -2" stroke="#000" stroke-opacity=".14" stroke-width="1.6" stroke-linecap="round"/></g></g>')
    # ---- flame mane (legend) behind head
    if lg:
        mane = ''
        for i, a in enumerate(range(-75, 76, 25)):
            mane += f'<g transform="rotate({a} 80 74)"><path d="M80 34C72 22 74 10 80 2C86 10 88 22 80 34Z" fill="{"#FF8A3C" if i % 2 else "#FFC94A"}"/></g>'
        o += f'<g class="fire2">{mane}</g>'
    # ---- spikes on head
    if not lg:
        o += '<path d="M68 36Q71 22 75 34Q80 16 85 34Q89 22 92 36Z" fill="#FF9A5A"/><path d="M76 33Q80 22 84 33" fill="#FFC08A"/>'
    # ---- head
    o += (f'<ellipse cx="80" cy="73" rx="51" ry="43" fill="url(#{p}hd)"/>' + rim()
          + f'<ellipse cx="80" cy="99" rx="25" ry="13" fill="{G3}"/>'
          f'<ellipse cx="72.5" cy="95" rx="2" ry="1.5" fill="{G2}"/><ellipse cx="87.5" cy="95" rx="2" ry="1.5" fill="{G2}"/>'
          f'<path d="M72 50l4 -5l4 5l-4 5Z M84 46l4 -5l4 5l-4 5Z M78 58l3 -4l3 4l-3 4Z" fill="{G3}" opacity=".8"/>'
          f'<circle cx="104" cy="52" r="2.4" fill="{G2}"/><circle cx="111" cy="58" r="1.8" fill="{G2}"/><circle cx="52" cy="58" r="1.8" fill="{G2}"/>')
    if stage == 'baby':
        # eggshell cap
        o += '<path d="M48 44C52 24 66 16 80 16C94 16 108 24 112 44L104 38L96 46L88 38L80 46L72 38L64 46L56 38Z" fill="#FFFBF0"/><circle cx="66" cy="28" r="3" fill="#B4F2D2"/><circle cx="96" cy="26" r="2.4" fill="#B4F2D2"/>'
    if lg:
        o += '<path d="M66 34L72 14L78 28L80 8L82 28L88 14L94 34Z" fill="#FFD34D"/><circle cx="80" cy="30" r="4.4" fill="#5BC8FF"/><circle cx="78.6" cy="28.6" r="1.4" fill="#fff"/>'
    o += face(p, pose, '#3C8F68', '<path d="M84 99.5l2 3.6l1.8 -3.8Z" fill="#fff"/>', 80, 101)
    if lg:
        # whiskers: short golden curls beside the cheeks
        o += '<path d="M34 96C24 92 20 82 26 76C30 72 36 76 32 80" stroke="#FFD34D" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M126 96C136 92 140 82 134 76C130 72 124 76 128 80" stroke="#FFD34D" stroke-width="3" fill="none" stroke-linecap="round"/>'
        o += '<path d="M56 113Q80 125 104 113" stroke="#FFD34D" stroke-width="5" fill="none" stroke-linecap="round"/>' + star(80, 123, 7.5, '#5BC8FF')
    o += af
    if lg and pose == 'idle':
        o += sparkle_eyes()
    return defs, o

# ======================= LUPO =======================
def lupo(stage, pose, p):
    lg = stage == 'legend'
    S, S2, S3 = ('#F4F6FF', '#C9D0F0', '#FFFFFF') if lg else ('#D3DBEC', '#A7B3D0', '#F1F4FB')
    M = '#6F7EE0' if lg else '#7F8FB8'   # mask / ears / back
    Cr = '#FFFFFF' if lg else '#FFF8EE'
    defs = (common_defs(p) + grad(p, 'hd', S3, S, S2) + grad(p, 'bd', S3, S, S2, .4, .25)
            + f'<clipPath id="{p}bc"><ellipse cx="80" cy="124" rx="27" ry="23"/></clipPath><clipPath id="{p}hc"><ellipse cx="80" cy="73" rx="51" ry="43"/></clipPath>'
            + lin(p, 'tl', [(0, M), (1, '#3B3F86' if lg else '#6676A6')])
            + lin(p, 'au', [(0, '#7FF0FF'), (.5, '#8E7BFF'), (1, '#FF8FD8')], 1, 0)
            + lin(p, 'gx', [(0, '#2A2E7A'), (.6, '#6A4FD8'), (1, '#7FE0FF')]))
    o = ''
    # ---- aurora mane (legend) behind
    if lg:
        o += (f'<g class="cape" style="transform-origin:80px 112px"><path d="M30 96C10 110 8 140 22 158C34 146 40 150 46 160C54 146 62 150 70 162C76 150 84 150 90 162C98 150 106 146 114 160C120 150 126 146 138 158C152 140 150 110 130 96Z" fill="url(#{p}au)" opacity=".9"/>'
              + ''.join(star(x, y, r, '#fff') for x, y, r in ((30, 130, 3), (52, 148, 2.4), (110, 150, 2.6), (132, 128, 3), (80, 156, 2))) + '</g>')
    # ---- cape (adult)
    if stage == 'adult':
        o += ('<g class="cape" style="transform-origin:80px 112px"><path d="M54 112Q80 120 106 112L114 152Q80 160 46 152Z" fill="#2E327E"/><path d="M46 152Q80 160 114 152L113 146Q80 154 47 146Z" fill="#FFD34D"/>'
              + star(60, 134, 3, '#FFE27A') + star(98, 140, 2.4, '#FFF3B8') + '</g>')
    # ---- tail
    ts = {'baby': .9, 'teen': 1.05, 'adult': 1.2, 'legend': 1.55}[stage]
    tail = (f'<path d="M98 136C126 140 146 120 141 94C138 78 124 72 117 84C128 102 120 122 96 126Z" fill="url(#{p}{"gx" if lg else "tl"})"/>'
            f'<path d="M117 84C124 72 138 78 141 94C136 98 132 92 128 96C126 90 120 92 117 84Z" fill="{"#FFF3B8" if lg else Cr}"/>'
            f'<path d="M126 114q8 -6 8 -14M118 122q8 -4 12 -10" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none" stroke-linecap="round"/>')
    if lg:
        tail += ''.join(star(x, y, r, '#FFF6CF') for x, y, r in ((128, 112, 2.6), (134, 98, 2), (118, 124, 2), (124, 102, 1.6)))
    o += f'<g class="wag" style="transform-origin:100px 134px"><g transform="translate(100 134) scale({ts}) translate(-100 -134)">{tail}</g></g>'
    o += feet(Cr, '#FFB3C2')
    ab, af = arms(pose, S, Cr)
    o += ab
    # ---- body + chest ruff
    o += (f'<ellipse cx="80" cy="124" rx="27" ry="23" fill="url(#{p}bd)"/><g clip-path="url(#{p}bc)"><ellipse cx="80" cy="104" rx="30" ry="9" fill="{S2}" opacity=".7"/>'
          f'<path d="M80 150C64 150 62 130 66 120C68 126 70 124 72 118C74 124 76 122 80 116C84 122 86 124 88 118C90 124 92 126 94 120C98 130 96 150 80 150Z" fill="{Cr}"/></g>')
    ruff = (f'<path d="M54 108L60 120L64 112L70 124L74 114L80 126L86 114L90 124L96 112L100 120L106 108Q80 118 54 108Z" fill="{Cr}"/>')
    o += ruff
    if NECK["on"] and stage == 'teen':
        o += '<path d="M55 113Q80 126 105 113L104 121Q80 134 56 121Z" fill="#3F6FE0"/><path d="M62 120l-8 13l10 -2Z" fill="#3F6FE0"/>' + star(92, 122, 4.6, '#FFD34D')
    if NECK["on"] and stage == 'adult':
        o += '<path d="M58 114Q80 126 102 114" stroke="#FFD34D" stroke-width="2.4" fill="none"/><circle cx="80" cy="124" r="6" fill="#26296A"/><path d="M83 119A5 5 0 1 0 83 129A4 4 0 1 1 83 119Z" fill="#FFD34D"/>'
    # ---- ears
    for sx in (-1, 1):
        o += (f'<g transform="translate(80 0) scale({sx} 1) translate(-80 0)">'
              f'<path d="M38 54C32 34 32 14 40 4C54 10 66 26 72 38Z" fill="{M}"/>'
              f'<path d="M43 46C39 32 40 20 44 13C53 19 60 28 63 36Z" fill="#FFC9D2"/>'
              f'<path d="M45 42q2 -8 1 -14M50 42q3 -6 4 -12" stroke="{Cr}" stroke-width="2" fill="none" stroke-linecap="round"/></g>')
        if lg:
            o += star(80 + sx * 40, 4, 5, '#FFF3B8')
    # ---- cheek tufts
    o += (f'<path d="M34 78L18 86L31 90L20 99L35 99L28 108L44 101Z" fill="{S}"/><path d="M126 78L142 86L129 90L140 99L125 99L132 108L116 101Z" fill="{S}"/>'
          f'<path d="M36 80L24 86L34 89" fill="{Cr}" opacity=".9"/><path d="M124 80L136 86L126 89" fill="{Cr}" opacity=".9"/>')
    # ---- head + husky mask
    o += (f'<ellipse cx="80" cy="73" rx="51" ry="43" fill="url(#{p}hd)"/>'
          f'<g clip-path="url(#{p}hc)"><path d="M20 30H140V70C128 66 116 64 106 70C100 64 94 60 90 64C86 70 84 76 80 80C76 76 74 70 70 64C66 60 60 64 54 70C44 64 32 66 20 70Z" fill="{M}" opacity=".85"/>'
          f'<ellipse cx="60" cy="64" rx="6" ry="4" fill="{Cr}"/><ellipse cx="100" cy="64" rx="6" ry="4" fill="{Cr}"/></g>'
          + rim('#fff', .4) +
          f'<path d="M38 86C44 112 116 112 122 86C110 96 94 92 80 102C66 92 50 96 38 86Z" fill="{Cr}"/>'
          + ''.join(fur(x, 46, '#fff', .3) for x in (52, 98)))
    # moon mark
    if lg:
        o += '<circle cx="80" cy="46" r="8.5" fill="#FFF3B8"/><circle cx="80" cy="46" r="5.5" fill="#FFE07A"/><circle cx="78" cy="44" r="1.6" fill="#fff"/>'
    else:
        o += '<path d="M84 38A9 9 0 1 0 84 56A7 7 0 1 1 84 38Z" fill="#FFD34D"/>'
    nose = f'<ellipse cx="80" cy="94" rx="5.2" ry="3.8" fill="{EYE}"/><ellipse cx="78.4" cy="92.8" rx="1.6" ry="1" fill="#fff" opacity=".8"/>'
    o += face(p, pose, '#5B6BC8', nose, 80, 99)
    if lg:
        o += '<path d="M56 114Q80 126 104 114" stroke="#FFD34D" stroke-width="4" fill="none" stroke-linecap="round"/>' + star(80, 123, 7.5, '#9FF6FF')
    o += af
    if lg and pose == 'idle':
        o += sparkle_eyes(80, 22, '#BFF4FF')
    return defs, o

# ======================= BI =======================
def bi(stage, pose, p):
    lg = stage == 'legend'
    T, T2, T3 = ('#8FEAD6', '#52C2AC', '#DDFFF6') if lg else ('#7FD6C6', '#56B6A6', '#BDF2E6')
    C = '#F2FFFB'
    defs = (common_defs(p) + grad(p, 'hd', T3, T, T2) + grad(p, 'bd', T3, T, T2, .4, .25)
            + f'<clipPath id="{p}bc"><ellipse cx="80" cy="124" rx="27" ry="23"/></clipPath>'
            + lin(p, 'lf', [(0, '#8EE38F'), (1, '#3FA35A')])
            + lin(p, 'lg', [(0, '#FFF4B8'), (.5, '#9BF0A8'), (1, '#3FBF8A')]))
    def leaf(x, y, rot, s, fill=None, vein='#2F8A4E'):
        f = fill or f'url(#{p}lf)'
        return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><path d="M0 0C-12 -14 -12 -36 0 -50C12 -36 12 -14 0 0Z" fill="{f}"/>'
                f'<path d="M0 -3V-44M0 -14l-6 -6M0 -24l6 -6M0 -32l-5 -5M0 -18l5 -5" stroke="{vein}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/></g>')
    def flower(x, y, s, c='#FF9EC0', cc='#FFC93C'):
        g = f'<g transform="translate({x} {y}) scale({s})">'
        for i in range(5):
            g += f'<ellipse cx="0" cy="-6" rx="4.4" ry="6.2" fill="{c}" transform="rotate({i*72})"/>'
        return g + f'<circle r="3.4" fill="{cc}"/><circle cx="-1" cy="-1" r="1" fill="#fff"/></g>'
    o = ''
    # ---- wings
    if stage == 'teen':
        o += f'<g class="flL" style="transform-origin:58px 112px">{leaf(58,112,-62,.72)}</g><g class="flR" style="transform-origin:102px 112px">{leaf(102,112,62,.72)}</g>'
    if stage == 'adult':
        o += (f'<g class="flL" style="transform-origin:58px 112px">{leaf(58,114,-96,.8)}{leaf(58,112,-60,1.05)}{leaf(58,110,-28,.7)}</g>'
              f'<g class="flR" style="transform-origin:102px 112px">{leaf(102,114,96,.8)}{leaf(102,112,60,1.05)}{leaf(102,110,28,.7)}</g>')
    if lg:
        wl = ''.join(leaf(58, 112, a, s, f'url(#{p}lg)', '#FFF6C9') for a, s in ((-118, 1.2), (-92, 1.6), (-64, 1.85), (-36, 1.4), (-12, 1)))
        wr = ''.join(leaf(102, 112, -a, s, f'url(#{p}lg)', '#FFF6C9') for a, s in ((-118, 1.2), (-92, 1.6), (-64, 1.85), (-36, 1.4), (-12, 1)))
        o += f'<g class="flL" style="transform-origin:58px 112px">{wl}</g><g class="flR" style="transform-origin:102px 112px">{wr}</g>'
        # flowing petal cape
        o += ('<g class="cape" style="transform-origin:80px 112px"><path d="M54 112Q80 122 106 112L122 156Q100 150 80 160Q60 150 38 156Z" fill="#FFD7E6"/>'
              '<path d="M60 128Q80 136 100 128M52 146Q66 140 80 150Q94 140 108 146" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/></g>')
    # ---- tiny leaf tail
    o += leaf(100, 140, 70, .4)
    o += feet(T2)
    ab, af = arms(pose, T, T2)
    o += ab
    # ---- body
    o += (f'<ellipse cx="80" cy="124" rx="27" ry="23" fill="url(#{p}bd)"/><g clip-path="url(#{p}bc)"><ellipse cx="80" cy="104" rx="30" ry="9" fill="{T2}" opacity=".6"/>'
          f'<ellipse cx="80" cy="133" rx="16" ry="13" fill="{C}"/></g>')
    # clover belly mark
    o += ''.join(f'<circle cx="{80+dx}" cy="{132+dy}" r="2.6" fill="#7FD98C"/>' for dx, dy in ((-2.4, -1), (2.4, -1), (0, 2.2))) + '<path d="M80 133q1 4 3 6" stroke="#4FB565" stroke-width="1.2" fill="none"/>'
    if NECK["on"] and stage in ('teen', 'adult'):
        o += ('<path d="M55 113Q80 126 105 113L104 121Q80 134 56 121Z" fill="#3F6FE0"/><path d="M96 120l9 10l4 -11Z" fill="#3F6FE0"/>'
              '<path d="M60 117q20 8 40 0" stroke="#9DB8FF" stroke-width="1.6" fill="none" stroke-dasharray="2 3"/>')
    # ---- ears (round, leaf inside)
    for sx in (-1, 1):
        cx = 80 + sx * 38
        o += f'<circle cx="{cx}" cy="44" r="13.5" fill="url(#{p}hd)"/><circle cx="{cx}" cy="45" r="7.5" fill="#FFC2D2"/>'
    # ---- head
    o += (f'<ellipse cx="80" cy="73" rx="51" ry="43" fill="url(#{p}hd)"/>' + rim('#fff', .55)
          + f'<ellipse cx="80" cy="99" rx="28" ry="15" fill="{C}"/>'
          f'<circle cx="104" cy="52" r="2.4" fill="{T2}"/><circle cx="111" cy="58" r="1.8" fill="{T2}"/><circle cx="99" cy="58" r="1.4" fill="{T2}"/><circle cx="56" cy="56" r="1.6" fill="{T2}"/>')
    # ---- sprout per stage
    if stage == 'baby':
        o += '<path d="M80 34V22" stroke="#3E9C5C" stroke-width="3.4" stroke-linecap="round"/>' + leaf(80, 26, -55, .36) + leaf(80, 26, 55, .36)
    elif stage == 'teen':
        o += '<path d="M80 34C80 26 80 18 81 10" stroke="#3E9C5C" stroke-width="3.6" fill="none" stroke-linecap="round"/>' + leaf(80, 28, -58, .44) + leaf(81, 28, 58, .44) + leaf(81, 14, 0, .3)
    elif stage == 'adult':
        o += ('<path d="M80 34C80 26 80 18 81 10" stroke="#3E9C5C" stroke-width="3.6" fill="none" stroke-linecap="round"/>' + leaf(80, 28, -58, .48) + leaf(81, 28, 58, .48)
              + flower(81, 6, 1.1) + flower(114, 40, .55, '#FFF3B8', '#FF9EC0'))
    if lg:
        # crown of blossoming twigs (antler-like)
        for sx in (-1, 1):
            o += (f'<g transform="translate(80 0) scale({sx} 1) translate(-80 0)"><path d="M62 34C56 22 52 12 44 2M52 16C46 14 40 10 36 4M56 24C50 26 42 26 36 22" stroke="#8A5A3C" stroke-width="3.6" fill="none" stroke-linecap="round"/>'
                  + flower(44, 2, .8) + flower(36, 4, .6, '#FFF3B8', '#FF9EC0') + flower(36, 22, .7) + leaf(50, 12, -40, .26) + '</g>')
        o += flower(80, 24, 1.3, '#FFD34D', '#FF7FAE')
        # glowing vine markings
        o += '<path d="M44 66q8 4 10 12M116 66q-8 4 -10 12" stroke="#FFF6C9" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="44" cy="66" r="2" fill="#FFF6C9"/><circle cx="116" cy="66" r="2" fill="#FFF6C9"/>'
        o += star(80, 125, 8, '#FFD34D')
    o += face(p, pose, '#2F8C7E', '', 82, 98)
    o += af
    if lg and pose == 'idle':
        o += sparkle_eyes(82)
    return defs, o

CHARS['draco'] = draco
CHARS['lupo'] = lupo
CHARS['bi'] = bi
