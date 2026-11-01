# Icon đồ ăn cho cửa hàng (nhóm A) cùng nét "Làng chữ" với thẻ từ.
#   python scripts/design-data/review/gen_items_food_a.py
# Ghi src/renderer/shared/art/items/food-*.svg. Dùng lại s_* của gen_cards khi thẻ đã có cùng nghĩa.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gen_cards as C
from gen_cards import F, P, L, E, EF, HL, G, SH, R, K, WH
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'src', 'renderer', 'shared', 'art', 'items')

def d_onigiri():
    d = 'M200 56C232 56 262 112 322 270C330 300 306 338 270 338H130C94 338 70 300 78 270C138 112 168 56 200 56Z'
    o = SH(358, 130) + F(d, '#FFFDF4') + F('M240 80C268 130 300 210 322 270C330 300 306 338 270 338H226C300 300 290 170 240 80Z', '#E5DCC4') + P(d)
    o += P('M128 262H272L286 338H114Z', '#2E4A3A') + F('M242 262H272L286 338H236Z', '#1E3228') + L('M128 262H272', K, 7)
    o += P('M200 56C232 56 262 112 322 270', 'none', 0)
    for x, y, a in ((176, 150, 30), (214, 196, -30), (170, 214, 60)): o += '<ellipse cx="%d" cy="%d" rx="9" ry="4.5" fill="#E5DCC4" transform="rotate(%d %d %d)"/>' % (x, y, a, x, y)
    o += E(200, 190, 20, 14, '#E8604C', 5)
    return o + HL('M150 232Q172 128 196 92', '#fff', 11, .9)

def d_cake():
    top = 'M44 214L316 168L344 214Z'
    o = SH(354, 140) + P('M44 214V318Q44 332 60 332H314Q344 332 344 306V214Z', '#FFE4EA') + F('M286 214H344V306Q344 332 314 332H286Z', '#F4B8C6')
    o += F('M44 262H344V286H44Z', '#F7D6A8') + L('M44 262H344M44 286H344', K, 5) + P('M44 214V318Q44 332 60 332H314Q344 332 344 306V214', 'none')
    o += P('M44 214L316 168L344 214C336 232 322 232 316 218C306 238 290 236 284 220C272 240 252 238 246 222C232 242 210 238 204 222C190 240 168 236 162 220C148 240 124 234 120 220C108 240 80 236 72 222C60 236 48 232 44 214Z', '#FF9FB6')
    o += P('M170 192Q170 150 200 148Q228 150 226 188Q226 204 198 206Q172 204 170 192Z', '#E2384E') + L('M200 148Q194 130 182 124M200 148Q208 130 222 126', '#2F9A5A', 6)
    o += L('M190 166V172M208 170V176M198 184V190', '#FFD6DC', 5)
    return o + HL('M62 240Q62 226 80 222', '#fff', 8, .9)

def d_milk_tea():
    o = SH(358, 100) + L('M226 160L262 36', K, 22) + L('M226 160L262 36', '#E2483E', 9)
    d = 'M92 126H308L282 336Q280 348 266 348H134Q120 348 118 336Z'
    o += F(d, '#F2F6FA') + F('M92 126H308L304 160H96Z', '#F2F6FA')
    o += F('M104 196H296L282 336Q280 348 266 348H134Q120 348 118 336Z', '#D9A25E') + F('M250 196H296L282 336Q280 348 266 348H234Q258 280 250 196Z', '#B47A3A')
    for x, y in ((150, 310), (190, 322), (230, 308), (170, 280), (214, 286)): o += E(x, y, 10, 10, '#3A2413', 0)
    o += P(d, 'none') + R(80, 108, 240, 28, '#FFFDF4', 12) + HL('M126 222V290', '#F7E0B0', 12, .85)
    return o + HL('M120 150H160', '#fff', 7, .9)

def d_ramen():
    o = SH(352, 140) + L('M138 112C126 86 154 74 142 48M200 104C188 78 216 66 204 40', '#C9B9A0', 8)
    o += L('M318 26L232 150M352 46L248 160', K, 13) + L('M318 26L232 150M352 46L248 160', '#C98A3E', 5)
    o += E(200, 182, 150, 42, '#E8B050') + L('M90 176q20 -16 40 0t40 0t40 0t40 0t40 0', '#D9A232', 6)
    o += E(150, 176, 34, 24, '#FFF9EA', 6) + E(150, 176, 14, 11, '#F7A83C', 0)
    o += R(246, 150, 52, 54, '#2E4A3A', 6, 6, (-12, 272, 176)) + E(110, 190, 16, 12, '#F268A6', 5) + E(104, 190, 4, 3, '#fff', 0)
    o += E(226, 200, 18, 10, '#3CCB6B', 4)
    o += P('M50 184C60 312 340 312 350 184C330 240 70 240 50 184Z', '#F2E6CF') + P('M50 186C56 302 140 336 200 336C260 336 344 302 350 186C320 234 80 234 50 186Z', '#E2483E') + F('M268 220C310 214 338 202 350 186C344 302 260 336 200 336C252 310 274 266 268 220Z', '#AE2A26')
    o += L('M84 266q22 14 44 0t44 0t44 0t44 0t44 0', '#FFF3C4', 6)
    return o + R(146, 334, 108, 16, '#AE2A26', 6, 6) + E(200, 182, 150, 42, 'none') + HL('M88 244Q112 284 150 304', '#FFD6C4', 8)

def d_energy():
    d = 'M114 96H286V324Q286 344 266 344H134Q114 344 114 324Z'
    o = SH(358, 100) + R(120, 64, 160, 40, '#C4C8D0', 10) + F('M244 64H280V104H244Z', '#9AA2B0') + R(120, 64, 160, 40, 'none', 10)
    o += F(d, '#2FA6D6') + F('M240 96H286V324Q286 344 266 344H240Z', '#1C7AA8') + P(d)
    o += R(114, 300, 172, 44, '#C4C8D0', 8) + R(114, 300, 172, 12, '#9AA2B0', 4)
    o += P('M222 120L162 218H198L178 290L246 190H208Z', '#FFE04A', 6)
    return o + HL('M136 124V282', '#fff', 10, .8) + L('M120 98H280', K, 6)

ITEMS = {'onigiri': d_onigiri, 'cake': d_cake, 'watermelon': C.s_watermelon, 'milk-tea': d_milk_tea, 'apple': C.s_apple,
         'ice-cream': C.s_icecream, 'pizza': C.s_pizza, 'ramen': d_ramen, 'energy-drink': d_energy}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for k, fn in ITEMS.items():
        svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 380 370">%s</svg>' % fn()
        open(os.path.join(OUT, 'food-%s.svg' % k), 'w', encoding='utf-8').write(svg)
    print('wrote %d files to %s' % (len(ITEMS), OUT))
