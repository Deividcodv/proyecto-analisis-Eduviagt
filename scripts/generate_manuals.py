# -*- coding: utf-8 -*-
"""Genera los manuales (tecnico + 6 de usuario) en DOCX con capturas reales."""
import io
import os
import sys

sys.path.insert(0, r"C:\dev\Sigeb-v1.1\scripts")
from docx_builder import (new_doc, add_cover, add_header_footer, add_toc, md_to_docx,
                          add_image, add_hr, add_bullet, set_logos, add_company_identity)

ROOT = r"C:\dev\Sigeb-v1.1"
MAN = os.path.join(ROOT, "docs", "manual-usuario")
OUT = os.path.join(MAN, "docx")
os.makedirs(OUT, exist_ok=True)
IMG = os.path.join(MAN, "img")
set_logos(os.path.join(ROOT, "Umg.png"),
          os.path.join(ROOT, "apps", "web", "public", "icon-256.png"))

# Mapa: manual -> (titulo, subtitulo, lista de (ruta_relativa, nombre_captura, descripcion))
MANUALS = [
    ("01-postulante.md", "Manual de Usuario — Postulante",
     "Guía completa para postularse a una beca",
     [("Portal público", [
        ("00-portal-inicio.png", "Portada del portal público con el hero 'Oportunidades que transforman vidas' y los botones de acceso."),
        ("01-convocatorias-listado.png", "Listado de convocatorias abiertas con filtros por nivel, departamento, tipo y estado."),
        ("01b-convocatoria-detalle.png", "Detalle de una convocatoria: información, requisitos, documentos requeridos y botón 'Postularme'."),
        ("02-consulta-estado.png", "Consulta pública del estado de una beca por código de solicitud."),
     ]),
      ("Autenticación", [
        ("80-login.png", "Pantalla de inicio de sesión con correo y contraseña."),
        ("81-registro.png", "Formulario de registro de nuevo postulante (CUI, nombres, correo, contraseña)."),
      ]),
      ("Área privada del postulante", [
        ("20-dashboard-postulante.png", "Dashboard del postulante con sus solicitudes y su estado."),
        ("21-mis-solicitudes.png", "Listado de 'Mis solicitudes' con el estado de cada una."),
        ("22-nueva-solicitud.png", "Formulario multi-paso para crear una nueva solicitud."),
        ("23-perfil-postulante.png", "Pantalla 'Mis datos' editable (teléfono, género, nacimiento, ubicación)."),
      ])]),
    ("02-administrador.md", "Manual de Usuario — Administrador",
     "Gestión de convocatorias, seguridad, reportes y auditoría",
     [("Autenticación", [
        ("80-login.png", "Pantalla de inicio de sesión."),
     ]),
      ("Panel de administración", [
        ("30-admin-inicio.png", "Panel de administración con el workbench de acciones por rol."),
        ("31-admin-solicitudes.png", "Gestión de solicitudes: listado, filtros y acciones."),
        ("32-admin-convocatorias.png", "Gestión de convocatorias: crear, editar, cambiar estado, configurar documentos y montos."),
        ("33-reportes.png", "Reportes agregados con exportación a CSV."),
        ("34-auditoria.png", "Auditoría y bitácora del sistema (actor, fecha, IP, resultado)."),
      ])]),
    ("03-evaluador.md", "Manual de Usuario — Evaluador",
     "Evaluación de solicitudes asignadas",
     [("Autenticación", [
        ("80-login.png", "Pantalla de inicio de sesión."),
     ]),
      ("Evaluación", [
        ("40-evaluador-bandeja.png", "Bandeja del evaluador con las solicitudes asignadas."),
        ("41-revision.png", "Pantalla de revisión y puntuación por criterio."),
      ])]),
    ("04-coordinador-comite.md", "Manual de Usuario — Coordinador de Comité",
     "Gestión de comités, sesiones y decisiones",
     [("Autenticación", [
        ("80-login.png", "Pantalla de inicio de sesión."),
     ]),
      ("Comités y sesiones", [
        ("50-comite-sesiones.png", "Gestión de comités, miembros y sesiones."),
        ("51-reportes-coordinador.png", "Reportes del coordinador."),
      ])]),
    ("05-miembro-comite.md", "Manual de Usuario — Miembro de Comité",
     "Votación en sesiones de comité",
     [("Autenticación", [
        ("80-login.png", "Pantalla de inicio de sesión."),
     ]),
      ("Votación", [
        ("70-miembro-comite.png", "Pantalla del miembro de comité con las sesiones asignadas y votación."),
      ])]),
    ("06-jefe-becas.md", "Manual de Usuario — Jefe de Becas",
     "Segunda aprobación de solicitudes de monto alto",
     [("Autenticación", [
        ("80-login.png", "Pantalla de inicio de sesión."),
     ]),
      ("Segunda aprobación", [
        ("60-jefe-solicitudes.png", "Solicitudes pendientes de segunda aprobación."),
        ("61-jefe-inicio.png", "Panel del jefe de becas con el workbench de acciones."),
      ])]),
]

