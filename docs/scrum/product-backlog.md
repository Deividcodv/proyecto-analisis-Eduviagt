# Product Backlog — EDUVIAGT

> Todas las historias de usuario del proyecto, priorizadas con MoSCoW y estimadas en Fibonacci.

---

## Resumen

| Métrica | Valor |
|---|---|
| Total historias | 50 |
| Total puntos | 233 |
| Sprints | 9 (2 semanas c/u) |
| Puntos promedio/sprint | ~24 |

---

## Sprint 0 — Setup (S0)

| ID | Historia |Pts | Prioridad | Asignado |
|---|---|---|---|---|
| US-01 | Como dev, quiero inicializar el monorepo con `package.json`, workspaces y scripts, para tener la estructura base del proyecto | 3 | Must | Todos |
| US-02 | Como dev, quiero crear Docker Compose con PostgreSQL, para tener la DB corriendo localmente | 2 | Must | Todos |
| US-03 | Como dev, quiero el schema Prisma completo con todas las entidades, para tener la DB modelada | 8 | Must | Marcos |
| US-04 | Como dev, quiero un seed data con catálogos base, roles y permisos, para poder testear desde el inicio | 2 | Must | Marcos |

**Sprint 0 total: 15 puntos**

---

## Sprint 1 — Auth y Seguridad (S1)

| ID | Historia | Pts | Prioridad | Asignado |
|---|---|---|---|---|
| US-05 | Como dev, quiero la estructura de módulos NestJS (`app.module.ts`, `main.ts`), para empezar a crear módulos de negocio | 3 | Must | Marcos |
| US-06 | Como postulante, quiero registrarme con CUI único y correo único, para crear mi cuenta | 5 | Must | Marcos |
| US-07 | Como usuario, quiero iniciar sesión con JWT (access + refresh tokens), para acceder al sistema | 5 | Must | Marcos |
| US-08 | Como usuario autenticado, quiero ver mi perfil, para confirmar mis datos | 2 | Must | Marcos |
| US-09 | Como dev, quiero un `common/` con guards globales, decoradores y filtros de excepción, para reutilizar en todos los módulos | 3 | Must | Marcos |
| US-10 | Como admin, quiero gestionar roles (CRUD) y asignar permisos a roles, para controlar quién puede hacer qué | 5 | Must | Marcos |

**Sprint 1 total: 23 puntos**

---

## Sprint 2 — Convocatorias y Catálogos (S2)

| ID | Historia | Pts | Prioridad | Asignado |
|---|---|---|---|---|
| US-11 | Como dev, quiero un `common/` con el Guard de permisos (Chain of Responsibility), para resolver permisos por rol + excepciones de usuario | 5 | Must | Marcos |
| US-12 | Como visitante, quiero ver los catálogos (géneros, niveles, departamentos, municipios), para llenar formularios | 3 | Must | Héctor |
| US-13 | Como visitante, quiero que los catálogos tengan opción "otro", para poder escribir un valor no listado | 3 | Must | Héctor |
| US-14 | Como admin, quiero crear y editar convocatorias con información básica, para publicar becas | 5 | Must | Héctor |
| US-15 | Como admin, quiero que las convocatorias tengan máquina de estados (BORRADOR → ABIERTA → CERRADA → EN_EVALUACION → RESUELTA → ARCHIVADA), para controlar el ciclo de vida | 5 | Must | Héctor |
| US-16 | Como admin, quiero configurar documentos requeridos por convocatoria, para definir qué debe cargar el postulante | 3 | Must | Héctor |
| US-17 | Como dev, quiero un `DocumentStorage` adapter con implementación filesystem, para desacoplar el almacenamiento de la lógica de negocio | 3 | Must | Héctor |

**Sprint 2 total: 27 puntos**

---

## Sprint 3 — Solicitudes (S3)

