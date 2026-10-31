# Phần S2 (ôn và luyện): sinh các bảng S2* từ board_kit.
#   BOARD_OUT=<thư mục project> python gen_s2.py
# Chức năng + trường dữ liệu theo ReviewSession, PracticeSession, SpeakPractice, WordList, PhrasebookPage, PlacementTest.
# Chữ theo src/shared/i18n/vi.json (bỏ emoji/ký hiệu vì bảng dùng icon). Dữ liệu mẫu lấy từ content/.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from board_kit import *

# Bố cục riêng của S2; không định nghĩa lại component chung.
S2_CSS = """
.s2-wrap{flex:1;min-height:0;display:flex;flex-direction:column;gap:16px;position:relative}
.s2-mid{width:100%;max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:16px;flex:1;min-height:0;justify-content:center}
.s2-top{display:flex;align-items:center;gap:12px}.s2-top .bar{flex:1}
.s2-center{text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px}
.s2-prompt{font-weight:700;color:var(--xp)}
.s2-kbd{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;flex:none;border-radius:var(--r-sm);background:var(--surface2);color:var(--inkSoft);font:700 12px 'Be Vietnam Pro',sans-serif}
.s2-choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.s2-choice{display:flex;align-items:center;gap:8px;min-height:44px;padding:8px 12px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--surface);font-weight:600}
.s2-choice.right{background:var(--successSoft);border-color:var(--success);color:var(--success)}
.s2-choice.wrong{background:var(--dangerSoft);border-color:var(--danger);color:var(--danger)}
.s2-choice.dim{color:var(--inkSoft)}
.s2-choice.right .s2-kbd,.s2-choice.wrong .s2-kbd{background:var(--surface)}
.s2-choice .ic{margin-left:auto}
.s2-choice.idk{color:var(--inkSoft)}
.s2-rates{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.s2-rate{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;height:56px;border-radius:var(--r-md);border:1px solid;font-weight:700}
.s2-rate small{font-size:12px;font-weight:600}
.s2-rate.again{background:var(--dangerSoft);border-color:var(--danger);color:var(--danger)}
.s2-rate.hard{background:var(--warningSoft);border-color:var(--warning);color:var(--warning)}
.s2-rate.good{background:var(--successSoft);border-color:var(--success);color:var(--success)}
.s2-rate.easy{background:var(--primarySoft);border-color:var(--primary);color:var(--primary)}
.s2-rate.sug{color:var(--surface)}
.s2-rate.sug.again{background:var(--danger)}.s2-rate.sug.hard{background:var(--warning)}.s2-rate.sug.good{background:var(--success)}.s2-rate.sug.easy{background:var(--primary)}
.s2-back{border-top:1px dashed var(--line);padding-top:12px;display:flex;flex-direction:column;gap:8px}
.s2-ctx{padding:8px 12px;border-radius:var(--r-md);background:var(--warningSoft);font-size:13px}
.s2-mark{font-weight:700;background:var(--surface);border-radius:var(--r-sm);padding:0 4px}
.s2-slots{display:inline-flex;gap:4px;margin:0 4px;vertical-align:baseline}
.s2-slot{display:inline-block;width:20px;text-align:center;color:var(--primary);font-weight:700;border-bottom:3px solid var(--primary);min-height:32px;line-height:32px}
.s2-field{flex:1;font-size:16px;color:var(--ink)}
.s2-field.ph{color:var(--inkSoft)}
.s2-note{display:flex;gap:8px;align-items:flex-start;padding:8px 12px;border-radius:var(--r-md);font-weight:600}
.s2-note.ok{background:var(--successSoft);color:var(--success)}.s2-note.bad{background:var(--dangerSoft);color:var(--danger)}.s2-note.warn{background:var(--warningSoft);color:var(--ink);font-weight:500}.s2-note.warn .ic{color:var(--warning)}
.s2-note b{font-weight:700}
.s2-note .plain{color:var(--ink);font-weight:500}
.s2-line{min-height:56px;padding:8px;border-radius:var(--r-md);background:var(--surface2);display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.s2-pool{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.s2-tok{display:inline-flex;align-items:center;height:40px;padding:0 16px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--surface);font-weight:600;font-size:16px}
.s2-tok.used{background:transparent;border-style:dashed;color:transparent}
.s2-tok.placed{background:var(--primarySoft);border-color:var(--primary);color:var(--primary)}
.s2-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.s2-tile{display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:var(--r-lg);border:1px solid var(--line);background:var(--surface);box-shadow:var(--shadow);min-height:168px}
.s2-tile.first{background:var(--primarySoft);border-color:var(--primary)}
.s2-badge{width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:var(--r-md);background:var(--surface2);color:var(--primary)}
.s2-tile.first .s2-badge{background:var(--surface)}
.s2-pairs{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px}
.s2-pair{display:flex;align-items:center;gap:8px;height:48px;padding:0 12px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--surface);font-weight:600}
.s2-pair.active{background:var(--primarySoft);border-color:var(--primary);color:var(--primary)}
.s2-pair.linked{background:var(--surface2)}.s2-pair.linked .s2-kbd{background:var(--surface)}
.s2-pair .s2-kbd{margin-left:auto}.s2-pair .s2-kbd.l{margin-left:0}
.s2-ph{display:inline-flex;align-items:center;gap:4px;height:36px;padding:0 12px;border-radius:var(--r-md);font-size:16px;font-weight:600}
.s2-ph.ok{background:var(--successSoft);color:var(--success)}.s2-ph.wrong{background:var(--dangerSoft);color:var(--danger)}.s2-ph.missing{background:var(--warningSoft);color:var(--warning)}
.s2-ph small{font-size:13px}
.s2-chips{display:flex;flex-wrap:wrap;gap:8px}
.s2-chips .chip b{font-weight:700;opacity:.75}
.s2-pause{opacity:.6}
.grow .chip{flex:none;white-space:nowrap}
.s2-meta{display:flex;flex-direction:column;align-items:flex-end;gap:0;width:172px;flex:none}
.s2-toast{position:absolute;right:0;bottom:0;display:flex;align-items:center;gap:8px;height:36px;padding:0 16px;border-radius:var(--r-pill);background:var(--ink);color:var(--bg);font-size:13px;font-weight:600}
.s2-select{height:32px;gap:8px;font-size:13px;color:var(--ink);width:auto}
.s2-skill{display:grid;grid-template-columns:96px 56px 1fr 40px;align-items:center;gap:12px}.s2-skill .chip{justify-self:start}
.s2-big{width:64px;height:64px;display:flex;align-items:center;justify-content:center;border-radius:var(--r-pill)}
.s2-big .ic{width:32px;height:32px}
.s2-big.ok{background:var(--successSoft);color:var(--success)}.s2-big.warn{background:var(--warningSoft);color:var(--warning)}.s2-big.info{background:var(--primarySoft);color:var(--primary)}
.s2-passage{padding:12px 16px;border-radius:var(--r-md);background:var(--warningSoft);line-height:1.6}
.s2-mic{padding:12px 16px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface);display:flex;flex-direction:column;gap:8px}
"""

