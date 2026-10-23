"""Rasteriza la geometría L2 con PIL, fiel a las coordenadas del SVG.

Sirve para revisar la legibilidad a tamaño real (16 px, 44 px) sin depender de
PowerPoint. No es un entregable: es una herramienta de QA.
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from build import _geo

OUT = Path(__file__).parent / "out" / "preview"
OUT.mkdir(parents=True, exist_ok=True)

SS = 8  # supermuestreo

TINTA = (24, 35, 58)
PAPEL = (245, 247, 250)
ORO = (212, 167, 44)
BLANCO = (255, 255, 255)

PALETAS = {
    "color": dict(badge=TINTA, page=PAPEL, fold=ORO, crease=TINTA, check=TINTA),
    "mono_ink": dict(badge=TINTA, page=BLANCO, fold=BLANCO, crease=TINTA, check=TINTA),
    "mono_blanco": dict(badge=BLANCO, page=TINTA, fold=TINTA, crease=BLANCO, check=BLANCO),
}


def _seg_rect(p, q, w):
    (x1, y1), (x2, y2) = p, q
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1.0
    nx, ny = -dy / L, dx / L
    h = w / 2.0
    return [
        (x1 + nx * h, y1 + ny * h),
        (x2 + nx * h, y2 + ny * h),
        (x2 - nx * h, y2 - ny * h),
        (x1 - nx * h, y1 - ny * h),
    ]


def _thick(draw, pts, w, color, square_caps=True):
    pts = list(pts)
    if square_caps and len(pts) >= 2:
        (x0, y0), (x1, y1) = pts[0], pts[1]
        L = math.hypot(x1 - x0, y1 - y0) or 1.0
        pts[0] = (x0 + (x0 - x1) / L * w / 2, y0 + (y0 - y1) / L * w / 2)
        (xa, ya), (xb, yb) = pts[-2], pts[-1]
        L = math.hypot(xb - xa, yb - ya) or 1.0
        pts[-1] = (xb + (xb - xa) / L * w / 2, yb + (yb - ya) / L * w / 2)

    for i in range(len(pts) - 1):
        draw.polygon(_seg_rect(pts[i], pts[i + 1], w), fill=color)
    for p in pts[1:-1]:
        draw.rectangle([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=color)


def render(size: int, mode: str = "color", fav: bool = False) -> Image.Image:
    pal = PALETAS[mode]
    g = _geo(fav)
    S = size * SS
    k = S / 512.0
    img = Image.new("RGB", (S, S), pal["badge"])
    d = ImageDraw.Draw(img)

    def P(pts):
        return [(x * k, y * k) for x, y in pts]

    x0, y0, x1, y1, cut = g["x0"], g["y0"], g["x1"], g["y1"], g["cut"]

    # hoja
    d.polygon(P([(x0, y0), (x1 - cut, y0), (x1, y0 + cut), (x1, y1), (x0, y1)]), fill=pal["page"])
    # esquina doblada
    d.polygon(P([(x1 - cut, y0), (x1, y0 + cut), (x1 - cut, y0 + cut)]), fill=pal["fold"])
    # pliegue
    if g["crease_w"]:
        _thick(d, P([(x1 - cut, y0), (x1 - cut, y0 + cut), (x1, y0 + cut)]), g["crease_w"] * k, pal["crease"])
    # palomita
    if g["check"]:
        cp, w = g["check"][:3], g["check"][3]
        _thick(d, P(cp), w * k, pal["check"])

    return img.resize((size, size), Image.LANCZOS)


def _font(px):
    try:
        return ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", px)
    except OSError:
        return ImageFont.load_default()


def sheet() -> Image.Image:
    """Hoja de prueba: tamaños reales + ampliaciones, sobre papel."""
    W, H = 1240, 470
    img = Image.new("RGB", (W, H), PAPEL)
    d = ImageDraw.Draw(img)

    d.text((24, 18), "Isotipo L2 «Expediente» — tamaño real y ampliado", font=_font(20), fill=TINTA)

    x = 24
    y = 70
    for px, fav, lab in [
        (16, True, "16 favicon"), (16, False, "16"), (24, False, "24"),
        (32, False, "32"), (44, False, "44 encabezado"), (64, False, "64"), (96, False, "96"),
    ]:
        ic = render(px, "color", fav)
        img.paste(ic, (x, y))
        d.text((x - 4, y + px + 6), lab, font=_font(12), fill=(72, 88, 111))
        x += max(px, 40) + 18

    # ampliaciones
    x = 24
    y = 210
    for px, mag, fav, lab in [(16, 10, True, "16 favicon ×10"), (16, 10, False, "16 ×10"), (24, 6, False, "24 ×6")]:
        side = px * mag
        img.paste(render(side, "color", fav), (x, y))
        d.text((x, y + side + 6), lab, font=_font(12), fill=(72, 88, 111))
        x += side + 24

    # variantes monocromas
    x = 820
    y = 70
    for mode, lab, bgc in [("mono_ink", "monocromo tinta (fondo claro)", PAPEL), ("mono_blanco", "monocromo blanco (fondo tinta)", TINTA)]:
        til = 190
        d.rectangle([x, y, x + til, y + til], fill=bgc, outline=(220, 227, 236))
        img.paste(render(150, mode), (x + 20, y + 20))
        d.text((x, y + til + 8), lab, font=_font(12), fill=(72, 88, 111))
        y += til + 46

    # color sobre fondo tinta (como el encabezado real del sitio)
    til = 190
    d.rectangle([820, 210, 820 + til, 210 + til], fill=TINTA, outline=(220, 227, 236))
    img.paste(render(150, "color"), (840, 230))
    d.text((820, 210 + til + 8), "color sobre tinta (encabezado)", font=_font(12), fill=(72, 88, 111))

    return img


if __name__ == "__main__":
    for px, fav, name in [(16, True, "icon-16-fav"), (16, False, "icon-16"), (24, False, "icon-24"),
                          (44, False, "icon-44"), (64, False, "icon-64"), (256, False, "icon-256")]:
        render(px, "color", fav).save(OUT / f"{name}.png")
    render(256, "mono_ink").save(OUT / "icon-256-mono-ink.png")
    render(256, "mono_blanco").save(OUT / "icon-256-mono-blanco.png")
    sheet().save(OUT / "icon-sheet.png")
    print("raster: OK ->", OUT)
