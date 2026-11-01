# Cảnh địa điểm tầng 2: Nhật Bản (PJapan), hồ hoa anh đào dưới núi Phú Sĩ, cổng torii, chùa 5 tầng, quán sushi, sạp trái cây, dã ngoại ngắm hoa.
#   BOARD_OUT=<project> PYTHONIOENCODING=utf-8 python gen_places_japan.py
# Dùng lại hàm của gen_places_south (page, cloud, lin, water_defs, reflect, CSS). 5 biển: Sushi, Cherry, Salad, Pear, Kiwi (bước bài 0..4).
import math, random, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gen_places_south as S
G = S.G
V = G.V
INK = S.INK
R = random.Random(81)
FONT = 'Be Vietnam Pro'

def uid(): return V.uid()

def eave(cx, y, w, h, c1='#4A5560', c2='#2E3640', up=12):
    """Mái ngói xám cong vút: mép dưới võng, hai đầu hất lên, vạch ngói."""
    L, Rr = cx - w / 2, cx + w / 2
    d = 'M%.0f %.0fQ%.0f %.0f %.0f %.0fL%.0f %.0fQ%.0f %.0f %.0f %.0fQ%.0f %.0f %.0f %.0fL%.0f %.0fQ%.0f %.0f %.0f %.0fZ' % (
        L - up, y - up * .5, L + 6, y + 6, L + 26, y + 6, Rr - 26, y + 6, Rr - 6, y + 6, Rr + up, y - up * .5,
        Rr - 8, y - 6, cx + w * .3, y - h, cx - w * .3, y - h, L + 8, y - 6, L - up, y - up * .5)
    o = '<path d="%s" fill="%s" stroke="%s" stroke-width="1.6"/>' % (d, c1, INK)
    for k in range(1, 9):
        t = k / 9
        o += '<path d="M%.1f %.1fL%.1f %.1f" stroke="%s" stroke-width="1" opacity=".55"/>' % (cx - w * .3 + t * w * .6, y - h, cx - w / 2 + 10 + t * (w - 20), y + 3, c2)
    return o + '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0f" stroke="#8A97A2" stroke-width="2" fill="none" opacity=".7"/>' % (L - up + 2, y - up * .5 + 2, cx, y + 14, Rr + up - 2, y - up * .5 + 2)

def chochin(x, y, s=1, c='#D9402C'):
    """Lồng đèn giấy đỏ treo, có sọc xương và nắp đen."""
    o = '<g transform="translate(%.0f %.0f) scale(%.2f)"><path d="M0 -26V-16" stroke="%s" stroke-width="1.6"/><ellipse cy="14" rx="14" ry="19" fill="%s" stroke="%s" stroke-width="1.4"/>' % (x, y, s, INK, c, INK)
    for k in (-8, -3, 3, 8): o += '<path d="M%d -3Q%d 14 %d 31" stroke="#8F2218" stroke-width="1" fill="none" opacity=".7"/>' % (k, k * 1.35, k)
    o += '<ellipse cx="-5" cy="8" rx="3" ry="6" fill="#FF9A82" opacity=".6"/><rect x="-9" y="-6" width="18" height="5" rx="2" fill="#2A2420"/><rect x="-9" y="27" width="18" height="5" rx="2" fill="#2A2420"/><circle cy="14" r="5" fill="#FFE9B0" opacity=".85"/></g>'
    return V.sway(o, x, y - 26 * s, 3.4 + (x % 3) * .3, (x % 5) * .5)

def petal(x, y, dx, dy, t, d, s=1):
    return '<g class="seed" style="--dx:%dpx;--dy:%dpx;--t:%.1fs;--d:-%.1fs"><g transform="translate(%d %d) scale(%.2f)"><path d="M0 0Q-5 -5 -2 -10L0 -8L2 -10Q5 -5 0 0Z" fill="%s" stroke="#D9709A" stroke-width=".6"/></g></g>' % (dx, dy, t, d, x, y, s, R.choice(['#FFD3E0', '#FFC0D4', '#FFE6EE']))

def blossom(cx, cy, rx, ry, n, seed=0):
    """Tán hoa anh đào: chùm tròn hồng nhiều sắc, điểm trắng, nụ sẫm."""
    rr = random.Random(seed or int(cx * 7 + cy))
    pal = ['#F08AAE', '#F7A8C4', '#FBC2D6', '#FFD9E6', '#FFEAF1']
    o = ''
    for _ in range(n):
        a, r_ = rr.uniform(0, 6.283), rr.uniform(0, 1) ** .6
        x, y = cx + math.cos(a) * r_ * rx, cy + math.sin(a) * r_ * ry
        k = int(max(0, min(4, 2.3 + (cy - y) / ry * 1.8 + rr.uniform(-1.1, 1.1))))
        o += '<circle cx="%.0f" cy="%.0f" r="%.1f" fill="%s"/>' % (x, y, rr.uniform(.07, .13) * rx, pal[k])
    for _ in range(int(n * .9)):
        a, r_ = rr.uniform(0, 6.283), rr.uniform(.1, 1)
        o += '<circle cx="%.0f" cy="%.0f" r="2" fill="#FFFFFF" opacity=".8"/>' % (cx + math.cos(a) * r_ * rx, cy + math.sin(a) * r_ * ry)
    for _ in range(int(n * .25)):
        a, r_ = rr.uniform(0, 6.283), rr.uniform(.3, 1)
        o += '<circle cx="%.0f" cy="%.0f" r="2.2" fill="#C9507E" opacity=".75"/>' % (cx + math.cos(a) * r_ * rx, cy + math.sin(a) * r_ * ry)
    return o

