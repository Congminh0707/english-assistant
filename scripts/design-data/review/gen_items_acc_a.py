# Icon phụ kiện shop (nhóm A) vẽ tay theo nét thẻ từ: src/renderer/shared/art/items/acc-*.svg
#   python scripts/design-data/review/gen_items_acc_a.py
import math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'src', 'renderer', 'shared', 'art', 'items')
sys.path.insert(0, HERE)
import gen_cards as C
from gen_cards import F, P, L, E, EF, R, HL, G, SH, K, WH, ball


def mir(s): return G(s, 'translate(400 0) scale(-1 1)')


def acc_bow():
    loop = 'M192 200C170 120 90 96 60 140C36 180 50 262 100 282C140 296 180 250 192 214Z'
    half = P(loop, '#FF8FB8') + F('M120 120C80 120 48 160 60 224C64 250 80 272 100 282C70 240 76 160 120 120Z', '#E9568F') + L('M82 168Q96 226 150 246', '#E9568F', 5)
    tail = 'M190 224C170 270 150 320 120 350L170 338L188 360C198 320 206 270 204 230Z'
    o = SH(364, 120) + P(tail, '#E9568F') + mir(P(tail, '#FF8FB8'))
    o += half + mir(half)
    o += HL('M80 150Q104 120 146 128', '#fff', 10)
    o += E(200, 206, 30, 36, '#FF8FB8') + F('M206 172C228 180 232 232 206 242C218 220 218 196 206 172Z', '#E9568F') + E(200, 206, 30, 36) + HL('M188 192Q190 182 198 178', '#fff', 7)
    return o


def acc_glasses():
    o = SH(330, 140) + L('M44 196Q22 170 30 128M356 196Q378 170 370 128', K, 16) + L('M44 196Q22 170 30 128M356 196Q378 170 370 128', '#C98A3E', 6)
    o += L('M172 206Q200 178 228 206', K, 16) + L('M172 206Q200 178 228 206', '#C98A3E', 6)
    for x in (112, 288):
        o += E(x, 232, 78, 78, '#D9F1F8') + F('M%d 160Q%d 190 %d 270Q%d 300 %d 304Q%d 280 %d 214Q%d 180 %d 160Z' % (x + 36, x + 70, x + 66, x + 40, x + 20, x + 76, x + 80, x + 70, x + 36), '#A9D9EA')
        o += E(x, 232, 78, 78, 'none', 14) + E(x, 232, 78, 78, 'none', 5).replace(K, '#C98A3E') + HL('M%d 208Q%d 180 %d 170' % (x - 52, x - 44, x - 12), '#fff', 11, .9)
    return o


def acc_sunglasses():
    o = SH(318, 140) + L('M42 190Q20 164 28 126M358 190Q380 164 372 126', K, 16)
    o += L('M170 196Q200 170 230 196', K, 16)
    for x in (112, 288):
        d = 'M%d 160H%d C%d 160 %d 168 %d 190 C%d 250 %d 304 %d 304 H%d C%d 304 %d 286 %d 246 C%d 200 %d 190 %d 190Z' % (x - 88, x + 88, x + 88, x + 92, x + 92, x + 90, x + 70, x + 26, x - 36, x - 76, x - 90, x - 92, x - 92, x - 90, x - 92)
        d = 'M%d 160H%d Q%d 160 %d 196 L%d 250 Q%d 304 %d 304 H%d Q%d 304 %d 250 L%d 196 Q%d 160 %d 160Z' % (x - 70, x + 70, x + 92, x + 92, x + 88, x + 80, x + 34, x - 34, x - 80, x - 88, x - 92, x - 92, x - 70)
        o += P(d, '#3A3548') + F('M%d 164H%d Q%d 164 %d 196 L%d 250 Q%d 300 %d 300 Q%d 270 %d 220 Q%d 190 %d 164Z' % (x + 8, x + 70, x + 88, x + 88, x + 84, x + 76, x + 40, x + 50, x + 40, x + 30, x + 8), '#221E2C') + P(d, 'none')
        o += HL('M%d 200Q%d 184 %d 178' % (x - 66, x - 58, x - 30), '#fff', 11, .8)
    return o


