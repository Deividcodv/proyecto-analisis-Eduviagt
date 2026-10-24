# Sprint 5 Recreacion - Reportes, Auditoria, Asistente y Paneles

## Meta del Sprint

**Objetivo:** Entregar el bloque de **visibilidad y control** del admin sobre lo que dejo S4 (evaluacion):
reportes agregados con exportacion CSV, bitacora de auditoria, asistente IA con base de conocimiento
indexada, y el panel web de administracion con workbench por rol (US-34 a US-39, US-54, US-55 y US-56
adelantada). Es el sprint de mayor superficie del simulacro: 3 modulos nuevos de API y el primer
panel admin del sistema.

**Fecha de inicio:** 2026-09-28
**Fecha de fin:** 2026-10-02
**Duracion:** 5 dias

## Resultado Esperado

- [x] Agregados de solicitudes, convocatorias y evaluaciones para el admin (US-34)
- [x] Exportacion CSV de los 3 reportes con BOM UTF-8 para Excel (US-35)
- [x] Modulo de auditoria con `GET /audit` paginado y filtrable (US-36)
- [x] Asistente IA publico que responde desde la base de conocimiento (US-37)
- [x] `AsistenteIAProxy` con proveedor LLM opcional y degradacion a fallback (US-38)
- [x] Base de conocimiento indexada con `tsvector` + indice GIN y su seed (US-39)
- [x] Panel admin web: workbench por rol, paneles de solicitudes/comites/sesiones y matriz de roles (US-54/55)
- [x] Widget de chat del asistente montado en el layout web (US-56, adelantada de S6)

## Criterios de Aceptacion

- [x] `GET /reportes/solicitudes-por-estado`, `/reportes/convocatorias` y `/reportes/evaluaciones` responden
      solo a ADMIN con el permiso `reporte:ver`
- [x] `GET /reportes/:tipo/csv` devuelve `Content-Type: text/csv` con BOM al inicio del archivo (Excel lo
      respeta sin "assistanto de importacion") y el CSV **no** viene envuelto en `{ "data": ... }`
- [x] `GET /audit` devuelve la bitacora paginada (`page`/`limit`) y filtrable por
      `entidad`/`accion`/`usuarioId`/`desde`/`hasta`, y registra
      al menos los eventos del propio modulo (`GET /audit?accion=login` encuentra accesos)
- [x] `POST /asistente/preguntar` responde **sin autenticacion** desde la KB y devuelve `fuentes` no vacias;
      con pregunta vacia responde 400
- [x] Sin `AI_API_KEY` el asistente responde igual (fallback es el proveedor por defecto, tambien en CI)
- [x] El panel admin renderiza el workbench segun rol y las 4 pestañas (solicitudes, comites, sesiones, usuarios)
- [x] Verificacion por modulo: `git diff` VACIO contra `ab66393^1` (reportes, audit, asistente), `2e52a69`
      (ChatWidget) y `1436e41` (panel admin)
- [x] CI verde con los 3 bloques de smoke nuevos (`Sprint 5: reportes y CSV`, `Sprint 5: auditoria`,
      `Sprint 5: asistente IA sobre base de conocimiento`)

## Participantes

| Rol | Nombre |
|------|--------|
| Product Owner | David |
| Scrum Master | David (ademas: base, app.module, Prisma, seed, CI, .env) |
| Backend Reportes | Jose (US-34, US-35) |
| Backend Auditoria | Marcos (US-36) |
| Backend Asistente IA | Hamilton (US-37/38/39 + widget US-56) |
| Frontend Panel Admin | Yemerson (US-54, US-55) |

**No participa en S5:** Hector (su bloque, convocatorias, ya cerro en S2/S4).

> La tabla de arriba es el **reparto planificado**. La ejecucion real es de **un solo ejecutor
> (Marcos)** porque el resto del equipo esta por PTO. Ver "Rectificaciones" abajo y
> [`README-EJECUCION-S5.md`](README-EJECUCION-S5.md).

## Rectificaciones (post-auditoria)

Aplicadas el 2026-10-01 tras contrastar este documento contra `equipo/develop` del repo de trabajo.
Detalle y evidencia: [`AUDITORIA-S5.md`](AUDITORIA-S5.md).