def page(active, body, name, title, dark=False):
    if name.startswith('S2Practice'):
        active = 'practice'
    write(name, study_shell(active, '<div class="s2-wrap">%s</div>' % body, dark=dark), 1100, 720, title=title, css=S2_CSS)

def top(pct, label):
    return '<div class="s2-top">%s<span class="soft sm">%s</span></div>' % (bar(pct), label)

def head(title, counter, pct, card, foot_html=''):
    return '<div class="s2-mid"><div class="h2">%s</div>%s%s%s</div>' % (title, top(pct, counter), card, foot_html)

def rates(sug=None, ivals=('10 phút', '3 giờ', '2 ngày', '6 ngày')):
    data = [(1, 'Quên', 'again'), (2, 'Khó', 'hard'), (3, 'Được', 'good'), (4, 'Dễ', 'easy')]
    return '<div class="s2-rates">%s</div>' % ''.join(
        '<div class="s2-rate %s%s"><span>%d · %s</span><small>%s</small></div>' % (t, ' sug' if n == sug else '', n, l, ivals[n - 1])
        for (n, l, t) in data)

def foot(hint, left=None):
    return ('<div class="soft xs" style="text-align:center;margin-top:-4px">%s</div><div class="row" style="justify-content:space-between;margin-top:-8px">%s%s</div>'
            % (hint, left or btn('Hoàn tác', 'ghost', 'back'), btn('Nói to từ này', 'ghost', 'mic')))

def choice(i, text, state=''):
    mark = icon('check') if state == 'right' else icon('x') if state == 'wrong' else ''
    return '<div class="s2-choice %s"><span class="s2-kbd">%d</span>%s%s</div>' % (state, i, text, mark)

def say_btn(label, ipa=''):
    return '<button class="btn">%s%s%s</button>' % (icon('volume'), label, (' <span class="ipa soft sm">%s</span>' % ipa) if ipa else '')

# ---------- Ôn tập ----------

