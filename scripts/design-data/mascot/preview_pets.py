# Xem nhanh pet.json đã xuất, ráp giống PetFigure.vue: python scripts/design-data/mascot/preview_pets.py [nhân vật] [giai đoạn]
# Ghi content/.build/pets-preview.html (+ .png nếu có Edge).
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
HIDE_HAND = {'run', 'jump', 'eat', 'drink', 'read', 'happy', 'surprised', 'levelup', 'say'}

def compose(art, stage, pose, accs=()):
    if stage == 'egg':
        return f'<svg class="ps" viewBox="{art["vb"]["fig"]}" preserveAspectRatio="xMidYMax meet"><defs>{art["egg"]["defs"]}</defs>{art["egg"]["svg"]}</svg>'
    st = art['stages'][stage]
    body = st['states'].get(pose) or st['states']['idle']
    veh = pose in ('car', 'boat', 'plane')
    vb = art['vb']['veh'] if veh else art['vb']['legend' if stage == 'legend' else 'fig']
    if veh:
        return f'<svg class="ps" viewBox="{vb}" preserveAspectRatio="xMidYMax meet"><defs>{st["defs"]}</defs>{body}</svg>'
    ad = ab = af = ''
    cls = []
    for a in accs:
        x = art['acc'].get(a)
        if not x: continue
        ad += x['defs']
        hand = ' class="acc-hand"' if x['slot'] == 'hand' else ''
        ab += f'<g{hand}>{x["b"]}</g>'; af += f'<g{hand}>{x["f"]}</g>'
        if x['slot'] == 'neck': cls.append('no-nk')
    if pose in HIDE_HAND: cls.append('hide-hand')
    s = st['scale']
    return (f'<svg class="ps {" ".join(cls)}" viewBox="{vb}" preserveAspectRatio="xMidYMax meet"><defs>{st["defs"]}{ad}</defs>{st.get("bg", "")}'
            f'<g transform="translate(80 150) scale({s}) translate(-80 -150)">{ab}{body}{af}</g>{st.get("fg", "")}</svg>')

if __name__ == '__main__':
    chars = sys.argv[1:2] or ['bi', 'kitsu', 'draco', 'robo', 'lupo']
    stage = sys.argv[2] if len(sys.argv) > 2 else 'adult'
    cells = ''
    css = ''
    for n in chars:
        art = json.load(open(os.path.join(ROOT, 'src/renderer/shared/art/pets', n + '.pet.json'), encoding='utf-8'))
        css = art['css']
        items = [(stage, p, ()) for p in art['stages'][stage]['states']] + [('egg', 'idle', ()), ('legend', 'idle', ()), ('adult', 'idle', ('acc:beanie', 'acc:scarf', 'acc:balloon')), ('teen', 'hello', ('acc:crown', 'acc:bowtie', 'acc:fairy-wings'))]
        for st, p, ac in items:
            cells += f'<div class="c"><div class="w">{compose(art, st, p, ac)}</div><span>{n} {st} {p}</span></div>'
    html = (f'<html><head><meta charset="utf-8"><style>body{{margin:0;background:#FBF6EA;font:11px sans-serif;display:flex;flex-wrap:wrap;gap:4px;padding:6px}}'
            f'.c{{width:120px;text-align:center}}.w{{width:120px;height:110px}}.w svg{{width:100%;height:100%;overflow:visible}}{css}</style></head><body>{cells}</body></html>')
    out = os.path.join(ROOT, 'content', '.build')
    os.makedirs(out, exist_ok=True)
    f = os.path.join(out, 'pets-preview.html')
    open(f, 'w', encoding='utf-8').write(html)
    if os.path.exists(EDGE):
        subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-prefers-reduced-motion', '--user-data-dir=' + os.path.join(out, 'edge'),
                        '--window-size=1400,' + str(140 * (len(chars) * 2 + 1)), '--screenshot=' + f.replace('.html', '.png'), 'file:///' + f.replace('\\', '/')], capture_output=True, timeout=90)
    print(f)
