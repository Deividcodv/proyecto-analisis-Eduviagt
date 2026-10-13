# Diagramas — SIGEB

> Diagramas Mermaid de arquitectura, despliegue y flujos.

---

## Arquitectura general

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

---

## Despliegue

```mermaid
flowchart LR
    subgraph Docker
        API[apps/api :3000]
        WEB[apps/web :3001]
        DB[(PostgreSQL :5432)]
    end

    WEB -->|HTTP/JSON| API
    API -->|Prisma Client| DB
```

---

## Flujo de autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant W as Frontend
    participant A as API (Auth)
    participant DB as PostgreSQL

    U->>W: Ingresa email + password
    W->>A: POST /auth/login
    A->>DB: Buscar usuario por email
    DB-->>A: Usuario
    A->>A: bcrypt.compare(password)
    A->>A: Generar JWT access + refresh
    A-->>W: Tokens + usuario
    W->>W: Guardar tokens
    W-->>U: Redirigir a dashboard
```

---

## Flujo de solicitud (ciclo de vida)

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

---

## Flujo de convocatoria

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> ABIERTA: publicar
    ABIERTA --> CERRADA: cerrar
    CERRADA --> EN_EVALUACION: iniciar_evaluacion
    EN_EVALUACION --> RESUELTA: resolver
    RESUELTA --> ARCHIVADA: archivar
```

---

## Cadena de permisos (Chain of Responsibility)

```mermaid
flowchart TD
    A[Request entrante] --> B{Excepción de usuario?}
    B -->|PERMITIR| C[ Permitido ]
    B -->|DENEGAR| D[ Denegado ]
    B -->|No existe| E{Permiso de rol?}
    E -->|Existe| C
    E -->|No existe| D
```

---

## Modelo de datos (seguridad)

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

---

## Modelo de datos (becas)

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

---

## Estructura de carpetas backend

```mermaid
flowchart TB
    subgraph Backend["apps/api/src/"]
        M[main.ts]
        AM[app.module.ts]
        C[common/ — guards, decoradores, interceptors]
        AUTH[auth/ — registro, login, refresh]
        SEG[seguridad/ — roles, permisos, excepciones]
        CAT[catalogos/ — género, nivel, depto, municipio]
        BEC[becas/ — catálogo y criterios]
        CONV[convocatorias/ — CRUD + máquina de estados]
        SOL[solicitudes/ — solicitud + documentos + estados]
        DOC[documentos/ — tipos + storage adapter]
        EVA[evaluaciones/ — asignación, puntajes]
        COM[comites/ — comités, sesiones, votos]
        DEC[decisiones/ — aprobación/rechazo]
        REP[reportes/ — agregaciones + CSV]
        ASI[asistente/ — proxy IA + base conocimiento]
        AUD[auditoria/ — log de acciones]
        PRIS[prisma/ — servicio conexión singleton]
    end

    M --> AM
    AM --> AUTH
    AM --> SEG
    AM --> CAT
    AM --> BEC
    AM --> CONV
    AM --> SOL
    AM --> DOC
    AM --> EVA
    AM --> COM
    AM --> DEC
    AM --> REP
    AM --> ASI
    AM --> AUD
```

---

*Última actualización: 2026-08-26*
