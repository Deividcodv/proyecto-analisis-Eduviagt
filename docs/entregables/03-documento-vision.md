# Documento de Visión del Producto y Product Backlog Inicial

> **Proyecto:** EDUVIAGT — Sistema Integral de Gestión de Becas
> **Curso:** 0910-037 · Análisis de Sistemas II · 8.º Ciclo
> **Base:** Anexo 4 del documento del proyecto final

---

## 1. Información general

| Campo | Valor |
|---|---|
| **Nombre del proyecto** | EDUVIAGT — Plataforma Nacional para la Gestión Integral de Becas |
| **Nombre corto / código** | EDUVIAGT (SIGEB v1.1) |
| **Versión del documento** | 1.0 |
| **Fecha de creación** | 2026-08-26 |
| **Fecha de última revisión** | 2026-10-28 |
| **Product Owner** | Chiroy Vásquez, Luis David (PO simulado) — el docente (Ing. Mario Fuentes) actúa como PO real del curso |
| **Development Team** | Lemus Meléndrez, Marcos Estuardo · Hernández González, Héctor Enrique · Hernández García, José Manuel · Par Guerra, Yermerson Geovanny · Guzmán Hernández, Hamilton Estuardo |
| **Scrum Master** | Chiroy Vásquez, Luis David |

---

## 2. Antecedentes y problema

El Ministerio de Educación administra distintos programas de becas dirigidos a estudiantes guatemaltecos de
nivel medio, universitario y posgrado. Hoy, buena parte del proceso se ejecuta con **formularios en papel,
hojas de cálculo y correo electrónico**, lo que produce:

| Problema | Manifestación observada |
|---|---|
| Retrasos en la evaluación | Las solicitudes se acumulan y el tiempo de resolución depende del tiempo de quien las revisa. |
| Duplicidad de información | Un mismo estudiante aparece en varias hojas de cálculo sin clave única que lo identifique. |
| Pérdida de documentos | Los anexos se archivan en carpetas físicas o correos sueltos, sin control de versión ni respaldo. |
| Poca trazabilidad del proceso | No existe registro fiable de quién decidió, cuándo y con qué criterio lo decidió. |
| Dificultad para generar estadísticas | Las respuestas a preguntas básicas ("¿cuántas solicitudes hay?", "¿cuánto se otorga?") requieren consolidar archivos a mano. |
| Falta de transparencia | El postulante no sabe en qué etapa está su solicitud ni por qué fue devuelta. |

Como consecuencia, el Ministerio decidió contratar una empresa de desarrollo de software para diseñar una
plataforma que administre el **ciclo de vida completo de las becas**. Este equipo fue seleccionado como
empresa consultora responsable del análisis, diseño e implementación de la solución.

---

## 3. Visión del producto

> **Para** el Ministerio de Educación de Guatemala y los estudiantes-postulantes de nivel medio, universitario y
> posgrado de Guatemala, **quienes** hoy pierden horas en formularios, correos y filas físicas porque el
> proceso de becas está disperso, sin trazabilidad y sin retroalimentación al postulante, **EDUVIAGT** es una
> **aplicación web monolítica modular** que **administra el ciclo de vida completo de la beca —convocatoria,
> postulación, evaluación, comité, resolución y constancia— en un único lugar, con trazabilidad inmutable,
> separación de poderes en la aprobación y estadísticas agregadas en tiempo real**, **a diferencia de** los
> formularios en papel, las hojas de cálculo y el correo electrónico que hoy rigen el proceso sin control ni
> historial, **nuestro producto** ofrece un expediente digital único por solicitud, bitácora inmutable de
> todas las decisiones, portal público autoservicio de consulta de estado y reportes de gestión listos para
> la toma de decisiones.

### 3.1 Desglose de la plantilla de visión