| ID | Historia | Pts | Prioridad | Asignado |
|---|---|---|---|---|
| US-18 | Como postulante, quiero crear una solicitud en BORRADOR para una convocatoria abierta, para empezar mi postulación | 5 | Must | José |
| US-19 | Como postulante, quiero llenar mi perfil académico con validación de catálogos + opción "otro", para completar mi información | 3 | Must | José |
| US-20 | Como postulante, quiero llenar mi perfil financiero, para completar mi información socioeconómica | 3 | Must | José |
| US-21 | Como postulante, quiero subir documentos con validación de MIME y tamaño, para adjuntar requisitos | 5 | Must | José |
| US-22 | Como postulante, quiero quitar o reemplazar documentos antes de enviar, para corregir errores | 3 | Must | José |
| US-23 | Como postulante, quiero ver un checklist de documentos faltantes, para saber qué me falta antes de enviar | 3 | Must | José |
| US-24 | Como postulante, quiero enviar mi solicitud validando que todos los documentos obligatorios estén cargados, para que sea evaluada | 5 | Must | José |
| US-25 | Como dev, quiero que la solicitud tenga máquina de estados (BORRADOR → ENVIADA → EN_REVISION → CORRECCION/EVALUADA → APROBADA/RECHAZADA), para controlar el ciclo | 5 | Must | José |

**Sprint 3 total: 32 puntos**

---

## Sprint 4 — Evaluaciones y Comités (S4)

| ID | Historia | Pts | Prioridad | Asignado |
|---|---|---|---|---|
| US-26 | Como evaluador, quiero ver las solicitudes asignadas, para saber qué evaluar | 3 | Must | José |
| US-27 | Como admin, quiero asignar evaluadores a una solicitud en EN_REVISION, para que sea revisada | 3 | Must | José |
| US-28 | Como evaluador, quiero puntuar solicitudes por criterio con pesos, para contribuir a la decisión | 5 | Must | José |
| US-29 | Como dev, quiero que al completar todas las evaluaciones se calcule el score ponderado automáticamente, para tener el resultado | 3 | Must | José |
| US-30 | Como coordinador, quiero gestionar comités (CRUD de miembros), para organizar las sesiones | 3 | Must | José |
| US-31 | Como coordinador, quiero crear sesiones con agenda de solicitudes EVALUADA, para planificar la reunión | 3 | Must | José |
| US-32 | Como miembro de comité, quiero votar una sola vez por solicitud en una sesión, para表达 mi decisión | 3 | Must | José |
| US-33 | Como coordinador, quiero finalizar una sesión validando quórum y generando decisiones, para cerrar el proceso | 5 | Must | José |

**Sprint 4 total: 28 puntos**

---

## Sprint 5 — Reportes, IA y Frontend Base (S5)

| ID | Historia | Pts | Prioridad | Asignado |
|---|---|---|---|---|
| US-34 | Como admin, quiero ver reportes de resumen (solicitudes por estado, convocatorias, evaluaciones), para tener visibilidad | 5 | Should | José |
| US-35 | Como admin, quiero exportar reportes a CSV, para analizar en Excel | 3 | Should | José |
| US-36 | Como dev, quiero un interceptor de AuditLog que registre acciones sensibles, para trazabilidad | 3 | Must | Marcos |
| US-37 | Como visitante, quiero preguntar al asistente IA y recibir respuestas acotadas, para obtener información sin cuenta | 5 | Should | Hamilton |
| US-38 | Como dev, quiero un `AsistenteIAProxy` que resuelva contexto según sesión y rol, para controlar qué puede ver la IA | 5 | Should | Hamilton |
| US-39 | Como dev, quiero una base de conocimiento indexada con `tsvector`, para que el asistente busque respuestas | 3 | Should | Hamilton |
| US-40 | Como dev, quiero el Layout base + Design System + Tailwind + paleta de colores, para empezar el frontend | 5 | Must | Yemerson |

**Sprint 5 total: 29 puntos**

---

## Sprint 6 — Portal Público (S6)

