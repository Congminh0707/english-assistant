# Achievement badges v3: vector, tier frames that grow richer, cute glyphs, number ribbon.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from build import doc, pid
from chars import star

TABLE = [('streak', 3, 'bronze'), ('streak', 7, 'silver'), ('streak', 14, 'silver'), ('streak', 30, 'gold'), ('streak', 100, 'diamond'),
         ('reviews', 100, 'bronze'), ('reviews', 500, 'silver'), ('reviews', 1000, 'gold'), ('reviews', 5000, 'diamond'),
         ('words', 10, 'bronze'), ('words', 50, 'silver'), ('words', 100, 'gold'), ('words', 500, 'diamond'),
         ('practice', 1, 'bronze'), ('practice', 10, 'silver'), ('practice', 50, 'gold'), ('practice', 100, 'diamond'),
         ('lessons', 1, 'bronze'), ('lessons', 5, 'silver'), ('lessons', 20, 'gold'), ('lessons', 30, 'diamond'),
         ('perfect', 1, 'bronze'), ('perfect', 10, 'silver'), ('perfect', 30, 'gold'),
         ('days', 7, 'bronze'), ('days', 30, 'silver'), ('days', 100, 'gold'),
         ('xp', 500, 'bronze'), ('xp', 2500, 'silver'), ('xp', 10000, 'gold'), ('xp', 50000, 'diamond'),
         ('memory', 90, 'gold')]
NAMES = {"streak3": "Khởi động", "streak7": "Một tuần lửa", "streak14": "Hai tuần bền bỉ", "streak30": "Tháng không nghỉ", "streak100": "Huyền thoại 100 ngày", "reviews100": "Ôn tập tập sự", "reviews500": "Thợ ôn chăm chỉ", "reviews1000": "Bậc thầy ôn tập", "reviews5000": "Cỗ máy ghi nhớ", "words10": "Nhặt chữ", "words50": "Túi từ đầy đặn", "words100": "Thư viện nhỏ", "words500": "Từ điển sống", "practice1": "Buổi tập đầu tiên", "practice10": "Tay luyện", "practice50": "Võ sĩ luyện tập", "practice100": "Thánh luyện tập", "lessons1": "Bài học đầu tiên", "lessons5": "Học trò", "lessons20": "Học giả", "lessons30": "Tốt nghiệp nền tảng", "perfect1": "Điểm tuyệt đối", "perfect10": "Mười điểm 10", "perfect30": "Không tì vết", "days7": "Tuần lễ học tập", "days30": "Một tháng chăm chỉ", "days100": "Trăm ngày học", "xp500": "Tích điểm", "xp2500": "Thợ săn XP", "xp10000": "Cuồng XP", "xp50000": "Vô cực", "memory90": "Trí nhớ sắt đá"}
GROUP = {'streak': ('Chuỗi ngày', 'ngày'), 'reviews': ('Ôn tập', 'lượt'), 'words': ('Sổ từ', 'từ'), 'practice': ('Luyện tập', 'buổi'),
         'lessons': ('Bài học', 'bài'), 'perfect': ('Điểm tuyệt đối', 'bài'), 'days': ('Ngày học', 'ngày'), 'xp': ('Điểm XP', 'XP'), 'memory': ('Trí nhớ', '%')}
TIER = {'bronze': ('Đồng', '+20 XP · 5 xu'), 'silver': ('Bạc', '+50 XP · 10 xu'), 'gold': ('Vàng', '+120 XP · 25 xu'), 'diamond': ('Kim cương', '+300 XP · 60 xu')}
EYE = '#3A2430'

def face(y=4, s=1, c=EYE):
    return (f'<g transform="translate(0 {y}) scale({s})"><ellipse cx="-5" cy="0" rx="2" ry="2.6" fill="{c}"/><ellipse cx="5" cy="0" rx="2" ry="2.6" fill="{c}"/>'
            f'<circle cx="-5.6" cy="-.9" r=".8" fill="#fff"/><circle cx="4.4" cy="-.9" r=".8" fill="#fff"/>'
            f'<path d="M-2.4 3q1.2 1.4 2.4 0q1.2 1.4 2.4 0" stroke="{c}" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
            f'<ellipse cx="-8.6" cy="3" rx="2.4" ry="1.4" fill="#FF8FA8" opacity=".8"/><ellipse cx="8.6" cy="3" rx="2.4" ry="1.4" fill="#FF8FA8" opacity=".8"/></g>')

