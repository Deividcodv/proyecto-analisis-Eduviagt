# Sprint 7 - Unificación de documentación y paridad

**Estado: en curso / sujeto a cambios. No es el cierre definitivo del proyecto.**

- Referencia del producto: `Deividcodv/sigeb-prod@b62070b`.
- Repositorio del equipo: `Deividcodv/proyecto-analisis-Eduviagt`, base `develop`.
- Responsables: José (`jhernandezg76-dot`) y Yemerson (`yemlo`).
- Coordinación y aprobación de integración: David (`Deividcodv`).
- Corte de esta documentación: 16 de octubre de 2026, hora de Guatemala.

## Objetivo

Completar la documentación pendiente respecto de la referencia del producto y
normalizar cinco diferencias de salto de línea final. El alcance no incorpora
funcionalidad ni altera las reglas de negocio entregadas en S0-S6.

## Alcance

| Entrega | Responsable | Alcance |
|---|---|---|
| PR 1 | José | 16 documentos técnicos en `doc/` |
| PR 2 | Yemerson | 7 guías de colaboración en `docs/` |
| PR 3 | José | 4 artefactos del Sprint 9 del producto en `Docs/scrum/sprint-9-mejoras-transversales/` |
| PR 4 | Yemerson | 5 archivos restaurados literalmente para paridad de formato |
| PR 5 | Yemerson | Estos 5 artefactos nuevos en `Docs/scrum/sprint-7-unificacion/` |

Las entregas 1-4 reproducen el contenido de `b62070b`; el PR 3 cambia únicamente
su ubicación. El PR 5 registra el estado real del trabajo y sus pendientes.

## Criterios para completar el sprint

- [ ] Las cinco entregas están integradas en `develop`.
- [ ] Los archivos portados coinciden con la referencia, incluida la reubicación del PR 3.
- [ ] La revisión cruzada está registrada: Yemerson revisa a José y José a Yemerson.
- [ ] David autoriza cada integración y se utiliza squash con CI verde.
- [ ] Lint, pruebas, build y smoke de CI pasan para los cambios propuestos.
- [ ] Se comprueba la paridad global y se documentan las excepciones del equipo.
- [ ] Se actualizan backlog, review y retrospectiva con el resultado de las integraciones.

No se crea un tag ni una release congelada. Los documentos previos y los
artefactos históricos de `sprint-7-sistema-interno/` se conservan; esta carpeta
identifica específicamente el S7 de unificación documental. Los ajustes
posteriores se canalizan a S8 o a una rama `hotfix/*`, según acuerde el equipo.
