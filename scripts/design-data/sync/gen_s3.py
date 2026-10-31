# Sinh các bảng S3 (tăng trưởng, tài khoản): thú cưng, cửa hàng, thống kê, cài đặt, onboarding, tiến hoá, phụ huynh.
#   BOARD_OUT=<thư mục project> python gen_s3.py
# Nhân vật đọc từ Char*.dc.html trong BOARD_OUT (chỉ đọc). Icon thêm ở EXTRA chỉ có hiệu lực trong file này.
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from board_kit import *

# ---------- Nhân vật: lấy nguyên SVG từ bảng Char*, đổi id theo tiền tố để nhiều con cùng một bảng ----------
STAGES = [('egg', 1, 'Trứng'), ('baby', 2, 'Bé con'), ('teen', 10, 'Thiếu niên'), ('adult', 25, 'Trưởng thành'), ('legend', 50, 'Huyền thoại')]
_chars = {}

def _load(n):
    if n in _chars:
        return _chars[n]
    h = open(os.path.join(OUT, 'Char%s.dc.html' % n), encoding='utf-8').read()
    b = h[h.find('</helmet>'):]
    found = re.findall(r'<svg\b([^>]*)>(.*?)</svg>', b, re.S)
    ids = set(re.findall(r'\bid="([^"]+)"', b))
    pre = n.lower() + '-'
    def scope(s):
        for i in ids:
            s = s.replace('id="%s"' % i, 'id="%s%s"' % (pre, i)).replace('href="#%s"' % i, 'href="#%s%s"' % (pre, i)).replace('url(#%s)' % i, 'url(#%s%s)' % (pre, i))
        return s
    out = {'defs': scope(found[0][1]), 'stage': {}}
    for (attrs, inner), (key, _, _) in zip(found[1:], STAGES):
        out['stage'][key] = (re.search(r'viewBox="([^"]+)"', attrs).group(1), scope(inner))
    # giữ keyframes/animation riêng của con này cho bảng cần hoạt ảnh
    css = h[h.find('<style>') + 7:h.find('</style>')]
    out['css'] = '\n'.join(l for l in css.splitlines() if l.startswith('@keyframes') or 'animation:' in l)
    _chars[n] = out
    return out

def sprite(n, stage, h, sil=False, style='', aria=''):
    vb, inner = _load(n)['stage'][stage]
    x, y, vw, vh = [float(v) for v in vb.split()]
    return '<svg%s width="%d" height="%d" viewBox="%s" role="img" aria-label="%s"%s>%s</svg>' % (
        ' class="sil"' if sil else '', round(h * vw / vh), h, vb, aria or n, (' style="%s"' % style) if style else '', inner)

def defs(*names):
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">%s</svg>' % ''.join(_load(n)['defs'] for n in names)

# ---------- Thành phần riêng của S3 (đề xuất đưa .tabs .sw .sel vào kit) ----------
CSS3 = """
.dis{opacity:.5}
.sil{filter:brightness(0) opacity(.22)}
.dark .sil{filter:brightness(0) invert(1) opacity(.2)}
.head{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:36px}
.sel{justify-content:space-between;gap:12px;white-space:nowrap;color:var(--ink);font-size:13px;font-weight:600;min-width:176px}
.sel .ic{width:16px;height:16px;color:var(--inkSoft)}
.sw{position:relative;display:inline-block;flex:none;width:36px;height:20px;border-radius:var(--r-pill);background:var(--line)}
.sw::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:var(--r-pill);background:var(--surface);box-shadow:var(--shadow)}
.sw.on{background:var(--success)}.sw.on::after{left:18px}
.rad{display:inline-block;flex:none;width:16px;height:16px;border-radius:var(--r-pill);border:2px solid var(--line);background:var(--surface)}
.rad.on{border:5px solid var(--primary)}
.set{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:40px;font-size:14px}
.set+.set{border-top:1px solid var(--line)}
.sec{gap:8px;padding:16px}
.note{padding:8px 12px;border-radius:var(--r-md);font-size:13px;font-weight:600}
.note--ok{background:var(--successSoft);color:var(--success)}
.note--warn{background:var(--warningSoft);color:var(--warning)}
.note--xp{background:var(--xpSoft);color:var(--xp)}
.lead{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:var(--r-md)}
.num{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;font-size:26px;line-height:1.1;font-variant-numeric:tabular-nums}
.art{display:grid;place-items:center;flex:none;width:56px;height:56px;border-radius:var(--r-md);background:var(--surface2)}
.cal{display:grid;grid-template-columns:repeat(16,1fr);grid-template-rows:repeat(7,1fr);grid-auto-flow:column;gap:3px;flex:1;min-width:0}
.cell{aspect-ratio:1;border-radius:var(--r-sm);background:var(--surface2)}
.cell.none{background:transparent}
.cell.l1{background:color-mix(in srgb,var(--success) 28%,var(--surface2))}
.cell.l2{background:color-mix(in srgb,var(--success) 52%,var(--surface2))}
.cell.l3{background:color-mix(in srgb,var(--success) 78%,var(--surface2))}
.cell.l4{background:var(--success)}
.vbars{display:flex;align-items:flex-end;gap:4px;border-bottom:1px solid var(--line)}
.vcol{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;height:100%;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums}
.vcol i{display:block;width:100%;max-width:30px;border-radius:8px 8px 0 0}
.vdays{display:flex;gap:4px}.vdays span{flex:1;min-width:0;text-align:center;font-size:12px;color:var(--inkSoft);font-variant-numeric:tabular-nums}
.stack{display:flex;gap:2px;height:12px;border-radius:var(--r-pill);overflow:hidden}
.dot{display:inline-block;flex:none;width:12px;height:12px;border-radius:var(--r-pill)}
.delta{display:inline-flex;align-items:center;gap:2px;height:24px;padding:0 8px;border-radius:var(--r-pill);background:var(--surface2);font-size:12px;font-weight:700;color:var(--inkSoft)}
.delta .ic{width:12px;height:12px}
.medal{display:grid;place-items:center;width:56px;height:56px;border-radius:var(--r-pill);background:var(--surface2);color:var(--inkSoft)}
.medal .ic{width:26px;height:26px}
.snav{width:172px;flex:none;display:flex;flex-direction:column;gap:4px}
.snav .nav{height:36px;gap:8px;padding:0 8px;font-size:13px}
.snav .ic{width:16px;height:16px}
"""

def icon_tile(name, color):
    return '<span class="lead" style="background:var(--%sSoft);color:var(--%s)">%s</span>' % (color, color, icon(name))

def price(n):
    return '<span class="chip chip--warning">%s%s</span>' % (icon('coins', 'ic', 'width:14px;height:14px'), n)

def dbtn(label):
    return '<button class="btn dis">%s</button>' % label

def tabs(items, active):
    return '<div class="tabs">%s</div>' % ''.join('<div class="tab%s">%s</div>' % (' on' if i == active else '', l) for i, l in enumerate(items))

def sel(text, style=''):
    return '<div class="input sel"%s><span>%s</span>%s</div>' % ((' style="%s"' % style) if style else '', text, icon('down'))

def sw(on=True):
    return '<span class="sw%s"></span>' % (' on' if on else '')

def setrow(label, ctrl):
    return '<div class="set"><span>%s</span>%s</div>' % (label, ctrl)

def W(name, body, title, css=''):
    return write(name, body, 1100, 720, title=title, css=CSS3 + css)

# ---------- Dữ liệu mẫu chung: hồ sơ Lan, Lv 12, Thiếu niên, thú cưng Kitsu tên Mochi, 540 xu ----------
PET, COINS, LV = 'Mochi', 540, 12
# Lupo nhận giá và điều kiện của slot webster trong src/shared/characters.ts
CHARS = [('Bi', 'Bạn đồng hành đầu tiên', 0, 0), ('Lupo', 'Sói trăng tiến hoá theo pha trăng', 500, 5), ('Draco', 'Rồng nhỏ có cánh và lửa', 700, 8), ('Robo', 'Robot thông minh', 700, 8), ('Kitsu', 'Cáo nhiều đuôi', 600, 5)]
OWNED = {'Bi', 'Kitsu'}
CURRENT = 'Kitsu'

def wallet():
    return '<span class="chip chip--warning" style="height:32px;font-size:13px">%s%d xu</span>' % (icon('coins'), COINS)

