# Icon vật phẩm cửa hàng (nhóm đồ ăn B) cùng nét "Làng chữ" với thẻ từ: src/renderer/shared/art/items/food-*.svg
#   python scripts/design-data/review/gen_items_food_b.py
# Dùng lại hình thẻ có sẵn (banana, cookie, donut, soup, sushi, hamburger), vẽ mới bubble-tea, feast, birthday-cake.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'src', 'renderer', 'shared', 'art', 'items')
sys.path.insert(0, HERE)
import gen_cards as C
from gen_cards import F, P, L, E, EF, HL, SH, R, K

def s_bubble_tea():
    o = SH(354, 110)
    # ống hút to
    o += L('M214 190L250 52', K, 30) + L('M214 190L250 52', '#F268A6', 16)
    o += L('M222 150L238 92', '#FFC8E0', 5)
    cup = 'M92 138H308L284 332C282 344 270 350 256 350H144C130 350 118 344 116 332Z'
    o += F(cup, '#F4FBFF')
    liq = 'M98 178H302L284 332C282 344 270 350 256 350H144C130 350 118 344 116 332Z'
    o += F(liq, '#E2B787') + F('M248 178H302L284 332C282 344 270 350 256 350H210C238 330 250 250 248 178Z', '#C99660')
    # trân châu
    for x, y in ((146, 322), (178, 330), (212, 328), (246, 322), (162, 296), (196, 304), (230, 298), (178, 276), (214, 278)):
        o += E(x, y, 15, 15, '#4A2A1A', 5)
    o += EF(143, 317, 4, 4, '#fff') + EF(175, 325, 4, 4, '#fff') + EF(209, 323, 4, 4, '#fff') + EF(243, 317, 4, 4, '#fff')
    o += P(cup)
    # nắp vòm
    o += P('M86 140C86 96 140 82 200 82C260 82 314 96 314 140Z', '#FFE4EE') + F('M262 90C300 100 314 118 314 140H262Z', '#F5B8D0')
    o += P('M86 140C86 96 140 82 200 82C260 82 314 96 314 140Z') + R(76, 134, 248, 18, '#F268A6', 9, 7)
    o += HL('M112 120Q120 100 150 94', '#fff', 9) + HL('M120 200Q122 250 134 290', '#fff', 10, .85)
    return o

def s_feast():
    o = SH(352, 160)
    o += R(40, 96, 320, 252, '#C9503C', 30) + F('M300 100C346 104 356 130 356 160V320C356 340 340 346 316 346H300Z', '#A83E30') + R(40, 96, 320, 252, 'none', 30)
    o += R(64, 120, 272, 204, '#F4DDB0', 14, 6)
    o += P('M200 120V324M200 214H336', 'none', 6)
    # cơm + mơ muối + mè
    o += E(132, 222, 56, 80, '#FFFDF4', 6) + F('M150 144C176 170 188 230 168 296C196 290 190 160 150 144Z', '#E8DEC4') + E(132, 192, 15, 15, '#E2483E', 5)
    for x, y in ((104, 250), (130, 270), (156, 246), (110, 214)): o += EF(x, y, 3.5, 2.5, K, 25)
    o += HL('M90 176Q86 214 98 250', '#fff', 8, .9)
    # trứng cuộn
    o += R(214, 136, 108, 62, '#F7D24A', 16, 6) + F('M278 140H306C318 140 322 150 322 168V182C322 194 312 198 300 198H278Z', '#E8AE1A') + R(214, 136, 108, 62, 'none', 16, 6)
    o += L('M232 168H300', '#E8AE1A', 5) + HL('M226 150H262', '#fff', 7)
    # tôm + bông cải
    o += E(250, 262, 36, 24, '#F7913A', 6, -18) + L('M230 252Q250 240 270 256M236 270Q254 258 276 270', '#FFD6A0', 4) + L('M286 254L312 232', K, 6)
    o += E(310, 286, 14, 14, '#3CB85A', 5) + E(294, 300, 14, 14, '#3CB85A', 5) + E(324, 304, 14, 14, '#22863E', 5) + E(306, 296, 12, 12, '#3CB85A', 0)
    return o

def s_birthday_cake():
    o = SH(358, 150) + R(40, 336, 320, 20, '#F2E6CF', 10)
    # tầng dưới
    o += P('M52 246V336H348V246Z', '#F7D6A8') + F('M292 246H348V336H292Z', '#E2B078') + F('M52 296H348V320H52Z', '#E2483E')
    o += P('M52 252C48 220 80 208 200 208C320 208 352 220 348 252C348 280 322 276 314 256C302 282 278 282 268 260C254 288 224 288 214 262C200 286 172 286 160 262C148 280 124 280 116 258C108 278 84 278 76 262C62 272 52 268 52 252Z', '#FFF3F0') + P('M52 246V336H348V246', 'none')
    # tầng trên
    o += P('M104 150V212H296V150Z', '#F9C4D8') + F('M250 150H296V212H250Z', '#EE9BBA') + F('M104 182H296V198H104Z', '#7FD6C6')
    o += P('M104 156C100 126 132 114 200 114C268 114 300 126 296 156C296 182 272 178 264 160C254 184 232 184 222 164C210 188 184 188 174 164C162 182 140 182 132 162C124 180 104 178 104 156Z', '#FFFFFF') + P('M104 150V212H296V150', 'none')
    # nến
    for x, c in ((140, '#F268A6'), (180, '#7FD6C6'), (220, '#F7D24A'), (260, '#3C8FD6')):
        o += R(x - 8, 66, 16, 54, c, 5, 6) + P('M%d 64C%d 48 %d 38 %d 28C%d 38 %d 48 %d 64Z' % (x, x - 12, x - 2, x, x + 11, x + 13, x), '#F7A83C', 5)
    o += E(200, 262, 0.1, 0.1, 'none', 0)
    o += EF(120, 234, 7, 7, '#E2483E') + EF(166, 238, 7, 7, '#F7D24A') + EF(236, 234, 7, 7, '#3C8FD6') + EF(284, 236, 7, 7, '#E2483E')
    return o + HL('M76 270Q100 262 130 264', '#fff', 8, .9).replace('#fff', '#FFF1DC') + HL('M122 178Q150 170 176 172', '#fff', 8, .9)

ITEMS = {
    'food-banana': C.DRAW['banana'], 'food-cookie': C.DRAW['cookie'], 'food-donut': C.DRAW['donut'],
    'food-bubble-tea': s_bubble_tea, 'food-soup': C.DRAW['soup'], 'food-sushi': C.DRAW['sushi'],
    'food-burger': C.DRAW['hamburger'], 'food-feast': s_feast, 'food-birthday-cake': s_birthday_cake,
}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, fn in ITEMS.items():
        svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 380 370">%s</svg>' % fn()
        open(os.path.join(OUT, name + '.svg'), 'w', encoding='utf-8').write(svg)
    sys.stdout.reconfigure(encoding='utf-8'); print('đã xuất %d icon vào %s' % (len(ITEMS), OUT))
