# Biểu tượng phụ kiện cho cửa hàng (ItemEmoji): src/renderer/shared/art/items/acc-<id>.svg
#   python scripts/design-data/mascot/export_items.py
# Cùng hình vẽ với phụ kiện đeo trên mascot (acc2.py, neo theo Kitsu), cắt khung theo ICON_VB.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import acc2  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'src', 'renderer', 'shared', 'art', 'items')

for a in acc2.ACC:
    aid = a[0]
    d, b, f = acc2.draw(aid, 'kitsu', 'i')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{acc2.ICON_VB[aid]}"><defs>{d}</defs>{b}{f}</svg>'
    # bỏ class hoạt ảnh (ảnh <img> tĩnh)
    svg = svg.replace(' class="wgL"', '').replace(' class="wgR"', '').replace(' class="bob2"', '').replace(' class="tw"', '').replace(' class="cape"', '')
    with open(os.path.join(OUT, f'acc-{aid}.svg'), 'w', encoding='utf-8') as fh:
        fh.write(svg)
for gone in ('backpack', 'cat-ears'):
    p = os.path.join(OUT, f'acc-{gone}.svg')
    if os.path.exists(p):
        os.remove(p)
print(len(acc2.ACC), 'icons')
