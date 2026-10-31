# Phần S1 (học chính): trang chủ, lộ trình, bài học, bài tập, đọc, nghe.
#   BOARD_OUT=<thư mục project> python gen_s1.py
# Dữ liệu mẫu lấy từ content/curated (khoá A2, thì quá khứ đơn, Why Sleep Matters, Asking for directions).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from board_kit import *

# Chỉ bố cục riêng của phần S1, không định nghĩa lại component của kit.
CSS_S1 = """
.tabs{align-self:flex-start}
.s1-tile{width:40px;height:40px;flex:none;display:grid;place-items:center;border-radius:var(--r-md)}
.s1-num{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;font-size:20px;line-height:1.2}
.s1-big{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;font-size:40px;line-height:1}
.s1-crumb{display:flex;align-items:center;gap:4px;height:20px;font-size:13px;font-weight:600;color:var(--inkSoft)}
.s1-crumb .ic{width:16px;height:16px}
.s1-code{font-family:'Noto Sans',sans-serif;font-size:13px;padding:0 4px;border-radius:var(--r-sm);background:var(--surface2)}
.s1-tip{display:flex;gap:8px;padding:12px;border-radius:var(--r-md);background:var(--warningSoft);font-size:13px}
.s1-tip>.ic{color:var(--warning)}
.table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden}
.table th,.table td{padding:8px 12px;text-align:left;border-bottom:1px solid var(--line)}
.table th{background:var(--surface2);font-weight:700}
.table tr:last-child td{border-bottom:0}
.s1-choices{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.s1-choice{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 16px;font-size:16px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--bg)}
.s1-choice>b{width:16px;color:var(--inkSoft);font-size:13px}
.s1-choice.on{border-color:var(--primary);background:var(--primarySoft);color:var(--primary);font-weight:600}
.s1-choice.on>b{color:var(--primary)}
.s1-choice.bad{border-color:var(--danger);background:var(--dangerSoft)}
.s1-choice.good{border-color:var(--success);background:var(--successSoft)}
.s1-prompt{font-size:26px;font-weight:700;line-height:1.35;margin:0}
.s1-ins{font-weight:600;color:var(--xp);margin:0}
.s1-blank{display:inline-block;min-width:64px;margin:0 4px;padding:0 8px;text-align:center;color:var(--primary);border-bottom:3px solid var(--primary)}
.s1-fb{padding:12px;border-radius:var(--r-md);background:var(--dangerSoft)}
.s1-fb.ok{background:var(--successSoft)}
.s1-fb .row{gap:8px;font-weight:700;color:var(--danger)}
.s1-fb.ok .row{color:var(--success)}
.s1-token{display:inline-flex;align-items:center;height:36px;padding:0 12px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--surface);font-size:16px}
.s1-token.placed{background:var(--primary);border-color:var(--primary);color:var(--surface)}
.s1-token.used{opacity:.3}
.s1-slot{display:flex;flex-wrap:wrap;gap:8px;min-height:60px;padding:12px;align-items:center;border-bottom:2px dashed var(--line)}
.s1-pair{display:flex;align-items:center;justify-content:space-between;gap:8px;height:56px;padding:0 12px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--bg);font-size:16px}
.s1-pair.on{background:var(--warningSoft);border-color:var(--warning)}
.s1-pair.link{background:var(--successSoft);border-color:var(--success)}
.s1-pic{display:grid;place-items:center;position:relative;height:124px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--bg);color:var(--inkSoft)}
.s1-pic.on{border-color:var(--primary);background:var(--primarySoft);color:var(--primary)}
.s1-pic>b{position:absolute;top:8px;left:12px;font-size:13px}
.s1-pic .ic{width:56px;height:56px;stroke-width:1.6}
.s1-reader{font-size:16px;line-height:28px;margin:0}
.s1-reader .ic{width:14px;height:14px;color:var(--inkSoft);vertical-align:-2px;margin-right:4px}
.s1-hard{border-bottom:2px dotted var(--warning)}
.s1-active{background:var(--warningSoft);border-radius:var(--r-sm);border-bottom:2px dotted var(--warning)}
.s1-vi{margin:0;padding:8px 12px;border-radius:var(--r-sm);background:var(--surface2);color:var(--inkSoft);font-size:13px}
.s1-link{font-size:13px;font-weight:600;color:var(--primary)}
.s1-line{display:flex;align-items:flex-start;gap:8px;padding:4px 8px;border-radius:var(--r-sm)}
.s1-line.loop{background:var(--primarySoft)}
.s1-line.now{background:var(--warningSoft)}
.s1-n{width:24px;height:24px;flex:none;display:grid;place-items:center;border-radius:var(--r-pill);border:1px solid var(--line);background:var(--surface);font-size:12px;font-weight:700}
.s1-sound{position:relative;display:flex;flex-direction:column;align-items:center;gap:0;padding:16px 12px;text-align:center;border-radius:var(--r-md);border:1px solid var(--line);background:var(--bg)}
.s1-sound.on{border-color:var(--primary);background:var(--primarySoft)}
.s1-sound .mic{position:absolute;top:8px;right:8px;color:var(--inkSoft)}
.s1-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center}
"""

def out(name, active, body, dark=False, title=None):
    write(name, study_shell(active, body, dark=dark), 1100, 720, title=title or name, css=CSS_S1)

def tile(ic, tone):
    return '<span class="s1-tile" style="background:var(--%sSoft);color:var(--%s)">%s</span>' % (tone, tone, icon(ic))

TABS = [('courses', 'Lộ trình'), ('lessons', 'Bài học'), ('grammar', 'Ngữ pháp'), ('reading', 'Bài đọc'), ('listening', 'Nghe')]
def tabs(on):
    return '<div class="tabs">%s</div>' % ''.join('<div class="tab%s">%s</div>' % (' on' if k == on else '', l) for k, l in TABS)

