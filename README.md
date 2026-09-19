# EDUVIA-gt

> Nombre de trabajo sugerido . Si el equipo prefiere otro
> nombre, basta con reemplazarlo aquí; el resto del documento no depende del nombre.

Plataforma para que el Ministerio de Educación administre el ciclo completo de una beca: publicación de
convocatorias, postulación de estudiantes, carga y revisión de documentos, evaluación, decisión de comités
evaluadores, y consulta de estado — con una matriz de seguridad configurable por rol y por usuario, y un
asistente de IA que responde de forma distinta según si hay sesión iniciada y qué rol tiene quien pregunta.

Este documento es la referencia técnica para arrancar la construcción del proyecto: arquitectura, patrones
de diseño, stack, modelo de datos, seguridad y endpoints. Está pensado como el "documento de arquitectura +
diseño" inicial, no como documentación de una API ya construida.

---

## 1. Alcance funcional

Requisitos obligatorios del proyecto, ya cubiertos por este diseño:

- Administrar convocatorias
- Registrar estudiantes (postulantes) con CUI/DPI único
- Gestionar solicitudes con perfil personal, académico y financiero
- Cargar documentación, con requisitos configurables por convocatoria
- Administrar evaluaciones con criterios ponderados
- Gestionar comités evaluadores (sesiones, quórum, votación)
- Aprobar o rechazar solicitudes
- Consultar el estado de una beca
- Generar reportes básicos (para personal interno, no para postulantes)

Extendido según los últimos requerimientos del Product Owner:

- Asistente de IA con alcance de respuesta distinto según sesión y rol
- Matriz de seguridad: permisos por rol **y** excepciones por usuario individual
- Prevención explícita de inyección SQL y otras validaciones de seguridad
- CUI/DPI obligatorio y único al registrar un postulante
- Catálogos (género, nivel académico, departamento, municipio) con opción "otro" habilitada solo al
  seleccionarla
- Formulario de solicitud con documentos requeridos variables por convocatoria, validación de completitud
  antes de poder aplicar, y opción de quitar/reemplazar un documento antes del envío

Explícitamente **fuera de alcance** en esta versión (a diferencia del sistema de referencia analizado):
pagos y conciliación bancaria, contratos y formalización, renovaciones, lista de espera, autenticación de
dos factores, almacenamiento en la nube, múltiples idiomas, búsqueda vectorial. Todo esto queda como
trabajo futuro documentado en el backlog, no como deuda oculta. La generación de constancias en PDF para
solicitudes aprobadas ya está incluida (US-F7, ver `apps/api/src/solicitudes/constancias.service.ts`).

---

## 2. Arquitectura

**Monolito modular por capas**, dos aplicaciones independientes que hablan por HTTP/JSON.

```
sabe/
├── apps/
│   ├── api/     → backend NestJS, expone REST en /api
│   └── web/     → frontend Next.js, consume la API
├── docker-compose.yml
└── package.json
```

```mermaid
flowchart TB
    subgraph Web["Frontend — apps/web"]
        UI[Páginas públicas, panel postulante, panel administrativo]
    end

    subgraph Api["Backend — apps/api"]
        MW[Guards: throttling → JWT → autorización]
        CTRL[Controladores REST — un router por dominio]
        SVC[Servicios de dominio — reglas de negocio + patrones]
        REPO[Repositorios — interfaz + implementación Prisma]
        MW --> CTRL --> SVC --> REPO
    end

    DB[(PostgreSQL)]

    UI -->|fetch + Bearer token| MW
    REPO --> DB
```

Cada dominio (convocatorias, postulantes, solicitudes, documentos, evaluaciones, comités, seguridad,
reportes, asistente) es un módulo autocontenido: `*.controller.ts`, `*.service.ts`, `*.repository.ts`,
`dto/`. Los servicios dependen de **interfaces** de repositorio, no de Prisma directamente — esto es lo que
permite justificar bajo acoplamiento y facilidad de cambio futuro sin necesitar microservicios.

### Justificación de la arquitectura

