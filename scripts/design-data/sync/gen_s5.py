# S5: giao diện bé ngoài bản đồ (1280×720). Không dùng study_shell. Mỗi trạng thái lớn là một bảng đủ khổ.
#   BOARD_OUT="C:/.../project" python gen_s5.py
# Dữ liệu mẫu lấy từ content/curated/kids (ABC, Hạ Long). Nhân vật đọc từ CharKitsu trong BOARD_OUT.
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from board_kit import *

# ---------- Hình từ vựng tự vẽ, viewBox 100×100, viền đậm kiểu sticker ----------
K = 'stroke="#2B2B3A" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"'
N = 'fill="none" stroke="#2B2B3A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"'
EY = lambda x, y, r=3.4: '<circle cx="%s" cy="%s" r="%s" fill="#2B2B3A"/><circle cx="%s" cy="%s" r="1.2" fill="#fff"/>' % (x, y, r, x - 1, y - 1.2)
PICS = {
 'boat': '<path d="M50 12V58" %(N)s/><path d="M53 16 80 54H53Z" fill="#FFD66B" %(K)s/><path d="M47 24 24 54H47Z" fill="#E8604C" %(K)s/><path d="M12 62H88L76 84Q50 90 24 84Z" fill="#8A5A3C" %(K)s/><path d="M8 90q10-6 21 0t21 0 21 0 21 0" fill="none" stroke="#4AA8D8" stroke-width="4" stroke-linecap="round"/>',
 'fish': '<path d="M70 50 92 30V70Z" fill="#E8843C" %(K)s/><ellipse cx="46" cy="50" rx="36" ry="25" fill="#F4A259" %(K)s/><path d="M38 28Q50 12 64 30" fill="#E8843C" %(K)s/><path d="M46 37q9 13 0 26M58 39q7 11 0 22" %(N)s/>' + EY(26, 44, 4.2),
 'crab': '<path d="M16 44 6 34M84 44l10-10M18 66 6 72M82 66l12 6M24 76 16 88M76 76l8 12" %(N)s/><path d="M16 30C4 28 6 12 18 12l-2 9 8-7c7 8 2 17-8 16ZM84 30c12-2 10-18-2-18l2 9-8-7c-7 8-2 17 8 16Z" fill="#E8604C" %(K)s/><ellipse cx="50" cy="58" rx="34" ry="24" fill="#E8604C" %(K)s/><path d="M38 38V30M62 38V30" %(N)s/>' + EY(38, 28, 5) + EY(62, 28, 5) + '<path d="M42 64q8 7 16 0" %(N)s/>',
 'octopus': '<path d="M18 56C6 66 8 82 18 80S26 66 30 64M34 66C28 80 34 92 42 88S46 74 46 68M54 68C54 80 58 92 66 88S72 78 66 66M70 64C76 68 76 80 84 80S94 66 82 56" fill="#A77BFF" %(K)s/><path d="M50 8C24 8 16 30 18 46S34 72 50 72 80 62 82 46 76 8 50 8Z" fill="#A77BFF" %(K)s/>' + EY(38, 42, 5) + EY(62, 42, 5) + '<path d="M43 54q7 6 14 0" %(N)s/><ellipse cx="28" cy="52" rx="5" ry="3" fill="#FF9FB0"/><ellipse cx="72" cy="52" rx="5" ry="3" fill="#FF9FB0"/>',
 'dolphin': '<path d="M8 62C14 34 40 18 66 24 70 14 78 12 82 14 78 20 78 24 82 30 90 36 94 44 92 46 86 46 82 46 78 48 70 60 54 72 34 70 26 76 18 80 12 78 16 74 16 70 18 66 14 66 10 64 8 62Z" fill="#6FB7E8" %(K)s/><path d="M26 66C40 62 56 56 70 50" %(N)s/>' + EY(70, 36, 3.6),
 'whale': '<path d="M6 50C6 26 30 16 52 18 72 20 80 32 84 42 88 36 88 28 84 22 92 24 96 34 92 44 96 46 96 50 92 50 92 60 86 76 56 80 26 84 6 74 6 50Z" fill="#4A86C8" %(K)s/><path d="M8 58Q44 70 84 50 76 78 52 80 20 82 8 58Z" fill="#DDF0FF" %(K)s/>' + EY(26, 46, 4) + '<path d="M44 12q-4-6-10-4M48 12q4-6 10-4" fill="none" stroke="#4AA8D8" stroke-width="3.5" stroke-linecap="round"/>',
 'shark': '<path d="M48 26 58 6 68 30Z" fill="#7C8AA3" %(K)s/><path d="M84 52 96 34V72Z" fill="#7C8AA3" %(K)s/><path d="M6 54C20 32 52 22 88 52 60 78 24 76 6 54Z" fill="#9AA9C0" %(K)s/><path d="M8 56C30 54 60 56 86 53 60 76 26 74 8 56Z" fill="#fff" %(K)s/><path d="M16 58l4 6 4-5 4 6 4-5 4 6 4-6" %(N)s/>' + EY(28, 46, 3.6),
 'turtle': '<ellipse cx="20" cy="74" rx="11" ry="7" fill="#7BC77E" %(K)s/><ellipse cx="74" cy="74" rx="11" ry="7" fill="#7BC77E" %(K)s/><circle cx="84" cy="44" r="13" fill="#7BC77E" %(K)s/><path d="M8 66C10 34 30 22 48 22S76 40 78 66Z" fill="#3E9A5C" %(K)s/><path d="M42 36l12 0 6 12-6 11H42L36 48Z" fill="#7BC77E" %(K)s/>' + EY(87, 42, 3),
 'wave': '<path d="M4 80C10 40 38 14 66 18 86 22 92 40 80 50 72 56 62 50 66 42 52 42 46 60 56 80Z" fill="#4AA8D8" %(K)s/><path d="M4 82H96V92H4Z" fill="#6FB7E8" %(K)s/><path d="M66 18C80 18 92 30 86 44" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
 'shell': '<path d="M50 88 34 78 12 46C10 30 28 12 50 12S90 30 88 46L66 78Z" fill="#FFC1CC" %(K)s/><path d="M50 84 50 14M50 84 30 18M50 84 70 18M50 84 16 36M50 84 84 36" %(N)s/><path d="M36 78H64V90H36Z" fill="#FF9FB0" %(K)s/>',
 'apple': '<path d="M50 30C38 18 12 24 14 54 16 80 34 94 50 86 66 94 84 80 86 54 88 24 62 18 50 30Z" fill="#E8604C" %(K)s/><path d="M50 30C50 22 52 14 58 8" %(N)s/><path d="M56 20C64 8 78 10 82 14 76 24 64 26 56 20Z" fill="#7BC77E" %(K)s/><path d="M26 44q2-8 10-11" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>',
 'ball': '<circle cx="50" cy="50" r="40" fill="#FFD66B" %(K)s/><path d="M50 10C30 26 30 74 50 90 70 74 70 26 50 10Z" fill="#E8604C" %(K)s/><path d="M10 50H90" %(N)s/>',
 'cat': '<path d="M18 44 14 10 42 26M82 44 86 10 58 26" fill="#F4C27A" %(K)s/><ellipse cx="50" cy="56" rx="38" ry="32" fill="#F4C27A" %(K)s/><path d="M50 26V38M38 28 40 38M62 28 60 38" %(N)s/>' + EY(35, 54, 5) + EY(65, 54, 5) + '<path d="M46 64H54L50 69Z" fill="#E8604C"/><path d="M50 69q-5 7-10 3M50 69q5 7 10 3M6 54 22 60M6 70 22 68M94 54 78 60M94 70 78 68" %(N)s/>',
 'dog': '<ellipse cx="50" cy="54" rx="34" ry="34" fill="#C89468" %(K)s/><path d="M22 28C8 26 6 50 12 62 20 66 24 54 26 44ZM78 28C92 26 94 50 88 62 80 66 76 54 74 44Z" fill="#8A5A3C" %(K)s/><ellipse cx="50" cy="66" rx="20" ry="16" fill="#F3DCC0" %(K)s/>' + EY(37, 46, 5) + EY(63, 46, 5) + '<ellipse cx="50" cy="60" rx="6" ry="4.5" fill="#2B2B3A"/><path d="M50 64V70M42 72q8 5 16 0" %(N)s/>',
 'bird': '<path d="M84 44 98 50 84 56Z" fill="#F2A23D" %(K)s/><circle cx="52" cy="50" r="36" fill="#6FB7E8" %(K)s/><path d="M46 80Q26 74 28 52 50 52 56 66 56 76 46 80Z" fill="#4A86C8" %(K)s/>' + EY(68, 40, 5) + '<path d="M44 86V96M58 86V96" %(N)s/>',
 'banana': '<path d="M16 22C14 58 40 88 84 78 90 76 90 70 86 68 56 72 38 52 30 18 26 12 16 14 16 22Z" fill="#FFD66B" %(K)s/><path d="M16 22 20 10 30 14 30 18" fill="#8A5A3C" %(K)s/>',
 'orange': '<circle cx="50" cy="54" r="38" fill="#F2A23D" %(K)s/><path d="M50 16C52 10 60 6 68 8 66 16 58 20 50 16Z" fill="#7BC77E" %(K)s/><circle cx="38" cy="44" r="2" fill="#B9770E"/><circle cx="60" cy="60" r="2" fill="#B9770E"/><circle cx="66" cy="38" r="2" fill="#B9770E"/><circle cx="42" cy="68" r="2" fill="#B9770E"/>',
 'pig': '<path d="M20 30 16 10 38 20M80 30 84 10 62 20" fill="#FFB3C7" %(K)s/><circle cx="50" cy="52" r="38" fill="#FFC1CC" %(K)s/><ellipse cx="50" cy="62" rx="17" ry="12" fill="#FF9FB0" %(K)s/><ellipse cx="44" cy="62" rx="2.6" ry="3.6" fill="#2B2B3A"/><ellipse cx="56" cy="62" rx="2.6" ry="3.6" fill="#2B2B3A"/>' + EY(33, 44, 4.6) + EY(67, 44, 4.6),
 'rice': '<path d="M50 10C30 10 8 62 12 78 16 90 84 90 88 78 92 62 70 10 50 10Z" fill="#fff" %(K)s/><path d="M26 66H74V92H26Z" fill="#2F4A3A" %(K)s/><path d="M40 38q1-1 2 0M58 30q1-1 2 0M54 50q1-1 2 0" %(N)s/>',
 'cake': '<path d="M12 50 50 26 88 50V84H12Z" fill="#FFE2B8" %(K)s/><path d="M12 50 50 26 88 50Q78 66 68 54 58 68 50 54 40 68 30 54 22 66 12 50Z" fill="#FF9FB0" %(K)s/><circle cx="50" cy="22" r="9" fill="#E8604C" %(K)s/><path d="M12 72H88" %(N)s/>',
 'watermelon': '<path d="M8 40H92C92 66 72 86 50 86S8 66 8 40Z" fill="#3E9A5C" %(K)s/><path d="M16 40H84C84 60 68 76 50 76S16 60 16 40Z" fill="#E8604C"/><path d="M34 52l3 6M50 50v7M66 52l-3 6M44 64l1 5M58 64l-1 5" %(N)s/>',
 'tea': '<path d="M24 26H76L68 90H32Z" fill="#E7C9A4" %(K)s/><path d="M30 60H70L68 90H32Z" fill="#B98560" %(K)s/><path d="M18 26H82" %(N)s/><path d="M58 26 66 4" stroke="#E8604C" stroke-width="6" stroke-linecap="round"/><circle cx="42" cy="80" r="4" fill="#2B2B3A"/><circle cx="54" cy="82" r="4" fill="#2B2B3A"/><circle cx="48" cy="70" r="4" fill="#2B2B3A"/><circle cx="60" cy="72" r="4" fill="#2B2B3A"/>',
 'gift': '<rect x="12" y="44" width="76" height="46" rx="6" fill="#E8604C" %(K)s/><rect x="6" y="28" width="88" height="20" rx="6" fill="#FF8A73" %(K)s/><path d="M42 28H58V90H42Z" fill="#FFD66B" %(K)s/><path d="M50 28C38 6 16 12 24 24 28 30 44 28 50 28 56 28 72 30 76 24 84 12 62 6 50 28Z" fill="#FFD66B" %(K)s/>',
 'chest': '<path d="M12 44C12 22 28 14 50 14S88 22 88 44Z" fill="#B9773C" %(K)s/><rect x="10" y="44" width="80" height="42" rx="6" fill="#8A5A3C" %(K)s/><path d="M26 14V86M74 14V86" stroke="#E0A21F" stroke-width="7"/><rect x="40" y="36" width="20" height="24" rx="4" fill="#FFD66B" %(K)s/><circle cx="50" cy="48" r="3.4" fill="#2B2B3A"/>',
 'moon': '<circle cx="50" cy="50" r="40" fill="#FFE9A8" %(K)s/><path d="M50 10A40 40 0 0 0 50 90 56 56 0 0 1 50 10Z" fill="#F0C65A"/><circle cx="62" cy="36" r="6" fill="#F0C65A"/><circle cx="72" cy="60" r="4" fill="#F0C65A"/><circle cx="56" cy="68" r="5" fill="#F0C65A"/>',
 'sun': '<path d="M50 4V16M50 84V96M4 50H16M84 50H96M18 18l8 8M74 74l8 8M18 82l8-8M74 26l8-8" stroke="#F2A23D" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="50" r="28" fill="#FFD66B" %(K)s/>' + EY(40, 46, 3.6) + EY(60, 46, 3.6) + '<path d="M42 58q8 7 16 0" %(N)s/>',
 'books': '<path d="M50 24C38 14 22 14 10 18V80C22 76 38 76 50 86 62 76 78 76 90 80V18C78 14 62 14 50 24Z" fill="#fff" %(K)s/><path d="M50 24V86" %(N)s/><path d="M20 34q10-3 20 2M20 48q10-3 20 2M60 36q10-5 20-2M60 50q10-5 20-2" stroke="#4AA8D8" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
 'sticker': '<path d="M50 6 62 34 92 37 69 57 76 87 50 71 24 87 31 57 8 37 38 34Z" fill="#FFD66B" %(K)s/>' + EY(40, 46, 3.4) + EY(60, 46, 3.4) + '<path d="M43 56q7 6 14 0" %(N)s/>',
 'house': '<path d="M6 48 50 12 94 48Z" fill="#E8604C" %(K)s/><path d="M18 46H82V90H18Z" fill="#FFE2B8" %(K)s/><path d="M42 90V62H58V90Z" fill="#8A5A3C" %(K)s/><path d="M24 54H36V66H24ZM64 54H76V66H64Z" fill="#BDE8F7" %(K)s/>',
 'monkey': '<circle cx="14" cy="48" r="11" fill="#C89468" %(K)s/><circle cx="86" cy="48" r="11" fill="#C89468" %(K)s/><circle cx="50" cy="48" r="36" fill="#8A5A3C" %(K)s/><path d="M50 40C42 26 22 34 28 52 20 72 40 80 50 80S80 72 72 52C78 34 58 26 50 40Z" fill="#F3DCC0" %(K)s/>' + EY(40, 48, 4.6) + EY(60, 48, 4.6) + '<path d="M40 66q10 7 20 0" %(N)s/>',
 'zebra': '<path d="M26 26 20 6 40 18M74 26 80 6 60 18" fill="#fff" %(K)s/><path d="M50 12C24 12 22 40 28 60S38 92 50 92 66 80 72 60 76 12 50 12Z" fill="#fff" %(K)s/><path d="M50 12C46 18 46 24 50 30 54 24 54 18 50 12ZM26 34 40 38M74 34 60 38M28 50 40 50M72 50 60 50" fill="#2B2B3A" stroke="#2B2B3A" stroke-width="5" stroke-linecap="round"/><path d="M36 72C38 66 62 66 64 72S58 92 50 92 34 80 36 72Z" fill="#9AA9C0" %(K)s/>' + EY(38, 44, 4.2) + EY(62, 44, 4.2),
 'smile': '<circle cx="50" cy="50" r="40" fill="#FFD66B" %(K)s/><path d="M26 44q8-10 16 0M58 44q8-10 16 0" %(N)s/><path d="M28 58q22 28 44 0Z" fill="#E8604C" %(K)s/><ellipse cx="22" cy="58" rx="6" ry="4" fill="#FF9FB0"/><ellipse cx="78" cy="58" rx="6" ry="4" fill="#FF9FB0"/>',
 'pencil': '<path d="M66 12 88 34 34 88 8 92 12 66Z" fill="#FFD66B" %(K)s/><path d="M66 12 76 2 98 24 88 34Z" fill="#E8604C" %(K)s/><path d="M12 66 34 88 8 92Z" fill="#F3DCC0" %(K)s/><path d="M54 24 76 46" %(N)s/>',
}

