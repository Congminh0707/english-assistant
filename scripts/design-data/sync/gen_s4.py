# Phần S4: mascot trên màn hình. Sinh S4Mascot, S4Quiz, S4Popup và bản Dark vào BOARD_OUT.
# Nhân vật lấy nguyên defs từ CharKitsu.dc.html (chỉ đọc), mặt được tách để đổi biểu cảm.
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from board_kit import *

_src = open(os.path.join(OUT, 'CharKitsu.dc.html'), encoding='utf-8').read()
_defs = re.search(r'<defs>(.*?)</defs>', _src, re.S).group(1)
_fox = re.search(r'<g id="fox">(.*?)</g>', _defs, re.S).group(1)
_face = [l for l in _fox.split('\n') if re.match(r'<ellipse cx="(58|102)" cy="77"|<circle cx="(55\.5|99\.5)"|<path d="M73 90q', l)]
_body = '\n'.join(l for l in _fox.split('\n') if l not in _face)
_eyes = '\n'.join(l for l in _face if not l.startswith('<path'))
_mouth = '\n'.join(l for l in _face if l.startswith('<path'))
DEFS = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>%s'
        '<g id="foxb">%s</g><g id="keyes">%s</g><g id="kmouth">%s</g></defs></svg>') % (_defs, _body, _eyes, _mouth)

_INK = 'stroke="#3A2430" stroke-width="4" fill="none" stroke-linecap="round"'
_NOSE = '<ellipse cx="80" cy="85" rx="3.6" ry="2.6" fill="#3A2430"/>'
FACES = {
 'open': '<use href="#keyes"/><use href="#kmouth"/>',
 'happy': '<path d="M49 80q9-11 18 0" %(i)s/><path d="M93 80q9-11 18 0" %(i)s/><path d="M71 89q9 13 18 0z" fill="#8A3B2E"/>' % {'i': _INK},
 'sad': '<use href="#keyes"/><path d="M73 95q7-6 14 0" stroke="#3A2430" stroke-width="2" fill="none" stroke-linecap="round"/>',
 'sleep': '<path d="M49 77q9 8 18 0" %(i)s/><path d="M93 77q9 8 18 0" %(i)s/>' % {'i': _INK},
}

def fox(size=96, mood='open'):
    return ('<svg width="%d" height="%d" viewBox="4 0 152 152" role="img" aria-label="Kitsu" style="display:block;flex:none">'
            '<use href="#ktail" transform="rotate(48 80 122) translate(80 122) scale(.85) translate(-80 -122)"/>'
            '<use href="#foxb"/><use href="#kleaf"/>%s</svg>') % (size, size, FACES[mood])

CSS4 = """
p{margin:0}
.desk{position:relative;overflow:hidden;background:var(--surface2);border:1px solid var(--line);border-radius:var(--r-lg)}
.tb{position:absolute;left:0;right:0;bottom:0;height:28px;background:var(--surface);border-top:1px solid var(--line);display:flex;align-items:center;gap:8px;padding:0 12px}
.tb i{width:16px;height:16px;border-radius:var(--r-sm);background:var(--line)}
.win{position:absolute;background:var(--bg);border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden}
.win>header{height:32px;display:flex;align-items:center;padding:0 12px;background:var(--surface);border-bottom:1px solid var(--line);font-size:12px;font-weight:600;color:var(--inkSoft)}
.ln{height:8px;border-radius:var(--r-pill);background:var(--line)}
.spot{position:absolute;right:16px;bottom:28px;display:flex;flex-direction:column;align-items:flex-end;gap:12px}
.bub{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow);padding:12px}
.spot .bub:after{content:'';position:absolute;right:42px;bottom:-7px;width:12px;height:12px;background:var(--surface);border-right:1px solid var(--line);border-bottom:1px solid var(--line);transform:rotate(45deg)}
.cap{position:absolute;left:12px;bottom:40px}
.cap b{display:block;font-size:13px;line-height:1.3}
.cap span{display:block;font-size:12px;line-height:1.35;color:var(--inkSoft)}
.choices{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.choice{display:flex;align-items:center;gap:4px;height:28px;padding:0 8px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--surface);font-size:13px;font-weight:600}
.choice.right{background:var(--success);border-color:var(--success);color:#fff}
.choice.wrong{background:var(--danger);border-color:var(--danger);color:#fff}
.dark .choice.right,.dark .choice.wrong{color:var(--bg)}
.pop{width:420px;height:300px;display:flex;flex-direction:column;overflow:hidden;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow)}
.pop>header{height:32px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 8px 0 16px;font-size:13px;font-weight:700}
.pop .q{flex:none;margin:0 16px;height:36px;display:flex;align-items:center;gap:8px;padding:0 12px;border-radius:var(--r-md);background:var(--surface2);border:1px solid var(--primary);color:var(--ink);overflow:hidden;white-space:nowrap}
.pop .bd{flex:1;min-height:0;padding:8px 16px;display:flex;flex-direction:column;gap:8px;overflow:hidden}
.pop>footer{height:44px;flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 16px;background:var(--surface2);border-top:1px solid var(--line);font-size:12px;color:var(--inkSoft)}
.tr{padding:8px 12px;border-radius:var(--r-md);background:var(--primarySoft);display:flex;flex-direction:column;gap:4px}
"""

