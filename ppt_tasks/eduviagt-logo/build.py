"""EDUVIAGT brand sheet — builds the editable PPTX + the site SVGs from ONE geometry source.

Direction L2: "Expediente" — a flat, brutalist mark.
A sharp document sheet (papel) on a tinta field, with a 90° folded corner (gold)
and an approval check (tinta) stamped on the sheet.
No gradients, no rounded outer corners, no effects: 100 % flat, 90° angles.
"""
from __future__ import annotations

import json
from pathlib import Path

from pptx_designer import Presentation, svg_chart, validate_resolved_theme
from pptx_designer.renderer.theme import ThemeComposer
from pptx_designer.tools.shapes import add_slide, rect, rrect
from pptx_designer.tools.text import text

HERE = Path(__file__).parent
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)

# ---------------------------------------------------------------- brand palette
TINTA = "#18233A"
PAPEL = "#F5F7FA"
AZUL = "#3D8EC7"
AZUL_DARK = "#0F3D63"
ORO = "#D4A72C"
ORO_DARK = "#7A5F17"
BLANCO = "#FFFFFF"
MUTED = "#48586F"        # >= 6:1 on PAPEL
GRIS = "#8C9BB0"
BORDE = "#DCE3EC"
AZUL_CLARO = "#9FC0DC"   # on TINTA
AZUL_TXT = "#2E6E9E"     # readable blue for text on light (>= 5:1)

C = {
    "background": PAPEL, "surface": BLANCO, "card": BLANCO, "card_bg": BLANCO,
    "ink": TINTA, "muted": MUTED, "border": BORDE, "divider": BORDE,
    "primary": AZUL_DARK, "accent": ORO, "secondary": AZUL, "on_primary": BLANCO,
    "text_dark": TINTA, "text_body": TINTA, "text_muted": MUTED,
    "font_heading": "Arial Black", "font_body": "Segoe UI", "font_mono": "Consolas",
}
FH = "Arial Black"   # display fallback (Archivo Black on the live site)
FB = "Segoe UI"      # body fallback (Instrument Sans on the live site)

W, H = 13.333, 7.5


# ---------------------------------------------------------------- logo geometry
def _geo(fav: bool) -> dict:
    """Geometry of the sheet. 512 × 512 canvas, sharp corners everywhere."""
    if fav:
        # favicon: la hoja crece, sin pliegue ni palomita (a 16 px no se resuelven)
        return dict(x0=72, y0=48, x1=440, y1=464, cut=112, crease_w=None, check=None)
    return dict(
        x0=124, y0=76, x1=396, y1=436, cut=84, crease_w=16,
        # La palomita deja >= 24 px libres bajo el pliegue: su remate superior
        # (y ~= 193) no toca la línea del pliegue (y = 168).
        check=((180, 288), (228, 336), (332, 224), 44),
    )


