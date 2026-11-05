# Cắt sprite sheet thẻ từ (ChatGPT Image, lưới 4×4 hoặc 3×3, nền trong suốt) thành từng thẻ SVG của app.
#   python scripts/design-data/cut-cards.py                 # mọi batch có trong cards-batches.json
#   python scripts/design-data/cut-cards.py 4 5             # chỉ batch 4 và 5
#   python scripts/design-data/cut-cards.py --src "D:\ảnh"  # thư mục chứa "Batch N.png" (mặc định ~/Downloads/EnglishCard)
#   python scripts/design-data/cut-cards.py --preview       # ghi thêm contact sheet vào scripts/design-data/review/cards-ink/preview-batch-N.png
# Thứ tự id mỗi batch (trái → phải, trên → dưới) nằm ở cards-batches.json; prompt gốc ở docs/24-card-art-prompts.md.
# ChatGPT không luôn đặt vật đúng ô lưới (vật tràn ranh ô, hai vật sát nhau), nên KHÔNG chia theo ô:
#   1. tách vật theo cụm điểm ảnh liên thông trên cả sheet;
#   2. lấy N cụm lớn nhất làm vật chính (N = số id của batch); cụm nhỏ còn lại (chấm đếm, tia nắng, râu, chiếc tất thứ hai)
#      gắn vào vật chính gần nhất, mảnh vụn xa thì bỏ;
#   3. sắp N vật theo thứ tự đọc: chia theo tâm y thành `hàng` nhóm, mỗi nhóm sắp theo tâm x.
# Hai vật gần nhau < 4 px bị dính ở S=4: khai { "grid": [4, 4], "s": 1, "ids": [...] } để tách ở độ phân giải đầy đủ (chậm hơn).
# Số cụm lớn ít hơn N → in cảnh báo và bỏ qua batch (xem ảnh gốc rồi sửa tay).
# Mỗi thẻ: crop khít, đặt giữa khung vuông 256 (chừa lề), WebP q86, nhúng base64 trong <svg viewBox="0 0 256 256">
# → PictureImage.vue (glob art/cards/*.svg) dùng nguyên, không đổi code. Chạy lại sẽ ghi đè thẻ cùng id.
# Lưu ý: export-cards.py sinh lại thẻ vector cũ cùng id → không chạy nó sau khi đã cắt ảnh mới.
import base64, io, json, os, sys
import numpy as np
from PIL import Image, ImageChops, ImageFilter

sys.stdout.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'src', 'renderer', 'shared', 'art', 'cards')
PREVIEW = os.path.join(HERE, 'review', 'cards-ink')
MANIFEST = os.path.join(HERE, 'cards-batches.json')
SIZE = 256        # cạnh khung thẻ (px)
FILL = 0.92       # vật chiếm tối đa 92% khung
ALPHA_MIN = 24    # ngưỡng alpha coi là có hình (bỏ viền mờ)
S = 4             # tỉ lệ thu nhỏ khi tách cụm
MIN_PART = 12     # cụm phụ nhỏ hơn (ô thu nhỏ) coi là mảnh vụn (tính ở S=4, tự nhân theo S khác)
MAX_GAP = 45      # cụm phụ xa vật chính hơn (ô thu nhỏ) bị bỏ (tính ở S=4)