def review_answer(dark, name):
    card = (
        '<div class="card col" style="gap:12px">'
        '<div class="s2-center"><div class="row" style="gap:8px">%s%s%s</div>'
        '<div class="h1" style="font-size:40px">reluctant</div>'
        '<div class="row" style="gap:8px">%s%s<span class="soft sm"><i>adjective</i></span></div></div>'
        '<div class="s2-ctx"><span class="soft">Câu bạn đã lưu:</span> She was <span class="s2-mark">reluctant</span> to lend him the money.</div>'
        '<div class="s2-choices">%s%s%s%s</div>'
        '<div class="s2-back">'
        '<div class="h3" style="text-align:center">miễn cưỡng</div>'
        '<div class="sm soft"><i>adjective</i> &nbsp;Not wanting to take some action; unwilling to do something.</div>'
        '<div class="row sm" style="gap:8px">%s<div><div>She was reluctant to lend him the money.</div><div class="soft">Cô ấy miễn cưỡng cho anh ta vay tiền.</div></div></div>'
        '</div></div>'
    ) % (chip('Mới', 'success'), chip('B1.2', 'xp'), chip('Nhận diện'),
         say_btn('US', '/ɹɪˈlʌktənt/'), say_btn('UK', '/ɹɪˈlʌktənt/'),
         choice(1, 'háo hức', 'dim'), choice(2, 'miễn cưỡng', 'right'), choice(3, 'nhút nhát', 'dim'), choice(4, 'tức giận', 'dim'),
         '<button class="btn btn--icon">%s</button>' % icon('volume'))
    body = ('<div class="s2-mid">' + top(35, 'Còn 12 thẻ') + card + rates(3) +
            foot('Tự chấm mức nhớ: 1 Quên · 2 Khó · 3 Được · 4 Dễ — Enter: chọn mức gợi ý · U: hoàn tác') + '</div>')
    page('review', body, name, 'Ôn tập: sau khi trả lời', dark=dark)

def review_cloze():
    slots = '<span class="s2-slots"><span class="s2-slot">d</span><span class="s2-slot">e</span>%s</span>' % ('<span class="s2-slot"></span>' * 6)
    card = (
        '<div class="card col" style="padding:24px;gap:16px">'
        '<div class="s2-center"><div class="row" style="gap:8px">%s%s</div>'
        '<div class="s2-prompt">Điền từ còn thiếu vào chỗ trống:</div>'
        '<div style="font-size:26px;font-weight:600;line-height:1.5">We must finish it before the%s.</div>'
        '<div class="soft">Chúng ta phải làm xong trước thời hạn.</div>'
        '%s'
        '<div class="row" style="gap:8px;margin-top:4px">%s%s</div></div>'
        '<div class="row" style="gap:8px"><div class="input s2-field ph">Gõ đáp án…</div>%s</div>'
        '</div>'
    ) % (chip('B1.1', 'xp'), chip('Điền từ'), slots,
         chip('Nghĩa của từ cần điền: hạn chót · 8 chữ cái', 'primary'),
         btn('Nghe câu', '', 'volume'), btn('Gợi ý thêm 1 chữ'), btn('Kiểm tra', 'primary'))
    body = ('<div class="s2-mid">' + top(50, 'Còn 9 thẻ') + card +
            foot('Gõ đáp án rồi Enter · Space/Enter sau đó: chuyển thẻ', btn('Không nhớ — xem đáp án', 'ghost')) + '</div>')
    page('review', body, 'S2ReviewCloze', 'Ôn tập: điền từ')

def review_listen():
    card = (
        '<div class="card col" style="padding:24px;gap:16px">'
        '<div class="s2-center"><div class="row" style="gap:8px">%s%s</div>'
        '<div class="s2-prompt">Nghe và gõ lại từ bạn nghe được:</div>'
        '<div class="row" style="gap:8px">%s%s</div></div>'
        '<div class="input s2-field" style="flex:none">apointment</div>'
        '<div class="s2-note warn">%s<span>Gần đúng — chú ý chính tả: <b>appointment</b></span></div>'
        '<div class="s2-back"><div class="row" style="justify-content:center;gap:8px"><span class="h3">appointment</span>'
        '<button class="btn btn--icon">%s</button><span class="ipa soft">/əˈpɔɪnt.mɛnt/</span></div>'
        '<div style="text-align:center;font-weight:700;font-size:16px">cuộc hẹn</div>'
        '<div class="sm soft" style="text-align:center">I have a dentist appointment at three.</div></div>'
        '</div>'
    ) % (chip('A2.2', 'xp'), chip('Nghe – gõ'), btn('Nghe', '', 'volume'), btn('Chậm'),
         icon('pen'), icon('volume'))
    body = ('<div class="s2-mid">' + top(58, 'Còn 7 thẻ') + card + rates(2, ('10 phút', '1 giờ', '1 ngày', '4 ngày')) +
            foot('Tự chấm mức nhớ: 1 Quên · 2 Khó · 3 Được · 4 Dễ — Enter: chọn mức gợi ý · U: hoàn tác') + '</div>')
    page('review', body, 'S2ReviewListen', 'Ôn tập: nghe gõ, gần đúng')

