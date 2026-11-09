# Accessory boards + shop mockup.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from build import doc, pid, INFO
from chars import CHARS, NECK
from acc2 import ACC, SLOT, NAME, draw, ICON_VB, REMOVED

NAMES = {n: INFO[n][0].split(' — ')[0] for n in CHARS}
SLOT_VI = {'head': 'Đầu', 'face': 'Mặt', 'neck': 'Cổ', 'hand': 'Tay', 'back': 'Lưng'}

def fig(name, accs=(), w=130, pose='idle', stage='adult', label=''):
    p = pid()
    NECK['on'] = not any(SLOT[a] == 'neck' for a in accs)
    d, f = CHARS[name](stage, pose, p)
    NECK['on'] = True
    beh = front = ''
    for a in accs:
        dd, b, fr = draw(a, name, p + a.replace('-', ''))
        d += dd; beh += b; front += fr
    s = build.SC[stage]
    vb = '-34 -40 228 200'
    h = round(w * 200 / 228)
    return (f'<svg width="{w}" height="{h}" style="flex-shrink: 0" viewBox="{vb}" role="img" aria-label="{label}"><defs>{d}</defs>'
            f'<ellipse cx="80" cy="151" rx="{58*s:.0f}" ry="6.5" fill="#6B5A48" opacity=".12"/>'
            f'<g class="br" style="transform-origin:80px 150px"><g transform="translate(80 150) scale({s}) translate(-80 -150)">{beh}{f}{front}</g></g></svg>')

def icon(a, w=72):
    p = pid()
    d, b, f = draw(a, 'kitsu', p)
    vb = ICON_VB[a]
    vw, vh = [float(x) for x in vb.split()[2:]]
    return f'<svg width="{w}" height="{w}" viewBox="{vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>{d}</defs>{b}{f}</svg>'

def grid_board(slots, title, sub, fname, h):
    items = [a for a in ACC if a[2] in slots]
    head = '<div></div>' + ''.join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center">{icon(a[0], 52)}<span style="font-size: 14px; font-weight: 800">{a[1]}</span><span style="font-size: 12px; color: #6B5A48">{a[3]} xu{" · Lv " + str(a[4]) if a[4] else ""}</span><span style="font-size: 11px; font-weight: 700; color: {"#0E6B45" if a[5].startswith(("mới","đổi","vẽ")) else "#6B5A48"}">{a[5]}</span></div>' for a in items)
    rows = ''
    for n in CHARS:
        rows += f'<div style="font-size: 17px; font-weight: 800; align-self: center">{NAMES[n]}</div>'
        rows += ''.join(f'<div style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 14px; display: flex; justify-content: center; padding: 2px">{fig(n, (a[0],), w=124, label=f"{NAMES[n]} đeo {a[1]}")}</div>' for a in items)
    cols = len(items)
    body = f'''<header style="display: flex; flex-direction: column; gap: 6px">
<p style="margin: 0; font-size: 14px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #0E6B45">Phụ kiện · vẽ riêng theo từng nhân vật</p>
<h1 style="margin: 0; font-size: 40px; line-height: 1.1; font-weight: 800">{title}</h1>
<p style="margin: 0; font-size: 16px; line-height: 1.55; color: #5E4E3E; max-width: 1100px">{sub}</p>
</header>
<div style="display: grid; grid-template-columns: 84px repeat({cols}, minmax(0, 1fr)); gap: 8px">{head}{rows}</div>'''
    w = 84 + cols * 134 + 112 + 8 * cols
    open(os.path.join(build.OUT, fname), 'w', encoding='utf-8').write(doc(title, w, h, body))
    return w

