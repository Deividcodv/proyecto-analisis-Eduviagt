# Acceptance contract — EDUVIAGT logo

| ID | Level | Requirement | Expected evidence in rendered output | Status |
|---|---|---|---|---|
| R1 | MUST | El isotipo se reconoce y lee a 16×16 px (favicon) y 44×44 px (encabezado), sin perder detalles ni volverse mancha. | Rasterizado **a tamaño real** (`raster.py`, fiel a las coordenadas del SVG): `icon-16-fav.png`, `icon-16.png`, `icon-24.png`, `icon-44.png`, `icon-64.png`, `icon-256.png` + hoja de prueba `icon-sheet.png`. En la ronda 1 de revisión con visión, el isotipo **completo** a 16 px resultó una mancha; por eso el favicon se simplifica y agranda (hoja 368×416 = 72 % del ancho, sin pliegue ni palomita). Ronda 2: «se distingue una forma reconocible: hoja blanca con el triángulo dorado en la esquina superior derecha; **no es una mancha**». Cableado en `layout.tsx`: `favicon.svg` para `icon`/`shortcut`, `marca.svg` para `apple` y el encabezado a 44 px | PASS |
| R2 | MUST | El PPTX contiene el logotipo como formas nativas editables (sin imágenes rasterizadas del logo). | `slide1.xml`: **4** `<a:custGeom>` (hoja, esquina doblada, pliegue y palomita), **0** `<a:blipFill>` y **0** `gradFill`: el isotipo es 100 % plano | PASS |
| R3 | MUST | Coexisten dos SVG para el sitio: isotipo cuadrado (`marca.svg`) y lockup horizontal (`logo.svg`), coherentes con el PPTX. | Los 3 SVG son XML válidos y comparten la **misma geometría plana** que el PPTX (sin degradados). `marca.svg` = 617 B con 1 `<rect>` + 4 `<path>`; SHA-256 idéntico entre `apps/web/public/` y `docs/marca/` (verificado) | PASS |
| R4 | MUST | Usa la paleta institucional con contraste consciente (WCAG AA para texto; el oro solo sobre fondo oscuro o con texto oscuro encima). | `verify.py`: papel sobre tinta **14,6:1**; tinta sobre papel **14,6:1**; oro sobre tinta **6,99:1**. El único par débil (oro sobre papel, 2,09:1) queda **mitigado por el pliegue tinta de 16 px** que separa la esquina doblada de la hoja | PASS |
| R5 | MUST | La palabra "EDUVIAGT" es nítida y legible; el isotipo no depende de una fuente no instalada. | `marca.svg` tiene **0** elementos `<text>` (solo formas); el wordmark del lockup usa `Archivo Black, Arial Black, sans-serif` como respaldo | PASS |
| R6 | SHOULD | El isotipo comunica "expediente + revisión + beca" sin depender solo del cliché libro+birrete. | Concepto «Expediente» documentado en la diapositiva 2: la hoja que se entrega, la esquina doblada (caso abierto en el sistema) y la palomita (beca aprobada) | PASS |
| R7 | SHOULD | Funciona sobre fondo oscuro (`#18233A`) y claro (`#F5F7FA`). | Diapositiva 4 (4 variantes) y diapositiva 5 (isotipo sobre tinta). Sobre tinta el recuadro del isotipo se funde con el fondo y la marca se lee como la hoja flotante: el comportamiento es **intencional y adaptativo**, documentado en la ronda 2 | PASS |
| R8 | NICE | Incluye especificación de área de resguardo, tamaño mínimo y variantes de color. | Diapositivas 3, 4 y 5 | PASS |

Reglas:
- No se reescribe un MUST para que encaje con el resultado.
- Cada MUST exige evidencia visible en el render.
- Estado: `PASS`, `NEEDS_REVISION` o `BLOCKED`.

## Nota de proceso (limitación del modelo)

El modelo que construye **no puede ver imágenes**. La revisión visual se delegó a
un subagente con modelo con visión y se contrastó con auditorías programáticas
independientes: `verify.py` (métricas de fuente, límites y contraste WCAG) y
`geomcheck.py` (distancias mínimas entre elementos del isotipo, en unidades del
propio SVG).

Del contraste entre revisión visual y auditoría salieron dos hallazgos que la
auditoría programática **confirmó y cuantificó**:

1. El remate superior de la palomita se **solapaba** con el pliegue (el tope del
   remate caía en y≈166 sobre un pliegue que llega a y=168). Corregido: la
   separación mínima es ahora de **24 px** sobre 512 (verificado con `geomcheck.py`).
2. El favicon a 16 px no se resolvía (mancha). Corregido simplificando y agrandando
   la hoja.

Limitación del entorno: el renderizador de diapositivas es PowerPoint por COM y
en esta sesión falla al abrir (`0x80070570`), así que **no se regeneraron los PNG
de las diapositivas**; la evidencia de tamaño real se obtuvo rasterizando la
misma geometría con PIL (`raster.py`). Los PNG antiguos se retiraron de
`docs/marca/preview/` para no documentar una marca que ya no existe.
