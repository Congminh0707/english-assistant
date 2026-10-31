# "Làng chữ" bản chi tiết: tranh vector nhiều chi tiết, màu tươi, nền giấy. python gen_village2.py <project>
import math, os, random, sys
proj = sys.argv[1]
s = open(os.path.join(proj, 'AnimKitsu.dc.html'), encoding='utf-8').read()
i = s.index('<svg width="0" height="0"'); KDEFS = s[i:s.index('</defs></svg>', i) + len('</defs></svg>')]
R = random.Random(21)
_id = [0]
def uid():
    _id[0] += 1; return 'k%d' % _id[0]

C = dict(ink='#3A2413', brown='#6B3E1E', red='#D32F2F', red2='#9E1B1F', gold='#F7B91A', gold2='#D18A0E', cream='#FFF3D6', paper='#FBEFD8', jade='#12A06A', jade2='#0B7A52', leaf='#3CCB6B', lime='#9BE564', teal='#16BFC8', teal2='#7FE3E0', teal3='#0E93A6', pink='#F9B8B0', pink2='#F38C8C', rose='#E8688A', stone='#D9B985')
OUT = 'stroke="%s" stroke-width="1.6" stroke-linejoin="round"'

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
.v{position:relative;overflow:hidden;font-family:'Be Vietnam Pro',sans-serif;font-size:15px;line-height:1.5;color:#3A2413;box-sizing:border-box;background:#FBEFD8}
.v *{box-sizing:border-box}
.abs{position:absolute}
.t1{font-weight:800;letter-spacing:-.02em;line-height:1.05;margin:0;color:#6B3E1E}
.pill{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:20px;background:#FFF9EA;border:2px solid #E7C98E;font-weight:600;font-size:14px;color:#6B3E1E}
.go{display:inline-flex;align-items:center;gap:10px;height:54px;padding:0 28px;border:3px solid #F7B91A;border-radius:27px;background:#D32F2F;color:#fff;font:700 17px 'Be Vietnam Pro',sans-serif;cursor:pointer}
.ghost{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;border:0;background:transparent;color:#6B3E1E;font:600 14px 'Be Vietnam Pro',sans-serif;cursor:pointer}
.ipa{font-family:'Noto Sans',sans-serif}
kbd{font:500 12px 'Be Vietnam Pro',sans-serif;padding:1px 6px;border-radius:6px;background:rgba(107,62,30,.12);margin-left:2px}
button:focus-visible{outline:3px solid #16BFC8;outline-offset:3px}
@keyframes bob{0%%,100%%{transform:translateY(0)}50%%{transform:translateY(-5px)}}
@keyframes pulse{0%%,100%%{transform:scale(1)}50%%{transform:scale(1.12)}}
@keyframes dash{to{stroke-dashoffset:-44}}
.walk{animation:bob .7s ease-in-out infinite}
.next{animation:pulse 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.trail{animation:dash 1.4s linear infinite}
@media (prefers-reduced-motion:reduce){.walk,.next,.trail{animation:none}}
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
def write(n, t, w, h, b): open(os.path.join(proj, n + '.dc.html'), 'w', encoding='utf-8').write(HEAD % (t, KDEFS + b, w, h))

DEFS = ('<linearGradient id="rs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3A1408" stop-opacity=".38"/></linearGradient>'
        '<linearGradient id="es" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A0C06" stop-opacity=".6"/><stop offset="1" stop-color="#2A0C06" stop-opacity="0"/></linearGradient>'
        '<radialGradient id="lf0" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#1FA36A"/><stop offset="1" stop-color="#075238"/></radialGradient>'
        '<radialGradient id="lf1" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#3BC77A"/><stop offset="1" stop-color="#0B7A52"/></radialGradient>'
        '<radialGradient id="lf2" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#8FE878"/><stop offset="1" stop-color="#1FA860"/></radialGradient>'
        '<radialGradient id="lf3" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#E2FF9A"/><stop offset="1" stop-color="#5FD068"/></radialGradient>'
        '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FD3E8"/><stop offset=".7" stop-color="#D5F4E8"/><stop offset="1" stop-color="#FFF0C8"/></linearGradient>'
        '<linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C7EB6A"/><stop offset="1" stop-color="#6FCB55"/></linearGradient>'
        '<linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7EDB62"/><stop offset="1" stop-color="#24A65E"/></linearGradient>'
        '<linearGradient id="hill3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4CC768"/><stop offset="1" stop-color="#0E8A58"/></linearGradient>'
        '<linearGradient id="riv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#27D3D6"/><stop offset=".5" stop-color="#12B4C8"/><stop offset="1" stop-color="#1E93D6"/></linearGradient>'
        '<linearGradient id="kar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FBFA6"/><stop offset=".65" stop-color="#8FD8C0"/><stop offset="1" stop-color="#D9F2E2"/></linearGradient>'
        '<linearGradient id="kar2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F9C8A"/><stop offset=".7" stop-color="#6FD0B0"/><stop offset="1" stop-color="#CDEFDC"/></linearGradient>'
        '<linearGradient id="rd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFD24A"/><stop offset="1" stop-color="#F7A91A"/></linearGradient>'
        '<filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>'
        '<filter id="paper" x="0" y="0" width="100%%" height="100%%"><feTurbulence type="fractalNoise" baseFrequency=".006 .03" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 .96  0 0 0 0 .84  0 0 0 0 .66  0 0 0 1.5 -.62"/></filter>'
        '<filter id="grain" x="0" y="0" width="100%%" height="100%%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .15  0 0 0 0 .05  0 0 0 .4 -.14"/></filter>').replace('%%', '%')

def paper(w, h):
    return '<rect width="%d" height="%d" fill="%s"/><rect width="%d" height="%d" filter="url(#paper)"/>' % (w, h, C['paper'], w, h)

def kitsu(x, y, w, face='eopen', cls=''):
    return '<g transform="translate(%d %d)"><g%s><svg x="%d" y="%d" width="%d" height="%d" viewBox="-20 -20 200 180"><g transform="translate(80 143) scale(.9) translate(-80 -143)"><use href="#tails3"/><use href="#fbody"/><use href="#%s"/><use href="#kbib"/></g></svg></g></g>' % (x, y, (' class="%s"' % cls) if cls else '', -w / 2, -w * .86, w, w * .9, face)

# ---------- mái ngói từng hàng ----------
def roof(cx, y, w, h, base=None, rib=None, trim=None, ridge=None):
    base = base or C['gold']; rib = rib or C['gold2']; trim = trim or C['red']; ridge = ridge or C['jade']
    L, Rr = cx - w / 2, cx + w / 2; tw = w * .32
    d = 'M%.1f %.1fQ%.1f %.1f %.1f %.1fL%.1f %.1fQ%.1f %.1f %.1f %.1fQ%.1f %.1f %.1f %.1fL%.1f %.1fQ%.1f %.1f %.1f %.1fZ' % (L - 18, y - 16, L + 4, y - 2, L + 26, y, Rr - 26, y, Rr - 4, y - 2, Rr + 18, y - 16, cx + w * .36, y - h * .3, cx + tw, y - h, cx - tw, y - h, cx - w * .36, y - h * .3, L - 18, y - 16)
    cid = uid()
    o = '<clipPath id="%s"><path d="%s"/></clipPath><path d="%s" fill="%s" %s/><g clip-path="url(#%s)">' % (cid, d, d, base, OUT % C['ink'], cid)
    n = int(w / 7)
    for k in range(n + 1):  # sống ngói toả nhẹ về đỉnh
        xb = L - 18 + (w + 36) * k / n; xt = cx - tw + 2 * tw * k / n
        o += '<path d="M%.1f %.1fL%.1f %.1f" stroke="%s" stroke-width="2.1"/><path d="M%.1f %.1fL%.1f %.1f" stroke="#FFE27A" stroke-width=".8"/>' % (xb, y + 2, xt, y - h, rib, xb + 2, y + 2, xt + 1.4, y - h)
    yy = y - 8
    while yy > y - h:
        o += '<path d="M%.1f %.1fH%.1f" stroke="%s" stroke-width="1" opacity=".55"/>' % (L - 20, yy, Rr + 20, rib); yy -= 9
    o += '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="url(#rs)"/></g>' % (L - 20, y - h, w + 40, h + 6)
    # diềm ngói ống
    o += '<path d="M%.1f %.1fH%.1f" stroke="%s" stroke-width="7" stroke-linecap="round"/>' % (L + 22, y + 3, Rr - 22, trim)
    for k in range(int((w - 40) / 13)): o += '<circle cx="%.1f" cy="%.1f" r="3" fill="%s"/>' % (L + 26 + k * 13, y + 3, C['gold'] if trim != C['gold'] else C['red'])
    # bờ nóc + đầu đao cuộn
    o += '<rect x="%.1f" y="%.1f" width="%.1f" height="9" rx="4" fill="%s" %s/>' % (cx - tw - 6, y - h - 5, 2 * tw + 12, ridge, OUT % C['ink'])
    for sg in (-1, 1):
        ex = cx + sg * (tw + 6)
        o += '<path d="M%.1f %.1fq%d -8 %d -16q%d -6 %d 2q%d 6 %d 2" fill="none" stroke="%s" stroke-width="4.5" stroke-linecap="round"/>' % (ex, y - h, sg * 8, sg * 2, sg * 8, sg * 12, sg * -2, sg * -6, ridge)
        tip = cx + sg * (w / 2 + 18)
        o += '<path d="M%.1f %.1fq%d -9 %d -20" fill="none" stroke="%s" stroke-width="5" stroke-linecap="round"/><circle cx="%.1f" cy="%.1f" r="3.4" fill="%s"/>' % (tip, y - 16, sg * 8, sg * 7, ridge, tip + sg * 7, y - 37, C['gold'])
    o += '<circle cx="%.1f" cy="%.1f" r="7" fill="%s" %s/><path d="M%.1f %.1fq-6 -8 0 -16q6 8 0 16Z" fill="%s"/>' % (cx, y - h - 8, C['gold'], OUT % C['ink'], cx, y - h - 13, C['red'])
    return o

def lantern(x, y, s=1):
    return '<path d="M%.1f %.1fv%.1f" stroke="%s" stroke-width="1"/><rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%.1f" fill="%s" %s/><rect x="%.1f" y="%.1f" width="%.1f" height="2.5" fill="%s"/>' % (x, y, 6 * s, C['ink'], x - 5 * s, y + 6 * s, 10 * s, 13 * s, 4.5 * s, C['red'], OUT % C['ink'], x - 3 * s, y + 18 * s, 6 * s, C['gold'])

def facade(cx, y, w, h, bays=5, col=None):
    col = col or C['red']
    o = '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s" %s/>' % (cx - w / 2, y, w, h, col, OUT % C['ink'])
    bw = w / bays
    for b in range(bays):
        x = cx - w / 2 + b * bw
        if b == bays // 2:
            o += '<path d="M%.1f %.1fV%.1fQ%.1f %.1f %.1f %.1fV%.1fZ" fill="#3A1410" %s/>' % (x + 4, y + h, y + h * .4, x + bw / 2, y + h * .1, x + bw - 4, y + h * .4, y + h, OUT % C['gold'])
        else:
            o += '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="#F2C76A" %s/>' % (x + 5, y + 8, bw - 10, h - 16, OUT % C['brown'])
            for k in range(1, 4): o += '<path d="M%.1f %.1fv%.1f" stroke="%s" stroke-width="1.2"/>' % (x + 5 + (bw - 10) * k / 4, y + 8, h - 16, C['brown'])
            for k in range(1, 4): o += '<path d="M%.1f %.1fh%.1f" stroke="%s" stroke-width="1.2"/>' % (x + 5, y + 8 + (h - 16) * k / 4, bw - 10, C['brown'])
        o += '<rect x="%.1f" y="%.1f" width="5" height="%.1f" fill="%s"/>' % (x - 2.5, y, h, C['red2'])
    o += '<rect x="%.1f" y="%.1f" width="5" height="%.1f" fill="%s"/>' % (cx + w / 2 - 2.5, y, h, C['red2'])
    o += '<rect x="%.1f" y="%.1f" width="%.1f" height="6" fill="%s"/>' % (cx - w / 2, y, w, C['gold'])
    o += '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="url(#es)"/>' % (cx - w / 2, y, w, min(26, h * .5))
    return o

# ---------- tường đá từng viên ----------
def stonewall(x, y, w, h, arches=()):
    cid = uid(); pal = ['#E6CDA0', '#D9B985', '#C9A36E', '#F0DDB6', '#BE9662']
    o = '<clipPath id="%s"><rect x="%d" y="%d" width="%d" height="%d"/></clipPath><rect x="%d" y="%d" width="%d" height="%d" fill="#B98F5B" %s/><g clip-path="url(#%s)">' % (cid, x, y, w, h, x, y, w, h, OUT % C['ink'], cid)
    yy = y + 2; row = 0
    while yy < y + h:
        xx = x - R.randint(0, 24)
        while xx < x + w:
            bw = R.randint(20, 42)
            o += '<rect x="%d" y="%d" width="%d" height="12" rx="3" fill="%s" stroke="#8A6236" stroke-width=".8"/>' % (xx, yy, bw - 2, pal[R.randint(0, 4)]); xx += bw
        yy += 14; row += 1
    for _ in range(int(w / 70)):
        mx, my = R.randint(x, x + w), R.randint(y, y + h)
        for k in range(5): o += '<circle cx="%d" cy="%d" r="%d" fill="%s" opacity=".85"/>' % (mx + R.randint(-14, 14), my + R.randint(-6, 6), R.randint(3, 7), C['jade'])
    o += '</g><rect x="%d" y="%d" width="%d" height="8" fill="#F0DDB6" %s/>' % (x - 4, y - 6, w + 8, OUT % C['ink'])
    for ax, aw in arches:
        o += '<path d="M%d %dV%dA%d %d 0 0 1 %d %dV%dZ" fill="#2A2A3A" stroke="#F0DDB6" stroke-width="6"/>' % (ax - aw / 2, y + h, y + h - aw * .5, aw / 2, aw / 2, ax + aw / 2, y + h - aw * .5, y + h)
    return o

def trees(x, y, s=1, cols=None):
    o = '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#0A4A30" opacity=".28"/>' % (x + 8 * s, y + 1, 40 * s, 8 * s)
    o += '<path d="M%.1f %.1fq-3 %.1f -8 %.1fq%.1f 6 %.1f 0q-5 %.1f -8 %.1fZ" fill="#6B3E1E" %s/>' % (x - 3, y - 30 * s, 16 * s, 30 * s, 11 * s, 22 * s, -14 * s, -30 * s, OUT % C['ink'])
    o += '<path d="M%.1f %.1fv%.1f" stroke="#A9744A" stroke-width="%.1f"/>' % (x - 3, y - 26 * s, 22 * s, 2.5 * s)
    for lvl, (n, r, oy, spread) in enumerate([(22, 15, 6, 40), (20, 12, -2, 36), (14, 9, -10, 28), (8, 5.5, -16, 22)]):
        for _ in range(n):
            a = R.random() * 6.28; d = math.sqrt(R.random()) * spread * s
            o += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="url(#lf%d)"/>' % (x + math.cos(a) * d * 1.15 - lvl * 2 * s, y - 56 * s + math.sin(a) * d * .74 + oy * s, (r + R.random() * 3) * s, lvl)
    return o

def areca(x, y, s=1):
    o = '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="#0A4A30" opacity=".25"/>' % (x + 6, y, 20 * s, 4 * s)
    o += '<path d="M%.1f %.1fQ%.1f %.1f %.1f %.1f" stroke="#8A6236" stroke-width="%.1f" fill="none"/>' % (x, y, x + 5 * s, y - 50 * s, x, y - 100 * s, 5 * s)
    for k in range(9): o += '<path d="M%.1f %.1fh%.1f" stroke="#5A3E22" stroke-width="1"/>' % (x - 2 * s, y - 10 * s * k, 5 * s)
    for ang, L in [(-160, 46), (-130, 52), (-100, 54), (-70, 54), (-40, 50), (-15, 44), (175, 40)]:
        rad = math.radians(ang); ex, ey = math.cos(rad) * L * s, math.sin(rad) * L * s
        mx, my = ex * .5, ey * .5 - 16 * s
        o += '<g transform="translate(%.1f %.1f)"><path d="M0 0Q%.1f %.1f %.1f %.1f" stroke="#0E8A58" stroke-width="%.1f" fill="none"/>' % (x, y - 100 * s, mx, my, ex, ey, 2 * s)
        for k in range(1, 8):
            t = k / 8; qx = 2 * (1 - t) * t * mx + t * t * ex; qy = 2 * (1 - t) * t * my + t * t * ey
            o += '<path d="M%.1f %.1fl%.1f %.1fM%.1f %.1fl%.1f %.1f" stroke="%s" stroke-width="%.1f" stroke-linecap="round"/>' % (qx, qy, -5 * s, 13 * s, qx, qy, 6 * s, 12 * s, C['leaf'] if k % 2 else C['jade'], 2.4 * s)
        o += '</g>'
    return o

def bamboo(x, y, n=6, s=1):
    o = '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="5" fill="#0A4A30" opacity=".25"/>' % (x + n * 5 * s, y, n * 8 * s)
    for i in range(n):
        xx = x + i * 10 * s; h = (84 + (i * 37) % 44) * s; b = (i - n / 2) * 2.4 * s
        o += '<path d="M%.1f %.1fQ%.1f %.1f %.1f %.1f" stroke="#2FA860" stroke-width="%.1f" fill="none"/>' % (xx, y, xx + b / 2, y - h * .6, xx + b, y - h, 4 * s)
        for k in range(1, 5): o += '<path d="M%.1f %.1fh%.1f" stroke="#0B7A52" stroke-width="1.2"/>' % (xx - 2 * s + b * k / 8, y - h * k / 5, 4 * s)
        for k in range(6):
            t = .45 + k * .1; lx = xx + b * t; ly = y - h * t; sg = 1 if k % 2 else -1
            o += '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="url(#lf%d)" transform="rotate(%d %.1f %.1f)"/>' % (lx + sg * 12 * s, ly + 3, 14 * s, 3.6 * s, 1 + k % 3, sg * 22, lx, ly)
    return o

def sampan(x, y, s=1):
    return ('<g transform="translate(%d %d) scale(%.2f)"><ellipse cy="26" rx="96" ry="9" fill="#0B6E88" opacity=".4"/><path d="M-92 -8Q-40 30 0 30T96 -14L78 2Q0 14 -74 4Z" fill="#6B3E1E" %s/><path d="M-74 4Q0 14 78 2L74 12Q0 24 -68 14Z" fill="#8F5A2E"/><path d="M-30 2Q-26 -40 0 -44Q30 -40 36 2Z" fill="#D9A24A" %s/>' % (x, y, s, OUT % C['ink'], OUT % C['ink'])
        + ''.join('<path d="M%d %dQ%d -22 %d 0" stroke="#A9744A" stroke-width="1.4" fill="none"/>' % (k, 0, k + 4, k + 8) for k in range(-24, 28, 7))
        + '<path d="M54 -2v-20" stroke="#E7C9A0" stroke-width="7" stroke-linecap="round"/><circle cx="54" cy="-30" r="6" fill="#F2C9A0"/><path d="M38 -28L54 -44L70 -28Z" fill="#F7E2A8" %s/><path d="M56 -16L92 12" stroke="#6B3E1E" stroke-width="2.6"/></g>' % (OUT % C['ink']))

def stonebridge(x, y, w=110):
    return ('<path d="M%d %dQ%d %d %d %dv12Q%d %d %d %dZ" fill="#D9B985" %s/><path d="M%d %dQ%d %d %d %d" stroke="#FFE27A" stroke-width="16" fill="none"/>' % (x - w / 2, y, x, y - 34, x + w / 2, y, x, y - 8, x - w / 2, y + 12, OUT % C['ink'], x - w / 2 + 6, y - 2, x, y - 34, x + w / 2 - 6, y - 2)
        + '<path d="M%d %dA24 24 0 0 1 %d %d" fill="#0B6E88" stroke="#F0DDB6" stroke-width="3"/>' % (x - 22, y + 12, x + 22, y + 12)
        + ''.join('<rect x="%d" y="%d" width="4" height="12" fill="#B98F5B"/>' % (x - w / 2 + 8 + k * 16, y - 12 - 22 * math.sin(math.pi * (k * 16 + 8) / w)) for k in range(int(w / 16))))

def cloud(x, y, s=1, f='#FDE3D6', st='#E8688A'):
    o = ''
    for dx, dy, r in [(-34, 4, 16), (-12, -8, 20), (14, -6, 18), (36, 4, 14)]:
        o += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" stroke="%s" stroke-width="2"/>' % (x + dx * s, y + dy * s, r * s, f, st)
        pts = []
        for k in range(24):
            a = k * .42; q = r * s * .72 * (1 - k / 28); pts.append('%.1f %.1f' % (x + dx * s + math.cos(a) * q, y + dy * s + math.sin(a) * q))
        o += '<path d="M%s" fill="none" stroke="%s" stroke-width="1.6"/>' % ('L'.join(pts), st)
    o += '<path d="M%.1f %.1fh%.1f" stroke="%s" stroke-width="3" stroke-linecap="round"/>' % (x - 56 * s, y + 18 * s, 112 * s, st)
    return o

def crane(x, y, s=1, flip=1):
    return ('<g transform="translate(%d %d) scale(%.2f %.2f)"><path d="M-40 6Q-4 -6 16 2L48 -4L22 8Q-6 14 -40 6Z" fill="#fff" stroke="#6E5A4A" stroke-width="1.4"/><path d="M-4 0Q-26 -46 2 -60Q2 -30 12 2Z" fill="#fff" stroke="#6E5A4A" stroke-width="1.4"/><path d="M2 -60Q-3 -46 -3 -34L5 -30Z" fill="#26263A"/><path d="M-8 4Q-2 38 14 46Q10 22 12 2Z" fill="#fff" stroke="#6E5A4A" stroke-width="1.4"/><path d="M14 46Q10 34 11 26L6 26Z" fill="#26263A"/><path d="M-40 6L-74 12" stroke="#26263A" stroke-width="3"/><circle cx="48" cy="-5" r="3.2" fill="%s"/><path d="M50 -4L66 -2" stroke="#E9B44C" stroke-width="2.4"/></g>' % (x, y, s * flip, s, C['red']))

def lotusleaf(x, y, r, c=None):
    o = '<ellipse cx="%d" cy="%d" rx="%d" ry="%.0f" fill="%s" %s/>' % (x, y, r, r * .56, c or C['jade'], OUT % C['jade2'])
    for k in range(9):
        a = k * .7; o += '<path d="M%d %dL%.1f %.1f" stroke="%s" stroke-width="1.2"/>' % (x, y, x + math.cos(a) * r * .92, y + math.sin(a) * r * .5, C['lime'])
    return o

def lotus(x, y, s=1):
    o = ''
    for a in (-52, -28, 28, 52, 0): o += '<path d="M0 0C-9 -8 -8 -22 0 -32C8 -22 9 -8 0 0Z" transform="translate(%d %d) rotate(%d) scale(%.2f)" fill="%s" stroke="#B94A7A" stroke-width="1.2"/>' % (x, y, a, s, '#FF9DBB' if a else '#FFC6D8')
    return o

def dragonboat(x, y, s=1):
    return ('<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
        + '<path d="M-150 -6Q-120 44 -60 46H110Q150 44 176 -14L150 -4H-130Z" fill="%s" stroke="%s" stroke-width="2"/>' % (C['red2'], C['ink'])
        + '<path d="M-130 8Q0 22 158 6" stroke="%s" stroke-width="5" fill="none"/>' % C['gold']
        + '<rect x="-96" y="-54" width="190" height="50" fill="%s" %s/>' % (C['red'], OUT % C['ink'])
        + ''.join('<rect x="%d" y="-48" width="22" height="30" fill="#FFD77A" stroke="%s" stroke-width="1"/><path d="M%d -48v30M%d -33h22" stroke="%s" stroke-width="1"/>' % (x0, C['brown'], x0 + 11, x0, C['brown']) for x0 in range(-88, 86, 30))
        + roof(0, -54, 220, 22, C['jade'], C['jade2'], C['gold'], C['gold']).replace('clip-path', 'clip-path')
        + '<path d="M-124 -2Q-140 -40 -152 -58L-150 -74L-136 -62L-132 -82L-118 -64L-106 -80L-104 -58Q-100 -28 -96 -4Z" fill="%s" %s/><path d="M-150 -6Q-150 -30 -146 -48Q-174 -66 -190 -44Q-212 -46 -214 -30Q-204 -18 -186 -20Q-196 -8 -176 -2Z" fill="%s" %s/><path d="M-214 -30Q-200 -24 -186 -28" stroke="%s" stroke-width="2.4" fill="none"/><circle cx="-172" cy="-42" r="7" fill="#fff" %s/><circle cx="-170" cy="-42" r="3.2" fill="%s"/><path d="M-204 -44q-14 -14 -30 -14M-206 -26q-16 0 -30 8" stroke="%s" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M-160 -56q-6 -22 8 -34" stroke="%s" stroke-width="5" fill="none" stroke-linecap="round"/>' % (C['red'], OUT % C['ink'], C['gold'], OUT % C['ink'], C['red2'], OUT % C['ink'], C['ink'], C['gold2'], C['gold'])
        + ''.join(lantern(lx, -3, .8) for lx in (-70, -20, 30, 80)) + '</g>')

def well(x, y, s=1):
    return ('<g transform="translate(%d %d) scale(%.2f)">' % (x, y, s)
        + '<ellipse cy="26" rx="46" ry="16" fill="#8A6236"/>'
        + stonewall(-44, 0, 88, 26).replace('rx="3"', 'rx="2"')
        + '<ellipse rx="44" ry="15" fill="#F0DDB6" %s/><ellipse rx="33" ry="10" fill="%s" stroke="%s" stroke-width="1.5"/><path d="M-14 0q14 -5 28 0" stroke="#fff" stroke-width="2" fill="none"/>' % (OUT % C['ink'], C['teal'], C['teal3'])
        + '<rect x="-40" y="-66" width="7" height="72" fill="%s" %s/><rect x="33" y="-66" width="7" height="72" fill="%s" %s/>' % (C['red2'], OUT % C['ink'], C['red2'], OUT % C['ink'])
        + '<path d="M0 -62V-22" stroke="%s" stroke-width="2"/><path d="M-10 -24H10L8 -6H-8Z" fill="%s" %s/>' % (C['brown'], C['gold'], OUT % C['ink'])
        + roof(0, -64, 104, 26, C['jade'], C['jade2'], C['gold'], C['gold']) + '</g>')

def water(pts, c):
    return '<path d="%s" fill="%s"/>' % (pts, c)

def label(x, y, text, badge=None, hot=False):
    w = 26 + len(text) * 8.4
    o = '<g transform="translate(%d %d)"><path d="M%.0f -15H%.0f L%.0f 0L%.0f 15H%.0f L%.0f 0Z" fill="%s" stroke="%s" stroke-width="2"/><text y="5" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="14" fill="%s">%s</text>' % (x, y, -w / 2, w / 2, w / 2 + 11, w / 2, -w / 2, -w / 2 - 11, C['red'] if hot else '#FFF9EA', C['gold'] if hot else '#D9A24A', '#fff' if hot else C['brown'], text)
    if badge: o += '<g class="next"><circle cx="%.0f" cy="-15" r="14" fill="%s" stroke="%s" stroke-width="2"/><text x="%.0f" y="-10" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="800" font-size="13" fill="%s">%s</text></g>' % (w / 2 + 8, C['gold'], C['red'], w / 2 + 8, C['ink'], badge)
    return o + '</g>'

def grass(n, x0, y0, x1, y1, f):
    o = ''
    for _ in range(n):
        x, y = R.uniform(x0, x1), R.uniform(y0, y1)
        if f(x, y): o += '<path d="M%.0f %.0fl-2 -6M%.0f %.0fl0 -8M%.0f %.0fl3 -6" stroke="%s" stroke-width="1.2" stroke-linecap="round"/>' % (x, y, x, y, x, y, R.choice(['#0E8A58', '#BDEB6A', '#1FA860']))
    return o

def scene():
    o = '<rect width="1100" height="720" fill="url(#sky)"/>'
    rays = ''.join('<path d="M0 -46L7 -80L-7 -80Z" transform="rotate(%d)" fill="%s"/>' % (a, C['gold']) for a in range(0, 360, 30))
    o += '<g transform="translate(690 92)"><circle r="96" fill="#FFF3B0" opacity=".5" filter="url(#soft)"/><circle r="42" fill="%s" stroke="%s" stroke-width="2"/><circle r="29" fill="none" stroke="%s" stroke-width="2"/><circle r="15" fill="%s"/>%s</g>' % (C['gold'], C['red'], C['red'], C['red'], rays)
    o += crane(420, 70, .7) + crane(500, 110, .55)
    o += cloud(880, 70, .9, '#FFFFFF') + cloud(120, 62, .9, '#FFFFFF') + cloud(1010, 150, .6, '#FFFFFF')
    # núi đá vôi có mặt sáng tối
    for d, fill in [('M-30 280C0 130 40 96 80 180C100 100 150 56 196 170C230 120 262 130 300 214L330 290H-30Z', 'url(#kar)'), ('M740 280C780 120 826 76 866 170C900 80 952 96 990 188C1030 120 1076 110 1130 196V300H740Z', 'url(#kar)'), ('M280 280C330 176 372 150 410 216C450 170 504 182 540 264Z', 'url(#kar2)')]:
        o += '<path d="%s" fill="%s"/>' % (d, fill)
    for d in ['M80 180Q70 230 90 280', 'M196 170Q170 220 186 280', 'M866 170Q850 220 870 280', 'M990 188Q970 230 990 290', 'M410 216Q396 240 410 270']: o += '<path d="%s" stroke="#117F72" stroke-width="3" fill="none" opacity=".45"/>' % d
    o += '<rect x="-20" y="232" width="1140" height="36" fill="#fff" opacity=".55" filter="url(#soft)"/>'
    # đồi
    o += '<path d="M-10 262C160 202 320 252 520 234C720 216 900 244 1110 212V730H-10Z" fill="url(#hill1)"/>'
    # ruộng bậc thang
    tid = uid()
    o += '<clipPath id="%s"><path d="M640 340C760 250 960 230 1110 240V360C900 340 760 350 640 340Z"/></clipPath><g clip-path="url(#%s)">' % (tid, tid)
    for k in range(8):
        o += '<path d="M%d %dQ%d %d %d %d" stroke="%s" stroke-width="15" fill="none"/><path d="M%d %dQ%d %d %d %d" stroke="#FFF7C2" stroke-width="1.6" fill="none" opacity=".8"/>' % (620, 350 - k * 4, 860, 244 - k * 2 + k * 15, 1120, 234 + k * 16, ['#9BE564', '#C7EB6A', '#3CCB6B', '#7FE3E0'][k % 4], 620, 342 - k * 4, 860, 236 - k * 2 + k * 15, 1120, 226 + k * 16)
    o += '</g>'
    o += '<path d="M-10 346C200 286 420 366 620 326C820 286 960 336 1110 296V730H-10Z" fill="url(#hill2)"/>'
    o += grass(420, 0, 340, 1100, 500, lambda x, y: True)
    # đường vàng có sỏi viền
    road = 'M170 640C260 610 330 640 400 610C440 590 430 540 420 500C410 450 330 450 330 410C330 370 440 360 520 350C600 340 610 300 520 280C430 262 300 270 250 250'
    road2 = 'M520 350C640 340 760 340 850 300C920 268 900 230 880 214M520 350C600 420 620 470 600 540C590 580 700 620 860 610'
    for d in (road, road2):
        o += '<path d="%s" stroke="#B8751A" stroke-width="27" fill="none" stroke-linecap="round" opacity=".55"/><path d="%s" stroke="url(#rd)" stroke-width="22" fill="none" stroke-linecap="round"/><path d="%s" stroke="#FFE99A" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/><path d="%s" stroke="#C98A2A" stroke-width="3" stroke-dasharray="1 15" stroke-linecap="round" fill="none"/>' % (d, d, d, d)
    # sông
    rv = 'M-20 500C170 440 300 540 480 512S770 440 1120 506V600C780 530 640 620 470 600S170 530 -20 590Z'
    o += '<path d="%s" fill="#0B6E88" transform="translate(0 6)" opacity=".35"/><path d="%s" fill="url(#riv)"/><path d="%s" fill="none" stroke="#E8FFF8" stroke-width="4" opacity=".75"/>' % (rv, rv, rv)
    for x, y, w in [(60, 512, 80), (250, 520, 90), (560, 536, 80), (720, 500, 100), (900, 510, 90), (1000, 548, 70), (150, 548, 70), (780, 556, 90)]: o += '<path d="M%d %dq%d -7 %d 0t%d 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".75"/>' % (x, y, w / 4, w / 2, w / 2)
    o += '<path d="M-10 600C170 540 300 620 470 610S780 540 1110 610V730H-10Z" fill="url(#hill3)"/><path d="M-10 600C170 540 300 620 470 610S780 540 1110 610" fill="none" stroke="#F2DDA6" stroke-width="6"/>'
    o += grass(300, 0, 620, 1100, 716, lambda x, y: True)
    # đường phía dưới sông, cầu đá
    for d in ('M170 640C260 610 330 640 400 616', 'M604 560C600 590 700 620 860 610'):
        o += '<path d="%s" stroke="#B8751A" stroke-width="27" fill="none" stroke-linecap="round" opacity=".55"/><path d="%s" stroke="url(#rd)" stroke-width="22" fill="none" stroke-linecap="round"/><path d="%s" stroke="#FFE99A" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>' % (d, d, d)
    o += stonebridge(424, 556) + stonebridge(604, 536)
    # Trường làng
    o += '<ellipse cx="236" cy="252" rx="110" ry="9" fill="#0A4A30" opacity=".25"/>' + facade(232, 196, 150, 54, 3) + roof(232, 196, 190, 32) + '<rect x="196" y="140" width="72" height="26" fill="%s" %s/><rect x="196" y="140" width="72" height="14" fill="url(#es)"/>' % (C['red'], OUT % C['ink']) + roof(232, 142, 104, 20) + lantern(176, 196, 1) + lantern(288, 196, 1)
    # Thư các
    o += '<ellipse cx="884" cy="224" rx="62" ry="7" fill="#0A4A30" opacity=".25"/><rect x="838" y="164" width="84" height="56" fill="%s" %s/><rect x="838" y="164" width="84" height="16" fill="url(#es)"/><circle cx="880" cy="190" r="15" fill="#3A1410" stroke="%s" stroke-width="3"/><path d="M865 190h30M880 175v30" stroke="%s" stroke-width="2"/>' % (C['stone'], OUT % C['ink'], C['gold'], C['gold']) + roof(880, 166, 126, 24, C['jade'], C['jade2'], C['gold'], C['gold']) + '<rect x="856" y="120" width="48" height="22" fill="%s" %s/>' % (C['red'], OUT % C['ink']) + roof(880, 122, 84, 20)
    # Đình làng
    o += '<ellipse cx="564" cy="356" rx="150" ry="10" fill="#0A4A30" opacity=".28"/><rect x="432" y="340" width="216" height="12" fill="#F0DDB6" %s/>' % (OUT % C['ink']) + facade(540, 284, 190, 56, 5) + roof(540, 284, 240, 38) + '<rect x="476" y="226" width="128" height="24" fill="%s" %s/><rect x="476" y="226" width="128" height="14" fill="url(#es)"/>' % (C['red'], OUT % C['ink']) + roof(540, 228, 170, 30, C['jade'], C['jade2'], C['gold'], C['gold']) + lantern(456, 284, 1.1) + lantern(624, 284, 1.1)
    # Tháp vinh danh
    o += '<ellipse cx="990" cy="382" rx="58" ry="7" fill="#0A4A30" opacity=".28"/>'
    for k in range(4):
        y = 350 - k * 34; w = 60 - k * 8
        o += '<rect x="%d" y="%d" width="%d" height="26" fill="%s" %s/><rect x="%d" y="%d" width="%d" height="12" fill="url(#es)"/><rect x="985" y="%d" width="10" height="16" rx="5" fill="#3A1410"/>' % (990 - w / 2, y, w, C['cream'], OUT % C['ink'], 990 - w / 2, y, w, y + 8) + roof(990, y + 2, w + 30, 13, C['red'], C['red2'], C['gold'], C['gold'])
    # cây đa + giếng
    o += trees(216, 432, 2.1) + well(330, 402, .74)
    # cây, cau, tre
    for f in [areca(56, 400, .9), areca(92, 416, .75), areca(1052, 440, .9), areca(1084, 456, .72), areca(486, 482, .7), bamboo(690, 452, 7), trees(760, 448, .8), trees(400, 250, .55), trees(690, 262, .5)]: o += f
    # bến + thuyền
    o += '<rect x="470" y="600" width="96" height="10" fill="%s" %s/>' % (C['brown'], OUT % C['ink']) + ''.join('<rect x="%d" y="608" width="6" height="22" fill="#6B3E1E"/>' % x for x in (478, 512, 552))
    o += sampan(300, 548, .8)
    # chợ
    for x, y, c in [(800, 604, C['red']), (884, 588, C['gold']), (968, 608, C['teal3'])]:
        o += '<ellipse cx="%d" cy="%d" rx="46" ry="6" fill="#0A4A30" opacity=".3"/><rect x="%d" y="%d" width="66" height="34" fill="%s" %s/>' % (x, y + 36, x - 33, y, C['cream'], OUT % C['ink'])
        o += '<path d="M%d %dL%d %dH%dL%d %dZ" fill="%s" %s/>' % (x - 44, y + 2, x - 28, y - 26, x + 28, x + 44, y + 2, c, OUT % C['ink'])
        for k in range(5): o += '<path d="M%d %dL%d %d" stroke="#fff" stroke-width="4" opacity=".55"/>' % (x - 34 + k * 17, y + 2, x - 22 + k * 11, y - 26)
        for k in range(4): o += '<circle cx="%d" cy="%d" r="5.5" fill="%s" %s/>' % (x - 21 + k * 14, y + 26, [C['red'], C['gold'], C['leaf'], C['rose']][k], OUT % C['ink'])
    # nhà Kitsu
    o += '<ellipse cx="122" cy="664" rx="84" ry="8" fill="#0A4A30" opacity=".3"/><g transform="translate(120 662)"><rect x="-58" y="-40" width="116" height="42" fill="%s" %s/><rect x="-58" y="-40" width="116" height="14" fill="url(#es)"/><rect x="-16" y="-30" width="32" height="32" rx="14" fill="#3A1410"/><rect x="-46" y="-30" width="20" height="18" fill="#FFD77A" stroke="%s"/><rect x="26" y="-30" width="20" height="18" fill="#FFD77A" stroke="%s"/>' % (C['cream'], OUT % C['ink'], C['brown'], C['brown']) + roof(0, -38, 150, 34, '#E8913A', '#B8651B', C['gold'], C['brown']) + '</g>'
    # ao sen
    o += '<ellipse cx="720" cy="668" rx="82" ry="27" fill="url(#riv)" stroke="#F2DDA6" stroke-width="4"/>' + lotusleaf(680, 664, 18) + lotusleaf(722, 678, 14) + lotusleaf(764, 662, 16) + lotus(700, 662, .6) + lotus(748, 668, .6)
    o += bamboo(30, 708, 5, .8) + bamboo(1000, 708, 6, .8)
    return o

def r1():
    pins = (label(232, 100, 'Trường làng') + label(880, 84, 'Thư các') + label(540, 170, 'Đình làng') + label(330, 468, 'Giếng làng', '24', True) + label(990, 410, 'Tháp vinh danh') + label(515, 586, 'Bến thuyền') + label(884, 652, 'Chợ quê') + label(120, 688, 'Nhà của Kitsu'))
    trail = '<path class="trail" d="M430 552C434 520 420 490 372 462" stroke="%s" stroke-width="5" stroke-dasharray="4 16" stroke-linecap="round" fill="none"/>' % C['red']
    body = ('<div class="v" style="width:1100px;height:720px"><svg class="abs" style="left:0;top:0" width="1100" height="720" role="img" aria-label="Bản đồ làng, mỗi địa điểm là một mục"><defs>' + DEFS + '</defs>' + scene() + trail + kitsu(424, 548, 92, 'ehappy', 'walk') + pins + '<rect width="1100" height="720" filter="url(#grain)" opacity=".45"/></svg>'
            '<div class="abs" style="left:20px;top:16px;display:flex;gap:8px"><span class="pill">12 ngày liền</span><span class="pill">540 xu</span><span class="pill">Cấp 12</span></div>'
            '<div class="abs" style="right:20px;top:16px;display:flex;gap:8px"><span class="pill">Tìm từ <kbd>Ctrl K</kbd></span><span class="pill">Cài đặt</span></div>'
            '<div class="abs" style="left:300px;bottom:12px"><button class="go">Tới Giếng làng, ôn 24 từ <kbd style="background:rgba(255,255,255,.22);color:#fff">Enter</kbd></button></div></div>')
    write('R1Home', 'Làng chữ, bản đồ chính', 1100, 720, body)

def side(x, w, inner):
    return '<svg class="abs" style="left:%dpx;top:0" width="%d" height="720" viewBox="0 0 %d 720" aria-hidden="true"><defs>%s</defs>%s<rect width="%d" height="720" filter="url(#grain)" opacity=".45"/></svg>' % (x, w, w, DEFS, inner, w)

def r2():
    sc = (paper(430, 720) + '<path d="M-10 360C-10 220 120 150 240 180C340 130 460 200 450 360Z" fill="%s" opacity=".75"/>' % C['pink']
          + '<path d="M40 380L120 200L160 260L210 170L310 380Z" fill="#F58F8F" stroke="#fff" stroke-width="2"/><path d="M130 380L190 250L230 300L260 240L330 380Z" fill="#3FBFA6" stroke="#fff" stroke-width="2"/>'
          + cloud(330, 110, .9) + crane(120, 120, .7) + crane(200, 80, .5)
          + '<path d="M-10 560C-10 420 110 380 220 390C340 380 450 430 450 560V730H-10Z" fill="%s" %s/><path d="M-10 590C60 480 300 470 450 560V730H-10Z" fill="%s"/>' % (C['leaf'], OUT % C['jade2'], C['lime'])
          + stonewall(-10, 560, 460, 50, [(120, 44)])
          + water('M-10 730V608H450V730Z', C['teal']) + water('M-10 730V650C120 630 300 640 450 660V730Z', C['teal2'])
          + trees(120, 500, 2.1) + well(300, 520, 1.15) + lotusleaf(70, 668, 34) + lotusleaf(150, 692, 22) + lotusleaf(370, 674, 28) + lotus(80, 660) + kitsu(210, 560, 150, 'eopen'))
    pips = ''.join('<div style="width:14px;height:14px;border-radius:7px;background:%s;border:2px solid %s"></div>' % ((C['red'], C['gold']) if i < 7 else ('#F2E2C0', '#E7C98E')) for i in range(24))
    opts = ''.join('<div style="display:flex;align-items:center;gap:14px;height:52px;padding:0 18px;border-radius:14px;background:%s;border:2px solid %s;font-size:18px;font-weight:%s"><kbd>%d</kbd>%s</div>' % ('#D9F5E4' if a else '#FFF9EA', C['jade'] if a else '#E7C98E', 700 if a else 500, i + 1, t) for i, (t, a) in enumerate([('hào hứng', 0), ('miễn cưỡng', 1), ('nhút nhát', 0), ('tức giận', 0)]))
    rate = ''.join('<button style="flex:1;height:84px;border-radius:16px;border:%s;background:%s;color:%s;font:700 16px \'Be Vietnam Pro\',sans-serif;cursor:pointer"><kbd>%d</kbd> %s<div style="font:500 13px \'Be Vietnam Pro\',sans-serif">sau %s</div></button>' % ('3px solid ' + C['gold'] if s_ else '2px solid #E7C98E', C['red'] if s_ else '#FFF9EA', '#fff' if s_ else C['brown'], i + 1, t, d) for i, (t, d, s_) in enumerate([('Quên', '10 phút', 0), ('Khó', '3 giờ', 0), ('Được', '2 ngày', 1), ('Dễ', '6 ngày', 0)]))
    body = ('<div class="v" style="width:1100px;height:720px">' + side(0, 430, sc)
            + '<div class="abs" style="left:20px;top:16px"><span class="pill">Về làng <kbd>Esc</kbd></span></div>'
            '<div class="abs" style="left:476px;right:40px;top:28px"><div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;color:%s"><span>Giếng làng</span><span>7 trên 24 từ</span></div><div style="display:flex;gap:6px;margin-top:8px">%s</div></div>' % (C['brown'], pips)
            + '<h1 class="t1 abs" style="left:476px;top:100px;font-size:76px">reluctant</h1>'
            '<div class="abs" style="left:476px;top:194px;display:flex;align-items:center;gap:14px;color:%s"><span class="ipa">/rɪˈlʌktənt/</span><span>tính từ</span><button class="ghost">Nghe <kbd>R</kbd></button></div>' % C['brown']
            + '<div class="abs" style="left:476px;top:246px;width:590px;font-size:17px">She was <b style="color:%s">reluctant</b> to lend him the money.</div>' % C['red']
            + '<div class="abs" style="left:476px;right:40px;top:298px;display:grid;grid-template-columns:1fr 1fr;gap:10px">' + opts + '</div>'
            '<div class="abs" style="left:476px;top:440px;font-size:15px;color:%s">Đúng rồi. Lần sau muốn gặp lại từ này khi nào? Gợi ý: Được.</div>' % C['brown']
            + '<div class="abs" style="left:476px;right:40px;top:478px;display:flex;gap:10px">' + rate + '</div>'
            '<div class="abs" style="left:476px;top:580px"><button class="ghost" style="padding:0">Hoàn tác <kbd>Z</kbd></button></div></div>')
    write('R2Review', 'Giếng làng, ôn từ', 1100, 720, body)

def r3():
    sc = (paper(370, 720) + '<path d="M-10 340C-10 200 100 150 190 170C300 130 390 200 380 340Z" fill="%s" opacity=".75"/>' % C['pink']
          + '<path d="M30 340L110 170L150 230L200 150L290 340Z" fill="#F58F8F" stroke="#fff" stroke-width="2"/>' + cloud(280, 100, .8) + crane(90, 110, .6)
          + '<path d="M-10 520C-10 400 100 350 190 356C300 350 380 400 380 520V730H-10Z" fill="%s" %s/>' % (C['leaf'], OUT % C['jade2'])
          + facade(185, 410, 240, 80, 5) + roof(185, 410, 300, 46) + '<rect x="130" y="330" width="110" height="36" fill="%s" %s/>' % (C['red'], OUT % C['ink']) + roof(185, 334, 170, 30, C['jade'], C['jade2'], C['gold'], C['gold'])
          + lantern(70, 410, 1.2) + lantern(300, 410, 1.2) + stonewall(-10, 490, 390, 46, [(185, 44)]) + trees(40, 490, .9) + trees(340, 490, .9)
          + '<path d="M-10 730V540C120 520 260 530 380 545V730Z" fill="%s"/>' % C['lime'] + kitsu(185, 690, 170, 'eopen') + lotusleaf(60, 690, 26) + lotusleaf(320, 696, 24) + lotus(320, 686, .8))
    ex = [('I', 'was', 'at home last night.', 'Tối qua tôi ở nhà.'), ('We', 'watched', 'a movie yesterday.', 'Hôm qua chúng tôi xem phim.'), ('She', 'went', 'to Da Nang last summer.', 'Hè năm ngoái cô ấy đi Đà Nẵng.')]
    rows = ''.join('<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-top:2px solid #E7C98E"><button aria-label="Nghe câu" style="width:36px;height:36px;flex:none;border:2px solid %s;border-radius:18px;background:%s;cursor:pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="6 3 20 12 6 21"/></svg></button><div><div style="font-size:19px;font-weight:500">%s <b style="color:%s;font-weight:800">%s</b> %s</div><div style="font-size:14px;color:%s">%s</div></div></div>' % (C['gold'], C['red'], a, C['red'], b, c, C['brown'], d) for a, b, c, d in ex)
    steps = ''.join('<span style="font-size:14px;font-weight:%s;color:%s">%s</span>' % (700 if i == 0 else 500, C['red'] if i == 0 else C['brown'], t) for i, t in enumerate(['1 Hiểu bài', '2 Ví dụ', '3 Luyện tập']))
    body = ('<div class="v" style="width:1100px;height:720px">' + side(730, 370, sc)
            + '<div class="abs" style="left:48px;top:20px;display:flex;gap:20px;align-items:center"><span class="pill">Về Trường làng <kbd>Esc</kbd></span>' + steps + '</div>'
            '<h1 class="t1 abs" style="left:48px;top:82px;font-size:56px">Thì quá khứ đơn</h1>'
            '<p class="abs" style="left:48px;top:154px;width:620px;margin:0;font-size:17px">Dùng khi việc đã xảy ra và đã kết thúc, thường kèm mốc thời gian như yesterday, last night, in 2019.</p>'
            '<svg class="abs" style="left:48px;top:222px" width="640" height="76" aria-label="Trục thời gian"><line x1="0" y1="48" x2="628" y2="48" stroke="%s" stroke-width="3"/><path d="M618 40L632 48L618 56" fill="none" stroke="%s" stroke-width="3"/><circle cx="210" cy="48" r="12" fill="%s" stroke="%s" stroke-width="3"/><line x1="500" y1="34" x2="500" y2="62" stroke="%s" stroke-width="3"/><text x="210" y="22" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="14" fill="%s">việc đã xong</text><text x="500" y="22" text-anchor="middle" font-family="Be Vietnam Pro" font-weight="700" font-size="14" fill="%s">bây giờ</text></svg>' % (C['brown'], C['brown'], C['red'], C['gold'], C['brown'], C['red'], C['brown'])
            + '<div class="abs" style="left:48px;top:312px;width:640px">' + rows + '</div>'
            '<div class="abs" style="left:48px;top:556px;width:640px;background:#FFE9B8;border:2px solid %s;border-radius:14px;padding:12px 16px;font-size:15px">Hay nhầm: viết <b>Did he went?</b> Sau did, động từ về nguyên mẫu: <b style="color:%s">Did he go?</b></div>' % (C['gold'], C['red'])
            + '<div class="abs" style="left:48px;top:636px;display:flex;align-items:center;gap:16px"><button class="go">Làm 10 câu luyện tập</button><span style="color:%s">Khoảng 4 phút</span></div></div>' % C['brown'])
    write('R3Lesson', 'Trường làng, bài học', 1100, 720, body)

r1(); r2(); r3(); print('ok')
