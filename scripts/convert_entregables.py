# -*- coding: utf-8 -*-
"""Convierte los entregables MD a DOCX branded."""
import io
import os
import sys

sys.path.insert(0, r"C:\dev\Sigeb-v1.1\scripts")
from docx_builder import (new_doc, add_cover, add_header_footer, add_toc, md_to_docx,
                          set_logos, add_company_identity)

ROOT = r"C:\dev\Sigeb-v1.1"
ENT = os.path.join(ROOT, "docs", "entregables")
OUT = os.path.join(ENT, "docx")
os.makedirs(OUT, exist_ok=True)

set_logos(os.path.join(ROOT, "Umg.png"),
          os.path.join(ROOT, "apps", "web", "public", "icon-256.png"))

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

IDENTITY_FILES = {"01-acta-constitucion-equipo.md", "02-politica-trabajo-grupo.md", "03-documento-vision.md"}

for fname, title, subtitle in FILES:
    src = os.path.join(ENT, fname)
    if not os.path.exists(src):
        print("SKIP (no existe):", fname)
        continue
    md = io.open(src, encoding="utf-8").read()
    doc = new_doc()
    meta = [
        ("Proyecto", "EDUVIAGT — Sistema Integral de Gestión de Becas"),
        ("Curso", "0910-037 · Análisis de Sistemas II · 8.º Ciclo"),
        ("Catedrático / PO", "Ing. Mario Fuentes"),
        ("Equipo", "EDUVIAGT — 6 integrantes"),
        ("Versión", "1.0"),
        ("Fecha", "2026-10-29"),
    ]
    add_cover(doc, title, subtitle, meta, version="1.0", date="2026-10-29")
    add_header_footer(doc, title[:40])
    add_toc(doc)

    if fname in IDENTITY_FILES:
        add_company_identity(doc)

    md_to_docx(md, doc)

    out_name = fname.replace(".md", ".docx")
    out_path = os.path.join(OUT, out_name)
    doc.save(out_path)
    print("OK:", out_name)

print("Terminado. Archivos en", OUT)
