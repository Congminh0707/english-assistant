# Build the canvas artboards from chars.py figures.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chars import CHARS, egg, arm, star
import chars2
import chars3


# Bảng thiết kế (.dc.html) cho canvas; mặc định ghi vào content/.build/mascot-boards (không commit)
OUT = os.environ.get('MASCOT_BOARD_OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'content', '.build', 'mascot-boards', 'project')
SC = {'egg': 1, 'baby': .72, 'teen': .84, 'adult': .92, 'legend': 1}
CSS = '''body{margin:0}
a{color:#0E6B45}a:hover{color:#09402A}
.br{animation:br 2.6s ease-in-out infinite;transform-origin:80px 150px}
@keyframes br{50%{transform:scale(1.025,.975)}}
.bob{animation:bob .5s ease-in-out infinite;transform-origin:80px 150px}
@keyframes bob{50%{transform:translateY(-4px)}}
.hop{animation:hop .7s cubic-bezier(.3,0,.4,1) infinite;transform-origin:80px 150px}
@keyframes hop{0%,100%{transform:translateY(0) scale(1.04,.96)}45%{transform:translateY(-14px) scale(.97,1.03)}}
.jmp{animation:jmp 1s cubic-bezier(.3,0,.4,1) infinite;transform-origin:80px 150px}
@keyframes jmp{0%,100%{transform:translateY(0) scale(1.06,.92)}20%{transform:none}55%{transform:translateY(-22px)}}
.fl{animation:fl 3.2s ease-in-out infinite}
@keyframes fl{50%{transform:translateY(-7px)}}
.wob{animation:wob 2.4s ease-in-out infinite}
@keyframes wob{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.wv{animation:wv .9s ease-in-out infinite}
@keyframes wv{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
.swa{animation:sw .5s ease-in-out infinite alternate}.swb{animation:sw .5s ease-in-out infinite alternate-reverse}
@keyframes sw{from{transform:rotate(-20deg)}to{transform:rotate(20deg)}}
.chl{animation:ch .35s ease-in-out infinite alternate}.chr{animation:ch .35s ease-in-out infinite alternate-reverse}
@keyframes ch{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}
.wag{animation:wag 1.8s ease-in-out infinite}
@keyframes wag{50%{transform:rotate(6deg)}}
.fan{animation:fan 3s ease-in-out infinite}
@keyframes fan{50%{transform:scale(1.04)}}
.flL{animation:flL 1.6s ease-in-out infinite}.flR{animation:flR 1.6s ease-in-out infinite}
@keyframes flL{50%{transform:rotate(-7deg)}}@keyframes flR{50%{transform:rotate(7deg)}}
.wgL{animation:wgL 1.4s ease-in-out infinite}.wgR{animation:wgR 1.4s ease-in-out infinite}
@keyframes wgL{50%{transform:rotate(-9deg)}}@keyframes wgR{50%{transform:rotate(9deg)}}
.swish{animation:swish 2s ease-in-out infinite}
@keyframes swish{50%{transform:rotate(-7deg)}}
.cape{animation:cape 2.2s ease-in-out infinite}
@keyframes cape{50%{transform:skewX(-4deg)}}
.ant{animation:ant 1.2s ease-in-out infinite alternate}
@keyframes ant{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}
.fire{animation:fire .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
@keyframes fire{to{transform:scale(1.12,.88)}}
.jet{animation:jet .18s linear infinite alternate;transform-box:fill-box;transform-origin:50% 0}
@keyframes jet{to{transform:scaleY(.72)}}
.led{animation:led 1.4s ease-in-out infinite}
@keyframes led{50%{opacity:.45}}
.spin{animation:spin 16s linear infinite}
.orb{animation:spin 9s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.tw{animation:tw 1.6s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}
.up{animation:up 2.2s ease-in infinite}
@keyframes up{0%{opacity:0;transform:translateY(10px)}30%{opacity:1}100%{opacity:0;transform:translateY(-40px)}}
@media (prefers-reduced-motion:reduce){*{animation:none !important}}'''

FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;800&amp;family=JetBrains+Mono:wght@400;600&amp;display=swap" rel="stylesheet">'

def doc(title, w, h, body):
    return f'''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>
{CSS}
</style>
</helmet>
<div style="width: {w}px; height: {h}px; box-sizing: border-box; padding: 48px 56px; background: #FBF6EA; color: #2B2118; font-family: 'Be Vietnam Pro', system-ui, sans-serif; display: flex; flex-direction: column; gap: 24px">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''

_n = [0]
def pid():
    _n[0] += 1
    return 'f%d' % _n[0]

def spk(x, y, s, d, c='#FFE27A'):
    return f'<g transform="translate({x} {y}) scale({s})"><path class="tw" style="animation-delay:-{d}s" d="M0 -9C1 -3 3 -1 9 0C3 1 1 3 0 9C-1 3 -3 1 -9 0C-3 -1 -1 -3 0 -9Z" fill="{c}"/></g>'

BACKDROP = {
    'bi': ('#FFE9A8', '<g class="spin" style="transform-origin:80px 68px"><path d="M80 68L68 -50H92ZM80 68L198 56V80ZM80 68L92 186H68ZM80 68L-38 80V56ZM80 68L160 -20L174 -6ZM80 68L174 144L160 158ZM80 68L0 158L-14 144ZM80 68L-14 -6L0 -20Z" fill="#FFF3C4" opacity=".6"/></g><circle cx="80" cy="66" r="66" fill="#FFF4C9"/><circle cx="80" cy="66" r="58" fill="none" stroke="#F2B53A" stroke-width="2.4" stroke-dasharray="3 7" stroke-linecap="round"/>'),
    'kitsu': ('#9FE0FF', '<g class="spin" style="transform-origin:80px 70px"><circle cx="80" cy="70" r="72" fill="none" stroke="#FFD34D" stroke-width="2.4" stroke-dasharray="2 9" stroke-linecap="round" opacity=".8"/></g><circle cx="80" cy="70" r="64" fill="none" stroke="#9FE0FF" stroke-width="1.6" opacity=".6"/>'),
    'draco': ('#FFB36B', '''<g transform="translate(80 152)"><path d="M-70 4C-80 4 -82 -8 -72 -10C-72 -22 -54 -24 -50 -14C-44 -26 -24 -22 -26 -10C-18 -16 -8 -10 -12 -2C-6 -8 6 -8 4 2C14 -10 30 -6 26 6C36 -4 54 -2 50 8C62 2 76 6 70 14H-70Z" fill="#FFF6E0" opacity=".95"/><path d="M-50 -2q6 -6 12 0M10 4q6 -6 12 0M-20 6q5 -5 10 0" stroke="#F2C76A" stroke-width="2" fill="none" stroke-linecap="round"/></g>'''),
    'robo': ('#9FF6FF', '<g class="spin" style="transform-origin:80px 70px"><circle cx="80" cy="70" r="70" fill="none" stroke="#FFC93C" stroke-width="10" stroke-dasharray="10 8" opacity=".55"/></g><circle cx="80" cy="70" r="60" fill="none" stroke="#9FF6FF" stroke-width="2.4" opacity=".7"/><ellipse cx="80" cy="98" rx="98" ry="26" fill="none" stroke="#7FE9FF" stroke-width="3" opacity=".5"/>'),
    'lupo': ('#FFF3B8', '<path d="M138 0A76 76 0 1 0 138 136A60 60 0 1 1 138 0Z" fill="#FFE07A"/><path d="M120 16A58 58 0 1 0 120 120" fill="none" stroke="#FFF6CF" stroke-width="3" stroke-linecap="round" opacity=".8"/>'),
}
FRONT = {
    'bi': spk(-16, 96, 1, 0) + spk(176, 84, .8, .6) + spk(80, -26, .7, 1.1),
    'kitsu': ''.join(f'<g class="up" style="animation-delay:-{d}s"><g transform="translate({x} {y}) scale({s})"><path d="M0 -14C7 -5 9 2 0 9C-9 2 -7 -5 0 -14Z" fill="#8FD8FF"/><path d="M0 -4C3 0 3 3 0 6C-3 3 -3 0 0 -4Z" fill="#fff"/></g></g>' for x, y, s, d in ((-24, 110, 1, 0), (186, 100, .9, .7), (10, 10, .7, 1.3), (154, 0, .7, 1.8))),
    'draco': '''<g class="orb" style="transform-origin:80px 70px"><g transform="translate(-30 40)"><circle r="11" fill="#BDF3FF"/><circle r="11" fill="none" stroke="#FFD34D" stroke-width="2"/><circle cx="-3" cy="-4" r="3.4" fill="#fff"/></g></g>''' + ''.join(f'<g class="up" style="animation-delay:-{d}s"><g transform="translate({x} {y}) scale({s})"><path d="M0 -14C8 -4 10 4 0 10C-10 4 -8 -4 0 -14Z" fill="#FF7A3C"/><path d="M0 -4C4 1 4 5 0 8C-4 5 -4 1 0 -4Z" fill="#FFE27A"/></g></g>' for x, y, s, d in ((-20, 140, .7, 0), (180, 130, .6, .8), (30, 10, .55, 1.5), (130, 0, .5, .4))),
    'robo': '<path d="M-18 98A98 26 0 0 0 178 98" fill="none" stroke="#9FF6FF" stroke-width="4" stroke-dasharray="14 16" stroke-linecap="round"/>' + spk(-20, 40, .8, .2, '#9FF6FF') + spk(178, 40, .8, .9, '#9FF6FF'),
    'lupo': spk(-24, 70, 1, 0, '#FFF3B8') + spk(-6, 40, .7, .6, '#FFF3B8') + spk(186, 120, .8, .3, '#FFF3B8') + spk(160, 180, .6, .9, '#FFF3B8') + '<path d="M-24 70L-6 40" stroke="#FFF3B8" stroke-width="1.2" opacity=".6"/>',
}

def fig_svg(name, stage, pose='idle', w=170, label='', vb=None, ground=True, root_cls=None):
    p = pid()
    if stage == 'egg':
        d, f = egg(name, p)
    else:
        d, f = CHARS[name](stage, pose, p)
    s = SC[stage]
    lg = stage == 'legend'
    vb = vb or ('-50 -50 260 230' if lg else '-24 -14 208 178')
    vbw, vbh = [float(x) for x in vb.split()[2:]]
    h = round(w * vbh / vbw)
    rc = root_cls or ('fl' if lg else ('' if stage == 'egg' else 'br'))
    o = f'<svg width="{w}" height="{h}" style="flex-shrink: 0" viewBox="{vb}" role="img" aria-label="{label}"><defs>{d}'
    if lg:
        c, bd = BACKDROP[name]
        o += f'<radialGradient id="{p}gl"><stop offset="0" stop-color="{c}" stop-opacity=".85"/><stop offset=".6" stop-color="{c}" stop-opacity=".25"/><stop offset="1" stop-color="{c}" stop-opacity="0"/></radialGradient>'
    o += '</defs>'
    if lg:
        o += f'<circle cx="80" cy="84" r="120" fill="url(#{p}gl)"/>' + bd
    elif ground:
        o += f'<ellipse cx="80" cy="151" rx="{58*s:.0f}" ry="6.5" fill="#6B5A48" opacity=".12"/>'
    o += f'<g class="{rc}" style="transform-origin:80px 150px"><g transform="translate(80 150) scale({s}) translate(-80 -150)">{f}</g></g>'
    if lg:
        o += FRONT[name]
    return o + '</svg>'

def card(svg, title, sub, note, dark=None):
    if dark:
        bg, tc, nc, bd = dark[0], dark[1], '#E9E4F7', dark[0]
    else:
        bg, tc, nc, bd = '#FFFFFF', '#2B2118', '#6B5A48', '#EADFC8'
    return (f'<figure style="margin: 0; background: {bg}; border: 2px solid {bd}; border-radius: 22px; padding: 14px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 6px">'
            f'{svg}<figcaption style="text-align: center; font-size: 14px; line-height: 1.45; color: {nc}"><strong style="font-size: 17px; font-weight: 800; color: {tc}">{title}</strong> <span>{sub}</span><br><span>{note}</span></figcaption></figure>')

INFO = {
    'bi': ('Bi — tiểu tinh mầm lá', 'Tai tròn hồng, đốm rêu trên trán, mõm kem, cỏ ba lá trên bụng, đuôi lá. Mầm lớn dần: 2 lá → 3 lá → nở hoa; lá thành đôi cánh. Huyền thoại là Thần Rừng: vương miện cành nở hoa, cánh lá vàng óng, áo cánh hoa, vân sáng trên má.',
           ['Mầm lá nhú, sóng xanh', '×0.72 · mầm 2 lá, cỏ ba lá', 'Mầm 3 lá, cánh lá, khăn xanh', '3 cặp lá, hoa trên mầm và tai'],
           ('#262B52', '#FFE27A'), 'Thần Rừng · vương miện cành hoa · cánh lá vàng · áo cánh hoa'),
    'kitsu': ('Kitsu — cáo con lém lỉnh', 'Tai chóp nâu nhiều lông tơ, má xù hai lớp, ngực lông răng cưa, hai chấm đỏ trên trán, tất chân nâu. Bé đội lá biến hình, 1 đuôi; Thiếu niên 3 đuôi, chuông vàng; Trưởng thành 5 đuôi, dây thừng đền có giấy trắng. Huyền thoại là Thiên Hồ: lông trắng vân vàng, 9 đuôi chóp lửa ma xanh, ấn lửa đỏ trên trán, kẻ mắt đỏ, tua vàng trên tai.',
              ['Tai và đuôi ló ra', '×0.72 · lá biến hình, 1 đuôi', '3 đuôi, chuông vàng', '5 đuôi, dây thừng đền'],
              ('#1F2550', '#9FE0FF'), 'Thiên Hồ · 9 đuôi lửa ma · ấn trán · tua vàng'),
    'draco': ('Draco — rồng con má hồng', 'Vây tai có gân, sừng vân kem, vảy thoi trên trán, bụng giáp vàng, móng trắng, gai dọc đuôi. Bé đội vỏ trứng; cánh mọc từ Thiếu niên. Huyền thoại là Long Thần: sừng vàng phân nhánh, bờm lửa, râu vàng xoắn, cánh hoàng hôn đầy sao, ngồi trên mây lành, ngọc rồng bay quanh.',
              ['Sừng nhú, vân vảy', '×0.72 · đội vỏ trứng', 'Sừng vân, cánh nhỏ, gai đuôi', 'Cánh lớn, khăn đỏ'],
              ('#3A1D36', '#FFD34D'), 'Long Thần · sừng vàng · bờm lửa · mây lành · ngọc rồng'),
    'robo': ('Robo — rô-bốt mắt đèn', 'Ốc vít, kính tối, mắt đèn, má đèn hồng, màn hình ngực. Bé đội chong chóng; Thiếu niên có vây và nhịp tim; Trưởng thành đeo tai nghe, ba lô phản lực. Huyền thoại là Thần Cơ Giáp: giáp trắng viền vàng, mào chữ V, cánh lục giác, vòng bánh răng.',
             ['Viên nang, đèn nháy', '×0.72 · chong chóng', 'Vây, đệm vai, nhịp tim', 'Tai nghe, ba lô phản lực'],
             ('#1B2340', '#9FF6FF'), 'Thần Cơ Giáp · mào V · cánh lục giác · vòng bánh răng'),
    'lupo': ('Lupo — sói bạc trăng non', 'Mặt nạ husky với chấm lông mày trắng, tai xanh đêm có lông tơ, má và ngực lông xù, trăng vàng trên trán, gan bàn chân hồng. Lớn dần: khăn cài sao, áo choàng và bùa trăng. Huyền thoại là Nguyệt Lang: trăng khuyết, bờm cực quang, đuôi ngân hà.',
             ['Tai nhọn, trăng nhỏ', '×0.72 · mặt nạ husky', 'Khăn xanh cài sao', 'Áo choàng, bùa trăng'],
             ('#1C1F4A', '#FFE07A'), 'Nguyệt Lang · bờm cực quang · đuôi ngân hà · trăng khuyết'),
}

def char_board(n):
    title, desc, notes, dark, lnote = INFO[n]
    nm = title.split(' — ')[0]
    cards = []
    for st, t, sub, note in (('egg', 'Trứng', 'lv 1', notes[0]), ('baby', 'Bé', 'lv 2–9', notes[1]), ('teen', 'Thiếu niên', 'lv 10–24', notes[2]), ('adult', 'Trưởng thành', 'lv 25–49', notes[3])):
        cards.append(card(fig_svg(n, st, w=184, label=f'{nm} giai đoạn {t.lower()}'), t, sub, note))
    cards.append(card(fig_svg(n, 'legend', w=300, label=f'{nm} giai đoạn huyền thoại'), 'Huyền thoại', 'lv 50+', lnote, dark))
    strip = ''.join(fig_svg(n, 'legend', w=w, label=f'Huyền thoại cỡ {s}') for w, s in ((70, 48), (140, 96), (210, 144)))
    strip += fig_svg(n, 'adult', w=56, label='Trưởng thành cỡ 48 để so', ground=False)
    poses = ''.join(f'<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 2px">{fig_svg(n, "adult", po, w=118, label=lb, root_cls=rc)}<figcaption style="font-size: 13px; font-weight: 600; color: #5E4E3E">{po}</figcaption></figure>'
                    for po, lb, rc in (('hello', 'Chào, vẫy tay', 'br'), ('happy', 'Vui, hai tay giơ', 'hop'), ('surprised', 'Giật mình', 'jmp'), ('hold', 'Cầm đồ', 'br')))
    body = f'''<header style="display: flex; flex-direction: column; gap: 6px">
<p style="margin: 0; font-size: 14px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #0E6B45">Tiến hoá · chibi v3</p>
<h1 style="margin: 0; font-size: 42px; line-height: 1.1; font-weight: 800">{title}</h1>
<p style="margin: 0; font-size: 16px; line-height: 1.55; color: #5E4E3E; max-width: 900px">{desc}</p>
</header>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(0, 1.6fr); gap: 14px; align-items: stretch">
{''.join(cards)}
</div>
<div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 14px; flex-grow: 1">
<div style="background: #3A4256; border-radius: 22px; padding: 16px 22px; display: flex; flex-direction: column; gap: 8px">
<p style="margin: 0; font-size: 13px; font-weight: 800; color: #FFFFFF; letter-spacing: .05em">TRÊN TASKBAR · HUYỀN THOẠI 48 / 96 / 144 PX · TRƯỞNG THÀNH 48 PX</p>
<div style="display: flex; align-items: flex-end; gap: 22px; flex-grow: 1; border-bottom: 6px solid #1E2433">{strip}</div>
</div>
<div style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 22px; padding: 14px 18px; display: flex; flex-direction: column; gap: 6px">
<p style="margin: 0; font-size: 13px; font-weight: 800; letter-spacing: .05em; color: #0E6B45">DÁNG GIƠ TAY · TAY LUÔN DÀI 24</p>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; align-items: end">{poses}</div>
</div>
</div>'''
    return doc(f'{nm} — tiến hoá', 1280, 860, body)

def poses_board():
    cols = (('idle', 'idle', 'br'), ('walk', 'walk', 'bob'), ('hello', 'hello · 125°', 'br'), ('happy', 'happy · 135°', 'hop'), ('levelup', 'levelup · 140°', 'br'), ('surprised', 'surprised · 100°', 'jmp'), ('hold', 'read/eat · −50°', 'br'))
    head = ''.join(f'<div style="font-size: 14px; font-weight: 800; text-align: center; color: #5E4E3E">{c[1]}</div>' for c in cols)
    rows = ''
    for n in CHARS:
        nm = INFO[n][0].split(' — ')[0]
        rows += f'<div style="font-size: 18px; font-weight: 800; align-self: center">{nm}</div>'
        rows += ''.join(f'<div style="background: #FFFFFF; border: 2px solid {"#BFE0C4" if po == "hello" else "#EADFC8"}; border-radius: 16px; display: flex; justify-content: center; padding: 4px">{fig_svg(n, "adult", po, w=150, label=f"{nm} {po}", root_cls=rc)}</div>' for po, _, rc in cols)
    body = f'''<header style="display: flex; flex-direction: column; gap: 6px">
<p style="margin: 0; font-size: 14px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #0E6B45">Rig chung · 5 nhân vật × 7 dáng</p>
<h1 style="margin: 0; font-size: 42px; line-height: 1.1; font-weight: 800">Cùng một bộ xương, tay không bao giờ dài ra</h1>
<p style="margin: 0; font-size: 16px; line-height: 1.55; color: #5E4E3E; max-width: 900px">Mỗi dáng chỉ đổi góc tay và nhịp thân. Bàn tay khi giơ dừng ngoài mép má, không vượt đỉnh đầu.</p>
</header>
<div style="display: grid; grid-template-columns: 90px repeat(7, minmax(0, 1fr)); gap: 10px">
<div></div>{head}{rows}
</div>'''
    return doc('Rig chung — 7 dáng', 1440, 1240, body)

def main_board():
    # Bi with noodle arm (old) vs fixed arm (new)
    p = pid(); d, f = CHARS['bi']('adult', 'idle', p)
    noodle = '<path d="M54 116Q24 104 10 62" stroke="#7FD6C6" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="10" cy="62" r="8" fill="#5BB9A9"/><path d="M54 122L10 70" stroke="#C2362B" stroke-width="2" stroke-dasharray="5 4"/>'
    f_old = f.replace(arm('#7FD6C6', '#5BB9A9', 12, 54, 116), noodle)
    old = (f'<svg width="300" height="250" style="flex-shrink: 0" viewBox="-40 -10 240 190" role="img" aria-label="Bản cũ: tay vẫy bị kéo dài gấp ba"><defs>{d}</defs><ellipse cx="80" cy="151" rx="54" ry="6.5" fill="#6B5A48" opacity=".12"/>'
           f'<g transform="translate(80 150) scale(.92) translate(-80 -150)">{f_old}</g>'
           '<rect x="-36" y="92" width="62" height="24" rx="12" fill="#C2362B"/><text x="-5" y="109" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="14" fill="#FFFFFF">≈ 66</text></svg>')
    new = fig_svg('bi', 'adult', 'hello', w=300, label='Bản mới: tay cố định dài 24, xoay 125 độ', vb='-40 -10 240 190')
    angles = ''.join(f'<figure style="margin: 0; background: #FFFFFF; border: 2px solid {"#BFE0C4" if po == "hello" else "#EADFC8"}; border-radius: 16px; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px">{fig_svg("bi", "adult", po, w=160, label=lb, root_cls=rc)}'
                     f'<figcaption style="text-align: center; font-size: 14px; line-height: 1.4"><strong style="font-weight: 800">{t}</strong><br><span style="color: #6B5A48">{a}</span></figcaption></figure>'
                     for po, t, a, lb, rc in (('idle', 'Nghỉ', '12° · idle, sit', 'Nghỉ', 'br'), ('walk', 'Đánh tay', '10° ± 20° · walk', 'Đi', 'bob'), ('hold', 'Cầm đồ', '−50° · eat, read', 'Cầm đồ', 'br'),
                                              ('hello', 'Vẫy', '125° ± 12° · hello', 'Vẫy', 'br'), ('happy', 'Cổ vũ', '135° · happy', 'Cổ vũ', 'hop'), ('surprised', 'Dang tay', '100° · surprised', 'Dang tay', 'jmp')))
    cast = ''.join(fig_svg(n, 'adult', 'idle', w=150, label=INFO[n][0]) for n in CHARS)
    body = f'''<header style="display: flex; justify-content: space-between; align-items: flex-end; gap: 32px">
<div style="display: flex; flex-direction: column; gap: 8px">
<p style="margin: 0; font-size: 15px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #0E6B45">Mascot v3 · chibi · một bộ vector dùng chung</p>
<h1 style="margin: 0; font-size: 46px; line-height: 1.1; font-weight: 800">Mềm hơn, chi tiết hơn, tay không còn dài ra</h1>
<p style="margin: 0; font-size: 17px; line-height: 1.55; color: #5E4E3E; max-width: 820px">Không viền mực, khối tròn đổ bóng mềm, mắt to có lòng đen màu và 2 điểm sáng, má hồng mờ, miệng chữ "w". Mỗi con có chi tiết riêng: lông tơ tai, má xù, ngón chân, vân sừng, ốc vít. Cùng một hình cho 48, 96 và 144 px.</p>
</div>
</header>
<div style="display: flex; justify-content: space-between; align-items: flex-end; background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 22px; padding: 12px 28px">{cast}</div>
<section style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px">
<div style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 22px; padding: 18px 22px; display: flex; gap: 18px; align-items: center">{old}
<div style="display: flex; flex-direction: column; gap: 8px"><span style="align-self: flex-start; padding: 4px 12px; border-radius: 999px; background: #FBE1DD; color: #8E2318; font-size: 13px; font-weight: 800">BẢN CŨ</span>
<h2 style="margin: 0; font-size: 22px; font-weight: 800">Tay vẽ tới một điểm</h2>
<p style="margin: 0; font-size: 15px; line-height: 1.55; color: #5E4E3E"><code style="font-family: 'JetBrains Mono', monospace; font-size: 13px">arm(c, side, hx, hy)</code> nối vai tới toạ độ bàn tay. Đặt tay cao thì tay dài ra: nghỉ ~22, vẫy ~66.</p></div></div>
<div style="background: #FFFFFF; border: 2px solid #BFE0C4; border-radius: 22px; padding: 18px 22px; display: flex; gap: 18px; align-items: center">{new}
<div style="display: flex; flex-direction: column; gap: 8px"><span style="align-self: flex-start; padding: 4px 12px; border-radius: 999px; background: #DDF1E2; color: #145B32; font-size: 13px; font-weight: 800">BẢN MỚI</span>
<h2 style="margin: 0; font-size: 22px; font-weight: 800">Tay là khúc cố định, chỉ xoay</h2>
<p style="margin: 0; font-size: 15px; line-height: 1.55; color: #5E4E3E">Tay dài 24, bàn tay tròn có ngón. Vẫy = giơ 125° rồi lắc ±12° quanh vai; bàn tay nằm ngoài mép má nên luôn thấy rõ.</p></div></div>
</section>
<section style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px">{angles}</section>
<section style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex-grow: 1">
<div style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 22px; padding: 18px 22px">
<h2 style="margin: 0 0 8px; font-size: 19px; font-weight: 800">Công thức vẽ</h2>
<ul style="margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.6; color: #3E3226">
<li>Đầu rộng ~2 lần thân; thân, tay, chân là khối tròn có gradient sáng góc trái trên.</li>
<li>Bóng dưới cằm trên thân, mảng kem ở mõm và ngực, lông xù hai má.</li>
<li>Mắt: lòng đen + lòng màu nửa dưới + 2 điểm sáng; má hồng làm mờ.</li>
<li>Huyền thoại: đổi bóng dáng (quạt đuôi, cánh, trăng, mặt trời), mắt sao, bay lơ lửng.</li>
</ul></div>
<div style="background: #2B2118; color: #F7EEDC; border-radius: 22px; padding: 18px 22px">
<h2 style="margin: 0 0 8px; font-size: 19px; font-weight: 800; color: #FFFFFF">Đổi trong gen_mascot.py</h2>
<pre style="margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6; white-space: pre; color: #F7EEDC">POSE_DEG = {{'idle': 12, 'hello': 125, 'happy': 135,
            'levelup': 140, 'surprised': 100, 'hold': -50}}
def arm(c, side, deg, cls=''):
    sx, sy = 80 + side * 26, 116          # vai = tâm xoay
    g = '&lt;g transform="translate(%d %d) rotate(%d)"&gt;' % (sx, sy, -side * deg)
    return wrap(g + ARM + '&lt;/g&gt;', cls, sx, sy)</pre>
</div>
</section>'''
    return doc('Mascot v3 — rig mới', 1440, 1240, body)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    files = {'Main.dc.html': main_board(), 'Poses.dc.html': poses_board()}
    for n in CHARS:
        files[n.capitalize() + '.dc.html'] = char_board(n)
    for k, v in files.items():
        open(os.path.join(OUT, k), 'w', encoding='utf-8').write(v)
        print(k, len(v))
