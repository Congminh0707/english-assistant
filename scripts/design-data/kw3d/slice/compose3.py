import sys, re
src=open('compose.py',encoding='utf-8').read().split('boards = {')[0]
sys.argv=['x',sys.argv[1]]
exec(src)
def shot(n,cap,h,w=640):
    return '<div><div class="shot" style="height:%dpx"><img src="%s" alt="%s"></div><div class="cap" style="margin-top:6px">%s</div></div>'%(h,img(n,w,82),cap.split('·')[0].strip(),cap)
body=('<div class="t" style="width:1560px;height:1500px;padding:28px 36px;display:flex;flex-direction:column;gap:16px">'
 +hdr('Kids World v3 · Lát mẫu Hội An (3D + 2D)','Nguyên mẫu để duyệt, chưa vào app','Dựng mới từ địa hình tới gờ ngói. Duyệt lát này rồi mới nhân ra 12 nơi và tầng 2–3.')
 +'<div class="shot" style="height:800px"><img src="%s" alt="Toàn cảnh 3D">%s</div>'%(img('s_over',1488,84),hudbar(1,'Trưa'))
 +'<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px">'
 +shot('s_bridge','<b>Đêm · Chùa Cầu dựng tay</b>: vòm cong, cột son, mái cong, đèn lồng phát sáng',260,500)
 +shot('s_town','<b>Hoàng hôn · Phố cổ</b>: nhà vàng, mái ngói âm dương, hoa giấy, dây đèn',260,500)
 +shot('s_rice','<b>Ruộng lúa</b>: thửa có bờ, nước, lúa xanh, lúa chín theo hàng',260,500)
 +shot('s_ride','<b>Đi đường</b>: đường có lề, vạch kẻ, đèn đường, bụi xe',260,500)
 +shot('s_flat','<b>Bản 2D · ngày</b>: nền nướng từ chính cảnh 3D, chạy trên canvas thường',260,500)
 +shot('s_flat2','<b>Bản 2D · đêm</b>: cùng cách nướng, đổi ánh sáng',260,500)
 +'</div></div>')
open(OUT+'/KidsV3.dc.html','w',encoding='utf-8').write(page('Kids World v3 lát mẫu',1560,1500,body))