| Criterio | Cómo lo resuelve este diseño |
|---|---|
| Mantenibilidad | Cada dominio vive en su propio módulo; cambiar reglas de evaluación no toca comités ni documentos |
| Escalabilidad | Monolito modular evita la complejidad operativa de microservicios que este alcance no justifica; cualquier módulo puede extraerse después si el volumen lo exige |
| Bajo acoplamiento | Servicios dependen de interfaces de repositorio (Dependency Inversion), no de la implementación concreta de la base de datos |
| Reutilización | Catálogos, autorización y auditoría son transversales y se inyectan donde se necesitan, no se duplican |
| Facilidad de cambios futuros | El proveedor de IA, el almacenamiento de documentos y el motor de notificaciones están detrás de interfaces intercambiables |
| Complejidad proporcional al alcance | ~9 módulos de dominio, no 24 — proporcional a lo que el enunciado pide, con margen para lo agregado (IA, matriz de seguridad) |

---

## 3. Patrones de diseño

8 patrones con evidencia de uso real en el dominio (2 más del mínimo exigido, producto de los requisitos de
seguridad y de IA agregados).

### Creacionales

| Patrón | Dónde se usa | Problema que resuelve | Alternativas consideradas | Ventaja |
|---|---|---|---|---|
| **Singleton** | Servicio de conexión a base de datos, compartido por toda la aplicación | Evitar múltiples pools de conexión y estado inconsistente entre módulos | Instanciar el cliente en cada servicio | Una sola fuente de verdad para la conexión; más fácil de testear con mocks |
| **Builder** | Construcción de la `Solicitud` (perfil personal + académico + financiero + documentos), llenada en pasos distintos del formulario | El objeto final tiene muchos campos opcionales que se completan en momentos distintos y deben validarse por sección | Constructor con todos los parámetros de una vez, o setters sueltos sin validación | Cada sección se valida de forma independiente antes de ensamblar el objeto final; el formulario multi-paso del frontend mapea 1:1 con los pasos del builder |

### Estructurales

| Patrón | Dónde se usa | Problema que resuelve | Alternativas consideradas | Ventaja |
|---|---|---|---|---|
| **Facade** | `SolicitudLifecycleService`: orquesta validar transición de estado, actualizar registro, registrar historial y emitir evento en una sola llamada | El controlador no debe conocer los pasos internos de aprobar/rechazar/enviar una solicitud | Que el controlador llame cada paso por separado | Centraliza la lógica, evita duplicarla en cada endpoint, respeta responsabilidad única |
| **Adapter** | Interfaz `DocumentStorage` con implementación de filesystem local | La lógica de negocio no debe depender de dónde/cómo se guardan los archivos | Llamar directo a `fs` desde los servicios | Permite cambiar a almacenamiento en la nube después sin tocar la lógica de negocio |
| **Proxy** | `AsistenteIAProxy`: intercepta cada pregunta al asistente, resuelve sesión y rol, arma el contexto permitido, y solo entonces delega al proveedor real de IA | El modelo de lenguaje no debe tener acceso directo a datos de otros usuarios ni ejecutar consultas libres | Llamar al proveedor de IA directamente desde el controlador | El control de acceso queda en un solo punto obligatorio de paso; imposible saltárselo por accidente en un nuevo endpoint |

### De comportamiento

| Patrón | Dónde se usa | Problema que resuelve | Alternativas consideradas | Ventaja |
|---|---|---|---|---|
| **State** | Máquinas de estado de `Convocatoria` y `Solicitud`, con tabla de transiciones válidas | Evitar transiciones inválidas (ej. de RECHAZADA a APROBADA) y lógica de estado dispersa en condicionales | Campo de texto libre validado con `if` en cada servicio | Regla de negocio centralizada, testeable de forma aislada, imposible de saltarse |
| **Observer** | Eventos de dominio (`solicitud.enviada`, `solicitud.evaluada`, `sesion.finalizada`) que disparan notificaciones y auditoría sin acoplarse al servicio que los emite | Desacoplar "qué pasó" de "quién debe reaccionar" | Llamar directamente al servicio de notificaciones desde cada servicio de negocio | Se pueden agregar nuevos "reaccionadores" (ej. auditoría) sin tocar el código que emite el evento |
| **Chain of Responsibility** | Resolución de permisos: primero se revisa si existe una excepción de usuario (`UsuarioPermiso`); si no existe, se revisa el permiso del rol; si tampoco aplica, se deniega por defecto | La matriz de seguridad necesita resolver, para cada petición, cuál de dos fuentes de permiso manda | Un único `if` gigante mezclando reglas de rol y de usuario | Cada eslabón resuelve o delega; agregar una tercera fuente de permisos (ej. por convocatoria) no rompe las dos anteriores |