def sakura(x, y, h, s=1, lean=0, n=120, seed=0):
    """Cây anh đào: thân sẫm xoắn, cành toả, tán hồng."""
    tx = x + lean
    o = '<path d="M%d %dQ%d %d %d %dL%d %dQ%d %d %d %dZ" fill="#5A4034" stroke="%s" stroke-width="1.5"/>' % (x - 16 * s, y, x - 8 * s, y - h * .5, tx - 8 * s, y - h, tx + 8 * s, y - h, x + 12 * s, y - h * .5, x + 18 * s, y, INK)
    o += '<path d="M%.0f %dQ%.0f %.0f %.0f %.0f" stroke="#7A5A48" stroke-width="3" fill="none" opacity=".7"/>' % (x + 4 * s, y, x + 6 * s, y - h * .5, tx + 2 * s, y - h)
    for k, (sg, bx, by) in enumerate(((-1, 150, 80), (1, 160, 110), (-1, 80, 150), (1, 90, 40), (-1, 190, 30), (1, 210, 70))):
        o += '<path d="M%.0f %.0fQ%.0f %.0f %.0f %.0f" stroke="#5A4034" stroke-width="%.1f" fill="none" stroke-linecap="round"/>' % (tx, y - h + 10, tx + sg * bx * s * .4, y - h - by * s * .4, tx + sg * bx * s, y - h - by * s, 7 * s)
    can = blossom(tx, y - h - 40 * s, 190 * s, 105 * s, n, seed or int(x))
    for sg, bx, by in ((-1, 150, 80), (1, 160, 110), (-1, 190, 30), (1, 210, 70)):
        can += blossom(tx + sg * bx * s, y - h - by * s + 10, 62 * s, 42 * s, int(n * .3), int(x) + bx)
    return o + V.sway(can, tx, y - h, 6.2, (x % 5) * .7)

def sugi(x, y, h, c1='#2F6A4C', c2='#3E8A5E'):
    """Thông tuyết/sugi: tầng lá nhọn chồng lên nhau."""
    o = '<rect x="%.1f" y="%d" width="%.1f" height="%.1f" fill="#4A362A"/>' % (x - h * .02, y - h * .12, h * .04, h * .12)
    for k in range(5):
        w = h * (.34 - k * .056); yy = y - h * .1 - k * h * .18
        o += '<path d="M%.1f %.1fL%.1f %.1fL%.1f %.1fZ" fill="%s"/><path d="M%.1f %.1fL%.1f %.1fL%.1f %.1fZ" fill="%s" opacity=".55"/>' % (x - w, yy, x, yy - h * .26, x + w, yy, c1, x, yy - h * .26, x + w, yy, x, yy, c2)
    return o

def torii(x, y, s=1):
    """Cổng torii đỏ: hai cột, nuki, shimagi và kasagi đen cong."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    for sx in (-52, 52):
        o += '<path d="M%d 0L%d -128H%d L%d 0Z" fill="#E04A30" stroke="%s" stroke-width="2"/><path d="M%d 0L%d -128H%d L%d 0Z" fill="#A82A1A" opacity=".5"/><rect x="%d" y="-6" width="26" height="9" fill="#2A2420"/>' % (sx - 9, sx - 7, sx + 7, sx + 9, INK, sx + 2, sx + 5, sx + 7, sx + 9, sx - 13)
    o += '<rect x="-62" y="-104" width="124" height="11" fill="#E04A30" stroke="%s" stroke-width="2"/>' % INK
    o += '<path d="M-84 -150Q0 -134 84 -150L98 -168Q0 -148 -98 -168Z" fill="#2A2420" stroke="%s" stroke-width="1.5"/><path d="M-70 -134H70V-122H-70Z" fill="#E04A30" stroke="%s" stroke-width="2"/>' % (INK, INK)
    o += '<rect x="-9" y="-134" width="18" height="30" fill="#F2E6C0" stroke="%s" stroke-width="1.4"/><path d="M-90 -156Q0 -138 90 -156" stroke="#7A6A60" stroke-width="2" fill="none" opacity=".8"/>' % INK
    return o + '</g>'

def pagoda(x, y, s=1, n=5):
    """Chùm 5 tầng: thân trắng, cột nâu, mái cong thu nhỏ dần, cột tướng luân (sorin) trên đỉnh."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<rect x="-52" y="-10" width="104" height="10" fill="#8A8278" stroke="%s" stroke-width="1.2"/>' % INK
    yy = -10
    for k in range(n):
        w = 84 - k * 11; bh = 30 - k * 1.5
        o += '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#F2E6CC" stroke="%s" stroke-width="1.2"/>' % (-w / 2 + 6, yy - bh, w - 12, bh, INK)
        for j in range(5):
            o += '<rect x="%.1f" y="%.1f" width="3.4" height="%.1f" fill="#9A3A28"/>' % (-w / 2 + 6 + j * (w - 15.4) / 4, yy - bh, bh)
        o += '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#6A4A3A" opacity=".55"/>' % (-w / 2 + 14, yy - bh * .72, w - 28, bh * .5)
        o += eave(0, yy - bh, w + 34 - k * 3, 17, '#566470', '#2E3640', up=11)
        yy -= bh + 10
    o += '<rect x="-2" y="%.1f" width="4" height="46" fill="#C9A94A" stroke="%s" stroke-width=".8"/>' % (yy - 8 - 36, INK)
    for k in range(5): o += '<ellipse cx="0" cy="%.1f" rx="%.1f" ry="2.4" fill="#E2C25A" stroke="%s" stroke-width=".7"/>' % (yy - 14 - k * 7, 8 - k * 1.3, INK)
    return o + '</g>'