def pic_defs():
    syms = ''.join('<symbol id="s5-%s" viewBox="0 0 100 100">%s</symbol>' % (k, v.replace('%(K)s', K).replace('%(N)s', N)) for k, v in PICS.items())
    return syms

_src = open(os.path.join(OUT, 'CharKitsu.dc.html'), encoding='utf-8').read()
KDEFS = re.search(r'<svg width="0" height="0".*?<defs>(.*?)</defs></svg>', _src, re.S).group(1)
assert 'Webby' not in KDEFS
DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>%s%s</defs></svg>' % (KDEFS, pic_defs())

def pic(name, size=120, cls=''):
    return '<svg class="%s" width="%d" height="%d" viewBox="0 0 100 100" role="img" aria-label="%s" style="flex:none;display:block"><use href="#s5-%s"/></svg>' % (cls, size, size, name, name)

def kitsu(w=240, cls='bob'):
    h = round(w * 170 / 200)
    return ('<svg class="%s" width="%d" height="%d" viewBox="-20 -10 200 170" role="img" aria-label="Kitsu" style="flex:none;display:block;overflow:visible">'
            '<ellipse cx="80" cy="146" rx="38" ry="6" fill="#2B2B3A" opacity=".14"/>'
            '<g class="wag"><use href="#ktail" transform="rotate(48 80 122) translate(80 122) scale(.85) translate(-80 -122)"/></g>'
            '<use href="#fox"/><use href="#kleaf"/></svg>') % (cls, w, h)