def page_head(title, intro):
    return '<div class="col" style="gap:4px"><div class="h2">%s</div><div class="soft sm">%s</div></div>' % (title, intro)

def detail_head(crumb, title, chips='', sub=''):
    return ('<div class="col" style="gap:4px"><div class="s1-crumb">%s%s</div>'
            '<div class="row" style="gap:8px"><div class="h2">%s</div>%s</div>%s</div>') % (
        icon('back'), crumb, title, chips, ('<div class="soft sm">%s</div>' % sub) if sub else '')

DISABLED = ' style="opacity:.5"'

# ---------- Trang chủ ----------
def missions(state='active'):
    rows = {
        'active': [('Ôn 10 thẻ', 100, '10/10', True, ''), ('Lưu 3 từ mới', 33, '1/3', False, '+10 XP · +5 xu'), ('Ôn hết thẻ đến hạn', 43, '18/42', False, '+20 XP · +10 xu')],
        'zero': [('Ôn 10 thẻ', 0, '0/10', False, '+10 XP · +5 xu'), ('Lưu 3 từ mới', 0, '0/3', False, '+10 XP · +5 xu'), ('Ôn hết thẻ đến hạn', 0, '0/1', False, '+20 XP · +10 xu')],
    }[state]
    li = ''
    for name, pct, n, done, reward in rows:
        li += ('<div class="item" style="flex:1;padding:8px 16px"><span style="color:var(--%s);display:flex">%s</span>'
               '<div class="grow col" style="gap:4px"><div style="font-weight:600">%s</div>%s</div>'
               '<div class="sm soft" style="width:44px;text-align:right">%s</div><div style="width:120px;display:flex;justify-content:flex-end">%s</div></div>') % (
            'success' if done else 'line', icon('circle-check' if done else 'circle'), name,
            bar(pct, 'success' if done else 'primary'), n, chip('Đã nhận', 'success') if done else chip(reward, 'warning'))
    return ('<div class="card col" style="flex:1"><div class="row" style="justify-content:space-between">'
            '<div class="h3">Nhiệm vụ hôm nay</div><div class="row sm soft" style="gap:8px">Mục tiêu ôn mỗi ngày'
            '<div class="input" style="width:96px;justify-content:space-between;color:var(--ink)">10 thẻ%s</div></div></div>'
            '<div class="col" style="flex:1;gap:8px">%s</div>'
            '<div class="row sm" style="gap:8px"><span style="color:var(--xp);display:flex">%s</span>Xong cả ba: thưởng thêm: <b>+30 XP · +20 xu</b></div></div>') % (
        icon('chevron', style='transform:rotate(90deg);width:16px;height:16px'), li, icon('gift'))

def stats(vals):
    defs = [('flame', 'warning', 'Chuỗi ngày ôn'), ('circle-check', 'success', 'Đã ôn hôm nay'), ('layers', 'primary', 'Tổng số thẻ'), ('sprout', 'xp', 'Đã vào ôn dài hạn')]
    return '<div class="grid" style="grid-template-columns:repeat(4,1fr)">%s</div>' % ''.join(
        '<div class="card row" style="padding:12px">%s<div class="grow"><div class="s1-num">%s</div><div class="xs soft clip">%s</div></div></div>' % (tile(i, t), v, l)
        for (i, t, l), v in zip(defs, vals))

def home(dark=False, name='S1Home'):
    hero = ('<div class="card row" style="background:var(--primarySoft);border-color:var(--primarySoft);padding:24px;justify-content:space-between">'
            '<div class="row" style="gap:16px"><div class="s1-big" style="color:var(--primary)">24</div>'
            '<div><div style="font-weight:700;font-size:16px">Thẻ đến hạn</div><div class="sm soft">Ôn đúng hạn để nhớ lâu hơn</div></div></div>%s</div>') % btn('Bắt đầu ôn (24 thẻ)', 'primary', 'repeat')
    body = '<div class="h1">Chào bạn, hôm nay học gì nào?</div>' + hero + stats(['12 ngày', '18', '386', '142']) + missions()
    out(name, 'home', body, dark, 'Trang chủ' + (' (tối)' if dark else ''))

def home_empty():
    warn = '<div class="s1-tip" style="align-items:center">%sChưa cài gói từ điển nên chưa ôn được.</div>' % icon('lightbulb')
    idle = ('<div class="card row" style="padding:16px 24px;gap:16px">%s<div><div style="font-weight:700;font-size:16px">Sổ từ đang trống</div>'
            '<div class="sm soft">Chưa có từ nào trong sổ. Copy một từ rồi bấm <b>Ctrl + Alt + T</b> để tra và lưu nhé!</div></div></div>') % tile('bookmark', 'primary')
    body = '<div class="h1">Chào bạn, hôm nay học gì nào?</div>' + warn + idle + stats(['0 ngày', '0', '0', '0']) + missions('zero')
    out('S1HomeEmpty', 'home', body, title='Trang chủ: chưa có thẻ')

# ---------- Lộ trình ----------
def course_card(ic, tone, title, levels, done, total, on=False, finished=False):
    meta = chip('Hoàn thành khoá', 'success') if finished else '<span class="xs soft">%d/%d bài</span>' % (done, total)
    return ('<div class="card col" style="padding:12px;gap:8px%s"><div class="row">%s<div class="grow"><div style="font-weight:700;line-height:1.3">%s</div>'
            '<div class="xs soft">%s</div></div></div>%s<div class="row" style="justify-content:flex-end;min-height:24px">%s</div></div>') % (
        ';border-color:var(--primary);box-shadow:0 0 0 1px var(--primary)' if on else '', tile(ic, tone), title, levels,
        bar(round(done * 100 / total), 'success' if finished else 'primary'), meta)

