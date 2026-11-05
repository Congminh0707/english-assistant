"""Dựng cảnh địa điểm tầng 1 (docs/26-scene-art-prompts.md) từ nền + bảng sprite ChatGPT Image.

python scripts/design-data/scene_build.py <nơi>            # ghi bản duyệt vào review/kids-games/out/<nơi>/
python scripts/design-data/scene_build.py <nơi> --embed    # (chỉ sau khi chủ dự án duyệt) ghi vào app

Cấu hình từng nơi ở scene_config.py (vị trí, cỡ, nhịp, dòng vật, trời). Bản duyệt gồm:
  bg.webp, <vật>-<0..5>.webp, spec.json (cùng định dạng sceneAnim/<nơi>.json), manifest.js (cho scene-preview).
--embed ghi thêm src/renderer/shared/art/scenes/kids-p<nơi>.art.html + src/renderer/study/kids/game/sceneAnim/<nơi>/ + <nơi>.json.
Sheet RGB (không alpha, ChatGPT vẽ nền sọc ô trắng/xám) được tách nền bằng loang từ viền ô.
"""
import base64
import io
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(HERE, 'review', 'kids-games')
OUT = os.path.join(SRC, 'out')
sys.path.insert(0, os.path.join(HERE, 'review', 'vn-scenes'))
import anim6  # noqa: E402  (clean: bỏ viền mờ theo alpha)

sys.path.insert(0, HERE)
from scene_config import PLACES  # noqa: E402

COLS = 6
BG_W, BG_H = 1672, 941


def real_alpha(cell: Image.Image) -> bool:
    """Ô có alpha thật: viền ô gần như trong suốt. Sheet RGB (alpha 255) hoặc RGBA nền trắng bán trong suốt (alpha ~200)
    thì không: phải tách nền theo màu."""
    a = np.array(cell.convert('RGBA'))[:, :, 3]
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    return float(border.mean()) < 60


def matte_cell(cell: Image.Image, deholes: bool = False) -> Image.Image:
    """Ô RGB nền sọc trắng/xám nhạt → RGBA: loang từ viền qua điểm gần trắng, phần còn lại giữ."""
    rgb = np.array(cell.convert('RGB')).astype(int)
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    cand = ((mn >= 196) & (mx - mn <= 22)).astype('uint8') * 255
    mask = Image.fromarray(cand, 'L').copy()  # copy: mảng numpy chỉ đọc làm floodfill không tô được
    w, h = mask.size
    seeds = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for p in seeds:
        if mask.getpixel(p) == 255:
            ImageDraw.floodfill(mask, p, 128)
    if deholes:
        # Nền kín giữa các nét vẽ (khe chùm đèn, khung thuyền) không chạm viền ô: xoá mọi mảng gần trắng còn lại ≥ 30 px.
        # Chỉ bật cho hàng KHÔNG có màu trắng thật (áo dài, bọt nước, lông cò) vì sẽ xoá cả chúng.
        lab = 10
        for _ in range(400):
            pts = np.argwhere(np.array(mask) == 255)
            if not len(pts):
                break
            y, x = pts[0]
            ImageDraw.floodfill(mask, (int(x), int(y)), lab)
            m = np.array(mask) == lab
            arr = np.array(mask)
            arr[arr == lab] = 128 if m.sum() >= 30 else 5  # mảng nhỏ: giữ (không còn là ứng viên)
            mask = Image.fromarray(arr, 'L').copy()
    bgm = np.array(mask) == 128
    # viền sáng (halo trắng/kem sát nền): điểm gần trắng, ít sắc, cách nền ≤ 3 px thì bỏ nốt
    # hàng deholes (không có màu trắng thật) dùng ngưỡng mạnh hơn để gỡ hết halo
    near = np.array(Image.fromarray((bgm * 255).astype('uint8'), 'L').filter(ImageFilter.MaxFilter(9 if deholes else 7))) > 0
    fringe = near & (mn >= (150 if deholes else 170)) & (mx - mn <= (40 if deholes else 48))
    bgm = bgm | fringe
    alpha = np.where(bgm, 0, 255).astype('uint8')
    a = Image.fromarray(alpha, 'L').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    out = cell.convert('RGBA')
    out.putalpha(a)
    return out


