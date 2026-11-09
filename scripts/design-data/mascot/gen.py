# Mascot v3 sample generator: chibi, no ink outline, soft shading.
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

EYE = '#2A1D35'

def common_defs(p):
    return f'''
<filter id="{p}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
<filter id="{p}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>
'''

def eyes(p, iris, kind='open', y=80, dx=22):
    xs = (80 - dx, 80 + dx)
    if kind == 'happy':
        return ''.join(f'<path d="M{x-8} {y+2}q8 -10 16 0" stroke="{EYE}" stroke-width="4.4" fill="none" stroke-linecap="round"/>' for x in xs)
    if kind == 'closed':
        return ''.join(f'<path d="M{x-8} {y}q8 7 16 0" stroke="{EYE}" stroke-width="4" fill="none" stroke-linecap="round"/>' for x in xs)
    o = ''
    for i, x in enumerate(xs):
        cid = f'{p}eye{i}'
        o += f'<clipPath id="{cid}"><ellipse cx="{x}" cy="{y}" rx="9.5" ry="12"/></clipPath>'
        o += f'<ellipse cx="{x}" cy="{y}" rx="9.5" ry="12" fill="{EYE}"/>'
        o += f'<ellipse clip-path="url(#{cid})" cx="{x}" cy="{y+10}" rx="10" ry="7" fill="{iris}" opacity=".9"/>'
        o += f'<circle cx="{x-3}" cy="{y-5}" r="4" fill="#fff"/><circle cx="{x+3.5}" cy="{y+4}" r="1.9" fill="#fff"/>'
    return o

def blush(p, y=95, dx=34, c='#FF8FA8'):
    return f'<g filter="url(#{p}blur)" opacity=".75"><ellipse cx="{80-dx}" cy="{y}" rx="8" ry="5" fill="{c}"/><ellipse cx="{80+dx}" cy="{y}" rx="8" ry="5" fill="{c}"/></g>'

def mouth(kind='w', y=95, c=EYE):
    if kind == 'w':
        return f'<path d="M73.5 {y}q3.25 3.6 6.5 0q3.25 3.6 6.5 0" stroke="{c}" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    if kind == 'open':
        return f'<path d="M73 {y-1}q7 0 14 0q-1 9 -7 9q-6 0 -7 -9Z" fill="#B23A55"/><path d="M76 {y+5}q4 -3 8 0q-1 3 -4 3q-3 0 -4 -3Z" fill="#FF8FA8"/>'
    if kind == 'o':
        return f'<ellipse cx="80" cy="{y+2}" rx="3.6" ry="4.6" fill="#B23A55"/>'
    if kind == 'sad':
        return f'<path d="M74 {y+4}q6 -5 12 0" stroke="{c}" stroke-width="2.3" fill="none" stroke-linecap="round"/>'
    return ''

def arm(color, pad, deg, sx, sy, cls=''):
    a = (f'<g transform="translate({sx} {sy}) rotate({deg})">'
         f'<rect x="-7" y="-4" width="14" height="26" rx="7" fill="{color}"/>'
         f'<ellipse cx="0" cy="21" rx="7.6" ry="7" fill="{pad}"/>'
         f'<path d="M-3 25.5v2.2M0 26v2.4M3 25.5v2.2" stroke="#000" stroke-opacity=".18" stroke-width="1.3" stroke-linecap="round"/></g>')
    if cls:
        return f'<g class="{cls}" style="transform-origin:{sx}px {sy}px">{a}</g>'
    return a

def feet(color, toe='#000'):
    o = ''
    for x in (66, 94):
        o += f'<ellipse cx="{x}" cy="146" rx="12" ry="7.5" fill="{color}"/>'
        o += f'<path d="M{x-4} 147.5v3M{x} 148v3.2M{x+4} 147.5v3" stroke="{toe}" stroke-opacity=".2" stroke-width="1.4" stroke-linecap="round"/>'
    return o