| Elemento | Contenido |
|---|---|
| **Para (usuario/cliente)** | Ministerio de Educación (personal administrativo), comités evaluadores, evaluadores, jefe de becas, y estudiantes postulantes de nivel medio, universitario y posgrado |
| **Quién (necesidad)** | Necesitan gestionar un alto volumen de solicitudes con reglas claras, tiempos acotados, evidencia auditable y retroalimentación al solicitante |
| **El (nombre del producto)** | EDUVIAGT (SIGEB) |
| **Es un(a)** | Aplicación web monolítica modular con portal público y sistema interno autenticado |
| **Que (beneficio clave)** | Registro único y trazable del ciclo de vida de cada beca, con evaluación ponderada, decisión de comité documentada y reportes instantáneos |
| **A diferencia de** | Formularios en papel, hojas de cálculo, correo electrónico y carpetas compartidas |
| **Nuestro producto (diferenciador)** | Un expediente digital por solicitud + bitácora inmutable + separación de aprobación por umbral económico + autoservicio de consulta |

---

## 4. Stakeholders y User Personas

### 4.1 Stakeholders identificados

| # | Stakeholder | Interés / Necesidad | Relación con el sistema |
|---|---|---|---|
| S-01 | **Ministerio de Educación (dirección de becas)** | Continuidad operativa, estadísticas de cobertura y presupuesto | Cliente / patrocinador |
| S-02 | **Catedrático del curso (Ing. Mario Fuentes)** | Evaluar calidad de diseño, arquitectura, patrones, Scrum y Git | Product Owner del curso / evaluador |
| S-03 | **Estudiantes postulantes** (nivel medio, universitario, posgrado) | Postular, adjuntar documentos, saber el estado de su beca | Usuario final principal |
| S-04 | **Personal administrativo (staff / administrador)** | Publicar convocatorias, asignar evaluadores, gestionar seguridad | Usuario interno |
| S-05 | **Evaluadores** | Evaluar solicitudes asignadas con criterios claros | Usuario interno |
| S-06 | **Coordinadores de comité** | Convocar sesiones, garantizar quórum, registrar decisiones | Usuario interno |
| S-07 | **Miembros de comité** | Votar informadamente sobre solicitudes evaluadas | Usuario interno |
| S-08 | **Jefe de becas** | Segunda aprobación de montos altos | Usuario interno |
| S-09 | **Público general / Coaching** | Conocer las becas disponibles antes de postular | Usuario público |
| S-10 | **Auditoría y control interno** | Verificar qué pasó, cuándo y quién | Beneficiario indirecto |

### 4.2 User Personas

#### Persona 1 — **Ana, la Estudiante Postulante**

| Dato | Detalle |
|---|---|
| **Rol** | Estudiante de 4.º año de Universidad, vive en Escuintla, se conecta mayormente desde el celular |
| **Demográficos** | 21 años, estudia beca, no tiene computadora propia y comparte el equipo con su familia |
| **Necesidades y metas** | · Quiere saber qué becas hay disponibles sin preguntar en ventanilla.<br>· Necesita cargar su documentação sin perder tiempo en filas.<br>· Quiere saber en qué etapa está su solicitud y qué le falta.<br>· Teme que su información se mezcle con la de otro estudiante. |
| **Frustraciones** | *"Llevé dos veces al MINEDUC con el mismo formulario y me lo devolvieron."*<br>*"Nadie me dice por qué no han evaluado mi solicitud."*<br>*"No sé si debo subir el comprobante de ingresos original o una foto."* |
| **Meta de succès** | Poder postular, subir documentos una sola vez y consultar el estado sin llamar a nadie. |
| **Criterios de aceptación prioritarios** | Validación clara de archivos, checklist visible, consulta pública por código, mensajes en lenguaje comprensible. |

#### Persona 2 — **Don Carlos, el Administrador de Convocatorias**

