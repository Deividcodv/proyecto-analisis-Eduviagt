# Guía de José — Réplica de SIGEB-PROD en EDUVIAGT

> Documento **para José**. Explica, paso a paso, cómo replicar en
> `proyecto-analisis-Eduviagt` los cambios más recientes de `sigeb-prod`.
> **David solo revisa, aprueba y fusiona el Pull Request.**
>
> **Dónde está este documento:** vive en el repositorio de referencia
> (`sigeb-prod`), en `docs/06-jose-replica-sigeb-prod.md`. Cuando hagas el
> merge de la réplica, llegará también a EDUVIAGT por esa misma vía.
>
> Teoría de Git y GitHub: `docs/02-git-github-conceptos-basicos.md`.
> Flujo de PR paso a paso: `docs/04-pr-paso-a-paso-por-persona.md`.

---

## 0. Qué tienes que hacer, resumido

| | |
|---|---|
| **Qué** | Copiar el código, migraciones, pruebas y configuración de `sigeb-prod` a `proyecto-analisis-Eduviagt` |
| **Cómo** | Una rama `sync/...` y un único Pull Request a `develop` |
| **Quién aprueba** | David (tú solo abres el PR y respondes sus comentarios) |
| **Cómo se sabe que terminaste** | El PR está abierto y la CI está verde |

---

## 1. Estado actual de los dos repositorios (validado)

### Repositorio fuente

```text
https://github.com/Deividcodv/sigeb-prod
```

