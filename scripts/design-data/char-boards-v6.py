# Lupo (sói) thay Webby (nhện). Chạy cùng thư mục với gen_char2.py + char-boards-v5.py: python char-boards-v6.py <out>
import sys, re
src = open('char-boards-v5.py', encoding='utf-8').read().split("open(OUT + '/CharDraco")[0]
exec(src)

LD = """
<radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#BFD4FF" stop-opacity=".9"/><stop offset="1" stop-color="#BFD4FF" stop-opacity="0"/></radialGradient>
<radialGradient id="moonf" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="#FFFDF0"/><stop offset="1" stop-color="#FFE9A8"/></radialGradient>
<linearGradient id="aur" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8FF0D8"/><stop offset=".5" stop-color="#8FB8FF"/><stop offset="1" stop-color="#D3A8FF"/></linearGradient>
<g id="lear"><path d="M34 56C26 36 28 14 38 6C54 12 68 26 72 44Z" style="fill:var(--f,#8FA6C8)"/><path d="M42 46C38 34 39 24 43 18C52 23 59 32 63 41Z" style="fill:var(--ein,#FFC9D2)"/><path d="M38 6C42 8 46 10 49 14C44 14 40 17 37 21C35 16 35 10 38 6Z" style="fill:var(--f2,#6B82A8)"/></g>
<g id="ltail"><path d="M100 136C126 146 156 132 160 102C162 88 152 74 142 72C146 88 136 100 120 104C110 106 102 112 100 120Z" style="fill:var(--f,#8FA6C8)"/><path d="M160 102C162 88 152 74 142 72C145 80 143 88 138 94C146 92 154 95 160 102Z" style="fill:var(--c,#FFF6E6)"/></g>
<g id="lbody">
<path d="M80 96C54 96 46 118 48 132C50 146 62 150 80 150C98 150 110 146 112 132C114 118 106 96 80 96Z" style="fill:var(--f,#8FA6C8)"/>
<path d="M56 106C60 114 66 110 68 118C72 112 76 122 80 116C84 122 88 112 92 118C94 110 100 114 104 106C106 124 96 140 80 140C64 140 54 124 56 106Z" style="fill:var(--c,#FFF6E6)"/>
<ellipse cx="65" cy="146" rx="11" ry="6.5" style="fill:var(--c,#FFF6E6)"/><ellipse cx="95" cy="146" rx="11" ry="6.5" style="fill:var(--c,#FFF6E6)"/>
<g style="fill:var(--ein,#FFC9D2)"><circle cx="61" cy="148" r="1.8"/><circle cx="66" cy="149" r="1.8"/><circle cx="94" cy="149" r="1.8"/><circle cx="99" cy="148" r="1.8"/></g>
</g>
<g id="lhead">
<use href="#lear"/><use href="#lear" transform="translate(160 0) scale(-1 1)"/>
<g style="fill:var(--f,#8FA6C8);stroke:var(--f,#8FA6C8);stroke-width:5;stroke-linejoin:round"><path d="M34 72L22 78L31 84L24 94L40 96Z"/><path d="M126 72L138 78L129 84L136 94L120 96Z"/></g>
<ellipse cx="80" cy="72" rx="52" ry="40" style="fill:var(--f,#8FA6C8)"/>
<ellipse cx="56" cy="44" rx="15" ry="5.5" fill="#fff" opacity=".3" transform="rotate(-22 56 44)"/>
<g style="fill:var(--c,#FFF6E6);stroke:var(--c,#FFF6E6);stroke-width:4;stroke-linejoin:round"></g>
<path d="M29 78C40 62 62 62 80 80C98 62 120 62 131 78C126 100 104 111 80 111C56 111 34 100 29 78Z" style="fill:var(--c,#FFF6E6)"/>
<path d="M80 34C74 44 74 62 80 74C86 62 86 44 80 34Z" style="fill:var(--f2,#6B82A8)"/>
<path d="M68 90C68 83 92 83 92 90C92 100 68 100 68 90Z" fill="#fff"/>
<path d="M74 84.5Q80 82 86 84.5Q84 90 80 91Q76 90 74 84.5Z" fill="#3A2F40"/><ellipse cx="78" cy="85" rx="1.6" ry="1" fill="#fff" opacity=".7"/>
<path d="M80 91V94M73 95q3.5 4 7-1q3.5 5 7 1" stroke="#3A2F40" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<ellipse cx="41" cy="90" rx="8" ry="4.5" fill="#FF9FB0" opacity=".75"/><ellipse cx="119" cy="90" rx="8" ry="4.5" fill="#FF9FB0" opacity=".75"/>
<g class="blink"><ellipse cx="57" cy="77" rx="9" ry="11" fill="#2E2A44"/><ellipse cx="57" cy="83" rx="6" ry="4.6" style="fill:var(--iris,#5FA8E8)"/><circle cx="54" cy="72" r="4" fill="#fff"/><circle cx="60.5" cy="82" r="1.9" fill="#fff"/>
<ellipse cx="103" cy="77" rx="9" ry="11" fill="#2E2A44"/><ellipse cx="103" cy="83" rx="6" ry="4.6" style="fill:var(--iris,#5FA8E8)"/><circle cx="100" cy="72" r="4" fill="#fff"/><circle cx="106.5" cy="82" r="1.9" fill="#fff"/></g>
</g>
<g id="lmoon"><path d="M6 -11A12 12 0 1 0 6 11A9.5 9.5 0 1 1 6 -11Z" style="fill:var(--moon,#FFE08A)"/></g>
<g id="lstar"><path d="M0 -9L2.2 -2.6L9 -2.2L3.6 1.8L5.4 8.4L0 4.6L-5.4 8.4L-3.6 1.8L-9 -2.2L-2.2 -2.6Z" fill="#FFE9A8"/></g>
<g id="lmane"><path d="M46 104C22 96 2 72 8 42C20 62 28 70 42 74C24 56 26 30 38 14C42 40 50 56 62 66Z" fill="url(#aur)"/><path d="M38 96C24 88 16 76 16 62C24 74 32 78 44 82Z" fill="#fff" opacity=".45"/></g>
<g id="ltail2"><path d="M100 138C130 150 178 138 198 94C206 74 200 48 186 34C188 58 176 72 156 84C136 96 112 104 100 118Z" fill="url(#aur)"/><path d="M104 132C132 136 164 122 182 92C166 110 138 118 104 122Z" fill="#fff" opacity=".4"/></g>
"""

