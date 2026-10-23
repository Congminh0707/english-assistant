"""Đổi mọi PNG của gói sprite sang WebP lossless (dùng bởi build-hires-pack.mjs). Cần Pillow: pip install pillow.

Dùng: python scripts/sprites/png2webp.py <thư mục vào> <thư mục ra>
Giữ nguyên cấu trúc <nhân vật>/<giai đoạn>/*.png → *.webp; sao chép sheet.json.
"""
import shutil
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
jobs = []
for p in sorted(src.rglob('*')):
    if p.is_dir():
        continue
    rel = p.relative_to(src)
    out = dst / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    if p.suffix == '.png':
        jobs.append((p, out.with_suffix('.webp')))
    elif p.name == 'sheet.json':
        shutil.copyfile(p, out)


def convert(job):
    p, out = job
    with Image.open(p) as im:
        im.convert('RGBA').save(out, 'WEBP', lossless=True, quality=100, method=4)
    return out.stat().st_size


with ThreadPoolExecutor(max_workers=4) as ex:
    total = sum(ex.map(convert, jobs))
print(f'{len(jobs)} images -> WebP lossless, {total / 1024 / 1024:.1f} MB')