| ID | Historia | Pts | Prioridad | Asignado |
|---|---|---|---|---|
| US-41 | Como visitante, quiero ver el Hero con "Oportunidades que transforman vidas" + CTAs, para entender el propósito de EDUVIAGT | 3 | Must | Yemerson |
| US-42 | Como visitante, quiero ver la sección "Sobre EDUVIAGT" con misión, visión, objetivos, para conocer el sistema | 3 | Must | Yemerson |
| US-43 | Como visitante, quiero ver "Cómo funciona" con los 6 pasos (Registrarse → Postularse → Documentar → Evaluación → Comité → Resultado), para entender el proceso | 3 | Must | Yemerson |
| US-44 | Como visitante, quiero ver las convocatorias abiertas con filtros (nivel, departamento, tipo, estado), para encontrar becas relevantes | 5 | Must | Yemerson |
| US-45 | Como visitante, quiero ver la página individual de una convocatoria con información, requisitos y botón "Postularme", para decidir si aplico | 3 | Must | Yemerson |
| US-46 | Como visitante, quiero consultar el estado de mi beca con un número de solicitud, para saber dónde está sin cuenta | 3 | Should | Yemerson |
| US-47 | Como visitante, quiero ver la página "Nosotros" con misión, visión, programas, transparencia y contacto, para conocer al MINEDUC | 3 | Must | Yemerson |
| US-48 | Como visitante, quiero ver un footer institucional con links organizados, para navegar fácilmente | 2 | Must | Yemerson |

**Sprint 6 total: 25 puntos**

---

## Sprint 7 — Sistema Interno (S7)

| ID | Historia | Pts | Prioridad | Asignado |
|---|---|---|---|---|
| US-49 | Como usuario, quiero un formulario de Login + Registro en el frontend con React Hook Form + Zod, para autenticarme | 5 | Must | Hamilton |
| US-50 | Como postulante, quiero un dashboard con mis solicitudes y su estado, para ver el seguimiento | 5 | Must | Hamilton |
| US-51 | Como postulante, quiero un formulario multi-step para crear mi solicitud, para llenar paso a paso | 8 | Must | Hamilton |
| US-52 | Como postulante, quiero subir, quitar y reemplazar documentos desde el frontend, para gestionar mis archivos | 5 | Must | Hamilton |
| US-53 | Como evaluador, quiero ver mis evaluaciones asignadas y puntuar desde el frontend, para evaluar cómodamente | 5 | Should | Yemerson |
| US-54 | Como admin, quiero un panel de administración de convocatorias desde el frontend, para gestionar becas | 5 | Should | Yemerson |
| US-55 | Como admin, quiero un panel de administración de seguridad (roles, permisos, excepciones) desde el frontend, para configurar el sistema | 5 | Should | Yemerson |
| US-56 | Como usuario autenticado, quiero un widget de chat con el asistente IA, para preguntar con contexto de mi sesión | 3 | Could | Hamilton |
| US-57 | Como dev, quiero que el frontend sea responsive desde el inicio (desktop → tablet → mobile), para que funcione en cualquier dispositivo | 3 | Must | Yemerson |
| US-58 | Como dev, quiero que el portal público y el sistema admin tengan identidad visual distinta pero compartan el Design System, para mantener coherencia | 3 | Must | Yemerson |

**Sprint 7 total: 47 puntos** (priorizar Must en el planning)

---

## Sprint 8 — Constancias PDF, CI/CD, Matriz de seguridad y Rediseño (S8)

| ID | Historia | Pts | Prioridad | Asignado |
|---|---|---|---|---|
| US-F7 | Como usuario, quiero descargar la constancia de mi beca en PDF cuando la solicitud esté APROBADA, para tener un documento oficial | 5 | Must | David |
| CI/CD | Como dev, quiero construir las imágenes Docker del API y la web y desplegar por SSH a staging/producción, para operar el sistema | 3 | Must | David |
| US-S8-1 | Como admin, quiero crear usuarios/empleados desde el listado y asignarles rol, para gestionar el personal | 5 | Must | David |
| US-S8-2 | Como admin, quiero asignar excepciones de permisos por usuario (heredar/PERMITIR/DENEGAR), para una matriz de seguridad fina | 5 | Must | David |
| US-S8-3 | Como usuario, quiero una experiencia brutalista/maximalista consistente en toda la plataforma, para una identidad diferenciada | 8 | Must | David |
| US-S8-4 | Como usuario logueado, quiero ver en la portada el panel de acciones de mi rol (workbench) y que la navegación se adapte a mi sesión, para trabajar desde mi espacio | 5 | Must | David |
| US-S8-5 | Como postulante, quiero un "Mis datos" editable (teléfono, género, nacimiento, departamento/municipio, dirección), para mantener mi información al día | 5 | Must | David |

