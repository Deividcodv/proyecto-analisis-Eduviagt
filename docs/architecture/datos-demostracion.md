# Datos de demostración — SIGEB / EDUVIAGT v1.1

> Capa de semilla de datos de demostración en `apps/api/prisma/semilla/`. Documenta el catálogo canónico, los generadores, los conteos verificables y las reglas de desactivación.

## 1. Estructura

```
apps/api/prisma/
├── seed.ts                  # Seed principal: roles, permisos, catálogos, 33 docs de KB, usuarios demo
├── verificar-counts.ts      # Conteo rápido por tabla (script auxiliar)
└── semilla/
    ├── datos.ts             # Catálogo canónico + generadores de usuarios
    ├── escenarios.ts        # Generador principal: ciclos + 1000 solicitudes + evaluaciones + comités
    ├── ciclos.ts            # Modelo de ciclo de convocatoria (4 ciclos)
    └── verificar.ts         # Aserciones de integridad con exit code
```

**Encadenamiento:** `prisma db seed` → `seed.ts` → al final hace `await import('./semilla/escenarios')` y llama `generarEscenarios()` (`seed.ts:1432-1433`).

**Verificación:** `npx ts-node prisma/semilla/verificar.ts` — imprime conteos, compara con los esperados y hace `process.exit(1)` si algo falla. Es un gate de calidad de datos, no parte del seed.

## 2. Conteos reales (verificados en `verificar.ts` y `datos.ts`)

| Entidad | Cantidad | Fuente |
|---|---|---|
| Solicitudes | **1000** | `datos.ts:10` (`TOTAL_SOLICITUDES`) |
| Convocatorias | **51** | `datos.ts:27` (`TOTAL_CONVOCATORIAS`) |
| Postulantes | **250** | `datos.ts:30` |
| Evaluadores | **30** | `datos.ts:33` |
| Miembros de comité | **50** | `datos.ts:36` |
| Ciclos | **4** | `datos.ts:39` |
| Becas canónicas activas | **26** (3 base + 23 por nivel) | `datos.ts:678-695` |
| Documentos de la KB del asistente | **33** | `seed.ts` (33 entradas `titulo:`) |
| Roles | **7** | `seed.ts` |
| Usuarios totales | ~287+ | `verificar.ts:35` |
| Evaluaciones | ~2400 | `verificar.ts:36` |
| Sesiones | ~12-20 | `verificar.ts:37` |
| Votos | ~3600+ | `verificar.ts:38` |
| Decisiones | ~600 | `verificar.ts:39` |
| Aprobaciones (nivel 1/2) | ~360+ | `verificar.ts:40` |
| Historial de estados | ~4400+ | `verificar.ts:41` |
| Documentos de solicitud | ~4200+ | `verificar.ts:42` |

## 3. Composición de las 51 convocatorias

| Grupo | Cantidad | Descripción |
|---|---|---|
| ABIERTAS | 35 | **5 por cada uno de los 7 niveles** del catálogo |
| CERRADAS / históricas | 15 | Estados `CERRADA`, `EN_EVALUACION`, `RESUELTA`, `ARCHIVADA` |
| BORRADOR | 1 | La convocatoria base que crea `seed.ts` |

Reglas verificadas por `verificar.ts:138-173`:
- **0** sin `nivelAcademicoId`.
- **0** sin `cobertura`.
- **0** con `formulario` que no sea un arreglo (el campo se guarda como `CampoFormulario[]`).
- **≥4** en estado `RESUELTA` (requisito para los ciclos).
- Por nivel: exactamente **5 abiertas** y **≥2 cerradas**.

**Los ciclos históricos solo se asocian a convocatorias `RESUELTA`** (`escenarios.ts:123-130`), nunca a una abierta — si no, una convocatoria abierta recibiría solicitudes de ciclos ya cerrados.

## 4. Distribución de las 1000 solicitudes por estado

`datos.ts:12-21` (`DISTRIBUCION_ESTADOS`):

| Estado | Cantidad |
|---|---|
| BORRADOR | 100 |
| ENVIADA | 70 |
| EN_REVISION | 100 |
| CORRECCION | 30 |
| EVALUADA | 100 |
| PENDIENTE_SEGUNDA_APROBACION | 70 |
| APROBADA | 360 |
| RECHAZADA | 170 |
| **Total** | **1000** |

Los estados objetivo se barajan (`escenarios.ts:151`) antes de asignarse, para que las solicitudes no queden agrupadas por bloque.

### Historial de estados por estado final

`escenarios.ts:45-66` (`construirHistorial`) reconstruye el camino de transiciones que llevó a cada estado final, respetando la máquina de estados:

| Estado final | Historial generado |
|---|---|
| BORRADOR | BORRADOR |
| ENVIADA | BORRADOR → ENVIADA |
| EN_REVISION | BORRADOR → ENVIADA → EN_REVISION |
| CORRECCION | BORRADOR → ENVIADA → EN_REVISION → CORRECCION → ENVIADA → EN_REVISION |
| EVALUADA | BORRADOR → ENVIADA → EN_REVISION → EVALUADA |
| PENDIENTE_SEGUNDA_APROBACION | BORRADOR → ENVIADA → EN_REVISION → EVALUADA → PENDIENTE_SEGUNDA_APROBACION |
| APROBADA | BORRADOR → ENVIADA → EN_REVISION → EVALUADA → PENDIENTE_SEGUNDA_APROBACION → APROBADA |
| RECHAZADA | BORRADOR → ENVIADA → EN_REVISION → EVALUADA → RECHAZADA |

Las fechas del historial se interpolan entre la fecha de creación y el fin del ciclo (`escenarios.ts:68-95`).

## 5. Modelo de ciclos

