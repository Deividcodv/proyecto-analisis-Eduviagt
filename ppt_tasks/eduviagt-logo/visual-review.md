# Visual review — EDUVIAGT logo (brand sheet)

## Toolchain (verified before generation)

| Component | Result |
|---|---|
| Python | 3.13.0 OK |
| pptx-designer | 1.0.0b11 (>= 1.0.0b8) OK |
| python-pptx / Pillow | 1.0.2 / 10.4.0 OK |
| Renderer | PowerPoint COM (`POWERPNT.EXE`) OK (LibreOffice/Poppler absent) |
| Display font | **Archivo Black not installed** → substituted with **Arial Black** |
| Body font | **Instrument Sans not installed** → substituted with **Segoe UI** |

The live site loads the real Archivo / Instrument Sans via `next/font`; only the
PPTX/PNG preview uses the substitutes (documented substitution, re-inspected).

## Method

The building model cannot see images, so the visual pass was delegated to a
vision-language subagent, **cross-checked against an independent programmatic
audit** (`verify.py`: real TTF font metrics for overflow, shape bounds, WCAG
contrast ratios). Programmatic results were treated as authoritative when they
disagreed with the vision model.

## Rounds

### Round 1 — full pass (VL) → PASS
### Round 2 — adversarial alignment pass (VL) → 3 defects
1. `slide02` chip title "Camino que asciende" wrapped to 2 lines.
2. `slide05` tiles did not share edges.
3. `proof01` 16 px icon was an unreadable blob.

### Round 3 — full re-pass (VL) → 2 defects
4. `slide05` clear-space gold frame overflowed the tile bottom (frame bottom
   6.97 in vs tile bottom 6.90 in).
5. `slide01` left accent seen as an edge bleed.

### Round 4 — confirmation (VL) → `slide05` OK; `slide01` flagged again.

## Fixes applied

| # | Fix |
|---|---|
| 1 | Chip titles moved to 11 pt with wider boxes; verified against text-box insets (0.1 in/side) |
| 2 | `slide05` rebuilt on a 3-column grid; horizontal-lockup tile width bug (`x1-x0-gap` → `x2-gap-x0`) fixed so it spans two columns and its text stays inside |
| 3 | Added a **simplified favicon variant** (bold single white V, no gold split, no bar) used at 16 px |
| 4 | Clear-space mark reduced to `cs=1.20, margin=0.30` → frame bottom 6.35 in, 0.55 in clear of the tile |
| 5 | Full-bleed left strip replaced by a contained accent bar at x=0.45 in |

## Documented false positive

Round 3/4 claimed the `slide01` gold bar "bleeds off the left edge". The PPTX
geometry was inspected directly: the only shapes near the left are the
full-bleed background (`x=0.000, w=13.333`) and the gold bar at
**`x=0.450, w=0.100`** (0.45 in from the edge — no bleed). The vision model's
spatial claim is wrong; the accent is intentional and contained.

## Contrast (WCAG; small text needs >= 4.5)

| Pair | Ratio | Verdict |
|---|---|---|
| white on #0F3D63 (wordmark) | 11.24 | PASS |
| #9FC0DC on #18233A (cover subtitle) | 8.24 | PASS |
| #2E6E9E on white (lockup subtitle, fixed) | 5.47 | PASS |
| #48586F on #F5F7FA (captions) | 6.75 | PASS |
| #48586F on white | 7.24 | PASS |
| #0F3D63 on white | 11.24 | PASS |
| #D4A72C on #0F3D63 (gold arm, graphic) | 5.01 | OK (>= 3 for graphics) |
| #D4A72C on #F5F7FA | 2.09 | **intentional** bad example (slide 6) |
| #8C9BB0 on #F5F7FA | 2.63 | not used on light (cover only, on #18233A) |
| #3D8EC7 on white | 3.56 | superseded by #2E6E9E in the real deck |

## Structural evidence

