# EDUVIAGT — Informe de contenido e idioma (Task 5)

Rama: `test/bug-hunt-revision` · Fecha: 2026-10-16
Enfoque: revisión de **todos los textos que ve el usuario** en el portal.
Público objetivo: estudiantes **desde niños hasta adultos**, así que la meta es
lenguaje claro, frases cortas y sin jerga técnica.

## 1. Método

1. Se extrajeron las cadenas visibles de `apps/web/src/**/*.tsx` y `apps/web/src/lib/*.ts`
   (texto JSX y props `title`/`subtitle`/`label`/`placeholder`/`aria-label`/`alt`/mensajes de error).
2. Se clasificaron en 5 grupos: ortografía/gramática, inglés/técnico, relleno
   (`lorem`/`TODO`), jerga y consistencia de tono.
3. **Cada hallazgo se verificó a mano** leyendo el archivo en su línea exacta antes
   de reportarlo (se descartaron falsos positivos y se corrigieron números de línea).

Ninguna cadena de este informe es especulativa: todas se vieron en el archivo citado.

## 2. Resumen

| Categoría | Defectos | Sugerencias |
|---|---|---|
| Ortografía / gramática / pluralización | 3 | 1 |
| Inglés o técnico visible | 11 | 0 |
| Relleno (`lorem`/`TODO`) | **0** | 0 |
| Jerga o texto complejo | 0 | 8 |
| Consistencia de tono / formato | 0 | 3 |
| **Total** | **14** | **12** |

- **Defecto** = error objetivo (gramática, inglés o enum crudo expuesto). Debe corregirse.
- **Sugerencia** = mejora de redacción/claridad para el público objetivo.

## 3. Defectos a corregir

| ID | Ubicación | Texto actual | Problema | Corrección propuesta | Sev. |
|---|---|---|---|---|---|
| C-001 | `app/ayuda/page.tsx:48` | «...garantiza procesos auditable y verificables.» | Concordancia: falta el plural | «...procesos **auditables** y verificables.» | Media |
| C-002 | `app/convocatorias/page.tsx:70,72,73` | «convocatoria(s) abierta(s)», «convocatoria(s) no abierta(s)», «convocatoria(s)» | Pluralización con «(s)», visible en la página pública principal | Singular/plural real («convocatoria abierta» / «convocatorias abiertas»; «cerradas») | Media |
| C-003 | `app/comite/page.tsx:178,180,193` | «votante(s)», «miembro(s)», «voto(s)» | Pluralización con «(s)» | Singular/plural real | Baja |
| C-004 | `components/layout/Footer.tsx:75` | «v1.1 — brutal edition» | Texto de marca en inglés, visible en todo el sitio | «Versión 1.1» | Baja |
| C-005 | `app/reportes/page.tsx:147,204,205` | «Score promedio», «Evals completadas», «Score global» | Anglicismos | «Puntaje promedio», «Evaluaciones completadas», «Puntaje global» | Media |
| C-006 | `components/admin/PanelSolicitudes.tsx:52,61,271,275,305` | «score» («No se pudo obtener el score», «Ver score», «Score por evaluador»...) | Anglicismo repetido | «puntaje» | Baja |
| C-007 | `components/admin/PanelSolicitudes.tsx:153` | «Solicitud marcada como EVALUADA.» | Enum crudo en mayúsculas | «Solicitud marcada como evaluada.» | Baja |
| C-008 | `components/admin/PanelSolicitudes.tsx:212` | «...con rol EVALUADOR registrados...» | Enum crudo | «...con rol Evaluador...» | Baja |
| C-009 | `app/reportes/page.tsx:215` | `labels={...map((e) => e.estado)}` | Muestra el enum crudo (ABIERTA/CERRADA) en el gráfico | Usar `etiquetaEstado(e.estado)` (ya existe y cubre estos estados) | Baja |
| C-010 | `app/auditoria/page.tsx:90` | `placeholder="Acción (ej. create)"` | Ejemplo en inglés | «Acción (ej. crear)» | Baja |
| C-011 | `app/auditoria/page.tsx:143` | `{item.accion}` → `create`/`update`/`delete` | Enum crudo visible en la tabla | Mapa a «Crear/Actualizar/Eliminar» | Baja |
| C-012 | `app/solicitudes/[id]/page.tsx:129,177` | «Volver al dashboard», «← Volver al dashboard» | Anglicismo «dashboard» | «Volver a mi panel» | Baja |
| C-013 | `lib/api.ts:379`, `lib/api-auth.ts:45,80`, `components/reportes/ExportarReporte.tsx:51` | «La API respondió con estado {status}» | Expone «API» y un código HTTP al usuario | «No pudimos completar la solicitud. Intenta de nuevo.» | Media |
| C-014 | `app/faq/page.tsx:68` | «// FAQ» | Sigla en inglés en etiqueta; el resto usa español | «// Preguntas frecuentes» | Baja |