def icon_body(mode: str = "color", badge: str | None = None, page: str | None = None,
              fold: str | None = None, crease: str | None = None,
              check: str | None = None, fav: bool = False) -> str:
    if mode == "favicon":
        fav = True
        mode = "color"

    if mode == "color":
        badge = badge or TINTA
        page = page or PAPEL
        fold = fold or ORO
        crease = crease or TINTA
        check = check or TINTA
    elif mode == "mono_ink":            # una tinta + papel (para fondos claros)
        badge = badge or TINTA
        page = page or BLANCO
        fold = fold or BLANCO
        crease = crease or TINTA
        check = check or TINTA
    elif mode == "mono_blanco":         # blanco + tinta (para fondos oscuros)
        badge = badge or BLANCO
        page = page or TINTA
        fold = fold or TINTA
        crease = crease or BLANCO
        check = check or BLANCO
    else:                               # "custom": muestras de mal uso
        badge = badge or "#7B2FBE"
        page = page or "#22C55E"
        fold = fold or "#F97316"
        crease = crease or "#F97316"
        check = check or "#F97316"

    g = _geo(fav)
    x0, y0, x1, y1, cut = g["x0"], g["y0"], g["x1"], g["y1"], g["cut"]

    parts = [f'<rect x="0" y="0" width="512" height="512" fill="{badge}"/>']

    # hoja con la esquina superior derecha cortada en diagonal (90°)
    parts.append(
        f'<path d="M{x0} {y0} L{x1 - cut} {y0} L{x1} {y0 + cut} L{x1} {y1} '
        f'L{x0} {y1} Z" fill="{page}"/>'
    )
    # esquina doblada (triángulo oro)
    parts.append(
        f'<path d="M{x1 - cut} {y0} L{x1} {y0 + cut} L{x1 - cut} {y0 + cut} Z" '
        f'fill="{fold}"/>'
    )
    # pliegue: separa la esquina doblada de la hoja
    if g["crease_w"]:
        parts.append(
            f'<path d="M{x1 - cut} {y0} L{x1 - cut} {y0 + cut} L{x1} {y0 + cut}" '
            f'fill="none" stroke="{crease}" stroke-width="{g["crease_w"]}" '
            f'stroke-linecap="square" stroke-linejoin="miter"/>'
        )
    if g["check"]:
        pts, sw = g["check"][:3], g["check"][3]
        d = "M" + " L".join(f"{x} {y}" for x, y in pts)
        parts.append(
            f'<path d="{d}" fill="none" stroke="{check}" stroke-width="{sw}" '
            f'stroke-linecap="square" stroke-linejoin="miter"/>'
        )
    return "".join(parts)


def icon_svg(mode: str = "color", wrap: str | None = None, **kw) -> str:
    inner = icon_body(mode, **kw)
    if wrap:
        inner = f'<g transform="{wrap}">{inner}</g>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">{inner}</svg>'


# ---------------------------------------------------------------- slide helpers
def bg(s, color):
    rect(s, 0, 0, W, H, fill=color, C=C)


def tile(s, x, y, w, h, fill=BLANCO, edge=BORDE):
    if edge:
        rrect(s, x, y, w, h, fill=edge, C=C)
        rrect(s, x + 0.02, y + 0.02, w - 0.04, h - 0.04, fill=fill, C=C)
    else:
        rrect(s, x, y, w, h, fill=fill, C=C)


def titulo(s, txt, sub=None):
    text(s, 0.7, 0.45, 11.9, 0.75, txt, font_size=29, color=TINTA, bold=True, font_name=FH, C=C)
    rect(s, 0.73, 1.2, 1.35, 0.055, fill=ORO, C=C)
    if sub:
        text(s, 0.7, 1.3, 11.9, 0.4, sub, font_size=13.5, color=MUTED, font_name=FB, C=C)


def pie(s):
    # MUTED (#48586F) da 6.75:1 sobre papel; GRIS solo serviría sobre fondo oscuro.
    text(s, 0.7, 7.03, 11.9, 0.3, "EDUVIAGT · Rediseño de marca 2026", font_size=9,
         color=MUTED, font_name=FB, C=C)
    text(s, 11.9, 7.03, 0.73, 0.3, f"{len(s.part.package.presentation.slides):02d}", font_size=9,
         color=MUTED, align="right", font_name=FB, C=C)


# ---------------------------------------------------------------- 1. cover
def slide_cover(prs):
    s = add_slide(prs)
    bg(s, TINTA)
    rect(s, 0.45, 2.35, 0.1, 2.55, fill=ORO, C=C)
    svg_chart(s, icon_svg("color"), x=1.15, y=1.95, w=3.5, h=3.5, C=C)
    text(s, 5.25, 2.25, 7.4, 1.25, "EDUVIAGT", font_size=64, color=BLANCO, bold=True, font_name=FH, C=C)
    text(s, 5.32, 3.62, 7.4, 0.55, "Sistema Integral de Gestión de Becas", font_size=20,
         color=AZUL_CLARO, font_name=FB, C=C)
    rect(s, 5.35, 4.42, 1.7, 0.06, fill=ORO, C=C)
    text(s, 5.35, 4.72, 7.4, 0.5, "Rediseño de marca · «Expediente»", font_size=15,
         color=AZUL_CLARO, font_name=FB, C=C)
    text(s, 5.35, 6.5, 7.4, 0.5, "Ministerio de Educación · Guatemala", font_size=12.5,
         color=GRIS, font_name=FB, C=C)
    return s


