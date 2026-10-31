# Mẫu duyệt vòng sau: R5World (KidsWorld kiểu Làng chữ), R6Cards (thẻ từ chân thật), R7Mascot (trạng thái mascot).
# python gen_review2.py <project> <vn_merged.json>
import importlib.util, json, math, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__))
proj, vnjson = sys.argv[1], sys.argv[2]
sp = importlib.util.spec_from_file_location('gen_village3', os.path.join(HERE, 'gen_village3.py'))
V = importlib.util.module_from_spec(sp); sp.loader.exec_module(V)
Rr = random.Random(5)
K = '#3A2413'

# ---------- R5World: bản đồ Việt Nam + địa danh cùng nét vẽ trang chủ ----------
def lm_hoian(x, y):
    o = '<g transform="translate(%d %d) scale(.85)"><ellipse cy="14" rx="72" ry="12" fill="#0B6E88" opacity=".35"/><path d="M-66 12Q0 -30 66 12V24H-66Z" fill="#D9B985" stroke="%s" stroke-width="1.6"/><path d="M-22 24A22 18 0 0 1 22 24Z" fill="#0E93A6"/>' % (x, y, K)
    o += '<path d="M-50 2Q0 -30 50 2V-30Q0 -60 -50 -30Z" fill="#8F2F24" stroke="%s" stroke-width="1.4"/>' % K
    for i in range(-3, 4): o += '<rect x="%d" y="%d" width="5" height="26" fill="#6B3E1E"/>' % (i * 13 - 2, -34 + abs(i) * 5)
    o += V.roofv(0, -38, 118, 30, '#B5613C', '#6E3522', curl=7)
    for i in (-40, -14, 14, 40): o += V.lantern(i, -34, .7)
    return o + '</g>'

def lm_hanoi(x, y):
    o = '<g transform="translate(%d %d)"><ellipse cy="6" rx="62" ry="24" fill="#E9D49A"/><ellipse cy="5" rx="56" ry="20" fill="url(#riv)" stroke="#0E93A6"/><ellipse cy="4" rx="20" ry="7" fill="#7FCB6A" stroke="%s"/>' % (x, y, K)
    for w, y0, h in [(26, -14, 16), (20, -28, 13), (14, -40, 11)]: o += '<rect x="%d" y="%d" width="%d" height="%d" fill="#E8DCC0" stroke="%s"/><path d="M-3 %dh6v%dh-6Z" fill="#6B4322"/>' % (-w / 2, y0, w, h, K, y0 + 4, h - 4)
    o += V.roofv(0, -40, 26, 10, '#6E6854', '#3A382E', curl=3) + V.tree(-40, 4, .3)
    return o + '</g>'

def lm_halong(x, y):
    o = '<g transform="translate(%d %d)">' % (x, y)
    for dx, h, w in [(-52, 56, 34), (-16, 86, 42), (30, 66, 36), (60, 40, 26)]:
        o += '<path d="M%d 10C%d %d %d %d %d %d C%d %d %d %d %d 10Z" fill="url(#kar2)" stroke="%s" stroke-width="1.4"/><path d="M%d %dQ%d %d %d 8" stroke="#117F72" stroke-width="2" fill="none"/><ellipse cx="%d" cy="%d" rx="%d" ry="6" fill="#3CCB6B"/>' % (dx - w / 2, dx - w / 2, -h * .7, dx - 6, -h, dx, -h, dx + 8, -h, dx + w / 2, -h * .6, dx + w / 2, K, dx, -h + 6, dx - 4, -h / 2, dx + 3, dx, -h + 3, w * .3)
    return o + V.sampan(-6, 18, .36) + '</g>'

def lm_sapa(x, y):
    o = '<g transform="translate(%d %d)"><path d="M-80 16C-50 -40 -20 -70 6 -76C40 -70 66 -30 84 16Z" fill="url(#hill2)" stroke="#0B7A52"/>' % (x, y)
    for k in range(6): o += '<path d="M%d %dQ0 %d %d %d" stroke="%s" stroke-width="6" fill="none"/><path d="M%d %dQ0 %d %d %d" stroke="#FFF7C2" stroke-width="1" fill="none"/>' % (-72 + k * 11, 8 - k * 12, -2 - k * 13, 74 - k * 11, 8 - k * 12, ['#C7EB6A', '#7FE3E0', '#9BE564'][k % 3], -72 + k * 11, 4 - k * 12, -6 - k * 13, 74 - k * 11, 4 - k * 12)
    return o + '<g transform="translate(40 4) scale(.34)">' + V.thatch(0, 0, 90, 40) + '<rect x="-34" y="0" width="68" height="20" fill="#C99A62"/></g></g>'

def r5():
    m = json.load(open(vnjson, encoding='utf-8'))
    S, ox, oy = .66, 300, 26
    P = lambda n: (m['lm'][n]['xy'][0] * S + ox, m['lm'][n]['xy'][1] * S + oy)
    o = '<rect width="1280" height="720" fill="url(#riv)"/>'
    for _ in range(120):
        x, y, w = Rr.randint(0, 1280), Rr.randint(0, 720), Rr.choice([18, 24, 30])
        o += '<path d="M%d %dq%.1f -7 %.1f 0q%.1f -7 %.1f 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>' % (x, y, w / 4, w / 2, w / 4, w / 2)
    o += '<g transform="translate(%d %d) scale(%.2f)">' % (ox, oy, S)
    land = ''.join(v['d'] for v in m['prov'].values())
    o += '<path d="%s" fill="#F2DDA6" stroke="#F2DDA6" stroke-width="14" stroke-linejoin="round"/>' % land
    o += ''.join('<path d="%s" fill="%s" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>' % (v['d'], ['url(#hill1)', 'url(#hill2)', 'url(#hill3)'][i % 3]) for i, v in enumerate(m['prov'].values()))
    o += '</g>'
    names = ['Sa Pa', 'Hà Nội', 'Hạ Long', 'Tràng An', 'Huế', 'Đà Nẵng', 'Hội An', 'Nha Trang', 'Đà Lạt', 'Sài Gòn', 'Cần Thơ', 'Phú Quốc']
    pts = [P(n) for n in names]
    o += V.network(['M' + ' L'.join('%.0f %.0f' % p for p in pts[:2] + [pts[3], pts[4], pts[6], pts[7], pts[8], pts[9], pts[10]])])
    for n in ('Tràng An', 'Huế', 'Đà Nẵng', 'Nha Trang', 'Đà Lạt', 'Sài Gòn', 'Cần Thơ', 'Phú Quốc'):
        x, y = P(n); o += '<circle cx="%d" cy="%d" r="8" fill="#F7B91A" stroke="#6B3E1E" stroke-width="2"/>' % (x, y)
    x, y = P('Sa Pa'); o += lm_sapa(x - 40, y + 24) + V.label(x - 110, y + 52, 'Sa Pa')
    x, y = P('Hà Nội'); o += lm_hanoi(x + 6, y + 14) + V.label(x - 20, y + 52, 'Hà Nội')
    x, y = P('Hạ Long'); o += lm_halong(x + 96, y + 8) + V.label(x + 96, y + 44, 'Hạ Long')
    x, y = P('Hội An'); o += lm_hoian(x + 92, y + 8) + V.label(x + 92, y + 48, 'Hội An', hot=True)
    o += V.kitsu(x + 16, y + 6, 70, 'ehappy', 'walk')
    o += V.flock(70, 60, 12, .45) + V.driftcloud(70, .8, 110, 30, True)
    card = ('<div class="abs" style="right:28px;bottom:28px;width:330px;background:#FFF9EA;border:3px solid #F7B91A;border-radius:20px;padding:18px 20px"><div class="t1" style="font-size:30px">Hội An</div><div style="margin:4px 0 14px;font-weight:500">Phố đèn lồng, 10 từ, đã xong 4</div><button class="go" style="width:100%;justify-content:center">Vào Hội An</button></div>')
    hud = '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về làng</span><span class="pill">Tầng 1 Việt Nam</span><span class="pill">46 sao</span></div>'
    V.write('R5World', 'Kids World kiểu Làng chữ', 1280, 720, '<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="Bản đồ Việt Nam cho bé"><defs>' + V.DEFS + '</defs>' + o + '<rect width="1280" height="720" filter="url(#grain)" opacity=".35"/></svg>' + hud + card + '</div>')

# ---------- R6Cards: thẻ từ chân thật ----------
def hairs(n, cx, cy, rx, ry, flow, cols, L=(10, 22)):
    d = {c: '' for c in cols}
    for _ in range(n):
        a, r = Rr.random() * 6.283, math.sqrt(Rr.random())
        x, y = cx + math.cos(a) * r * rx, cy + math.sin(a) * r * ry
        t = flow(x, y) + Rr.uniform(-.25, .25); l = Rr.uniform(*L)
        d[Rr.choice(cols)] += 'M%.0f %.0fl%.1f %.1f' % (x, y, math.cos(t) * l, math.sin(t) * l)
    return ''.join('<path d="%s" stroke="%s" stroke-width="2" stroke-linecap="round" fill="none"/>' % (v, c) for c, v in d.items())

def dog():
    G = ['#E2AE66', '#F2CC8E', '#C98A3E', '#F8E2B6']
    o = '<defs><radialGradient id="dg" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#F8DDA6"/><stop offset=".7" stop-color="#E2AE66"/><stop offset="1" stop-color="#B9792E"/></radialGradient><radialGradient id="dn" cx=".4" cy=".3"><stop offset="0" stop-color="#5A4038"/><stop offset="1" stop-color="#1E1414"/></radialGradient></defs>'
    o += '<ellipse cx="200" cy="372" rx="130" ry="16" fill="#3A2413" opacity=".2"/>'
    o += '<path d="M104 370C80 300 104 214 200 206C296 214 320 300 296 370Z" fill="url(#dg)"/><path d="M298 340Q350 330 352 270Q330 300 290 300Z" fill="#E2AE66"/>'
    o += hairs(900, 200, 290, 92, 80, lambda x, y: math.atan2(y - 150, x - 200), G)
    for x in (156, 244): o += '<path d="M%d 262C%d 310 %d 340 %d 366Q%d 382 %d 366C%d 340 %d 310 %d 262Z" fill="url(#dg)"/>' % (x - 26, x - 28, x - 30, x - 32, x, x + 32, x + 30, x + 28, x + 26) + hairs(220, x, 320, 24, 50, lambda a, b: 1.57, G, (8, 16))
    for x in (136, 168, 232, 264): pass
    for x in (156, 244):
        for k in (-14, 0, 14): o += '<path d="M%d 362v14" stroke="#8A5A28" stroke-width="2.4" stroke-linecap="round"/>' % (x + k)
    o += hairs(260, 200, 236, 44, 40, lambda x, y: 1.57, ['#F8E2B6', '#FBEFD8'], (12, 26))
    o += '<path d="M200 44C280 44 322 96 318 156C314 214 262 256 200 256C138 256 86 214 82 156C78 96 120 44 200 44Z" fill="url(#dg)"/>'
    o += hairs(1000, 200, 150, 112, 100, lambda x, y: math.atan2(y - 170, x - 200), G)
    for sg in (-1, 1):
        o += '<path d="M%d 74C%d 60 %d 96 %d 190C%d 224 %d 214 %d 180C%d 140 %d 100 %d 74Z" fill="#B9792E"/>' % (200 + sg * 72, 200 + sg * 136, 200 + sg * 156, 200 + sg * 148, 200 + sg * 128, 200 + sg * 104, 200 + sg * 98, 200 + sg * 92, 200 + sg * 82, 200 + sg * 72)
        o += hairs(220, 200 + sg * 124, 136, 22, 62, lambda a, b: 1.57, ['#9A6226', '#C98A3E', '#7E4E1C'], (12, 24))
        o += '<ellipse cx="%d" cy="136" rx="20" ry="22" fill="#2A1A14"/><circle cx="%d" cy="130" r="14" fill="#5A3418"/><circle cx="%d" cy="130" r="9" fill="#120A08"/><circle cx="%d" cy="125" r="4.6" fill="#fff"/><circle cx="%d" cy="135" r="2" fill="#fff"/>' % (200 + sg * 56, 200 + sg * 56, 200 + sg * 56, 200 + sg * 56 - 4, 200 + sg * 56 + 4)
    o += '<ellipse cx="200" cy="190" rx="62" ry="46" fill="#F8E6C2"/>' + hairs(300, 200, 186, 58, 42, lambda x, y: math.atan2(y - 170, x - 200), ['#FBEFD8', '#F2DDB0'], (6, 12))
    o += '<path d="M178 158Q200 146 222 158Q226 178 200 186Q174 178 178 158Z" fill="url(#dn)"/><ellipse cx="192" cy="160" rx="8" ry="4" fill="#fff" opacity=".5"/><path d="M200 186V204" stroke="#3A2413" stroke-width="3"/><path d="M158 204Q180 224 200 204Q220 224 242 204" stroke="#3A2413" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M182 214Q200 256 218 214Q200 222 182 214Z" fill="#E86A7A" stroke="#B23A52" stroke-width="1.5"/><path d="M200 218v22" stroke="#B23A52" stroke-width="1.5"/>'
    return o

