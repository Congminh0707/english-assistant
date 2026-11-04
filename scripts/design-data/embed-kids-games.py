"""Nhúng nền + sprite 5 game của bé (docs/27-kids-game-art-prompts.md) vào app.

python scripts/design-data/embed-kids-games.py

Đọc scripts/design-data/review/kids-games/<game>-bg.png và <game>-sprites-N.png (6 cột × 3 hàng).
Ghi src/renderer/study/kids/games/art/<game>/bg.webp và <vật>-<0..5>.webp.
Bảng có nền caro giả (RGB, không alpha) thì xoá nền bằng flood-fill từ mép ô.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(os.path.dirname(__file__), 'review', 'kids-games')
OUT = os.path.join(ROOT, 'src/renderer/study/kids/games/art')
COLS = 6

# (game, bảng) → [(tên vật hàng 1, rộng px), ...]
SHEETS = {
    ('memory', 1): [('card-back', 280), ('card-front', 280), ('sparkle', 280)],
    ('balloon', 1): [('balloon-red', 270), ('balloon-yellow', 270), ('balloon-blue', 270)],
    ('balloon', 2): [('pop-red', 280), ('pop-yellow', 280), ('pop-blue', 280)],
    ('pet', 1): [('bowl', 280), ('plate', 280), ('butterfly', 200)],
    ('fishing', 1): [('fish-orange', 280), ('fish-green', 280), ('fish-yellow', 280)],
    ('fishing', 2): [('bubbles', 160), ('ripple', 280), ('splash', 280)],
    ('spell', 1): [('tile', 240), ('slot', 240), ('pencil', 200)],
}
# số là rộng tối đa: chỉ thu nhỏ khi khung gốc rộng hơn, không phóng to (game vẽ lớn tới ~1.4× theo cỡ cửa sổ)
BG_W = 1600


def remove_fake_bg(cell: Image.Image) -> Image.Image:
    """Xoá nền caro giả (xám/trắng nhạt) nối với mép ô; giữ vùng trắng kín bên trong viền."""
    rgb = np.array(cell.convert('RGB')).astype(int)
    mn, mx = rgb.min(axis=2), rgb.max(axis=2)
    like = (mn > 200) & (mx - mn < 28)
    # lan từ mép ô vào trong qua các điểm "giống nền" (không dùng ImageDraw.floodfill: Pillow 12 bỏ qua)
    reach = np.zeros_like(like)
    reach[0, :], reach[-1, :], reach[:, 0], reach[:, -1] = True, True, True, True
    reach &= like
    while True:
        grown = reach.copy()
        grown[1:, :] |= reach[:-1, :]
        grown[:-1, :] |= reach[1:, :]
        grown[:, 1:] |= reach[:, :-1]
        grown[:, :-1] |= reach[:, 1:]
        grown &= like
        if (grown == reach).all():
            break
        reach = grown
    a = np.where(reach, 0, 255).astype('uint8')
    alpha = Image.fromarray(a).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    out = cell.convert('RGBA')
    out.putalpha(alpha)
    return out


def clean_alpha(cell: Image.Image) -> Image.Image:
    a = np.array(cell.getchannel('A'))
    out = cell.copy()
    out.putalpha(Image.fromarray(np.where(a > 24, a, 0).astype('uint8')))
    return out


def export_sheet(game: str, n: int) -> None:
    sheet = Image.open(os.path.join(SRC, f'{game}-sprites-{n}.png'))
    fake = sheet.mode != 'RGBA'
    sheet = sheet.convert('RGBA')
    W, H = sheet.size
    cw, ch = W / COLS, H / 3
    out = os.path.join(OUT, game)
    os.makedirs(out, exist_ok=True)
    for r, (name, width) in enumerate(SHEETS[(game, n)]):
        cells = []
        for c in range(COLS):
            cell = sheet.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
            cells.append(remove_fake_bg(cell) if fake else clean_alpha(cell))
        boxes = [x.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox() for x in cells]
        box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
        for i, cell in enumerate(cells):  # mọi khung cắt bằng một khung chung: thân không nhảy
            f = cell.crop(box)
            if f.width > width:
                f = f.resize((width, max(1, round(f.height * width / f.width))), Image.LANCZOS)
            f.save(os.path.join(out, f'{name}-{i}.webp'), quality=88, method=6)


def export_bg(game: str) -> None:
    bg = Image.open(os.path.join(SRC, f'{game}-bg.png')).convert('RGB')
    bg = bg.resize((BG_W, round(bg.height * BG_W / bg.width)), Image.LANCZOS)
    out = os.path.join(OUT, game)
    os.makedirs(out, exist_ok=True)
    bg.save(os.path.join(out, 'bg.webp'), quality=80, method=6)


def main() -> None:
    for game in ('memory', 'balloon', 'pet', 'fishing', 'spell'):
        export_bg(game)
    for game, n in SHEETS:
        export_sheet(game, n)
    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
    print(f'ok: {total / 1024:.0f} KB in {OUT}')


if __name__ == '__main__':
    sys.exit(main())
