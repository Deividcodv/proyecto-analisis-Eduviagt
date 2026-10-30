# Plantilla de Minuta de Sprint Review

> **Proyecto:** EDUVIAGT — Sistema Integral de Gestión de Becas
> **Curso:** 0910-037 · Análisis de Sistemas II · 8.º Ciclo
> **Base:** Anexo 2 del documento del proyecto final
> **Uso:** copie esta plantilla en `docs/scrum/sprint-N/review.md` y complete la información de cada sprint.

> **Regla de la casa:** la Review **no es una reunión de estado**. Su objetivo es que el equipo y el
> stakeholders **vean el software funcionando** y discutan el producto. El estado del backlog se revisa en el
> refinamiento y la mejora del proceso, en la Retrospective.

---

## Información general del proyecto

| Campo | Valor |
|---|---|
| **Nombre del proyecto** | EDUVIAGT — Sistema Integral de Gestión de Becas |
| **Número de sprint** | Sprint N |
| **Fechas del sprint** | DD/MM/AAAA – DD/MM/AAAA |
| **Fecha de la reunión** | DD/MM/AAAA |
| **Hora de inicio / fin** | HH:MM – HH:MM |
| **Minuta elaborada por** | [Nombre] |

### Asistentes

| Rol | Nombre | Asistió |
|---|---|---|
| Product Owner (docente / PO simulado) | Ing. Mario Fuentes / [Nombre] | ☐ |
| Scrum Master | [Nombre] | ☐ |
| Development Team | [Nombres de los 5 integrantes] | ☐ |
| Stakeholders (invitados) | [Nombres, si aplica: profesor, otros equipos] | ☐ |

---

## 1. Objetivo del Sprint (Sprint Goal)

> **Declaración del objetivo:** frase corta y concisa que resuma el valor que se esperaba entregar.
> *(Se copia aquí el objetivo definido durante la Sprint Planning.)*

**Sprint Goal del Sprint N:**

```
[Ej. "Permitir que un postulante complete y envíe su solicitud en autoservicio, con documentos validados
y trazabilidad de cada cambio de estado."]
```

**¿Se alcanzó el objetivo?** ☐ Sí, completamente ☐ Parcialmente ☐ No

---

## 2. Revisión de los ítems del Product Backlog completados

Marcar el estado final de cada historia comprometida en la Sprint Planning.

| # | User Story / Ítem del Backlog | Puntos | Estado final | Notas y observaciones |
|---|---|---|---|---|
| 1 | Como [rol], quiero [funcionalidad] para [beneficio] | [Ej. 5] | ☐ Completado ☐ No completado | ¿Se logró al 100 %? ¿Hubo imprevistos? |
| 2 | Como [rol], quiero [funcionalidad] para [beneficio] | [Ej. 3] | ☐ Completado ☐ No completado | |
| 3 | Como [rol], quero [funcionalidad] para [beneficio] | [Ej. 8] | ☐ Completado ☐ No completado | |
| 4 | Como [rol], quiero [funcionalidad] para [beneficio] | [Ej. 2] | ☐ Completado ☐ No completado | |
| 5 | Como [rol], quiero [funcionalidad] para [beneficio] | [Ej. 5] | ☐ Completado ☐ No completado | |

**Total de puntos de historia comprometidos:** [Suma]
**Total de puntos de historia completados:** [Suma]
**Velocidad del sprint:** [Puntos completados] puntos

**Historias no completadas y motivo**

| # | Historia | Puntos | Motivo | ¿Se reprograma? |
|---|---|---|---|---|
| 1 | [ID] | [N] | [Ej. bloqueada por la API de catálogos] | ☐ Sí ☐ No |

---

## 3. Demostración del incremento del producto

Esta es la sección central: **se demuestra el software funcionando, no se habla de él**.

| Campo | Detalle |
|---|---|
| **Funcionalidades a demostrar** | [Ej. flujo de postulación completa con carga de documentos y envío validado] |
| **Responsables de la demo** | [Nombre(s) del/los estudiante(s)] |
| **Duración de la demo** | [Minutos] |

### Resumen de la demostración

