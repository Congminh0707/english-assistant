# ---------- v5: Draco Lv50 mới + Webby (nhện dạng khác) ----------
import math

DD5 = """
<linearGradient id="wg5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4D2"/><stop offset=".55" stop-color="#FFD98A"/><stop offset="1" stop-color="#FFB45E"/></linearGradient>
<linearGradient id="wg5b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>
<g id="dwing5">
<path d="M54 106Q34 70 12 46Q-30 22 -76 30Q-60 54 -68 84Q-46 82 -42 112Q-16 108 -10 136Q30 130 56 122Z" fill="url(#wg5)"/>
<path d="M54 106Q34 70 12 46Q-30 22 -76 30Q-60 54 -68 84Q-46 82 -42 112Q-16 108 -10 136Q30 130 56 122Z" fill="url(#wg5b)"/>
<path d="M12 46Q-30 52 -68 84M12 46Q-12 76 -42 112M12 46Q10 92 -10 136" stroke="#F29A3A" stroke-width="3.6" fill="none" stroke-linecap="round" opacity=".9"/>
<path d="M54 106Q34 70 12 46Q-30 22 -76 30" stroke="#F29A3A" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M30 60Q-10 36 -56 36" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>
<circle cx="12" cy="46" r="7" fill="#FFD66B"/><circle cx="10" cy="44" r="2.4" fill="#fff" opacity=".8"/>
<g fill="#FFD66B"><circle cx="-76" cy="30" r="4.4"/><circle cx="-68" cy="84" r="4.4"/><circle cx="-42" cy="112" r="4.4"/><circle cx="-10" cy="136" r="4.4"/></g>
</g>
<g id="dcrown"><path d="M-22 0L-24 -16L-12 -8L0 -22L12 -8L24 -16L22 0Z" fill="#FFD66B" stroke="#FFD66B" stroke-width="5" stroke-linejoin="round"/><circle cx="0" cy="-8" r="4" fill="#FF8FB1"/><circle cx="-14" cy="-3" r="2.6" fill="#7FE0F0"/><circle cx="14" cy="-3" r="2.6" fill="#7FE0F0"/></g>
<g id="dorb"><circle r="14" fill="#FFE9A8" opacity=".5"/><circle r="9" fill="#FFD66B"/><circle cx="-3" cy="-3" r="3" fill="#fff" opacity=".85"/></g>
"""

def draco5_card():
    wing = lambda: '<g transform="translate(54 106) rotate(-10) translate(-54 -106)"><use href="#dwing5"/></g>'
    inner = (
        '<g class="dwl">' + wing() + '</g>'
        '<g class="dwr"><g transform="translate(160 0) scale(-1 1)">' + wing() + '</g></g>'
        '<g class="wag"><use href="#dtail"/></g><use href="#dtorso"/>'
        '<use href="#dhorn2" transform="translate(0 4)"/><use href="#dhorn2" transform="translate(160 4) scale(-1 1)"/><use href="#dhorn"/><use href="#dhorn" transform="translate(160 0) scale(-1 1)"/><use href="#dhead"/>'
        '<use href="#dcrown" transform="translate(80 36) scale(.9)"/>'
        '<path d="M54 114Q80 128 106 114L104 126Q80 140 56 126Z" fill="#FFD66B"/>'
        '<g class="flick"><use href="#dfire" transform="translate(162 100) scale(.9)"/></g>')
    return card(
        '<circle cx="80" cy="80" r="160" fill="url(#aura)" class="pulse"/><g class="rx" style="transform-origin:80px 84px"><circle cx="80" cy="84" r="76" fill="none" stroke="#FFD66B" stroke-width="3"/></g>'
        '<ellipse cx="80" cy="150" rx="46" ry="5" fill="#2B2B3A" opacity=".12"/>'
        '<g class="bob" style="--g:#7FE0B0;--g2:#4FB88A;--belly:#FFF6D8;--snout:#C8F5DE;--horn:#FFD66B">' + inner + '</g>'
        '<use href="#dorb" class="pulse" transform="translate(150 30)"/>'
        '<use href="#sp4" class="tk" transform="translate(-70 24)"/><use href="#sp4" class="tk" style="--d:-.6s" transform="translate(228 40) scale(.8)"/><use href="#sp4" class="tk" style="--d:-1.2s" transform="translate(-50 124) scale(.7)"/><use href="#sp4" class="tk" style="--d:-.3s" transform="translate(210 118) scale(.6)"/>',
        'Lv 50+', 'background:#FFF0CC;color:#7A4A06', 'Long vương mây sáng',
        'Đôi cánh vàng khổng lồ có xương ngón, mép lượn sóng; vương miện, hạt ngọc rồng',
        'border-color:#F6C48A;background:linear-gradient(180deg,#fff,#FFF4E5)', vb='-100 -20 360 190')

