"""Cấu hình cảnh Cần Thơ (xem scene_config.py)."""

CFG = {
        'label': 'Cần Thơ: chợ nổi trên sông',
        'bg': 'cantho-bg.png',
        'sheets': {'A': ('cantho-sprites-A.png', 3), 'B': ('cantho-sprites-B.png', 3), 'C': ('cantho-sprites-C.png', 3)},
        'sky': {'x': [650, 1330], 'y': [10, 90], 'sun': [1000, 90]},
        'actors': [
            # cây bẹo (đung đưa liên tục), gốc cột ở mặt nước
            {'name': 'beo', 'sheet': 'B', 'row': 0, 'points': [(985, 752, 1.0), (1215, 612, 0.7)], 'h': 300, 'deholes': True,
             'kind': 'loop', 'frameMs': 300, 'base': True},
            {'name': 'banthom', 'sheet': 'A', 'row': 0, 'x': 840, 'y': 640, 'h': 130, 'kind': 'pingpong', 'frameMs': 500},
            {'name': 'ghedua', 'sheet': 'A', 'row': 1, 'x': 1070, 'y': 755, 'h': 130, 'kind': 'pingpong', 'frameMs': 500},
            {'name': 'beanthom', 'sheet': 'A', 'row': 2, 'x': 440, 'y': 748, 'h': 100, 'kind': 'pingpong', 'frameMs': 450},
        ],
        'lanes': [
            {'name': 'l1', 'y': 590, 'dir': -1, 'x': [520, 1250], 'gap': [6000, 14000], 'fade': [180, 180],
             'frameMs': 220, 'maxActive': 2, 'bob': 3,
             'variants': [
                 {'name': 'ghe', 'sheet': 'B', 'deholes': True, 'row': 1, 'h': 110, 'speed': [25, 40], 'weight': 1},
             ]},
            {'name': 'l2', 'y': 665, 'dir': 1, 'x': [520, 1250], 'gap': [6000, 14000], 'fade': [180, 180],
             'frameMs': 200, 'maxActive': 3, 'bob': 3,
             'variants': [
                 {'name': 'xuong', 'sheet': 'C', 'deholes': True, 'row': 0, 'h': 125, 'speed': [40, 60], 'weight': 1},
                 {'name': 'xuong', 'sheet': 'C', 'deholes': True, 'row': 1, 'h': 125, 'speed': [40, 60], 'weight': 1},
             ]},
            {'name': 'l3', 'y': 735, 'dir': -1, 'x': [520, 1250], 'gap': [6000, 14000], 'fade': [180, 180],
             'frameMs': 180, 'maxActive': 2, 'bob': 3,
             'variants': [
                 {'name': 'xuong', 'sheet': 'C', 'deholes': True, 'row': 2, 'h': 145, 'speed': [40, 65], 'weight': 1},
                 {'name': 'ghe', 'sheet': 'B', 'deholes': True, 'row': 1, 'h': 145, 'speed': [40, 65], 'weight': 1},
             ]},
        ],
    }
