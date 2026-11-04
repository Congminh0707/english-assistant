"""Nhúng cảnh ChatGPT Image (nền trống + sprite 6 khung) vào app (docs/26-scene-art-prompts.md).

python scripts/design-data/embed-scene.py hanoi \
    scripts/design-data/review/vn-scenes/hanoi-v6-bg.png \
    scripts/design-data/review/vn-scenes/hanoi-v6-sprites-2.png:4 \
    scripts/design-data/review/vn-scenes/hanoi-v6-sprites-3.png:3

Ghi:
- src/renderer/shared/art/scenes/kids-p<nơi>.art.html  (SVG chứa WebP q80 base64, như 6 nước — decisions #46)
- src/renderer/study/kids/game/sceneAnim/<nơi>/*.webp  (khung sprite, Vite đóng gói thành file 'self')
- src/renderer/study/kids/game/sceneAnim/<nơi>.json     (vị trí, nhịp; toạ độ theo nền 1672×941)
Vị trí/cỡ/nhịp lấy từ PLACE/LEAF/TICK của review/vn-scenes/anim6.py (nơi ghép thử đã duyệt).
"""
import base64
import io
import json
import os
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'review', 'vn-scenes'))
import anim6  # noqa: E402

LABELS = {'hanoi': 'Hà Nội: Hồ Gươm mùa thu'}
NAMES = {
    'hanoi': {(0, 0): 'bike', (0, 1): 'chess', (0, 2): 'koi', (1, 0): 'child', (1, 1): 'vendor', (1, 2): 'cyclo'},
}
BG_W, BG_H = 1672, 941
# vùng trời trống của tranh (toạ độ nền): mây trôi trong x, y; mặt trời/mặt trăng ở `sun`
SKY = {
    'hanoi': {'x': [820, 1672], 'y': [10, 70], 'sun': [1290, 95]},  # y = mép trên của mây
}
# bảng trời dùng chung: hàng 1 hạc 6 khung, hàng 2 mây ×3, mặt trời, mặt trăng, mây mưa
SKY_ROW2 = ['cloud-0', 'cloud-1', 'cloud-2', 'sun', 'moon', 'raincloud']


def export_sky(sheet_path: str) -> None:
    """python embed-scene.py --sky <sky-sheet.png> : ghi sceneAnim/sky/*.webp"""
    out = os.path.join(ROOT, 'src/renderer/study/kids/game/sceneAnim/sky')
    os.makedirs(out, exist_ok=True)
    sheet = Image.open(sheet_path).convert('RGBA')
    W, H = sheet.size
    # hạc: cánh lên/xuống làm bbox từng khung khác nhau → cắt mọi khung bằng một khung chung (giữ vị trí thân như
    # ChatGPT vẽ trong ô), không căn theo đáy như vật đứng
    cw, ch = W / 6, H / 2
    cells = [anim6.clean(sheet.crop((round(c * cw), 0, round((c + 1) * cw), round(ch)))) for c in range(6)]
    boxes = [c.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox() for c in cells]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    for i, c in enumerate(cells):
        f = c.crop(box)
        f = f.resize((160, max(1, round(f.height * 160 / f.width))), Image.LANCZOS)
        f.save(os.path.join(out, f'crane-{i}.webp'), quality=88, method=6)
    cw, ch = W / 6, H / 2
    for c, name in enumerate(SKY_ROW2):
        cell = anim6.clean(sheet.crop((round(c * cw), round(ch), round((c + 1) * cw), H)))
        cell = cell.crop(cell.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
        width = 360 if name.endswith('cloud') or name.startswith('cloud') else 220
        cell = cell.resize((width, max(1, round(cell.height * width / cell.width))), Image.LANCZOS)
        cell.save(os.path.join(out, f'{name}.webp'), quality=88, method=6)
    kb = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) / 1024
    print(f'sky: {len(os.listdir(out))} files {kb:.0f} KB')


def main() -> None:
    if sys.argv[1] == '--sky':
        export_sky(sys.argv[2])
        return
    place, bg_path = sys.argv[1], sys.argv[2]
    names = NAMES[place]
    # nền
    bg = Image.open(bg_path).convert('RGB')
    assert bg.size == (BG_W, BG_H), bg.size
    buf = io.BytesIO()
    bg.save(buf, 'WEBP', quality=80, method=6)
    b64 = base64.b64encode(buf.getvalue()).decode()
    html = ('<style>:host{display:block;overflow:hidden}svg{display:block;width:100%;height:100%}</style>'
            f'<svg role="img" aria-label="{LABELS[place]}" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">'
            f'<image href="data:image/webp;base64,{b64}" width="1280" height="720" preserveAspectRatio="xMidYMid slice"/></svg>')
    art = os.path.join(ROOT, 'src/renderer/shared/art/scenes', f'kids-p{place}.art.html')
    open(art, 'w', encoding='utf-8').write(html)

    out = os.path.join(ROOT, 'src/renderer/study/kids/game/sceneAnim', place)
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    actors, leaf = [], []
    for si, spec in enumerate(sys.argv[3:]):
        path, rows = spec.rsplit(':', 1)
        sheet = Image.open(path).convert('RGBA')
        for r in range(int(rows)):
            key = (si, r)
            if key == anim6.LEAF:
                for i, f in enumerate(anim6.frames_of(sheet, int(rows), r)):
                    f = f.resize((72, max(1, round(f.height * 72 / f.width))), Image.LANCZOS)
                    f.save(os.path.join(out, f'leaf-{i}.webp'), quality=88, method=6)
                    leaf.append(f'leaf-{i}')
            elif key in anim6.PLACE:
                fx, fy, h, kind, step = anim6.PLACE[key]
                fr = anim6.frames_of(sheet, int(rows), r)
                sc = h / fr[0].height
                name = names[key]
                files = []
                for i, f in enumerate(fr):
                    f = f.resize((max(1, round(f.width * sc)), h), Image.LANCZOS)
                    f.save(os.path.join(out, f'{name}-{i}.webp'), quality=88, method=6)
                    files.append(f'{name}-{i}')
                actors.append({'name': name, 'x': fx, 'y': fy, 'w': f.width, 'h': h,
                               'kind': kind, 'frameMs': step * anim6.TICK, 'frames': files})
    actors.sort(key=lambda a: a['y'])
    meta = {'size': [BG_W, BG_H], 'actors': actors, 'leaf': leaf}
    if place in SKY:
        meta['sky'] = SKY[place]
    open(os.path.join(ROOT, 'src/renderer/study/kids/game/sceneAnim', f'{place}.json'), 'w', encoding='utf-8') \
        .write(json.dumps(meta, indent=2) + '\n')
    kb = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) / 1024
    print(f'{art}: {os.path.getsize(art) / 1024:.0f} KB; sprite {len(os.listdir(out))} files {kb:.0f} KB')


main()
