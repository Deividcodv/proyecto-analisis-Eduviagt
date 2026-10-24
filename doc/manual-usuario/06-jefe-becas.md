# Manual del Jefe de Becas (Sprint 8)

Rol: **jefe de becas**. Correo demo: `jefe@demo.gt` (contraseña `Admin123!`).

> El rol JEFE_BECAS se creó en Sprint 8 para separar la autoridad de aprobación de solicitudes de alto monto. Puede revisar, aprobar y devolver a revisión, pero la segunda firma nunca puede ser la misma persona que firmó la primera.

## 1. Solicitudes asignadas

1. Abre **Administración → Solicitudes** (o tu panel de JEFE_BECAS).
2. Filtra por estado `PENDIENTE_SEGUNDA_APROBACION` para ver las solicitudes que requieren tu firma.
3. Revisa el detalle de cada solicitud: perfil, documentos, evaluación, monto otorgable.

## 2. Segunda aprobación (Sprint 8)

Toda postulación con monto superior a **Q10,000** pasa automáticamente a `PENDIENTE_SEGUNDA_APROBACION` después de la primera firma.

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

## 3. Montos (Sprint 8)

- Puedes consultar el monto otorgable, el origen del cálculo (`REGLA`, `MONTO_BASE`, `OVERRIDE`) y el responsable.
- Si el monto fue ajustado manualmente (override), el campo `montoCalculadoPor` registra quién lo hizo.

## 4. Bitácora

- Toda acción de aprobación/rechazo/devolución queda registrada en la bitácora del sistema (`/bitacora`).
- Puedes consultar tus propias entradas en la bitácora.

## 5. Perfil personal

- Accede a **Mi perfil** desde el menú lateral.
- Actualiza tus datos personales y preferencias de notificaciones/sonido.

---

*Última actualización: Sprint 8 (2026-10-23)*