# ---------------------------------------------------------------- 2. concept
def slide_concept(prs):
    s = add_slide(prs)
    bg(s, PAPEL)
    titulo(s, "Concepto: «Expediente»", "La hoja que se entrega, se revisa y se aprueba")
    svg_chart(s, icon_svg("color"), x=0.85, y=2.25, w=3.6, h=3.6, C=C)

    x = 5.0
    text(s, x, 2.05, 7.6, 0.5, "La marca es el expediente de una beca.", font_size=20,
         color=AZUL_DARK, bold=True, font_name=FH, C=C)
    text(s, x, 2.75, 7.6, 1.9,
         "Es la hoja que cada estudiante entrega y que el sistema revisa: el expediente. "
         "La esquina doblada señala un caso abierto dentro del proceso; la palomita sellada "
         "marca la beca aprobada. Todo se construye con bloques planos, esquinas a 90° y "
         "trazos gruesos —sin degradados ni efectos—, igual que el resto del sistema.",
         font_size=14.5, color=TINTA, font_name=FB, C=C)

    chips = [
        ("El expediente", "La hoja que el estudiante entrega."),
        ("Esquina doblada", "Un caso abierto dentro del sistema."),
        ("Palomita = aprobado", "El oro marca la beca otorgada."),
    ]
    cx, cy, cw, gap = 5.0, 4.85, 2.38, 0.2
    for i, (t, d) in enumerate(chips):
        x2 = cx + i * (cw + gap)
        tile(s, x2, cy, cw, 1.55, fill=BLANCO)
        rect(s, x2 + 0.02, cy + 0.02, cw - 0.04, 0.07, fill=ORO, C=C)
        text(s, x2 + 0.12, cy + 0.26, cw - 0.24, 0.55, t, font_size=11, color=AZUL_DARK,
             bold=True, font_name=FH, C=C)
        text(s, x2 + 0.12, cy + 0.82, cw - 0.24, 0.65, d, font_size=10.5, color=MUTED, font_name=FB, C=C)
    return s


# ---------------------------------------------------------------- 3. construction
def slide_construction(prs):
    s = add_slide(prs)
    bg(s, PAPEL)
    titulo(s, "Construcción", "Grilla y proporciones del isotipo (módulo x = lado / 16)")

    # grid + icon
    gx, gy, gs = 0.95, 2.15, 3.7
    for i in range(17):
        u = gs / 16
        rect(s, gx + i * u, gy, 0.006, gs, fill="#E7EDF4", C=C)
        rect(s, gx, gy + i * u, gs, 0.006, fill="#E7EDF4", C=C)
    svg_chart(s, icon_svg("color"), x=gx, y=gy, w=gs, h=gs, C=C)
    text(s, gx, gy + gs + 0.15, gs, 0.35, "16 × 16 módulos", font_size=11, color=MUTED,
         align="center", font_name=FB, C=C)

    x = 5.35
    specs = [
        ("Recuadro", "512 × 512 px · esquinas a 90° (radio 0): sin redondeos."),
        ("Hoja", "272 × 360 px, a 124 px del borde izquierdo y 76 px del superior."),
        ("Esquina doblada", "Triángulo rectángulo de 84 × 84 px, arriba a la derecha."),
        ("Pliegue", "Línea tinta de 16 px que separa la esquina de la hoja."),
        ("Palomita", "Trazo de 44 px, extremos rectos, a ≥ 24 px del pliegue."),
        ("Favicon (16 px)", "Hoja más grande (368 × 416 px), sin pliegue ni palomita."),
        ("Color", "Tinta #18233A, papel #F5F7FA y oro #D4A72C. Cero degradados."),
        ("Resguardo", "Área libre mínima = 0.5× el lado del isotipo."),
    ]
    yy = 2.1
    for k, v in specs:
        rect(s, x, yy + 0.06, 0.09, 0.34, fill=ORO, C=C)
        text(s, x + 0.28, yy, 6.6, 0.32, k, font_size=13, color=AZUL_DARK, bold=True, font_name=FH, C=C)
        text(s, x + 0.28, yy + 0.33, 7.0, 0.4, v, font_size=11.5, color=TINTA, font_name=FB, C=C)
        yy += 0.62
    return s