def shop_board():
    # item cards
    def card(a, state):
        aid, nm, slot, price, lv = a[:5]
        lock = state == 'lock'
        btn = {'own': '<button type="button" style="min-height: 44px; padding: 0 18px; border-radius: 12px; border: 0; background: #0E6B45; color: #FFFFFF; font: inherit; font-weight: 800">Đeo</button>',
               'wear': '<button type="button" style="min-height: 44px; padding: 0 18px; border-radius: 12px; border: 2px solid #0E6B45; background: #FFFFFF; color: #0E6B45; font: inherit; font-weight: 800">Tháo</button>',
               'buy': f'<button type="button" style="min-height: 44px; padding: 0 18px; border-radius: 12px; border: 0; background: #F2B53A; color: #2B2118; font: inherit; font-weight: 800">Mua · {price} xu</button>',
               'lock': f'<button type="button" disabled style="min-height: 44px; padding: 0 18px; border-radius: 12px; border: 0; background: #EFE7D6; color: #6B5A48; font: inherit; font-weight: 800">Cần Lv {lv}</button>'}[state]
        chip = '<span style="padding: 3px 10px; border-radius: 999px; background: #DDF1E2; color: #145B32; font-size: 12px; font-weight: 800">Đang đeo</span>' if state == 'wear' else ''
        return (f'<article style="background: #FFFFFF; border: 2px solid {"#0E6B45" if state == "wear" else "#EADFC8"}; border-radius: 18px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 6px; opacity: {".6" if lock else "1"}">'
                f'<div style="width: 100%; display: flex; justify-content: space-between; align-items: center; min-height: 22px"><span style="font-size: 12px; font-weight: 600; color: #6B5A48">{SLOT_VI[slot]}</span>{chip}</div>'
                f'<div style="width: 96px; height: 96px; border-radius: 999px; background: #F6EFDF; display: flex; align-items: center; justify-content: center">{icon(aid, 78)}</div>'
                f'<h3 style="margin: 0; font-size: 16px; font-weight: 800">{nm}</h3>{btn}</article>')
    states = {'beanie': 'wear', 'scarf': 'wear', 'balloon': 'wear', 'bow': 'own', 'sunglasses': 'own', 'crown': 'lock', 'wand': 'lock', 'wings': 'lock'}
    pick = ('bow', 'flower', 'beanie', 'crown', 'sunglasses', 'scarf', 'balloon', 'lollipop', 'sword', 'wand', 'fairy-wings', 'wings')
    cards = ''.join(card(a, states.get(a[0], 'buy')) for a in ACC if a[0] in pick)
    preview = fig('kitsu', ('beanie', 'scarf', 'balloon'), w=300, label='Kitsu thử đồ: mũ len, khăn len, bóng bay')
    switch = ''.join(f'<button type="button" aria-label="Thử trên {NAMES[n]}" style="width: 56px; height: 56px; border-radius: 16px; border: 2px solid {"#0E6B45" if n == "kitsu" else "#EADFC8"}; background: #FFFFFF; padding: 0; display: flex; align-items: center; justify-content: center">{fig(n, w=52)}</button>' for n in CHARS)
    slots = ''.join(f'<div style="display: flex; justify-content: space-between; gap: 8px; padding: 8px 0; border-top: 1px solid #EFE7D6"><dt style="color: #6B5A48">{SLOT_VI[s]}</dt><dd style="margin: 0; font-weight: 800">{v}</dd></div>'
                    for s, v in (('head', 'Mũ len'), ('face', 'Trống'), ('neck', 'Khăn len'), ('hand', 'Bóng bay'), ('back', 'Trống')))
    tabs = ''.join(f'<button type="button" role="tab" aria-selected="{"true" if i == 0 else "false"}" style="min-height: 44px; padding: 0 18px; border-radius: 999px; border: 0; font: inherit; font-weight: 800; background: {"#2B2118" if i == 0 else "#EFE7D6"}; color: {"#FFFFFF" if i == 0 else "#3E3226"}">{t}</button>' for i, t in enumerate(('Phụ kiện', 'Nhân vật', 'Đồ ăn')))
    filt = ''.join(f'<button type="button" style="min-height: 40px; padding: 0 14px; border-radius: 999px; border: 2px solid {"#0E6B45" if i == 0 else "#EADFC8"}; background: #FFFFFF; font: inherit; font-weight: 600; color: #3E3226">{t}</button>' for i, t in enumerate(('Tất cả · 25', 'Đầu · 10', 'Mặt · 4', 'Cổ · 3', 'Tay · 5', 'Lưng · 3')))
    body = f'''<header style="display: flex; justify-content: space-between; align-items: flex-end; gap: 24px">
<div style="display: flex; flex-direction: column; gap: 6px">
<p style="margin: 0; font-size: 14px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #0E6B45">Cửa hàng · bản cập nhật cho mascot v3</p>
<h1 style="margin: 0; font-size: 40px; line-height: 1.1; font-weight: 800">Cửa hàng</h1>
<p style="margin: 0; font-size: 16px; color: #5E4E3E">Kiếm xu bằng nhiệm vụ ngày và luyện tập nhé!</p>
</div>
<span style="padding: 10px 18px; border-radius: 999px; background: #FFF1C9; color: #6A4512; font-size: 18px; font-weight: 800">1.240 xu</span>
</header>
<nav role="tablist" style="display: flex; gap: 8px; flex-wrap: wrap">{tabs}</nav>
<div style="display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 20px; flex-grow: 1">
<div style="display: flex; flex-direction: column; gap: 14px">
<div style="display: flex; gap: 8px; flex-wrap: wrap">{filt}</div>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px">{cards}</div>
</div>
<aside style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 22px; padding: 18px; display: flex; flex-direction: column; gap: 12px; align-self: start">
<h2 style="margin: 0; font-size: 20px; font-weight: 800">Thử đồ</h2>
<div style="background: #F6EFDF; border-radius: 18px; display: flex; justify-content: center; padding: 8px 0">{preview}</div>
<p style="margin: 0; font-size: 13px; font-weight: 800; color: #6B5A48; letter-spacing: .04em">THỬ TRÊN NHÂN VẬT KHÁC</p>
<div style="display: flex; gap: 8px; justify-content: space-between">{switch}</div>
<dl style="margin: 0; font-size: 15px">{slots}</dl>
</aside>
</div>
<section style="background: #2B2118; color: #F7EEDC; border-radius: 22px; padding: 18px 24px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; font-size: 14px; line-height: 1.55">
<div><strong style="color: #FFFFFF; font-size: 15px">Vị trí mới: Cầm tay</strong><br>Bóng bay, kẹo mút, kiếm gỗ, ô lá, đũa phép. Cầm ở tay phải, nằm trước thân và vươn ra ngoài viền nên luôn thấy rõ.</div>
<div><strong style="color: #FFFFFF; font-size: 15px">Bỏ 2 món bị che</strong><br>Ba lô (bị thân che gần hết) · Bờm tai mèo (lẫn vào tai thật của Kitsu, Lupo, Bi). Thay bằng mũ len và cánh tiên. Ai đã mua được hoàn lại đủ xu.</div>
<div><strong style="color: #FFFFFF; font-size: 15px">To hơn, ra ngoài viền</strong><br>Nơ, vương miện, hào quang, nơ cổ, huy chương phóng to 1.3–1.5 lần; khăn vắt trước ngực; áo choàng bay ra một bên; hai bộ cánh rộng hơn thân.</div>
<div><strong style="color: #FFFFFF; font-size: 15px">Thử trước khi mua</strong><br>Ô "Thử đồ" mặc thử món đang xem, đổi được sang nhân vật khác. Đồ cổ thay khăn, chuông mặc định của giai đoạn.</div>
</section>'''
    open(os.path.join(build.OUT, 'Shop.dc.html'), 'w', encoding='utf-8').write(doc('Cửa hàng v3', 1440, 1180, body))

