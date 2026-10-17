# Manual del Evaluador

Rol: **evaluador**. Correo demo: `evaluador@demo.gt` (contraseña `Admin123!`).

## 1. Solicitudes asignadas

1. Inicia sesión y abre **Mis evaluaciones** (`GET /evaluaciones/mias` en la API).
2. Verás las solicitudes que el administrador te asignó (solicitudes en **EN_REVISION**).

## 2. Puntuar por criterio

1. Abre una solicitud asignada.
2. Puntúa cada **criterio** de la beca en una escala de **0 a 100**.
3. Cada criterio tiene un **peso**; el sistema calcula el **score ponderado** automáticamente al completar todos los criterios.
   - Ejemplo: `score = 0.4 × socioeconómica + 0.6 × trayectoria`.
4. La consulta de score queda **bloqueada** hasta que todos los criterios tengan puntaje.

## 3. Visibilidad

- Solo puedes **editar tus propias evaluaciones**.
- Un usuario con rol **miembro de comité** puede **ver** pero no editar (recibe 403 al intentar editar).

## Notas

- El score se calcula **en vuelo** al consultar `GET /solicitudes/:id/score` (no se persiste una columna aparte).
- Cuando todas las evaluaciones de una solicitud están completas, la solicitud queda **EVALUADA** y pasa a la etapa de comité.
