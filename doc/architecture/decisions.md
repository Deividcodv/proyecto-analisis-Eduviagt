# Decisiones Arquitectónicas (ADR) — SIGEB

> Architecture Decision Records: documentan decisiones técnicas importantes y su contexto.

---

## ADR-001: NestJS como framework backend

**Estado:** Aceptado

**Fecha:** 2026-08-26

**Contexto:**
Necesitamos un framework backend para el API REST que soporte:
- Inyección de dependencias nativa
- Módulos bien estructurados
- Validación de DTOs integrada
- Guards, interceptores, pipes
- Buena integración con TypeScript

**Decisión:**
Usar NestJS como framework backend.

**Alternativas consideradas:**
- Express.js: más flexible pero sin estructura nativa
- Fastify: más rápido pero menos ecosistema
- AdonisJS: completo pero menos popular

**Consecuencias:**
- Estructura modular nativa que facilita Facade, Adapter, Proxy
- DI container integrado sin configuración manual
- Learning curve moderada para el equipo
- Ecosistema de plugins rico

---

## ADR-002: Next.js como framework frontend

**Estado:** Aceptado

**Fecha:** 2026-08-26

**Contexto:**
Necesitamos un framework frontend que soporte:
- Server-side rendering para SEO del portal público
- App Router para rutas jerárquicas
- Integración con React
- Tailwind CSS
- Building optimizado

**Decisión:**
Usar Next.js (App Router) como framework frontend.

**Alternativas consideradas:**
- Vite + React: más rápido pero sin SSR nativo
- Remix: buen SSR pero menos comunidad
- Nuxt (Vue): cambiar de framework

**Consecuencias:**
- SEO optimizado para portal público
- Funciones server y client bien separadas
- Build optimizado con Turbopack
- Deploy simplificado

---

## ADR-003: Prisma como ORM

**Estado:** Aceptado

**Fecha:** 2026-08-26

**Contexto:**
Necesitamos un ORM que:
- Genere tipos TypeScript automáticamente
- Soporte PostgreSQL
- Queries parametrizadas por defecto
- Migraciones declarativas
- Buena documentación

**Decisión:**
Usar Prisma como ORM.

**Alternativas consideradas:**
- TypeORM: más maduro pero menos类型安全
- Drizzle: más rápido pero menos features
- Knex.js: query builder, no ORM completo

**Consecuencias:**
- Queries parametrizadas = primera línea de defensa contra SQL injection
- Tipos generados automáticamente desde el schema
- Migraciones declarativas y versionadas
- Client ligero y rápido

---

## ADR-004: Monolito modular (no microservicios)

**Estado:** Aceptado

**Fecha:** 2026-08-26

**Contexto:**
El proyecto tiene ~9 módulos de dominio. Necesitamos decidir entre:
- Monolito modular: una aplicación, módulos separados
- Microservicios: servicios independientes por HTTP

**Decisión:**
Monolito modular por capas.

**Razones:**
- ~9 módulos no justifican la complejidad operativa de microservicios
- Despliegue más simple (un solo contenedor)
- Comunicación interna más rápida (llamadas a métodos)
- Más fácil de testear
- Cualquier módulo puede extraerse después si el volumen lo exige

**Consecuencias:**
- Un solo deploy para todo
- Acoplamiento bajo entre módulos (Dependency Inversion)
- Escalabilidad horizontal limitada (pero suficiente para este alcance)

---

## ADR-005: PostgreSQL como base de datos

**Estado:** Aceptado

**Fecha:** 2026-08-26

**Contexto:**
Necesitamos una DB relacional que soporte:
- Búsqueda de texto completo (`tsvector`)
- JSON/JSONB para datos flexibles
- UUID como primary key
- Transacciones ACID
- Buena integración con Prisma

**Decisión:**
Usar PostgreSQL.

**Alternativas consideradas:**
- MySQL: menos features de texto
- SQLite: no para producción
- MongoDB: no relacional, no encaja con el modelo