def acc_scarf():
    band = 'M44 138C100 110 300 110 356 138C372 190 362 232 340 250C290 276 110 276 60 250C38 232 28 190 44 138Z'
    tail = 'M228 262C252 276 296 276 330 258L346 352L250 366Z'
    cp = '<clipPath id="sa"><path d="%s"/></clipPath><clipPath id="sb"><path d="%s"/></clipPath>' % (band, tail)
    o = SH(384, 140) + cp
    for x in (258, 286, 314):
        o += L('M%d 360v24' % x, K, 7) + L('M%d 360v24' % x, '#FFF3D6', 3)
    o += F(tail, '#E2483E')
    o += '<g clip-path="url(#sb)">' + ''.join('<rect x="200" y="%d" width="170" height="16" fill="#FFF3D6"/>' % y for y in (296, 330)) + F('M300 258L346 352L330 360L284 262Z', '#B3261E') + '</g>'
    o += P(tail)
    o += F(band, '#E2483E') + '<g clip-path="url(#sa)">'
    o += ''.join('<rect x="%d" y="100" width="20" height="190" fill="#FFF3D6" transform="rotate(8 %d 190)"/>' % (x, x) for x in (86, 150, 214, 278, 342))
    o += F('M300 112C340 124 372 190 340 250L300 262Z', '#B3261E') + '</g>' + P(band)
    o += HL('M80 150Q140 132 200 134', '#fff', 10)
    o += R(232, 226, 92, 52, '#C93A30', 20) + F('M290 230C316 234 322 262 304 276L290 276Z', '#9A2A22') + R(232, 226, 92, 52, 'none', 20) + HL('M246 244Q250 238 262 238', '#fff', 7, .8)
    return G(o, 'translate(0 -22)')


def acc_hat():
    o = SH(344, 150)
    o += P('M108 270C112 160 120 70 132 56C160 44 240 44 268 56C280 70 288 160 292 270Z', '#4A4552')
    o += F('M232 50C264 54 270 64 274 120C282 170 284 230 290 270H236C250 200 246 100 232 50Z', '#2E2A36')
    o += P('M108 270C112 160 120 70 132 56C160 44 240 44 268 56C280 70 288 160 292 270', 'none')
    o += E(200, 56, 70, 16, '#5C5668')
    o += R(106, 218, 188, 56, '#E2483E', 6)
    o += F('M240 220H292V272H236Z', '#B3261E') + R(106, 218, 188, 56, 'none', 6)
    o += P('M40 288C40 264 120 258 200 258C280 258 360 264 360 288C360 318 280 330 200 330C120 330 40 318 40 288Z', '#4A4552')
    o += F('M270 262C330 266 360 274 360 288C360 318 280 330 200 330C270 318 290 290 270 262Z', '#2E2A36')
    o += P('M40 288C40 264 120 258 200 258C280 258 360 264 360 288C360 318 280 330 200 330C120 330 40 318 40 288Z', 'none')
    o += HL('M134 200Q134 130 148 84', '#8E889C', 10, .9) + HL('M70 292Q100 308 140 312', '#8E889C', 8, .8)
    return o


def acc_crown():
    d = 'M70 316L44 128L132 204L200 84L268 204L356 128L330 316Z'
    o = SH(358, 140) + F(d, '#FFD04A') + F('M200 84L268 204L356 128L330 316H226C254 250 234 160 200 84Z', '#E8A92E') + P(d)
    o += R(66, 300, 268, 46, '#E8A92E', 10)
    for x, y, c in ((44, 128, '#E2483E'), (200, 82, '#3C8FD6'), (356, 128, '#E2483E')):
        o += E(x, y, 20, 20, c, 6) + HL('M%d %dl4 -4' % (x - 8, y - 6), '#fff', 5, .9)
    for x, c in ((130, '#E2483E'), (200, '#3CCB6B'), (270, '#3C8FD6')): o += E(x, 323, 13, 13, c, 5)
    o += P('M200 214L228 244L200 276L172 244Z', '#F268A6', 6) + HL('M104 270L88 180', '#FFF3B0', 10)
    return o