def fuji():
    o = '<path d="M430 392Q560 372 700 214Q752 124 790 122Q828 124 880 214Q1010 372 1150 392Z" fill="url(#fujiG)"/>'
    # mặt khuất nắng (bên phải) và các rãnh
    o += '<path d="M790 122Q828 124 880 214Q1010 372 1150 392H900Q850 300 812 210Z" fill="#4C5E98" opacity=".35"/>'
    for a, b in ((728, 200), (746, 240), (770, 300), (812, 240), (840, 300), (880, 330)):
        o += '<path d="M%d %dQ%d %d %d 384" stroke="#5A6CA8" stroke-width="2.4" fill="none" opacity=".4"/>' % (a, b - 70, a - 4, b + 20, a - 20 + (a - 790) * .5)
    # chỏm tuyết với viền răng cưa
    o += '<path d="M722 188Q756 126 790 122Q826 126 858 190L842 176L832 208L816 178L802 220L788 182L772 214L760 180L744 206Z" fill="#FFFFFF" stroke="#C9D6EC" stroke-width="1.2"/>'
    o += '<path d="M796 124Q826 128 856 188L842 176L832 208L816 178L808 196Q812 150 796 124Z" fill="#CDDAF0" opacity=".75"/>'
    # sương chân núi
    o += '<rect x="400" y="326" width="780" height="70" fill="url(#hazeJ)"/>'
    return o

def yukata(x, y, s=1, c='#F268A6', obi='#C7322E', hair='#2A1E18', flip=False, kid=False):
    """Người mặc kimono/yukata đi bộ nhỏ: thân hình thang, obi, búi tóc, guốc."""
    k = .8 if kid else 1
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)"><ellipse cy="1" rx="13" ry="3.4" fill="#120A08" opacity=".35"/>' % (x, y, -s * k if flip else s * k, s * k)
    o += '<path d="M-6 -2h-4M6 -2h4" stroke="#4A3226" stroke-width="3" stroke-linecap="round"/>'
    o += '<path d="M-7 -40Q-12 -20 -11 -3H11Q12 -20 7 -40Z" fill="%s" stroke="#1A1218" stroke-width=".8"/><path d="M-2 -40L2 -3" stroke="#fff" opacity=".5" stroke-width="1.4"/>' % c
    o += '<circle cx="-5" cy="-24" r="2" fill="#fff" opacity=".7"/><circle cx="5" cy="-14" r="2" fill="#fff" opacity=".7"/>'
    o += '<rect x="-8" y="-34" width="16" height="8" fill="%s" stroke="#1A1218" stroke-width=".7"/><path d="M0 -30l-9 10l5 -2Z" fill="%s"/>' % (obi, obi)
    o += '<path d="M-7 -38Q-13 -30 -9 -24M7 -38Q13 -30 9 -24" stroke="%s" stroke-width="2.6" fill="none" stroke-linecap="round"/>' % c
    o += '<circle cy="-47" r="6.4" fill="#F2C9A0"/><path d="M-7 -48Q-7 -56 0 -55Q7 -56 7 -48Q4 -52 0 -51Q-4 -52 -7 -48Z" fill="%s"/><circle cx="0" cy="-58" r="3.6" fill="%s"/><circle cx="3" cy="-58" r="1.6" fill="#F2C25A"/>' % (hair, hair)
    return o + '</g>'

def schoolkid(x, y, s=1, flip=False, girl=False):
    """Học sinh tiểu học Nhật: nón vàng, cặp randoseru, đồng phục."""
    o = '<g transform="translate(%d %d) scale(%.2f %.2f)"><ellipse cy="1" rx="12" ry="3.2" fill="#120A08" opacity=".35"/>' % (x, y, -s if flip else s, s)
    o += '<path d="M-4 -16L-5 -1H-1L0 -12L3 -1H7L4 -16Z" fill="%s"/>' % ('#F4F0E4')
    o += '<rect x="-12" y="-36" width="9" height="15" rx="3" fill="#C7322E" stroke="#6A1A12" stroke-width=".9"/><rect x="-11" y="-33" width="7" height="4" fill="#E8604C"/>'
    o += '<path d="M-6 -38Q-9 -26 -6 -15H5Q8 -26 6 -38Q0 -41 -6 -38Z" fill="#2E3A6A" stroke="#1A1218" stroke-width=".7"/><path d="M-1 -38V-16" stroke="#fff" stroke-width="1" opacity=".5"/>'
    o += '<path d="M6 -36Q12 -28 9 -20" stroke="#2E3A6A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cy="-46" r="6" fill="#F2C9A0"/>'
    o += '<path d="M-6.4 -48Q-5 -54 0 -53Q5 -54 6.4 -48Q3 -50 0 -49Q-3 -50 -6.4 -48Z" fill="#2A1E18"/>'
    o += '<path d="M-8 -50Q0 -61 8 -50Q0 -53 -8 -50Z" fill="#F7D230" stroke="#9A7A10" stroke-width=".8"/>'
    return o + '</g>'

def noren(x, y, w, h, n, c='#2B4B8C', mark='#F4F0E4'):
    """Rèm noren: các dải vải chàm treo từ thanh ngang, xẻ giữa, có ấn tròn."""
    o = '<rect x="%.0f" y="%.0f" width="%.0f" height="4" rx="2" fill="#4A362A" stroke="%s" stroke-width=".8"/>' % (x - w / 2 - 4, y - 2, w + 8, INK)
    pw = w / n
    for k in range(n):
        px = x - w / 2 + k * pw
        o += '<path d="M%.1f %.0fh%.1fV%.0fQ%.1f %.0f %.1f %.0fZ" fill="%s" stroke="%s" stroke-width="1"/>' % (px + .6, y + 2, pw - 1.2, y + h, px + pw / 2, y + h - 6, px + .6, y + h, c, INK)
    o += '<circle cx="%.0f" cy="%.0f" r="%.0f" fill="none" stroke="%s" stroke-width="2.4"/>' % (x, y + h * .5, h * .22, mark)
    o += '<circle cx="%.0f" cy="%.0f" r="%.1f" fill="%s"/>' % (x, y + h * .5, h * .08, mark)
    return o

