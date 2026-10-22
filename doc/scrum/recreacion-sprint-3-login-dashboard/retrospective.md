# Sprint 3 Recreacion - Retrospectiva

## Datos del Sprint

**Fecha:** 2026-09-16
**Participantes:** Hamilton (Developer), Marcos (Developer), Yemerson (Developer), David (Scrum Master / Reviewer)
**Sprint:** 3 - Login y Dashboard (cierre del prototipo)

## Que salio bien?

1. Flujo completo registro -> login -> dashboard funcionando con datos reales
2. El tag `v0.1-prototipo-demo` se creo limpio (sin modulos de evaluacion/reportes/asistente) sin deudas
3. El script `npm run dev` y CORS se resolvieron al inicio, destrabando las pruebas de UI desde el dia 1

## Que salio mal?

1. La pagina `admin` y `evaluador` del commit fuente `3dfa19a` tuvieron que excluirse a mano (se recordo
   el limite del prototipo al revisar el PR de Hamilton)
2. La sesion persistente presento un falso positivo al recargar la pagina (token de refresh expirado no se
   renovaba en una ruta publica); se corrigio con el desempaquetado del interceptor
3. El UserMenu de Yemerson dependia del estado de sesion de Hamilton; se integro un dia despues del check-in
   del dashboard

## Que podemos mejorar?

1. Documentar en el planning las exclusiones de cada commit fuente (paginas/ modulos que NO se copian)
2. Agregar al smoke del prototipo un caso de "recarga de pagina con sesion activa"
3. Coordinar dependencias frontend-frontend en el planning (estado de sesion antes de UI que lo consume)

## Acciones de mejora

| Accion | Responsable | Fecha limite |
|--------|-------------|--------------|
| Crear checklist de exclusiones por commit fuente en `05-versiones-asignadas-por-persona.md` | David | Sprint 4 |
| Incluir test de recarga con sesion activa en el smoke del prototipo | David | Sprint 4 |
| Ordenar en el planning las dependencias de UI antes de asignar tareas web | David | Sprint 4 |

## Felicitaciones / Reconocimientos

- A Hamilton por el login/dashboard completo y por detectar el tema del refresh token
- A todo el equipo: el prototipo (portal + login) queda listo para el demo del 16 sep

## Notas adicionales

- El prototipo es el primer hito de la simulacion: `v0.1-prototipo-demo`.
- La simulacion continua al S4 (evaluacion) hasta llegar al estado final CI #40 = `a720298`.