| Pregunta | Respuesta |
|---|---|
| **¿Cómo se desarrolló la demostración?** | [Ej. se grabó en video y se presentó en vivo] |
| **¿Fue fluida?** | [Sí / No — descripción] |
| **¿Surgieron errores inesperados?** | [Descripción y cómo se resolvieron] |
| **¿Qué partes generaron más interés?** | [Descripción] |

---

## 4. Feedback de los stakeholders y del Product Owner

Registrar **todos** los comentarios, preguntas y sugerencias. Esta información es crucial para adaptar el
producto.

| Quién | Comentario / Sugerencia / Pregunta | Tipo |
|---|---|---|
| [Ej. Product Owner] | «El botón de *Guardar* no es muy visible. ¿Podemos hacerlo más grande y de otro color?» | 💡 Mejora |
| [Ej. Profesor] | «¿Cómo manejaron la validación de la contraseña para que sea segura?» | ❓ Pregunta |
| [Ej. Scrum Master] | «Me gustó la fluidez del registro, ¡gran trabajo!» | ✅ Positivo |
| | | |

**Tipos:** 💡 Mejora · ❓ Pregunta · ✅ Positivo · 🐛 Defecto · 📋 Requisito nuevo

---

## 5. Análisis y adaptación del Product Backlog

El Product Owner lidera la discusión sobre los siguientes pasos.

### 5.1 Nuevos ítems del Product Backlog sugeridos

- [Ej. Como usuario, quiero poder subir una foto de perfil para personalizar mi cuenta.]
- [Ej. Mejorar la visibilidad y el diseño del botón *Guardar*.]

| ID | Descripción | Tipo | Prioridad sugerida |
|---|---|---|---|
| US-N1 | [Descripción] | Épica / Mejora / Defecto | Must / Should / Could |
| US-N2 | [Descripción] | | |

### 5.2 Repriorización de ítems existentes

¿Algún ítem del backlog ha aumentado o disminuido su prioridad después de esta revisión? Mencionar los cambios
más relevantes.

> [Ej. Se decidió priorizar la mejora de la interfaz del perfil de usuario (sugerida en el feedback) por encima
> de la funcionalidad *Exportar a PDF*, que estaba planificada para el siguiente Sprint.]

| ID | Prioridad anterior | Prioridad nueva | Motivo |
|---|---|---|---|
| US-X | [Must] | [Should] | [Motivo] |

### 5.3 Discusión sobre el contexto y el mercado

¿Ha cambiado algo en el *mercado* o en los requerimientos del curso/proyecto que afecte a nuestros planes? ¿La
solución sigue siendo viable y valiosa?

> [Descripción de cambios normativos, nuevas políticas, solicitudes del cliente o integraciones previstas.]

---

## 6. Criterios de calidad verificados en este sprint

| # | Criterio | ☐ |
|---|---|---|
| 1 | Todas las historias completadas cumplen la Definition of Done completa | ☐ |
| 2 | La suite completa de pruebas está en verde | ☐ |
| 3 | El pipeline de CI terminó correctamente en `develop` | ☐ |
| 4 | Se desplegó en staging y el PO verificó el incremento | ☐ |
| 5 | No hay defectos abiertos de severidad Crítica o Alta | ☐ |
| 6 | La documentación técnica está actualizada | ☐ |
| 7 | El código fue revisado por al menos un par en cada PR | ☐ |

---

## 7. Conclusiones y próximos pasos

### Resumen general

Breve párrafo que resuma el sentimiento general: ¿Fue un sprint exitoso? ¿Se cumplió el objetivo?

> [Descripción]

### Próximas reuniones

| Ceremonia | Fecha | Hora | Lugar / enlace |
|---|---|---|---|
| Sprint Retrospective | DD/MM/AAAA | HH:MM | Google Meet |
| Próxima Sprint Planning | DD/MM/AAAA | HH:MM | Google Meet |
| Refinamiento del backlog | DD/MM/AAAA | HH:MM | Google Meet |

### Acciones acordadas

| # | Acción | Responsable | Fecha límite |
|---|---|---|---|
| 1 | [Descripción] | [Nombre] | DD/MM/AAAA |
| 2 | [Descripción] | [Nombre] | DD/MM/AAAA |

---

## 8. Firmas de asistencia

| # | Nombre | Rol | Firma |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |

---

*Minuta elaborada el DD/MM/AAAA. Versión del documento: 1.0*
