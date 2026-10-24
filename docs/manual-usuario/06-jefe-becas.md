# Manual del Jefe de Becas (Sprint 8)

Rol: **jefe de becas**. Correo demo: `jefe@demo.gt` (contraseña `Admin123!`).

> El rol JEFE_BECAS se creó en Sprint 8 para separar la autoridad de aprobación de solicitudes de alto monto. Puede revisar, aprobar y devolver a revisión, pero la segunda firma nunca puede ser la misma persona que firmó la primera.

## 1. Acceso y navegación

1. Inicia sesión con tu correo y contraseña.
2. El menú lateral muestra:
   - **Solicitudes** — panel de solicitudes para segunda aprobación
   - **Bitácora** — registro de tus acciones
   - **Mi perfil** — tus datos personales y preferencias
3. El widget de chat **Eduvi** está disponible en la esquina inferior derecha.

## 2. Solicitudes pendientes de segunda aprobación

1. Abre **Solicitudes → Pendientes de segunda aprobación**.
2. Verás la lista de solicitudes con monto > Q10,000 que requieren tu firma, con:
   - Código de solicitud
   - Convocatoria y beca
   - Monto otorgable
   - Primer aprobador (quien firmó primero)
   - Fecha de primera aprobación
3. Haz clic en una solicitud para ver el detalle completo.

## 3. Segunda aprobación

### Acciones disponibles

| Acción | Descripción | Requisito |
|---|---|---|
| **Aprobar (segunda)** | Aprueba la solicitud definitivamente | Debe ser otra persona distinta a quien aprobó en primera instancia |
| **Rechazar** | Rechaza la solicitud | Motivo obligatorio |
| **Devolver a revisión** | Devuelve la solicitud a `EN_REVISION` | Motivo obligatorio |

### Reglas importantes
- La segunda firma **nunca puede ser la misma persona** que firmó la primera.
- Solo ADMIN o JEFE_BECAS pueden firmar en segunda instancia.
- Cada firma queda registrada en `SolicitudAprobacion` con: nivel, acción, resultado, comentario, IP, fecha.

### Flujo de aprobación

```mermaid
flowchart TD
    A[Solicitud EVALUADA] --> B{Monto > Q10,000?}
    B -->|No| C[APROBADA (primera firma)]
    B -->|Sí| D[PENDIENTE_SEGUNDA_APROBACION]
    D --> E{Segunda firma}
    E -->|Aprobar| F[APROBADA]
    E -->|Rechazar| G[RECHAZADA]
    E -->|Devolver| H[EN_REVISION]
```

## 4. Montos

- Puedes consultar el monto otorgable, el origen del cálculo (`REGLA`, `MONTO_BASE`, `OVERRIDE`) y el responsable.
- Si el monto fue ajustado manualmente (override), el campo `montoCalculadoPor` registra quién lo hizo.

## 5. Bitácora

- Toda acción de aprobación/rechazo/devolución queda registrada en la bitácora del sistema (`/bitacora`).
- Puedes consultar tus propias entradas en la bitácora.

## 6. Perfil personal

- Accede a **Mi perfil** desde el menú lateral.
- Actualiza tus datos personales y preferencias de notificaciones/sonido.

## 7. Páginas legales y accesibilidad

- **Privacidad** (`/privacidad`), **Términos** (`/terminos`), **Cookies** (`/cookies`): enlazadas desde el pie.
- La plataforma cumple WCAG 2.2 AA.

## Preguntas frecuentes

**¿Puedo aprobar una solicitud que yo mismo aprobé en primera instancia?**
No. La segunda firma debe ser de una persona distinta.

**¿Qué pasa si no hay otro ADMIN o JEFE_BECAS disponible?**
La solicitud queda en `PENDIENTE_SEGUNDA_APROBACION` hasta que alguien con autorización la firme.

**¿Puedo ver todas las solicitudes o solo las pendientes?**
Solo las solicitudes en estado `PENDIENTE_SEGUNDA_APROBACION` que requieren tu firma.

## Camino rápido

Login → Solicitudes pendientes → Seleccionar solicitud → Revisar detalle y monto → Aprobar/Rechazar/Devolver → Ver bitácora.

---

*Última actualización: Sprint 8 (2026-10-23)*