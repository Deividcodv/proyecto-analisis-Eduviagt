"""Independent verification: text overflow (real font metrics), bounds, and contrast.
Does not rely on any vision model.
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import ImageFont
from pptx import Presentation as Pptx
from pptx.util import Emu

HERE = Path(__file__).parent
PPTX = HERE / "out" / "EDUVIAGT-marca.pptx"
DPI = 96.0
EMU_IN = 914400

FONT_FILES = {
    "Arial Black": r"C:\Windows\Fonts\ariblk.ttf",
    "Segoe UI": r"C:\Windows\Fonts\segoeui.ttf",
    "Consolas": r"C:\Windows\Fonts\consola.ttf",
}


def inches(v):
    return (v or 0) / EMU_IN


def lumin(hexc):
    hexc = hexc.lstrip("#")
    r, g, b = (int(hexc[i:i + 2], 16) / 255 for i in (0, 2, 4))
    def f(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = f(r), f(g), f(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = lumin(a), lumin(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def measure(text, font_name, pt):
    path = FONT_FILES.get(font_name, FONT_FILES["Segoe UI"])
    try:
        font = ImageFont.truetype(path, max(1, int(round(pt))))
    except OSError:
        return None
    w_pt = font.getlength(text)
    return w_pt / 72.0  # inches


def main():
    prs = Pptx(str(PPTX))
    SW, SH = inches(prs.slide_width), inches(prs.slide_height)
    problems = []
    wraps = []

    for si, slide in enumerate(prs.slides, 1):
        for sh in slide.shapes:
            x, y, w, h = inches(sh.left), inches(sh.top), inches(sh.width), inches(sh.height)
            name = sh.shape_type
            if x < -0.02 or y < -0.02 or x + w > SW + 0.02 or y + h > SH + 0.02:
                problems.append(f"S{si} OUT-OF-BOUNDS {name} x={x:.2f} y={y:.2f} w={w:.2f} h={h:.2f}")
            if not sh.has_text_frame:
                continue
            txt = sh.text_frame.text
            if not txt.strip():
                continue
            # effective font
            pt, fname = None, None
            for p in sh.text_frame.paragraphs:
                for r in p.runs:
                    if r.font.size:
                        v = r.font.size.pt
                        if pt is None or v > pt:
                            pt = v
                            fname = r.font.name or "Segoe UI"
            if pt is None:
                continue
            fname = fname or "Segoe UI"
            need_w = measure(txt, fname, pt)
            if need_w is None:
                continue
            lines = max(1, math.ceil(need_w / max(w - 0.2, 0.01)))  # 0.1in inset each side
            need_h = lines * pt * 1.22 / 72.0
            if need_h > h * 1.10:
                problems.append(
                    f"S{si} TEXT-OVERFLOW '{txt[:38]}' font={fname} {pt}pt "
                    f"box=({w:.2f}x{h:.2f})in need~({need_w:.2f}w, {need_h:.2f}h) lines~{lines}"
                )
            elif lines > 1:
                wraps.append(
                    f"S{si} wraps x{lines} '{txt[:38]}' font={fname} {pt}pt "
                    f"box_w={w:.2f} need_w={need_w:.2f}"
                )

    print("=== geometry / overflow (HARD) ===")
    print("\n".join(problems) if problems else "no vertical overflow / out-of-bounds issues")
    print("\n=== soft: text that wraps to multiple lines (verify visually) ===")
    print("\n".join(wraps) if wraps else "none")

    print("\n=== contrast (WCAG AA small text needs >= 4.5) ===")
    pairs = [
        ("white on azul-dark (cover wordmark)", "#FFFFFF", "#0F3D63"),
        ("oro on azul-dark", "#D4A72C", "#0F3D63"),
        ("oro on tinta", "#D4A72C", "#18233A"),
        ("AZUL_CLARO on tinta (cover subtitle)", "#9FC0DC", "#18233A"),
        ("GRIS on papel (footer)", "#8C9BB0", "#F5F7FA"),
        ("MUTED on papel (captions)", "#48586F", "#F5F7FA"),
        ("MUTED on blanco", "#48586F", "#FFFFFF"),
        ("AZUL on blanco (lockup subtitle)", "#3D8EC7", "#FFFFFF"),
        ("AZUL_TXT on blanco (fixed subtitle)", "#2E6E9E", "#FFFFFF"),
        ("AZUL_DARK on blanco", "#0F3D63", "#FFFFFF"),
        ("ORO on papel (misuse sample)", "#D4A72C", "#F5F7FA"),
        ("tinta on oro", "#18233A", "#D4A72C"),
    ]
    for label, fg, bg in pairs:
        r = contrast(fg, bg)
        flag = "FAIL" if r < 4.5 else ("AA-large" if r < 7 else "PASS")
        print(f"{r:5.2f}  {flag:9} {label}")


if __name__ == "__main__":
    main()
