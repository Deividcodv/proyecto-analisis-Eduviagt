# Sprint 2 Recreacion - Review

## Resumen del Sprint

**Fecha de review:** 2026-09-11 (margen sabado 12)
**Participantes:** Yemerson (Developer), Hector (Developer), Jose (Developer), David (Scrum Master / Reviewer)

## Lo que se completo

- [x] US-40 - Layout base y Design System + home conectada al API
- [x] US-41 - Hero atractivo
- [x] US-42 - Pagina "Sobre SIGEB"
- [x] US-43 - Pagina "Como funciona"
- [x] US-44 - Convocatorias publicas con filtro de busqueda (API + web)
- [x] US-45 - Detalle de convocatoria publica (API + web)
- [x] US-46 - Consulta de beca por codigo (endpoint publico + pagina)
- [x] US-47 - Pagina "Nosotros"
- [x] US-48 - Footer completo

## Lo que NO se completo

- [x] Nada pendiente dentro del alcance del prototipo

## Demo

**Funcionalidades demostradas:**
1. Home con hero y navegacion publica
2. Listado de convocatorias con filtro por texto (datos reales de la API)
3. Detalle de una convocatoria
4. Consulta de beca por codigo (pantalla y respuesta acotada)
5. Paginas "Sobre SIGEB", "Como funciona", "Nosotros" y Footer

**Feedback del Product Owner (David):**
- Portal publico funcional con datos reales. Faltan pulidos visuales menores que se pueden absorber en S3 (responsive, empty states) sin puntos extra.

## Metricas

| Metrica | Valor |
|---------|-------|
| Puntos planificados | 40 |
| Puntos completados | 40 |
| Velocidad | 40 |
| Historias completadas | 9/9 |

## Decisiones tomadas

1. Consulta de beca (US-46) queda funcional; el envio de solicitudes nuevos se completa en S6
   (sistema interno), pero la receta se integra con el endpoint publico.
2. Los endpoints publicos se congelan por modulo contra `986fc89`; pulidos de UI se priorizan igual que el login en S3.
3. El seed de demo (catalogos + 1 convocatoria activa + 1 solicitud de ejemplo) queda versionado como `chore:` para reproducir la demo en cualquier maquina.

## Acciones para el siguiente sprint

1. S3 (login/registro + dashboard): Hamilton (auth web, US-49/50), Marcos (ajustes auth web), Yemerson (UserMenu/integracion), David (script npm dev, CORS).
2. Crear el tag `v0.1-prototipo-demo` al cierre del S3.
3. Preparar guion del demo ≈ 16 sep: portal -> login -> dashboard postulante.