KIND = {'lesson': ('book', 'Bài học'), 'grammar': ('pen', 'Ngữ pháp'), 'reading': ('bookmark', 'Bài đọc'), 'listening': ('headphones', 'Bài nghe')}
def step(state, kind, title, mins, best=None):
    st = {'done': ('circle-check', 'success'), 'next': ('play', 'primary'), 'todo': ('circle', 'line')}[state]
    rowstyle = {'done': 'color:var(--inkSoft)', 'next': 'background:var(--primarySoft);font-weight:700;border-radius:var(--r-sm)', 'todo': ''}[state]
    return ('<div class="row" style="height:32px;padding:0 8px;gap:8px;%s"><span style="color:var(--%s);display:flex">%s</span>'
            '<span class="soft" style="display:flex" title="%s">%s</span><span class="grow clip">%s</span>'
            '<span class="xs soft">%d phút</span><span class="xs" style="width:36px;text-align:right;font-weight:700;color:var(--success)">%s</span></div>') % (
        rowstyle, st[1], icon(st[0]), KIND[kind][1], icon(KIND[kind][0]), title, mins, '%d%%' % best if best is not None else '')

def courses():
    left = ('<div class="col" style="width:264px;flex:none">%s%s%s</div>') % (
        course_card('sprout', 'success', 'Tiếng Anh nền tảng (A1)', 'Từ Pre-A1 đến A1', 42, 42, finished=True),
        course_card('chat', 'primary', 'Giao tiếp tự tin (A2)', 'Từ A1 đến A2', 8, 33, on=True),
        course_card('rocket', 'xp', 'Tiến tới B1', 'Từ A2 đến B1', 0, 32))
    head = ('<div class="card col"><div><div class="h3">Giao tiếp tự tin (A2)</div>'
            '<div class="sm soft">Thì quá khứ, tương lai, so sánh; ngữ pháp thiết yếu; đọc và nghe về đời sống, du lịch, giao tiếp xã hội.</div></div>'
            '<div class="row"><div class="grow col" style="gap:4px"><b class="sm">8/33 bài</b>%s</div>%s</div></div>') % (bar(24), btn('Học tiếp: Thì quá khứ đơn', 'primary', 'play'))
    steps = ''.join([
        step('done', 'lesson', 'Hiện tại đơn hay tiếp diễn?', 12, 88),
        step('next', 'lesson', 'Thì quá khứ đơn', 15),
        step('todo', 'lesson', 'Thì quá khứ tiếp diễn', 12),
        step('todo', 'lesson', 'Tương lai: will và be going to', 12),
        step('todo', 'lesson', 'Thì hiện tại hoàn thành', 15),
        step('todo', 'lesson', 'Ôn tập các thì', 15)])
    unit = ('<div class="card col" style="gap:8px"><div class="row" style="justify-content:space-between"><div><div style="font-weight:700;font-size:16px">Các thì quan trọng</div>'
            '<div class="xs soft">Quá khứ, tương lai, hiện tại hoàn thành.</div></div><span class="sm soft">1/7</span></div><div class="col" style="gap:4px">%s</div></div>') % steps
    rest = ''.join('<div class="item" style="justify-content:space-between"><span style="font-weight:600">%s</span><span class="row sm soft" style="gap:8px">%s%s</span></div>' % (t, n, icon('chevron', style='width:16px;height:16px'))
                   for t, n in [('Ngữ pháp thiết yếu', '0/6'), ('Đọc về đời sống', '0/5')])
    body = page_head('Lộ trình học', 'Mỗi khoá là một chuỗi bài có thứ tự: học nền tảng, ngữ pháp, đọc, nghe. Cứ làm theo thứ tự, app tự ghi tiến độ.') + tabs('courses')
    body += '<div class="row" style="align-items:flex-start;gap:16px">%s<div class="grow col">%s%s%s</div></div>' % (left, head, unit, rest)
    out('S1Courses', 'courses', body, title='Lộ trình học')

# ---------- Danh sách bài ----------
def lesson_row(title, summary, level, mins, best=None, done=False):
    return ('<div class="item" style="padding:8px 12px"><span style="color:var(--%s);display:flex">%s</span>'
            '<div class="grow"><div style="font-weight:700">%s</div><div class="xs soft clip">%s</div></div>'
            '%s<span class="xs soft" style="width:44px;text-align:right">%d phút</span><span class="sm" style="width:40px;text-align:right;font-weight:700;color:var(--success)">%s</span></div>') % (
        'success' if done else 'line', icon('circle-check' if done else 'circle'), title, summary, chip(level, 'primary'), mins, '%d%%' % best if best is not None else '')

def progress_card(text, pct, cta=None, allDone=False):
    tail = btn(cta, 'primary', 'play') if cta else ''
    return ('<div class="card row" style="padding:12px 16px"><div class="grow col" style="gap:4px"><b>%s</b>%s</div>%s</div>') % (text, bar(pct), tail)

def unit_card(ic, title, summary, count, rows):
    return ('<div class="card col" style="gap:8px"><div class="row">%s<div class="grow"><div style="font-weight:700;font-size:16px">%s</div><div class="sm soft clip">%s</div></div>'
            '<b class="soft">%s</b></div><div class="col" style="gap:8px">%s</div></div>') % (tile(ic, 'primary'), title, summary, count, rows)

