# -*- coding: utf-8 -*-
"""Convierte los manuales (tecnico + 6 de usuario) a .tex con capturas."""
import io
import os
import sys
import re

sys.path.insert(0, r"C:\dev\Sigeb-v1.1\scripts")
from md_to_tex import md_to_tex

ROOT = r"C:\dev\Sigeb-v1.1"
MAN = os.path.join(ROOT, "docs", "manual-usuario")
LTX = os.path.join(ROOT, "docs", "latex")
OUT = os.path.join(LTX, "manuales")
IMG = os.path.join(LTX, "img")
os.makedirs(OUT, exist_ok=True)

# Mapa: manual -> (titulo, subtitulo, lista de (grupo, [(imgname, desc)]))
MANUALS = [
    ("01-postulante.md", "Manual de Usuario — Postulante", "Guía completa para postularse a una beca", [
        ("Portal público", [
            ("00-portal-inicio.png", "Portada del portal público con el hero 'Oportunidades que transforman vidas'."),
            ("01-convocatorias-listado.png", "Listado de convocatorias abiertas con filtros."),
            ("01b-convocatoria-detalle.png", "Detalle de una convocatoria: información, requisitos y botón 'Postularme'."),
            ("02-consulta-estado.png", "Consulta pública del estado de una beca por código."),
        ]),
        ("Autenticación", [
            ("80-login.png", "Pantalla de inicio de sesión."),
            ("81-registro.png", "Formulario de registro de nuevo postulante."),
        ]),
        ("Área privada del postulante", [
            ("20-dashboard-postulante.png", "Dashboard del postulante con sus solicitudes."),
            ("21-mis-solicitudes.png", "Listado de 'Mis solicitudes' con estado."),
            ("22-nueva-solicitud.png", "Formulario multi-paso para crear una solicitud."),
            ("23-perfil-postulante.png", "Pantalla 'Mis datos' editable."),
        ]),
    ]),
    ("02-administrador.md", "Manual de Usuario — Administrador", "Gestión de convocatorias, seguridad y reportes", [
        ("Autenticación", [("80-login.png", "Pantalla de inicio de sesión.")]),
        ("Panel de administración", [
            ("30-admin-inicio.png", "Panel de administración con workbench de acciones."),
            ("31-admin-solicitudes.png", "Gestión de solicitudes: listado, filtros y acciones."),
            ("32-admin-convocatorias.png", "Gestión de convocatorias: crear, editar, cambiar estado."),
            ("33-reportes.png", "Reportes agregados con exportación a CSV."),
            ("34-auditoria.png", "Auditoría y bitácora del sistema."),
        ]),
    ]),
    ("03-evaluador.md", "Manual de Usuario — Evaluador", "Evaluación de solicitudes asignadas", [
        ("Autenticación", [("80-login.png", "Pantalla de inicio de sesión.")]),
        ("Evaluación", [
            ("40-evaluador-bandeja.png", "Bandeja del evaluador con solicitudes asignadas."),
            ("41-revision.png", "Revisión y puntuación por criterio."),
        ]),
    ]),
    ("04-coordinador-comite.md", "Manual de Usuario — Coordinador de Comité", "Gestión de comités y sesiones", [
        ("Autenticación", [("80-login.png", "Pantalla de inicio de sesión.")]),
        ("Comités y sesiones", [
            ("50-comite-sesiones.png", "Gestión de comités, miembros y sesiones."),
            ("51-reportes-coordinador.png", "Reportes del coordinador."),
        ]),
    ]),
    ("05-miembro-comite.md", "Manual de Usuario — Miembro de Comité", "Votación en sesiones", [
        ("Autenticación", [("80-login.png", "Pantalla de inicio de sesión.")]),
        ("Votación", [("70-miembro-comite.png", "Pantalla del miembro de comité con sesiones y votación.")]),
    ]),
    ("06-jefe-becas.md", "Manual de Usuario — Jefe de Becas", "Segunda aprobación de montos altos", [
        ("Autenticación", [("80-login.png", "Pantalla de inicio de sesión.")]),
        ("Segunda aprobación", [
            ("60-jefe-solicitudes.png", "Solicitudes pendientes de segunda aprobación."),
            ("61-jefe-inicio.png", "Panel del jefe de becas con workbench de acciones."),
        ]),
    ]),
]