def acc_flower():
    o = SH(356, 110)
    o += P('M214 262C240 300 270 322 316 320C304 280 270 262 214 262Z', '#3CCB6B') + L('M226 276Q270 292 300 312', '#0B7A52', 5)
    for i in range(5):
        a = -90 + i * 72
        o += E(round(200 + 66 * math.cos(math.radians(a)), 1), round(190 + 66 * math.sin(math.radians(a)), 1), 52, 64, '#FF8FB8', 7, a + 90)
    for i in range(5):
        a = -90 + i * 72
        o += L('M%.0f %.0fL%.0f %.0f' % (200 + 40 * math.cos(math.radians(a)), 190 + 40 * math.sin(math.radians(a)), 200 + 92 * math.cos(math.radians(a)), 190 + 92 * math.sin(math.radians(a))), '#E9568F', 5)
    o += E(200, 190, 36, 36, '#FFD04A', 7) + EF(210, 198, 22, 24, '#E8A92E') + E(200, 190, 36, 36, 'none', 7)
    for x, y in ((190, 180), (212, 186), (196, 204)): o += EF(x, y, 4.5, 4.5, '#B3711A')
    o += HL('M142 118Q160 90 192 90', '#fff', 10, .85)
    return o


def acc_party_hat():
    d = 'M200 66C226 150 280 260 316 314C260 336 140 336 84 314C120 260 174 150 200 66Z'
    cp = '<clipPath id="ph"><path d="%s"/></clipPath>' % d
    o = SH(358, 130) + cp + F(d, '#8E6AE0')
    o += '<g clip-path="url(#ph)">' + ''.join('<path d="M60 %d L340 %d L340 %d L60 %d Z" fill="#FFD04A"/>' % (y, y - 56, y - 34, y + 22) for y in (292, 214, 138)) + F('M214 70C240 160 290 250 330 330H262C250 260 230 160 214 70Z', '#5E3FB8') + '</g>'
    o += P(d) + R(78, 304, 244, 34, '#FF8FB8', 12) + HL('M162 150Q142 210 114 270', '#fff', 10, .75)
    for x in (130, 200, 270): o += EF(x, 321, 6, 6, '#FFF3D6')
    o += ball(200, 66, 36, 34, '#FF8FB8', '#E9568F')
    return o


def acc_headphones():
    o = SH(354, 130)
    o += L('M70 240C50 70 350 70 330 240', K, 44) + L('M70 240C50 70 350 70 330 240', '#E2483E', 28)
    o += L('M318 210C326 90 230 56 150 74', '#B3261E', 8) + HL('M88 190C84 130 120 92 160 82', '#fff', 8, .8)
    o += R(40, 206, 92, 130, '#5C5668', 34) + R(268, 206, 92, 130, '#5C5668', 34)
    o += F('M326 218C352 230 356 300 330 326H316C340 296 340 250 326 218Z', '#3A3548')
    o += R(40, 206, 92, 130, 'none', 34) + R(268, 206, 92, 130, 'none', 34)
    o += R(98, 226, 36, 90, '#E2483E', 16) + R(266, 226, 36, 90, '#E2483E', 16)
    o += HL('M62 240Q60 226 74 220', '#fff', 8, .8)
    return o


def acc_cape():
    d = 'M96 92Q110 70 150 80Q200 104 250 80Q290 70 304 92L356 318Q326 350 292 326Q246 358 200 332Q154 358 108 326Q74 350 44 318Z'
    o = SH(366, 150) + F(d, '#E2483E') + F('M214 98Q256 94 250 80Q290 70 304 92L356 318Q326 350 292 326Q246 358 214 338Q254 220 214 98Z', '#B3261E') + P(d)
    o += L('M140 140Q120 240 92 318M262 140Q280 240 308 318', '#B3261E', 6)
    o += E(200, 100, 6, 6, '#B3261E', 0)
    o += L('M126 100Q200 150 274 100', K, 12) + L('M126 100Q200 150 274 100', '#FFD04A', 5)
    o += E(126, 98, 22, 22, '#FFD04A', 7) + E(274, 98, 22, 22, '#FFD04A', 7) + E(126, 98, 8, 8, '#3C8FD6', 4) + E(274, 98, 8, 8, '#3C8FD6', 4)
    o += HL('M70 150Q86 230 62 300', '#FF9A90', 9, .8)
    return o


DRAW = {
    'acc-bow': acc_bow, 'acc-glasses': acc_glasses, 'acc-scarf': acc_scarf, 'acc-hat': acc_hat, 'acc-crown': acc_crown,
    'acc-flower': acc_flower, 'acc-party-hat': acc_party_hat, 'acc-headphones': acc_headphones,
    'acc-sunglasses': acc_sunglasses, 'acc-cape': acc_cape,
}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, fn in DRAW.items():
        svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 380 370">%s</svg>' % fn()
        open(os.path.join(OUT, name + '.svg'), 'w', encoding='utf-8').write(svg)
    print('exported %d icons' % len(DRAW))