def review_done():
    body = ('<div class="s2-mid"><div class="card s2-center" style="padding:40px;gap:12px">'
            '<div class="s2-big ok">%s</div><div class="h2">Xong rồi!</div>'
            '<div class="soft">Bạn đã ôn hết thẻ đến hạn. Phiên này: 18 thẻ.</div>'
            '<div class="row" style="margin-top:12px">%s%s</div></div></div>'
            ) % (icon('check'), btn('Về trang chủ', 'primary'), btn('Hoàn tác', 'ghost', 'back'))
    page('review', body, 'S2ReviewDone', 'Ôn tập: đã xong')

# ---------- Nói ----------

def speak_shell(panel, name, title, lemma=None):
    hd = ('<div class="card row" style="justify-content:space-between;padding:12px 16px">'
            '<div class="row">%s%s</div>'
            '<div class="row" style="gap:8px">%s%s</div></div>') % (
        '<span class="h3">%s</span>' % lemma if lemma else '<span class="h2">weather</span><span class="ipa soft">/ˈwɛðɚ/</span>',
        chip('A2.2', 'xp') if lemma else chip('A1.2', 'xp'), chip('Nhận diện'), chip('Còn 12 thẻ'))
    body = '<div class="s2-mid">' + hd + panel + rates(None) + '<div class="row" style="justify-content:center">%s</div></div>' % btn('Đóng phần nói', 'ghost', 'x')
    page('review', body, name, title)

def speak_phoneme():
    ph = lambda s, cls, heard='': '<span class="s2-ph ipa %s">/%s/%s</span>' % (cls, s, ' <small>→ /%s/</small>' % heard if heard else '')
    panel = (
        '<div class="card col" style="gap:12px">'
        '<div class="row" style="justify-content:center">%s%s</div>'
        '<div class="row s2-back" style="flex-direction:row;gap:8px;margin-top:4px"><span class="h3" style="color:var(--warning)">Khá tốt!</span><span class="soft">· 75%% chính xác</span>'
        '<span style="margin-left:auto">%s</span></div>'
        '<div class="row" style="gap:8px">%s%s%s%s</div>'
        '<div class="soft sm ipa">Âm chuẩn: /w ɛ ð ɚ/ · Bạn nói: /w ɛ d ɚ/</div>'
        '<div class="s2-ctx"><b class="ipa">/ð/</b> Như /θ/ (đầu lưỡi giữa hai hàm răng) nhưng có rung dây thanh. Đừng đọc thành "d" hay "z".</div>'
        '<div class="soft xs">Điểm chỉ mang tính tham khảo (nhận dạng tự động có thể sai).</div>'
        '</div>'
    ) % (btn('Nghe mẫu', '', 'volume'), btn('Bấm để nói', 'primary', 'mic'), btn('Nói lại', '', 'repeat'),
         ph('w', 'ok'), ph('ɛ', 'ok'), ph('ð', 'wrong', 'd'), ph('ɚ', 'ok'))
    speak_shell(panel, 'S2PracticeSpeak', 'Luyện nói: chấm theo âm')

def speak_words():
    w = lambda s, c='ok', h='': '<span class="s2-ph %s">%s%s</span>' % (c, s, ' <small>(%s)</small>' % h if h else '')
    panel = (
        '<div class="card col" style="gap:12px">'
        '<div class="row" style="justify-content:center">%s%s</div>'
        '<div class="row s2-back" style="flex-direction:row;gap:8px;margin-top:4px"><span class="h3" style="color:var(--success)">Tuyệt vời!</span><span class="soft">· 88%% chính xác</span><span style="margin-left:auto">%s</span></div>'
        '<div class="s2-chips">%s</div>'
        '<div class="soft sm">Mình nghe được: “Could you send me a report by Friday” · Tốc độ 118 từ/phút · 1 lần ngập ngừng lâu</div>'
        '<div class="s2-note warn" style="align-items:center"><span class="grow">Muốn biết chính xác âm nào sai? Tải model chấm âm (339 MB).</span>%s</div>'
        '<div class="soft xs">Điểm chỉ mang tính tham khảo (nhận dạng tự động có thể sai).</div>'
        '</div>'
    ) % (btn('Nghe mẫu', '', 'volume'), btn('Bấm để nói', 'primary', 'mic'), btn('Nói lại', '', 'repeat'),
         ''.join([w('Could'), w('you'), w('send'), w('me'), w('the', 'wrong', 'a'), w('report'), w('by'), w('Friday')]),
         btn('Tải model (339 MB)'))
    speak_shell(panel, 'S2PracticeSpeakWords', 'Luyện nói: chấm theo từ', 'Could you send me the report by Friday?')