def outfit_board():
    outfits = (('Tiệc sinh nhật', ('party-hat', 'bowtie', 'balloon')), ('Mùa đông', ('beanie', 'scarf', 'lollipop')), ('Siêu anh hùng', ('mask', 'cape', 'sword')),
               ('Cướp biển', ('eyepatch', 'hat', 'sword')), ('Phù thuỷ', ('witch-hat', 'wand', 'cape')), ('Tiên rừng', ('flower', 'fairy-wings', 'leaf-umbrella')), ('Hoàng gia', ('crown', 'medal', 'wings')))
    rows = ''
    for t, accs in outfits:
        rows += f'<div style="display: flex; flex-direction: column; justify-content: center; gap: 2px"><strong style="font-size: 16px">{t}</strong><span style="font-size: 12px; color: #6B5A48">{" + ".join(NAME[a] for a in accs)}</span></div>'
        rows += ''.join(f'<div style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 14px; display: flex; justify-content: center">{fig(n, accs, w=150, label=f"{NAMES[n]} bộ {t}")}</div>' for n in CHARS)
    body = f'''<header style="display: flex; flex-direction: column; gap: 6px">
<p style="margin: 0; font-size: 14px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #0E6B45">Phụ kiện · phối nhiều món</p>
<h1 style="margin: 0; font-size: 40px; line-height: 1.1; font-weight: 800">Bộ đồ gợi ý: 4 vị trí đeo cùng lúc</h1>
<p style="margin: 0; font-size: 16px; color: #5E4E3E">Mỗi bộ đeo 3–4 vị trí cùng lúc để kiểm tra không món nào che món nào.</p>
</header>
<div style="display: grid; grid-template-columns: 150px repeat(5, minmax(0, 1fr)); gap: 10px">
<div></div>{''.join(f'<div style="text-align: center; font-size: 17px; font-weight: 800">{NAMES[n]}</div>' for n in CHARS)}
{rows}</div>'''
    open(os.path.join(build.OUT, 'AccOutfits.dc.html'), 'w', encoding='utf-8').write(doc('Bộ đồ gợi ý', 1180, 1400, body))

if __name__ == '__main__':
    shop_board()
    grid_board(('head',), 'Đồ đội đầu · 10 món', 'Phóng to so với bản trước. Mũ len thay bờm tai mèo; vòng hoa thay hoa cài; nơ, vương miện, hào quang to hơn để thấy rõ ở cỡ 48 px.', 'AccHead.dc.html', 1000)
    grid_board(('face', 'neck'), 'Mặt · cổ · 7 món', 'Kính tim thay kính râm. Khăn len to hơn và vắt ra trước ngực; nơ cổ, huy chương to gấp rưỡi. Đeo đồ cổ thì ẩn khăn, chuông mặc định.', 'AccBody.dc.html', 1000)
    grid_board(('hand', 'back'), 'Cầm tay · lưng · 8 món', 'Vị trí mới Cầm tay: đồ nằm trước thân, vươn ra ngoài viền. Áo choàng bay ra một bên; cánh tiên thay ba lô; đôi cánh rộng gấp rưỡi.', 'AccHandBack.dc.html', 1000)
    outfit_board()
