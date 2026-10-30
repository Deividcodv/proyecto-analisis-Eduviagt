# -*- coding: utf-8 -*-
"""Crea las plantillas base para los manuales tecnico y de usuario."""
import io
import os
import sys

sys.path.insert(0, r"C:\dev\Sigeb-v1.1\scripts")
from docx_builder import (new_doc, add_cover, add_header_footer, add_toc, add_hr,
                          add_table, add_bullet, add_code, add_image, set_logos)

ROOT = r"C:\dev\Sigeb-v1.1"
TPL = os.path.join(ROOT, "docs", "templates")
os.makedirs(TPL, exist_ok=True)
IMG = os.path.join(ROOT, "docs", "manual-usuario", "img")
LOGO_UMG = os.path.join(ROOT, "Umg.png")
LOGO_EDUVI = os.path.join(ROOT, "apps", "web", "public", "icon-256.png")
set_logos(LOGO_UMG, LOGO_EDUVI)

# ---------- Plantilla manual tecnico ----------
doc = new_doc()
add_cover(doc, "Manual Técnico — EDUVIAGT",
          "Plantilla base para el manual técnico del sistema",
          [("Proyecto", "EDUVIAGT — Sistema Integral de Gestión de Becas"),
           ("Tipo de documento", "Manual Técnico"),
           ("Versión", "1.0"),
           ("Fecha", "2026-10-29"),
           ("Audiencia", "Desarrolladores, responsables de tecnología y operación")],
          version="1.0", date="2026-10-29")
add_header_footer(doc, "Manual Técnico")
add_toc(doc)

doc.add_heading("1. Introducción", level=1)
doc.add_paragraph("Describa el propósito del sistema, su alcance y la audiencia de este manual.")

doc.add_heading("2. Requisitos previos", level=1)
add_table(doc, ["Requisito", "Versión", "Notas"], [
    ["Node.js", "≥ 20", "Verificar con node --version"],
    ["npm", "10", "Verificar con npm --version"],
    ["Docker Desktop", "Actual", "Para PostgreSQL en desarrollo"],
    ["PowerShell", "7+", "Para npm run up"],
])
doc.add_paragraph("Agregue aquí cualquier requisito adicional (Chromium para PDF, etc.).")

doc.add_heading("3. Instalación", level=1)
doc.add_heading("3.1 Clonar e instalar dependencias", level=2)
add_code(doc, "git clone <url> EDUVIAGT-v1.1\ncd EDUVIAGT-v1.1\nnpm ci")
doc.add_heading("3.2 Configurar variables de entorno", level=2)
add_table(doc, ["Variable", "Descripción", "Ejemplo"], [
    ["DATABASE_URL", "Cadena de conexión a PostgreSQL", "postgresql://sigeb:sigeb123@localhost:5432/sigeb"],
    ["JWT_SECRET", "Secreto de firma (≥ 32 chars)", "cambiar-por-un-secreto-largo"],
    ["JWT_REFRESH_SECRET", "Secreto distinto para refresh", "cambiar-por-otro-secreto-largo"],
    ["STORAGE_PATH", "Ruta raíz de documentos", "./storage"],
    ["AI_API_KEY", "Opcional — modo LLM", "(vacío)"],
])
doc.add_heading("3.3 Migraciones y seed", level=2)
add_code(doc, "cd apps/api\nnpx prisma generate\nnpx prisma migrate deploy\nnpx prisma db seed")

doc.add_heading("4. Estructura del repositorio", level=1)
doc.add_paragraph("[Insertar árbol de directorios y descripción de cada carpeta.]")

doc.add_heading("5. Arquitectura", level=1)
doc.add_paragraph("[Insertar diagrama de componentes y descripción de los 17 módulos.]")
add_image(doc, os.path.join(IMG, "30-admin-inicio.png"), caption="Figura 1 — Panel de administración", width=15.0)

doc.add_heading("6. Patrones de diseño", level=1)
doc.add_paragraph("[Insertar tabla de patrones con archivo:línea y justificación breve.]")

doc.add_heading("7. Base de datos", level=1)
doc.add_paragraph("[Insertar esquema resumido y migraciones.]")

doc.add_heading("8. Ejecución de pruebas", level=1)
add_code(doc, "npm run test:api\ncd apps/api && npm run test:cov\ncd apps/web && npm run test:e2e")

doc.add_heading("9. Despliegue", level=1)
doc.add_paragraph("[Insertar checklist de despliegue PM2 + Docker Compose.]")

doc.add_heading("10. Troubleshooting", level=1)
add_table(doc, ["Síntoma", "Causa probable", "Solución"], [
    ["La API no arranca", "PostgreSQL detenido", "docker compose up -d postgres"],
    ["PrismaClient no encontrado", "Cliente no generado", "npx prisma generate"],
    ["Error 429 en login", "5 intentos agotados", "Esperar 15 min"],
])
doc.add_heading("11. Deuda técnica conocida", level=1)
doc.add_paragraph("[Insertar tabla de deuda técnica con riesgo y mitigación.]")

