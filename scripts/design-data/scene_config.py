"""Cấu hình từng cảnh tầng 1 cho scene_build.py (toạ độ theo nền 1672×941, chân vật = giữa đáy).

Mỗi nơi:
  label, bg (file trong review/kids-games), sheets {khoá: (file, số hàng)}
  actors: vật đứng/loop, mỗi vật một hàng của một bảng. kind: pingpong (thỉnh thoảng một lượt) | burst | loop (luôn chạy)
          x, y = chân (hoặc điểm neo, xem ax/ay), h = chiều cao px; frameMs; shared=True: cắt chung một khung (đèn, lửa, sóng)
  lanes: dòng vật chạy liên tục (xe, thuyền): variants lấy từng hàng của bảng
  sky/mist/clock/birds: xem sceneAnim.ts
Vị trí viết tay theo ảnh nền đã xem; chỉnh sau khi ghép thử (scene-preview).
"""

import importlib
import os

# Mỗi nơi một file scene_cfg/<nơi>.py định nghĩa CFG (để làm song song không đụng nhau)
PLACES = {}
_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scene_cfg')
for _f in sorted(os.listdir(_dir)):
    if _f.endswith('.py') and not _f.startswith('_'):
        try:
            PLACES[_f[:-3]] = importlib.import_module(f'scene_cfg.{_f[:-3]}').CFG
        except Exception as e:  # file của nơi khác đang sửa dở không được làm hỏng nơi này
            print(f'cảnh báo: bỏ qua scene_cfg/{_f}: {e}')
