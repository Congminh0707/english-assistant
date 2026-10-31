# Luồng kiểm tra đồng bộ thiết kế: mọi phần việc phải chạy và đạt 0 lỗi trước khi đăng lên canvas.
#   python check-boards.py <thư mục project> [--prefix S1 ...]
# Lỗi = phải sửa. Cảnh báo = xem lại. Ngoài ra in độ phủ màn hình theo screens.json.
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, 'tokens.json'), encoding='utf-8'))
S = json.load(open(os.path.join(HERE, 'screens.json'), encoding='utf-8'))
root = sys.argv[1]
SKIP = set(S['exempt'])  # bảng nhân vật, cảnh game: có bảng màu riêng
palette = {v.lower() for v in list(T['color'].values()) + list(T['dark'].values())} | {'#fff', '#ffffff', '#000', '#000000'}
EMOJI = re.compile('[\U0001F300-\U0001FAFF☀-➿]')
errs, warns = [], []
def strip_svg(h):
    # svg lồng nhau (nhân vật trong cảnh): bóc từ trong ra ngoài
    while True:
        n = re.sub(r'<svg\b(?:(?!<svg\b).)*?</svg>', '', h, flags=re.S)
        if n == h: return n
        h = n
def strip_tokens(h):
    return re.sub(r':root\{.*?\}\s*\.dark\{.*?\}', '', h, flags=re.S)
names = sorted(f for f in os.listdir(root) if f.endswith('.dc.html'))
for f in names:
    h = open(os.path.join(root, f), encoding='utf-8').read()
    e = lambda m: errs.append('%s: %s' % (f, m))
    w = lambda m: warns.append('%s: %s' % (f, m))
    if not re.search(r'<title>[^<]+</title>', h): e('thiếu <title>')
    for need in ('./support.js', '<x-dc>', 'data-dc-script', 'lang="vi"'):
        if need not in h: e('thiếu ' + need)
    if 'pixelated' in h or 'VT323' in h: e('còn phong cách pixel (quyết định #39)')
    if 'Webby' in h and f not in ('CharLupo.dc.html', 'CharKitsu.dc.html'): e('còn nhắc Webby (đã thay bằng Lupo)')
    if EMOJI.search(re.sub(r'<script.*?</script>', '', h, flags=re.S)): e('có emoji/ký hiệu trong bảng: dùng icon')
    if f in SKIP or re.match(r'(R\d|P[A-Z]|C[A-Z])', f): continue  # R* = vòng review hướng mới, chưa theo token
    body = strip_tokens(strip_svg(h))
    for c in sorted(set(x.lower() for x in re.findall(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b', body))):
        if c not in palette: e('màu ngoài token: ' + c)
    for r in set(re.findall(r'border-radius:\s*(\d+)px', body)):
        if int(r) not in T['radius']: e('bo góc ngoài thang: %spx' % r)
    for r in set(re.findall(r'font-size:\s*(\d+)px', body)) | set(re.findall(r"font:\s*\d*\s*(\d+)px", body)):
        if int(r) < 12: e('chữ nhỏ hơn 12px: %spx' % r)
        elif int(r) not in T['fontSize']: w('cỡ chữ ngoài thang: %spx' % r)
    for fam in set(re.findall(r"font-family:\s*'([^']+)'", body)) | set(re.findall(r"font:[^;\"]*?'([^']+)'", body)):
        if fam not in T['fonts']: e('font ngoài danh sách: ' + fam)
    if 'style="' in h and body.count('.btn{') > 1: e('định nghĩa lại .btn')
    if 'board_kit' not in h and '--primarySoft' not in h: w('không sinh từ board_kit')
# độ phủ
miss = []
for scr in S['screens']:
    if not os.path.exists(os.path.join(root, scr['board'] + '.dc.html')): miss.append('%s → %s (%s)' % (scr['src'], scr['board'], scr['part']))
print('Bảng:', len(names), '| Lỗi:', len(errs), '| Cảnh báo:', len(warns))
for x in errs: print('  LỖI ', x)
for x in warns[:40]: print('  CẢNH', x)
print('Màn hình phủ: %d/%d' % (len(S['screens']) - len(miss), len(S['screens'])))
for x in miss: print('  THIẾU', x)
sys.exit(1 if errs else 0)