| Dato | Detalle |
|---|---|
| **Rol** | Personal administrativo del MINEDUC, responsable de publicar las convocatorias anuales |
| **Demográficos** | 45 años, trabaja con Excel y correo; lleva toda su vida administrativa |
| **Necesidades y metas** | · Publicar una convocatoria con sus documentos y montos sin pedir ayuda técnica.<br>· Saber cuántas solicitudes lleva cada convocatoria.<br>· No cargar datos dos veces por error. |
| **Frustraciones** | *"Cada convocatoria nueva me toma media jornada de Excel."*<br>*"No sé si guardó, y a veces duplico."* |
| **Meta de succès** | Publicar una convocatoria completa en menos de 15 minutos y ver el avance en vivo. |
| **Criterios de aceptación prioritarios** | Validación de formularios, save con feedback claro, listados con filtros, estados visibles. |

#### Persona 3 — **Lic. Karla, la Evaluadora Técnica**

| Dato | Detalle |
|---|---|
| **Rol** | Evaluadora asignada por el MINEDUC a revisar solicitudes de nivel universitario |
| **Demográficos** | 38 años, evalúa 25–40 solicitudes por convocatoria, requiere criterios homogéneos |
| **Necesidades y metas** | · Ver solo las solicitudes que le corresponden.<br>· Puntuar con criterios claros y comparables.<br>· Poder adjuntar comentarios de justificación. |
| **Frustraciones** | *"Cada quien evalúa con su propio criterio y luego los resultados no comparan."*<br>*"Me llegan archivos de hace dos meses y ya no sé cuál es el último."* |
| **Meta de succès** | Evaluar una solicitud en menos de 10 minutos con evidencia visible de su puntaje. |
| **Criterios de aceptación prioritarios** | Solo sus asignaciones, puntaje ponderado automático, historial de sus puntajes. |

#### Persona 4 — **Dr. Erick, el Coordinador de Comité**

| Dato | Detalle |
|---|---|
| **Rol** | Coordinador del comité evaluador de una convocatoria de posgrado |
| **Demográficos** | 52 años, sesiona 2 veces al mes con 5–7 miembros, requiere quórum verificable |
| **Necesidades y metas** | · Convocar sesiones con agenda cargada.<br>· Verificar quórum antes de votar.<br>· Que la decisión quede registrada y no se pueda alterar después. |
| **Frustraciones** | *"El quórum se cuenta a mano y siempre hay dudas."*<br>*"No tengo respaldo de qué se votó en la sesión anterior."* |
| **Meta de succès** | Cerrar una sesión con quórum validado, votos consistentes y minuta automática. |
| **Criterios de aceptación prioritarios** | Quórum calculado por el sistema, voto único por miembro, decisión inmutable. |

#### Persona 5 — **Lic. Mario, el Jefe de Becas**

| Dato | Detalle |
|---|---|
| **Rol** | Autoridad de segunda instancia para montos superiores a Q10,000.00 |
| **Demográficos** | 50 años, requiere control de separación de poderes sobre montos altos |
| **Necesidades y metas** | · Ver las solicitudes de monto alto con su evaluación completa.<br>· Firmar o devolver a evaluación.<br>· Que conste quién aprobó y en qué orden. |
| **Frustraciones** | *"A veces me toca aprobar la misma solicitud que ya evalué yo."* |
| **Meta de succès** | Firmar una segunda aprobación con trazabilidad completa, sin duplicar su propia firma. |
| **Criterios de aceptación prioritarios** | Bloqueo de auto-aprobación, historial de aprobaciones, justificación obligatoria. |

---

## 5. Alcance funcional del MVP

Los nueve requisitos mínimos del enunciado, con su historia asociada:

| # | Requisito del enunciado | Épica | Historias del backlog | Módulo |
|---|---|---|---|---|
| 1 | Administrar convocatorias | EPIC-01 | US-14, US-15, US-16, US-17 | `convocatorias/` |
| 2 | Registrar estudiantes | EPIC-02 | US-06, US-07, US-08 | `auth/` + `users/` |
| 3 | Gestionar solicitudes | EPIC-03 | US-18, US-19, US-20, US-25 | `solicitudes/` |
| 4 | Cargar documentación | EPIC-04 | US-21, US-22, US-23, US-24 | `storage/` + `solicitudes/` |
| 5 | Administrar evaluaciones | EPIC-05 | US-26, US-27, US-28, US-29 | `evaluaciones/` |
| 6 | Gestionar comités evaluadores | EPIC-06 | US-30, US-31, US-32, US-33 | `comites/` + `sesiones/` |
| 7 | Aprobar o rechazar solicitudes | EPIC-07 | US-33, US-802, US-803 | `sesiones/` + `solicitudes/` |
| 8 | Consultar el estado de una beca | EPIC-08 | US-46, US-50 | `solicitudes/` + web `/consulta` |
| 9 | Generar reportes básicos | EPIC-09 | US-34, US-35 | `reportes/` |