# ---------------- WEBBY v5: nhện bông tròn (không con người, không 6 mắt) ----------------
def scal(cx, cy, r, n, k=.62):
    pts = [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]
    br = 2 * r * math.sin(math.pi / n) * k + 1.5
    d = 'M%.1f %.1f' % pts[0]
    for i in range(1, n + 1):
        p = pts[i % n]
        d += 'A%.1f %.1f 0 0 1 %.1f %.1f' % (br, br, p[0], p[1])
    return d + 'Z'

WD5 = """
<radialGradient id="gal" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#8E80FF"/><stop offset="1" stop-color="#3C2F9E"/></radialGradient>
<g id="s5leg">
<path d="M48 78Q26 56 12 62" /><path d="M44 90Q18 80 4 90" /><path d="M44 104Q18 100 6 112" /><path d="M48 116Q28 124 16 136" />
</g>
<g id="s5legs2"><path d="M44 92Q18 84 6 96" /><path d="M48 112Q28 122 16 136" /></g>
<g id="s5toes"><circle cx="12" cy="62" r="5.4"/><circle cx="4" cy="90" r="5.4"/><circle cx="6" cy="112" r="5.4"/><circle cx="16" cy="136" r="5.4"/></g>
<g id="s5toes2"><circle cx="6" cy="96" r="5.4"/><circle cx="16" cy="136" r="5.4"/></g>
<g id="s5legL">
<g style="stroke:var(--b2,#8F78DD)" fill="none" stroke-width="9.5" stroke-linecap="round"><use href="#s5leg"/></g>
<g style="fill:var(--toe,#FF9FB0)"><use href="#s5toes"/></g>
</g>
<g id="s5legL2">
<g style="stroke:var(--b2,#8F78DD)" fill="none" stroke-width="9.5" stroke-linecap="round"><use href="#s5legs2"/></g>
<g style="fill:var(--toe,#FF9FB0)"><use href="#s5toes2"/></g>
</g>
<g id="s5abd">
<path d="%(abd)s" style="fill:var(--b2,#8F78DD)"/>
<ellipse cx="68" cy="46" rx="11" ry="4.5" fill="#fff" opacity=".28" transform="rotate(-18 68 46)"/>
<path d="M80 66C70 58 68 50 74 47C77 46 79 48 80 50C81 48 83 46 86 47C92 50 90 58 80 66Z" style="fill:var(--mark,#FF8FB1)"/>
</g>
<g id="s5head">
<path d="%(head)s" style="fill:var(--b,#B9A6F2)"/>
<ellipse cx="58" cy="68" rx="15" ry="5.5" fill="#fff" opacity=".32" transform="rotate(-26 58 68)"/>
<ellipse cx="80" cy="104" rx="31" ry="25" style="fill:var(--face,#FFF4E3)"/>
<g class="blink"><circle cx="70" cy="80" r="3.6" fill="#2B2B3A"/><circle cx="69" cy="78.6" r="1.3" fill="#fff"/><circle cx="90" cy="80" r="3.6" fill="#2B2B3A"/><circle cx="89" cy="78.6" r="1.3" fill="#fff"/></g>
<g class="blink"><ellipse cx="65" cy="98" rx="10" ry="12.5" fill="#2B2B3A"/><circle cx="61.5" cy="92" r="4.4" fill="#fff"/><circle cx="69" cy="103" r="2.1" fill="#fff"/>
<ellipse cx="95" cy="98" rx="10" ry="12.5" fill="#2B2B3A"/><circle cx="91.5" cy="92" r="4.4" fill="#fff"/><circle cx="99" cy="103" r="2.1" fill="#fff"/></g>
<ellipse cx="50" cy="110" rx="7.5" ry="4.4" fill="#FF9FB0" opacity=".75"/><ellipse cx="110" cy="110" rx="7.5" ry="4.4" fill="#FF9FB0" opacity=".75"/>
<path d="M74 113q6 5.5 12 0" stroke="#3A2430" stroke-width="2.4" fill="none" stroke-linecap="round"/>
</g>
<g id="s5star"><path d="M0 -8L2.2 -2.6L8 -2L3.6 1.6L5 7.4L0 4.2L-5 7.4L-3.6 1.6L-8 -2L-2.2 -2.6Z"/></g>
""" % {'abd': scal(80, 60, 27, 12), 'head': scal(80, 94, 40, 16)}

