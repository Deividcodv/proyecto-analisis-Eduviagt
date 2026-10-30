# Política de Trabajo en Grupo

> **Proyecto:** EDUVIAGT — Sistema Integral de Gestión de Becas
> **Curso:** 0910-037 · Análisis de Sistemas II · 8.º Ciclo
> **Fecha de creación:** 2026-08-24
> **Fecha de última revisión:** 2026-10-28
> **Versión:** 1.1
> **Base:** Anexo 3 del documento del proyecto final

---

## 1. Información del equipo y del proyecto

| Campo | Valor |
|---|---|
| **Nombre del proyecto** | EDUVIAGT — Plataforma Nacional para la Gestión Integral de Becas |
| **Nombre del equipo** | EDUVIAGT (SIGEB v1.1) |
| **Curso** | 0910-037 · Análisis de Sistemas II · 8.º Ciclo |
| **Integrantes** | 6 (ver [Acta de Constitución](01-acta-constitucion-equipo.md) §2) |
| **Duración** | 9 sprints de 2 semanas (agosto 2026 – enero 2027) |

### Integrantes, roles y firma

| Nombre completo | Rol en el proyecto | Firma |
|---|---|---|
| Chiroy Vásquez, Luis David | Scrum Master · Product Owner (simulado) · Tech Lead | __________________ |
| Lemus Meléndrez, Marcos Estuardo | Developer — Backend: seguridad y autenticación | __________________ |
| Hernández González, Héctor Enrique | Developer — Backend: convocatorias y catálogos | __________________ |
| Hernández García, José Manuel | Developer — Backend: solicitudes, evaluaciones y comités | __________________ |
| Par Guerra, Yermerson Geovanny | Developer — Frontend: portal público y panel administrativo | __________________ |
| Guzmán Hernández, Hamilton Estuardo | Developer — Frontend: sistema interno y asistente IA | __________________ |

---

## 2. Misión y objetivos del equipo

### 2.1 Nuestra misión

> Construir un producto de software institucional de calidad profesional — EDUVIAGT — aplicando prácticas
> reales de ingeniería de software (SOLID, patrones de diseño, arquitectura, pruebas automatizadas y control
> de versiones), en un ambiente de colaboración, respeto y transparencia, para digitalizar la gestión de
> becas del Ministerio de Educación y dejar una base técnica sólida, documentada y transferible.

### 2.2 Objetivos clave del equipo

1. **Entregar un incremento funcional y verificable en cada Sprint**, nunca un sprint "a medias".
2. **Documentar cada decisión técnica** (arquitectura, patrones, SOLID, ADRs) con evidencia en el código,
   para que el proyecto sea auditable por un tercero y no dependa del conocimiento informal del equipo.
3. **Cero trabajo directo sobre `main`/`master`**: todo entra por Pull Request con code review de al menos
   un par.
4. **Fortalecer habilidades de arquitectura de software y Scrum**, aplicando en un proyecto real lo que se
   estudia en el curso en lugar de acumular teoria sin aplicación.
5. **Adoptar una postura de evidencia**: si algo no está implementado o verificado, se declara como tal.
6. **Mantener comunicación fluida, honesta y oportuna**, sin dejar bloqueos sin escalar.

---

## 3. Ética, respeto y responsabilidad

### 3.1 Respeto mutuo

Valoramos y respetamos las opiniones, ideas y diversidad de cada miembro. No se tolerará ningún tipo de
lenguaje ofensivo, discriminatorio o despectivo. **La crítica siempre será constructiva, enfocada en el
trabajo y no en la persona.**

- En el code review se comenta **el código, no el código de la persona**. Formato: *"¿Qué pasa si…?"*, *"Podría
  ser más claro si…"*.
- Ningún comentario debe humillar, sarcásticamente vinyl ni personal. El Scrum Master interviene si aparece.
- Las decisiones técnicas se arguyen con evidencia (benchmarks, pruebas, complejidad), no con autoridad de puesto.

