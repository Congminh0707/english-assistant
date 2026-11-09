# Achievement badges v3.1: enamel medallions, bevelled metal frames, gems, shine sweep.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from build import doc, pid
from chars import star
import badges as B1
from badges import TABLE, NAMES, GROUP, TIER

build.CSS += '''
.shine{animation:shine 3.2s ease-in-out infinite}
@keyframes shine{0%,55%{transform:translateX(-90px)}85%,100%{transform:translateX(90px)}}
.twk{animation:tw 1.8s ease-in-out infinite}
.shine{transform:translateX(-90px)}
@media (prefers-reduced-motion:reduce){.shine{display:none}}'''

ENAMEL = {'streak': ('#FF9A5A', '#E2481F', '#9E2A10'), 'reviews': ('#7FC0FF', '#2F72E0', '#1B3F94'), 'words': ('#6FE0A0', '#22A463', '#11663C'),
          'practice': ('#FF8A96', '#D8344E', '#8E1830'), 'lessons': ('#8F9BFF', '#4A50D0', '#262A82'), 'perfect': ('#CFA0FF', '#8346E0', '#4A1E96'),
          'days': ('#6FE6DE', '#17A39C', '#0B5F5B'), 'xp': ('#FFD06A', '#F08A12', '#A04E06'), 'memory': ('#FF9CC4', '#E0458A', '#951E55')}
METAL = {'bronze': ('#FFD2A6', '#D88A4A', '#8A4A1E', '#5E2E0E'), 'silver': ('#FFFFFF', '#C9D4E4', '#8593AE', '#56627C'),
         'gold': ('#FFF6C2', '#FFC93C', '#D88A0E', '#8E5406'), 'diamond': ('#E9FDFF', '#7FE3FF', '#8E6BFF', '#FF5FB8')}
RIB = {'bronze': ('#C9733A', '#8E4A1E'), 'silver': ('#4F86F0', '#2A55B8'), 'gold': ('#E8483E', '#A82620'), 'diamond': ('#9A6BFF', '#5B32C8')}