def sp_body(legs='s5legL', abd=True):
    return ('<g class="tapl"><use href="#%s"/></g><g class="tapr"><g transform="translate(160 0) scale(-1 1)"><use href="#%s"/></g></g>' % (legs, legs)
            + ('<use href="#s5abd"/>' if abd else '') + '<use href="#s5head"/>')

SPB = '--b:#B9A6F2;--b2:#8F78DD;--face:#FFF4E3;--toe:#FF9FB0;--mark:#FF8FB1'
RIB = ['#FF8A7A', '#FFC15E', '#FFE27A', '#7ED9A0', '#6EC9F0', '#A99BF5']

def ribbons(cols, long=1.0, op=1.0):
    out = ''
    for i, c in enumerate(cols):
        t = i / (len(cols) - 1)
        ex = -14 - 34 * t * long
        ey = 70 + 62 * t * long
        cx1 = 24 - 30 * t
        out += '<path d="M62 %d C%d %d %d %d %d %d" stroke="%s" stroke-width="8" fill="none" stroke-linecap="round" opacity="%s"/>' % (56 + 3 * i, cx1, 14 + 12 * t, ex - 30, ey - 50 * (1 - t) - 10, ex, ey, c, op)
    return out

def webby5():
    S = []
    # Lv1 kén tơ
    S.append(card('<ellipse cx="80" cy="146" rx="36" ry="6" fill="#2B2B3A" opacity=".12"/><g class="dangle"><path d="M80 -12V56" stroke="#D8D0F0" stroke-width="2.6" stroke-linecap="round"/>'
        '<ellipse cx="80" cy="98" rx="40" ry="48" fill="#F4EFFF"/><path d="M42 84C60 94 100 94 118 84M40 102C60 114 100 114 120 102M46 122C62 132 98 132 114 122" stroke="#D3C8F2" stroke-width="3" fill="none" stroke-linecap="round"/>'
        '<ellipse cx="62" cy="76" rx="4" ry="12" fill="#fff" opacity=".7" transform="rotate(16 62 76)"/>'
        '<g class="blink"><circle cx="70" cy="100" r="6" fill="#2B2B3A"/><circle cx="68.5" cy="98" r="2.2" fill="#fff"/><circle cx="90" cy="100" r="6" fill="#2B2B3A"/><circle cx="88.5" cy="98" r="2.2" fill="#fff"/></g></g>',
        'Lv 1', 'background:#F6EEDB;color:#5E5E73', 'Kén tơ', 'Quả cầu tơ mềm, hai mắt ló ra'))
    # Lv2 nhện bông (4 chân, treo tơ)
    S.append(card('<ellipse cx="80" cy="146" rx="34" ry="5" fill="#2B2B3A" opacity=".12"/><g class="dangle" style="%s"><path d="M80 -12V28" stroke="#D8D0F0" stroke-width="2.6" stroke-linecap="round"/>' % SPB
        + scaled(sp_body('s5legL2'), .8, 80, 120) + '</g>',
        'Lv 2–9 · 4 chân', 'background:#EEE6FF;color:#5A33B8', 'Nhện bông', 'Xù lông tròn như bông gòn, hai mắt to', vb='-10 -16 180 170'))
    # Lv3 nhện thêu (8 chân, khăn + nơ)
    S.append(card('<ellipse cx="80" cy="146" rx="40" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob" style="%s">' % SPB
        + scaled(sp_body('s5legL') +
        '<path d="M46 124Q80 148 114 124L112 134Q80 158 48 134Z" fill="#FF8A7A"/><path d="M104 140l8 16l-9 -3l-3 8Z" fill="#FF6F5E"/><path d="M52 130l6 3M70 138l4 2M88 140l4 -1M104 134l5 -3" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>'
        '<g transform="translate(80 38)"><path d="M0 0L-18 -10L-18 10Z" fill="#FF7FA6"/><path d="M0 0L18 -10L18 10Z" fill="#FF7FA6"/><circle r="5" fill="#FFC15E"/></g>', .9, 80, 143) + '</g>',
        'Lv 10–24 · 8 chân', 'background:#EEE6FF;color:#5A33B8', 'Nhện thêu', 'Đủ 8 chân mũm mĩm, quàng khăn tơ, thắt nơ'))
    # Lv4 nhện dệt cầu vồng
    rl = ribbons(RIB)
    rr = '<g transform="translate(160 0) scale(-1 1)">' + rl + '</g>'
    S.append(card('<ellipse cx="80" cy="146" rx="46" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob" style="%s">' % SPB
        + scaled('<g class="wl">' + rl + '</g><g class="wr">' + rr + '</g>' + sp_body('s5legL') +
        '<path d="M46 124Q80 148 114 124L112 134Q80 158 48 134Z" fill="#6EC9F0"/><path d="M104 140l8 16l-9 -3l-3 8Z" fill="#4FB4E0"/>'
        '<use href="#s5star" transform="translate(80 36) scale(1.4)" fill="#FFE27A"/>', .84, 80, 143) + '</g>'
        '<use href="#s5star" class="tk" fill="#FFC15E" transform="translate(-30 30)"/><use href="#s5star" class="tk" fill="#A99BF5" style="--d:-.8s" transform="translate(188 52) scale(.8)"/>',
        'Lv 25–49', 'background:#EEE6FF;color:#5A33B8', 'Nhện dệt cầu vồng', 'Dải tơ 6 màu bay như múa lụa, sao trên lưng', vb='-60 -20 280 190'))
    # Lv5 thoát xác -> nhện tinh tú
    web = ''
    for k in range(8):
        a = math.radians(k * 45 + 22.5)
        web += '<line x1="80" y1="84" x2="%.1f" y2="%.1f"/>' % (80 + 84 * math.cos(a), 84 + 84 * math.sin(a))
    for R in (22, 44, 66, 84):
        pts = ' '.join('%.1f,%.1f' % (80 + R * math.cos(math.radians(k * 45 + 22.5)), 84 + R * math.sin(math.radians(k * 45 + 22.5))) for k in range(8))
        web += '<polygon points="%s"/>' % pts
    dew = ''.join('<circle cx="%.1f" cy="%.1f" r="3" fill="#fff"/>' % (80 + 66 * math.cos(math.radians(k * 45 + 22.5)), 84 + 66 * math.sin(math.radians(k * 45 + 22.5))) for k in range(8))
    GAL = '--b:#6F63E8;--b2:#4A3FB5;--face:#FFF6E6;--toe:#FFD66B;--mark:#FFD66B'
    rl5 = ribbons(['#FFD1EA', '#FFE9A8', '#C9F3E4', '#C7E6FF', '#DCD2FF', '#FFD1EA'], 1.15, .9)
    rr5 = '<g transform="translate(160 0) scale(-1 1)">' + rl5 + '</g>'
    husk = ('<g class="husk" style="--b:#E9E3F8;--b2:#DAD1F0;--face:#F3EFFA;--toe:#EDE7FA;--mark:#DAD1F0">'
            + scaled(sp_body('s5legL'), .5, 80, 143) + '<path d="M80 72l-5 12l7 7l-6 12" stroke="#B9AEDD" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(80 143) scale(.5) translate(-80 -143)"/></g>')
    stars = ''.join('<circle cx="%d" cy="%d" r="%.1f" fill="#fff" class="tk" style="--d:-%.1fs"/>' % (x, y, r, d) for x, y, r, d in [(62, 52, 2.2, .2), (92, 60, 1.8, .7), (80, 48, 2.6, 1.1), (70, 64, 1.6, .5), (98, 50, 1.5, 1.4)])
    S.append(card('<circle cx="80" cy="80" r="150" fill="url(#aura)" class="pulse"/>'
        '<g class="web5" fill="none" stroke="#C9BEFF" stroke-width="1.6" opacity=".7">' + web + '</g><g class="web5">' + dew + '</g>'
        '<ellipse cx="80" cy="150" rx="46" ry="5" fill="#2B2B3A" opacity=".12"/>'
        '<g transform="translate(-50 12)">' + husk + '</g>'
        '<g class="bob" style="%s">' % GAL
        + scaled('<g class="wl">' + rl5 + '</g><g class="wr">' + rr5 + '</g>' + sp_body('s5legL') + stars +
        '<path d="M46 124Q80 148 114 124L112 134Q80 158 48 134Z" fill="#FFD66B"/><path d="M104 140l8 16l-9 -3l-3 8Z" fill="#F0B63A"/>'
        '<use href="#s5star" transform="translate(80 36) scale(1.6)" fill="#FFE27A"/>', .84, 80, 143) + '</g>'
        '<use href="#s5star" class="tk" fill="#FFE27A" transform="translate(-42 20) scale(1.2)"/><use href="#s5star" class="tk" fill="#fff" style="--d:-.8s" transform="translate(206 40)"/><use href="#s5star" class="tk" fill="#FFD1EA" style="--d:-1.4s" transform="translate(200 124) scale(.8)"/>',
        'Lv 50+', 'background:#FFF0CC;color:#7A4A06', 'Nhện tinh tú thoát xác', 'Bỏ lớp vỏ cũ mờ nhạt bên cạnh, lưng đầy sao, vòng lưới sương quay chậm, lụa pha lê',
        'border-color:#D8CCF6;background:linear-gradient(180deg,#fff,#F1ECFF)', vb='-120 -20 360 190'))
    cols = 'minmax(0,.75fr) minmax(0,.85fr) minmax(0,1fr) minmax(0,1.25fr) minmax(0,1.7fr)'
    sw = [('#B9A6F2', 'lông bông', 0), ('#8F78DD', 'bụng · chân', 1), ('#FFF4E3', 'mặt', 0), ('#FF8FB1', 'nơ · má', 0), ('#6F63E8', 'tinh tú', 1), ('#FFD66B', 'sao · vàng', 0)]
    note = ('<b>Vẽ lại hẳn dạng khác:</b> bỏ 6 mắt và chân dài mảnh (trông đáng sợ). Nhện giờ là <b>cục bông tròn</b>: đầu to viền xù, chỉ 2 mắt to + 2 chấm mắt phụ lấp lánh, chân ngắn mũm mĩm có đệm thịt hồng, bụng nhỏ như búi tóc có hình trái tim. '
            '<b>Tiến hoá = thợ dệt tơ:</b> kén → nhện bông → thêu (khăn, nơ) → <b>dệt lụa cầu vồng</b> (dải tơ 6 màu múa bay) → <b>tinh tú thoát xác</b>: lớp vỏ cũ mờ để lại bên cạnh, thân chuyển tím chàm lưng đầy sao, lưới sương quay phía sau.<br>'
            '<b>Hoạt ảnh:</b> đu tơ, chớp mắt, gõ chân, dải tơ phấp phới, lưới quay chậm, sao nhấp nháy. <b>Duyệt giúp:</b> đã đỡ "xấu" chưa? Muốn đổi màu chủ đạo (hồng/xanh) không?')
    return page4('Webby character sheet', 'Webby · nhện bông thợ dệt (v5)', 'Cục bông 2 mắt to → thợ dệt lụa cầu vồng → nhện tinh tú thoát xác.', ''.join(S), cols, sw, note, WD5 + DD)
