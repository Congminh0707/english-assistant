"""Cấu hình cảnh Đà Nẵng (xem scene_config.py)."""

CFG = {
        'label': 'Đà Nẵng: Cầu Rồng bên sông Hàn',
        'bg': 'danang-bg-v3.png',
        'sheets': {'A': ('danang-sprites-A.png', 3), 'F': ('danang-fx.png', 3),
                   'H': ('halong-sprites-B.png', 3), 'O': ('hoian-sprites-B.png', 3)},
        'sky': {'x': [650, 1180], 'y': [10, 90], 'sun': [900, 90]},
        'actors': [
            {'name': 'fisher', 'sheet': 'A', 'row': 0, 'x': 300, 'y': 756, 'h': 150, 'kind': 'pingpong', 'frameMs': 500,
             'erase': [(0.78, 0.88, 1.0, 1.0)]},  # vệt gợn nước vẽ kèm ở đáy khung (nằm trên gạch)
            {'name': 'kite', 'sheet': 'A', 'row': 1, 'x': 900, 'y': 880, 'h': 130, 'kind': 'pingpong', 'frameMs': 450},
            {'name': 'runner', 'sheet': 'A', 'row': 2, 'x': 1250, 'y': 870, 'h': 170, 'kind': 'pingpong', 'frameMs': 400},
            # Rồng phun: cùng một điểm miệng, ngẫu nhiên lửa / nước / lửa nhỏ
            {'name': 'fire', 'lalign': True, 'flip': True, 'sheet': 'F', 'row': 0, 'x': 1405, 'y': 372, 'w': 250, 'kind': 'burst', 'frameMs': 180,
             'shared': True, 'hideIdle': True, 'night': True, 'ax': 0.0, 'ay': 0.5},
            {'name': 'water', 'sheet': 'F', 'row': 1, 'x': 1405, 'y': 372, 'w': 250, 'kind': 'burst', 'frameMs': 180,
             'shared': True, 'hideIdle': True, 'night': True, 'flip': True, 'ax': 0.0, 'ay': 0.5},  # sprite nước vẽ phun ngược: lật để gốc ở miệng
            {'name': 'fire2', 'lalign': True, 'flip': True, 'sheet': 'F', 'row': 2, 'x': 1405, 'y': 372, 'w': 220, 'kind': 'burst', 'frameMs': 180,
             'shared': True, 'hideIdle': True, 'night': True, 'ax': 0.0, 'ay': 0.5},
        ],
        'lanes': [
            {'name': 'b1', 'y': 595, 'dir': 1, 'x': [300, 1800], 'fade': [150, 150], 'gap': [9000, 18000], 'frameMs': 250, 'maxActive': 2, 'bob': 2,
             'variants': [{'name': 'sail', 'sheet': 'H', 'row': 1, 'h': 65, 'speed': [25, 40], 'weight': 1}]},
            {'name': 'b2', 'y': 632, 'dir': -1, 'x': [300, 1800], 'fade': [150, 150], 'gap': [9000, 18000], 'frameMs': 250, 'maxActive': 2, 'bob': 2,
             'variants': [{'name': 'sampan', 'sheet': 'O', 'row': 0, 'h': 70, 'speed': [30, 45], 'weight': 1}]},
        ],
    }