def speak_setup():
    panel = ('<div class="card s2-center" style="padding:32px;gap:12px">'
             '<div class="s2-big info">%s</div>'
             '<div style="max-width:440px">Cần tải model nhận dạng giọng nói (~76 MB, chạy offline trên máy bạn) để chấm bài nói.</div>'
             '<div style="width:320px" class="col"><div>%s</div><div class="row xs soft" style="justify-content:space-between"><span>Đang tải… 46%%</span></div></div>'
             '%s</div>') % (icon('mic'), bar(46), btn('Huỷ'))
    speak_shell(panel, 'S2PracticeSpeakSetup', 'Luyện nói: cần tải model')

# ---------- Luyện tập ----------

def practice_body(pct, idx, kind, card, action):
    return head('Luyện tập', 'Bài %d/10 · %s' % (idx, kind), pct, card, '<div class="row" style="justify-content:center">%s</div>' % btn(action, 'primary'))

def practice_menu(empty, name, title):
    modes = [('star', 'Trộn các dạng', 'Đủ năm dạng bài trong một phiên'),
             ('pen', 'Điền từ vào chỗ trống', 'Chọn từ điền vào chỗ trống'),
             ('list', 'Sắp xếp câu', 'Bấm các từ theo đúng thứ tự để ghép câu'),
             ('headphones', 'Nghe, chọn nghĩa', 'Nghe câu rồi chọn nghĩa tiếng Việt đúng'),
             ('volume', 'Nghe chép', 'Nghe và gõ lại câu'),
             ('copy', 'Ghép từ với nghĩa', 'Bấm một từ, rồi bấm nghĩa tương ứng')]
    tiles = ''.join('<div class="s2-tile%s"><div class="s2-badge">%s</div><div style="font-weight:700;font-size:16px">%s</div><div class="soft sm">%s</div></div>'
                    % (' first' if i == 0 else '', icon(ic), l, d) for i, (ic, l, d) in enumerate(modes))
    warn = '<div class="s2-note warn">%s<span>Chưa đủ dữ liệu để tạo bài (cần gói từ điển).</span></div>' % icon('book') if empty else ''
    body = ('<div class="h2">Luyện tập</div>'
            '<div class="soft">Mỗi phiên 10 bài, lấy từ câu thật (Tatoeba) và từ vựng đúng trình độ của bạn. Xong phiên được thưởng XP.</div>'
            + warn + '<div class="s2-tiles">%s</div>' % tiles)
    page('', body, name, title)

def practice_order():
    toks = ['Could', 'you', 'me', 'the', 'report', 'send', 'by', 'Friday']
    placed = ['Could', 'you', 'send', 'me']
    line = ''.join('<span class="s2-tok placed">%s</span>' % t for t in placed)
    pool = ''.join('<span class="s2-tok%s">%s</span>' % (' used' if t in placed else '', t) for t in toks)
    card = ('<div class="card col" style="padding:24px;gap:16px">'
            '<div class="s2-prompt">Bấm các từ theo đúng thứ tự để ghép thành câu tiếng Anh:</div>'
            '<div style="font-size:20px;font-weight:700">Bạn gửi báo cáo cho tôi trước thứ Sáu được không?</div>'
            '<div class="s2-line">%s</div><div class="s2-pool">%s</div></div>') % (line, pool)
    body = practice_body(30, 4, 'Sắp xếp câu', card, 'Kiểm tra')
    page('', body, 'S2Practice', 'Luyện tập: sắp xếp câu')

def practice_cloze():
    card = ('<div class="card col" style="padding:24px;gap:16px">'
            '<div class="s2-prompt">Chọn từ điền vào chỗ trống:</div>'
            '<div style="font-size:20px;font-weight:700">I\'m afraid I can\'t ___ the meeting.</div>'
            '<div class="soft">Tôi e là tôi không dự họp được.</div>'
            '<div class="s2-choices">%s%s%s%s</div>'
            '<div class="s2-note bad">%s<span><b>Chưa đúng — đáp án:</b> <span class="plain">I\'m afraid I can\'t attend the meeting.</span></span></div></div>'
            ) % (choice(1, 'join in', 'wrong'), choice(2, 'attend', 'right'), choice(3, 'visit', 'dim'), choice(4, 'watch', 'dim'), icon('x'))
    body = practice_body(50, 6, 'Điền từ vào chỗ trống', card, 'Bài tiếp')
    page('', body, 'S2PracticeCloze', 'Luyện tập: điền từ, sai')

def practice_dictation():
    card = ('<div class="card col" style="padding:24px;gap:16px">'
            '<div class="s2-prompt">Nghe và gõ lại câu (7 từ):</div>'
            '<div class="row" style="gap:8px">%s%s</div>'
            '<div class="input s2-field" style="flex:none">Let\'s get started when you ready.</div>'
            '<div class="s2-note bad">%s<span class="grow"><b>Chưa đúng — đáp án:</b><br><span class="plain">Let\'s get started when you are ready.</span></span>%s</div></div>'
            ) % (btn('Nghe', '', 'volume'), btn('Chậm'), icon('x'), chip('đúng 86% số từ'))
    body = practice_body(70, 8, 'Nghe chép', card, 'Bài tiếp')
    page('', body, 'S2PracticeDictation', 'Luyện tập: nghe chép')

