# Bộ dựng bảng dùng chung cho thiết kế lại v2. Mọi bảng toàn app phải sinh từ đây để cùng token, cùng component.
#   from board_kit import *
#   write('StudyHome', study_shell('home', body), 1100, 720)
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, 'tokens.json'), encoding='utf-8'))
OUT = os.environ.get('BOARD_OUT', '.')

def _vars(d):
    return ';'.join('--%s:%s' % (k, v) for k, v in d.items())

CSS = """
:root{%(light)s;--r-sm:8px;--r-md:12px;--r-lg:16px;--r-pill:999px;--shadow:0 1px 2px rgba(43,43,58,.06),0 1px 3px rgba(43,43,58,.08)}
.dark{%(dark)s}
body{margin:0}
.t{font-family:'Be Vietnam Pro',system-ui,sans-serif;font-size:14px;line-height:1.5;color:var(--ink);background:var(--bg);box-sizing:border-box}
.t *{box-sizing:border-box}
.h1,.h2,.h3{font-family:'Be Vietnam Pro',sans-serif;font-weight:800;letter-spacing:-.02em;margin:0;line-height:1.15}
.h1{font-size:32px}.h2{font-size:26px}.h3{font-size:20px}
.soft{color:var(--inkSoft)}.sm{font-size:13px}.xs{font-size:12px}
.ipa{font-family:'Noto Sans',sans-serif}
.card{background:var(--surface);border:2px solid var(--line);border-radius:var(--r-lg);padding:16px}
.row{display:flex;align-items:center;gap:12px}.col{display:flex;flex-direction:column;gap:12px}
.grid{display:grid;gap:12px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:36px;padding:0 16px;border-radius:var(--r-pill);border:2px solid var(--line);background:var(--surface);color:var(--ink);font:600 14px 'Be Vietnam Pro',sans-serif;cursor:pointer;white-space:nowrap}
.btn--primary{background:var(--primary);border-color:var(--coin);color:#fff}
.btn--success{background:var(--success);border-color:var(--success);color:#fff}
.btn--danger{color:var(--danger);border-color:var(--danger)}
.btn--ghost{background:transparent;border-color:transparent}
.btn--icon{width:36px;padding:0}
.btn--xs{height:28px;padding:0 12px;font-size:13px}
.dark .btn--primary,.dark .btn--success{color:var(--bg)}
.chip{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 12px;border-radius:var(--r-pill);font:700 12px 'Be Vietnam Pro',sans-serif;background:var(--surface2);color:var(--inkSoft)}
.chip--primary{background:var(--primarySoft);color:var(--primary)}.chip--success{background:var(--successSoft);color:var(--success)}
.chip--warning{background:var(--warningSoft);color:var(--warning)}.chip--danger{background:var(--dangerSoft);color:var(--danger)}.chip--xp{background:var(--xpSoft);color:var(--xp)}
.bar{height:8px;border-radius:var(--r-pill);background:var(--surface2);overflow:hidden}.bar>i{display:block;height:100%%;border-radius:var(--r-pill);background:var(--primary)}
.input{height:36px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--surface);padding:0 12px;display:flex;align-items:center;color:var(--inkSoft)}
.item{display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:var(--r-md);border:2px solid var(--line);background:var(--surface)}
.side{width:216px;flex:none;background:var(--surface);border-right:1px solid var(--line);padding:16px 12px;display:flex;flex-direction:column;gap:4px}
.nav{display:flex;align-items:center;gap:12px;height:36px;padding:0 12px;border-radius:var(--r-md);color:var(--inkSoft);font-weight:600}
.nav.on{background:var(--primarySoft);color:var(--primary)}
.tabs{display:inline-flex;gap:4px;padding:4px;border-radius:var(--r-md);background:var(--surface2)}
.tab{display:flex;align-items:center;gap:8px;height:28px;padding:0 12px;border-radius:var(--r-sm);font-weight:600;font-size:13px;color:var(--inkSoft);white-space:nowrap}
.tab.on{background:var(--surface);color:var(--ink);box-shadow:var(--shadow)}
.grow{flex:1;min-width:0}
.clip{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.ic{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;flex:none}
""" % {'light': _vars(T['color']), 'dark': _vars(T['dark'])}

