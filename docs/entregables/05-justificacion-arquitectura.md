# Justificación de la Arquitectura

> **Proyecto:** EDUVIAGT — Sistema Integral de Gestión de Becas
> **Curso:** 0910-037 · Análisis de Sistemas II · 8.º Ciclo
> **Versión:** 1.0 · **Fecha:** 2026-10-28
> **Base:** sección «Arquitectura de Software» del documento del proyecto final
> Documento complementario a [04-documento-arquitectura.md](04-documento-arquitectura.md)

---

## 1. Propósito

El documento del proyecto exige que la arquitectura seleccionada sea justificada considerando explícitamente:

| # | Criterio exigido por el enunciado | Sección que lo responde |
|---|---|---|
| 1 | Mantenibilidad | §3.1 |
| 2 | Escalabilidad | §3.2 |
| 3 | Bajo acoplamiento | §3.3 |
| 4 | Reutilización | §3.4 |
| 5 | Facilidad para realizar cambios futuros | §3.5 |
| 6 | Complejidad del proyecto | §3.6 |

Cada criterio se responde con la decisión, la evidencia en el código y las **alternativas descartadas con su
motivo**.

---

## 2. Decisión resumida

> **Se adopta un monolito modular por capas**, implementado como un monorepo con dos aplicaciones
> independientes — API REST en NestJS 10 y frontend en Next.js 14 (App Router) — sobre PostgreSQL 16 con
> Prisma 5, con comunicación REST/JSON, inyección de dependencias nativa y **adaptadores explícitos** hacia
> los tres puntos de salida al mundo externo (almacenamiento de ficheros, generación de PDF y proveedor de IA).

---

## 3. Justificación por criterio

### 3.1 Mantenibilidad

**Decisión.** Separar el sistema en **17 módulos de dominio** con frontera explícita, cada uno con su
`*.module.ts`, sus controllers, sus services y sus DTOs. Dentro de cada módulo se aplican las capas
presentación → aplicación/dominio → persistencia.

**Evidencia.**

| Mecanismo | Evidencia |
|---|---|
| Responsabilidad única por servicio | 10+ servicios con una sola razón para cambiar (`AuthService`, `MontosService`, `SolicitudChecklistService`, `BitacoraService`, …) — ver [`docs/architecture/solid-principles.md`](../architecture/solid-principles.md) §S |
| Reglas de dominio declarativas y no condicionales | Tablas de transición en `solicitud-state-machine.ts:26-47` y `convocatoria-state-machine.ts:19-53` |
| Mensajes de error centralizados y traducidos | `apps/api/src/common/filters/mensajes-error.ts` |
| Convenciones de código y estilo unificados | ESLint + Prettier en la raíz; job `lint-and-test` en CI |
| Documentación por módulo | `docs/architecture/ARQUITECTURA-REAL.md` §2 (inventario de providers, imports y exports) |

**Por qué no una alternativa más simple.** Una aplicación de NestJS con un único módulo sería válida para
proyectos pequeños, pero con 36 entidades y 9 dominios de negocio obligaría a que cualquier cambio tocara
archivos compartidos, generando conflictos de merge constantes entre 5 desarrolladores. La separación por
módulo eliminó el conflicto: cada persona es dueña de un conjunto disjointo de carpetas.

**Alternativas descartadas.**

| Alternativa | Motivo del descarte |
|---|---|
| Capa única (sin módulos) | Alto acoplamiento, conflictos de merge, imposible asignar ownership por sprint |
| Base de datos por módulo (bases separadas) | No justificado a esta escala: 1,000 solicitudes no lo exigen y complica las transacciones de la FSM |

### 3.2 Escalabilidad

**Decisión.** Monolito modular con **módulos extraíbles**, base de datos relacional con índices propios,
paginación en los listados y **cero estado de negocio en memoria** (el único estado en memoria es
decorativo: intentos de login y contadores de notificaciones).

**Evidencia.**

| Aspecto | Evidencia |
|---|---|
| Índices y restricciones en el esquema | `apps/api/prisma/schema.prisma` — índices por `convocatoriaId`, `usuarioId`, `estado`, `codigo` |
| Paginación en lascollections grandes | `findAll` con `page`/`limit` en `solicitudes`, `convocatorias`, `evaluaciones` |
| Sin cuellos de botella de estado | La lógica de negocio opera sobre PostgreSQL; los `Subject` de RxJS solo difunden notificaciones ya persistidas |
| Posibilidad de extracción | Cada módulo depende de abstracciones (`DocumentStorage`, `PdfRenderer`, `ProveedorIA`) y de `PrismaService`, no de otro módulo de negocio |
| Manejo de carga | CI con job de pruebas E2E sobre PostgreSQL real; base sembrada con 1,000 solicitudes |