`ciclos.ts:18-66` (`generarCiclos`) — **4 ciclos** de ~90 días con 30 días de brecha:

| Fase | Duración |
|---|---|
| Apertura → Cierre | 45 días |
| Cierre → Inicio de evaluación | 15 días |
| Evaluación | 30 días |
| Evaluación fin → Resultados | 20 días |

El ciclo más reciente termina **15 días antes de hoy**, de modo que todas las fechas quedan en pasado (el `verificar.ts:77-91` falla si hay solicitudes, sesiones o evaluaciones con fecha futura).

Cada ciclo expone: `indice`, `nombre` (`Ciclo N 2025/2026`), `convocatoriaId`, `apertura`, `cierre`, `evalInicio`, `evalFin`, `resultados`, `finalizado`, `duracionDias`.

`sincronizarConvocatoriaConCiclo` (`ciclos.ts:68`) propaga las fechas del ciclo a la convocatoria asociada.

## 6. Catálogo de becas canónicas

`datos.ts:45-53` (`BECAS_POR_NIVEL`) define **23 becas** con criterios de evaluación ponderados:

| Nivel | Becas |
|---|---|
| PRIMARIA | 3 |
| SECUNDARIA | 4 |
| DIVERSIFICADO | 4 |
| TECNICO | 3 |
| UNIVERSIDAD | 5 |
| BASICO | 2 |
| POSGRADO | 2 |
| **Total BECAS_POR_NIVEL** | **23** |

Cobertura: 13 COMPLETA · 11 PARCIAL (total 24, uno de los matches es el tipo).

Cada beca tiene: `id` (UUID fijo `00000000-0000-4000-8000-0000000000XX`), `nombre`, `descripcion`, `nivel` (clave del catálogo), `cobertura` (`COMPLETA` | `PARCIAL`), `montoBase` y `criterios[]` con `{nombre, peso}`.

### Regla de desactivación de becas legacy

`datos.ts:678-688`:

```typescript
const idsCanonicos = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  ...BECAS_POR_NIVEL.map((beca) => beca.id),
];
await prisma.beca.updateMany({
  where: { id: { notIn: idsCanonicos } },
  data: { activa: false },
});
```

Las 7 becas del `seed.ts` original (ids `...001` a `...007`) son datos legacy. Solo las 3 primeras (`001`, `002`, `003`) son canónicas; las otras 4 se desactivan junto con cualquier beca que no esté en el catálogo. Así el portal y el formulario de convocatorias nuevas solo ofrecen becas del catálogo.

**Total activas: 3 base + 23 por nivel = 26.**

## 7. Generadores de usuarios

`datos.ts:454-631`:

| Función | Genera |
|---|---|
| `crearPostulantes(cantidad, rolPostulante)` | 250 postulantes únicos |
| `crearEvaluadores(cantidad, rolEvaluador)` | 30 evaluadores |
| `crearMiembrosComite(cantidad, rolMiembro)` | 50 miembros de comité |
| `crearRolesEspeciales(rolCoordinador, rolJefeBecas, rolAdmin)` | 1 coordinador, 1 jefe de becas, 1 director (ADMIN) |

Helpers: `elegirUno(arr)` (aleatorio), `barajar(arr)` (Fisher-Yates para desagrupar estados), `fechaRelativa(dias, horas, minutos)`, `fechaAleatoriaEnRango(inicio, fin)`, `distribuirEnCiclos(total, ciclos)`.

## 8. Aserciones de `verificar.ts`

El script imprime y valida:

| Chequeo | Esperado |
|---|---|
| Conteo de convocatorias | 51 exacto |
| Conteo por estado de solicitud | coincide con `DISTRIBUCION_ESTADOS` |
| Sin nivel académico | 0 |
| Sin cobertura | 0 |
| Formularios que no son arreglo | 0 |
| Convocatorias RESUELTA | ≥4 |
| Por nivel | 5 abiertas + ≥2 cerradas en los 7 niveles |
| Solicitudes con `createdAt` futuro | 0 |
| Evaluaciones con `createdAt` futuro | 0 |
| Sesiones con fecha futura | ≤10 (pueden estar programadas) |

**Exit code:** `0` si todo pasa, `1` si falla.

## 9. Comandos

```bash
# Sembrar todo (seed principal + escenarios)
cd apps/api
npx prisma db seed

# Verificar integridad de los datos de demostración
npx ts-node prisma/semilla/verificar.ts

# Conteo rápido por tabla
npx ts-node prisma/verificar-counts.ts
```

> `verificar-counts.ts` es un script auxiliar de diagnóstico rápido. `verificar.ts` es el gate formal (con exit code).

## 10. Impacto en el portal público

La semilla define lo que el visitante ve:

- **51 convocatorias** en el listado público (`GET /api/convocatorias`), de las cuales 35 son postulables.
- El filtro por nivel académico, cobertura y beca del portal depende de que **todas** las convocatorias tengan `nivelAcademicoId` y `cobertura` asignados.
- Las **15 cerradas** populate el histórico visible con el filtro `estado=CERRADA`.
- `convocatoriaAbierta()` (web, `lib/api.ts`) decide el badge: una convocatoria `ABIERTA` con fecha de cierre vencida se muestra como `CERRADA`.

## 11. Referencias

- `apps/api/prisma/semilla/datos.ts`
- `apps/api/prisma/semilla/escenarios.ts`
- `apps/api/prisma/semilla/ciclos.ts`
- `apps/api/prisma/semilla/verificar.ts`
- `apps/api/prisma/verificar-counts.ts`
- `apps/api/prisma/seed.ts:1432-1433`
- `docs/architecture/ARQUITECTURA-REAL.md`
- `docs/architecture/api-web-contrato.md`