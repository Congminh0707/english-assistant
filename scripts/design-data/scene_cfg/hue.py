"""Cấu hình cảnh Huế: Ngọ Môn bên sông Hương (xem scene_config.py)."""

CFG = {
        'label': 'Huế: Ngọ Môn bên sông Hương',
        'bg': 'hue-bg-v2.png',
        'sheets': {'A': ('hue-sprites-A.png', 3), 'B': ('hue-sprites-B.png', 3)},
        'sky': {'x': [450, 1250], 'y': [10, 110], 'sun': [1050, 110]},
        'actors': [
            {'name': 'kite', 'sheet': 'B', 'row': 2, 'x': 500, 'y': 165, 'h': 150, 'kind': 'loop', 'frameMs': 350,
             'shared': True, 'ax': 0.5, 'ay': 0.5, 'deholes': True},
            {'name': 'aodai', 'sheet': 'A', 'row': 0, 'x': 1000, 'y': 860, 'h': 190, 'kind': 'pingpong', 'frameMs': 500},
            {'name': 'che', 'sheet': 'A', 'row': 1, 'x': 1280, 'y': 840, 'h': 160, 'kind': 'pingpong', 'frameMs': 600, 'deholes': True},
            {'name': 'child', 'sheet': 'A', 'row': 2, 'x': 600, 'y': 905, 'h': 170, 'kind': 'pingpong', 'frameMs': 400},
        ],
        # thuyền rồng neo cố định trong nền; không còn dòng thuyền chạy
    }
