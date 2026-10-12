# Troubleshooting — SIGEB

> Errores comunes y soluciones.

---

## Prisma

### Error: `P1001 - Can't reach database server`

**Causa:** PostgreSQL no está corriendo o la URL de conexión es incorrecta.

**Solución:**
```bash
# Verificar que Docker está corriendo
docker compose ps

# Reiniciar PostgreSQL
docker compose restart postgres

# Verificar la URL en .env
cat apps/api/.env | grep DATABASE_URL
```

---

### Error: `P2002 - Unique constraint failed on the fields: (cui)`

**Causa:** Intentar registrar un usuario con un CUI que ya existe.

**Solución:**
- Verificar que el CUI no esté en la DB
- Usar otro CUI para testing

---

### Error: `P2025 - Record to update not found`

**Causa:** Intentar actualizar un registro que no existe.

**Solución:**
- Verificar que el ID sea correcto
- Asegurar que el registro fue creado antes de actualizarlo

---

### Error: `npx prisma migrate dev` falla

**Causa:** Migraciones previas incompletas o DB en estado inconsistente.

**Solución:**
```bash
# Reset completo (ELIMINA todos los datos)
npx prisma migrate reset

# O eliminar la DB y recrear
docker compose down -v
docker compose up -d postgres
npx prisma migrate dev
```

---

## JWT / Autenticación

### Error: `401 - Invalid token`

**Causa:** Token expirado o mal formado.

**Solución:**
- Verificar que el token no esté expirado
- Verificar que el header sea `Authorization: Bearer <token>`
- Verificar que `JWT_SECRET` en `.env` coincida con la que se usó para generar el token

---

### Error: `401 - Token has expired`

**Causa:** Access token expirado (15 min por defecto).

**Solución:**
- Usar el refresh token para obtener un nuevo access token
- Implementar auto-refresh en el frontend

---

### Error: `403 - Forbidden`

**Causa:** Usuario autenticado pero sin permiso necesario.

**Solución:**
- Verificar los permisos del rol del usuario
- Verificar si hay excepciones de usuario que estén denegando
- Usar el Guard de permisos para debugging

---

## Docker

### Error: `port is already allocated`

**Causa:** Otro proceso está usando el puerto.

**Solución:**
```bash
# Encontrar el proceso
netstat -ano | findstr :5432
# Matar el proceso
taskkill /PID <pid> /F
# O cambiar el puerto en docker-compose.yml
```

---

### Error: `Cannot connect to the Docker daemon`

**Causa:** Docker Desktop no está corriendo.

**Solución:**
- Iniciar Docker Desktop
- Esperar a que esté listo (verificar con `docker info`)

---

### Error: `docker compose` no funciona

**Causa:** Versión antigura de Docker Compose.

**Solución:**
```bash
# Usar la sintaxis nueva
docker compose up -d

# O instalar docker-compose-plugin
sudo apt install docker-compose-plugin
```

---

## NestJS

### Error: `Cannot find module '@nestjs/...'`

**Causa:** Dependencias no instaladas.

**Solución:**
```bash
npm install
# O reinstalar todo
rm -rf node_modules
npm install
```

---

### Error: `Nest can't resolve dependencies of the providers`

**Causa:** Falta inyectar un proveedor en el módulo.

**Solución:**
- Verificar que el servicio esté en `providers` del módulo
- Verificar que el módulo esté en `imports` si se necesita exportar algo
- Usar `@Inject()` si es una interfaz abstracta

---

### Error: `Validation failed (etailed error below)`

**Causa:** DTO no pasa validación.

**Solución:**
- Verificar que el body de la request cumple el DTO
- Verificar que `whitelist: true` no esté eliminando campos necesarios
- Revisar los decoradores de class-validator

---

## Frontend (Next.js)

### Error: `Hydration mismatch`

**Causa:** Contenido diferente entre server y client.

**Solución:**
- No usar `Date.now()` o `Math.random()` directamente en el render
- Usar `useEffect` para valores que cambian entre server/client
- Usar `suppressHydrationWarning` si es intencional

---

### Error: `CORS error`

**Causa:** Frontend intenta llamar a la API desde un origen diferente.

**Solución:**
- Verificar que `CORS_ORIGIN` en el backend incluya el origen del frontend
- En desarrollo: `http://localhost:3001`
- En producción: `https://sigeb.gov.gt`

---

### Error: `404 - Not Found` en rutas

**Causa:** Ruta de Next.js mal configurada.

**Solución:**
- Verificar la estructura de carpetas en `app/`
- Verificar que el archivo se llame `page.tsx`
- Verificar que no haya conflictos de rutas

---

## Git

### Error: `fatal: refusing to merge unrelated histories`

**Causa:** Intentar merge de ramas sin relación.

**Solución:**
```bash
git merge --allow-unrelated-histories <branch>
```

---

### Error: `hint: Updates were rejected because the tip of your current branch is behind`

**Causa:** El branch remoto tiene commits que el local no tiene.

**Solución:**
```bash
git pull origin <branch> --rebase
```

---

### Error: `! [rejected] master -> master (fetch)`

**Causa:** Intentar push a branch protegido.

**Solución:**
- Crear un PR en lugar de push directo
- Nunca hacer push directo a `master`

---

## Error común no listado

Si encuentras un error no listado:

1. Buscar en los logs: `docker compose logs -f`
2. Buscar en GitHub Issues del proyecto
3. Preguntar en el canal de Slack del equipo
4. Documentar la solución en este archivo

---

*Última actualización: 2026-08-26*
