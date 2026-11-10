# Mascot v4.1 — lớp chi tiết: đuôi lông 7 khúc mượt (một lượt, tô gradient ngang thân), túm lông mép,
# chóp nhiều lớp, mắt có mống mắt chuyển màu + mi, đồ trang sức Huyền thoại.
from gen import EYE
import gen
from fx4 import capsule, sty, twinkles

def mix(a, b, t):
    a = a.lstrip('#'); b = b.lstrip('#')
    return '#' + ''.join('%02X' % round(int(a[i:i+2], 16) * (1 - t) + int(b[i:i+2], 16) * t) for i in (0, 2, 4))

def tube_grads(p, name, light, base, shade):
    """Gradient ngang thân đuôi: R = sáng bên trái khúc (đuôi chĩa sang phải), L = ngược lại."""
    st = lambda a, b, c: f'<stop offset="0" stop-color="{a}"/><stop offset=".42" stop-color="{b}"/><stop offset="1" stop-color="{c}"/>'
    return (f'<linearGradient id="{p}{name}R" x1="0" y1="0" x2="1" y2="0">{st(light, base, shade)}</linearGradient>'
            f'<linearGradient id="{p}{name}L" x1="0" y1="0" x2="1" y2="0">{st(shade, base, light)}</linearGradient>')

def plume(radii, L, bends, fill, amp, dl, step, period, end='', tuft=None, deco=None, i=0):
    """Chuỗi khúc lồng nhau, bán kính theo `radii` (n+1 giá trị). fill: chuỗi hoặc hàm(i).
    amp=(gốc, chóp) độ; khúc sau trễ `step` giây. tuft=(màu mép trái, màu mép phải, cỡ)."""
    n = len(radii) - 1
    a = amp[0] + (amp[1] - amp[0]) * i / n
    st = sty(a=float(a), dl=-(dl + i * step), d=period)
    if i == n:
        return f'<g class="sg" style="{st}">{end}</g>' if end else ''
    r0, r1 = radii[i], radii[i + 1]
    f = fill(i) if callable(fill) else fill
    body = ''
    if tuft and i >= 1:
        cl, cr, sz = tuft
        m = (r0 + r1) / 2
        if i % 2:
            body += f'<path d="M{-r0*.9:.2f} {-L*.05:.2f}L{-m-sz:.2f} {-L*1.02:.2f}L{-r1*.7:.2f} {-L*.72:.2f}Z" fill="{cl}"/>'
        else:
            body += f'<path d="M{r0*.9:.2f} {-L*.05:.2f}L{m+sz:.2f} {-L*1.02:.2f}L{r1*.7:.2f} {-L*.72:.2f}Z" fill="{cr}"/>'
    body += f'<path d="{capsule(L, r0, r1)}" fill="{f}"/>'
    if deco:
        body += deco(i, L, r0, r1)
    inner = plume(radii, L, bends, fill, amp, dl, step, period, end, tuft, deco, i + 1)
    return f'<g transform="rotate({bends[i]})"><g class="sg" style="{st}">{body}<g transform="translate(0 {-L})">{inner}</g></g></g>'

# ---------------- đuôi cáo ----------------
FOX_R = [3.0, 5.0, 7.2, 9.0, 10.0, 9.8, 8.8, 7.5]
FOX_B = [0, -4, -6, -7, -7, -5, -3]

