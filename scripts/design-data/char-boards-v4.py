import sys, re
OUT = sys.argv[1]
_src = open('gen_char2.py', encoding='utf-8').read().split('# ================= DRACO')[0]
exec(_src)
_full = open('gen_char2.py', encoding='utf-8').read()
WDEFS = re.search(r'WDEFS = """(.*?)"""', _full, re.S).group(1)
CSS += """
@keyframes fanp{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.045) rotate(1.6deg)}}
@keyframes wingp{0%,100%{transform:rotate(0)}50%{transform:rotate(-9deg)}}
@keyframes wingq{0%,100%{transform:rotate(0)}50%{transform:rotate(9deg)}}
@keyframes spinr{to{transform:rotate(360deg)}}
@keyframes spinl{to{transform:rotate(-360deg)}}
@keyframes ringx{0%{transform:scale(.5);opacity:.8}100%{transform:scale(1.5);opacity:0}}
@keyframes petal{0%{transform:translate(0,-8px) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(14px,70px) rotate(160deg);opacity:0}}
@keyframes twk{0%,100%{transform:scale(.2);opacity:0}50%{transform:scale(1);opacity:1}}
.fan{animation:fanp 3.4s ease-in-out infinite;transform-origin:80px 118px}
.wl{animation:wingp 2s ease-in-out infinite;transform-origin:46px 92px}
.wr{animation:wingq 2s ease-in-out infinite;transform-origin:114px 92px}
.dwl{animation:wingp 2s ease-in-out infinite;transform-origin:58px 100px}
.dwr{animation:wingq 2s ease-in-out infinite;transform-origin:102px 100px}
.spr{animation:spinr 30s linear infinite;transform-origin:80px 70px}
.spl{animation:spinl 40s linear infinite;transform-origin:80px 70px}
.rx{animation:ringx 2.4s ease-out infinite;transform-box:fill-box;transform-origin:center}
.pt{animation:petal 4s ease-in infinite;animation-delay:var(--d,0s)}
.tk{animation:twk 1.8s ease-in-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
@keyframes wig{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}
.wig{animation:wig 2.6s ease-in-out infinite;transform-origin:80px 44px}
@media (prefers-reduced-motion:reduce){.wig,.fan,.wl,.wr,.dwl,.dwr,.spr,.spl,.rx,.pt,.tk{animation:none}}
"""
HEADER = 'Bản vẽ v4 — để duyệt, chưa áp dụng'

def page4(title, h1, sub, cards, cols, swatches, note, defs):
    return page(title, h1, sub, cards, cols, swatches, note, defs).replace('Bản vẽ v3 — để duyệt, chưa áp dụng', HEADER)

