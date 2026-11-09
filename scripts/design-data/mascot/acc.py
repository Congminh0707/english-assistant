# Shop accessories drawn per character (adult figure coordinates, before stage scale).
from chars import star

# anchors: head top, eye line, eye spread, neck line, side-of-head item x offset
ANCHOR = {
    'bi':    dict(top=33, ey=82, dx=22, neck=114, side=32, cupx=26),
    'kitsu': dict(top=30, ey=80, dx=23, neck=113, side=30, cupx=24),
    'draco': dict(top=31, ey=80, dx=24, neck=113, side=33, cupx=24),
    'robo':  dict(top=31, ey=78, dx=20, neck=117, side=34, cupx=22),
    'lupo':  dict(top=31, ey=82, dx=22, neck=113, side=30, cupx=24),
}

ACC = [  # id, vi name, slot, price, min level
    ('bow', 'Nơ hồng', 'head', 30, 0), ('flower', 'Hoa cài đầu', 'head', 40, 0), ('party-hat', 'Nón tiệc', 'head', 70, 0),
    ('cap', 'Mũ lưỡi trai', 'head', 60, 2), ('cat-ears', 'Bờm tai mèo', 'head', 90, 2), ('hat', 'Mũ chóp', 'head', 120, 5),
    ('headphones', 'Tai nghe', 'head', 150, 5), ('witch-hat', 'Mũ phù thuỷ', 'head', 160, 6), ('crown', 'Vương miện', 'head', 300, 10),
    ('halo', 'Vầng hào quang', 'head', 350, 12),
    ('glasses', 'Kính tròn', 'face', 60, 0), ('sunglasses', 'Kính râm', 'face', 90, 3), ('eyepatch', 'Bịt mắt cướp biển', 'face', 100, 4),
    ('mask', 'Mặt nạ hiệp sĩ', 'face', 130, 6),
    ('scarf', 'Khăn len', 'neck', 80, 0), ('bowtie', 'Nơ cổ', 'neck', 70, 0), ('medal', 'Huy chương', 'neck', 220, 10),
    ('backpack', 'Ba lô', 'back', 180, 3), ('cape', 'Áo choàng', 'back', 200, 8), ('wings', 'Đôi cánh', 'back', 450, 15),
]
SLOT = {a[0]: a[2] for a in ACC}
NAME = {a[0]: a[1] for a in ACC}

def _d(p):
    return (f'<linearGradient id="{p}gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0A8"/><stop offset=".5" stop-color="#FFC93C"/><stop offset="1" stop-color="#E09A1E"/></linearGradient>'
            f'<radialGradient id="{p}shine" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>')