for fname, title, subtitle, sections in MANUALS:
    src = os.path.join(MAN, fname)
    if not os.path.exists(src):
        print("SKIP:", fname)
        continue
    md = io.open(src, encoding="utf-8").read()
    body = md_to_tex(md, fname.replace(".md", ""), img_prefix="../img")

    # append captures section
    caps = "\n\\section{Guía visual de la plataforma}\n"
    caps += "Las siguientes capturas corresponden a la plataforma EDUVIAGT en funcionamiento.\n\n"
    for group, items in sections:
        caps += "\\subsection{%s}\n" % group
        for imgname, desc in items:
            caps += "\\begin{captura}{%s}{%s}\n" % (imgname, desc.replace("%", "\\%"))
            caps += "\\end{captura}\n\n"
    body += caps

    tex = r"""\documentclass[11pt,a4paper]{article}
\input{../preamble.tex}

\title{%s}
\author{Equipo EDUVIAGT}
\date{2026-10-29}

\begin{document}
\portada{%s}{%s}{1.0}{2026-10-29}

\tableofcontents
\clearpage

%s

\end{document}
""" % (title, title, subtitle, body)

    out_name = fname.replace(".md", ".tex")
    out_path = os.path.join(OUT, out_name)
    io.open(out_path, "w", encoding="utf-8").write(tex)
    print("OK:", out_name)

# ---------- Manual tecnico ----------
src = os.path.join(ROOT, "docs", "entregables", "10-manual-tecnico.md")
md = io.open(src, encoding="utf-8").read()
body = md_to_tex(md, "10-manual-tecnico", img_prefix="../img")

# add company identity
identity = r"""
\section{Quiénes somos}
EDUVIAGT es la empresa consultora seleccionada por el Ministerio de Educación de Guatemala para analizar,
diseñar e implementar la Plataforma Nacional para la Gestión Integral de Becas.

\subsection{Cómo trabajamos}
\begin{itemize}
  \item \textbf{Metodología:} Scrum con sprints de 2 semanas (9 sprints, agosto 2026 -- enero 2027).
  \item \textbf{Ceremonias:} Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective, Backlog Refinement.
  \item \textbf{Control de versiones:} Git con ramas \texttt{feature/*}, integración en \texttt{develop}, producción en \texttt{master} protegida.
  \item \textbf{Calidad:} TDD, ESLint + Prettier, Jest + Supertest, Playwright + axe, pipeline CI de 6 jobs.
\end{itemize}
"""
body = identity + "\n" + body

# add captures
caps = "\n\\section{Anexo visual --- Pantallas del sistema}\n"
caps += "Capturas de la plataforma en funcionamiento, organizadas por área.\n\n"
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
    caps += "\\subsection{%s}\n" % group
    for imgname, desc in items:
        caps += "\\begin{captura}{%s}{%s}\n" % (imgname, desc)
        caps += "\\end{captura}\n\n"
body += caps

tex = r"""\documentclass[11pt,a4paper]{article}
\input{../preamble.tex}

\title{Manual Técnico --- EDUVIAGT}
\author{Equipo EDUVIAGT}
\date{2026-10-29}

\begin{document}
\portada{Manual Técnico --- EDUVIAGT}{Instalación, configuración y operación}{1.0}{2026-10-29}

\tableofcontents
\clearpage

%s

\end{document}
""" % body

io.open(os.path.join(OUT, "10-manual-tecnico.tex"), "w", encoding="utf-8").write(tex)
print("OK: 10-manual-tecnico.tex")
print("Manuales .tex generados en", OUT)