def lessons():
    rows = ''.join([
        lesson_row('Thì hiện tại đơn', 'Nói về thói quen và sự thật; thêm -s/-es cho he/she/it; dùng do/does.', 'A1', 12, 90, True),
        lesson_row('Thì hiện tại tiếp diễn', 'Nói về việc đang xảy ra và kế hoạch gần với am/is/are + V-ing.', 'A1', 12, 85, True),
        lesson_row('Hiện tại đơn hay tiếp diễn?', 'Phân biệt thói quen với việc đang diễn ra; động từ trạng thái không dùng tiếp diễn.', 'A2', 12, 88, True),
        lesson_row('Thì quá khứ đơn', 'Kể việc đã xảy ra: was/were, đuôi -ed, động từ bất quy tắc và did.', 'A1', 15),
        lesson_row('Thì quá khứ tiếp diễn', 'Nói việc đang diễn ra tại một lúc trong quá khứ; kết hợp với when và while.', 'A2', 12)])
    body = page_head('Bài học nền tảng', 'Học từ đầu: chữ cái và phát âm, mẫu câu cơ bản, các thì, giao tiếp hằng ngày. Mỗi bài có phần giải thích, ví dụ nghe được và bài tập.')
    body += tabs('lessons') + progress_card('Đã hoàn thành 17/43 bài', 40, 'Học tiếp: Thì quá khứ đơn')
    body += unit_card('book', 'Các thì trong tiếng Anh', 'Công thức, khi nào dùng, dấu hiệu nhận biết và lỗi người Việt hay mắc.', '3/8', rows)
    out('S1Lessons', 'courses', body, title='Bài học nền tảng')

def lessons_listening():
    pack = ('<div class="item" style="padding:12px 16px"><span style="color:var(--primary);display:flex">%s</span><div class="grow"><div style="font-weight:700">Âm thanh bài nghe tạo sẵn</div>'
            '<div class="xs soft">Tải thêm (~180 MB) để bài nghe phát ngay bằng giọng tự nhiên, không cần tải model giọng đọc. Không bắt buộc.</div></div>%s</div>') % (icon('headphones'), btn('Tải về (180 MB)'))
    rows = ''.join([
        lesson_row('Hỏi đường', 'Chỉ đường đến bưu điện.', 'A2', 3, 100, True),
        lesson_row('Mua vé xe buýt', 'Mua vé đi Đà Nẵng.', 'A2', 3),
        lesson_row('Nhận phòng khách sạn', 'Làm thủ tục nhận phòng.', 'A2', 4),
        lesson_row('Thông báo ở sân bay', 'Nghe thông báo chuyến bay.', 'A2', 3)])
    body = page_head('Bài nghe', 'Nghe các đoạn hội thoại và bài nói ngắn theo trình độ: chỉnh tốc độ, lặp lại một đoạn (A–B), tự chép lời rồi đối chiếu. Cuối bài có câu hỏi nghe hiểu.')
    body += tabs('listening') + pack + progress_card('Đã hoàn thành 11/30 bài', 37, 'Học tiếp: Mua vé xe buýt')
    body += unit_card('headphones', 'Địa điểm &amp; du lịch', 'Hỏi đường, vé xe, khách sạn, sân bay, chợ.', '1/5', rows)
    out('S1LessonsListening', 'courses', body, title='Bài nghe')

def lessons_empty():
    body = page_head('Ngữ pháp', 'Tra từng điểm ngữ pháp: giải thích ngắn bằng tiếng Việt, ví dụ nghe được, mẹo cho người Việt và bài tập nhanh.')
    body += tabs('grammar') + progress_card('Đã hoàn thành 0/0 bài', 0)
    body += '<div class="s1-empty"><span class="s1-tile" style="background:var(--surface2);color:var(--inkSoft)">%s</span><div class="h3">Chưa có bài học nào.</div></div>' % icon('book')
    out('S1LessonsEmpty', 'courses', body, title='Danh sách trống')

# ---------- Đọc bài ----------
def code(s): return '<span class="s1-code">%s</span>' % s

def example(en, vi):
    return '<div class="row" style="gap:8px;align-items:flex-start">%s<div><div style="font-weight:700">%s</div><div class="sm soft">%s</div></div></div>' % (
        '<button class="btn btn--icon" title="Nghe">%s</button>' % icon('volume'), en, vi)

def action_bar(left=''):
    return '<div class="row" style="justify-content:space-between;margin-top:auto"><span class="sm soft">%s</span>%s</div>' % (left, btn('Làm bài tập (10 câu)', 'primary', 'pen'))

def lesson():
    text = ('<div class="card col" style="gap:8px;font-size:14px"><div><b>Thì quá khứ đơn</b> dùng cho việc đã xảy ra và <b>đã kết thúc</b> trong quá khứ, thường có thời điểm rõ ràng.</div>'
            '<div>Dấu hiệu: %s %s %s %s</div><div>Động từ to be: %s → %s và %s → %s</div></div>') % (
        code('yesterday'), code('last night'), code('two days ago'), code('in 2019'), code('I / he / she / it'), code('was'), code('you / we / they'), code('were'))
    table = ('<div class="card col" style="gap:8px"><div class="h3" style="color:var(--xp)">Công thức</div><table class="table"><thead><tr><th>Dạng</th><th>Động từ to be</th><th>Động từ thường</th></tr></thead><tbody>'
             '<tr><td><b>Khẳng định</b></td><td>I was tired.</td><td>She worked.</td></tr><tr><td><b>Phủ định</b></td><td>I wasn\'t tired.</td><td>She didn\'t work.</td></tr>'
             '<tr><td><b>Nghi vấn</b></td><td>Were you at home?</td><td>Did she work?</td></tr></tbody></table></div>')
    regular = ('<div class="card col" style="gap:8px"><div><b>Động từ có quy tắc</b>: thêm -ed.</div><div class="row sm" style="gap:8px;flex-wrap:wrap">%s %s %s %s</div></div>') % (
        code('work → worked'), code('live → lived'), code('study → studied'), code('stop → stopped'))
    ex = ''.join([example('I was at home last night.', 'Tối qua tôi ở nhà.'), example('We watched a movie yesterday.', 'Hôm qua chúng tôi xem một bộ phim.'),
                  example('She went to Da Nang last summer.', 'Hè năm ngoái cô ấy đi Đà Nẵng.'),
                  example("They didn't come to the party.", 'Họ đã không đến bữa tiệc.'), example('Did you see the game last night?', 'Tối qua bạn có xem trận đấu không?'),
                  example('The children were very happy.', 'Bọn trẻ đã rất vui.')])
    examples = '<div class="card col" style="flex:1;justify-content:space-between"><div class="h3" style="color:var(--xp)">Ví dụ</div>%s</div>' % ex
    tip = ('<div class="s1-tip">%s<div><b>Lỗi người Việt hay mắc:</b> sau did, động từ chính về nguyên mẫu. Sai: %s Đúng: %s</div></div>') % (icon('lightbulb'), code('Did he went?'), code('Did he go?'))
    body = detail_head('Danh sách bài học', 'Thì quá khứ đơn', chip('A1', 'primary') + chip('15 phút'), 'Kể việc đã xảy ra: was/were, đuôi -ed, động từ bất quy tắc và did.')
    body += '<div class="row" style="align-items:stretch;gap:16px"><div class="grow col" style="gap:16px">%s%s%s%s</div><div class="col" style="width:328px;flex:none;gap:16px">%s%s</div></div>' % (text, table, regular, tip, examples, btn('Làm bài tập (10 câu)', 'primary', 'pen'))
    out('S1Lesson', 'courses', body, title='Đọc bài học')

