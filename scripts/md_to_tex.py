# -*- coding: utf-8 -*-
"""Convierte Markdown a LaTeX."""
import io
import os
import re

def md_to_tex(md_text, basename, img_prefix="img"):
    """Convierte texto Markdown a LaTeX. Retorna string."""
    lines = md_text.split("\n")
    out = []
    i = 0
    in_code = False
    code_buf = []
    in_table = False
    table_buf = []
    mermaid_counter = 0

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

        # build tabular
        colspec = "l" + "l" * (maxcols - 1) if maxcols <= 4 else "p{2.5cm}" + "p{3cm}" * (maxcols - 1)
        # use p columns for wide tables
        if maxcols >= 4:
            colspec = "p{2.2cm}" * maxcols
        out.append("\\begin{center}")
        out.append("\\small")
        out.append("\\begin{tabular}{%s}" % colspec)
        out.append("\\hline")
        hdr_cells = []
        for h in header:
            he = _tex_escape(h)
            if he.startswith("["):
                he = "{" + he + "}"
            hdr_cells.append(he)
        out.append(" & ".join(hdr_cells) + " \\\\")
        out.append("\\hline")
        for row in data_rows:
            cells = []
        for c in row:
            ce = _tex_escape(c)
            if ce.startswith("["):
                ce = "{" + ce + "}"
            cells.append(ce)
        out.append(" & ".join(cells) + " \\\\")
        out.append("\\hline")
        out.append("\\end{tabular}")
        out.append("\\end{center}")
        out.append("")
        table_buf = []

    def flush_code():
        nonlocal code_buf
        if not code_buf:
            return
        out.append("\\begin{quote}")
        out.append("\\ttfamily\\small")
        # replace box-drawing chars in code
        cleaned = []
        for cl in code_buf:
            for k, v in {"\u251c":"+","\u2514":"+","\u2502":"|","\u2500":"-","\u2510":"+","\u250c":"+","\u252c":"+","\u2534":"+","\u253c":"+","\u2524":"+","\u2518":"+","\u2508":"-","\u254c":"-"}.items():
                cl = cl.replace(k, v)
            cleaned.append(cl)
        out.append("\\begin{verbatim}")
        out.append("\n".join(cleaned))
        out.append("\\end{verbatim}")
        out.append("\\end{quote}")
        code_buf = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # code fence
        if stripped.startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                if in_table:
                    flush_table()
                    in_table = False
                lang = stripped[3:].strip().lower()
                if lang == "mermaid":
                    in_code = False  # handle separately
                    mermaid_counter += 1
                    png_name = "%s_%d.png" % (basename, mermaid_counter)
                    out.append("\\begin{figure}[htbp]")
                    out.append("  \\centering")
                    out.append("  \\includegraphics[width=0.92\\textwidth]{%s}" % png_name)
                    out.append("  \\caption{Diagrama %d}" % mermaid_counter)
                    out.append("\\end{figure}")
                    # skip until closing fence
                    i += 1
                    while i < len(lines) and not lines[i].strip().startswith("```"):
                        i += 1
                    i += 1
                    continue
                else:
                    in_code = True
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue

        # table
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

        # horizontal rule
        if re.match(r"^-{3,}$", stripped) or re.match(r"^\*{3,}$", stripped):
            out.append("\\hrulefill")
            out.append("")
            i += 1
            continue

        # heading
        m = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            text = re.sub(r"\s+#*$", "", m.group(2).strip())
            text = _tex_escape(text)
            if level == 1:
                out.append("\\section{%s}" % text)
            elif level == 2:
                out.append("\\subsection{%s}" % text)
            else:
                out.append("\\subsubsection{%s}" % text)
            out.append("")
            i += 1
            continue

        # blockquote
        if stripped.startswith(">"):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote_lines.append(lines[i].strip().lstrip(">").strip())
                i += 1
            out.append("\\begin{quote}")
            out.append("\\itshape " + _tex_rich(" ".join(quote_lines)))
            out.append("\\end{quote}")
            out.append("")
            continue

        # image
        m = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)\s*$", stripped)
        if m:
            alt, src = m.group(1), m.group(2)
            # resolve path
            cand = src
            if not os.path.isabs(cand):
                base_dir = "C:/dev/Sigeb-v1.1/docs/entregables"
                cand2 = os.path.join(base_dir, src)
                if os.path.exists(cand2):
                    cand = cand2
                else:
                    cand2 = os.path.join("C:/dev/Sigeb-v1.1", src)
                    if os.path.exists(cand2):
                        cand = cand2
            # copy image to latex/img if not there
            if os.path.exists(cand):
                imgname = os.path.basename(cand)
                dest = os.path.join("C:/dev/Sigeb-v1.1/docs/latex/img", imgname)
                if not os.path.exists(dest):
                    import shutil
                    shutil.copy(cand, dest)
                out.append("\\begin{figure}[htbp]")
                out.append("  \\centering")
                out.append("  \\includegraphics[width=0.9\\textwidth, height=0.75\\textheight, keepaspectratio]{%s}" % imgname)
                if alt:
                    out.append("  \\caption{%s}" % _tex_escape(alt))
                out.append("\\end{figure}")
            else:
                out.append("\\textit{[Imagen: %s]}" % _tex_escape(src))
            out.append("")
            i += 1
            continue

        # unordered list
        m = re.match(r"^(\s*)[-*+]\s+(.*)$", line)
        if m:
            # collect consecutive list items
            items = []
            while i < len(lines) and re.match(r"^(\s*)[-*+]\s+(.*)$", lines[i]):
                items.append(re.match(r"^(\s*)[-*+]\s+(.*)$", lines[i]).group(2).strip())
                i += 1
            out.append("\\begin{itemize}")
            for it in items:
                out.append("  \\item " + _tex_rich(it))
            out.append("\\end{itemize}")
            out.append("")
            continue

        # ordered list
        m = re.match(r"^(\s*)\d+\.\s+(.*)$", line)
        if m:
            items = []
            while i < len(lines) and re.match(r"^(\s*)\d+\.\s+(.*)$", lines[i]):
                items.append(re.match(r"^(\s*)\d+\.\s+(.*)$", lines[i]).group(2).strip())
                i += 1
            out.append("\\begin{enumerate}")
            for it in items:
                out.append("  \\item " + _tex_rich(it))
            out.append("\\end{enumerate}")
            out.append("")
            continue

        # normal paragraph (collect consecutive non-special lines)
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
        out.append(_tex_rich(" ".join(para_lines)))
        out.append("")
        i = j
        continue

    if in_table:
        flush_table()
    if in_code:
        flush_code()

    return "\n".join(out)