XS = 'height:28px;padding:0 8px;font-size:12px;border-radius:var(--r-sm);gap:4px'
PILL = 'border-radius:var(--r-pill)'
I14 = 'width:14px;height:14px'

def b(label, kind='', ic=None, style=''):
    ico = icon(ic, style=I14) if ic else ''
    k = ' btn--' + kind if kind else ''
    return '<button class="btn%s" style="%s;%s">%s%s</button>' % (k, XS, style, ico, label)

def iconbtn(ic, kind=''):
    return b('', kind, ic, 'width:28px;padding:0')

def tb(clock='09:12'):
    return '<div class="tb"><i></i><i></i><i></i><i></i><span class="xs soft" style="margin-left:auto">%s</span></div>' % clock

def spot(mood, bubble='', w=0, size=96, extra=''):
    bub = ('<div class="bub"%s>%s</div>' % (' style="width:%dpx"' % w if w else '', bubble)) if bubble else ''
    return '<div class="spot">%s%s%s</div>' % (bub, extra, fox(size, mood))

def cap(name, note, w=200):
    return '<div class="cap" style="width:%dpx"><b>%s</b><span>%s</span></div>' % (w, name, note)

def desk(inner, style=''):
    return '<div class="desk" style="%s">%s%s</div>' % (style, inner, tb())

def winlines(n=8):
    ws = [100, 92, 96, 70, 100, 88, 94, 60, 100, 84, 90, 48]
    return '<div style="padding:16px;display:flex;flex-direction:column;gap:12px">%s</div>' % ''.join(
        '<div class="ln" style="width:%d%%"></div>' % ws[i % 12] for i in range(n))

# ---------- S4Mascot ----------
def size_card():
    cell = lambda s, l, n: ('<div class="col" style="gap:0;align-items:center">%s<b class="xs" style="margin-top:4px">%s</b><span class="xs soft">%s</span></div>' % (fox(s), l, n))
    return ('<div class="card" style="position:absolute;left:16px;bottom:44px;width:324px;padding:12px;display:flex;flex-direction:column;gap:8px">'
            '<div class="row" style="justify-content:space-between"><b class="sm">Cỡ nhân vật</b>' + chip('Mặc định 96px', 'primary') + '</div>'
            '<div class="row" style="justify-content:space-between;align-items:flex-end">%s%s%s</div></div>') % (
            cell(48, '48px', 'Nhỏ'), cell(96, '96px', 'Vừa'), cell(144, '144px', 'Lớn'))

def hero():
    win = '<div class="win" style="left:16px;top:16px;width:442px;height:236px"><header>Báo cáo quý 3 · Soạn thảo</header>%s</div>' % winlines(7)
    label = '<div style="position:absolute;right:16px;bottom:216px;width:116px;text-align:right"><b class="sm" style="display:block">Chào</b><span class="xs soft">Tự đóng 5 giây, bấm để đóng</span></div>'
    return desk(win + size_card() + label + spot('open', '<p class="sm">Hihi, chào buổi sáng!</p>', 116), 'grid-row:1/3')

def stats():
    row = lambda l, v, c: ('<div style="display:grid;grid-template-columns:28px 1fr 20px;align-items:center;gap:8px"><span class="xs soft">%s</span>%s<span class="xs">%d</span></div>' % (l, bar(v, c), v))
    return ('<div class="col" style="gap:4px"><div class="row" style="justify-content:space-between"><b>Kitsu</b>' + chip('Lv 12', 'primary') + '</div>'
            + row('XP', 68, 'xp') + row('No', 72, 'success') + row('Vui', 85, 'success') + row('Sức', 24, 'danger')
            + '<div class="row xs" style="gap:8px;font-weight:600"><span style="width:12px;height:12px;border-radius:var(--r-pill);background:var(--coin)"></span>1.240 xu</div></div>')

