import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import { PdfRenderOpciones, PdfRenderer } from './pdf-renderer.interface';

@Injectable()
export class PuppeteerPdfRenderer implements PdfRenderer {
  private readonly logger = new Logger(PuppeteerPdfRenderer.name);
  private browserPromise: Promise<Browser> | null = null;

  async render(html: string, opciones: PdfRenderOpciones = {}): Promise<Buffer> {
    try {
      const browser = await this.obtenerBrowser();
      const page = await browser.newPage();

      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const pdf = await page.pdf({
        format: this.normalizarFormato(opciones.formato),
        landscape: opciones.landscape ?? false,
        margin: { top: '12mm', right: '14mm', bottom: '12mm', left: '14mm' },
        printBackground: true,
      });

      await page.close();
      return Buffer.from(pdf);
    } catch (error) {
      this.logger.error(
        `Fallo la generación de PDF: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new ServiceUnavailableException(
        'No se pudo generar el documento PDF en este momento. ' +
          'Verifique que el navegador headless esté disponible en el servidor.',
      );
    }
  }

  private obtenerBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer
        .launch({
          headless: true,
          // Necesarios en CI/Docker cuando se ejecuta como root.
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          ...(process.env.CHROME_EXECUTABLE_PATH
            ? { executablePath: process.env.CHROME_EXECUTABLE_PATH }
            : {}),
        })
        .catch((error) => {
          this.browserPromise = null;
          throw error;
        });
    }
    return this.browserPromise;
  }

  private normalizarFormato(formato?: 'Carta' | 'A4'): 'Letter' | 'A4' {
    return formato === 'A4' ? 'A4' : 'Letter';
  }
}