- SVG compiler: icon → **4 `custGeom` freeform shapes**, **0 raster pictures**.
- Badge gradient preserved as `<a:gradFill>` (#3D8EC7 → #0F3D63) with rounded
  corners as cubic béziers.
- `marca.svg`: valid XML, **0 `<text>` elements** (font-independent isotipo).
- `logo.svg`: valid XML; icon group + 3 text elements.
- 6 slides, no vertical text overflow, no out-of-bounds shapes.

## Acceptance

All MUST/SHOULD/NICE items PASS — see `acceptance-contract.md`.

## Known limitations (for the human reviewer)

- No Archivo/Instrument Sans on this machine → PPTX shows Arial Black/Segoe UI.
- The final human visual sign-off is still recommended (the model cannot see).
- `logo.svg` renders its wordmark as `<text>`; for a fully self-contained lockup
  the wordmark would need outlining (the site header uses HTML text, so impact
  is low).

---

## Rediseño L2 «Expediente» (segunda dirección, 2026-10)

Se pidió una marca **más brutalista y más relacionada con el sistema**. Se
descartó «La Vía» (V ascendente con degradado) y se adoptó **«Expediente»**:
recuadro tinta de esquinas a 90°, hoja papel con la esquina superior derecha
cortada, triángulo dorado (esquina doblada), pliegue tinta y palomita sellada.
**Sin degradados**: el PPTX ya no contiene `<a:gradFill>`.

### Ronda 5 — pase completo (VL) → 2 defectos reales

1. **El remate superior de la palomita se solapaba con el pliegue.** El revisor lo
   describió como «el pliegue pasa muy cerca del inicio de la palomita». Se
   verificó con `geomcheck.py` (rasteriza cada elemento por separado y mide la
   distancia mínima en unidades del propio SVG): el tope del remate caía en
   y≈166 y el pliegue llega a y=168 → **solape confirmado**. Corregido moviendo la
   palomita: la separación es ahora de **24 px** (≈2 px a 44 px reales).
2. **El favicon a 16 px era una mancha.** Ni la versión completa ni la
   simplificada se leían. Corregido: la hoja del favicon crece a 368×416 (72 %
   del ancho) y se eliminan pliegue y palomita.

El revisor también afirmó que el vértice inferior de la palomita «roza el borde
inferior de la hoja» y que el triángulo dorado «casi toca el borde del recuadro»:
`geomcheck.py` mide **84 px** y **76 px** de margen respectivamente → **falsos
positivos** de precisión espacial (la auditoría programática manda).

### Ronda 6 — re-verificación focalizada (VL) → ambos defectos corregidos

- «En icon-44 e icon-256 el pliegue y la palomita se ven **claramente separados**».
- «En icon-16-fav se distingue una **forma reconocible** (hoja con esquina
  cortada); **no es una mancha**».
- Sin recortes, desalineaciones ni artefactos en la hoja de prueba.

### Contraste del isotipo (verificado en `verify.py`)

| Par | Ratio | Veredicto |
|---|---|---|
| papel sobre tinta (hoja sobre el recuadro) | 14,60 | PASS |
| tinta sobre papel (palomita sellada) | 14,60 | PASS |
| oro sobre tinta (esquina doblada sobre el recuadro) | 6,99 | PASS |
| oro sobre papel (esquina sobre la hoja) | 2,09 | **mitigado** por el pliegue tinta de 16 px |

### Evidencia estructural (L2)

- Isotipo → **4 `custGeom`**, **0 raster**, **0 `gradFill`** (100 % plano).
- `marca.svg`: XML válido, 1 `<rect>` + 4 `<path>`, **0 `<text>`**.
- Geometría con **fuente única**: `build.py` define la geometría; `raster.py` y
  `geomcheck.py` la importan (sin copias que se desincronicen).
- Tamaño real: `raster.py` genera 16/24/32/44/64/96/256 px + la hoja de prueba.
- **Limitación del entorno:** PowerPoint por COM falla al abrir en esta sesión
  (`0x80070570`), así que los PNG de las diapositivas no se pudieron regenerar;
  los antiguos se retiraron de `docs/marca/preview/` para no documentar una marca
  que ya no existe.