def lesson_sounds():
    items = [('cat', '/kæt/', '/æ/: như nói “e” nhưng hạ hàm thật thấp, miệng mở gần như “a”'), ('bed', '/bɛd/', '/ɛ/: gần “e” tiếng Việt (“me”), đọc ngắn'),
             ('sit', '/sɪt/', '/ɪ/: giữa “i” và “ê”, ngắn và lỏng, không kéo dài'), ('hot', '/hɑt/', '/ɑ/: mở miệng rộng như “a”, lưỡi hạ thấp và lùi về sau'),
             ('cup', '/kʌp/', '/ʌ/: gần “â” ngắn, miệng mở vừa, thả lỏng'), ('book', '/bʊk/', '/ʊ/: gần “u” nhưng ngắn, môi chỉ hơi tròn')]
    cells = ''.join('<div class="s1-sound%s"><span class="mic">%s</span><div class="h3">%s</div><div class="ipa sm" style="color:var(--xp)">%s</div><div class="xs soft" style="margin-top:4px">%s</div></div>' % (
        ' on' if i == 0 else '', icon('mic', style='width:16px;height:16px'), w, ipa, n) for i, (w, ipa, n) in enumerate(items))
    grid = ('<div class="card col"><div class="h3" style="color:var(--xp)">Sáu nguyên âm ngắn</div><div class="grid" style="grid-template-columns:repeat(3,1fr);gap:8px">%s</div>'
            '<div class="row xs soft" style="gap:4px">%s Bấm vào ô để nghe phát âm. · %s Luyện phát âm</div></div>') % (cells, icon('volume', style='width:14px;height:14px'), icon('mic', style='width:14px;height:14px'))
    practice = ('<div class="card col" style="gap:8px;padding:12px 16px"><div class="row" style="justify-content:space-between"><div class="row" style="gap:8px"><div class="h3">cat</div>%s<span class="sm" style="font-weight:600">Khá tốt! · 82%% chính xác</span></div>%s</div>'
                '<div class="row sm"><span class="ipa">Âm chuẩn: /kæt/ · Bạn nói: /kɛt/</span><div class="row" style="margin-left:auto;gap:8px">%s%s</div></div></div>') % (
        chip('Luyện phát âm', 'primary'), btn('Đóng', 'ghost'), btn('Nghe mẫu', '', 'volume'), btn('Nói lại', '', 'mic'))
    body = detail_head('Danh sách bài học', 'Nguyên âm ngắn', chip('Pre-A1', 'primary') + chip('10 phút'), 'Sáu nguyên âm ngắn /æ/, /ɛ/, /ɪ/, /ɑ/, /ʌ/, /ʊ/ và các cặp dễ nhầm.')
    body += grid + practice + action_bar()
    out('S1LessonSounds', 'courses', body, title='Lưới âm')

def result(passed=True):
    filled = 'fill:currentColor;color:var(--coin);width:40px;height:40px'
    empty = 'color:var(--line);width:40px;height:40px'
    stars = ''.join(icon('star', style=filled if i < (3 if passed else 1) else empty) for i in range(3))
    if passed:
        head, note = 'Hoàn thành bài! 92%', chip('+30 XP · +15 xu', 'xp')
        btns = btn('Đọc lại bài') + btn('Làm lại') + btn('Danh sách bài') + btn('Bài tiếp theo', 'primary', 'chevron')
    else:
        head, note = 'Bạn đạt 50%', '<div class="soft">Cần đạt từ 70% để hoàn thành bài: đọc lại bài rồi thử lại nhé!</div>'
        btns = btn('Danh sách bài') + btn('Đọc lại bài') + btn('Làm lại', 'primary', 'repeat')
    card = ('<div class="card col" style="width:560px;margin:auto;align-items:center;text-align:center;padding:40px 32px;gap:12px">'
            '<div class="row" style="gap:8px">%s</div><div class="h1">%s</div><div class="soft">Thì quá khứ đơn · điểm cao nhất %s</div>%s'
            '<div class="row" style="gap:8px;margin-top:12px">%s</div></div>') % (stars, head, '92%' if passed else '60%', note, btns)
    out('S1LessonResult' if passed else 'S1LessonResultRetry', 'courses', card, title='Kết quả bài học' if passed else 'Kết quả chưa đạt')

