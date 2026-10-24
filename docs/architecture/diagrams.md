# Diagramas — EDUVIAGT

> Diagramas Mermaid de arquitectura, despliegue y flujos. Última actualización: Sprint 8.

---

## Arquitectura general (Monolito Modular)

```mermaid
flowchart TB
    subgraph Web["Frontend — apps/web (Next.js)"]
        UI[Páginas públicas, panel postulante, panel administrativo]
        Eduvi[Asistente Eduvi (chat flotante + soporte)]
    end

    subgraph Api["Backend — apps/api (NestJS)"]
        MW[Guards: throttling → JWT → autorización (Chain of Responsibility)]
        CTRL[Controladores REST — un router por dominio]
        SVC[Servicios de dominio — reglas de negocio + patrones]
        REPO[Repositorios — interfaz + implementación Prisma]
        MW --> CTRL --> SVC --> REPO

        subgraph Transversales["Servicios transversales"]
            AUTHZ[AuthzService (roles y permisos)]
            BITACORA[BitacoraService (Sprint 8)]
            NOTIF[NotificacionesService]
            STORAGE[DocumentStorage (Adapter)]
            PDF[PdfRenderer (Adapter)]
            IA[AsistenteIAProxy (Proxy + Strategy)]
        end
    end

    DB[(PostgreSQL — 31 entidades)]

    UI -->|fetch + Bearer token| MW
    Eduvi -->|POST /asistente/preguntar| MW
    REPO --> DB
    SVC --> TRANSVERSALES
```

---

## Despliegue (PM2 + nginx)

```mermaid
flowchart LR
    subgraph Internet
        U[Usuario / Navegador]
    end

    subgraph VM["VM Azure (Ubuntu)"]
        NGINX[nginx :3001]
        WEB[Next.js :3002]
        API[NestJS :3000]
        PG[(PostgreSQL :5432)]
        STORAGE2[/storage/ (documentos)/]
    end

    U -->|HTTPS (futuro)| NGINX
    NGINX --> WEB
    WEB -->|fetch /api| API
    API --> PG
    API --> STORAGE2
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
    A->>A: Generar JWT access (15min) + refresh (7d)
    A-->>W: Tokens + usuario
    W->>W: Guardar tokens en localStorage
    W-->>U: Redirigir a dashboard
```

---

## Flujo de solicitud (ciclo de vida — Sprint 8)

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> ENVIADA: enviar (documentos obligatorios completos)
    ENVIADA --> EN_REVISION: iniciar_revision
    EN_REVISION --> CORRECCION: pedir_correccion
    CORRECCION --> ENVIADA: reenviar
    EN_REVISION --> EVALUADA: finalizar_revision
    EVALUADA --> APROBADA: decidir (monto ≤ Q10,000)
    EVALUADA --> PENDIENTE_SEGUNDA_APROBACION: decidir (monto > Q10,000)
    PENDIENTE_SEGUNDA_APROBACION --> APROBADA: aprobar segunda (otra persona)
    PENDIENTE_SEGUNDA_APROBACION --> RECHAZADA: rechazar
    PENDIENTE_SEGUNDA_APROBACION --> EN_REVISION: devolver a revisión
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
    B -->|PERMITIR| C[Permitido]
    B -->|DENEGAR| D[Denegado]
    B -->|No existe| E{Permiso de rol?}
    E -->|Existe| C
    E -->|No existe| D
```

---

## Segunda aprobación (Sprint 8 — US-802)

```mermaid
sequenceDiagram
    participant E as Evaluador/Comité
    participant API as API (Solicitudes)
    participant DB as PostgreSQL
    participant B as BitacoraService
    participant N as NotificacionesService

    E->>API: POST /solicitudes/:id/transicion (aprobar)
    API->>DB: Verificar monto > Q10,000
    alt Monto ≤ Q10,000
        API->>DB: Estado → APROBADA
        API->>B: Registrar aprobación (nivel 1)
        API->>N: Notificar "aprobada"
    else Monto > Q10,000
        API->>DB: Estado → PENDIENTE_SEGUNDA_APROBACION
        API->>B: Registrar aprobación (nivel 1)
        API->>N: Notificar "pendiente segunda firma"
    end

    Note over E: Otra persona debe firmar

    E->>API: POST /solicitudes/:id/transicion (aprobar_segunda)
    API->>API: assertSegundaAprobacion (otra persona)
    API->>DB: Estado → APROBADA
    API->>B: Registrar aprobación (nivel 2)
    API->>N: Notificar "aprobada" (con monto)