def apple():
    o = '<defs><radialGradient id="ap" cx=".34" cy=".3" r=".85"><stop offset="0" stop-color="#FF8A70"/><stop offset=".42" stop-color="#E02E2E"/><stop offset="1" stop-color="#7A0E18"/></radialGradient><linearGradient id="lf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9BE564"/><stop offset="1" stop-color="#1F8A4E"/></linearGradient></defs><ellipse cx="200" cy="356" rx="118" ry="16" fill="#3A2413" opacity=".22"/>'
    o += '<path d="M200 112C160 76 66 92 62 200C60 280 120 360 170 356C186 354 192 346 200 346C208 346 214 354 230 356C280 360 340 280 338 200C334 92 240 76 200 112Z" fill="url(#ap)"/>'
    for k in range(26):
        x = 80 + k * 9.5; o += '<path d="M%d 130Q%d 230 %d 340" stroke="#FFD27A" stroke-width="1.5" fill="none" opacity=".22"/>' % (x + Rr.randint(-4, 4), x + (x - 200) * .16, 200 + (x - 200) * .6)
    o += '<ellipse cx="128" cy="172" rx="26" ry="46" fill="#fff" opacity=".55" transform="rotate(20 128 172)"/><path d="M168 118Q200 138 232 118Q200 128 168 118Z" fill="#5A0E14"/><path d="M200 126C198 96 204 74 218 54" stroke="#6B3E1E" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M212 84C240 46 296 50 316 72C288 108 240 112 212 84Z" fill="url(#lf)" stroke="#0B7A52" stroke-width="2"/><path d="M214 84Q262 72 314 72" stroke="#0B7A52" stroke-width="2" fill="none"/>'
    return o

def card(svg, word, vi):
    return '<div style="width:400px;background:#FFF9EA;border:4px solid #6B3E1E;border-radius:24px;box-shadow:0 8px 0 #6B3E1E;padding:12px;text-align:center"><svg width="370" height="370" viewBox="0 0 400 400" role="img" aria-label="%s">%s</svg><div class="t1" style="font-size:44px;color:#D32F2F">%s</div><div style="font-size:18px;font-weight:600">%s</div></div>' % (word, svg, word, vi)

def r6():
    boat = '<defs></defs><ellipse cx="200" cy="300" rx="190" ry="26" fill="#16BFC8"/>' + V.sampan(200, 270, 1.75)
    body = ('<div class="v" style="width:1400px;height:640px;padding:32px 48px"><div class="t1" style="font-size:32px;margin-bottom:24px">Thẻ từ chân thật: mẫu duyệt</div><div style="display:flex;gap:32px;justify-content:center">' + card(dog(), 'dog', 'con chó') + card(apple(), 'apple', 'quả táo') + card(boat, 'boat', 'con thuyền') + '</div></div>')
    V.write('R6Cards', 'Thẻ từ chân thật', 1400, 640, body)

# ---------- R7Mascot: trạng thái ----------
CSS = """
<style>
@keyframes m-breath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,.975)}}
@keyframes m-jump{0%,100%{transform:translateY(0) scale(1.06,.92)}20%{transform:translateY(0) scale(.96,1.05)}50%{transform:translateY(-34px) scale(.98,1.02)}80%{transform:translateY(0) scale(1.05,.94)}}
@keyframes m-walk{0%,100%{transform:translateY(0) rotate(-3deg)}25%{transform:translateY(-7px) rotate(0)}50%{transform:translateY(0) rotate(3deg)}75%{transform:translateY(-7px) rotate(0)}}
@keyframes m-nod{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg) translateY(4px)}}
@keyframes m-zz{0%{transform:translate(0,0) scale(.6);opacity:0}30%{opacity:1}100%{transform:translate(22px,-46px) scale(1.2);opacity:0}}
@keyframes m-up{0%{transform:translateY(10px);opacity:0}30%{opacity:1}100%{transform:translateY(-58px);opacity:0}}
@keyframes m-page{0%,100%{transform:rotateY(0)}50%{transform:rotateY(60deg)}}
@keyframes m-dust{0%{transform:scale(.4);opacity:.7}100%{transform:scale(1.4) translateX(-22px);opacity:0}}
.mb{animation:m-breath 3.2s ease-in-out infinite;transform-origin:80px 146px}
.mj{animation:m-jump 1.1s ease-in-out infinite;transform-origin:80px 146px}
.mw{animation:m-walk .8s ease-in-out infinite;transform-origin:80px 146px}
.mn{animation:m-nod 3.6s ease-in-out infinite;transform-origin:80px 130px}
.mz{animation:m-zz 3s ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box}
.mu{animation:m-up 1.8s ease-out infinite;animation-delay:var(--d,0s)}
.mp{animation:m-page 2.4s ease-in-out infinite;transform-origin:80px 110px}
.md{animation:m-dust .8s ease-out infinite;animation-delay:var(--d,0s);transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion:reduce){.mb,.mj,.mw,.mn,.mz,.mu,.mp,.md{animation:none}}
</style>"""
def fox(cls, face, extra=''):
    return '<g class="%s"><g transform="translate(80 143) scale(.9) translate(-80 -143)"><use href="#tails3"/><use href="#fbody"/><use href="#%s"/><use href="#kbib"/></g>%s</g>' % (cls, face, extra)

def cell(svg, name, note):
    return '<div style="width:300px;background:#FFF9EA;border:3px solid #E7C98E;border-radius:20px;padding:10px;text-align:center"><svg width="270" height="190" viewBox="-30 -50 220 210">%s</svg><div class="t1" style="font-size:22px">%s</div><div style="font-size:13px;font-weight:500">%s</div></div>' % (svg, name, note)

def r7():
    grd = '<ellipse cx="80" cy="150" rx="66" ry="9" fill="#7EDB62"/><path d="M26 150l-3 -8M40 154l0 -8M120 152l3 -8" stroke="#0E8A58" stroke-width="2"/>'
    heart = lambda x, d: '<path class="mu" style="--d:-%.1fs" d="M%d 10c-5 -9 -16 -3 -11 6l11 11l11 -11c5 -9 -6 -15 -11 -6Z" fill="#E8604C"/>' % (d, x)
    z = lambda x, y, d: '<text class="mz" style="--d:-%.1fs" x="%d" y="%d" font-family="Be Vietnam Pro" font-weight="800" font-size="22" fill="#6B3E1E">z</text>' % (d, x, y)
    book = '<g class="mp"><path d="M50 118Q80 108 80 122Q80 108 110 118V146Q80 136 80 150Q80 136 50 146Z" fill="#fff" stroke="#6B3E1E" stroke-width="2"/></g>'
    dust = ''.join('<circle class="md" style="--d:-%.1fs" cx="%d" cy="146" r="7" fill="#E9C68A"/>' % (d, x) for x, d in [(30, 0), (14, .3)])
    cells = [cell(grd + fox('mb', 'eopen'), 'Đứng chơi', 'Thở, chớp mắt, đuôi đưa'),
             cell(grd + dust + fox('mw', 'eopen'), 'Đi trên đường', 'Nhún theo bước, bụi sau chân'),
             cell(grd + fox('mj', 'ehappy') + heart(36, 0) + heart(130, .7), 'Vui nhảy', 'Nén, bật, chạm đất nén lại'),
             cell(grd + fox('mn', 'eclosed') + z(120, 30, 0) + z(136, 10, 1.2), 'Ngủ gật', 'Đầu gật, chữ z bay'),
             cell(grd + fox('mb', 'eopen', book), 'Đọc bài', 'Lật trang khi bé đang học'),
             cell(grd + fox('mj', 'esurp') + heart(80, .3), 'Ngạc nhiên', 'Tai dựng, nhảy nhẹ')]
    full = 'Bộ đầy đủ đề xuất, 16 trạng thái cho mỗi con: đứng, đi, chạy, nhảy, ngồi, ngủ, ăn, uống, đọc, nghe, nói theo, chào, vui, buồn nhẹ, ngạc nhiên, lên cấp. Trên xe, thuyền, máy bay thêm 3 dáng ngồi.'
    body = (CSS + '<div class="v" style="width:1040px;height:720px;padding:24px 32px"><div class="t1" style="font-size:30px;margin-bottom:6px">Mascot: mẫu hoạt ảnh Kitsu</div><div style="font-size:14px;margin-bottom:14px">' + full + '</div><div style="display:grid;grid-template-columns:repeat(3,300px);gap:14px 28px">' + ''.join(cells) + '</div></div>')
    V.write('R7Mascot', 'Mascot hoạt ảnh mẫu', 1040, 720, body)

# ---------- Lượt 2: địa điểm nhỏ trên bản đồ, tới nơi mới chuyển cảnh; thẻ từ gọn cùng theme ----------
def r5b():
    m = json.load(open(vnjson, encoding='utf-8'))
    S, ox, oy = .68, 300, 16
    P = lambda n: (m['lm'][n]['xy'][0] * S + ox, m['lm'][n]['xy'][1] * S + oy)
    o = '<rect width="1280" height="720" fill="url(#riv)"/>'
    for _ in range(110):
        x, y, w = Rr.randint(0, 1280), Rr.randint(0, 720), Rr.choice([18, 24, 30])
        o += '<path d="M%d %dq%.1f -7 %.1f 0q%.1f -7 %.1f 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>' % (x, y, w / 4, w / 2, w / 4, w / 2)
    o += '<g transform="translate(%d %d) scale(%.2f)">' % (ox, oy, S)
    o += '<path d="%s" fill="#F2DDA6" stroke="#F2DDA6" stroke-width="14" stroke-linejoin="round"/>' % ''.join(v['d'] for v in m['prov'].values())
    o += ''.join('<path d="%s" fill="%s" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>' % (v['d'], ['url(#hill1)', 'url(#hill2)', 'url(#hill3)'][i % 3]) for i, v in enumerate(m['prov'].values())) + '</g>'
    side = {'Sa Pa': -1, 'Hà Nội': -1, 'Hạ Long': 1, 'Tràng An': -1, 'Huế': -1, 'Đà Nẵng': 1, 'Hội An': 1, 'Nha Trang': 1, 'Đà Lạt': -1, 'Sài Gòn': 1, 'Cần Thơ': -1, 'Phú Quốc': -1}
    names = list(side)
    o += V.network(['M' + ' L'.join('%.0f %.0f' % P(n) for n in names[:2] + ['Tràng An', 'Huế', 'Đà Nẵng', 'Hội An', 'Nha Trang', 'Đà Lạt', 'Sài Gòn', 'Cần Thơ'])])
    gap = {'Phú Quốc': -26, 'Cần Thơ': 22, 'Hà Nội': 0, 'Huế': -10, 'Đà Nẵng': -12, 'Hội An': 14, 'Nha Trang': -6, 'Đà Lạt': 6}
    for i, n in enumerate(names):
        x, y = P(n); hot = n == 'Hội An'; done = i < 4
        lx = x + side[n] * (40 + len(n) * 5); ly = y + gap.get(n, 0)
        o += '<path d="M%d %dL%d %d" stroke="#6B3E1E" stroke-width="1.6"/>' % (x, y, lx, ly)
        o += '<g class="%s"><circle cx="%d" cy="%d" r="%d" fill="%s" stroke="#FFF9EA" stroke-width="3"/></g>' % ('tw' if False else '', x, y, 10 if hot else 8, '#D32F2F' if hot else '#0B7A52' if done else '#F7B91A')
        o += V.label(lx, ly, n, hot=hot)
    x, y = P('Hội An')
    o += V.kitsu(x - 4, y - 4, 58, 'ehappy', 'walk') + V.flock(70, 60, 12, .45) + V.driftcloud(70, .8, 110, 30, False)
    card = '<div class="abs" style="right:28px;bottom:28px;width:330px;background:#FFF9EA;border:3px solid #F7B91A;border-radius:20px;padding:18px 20px"><div class="t1" style="font-size:30px">Hội An</div><div style="margin:4px 0 14px;font-weight:500">Phố đèn lồng, 10 từ, đã xong 4</div><button class="go" style="width:100%;justify-content:center">Vào Hội An</button></div>'
    hud = '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về làng</span><span class="pill">Tầng 1 Việt Nam</span><span class="pill">46 sao</span></div>'
    V.write('R5World', 'Kids World, bản đồ điểm nhỏ', 1280, 720, '<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="Bản đồ Việt Nam cho bé"><defs>' + V.DEFS + '</defs>' + o + '<rect width="1280" height="720" filter="url(#grain)" opacity=".35"/></svg>' + hud + card + '</div>')

def house(x, y, w, c='#F2C54B'):
    o = '<rect x="%d" y="%d" width="%d" height="84" fill="%s" stroke="#3A2413" stroke-width="1.6"/><rect x="%d" y="%d" width="%d" height="20" fill="url(#es)"/>' % (x - w / 2, y - 84, w, c, x - w / 2, y - 84, w)
    o += '<rect x="%d" y="%d" width="34" height="52" fill="#4E2616" stroke="#3A2413"/><rect x="%d" y="%d" width="26" height="26" fill="#FFD77A" stroke="#6B3E1E"/><path d="M%d %dh-13M%d %dv26" stroke="#6B3E1E"/>' % (x - w * .3, y - 52, x + w * .1, y - 66, x + w * .1 + 26, y - 53, x + w * .1 + 13, y - 66)
    return o + V.roofv(x, y - 84, w + 26, 44, '#B5613C', '#6E3522', curl=6) + V.lantern(x - w * .34, y - 84, 1) + V.lantern(x + w * .3, y - 84, 1)

