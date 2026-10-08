'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TINTA } from './paleta';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export interface TendenciaData {
  meses: string[];
  solicitudes: number[];
  evaluaciones: number[];
}

export function GraficaTendencia({ data }: { data: TendenciaData }) {
  return (
    <div>
      <Line
        data={{
          labels: data.meses,
          datasets: [
            {
              label: 'Solicitudes',
              data: data.solicitudes,
              borderColor: '#3D8EC7',
              backgroundColor: '#3D8EC7',
              tension: 0.3,
              borderWidth: 3,
              pointRadius: 4,
              pointBackgroundColor: '#3D8EC7',
              pointBorderColor: TINTA,
              pointBorderWidth: 2,
            },
            {
              label: 'Evaluaciones',
              data: data.evaluaciones,
              borderColor: '#D4A72C',
              backgroundColor: '#D4A72C',
              tension: 0.3,
              borderWidth: 3,
              pointRadius: 4,
              pointBackgroundColor: '#D4A72C',
              pointBorderColor: TINTA,
              pointBorderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' as const },
          },
          scales: {
            x: {
              grid: { color: 'rgba(24,35,58,0.08)' },
              ticks: { color: TINTA, font: { family: 'monospace', size: 10 } },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(24,35,58,0.08)' },
              ticks: { color: TINTA, font: { family: 'monospace', size: 11 } },
            },
          },
        }}
      />
    </div>
  );
}