### 3.2 Responsabilidad individual

Cada miembro es responsable de las tareas que le son asignadas y se compromete a completarlas con la calidad
y en los plazos acordados.

- Si un miembro prevé dificultades para cumplir, **tiene la responsabilidad de comunicarlo al equipo de
  manera proactiva y lo antes posible**, con un plan de mitigación propuesto.
- "No me di cuenta" no es justificación para un incumplimiento; las decisiones se toman en el daily, en el
  refinamiento o en el PR.
- La responsabilidad es **por el resultado del sprint, no por la tarea individual**: si una tarea se retrasa,
  el equipo absorbe el impacto redistribuyendo esfuerzo.

### 3.3 Propiedad intelectual

- Todo el trabajo realizado es original o da crédito adecuado a las fuentes utilizadas.
- Se respetan las normas académicas sobre plagio. **No se reutiliza código de terceros sin atribución y sin
  licencia compatible**, y no se copiará código de otros equipos del curso.
- El uso de herramientas de IA generativa se limita a apoyo de andamiaje; todo código generado se revisa,
  se prueba y se reescribe bajo el estilo del proyecto antes de integrarse.
- Los datos personales de los usuarios demo son ficticios y no se comparten fuera del equipo.

### 3.4 Compromiso con la calidad

- Todo trabajo se revisa entre compañeros: **code reviews obligatorias** antes de integrar a `develop` y
  revisión cruzada de documentos clave (visión, arquitectura, patrones, manuales).
- El equipo está abierto a recibir feedback del docente y del Product Owner en cualquier momento del sprint,
  no solo en el Review.
- Se prioriza la **calidad del diseño** sobre la cantidad de historias cerradas.

---

## 4. Participación equitativa garantizada

Entendemos que "equitativo" no siempre significa "igual". La carga de trabajo puede variar según las
fortalezas de cada uno, pero el **esfuerzo y el compromiso** deben ser equitativos.

### 4.1 Asignación de tareas

- Las tareas se asignan durante la Sprint Planning, buscando balance entre habilidades existentes,
  oportunidades de aprendizaje y capacidad de cada miembro.
- Las decisiones de asignación se toman **por consenso**; si no hay consenso en el plazo del Planning, decide
  el Scrum Master y se registra en la minuta.
- Se evita la concentración de conocimiento: **ningún módulo debe depender de una sola persona**. Los
  módulos críticos (auth, solicitudes, convocatorias) se transfieren mediante code review y al menos una
  sesión de transferencia antes de finalizar el sprint que los entrega.

### 4.2 Transparencia

- El progreso de todas las tareas es visible para todo el equipo mediante el **tablero Scrum en GitHub
  Projects** y, en detalle, en el `backlog.md` de cada sprint.
- El estado de "hecho" solo se reconoce con el DoD completo; el tablero no se usa para inflar avance.
- Los bloqueos se marcan en el tablero el mismo día en que aparecen.

### 4.3 Reuniones

- La asistencia a todas las ceremonias Scrum (Planning, Daily, Review, Retrospective) es **obligatoria**.
- Se espera que todos los miembros participen activamente, aportando ideas y escuchando a los demás.
- Quien no pueda asistir avisa **con al menos 2 horas de anticipación** y lee la minuta publicada.
- Las dailies se limitan a 15 minutos y son de pie (en línea); las ceremonias de sprint no se postergan:
  se resuelve primero.

### 4.4 Medición del esfuerzo

- Utilizamos **Puntos de Historia (escala Fibonacci)** para estimar y dar seguimiento al esfuerzo.
- Las historias se estiman de forma comparativa (una contra otra), no en horas absolutas, para evitar el
  falso rigor del método de horas.
- El volumen se registra por sprint en el `backlog.md` y se compara con la capacidad observada en la
  retrospectiva para calibrar la velocidad del equipo.

