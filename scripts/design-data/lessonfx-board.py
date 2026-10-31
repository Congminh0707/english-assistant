import sys, random, math
OUT = sys.argv[1]
random.seed(9)
CSS = """
body{margin:0}
.t{font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#2B2B3A}
.h{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800;margin:0}
.card{background:#fff;border:1px solid #E6DCC3;border-radius:16px;box-sizing:border-box;overflow:hidden}
.chip{display:inline-flex;align-items:center;height:24px;padding:0 12px;border-radius:999px;font:700 12px 'Be Vietnam Pro',sans-serif}
.cap{padding:8px 14px 12px}
.d{font-size:12px;color:#5E5E73;line-height:1.4;margin-top:2px}
svg text{font-family:'Baloo 2','Be Vietnam Pro',sans-serif;font-weight:800}
.tb{transform-box:fill-box;transform-origin:center}
@keyframes cardIn{0%{transform:scale(0) rotate(-12deg)}10%{transform:scale(1.18) rotate(5deg)}18%{transform:scale(.96) rotate(-2deg)}24%,100%{transform:scale(1) rotate(0)}}
@keyframes frontf{0%,40%{transform:scaleX(1)}50%,96%{transform:scaleX(0)}100%{transform:scaleX(1)}}
@keyframes backf{0%,50%{transform:scaleX(0)}60%,92%{transform:scaleX(1)}96%,100%{transform:scaleX(0)}}
@keyframes okb{0%,18%{transform:scale(1)}28%{transform:scale(1.14)}36%{transform:scale(.97)}44%,100%{transform:scale(1)}}
@keyframes okfill{0%,18%{fill:#fff;stroke:#E6DCC3}26%,86%{fill:#DFF3E5;stroke:#2F8F52}100%{fill:#fff;stroke:#E6DCC3}}
@keyframes ckin{0%,26%{transform:scale(0)}34%{transform:scale(1.3)}42%,86%{transform:scale(1)}92%,100%{transform:scale(0)}}
@keyframes conf{0%,24%{transform:translate(0,0) rotate(0);opacity:0}28%{opacity:1}70%{transform:translate(var(--dx),var(--dy)) rotate(420deg);opacity:1}90%,100%{transform:translate(var(--dx),calc(var(--dy) + 40px)) rotate(520deg);opacity:0}}
@keyframes sfly{0%,30%{transform:translate(0,0) scale(0);opacity:0}38%{transform:translate(0,-10px) scale(1.4);opacity:1}70%{transform:translate(150px,-130px) scale(.8);opacity:1}76%,100%{transform:translate(150px,-130px) scale(.1);opacity:0}}
@keyframes cnt{0%,70%{transform:scale(1)}76%{transform:scale(1.4)}86%,100%{transform:scale(1)}}
@keyframes shake{0%,20%{transform:translateX(0)}26%{transform:translateX(-9px)}32%{transform:translateX(8px)}38%{transform:translateX(-6px)}44%{transform:translateX(4px)}50%,100%{transform:translateX(0)}}
@keyframes sofft{0%,20%{fill:#fff;stroke:#E6DCC3}28%,60%{fill:#FFF0CC;stroke:#F2A23D}90%,100%{fill:#fff;stroke:#E6DCC3}}
@keyframes bub{0%,48%{transform:scale(0);opacity:0}58%{transform:scale(1.1);opacity:1}64%,88%{transform:scale(1);opacity:1}96%,100%{transform:scale(0);opacity:0}}
@keyframes starp{0%{transform:scale(0) rotate(-30deg)}10%{transform:scale(1.5) rotate(10deg)}18%,84%{transform:scale(1) rotate(0)}100%{transform:scale(0)}}
@keyframes bar{0%{transform:scaleX(0)}80%,92%{transform:scaleX(1)}100%{transform:scaleX(0)}}
@keyframes spark{0%{transform:scale(0);opacity:0}8%{transform:scale(1.6);opacity:1}18%,100%{transform:scale(0);opacity:0}}
@keyframes flame{0%,100%{transform:scale(1,1) rotate(-2deg)}50%{transform:scale(.94,1.1) rotate(2deg)}}
@keyframes n1{0%,30%{opacity:1;transform:scale(1)}34%,100%{opacity:0;transform:scale(.4)}}
@keyframes n2{0%,30%{opacity:0;transform:scale(1.8)}38%{opacity:1;transform:scale(1)}62%{opacity:1}66%,100%{opacity:0;transform:scale(.4)}}
@keyframes n3{0%,62%{opacity:0;transform:scale(1.8)}72%{opacity:1;transform:scale(1.15)}80%,94%{opacity:1;transform:scale(1)}100%{opacity:0}}
@keyframes grow{0%,30%{transform:scale(.7)}38%,62%{transform:scale(1)}72%,94%{transform:scale(1.35)}100%{transform:scale(.7)}}
@keyframes draw{0%,22%{stroke-dashoffset:200}44%,100%{stroke-dashoffset:0}}
@keyframes mt{0%,46%{fill:#fff;stroke:#E6DCC3;transform:scale(1);opacity:1}52%{fill:#DFF3E5;stroke:#2F8F52;transform:scale(1.14)}62%{transform:scale(1);fill:#DFF3E5;stroke:#2F8F52;opacity:1}78%{transform:scale(.2);opacity:0}100%{transform:scale(1);opacity:0}}
@keyframes pk{0%,44%{transform:scale(0);opacity:0}50%{transform:scale(1.7);opacity:1}64%,100%{transform:scale(0);opacity:0}}
.p1{animation:cardIn 5s infinite}.p1f{animation:frontf 5s infinite}.p1b{animation:backf 5s infinite}
.p2b{animation:okb 4s infinite}.p2f{animation:okfill 4s infinite}.p2c{animation:ckin 4s infinite}.p2s{animation:sfly 4s infinite}.p2n{animation:cnt 4s infinite}
.cf{animation:conf 4s ease-out infinite}
.p3{animation:shake 4s infinite}.p3f{animation:sofft 4s infinite}.p3b{animation:bub 4s infinite}
.p4{animation:starp 5s infinite backwards;animation-delay:var(--dl)}.p4b{animation:bar 5s infinite}.p4s{animation:spark 5s infinite backwards;animation-delay:var(--dl)}
.p5f{animation:flame .8s ease-in-out infinite}.p5g{animation:grow 4s infinite}.n1{animation:n1 4s infinite}.n2{animation:n2 4s infinite}.n3{animation:n3 4s infinite}
.p6l{animation:draw 4s infinite}.p6c{animation:mt 4s infinite}.p6s{animation:pk 4s infinite}
@media (prefers-reduced-motion:reduce){.p1,.p1f,.p1b,.p2b,.p2f,.p2c,.p2s,.p2n,.cf,.p3,.p3f,.p3b,.p4,.p4b,.p4s,.p5f,.p5g,.n1,.n2,.n3,.p6l,.p6c,.p6s{animation:none}.p2c,.p3b,.n3{opacity:1;transform:none}}
"""
BG = '<rect width="410" height="240" fill="#FFF8E6"/>'
def conf():
    cols = ['#E8604C', '#F2A23D', '#4CB977', '#2FB8C6', '#7B4FE0', '#FF8FB1']
    out = ''
    for i in range(16):
        a = random.uniform(-math.pi * .95, -math.pi * .05); r = random.uniform(50, 120)
        out += '<rect class="cf tb" style="--dx:%dpx;--dy:%dpx;animation-delay:%.2fs" x="205" y="116" width="8" height="12" rx="2" fill="%s"/>' % (math.cos(a) * r, math.sin(a) * r, random.uniform(0, .15), cols[i % 6])
    return out
