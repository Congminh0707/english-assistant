# Mascot v4 motion + light kit: jointed chains (overlapping action) and small ethereal lights.
# Mọi vị trí/độ trễ cố định (không random) để figure() gọi 2 lần ra cùng chuỗi.
import math

# CSS: --a biên độ, --dl độ trễ riêng, --f lệch khung (bảng xem khung hình đứng yên).
CSS4 = '''
.sg{animation:sg var(--d,3.6s) ease-in-out infinite;animation-delay:calc(var(--dl,0s) - var(--f,0s));transform-origin:0 0}
@keyframes sg{0%,100%{transform:rotate(calc(var(--a,4deg)*-1))}50%{transform:rotate(var(--a,4deg))}}
.mt{animation:mt var(--d,5s) ease-in-out infinite;animation-delay:calc(var(--dl,0s) - var(--f,0s));opacity:0}
@keyframes mt{0%{opacity:0;transform:translate(0,4px)}30%{opacity:var(--o,.85)}70%{opacity:calc(var(--o,.85)*.55)}100%{opacity:0;transform:translate(var(--x,3px),-18px)}}
.tk{animation:tk var(--d,3s) ease-in-out infinite;animation-delay:calc(var(--dl,0s) - var(--f,0s));transform-origin:0 0;opacity:0}
@keyframes tk{0%,100%{opacity:0;transform:scale(.2) rotate(0)}50%{opacity:var(--o,.9);transform:scale(1) rotate(45deg)}}
.kb{animation:kb var(--d,2.8s) ease-in-out infinite;animation-delay:calc(var(--dl,0s) - var(--f,0s));transform-origin:0 4px}
@keyframes kb{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-3px) scale(.92,1.1)}}
.hl{animation:hl 48s linear infinite;animation-delay:calc(0s - var(--f,0s))}
@keyframes hl{to{transform:rotate(360deg)}}
.pu{animation:pu var(--d,4s) ease-in-out infinite;animation-delay:calc(var(--dl,0s) - var(--f,0s))}
@keyframes pu{0%,100%{opacity:var(--o0,.35)}50%{opacity:var(--o,.9)}}
.fz *{animation-play-state:paused!important}
'''

def sty(**kw):
    m = {'a': '--a', 'dl': '--dl', 'd': '--d', 'o': '--o', 'x': '--x', 'o0': '--o0'}
    out = []
    for k, v in kw.items():
        if v is None:
            continue
        unit = 'deg' if k == 'a' else ('s' if k in ('dl', 'd') else ('px' if k == 'x' else ''))
        out.append(f'{m[k]}:{v:.2f}{unit}' if isinstance(v, float) else f'{m[k]}:{v}{unit}')
    return ';'.join(out)

def capsule(L, r0, r1):
    """Khúc thon từ (0,0) bán kính r0 lên (0,-L) bán kính r1; hai đầu tròn để khớp liền."""
    return f'M{-r0:.2f} 0L{-r1:.2f} {-L:.2f}A{r1:.2f} {r1:.2f} 0 0 1 {r1:.2f} {-L:.2f}L{r0:.2f} 0A{r0:.2f} {r0:.2f} 0 0 1 {-r0:.2f} 0Z'

def _chain(segs, amp, dl, step, end, period, mode, i=0):
    if i == len(segs):
        if not end:
            return ''
        return f'<g class="sg" style="{sty(a=amp[min(i, len(amp) - 1)], dl=-(dl + i * step), d=period)}">{end}</g>'
    L, r0, r1, rel, fill, shade, hi = segs[i][:7]
    deco = segs[i][7] if len(segs[i]) > 7 else ''
    if mode == 'shade':
        body = f'<path d="{capsule(L, r0, r1)}" fill="{shade or fill}"/>'
    else:
        k = .84 if shade else 1
        dx = -(r0 + r1) * .5 * (1 - k)
        body = f'<g transform="translate({dx:.2f} 0)"><path d="{capsule(L, r0 * k, r1 * k)}" fill="{fill}"/></g>'
        if hi:
            body += f'<path d="M{-r0*.5:.2f} {-L*.05:.2f}L{-r1*.5:.2f} {-L*.95:.2f}" stroke="{hi}" stroke-width="{max(1.1, (r0+r1)*.12):.2f}" stroke-linecap="round" opacity=".55"/>'
        body += deco
    inner = _chain(segs, amp, dl, step, end, period, mode, i + 1)
    return (f'<g transform="rotate({rel})"><g class="sg" style="{sty(a=amp[min(i, len(amp) - 1)], dl=-(dl + i * step), d=period)}">'
            f'{body}<g transform="translate(0 {-L})">{inner}</g></g></g>')