def practice_match():
    rows = [('deadline', 'active', '', 'cuộc hẹn', '', 1), ('appointment', 'linked', '1', 'lịch trình', 'linked', 2),
            ('schedule', 'linked', '2', 'hạn chót', '', 3), ('convenient', '', '', 'thuận tiện', '', 4)]
    cells = ''
    for l, lc, badge, r, rc, n in rows:
        cells += '<div class="s2-pair %s">%s%s</div>' % (lc, l, '<span class="s2-kbd">%s</span>' % badge if badge else '')
        cells += '<div class="s2-pair %s"><span class="s2-kbd l">%d</span>%s</div>' % ('linked' if n in (1, 2) else '', n, r)
    card = ('<div class="card col" style="padding:24px;gap:16px"><div class="s2-prompt">Bấm một từ bên trái, rồi bấm nghĩa tương ứng bên phải:</div>'
            '<div class="s2-pairs">%s</div></div>') % cells
    body = practice_body(90, 10, 'Ghép từ với nghĩa', card, 'Kiểm tra')
    page('', body, 'S2PracticeMatch', 'Luyện tập: ghép cặp')

def practice_summary():
    body = ('<div class="s2-mid"><div class="h2">Luyện tập</div><div class="card s2-center" style="padding:40px;gap:12px">'
            '<div class="s2-big ok">%s</div><div class="h2">Hoàn thành phiên luyện tập!</div>'
            '<div class="soft">Bạn làm đúng 8/10 bài.</div>%s'
            '<div style="margin-top:12px">%s</div></div></div>') % (icon('award'), chip('+20 XP · +5 xu', 'xp'), btn('Luyện tiếp', 'primary'))
    page('', body, 'S2PracticeSummary', 'Luyện tập: kết quả')

# ---------- Sổ từ ----------

WORDS = [
    ('reluctant', 'B1.2', '', 'miễn cưỡng', ('Mới', ''), 'Đến hạn', '', False),
    ('deadline', 'B1.1', '+3', 'hạn chót', ('Đang học', 'warning'), 'Ôn lại sau 3 giờ', '', False),
    ("I'll get back to you as soon as possible.", 'B1.1', 'Mẫu câu', 'Tôi sẽ phản hồi bạn sớm nhất có thể.', ('Ôn dài hạn', 'success'), 'Ôn lại sau 12 ngày', '', False),
    ('ambitious', 'B1.2', '+2', 'có hoài bão; có tham vọng', ('Học lại', 'warning'), 'Đến hạn', 'Quên 4 lần', False),
    ('appointment', 'A2.2', '+3', 'cuộc hẹn', ('Ôn dài hạn', 'success'), 'Ôn lại sau 21 ngày', '', False),
    ('schedule', 'A2.2', '', 'lịch trình; lên lịch', ('Ôn dài hạn', 'success'), 'Đang tạm dừng', 'Quên 1 lần', True),
    ('convenient', 'B1.1', '+1', 'thuận tiện', ('Đang học', 'warning'), 'Ôn lại sau 10 phút', '', False),
]

def word_row(w):
    lemma, lv, badge, vi, (state, tone), due, lapse, paused = w
    meta = '%s<span class="soft xs" style="margin-top:4px">%s%s</span>' % (chip(state, tone), due, ' · ' + lapse if lapse else '')
    acts = '<button class="btn btn--ghost btn--icon">%s</button><button class="btn btn--ghost btn--icon">%s</button><button class="btn btn--ghost btn--icon">%s</button>' % (
        icon('play' if paused else 'pause'), icon('repeat'), icon('x'))
    return ('<div class="item%s" style="height:68px"><button class="btn btn--icon">%s</button>'
            '<div class="grow"><div class="row" style="gap:8px"><b class="clip" style="font-size:16px">%s</b>%s%s</div><div class="soft sm clip">%s</div></div>'
            '<div class="s2-meta">%s</div><div class="row" style="gap:4px">%s</div></div>'
            ) % (' s2-pause' if paused else '', icon('volume'), lemma, chip(lv, 'xp'), chip(badge) if badge else '', vi, meta, acts)

def word_head(n):
    return ('<div class="row" style="justify-content:space-between"><div class="h2">Sổ từ (%d)</div>'
            '<div class="input" style="width:240px;gap:8px">%s<span class="sm">Tìm trong sổ từ…</span></div></div>') % (n, icon('search'))

