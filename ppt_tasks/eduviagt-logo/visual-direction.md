# Visual direction — EDUVIAGT

## Status

- LOCKED
- Confirmed by: usuario (dirección A elegida; alcance "hoja de marca + 2 SVG")
- Confirmed at: 2026-10-16

## Visual thesis

**Institucional y cálido.** El azul profundo da confianza; un trazo en oro
asciende como la *vía* hacia la beca y, a la vez, lee como marca de aprobación.
Todo sobre una retícula geométrica simple, legible de 16 px a valla pública.

## Theme Lock

- Version: 1
- Status: ACTIVE
- User-confirmed at: 2026-10-16
- Forbidden patterns: degradados adicionales o sombras fuera del badge; contornos
  finos (< 0.1× el lado); texto en oro sobre fondo claro; deformar o rotar el
  isotipo; tipografías distintas a la display/body definidas.

## Resolved theme record

- Source: `ThemeComposer.compose(...)`
- Resolved-theme file: `out/resolved_theme.json`
- Seed: 7
- `pptx-designer` version: 1.0.0b11
- Imported module path: `...\site-packages\pptx_designer\__init__.py`

## Design system

- Mood and audience fit: confiable, oficial, cercano; estudiantes (niños–adultos)
  y personal del MINEDUC.
- Colors: azul `#0F3D63` / `#3D8EC7` (degrado del badge), oro `#D4A72C`, oro
  oscuro `#7A5F17` (texto sobre claro), tinta `#18233A`, papel `#F5F7FA`, blanco
  `#FFFFFF`, azul de texto `#2E6E9E` (≥ 5:1 sobre blanco).
- Typography and fallback: display **Archivo Black** → fallback **Arial Black**;
  body **Instrument Sans** → fallback **Segoe UI**.
- Grid, margins, and spacing: lámina 16:9 (13.333 × 7.5 in); margen 0.7 in;
  retícula de 3 columnas de 3.778 in con 0.3 in de separación; isotipo construido
  sobre un módulo x = lado / 16.
- Isotipo: recuadro 512 × 512, radio 116; trazo de la «V» 64 (86 en favicon);
  barra 212 × 26; degradado lineal 45° `#3D8EC7 → #0F3D63`.
- Accent system: un único acento (oro) para reglas de título, marcos y el brazo
  ascendente; nada más compite con él.

## Local C override (justified)

Se pasa un diccionario `C` explícito con la paleta institucional (permitido por
las reglas de autoría: "keep colors in a `C` dictionary or explicit theme
tokens"). Justificación: esta lámina **es** la identidad de marca, por lo que los
hex institucionales son la autoridad, no el theme compuesto. El theme resuelto se
compone, valida y adjunta igualmente (registro arriba).
