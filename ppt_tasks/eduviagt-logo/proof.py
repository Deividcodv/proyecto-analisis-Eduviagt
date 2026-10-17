"""QA-only proof sheet: renders the mark at TRUE pixel sizes (96 dpi) to judge legibility.
Not a deliverable — a rendering harness for the visual review.
"""
from pptx_designer import Presentation, svg_chart
from pptx_designer.tools.shapes import add_slide, rect
from pptx_designer.tools.text import text

from build import C, MUTED, PAPEL, TINTA, W, H, icon_svg, icon_body

DPI = 96.0


def _bg(s, color):
    rect(s, 0, 0, W, H, fill=color, C=C)


def build():
    prs = Presentation()

    # ---- slide 1: true sizes on light
    s = add_slide(prs)
    _bg(s, PAPEL)
    text(s, 0.5, 0.4, 12, 0.5, "Isotipo a tamaño real (96 dpi)", font_size=18, color=TINTA, bold=True, font_name="Arial Black", C=C)
    sizes = [(256, "color"), (192, "color"), (128, "color"), (96, "color"), (64, "color"),
             (48, "color"), (44, "color"), (24, "color"), (16, "color"), (16, "favicon")]
    x, base = 0.5, 4.3
    for px, mode in sizes:
        inch = px / DPI
        svg_chart(s, icon_svg(mode), x=x, y=base - inch, w=inch, h=inch, C=C)
        lab = f"{px}" if mode == "color" else f"{px} fav"
        text(s, x - 0.1, base + 0.1, inch + 0.2, 0.3, lab, font_size=8, color=MUTED, align="center", font_name="Segoe UI", C=C)
        x += inch + 0.15
    text(s, 0.5, 6.6, 12, 0.4, "16 px = favicon · 44 px = encabezado del sitio", font_size=10, color=MUTED, font_name="Segoe UI", C=C)

    # ---- slide 2: magnified small sizes + lockup
    s = add_slide(prs)
    _bg(s, PAPEL)
    text(s, 0.5, 0.4, 12, 0.5, "Ampliación (para ver el detalle) y lockup horizontal", font_size=18, color=TINTA, bold=True, font_name="Arial Black", C=C)
    for i, (px, mag, mode) in enumerate([(24, 6, "color"), (16, 8, "favicon")]):
        inch = px * mag / DPI
        svg_chart(s, icon_svg(mode), x=0.7 + i * 2.6, y=1.3, w=inch, h=inch, C=C)
        text(s, 0.7 + i * 2.6, 1.3 + inch + 0.1, 2.2, 0.3,
             f"{px} px ×{mag} ({mode})", font_size=9, color=MUTED, font_name="Segoe UI", C=C)
    # lockup (icon + text) as the site would compose it
    svg_chart(s, icon_svg("color"), x=6.2, y=1.3, w=1.2, h=1.2, C=C)
    text(s, 7.6, 1.35, 5.2, 0.6, "EDUVIAGT", font_size=26, color="#0F3D63", bold=True, font_name="Arial Black", C=C)
    text(s, 7.63, 1.95, 5.2, 0.35, "Sistema Integral de Gestión de Becas", font_size=11, color="#2E6E9E", font_name="Segoe UI", C=C)
    text(s, 7.63, 2.28, 5.2, 0.35, "MINISTERIO DE EDUCACIÓN · GUATEMALA", font_size=8.5, color=TINTA, font_name="Segoe UI", C=C)
    # mono variants row
    y = 4.2
    for i, (mode, lab, bgc) in enumerate([("mono_ink", "Monocromo tinta", PAPEL), ("mono_blanco", "Monocromo blanco", TINTA)]):
        xx = 0.7 + i * 3.0
        if bgc == TINTA:
            rect(s, xx - 0.15, y - 0.15, 2.4, 2.4, fill=TINTA, C=C)
        svg_chart(s, icon_svg(mode), x=xx, y=y, w=1.6, h=1.6, C=C)
        text(s, xx - 0.15, y + 1.75, 2.4, 0.3, lab, font_size=10,
             color=MUTED if bgc == PAPEL else "#9FC0DC", C=C)

    prs.save(str(__import__("pathlib").Path(__file__).parent / "out" / "proof.pptx"))
    print("proof slides:", len(prs.slides._sldIdLst))


if __name__ == "__main__":
    build()