### 5.1 Épicas del Product Backlog inicial

| ID | Épica | Objetivo | Sprint de origen |
|---|---|---|---|
| EPIC-01 | Gestión de Convocatorias | Publicar y controlar el ciclo de vida de las convocatorias | S2 |
| EPIC-02 | Cuentas, Autenticación y Seguridad | Identidad, roles, permisos y excepciones por usuario | S1 / S8 |
| EPIC-03 | Solicitudes y Perfiles | Expediente del postulante (académico y financiero) | S3 |
| EPIC-04 | Documentación y Checklist | Carga, validación y completitud de anexos | S3 |
| EPIC-05 | Evaluación | Asignación y puntaje ponderado por criterio | S4 |
| EPIC-06 | Comités y Sesiones | Órgano|Windows de deliberación con quórum | S4 |
| EPIC-07 | Decisión y Aprobación | Aprobar/rechazar, con segunda instancia por monto | S4 / S8 |
| EPIC-08 | Portal Público y Consulta | Convocatorias abiertas y consulta de estado sin cuenta | S6 |
| EPIC-09 | Reportes y Estadísticas | Agregaciones y exportación para la gestión | S5 |
| EPIC-10 | Asistente Eduvi | Asistente de orientación con base de conocimiento | S5 / S8 |
| EPIC-11 | Auditoría, Bitácora y Privacidad | Trazabilidad inmutable, auditoría y eliminación de cuenta | S5 / S8 |
| EPIC-12 | Experiencia de Usuario y Accesibilidad | Design system, responsive, WCAG 2.2 AA | S6 / S7 / S8 |
| EPIC-13 | CI/CD y Operación | Pipeline, despliegue,environments de staging/producción | S8 |

El backlog **vivo** y detallado (50+ historias con puntos, prioridad y asignación) se mantiene en
[`docs/scrum/product-backlog.md`](../scrum/product-backlog.md).

---

## 6. Requisitos no funcionales (NFR)

### 6.1 Rendimiento

| ID | Requisito | Verificación |
|---|---|---|
| NFR-P-01 | Las páginas del portal público cargan en menos de 3 s con conexión de 10 Mbps. | Lighthouse / E2E con medición de tiempo |
| NFR-P-02 | Las consultas de la API responden en menos de 500 ms en el 95 % de las peticiones contra la base de desarrollo con 1,000 solicitudes sembradas. | Pruebas de carga sobre `prisma db seed` |
| NFR-P-03 | El sistema soporta 100 usuarios concurrentes sin degradación perceptible. | Prueba de carga k6 sobre los endpoints de lectura |

### 6.2 Seguridad

| ID | Requisito | Verificación |
|---|---|---|
| NFR-S-01 | Las contraseñas se almacenan cifradas con bcrypt (coste ≥ 10), nunca en texto plano. | Código: `auth/auth.service.ts`; prueba: comparación de `passwordHash` |
| NFR-S-02 | El sistema es inmune a inyección SQL: **todas** las consultas se parametrizan. | Prisma parametriza por defecto; revisión de código |
| NFR-S-03 | La autorización es *fail-closed*: un permiso no configurado deniega el acceso. | `PermissionsGuard` + `DefaultDenyHandler` |
| NFR-S-04 | Los tokens de acceso y de refresco usan secretos distintos; el de refresco solo sirve para refrescar. | `JWT_SECRET` / `JWT_REFRESH_SECRET`; `auth.controller.ts` |
| NFR-S-05 | El login se limita a 5 intentos por `ip:email` cada 15 minutos. | `LoginAttemptService` |
| NFR-S-06 | La subida de documentos valida MIME, extensión y tamaño (≤ 5 MB) y neutraliza el path traversal. | `FilesystemStorageAdapter.resolveKey` |
| NFR-S-07 | Cada acción sensible queda registrada con actor, fecha, IP y resultado. | `AuditService` + `BitacoraService` |
| NFR-S-08 | Ninguna credencial se versiona en el repositorio. | `.gitignore` + escaneo de secretos en CI |

