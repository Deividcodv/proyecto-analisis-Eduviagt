"""Exporta las diapositivas de un PPTX a PNG usando PowerPoint vía win32com.

Uso: python render_pptx.py <pptx> <outdir> <prefix> [ancho] [alto]
"""
from __future__ import annotations

import sys
from pathlib import Path

import win32com.client


def main() -> int:
    pptx = Path(sys.argv[1]).resolve()
    outdir = Path(sys.argv[2]).resolve()
    prefix = sys.argv[3]
    width = int(sys.argv[4]) if len(sys.argv) > 4 else 1600
    height = int(sys.argv[5]) if len(sys.argv) > 5 else 900

    outdir.mkdir(parents=True, exist_ok=True)

    app = win32com.client.Dispatch("PowerPoint.Application")
    try:
        pres = app.Presentations.Open(str(pptx), ReadOnly=True, Untitled=False, WithWindow=False)
        n = 0
        for i in range(1, pres.Slides.Count + 1):
            path = outdir / f"{prefix}{i:02d}.png"
            pres.Slides(i).Export(str(path), "PNG", width, height)
            n = i
        pres.Close()
        print(f"exported {n} slides -> {outdir}")
    finally:
        app.Quit()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
