# Cảnh địa điểm tầng 2: Hoa Kỳ (PUsa) - bến gỗ ven biển Florida: bệ phóng tên lửa phía xa, đồ ăn nhanh và hội chợ.
#   BOARD_OUT=<project> PYTHONIOENCODING=utf-8 python gen_places_usa.py
# Dùng lại page/cloud/lin/water_defs/reflect/coco của gen_places_south (import không chạy gì thêm).
import math, random, sys
import gen_places_south as S
G, V, INK = S.G, S.V, S.INK
R = random.Random(61)
lin, cloud, coco = S.lin, S.cloud, S.coco

CSS2 = """<style>
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.bob{animation:bob 3.6s ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes gull{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(3deg)}}
.gull{animation:gull 3s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom center}
@media (prefers-reduced-motion:reduce){.bob,.gull{animation:none}}
</style>"""

RED, BLUE, CREAM = '#C9362E', '#2E4C9A', '#FFF6E2'


def stripes(x, y, w, h, n, c1, c2, scallop=True):
    """Mái che sọc: n sọc hình thang, mép dưới lượn sóng."""
    sw = w / n
    o = ''
    for k in range(n):
        x0 = x - w / 2 + k * sw
        c = c1 if k % 2 == 0 else c2
        o += '<path d="M%.1f %.1fL%.1f %.1fv%.1fq%.1f %.1f %.1f 0Z" fill="%s" stroke="%s" stroke-width="1.1"/>' % (
            x0 + sw * .12 * (1 if k < n / 2 else -1) * 0, y, x0 + sw, y, h, -sw / 2, 8 if scallop else 0, -sw, c, INK)
    return o


def sphere(x, y, r, c1, c2):
    i = V.uid()
    return '<radialGradient id="%s" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/></radialGradient><circle cx="%.0f" cy="%.0f" r="%.1f" fill="url(#%s)" stroke="%s" stroke-width="1.3"/>' % (i, c1, c2, x, y, r, i, INK)


def rocket(x, b, H=230):
    """Tên lửa trắng mũi đỏ, dải đen trắng, cửa sổ xanh, bốn cánh đuôi."""
    W = 26
    t = b - H
    o = '<path d="M%d %.0fL%d %.0fL%d %.0fL%d %.0fZ" fill="#B9362E" stroke="%s" stroke-width="1.6"/>' % (x - W - 22, b - 100, x - W, b - 130, x - W, b - 30, x - W - 24, b - 24, INK)
    o += '<path d="M%d %.0fL%d %.0fL%d %.0fL%d %.0fZ" fill="#8E2822" stroke="%s" stroke-width="1.6"/>' % (x + W + 22, b - 100, x + W, b - 130, x + W, b - 30, x + W + 24, b - 24, INK)
    o += '<rect x="%d" y="%.0f" width="%d" height="%.0f" fill="#F4F0E4" stroke="%s" stroke-width="1.8"/>' % (x - W, t + 62, 2 * W, H - 62 - 32, INK)
    o += '<rect x="%d" y="%.0f" width="%d" height="%.0f" fill="#B8C4D4" opacity=".7"/>' % (x + 6, t + 62, W - 6, H - 62 - 32)
    o += '<path d="M%d %.0fQ%d %.0f %d %.0fQ%d %.0f %d %.0fZ" fill="#E2483E" stroke="%s" stroke-width="1.8"/>' % (x - W, t + 64, x - W, t + 22, x, t, x + W, t + 22, x + W, t + 64, INK)
    o += '<path d="M%d %.0fQ%d %.0f %d %.0f" stroke="#fff" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>' % (x - 15, t + 58, x - 14, t + 28, x - 5, t + 10)
    # dải ca-rô đen trắng
    by = t + 112
    for k in range(4):
        for j in range(2):
            o += '<rect x="%d" y="%.0f" width="%d" height="9" fill="%s"/>' % (x - W + k * (W / 2), by + j * 9, W / 2, '#1E1612' if (k + j) % 2 == 0 else '#F4F0E4')
    o += '<rect x="%d" y="%.0f" width="%d" height="18" fill="none" stroke="%s" stroke-width="1.2"/>' % (x - W, by, 2 * W, INK)
    # cửa sổ, vạch kẻ, sọc xanh
    o += '<circle cx="%d" cy="%.0f" r="10" fill="#8FD0F0" stroke="%s" stroke-width="2.4"/><path d="M%d %.0fq4 -6 9 -5" stroke="#fff" stroke-width="2" fill="none"/>' % (x, t + 90, INK, x - 6, t + 92)
    o += '<rect x="%d" y="%.0f" width="%d" height="8" fill="%s" opacity=".9"/>' % (x - W, t + 150, 2 * W, BLUE)
    o += '<path d="M%d %.0fh%d" stroke="#8A94A4" stroke-width="1"/>' % (x - W, t + 180, 2 * W)
    o += '<path d="M%d %.0fh%d" stroke="#8A94A4" stroke-width="1"/>' % (x - W, b - 60, 2 * W)
    o += '<rect x="%d" y="%.0f" width="%d" height="12" fill="#5A606E" stroke="%s" stroke-width="1.4"/>' % (x - W - 3, b - 32, 2 * W + 6, INK)
    for dx in (-14, 0, 14):
        o += '<path d="M%d %.0fl-6 14h12Z" fill="#3A3F4A" stroke="%s" stroke-width="1"/>' % (x + dx, b - 22, INK)
    return o


