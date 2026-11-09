# Accessory set v2: bigger, sits outside the silhouette, new "hand" slot.
import acc as A
from acc import ANCHOR, _d
from chars import star

ACC = [  # id, vi name, slot, price, min level, status
    ('bow', 'Nơ hồng', 'head', 30, 0, 'giữ, to hơn'), ('flower', 'Vòng hoa', 'head', 40, 0, 'đổi: hoa cài → vòng hoa'),
    ('party-hat', 'Nón tiệc', 'head', 70, 0, 'giữ'), ('cap', 'Mũ lưỡi trai', 'head', 60, 2, 'giữ'),
    ('beanie', 'Mũ len', 'head', 90, 2, 'mới, thay bờm tai mèo'), ('hat', 'Mũ chóp', 'head', 120, 5, 'giữ'),
    ('headphones', 'Tai nghe', 'head', 150, 5, 'giữ'), ('witch-hat', 'Mũ phù thuỷ', 'head', 160, 6, 'giữ'),
    ('crown', 'Vương miện', 'head', 300, 10, 'giữ, to hơn'), ('halo', 'Vầng hào quang', 'head', 350, 12, 'giữ, to hơn'),
    ('glasses', 'Kính tròn', 'face', 60, 0, 'giữ'), ('sunglasses', 'Kính tim', 'face', 90, 3, 'đổi: kính râm → kính tim'),
    ('eyepatch', 'Bịt mắt cướp biển', 'face', 100, 4, 'giữ'), ('mask', 'Mặt nạ hiệp sĩ', 'face', 130, 6, 'giữ'),
    ('scarf', 'Khăn len', 'neck', 80, 0, 'to hơn, vắt ra trước ngực'), ('bowtie', 'Nơ cổ', 'neck', 70, 0, 'to gấp rưỡi'),
    ('medal', 'Huy chương', 'neck', 220, 10, 'to hơn'),
    ('balloon', 'Bóng bay', 'hand', 50, 0, 'mới'), ('lollipop', 'Kẹo mút', 'hand', 40, 0, 'mới'),
    ('sword', 'Kiếm gỗ', 'hand', 110, 4, 'mới'), ('leaf-umbrella', 'Ô lá', 'hand', 140, 5, 'mới'), ('wand', 'Đũa phép', 'hand', 240, 9, 'mới'),
    ('cape', 'Áo choàng', 'back', 200, 8, 'vẽ lại: bay ra một bên'), ('fairy-wings', 'Cánh tiên', 'back', 260, 8, 'mới, thay ba lô'),
    ('wings', 'Đôi cánh', 'back', 450, 15, 'to gấp rưỡi'),
]
REMOVED = [('backpack', 'Ba lô', 'bị thân che gần hết'), ('cat-ears', 'Bờm tai mèo', 'lẫn vào tai thật của Kitsu, Lupo, Bi')]
SLOT = {a[0]: a[2] for a in ACC}
NAME = {a[0]: a[1] for a in ACC}
HX, HY = 110, 136   # right hand at idle

