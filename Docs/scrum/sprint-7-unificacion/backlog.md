# Backlog - Sprint 7 de unificación

**Estado: en curso / sujeto a cambios. No es el cierre definitivo.**

Corte: 16 de octubre de 2026 (Guatemala). Los números PR 1-5 identifican las
entregas de la guía; los enlaces muestran sus números reales en GitHub.

| Entrega | Rama | Responsable | Revisor asignado | Archivos | Estado al corte |
|---|---|---|---|---:|---|
| PR 1 | `docs/s7-arquitectura-standards` | José | Yemerson | 16 | [#33](https://github.com/Deividcodv/proyecto-analisis-Eduviagt/pull/33) integrada en `develop` el 13/10 |
| PR 2 | `docs/s7-guias-colaboracion` | Yemerson | José | 7 | [#35](https://github.com/Deividcodv/proyecto-analisis-Eduviagt/pull/35) abierta; pendiente de revisión e integración |
| PR 3 | `docs/s7-scrum-s9` | José | Yemerson | 4 | [#34](https://github.com/Deividcodv/proyecto-analisis-Eduviagt/pull/34) integrada en `develop` el 13/10 |
| PR 4 | `chore/s7-normalizacion` | Yemerson | José | 5 | [#36](https://github.com/Deividcodv/proyecto-analisis-Eduviagt/pull/36) abierta; pendiente de revisión e integración |
| PR 5 | `docs/s7-artefactos` | Yemerson | José | 5 | Esta propuesta; preparada para revisión, integración al final |

Total previsto: 37 archivos, distribuidos en 20 de José y 17 de Yemerson.
El estado de integración de #33 y #34 no presupone una revisión histórica
realizada por Yemerson; las aprobaciones se consultan en cada PR.

## Orden y dependencias

- PR 1, PR 2 y PR 4 tienen rutas disjuntas.
- PR 3 sigue a PR 1; ambas entregas de José ya están integradas.
- PR 5 se integra al final, después de las entregas 1-4, con su estado actualizado.
- José realiza la revisión cruzada de las entregas de Yemerson. David autoriza
  cada merge con CI verde.

## Pendientes de aceptación

- [ ] Registrar la revisión de José para las entregas 2, 4 y 5.
- [ ] Confirmar CI verde en la versión que se integre de cada PR.
- [ ] Integrar #35 y #36 con autorización de David.
- [ ] Actualizar estos artefactos e integrar PR 5 al final.
- [ ] Ejecutar la comparación global de `develop` contra `b62070b`.
- [ ] Confirmar el tratamiento de las excepciones documentadas en [review.md](review.md).
- [ ] Asignar el seguimiento de S8 o `hotfix/*` que el equipo considere necesario.