# ---------------- KITSU ----------------
def kitsu(stage='adult', pose='idle', p='k'):
    O, O2, O3 = '#F59A45', '#E07F2C', '#FFC07A'   # orange base, shade, light
    W, W2 = '#FFF6EA', '#F1DCC4'
    D = '#6B3826'   # dark socks / ear tips
    defs = common_defs(p) + f'''
<radialGradient id="{p}hd" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="{O3}"/><stop offset=".55" stop-color="{O}"/><stop offset="1" stop-color="{O2}"/></radialGradient>
<radialGradient id="{p}bd" cx=".4" cy=".25" r=".85"><stop offset="0" stop-color="{O3}"/><stop offset=".6" stop-color="{O}"/><stop offset="1" stop-color="{O2}"/></radialGradient>
<clipPath id="{p}bodyc"><ellipse cx="80" cy="124" rx="27" ry="23"/></clipPath>
<clipPath id="{p}earL"><path d="M38 58Q26 22 34 6Q56 14 70 40Z"/></clipPath>
<clipPath id="{p}earR"><path d="M122 58Q134 22 126 6Q104 14 90 40Z"/></clipPath>
'''
    def tail(rot=55, s=1.0, tip=W):
        return (f'<g transform="translate(84 134) rotate({rot}) scale({s})">'
                f'<path d="M0 0C-18 -10 -26 -40 -14 -66C-6 -82 14 -82 18 -66C24 -42 16 -14 0 0Z" fill="url(#{p}bd)"/>'
                f'<path d="M-14 -66C-6 -82 14 -82 18 -66C14 -60 10 -62 8 -56C4 -62 0 -58 -4 -60C-8 -56 -10 -62 -14 -66Z" fill="{tip}"/>'
                f'<path d="M-4 -20q4 -6 2 -14M6 -30q3 -6 0 -12" stroke="{O2}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>')
    ntails = {'baby': 1, 'teen': 3, 'adult': 5, 'legend': 9}[stage]
    rots = {1: [58], 3: [-58, 50, 74], 5: [-80, -56, 52, 76, 30], 9: [-100, -75, -50, -25, 0, 25, 50, 75, 100]}[ntails]
    ts = 1.35 if stage == 'legend' else 1.0
    tip = '#DDF4FF' if stage == 'legend' else W
    back = ''.join(tail(r, ts, tip) for r in rots)
    # ears
    ear = (f'<path d="M38 58Q26 22 34 6Q56 14 70 40Z" fill="url(#{p}hd)"/>'
           f'<path d="M122 58Q134 22 126 6Q104 14 90 40Z" fill="url(#{p}hd)"/>'
           f'<g clip-path="url(#{p}earL)"><path d="M20 0L46 0L40 22Q32 20 24 26Z" fill="{D}"/></g>'
           f'<g clip-path="url(#{p}earR)"><path d="M140 0L114 0L120 22Q128 20 136 26Z" fill="{D}"/></g>'
           f'<path d="M43 50Q36 30 40 20Q52 26 62 40Z" fill="#FFC9B5"/><path d="M117 50Q124 30 120 20Q108 26 98 40Z" fill="#FFC9B5"/>'
           f'<path d="M44 46q4 -6 3 -12M48 46q4 -4 5 -10M116 46q-4 -6 -3 -12M112 46q-4 -4 -5 -10" stroke="{W}" stroke-width="2.2" fill="none" stroke-linecap="round"/>')
    # cheek fluff tufts
    tufts = (f'<path d="M34 80L22 86L32 90L24 98L36 98L32 106L44 100Z" fill="{O}"/>'
             f'<path d="M126 80L138 86L128 90L136 98L124 98L128 106L116 100Z" fill="{O}"/>')
    head = (f'<ellipse cx="80" cy="72" rx="51" ry="43" fill="url(#{p}hd)"/>'
            f'<path d="M30 80C32 106 54 116 80 116C106 116 128 106 130 80C120 92 104 94 92 88C88 96 84 100 80 100C76 100 72 96 68 88C56 94 40 92 30 80Z" fill="{W}"/>'
            f'<path d="M72 38q8 -6 16 0q-4 6 -8 10q-4 -4 -8 -10Z" fill="{O2}" opacity=".55"/>'
            f'<ellipse cx="62" cy="46" rx="15" ry="7" fill="#fff" opacity=".35" transform="rotate(-18 62 46)"/>'
            f'<circle cx="74" cy="56" r="2.6" fill="#E2483E"/><circle cx="86" cy="56" r="2.6" fill="#E2483E"/>')
    nose = f'<path d="M76 89.5q4 -2 8 0q-1 3.5 -4 4q-3 -.5 -4 -4Z" fill="{EYE}"/><circle cx="78.4" cy="90" r=".9" fill="#fff" opacity=".8"/>'
    body = (f'<ellipse cx="80" cy="124" rx="27" ry="23" fill="url(#{p}bd)"/>'
            f'<g clip-path="url(#{p}bodyc)"><ellipse cx="80" cy="104" rx="30" ry="9" fill="{O2}" opacity=".6"/>'
            f'<path d="M66 108L70 114L66 120L72 124L68 132L76 134L80 142L84 134L92 132L88 124L94 120L90 114L94 108Z" fill="{W}"/></g>')
    collar = ''
    if stage in ('teen', 'adult'):
        collar = (f'<path d="M56 112Q80 124 104 112" stroke="#D93B3B" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
                  f'<circle cx="80" cy="121" r="6" fill="#FFC93C"/><path d="M75.5 121.5h9" stroke="#B8860B" stroke-width="1.4"/><circle cx="80" cy="124" r="1.2" fill="#8A5A12"/><circle cx="78" cy="119" r="1.6" fill="#fff" opacity=".8"/>')
    if stage == 'legend':
        collar = (f'<path d="M56 112Q80 124 104 112" stroke="#6E4BD8" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
                  f'<path d="M80 113l3.5 6.5l7 1l-5 5l1.2 7l-6.7 -3.5l-6.7 3.5l1.2 -7l-5 -5l7 -1Z" fill="#FFE27A"/>')
    face_k = {'happy': 'happy', 'levelup': 'happy'}.get(pose, 'open')
    mth = {'happy': 'open', 'levelup': 'open', 'hello': 'open', 'surprised': 'o'}.get(pose, 'w')
    face = eyes(p, '#B0672E', face_k) + blush(p) + nose + mouth(mth, 96)
    A = {'idle': (12, -12), 'hello': (140, -12), 'happy': (150, -150), 'levelup': (158, -158), 'surprised': (100, -100), 'hold': (-50, 50)}[pose]
    armB = arm(O, D, A[1], 106, 116) if A[1] > -90 else ''
    armF = arm(O, D, A[0], 54, 116, 'wv' if pose == 'hello' else '') + (arm(O, D, A[1], 106, 116) if A[1] <= -90 else '')
    fig = back + feet(D) + armB + body + collar + ear + tufts + head + face + armF
    if stage == 'legend':
        fig += '<path d="M80 30l4 7l-4 7l-4 -7Z" fill="#7FD3FF"/>'
    return defs, fig