SPK = '<path id="sp4" d="M0 -9L2 -4L7 -3L3 1L4 6L0 3L-4 6L-3 1L-7 -3L-2 -4Z" fill="#FFD66B"/>'
# =============== DRACO v4 (cute) ===============
DD = """
<radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD6A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFD6A0" stop-opacity="0"/></radialGradient>
<linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1C9"/><stop offset="1" stop-color="#FFC27A"/></linearGradient>
""" + SPK + """
<g id="dfire"><path d="M0 0C-8 -8 -7 -18 0 -28C7 -18 8 -8 0 0Z" fill="#FF9A4A"/><path d="M0 -2C-4 -7 -3 -13 0 -19C3 -13 4 -7 0 -2Z" fill="#FFE08A"/></g>
<g id="dwing"><path d="M58 106C42 98 30 74 26 54C8 52 -10 62 -20 80C-10 82 -6 88 -6 94C2 94 8 100 10 106C18 106 20 112 22 118C42 118 54 114 58 106Z" style="fill:var(--wing,#9BE6BF)"/>
<path d="M26 54C16 58 8 64 2 72" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M58 106L26 54M26 54L-20 80M26 54L-6 94M26 54L10 106" stroke="var(--g2,#4FB88A)" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="26" cy="52" r="5" style="fill:var(--horn,#FFE29A)"/></g>
<g id="dhorn"><path d="M46 44C38 34 36 22 42 14C52 18 58 30 58 44Z" style="fill:var(--horn,#FFE29A);stroke:var(--horn,#FFE29A);stroke-width:5;stroke-linejoin:round"/></g>
<g id="dhorn2"><path d="M46 42C34 38 20 30 16 16C32 16 48 24 58 40Z" style="fill:var(--horn,#FFE29A);stroke:var(--horn,#FFE29A);stroke-width:5;stroke-linejoin:round"/></g>
<g id="dhead">
<path d="M36 62C20 46 4 46 -2 60C2 74 18 82 38 80Z" style="fill:var(--g2,#4FB88A);stroke:var(--g2,#4FB88A);stroke-width:4;stroke-linejoin:round"/><path d="M30 64C20 56 12 56 8 62C12 70 22 74 32 74Z" fill="#FFC1CC" opacity=".85"/><path d="M124 62C140 46 156 46 162 60C158 74 142 82 122 80Z" style="fill:var(--g2,#4FB88A);stroke:var(--g2,#4FB88A);stroke-width:4;stroke-linejoin:round"/><path d="M130 64C140 56 148 56 152 62C148 70 138 74 128 74Z" fill="#FFC1CC" opacity=".85"/>
<ellipse cx="80" cy="72" rx="56" ry="44" style="fill:var(--g,#6ED3A0)"/>
<ellipse cx="52" cy="46" rx="16" ry="6" fill="#fff" opacity=".35" transform="rotate(-22 52 46)"/>
<ellipse cx="80" cy="90" rx="26" ry="17" style="fill:var(--snout,#BDF0D6)"/>
<ellipse cx="73" cy="86" rx="2.2" ry="2.8" fill="#3A8F6A"/><ellipse cx="87" cy="86" rx="2.2" ry="2.8" fill="#3A8F6A"/>
<g class="blink"><ellipse cx="52" cy="72" rx="11.5" ry="14" fill="#3A2430"/><ellipse cx="52" cy="79" rx="7" ry="5.5" fill="#F0A93A" opacity=".8"/><circle cx="48.5" cy="66" r="4.6" fill="#fff"/><circle cx="56.5" cy="78" r="2.2" fill="#fff"/>
<ellipse cx="108" cy="72" rx="11.5" ry="14" fill="#3A2430"/><ellipse cx="108" cy="79" rx="7" ry="5.5" fill="#F0A93A" opacity=".8"/><circle cx="104.5" cy="66" r="4.6" fill="#fff"/><circle cx="112.5" cy="78" r="2.2" fill="#fff"/></g>
<ellipse cx="36" cy="90" rx="9" ry="5" fill="#FF9FB0" opacity=".75"/><ellipse cx="124" cy="90" rx="9" ry="5" fill="#FF9FB0" opacity=".75"/>
<path d="M72 96q4 5 8 0q4 5 8 0" stroke="#3A8F6A" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<g id="dtorso">
<path d="M80 92C50 92 40 116 42 132C44 148 60 152 80 152C100 152 116 148 118 132C120 116 110 92 80 92Z" style="fill:var(--g,#6ED3A0)"/>
<ellipse cx="80" cy="130" rx="19" ry="20" style="fill:var(--belly,#FFF0CF)"/><path d="M68 120h24M66 130h28M68 140h24" stroke="#F0DDB0" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="62" cy="150" rx="13" ry="7" style="fill:var(--g2,#4FB88A)"/><ellipse cx="98" cy="150" rx="13" ry="7" style="fill:var(--g2,#4FB88A)"/>
<circle cx="56" cy="152" r="2.4" fill="#fff" opacity=".7"/><circle cx="62" cy="153" r="2.4" fill="#fff" opacity=".7"/><circle cx="98" cy="153" r="2.4" fill="#fff" opacity=".7"/><circle cx="104" cy="152" r="2.4" fill="#fff" opacity=".7"/>
</g>
<g id="dtail"><path d="M108 138C146 150 172 130 164 104C162 98 154 100 156 106C158 122 138 134 112 126Z" style="fill:var(--g,#6ED3A0)"/><circle cx="160" cy="100" r="8" style="fill:var(--horn,#FFE29A)"/></g>
<g id="dspk"><path d="M-7 4Q0 -16 7 4Z" style="fill:var(--horn,#FFE29A);stroke:var(--horn,#FFE29A);stroke-width:4;stroke-linejoin:round"/></g>
"""
def draco4():
    S = []
    S.append(card('<ellipse cx="80" cy="146" rx="38" ry="6" fill="#2B2B3A" opacity=".12"/><g class="bob"><path d="M62 52Q60 36 66 30Q74 38 76 50Z" fill="#FFE29A"/><path d="M98 52Q100 36 94 30Q86 38 84 50Z" fill="#FFE29A"/>'
        '<ellipse cx="80" cy="98" rx="44" ry="50" fill="#6ED3A0"/><g fill="#4FB88A" opacity=".6"><path d="M48 80a9 9 0 0 1 18 0z"/><path d="M94 70a9 9 0 0 1 18 0z"/><path d="M64 108a9 9 0 0 1 18 0z"/><path d="M94 120a9 9 0 0 1 18 0z"/><path d="M42 118a9 9 0 0 1 18 0z"/></g>'
        '<path d="M46 100C56 90 66 106 76 98S92 106 102 98S112 106 116 100" stroke="#FFF0CF" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="62" cy="72" rx="4" ry="12" fill="#fff" opacity=".5" transform="rotate(18 62 72)"/>'
        '<g class="rise"><use href="#dfire" transform="translate(96 50) scale(.5)"/></g></g>', 'Lv 1', 'background:#F6EEDB;color:#5E5E73', 'Trứng rồng', 'Vỏ vảy xanh, tia lửa bay lên'))
    S.append(card('<ellipse cx="80" cy="146" rx="36" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' + scaled('<g class="wag"><use href="#dtail"/></g><use href="#dtorso"/><use href="#dhorn" transform="translate(0 -2)"/><use href="#dhorn" transform="translate(160 -2) scale(-1 1)"/><use href="#dhead"/>', .72) + '</g>',
        'Lv 2–9', 'background:#EEE6FF;color:#5A33B8', 'Rồng con', 'Tròn như bánh bao, sừng nhú, chưa có cánh'))
    S.append(card('<ellipse cx="80" cy="146" rx="40" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' + scaled(
        '<g class="dwl"><use href="#dwing" transform="translate(58 106) scale(.55) translate(-58 -106)"/></g><g class="dwr"><g transform="translate(160 0) scale(-1 1)"><use href="#dwing" transform="translate(58 106) scale(.55) translate(-58 -106)"/></g></g>'
        '<g class="wag"><use href="#dtail"/></g><use href="#dtorso"/><use href="#dhorn"/><use href="#dhorn" transform="translate(160 0) scale(-1 1)"/><use href="#dhead"/>'
        '<path d="M52 108Q80 124 108 108L106 120Q80 136 54 120Z" fill="#E8604C"/>', .84) + '</g>',
        'Lv 10–24', 'background:#EEE6FF;color:#5A33B8', 'Rồng non', 'Cánh nhỏ tròn đang tập bay, khăn đỏ', vb='-30 -10 220 170'))
    S.append(card('<ellipse cx="80" cy="146" rx="48" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' + scaled(
        '<g class="dwl"><use href="#dwing" transform="translate(58 106) scale(1.3) translate(-58 -106)"/></g><g class="dwr"><g transform="translate(160 0) scale(-1 1)"><use href="#dwing" transform="translate(58 106) scale(1.3) translate(-58 -106)"/></g></g>'
        '<g class="wag"><use href="#dtail"/><g class="flick"><use href="#dfire" transform="translate(162 96) scale(.8)"/></g></g><use href="#dtorso"/>'
        '<use href="#dspk" transform="translate(80 36) scale(1.1)"/><use href="#dhorn2" transform="translate(0 4)"/><use href="#dhorn2" transform="translate(160 4) scale(-1 1)"/><use href="#dhorn"/><use href="#dhorn" transform="translate(160 0) scale(-1 1)"/><use href="#dhead"/>'
        '<path d="M52 108Q80 124 108 108L106 120Q80 136 54 120Z" fill="#FFC94D"/>', .86) + '</g>',
        'Lv 25–49', 'background:#EEE6FF;color:#5A33B8', 'Phi long', 'Cánh rộng mềm, 4 sừng, đuôi lửa', vb='-70 -20 300 190'))
    S.append(card('<circle cx="80" cy="80" r="150" fill="url(#aura)" class="pulse"/><g class="rx" style="transform-origin:80px 80px"><circle cx="80" cy="84" r="70" fill="none" stroke="#FFD66B" stroke-width="3"/></g><ellipse cx="80" cy="146" rx="56" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob" style="--g:#7FE0B0;--g2:#4FB88A;--wing:url(#wg);--belly:#FFF6D8;--snout:#C8F5DE;--horn:#FFD66B">' + scaled(
        '<g class="dwl"><g transform="translate(58 106) scale(2.2) translate(-58 -106)"><path d="M58 106C42 98 30 74 26 54C8 52 -10 62 -20 80C-10 82 -6 88 -6 94C2 94 8 100 10 106C18 106 20 112 22 118C42 118 54 114 58 106Z" fill="url(#wg)"/><path d="M58 106L26 54M26 54L-20 80M26 54L-6 94M26 54L10 106" stroke="#F0A93A" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="26" cy="52" r="4" fill="#FFD66B"/></g></g>'
        '<g class="dwr"><g transform="translate(160 0) scale(-1 1)"><g transform="translate(58 106) scale(2.2) translate(-58 -106)"><path d="M58 106C42 98 30 74 26 54C8 52 -10 62 -20 80C-10 82 -6 88 -6 94C2 94 8 100 10 106C18 106 20 112 22 118C42 118 54 114 58 106Z" fill="url(#wg)"/><path d="M58 106L26 54M26 54L-20 80M26 54L-6 94M26 54L10 106" stroke="#F0A93A" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="26" cy="52" r="4" fill="#FFD66B"/></g></g></g>'
        '<g class="wag"><use href="#dtail"/><g class="flick"><use href="#dfire" transform="translate(162 96) scale(1)"/></g></g><use href="#dtorso"/>'
        '<use href="#dspk" transform="translate(80 36) scale(1.3)"/><use href="#dhorn2" transform="translate(0 4)"/><use href="#dhorn2" transform="translate(160 4) scale(-1 1)"/><use href="#dhorn"/><use href="#dhorn" transform="translate(160 0) scale(-1 1)"/><use href="#dhead"/>'
        '<use href="#sp4" transform="translate(80 38) scale(1.4)"/>'
        '<path d="M52 108Q80 124 108 108L106 120Q80 136 54 120Z" fill="#FFD66B"/><g class="flick"><use href="#dfire" transform="translate(52 22) scale(.6)"/></g><g class="flick" style="animation-delay:-.5s"><use href="#dfire" transform="translate(108 22) scale(.6)"/></g>', .8) + '</g>'
        '<use href="#sp4" class="tk" transform="translate(-60 20)"/><use href="#sp4" class="tk" style="--d:-.6s" transform="translate(228 30) scale(.8)"/><use href="#sp4" class="tk" style="--d:-1.2s" transform="translate(-40 120) scale(.7)"/>',
        'Lv 50+', 'background:#FFF0CC;color:#7A4A06', 'Long vương mây sáng', 'Đôi cánh vàng khổng lồ mềm mại, 6 sừng, ngọn lửa trên đầu, hào quang', 'border-color:#F6C48A;background:linear-gradient(180deg,#fff,#FFF4E5)', vb='-140 -40 440 220'))
    cols = 'minmax(0,.8fr) minmax(0,.85fr) minmax(0,1fr) minmax(0,1.15fr) minmax(0,1.55fr)'
    sw = [('#6ED3A0', 'vảy', 0), ('#4FB88A', 'bóng · chân', 1), ('#FFF0CF', 'bụng', 0), ('#FFE29A', 'sừng', 0), ('#FF9A4A', 'lửa', 0), ('#FFC27A', 'cánh vàng', 0)]
    note = ('<b>Vẽ lại dễ thương hơn:</b> bỏ mọi góc nhọn — đầu to tròn, mõm bự phúng phính, mắt hổ phách to, má hồng, sừng bo tròn, cánh mềm như lá sen, bụng tròn có vạch. Tiến hoá bằng hình dáng: trứng → bánh bao không cánh → cánh nhỏ + khăn → cánh rộng + 4 sừng + đuôi lửa → <b>cánh vàng khổng lồ kiểu rồng phương Tây</b> + vương miện lửa + hào quang.<br><b>Duyệt giúp:</b> đã dễ thương chưa? Muốn mắt to hơn / mập hơn / đổi màu rồng?')
    return page4('Draco character sheet', 'Draco · rồng mây (v4 dễ thương)', 'Rồng bánh bao tới Long vương cánh vàng — tròn trịa, mềm mại.', ''.join(S), cols, sw, note, DD)

