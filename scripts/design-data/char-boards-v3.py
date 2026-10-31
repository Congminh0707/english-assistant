import sys
OUT = sys.argv[1]

CSS = """
body{margin:0}
.t{font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#2B2B3A}
.h{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;margin:0}
.st{background:#fff;border:1px solid #E6DCC3;border-radius:16px;box-shadow:0 1px 2px rgba(43,43,58,.06),0 1px 3px rgba(43,43,58,.08);display:flex;flex-direction:column;align-items:center;padding:12px 8px 16px;box-sizing:border-box;text-align:center;min-width:0}
.chip{display:inline-flex;align-items:center;height:24px;padding:0 12px;border-radius:999px;font:700 12px 'Be Vietnam Pro',sans-serif}
.sw{height:40px;border-radius:12px;border:1px solid rgba(43,43,58,.12);display:flex;align-items:flex-end;padding:4px 8px;font:600 11px 'Be Vietnam Pro',sans-serif}
.d{font-size:13px;color:#5E5E73;line-height:1.4;margin-top:2px}
@keyframes bob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-3px) scale(1.012,.988)}}
@keyframes blink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}}
@keyframes flapl{0%,100%{transform:rotate(0)}50%{transform:rotate(-14deg)}}
@keyframes flapr{0%,100%{transform:rotate(0)}50%{transform:rotate(14deg)}}
@keyframes wag{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(5deg)}}
@keyframes flick{0%,100%{transform:scale(1,1)}50%{transform:scale(.88,1.16)}}
@keyframes pulse{0%,100%{opacity:.65}50%{opacity:1}}
@keyframes rise{0%{transform:translate(0,0);opacity:0}20%{opacity:1}100%{transform:translate(4px,-50px);opacity:0}}
@keyframes dangle{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-5px) rotate(2deg)}}
@keyframes tap{0%,100%{transform:rotate(0)}50%{transform:rotate(7deg)}}
@keyframes tapr{0%,100%{transform:rotate(0)}50%{transform:rotate(-7deg)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes thread{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes husk{0%,100%{opacity:.55;transform:translateY(0)}50%{opacity:.8;transform:translateY(-3px)}}
.bob{animation:bob 3s ease-in-out infinite;transform-origin:80px 146px}
.blink{animation:blink 5s infinite;transform-origin:80px 74px}
.fl{animation:flapl 1.9s ease-in-out infinite;transform-origin:58px 100px}
.fr{animation:flapr 1.9s ease-in-out infinite;transform-origin:102px 100px}
.wag{animation:wag 2.4s ease-in-out infinite;transform-origin:100px 128px}
.flick{animation:flick .9s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
.pulse{animation:pulse 3s ease-in-out infinite}
.rise{animation:rise 3s ease-out infinite}
.dangle{animation:dangle 3.4s ease-in-out infinite;transform-origin:80px -10px}
.tapl{animation:tap 1.8s ease-in-out infinite;transform-origin:44px 100px}
.tapr{animation:tapr 1.8s ease-in-out infinite;transform-origin:116px 100px}
.spin{animation:spin 26s linear infinite;transform-origin:80px 70px}
.thr{animation:thread 3s ease-in-out infinite;transform-origin:130px 76px}
.husk{animation:husk 4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.bob,.blink,.fl,.fr,.wag,.flick,.pulse,.rise,.dangle,.tapl,.tapr,.spin,.thr,.husk{animation:none}}
"""