# ---------- S3Pet ----------
def pet_page(dark=False, renaming=False):
    if renaming:
        name = ('<div class="row" style="gap:8px"><div class="input" style="width:220px;color:var(--ink);border-color:var(--primary);box-shadow:0 0 0 3px var(--primarySoft)">Mochi</div>'
                '<button class="btn btn--primary btn--icon" aria-label="Lưu">%s</button><button class="btn btn--ghost btn--icon" aria-label="Huỷ">%s</button></div>') % (icon('check'), icon('x'))
    else:
        name = '<div class="row" style="gap:4px"><div class="h2">%s</div><button class="btn btn--ghost btn--icon" aria-label="Đổi tên">%s</button></div>' % (PET, icon('pen'))
    hero = ('<div class="card row" style="gap:24px;padding:12px 24px">%s'
            '<div class="col" style="flex:1;gap:4px;min-width:0">%s<div class="soft sm">Kitsu · Lv %d · Thiếu niên</div>'
            '<div style="margin-top:4px">%s</div>'
            '<div class="row sm" style="justify-content:space-between;margin-top:4px;white-space:nowrap"><span class="soft">Còn 13 cấp nữa để tiến hoá thành Trưởng thành</span><b>340/500 XP</b></div></div>'
            '<div class="sm soft" style="width:188px;flex:none;padding-left:24px;border-left:1px solid var(--line)">Cấp độ và XP thuộc về hồ sơ của bạn: đổi thú cưng không mất tiến độ.</div></div>'
            ) % (sprite('Kitsu', 'teen', 116, aria='Mochi, Kitsu giai đoạn Thiếu niên'), name, LV, bar(68, 'xp'))
    cards = ''
    for n, desc, cost, lv in CHARS:
        own = n in OWNED
        sel_ = n == CURRENT
        if sel_:
            note, action = '', dbtn('Đang chọn')
        elif own:
            note, action = '', btn('Chọn')
        else:
            short = cost - COINS
            note = price(cost)
            action = dbtn('Thiếu %d xu' % short) if short > 0 else btn('Mua', 'primary')
        st = 'border-color:var(--primary);background:var(--warningSoft)' if sel_ else ''
        cards += ('<div class="card col" style="padding:8px 12px 12px;gap:4px;align-items:center;text-align:center;%s">%s<b>%s</b>'
                  '<div class="xs soft" style="min-height:36px">%s</div><div class="row" style="gap:4px;height:24px;justify-content:center">%s</div>'
                  '<div style="width:100%%;display:grid">%s</div></div>') % (st, sprite(n, 'teen', 84, sil=not own, aria=n), n, desc, note, action)
    stages = ''
    for key, lv, label in STAGES:
        locked = LV < lv
        now = key == 'teen'
        st = 'border-color:var(--success);background:var(--successSoft)' if now else ''
        stages += ('<div class="card col" style="padding:8px;gap:0;align-items:center;text-align:center;%s">%s<b class="sm">%s</b><div class="xs soft">Từ Lv %d</div></div>'
                   ) % (st, sprite('Kitsu', key, 76, sil=locked, aria='Giai đoạn ' + label), '???' if locked else label, lv)
    body = defs('Kitsu', 'Bi', 'Lupo', 'Draco', 'Robo') + (
            '<div class="head"><div class="h2">Thú cưng</div>%s</div>%s'
            '<div class="col" style="gap:8px"><div class="h3">Chọn thú cưng</div><div class="grid" style="grid-template-columns:repeat(5,1fr)">%s</div></div>'
            '<div class="col" style="gap:8px"><div class="h3">Cây tiến hoá của Kitsu</div><div class="grid" style="grid-template-columns:repeat(5,1fr)">%s</div></div>'
            ) % (wallet(), hero, cards, stages)
    return study_shell('pet', body, dark)

# ---------- S3Shop: hình món đồ vẽ phẳng bằng token (@tên = var(--tên)) ----------
ART = {
 'bow': '<path d="M24 24 7 13v22z" fill="@danger"/><path d="m24 24 17-11v22z" fill="@danger"/><circle cx="24" cy="24" r="5" fill="@coin"/>',
 'glasses': '<circle cx="14" cy="26" r="8" fill="@primarySoft" stroke="@ink" stroke-width="3"/><circle cx="34" cy="26" r="8" fill="@primarySoft" stroke="@ink" stroke-width="3"/><path d="M21 24q3-2 6 0" fill="none" stroke="@ink" stroke-width="3"/>',
 'scarf': '<path d="M10 14h28a4 4 0 0 1 0 12H10a4 4 0 0 1 0-12z" fill="@danger"/><path d="M26 24h10v16H26z" fill="@danger"/><path d="M26 30h10M26 35h10M16 14v12M28 14v12" stroke="@coin" stroke-width="3"/>',
 'hat': '<path d="M14 8h20v26H14z" fill="@ink"/><rect x="6" y="32" width="36" height="6" rx="3" fill="@ink"/><rect x="14" y="26" width="20" height="5" fill="@danger"/>',
 'crown': '<path d="m7 15 9 9 8-14 8 14 9-9-4 24H11z" fill="@coin"/><circle cx="24" cy="30" r="3" fill="@danger"/><circle cx="15" cy="32" r="2" fill="@primary"/><circle cx="33" cy="32" r="2" fill="@primary"/>',
 'flower': '<g fill="@danger"><circle cx="24" cy="12" r="8"/><circle cx="35" cy="20" r="8"/><circle cx="31" cy="33" r="8"/><circle cx="17" cy="33" r="8"/><circle cx="13" cy="20" r="8"/></g><circle cx="24" cy="24" r="6" fill="@coin"/>',
 'party': '<path d="M24 5 38 41H10z" fill="@xp"/><path d="m18 20 11-4 3 8-17 7zM13 34l22-9 3 9-26 6z" fill="@coin"/><circle cx="24" cy="6" r="4" fill="@danger"/>',
 'phones': '<path d="M9 30v-6a15 15 0 0 1 30 0v6" fill="none" stroke="@ink" stroke-width="4"/><rect x="5" y="26" width="9" height="15" rx="4" fill="@primary"/><rect x="34" y="26" width="9" height="15" rx="4" fill="@primary"/>',
 'shades': '<path d="M4 18h40v5h-2l-2 9a5 5 0 0 1-5 3h-3a6 6 0 0 1-6-5l-1-5h-2l-1 5a6 6 0 0 1-6 5h-3a5 5 0 0 1-5-3l-2-9H4z" fill="@ink"/>',
 'cape': '<path d="M16 7h16l9 34q-17 6-34 0z" fill="@danger"/><path d="M14 7h20v6H14z" fill="@coin"/>',
 'wings': '<path d="M23 16C13 4 4 8 3 13c2 0 3 1 2 3 3-1 4 1 3 3 3-1 4 1 3 3 3 0 4 2 12 8z" fill="@primary"/><path d="M25 16c10-12 19-8 20-3-2 0-3 1-2 3-3-1-4 1-3 3-3-1-4 1-3 3-3 0-4 2-12 8z" fill="@primary"/>',
 'bowtie': '<path d="M24 24 8 15v18zM24 24l16-9v18z" fill="@primary"/><rect x="20" y="19" width="8" height="10" rx="3" fill="@ink"/>',
 'onigiri': '<path d="M24 7c4 0 18 22 18 28 0 4-3 6-7 6H13c-4 0-7-2-7-6 0-6 14-28 18-28z" fill="@surface" stroke="@line" stroke-width="2"/><rect x="15" y="29" width="18" height="12" fill="@ink"/>',
 'cake': '<path d="M7 24 32 11l9 13z" fill="@coin"/><rect x="7" y="24" width="34" height="16" rx="3" fill="@warningSoft" stroke="@warning" stroke-width="2"/><path d="M8 32h32" stroke="@danger" stroke-width="3"/><circle cx="31" cy="11" r="4" fill="@danger"/>',
 'melon': '<path d="M4 16h40a20 20 0 0 1-40 0z" fill="@success"/><path d="M8 16h32a16 16 0 0 1-32 0z" fill="@danger"/><g fill="@ink"><circle cx="18" cy="22" r="2"/><circle cx="30" cy="22" r="2"/><circle cx="24" cy="27" r="2"/></g>',
 'milktea': '<path d="M12 14h24l-3 28H15z" fill="@warning"/><path d="M12 14h24v5H12z" fill="@surface"/><path d="m26 14 4-11" stroke="@danger" stroke-width="3"/>',
 'apple': '<path d="M24 15c-5-5-17-3-17 10 0 9 7 17 12 17 2 0 3-1 5-1s3 1 5 1c5 0 12-8 12-17 0-13-12-15-17-10z" fill="@danger"/><path d="M24 15q0-7 7-10 1 7-7 10z" fill="@success"/>',
 'icecream': '<path d="m14 24 10 20 10-20z" fill="@warning"/><circle cx="24" cy="16" r="12" fill="@dangerSoft" stroke="@danger" stroke-width="2"/>',
 'pizza': '<path d="M24 45 5 12q19-9 38 0z" fill="@coin"/><path d="M5 12q19-9 38 0l-2 4q-17-8-34 0z" fill="@warning"/><g fill="@danger"><circle cx="19" cy="20" r="4"/><circle cx="31" cy="21" r="4"/><circle cx="24" cy="32" r="3"/></g>',
 'ramen': '<path d="M5 22h38a19 19 0 0 1-38 0z" fill="@danger"/><path d="M9 22q5-6 10 0t10 0 10 0" fill="none" stroke="@coin" stroke-width="3"/><path d="m28 20 14-16M33 20 45 8" stroke="@ink" stroke-width="2"/>',
 'energy': '<rect x="13" y="5" width="22" height="38" rx="5" fill="@primary"/><path d="m26 11-9 15h7l-2 12 9-16h-7z" fill="@coin"/>',
 'banana': '<path d="M9 9c0 18 11 32 31 30 2 0 4-3 1-4C26 33 16 24 15 8c-1-2-5-2-6 1z" fill="@coin"/><path d="M9 7h6v3H9z" fill="@warning"/>',
 'cookie': '<circle cx="24" cy="24" r="19" fill="@warning"/><g fill="@ink"><circle cx="17" cy="17" r="3"/><circle cx="30" cy="15" r="2.5"/><circle cx="32" cy="28" r="3"/><circle cx="20" cy="31" r="3"/></g>',
 'donut': '<circle cx="24" cy="24" r="19" fill="@warning"/><path d="M6 22a18 18 0 0 1 36 0c0 4-3 3-5 6s-4 0-7 2-5-1-8 1-5-1-8-1-8-3-8-8z" fill="@danger"/><circle cx="24" cy="24" r="6" fill="@surface2"/>',
}
def art(k):
    return '<svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true">%s</svg>' % re.sub(r'@(\w+)', r'var(--\1)', ART[k])