# =============== WEBBY v4: nhện công (peacock spider) ===============
import math
def fan(R, spread, n, pal, rim=None, eyes=True):
    bx, by = 80, 118
    out = ''
    for i in range(n):
        a0 = math.radians(-spread + 2 * spread * i / n); a1 = math.radians(-spread + 2 * spread * (i + 1) / n)
        p0 = (bx + R * math.sin(a0), by - R * math.cos(a0)); p1 = (bx + R * math.sin(a1), by - R * math.cos(a1))
        out += '<path d="M%d %d L%.1f %.1f A%d %d 0 0 1 %.1f %.1f Z" fill="%s" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>' % (bx, by, p0[0], p0[1], R, R, p1[0], p1[1], pal[i % len(pal)])
        if eyes:
            am = (a0 + a1) / 2; ex = bx + R * .72 * math.sin(am); ey = by - R * .72 * math.cos(am)
            out += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#fff"/><circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (ex, ey, R * .085, ex, ey, R * .05, pal[(i + 2) % len(pal)])
    if rim:
        a0 = math.radians(-spread); a1 = math.radians(spread)
        out += '<path d="M%.1f %.1f A%d %d 0 0 1 %.1f %.1f" fill="none" stroke="%s" stroke-width="4" stroke-linecap="round"/>' % (bx + R * math.sin(a0), by - R * math.cos(a0), R, R, bx + R * math.sin(a1), by - R * math.cos(a1), rim)
    return '<g class="fan">' + out + '</g>'