# ---------- Bài tập ----------
def ex_frame(n, inner, actions, dark=False, name='S1Exercises', title='Bài tập', hint='Phím 1–4 để chọn · Enter để kiểm tra'):
    head = ('<div class="col" style="gap:4px"><div class="row" style="justify-content:space-between"><div class="s1-crumb">%sXem lại bài</div>'
            '<span class="sm soft">Câu %d/10 · Thì quá khứ đơn</span></div>%s</div>') % (icon('back'), n, bar((n - 1) * 10))
    foot = '<div class="row" style="justify-content:space-between"><span class="xs soft">%s</span><div class="row" style="gap:8px">%s</div></div>' % (hint, actions)
    body = '<div class="col" style="width:680px;margin:0 auto;gap:16px;flex:1">%s<div class="card col" style="gap:16px;padding:32px;margin:auto 0">%s</div>%s</div>' % (head, inner, foot)
    out(name, 'courses', body, dark, title)

def choices(items, picked=None, bad=None, good=None):
    def cls(i):
        return ' on' if i == picked else ' bad' if i == bad else ' good' if i == good else ''
    return '<div class="s1-choices">%s</div>' % ''.join('<div class="s1-choice%s"><b>%d</b><span>%s</span></div>' % (cls(i), i + 1, c) for i, c in enumerate(items))

def audio_prompt():
    return '<div class="row" style="gap:8px">%s%s</div>' % (btn('Nghe', '', 'volume'), btn('Chậm', '', 'turtle'))

def ex_listen():
    inner = '<p class="s1-ins">Nghe và chọn đáp án đúng:</p><p class="s1-prompt">Where did she go last summer?</p>' + audio_prompt()
    inner += choices(['Hue', 'Da Nang', 'Ha Noi', 'Phu Quoc'], picked=1)
    ex_frame(3, inner, btn('Kiểm tra', 'primary'))

def ex_wrong(dark=False, name='S1ExercisesWrong'):
    inner = '<p class="s1-prompt">Chọn câu đúng:</p>'
    inner += '<div class="col" style="gap:8px">%s</div>' % ''.join(
        '<div class="s1-choice%s"><b>%d</b><span>%s</span></div>' % (c, i + 1, t) for i, (c, t) in enumerate([
            (' bad', 'Did he went to school yesterday?'), (' good', 'Did he go to school yesterday?'), ('', 'Does he went to school yesterday?')]))
    inner += ('<div class="s1-fb"><div class="row">%sChưa đúng, đáp án:</div><div style="font-weight:600;margin-top:4px">Did he go to school yesterday?</div>'
              '<div class="row sm" style="color:var(--ink);font-weight:400;margin-top:4px">%sSau did, động từ chính về nguyên mẫu.</div></div>') % (icon('x'), icon('lightbulb', style='color:var(--warning)'))
    ex_frame(4, inner, btn('Câu tiếp', 'primary'), dark, name, 'Bài tập: chưa đúng', 'Enter để sang câu tiếp')

def ex_gap():
    inner = '<p class="s1-ins">Điền từ vào chỗ trống:</p><p class="s1-prompt">She<span class="s1-blank">went</span>to Da Nang last summer.</p>'
    inner += '<div class="input" style="color:var(--ink);height:44px;font-size:16px">went</div>'
    inner += '<div class="s1-fb ok"><div class="row">%sChính xác!</div></div>' % icon('check')
    ex_frame(5, inner, btn('Câu tiếp', 'primary'), name='S1ExercisesGap', title='Bài tập: điền từ', hint='Enter để sang câu tiếp')

def ex_order():
    placed = ''.join('<span class="s1-token placed">%s</span>' % w for w in ['She', "didn't"])
    pool = ''.join('<span class="s1-token%s">%s</span>' % (' used' if u else '', w) for w, u in [('bag.', 0), ('She', 1), ('that', 0), ("didn't", 1), ('buy', 0)])
    inner = '<p class="s1-ins">Bấm các từ theo đúng thứ tự để ghép thành câu:</p><p class="s1-prompt" style="font-size:20px">Cô ấy đã không mua cái túi đó.</p>'
    inner += '<div class="s1-slot">%s</div><div class="row" style="gap:8px;flex-wrap:wrap;padding:0 12px">%s</div>' % (placed, pool)
    ex_frame(6, inner, '<button class="btn btn--primary"%s>Kiểm tra</button>' % DISABLED, name='S1ExercisesOrder', title='Bài tập: xếp câu', hint='Bấm lại từ đã đặt để bỏ ra')

def ex_match():
    left = [('buy', 'link', 2), ('eat', 'link', 4), ('see', 'on', None), ('take', '', None), ('make', '', None)]
    right = [('saw', ''), ('bought', 'link'), ('made', ''), ('ate', 'link'), ('took', '')]
    lc = ''.join('<div class="s1-pair %s"><span>%s</span>%s</div>' % (c, w, chip(str(n), 'xp') if n else '') for w, c, n in left)
    rc = ''.join('<div class="s1-pair %s" style="justify-content:flex-start"><b class="sm soft">%d</b><span>%s</span></div>' % (c, i + 1, w) for i, (w, c) in enumerate(right))
    inner = '<p class="s1-ins">Ghép động từ với dạng quá khứ</p><div class="grid" style="grid-template-columns:1fr 1fr;gap:16px"><div class="col" style="gap:8px">%s</div><div class="col" style="gap:8px">%s</div></div>' % (lc, rc)
    ex_frame(7, inner, '<button class="btn btn--primary"%s>Kiểm tra</button>' % DISABLED, name='S1ExercisesMatch', title='Bài tập: ghép cặp', hint='Bấm mục bên trái, rồi mục bên phải')

