export type FormatoPdf = 'Carta' | 'A4';

export interface PdfRenderOpciones {
  formato?: FormatoPdf;
  landscape?: boolean;
}

export interface PdfRenderer {
  render(html: string, opciones?: PdfRenderOpciones): Promise<Buffer>;
}

export const PDF_RENDERER = 'PDF_RENDERER';