def nigiri(x, y, c='#F2764C', s=1):
    return '<g transform="translate(%.0f %.0f) scale(%.2f)"><ellipse cy="2" rx="11" ry="5" fill="#F7F2E4" stroke="#8A8272" stroke-width=".8"/><path d="M-12 0Q0 -9 12 0Q0 3 -12 0Z" fill="%s" stroke="#9A3A20" stroke-width=".8"/><path d="M-6 -3Q0 -6 6 -3" stroke="#FFD0B8" stroke-width="1.2" fill="none" opacity=".8"/></g>' % (x, y, s, c)

def maki(x, y, s=1, fill='#7FC45A'):
    return '<g transform="translate(%.0f %.0f) scale(%.2f)"><ellipse rx="9" ry="7" fill="#2A3A2A" stroke="%s" stroke-width=".8"/><ellipse rx="6.6" ry="5" fill="#F7F2E4"/><ellipse cx="-1.4" rx="2.2" ry="2" fill="%s"/><ellipse cx="2.6" cy="1" rx="1.6" ry="1.5" fill="#F2764C"/></g>' % (x, y, s, INK, fill)

def person_head(x, y, r, skin='#F2C9A0'): return '<circle cx="%.0f" cy="%.0f" r="%d" fill="%s" stroke="%s" stroke-width=".8"/>' % (x, y, r, skin, INK)