**Límite explícito.** El sistema **no escala horizontalmente sin cambios**: el rate limiting de login es un
`Map` en memoria (ADR-022) y el almacenamiento de documentos es local. El equipo lo documenta como deuda
técnica en lugar de ocultarlo, y por eso la arquitectura mantiene la **opción de mover ambos a servicios
externos** (Redis, S3) sin refactorizar el dominio.

**Alternativas descartadas.**

| Alternativa | Motivo del descarte |
|---|---|
| Microservicios | 9 dominios de negocio y ~1,000 registros no justifican el costo de red, despliegue distribuido, consistencias eventuales y observabilidad distribuida (ADR-004) |
| Backend asíncrono con cola de mensajes | El flujo es síncrono y transaccional; una cola añadiría complejidad sin ganar nada |
| Caching distribuido (Redis) | La tasa de lectura no lo justifica hoy; se deja como extensión (adaptador) |

### 3.3 Bajo acoplamiento

**Decisión.** Cuatro mecanismos complementarios:

1. **Inyección de dependencias nativa del framework** (NestJS) con *tokens* explícitos para todo punto de
   entrada al exterior.
2. **Interfaces de puerto** para almacenamiento, PDF e IA.
3. **Guards globales** que resuelven la autorización en un solo punto, fuera de la lógica de negocio.
4. **Servicios transversales** (`AuthzService`, `AuditService`, `BitacoraService`, `NotificacionesService`)
   marcados como `@Global()` e inyectados donde se necesitan, sin dependencias de retorno.

**Evidencia.**

| Mecanismo | Interfaz / token | Consumidores |
|---|---|---|
| Almacenamiento de ficheros | `DocumentStorage` (`storage.interface.ts:7`) / `DOCUMENT_STORAGE` | `SolicitudesService`, `SolicitudDocumentoService`, `EliminarCuentaService` |
| Generación de PDF | `PdfRenderer` (`pdf-renderer.interface.ts:8`) / `PDF_RENDERER` | `ConstanciasService` |
| Proveedor de IA | `ProveedorIA` (`asistente.types.ts:11`) | `AsistenteIAProxy` |
| Autorización | `PermissionService` (`permission.service.ts`) / `PERMISSION_SERVICE` | `PermissionsGuard`, `AuthzService` |

El caso paradigmático: **cambiar el almacenamiento de disco por S3 no requiere tocar ni una línea del dominio**;
basta con registrar un nuevo provider para el token `DOCUMENT_STORAGE`.

**Alternativas descartadas.**

| Alternativa | Motivo del descarte |
|---|---|
| Importar `FilesystemStorageAdapter` directamente en los servicios | Acopla el dominio a la infraestructura; cada servicio repetiría la lógica de rutas y seguridad de ficheros |
| Repositorios genéricos con una capa `Repository` por entidad | Más ceremonia y menos claridad que usar Prisma con tipos; además el equipo detectó que no aportaba valor real a esta escala |
| Variable de entorno leída dentro de los servicios | Oculta dependencias, impide el test unitario y rompe el principio de inversión de dependencias |

### 3.4 Reutilización

**Decisión.** Todo lo que puede ser transversal, lo es. El módulo `common/` concentra lo que se reutiliza en
todos los dominios.

| Elemento reutilizable | Ubicación | Cuántos consumidores |
|---|---|---|
| Guard de autenticación JWT | `common/guards/jwt-auth.guard.ts` | Todas las rutas |
| Guard de permisos *fail-closed* | `common/guards/permissions.guard.ts` | Todas las rutas con `@Permisos()` |
| Cadena de resolución de permisos | `common/guards/permission-chain.ts` | `PermissionService` |
| Autenticación de usuario | `common/services/authz.service.ts` | 12+ servicios |
| Envelope de respuesta `{ data }` | `common/interceptors/transform.interceptor.ts` | Toda la API |
| Normalización de errores | `common/filters/http-exception.filter.ts` | Toda la API |
| Traducción de mensajes de validación | `common/filters/mensajes-error.ts` | Toda la API |
| Decoradores (`@Public`, `@Permisos`, `@CurrentUser`) | `common/decorators/` | Todos los controllers |
| PrismaService (singleton) | `prisma/prisma.service.ts` | Todos los módulos |
| Adapter de almacenamiento | `storage/` | Solicitudes, documentos, eliminación de cuenta |