def wrap(defs, fig, stage, w=220, vb='-30 -30 220 190'):
    s = {'egg': 1, 'baby': .72, 'teen': .84, 'adult': .92, 'legend': 1}[stage]
    return (f'<svg viewBox="{vb}" width="{w}" xmlns="http://www.w3.org/2000/svg"><defs>{defs}</defs>'
            f'<ellipse cx="80" cy="151" rx="{56*s}" ry="6" fill="#000" opacity=".08"/>'
            f'<g transform="translate(80 150) scale({s}) translate(-80 -150)">{fig}</g></svg>')

def page(cells, name, W=1400, H=900):
    html = '<html><body style="margin:0;background:#FBF6EA;display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;padding:12px">' + ''.join(cells) + '</body></html>'
    f = os.path.join(HERE, name + '.html'); open(f, 'w', encoding='utf-8').write(html)
    png = os.path.join(HERE, name + '.png')
    subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--user-data-dir=' + os.path.join(HERE, 'edge'), f'--window-size={W},{H}', '--virtual-time-budget=800', '--screenshot=' + png, 'file:///' + f.replace('\\', '/')], check=True, capture_output=True)
    return png

if __name__ == '__main__':
    cells = []
    i = 0
    for st in ('baby', 'teen', 'adult', 'legend'):
        d, f = kitsu(st, 'idle', p='k%d' % i); i += 1
        cells.append(wrap(d, f, st, 300))
    for po in ('hello', 'happy', 'surprised'):
        d, f = kitsu('adult', po, p='k%d' % i); i += 1
        cells.append(wrap(d, f, 'adult', 300))
    for w in (84, 48):
        d, f = kitsu('adult', 'idle', p='k%d' % i); i += 1
        cells.append(wrap(d, f, 'adult', w))
    print(page(cells, 'kitsu'))
