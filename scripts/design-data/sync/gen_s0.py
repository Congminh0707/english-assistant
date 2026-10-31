# Bảng hệ thiết kế: đọc thẳng từ tokens.json + board_kit nên luôn khớp với các bảng khác.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from board_kit import *

def swatch(k, v):
    return '<div class="col" style="gap:4px"><div style="height:40px;border-radius:var(--r-md);background:var(--%s);border:1px solid var(--line)"></div><div class="xs"><b>%s</b> <span class="soft">%s</span></div></div>' % (k, k, v)

def colors(d):
    return '<div class="grid" style="grid-template-columns:repeat(9,minmax(0,1fr))">' + ''.join(swatch(k, v) for k, v in d.items()) + '</div>'

def demo():
    return ('<div class="row" style="flex-wrap:wrap">' + btn('Học tiếp', 'primary', 'play') + btn('Mua', 'success', 'check') + btn('Xem thêm') + btn('Xoá', 'danger') + btn('Bỏ qua', 'ghost')
            + chip('Mới', 'primary') + chip('Đúng', 'success') + chip('Khó', 'warning') + chip('Sai', 'danger') + chip('+20 XP', 'xp') + '</div>'
            + '<div class="row" style="margin-top:12px"><div style="flex:1">' + bar(62) + '</div><div class="input" style="flex:1">' + icon('search') + '&nbsp;Tìm từ...</div></div>')

icons = ''.join('<div class="col" style="align-items:center;gap:4px;min-width:0">%s<span class="xs soft">%s</span></div>' % (icon(k), k) for k in sorted(ICONS))
body = ('<div class="t" style="width:1440px;height:1400px;padding:32px 40px;display:flex;flex-direction:column;gap:16px">'
        '<div class="row"><div class="h1">Hệ thiết kế · Làng chữ</div>' + chip('Sinh từ tokens.json', 'primary') + '</div>'
        '<div class="soft">Một nguồn cho mọi màn. App là một làng Việt: bản đồ là trang chủ, mỗi mục là một địa điểm, màn trong có cảnh địa điểm bên cạnh nội dung. Không pixel, không emoji làm icon, mỗi màn một nút chính.</div>'
        '<div class="card"><div class="h3" style="margin-bottom:12px">Màu sáng</div>' + colors(T['color']) + '</div>'
        '<div class="card dark t"><div class="h3" style="margin-bottom:12px">Màu tối</div>' + colors(T['dark']) + '</div>'
        '<div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">'
        '<div class="card"><div class="h3" style="margin-bottom:12px">Thành phần</div>' + demo() + '</div>'
        '<div class="card dark t"><div class="h3" style="margin-bottom:12px">Thành phần (tối)</div>' + demo() + '</div></div>'
        '<div class="grid" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">'
        '<div class="card col"><div class="h3">Chữ</div><div class="h1">Tiêu đề 32</div><div class="h2">Tiêu đề 26</div><div class="h3">Tiêu đề 20</div><div>Nội dung 14 Be Vietnam Pro</div><div class="ipa">/ˈrɪzɪliənt/ Noto Sans cho IPA</div></div>'
        '<div class="card col"><div class="h3">Bo góc · khoảng cách</div><div class="row"><div style="width:56px;height:56px;background:var(--primarySoft);border-radius:var(--r-sm)"></div><div style="width:56px;height:56px;background:var(--primarySoft);border-radius:var(--r-md)"></div><div style="width:56px;height:56px;background:var(--primarySoft);border-radius:var(--r-lg)"></div><div style="width:96px;height:56px;background:var(--primarySoft);border-radius:var(--r-pill)"></div></div><div class="sm soft">8 · 12 · 16 · tròn. Khoảng cách 4 · 8 · 12 · 16 · 24 · 32 · 40.</div><div class="sm soft">Chuyển động 120 · 200 · 320 ms, tắt khi giảm chuyển động.</div></div>'
        '<div class="card col"><div class="h3">Giao diện bé</div><div class="sm soft">Cùng màu và font, nhưng nút to, viền đậm, bóng đặc kiểu HUD game; chữ lớn tới 160px; luôn có loa đọc; chọn sai dùng cam ấm, không dùng đỏ.</div></div></div>'
        '<div class="card"><div class="h3" style="margin-bottom:12px">Icon (Lucide)</div><div class="grid" style="grid-template-columns:repeat(18,1fr);gap:8px 0">' + icons + '</div></div></div>')
write('S0System', body, 1440, 1400, title='Hệ thiết kế')