### 4.5 Criterios de asignación de responsabilidades específicas

| Dominio | Responsable primario | Responsable secundario (transferencia) |
|---|---|---|
| Autenticación y seguridad | Marcos | David |
| Convocatorias y catálogos | Héctor | José |
| Solicitudes, evaluaciones y comités | José | Marcos |
| Portal público y diseño | Yemerson | Hamilton |
| Sistema interno y asistente IA | Hamilton | Yemerson |
| Arquitectura, CI/CD y despliegue | David | Todo el equipo |

---

## 5. Proceso de resolución de conflictos

Los desacuerdos son naturales en un equipo. Nos comprometemos a abordarlos de manera constructiva y
profesional siguiendo este proceso escalonado. **Cada paso deja evidencia escrita** (mensaje, minuta o issue).

### Paso 1 — Conversación directa y privada

- **Acción:** si un miembro tiene un problema con otro, ambos sostienen una conversación privada, honesta y
  respetuosa para intentar resolver el asunto directamente.
- **Objetivo:** entender la perspectiva del otro y buscar una solución mutua.
- **Registro:** opcional; si el acuerdo es importante, se anota en el issue o en el PR.

### Paso 2 — Mediación interna

- **Acción:** si la conversación directa no resuelve el problema, o si las partes no se sienten cómodas
  hablando solas, pueden solicitar la ayuda de un tercer miembro (preferiblemente el Scrum Master o alguien
  percibido como neutral) para que actúe como mediador.
- **El mediador no toma partido**, sino que facilita la comunicación para que las partes lleguen a un acuerdo.
- **Registro:** minuta breve en el issue con el acuerdo alcanzado.

### Paso 3 — Arbitraje grupal

- **Acción:** si la mediación falla, el asunto se lleva a todo el equipo (sin la presencia de los involucrados
  inicialmente, si es necesario, para luego unirlos a la conversación).
- **Procedimiento:** el equipo escucha a todas las partes y, por consenso, propone una solución o decisión
  final. Esta decisión debe ser respetada por todos.
- **Registro:** minuta con la decisión y su fundamento, archivada en `docs/scrum/`.

### Paso 4 — Intervención docente

- **Acción:** este es el último recurso. Solo si el equipo ha agotado los tres pasos anteriores sin éxito, se
  solicitará la intervención del docente del curso.
- **Evidencia:** el equipo deberá presentar evidencia documentada (minutas, mensajes, issues) de haber seguido
  los pasos previos.
- **La decisión del docente es final e inapelable.**

---

## 6. Sanciones por incumplimiento (consensuadas por el equipo)

Si un miembro del equipo falla repetidamente en cumplir los compromisos de este acuerdo, el equipo podrá
aplicar las siguientes sanciones, de manera progresiva y tras haber agotado las vías de diálogo.

### 6.1 Incumplimientos leves

*(Ejemplos: ausencias injustificadas a dailies, retrasos menores en la entrega de una tarea sin aviso.)*

| Ocurrencia | Sanción | Responsable |
|---|---|---|
| 1.ª falta | Llamada de atención verbal en la daily o en el chat del equipo | Scrum Master o un compañero |
| 2.ª falta | Llamada de atención por escrito (WhatsApp o email) con copia al resto del equipo | Scrum Master |
| 3.ª falla | Se incluye en el reporte de la retrospectiva del sprint | Scrum Master |

### 6.2 Incumplimientos graves

*(Ejemplos: no entregar tareas clave, ausencias a Reviews, comportamiento irrespetuoso.)*

| Ocurrencia | Sanción | Responsable |
|---|---|---|
| 1.ª falta grave | Reunión formal del equipo (Paso 3 de resolución de conflictos) para discutir el problema y definir un plan de mejora con plazos claros. **Se documentará en una minuta.** | Todo el equipo |
| Persistencia | Ver §6.3 | Todo el equipo |