**Sprint 8 total: 36 puntos**

---

## Sprint 8 — Segunda Aprobación, Montos Flexibles, Bitácora y Eliminación de Cuenta (S8)

| ID | Historia | Pts | Prioridad | Asignado |
|---|---|---|---|---|
| US-801 | Como admin, quiero configurar montos flexibles por tramos de ingreso familiar (FIJO/PORCENTAJE/COMPLETO), para calcular el monto otorgable automáticamente | 5 | Must | Backend |
| US-802 | Como admin, quiero que las solicitudes con monto > Q10,000 requieran segunda aprobación por otra persona, para separar la autoridad | 5 | Must | Backend |
| US-803 | Como sistema, quiero registrar cada firma de aprobación en `SolicitudAprobacion`, para trazabilidad completa | 3 | Must | Backend |
| US-804 | Como usuario, quiero que el sonido de notificaciones sea configurable (activar/desactivar/volumen), para controlar mi experiencia | 3 | Should | Fullstack |
| US-805 | Como admin, quiero una bitácora inmutable del sistema que registre quién, cuándo, qué y con qué resultado, para auditoría | 5 | Must | Backend |
| US-806 | Como usuario, quiero eliminar mi cuenta con anonimización de datos personales, para ejercer mi derecho al olvido | 5 | Must | Backend |
| US-807 | Como visitante, quiero acceder a páginas de privacidad, términos y cookies, para conocer las políticas del sistema | 2 | Should | Frontend |
| US-808 | Como usuario, quiero que la plataforma sea accesible (WCAG 2.2 AA), para usarla con tecnologías asistivas | 5 | Must | Frontend |
| US-809 | Como usuario, quiero que el asistente se llame Eduvi con identidad propia, para reconocerlo fácilmente | 2 | Should | Frontend |
| US-810 | Como admin, quiero que todos los roles tengan acceso a su perfil, para gestionar sus preferencias | 2 | Should | Frontend |

**Sprint 8 total: 37 puntos**

---

## Backlog Futuro (Won't — esta versión)

| ID | Historia | Prioridad |
|---|---|---|
| US-F1 | Pagos y conciliación bancaria | Won't |
| US-F2 | Contratos y formalización | Won't |
| US-F3 | Renovaciones de beca | Won't |
| US-F4 | Lista de espera | Won't |
| US-F5 | Autenticación de dos factores (2FA) | Won't |
| US-F6 | Almacenamiento en la nube (S3/Azure) | Won't |
| US-F8 | Múltiples idiomas (i18n) | Won't |
| US-F9 | Búsqueda vectorial (RAG) | Won't |
| US-F10 | App móvil nativa | Won't |

---

## Resumen por sprint

| Sprint | Puntos | Must | Should | Could |
|---|---|---|---|---|
| S0 Setup | 15 | 15 | 0 | 0 |
| S1 Auth | 23 | 23 | 0 | 0 |
| S2 Convocatorias | 27 | 27 | 0 | 0 |
| S3 Solicitudes | 32 | 32 | 0 | 0 |
| S4 Evaluaciones | 28 | 28 | 0 | 0 |
| S5 Reportes+IA | 29 | 13 | 16 | 0 |
| S6 Portal público | 25 | 22 | 3 | 0 |
| S7 Sistema interno | 47 | 37 | 10 | 3 |
| S8 PDF + CI/CD | 8 | 5 | 0 | 0 |
| S8 Segunda Aprobación + Bitácora | 37 | 32 | 5 | 0 |
| **Total** | **271** | **234** | **34** | **3** |

---

*Última actualización: Sprint 8 (2026-10-23)*