---

## 4. Stack tecnológico

| Capa | Tecnología | Nota |
|---|---|---|
| Frontend | Next.js (App Router) + React, Tailwind CSS con sistema de diseño propio | Identidad visual distinta al sistema de referencia analizado |
| Formularios | React Hook Form + Zod | Necesario para el formulario multi-sección con lógica "otro" y validación de documentos obligatorios |
| Backend | NestJS + TypeScript | Módulos + inyección de dependencias facilitan Adapter/Facade/Proxy sin contenedor de DI manual |
| ORM | Prisma | Consultas parametrizadas por defecto → primera línea de defensa contra inyección SQL |
| Base de datos | PostgreSQL | Búsqueda de texto (`tsvector`) para la base de conocimiento del asistente, sin necesitar extensión vectorial |
| Autenticación | Passport + JWT (access/refresh) + bcrypt | Sin 2FA en esta versión |
| Autorización | Guard de permisos con Chain of Responsibility sobre rol + excepciones de usuario | Ver sección 6 |
| Almacenamiento de documentos | Filesystem local detrás de `DocumentStorage` (Adapter) | Migrable a almacenamiento en la nube sin tocar servicios |
| IA | Proveedor configurable (Gemini/OpenAI) detrás de `AsistenteIAProxy` (Strategy + Proxy) | Sin RAG vectorial; base de conocimiento estructurada |
| Reportes | Consultas agregadas + exportación CSV | Sin librerías de gráficos pesadas |
| Testing | Jest + Supertest (API), Playwright (E2E web) | |
| CI | GitHub Actions: lint + test en cada Pull Request | |
| Infra local | Docker Compose (PostgreSQL) | |

---

## 5. Modelo de datos

### Seguridad y usuarios

```mermaid
erDiagram
    ROL ||--o{ ROL_PERMISO : agrupa
    PERMISO ||--o{ ROL_PERMISO : asignado
    USUARIO ||--o{ USUARIO_PERMISO : excepciones
    PERMISO ||--o{ USUARIO_PERMISO : referenciado
    ROL ||--o{ USUARIO : tiene

    USUARIO {
        uuid id PK
        string cui UK
        string nombres
        string email UK
        string passwordHash
        uuid rolId FK
        string estado
    }
    PERMISO {
        uuid id PK
        string modulo
        string accion
    }
    USUARIO_PERMISO {
        uuid usuarioId FK
        uuid permisoId FK
        string efecto
    }
```

`efecto` en `USUARIO_PERMISO` es `PERMITIR` o `DENEGAR`: permite tanto ampliar como restringir un permiso
puntual para un usuario específico, por encima de lo que su rol define por defecto.

### Dominio de becas

```mermaid
erDiagram
    BECA ||--o{ CONVOCATORIA : convoca
    BECA ||--o{ CRITERIO_EVALUACION : define
    CONVOCATORIA ||--o{ CONVOCATORIA_DOC_REQUERIDO : exige
    CONVOCATORIA ||--o{ SOLICITUD : recibe
    USUARIO ||--o{ SOLICITUD : postula

    SOLICITUD ||--|| SOLICITUD_PERFIL_ACADEMICO : tiene
    SOLICITUD ||--|| SOLICITUD_PERFIL_FINANCIERO : tiene
    SOLICITUD ||--o{ SOLICITUD_DOCUMENTO : adjunta
    SOLICITUD ||--o{ HISTORIAL_ESTADO : registra
    SOLICITUD ||--o{ EVALUACION : recibe
    SOLICITUD ||--o{ VOTO : votada
    SOLICITUD ||--o| DECISION : resuelve

    COMITE ||--o{ COMITE_MIEMBRO : integra
    USUARIO ||--o{ COMITE_MIEMBRO : participa
    COMITE ||--o{ SESION : sesiona
    SESION ||--o{ VOTO : registra
    SESION ||--o{ DECISION : emite

    SOLICITUD {
        uuid id PK
        uuid convocatoriaId FK
        uuid usuarioId FK
        string estado
        int correccionesCount
    }
    SOLICITUD_DOCUMENTO {
        uuid id PK
        uuid solicitudId FK
        uuid documentoTipoId FK
        string archivoUrl
        string estado
        int version
    }
```