def bubble(x, y, t, done=False):
    return '<g class="next" style="animation-delay:-%.1fs">' % (x % 7 * .2) + V.label(x, y, t, hot=not done) + '</g><circle cx="%d" cy="%d" r="6" fill="%s" stroke="#FFF9EA" stroke-width="2.5"/>' % (x, y + 24, '#0B7A52' if done else '#D32F2F')

def r5c():
    o = V._base(1280, 1040)
    o += '<g transform="translate(800 0)"><path d="M-30 280C0 130 40 96 80 180C100 100 150 56 196 170C230 120 262 130 300 214L330 290H-30Z" fill="url(#kar)"/></g><path d="M-10 262C300 210 700 268 1290 226V400H-10Z" fill="url(#hill1)"/>'
    for x, w, c in [(110, 150, '#F2C54B'), (280, 130, '#EEB23C'), (900, 140, '#F6D478'), (1060, 130, '#F2C54B'), (1210, 120, '#EEB23C')]: o += house(x, 410, w, c)
    o += V.tree(420, 400, .7) + V.cau(1140, 392, .6)
    for k in range(9):  # dây đèn lồng ngang phố
        o += V.lantern(190 + k * 120, 280 + 22 * math.sin(k * 1.3), 1.2)
    o += '<path d="M150 280Q660 340 1190 280" stroke="#6B3E1E" stroke-width="2" fill="none"/>'
    o += V._river(1280, 430, 610)
    o += lm_hoian(640, 440).replace('scale(.85)', 'scale(2.7)')
    o += '<g class="rock">' + V.sampan(220, 540, .8) + '</g><g class="rock" style="animation-delay:-1.5s">' + V.sampan(1020, 530, .7) + '</g>'
    for x, y, r in [(120, 590, 26), (960, 590, 22), (420, 596, 18)]: o += V.lotusleaf(x, y, r)
    o += V.lotus(124, 582, .8) + V._front(1280, 628) + V.kitsu(330, 668, 110, 'ehappy', 'walk') + V.non(880, 684, '#C7321F', True)
    o += V.flock(70, 60, 12, .45) + V.driftcloud(70, .8, 110, 30, False)
    o += bubble(640, 196, 'Chùa Cầu', True) + bubble(300, 250, 'Đèn lồng', True) + bubble(220, 470, 'Thuyền') + bubble(1000, 250, 'Nhà cổ') + bubble(120, 540, 'Hoa sen')
    hud = '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về bản đồ</span><span class="pill">Hội An</span></div><div class="abs" style="left:430px;bottom:18px"><button class="go">Chạm vào đèn lồng để học</button></div>'
    V.write('R5Arrive', 'Kids World, vào Hội An', 1280, 720, '<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="Cảnh Hội An"><defs>' + V.DEFS + '</defs>' + o + '<rect width="1280" height="720" filter="url(#grain)" opacity=".35"/></svg>' + hud + '</div>')

# thẻ từ gọn: viền nâu bo tròn, tô khối 2 mảng + một vệt sáng, cùng bảng màu làng; đồ vật không có mặt
INK = 'stroke="#3A2413" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"'
SH = '<ellipse cx="200" cy="356" rx="104" ry="13" fill="#3A2413" opacity=".16"/>'
def s_apple():
    return SH + '<path d="M200 126C164 92 78 104 76 196C74 276 130 348 176 346C188 345 194 338 200 338C206 338 212 345 224 346C270 348 326 276 324 196C322 104 236 92 200 126Z" fill="#E2483E" %s/><path d="M290 150C322 214 292 300 236 332C272 336 324 270 322 196C320 174 306 158 290 150Z" fill="#B3261E"/><path d="M116 168Q122 138 150 134Q130 152 128 190Q116 192 116 168Z" fill="#FFB0A0"/><path d="M200 126C198 96 204 76 218 60" fill="none" %s/><path d="M214 96C236 62 282 62 302 80C280 112 240 118 214 96Z" fill="#3CCB6B" %s/><path d="M222 94Q258 86 290 82" stroke="#0B7A52" stroke-width="4" fill="none" stroke-linecap="round"/>' % (INK, INK, INK)
def s_dog():
    o = SH + '<path d="M286 300C330 298 338 250 318 226" fill="none" stroke="#3A2413" stroke-width="24" stroke-linecap="round"/><path d="M286 300C330 298 338 250 318 226" fill="none" stroke="#C98A3E" stroke-width="11" stroke-linecap="round"/>'
    o += '<path d="M128 348C110 280 140 232 200 232C260 232 290 280 272 348Z" fill="#C98A3E" %s/><ellipse cx="200" cy="300" rx="40" ry="46" fill="#F4DDB0"/>' % INK
    for x in (150, 250): o += '<ellipse cx="%d" cy="346" rx="34" ry="20" fill="#F4DDB0" %s/>' % (x, INK)
    o += '<path d="M200 74C276 74 318 128 318 176C318 232 264 262 200 262C136 262 82 232 82 176C82 128 124 74 200 74Z" fill="#D9A25E" %s/>' % INK
    o += '<path d="M116 92Q172 66 232 78Q160 84 116 92Z" fill="#F2CC8E"/>'
    for sg in (-1, 1):
        o += '<path d="M%d 96C%d 76 %d 110 %d 196C%d 240 %d 226 %d 180C%d 146 %d 118 %d 96Z" fill="#7A4A26" %s/>' % (200 + sg * 70, 200 + sg * 130, 200 + sg * 156, 200 + sg * 152, 200 + sg * 134, 200 + sg * 108, 200 + sg * 100, 200 + sg * 92, 200 + sg * 82, 200 + sg * 70, INK)
        o += '<circle cx="%d" cy="164" r="11" fill="#2A1A14"/><circle cx="%d" cy="160" r="3.6" fill="#fff"/>' % (200 + sg * 52, 200 + sg * 52 - 3)
    return o + '<ellipse cx="200" cy="204" rx="56" ry="42" fill="#F4DDB0"/><path d="M180 186Q200 176 220 186Q218 204 200 208Q182 204 180 186Z" fill="#2A1A14"/><path d="M200 208v16" stroke="#3A2413" stroke-width="5" stroke-linecap="round"/>'
def s_boat():
    return SH.replace('356', '340') + '<path d="M50 236Q120 256 200 256T352 226Q334 300 280 318H128Q72 310 50 236Z" fill="#2F7A6E" %s/><path d="M66 262Q200 292 338 256" stroke="#EFE6CC" stroke-width="9" fill="none"/><path d="M128 250Q130 150 204 142Q276 150 286 242Q200 262 128 250Z" fill="#E5B85C" %s/><path d="M162 246Q164 180 204 170M204 252V146M246 246Q244 180 204 170" stroke="#9A7128" stroke-width="5" fill="none"/>' % (INK, INK)
def s_fish():
    return SH + '<path d="M292 200L356 136Q350 200 356 268Z" fill="#E8913A" %s/><path d="M300 202C270 120 130 116 62 204C130 290 270 286 300 202Z" fill="#F2A84C" %s/><path d="M300 202C282 250 196 280 118 256C200 262 268 236 300 202Z" fill="#D9742A"/><path d="M180 136Q200 96 244 118Q226 130 226 150Z" fill="#E8913A" %s/>' % (INK, INK, INK) + ''.join('<path d="M%d 178q14 22 0 46" stroke="#D9742A" stroke-width="5" fill="none" stroke-linecap="round"/>' % x for x in (178, 208, 238)) + '<path d="M146 166Q130 202 146 240" stroke="#3A2413" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="110" cy="190" r="11" fill="#2A1A14"/><circle cx="106" cy="186" r="3.6" fill="#fff"/>'

def r6b():
    body = ('<div class="v" style="width:1400px;height:520px;padding:28px 40px"><div class="t1" style="font-size:30px;margin-bottom:18px">Thẻ từ: nét gọn cùng theme, đồ vật không có mặt</div><div style="display:flex;gap:20px;justify-content:center">' + ''.join('<div style="width:310px;background:#FFF9EA;border:4px solid #6B3E1E;border-radius:24px;box-shadow:0 8px 0 #6B3E1E;padding:8px;text-align:center"><svg width="280" height="280" viewBox="20 30 360 350" role="img" aria-label="%s">%s</svg><div class="t1" style="font-size:40px;color:#D32F2F">%s</div><div style="font-size:17px;font-weight:600">%s</div></div>' % (w, s, w, v) for s, w, v in [(s_apple(), 'apple', 'quả táo'), (s_dog(), 'dog', 'con chó'), (s_boat(), 'boat', 'con thuyền'), (s_fish(), 'fish', 'con cá')]) + '</div></div>')
    V.write('R6Cards', 'Thẻ từ gọn', 1400, 520, body)