def fox_tip(p, k, W, lg):
    if lg:   # chóp xanh băng, đai vàng ở chỗ nối
        shape = 'M-7.5 0C-9.6 -8 -6.6 -18 -1.6 -29C-.6 -24.6 1.2 -23 3.2 -23.4C2.2 -20 3.8 -17 6.2 -16C5.6 -13.4 7 -11.2 8.9 -10.6C9.1 -6.4 8.5 -3 7.5 0Q0 3.4 -7.5 0Z'
        o = (f'<path d="{shape}" fill="url(#{p}tp)"/>'
             '<path d="M3.4 -22C6.6 -15 8.8 -8 7.5 0L4.4 .8C5.4 -7 5 -15 3.4 -22Z" fill="#6DBEF0" opacity=".45"/>'
             '<path d="M-4 -5Q-4.6 -14 -1.8 -22" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".95"/>'
             '<path d="M-.4 -6Q-.6 -11 .8 -15" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>'
             '<path d="M-7.7 .2Q0 4.2 7.7 .2" stroke="#E9A93A" stroke-width="2.8" fill="none" stroke-linecap="round"/>'
             '<path d="M-6.4 -.2Q0 3 6.4 -.2" stroke="#FFF1B8" stroke-width=".9" fill="none" stroke-linecap="round"/>'
             '<circle cx="0" cy="2.3" r="1.3" fill="#E2483E"/><circle cx="-.4" cy="1.9" r=".45" fill="#fff"/>')
    else:    # chóp kem, chân răng cưa ăn vào phần cam
        shape = ('M-7.5 0C-9.6 -8 -6.6 -18 -1.6 -29C-.6 -24.6 1.2 -23 3.2 -23.4C2.2 -20 3.8 -17 6.2 -16C5.6 -13.4 7 -11.2 8.9 -10.6C9.1 -6.4 8.5 -3 7.5 0'
                 'L5.4 4.6L3 .8L0 5.4L-3 .8L-5.4 4.6Z')
        o = (f'<path d="{shape}" fill="{W}"/>'
             '<path d="M3.4 -22C6.6 -15 8.8 -8 7.5 0L5.4 4.6L4.2 1C5.4 -7 5 -15 3.4 -22Z" fill="#E6CFB4" opacity=".75"/>'
             '<path d="M-4 -5Q-4.6 -14 -1.8 -22" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".95"/>'
             '<path d="M-.2 -4Q-.4 -9 .8 -13" stroke="#EAD6BE" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>')
    return f'<g transform="rotate({12 * k if k else -8})">{o}</g>'

def fox_tail(p, rot, s, idx, O, O2, O3, W, lg, root=(82, 134)):
    k = (rot > 0) - (rot < 0)
    side = 'L' if k < 0 else 'R'
    tuft = (O2, O3, 2.2) if k < 0 else (O3, O2, 2.2)
    def deco(i, L, r0, r1):
        if lg and i == 4:   # vân xoáy vàng
            return '<path d="M-2.6 -1.4C1.6 -1.6 2.6 -6 -.6 -6.6C-2.6 -6.8 -2.8 -4.2 -1 -4.2" stroke="#E9A93A" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/>'
        if i in (2, 5):     # sợi lông
            c = '#E3C296' if lg else O2
            return f'<path d="M{-r0*.2:.1f} -1q1.6 -3.4 .4 -7M{r0*.3:.1f} -2.4q1.4 -2.6 .2 -5.6" stroke="{c}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>'
        return ''
    body = plume(FOX_R, 8.4, [b * k for b in FOX_B], f'url(#{p}tg{side})', (1.0, 5.6), idx * .34, .12, 3.8, fox_tip(p, k, W, lg), tuft, deco)
    return f'<g transform="translate({root[0]} {root[1]}) rotate({rot}) scale({s})">{body}</g>'