def ex_picture():
    pics = [('sun', ''), ('book', 'on'), ('home', ''), ('star', '')]
    grid = ''.join('<div class="s1-pic %s"><b>%d</b>%s</div>' % (c, i + 1, icon(ic)) for i, (ic, c) in enumerate(pics))
    inner = '<p class="s1-ins">Chọn hình đúng với từ:</p><p class="s1-prompt">book</p><div class="grid" style="grid-template-columns:repeat(4,1fr);gap:8px">%s</div>' % grid
    ex_frame(8, inner, btn('Kiểm tra', 'primary'), name='S1ExercisesPicture', title='Bài tập: chọn hình')

def ex_speak():
    inner = '<p class="s1-ins">Bấm micro và đọc to câu này.</p><p class="s1-prompt">She didn\'t buy that bag.</p>'
    inner += '<div class="row" style="gap:8px">%s%s</div>' % (btn('Nghe mẫu', '', 'volume'), btn('Nói lại', '', 'mic'))
    inner += ('<div class="s1-fb ok"><div class="row">%sKhá tốt! · 84%% chính xác</div><div class="sm" style="margin-top:4px">Mình nghe được: “She didn\'t by that bag”</div>'
              '<div class="sm soft">Tốc độ 112 từ/phút · 0 lần ngập ngừng lâu</div></div><div class="xs soft">Điểm chỉ mang tính tham khảo (nhận dạng tự động có thể sai).</div>') % icon('check')
    ex_frame(9, inner, btn('Bỏ qua câu này', 'ghost') + btn('Kiểm tra', 'primary'), name='S1ExercisesSpeak', title='Bài tập: nói', hint='Enter để kiểm tra')

# ---------- Trình đọc ----------
def spk(): return icon('volume')

def lookup_panel(mode):
    if mode == 'found':
        return ('<div class="card col" style="gap:8px"><div class="row" style="justify-content:space-between"><div class="h3">organise</div>%s</div>'
                '<div class="row" style="gap:8px">%s<span class="sm soft">verb</span></div><div class="ipa sm soft">/ˈɔrɡəˌnaɪz/</div>'
                '<div style="font-size:16px;font-weight:600">tổ chức; sắp xếp</div>'
                '<div class="xs soft" style="padding-left:8px;border-left:2px solid var(--line)">During sleep, the brain organises what you learned during the day.</div>%s</div>') % (
            '<button class="btn btn--icon">%s</button>' % icon('volume'), chip('B1.1', 'xp'), btn('Lưu từ', 'primary', 'bookmark'))
    return '<div class="card col" style="gap:8px;align-items:center;text-align:center;padding:24px 16px"><span class="s1-tile" style="background:var(--surface2);color:var(--inkSoft)">%s</span><div style="font-weight:600">Không tìm thấy “exams” trong từ điển.</div></div>' % icon('search')

def reading(dark=False, name='S1Reading', mode='found', title='Trình đọc'):
    H = lambda w: '<span class="s1-hard">%s</span>' % w
    p1 = '%sMost %s need about nine hours of sleep every night, but many get much less. %sStaying up late to study or use a phone is common, yet it can cause problems.' % (spk(), H('teenagers'), spk())
    exams = '<span class="s1-active">exams</span>' if mode != 'found' else 'exams'
    organises = '<span class="s1-active">organises</span>' if mode == 'found' else H('organises')
    p2 = '%sDuring sleep, the brain ' + organises + ' what you learned during the day. %sThat is why students who sleep well usually remember more and make fewer %s in %s.'
    p2 = p2 % (spk(), spk(), H('mistakes'), exams)
    p3 = '%sTo sleep better, go to bed at the same time every night, keep your room dark and quiet, and put your phone away at least thirty minutes before bed.' % spk()
    vi2 = 'Khi ngủ, não sắp xếp lại những gì bạn học trong ngày. Vì vậy học sinh ngủ tốt thường nhớ nhiều hơn và ít mắc lỗi hơn khi thi.'
    para = lambda p, t: '<div class="col" style="gap:4px"><p class="s1-reader">%s</p>%s</div>' % (p, t)
    passage = ('<div class="card col grow" style="gap:12px"><div class="row" style="justify-content:space-between"><div class="h3">Why Sleep Matters</div><div class="row" style="gap:8px">%s%s</div></div>'
               '<div class="xs soft">Bấm vào một từ để tra · bấm loa cạnh câu để nghe câu đó.</div>%s%s%s'
               '<div class="xs soft" style="margin-top:auto"><span class="s1-hard">abc</span> từ khó hơn trình độ hiện tại của bạn</div></div>') % (
        btn('Nghe cả bài', '', 'volume'), btn('Bản dịch', '', 'languages'),
        para(p1, '<span class="s1-link">Xem bản dịch</span>'),
        para(p2, '<div class="s1-vi">%s</div><span class="s1-link">Ẩn bản dịch</span>' % vi2),
        para(p3, '<span class="s1-link">Xem bản dịch</span>'))
    tip = '<div class="s1-tip">%s<div>Bài có nhiều <b>động từ + danh từ</b> hay: <i>get enough sleep, stay awake, improve memory</i>.</div></div>' % icon('lightbulb')
    save = '<div class="col" style="gap:4px"><span class="xs soft">3 từ khó hơn trình độ của bạn</span>%s</div>' % btn('Lưu 3 từ khó', '', 'bookmark')
    aside = '<div class="col" style="width:256px;flex:none;gap:16px">%s%s%s</div>' % (lookup_panel(mode), save, tip)
    body = detail_head('Danh sách bài học', 'Giấc ngủ quan trọng thế nào', chip('B1', 'primary') + chip('5 phút'))
    body += '<div class="row" style="align-items:stretch;gap:16px;flex:1;min-height:0">%s%s</div>' % (passage, aside)
    body += '<div class="row" style="justify-content:flex-end">%s</div>' % btn('Làm bài tập (6 câu)', '', 'pen')
    out(name, 'courses', body, dark, title)