### 6.3 Usabilidad

| ID | Requisito | Verificación |
|---|---|---|
| NFR-U-01 | Un postulante nuevo completa su registro y su primera solicitud en menos de 10 clics desde la portada. | Recorrido manual + E2E |
| NFR-U-02 | Todos los mensajes de error de la API están en español comprensible, sin trazas técnicas. | `common/filters/mensajes-error.ts` |
| NFR-U-03 | El sistema es responsive y usable en móvil, tablet y escritorio. | E2E con viewports múltiples |
| NFR-U-04 | La interfaz cumple WCAG 2.2 AA (foco visible, skip link, contraste, `prefers-reduced-motion`). | Playwright + axe + `docs/pruebas/50-a11y-visual.md` |

### 6.4 Compatibilidad

| ID | Requisito | Verificación |
|---|---|---|
| NFR-C-01 | La aplicación es funcional en las dos últimas versiones de Chrome, Firefox, Edge y Safari. | E2E en Chrome y Firefox; revisión manual en Edge/Safari |
| NFR-C-02 | La API es consumible por cualquier cliente JSON sobre HTTP/JSON. | Contrato documentado en `docs/architecture/api-contracts.md` |

### 6.5 Disponibilidad y mantenibilidad

| ID | Requisito | Verificación |
|---|---|---|
| NFR-D-01 | El servicio mantiene 99.5 % de disponibilidad durante el horario lectivo (07:00–19:00). | Monitoreo de PM2 + healthcheck en despliegue |
| NFR-D-02 | Todo cambio de esquema de base de datos viaja en una migración versionada de Prisma. | `apps/api/prisma/migrations/` |
| NFR-D-03 | La cobertura de pruebas no baja del mínimo definido (49/40/48/49 %). | Umbral en `jest.config` y job de CI |
| NFR-D-04 | El código cumple ESLint + Prettier sin errores. | Job `lint-and-test` del CI |

---

## 7. Adaptación a cambios de requerimientos

El enunciado advierte que *el proyecto no permanecerá estático* y que el Product Owner podrá emitir
memorandos, oficios, cambios regulatorios, nuevas políticas, solicitudes del cliente o integraciones con
otras instituciones. El equipo registra aquí cómo respondieron los cambios que ya occurredieron:

| Cambio recibido | Impacto | Respuesta del equipo | Evidencia |
|---|---|---|---|
| **Regla de control interno: montos > Q10,000 requieren segunda aprobación** | Alto — tocar el flujo de decisión y la máquina de estados | Se añadió el estado `PENDIENTE_SEGUNDA_APROBACION` a la FSM, la entidad `SolicitudAprobacion` con nivel, y la regla de "segundo aprobador ≠ primero" en `AuthzService`. | ADR-012 · Sprint 8 · `solicitud-state-machine.ts:40-44` |
| **Nueva política de montos por estrato socioeconómico** | Medio — la lógica de monto deja de ser fija | Se modelaron reglas `FIJO / PORCENTAJE / COMPLETO` por tramos de ingreso familiar (`ConvocatoriaReglaMonto`), con `montoOrigenCalculo` y override con justificación obligatoria. | ADR-013 · Sprint 8 |
| **Derecho al olvido / protección de datos personales** | Medio — afecta ciclo de vida de la cuenta | Se implementó eliminación de cuenta con anonimización (nombres genéricos, email nulo, `passwordHash` nulo) conservando la trazabilidad de las decisiones. | ADR-015 · Sprint 8 |
| **Exigencia de auditoría y transparencia** | Medio — transversal | Se creó una bitácora append-only (`BitacoraSistema`) y se reforzó la auditoría (`AuditLog`) con actor, fecha, IP y resultado. | ADR-014 · Sprint 8 |
| **Requisito de accesibilidad institucional (WCAG 2.2 AA)** | Medio — transversal de frontend | Foco visible, skip link, trampa de foco en el menú lateral, respeto a `prefers-reduced-motion` y auditoría con axe. | ADR-016 · Sprint 8 |
| **Identidad institucional del asistente (de "IA genérica" a "Eduvi")** | Bajo — frontend | Nombre, icono, saludo y widget unificados; modo KB por FTS de PostgreSQL con LLM opcional. | ADR-017 · Sprint 8 |

