# Xuất ảnh công trình cho thế giới của bé vào src/renderer/study/kids/game/{pads,wonders}:
#   BOARD_OUT=<project> python scripts/design-data/export-kids-images.py <thư mục tạm> <thư mục kw3d chứa lm_*.png>
# pads: ảnh chụp từ mô hình game/landmarks3d (kw3d là dữ liệu tạm, không có trong repo, docs/23 §6).
# wonders: hàm w_*() trong review/gen_earth.py, chụp bằng Edge không nền rồi cắt theo ô.
import os, subprocess, sys
TMP, KW = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
GAME = os.path.join(ROOT, 'src', 'renderer', 'study', 'kids', 'game')
sys.path[:0] = [os.path.join(HERE, 'review'), os.path.join(HERE, 'sync')]
from PIL import Image
import gen_earth as E
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
CELL = 600

for f in sorted(os.listdir(KW)):
    if f.startswith('lm_') and f.endswith('.png'):
        im = Image.open(os.path.join(KW, f)).convert('RGBA')
        im = im.crop(im.getbbox())
        w = min(560, im.width)
        im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(os.path.join(GAME, 'pads', f[3:-4] + '.webp'), 'WEBP', quality=86, method=6)

NAMES = {'liberty': E.w_liberty, 'chichen': E.w_chichen, 'machu': E.w_machu, 'christ': E.w_christ, 'colosseum': E.w_colosseum, 'giza': E.w_giza, 'taj': E.w_taj, 'wall': E.w_wall, 'sydney': E.w_sydney}
cells = ''.join('<svg style="position:absolute;left:%dpx;top:%dpx" width="%d" height="%d" viewBox="-75 -105 150 150" overflow="hidden">%s</svg>' % (i % 3 * CELL, i // 3 * CELL, CELL, CELL, fn()) for i, fn in enumerate(NAMES.values()))
page = os.path.join(TMP, 'wonders.html')
shot = os.path.join(TMP, 'wonders.png')
open(page, 'w', encoding='utf-8').write('<!doctype html><meta charset=utf-8><style>html,body{margin:0;background:transparent}</style>' + cells)
subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--user-data-dir=' + os.path.join(TMP, 'edge'), '--default-background-color=00000000', '--window-size=%d,%d' % (CELL * 3, CELL * 3), '--virtual-time-budget=1500', '--screenshot=' + shot, 'file:///' + page.replace('\\', '/')], check=True)
sheet = Image.open(shot).convert('RGBA')
for i, n in enumerate(NAMES):
    c = sheet.crop((i % 3 * CELL, i // 3 * CELL, i % 3 * CELL + CELL, i // 3 * CELL + CELL))
    c = c.crop(c.getbbox())
    c.resize((420, round(c.height * 420 / c.width)), Image.LANCZOS).save(os.path.join(GAME, 'wonders', 'wonder-%s.webp' % n), 'WEBP', quality=88, method=6)
