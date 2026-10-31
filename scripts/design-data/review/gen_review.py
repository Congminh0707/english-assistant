# Vòng review hướng UI mới: mộc bản theo giờ trong ngày. Chưa thay board_kit; duyệt xong mới áp cho S1–S5.
# python gen_review.py <project> <myth_dir>
import base64, io, os, sys
from PIL import Image
proj, myth = sys.argv[1], sys.argv[2]

def art(n, w, q=84):
    im = Image.open(os.path.join(myth, n + '.png')).convert('RGB').resize((w, w), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

s = open(os.path.join(proj, 'AnimKitsu.dc.html'), encoding='utf-8').read()
i = s.index('<svg width="0" height="0"'); KDEFS = s[i:s.index('</defs></svg>', i) + len('</defs></svg>')]
KITSU = '<svg viewBox="-20 -20 200 180" style="position:absolute;%s" role="img" aria-label="Kitsu"><g transform="translate(80 143) scale(.9) translate(-80 -143)"><use href="#tails3"/><use href="#fbody"/><use href="#%s"/><use href="#kbib"/></g></svg>'

HEAD = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>%s</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;800&amp;family=Noto+Sans:wght@400&amp;display=swap">
<style>
body{margin:0}
.r{position:relative;overflow:hidden;font-family:'Be Vietnam Pro',sans-serif;font-size:15px;line-height:1.55;box-sizing:border-box}
.r *{box-sizing:border-box}
.d{font-family:'Be Vietnam Pro',sans-serif;font-weight:800;line-height:1.04;letter-spacing:-.01em;margin:0}
.abs{position:absolute}
.nav{position:absolute;left:48px;right:48px;top:22px;display:flex;gap:26px;align-items:baseline;font-size:14px}
.nav b{font-weight:500}
.nav .on{text-decoration:underline wavy;text-underline-offset:6px;text-decoration-thickness:1.5px}
.nav .me{margin-left:auto}
.go{display:inline-flex;align-items:center;height:52px;padding:0 28px;border:0;border-radius:26px 26px 26px 6px;font:600 17px 'Lexend',sans-serif;cursor:pointer}
.ipa{font-family:'Noto Sans',sans-serif}
kbd{font:500 12px 'Lexend',sans-serif;padding:1px 6px;border-radius:6px;border:1px solid currentColor;opacity:.8;margin-left:2px}
button:focus-visible{outline:3px solid #FFC46E;outline-offset:3px}
%s
</style>
</helmet>
%s
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":%d,"height":%d}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
"""
def write(name, title, w, h, body, css=''):
    open(os.path.join(proj, name + '.dc.html'), 'w', encoding='utf-8').write(HEAD % (title, css, KDEFS + body, w, h))

def nav(on, color):
    items = ['Trang chủ', 'Lộ trình', 'Ôn từ', 'Luyện tập', 'Sổ từ', 'Thú cưng', 'Cửa hàng']
    return '<div class="nav" style="color:%s">%s<span class="me">Tìm từ <kbd>Ctrl K</kbd></span><span><b>Cấp 12</b>, còn 160 XP</span></div>' % (color, ''.join('<span class="%s">%s</span>' % ('on' if x == on else '', x) for x in items))

def lantern(x, y, s, word=None, c='#E8432E', dim=False):
    label = ('<text x="%d" y="%d" text-anchor="middle" font-family="Lexend" font-size="14" fill="#FFF3DC">%s</text>' % (x, y + 52 * s + 10, word)) if word else ''
    return ('<g opacity="%s"><ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="url(#halo)"/><rect x="%d" y="%d" width="%d" height="%d" rx="%d" fill="%s"/><rect x="%d" y="%d" width="%d" height="%d" rx="2" fill="#FFC66E"/><ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="#FFE6A8" opacity=".85"/><rect x="%d" y="%d" width="%d" height="%d" fill="#FFC66E" opacity=".35"/></g>%s'
            % (.55 if dim else 1, x, y, 46 * s, 46 * s, x - 15 * s, y - 20 * s, 30 * s, 40 * s, 13 * s, c, x - 8 * s, y - 25 * s, 16 * s, 6 * s, x, y, 7 * s, 11 * s, x - 9 * s, y + 24 * s, 18 * s, 3 * s, label))

# ---------- R1 Trang chủ: hoàng hôn, từ cần ôn là đèn hoa đăng trên sông ----------
def r1():
    bands = [('#2A2566', 0, 96), ('#4A2C7A', 96, 74), ('#8A3A80', 170, 64), ('#CF4F76', 234, 58), ('#F58C5C', 292, 52), ('#FFC46E', 344, 76)]
    sky = ''.join('<div class="abs" style="left:0;right:0;top:%dpx;height:%dpx;background:%s"></div>' % (t, h, c) for c, t, h in bands)
    words = [(110, 470, 1, 'reluctant'), (250, 512, .8, 'deadline'), (372, 462, .9, 'ambitious'), (512, 520, .72, 'schedule'), (632, 468, 1, 'convenient'), (786, 516, .8, 'appointment'), (920, 472, .85, 'resilient'), (1020, 524, .6, None), (46, 536, .55, None), (450, 548, .5, None), (700, 548, .5, None)]
    lamps = ''.join(lantern(x, y, s, w) for x, y, s, w in words)
    ripple = ''.join('<rect x="%d" y="%d" width="%d" height="3" rx="1.5" fill="#FFC46E" opacity="%s"/>' % (x, y, w, o) for x, y, w, o in [(760, 436, 150, .8), (790, 452, 96, .6), (720, 470, 90, .35), (820, 490, 120, .3), (150, 444, 90, .2), (420, 500, 120, .16)])
    steps = ''.join('<ellipse cx="%d" cy="%d" rx="6" ry="3.6" fill="#FFC46E" opacity="%.2f" transform="rotate(-14 %d %d)"/>' % (x, y, .35 + i * .05, x, y) for i, (x, y) in enumerate([(120 + k * 22, 664 - (k % 2) * 8 - k * 3) for k in range(12)]))
    miss = [('Ôn 10 thẻ', 'Xong, đã nhận +10 XP', '#FFC46E', 100), ('Lưu 3 từ mới', 'Còn 2 từ', '#FFF3DC', 33), ('Ôn hết thẻ đến hạn', 'Còn 24 thẻ', '#FFF3DC', 43)]
    tasks = ''.join('<div style="width:190px"><div style="font-weight:500;color:%s">%s</div><div style="font-size:13px;color:#C9BEE0">%s</div><div style="height:4px;border-radius:2px;background:#3A2F68;margin-top:6px"><div style="height:4px;border-radius:2px;width:%d%%;background:#FFC46E"></div></div></div>' % (c, t, d, p) for t, d, c, p in miss)
    body = ('<div class="r" style="width:1100px;height:720px;background:#16123C;color:#FFF3DC">' + sky
            + '<svg class="abs" style="left:0;top:0" width="1100" height="720" aria-hidden="true">'
            '<defs><radialGradient id="halo"><stop offset="0" stop-color="#FFC66E" stop-opacity=".55"/><stop offset="1" stop-color="#FFC66E" stop-opacity="0"/></radialGradient></defs><circle cx="836" cy="372" r="74" fill="#FFF0C2"/>'
            '<path d="M0 420L0 372C80 340 150 372 240 352C330 332 410 384 520 372C640 358 690 330 790 366C880 396 980 340 1100 368V420Z" fill="#6A2F74"/>'
            '<path d="M0 424C160 400 300 416 460 408C640 398 860 416 1100 402V430H0Z" fill="#3A2460"/>'
            '<rect y="424" width="1100" height="170" fill="#232A6E"/>' + ripple + lamps +
            '<path d="M0 720V612C130 572 300 628 470 606C650 582 860 628 1100 584V720Z" fill="#16123C"/>' + steps + '</svg>'
            + nav('Trang chủ', '#FFF3DC')
            + '<h1 class="d abs" style="left:48px;top:76px;font-size:66px;width:640px">Hôm nay có 24 từ<br>đang chờ bạn ôn</h1>'
            '<div class="abs" style="left:48px;top:226px"><button class="go" style="background:#FFF3DC;color:#2A2566">Ôn 24 từ</button><span style="margin-left:18px;color:#FFF3DC">Khoảng 9 phút, bấm <kbd>Enter</kbd> để bắt đầu</span></div>'
            + '<div class="abs" style="left:560px;top:372px;width:214px;background:#FFF3DC;color:#2A2566;border-radius:14px 14px 14px 4px;padding:8px 12px;font-size:14px"><b style="font-weight:600">convenient</b>: tiện lợi<br><span style="font-size:13px">Quá hạn 2 ngày, bấm để nghe</span></div>'
            + KITSU % ('left:300px;top:548px;width:128px;height:115px', 'eopen') +
            '<div class="abs" style="left:48px;top:680px;font-size:13px;color:#FFC46E">12 ngày liền</div>'
            '<div class="abs" style="left:470px;top:636px;display:flex;gap:20px">' + tasks + '</div></div>')
    write('R1Home', 'Trang chủ, hướng mới', 1100, 720, body)

# ---------- R2 Ôn từ: đêm trên sông, đánh giá bằng 4 viên đá qua sông ----------
def r2():
    done = ''.join('<svg width="14" height="20" viewBox="0 0 14 20" aria-hidden="true"><rect x="1" y="3" width="12" height="15" rx="5" fill="%s"/><rect x="4" y="1" width="6" height="2" fill="%s"/></svg>' % (('#FFC46E', '#FFC46E') if i < 7 else ('#2D3573', '#2D3573')) for i in range(24))
    opts = [('1', 'hào hứng', 0), ('2', 'miễn cưỡng', 1), ('3', 'nhút nhát', 0), ('4', 'tức giận', 0)]
    ol = ''.join('<div style="display:flex;gap:16px;align-items:baseline;padding:7px 0;font-size:%s;color:%s"><span style="font-size:13px;color:#8D93C9;width:12px">%s</span>%s</div>' % ('22px' if a else '19px', '#FFC46E' if a else '#D8DBF2', n, t) for n, t, a in opts)
    stones = [('Quên', '10 phút', 180, 84, '#3A4284', '#FFF3DC'), ('Khó', '3 giờ', 180, 84, '#4A4F8E', '#FFF3DC'), ('Được', '2 ngày', 214, 96, '#FFC46E', '#2A2566'), ('Dễ', '6 ngày', 180, 84, '#4A4F8E', '#FFF3DC')]
    rad = ['58% 42% 52% 48% / 62% 56% 44% 38%', '46% 54% 44% 56% / 52% 64% 36% 48%', '52% 48% 56% 44% / 58% 50% 50% 42%', '42% 58% 48% 52% / 48% 58% 42% 52%']
    st = ''.join('<div style="width:%dpx;height:%dpx;background:%s;color:%s;border-radius:%s;display:flex;flex-direction:column;align-items:center;justify-content:center"><b style="font-weight:600;font-size:17px">%s %s</b><span style="font-size:13px">gặp lại sau %s</span></div>' % (w, h, c, tc, rad[i], i + 1, t, d) for i, (t, d, w, h, c, tc) in enumerate(stones))
    body = ('<div class="r" style="width:1100px;height:720px;background:#141A45;color:#F4F1FF">'
            '<svg class="abs" style="left:0;top:0" width="1100" height="720" aria-hidden="true"><circle cx="1010" cy="92" r="52" fill="#E8ECFF"/><circle cx="992" cy="80" r="46" fill="#141A45"/>'
            '<path d="M0 560C200 530 420 572 640 548C820 530 980 560 1100 540V720H0Z" fill="#1E2660"/></svg>'
            + nav('Ôn từ', '#C9CDEE')
            + '<div class="abs" style="left:48px;top:64px;display:flex;gap:6px;align-items:center">' + done + '<span style="margin-left:10px;font-size:13px;color:#C9CDEE">7 trên 24</span></div>'
            '<h1 class="d abs" style="left:48px;top:124px;font-size:104px">reluctant</h1>'
            '<div class="abs" style="left:52px;top:244px;color:#C9CDEE"><span class="ipa">/rɪˈlʌktənt/</span> &nbsp; tính từ &nbsp; <button class="go" style="height:32px;padding:0 14px;font-size:14px;background:#2D3573;color:#F4F1FF;border-radius:16px 16px 16px 4px">Nghe <kbd>R</kbd></button></div>'
            '<div class="abs" style="left:52px;top:300px;width:470px;font-size:18px;line-height:1.5;color:#E6E8FA">She was <span style="color:#FFC46E">reluctant</span> to lend him the money.</div>'
            '<div class="abs" style="left:52px;top:338px;width:470px;color:#A9AEDD">Cô ấy miễn cưỡng cho anh ta vay tiền.</div>'
            '<div class="abs" style="left:660px;top:150px;width:360px">' + ol + '</div>'
            '<div class="abs" style="left:660px;top:352px;width:380px;color:#C9CDEE">Đúng rồi. Nhớ từ này dễ không? Mình gợi ý Được.</div>'
            '<div class="abs" style="left:48px;right:48px;top:682px;display:flex;justify-content:space-between;font-size:13px;color:#C9CDEE"><span>Hoàn tác <kbd>Z</kbd></span><span>Dừng lại, tiến độ vẫn được giữ <kbd>Esc</kbd></span></div>'
            '<div class="abs" style="left:48px;right:48px;top:566px;display:flex;justify-content:space-between;align-items:center">' + st + '</div></div>')
    write('R2Review', 'Ôn từ, hướng mới', 1100, 720, body)

# ---------- R3 Bài học: sáng sớm, trục thời gian thay bảng công thức ----------
def r3():
    ex = [('I', 'was', ' at home last night.', 'Tối qua tôi ở nhà.'), ('We', ' watched', ' a movie yesterday.', 'Hôm qua chúng tôi xem một bộ phim.'), ('She', ' went', ' to Da Nang last summer.', 'Hè năm ngoái cô ấy đi Đà Nẵng.')]
    rows = ''.join('<div style="padding:9px 0;border-bottom:1.5px solid #8FC4B4"><div style="display:flex;align-items:center;gap:12px"><button aria-label="Nghe câu" style="width:32px;height:32px;flex:none;border-radius:50%%;border:0;background:#10323F;cursor:pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="#FFF7EA"><polygon points="6 3 20 12 6 21"/></svg></button><div><div class="d" style="font-size:24px;font-weight:400">%s <span style="color:#C7321F;font-weight:600">%s</span>%s</div><div style="font-size:14px;color:#2F5A63">%s</div></div></div></div>' % (a, b.strip(), c, d) for a, b, c, d in ex)
    body = ('<div class="r" style="width:1100px;height:720px;background:#BFE4D6;color:#10323F">'
            '<svg class="abs" style="left:0;top:0" width="1100" height="720" aria-hidden="true"><circle cx="1000" cy="150" r="96" fill="#FFD36B"/>'
            '<path d="M700 720V640C800 590 960 640 1100 580V720Z" fill="#8FC4B4"/><path d="M0 720V676C200 650 460 700 720 670C860 654 980 690 1100 660V720Z" fill="#5FA892"/></svg>'
            + nav('Lộ trình', '#10323F')
            + '<div class="abs" style="left:48px;top:66px;font-size:14px;color:#2F5A63">Quay lại Giao tiếp tự tin, bài 9 trên 33</div><div class="abs" style="left:716px;top:250px;font-size:14px;color:#10323F"><b style="font-weight:600">Hiểu bài</b>, rồi Xem ví dụ, rồi Luyện tập</div>'
            '<h1 class="d abs" style="left:48px;top:90px;font-size:64px;width:640px">Thì quá khứ đơn</h1>'
            '<p class="abs" style="left:48px;top:168px;width:520px;margin:0;font-size:17px">Dùng khi việc đã xảy ra và đã kết thúc, thường kèm mốc thời gian: yesterday, last night, in 2019.</p>'
            '<svg class="abs" style="left:48px;top:252px" width="600" height="84" aria-label="Trục thời gian: việc nằm trước hiện tại"><line x1="0" y1="50" x2="592" y2="50" stroke="#10323F" stroke-width="2.5"/><path d="M584 42L598 50L584 58" fill="none" stroke="#10323F" stroke-width="2.5"/><circle cx="196" cy="50" r="13" fill="#C7321F"/><line x1="470" y1="36" x2="470" y2="64" stroke="#10323F" stroke-width="2.5"/><text x="196" y="24" text-anchor="middle" font-family="Lexend" font-size="14" fill="#C7321F">việc đã xong</text><text x="470" y="24" text-anchor="middle" font-family="Lexend" font-size="14" fill="#10323F">bây giờ</text></svg>'
            '<div class="abs" style="left:48px;top:346px;width:600px">' + rows + '</div>'
            '<div class="abs" style="left:48px;top:640px"><button class="go" style="background:#C7321F;color:#FFF7EA">Làm 10 câu luyện tập</button><span style="margin-left:16px;color:#10323F">Khoảng 4 phút</span></div>'
            '<div class="abs" style="left:716px;top:300px;width:300px;background:#FFF7EA;border-radius:22px 22px 22px 4px;padding:16px 18px;font-size:15px">Người Việt hay viết <b style="font-weight:600">Did he went?</b> Sau did, động từ trở về nguyên mẫu: <b style="font-weight:600;color:#C7321F">Did he go?</b></div>'
            + KITSU % ('left:786px;top:448px;width:210px;height:190px', 'eopen') + '</div>')
    write('R3Lesson', 'Bài học, hướng mới', 1100, 720, body)

# ---------- R4 Thần thoại: cấp cuối 5 thú cưng ----------
def r4():
    pets = [('i_kitsuc', 'Cửu Vĩ Hồ', 'Kitsu. Hồ ly chín đuôi, mỗi đuôi giữ một ngọn hồ hoả.'), ('i_dracoc', 'Long Vương', 'Draco. Rồng cánh lớn đội vương miện, giáp vảy ngọc.'), ('i_bic', 'Mộc Thần', 'Bi. Thần cây nhỏ, trên đầu mọc cây đa non, vòng hoa, ngồi đài sen.'), ('i_roboc', 'Thiên Cơ', 'Robo. Robot tương lai vỏ ngọc trai, cánh năng lượng, vòng sáng bay trên đầu.')]
    cells = ''.join('<div style="width:318px"><img src="%s" alt="%s" style="display:block;width:318px;height:318px;border-radius:12px"><h2 class="d" style="font-size:28px;margin-top:12px">%s</h2><p style="margin:4px 0 0;font-size:14px;color:#C9CDEE">%s</p></div>' % (art(k, 636), n, n, d) for k, n, d in pets)
    body = ('<div class="r" style="width:1440px;height:1320px;background:#04061A;color:#F4F1FF;padding:0">'
            '<img src="%s" alt="Ngân Lang" class="abs" style="left:0;top:0;width:880px;height:880px">'
            '<div class="abs" style="left:920px;top:210px;width:460px"><h1 class="d" style="font-size:76px;white-space:nowrap">Ngân Lang</h1>'
            '<p style="font-size:18px;margin:18px 0 0">Lupo cấp cuối. Sói bạc chibi, ánh bạc toả từ thân ra khắp đêm, mắt băng và trăng non trên trán.</p>'
            '<p style="font-size:15px;color:#C9CDEE;margin:14px 0 0">Vẫn đầu to mắt lớn kiểu chibi, nhưng nét mực và lông chi tiết. Năm cấp cuối dùng chung bộ cọ này.</p></div>'
            '<div class="abs" style="left:48px;top:912px;display:flex;gap:30px">%s</div></div>') % (art('i_lupoc', 880, 88), cells)
    write('R4Myth', 'Cấp cuối thần thoại', 1440, 1320, body)

r4(); print('ok')  # R1–R3 nay sinh từ gen_village.py
