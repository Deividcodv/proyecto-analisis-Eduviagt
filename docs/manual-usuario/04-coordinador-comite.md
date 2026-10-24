# Manual del Coordinador de Comité

Rol: **coordinador de comité**. Correo demo: `coordinador@demo.gt` (contraseña `Admin123!`).

## 1. Acceso y navegación

1. Inicia sesión con tu correo y contraseña.
2. El menú lateral muestra:
   - **Comités** — gestión de comités y sesiones
   - **Solicitudes** — revisión de solicitudes
   - **Mi perfil** — tus datos personales y preferencias
3. El widget de chat **Eduvi** está disponible en la esquina inferior derecha.

## 2. Gestión de comités

### Crear un comité
1. Abre **Administración → Comités**.
2. Pulsa **Crear comité**.
3. Completa: nombre, descripción.
4. Agrega miembros del comité (usuarios con rol `MIEMBRO_COMITE`).
5. Define el rol de cada miembro dentro del comité.

### Gestionar miembros
- **Agregar miembro**: busca por nombre o correo.
- **Eliminar miembro**: solo si no ha votado en sesiones activas.
- Los miembros inactivos se marcan como `activo: false` (no se borran).

## 3. Crear una sesión

1. Abre un comité y pulsa **Nueva sesión**.
2. Completa: fecha, lugar, quórum mínimo.
3. Agrega solicitudes a la agenda (solo solicitudes en estado `EVALUADA`).
4. La sesión inicia en estado `PROGRAMADA`.

## 4. Durante la sesión

1. **Iniciar sesión**: cambia el estado a `EN_CURSO`.
2. Los miembros votan cada solicitud de la agenda.
3. Cada miembro vota una sola vez por solicitud.
4. Visualiza el progreso: "3 de 5 solicitudes votadas".

## 5. Finalizar la sesión

1. Pulsa **Finalizar sesión**.
2. El sistema valida el **quórum** (`floor(miembros/2) + 1`).
3. Si hay quórum, las solicitudes pasan a `APROBADA` o `RECHAZADA`.
4. Se genera la `Decision` con el resultado y observaciones.
5. La convocatoria pasa a `RESUELTA` si todas las solicitudes están resueltas.

### Validaciones
- No se puede finalizar sin quórum.
- No se puede finalizar con solicitudes sin votar.
- Las decisiones son inmutables una vez generadas.

## 6. Segunda aprobación (Sprint 8)

Para solicitudes con monto > Q10,000:
1. Después de la primera aprobación, la solicitud pasa a `PENDIENTE_SEGUNDA_APROBACION`.
2. Un **ADMIN** o **JEFE_BECAS** (distinto a quien aprobó primero) debe firmar.
3. Desde la segunda instancia se puede: aprobar, rechazar o devolver a revisión.

## 7. Reportes y auditoría

- **Reportes**: resumen de solicitudes por estado, convocatorias, evaluaciones.
- **Exportación CSV**: con BOM, compatible con Excel.
- **Auditoría** (`/audit`): rastro de acciones sensibles.
- **Bitácora** (`/bitacora`): registro inmutable de todas las acciones.

## 8. Páginas legales y accesibilidad

- **Privacidad** (`/privacidad`), **Términos** (`/terminos`), **Cookies** (`/cookies`): enlazadas desde el pie.
- La plataforma cumple WCAG 2.2 AA.

## Preguntas frecuentes

**¿Puedo agregar una solicitud a una sesión ya iniciada?**
No. La agenda se define al crear la sesión. Solo solicitudes en estado `EVALUADA` pueden agregarse.

**¿Qué pasa si un miembro no vota?**
La sesión no se puede finalizar hasta que todos los miembros voten o se cierre la sesión manualmente.

**¿Puedo reabrir una sesión finalizada?**
No. Las sesiones finalizadas son inmutables.

## Camino rápido

Login → Comités → Crear comité → Agregar miembros → Nueva sesión → Agregar solicitudes → Iniciar sesión → Votación → Finalizar sesión → Ver decisiones.

---

*Última actualización: Sprint 8 (2026-10-23)*