**Regla aplicada.** *Si el tercer consumidor de un fragmento de código aparece, se extrae.* El módulo
`common/` existe porque la lógica de autorización, el envelope de respuesta y la traducción de errores se
repitieron en más de tres dominios.

**Alternativas descartadas.**

| Alternativa | Motivo del descarte |
|---|---|
| Copiar y pegar el bloque de validación en cada controller | Duplicación con divergencia inevitable; contradice directamente la mantenibilidad |
| Librería externa de validación | Ataría el proyecto a una dependencia externa para un problema que el propio framework ya resuelve |

### 3.5 Facilidad para realizar cambios futuros

Esta es la criterio **decisivo** del proyecto, porque el enunciado advierte explícitamente que *el Product
Owner podrá modificar, ampliar o eliminar funcionalidades conforme evolucione el proyecto*.

| Mecanismo | Cómo habilita el cambio | Evidencia |
|---|---|---|
| **Tabla de transiciones como dato** | Añadir un estado o una transición es **editar una tabla**, no reescribir condicionales | `solicitud-state-machine.ts:26-47` |
| **Maquinas de estado separadas** | La FSM de solicitud y la de convocatoria evolucionan de forma independiente | `convocatoria-state-machine.ts`, `solicitud-state-machine.ts` |
| **Permisos como datos** | Conceder o retirar un permiso es una fila en `RolPermiso`/`UsuarioPermiso`, **sin tocar código ni redesplegar** | `permission-chain.ts` |
| **Reglas de monto configurables** | Cambiar la política económica de una convocatoria es editar `ConvocatoriaReglaMonto` | ADR-013 |
| **Base de conocimiento del asistente como datos** | Añadir documentos a la KB es un `INSERT`, no un despliegue | `asistente_base_conocimiento` |
| **Adaptadores extensibles** | Cambiar de motor de PDF, de almacenamiento o de proveedor de IA es registrar un provider | `storage/`, `solicitudes/pdf/`, `asistente/providers/` |
| **Contrato uniforme de API** | El frontend consume un envelope estable; cambios internos no rompen la UI | ADR-020 |

**Demostración empírica.** El Sprint 8 incorporó cinco requisitos nuevos (segunda aprobación por monto,
montos por tramos, bitácora inmutable, eliminación de cuenta, accesibilidad WCAG 2.2 AA) **sin reescribir el
dominio existente** y sin romper la suite de pruebas. El detalle está en
[03-documento-vision.md](03-documento-vision.md) §7 y en los ADR-012 a ADR-016.

**Alternativas descartadas.**

| Alternativa | Motivo del descarte |
|---|---|
| Codificar las reglas de negocio en condicionales dentro de los servicios | Cada nuevo caso exigiría revisar todos los `if` relacionados: alto riesgo de regresión |
| Configuración en archivos en lugar de base de datos | Los cambios requieren redespliegue, lo que rompe la entrega continua y el ritmo de sprint |

### 3.6 Complejidad del proyecto

**Diagnóstico de la complejidad real.**

| Dimensión | Valor del proyecto | Implicación arquitectónica |
|---|---|---|
| Dominios de negocio | 9 (convocatorias, solicitudes, evaluación, comités, sesiones, reportes, seguridad, auditoría, asistente) | Separación en módulos |
| Entidades | 36 | Un solo esquema relacional es suficiente |
| Roles de usuario | 6 + permisos granulares por módulo/acción | Autorización por *chain*, no por `if` dispersos |
| Reglas de ciclo de vida | 2 máquinas de estado con 8 y 6 estados | Tablas de transiciones |
| Puntos de salida al exterior | 3 (ficheros, PDF, IA) + 1 opcional (LLM externo) | 3 adaptadores + 1 strategy |
| Requisitos no funcionales fuertes | Trazabilidad, seguridad de datos personales, accesibilidad, auditoría | Transversales de clase `AuthzService`, `AuditService`, `BitacoraService` y `NotificacionesService` |
| Tamaño del equipo | 6 personas | Ninguna abstracción que no aporte valor verificable |

**Conclusión.** El proyecto es de **complejidad media-alta en el dominio y baja en la infraestructura**. La
arquitectura refleja exactamente esa asimetría: el dominio se modela con detalle (máquinas de estado, tabla de
decisiones, tabla de permisos, tabla de transiciones) mientras que la infraestructura se mantiene simple
(una API, una base de datos, un almacenamiento en disco).