def glyph(g):
    if g == 'streak':
        return ('<path d="M0 -20C6 -12 15 -6 15 6C15 15 8 20 0 20C-8 20 -15 15 -15 6C-15 -2 -10 -6 -8 -12C-6 -6 -4 -4 -2 -4C-4 -10 -3 -16 0 -20Z" fill="#FF6A3D"/>'
                '<path d="M0 -6C4 -1 9 3 9 9C9 14 5 17 0 17C-5 17 -9 14 -9 9C-9 4 -5 1 0 -6Z" fill="#FFC93C"/>' + face(9, .8))
    if g == 'reviews':
        return ('<rect x="-16" y="-16" width="22" height="28" rx="4" fill="#7FB8FF" transform="rotate(-14)"/>'
                '<rect x="-8" y="-14" width="22" height="28" rx="4" fill="#FFFFFF" transform="rotate(10)"/>'
                '<text x="4" y="5" transform="rotate(10)" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="15" fill="#3F6FE0">Aa</text>'
                '<path d="M10 10l3 3l6 -7" stroke="#2FA968" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    if g == 'words':
        return ('<path d="M0 -10C-6 -16 -14 -16 -20 -13V14C-14 11 -6 11 0 16C6 11 14 11 20 14V-13C14 -16 6 -16 0 -10Z" fill="#FFFFFF"/>'
                '<path d="M0 -10V16" stroke="#E2C79A" stroke-width="2"/><path d="M-20 -13V14C-14 11 -6 11 0 16" fill="none" stroke="#E86A5A" stroke-width="3"/>'
                '<path d="M20 -13V14C14 11 6 11 0 16" fill="none" stroke="#E86A5A" stroke-width="3"/>'
                '<path d="M-15 -6q6 -2 11 1M-15 0q6 -2 11 1M5 -5q6 -3 11 -1M5 1q6 -3 11 -1" stroke="#C9B48A" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
                '<path d="M10 -15V-2l3 -3l3 3V-14" fill="#FF7FAE"/>')
    if g == 'practice':
        return ('<circle r="18" fill="#FFFFFF"/><circle r="13" fill="#FF6A6A"/><circle r="8" fill="#FFFFFF"/><circle r="3.6" fill="#FF6A6A"/>'
                '<path d="M2 -2L18 -18" stroke="#8A5A3C" stroke-width="2.6" stroke-linecap="round"/><path d="M14 -20l6 -2l-2 6l-4 0Z" fill="#5BC46E"/>')
    if g == 'lessons':
        return ('<path d="M0 -14L22 -4L0 6L-22 -4Z" fill="#3A3650"/><path d="M-12 1V10C-6 15 6 15 12 10V1L0 6Z" fill="#4A4562"/>'
                '<path d="M16 -1V12" stroke="#FFC93C" stroke-width="2.2"/><circle cx="16" cy="13" r="3" fill="#FFC93C"/><path d="M-6 -6l8 -3" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>')
    if g == 'perfect':
        return star(0, 0, 20, '#FFC93C') + star(0, 0, 13, '#FFE27A') + face(3, .8)
    if g == 'days':
        return ('<rect x="-17" y="-15" width="34" height="32" rx="6" fill="#FFFFFF"/><path d="M-17 -9C-17 -12 -14 -15 -11 -15H11C14 -15 17 -12 17 -9V-4H-17Z" fill="#E86A5A"/>'
                '<rect x="-10" y="-20" width="4" height="9" rx="2" fill="#8A7A66"/><rect x="6" y="-20" width="4" height="9" rx="2" fill="#8A7A66"/>'
                '<path d="M-8 6l5 5l11 -11" stroke="#2FA968" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    if g == 'xp':
        return ('<path d="M4 -21L-13 3H-1L-5 21L13 -4H1Z" fill="#FFC93C"/><path d="M4 -21L-13 3H-1Z" fill="#FFE27A"/>'
                '<text x="0" y="5" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="8" fill="#8A5A12" opacity="0">XP</text>')
    if g == 'memory':
        return ('<path d="M0 18C-10 11 -20 3 -20 -7C-20 -15 -14 -19 -9 -19C-4 -19 -1 -16 0 -13C1 -16 4 -19 9 -19C14 -19 20 -15 20 -7C20 3 10 11 0 18Z" fill="#FF6F8E"/>'
                '<ellipse cx="-10" cy="-10" rx="4" ry="2.6" fill="#fff" opacity=".5" transform="rotate(-30 -10 -10)"/>' + face(0, .8))
    return ''

def scallop(r, n, depth):
    pts = []
    for i in range(n * 2):
        a = i * math.pi / n
        rr = r if i % 2 == 0 else r - depth
        pts.append('%.1f %.1f' % (rr * math.cos(a), rr * math.sin(a)))
    return 'M' + 'L'.join(pts) + 'Z'

def badge(group, target, tier, w=96, locked=False, progress=None, label=True):
    p = pid()
    unit = GROUP[group][1]
    num = f'{target:,}'.replace(',', '.') + ('' if unit == '%' else '')
    txt = f'{num}{"%" if unit == "%" else " " + unit}'
    G = {'bronze': ('#F2B27A', '#C9773A', '#8E4F22'), 'silver': ('#F4F7FB', '#BCC8D8', '#7E8DA4'),
         'gold': ('#FFF0A8', '#FFC93C', '#D98A12'), 'diamond': ('#C9FBFF', '#9E8CFF', '#FF7FC8')}[tier]
    rib = {'bronze': '#B86A3A', 'silver': '#3F6FE0', 'gold': '#D93B3B', 'diamond': '#7B4FD8'}[tier]
    d = (f'<linearGradient id="{p}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{G[0]}"/><stop offset=".5" stop-color="{G[1]}"/><stop offset="1" stop-color="{G[2]}"/></linearGradient>'
         f'<radialGradient id="{p}c" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFF4DD"/></radialGradient>')
    o = ''
    if tier == 'diamond':
        o += f'<g class="spin" style="transform-origin:0 0">' + ''.join(f'<path d="M0 0L-5 -48L5 -48Z" fill="#FFE9A8" opacity=".55" transform="rotate({i*30})"/>' for i in range(12)) + '</g>'
        for sx in (-1, 1):
            o += (f'<g transform="scale({sx} 1)"><path d="M30 -6C44 -20 58 -22 64 -14C58 -12 56 -8 60 -2C52 -2 50 2 52 8C44 6 38 8 34 12Z" fill="#E6F4FF"/>'
                  f'<path d="M34 -4C44 -12 52 -14 58 -12M34 2C42 0 48 0 52 2" stroke="#9EC4F0" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>')
    if tier in ('gold', 'diamond'):
        for sx in (-1, 1):
            leaves = ''.join(f'<ellipse cx="{-34 + k*1.5:.1f}" cy="{14 - k*9}" rx="6" ry="3" fill="#5BC46E" transform="rotate({-60 + k*18} {-34 + k*1.5:.1f} {14 - k*9})"/>' for k in range(5))
            o += f'<g transform="scale({sx} 1)"><path d="M-30 22C-40 8 -40 -14 -30 -30" stroke="#3E9C5C" stroke-width="2.4" fill="none" stroke-linecap="round"/>{leaves}</g>'
    if tier != 'bronze':
        o += f'<path d="M-14 22L-22 46L-12 41L-6 50L0 26Z" fill="{rib}"/><path d="M14 22L22 46L12 41L6 50L0 26Z" fill="{rib}"/>'
    if tier == 'diamond':
        o += f'<path d="M0 -38L30 -20V20L0 38L-30 20V-20Z" fill="url(#{p}f)"/><path d="M0 -38L30 -20L0 -6L-30 -20Z" fill="#fff" opacity=".35"/>'
        inner = 23
    elif tier == 'bronze':
        o += f'<circle r="33" fill="url(#{p}f)"/><circle r="29" fill="none" stroke="{G[0]}" stroke-width="1.6" opacity=".8"/>'
        inner = 25
    else:
        o += f'<path d="{scallop(36 if tier == "silver" else 38, 16, 3.4)}" fill="url(#{p}f)"/>'
        inner = 26
    o += f'<circle r="{inner}" fill="url(#{p}c)"/><circle r="{inner}" fill="none" stroke="{G[2]}" stroke-opacity=".35" stroke-width="1.6"/>'
    o += f'<g transform="scale({.95 if inner > 24 else .85})">{glyph(group)}</g>'
    if tier == 'gold':
        o += star(0, -42, 7, f'url(#{p}f)')
    if tier == 'diamond':
        o += f'<path d="M-12 -38L-14 -50L-6 -44L0 -54L6 -44L14 -50L12 -38Z" fill="#FFC93C"/><circle cx="0" cy="-46" r="2.4" fill="#FF7FC8"/>'
    o += f'<ellipse cx="-12" cy="-{inner-6}" rx="9" ry="4" fill="#fff" opacity=".45" transform="rotate(-25 -12 -{inner-6})"/>'
    if label:
        o += (f'<path d="M-30 28H30L26 35L30 42H-30L-26 35Z" fill="{rib}"/><text x="0" y="39" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="10" fill="#FFFFFF">{txt}</text>')
    grey = ''
    if locked:
        d += f'<filter id="{p}g"><feColorMatrix type="saturate" values="0"/></filter>'
        grey = f' filter="url(#{p}g)" opacity=".38"'
    ring = ''
    if progress is not None:
        c = 2 * math.pi * 44
        ring = (f'<circle r="44" fill="none" stroke="#EFE7D6" stroke-width="5"/><circle r="44" fill="none" stroke="#2FA968" stroke-width="5" stroke-linecap="round" '
                f'stroke-dasharray="{c*progress:.1f} {c:.1f}" transform="rotate(-90)"/>')
    lock = ''
    if locked:
        lock = ('<g transform="translate(22 18)"><circle r="11" fill="#3E3226"/><rect x="-5" y="-2" width="10" height="8" rx="2" fill="#FFFFFF"/>'
                '<path d="M-3 -2V-5a3 3 0 0 1 6 0V-2" stroke="#FFFFFF" stroke-width="2" fill="none"/></g>')
    h = w * 1.05
    return f'<svg width="{w}" height="{h:.0f}" viewBox="-60 -58 120 126" role="img" aria-label="{NAMES[group+str(target)]}{" (chưa mở)" if locked else ""}"><defs>{d}</defs>{ring}<g{grey}>{o}</g>{lock}</svg>'

def board():
    tiers = ''.join(f'<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 4px">{badge("streak", t, tr, w=150)}'
                    f'<figcaption style="text-align: center; font-size: 15px; line-height: 1.4"><strong style="font-weight: 800">{TIER[tr][0]}</strong><br><span style="color: #6B5A48">{TIER[tr][1]}</span></figcaption></figure>'
                    for t, tr in ((3, 'bronze'), (7, 'silver'), (30, 'gold'), (100, 'diamond')))
    states = (f'<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 4px">{badge("words", 100, "gold", w=120, locked=True)}<figcaption style="font-size: 14px; color: #6B5A48; text-align: center">Chưa mở<br>xám + khoá</figcaption></figure>'
              f'<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 4px">{badge("words", 100, "gold", w=120, locked=True, progress=.62)}<figcaption style="font-size: 14px; color: #6B5A48; text-align: center">Đang tiến tới<br>vòng 62/100</figcaption></figure>'
              f'<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 4px">{badge("words", 100, "gold", w=120)}<figcaption style="font-size: 14px; color: #6B5A48; text-align: center">Đã mở<br>đủ màu</figcaption></figure>')
    groups = ''
    order = ['streak', 'reviews', 'words', 'practice', 'lessons', 'perfect', 'days', 'xp', 'memory']
    for g in order:
        rows = [r for r in TABLE if r[0] == g]
        cells = ''.join(f'<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 2px; width: 80px">{badge(g, t, tr, w=80)}<figcaption style="font-size: 12px; line-height: 1.3; text-align: center; font-weight: 600">{NAMES[g+str(t)]}</figcaption></figure>' for _, t, tr in rows)
        groups += (f'<section style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 20px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px">'
                   f'<h3 style="margin: 0; font-size: 17px; font-weight: 800">{GROUP[g][0]} <span style="font-weight: 600; color: #6B5A48; font-size: 14px">· {len(rows)} huy hiệu</span></h3>'
                   f'<div style="display: flex; gap: 2px; align-items: flex-start">{cells}</div></section>')
    # unlock toast with Bi cheering
    bi = build.fig_svg('bi', 'adult', 'happy', w=150, label='Bi vui mừng', root_cls='hop')
    toast = (f'<div style="background: #FFFFFF; border: 2px solid #F2D58A; border-radius: 24px; padding: 18px 22px; display: flex; align-items: center; gap: 16px; box-shadow: 0 10px 30px rgba(120,90,30,.15)">'
             f'{bi}<div style="display: flex; flex-direction: column; gap: 6px; flex-grow: 1"><p style="margin: 0; font-size: 13px; font-weight: 800; letter-spacing: .06em; color: #B8860B">MỞ KHOÁ THÀNH TỰU</p>'
             f'<h3 style="margin: 0; font-size: 24px; font-weight: 800">Tháng không nghỉ</h3><p style="margin: 0; font-size: 15px; color: #5E4E3E">Học 30 ngày liên tiếp · +120 XP · +25 xu</p>'
             f'<button type="button" style="align-self: flex-start; min-height: 44px; padding: 0 20px; border-radius: 12px; border: 0; background: #0E6B45; color: #FFFFFF; font: inherit; font-weight: 800">Tuyệt vời!</button></div>'
             f'{badge("streak", 30, "gold", w=150)}</div>')
    body = f'''<header style="display: flex; flex-direction: column; gap: 6px">
<p style="margin: 0; font-size: 14px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #0E6B45">Thành tựu · 32 huy hiệu · thay bản pixel 32×32</p>
<h1 style="margin: 0; font-size: 42px; line-height: 1.1; font-weight: 800">Huy hiệu thành tựu v3</h1>
<p style="margin: 0; font-size: 16px; line-height: 1.55; color: #5E4E3E; max-width: 1000px">Vector cùng phong cách mascot. Hạng càng cao khung càng đầy: đồng là đồng xu tròn; bạc thêm viền răng cưa và dải băng; vàng thêm vòng nguyệt quế và ngôi sao; kim cương là viên đá lục giác óng ánh, có cánh, vương miện và tia sáng xoay. Dải băng ghi mốc (7 ngày, 500 lượt…) để phân biệt các huy hiệu cùng nhóm.</p>
</header>
<div style="display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 20px">
<section style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 22px; padding: 18px 22px; display: flex; flex-direction: column; gap: 10px">
<h2 style="margin: 0; font-size: 19px; font-weight: 800">4 hạng · thưởng khi mở</h2>
<div style="display: flex; justify-content: space-around; align-items: flex-end">{tiers}</div>
</section>
<div style="display: flex; flex-direction: column; gap: 16px">
<section style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 22px; padding: 18px 22px; display: flex; flex-direction: column; gap: 8px">
<h2 style="margin: 0; font-size: 19px; font-weight: 800">Trạng thái</h2>
<div style="display: flex; justify-content: space-around">{states}</div>
</section>
</div>
</div>
{toast}
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px">{groups}</div>'''
    open(os.path.join(build.OUT, 'Badges.dc.html'), 'w', encoding='utf-8').write(doc('Huy hiệu thành tựu', 1440, 1380, body))

if __name__ == '__main__':
    board(); print('ok')