def quiet():
    tiles = ''.join('<div style="background:var(--surface2);border-radius:var(--r-sm)"></div>' for _ in range(4))
    win = ('<div class="win" style="left:0;top:0;right:0;bottom:28px;border:0;border-radius:0">'
           '<header>Họp trực tuyến · toàn màn hình</header>'
           '<div class="grid" style="grid-template-columns:1fr 1fr;grid-auto-rows:1fr;padding:12px;height:calc(100%% - 32px)">%s</div></div>') % tiles
    tip = ('<div class="bub" style="position:absolute;right:12px;bottom:36px;width:256px;padding:8px 12px"><b class="sm">Yên lặng: mascot đang tạm ẩn</b>'
           '<p class="xs soft">Không bong bóng, không hỏi ôn. Tự hiện lại khi xong họp.</p></div>')
    return desk(win + tip)

def s4mascot(dark):
    nudge = ('<div class="col" style="gap:8px"><p class="sm">Có <b>12 thẻ</b> đến hạn. Ôn nhanh một phút nhé?</p>'
             '<div class="row" style="gap:8px;justify-content:flex-end">' + b('Để sau', 'ghost') + b('Ôn ngay', 'primary') + '</div></div>')
    zzz = '<span class="h3 soft" style="margin-right:8px">Zzz</span>'
    body = ('<div class="t%s" style="width:1100px;height:720px;padding:24px;display:flex;flex-direction:column;gap:12px;overflow:hidden">%s'
            '<div class="row" style="justify-content:space-between;height:32px"><h1 class="h2">Mascot trên màn hình</h1>'
            '<span class="sm soft">Tỉ lệ thật. Luôn ở góc, tối đa một bong bóng, không lấy focus, vùng trống bấm xuyên qua.</span></div>'
            '<div style="flex:1;min-height:0;display:grid;grid-template-columns:476px 1fr 1fr;grid-template-rows:344px 1fr;gap:12px">%s%s%s%s%s</div></div>') % (
        ' dark' if dark else '', DEFS, hero(),
        desk(cap('Nhắc ôn', 'Tự đóng 8 giây', 148) + spot('open', nudge, 240)),
        desk(cap('Giữ chuột', 'Rời chuột là ẩn', 148) + spot('open', stats(), 240)),
        desk(cap('Ngủ', 'Máy rảnh 10 phút hoặc hết sức. Không hỏi, không nhắc đói.', 148) + spot('sleep', extra=zzz)),
        quiet())
    write('S4MascotDark' if dark else 'S4Mascot', body, 1100, 720, title='Mascot Dark' if dark else 'Mascot màn hình', css=CSS4)

# ---------- S4Quiz ----------
def qhead(left, right):
    return '<div class="row" style="justify-content:space-between;height:24px"><b class="xs" style="color:var(--xp)">%s</b>%s</div>' % (left, right)

def qword(lemma, ipa, tail=''):
    return ('<div class="row" style="gap:8px;height:28px"><b style="font-size:20px;line-height:1.2">%s</b>%s<span class="ipa xs soft">%s</span>'
            '<span class="sm soft" style="margin-left:auto">%s</span></div>') % (lemma, iconbtn('volume'), ipa, tail)

CH = ['kiên cường', 'mong manh', 'hào phóng', 'do dự']

def choices(right=None, wrong=None):
    out = ''
    for i, c in enumerate(CH):
        cls = ' right' if i == right else ' wrong' if i == wrong else ''
        ic = icon('check', style=I14) if i == right else icon('x', style=I14) if i == wrong else ''
        out += '<div class="choice%s">%s%s</div>' % (cls, c, ('<span style="margin-left:auto;display:flex">%s</span>' % ic) if ic else '')
    return '<div class="choices">%s</div>' % out

def stack(inner):
    return '<div class="col" style="gap:4px">%s</div>' % inner

