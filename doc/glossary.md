# Glosario — SIGEB

Términos del dominio utilizados en el proyecto.

---

## Términos generales

| Término | Definición |
|---|---|
| **SIGEB** | Sistema Integral de Gestión de Becas — nombre del proyecto |
| **MINEDUC** | Ministerio de Educación de Guatemala |
| **CUI** | Código Único de Identificación — identificador único de ciudadano guatemalteco |
| **DPI** | Documento Personal de Identificación — cédula de identidad guatemalteca |

## Becas y convocatorias

| Término | Definición |
|---|---|
| **Beca** | Programa de apoyo educativo con criterios y requisitos específicos |
| **Convocatoria** | Llamado público para postulación a una beca, con fechas y requisitos definidos |
| **Criterio de evaluación** | Parámetro con peso utilizado para puntuar una solicitud (ej. rendimiento académico) |
| **Score ponderado** | Resultado de la evaluación multiplicado por el peso de cada criterio |

## Solicitudes

| Término | Definición |
|---|---|
| **Solicitud** | Postulación formal de un estudiante a una convocatoria |
| **Postulante** | Estudiante que crea y gestiona una solicitud |
| **Perfil académico** | Nivel educativo, institución, carrera, promedio del postulante |
| **Perfil financiero** | Información socioeconómica del postulante |
| **Checklist** | Lista de documentos requeridos y su estado de carga |
| **Corrección** | Solicitud devuelta al postulante para subsanar observaciones |

## Documentos

| Término | Definición |
|---|---|
| **Tipo de documento** | Categoría de archivo requerido (certificado, constancia, etc.) |
| **Documento requerido** | Tipo de documento obligatorio para una convocatoria específica |
| **Storage** | Sistema de almacenamiento de archivos (filesystem local en esta versión) |
| **MIME type** | Tipo de archivo permitido (PDF, JPG, PNG, etc.) |

## Evaluación y comités

| Término | Definición |
|---|---|
| **Evaluador** | Persona asignada para puntuar una solicitud individual |
| **Comité** | Grupo de personas que toman la decisión final sobre solicitudes |
| **Sesión** | Reunión del comité para evaluar un grupo de solicitudes |
| **Voto** | Decisión individual de un miembro del comité sobre una solicitud |
| **Quórum** | Mínimo de miembros requeridos para validar una sesión: `floor(miembros/2) + 1` |
| **Decisión** | Resolución final de una solicitud: APROBADA o RECHAZADA |

## Seguridad

| Término | Definición |
|---|---|
| **Rol** | Conjunto de permisos asignados a un perfil de usuario (ADMIN, POSTULANTE, etc.) |
| **Permiso** | Acción permitida en un módulo específico, formato `modulo:accion` |
| **Excepción de usuario** | Permisos individuales que amplían o restringen los del rol (`PERMITIR` / `DENEGAR`) |
| **Matriz de seguridad** | Combinación de permisos por rol + excepciones por usuario |
| **AuditLog** | Registro de acciones sensibles realizadas en el sistema |

## IA

| Término | Definición |
|---|---|
| **Asistente IA** | Bot que responde preguntas usando una base de conocimiento estructurada |
| **AsistenteIAProxy** | Capa intermedia que controla qué datos puede ver el modelo de IA según el rol |
| **Base de conocimiento** | Repositorio de preguntas/respuestas indexado por texto completo (`tsvector`) |

## Técnicos

| Término | Definición |
|---|---|
| **Monolito modular** | Arquitectura de una sola aplicación dividida en módulos independientes |
| **ADR** | Architecture Decision Record — documento que registra decisiones técnicas |
| **Chain of Responsibility** | Patrón de diseño para resolver permisos en cascada |
| **State** | Patrón de diseño para máquinas de estado (transiciones válidas) |
| **Facade** | Patrón de diseño que simplifica interfaces complejas |
| **Adapter** | Patrón de diseño que desacopla la lógica de negocio de implementaciones concretas |
| **Builder** | Patrón de diseño para construir objetos complejos paso a paso |
| **Observer** | Patrón de diseño para desacoplar eventos de sus reaccionadores |
| **Singleton** | Patrón de diseño que garantiza una sola instancia de un servicio |

---

*Última actualización: 2026-08-26*
