# Brief — Rediseño de la marca EDUVIAGT

- **Tema:** identidad visual (logotipo/isotipo) para EDUVIAGT.
- **Audiencia:** estudiantes de Guatemala (niños, adolescentes y adultos), familias,
  personal del Ministerio de Educación (MINEDUC) y público general. Usuarios con
  poca familiaridad tecnológica.
- **Escenario:** marca oficial de la plataforma de becas del MINEDUC de Guatemala;
  se ve en la web (encabezado sobre fondo oscuro), como favicon (16 px), en
  documentos/constancias PDF y en la ficha del programa.
- **Idioma:** español.
- **Propósito / acción:** comunicar de inmediato "oportunidad educativa oficial
  de Guatemala"; que cualquier persona reconozca la plataforma y confíe en ella.
- **Duración y páginas:** "hoja de marca" (mini-deck) de 6 diapositivas que
  documenta y entrega el logotipo; no es una presentación de charla.
- **Material de origen:** `apps/web/public/marca.svg` (isotipo 512×512) y
  `apps/web/public/logo.svg` (lockup horizontal 720×180); paleta y fuentes del
  sistema (`tailwind.config.js`, `layout.tsx`).
- **Restricciones de marca/imagen/datos/editabilidad:**
  - Paleta institucional: azul `#0F3D63` / `#3D8EC7`, oro `#D4A72C`, tinta
    `#18233A`, papel `#F5F7FA`.
  - El PPTX debe contener el logotipo como **formas nativas editables**.
  - La fuente es Archivo (títulos) / Instrument Sans (texto); el SVG no debe
    depender de fuentes no instaladas para el isotipo.
  - Legibilidad a 16 px (favicon) y 44 px (encabezado).

## Outcome

Que la audiencia **entienda** que EDUVIAGT es la vía oficial hacia una beca,
**recuerde** una marca simple, clara y propia de Guatemala, y **confíe** en ella
como servicio público. El isotipo debe leerse sin ambigüedad incluso en tamaño
mínimo, y funcionar sobre fondo oscuro y claro.