def ic(name, size=32, style=''):
    return icon(name, 'ic', 'width:%dpx;height:%dpx;%s' % (size, size, style))

def stars(n, size=32, total=3, pop=False):
    out = ''
    for i in range(total):
        cls = ' class="spop" ' if pop else ''
        on = i < n
        s = 'width:%dpx;height:%dpx;color:var(--%s);fill:var(--%s)' % (size, size, 'warning' if on else 'line', 'coin' if on else 'surface2')
        out += '<span%sstyle="display:inline-flex;--d:%dms">%s</span>' % (cls if pop else ' ', i * 160, icon('star', 'ic', s))
    return '<span class="row" style="gap:4px">%s</span>' % out

def hearts(n):
    out = ''
    for i in range(5):
        on = i < n
        out += icon('heart', 'ic', 'width:44px;height:44px;color:var(--%s);fill:var(--%s)' % ('danger' if on else 'line', 'danger' if on else 'surface2'))
    return '<span class="row" style="gap:4px">%s</span>' % out

def speaker(size=96, cls='ring', label='Nghe'):
    return '<button class="kround %s" aria-label="%s" style="width:%dpx;height:%dpx;background:var(--warningSoft);color:var(--warning)">%s</button>' % (cls, label, size, size, ic('volume', round(size * .5)))

def primary(ic_name, label, text=''):
    return '<button class="kprimary" aria-label="%s">%s%s</button>' % (label, ic(ic_name, 40), text)

def round_btn(ic_name, label, size=72, style=''):
    return '<button class="kround" aria-label="%s" style="width:%dpx;height:%dpx;%s">%s</button>' % (label, size, size, style, ic(ic_name, round(size * .46)))

def plate(html, style=''):
    return '<div class="hud" style="%s">%s</div>' % (style, html)

def bubble(text, style=''):
    return '<div class="bubble kf" style="%s">%s</div>' % (style, text)

# ---------- Nền cảnh ----------
def clouds(op=1):
    def c(x, y, s, d):
        return '<g class="drift" style="--t:%ds" opacity="%s"><g transform="translate(%d %d) scale(%s)"><path d="M0 40a22 22 0 0 1 8-42 34 34 0 0 1 62-8 26 26 0 0 1 40 50Z" fill="#fff"/></g></g>' % (d, op, x, y, s)
    return c(120, 110, 1, 70) + c(700, 124, .8, 90) + c(1010, 160, 1.1, 60)

def scene(kind='meadow'):
    if kind == 'meadow':
        g = ('<defs><linearGradient id="s5-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE6FF"/><stop offset="1" stop-color="#FFF4D6"/></linearGradient></defs>'
             '<rect width="1280" height="720" fill="url(#s5-sky)"/>' + clouds() +
             '<path d="M0 560C200 480 360 500 560 560S980 620 1280 500V720H0Z" fill="#BFE6A8"/>'
             '<path d="M0 640C260 580 520 620 760 650S1120 660 1280 610V720H0Z" fill="#9AD68C"/>')
    elif kind == 'sea':
        g = ('<defs><linearGradient id="s5-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BDE8F7"/><stop offset="1" stop-color="#E9F8F4"/></linearGradient></defs>'
             '<rect width="1280" height="720" fill="url(#s5-sky)"/>' + clouds() +
             '<path d="M40 520C60 400 110 360 150 400S190 300 240 340 280 470 310 520ZM960 520C990 380 1040 330 1080 380S1130 280 1180 330 1240 460 1270 520Z" fill="#8CC8A8"/>'
             '<path d="M0 500H1280V720H0Z" fill="#6FC6DE"/>'
             '<path d="M0 570q60-18 120 0t120 0 120 0 120 0 120 0 120 0 120 0 120 0 120 0 120 0 120 0V720H0Z" fill="#4FB3D2"/>'
             '<path d="M0 640q80-16 160 0t160 0 160 0 160 0 160 0 160 0 160 0 160 0V720H0Z" fill="#3D9FC2"/>'
             '<path d="M-20 720C-10 640 90 612 220 618S500 660 540 720Z" fill="#F3DCA8"/><path d="M-20 720C40 668 140 656 240 662S440 690 500 720Z" fill="#E8C98A"/>')
    elif kind == 'night':
        st = ''.join('<circle class="tw" cx="%d" cy="%d" r="%s" fill="#FFE9A8" style="animation-delay:%dms"/>' % (x, y, r, d) for x, y, r, d in
                     [(90, 80, 3, 0), (220, 180, 2.4, 300), (380, 70, 2.6, 900), (520, 170, 2, 500), (760, 60, 3, 1200), (900, 170, 2.4, 200), (1060, 90, 3, 700), (1200, 200, 2.4, 1000), (150, 300, 2, 400), (1120, 320, 2.2, 1500)])
        g = ('<defs><linearGradient id="s5-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E2748"/><stop offset="1" stop-color="#34407A"/></linearGradient></defs>'
             '<rect width="1280" height="720" fill="url(#s5-sky)"/>' + st + clouds(.1) +
             '<path d="M0 580C200 500 360 520 560 580S980 640 1280 520V720H0Z" fill="#2B3A5E"/>'
             '<path d="M0 650C260 600 520 640 760 665S1120 670 1280 630V720H0Z" fill="#232F4E"/>')
    return '<svg class="bgscene" viewBox="0 0 1280 720" width="1280" height="720" aria-hidden="true">%s</svg>' % g

