import sys
OUT = sys.argv[1]

def pet(cls, extra=''):
    return ('<g class="%s"><g class="pb"><ellipse class="ft fl" cx="36" cy="84" rx="9" ry="5.5" fill="#5FB8A8"/><ellipse class="ft fr" cx="64" cy="84" rx="9" ry="5.5" fill="#5FB8A8"/>'
            '<ellipse class="am al" cx="19" cy="60" rx="7.5" ry="5" fill="#7FD6C6" transform="rotate(-25 19 60)"/><ellipse class="am ar" cx="81" cy="60" rx="7.5" ry="5" fill="#7FD6C6" transform="rotate(25 81 60)"/>'
            '<g class="hd"><path d="M50 22C28 22 18 40 18 58C18 74 32 86 50 86C68 86 82 74 82 58C82 40 72 22 50 22Z" fill="#7FD6C6"/><ellipse cx="50" cy="70" rx="20" ry="14" fill="#D5F4ED"/>'
            '<ellipse cx="28" cy="34" rx="6" ry="7" fill="#7FD6C6" transform="rotate(-24 28 34)"/><ellipse cx="72" cy="34" rx="6" ry="7" fill="#7FD6C6" transform="rotate(24 72 34)"/>'
            '<path class="sp" d="M50 24C48 14 56 10 62 15C60 20 56 24 50 24Z" fill="#4CAF6A"/><path class="sp" d="M50 24C52 14 44 10 38 15C40 20 44 24 50 24Z" fill="#5BC46E"/>'
            '<g class="ey"><ellipse cx="38" cy="54" rx="5" ry="7" fill="#2B2B3A"/><circle cx="36.5" cy="51" r="2.2" fill="#fff"/><ellipse cx="62" cy="54" rx="5" ry="7" fill="#2B2B3A"/><circle cx="60.5" cy="51" r="2.2" fill="#fff"/></g>'
            '<ellipse cx="26" cy="64" rx="5.5" ry="3" fill="#FF9FB0" opacity=".75"/><ellipse cx="74" cy="64" rx="5.5" ry="3" fill="#FF9FB0" opacity=".75"/><path d="M44 66q6 5 12 0" stroke="#2B2B3A" stroke-width="2" fill="none" stroke-linecap="round"/></g></g>%s</g>') % (cls, extra)