# ---------- Lượt 3: bản đồ theo luật 2D hiện có (bệ, công trình 3D nổi, chấm vị trí thật, cây từ, cờ, đường, bến); cảnh Hội An theo ảnh ----------
import base64, io
from PIL import Image
KW = 'C:/Users/01217/AppData/Local/Temp/kw3d/'
def lmimg(id_, w=420):
    im = Image.open(KW + 'lm_%s.png' % id_).convert('RGBA'); im = im.crop(im.getbbox())
    h = round(im.height * w / im.width); im = im.resize((w, h), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode(), w, h

def pad(x, y, id_, W=420, done=False, stages=(), hot=False):
    src, w0, h0 = lmimg(id_, 420); h = W * h0 / w0
    o = '<ellipse cx="%d" cy="%d" rx="%d" ry="56" fill="#0A3A40" opacity=".3" filter="url(#soft)"/>' % (x + 6, y + 40, W * .46)
    o += '<image href="%s" x="%d" y="%d" width="%d" height="%d"/>' % (src, x - W / 2, y + 62 - h, W, h)
    for i, st in enumerate(stages):
        a_ = math.pi * (.12 + .76 * i / max(1, len(stages) - 1)); px, py = x - math.cos(a_) * W * .4, y + math.sin(a_) * 26
        o += '<path d="M%d %dv-22" stroke="#0B7A52" stroke-width="5"/>' % (px, py)
        if st: o += '<circle cx="%d" cy="%d" r="11" fill="%s" stroke="%s" stroke-width="3"/><circle cx="%d" cy="%d" r="4" fill="#F7B91A"/>' % (px, py - 26, ['#F28FB0', '#E2483E', '#FFF9EA'][i % 3], K, px, py - 26)
        else: o += '<ellipse cx="%d" cy="%d" rx="11" ry="5" fill="#3CCB6B" transform="rotate(-30 %d %d)"/>' % (px + 7, py - 20, px, py)
    if done: o += '<path d="M%d %dv-120" stroke="%s" stroke-width="7"/><path class="wave" d="M%d %dl62 18l-62 22Z" fill="#E2483E" stroke="%s" stroke-width="4"/>' % (x + 180, y + 6, K, x + 184, y - 114, K)
    return o

def r5d(name='R5World', Z=.4, cx=2060, cy=2870, title='Kids World, Trung Bộ'):
    d = json.load(open(KW + 'layout.json', encoding='utf-8'))
    m = json.load(open(vnjson, encoding='utf-8'))
    C_ = math.cos(math.radians(16))
    Sx, Sy = lambda px: 232 + px / (C_ * 66) * 290, lambda py: 240 + py / 66 * 300
    conv = lambda d_: __import__('re').sub(r'(-?[\d.]+) (-?[\d.]+)', lambda q: '%.0f %.0f' % (Sx(float(q.group(1))), Sy(float(q.group(2)))), d_)
    Pj = lambda lo, la: (232 + (lo - 102) * 290, 240 + (23.5 - la) * 300)
    P = {q['id']: q for q in d['places']}
    o = '<rect width="1280" height="720" fill="url(#riv)"/>'
    o += '<g transform="scale(%.2f) translate(%d %d)">' % (Z, 640 / Z - cx, 360 / Z - cy)
    for _ in range(340):
        x, y, w = Rr.randint(0, 3800), Rr.randint(0, 5100), Rr.choice([40, 52, 64])
        o += '<path d="M%d %dq%.1f -14 %.1f 0q%.1f -14 %.1f 0" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".6"/>' % (x, y, w / 4, w / 2, w / 4, w / 2)
    prov = [conv(v['d']) for v in m['prov'].values()]
    o += '<path d="%s" fill="#F2DDA6" stroke="#F2DDA6" stroke-width="32" stroke-linejoin="round"/>' % ''.join(prov)
    o += ''.join('<path d="%s" fill="%s" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>' % (v, ['url(#hill1)', 'url(#hill2)', 'url(#hill3)'][i % 3]) for i, v in enumerate(prov))
    # đường theo điểm `via` thật của game, nối bệ qua chấm vị trí thật
    ids = ['hanoi', 'ninhbinh', 'hue', 'danang', 'hoian', 'nhatrang', 'dalat', 'hcmc', 'cantho']
    pts = [(P['sapa']['anchor']['x'], P['sapa']['anchor']['y'])]
    for i_ in ids:
        pts += [Pj(lo, la) for lo, la in (P[i_].get('via') or [])] + [(P[i_]['anchor']['x'], P[i_]['anchor']['y'])]
    # bo cong đường bằng Chaikin 4 lần
    for _ in range(4):
        n_ = [pts[0]]
        for a_, b_ in zip(pts, pts[1:]):
            n_ += [(a_[0] * .75 + b_[0] * .25, a_[1] * .75 + b_[1] * .25), (a_[0] * .25 + b_[0] * .75, a_[1] * .25 + b_[1] * .75)]
        pts = n_ + [pts[-1]]
    path = 'M' + 'L'.join('%.0f %.0f' % q for q in pts)
    st = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'
    o += '<path d="%s" stroke="#8A6A3A" stroke-width="44" opacity=".5" %s/><path d="%s" stroke="#D9AE6A" stroke-width="36" %s/><path d="%s" stroke="#E9C68A" stroke-width="20" %s/><path d="%s" stroke="#B98A4A" stroke-width="5" stroke-dasharray="1 26" %s/>' % (path, st, path, st, path, st, path, st)
    # cây rải ven núi, cùng nét trang chủ
    for x, y, s_ in [(1880, 2640, 1.3), (1960, 3040, 1.2), (2010, 3240, 1.4), (2180, 3300, 1.2), (1840, 3220, 1.4), (1740, 3460, 1.3), (2230, 3110, 1)]: o += V.tree(x, y, s_)
    prs = [('hue', 'hue-ngo-mon', 'Huế', False, (1, 1, 1, 0), True), ('danang', 'danang-dragon-bridge', 'Đà Nẵng', False, (1, 0, 0), False), ('hoian', 'hoian-bridge-pagoda', 'Hội An', True, (1, 1, 0, 0), False), ('nhatrang', 'nhatrang-tram-huong', 'Nha Trang', False, (), False), ('dalat', 'dalat-station', 'Đà Lạt', False, (0,), False), ('sapa', 'sapa-terraces', 'Sa Pa', False, (1, 1), True), ('hanoi', 'hanoi-turtle-tower', 'Hà Nội', False, (1, 1, 1), True), ('halong', 'halong-trong-mai', 'Hạ Long', False, (1, 0), False), ('ninhbinh', 'ninhbinh-trang-an', 'Tràng An', False, (1,), False), ('hcmc', 'hcmc-ben-thanh', 'TP.HCM', False, (0, 0), False), ('cantho', 'cantho-floating-market', 'Cần Thơ', False, (), False), ('phuquoc', 'phuquoc-fishing-village', 'Phú Quốc', False, (), False)]
    # bản đồ game dịch nhẹ bệ cho khỏi đè; board thu nhỏ nên giãn thêm theo hướng biển
    nudge = {'hue': (-170, -60), 'danang': (230, -60), 'hoian': (240, 150), 'nhatrang': (230, -80), 'dalat': (-240, -60), 'sapa': (-170, -40), 'hanoi': (-250, 10), 'halong': (270, -40), 'ninhbinh': (60, 290), 'hcmc': (250, 130), 'cantho': (-60, 250), 'phuquoc': (-260, -110)}
    for pid, lid, nm, hot, sg, dn in sorted(prs, key=lambda t: P[t[0]]['pad']['y'] + nudge[t[0]][1]):
        q = P[pid]; ax, ay = q['anchor']['x'], q['anchor']['y']; x, y = q['pad']['x'] + nudge[pid][0], q['pad']['y'] + nudge[pid][1]
        o += '<path d="M%d %dL%d %d" stroke="#D32F2F" stroke-width="6" stroke-dasharray="4 16" stroke-linecap="round"/><circle cx="%d" cy="%d" r="15" fill="#D32F2F" stroke="#FFF9EA" stroke-width="6"/>' % (ax, ay, x, y, ax, ay)
        o += pad(x, y, lid, 400, dn, sg) + '<g transform="translate(%d %d) scale(2.1)">%s</g>' % (x, y + 100, V.label(0, 0, nm, hot=hot))
    q = P['hoian']; o += '<g transform="scale(2)">' + V.kitsu(q['anchor']['x'] / 2, (q['anchor']['y'] + 30) / 2, 70, 'ehappy', 'walk') + '</g></g>'
    o += V.flock(70, 60, 12, .45) + V.driftcloud(70, .8, 110, 30, False)
    card = '<div class="abs" style="left:28px;bottom:28px;width:300px;background:#FFF9EA;border:3px solid #F7B91A;border-radius:20px;padding:16px 18px"><div class="t1" style="font-size:28px">Hội An</div><div style="margin:4px 0 12px;font-weight:500">Phố đèn lồng, 10 từ, đã xong 4</div><button class="go" style="width:100%;justify-content:center">Vào Hội An</button></div>'
    hud = '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về làng</span><span class="pill">Tầng 1 Việt Nam</span><span class="pill">46 sao</span></div>'
    V.write(name, title, 1280, 720, '<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="Bản đồ Việt Nam cho bé" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>' + V.DEFS + '</defs>' + o + '<rect width="1280" height="720" filter="url(#grain)" opacity=".3"/></svg>' + hud + card + '</div>')

def yellow(x, y, w, h, c='#F2C54B'):
    o = '<rect x="%d" y="%d" width="%d" height="%d" fill="%s" stroke="%s" stroke-width="1.6"/>' % (x, y, w, h, c, K)
    for _ in range(int(w * h / 2200)):  # vệt rêu tường cổ
        o += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="#B98A2E" opacity=".22"/>' % (Rr.randint(x + 6, x + w - 6), Rr.randint(y + 6, y + h - 6), Rr.randint(6, 26), Rr.randint(3, 8))
    return o + '<rect x="%d" y="%d" width="%d" height="26" fill="url(#es)"/>' % (x, y, w)

def window(x, y, w=34, h=46):
    return '<rect x="%d" y="%d" width="%d" height="%d" fill="#3A1F12" stroke="%s"/>' % (x, y, w, h, K) + ''.join('<rect x="%d" y="%d" width="%d" height="%d" fill="#2F7F6A" stroke="#1E5A4A"/>' % (xx, y, w * .32, h, ) + ''.join('<path d="M%d %dh%d" stroke="#7FCDB4"/>' % (xx, y + k * 6, w * .32) for k in range(1, int(h / 6))) for xx in (x - w * .32, x + w))

def palm(x, y, s=1):
    o = '<path d="M%d %dL%d %dL%d %dL%d %dZ" fill="#B9694C" stroke="%s" stroke-width="1.4"/>' % (x - 13 * s, y - 26 * s, x + 13 * s, y - 26 * s, x + 9 * s, y, x - 9 * s, y, K)
    for a_ in (-150, -120, -95, -70, -40, -170, -15):
        r_ = math.radians(a_); ex, ey = math.cos(r_) * 42 * s, math.sin(r_) * 42 * s
        o += '<path d="M%d %dQ%.0f %.0f %.0f %.0fQ%.0f %.0f %d %dZ" fill="%s" stroke="#0B7A52" stroke-width="1"/>' % (x, y - 26 * s, x + ex * .4 - 4, y - 26 * s + ey * .7, x + ex, y - 26 * s + ey + 8 * s, x + ex * .6 + 4, y - 26 * s + ey * .3, x, y - 26 * s, Rr.choice(['#2FA860', '#3CCB6B', '#1F8A4E']))
    return o

def bridgecc():
    """Chùa Cầu nhìn chính diện theo ảnh: chân đá nhiều trụ, lan can, đèn lồng, mái ngói nâu sẫm, tượng trên bờ nóc."""
    o = '<rect x="330" y="300" width="540" height="150" fill="#6E5A44" stroke="%s" stroke-width="2"/>' % K
    for x in (346, 448, 556, 664, 772):
        w_ = 82 if x != 556 else 96
        o += '<path d="M%d 450V340Q%d 306 %d 340V450Z" fill="#14283A" stroke="%s" stroke-width="2"/>' % (x, x + w_ / 2, x + w_, K)
    for x in (336, 432, 536, 656, 760, 858):
        o += '<rect x="%d" y="316" width="22" height="134" fill="#9A8468" stroke="%s" stroke-width="1.4"/>' % (x - 6, K)
        for y in range(322, 448, 13): o += '<path d="M%d %dh22" stroke="#6E5A44" stroke-width="1.2"/>' % (x - 6, y)
    o += '<rect x="322" y="296" width="556" height="18" fill="#7A4A30" stroke="%s" stroke-width="2"/>' % K
    o += '<rect x="330" y="246" width="540" height="52" fill="#3A1F12"/>'
    for x in range(338, 868, 11): o += '<rect x="%d" y="262" width="5" height="34" fill="#8F4A2A"/>' % x
    o += '<rect x="330" y="258" width="540" height="6" fill="#A85A3A" stroke="%s"/>' % K
    for x in range(340, 870, 96): o += '<rect x="%d" y="226" width="12" height="72" fill="#7A3B22" stroke="%s"/>' % (x, K)
    for k in range(7): o += V.lantern(372 + k * 76, 238, 1.25)
    d = 'M286 232Q300 214 340 200L400 150H800L860 200Q900 214 914 232Q600 248 286 232Z'
    o += V.tiles(d, 280, 148, 920, 240, '#6E3D2C', '#3F2015', 10)
    o += '<path d="M390 150Q600 138 810 150" stroke="#A9A08A" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M286 232Q600 250 914 232" stroke="#D9CDB0" stroke-width="5" fill="none"/>'
    for x, s_ in ((396, -1), (804, 1)): o += '<path d="M%d 150q%d -6 %d -24q%d 6 %d 14" stroke="#A9A08A" stroke-width="7" fill="none" stroke-linecap="round"/>' % (x, s_ * 14, s_ * 16, s_ * 8, s_ * 16)
    o += '<circle cx="600" cy="130" r="11" fill="#C9B47A" stroke="%s"/><path d="M566 142q34 -22 68 0" stroke="#A9A08A" stroke-width="6" fill="none"/>' % K
    o += '<rect x="548" y="206" width="104" height="24" fill="#2A1A14" stroke="#D1A24A" stroke-width="2"/><text x="600" y="223" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="13" fill="#F7D96A">Lai Viễn Kiều</text>'
    return o

def r5e():
    Zm, Dx, Dy = .72, 180, 92
    o = '<rect width="1280" height="720" fill="url(#sky)"/>' + V.driftcloud(70, .9, 120, 30, False)
    o += '<g transform="translate(%d %d) scale(%.2f)">' % (Dx, Dy, Zm)
    o += '<rect x="-430" y="350" width="2140" height="360" fill="#C8B79A"/>'
    o += V.tree(1040, 330, 1.2) + V.tree(250, 300, 1) + V.tree(-140, 330, 1.3) + V.tree(1400, 320, 1.2)
    # phố mở rộng hai bên
    for x, w_, c_ in [(-250, 120, '#EEB23C'), (-370, 130, '#F6D478'), (1290, 150, '#EEB23C'), (1450, 130, '#F2C54B')]:
        o += yellow(x, 130, w_, 240, c_) + V.roofv(x + w_ / 2, 132, w_ + 26, 46, '#A85A3A', '#6E3522', curl=6) + window(x + 30, 170, 30, 44) + window(x + 30, 280, 30, 60)
    # tường hồng hai bên đầu cầu, nhà vàng phía sau
    o += yellow(870, 196, 260, 150, '#EE8E8E') + '<path d="M860 196h280" stroke="#6E3D2C" stroke-width="12"/>' + yellow(1000, 96, 280, 250)
    o += V.roofv(1140, 96, 300, 56, '#A85A3A', '#6E3522', curl=6) + window(1060, 150) + window(1170, 150) + window(1060, 240) + window(1170, 240)
    # quầng nhà vàng hai tầng trái, tiền cảnh, hoa giấy
    o += yellow(-20, 56, 340, 312) + V.roofv(150, 58, 370, 60, '#A85A3A', '#6E3522', curl=6)
    o += '<rect x="-10" y="196" width="330" height="10" fill="#7A4A30" stroke="%s"/>' % K
    for x in (40, 170): o += window(x, 96, 44, 76) + window(x, 226, 44, 96)
    for x, c_ in [(10, '#E2583E'), (92, '#F2A03D'), (174, '#E2583E'), (256, '#F5D24A')]: o += V.lantern(x, 200, 1.2)
    for _ in range(90): o += '<circle cx="%d" cy="%d" r="%d" fill="%s"/>' % (Rr.randint(250, 330), Rr.randint(60, 220), Rr.randint(4, 9), Rr.choice(['#E8418F', '#F268A6', '#D92F78', '#3CCB6B']))
    o += bridgecc()
    # mặt nước + bóng phản chiếu
    wid = V.uid()
    o += '<linearGradient id="%s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F8A6A"/><stop offset="1" stop-color="#16BFC8"/></linearGradient>' % wid
    o += '<path d="M330 450H870L1090 720H90Z" fill="url(#%s)"/>' % wid
    o += '<g transform="translate(0 900) scale(1 -1)" opacity=".34">' + bridgecc().replace('Lai Viễn Kiều', '') + '</g><path d="M0 720V450H330L90 720ZM1280 720V450H870L1090 720Z" fill="none"/>'
    for _ in range(40):
        x, y, w_ = Rr.randint(340, 860), Rr.randint(470, 700), Rr.randint(30, 90)
        o += '<path class="lap" style="--t:%.1fs;--d:-%.1fs" d="M%d %dq%.0f -5 %d 0" stroke="#D5FFF4" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/>' % (Rr.uniform(3, 6), Rr.uniform(0, 4), x, y, w_ / 2, w_)
    # hai kè đá phối cảnh + vỉa hè + chậu cau
    o += '<path d="M-10 366H330V450L90 720H-10Z" fill="#C8B79A" stroke="%s" stroke-width="2"/><path d="M330 370V450L90 720H-10V640L318 372Z" fill="#8F7E66" stroke="%s" stroke-width="1.6"/>' % (K, K)
    for k in range(12):
        t = k / 12; o += '<path d="M%d %dL%d %d" stroke="#5E5040" stroke-width="1.6"/>' % (318 - 328 * t, 372 + 268 * t, 330 - 240 * t, 450 + 270 * t)
    for k in range(5): o += '<path d="M%d %dL%d %d" stroke="#5E5040" stroke-width="1.2"/>' % (330, 386 + k * 14, 40 - k * 10, 660 + k * 12)
    o += '<path d="M1290 340H870V450L1090 720H1290Z" fill="#B9AE9A" stroke="%s" stroke-width="2"/><path d="M870 350V450L1090 720H1290V650L882 350Z" fill="#8F7E66" stroke="%s" stroke-width="1.6"/>' % (K, K)
    for k in range(12):
        t = k / 12; o += '<path d="M%d %dL%d %d" stroke="#5E5040" stroke-width="1.6"/>' % (882 + 408 * t, 350 + 300 * t, 870 + 220 * t, 450 + 270 * t)
    for k in range(7): t = k / 7; o += palm(290 - 270 * t, 382 + 240 * t, .9 + t * .9)
    o += V.non(1180, 440, '#2E5AA8', True) + V.non(990, 392, '#C7321F')
    o += '<g class="rock">' + V.sampan(640, 610, .95) + '</g>' + V.lotusleaf(450, 660, 22) + V.lotusleaf(800, 680, 18) + V.lotus(452, 650, .7)
    # phố lát đá ngang tiền cảnh, thú cưng đi trên phố
    o += '<path d="M-420 700H1700V960H-420Z" fill="#CDBB9C" stroke="%s" stroke-width="2"/>' % K
    for row in range(5):
        y_ = 712 + row * 46
        o += '<path d="M-420 %dH1700" stroke="#A8957A" stroke-width="2"/>' % y_
        for k in range(46): o += '<path d="M%d %dv46" stroke="#A8957A" stroke-width="1.6"/>' % (-420 + k * 48 + (row % 2) * 24, y_)
    for k in range(-8, 19):
        o += '<rect x="%d" y="686" width="10" height="26" fill="#8F7E66" stroke="%s"/>' % (k * 80 - 20, K)
    o += '<path d="M-420 688H1700" stroke="#6E5A44" stroke-width="7"/>'
    o += '</g>'
    M = lambda x, y: (x * Zm + Dx, y * Zm + Dy)
    o += V.kitsu(*map(int, M(610, 800)), 110, 'ehappy', 'walk') + V.non(*map(int, M(980, 830)), '#2F8F5B', False, '#5A3A22')
    o += V.flock(60, 60, 12, .42)
    for t_, x, y, dn in [('Chùa Cầu', 600, 90, True), ('Đèn lồng', 372, 196, True), ('Thuyền', 640, 520, False), ('Nhà cổ', 1140, 70, False), ('Hoa giấy', 300, 40, False)]:
        o += bubble(*map(int, M(x, y)), t_, dn)
    hud = '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về bản đồ</span><span class="pill">Hội An</span></div>'
    V.write('R5Arrive', 'Kids World, vào Hội An', 1280, 720, '<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="Chùa Cầu và phố cổ Hội An"><defs>' + V.DEFS + '</defs>' + o + '<rect width="1280" height="720" filter="url(#grain)" opacity=".3"/></svg>' + hud + '</div>')

def s_fish():
    ink2 = 'stroke="#3A2413" stroke-width="6" stroke-linejoin="round"'
    o = SH + '<defs><linearGradient id="fb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8622C"/><stop offset=".55" stop-color="#F7A84C"/><stop offset="1" stop-color="#FFF0D0"/></linearGradient><clipPath id="fc"><path d="M58 206C100 136 214 118 300 178Q322 194 330 206Q322 218 300 234C214 292 100 276 58 206Z"/></clipPath></defs>'
    o += '<path d="M318 206C346 176 372 150 384 118C376 160 374 180 362 206C374 232 376 252 384 294C372 262 346 236 318 206Z" fill="#E8622C" %s/>' % ink2
    for a_, b_ in [(340, 176), (356, 158), (340, 236), (356, 254)]: o += '<path d="M326 206L%d %d" stroke="#FFF0D0" stroke-width="3"/>' % (a_, b_)
    o += '<path d="M150 150C170 104 240 104 276 152C230 136 190 138 150 150Z" fill="#E8622C" %s/>' % ink2
    for x in (172, 196, 220, 244): o += '<path d="M%d 142L%d 118" stroke="#FFF0D0" stroke-width="3"/>' % (x, x + 8)
    o += '<path d="M190 268C210 300 244 302 262 282C236 276 214 272 190 268Z" fill="#E8622C" %s/>' % ink2
    o += '<path d="M58 206C100 136 214 118 300 178Q322 194 330 206Q322 218 300 234C214 292 100 276 58 206Z" fill="url(#fb)" %s/><g clip-path="url(#fc)">' % ink2
    for c_ in range(10):
        for r_ in range(-3, 4):
            x, y = 136 + c_ * 20 + (r_ % 2) * 10, 204 + r_ * 18
            o += '<path d="M%d %dq12 9 0 18" stroke="#B8421C" stroke-width="2" fill="none" opacity=".55"/>' % (x, y - 9)
    o += '</g><path d="M122 158Q102 206 122 256" stroke="#3A2413" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M146 214C170 216 188 234 186 256C166 256 148 240 146 214Z" fill="#F7C47C" %s/>' % ink2
    return o + '<circle cx="100" cy="190" r="13" fill="#FFF3D6" stroke="#3A2413" stroke-width="4"/><circle cx="98" cy="190" r="7" fill="#1E1414"/><circle cx="95" cy="187" r="2.4" fill="#fff"/><path d="M60 208Q70 214 80 212" stroke="#3A2413" stroke-width="4" fill="none" stroke-linecap="round"/>'

# ---------- Lượt 5: Hội An hoàng hôn theo ảnh: Chùa Cầu, phố đèn, hoa đăng, thuyền, người đi bộ ----------
LC_ = ['#F2484A', '#F7B91A', '#2FB8C6', '#F268A6', '#7FD45A', '#FF8A3C']
def halo(x, y, r, a_=1):
    return '<circle cx="%d" cy="%d" r="%d" fill="url(#hg)" opacity="%.2f"/>' % (x, y, r, a_)

def den(x, y, s=1, c='#F2484A', rope=14):
    d_ = Rr.uniform(0, 4)
    o = '<g class="sway" style="--t:%.1fs;--d:-%.1fs;transform-origin:%dpx %dpx">' % (3.4 + d_ / 2, d_, x, y)
    o += halo(x, y + rope + 12 * s, 34 * s) + '<path d="M%d %dv%d" stroke="#3A2413" stroke-width="1.1"/>' % (x, y, rope)
    cy = y + rope + 13 * s
    o += '<ellipse cx="%d" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" stroke="#5A2A10" stroke-width="1.1"/>' % (x, cy, 11 * s, 13 * s, c)
    o += '<ellipse cx="%d" cy="%.1f" rx="%.1f" ry="%.1f" fill="#FFF3B0" opacity=".65"/>' % (x, cy, 5 * s, 9 * s)
    for k in (-.55, .55): o += '<ellipse cx="%d" cy="%.1f" rx="%.1f" ry="%.1f" fill="none" stroke="#7A2A10" stroke-width=".8" opacity=".55"/>' % (x, cy, 11 * s * abs(k), 13 * s)
    o += '<rect x="%.1f" y="%.1f" width="%.1f" height="3" fill="#E9B44C"/><rect x="%.1f" y="%.1f" width="%.1f" height="3" fill="#E9B44C"/><path d="M%d %.1fv%.1f" stroke="%s" stroke-width="2"/>' % (x - 4.5 * s, cy - 14 * s, 9 * s, x - 4.5 * s, cy + 12 * s, 9 * s, x, cy + 14 * s, 10 * s, c)
    return o + '</g>'

def hoadang(x, y, s=1, c='#F2484A'):
    d_ = Rr.uniform(0, 3.4)
    o = '<ellipse cx="%d" cy="%.1f" rx="%.1f" ry="%.1f" fill="#FFD27A" opacity=".4"/>' % (x, y + 12 * s, 11 * s, 3 * s)
    o += '<path d="M%.1f %.1fv%.1f" stroke="%s" stroke-width="%.1f" opacity=".28" stroke-linecap="round"/>' % (x, y + 14 * s, 9 * s, c, 12 * s)
    o += '<g class="rock" style="animation-delay:-%.1fs">' % d_ + halo(x, y, 30 * s, .9)
    o += '<path d="M%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fZ" fill="#FFF6C8"/>' % (x - 9 * s, y - 11 * s, x + 9 * s, y - 11 * s, x + 7 * s, y + 8 * s, x - 7 * s, y + 8 * s)
    o += '<path d="M%.1f %.1fL%d %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fZ" fill="%s"/>' % (x - 9 * s, y - 11 * s, x, y - 4 * s, x + 9 * s, y - 11 * s, x + 7 * s, y + 8 * s, x - 7 * s, y + 8 * s, c)
    o += '<path d="M%.1f %.1fL%d %.1fL%.1f %.1f" fill="none" stroke="#FFF6C8" stroke-width="1"/><ellipse cx="%d" cy="%.1f" rx="%.1f" ry="%.1f" fill="#fff"/>' % (x - 9 * s, y - 11 * s, x, y - 4 * s, x + 9 * s, y - 11 * s, x, y - 8 * s, 2 * s, 3.4 * s)
    o += '<path d="M%.1f %.1fh%.1fl%.1f %.1fh%.1fZ" fill="#2A7A5A"/></g>' % (x - 10 * s, y + 8 * s, 20 * s, -2 * s, 5 * s, -16 * s)
    return o

def walker(x, y, top, hair='#2A1E18', pant='#2E3A5A', s=1, skin='#E8B98E'):
    return ('<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="1" rx="11" ry="3" fill="#120A08" opacity=".35"/><path d="M-5 -18L-7 -1H-2L0 -13L3 -1H8L5 -18Z" fill="%s"/><path d="M-7 -36Q-9 -24 -6 -16H6Q9 -24 7 -36Q0 -40 -7 -36Z" fill="%s" stroke="#1A1218" stroke-width=".7"/><path d="M-7 -33Q-12 -26 -10 -18M7 -33Q11 -26 8 -18" stroke="%s" stroke-width="3" fill="none" stroke-linecap="round"/><circle cy="-44" r="5.6" fill="%s"/><path d="M-6 -45q6 -9 12 0q-6 -3 -12 0Z" fill="%s"/></g>' % (x, y, s, pant, top, top, skin, hair))

def bike(x, y, c='#2FB8C6'):
    return ('<g transform="translate(%d %d)"><ellipse cy="2" rx="24" ry="3" fill="#120A08" opacity=".35"/><circle cx="-14" cy="-9" r="9" fill="none" stroke="#2A2030" stroke-width="2"/><circle cx="14" cy="-9" r="9" fill="none" stroke="#2A2030" stroke-width="2"/><path d="M-14 -9L-3 -21H10L14 -9M-3 -21L1 -9L10 -21" fill="none" stroke="%s" stroke-width="2.4"/><path d="M-6 -24h7M8 -26l5 -1" stroke="#2A2030" stroke-width="2.4"/><rect x="6" y="-20" width="11" height="7" fill="#C9A464" stroke="#6B4322"/></g>' % (x, y, c))

def stonequay(a, b, c, d):
    # a,b mép trên; c,d mép dưới; từng hàng đá phối cảnh
    pal = ['#6E6352', '#5C5244', '#7D7160', '#4E4639']
    o = '<path d="M%d %dL%d %dL%d %dL%d %dZ" fill="#4E4639" stroke="#1E1812" stroke-width="1.6"/>' % (a + b + c + d if False else (a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]))
    for r_ in range(6):
        t0, t1 = r_ / 6, (r_ + 1) / 6
        for k in range(26):
            u0, u1 = k / 26, (k + 1) / 26
            P_ = lambda u, t: (a[0] + (b[0] - a[0]) * u + ((d[0] + (c[0] - d[0]) * u) - (a[0] + (b[0] - a[0]) * u)) * t, a[1] + (b[1] - a[1]) * u + ((d[1] + (c[1] - d[1]) * u) - (a[1] + (b[1] - a[1]) * u)) * t)
            sh = .5 / 26 if r_ % 2 else 0
            p = [P_(u0 + sh, t0), P_(u1 + sh, t0), P_(u1 + sh, t1), P_(u0 + sh, t1)]
            o += '<path d="M%.0f %.0fL%.0f %.0fL%.0f %.0fL%.0f %.0fZ" fill="%s" stroke="#2A2218" stroke-width=".9"/>' % (*p[0], *p[1], *p[2], *p[3], Rr.choice(pal))
    return o