doc.add_heading("12. Referencias", level=1)
add_bullet(doc, "Documento de Arquitectura: docs/entregables/04-documento-arquitectura.md")
add_bullet(doc, "Justificación de Patrones: docs/entregables/06-justificacion-patrones-de-diseno.md")
add_bullet(doc, "Plan de Pruebas: docs/entregables/09-plan-pruebas-agil.md")

doc.save(os.path.join(TPL, "plantilla-manual-tecnico.docx"))
print("OK plantilla-manual-tecnico.docx")

# ---------- Plantilla manual de usuario ----------
doc = new_doc()
add_cover(doc, "Manual de Usuario — EDUVIAGT",
          "Plantilla base para el manual de usuario por rol",
          [("Proyecto", "EDUVIAGT — Sistema Integral de Gestión de Becas"),
           ("Tipo de documento", "Manual de Usuario"),
           ("Rol destinatario", "[Rol: Postulante / Administrador / Evaluador / ...]"),
           ("Versión", "1.0"),
           ("Fecha", "2026-10-29"),
           ("Audiencia", "Usuarios finales de la plataforma")],
          version="1.0", date="2026-10-29")
add_header_footer(doc, "Manual de Usuario")
add_toc(doc)

doc.add_heading("1. Introducción", level=1)
doc.add_paragraph("Bienvenido a EDUVIAGT. Este manual describe cómo usar la plataforma para [rol].")
doc.add_paragraph("Credenciales de demostración: correo + contraseña Admin123! (solo entorno de pruebas).")

doc.add_heading("2. Acceso a la plataforma", level=1)
add_table(doc, ["Servicio", "URL"], [
    ["Web", "http://localhost:3001"],
    ["API", "http://localhost:3000/api"],
    ["Swagger", "http://localhost:3000/api/docs"],
])
doc.add_heading("2.1 Iniciar sesión", level=2)
add_bullet(doc, "Abra la URL de la Web en su navegador.")
add_bullet(doc, "Haga clic en 'Iniciar sesión'.")
add_bullet(doc, "Ingrese su correo y contraseña.")
add_bullet(doc, "Haga clic en 'Iniciar sesión'.")
add_image(doc, os.path.join(IMG, "80-login.png"), caption="Figura 1 — Pantalla de inicio de sesión", width=14.0)

doc.add_heading("3. Pantallas principales", level=1)
doc.add_paragraph("[Insertar descripción de cada pantalla con captura.]")
add_table(doc, ["#", "Pantalla", "Qué hace", "Captura"], [
    ["1", "Dashboard", "Resumen de mis solicitudes", "[CAPTURA: dashboard]"],
    ["2", "Mis solicitudes", "Lista de solicitudes con estado", "[CAPTURA: listado]"],
])
doc.add_paragraph("Inserte aquí las capturas reales con el estilo 'Captura'.")

doc.add_heading("4. Flujos paso a paso", level=1)
doc.add_heading("4.1 [Nombre del flujo]", level=2)
add_bullet(doc, "**Paso 1:** [acción].")
add_bullet(doc, "**Paso 2:** [acción].")
add_bullet(doc, "**Resultado esperado:** [descripción].")
add_image(doc, os.path.join(IMG, "22-nueva-solicitud.png"), caption="Figura 2 — Formulario de nueva solicitud", width=14.0)

doc.add_heading("5. Mensajes de error comunes", level=1)
add_table(doc, ["Mensaje", "Causa", "Solución"], [
    ["Credenciales inválidas", "Correo o contraseña incorrectos", "Verifique sus datos"],
    ["Convocatoria no está abierta", "La convocatoria cerró", "Consulte convocatorias abiertas"],
    ["Faltan documentos obligatorios", "Checklist incompleto", "Suba los documentos faltantes"],
])

doc.add_heading("6. Preguntas frecuentes (FAQ)", level=1)
doc.add_paragraph("**P: ¿Cómo consulto el estado de mi beca sin cuenta?**")
doc.add_paragraph("R: Use la opción 'Consultar tu beca' en el portal público con su código de solicitud.")

doc.add_heading("7. Accesibilidad", level=1)
doc.add_paragraph("La plataforma cumple WCAG 2.2 AA: foco visible, skip link, navegación por teclado, "
                  "respeto a prefers-reduced-motion. Si usa lector de pantalla, la estructura de encabezados "
                  "está marcada semánticamente.")

doc.add_heading("8. Soporte", level=1)
doc.add_paragraph("Contacto: [correo de soporte]. Horario: [horario].")

doc.add_heading("9. Glosario", level=1)
add_table(doc, ["Término", "Significado"], [
    ["Convocatoria", "Publicación de una beca con sus requisitos y fechas"],
    ["Solicitud", "Postulación de un estudiante a una convocatoria"],
    ["Borrador", "Solicitud en edición, aún no enviada"],
    ["Enviada", "Solicitud entregada para revisión"],
    ["Evaluada", "Solicitud con puntaje asignado"],
    ["Aprobada", "Solicitud aprobada por el comité"],
])

doc.save(os.path.join(TPL, "plantilla-manual-usuario.docx"))
print("OK plantilla-manual-usuario.docx")
print("Plantillas en", TPL)
