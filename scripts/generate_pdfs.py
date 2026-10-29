# -*- coding: utf-8 -*-
"""Genera PDFs (subset formal) con reportlab, a partir de los MD."""
import io
import os
import re
import sys

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                               PageBreak, Preformatted, Image as RLImage, KeepTogether)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

ROOT = r"C:\dev\Sigeb-v1.1"
LOGO_UMG = os.path.join(ROOT, "Umg.png")
LOGO_EDUVI = os.path.join(ROOT, "apps", "web", "public", "icon-256.png")
IMG_DIR = os.path.join(ROOT, "docs", "manual-usuario", "img")

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=15, textColor=colors.HexColor("#1F3B73"),
                    spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold")
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=12, textColor=colors.HexColor("#1F3B73"),
                    spaceBefore=10, spaceAfter=4, fontName="Helvetica-Bold")
H3 = ParagraphStyle("H3", parent=styles["Heading3"], fontSize=10.5, textColor=colors.HexColor("#1F3B73"),
                    spaceBefore=8, spaceAfter=3, fontName="Helvetica-Bold")
BODY = ParagraphStyle("Body", parent=styles["BodyText"], fontSize=10, leading=13, alignment=TA_JUSTIFY,
                      spaceAfter=6, fontName="Helvetica")
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=14, bulletIndent=4, spaceAfter=3)
CODE = ParagraphStyle("Code", parent=styles["Code"], fontSize=8.5, leading=10.5, fontName="Courier",
                      backColor=colors.HexColor("#F2F2F2"), leftIndent=8, rightIndent=4,
                      spaceBefore=4, spaceAfter=4)
CAPTION = ParagraphStyle("Caption", parent=BODY, fontSize=8.5, leading=10, alignment=TA_CENTER,
                         textColor=colors.HexColor("#555555"), fontName="Helvetica-Oblique", spaceAfter=10)
META = ParagraphStyle("Meta", parent=BODY, fontSize=9, leading=11, spaceAfter=2)


def _esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def _rich(t):
    # bold **, italic *, code `
    t = _esc(t)
    t = re.sub(r"`([^`]+)`", r'<font name="Courier" color="#8B0000">\1</font>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", t)
    return t


def md_to_flowables(md_text, img_dir=None):
    flow = []
    lines = md_text.split("\n")
    i = 0
    in_code = False
    code_buf = []
    table_buf = []
    in_table = False

    def flush_table():
        nonlocal table_buf
        if not table_buf:
            return
        rows = [r.strip() for r in table_buf if r.strip()]
        if not rows:
            table_buf = []
            return
        header = [c.strip() for c in rows[0].strip().strip("|").split("|")]
        data_rows = []
        for r in rows[1:]:
            if re.match(r"^\|[\s\-:|]+\|$", r.strip()):
                continue
            data_rows.append([c.strip() for c in r.strip().strip("|").split("|")])
        if not data_rows:
            table_buf = []
            return
        maxcols = max([len(header)] + [len(r) for r in data_rows])
        header = (header + [""] * maxcols)[:maxcols]
        data_rows = [(r + [""] * maxcols)[:maxcols] for r in data_rows]
        # build table
        data = [[Paragraph(_rich(h), BODY) for h in header]] + \
               [[Paragraph(_rich(c), BODY) for c in row] for row in data_rows]
        colw = [ (16*cm) / maxcols ] * maxcols
        t = Table(data, colWidths=colw, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1F3B73")),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,-1), 9),
            ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#BBBBBB")),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F5F7FB")]),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING", (0,0), (-1,-1), 4),
            ("RIGHTPADDING", (0,0), (-1,-1), 4),
            ("TOPPADDING", (0,0), (-1,-1), 3),
            ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ]))
        flow.append(t)
        flow.append(Spacer(1, 6))
        table_buf = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                flow.append(Preformatted("\n".join(code_buf), CODE))
                flow.append(Spacer(1, 4))
                code_buf = []
                in_code = False
            else:
                flush_table()
                in_code = True
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue

        if stripped.startswith("|"):
            if not in_table:
                in_table = True
            table_buf.append(line)
            i += 1
            continue
        else:
            if in_table:
                flush_table()
                in_table = False

        if stripped == "":
            i += 1
            continue

        if re.match(r"^-{3,}$", stripped) or re.match(r"^\*{3,}$", stripped):
            flow.append(Spacer(1, 4))
            i += 1
            continue

        m = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            text = re.sub(r"\s+#*$", "", m.group(2).strip())
            if level == 1:
                flow.append(Paragraph(_rich(text), H1))
            elif level == 2:
                flow.append(Paragraph(_rich(text), H2))
            else:
                flow.append(Paragraph(_rich(text), H3))
            i += 1
            continue

        if stripped.startswith(">"):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote_lines.append(lines[i].strip().lstrip(">").strip())
                i += 1
            flow.append(Paragraph("<i>" + _rich(" ".join(quote_lines)) + "</i>", BODY))
            flow.append(Spacer(1, 4))
            continue

        m = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)\s*$", stripped)
        if m:
            alt, src = m.group(1), m.group(2)
            cand = src
            if not os.path.isabs(cand):
                for base in (img_dir, ROOT, os.path.join(ROOT, "docs", "entregables")):
                    if base:
                        c2 = os.path.join(base, src)
                        if os.path.exists(c2):
                            cand = c2
                            break
            if os.path.exists(cand):
                try:
                    img = RLImage(cand, width=16*cm, height=None)
                    # scale height
                    iw, ih = img.imageWidth, img.imageHeight
                    if iw and ih:
                        ratio = ih / iw
                        img.drawHeight = 16*cm * ratio
                        if img.drawHeight > 12*cm:
                            img.drawHeight = 12*cm
                            img.drawWidth = 12*cm / ratio
                    flow.append(KeepTogether([img, Paragraph(_esc(alt) if alt else "", CAPTION)]))
                except Exception as e:
                    flow.append(Paragraph("[Imagen no disponible: %s]" % _esc(src), BODY))
            else:
                flow.append(Paragraph("[Imagen: %s]" % _esc(src), BODY))
            i += 1
            continue

        m = re.match(r"^(\s*)[-*+]\s+(.*)$", line)
        if m:
            flow.append(Paragraph("• " + _rich(m.group(2).strip()), BULLET))
            i += 1
            continue

        m = re.match(r"^(\s*)\d+\.\s+(.*)$", line)
        if m:
            flow.append(Paragraph(m.group(0).strip().split(". ", 1)[0] + ". " + _rich(m.group(2).strip()), BULLET))
            i += 1
            continue

        para_lines = [stripped]
        j = i + 1
        while j < len(lines):
            nj = lines[j].strip()
            if (nj == "" or nj.startswith("#") or nj.startswith("|") or nj.startswith("```")
                    or nj.startswith(">") or nj.startswith("- ") or nj.startswith("* ")
                    or re.match(r"^\d+\.\s", nj) or re.match(r"^-{3,}$", nj)
                    or re.match(r"^!\[", nj)):
                break
            para_lines.append(nj)
            j += 1
        flow.append(Paragraph(_rich(" ".join(para_lines)), BODY))
        i = j
        continue

    if in_table:
        flush_table()
    if in_code:
        flow.append(Preformatted("\n".join(code_buf), CODE))
    return flow


