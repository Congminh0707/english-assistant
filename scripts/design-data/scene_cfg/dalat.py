"""Cấu hình cảnh Đà Lạt (xem scene_config.py)."""

CFG = {
        'label': 'Đà Lạt: ga xe lửa và đồi thông',
        'bg': 'dalat-bg.png',
        'sheets': {'A': ('dalat-sprites-A.png', 3), 'B': ('dalat-sprites-B.png', 3)},
        'sky': {'x': [520, 1330], 'y': [10, 60], 'sun': [950, 80]},
        'mist': {'x': [200, 1500], 'y': [150, 230], 'count': 3, 'alpha': 0.5, 'w': [380, 520], 'speed': [4, 8]},
        'actors': [
            {'name': 'strawberry', 'sheet': 'A', 'row': 0, 'x': 140, 'y': 668, 'h': 130, 'kind': 'pingpong', 'frameMs': 500},
            {'name': 'carrot', 'sheet': 'A', 'row': 1, 'x': 105, 'y': 512, 'h': 82, 'kind': 'pingpong', 'frameMs': 450},
            {'name': 'swan', 'sheet': 'A', 'row': 2, 'x': 1560, 'y': 555, 'h': 75, 'kind': 'pingpong', 'frameMs': 550},
        ],
        'lanes': [
            {'name': 'rail', 'y': 728, 'dir': 1, 'x': [-500, 2200], 'gap': [15000, 30000], 'frameMs': 110, 'maxActive': 1,
             'variants': [
                 {'name': 'steam', 'sheet': 'B', 'row': 0, 'h': 150, 'speed': [90, 120], 'weight': 1,
                  'attach': {'sheet': 'B', 'row': 1, 'dx': 157, 'dy': -115, 'h': 125, 'frameMs': 160}},
             ]},
            {'name': 'road', 'y': 800, 'dir': -1, 'x': [250, 1400], 'fade': [120, 120], 'gap': [12000, 25000], 'frameMs': 120, 'maxActive': 1,
             'variants': [
                 {'name': 'cart', 'sheet': 'B', 'row': 2, 'h': 115, 'speed': [55, 80], 'weight': 1, 'deholes': True},
             ]},
        ],
    }
