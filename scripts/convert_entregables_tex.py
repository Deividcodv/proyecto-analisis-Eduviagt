# -*- coding: utf-8 -*-
"""Convierte los entregables MD a archivos .tex."""
import io
import os
import sys

sys.path.insert(0, r"C:\dev\Sigeb-v1.1\scripts")
from md_to_tex import md_to_tex

ROOT = r"C:\dev\Sigeb-v1.1"
ENT = os.path.join(ROOT, "docs", "entregables")
LTX = os.path.join(ROOT, "docs", "latex")
OUT = os.path.join(LTX, "entregables")
os.makedirs(OUT, exist_ok=True)

FILES = [
    ("README.md", "Índice de Entregables", "Mapa de requisitos, trazabilidad y convenciones"),
    ("01-acta-constitucion-equipo.md", "Acta de Constitución del Equipo", "Anexo 1 del proyecto final"),
    ("02-politica-trabajo-grupo.md", "Política de Trabajo en Grupo", "Anexo 3 del proyecto final"),
    ("03-documento-vision.md", "Documento de Visión y Product Backlog Inicial", "Anexo 4 del proyecto final"),
    ("04-documento-arquitectura.md", "Documento de Arquitectura de Software", "Anexo 5 del proyecto final"),
    ("05-justificacion-arquitectura.md", "Justificación de la Arquitectura", "6 criterios del enunciado"),
    ("06-justificacion-patrones-de-diseno.md", "Justificación de Patrones de Diseño", "8 patrones con las 4 preguntas"),
    ("07-documento-diseno.md", "Documento de Diseño del Sistema", "Anexo 5 §3 del proyecto final"),
    ("08-plan-aseguramiento-calidad.md", "Plan de Aseguramiento de Calidad Ágil (QAP)", "Anexo 6 del proyecto final"),
    ("09-plan-pruebas-agil.md", "Plan de Pruebas Ágil", "Anexo 7 del proyecto final"),
    ("10-manual-tecnico.md", "Manual Técnico", "Instalación, configuración y operación"),
    ("11-plantilla-minuta-sprint-review.md", "Plantilla de Minuta de Sprint Review", "Anexo 2 del proyecto final"),
    ("12-guion-presentacion-final.md", "Guion de la Presentación Final", "Entregable final del curso"),
]

IDENTITY = {"01-acta-constitucion-equipo.md", "02-politica-trabajo-grupo.md", "03-documento-vision.md"}

IDENTITY_TEX = r"""
\section{Quiénes somos}
EDUVIAGT es la empresa consultora seleccionada por el Ministerio de Educación de Guatemala para analizar,
diseñar e implementar la Plataforma Nacional para la Gestión Integral de Becas. Somos un equipo de 6
integrantes con roles Scrum definidos, que aplica prácticas reales de ingeniería de software: SOLID,
patrones de diseño, arquitectura modular, pruebas automatizadas y control de versiones con Git.

\subsection{Cómo trabajamos}
\begin{itemize}
  \item \textbf{Metodología:} Scrum con sprints de 2 semanas (9 sprints, agosto 2026 -- enero 2027).
  \item \textbf{Ceremonias:} Sprint Planning, Daily Standup (15 min), Sprint Review, Sprint Retrospective, Backlog Refinement.
  \item \textbf{Roles:} Scrum Master (Chiroy Vásquez, Luis David), Product Owner simulado, Development Team (5 integrantes).
  \item \textbf{Definition of Done:} código + pruebas + code review + documentación + despliegue verificado en staging.
  \item \textbf{Control de versiones:} Git con ramas \texttt{feature/*}, integración en \texttt{develop}, producción en \texttt{master} protegida, PR obligatorio.
  \item \textbf{Comunicación:} WhatsApp (coordinación) + GitHub Issues/PRs (código y decisiones) + Google Meet (ceremonias).
  \item \textbf{Calidad:} TDD, ESLint + Prettier, Jest + Supertest, Playwright + axe, pipeline CI de 6 jobs, umbral de cobertura 49/40/48/49 \%.
  \item \textbf{Honestidad técnica:} lo no implementado se declara \texttt{[NO IMPLEMENTADO]} en la documentación.
\end{itemize}
"""

for fname, title, subtitle in FILES:
    src = os.path.join(ENT, fname)
    if not os.path.exists(src):
        print("SKIP:", fname)
        continue
    md = io.open(src, encoding="utf-8").read()
    body = md_to_tex(md, fname.replace(".md", ""), img_prefix="img")

    # insert identity section for key files (after first heading, i.e., before content)
    if fname in IDENTITY:
        body = IDENTITY_TEX + "\n" + body

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

print("Terminado.")