for fname, title, subtitle, sections in MANUALS:
    src = os.path.join(MAN, fname)
    if not os.path.exists(src):
        print("SKIP (no existe):", fname)
        continue
    md = io.open(src, encoding="utf-8").read()
    doc = new_doc()
    meta = [
        ("Proyecto", "EDUVIAGT — Sistema Integral de Gestión de Becas"),
        ("Tipo de documento", "Manual de Usuario"),
        ("Rol destinatario", title.replace("Manual de Usuario — ", "")),
        ("Versión", "1.0"),
        ("Fecha", "2026-10-29"),
        ("Audiencia", "Usuarios finales de la plataforma"),
    ]
    add_cover(doc, title, subtitle, meta, version="1.0", date="2026-10-29")
    add_header_footer(doc, title[:40])
    add_toc(doc)

    # contenido original del manual
    md_to_docx(md, doc)

    # seccion de capturas reales
    doc.add_page_break()
    doc.add_heading("Guía visual de la plataforma", level=1)
    doc.add_paragraph("Las siguientes capturas corresponden a la plataforma EDUVIAGT en funcionamiento. "
                      "Se indican la pantalla, lo que se observa y la acción esperada del usuario.")
    for group, items in sections:
        doc.add_heading(group, level=2)
        for imgname, desc in items:
            ipath = os.path.join(IMG, imgname)
            add_image(doc, ipath, caption=desc, width=15.5)

    out_name = fname.replace(".md", ".docx")
    doc.save(os.path.join(OUT, out_name))
    print("OK:", out_name)

# ---------- Manual tecnico ----------
src = os.path.join(ROOT, "docs", "entregables", "10-manual-tecnico.md")
md = io.open(src, encoding="utf-8").read()
doc = new_doc()
meta = [
    ("Proyecto", "EDUVIAGT — Sistema Integral de Gestión de Becas"),
    ("Tipo de documento", "Manual Técnico"),
    ("Versión", "1.0"),
    ("Fecha", "2026-10-29"),
    ("Audiencia", "Desarrolladores, responsables de tecnología y operación"),
]
add_cover(doc, "Manual Técnico — EDUVIAGT",
          "Instalación, configuración, operación y extensión del sistema",
          meta, version="1.0", date="2026-10-29")
add_header_footer(doc, "Manual Técnico")
add_toc(doc)
add_company_identity(doc)
md_to_docx(md, doc)

# seccion de capturas tecnicas
doc.add_page_break()
doc.add_heading("Anexo visual — Pantallas del sistema", level=1)
doc.add_paragraph("Capturas de la plataforma en funcionamiento, organizadas por área.")
for group, items in [
    ("Portal público y autenticación", [
        ("00-portal-inicio.png", "Portada del portal público."),
        ("01-convocatorias-listado.png", "Listado de convocatorias con filtros."),
        ("01b-convocatoria-detalle.png", "Detalle de convocatoria."),
        ("80-login.png", "Pantalla de inicio de sesión."),
        ("81-registro.png", "Formulario de registro."),
    ]),
    ("Postulante", [
        ("20-dashboard-postulante.png", "Dashboard del postulante."),
        ("21-mis-solicitudes.png", "Mis solicitudes."),
        ("22-nueva-solicitud.png", "Formulario multi-paso de nueva solicitud."),
        ("23-perfil-postulante.png", "Mis datos editable."),
    ]),
    ("Administración", [
        ("30-admin-inicio.png", "Panel de administración."),
        ("31-admin-solicitudes.png", "Gestión de solicitudes."),
        ("32-admin-convocatorias.png", "Gestión de convocatorias."),
        ("33-reportes.png", "Reportes y exportación CSV."),
        ("34-auditoria.png", "Auditoría y bitácora."),
    ]),
    ("Evaluación y comités", [
        ("40-evaluador-bandeja.png", "Bandeja del evaluador."),
        ("41-revision.png", "Revisión y puntuación."),
        ("50-comite-sesiones.png", "Sesiones de comité."),
        ("70-miembro-comite.png", "Vista del miembro de comité."),
    ]),
]:
    doc.add_heading(group, level=2)
    for imgname, desc in items:
        add_image(doc, os.path.join(IMG, imgname), caption=desc, width=15.5)

doc.save(os.path.join(OUT, "10-manual-tecnico.docx"))
print("OK: 10-manual-tecnico.docx")

print("Manuales generados en", OUT)
