"""Cấu hình cảnh Nha Trang (xem scene_config.py)."""

CFG = {
    'label': 'Nha Trang: bãi biển và Tháp Bà',
    'bg': 'nhatrang-bg-v2.png',
    'sheets': {'A': ('nhatrang-sprites-A.png', 3), 'B': ('nhatrang-sprites-B.png', 3)},
    'sky': {'x': [450, 1250], 'y': [10, 100], 'sun': [900, 110]},
    'actors': [
        {'name': 'castle', 'sheet': 'A', 'row': 0, 'x': 700, 'y': 860, 'h': 120, 'kind': 'pingpong', 'frameMs': 500},
        {'name': 'crab', 'sheet': 'A', 'row': 1, 'x': 450, 'y': 885, 'h': 55, 'kind': 'pingpong', 'frameMs': 450},
        {'name': 'coco', 'sheet': 'A', 'row': 2, 'x': 980, 'y': 850, 'h': 170, 'kind': 'pingpong', 'frameMs': 500},
    ],
    'lanes': [
        {'name': 'thung1', 'y': 625, 'dir': 1, 'x': [-300, 1350], 'fade': [0, 150], 'gap': [8000, 20000], 'frameMs': 220,
         'maxActive': 1, 'bob': 3,
         'variants': [{'name': 'thung', 'sheet': 'B', 'row': 1, 'h': 90, 'speed': [35, 55], 'weight': 1}]},
        {'name': 'thung2', 'y': 645, 'dir': -1, 'x': [-300, 1350], 'fade': [150, 0], 'gap': [8000, 20000], 'frameMs': 220,
         'maxActive': 1, 'bob': 3,
         'variants': [{'name': 'thung', 'sheet': 'B', 'row': 1, 'h': 90, 'speed': [35, 55], 'weight': 1}]},
        {'name': 'cano', 'y': 665, 'dir': 1, 'x': [-300, 1350], 'fade': [0, 150], 'gap': [9000, 20000], 'frameMs': 220,
         'maxActive': 1, 'bob': 3,
         'variants': [{'name': 'cano', 'sheet': 'B', 'row': 2, 'h': 80, 'speed': [110, 150], 'weight': 1}]},
    ],
}
