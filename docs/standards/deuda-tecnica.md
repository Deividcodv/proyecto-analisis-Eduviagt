# Deuda técnica conocida — EDUVIAGT

> Registro de los problemas conocidos que **no** están resueltos en el código,
> con su motivo y la forma de resolverlos. Sirve para que nadie los descubra
> por sorpresa y para que el backlog refleje la realidad.
>
> *Última actualización: 2026-10-23*

---

## 1. Dependencias con avisos de seguridad

`npm audit` (solo dependencias de producción) queda en **15 avisos**: 1 bajo,
8 moderados, 4 altos y 2 críticos. Se resolvió lo que se podía sin salto
mayor de versión:

| Paquete | Antes | Ahora | Nota |
|---|---|---|---|
| `multer` | 2.0.2 (vulnerable a DoS) | **2.5.0** | Dependencia directa de la API y `override` en la raíz. Es el paquete que procesa las subidas de documentos, por eso era prioritario. |
| `lodash` | 4.17.21 | 4.17.21 | Queda en la versión que fijan `@nestjs/config` y `@nestjs/swagger`. Solo se usa internamente para leer la configuración, nunca con datos de usuario. |

### Lo que queda y por qué no se ha tocado

| Aviso | Paquete | Por qué no se actualiza | Cómo resolverlo |
|---|---|---|---|
| Crítico ×3 | `next` (14.2.35) | Denegación de servicio en el Image Optimizer, deserialización de peticiones RSC y *request smuggling* en las reescrituras. La versión corregida es la **16.4.3**: es un salto mayor de versión. | Plan propio: subir a Next 16, revisar el App Router (parámetros asíncronos, `next/image`) y repetir la E2E completa. |
| Crítico | `node-tar` | Llega por `puppeteer`, que se usa para generar las constancias PDF. Solo se ve en la instalación y la generación, no en el servicio. | Actualizar Puppeteer a una versión que traiga `tar` corregido, o sustituir la generación de PDF. |
| Alto | `js-yaml` | Dependencia anidada de `@nestjs/swagger@7`. La versión corregida exige `@nestjs/swagger@12`. | Subir `@nestjs/swagger` (y con él `@nestjs/core`) a la versión 12 en el mismo plan que el salto de Next. |
| Alto | `postcss` | Dependencia de compilación de Tailwind. Afecta al entorno de desarrollo, no al servicio en producción. | Se resolverá al actualizar las herramientas de compilación. |
| Moderado | `body-parser`, `file-type`, `@nestjs/core` | Dependencias del núcleo de NestJS 10. La versión corregida es NestJS 12. | Mismo plan que el salto de Next. |

### Mitigación aplicada mientras tanto

- ⚠️ **Corrección (2026-10-27):** `apps/web/next.config.js` **no contiene**
  `images.unoptimized`. La afirmación anterior era incorrecta. Las imágenes
  se sirven sin optimización porque no hay imágenes remotas (`images.domains: ['localhost']`),
  pero no por una opción explícita de desactivación.
- **Las subidas tienen límites explícitos** de tamaño (5 MB, `DOCUMENTO_MAX_BYTES`)
  y de número de archivos (1, `FileInterceptor` con `limits: { fileSize, files: 1 }`).
  **No** hay límites de campos ni de tamaño de nombre de campo (corrección de la
  afirmación anterior).
- nginx queda **en la misma máquina** que la web y normaliza las peticiones
  antes de reenviarlas, lo que reduce el alcance del *request smuggling*.

---

## 2. Red y exposición

| Punto | Estado | Qué falta |
|---|---|---|
| HTTPS | No hay certificado; el portal sirve por `http://57.156.58.111:3001` | Un dominio con DNS apuntando a la VM, `certbot` y la redirección 80 → 443. |
| NSG de Azure | Siguen abiertos 3000 y 3001 | Quitar 3000 y 3001 y abrir 80 y 443. Lo hace falta una sesión en el portal de Azure. |
| Puerto 3000 (API) | Cerrado por `ufw`; la API además escucha solo en `127.0.0.1` | Nada pendiente. |
| Puerto 3002 (web interna) | Solo en `127.0.0.1` | Nada pendiente. |