def cells_of(sheet: Image.Image, rows: int, row: int, deholes: bool = False) -> list[Image.Image]:
    W, H = sheet.size
    cw, ch = W / COLS, H / rows
    out = []
    for c in range(COLS):
        cell = sheet.crop((round(c * cw), round(row * ch), round((c + 1) * cw), round((row + 1) * ch)))
        cell = anim6.clean(cell.convert('RGBA')) if real_alpha(cell) else anim6.clean(matte_cell(cell, deholes))
        out.append(cell)
    return out


def bbox(img: Image.Image):
    return img.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()


def cut_row(sheet: Image.Image, rows: int, row: int, shared: bool, deholes: bool = False, align: str = '') -> list[Image.Image]:
    """shared=False: căn mọi khung theo đáy + tâm ngang (vật đứng); shared=True: một khung chung (đèn lồng lắc, lửa, sóng)."""
    cells = cells_of(sheet, rows, row, deholes)
    boxes = [bbox(c) for c in cells]
    if align in ('left-mid', 'right-mid'):
        # hiệu ứng phun từ một điểm (lửa/nước rồng): mỗi khung ép sát mép trái (hoặc phải) và giữa theo chiều dọc,
        # nên gốc phun luôn ở cùng một điểm ở mọi khung
        hmax = max(b[3] - b[1] for b in boxes)
        wmax = max(b[2] - b[0] for b in boxes)
        out = []
        for c, b in zip(cells, boxes):
            canvas = Image.new('RGBA', (wmax, hmax), (0, 0, 0, 0))
            piece = c.crop(b)
            x = 0 if align == 'left-mid' else wmax - piece.width
            canvas.alpha_composite(piece, (x, (hmax - piece.height) // 2))
            out.append(canvas)
        return out
    if shared:
        box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
        return [c.crop(box) for c in cells]
    hmax = max(b[3] - b[1] for b in boxes)
    wmax = max(b[2] - b[0] for b in boxes)
    out = []
    for c, b in zip(cells, boxes):
        canvas = Image.new('RGBA', (wmax, hmax), (0, 0, 0, 0))
        piece = c.crop(b)
        canvas.alpha_composite(piece, ((wmax - piece.width) // 2, hmax - piece.height))
        out.append(canvas)
    return out


def hang_ax(frames: list[Image.Image]) -> float:
    """Tâm ngang của hàng điểm trên cùng (chỗ treo đèn lồng), trung bình các khung, theo tỉ lệ chiều rộng."""
    xs = []
    for f in frames:
        a = np.array(f.getchannel('A')) > 40
        ys = np.where(a.any(axis=1))[0]
        if len(ys):
            top = a[ys[0]: ys[0] + 6]
            cols = np.where(top.any(axis=0))[0]
            xs.append(cols.mean() / f.width)
    return round(float(np.mean(xs)), 3) if xs else 0.5


def crop_frames(frames: list[Image.Image], crop) -> list[Image.Image]:
    """crop = (trái, trên, phải, dưới) theo tỉ lệ khung, cắt bỏ phần sprite thừa (vệt nước, mảng đá vẽ kèm) rồi ép sát lại."""
    if not crop:
        return frames
    out = []
    for f in frames:
        w, h = f.size
        out.append(f.crop((round(w * crop[0]), round(h * crop[1]), round(w * (1 - crop[2])), round(h * (1 - crop[3])))))
    return out


def erase_frames(frames: list[Image.Image], boxes) -> list[Image.Image]:
    """boxes = [(trái, trên, phải, dưới)] theo tỉ lệ khung: xoá (alpha 0) vùng sprite thừa như vệt gợn nước vẽ kèm ở đáy khung."""
    if not boxes:
        return frames
    out = []
    for f in frames:
        g = f.copy()
        a = g.getchannel('A')
        w, h = g.size
        for b in boxes:
            a.paste(0, (round(w * b[0]), round(h * b[1]), round(w * b[2]), round(h * b[3])))
        g.putalpha(a)
        out.append(g)
    return out


def lalign_frames(cells: list[Image.Image]) -> list[Image.Image]:
    """Mỗi khung cắt theo bbox riêng rồi dán sát MÉP TRÁI, căn giữa theo chiều dọc: gốc lửa/nước luôn ở điểm neo (ax 0, ay 0.5)."""
    boxes = [bbox(c) for c in cells]
    pieces = [c.crop(b) for c, b in zip(cells, boxes)]
    W, H = max(p.width for p in pieces), max(p.height for p in pieces)
    out = []
    for p in pieces:
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        canvas.alpha_composite(p, (0, (H - p.height) // 2))
        out.append(canvas)
    return out


def base_ax(frames: list[Image.Image]) -> float:
    """Tâm ngang của hàng điểm dưới cùng (gốc cột cây bẹo lắc), trung bình các khung, theo tỉ lệ chiều rộng."""
    xs = []
    for f in frames:
        a = np.array(f.getchannel('A')) > 40
        ys = np.where(a.any(axis=1))[0]
        if len(ys):
            bot = a[max(0, ys[-1] - 6): ys[-1] + 1]
            cols = np.where(bot.any(axis=0))[0]
            xs.append(cols.mean() / f.width)
    return round(float(np.mean(xs)), 3) if xs else 0.5


def save_frames(frames: list[Image.Image], out: str, name: str, h: int) -> tuple[list[str], int]:
    sc = h / frames[0].height
    files, w = [], 0
    for i, f in enumerate(frames):
        g = f.resize((max(1, round(f.width * sc)), h), Image.LANCZOS)
        w = g.width
        g.save(os.path.join(out, f'{name}-{i}.webp'), quality=88, method=6)
        files.append(f'{name}-{i}')
    return files, w


def build(place: str, embed: bool) -> None:
    cfg = PLACES[place]
    out = os.path.join(OUT, place)
    if os.path.isdir(out):
        shutil.rmtree(out)
    os.makedirs(out)
    # RGB không alpha: convert('RGBA') cho alpha 255 hết → has_alpha() = False → tách nền; sheet có alpha giữ nguyên
    sheets = {k: (Image.open(os.path.join(SRC, v[0])).convert('RGBA'), v[1]) for k, v in cfg['sheets'].items()}
    bg = Image.open(os.path.join(SRC, cfg['bg'])).convert('RGB')
    if bg.size != (BG_W, BG_H):
        bg = bg.resize((BG_W, BG_H), Image.LANCZOS)
    bg.save(os.path.join(out, 'bg.webp'), quality=82, method=6)

    actors = []
    for a in cfg.get('actors', []):
        sheet, rows = sheets[a['sheet']]
        shared = a.get('shared', False) or a.get('hang') or a.get('base')
        if a.get('lalign'):
            fr = lalign_frames(cells_of(sheet, rows, a['row'], bool(a.get('deholes'))))
        else:
            fr = crop_frames(erase_frames(cut_row(sheet, rows, a['row'], bool(shared), bool(a.get('deholes')), a.get('align', '')), a.get('erase')), a.get('crop'))
        h = a['h'] if 'h' in a else round(fr[0].height * a['w'] / fr[0].width)
        files, w = save_frames(fr, out, a['name'], h)
        ax, ay = a.get('ax', 0.5), a.get('ay', 1.0)
        if a.get('hang'):
            ax, ay = hang_ax(fr), 0.0
        if a.get('base'):
            ax, ay = base_ax(fr), 1.0
        for pi, pt in enumerate(a['points'] if 'points' in a else [(a['x'], a['y'], 1.0)]):
            px, py = pt[0], pt[1]
            sc = pt[2] if len(pt) > 2 else 1.0
            item = {'name': a['name'] if 'points' not in a else f"{a['name']}{pi}", 'x': px, 'y': py,
                    'w': round(w * sc), 'h': round(h * sc), 'kind': a['kind'], 'frameMs': a['frameMs'], 'frames': files}
            if (ax, ay) != (0.5, 1.0):
                item['ax'], item['ay'] = ax, ay
            for k in ('hideIdle', 'flip', 'night'):
                if a.get(k):
                    item[k] = a[k]
            if a.get('glow'):
                item['glow'] = round(a['glow'] * sc)
            actors.append(item)
    actors.sort(key=lambda a: a['y'])

    lanes = []
    # cùng (bảng, hàng) ở nhiều làn → một bộ file lưu ở cỡ lớn nhất, mỗi làn hiển thị theo w/h riêng
    big: dict = {}
    for ln in cfg.get('lanes', []):
        for v in ln['variants']:
            k = (v['sheet'], v['row'], bool(v.get('deholes')))
            big[k] = max(big.get(k, 0), v['h'])
    cache: dict = {}
    for ln in cfg.get('lanes', []):
        variants = []
        for v in ln['variants']:
            key = (v['sheet'], v['row'], bool(v.get('deholes')))
            sheet, rows = sheets[v['sheet']]
            if key not in cache:
                cache[key] = save_frames(crop_frames(cut_row(sheet, rows, v['row'], False, bool(v.get('deholes'))), v.get('crop')), out, f"{v['name']}{v['sheet']}{v['row']}", big[key])
            files, wbig = cache[key]
            w = round(wbig * v['h'] / big[key])
            item = {'name': v['name'], 'frames': files, 'w': w, 'h': v['h'], 'speed': v['speed'], 'weight': v['weight']}
            if v.get('attach'):
                at = v['attach']
                s2, r2 = sheets[at['sheet']]
                f2, w2 = save_frames(cut_row(s2, r2, at['row'], True, bool(at.get('deholes'))), out, f"{ln['name']}-{v['name']}-fx", at['h'])
                item['attach'] = {'frames': f2, 'dx': at['dx'], 'dy': at['dy'], 'w': w2, 'h': at['h'], 'frameMs': at['frameMs']}
            variants.append(item)
        lanes.append({'name': ln['name'], 'y': ln['y'], 'dir': ln['dir'], 'x': ln['x'], 'gap': ln['gap'],
                      'fade': ln.get('fade', [0, 0]), 'frameMs': ln['frameMs'], 'maxActive': ln['maxActive'],
                      **{k: ln[k] for k in ('bob', 'y1', 's0', 's1', 'exclusive') if k in ln}, 'variants': variants})
    lanes.sort(key=lambda l: l['y'])

    meta = {'size': [BG_W, BG_H], 'actors': actors, 'leaf': []}
    for k in ('sky', 'mist', 'clock', 'birds', 'leafArea'):
        if k in cfg:
            meta[k] = cfg[k]
    if lanes:
        meta['lanes'] = lanes
    open(os.path.join(out, 'spec.json'), 'w', encoding='utf-8').write(json.dumps(meta, indent=2) + '\n')
    open(os.path.join(out, 'manifest.js'), 'w', encoding='utf-8').write('window.MANIFEST = ' + json.dumps(meta) + ';\n')
    n = len(os.listdir(out))
    kb = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) / 1024
    print(f'{place}: {len(actors)} vật đứng, {len(lanes)} dòng, {n} file, {kb:.0f} KB -> {out}')
    if '--composite' in sys.argv:
        composite(place, out, meta, bg)
    if embed:
        do_embed(place, cfg, bg, out)


def composite(place: str, out: str, meta: dict, bg: Image.Image) -> None:
    """Ảnh ghép tĩnh composite.png: nền + vật ở khung 0 (vật hideIdle ở khung giữa) + mẫu vài vật mỗi dòng + kim đồng hồ 10:10.
    Để kiểm vị trí/cỡ mà không cần trình duyệt."""
    from PIL import ImageDraw
    im = bg.convert('RGBA')
    d = ImageDraw.Draw(im)

    def load(name: str, w: int, h: int, flip: bool = False) -> Image.Image:
        f = Image.open(os.path.join(out, name + '.webp')).convert('RGBA').resize((max(1, w), max(1, h)), Image.LANCZOS)
        return f.transpose(Image.FLIP_LEFT_RIGHT) if flip else f

    layers = []  # (y chân, hàm vẽ): vẽ chung theo y như app (z-index = y)
    for ln in meta.get('lanes', []):
        for pos in (0.25, 0.5, 0.75):
            x = ln['x'][0] + (ln['x'][1] - ln['x'][0]) * pos
            for vi, v in enumerate(ln['variants'][:2]):
                p = min(0.96, pos + 0.12 * vi)
                xx = ln['x'][0] + (ln['x'][1] - ln['x'][0]) * p
                y = ln['y'] + ((ln.get('y1', ln['y']) - ln['y']) * p)
                sc = ln.get('s0', 1) + (ln.get('s1', 1) - ln.get('s0', 1)) * p
                w, h = round(v['w'] * sc), round(v['h'] * sc)
                f = load(v['frames'][0], w, h, ln['dir'] == -1)
                layers.append((y, lambda f=f, xx=xx, w=w, y=y, h=h: im.alpha_composite(f, (round(xx - w / 2), round(y - h)))))
    for a in meta['actors']:
        def draw(a=a):
            if a.get('glow'):
                g = a['glow']
                glow = Image.new('RGBA', (g, g), (0, 0, 0, 0))
                ImageDraw.Draw(glow).ellipse((g * 0.2, g * 0.2, g * 0.8, g * 0.8), fill=(255, 190, 90, 90))
                im.alpha_composite(glow, (round(a['x'] - g / 2), round(a['y'] + a['h'] * 0.45 - g / 2)))
            fi = len(a['frames']) // 2 if a.get('hideIdle') else 0
            f = load(a['frames'][fi], a['w'], a['h'], a.get('flip', False))
            ax, ay = a.get('ax', 0.5), a.get('ay', 1.0)
            im.alpha_composite(f, (round(a['x'] - a['w'] * ax), round(a['y'] - a['h'] * ay)))
        layers.append((a['y'], draw))
    for _, draw in sorted(layers, key=lambda t: t[0]):
        draw()
    if 'clock' in meta:
        c = meta['clock']
        d = ImageDraw.Draw(im)
        d.line((c['x'], c['y'], c['x'] - 0.6 * c['r'] * 0.87, c['y'] - 0.6 * c['r'] * 0.5), fill=(59, 42, 29), width=5)
        d.line((c['x'], c['y'], c['x'] + 0.9 * c['r'] * 0.0, c['y'] - 0.9 * c['r']), fill=(59, 42, 29), width=3)
    im.convert('RGB').save(os.path.join(out, 'composite.png'))
    print('composite:', os.path.join(out, 'composite.png'))


def do_embed(place: str, cfg: dict, bg: Image.Image, out: str) -> None:
    buf = io.BytesIO()
    bg.save(buf, 'WEBP', quality=80, method=6)
    b64 = base64.b64encode(buf.getvalue()).decode()
    html = ('<style>:host{display:block;overflow:hidden}svg{display:block;width:100%;height:100%}</style>'
            f'<svg role="img" aria-label="{cfg["label"]}" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">'
            f'<image href="data:image/webp;base64,{b64}" width="1280" height="720" preserveAspectRatio="xMidYMid slice"/></svg>')
    art = os.path.join(ROOT, 'src/renderer/shared/art/scenes', f'kids-p{place}.art.html')
    open(art, 'w', encoding='utf-8').write(html)
    dst = os.path.join(ROOT, 'src/renderer/study/kids/game/sceneAnim', place)
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    os.makedirs(dst)
    for f in os.listdir(out):
        if f.endswith('.webp') and f != 'bg.webp':
            shutil.copy(os.path.join(out, f), dst)
    shutil.copy(os.path.join(out, 'spec.json'), os.path.join(ROOT, 'src/renderer/study/kids/game/sceneAnim', f'{place}.json'))
    print(f'embed: {art} ({os.path.getsize(art) / 1024:.0f} KB), {dst}')


if __name__ == '__main__':
    build(sys.argv[1], '--embed' in sys.argv)
