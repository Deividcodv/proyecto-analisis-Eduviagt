# Review provisional - Sprint 7 de unificación

**Estado: en curso / sujeto a cambios. No es el cierre definitivo.**

Referencia: `sigeb-prod@b62070b`. Base auditada del equipo:
`develop@85eb9e114e2b111111e93e34ca3e83ee91c04597`.
Fecha de corte: 16 de octubre de 2026 (Guatemala).

## Entregado e integrado

- [#33](https://github.com/Deividcodv/proyecto-analisis-Eduviagt/pull/33): 16 documentos
  en `doc/README.md`, `doc/architecture`, `doc/standards`, `doc/operations`,
  `doc/team`, `doc/changelog.md` y `doc/glossary.md`.
- [#34](https://github.com/Deividcodv/proyecto-analisis-Eduviagt/pull/34): cuatro
  documentos del Sprint 9 del producto, reubicados desde
  `doc/scrum/sprint-9-mejoras-transversales/` a
  `Docs/scrum/sprint-9-mejoras-transversales/`.

La comparación de las rutas del PR 1 es vacía y los cuatro blobs del PR 3
coinciden con la referencia. Esta comprobación de contenido no equivale a una
aprobación formal de las PRs.

## Propuesto, pendiente de integración

- [#35](https://github.com/Deividcodv/proyecto-analisis-Eduviagt/pull/35): siete guías
  de `docs/`, idénticas a `b62070b`. Se conserva `Docs/` y su contenido previo.
- [#36](https://github.com/Deividcodv/proyecto-analisis-Eduviagt/pull/36):
  `.gitattributes`, los dos `.eslintrc.json`, `apps/api/tsconfig.build.json` y
  `apps/api/prisma/migrations/20260829061028_asistente_tsvector/migration.sql`.
  En los cinco casos el contenido anterior equivale al nuevo más un byte LF
  final. No hay cambios de instrucciones SQL ni de lógica.
- PR 5: los cinco documentos nuevos de esta carpeta. Es documentación original
  del equipo; no se presenta como una copia de la fuente.

## Validación y límites de esta revisión

- Verificación de alcance: 7 archivos añadidos en #35 y 5 modificados en #36.
- Paridad de las restauraciones comprobada por contenido/blob contra `b62070b`.
- La CI de cada PR debe completar lint, pruebas, build, smoke y las imágenes
  Docker requeridas antes de autorizar su integración.
- La verificación final de `develop` se realiza después de los cinco merges.
  Esta revisión provisional no declara completado el sprint ni una demo funcional nueva.

## Excepciones y observaciones de la base

Se conservan el branding de `README.md`, `.github/CODEOWNERS`, `LICENSE`,
`SECURITY.md` y el layout histórico de `Docs/`.

La base auditada contiene además aportes administrativos previos de
[#32](https://github.com/Deividcodv/proyecto-analisis-Eduviagt/pull/32):
`CONTRIBUTING.md`, `.github/pull_request_template.md` y las plantillas
`.github/ISSUE_TEMPLATE/{bug,feature,tarea}.yml`. No provienen de estas entregas
del S7. Se preservan y se señalan para que David confirme la lista de excepciones;
por ello, no se debe exigir literalmente una salida global de solo cuatro líneas.
Para auditar las excepciones de raíz hay que incluir también `LICENSE`,
`SECURITY.md` y `CONTRIBUTING.md` en las rutas de comparación.

`Docs/` y `docs/` son rutas distintas en Git. En sistemas que no distinguen
mayúsculas deben verificarse las rutas del índice, no solo el nombre mostrado
por el explorador de archivos.

## Aceptación pendiente

Revisión de José, autorización de David, CI verde y merges de las entregas de
Yemerson. Se actualizará el resultado antes de integrar PR 5 al final. No se
crea tag ni release de cierre; el seguimiento queda abierto para S8 o `hotfix/*`.