def build_pdf(src_md, out_path, title, subtitle, img_dir=None, add_identity=False):
    doc = SimpleDocTemplate(out_path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    story = []
    # cover
    if os.path.exists(LOGO_UMG):
        story.append(RLImage(LOGO_UMG, width=3*cm, height=3*cm*0.8))
    story.append(Spacer(1, 6))
    story.append(Paragraph("UNIVERSIDAD MARIANO GÁLVEZ", ParagraphStyle("u", parent=BODY, alignment=TA_CENTER, fontSize=12, textColor=colors.HexColor("#555555"), fontName="Helvetica-Bold")))
    story.append(Paragraph("FACULTAD DE INGENIERÍA EN SISTEMAS DE INFORMACIÓN Y CIENCIAS DE LA COMPUTACIÓN", ParagraphStyle("f", parent=BODY, alignment=TA_CENTER, fontSize=8.5, textColor=colors.HexColor("#555555"))))
    story.append(Spacer(1, 12))
    story.append(Paragraph(title, ParagraphStyle("t", parent=BODY, alignment=TA_CENTER, fontSize=17, textColor=colors.HexColor("#1F3B73"), fontName="Helvetica-Bold", spaceAfter=4)))
    story.append(Paragraph(subtitle, ParagraphStyle("s", parent=BODY, alignment=TA_CENTER, fontSize=10.5, textColor=colors.HexColor("#555555"), fontName="Helvetica-Oblique", spaceAfter=16)))
    meta = [
        ("Proyecto", "EDUVIAGT — Sistema Integral de Gestión de Becas"),
        ("Curso", "0910-037 · Análisis de Sistemas II · 8.º Ciclo"),
        ("Catedrático / PO", "Ing. Mario Fuentes"),
        ("Equipo", "EDUVIAGT — 6 integrantes"),
        ("Versión", "1.0"),
        ("Fecha", "2026-10-29"),
    ]
    md = Table([[Paragraph("<b>%s</b>" % _esc(k), META), Paragraph(_esc(v), META)] for k, v in meta],
               colWidths=[4.5*cm, 12*cm])
    md.setStyle(TableStyle([("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#BBBBBB")),
                            ("BACKGROUND", (0,0), (0,-1), colors.HexColor("#EAEFF7")),
                            ("LEFTPADDING", (0,0), (-1,-1), 6), ("TOPPADDING", (0,0), (-1,-1), 3),
                            ("BOTTOMPADDING", (0,0), (-1,-1), 3)]))
    story.append(md)
    story.append(Spacer(1, 14))
    story.append(Paragraph("Versión 1.0 · 2026-10-29", ParagraphStyle("v", parent=BODY, alignment=TA_CENTER, fontSize=8.5, textColor=colors.HexColor("#888888"))))
    story.append(PageBreak())

    md_text = io.open(src_md, encoding="utf-8").read()
    if add_identity:
        # insert identity section at start of content
        identity = """## Quiénes somos

EDUVIAGT es la empresa consultora seleccionada por el Ministerio de Educación de Guatemala para analizar,
diseñar e implementar la Plataforma Nacional para la Gestión Integral de Becas. Somos un equipo de 6
integrantes con roles Scrum definidos, que aplica prácticas reales de ingeniería de software.

## Cómo trabajamos

- **Metodología:** Scrum con sprints de 2 semanas (9 sprints, agosto 2026 – enero 2027).
- **Ceremonias:** Sprint Planning, Daily Standup (15 min), Sprint Review, Sprint Retrospective, Backlog Refinement.
- **Roles:** Scrum Master (Chiroy Vásquez, Luis David), Product Owner simulado, Development Team (5 integrantes).
- **Definition of Done:** código + pruebas + code review + documentación + despliegue verificado en staging.
- **Control de versiones:** Git con ramas `feature/*`, integración en `develop`, producción en `master` protegida, PR obligatorio.
- **Calidad:** TDD, ESLint + Prettier, Jest + Supertest, Playwright + axe, pipeline CI de 6 jobs.
"""
        md_text = identity + "\n" + md_text

    story.extend(md_to_flowables(md_text, img_dir=img_dir))
    doc.build(story)
    print("OK:", os.path.basename(out_path))