def word_filters(counts):
    labels = ['Tất cả', 'Mới', 'Đang học', 'Ôn dài hạn', 'Học lại', 'Tạm dừng', 'Hay quên']
    chips = ''.join(chip('%s <b>%d</b>' % (l, c), 'primary' if i == 0 else '') for i, (l, c) in enumerate(zip(labels, counts)))
    return ('<div class="row" style="justify-content:space-between;gap:8px"><div class="s2-chips" style="gap:4px;flex-wrap:nowrap">%s</div>'
            '<div class="input s2-select"><span class="soft">Sắp xếp</span><b>Mới lưu</b></div></div>') % chips

def words_board(dark, name):
    body = word_head(128) + word_filters([128, 14, 22, 76, 9, 7, 11]) + '<div class="col" style="gap:8px">%s</div>' % ''.join(word_row(w) for w in WORDS)
    page('words', body, name, 'Sổ từ', dark=dark)

def words_empty():
    body = (word_head(0) + word_filters([0] * 7) +
            '<div class="s2-mid"><div class="s2-center" style="gap:12px"><div class="s2-big info">%s</div><div class="h3">Sổ từ trống.</div></div></div>') % icon('bookmark')
    page('words', body, 'S2WordsEmpty', 'Sổ từ trống')

# ---------- Mẫu câu ----------

CATS = ['Chào hỏi', 'Giới thiệu bản thân', 'Nhà hàng & quán cà phê', 'Mua sắm', 'Hỏi đường & phương tiện', 'Khách sạn',
        'Sân bay & chuyến bay', 'Sức khỏe & hiệu thuốc', 'Điện thoại & nhắn tin', 'Công việc & họp', 'Trò chuyện thông thường', 'Khẩn cấp', 'Lịch sự thường dùng']
PHRASES = [
    ("Let's get started.", 'Chúng ta bắt đầu nhé.', '', 'A2', True),
    ('Could you send me the report by Friday?', 'Bạn gửi báo cáo cho tôi trước thứ Sáu được không?', '', 'A2', False),
    ("I'll get back to you as soon as possible.", 'Tôi sẽ phản hồi bạn sớm nhất có thể.', '', 'B1', True),
    ("I'm afraid I can't attend the meeting.", 'Tôi e là tôi không dự họp được.', 'Cách từ chối lịch sự.', 'B1', False),
    ("Let's schedule a meeting for next week.", 'Hãy hẹn một buổi họp vào tuần sau.', '', 'B1', False),
    ('Thank you for your time.', 'Cảm ơn bạn đã dành thời gian.', 'Dùng cuối buổi họp/phỏng vấn.', 'A2', False),
]

def phrase_row(p):
    en, vi, note, lv, saved = p
    return ('<div class="row" style="padding:4px 0;gap:12px"><button class="btn btn--icon">%s</button>'
            '<div class="grow"><div style="font-weight:700">%s</div><div class="soft sm">%s%s</div></div>%s'
            '<button class="btn btn--icon"%s>%s</button></div>'
            ) % (icon('volume'), en, vi, ' <i class="xs">· %s</i>' % note if note else '', chip(lv, 'xp'),
                 ' style="color:var(--success)"' if saved else '', icon('check' if saved else 'bookmark'))

def phrase_top(active, query=None):
    chips = chip('Tất cả', 'primary' if active is None else '') + ''.join(chip(c, 'primary' if c == active else '') for c in CATS)
    q = '<span style="color:var(--ink)">%s</span>' % query if query else 'Tìm mẫu câu…'
    return ('<div><div class="h2">Mẫu câu giao tiếp</div><div class="soft sm" style="margin-top:4px">Các câu thường dùng theo tình huống. Bấm nút loa để nghe, bấm vào câu để sao chép.</div></div>'
            '<div class="input" style="gap:8px;flex:none">%s<span class="sm">%s</span></div><div class="s2-chips">%s</div>') % (icon('search'), q, chips)

def phrases_board():
    body = (phrase_top('Công việc & họp') +
            '<div class="card col" style="gap:4px"><div class="h3" style="margin-bottom:4px">Công việc &amp; họp</div>%s</div>'
            '<div class="s2-toast">%sĐã lưu vào sổ thẻ</div>') % (''.join(phrase_row(p) for p in PHRASES), icon('check'))
    page('phrases', body, 'S2Phrases', 'Mẫu câu giao tiếp')

def phrases_empty():
    body = (phrase_top(None, 'visa application') +
            '<div class="s2-mid"><div class="s2-center" style="gap:12px"><div class="s2-big info">%s</div><div class="h3">Không có mẫu câu phù hợp.</div></div></div>') % icon('search')
    page('phrases', body, 'S2PhrasesEmpty', 'Mẫu câu: không có kết quả')

# ---------- Kiểm tra trình độ ----------