# ---------------------------------------------------------------- 4. variants
def slide_variants(prs):
    s = add_slide(prs)
    bg(s, PAPEL)
    titulo(s, "Variantes de color", "El isotipo funciona igual sobre fondo oscuro y claro")
    items = [
        ("color", "Color sobre oscuro", TINTA, AZUL_CLARO),
        ("color", "Color sobre claro", BLANCO, MUTED),
        ("mono_ink", "Monocromo tinta", BLANCO, MUTED),
        ("mono_blanco", "Monocromo blanco", TINTA, AZUL_CLARO),
    ]
    tw = (11.933 - 3 * 0.35) / 4
    for i, (mode, cap, tbg, tcol) in enumerate(items):
        x = 0.7 + i * (tw + 0.35)
        tile(s, x, 2.2, tw, 3.3, fill=tbg, edge=BORDE)
        svg_chart(s, icon_svg(mode), x=x + (tw - 1.7) / 2, y=2.75, w=1.7, h=1.7, C=C)
        text(s, x + 0.15, 4.75, tw - 0.3, 0.4, cap, font_size=12, color=tcol, bold=True,
             align="center", font_name=FH, C=C)
    text(s, 0.7, 5.85, 11.9, 0.5,
         "Mantén siempre el contraste: el oro solo sobre tinta/azul, o texto oscuro sobre el oro.",
         font_size=12.5, color=MUTED, font_name=FB, C=C)
    return s