def _tex_escape(t):
    # replace common unicode chars with LaTeX equivalents
    replacements = {
        "\u2260": "$\\neq$",
        "\u2192": "$\\rightarrow$",
        "\u2190": "$\\leftarrow$",
        "\u2014": "---",
        "\u2013": "--",
        "\u2026": "\\ldots{}",
        "\u00b0": "$^{\\circ}$",
        "\u00d7": "$\\times$",
        "\u2264": "$\\leq$",
        "\u2265": "$\\geq$",
        "\u20ac": "\\euro{}",
        "\u00a9": "\\copyright{}",
        "\u2610": "$\\square$",
        "\u2611": "$\\blacksquare$",
        "\u2713": "$\\checkmark$",
        "\u2714": "$\\checkmark$",
        "\u2192": "$\\rightarrow$",
        "\u2022": "$\\bullet$",
        "\u2194": "$\\leftrightarrow$",
        "\u2190": "$\\leftarrow$",
        "\u2192": "$\\rightarrow$",
        "\u21d2": "$\\Rightarrow$",
        "\u2260": "$\\neq$",
        "\u2264": "$\\leq$",
        "\u2265": "$\\geq$",
        "\u00b7": "$\\cdot$",
        "\u00d7": "$\\times$",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": "``",
        "\u201d": "''",
        "\u2026": "\\ldots{}",
        "\u2014": "---",
        "\u2013": "--",
        "\u00a0": " ",
        "\u00ab": "\\guillemotleft{}",
        "\u00bb": "\\guillemotright{}",
        "\u00b4": "'",
        "\u0060": "`",
        "\u251c": "+",
        "\u2514": "+",
        "\u2502": "|",
        "\u2500": "-",
        "\u2510": "+",
        "\u250c": "+",
        "\u252c": "+",
        "\u2534": "+",
        "\u253c": "+",
        "\u2524": "+",
        "\u2518": "+",
        "\U0001f534": "[Rojo]",
        "\U0001f7e1": "[Amarillo]",
        "\U0001f7e2": "[Verde]",
        "\U00002705": "[OK]",
        "\U0000274c": "[X]",
        "\U0001f4a1": "[Idea]",
        "\U0001f4cb": "[Lista]",
        "\U0001f41b": "[Bug]",
        "\U00002753": "[Pregunta]",
    }
    # fallback: replace any remaining non-Latin1 char with a space
    result = []
    for ch in t:
        if ord(ch) > 0x00FF and ch not in replacements:
            result.append(" ")
        else:
            result.append(ch)
    t = "".join(result)
    for k, v in replacements.items():
        t = t.replace(k, v)
    # escape special LaTeX chars
    t = t.replace("\\", "\\textbackslash{}")
    for ch in ["&", "%", "$", "#", "_", "{", "}", "~", "^"]:
        t = t.replace(ch, "\\" + ch if ch not in ("~", "^") else ("\\textasciitilde{}" if ch == "~" else "\\textasciicircum{}"))
    return t


def _tex_rich(t):
    # handle bold **, italic *, code `
    # code first
    parts = re.split(r"(`[^`]+`)", t)
    result = []
    for part in parts:
        if part.startswith("`") and part.endswith("`"):
            result.append("\\texttt{" + _tex_escape(part[1:-1]) + "}")
        else:
            # bold
            chunks = re.split(r"(\*\*[^*]+\*\*)", part)
            for chunk in chunks:
                if chunk.startswith("**") and chunk.endswith("**"):
                    result.append("\\textbf{" + _tex_escape(chunk[2:-2]) + "}")
                else:
                    # italic
                    subs = re.split(r"(\*[^*]+\*)", chunk)
                    for sub in subs:
                        if sub.startswith("*") and sub.endswith("*") and len(sub) > 2:
                            result.append("\\textit{" + _tex_escape(sub[1:-1]) + "}")
                        else:
                            result.append(_tex_escape(sub))
    return "".join(result)