STAR = 'M0 -12l3.6 7.6 8.4 1.2-6.1 5.9 1.5 8.3L0 8.9l-7.4 4.1 1.5-8.3-6.1-5.9 8.4-1.2z'
def btn(x, y, w, label, cls='', fcls=''):
    return '<g class="%s tb"><rect class="%s" x="%d" y="%d" width="%d" height="44" rx="14" fill="#fff" stroke="#E6DCC3" stroke-width="3"/><text x="%d" y="%d" font-size="19" fill="#2B2B3A" text-anchor="middle">%s</text></g>' % (cls, fcls, x, y, w, x + w / 2, y + 29, label)
P = []
# 1 card in + flip
P.append(('Thẻ hiện ra & lật', 'pop 0,5 s · lật 0,4 s', 'Thẻ nảy vào (quá đà rồi về), chạm là lật sang chữ — mỗi thẻ vào lệch nhịp 0,1 s.',
  BG + '<g class="p1 tb"><g transform="translate(205 120)"><g class="p1f tb"><rect x="-80" y="-84" width="160" height="168" rx="22" fill="#fff" stroke="#2B2B3A" stroke-width="4"/><path d="M-26 20Q-26 -10 0 -34Q26 -10 26 20Q0 36 -26 20Z" fill="#E8604C"/><rect x="-10" y="-46" width="20" height="10" rx="3" fill="#6B3E2E"/><rect x="-8" y="26" width="16" height="6" fill="#6B3E2E"/><text y="68" font-size="18" fill="#5E5E73" text-anchor="middle">Chạm để lật</text></g><g class="p1b tb"><rect x="-80" y="-84" width="160" height="168" rx="22" fill="#FFF0CC" stroke="#2B2B3A" stroke-width="4"/><text y="8" font-size="34" fill="#2B2B3A" text-anchor="middle">lantern</text><text y="42" font-size="20" fill="#B9770E" text-anchor="middle">đèn lồng</text></g></g></g>'))