ACC = [('bow', 'Nơ hồng', 30, 0, 'worn'), ('glasses', 'Kính tròn', 60, 0, 'owned'), ('scarf', 'Khăn len', 80, 0, 'worn'), ('hat', 'Mũ chóp', 120, 5, ''),
       ('crown', 'Vương miện', 300, 10, ''), ('flower', 'Hoa cài đầu', 40, 0, ''), ('party', 'Nón tiệc', 70, 0, ''), ('phones', 'Tai nghe', 150, 5, ''),
       ('shades', 'Kính râm', 90, 3, ''), ('cape', 'Áo choàng', 200, 8, ''), ('wings', 'Đôi cánh', 450, 15, ''), ('bowtie', 'Nơ cổ', 70, 0, '')]
FOOD = [('onigiri', 'Cơm nắm', 10, 3), ('cake', 'Bánh ngọt', 25, 0), ('melon', 'Dưa hấu', 30, 1), ('milktea', 'Trà sữa', 20, 0), ('apple', 'Táo', 8, 5), ('icecream', 'Kem', 22, 0),
        ('pizza', 'Pizza', 35, 0), ('ramen', 'Mì ramen', 45, 2), ('energy', 'Nước tăng lực', 35, 0), ('banana', 'Chuối', 9, 0), ('cookie', 'Bánh quy', 15, 0), ('donut', 'Bánh donut', 20, 0)]

def shop_card(a, name, cost, note, action, faded=False):
    return ('<div class="card col" style="padding:12px;gap:8px;%s"><div class="row"><span class="art">%s</span><div class="col" style="gap:4px;min-width:0;align-items:flex-start"><b>%s</b>%s</div></div>'
            '<div class="row" style="justify-content:space-between;gap:8px;min-height:36px"><span class="xs soft">%s</span>%s</div></div>') % ('opacity:.65' if faded else '', a, name, price(cost), note, action)

def shop(tab=0, dark=False):
    if tab == 0:
        cards = ''
        for k, name, cost, lv, state in ACC:
            locked = LV < lv
            if state == 'worn':
                cards += shop_card(art(k), name, cost, chip('Đang đeo', 'success'), btn('Tháo'))
            elif state == 'owned':
                cards += shop_card(art(k), name, cost, '', btn('Đeo'))
            elif locked:
                cards += shop_card(art(k), name, cost, 'Cần Lv %d' % lv, dbtn('Mua'), True)
            else:
                cards += shop_card(art(k), name, cost, '', btn('Mua'))
        main = '<div class="grid" style="grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;flex:1">%s</div>' % cards
    elif tab == 1:
        cards = ''
        for n, desc, cost, lv in CHARS[1:]:
            own = n in OWNED
            short = cost - COINS
            act = dbtn('Đã có') if own else dbtn('Thiếu %d xu' % short) if short > 0 else btn('Mua', 'primary')
            cards += ('<div class="card col" style="gap:4px;padding:12px 16px;align-items:center;text-align:center;justify-content:center">%s<div class="h3">%s</div><div class="xs soft">%s</div>'
                      '<div class="row" style="gap:12px;margin-top:8px">%s%s</div></div>'
                      ) % (sprite(n, 'teen', 116, sil=not own, aria=n), n, desc, price(cost), act)
        main = '<div class="grid" style="grid-template-columns:repeat(2,1fr);grid-auto-rows:1fr;flex:1">%s</div>' % cards
    else:
        cards = ''
        for k, name, cost, n in FOOD:
            cards += shop_card(art(k), name, cost, chip('Đã có ×%d' % n, 'primary') if n else '', btn('Mua'))
        main = '<div class="grid" style="grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;flex:1">%s</div>' % cards
    slots = [('Đầu', 'Nơ hồng'), ('Mặt', 'Trống'), ('Cổ', 'Khăn len'), ('Lưng', 'Trống')]
    slot_html = ''.join('<div class="row sm" style="justify-content:space-between"><span class="soft">%s</span><b%s>%s</b></div>' % (a, ' class="soft"' if b == 'Trống' else '', b) for a, b in slots)
    msg = ['Đã mua Nơ hồng!', 'Đã mua Kitsu!', 'Đã mua Cơm nắm!'][tab]
    panel = ('<div class="card col" style="width:216px;flex:none;align-items:center;text-align:center;padding:16px">%s<div><div class="h3">%s</div><div class="xs soft">Kitsu · Lv %d</div></div>'
             '<div class="col" style="gap:8px;width:100%%;padding-top:12px;border-top:1px solid var(--line)">%s</div>'
             '<div class="note note--ok" style="width:100%%;margin-top:auto">%s</div></div>') % (sprite('Kitsu', 'teen', 140, aria='Mochi'), PET, LV, slot_html, msg)
    tb = tabs(['Phụ kiện cho Mochi', 'Thú cưng mới', 'Đồ ăn'], tab)
    body = defs('Kitsu', 'Lupo', 'Draco', 'Robo') + (
            '<div class="head" style="align-items:flex-start"><div><div class="h2">Cửa hàng</div><div class="sm soft">Kiếm xu bằng nhiệm vụ ngày và luyện tập nhé!</div></div>%s</div>'
            '%s<div class="row" style="flex:1;align-items:stretch;gap:16px;min-height:0"><div style="flex:1;min-width:0;display:flex;flex-direction:column">%s</div>%s</div>') % (wallet(), '<div>%s</div>' % tb, main, panel)
    return study_shell('shop', body, dark)

# ---------- S3Stats ----------
DAYS14 = list(range(18, 32))
REV14 = [24, 18, 0, 31, 42, 20, 35, 12, 0, 28, 46, 38, 30, 27]
MIN14 = [14, 11, 0, 19, 26, 12, 22, 8, 0, 17, 29, 24, 18, 16]
STAT_TABS = ['Tổng quan', 'Trình độ', 'Thời gian', 'Thành tựu']

def vbars(vals, color, height, show=None):
    top = max(vals + [1])
    show = show if show is not None else {len(vals) - 1, vals.index(top)}
    cols = ''.join('<div class="vcol">%s<i style="height:%dpx;background:var(--%s)"></i></div>' % (
        ('<span>%d</span>' % v) if i in show and v else '', max(2, v / top * (height - 24)), color) for i, v in enumerate(vals))
    return '<div class="vbars" style="height:%dpx">%s</div>' % (height, cols)

