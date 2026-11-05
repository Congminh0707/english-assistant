"""Sinh 3 sprite sương mù (dải mờ ngang, mép tan dần) cho Sa Pa/Đà Lạt: sceneAnim/mist/mist-0..2.webp (+ bản sao cho scene-preview).
python scripts/design-data/gen_mist.py
Không dùng sprite mây (mây có viền mực, sương thì không). Nhiễu giá trị mượt + elip Gauss, trắng ngả xanh, alpha tối đa ~0.8."""
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
W, H = 720, 220


def smooth_noise(rng, scale):
    small = rng.random((H // scale + 2, W // scale + 2)).astype('float32')
    im = Image.fromarray((small * 255).astype('uint8')).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(scale / 3))
    return np.array(im).astype('float32') / 255


def make(seed):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype('float32')
    a = np.zeros((H, W), 'float32')
    for _ in range(rng.integers(3, 6)):
        cx, cy = rng.uniform(0.2, 0.8) * W, rng.uniform(0.35, 0.65) * H
        sx, sy = rng.uniform(0.12, 0.28) * W, rng.uniform(0.12, 0.26) * H
        a = np.maximum(a, np.exp(-(((xx - cx) / sx) ** 2 + ((yy - cy) / sy) ** 2)))
    n = 0.55 * smooth_noise(rng, 40) + 0.45 * smooth_noise(rng, 14)
    a = np.clip(a * (0.55 + 0.9 * n), 0, 1)
    edge = np.minimum(np.minimum(xx, W - 1 - xx) / 60, np.minimum(yy, H - 1 - yy) / 40).clip(0, 1)
    a = a * edge
    rgb = np.empty((H, W, 3), 'float32')
    rgb[..., 0], rgb[..., 1], rgb[..., 2] = 242, 247, 250
    rgb[..., 2] -= 10 * (1 - n)
    out = np.dstack([rgb, a * 205]).astype('uint8')
    return Image.fromarray(out, 'RGBA')


def main():
    for dst in ('src/renderer/study/kids/game/sceneAnim/mist', 'scripts/design-data/review/scene-preview/sky'):
        os.makedirs(os.path.join(ROOT, dst), exist_ok=True)
    for i in range(3):
        im = make(100 + i)
        im.save(os.path.join(ROOT, 'src/renderer/study/kids/game/sceneAnim/mist', f'mist-{i}.webp'), quality=82, method=6)
        im.save(os.path.join(ROOT, 'scripts/design-data/review/scene-preview/sky', f'mist-{i}.webp'), quality=82, method=6)
    print('mist: 3 sprite')


main()