WD = WDEFS.split('<g id="wspider">')[0] + """
<g id="wsb">
<ellipse cx="80" cy="122" rx="32" ry="26" style="fill:var(--b2,#7E5DC8)"/><path d="M58 116Q80 108 102 116M56 126Q80 118 104 126M60 136Q80 128 100 136" stroke="#C9B3FF" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
<ellipse cx="80" cy="76" rx="50" ry="42" style="fill:var(--b,#9B7BE0)"/>
<g style="fill:var(--b,#9B7BE0)"><circle cx="52" cy="40" r="9"/><circle cx="66" cy="34" r="9"/><circle cx="80" cy="32" r="9"/><circle cx="94" cy="34" r="9"/><circle cx="108" cy="40" r="9"/></g>
<ellipse cx="54" cy="48" rx="14" ry="5" fill="#fff" opacity=".3" transform="rotate(-22 54 48)"/>
<ellipse cx="68" cy="104" rx="7" ry="5" fill="#FF9FB0"/><ellipse cx="92" cy="104" rx="7" ry="5" fill="#FF9FB0"/>
<ellipse cx="34" cy="94" rx="8" ry="4.5" fill="#FF9FB0" opacity=".7"/><ellipse cx="126" cy="94" rx="8" ry="4.5" fill="#FF9FB0" opacity=".7"/>
<path d="M72 98q8 7 16 0" stroke="#3A2430" stroke-width="2.6" fill="none" stroke-linecap="round"/>
</g>
<g id="we2"><g class="blink"><ellipse cx="58" cy="80" rx="14" ry="17" style="fill:var(--eye,#2B2B3A)"/><circle cx="53" cy="73" r="5.5" fill="#fff"/><circle cx="63" cy="87" r="2.6" fill="#fff"/><ellipse cx="102" cy="80" rx="14" ry="17" style="fill:var(--eye,#2B2B3A)"/><circle cx="97" cy="73" r="5.5" fill="#fff"/><circle cx="107" cy="87" r="2.6" fill="#fff"/></g></g>
<g id="we6"><use href="#we2"/><g class="blink"><circle cx="38" cy="60" r="7" style="fill:var(--eye,#2B2B3A)"/><circle cx="36" cy="57" r="2.4" fill="#fff"/><circle cx="122" cy="60" r="7" style="fill:var(--eye,#2B2B3A)"/><circle cx="120" cy="57" r="2.4" fill="#fff"/><circle cx="68" cy="56" r="6" style="fill:var(--eye,#2B2B3A)"/><circle cx="66.5" cy="54" r="2" fill="#fff"/><circle cx="92" cy="56" r="6" style="fill:var(--eye,#2B2B3A)"/><circle cx="90.5" cy="54" r="2" fill="#fff"/></g></g>
"""
RAINBOW = ['#E8604C', '#F2A23D', '#F7D154', '#4CB977', '#2FB8C6', '#6C8CF0', '#B079E0']
def legs8():
    return ('<use href="#wleg4"/><g transform="translate(160 0) scale(-1 1)"><use href="#wleg4"/></g><use href="#wleg3"/><g transform="translate(160 0) scale(-1 1)"><use href="#wleg3"/></g>'
            '<g class="tapl"><use href="#wleg"/></g><g class="tapr"><g transform="translate(160 0) scale(-1 1)"><use href="#wleg"/></g></g><g class="tapl"><use href="#wleg2"/></g><g class="tapr"><g transform="translate(160 0) scale(-1 1)"><use href="#wleg2"/></g></g>')