def label(im):
    """Gán nhãn liên thông trên ảnh thu nhỏ. Trả về (alpha đầy đủ, mảng nhãn, {nhãn: diện tích})."""
    a = im.getchannel('A').point(lambda v: 255 if v >= ALPHA_MIN else 0)
    small = a.resize((a.width // S, a.height // S), Image.BOX).point(lambda v: 255 if v > 0 else 0)
    g = np.array(small) > 0
    lab = np.zeros(g.shape, dtype=np.int32)
    areas = {}
    n = 0
    h, w = g.shape
    for y, x in zip(*np.nonzero(g)):
        if lab[y, x]: continue
        n += 1; lab[y, x] = n; stack = [(y, x)]; cnt = 0
        while stack:
            cy, cx = stack.pop(); cnt += 1
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1),
                           (cy + 1, cx + 1), (cy - 1, cx - 1), (cy + 1, cx - 1), (cy - 1, cx + 1)):
                if 0 <= ny < h and 0 <= nx < w and g[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; stack.append((ny, nx))
        areas[n] = cnt
    return a, lab, areas


def bbox_of(lab, k):
    ys, xs = np.nonzero(lab == k)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1  # ô thu nhỏ


def gap(b1, b2):
    dx = max(b1[0] - b2[2], b2[0] - b1[2], 0)
    dy = max(b1[1] - b2[3], b2[1] - b1[3], 0)
    return (dx * dx + dy * dy) ** 0.5


def split_objects(im, n_expect):
    """Trả về n_expect vật (tâm_x, tâm_y, ảnh RGBA cắt khít), chưa sắp thứ tự; None nếu thiếu cụm lớn."""
    a, lab, areas = label(im)
    order = sorted(areas, key=lambda k: -areas[k])
    if len(order) < n_expect:
        print('  chỉ tách được %d cụm, cần %d' % (len(order), n_expect)); return None
    mains = order[:n_expect]
    min_part, max_gap = MIN_PART * (4 // S) ** 2, MAX_GAP * (4 // S)
    boxes = {k: bbox_of(lab, k) for k in order if areas[k] >= min_part or k in mains}
    groups = {k: [k] for k in mains}
    # Gắn dần: lấy cặp (mảnh phụ, vật) có khoảng cách nhỏ nhất tới BẤT KỲ phần nào đã thuộc vật (kể cả chấm đã gắn),
    # để hàng chấm thứ hai bám theo hàng chấm thứ nhất thay vì nhảy sang vật kế bên.
    rest = [k for k in order[n_expect:] if areas[k] >= min_part]
    while rest:
        d, k, m = min(((min(gap(boxes[k], boxes[x]) for x in groups[m]), k, m) for k in rest for m in mains))
        if d > max_gap: break
        groups[m].append(k); rest.remove(k)
    labfull = np.array(Image.fromarray(lab.astype('int32')).resize(a.size, Image.NEAREST))
    out = []
    for m, ks in groups.items():
        mask = Image.fromarray((np.isin(labfull, ks) * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5))
        box = ImageChops.multiply(a, mask).getbbox()
        piece = im.crop(box)
        piece.putalpha(ImageChops.multiply(piece.getchannel('A'), mask.crop(box)))
        out.append(((box[0] + box[2]) / 2, (box[1] + box[3]) / 2, piece))
    return out


def reading_order(objs, cols, rows):
    objs = sorted(objs, key=lambda o: o[1])
    res = []
    for r in range(rows):
        res += sorted(objs[r * cols:(r + 1) * cols], key=lambda o: o[0])
    return res


def fit_card(obj):
    k = min(SIZE * FILL / obj.width, SIZE * FILL / obj.height)
    w, h = max(1, round(obj.width * k)), max(1, round(obj.height * k))
    obj = obj.resize((w, h), Image.LANCZOS)
    card = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    card.paste(obj, ((SIZE - w) // 2, (SIZE - h) // 2), obj)
    return card


def to_svg(card):
    buf = io.BytesIO()
    card.save(buf, 'WEBP', quality=86, method=6)
    b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d">'
            '<image width="%d" height="%d" href="data:image/webp;base64,%s"/></svg>') % (SIZE, SIZE, SIZE, SIZE, b64)


def main():
    global S
    args = sys.argv[1:]
    src = os.path.join(os.path.expanduser('~'), 'Downloads', 'EnglishCard')
    preview = False
    only = []
    i = 0
    while i < len(args):
        if args[i] == '--src': src = args[i + 1]; i += 2
        elif args[i] == '--preview': preview = True; i += 1
        else: only.append(args[i]); i += 1
    manifest = {k: v for k, v in json.load(open(MANIFEST, encoding='utf-8')).items() if not k.startswith('_')}
    os.makedirs(OUT, exist_ok=True)
    if preview: os.makedirs(PREVIEW, exist_ok=True)
    done = total = 0
    for batch, spec in manifest.items():
        if only and batch not in only: continue
        cols, rows = (4, 4) if isinstance(spec, list) else spec['grid']
        S = 4 if isinstance(spec, list) else spec.get('s', 4)  # vật sát nhau (cánh dơi/đuôi sóc) → khai "s": 1
        ids = spec if isinstance(spec, list) else spec['ids']
        if len(ids) != cols * rows:
            print('batch %s: lưới %dx%d cần %d id, có %d — bỏ qua' % (batch, cols, rows, cols * rows, len(ids))); continue
        path = os.path.join(src, 'Batch %s.png' % batch)
        if not os.path.exists(path):
            print('batch %s: không thấy %s' % (batch, path)); continue
        print('batch %s: %s' % (batch, ' '.join(ids)))
        objs = split_objects(Image.open(path).convert('RGBA'), len(ids))
        if objs is None: print('  bỏ qua batch %s' % batch); continue
        objs = reading_order(objs, cols, rows)
        sheet = Image.new('RGBA', (cols * 160, rows * 160), (255, 255, 255, 255)) if preview else None
        for n, (wid, (_, _, piece)) in enumerate(zip(ids, objs)):
            card = fit_card(piece)
            svg = to_svg(card)
            open(os.path.join(OUT, wid + '.svg'), 'w', encoding='utf-8').write(svg)
            done += 1; total += len(svg)
            if sheet is not None:
                r, c = divmod(n, cols)
                t = card.resize((160, 160), Image.LANCZOS)
                sheet.paste(t, (c * 160, r * 160), t)
        if sheet is not None:
            sheet.convert('RGB').save(os.path.join(PREVIEW, 'preview-batch-%s.png' % batch))
    print('đã cắt %d thẻ, %d KB' % (done, total // 1024))


main()