# ---------- Trình nghe ----------
LINES = [('A', 'Excuse me, where is the post office?', 'Xin lỗi, bưu điện ở đâu vậy?'),
         ('B', 'Go straight and turn left at the traffic lights.', 'Đi thẳng rồi rẽ trái ở chỗ đèn giao thông.'),
         ('A', 'Is it far from here?', 'Chỗ đó có xa không?'),
         ('B', 'No, it is about five minutes on foot. It is next to the bank.', 'Không, đi bộ khoảng năm phút. Nó nằm cạnh ngân hàng.'),
         ('A', 'Thank you very much.', 'Cảm ơn bạn rất nhiều.'),
         ('B', 'You are welcome.', 'Không có gì.')]

def ctl(ic, title):
    return '<button class="btn btn--icon" title="%s">%s</button>' % (title, icon(ic))

def listening(hidden=False):
    speed = '<div class="tabs" style="align-self:center">%s</div>' % ''.join('<div class="tab%s">%s×</div>' % (' on' if s == '0.8' else '', s) for s in ['0.6', '0.8', '1'])
    play = '<button class="btn btn--primary" title="Nghe" style="width:56px;height:44px;padding:0">%s</button>' % icon('play')
    player = ('<div class="card row" style="padding:12px 16px"><div class="row" style="gap:8px">%s%s%s%s</div>'
              '<div class="grow row" style="gap:8px;justify-content:center"><span style="display:flex;color:var(--primary)">%s</span><b>Asking for directions</b><span class="sm soft">Câu 2/6</span></div>'
              '<span class="sm soft">Tốc độ</span>%s</div>') % (ctl('skip-back', 'Câu trước'), play, ctl('skip-forward', 'Câu sau'), ctl('repeat', 'Nghe lại câu này'), icon('headphones'), speed)
    rows = ''
    for i, (sp, en, vi) in enumerate(LINES):
        cur, loop = i == 1, (not hidden and 1 <= i <= 2)
        cls = ' now' if cur else ' loop' if loop else ''
        speaker = chip(sp, 'xp' if sp == 'A' else 'success')
        if hidden:
            txt = '<span class="soft" style="letter-spacing:2px">••• ••• •••</span>'
        else:
            txt = '<div style="font-weight:%d">%s</div><div class="xs soft">%s</div>' % (600 if cur else 500, en, vi)
        rows += '<div class="s1-line%s" style="padding:8px;flex:1;align-items:center"><span class="s1-n">%d</span>%s<div class="grow">%s</div></div>' % (cls, i + 1, speaker, txt)
    toggles = '<div class="row" style="gap:8px">%s%s</div>' % (btn('Hiện lời thoại' if hidden else 'Ẩn lời thoại'), btn('Hiện bản dịch' if hidden else 'Ẩn bản dịch'))
    note = '<div class="s1-tip" style="align-items:center">%sLời thoại đang ẩn: nghe trước, rồi bấm “Hiện lời thoại” để đối chiếu.</div>' % icon('lightbulb') if hidden else ''
    transcript = ('<div class="card col grow" style="gap:8px;padding:12px"><div class="row" style="justify-content:space-between"><b>Lời thoại</b>%s</div>%s<div class="col" style="gap:4px;flex:1">%s</div></div>') % (toggles, note, rows)
    loop_btns = '<div class="row" style="gap:8px">%s%s%s</div>' % (btn('Đặt A'), btn('Đặt B'), '' if hidden else btn('Bỏ lặp', 'ghost', 'x'))
    loop_card = '<div class="card col" style="gap:8px;padding:12px"><b>Lặp đoạn A–B</b>%s<div class="xs soft">%s</div></div>' % (
        loop_btns, 'Bấm “Đặt A” rồi “Đặt B” để lặp một đoạn' if hidden else 'Đang lặp từ câu 2 đến câu 3')
    if hidden:
        typed, res = '<div class="input xs" style="width:100%;white-space:nowrap;overflow:hidden">Gõ câu bạn nghe được rồi bấm Kiểm tra</div>', ''
        check = '<button class="btn"%s>Kiểm tra</button>' % DISABLED
    else:
        typed = '<div class="input sm" style="width:100%;white-space:nowrap;overflow:hidden;color:var(--ink)">Go straight and turn left at the light.</div>'
        check = btn('Kiểm tra')
        res = '<div class="s1-fb"><div class="row sm">Đáp án:</div><div class="sm" style="font-weight:600">Go straight and turn left at the traffic lights.</div><div class="xs soft">(78%)</div></div>'
    dict_card = '<div class="card col" style="gap:8px;padding:12px;flex:1"><div class="row" style="gap:8px"><span style="display:flex;color:var(--xp)">%s</span><b>Tự chép lại câu đang nghe</b></div>%s<div>%s</div>%s</div>' % (icon('pen'), typed, check, res)
    body = detail_head('Danh sách bài học', 'Hỏi đường', chip('A2', 'primary') + chip('3 phút')) + player
    body += '<div class="row" style="align-items:stretch;gap:16px;flex:1;min-height:0">%s<div class="col" style="width:288px;flex:none;gap:16px">%s%s</div></div>' % (transcript, loop_card, dict_card)
    out('S1ListeningHidden' if hidden else 'S1Listening', 'courses', body, title='Trình nghe: lời thoại ẩn' if hidden else 'Trình nghe')

if __name__ == '__main__':
    home(); home(True, 'S1HomeDark'); home_empty()
    courses()
    lessons(); lessons_listening(); lessons_empty()
    lesson(); lesson_sounds(); result(True); result(False)
    ex_listen(); ex_wrong(); ex_wrong(True, 'S1ExercisesDark'); ex_gap(); ex_order(); ex_match(); ex_picture(); ex_speak()
    reading(); reading(True, 'S1ReadingDark', title='Trình đọc (tối)'); reading(False, 'S1ReadingNotFound', 'nf', 'Trình đọc: không tìm thấy từ')
    listening(); listening(True)