def topbar(left='', center='', score=12, lock=True):
    return ('<div class="topbar"><div style="width:220px;display:flex;gap:12px;align-items:center">%s</div>'
            '<div style="flex:1;display:flex;justify-content:center;align-items:center;gap:12px;min-width:0">%s</div>'
            '<div style="width:220px;display:flex;justify-content:flex-end;gap:12px;align-items:center">%s%s</div></div>') % (
        left, center,
        plate('%s<span class="kf" style="font-size:26px">%d</span>' % (stars(1, 32, 1), score), 'height:56px;padding:0 20px 0 12px;gap:8px') if score is not None else '',
        round_btn('lock', 'Khu vực phụ huynh', 48, 'opacity:.65') if lock else '')

HOME = round_btn('home', 'Màn hình chính', 64)
MAPB = round_btn('map', 'Về bản đồ', 64)

def scene(kind='meadow'):
    return village().kid_scene(1280, kind if kind in ('sea', 'night') else 'meadow')

def board(name, title, body, sc='meadow', dark=False):
    html = '%s<div class="t kids%s" style="width:1280px;height:720px;position:relative;overflow:hidden;background:var(--bg)">%s%s</div>' % (
        DEFS, ' dark' if dark else '', scene(sc), body)
    write(name, html, 1280, 720, title=title, css=KCSS)

KCSS = """
.bgscene{position:absolute;inset:0}
.kf{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;line-height:1.1}
.topbar{position:absolute;left:24px;right:24px;top:16px;height:64px;display:flex;align-items:center;gap:12px;z-index:3}
.stage{position:absolute;left:24px;right:24px;top:92px;bottom:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.hud{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--surface);color:var(--ink);border:3px solid var(--ink);box-shadow:0 4px 0 var(--ink);border-radius:var(--r-pill)}
.kbig{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:var(--surface);color:var(--ink);border:4px solid var(--ink);box-shadow:0 8px 0 var(--ink);border-radius:var(--r-lg);padding:16px;cursor:pointer;font:inherit}
.kbig.right{background:var(--successSoft);border-color:var(--success);box-shadow:0 8px 0 var(--success)}
.kbig.soft{background:var(--warningSoft);border-color:var(--warning);box-shadow:0 8px 0 var(--warning)}
.kbig.off{background:var(--surface2);box-shadow:0 4px 0 var(--ink)}.kbig.off svg{opacity:.4}
.kround{display:inline-flex;align-items:center;justify-content:center;flex:none;padding:0;background:var(--surface);color:var(--ink);border:3px solid var(--ink);box-shadow:0 4px 0 var(--ink);border-radius:var(--r-pill);cursor:pointer}
.kprimary{display:inline-flex;align-items:center;justify-content:center;gap:12px;flex:none;min-width:136px;height:88px;padding:0 32px;background:var(--success);color:var(--surface);border:4px solid var(--ink);box-shadow:0 8px 0 var(--ink);border-radius:var(--r-pill);cursor:pointer;font:800 26px 'Baloo 2','Be Vietnam Pro',sans-serif}
.kghost{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 24px;background:transparent;color:var(--ink);border:3px solid var(--ink);border-radius:var(--r-pill);cursor:pointer;font:600 16px 'Be Vietnam Pro',sans-serif}
.pill{position:absolute;top:-16px;right:-16px;min-width:56px;height:48px;padding:0 12px;display:inline-flex;align-items:center;justify-content:center;border:3px solid var(--ink);border-radius:var(--r-pill);font:800 26px 'Baloo 2',sans-serif;box-shadow:0 3px 0 var(--ink)}
.mark{position:absolute;top:-16px;right:-16px;width:56px;height:56px;display:inline-flex;align-items:center;justify-content:center;border:3px solid var(--ink);border-radius:var(--r-pill);background:var(--success);color:var(--surface);box-shadow:0 3px 0 var(--ink)}
.bubble{position:relative;display:inline-block;padding:12px 24px;background:var(--surface);color:var(--ink);border:3px solid var(--ink);box-shadow:0 4px 0 var(--ink);border-radius:var(--r-lg);font-size:26px;white-space:nowrap}
.bubble:after{content:'';position:absolute;left:32px;bottom:-16px;width:24px;height:24px;background:var(--surface);border-right:3px solid var(--ink);border-bottom:3px solid var(--ink);transform:rotate(45deg) skew(12deg,12deg)}
.bubble.l:after{left:-14px;top:50%;bottom:auto;margin-top:-12px;border:0;border-left:3px solid var(--ink);border-bottom:3px solid var(--ink);transform:rotate(45deg) skew(12deg,12deg)}
.vi{font:600 16px 'Be Vietnam Pro',sans-serif;color:var(--inkSoft)}
.steps{display:flex;align-items:center;gap:4px;height:64px;padding:0 12px}
.step{width:44px;height:44px;border-radius:var(--r-pill);display:inline-flex;align-items:center;justify-content:center;background:var(--surface2);color:var(--inkSoft);border:3px solid transparent}
.step.past{background:var(--success);color:var(--surface)}
.step.on{background:var(--primary);color:var(--surface);border-color:var(--ink)}
.steplink{width:12px;height:4px;border-radius:var(--r-pill);background:var(--line)}
.steplink.past{background:var(--success)}
.confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1}
.confetti i{position:absolute;top:-24px;width:12px;height:16px;border-radius:var(--r-sm);animation:fall 3.4s linear infinite;animation-delay:var(--d)}
.scrim{position:absolute;inset:0;background:var(--ink);opacity:.6}
.dark .scrim{background:var(--bg);opacity:.72}
.key{display:inline-flex;align-items:center;justify-content:center;height:80px;background:var(--surface);color:var(--ink);border:3px solid var(--ink);box-shadow:0 4px 0 var(--ink);border-radius:var(--r-md);font:800 32px 'Baloo 2',sans-serif;cursor:pointer}
.key.act{background:var(--primarySoft);color:var(--primary)}
.key:disabled{opacity:.5}
.dot{width:32px;height:32px;border-radius:var(--r-pill);border:3px solid var(--ink);background:var(--surface)}
.dot.on{background:var(--primary)}
.wag{transform-box:view-box;transform-origin:80px 122px;animation:wag 1.6s ease-in-out infinite}
.bob{animation:bob 2.4s ease-in-out infinite}
.ring{animation:ring 2.4s ease-out infinite}
.drift{animation:drift var(--t) linear infinite alternate}
.tw{animation:tw 3s ease-in-out infinite}
.nudge{animation:nudge 1.8s ease-in-out infinite}
.shake{animation:shake 4s ease infinite}
.spop{animation:spop 480ms ease backwards;animation-delay:var(--d)}
.popin{animation:popin 480ms ease backwards}
.throb{animation:throb 1.8s ease-in-out infinite}
@keyframes wag{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(10deg)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes ring{0%{box-shadow:0 4px 0 var(--ink),0 0 0 0 var(--coin)}70%,100%{box-shadow:0 4px 0 var(--ink),0 0 0 16px transparent}}
@keyframes drift{from{transform:translateX(-24px)}to{transform:translateX(48px)}}
@keyframes tw{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}
@keyframes throb{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes shake{0%,70%,100%{transform:translateX(0)}74%{transform:translateX(-9px)}80%{transform:translateX(8px)}86%{transform:translateX(-6px)}92%{transform:translateX(4px)}}
@keyframes spop{0%{transform:scale(0) rotate(-30deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
@keyframes popin{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
@keyframes fall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(780px) rotate(540deg)}}
@media (prefers-reduced-motion:reduce){.wag,.bob,.ring,.drift,.tw,.nudge,.shake,.spop,.popin,.throb{animation:none}.confetti{display:none}}
"""