1. **Ejecutor unico.** El sprint lo entrega Marcos. El reparto por persona (Jose, Hamilton, Yemerson)
   queda como registro historico; la secuencia de 8 commits esta en `README-EJECUCION-S5.md` §3.

2. **US-36 cambia de alcance.** `apps/api/src/audit/` ya venia completo e identico en `develop`, asi que
   no hay modulo que entregar. Lo que si es necesario: **instrumentar `auth/`** para que
   `GET /audit?accion=login` tenga algo que encontrar (accion `login` y `refresh`). Es el commit C1.

3. **La capa de datos va primero.** `.gitattributes`, la migracion `20260829061028_asistente_tsvector`,
   el `@@index([activo])`, el permiso `auditoria:ver` y las 33 entradas de la KB **no estan** en
   `develop`: viven en `equipo/feature/s5-datos` (PR #22). Sin ese merge, `GET /audit` da 403 a todos y
   el asistente responde "no encontre informacion". Es la **Fase 0** de la ejecucion.

4. **Los `[x]` de este documento significan "definido y acordado", no "entregado".** El estado de entrega
   vive en `README-EJECUCION-S5.md` y en el daily log; aca no se marca hasta que la PR este en verde.

5. **Criterio de auditoria mas exacto.** El criterio de `GET /audit?accion=login` se cumple con los 2
   logins que hace el propio smoke (admin + postulante) mas los que se generen en la demo, no con "5 o
   mas". La asercion `accion == "transicion"` **sale de S5**: requiere instrumentar `solicitudes/`, que
   es alcance de S6 (ya estaba listada como deuda, ahora tambien queda fuera del smoke).

6. **`app/layout.tsx` se edita a mano, no se copia.** La version de `1436e41` es el rediseño de S8
   (fuentes `Archivo`/`Space_Mono`/`Instrument_Sans` + `brut-body`): copiarla entera cambia el estilo de
   todo el portal. Solo se agrega el `import` del `ChatWidget` y su `<ChatWidget />` junto al `Footer`.

7. **Los tokens `brutal-*` no son deuda, son alcance de S8.** Los archivos de S5 los referencian 291
   veces y `develop` no los define, asi que el panel compila pero renderiza sin bordes ni paleta. Se
   acepta asi en S5.

## Notas

- **Alcance:** nada de la evaluacion de S4 se modifica, salvo el permiso que `ReportesModule` necesita
  (`reportes.service.ts` importa `EvaluacionesModule` de S4: es una dependencia de solo lectura).
- **US-56 adelantada:** el widget de chat viene de la etapa `2e52a69` del producto real, donde era US-56
  del sprint 7. En la simulacion se adelanta a S5 para que el asistente tenga cara visible en el demo.
- **Deuda que S5 deja explicitamente para S6** (documentada, no se resuelve aqui):
  1. Integracion dirigida de `AuditService` en los modulos de dominio (auth, convocatorias, solicitudes,
     evaluaciones, comites, sesiones, users) que en el producto real vivio en `16f724d`.
  2. Backend de la subtab Usuarios (`GET/POST/PATCH/DELETE /seguridad/usuarios`, `PATCH /auth/perfil` y la
     migracion `20260902024700_usuario_datos_perfil`): sin el, la subtab renderiza pero sus llamadas fallan.
  3. `app/page.tsx` que activa `HomeShell`: hasta S6 el workbench existe pero no se monta en la home.
  4. Contexto por rol del asistente (US-38): el controller no pasa `@CurrentUser()`, asi que el proxy
     siempre resuelve `rol: null`.
- **Lo que la simulacio dio por deuda y resulto no serlo** (verificado contra `develop` de
  `proyecto-analisis-Eduviagt`): `.env.example` ya trae las variables `AI_*`,
  `components/ui/InternalPageHeader.tsx` ya existe y `apps/api/src/audit/` ya venia completo, asi que
  Marcos no tiene PR que entregar en S5. Los tokens `brutal` de `tailwind.config.js` y `globals.css`
  no son deuda de S5: vienen de `1436e41`, que es el sprint 8, y `ab66393` no toca esos archivos.
- Cierre: S6 (05-16 oct) continua con el sistema interno completo, constancia PDF y estabilizacion.