CSS = """
body{margin:0}
.t{font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#2B2B3A}
.h{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;margin:0}
.card{background:#fff;border:1px solid #E6DCC3;border-radius:16px;box-sizing:border-box;overflow:hidden}
.chip{display:inline-flex;align-items:center;height:24px;padding:0 12px;border-radius:999px;font:700 12px 'Be Vietnam Pro',sans-serif}
.cap{padding:8px 14px 12px}
.d{font-size:12px;color:#5E5E73;line-height:1.4;margin-top:2px}
@keyframes scrollx{from{transform:translateX(0)}to{transform:translateX(-420px)}}
@keyframes bounce{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-3px) rotate(-.8deg)}50%{transform:translateY(0)}75%{transform:translateY(-2px) rotate(.6deg)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes dust{0%{transform:translate(0,0) scale(.4);opacity:.8}100%{transform:translate(-50px,-14px) scale(1.5);opacity:0}}
@keyframes bobb{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-5px) rotate(2.5deg)}}
@keyframes foam{0%{transform:translate(0,0) scale(.5);opacity:.9}100%{transform:translate(-70px,2px) scale(1.4);opacity:0}}
@keyframes spray{0%{transform:translate(0,0);opacity:.9}100%{transform:translate(14px,-18px);opacity:0}}
@keyframes tilt{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}
@keyframes trail{0%{transform:translateX(0);opacity:.9}100%{transform:translateX(-90px);opacity:0}}
@keyframes ear{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(8deg)}}
@keyframes hop{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-7px) rotate(3deg)}}
@keyframes hop2{0%,100%{transform:translateY(0) rotate(5deg)}50%{transform:translateY(-9px) rotate(9deg)}}
@keyframes foot{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes footr{0%,100%{transform:translateY(-6px)}50%{transform:translateY(0)}}
@keyframes armsw{0%,100%{transform:rotate(-18deg)}50%{transform:rotate(18deg)}}
@keyframes armswr{0%,100%{transform:rotate(18deg)}50%{transform:rotate(-18deg)}}
@keyframes jump{0%,100%{transform:translateY(0) scale(1.1,.88)}30%{transform:translateY(-30px) scale(.92,1.1)}55%{transform:translateY(0) scale(1.12,.86)}70%{transform:translateY(-6px) scale(1,1)}}
@keyframes wave{0%,100%{transform:rotate(25deg)}50%{transform:rotate(-70deg)}}
@keyframes look{0%,100%{transform:translateX(-3px)}50%{transform:translateX(3px)}}
@keyframes tilthd{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
@keyframes spinY{0%{transform:scaleX(1)}50%{transform:scaleX(-1)}100%{transform:scaleX(1)}}
@keyframes sparkle{0%,100%{transform:scale(.2);opacity:0}50%{transform:scale(1);opacity:1}}
.sc{animation:scrollx var(--s,6s) linear infinite}
.bn{animation:bounce .5s ease-in-out infinite;transform-origin:50% 100%;transform-box:fill-box}
.wh{animation:spin .5s linear infinite;transform-box:fill-box;transform-origin:center}
.du{animation:dust .9s ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
.bt{animation:bobb 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.fo{animation:foam 1.4s ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
.sp2{animation:spray .9s ease-out infinite;animation-delay:var(--d,0s)}
.pl{animation:tilt 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.pr{animation:spin .12s linear infinite;transform-box:fill-box;transform-origin:center}
.tr{animation:trail 1.2s linear infinite;animation-delay:var(--d,0s)}
.walk .pb{animation:hop .6s ease-in-out infinite;transform-origin:50px 90px}
.walk .fl{animation:foot .6s ease-in-out infinite}.walk .fr{animation:footr .6s ease-in-out infinite}
.walk .al{animation:armsw .6s ease-in-out infinite;transform-origin:19px 60px}.walk .ar{animation:armswr .6s ease-in-out infinite;transform-origin:81px 60px}
.run .pb{animation:hop2 .34s ease-in-out infinite;transform-origin:50px 90px}
.run .fl{animation:foot .34s ease-in-out infinite}.run .fr{animation:footr .34s ease-in-out infinite}
.run .al{animation:armsw .34s ease-in-out infinite;transform-origin:19px 60px}.run .ar{animation:armswr .34s ease-in-out infinite;transform-origin:81px 60px}
.jump .pb{animation:jump 1.2s cubic-bezier(.3,.7,.4,1) infinite;transform-origin:50px 90px}
.wave .ar{animation:wave .5s ease-in-out infinite;transform-origin:81px 60px}
.wave .pb{animation:hop 1.4s ease-in-out infinite;transform-origin:50px 90px}
.look .ey{animation:look 3s ease-in-out infinite}
.look .hd{animation:tilthd 3s ease-in-out infinite;transform-origin:50px 86px}
.cheer .pb{animation:jump .9s ease-in-out infinite;transform-origin:50px 90px}
.cheer .hd{animation:tilthd .45s ease-in-out infinite;transform-origin:50px 86px}
.cheer .al{animation:wave .45s ease-in-out infinite;transform-origin:19px 60px}.cheer .ar{animation:wave .45s ease-in-out infinite;transform-origin:81px 60px}
.ride .pb{animation:hop 1.1s ease-in-out infinite;transform-origin:50px 90px}
.ride .sp{animation:ear .6s ease-in-out infinite;transform-origin:50px 26px}
.sk{animation:sparkle 1.2s ease-in-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion:reduce){.sc,.bn,.wh,.du,.bt,.fo,.sp2,.pl,.pr,.tr,.sk,.pb,.fl,.fr,.al,.ar,.hd,.ey,.sp{animation:none!important}}
"""

def panel(title, chip, desc, svg):
    return '<div class="card">%s<div class="cap"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h" style="font-size:20px">%s</div><span class="chip" style="background:#E4ECFF;color:#2F58BC">%s</span></div><div class="d">%s</div></div></div>' % (svg, title, chip, desc)