def vdays(days):
    return '<div class="vdays">%s</div>' % ''.join('<span>%02d</span>' % d for d in days)

def stats_head(active):
    return '<div class="head"><div class="h2">Thống kê</div>%s</div>' % tabs(STAT_TABS, active)

def delta(now, prev):
    d = now - prev
    if d == 0:
        return '<span class="delta">=</span>'
    return '<span class="delta">%s%d</span>' % (icon('up' if d > 0 else 'down'), abs(d))

def calendar():
    # 111 ngày kết thúc thứ Bảy 31/10: 16 cột, CN cuối để trống. Hai tuần cuối khớp số liệu 14 ngày.
    levels = []
    pattern = [2, 3, 1, 0, 2, 4, 3, 2, 1, 3, 0, 2, 1, 2, 3, 0, 1, 2, 4, 2, 3]
    for i in range(111 - 13):
        levels.append(pattern[(i * 7 + i // 5) % len(pattern)] if i > 6 else 0)
    def lv(r):
        return 0 if r == 0 else 1 if r < 15 else 2 if r < 30 else 3 if r < 40 else 4
    levels = levels[:97] + [lv(r) for r in REV14]
    cells = ''.join('<span class="cell l%d"></span>' % l for l in levels) + '<span class="cell none"></span>'
    wd = ['T2', '', 'T4', '', 'T6', '', 'CN']
    labels = '<div style="display:grid;grid-template-rows:repeat(7,1fr);gap:3px;width:24px;flex:none">%s</div>' % ''.join('<span class="xs soft" style="line-height:1;align-self:center">%s</span>' % w for w in wd)
    legend = '<div class="row xs soft" style="gap:4px">Ít%sNhiều</div>' % ''.join('<span class="cell l%d" style="width:12px;height:12px;aspect-ratio:auto"></span>' % l for l in range(5))
    return ('<div class="card col sec"><div class="row" style="justify-content:space-between"><b>Lịch hoạt động (16 tuần)</b>%s</div>'
            '<div class="row" style="gap:4px;align-items:stretch">%s<div class="cal">%s</div></div></div>') % (legend, labels, cells)

def missions():
    rows = [('Ôn 20 thẻ', 20, 20, True, ''), ('Lưu 5 từ mới', 3, 5, False, '+20 XP · +10 xu'), ('Ôn hết thẻ đến hạn', 12, 27, False, '+30 XP · +15 xu')]
    html = ''
    for name, p, t, done, rew in rows:
        html += ('<div class="row" style="padding:8px 0;border-top:1px solid var(--line);gap:12px"><span style="color:var(--%s);display:flex">%s</span>'
                 '<div class="col" style="flex:1;gap:4px;min-width:0"><div class="row" style="gap:8px"><b class="sm%s" style="flex:1;white-space:nowrap">%s</b>%s<b class="sm">%d/%d</b></div>%s</div></div>'
                 ) % ('success' if done else 'line', icon('circle-check' if done else 'circle'), ' soft' if done else '', name, chip('Đã nhận', 'success') if done else chip(rew, 'warning'), p, t, bar(p * 100 // t, 'success' if done else 'primary'))
    return ('<div class="card col sec" style="flex:1"><div class="row" style="justify-content:space-between"><b style="white-space:nowrap">Nhiệm vụ hôm nay</b>'
            '<div class="row xs soft" style="gap:8px;white-space:nowrap">Mục tiêu ôn mỗi ngày %s</div></div><div>%s</div>'
            '<div class="note note--xp row" style="gap:8px;margin-top:auto">%sXong cả ba: thưởng thêm +50 XP · +25 xu</div></div>') % (sel('20 thẻ', 'min-width:0;width:96px'), html, icon('gift'))

def stats(dark=False):
    kpi = [('flame', 'warning', '5', 'Chuỗi ngày ôn'), ('award', 'warning', '21', 'Chuỗi dài nhất'), ('target', 'primary', '2.184', 'Lượt ôn'), ('circle-check', 'success', '87%', 'Tỉ lệ nhớ'),
           ('sprout', 'success', '312', 'Từ trong sổ'), ('trending', 'xp', '4.840', 'XP'), ('calendar', 'primary', '63', 'Ngày đã học'), ('timer', 'xp', '38', 'Phiên luyện tập')]
    tiles = ''.join('<div class="card row" style="padding:12px">%s<div><div class="num">%s</div><div class="xs soft">%s</div></div></div>' % (icon_tile(i, c), v, l) for i, c, v, l in kpi)
    week = [('181', 'lượt ôn', 181, 170), ('23', 'từ mới', 23, 18), ('640', 'XP', 640, 690)]
    wk = ''.join('<div class="col" style="gap:4px;flex:1"><div class="row" style="gap:8px"><span class="num">%s</span>%s</div><span class="xs soft">%s</span></div>' % (v, delta(a, b), l) for v, l, a, b in week)
    body = (stats_head(0) +
            '<div class="grid" style="grid-template-columns:repeat(4,1fr)">%s</div>'
            '<div class="row" style="flex:1;align-items:stretch;gap:16px;min-height:0">'
            '<div class="col" style="width:420px;flex:none;gap:16px">%s<div class="card col sec" style="flex:1"><b>Lượt ôn 14 ngày gần nhất</b><div>%s%s</div></div></div>'
            '<div class="col" style="flex:1;gap:16px;min-width:0"><div class="card col sec"><b>Tuần này</b><div class="row" style="gap:12px">%s</div><div class="xs soft">Mũi tên so với 7 ngày trước đó.</div></div>%s</div></div>'
            ) % (tiles, calendar(), vbars(REV14, 'primary', 124), vdays(DAYS14), wk, missions())
    return study_shell('stats', body, dark)

def stats_level(empty=False):
    skills = [('Từ vựng', 'B1.1', 1512, 186, True), ('Ngữ pháp', 'A2.2', 1344, 142, False), ('Đọc hiểu', 'B1.1', 1468, 96, False), ('Nghe', 'A2.2', 1286, 74, False)]
    if empty:
        skills = [(a, 'A1.1', 1000, 0, False) for a, _, _, _, _ in skills]
    sk = ''
    for name, lv, rating, games, ready in skills:
        act = '<button class="btn btn--primary" title="Rating cao hơn level hiện tại">%sSẵn sàng lên cấp</button>' % icon('up') if ready else ''
        sk += '<div class="set"><div class="row" style="gap:8px"><b style="width:80px">%s</b>%s<span class="xs soft">%d · %d câu</span></div>%s</div>' % (name, chip(lv, 'primary'), rating, games, act)
    acc = [('Trắc nghiệm', 91, 112, 123), ('Điền từ', 84, 58, 69), ('Nghe chọn nghĩa', 76, 41, 54), ('Sắp xếp câu', 72, 33, 46), ('Nghe chép', 54, 19, 35), ('Thẻ: nhận diện', 88, 640, 727), ('Thẻ: Việt → Anh', 69, 148, 214)]
    ar = ''
    for name, p, c, t in acc:
        col = 'danger' if p < 60 else 'warning' if p < 80 else 'success'
        ar += '<div class="row sm" style="gap:12px;height:24px"><span style="width:124px;flex:none">%s</span><div style="flex:1">%s</div><span style="width:116px;white-space:nowrap;text-align:right;flex:none"><b>%d%%</b> <span class="xs soft">(%d/%d)</span></span></div>' % (name, bar(p, col), p, c, t)
    if empty:
        ar = '<div class="soft sm" style="padding:24px 0;text-align:center">Chưa có dữ liệu: làm vài bài tập hoặc ôn thẻ nhé.</div>'
    states = [('Mới', 48, 'line'), ('Đang học', 36, 'warning'), ('Ôn dài hạn', 214, 'success'), ('Học lại', 14, 'danger')]
    total = sum(s[1] for s in states)
    stack = '<div class="stack">%s</div>' % ''.join('<i style="flex:%d;background:var(--%s)"></i>' % (n, c) for _, n, c in states)
    leg = ''.join('<div class="row sm" style="gap:8px"><span class="dot" style="background:var(--%s)"></span>%s<b style="margin-left:auto">%d</b></div>' % (c, l, n) for l, n, c in states)
    levels = [('Pre-A1', 12), ('A1.1', 46), ('A1.2', 68), ('A2.1', 84), ('A2.2', 58), ('B1.1', 32), ('B1.2', 12)]
    mx = max(c for _, c in levels)
    lr = ''.join('<div class="row xs" style="gap:8px;height:28px"><b style="width:44px;flex:none">%s</b><div style="flex:1"><div class="bar"><i style="width:%d%%;background:var(--xp)"></i></div></div><span style="width:24px;text-align:right">%d</span></div>' % (l, c * 100 / mx, c) for l, c in levels)
    if empty:
        stack = ''
        leg = ''.join('<div class="row sm" style="gap:8px"><span class="dot" style="background:var(--%s)"></span>%s<b style="margin-left:auto">0</b></div>' % (c, l) for l, _, c in states)
        lr = '<div class="soft sm" style="padding:24px 0;text-align:center">Chưa có từ nào trong sổ.</div>'
    body = (stats_head(1) +
            '<div class="row" style="flex:1;align-items:stretch;gap:16px;min-height:0"><div class="col" style="flex:1;gap:16px;min-width:0">'
            '<div class="card col sec"><b>Trình độ theo kỹ năng</b><div>%s</div><div class="xs soft">Cập nhật sau mỗi lần làm bài kiểm tra trình độ.</div></div>'
            '<div class="card col sec" style="flex:1"><b>Độ chính xác theo dạng bài (30 ngày)</b><div class="col" style="gap:8px;flex:1">%s</div><div class="xs soft">Bài tập: tỉ lệ làm đúng. Thẻ ôn: tỉ lệ nhớ (chấm Khó/Được/Dễ).</div></div></div>'
            '<div class="col" style="width:300px;flex:none;gap:16px">'
            '<div class="card col sec"><div class="row" style="justify-content:space-between"><b>Thẻ theo trạng thái</b><span class="xs soft">%s</span></div>%s<div class="col" style="gap:4px">%s</div></div>'
            '<div class="card col sec" style="flex:1"><b>Từ trong sổ theo level</b><div class="col" style="gap:4px">%s</div></div></div></div>'
            ) % (sk, ar, ('%d thẻ' % total) if not empty else '', stack, leg, lr)
    return study_shell('stats', body)

def stats_time():
    times = [('16', 'phút hôm nay'), ('112', 'phút tuần này'), ('64,5', 'giờ tổng cộng')]
    tt = ''.join('<div class="card" style="padding:12px 16px"><div class="num">%s</div><div class="xs soft">%s</div></div>' % t for t in times)
    hard = [('necessary', 7, 19), ('accommodate', 6, 17), ('although', 5, 22), ('thorough', 5, 14), ('schedule', 4, 18), ('receipt', 4, 12), ('environment', 3, 16)]
    hl = ''.join('<div class="row" style="padding:12px 0;border-top:1px solid var(--line);gap:12px"><span class="xs soft" style="width:12px">%d</span><div><b>%s</b><div class="xs soft">quên %d lần / %d lượt ôn</div></div></div>' % (i + 1, w, a, b) for i, (w, a, b) in enumerate(hard))
    body = (stats_head(2) +
            '<div class="row" style="flex:1;align-items:stretch;gap:16px;min-height:0"><div class="col" style="flex:1;gap:16px;min-width:0">'
            '<div class="grid" style="grid-template-columns:repeat(3,1fr)">%s</div>'
            '<div class="card col sec" style="flex:1"><b>Thời gian học</b><div style="margin-top:auto">%s%s</div><div class="xs soft">Chỉ tính lúc cửa sổ Học tập đang hiện và được chọn. Cột là số phút mỗi ngày (14 ngày gần nhất).</div></div></div>'
            '<div class="card col sec" style="width:300px;flex:none"><b>Từ hay quên nhất</b><div>%s</div></div></div>'
            ) % (tt, vbars(MIN14, 'warning', 380), vdays(DAYS14), hl)
    return study_shell('stats', body)

ACH_GROUPS = [('Chuỗi ngày', 'flame', 3, 5), ('Ôn tập', 'repeat', 3, 4), ('Từ vựng', 'book', 3, 4), ('Luyện tập', 'target', 2, 4), ('Bài học', 'cap', 2, 4), ('Điểm tuyệt đối', 'star', 1, 3), ('Chuyên cần', 'calendar', 2, 3), ('Kinh nghiệm', 'bolt', 2, 4), ('Trí nhớ', 'heart', 0, 1)]
TIER = {'bronze': 'warning', 'silver': 'inkSoft', 'gold': 'coin', 'diamond': 'primary'}

def stats_ach():
    nav = ''
    done = sum(g[2] for g in ACH_GROUPS)
    total = sum(g[3] for g in ACH_GROUPS)
    for i, (n, ic, d, t) in enumerate(ACH_GROUPS):
        nav += '<div class="nav%s" style="justify-content:space-between;height:48px"><span class="row sm" style="gap:8px">%s%s</span><span class="xs">%d/%d</span></div>' % (' on' if i == 0 else '', icon(ic), n, d, t)
    items = [('Khởi động', 3, 3, 'bronze'), ('Một tuần lửa', 7, 7, 'silver'), ('Hai tuần bền bỉ', 14, 14, 'silver'), (None, 21, 30, 'gold'), (None, 21, 100, 'diamond')]
    cards = ''
    for name, cur, target, tier in items:
        on = name is not None
        medal = '<span class="medal" style="%s">%s</span>' % (('background:color-mix(in srgb,var(--%s) 20%%,var(--surface));color:var(--%s)' % (TIER[tier], TIER[tier])) if on else '', icon('flame' if on else 'lock'))
        cards += ('<div class="card col" style="align-items:center;justify-content:center;text-align:center;gap:4px;%s">%s<b style="margin-top:4px">%s</b><div class="xs soft">Ôn %d ngày liên tiếp</div>'
                  '<div style="width:80%%;margin-top:4px">%s</div><div class="xs soft">%d/%d</div></div>'
                  ) % ('' if on else 'background:var(--surface2)', medal, name or '???', target, bar(cur * 100 // target, 'success' if on else 'primary'), min(cur, target) if on else cur, target)
    body = (stats_head(3) +
            '<div class="card row" style="padding:12px 16px;gap:16px"><span style="color:var(--coin);display:flex">%s</span><b style="white-space:nowrap">Đã mở khoá %d/%d</b><div style="flex:1">%s</div></div>'
            '<div class="row" style="flex:1;align-items:stretch;gap:16px;min-height:0"><div class="card col" style="width:220px;flex:none;gap:4px;padding:8px">%s</div>'
            '<div class="col" style="flex:1;min-width:0;gap:12px"><div class="h3">Chuỗi ngày</div><div class="grid" style="grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;flex:1">%s</div></div></div>'
            ) % (icon('award'), done, total, bar(done * 100 // total, 'xp'), nav, cards)
    return study_shell('stats', body)

# ---------- S3Settings: trang dài cũ tách thành nhóm con, đủ mọi trường ----------
SNAV = [('Hồ sơ và học tập', 'user'), ('Ôn thẻ', 'repeat'), ('Giọng đọc và nói', 'volume'), ('Dịch', 'languages'), ('Mascot và yên lặng', 'moon'), ('Cập nhật và gói tải', 'package'), ('Giấy phép', 'info')]

def settings_shell(active, body, dark=False):
    nav = ''.join('<div class="nav%s">%s%s</div>' % (' on' if i == active else '', icon(ic), l) for i, (l, ic) in enumerate(SNAV))
    page = ('<div class="h2">Cài đặt</div><div class="row" style="flex:1;align-items:flex-start;gap:16px;min-height:0"><div class="snav">%s</div>'
            '<div class="col" style="flex:1;min-width:0;gap:16px">%s</div></div>') % (nav, body)
    return study_shell('settings', page, dark)

def sec(title, inner, hint=''):
    return '<div class="card col sec"><div class="h3" style="font-size:16px">%s</div>%s%s</div>' % (title, ('<div class="xs soft">%s</div>' % hint) if hint else '', inner)

def set_profile(dark=False):
    p1 = ('<div class="item" style="background:var(--primarySoft);border-color:var(--primary)"><div style="flex:1;min-width:0"><b>Lan</b> <span class="sm soft">· Người đi làm, giao tiếp hằng ngày · Mochi</span></div>'
          '<span class="row xs" style="gap:4px;color:var(--primary);font-weight:700">%sđang dùng</span><button class="btn btn--ghost btn--icon" aria-label="Sửa">%s</button></div>') % (icon('check', 'ic', 'width:14px;height:14px'), icon('pen'))
    p2 = ('<div class="item col" style="align-items:stretch"><div class="grid" style="grid-template-columns:1fr 1fr 1.4fr;gap:8px">'
          '<div class="xs soft col" style="gap:4px">Tên của bạn<div class="input" style="color:var(--ink)">Bống</div></div>'
          '<div class="xs soft col" style="gap:4px">Tên thú cưng<div class="input" style="color:var(--ink)">Bi</div></div>'
          '<div class="xs soft col" style="gap:4px">Mục tiêu học%s</div></div>'
          '<div class="note note--warn" style="font-weight:500">Hồ sơ trẻ em dùng giao diện của bé; phụ huynh vào lại bằng mã PIN. Level và XP được giữ nguyên.</div>'
          '<div class="row" style="gap:8px">%s%s</div></div>') % (sel('Tiểu học (7–11 tuổi)'), btn('Lưu', 'primary'), btn('Huỷ', 'ghost'))
    p3 = ('<div class="item"><div style="flex:1;min-width:0"><b>Minh</b> <span class="sm soft">· Luyện thi TOEIC · Rex</span></div>%s<button class="btn btn--ghost btn--icon" aria-label="Sửa">%s</button></div>') % (btn('Dùng hồ sơ này'), icon('pen'))
    add = '<div class="row" style="gap:8px"><div class="input" style="flex:1">Thêm hồ sơ</div>%s<button class="btn dis">Tạo hồ sơ</button></div>' % sel('Người đi làm')
    learn = setrow('Trình độ', '<div class="row" style="gap:8px">%s%s</div>' % (sel('A2 · A2.1'), btn('Kiểm tra lại'))) + setrow('Mục tiêu ôn mỗi ngày', sel('20 thẻ')) + setrow('Mascot nhắc ôn từ', sel('Mỗi 25 phút'))
    return settings_shell(0, sec('Hồ sơ người học', '<div class="col" style="gap:8px">%s%s%s%s</div>' % (p1, p2, p3, add)) + sec('Học tập', '<div>%s</div>' % learn), dark)

def set_review():
    sels = setrow('Từ mới mỗi ngày', sel('10 từ mới')) + setrow('Thứ tự thẻ', sel('Xen kẽ theo hạn')) + setrow('Ẩn từ vừa ôn', sel('Ẩn 30 phút'))
    tog = [('Thẻ Việt → Anh (gõ từ)', True), ('Thẻ nghe – gõ', True), ('Thẻ điền từ vào câu', False), ('Trắc nghiệm nghĩa ở thẻ nhận diện (tắt = chỉ lật thẻ rồi tự chấm)', True), ('Gõ đáp án (tắt = chỉ lật thẻ rồi tự chấm)', True), ('Tự đọc từ khi hiện thẻ', True)]
    tg = ''.join(setrow(l, sw(o)) for l, o in tog)
    return settings_shell(1, sec('Ôn thẻ', '<div>%s</div><div class="xs soft">Sau khi ôn một từ (kể cả chấm "Quên"), các thẻ của từ đó tạm ẩn để không gặp lại ngay hay lặp lại khi bạn thoát ra vào lại.</div>' % sels) +
                          sec('Loại thẻ', '<div>%s</div><div class="row" style="justify-content:space-between;padding-top:8px;border-top:1px solid var(--line)"><span class="xs soft" style="max-width:320px">Bật thêm loại thẻ? Tạo bù thẻ phụ cho các từ bạn đã thuộc.</span>%s</div>' % (tg, btn('Tạo thẻ cho từ đã thuộc')),
                              'Khi bạn thuộc một từ, app tự tạo thêm các thẻ phụ để nhớ sâu hơn (đến hạn từ ngày hôm sau):'))

def set_voice(kokoro=None, whisper=None):
    """kokoro, whisper: html trạng thái tải/lỗi thay cho dòng 'Đã sẵn sàng' (dùng ở gen_s6)."""
    t = (setrow('Giọng mặc định', sel('Mỹ (US)')) +
         '<div class="set"><span class="row" style="gap:8px"><span class="rad"></span>Giọng Windows (có sẵn)</span></div>' +
         (kokoro or '<div class="set"><span class="row" style="gap:8px"><span class="rad on"></span>Giọng tự nhiên (Kokoro, offline)</span><span class="row xs" style="gap:4px;color:var(--success);font-weight:700">%sĐã sẵn sàng</span></div>' % icon('check', 'ic', 'width:14px;height:14px')) +
         ('' if kokoro else setrow('Giọng Mỹ', '<div class="row" style="gap:8px">%s%s</div>' % (sel('Heart (nữ, Mỹ)'), btn('Nghe thử', '', 'volume'))) +
         setrow('Giọng Anh', '<div class="row" style="gap:8px">%s%s</div>' % (sel('George (nam, Anh)'), btn('Nghe thử', '', 'volume')))))
    s = ((whisper or '<div class="set"><span class="row sm" style="gap:8px"><span style="color:var(--success);display:flex">%s</span>Model Whisper base.en đã sẵn sàng (76 MB)</span></div>' % icon('check')) +
         '<div class="set"><div style="flex:1"><b class="sm">Chấm phát âm chi tiết (tuỳ chọn)</b><div class="xs soft">Model nhận dạng từng âm (wav2vec2) giúp chỉ ra âm nào sai. Tải thêm, không bắt buộc.</div></div>%s</div>' % btn('Tải model (339 MB)', '', 'download'))
    return settings_shell(2, sec('Giọng đọc', '<div>%s</div><div class="xs soft">Âm thanh đã tạo được lưu lại để nghe lại tức thì. Lần đầu nghe một câu mới mất khoảng 1–3 giây.</div>' % t) +
                          sec('Nhận dạng giọng nói (bài nói)', '<div>%s</div>' % s, 'Dùng để chấm bài luyện nói. Chạy hoàn toàn trên máy bạn; âm thanh không được lưu và không gửi đi đâu.'))

def set_translate():
    m1 = ('<div class="set" style="padding:8px 0"><div style="flex:1"><b class="sm">Anh → Việt</b><div class="xs soft row" style="gap:4px;color:var(--success)">%sĐã sẵn sàng (102 MB)</div></div>%s</div>') % (icon('check', 'ic', 'width:14px;height:14px'), btn('Xoá model'))
    m2 = ('<div class="set" style="padding:8px 0"><div style="flex:1;min-width:0"><b class="sm">Việt → Anh</b><div class="xs soft" style="margin-bottom:4px">Đang tải… 61/102 MB</div>%s</div>%s</div>') % (bar(60), btn('Huỷ'))
    m3 = ('<div class="set" style="padding:8px 0"><div style="flex:1;min-width:0"><b class="sm">Chất lượng cao NLLB-200 (cả hai chiều Anh ↔ Việt)</b><div class="xs soft">Chưa tải (831 MB)</div><div class="xs" style="color:var(--danger)">Không tải được model. Kiểm tra mạng rồi thử lại.</div></div>%s</div>') % btn('Thử lại')
    offline = '<div>%s%s%s%s</div>' % (setrow('Ưu tiên bản chất lượng cao khi đã tải (chậm hơn, chuẩn hơn)', sw(False)), m1, m2, m3)
    online = ('<div>%s</div><div class="row" style="gap:8px"><div class="input" style="flex:1">sk-ant-…</div><button class="btn dis">Lưu key</button>%s</div><div class="xs soft">Đã lưu key (mã hoá trên máy này).</div>') % (setrow('Dịch bằng Claude khi có key', sw(False)), btn('Xoá key'))
    return settings_shell(3, sec('Dịch câu offline', offline, 'Mỗi chiều dịch cần một model tải một lần, chạy hoàn toàn trên máy bạn. Có thể xoá để lấy lại dung lượng. Bản chất lượng cao dùng NLLB-200 (Meta, CC-BY-NC 4.0, chỉ dùng phi thương mại).') +
                          sec('Dịch online (Claude)', online, 'Tuỳ chọn, mặc định tắt. Bật thì văn bản bạn bôi đen được gửi tới Anthropic để dịch chuẩn hơn và nhanh hơn; cần API key của chính bạn (tính phí theo mức dùng của bạn). Lỗi mạng/key thì app tự dịch bằng model offline.'))

def set_mascot():
    quiet = (setrow('Ẩn mascot khi đang họp (Zoom, Teams, Meet…)', sw(True)) +
             '<div class="set"><span class="row" style="gap:12px">%sGiờ không làm phiền</span><span class="row sm soft" style="gap:8px">từ<div class="input" style="color:var(--ink);width:80px">22:00</div>đến<div class="input" style="color:var(--ink);width:80px">07:00</div></span></div>' % sw(True))
    look = setrow('Ngôn ngữ', sel('Tiếng Việt')) + setrow('Kích thước mascot', sel('Vừa')) + setrow('Khởi động cùng Windows', sw(True))
    quick = setrow('Tự lấy chữ đang bôi đen', sw(True))
    return settings_shell(4, sec('Chế độ yên lặng', '<div>%s</div>' % quiet) + sec('Giao diện', '<div>%s</div>' % look) +
                          sec('Dịch nhanh (Ctrl+Alt+T)', '<div>%s</div><div class="xs soft">Bôi đen chữ rồi bấm Ctrl+Alt+T là dịch được, không cần Ctrl+C. App gửi Ctrl+C giả lập rồi trả clipboard về như cũ. Không áp dụng trong terminal (Ctrl+C ở đó là ngắt lệnh): trong terminal hãy tự copy rồi bấm Ctrl+Alt+T.</div>' % quick))

def set_app(status=None):
    """status: html thay dòng 'Có bản mới' (dùng ở gen_s6)."""
    upd = ('<div>%s</div>%s<div class="xs soft">Việc kiểm tra chỉ hỏi GitHub Releases xem có bản mới không (không gửi dữ liệu học của bạn). App không tự tải hay tự cài khi bạn chưa đồng ý.</div>'
           ) % (setrow('Tự kiểm tra bản mới', sw(True)), status or '<div class="set"><div class="sm"><b>Có bản mới 1.7.0 (~94 MB).</b></div>%s</div>' % btn('Tải bản mới', 'primary', 'download'))
    a = ('<div class="set" style="padding:8px 0;align-items:flex-start"><div style="flex:1;min-width:0"><div class="row" style="gap:8px"><span style="display:flex">%s</span><b class="sm">Âm thanh bài nghe tạo sẵn</b></div>'
         '<div class="xs soft">Tải thêm (~21 MB) để bài nghe phát ngay bằng giọng tự nhiên, không cần tải model giọng đọc. Không bắt buộc.</div>'
         '<div class="row xs" style="gap:8px;margin-top:4px;color:var(--success);font-weight:700">Đã cài%s</div></div>%s</div>') % (icon('headphones'), chip('Có bản mới', 'primary'), '<div class="col" style="gap:8px;align-items:stretch;flex:none">%s%s</div>' % (btn('Cập nhật (21 MB)'), btn('Gỡ gói', 'ghost')))
    s = ('<div class="set" style="padding:8px 0;align-items:flex-start"><div style="flex:1;min-width:0"><div class="row" style="gap:8px"><span style="display:flex">%s</span><b class="sm">Thú cưng nét hơn (độ phân giải cao)</b></div>'
         '<div class="xs soft">Tải thêm (~63 MB) để thú cưng và phụ kiện hiện ở độ phân giải 288px, sắc nét hơn bản 96px trong bộ cài. Không bắt buộc.</div>'
         '<div class="xs soft" style="margin:4px 0">Đang tải… 42%%</div>%s</div>%s</div>') % (icon('paw'), bar(42), btn('Huỷ'))
    return settings_shell(5, sec('Cập nhật', upd, 'Phiên bản hiện tại: 1.6.0') + sec('Gói tải thêm', '<div>%s%s</div>' % (a, s)))

def set_credits():
    lines = ['Giọng tự nhiên: Kokoro-82M (hexgrad), Apache-2.0.', 'Kokoro được huấn luyện một phần trên dữ liệu CC BY: Koniwa (CC BY 3.0), SIWIS (CC BY 4.0).', 'Phiên âm: eSpeak-NG qua phonemizer, GPL-3.0.', 'Dịch câu: opus-mt en→vi (Helsinki-NLP), Apache-2.0.',
             'Dịch chất lượng cao: NLLB-200 distilled 600M (Meta AI; bản ONNX q8 của Xenova), CC-BY-NC 4.0 (phi thương mại).', 'Whisper base.en (OpenAI, Apache-2.0; bản ONNX của Xenova): nhận dạng giọng nói offline cho bài nói.',
             'wav2vec2 phoneme (Meta/Facebook, Apache-2.0; bản ONNX int8 của duyentq): chấm phát âm theo âm vị, tải tuỳ chọn.', 'Câu ví dụ: Tatoeba, CC BY 2.0 FR.', 'Hình minh hoạ bổ sung: Twemoji (Twitter, Inc. và những người đóng góp; bản jdecked/twemoji), CC-BY 4.0. Hình đã đổi kích thước.']
    li = ''.join('<div class="sm" style="padding:8px 0;border-top:1px solid var(--line)">%s</div>' % l for l in lines)
    return settings_shell(6, sec('Giấy phép và ghi công', '<div>%s</div>' % li))

# ---------- S3Onboarding: 3 bước, toàn màn ----------
TRACKS = ['Mầm non (3–6 tuổi)', 'Tiểu học (7–11 tuổi)', 'Học sinh (12–17 tuổi)', 'Người đi làm, giao tiếp hằng ngày', 'Luyện thi TOEIC', 'Luyện thi IELTS']

def choice(label, on=False):
    st = 'background:var(--primarySoft);border-color:var(--primary);color:var(--primary);font-weight:700' if on else ''
    return '<div class="item sm" style="min-height:40px;font-weight:600;%s">%s</div>' % (st, label)

def scene(cast, caption=''):
    # Đồi và mặt trời bằng token; nhân vật đứng trên đồi
    bg = village().kid_scene(400)
    return ('<div style="position:relative;width:400px;flex:none;background:var(--surface2);overflow:hidden">%s%s%s</div>') % (bg, caption, cast)

def stepper(n):
    dots = ''.join('<i style="display:block;flex:1;height:8px;border-radius:var(--r-pill);background:var(--%s)"></i>' % ('primary' if i <= n else 'surface2') for i in range(1, 4))
    return '<div class="row" style="gap:8px"><span class="xs soft" style="white-space:nowrap">Bước %d/3</span><div class="row" style="gap:8px;flex:1">%s</div></div>' % (n, dots)

def onboarding_page(n, sc, form, nav):
    return ('<div class="t" style="width:1100px;height:720px;display:flex;overflow:hidden">%s%s'
            '<div style="flex:1;display:flex;flex-direction:column;gap:24px;padding:40px;min-width:0">%s'
            '<div class="col" style="gap:24px;flex:1;justify-content:center"><div class="h2">Chào mừng bạn đến với English Assistant!</div>%s</div><div class="row" style="justify-content:space-between">%s</div></div></div>'
            ) % (defs('Bi', 'Kitsu', 'Draco', 'Robo', 'Lupo'), sc, stepper(n), form, nav)

def onb1():
    cast = ('<div style="position:absolute;left:0;right:0;bottom:64px;height:320px">'
            '<div style="position:absolute;left:24px;bottom:96px">%s</div><div style="position:absolute;right:16px;bottom:112px">%s</div>'
            '<div style="position:absolute;left:0;bottom:0">%s</div><div style="position:absolute;left:128px;bottom:-16px">%s</div><div style="position:absolute;right:-8px;bottom:8px">%s</div></div>'
            ) % (sprite('Draco', 'teen', 120, aria='Draco'), sprite('Robo', 'teen', 110, aria='Robo'), sprite('Kitsu', 'teen', 130, aria='Kitsu'), sprite('Bi', 'baby', 150, aria='Bi'), sprite('Lupo', 'teen', 130, aria='Lupo'))
    form = ('<div class="h3">Bạn tên là gì và học tiếng Anh để làm gì?</div>'
            '<div class="col" style="gap:8px"><b class="sm">Tên của bạn</b><div class="input" style="color:var(--ink)">Lan</div></div>'
            '<div class="col" style="gap:8px"><b class="sm">Mục tiêu / độ tuổi</b><div class="grid" style="grid-template-columns:1fr 1fr;gap:8px">%s</div>'
            '<div class="xs soft">Hồ sơ trẻ em: ẩn từ nhạy cảm, thú cưng đói chậm hơn.</div></div>') % ''.join(choice(t, i == 1) for i, t in enumerate(TRACKS))
    return onboarding_page(1, scene(cast), form, '<span></span>' + btn('Tiếp tục', 'primary'))

def onb2():
    cast = '<div style="position:absolute;left:0;right:0;bottom:96px;display:grid;place-items:center">%s</div>' % sprite('Bi', 'egg', 300, aria='Trứng mầm của Bi')
    form = ('<div class="h3">Đặt tên cho bạn đồng hành nhỏ của bạn</div>'
            '<div class="col" style="gap:8px"><b class="sm">Tên thú cưng</b><div class="input" style="color:var(--ink);border-color:var(--primary);box-shadow:0 0 0 3px var(--primarySoft)">Bi</div>'
            '<div class="xs soft">Tối đa 20 ký tự. Đổi lại được ở trang Thú cưng.</div></div>')
    return onboarding_page(2, scene(cast), form, btn('Quay lại', 'ghost') + btn('Tiếp tục', 'primary'))

def onb3():
    cast = '<div style="position:absolute;left:0;right:0;bottom:96px;display:grid;place-items:center">%s</div>' % sprite('Bi', 'baby', 280, aria='Bi')
    lv = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1']
    form = ('<div class="h3">Trình độ hiện tại của bạn?</div>'
            '<div class="col" style="gap:8px"><div style="display:grid">%s</div><div class="xs soft">Chính xác nhất: Bi sẽ chọn từ vừa sức với bạn.</div></div>'
            '<div class="col" style="gap:8px"><b class="sm">Hoặc tự chọn:</b><div class="grid" style="grid-template-columns:repeat(3,1fr);gap:8px">%s</div></div>'
            ) % (btn('Làm bài kiểm tra (khoảng 3 phút)', 'primary', 'test').replace('class="btn btn--primary"', 'class="btn btn--primary" style="height:48px;font-size:16px"'), ''.join('<div class="item" style="justify-content:center;font-weight:700;height:48px">%s</div>' % l for l in lv))
    return onboarding_page(3, scene(cast), form, btn('Quay lại', 'ghost') + '<span></span>')

# ---------- S3Evolution: toàn màn tối, ba pha gom vào hai bảng ----------
EVO_CSS = """
@keyframes s3turn{to{transform:rotate(360deg)}}
@keyframes s3glow{0%,100%{opacity:.55}50%{opacity:1}}
.rays{position:absolute;left:50%;top:50%;width:1000px;height:1000px;margin:-500px 0 0 -500px;border-radius:var(--r-pill);
 background:repeating-conic-gradient(var(--xpSoft) 0 12deg,transparent 12deg 24deg);opacity:.55;animation:s3turn 40s linear infinite;
 -webkit-mask:radial-gradient(circle,black 0,transparent 66%);mask:radial-gradient(circle,black 0,transparent 66%)}
.halo{position:absolute;left:50%;top:50%;width:420px;height:420px;margin:-260px 0 0 -210px;border-radius:var(--r-pill);background:radial-gradient(circle,var(--coin) 0,transparent 68%);opacity:.5;animation:s3glow 1.6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.rays,.halo{animation:none}}
"""

def evo_track(active):
    out = ''
    for i, (k, lv, label) in enumerate(STAGES):
        on = i == active
        out += '<span class="chip%s">%s</span>' % (' chip--xp' if on else '', label)
    return '<div class="row" style="gap:8px;justify-content:center">%s</div>' % out

def evolution(final=True):
    if final:
        pet = sprite('Kitsu', 'teen', 340, aria='Mochi giai đoạn Thiếu niên')
        title = 'Mochi đã tiến hoá thành Thiếu niên!'
        foot = btn('Tuyệt vời!', 'primary')
        rays = '<div class="rays"></div><div class="halo"></div>'
    else:
        pet = sprite('Kitsu', 'baby', 340, sil=True, aria='Mochi đang đổi hình', style='animation:s3glow .7s ease-in-out infinite')
        title = 'Mochi đang tiến hoá…'
        foot = '<div style="height:36px"></div>'  # nút chỉ hiện ở pha cuối
        rays = '<div class="halo"></div>'
    body = ('<div class="t dark" style="position:relative;width:1100px;height:720px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">'
            '%s%s<div class="h2" style="position:relative;font-size:32px">%s</div><div style="position:relative">%s</div><div style="position:relative">%s</div><div style="position:relative;margin-top:8px">%s</div></div>'
            ) % (defs('Kitsu'), rays, title, pet, evo_track(2 if final else 1), foot)
    return W('S3Evolution' if final else 'S3EvolutionStart', body, 'Tiến hoá' if final else 'Đang tiến hoá', css=_load('Kitsu')['css'] + EVO_CSS)

# ---------- S3Parent ----------
def parent(dark=False):
    days = [25, 26, 27, 28, 29, 30, 31]
    mins = [12, 20, 15, 0, 25, 30, 18]
    usage = ('<div class="card col sec" style="flex:1"><div class="row" style="justify-content:space-between"><b>Thời gian bé dùng app (phút/ngày)</b><span class="sm soft">Hôm nay: 18 phút · giới hạn 30 phút</span></div>'
             '<div style="margin-top:auto">%s%s</div><div class="xs soft">Số trên cột là phút dùng app mỗi ngày trong 7 ngày gần nhất.</div></div>') % (vbars(mins, 'primary', 340, show=set(range(7))), vdays(days))
    def prog(title, a, b, color):
        return '<div class="card col sec"><b>%s</b>%s<div class="sm soft">%d / %d</div></div>' % (title, bar(a * 100 // b, color), a, b)
    hard = [('elephant', 'con voi', 4), ('butterfly', 'con bướm', 3), ('yellow', 'màu vàng', 3), ('sister', 'chị gái', 2), ('kitchen', 'nhà bếp', 2), ('rainbow', 'cầu vồng', 2), ('Thursday', 'thứ Năm', 1)]
    hl = ''.join('<div class="row" style="padding:8px 0;border-top:1px solid var(--line);gap:8px"><b>%s</b><span class="sm soft" style="flex:1">%s</span><span class="xs soft">quên %d lần</span></div>' % h for h in hard)
    ctrl = ('<div class="set"><span>Giới hạn mỗi ngày</span>%s</div><div class="col" style="gap:8px">%s%s</div><div class="note note--ok">Đã cho bé dùng thêm 10 phút hôm nay.</div>'
            ) % (sel('30 phút', 'min-width:112px'), btn('Cho dùng thêm 10 phút', 'primary'), btn('Đặt / đổi PIN'))
    body = ('<div class="head"><div class="h2">Báo cáo cho phụ huynh</div><span class="chip chip--primary">Bống · Tiểu học</span></div>'
            '<div class="row" style="flex:1;align-items:stretch;gap:16px;min-height:0"><div class="col" style="flex:1;gap:16px;min-width:0">%s<div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">%s%s</div></div>'
            '<div class="col" style="width:300px;flex:none;gap:16px"><div class="card col sec" style="flex:1"><b>Từ bé hay chưa nhớ</b><div>%s</div></div><div class="card col sec"><b>Cài đặt cho bé</b>%s</div></div></div>'
            ) % (usage, prog('Sticker đã dán', 24, 60, 'xp'), prog('Hoạt động đã chơi', 18, 72, 'success'), hl, ctrl)
    return study_shell('', body, dark)

# ---------- Xuất ----------
if __name__ == '__main__':
    W('S3Pet', pet_page(), 'Thú cưng')
    W('S3PetRename', pet_page(renaming=True), 'Đổi tên thú cưng')
    W('S3Shop', shop(0), 'Cửa hàng')
    W('S3ShopDark', shop(0, True), 'Cửa hàng tối')
    W('S3ShopPets', shop(1), 'Cửa hàng thú cưng')
    W('S3ShopFood', shop(2), 'Cửa hàng đồ ăn')
    W('S3Stats', stats(), 'Thống kê')
    W('S3StatsDark', stats(True), 'Thống kê tối')
    W('S3StatsLevel', stats_level(), 'Thống kê trình độ')
    W('S3StatsLevelEmpty', stats_level(True), 'Thống kê trống')
    W('S3StatsTime', stats_time(), 'Thống kê thời gian')
    W('S3StatsAch', stats_ach(), 'Thành tựu')
    W('S3Settings', set_profile(), 'Cài đặt hồ sơ')
    W('S3SettingsReview', set_review(), 'Cài đặt ôn thẻ')
    W('S3SettingsVoice', set_voice(), 'Cài đặt giọng')
    W('S3SettingsTranslate', set_translate(), 'Cài đặt dịch')
    W('S3SettingsMascot', set_mascot(), 'Cài đặt mascot')
    W('S3SettingsApp', set_app(), 'Cài đặt ứng dụng')
    W('S3SettingsCredits', set_credits(), 'Giấy phép')
    W('S3Onboarding', onb1(), 'Chào mừng bước một')
    W('S3Onboarding2', onb2(), 'Chào mừng bước hai')
    W('S3Onboarding3', onb3(), 'Chào mừng bước ba')
    evolution(True)
    evolution(False)
    W('S3Parent', parent(), 'Báo cáo phụ huynh')
    print('Đã sinh các bảng S3 vào', OUT)