def draw(acc, ch, p):
    """returns (defs, behind, front) svg strings"""
    a = ANCHOR[ch]; T, E, D, N, S = a['top'], a['ey'], a['dx'], a['neck'], a['side']
    d = _d(p); B = ''; F = ''
    if acc == 'bow':
        x, y = 80 + S, T + 10
        F = (f'<g transform="translate({x} {y}) rotate(18)"><path d="M0 0C-6 -12 -22 -14 -20 0C-22 14 -6 12 0 0Z" fill="#FF7FAE"/><path d="M0 0C6 -12 22 -14 20 0C22 14 6 12 0 0Z" fill="#FF7FAE"/>'
             '<path d="M-4 0l-8 16l6 -2l2 6Z M4 0l8 16l-6 -2l-2 6Z" fill="#F0558F"/><path d="M-15 -4q4 -5 9 -3M15 -4q-4 -5 -9 -3" stroke="#FFC2D9" stroke-width="2" fill="none" stroke-linecap="round"/>'
             '<ellipse cx="0" cy="0" rx="5" ry="5.5" fill="#F0558F"/><circle cx="-1.5" cy="-1.5" r="1.6" fill="#fff" opacity=".7"/></g>')
    elif acc == 'flower':
        x, y = 80 - S, T + 10
        pet = ''.join(f'<ellipse cx="0" cy="-7" rx="5.4" ry="7.6" fill="#FF9EC0" transform="rotate({i*72})"/>' for i in range(5))
        F = (f'<g transform="translate({x} {y}) rotate(-14)"><path d="M4 6C14 6 20 12 22 18C14 18 8 14 4 6Z" fill="#5BC46E"/><path d="M-4 6C-12 10 -16 16 -16 22C-10 20 -6 14 -4 6Z" fill="#4FB565"/>'
             f'{pet}<circle r="4.4" fill="#FFC93C"/><circle cx="-1.4" cy="-1.4" r="1.4" fill="#fff"/></g>')
    elif acc == 'party-hat':
        F = (f'<defs><clipPath id="{p}ph"><path d="M64 {T+4}L84 {T-36}L100 {T+4}Z"/></clipPath></defs><g transform="rotate(12 82 {T})">'
             f'<path d="M64 {T+4}L84 {T-36}L100 {T+4}Z" fill="#6E8BFF"/><g clip-path="url(#{p}ph)"><path d="M60 {T-6}L104 {T-20}M60 {T+6}L104 {T-8}M60 {T-18}L104 {T-32}" stroke="#FFD34D" stroke-width="5"/></g>'
             f'<ellipse cx="82" cy="{T+4}" rx="19" ry="4" fill="#FF7FAE"/><circle cx="84" cy="{T-38}" r="6" fill="#FF7FAE"/><circle cx="82" cy="{T-40}" r="2" fill="#fff" opacity=".7"/></g>')
    elif acc == 'cap':
        F = (f'<path d="M48 {T+18}C48 {T-12} 112 {T-12} 112 {T+18}Z" fill="#E8504A"/><path d="M80 {T-5}V{T+18}" stroke="#C23A35" stroke-width="2"/>'
             f'<path d="M48 {T+18}C60 {T+30} 100 {T+30} 112 {T+18}C100 {T+22} 60 {T+22} 48 {T+18}Z" fill="#B8322E"/>'
             f'<rect x="70" y="{T+4}" width="20" height="10" rx="4" fill="#fff"/><path d="M76 {T+9}h8" stroke="#E8504A" stroke-width="2.4" stroke-linecap="round"/>'
             f'<circle cx="80" cy="{T-6}" r="3" fill="#B8322E"/><ellipse cx="62" cy="{T+2}" rx="7" ry="4" fill="#fff" opacity=".3" transform="rotate(-24 62 {T+2})"/>')
    elif acc == 'cat-ears':
        F = (f'<path d="M42 {T+18}Q80 {T-8} 118 {T+18}" stroke="#3A3045" stroke-width="5" fill="none" stroke-linecap="round"/>'
             + ''.join(f'<path d="M{x-10} {T+4}L{x+sg*2} {T-18}L{x+10} {T+2}Z" fill="#3A3045"/><path d="M{x-5} {T+2}L{x+sg*1.4} {T-10}L{x+5} {T+1}Z" fill="#FF9EC0"/>' for x, sg in ((64, -1), (96, 1))))
    elif acc == 'hat':
        F = (f'<g transform="rotate(-8 80 {T})"><ellipse cx="80" cy="{T+4}" rx="32" ry="7.5" fill="#2E2B3E"/><rect x="62" y="{T-30}" width="36" height="34" rx="5" fill="#3A3650"/>'
             f'<rect x="62" y="{T-8}" width="36" height="8" fill="#D93B3B"/><rect x="66" y="{T-26}" width="6" height="16" rx="3" fill="#fff" opacity=".18"/>'
             f'<ellipse cx="80" cy="{T-30}" rx="18" ry="4" fill="#4A4562"/></g>')
    elif acc == 'headphones':
        cx = a['cupx']
        F = (f'<path d="M{cx+4} {E-6}C{cx} {T-26} {160-cx} {T-26} {156-cx} {E-6}" stroke="#4A5578" stroke-width="7" fill="none" stroke-linecap="round"/>'
             f'<path d="M{cx+6} {E-12}C{cx+4} {T-18} {154-cx} {T-18} {154-cx} {E-12}" stroke="#7F8CB5" stroke-width="2" fill="none" opacity=".7"/>'
             + ''.join(f'<rect x="{x-9}" y="{E-16}" width="18" height="30" rx="9" fill="#E8504A"/><rect x="{x-5}" y="{E-10}" width="10" height="18" rx="5" fill="#FF8A80"/>' for x in (cx, 160 - cx)))
    elif acc == 'witch-hat':
        F = (f'<g transform="rotate(-6 80 {T})"><ellipse cx="80" cy="{T+4}" rx="38" ry="8.5" fill="#4B2F7A"/>'
             f'<path d="M60 {T+4}C66 {T-20} 74 {T-36} 96 {T-48}C90 {T-36} 96 {T-16} 100 {T+4}Z" fill="#6A44A8"/>'
             f'<path d="M62 {T-2}Q80 {T+4} 99 {T-2}L100 {T+4}Q80 {T+10} 60 {T+4}Z" fill="#FFC93C"/><rect x="76" y="{T-3}" width="9" height="8" rx="1.6" fill="none" stroke="#B8860B" stroke-width="2"/>'
             + star(78, T - 22, 4, '#FFE27A') + star(88, T - 34, 2.6, '#FFE27A') + '</g>')
    elif acc == 'crown':
        F = (f'<path d="M58 {T+4}L56 {T-16}L68 {T-6}L80 {T-24}L92 {T-6}L104 {T-16}L102 {T+4}Z" fill="url(#{p}gold)"/>'
             f'<path d="M58 {T}H102" stroke="#E09A1E" stroke-width="2"/><circle cx="80" cy="{T-6}" r="4" fill="#E8504A"/><circle cx="66" cy="{T-2}" r="2.6" fill="#5BC8FF"/><circle cx="94" cy="{T-2}" r="2.6" fill="#5BC8FF"/>'
             f'<circle cx="56" cy="{T-17}" r="2.6" fill="#FFF3B0"/><circle cx="80" cy="{T-25}" r="2.8" fill="#FFF3B0"/><circle cx="104" cy="{T-17}" r="2.6" fill="#FFF3B0"/>')
    elif acc == 'halo':
        F = (f'<ellipse cx="80" cy="{T-16}" rx="28" ry="7" fill="none" stroke="#FFE27A" stroke-width="8" opacity=".35"/>'
             f'<ellipse cx="80" cy="{T-16}" rx="28" ry="7" fill="none" stroke="url(#{p}gold)" stroke-width="4.4"/>' + star(110, T - 22, 3.4, '#FFF3B0'))
    elif acc == 'glasses':
        F = (''.join(f'<circle cx="{x}" cy="{E}" r="13" fill="#fff" fill-opacity=".18" stroke="#7A4A2E" stroke-width="3"/>' for x in (80 - D, 80 + D))
             + f'<path d="M{80-D+13} {E-2}Q80 {E-7} {80+D-13} {E-2}" stroke="#7A4A2E" stroke-width="3" fill="none"/>'
             + f'<path d="M{80-D-13} {E-3}L{80-D-24} {E-6}M{80+D+13} {E-3}L{80+D+24} {E-6}" stroke="#7A4A2E" stroke-width="3" stroke-linecap="round"/>')
    elif acc == 'sunglasses':
        F = (''.join(f'<path d="M{x-15} {E-9}H{x+15}Q{x+15} {E+12} {x} {E+12}Q{x-15} {E+12} {x-15} {E-9}Z" fill="#1E2030"/><path d="M{x-10} {E-5}l8 0l-10 10Z" fill="#fff" opacity=".35"/>' for x in (80 - D, 80 + D))
             + f'<path d="M{80-D+15} {E-7}H{80+D-15}" stroke="#1E2030" stroke-width="3.4"/><path d="M{80-D-15} {E-8}L{80-D-25} {E-10}M{80+D+15} {E-8}L{80+D+25} {E-10}" stroke="#1E2030" stroke-width="3" stroke-linecap="round"/>')
    elif acc == 'eyepatch':
        x = 80 + D
        F = (f'<path d="M30 {E-20}L{x-8} {E-6}M{x+10} {E-12}L132 {E-18}" stroke="#2B2230" stroke-width="3" stroke-linecap="round"/>'
             f'<ellipse cx="{x}" cy="{E+1}" rx="13" ry="14" fill="#2B2230"/><path d="M{x-4} {E-3}l8 8M{x+4} {E-3}l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>')
    elif acc == 'mask':
        l, r = 80 - D, 80 + D
        hole = lambda x: f'M{x-10} {E}a10 12.5 0 1 0 20 0a10 12.5 0 1 0 -20 0Z'
        F = (f'<path fill-rule="evenodd" d="M{l-22} {E-4}C{l-20} {E-20} {r+20} {E-20} {r+22} {E-4}C{r+22} {E+14} {r} {E+18} 80 {E+8}C{l} {E+18} {l-22} {E+14} {l-22} {E-4}Z {hole(l)} {hole(r)}" fill="#2E3A8C"/>'
             f'<path d="M{r+20} {E-4}l14 -6l-4 10Z" fill="#2E3A8C"/><path d="M{l-12} {E-12}Q80 {E-20} {r+12} {E-12}" stroke="#6F86FF" stroke-width="2" fill="none" opacity=".7"/>')
    elif acc == 'scarf':
        F = (f'<path d="M52 {N-3}Q80 {N+11} 108 {N-3}L108 {N+7}Q80 {N+21} 52 {N+7}Z" fill="#E8504A"/>'
             f'<path d="M60 {N+1}q20 9 40 0M60 {N+7}q20 9 40 0" stroke="#fff" stroke-width="2.4" fill="none" opacity=".75"/>'
             f'<g transform="rotate(10 96 {N+8})"><rect x="90" y="{N+6}" width="13" height="24" rx="4" fill="#D33F3A"/><path d="M90 {N+14}h13M90 {N+20}h13" stroke="#fff" stroke-width="2.2" opacity=".75"/>'
             f'<path d="M91 {N+30}v4M95 {N+30}v4M99 {N+30}v4M102 {N+30}v4" stroke="#D33F3A" stroke-width="2" stroke-linecap="round"/></g>')
    elif acc == 'bowtie':
        y = N + 5
        F = (f'<path d="M80 {y}L64 {y-9}Q60 {y} 64 {y+9}Z" fill="#E8504A"/><path d="M80 {y}L96 {y-9}Q100 {y} 96 {y+9}Z" fill="#E8504A"/>'
             f'<circle cx="68" cy="{y-2}" r="1.6" fill="#fff"/><circle cx="70" cy="{y+4}" r="1.4" fill="#fff"/><circle cx="92" cy="{y-2}" r="1.6" fill="#fff"/><circle cx="90" cy="{y+4}" r="1.4" fill="#fff"/>'
             f'<rect x="75.5" y="{y-5}" width="9" height="10" rx="3" fill="#C23A35"/>')
    elif acc == 'medal':
        F = (f'<path d="M66 {N-2}L78 {N+16}H82L94 {N-2}H86L80 {N+8}L74 {N-2}Z" fill="#3F6FE0"/><path d="M74 {N-2}L80 {N+8}L86 {N-2}" fill="#E8504A"/>'
             f'<circle cx="80" cy="{N+22}" r="10" fill="url(#{p}gold)"/><circle cx="80" cy="{N+22}" r="7" fill="none" stroke="#E09A1E" stroke-width="1.6"/>' + star(80, N + 22, 5, '#FFF6CF'))
    elif acc == 'backpack':
        B = (f'<rect x="44" y="104" width="72" height="44" rx="16" fill="#F2A33A"/><rect x="44" y="104" width="72" height="12" rx="6" fill="#E08A22"/>'
             f'<path d="M50 118v22M110 118v22" stroke="#C9741A" stroke-width="2" stroke-dasharray="3 3"/>')
        F = (f'<path d="M60 106C58 118 58 128 60 140M100 106C102 118 102 128 100 140" stroke="#C9741A" stroke-width="5" fill="none" stroke-linecap="round"/>'
             f'<rect x="56" y="124" width="8" height="5" rx="2" fill="#FFD34D"/><rect x="96" y="124" width="8" height="5" rx="2" fill="#FFD34D"/>')
    elif acc == 'cape':
        B = (f'<path d="M52 108Q80 118 108 108L126 154Q104 148 80 158Q56 148 34 154Z" fill="#D93B3B"/>'
             f'<path d="M58 112Q80 120 102 112L112 150Q96 146 80 152Q64 146 48 150Z" fill="#B82A2A"/>')
        F = f'<path d="M54 110Q80 120 106 110" stroke="#FFC93C" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="80" cy="117" r="4.4" fill="url(#{p}gold)"/>'
    elif acc == 'wings':
        def wing(sx):
            g = f'<g transform="translate({80+sx*22} 106) scale({sx*1.45} 1.45)">'
            for k, (s_, c) in enumerate(((1.0, '#BFD6FF'), (.8, '#E3EEFF'), (.6, '#FFFFFF'))):
                g += (f'<path d="M0 0C-10 -{30*s_:.0f} -{38*s_:.0f} -{50*s_:.0f} -{66*s_:.0f} -{46*s_:.0f}C-{58*s_:.0f} -{36*s_:.0f} -{62*s_:.0f} -{26*s_:.0f} -{70*s_:.0f} -{18*s_:.0f}'
                      f'C-{56*s_:.0f} -{12*s_:.0f} -{56*s_:.0f} -4 -{62*s_:.0f} 6C-{40*s_:.0f} 4 -20 8 0 8Z" fill="{c}"/>')
            g += '<path d="M-6 0C-20 -14 -36 -24 -52 -28M-6 4C-24 -2 -40 -6 -56 -6" stroke="#9DB8F0" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
            return g + '</g>'
        B = f'<g class="wgL" style="transform-origin:58px 106px">{wing(-1)}</g><g class="wgR" style="transform-origin:102px 106px">{wing(1)}</g>'
    return d, B, F

ICON_VB = {'bow': '86 16 48 48', 'flower': '26 16 48 48', 'party-hat': '58 -14 52 52', 'cap': '42 2 76 76', 'cat-ears': '38 -4 84 84', 'hat': '44 -12 72 72',
           'headphones': '14 -2 132 132', 'witch-hat': '34 -26 92 92', 'crown': '50 -2 60 60', 'halo': '46 -18 68 68',
           'glasses': '40 50 80 60', 'sunglasses': '40 50 80 60', 'eyepatch': '26 40 108 80', 'mask': '28 44 104 76',
           'scarf': '48 104 64 64', 'bowtie': '56 94 48 48', 'medal': '56 106 48 48', 'backpack': '36 88 88 88', 'cape': '26 96 108 80', 'wings': '-50 20 260 120'}
