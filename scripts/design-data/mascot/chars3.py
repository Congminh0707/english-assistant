# Mascot v3.1: richer Kitsu and Robo with mythic legend forms.
from gen import common_defs, EYE, eyes, blush, mouth
from chars import grad, arms, feet, face, star, sparkle_eyes, CHARS, FACE, MOUTH, NECK
from chars2 import lin, rim, fur

# ======================= KITSU =======================
def kitsu(stage, pose, p):
    lg = stage == 'legend'
    if lg:   # celestial white fox with gold markings
        O, O2, O3 = '#FFF6EC', '#F1D9BE', '#FFFFFF'
        W = '#FFFFFF'; D = '#E8A23A'
    else:
        O, O2, O3 = '#F59A45', '#DD7A28', '#FFC88A'
        W = '#FFF6EA'; D = '#6B3826'
    defs = (common_defs(p) + grad(p, 'hd', O3, O, O2) + grad(p, 'bd', O3, O, O2, .4, .25)
            + f'<clipPath id="{p}bc"><ellipse cx="80" cy="124" rx="27" ry="23"/></clipPath><clipPath id="{p}eL"><path d="M38 58Q26 22 34 6Q56 14 70 40Z"/></clipPath><clipPath id="{p}eR"><path d="M122 58Q134 22 126 6Q104 14 90 40Z"/></clipPath>'
            + lin(p, 'tl', [(0, '#FFE9B8'), (.5, '#FFC25C'), (1, '#F29A2E')] if lg else [(0, '#FFB766'), (1, '#E07F2C')]))
    def tail(rot, s):
        t = (f'<g transform="translate(82 134) rotate({rot}) scale({s})">'
             f'<path d="M0 0C-18 -10 -26 -40 -14 -66C-6 -82 14 -82 18 -66C24 -42 16 -14 0 0Z" fill="url(#{p}tl)" stroke="{"#E89A3A" if lg else "none"}" stroke-opacity=".5" stroke-width="1.6"/>'
             f'<path d="M-14 -66C-6 -82 14 -82 18 -66C14 -60 10 -62 8 -56C4 -62 0 -58 -4 -60C-8 -56 -10 -62 -14 -66Z" fill="{"#BDEBFF" if lg else W}"/>'
             f'<path d="M-6 -18q4 -6 2 -14M6 -28q3 -6 0 -12M-2 -40q3 -5 1 -10" stroke="{O2 if not lg else "#E8C27E"}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>')
        if lg:
            t += '<g transform="translate(2 -84)"><path class="fire" d="M0 -12C6 -4 8 2 0 8C-8 2 -6 -4 0 -12Z" fill="#7FD3FF"/><path d="M0 -3C3 0 3 3 0 5C-3 3 -3 0 0 -3Z" fill="#fff"/></g>'
        return t + '</g>'
    rots = {'baby': [52], 'teen': [-48, 40, 64], 'adult': [-70, -46, 22, 46, 70], 'legend': [-84, -63, -42, -21, 0, 21, 42, 63, 84]}[stage]
    s = 1.38 if lg else 1.08
    back = ''.join(tail(r, s) for r in rots)
    o = f'<g class="{"fan" if lg else "wag"}" style="transform-origin:82px 134px">{back}</g>'
    o += feet(D)
    ab, af = arms(pose, O, D)
    o += ab
    # body + chest ruff
    o += (f'<ellipse cx="80" cy="124" rx="27" ry="23" fill="url(#{p}bd)"/><g clip-path="url(#{p}bc)"><ellipse cx="80" cy="104" rx="30" ry="9" fill="{O2}" opacity=".6"/>'
          f'<path d="M64 108L69 116L64 121L71 126L67 134L76 135L80 144L84 135L93 134L89 126L96 121L91 116L96 108Z" fill="{W}"/></g>'
          + fur(58, 132, O2, .5) + fur(98, 132, O2, .5))
    # stage accessories
    if NECK["on"] and stage == 'teen':
        o += ('<path d="M56 112Q80 124 104 112" stroke="#D93B3B" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
              '<circle cx="80" cy="121" r="6" fill="#FFC93C"/><path d="M75.5 121.5h9" stroke="#B8860B" stroke-width="1.4"/><circle cx="80" cy="124" r="1.2" fill="#8A5A12"/><circle cx="78" cy="119" r="1.6" fill="#fff" opacity=".8"/>')
    if NECK["on"] and stage == 'adult':
        # shimenawa rope with paper streamers
        o += ('<path d="M54 112Q80 126 106 112" stroke="#E8C88A" stroke-width="6.5" fill="none" stroke-linecap="round"/>'
              '<path d="M58 113l4 2M66 117l4 1.6M74 119l4 .8M82 119l4 -.6M90 118l4 -1.4M98 115l4 -2" stroke="#B88E4A" stroke-width="1.6" stroke-linecap="round"/>'
              '<path d="M66 118l2 6l-4 2l2 6M94 118l-2 6l4 2l-2 6" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linejoin="round"/>'
              '<circle cx="80" cy="122" r="5.5" fill="#D93B3B"/><circle cx="78.6" cy="120.6" r="1.6" fill="#fff" opacity=".7"/>')
    if lg:
        o += ('<path d="M54 112Q80 126 106 112" stroke="#E8A23A" stroke-width="5" fill="none" stroke-linecap="round"/>'
              '<path d="M60 116l-3 14l5 -2l1 8M100 116l3 14l-5 -2l-1 8" stroke="#D93B3B" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
              + star(80, 123, 8, '#7FD3FF'))
    # ears
    o += (f'<path d="M38 58Q26 22 34 6Q56 14 70 40Z" fill="url(#{p}hd)"/><path d="M122 58Q134 22 126 6Q104 14 90 40Z" fill="url(#{p}hd)"/>'
          f'<g clip-path="url(#{p}eL)"><path d="M20 0L46 0L40 22Q32 20 24 26Z" fill="{D}"/></g><g clip-path="url(#{p}eR)"><path d="M140 0L114 0L120 22Q128 20 136 26Z" fill="{D}"/></g>'
          f'<path d="M43 50Q36 30 40 20Q52 26 62 40Z" fill="#FFC9B5"/><path d="M117 50Q124 30 120 20Q108 26 98 40Z" fill="#FFC9B5"/>'
          f'<path d="M44 46q4 -6 3 -12M48 46q4 -4 5 -10M52 44q3 -3 5 -8M116 46q-4 -6 -3 -12M112 46q-4 -4 -5 -10M108 44q-3 -3 -5 -8" stroke="{W}" stroke-width="2.2" fill="none" stroke-linecap="round"/>')
    if lg:  # gold tassel ear ornaments
        o += ''.join(f'<circle cx="{x}" cy="42" r="3.4" fill="#FFD34D"/><path d="M{x} 45v10" stroke="#D93B3B" stroke-width="2.4" stroke-linecap="round"/><circle cx="{x}" cy="57" r="2.2" fill="#FFD34D"/>' for x in (36, 124))
    # cheek tufts
    o += (f'<path d="M34 80L20 86L31 90L22 98L35 98L30 106L44 100Z" fill="{O}"/><path d="M126 80L140 86L129 90L138 98L125 98L130 106L116 100Z" fill="{O}"/>'
          f'<path d="M34 84L24 88L32 91Z" fill="{W}"/><path d="M126 84L136 88L128 91Z" fill="{W}"/>')
    # head
    o += (f'<ellipse cx="80" cy="72" rx="51" ry="43" fill="url(#{p}hd)"/>' + rim('#fff', .45)
          + f'<path d="M30 80C32 106 54 116 80 116C106 116 128 106 130 80C120 92 104 94 92 88C88 96 84 100 80 100C76 100 72 96 68 88C56 94 40 92 30 80Z" fill="{W}"/>'
          + f'<path d="M72 36q8 -6 16 0q-4 6 -8 10q-4 -4 -8 -10Z" fill="{O2}" opacity=".55"/>' + fur(54, 48, '#fff', .35) + fur(100, 48, '#fff', .35))
    if stage == 'baby':
        # classic transformation leaf on head
        o += '<g transform="translate(80 30) rotate(-18)"><path d="M0 4C-10 -4 -10 -18 0 -26C10 -18 10 -4 0 4Z" fill="#6ED27F"/><path d="M0 4V-22M0 -8l-4 -4M0 -14l4 -4" stroke="#3E9C5C" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>'
    if lg:
        o += ('<path d="M80 34C86 42 86 50 80 56C74 50 74 42 80 34Z" fill="#D93B3B"/><path d="M80 40C83 44 83 48 80 51C77 48 77 44 80 40Z" fill="#FFD34D"/>'
              '<path d="M47 76q8 -4 14 -2M113 76q-8 -4 -14 -2" stroke="#D93B3B" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
              '<path d="M44 90q6 2 10 -2M116 90q-6 2 -10 -2" stroke="#D93B3B" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>')
    else:
        o += '<circle cx="74" cy="55" r="2.6" fill="#E2483E"/><circle cx="86" cy="55" r="2.6" fill="#E2483E"/>'
    nose = f'<path d="M76 89.5q4 -2 8 0q-1 3.5 -4 4q-3 -.5 -4 -4Z" fill="{EYE}"/><circle cx="78.4" cy="90" r=".9" fill="#fff" opacity=".8"/>'
    o += face(p, pose, '#5BB8E8' if lg else '#B0672E', nose)
    o += af
    if lg and pose == 'idle':
        o += sparkle_eyes(80, 22, '#BFF4FF')
    return defs, o

