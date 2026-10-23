# Manual del Coordinador de Comité

Rol: **coordinador**. Correo demo: `coordinador@demo.gt` (contraseña `Admin123!`).

## 1. Comités

1. Abre **Comités**.
2. Crea y administra comités (**CRUD**) con sus **miembros** y rol interno:
   - **PRESIDENTE**
   - **VOCAL**
   - **SECRETARIO**

## 2. Sesiones

1. Crea una **sesión** con una **agenda** de solicitudes en estado **EVALUADA**.
   - La agenda solo admite solicitudes **EVALUADA** de una **misma convocatoria**.
2. Durante la sesión, los miembros votan cada solicitud (**un solo voto por miembro por solicitud**).

## 3. Finalizar sesión

1. Pulsa **Finalizar sesión**.
2. Requisitos:
   - **Quórum** mínimo de votantes (`quorumMinimo`, por defecto 1).
   - Solo se procesan solicitudes en **EVALUADA**.
3. Resultado:
   - Decisión por **mayoría** (`APROBAR > RECHAZAR`; `ABSTENCION` no suma; empate → **RECHAZADA**).
   - Las solicitudes transicionan a **APROBADA/RECHAZADA** con historial.
   - La convocatoria pasa a **RESUELTA** cuando ya no quedan solicitudes **EVALUADA**.

## 4. Votación

Tipos de voto: **APROBAR**, **RECHAZAR**, **ABSTENCIÓN**.

## Notas

- Para gestionar la asignación de evaluadores y el cambio a **EN_REVISION**, ver el [Manual del Administrador](02-administrador.md).
