# Xuất thẻ từ Kids World sang asset của app: src/renderer/shared/art/cards/<id hình>.svg
#   python scripts/design-data/export-cards.py
# Hình lấy từ review/gen_cards.py (bảng CCards*), một SVG độc lập mỗi từ, id = id hình trong shared/pictures*.ts.
# PixelPicture ưu tiên các SVG này, thiếu thì dùng hình cũ.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'src', 'renderer', 'shared', 'art', 'cards')
sys.path.insert(0, os.path.join(HERE, 'review'))
import gen_cards as C
sys.stdout.reconfigure(encoding='utf-8')
os.makedirs(OUT, exist_ok=True)
t1, rest, _vi = C.load_words()
order = list(dict.fromkeys(t1 + rest))
n = 0; total = 0
for w in order:
    if w not in C.DRAW: continue
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 380 370">%s</svg>' % C.DRAW[w]()
    open(os.path.join(OUT, w + '.svg'), 'w', encoding='utf-8').write(svg)
    n += 1; total += len(svg)
print('đã xuất %d/%d thẻ, %d KB' % (n, len(order), total // 1024))
print('chưa vẽ:', ' '.join(w for w in order if w not in C.DRAW) or '(không)')