```

---

## Montos flexibles (Sprint 8 — US-801)

```mermaid
flowchart TD
    A[Convocatoria] --> B{usarReglasMonto?}
    B -->|No| C[montoBase de la convocatoria]
    B -->|Sí| D[Ingreso familiar del postulante]
    D --> E{Buscar regla por tramo}
    E -->|FIJO| F[montoFijo]
    E -->|PORCENTAJE| G[montoBase × porcentaje]
    E -->|COMPLETO| H[montoBase completo]
    F --> I[montoOtorgable]
    G --> I
    H --> I
    C --> I
    I --> J[Trazabilidad: origen, calculado por, fecha]
```

---

## Eliminación de cuenta (Sprint 8)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant API as API (Auth)
    participant DB as PostgreSQL
    participant FS as Filesystem

    U->>API: POST /auth/eliminar-cuenta (password + confirmación)
    API->>API: Validar contraseña
    API->>API: Validar confirmación escrita
    API->>DB: Anonimizar datos personales (nombres, email, cui, etc.)
    API->>FS: Eliminar documentos y archivos
    API->>DB: Marcar eliminadoAt
    API->>DB: Conservar con seudónimo (solicitudes, evaluaciones, votos, decisiones, historial, auditoría)
    API->>DB: Sanear detalle de auditoría (sin CUI ni correo)
    API-->>U: Cuenta eliminada
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
    USUARIO ||--o| CONFIGURACION_USUARIO : preferencias

    USUARIO {
        uuid id PK
        string cui UK
        string nombres
        string email UK
        string passwordHash
        uuid rolId FK
        string estado
        datetime eliminadoAt
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
    CONFIGURACION_USUARIO {
        uuid id PK
        uuid usuarioId FK
        boolean notificacionesActivas
        boolean sonidoNotificaciones
        int volumenSonido
    }
```

---

## Modelo de datos (becas + convocatorias + solicitudes)

```mermaid
erDiagram
    BECA ||--o{ CONVOCATORIA : convoca
    BECA ||--o{ CRITERIO_EVALUACION : define
    CONVOCATORIA ||--o{ CONVOCATORIA_DOC_REQUERIDO : exige
    CONVOCATORIA ||--o{ CONVOCATORIA_REGLA_MONTO : tiene
    CONVOCATORIA ||--o{ SOLICITUD : recibe
    USUARIO ||--o{ SOLICITUD : postula

    SOLICITUD ||--|| SOLICITUD_PERFIL_ACADEMICO : tiene
    SOLICITUD ||--|| SOLICITUD_PERFIL_FINANCIERO : tiene
    SOLICITUD ||--o{ SOLICITUD_DOCUMENTO : adjunta
    SOLICITUD ||--o{ HISTORIAL_ESTADO : registra
    SOLICITUD ||--o{ EVALUACION : recibe
    SOLICITUD ||--o{ VOTO : votada
    SOLICITUD ||--o| DECISION : resuelve
    SOLICITUD ||--o{ SOLICITUD_APROBACION : firmas

    COMITE ||--o{ COMITE_MIEMBRO : integra
    USUARIO ||--o{ COMITE_MIEMBRO : participa
    COMITE ||--o{ SESION : sesiona
    SESION ||--o{ VOTO : registra
    SESION ||--o{ DECISION : emite
    SESION ||--o{ SESION_AGENDA : agenda

    SOLICITUD {
        uuid id PK
        uuid convocatoriaId FK
        uuid usuarioId FK
        string estado
        int correccionesCount
        decimal montoOtorgable
        decimal montoAprobado
        string montoOrigenCalculo
    }
    SOLICITUD_DOCUMENTO {
        uuid id PK
        uuid solicitudId FK
        uuid documentoTipoId FK
        string archivoUrl
        string estado
        int version
    }
    SOLICITUD_APROBACION {
        uuid id PK
        uuid solicitudId FK
        uuid usuarioId FK
        int nivel
        string accion
        string resultado
    }
```

