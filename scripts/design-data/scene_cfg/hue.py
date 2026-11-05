"""Cấu hình cảnh Huế: Ngọ Môn bên sông Hương (xem scene_config.py)."""

CFG = {
        'label': 'Huế: Ngọ Môn bên sông Hương',
        'bg': 'hue-bg.png',
        'sheets': {'A': ('hue-sprites-A.png', 3), 'B': ('hue-sprites-B.png', 3)},
        'sky': {'x': [450, 1250], 'y': [10, 110], 'sun': [1050, 110]},
        'actors': [
            {'name': 'kite', 'sheet': 'B', 'row': 2, 'x': 720, 'y': 165, 'h': 150, 'kind': 'loop', 'frameMs': 350,
             'shared': True, 'ax': 0.5, 'ay': 0.5, 'deholes': True},
            {'name': 'aodai', 'sheet': 'A', 'row': 0, 'x': 640, 'y': 770, 'h': 190, 'kind': 'pingpong', 'frameMs': 500},
            {'name': 'che', 'sheet': 'A', 'row': 1, 'x': 1230, 'y': 775, 'h': 160, 'kind': 'pingpong', 'frameMs': 600, 'deholes': True},
            {'name': 'child', 'sheet': 'A', 'row': 2, 'x': 950, 'y': 880, 'h': 170, 'kind': 'pingpong', 'frameMs': 400},
        ],
        # sông Hương chỉ thấy ở góc trái (nước x 0–360, y 585–700); tâm thuyền chỉ đi tới x 240 để thân thuyền (rộng ~260) không vào đất liền
        'lanes': [
            {'name': 'river', 'y': 670, 'dir': 0, 'exclusive': True, 'x': [-120, 240], 'fade': [100, 130], 'gap': [5000, 10000],
             'frameMs': 250, 'maxActive': 1, 'bob': 2,
             'variants': [
                 {'name': 'dragon', 'sheet': 'B', 'row': 0, 'h': 120, 'speed': [18, 30], 'weight': 1, 'deholes': True},
                 {'name': 'sampan', 'sheet': 'B', 'row': 1, 'h': 90, 'speed': [18, 30], 'weight': 1, 'deholes': True},
             ]},
        ],
    }