# ---------------- đuôi sói ----------------
def wolf_tail(p, stage):
    lg = stage == 'legend'
    R = [4.6, 7.2, 9.6, 11.4, 12.2, 11.6, 10.0, 8.2]
    B = [0, -6, -8, -9, -9, -7, -5]
    if lg:   # ngân hà: chàm → tím → xanh lam về chóp
        cols = [mix('#34308F', '#7B5BE6', i / 6) if i < 5 else mix('#7B5BE6', '#6FB4F2', (i - 4) / 3) for i in range(7)]
        fill = lambda i: cols[i]
        tuft = ('#8E7BF2', '#2A2878', 2.6)
        def deco(i, L, r0, r1):
            o = f'<path d="M{-r0*.62:.2f} 0L{-r1*.62:.2f} {-L:.2f}" stroke="#B9A8FF" stroke-width="{r0*.22:.2f}" stroke-linecap="round" opacity=".35"/>'
            st = {1: (2, -3, 1.6, .9), 2: (-3, -4, 2.4, 0), 3: (4, -3, 1.8, 1.7), 4: (-2, -5, 2.8, 2.4), 5: (3, -2, 1.6, .5), 6: (-1, -4, 2, 1.2)}.get(i)
            if st:
                o += twinkles([(st[0], st[1], st[2], 3, st[3])], '#FFF6CF')
            if i in (2, 4):
                o += f'<circle cx="{4 if i == 2 else -4}" cy="-1.5" r=".7" fill="#fff" opacity=".8"/>'
            return o
        Tip, TipS = '#FFF3B8', '#E9C766'
        defs = ''
    else:
        fill = f'url(#{p}wtR)'
        tuft = ('#A3B1D4', '#4F5C88', 2.6)
        def deco(i, L, r0, r1):
            if i in (2, 4, 5):
                return f'<path d="M{-r0*.2:.1f} -1q1.6 -3 .4 -6.4M{r0*.34:.1f} -2q1.4 -2.4 .2 -5" stroke="#5C6A94" stroke-width="1" fill="none" stroke-linecap="round" opacity=".5"/>'
            return ''
        Tip, TipS = '#FFF8EE', '#D5DAE8'
        defs = tube_grads(p, 'wt', '#A3B1D4', '#7888B4', '#4F5C88')
    shape = ('M-8.2 0C-10.4 -7 -7.2 -16 -1.6 -24C-.6 -20.4 1.6 -19.4 3.6 -19.8C2.6 -17 4.2 -14.4 6.6 -13.6C6 -11.4 7.6 -9.4 9.4 -9C9.6 -5.6 9.2 -2.6 8.2 0'
             'L5.8 4.4L3 .6L0 5L-3 .6L-5.8 4.4Z')
    tip = (f'<g transform="rotate(-8)"><path d="{shape}" fill="{Tip}"/>'
           f'<path d="M3.8 -18.6C7 -13 9.4 -7 8.2 0L5.8 4.4L4.6 .8C5.8 -6 5.4 -12 3.8 -18.6Z" fill="{TipS}" opacity=".8"/>'
           '<path d="M-4.4 -4Q-5 -12 -2 -18.6" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".95"/></g>')
    s = {'baby': .92, 'teen': 1.04, 'adult': 1.14, 'legend': 1.36}[stage]
    body = plume(R, 7.6, B, fill, (1.4, 7), 0, .13, 3.4, tip, tuft, deco)
    return f'{defs}<g transform="translate(102 136) rotate(74) scale({s})">{body}</g>'

# ---------------- đuôi rồng ----------------
def dragon_tail(p, stage, G, G2, Bl, G3='#B4F2D2'):
    lg = stage == 'legend'
    sp, sp2 = ('#FFB35A', '#FFE08A') if lg else ('#FF9A5A', '#FFC08A')
    R = [9.6, 8.9, 8.1, 7.2, 6.2, 5.2, 4.3, 3.5]
    B = [0, -11, -13, -14, -14, -13, -12]
    def deco(i, L, r0, r1):
        o = f'<path d="M{-r0*.72:.2f} 0L{-r1*.72:.2f} {-L:.2f}" stroke="{Bl}" stroke-width="{r0*.42:.2f}" stroke-linecap="round" opacity=".9"/>'   # bụng
        o += f'<path d="M{-r0*.98:.2f} {-L*.5:.2f}h{r0*.5:.2f}" stroke="#D9A94E" stroke-width=".8" stroke-linecap="round" opacity=".55"/>'           # nếp giáp bụng
        if i % 2 == 0:   # vảy
            o += f'<path d="M{r0*.05:.2f} {-L*.3:.2f}q{r0*.3:.2f} {-L*.3:.2f} {r0*.6:.2f} 0" stroke="{G2}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>'
        if stage != 'baby' and i >= 1:   # gai lưng 2 lớp
            o += (f'<path d="M{r0*.7:.2f} {-L*.02:.2f}L{r0+4.2:.2f} {-L*.62:.2f}L{r1*.7:.2f} {-L*.98:.2f}Z" fill="{sp}"/>'
                  f'<path d="M{r0*.76:.2f} {-L*.3:.2f}L{r0+2.2:.2f} {-L*.6:.2f}L{r1*.76:.2f} {-L*.82:.2f}Z" fill="{sp2}"/>')
        return o
    if lg:   # ngọn lửa nhỏ 3 lớp ở chóp
        tip = ('<g transform="rotate(-16)"><g class="kb" style="--d:1.4s"><path d="M0 2.4C-5.4 -2 -5.6 -9 -.4 -18C.6 -12.6 3 -11.4 3.6 -13.6C6.4 -7.4 5.6 -1.4 0 2.4Z" fill="#FF6A3C"/>'
               '<path d="M0 1C-3.4 -1.8 -3.6 -6.4 0 -12C3 -7 3.2 -2.2 0 1Z" fill="#FFB24A"/><path d="M0 .2C-1.8 -1.4 -1.8 -3.8 0 -6.6C1.8 -3.8 1.8 -1.4 0 .2Z" fill="#FFF3B0"/></g></g>')
    else:    # chóp hình lá có gân
        tip = (f'<g transform="rotate(-14)"><path d="M-3.4 0C-9.4 -2 -10.6 -9.6 -6.2 -13C-3.2 -10.8 -1 -13 0 -19C1 -13 3.2 -10.8 6.2 -13C10.6 -9.6 9.4 -2 3.4 0Z" fill="{sp}"/>'
               f'<path d="M0 -17C1 -12 3.2 -10.6 6 -12.6C9.6 -9.4 8.8 -2.4 3.4 0L0 -1Z" fill="#E8773C" opacity=".45"/>'
               '<path d="M0 -1.6V-14M0 -5l-3.4 -3M0 -8l3.2 -2.6" stroke="#fff" stroke-opacity=".55" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>')
    s = {'baby': .86, 'teen': 1.0, 'adult': 1.1, 'legend': 1.3}[stage]
    body = plume(R, 6.4, B, f'url(#{p}dtR)', (1.6, 7.6), 0, .12, 3.2, tip, None, deco)
    return f'{tube_grads(p, "dt", G3, G, G2)}<g transform="translate(96 138) rotate(98) scale({s})">{body}</g>'