def gantry(x, b, H=190):
    """Tháp phục vụ: khung giàn đỏ trắng, tay đỡ nối vào tên lửa, đèn báo nhấp nháy."""
    w = 36
    o = ''
    for sx in (x - w / 2, x + w / 2):
        o += '<rect x="%.0f" y="%.0f" width="4" height="%d" fill="#C9362E" stroke="%s" stroke-width="1"/>' % (sx - 2, b - H, H, INK)
    n = int(H / 22)
    for k in range(n):
        y0 = b - H + k * 22
        o += '<path d="M%.0f %.0fL%.0f %.0fM%.0f %.0fL%.0f %.0f" stroke="#E8E2D2" stroke-width="2"/>' % (x - w / 2, y0, x + w / 2, y0 + 22, x + w / 2, y0, x - w / 2, y0 + 22)
        o += '<path d="M%.0f %.0fH%.0f" stroke="%s" stroke-width="2.4"/>' % (x - w / 2, y0, x + w / 2, INK)
    o += '<rect x="%.0f" y="%.0f" width="%d" height="7" fill="#8E2822" stroke="%s"/>' % (x - w / 2 - 6, b - H - 7, w + 12, INK)
    o += '<path d="M%.0f %.0fv-26" stroke="%s" stroke-width="2"/><circle class="ff" cx="%.0f" cy="%.0f" r="3.4" fill="#FF5A4A" style="--t:1.8s"/>' % (x, b - H - 7, INK, x, b - H - 34)
    # tay đỡ tới tên lửa
    for ay in (b - 150, b - 105):
        o += '<path d="M%.0f %dH%.0f" stroke="%s" stroke-width="7" stroke-linecap="round"/><path d="M%.0f %dH%.0f" stroke="#E8E2D2" stroke-width="4" stroke-linecap="round"/>' % (x - w / 2, ay, x - 44, INK, x - w / 2, ay, x - 44)
    return o


def rocket_site(x, b):
    """Bệ phóng: nền bê tông, tên lửa, tháp, cột thu lôi, bồn nhiên liệu."""
    o = '<rect x="%d" y="%d" width="170" height="16" fill="#B8B2A6" stroke="%s" stroke-width="1.5"/><rect x="%d" y="%d" width="170" height="5" fill="#D8D2C4"/>' % (x - 85, b - 16, INK, x - 85, b - 16)
    o += '<path d="M%d %dH%d" stroke="#8A8478" stroke-width="1"/>' % (x - 85, b - 7, x + 85)
    for dx in (-130, 120):  # cột thu lôi
        o += '<path d="M%d %dV%d" stroke="#6A6E78" stroke-width="2.4"/><path d="M%d %dL%d %d" stroke="#6A6E78" stroke-width="1" opacity=".6"/>' % (x + dx, b - 8, b - 250, x + dx, b - 250, x, b - 120)
    o += sphere(x - 175, b - 36, 22, '#FFFFFF', '#B8C4D4') + '<rect x="%d" y="%d" width="6" height="14" fill="#6A6E78"/>' % (x - 178, b - 16)
    o += sphere(x - 222, b - 28, 16, '#FFFFFF', '#B8C4D4')
    o += rocket(x, b - 16, 226) + gantry(x + 76, b - 16, 188)
    for k, (dx, dy) in enumerate(((-30, 0), (24, -4), (-6, -12))):  # hơi nước xả
        o += '<circle class="smoke" cx="%d" cy="%d" r="%d" fill="#fff" opacity=".7" style="--d:-%.1fs"/>' % (x + dx, b - 22 + dy, 9 + k * 2, k * 1.3)
    return o


def lamp(x, y, h=150):
    return ('<path d="M%d %dV%d" stroke="#2A2E3A" stroke-width="5" stroke-linecap="round"/><path d="M%d %dq0 -8 10 -8h14" stroke="#2A2E3A" stroke-width="4" fill="none"/><ellipse cx="%d" cy="%d" rx="9" ry="5" fill="#FFF3B0" stroke="%s"/>'
            '<circle class="halo" cx="%d" cy="%d" r="38" fill="url(#hg)"/>' % (x, y, y - h, x, y - h + 8, x + 24, y - h + 6, INK, x + 24, y - h + 8))


def usflag(x, y, w=110, h=64, pole=True):
    """Cờ Hoa Kỳ: 13 sọc đỏ trắng, ô xanh với các ngôi sao, tung bay nhẹ."""
    o = ''
    if pole:
        o += '<path d="M%d %dV%d" stroke="#C9C4BA" stroke-width="4" stroke-linecap="round"/><circle cx="%d" cy="%d" r="4.4" fill="#F2C25A" stroke="%s"/>' % (x, y + h + 250, y - 6, x, y - 8, INK)
    sh = h / 13
    f = ''
    for k in range(13):
        f += '<rect x="%d" y="%.1f" width="%d" height="%.2f" fill="%s"/>' % (x, y + k * sh, w, sh + .2, RED if k % 2 == 0 else '#FFFFFF')
    f += '<rect x="%d" y="%d" width="%.0f" height="%.1f" fill="%s"/>' % (x, y, w * .42, sh * 7, BLUE)
    for r_ in range(4):
        for c_ in range(5):
            f += '<circle cx="%.1f" cy="%.1f" r="1.5" fill="#fff"/>' % (x + 5 + c_ * 7.6 + (3.8 if r_ % 2 else 0) * 0, y + 5 + r_ * 6.6)
    f += '<rect x="%d" y="%d" width="%d" height="%.0f" fill="none" stroke="%s" stroke-width="1.4"/>' % (x, y, w, h, INK)
    return o + '<g class="wave">%s</g>' % f


