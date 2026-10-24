# Sprint 2 — Retrospectiva

## Datos del Sprint

**Fecha:** 2026-08-27
**Participantes:** Héctor (Developer), David (Scrum Master / Reviewer), Marcos (Soporte)
**Sprint:** 2 — Convocatorias

## ¿Qué salió bien?

1. Alcance alto completado: 6/7 historias, 31 de 39 puntos (US-13 diferida a Sprint 3)
2. Patrón State Machine con spec unitario que valida todas las transiciones del flujo
3. Guard de permisos con Chain of Responsibility: cascada persona → rol → DENY por defecto
4. Storage adapter con interface desacoplada y protección contra path traversal

## ¿Qué salió mal?

1. Include Prisma inválido (`criteriosEvaluacion` dentro de `Convocatoria`): compila por el spread de TS pero falla en runtime, rompiendo `GET /convocatorias/:id`. Se detectó en revisión de código y se corrigió anidando dentro de `beca`
2. CI no corre en ramas `feature/*`: el workflow solo dispara en `develop`/`master` y PRs, por lo que B1 (CI verde) no se puede confirmar hasta mergear
3. Trabajo entregado sin commitear en la rama: todo el código del Sprint 2 vivía en el working tree hasta el cierre

## ¿Qué podemos mejorar?

1. Ejecutar un tipo de verificación runtime (smoke test o e2e) antes de declarar completas las US con relaciones Prisma anidadas
2. Ampliar el workflow de CI para que corra también sobre `feature/*` (al menos lint+test) y validar en PR
3. Commitear por hito dentro del sprint, no acumular todo para el final

## Acciones de mejora

| Acción | Responsable | Fecha límite |
|--------|-------------|--------------|
| Ampliar CI a ramas `feature/*` (lint+test) | David | Sprint 3 |
| Agregar smoke test automatizado en CI tras seed | Héctor | Sprint 3 |
| Commitear por hito durante el sprint | Todo el equipo | Sprint 3 |

## Felicitaciones / Reconocimientos

- A Héctor por entregar el core de convocatorias con máquina de estados y specs

## Notas adicionales

- Catálogos y convocatorias con endpoints públicos listos para el portal (Sprint 6)
- El borrado lógico de catálogos evita romper referencias de solicitudes futuras