# Sprint 5 Recreacion - Daily Log

## Standups

### Dia 1 - 2026-09-28 (lunes, planning)

**Que hice ayer?**
- (Cierre de S4) Evaluacion completa: evaluadores, comites, sesiones y decisiones, con la web interna
  (paneles admin, comite, coordinador, evaluador) mergeada desde `3cb58e9`.

**Que hare hoy?**
- David: rama `feature/s5-base` con el bloque de infra compartida: registro de `ReportesModule`,
  `AuditModule` y `AsistenteModule` en `app.module.ts`, permiso `auditoria:ver` en el seed, variables
  `AI_*` en `.env.example` y los tres bloques de smoke nuevos.
- Jose: rama `feature/reportes-csv`; `apps/api/src/reportes/` con los 3 agregados y el export CSV.
- Marcos: rama `feature/auditoria`; `apps/api/src/audit/` con `AuditService.log()` y `GET /audit`.
- Hamilton: arranca el modelo de la base de conocimiento y el `AsistenteIAProxy`.
- Yemerson: study de `1436e41` y del panel que ya existe de S4; define el workbench por rol.
- Orden de merge fijado: David -> Jose -> Marcos -> Hamilton -> Yemerson.

**Bloqueos:**
- `prisma migrate dev` tira EPERM si la API esta corriendo en el puerto 3000: hay que apagarla antes de
  aplicar la migracion.
- Nadie es dueño de `apps/web/src/components/ui/InternalPageHeader.tsx` y el panel admin lo importa:
  David lo toma como parche de infra, o el build de la web se cae.

---

### Dia 2 - 2026-09-29 (martes)

**Que hice ayer?**
- Jose: agregados listos y CSV con BOM; el smoke de reportes falla porque el CSV llegaba como
  `{"data":"\ufeffid;estado..."}`.
- Marcos: `GET /audit` paginado y filtrable operativo, con spec pasando.
- Hamilton: `POST /asistente/preguntar` responde desde la KB (fallback) y persiste la conversacion.
- David: migracion `tsvector` + indice GIN aplicada; el seed con las 33 entradas cargado.

**Que hare hoy?**
- Jose: parche del `TransformInterceptor` (`if (res.headersSent) return next.handle()`), que toca un archivo
  compartido de S1: lo coordina con Marcos y lo sube David al final para no romper el orden.
- Marcos: deja la instrumentacion dirigida de auth/users anotada como deuda de S6.
- Hamilton: `OpenAIProveedor` opcional con degradacion a fallback; cierra US-38.
- Yemerson: copia `app/admin`, `app/perfil`, `components/admin` y `components/home` de `1436e41`.
- David: aprueba los PR de Jose y Marcos.

**Bloqueos:**
- Sin `AI_API_KEY` en el entorno: el asistente responde igual por fallback, pero nadie puede ver la
  respuesta del LLM. Se decide que el fallback es el proveedor por defecto tambien en CI.

---

### Dia 3 - 2026-09-30 (miercoles)

**Que hice ayer?**
- Jose: CSV crudo y BOM correcto; smoke de reportes verde en CI.
- Hamilton: US-38 cerrada; el widget de chat de `2e52a69` ya esta en su rama.
- Yemerson: workbench por rol y header de acciones renderizando; matriz de roles operativa.

**Que hare hoy?**
- Yemerson: integrar el widget de chat en `apps/web/src/app/layout.tsx` (archivo compartido) y anadir
  `app/page.tsx` para montar el `HomeShell`.
- Yemerson: revisar el upgrade de los 4 paneles que deja Hamilton desde S4 y documentar la excepcion.
- David: auditar el diff de Yemerson contra `1436e41` y resolver el conflicto de `layout.tsx`.
- Hamilton: fix del widget: usa `http()` y el interceptor global envuelve la respuesta en `{ data }`, asi
  que la burbuja sale vacia; pasa a `httpData()`.
- David: con los 3 modulos registrados, corre el smoke completo de S5 (reportes, auditoria, asistente).

**Bloqueos:**
- `layout.tsx` lo tocan Hamilton y Yemerson en el mismo dia: se resuelve en la ventana de merge de David.
- Los tokens brutalistas de `tailwind.config.js` y `globals.css` no los entrega nadie en S1-S5; sin ellos
  el panel compila pero se ve sin estilos. Queda como punto abierto para el review.

---

### Dia 4 - 2026-10-01 (jueves)

**Que hice ayer?**
- Yemerson: panel admin completo con las 4 pestañas; el widget de chat ya se ve flotando en el portal.
- Hamilton: widget con el fix de desempaquetado, burbuja con respuesta y fuentes.
- David: `InternalPageHeader` parcheado; el build de la web pasa.

**Que hare hoy?**
- David: prueba de extremo a extremo del sprint con la API y la web arriba.
- Todos: passage a Done de las historias que tienen el diff VACIO contra su fuente.
- Yemerson: deja documentado que la subtab Usuarios renderiza pero sus llamadas fallan (el backend de
  `/seguridad/usuarios` llega en S6): no se maquilla en el demo.
- David: prepara el guion del review.

**Bloqueos:**
- La subtab Usuarios del panel de seguridad no tiene backend todavia: se declara como limitacion
  consciente del demo, no como bug.

---

### Dia 5 - 2026-10-02 (viernes, review + retrospectiva)

**Que hice ayer?**
- 44/44 puntos cerrados con los 4 modulos verificados contra su commit fuente.
- David: checklist de fidelidad completo, los 4 `git diff` de modulos VACIOS.

**Que hare hoy?**
- David: review con demo (agregados, CSV en Excel, bitacora, asistente, panel admin).
- Equipo: retrospectiva y tabla de acciones para S6.
- David: deja planificada la integracion dirigida de auditoria, el backend de seguridad y la migracion
  `20260902024700_usuario_datos_perfil` como arranque de S6.

**Bloqueos:**
- Ninguno

---

## Correccion posterior (fuera del sprint)

Al abrir las PRs reales contra `develop` de `proyecto-analisis-Eduviagt` se verifico el estado de
destino y varias anotaciones de este daily log resultaron equivocadas. Queda aca la version corregida
para que el registro no se lea como verdad:

- `InternalPageHeader.tsx` ya existe en el repo de destino, y `apps/api/src/audit/` tambien.
  Marcos no tiene PR que entregar en S5; su trabajo (integracion dirigida) queda en S6.
- `.env.example` ya traia `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` y `AI_TIMEOUT_MS`.
- La base de conocimiento tiene **33** entradas, no 34.
- Los tokens brutalistas de Tailwind son de S8 (`1436e41`), no de S5.

Lo que si quedo confirmado: el permiso `auditoria:ver` es necesario (el modulo de auditoria ya lo
consume y en `develop` el permiso no existia), la migracion del indice GIN es necesaria para el
`searchVector` del asistente, y el `fix httpData()` del widget si era un bug real.
