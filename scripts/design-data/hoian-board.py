import sys, random, math
OUT = sys.argv[1]
random.seed(4)
W, H = 1280, 720
CSS = """
body{margin:0}
.t{font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#2B2B3A}
.h{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;margin:0}
@keyframes glow{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,-4px)}}
@keyframes drift{from{transform:translateX(-80px)}to{transform:translateX(1360px)}}
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes shim{0%,100%{transform:translateX(0);opacity:.5}50%{transform:translateX(12px);opacity:.9}}
@keyframes ring{0%{transform:scale(.8);opacity:.9}100%{transform:scale(1.7);opacity:0}}
@keyframes wave{0%,100%{transform:rotate(25deg)}50%{transform:rotate(-70deg)}}
@keyframes hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes row{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(10deg)}}
@keyframes bobb{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-4px) rotate(1.5deg)}}
.gl{animation:glow 2.6s ease-in-out infinite;animation-delay:var(--d,0s)}
.sw{animation:sway 4s ease-in-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:50% 0}
.fl{animation:float 5s ease-in-out infinite;animation-delay:var(--d,0s)}
.cl{animation:drift var(--s,90s) linear infinite;animation-delay:var(--d,0s)}
.st{animation:twinkle 3s ease-in-out infinite;animation-delay:var(--d,0s)}
.sh{animation:shim 4s ease-in-out infinite;animation-delay:var(--d,0s)}
.rg{animation:ring 1.8s ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
.wv{animation:wave .6s ease-in-out infinite;transform-origin:81px 60px}
.hp{animation:hop 1.4s ease-in-out infinite}
.rw{animation:row 1.8s ease-in-out infinite;transform-origin:0 0}
.bb{animation:bobb 3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion:reduce){.gl,.sw,.fl,.cl,.st,.sh,.rg,.wv,.hp,.rw,.bb{animation:none}}
"""

def lantern(x, y, s=1, col='#E8604C', d=0):
    return ('<g transform="translate(%s %s) scale(%s)"><g class="sw" style="--d:-%.1fs"><path d="M0 -14V-6" stroke="#6B3E2E" stroke-width="1.6"/><circle class="gl" style="--d:-%.1fs" r="16" cy="4" fill="%s" opacity=".35"/>'
            '<ellipse cy="4" rx="8" ry="10" fill="%s"/><path d="M-8 4Q0 -2 8 4M-8 4Q0 10 8 4" stroke="#fff" stroke-opacity=".4" fill="none"/><rect x="-4" y="-6" width="8" height="3" rx="1" fill="#6B3E2E"/><rect x="-3" y="13" width="6" height="2" fill="#6B3E2E"/><path d="M0 15V21" stroke="#F6C45A" stroke-width="1.6"/></g></g>') % (x, y, s, d, d, col, col)

