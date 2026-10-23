# Research

## Fuentes revisadas en el repo

- `apps/web/public/marca.svg` (512×512, isotipo, favicon y encabezado).
- `apps/web/public/logo.svg` (720×180, lockup horizontal, **no referenciado** en `src`).
- `apps/web/src/app/layout.tsx` — usa `/marca.svg` como `icon`/`shortcut`/`apple`.
- `apps/web/src/components/layout/Header.tsx` — isotipo 44×44 + wordmark en HTML.
- `apps/web/tailwind.config.js` — `brutal.gold #D4A72C`, `brutal.gold-dark #7A5F17`,
  `brutal.tinta #18233A`, `brutal.papel #F5F7FA`, `sigeb-blue #3D8EC7`,
  `sigeb-blue-dark #0F3D63`.
- `apps/web/src/app/layout.tsx` — fuentes `Archivo` (display), `Instrument_Sans`
  (body), `Space_Mono` (mono) vía `next/font/google`.

## Diagnóstico del logo anterior

- El isotipo tenía 4 componentes (libro, birrete, arco punteado dorado, punto) →
  a 44 px y sobre todo a 16 px (favicon) se convierte en mancha.
- Combinación libro + birrete = cliché educativo genérico.
- El arco punteado y el punto no comunican nada por sí solos.
- `logo.svg` dibuja el wordmark con `<text>` → depende de una fuente que no
  estará disponible si el SVG se carga como imagen.

## Decisión

Rediseño a una marca geométrica de un solo gesto («V» ascendente = vía +
aprobación) con un único acento dorado, más una variante simplificada para
favicon. Paleta institucional intacta.
