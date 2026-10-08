'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchConToken } from '@/lib/api-auth';
import { fetcher, type Convocatoria, type ListaResponse, type Solicitud } from '@/lib/api';
import { Icon, type IconName } from '@/components/ui/Icon';

interface Kpi {
  etiqueta: string;
  valor: number | string;
  acento: string;
  icono: IconName;
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-4 shadow-brutal-sm">
      <div
        className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-brutal border-[3px] border-brutal-tinta text-brutal-tinta ${kpi.acento}`}
      >
        <Icon name={kpi.icono} className="h-5 w-5" />
      </div>
      <p className="text-mega text-3xl font-black text-brutal-tinta">{kpi.valor}</p>
      <p className="brut-label mt-1 text-[10px] font-bold uppercase text-brutal-tinta/60">
        {kpi.etiqueta}
      </p>
    </div>
  );
}

export function KpisPanel() {
  const { usuario } = useAuth();
  const [kpis, setKpis] = useState<Kpi[] | null>(null);

  useEffect(() => {
    let activo = true;
    const rol = (usuario?.rol ?? '').toUpperCase();

    const cargar = async () => {
      try {
        const abiertasRes = await fetcher<ListaResponse<Convocatoria>>(
          '/convocatorias',
        );
        const abiertas = (abiertasRes.data ?? []).filter(
          (c) => c.estado === 'ABIERTA',
        ).length;

        if (rol === 'ADMIN') {
          const general = await fetchConToken<{
            solicitudes: { total: number };
            convocatorias: { total: number };
            evaluaciones: { completadas: number };
          }>('/reportes/general');
          if (!activo) return;
          setKpis([
            { etiqueta: 'Solicitudes', valor: general.solicitudes.total, acento: 'bg-brutal-cyan', icono: 'documento' },
            { etiqueta: 'Convocatorias', valor: general.convocatorias.total, acento: 'bg-brutal-gold', icono: 'becas' },
            { etiqueta: 'Evaluaciones completadas', valor: general.evaluaciones.completadas, acento: 'bg-brutal-lima', icono: 'check' },
            { etiqueta: 'Convocatorias abiertas', valor: abiertas, acento: 'bg-brutal-rosa', icono: 'estrella' },
          ]);
          return;
        }

        if (rol === 'EVALUADOR') {
          const ev = await fetchConToken<{
            total: number;
            completadas: number;
            pendientes: number;
          }>('/reportes/mis-evaluaciones');
          if (!activo) return;
          setKpis([
            { etiqueta: 'Asignadas', valor: ev.total, acento: 'bg-brutal-cyan', icono: 'estrella' },
            { etiqueta: 'Completadas', valor: ev.completadas, acento: 'bg-brutal-lima', icono: 'check' },
            { etiqueta: 'Pendientes', valor: ev.pendientes, acento: 'bg-brutal-naranja', icono: 'reloj' },
            { etiqueta: 'Convocatorias abiertas', valor: abiertas, acento: 'bg-brutal-rosa', icono: 'becas' },
          ]);
          return;
        }

        if (rol === 'COORDINADOR_COMITE') {
          const co = await fetchConToken<{
            totalComites: number;
            totalSesiones: number;
          }>('/reportes/mis-comites');
          if (!activo) return;
          setKpis([
            { etiqueta: 'Comités', valor: co.totalComites, acento: 'bg-brutal-cyan', icono: 'grupos' },
            { etiqueta: 'Sesiones', valor: co.totalSesiones, acento: 'bg-brutal-gold', icono: 'calendario' },
            { etiqueta: 'Convocatorias abiertas', valor: abiertas, acento: 'bg-brutal-rosa', icono: 'becas' },
          ]);
          return;
        }

        if (rol === 'MIEMBRO_COMITE') {
          const se = await fetchConToken<{
            totalSesiones: number;
            totalVotos: number;
          }>('/reportes/mis-sesiones');
          if (!activo) return;
          setKpis([
            { etiqueta: 'Sesiones', valor: se.totalSesiones, acento: 'bg-brutal-cyan', icono: 'calendario' },
            { etiqueta: 'Mis votos', valor: se.totalVotos, acento: 'bg-brutal-gold', icono: 'votar' },
            { etiqueta: 'Convocatorias abiertas', valor: abiertas, acento: 'bg-brutal-rosa', icono: 'becas' },
          ]);
          return;
        }

        const mis = await fetchConToken<Solicitud[]>('/solicitudes');
        const enEvaluacion = (mis ?? []).filter((s) =>
          ['ENVIADA', 'EN_EVALUACION', 'EN_REVISION', 'EVALUADA'].includes(s.estado),
        ).length;
        if (!activo) return;
        setKpis([
          { etiqueta: 'Mis solicitudes', valor: mis?.length ?? 0, acento: 'bg-brutal-cyan', icono: 'documento' },
          { etiqueta: 'En proceso', valor: enEvaluacion, acento: 'bg-brutal-gold', icono: 'reloj' },
          { etiqueta: 'Becas abiertas', valor: abiertas, acento: 'bg-brutal-lima', icono: 'becas' },
        ]);
      } catch {
        if (activo) setKpis(null);
      }
    };

    void cargar();
    return () => {
      activo = false;
    };
  }, [usuario?.rol]);

  if (!kpis) return null;

  return (
    <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.etiqueta} kpi={kpi} />
      ))}
    </div>
  );
}