| Referencia | Commit | Qué trae |
|---|---|---|
| `develop` | `25083a1` | Merge del PR #1 con todo el trabajo reciente |
| `test/bug-hunt-revision` | `9513f97` | Corrección del despliegue de Next.js (aún en el PR #2) |

El commit `25083a1` contiene:

- Sprint 8 completo: montos flexibles, segunda aprobación por monto, bitácora y
  rol `JEFE_BECAS`.
- Cierre de la exposición de documentos: `/storage` ya no es público.
- Páginas de privacidad, términos y cookies.
- Accesibilidad WCAG 2.2 AA.
- Identidad de **Eduvi** como asistente.
- Perfil personalizable para todos los roles.
- Eliminación de cuenta con anonimización.
- Correcciones del CI y de las pruebas.

### Repositorio EDUVIAGT

```text
https://github.com/Deividcodv/proyecto-analisis-Eduviagt
```

| Referencia | Commit |
|---|---|
| `develop` | `6353830` |
| `main` | `1fc04a9` |

Los commits recientes de EDUVIAGT son **de documentación**. El código
funcional todavía **no** coincide con `sigeb-prod`: se comprobó archivo por
archivo que `schema.prisma`, `main.ts`, `solicitudes.service.ts` y
`asistente.ts` tienen contenidos distintos, y que archivos como
`legal.spec.ts` o `eliminar-cuenta.service.ts` **no existen**.

Ese es exactamente el trabajo de esta guía.

---

## 2. Preparar el clon

```bash
git clone https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git
cd proyecto-analisis-Eduviagt

# El repositorio fuente se agrega como remote de solo lectura
git remote add sigeb-prod https://github.com/Deividcodv/sigeb-prod.git
git fetch --all --prune
```

Comprobar que todo está en su sitio:

```bash
git remote -v
git log --oneline sigeb-prod/develop -5
git log --oneline origin/develop -5
```

> Si `git remote add` dice que el remote ya existe, no pasa nada: el fetch
> siguiente lo actualiza.

---

## 3. Crear el respaldo

Antes de tocar nada:

```bash
git checkout develop
git pull origin develop

git branch backup/pre-replica-sigeb-prod
git push origin backup/pre-replica-sigeb-prod
```

Con esa rama puedes volver atrás si algo sale mal:

```bash
git checkout develop
git reset --hard backup/pre-replica-sigeb-prod
```

---

## 4. Ordenar la documentación (antes de fusionar)

EDUVIAGT usa una carpeta `Docs/` con mayúscula; `sigeb-prod` usa `docs/`. En
Windows, tener las dos a la vez genera líos porque el sistema de archivos no
distingue correctamente entre mayúsculas.

```bash
git mv Docs docs/equipo
git add -A
git commit -m "docs: organizar documentacion especifica de EDUVIAGT"
```

Queda así:

```text
docs/
├── equipo/        ← documentación de EDUVIAGT (no se toca)
├── operations/
├── scrum/
├── standards/
├── pruebas/
└── README.md
```

> **Esta guía también se mueve.** Al terminar este paso, el archivo que estás
> leyendo pasa a estar en `docs/equipo/README-JOSE-REPLICA-SIGEB-PROD.md`. Si
> lo tenías abierto en un editor, la ruta cambia; el contenido no.

> Este commit va **antes** del merge, en la misma rama. Así, cuando la
> réplica traiga la carpeta `docs/` de `sigeb-prod`, no chocará con `Docs/`.
>
> El merge también trae esta guía a EDUVIAGT, en
> `docs/06-jose-replica-sigeb-prod.md`. Son dos copias de la misma guía en
> sitios distintos: esta (la del repositorio de referencia) y la que tú
> mueves a `docs/equipo/`. Si prefieres una sola, al terminar borra la que
> queda en `docs/06-jose-replica-sigeb-prod.md` y deja la tuya en
> `docs/equipo/`.

---

## 5. Crear la rama de réplica

```bash
git checkout -b sync/jose-replica-sigeb-prod
```

---

## 6. Fusionar SIGEB-PROD

Los dos repositorios tienen **historiales distintos**: no comparten ningún
commit ancestro. Por eso el merge necesita un parámetro explícito:

```bash
git merge --allow-unrelated-histories sigeb-prod/develop
```

> **No hagas cherry-pick de los 22 commits uno por uno.** Haría falta
> resolver los mismos conflictos 22 veces. Un único merge es equivalente y
> mucho más rápido.

---

## 7. Resolver los conflictos

### 7.1 El código debe quedar como en `sigeb-prod`

Estas rutas **siempre** ganan la versión de la fuente:

```text
apps/
prisma/
.github/
scripts/
package.json
package-lock.json
turbo.json
tsconfig.base.json
docker-compose.yml
docker-compose.prod.yml
.gitignore
```

Cuando el merge se detenga con conflictos, ejecuta:

```bash
git checkout --theirs -- apps prisma .github scripts
git checkout --theirs -- package.json package-lock.json
git checkout --theirs -- turbo.json tsconfig.base.json
git checkout --theirs -- docker-compose.yml docker-compose.prod.yml
git add -A
```

> `--theirs` significa "la versión del remoto que estás fusionando", es
> decir `sigeb-prod`. En un merge, *ours* es tu rama y *theirs* es la otra.

### 7.2 La documentación de EDUVIAGT se conserva

Estas **no** se tocan:

```text
docs/equipo/
CONTRIBUTING.md
SECURITY.md
LICENSE
```

Si aparece un conflicto dentro de `docs/equipo/`, se resuelve **a favor de
EDUVIAGT** (lo tuyo):

```bash
git checkout --ours -- docs/equipo
git add docs/equipo
```

### 7.3 Revisar que no quede nada a medias

```bash
git status
```

Debe mostrar que ya no hay archivos en conflicto (`Unmerged`). Si aparece
algún `both modified` o `added by both`, resuélvelo antes de seguir.

---

## 8. Comprobar que la réplica quedó bien

### 8.1 El código coincide con la fuente

```bash
git diff sigeb-prod/develop -- apps/api apps/web prisma
```

**Debe salir vacío.** Si sale algo, es que quedó código viejo: revisa la
sección 7.1.

### 8.2 Existen los archivos clave

```bash
git ls-files | grep -E 'eliminar-cuenta|solicitud-documento|asistente.ts|GestionDeCuenta|legal.spec|segunda-aprobacion.spec|deploy-pm2'
```

Deben aparecer:

```text
apps/api/src/auth/eliminar-cuenta.service.ts
apps/api/src/auth/dto/eliminar-cuenta.dto.ts
apps/api/src/solicitudes/solicitud-documento.service.ts
apps/web/src/lib/asistente.ts
apps/web/src/components/perfil/GestionDeCuenta.tsx
apps/web/e2e/legal.spec.ts
apps/web/e2e/segunda-aprobacion.spec.ts
scripts/deploy-pm2.sh
```

### 8.3 Las migraciones están completas

```bash
git ls-files apps/api/prisma/migrations | wc -l
```

Deben ser **11** migraciones.

---

## 9. Verificación local

```bash
npm ci
```

### API

```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npx tsc --noEmit
npm test
npm run lint
```

### Web

```bash
cd ../web
npx tsc --noEmit
npm run lint
npm run test:e2e
```

Resultados esperados:

| Comprobación | Resultado |
|---|---|
| `tsc --noEmit` (API) | 0 errores |
| `tsc --noEmit` (web) | 0 errores |
| `npm test` (API) | 261 pruebas en verde |
| `npm run test:e2e` (web) | 66 pruebas en verde |
| `npm run lint` | Sin errores |

> La E2E reinicia y siembra la base `sigeb_test`; **no toca** la base de
> desarrollo `sigeb`.

> La E2E necesita que los puertos 3000 y 3001 estén libres. Si tienes el
> proyecto levantado en desarrollo, páralo antes de correrla.

---

## 10. Crear el Pull Request

```bash
git status
git add -A
git commit -m "sync: replicar cambios recientes de SIGEB-PROD"
git push -u origin sync/jose-replica-sigeb-prod
```

Abrir el PR:

```bash
gh pr create \
  --base develop \
  --head sync/jose-replica-sigeb-prod \
  --title "sync: replicar cambios recientes de SIGEB-PROD" \
  --body "Replica de los cambios recientes de sigeb-prod: Sprint 8 (segunda aprobacion por monto, bitacora, montos flexibles), cierre de la exposicion de documentos, paginas de privacidad/terminos/cookies, accesibilidad WCAG 2.2 AA, identidad de Eduvi, eliminacion de cuenta con anonimizacion, y correcciones de CI y pruebas.

Verificacion: tsc 0/0 en API y web, 261 pruebas unitarias, 66 E2E."
```

---

## 11. El cambio de la VM a EDUVIAGT

Cuando David fusione tu PR, la VM debe dejar de actualizarse desde
`sigeb-prod` y pasar a hacerlo desde `proyecto-analisis-Eduviagt`.

El script `scripts/deploy-pm2.sh` ya trae el remoto parametrizado:

```bash
DEPLOY_REPO_URL="${DEPLOY_REPO_URL:-https://github.com/Deividcodv/sigeb-prod.git}"
```

Y una comprobación de seguridad: si el remoto de destino **no** tiene todavía
la réplica, el despliegue **se avisa y sale del repositorio de respaldo** en
lugar de publicar una versión antigua:

```bash
if ! tiene_la_version_actual "$RAMA"; then
  echo "AVISO: el remoto $DEPLOY_REPO_URL todavía no tiene $MARCA en la rama $RAMA." >&2
  echo "       Se despliega desde $DEPLOY_REPO_URL_FALLBACK hasta que la réplica esté lista." >&2
fi
```

### Estado actual de la variable

| Variable | Valor |
|---|---|
| `DEPLOY_REPO_URL` | `https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git` |
| `DEPLOY_REPO_URL_FALLBACK` | `https://github.com/Deividcodv/sigeb-prod.git` |

**La VM ya apunta a EDUVIAGT** y la variable ya está activa en GitHub. Eso
significa que, en cuanto tu PR esté fusionado, el siguiente despliegue tira
de EDUVIAGT **sin que nadie tenga que tocar nada**.

Hasta entonces, cada despliegue muestra este aviso y sale del respaldo:

```text
AVISO: el remoto https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git
       todavía no tiene apps/api/src/auth/eliminar-cuenta.service.ts en la rama develop.
       Se despliega desde https://github.com/Deividcodv/sigeb-prod.git hasta que la réplica esté lista.
```

En cuanto la réplica exista, ese aviso desaparece y el portal se actualiza
desde EDUVIAGT.

### Comprobación desde la VM

```bash
cd /home/davi/sigeb
git remote -v
git log --oneline -1
```

Y desde fuera:

```text
http://57.156.58.111:3001/
```

---

## 12. Reglas durante la réplica

| Prohibido | Por qué |
|---|---|
| `git push` directo a `develop` o `main` | Ramas protegidas: todo entra por PR |
| Cherry-pick de los commits uno por uno | Multiplica los conflictos sin ganancia |
| Versionar `.env`, claves SSH o secretos | Se filtran en el historial |
| Borrar `storage/` en la VM | Ahí están los documentos ya subidos |
| Aprobar tu propio PR | Aprobar es tarea de David |
| Cambiar `schema.prisma` sin revisar migraciones | Rompe `prisma migrate deploy` |
| Reemplazar la base de datos de la VM con una local | Se perderían los datos reales |

Si algo no cuadra, **pregunta a David antes de seguir**. Un PR a medias se
rechaza; un PR con una pregunta se resuelve en dos minutos.

---

## 13. Checklist "Mi PR está listo"

- [ ] Estoy en la rama `sync/jose-replica-sigeb-prod`.
- [ ] `git status` no muestra archivos en conflicto.
- [ ] `git diff sigeb-prod/develop -- apps/api apps/web prisma` sale **vacío**.
- [ ] Existen los 8 archivos clave listados en la sección 8.2.
- [ ] Hay 11 migraciones en `apps/api/prisma/migrations`.
- [ ] `tsc --noEmit` da 0 errores en API y web.
- [ ] `npm test` da 261 pruebas en verde.
- [ ] `npm run test:e2e` da 66 pruebas en verde.
- [ ] `npm run lint` sin errores.
- [ ] La CI del PR está completamente verde.
- [ ] El PR está abierto contra `develop`.
- [ ] Avisé a David por el canal del equipo.

---

## 14. Qué hace David después de tu PR

1. Revisa que el diff de `apps/`, `prisma/` y `scripts/` coincida con
   `sigeb-prod/develop`.
2. Comprueba que la CI esté verde.
3. Prueba localmente el flujo principal: entrar, ver el panel, abrir una
   convocatoria, revisar el chat de Eduvi.
4. Aprueba y hace **squash merge** a `develop`.
5. Verifica en la VM que el portal responde y que los recursos estáticos
   devuelven 200.

> La variable `DEPLOY_REPO_URL` ya está activa: no hace falta cambiar nada
> después del merge. El primer push a `develop` posterior al tuyo despliega
> desde EDUVIAGT y el aviso de «todavía no se ha hecho la réplica» desaparece.

---

*La referencia de código es siempre el estado actual de `sigeb-prod/develop`,
no un commit histórico.*
