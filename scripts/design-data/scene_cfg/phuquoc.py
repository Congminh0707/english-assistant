"""Cấu hình cảnh Phú Quốc (xem scene_config.py)."""

CFG = {
    'label': 'Phú Quốc: làng chài hoàng hôn',
    'bg': 'phuquoc-bg.png',
    'sheets': {'A': ('phuquoc-sprites-A-fixed.png', 3), 'B': ('phuquoc-sprites-B.png', 3)},
    'birds': 'none',
    'actors': [
        {'name': 'netman', 'sheet': 'A', 'row': 0, 'x': 440, 'y': 805, 'h': 140, 'kind': 'pingpong', 'frameMs': 500},
        {'name': 'family', 'sheet': 'A', 'row': 1, 'x': 1440, 'y': 648, 'h': 150, 'kind': 'pingpong', 'frameMs': 600},
        {'name': 'dog', 'sheet': 'A', 'row': 2, 'x': 900, 'y': 850, 'h': 100, 'kind': 'pingpong', 'frameMs': 400},
    ],
    'lanes': [
        {'name': 'squid', 'y': 600, 'y1': 510, 's1': 0.4, 'dir': 1, 'x': [770, 1180], 'fade': [120, 150], 'bob': 3, 'gap': [14000, 26000],
         'frameMs': 250, 'maxActive': 1,
         'variants': [{'name': 'squidboat', 'sheet': 'B', 'row': 0, 'deholes': True, 'h': 115, 'speed': [14, 24], 'weight': 1}]},
        {'name': 'basket', 'y': 640, 'dir': -1, 'x': [820, 1220], 'fade': [150, 150], 'bob': 3, 'gap': [12000, 22000],
         'frameMs': 250, 'maxActive': 1,
         'variants': [{'name': 'basketboat', 'sheet': 'B', 'row': 1, 'h': 85, 'speed': [22, 32], 'weight': 1}]},
    ],
}