# 2 correct
P.append(('Trả lời đúng', 'nảy 0,35 s · pháo giấy · sao bay', 'Ô đúng nảy + xanh + dấu ✓ bật ra; pháo giấy toả; ngôi sao bay về bộ đếm và bộ đếm nhún.',
  BG + btn(20, 150, 110, 'boat') + '<g class="p2b tb"><rect class="p2f" x="150" y="150" width="110" height="44" rx="14" fill="#fff" stroke="#E6DCC3" stroke-width="3"/><text x="205" y="179" font-size="19" fill="#2B2B3A" text-anchor="middle">lantern</text><g class="p2c tb"><circle cx="248" cy="150" r="13" fill="#2F8F52" stroke="#fff" stroke-width="3"/><path d="M242 150l5 5 8-9" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></g>' + btn(280, 150, 110, 'temple') + conf() +
  '<g transform="translate(205 140)"><g class="p2s"><path d="%s" fill="#FFD66B" stroke="#2B2B3A" stroke-width="2.4" stroke-linejoin="round"/></g></g><g class="p2n tb"><g transform="translate(366 24)"><rect x="-34" y="-18" width="68" height="36" rx="18" fill="#fff" stroke="#2B2B3A" stroke-width="3"/><path d="M-18 -8l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9z" fill="#FFD66B"/><text x="8" y="7" font-size="19" fill="#2B2B3A" text-anchor="middle">+1</text></g></g>' % STAR))
# 3 wrong
P.append(('Chưa đúng — nhẹ nhàng', 'lắc 0,5 s · không âm báo chói', 'Ô sai lắc nhẹ + viền cam ấm (không đỏ); bạn thú cưng nói "Thử lại nhé!"; không trừ sao.',
  BG + btn(20, 150, 110, 'temple') + '<g class="p3 tb"><rect class="p3f" x="150" y="150" width="110" height="44" rx="14" fill="#fff" stroke="#E6DCC3" stroke-width="3"/><text x="205" y="179" font-size="19" fill="#2B2B3A" text-anchor="middle">boat</text></g>' + btn(280, 150, 110, 'lantern') +
  '<g class="p3b tb"><g transform="translate(205 70)"><rect x="-96" y="-30" width="192" height="52" rx="20" fill="#fff" stroke="#2B2B3A" stroke-width="3"/><path d="M-10 22l10 14 10-14z" fill="#fff" stroke="#2B2B3A" stroke-width="3" stroke-linejoin="round"/><path d="M-9 21h18" stroke="#fff" stroke-width="5"/><text y="4" font-size="20" fill="#2B2B3A" text-anchor="middle">Thử lại nhé!</text></g></g>'))
# 4 stars
stars = '';
for i in range(5):
    a = i * .55
    stars += '<g transform="translate(%d 90)"><g class="p4 tb" style="--dl:%.1fs"><path d="%s" fill="#FFD66B" stroke="#2B2B3A" stroke-width="2.4" stroke-linejoin="round" transform="scale(2)"/></g><g class="p4s tb" style="--dl:%.1fs"><path d="M0 -26L5 -8L24 0L5 8L0 26L-5 8L-24 0L-5 -8Z" fill="#fff"/></g></g><g transform="translate(%d 90)"><path d="%s" fill="none" stroke="#E6DCC3" stroke-width="3" stroke-linejoin="round" transform="scale(2)" opacity=".8"/></g>' % (60 + i * 72, a, STAR, a, 60 + i * 72, STAR)
P.append(('Thanh sao đầy', 'từng sao 0,5 s', 'Mỗi từ đúng lấp đầy một sao: nảy to rồi về, loé sáng; thanh dưới chạy theo; đủ 5 sao thì pháo giấy.',
  BG + '<g transform="translate(0 0)">' + ''.join(stars) + '</g><rect x="40" y="170" width="330" height="18" rx="9" fill="#F6EEDB"/><rect class="p4b" x="40" y="170" width="330" height="18" rx="9" fill="#3F6FE0" style="transform-origin:40px 179px"/><text x="205" y="214" font-size="18" fill="#5E5E73" text-anchor="middle">4 / 5 từ · gần xong rồi!</text>'))