---

## Bitácora del sistema (Sprint 8)

```mermaid
flowchart LR
    A[Acción de negocio] --> B[BitacoraService.registrar]
    B --> C{Misma transacción}
    C --> D[BitacoraSistema]
    D --> E[actor: persona, rol, correo]
    D --> F[fechaHora, módulo, entidad]
    D --> G[accionClave + accionHumana]
    D --> H[resultado: EXITOSO/RECHAZADO/ERROR]
    D --> I[ip, userAgent, origen]
    D --> J[datosRelevantes JSON]
```

---

## Estructura de carpetas backend

```mermaid
flowchart TB
    subgraph Backend["apps/api/src/"]
        M[main.ts]
        AM[app.module.ts]
        C[common/ — guards, decoradores, interceptors, authz]
        AUTH[auth/ — registro, login, refresh, perfil, eliminar-cuenta]
        SEG[seguridad/ — roles, permisos, excepciones (matriz)]
        CAT[catalogos/ — género, nivel, depto, municipio, instituciones]
        BEC[becas/ — catálogo y criterios]
        CONV[convocatorias/ — CRUD + estados + montos + documentos]
        SOL[solicitudes/ — solicitud + perfiles + docs + estados + montos]
        DOC[documentos/ — tipos + storage adapter]
        EVA[evaluaciones/ — asignación, puntajes]
        COM[comites/ — comités, sesiones, votos, quórum]
        DEC[decisiones/ — aprobación/rechazo]
        REP[reportes/ — agregaciones + CSV]
        ASI[asistente/ — proxy IA + base conocimiento + Eduvi]
        AUD[auditoria/ — log de acciones sensibles]
        BIT[bitacora/ — bitácora inmutable (Sprint 8)]
        NOT[notificaciones/ — notificaciones + preferencias (Sprint 8)]
        STR[storage/ — adapter de documentos (Adapter)]
        PRIS[prisma/ — servicio conexión (Singleton)]
        SAL[salud/ — health check]
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
    AM --> BIT
    AM --> NOT
```

---

## Flujo de descarga segura de documentos (Sprint 8)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant API as API (Documentos)
    participant DB as PostgreSQL
    participant FS as Filesystem

    U->>API: GET /solicitudes/:id/documentos/:docId/descargar
    API->>API: Verificar autenticación (JWT)
    API->>DB: Buscar solicitud y documento
    API->>API: ¿Es dueño o revisor?
    alt Autorizado
        API->>FS: Leer archivo
        API->>DB: Registrar descarga en bitácora
        API-->>U: Archivo (PDF/imagen)
    else No autorizado
        API-->>U: 403 Forbidden
    end
```

---

## Asistente Eduvi — flujo de pregunta

```mermaid
sequenceDiagram
    participant U as Usuario
    participant W as Frontend (Eduvi)
    participant P as AsistenteIAProxy
    participant KB as Base de Conocimiento
    participant LLM as Proveedor IA (opcional)

    U->>W: Escribe pregunta
    W->>P: POST /asistente/preguntar
    P->>P: Resolver sesión y rol del usuario
    P->>P: Armar contexto permitido (Proxy)
    P->>KB: Búsqueda tsvector (PostgreSQL)
    KB-->>P: Resultados relevantes
    alt AI_API_KEY configurada
        P->>LLM: Enviar pregunta + contexto
        LLM-->>P: Respuesta generada
    else Sin AI_API_KEY
        P->>P: Fallback (respuesta desde KB)
    end
    P-->>W: Respuesta + fuentes
    W-->>U: Mostrar respuesta de Eduvi
```

---

*Última actualización: Sprint 8 (2026-10-23)*