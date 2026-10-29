/**
 * Gráficas en SVG para el PDF del reporte.
 *
 * Se generan sin librerías: el backend no tiene Chart.js y el PDF se arma
 * con HTML que Puppeteer imprime. Un SVG simple es suficiente para barras
 * y líneas, y no depende de JavaScript en el navegador.
 */

export interface DatoBarra {
  etiqueta: string;
  valor: number;
}

const PALETA = [
  '#2f6f4f',
  '#c8551f',
  '#1c2530',
  '#4a7c8c',
  '#b8860b',
  '#6b4c9a',
  '#8c3b3b',
  '#3b6b4f',
];

function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Barras horizontales con etiqueta y valor. */
export function graficaBarras(
  datos: DatoBarra[],
  opciones: { ancho?: number; alto?: number; maximo?: number } = {},
): string {
  const ancho = opciones.ancho ?? 720;
  const alto = opciones.alto ?? 260;
  const maximo =
    opciones.maximo ?? Math.max(1, ...datos.map((d) => d.valor));
  if (datos.length === 0) {
    return '<p style="font-family:monospace;font-size:12px">Sin datos</p>';
  }

  const altoBarra = Math.max(
    14,
    Math.floor((alto - 20) / Math.max(1, datos.length)) - 8,
  );
  const anchoEtiqueta = 200;
  const anchoValor = 70;

  const filas = datos
    .map((d, i) => {
      const largo = Math.max(
        2,
        Math.round(((ancho - anchoEtiqueta - anchoValor) * d.valor) / maximo),
      );
      const y = 10 + i * (altoBarra + 8);
      const color = PALETA[i % PALETA.length];
      return `
      <text x="0" y="${y + altoBarra - 3}" font-family="monospace" font-size="11" fill="#1c2530">${escapar(
        d.etiqueta.length > 30 ? `${d.etiqueta.slice(0, 29)}…` : d.etiqueta,
      )}</text>
      <rect x="${anchoEtiqueta}" y="${y}" width="${largo}" height="${altoBarra}" fill="${color}" />
      <text x="${anchoEtiqueta + largo + 6}" y="${y + altoBarra - 3}" font-family="monospace" font-size="11" fill="#1c2530">${d.valor}</text>`;
    })
    .join('');

  return `<svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg" role="img">${filas}</svg>`;
}

/** Línea de tendencia con dos series. */
export function graficaLineas(
  etiquetas: string[],
  series: { nombre: string; valores: number[] }[],
  opciones: { ancho?: number; alto?: number } = {},
): string {
  const ancho = opciones.ancho ?? 720;
  const alto = opciones.alto ?? 220;
  const margen = 30;
  if (etiquetas.length === 0) {
    return '<p style="font-family:monospace;font-size:12px">Sin datos</p>';
  }

  const maximo = Math.max(
    1,
    ...series.flatMap((s) => s.valores),
  );
  const anchoUtil = ancho - margen * 2;
  const altoUtil = alto - margen * 2;

  const puntosDe = (valores: number[]) =>
    valores
      .map((v, i) => {
        const x =
          margen +
          (etiquetas.length === 1
            ? anchoUtil / 2
            : (i * anchoUtil) / (etiquetas.length - 1));
        const y = margen + altoUtil - (v / maximo) * altoUtil;
        return `${Math.round(x)},${Math.round(y)}`;
      })
      .join(' ');

  const ejes = etiquetas
    .map((etiqueta, i) => {
      const x =
        margen +
        (etiquetas.length === 1
          ? anchoUtil / 2
          : (i * anchoUtil) / (etiquetas.length - 1));
      return `<text x="${Math.round(x)}" y="${alto - 8}" text-anchor="middle" font-family="monospace" font-size="10" fill="#1c2530">${escapar(
        etiqueta,
      )}</text>`;
    })
    .join('');

  const lineas = series
    .map((serie, i) => {
      const color = PALETA[i % PALETA.length];
      return `<polyline points="${puntosDe(serie.valores)}" fill="none" stroke="${color}" stroke-width="3" />
      <text x="${ancho - 120}" y="${20 + i * 16}" font-family="monospace" font-size="11" fill="${color}">${escapar(
        serie.nombre,
      )}</text>`;
    })
    .join('');

  return `<svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg" role="img">${ejes}${lineas}</svg>`;
}