def chain(segs, amp, dl, step, end='', period=3.6, end_shade=''):
    """segs: [(L, r0, r1, rel_deg, fill, shade, hi)]. Khúc sau lồng trong khúc trước:
    trễ pha + biên độ tăng dần về chóp = overlapping action.
    Hai lượt cùng nhịp (bóng tối đủ cỡ, rồi màu chính hẹp hơn lệch trái) để khớp nối không lộ vệt."""
    has_shade = any(s[5] for s in segs)
    o = _chain(segs, amp, dl, step, end_shade, period, 'shade') if has_shade else ''
    return o + _chain(segs, amp, dl, step, end, period, 'fill')

# ---------- lights: nhỏ, mờ, trôi chậm ----------
def light_defs(p, core='#FFFFFF', glow='#9FE0FF'):
    return (f'<radialGradient id="{p}mo"><stop offset="0" stop-color="{core}"/><stop offset=".3" stop-color="{glow}" stop-opacity=".75"/>'
            f'<stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient>')

def motes(p, pts, grad='mo'):
    """pts: [(x, y, r, dur, delay, drift)] — đốm sáng r 1–2.5, quầng mềm bằng gradient (không filter)."""
    o = ''
    for x, y, r, d, dl, dx in pts:
        o += (f'<g transform="translate({x} {y})"><g class="mt" style="{sty(d=d, dl=-dl, x=dx)}">'
              f'<circle r="{r*2.6:.1f}" fill="url(#{p}{grad})"/><circle r="{r*.45:.2f}" fill="#fff"/></g></g>')
    return o

def twinkles(pts, c='#FFF6CF'):
    """Sao 4 cánh mảnh, nhỏ (r 2–4), nhấp nháy lệch nhịp."""
    o = ''
    for x, y, r, d, dl in pts:
        w = r * .16
        o += (f'<g transform="translate({x} {y})"><g class="tk" style="{sty(d=d, dl=-dl)}">'
              f'<path d="M0 {-r}C{w} {-w} {w} {-w} {r} 0C{w} {w} {w} {w} 0 {r}C{-w} {w} {-w} {w} {-r} 0C{-w} {-w} {-w} {-w} 0 {-r}Z" fill="{c}"/></g></g>')
    return o

def foxfire(p, x, y, s=1, dl=0, c1='#BDEBFF', c2='#6CC8FF'):
    """Kitsunebi: ngọn lửa ma nhỏ (cao ~10), lõi trắng, lắc lư nhẹ."""
    return (f'<g transform="translate({x} {y}) scale({s})"><g class="kb" style="{sty(dl=-dl)}">'
            f'<circle cy="1" r="7" fill="url(#{p}mo)" opacity=".55"/>'
            f'<path d="M0 -8C2.6 -4 4.4 -1 4.4 2C4.4 4.8 2.4 6.4 0 6.4C-2.4 6.4 -4.4 4.8 -4.4 2C-4.4 -.4 -2.6 -2.4 -1 -3.4C-1 -1.6 0 -1 .4 -1.6C.8 -3.6 .4 -6 0 -8Z" fill="{c2}"/>'
            f'<path d="M0 -2.6C1.4 -.6 2.2 1 2.2 2.4C2.2 3.8 1.2 4.6 0 4.6C-1.2 4.6 -2.2 3.8 -2.2 2.4C-2.2 1 -1 0 0 -2.6Z" fill="{c1}"/>'
            f'<circle cy="2.6" r="1.1" fill="#fff"/></g></g>')

def halo(cx, cy, r, c, c2=None, dots=True):
    """Vòng hào quang mảnh: 1 nét .8 + vòng chấm xoay rất chậm."""
    o = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{c}" stroke-width=".8" opacity=".45"/>'
    if dots:
        o += (f'<g transform="translate({cx} {cy})"><g class="hl"><circle r="{r+6}" fill="none" stroke="{c2 or c}" stroke-width="1.5" '
              f'stroke-dasharray=".1 7.2" stroke-linecap="round" opacity=".7"/></g></g>')
    return o

def glow(p, cx, cy, r, c, op=.32, name='gw'):
    return (f'<radialGradient id="{p}{name}"><stop offset="0" stop-color="{c}" stop-opacity="{op}"/><stop offset=".55" stop-color="{c}" stop-opacity="{op*.35:.3f}"/>'
            f'<stop offset="1" stop-color="{c}" stop-opacity="0"/></radialGradient>', f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{p}{name})"/>')
