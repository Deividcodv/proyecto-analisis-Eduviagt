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

- **El Image Optimizer está desactivado** (`images.unoptimized` en
  `apps/web/next.config.js`): el portal solo usa imágenes propias que no
  necesitan optimización, así que se cierra esa vía sin coste para la persona.
- **Las subidas tienen límites explícitos** de tamaño, de número de
  archivos, de campos y de tamaño de nombre de campo, lo que acota los
  vectores de agotamiento de recursos del procesamiento *multipart*.
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

## 4. Estado de la réplica (completada en Sprint 8)

La réplica de `EDUVIAGT-prod` en `proyecto-analisis-Eduviagt` se completó en Sprint 8. El repositorio
del equipo ahora incluye el código de la segunda aprobación por monto, la
privacidad, la accesibilidad y la eliminación de cuenta.

Se eliminó la documentación de proceso de réplica. La documentación restante
refleja el estado actual del proyecto.

---

*Este documento se actualiza cuando se resuelve o se agrava un punto.*