def draw(acc, ch, p):
    a = ANCHOR[ch]; T, E, D, N, S = a['top'], a['ey'], a['dx'], a['neck'], a['side']
    d = _d(p) + f'<linearGradient id="{p}fw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5FDCFF"/><stop offset=".5" stop-color="#9A7BFF"/><stop offset="1" stop-color="#FF7FC0"/></linearGradient>'
    B = F = ''
    if acc == 'bow':
        _, B0, F0 = A.draw('bow', ch, p)
        x, y = 80 + S, T + 10
        F = f'<g transform="translate({x} {y}) scale(1.4) translate({-x} {-y})">{F0}</g>'
    elif acc == 'flower':
        def fl(x, y, s, c, cc='#FFC93C'):
            g = f'<g transform="translate({x} {y}) scale({s})">' + ''.join(f'<ellipse cx="0" cy="-6" rx="4.6" ry="6.4" fill="{c}" transform="rotate({i*72})"/>' for i in range(5))
            return g + f'<circle r="3.6" fill="{cc}"/><circle cx="-1.2" cy="-1.2" r="1.1" fill="#fff"/></g>'
        lv = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="7" ry="3.4" fill="#5BC46E" transform="rotate({r} {x} {y})"/>' for x, y, r in ((52, T + 14, -40), (68, T + 2, -15), (92, T + 2, 15), (108, T + 14, 40)))
        F = (lv + fl(46, T + 18, 1.05, '#FF9EC0') + fl(60, T + 6, 1.1, '#FFE07A', '#FF8FB1') + fl(80, T + 1, 1.3, '#FF7FAE')
             + fl(100, T + 6, 1.1, '#B9A4FF') + fl(114, T + 18, 1.05, '#FF9EC0'))
    elif acc == 'beanie':
        F = (f'<path d="M44 {T+22}C44 {T-18} 116 {T-18} 116 {T+22}Z" fill="#3FB8A8"/>'
             + ''.join(f'<path d="M{x} {T+16}V{T-2 if abs(x-80) < 20 else T+4}" stroke="#2E9E90" stroke-width="2.4" stroke-linecap="round"/>' for x in (56, 68, 80, 92, 104))
             + f'<rect x="40" y="{T+14}" width="80" height="14" rx="7" fill="#F2B53A"/><path d="M46 {T+21}h68" stroke="#E09A1E" stroke-width="2" stroke-dasharray="3 4"/>'
             f'<circle cx="80" cy="{T-16}" r="10" fill="#FFF6EA"/><circle cx="76" cy="{T-20}" r="3" fill="#fff"/>'
             f'<ellipse cx="62" cy="{T}" rx="7" ry="4" fill="#fff" opacity=".25" transform="rotate(-30 62 {T})"/>')
    elif acc in ('crown', 'halo'):
        _, B0, F0 = A.draw(acc, ch, p)
        F = f'<g transform="translate(80 {T}) scale(1.35) translate(-80 {-T})">{F0}</g>'
    elif acc == 'sunglasses':
        heart = lambda x: f'M{x} {E+11}C{x-6} {E+6} {x-16} {E} {x-16} {E-6}C{x-16} {E-14} {x-6} {E-15} {x} {E-8}C{x+6} {E-15} {x+16} {E-14} {x+16} {E-6}C{x+16} {E} {x+6} {E+6} {x} {E+11}Z'
        F = (''.join(f'<path d="{heart(x)}" fill="#FF4F8B"/><path d="{heart(x)}" fill="none" stroke="#C2185B" stroke-width="2.4"/><path d="M{x-10} {E-8}q4 -3 7 0" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>' for x in (80 - D, 80 + D))
             + f'<path d="M{80-D+15} {E-6}Q80 {E-10} {80+D-15} {E-6}" stroke="#C2185B" stroke-width="3" fill="none"/>')
    elif acc == 'scarf':
        F = (f'<path d="M48 {N-5}Q80 {N+12} 112 {N-5}L112 {N+9}Q80 {N+26} 48 {N+9}Z" fill="#E8504A"/>'
             f'<path d="M56 {N}q24 12 48 0M56 {N+8}q24 12 48 0" stroke="#fff" stroke-width="2.6" fill="none" opacity=".8"/>'
             f'<path d="M58 {N+10}L50 {N+40}L64 {N+42}L68 {N+14}Z" fill="#D33F3A"/><path d="M53 {N+24}l13 2M51 {N+32}l13 2" stroke="#fff" stroke-width="2.4" opacity=".8"/>'
             f'<path d="M51 {N+42}l-1 5M55 {N+43}v5M59 {N+43}v5M63 {N+43}l1 5" stroke="#D33F3A" stroke-width="2.2" stroke-linecap="round"/>')
    elif acc in ('bowtie', 'medal'):
        _, B0, F0 = A.draw(acc, ch, p)
        y = N + (5 if acc == 'bowtie' else 14)
        F = f'<g transform="translate(80 {y}) scale({1.5 if acc == "bowtie" else 1.3}) translate(-80 {-y})">{F0}</g>'
    elif acc == 'balloon':
        F = (f'<path d="M{HX} {HY}C{HX+14} {HY-30} {HX+30} {HY-60} {HX+32} {T+40}" stroke="#6B5A48" stroke-width="1.6" fill="none"/>'
             f'<g class="bob2"><ellipse cx="{HX+34}" cy="{T+14}" rx="20" ry="24" fill="#FF5A6E"/><path d="M{HX+30} {T+38}l4 6l4 -6Z" fill="#E0404F"/>'
             f'<ellipse cx="{HX+27}" cy="{T+4}" rx="5" ry="8" fill="#fff" opacity=".55" transform="rotate(-20 {HX+27} {T+4})"/>'
             f'<path d="M{HX+28} {T+20}q6 6 12 0" stroke="#B8283A" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="{HX+28}" cy="{T+13}" r="2" fill="#B8283A"/><circle cx="{HX+40}" cy="{T+13}" r="2" fill="#B8283A"/></g>')
    elif acc == 'lollipop':
        F = (f'<path d="M{HX} {HY+2}L{HX+16} {HY-34}" stroke="#FFF6EA" stroke-width="4" stroke-linecap="round"/>'
             f'<circle cx="{HX+20}" cy="{HY-46}" r="16" fill="#FF7FAE"/>'
             f'<path d="M{HX+20} {HY-46}m0 -12a12 12 0 1 1 -11 7a8 8 0 1 1 8 -3a4 4 0 1 1 3 3" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
             f'<ellipse cx="{HX+13}" cy="{HY-54}" rx="4" ry="6" fill="#fff" opacity=".5" transform="rotate(-30 {HX+13} {HY-54})"/>')
    elif acc == 'sword':
        F = (f'<g transform="rotate(28 {HX} {HY})"><rect x="{HX-4}" y="{HY-62}" width="8" height="54" rx="3" fill="#E8C38A"/><path d="M{HX-4} {HY-62}L{HX} {HY-70}L{HX+4} {HY-62}Z" fill="#E8C38A"/>'
             f'<path d="M{HX} {HY-64}V{HY-12}" stroke="#C99A5A" stroke-width="1.6"/><rect x="{HX-12}" y="{HY-10}" width="24" height="6" rx="3" fill="#8A5A3C"/>'
             f'<rect x="{HX-3}" y="{HY-5}" width="6" height="12" rx="2" fill="#6B3E2A"/><circle cx="{HX}" cy="{HY+9}" r="3.4" fill="#FFC93C"/></g>')
    elif acc == 'leaf-umbrella':
        F = (f'<path d="M{HX} {HY+4}L{HX+8} {T+12}" stroke="#6B8E3A" stroke-width="3.6" stroke-linecap="round"/>'
             f'<g transform="rotate(14 {HX+8} {T+8})"><path d="M{HX-36} {T+14}C{HX-30} {T-26} {HX+46} {T-26} {HX+52} {T+14}C{HX+40} {T+6} {HX+30} {T+16} {HX+8} {T+8}C{HX-14} {T+16} {HX-24} {T+6} {HX-36} {T+14}Z" fill="#5BC46E"/>'
             f'<path d="M{HX+8} {T+8}V{T-16}M{HX+8} {T-4}l-20 -6M{HX+8} {T-4}l20 -6M{HX+8} {T+4}l-32 0M{HX+8} {T+4}l32 0" stroke="#3E9C5C" stroke-width="2" fill="none" stroke-linecap="round"/>'
             f'<circle cx="{HX-16}" cy="{T-6}" r="2.4" fill="#BFF0C4"/><circle cx="{HX+30}" cy="{T-8}" r="2" fill="#BFF0C4"/></g>')
    elif acc == 'wand':
        F = (f'<path d="M{HX} {HY+2}L{HX+20} {HY-40}" stroke="#7B4FD8" stroke-width="4.4" stroke-linecap="round"/><path d="M{HX+15} {HY-30}l6 3" stroke="#FFC93C" stroke-width="3"/>'
             + star(HX + 22, HY - 50, 13, f'url(#{p}gold)') + star(HX + 22, HY - 50, 5, '#FFF6CF')
             + f'<g class="tw">' + star(HX + 42, HY - 66, 4, '#FFE27A') + star(HX + 4, HY - 70, 3, '#FFE27A') + star(HX + 44, HY - 34, 3, '#BFF4FF') + '</g>')
    elif acc == 'cape':
        B = (f'<g class="cape" style="transform-origin:80px 110px"><path d="M54 108C34 116 12 136 0 158C20 152 30 160 46 154C60 160 70 152 84 158C100 152 112 158 124 154L108 108Q80 118 54 108Z" fill="#D93B3B"/>'
             f'<path d="M58 112C42 122 26 138 16 152C30 150 40 154 50 150" stroke="#B82A2A" stroke-width="3" fill="none" stroke-linecap="round"/></g>')
        F = (f'<path d="M50 108Q80 122 110 108L106 118Q80 130 54 118Z" fill="#B82A2A"/><path d="M52 109Q80 122 108 109" stroke="#FFC93C" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
             f'<circle cx="80" cy="119" r="5" fill="url(#{p}gold)"/>')
    elif acc == 'fairy-wings':
        def wing(sx):
            return (f'<g transform="translate({80+sx*20} 106) scale({sx*1.35} 1.35)">'
                    f'<path d="M0 0C-14 -40 -54 -70 -74 -54C-86 -42 -66 -14 0 0Z" fill="url(#{p}fw)" opacity=".92"/>'
                    f'<path d="M0 4C-22 6 -52 22 -54 40C-50 54 -20 40 0 4Z" fill="url(#{p}fw)" opacity=".85"/>'
                    f'<path d="M-4 -2C-24 -24 -46 -44 -62 -50M-4 4C-20 14 -36 26 -46 36" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>'
                    f'<circle cx="-56" cy="-40" r="3" fill="#fff" opacity=".8"/><circle cx="-38" cy="30" r="2.4" fill="#fff" opacity=".8"/></g>')
        B = f'<g class="wgL" style="transform-origin:60px 108px">{wing(-1)}</g><g class="wgR" style="transform-origin:100px 108px">{wing(1)}</g>'
    elif acc == 'wings':
        _, B0, F0 = A.draw('wings', ch, p)
        B = f'<g transform="translate(80 104) scale(1.45) translate(-80 -104)">{B0}</g>'
    else:
        dd, B, F = A.draw(acc, ch, p)
        d += dd
    return d, B, F

ICON_VB = dict(A.ICON_VB)
ICON_VB.update({'bow': '74 4 72 72', 'flower': '34 -6 92 52', 'beanie': '38 -12 84 84', 'crown': '40 -18 80 60', 'halo': '38 -24 84 60',
                'sunglasses': '36 52 88 60', 'scarf': '44 100 72 64', 'bowtie': '52 98 56 40', 'medal': '58 104 44 60',
                'balloon': '104 10 64 128', 'lollipop': '104 70 52 76', 'sword': '100 64 56 80', 'leaf-umbrella': '64 -2 112 140', 'wand': '100 60 64 84',
                'cape': '-6 100 136 66', 'fairy-wings': '-4 30 168 128', 'wings': '-70 10 300 140'})