# ---------------------------------------------------------------- 5. lockups
def slide_lockups(prs):
    s = add_slide(prs)
    bg(s, PAPEL)
    titulo(s, "Lockups y área de resguardo", "Combinaciones oficiales y usos mínimos")

    # 3 equal columns sharing one grid
    x0, w3, gap = 0.7, (11.933 - 2 * 0.3) / 3.0, 0.3
    x1, x2 = x0 + w3 + gap, x0 + 2 * (w3 + gap)

    # horizontal lockup (spans columns 1-2)
    tile(s, x0, 1.9, x2 - gap - x0, 2.2, fill=BLANCO)
    svg_chart(s, icon_svg("color"), x=x0 + 0.3, y=2.28, w=1.45, h=1.45, C=C)
    text(s, x0 + 1.9, 2.42, 5.4, 0.6, "EDUVIAGT", font_size=30, color=AZUL_DARK, bold=True, font_name=FH, C=C)
    text(s, x0 + 1.94, 3.06, 5.4, 0.35, "Sistema Integral de Gestión de Becas", font_size=12.5,
         color=AZUL_TXT, font_name=FB, C=C)
    text(s, x0 + 1.94, 3.42, 5.4, 0.35, "MINISTERIO DE EDUCACIÓN · GUATEMALA", font_size=9.5,
         color=MUTED, font_name=FB, C=C)
    text(s, x0, 1.62, 5.0, 0.3, "Lockup horizontal (principal)", font_size=11, color=MUTED, font_name=FB, C=C)

    # solo isotipo (dark)
    tile(s, x2, 1.9, w3, 2.2, fill=TINTA, edge=None)
    svg_chart(s, icon_svg("mono_blanco"), x=x2 + (w3 - 1.25) / 2, y=2.18, w=1.25, h=1.25, C=C)
    text(s, x2, 3.5, w3, 0.35, "Solo isotipo", font_size=11, color=AZUL_CLARO, align="center", font_name=FB, C=C)
    text(s, x2, 1.62, w3, 0.3, "Color / monocromo", font_size=11, color=MUTED, align="center", font_name=FB, C=C)

    # vertical lockup
    tile(s, x0, 4.3, w3, 2.6, fill=BLANCO)
    svg_chart(s, icon_svg("color"), x=x0 + (w3 - 1.5) / 2, y=4.5, w=1.5, h=1.5, C=C)
    text(s, x0 + 0.15, 6.12, w3 - 0.3, 0.45, "EDUVIAGT", font_size=22, color=AZUL_DARK, bold=True,
         align="center", font_name=FH, C=C)
    text(s, x0, 4.02, w3, 0.3, "Lockup vertical", font_size=11, color=MUTED, align="center", font_name=FB, C=C)

    # clear space
    tile(s, x1, 4.3, w3, 2.6, fill=BLANCO)
    cs, m = 1.2, 0.3
    cx, cy = x1 + (w3 - cs) / 2, 4.85
    for (rx, ry, rw, rh) in [(cx - m, cy - m, cs + 2 * m, 0.02), (cx - m, cy + cs + m, cs + 2 * m, 0.02),
                             (cx - m, cy - m, 0.02, cs + 2 * m), (cx + cs + m, cy - m, 0.02, cs + 2 * m)]:
        rect(s, rx, ry, rw, rh, fill=ORO, C=C)
    svg_chart(s, icon_svg("color"), x=cx, y=cy, w=cs, h=cs, C=C)
    text(s, x1, 4.02, w3, 0.3, "Área de resguardo = 0.5×", font_size=11, color=MUTED, align="center", font_name=FB, C=C)
    text(s, x1, 6.5, w3, 0.32, "Nada entra en el marco dorado", font_size=10, color=MUTED,
         align="center", font_name=FB, C=C)

    # minimum sizes (16 px uses the simplified favicon)
    tile(s, x2, 4.3, w3, 2.6, fill=BLANCO)
    mins = [(0.5, "color", "48 px"), (0.25, "color", "24 px"), (0.167, "favicon", "16 px")]
    base = 5.95
    for i, (px, mode, lab) in enumerate(mins):
        xx = x2 + 0.55 + i * 1.1
        svg_chart(s, icon_svg(mode), x=xx, y=base - px, w=px, h=px, C=C)
        text(s, xx - 0.35, base + 0.08, 1.2, 0.3, lab, font_size=9.5, color=MUTED,
             align="center", font_name=FB, C=C)
    text(s, x2, 4.02, w3, 0.3, "Tamaños mínimos", font_size=11, color=MUTED, align="center", font_name=FB, C=C)
    text(s, x2, 6.5, w3, 0.32, "16 px usa el favicon simplificado", font_size=10,
         color=MUTED, align="center", font_name=FB, C=C)
    return s