if __name__ == "__main__":
    # Lista de (md_path, out_path, title, subtitle, img_dir, add_identity)
    jobs = []
    ENT = os.path.join(ROOT, "docs", "entregables")
    MAN = os.path.join(ROOT, "docs", "manual-usuario")
    OUTP = os.path.join(ENT, "pdf")
    OUTM = os.path.join(MAN, "pdf")
    os.makedirs(OUTP, exist_ok=True)
    os.makedirs(OUTM, exist_ok=True)

    jobs.append((os.path.join(ENT, "01-acta-constitucion-equipo.md"),
                 os.path.join(OUTP, "01-acta-constitucion-equipo.pdf"),
                 "Acta de Constitución del Equipo", "Anexo 1 del proyecto final", None, True))
    jobs.append((os.path.join(ENT, "12-guion-presentacion-final.md"),
                 os.path.join(OUTP, "12-guion-presentacion-final.pdf"),
                 "Guion de la Presentación Final", "Entregable final del curso", None, False))

    # manuales de usuario
    user_manuals = [
        ("01-postulante.md", "Manual de Usuario — Postulante", "Guía para postularse a una beca"),
        ("02-administrador.md", "Manual de Usuario — Administrador", "Gestión de convocatorias, seguridad y reportes"),
        ("03-evaluador.md", "Manual de Usuario — Evaluador", "Evaluación de solicitudes asignadas"),
        ("04-coordinador-comite.md", "Manual de Usuario — Coordinador de Comité", "Gestión de comités y sesiones"),
        ("05-miembro-comite.md", "Manual de Usuario — Miembro de Comité", "Votación en sesiones"),
        ("06-jefe-becas.md", "Manual de Usuario — Jefe de Becas", "Segunda aprobación de montos altos"),
    ]
    for fn, title, sub in user_manuals:
        jobs.append((os.path.join(MAN, fn),
                     os.path.join(OUTM, fn.replace(".md", ".pdf")),
                     title, sub, IMG_DIR, False))

    # manual tecnico
    jobs.append((os.path.join(ENT, "10-manual-tecnico.md"),
                 os.path.join(OUTM, "10-manual-tecnico.pdf"),
                 "Manual Técnico — EDUVIAGT", "Instalación, configuración y operación", IMG_DIR, True))

    for src, out, title, sub, imgdir, ident in jobs:
        build_pdf(src, out, title, sub, img_dir=imgdir, add_identity=ident)
    print("PDFs generados.")