CONF = ['primary', 'coin', 'success', 'danger', 'xp']
def confetti(n=40):
    return '<div class="confetti" aria-hidden="true">%s</div>' % ''.join(
        '<i style="left:%d%%;background:var(--%s);--d:-%dms"></i>' % ((i * 37) % 100, CONF[i % 5], (i * 530) % 3400) for i in range(n))

# ---------- Trang chính ----------
TILES = [('ball', "Let's play!", 'Bản đồ: đi chơi, học từ mới', 'primarySoft', ('3', 'danger')),
         ('apple', 'ABC', 'Học chữ cái, âm, từ', 'successSoft', None),
         ('sticker', 'My stickers', 'Album sticker', 'warningSoft', ('12/183', 'coin')),
         ('cat', 'My pet', 'Cho thú cưng ăn', 'xpSoft', None)]

def tile(p, say, vi, soft, badge):
    b = ''
    if badge:
        col = 'background:var(--danger);color:var(--surface)' if badge[1] == 'danger' else 'background:var(--coin);color:var(--ink)'
        b = '<span class="pill" style="top:-12px;right:-12px;%s">%s</span>' % (col, badge[0])
    return ('<button class="kbig" style="width:408px;height:276px;flex-direction:row;gap:16px;padding:16px 24px">%s'
            '<span style="width:164px;height:164px;border-radius:var(--r-pill);background:var(--%s);display:flex;align-items:center;justify-content:center;flex:none">%s</span>'
            '<span style="display:flex;flex-direction:column;gap:8px;text-align:left;min-width:0"><span class="kf" style="font-size:40px">%s</span><span class="vi" style="font-size:14px;line-height:1.35">%s</span>'
            '<span style="color:var(--warning);display:inline-flex;margin-top:4px">%s</span></span></button>') % (b, soft, pic(p, 124), say, vi, ic('volume', 32))

def home(dark):
    tiles = ''.join(tile(*t) for t in TILES)
    return (topbar() +
            '<div style="position:absolute;left:32px;bottom:64px;width:360px;display:flex;flex-direction:column;align-items:flex-start;gap:24px;z-index:2">'
            + bubble('Hello, Kitsu!', 'font-size:40px;padding:12px 24px;margin-left:16px') + kitsu(360) + '</div>'
            '<div style="position:absolute;right:32px;top:92px;display:grid;grid-template-columns:408px 408px;gap:32px 24px;z-index:2">%s</div>' % tiles)

board('S5KidsHome', 'Bé: trang chính', home(False))
board('S5KidsHomeDark', 'Bé: trang chính tối', home(True), 'night', True)

# ---------- Học chữ: danh sách ----------
UNITS = [('apple', 'ABC', 'Chữ cái'), ('sun', 'Sounds', 'Âm của chữ'), ('cat', 'Blend', 'Ghép âm'), ('books', 'Sight words', 'Từ nhìn là nhớ'),
         ('books', 'Story time', 'Sách tranh'), ('pencil', 'Write ABC', 'Tập viết chữ'), ('bird', 'Say it', 'Nói theo')]
ACTS = [('Letters A to F', 'apple', 3), ('Letters G to L', 'house', 2), ('Letters M to R', 'monkey', 1), ('Letters S to W', 'sun', 0), ('Letters X to Z', 'zebra', 0)]

tabs = ''
for i, (p, a, b) in enumerate(UNITS):
    on = i == 0
    tabs += ('<div class="kbig" style="flex:1;min-width:0;height:128px;padding:8px 4px;gap:4px;%s">%s<span class="kf" style="font-size:20px;white-space:nowrap">%s</span><span class="vi" style="font-size:12px;white-space:nowrap">%s</span></div>'
             % ('background:var(--primarySoft);box-shadow:0 8px 0 var(--primary);border-color:var(--primary)' if on else 'box-shadow:0 4px 0 var(--ink);border-width:3px', pic(p, 56), a, b))
acts = ''.join('<button class="kbig" style="width:232px;height:320px;gap:12px">%s<span class="kf" style="font-size:26px;text-align:center">%s</span>%s</button>' % (pic(p, 148), n, stars(s, 40)) for n, p, s in ACTS)
board('S5KidsLearn', 'Bé: học chữ, danh sách', topbar(HOME, plate('<span class="kf" style="font-size:32px">ABC</span>', 'height:56px;padding:0 32px')) +
      '<div class="stage" style="justify-content:flex-start;gap:32px;padding-top:4px"><div class="row" style="gap:12px;width:100%%">%s</div>'
      '<div class="row" style="gap:16px;justify-content:center;width:100%%">%s</div></div>' % (tabs, acts))

def nav(i, n, center, prev=True):
    return ('<div class="row" style="gap:32px;width:100%%;justify-content:center;align-items:center">'
            '%s%s<div class="nudge">%s</div></div>') % (
        round_btn('back', 'Trước', 88, '' if prev else 'opacity:.4'), center, primary('play', 'Tiếp'))

def count(i, n):
    return plate('<span class="kf" style="font-size:26px">%d / %d</span>' % (i, n), 'height:56px;padding:0 24px')

board('S5KidsLearnTeach', 'Bé: học chữ cái', topbar(HOME, count(1, 6)) + '<div class="stage">' + nav(1, 6,
      '<div class="kbig" style="width:760px;height:440px;flex-direction:row;gap:32px;padding:24px 32px">'
      '<span style="position:absolute;top:16px;right:16px">%s</span>'
      '<span class="kf" style="font-size:160px;line-height:1">A<span style="margin-left:16px;color:var(--primary);font-size:112px">a</span></span>'
      '<span style="display:flex;flex-direction:column;align-items:center;gap:8px">%s<span class="kf" style="font-size:40px;color:var(--primary)">apple</span></span></div>' % (speaker(80), pic('apple', 240)), False)
      + '</div>' + '<div style="position:absolute;left:24px;bottom:16px;z-index:2">%s</div><div style="position:absolute;right:32px;bottom:28px;z-index:2">%s</div>' % (kitsu(180), round_btn('mic', 'Nói thử', 72)))

tiles = ''.join('<button class="kbig" style="width:112px;height:112px"><span class="kf" style="font-size:64px">%s</span></button>' % c for c in 'cat')
board('S5KidsLearnBlend', 'Bé: ghép âm', topbar(HOME, count(1, 4)) + '<div class="stage">' + nav(1, 4,
      '<div class="kbig" style="width:760px;height:500px;gap:16px"><span style="position:absolute;top:16px;right:16px">%s</span>%s<span class="kf" style="font-size:40px;color:var(--primary)">cat</span>'
      '<div class="row" style="gap:16px">%s%s</div></div>' % (speaker(80), pic('cat', 200), tiles, round_btn('play', 'Nghe cả từ', 96, 'background:var(--primarySoft);color:var(--primary)')), False) + '</div>')