**Sobre microservicios.** Con 9 dominios, 6 personas y 2 semanas por sprint, los microservicios habrían
multiplicado por 5 el costo operativo (un repositorio por servicio, contratos de red, despliegue
coordinado, diagnóstico distribuido) a cambio de una ganancia de escalabilidad que el volumen real del
MINEDUC no necesita. La decisión相反 — microservicios desde el día uno — es el error clásico de arquitectura
prematura. El monolito modular **deja la puerta abierta**: cualquier módulo puede extraerse a un servicio
cuando el volumen o el equipo lo justifiquen, porque sus dependencias ya están declaradas como interfaces.

**Alternativas descartadas.**

| Alternativa | Motivo del descarte |
|---|---|
| Microservicios desde el inicio | Complejidad operativa desproporcionada frente al volumen y el tamaño del equipo (ADR-004) |
| Monolito sin módulos ni DI | Acoplamiento y colisiones de merge; imposible de mantener por 5 personas en paralelo |
| Serverless (AWS Lambda, Cloud Functions) | El almacenamiento de documentos y el render de PDF con Puppeteer requieren un runtime con sistema de archivos; además el despliegue por VM ya está automatizado y es más barato a esta escala |

---

## 4. Tecnologías y su justificación

| Capa | Tecnología | Alternativas consideradas | Motivo de la elección | ADR |
|---|---|---|---|---|
| Lenguaje | **TypeScript 5** (backend y frontend) | JavaScript puro, Java, Python, C# | Tipado estático en un dominio con muchas entidades y estados: el compilador atrapa errores de contrato antes que las pruebas. Un solo lenguaje en todo el stack reduce el costo cognitivo del equipo | — |
| Backend | **NestJS 10** | Express, Fastify, AdonisJS | DI nativa, módulos, guards, pipes, interceptors y OpenAPI: todo lo que el curso evalúa (patrones, SOLID, arquitectura) tiene soporte directo | ADR-001 |
| Frontend | **Next.js 14 (App Router)** | Vite + React, Remix, Nuxt | SSR y SEO para el portal público; Server Components para reducir el bundle; rewrite por proxy que evita CORS | ADR-002 |
| ORM | **Prisma 5** | TypeORM, Drizzle, Knex | Consultas parametrizadas por defecto (defensa ante SQL injection), tipos derivados del esquema, migraciones declarativas versionadas | ADR-003 |
| Base de datos | **PostgreSQL 16** | MySQL, SQLite, MongoDB | Integridad referencial con 36 entidades, JSONB, índices avanzados y **Full Text Search en español**, que alimenta el asistente sin depender de un servicio externo de embeddings | ADR-005 |
| Autenticación | **Passport + JWT** (access 15 min / refresh 7 d) | Sesiones con cookie, OAuth | Stateless y compatible con el modelo de despliegue en VM; secretos separados para acceso y refresco | ADR-006 |
| Autorización | **Chain of Responsibility** (propia) | RBAC puro con `if` por rol | Soporta el requisito real: permiso por rol **más** excepción individual por usuario, con precedencia y cierre *fail-closed* | ADR-011 |
| Almacenamiento | **Filesystem detrás de `DocumentStorage`** | S3, Azure Blob | Cumplimiento en la VM institucional sin dependencia externa; el Adapter mantiene abierta la migración | ADR-007 |
| PDF | **Puppeteer (Chromium headless)** | pdfkit, jsPDF | Renderiza HTML real: la constancia replica el diseño institucional sin maquetar a mano | ADR-009 |
| Asistente IA | **FTS PostgreSQL + LLM opcional** | RAG con embeddings y vector store | Funciona sin credenciales externas y sin base vectorial; el LLM es un extra, no un requisito | ADR-019 |
| Pruebas | **Jest + Supertest + Playwright** | Vitest, Cypress | Integración oficial con NestJS; Playwright añade el chequeo de accesibilidad con axe en el mismo recorrido | — |
| CI/CD | **GitHub Actions + PM2 + nginx** | Jenkins, GitLab CI, ArgoCD | CI/CD nativo en el repositorio, despliegue por SSH sin servidor adicional de ejecución | ADR-021 |
| Monorepo | **npm workspaces + Turborepo** | Nx, Lerna, sin monorepo | Orquestación de tareas con caché, sin dependencia de cloud ni cuenta | — |

---

## 5. Ventajas principales

1. **Bajo acoplamiento verificable.** Los cuatro puntos de entrada al exterior están detrás de interfaces; el
   dominio no conoce al mundo externo.
2. **Cambios de requerimiento baratos.** Reglas de negocio expresadas como datos (transiciones, permisos,
   reglas de monto, base de conocimiento) se modifican sin redespliegue.