def webby4():
    S = []
    S.append(card('<ellipse cx="80" cy="146" rx="38" ry="6" fill="#2B2B3A" opacity=".12"/><g class="dangle"><path d="M80 -12V56" stroke="#D8D0F0" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="80" cy="98" rx="42" ry="52" fill="#F1ECFF"/><path d="M44 80C60 90 100 90 116 80M40 100C60 112 100 112 120 100M46 122C62 130 98 130 114 122M80 48V148" stroke="#CFC3F0" stroke-width="2.4" fill="none"/><ellipse cx="62" cy="70" rx="4" ry="12" fill="#fff" opacity=".7" transform="rotate(18 62 70)"/><circle cx="68" cy="106" r="6" fill="#2FB8C6" class="pulse"/><circle cx="92" cy="106" r="6" fill="#2FB8C6" class="pulse"/></g>',
        'Lv 1', 'background:#F6EEDB;color:#5E5E73', 'Kén tơ', 'Hai mắt sáng lấp ló trong kén'))
    S.append(card('<ellipse cx="80" cy="146" rx="30" ry="5" fill="#2B2B3A" opacity=".12"/><g class="dangle">' + scaled('<path d="M80 -40V34" stroke="#D8D0F0" stroke-width="2.6" stroke-linecap="round"/><g class="tapl"><use href="#wleg"/></g><g class="tapr"><g transform="translate(160 0) scale(-1 1)"><use href="#wleg"/></g></g><g class="tapl"><use href="#wleg2"/></g><g class="tapr"><g transform="translate(160 0) scale(-1 1)"><use href="#wleg2"/></g></g><use href="#wsb"/><use href="#we2"/>', .68, 80, 150) + '</g>',
        'Lv 2–9 · 4 chân', 'background:#EEE6FF;color:#5A33B8', 'Nhện bông', 'Xù lông tròn xoe, hai mắt to, tơ treo'))
    S.append(card('<ellipse cx="80" cy="146" rx="42" ry="5" fill="#2B2B3A" opacity=".12"/><g class="dangle">' + scaled(
        fan(78, 56, 5, ['#F58FA0', '#F7D154', '#2FB8C6'], None, False) + legs8() + '<use href="#wsb"/><use href="#we6"/><path d="M52 112Q80 128 108 112L104 124Q80 140 56 124Z" fill="#2FB8C6"/>', .84, 80, 150) + '</g>',
        'Lv 10–24 · 8 chân', 'background:#EEE6FF;color:#5A33B8', 'Nhện nhảy', 'Đủ 8 chân và 6 mắt, quạt nhỏ mới nhú, khăn ngọc', vb='-30 -30 220 200'))
    S.append(card('<ellipse cx="80" cy="146" rx="46" ry="5" fill="#2B2B3A" opacity=".12"/><g class="dangle">' + scaled(
        fan(122, 76, 7, RAINBOW) + legs8() + '<use href="#wsb"/><use href="#we6"/><path d="M52 112Q80 128 108 112L104 124Q80 140 56 124Z" fill="#2FB8C6"/><use href="#wstar" transform="translate(80 24) scale(1.3)"/>', .86, 80, 150) + '</g>',
        'Lv 25–49', 'background:#EEE6FF;color:#5A33B8', 'Nhện công', 'Xoè quạt tơ bảy sắc có mắt công, nhảy múa', vb='-60 -60 280 240'))
    husk = ('<g class="husk" style="--b:#E6DDF8;--b2:#DCD2F2;--leg:#D4C8F0;--toe:#EFE9FB;--eye:#C3B5E3"><g transform="translate(-118 30) rotate(-10 80 100) translate(80 150) scale(.62) translate(-80 -150)">' + legs8() + '<use href="#wsb"/><use href="#we6"/><path d="M62 38L72 56L62 70L74 84" stroke="#fff" stroke-width="3.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g></g>')
    S.append(card('<circle cx="90" cy="70" r="150" fill="url(#aura)" class="pulse"/><g class="rx" style="transform-origin:90px 90px"><circle cx="90" cy="90" r="90" fill="none" stroke="#FFD66B" stroke-width="3"/></g><ellipse cx="90" cy="146" rx="48" ry="5" fill="#2B2B3A" opacity=".12"/>' + husk +
        '<g class="dangle" style="--b:#FFF1CF;--b2:#FFE3A8;--leg:#F0C45A;--toe:#FFF3C4">' + scaled(fan(150, 86, 9, ['#FFD66B', '#FF9FB0', '#9DE0F5', '#C9B3FF', '#B4EBC0'], '#FFC94D') +
        '<g class="spr" opacity=".6"><g fill="none" stroke="#E0A21F" stroke-width="1.6" stroke-linecap="round" transform="translate(80 70) scale(1.1)"><circle r="14"/><circle r="26"/><circle r="38"/><path d="M0 -42V42M-42 0H42M-30 -30L30 30M30 -30L-30 30"/></g></g>' +
        legs8() + '<use href="#wsb"/><use href="#we6"/><path d="M52 112Q80 128 108 112L104 124Q80 140 56 124Z" fill="#FFC94D"/><use href="#wstar" transform="translate(80 18) scale(1.7)"/><use href="#wstar" transform="translate(52 28) scale(1.1)"/><use href="#wstar" transform="translate(108 28) scale(1.1)"/>', .84, 90, 150) + '</g>'
        '<use href="#wstar" class="tk" transform="translate(-30 20)"/><use href="#wstar" class="tk" style="--d:-.7s" transform="translate(210 30) scale(.8)"/><use href="#wstar" class="tk" style="--d:-1.3s" transform="translate(200 120) scale(.7)"/>',
        'Lv 50+', 'background:#FFF0CC;color:#7A4A06', 'Nhện công thoát xác', 'Bỏ lớp vỏ cũ trong mờ, quạt tơ vàng–pha lê 9 cánh, hào quang mạng nhện', 'border-color:#F0D58A;background:linear-gradient(180deg,#fff,#FFF8E1)', vb='-130 -90 420 270'))
    cols = 'minmax(0,.75fr) minmax(0,.85fr) minmax(0,1fr) minmax(0,1.2fr) minmax(0,1.7fr)'
    sw = [('#9B7BE0', 'lông', 1), ('#7E5DC8', 'bụng', 1), ('#2FB8C6', 'khăn', 1), ('#F58FA0', 'hồng', 0), ('#FFD66B', 'vàng', 0), ('#FFF1CF', 'thoát xác', 0)]
    note = ('<b>Bỏ dạng người, đổi kiểu biến hình:</b> lấy cảm hứng <b>nhện công (peacock spider)</b> — loài nhện nhảy bé xíu xoè quạt rực rỡ để khoe. Tiến hoá: kén → nhện bông 2 mắt → nhện nhảy 8 chân 6 mắt, quạt mới nhú → nhện công xoè quạt 7 sắc có "mắt công" → <b>thoát xác</b>: bỏ lớp vỏ cũ, quạt vàng–pha lê 9 cánh, hào quang mạng nhện.<br><b>Hoạt ảnh:</b> quạt phập phồng, đung đưa tơ, chân gõ nhịp, chớp mắt. <b>Duyệt giúp:</b> hướng "nhện công" ổn chưa? Cute hơn nữa thì chỉnh gì?')
    return page4('Webby character sheet', 'Webby · nhện công xoè quạt', 'Nhện bông → nhện nhảy → nhện công → thoát xác (không còn hình người).', ''.join(S), cols, sw, note, WD)