board('S5KidsLearnBook', 'Bé: sách tranh', topbar(HOME, count(2, 6)) + '<div class="stage">' + nav(2, 6,
      '<div class="kbig" style="width:760px;height:500px;gap:24px"><span style="position:absolute;top:16px;right:16px">%s</span>%s<span class="kf" style="font-size:40px">I like bananas.</span></div>' % (speaker(80), pic('banana', 300))) + '</div>')

qs = ''.join('<button class="kbig%s" style="width:256px;height:256px">%s<span class="kf" style="font-size:112px;line-height:1">%s</span></button>' % (c, m, l)
             for l, c, m in [('B', ' soft shake', ''), ('D', '', ''), ('F', '', '')])
board('S5KidsLearnQuiz', 'Bé: đố chữ cái', topbar(HOME, count(3, 6)) + '<div class="stage" style="gap:32px"><div class="row" style="gap:24px">%s%s</div><div class="row" style="gap:32px">%s</div></div>' % (speaker(112), bubble('Try again!').replace('class="bubble kf"', 'class="bubble l kf"'), qs)
      + '<div style="position:absolute;left:24px;bottom:16px;z-index:2">%s</div>' % kitsu(160))

trace_svg = ('<svg width="420" height="420" viewBox="0 0 320 320" role="img" aria-label="Chữ A để tô">'
             '<rect x="2" y="2" width="316" height="316" rx="16" fill="#fff"/>'
             '<path d="M160 44 62 276M160 44 258 276M100 196H220" fill="none" stroke="#E4ECFF" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>'
             '<path d="M160 44 62 276M160 44 258 276M100 196H220" fill="none" stroke="#3F6FE0" stroke-width="3" stroke-dasharray="10 9" stroke-linecap="round"/>'
             '<path d="M160 44 118 142 92 206" fill="none" stroke="#E8604C" stroke-width="24" stroke-linecap="round"/>'
             '<circle cx="92" cy="206" r="16" fill="#FFD66B" stroke="#2B2B3A" stroke-width="3.5"/></svg>')
board('S5KidsLearnTrace', 'Bé: tập viết', topbar(HOME, count(1, 5)) +
      '<div class="stage" style="flex-direction:row;gap:40px"><div class="col" style="gap:24px;align-items:center">%s%s</div>'
      '<div class="hud" style="border-radius:var(--r-lg);padding:8px;border-width:4px;box-shadow:0 8px 0 var(--ink)">%s</div>'
      '<div class="nudge">%s</div></div>' % (speaker(96), round_btn('repeat', 'Xoá tô lại', 72), trace_svg, primary('check', 'Xong'))
      + '<div style="position:absolute;left:32px;bottom:16px;z-index:2">%s</div>' % kitsu(190))

board('S5KidsLearnSay', 'Bé: nói theo', topbar(HOME, count(1, 5)) +
      '<div class="stage"><div class="kbig" style="width:560px;height:380px;gap:8px">%s<span class="kf" style="font-size:40px;color:var(--primary)">dog</span></div>'
      '<div class="row" style="gap:32px">%s<div class="nudge">%s</div></div>%s</div>' % (
          pic('dog', 260), speaker(96), primary('mic', 'Đã nói', ic('check', 40)),
          plate('<span class="vi">Nghe rồi nói theo, xong bấm nút xanh (chưa chấm giọng nói)</span>', 'height:40px;padding:0 24px;box-shadow:none;border-width:2px')))

board('S5KidsLearnResult', 'Bé: kết quả hoạt động', confetti() + topbar(HOME) +
      '<div class="stage" style="z-index:2;gap:16px"><div class="hud kf popin" style="font-size:64px;height:112px;padding:0 48px">Great job!</div>'
      '<div class="row" style="gap:40px;align-items:center">%s<div class="col" style="align-items:center;gap:16px">%s'
      '<div class="kbig popin" style="flex-direction:row;background:var(--warningSoft);padding:12px 32px;gap:16px">%s<span class="kf" style="font-size:26px">Quà cho thú cưng!</span></div></div></div>'
      '<div class="row" style="gap:32px">%s<div class="nudge">%s</div></div></div>' % (kitsu(240), stars(2, 88, pop=True), pic('cake', 120), round_btn('repeat', 'Chơi lại', 88), primary('play', 'Tiếp')))

# ---------- Lượt 5 bước, Hạ Long: boat, fish, crab, octopus ----------
STEPS = [('eye', 'Làm quen'), ('pointer', 'Chạm hình'), ('copy', 'Lật thẻ'), ('chat', 'Nói theo'), ('ear', 'Nghe câu')]
def rail(no):
    out = ''
    for i, (ic_n, label) in enumerate(STEPS, 1):
        cls = ' on' if i == no else (' past' if i < no else '')
        if i > 1:
            out += '<span class="steplink%s"></span>' % (' past' if i <= no else '')
        out += '<span class="step%s" title="%s">%s</span>' % (cls, label, ic('check' if i < no else ic_n, 24))
    return '<div class="hud steps" aria-label="Các bước của lượt chơi">%s</div>' % out

PLACE = plate('<span class="kf" style="font-size:20px">Hạ Long</span>', 'height:56px;padding:0 24px')
def visit_bar(no, n=None):
    return topbar(MAPB + PLACE, rail(no), score=12)

board('S5KidsVisit', 'Bé: lượt chơi 1, làm quen', visit_bar(1) +
      '<div class="stage" style="flex-direction:row;gap:32px"><div style="width:260px;flex:none;display:flex;flex-direction:column;align-items:center;gap:32px;align-self:flex-end;padding-bottom:16px">%s%s</div>'
      '<div class="kbig" style="width:600px;height:540px;gap:8px"><span style="position:absolute;top:16px;right:16px">%s</span>%s<span class="kf" style="font-size:64px;color:var(--primary)">boat</span><span class="vi" style="font-size:20px">thuyền</span></div>'
      '<div class="nudge" style="width:260px;display:flex;justify-content:center">%s</div></div>' % (bubble('boat, boat!'), kitsu(240), speaker(88), pic('boat', 340), primary('chevron', 'Tiếp')), 'sea')

def choices(items, size=210, w=296, h=296):
    out = ''
    for p, cls, mark in items:
        m = '<span class="mark">%s</span>' % ic('check', 32) if mark else ''
        out += '<button class="kbig%s" style="width:%dpx;height:%dpx">%s%s</button>' % (cls, w, h, m, pic(p, size))
    return '<div class="row" style="gap:40px">%s</div>' % out

board('S5KidsVisitTap', 'Bé: lượt chơi 2, chạm hình', visit_bar(2) +
      '<div class="stage" style="gap:32px"><div class="row" style="gap:24px">%s%s</div>%s</div>' % (speaker(112), bubble('Try again!').replace('class="bubble kf"', 'class="bubble l kf"'), choices([('fish', ' soft shake', False), ('crab', '', False), ('shell', '', False)]))
      + '<div style="position:absolute;left:24px;bottom:8px;z-index:2">%s</div>' % kitsu(150), 'sea')

def flip(p=None, st=''):
    inner = pic(p, 124) if p else ic('star', 64, 'color:var(--primary);fill:var(--primarySoft)')
    m = '<span class="mark" style="width:40px;height:40px;top:-12px;right:-12px">%s</span>' % ic('check', 24) if st == 'right' else ''
    return '<button class="kbig%s" style="width:180px;height:180px;padding:8px">%s%s</button>' % (' right' if st == 'right' else '', m, inner)