Las contraseñas y los tokens de sesión viajan **sin cifrar** mientras no haya
HTTPS. Es el punto de mayor riesgo abierto del proyecto.

---

## 3. Decisiones aplazadas

| Tema | Estado | Motivo |
|---|---|---|
| Verificación de correo con Resend | Analizado, no implementado | Requiere decisión de producto: obligatorio para postular o solo aviso, y qué remitente se usa. |
| Límite de intentos de login en Redis | En memoria | Se pierde al reiniciar PM2. Suficiente para una sola instancia; con varias, moverlo a Redis o PostgreSQL. |
| Rotación de `JWT_SECRET` | Pendiente | Requiere invalidar las sesiones activas; conviene hacerlo junto con el HTTPS. |
| Limpieza de archivos huérfanos | No existe | Los documentos borrados de la base dejan su archivo en `storage/`. |

---

## 4. Deuda técnica verificada en código (2026-10-27)

> Hallazgos de la auditoría de arquitectura. Cada entrada cita `archivo:línea`.

### 4.1 Bugs funcionales (P0)

| # | Hallazgo | Evidencia | Impacto |
|---|---|---|---|
| 1 | El controller del asistente no pasa el usuario → `rol`/`usuarioId`/`sesionId` siempre `null` | `asistente/asistente.controller.ts:17-19` | El "acotado por rol y sesión" del README no está operativo; sin trazabilidad de quién preguntó |
| 2 | El modo LLM no es RAG → puede inventar datos de convocatorias/becas | `asistente/providers/openai.provider.ts:58-66` (sin contexto inyectado) | Respuestas no verificables en un sistema de becas |
| 3 | Endpoint del asistente público sin rate limit | `asistente/asistente.controller.ts` (sin `@nestjs/throttler`) | DoS + inflación de BD (3 filas/request) + abuso de cuota LLM |

### 4.2 Seguridad / privacidad (P1)

| # | Hallazgo | Evidencia |
|---|---|---|
| 4 | Sin sanitización ni defensa de prompt injection (pregunta literal al LLM) | `asistente/providers/openai.provider.ts:64` |
| 5 | PII en la pregunta → BD sin dueño y enviada a un tercero | `asistente/asistente.service.ts:19-40` |
| 6 | KB expone roles/estados/proceso de comités a anónimos (contradice la política del system prompt) | `prisma/seed.ts:1296-1385` |
| 7 | `API_INTERNAL_URL` inlineado en build → Server Components apuntan al propio web en prod | `apps/web/next.config.js:12-15` |
| 8 | Sin `middleware.ts` → flash de contenido y URLs privadas en el HTML inicial | ausencia de `middleware.ts` |
| 9 | Tokens en `localStorage` (vulnerable a XSS); refresh de 7 d también en `localStorage` | `apps/web/src/lib/auth.ts` |

### 4.3 Código muerto / inconsistencias (P2)

| # | Hallazgo | Evidencia |
|---|---|---|
| 10 | `RolesGuard` + `@Roles()` registrados globalmente pero sin uso en ningún controller | `common/guards/roles.guard.ts`, `common/decorators/roles.decorator.ts` |
| 11 | Token `LOGIN_ATTEMPT_SERVICE` declarado pero nunca usado | `auth/login-attempt.service.ts:3` |
| 12 | `axios` en `package.json` sin uso en `src/` | `apps/web/package.json` |
| 13 | `ReportesModule` no exporta `ReportesService` | `reportes/reportes.module.ts` |
| 14 | `SOLICITUD_ESTADO` sin `PENDIENTE_SEGUNDA_APROBACION` (divergencia con FSM y enum Prisma) | `common/constants/estados.ts` vs `solicitudes/solicitud-state-machine.ts` |
| 15 | `STAFF` en el seed pero ausente de `common/constants/roles.ts` | `prisma/seed.ts` vs `common/constants/roles.ts` |
| 16 | `asistente_conversacion.usuarioId` sin FK a `usuario` | `prisma/schema.prisma:695` |
| 17 | Sin endpoint `/health` (el healthcheck consulta `/api/catalogos/generos`) | `docker-compose.prod.yml` |
| 18 | Capa Repository documentada pero inexistente | `docs/standards/code-conventions.md` |
| 19 | `RolesGuard` no se usa pero está registrado globalmente | `common/common.module.ts:28` |

