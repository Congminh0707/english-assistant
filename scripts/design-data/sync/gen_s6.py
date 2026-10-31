# Vòng hoàn thiện S1–S5: sinh các bảng trạng thái còn thiếu (docs/22 §5), xếp vào canvas.json dưới các bảng S, bỏ Main khỏi canvas.
#   BOARD_OUT=<project> PYTHONIOENCODING=utf-8 python gen_s6.py
# Chạy SAU gen_s0…gen_s5 và review/gen_village3.py: S1HomeDone lấy từ bản đồ S1Home do gen_village3 sinh.
# Tên bảng giữ tiền tố phần (S1…S5) để shoot-all.ps1 chụp đúng khổ. Chữ theo vi.json, bỏ emoji và dấu tick; %PET% thay bằng Kitsu như bảng anh em.
# Riêng word-card, reward, translate-hint: lấy từ docs/05, code hiện chỉ có BubbleKind say | stats | quiz.
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from board_kit import *
import gen_s1 as S1
import gen_s2 as S2
import gen_s3 as S3
import gen_s4 as S4
import gen_s5 as S5

NEW = []  # (tên bảng, tiêu đề canvas, rộng)
def reg(name, title, w=1100):
    NEW.append((name, title, w))

# ---------- S1 ----------
def s1_out(fn, name, title, *a, **k):
    fn(*a, name=name, title=title, **k)
    reg(name, title)

def home_done():
    """Hết thẻ: bản đồ giữ nguyên, Giếng làng không còn huy hiệu, chỗ nút chính là lời báo."""
    h = open(os.path.join(OUT, 'S1Home.dc.html'), encoding='utf-8').read()
    h, a = re.subn(r'<g class="next"><circle[^>]*/><text[^>]*>24</text></g>', '', h)
    h, b = re.subn(r'<button class="go">.*?</button>', '<span class="pill">Hôm nay hết thẻ để ôn</span>', h, flags=re.S)
    assert a == 1 and b == 1, 'S1Home đổi cấu trúc'
    h, c = re.subn(r'<path class="trail"[^>]*/>', '', h)
    m = re.search(r'<g transform="translate\(490 150\)"><path d="[^"]*" fill="(#\w+)" stroke="(#\w+)" stroke-width="2"/><text[^>]*fill="(#\w+)">Đình làng', h)
    h, d = re.subn(r'(<g transform="translate\(226 500\)"><path d="[^"]*" )fill="#\w+" stroke="#\w+"( stroke-width="2"/><text[^>]*)fill="#\w+">Giếng làng',
                   lambda x: '%sfill="%s" stroke="%s"%sfill="%s">Giếng làng' % (x.group(1), m.group(1), m.group(2), x.group(2), m.group(3)), h)
    assert c == 1 and d == 1, 'S1Home đổi cấu trúc'
    h = h.replace('<title>Trang chủ, bản đồ làng</title>', '<title>Trang chủ: hết thẻ</title>')
    open(os.path.join(OUT, 'S1HomeDone.dc.html'), 'w', encoding='utf-8').write(h)
    reg('S1HomeDone', 'Trang chủ: hết thẻ')

TF_NOTE = 'Sau did, động từ chính về nguyên mẫu.'
def ex_tf():
    q = '<p class="s1-ins">Câu sau đúng hay sai?</p><p class="s1-prompt">“Did he went to school?” is a correct sentence.</p>'
    s1_out(S1.ex_frame, 'S1ExercisesTf', 'Bài tập: đúng hay sai', 2, q + S1.choices(['Đúng', 'Sai'], picked=1), btn('Kiểm tra', 'primary'), hint='Phím 1–2 để chọn · Enter để kiểm tra')
    fb = ('<div class="s1-fb ok"><div class="row">%sChính xác!</div><div class="row sm" style="color:var(--ink);font-weight:400;margin-top:4px">%s%s</div></div>') % (
        icon('check'), icon('lightbulb', style='color:var(--warning)'), TF_NOTE)
    s1_out(S1.ex_frame, 'S1ExercisesTfDone', 'Bài tập: đúng hay sai, đã chấm', 2, q + S1.choices(['Đúng', 'Sai'], good=1) + fb, btn('Câu tiếp', 'primary'), hint='Enter để sang câu tiếp')
    q2 = '<p class="s1-ins">Câu sau đúng, sai hay bài đọc không nói đến?</p><p class="s1-prompt">Teenagers sleep better in a cold room.</p>'
    s1_out(S1.ex_frame, 'S1ExercisesTfNg', 'Bài tập: đúng, sai, không có thông tin', 4, q2 + S1.choices(['Đúng', 'Sai', 'Không có thông tin'], picked=2), btn('Kiểm tra', 'primary'), hint='Phím 1–3 để chọn · Enter để kiểm tra')
    p = os.path.join(OUT, 'S1ExercisesTfNg.dc.html')  # dạng này chỉ có ở bài đọc
    h = open(p, encoding='utf-8').read().replace('Thì quá khứ đơn', 'Giấc ngủ quan trọng thế nào')
    open(p, 'w', encoding='utf-8').write(h)

