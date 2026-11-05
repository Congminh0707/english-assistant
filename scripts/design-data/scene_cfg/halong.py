"""Cấu hình cảnh Hạ Long (xem scene_config.py)."""

CFG = {
        'label': 'Hạ Long: vịnh đá và làng chài',
        'bg': 'halong-bg.png',
        'sheets': {'A': ('halong-sprites-A.png', 3), 'B': ('halong-sprites-B.png', 3)},
        'birds': 'none',
        'sky': {'x': [280, 1480], 'y': [10, 70], 'sun': [1130, 85]},
        'actors': [
            {'name': 'fisher', 'sheet': 'A', 'row': 0, 'x': 690, 'y': 725, 'h': 135, 'kind': 'pingpong', 'frameMs': 500},
            {'name': 'cage', 'sheet': 'A', 'row': 1, 'x': 930, 'y': 705, 'h': 95, 'kind': 'burst', 'frameMs': 200},
            {'name': 'kidhouse', 'sheet': 'A', 'row': 2, 'x': 1250, 'y': 650, 'h': 120, 'kind': 'pingpong', 'frameMs': 450, 'deholes': True},
            {'name': 'dolphin', 'sheet': 'B', 'row': 2, 'x': 1030, 'y': 655, 'h': 115, 'kind': 'burst', 'frameMs': 200, 'hideIdle': True},
        ],
        'lanes': [
            {'name': 'far', 'y': 548, 'dir': 1, 'x': [560, 2020], 'fade': [200, 0], 'gap': [8000, 20000], 'frameMs': 250, 'maxActive': 2, 'bob': 3,
             'variants': [
                 {'name': 'junk', 'sheet': 'B', 'row': 0, 'h': 110, 'speed': [20, 32], 'weight': 1, 'deholes': True},
             ]},
            {'name': 'near', 'y': 615, 'dir': -1, 'x': [200, 2020], 'fade': [0, 150], 'gap': [8000, 20000], 'frameMs': 250, 'maxActive': 2, 'bob': 3,
             'variants': [
                 {'name': 'sailboat', 'sheet': 'B', 'row': 1, 'h': 120, 'speed': [28, 45], 'weight': 1, 'deholes': True},
             ]},
        ],
    }