## 4. Sugerencias de mejora (lenguaje para el público objetivo)

| ID | Ubicación | Texto actual | Por qué | Propuesta |
|---|---|---|---|---|
| C-015 | `components/home/LandingPublico.tsx:45`, `components/convocatorias/BotonPostular.tsx:45` | «Todo tu expediente, un solo lugar.» / «Iniciarás un expediente de postulación.» | «Expediente» es jerga burocrática | «Toda tu postulación, en un solo lugar.» / «Comenzarás tu postulación.» |
| C-016 | `components/home/LandingPublico.tsx:15` | «Ser guatemalteco(a) de nacimiento o naturalizado» | «(a)» inclusivo desigual | «Ser guatemalteco o guatemalteca de nacimiento o naturalizado» |
| C-017 | `app/transparencia/page.tsx:30,32` | «Trazabilidad» / «Cada mutación del sistema queda registrada en un historial de auditoría con autor, fecha, entidad e IP.» | Jerga de TI («mutación», «IP») | «Seguimiento de cada paso» / «Cada cambio queda registrado con la persona responsable, la fecha y el detalle.» |
| C-018 | `components/home/LandingPublico.tsx:56` | «● Seguimiento auditable» | «Auditable» es técnico | «● Seguimiento claro» |
| C-019 | `app/reportes/page.tsx:127,240,267` | «Panel de métricas para...», «...solicitudes vs evaluaciones», «Embudo de conversión» | Jerga de negocio/marketing | «Resumen de resultados para...», «...solicitudes y evaluaciones», «Etapas del proceso» |
| C-020 | `app/evaluador/page.tsx:220,275` | «Puntaje ponderado:» / «...no tienes conflicto de interés con esta solicitud.» | Término estadístico / tono legal | «Puntaje final:» / «...no tienes relación con la persona postulante.» |
| C-021 | `app/auditoria/page.tsx:126,127` | Encabezados «ID» y «IP» | Siglas sin contexto | «Identificador» y «Dirección IP» |
| C-022 | `app/reportes/page.tsx:289,292,295` | «↓ CSV Solicitudes» (y «Convocatorias», «Evaluaciones») | Sigla sin explicar la acción | «↓ Descargar solicitudes (CSV)» |
| C-023 | `components/convocatorias/FiltrosConvocatorias.tsx:76` | «Nombre de convocatoria o beca...» | Usa «...» (tres puntos) mientras el resto usa «…» | Unificar con «…» |
| C-024 | `components/admin/PanelSolicitudes.tsx:240`, `components/admin/PanelSesiones.tsx:236`, `app/comite/page.tsx:167` | «Cancelar» / «Cerrar» / «Volver» | La misma acción (cerrar) con tres etiquetas distintas | Unificar («Cerrar») |

## 5. Lo que está bien (sin hallazgos)

- **Sin relleno:** no se encontró `lorem`, `ipsum`, `TODO`, `TBD`, `XXX` en texto visible.
  Los ejemplos de formulario son intencionales (`Juan Pérez`, `tucorreo@ejemplo.com`, `+502 5555 1234`).
- **Tono consistente:** todo el sitio usa **tú** («tu solicitud», «postúlate», «Inicia sesión»); no mezcla usted/tú.
- **Sin entidades HTML crudas** (`&nbsp;`, `&aacute;`, etc.).
- **Localización:** las fechas se formatean con `es-GT`.

## 6. Alcance y siguientes pasos

Este task **solo documenta**. No se modificó ningún archivo de la aplicación.
Según el plan, las correcciones de los **defectos** (C-001..C-014) se aplican en el
**Task 7 (Triaje y corrección)**, un hallazgo por commit junto con su verificación.
Las **sugerencias** (C-015..C-024) quedan a decisión del equipo.
