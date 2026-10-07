'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { etiquetaEstado } from '@/lib/etiquetas';
import { COLORS_BRUTAL } from './paleta';

ChartJS.register(ArcElement, Tooltip, Legend);

export function GraficaDona({
  data,
}: {
  data: { estado: string; cantidad: number }[];
}) {
  const labels = data.map((d) => etiquetaEstado(d.estado));
  const valores = data.map((d) => d.cantidad);

  return (
    <div>
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: valores,
              backgroundColor: labels.map((_, i) => COLORS_BRUTAL[i % COLORS_BRUTAL.length]),
              borderColor: '#18233A',
              borderWidth: 2,
              hoverOffset: 8,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom' as const,
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                font: { family: 'monospace', size: 11, weight: 'bold' },
                color: '#18233A',
              },
            },
          },
        }}
      />
      {valores.length === 0 && <p className="pt-10 text-center font-mono text-sm text-brutal-tinta/50">Sin datos</p>}
    </div>
  );
}
