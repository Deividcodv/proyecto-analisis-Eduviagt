# Convenciones de Git — SIGEB

---

## Branching Strategy

### Estructura de ramas

```
master (protegido)
  │
  └── develop (integración)
        │
        ├── feature/auth-login
        ├── feature/convocatorias-crud
        ├── feature/solicitudes-core
        └── ...
```

### Reglas

| Rama | Origen | Destino | Protección |
|---|---|---|---|
| `master` | — | — | Nunca push directo. Solo merge desde `develop` o `hotfix/*` con PR aprobado |
| `develop` | `master` | — | Recibe merge desde `feature/*` vía PR. CI debe pasar |
| `feature/*` | `develop` | `develop` | Se crea desde `develop`. Se mergea de vuelta vía PR. Se elimina después del merge |
| `hotfix/*` | `master` | `master` + `develop` | Para fixes de producción. Se mergea a ambos con PR |

### Naming de branches

```
feature/<modulo>-<descripcion-corta>
hotfix/<descripcion-corta>
```

Ejemplos:
- `feature/auth-login`
- `feature/auth-registro`
- `feature/convocatorias-estados`
- `feature/solicitudes-documentos`
- `feature/evaluaciones-puntajes`
- `feature/portal-publico-hero`
- `hotfix/fix-login-crash`
- `hotfix/fix-cui-validation`

---

## Commits

### Formato: Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Uso | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(auth): add login endpoint` |
| `fix` | Bug fix | `fix(solicitud): prevent null document` |
| `docs` | Documentación | `docs: add API contracts` |
| `refactor` | Refactor sin cambio de comportamiento | `refactor(evaluaciones): extract score service` |
| `test` | Tests | `test(auth): add registration tests` |
| `chore` | Mantenimiento | `chore: update dependencies` |
| `style` | Formato (no afecta lógica) | `style: fix indentation` |
| `ci` | CI/CD | `ci: add GitHub Actions workflow` |
| `perf` | Performance | `perf(query): add index to solicitud` |

### Scope (opcional)

El módulo afectado:
- `auth`, `seguridad`, `auditoria`, `catalogos`, `convocatorias`, `solicitudes`, `documentos`, `evaluaciones`, `comites`, `decisiones`, `reportes`, `asistente`

### Rules

- Description en inglés, imperativo, sin punto final
- Máximo 72 caracteres en la primera línea
- Body: explicar el **por qué**, no el **qué** (el código lo muestra)
- Footer: referenciar issue con `Closes #123`

### Ejemplos

```
feat(auth): add registration with CUI uniqueness validation

- Validate CUI format (13 digits)
- Check uniqueness before creating user
- Return 409 if CUI already exists

Closes #12
```

```
fix(documentos): prevent file overwrite on re-upload

Generate unique filenames using UUID + original extension.
Never use the user-provided filename directly.

Closes #45
```

---

## Pull Requests

### Template

```markdown
## Descripción
[Brief descripción de los cambios]

## Tipo de cambio
- [ ] feat: Nueva funcionalidad
- [ ] fix: Bug fix
- [ ] docs: Documentación
- [ ] refactor: Refactorización
- [ ] test: Tests
- [ ] chore: Mantenimiento

## Cambios principales
- [Cambio 1]
- [Cambio 2]

## Testing
- [ ] Tests unitarios pasando
- [ ] Tests de integración pasando
- [ ] Test manual realizado

## Checklist
- [ ] Código sigue las convenciones del proyecto
- [ ] No hay errores de lint
- [ ] No hay errores de TypeScript
- [ ] Documentación actualizada (si aplica)
- [ ] No hay secrets expuestos
- [ ] PR asignado al reviewer correcto

## Screenshots (si aplica)
[Capturas de pantalla de cambios visuales]

## Issue relacionada
Closes #[numero]
```

### Reglas de PR

| Regla | Detalle |
|---|---|
| Tamaño | Máximo ~400 líneas de diff (si es más, dividir) |
| Título | Seguir formato de commit: `feat(modulo): description` |
| Reviewer | Al menos 1 aprobación requerida |
| CI | Todos los checks deben pasar antes del merge |
| Descripción | Llenar el template completo |
| Squash merge | Para mantener historial limpio en develop |

---

## Protección de ramas

### `master`
- Require PR aprobado
- RequireCI verde
- No allow force pushes
- No allow deletions

### `develop`
- Require PR aprobado
- RequireCI verde
- No allow force pushes

---

## Flujo de trabajo completo

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear feature branch
git checkout -b feature/auth-login

# 3. Desarrollar (commits frecuentes)
git add .
git commit -m "feat(auth): add login endpoint"

# 4. Push al remote
git push -u origin feature/auth-login

# 5. Crear PR en GitHub
# Usar template, asignar reviewer

# 6. Code review
# Feedback → commits adicionales si es necesario

# 7. Merge (squash)
# Se hace desde GitHub UI

# 8. Limpiar
git checkout develop
git pull origin develop
git branch -d feature/auth-login
```

---

*Última actualización: 2026-08-26*
