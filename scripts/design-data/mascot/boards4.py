# Bảng thiết kế mascot v4 cho canvas: python scripts/design-data/mascot/boards4.py
# Ghi ra MASCOT_BOARD_OUT (mặc định content/.build/mascot4-boards/project), không commit.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
from build import FONTS, card
import build4
from build4 import fig_svg, ALL_CSS

OUT = os.environ.get('MASCOT_BOARD_OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'content', '.build', 'mascot4-boards', 'project')
NIGHT = '#1F2550'

def doc(title, w, h, body, bg='#FBF6EA', fg='#2B2118'):
    return f'''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>
{ALL_CSS}
</style>
</helmet>
<div style="width: {w}px; height: {h}px; box-sizing: border-box; padding: 48px 56px; background: {bg}; color: {fg}; font-family: 'Be Vietnam Pro', system-ui, sans-serif; display: flex; flex-direction: column; gap: 24px">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''

def eyebrow(t, c='#0E6B45'):
    return f'<p style="margin: 0; font-size: 14px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: {c}">{t}</p>'

def frames(n, stage, w, fs=(0, .95, 1.9, 2.85), bg=NIGHT):
    """Khung hình đứng yên lệch nhịp: thấy sóng chạy từ gốc tới chóp."""
    o = ''
    for f in fs:
        o += (f'<figure style="margin: 0; background: {bg}; border-radius: 16px; display: flex; flex-direction: column; align-items: center; padding: 6px 6px 8px">'
              f'<div class="fz" style="--f:{f}s">{fig_svg(n, stage, w=w, label=f"Khung t = {f}s")}</div>'
              f'<figcaption style="font-family: \'JetBrains Mono\', monospace; font-size: 12px; color: #C9D0F0">t = {f:.2f}s</figcaption></figure>')
    return o

INFO = {
    'kitsu': ('Kitsu — cáo con lém lỉnh', 'Thiên Hồ', '#9FE0FF',
              'Đuôi vẽ lại từ đầu: gốc nhỏ, bụng phình, chóp bút lông trắng răng cưa hất ra ngoài; mỗi đuôi là 7 khúc nối tô chuyển sắc ngang thân, mép có túm lông; khúc sau trễ pha 0,12 s và lắc rộng dần, mỗi đuôi lệch nhau 0,34 s nên cả quạt gợn như lửa. Mắt có mống chuyển màu, mi cong và 3 điểm sáng; thêm ria mảnh.',
              ['Tai và đuôi ló ra', '1 đuôi · lá biến hình đung đưa', '3 đuôi xoè · chuông vàng', '5 đuôi quạt · giấy shide bay'],
              'Thiên Hồ · 9 đuôi xoè quạt, chóp xanh băng có đai vàng nạm hồng ngọc · vân xoáy vàng · 4 đốm kitsunebi nhỏ · tua tai, dải lụa đỏ · ngọc hồ ly'),
    'bi': ('Bi — tiểu tinh mầm lá', 'Thần Rừng', '#FFE9A8',
           'Mỗi chiếc lá ở cánh, đuôi và mầm trên đầu là một khớp riêng, rung lệch nhịp như có gió lùa; cả cụm mầm lắc quanh gốc, lá trên đó rung thêm một lớp.',
           ['Mầm lá nhú', 'Mầm 2 lá lắc lư', 'Cánh lá rung lệch nhịp', '3 cặp lá + hoa'],
           'Thần Rừng · cánh lá vàng 10 khớp · đom đóm nhỏ trôi · sao vàng mảnh nhấp nháy'),
    'draco': ('Draco — rồng con má hồng', 'Long Thần', '#FFB36B',
              'Đuôi rồng 7 khúc thon dần, có dải bụng vàng, nếp giáp, vảy và gai lưng 2 lớp gắn theo từng khúc nên uốn cùng đuôi; chóp hình lá có gân. Huyền thoại: chóp là ngọn lửa nhỏ, từng ngọn bờm lửa lắc lệch nhịp.',
              ['Sừng nhú, vân vảy', 'Đuôi khúc, đội vỏ trứng', 'Gai đuôi uốn theo khúc', 'Cánh lớn, khăn đỏ'],
              'Long Thần · bờm 7 ngọn lửa lắc lệch nhịp · than hồng nhỏ bay lên · ngọc rồng lơ lửng'),
    'robo': ('Robo — rô-bốt mắt đèn', 'Thần Cơ Giáp', '#9FF6FF',
             'Ăng-ten là lò xo lắc nhanh 1,6 s; vây lưng đung đưa lệch nhau; Huyền thoại: từng ô lục giác sáng lần lượt như dòng năng lượng chạy qua cánh.',
             ['Viên nang, đèn nháy', 'Chong chóng quay', 'Ăng-ten lò xo, vây', 'Tai nghe, ba lô phản lực'],
             'Thần Cơ Giáp · cánh lục giác sáng lần lượt · hạt dữ liệu nhỏ trôi · vòng hào quang mảnh'),
    'lupo': ('Lupo — sói bạc trăng non', 'Nguyệt Lang', '#C9D4FF',
             'Đuôi sói xù 7 khúc cong lên, mép có túm lông, chóp kem răng cưa; vẫy chậm 3,4 s. Huyền thoại: đuôi ngân hà chuyển chàm → tím → lam có sao nhấp nháy dọc thân, trăng khuyết mảnh sau đầu, chòm sao nối nét.',
             ['Tai nhọn, trăng nhỏ', 'Đuôi khúc vẫy chậm', 'Khăn xanh cài sao', 'Áo choàng, bùa trăng'],
             'Nguyệt Lang · đuôi ngân hà có sao trôi theo · trăng khuyết mảnh · chòm sao nối nét · bụi trăng nhỏ'),
}

def char_board(n):
    title, lgname, col, desc, notes, lnote = INFO[n]
    nm = title.split(' — ')[0]
    cards = []
    for st, t, sub, note in (('egg', 'Trứng', 'lv 1', notes[0]), ('baby', 'Bé', 'lv 2–9', notes[1]), ('teen', 'Thiếu niên', 'lv 10–24', notes[2]), ('adult', 'Trưởng thành', 'lv 25–49', notes[3])):
        cards.append(card(fig_svg(n, st, w=200, label=f'{nm} giai đoạn {t.lower()}'), t, sub, note).replace('background: #FFFFFF', 'background: #F0E7D6', 1))
    cards.append(card(fig_svg(n, 'legend', w=300, label=f'{nm} giai đoạn huyền thoại'), 'Huyền thoại', 'lv 50+', lnote, (NIGHT, col)))
    strip = ''.join(fig_svg(n, 'legend', w=w, label=f'Huyền thoại cỡ {s}') for w, s in ((70, 48), (140, 96), (210, 144)))
    strip += fig_svg(n, 'adult', w=64, label='Trưởng thành cỡ 48', ground=False)
    body = f'''<header style="display: flex; flex-direction: column; gap: 6px">
{eyebrow('Tiến hoá · v4 · khớp nối lắc lư')}
<h1 style="margin: 0; font-size: 42px; line-height: 1.1; font-weight: 800">{title}</h1>
<p style="margin: 0; font-size: 16px; line-height: 1.55; color: #5E4E3E; max-width: 980px">{desc}</p>
</header>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(0, 1.6fr); gap: 14px; align-items: stretch">
{''.join(cards)}
</div>
<div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 14px; flex-grow: 1">
<div style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 22px; padding: 14px 18px; display: flex; flex-direction: column; gap: 8px">
<p style="margin: 0; font-size: 13px; font-weight: 800; letter-spacing: .05em; color: #0E6B45">{lgname.upper()} · 4 KHUNG HÌNH CÁCH 0,95 S — SÓNG CHẠY TỪ GỐC TỚI CHÓP</p>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">{frames(n, 'legend', 150)}</div>
</div>
<div style="background: #3A4256; border-radius: 22px; padding: 14px 20px; display: flex; flex-direction: column; gap: 8px">
<p style="margin: 0; font-size: 13px; font-weight: 800; color: #FFFFFF; letter-spacing: .05em">TRÊN TASKBAR · HUYỀN THOẠI 48 / 96 / 144 PX</p>
<div style="display: flex; align-items: flex-end; gap: 18px; flex-grow: 1; border-bottom: 6px solid #1E2433">{strip}</div>
</div>
</div>'''
    return doc(f'{nm} v4 — tiến hoá', 1280, 920, body)

def research_card(title, body, refs):
    return (f'<div style="background: #FFFFFF; border: 2px solid #EADFC8; border-radius: 22px; padding: 18px 22px; display: flex; flex-direction: column; gap: 8px">'
            f'<h2 style="margin: 0; font-size: 20px; font-weight: 800">{title}</h2>'
            f'<ul style="margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.6; color: #3E3226">{"".join(f"<li>{b}</li>" for b in body)}</ul>'
            f'<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6B5A48">{refs}</p></div>')

def main_board():
    v3a = build.fig_svg('kitsu', 'adult', w=230, label='Kitsu v3 trưởng thành')
    v3l = build.fig_svg('kitsu', 'legend', w=300, label='Kitsu v3 huyền thoại')
    v4a = fig_svg('kitsu', 'adult', w=230, label='Kitsu v4 trưởng thành')
    v4l = fig_svg('kitsu', 'legend', w=300, label='Kitsu v4 huyền thoại')
    def side(tag, tagbg, tagfg, a, l, note):
        return (f'<div style="background: #FFFFFF; border: 2px solid {tagbg}; border-radius: 22px; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px">'
                f'<span style="align-self: flex-start; padding: 4px 12px; border-radius: 999px; background: {tagbg}; color: {tagfg}; font-size: 13px; font-weight: 800">{tag}</span>'
                f'<div style="display: flex; align-items: flex-end; justify-content: space-around; gap: 12px"><div style="background: #F0E7D6; border-radius: 18px">{a}</div><div style="background: {NIGHT}; border-radius: 18px">{l}</div></div>'
                f'<p style="margin: 0; font-size: 15px; line-height: 1.55; color: #5E4E3E">{note}</p></div>')
    cast = ''.join(f'<div style="background: {NIGHT}; border-radius: 18px; display: flex; justify-content: center">{fig_svg(n, "legend", w=230, label=INFO[n][1])}</div>' for n in ('bi', 'kitsu', 'draco', 'robo', 'lupo'))
    body = f'''<header style="display: flex; flex-direction: column; gap: 8px">
{eyebrow('Mascot v4 · research → vẽ lại')}
<h1 style="margin: 0; font-size: 46px; line-height: 1.1; font-weight: 800">Đuôi thon biết lắc, ánh sáng nhỏ mà huyền ảo</h1>
<p style="margin: 0; font-size: 17px; line-height: 1.55; color: #5E4E3E; max-width: 1000px">Giữ nguyên mặt, tỉ lệ chibi, tay cố định và chỗ đeo phụ kiện của v3. Đổi phần phụ (đuôi, lá, bờm, ăng-ten, vây) thành chuỗi khớp lắc theo nguyên tắc overlapping action, cho mọi giai đoạn. Quầng sáng to của Huyền thoại thay bằng quầng nhỏ, vòng chấm mảnh và vài đốm sáng li ti.</p>
</header>
<section style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">
{research_card('1 · Dáng đuôi hồ ly', ['Đuôi kitsune đẹp là đuôi <strong>thon gốc, phình giữa, chóp nhọn hất</strong> như ngọn lửa hay ngọn bút lông, không phải khối tròn to.', 'Chóp trắng chỉ ~¼ chiều dài, mép răng cưa để thành lông.', 'Đuôi xoè thành quạt sau lưng, đuôi giữa dài hơn để chóp ló trên đầu.'], 'Tham khảo: hướng dẫn vẽ nine-tailed fox (vẽ từng cặp đuôi rồi thêm đường cong), mô tả kitsune / gumiho.')}
{research_card('2 · Overlapping action', ['Một trong 12 nguyên tắc hoạt hình Disney: phần phụ chuyển động <strong>trễ hơn</strong> phần gốc.', 'Đuôi = 7 khúc lồng nhau; khúc sau trễ pha 0,12 s và biên độ tăng 1° → 5,6° về chóp.', 'Mỗi đuôi lệch pha 0,34 s nên 9 đuôi gợn sóng, không lắc đồng loạt như tấm bìa.'], 'Thực hiện: CSS <code>rotate</code> trên từng nhóm khớp, <code>animation-delay</code> âm để vừa mở đã đang lắc.')}
{research_card('3 · Ánh sáng kiểu kitsunebi', ['Lửa hồ ly trong truyện là những đốm sáng <strong>nhỏ, trôi thấp, chậm</strong>, màu xanh lạnh pha vàng.', 'Đốm r 1–2,5 với quầng gradient (không dùng blur động), mờ dần khi trôi lên 18 px trong 4–6 s, độ trễ khác nhau.', 'Quầng nền r 78, độ đục 34% (v3: r 120, 85%); thêm vòng chấm mảnh xoay 48 s.'], 'Tham khảo: Kitsunebi (Wikipedia); hướng dẫn particle của Unity — đổi độ đục theo thời gian, thời gian sống ngẫu nhiên.')}
</section>
<section style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px">
{side('V3 · HIỆN TẠI', '#FBE1DD', '#8E2318', v3a, v3l, 'Đuôi là một khối tròn to cứng, cả quạt chỉ phồng lên xuống cùng lúc. Quầng sáng r 120 và lửa ma to che bớt nhân vật.')}
{side('V4 · ĐỀ XUẤT', '#DDF1E2', '#145B32', v4a, v4l, 'Đuôi thon 7 khúc có túm lông, lắc lệch nhịp như lửa. Mắt có mống chuyển màu và mi cong. Thiên Hồ: chóp xanh băng, đai vàng nạm hồng ngọc, 4 đốm kitsunebi nhỏ.')}
</section>
<section style="display: flex; flex-direction: column; gap: 10px">
<h2 style="margin: 0; font-size: 22px; font-weight: 800">Cả 5 Huyền thoại v4</h2>
<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px">{cast}</div>
</section>'''
    return doc('Mascot v4 — tổng quan', 1440, 1400, body)

def legends_board():
    cells = ''
    for n in ('bi', 'kitsu', 'draco', 'robo', 'lupo'):
        title, lgname, col, _, _, lnote = INFO[n]
        cells += (f'<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 6px">{fig_svg(n, "legend", w=380, label=lgname)}'
                  f'<figcaption style="text-align: center; font-size: 14px; line-height: 1.5; color: #C9D0F0; max-width: 250px"><strong style="display: block; font-size: 20px; font-weight: 800; color: {col}">{lgname}</strong>{lnote}</figcaption></figure>')
    body = f'''<header style="display: flex; flex-direction: column; gap: 6px">
{eyebrow('Level 50+ · Huyền thoại', '#9FE0FF')}
<h1 style="margin: 0; font-size: 42px; line-height: 1.1; font-weight: 800; color: #FFFFFF">Năm linh thú trong đêm</h1>
<p style="margin: 0; font-size: 16px; line-height: 1.55; color: #C9D0F0; max-width: 980px">Mỗi Huyền thoại có một nhịp riêng: quạt đuôi gợn, cánh lá rung, bờm lửa liếm, cánh lục giác sáng lần lượt, đuôi ngân hà vẫy chậm. Ánh sáng chỉ là điểm xuyết.</p>
</header>
<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; align-items: start">{cells}</div>'''
    return doc('Huyền thoại v4', 2000, 760, body, bg=NIGHT, fg='#FFFFFF')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    files = {'Main.dc.html': main_board(), 'Legends.dc.html': legends_board()}
    for n in ('kitsu', 'bi', 'draco', 'robo', 'lupo'):
        files[n.capitalize() + '.dc.html'] = char_board(n)
    for k, v in files.items():
        open(os.path.join(OUT, k), 'w', encoding='utf-8').write(v)
        print(k, len(v) // 1024, 'KB')
