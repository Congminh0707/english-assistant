"""Xuất khung sprite (WebP) + nền + manifest.json cho preview.html (chạy ngẫu nhiên như trong app).

python export_preview.py <place> <bg.png> <sheet.png>:<rows> [...]
Vị trí/cỡ/nhịp lấy từ PLACE, LEAF của anim6.py. Ra thư mục preview-<place>/.
"""
import json
import os
import sys

from PIL import Image

import anim6

NAMES = {(0, 0): 'bike', (0, 1): 'chess', (0, 2): 'koi', (1, 0): 'child', (1, 1): 'vendor', (1, 2): 'cyclo'}


def main() -> None:
    place, bg_path = sys.argv[1], sys.argv[2]
    out = f'preview-{place}'
    os.makedirs(out, exist_ok=True)
    Image.open(bg_path).convert('RGB').save(f'{out}/bg.webp', quality=82)
    actors, leaf = [], None
    for si, spec in enumerate(sys.argv[3:]):
        path, rows = spec.rsplit(':', 1)
        sheet = Image.open(path).convert('RGBA')
        for r in range(int(rows)):
            key = (si, r)
            if key == anim6.LEAF:
                fr = anim6.frames_of(sheet, int(rows), r)
                files = []
                for i, f in enumerate(fr):
                    f = f.resize((64, max(1, int(f.height * 64 / f.width))), Image.LANCZOS)
                    name = f'leaf-{i}.webp'
                    f.save(f'{out}/{name}', quality=88)
                    files.append(name)
                leaf = files
            elif key in anim6.PLACE:
                fx, fy, h, kind, step = anim6.PLACE[key]
                fr = anim6.frames_of(sheet, int(rows), r)
                sc = h / fr[0].height
                name = NAMES[key]
                files = []
                for i, f in enumerate(fr):
                    f = f.resize((max(1, int(f.width * sc)), h), Image.LANCZOS)
                    fn = f'{name}-{i}.webp'
                    f.save(f'{out}/{fn}', quality=88)
                    files.append(fn)
                actors.append({'name': name, 'x': fx, 'y': fy, 'w': f.width, 'h': h,
                               'kind': kind, 'frameMs': step * anim6.TICK, 'frames': files})
    actors.sort(key=lambda a: a['y'])
    data = {'size': [1672, 941], 'actors': actors, 'leaf': leaf}
    json.dump(data, open(f'{out}/manifest.json', 'w'), indent=1)
    # file:// không cho fetch JSON → nạp bằng <script>
    open(f'{out}/manifest.js', 'w').write('window.MANIFEST = ' + json.dumps(data) + ';\n')
    print(out, len(actors), 'actors')


main()
