# Guía de inicio rápido

Cómo levantar SIGEB (API + web + base de datos) en tu máquina en pocos minutos.

## Prerrequisitos

- **Node.js** `>= 20` (el `package.json` exige `engines.node >= 20`).
- **npm** `10`.
- **Docker Desktop** en ejecución (para PostgreSQL).
- **PowerShell 7+** (`pwsh`), necesario para el arranque en un solo comando.

## 1. Instalar dependencias

Desde la raíz del repositorio:

```pwsh
npm install
```

Genera el cliente de Prisma (por si no se generó en la instalación):

```pwsh
npm run prisma:generate -w api
```

## 2. Configurar variables de entorno

Copia el ejemplo de la API:

```pwsh
Copy-Item apps/api/.env.example apps/api/.env
```

Si necesitas valores propios, edita `apps/api/.env` (por defecto ya apunta a `postgresql://sigeb:sigeb123@localhost:5432/sigeb`).

## 3. Arrancar

### Opción rápida (recomendada)

Un solo comando levanta PostgreSQL, aplica migraciones, ejecuta el seed y abre la API y la web en ventanas separadas:

```pwsh
npm run up
```

Para detener todo:

```pwsh
npm run up:stop
```

### Opción manual

En una terminal, levanta la base de datos:

```pwsh
docker compose up -d postgres
```

Aplica migraciones y seed:

```pwsh
npm run prisma:migrate -w api
npm run prisma:seed -w api
```

Arranca API y web (juntos o por separado):

```pwsh
npm run dev
# o bien, en terminales separadas:
npm run dev:api
npm run dev:web
```

## 4. Accesos

| Servicio | URL |
| --- | --- |
| Web | http://localhost:3001 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |

## 5. Credenciales demo

Todas usan la contraseña `Admin123!`.

| Rol | Correo |
| --- | --- |
| Administrador | `admin@sigeb.gov.gt` |
| Postulante | `postulante@demo.gt` |
| Evaluador | `evaluador@demo.gt` |
| Coordinador de comité | `coordinador@demo.gt` |
| Miembro de comité | `miembro@demo.gt` |
| Jefe de becas | `jefe@demo.gt` |

## Solución de problemas

- **Docker no está corriendo**: el arranque falla al iniciar PostgreSQL. Abre Docker Desktop y reintenta.
- **Puerto 3000 o 3001 ocupado**: `npm run up` reinicia los procesos previos; si persiste, ciérralos y reintenta.
- **Falta `apps/api/.env`**: la API no conecta a la base de datos. Repite el paso 2.
- **Prisma Client no encontrado**: ejecuta `npm run prisma:generate -w api`.
