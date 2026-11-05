"""Cấu hình cảnh Ninh Bình (xem scene_config.py)."""

_BOATS = lambda h: [
    {'name': 'boat', 'sheet': 'B', 'row': 0, 'h': h, 'speed': [35, 55], 'weight': 3},
    {'name': 'boat', 'sheet': 'B', 'row': 1, 'h': h, 'speed': [35, 55], 'weight': 3},
    {'name': 'boat', 'sheet': 'B', 'row': 2, 'h': h, 'speed': [40, 60], 'weight': 2},
]

CFG = {
    'label': 'Ninh Bình: Tràng An, sông và hang',
    'bg': 'ninhbinh-bg.png',
    'sheets': {'A': ('ninhbinh-sprites-A.png', 3), 'B': ('ninhbinh-sprites-B.png', 3)},
    'sky': {'x': [450, 1250], 'y': [10, 70], 'sun': [640, 80]},
    'actors': [
        {'name': 'buffalo', 'sheet': 'A', 'row': 0, 'deholes': True, 'x': 300, 'y': 780, 'h': 150, 'kind': 'pingpong', 'frameMs': 500},
        {'name': 'egret', 'sheet': 'A', 'row': 1, 'x': 1290, 'y': 660, 'h': 120, 'kind': 'pingpong', 'frameMs': 450},
        {'name': 'moored', 'sheet': 'B', 'row': 0, 'x': 1135, 'y': 660, 'h': 95, 'kind': 'pingpong', 'frameMs': 500},
        {'name': 'rest', 'sheet': 'A', 'row': 2, 'x': 980, 'y': 685, 'h': 130, 'kind': 'pingpong', 'frameMs': 500},
    ],
    'lanes': [
        {'name': 'cave', 'y': 730, 'dir': 0, 'exclusive': True, 'x': [520, 1090], 'y1': 480, 's1': 0.3,
         'gap': [8000, 16000], 'fade': [150, 150], 'frameMs': 200, 'maxActive': 3, 'variants': _BOATS(145)},
    ],
}
