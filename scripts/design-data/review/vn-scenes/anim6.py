"""Cắt sprite sheet 6 khung/hàng và ghép thử lên nền, xuất GIF lặp khép kín.

python anim6.py <bg.png> <out.gif> <sheet.png>:<rows> [<sheet2.png>:<rows> ...]
Khóa = (thứ tự sheet trên dòng lệnh, hàng). Vật không có trong PLACE/LEAF thì bỏ qua.

Nhịp: 1 tick = TICK ms, cả GIF dài N ticks; mọi chu kỳ (ping-pong, cá nhảy, lá rơi) chia hết N nên vòng lặp không giật.
"""
import math
import sys

import numpy as np
from PIL import Image, ImageFilter

COLS = 6
TICK = 200          # ms mỗi tick GIF (chủ dự án: giảm 1/2 tốc độ so với 100 ms)
N = 120             # 24 giây
# (sheet, row) -> (foot x, foot y, cao px, kiểu, ticks/khung)  — toạ độ nền 1672x941
#   pingpong: 0..5..1 (đứng yên, cử động nhẹ, không giật khi quay lại)
#   burst: chạy 0..5 một lần rồi giữ khung 0 tới hết chu kỳ PERIOD_BURST
PLACE = {
    (0, 1): (1310, 925, 185, 'pingpong', 3),   # cờ tướng (sheet 2)
    (0, 0): (1570, 915, 150, 'pingpong', 3),   # xe đạp hoa
    (0, 2): (720, 640, 170, 'burst', 1),       # cá chép (nhảy nhanh 200 ms/khung, chủ dự án 2026-11-04)
    (1, 0): (640, 915, 190, 'pingpong', 2),    # bé vẫy tay, bóng bay (sheet 3)
    (1, 1): (370, 915, 190, 'pingpong', 2),    # bán hàng ngồi quạt
    (1, 2): (950, 905, 225, 'pingpong', 3),    # xích lô đỗ, bác nghỉ quạt nón
}
PERIOD_BURST = 40
LEAF = (0, 3)
# lá rơi chậm, bất quy tắc: mỗi lá rơi 1 lượt / N, tốc độ rơi dao động (nhịp v), lắc ngang là tổng 2 sin
# khác tần số, xoay với số vòng riêng. Mọi tần số là số nguyên lần trong N nên GIF vẫn lặp kín.
# (x0, y0, cỡ px, nhịp lắc 1, biên 1, nhịp lắc 2, biên 2, nhịp đổi tốc độ, biên tốc độ px, số vòng xoay, pha)
LEAVES = [
    (180, 60, 58, 2, 38, 7, 12, 3, 60, 7, 0.0),
    (430, 300, 50, 3, 26, 5, 18, 2, 80, 5, 1.3),
    (650, 40, 56, 1, 44, 6, 10, 4, 50, 9, 2.1),
    (300, 520, 46, 2, 30, 9, 8, 3, 70, 6, 3.0),
    (770, 760, 54, 3, 24, 4, 16, 2, 40, 4, 4.2),
    (90, 640, 48, 1, 34, 8, 14, 5, 55, 8, 5.1),
    (560, 880, 44, 2, 28, 5, 20, 3, 65, 5, 0.7),
]
FALL = 1000         # quãng rơi (px) rồi quay lại tán cây


def clean(cell: Image.Image) -> Image.Image:
    a = np.array(cell.getchannel('A'))
    m = Image.fromarray(((a > 40) * 255).astype('uint8'))
    m = m.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(9))
    out = cell.copy()
    out.putalpha(Image.fromarray(np.minimum(a, np.array(m))))
    return out


def frames_of(sheet: Image.Image, rows: int, row: int) -> list[Image.Image]:
    W, H = sheet.size
    cw, ch = W / COLS, H / rows
    cells = [clean(sheet.crop((round(c * cw), round(row * ch), round((c + 1) * cw), round((row + 1) * ch))))
             for c in range(COLS)]
    boxes = [c.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox() for c in cells]
    # căn mọi khung theo đáy và tâm ngang bbox để không rung
    hmax = max(b[3] - b[1] for b in boxes)
    wmax = max(b[2] - b[0] for b in boxes)
    out = []
    for c, b in zip(cells, boxes):
        canvas = Image.new('RGBA', (wmax, hmax), (0, 0, 0, 0))
        piece = c.crop(b)
        canvas.alpha_composite(piece, ((wmax - piece.width) // 2, hmax - piece.height))
        out.append(canvas)
    return out


def frame_index(kind: str, step: int, t: int) -> int:
    if kind == 'pingpong':
        seq = list(range(COLS)) + list(range(COLS - 2, 0, -1))
        return seq[(t // step) % len(seq)]
    k = (t % PERIOD_BURST) // step
    return k if k < COLS else 0


def main() -> None:
    bg = Image.open(sys.argv[1]).convert('RGBA')
    out_path = sys.argv[2]
    anims = []
    leaf_frames = None
    for si, spec in enumerate(sys.argv[3:]):
        path, rows = spec.rsplit(':', 1)
        sheet = Image.open(path).convert('RGBA')
        for r in range(int(rows)):
            if (si, r) == LEAF:
                leaf_frames = frames_of(sheet, int(rows), r)
            elif (si, r) in PLACE:
                fx, fy, h, kind, step = PLACE[(si, r)]
                fr = frames_of(sheet, int(rows), r)
                sc = h / fr[0].height
                fr = [f.resize((max(1, int(f.width * sc)), h), Image.LANCZOS) for f in fr]
                anims.append((fr, fx, fy, kind, step))
    anims.sort(key=lambda a: a[2])   # vật ở sau (y nhỏ) vẽ trước
    leaves = []
    if leaf_frames:
        for x0, y0, size, *rest in LEAVES:
            sc = size / max(leaf_frames[0].size)
            fr = [f.resize((max(1, int(f.width * sc)), max(1, int(f.height * sc))), Image.LANCZOS)
                  for f in leaf_frames]
            leaves.append((fr, x0, y0, *rest))
    gif = []
    for t in range(N):
        im = bg.copy()
        for fr, fx, fy, kind, step in anims:
            f = fr[frame_index(kind, step, t)]
            im.alpha_composite(f, (fx - f.width // 2, fy - f.height))
        for fr, x0, y0, s1, a1, s2, a2, sv, av, rot, ph in leaves:
            u = 2 * math.pi * t / N
            y = (y0 + FALL * t / N + av * math.sin(sv * u + ph)) % FALL - 40
            x = x0 + a1 * math.sin(s1 * u + ph) + a2 * math.sin(s2 * u + 2 * ph) + (y + 40) * 0.2
            f = fr[int(rot * COLS * t / N + ph * 2) % COLS]
            im.alpha_composite(f, (int(x - f.width / 2), int(y - f.height / 2)))
        gif.append(im.convert('RGB').resize((836, 470), Image.LANCZOS))
    gif[0].save(out_path, save_all=True, append_images=gif[1:], duration=TICK, loop=0)
    gif[0].save(out_path.replace('.gif', '-f0.png'))


if __name__ == '__main__':
    main()
