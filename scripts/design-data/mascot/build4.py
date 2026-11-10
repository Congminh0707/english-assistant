# Mascot v4: hình nhân vật cho bảng thiết kế (canvas) + bản xem nhanh.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from build import SC
from chars4 import CHARS4, egg
from fx4 import CSS4, halo, glow, twinkles

ALL_CSS = build.CSS.replace('@media (prefers-reduced-motion:reduce){*{animation:none !important}}', '') + CSS4 + '@media (prefers-reduced-motion:reduce){*{animation:none !important}}'

# Nền Huyền thoại v4: quầng nhỏ, mờ + vòng mảnh (thay quầng r=100–120 của v3)
def backdrop(n, p):
    col, ring, dot = {'kitsu': ('#9FE0FF', '#BDEBFF', '#FFD34D'), 'bi': ('#FFE9A8', '#FFF3C4', '#F2B53A'), 'draco': ('#FFB36B', '#FFD9A8', '#FFD34D'),
                      'robo': ('#9FF6FF', '#BFF8FF', '#FFC93C'), 'lupo': ('#C9D4FF', '#E6EBFF', '#FFE07A')}[n]
    d, g = glow(p, 80, 78, 78, col, .34)
    if n == 'lupo':   # trăng khuyết mảnh sau đầu thay vòng tròn
        d += f'<linearGradient id="{p}mn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFBE0"/><stop offset="1" stop-color="#FFD866"/></linearGradient>'
        return d, g + crescent(80, 70, 64, 91, 62, 61, f'url(#{p}mn)') + halo(80, 74, 60, ring, dot).split('<g', 1)[1].join(['<g', ''])
    return d, g + halo(80, 74, 60, ring, dot)

def crescent(x1, y1, r1, x2, y2, r2, fill):
    """Trăng khuyết = hình tròn (x1,y1,r1) khoét bởi (x2,y2,r2)."""
    import math
    dx, dy = x2 - x1, y2 - y1
    dd = math.hypot(dx, dy)
    a = (r1 * r1 - r2 * r2 + dd * dd) / (2 * dd)
    h = math.sqrt(r1 * r1 - a * a)
    mx, my = x1 + a * dx / dd, y1 + a * dy / dd
    ax, ay = mx - h * dy / dd, my + h * dx / dd
    bx, by = mx + h * dy / dd, my - h * dx / dd
    return (f'<path d="M{ax:.1f} {ay:.1f}A{r1} {r1} 0 1 1 {bx:.1f} {by:.1f}A{r2} {r2} 0 1 0 {ax:.1f} {ay:.1f}Z" fill="{fill}" opacity=".92"/>'
            f'<path d="M{x1 - r1 + 3:.1f} {y1 + 6}A{r1 - 3} {r1 - 3} 0 0 0 {x1 - 20} {y1 + r1 - 5.4:.1f}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>')

_n = [0]
def fig_svg(name, stage, pose='idle', w=170, label='', vb=None, ground=True, root_cls=None):
    _n[0] += 1
    p = 'v%d' % _n[0]
    if stage == 'egg':
        d, f = egg(name, p)
    else:
        d, f = CHARS4[name](stage, pose, p)
    s = SC[stage]
    lg = stage == 'legend'
    vb = vb or ('-50 -50 260 230' if lg else '-24 -14 208 178')
    vbw, vbh = [float(x) for x in vb.split()[2:]]
    h = round(w * vbh / vbw)
    rc = root_cls or ('fl' if lg else ('' if stage == 'egg' else 'br'))
    bg = ''
    if lg:
        bd, bg = backdrop(name, p)
        d += bd
    elif ground:
        bg = f'<ellipse cx="80" cy="151" rx="{58*s:.0f}" ry="6.5" fill="#6B5A48" opacity=".12"/>'
    return (f'<svg width="{w}" height="{h}" style="flex-shrink: 0; overflow: visible" viewBox="{vb}" role="img" aria-label="{label}"><defs>{d}</defs>{bg}'
            f'<g class="{rc}" style="transform-origin:80px 150px"><g transform="translate(80 150) scale({s}) translate(-80 -150)">{f}</g></g></svg>')
