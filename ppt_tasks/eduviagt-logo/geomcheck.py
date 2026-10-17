"""Auditoría geométrica del isotipo: distancias mínimas entre elementos.

Comprueba de forma programática lo que un revisor visual solo puede estimar
(a 512 px de lienzo, que son las unidades del propio SVG).

Uso: python geomcheck.py
"""
from __future__ import annotations

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from build import _geo
from raster import _thick

S = 512  # se trabaja en las unidades del SVG: r = píxeles reales


def _masks(fav: bool = False, kinds=("sheet", "fold", "crease", "check")) -> dict:
    g = _geo(fav)
    x0, y0, x1, y1, cut = g["x0"], g["y0"], g["x1"], g["y1"], g["cut"]
    out = {}
    for kind in kinds:
        img = Image.new("L", (S, S), 0)
        d = ImageDraw.Draw(img)
        if kind == "sheet":
            d.polygon([(x0, y0), (x1 - cut, y0), (x1, y0 + cut), (x1, y1), (x0, y1)], fill=255)
        elif kind == "fold":
            d.polygon([(x1 - cut, y0), (x1, y0 + cut), (x1 - cut, y0 + cut)], fill=255)
        elif kind == "crease" and g["crease_w"]:
            _thick(d, [(x1 - cut, y0), (x1 - cut, y0 + cut), (x1, y0 + cut)], g["crease_w"], 255)
        elif kind == "check" and g["check"]:
            cp, w = g["check"][:3], g["check"][3]
            _thick(d, cp, w, 255)
        else:
            continue
        out[kind] = img
    return out


def gap(a: Image.Image, b: Image.Image, max_r: int = 90) -> float | None:
    """Distancia mínima entre dos máscaras, en unidades del SVG (px)."""
    if a.getbbox() is None or b.getbbox() is None:
        return None
    for r in range(1, max_r + 1):
        dil = a.filter(ImageFilter.MaxFilter(2 * r + 1))
        if ImageChops.multiply(dil, b).getbbox() is not None:
            return float(r)
    return None


def bbox(img: Image.Image):
    return img.getbbox()


def main() -> None:
    m = _masks()
    print("=== isotipo completo (512 px) ===")
    print("bbox hoja   :", bbox(m["sheet"]))
    print("bbox pliegue:", bbox(m["crease"]))
    print("bbox palomita:", bbox(m["check"]))
    print("bbox doblada:", bbox(m["fold"]))

    print("\nseparaciones mínimas (px sobre 512; 44 px de encabezado = /11.6):")
    for a, b, minimo in [
        ("check", "crease", 12),
        ("fold", "crease", 0),
        ("check", "fold", 12),
    ]:
        if a in m and b in m:
            # el pliegue es tinta y la palomita es tinta: en el isotipo real no
            # se tocan porque ambos van sobre la hoja; se mide la separación.
            g = gap(m[a], m[b])
            marca = "OK" if (g is None or g >= minimo or minimo == 0) else "REVISAR"
            print(f"  {a:8} <-> {b:8}: {g}  (mínimo sugerido {minimo})  {marca}")

    # palomita dentro de la hoja
    hoja = m["sheet"]
    hb = bbox(hoja)
    for nombre, mascara in (("palomita", m["check"]), ("pliegue", m["crease"])):
        bb = bbox(mascara)
        dentro = bb[0] >= hb[0] and bb[1] >= hb[1] and bb[2] <= hb[2] and bb[3] <= hb[3]
        nota = ""
        if nombre == "pliegue" and not dentro:
            nota = "  (esperado: los remates rectos se extienden sobre el tinta del recuadro, mismo color)"
        print(f"  {nombre}: dentro de la hoja: {dentro}  {bb}{nota}")

    fav = _masks(fav=True, kinds=("sheet", "fold"))
    print("\n=== favicon (16 px) ===")
    print("bbox hoja   :", bbox(fav["sheet"]), "(la hoja ocupa", 
          round((bbox(fav['sheet'])[2] - bbox(fav['sheet'])[0]) / 512 * 100), "% del ancho)")
    print("elementos   : hoja + esquina doblada (sin pliegue ni palomita)")


if __name__ == "__main__":
    main()