# Icon Lucide (ISC), lấy nguyên path từ lucide-vue-next. Thiếu icon thì thêm vào đây, không tự vẽ trong bảng.
ICONS = {
 'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
 'book': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
 'repeat': '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
 'list': '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
 'chat': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
 'paw': '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
 'shop': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
 'chart': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
 'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 'volume': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
 'mic': '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>',
 'check': '<polyline points="20 6 9 17 4 12"/>',
 'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
 'star': '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"/>',
 'lock': '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
 'bookmark': '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
 'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
 'play': '<polygon points="6 3 20 12 6 21 6 3"/>',
 'pause': '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
 'chevron': '<polyline points="9 18 15 12 9 6"/>',
 'back': '<polyline points="15 18 9 12 15 6"/>',
 'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
 'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 'headphones': '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
 'pen': '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
 'award': '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
 'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
 'coins': '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
 'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
 'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
 'copy': '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
 'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
 'gift': '<path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/>',
 'skip-back': '<path d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z"/><path d="M3 20V4"/>',
 'skip-forward': '<path d="M21 4v16"/><path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z"/>',
 'turtle': '<path d="m12 10 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a8 8 0 1 0-16 0v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3l2-4h4Z"/><path d="M4.82 7.9 8 10"/><path d="M15.18 7.9 12 10"/><path d="M16.93 10H20a2 2 0 0 1 0 4H2"/>',
 'languages': '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
 'layers': '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
 'sprout': '<path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/>',
 'circle': '<circle cx="12" cy="12" r="10"/>',
 'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
 'rocket': '<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/><path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/>',
 'calendar': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
 'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
 'timer': '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
 'trending': '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
 'down': '<path d="m6 9 6 6 6-6"/>',
 'up': '<path d="m18 15-6-6-6 6"/>',
 'trash': '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
 'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
 'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
 'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
 'package': '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
 'test': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
 'bolt': '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
 'heart': '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
 'cap': '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
 'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 'map': '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
 'delete': '<path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="m12 9 6 6"/><path d="m18 9-6 6"/>',
 'eye': '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
 'pointer': '<path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
 'ear': '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/>',
 'stop': '<rect width="18" height="18" x="3" y="3" rx="2"/>',
 'mic-off': '<path d="M12 19v3"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M16.95 16.95A7 7 0 0 1 5 12v-2"/><path d="M18.89 13.23A7 7 0 0 0 19 12v-2"/><path d="m2 2 20 20"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>',
 'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
 'loader': '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
}

def icon(name, cls='ic', style=''):
    return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true"%s>%s</svg>' % (cls, (' style="%s"' % style) if style else '', ICONS[name])

def btn(label, kind='', ic=None):
    return '<button class="btn%s">%s%s</button>' % ((' btn--' + kind) if kind else '', icon(ic) if ic else '', label)

def chip(label, kind=''):
    return '<span class="chip%s">%s</span>' % ((' chip--' + kind) if kind else '', label)

def bar(pct, color='primary'):
    return '<div class="bar"><i style="width:%d%%;background:var(--%s)"></i></div>' % (pct, color)

NAV = [('home', 'home', 'Trang chủ'), ('courses', 'book', 'Lộ trình'), ('review', 'repeat', 'Ôn từ'), ('practice', 'pen', 'Luyện tập'), ('words', 'list', 'Sổ từ'), ('phrases', 'chat', 'Mẫu câu'), ('pet', 'paw', 'Thú cưng'), ('shop', 'shop', 'Cửa hàng'), ('stats', 'chart', 'Thống kê'), ('settings', 'settings', 'Cài đặt')]

PLACE = {'home': 'Làng chữ', 'courses': 'Trường làng', 'review': 'Giếng làng', 'practice': 'Đình làng', 'words': 'Thư các', 'phrases': 'Bến thuyền', 'pet': 'Nhà của Kitsu', 'shop': 'Chợ quê', 'stats': 'Tháp Bút', 'settings': 'Đình làng'}
_vg = None
def village():
    """Nạp bộ vẽ làng (review/gen_village3.py) một lần; dùng chung cho cảnh mọi màn."""
    global _vg
    if _vg is None:
        import importlib.util, sys
        argv = sys.argv; sys.argv = ['x', OUT]
        sp = importlib.util.spec_from_file_location('gen_village3', os.path.join(HERE, '..', 'review', 'gen_village3.py'))
        _vg = importlib.util.module_from_spec(sp); sp.loader.exec_module(_vg); sys.argv = argv
    return _vg

_scene = {}
def place_scene(key, dark=False):
    if (key, dark) not in _scene: _scene[(key, dark)] = village().panel_place(key, dark)
    return _scene[(key, dark)]

def study_shell(active, body, dark=False):
    """Khung màn trong 1100×720: cảnh địa điểm bên trái + nội dung trên nền giấy. Về làng để chuyển mục, không có thanh bên."""
    return ('<div class="t%s" style="width:1100px;height:720px;display:flex;overflow:hidden;position:relative">'
            '%s<div style="width:216px;flex:none;position:relative">%s'
            '<div style="position:absolute;left:12px;top:12px;display:flex;flex-direction:column;gap:8px;align-items:flex-start"><span class="chip" style="height:32px;background:var(--surface);color:var(--ink);border:2px solid var(--line)">Về làng <kbd style="font:500 12px \'Be Vietnam Pro\'">Esc</kbd></span><span class="chip" style="height:28px;background:var(--primary);color:var(--surface);border:2px solid var(--coin)">%s</span></div></div>'
            '<div style="flex:1;min-width:0;padding:24px;display:flex;flex-direction:column;gap:16px;overflow:hidden">%s</div></div>') % (' dark' if dark else '', village().KDEFS, place_scene(active, dark), PLACE.get(active, 'Làng chữ'), body)

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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700&amp;family=Baloo+2:wght@700;800&amp;family=Noto+Sans:wght@400;600&amp;display=swap">
<style>%s%s</style>
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

def write(name, body, w, h, title=None, css=''):
    if 'class="spin"' in body or 'class="sway"' in body: css = village().ANIM.replace('%%', '%') + css
    """Ghi <BOARD_OUT>/<name>.dc.html. `css` chỉ dành cho keyframes/bố cục riêng, không định nghĩa lại component."""
    html = HEAD % (title or name, CSS, css, body, w, h)
    p = os.path.join(OUT, name + '.dc.html')
    open(p, 'w', encoding='utf-8').write(html)
    return p