**Consecuencias:**
- `tsvector` para base de conocimiento del asistente (sin extensión vectorial)
- JSONB para almacenar datos flexibles si es necesario
- UUID nativo para todas las primary keys
- Rendimiento probado a escala

---

## ADR-006: JWT (access/refresh) para autenticación

**Estado:** Aceptado

**Fecha:** 2026-08-26

**Contexto:**
Necesitamos autenticación stateless que funcione con:
- Frontend SPA (Next.js)
- API REST
- Futuras apps móviles

**Decisión:**
Usar JWT con access token (15 min) + refresh token (7 días).

**Alternativas consideradas:**
- Sesiones server-side: estado en servidor, no escala
- OAuth2: demasiado complejo para este alcance
- Solo access tokens sin refresh: mala UX

**Consecuencias:**
- Stateless: no necesita session store
- Access token corto (15 min) limita ventana de ataque
- Refresh token permite mantener sesión sin re-login
- Revocación más compleja (necesita blacklist o esperar expiración)

---

## ADR-007: Filesystem local para documentos (Adapter pattern)

**Estado:** Aceptado

**Fecha:** 2026-08-26

**Contexto:**
Necesitamos almacenar documentos (PDFs, imágenes) de postulantes.

**Decisión:**
Filesystem local detrás de interfaz `DocumentStorage` (Adapter pattern).

**Razones:**
- Simplifica desarrollo inicial
- Adapter permite cambiar a S3/Azure después sin tocar servicios
- Sin costo de almacenamiento en la nube durante desarrollo

**Consecuencias:**
- Almacenamiento en el servidor (no escalable horizontalmente fácilmente)
- Necesita backup manual
- Migración futura a nube requerirá implementar otro adapter

---

## ADR-008: Design System dual (público vs admin)

**Estado:** Aceptado

**Fecha:** 2026-08-26

**Contexto:**
El portal público y el sistema administrativo tienen identidad visual diferente pero comparten componentes base.

**Decisión:**
Design System compartido con dos "mundos" visuales:
- Portal público: editorial, institucional, espacioso
- Sistema admin: funcional, compacto, data-driven

**Consecuencias:**
- Componentes base compartidos (colores, tipografía, botones)
- Temas distintos para cada contexto
- Mantenimiento de dos estilos pero un solo código base
- Mejor UX para cada tipo de usuario

---

## ADR-009: Generación de PDF con navegador headless tras el patrón Adapter (US-F7)

**Estado:** Aceptado

**Fecha:** 2026-09-01

**Contexto:**
La versión 1.0 mantuvo la generación de PDF "con navegador headless" fuera de alcance. Para el cierre del
flujo de beca (constancia oficial de una solicitud `APROBADA`) se necesita producir un documento PDF
institucional.

**Decisión:**
Generar las constancias de forma **stateless** (sin nueva tabla ni migración): la API consulta la
solicitud aprobada, construye un HTML institucional y lo convierte a PDF gracias a `PuppeteerPdfRenderer`,
que implementa la interfaz `PdfRenderer` (patrón Adapter, mismo enfoque que `DocumentStorage`).

**Alternativas consideradas:**
- Biblioteca de bajo nivel (pdfkit): render más artesanal, peor maquetado y más código.
- Plantilla pre-generada persistida en storage: agrega estado y rotación, sin beneficio.
- Sin navegador (HTML simple): no cumple el requerimiento explícito de "navegador headless".

**Consecuencias:**
- En runtime se usa Chromium del sistema (`apt` en Docker, `CHROME_EXECUTABLE_PATH` en local) y se evita
  que puppeteer descargue su navegador en imágenes o CI pesadas.
- El costo de lanzar Chromium se paga por descarga; para este volumen académico es aceptable.
- El contrato (`PdfRenderer`) permite cambiar a otro motor o a un servicio externo sin tocar el dominio.
- La comprobación real del PDF se automatizó en el smoke CI (`.github/scripts/smoke-ci.sh`).

