# Sprint 2 Recreacion - Daily Log

## Standups

### Dia 1 - 2026-09-09

**Que hice ayer?**
- (Cierre de S1) Cimientos listos: auth API, catalogos/convocatorias backend y CI base verde.

**Que hare hoy?**
- Yemerson: crear rama `feature/layout-base` y montar styles + Design System + home conectada al API.
- Hector: rama `feature/convocatorias-publicas` con `GET /convocatorias` publico y `?busqueda=`.
- Jose: rama `feature/consulta-publica` con `GET /solicitudes/consulta/:codigo` acotado.
- David: actualizar CI para el smoke del portal; definir `app.module.ts` del prototipo (modulos publicos).

**Bloqueos:**
- Ninguno

---

### Dia 2 - 2026-09-10

**Que hice ayer?**
- Yemerson: layout base listo (styles, componentes UI base) y home conectada (US-40).
- Hector: `GET /convocatorias?busqueda=` operativo.
- Jose: endpoint publico de consulta listo con 2 tests.

**Que hare hoy?**
- Yemerson: paginas `/convocatorias`, `/convocatorias/[id]`, `/consulta`, `/nosotros` + footer + hero.
- Hector: `GET /convocatorias/:id` publico.
- David: smoke del portal (navegacion home -> convocatorias -> detalle).

**Bloqueos:**
- Jose reporta que el endpoint de consulta necesita un seed minimo de solicitudes para la demo; coordina con David (seed de demo).

---

### Dia 3 - 2026-09-11

**Que hice ayer?**
- Yemerson: portal publico completo (US-41..48) con SSR.
- Hector: detalle publico de convocatoria operativo.
- Jose: seed de demo con una solicitud de ejemplo para probar la consulta.

**Que hare hoy?**
- David: revisar y aprobar los PRs de Yemerson, Hector y Jose; correr CI y el smoke del portal.
- Cierre del sprint y verificacion por modulo contra `986fc89`.

**Bloqueos:**
- Ninguno