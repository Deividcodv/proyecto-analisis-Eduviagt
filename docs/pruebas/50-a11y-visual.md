# EDUVIAGT — Informe visual y de accesibilidad (Task 6)

Rama: `test/bug-hunt-revision` · Fecha: 2026-10-16
Enfoque: accesibilidad WCAG 2.0/2.1 nivel **A y AA** con **axe**, revisión de
formularios/foco y revisión visual (capturas) en escritorio y móvil.

## 1. Qué se hizo

Nueva suite `apps/web/e2e/a11y.spec.ts` (20 casos) que:

1. Ejecuta **axe** (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) en **12 páginas
   públicas**: portada, convocatorias, registro, login, consulta, ayuda, faq,
   requisitos, nosotros, contacto, soporte y transparencia.
   Falla solo ante violaciones de impacto **serio o crítico**; las moderadas o
   menores se imprimen para el informe.
2. Verifica que **todo control de formulario** del registro tenga nombre accesible
   (`label` o `aria-label`).
3. Verifica la **navegación por teclado** desde la portada (el primer `Tab` mueve
   el foco fuera de `<body>`).
4. Toma **capturas** de 6 páginas en escritorio (1280px) y móvil (375px) y comprueba
   que **no haya desplazamiento horizontal** en móvil.

| Métrica | Resultado |
|---|---|
| Páginas escaneadas con axe | 12 |
| Páginas **sin ninguna** violación | 10 / 12 |
| Páginas con violación grave | **2** (portada, soporte) |
| Reglas violadas | 1 (`color-contrast`) |
| Formularios sin etiqueta | 0 |
| Foco de teclado | OK |
| Desborde horizontal en móvil (6 páginas) | 0 |

> **Estado de la suite:** `a11y.spec.ts` queda en **rojo (2 casos)** a propósito
> hasta que se corrijan los contrastes en el Task 7. Las otras 18 pasan.

## 2. Hallazgos

### A-001 — Grave — Texto dorado sobre fondo claro no tiene contraste suficiente

El color de marca **dorado** `#D4A72C` (`text-brutal-gold`) se usa como color de
texto sobre fondos **blancos o papel** (`#FFFFFF` / `#F5F7FA`), donde apenas llega
a **2,1–2,2:1** cuando el mínimo AA es **4,5:1**.

| Archivo:línea | Texto | Contraste | Mínimo |
|---|---|---|---|
| `components/home/LandingPublico.tsx:101` | `// Institucional` | 2,24 | 4,5 |
| `components/home/LandingPublico.tsx:107` | `// Misión` | 2,08 | 4,5 |
| `components/home/LandingPublico.tsx:225` | `// Documentos` | 2,24 | 4,5 |
| `app/soporte/page.tsx` (etiqueta) | `// Asistente virtual` | 2,08 | 4,5 |

**Alcance:** hay **36 usos** de `text-brutal-gold` en la app. Sobre fondos **oscuros**
(`brutal-tinta`) el contraste sí cumple; el problema son los fondos **claros**. El
escaneo solo cubre páginas públicas, así que las páginas con sesión
(panel, admin, reportes, evaluador...) probablemente repiten el patrón.

**Opciones de arreglo** (decidir en Task 7):
- Definir un **dorado oscuro para texto** (p. ej. `#8A6D1B`, ≈4,5:1 sobre blanco)
  y usarlo en las etiquetas sobre fondo claro; conservar `#D4A72C` para fondos,
  bordes y acentos grandes.
- O cambiar esas etiquetas a `text-brutal-tinta` (azul institucional), que sí cumple.

### A-002 — Grave — Párrafo secundario en gris claro sin contraste suficiente

`components/home/LandingPublico.tsx:239` — «La lista exacta de documentos se define
para cada convocatoria...» con `text-brutal-tinta/60` (`#747B89`) sobre blanco:

- Contraste **4,25:1** (mínimo 4,5:1).

**Arreglo:** subir la opacidad (p. ej. `text-brutal-tinta/80`) o usar el color pleno.

### A-003 — Grave — Enlace dentro del bloque dorado sin contraste suficiente

`components/home/LandingPublico.tsx:265-268` — «¿Ya te postulaste? Consulta tu
solicitud por código →» dentro del recuadro dorado de cierre:

- Contraste **3,14:1** (texto `#635834` = tinta al 60 % sobre dorado `#D4A72C`;
  mínimo 4,5:1).

**Arreglo:** usar tinta a opacidad completa (`text-brutal-tinta`) sobre el dorado,
o aclarar el fondo del bloque.

## 3. Lo que pasó la revisión (sin hallazgos)

- **10 de 12 páginas** no tienen ninguna violación de axe.
- **Formularios:** todos los controles visibles del registro tienen nombre accesible.
- **Teclado:** el foco sale de `<body>` con el primer `Tab` en la portada.
- **Responsive:** ninguna de las 6 páginas capturadas genera desplazamiento
  horizontal a 375px.
- No aparecen problemas de `alt`, `label`, roles ni estructura de encabezados en
  las páginas públicas.

## 4. Capturas (evidencia)

Guardadas en `apps/web/e2e/__screenshots__/` (escritorio 1280px y móvil 375px):
portada, convocatorias, registro, login, consulta y ayuda. Ese directorio está
**ignorado por git** (se regenera en cada corrida y su contenido depende de los
datos vivos); las capturas quedan como evidencia local.

> **Limitación honesta:** el modelo que ejecutó este task **no puede ver imágenes**,
> así que la revisión "a ojo" de las capturas queda para una persona. Lo que sí es
> automático y verificable es el escaneo de axe, la comprobación de etiquetas/foco
> y la de desborde horizontal; todo eso está en verde salvo los contrastes A-001..A-003.

## 5. Siguientes pasos

- **A-001..A-003:** corregidos (token `brutal-gold-dark` y opacidades); `a11y.spec.ts`
  volvió a verde.
- **A-004 — hecho:** el escaneo de axe cubre ahora **6 páginas con sesión**
  (admin: convocatorias, solicitudes, comités, sesiones, seguridad y perfil), con
  inicio de sesión por UI. Encontró **4 clases de violaciones reales**, ya corregidas:
  1. **Contraste del contador de la campana** (papel sobre `#E5484D`, 3,64:1): el
     token `brutal-rojo` pasó a `#C0392B` (5,05:1) y se ajustaron las insignias
     rojas y la translúcida `tinta/60` (4,47:1 → 11,2:1).
  2. **Nombre accesible de la campana**: el `aria-label` no incluía el número
     visible del contador (`label-content-name-mismatch`).
  3. **Etiquetas desasociadas** en `Input`/`Select` cuando no se pasa `id` ni
     `name` (causa raíz en los componentes compartidos): ahora se genera un id
     estable con `useId()`, más `aria-invalid`/`aria-describedby` en los errores.
  4. **`select`/`input` sin nombre accesible** en la matriz de roles, los paneles
     de administración y los filtros.
  Resultado: **18/18 en verde** (12 públicas + 6 con sesión).