def Yd(x): return 342 - 20 * (1 - ((x - 640) / 226) ** 2)
def Ye(x): return 232 - 17 * (1 - ((x - 640) / 304) ** 2)
def curve(f, x0, x1, dy=0, n=24):
    return 'L'.join('%.1f %.1f' % (x0 + (x1 - x0) * k / n, f(x0 + (x1 - x0) * k / n) + dy) for k in range(n + 1))

def spiral(x, y, r, sg=1, turns=9.0):
    pts = []
    for k in range(36):
        t = k / 35 * turns; q_ = r * (1 - k / 38)
        pts.append('%.1f %.1f' % (x + sg * math.cos(t) * q_, y + math.sin(t) * q_))
    return '<path d="M%s" fill="none" stroke="#E9B44C" stroke-width="3" stroke-linecap="round"/>' % 'L'.join(pts)

def bridge_dusk():
    gold = '#E9B44C'; o = ''
    # tường hồng hai đầu, cao và ố
    for x, w_ in ((346, 84), (850, 84)):
        o += '<rect x="%d" y="228" width="%d" height="158" fill="#D9707A" stroke="#2A1810" stroke-width="1.6"/>' % (x, w_)
        for _ in range(14): o += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" opacity=".32"/>' % (Rr.randint(x + 6, x + w_ - 6), Rr.randint(236, 380), Rr.randint(5, 18), Rr.randint(3, 10), Rr.choice(['#A84858', '#F2A0A0', '#8A5A4A']))
    # thân tối dưới cầu
    o += '<path d="M%s L860 474 L420 474Z" fill="#141A2E"/>' % curve(Yd, 420, 860, 8).replace('L', 'L', 1).join(['', ''])[0:0] if False else ''
    o += '<path d="M420 474L%sL860 474Z" fill="#141A2E"/>' % curve(Yd, 420, 860, 8)
    # lòng cầu chính: nhìn xuyên qua thấy sông chảy về phía xa
    tid = V.uid()
    o += '<clipPath id="%s"><rect x="558" y="342" width="164" height="132"/></clipPath><linearGradient id="thru" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2A86A"/><stop offset=".55" stop-color="#E88A6A"/><stop offset="1" stop-color="#6A5A8A"/></linearGradient>' % tid
    o += '<g clip-path="url(#%s)"><rect x="558" y="342" width="164" height="70" fill="url(#thru)"/>' % tid
    o += '<path d="M552 412Q590 372 620 394Q650 366 684 392Q710 376 730 412Z" fill="#23304A"/>'
    o += '<path d="M590 410Q640 386 690 410V418H590Z" fill="#6E5A44" stroke="#2A1208"/><path d="M618 418Q640 402 662 418Z" fill="#F2A86A"/>'
    o += '<path d="M558 412H722V474H558Z" fill="#2F6A8A"/><path d="M612 412H668L700 474H580Z" fill="#F2C27A" opacity=".75"/>'
    for k in range(14): o += '<path d="M%d %dh%d" stroke="%s" stroke-width="1.8" opacity=".85"/>' % (586 + Rr.randint(0, 80), 416 + k * 4, 12 + k * 2, Rr.choice(['#FFE29A', '#fff', '#F2884A']))
    for k in range(6): o += '<circle cx="%d" cy="%d" r="2" fill="#FFE29A"/>' % (596 + k * 18, 398 + (k % 2) * 3)
    o += '</g>'
    # hai vòm hẹp hai bên, nước vào trong
    for x, w_ in ((432, 60), (788, 60)):
        o += '<path d="M%d 474V386A%d %d 0 0 1 %d 386V474Z" fill="#0E1426" stroke="#A87C46" stroke-width="5"/><path d="M%d 474V452Q%d 444 %d 452V474Z" fill="#2F6A8A"/>' % (x, w_ / 2, w_ / 2, x + w_, x + 3, x + w_ / 2, x + w_ - 3)
    # trụ đá gạch
    for x, w_ in ((492, 66), (722, 66)):
        o += '<rect x="%d" y="342" width="%d" height="132" fill="#B8894F" stroke="#2A1810" stroke-width="1.6"/><rect x="%d" y="342" width="10" height="132" fill="#D9A866"/>' % (x, w_, x + (48 if x > 640 else 8))
        for yy in range(352, 474, 12):
            o += '<path d="M%d %dh%d" stroke="#7A5A30" stroke-width="1.1"/>' % (x, yy, w_)
            for xx in range(x + (yy % 2) * 8 + 6, x + w_, 18): o += '<path d="M%d %dv12" stroke="#7A5A30" stroke-width="1"/>' % (xx, yy)
    # dầm cong
    o += '<path d="M%sL%sZ" fill="#8F6A38" stroke="#2A1810" stroke-width="1.6"/>' % (curve(Yd, 414, 866, 0), curve(Yd, 866, 414, 16))
    o += '<rect x="586" y="%d" width="108" height="16" fill="#8F2A22" stroke="%s"/><text x="640" y="%d" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="11" fill="#F7D96A">Lai Viễn Kiều</text>' % (Yd(640) + 18, gold, Yd(640) + 30)
    # gian sáng đèn trên cầu
    o += '<linearGradient id="gal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD27A"/><stop offset="1" stop-color="#E8863C"/></linearGradient><path d="M430 %.0fL%sL850 %.0fZ" fill="url(#gal)"/>' % (Ye(430), curve(Yd, 430, 850), Ye(850))
    o += '<rect x="602" y="240" width="76" height="60" fill="#D9543C" stroke="#7A3010"/><path d="M640 240v60M602 270h76" stroke="#F7B91A" stroke-width="1.6"/>'
    for x, c_ in ((470, '#2E4A5A'), (524, '#8F3A5A'), (578, '#2E5A4A'), (706, '#7A5A2A'), (760, '#3A3A6A'), (808, '#8F3A3A')): o += walker(x, Yd(x), c_, s=.82)
    for x in range(432, 850, 7): o += '<path d="M%d %.0fv-26" stroke="#6B3E1E" stroke-width="2.8"/>' % (x, Yd(x))
    o += '<path d="M%s" fill="none" stroke="#8F5A2E" stroke-width="6"/>' % ('M' + curve(Yd, 424, 856, -26))[1:]
    for x in range(428, 860, 70): o += '<rect x="%d" y="%.0f" width="10" height="%.0f" fill="#5A2A18" stroke="#2A1208"/>' % (x, Ye(x), Yd(x) - Ye(x))
    # mái cong: giữa nâng lên, góc vểnh, ánh vàng ở mép ngói
    d_ = 'M330 226Q344 232 356 232Q640 196 924 232Q936 232 950 226L846 166Q640 132 434 166Z'
    o += V.tiles(d_, 326, 134, 954, 240, '#3A3440', '#17141C', 9)
    for x in range(352, 930, 13):
        o += '<path d="M%d %.1fq6.5 6 13 0" stroke="#F7C860" stroke-width="2.4" fill="#5A4A3A"/><path d="M%d %.1fL%d %.1f" stroke="#7A6A58" stroke-width="1.1" opacity=".6"/>' % (x, Ye(x), x + 6, Ye(x) - 2, 640 + (x + 6 - 640) * .66, 160 - 12 * (1 - ((x - 640) / 300) ** 2))
    o += '<path d="M352 232Q640 196 928 232" stroke="#F2B84A" stroke-width="2.4" fill="none"/>'
    # băng bờ nóc cong + hoa văn vàng + rồng chầu ngọc
    o += '<path d="M424 168Q640 128 856 168L856 146Q640 106 424 146Z" fill="#5A2A1A" stroke="#E9B44C" stroke-width="2.4"/>'
    for k in range(25):
        x = 436 + k * 17; y = 157 - 20 * (1 - ((x - 640) / 216) ** 2)
        o += '<path d="M%d %.0fl6 -6l6 6l-6 6Z" fill="#F7D35A" stroke="#7A5010" stroke-width=".7"/>' % (x - 6, y)
    for sg in (-1, 1):
        o += spiral(640 + sg * 74, 112, 16, sg) + spiral(640 + sg * 44, 116, 11, sg) + spiral(640 + sg * 190, 134, 13, sg)
        o += '<path d="M%d 124Q%d 96 %d 100" stroke="#E9B44C" stroke-width="5" fill="none" stroke-linecap="round"/>' % (640 + sg * 100, 640 + sg * 62, 640 + sg * 28)
        o += '<path d="M%d 150q%d -6 %d -24q%d 4 %d 12" fill="none" stroke="%s" stroke-width="6" stroke-linecap="round"/>' % (640 + sg * 216, sg * 20, sg * 24, -sg * 2, -sg * 12, gold)
        o += '<path d="M%d 226q%d -6 %d -20" fill="none" stroke="#7A6A58" stroke-width="5" stroke-linecap="round"/>' % (640 + sg * 304, sg * 12, sg * 14)
    o += '<circle cx="640" cy="98" r="11" fill="#E2483E" stroke="#E9B44C" stroke-width="3"/><path d="M640 86q-10 -12 0 -24q10 12 0 24Z" fill="#F7B91A"/><path d="M624 90q-8 -10 -2 -20M656 90q8 -10 2 -20" stroke="#F7B91A" stroke-width="3" fill="none" stroke-linecap="round"/>'
    return o