grid = ''.join([flip('crab', 'right'), flip(), flip('boat'), flip(), flip(), flip('crab', 'right'), flip(), flip()])
board('S5KidsVisitPairs', 'Bé: lượt chơi 3, lật thẻ', visit_bar(3) +
      '<div class="stage" style="gap:24px"><div class="hud kf" style="font-size:32px;height:64px;padding:0 32px">Find the pairs!</div>'
      '<div style="display:grid;grid-template-columns:repeat(4,180px);gap:24px">%s</div></div>' % grid, 'sea')

board('S5KidsVisitSpeak', 'Bé: lượt chơi 4, nói theo', visit_bar(4) +
      '<div class="stage" style="flex-direction:row;gap:40px"><div class="col" style="align-items:center;gap:32px;width:260px;align-self:flex-end;padding-bottom:16px">%s%s</div>'
      '<div class="kbig" style="width:520px;height:520px">%s<span class="kf" style="font-size:40px;color:var(--primary)">octopus</span></div>'
      '<div class="col" style="align-items:center;gap:32px;width:280px">%s<button class="kround throb" aria-label="Bé đã nói xong" style="width:140px;height:140px;background:var(--warningSoft)">%s</button>'
      '<div class="hud" style="border-radius:var(--r-md);padding:8px 16px;box-shadow:none;border-width:2px;text-align:center"><span class="vi" style="font-size:14px">Nghe rồi nói theo, nói xong chạm ngôi sao (chưa chấm giọng nói)</span></div></div></div>'
      % (bubble('Say: octopus'), kitsu(220), pic('octopus', 340), speaker(112), stars(1, 80, 1)), 'sea')

board('S5KidsVisitSentence', 'Bé: lượt chơi 5, nghe câu', confetti(20) + visit_bar(5) +
      '<div class="stage" style="gap:24px;z-index:2"><div class="row" style="gap:24px">%s<div class="hud popin" style="height:96px;padding:0 40px;flex-direction:column;gap:0;border-radius:var(--r-lg)"><span class="kf" style="font-size:40px;color:var(--primary)">I see a boat.</span><span class="vi" style="font-size:14px">Bé thấy một chiếc thuyền.</span></div></div>%s</div>'
      % (speaker(112), choices([('fish', ' off', False), ('boat', ' right', True), ('octopus', ' off', False)], 200, 280, 280)), 'sea')

board('S5KidsVisitDone', 'Bé: xong lượt, rương thưởng', confetti() + topbar('', '', score=12) +
      '<div class="stage" style="z-index:2;flex-direction:row;gap:40px"><div class="col" style="align-items:center;gap:16px;align-self:flex-end">%s</div>'
      '<div class="col" style="align-items:center;gap:16px;width:640px"><div class="hud kf popin" style="font-size:64px;height:104px;padding:0 48px">You did it!</div>%s'
      '<div class="kbig popin" style="flex-direction:row;background:var(--warningSoft);padding:12px 24px;gap:16px">%s%s<span class="kf" style="font-size:26px;text-align:left">Rương kho báu!<br>Quà cho thú cưng</span></div>'
      '<div class="hud" style="height:48px;padding:0 24px;background:var(--xpSoft);color:var(--xp)"><span class="kf" style="font-size:20px">Vùng đất mới đã mở!</span></div>'
      '<div class="nudge" style="margin-top:8px">%s</div></div></div>' % (kitsu(340), stars(3, 80, pop=True), pic('chest', 104), pic('watermelon', 88), primary('map', 'Về bản đồ')), 'sea')

board('S5KidsVisitEmpty', 'Bé: hết từ mới hôm nay', topbar(MAPB, '') +
      '<div class="stage" style="gap:16px">%s<div class="hud kf" style="font-size:40px;height:80px;padding:0 40px">See you tomorrow!</div>'
      '<div class="hud" style="padding:8px 24px;box-shadow:none;border-width:2px;border-radius:var(--r-md);max-width:800px;text-align:center"><span class="vi">Hôm nay bé đã học đủ từ mới. Mai học tiếp nhé! (Vẫn có thể ôn bằng bình tưới.)</span></div>'
      '<div class="row" style="gap:32px;margin-top:8px">%s%s</div></div>' % (pic('moon', 200), kitsu(190), primary('map', 'Về bản đồ')), 'night')

# ---------- Ôn ----------
HINT = plate('<span class="vi">Nghe từ rồi chạm vào hình đúng</span>', 'height:48px;padding:0 24px')
board('S5KidsReview', 'Bé: ôn, nghe và chạm hình', topbar(HOME) +
      '<div class="stage" style="gap:24px"><div class="row" style="gap:24px">%s%s</div>%s</div>' % (speaker(112), HINT, choices([('dog', '', False), ('apple', '', False), ('turtle', '', False)]))
      + '<div style="position:absolute;left:24px;bottom:8px;z-index:2">%s</div>' % kitsu(150))

board('S5KidsReviewWin', 'Bé: ôn, sticker mới', topbar(HOME) +
      '<div class="stage" style="gap:24px;justify-content:flex-start;padding-top:8px"><div class="row" style="gap:24px">%s<div class="hud kf" style="font-size:40px;height:80px;padding:0 40px;color:var(--primary)">turtle</div></div>%s</div>'
      '<div class="scrim" style="z-index:3"></div><div style="position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center">'
      '<div class="kbig popin" style="width:520px;height:440px;background:var(--warningSoft);gap:8px">%s<span class="kf" style="font-size:40px">Sticker mới!</span><span class="kf" style="font-size:26px;color:var(--primary)">turtle</span></div></div>'
      % (speaker(96), choices([('dog', ' off', False), ('apple', ' off', False), ('turtle', ' right', True)]), pic('turtle', 240)) + confetti(30).replace('class="confetti"', 'class="confetti" style="z-index:5"'))

board('S5KidsReviewDone', 'Bé: ôn xong', confetti(24) + topbar(HOME, '') +
      '<div class="stage" style="z-index:2;gap:16px">%s<div class="hud kf" style="font-size:40px;height:80px;padding:0 40px">All done!</div>'
      '<div class="hud" style="height:48px;padding:0 24px;box-shadow:none;border-width:2px"><span class="vi">Bé đã học xong lượt này. Hẹn gặp lại!</span></div><div class="nudge" style="margin-top:8px">%s</div></div>'
      '<div style="position:absolute;left:64px;bottom:40px;z-index:2">%s</div>' % (pic('sticker', 220), primary('home', 'Màn hình chính'), kitsu(240)))

board('S5KidsReviewLater', 'Bé: chưa có thẻ đến hạn', topbar(HOME, '') +
      '<div class="stage" style="gap:16px">%s<div class="hud kf" style="font-size:40px;height:80px;padding:0 40px">See you later!</div>'
      '<div class="hud" style="height:48px;padding:0 24px;box-shadow:none;border-width:2px"><span class="vi">Chưa có thẻ nào đến hạn. Quay lại sau nhé!</span></div><div style="margin-top:8px">%s</div></div>' % (pic('moon', 220), primary('home', 'Màn hình chính')), 'night')

# ---------- Album ----------
ALBUM = [('boat', 1), ('fish', 1), ('crab', 1), ('octopus', 1), ('dolphin', 1), ('shell', 1), ('apple', 1), ('ball', 1), ('cat', 1), ('dog', 1), ('bird', 1), ('turtle', 1),
         ('whale', 0), ('shark', 0), ('wave', 0), ('banana', 0), ('orange', 0), ('pig', 0)]