def placement_intro():
    body = ('<div class="s2-mid"><div class="h2">Kiểm tra trình độ</div><div class="card s2-center" style="padding:40px;gap:16px">'
            '<div class="s2-big info">%s</div>'
            '<div style="max-width:520px;font-size:16px">20 câu trắc nghiệm gồm từ vựng, ngữ pháp và đọc hiểu, khó dần nếu bạn trả lời đúng. Không biết thì chọn “Tôi không biết” — đừng đoán bừa nhé!</div>'
            '%s</div></div>') % (icon('award'), btn('Bắt đầu', 'primary'))
    page('', body, 'S2PlacementIntro', 'Kiểm tra trình độ: mở đầu')

def placement_nopack():
    body = ('<div class="s2-mid"><div class="h2">Kiểm tra trình độ</div><div class="card s2-center" style="padding:40px;gap:12px">'
            '<div class="s2-big warn">%s</div><div style="font-size:16px">Chưa cài gói từ điển nên chưa làm bài kiểm tra được.</div></div></div>') % icon('book')
    page('', body, 'S2PlacementNoPack', 'Kiểm tra trình độ: thiếu gói từ điển')

def placement_q():
    card = ('<div class="card col" style="padding:24px;gap:16px">'
            '<div class="s2-passage">The shop opens at nine and closes at six. On Sunday it is closed.</div>'
            '<div class="h3">When can you NOT buy things in the shop?</div>'
            '<div class="s2-choices">%s%s%s<div class="s2-choice idk"><span class="s2-kbd">0</span>Tôi không biết</div></div>'
            '</div>') % (choice(1, 'On Saturday'), choice(2, 'On Sunday'), choice(3, "At nine o'clock"))
    body = head('Kiểm tra trình độ', 'Câu 8/20: đọc đoạn văn rồi trả lời.', 35, card)
    page('', body, 'S2Placement', 'Kiểm tra trình độ: câu hỏi')

def placement_feedback():
    card = ('<div class="card col" style="padding:24px;gap:16px">'
            '<div class="row" style="justify-content:center;gap:12px"><span class="h1">convenient</span><button class="btn btn--icon">%s</button><span class="ipa soft">/kənˈvi.njənt/</span></div>'
            '<div class="s2-choices">%s%s%s<div class="s2-choice idk"><span class="s2-kbd">0</span>Tôi không biết</div></div>'
            '<div class="s2-note bad">%s<span>Chưa đúng — đáp án: thuận tiện</span></div>'
            '</div>') % (icon('volume'), choice(1, 'nguy hiểm', 'wrong'), choice(2, 'thuận tiện', 'right'), choice(3, 'đắt đỏ', 'dim'), icon('x'))
    body = head('Kiểm tra trình độ', 'Câu 12/20: nghĩa của từ này là gì?', 55, card)
    page('', body, 'S2PlacementFeedback', 'Kiểm tra trình độ: phản hồi')

def placement_result():
    skills = [('Từ vựng', 'B1', 3, 3), ('Ngữ pháp', 'B1', 3, 3), ('Đọc hiểu', 'B1', 2, 2), ('Nghe', 'A2', 1, 2)]
    rows = ''.join('<div class="s2-skill"><b>%s</b>%s%s<span class="soft sm">%d/%d</span></div>' % (n, chip(c, 'xp'), bar(100 * a // b, 'success'), a, b) for n, c, a, b in skills)
    card = ('<div class="card col" style="padding:24px;gap:16px">'
            '<div class="s2-center"><div class="h2">Trình độ của bạn: B1</div><div class="soft">Bạn trả lời đúng 9/10 câu. Kitsu đã chọn từ vừa sức với bạn.</div></div>'
            '<div class="s2-note ok" style="align-items:center">%s<span class="grow">Chúc mừng! Bạn đã lên level B1.2</span>%s</div>'
            '<div class="col" style="gap:8px">%s</div>'
            '<div class="row" style="justify-content:center">%s%s</div></div>') % (icon('award'), chip('+60 XP · +30 xu', 'xp'), rows, btn('Bắt đầu học', 'primary'), btn('Làm lại', 'ghost'))
    body = '<div class="s2-mid"><div class="h2">Kiểm tra lên cấp</div>' + card + '</div>'
    page('', body, 'S2PlacementResult', 'Kiểm tra lên cấp: kết quả')

if __name__ == '__main__':
    review_answer(False, 'S2Review')
    review_answer(True, 'S2ReviewDark')
    review_cloze(); review_listen(); review_done()
    speak_phoneme(); speak_words(); speak_setup()
    practice_order()
    practice_menu(False, 'S2PracticeMenu', 'Luyện tập: chọn dạng bài')
    practice_menu(True, 'S2PracticeEmpty', 'Luyện tập: thiếu dữ liệu')
    practice_cloze(); practice_dictation(); practice_match(); practice_summary()
    words_board(False, 'S2Words'); words_board(True, 'S2WordsDark'); words_empty()
    phrases_board(); phrases_empty()
    placement_intro(); placement_nopack(); placement_q(); placement_feedback(); placement_result()
