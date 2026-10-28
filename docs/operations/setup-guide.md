# Guía de Setup — EDUVIAGT

> Cómo levantar el proyecto desde cero.

---

## Prerrequisitos

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Docker | 24+ | `docker -v` |
| Docker Compose | 2.20+ | `docker compose version` |
| Git | 2.40+ | `git -v` |

### VS Code (recomendado)

Extensiones:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- ESLint
- Docker

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/<org>/EDUVIAGT-v1.1.git
cd EDUVIAGT-v1.1
```

---

## 2. Instalar dependencias

```bash
npm install
```

---

## 3. Levantar PostgreSQL

```bash
docker compose up -d postgres
```

Verificar que está corriendo:

```bash
docker compose ps
```

---

## 4. Configurar variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
```

Editar `apps/api/.env`:

```env
DATABASE_URL=postgresql://EDUVIAGT:EDUVIAGT123@localhost:5432/EDUVIAGT
JWT_SECRET=tu-secreto-aqui
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
STORAGE_PATH=./storage
PORT=3000
```

---

## 5. Ejecutar migraciones

```bash
cd apps/api
npx prisma migrate dev
```

---

## 6. Seed data

```bash
npx prisma db seed
```

Esto crea:
- 7 roles (ADMIN, POSTULANTE, EVALUADOR, COORDINADOR_COMITE, MIEMBRO_COMITE, STAFF, JEFE_BECAS)
- Catálogos, 33 documentos de la base de conocimiento del asistente
- 24 becas canónicas activas (3 base + 23 por nivel − 2 colisiones de ID) y 4 legacy desactivadas
- 51 convocatorias (35 abiertas = 5 por nivel × 7 niveles, 15 cerradas, 1 borrador)
- 1000 solicitudes demo repartidas en 8 estados, 4 ciclos, 250 postulantes, 30 evaluadores, 50 miembros de comité
- Capa `apps/api/prisma/semilla/` (datos.ts, escenarios.ts, ciclos.ts, verificar.ts) + `verificar-counts.ts`
- Verificación: `npx ts-node prisma/semilla/verificar.ts` (exit 0 si todo pasa)
- Permisos por módulo:acción
- Catálogos (géneros, niveles académicos, departamentos, municipios de Guatemala)
- Usuario admin por defecto

---

## 7. Iniciar desarrollo

En terminales separadas:

```bash
# Terminal 1: Backend
cd apps/api
npm run start:dev

# Terminal 2: Frontend
cd apps/web
npm run dev
```

---

## 8. Verificar

| Servicio | URL |
|---|---|
| Backend API | http://localhost:3000 |
| Frontend | http://localhost:3001 |
| Swagger (si se configura) | http://localhost:3000/api/docs |

---

## Comandos útiles

```bash
# Prisma Studio (GUI para ver la DB)
cd apps/api
npx prisma studio

# Reset completo de la DB
npx prisma migrate reset

# Generar Prisma Client
npx prisma generate

# Correr tests
npm run test

# Lint
npm run lint
```

---

## Estructura después del setup

```
EDUVIAGT-v1.1/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── .env
│   │   └── package.json
│   └── web/
│       ├── src/
│       └── package.json
├── docs/
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Solución de problemas comunes

### Puerto ya en uso
```bash
# Encontrar proceso en el puerto
netstat -ano | findstr :5432
# Matar el proceso
taskkill /PID <pid> /F
```

### Docker no inicia
```bash
# Verificar Docker Desktop esté corriendo
docker info
```

### Errores de Prisma
```bash
# Regenerar client
npx prisma generate
# Reset completo
npx prisma migrate reset
```

---

*Última actualización: 2026-08-26*