def s4quiz(dark):
    W = 'resilient', '/rɪˈzɪliənt/'
    N = 'meticulous', '/məˈtɪkjələs/'
    MEAN = '<p class="sm" style="font-weight:600">tỉ mỉ; cẩn thận từng chi tiết</p>'
    ask = stack(qhead('Ôn từ · còn 12 thẻ', b('Để sau', 'ghost')) + qword(*W, 'nghĩa là gì?') + choices())
    ok = stack(qhead('Ôn từ', '<span class="xs soft">Ôn lại sau 4 ngày</span>') + qword(*W) + choices(right=0)
               + '<p class="sm" style="font-weight:600;color:var(--success)">Đúng rồi!</p>')
    no = stack(qhead('Ôn từ', '<span class="xs soft">Ôn lại sau 10 phút</span>') + qword(*W) + choices(right=0, wrong=1)
               + '<p class="sm" style="font-weight:600;color:var(--danger)">Chưa đúng, đáp án: kiên cường</p>')
    example = '<p class="xs">She keeps meticulous notes.</p><p class="xs soft">Cô ấy ghi chép rất tỉ mỉ.</p>'
    new = stack(qhead('Từ của khoảnh khắc', chip('C1', 'primary')) + qword(*N) + MEAN + '<div>' + example + '</div>'
                + '<div class="row" style="gap:8px;justify-content:flex-end">' + b('Để sau', 'ghost') + b('Lưu', 'primary', 'bookmark') + '</div>')
    saved = stack(qhead('Từ của khoảnh khắc', chip('C1', 'primary')) + qword(*N) + MEAN
                  + '<p class="sm" style="font-weight:600;color:var(--success)">Đã lưu! Kitsu sẽ hỏi lại bạn sau</p>')
    empty_win = '<div class="win" style="left:12px;top:12px;width:208px;height:190px"><header>Báo cáo quý 3</header>%s</div>' % winlines(6)
    cells = [
        desk(cap('Câu hỏi', 'Không tự đóng', 200) + spot('open', ask, 316)),
        desk(cap('Đúng', 'Đóng sau 2,2 giây', 200) + spot('happy', ok, 316)),
        desk(cap('Sai', 'Hiện đáp án, đóng sau 3,5 giây', 200) + spot('sad', no, 316)),
        desk(cap('Từ mới', 'Không tự đóng', 200) + spot('open', new, 316)),
        desk(cap('Đã lưu', 'Đóng sau 1,8 giây', 200) + spot('happy', saved, 316)),
        desk(empty_win + cap('Trống', 'Chưa có từ để hỏi', 200) + spot('sad', '<p class="sm">Chưa có gói từ điển để ôn.</p>', 200)),
    ]
    body = ('<div class="t%s" style="width:1100px;height:720px;padding:24px;overflow:hidden">%s'
            '<div style="height:100%%;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;gap:12px">%s</div></div>') % (
        ' dark' if dark else '', DEFS, ''.join(cells))
    write('S4QuizDark' if dark else 'S4Quiz', body, 1100, 720, title='Câu đố nhanh Dark' if dark else 'Câu đố nhanh', css=CSS4)

# ---------- S4Popup ----------
def pop(q, inner, foot='Esc đóng · Enter tra · Ctrl+S lưu', action='', placeholder=False):
    qt = '<span class="soft">%s</span>' % q if placeholder else '<span style="overflow:hidden;text-overflow:ellipsis">%s</span>' % q
    return ('<div class="pop"><header>Dịch nhanh%s</header><div class="q">%s%s</div><div class="bd">%s</div><footer><span>%s</span>%s</footer></div>') % (
        iconbtn('x', 'ghost'), icon('search', style='width:16px;height:16px;color:var(--inkSoft)'), qt, inner, foot, action)

def ipa(us, uk):
    return '<div class="row" style="gap:8px">%s%s</div>' % (
        b('US <span class="ipa" style="font-weight:400">%s</span>' % us, '', 'volume'),
        b('UK <span class="ipa" style="font-weight:400">%s</span>' % uk, '', 'volume'))

def head(lemma, level, pos):
    return '<div class="row" style="gap:8px"><b class="h2">%s</b>%s<em class="sm soft">%s</em></div>' % (lemma, chip(level, 'primary'), pos)

MEAN16 = '<p style="font-size:16px;font-weight:600;line-height:1.3">%s</p>'

def word_resilient():
    return (head('resilient', 'B2', 'adj') + ipa('/rɪˈzɪliənt/', '/rɪˈzɪliənt/') + MEAN16 % 'kiên cường; mau phục hồi'
            + '<div class="row" style="gap:8px;align-items:flex-start">' + iconbtn('volume')
            + '<div class="xs" style="line-height:1.4"><div>She stayed resilient after every setback.</div><div class="soft">Cô ấy vẫn kiên cường sau mỗi lần vấp ngã.</div></div></div>')

