# Vật dùng chung cho các cảnh địa điểm: xích lô (ảnh thật: ghế khách phía trước giữa hai bánh, người đạp ngồi sau), thuyền vịt.
INK = '#1E1612'

def xichlo(x, y, s=1, seat='#C7322E', hood='#D9432E', pax='#F2F2E8', hat='#F7E2A8'):
    """Nhìn ngang, đi về bên trái."""
    o = '<g transform="translate(%d %d) scale(%.2f)"><ellipse cx="4" cy="2" rx="64" ry="5" fill="#120A08" opacity=".3"/>' % (x, y, s)
    def wheel(cx, r):
        w = '<circle cx="%d" cy="%d" r="%d" fill="none" stroke="#1E1A20" stroke-width="2.6"/>' % (cx, -r, r)
        for i in range(4): w += '<path d="M%d %dh%dM%d %dv%d" stroke="#8A8A92" stroke-width=".7" transform="rotate(%d %d %d)"/>' % (cx - r, -r, 2 * r, cx, -2 * r, 2 * r, i * 45, cx, -r)
        return w + '<circle cx="%d" cy="%d" r="2.4" fill="#3A3A44"/>' % (cx, -r)
    # bánh xa của cặp bánh trước, rồi khung
    o += '<g opacity=".55">' + wheel(-22, 15) + '</g>' + wheel(46, 17)
    o += '<path d="M-10 -22L46 -17M-6 -60L28 -50L24 -20M24 -20L46 -17M28 -50L46 -17" stroke="#3E6A72" stroke-width="3" fill="none" stroke-linecap="round"/>'
    # ghế khách: tựa cao phía sau, đệm, bàn để chân phía trước
    o += '<path d="M-8 -66Q-14 -68 -16 -60L-20 -32H-50Q-56 -32 -55 -25L-53 -20H-8Z" fill="%s" stroke="%s" stroke-width="1.5" stroke-linejoin="round"/>' % (seat, INK)
    o += '<path d="M-53 -22L-64 -10H-46" fill="none" stroke="#3E6A72" stroke-width="3" stroke-linejoin="round"/>'
    # khách ngồi tựa
    o += '<path d="M-18 -34L-44 -36L-54 -13" stroke="#2E3A5A" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-59 -11h9" stroke="#3A2413" stroke-width="3.4" stroke-linecap="round"/>'
    o += '<path d="M-28 -32Q-30 -56 -22 -60Q-14 -60 -14 -52L-14 -32Z" fill="%s" stroke="%s" stroke-width="1"/>' % (pax, INK)
    o += '<path d="M-22 -54L-34 -42L-42 -40" stroke="%s" stroke-width="4.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' % pax
    o += '<circle cx="-22" cy="-66" r="6.4" fill="#E8B98E" stroke="#3A2413" stroke-width=".8"/><path d="M-34 -67Q-22 -83 -11 -67Q-22 -63 -34 -67Z" fill="%s" stroke="#8A6A3A"/>' % hat
    o += wheel(-30, 15)
    # mui trên hai cọc, ngay trên đầu khách
    o += '<path d="M-10 -60L-6 -92M-58 -32L-60 -90" stroke="#B8BEC4" stroke-width="2"/><path d="M-68 -90Q-34 -106 2 -92L0 -86H-66Z" fill="%s" stroke="%s" stroke-width="1.4" stroke-linejoin="round"/>' % (hood, INK)
    for i in range(7): o += '<path d="M%d -86q4 6 9.4 0" fill="#F7B91A" stroke="#8A5A1A" stroke-width=".6"/>' % (-66 + i * 9.4)
    # người đạp ngồi sau, tay giữ tay lái sau lưng ghế
    o += '<path d="M24 -56L8 -38L16 -20" stroke="#3A3A48" stroke-width="5.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 -20h11" stroke="#2A1A10" stroke-width="3" stroke-linecap="round"/><path d="M24 -20L16 -20" stroke="#3A3A44" stroke-width="2"/><circle cx="24" cy="-20" r="4" fill="none" stroke="#3A3A44" stroke-width="1.6"/>'
    o += '<path d="M21 -52h16" stroke="#2A1A10" stroke-width="4" stroke-linecap="round"/>'
    o += '<path d="M19 -54Q17 -80 26 -84Q36 -84 36 -74L34 -54Z" fill="#8A5A3A" stroke="%s" stroke-width="1"/><path d="M26 -76L10 -66L-4 -64" stroke="#8A5A3A" stroke-width="4.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="-4" cy="-63" r="2.6" fill="#D9A070"/>' % INK
    o += '<circle cx="27" cy="-92" r="6" fill="#D9A070" stroke="#3A2413" stroke-width=".8"/><path d="M13 -92L27 -106L40 -92Q27 -88 13 -92Z" fill="#F7E2A8" stroke="#8A6A3A"/>'
    return o + '</g>'

