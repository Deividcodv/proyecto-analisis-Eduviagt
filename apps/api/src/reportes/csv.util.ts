export function aCsv(filas: Record<string, unknown>[]): string {
  if (filas.length === 0) {
    return '\ufeff';
  }
  const encabezados = Object.keys(filas[0]);
  const escapar = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [
    encabezados.map(escapar).join(','),
    ...filas.map((fila) => encabezados.map((h) => escapar(fila[h])).join(',')),
  ];
  return `\ufeff${lineas.join('\n')}`;
}
