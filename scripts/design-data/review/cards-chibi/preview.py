# Xem trước hình thẻ chibi: chụp các <symbol> ở cỡ 270px và 84px bằng Edge headless.
# Dùng: python preview.py animals-face-a.svg z-ele,z-gir,z-koa <đường dẫn ảnh .png>
import os, subprocess, sys, tempfile
D = os.path.dirname(os.path.abspath(__file__))
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
TMP = os.path.join(tempfile.gettempdir(), 'cards-chibi-preview')
os.makedirs(TMP, exist_ok=True)
parts = open(os.path.join(D, sys.argv[1]), encoding='utf8').read()
ids = sys.argv[2].split(',')
out = os.path.abspath(sys.argv[3])
cells = ''.join(
    '<div style="display:flex;flex-direction:column;align-items:center;gap:10px">'
    '<div style="width:300px;height:300px;border-radius:40px;background:#DCEBCB;display:flex;align-items:flex-end;justify-content:center">'
    f'<svg width="270" height="306" viewBox="0 0 300 340"><use href="#{i}"/></svg></div>'
    '<div style="width:76px;height:76px;border-radius:20px;background:#DCEBCB;display:flex;align-items:flex-end;justify-content:center;overflow:hidden">'
    f'<svg width="74" height="84" viewBox="0 0 300 340"><use href="#{i}"/></svg></div>'
    f'<span style="font:16px sans-serif">{i}</span></div>' for i in ids)
html = f'<!doctype html><html><body style="margin:0;background:#FFF9EE"><div style="display:flex;gap:20px;padding:20px">{cells}</div>{parts}</body></html>'
page = os.path.join(TMP, 'preview.html')
open(page, 'w', encoding='utf8').write(html)
w = 20 + len(ids) * 320
subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--user-data-dir=' + os.path.join(TMP, 'edge'),
                '--window-size=%d,460' % w, '--virtual-time-budget=1000', '--screenshot=' + out, 'file:///' + page.replace('\\', '/')], check=True)
print(out)