SPK_Q = '<p class="s1-ins">Bấm micro và đọc to câu này.</p><p class="s1-prompt">She didn\'t buy that bag.</p>'
OFF_CHECK = '<button class="btn"%s>Kiểm tra</button>' % S1.DISABLED
def ex_speak_states():
    setup = ('<div class="col" style="gap:8px;align-items:center;text-align:center;padding:8px 0"><div style="max-width:440px">Cần tải model nhận dạng giọng nói (~76 MB, chạy offline trên máy bạn) để chấm bài nói.</div>'
             '<div style="width:320px" class="col"><div>%s</div><div class="xs soft">Đang tải… 46%%</div></div>%s</div>') % (bar(46), btn('Huỷ'))
    s1_out(S1.ex_frame, 'S1ExercisesSpeakSetup', 'Bài tập nói: đang tải model', 9, SPK_Q + setup, btn('Bỏ qua câu này', 'ghost') + OFF_CHECK, hint='Có thể bỏ qua câu nói')
    err = ('<div class="col" style="gap:8px;align-items:center;text-align:center;padding:8px 0"><div style="max-width:440px">Cần tải model nhận dạng giọng nói (~76 MB, chạy offline trên máy bạn) để chấm bài nói.</div>%s'
           '<div class="sm" style="color:var(--danger);font-weight:600">Không tải được model (kiểm tra kết nối mạng rồi thử lại).</div></div>') % btn('Tải model (76 MB)', 'primary', 'download')
    s1_out(S1.ex_frame, 'S1ExercisesSpeakError', 'Bài tập nói: lỗi tải model', 9, SPK_Q + err, btn('Bỏ qua câu này', 'ghost') + OFF_CHECK, hint='Có thể bỏ qua câu nói')
    fail = ('<div class="row" style="gap:8px">%s%s</div><div class="s1-fb"><div class="row">%sKhông nhận dạng được giọng nói. Hãy thử lại.</div></div>') % (btn('Nghe mẫu', '', 'volume'), btn('Bấm để nói', 'primary', 'mic'), icon('alert'))
    s1_out(S1.ex_frame, 'S1ExercisesSpeakFail', 'Bài tập nói: không chấm được', 9, SPK_Q + fail, btn('Bỏ qua câu này', 'ghost') + OFF_CHECK, hint='Nói xong rồi bấm Kiểm tra')

# ---------- S2 ----------
def s2(name, title, active, body, dark=False):
    S2.page(active, body, name, title, dark=dark)
    reg(name, title)

def review_vi_en():
    card = ('<div class="card col" style="padding:24px;gap:16px"><div class="s2-center"><div class="row" style="gap:8px">%s%s</div>'
            '<div class="s2-prompt">Gõ từ tiếng Anh có nghĩa này:</div><div class="h1">cuộc hẹn</div><span class="soft sm"><i>noun</i></span></div>'
            '<div class="row" style="gap:8px"><div class="input s2-field ph">Gõ đáp án…</div>%s</div></div>') % (chip('A2.2', 'xp'), chip('Việt → Anh'), btn('Kiểm tra', 'primary'))
    s2('S2ReviewViEn', 'Ôn tập: thẻ Việt → Anh', 'review', '<div class="s2-mid">' + S2.top(42, 'Còn 10 thẻ') + card + S2.foot('Gõ đáp án rồi Enter · Space/Enter sau đó: chuyển thẻ', btn('Không nhớ — xem đáp án', 'ghost')) + '</div>')