HEAD = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>%s</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&family=Baloo+2:wght@700;800&display=swap">
<style>%s</style>
</helmet>
"""
TAIL = """</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1360,"height":680}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
"""

def card(svg, chip, chipstyle, title, desc, style="", vb='-10 -10 180 170'):
    return ('<div class="st" style="%s"><svg width="100%%" height="190" viewBox="%s" role="img" aria-label="%s">%s</svg>'
            '<span class="chip" style="%s;margin-top:4px">%s</span><div class="h" style="font-size:20px">%s</div><div class="d">%s</div></div>') % (style, vb, title, svg, chipstyle, chip, title, desc)

def page(title, h1, sub, cards, cols, swatches, note, defs):
    sw = ''.join('<div class="sw" style="background:%s;%s">%s</div>' % (c, ('color:#fff' if dark else ''), n) for c, n, dark in swatches)
    return (HEAD % (title, CSS) + '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + defs + '</defs></svg>'
        '<div class="t" style="width:1360px;height:680px;background:#FBF4E4;padding:28px 40px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px">'
        '<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap"><h1 class="h" style="font-size:40px;line-height:1">%s</h1><span class="chip" style="background:#FFF0CC;color:#7A4A06">Bản vẽ v3 — để duyệt, chưa áp dụng</span><span style="font-size:14px;color:#5E5E73">%s</span></div>'
        '<div style="display:grid;grid-template-columns:%s;gap:14px">%s</div>'
        '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:14px;flex:1;min-height:0">'
        '<div style="background:#fff;border:1px solid #E6DCC3;border-radius:16px;padding:14px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;align-content:start">%s</div>'
        '<div style="background:#fff;border:1px solid #E6DCC3;border-radius:16px;padding:12px 16px;font-size:13px;line-height:1.5">%s</div></div></div>' % (h1, sub, cols, cards, sw, note)
        + TAIL)

def scaled(inner, s, cx=80, cy=143):
    return '<g transform="translate(%s %s) scale(%s) translate(%s %s)">%s</g>' % (cx, cy, s, -cx, -cy, inner)
def flip(use):
    return '<g transform="translate(160 0) scale(-1 1)">%s</g>' % use

# ================= DRACO =================
DDEFS = """
<radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFC48A" stop-opacity=".85"/><stop offset="1" stop-color="#FFC48A" stop-opacity="0"/></radialGradient>
<g id="dfire"><path d="M0 0C-8 -8 -7 -18 0 -28C7 -18 8 -8 0 0Z" fill="#FF8A3C"/><path d="M0 -2C-4 -7 -3 -13 0 -19C3 -13 4 -7 0 -2Z" fill="#FFD66B"/></g>
<g id="dwing">
<path d="M58 98C40 70 22 46 14 34C-14 38 -40 52 -42 54C-34 62 -36 72 -36 74C-34 80 -34 88 -34 88C-24 94 -22 100 -22 100C-16 106 -14 114 -14 114C28 112 50 108 58 98Z" style="fill:var(--wing,#7BD6A0)"/>
<path d="M58 98L14 34M14 34L-42 54M14 34L-36 74M14 34L-14 114" stroke="var(--g2,#3FA874)" stroke-width="3.4" fill="none" stroke-linecap="round"/>
<path d="M14 34L6 20" stroke="var(--horn,#FFD66B)" stroke-width="4" stroke-linecap="round"/>
</g>
<g id="dhorn"><path d="M46 46C36 32 32 20 38 8C48 16 56 28 58 42Z" style="fill:var(--horn,#FFD66B)"/><path d="M38 8C40 12 44 14 48 15" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/></g>
<g id="dhornbig"><path d="M46 44C30 38 14 28 6 10C26 12 44 22 56 40Z" style="fill:var(--horn,#FFD66B)"/><path d="M6 10C14 14 24 16 34 18" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/></g>
<g id="dhead">
<path d="M32 70L12 60L16 82Z" style="fill:var(--g2,#3FA874);stroke:var(--g2,#3FA874);stroke-width:4;stroke-linejoin:round"/><path d="M128 70L148 60L144 82Z" style="fill:var(--g2,#3FA874);stroke:var(--g2,#3FA874);stroke-width:4;stroke-linejoin:round"/>
<ellipse cx="80" cy="72" rx="52" ry="40" style="fill:var(--g,#5CC48A)"/>
<ellipse cx="54" cy="46" rx="14" ry="5.5" fill="#fff" opacity=".3" transform="rotate(-22 54 46)"/>
<ellipse cx="80" cy="90" rx="28" ry="19" style="fill:var(--snout,#9BE3BB)"/>
<ellipse cx="72" cy="86" rx="2.4" ry="3" fill="#2F7F57"/><ellipse cx="88" cy="86" rx="2.4" ry="3" fill="#2F7F57"/>
<g class="blink"><ellipse cx="55" cy="72" rx="9.5" ry="12" fill="#3A2430"/><ellipse cx="55" cy="78" rx="6" ry="5" fill="#E8A13A" opacity=".75"/><circle cx="52" cy="67" r="3.8" fill="#fff"/><circle cx="59" cy="77" r="1.8" fill="#fff"/>
<ellipse cx="105" cy="72" rx="9.5" ry="12" fill="#3A2430"/><ellipse cx="105" cy="78" rx="6" ry="5" fill="#E8A13A" opacity=".75"/><circle cx="102" cy="67" r="3.8" fill="#fff"/><circle cx="109" cy="77" r="1.8" fill="#fff"/></g>
<ellipse cx="38" cy="90" rx="8" ry="4.5" fill="#FF9FB0" opacity=".7"/><ellipse cx="122" cy="90" rx="8" ry="4.5" fill="#FF9FB0" opacity=".7"/>
<path d="M72 97q8 6 16 0" stroke="#2F7F57" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M86 97l2.4 5 2.6-5z" fill="#fff"/>
</g>
<g id="dtorso">
<ellipse cx="80" cy="124" rx="26" ry="20" style="fill:var(--g,#5CC48A)"/>
<ellipse cx="80" cy="130" rx="16" ry="13" style="fill:var(--belly,#FFF0C9)"/>
<path d="M70 118h20M70 126h20M72 134h16" stroke="#E6D3A0" stroke-width="1.6" stroke-linecap="round"/>
<ellipse cx="64" cy="142" rx="11" ry="6" style="fill:var(--g2,#3FA874)"/><ellipse cx="96" cy="142" rx="11" ry="6" style="fill:var(--g2,#3FA874)"/>
</g>
<g id="dtail1"><path d="M104 134C146 142 166 122 152 94C150 110 134 120 106 120Z" style="fill:var(--g,#5CC48A)"/><path d="M150 84L160 98L146 100Z" style="fill:var(--horn,#FFD66B)"/></g>
<g id="dtail2"><path d="M104 136C150 146 196 140 210 108C212 124 196 134 168 130C150 128 130 124 106 120Z" style="fill:var(--g,#5CC48A)"/><path d="M206 92L222 112L202 114Z" style="fill:var(--horn,#FFD66B)"/><path d="M130 130l4-10 4 10M156 134l4-10 4 10M182 130l4-10 4 10" stroke="var(--horn,#FFD66B)" stroke-width="3" fill="none" stroke-linejoin="round"/></g>
<g id="dspk"><path d="M-6 0L0 -12L6 0Z" style="fill:var(--horn,#FFD66B)"/></g>
<g id="dplate"><path d="M60 112C60 104 100 104 100 112L98 146C90 150 70 150 62 146Z" style="fill:var(--plate,#FFD66B)" opacity=".95"/><path d="M62 122H98M63 132H97M65 142H95" stroke="#D49A1F" stroke-width="1.8" fill="none"/></g>
"""

def draco():
    S = []
    # 1 egg
    S.append(card(
        '<ellipse cx="80" cy="146" rx="38" ry="6" fill="#2B2B3A" opacity=".12"/><g class="bob">'
        '<path d="M64 52L60 36L74 46Z" fill="#FFD66B"/><path d="M96 52L100 36L86 46Z" fill="#FFD66B"/>'
        '<ellipse cx="80" cy="98" rx="44" ry="50" fill="#5CC48A"/>'
        '<g fill="#3FA874" opacity=".7"><path d="M48 80a8 8 0 0 1 16 0z"/><path d="M96 70a8 8 0 0 1 16 0z"/><path d="M64 108a8 8 0 0 1 16 0z"/><path d="M92 120a8 8 0 0 1 16 0z"/><path d="M44 120a8 8 0 0 1 16 0z"/></g>'
        '<path d="M50 98C58 90 66 104 74 96S90 104 98 96S110 104 114 96" stroke="#FFF0C9" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
        '<ellipse cx="62" cy="72" rx="4" ry="12" fill="#fff" opacity=".45" transform="rotate(18 62 72)"/>'
        '<g class="rise"><use href="#dfire" transform="translate(88 54) scale(.45)"/></g></g>',
        'Lv 1', 'background:#F6EEDB;color:#5E5E73', 'Trứng rồng', 'Vỏ vảy xanh, tia lửa bốc lên'))
    # 2 hatchling: round, no wings
    S.append(card(
        '<ellipse cx="80" cy="146" rx="32" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' +
        scaled('<g class="wag"><use href="#dtail1"/></g><use href="#dtorso"/><use href="#dhorn" transform="translate(80 70) scale(.8) translate(-80 -70) translate(0 4)"/><use href="#dhorn" transform="translate(80 70) scale(-.8 .8) translate(-80 -70) translate(0 4)"/><use href="#dhead"/>', .7) + '</g>',
        'Lv 2–9', 'background:#EEE6FF;color:#5A33B8', 'Rồng con', 'Mũm mĩm, sừng nhú, chưa có cánh'))
    # 3 whelp: small wings, spikes, neck short
    S.append(card(
        '<ellipse cx="80" cy="146" rx="36" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' +
        scaled('<g class="fl"><use href="#dwing" transform="translate(58 98) scale(.52) translate(-58 -98)"/></g><g class="fr"><g transform="translate(160 0) scale(-1 1)"><use href="#dwing" transform="translate(58 98) scale(.52) translate(-58 -98)"/></g></g>'
               '<g class="wag"><use href="#dtail1"/></g><use href="#dtorso"/>'
               '<g transform="translate(80 66) scale(.88) translate(-80 -72)"><use href="#dhorn"/><use href="#dhorn" transform="translate(160 0) scale(-1 1)"/><use href="#dhead"/></g>'
               '<use href="#dspk" transform="translate(80 108) scale(.7)"/><use href="#dspk" transform="translate(80 118) scale(.7)"/>'
               '<path d="M54 118Q80 130 106 118L104 128Q80 140 56 128Z" fill="#E8604C"/>', .86) + '</g>',
        'Lv 10–24', 'background:#EEE6FF;color:#5A33B8', 'Rồng non', 'Cánh nhỏ tập bay, mào gai, khăn đỏ', vb='-30 -10 220 170'))
    # 4 drake: neck, bigger wings, armor, flame tail
    S.append(card(
        '<ellipse cx="80" cy="146" rx="46" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' +
        scaled('<g class="fl"><use href="#dwing" transform="translate(58 98) scale(.95) translate(-58 -98)"/></g><g class="fr"><g transform="translate(160 0) scale(-1 1)"><use href="#dwing" transform="translate(58 98) scale(.95) translate(-58 -98)"/></g></g>'
               '<g class="wag"><use href="#dtail2"/><g class="flick"><use href="#dfire" transform="translate(214 96) scale(.8)"/></g></g>'
               '<ellipse cx="80" cy="92" rx="18" ry="28" style="fill:var(--g,#5CC48A)"/>'
               '<g transform="translate(80 143) scale(1.22) translate(-80 -143)"><use href="#dtorso"/><use href="#dplate" transform="translate(80 143) scale(.5) translate(-80 -143)"/></g>'
               '<use href="#dspk" transform="translate(80 84) scale(.8)"/><use href="#dspk" transform="translate(80 100) scale(.8)"/>'
               '<g transform="translate(80 48) scale(.74) translate(-80 -72)"><use href="#dhornbig"/><use href="#dhornbig" transform="translate(160 0) scale(-1 1)"/><use href="#dhead"/></g>', .84) + '</g>',
        'Lv 25–49', 'background:#EEE6FF;color:#5A33B8', 'Phi long', 'Cổ dài, cánh rộng, giáp ngực, đuôi lửa', vb='-60 -15 300 175'))
    # 5 ancient western dragon
    S.append(card(
        '<circle cx="80" cy="80" r="150" fill="url(#aura)" class="pulse"/><ellipse cx="80" cy="146" rx="54" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob" style="--g:#6ED3A0;--g2:#3FA874;--wing:#FFD99A;--belly:#FFF6D8;--snout:#A9ECC7;--horn:#FFC94D;--plate:#FFC94D">' +
        scaled('<g class="fl"><use href="#dwing" transform="translate(58 98) scale(1.6) translate(-58 -98)"/></g><g class="fr"><g transform="translate(160 0) scale(-1 1)"><use href="#dwing" transform="translate(58 98) scale(1.6) translate(-58 -98)"/></g></g>'
               '<g class="wag"><use href="#dtail2"/><g class="flick"><use href="#dfire" transform="translate(214 96) scale(1)"/></g></g>'
               '<path d="M64 122C54 84 60 52 76 28C92 52 106 84 96 122Z" style="fill:var(--g)"/>'
               '<g transform="translate(80 143) scale(1.38) translate(-80 -143)"><use href="#dtorso"/><use href="#dplate" transform="translate(80 143) scale(.5) translate(-80 -143)"/></g>'
               '<use href="#dspk" transform="translate(80 62) scale(.9)"/><use href="#dspk" transform="translate(80 78) scale(.9)"/><use href="#dspk" transform="translate(80 94) scale(.9)"/>'
               '<g transform="translate(80 24) scale(.62) translate(-80 -72)"><use href="#dhornbig"/><use href="#dhornbig" transform="translate(160 0) scale(-1 1)"/><use href="#dhorn" transform="translate(0 -6)"/><use href="#dhorn" transform="translate(160 -6) scale(-1 1)"/><use href="#dhead"/></g>'
               '<g class="flick"><use href="#dfire" transform="translate(80 -14) scale(.8)"/></g><g class="flick" style="animation-delay:-.4s"><use href="#dfire" transform="translate(56 -4) scale(.55)"/></g><g class="flick" style="animation-delay:-.7s"><use href="#dfire" transform="translate(104 -4) scale(.55)"/></g>', .72, 80, 143) + '</g>',
        'Lv 50+', 'background:#FFF0CC;color:#7A4A06', 'Cổ long phương Tây', 'Cánh rất rộng và dài, 4 sừng, giáp vàng, đuôi gai, vương miện lửa', 'border-color:#F6C48A;background:linear-gradient(180deg,#fff,#FFF4E5)', vb='-85 -25 330 195'))
    cols = 'minmax(0,.8fr) minmax(0,.8fr) minmax(0,.95fr) minmax(0,1.15fr) minmax(0,1.5fr)'
    sw = [('#5CC48A', 'vảy', 0), ('#3FA874', 'bóng · chân', 1), ('#FFF0C9', 'bụng', 0), ('#FFD66B', 'sừng · giáp', 0), ('#FF8A3C', 'lửa', 0), ('#7BD6A0', 'màng cánh', 0)]
    note = ('<b>Tiến hoá bằng hình dáng (tham khảo rồng trong game phương Tây):</b> trứng → <i>hatchling</i> tròn không cánh → <i>whelp</i> cánh nhỏ → <i>drake</i> cổ dài, cánh lớn, giáp ngực, đuôi lửa → <b>rồng cổ đại</b> cánh rộng gấp đôi thân với xương ngón và màng, cổ dài, 4 sừng, vảy vàng, đuôi gai, vương miện lửa. Đầu nhỏ dần so với thân (bé → hùng vĩ) nhưng vẫn mắt to, má hồng.<br>'
            '<b>Hoạt ảnh:</b> thở, chớp mắt, vỗ cánh, vẫy đuôi, lửa nhảy. <b>Duyệt giúp:</b> cấp cuối đã đủ "rồng phương Tây" chưa? Muốn dữ hơn hay hiền hơn?')
    return page('Draco character sheet', 'Draco · rồng con tới cổ long', 'Hatchling → whelp → drake → rồng cổ đại phương Tây. Cánh và thân lớn dần rõ rệt.', ''.join(S), cols, sw, note, DDEFS)

# ================= WEBBY =================
WDEFS = """
<radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
<path id="wstar" d="M0 -7l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#FFD66B"/>
<g id="wleg"><path d="M44 96C14 80 2 104 10 134" stroke="var(--leg,#5A3FA0)" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="10" cy="134" r="5.5" fill="var(--toe,#F4B6C8)"/></g>
<g id="wleg2"><path d="M50 116C24 114 14 134 24 150" stroke="var(--leg,#5A3FA0)" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="24" cy="150" r="5.5" fill="var(--toe,#F4B6C8)"/></g>
<g id="wleg3"><path d="M42 82C14 56 -2 70 -4 100" stroke="var(--leg,#5A3FA0)" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="-4" cy="100" r="5.5" fill="var(--toe,#F4B6C8)"/></g>
<g id="wleg4"><path d="M58 126C46 138 44 146 52 152" stroke="var(--leg,#5A3FA0)" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="52" cy="152" r="5.5" fill="var(--toe,#F4B6C8)"/></g>
<g id="wspider">
<ellipse cx="80" cy="122" rx="30" ry="24" style="fill:var(--b2,#6C4FB5)"/>
<circle cx="66" cy="124" r="4" fill="#B79BFF" opacity=".8"/><circle cx="92" cy="130" r="5" fill="#B79BFF" opacity=".8"/><circle cx="82" cy="116" r="3" fill="#B79BFF" opacity=".8"/>
<ellipse cx="80" cy="72" rx="52" ry="42" style="fill:var(--b,#8B6BD0)"/>
<ellipse cx="54" cy="46" rx="14" ry="6" fill="#fff" opacity=".28" transform="rotate(-22 54 46)"/>
<g class="blink"><ellipse cx="56" cy="76" rx="11" ry="14" fill="#2B2B3A"/><circle cx="52" cy="70" r="4.6" fill="#fff"/><circle cx="60" cy="82" r="2.2" fill="#fff"/><ellipse cx="104" cy="76" rx="11" ry="14" fill="#2B2B3A"/><circle cx="100" cy="70" r="4.6" fill="#fff"/><circle cx="108" cy="82" r="2.2" fill="#fff"/></g>
<ellipse cx="34" cy="96" rx="8" ry="4.5" fill="#FF9FB0" opacity=".75"/><ellipse cx="126" cy="96" rx="8" ry="4.5" fill="#FF9FB0" opacity=".75"/>
<path d="M72 98q8 7 16 0" stroke="#2B2B3A" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<path d="M80 30q-6-10 6-14" stroke="var(--b2,#6C4FB5)" stroke-width="4" fill="none" stroke-linecap="round"/>
</g>
<g id="wmask"><path d="M30 70C50 54 110 54 130 70L132 88C110 104 50 104 28 88Z" style="fill:var(--mask,#E8604C)"/>
<circle cx="56" cy="76" r="20" fill="#F4FBFF" stroke="#2FB8C6" stroke-width="5"/><circle cx="104" cy="76" r="20" fill="#F4FBFF" stroke="#2FB8C6" stroke-width="5"/>
<g class="blink"><ellipse cx="57" cy="77" rx="10.5" ry="12.5" fill="#2B2B3A"/><circle cx="53" cy="71" r="4.2" fill="#fff"/><circle cx="61" cy="83" r="2" fill="#fff"/><ellipse cx="103" cy="77" rx="10.5" ry="12.5" fill="#2B2B3A"/><circle cx="99" cy="71" r="4.2" fill="#fff"/><circle cx="107" cy="83" r="2" fill="#fff"/></g>
<path d="M72 100q8 7 16 0" stroke="#2B2B3A" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>
<g id="hero">
<path d="M64 106Q22 70 12 116" stroke="var(--blegs,#5A3FA0)" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M62 114Q24 112 20 144" stroke="var(--blegs,#5A3FA0)" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M96 106Q138 70 148 116" stroke="var(--blegs,#5A3FA0)" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M98 114Q136 112 140 144" stroke="var(--blegs,#5A3FA0)" stroke-width="7" fill="none" stroke-linecap="round"/>
<rect x="60" y="130" width="16" height="14" rx="7" style="fill:var(--boot,#4A3578)"/><rect x="84" y="130" width="16" height="14" rx="7" style="fill:var(--boot,#4A3578)"/>
<rect x="58" y="98" width="44" height="40" rx="18" style="fill:var(--suit,#2FB8C6)"/>
<path d="M62 112Q80 122 98 112M64 124Q80 132 96 124M80 98V138" stroke="var(--line,#7BE3EC)" stroke-width="1.8" fill="none"/>
<path d="M80 108l7 4v8l-7 4-7-4v-8z" style="fill:var(--emb,#FFD66B)" stroke="#fff" stroke-width="1.2"/>
<path d="M60 108Q46 114 44 128" stroke="var(--suit,#2FB8C6)" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="44" cy="130" r="6.5" style="fill:var(--glove,#4A3578)"/>
<path d="M100 106Q116 96 124 80" stroke="var(--suit,#2FB8C6)" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="125" cy="76" r="6.5" style="fill:var(--glove,#4A3578)"/>
<g class="thr"><path d="M128 72Q150 50 176 30" stroke="#E9E1FF" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>
<ellipse cx="80" cy="66" rx="50" ry="40" style="fill:var(--mask,#7B4FE0)"/>
<ellipse cx="56" cy="40" rx="14" ry="5.5" fill="#fff" opacity=".28" transform="rotate(-22 56 40)"/>
<path d="M80 28V50M62 32Q70 46 72 56M98 32Q90 46 88 56M44 44Q58 56 66 58M116 44Q102 56 94 58M50 70Q80 80 110 70" stroke="var(--mline,#B79BFF)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M32 62C46 54 68 62 76 80C58 86 40 80 32 62Z" style="fill:var(--lens,#fff);stroke:var(--rim,#2FB8C6)" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M128 62C114 54 92 62 84 80C102 86 120 80 128 62Z" style="fill:var(--lens,#fff);stroke:var(--rim,#2FB8C6)" stroke-width="3.5" stroke-linejoin="round"/>
<g class="blink"><ellipse cx="58" cy="72" rx="7.5" ry="8.5" style="fill:var(--pupil,#2B2B3A)"/><circle cx="55.5" cy="69" r="2.8" fill="#fff"/><ellipse cx="102" cy="72" rx="7.5" ry="8.5" style="fill:var(--pupil,#2B2B3A)"/><circle cx="99.5" cy="69" r="2.8" fill="#fff"/></g>
<ellipse cx="40" cy="90" rx="7" ry="4" fill="#FF9FB0" opacity=".6"/><ellipse cx="120" cy="90" rx="7" ry="4" fill="#FF9FB0" opacity=".6"/>
<path d="M72 92q8 6 16 0" stroke="#2B2B3A" stroke-width="2.4" fill="none" stroke-linecap="round"/>
</g>
"""

def webby():
    S = []
    # 1 cocoon
    S.append(card(
        '<ellipse cx="80" cy="146" rx="38" ry="6" fill="#2B2B3A" opacity=".12"/><g class="dangle"><path d="M80 -12V56" stroke="#D8D0F0" stroke-width="2.6" stroke-linecap="round"/>'
        '<ellipse cx="80" cy="98" rx="42" ry="52" fill="#F1ECFF"/>'
        '<path d="M44 80C60 90 100 90 116 80M40 100C60 112 100 112 120 100M46 122C62 130 98 130 114 122M80 48V148" stroke="#CFC3F0" stroke-width="2.4" fill="none"/>'
        '<ellipse cx="62" cy="70" rx="4" ry="12" fill="#fff" opacity=".7" transform="rotate(18 62 70)"/>'
        '<circle cx="68" cy="106" r="5" fill="#2FB8C6" class="pulse"/><circle cx="92" cy="106" r="5" fill="#2FB8C6" class="pulse"/></g>',
        'Lv 1', 'background:#F6EEDB;color:#5E5E73', 'Kén tơ', 'Hai mắt sáng lấp ló trong kén'))
    # 2 spiderling: 4 legs, plain face
    S.append(card(
        '<ellipse cx="80" cy="146" rx="30" ry="5" fill="#2B2B3A" opacity=".12"/><g class="dangle">' +
        scaled('<path d="M80 -40V30" stroke="#D8D0F0" stroke-width="2.6" stroke-linecap="round"/><g class="tapl"><use href="#wleg"/></g><g class="tapr"><g transform="translate(160 0) scale(-1 1)"><use href="#wleg"/></g></g><g class="tapl"><use href="#wleg2"/></g><g class="tapr"><g transform="translate(160 0) scale(-1 1)"><use href="#wleg2"/></g></g><use href="#wspider"/>', .66, 80, 150) + '</g>',
        'Lv 2–9 · 4 chân', 'background:#EEE6FF;color:#5A33B8', 'Nhện con', 'Tròn xoe, mắt to, treo trên sợi tơ'))
    # 3 huntress: 8 legs + goggles mask
    S.append(card(
        '<ellipse cx="80" cy="146" rx="40" ry="5" fill="#2B2B3A" opacity=".12"/><g class="dangle">' +
        scaled('<path d="M80 -40V30" stroke="#D8D0F0" stroke-width="2.6" stroke-linecap="round"/>'
               '<use href="#wleg4"/><g transform="translate(160 0) scale(-1 1)"><use href="#wleg4"/></g><use href="#wleg3"/><g transform="translate(160 0) scale(-1 1)"><use href="#wleg3"/></g>'
               '<g class="tapl"><use href="#wleg"/></g><g class="tapr"><g transform="translate(160 0) scale(-1 1)"><use href="#wleg"/></g></g><g class="tapl"><use href="#wleg2"/></g><g class="tapr"><g transform="translate(160 0) scale(-1 1)"><use href="#wleg2"/></g></g>'
               '<use href="#wspider"/><use href="#wmask"/>', .86, 80, 150) + '</g>',
        'Lv 10–24 · 8 chân', 'background:#EEE6FF;color:#5A33B8', 'Nhện thợ săn', 'Đủ 8 chân, kính lặn, mặt nạ san hô', vb='-20 -20 200 190'))
    # 4 hero (humanoid): purple mask, teal suit, back legs
    S.append(card(
        '<ellipse cx="80" cy="147" rx="40" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' + scaled('<use href="#hero"/>', .94, 80, 146) + '</g>',
        'Lv 25–49', 'background:#EEE6FF;color:#5A33B8', 'Nhện hiệp sĩ', 'Biến hình đứng bằng hai chân: mặt nạ tím có mạng, bộ đồ ngọc, 4 chân nhện sau lưng', vb='-30 -10 230 170'))
    # 5 molt: husk + golden form
    S.append(card(
        '<circle cx="86" cy="76" r="140" fill="url(#aura)" class="pulse"/>'
        '<g class="spin" style="color:#E0A21F;opacity:.5"><g fill="none" stroke="#E0A21F" stroke-width="1.8" stroke-linecap="round" transform="translate(86 70) scale(1.5)"><circle r="12"/><circle r="24"/><circle r="36"/><path d="M0 -40V40M-40 0H40M-28 -28L28 28M28 -28L-28 28"/></g></g>'
        '<ellipse cx="86" cy="147" rx="40" ry="5" fill="#2B2B3A" opacity=".12"/>'
        '<g class="husk" style="--mask:#E6DDF8;--suit:#DCD2F2;--line:#fff;--mline:#fff;--boot:#CFC2EC;--glove:#CFC2EC;--blegs:#CFC2EC;--lens:#C9BCE8;--rim:#B8AAD8;--pupil:#B8AAD8;--emb:#CFC2EC"><g transform="translate(-70 12) rotate(-10 80 100) translate(80 146) scale(.8) translate(-80 -146)"><use href="#hero"/><path d="M80 98l-6 10 8 8-8 10 6 12" stroke="#fff" stroke-width="3" fill="none" stroke-linejoin="round"/></g></g>'
        '<g class="bob" style="--mask:#FFF1CF;--suit:#FFF8E6;--line:#F0C45A;--mline:#F0C45A;--boot:#F0C45A;--glove:#F0C45A;--blegs:#FFD66B;--lens:#FFFBEA;--rim:#FFC94D;--pupil:#2FB8C6;--emb:#7B4FE0">' +
        scaled('<g opacity=".45"><path d="M80 100L10 20M80 100L-10 60M80 100L-14 110M80 100L0 150M80 100L150 20M80 100L170 60M80 100L174 110M80 100L160 150" stroke="#FFD66B" stroke-width="3.5" stroke-linecap="round"/><circle cx="10" cy="20" r="5" fill="#FFF3C4"/><circle cx="150" cy="20" r="5" fill="#FFF3C4"/></g><use href="#hero"/>'
               '<use href="#wstar" transform="translate(80 20) scale(1.5)"/><use href="#wstar" transform="translate(56 30)"/><use href="#wstar" transform="translate(104 30)"/>', 1.0, 86, 146) + '</g>',
        'Lv 50+', 'background:#FFF0CC;color:#7A4A06', 'Nhện vương thoát xác', 'Bỏ lớp vỏ cũ (trong mờ), hiện dạng trắng vàng, 8 chân ánh sáng, mạng vàng xoay', 'border-color:#F0D58A;background:linear-gradient(180deg,#fff,#FFF8E1)', vb='-80 -25 330 195'))
    cols = 'minmax(0,.75fr) minmax(0,.85fr) minmax(0,1fr) minmax(0,1.1fr) minmax(0,1.6fr)'
    sw = [('#7B4FE0', 'mặt nạ', 1), ('#2FB8C6', 'bộ đồ', 1), ('#8B6BD0', 'nhện', 1), ('#E8604C', 'san hô', 1), ('#FFD66B', 'vàng · sao', 0), ('#FFF1CF', 'thoát xác', 0)]
    note = ('<b>Tiến hoá bằng hình dáng:</b> kén → nhện tròn 4 chân → nhện 8 chân đeo kính → <b>hình người nhện đứng</b> (mặt nạ có mạng, mắt trắng góc cạnh, 4 chân nhện sau lưng — tinh thần "siêu anh hùng nhện" nhưng đổi màu tím/ngọc, phù hiệu lục giác riêng, mắt có con ngươi dễ thương) → <b>thoát xác</b>: lớp vỏ cũ bỏ lại bên cạnh, dạng mới trắng vàng, 8 chân ánh sáng, mạng vàng xoay.<br>'
            '<b>Hoạt ảnh:</b> đung đưa tơ, chân gõ nhịp, chớp mắt, sợi tơ đung đưa, vỏ cũ nhấp nháy mờ. <b>Duyệt giúp:</b> dạng hiệp sĩ có giống quá/chưa giống? Nếu không ưng, mình quay lại nhện 8 chân vẽ đẹp hơn.')
    return page('Webby character sheet', 'Webby · nhện tới hiệp sĩ thoát xác', 'Nhện con → nhện thợ săn → hình người nhện hiệp sĩ → thoát xác (như hồ ly).', ''.join(S), cols, sw, note, WDEFS)

open(OUT + '/CharDraco.dc.html', 'w', encoding='utf-8').write(draco())
open(OUT + '/CharWebby.dc.html', 'w', encoding='utf-8').write(webby())
print('ok')