### 6.3 Consecuencia por persistir

Si un miembro persiste en el incumplimiento después de la reunión formal, el equipo aplica **una** de las
siguientes sanciones, acordada por consenso:

- **Reducción proporcional del porcentaje de su contribución en la entrega evaluada**, registrada de forma
  explícita en el reporte de avance del sprint.
- **Asignación de tareas adicionales** en el siguiente sprint para compensar el déficit de avance del equipo.
- **Reporte formal al docente** para que tome las medidas académicas correspondientes, que pueden incluir la
  separación del equipo del proyecto.

> **Nota de proporcionalidad:** las sanciones aplicadas a un individuo nunca pueden degradar la calidad
> técnica del incremento entregado. Si la sanción tendría ese efecto, se aplica la alternativa menos
> restrictiva y se documenta la razón.

### 6.4 Criterio de "repetidamente"

Una falta se considera **repetida** cuando occurren dos o más incumplimientos del mismo tipo dentro de la
misma ventana de 4 semanas naturales, o cuando el incumplimiento ocurre dos veces en ceremonies de alta
importancia (Review, Retrospective o Planning).

---

## 7. Confidencialidad

- **Datos del proyecto:** toda la información, código fuente, documentación y datos generados en el marco de
  este proyecto son para uso exclusivo del mismo y del curso. No se compartirán con terceros sin el
  consentimiento de todo el equipo y del docente.
- **Dinámicas del equipo:** las discusiones internas, los conflictos y las opiniones personales expresadas
  dentro del equipo se consideran confidenciales. Se espera que todos los miembros mantengan la discreción
  para fomentar un ambiente de confianza y sinceridad.
- **Datos personales de usuarios:** los datos que manejamos (aunque sean de demostración) se tratan bajo los
  principios del proyecto: minimización, anonimización y bitácora inmutable. No se exportan datos a equipos
  personales sin autorización del responsable del módulo.
- **Repositorio y credenciales:** ninguna credencial, token o clave de entorno se comparte por chat ni se
  versiona. Los secretos viven en `.env` local y en los *secrets* del CI (ver `docs/standards/security-guidelines.md`).

---

## 8. Compromiso del equipo

Al firmar este documento, cada integrante se compromete a:

1. Cumplir la metodología Scrum y las ceremonias obligatorias.
2. Respetar la Definition of Done del equipo antes de declarar terminada cualquier historia.
3. Someter todo código a Pull Request con code review de al menos un par.
4. Mantener la documentación técnica sincronizada con el código.
5. Comunicar bloqueos con oportunidad, no con el sprint ya vencido.
6. Tratar los datos del proyecto y del equipo con confidencialidad.

---

## 9. Firmas

| # | Nombre completo | Rol | Firma | Fecha |
|---|---|---|---|---|
| 1 | Chiroy Vásquez, Luis David | Scrum Master | __________________ | ____/____/2026 |
| 2 | Lemus Meléndrez, Marcos Estuardo | Developer | __________________ | ____/____/2026 |
| 3 | Hernández González, Héctor Enrique | Developer | __________________ | ____/____/2026 |
| 4 | Hernández García, José Manuel | Developer | __________________ | ____/____/2026 |
| 5 | Par Guerra, Yermerson Geovanny | Developer | __________________ | ____/____/2026 |
| 6 | Guzmán Hernández, Hamilton Estuardo | Developer | __________________ | ____/____/2026 |

---

## 10. Referencias

- [Acta de Constitución del Equipo](01-acta-constitucion-equipo.md) — Anexo 1
- [`docs/team/roles.md`](../team/roles.md) — roles Scrum, DoD, branching y ceremonias
- [`docs/scrum/como-trabajamos.md`](../scrum/como-trabajamos.md) — proceso operativo de Scrum
- [`docs/standards/git-conventions.md`](../standards/git-conventions.md) — convenciones de Git

---

*Última actualización: 2026-10-28*