### Catálogos con opción "otro"

Cada catálogo (`Genero`, `NivelAcademico`, `Departamento`, `Municipio`) se referencia desde el perfil del
postulante con dos columnas: `xxxId` (nullable, referencia al catálogo) y `xxxOtro` (nullable, texto libre).
Regla de negocio: exactamente una de las dos debe estar llena. `Municipio` referencia a `Departamento` para
el dropdown en cascada.

### Entidades adicionales

- `AuditLog`: usuario, acción, entidad afectada, detalle, fecha — quién cambió qué, incluyendo cambios en la
  matriz de permisos.
- `AsistenteBaseConocimiento`: preguntas/respuestas o fragmentos de ayuda indexados por texto completo.
- `AsistenteConversacion` / `AsistenteMensaje`: historial de interacciones, para poder auditar qué contexto
  vio el asistente en cada respuesta.

---

## 6. Seguridad

### Matriz de permisos (rol + usuario)

- Permisos con convención `modulo:accion`, por ejemplo `solicitud:ver`, `solicitud:editar`,
  `documento:eliminar`, `reporte:ver`, `permiso:editar`.
- `RolPermiso` define la base por rol.
- `UsuarioPermiso` define excepciones puntuales (`PERMITIR` amplía, `DENEGAR` restringe) para un usuario
  específico, sin tener que crear un rol nuevo para un caso aislado.
- Resolución vía **Chain of Responsibility**: excepción de usuario → permiso de rol → denegado por defecto.
- Toda edición de la matriz queda en `AuditLog`.
- Solo `ADMIN` (o quien tenga `permiso:editar`) puede modificar la matriz.

### Roles base sugeridos

| Rol | Descripción |
|---|---|
| `ADMIN` | Acceso total, incluida la matriz de seguridad |
| `POSTULANTE` | Crea y gestiona su propia solicitud |
| `EVALUADOR` | Evalúa solicitudes asignadas |
| `COORDINADOR_COMITE` | Convoca sesiones, registra decisiones |
| `MIEMBRO_COMITE` | Vota en sesiones |
| `STAFF` | Rol base para personal administrativo; sus permisos reales se afinan mayormente vía excepciones de usuario |

### Prevención de inyección SQL y otras validaciones

- Prisma con consultas parametrizadas por defecto; prohibido usar `$queryRawUnsafe` o concatenar valores de
  usuario en SQL. Si se necesita SQL crudo, únicamente `$queryRaw` con template literals (parametrizado).
- DTOs con `class-validator`/Zod en cada endpoint: whitelist de campos, tipos correctos, longitudes máximas.
- El asistente de IA nunca genera ni ejecuta SQL: solo llama a métodos de repositorio ya parametrizados
  (ver Proxy en sección 3).
- Autorización por fila: un postulante solo puede leer/editar su propia solicitud, validado en el servicio,
  no solo en el controlador.
- Archivos: validación de tipo MIME y tamaño antes de guardar, nombre de archivo generado (no el original),
  descarga solo vía endpoint autenticado.
- Contraseñas con `bcrypt`, límite de intentos de login (throttling).
- Campos sensibles (CUI, datos financieros) cifrados en reposo además de protegidos por permisos.

---

## 7. Lógica de negocio