def shophouse(x, y, w_, h_, wall='#E8B23E'):
    o = '<rect x="%d" y="%d" width="%d" height="%d" fill="%s" stroke="#2A1810" stroke-width="1.6"/>' % (x, y, w_, h_, wall)
    for _ in range(int(w_ * h_ / 2600)): o += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="#9A6A1E" opacity=".25"/>' % (Rr.randint(x + 5, x + w_ - 5), Rr.randint(y + 5, y + h_ - 5), Rr.randint(5, 20), Rr.randint(3, 8))
    return o + '<rect x="%d" y="%d" width="%d" height="26" fill="url(#es)"/>' % (x, y, w_)

def litwin(x, y, w_=30, h_=42):
    return '<rect x="%d" y="%d" width="%d" height="%d" fill="#FFD27A" stroke="#3A1F12" stroke-width="2"/><path d="M%d %dv%dM%d %dh%d" stroke="#3A1F12" stroke-width="1.6"/>' % (x, y, w_, h_, x + w_ / 2, y, h_, x, y + h_ / 2, w_) + halo(x + w_ / 2, y + h_ / 2, w_ * 1.3, .5) + ''.join('<rect x="%d" y="%d" width="%d" height="%d" fill="#2F6A5A" stroke="#1A3A30"/>' % (xx, y, w_ * .36, h_) for xx in (x - w_ * .38, x + w_ + 1))

# ---------- lớp chi tiết Hội An ----------
def moss(x0, y0, x1, y1, n=30):
    o = ''
    for _ in range(n):
        o += '<ellipse cx="%d" cy="%d" rx="%.1f" ry="%.1f" fill="%s" opacity=".75"/>' % (Rr.randint(x0, x1), Rr.randint(y0, y1), Rr.uniform(2, 8), Rr.uniform(1.4, 3.6), Rr.choice(['#3E6A3A', '#5A8A44', '#2F5A3A']))
    return o

def vine(x, y, L=70):
    o = '<path d="M%d %dq%d %d %d %d" stroke="#2F6A3A" stroke-width="1.4" fill="none"/>' % (x, y, Rr.randint(-8, 8), L / 2, Rr.randint(-6, 6), L)
    for k in range(int(L / 7)): o += '<ellipse cx="%d" cy="%d" rx="4" ry="2.4" fill="%s" transform="rotate(%d %d %d)"/>' % (x + Rr.randint(-5, 5), y + k * 7, Rr.choice(['#2FA860', '#3CCB6B', '#1F8A4E']), Rr.randint(-50, 50), x, y + k * 7)
    return o

def bougain(x0, y0, x1, y1, n=120):
    o = ''
    for _ in range(n): o += '<circle cx="%d" cy="%d" r="%.1f" fill="%s"/>' % (Rr.randint(x0, x1), Rr.randint(y0, y1), Rr.uniform(1.6, 4.6), Rr.choice(['#E8418F', '#F268A6', '#D92F78', '#FF8AC0', '#2FA860', '#1F8A4E']))
    return o

def balcony(x, y, w_):
    o = '<rect x="%d" y="%d" width="%d" height="5" fill="#6B3E1E" stroke="#2A1208"/>' % (x, y, w_)
    for k in range(int(w_ / 7)): o += '<path d="M%d %dv-22" stroke="#7A4A26" stroke-width="2.4"/>' % (x + 3 + k * 7, y)
    o += '<rect x="%d" y="%d" width="%d" height="4" fill="#8F5A2E" stroke="#2A1208"/>' % (x, y - 25, w_)
    for k in range(int(w_ / 30)):
        px = x + 8 + k * 30
        o += '<path d="M%d %dh14l-2 9h-10Z" fill="#B9694C" stroke="#2A1208" stroke-width=".8"/>' % (px, y - 35) + ''.join('<circle cx="%d" cy="%d" r="2.6" fill="%s"/>' % (px + Rr.randint(0, 14), y - 38 - Rr.randint(0, 7), Rr.choice(['#F268A6', '#F7D21A', '#2FA860', '#E2483E'])) for _ in range(8))
    return o

