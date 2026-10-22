# Retrospectiva provisional - Sprint 7 de unificación

**Estado: en curso / sujeto a cambios. No es el cierre definitivo.**

Observaciones técnicas registradas al 16 de octubre de 2026 (Guatemala).
El equipo puede completarlas al terminar las revisiones; no representan una
reunión de retrospectiva ni acuerdos colectivos todavía no celebrados.

## Qué ha ayudado

- Revisar PRs y `develop` antes de iniciar permitió identificar que José ya había
  integrado sus dos entregas y concentrar el trabajo de Yemerson en lo pendiente.
- Mantener ramas con rutas separadas facilitó comprobar el alcance de cada PR.
- La restauración literal desde `b62070b` y la comparación de blobs aportan
  evidencia reproducible de fidelidad.
- La comprobación byte a byte distinguió los cinco cambios de formato de un
  cambio funcional, incluida la migración SQL.

## Qué conviene mejorar

- Diferenciar el número de entrega de la guía y el número real de PR en GitHub.
- Mantener la lista de excepciones alineada con los aportes administrativos ya
  integrados, sin borrar documentación del equipo para forzar un diff esperado.
- Verificar el índice de Git cuando conviven `Docs/` y `docs/` en macOS.
- Actualizar los estados a partir de PRs y CI; evitar declarar revisiones,
  reuniones o cierres sin evidencia.
- Tratar el S7 de unificación por separado de la carpeta histórica
  `sprint-7-sistema-interno/`, conservando ambos registros.

## Seguimiento propuesto

| Acción | Responsable propuesto | Momento / evidencia de cierre |
|---|---|---|
| Revisar las entregas 2, 4 y 5 | José | Revisiones registradas en las PRs |
| Autorizar merges y confirmar las excepciones administrativas | David | CI verde, revisión cruzada y decisión registrada |
| Actualizar backlog, bitácora y review | Yemerson | Antes de integrar PR 5, al final |
| Repetir la comparación global contra `b62070b` | José y Yemerson | Después de integrar las cinco entregas |
| Registrar ajustes posteriores de documentación o integración | Equipo; asignación pendiente | Backlog de S8 o una rama `hotfix/*` según el alcance |

No se modifica el código de negocio de S0-S6 ni se crea un tag o release
congelada. Las propuestas siguen sujetas a cambios y a revisión del equipo.