# 5 combo
P.append(('Chuỗi đúng liên tiếp (combo)', 'x2 → x3 → x4', 'Ngọn lửa lớn dần theo chuỗi, số nảy vào; không phạt khi ngắt chuỗi, chỉ về nhỏ nhẹ.',
  BG + '<g transform="translate(205 130)"><g class="p5g tb"><g class="p5f tb"><path d="M0 70C-48 70 -64 30 -40 -6C-34 14 -22 18 -16 6C-24 -22 -6 -50 8 -70C12 -40 40 -26 44 8C48 40 30 70 0 70Z" fill="#FF9A4A"/><path d="M0 70C-24 70 -32 46 -20 28C-14 40 -6 38 -4 28C-6 12 6 -4 12 -14C14 4 28 14 28 34C28 56 16 70 0 70Z" fill="#FFE08A"/></g></g><g class="n1 tb"><text y="36" font-size="46" fill="#fff" stroke="#2B2B3A" stroke-width="5" paint-order="stroke" text-anchor="middle">x2</text></g><g class="n2 tb"><text y="36" font-size="54" fill="#fff" stroke="#2B2B3A" stroke-width="5" paint-order="stroke" text-anchor="middle">x3</text></g><g class="n3 tb"><text y="36" font-size="64" fill="#fff" stroke="#2B2B3A" stroke-width="6" paint-order="stroke" text-anchor="middle">x4</text></g></g>'))
# 6 match
P.append(('Ghép cặp', 'kéo nối 0,6 s · tan biến', 'Kéo dây nối hình với từ: dây vẽ theo tay, tia lửa khi khớp, hai thẻ xanh lên rồi nhỏ dần biến mất.',
  BG + '<g transform="translate(60 120)"><g class="p6c tb"><rect x="-44" y="-44" width="88" height="88" rx="20" fill="#fff" stroke="#E6DCC3" stroke-width="3"/><path d="M-18 14Q-18 -10 0 -26Q18 -10 18 14Q0 26 -18 14Z" fill="#E8604C"/></g></g><g transform="translate(350 120)"><g class="p6c tb"><rect x="-44" y="-44" width="88" height="88" rx="20" fill="#fff" stroke="#E6DCC3" stroke-width="3"/><text y="8" font-size="20" fill="#2B2B3A" text-anchor="middle">lantern</text></g></g><path class="p6l" d="M104 120C150 80 260 160 306 120" fill="none" stroke="#3F6FE0" stroke-width="6" stroke-linecap="round" stroke-dasharray="200 200"/><g transform="translate(205 120)"><g class="p6s tb"><path d="M0 -22L5 -6L22 0L5 6L0 22L-5 6L-22 0L-5 -6Z" fill="#FFD66B" stroke="#2B2B3A" stroke-width="2"/></g></g>'))
cards = ''
for name, chip, desc, svg in P:
    cards += '<div class="card"><svg width="100%%" viewBox="0 0 410 240" style="display:block" role="img" aria-label="%s">%s</svg><div class="cap"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div class="h" style="font-size:20px">%s</div><span class="chip" style="background:#E4ECFF;color:#2F58BC">%s</span></div><div class="d">%s</div></div></div>' % (name, svg, name, chip, desc)
html = ("""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Kids lesson effects</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&family=Baloo+2:wght@700;800&display=swap">
<style>""" + CSS + """</style>
</helmet>
<div class="t" style="width:1360px;height:840px;background:#FBF4E4;padding:28px 40px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap"><h1 class="h" style="font-size:40px;line-height:1">Bài học vui: hoạt ảnh phản hồi</h1><span class="chip" style="background:#FFF0CC;color:#7A4A06">Đang chạy thật — chưa áp dụng</span></div>
<div style="font-size:14px;color:#5E5E73;margin-top:-6px">Mỗi hành động của bé có phản hồi sống động nhưng ngắn (≤ 0,6 s), vòng lặp dưới đây chỉ để xem. Giảm chuyển động → bỏ nảy/rung/pháo giấy, giữ đổi màu + dấu ✓ + chữ.</div>
<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">""" + cards + """</div>
<div class="card" style="padding:10px 16px;font-size:13px;line-height:1.55"><b>Quy tắc:</b> đúng = nảy + xanh + pháo + sao bay (có âm "ting" nhẹ); chưa đúng = lắc nhẹ + cam ấm + lời động viên, không âm chói, không mất sao; chuỗi đúng liên tiếp hiện lửa nhưng ngắt chuỗi không báo đỏ; đổi bước dùng chuyển cảnh trượt 0,25 s; thú cưng phản ứng theo kết quả (nhảy/gật/ngạc nhiên); mọi phản hồi đều có chữ/icon đi kèm (không chỉ dựa vào màu).</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1360,"height":840}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
""")
open(OUT + '/KidsLessonFx.dc.html', 'w', encoding='utf-8').write(html)
print(len(html))