def slot(w, e):
    if e:
        return '<button class="kbig" style="height:176px;padding:8px;gap:0;box-shadow:0 4px 0 var(--ink);border-width:3px">%s<span class="kf" style="font-size:20px">%s</span></button>' % (pic(w, 112), w)
    return ('<div style="height:176px;border:3px dashed var(--inkSoft);border-radius:var(--r-lg);display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--surface2)">'
            '<span style="filter:brightness(0) opacity(.18)">%s</span><span class="kf" style="font-size:20px;color:var(--inkSoft)">?</span></div>') % pic(w, 112)
board('S5KidsAlbum', 'Bé: album sticker', topbar(HOME, plate('%s<span class="kf" style="font-size:32px">12 / 183</span>' % stars(1, 36, 1), 'height:60px;padding:0 24px')
       + plate('<span class="vi" style="font-size:14px">Chạm vào sticker để nghe. Trả lời đúng để dán thêm!</span>', 'height:44px;padding:0 16px;box-shadow:none;border-width:2px;white-space:nowrap'), score=None) +
      '<div class="stage" style="flex-direction:row;gap:16px;align-items:center"><div style="flex:1;display:grid;grid-template-columns:repeat(6,1fr);gap:16px 16px">%s</div>'
      '<div class="col" style="gap:24px;align-items:center">%s%s</div></div>' % (''.join(slot(*a) for a in ALBUM),
       round_btn('back', 'Trang trước', 64, 'opacity:.4;transform:rotate(90deg)'), round_btn('chevron', 'Trang sau', 64, 'transform:rotate(90deg)')))

# ---------- Thú cưng ----------
METERS = [(pic('rice', 48), 4), (pic('smile', 48), 5), (pic('sun', 48), 3)]
meters = ''.join('<div class="row" style="gap:12px">%s%s</div>' % (i, hearts(n)) for i, n in METERS)
def pet_left(w=380):
    return ('<div class="col" style="align-items:center;gap:16px;width:440px;flex:none"><div class="hud kf" style="font-size:40px;height:76px;padding:0 40px">Kitsu</div>%s</div>' % kitsu(w))
FOODS = [('rice', 'rice', 3), ('cake', 'cake', 1), ('watermelon', 'watermelon', 2), ('tea', 'tea', 1)]
foods = ''.join('<button class="kbig" style="height:188px;gap:4px;padding:8px">%s<span class="kf" style="font-size:26px">%s</span><span class="pill" style="background:var(--coin);color:var(--ink);top:-12px;right:-12px">x%d</span></button>' % (pic(p, 112), n, q) for p, n, q in FOODS)
def meters_card():
    return '<div class="kbig" style="flex-direction:column;align-items:center;gap:8px;padding:12px 24px;cursor:default;width:100%%;box-shadow:0 4px 0 var(--ink);border-width:3px">%s</div>' % meters
board('S5KidsPet', 'Bé: thú cưng', topbar(HOME) +
      '<div class="stage" style="flex-direction:row;gap:32px">%s<div class="col" style="flex:1;min-width:0;gap:24px;align-items:center">%s'
      '<div class="hud" style="height:48px;padding:0 24px"><span class="vi">Chạm vào món ăn để cho ăn</span></div>'
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;width:100%%">%s</div></div></div>' % (pet_left(), meters_card(), foods))

board('S5KidsPetEmpty', 'Bé: thú cưng, hết đồ ăn', topbar(HOME) +
      '<div class="stage" style="flex-direction:row;gap:32px">%s<div class="col" style="flex:1;min-width:0;gap:24px;align-items:center">%s'
      '<div style="width:100%%;height:236px;border:3px dashed var(--inkSoft);border-radius:var(--r-lg);background:var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">'
      '<span style="filter:grayscale(1) opacity(.5)">%s</span><span class="vi" style="font-size:20px">Chơi và học để nhận đồ ăn nhé!</span></div>'
      '</div></div>' % (pet_left(), meters_card(), pic('cake', 120)))

# ---------- Cổng phụ huynh ----------
KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok']
def pad(disabled=False):
    d = ' disabled' if disabled else ''
    out = ''
    for k in KEYS:
        if k == 'del': out += '<button class="key act" aria-label="Xoá"%s>%s</button>' % (d, ic('delete', 32))
        elif k == 'ok': out += '<button class="key act" aria-label="Xong"%s>%s</button>' % (d, ic('check', 32))
        else: out += '<button class="key"%s>%s</button>' % (d, k)
    return '<div style="display:grid;grid-template-columns:repeat(3,104px);gap:12px">%s</div>' % out

def dots(n):
    return '<div class="row" style="gap:16px">%s</div>' % ''.join('<span class="dot%s"></span>' % (' on' if i < n else '') for i in range(4))

def gate(title, middle, msg='', links=('Quên PIN?', 'Đóng'), disabled=False, hint=''):
    h = '<div class="vi" style="font-size:14px;text-align:center">%s</div>' % hint if hint else ''
    m = '<div style="min-height:44px;display:flex;align-items:center"><span style="font:600 16px \'Be Vietnam Pro\',sans-serif;color:var(--danger);text-align:center">%s</span></div>' % msg
    l = ''.join('<button class="kghost" style="font-size:14px;height:44px;border-width:2px">%s</button>' % x for x in links)
    return ('<div class="scrim" style="z-index:3"></div><div style="position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center">'
            '<div class="kbig" role="dialog" style="flex-direction:row;gap:40px;padding:32px 40px;width:840px;height:520px;cursor:default;background:var(--bg)">'
            '<div class="col" style="flex:1;min-width:0;align-items:center;gap:16px"><span style="color:var(--primary)">%s</span>'
            '<div class="kf" style="font-size:26px;text-align:center;line-height:1.25">%s</div>%s%s%s<div class="row" style="gap:12px;justify-content:center">%s</div></div>%s</div></div>'
            ) % (ic('lock', 44), title, h, middle, m, l, pad(disabled))

def home_behind():
    return topbar() + ('<div style="position:absolute;right:32px;top:92px;display:grid;grid-template-columns:408px 408px;gap:32px 24px;z-index:2">%s</div>' % ''.join(tile(*t) for t in TILES))

board('S5KidsGate', 'Bé: cổng phụ huynh', home_behind() + gate('Nhập PIN phụ huynh', dots(2)))
board('S5KidsGateLocked', 'Bé: cổng phụ huynh, tạm khoá', home_behind() + gate('Nhập PIN phụ huynh', dots(0), 'Nhập sai nhiều lần. Thử lại sau 30 giây.', disabled=True))
board('S5KidsGateSet', 'Bé: đặt PIN lần đầu', home_behind() + gate('Đặt PIN phụ huynh (4 số)', dots(1), hint='PIN giúp bé không vào nhầm khu vực của phụ huynh.', links=('Đóng',)))
forgot = '<div class="kf" style="font-size:40px">6 × 7 = ?</div><div class="kf" style="font-size:32px;min-width:96px;text-align:center;border-bottom:3px solid var(--ink);color:var(--primary)">42</div>'
board('S5KidsGateForgot', 'Bé: quên PIN', home_behind() + gate('Giải phép tính để đặt lại PIN', forgot, links=('Đóng',)))

rest = ('<div class="stage" style="gap:16px">%s<div class="kf" style="font-size:40px;color:var(--ink)">Time to rest!</div>'
        '<div class="vi" style="max-width:480px;text-align:center;color:var(--ink)">Hôm nay bé đã học đủ rồi. Nghỉ ngơi nhé! Phụ huynh có thể cho bé dùng thêm giờ.</div>'
        '<div class="col" style="gap:12px;align-items:center;margin-top:8px"><button class="kghost">Cho dùng thêm 10 phút (cần PIN)</button><button class="kghost">Khu vực phụ huynh</button></div></div>') % pic('moon', 200)
board('S5KidsRest', 'Bé: hết giờ, nghỉ ngơi', rest, 'night', True)
print('xong')