def word_took():
    return (head('take', 'A1', 'verb') + '<p class="xs soft">“took”, dạng quá khứ của <b>take</b></p>' + ipa('/teɪk/', '/teɪk/')
            + MEAN16 % 'lấy; cầm; mang đi'
            + '<div class="row xs soft" style="gap:8px">Kết quả khác:' + b('take off', style=PILL) + b('take care', style=PILL) + '</div>')

def trhead():
    return '<div class="row" style="gap:8px"><b class="sm">Bản dịch</b>%s</div>' % chip('Máy dịch', 'warning')

def tokens(ws):
    return '<div class="row" style="gap:4px;flex-wrap:wrap">%s</div>' % ''.join(b(w, style=PILL) for w in ws)

SENT = 'The meeting was postponed until next week.'
TOK = ['The', 'meeting', 'was', 'postponed', 'until', 'next', 'week']

def sentence():
    return ('<p class="xs soft">Câu có nhiều từ, bấm vào một từ để tra riêng:</p>'
            '<div class="tr">' + trhead() + '<p style="font-weight:600">Cuộc họp đã bị hoãn đến tuần sau.</p></div>' + tokens(TOK))

def notfound():
    return ('<p class="soft">Không tìm thấy “resilent” trong từ điển.</p><p class="xs soft">Có phải bạn muốn tìm:</p>'
            + tokens(['resilient', 'resilience', 'resident']))

def needmodel():
    return ('<div class="tr" style="gap:8px">' + trhead()
            + '<p class="xs soft">Dịch cả câu cần tải model dịch offline một lần (%s MB, miễn phí, chạy hoàn toàn trên máy bạn).</p>' % OPUS_MB
            + '<div class="row" style="gap:8px">' + b('Tải model', 'primary') + b('Tải bản chất lượng cao (%s MB)' % HIGH_MB) + '</div></div>')

def downloading():
    return ('<div class="tr" style="gap:8px">' + trhead() + '<p class="xs soft">Đang tải… 38/%s MB</p>' % OPUS_MB + bar(37)
            + '<div>' + b('Huỷ') + '</div></div>')

def empty():
    return ('<div class="col" style="flex:1;align-items:center;justify-content:center;text-align:center;gap:8px">%s'
            '<p class="sm soft" style="max-width:340px">Copy một từ tiếng Anh rồi bấm Ctrl + Alt + T, hoặc gõ vào ô trên.</p></div>') % fox(48)

def s4popup(dark):
    save = b('Lưu', 'primary', 'bookmark')
    saved = b('Đã lưu', '', 'check', 'opacity:.7')
    if dark:
        pops = [pop('resilient', word_resilient(), action=save), pop(SENT, needmodel()), pop(SENT, downloading()),
                pop('Gõ từ tiếng Anh hoặc tiếng Việt…', empty(), placeholder=True)]
        notes = 'Bản tối: tra từ, cần tải model, đang tải, trống.'
    else:
        pops = [pop('resilient', word_resilient(), action=save), pop('took', word_took(), foot='Đã lưu vào sổ từ', action=saved),
                pop(SENT, sentence()), pop('resilent', notfound())]
        notes = 'Bản sáng: tra từ, đã lưu, cả câu, không thấy.'
    side = ('<div style="position:absolute;left:888px;top:24px;width:188px" class="col"><h1 class="h3">Dịch nhanh</h1>'
            '<p class="sm soft">' + notes + '</p><p class="sm soft">Bấm phím tắt để mở, Esc để đóng. Popup hiện gần góc mascot.</p><div>'
            + chip('Ctrl + Alt + T', 'primary') + '</div></div>')
    hint = '<p class="sm">Dịch đoạn vừa copy?</p>'
    grid = ('<div style="position:absolute;left:24px;top:24px;display:grid;grid-template-columns:420px 420px;grid-template-rows:300px 300px;gap:12px">%s</div>') % ''.join(pops)
    body = ('<div class="t%s" style="position:relative;width:1100px;height:720px;background:var(--surface2);overflow:hidden">%s%s%s%s%s</div>') % (
        ' dark' if dark else '', DEFS, grid, side, spot('open', hint, 168), tb())
    write('S4PopupDark' if dark else 'S4Popup', body, 1100, 720, title='Dịch nhanh Dark' if dark else 'Popup dịch nhanh', css=CSS4)

OPUS_MB, HIGH_MB = '102', '831'  # docs/17-metrics.md, popup tính theo MiB

if __name__ == '__main__':
    for d in (False, True):
        s4mascot(d); s4quiz(d); s4popup(d)
    print('ok')
