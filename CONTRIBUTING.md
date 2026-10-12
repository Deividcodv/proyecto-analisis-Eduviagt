# Contribuir

## Ramas

- `develop` es la rama de integración (rama por defecto).
- Trabaja en ramas `feature/...`, `chore/...`, `docs/...`, `ci/...`.

## Commits

Usa Conventional Commits: `feat(api): ...`, `fix(web): ...`, `docs(scrum): ...`.

## Pull Requests

- Todo cambio entra por PR contra `develop`.
- `develop` requiere 1 aprobación y que pase el check `lint-and-test`.
- Solo se usa **squash merge**; la rama se borra automáticamente al mergear.

## Calidad

- Ejecuta `npm run lint`, `npm run test` y `npm run build` antes de abrir el PR.