### Ciclo de vida de la convocatoria

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> ABIERTA: publicar
    ABIERTA --> CERRADA: cerrar
    CERRADA --> EN_EVALUACION: iniciar_evaluacion
    EN_EVALUACION --> RESUELTA: resolver
    RESUELTA --> ARCHIVADA: archivar
```

### Ciclo de vida de la solicitud

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> ENVIADA: enviar (documentos obligatorios completos)
    ENVIADA --> EN_REVISION: iniciar_revision
    EN_REVISION --> CORRECCION: pedir_correccion
    CORRECCION --> ENVIADA: reenviar
    EN_REVISION --> EVALUADA: finalizar_revision
    EVALUADA --> APROBADA: decidir
    EVALUADA --> RECHAZADA: decidir
    APROBADA --> [*]
    RECHAZADA --> [*]
```

Reglas clave:
- Solo el dueño de la solicitud puede editarla, y solo en `BORRADOR` o `CORRECCION`.
- El envío exige que la convocatoria esté `ABIERTA`, dentro de fechas, y que **todos** los documentos
  obligatorios de esa convocatoria estén cargados — si falta alguno, se bloquea el envío y se indica cuál.
- Antes del envío, el postulante puede quitar o reemplazar cualquier documento ya subido; la UI siempre
  muestra la lista de documentos cargados con su estado.
- Un evaluador no puede evaluar su propia solicitud (chequeo de imparcialidad).

### Evaluación y comité

1. Se asignan evaluadores a una solicitud en `EN_REVISION`.
2. Cada evaluador puntúa por criterio (pesos definidos por beca); al completar se calcula el score
   ponderado.
3. Con todas las evaluaciones requeridas completas, la solicitud pasa a `EVALUADA`.
4. El comité convoca una sesión con agenda de solicitudes `EVALUADA`.
5. Cada miembro vota una sola vez por solicitud.
6. Al finalizar la sesión se valida quórum (`floor(miembros/2)+1`); las solicitudes pasan a
   `APROBADA`/`RECHAZADA` y se registra la `Decision`.

### Asistente de IA por sesión y rol

| Quién pregunta | Qué puede responder |
|---|---|
| Visitante sin sesión | Preguntas generales: requisitos, convocatorias abiertas, cómo aplicar |
| Postulante logeado | Lo anterior + estado de **su propia** solicitud y documentos pendientes |
| Evaluador / miembro de comité | Lo anterior (parte pública) + **sus** evaluaciones/sesiones pendientes, nunca datos de otros usuarios |
| Admin / Staff con permiso | Estadísticas agregadas |

Todo pasa por `AsistenteIAProxy`, que arma el contexto permitido antes de invocar al proveedor de IA — el
modelo nunca consulta la base de datos directamente.

### Reportes (uso interno, no para postulantes)

Protegidos por el permiso `reporte:ver` (asignable vía matriz de seguridad, no atado a un rol fijo).
Contenido base: conteo de solicitudes por estado, convocatorias abiertas/cerradas, evaluaciones pendientes
vs. completadas, aprobadas/rechazadas por convocatoria — exportable a CSV.

---

## 8. Endpoints principales

Todas las rutas van bajo `/api`. `[permiso]` indica el permiso mínimo requerido; los endpoints marcados
`(público)` no requieren sesión.

### Autenticación (`/auth`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/registro` | Registro de postulante — valida unicidad de CUI y correo (público) |
| POST | `/auth/login` | Inicio de sesión (público) |
| POST | `/auth/refresh` | Renovación de token |
| GET | `/auth/perfil` | Perfil del usuario autenticado |

### Convocatorias (`/convocatorias`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/convocatorias` | público (solo abiertas) / `convocatoria:ver` (todas) |
| GET | `/convocatorias/:id` | público / `convocatoria:ver` |
| GET | `/convocatorias/:id/requisitos` | público — documentos requeridos para aplicar |
| POST | `/convocatorias` | `convocatoria:crear` |
| PATCH | `/convocatorias/:id` | `convocatoria:editar` |
| POST | `/convocatorias/:id/transicion` | `convocatoria:editar` |