# ======================= ROBO =======================
def robo(stage, pose, p):
    lg = stage == 'legend'
    M, M2, M3 = ('#F2F6FD', '#C9D6EC', '#FFFFFF') if lg else ('#A9BEDD', '#8299BD', '#DCE7F7')
    acc = '#FFC93C' if lg else '#FF8A4C'
    cy = '#9FF6FF' if lg else '#5CE1E6'
    defs = (common_defs(p) + grad(p, 'hd', M3, M, M2) + grad(p, 'bd', M3, M, M2, .4, .25)
            + lin(p, 'hx', [(0, '#9FF6FF'), (.5, '#8E9BFF'), (1, '#D78CFF')], 1, 0)
            + lin(p, 'vs', [(0, '#33416A'), (1, '#1A2240')]))
    o = ''
    # ---- back pieces
    def fin(s, rot=0, c=None):
        f = '<path d="M0 0C-14 -12 -26 -28 -28 -46C-16 -38 -4 -28 4 -14Z" fill="%s"/><path d="M-4 -6C-12 -14 -18 -24 -20 -34" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>' % (c or acc)
        return f'<g transform="translate(52 108) rotate({rot}) scale({s})">{f}</g><g transform="translate(108 108) rotate({-rot}) scale({-s} {s})">{f}</g>'
    if stage == 'teen':
        o += fin(1)
    if stage == 'adult':
        # jetpack + fins
        o += fin(1.3) + ''.join(f'<rect x="{x}" y="104" width="14" height="30" rx="7" fill="{M2}"/><rect x="{x+2}" y="128" width="10" height="6" rx="2" fill="#5B6B8C"/>' for x in (44, 102))
    if lg:
        # hexagon energy wings
        def hexw(sx):
            g = f'<g transform="translate({80 + sx*24} 108) scale({sx*1.45} 1.45)">'
            for i, (x, y, r) in enumerate(((-30, -30, 14), (-54, -42, 13), (-50, -14, 12), (-76, -30, 11), (-72, -2, 10), (-26, -4, 12))):
                pts = ' '.join('%.1f,%.1f' % (x + r * __import__('math').cos(a / 3 * 3.14159), y + r * __import__('math').sin(a / 3 * 3.14159)) for a in range(6))
                g += f'<polygon points="{pts}" fill="url(#{p}hx)" opacity="{1 - i*.05:.2f}"/><polygon points="{pts}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/>'
            return g + '</g>'
        o += f'<g class="wgL" style="transform-origin:56px 108px">{hexw(-1)}</g><g class="wgR" style="transform-origin:104px 108px">{hexw(1)}</g>'
        # jets
        o += ''.join(f'<g transform="translate({x} 154)"><path class="jet" d="M-8 0C-8 14 -3 24 0 30C3 24 8 14 8 0Z" fill="#7FE9FF"/><path d="M-3 0C-3 8 -1 12 0 16C1 12 3 8 3 0Z" fill="#fff"/></g>' for x in (66, 94))
    # ---- feet
    o += ''.join(f'<rect x="{x-12}" y="139" width="24" height="13" rx="6.5" fill="{M2}"/><rect x="{x-9}" y="148" width="18" height="3" rx="1.5" fill="#000" opacity=".15"/><circle cx="{x}" cy="144" r="1.6" fill="#000" opacity=".2"/>' for x in (66, 94))
    ab, af = arms(pose, M, '#FFE27A' if lg else M2)
    o += ab
    # ---- body
    o += (f'<rect x="53" y="102" width="54" height="44" rx="20" fill="url(#{p}bd)"/><rect x="53" y="102" width="54" height="9" fill="{M2}" opacity=".7"/>'
          f'<rect x="65" y="116" width="30" height="22" rx="8" fill="url(#{p}vs)"/>'
          '<path d="M60 112v28M100 112v28" stroke="#000" stroke-opacity=".1" stroke-width="1.4"/>'
          '<circle cx="59" cy="132" r="1.6" fill="#000" opacity=".2"/><circle cx="101" cy="132" r="1.6" fill="#000" opacity=".2"/>')
    if stage in ('adult', 'legend'):
        o += f'<path class="led" d="M80 124c-6 -7 -13 -2 -9.5 3.5l9.5 7l9.5 -7c3.5 -5.5 -3.5 -10.5 -9.5 -3.5Z" fill="#FF6F8E"/>'
    elif stage == 'teen':
        o += f'<path d="M69 128h5l3 -6l4 10l3 -4h7" stroke="{cy}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    else:
        o += f'<circle class="led" cx="80" cy="127" r="5" fill="{cy}"/>'
    if stage != 'baby':
        o += f'<rect x="44" y="104" width="20" height="12" rx="6" fill="{acc}"/><rect x="96" y="104" width="20" height="12" rx="6" fill="{acc}"/><path d="M48 108h12M100 108h12" stroke="#fff" stroke-opacity=".4" stroke-width="1.6" stroke-linecap="round"/>'
    # ---- antenna / topper
    if stage == 'baby':
        o += (f'<path d="M80 34V20" stroke="{M2}" stroke-width="3.4" stroke-linecap="round"/><circle cx="80" cy="19" r="3.4" fill="{acc}"/>'
              f'<g class="spin" style="transform-origin:80px 16px"><path d="M80 16C70 12 62 14 60 17C62 20 70 20 80 16C90 12 98 14 100 17C98 20 90 20 80 16Z" fill="{acc}"/></g>')
    elif lg:
        # mecha V-fin crown + gear halo
        o += ('<path d="M80 36L54 6L62 4L80 26L98 4L106 6Z" fill="#FFC93C"/><path d="M80 36L58 8M80 36L102 8" stroke="#FFF3B0" stroke-width="1.6"/>'
              '<rect x="74" y="26" width="12" height="12" rx="3" fill="#E8604C" transform="rotate(45 80 32)"/><circle cx="80" cy="32" r="2.2" fill="#fff"/>')
    else:
        o += (f'<g class="ant" style="transform-origin:80px 34px"><path d="M80 34V15" stroke="{M2}" stroke-width="3.4" stroke-linecap="round"/>'
              f'<circle cx="80" cy="12" r="7" fill="{acc}"/><circle cx="77.5" cy="9.5" r="2.2" fill="#fff" opacity=".9"/></g>')
    # ---- ear pieces
    if stage == 'adult':
        o += f'<rect x="18" y="62" width="16" height="28" rx="8" fill="{acc}"/><rect x="126" y="62" width="16" height="28" rx="8" fill="{acc}"/><path d="M26 62C26 48 32 40 40 36" stroke="{M2}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="40" cy="36" r="3" fill="{cy}"/>'
    else:
        o += f'<circle cx="28" cy="76" r="9" fill="{acc}"/><circle cx="28" cy="76" r="3.5" fill="#000" opacity=".15"/><circle cx="132" cy="76" r="9" fill="{acc}"/><circle cx="132" cy="76" r="3.5" fill="#000" opacity=".15"/>'
    # ---- head
    o += (f'<rect x="28" y="31" width="104" height="86" rx="38" fill="url(#{p}hd)"/>'
          f'<ellipse cx="60" cy="42" rx="14" ry="5.5" fill="#fff" opacity=".55" transform="rotate(-12 60 42)"/>'
          '<path d="M34 104Q80 120 126 104" stroke="#000" stroke-opacity=".08" stroke-width="2" fill="none"/>'
          f'<rect x="38" y="54" width="84" height="48" rx="24" fill="url(#{p}vs)"/><path d="M48 60q10 -4 22 -3" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none" stroke-linecap="round"/>'
          '<circle cx="40" cy="44" r="1.8" fill="#000" opacity=".2"/><circle cx="120" cy="44" r="1.8" fill="#000" opacity=".2"/><circle cx="34" cy="96" r="1.6" fill="#000" opacity=".18"/><circle cx="126" cy="96" r="1.6" fill="#000" opacity=".18"/>')
    if lg:
        o += '<path d="M38 78H30M122 78H130" stroke="#FFC93C" stroke-width="3" stroke-linecap="round"/><path d="M44 32Q80 22 116 32" stroke="#FFC93C" stroke-width="3" fill="none" stroke-linecap="round"/>'
    ek = FACE.get(pose, 'open')
    if ek == 'happy':
        o += ''.join(f'<path d="M{x-8} 80q8 -10 16 0" stroke="{cy}" stroke-width="4.4" fill="none" stroke-linecap="round"/>' for x in (60, 100))
    elif ek == 'closed':
        o += ''.join(f'<path d="M{x-8} 78q8 6 16 0" stroke="{cy}" stroke-width="4" fill="none" stroke-linecap="round"/>' for x in (60, 100))
    else:
        o += ''.join(f'<ellipse cx="{x}" cy="78" rx="8.5" ry="11" fill="{cy}"/><ellipse cx="{x}" cy="84" rx="7" ry="4.5" fill="#2FB8D0"/><circle cx="{x-3}" cy="73" r="3.4" fill="#fff"/><circle cx="{x+3}" cy="82" r="1.6" fill="#fff"/>' for x in (60, 100))
    mk = MOUTH.get(pose, 'w')
    o += (f'<path d="M74 93q3 3 6 0q3 3 6 0" stroke="{cy}" stroke-width="2.3" fill="none" stroke-linecap="round"/>' if mk == 'w'
          else f'<rect x="74" y="91" width="12" height="7" rx="3.5" fill="{cy}"/>')
    o += f'<g filter="url(#{p}blur)" opacity=".8"><ellipse cx="46" cy="104" rx="7" ry="4" fill="#FF8FA8"/><ellipse cx="114" cy="104" rx="7" ry="4" fill="#FF8FA8"/></g>'
    o += af
    if lg and pose == 'idle':
        o += star(57, 73, 4.6, '#FFE27A') + star(97, 73, 4.6, '#FFE27A')
    return defs, o

CHARS['kitsu'] = kitsu
CHARS['robo'] = robo
