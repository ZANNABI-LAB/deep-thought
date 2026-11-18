import sys
from pathlib import Path

import numpy as np
from PIL import Image

INKS = np.array([(250, 232, 188), (157, 116, 211)], float)
WIDTHS = [630, 1260, 1808]


def main() -> None:
    src, out_dir = Image.open(sys.argv[1]).convert('RGB'), Path(sys.argv[2])
    p = np.asarray(src).astype(float)
    alphas = np.clip((p @ INKS.T) / (INKS**2).sum(1), 0, 1)
    residual = ((p[:, :, None, :] - alphas[..., None] * INKS[None, None]) ** 2).sum(-1)
    ink = residual.argmin(-1)
    alpha = np.take_along_axis(alphas, ink[..., None], -1)[..., 0]
    alpha = np.where(alpha < 0.06, 0, np.where(alpha > 0.94, 1, alpha))
    logo = Image.fromarray(np.dstack([INKS[ink], alpha * 255]).round().astype(np.uint8), 'RGBA')
    for width in WIDTHS:
        size = (width, round(src.height * width / src.width))
        img = logo if size == logo.size else logo.resize(size, Image.LANCZOS)
        img.save(out_dir / f'home-logo-{width}.webp', lossless=True, method=6)


if __name__ == '__main__':
    main()
