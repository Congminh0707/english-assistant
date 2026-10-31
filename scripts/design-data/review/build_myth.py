# Ghép trang chụp art cấp cuối: defs SVG lấy từ bảng nhân vật đã duyệt + myth.js. python build_myth.py <project> <out>
import os, re, sys
proj, out = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = {'lupo': 'CharLupo', 'kitsu': 'AnimKitsu', 'draco': 'CharDraco', 'bi': 'CharBi', 'robo': 'CharRobo'}

def defs(name):
    s = open(os.path.join(proj, SRC[name] + '.dc.html'), encoding='utf-8').read()
    i = s.index('<svg width="0" height="0"'); j = s.index('</defs></svg>', i) + len('</defs></svg>')
    return s[i:j]

# Đặt nhân vật: toạ độ gốc 160×160, chân ở y≈146
BODY = {
 'lupo': ('', 5.3, 500, 925, ''),
 'kitsu': ('', 3.4, 500, 900, '<use href="#fbody"/><use href="#eopen"/><use href="#kbib"/>'),
 'draco': ('--g:#7FE0B0;--g2:#3C9E78;--belly:#FFF6D8;--snout:#C8F5DE;--horn:#FFD66B', 3.4, 500, 900,
   '<use href="#dtail"/><use href="#dtorso"/><use href="#dhorn2" transform="translate(0 4)"/><use href="#dhorn2" transform="translate(160 4) scale(-1 1)"/><use href="#dhorn"/><use href="#dhorn" transform="translate(160 0) scale(-1 1)"/><use href="#dhead"/><use href="#dcrown" transform="translate(80 36) scale(.9)"/><path d="M54 114Q80 128 106 114L104 126Q80 140 56 126Z" fill="#FFD66B"/>'),
 'bi': ('--m:#8EE3D4;--m2:#6CCBBA;--m3:#E6FAF5', 2.9, 500, 905, '<use href="#blotus" transform="translate(80 150) scale(1.3)"/><path d="M80 40C80 32 80 26 80 22" stroke="#4CAF6A" stroke-width="4" stroke-linecap="round"/><use href="#bflower" transform="translate(80 12) scale(1.6)"/><use href="#bbody"/>'),
 'robo': ('--s:#F6F4EC;--s2:#D9C58A;--acc:#FFC94D', 3.2, 500, 760, '<g transform="translate(80 148)"><use href="#rflame" transform="translate(-14 0)"/><use href="#rflame" transform="translate(14 0)"/></g><use href="#rfin"/><use href="#rfin" transform="translate(160 0) scale(-1 1)"/><use href="#rbody"/><use href="#rant"/>'),
}

for pet in SRC:
    st, k, px, py, body = BODY[pet]
    # đặt gốc: (80,146) của nhân vật trùng (px,py) trên khung 1000
    vb_x, vb_y = 80 - px / k, 146 - py / k
    size = 1000 / k
    html = ('<!doctype html><meta charset="utf-8"><title>%s</title><style>body{margin:0;background:#000}#w{position:relative;width:1000px;height:1000px;overflow:hidden}canvas,#ch{position:absolute;left:0;top:0;width:1000px;height:1000px}</style>%s'
            '<div id="w"><canvas id="under" width="1000" height="1000"></canvas><svg id="ch" viewBox="%.2f %.2f %.2f %.2f" style="filter:brightness(.93) saturate(.92);%s">%s</svg><canvas id="over" width="1000" height="1000"></canvas></div>'
            '<script src="myth.js"></script>') % (pet, defs(pet), vb_x, vb_y, size, size, st, body)
    open(os.path.join(out, 'myth_%s.html' % pet), 'w', encoding='utf-8').write(html)
open(os.path.join(out, 'myth.js'), 'w', encoding='utf-8').write(open(os.path.join(HERE, 'myth.js'), encoding='utf-8').read())
print('ok')
