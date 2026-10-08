'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { COLORS_BRUTAL, TINTA } from './paleta';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function GraficaBarras({
  labels,
  datasets,
  horizontal = false,
}: {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
  horizontal?: boolean;
}) {
  return (
    <div>
      <Bar
        data={{
          labels,
          datasets: datasets.map((ds, i) => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: ds.color ?? COLORS_BRUTAL[i % COLORS_BRUTAL.length],
            borderColor: TINTA,
            borderWidth: 2,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: horizontal ? ('y' as const) : ('x' as const),
          plugins: {
            legend: { display: datasets.length > 1 },
          },
          scales: {
            x: {
              grid: { color: 'rgba(20,20,20,0.08)' },
              ticks: { color: TINTA, font: { family: 'monospace', size: 11, weight: 'bold' } },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(20,20,20,0.08)' },
              ticks: { color: TINTA, font: { family: 'monospace', size: 11 } },
            },
          },
        }}
      />
    </div>
  );
}
