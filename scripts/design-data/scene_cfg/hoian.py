"""Cấu hình cảnh Hội An (xem scene_config.py)."""

CFG = {
    'label': 'Hội An: phố cổ và đèn lồng',
    'bg': 'hoian-bg.png',
    'sheets': {'L': ('hoian-lanterns.png', 3), 'A': ('hoian-sprites-A.png', 3), 'B': ('hoian-sprites-B.png', 3)},
    'birds': 'none',
    'sky': {'x': [600, 1000], 'y': [10, 110], 'sun': [800, 85]},
    'actors': [
        {'name': 'girl', 'sheet': 'A', 'row': 0, 'x': 560, 'y': 692, 'h': 80, 'erase': [(0.62, 0.68, 1.0, 1.0), (0.0, 0.80, 1.0, 1.0), (0.68, 0.70, 0.80, 0.82)], 'crop': (0, 0, 0, 0.20), 'kind': 'pingpong', 'frameMs': 500},
        {'name': 'granny', 'sheet': 'A', 'row': 1, 'x': 250, 'y': 645, 'h': 140, 'kind': 'pingpong', 'frameMs': 500},
        {'name': 'kite', 'sheet': 'B', 'row': 2, 'x': 1330, 'y': 895, 'h': 150, 'kind': 'pingpong', 'frameMs': 400},
        # đèn lồng: neo đỉnh vào móc ở mái hiên, lắc chậm, có vầng sáng
        {'name': 'moored', 'sheet': 'B', 'row': 1, 'deholes': True, 'x': 940, 'y': 770, 'h': 120, 'kind': 'pingpong', 'frameMs': 500},
        {'name': 'lantern_red', 'sheet': 'L', 'row': 0, 'kind': 'loop', 'hang': True, 'deholes': True, 'h': 90, 'frameMs': 400, 'glow': 198,
         'points': [(222, 206, 1.0), (502, 303, 0.9), (269, 425, 0.85), (1415, 452, 1.0)]},
        {'name': 'lantern_yellow', 'sheet': 'L', 'row': 1, 'kind': 'loop', 'hang': True, 'deholes': True, 'h': 95, 'frameMs': 440, 'glow': 209,
         'points': [(393, 284, 1.0), (202, 428, 1.1), (531, 478, 0.95), (1385, 452, 0.9)]},
        {'name': 'lantern_cluster', 'sheet': 'L', 'row': 2, 'kind': 'loop', 'hang': True, 'deholes': True, 'h': 100, 'frameMs': 380, 'glow': 220,
         'points': [(74, 172, 1.2), (1502, 368, 1.0)]},
    ],
    'lanes': [
        # đường chéo theo lòng kênh: s0/s1 = tỉ lệ cỡ ở x[0]/x[1], h = cỡ ở tỉ lệ 1
        {'name': 'flowerL', 'y': 828, 'y1': 690, 's0': 1.0, 's1': 0.5, 'dir': -1, 'x': [360, 900], 'fade': [60, 120], 'gap': [3500, 7000],
         'frameMs': 250, 'maxActive': 2, 'bob': 2,
         'variants': [{'name': 'lotus', 'sheet': 'A', 'row': 2, 'h': 60, 'speed': [14, 22], 'weight': 1}]},
        {'name': 'flowerR', 'y': 690, 'y1': 822, 's0': 0.5, 's1': 1.0, 'dir': 1, 'x': [1020, 1460], 'fade': [120, 60], 'gap': [3500, 7000],
         'frameMs': 250, 'maxActive': 2, 'bob': 2,
         'variants': [{'name': 'lotus', 'sheet': 'A', 'row': 2, 'h': 60, 'speed': [14, 22], 'weight': 1}]},
        {'name': 'boatIn', 'y': 810, 'y1': 662, 's0': 1.0, 's1': 0.55, 'dir': 1, 'x': [320, 900], 'fade': [60, 130], 'gap': [9000, 18000],
         'frameMs': 160, 'maxActive': 1, 'bob': 3,
         'variants': [
             {'name': 'rower', 'sheet': 'B', 'row': 0, 'h': 130, 'speed': [35, 50], 'weight': 1},
             {'name': 'tourist', 'sheet': 'B', 'row': 1, 'h': 140, 'speed': [32, 45], 'weight': 1, 'deholes': True},
         ]},
        {'name': 'boatOut', 'y': 662, 'y1': 810, 's0': 0.55, 's1': 1.0, 'dir': 1, 'x': [1000, 1440], 'fade': [130, 60], 'gap': [9000, 18000],
         'frameMs': 160, 'maxActive': 1, 'bob': 3,
         'variants': [
             {'name': 'rower', 'sheet': 'B', 'row': 0, 'h': 130, 'speed': [35, 50], 'weight': 1},
             {'name': 'tourist', 'sheet': 'B', 'row': 1, 'h': 140, 'speed': [32, 45], 'weight': 1, 'deholes': True},
         ]},
    ],
}
