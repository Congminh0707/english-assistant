# Xem nhanh mascot v4: python scripts/design-data/mascot/preview4.py [nhân vật...]
# Mỗi hàng: các giai đoạn + Huyền thoại ở 4 khung hình đứng yên (--f) để soi sóng lắc lư.
# Ghi content/.build/mascot4-preview.html/.png (Edge headless, không tải font, hoạt ảnh tạm dừng).
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build4

ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

def main(names):
    rows = ''
    for n in names:
        cells = ''
        for st in ('baby', 'teen', 'adult'):
            cells += f'<div class="c fz">{build4.fig_svg(n, st, w=170)}</div>'
        for f in (0, 1.9):
            cells += f'<div class="c fz dk" style="--f:{f}s">{build4.fig_svg(n, "legend", w=330)}</div>'
        rows += f'<div class="r">{cells}</div>'
    html = (f'<html><head><meta charset="utf-8"><style>body{{margin:0;background:#FBF6EA;font:11px sans-serif;padding:6px}}.r{{display:flex;gap:6px;align-items:flex-end;margin-bottom:6px}}'
            f'.c{{background:#fff;border-radius:12px}}.dk{{background:#1F2550}}{build4.ALL_CSS}</style></head><body>{rows}</body></html>')
    out = os.path.join(ROOT, 'content', '.build')
    os.makedirs(out, exist_ok=True)
    f = os.path.join(out, 'mascot4-preview.html')
    open(f, 'w', encoding='utf-8').write(html)
    subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--user-data-dir=' + os.path.join(out, 'edge'),
                    '--window-size=1500,' + str(330 * len(names) + 20), '--virtual-time-budget=300', '--screenshot=' + f.replace('.html', '.png'), 'file:///' + f.replace(os.sep, '/')],
                   capture_output=True, timeout=90)
    print(f.replace('.html', '.png'))

if __name__ == '__main__':
    main(sys.argv[1:] or list(build4.CHARS4))