def sign(x, y, w_, t):
    return '<rect x="%d" y="%d" width="%d" height="18" rx="2" fill="#2A1A14" stroke="#D1A24A" stroke-width="1.4"/><text x="%d" y="%d" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="12" fill="#F7D96A">%s</text>' % (x, y, w_, x + w_ / 2, y + 13, t)

def table(x, y):
    o = '<ellipse cx="%d" cy="%d" rx="22" ry="5" fill="#E8604C" stroke="#7A2A1A"/><rect x="%d" y="%d" width="4" height="24" fill="#4E2A16"/>' % (x, y, x - 2, y + 2)
    for sg in (-1, 1): o += '<rect x="%d" y="%d" width="10" height="4" fill="#6B3E1E"/><path d="M%d %dv14M%d %dv14" stroke="#4E2A16" stroke-width="1.6"/>' % (x + sg * 30 - 5, y + 10, x + sg * 30 - 4, y + 12, x + sg * 30 + 4, y + 12)
    return o + '<circle cx="%d" cy="%d" r="3" fill="#fff"/><circle cx="%d" cy="%d" r="3" fill="#fff"/><rect x="%d" y="%d" width="3" height="8" fill="#7FD45A"/><circle cx="%d" cy="%d" r="2.4" fill="#FFE29A"/>' % (x - 10, y - 1, x + 10, y - 1, x - 1, y - 9, x, y - 12)

def stall(x, y, c='#E2483E'):
    o = '<rect x="%d" y="%d" width="62" height="26" fill="#8F5A2E" stroke="#2A1208"/>' % (x, y)
    for k in range(5): o += '<ellipse cx="%d" cy="%d" rx="6" ry="4" fill="%s" stroke="#2A1208" stroke-width=".7"/>' % (x + 8 + k * 11, y, LC_[k % 6])
    o += '<path d="M%d %dL%d %dH%dL%d %dZ" fill="%s" stroke="#2A1208"/>' % (x - 8, y - 16, x, y - 36, x + 62, x + 70, y - 16, c)
    for k in range(7): o += '<path d="M%d %dL%d %d" stroke="#fff" stroke-width="3" opacity=".5"/>' % (x - 6 + k * 13, y - 16, x + 2 + k * 10, y - 36)
    return o

def bridge_detail():
    o = ''
    for x, w_ in ((346, 84), (850, 84)):
        o += moss(x + 2, 346, x + w_ - 2, 384, 30) + '<rect x="%d" y="258" width="%d" height="44" rx="3" fill="none" stroke="#8A3A48" stroke-width="1.6"/>' % (x + 14, w_ - 28)
    for x, w_ in ((432, 60), (788, 60)):
        cx = x + w_ / 2
        for k in range(12):
            t = math.pi * (1 - k / 11)
            o += '<path d="M%.0f %.0fL%.0f %.0f" stroke="#7A5A30" stroke-width="1.3"/>' % (cx + math.cos(t) * 30, 386 - math.sin(t) * 30, cx + math.cos(t) * 38, 386 - math.sin(t) * 38)
    o += moss(492, 450, 558, 474, 22) + moss(722, 450, 788, 474, 22)
    for x in (500, 780, 450, 830): o += vine(x, 346, Rr.randint(36, 70))
    for k in range(5): o += den(474 + k * 83, int(Ye(474 + k * 83)) + 4, .62, LC_[k % 6], 6)
    return o

def amroof(cx, y, w_, h_, gable=True):
    """Mái ngói âm dương: hàng rãnh dọc, ngói ống, rêu; bờ nóc đắp vữa, đầu hồi cong."""
    L, Rr_ = cx - w_ / 2, cx + w_ / 2; tl, tr = cx - w_ * .36, cx + w_ * .36
    d_ = 'M%.0f %.0fL%.0f %.0fH%.0fL%.0f %.0fQ%.0f %.0f %.0f %.0fZ' % (L - 8, y, tl, y - h_, tr, Rr_ + 8, y, cx, y + 7, L - 8, y)
    cid = V.uid()
    o = '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="#5A4A40" stroke="#1E1612" stroke-width="1.6"/><g clip-path="url(#%s)">' % (cid, d_, d_, cid)
    n = int(w_ / 8)
    for k in range(n + 1):
        xb, xt = L - 8 + (w_ + 16) * k / n, tl + (tr - tl) * k / n
        o += '<path d="M%.1f %.0fL%.1f %.0f" stroke="%s" stroke-width="5"/><path d="M%.1f %.0fL%.1f %.0f" stroke="#2A201C" stroke-width="1.3"/><path d="M%.1f %.0fL%.1f %.0f" stroke="#9A8A7A" stroke-width="1" opacity=".55"/>' % (xb, y + 6, xt, y - h_, Rr.choice(['#6A5648', '#74604E', '#5E4C42']), xb + 3.4, y + 6, xt + 2.4, y - h_, xb - 1.4, y + 6, xt - 1, y - h_)
    for _ in range(int(w_ / 8)): o += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" opacity=".5"/>' % (Rr.randint(int(L), int(Rr_)), Rr.randint(int(y - h_), int(y)), Rr.randint(5, 16), Rr.randint(2, 4), Rr.choice(['#5E7A3A', '#2A201C']))
    o += '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="url(#rs)"/></g>' % (L - 10, y - h_, w_ + 20, h_ + 8)
    o += '<path d="M%.0f %.0fH%.0f" stroke="#C9BCA2" stroke-width="7" stroke-linecap="round"/><path d="M%.0f %.0fH%.0f" stroke="#1E1612" stroke-width="1"/>' % (tl - 5, y - h_, tr + 5, tl - 5, y - h_ + 4, tr + 5)
    for x, sg in ((tl - 5, -1), (tr + 5, 1)): o += '<path d="M%.0f %.0fq%d -2 %d -12q%d 2 %d 7" stroke="#C9BCA2" stroke-width="5" fill="none" stroke-linecap="round"/>' % (x, y - h_, sg * 8, sg * 9, -sg * 1, -sg * 6)
    for k in range(int(w_ / 11)): o += '<circle cx="%.0f" cy="%.0f" r="3" fill="#A89A84" stroke="#2A201C" stroke-width=".7"/>' % (L + k * 11 + 2, y + 4 - 4 * (1 - abs(2 * k * 11 / w_ - 1)) * -1)
    return o

def wallstain(x, y, w_, h_):
    o = ''
    for _ in range(int(w_ * h_ / 1000)): o += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" opacity=".24"/>' % (Rr.randint(x + 4, x + w_ - 4), Rr.randint(y + 3, y + h_ - 3), Rr.randint(4, 22), Rr.randint(2, 9), Rr.choice(['#9A6A1E', '#7A5A2A', '#6E7A3A', '#FFE29A']))
    o += '<path d="M%d %dq4 %d 1 %d M%d %dq-3 %d 2 %d" stroke="#8A6424" stroke-width="2" opacity=".35" fill="none"/>' % (x + 12, y, h_ * .3, h_ * .6, x + w_ - 14, y, h_ * .2, h_ * .5)
    return o

def oldhouse(x, base, w_, kind=0):
    """Nhà phố cổ: trệt gỗ cửa bức bàn có mắt cửa, gác hiên gỗ, tường vàng ố, mái âm dương, đèn lồng."""
    H1, H2 = 96, 92
    o = '<rect x="%d" y="%d" width="%d" height="%d" fill="%s" stroke="#1E1612" stroke-width="1.6"/>' % (x, base - H1 - H2, w_, H2, ['#E8B23E', '#F0C25A', '#D9A234'][kind % 3]) + wallstain(x, base - H1 - H2, w_, H2)
    # gác: cửa chớp xanh + hiên gỗ
    n = 1 if w_ < 150 else 2
    for k in range(n):
        wx = x + w_ * (k + .5) / n - 22
        o += '<rect x="%d" y="%d" width="44" height="58" fill="#3A1F12" stroke="#1E1612"/><rect x="%d" y="%d" width="10" height="58" fill="#2F6A5A" stroke="#143A30"/><rect x="%d" y="%d" width="10" height="58" fill="#2F6A5A" stroke="#143A30"/>' % (wx, base - H1 - H2 + 16, wx - 10, base - H1 - H2 + 16, wx + 44, base - H1 - H2 + 16)
        for j in range(1, 9): o += '<path d="M%d %dh10M%d %dh10" stroke="#7FCDB4" stroke-width=".8"/>' % (wx - 10, base - H1 - H2 + 16 + j * 6, wx + 44, base - H1 - H2 + 16 + j * 6)
        o += '<rect x="%d" y="%d" width="44" height="30" fill="#FFD27A"/>' % (wx, base - H1 - H2 + 26) + halo(wx + 22, base - H1 - H2 + 40, 30, .5)
    o += balcony(x - 4, base - H1 - 6, w_ + 8)
    o += amroof(x + w_ / 2, base - H1 - H2 + 2, w_ + 26, 54)
    # mái hiên ngói giữa hai tầng
    o += amroof(x + w_ / 2, base - H1 + 6, w_ + 18, 18).replace('#C9BCA2" stroke-width="7"', '#7A6A58" stroke-width="3"')
    # tầng trệt gỗ
    o += '<rect x="%d" y="%d" width="%d" height="%d" fill="#5A3418" stroke="#1E1612" stroke-width="1.6"/>' % (x, base - H1 + 8, w_, H1 - 8)
    pw = w_ / 6
    for k in range(6):
        px = x + k * pw
        if k in (2, 3):
            o += '<rect x="%.0f" y="%d" width="%.0f" height="%d" fill="#FFC66E" stroke="#3A1F12"/>' % (px + 1, base - H1 + 26, pw - 2, H1 - 26)
        else:
            o += '<rect x="%.0f" y="%d" width="%.0f" height="%d" fill="#6E4226" stroke="#2A1208"/>' % (px + 2, base - H1 + 26, pw - 4, H1 - 26)
            for j in range(3): o += '<rect x="%.0f" y="%d" width="%.0f" height="%d" fill="#7E5230" stroke="#3A1F12" stroke-width=".8"/>' % (px + 6, base - H1 + 30 + j * 21, pw - 12, 17)
    o += '<rect x="%d" y="%d" width="%d" height="16" fill="#3A1F12" stroke="#1E1612"/>' % (x + 3, base - H1 + 10, w_ - 6)
    # mắt cửa: đặc trưng nhà Hội An
    for sg in (-1, 1):
        ex = x + w_ / 2 + sg * pw * .55
        o += '<circle cx="%.0f" cy="%d" r="7" fill="#E9B44C" stroke="#1E1612"/><path d="M%.0f %da7 7 0 0 0 0 14Z" fill="#1E1612"/><circle cx="%.0f" cy="%d" r="1.6" fill="#E9B44C"/>' % (ex, base - H1 + 18, ex, base - H1 + 11, ex, base - H1 + 14)
    o += halo(x + w_ / 2, base - 40, 56, .55)
    for k, fx in enumerate((.1, .5, .9)): o += den(int(x + w_ * fx), base - H1 + 10, .72, LC_[(k + kind) % 6], 5)
    return o

def far_town():
    o = ''
    for x, w_, h_ in [(300, 70, 60), (360, 60, 46), (880, 76, 54), (930, 60, 66)]:
        o += '<rect x="%d" y="%d" width="%d" height="%d" fill="#7A5A5A"/><path d="M%d %dL%d %dL%d %dZ" fill="#2A2438"/>' % (x, 250 - h_, w_, h_, x - 6, 250 - h_, x + w_ / 2, 226 - h_, x + w_ + 6, 250 - h_)
    for _ in range(14): o += '<circle cx="%d" cy="%d" r="2" fill="#FFD27A"/>' % (Rr.choice([Rr.randint(304, 410), Rr.randint(884, 980)]), Rr.randint(196, 244))
    for x, y in [(520, 84), (560, 66), (612, 92), (760, 76), (810, 96)]: o += '<path d="M%d %dq6 -6 11 0q5 -6 11 0" stroke="#141A3A" stroke-width="2" fill="none" stroke-linecap="round"/>' % (x, y)
    return o