def review_flip():
    card = ('<div class="card col" style="padding:24px;gap:16px"><div class="s2-center"><div class="row" style="gap:8px">%s%s</div>'
            '<div class="h1" style="font-size:40px">deadline</div><div class="row" style="gap:8px">%s%s<span class="soft sm"><i>noun</i></span></div></div>'
            '<div class="s2-ctx"><span class="soft">Câu bạn đã lưu:</span> We must finish it before the <span class="s2-mark">deadline</span>.</div></div>') % (
        chip('B1.1', 'xp'), chip('Nhận diện'), S2.say_btn('US', '/ˈdɛdˌlaɪn/'), S2.say_btn('UK', '/ˈdɛdlaɪn/'))
    show = '<div class="row" style="justify-content:center">%s</div>' % btn('Hiện đáp án', 'primary')
    s2('S2ReviewFlip', 'Ôn tập: thẻ lật', 'review', '<div class="s2-mid">' + S2.top(46, 'Còn 9 thẻ') + card + show + S2.foot('Space: xem đáp án') + '</div>')

def speak(name, title, panel):
    S2.speak_shell(panel, name, title)
    reg(name, title)

def speak_states():
    rec = ('<div class="card col" style="gap:12px"><div class="row" style="justify-content:center">%s%s</div>'
           '<div class="col" style="gap:4px;align-items:center" role="status"><div style="width:320px">%s</div><span class="sm" style="color:var(--danger);font-weight:600">Đang nghe… 3 giây</span></div></div>') % (
        '<button class="btn"%s>%sNghe mẫu</button>' % (S1.DISABLED, icon('volume')), btn('Dừng', 'danger', 'stop'), bar(64, 'danger'))
    speak('S2PracticeSpeakRec', 'Luyện nói: đang ghi âm', rec)
    err = ('<div class="card col" style="gap:12px"><div class="row" style="justify-content:center">%s%s</div>'
           '<div class="s2-note bad">%s<span>Chưa có quyền dùng micro. Bật micro cho ứng dụng ở Cài đặt Windows → Quyền riêng tư → Micro.</span></div></div>') % (
        btn('Nghe mẫu', '', 'volume'), btn('Bấm để nói', 'primary', 'mic'), icon('mic-off'))
    speak('S2PracticeSpeakMicError', 'Luyện nói: lỗi micro', err)

def practice_listen():
    one = ('<div class="s2-choices" style="grid-template-columns:1fr">%s%s<div class="s2-choice" style="border-color:var(--primary);background:var(--primarySoft);color:var(--primary)"><span class="s2-kbd">3</span>Hãy hẹn một buổi họp vào tuần sau.</div>%s</div>') % (
        S2.choice(1, 'Tôi e là tôi không dự họp được.'), S2.choice(2, 'Cảm ơn bạn đã dành thời gian.'), S2.choice(4, 'Chúng ta bắt đầu nhé.'))
    card = ('<div class="card col" style="padding:24px;gap:16px"><div class="s2-prompt">Nghe câu tiếng Anh rồi chọn nghĩa tiếng Việt đúng:</div>'
            '<div class="row" style="gap:8px">%s%s</div>%s</div>') % (btn('Nghe', '', 'volume'), btn('Chậm', '', 'turtle'), one)
    s2('S2PracticeListen', 'Luyện tập: nghe, chọn nghĩa', '', S2.practice_body(60, 7, 'Nghe, chọn nghĩa', card, 'Kiểm tra'))

def practice_noreward():
    body = ('<div class="s2-mid"><div class="h2">Luyện tập</div><div class="card s2-center" style="padding:40px;gap:12px">'
            '<div class="s2-big ok">%s</div><div class="h2">Hoàn thành phiên luyện tập!</div><div class="soft">Bạn làm đúng 9/10 bài.</div>'
            '<div class="soft sm" style="max-width:440px">Hôm nay bạn đã nhận đủ thưởng luyện tập (5 phiên) — vẫn luyện thoải mái nhé!</div>'
            '<div style="margin-top:12px">%s</div></div></div>') % (icon('award'), btn('Luyện tiếp', 'primary'))
    s2('S2PracticeSummaryNoReward', 'Luyện tập: hết lượt thưởng', '', body)