### 4.4 Calidad / robustez (P2)

| # | Hallazgo | Evidencia |
|---|---|---|
| 20 | `@@` de PostgreSQL ignora booleanos del tsquery → AND estricto, no OR | `asistente/providers/fallback.provider.ts:76-89` |
| 21 | `tags` seleccionados pero nunca usados para filtrar | `asistente/providers/fallback.provider.ts:81` |
| 22 | Truncamiento `contenido.split('\n')[0]` pierde contenido multilínea | `asistente/providers/fallback.provider.ts:61-64` |
| 23 | Sin cache → FTS y tokens duplicados | `asistente/asistente.service.ts` |
| 24 | Sin transacción ni try/catch en la persistencia del asistente | `asistente/asistente.service.ts:19-40` |
| 25 | `IsNotEmpty` sin trim → `"   "` pasa validación | `asistente/dto/preguntar.dto.ts` |
| 26 | `max_tokens` hardcodeado → incompatible con modelos que exigen `max_completion_tokens` | `asistente/providers/openai.provider.ts:43` |
| 27 | Sin `AbortController` ni timeouts en el frontend | `apps/web/src/lib/api.ts`, `api-auth.ts` |
| 28 | 401 no expulsa al usuario (no hay redirección a `/login`) | `apps/web/src/lib/api-auth.ts` |
| 29 | `ConfirmDialog` sin focus trap ni Escape | `apps/web/src/components/ui/ConfirmDialog.tsx` |
| 30 | `/sounds/notificacion.mp3` no existe → el sonido nunca suena | `apps/web/src/hooks/use-notificaciones-sonido.ts` |
| 31 | Mojibake en `app/coordinador/page.tsx` | `apps/web/src/app/coordinador/page.tsx` |
| 32 | Doble implementación del chat IA (lógica duplicada) | `ChatWidget.tsx`, `MiniAsistente.tsx` |

### 4.5 Controles documentados como implementados pero NO implementados

| Control documentado | Realidad | Evidencia |
|---|---|---|
| Cifrado AES-256 de CUI y datos financieros | No implementado (datos en claro) | grep `createCipher\|aes-\|encrypt` = 0 |
| `helmet` (headers de seguridad) | No instalado ni usado | `apps/api/package.json` |
| `@nestjs/throttler` (100 req/min global + `@Throttle`) | No instalado; solo `LoginAttemptService` en memoria | `apps/api/package.json` |
| Validación de complejidad de contraseña (mayús/minús/número/símbolo) | Solo `MinLength(8)` | `auth/dto/register.dto.ts` |
| Límite de 10 MB por archivo | Real: 5 MB en la API (`DOCUMENTO_MAX_BYTES`) | `solicitudes/solicitud-documento.service.ts` |
| `images.unoptimized` en Next.js | No existe en `next.config.js` | `apps/web/next.config.js` |
| Repositorios (`*.repository.ts`) | No existe capa Repository | grep `Repository` = 0 |
| Verificación de correo con Resend | Analizado, no implementado | — |

---

## 4. Estado de la réplica (completada en Sprint 8)

La réplica de `EDUVIAGT-prod` en `proyecto-analisis-Eduviagt` se completó en Sprint 8. El repositorio
del equipo ahora incluye el código de la segunda aprobación por monto, la
privacidad, la accesibilidad y la eliminación de cuenta.

Se eliminó la documentación de proceso de réplica. La documentación restante
refleja el estado actual del proyecto.

---

*Este documento se actualiza cuando se resuelve o se agrava un punto.*