def r5f():
    o = '<radialGradient id="hg"><stop offset="0" stop-color="#FFD27A" stop-opacity=".85"/><stop offset=".5" stop-color="#FFAE4A" stop-opacity=".3"/><stop offset="1" stop-color="#FFAE4A" stop-opacity="0"/></radialGradient>'
    o += '<linearGradient id="skyH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16307A"/><stop offset=".45" stop-color="#4A5FB0"/><stop offset=".72" stop-color="#E88A7A"/><stop offset="1" stop-color="#FFC27A"/></linearGradient>'
    o += '<linearGradient id="wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3A5A"/><stop offset=".5" stop-color="#143A5A"/><stop offset="1" stop-color="#0B2A44"/></linearGradient>'
    o += '<rect width="1280" height="480" fill="url(#skyH)"/>'
    for x, y, w_, h_, c_ in [(120, 70, 300, 26, '#F7A08A'), (420, 110, 240, 18, '#FFC4A0'), (760, 60, 360, 30, '#F08AA0'), (980, 130, 240, 18, '#FFC4A0'), (240, 150, 200, 14, '#FFB08A')]:
        o += '<ellipse class="drift" style="--t:300s;--d:-%ds" cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" opacity=".75"/>' % (x % 40, x, y, w_ / 2, h_, c_)
    for _ in range(40): o += '<circle class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" r="1.2" fill="#fff"/>' % (Rr.uniform(2, 5), Rr.uniform(0, 4), Rr.randint(0, 1280), Rr.randint(0, 110))
    o += far_town()
    # phố xa hai bên cầu, cây tối
    for x, w_ in ((-20, 0),): pass
    o += '<g style="filter:brightness(.55) saturate(1.1)">' + V.tree(330, 300, 1.2) + V.tree(960, 280, 1.1) + V.tree(1250, 370, 2.4) + '</g>'
    # DÃY NHÀ PHỐ CỔ HAI BÊN: phối cảnh, xa nhỏ dần về phía cầu
    def row(x, b_, s_, k, name=None):
        o_ = '<g transform="translate(%d %d) scale(%.2f) translate(0 -396)">' % (x, b_, s_) + oldhouse(0, 396, 130, k)
        if name: o_ += sign(25, 396 - 96 + 9, 80, name)
        return o_ + '</g>'
    for x, b_, s_, k, nm in ((326, 388, .6, 2, None), (242, 392, .78, 1, None), (106, 400, 1.04, 0, 'Quán Xưa'), (-96, 412, 1.5, 2, None)): o += row(x, b_, s_, k, nm)
    for x, b_, s_, k, nm in ((934, 364, .6, 1, None), (1012, 368, .78, 2, None), (1112, 374, 1.04, 0, 'Tiệm Lụa'), (1246, 386, 1.5, 1, None)): o += row(x, b_, s_, k, nm)
    o += bougain(230, 170, 250, 300, 110) + bougain(1098, 150, 1118, 280, 110) + vine(344, 230, 60) + vine(940, 220, 60)
    # MẶT NƯỚC + bóng
    o += '<rect y="440" width="1280" height="280" fill="url(#wat)"/>'
    o += '<filter id="wob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".006 .1" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient><mask id="fm"><rect y="470" width="1280" height="250" fill="url(#fade)"/></mask>'
    o += '<g filter="url(#wob)" mask="url(#fm)">' + ''.join('<rect x="%d" y="%d" width="%d" height="%d" fill="%s" opacity=".5"/>' % (x_, 520 + (i_ % 3) * 12, w_, 120 + (i_ % 4) * 30, c_) for i_, (x_, w_, c_) in enumerate([(20, 70, '#FFC66E'), (150, 60, '#FFC66E'), (250, 50, '#E8B23E'), (340, 30, '#FFC66E'), (940, 34, '#FFC66E'), (1010, 50, '#E8B23E'), (1120, 66, '#FFC66E'), (1216, 60, '#FFC66E')])) + '</g>'
    wc = V.uid()
    o += '<clipPath id="%s"><rect y="470" width="1280" height="250"/></clipPath><g clip-path="url(#%s)"><g filter="url(#wob)" mask="url(#fm)"><g transform="translate(0 948) scale(1 -1)">' % (wc, wc) + bridge_dusk().replace('Lai Viễn Kiều', '') + '</g></g></g>'
    for _ in range(170):
        x = Rr.choice([Rr.randint(0, 1280), Rr.randint(430, 850)]); y = Rr.randint(476, 716); w_ = Rr.randint(16, 70)
        o += '<path class="lap" style="--t:%.1fs;--d:-%.1fs" d="M%d %dh%d" stroke="%s" stroke-width="2.2" opacity="%.2f" stroke-linecap="round"/>' % (Rr.uniform(3, 6), Rr.uniform(0, 4), x, y, w_, Rr.choice(['#FFC66E', '#FFE29A', '#F2884A', '#BFE4FF']), Rr.uniform(.25, .75))
    # KÈ + VỈA HÈ hai bên
    o += '<path d="M-10 390H420V418L-10 540Z" fill="#B99A72" stroke="#2A1810" stroke-width="1.6"/>'
    for k in range(1, 7): o += '<path d="M%d 392L%d 530" stroke="#8F7450" stroke-width="1.2"/><path d="M-10 %dL%d %d" stroke="#8F7450" stroke-width="1.2"/>' % (k * 66, k * 40 - 90, 396 + k * 20, 420 - k * 44, 396 + k * 4)
    o += stonequay((-10, 540), (420, 418), (420, 474), (-10, 620))
    o += '<path d="M1290 366H860V418L1290 590Z" fill="#B99A72" stroke="#2A1810" stroke-width="1.6"/>'
    for k in range(1, 9): o += '<path d="M%d 368L%d 580" stroke="#8F7450" stroke-width="1.2"/>' % (860 + k * 52, 900 + k * 66)
    for k in range(1, 6): o += '<path d="M%d %dH1290" stroke="#8F7450" stroke-width="1.2"/>' % (860 + k * 44, 366 + k * 36)
    o += stonequay((860, 418), (1290, 590), (1290, 672), (860, 474))
    # lát đá từng viên trên hai vỉa hè
    def slabs(top, bot, xl, xr):
        o_ = ''
        y_ = top; row = 0
        while y_ < bot:
            h_ = 11 + (y_ - top) * .06; x_ = xl - (row % 2) * 22
            while x_ < xr:
                w_ = 40 + Rr.randint(0, 16) + (y_ - top) * .2
                o_ += '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" rx="2" fill="%s" stroke="#7A6244" stroke-width=".9"/>' % (x_, y_, w_ - 2, h_ - 1.5, Rr.choice(['#C4A67E', '#B99A72', '#CFB48C', '#A98C66', '#BFA078']))
                x_ += w_
            y_ += h_; row += 1
        return o_
    ca, cb = V.uid(), V.uid()
    o += '<clipPath id="%s"><path d="M-10 390H420V418L-10 540Z"/></clipPath><clipPath id="%s"><path d="M1290 366H860V418L1290 590Z"/></clipPath>' % (ca, cb)
    o += '<g clip-path="url(#%s)">%s</g><g clip-path="url(#%s)">%s</g>' % (ca, slabs(390, 545, -30, 430), cb, slabs(366, 595, 850, 1300))
    for x, y in ((90, 560), (250, 500), (350, 470), (1010, 510), (1160, 580)): o += halo(x, y, 34, .9)
    o += '<g style="filter:brightness(.95)">' + bridge_dusk() + '</g>' + bridge_detail()
    # rêu, cỏ, dây buộc thuyền, bậc xuống nước
    o += moss(0, 540, 420, 620, 70) + moss(860, 470, 1280, 670, 80)
    for k in range(6):
        t = k / 5; x = 40 + 340 * t; y = 540 - 118 * t
        o += '<rect x="%d" y="%d" width="4" height="14" fill="#3A2A20" stroke="#1A120C"/><path d="M%d %dq12 22 %d 30" stroke="#C9A464" stroke-width="1.2" fill="none"/>' % (x, y - 10, x + 2, y, 26)
    for k in range(5): o += '<rect x="%d" y="%d" width="%d" height="7" fill="#8A7A62" stroke="#2A2218"/>' % (960 + k * 6, 452 + k * 8, 64)
    for x, y in ((180, 520), (300, 486), (1120, 540), (1220, 584)): o += vine(x, y, 34)
    # hàng chậu cau trái + đèn phố phải
    for k in range(6): t = k / 5; o += palm(int(392 - 320 * t), int(414 + 88 * t), .62 + t * .62)
    o += '<rect x="1072" y="248" width="6" height="200" fill="#2A2A3A"/><path d="M1062 248h26l-5 -22h-16Z" fill="#FFE29A" stroke="#2A2A3A" stroke-width="2"/>' + halo(1075, 238, 70)
    # người đi bộ, xe đạp, gánh hàng
    o += walker(930, 404, '#D9543C', s=.82) + walker(958, 410, '#2FB8C6', '#7A4A2A', s=.84) + V.non(1096, 456, '#2E5AA8', True) + bike(1140, 512) + walker(1230, 530, '#F2C25A', s=1.1) + V.non(1040, 410, '#C7321F')
    o += table(60, 432) + table(176, 418) + stall(1176, 400, '#2FB8C6')
    o += walker(40, 454, '#7FD45A', s=1) + walker(130, 436, '#F268A6', '#3A2A20', s=.94) + V.non(210, 424, '#2F8F5B')
    o += V.kitsu(1000, 472, 92, 'ehappy', 'walk')
    # thuyền nhỏ buộc bờ, gợn nước, ánh đèn, súng
    for x, y, c_ in ((116, 584, '#2F6A5A'), (258, 548, '#8F3A2A')):
        o += '<g class="rock"><path d="M%d %dq50 26 104 -6l-12 16q-40 16 -80 4Z" fill="%s" stroke="#120A08" stroke-width="1.6"/><path d="M%d %dq50 20 96 -2" stroke="#EFE6CC" stroke-width="2" fill="none"/></g>' % (x, y, c_, x + 6, y + 3)
    for _ in range(120):
        x, y = Rr.randint(0, 1280), Rr.randint(486, 716)
        o += '<ellipse class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" rx="%d" ry="1.2" fill="%s"/>' % (Rr.uniform(2, 5), Rr.uniform(0, 4), x, y, Rr.randint(2, 7), Rr.choice(['#FFE29A', '#FFC66E', '#fff']))
    for x, y in ((60, 640), (96, 662), (1190, 690), (1230, 660)): o += V.lotusleaf(x, y, 15)
    # thuyền lớn + hoa đăng
    o += '<g class="rock"><g transform="translate(600 586)"><ellipse cy="30" rx="130" ry="12" fill="#FFAE4A" opacity=".28"/><path d="M-118 -8Q-90 34 -40 36H52Q104 34 124 -14Q60 8 -20 6Q-80 6 -118 -8Z" fill="#B5622E" stroke="#2A1208" stroke-width="2"/><path d="M-112 -4Q-20 12 120 -10" stroke="#E9A23C" stroke-width="3.4" fill="none"/><path d="M-104 8Q-20 26 112 2M-92 18Q-20 34 96 14M-74 26Q-10 38 72 26" stroke="#7A3A18" stroke-width="1.4" fill="none"/><path d="M-70 2v20M-30 7v26M10 8v26M50 4v26" stroke="#5A2A10" stroke-width="2"/><circle cx="104" cy="2" r="5" fill="#fff" stroke="#2A1208"/><circle cx="105" cy="2" r="2.4" fill="#2A1208"/>'
    o += '<g transform="translate(-48 4) scale(1.05)">' + V.non(0, 0, '#D9543C').replace('<ellipse cy="1" rx="11" ry="3.4" fill="#0A4A30" opacity=".3"/>', '') + '</g><g transform="translate(14 8) scale(.95)">' + V.non(0, 0, '#E86AA8').replace('<ellipse cy="1" rx="11" ry="3.4" fill="#0A4A30" opacity=".3"/>', '') + '</g>'
    o += '<path d="M-58 -30L-70 -78" stroke="#6B3E1E" stroke-width="3.4"/><path d="M-60 4L-104 70" stroke="#8F5A2E" stroke-width="3"/>' + hoadang(70, -6, .8, '#7FD45A') + hoadang(92, -10, .8, '#F268A6') + '</g></g>'
    # thuyền kết đèn xa bên phải
    o += '<g class="rock" style="animation-delay:-1.4s"><g transform="translate(1010 640) scale(.92)"><path d="M-110 -6Q-60 30 0 30T120 -12L100 6H-90Z" fill="#20506A" stroke="#0C2030" stroke-width="2"/><path d="M-80 -6V-70M80 -6V-70M-90 -70Q0 -96 90 -70" stroke="#4E2A16" stroke-width="3" fill="none"/>'
    for k in range(9):
        o += den(-84 + k * 21, -80 + int(abs(k - 4) * 3), .46, LC_[k % 6], 3) + den(-84 + k * 21, -46, .46, LC_[(k + 3) % 6], 3)
    o += '</g></g>'
    for x, y, s_ in [(x_, y_, s_) for x_, y_, s_ in [(Rr.randint(200, 900), Rr.randint(520, 712), Rr.uniform(.6, 1.15)) for _ in range(44)] if not (450 < x_ < 760 and 500 < y_ < 650)][:24]:
        o += hoadang(x, y, s_, Rr.choice(LC_))
    for t_, x, y, dn in [('Chùa Cầu', 640, 40, True), ('Đèn lồng', 70, 250, True), ('Hoa đăng', 330, 620, False), ('Thuyền', 760, 540, False), ('Nhà cổ', 1180, 96, False)]:
        o += bubble(x, y, t_, dn)
    hud = '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">Về bản đồ</span><span class="pill">Hội An</span></div>'
    V.write('R5Arrive', 'Kids World, Hội An hoàng hôn', 1280, 720, '<div class="v" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" role="img" aria-label="Hội An lúc hoàng hôn: Chùa Cầu, phố đèn lồng, hoa đăng trên sông"><defs>' + V.DEFS + '</defs>' + o + '<rect width="1280" height="720" filter="url(#grain)" opacity=".25"/></svg>' + hud + '</div>')

if __name__ == '__main__':
    r5d(); r5d('R5North', .4, 1500, 1050, 'Kids World, miền Bắc'); r5d('R5South', .4, 1500, 4040, 'Kids World, miền Nam'); r5f(); r6b(); print('ok')



