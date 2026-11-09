# Huy hiệu thành tựu v3 (vector): src/renderer/shared/assets/badges/<id thành tựu>.svg
#   python scripts/design-data/mascot/export_badges.py   (= pnpm badges)
# Hình từ badges2.py: khung kim loại theo hạng, nền men theo nhóm, dải băng ghi mốc. Bảng thành tựu: src/shared/achievements.ts.
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import badges2  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'src', 'renderer', 'shared', 'assets', 'badges')
STYLE = ('<style>.shine{animation:shine 3.2s ease-in-out infinite;transform:translateX(-90px)}'
         '@keyframes shine{0%,55%{transform:translateX(-90px)}85%,100%{transform:translateX(90px)}}'
         '.spin{animation:spin 16s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}'
         '.twk{animation:tw 1.8s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}'
         '@media (prefers-reduced-motion:reduce){.shine{display:none}.spin,.twk{animation:none}}</style>')

os.makedirs(OUT, exist_ok=True)
for name in os.listdir(OUT):
    if name.endswith('.png') or name.endswith('.svg'):
        os.remove(os.path.join(OUT, name))
for group, target, tier in badges2.TABLE:
    svg = badges2.badge(group, target, tier)
    svg = re.sub(r'^<svg width="[^"]*" height="[^"]*"', '<svg xmlns="http://www.w3.org/2000/svg"', svg)
    svg = svg.replace('font-family="Be Vietnam Pro"', 'font-family="Be Vietnam Pro, Segoe UI, sans-serif"')
    svg = svg.replace('<defs>', STYLE + '<defs>', 1)
    with open(os.path.join(OUT, f'{group}{target}.svg'), 'w', encoding='utf-8') as fh:
        fh.write(svg)
print(len(badges2.TABLE), 'badges')