def words_nomatch():
    head = ('<div class="row" style="justify-content:space-between"><div class="h2">Sổ từ (128)</div>'
            '<div class="input" style="width:240px;gap:8px;color:var(--ink)">%s<span class="sm">kitchen</span></div></div>') % icon('search')
    flt = S2.word_filters([128, 14, 22, 76, 9, 0, 11])
    flt = flt.replace('chip chip--primary', 'chip').replace('<span class="chip">Tạm dừng', '<span class="chip chip--primary">Tạm dừng')
    body = head + flt + '<div class="s2-mid"><div class="s2-center" style="gap:12px"><div class="s2-big info">%s</div><div class="h3">Không có từ nào khớp bộ lọc.</div></div></div>' % icon('search')
    s2('S2WordsNoMatch', 'Sổ từ: bộ lọc không khớp', 'words', body)

def placement_states():
    body = ('<div class="s2-mid"><div class="h2">Kiểm tra lên cấp</div><div class="card s2-center" style="padding:40px;gap:16px"><div class="s2-big info">%s</div>'
            '<div style="max-width:520px;font-size:16px">10 câu ở bậc kế tiếp (từ vựng, ngữ pháp, đọc, nghe). Đúng từ 80%% là lên một bậc — lần đầu qua mỗi bậc có thưởng. Không đạt cũng không sao, bạn có thể thử lại sau.</div>%s</div></div>') % (icon('award'), btn('Bắt đầu', 'primary'))
    s2('S2PlacementCheckIntro', 'Kiểm tra lên cấp: mở đầu', '', body)
    skills = [('Từ vựng', 'B1', 2, 3), ('Ngữ pháp', 'A2', 1, 3), ('Đọc hiểu', 'B1', 1, 2), ('Nghe', 'A2', 1, 2)]
    rows = ''.join('<div class="s2-skill"><b>%s</b>%s%s<span class="soft sm">%d/%d</span></div>' % (n, chip(c, 'xp'), bar(100 * a // b, 'warning'), a, b) for n, c, a, b in skills)
    card = ('<div class="card col" style="padding:24px;gap:16px"><div class="s2-center"><div class="h2">Trình độ của bạn: A2</div><div class="soft">Bạn trả lời đúng 5/10 câu. Kitsu đã chọn từ vừa sức với bạn.</div></div>'
            '<div class="s2-note warn" style="align-items:center">%s<span class="grow">Chưa đạt (80%% mới qua). Ôn thêm rồi thử lại nhé!</span></div><div class="col" style="gap:8px">%s</div>'
            '<div class="row" style="justify-content:center">%s%s</div></div>') % (icon('repeat'), rows, btn('Bắt đầu học', 'primary'), btn('Làm lại', 'ghost'))
    s2('S2PlacementResultFail', 'Kiểm tra lên cấp: chưa đạt', '', '<div class="s2-mid"><div class="h2">Kiểm tra lên cấp</div>' + card + '</div>')
    idk = '<div class="s2-choice idk"><span class="s2-kbd">0</span>Tôi không biết</div>'
    listen = ('<div class="card col" style="padding:24px;gap:16px"><div class="row" style="gap:8px">%s%s</div><div class="h3">What time does the train leave?</div>'
              '<div class="s2-choices">%s%s%s%s</div></div>') % (btn('Nghe', '', 'volume'), btn('Chậm', '', 'turtle'), S2.choice(1, 'At seven'), S2.choice(2, 'At eight'), S2.choice(3, 'At nine'), idk)
    s2('S2PlacementListen', 'Kiểm tra trình độ: câu nghe', '', S2.head('Kiểm tra trình độ', 'Câu 15/20: nghe rồi chọn đáp án đúng.', 70, listen))
    gram = ('<div class="card col" style="padding:24px;gap:16px"><div class="h3">She ___ to school by bus every day.</div><div class="s2-choices">%s%s%s%s</div></div>') % (
        S2.choice(1, 'go'), S2.choice(2, 'goes'), S2.choice(3, 'going'), idk)
    s2('S2PlacementGrammar', 'Kiểm tra trình độ: câu ngữ pháp', '', S2.head('Kiểm tra trình độ', 'Câu 6/20: chọn đáp án đúng để điền vào chỗ trống.', 25, gram))

# ---------- S3 ----------
def s3(name, title, html):
    S3.W(name, html, title)
    reg(name, title)

ERR = '<div class="xs" style="color:var(--danger)">%s</div>'
def rad_on(tail=''):
    return '<div class="set"><span class="row" style="gap:8px"><span class="rad on"></span>Giọng tự nhiên (Kokoro, offline)</span>%s</div>' % tail

def dl(text, pct, cancel='Huỷ'):
    return '<div class="set" style="padding:8px 0"><div style="flex:1;min-width:0"><div class="xs soft" style="margin-bottom:4px">%s</div>%s</div>%s</div>' % (text, bar(pct), btn(cancel))

def need(text, err, label):
    return '<div class="set" style="padding:8px 0"><div style="flex:1;min-width:0"><div class="xs soft">%s</div>%s</div>%s</div>' % (text, ERR % err if err else '', btn(label))

def s3_states():
    s3('S3PetDark', 'Thú cưng (tối)', S3.pet_page(True))
    s3('S3SettingsDark', 'Cài đặt hồ sơ (tối)', S3.set_profile(True))
    s3('S3ParentDark', 'Báo cáo phụ huynh (tối)', S3.parent(True))
    s3('S3SettingsVoiceLoading', 'Cài đặt giọng: đang tải', S3.set_voice(
        rad_on() + dl('Đang tải… 40/88 MB', 45),
        dl('Đang tải… 31/76 MB', 41)))
    s3('S3SettingsVoiceError', 'Cài đặt giọng: lỗi tải', S3.set_voice(
        rad_on() + need('Giọng tự nhiên cần tải model một lần (88 MB, miễn phí, chạy hoàn toàn trên máy bạn).', 'Không tải được model (kiểm tra kết nối mạng rồi thử lại).', 'Thử lại')
        + '<div class="xs soft" style="padding-bottom:8px">Chưa tải model nên đang dùng giọng Windows.</div>',
        need('Cần tải model Whisper base.en (~76 MB) để chấm bài nói.', 'File model tải về bị hỏng, hãy thử tải lại.', 'Thử lại')))
    off = '<button class="btn dis">Kiểm tra cập nhật</button>'
    s3('S3SettingsAppLoading', 'Cài đặt ứng dụng: đang tải bản mới', S3.set_app(
        '<div class="set" style="padding:8px 0"><div style="flex:1;min-width:0"><div class="sm" style="margin-bottom:4px"><b>Đang tải 1.7.0… 42%%</b></div>%s</div>%s</div>' % (bar(42), off)))
    s3('S3SettingsAppError', 'Cài đặt ứng dụng: lỗi cập nhật', S3.set_app(
        '<div class="set" style="padding:8px 0"><div style="flex:1;min-width:0"><div class="sm"><b>Không kiểm tra/tải được bản mới.</b></div>%s</div>%s</div>' % (ERR % 'Cập nhật không thành công, thử lại sau nhé.', btn('Kiểm tra cập nhật'))))

# ---------- S4 ----------
EDGE_CSS = """
.spot.edge{left:0;right:auto;align-items:flex-start}
.spot.edge .bub:after{right:auto;left:42px}
.winbox{position:absolute;left:0;bottom:28px;width:280px;top:12px;border:1px dashed var(--inkSoft);border-left:0;border-radius:0 var(--r-md) var(--r-md) 0}
.cap.r{left:auto;right:12px}
"""
def s4bubbles(dark):
    card = S4.stack(S4.qword('meticulous', '/məˈtɪkjələs/') + '<p class="sm" style="font-weight:600">tỉ mỉ; cẩn thận từng chi tiết</p>'
                    + '<div class="row" style="gap:8px;justify-content:flex-end">' + S4.b('Lưu', 'primary', 'bookmark') + S4.iconbtn('x', 'ghost') + '</div>')
    reward = '<div class="row" style="gap:8px">%s%s</div>' % (chip('+20 XP', 'xp'), chip('+1 Cơm nắm', 'warning'))
    hint = '<div class="row" style="gap:8px"><p class="sm" style="flex:1">Dịch đoạn vừa copy?</p>%s</div>' % S4.b('Dịch', 'primary', 'languages')
    edge = ('<div class="winbox" aria-hidden="true"></div>'
            '<div class="spot edge"><div class="bub" style="width:256px"><p class="sm">Hihi, chào buổi sáng! Hôm nay học 5 phút nhé?</p></div>%s</div>') % S4.fox(96, 'open')
    cells = [S4.desk(S4.cap('Thẻ từ', '15 giây, rê chuột vào thì giữ', 200) + S4.spot('open', card, 316)),
             S4.desk(S4.cap('Phần thưởng', 'Tự đóng 3 giây', 200) + S4.spot('happy', reward, 208)),
             S4.desk(S4.cap('Gợi ý dịch', 'Tự đóng 5 giây', 200) + S4.spot('open', hint, 272)),
             S4.desk(edge + '<div class="cap r" style="width:200px"><b>Mép trái màn hình</b><span>Bong bóng dịch vào trong, đuôi vẫn chỉ mascot, không ra ngoài cửa sổ 360×440</span></div>')]
    body = ('<div class="t%s" style="width:1100px;height:720px;padding:24px;overflow:hidden">%s'
            '<div style="height:100%%;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px">%s</div></div>') % (' dark' if dark else '', S4.DEFS, ''.join(cells))
    name, title = ('S4BubblesDark', 'Bong bóng mascot (tối)') if dark else ('S4Bubbles', 'Bong bóng mascot')
    write(name, body, 1100, 720, title=title, css=S4.CSS4 + EDGE_CSS)
    reg(name, title)

# ---------- S5 ----------
def kid(name, title, body, sc='meadow', dark=False):
    S5.board(name, title, body, sc, dark)
    reg(name, title, 1280)

def kitsu_at(w, left=24, bottom=16):
    return '<div style="position:absolute;left:%dpx;bottom:%dpx;z-index:2">%s</div>' % (left, bottom, S5.kitsu(w))

def s5_states():
    k = S5
    mic = '<div style="position:absolute;right:32px;bottom:28px;z-index:2">%s</div>' % k.round_btn('mic', 'Nói thử', 72)
    kid('S5KidsLearnSounds', 'Bé: âm của chữ', k.topbar(k.HOME, k.count(1, 6)) + '<div class="stage">' + k.nav(1, 6,
        '<div class="kbig" style="width:760px;height:440px;flex-direction:row;gap:48px;padding:24px 32px"><span style="position:absolute;top:16px;right:16px">%s</span>'
        '<span class="kf" style="font-size:160px;line-height:1">s</span><span style="display:flex;flex-direction:column;align-items:center;gap:8px">%s<span class="kf" style="font-size:40px;color:var(--primary)">sun</span></span></div>' % (k.speaker(80), k.pic('sun', 240)), False)
        + '</div>' + kitsu_at(180) + mic)
    kid('S5KidsLearnSight', 'Bé: từ nhìn là nhớ', k.topbar(k.HOME, k.count(3, 6)) + '<div class="stage">' + k.nav(3, 6,
        '<div class="kbig" style="width:760px;height:440px"><span style="position:absolute;top:16px;right:16px">%s</span><span class="kf" style="font-size:160px;line-height:1">the</span></div>' % k.speaker(80))
        + '</div>' + kitsu_at(180))
    wrong = k.bubble('Try again!').replace('class="bubble kf"', 'class="bubble l kf"')
    kid('S5KidsLearnQuizPic', 'Bé: đố bằng hình', k.topbar(k.HOME, k.count(4, 6)) + '<div class="stage" style="gap:32px"><div class="row" style="gap:24px">%s%s</div>%s</div>' % (
        k.speaker(112), wrong, k.choices([('pig', ' soft shake', False), ('sun', '', False), ('apple', '', False)])) + kitsu_at(160))
    grade = k.plate('<span class="vi">Bấm micro và nói to nhé!</span>', 'height:40px;padding:0 24px;box-shadow:none;border-width:2px')
    kid('S5KidsLearnSayGraded', 'Bé: nói theo có chấm', k.topbar(k.HOME, k.count(2, 5)) +
        '<div class="stage"><div class="kbig" style="width:560px;height:380px;gap:8px">%s<span class="kf" style="font-size:40px;color:var(--primary)">dog</span></div>'
        '<div class="row" style="gap:32px">%s<div class="nudge">%s</div></div>%s</div>' % (k.pic('dog', 260), k.speaker(96), k.primary('mic', 'Bấm để nói'), grade))
    kid('S5KidsLearnSayResult', 'Bé: nói theo, kết quả', k.topbar(k.HOME, k.count(2, 5)) +
        '<div class="stage" style="flex-direction:row;gap:48px"><div class="kbig" style="width:480px;height:440px;gap:8px">%s<span class="kf" style="font-size:40px;color:var(--primary)">dog</span></div>'
        '<div class="col" style="align-items:center;gap:24px;width:440px">%s<div class="hud kf popin" style="font-size:40px;height:80px;padding:0 40px">Gần đúng rồi!</div>'
        '<div class="row" style="gap:32px">%s<div class="nudge">%s</div></div></div></div>' % (k.pic('dog', 260), k.stars(2, 88, pop=True), k.round_btn('mic', 'Nói lại', 88), k.primary('play', 'Tiếp')))
    kid('S5KidsReviewGift', 'Bé: ôn, quà đồ ăn', k.topbar(k.HOME) +
        '<div class="stage" style="gap:24px;justify-content:flex-start;padding-top:8px"><div class="row" style="gap:24px">%s<div class="hud kf" style="font-size:40px;height:80px;padding:0 40px;color:var(--primary)">turtle</div></div>%s</div>'
        '<div class="scrim" style="z-index:3"></div><div style="position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center">'
        '<div class="kbig popin" style="width:520px;height:440px;background:var(--warningSoft);gap:8px">%s<span class="kf" style="font-size:40px">Quà cho thú cưng!</span></div></div>'
        % (k.speaker(96), k.choices([('dog', ' off', False), ('apple', ' off', False), ('turtle', ' right', True)]), k.pic('cake', 260)) + k.confetti(30).replace('class="confetti"', 'class="confetti" style="z-index:5"'))
    kid('S5KidsGateConfirm', 'Bé: nhập lại PIN', k.home_behind() + k.gate('Nhập lại PIN để xác nhận', k.dots(3), links=('Đóng',)))
    kid('S5KidsGateWrong', 'Bé: sai PIN', k.home_behind() + k.gate('Nhập PIN phụ huynh', k.dots(0), 'PIN chưa đúng.'))
    dots = ''.join('<span class="dot on tw" style="animation-delay:%dms;background:var(--coin)"></span>' % d for d in (0, 300, 600))
    kid('S5KidsLoading', 'Bé: đang tải', k.topbar(k.HOME, '', score=None) +
        '<div class="stage" style="gap:24px" role="status" aria-label="Đang tải">%s<div class="hud" style="height:72px;padding:0 32px;gap:16px">%s</div></div>' % (k.kitsu(280), dots))

# ---------- Canvas ----------
def update_canvas():
    p = os.path.join(OUT, 'canvas.json')
    c = json.load(open(p, encoding='utf-8'))
    ours = {n + '.dc.html' for n, _, _ in NEW}
    for k in list(c['boards']):
        if k in ours or k == 'Main.dc.html': del c['boards'][k]
    c['order'] = [k for k in c['order'] if k not in ours and k != 'Main.dc.html']
    # S0 thêm hàng icon nên cao hơn: nhích lên để không chạm tiêu đề S1
    c['boards']['S0System.dc.html'].update(h=1400, y=7300)
    c['notes']['secS0']['y'] = 7160
    # chỉ tính bảng S: bảng P của phần khác không được đẩy nhóm này đi
    top = max(v['y'] + v['h'] for k, v in c['boards'].items() if k.startswith('S')) + 200
    c['notes']['secS6'] = {'kind': 'title1', 'text': 'Trạng thái bổ sung S1–S5', 'x': 0, 'y': top, 'w': 240, 'maxW': 5000}
    y, x, col, pitch_w = top + 140, 0, 0, None
    last = None
    for name, title, w in NEW:
        part = name[:2]
        if last and (part != last or col == 6):
            y += 840; x = 0; col = 0
        last = part
        c['boards'][name + '.dc.html'] = {'h': 720, 'title': title, 'w': w, 'x': x, 'y': y}
        c['order'].append(name + '.dc.html')
        x += w + 80; col += 1
    tmp = p + '.tmp'
    json.dump(c, open(tmp, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    os.replace(tmp, p)

if __name__ == '__main__':
    home_done(); ex_tf(); ex_speak_states()
    review_vi_en(); review_flip(); speak_states(); practice_listen(); practice_noreward(); words_nomatch(); placement_states()
    s3_states()
    s4bubbles(False); s4bubbles(True)
    s5_states()
    update_canvas()
    print('Bảng mới:', len(NEW))