def house(x, base, w, h, wall, side=0):
    top = base - h
    roof = '<path d="M%d %d L%d %d L%d %d L%d %d Z" fill="#8A4B2A"/>' % (x - 8, top + 6, x + 6, top - 18, x + w - 6, top - 18, x + w + 8, top + 6)
    tiles = ''.join('<path d="M%d %dq%d 8 %d 0" stroke="#5E301A" stroke-width="1.6" fill="none"/>' % (x - 4 + i * 14, top - 8 + (j * 7), 7, 14) for j in range(2) for i in range(int((w + 8) / 14)))
    body = '<rect x="%d" y="%d" width="%d" height="%d" fill="%s"/>' % (x, top + 6, w, h - 6, wall)
    wins = ''
    for i in range(max(1, w // 50)):
        wx = x + 10 + i * 46
        wins += '<path d="M%d %d v-24 a10 10 0 0 1 20 0 v24z" fill="#3A2430"/><path class="gl" style="--d:-%.1fs" d="M%d %d v-22 a8 8 0 0 1 16 0 v22z" fill="#FFD66B"/><rect x="%d" y="%d" width="4" height="24" fill="#6B3E2E"/><rect x="%d" y="%d" width="4" height="24" fill="#6B3E2E"/>' % (wx, base - 36, random.uniform(0, 3), wx + 2, base - 36, wx - 6, base - 62, wx + 22, base - 62)
    door = '<rect x="%d" y="%d" width="18" height="30" rx="3" fill="#6B3E2E"/>' % (x + w // 2 - 9, base - 30) if w > 70 else ''
    return body + roof + tiles + wins + door

# sky
sky = ('<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3E3A86"/><stop offset=".42" stop-color="#C96D8A"/><stop offset=".62" stop-color="#FFB27A"/><stop offset="1" stop-color="#FFD9A0"/></linearGradient>'
       '<linearGradient id="river" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C7F9C"/><stop offset="1" stop-color="#1F3F5C"/></linearGradient>'
       '<radialGradient id="warm" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD66B" stop-opacity=".8"/><stop offset="1" stop-color="#FFD66B" stop-opacity="0"/></radialGradient>'
       '<linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9B79A"/><stop offset="1" stop-color="#8F7F68"/></linearGradient></defs>'
       '<rect width="1280" height="720" fill="url(#sky)"/>')
stars = ''.join('<circle class="st" style="--d:-%.1fs" cx="%d" cy="%d" r="%.1f" fill="#fff"/>' % (random.uniform(0, 3), random.randint(10, 1270), random.randint(10, 200), random.uniform(.8, 1.8)) for _ in range(46))
moon = '<g transform="translate(1080 100)"><circle r="46" fill="url(#warm)" opacity=".5"/><circle r="26" fill="#FFF3C4"/><circle cx="9" cy="-4" r="22" fill="#6B4E9A" opacity=".0"/></g>'
clouds = ''.join('<g class="cl" style="--s:%ds;--d:-%ds"><g transform="translate(0 %d) scale(%s)" fill="#FFC9B0" opacity=".85"><ellipse rx="60" ry="14"/><ellipse cx="-30" cy="-10" rx="34" ry="14"/><ellipse cx="26" cy="-14" rx="40" ry="16"/></g></g>' % (s, d, y, sc) for s, d, y, sc in [(110, 20, 150, 1.2), (150, 80, 230, 1.6), (130, 50, 90, .9)])
hills = '<path d="M0 330C120 280 220 300 330 320C440 270 540 290 640 320C760 270 880 300 1000 320C1100 290 1200 300 1280 320V420H0Z" fill="#5C4A8C" opacity=".55"/>'
# houses left & right
left = ''; xx = -20
for w, h, wall in [(120, 170, '#F2C94C'), (100, 140, '#F6D77A'), (130, 190, '#EFB84A'), (110, 150, '#F2C94C')]:
    left += house(xx, 470, w, h, wall); xx += w + 4
right = ''; xx = 770
for w, h, wall in [(110, 150, '#F6D77A'), (130, 190, '#F2C94C'), (100, 160, '#EFB84A'), (140, 180, '#F2C94C')]:
    right += house(xx, 470, w, h, wall); xx += w + 4
# lantern strings
strings = ''
for (x1, x2, y) in [(-10, 640, 250), (150, 800, 300), (500, 1290, 260), (0, 520, 360)]:
    n = 9
    strings += '<path d="M%d %d Q%d %d %d %d" fill="none" stroke="#6B3E2E" stroke-width="1.6"/>' % (x1, y, (x1 + x2) / 2, y + 60, x2, y)
    for i in range(n):
        t = (i + .5) / n
        px = x1 + (x2 - x1) * t; py = (1 - t) ** 2 * y + 2 * t * (1 - t) * (y + 60) + t ** 2 * y
        strings += lantern(px, py + 4, .8, random.choice(['#E8604C', '#FFB347', '#F2C94C', '#E8604C', '#FF8FB1']), random.uniform(0, 4))
# river
river = '<rect y="470" width="1280" height="250" fill="url(#river)"/>'
refl = ''.join('<ellipse class="sh" style="--d:-%.1fs" cx="%d" cy="%d" rx="%d" ry="4" fill="#FFD66B"/>' % (random.uniform(0, 4), random.randint(20, 1260), random.randint(490, 700), random.randint(12, 40)) for _ in range(26))
# bridge (covered Japanese bridge)
bridge = ('<g transform="translate(430 470)">'
          '<ellipse cx="170" cy="40" rx="190" ry="8" fill="#000" opacity=".2"/>'
          '<path d="M0 0C40 -52 300 -52 340 0V12H0Z" fill="url(#stone)"/><path d="M60 12C80 -22 260 -22 280 12Z" fill="#1F3F5C"/>'
          '<rect x="22" y="-70" width="296" height="26" fill="#A0522D"/><path d="M8 -70L40 -104H300L332 -70Z" fill="#8A4B2A"/>'
          '<path d="M16 -76q12 8 24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0" stroke="#5E301A" stroke-width="2" fill="none"/>'
          '<g fill="#6B3E2E"><rect x="36" y="-46" width="6" height="40"/><rect x="100" y="-46" width="6" height="40"/><rect x="234" y="-46" width="6" height="40"/><rect x="298" y="-46" width="6" height="40"/></g>'
          '<path d="M42 -44H298" stroke="#6B3E2E" stroke-width="5"/><path d="M42 -26H298" stroke="#6B3E2E" stroke-width="3"/>'
          '<g class="gl"><circle cx="170" cy="-32" r="22" fill="url(#warm)"/></g></g>')
bridge_r = '<g opacity=".3" transform="translate(430 620) scale(1 -.5)"><rect x="22" y="-70" width="296" height="26" fill="#FFB27A"/></g>'
# boats
def boat(x, y, s, col):
    return ('<g transform="translate(%s %s) scale(%s)"><g class="bb"><path d="M-70 0Q0 22 70 0L56 -12H-56Z" fill="%s"/><path d="M-56 -12H56" stroke="#fff" stroke-width="3"/>'
            '<g transform="translate(-6 -12)"><path d="M0 0V-20" stroke="#6B3E2E" stroke-width="3"/><g class="gl"><circle cy="-30" r="20" fill="url(#warm)"/></g><ellipse cy="-30" rx="9" ry="11" fill="#E8604C"/></g>'
            '<g class="rw" transform="translate(30 -10)"><path d="M0 0L36 28" stroke="#6B3E2E" stroke-width="3" stroke-linecap="round"/></g></g></g>') % (x, y, s, col)
boats = boat(180, 590, 1.1, '#3F6FE0') + boat(900, 640, 1.3, '#E8604C')
floaters = ''.join('<g class="fl" style="--d:-%.1fs"><g transform="translate(%d %d)"><ellipse cx="0" cy="3" rx="11" ry="4" fill="#fff" opacity=".35"/><path d="M-9 0Q0 10 9 0L6 -4H-6Z" fill="#FF8FB1"/><path d="M0 -4Q-3 -9 0 -13Q3 -9 0 -4Z" fill="#FFD66B" class="gl"/></g></g>' % (random.uniform(0, 4), x, y) for x, y in [(620, 560), (700, 600), (560, 640), (780, 690), (330, 680), (1100, 560)])
# stall
stall = ('<g transform="translate(1010 520)"><rect x="-70" y="-10" width="140" height="60" rx="6" fill="#8A4B2A"/><path d="M-84 -10L-60 -60H60L84 -10Z" fill="#E8604C"/><path d="M-84 -10q14 14 28 0t28 0t28 0t28 0t28 0" fill="#fff" opacity=".6"/>'
         + ''.join(lantern(x, -4, 1.0, c, i) for i, (x, c) in enumerate([(-44, '#E8604C'), (-14, '#FFB347'), (16, '#FF8FB1'), (46, '#F2C94C')])) + '</g>')
# pet
pet = ('<g transform="translate(40 372)"><ellipse cx="50" cy="94" rx="36" ry="7" fill="#000" opacity=".25"/><g class="hp"><svg x="0" y="0" width="110" height="110" viewBox="0 0 100 100" style="overflow:visible">'
       '<ellipse cx="36" cy="84" rx="9" ry="5.5" fill="#5FB8A8"/><ellipse cx="64" cy="84" rx="9" ry="5.5" fill="#5FB8A8"/><ellipse cx="19" cy="60" rx="7.5" ry="5" fill="#7FD6C6" transform="rotate(-25 19 60)"/><g class="wv"><ellipse cx="81" cy="60" rx="7.5" ry="5" fill="#7FD6C6" transform="rotate(25 81 60)"/></g>'
       '<path d="M50 22C28 22 18 40 18 58C18 74 32 86 50 86C68 86 82 74 82 58C82 40 72 22 50 22Z" fill="#7FD6C6"/><ellipse cx="50" cy="70" rx="20" ry="14" fill="#D5F4ED"/><ellipse cx="28" cy="34" rx="6" ry="7" fill="#7FD6C6" transform="rotate(-24 28 34)"/><ellipse cx="72" cy="34" rx="6" ry="7" fill="#7FD6C6" transform="rotate(24 72 34)"/>'
       '<path d="M50 24C48 14 56 10 62 15C60 20 56 24 50 24Z" fill="#4CAF6A"/><path d="M50 24C52 14 44 10 38 15C40 20 44 24 50 24Z" fill="#5BC46E"/>'
       '<ellipse cx="38" cy="54" rx="5" ry="7" fill="#2B2B3A"/><circle cx="36.5" cy="51" r="2.2" fill="#fff"/><ellipse cx="62" cy="54" rx="5" ry="7" fill="#2B2B3A"/><circle cx="60.5" cy="51" r="2.2" fill="#fff"/>'
       '<ellipse cx="26" cy="64" rx="5.5" ry="3" fill="#FF9FB0" opacity=".75"/><ellipse cx="74" cy="64" rx="5.5" ry="3" fill="#FF9FB0" opacity=".75"/><path d="M44 66q6 5 12 0" stroke="#2B2B3A" stroke-width="2" fill="none" stroke-linecap="round"/></svg></g></g>')
# hotspots
def hot(x, y, n, label, state):
    col = {'done': '#2F8F52', 'cur': '#FFB300', 'todo': '#3F6FE0', 'lock': '#9AA3B2'}[state]
    ico = '<path d="M-8 0l5 5 11-11" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' if state == 'done' else '<text y="7" style="font:800 20px Baloo 2;fill:#fff;text-anchor:middle">%d</text>' % n
    ring = '<circle r="30" fill="none" stroke="#FFD66B" stroke-width="5" class="rg"/><circle r="30" fill="none" stroke="#FFD66B" stroke-width="5" class="rg" style="--d:-.9s"/>' if state == 'cur' else ''
    return '<g transform="translate(%d %d)">%s<circle r="28" fill="%s" stroke="#fff" stroke-width="5"/>%s<g transform="translate(0 46)"><rect x="-62" y="-14" width="124" height="28" rx="14" fill="#fff" stroke="#2B2B3A" stroke-width="2.5"/><text y="6" style="font:800 14px Baloo 2;fill:#2B2B3A;text-anchor:middle">%s</text></g></g>' % (x, y, ring, col, ico, label)
hots = hot(1010, 440, 1, 'Làm quen', 'done') + hot(180, 548, 2, 'Chạm hình', 'cur') + hot(600, 380, 3, 'Chơi ghép', 'todo') + hot(930, 590, 4, 'Nói theo', 'lock') + hot(560, 620, 5, 'Nghe câu', 'lock')
hud = ('<g transform="translate(24 24)"><circle cx="28" cy="28" r="28" fill="#fff" stroke="#2B2B3A" stroke-width="3.5"/><path d="M34 16L20 28L34 40" stroke="#2B2B3A" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>'
       '<g transform="translate(640 26)"><rect x="-190" width="380" height="64" rx="32" fill="#fff" stroke="#2B2B3A" stroke-width="3.5"/><text y="30" style="font:800 28px Baloo 2;fill:#2B2B3A;text-anchor:middle">Hội An</text><text y="52" style="font:500 13px Be Vietnam Pro;fill:#5E5E73;text-anchor:middle">Đà Nẵng · Phố cổ đèn lồng</text></g>'
       '<g transform="translate(1040 24)"><rect width="216" height="56" rx="28" fill="#fff" stroke="#2B2B3A" stroke-width="3.5"/><path d="M34 12a14 14 0 1 0 0 32a11 11 0 0 1 0-32z" fill="#FFD66B" transform="translate(-6 0)"/><text x="52" y="25" style="font:800 16px Baloo 2;fill:#2B2B3A">18:20 · Trời quang</text><text x="52" y="43" style="font:500 11px Be Vietnam Pro;fill:#5E5E73">Hoàng hôn · đèn lồng sáng</text></g>'
       '<g transform="translate(24 660)"><rect width="250" height="40" rx="20" fill="#fff" stroke="#2B2B3A" stroke-width="3"/><g fill="#E8B22E" stroke="#2B2B3A" stroke-width="1.6"><path transform="translate(12 6) scale(1.1)" d="M12 2l3 6.3 7 1-5 4.9 1.2 7L12 17.8 5.8 21.2 7 14.2 2 9.3l7-1z"/></g><text x="48" y="26" style="font:800 16px Baloo 2;fill:#2B2B3A">1/5 điểm chạm · 6 từ mới</text></g>')
html = ("""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Kids landmark Hoi An</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&family=Baloo+2:wght@700;800&display=swap">
<style>""" + CSS + """</style>
</helmet>
<div class="t" style="width:1280px;height:720px;position:relative;overflow:hidden"><svg width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="Phố cổ Hội An lúc hoàng hôn, năm điểm chạm để học">""" +
    sky + stars + moon + clouds + hills + left + right + river + refl + bridge_r + bridge + boats + floaters + strings + stall + pet + hots + hud +
    """</svg></div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1280,"height":720}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
""")
open(OUT + '/KidsLandmark.dc.html', 'w', encoding='utf-8').write(html)
print(len(html))