def lupo():
    S = []
    S.append(card('<ellipse cx="80" cy="146" rx="36" ry="6" fill="#2B2B3A" opacity=".12"/><g class="bob">'
        '<ellipse cx="80" cy="98" rx="42" ry="50" fill="#DDE6F5"/><path d="M44 76Q62 92 80 78T116 76C114 56 100 48 80 48S46 56 44 76Z" fill="#8FA6C8"/>'
        '<path d="M56 54L52 36L68 48ZM104 54L108 36L92 48Z" fill="#8FA6C8" stroke="#8FA6C8" stroke-width="4" stroke-linejoin="round"/>'
        '<use href="#lmoon" transform="translate(80 110) scale(1.15)"/><ellipse cx="60" cy="74" rx="4" ry="11" fill="#fff" opacity=".5" transform="rotate(18 60 74)"/></g>',
        'Lv 1', 'background:#F6EEDB;color:#5E5E73', 'Trứng trăng', 'Vỏ lông mềm, trăng non nằm giữa bụng'))
    S.append(card('<ellipse cx="80" cy="147" rx="36" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' + scaled(
        '<g class="wag"><use href="#ltail" transform="translate(100 128) scale(.72) translate(-100 -128)"/></g><use href="#lbody"/><use href="#lhead"/>', .78, 80, 148) + '</g>',
        'Lv 2–9', 'background:#EEE6FF;color:#5A33B8', 'Sói con', 'Đầu to, má xù, đuôi bé như cún'))
    S.append(card('<ellipse cx="80" cy="147" rx="42" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob">' + scaled(
        '<g class="wag"><use href="#ltail"/></g><use href="#lbody"/>'
        '<path d="M52 104Q80 122 108 104L106 116Q80 134 54 116Z" fill="#3F6FE0"/><path d="M96 118q10 4 8 18q-8 2 -12 -4z" fill="#2F58BD"/>'
        '<use href="#lhead"/><use href="#lmoon" transform="translate(80 46) scale(.5)"/>', .88, 80, 148) + '</g>',
        'Lv 10–24', 'background:#EEE6FF;color:#5A33B8', 'Sói non', 'Trăng non trên trán, khăn xanh, đuôi bông', vb='-14 -10 196 170'))
    S.append(card('<circle cx="80" cy="66" r="66" fill="url(#moonf)" opacity=".85"/><ellipse cx="80" cy="147" rx="46" ry="5" fill="#2B2B3A" opacity=".12"/><g class="bob" style="--f:#7F97C4;--f2:#5A72A0;--iris:#7FE0E8">' + scaled(
        '<g class="wl"><use href="#lmane" transform="translate(46 100) scale(.9) translate(-46 -100)"/></g><g class="wr"><g transform="translate(160 0) scale(-1 1)"><use href="#lmane" transform="translate(46 100) scale(.9) translate(-46 -100)"/></g></g>'
        '<g class="wag"><use href="#ltail"/></g><use href="#lbody"/>'
        '<path d="M50 104Q80 124 110 104L106 118Q80 136 54 118Z" fill="#FFD66B"/><circle cx="80" cy="124" r="5" fill="#7FE0E8" stroke="#fff" stroke-width="1.6"/>'
        '<use href="#lhead"/><use href="#lmoon" transform="translate(80 46) scale(.7)"/>', .9, 80, 148) + '</g>'
        '<use href="#lstar" class="tk" transform="translate(-14 26) scale(.7)"/><use href="#lstar" class="tk" style="--d:-.8s" transform="translate(170 40) scale(.6)"/>',
        'Lv 25–49', 'background:#EEE6FF;color:#5A33B8', 'Sói trăng', 'Bờm cực quang nhú, vòng ngọc, đứng trước trăng', vb='-34 -14 228 176'))
    stars = ''.join('<use href="#lstar" class="tk" style="--d:-%.1fs" transform="translate(%d %d) scale(%.2f)"/>' % (d, x, y, s) for x, y, s, d in [(-70, 16, .9, .2), (-40, -24, .6, .9), (214, -18, .7, .5), (240, 40, .9, 1.3), (-82, 96, .6, .7)])
    S.append(card('<circle cx="80" cy="80" r="170" fill="url(#aura)" class="pulse"/>'
        '<circle cx="80" cy="66" r="84" fill="url(#moonf)"/><circle cx="50" cy="34" r="11" fill="#F3DFA0" opacity=".5"/><circle cx="116" cy="84" r="15" fill="#F3DFA0" opacity=".45"/><circle cx="118" cy="22" r="7" fill="#F3DFA0" opacity=".5"/>'
        '<g class="rx" style="transform-origin:80px 66px"><circle cx="80" cy="66" r="92" fill="none" stroke="#FFE9A8" stroke-width="3"/></g>'
        '<ellipse cx="80" cy="152" rx="50" ry="5" fill="#2B2B3A" opacity=".12"/>'
        '<g class="bob" style="--f:#F2F6FF;--f2:#BFD0F0;--c:#FFFFFF;--ein:#FFD3E0;--iris:#7FD8F0">' + scaled(
        '<g class="wl"><use href="#lmane" transform="translate(46 100) scale(1.55) translate(-46 -100)"/></g><g class="wr"><g transform="translate(160 0) scale(-1 1)"><use href="#lmane" transform="translate(46 100) scale(1.55) translate(-46 -100)"/></g></g>'
        '<g class="wag"><use href="#ltail2"/></g><use href="#lbody"/>'
        '<path d="M50 104Q80 124 110 104L106 118Q80 136 54 118Z" fill="#FFD66B"/><circle cx="80" cy="124" r="6" fill="#7FD8F0" stroke="#fff" stroke-width="2"/>'
        '<use href="#lhead"/><use href="#lmoon" transform="translate(80 46) scale(.8)" style="--moon:#FFC94D"/>', 1.12, 80, 150) + '</g>' + stars,
        'Lv 50+', 'background:#FFF0CC;color:#7A4A06', 'Ngân Lang', 'Lông bạc, bờm và đuôi cực quang bay, trăng tròn sau lưng',
        'border-color:#C9D6F2;background:linear-gradient(180deg,#fff,#EEF3FF)', vb='-112 -46 384 210'))
    cols = 'minmax(0,.75fr) minmax(0,.85fr) minmax(0,1fr) minmax(0,1.2fr) minmax(0,1.7fr)'
    sw = [('#8FA6C8', 'lông', 0), ('#6B82A8', 'lông đậm', 1), ('#FFF6E6', 'mặt · ngực', 0), ('#3F6FE0', 'khăn', 1), ('#FFE08A', 'trăng', 0), ('#8FB8FF', 'cực quang', 0)]
    note = ('<b>Thay nhện bằng sói:</b> cùng tỉ lệ với Kitsu (đầu to, má xù, 2 mắt to) nhưng màu xanh xám lạnh để không lẫn với cáo cam. '
            '<b>Tiến hoá theo pha trăng:</b> trứng trăng → sói con → trăng non trên trán → đứng trước trăng, bờm cực quang nhú → <b>Ngân Lang</b>: lông đổi bạc, bờm và đuôi hoá cực quang, trăng tròn sau lưng.<br>'
            '<b>Hoạt ảnh:</b> thở, chớp mắt, vẫy đuôi, bờm bay, sao nhấp nháy. Tên tạm <b>Lupo</b>, đổi được.')
    return page4('Lupo character sheet', 'Lupo · sói con tới Ngân Lang', 'Thay cho Webby. Tiến hoá theo pha trăng.', ''.join(S), cols, sw, note, LD)

open(OUT + '/CharLupo.dc.html', 'w', encoding='utf-8').write(lupo().replace('Bản vẽ v5', 'Bản vẽ v1'))
print('ok')
