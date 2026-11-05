"""Cấu hình cảnh Sa Pa (xem scene_config.py)."""

CFG = {
    'label': 'Sa Pa: ruộng bậc thang',
    'bg': 'sapa-bg.png',
    'sheets': {'A': ('sapa-sprites-A.png', 3), 'B': ('sapa-sprites-B-fixed.png', 3)},
    'sky': {'x': [300, 1100], 'y': [10, 70], 'sun': [820, 70]},
    'mist': {'x': [480, 1500], 'y': [230, 400], 'count': 4, 'alpha': 0.6, 'w': [380, 560], 'speed': [4, 8]},
    'actors': [
        {'name': 'buffalo', 'sheet': 'A', 'row': 0, 'x': 1130, 'y': 800, 'h': 150, 'kind': 'pingpong', 'frameMs': 500, 'deholes': True},
        {'name': 'hen', 'sheet': 'A', 'row': 1, 'x': 800, 'y': 815, 'h': 75, 'kind': 'pingpong', 'frameMs': 450},
        {'name': 'hmong', 'sheet': 'A', 'row': 2, 'x': 330, 'y': 800, 'h': 165, 'kind': 'pingpong', 'frameMs': 450},
        {'name': 'horse', 'sheet': 'B', 'row': 0, 'x': 560, 'y': 775, 'h': 140, 'kind': 'pingpong', 'frameMs': 500},
        {'name': 'duck', 'sheet': 'B', 'row': 1, 'x': 1440, 'y': 628, 'h': 62, 'kind': 'pingpong', 'frameMs': 500},
        {'name': 'smoke', 'sheet': 'B', 'row': 2, 'x': 478, 'y': 304, 'h': 120, 'kind': 'loop', 'frameMs': 350,
         'shared': True, 'base': True},
    ],
}