# ---------------------------------------------------------------- 6. misuse
def slide_misuse(prs):
    s = add_slide(prs)
    bg(s, PAPEL)
    titulo(s, "Usos incorrectos", "Qué evitar para proteger la marca")

    def wrong(s2, x, y, w, h, svg, label, text_bad=False):
        tile(s2, x, y, w, h, fill=BLANCO)
        svg_chart(s2, svg, x=x + (w - 1.5) / 2, y=y + 0.28, w=1.5, h=1.5, C=C)
        # red X
        rrect(s2, x + w - 0.62, y + 0.14, 0.46, 0.46, fill="#C0392B", C=C)
        text(s2, x + w - 0.62, y + 0.17, 0.46, 0.4, "✕", font_size=16, color=BLANCO,
             bold=True, align="center", font_name=FB, C=C)
        text(s2, x + 0.2, y + h - 0.75, w - 0.4, 0.6, label, font_size=12, color=TINTA,
             align="center", font_name=FB, C=C)

    cw = (11.933 - 2 * 0.3) / 3
    xs = [0.7 + i * (cw + 0.3) for i in range(3)]
    h1 = 2.4
    wrong(s, xs[0], 1.9, cw, h1, icon_svg("color", wrap="translate(256,256) scale(1.0,0.68) translate(-256,-256)"),
          "No deformar ni alargar")
    wrong(s, xs[1], 1.9, cw, h1, icon_svg("custom"), "No recolorear fuera de la paleta")
    wrong(s, xs[2], 1.9, cw, h1, icon_svg("color", wrap="rotate(20 256 256)"),
          "No rotar el isotipo")
    wrong(s, xs[0], 4.55, cw, h1, icon_svg("custom", badge=PAPEL, page=PAPEL, fold=ORO, crease=ORO, check=ORO),
          "No usar sobre bajo contraste")
    wrong(s, xs[1], 4.55, cw, h1,
          f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
          f'<g transform="translate(26,26)">'
          + icon_body("mono_ink", badge="#A9B6C8", page="#E3E9F1", fold="#E3E9F1", crease="#A9B6C8", check="#A9B6C8")
          + "</g>" + icon_body("color") + "</svg>",
          "No añadir sombras o volumen")
    wrong(s, xs[2], 4.55, cw, h1, icon_svg("mono_ink"),
          "No alterar proporciones del logotipo")
    return s


# ---------------------------------------------------------------- build
def build():
    theme = None
    try:
        theme = ThemeComposer().compose(
            query="institutional public education, deep blue and gold, geometric, warm and trustworthy",
            seed=7,
        )
        validate_resolved_theme(theme)
        (OUT / "resolved_theme.json").write_text(json.dumps(theme, indent=2, default=str), encoding="utf-8")
        prs = Presentation(theme=theme, strict_theme=True)
        print("theme: OK (attached)")
    except Exception as exc:  # documented fallback: explicit brand C dict
        print("theme: fallback to explicit C dict ->", type(exc).__name__, exc)
        prs = Presentation()

    slide_cover(prs)
    slide_concept(prs)
    slide_construction(prs)
    slide_variants(prs)
    slide_lockups(prs)
    slide_misuse(prs)

    pptx_path = OUT / "EDUVIAGT-marca.pptx"
    prs.save(str(pptx_path))

    # ---- site SVGs (same geometry as the PPTX icon)
    marca = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" '
        'role="img" aria-label="EDUVIAGT — Ministerio de Educación de Guatemala">'
        + icon_body("color") + "</svg>"
    )
    (OUT / "marca.svg").write_text(marca, encoding="utf-8")

    logo = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="820" height="220" viewBox="0 0 820 220" '
        'role="img" aria-label="EDUVIAGT — Sistema Integral de Gestión de Becas, '
        'Ministerio de Educación de Guatemala">'
        + '<g transform="translate(24,28) scale(0.3203)">' + icon_body("color") + "</g>"
        + '<text x="210" y="112" font-family="Archivo Black, Arial Black, sans-serif" font-size="70" '
          'font-weight="900" letter-spacing="1" fill="#0F3D63">EDUVIAGT</text>'
        + '<text x="212" y="150" font-family="Instrument Sans, Segoe UI, sans-serif" font-size="23" '
          f'fill="{AZUL_TXT}">Sistema Integral de Gestión de Becas</text>'
        + '<text x="212" y="182" font-family="Instrument Sans, Segoe UI, sans-serif" font-size="14.5" '
          'letter-spacing="1.6" fill="#18233A">MINISTERIO DE EDUCACIÓN · GUATEMALA</text>'
        + "</svg>"
    )
    (OUT / "logo.svg").write_text(logo, encoding="utf-8")

    favicon = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" '
        'role="img" aria-label="EDUVIAGT — Ministerio de Educación de Guatemala">'
        + icon_body("favicon") + "</svg>"
    )
    (OUT / "favicon.svg").write_text(favicon, encoding="utf-8")

    print("slides:", len(prs.slides.__iter__.__self__._sldIdLst))
    print("saved:", pptx_path)


if __name__ == "__main__":
    build()
