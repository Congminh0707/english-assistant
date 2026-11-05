"""Cấu hình cảnh Sa Pa (xem scene_config.py)."""

CFG = {
    'label': 'Sa Pa: ruộng bậc thang',
    'bg': 'sapa-bg-v2.png',
    'sheets': {'A': ('sapa-sprites-A.png', 3), 'B': ('sapa-sprites-B-fixed.png', 3)},
    'sky': {'x': [650, 1300], 'y': [10, 70], 'sun': [900, 70]},
    'mist': {'x': [480, 1500], 'y': [200, 360], 'count': 4, 'alpha': 0.6, 'w': [380, 560], 'speed': [4, 8]},
    'actors': [
        {'name': 'buffalo', 'sheet': 'A', 'row': 0, 'x': 1180, 'y': 830, 'h': 150, 'kind': 'pingpong', 'frameMs': 500, 'deholes': True},
        {'name': 'hen', 'sheet': 'A', 'row': 1, 'x': 760, 'y': 860, 'h': 75, 'kind': 'pingpong', 'frameMs': 450},
        {'name': 'hmong', 'sheet': 'A', 'row': 2, 'x': 330, 'y': 860, 'h': 165, 'kind': 'pingpong', 'frameMs': 450},
        {'name': 'horse', 'sheet': 'B', 'row': 0, 'x': 560, 'y': 850, 'h': 140, 'kind': 'pingpong', 'frameMs': 500},
    ],
}