def glyph(g):
    W, W2 = '#FFFFFF', '#FFE9C7'
    if g == 'streak':
        return ('<path d="M0 -20C6 -12 15 -6 15 6C15 15 8 20 0 20C-8 20 -15 15 -15 6C-15 -2 -10 -6 -8 -12C-6 -6 -4 -4 -2 -4C-4 -10 -3 -16 0 -20Z" fill="#FFF3D6"/>'
                '<path d="M0 -6C4 -1 9 3 9 9C9 14 5 17 0 17C-5 17 -9 14 -9 9C-9 4 -5 1 0 -6Z" fill="#FFC93C"/><path d="M-1 4C2 7 4 9 4 12C4 14 2 15 0 15C-2 15 -4 14 -4 12C-4 9 -2 7 -1 4Z" fill="#FF7A3D"/>')
    if g == 'reviews':
        return ('<rect x="-17" y="-17" width="22" height="29" rx="4" fill="#BFDDFF" transform="rotate(-14)"/><rect x="-8" y="-15" width="23" height="30" rx="4" fill="#FFFFFF" transform="rotate(10)"/>'
                '<text x="4" y="5" transform="rotate(10)" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="14" fill="#2F72E0">Aa</text>'
                '<circle cx="14" cy="12" r="7" fill="#2FCB7A"/><path d="M10.5 12l2.6 2.6l4.4 -5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    if g == 'words':
        return ('<path d="M0 -10C-6 -16 -14 -16 -20 -13V14C-14 11 -6 11 0 16C6 11 14 11 20 14V-13C14 -16 6 -16 0 -10Z" fill="#FFFFFF"/>'
                '<path d="M0 -10V16" stroke="#D6E9DD" stroke-width="2"/><path d="M-15 -6q6 -2 11 1M-15 0q6 -2 11 1M-15 6q6 -2 11 1M5 -5q6 -3 11 -1M5 1q6 -3 11 -1M5 7q6 -3 11 -1" stroke="#9BCFAE" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
                '<path d="M10 -15V0l3 -3l3 3V-14" fill="#FFC93C"/>')
    if g == 'practice':
        return ('<circle r="18" fill="#FFFFFF"/><circle r="13" fill="#FFC9CF"/><circle r="8" fill="#FFFFFF"/><circle r="3.8" fill="#D8344E"/>'
                '<path d="M2 -2L19 -19" stroke="#FFE9C7" stroke-width="3" stroke-linecap="round"/><path d="M15 -21l7 -2l-2 7l-4 0Z" fill="#FFC93C"/>')
    if g == 'lessons':
        return ('<path d="M0 -15L23 -4L0 7L-23 -4Z" fill="#FFFFFF"/><path d="M-13 1V10C-6 16 6 16 13 10V1L0 7Z" fill="#DCE0FF"/>'
                '<path d="M17 -1V12" stroke="#FFC93C" stroke-width="2.4"/><circle cx="17" cy="14" r="3.4" fill="#FFC93C"/>')
    if g == 'perfect':
        return star(0, 1, 21, '#FFFFFF') + star(0, 1, 13, '#FFE27A') + '<text x="0" y="6" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="12" fill="#8346E0">10</text>'
    if g == 'days':
        return ('<rect x="-17" y="-15" width="34" height="32" rx="6" fill="#FFFFFF"/><path d="M-17 -9C-17 -12 -14 -15 -11 -15H11C14 -15 17 -12 17 -9V-4H-17Z" fill="#FF8A80"/>'
                '<rect x="-10" y="-20" width="4" height="9" rx="2" fill="#FFE9C7"/><rect x="6" y="-20" width="4" height="9" rx="2" fill="#FFE9C7"/>'
                '<path d="M-8 6l5 5l11 -11" stroke="#17A39C" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    if g == 'xp':
        return '<path d="M4 -22L-14 3H-1L-5 22L14 -4H1Z" fill="#FFFFFF"/><path d="M4 -22L-14 3H-1Z" fill="#FFF3B0"/>'
    if g == 'memory':
        return ('<path d="M0 18C-10 11 -20 3 -20 -7C-20 -15 -14 -19 -9 -19C-4 -19 -1 -16 0 -13C1 -16 4 -19 9 -19C14 -19 20 -15 20 -7C20 3 10 11 0 18Z" fill="#FFFFFF"/>'
                '<path d="M-8 -6C-4 -10 2 -8 2 -3C2 1 -4 2 -4 6M4 -8C8 -6 9 -1 6 2" stroke="#FF9CC4" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
    return ''

def poly(n, r, rot=0, r2=None):
    pts = []
    for i in range(n * (2 if r2 else 1)):
        a = rot + i * math.pi * 2 / (n * (2 if r2 else 1))
        rr = r if (not r2 or i % 2 == 0) else r2
        pts.append('%.1f %.1f' % (rr * math.cos(a), rr * math.sin(a)))
    return 'M' + 'L'.join(pts) + 'Z'

def gem(x, y, r, c1, c2):
    return (f'<g transform="translate({x} {y})"><path d="{poly(6, r, math.pi/6)}" fill="{c2}"/><path d="{poly(6, r*.62, math.pi/6)}" fill="{c1}"/>'
            f'<path d="M{-r*.4:.1f} {-r*.5:.1f}l{r*.3:.1f} {-r*.2:.1f}" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".9"/></g>')

def badge(group, target, tier, w=96, locked=False, progress=None, label=True):
    p = pid()
    unit = GROUP[group][1]
    num = f'{target:,}'.replace(',', '.')
    txt = f'{num}%' if unit == '%' else f'{num} {unit}'
    M = METAL[tier]; E = ENAMEL[group]; R = RIB[tier]
    d = (f'<linearGradient id="{p}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{M[0]}"/><stop offset=".45" stop-color="{M[1]}"/><stop offset="1" stop-color="{M[2]}"/></linearGradient>'
         f'<linearGradient id="{p}m2" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{M[0]}"/><stop offset=".5" stop-color="{M[1]}"/><stop offset="1" stop-color="{M[3]}"/></linearGradient>'
         f'<radialGradient id="{p}e" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="{E[0]}"/><stop offset=".55" stop-color="{E[1]}"/><stop offset="1" stop-color="{E[2]}"/></radialGradient>'
         f'<linearGradient id="{p}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{R[0]}"/><stop offset="1" stop-color="{R[1]}"/></linearGradient>'
         f'<linearGradient id="{p}sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
         f'<filter id="{p}ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.2" flood-color="#000" flood-opacity=".35"/></filter>'
         f'<radialGradient id="{p}gl"><stop offset="0" stop-color="#FFF3B8" stop-opacity=".9"/><stop offset="1" stop-color="#FFF3B8" stop-opacity="0"/></radialGradient>')
    o = ''
    # ---- back decoration by tier
    if tier == 'diamond':
        o += f'<circle r="58" fill="url(#{p}gl)"/>'
        o += '<g class="spin" style="transform-origin:0 0">' + ''.join(f'<path d="M0 0L-4 -56L4 -56Z" fill="#FFF6CF" opacity=".7" transform="rotate({i*22.5})"/>' for i in range(16)) + '</g>'
        for sx in (-1, 1):
            feath = ''.join(f'<path d="M28 {-2 + k*7}C{44 + k*2} {-22 + k*8} {62 - k*4} {-26 + k*10} {68 - k*6} {-16 + k*10}C{58 - k*4} {-10 + k*9} {48} {-4 + k*8} 30 {6 + k*6}Z" fill="{["#FFFFFF", "#E3F3FF", "#C9E4FF"][k]}"/>' for k in range(3))
            o += f'<g transform="scale({sx} 1)">{feath}<path d="M30 -2C44 -14 56 -18 64 -16" stroke="#A9CBF0" stroke-width="1.4" fill="none"/></g>'
    if tier == 'gold':
        o += '<g class="spin" style="transform-origin:0 0">' + f'<path d="{poly(16, 50, 0, 38)}" fill="url(#{p}m)" opacity=".9"/>' + '</g>'
        for sx in (-1, 1):
            o += (f'<g transform="scale({sx} 1)"><path d="M30 -4C42 -16 54 -18 60 -12C54 -10 52 -6 56 -1C48 -1 46 3 48 8C42 6 36 8 32 10Z" fill="url(#{p}m)"/>'
                  f'<path d="M34 -4C42 -10 50 -12 56 -10M34 2C40 0 46 0 50 2" stroke="{M[3]}" stroke-width="1.4" fill="none" opacity=".6"/></g>')
    # ribbon tails behind
    if tier != 'bronze':
        o += f'<path d="M-16 20L-26 50L-14 44L-6 54L2 26Z" fill="url(#{p}r)"/><path d="M16 20L26 50L14 44L6 54L-2 26Z" fill="url(#{p}r)"/>'
    # ---- frame shape
    if tier == 'bronze':
        frame = 'M0 -36A36 36 0 1 1 0 36A36 36 0 1 1 0 -36Z'
        o += f'<path d="{frame}" fill="url(#{p}m)"/><circle r="32" fill="url(#{p}m2)"/>'
        o += ''.join(f'<circle cx="{30.5*math.cos(i*math.pi/6):.1f}" cy="{30.5*math.sin(i*math.pi/6):.1f}" r="1.7" fill="{M[0]}"/>' for i in range(12))
    elif tier == 'silver':
        frame = poly(8, 42, math.pi / 8, 35)
        o += f'<path d="{frame}" fill="url(#{p}m)" stroke-linejoin="round"/><path d="{poly(8, 37, math.pi / 8, 31)}" fill="url(#{p}m2)"/>'
    elif tier == 'gold':
        frame = 'M0 -40C14 -40 30 -34 36 -28C36 4 26 26 0 40C-26 26 -36 4 -36 -28C-30 -34 -14 -40 0 -40Z'
        o += f'<path d="{frame}" fill="url(#{p}m)"/><path d="M0 -35C12 -35 26 -30 31 -25C31 3 22 22 0 35C-22 22 -31 3 -31 -25C-26 -30 -12 -35 0 -35Z" fill="url(#{p}m2)"/>'
    else:
        frame = poly(10, 42, -math.pi / 2)
        o += f'<path d="{frame}" fill="url(#{p}m)"/>'
        o += ''.join(f'<path d="M0 0L{42*math.cos(-math.pi/2 + i*math.pi/5):.1f} {42*math.sin(-math.pi/2 + i*math.pi/5):.1f}L{42*math.cos(-math.pi/2 + (i+1)*math.pi/5):.1f} {42*math.sin(-math.pi/2 + (i+1)*math.pi/5):.1f}Z" fill="#fff" opacity="{(.05, .3, .12, .4, .08, .25, .1, .35, .06, .2)[i]}"/>' for i in range(10))
    # ---- enamel medallion
    er = {'bronze': 26, 'silver': 27, 'gold': 25, 'diamond': 28}[tier]
    o += f'<circle r="{er+2}" fill="{M[3]}" opacity=".55"/><circle r="{er}" fill="url(#{p}e)"/>'
    o += f'<circle r="{er-3}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.2" stroke-dasharray="1.5 3"/>'
    if tier == 'diamond':
        o += ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" opacity=".7"/>' for x, y, r in ((-16, -10, 1), (14, -16, 1.2), (18, 8, .9), (-12, 14, .8), (4, -22, .8)))
    o += f'<g filter="url(#{p}ds)" transform="translate(0 -1) scale({.9 if er < 27 else .95})">{glyph(group)}</g>'
    o += f'<path d="M{-er+4} -6A{er-4} {er-4} 0 0 1 {er-8} -14" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>'
    # ---- gems / crown
    if tier == 'silver':
        o += gem(0, 36, 6, '#9FD8FF', '#2F72E0')
    if tier == 'gold':
        o += gem(0, -34, 6, '#FF9A9A', '#C42A2A') + gem(-29, -6, 4.4, '#9FD8FF', '#2F72E0') + gem(29, -6, 4.4, '#9FD8FF', '#2F72E0')
        o += f'<path d="M-14 -38L-16 -52L-7 -45L0 -56L7 -45L16 -52L14 -38Z" fill="url(#{p}m)"/><circle cx="0" cy="-48" r="2.4" fill="#E8483E"/>'
    if tier == 'diamond':
        o += (f'<path d="M-18 -38L-21 -56L-10 -47L0 -61L10 -47L21 -56L18 -38Z" fill="url(#{p}m)"/><path d="M-18 -38H18" stroke="#fff" stroke-width="2"/>'
              + gem(0, -50, 4.4, '#FFC2E2', '#E0458A') + gem(-12, -43, 3, '#C9FBFF', '#2FB8D0') + gem(12, -43, 3, '#C9FBFF', '#2FB8D0') + gem(0, 40, 6, '#E9DDFF', '#7B4FD8'))
        o += '<g class="twk">' + star(-48, -36, 4, '#FFF6CF') + star(50, -30, 3.4, '#FFF6CF') + star(44, 34, 3, '#BFF4FF') + '</g>'
    # ---- shine sweep (clipped to frame)
    o += f'<clipPath id="{p}cl"><path d="{frame}"/></clipPath><g clip-path="url(#{p}cl)"><rect class="shine" x="-14" y="-60" width="16" height="120" fill="url(#{p}sh)" transform="rotate(20)"/></g>'
    # ---- label ribbon
    if label:
        o += (f'<path d="M-40 30L-34 36L-40 42H-28V30Z" fill="{R[1]}"/><path d="M40 30L34 36L40 42H28V30Z" fill="{R[1]}"/>'
              f'<path d="M-32 26Q0 34 32 26V40Q0 48 -32 40Z" fill="url(#{p}r)"/><path d="M-32 27Q0 35 32 27" stroke="#fff" stroke-opacity=".4" stroke-width="1"/>'
              f'<text x="0" y="40" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="9.5" fill="#FFFFFF" filter="url(#{p}ds)">{txt}</text>')
    grey = ''
    if locked:
        d += f'<filter id="{p}g"><feColorMatrix type="saturate" values="0"/></filter>'
        grey = f' filter="url(#{p}g)" opacity=".35"'
    ring = ''
    if progress is not None:
        c = 2 * math.pi * 50
        ring = (f'<circle r="50" fill="none" stroke="#EFE7D6" stroke-width="5"/><circle r="50" fill="none" stroke="#2FA968" stroke-width="5" stroke-linecap="round" '
                f'stroke-dasharray="{c*progress:.1f} {c:.1f}" transform="rotate(-90)"/>')
    lock = ('<g transform="translate(24 18)"><circle r="12" fill="#3E3226"/><rect x="-5.5" y="-2" width="11" height="9" rx="2" fill="#FFFFFF"/>'
            '<path d="M-3.4 -2V-5.4a3.4 3.4 0 0 1 6.8 0V-2" stroke="#FFFFFF" stroke-width="2" fill="none"/></g>') if locked else ''
    return f'<svg width="{w}" height="{w*1.05:.0f}" viewBox="-62 -64 124 130" role="img" aria-label="{NAMES[group+str(target)]}{" (chưa mở)" if locked else ""}"><defs>{d}</defs>{ring}<g{grey}>{o}</g>{lock}</svg>'

if __name__ == '__main__':
    B1.badge = badge
    B1.board()
    s = open(os.path.join(build.OUT, 'Badges.dc.html'), encoding='utf-8').read()
    s = s.replace('đồng là đồng xu tròn; bạc thêm viền răng cưa và dải băng; vàng thêm vòng nguyệt quế và ngôi sao; kim cương là viên đá lục giác óng ánh, có cánh, vương miện và tia sáng xoay.',
                  'đồng là đồng xu đinh tán; bạc là sao tám cánh đính ngọc xanh; vàng là khiên có cánh, vương miện, ba viên ngọc và vầng tia xoay; kim cương là pha lê mười mặt, cánh lông vũ, vương miện đính ngọc và tia sáng. Nền men màu riêng cho từng nhóm, vệt sáng lướt qua khung.')
    open(os.path.join(build.OUT, 'Badges.dc.html'), 'w', encoding='utf-8').write(s)
    print('ok')
