# Nhân vật bổ sung nằm NGOÀI mã nguồn (gói nhân vật riêng, cài thủ công trong app: Cài đặt → Gói nhân vật).
# Tuỳ chọn: chỉ bật khi biến môi trường MASCOT_EXTRA_DIR trỏ tới một thư mục có `fan.py`. Không đặt biến = không có gì,
# export.py chạy y như chỉ có 5 nhân vật gốc.
#   MASCOT_EXTRA_DIR  thư mục chứa fan.py (+ các module nhân vật nó nạp); được thêm vào sys.path
#   MASCOT_EXTRA_OUT  nơi ghi <id>.pet.json / <id>.quirks.json của các nhân vật này (mặc định <MASCOT_EXTRA_DIR>/../art);
#                     không bao giờ ghi vào src/
# Hợp đồng của fan.py (mô tả chi tiết nằm trong chính file đó):
#   MODS {id: module}   module có draw(stage, pose, p), BACKDROP, ANCHOR, EGG; tuỳ chọn props(), CSS, QUIRKS, WALK, ROOT
#   CSS                 CSS chung của các module
#   quirk_keys(n), root_cls(n, base), register(chars4, backdrop)
#   egg_svg(svg)        (tuỳ chọn) sửa hình trứng dùng chung của các nhân vật này
import importlib
import os
import sys

DIR = os.path.abspath(os.environ['MASCOT_EXTRA_DIR']) if os.environ.get('MASCOT_EXTRA_DIR') else ''
OUT = os.path.abspath(os.environ.get('MASCOT_EXTRA_OUT') or os.path.join(DIR, '..', 'art')) if DIR else ''

PKG = None
if DIR:
    if not os.path.isfile(os.path.join(DIR, 'fan.py')):
        raise SystemExit(f'MASCOT_EXTRA_DIR={DIR}: không có fan.py')
    sys.path.insert(0, DIR)
    PKG = importlib.import_module('fan')

MODS = getattr(PKG, 'MODS', {})
IDS = list(MODS)
CSS = getattr(PKG, 'CSS', '')


def quirk_keys(n):
    """Khoá dáng của các hoạt ảnh tự do (`quirk_*`) của nhân vật n: [(khoá dáng, tên quirk, cấu hình)]."""
    return PKG.quirk_keys(n) if PKG else []


def root_cls(n, base):
    """Lớp gốc (nhún) theo dáng: bảng chung + phần module thay."""
    return PKG.root_cls(n, base) if PKG else dict(base)


def register(chars4, backdrop):
    """Thêm các nhân vật bổ sung vào CHARS4, nền Huyền thoại, chỗ đeo phụ kiện và trứng."""
    if PKG:
        PKG.register(chars4, backdrop)


def egg_svg(n, svg):
    hook = getattr(PKG, 'egg_svg', None)
    return hook(svg) if hook and n in MODS else svg