---

## ADR-010: Identidad brutalista/maximalista en toda la plataforma (Sprint 8)

**Estado:** Aceptado

**Fecha:** 2026-09-01

**Contexto:**
El frontend usaba un estilo "liquid" (esquinas redondeadas, sombras suaves, degradados). Para una
identidad institucional distintiva y memorable se pidió reemplazarlo por un enfoque **brutalista /
maximalista** en toda la aplicación, manteniendo accesibilidad y reutilización.

**Decisión:**
Sustituir la skin de la aplicación reescribiendo el Design System sobre una **paleta durable**
(`brutal`), bordes de 3px, esquinas 0px (`rounded-brutal`), sombras duras offset (`shadow-brutal*`),
fondo texturizado (`brut-body`), diagonal institucional (`brut-cinta`) y tipografías Arquivo +
Instrument Sans + Space Mono. El cambio es **cosmético por tokens/componentes** (no cambia
comportamiento ni API) y se aplica a chrome, superficies públicas y paneles administrativos,
incluidas las tablas y matrices de seguridad.

**Alternativas consideradas:**
- Neobrutalismo parcial solo en home: inconsistente con el resto de secciones.
- Volver a un tema claro/oscuro clásico: no atendía el pedido de diferenciación.
- Gráficos/SVG generativos en runtime: costo alto y frágil en SSR.

**Consecuencias:**
- Un solo sistema de tokens en `tailwind.config.js` + utilidades en `globals.css`; los componentes UI
  y el chrome se reescriben una única vez y las páginas los heredan.
- Bootstrap del estado visual sin depender de degradados: la identidad es legible incluso en
  texto plano (listas, tablas, alertas).
- La marca SIGEB (azules) se conserva como acento documental sobre la paleta brutal.

---

## ADR-011: Matriz de seguridad con excepciones individuales por usuario (Sprint 8)

**Estado:** Aceptado

**Fecha:** 2026-09-01

**Contexto:**
El control de acceso se resolvía por rol vía `RolPermiso`. Para el sprint 8 se pidió una **matriz de
seguridad** administrable: lista de usuarios desde el panel, alta de usuarios/empleados y asignación
fina de permisos por usuario.

**Decisión:**
Gestionar permisos en dos niveles reutilizando el modelo `UsuarioPermiso` existente (sin migraciones):
1. **Usuario** — excepciones por usuario (`PERMITIR`/`DENEGAR`) vía
   `PATCH /seguridad/usuarios/:id/permisos`; la cadena de decisión evalúa primero la excepción
   individual del usuario y luego el rol (sobre-grant/sobre-deny).
2. **Rol** — matriz rol×permiso (`PATCH /seguridad/roles/:id/permisos`, ALLOW/DENY).

El guard `permiso:editar` protege todos los endpoints; el alta/edición de usuarios audita cada
acción y nunca expone `passwordHash`. Se agregó autoprotección: un usuario no puede inactivarse a sí
mismo (400).

**Alternativas consideradas:**
- Nuevo rol `EMPLEADO` con permisos fijos: duplicaba el modelo sin flexibilidad.
- Tabla de asignación 1:1 por permiso con ABM por pantalla (grilla completa): sobre-complejidad y
  matriz legible es más directa.
- Habilitar borrado físico de usuarios: rompe trazabilidad; se optó por alta/rol/estado.

**Consecuencias:**
- Cadena de permisos binaria: excepción de usuario (`PERMITIR`/`DENEGAR`) se evalúa primero; si no
  existe, se evalúa el permiso de rol. `DENEGAR` de usuario siempre gana; documentado en
  `permission-chain.ts`.
- El listado de usuarios admite rol obligatorio al crear; las excepciones se guardan por
  reemplazo (delete + create) para convergencia de la UI.
- Cobertura automatizada: `users.service.spec` (12 casos) más el bloque de seguridad del smoke CI.

---

*Última actualización: 2026-09-02*