**Principio de respuesta:** cada cambio se analyzó primero en su impacto sobre la arquitectura; cuando el
cambio cabía en el diseño existente se aplicó localmente y cuando requería una decisión estructural se
registró un ADR antes de codificar. Ningún cambio forzó una reescritura del dominio.

---

## 8. Definición de "Hecho" (Definition of Done)

El DoD es un acuerdo compartido por todo el equipo Scrum sobre qué significa que una historia está terminada.
Se aplica **a cada User Story** sin excepción.

### 8.1 Definición de Hecho vigente

- ☐ El código está subido a una rama de trabajo (`feature/*` o `hotfix/*`) y **nunca** directamente a `develop`/`master`.
- ☐ El PR está abierto contra `develop` y tiene **al menos una aprobación** de otro miembro del equipo.
- ☐ Se han creado y **pasan** todas las pruebas unitarias y de integración correspondientes.
- ☐ `npm run lint` y la compilación de TypeScript terminan sin errores.
- ☐ La funcionalidad cumple **todos** los criterios de aceptación de la historia.
- ☐ No se han introducido bugs nuevos: la suite completa pasa en verde.
- ☐ La documentación técnica necesaria ha sido creada o actualizada en el **mismo PR** (API, diagramas, README del módulo).
- ☐ Las migraciones de base de datos, si las hay, están versionadas y son idempotentes.
- ☐ La funcionalidad está desplegada en el entorno de pruebas/staging y verificada por el Product Owner.
- ☐ El registro en la bitácora y la auditoría de las acciones sensibles está habilitado.

### 8.2 Criterios de aceptación (ejemplo — US-24: enviar solicitud)

| # | Criterio de aceptación | Verificación |
|---|---|---|
| CA-1 | El postulante solo puede enviar una solicitud en estado `BORRADOR` de una convocatoria en estado `ABIERTA`. | Prueba unitaria + E2E |
| CA-2 | Si falta algún documento obligatorio, el sistema devuelve el checklist de faltantes y no cambia el estado. | Prueba de integración |
| CA-3 | Si falta el perfil académico o financiero, el envío es rechazado con mensaje en español. | Prueba unitaria |
| CA-4 | Al enviar correctamente, el estado pasa a `ENVIADA`, se crea el registro en `HistorialEstado` y se notifica al postulante. | Prueba de integración + E2E |
| CA-5 | El intento de envío queda registrado en la bitácora con actor, fecha, IP y resultado. | Inspección de `BitacoraSistema` |

---

## 9. Referencias

- [Acta de Constitución del Equipo](01-acta-constitucion-equipo.md) — Anexo 1
- [Política de Trabajo en Grupo](02-politica-trabajo-grupo.md) — Anexo 3
- [Product Backlog vivo](../scrum/product-backlog.md) — todas las historias con puntos y prioridad
- [`docs/scrum/como-trabajamos.md`](../scrum/como-trabajamos.md) — proceso de refinamiento
- [`docs/architecture/decisions.md`](../architecture/decisions.md) — 22 ADR que respaldan las decisiones de §7

---

*Última actualización: 2026-10-28*