# ---- car
hills = '<path d="M0 150C60 100 120 110 180 140C240 100 320 110 420 150V190H0Z" fill="#9BD3A0"/>'
car = ('<svg width="100%" viewBox="0 0 420 240" style="display:block" role="img" aria-label="Xe mui trần chạy trên đường">'
       '<defs><linearGradient id="gsky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CC8F0"/><stop offset="1" stop-color="#E3F6FB"/></linearGradient></defs>'
       '<rect width="420" height="240" fill="url(#gsky1)"/>'
       '<g class="sc" style="--s:24s"><g fill="#fff" opacity=".9"><ellipse cx="60" cy="40" rx="30" ry="10"/><ellipse cx="260" cy="60" rx="36" ry="11"/><ellipse cx="480" cy="40" rx="30" ry="10"/><ellipse cx="680" cy="60" rx="36" ry="11"/></g></g>'
       '<g class="sc" style="--s:12s"><path d="M0 150C60 96 120 110 190 140C240 100 320 110 420 150C480 96 540 110 610 140C660 100 740 110 840 150V210H0Z" fill="#9BD3A0"/></g>'
       '<g class="sc" style="--s:5s"><path d="M0 186C70 176 140 192 210 184C280 176 350 192 420 186C490 176 560 192 630 184C700 176 770 192 840 186V240H0Z" fill="#6DBE6A"/></g>'
       '<rect y="184" width="420" height="56" fill="#E5C48A"/><rect y="184" width="420" height="5" fill="#F6E3B4"/>'
       '<g class="sc" style="--s:.8s"><g fill="#fff" opacity=".95"><rect x="0" y="212" width="40" height="5" rx="2.5"/><rect x="84" y="212" width="40" height="5" rx="2.5"/><rect x="168" y="212" width="40" height="5" rx="2.5"/><rect x="252" y="212" width="40" height="5" rx="2.5"/><rect x="336" y="212" width="40" height="5" rx="2.5"/><rect x="420" y="212" width="40" height="5" rx="2.5"/></g></g>'
       '<g class="du" style="--d:0s"><circle cx="124" cy="206" r="8" fill="#F1DDB0"/></g><g class="du" style="--d:-.3s"><circle cx="124" cy="206" r="7" fill="#F1DDB0"/></g><g class="du" style="--d:-.6s"><circle cx="124" cy="206" r="9" fill="#F1DDB0"/></g>'
       '<g class="bn"><ellipse cx="210" cy="222" rx="80" ry="7" fill="#2B2B3A" opacity=".18"/>'
       '<g transform="translate(150 118)"><svg x="52" y="-22" width="70" height="70" viewBox="0 0 100 100" style="overflow:visible">' + pet('ride') + '</svg>'
       '<path d="M0 62C0 50 6 44 16 44H70L100 44C112 44 120 50 120 62V80H0Z" fill="#E8604C"/><path d="M16 44H70L84 30H100L106 44" fill="#E8604C"/><rect x="0" y="62" width="120" height="8" fill="#C94444"/><rect x="104" y="56" width="10" height="8" rx="3" fill="#FFE08A"/><path d="M84 36L90 30L98 30L104 44Z" fill="#BFE3F2"/></g>'
       '<g class="wh"><circle cx="164" cy="204" r="16" fill="#2B2B3A"/><circle cx="164" cy="204" r="7" fill="#CFD6E0"/><path d="M164 196V212M156 204H172" stroke="#8A93A5" stroke-width="2.4"/></g><g class="wh"><circle cx="256" cy="204" r="16" fill="#2B2B3A"/><circle cx="256" cy="204" r="7" fill="#CFD6E0"/><path d="M256 196V212M248 204H264" stroke="#8A93A5" stroke-width="2.4"/></g></g></svg>')