def sushi_stall(x, y):
    """Quầy sushi (yatai): mái ngói, rèm noren, đầu bếp, bệ gỗ bày nigiri/maki, hai lồng đèn đỏ."""
    o = '<g transform="translate(%d %d)"><ellipse cy="4" rx="140" ry="9" fill="#120A08" opacity=".28"/>' % (x, y)
    # khung gỗ + vách sau
    o += '<rect x="-108" y="-142" width="216" height="140" fill="#4A362A" stroke="%s" stroke-width="1.6"/><rect x="-102" y="-120" width="204" height="90" fill="#2E2018"/>' % INK
    o += '<rect x="-100" y="-118" width="200" height="86" fill="#F2E6C8"/><path d="M-100 -118H100" stroke="#C9B890" stroke-width="2"/>'
    for k in range(6): o += '<path d="M%d -118V-32" stroke="#D9C8A0" stroke-width="1"/>' % (-100 + k * 40)
    # thực đơn treo giấy dài
    for k in range(4):
        o += '<rect x="%d" y="-112" width="15" height="42" fill="#FFF8E6" stroke="%s" stroke-width=".9"/><path d="M%d -106v28" stroke="#C7322E" stroke-width="2" opacity=".6"/>' % (-82 + k * 22 if k < 2 else 42 + (k - 2) * 22, INK, -74 + k * 22 if k < 2 else 50 + (k - 2) * 22)
    # đầu bếp
    o += '<path d="M-17 -30Q-19 -56 -12 -64H12Q19 -56 17 -30Z" fill="#FFFFFF" stroke="%s" stroke-width="1.2"/><path d="M0 -64L-6 -50L0 -44L6 -50Z" fill="#E9E9E9"/>' % INK
    o += person_head(0, -78, 13) + '<path d="M-13 -80Q0 -98 13 -80V-84Q0 -92 -13 -84Z" fill="#FFFFFF" stroke="%s" stroke-width="1"/><circle cx="-4" cy="-76" r="1.4" fill="%s"/><circle cx="4" cy="-76" r="1.4" fill="%s"/><path d="M-3 -70Q0 -68 3 -70" stroke="#8A3A28" stroke-width="1.2" fill="none"/>' % (INK, INK, INK)
    o += '<path d="M-11 -84H11" stroke="#C7322E" stroke-width="3"/>'
    # mái + noren
    o += eave(0, -140, 252, 30, '#4A5560', '#2E3640', up=16)
    o += noren(0, -138, 208, 32, 6)
    # bệ gỗ + kính bày sushi
    o += '<rect x="-112" y="-30" width="224" height="30" fill="#A8703C" stroke="%s" stroke-width="1.6"/><rect x="-112" y="-34" width="224" height="8" fill="#D9A25C" stroke="%s" stroke-width="1.4"/>' % (INK, INK)
    for k in range(7): o += '<path d="M%d -26V0" stroke="#7A4A22" stroke-width="1" opacity=".6"/>' % (-96 + k * 32)
    # khay gỗ + sushi
    o += '<rect x="-88" y="-42" width="86" height="10" rx="2" fill="#6A4430" stroke="%s" stroke-width="1"/>' % INK
    for i, (px, c) in enumerate(((-78, '#F2764C'), (-60, '#F2C25A'), (-42, '#E24A4A'), (-24, '#F2764C'), (-10, '#FFD0B8'))):
        o += nigiri(px, -45, c, .8)
    o += '<rect x="24" y="-42" width="74" height="10" rx="2" fill="#6A4430" stroke="%s" stroke-width="1"/>' % INK
    for px in (36, 52, 68, 84): o += maki(px, -48, .85, ['#7FC45A', '#F2764C', '#F2C25A', '#E24A4A'][(px // 16) % 4])
    # đĩa tròn lớn có cá
    o += '<ellipse cx="-30" cy="-40" rx="1" ry="1"/>'
    o += chochin(-124, -102, 1.0) + chochin(124, -102, 1.0)
    return o + '</g>'

def fruit_stall(x, y, kind, awn='#3E7CC4', flip=False):
    """Sạp trái cây: mái vải sọc xanh trắng viền cuốn, kệ sau, thùng gỗ và người bán khăn tenugui."""
    o = '<g transform="translate(%d %d)"><ellipse cy="4" rx="124" ry="8" fill="#120A08" opacity=".28"/>' % (x, y)
    o += '<rect x="-108" y="-136" width="9" height="136" fill="#7A5232" stroke="%s" stroke-width="1.2"/><rect x="99" y="-136" width="9" height="136" fill="#7A5232" stroke="%s" stroke-width="1.2"/>' % (INK, INK)
    o += '<rect x="-100" y="-120" width="200" height="90" fill="#5A4034" stroke="%s" stroke-width="1.2"/>' % INK
    # kệ sau
    o += '<rect x="-98" y="-86" width="196" height="5" fill="#8A6444"/><rect x="-98" y="-58" width="196" height="5" fill="#8A6444"/>'
    for k in range(7):
        px = -88 + k * 29
        if kind == 'pear':
            o += fruit('pear', px, -91, 1.0) + fruit('avocado' if k % 2 else 'pear', px + 8, -62, 1.0)
        else:
            o += fruit('kiwi', px, -91, 1.0) + fruit('kiwi' if k % 2 else 'cherry', px + 8, -62, 1.0)
    # người bán
    o += '<path d="M-16 -30Q-18 -52 -10 -60H10Q18 -52 16 -30Z" fill="#F4F0E4" stroke="%s" stroke-width="1.1"/><path d="M-9 -60L0 -30L9 -60Z" fill="#2E5AA8" opacity=".85"/>' % INK
    o += person_head(0, -72, 12) + '<path d="M-12 -74Q0 -90 12 -74V-78Q0 -88 -12 -78Z" fill="#F4F0E4" stroke="%s" stroke-width=".9"/><path d="M-12 -76Q0 -80 12 -76" stroke="#2E5AA8" stroke-width="3"/><circle cx="-4" cy="-70" r="1.3" fill="%s"/><circle cx="4" cy="-70" r="1.3" fill="%s"/><path d="M-3 -65Q0 -63 3 -65" stroke="#8A3A28" stroke-width="1.2" fill="none"/>' % (INK, INK, INK)
    # mái sọc
    o += '<path d="M-124 -112L-100 -144H100L124 -112Z" fill="#F4F0E4" stroke="%s" stroke-width="1.6"/>' % INK
    for k in range(0, 8, 2): o += '<path d="M%d -144h%d L%d -112h-%d Z" fill="%s"/>' % (-100 + k * 25, 25, -124 + k * 31, 31, awn) if False else ''
    st = ''
    for k in range(8):
        a, b = -124 + k * 31, -100 + k * 25
        if k % 2 == 0: st += '<path d="M%d -112L%d -144H%d L%d -112Z" fill="%s"/>' % (a, b, b + 25, a + 31, awn)
    o += st
    sc = ''
    for k in range(8):
        a = -124 + k * 31
        sc += '<path d="M%d -112a15.5 14 0 0 0 31 0Z" fill="%s" stroke="%s" stroke-width="1.4"/>' % (a, awn if k % 2 == 0 else '#F4F0E4', INK)
    o += sc + '<path d="M-124 -112H124" stroke="%s" stroke-width="1.6"/><path d="M-100 -144H100" stroke="%s" stroke-width="2"/>' % (INK, INK)
    # quầy gỗ + thùng trái cây trước mặt
    o += '<rect x="-112" y="-32" width="224" height="32" fill="#A8703C" stroke="%s" stroke-width="1.6"/><rect x="-112" y="-36" width="224" height="8" fill="#D9A25C" stroke="%s" stroke-width="1.4"/>' % (INK, INK)
    for k in range(3):
        cx = -76 + k * 76
        o += '<rect x="%d" y="-52" width="60" height="22" rx="2" fill="#C9965A" stroke="%s" stroke-width="1.2"/><path d="M%d -42h60M%d -36h60" stroke="#8A5E2E" stroke-width="1"/>' % (cx - 30, INK, cx - 30, cx - 30)
        for j in range(6):
            f = ['pear', 'avocado', 'pear'][k] if kind == 'pear' else ['kiwi', 'cherry', 'kiwi'][k]
            o += fruit(f, cx - 24 + j * 9.6, -54 - (j % 2) * 6, 1.05)
    # bảng giá
    for k in range(3):
        o += '<path d="M%d -34v-8" stroke="%s" stroke-width=".8"/>' % (-76 + k * 76, INK)
    return o + '</g>'

def fruit(kind, x, y, s=1):
    g = '<g transform="translate(%.1f %.1f) scale(%.2f)">' % (x, y, s)
    if kind == 'pear':
        g += '<path d="M0 -10C-3 -10 -4 -6 -6 -2C-10 4 -8 12 0 12C8 12 10 4 6 -2C4 -6 3 -10 0 -10Z" fill="#C9D45A" stroke="#6A7A20" stroke-width=".9"/><path d="M-3 4Q-5 0 -3 -4" stroke="#F4F6B0" stroke-width="1.6" fill="none"/><path d="M0 -10Q1 -14 3 -15" stroke="#5A3E22" stroke-width="1.4" fill="none"/><path d="M1 -13Q6 -17 8 -12Q4 -11 1 -13Z" fill="#4CA84A"/>'
    elif kind == 'avocado':
        g += '<path d="M0 -11C-3 -11 -4 -6 -6 -2C-10 3 -8 11 0 11C8 11 10 3 6 -2C4 -6 3 -11 0 -11Z" fill="#2F5A32" stroke="#16301A" stroke-width=".9"/><path d="M-3 4Q-5 0 -3 -4" stroke="#6A9A52" stroke-width="1.4" fill="none" opacity=".8"/>'
    elif kind == 'kiwi':
        g += '<ellipse rx="8.6" ry="6.4" fill="#8A6A3E" stroke="#4A3418" stroke-width=".9"/><ellipse cx="-2" cy="-2" rx="3" ry="2" fill="#B98E5A" opacity=".7"/>' if (int(x) + int(y)) % 2 else '<ellipse rx="8.6" ry="6.4" fill="#8A6A3E" stroke="#4A3418" stroke-width=".9"/><ellipse rx="6.6" ry="4.6" fill="#8FD14F"/><ellipse rx="2.2" ry="1.6" fill="#F2F7C8"/><path d="M-4 0h2M2 -2h2M2 2h2M-1 -3h2" stroke="#1A2A12" stroke-width="1"/>'
    elif kind == 'cherry':
        g += '<path d="M0 -4Q-2 -14 -4 -13M0 -4Q4 -14 6 -12" stroke="#4A7A32" stroke-width="1.2" fill="none"/><circle cx="-4" cy="3" r="5.4" fill="#C7222E" stroke="#6A101A" stroke-width=".8"/><circle cx="6" cy="3" r="5.4" fill="#D9323E" stroke="#6A101A" stroke-width=".8"/><circle cx="-5.6" cy="1.2" r="1.3" fill="#FFB0B8"/><circle cx="4.6" cy="1.2" r="1.3" fill="#FFB0B8"/>'
    return g + '</g>'

def salad_bowl(x, y, s=1):
    """Tô salad gỗ: lá xanh, cà chua bi, dưa leo, ngô, rắc mè."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="8" rx="26" ry="6" fill="#120A08" opacity=".25"/>' % (x, y, s)
    o += '<path d="M-26 -4Q-22 14 0 14Q22 14 26 -4Z" fill="#A8703C" stroke="%s" stroke-width="1.4"/><path d="M-22 3Q0 8 22 3" stroke="#7A4A22" stroke-width="1.2" fill="none"/>' % INK
    leaf = ['#4CA84A', '#7FC45A', '#2F8A3E', '#A6DA6A']
    for k in range(12):
        a = k / 12 * 6.283
        o += '<ellipse cx="%.1f" cy="%.1f" rx="8" ry="5" fill="%s" stroke="#1F5A2A" stroke-width=".7" transform="rotate(%d %.1f %.1f)"/>' % (math.cos(a) * 14, -6 + math.sin(a) * 4, leaf[k % 4], k * 30, math.cos(a) * 14, -6 + math.sin(a) * 4)
    o += '<ellipse cx="0" cy="-10" rx="11" ry="6" fill="#7FC45A" stroke="#1F5A2A" stroke-width=".7"/>'
    for cx, cy in ((-9, -8), (7, -12), (12, -5), (-2, -14)): o += '<circle cx="%d" cy="%d" r="4" fill="#E2483E" stroke="#8A1A14" stroke-width=".8"/><circle cx="%d" cy="%d" r="1.1" fill="#FFC0B0"/>' % (cx, cy, cx - 1.4, cy - 1.4)
    for cx, cy in ((-14, -2), (3, -8), (15, -9)): o += '<ellipse cx="%d" cy="%d" rx="4.4" ry="3.2" fill="#C8E8A0" stroke="#3E7A2A" stroke-width=".8"/><ellipse cx="%d" cy="%d" rx="2.2" ry="1.4" fill="#E4F4C8"/>' % (cx, cy, cx, cy)
    for cx, cy in ((-4, -4), (1, -2), (8, -2)): o += '<circle cx="%d" cy="%d" r="2.4" fill="#F7D230" stroke="#9A7A10" stroke-width=".6"/>' % (cx, cy)
    return o + '</g>'

def bento(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)"><rect x="-22" y="-12" width="44" height="26" rx="4" fill="#C7322E" stroke="%s" stroke-width="1.3"/><rect x="-18" y="-8" width="36" height="18" rx="2" fill="#F4F0E4" stroke="#6A1A12" stroke-width=".8"/>' % (x, y, s, INK)
    o += '<path d="M-2 -8V10" stroke="#C7322E" stroke-width="1.5"/><ellipse cx="-10" cy="1" rx="6.5" ry="6" fill="#FFFFFF" stroke="#8A8272" stroke-width=".8"/><circle cx="-10" cy="-2" r="1.3" fill="#7A2A5A"/>'
    o += '<rect x="2" y="-6" width="14" height="6" rx="2" fill="#F2764C"/><circle cx="6" cy="6" r="3" fill="#4CA84A"/><circle cx="12" cy="6" r="3" fill="#F7D230"/>'
    return o + '</g>'

def onigiri(x, y, s=1):
    return '<g transform="translate(%d %d) scale(%.2f)"><path d="M0 -12Q-12 6 -10 8Q0 11 10 8Q12 6 0 -12Z" fill="#FFFFFF" stroke="#8A8272" stroke-width="1"/><path d="M-6 8Q0 -2 6 8Z" fill="#1F2A24"/></g>' % (x, y, s)

def boat(x, y, s=1):
    """Thuyền gỗ nhỏ trên hồ, người chèo đội nón kasa."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><path d="M-46 -4Q0 12 46 -4L36 8Q0 14 -36 8Z" fill="#8A5A38" stroke="%s" stroke-width="1.4"/><path d="M-46 -4Q0 6 46 -4" stroke="#C9965A" stroke-width="2.4" fill="none"/>' % (x, y, s, INK)
    o += '<path d="M-10 -4L-8 -24H8L10 -4Z" fill="#F4F0E4" stroke="%s" stroke-width="1"/><path d="M-8 -22H8V-18H-8Z" fill="#2E5AA8"/>' % INK
    o += person_head(0, -32, 7) + '<path d="M-14 -31Q0 -48 14 -31Z" fill="#E2C25A" stroke="%s" stroke-width="1"/>' % INK
    return o + '<path d="M16 -14L40 12" stroke="#6A4430" stroke-width="2.6" stroke-linecap="round"/><path d="M36 8L46 16" stroke="#6A4430" stroke-width="4" stroke-linecap="round"/></g>'

def toro(x, y, s=1):
    """Đèn đá toro trước đền."""
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<rect x="-14" y="-6" width="28" height="6" fill="#9A948A" stroke="%s" stroke-width="1"/><rect x="-5" y="-30" width="10" height="26" fill="#B8B2A6" stroke="%s" stroke-width="1"/>' % (INK, INK)
    o += '<rect x="-14" y="-38" width="28" height="9" fill="#9A948A" stroke="%s" stroke-width="1"/><rect x="-9" y="-54" width="18" height="16" fill="#FFE9B0" stroke="%s" stroke-width="1.2"/><rect x="-9" y="-54" width="18" height="16" fill="#FFD27A" opacity=".5"/>' % (INK, INK)
    o += '<path d="M-20 -52L0 -68L20 -52Z" fill="#8A847A" stroke="%s" stroke-width="1.2"/><circle cy="-70" r="3" fill="#B8B2A6" stroke="%s" stroke-width=".8"/>' % (INK, INK)
    return o + '</g>'

def stone_wall(y0, y1):
    o = '<rect y="%d" width="1280" height="%d" fill="#A39C90"/>' % (y0, y1 - y0)
    y = y0; r_ = 0
    while y < y1:
        h = 13; x = -30 + (r_ % 2) * 26
        while x < 1290:
            w = R.randint(46, 66)
            o += '<rect x="%d" y="%d" width="%d" height="%d" fill="%s" stroke="#6E675C" stroke-width="1"/>' % (x, y, w - 2, h - 1, R.choice(['#B3AC9F', '#A39C90', '#9A9488', '#BDB6A8']))
            x += w
        y += h; r_ += 1
    return o + '<rect y="%d" width="1280" height="7" fill="#D6D0C4" stroke="%s" stroke-width="1.4"/><path d="M0 %dH1280" stroke="%s" stroke-width="1.6"/>' % (y0 - 6, INK, y1, INK)

def pave(y0, y1):
    o = '<rect y="%d" width="1280" height="%d" fill="#D8CFC0"/>' % (y0, y1 - y0)
    y = y0; r_ = 0
    while y < y1:
        h = 12 + (y - y0) * .09; x = -40 + (r_ % 2) * 30
        while x < 1290:
            w = 46 + (y - y0) * .26
            o += '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="%s" stroke="#A39A8A" stroke-width=".8"/>' % (x, y, w - 1.5, h - 1.2, R.choice(['#E2DACB', '#D8CFC0', '#CFC5B4', '#E8E0D2', '#DCCFC4']))
            x += w
        y += h; r_ += 1
    return o

def japan():
    d = (lin_('skJ', [('0', '#78BEEA'), ('.45', '#BCE0F4'), ('.85', '#FBE0DC'), ('1', '#FFEFD8')])
         + lin_('fujiG', [('0', '#8FA6D6'), ('.5', '#7A92C8'), ('1', '#9AB4DA')])
         + '<linearGradient id="hazeJ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4F0" stop-opacity="0"/><stop offset="1" stop-color="#FFF4F0" stop-opacity=".85"/></linearGradient>'
         + lin_('lakeJ', [('0', '#A8D8E4'), ('.35', '#7AC0D2'), ('1', '#4C98B4')])
         + lin_('hillJ', [('0', '#8FBBA4'), ('1', '#6FA48A')])
         + S.water_defs(384, 18, 4))
    o = '<rect width="1280" height="400" fill="url(#skJ)"/>'
    # mặt trời đỏ nhạt (đĩa Nhật), mây
    o += '<circle cx="1100" cy="108" r="120" fill="url(#hg)" opacity=".7"/><circle cx="1100" cy="108" r="36" fill="#FFE2D8"/><circle cx="1100" cy="108" r="26" fill="#FFC4B4"/>'
    for x, y, w_ in ((380, 100, 300), (880, 70, 260), (1220, 170, 220), (120, 190, 260), (640, 56, 200)): o += S.cloud(x, y, w_, '#FFFFFF', '#D8E8F6', .92)
    o += V.flock(40, 60, 12, .34)
    # núi Phú Sĩ
    fj = fuji()
    o += fj
    # đồi xa + rừng thông
    o += '<path d="M-10 396Q120 340 260 366Q380 332 470 370Q600 350 700 384L-10 400Z" fill="url(#hillJ)"/><path d="M880 392Q980 356 1100 372Q1200 344 1290 366V400H880Z" fill="url(#hillJ)"/>'
    for k in range(34):
        x = R.choice([R.randint(0, 520), R.randint(900, 1280)]); h = R.randint(26, 48)
        o += '<g style="filter:brightness(%.2f)">' % R.uniform(.82, 1.0) + sugi(x, 392 + R.randint(-4, 4), h) + '</g>'
    # đền xa: chùa 5 tầng và mái đền
    pg = pagoda(470, 392, .98)
    o += '<g style="filter:brightness(.97)">' + pg + '</g>'
    # mặt hồ
    o += '<rect y="388" width="1280" height="100" fill="url(#lakeJ)"/>'
    refl = fj.replace('rect x="400" y="326" width="780" height="70" fill="url(#hazeJ)"', 'rect x="0" y="0" width="0" height="0"')
    o += S.reflect(refl + pg, 392, 392)
    o += S.reflect(torii(1008, 452, 1.0), 452, 452)
    for _ in range(90):
        x = R.randint(0, 1280); y = R.randint(396, 480); w_ = R.randint(14, 70) * (.5 + (y - 390) / 160)
        o += '<path class="lap" style="--t:%.1fs;--d:-%.1fs" d="M%d %dh%d" stroke="%s" stroke-width="2" opacity="%.2f" stroke-linecap="round"/>' % (R.uniform(3, 6), R.uniform(0, 4), x, y, w_, R.choice(['#FFFFFF', '#E8F6FF', '#FFE6EE']), R.uniform(.25, .6))
    for _ in range(26):
        y = R.randint(396, 470); x = 780 + R.randint(-200, 300)
        o += '<ellipse class="tw" style="--t:%.1fs;--d:-%.1fs" cx="%d" cy="%d" rx="%d" ry="1.5" fill="#FFFFFF"/>' % (R.uniform(2, 5), R.uniform(0, 4), x, y, R.randint(5, 16))
    # cánh hoa trôi trên hồ
    for _ in range(26):
        x, y = R.randint(300, 1250), R.randint(404, 476)
        o += '<ellipse cx="%d" cy="%d" rx="3.4" ry="1.7" fill="#FFC8DA" opacity=".85" transform="rotate(%d %d %d)"/>' % (x, y, R.randint(-30, 30), x, y)
    # torii giữa hồ + thuyền
    o += '<ellipse cx="1008" cy="454" rx="64" ry="6" fill="#2A5A70" opacity=".3"/>' + '<g class="rock">' + torii(1008, 452, 1.0) + '</g>'
    o += '<g class="rock" style="animation-delay:-1.4s">' + boat(660, 446, .8) + '</g>'
    # hàng anh đào dọc bờ xa
    for x, h, s_ in ((380, 70, .34), (610, 64, .3), (790, 60, .3), (1180, 74, .36)):
        o += sakura(x, 396, h, s_, R.randint(-10, 10), 46)
    # tường đá bờ kè, lồng đèn đá, đèn lồng đỏ giăng dây
    o += stone_wall(476, 500)
    o += pave(500, 720)
    # dây lồng đèn đỏ
    o += '<path d="M120 420Q380 470 640 430Q900 392 1160 436" stroke="%s" stroke-width="1.6" fill="none" opacity=".6"/>' % INK if False else ''
    # cây anh đào lớn bên trái: thân ở tiền cảnh, tán che mép trên
    o += toro(430, 506, 1.0) + toro(1210, 508, 1.0)
    # sushi quầy
    o += sushi_stall(262, 650)
    # picnic ngắm hoa (bãi cỏ + tấm bạt xanh)
    o += '<ellipse cx="572" cy="600" rx="170" ry="44" fill="#6FB65A" stroke="#3E7A3A" stroke-width="1.6"/><ellipse cx="572" cy="604" rx="150" ry="36" fill="#86C96A"/>'
    for _ in range(60):
        x, y = R.randint(430, 716), R.randint(578, 628)
        if ((x - 572) / 160) ** 2 + ((y - 602) / 40) ** 2 < 1: o += '<path d="M%d %dl-2 -6M%d %dl2 -6" stroke="#3E7A3A" stroke-width="1.3"/>' % (x, y, x, y)
    o += '<path d="M476 580L668 580L694 622L452 622Z" fill="#4C86D0" stroke="%s" stroke-width="1.6"/><path d="M476 580L668 580L672 586L474 586Z" fill="#2E5AA8" opacity=".5"/>' % INK
    o += '<path d="M488 596H660M474 608H678" stroke="#6AA0E8" stroke-width="1" opacity=".6"/>'
    o += salad_bowl(560, 604, .96) + bento(628, 600, .95) + onigiri(500, 604, .9) + onigiri(520, 610, .9)
    o += '<path d="M640 590L652 590L652 610L640 610Z" fill="#E8604C" stroke="%s" stroke-width="1"/>' % INK
    o += yukata(496, 580, 1.0, '#6AA8E8', '#F2C25A') + yukata(612, 590, 1.1, '#F268A6', '#7A4FA8', kid=True, flip=True)
    # sạp trái cây
    o += fruit_stall(860, 648, 'pear', '#3E7CC4') + fruit_stall(1140, 650, 'kiwi', '#3E9A4A')
    # cây anh đào lớn bên trái tiền cảnh
    o += sakura(80, 700, 400, 1.18, 28, 170, 7)
    # cành hoa rủ góc phải trên
    o += '<path d="M1290 40Q1180 60 1100 100" stroke="#5A4034" stroke-width="9" fill="none" stroke-linecap="round"/>' + V.sway(blossom(1180, 90, 130, 50, 90, 5) + blossom(1130, 110, 60, 36, 40, 9), 1290, 40, 6, 1)
    # người và thú cưng
    o += S.G.walker(720, 676, '#F2C25A', '#2E3A5A', s=1.5) + yukata(990, 690, 1.35, '#F7F2E4', '#C7322E', flip=True) + schoolkid(400, 676, 1.5) + schoolkid(436, 680, 1.45, girl=True)
    o += V.kitsu(640, 712, 104, 'ehappy', 'walk')
    # hoa rơi
    for x, y, dx, dy, t, d_ in ((260, 120, 110, 520, 12, 0), (420, 60, 160, 580, 15, 5), (700, 90, -100, 520, 13, 3), (900, 40, 90, 600, 14, 7), (1040, 150, -140, 480, 12, 4), (330, 200, 80, 480, 10, 8), (120, 230, 120, 430, 11, 2), (1180, 220, -120, 450, 13, 6), (560, 150, 60, 540, 9, 1), (830, 180, -60, 500, 12, 9)):
        o += petal(x, y, dx, dy, t, d_, .9)
    for t_, x, y, dn in [('Sushi', 262, 428, False), ('Cherry', 330, 150, True), ('Salad', 572, 498, True), ('Pear', 860, 438, True), ('Kiwi', 1140, 440, True)]:
        o += G.bubble(x, y, t_, dn)
    S.page('PJapan', 'Kids World, Nhật Bản hoa anh đào', 'Nhật Bản mùa xuân: hồ hoa anh đào dưới núi Phú Sĩ, cổng torii, chùa năm tầng, quán sushi, sạp trái cây và bữa dã ngoại', d, o, 'Nhật Bản')

def lin_(i, st): return S.lin(i, st)

if __name__ == '__main__':
    japan(); print('ok')