### Solicitudes (`/solicitudes`)

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/solicitudes` | `solicitud:crear` (postulante crea la propia) |
| GET | `/solicitudes/mias` | postulante autenticado |
| GET | `/solicitudes/:id` | dueño, o `solicitud:ver` |
| PATCH | `/solicitudes/:id/perfil-academico` | dueño, solo en `BORRADOR`/`CORRECCION` |
| PATCH | `/solicitudes/:id/perfil-financiero` | dueño, solo en `BORRADOR`/`CORRECCION` |
| POST | `/solicitudes/:id/documentos` | dueño — sube/reemplaza un documento |
| DELETE | `/solicitudes/:id/documentos/:docId` | dueño — quita un documento antes de enviar |
| GET | `/solicitudes/:id/checklist` | dueño — qué documentos faltan para poder enviar |
| POST | `/solicitudes/:id/enviar` | dueño — valida completitud antes de transicionar |
| POST | `/solicitudes/:id/transicion` | `solicitud:editar` |

### Documentos (`/documentos-tipo`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/documentos-tipo` | `documento:ver` |
| POST | `/documentos-tipo` | `documento:crear` |

### Evaluaciones (`/evaluaciones`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/evaluaciones/asignadas` | evaluador autenticado |
| POST | `/evaluaciones/:solicitudId/asignar` | `evaluacion:crear` |
| PATCH | `/evaluaciones/:id/puntajes` | evaluador dueño de la evaluación |

### Comités (`/comites`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/comites` | `comite:ver` |
| POST | `/comites/:id/sesiones` | `comite:crear` |
| POST | `/sesiones/:id/votos` | miembro del comité |
| POST | `/sesiones/:id/finalizar` | `comite:editar` — valida quórum y genera decisiones |

### Seguridad (`/seguridad`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/seguridad/roles` | `permiso:editar` |
| GET | `/seguridad/permisos` | `permiso:editar` |
| PATCH | `/seguridad/roles/:id/permisos` | `permiso:editar` |
| PATCH | `/seguridad/usuarios/:id/permisos` | `permiso:editar` — excepciones por usuario |
| GET | `/seguridad/auditoria` | `permiso:editar` |

### Catálogos (`/catalogos`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/catalogos/generos` | público |
| GET | `/catalogos/niveles-academicos` | público |
| GET | `/catalogos/departamentos` | público |
| GET | `/catalogos/municipios?departamentoId=` | público — dropdown en cascada |

### Reportes (`/reportes`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/reportes/resumen` | `reporte:ver` |
| GET | `/reportes/solicitudes.csv` | `reporte:ver` |

### Asistente (`/asistente`)

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/asistente/preguntar` | público (respuesta acotada) / autenticado (respuesta ampliada según rol) |

---

## 9. Estructura de carpetas propuesta

```
apps/api/src/
├── main.ts
├── app.module.ts
├── common/                  guards, decoradores, interceptor de auditoría
├── auth/                    registro, login, refresh, perfil
├── seguridad/               roles, permisos, excepciones por usuario (matriz)
├── catalogos/               género, nivel académico, departamento, municipio
├── becas/                   catálogo de becas y criterios de evaluación
├── convocatorias/           convocatorias + máquina de estados + documentos requeridos
├── solicitudes/             solicitud + perfil académico/financiero + documentos + máquina de estados
├── documentos/              tipos de documento + storage (adapter fs)
├── evaluaciones/            asignación, puntajes, score ponderado
├── comites/                 comités, sesiones, votos, quórum
├── decisiones/              aprobación/rechazo
├── reportes/                agregaciones + export CSV
├── asistente/                proxy de IA + base de conocimiento
├── auditoria/               log de acciones sensibles
└── prisma/                  servicio de conexión (singleton)
```

---

## Pagina Publica
Debe de hace rmencion al MINEDUC, pero el nombre que tiene el sitema es SIGEB, sera una pagina publica la cua
contara con la informacion como misio, visio, objetivos, muesstra de infoacn de como es que funcionar, 
ademas de contar con el acceso hacia el sistema de SIGEB desde la pagina, agregar todo lo neceario para la paigna publica
