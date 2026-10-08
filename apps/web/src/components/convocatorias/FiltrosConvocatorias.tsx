'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import type { NivelAcademicoResumen } from '@/lib/api';

interface FiltrosConvocatoriasProps {
  becas: string[];
  niveles: NivelAcademicoResumen[];
}

const ESTADOS = [
  { valor: '', etiqueta: 'TODAS' },
  { valor: 'ABIERTA', etiqueta: 'ABIERTAS' },
  { valor: 'CERRADA', etiqueta: 'CERRADAS' },
];

const COBERTURAS = [
  { value: '', label: 'Cualquier cobertura' },
  { value: 'COMPLETA', label: 'Beca completa' },
  { value: 'PARCIAL', label: 'Beca parcial' },
];

export function FiltrosConvocatorias({ becas, niveles }: FiltrosConvocatoriasProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [busqueda, setBusqueda] = useState(searchParams.get('busqueda') ?? '');
  const [beca, setBeca] = useState(searchParams.get('beca') ?? '');
  const [nivel, setNivel] = useState(searchParams.get('nivel') ?? '');
  const [cobertura, setCobertura] = useState(searchParams.get('cobertura') ?? '');
  const [estado, setEstado] = useState(searchParams.get('estado') ?? '');

  function aplicarFiltros() {
    const params = new URLSearchParams();
    if (busqueda.trim()) params.set('busqueda', busqueda.trim());
    if (beca) params.set('beca', beca);
    if (nivel) params.set('nivel', nivel);
    if (cobertura) params.set('cobertura', cobertura);
    if (estado) params.set('estado', estado);
    const qs = params.toString();
    router.push(qs ? `/convocatorias?${qs}` : '/convocatorias');
  }

  function limpiar() {
    setBusqueda('');
    setBeca('');
    setNivel('');
    setCobertura('');
    setEstado('');
    router.push('/convocatorias');
  }

  return (
    <div className="space-y-4">
      <form
        className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-4 shadow-brutal-sm"
        onSubmit={(e) => {
          e.preventDefault();
          aplicarFiltros();
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label
              htmlFor="busqueda"
              className="mb-1 block font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta"
            >
              Buscar
            </label>
            <input
              id="busqueda"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre de convocatoria o beca..."
              className="w-full rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-3 py-2 text-sm text-brutal-tinta placeholder:text-brutal-tinta/50 focus:bg-brutal-cyan/10 focus:outline-none"
            />
          </div>

          {becas.length > 0 && (
            <div className="w-full md:w-56">
              <Select
                label="Tipo de beca"
                name="beca"
                value={beca}
                onChange={(e) => setBeca(e.target.value)}
                options={[...new Set(becas)].map((b) => ({ value: b, label: b }))}
                placeholder="Todas las becas"
              />
            </div>
          )}

          {niveles.length > 0 && (
            <div className="w-full md:w-56">
              <Select
                label="Nivel académico"
                name="nivel"
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                options={niveles.map((n) => ({ value: n.id, label: n.nombre }))}
                placeholder="Todos los niveles"
              />
            </div>
          )}

          <div className="w-full md:w-56">
            <Select
              label="Cobertura"
              name="cobertura"
              value={cobertura}
              onChange={(e) => setCobertura(e.target.value)}
              options={COBERTURAS.filter((c) => c.value !== '')}
              placeholder="Cualquier cobertura"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold px-4 py-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={limpiar}
              className="rounded-brutal border-[3px] border-brutal-tinta bg-transparent px-4 py-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta hover:bg-brutal-cyan"
            >
              Limpiar
            </button>
          </div>
        </div>
      </form>

      <div
        role="group"
        aria-label="Filtrar por estado"
        className="flex flex-wrap gap-2"
      >
        {ESTADOS.map((opcion) => {
          const activo = estado === opcion.valor;
          return (
            <button
              key={opcion.etiqueta}
              type="button"
              aria-pressed={activo}
              onClick={() => {
                setEstado(opcion.valor);
                const params = new URLSearchParams(searchParams.toString());
                if (opcion.valor) params.set('estado', opcion.valor);
                else params.delete('estado');
                const qs = params.toString();
                router.push(qs ? `/convocatorias?${qs}` : '/convocatorias');
              }}
              className={`rounded-brutal border-[3px] border-brutal-tinta px-4 py-2 font-brut text-xs font-bold uppercase tracking-wide transition-all ${
                activo
                  ? 'bg-brutal-tinta text-brutal-papel shadow-brutal-sm'
                  : 'bg-brutal-blanco text-brutal-tinta hover:bg-brutal-cyan/20'
              }`}
            >
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>
    </div>
  );
}