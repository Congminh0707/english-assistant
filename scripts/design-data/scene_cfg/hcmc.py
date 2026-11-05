"""Cấu hình cảnh TP.HCM (xem scene_config.py)."""

CFG = {
        'label': 'TP.HCM: chợ Bến Thành',
        'bg': 'hcm-bg.png',
        'sheets': {'A': ('hcm-sprites-A.png', 3), 'B': ('hcm-sprites-B.png', 3), 'C': ('hcm-sprites-C.png', 3),
                   'D': ('hcm-sprites-D.png', 3)},
        'birds': 'none',
        'sky': {'x': [1050, 1450], 'y': [10, 40], 'sun': [1250, 90]},
        'clock': {'x': 883, 'y': 287, 'r': 36},
        'actors': [
            {'name': 'banhmi', 'sheet': 'A', 'row': 0, 'x': 330, 'y': 702, 'h': 175, 'kind': 'pingpong', 'frameMs': 500},
            {'name': 'xeom', 'sheet': 'A', 'row': 1, 'x': 1210, 'y': 704, 'h': 165, 'kind': 'pingpong', 'frameMs': 500},
            {'name': 'child', 'sheet': 'A', 'row': 2, 'x': 1465, 'y': 700, 'h': 150, 'kind': 'pingpong', 'frameMs': 400},
        ],
        # 4 làn trên đường nhựa (y 715–880): hai làn xa chạy sang trái, hai làn gần sang phải.
        # Trong một làn vật không vượt nhau, nên xe nhanh (xe máy, taxi, xe giao hàng...) một làn, xe chậm (buýt, xe tải nhỏ,
        # xích lô, xe đạp) làn riêng.
        'lanes': [
            {'name': 'l1', 'y': 768, 'dir': -1, 'x': [-300, 1972], 'gap': [700, 1900], 'frameMs': 110, 'maxActive': 7,
             'variants': [
                 {'name': 'bike', 'sheet': 'B', 'row': 0, 'h': 115, 'speed': [250, 320], 'weight': 5},
                 {'name': 'family', 'sheet': 'C', 'row': 1, 'h': 125, 'speed': [240, 300], 'weight': 2},
                 {'name': 'delivery', 'sheet': 'C', 'row': 2, 'h': 125, 'speed': [240, 310], 'weight': 2},
                 {'name': 'vespa', 'sheet': 'D', 'row': 2, 'h': 118, 'speed': [250, 320], 'weight': 2},
                 {'name': 'taxi', 'sheet': 'C', 'row': 0, 'h': 105, 'speed': [250, 310], 'weight': 1},
             ]},
            {'name': 'l2', 'y': 806, 'dir': -1, 'x': [-300, 1972], 'gap': [2500, 6500], 'frameMs': 110, 'maxActive': 4,
             'variants': [
                 {'name': 'bus', 'sheet': 'B', 'row': 1, 'h': 165, 'speed': [120, 150], 'weight': 2},
                 {'name': 'pickup', 'sheet': 'D', 'row': 0, 'h': 140, 'speed': [120, 150], 'weight': 2},
                 {'name': 'cyclo', 'sheet': 'B', 'row': 2, 'h': 150, 'speed': [105, 130], 'weight': 1},
             ]},
            {'name': 'l3', 'y': 848, 'dir': 1, 'x': [-300, 1972], 'gap': [800, 2200], 'frameMs': 110, 'maxActive': 7,
             'variants': [
                 {'name': 'bike', 'sheet': 'B', 'row': 0, 'h': 140, 'speed': [260, 330], 'weight': 5},
                 {'name': 'family', 'sheet': 'C', 'row': 1, 'h': 150, 'speed': [250, 310], 'weight': 2},
                 {'name': 'delivery', 'sheet': 'C', 'row': 2, 'h': 150, 'speed': [250, 320], 'weight': 2},
                 {'name': 'vespa', 'sheet': 'D', 'row': 2, 'h': 142, 'speed': [260, 330], 'weight': 2},
                 {'name': 'taxi', 'sheet': 'C', 'row': 0, 'h': 128, 'speed': [260, 320], 'weight': 1},
             ]},
            {'name': 'l4', 'y': 878, 'dir': 1, 'x': [-300, 1972], 'gap': [3000, 7500], 'frameMs': 110, 'maxActive': 4,
             'variants': [
                 {'name': 'bus', 'sheet': 'B', 'row': 1, 'h': 200, 'speed': [125, 155], 'weight': 2},
                 {'name': 'pickup', 'sheet': 'D', 'row': 0, 'h': 165, 'speed': [125, 155], 'weight': 2},
                 {'name': 'bicycle', 'deholes': True, 'sheet': 'D', 'row': 1, 'h': 145, 'speed': [105, 130], 'weight': 2},
                 {'name': 'cyclo', 'sheet': 'B', 'row': 2, 'h': 170, 'speed': [105, 130], 'weight': 1},
             ]},
        ],
    }