# ---------- đồ ăn nhanh ----------
def popcorn_bucket(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    for dx, dy, r in ((-14, -50, 10), (-3, -58, 11), (10, -52, 10), (20, -44, 8), (-22, -42, 8), (3, -46, 10), (-8, -40, 9), (14, -38, 8)):
        o += '<circle cx="%d" cy="%d" r="%d" fill="#FFF6D2" stroke="#D9A24A" stroke-width="1.1"/><circle cx="%d" cy="%d" r="%.1f" fill="#F4C84E" opacity=".7"/>' % (dx, dy, r, dx + 2, dy + 2, r * .35)
    o += '<path d="M-26 -42H26L20 0H-20Z" fill="#FFFFFF" stroke="%s" stroke-width="1.6"/>' % INK
    for k, c in enumerate((RED, RED, RED)):
        o += '<path d="M%d -42L%d 0H%d L%d -42Z" fill="%s"/>' % (-26 + k * 17.3, -20 + k * 13.3, -20 + k * 13.3 + 6.7, -26 + k * 17.3 + 8.6, c)
    return o + '<path d="M-26 -42H26L20 0H-20Z" fill="none" stroke="%s" stroke-width="1.6"/></g>' % INK


def popcorn_cart(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<ellipse cy="2" rx="86" ry="6" fill="#120A08" opacity=".35"/>'
    for wx in (-52, 54):
        o += '<circle cx="%d" cy="-18" r="18" fill="#2A2428" stroke="%s"/><circle cx="%d" cy="-18" r="9" fill="#C9C4BA" stroke="%s"/>' % (wx, INK, wx, INK)
        for k in range(6): o += '<path d="M%d -18l%.1f %.1f" stroke="#2A2428" stroke-width="1.4"/>' % (wx, 9 * math.cos(k * 1.05), 9 * math.sin(k * 1.05))
    o += '<path d="M-80 -38H-70V-32H-80Z" fill="#8A8478"/><rect x="-70" y="-100" width="140" height="68" rx="4" fill="#E2483E" stroke="%s" stroke-width="1.8"/>' % INK
    o += '<rect x="-70" y="-48" width="140" height="6" fill="#F4F0E4"/>'
    # tủ kính đựng bắp
    o += '<rect x="-58" y="-150" width="116" height="52" fill="#CFEAF4" opacity=".75" stroke="%s" stroke-width="1.8"/>' % INK
    for k in range(16):
        o += '<circle cx="%.0f" cy="%.0f" r="%.1f" fill="#FFF6D2" stroke="#D9A24A" stroke-width=".9"/>' % (-52 + (k % 8) * 14.5 + R.uniform(-3, 3), -108 - (k // 8) * 9 - R.uniform(0, 8), R.uniform(6, 9))
    o += '<path d="M-58 -150L-40 -140M-58 -118L-40 -108" stroke="#fff" stroke-width="3" opacity=".6"/>'
    o += stripes(0, -150, 168, 24, 8, RED, '#FFFFFF')
    o += '<path d="M-84 -150Q0 -178 84 -150" stroke="%s" stroke-width="2" fill="none"/>' % INK
    o += '<circle cx="-30" cy="-72" r="13" fill="#F4C84E" stroke="%s"/><path d="M-36 -72h12M-30 -78v12" stroke="%s" stroke-width="2"/>' % (INK, INK)
    o += '<g class="bob">' + popcorn_bucket(46, -150, 1.05) + '</g>'
    return o + '</g>'


def hotdog_icon(x, y, s=1, rot=0):
    o = '<g transform="translate(%d %d) rotate(%d) scale(%.2f)">' % (x, y, rot, s)
    o += '<rect x="-34" y="-9" width="68" height="18" rx="9" fill="#C8693A" stroke="%s" stroke-width="1.4"/>' % INK
    o += '<path d="M-34 0Q0 -14 34 0" fill="#E8B25A" stroke="%s" stroke-width="1.2"/>' % INK
    o += '<rect x="-38" y="-8" width="76" height="12" rx="6" fill="#B04A2A" stroke="%s" stroke-width="1.3"/>' % INK
    o += '<path d="M-30 -2l7 -5l7 5l7 -5l7 5l7 -5l7 5l7 -5l7 5l7 -5" stroke="#F4C21A" stroke-width="3" fill="none" stroke-linejoin="round"/>'
    o += '<path d="M-36 4Q0 22 36 4Q36 14 0 14Q-36 14 -36 4Z" fill="#E8B25A" stroke="%s" stroke-width="1.3"/>' % INK
    return o + '</g>'


def hotdog_cart(x, y, s=1):
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<ellipse cy="2" rx="88" ry="6" fill="#120A08" opacity=".35"/>'
    # ô sọc đỏ vàng
    o += '<path d="M0 -190V-80" stroke="#6A6E78" stroke-width="4"/>'
    for k in range(8):
        a0, a1 = -100 + k * 25, -100 + (k + 1) * 25
        o += '<path d="M0 -196L%d -150Q%d -140 %d -150Z" fill="%s" stroke="%s" stroke-width="1.1"/>' % (a0, (a0 + a1) / 2, a1, '#E2483E' if k % 2 == 0 else '#F7C93A', INK)
    o += '<path d="M0 -204v8" stroke="%s" stroke-width="3"/>' % INK
    for wx in (-54, 56):
        o += '<circle cx="%d" cy="-18" r="18" fill="#2A2428" stroke="%s"/><circle cx="%d" cy="-18" r="9" fill="#C9C4BA" stroke="%s"/>' % (wx, INK, wx, INK)
        for k in range(6): o += '<path d="M%d -18l%.1f %.1f" stroke="#2A2428" stroke-width="1.4"/>' % (wx, 9 * math.cos(k * 1.05), 9 * math.sin(k * 1.05))
    o += '<rect x="-74" y="-92" width="148" height="66" rx="5" fill="#F7C93A" stroke="%s" stroke-width="1.8"/><rect x="-74" y="-52" width="148" height="6" fill="#E2483E"/>' % INK
    o += '<rect x="-66" y="-112" width="132" height="22" rx="3" fill="#C9C4BA" stroke="%s" stroke-width="1.6"/><path d="M-60 -108h120" stroke="#fff" opacity=".7" stroke-width="2.4"/>' % INK
    # xúc xích trên vỉ nướng
    for k in range(5): o += '<rect x="%d" y="-122" width="22" height="10" rx="5" fill="#B04A2A" stroke="%s" stroke-width="1"/>' % (-54 + k * 24, INK)
    o += '<g class="smoke" style="--d:-1s"><circle cx="-30" cy="-130" r="9" fill="#fff" opacity=".75"/></g><g class="smoke" style="--d:-2.6s"><circle cx="20" cy="-130" r="8" fill="#fff" opacity=".75"/></g>'
    o += '<g class="bob">' + hotdog_icon(0, -58, 1.15) + '</g>'
    o += '<rect x="-80" y="-94" width="12" height="6" fill="#8A8478"/><rect x="68" y="-94" width="12" height="6" fill="#8A8478"/>'
    # chai tương cà, mù tạt
    o += '<rect x="-60" y="-132" width="9" height="18" rx="3" fill="#D32F2F" stroke="%s"/><rect x="-48" y="-132" width="9" height="18" rx="3" fill="#F4C21A" stroke="%s"/>' % (INK, INK)
    return o + '</g>'


def donut(x, y, r, s=1, icing='#F287B0'):
    o = '<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
    o += '<circle r="%d" fill="#D9954A" stroke="%s" stroke-width="2"/><circle r="%d" fill="%s" stroke="%s" stroke-width="1.6"/>' % (r, INK, r - 4, icing, INK)
    o += '<path d="M%d 0q%d %d %d %d" fill="none"/>' % (-r + 4, 0, 0, 0, 0)
    for k in range(18):
        a = k * 0.349 + .2
        rr = r * (.52 + .3 * ((k * 7) % 5) / 5)
        o += '<rect x="%.1f" y="%.1f" width="7" height="2.6" rx="1.3" fill="%s" transform="rotate(%d %.1f %.1f)"/>' % (math.cos(a) * rr - 3.5, math.sin(a) * rr - 1.3, ['#fff', '#6FD0F0', '#F7C93A', '#7ADB6A', '#B58CF0'][k % 5], (k * 53) % 180, math.cos(a) * rr, math.sin(a) * rr)
    o += '<circle r="%.1f" fill="#E8C8A0" stroke="%s" stroke-width="1.6"/><circle r="%.1f" fill="#9A7A5A" opacity=".5"/>' % (r * .3, INK, r * .22)
    o += '<path d="M%.1f %.1fq%.1f %.1f %.1f %.1f" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>' % (-r * .7, -r * .3, r * .1, -r * .35, r * .4, -r * .55)
    return o + '</g>'


def donut_shop(x, b, w=170, h=150):
    o = '<ellipse cx="%d" cy="%d" rx="%d" ry="6" fill="#120A08" opacity=".3"/>' % (x, b + 2, w / 2 + 14)
    o += '<rect x="%d" y="%d" width="%d" height="%d" fill="#FCE4EE" stroke="%s" stroke-width="2"/>' % (x - w / 2, b - h, w, h, INK)
    o += '<rect x="%d" y="%d" width="10" height="%d" fill="#fff" opacity=".5"/>' % (x - w / 2 + 3, b - h + 3, h - 6)
    o += '<rect x="%d" y="%d" width="%d" height="14" fill="#EE5F94" stroke="%s" stroke-width="1.6"/>' % (x - w / 2 - 6, b - h - 12, w + 12, INK)
    o += stripes(x, b - h + 2, w + 8, 20, 7, '#F287B0', '#FFFFFF')
    # cửa sổ lớn với donut bày và quầy
    o += '<rect x="%d" y="%d" width="%d" height="62" fill="#CFEAF4" stroke="%s" stroke-width="2"/><rect x="%d" y="%d" width="%d" height="8" fill="#B07A4A" stroke="%s"/>' % (x - w / 2 + 12, b - h + 44, w - 66, INK, x - w / 2 + 12, b - h + 100, w - 66, INK)
    for k in range(4):
        o += donut(x - w / 2 + 34 + k * 26, b - h + 92, 11, .9, ['#F287B0', '#8A5A3A', '#F7E4A0', '#7ADB6A'][k])
    o += '<path d="M%d %dl16 -14" stroke="#fff" stroke-width="4" opacity=".6"/>' % (x - w / 2 + 16, b - h + 100)
    o += '<rect x="%d" y="%d" width="38" height="%d" rx="3" fill="#8E5A9A" stroke="%s" stroke-width="2"/><circle cx="%d" cy="%d" r="2.6" fill="#F7C93A"/><rect x="%d" y="%d" width="26" height="22" fill="#CFEAF4" stroke="%s"/>' % (x + w / 2 - 50, b - 82, 82, INK, x + w / 2 - 18, b - 40, x + w / 2 - 44, b - 76, INK)
    o += '<path d="M%d %dh%d" stroke="#C9A6B4" stroke-width="1" opacity=".6"/>' % (x - w / 2, b - 22, w)
    # donut khổng lồ trên mái xoay nhẹ lơ lửng
    o += '<g class="bob" style="--d:-1.2s"><path d="M%d %dL%d %dM%d %dL%d %d" stroke="#6A6E78" stroke-width="4"/>' % (x - 24, b - h - 12, x - 24, b - h - 36, x + 24, b - h - 12, x + 24, b - h - 36) + donut(x, b - h - 62, 38, 1) + '</g>'
    return o


def pizza_slice(x, y, s=1, rot=0):
    o = '<g transform="translate(%d %d) rotate(%d) scale(%.2f)">' % (x, y, rot, s)
    o += '<path d="M0 60L-44 -40Q0 -54 44 -40Z" fill="#F7C040" stroke="%s" stroke-width="2.2" stroke-linejoin="round"/>' % INK
    o += '<path d="M-44 -40Q0 -54 44 -40L40 -30Q0 -44 -40 -30Z" fill="#D9954A" stroke="%s" stroke-width="2"/>' % INK
    for dx, dy, r in ((-14, -14, 8), (12, -6, 8), (-2, 18, 7), (22, -26, 6), (-26, -26, 6), (4, 40, 5)):
        o += '<circle cx="%d" cy="%d" r="%d" fill="#C9362E" stroke="%s" stroke-width="1.2"/><circle cx="%d" cy="%d" r="%.1f" fill="#E2685A" opacity=".8"/>' % (dx, dy, r, INK, dx - 2, dy - 2, r * .4)
    o += '<path d="M-10 0q4 14 0 22M20 8q4 10 0 18" stroke="#FFE88A" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>'
    return o + '</g>'


def pizzeria(x, b, w=230, h=200):
    o = '<ellipse cx="%d" cy="%d" rx="%d" ry="6" fill="#120A08" opacity=".3"/>' % (x, b + 2, w / 2 + 16)
    o += '<rect x="%d" y="%d" width="%d" height="%d" fill="#B4573A" stroke="%s" stroke-width="2"/>' % (x - w / 2, b - h, w, h, INK)
    for r_ in range(int(h / 14)):
        for c_ in range(int(w / 28) + 1):
            o += '<rect x="%d" y="%d" width="26" height="12" fill="%s" stroke="#7A3A24" stroke-width=".8"/>' % (x - w / 2 + c_ * 28 + (14 if r_ % 2 else 0) - 14 * 0, b - h + r_ * 14, R.choice(['#C26A48', '#A84E34', '#B95D3E', '#D07A55']))
    o += '<rect x="%d" y="%d" width="%d" height="%d" fill="none" stroke="%s" stroke-width="2"/>' % (x - w / 2, b - h, w, h, INK)
    o += '<rect x="%d" y="%d" width="%d" height="12" fill="#F4F0E4" stroke="%s" stroke-width="1.6"/><rect x="%d" y="%d" width="%d" height="4" fill="#C9C4BA"/>' % (x - w / 2 - 8, b - h - 10, w + 16, INK, x - w / 2 - 8, b - h + 2, w + 16)
    # mái che xanh lá - trắng - đỏ
    o += stripes(x, b - h + 64, w + 4, 22, 9, '#2F9A5A', '#F4F0E4')
    # bảng tên hộp sáng
    o += '<rect x="%d" y="%d" width="120" height="34" rx="6" fill="#1E3A2A" stroke="%s" stroke-width="2"/><text x="%d" y="%d" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="22" fill="#FFE88A" letter-spacing="3">PIZZA</text>' % (x - 60, b - h + 22, INK, x, b - h + 46)
    o += '<circle class="halo" cx="%d" cy="%d" r="60" fill="url(#hg)" opacity=".6"/>' % (x, b - h + 38)
    # cửa sổ tròn có lò, cửa ra vào
    o += '<rect x="%d" y="%d" width="76" height="70" fill="#CFEAF4" stroke="%s" stroke-width="2"/><path d="M%d %dh76M%d %dv70" stroke="%s" stroke-width="1.6"/>' % (x - w / 2 + 14, b - 86, INK, x - w / 2 + 14, b - 51, x - w / 2 + 52, b - 86, INK)
    o += '<path d="M%d %dl14 -12" stroke="#fff" stroke-width="4" opacity=".6"/>' % (x - w / 2 + 20, b - 54)
    o += '<rect x="%d" y="%d" width="46" height="78" rx="3" fill="#2F9A5A" stroke="%s" stroke-width="2"/><rect x="%d" y="%d" width="30" height="34" fill="#CFEAF4" stroke="%s"/><circle cx="%d" cy="%d" r="2.6" fill="#F7C93A"/>' % (x + 14, b - 78, INK, x + 22, b - 70, INK, x + 52, b - 40)
    o += '<rect x="%d" y="%d" width="40" height="52" fill="#2A3A30" stroke="%s" stroke-width="2"/><text x="%d" y="%d" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="8" fill="#fff">MENU</text>' % (x + w / 2 - 54, b - 70, INK, x + w / 2 - 34, b - 56)
    for k in range(4): o += '<path d="M%d %dh%d" stroke="#fff" stroke-width="1.4" opacity=".7"/>' % (x + w / 2 - 50, b - 48 + k * 9, 14 + (k % 2) * 8)
    o += '<g class="bob" style="--d:-.6s">' + pizza_slice(x, b - h - 62, .9, -8) + '</g>'
    o += '<path d="M%d %dv-26M%d %dv-26" stroke="#6A6E78" stroke-width="4"/>' % (x - 30, b - h - 8, x + 30, b - h - 8)
    return o


# ---------- bối cảnh ----------
def ferris(cx, cy, r, rise):
    o = '<path d="M%d %dL%d %dM%d %dL%d %d" stroke="#6A5A8A" stroke-width="5"/><path d="M%d %dL%d %dM%d %dL%d %d" stroke="#8A7AAA" stroke-width="2.4"/>' % (cx, cy, cx - 50, cy + rise, cx, cy, cx + 50, cy + rise, cx, cy, cx - 56, cy + rise, cx, cy, cx + 56, cy + rise)
    w = '<circle r="%d" fill="none" stroke="#7A6AA6" stroke-width="5"/><circle r="%d" fill="none" stroke="#B0A2D6" stroke-width="2"/><circle r="%d" fill="none" stroke="#9A8CC6" stroke-width="1.6"/>' % (r, r - 8, r * .45)
    cols = ['#E2483E', '#F7C93A', '#2FB8C6', '#F268A6', '#7ADB6A', '#3E7CC4']
    for k in range(14):
        a = k * math.pi * 2 / 14
        w += '<path d="M0 0L%.1f %.1f" stroke="#9A8CC6" stroke-width="1.8"/>' % (math.cos(a) * r, math.sin(a) * r)
        gx, gy = math.cos(a) * r, math.sin(a) * r
        w += '<g transform="translate(%.1f %.1f)"><path d="M0 0v7" stroke="#6A5A8A" stroke-width="1.6"/><path d="M-8 7h16v11q-8 5 -16 0Z" fill="%s" stroke="%s" stroke-width="1.2"/><circle cx="0" cy="4" r="1.8" fill="#FFF3B0"/></g>' % (gx, gy, cols[k % 6], INK)
    w += '<circle r="7" fill="#F7C93A" stroke="%s" stroke-width="1.6"/>' % INK
    return o + '<g transform="translate(%d %d)"><g class="spin" style="animation-duration:140s">%s</g></g>' % (cx, cy, w)


def coaster(x0, y0):
    """Tàu lượn xa: đường ray lượn sóng và cột chống, màu nhạt lẫn sương."""
    pts = [(0, 60), (40, 60), (80, 6), (110, 6), (150, 50), (185, 30), (215, 56), (250, 18), (285, 18), (330, 58), (380, 58)]
    d = 'M' + ' '.join('%d %d' % (x0 + a, y0 + b) for a, b in pts[:1]) + ''.join('L%d %d' % (x0 + a, y0 + b) for a, b in pts[1:])
    o = '<path d="%s" fill="none" stroke="#7E88B8" stroke-width="5" stroke-linejoin="round"/><path d="%s" fill="none" stroke="#B8C0E0" stroke-width="1.6" stroke-linejoin="round"/>' % (d, d)
    for a, b in pts[1:]:
        o += '<path d="M%d %dV%d" stroke="#8892C0" stroke-width="2.6"/>' % (x0 + a, y0 + b, y0 + 64)
    o += '<g class="ride" style="--t:9s;--d:0s;--dx:0px"></g>'
    return o


def planks(y0, y1):
    o = '<rect y="%d" width="1280" height="%d" fill="#B8864E"/>' % (y0, y1 - y0)
    y = y0; k = 0
    while y < y1:
        h = 11 + (y - y0) * .09
        o += '<rect y="%.0f" width="1280" height="%.1f" fill="%s" opacity=".55"/><path d="M0 %.0fH1280" stroke="#6A4528" stroke-width="1.3"/>' % (y, h, ['#C8955A', '#A9793F', '#BD8A50', '#D2A168'][k % 4], y + h)
        x = -50 + (k * 97) % 160
        while x < 1290:
            o += '<path d="M%.0f %.0fv%.1f" stroke="#6A4528" stroke-width="1" opacity=".8"/>' % (x, y, h)
            x += 150 + (k % 3) * 36 + (y - y0) * .4
        for _ in range(3): o += '<path d="M%d %.0fh%d" stroke="#8E5E34" stroke-width=".9" opacity=".6"/>' % (R.randint(0, 1240), y + R.uniform(2, h - 2), R.randint(20, 60))
        y += h; k += 1
    return o


def railing(y, step=70):
    o = '<rect y="%d" width="1280" height="6" fill="#F4F0E4" stroke="%s" stroke-width="1.4"/><rect y="%d" width="1280" height="4" fill="#F4F0E4" stroke="%s" stroke-width="1.2"/>' % (y, INK, y + 24, INK)
    for x in range(-10, 1290, step):
        o += '<rect x="%d" y="%d" width="8" height="42" fill="#F4F0E4" stroke="%s" stroke-width="1.3"/><rect x="%d" y="%d" width="2.6" height="40" fill="#C9C4BA"/>' % (x, y - 4, INK, x + 5, y - 3)
    return o


def gull(x, y, s=1, flip=False):
    sx = -s if flip else s
    return '<g class="gull" transform="translate(%d %d) scale(%.2f %.2f)"><path d="M-14 0Q-14 -12 0 -13Q13 -13 15 -5L24 -8L16 0Q10 8 -3 8Q-12 8 -14 0Z" fill="#fff" stroke="%s" stroke-width="1.3"/><path d="M-2 -6Q8 -4 14 -2Q6 4 -4 2Z" fill="#B8C4D4"/><circle cx="14" cy="-9" r="1.3" fill="%s"/><path d="M18 -7l7 3l-7 1Z" fill="#F2A33A"/><path d="M-12 -2l-9 2l9 2Z" fill="#fff" stroke="%s" stroke-width=".8"/><path d="M-2 8v5M3 8v5" stroke="#E8743C" stroke-width="1.6"/></g>' % (x, y, sx, s, INK, INK, INK)


def kid(x, y, s=1, shirt='#F268A6', cap=None, hair='#3A2413', pant='#2E4C9A'):
    o = G.walker(x, y, shirt, hair, pant, s)
    if cap:  # mũ lưỡi trai bóng chày
        o += '<g transform="translate(%d %d) scale(%.2f)"><path d="M-6 -48Q0 -56 6 -48Z" fill="%s" stroke="%s" stroke-width=".8"/><path d="M4 -48h8" stroke="%s" stroke-width="2.4" stroke-linecap="round"/></g>' % (x, y, s, cap, INK, cap)
    return o


def scoop(x, y, s=1, c='#F8B6D0', c2='#8A5A3A'):
    return '<g transform="translate(%d %d) scale(%.2f)"><path d="M-6 0L6 0L0 18Z" fill="#E0A458" stroke="%s" stroke-width="1"/><circle cx="0" cy="-3" r="7.4" fill="%s" stroke="%s" stroke-width="1"/><circle cx="0" cy="-12" r="6.4" fill="%s" stroke="%s" stroke-width="1"/><circle cx="1" cy="-18" r="1.8" fill="#D32F2F"/></g>' % (x, y, s, INK, c, INK, c2, INK)


def table(x, y):
    """Bàn picnic có khay bánh mì kẹp thịt và khoai tây chiên."""
    o = '<ellipse cx="%d" cy="%d" rx="86" ry="7" fill="#120A08" opacity=".3"/>' % (x, y + 4)
    o += '<path d="M%d %dL%d %dM%d %dL%d %d" stroke="#6A4528" stroke-width="6" stroke-linecap="round"/>' % (x - 60, y - 6, x - 74, y + 2, x + 60, y - 6, x + 74, y + 2)
    o += '<path d="M%d %dH%d L%d %dH%d Z" fill="#C8693A" stroke="%s" stroke-width="1.8"/><path d="M%d %dH%d" stroke="#E8A070" stroke-width="2"/>' % (x - 70, y - 24, x + 70, x + 82, y - 8, x - 82, INK, x - 66, y - 21, x + 66)
    o += '<path d="M%d %dL%d %dH%d L%d %dZ" fill="#D9A24A" opacity=".5"/>' % (x - 82, y - 8, x - 70, y - 24, x + 70, x + 82, y - 8)
    # khay đỏ, bánh mì kẹp thịt
    o += '<path d="M%d %dh70l8 12h-86Z" fill="#E2483E" stroke="%s" stroke-width="1.4"/>' % (x - 34, y - 34, INK)
    bx, by = x - 6, y - 38
    o += '<ellipse cx="%d" cy="%d" rx="18" ry="5" fill="#E8B25A" stroke="%s" stroke-width="1.2"/><path d="M%d %dq0 -4 4 -4h28q4 0 4 4Z" fill="#7BCB4A" stroke="%s" stroke-width="1"/><rect x="%d" y="%d" width="32" height="5" rx="2.5" fill="#7A3A1E" stroke="%s" stroke-width="1"/><path d="M%d %dQ%d %d %d %dZ" fill="#E8B25A" stroke="%s" stroke-width="1.4"/>' % (bx, by + 1, INK, bx - 18, by - 7, INK, bx - 16, by - 12, INK, bx - 18, by - 16, bx, by - 36, bx + 18, by - 16, INK)
    for k in range(5): o += '<ellipse cx="%d" cy="%d" rx="1.4" ry=".9" fill="#FFF3D0"/>' % (bx - 8 + k * 4, by - 22 - (k % 2) * 3)
    # khoai tây chiên
    fx = x + 34
    for k in range(7): o += '<rect x="%.0f" y="%.0f" width="3.4" height="%d" fill="#F4C84E" stroke="#B98A2A" stroke-width=".6" transform="rotate(%d %.0f %d)"/>' % (fx - 10 + k * 3.4, by - 22 - (k * 5) % 7, 18, (k - 3) * 6, fx - 8 + k * 3.4, by - 4)
    o += '<path d="M%d %dH%d L%d %dH%d Z" fill="#E2483E" stroke="%s" stroke-width="1.2"/><path d="M%d %dH%d" stroke="#F7C93A" stroke-width="3"/>' % (fx - 12, by - 6, fx + 12, fx + 9, by + 8, fx - 9, INK, fx - 10, by, fx + 10)
    return o


def usa():
    HZ = 392  # đường chân trời / mép bệ
    d = lin('skU', [('0', '#3E7CD0'), ('.38', '#8DBBE6'), ('.7', '#FFE0B0'), ('1', '#FFC27F')]) + S.water_defs(HZ, 14, 5)
    d += lin('seaU', [('0', '#6FC4D8'), ('1', '#2E7FB0')])
    o = '<rect width="1280" height="%d" fill="url(#skU)"/>' % (HZ + 4)
    o += '<circle cx="930" cy="280" r="170" fill="url(#hg)"/><circle cx="930" cy="280" r="38" fill="#FFF3C8"/>'
    for x, y, w_ in ((420, 80, 340), (880, 70, 380), (1200, 170, 260), (150, 190, 230), (700, 190, 190)):
        o += cloud(x, y, w_, '#FFF6E6', '#F7BC94')
    o += V.flock(60, 48, 12, .4) + V.flock(110, 56, 30, .3)
    # đường chân trời xa: hàng cây, mảng đất thấp
    o += '<path d="M0 %d Q160 %d 330 %d T700 %d T1060 %d T1280 %d V%d H0Z" fill="#7FB89A" opacity=".75"/>' % (HZ - 6, HZ - 14, HZ - 8, HZ - 12, HZ - 9, HZ - 13, HZ)
    # nước
    o += '<rect y="%d" width="1280" height="%d" fill="url(#seaU)"/>' % (HZ, 720 - HZ)
    # phản chiếu phần xa (bệ phóng + vòng quay)
    far = rocket_site(300, HZ + 2)
    o += S.reflect(far, HZ + 2, HZ)
    for k in range(14):
        y = HZ + 8 + k * 6
        o += '<path class="flow" d="M%d %dh%d" stroke="#fff" stroke-width="1.6" opacity=".35" stroke-dasharray="26 40" style="animation-duration:%ds"/>' % (R.randint(0, 1200), y, R.randint(60, 140), 4 + k % 4)
    o += '<path d="M%d %dQ%d %d %d %d" stroke="#FFF3C8" stroke-width="5" fill="none" opacity=".35"/>' % (900, HZ + 10, 930, HZ + 40, 960, HZ + 70)
    # tàu lượn + vòng đu quay phía xa phải
    o += coaster(780, HZ - 70)
    o += ferris(665, 355, 96, 118)
    # đảo đất bệ phóng
    o += '<path d="M-30 %d H470 Q520 %d 560 %d L540 %d H-30Z" fill="#6FBE5A" stroke="%s" stroke-width="1.6"/><path d="M-30 %d H540 L535 %d H-30Z" fill="#E6D2A0"/>' % (HZ, HZ + 1, HZ + 8, HZ + 14, INK, HZ + 8, HZ + 16)
    for x in range(-10, 540, 26):
        o += '<path d="M%d %dl-3 -8M%d %dl1 -10M%d %dl4 -7" stroke="#2F8A4E" stroke-width="1.6" stroke-linecap="round"/>' % (x, HZ + 2, x + 4, HZ + 2, x + 8, HZ + 2)
    o += rocket_site(300, HZ + 2)
    o += coco(30, HZ + 2, 150, 20, c='#1F7A48', ink='#0F3A24', L=62) + coco(520, HZ + 6, 120, -16, c='#2C8A50', ink='#0F3A24', L=56)
    # bến gỗ trước mặt
    BY = 470
    o += planks(BY, 720) + '<rect y="%d" width="1280" height="8" fill="#7A5230" stroke="%s" stroke-width="1.4"/>' % (BY - 6, INK)
    o += gull(100, BY - 6, 1.0) + gull(1180, BY - 8, 1.1, True) + gull(430, BY - 6, .9, True)
    o += railing(BY - 38)
    # bóng đổ chiều từ quầy: dải sẫm mờ
    o += '<rect y="%d" width="1280" height="250" fill="#5A2A10" opacity=".07"/>' % BY
    # quầy hàng: popcorn (trái), donut, xúc xích, pizza
    o += popcorn_cart(130, 628, 1.15)
    o += donut_shop(498, 596, 170, 150)
    o += hotdog_cart(804, 636, 1.22)
    o += pizzeria(1068, 606, 236, 200)
    # cột đèn hai bên và cờ
    o += lamp(36, 700, 270) + lamp(1250, 706, 280)
    o += usflag(1166, 290, 96, 56)
    o += V.flock(40, 70, 8, .0) if False else ''
    # cây dừa hai rìa trước
    o += coco(-4, 720, 330, 70, c='#2FA860', ink='#0F3A24', trunk='#8A6A44', fr=11, L=96) + coco(1288, 724, 350, -80, c='#2FA860', ink='#0F3A24', trunk='#8A6A44', fr=11, L=96)
    # người trên bến
    o += kid(370, 646, 1.0, '#E2483E', '#2E4C9A') + kid(402, 650, .86, '#F7C93A', None, '#7A4A2A') + scoop(402, 612, .9)
    o += kid(640, 652, 1.04, '#2FB8C6', '#E2483E', '#2A1E18', '#3A3A4A') + kid(678, 646, .94, '#F268A6', None, '#E8B040', '#7A4FA8')
    o += kid(940, 660, 1.2, '#7A4FA8', None, '#2A1E18', '#2E4C9A') + kid(970, 664, .9, '#7ADB6A', '#F7C93A', '#3A2413')
    o += kid(1190, 670, 1.3, '#E2483E', None, '#6A3A1E', '#4A4A58')
    o += table(790, 692)
    # thú cưng đi dạo trên bến
    o += V.kitsu(560, 712, 104, 'ehappy', 'walk')
    for t_, x, y, dn in [('Tên lửa', 300, 112, True), ('Bánh rán', 500, 296, True), ('Xúc xích', 830, 350, False), ('Bắp rang', 130, 340, False), ('Pizza', 1068, 270, False)]:
        o += G.bubble(x, y, t_, dn)
    S.page('PUsa', 'Kids World, Hoa Kỳ', 'Bến gỗ ven biển Hoa Kỳ lúc nắng chiều: bệ phóng tên lửa, vòng đu quay, quầy bắp rang, bánh rán, xúc xích và pizza', d, o, 'Hoa Kỳ', CSS2)


if __name__ == '__main__':
    usa(); print('ok')