# ---- boat
boat = ('<svg width="100%" viewBox="0 0 420 240" style="display:block" role="img" aria-label="Thuyền lướt trên biển">'
        '<defs><linearGradient id="gsky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD3F2"/><stop offset="1" stop-color="#E3F6FB"/></linearGradient><linearGradient id="gsea2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6CC3EA"/><stop offset="1" stop-color="#3F8FCB"/></linearGradient></defs>'
        '<rect width="420" height="240" fill="url(#gsky2)"/>'
        '<g class="sc" style="--s:30s"><path d="M0 130L40 96L80 130L130 84L180 130L230 100L290 130L350 90L420 130L460 96L500 130L550 84L600 130L650 100L710 130L770 90L840 130V150H0Z" fill="#9FB6D6"/></g>'
        '<rect y="128" width="420" height="112" fill="url(#gsea2)"/>'
        '<g class="sc" style="--s:6s" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"><path d="M10 156q15-8 30 0t30 0M130 168q15-8 30 0t30 0M250 156q15-8 30 0t30 0M370 170q15-8 30 0t30 0M430 156q15-8 30 0t30 0M550 168q15-8 30 0t30 0M670 156q15-8 30 0t30 0M790 170q15-8 30 0t30 0"/></g>'
        '<g class="sc" style="--s:2.4s" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M20 206q20-10 40 0t40 0M200 218q20-10 40 0t40 0M320 204q20-10 40 0t40 0M440 206q20-10 40 0t40 0M620 218q20-10 40 0t40 0M740 204q20-10 40 0t40 0"/></g>'
        '<g class="fo" style="--d:0s"><ellipse cx="150" cy="190" rx="22" ry="7" fill="#fff"/></g><g class="fo" style="--d:-.45s"><ellipse cx="150" cy="190" rx="22" ry="7" fill="#fff"/></g><g class="fo" style="--d:-.9s"><ellipse cx="150" cy="190" rx="22" ry="7" fill="#fff"/></g>'
        '<g class="bt"><g transform="translate(150 96)"><svg x="50" y="-4" width="70" height="70" viewBox="0 0 100 100" style="overflow:visible">' + pet('ride') + '</svg>'
        '<path d="M40 -26V56M40 -26L100 44H40" fill="#fff" stroke="#2B2B3A" stroke-width="2.4" stroke-linejoin="round"/><path d="M-10 56H150L128 94H12Z" fill="#3F6FE0"/><path d="M-4 66H144" stroke="#fff" stroke-width="4"/><rect x="62" y="48" width="44" height="14" rx="7" fill="#FFD66B"/></g>'
        '<g class="sp2" style="--d:0s"><circle cx="286" cy="150" r="3" fill="#fff"/></g><g class="sp2" style="--d:-.3s"><circle cx="292" cy="154" r="2.6" fill="#fff"/></g><g class="sp2" style="--d:-.6s"><circle cx="280" cy="156" r="3" fill="#fff"/></g></g></svg>')
# ---- plane
plane = ('<svg width="100%" viewBox="0 0 420 240" style="display:block" role="img" aria-label="Máy bay bay trên mây">'
         '<defs><linearGradient id="gsky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FA9E6"/><stop offset="1" stop-color="#D5EEFA"/></linearGradient></defs>'
         '<rect width="420" height="240" fill="url(#gsky3)"/>'
         '<g class="sc" style="--s:7s"><g fill="#fff" opacity=".95"><ellipse cx="40" cy="60" rx="40" ry="12"/><ellipse cx="300" cy="190" rx="50" ry="14"/><ellipse cx="460" cy="60" rx="40" ry="12"/><ellipse cx="720" cy="190" rx="50" ry="14"/></g></g>'
         '<g class="sc" style="--s:3.4s"><g fill="#fff" opacity=".7"><ellipse cx="120" cy="120" rx="24" ry="7"/><ellipse cx="380" cy="30" rx="22" ry="6"/><ellipse cx="540" cy="120" rx="24" ry="7"/><ellipse cx="800" cy="30" rx="22" ry="6"/></g></g>'
         '<g class="tr" style="--d:0s"><rect x="150" y="119" width="80" height="4" rx="2" fill="#fff"/></g><g class="tr" style="--d:-.4s"><rect x="150" y="124" width="70" height="3" rx="1.5" fill="#fff"/></g><g class="tr" style="--d:-.8s"><rect x="150" y="116" width="60" height="3" rx="1.5" fill="#fff"/></g>'
         '<g class="pl"><g transform="translate(150 70)"><path d="M10 40L150 20L170 40L150 60Z" fill="#fff" stroke="#2B2B3A" stroke-width="2.4" stroke-linejoin="round"/>'
         '<path d="M70 38L40 6L60 6L100 34ZM70 42L40 78L60 78L100 46Z" fill="#7C9CFF" stroke="#2B2B3A" stroke-width="2" stroke-linejoin="round"/><path d="M10 40L-4 20L14 20L26 36Z" fill="#E8604C" stroke="#2B2B3A" stroke-width="2" stroke-linejoin="round"/>'
         '<ellipse cx="116" cy="36" rx="26" ry="16" fill="#BFE3F2" stroke="#2B2B3A" stroke-width="2"/><svg x="96" y="12" width="44" height="44" viewBox="0 0 100 100" style="overflow:visible">' + pet('ride') + '</svg>'
         '<g class="pr"><ellipse cx="172" cy="40" rx="3" ry="26" fill="#2B2B3A" opacity=".55"/></g></g></g></svg>')