3. **Trazabilidad de punta a punta.** Cuatro registros independientes cubren el ciclo completo: historial de
   estado, auditoría, bitácora y aprobaciones.
4. **Entrega continua real.** CI con 6 jobs en cada PR y despliegue a staging automático desde `develop`.
5. **Calidad verificable.** 26 suites unitarias, 8 suites E2E con axe, cobertura con umbral mínimo y linter
   en el pipeline.
6. **Transferibilidad.** La documentación permite que un desarrollador nuevo comprenda el sistema leyendo
   `docs/architecture/ARQUITECTURA-REAL.md` y los ADR, sin acceso a la persona que lo escribió.
7. **Riesgos identificados y declarados.** La deuda técnica está escrita, priorizada y es visible para el
   docente, en lugar de Stay oculto.

---

## 6. Trade-offs y compromisos asumidos

| Compromiso | Qué se gana | Qué se pierde | Mitigación |
|---|---|---|---|
| **Monolito en vez de microservicios** | Simplicidad operativa, transacciones simples, un solo despliegue | Escalado horizontal independiente por módulo | Módulos ya extraíbles; la extracción es localizable gracias a las interfaces de puerto |
| **Sin capa Repository** | Menos indirección, consultas directas de Prisma con tipos Derivados | El dominio depende del ORM; migrar de ORM sería costoso | Deuda técnica documentada; el coste real es acotado porque Prisma expone tipos y no lógica de negocio |
| **Sin bus de eventos** | Orden de ejecución explícito y determinista | Acoplamiento de secuencia entre dominio y transversales | Aceptable mientras el número de transversales sea estable; se revisará si el dominio supera 12 módulos |
| **Almacenamiento local** | Cumplimiento sin dependencia externa y despliegue simple | No escala horizontalmente ni a múltiples instancias | `DocumentStorage` ya abstrae la ubicación; migrar a S3 es cambiar un provider |
| **Rate limiting en memoria** | Cero infraestructura adicional | Se pierde al reiniciar y no escala | ADR-022; la Interface del servicio ya permite sustituir la implementación por Redis |
| **Prisma sin repository** | Productividad alta del ORM | Acoplamiento ORM-dominio | Deuda técnica registrada en `docs/standards/deuda-tecnica.md` |
| **Un único repositorio monorepo** | Simplicidad de CI, versionado atómico | El bundle del front puede incluir código no usado | Tree-shaking de Next.js + separación por rutas; medido en el build |
| **Sin cache de aplicación** | Sin invalidación de caché, coherencia inmediata | Más carga sobre PostgreSQL | Aceptable con el volumen actual; se evaluará Redis si las agregaciones lo requieren |

---

## 7. Conclusiones

La arquitectura seleccionada —**monolito modular por capas sobre monorepo, con DI nativa, interfaces de
puerto hacia el exterior y reglas de negocio expresadas como datos**— responde de forma explícita a los seis
criterios exigidos por el enunciado:

- Es **mantenible** porque los módulos son disjuntos y cada servicio tiene una sola responsabilidad.
- Es **escalable** hasta los volúmenes institucionales previstos y mantiene abierta la extracción por módulo.
- Tiene **bajo acoplamiento** gracias a las interfaces de puerto y a la autorización centralizada.
- Es **reutilizable** porque todo lo transversal vive en `common/` y se consume desde muchos módulos.
- Es **fácil de cambiar** porque las reglas que más varían —transiciones, permisos, montos, KB— son datos.
- Su **complejidad es proporcional** al problema: detalle en el dominio, simplicidad en la infraestructura.

Además, la arquitectura **ha demostrado ser adaptable** en la práctica: los cinco requisitos nuevos del
Sprint 8 se incorporaron sin reescribir el dominio existente, lo que constituye la evidencia más sólida de
que la decisión es correcta para un proyecto cuyo Product Owner emite cambios de forma continua.

---

## 8. Referencias

- [Documento de Arquitectura](04-documento-arquitectura.md) — descripción completa de la solución
- [Justificación de Patrones de Diseño](06-justificacion-patrones-de-diseno.md) — 6 patrones con justificación
- [`docs/architecture/decisions.md`](../architecture/decisions.md) — 22 ADR con contexto, decisión y consecuencias
- [`docs/architecture/solid-principles.md`](../architecture/solid-principles.md) — evidencia de SOLID en el código
- [`docs/architecture/design-patterns.md`](../architecture/design-patterns.md) — inventario verificado de patrones
- [`docs/standards/deuda-tecnica.md`](../standards/deuda-tecnica.md) — riesgos declarados

---

*Última actualización: 2026-10-28*