# ---------------- mắt v4 ----------------
def eyes4(p, iris, kind='open', y=80, dx=22):
    if kind != 'open':
        return gen.eyes(p, iris, kind, y, dx)
    hi, lo = mix(iris, '#FFFFFF', .5), mix(iris, EYE, .55)
    o = (f'<linearGradient id="{p}ir" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="{EYE}"/><stop offset=".56" stop-color="{lo}"/>'
         f'<stop offset=".8" stop-color="{iris}"/><stop offset="1" stop-color="{hi}"/></linearGradient>')
    for i, x in enumerate((80 - dx, 80 + dx)):
        sd = -1 if i == 0 else 1
        cid = f'{p}eye{i}'
        o += f'<clipPath id="{cid}"><ellipse cx="{x}" cy="{y}" rx="9.5" ry="12"/></clipPath>'
        o += f'<ellipse cx="{x}" cy="{y}" rx="9.5" ry="12" fill="url(#{p}ir)"/>'
        o += (f'<g clip-path="url(#{cid})"><ellipse cx="{x}" cy="{y+1.5}" rx="4.2" ry="5.4" fill="#150B20" opacity=".6"/>'
              f'<path d="M{x-7} {y+7.5}Q{x} {y+13.5} {x+7} {y+7.5}" stroke="{hi}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/>'
              f'<ellipse cx="{x}" cy="{y-13}" rx="11" ry="6" fill="#000" opacity=".28"/></g>')
        o += (f'<circle cx="{x-3.2}" cy="{y-5}" r="4.1" fill="#fff"/><circle cx="{x+3.7}" cy="{y+4.6}" r="1.9" fill="#fff"/>'
              f'<circle cx="{x+4.4}" cy="{y-6.6}" r="1" fill="#fff" opacity=".85"/>')
        # mi trên + đuôi mi hất
        o += (f'<path d="M{x-9.3} {y-4.6}Q{x-7} {y-12.6} {x} {y-12.6}Q{x+7} {y-12.6} {x+9.3} {y-4.6}" stroke="{EYE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
              f'<path d="M{x+sd*8.8} {y-5.6}q{sd*2.2} -.6 {sd*3.4} -2.8" stroke="{EYE}" stroke-width="1.8" fill="none" stroke-linecap="round"/>')
    return o

def whiskers(c='#2A1D35', y=92, op=.3):
    """Chấm ria + 2 sợi ria mảnh mỗi bên."""
    o = ''
    for sd in (-1, 1):
        x = 80 + sd * 15
        o += f'<circle cx="{x}" cy="{y}" r=".9" fill="{c}" opacity="{op+.15}"/><circle cx="{x+sd*3.4}" cy="{y+2.6}" r=".8" fill="{c}" opacity="{op+.15}"/>'
        o += (f'<path d="M{80+sd*33} {y-1}q{sd*8} -2.4 {sd*14} -1.4M{80+sd*33} {y+3.4}q{sd*8} .6 {sd*13} 3" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity=".75"/>')
    return o