# =============== BI v3 (wow) ===============
bi_src = open('C:/Users/01217/AppData/Local/Temp/claude/D--Gonbi-Projects-App-english-assistant/c1c78865-4583-4473-9d0d-3448ab8ce72b/scratchpad/ea/project/CharBi.dc.html', encoding='utf-8').read()
bi_defs = bi_src[bi_src.index('<g id="bbody">'):bi_src.index('</defs></svg>')]
BD = """
<radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD3E3" stop-opacity=".9"/><stop offset="1" stop-color="#FFD3E3" stop-opacity="0"/></radialGradient>
<linearGradient id="pw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8FB1"/><stop offset=".5" stop-color="#FFC27A"/><stop offset="1" stop-color="#B79BFF"/></linearGradient>
<linearGradient id="pw2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9DE0F5"/><stop offset=".5" stop-color="#C9B3FF"/><stop offset="1" stop-color="#FF9FB0"/></linearGradient>
<g id="bleafw"><ellipse cx="14" cy="96" rx="34" ry="14" transform="rotate(-24 14 96)" fill="#5BC46E"/><path d="M-12 108Q14 94 40 82" stroke="#3E8F4F" stroke-width="2" fill="none" stroke-linecap="round"/></g>
<g id="bpw"><path d="M46 94C20 80 -8 52 6 28C32 28 54 58 46 94Z" style="fill:var(--wa,#FF8FB1)"/><path d="M46 100C24 102 2 114 8 138C34 138 52 122 46 100Z" style="fill:var(--wb,#FFB3C9)"/><path d="M44 90C28 74 14 54 12 38M44 104C30 108 18 120 14 132" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-linecap="round"/></g>
<g id="bmand"><g><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#FF8FB1"/></g><g transform="rotate(30)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#FFC27A"/></g><g transform="rotate(60)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#FFE08A"/></g><g transform="rotate(90)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#B4EBC0"/></g><g transform="rotate(120)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#9DE0F5"/></g><g transform="rotate(150)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#C9B3FF"/></g><g transform="rotate(180)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#FF8FB1"/></g><g transform="rotate(210)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#FFC27A"/></g><g transform="rotate(240)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#FFE08A"/></g><g transform="rotate(270)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#B4EBC0"/></g><g transform="rotate(300)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#9DE0F5"/></g><g transform="rotate(330)"><ellipse cx="0" cy="-38" rx="9" ry="26" fill="#C9B3FF"/></g></g>
<g id="blotus"><g fill="#FFC1D8"><ellipse cx="-34" cy="-6" rx="10" ry="22" transform="rotate(-62 -34 -6)"/><ellipse cx="34" cy="-6" rx="10" ry="22" transform="rotate(62 34 -6)"/><ellipse cx="-18" cy="-10" rx="10" ry="24" transform="rotate(-32 -18 -10)"/><ellipse cx="18" cy="-10" rx="10" ry="24" transform="rotate(32 18 -10)"/></g><ellipse cx="0" cy="-12" rx="10" ry="25" fill="#FF9FC0"/></g>
"""
def bi3():
    base = bi_defs
    S = []
    S.append(card('<ellipse cx="80" cy="146" rx="38" ry="6" fill="#2B2B3A" opacity=".12"/><g class="bob"><g class="wig" style="transform-origin:80px 50px"><path d="M80 52C79 44 79 40 79 36" stroke="#4CAF6A" stroke-width="4" stroke-linecap="round"/><path d="M79 40C70 38 64 32 66 25C74 25 80 31 79 40Z" fill="#5BC46E"/><path d="M79 40C88 38 94 32 92 25C84 25 78 31 79 40Z" fill="#6ED27F"/></g>'
        '<ellipse cx="80" cy="98" rx="44" ry="50" fill="#7FD6C6"/><ellipse cx="58" cy="76" rx="9" ry="6" fill="#5FB8A8" opacity=".7"/><ellipse cx="104" cy="118" rx="10" ry="7" fill="#5FB8A8" opacity=".7"/><ellipse cx="62" cy="72" rx="4" ry="12" fill="#fff" opacity=".5" transform="rotate(18 62 72)"/><circle cx="70" cy="104" r="3" fill="#2B2B3A"/><circle cx="90" cy="104" r="3" fill="#2B2B3A"/></g>',
        'Lv 1', 'background:#F6EEDB;color:#5E5E73', 'Trứng mầm', 'Mầm xanh nhú, rung rinh'))
    S.append(card('<ellipse cx="80" cy="146" rx="32" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' + scaled('<g class="wig"><use href="#bleaf"/></g><use href="#bbody"/>', .64) + '</g>', 'Lv 2–9', 'background:#EEE6FF;color:#5A33B8', 'Bi con', 'Nhỏ xíu, tròn xoe, mầm hai lá'))
    S.append(card('<ellipse cx="80" cy="146" rx="40" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' + scaled(
        '<g class="wl"><use href="#bleafw"/></g><g class="wr"><g transform="translate(160 0) scale(-1 1)"><use href="#bleafw"/></g></g><g class="wig"><path d="M80 40C80 28 80 20 80 12" stroke="#4CAF6A" stroke-width="4" stroke-linecap="round"/><path d="M80 32C68 30 60 22 62 13C73 13 82 21 80 32Z" fill="#5BC46E"/><path d="M80 32C92 30 100 22 98 13C87 13 78 21 80 32Z" fill="#6ED27F"/><ellipse cx="80" cy="8" rx="6" ry="9" fill="#FF8FB1"/></g><use href="#bbody"/><path d="M54 118Q80 132 106 118L104 128Q80 142 56 128Z" fill="#3F6FE0"/>', .84) + '</g>',
        'Lv 10–24', 'background:#EEE6FF;color:#5A33B8', 'Bi lá', 'Mọc đôi cánh lá, nụ hoa chớm, khăn xanh', vb='-20 -10 200 170'))
    S.append(card('<ellipse cx="80" cy="146" rx="44" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' + scaled(
        '<g class="wl" style="--wa:#FF8FB1;--wb:#FFB3C9"><use href="#bpw"/></g><g class="wr" style="--wa:#FF8FB1;--wb:#FFB3C9"><g transform="translate(160 0) scale(-1 1)"><use href="#bpw"/></g></g>'
        '<g class="wig"><path d="M80 40C80 32 80 26 80 22" stroke="#4CAF6A" stroke-width="4" stroke-linecap="round"/><use href="#bflower" transform="translate(80 12) scale(1.2)"/></g><use href="#bbody"/><path d="M54 118Q80 132 106 118L104 128Q80 142 56 128Z" fill="#FFD66B"/><use href="#bstar" transform="translate(80 126)"/>', .88) + '</g>'
        '<g class="pt" style="--d:0s"><ellipse cx="10" cy="20" rx="4" ry="2.5" fill="#FF8FB1"/></g><g class="pt" style="--d:-2s"><ellipse cx="150" cy="10" rx="4" ry="2.5" fill="#FFB347"/></g>',
        'Lv 25–49', 'background:#EEE6FF;color:#5A33B8', 'Bi cánh hoa', 'Cánh cánh bướm bằng cánh hoa hồng, hoa nở trên đầu', vb='-30 -10 220 170'))
    S.append(card('<circle cx="80" cy="76" r="150" fill="url(#aura)" class="pulse"/><g class="rx" style="transform-origin:80px 80px"><circle cx="80" cy="80" r="70" fill="none" stroke="#FFC1D8" stroke-width="3"/></g>'
        '<g class="spr" opacity=".9" transform="translate(0 0)"><g transform="translate(80 70) scale(1.5)"><use href="#bmand"/></g></g>'
        '<ellipse cx="80" cy="146" rx="46" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob" style="--m:#8EE3D4;--m2:#6CCBBA;--m3:#E6FAF5">' + scaled(
        '<use href="#blotus" transform="translate(80 150)"/><g class="wl"><g transform="translate(46 92) scale(1.4) translate(-46 -92)"><g style="fill:url(#pw)"><path d="M46 94C20 80 -8 52 6 28C32 28 54 58 46 94Z" fill="url(#pw)"/><path d="M46 100C24 102 2 114 8 138C34 138 52 122 46 100Z" fill="url(#pw2)"/><path d="M44 90C28 74 14 54 12 38M44 104C30 108 18 120 14 132" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round"/></g></g></g>'
        '<g class="wr"><g transform="translate(160 0) scale(-1 1)"><g transform="translate(46 92) scale(1.4) translate(-46 -92)"><path d="M46 94C20 80 -8 52 6 28C32 28 54 58 46 94Z" fill="url(#pw)"/><path d="M46 100C24 102 2 114 8 138C34 138 52 122 46 100Z" fill="url(#pw2)"/><path d="M44 90C28 74 14 54 12 38M44 104C30 108 18 120 14 132" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round"/></g></g></g>'
        '<g class="wig"><path d="M80 40C80 32 80 26 80 22" stroke="#4CAF6A" stroke-width="4" stroke-linecap="round"/><use href="#bflower" transform="translate(80 8) scale(1.5)"/><use href="#bflower" transform="translate(44 26) scale(.8) rotate(-20)"/><use href="#bflower" transform="translate(116 26) scale(.8) rotate(20)"/></g><use href="#bbody"/><path d="M54 118Q80 132 106 118L104 128Q80 142 56 128Z" fill="#FFD66B"/><use href="#bstar" transform="translate(80 126) scale(1.2)"/>', .8, 80, 146) + '</g>'
        '<g class="pt" style="--d:0s"><ellipse cx="-20" cy="10" rx="5" ry="3" fill="#FF8FB1"/></g><g class="pt" style="--d:-1.4s"><ellipse cx="180" cy="0" rx="5" ry="3" fill="#FFB347"/></g><g class="pt" style="--d:-2.6s"><ellipse cx="90" cy="-6" rx="5" ry="3" fill="#B79BFF"/></g>'
        '<use href="#bstar" class="tk" transform="translate(-40 60) scale(1.4)"/><use href="#bstar" class="tk" style="--d:-.6s" transform="translate(200 70) scale(1.1)"/><use href="#bstar" class="tk" style="--d:-1.2s" transform="translate(190 140)"/><use href="#bstar" class="tk" style="--d:-.3s" transform="translate(-30 130) scale(.9)"/>',
        'Lv 50+', 'background:#FFE3EA;color:#9B2B5A', 'Bi hoa tiên', 'Đôi cánh cầu vồng khổng lồ, mandala 12 cánh quay, đài sen, vương miện 3 hoa', 'border-color:#F6C6D8;background:linear-gradient(180deg,#fff,#FFF3F8)', vb='-70 -30 300 210'))
    cols = 'minmax(0,.8fr) minmax(0,.85fr) minmax(0,1fr) minmax(0,1.15fr) minmax(0,1.6fr)'
    sw = [('#7FD6C6', 'thân', 0), ('#D5F4ED', 'bụng', 0), ('#5BC46E', 'lá', 0), ('#FF8FB1', 'cánh hoa', 0), ('#C9B3FF', 'pha lê', 0), ('#FFD66B', 'sao · vàng', 0)]
    note = ('<b>Tiến hoá "wow" hơn:</b> mầm trong trứng → bé tròn xoe → <b>mọc cánh lá</b> + nụ → <b>cánh bướm bằng cánh hoa</b> + hoa nở → <b>Hoa tiên</b>: cánh cầu vồng khổng lồ, mandala 12 cánh quay chậm sau lưng, đứng trên đài sen, vương miện 3 hoa, cánh hoa và sao lấp lánh rơi quanh.<br><b>Duyệt giúp:</b> đã đủ wow chưa? Muốn thêm hiệu ứng gì ở cấp cuối (ví dụ đom đóm, cầu vồng)?')
    return page4('Bi character sheet', 'Bi · mầm xanh tới hoa tiên (v3)', 'Mỗi cấp đổi hẳn hình dáng: lá → cánh hoa → cánh cầu vồng + mandala.', ''.join(S), cols, sw, note, BD + base)

open(OUT + '/CharDraco.dc.html', 'w', encoding='utf-8').write(draco4())
open(OUT + '/CharWebby.dc.html', 'w', encoding='utf-8').write(webby4())
open(OUT + '/CharBi.dc.html', 'w', encoding='utf-8').write(bi3())
print('ok')
