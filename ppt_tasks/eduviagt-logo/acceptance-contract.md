# Acceptance contract — EDUVIAGT logo

| ID | Level | Requirement | Expected evidence in rendered output | Status |
|---|---|---|---|---|
| R1 | MUST | El isotipo se reconoce y lee a 16×16 px (favicon) y 44×44 px (encabezado), sin perder detalles ni volverse mancha. | `proof/slide01.png` + variante **favicon** (V blanca simple) a 16 px; confirmado por revisión con visión: el favicon es nítido, el detallado se vuelve mancha. En el sitio: `favicon.svg` (simplificado) cableado en `layout.tsx` para `icon`/`shortcut`; `marca.svg` (completo) para `apple` y el encabezado a 44 px | PASS |
| R2 | MUST | El PPTX contiene el logotipo como formas nativas editables (sin imágenes rasterizadas del logo). | `slide1.xml`: 4 `<a:custGeom>` freeform + `<a:gradFill>`, **0** `<a:blipFill>` | PASS |
| R3 | MUST | Coexisten dos SVG para el sitio: isotipo cuadrado (`marca.svg`) y lockup horizontal (`logo.svg`), coherentes con el PPTX. | Ambos SVG XML válidos; comparten la misma geometría/gradiente que el PPTX. Se añade `favicon.svg` (misma geometría, variante simplificada) para el icono de pestaña | PASS |
| R4 | MUST | Usa la paleta institucional con contraste consciente (WCAG AA para texto; el oro solo sobre fondo oscuro o con texto oscuro encima). | Tabla de contraste en `visual-review.md`; subtítulo corregido a #2E6E9E = 5.47:1 | PASS |
| R5 | MUST | La palabra "EDUVIAGT" es nítida y legible; el isotipo no depende de una fuente no instalada. | `marca.svg` tiene **0** elementos `<text>`; wordmark legible en los PNG | PASS |
| R6 | SHOULD | El isotipo comunica "educación + Guatemala + camino/oportunidad" sin depender solo del cliché libro+birrete. | Concepto «La Vía» documentado en la diapositiva 2 | PASS |
| R7 | SHOULD | Funciona sobre fondo oscuro (`#18233A`) y claro (`#F5F7FA`). | Diapositiva 4 (4 variantes) y diapositiva 5 (isotipo sobre tinta) | PASS |
| R8 | NICE | Incluye especificación de área de resguardo, tamaño mínimo y variantes de color. | Diapositivas 3, 4 y 5 | PASS |

Reglas:
- No se reescribe un MUST para que encaje con el resultado.
- Cada MUST exige evidencia visible en el render.
- Estado: `PASS`, `NEEDS_REVISION` o `BLOCKED`.

## Nota de proceso (limitación del modelo)

El modelo que construye **no puede ver imágenes**. La revisión visual se delegó a
un subagente con modelo con visión y se contrastó con una auditoría programática
independiente (`verify.py`). Se documenta un falso positivo del revisor de visión
(barra dorada de la portada) resuelto por medición directa del PPTX.