def swanboat(x, y, s=1, roof='#2FB8C6', a='#E8543E', b='#2E5AA8'):
    """Thuyền đạp hình thiên nga, nhìn ngang, đầu quay trái."""
    o = '<g class="rock"><g transform="translate(%d %d) scale(%.2f)"><ellipse cy="15" rx="56" ry="6" fill="#123A4A" opacity=".3"/>' % (x, y, s)
    # người trên ghế, che bởi thân
    o += '<path d="M-2 -6Q-4 -28 6 -30Q16 -30 16 -6Z" fill="%s" stroke="%s"/><circle cx="6" cy="-37" r="7" fill="#E8B98E" stroke="#3A2413" stroke-width=".8"/><path d="M-1 -39Q6 -48 13 -39Q6 -36 -1 -39Z" fill="#2A1A10"/>' % (a, INK)
    o += '<path d="M20 -6Q18 -26 27 -28Q36 -28 36 -6Z" fill="%s" stroke="%s"/><circle cx="27" cy="-35" r="6.4" fill="#E8B98E" stroke="#3A2413" stroke-width=".8"/><path d="M20 -37Q27 -46 34 -37Q27 -33 20 -37Z" fill="#F7E2A8" stroke="#8A6A3A"/>' % (b, INK)
    # thân tròn đầy, đuôi vểnh
    o += '<path d="M-38 -8Q-42 14 -8 15H26Q46 14 52 -2Q60 -10 62 -24Q50 -18 40 -14Q10 -2 -38 -8Z" fill="#FFF9EA" stroke="%s" stroke-width="1.6" stroke-linejoin="round"/>' % INK
    # cánh áp thân
    o += '<path d="M-20 0Q2 -10 34 -6Q26 11 4 11Q-14 11 -20 0Z" fill="#F2E8D2" stroke="%s" stroke-width="1.2"/><path d="M-6 3Q6 0 20 0M-2 7Q8 5 16 5" stroke="#B8A888" stroke-width="1.2" fill="none" stroke-linecap="round"/>' % INK
    # cổ cong chữ S có viền, đầu, mỏ cam, bướu đen
    neck = 'M-30 -4Q-52 -16 -42 -36Q-34 -52 -46 -62'
    o += '<path d="%s" stroke="%s" stroke-width="12.4" fill="none" stroke-linecap="round"/><path d="%s" stroke="#FFF9EA" stroke-width="9.6" fill="none" stroke-linecap="round"/>' % (neck, INK, neck)
    o += '<ellipse cx="-48" cy="-64" rx="9" ry="7" fill="#FFF9EA" stroke="%s" stroke-width="1.3"/><path d="M-55 -67L-71 -60L-54 -59Z" fill="#F2884A" stroke="%s" stroke-linejoin="round"/><path d="M-55 -68q-3 3 -1 7l5 -3Z" fill="%s"/><circle cx="-49" cy="-66" r="1.7" fill="%s"/>' % (INK, INK, INK, INK)
    # mui nhỏ trên hai cọc, không che người
    o += '<path d="M-6 -6V-52M42 -14V-52" stroke="#6A7A82" stroke-width="2"/><path d="M-14 -52Q18 -68 50 -52Z" fill="%s" stroke="%s" stroke-width="1.3" stroke-linejoin="round"/>' % (roof, INK)
    return o + '</g></g>'