cells = ''
for name, cls, desc, extra in [('Đi bộ', 'walk', 'Nhún theo nhịp 0,6 s, chân đổi bước, tay vung ngược', ''), ('Chạy', 'run', 'Nghiêng về trước, nhịp 0,34 s, bụi bay sau gót', '<g fill="#F1DDB0" opacity=".7"><circle class="du" cx="8" cy="86" r="5"/><circle class="du" style="--d:-.4s" cx="4" cy="88" r="4"/></g>'),
                          ('Nhảy', 'jump', 'Ép xuống → bật cao kéo dài → ép tiếp đất → nảy nhẹ', ''), ('Vẫy tay', 'wave', 'Chào khi tới nơi, tay phải vẫy 0,5 s', ''),
                          ('Nhìn quanh', 'look', 'Mắt đảo trái phải, đầu nghiêng 3 s, tò mò', ''), ('Ăn mừng', 'cheer', 'Nhảy + quay mặt + hai tay giơ, lấp lánh', '<g fill="#FFD66B"><path class="sk" style="--d:0s" d="M8 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path class="sk" style="--d:-.5s" d="M90 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>')]:
    cells += '<div class="card" style="padding:10px 6px 12px;text-align:center"><svg width="100%%" height="136" viewBox="-10 -36 120 142" style="display:block;overflow:visible">%s</svg><div class="h" style="font-size:18px">%s</div><div class="d" style="padding:0 8px">%s</div></div>' % (pet(cls, extra), name, desc)

html = ("""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Kids travel animation</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&family=Baloo+2:wght@700;800&display=swap">
<style>""" + CSS + """</style>
</helmet>
<div class="t" style="width:1360px;height:900px;background:#FBF4E4;padding:28px 40px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap"><h1 class="h" style="font-size:40px;line-height:1">Di chuyển: xe, thuyền, máy bay &amp; dáng đi của thú cưng</h1><span class="chip" style="background:#FFF0CC;color:#7A4A06">Đang chạy thật — chưa áp dụng</span></div>
<div style="font-size:14px;color:#5E5E73;margin-top:-6px">Cảnh cuộn (parallax) để cảm giác tốc độ; xe có trọng lượng (thân nhún, bánh quay, bụi), thuyền chòng chành + bọt nước, máy bay nghiêng + vệt mây + cánh quạt. Thú cưng ngồi trong xe, tai/mầm đung đưa.</div>
<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">""" +
    panel('Xe mui trần', 'đường đất · 0,5 s/nhịp', 'Nền 3 lớp cuộn khác tốc độ, vạch đường chạy nhanh nhất; thân xe nhún theo mặt đường, bụi toả sau bánh.', car) +
    panel('Thuyền buồm', 'biển · chòng chành 2,4 s', 'Sóng 2 lớp cuộn, thuyền nhấp nhô và lắc nhẹ, bọt trắng toả sau đuôi, nước bắn ở mũi.', boat) +
    panel('Máy bay', 'bay xa · nghiêng 3,2 s', 'Mây hai tầng lướt qua, máy bay nghiêng cánh nhẹ, cánh quạt quay mờ, vệt mây dài phía sau.', plane) +
    """</div>
<div class="h" style="font-size:22px">Dáng của thú cưng (Bi, dùng chung quy tắc cho cả 5 nhân vật)</div>
<div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px">""" + cells + """</div>
<div class="card" style="padding:10px 16px;font-size:13px;line-height:1.55"><b>Quy tắc di chuyển:</b> thú cưng luôn ngồi/đi theo đường cong của tuyến (không trượt chân); đổi phương tiện có chuyển cảnh ngắn 0,6 s (xe dừng → thuyền cập bến → bước xuống → lên thuyền); tốc độ đều, tăng/giảm tốc hai đầu, chuyến dài không quá 24 s; tới nơi: vẫy tay rồi nhảy mừng. Giảm chuyển động → camera nhảy thẳng tới nơi, phương tiện đứng yên.</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1360,"height":900}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
""")
open(OUT + '/KidsTravel.dc.html', 'w', encoding='utf-8').write(html)
print(len(html))
